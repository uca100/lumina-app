import { NextResponse } from 'next/server'
import { validateIngestKey } from '@/lib/ingest/auth'
import { registerWebhook } from '@/lib/telegram/bot'
import { checkRateLimit } from '@/lib/ingest/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  if (checkRateLimit(token || '__anonymous__')) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  if (!validateIngestKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await registerWebhook()
  return NextResponse.json(result)
}
