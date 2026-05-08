import cron from 'node-cron'
import { runSync, syncDeletions } from '../notion/sync'
import { checkEmail } from '../email/ingest'
import { db } from '../db/client'
import { reminderSchedules, items, users } from '../db/schema'
import { eq, and, inArray, or, isNull } from 'drizzle-orm'
import { sendMessage } from '../telegram/bot'
import { sendNtfy } from '../ntfy/notify'
import { weightedPick } from '../utils/weightedPick'

const NTFY_MAX_BODY = 400

type User = typeof users.$inferSelect

async function fireReminder(schedule: typeof reminderSchedules.$inferSelect, user: User | null) {
  const ntfyTopic = user?.ntfyTopic ?? process.env.NTFY_TOPIC ?? null
  const telegramChatId = user?.telegramChatId ?? schedule.chatId ?? null

  if (!ntfyTopic && !telegramChatId) return

  let pick
  if (schedule.itemId) {
    pick = db().select().from(items).where(eq(items.id, schedule.itemId)).get()
    if (!pick) return
  } else {
    const types: string[] = JSON.parse(schedule.typesFilter)
    // Include user's own items + shared items
    const visibility = user
      ? or(eq(items.userId, user.id), isNull(items.userId))
      : isNull(items.userId)
    const all = types.length
      ? db().select().from(items).where(and(visibility!, eq(items.status, 'published'), inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit')[]))).all()
      : db().select().from(items).where(and(visibility!, eq(items.status, 'published'))).all()
    if (!all.length) return
    pick = weightedPick(all)
  }

  let notifBody = pick.body
  if (notifBody.length > NTFY_MAX_BODY) {
    notifBody = notifBody.slice(0, NTFY_MAX_BODY - 1) + '…'
  }
  const text = [notifBody, ...(pick.author ? [`— ${pick.author}`] : [])].join('\n')
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/$/, '')
  const isAffirmation = pick.type === 'Affirmation'
  const clickUrl = isAffirmation ? `${baseUrl}/lumina/affirmations` : `${baseUrl}/lumina/view/${pick.id}`
  const notifTitle = isAffirmation ? "Today's Affirmations" : (pick.title ?? undefined)

  if (ntfyTopic) {
    await sendNtfy(text, notifTitle, pick.type ?? undefined, clickUrl, ntfyTopic)
  } else if (telegramChatId) {
    await sendMessage(telegramChatId, text)
  }
}

function resolveUser(schedule: typeof reminderSchedules.$inferSelect): User | null {
  if (schedule.userId) {
    return db().select().from(users).where(eq(users.id, schedule.userId)).get() ?? null
  }
  return null
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

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function scheduleSingleDailyRandom(schedule: typeof reminderSchedules.$inferSelect) {
  const user = resolveUser(schedule)
  const now = new Date()
  const today = todayStr()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const fireMinutes: number[] = JSON.parse(schedule.dailyFireMinutes)

  if (schedule.dailyFireDate === today && fireMinutes.length > 0) {
    const pastDue = fireMinutes.filter(m => m <= currentMinute)
    if (pastDue.length > 0) {
      const remaining = fireMinutes.filter(m => m > currentMinute)
      db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(remaining) }).where(eq(reminderSchedules.id, schedule.id)).run()
      await fireReminder(schedule, user).catch(err => console.error('[Lumina] Catch-up reminder error:', schedule.id, err))
    }
    return
  }

  const windowStart = Math.max(8 * 60, currentMinute + 1)
  const [minute] = randomMinutesInWindow(1, windowStart)
  if (minute === undefined) return

  db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify([minute]), dailyFireDate: today }).where(eq(reminderSchedules.id, schedule.id)).run()
  const h = Math.floor(minute / 60), m = minute % 60
  console.log(`[Lumina] Daily random scheduled: ${schedule.label || schedule.id} at ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
}

async function scheduleDailyScatter(schedule: typeof reminderSchedules.$inferSelect) {
  const now = new Date()
  const today = todayStr()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const fireMinutes: number[] = JSON.parse(schedule.dailyFireMinutes)
  if (schedule.dailyFireDate === today && fireMinutes.length > 0) return

  const windowStart = Math.max(8 * 60, currentMinute + 1)
  const count = schedule.count ?? 1
  const minutes = randomMinutesInWindow(count, windowStart)
  if (!minutes.length) return

  db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(minutes), dailyFireDate: today }).where(eq(reminderSchedules.id, schedule.id)).run()
  console.log(`[Lumina] Daily scatter scheduled: ${schedule.label || schedule.id} — ${minutes.length}× today`)
}

function scheduleDailyRandoms() {
  const randoms = db().select().from(reminderSchedules).where(and(eq(reminderSchedules.mode, 'daily_random'), eq(reminderSchedules.enabled, 1))).all()
  for (const schedule of randoms) scheduleSingleDailyRandom(schedule).catch(console.error)

  const scatters = db().select().from(reminderSchedules).where(and(eq(reminderSchedules.mode, 'daily_scatter'), eq(reminderSchedules.enabled, 1))).all()
  for (const schedule of scatters) scheduleDailyScatter(schedule).catch(console.error)
}

function initReminderJobs() {
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    const today = todayStr()
    const currentMinute = h * 60 + m

    const due = db().select().from(reminderSchedules)
      .where(and(eq(reminderSchedules.hour, h), eq(reminderSchedules.minute, m), eq(reminderSchedules.enabled, 1), eq(reminderSchedules.mode, 'fixed')))
      .all()

    for (const schedule of due) {
      try {
        await fireReminder(schedule, resolveUser(schedule))
      } catch (err) {
        console.error('[Lumina] Reminder error:', schedule.id, err)
      }
    }

    const dailies = db().select().from(reminderSchedules)
      .where(and(eq(reminderSchedules.enabled, 1), inArray(reminderSchedules.mode, ['daily_random', 'daily_scatter'])))
      .all()

    for (const schedule of dailies) {
      if (schedule.dailyFireDate !== today) continue
      const fireMinutes: number[] = JSON.parse(schedule.dailyFireMinutes)
      if (!fireMinutes.includes(currentMinute)) continue

      db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(fireMinutes.filter(mm => mm !== currentMinute)) }).where(eq(reminderSchedules.id, schedule.id)).run()

      try {
        await fireReminder(schedule, resolveUser(schedule))
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
    try { await runSync(); console.log('[Lumina] Sync complete') } catch (err) { console.error('[Lumina] Sync error:', err) }
    if (process.env.EMAIL_IMAP_USER) {
      console.log('[Lumina] Checking email...')
      try { await checkEmail(); console.log('[Lumina] Email check complete') } catch (err) { console.error('[Lumina] Email error:', err) }
    }
  })
  cron.schedule('0 3 * * *', async () => {
    console.log('[Lumina] Running deletion sync...')
    try { await syncDeletions() } catch (err) { console.error('[Lumina] Deletion sync error:', err) }
  })
  initReminderJobs()
  console.log('> Lumina scheduler started (Notion sync + email check every 15 min, reminders every minute)')
}
