import { NextResponse } from 'next/server'
import { validateIngestKey } from '@/lib/ingest/auth'
import { registerWebhook } from '@/lib/telegram/bot'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!validateIngestKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await registerWebhook()
  return NextResponse.json(result)
}
