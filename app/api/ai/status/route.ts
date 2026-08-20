import { NextResponse } from 'next/server'
import { getAiStatus } from '@/lib/ai/status'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'
  const status = await getAiStatus(force)
  return NextResponse.json(status)
}
