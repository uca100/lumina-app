import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSessionUserId } from '@/lib/auth/session'

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = db().select().from(users).where(eq(users.id, userId)).get()
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    ntfyTopic: user.ntfyTopic,
    telegramChatId: user.telegramChatId,
    ingestApiKey: user.ingestApiKey,
  })
}
