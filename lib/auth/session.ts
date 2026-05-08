import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'lumina_session'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'lumina-dev-secret-change-in-production')
const EXPIRY = '7d'

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.sub ?? null
  } catch {
    return null
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}
