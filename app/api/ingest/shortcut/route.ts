import { NextResponse } from 'next/server'
import { classifyAndSave } from '@/lib/ingest/save'
import { validateIngestKey } from '@/lib/ingest/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!validateIngestKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const text = body?.body as string | undefined
  if (!text?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const result = await classifyAndSave(text.trim(), 'shortcut', {
    author: body?.author,
    title: body?.title,
  })

  return NextResponse.json({ ok: true, ...result }, { status: 201 })
}
