import cron from 'node-cron'
import { runSync } from '../notion/sync'
import { checkEmail } from '../email/ingest'
import { db } from '../db/client'
import { reminderSchedules, items, syncMeta } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { sendMessage } from '../telegram/bot'

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
      ))
      .all()

    if (due.length === 0) return

    const meta = db().select().from(syncMeta).where(eq(syncMeta.key, 'telegram_chat_id')).get()
    const globalChatId = meta ? Number(meta.value) : null

    for (const schedule of due) {
      try {
        const chatId = schedule.chatId ?? globalChatId
        if (!chatId) continue

        let pick
        if (schedule.itemId) {
          pick = db().select().from(items).where(eq(items.id, schedule.itemId)).get()
          if (!pick) continue
        } else {
          const types: string[] = JSON.parse(schedule.typesFilter)
          const all = types.length
            ? db().select().from(items).where(inArray(items.type, types as ('Quote' | 'Affirmation' | 'Story' | 'Thought')[])).all()
            : db().select().from(items).all()
          if (!all.length) continue
          pick = all[Math.floor(Math.random() * all.length)]
        }
        const tags = JSON.parse(pick.tags) as string[]
        const lines = [
          ...(pick.title ? [`*${pick.title}*`] : []),
          pick.body,
          ...(pick.author ? [`— ${pick.author}`] : []),
          ...(tags.length ? [tags.map(t => `#${t}`).join(' ')] : []),
        ]
        await sendMessage(chatId, lines.join('\n'))
      } catch (err) {
        console.error('[Lumina] Reminder error:', schedule.id, err)
      }
    }
  })
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
