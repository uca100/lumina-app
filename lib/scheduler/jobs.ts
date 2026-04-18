import cron from 'node-cron'
import { runSync } from '../notion/sync'

export function initScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Lumina] Running Notion sync...')
    try {
      await runSync()
      console.log('[Lumina] Sync complete')
    } catch (err) {
      console.error('[Lumina] Sync error:', err)
    }
  })
  console.log('> Lumina scheduler started (Notion sync every 15 min)')
}
