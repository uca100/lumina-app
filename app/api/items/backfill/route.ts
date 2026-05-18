import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { classifyItem } from '@/lib/ai/claude'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// Returns true if title looks like a direct copy of the body's opening text
function titleIsBodyCopy(title: string | null, body: string): boolean {
  if (!title || title.length < 20) return false
  const t = title.replace(/^["“]/, '').trim()
  const b = body.replace(/^["“]/, '').trim()
  return b.startsWith(t)
}

export async function POST() {
  const database = db()

  const all = database.select().from(items).all()
  const candidates = all.filter(item =>
    item.tags === '[]' || titleIsBodyCopy(item.title, item.body)
  )

  let fixed = 0
  let failed = 0

  for (const item of candidates) {
    try {
      const classified = await classifyItem(item.body)
      database.update(items).set({
        type: item.type === 'Thought' ? classified.type : item.type,
        tags: item.tags === '[]' ? JSON.stringify(classified.tags) : item.tags,
        title: classified.title,
        summary: classified.summary,
        synced: 0,
        updatedAt: Date.now(),
      }).where(eq(items.id, item.id)).run()
      fixed++
    } catch (err) {
      console.error('[backfill] failed for item', item.id, err)
      failed++
    }
  }

  return NextResponse.json({ total: candidates.length, fixed, failed })
}
