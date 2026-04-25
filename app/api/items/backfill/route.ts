import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'
import { classifyItem } from '@/lib/ai/claude'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST() {
  const database = db()
  const untagged = database.select().from(items).where(eq(items.tags, '[]')).all()

  let fixed = 0
  let failed = 0

  for (const item of untagged) {
    try {
      const classified = await classifyItem(item.body)
      database.update(items).set({
        type: item.type === 'Thought' ? classified.type : item.type,
        tags: JSON.stringify(classified.tags),
        title: item.title ?? classified.title,
        summary: classified.summary,
        synced: 0,
        updatedAt: Date.now(),
      }).where(eq(items.id, item.id)).run()
      fixed++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ total: untagged.length, fixed, failed })
}
