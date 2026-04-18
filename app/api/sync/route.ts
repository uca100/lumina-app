import { NextResponse } from 'next/server'
import { runSync } from '@/lib/notion/sync'

export async function POST() {
  try {
    await runSync()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sync]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
