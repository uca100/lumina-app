import cron from 'node-cron'
import { runSync, syncDeletions } from '../notion/sync'
import { checkEmail } from '../email/ingest'
import { db } from '../db/client'
import { reminderSchedules, items, syncMeta } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { sendMessage } from '../telegram/bot'
import { sendNtfy } from '../ntfy/notify'

let lastDailyRandomDate = ''

async function fireReminder(schedule: typeof reminderSchedules.$inferSelect, chatId: number | null) {
  let pick
  if (schedule.itemId) {
    pick = db().select().from(items).where(eq(items.id, schedule.itemId)).get()
    if (!pick) return
  } else {
    const types: string[] = JSON.parse(schedule.typesFilter)
    const all = types.length
      ? db().select().from(items).where(inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit')[])).all()
      : db().select().from(items).all()
    if (!all.length) return
    pick = all[Math.floor(Math.random() * all.length)]
  }

  const notifBody = pick.summary ?? pick.body
  const lines = [
    notifBody,
    ...(pick.author ? [`— ${pick.author}`] : []),
  ]
  const text = lines.join('\n')

  if (process.env.NTFY_TOPIC) {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')
    const clickUrl = pick.type === 'Affirmation'
      ? `${baseUrl}/lumina/affirmations`
      : `${baseUrl}/lumina/item/${pick.id}`
    await sendNtfy(text, pick.title ?? undefined, pick.type ?? undefined, clickUrl)
  } else if (chatId) {
    await sendMessage(chatId, text)
  }
}

function randomMinutesInWindow(count: number, windowStart: number): number[] {
  const END = 22 * 60
  const available = END - windowStart
  if (available <= 0) return []

  const segment = Math.floor(available / count)
  const result: number[] = []
  for (let i = 0; i < count; i++) {
    const base = windowStart + i * segment
    const offset = Math.floor(Math.random() * Math.max(segment, 1))
    result.push(Math.min(base + offset, END - 1))
  }
  return result
}

function scheduleFireAt(minuteOfDay: number, schedule: typeof reminderSchedules.$inferSelect, chatId: number | null) {
  const now = new Date()
  const fireAt = new Date(now)
  fireAt.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0)
  const msUntil = fireAt.getTime() - now.getTime()
  if (msUntil <= 0) return false

  setTimeout(async () => {
    try { await fireReminder(schedule, chatId) }
    catch (err) { console.error('[Lumina] Reminder fire error:', schedule.id, err) }
  }, msUntil)

  return true
}

export async function scheduleSingleDailyRandom(schedule: typeof reminderSchedules.$inferSelect) {
  const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
  const chatId = schedule.chatId ?? (meta ? Number(meta.value) : null)

  const now = new Date()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const windowStart = Math.max(8 * 60, currentMinute + 1)

  const [minute] = randomMinutesInWindow(1, windowStart)
  if (minute === undefined) return

  if (scheduleFireAt(minute, schedule, chatId)) {
    const h = Math.floor(minute / 60), m = minute % 60
    console.log(`[Lumina] Daily random scheduled: ${schedule.label || schedule.id} at ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
  }
}

async function scheduleDailyScatter(schedule: typeof reminderSchedules.$inferSelect) {
  const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
  const chatId = schedule.chatId ?? (meta ? Number(meta.value) : null)

  const now = new Date()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const windowStart = Math.max(8 * 60, currentMinute + 1)

  const count = schedule.count ?? 1
  const minutes = randomMinutesInWindow(count, windowStart)
  let scheduled = 0

  for (const minute of minutes) {
    if (scheduleFireAt(minute, schedule, chatId)) scheduled++
  }

  if (scheduled > 0) {
    console.log(`[Lumina] Daily scatter scheduled: ${schedule.label || schedule.id} — ${scheduled}× today`)
  }
}

function scheduleDailyRandoms() {
  const today = new Date().toDateString()
  if (lastDailyRandomDate === today) return
  lastDailyRandomDate = today

  const randoms = db().select().from(reminderSchedules)
    .where(and(eq(reminderSchedules.mode, 'daily_random'), eq(reminderSchedules.enabled, 1)))
    .all()

  for (const schedule of randoms) {
    scheduleSingleDailyRandom(schedule).catch(console.error)
  }

  const scatters = db().select().from(reminderSchedules)
    .where(and(eq(reminderSchedules.mode, 'daily_scatter'), eq(reminderSchedules.enabled, 1)))
    .all()

  for (const schedule of scatters) {
    scheduleDailyScatter(schedule).catch(console.error)
  }
}

function initReminderJobs() {
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()

    const due = db().select().from(reminderSchedules)
      .where(and(
        eq(reminderSchedules.hour, h),
        eq(reminderSchedules.minute, m),
        eq(reminderSchedules.enabled, 1),
        eq(reminderSchedules.mode, 'fixed'),
      ))
      .all()

    if (due.length === 0) return

    const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
    const globalChatId = meta ? Number(meta.value) : null

    for (const schedule of due) {
      try {
        const chatId = schedule.chatId ?? globalChatId
        if (!chatId && !process.env.NTFY_TOPIC) continue
        await fireReminder(schedule, chatId)
      } catch (err) {
        console.error('[Lumina] Reminder error:', schedule.id, err)
      }
    }
  })

  cron.schedule('0 0 * * *', scheduleDailyRandoms)
  scheduleDailyRandoms()
}

export function initScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Lumina] Running Notion sync...')
    try {
      await runSync()
      console.log('[Lumina] Sync complete')
    } catch (err) {
      console.error('[Lumina] Sync error:', err)
    }

    if (process.env.EMAIL_IMAP_USER) {
      console.log('[Lumina] Checking email...')
      try {
        await checkEmail()
        console.log('[Lumina] Email check complete')
      } catch (err) {
        console.error('[Lumina] Email error:', err)
      }
    }
  })

  cron.schedule('0 3 * * *', async () => {
    console.log('[Lumina] Running deletion sync...')
    try {
      await syncDeletions()
    } catch (err) {
      console.error('[Lumina] Deletion sync error:', err)
    }
  })

  initReminderJobs()
  console.log('> Lumina scheduler started (Notion sync + email check every 15 min, reminders every minute)')
}
