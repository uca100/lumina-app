import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import { getUserByIngestKey } from '@/lib/ingest/auth'
import { checkRateLimit } from '@/lib/ingest/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '')
  if (checkRateLimit(token || '__anonymous__')) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const user = getUserByIngestKey(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const text = body?.body as string | undefined
  if (!text?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const result = await classifyAndSave(text.trim(), 'shortcut', {
    author: body?.author,
    title: body?.title,
    type: body?.type,
    tags: Array.isArray(body?.tags) ? body.tags : undefined,
    userId: user.id,
  })

  const status = result.duplicate ? 200 : 201
  return NextResponse.json({ ok: true, ...result }, { status })
}
