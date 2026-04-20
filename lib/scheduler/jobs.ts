import cron from 'node-cron'
import { runSync } from '../notion/sync'
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
      ? db().select().from(items).where(inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought')[])).all()
      : db().select().from(items).all()
    if (!all.length) return
    pick = all[Math.floor(Math.random() * all.length)]
  }

  const tags = JSON.parse(pick.tags) as string[]
  const lines = [
    ...(pick.title ? [`*${pick.title}*`] : []),
    pick.body,
    ...(pick.author ? [`— ${pick.author}`] : []),
    ...(tags.length ? [tags.map(t => `#${t}`).join(' ')] : []),
  ]
  const text = lines.join('\n')

  if (process.env.NTFY_TOPIC) {
    await sendNtfy(text, pick.title ?? undefined)
  } else if (chatId) {
    await sendMessage(chatId, text)
  }
}

function scheduleDailyRandoms() {
  const today = new Date().toDateString()
  if (lastDailyRandomDate === today) return
  lastDailyRandomDate = today

  const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
  const globalChatId = meta ? Number(meta.value) : null

  const randoms = db().select().from(reminderSchedules)
    .where(and(eq(reminderSchedules.mode, 'daily_random'), eq(reminderSchedules.enabled, 1)))
    .all()

  for (const schedule of randoms) {
    const now = new Date()
    const START = 8 * 60
    const END = 22 * 60
    const randomMinute = START + Math.floor(Math.random() * (END - START))
    const fireAt = new Date(now)
    fireAt.setHours(Math.floor(randomMinute / 60), randomMinute % 60, 0, 0)

    const msUntil = fireAt.getTime() - now.getTime()
    if (msUntil <= 0) continue

    const chatId = schedule.chatId ?? globalChatId
    setTimeout(async () => {
      try {
        await fireReminder(schedule, chatId)
      } catch (err) {
        console.error('[Lumina] Daily random reminder error:', schedule.id, err)
      }
    }, msUntil)

    console.log(`[Lumina] Daily random scheduled: ${schedule.label || schedule.id} at ${fireAt.toTimeString().slice(0, 5)}`)
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

  // schedule daily randoms at midnight + on startup
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

  initReminderJobs()
  console.log('> Lumina scheduler started (Notion sync + email check every 15 min, reminders every minute)')
}
