import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import { bulkSave } from '@/lib/ingest/bulk'
import { sendMessage } from '@/lib/telegram/bot'
import { db, rawDb } from '@/lib/db/client'
import { items, users } from '@/lib/db/schema'
import { eq, or, isNull, and, desc, inArray, sql } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/ingest/rateLimit'

export const dynamic = 'force-dynamic'

type User = typeof users.$inferSelect

const TYPE_MAP: Record<string, string> = {
  quote: 'Quote', affirmation: 'Affirmation', story: 'Story',
  thought: 'Thought', lesson: 'Lesson', habit: 'Habit',
}

const TYPE_EMOJI: Record<string, string> = {
  Quote: '💬', Affirmation: '⭐', Story: '📚',
  Thought: '💭', Lesson: '🎓', Habit: '🌱',
}

function visibilityFilter(userId: string | null) {
  return userId
    ? or(eq(items.userId, userId), isNull(items.userId))!
    : isNull(items.userId)
}

function formatItem(item: { title: string | null; body: string; type: string; author: string | null }): string {
  const title = item.title ? `*${item.title}*\n` : ''
  const preview = item.body.length > 220 ? item.body.slice(0, 220) + '…' : item.body
  const author = item.author ? `\n— _${item.author}_` : ''
  const emoji = TYPE_EMOJI[item.type] ?? '✦'
  return `${title}${preview}${author}\n${emoji} _${item.type}_`
}

function savedReply(result: { type: string; tags: string[]; duplicate?: boolean }): string {
  if (result.duplicate) return '↩ Already in Lumina — skipped'
  const tags = result.tags.length ? `\nTags: ${result.tags.map(t => `\`${t}\``).join(' ')}` : ''
  return `✦ Saved as *${result.type}*${tags}`
}

async function handleCommand(cmd: string, rest: string, user: User | null): Promise<string> {
  const database = db()
  const userId = user?.id ?? null
  const vis = visibilityFilter(userId)
  const published = and(vis, eq(items.status, 'published'))!

  switch (cmd) {
    case 'help':
      return [
        '*Lumina — available commands*',
        '',
        '*Save with type:*',
        '`/quote <text>` `/lesson <text>` `/thought <text>`',
        '`/story <text>` `/habit <text>` `/affirmation <text>`',
        '',
        '*Bulk import:*',
        '`/bulk <text>` — AI splits wall of text into individual items → review queue',
        '',
        '*Browse:*',
        '`/random [type]` — random item (optionally filtered)',
        '`/today` — today\'s affirmation',
        '`/last [n]` — last n items added (default 5, max 10)',
        '`/search <query>` — full-text search',
        '`/stats` — collection overview',
        '',
        'Or just send any text — AI classifies it automatically.',
      ].join('\n')

    case 'random': {
      const type = rest ? TYPE_MAP[rest.toLowerCase()] : null
      const filter = type ? and(published, eq(items.type, type as any))! : published
      const [item] = database.select().from(items).where(filter).orderBy(sql`RANDOM()`).limit(1).all()
      if (!item) return type ? `✦ No ${type} items found.` : '✦ No items yet.'
      return formatItem(item)
    }

    case 'today': {
      const seed = new Date()
      const daySeed = seed.getFullYear() * 10000 + (seed.getMonth() + 1) * 100 + seed.getDate()
      const affirmations = database.select().from(items)
        .where(and(published, eq(items.type, 'Affirmation'))!)
        .orderBy(items.createdAt)
        .all()
      if (!affirmations.length) return '✦ No affirmations yet.'
      return formatItem(affirmations[daySeed % affirmations.length])
    }

    case 'stats': {
      const all = database.select().from(items).where(published).all()
      if (!all.length) return '✦ No items yet.'
      const counts: Record<string, number> = {}
      for (const item of all) counts[item.type] = (counts[item.type] ?? 0) + 1
      const lines = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([t, n]) => `${TYPE_EMOJI[t] ?? '•'} ${t}: ${n}`)
      return `*Your collection* — ${all.length} items\n\n${lines.join('\n')}`
    }

    case 'last': {
      const n = Math.min(parseInt(rest) || 5, 10)
      const recent = database.select().from(items).where(vis).orderBy(desc(items.createdAt)).limit(n).all()
      if (!recent.length) return '✦ No items yet.'
      return recent.map((item, i) => {
        const label = item.title ?? item.body.slice(0, 60).replace(/\n/g, ' ')
        return `${i + 1}. ${TYPE_EMOJI[item.type] ?? '•'} *${label}* _${item.type}_`
      }).join('\n')
    }

    case 'search': {
      if (!rest) return '⚠️ Usage: `/search <query>`'
      try {
        const ftsQuery = rest.trim().split(/\s+/).map(w => `"${w.replace(/"/g, '')}"`).join(' ')
        const matched = rawDb()
          .prepare('SELECT id FROM items_fts WHERE items_fts MATCH ? ORDER BY rank LIMIT 5')
          .all(ftsQuery) as { id: string }[]
        if (!matched.length) return `✦ No results for "${rest}".`
        const results = database.select().from(items)
          .where(and(vis, inArray(items.id, matched.map(r => r.id)))!)
          .all()
        if (!results.length) return `✦ No results for "${rest}".`
        return results.map((item, i) => {
          const label = item.title ?? item.body.slice(0, 60).replace(/\n/g, ' ')
          return `${i + 1}. ${TYPE_EMOJI[item.type] ?? '•'} *${label}*`
        }).join('\n')
      } catch {
        return '⚠️ Search failed. Try a simpler query.'
      }
    }

    default: {
      const type = TYPE_MAP[cmd]
      if (type) {
        if (!rest) return `⚠️ Usage: \`/${cmd} <text to save>\``
        const result = await classifyAndSave(rest, 'telegram', { type, userId: user?.id })
        return savedReply(result)
      }
      return `Unknown command \`/${cmd}\`. Send /help for available commands.`
    }
  }
}

export async function POST(request: Request) {
  const token = request.headers.get('x-telegram-bot-api-secret-token') ?? '__telegram__'
  if (checkRateLimit(token)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const message = body?.message
  const text = message?.text as string | undefined
  const chatId = message?.chat?.id as number | undefined

  if (!text || !chatId) return NextResponse.json({ ok: true })

  // Look up user by telegram chat ID
  let user = db().select().from(users).where(eq(users.telegramChatId, chatId)).get() ?? null

  // Auto-assign chat ID to the first unassigned user (backwards compat)
  if (!user) {
    const all = db().select().from(users).all()
    const unassigned = all.find(u => !u.telegramChatId)
    if (unassigned) {
      db().update(users).set({ telegramChatId: chatId }).where(eq(users.id, unassigned.id)).run()
      user = { ...unassigned, telegramChatId: chatId }
    }
  }

  if (text.startsWith('/')) {
    const parts = text.slice(1).split(/\s+/)
    const cmd = parts[0].toLowerCase()
    // For bulk: preserve newlines so table/structured text isn't collapsed
    const rest = cmd === 'bulk'
      ? text.slice(1 + cmd.length).trim()
      : parts.slice(1).join(' ').trim()

    if (cmd === 'bulk') {
      if (!rest) {
        await sendMessage(chatId, '⚠️ Usage: `/bulk <text with multiple items>`')
      } else {
        await sendMessage(chatId, '⏳ Analyzing your text...')
        const result = await bulkSave(rest, 'telegram', user?.id)
        const parts: string[] = ['✦ Bulk import complete']
        if (result.saved) parts.push(`${result.saved} saved`)
        if (result.duplicates) parts.push(`${result.duplicates} already existed`)
        if (result.failed) parts.push(`${result.failed} failed`)
        parts.push('→ review queue')
        await sendMessage(chatId, parts.join(' · '))
      }
      return NextResponse.json({ ok: true })
    }

    const reply = await handleCommand(cmd, rest, user)
    await sendMessage(chatId, reply)
    return NextResponse.json({ ok: true })
  }

  try {
    const result = await classifyAndSave(text, 'telegram', { userId: user?.id })
    await sendMessage(chatId, savedReply(result))
  } catch {
    await sendMessage(chatId, '⚠️ Could not save. Try again.')
  }

  return NextResponse.json({ ok: true })
}
