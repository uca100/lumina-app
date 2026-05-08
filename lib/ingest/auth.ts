import { NextRequest } from 'next/server'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

function extractKey(request: NextRequest | Request): string | null {
  const auth = request.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export function getUserByIngestKey(request: NextRequest | Request) {
  const key = extractKey(request)
  if (!key) return null
  return db().select().from(users).where(eq(users.ingestApiKey, key)).get() ?? null
}

export function validateIngestKey(request: NextRequest | Request): boolean {
  const key = extractKey(request)
  if (!key) return false
  const user = db().select().from(users).where(eq(users.ingestApiKey, key)).get()
  if (user) return true
  // Fallback: legacy env key for backwards compat
  return !!(process.env.INGEST_API_KEY && key === process.env.INGEST_API_KEY)
}
