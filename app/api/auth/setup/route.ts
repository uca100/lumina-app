import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { hashPassword } from '@/lib/auth/hash'
import { signToken, setSessionCookie } from '@/lib/auth/session'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const existing = db().select().from(users).all()
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 403 })
  }

  const body = await req.json()
  const { username, email, password } = body
  if (!username || !email || !password) {
    return NextResponse.json({ error: 'username, email, password required' }, { status: 400 })
  }

  const id = nanoid()
  const passwordHash = await hashPassword(password)
  const ingestApiKey = nanoid(32)
  const now = Date.now()

  db().insert(users).values({ id, username, email, passwordHash, ingestApiKey, createdAt: now }).run()

  const token = await signToken(id)
  const res = NextResponse.json({ id, username, email, ingestApiKey })
  setSessionCookie(res, token)
  return res
}
