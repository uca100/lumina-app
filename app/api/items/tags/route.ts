import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { items } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rows = db().select({ tags: items.tags }).from(items).all()

  const counts: Record<string, number> = {}
  for (const row of rows) {
    const tags: string[] = JSON.parse(row.tags)
    for (const tag of tags) {
      counts[tag] = (counts[tag] ?? 0) + 1
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }))

  return NextResponse.json(sorted)
}
