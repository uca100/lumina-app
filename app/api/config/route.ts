import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    ingestKey: process.env.INGEST_API_KEY ?? '',
    emailEnabled: !!(process.env.EMAIL_IMAP_USER && process.env.EMAIL_IMAP_PASS),
    emailUser: process.env.EMAIL_IMAP_USER ?? '',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://myweb.tail075174.ts.net',
    ntfyTopic: process.env.NTFY_TOPIC ?? '',
  })
}
