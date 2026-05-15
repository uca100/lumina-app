import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signToken, setSessionCookie } from '@/lib/auth/session'

// Called by proxy.ts when auth-gateway has already authenticated the user
// (X-Auth-User header set by nginx) but Lumina has no session cookie yet.
export async function GET(req: NextRequest) {
  const username = req.headers.get('x-auth-user') ?? ''
  const rawFrom  = req.nextUrl.searchParams.get('from') ?? '/'
  const safeFrom = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/'

  const dest = req.nextUrl.clone()
  dest.pathname = `/lumina${safeFrom === '/' ? '' : safeFrom}`
  dest.search = ''

  if (!username) return NextResponse.redirect(dest)

  const user = db().select().from(users).where(eq(users.username, username)).get()
  if (!user) return NextResponse.redirect(dest)

  const token = await signToken(user.id)
  const res = NextResponse.redirect(dest)
  setSessionCookie(res, token)
  return res
}
