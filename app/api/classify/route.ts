import { NextRequest, NextResponse } from 'next/server'
import { classifyItem } from '@/lib/ai/claude'

export async function POST(req: NextRequest) {
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  try {
    const result = await classifyItem(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[classify]', err)
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
}
