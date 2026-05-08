import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE = 'lumina_session'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'lumina-dev-secret-change-in-production')

async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET)
    return true
  } catch {
    return false
  }
}

// Paths are WITHOUT basePath — NextURL.pathname in proxy includes basePath,
// but we strip it to compare against the base-stripped path for public routes.
// API routes handle their own auth (return 401/403) — proxy only guards page routes.
const PUBLIC_PATHS = [
  '/login',
  '/api/',
  '/view/',
  '/_next/',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Strip basePath (/lumina) from pathname for public-path comparison
  const basePath = '/lumina'
  const strippedPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname

  const isPublic = PUBLIC_PATHS.some(p => strippedPath.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  const valid = token ? await verifySession(token) : false

  if (!valid) {
    // Clone nextUrl to preserve correct external host/protocol.
    // Set pathname WITHOUT basePath — Next.js prepends basePath automatically.
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('from', strippedPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Matcher paths are WITHOUT the basePath prefix (/lumina is stripped by Next.js at build time)
  matcher: ['/', '/:path*'],
}
