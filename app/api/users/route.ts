import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/hash'
import { getUserIdFromRequest } from '@/lib/auth/session'
import { nanoid } from 'nanoid'

export async function GET(req: NextRequest) {
  const callerId = await getUserIdFromRequest(req)
  if (!callerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = db().select({
    id: users.id,
    username: users.username,
    email: users.email,
    ntfyTopic: users.ntfyTopic,
    telegramChatId: users.telegramChatId,
    ingestApiKey: users.ingestApiKey,
    createdAt: users.createdAt,
  }).from(users).all()

  return NextResponse.json({ users: all })
}

export async function POST(req: NextRequest) {
  const callerId = await getUserIdFromRequest(req)
  if (!callerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { username, email, password } = body
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'username, email, password required' }, { status: 400 })
  }

  const id = nanoid()
  const passwordHash = await hashPassword(password)
  const ingestApiKey = nanoid(32)
  const now = Date.now()

  try {
    db().insert(users).values({ id, username, email, passwordHash, ingestApiKey, createdAt: now }).run()
  } catch {
    return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 })
  }

  return NextResponse.json({ id, username, email, ingestApiKey }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const callerId = await getUserIdFromRequest(req)
  if (!callerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.ntfyTopic !== undefined) updates.ntfyTopic = body.ntfyTopic || null
  if (body.telegramChatId !== undefined) updates.telegramChatId = body.telegramChatId || null
  if (body.password) updates.passwordHash = await hashPassword(body.password)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  db().update(users).set(updates).where(eq(users.id, callerId)).run()
  const updated = db().select().from(users).where(eq(users.id, callerId)).get()!
  return NextResponse.json({ id: updated.id, username: updated.username, email: updated.email, ntfyTopic: updated.ntfyTopic, telegramChatId: updated.telegramChatId })
}
