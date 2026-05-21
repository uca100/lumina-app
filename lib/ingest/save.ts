import { db } from '../db/client'
import { items } from '../db/schema'
import { classifyItem } from '../ai/claude'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

export type Source = 'manual' | 'whatsapp' | 'email' | 'voice' | 'telegram' | 'shortcut'

const VALID_TYPES = new Set(['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit'])

export async function classifyAndSave(
  body: string,
  source: Source,
  meta?: { author?: string; title?: string; type?: string; tags?: string[]; userId?: string }
) {
  const normalizedBody = body.trim()
  const existing = db().select().from(items).where(eq(items.body, normalizedBody)).get()
  if (existing) return { id: existing.id, type: existing.type, tags: JSON.parse(existing.tags), title: existing.title, duplicate: true }

  const now = Date.now()
  const id = nanoid()

  const presetType = meta?.type && VALID_TYPES.has(meta.type)
    ? meta.type as 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit'
    : null

  let type: 'Quote' | 'Affirmation' | 'Story' | 'Thought' | 'Lesson' | 'Habit'
  let author: string | null
  let tags: string[]
  let title: string | null
  let summary: string | null
  let aiFailed = false

  try {
    const classified = await classifyItem(body)
    type = presetType ?? classified.type
    author = meta?.author ?? classified.author
    tags = [...new Set([...(meta?.tags ?? []), ...classified.tags])]
    title = meta?.title ?? classified.title
    summary = classified.summary
  } catch (err) {
    console.error('[classifyAndSave] AI classification failed:', err)
    aiFailed = true
    type = presetType ?? 'Thought'
    author = meta?.author ?? null
    tags = meta?.tags ?? []
    title = meta?.title ?? null
    summary = null
  }

  // AI failure always routes to review queue regardless of source
  const status = aiFailed ? 'review' : (source === 'manual' ? 'draft' : 'review')

  db().insert(items).values({
    id, title, body: normalizedBody, type, source, author, summary,
    tags: JSON.stringify(tags),
    status,
    userId: meta?.userId ?? null,
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }).run()

  return { id, type, tags, title }
}

export function savePreclassified(
  item: { body: string; type: string; title: string; author: string | null; tags: string[]; summary: string },
  source: Source,
  userId?: string
): { id: string; duplicate: boolean } {
  const normalizedBody = item.body.trim()
  const existing = db().select().from(items).where(eq(items.id, normalizedBody)).get()
    ?? db().select().from(items).where(eq(items.body, normalizedBody)).get()
  if (existing) return { id: existing.id, duplicate: true }

  const id = nanoid()
  const now = Date.now()
  db().insert(items).values({
    id,
    title: item.title,
    body: normalizedBody,
    type: item.type as any,
    source,
    author: item.author,
    summary: item.summary,
    tags: JSON.stringify(item.tags),
    status: 'review',
    userId: userId ?? null,
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }).run()
  return { id, duplicate: false }
}
