import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function getTelegramBotUsername(): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await res.json()
    return data.ok ? (data.result.username as string) : null
  } catch {
    return null
  }
}

export async function GET() {
  const telegramBotUsername = await getTelegramBotUsername()
  return NextResponse.json({
    ingestKey: process.env.INGEST_API_KEY ?? '',
    emailEnabled: !!(process.env.EMAIL_IMAP_USER && process.env.EMAIL_IMAP_PASS),
    emailUser: process.env.EMAIL_IMAP_USER ?? '',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://myweb.tail075174.ts.net',
    ntfyTopic: process.env.NTFY_TOPIC ?? '',
    telegramBotUsername,
  })
}
