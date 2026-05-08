import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/hash'
import { signToken, setSessionCookie } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 })
  }

  const user = db().select().from(users).where(eq(users.username, username)).get()
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken(user.id)
  const res = NextResponse.json({ id: user.id, username: user.username, email: user.email })
  setSessionCookie(res, token)
  return res
}
