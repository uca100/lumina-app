import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Meta webhook verification handshake
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  // Validate HMAC signature
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? ''
  const sig = request.headers.get('x-hub-signature-256') ?? ''
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  if (appSecret && sig !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const entry = body?.entry?.[0]?.changes?.[0]?.value
  const messages = entry?.messages as { type: string; text?: { body: string } }[] | undefined

  for (const msg of messages ?? []) {
    if (msg.type !== 'text' || !msg.text?.body) continue
    await classifyAndSave(msg.text.body, 'whatsapp')
  }

  return NextResponse.json({ ok: true })
}
