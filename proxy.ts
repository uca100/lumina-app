import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/session'

const PUBLIC_PATHS = [
  '/lumina/login',
  '/lumina/api/auth/login',
  '/lumina/api/auth/setup',
  '/lumina/api/ingest/',
  '/lumina/view/',
  '/lumina/_next/',
  '/_next/',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get('lumina_session')?.value
  const userId = token ? await verifyToken(token) : null

  if (!userId) {
    const loginUrl = new URL('/lumina/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/lumina/:path*'],
}
