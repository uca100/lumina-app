import { db } from '../db/client'
import { items } from '../db/schema'
import { classifyItem } from '../ai/claude'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

type Source = 'manual' | 'whatsapp' | 'email' | 'voice' | 'telegram' | 'shortcut'

const VALID_TYPES = new Set(['Quote', 'Affirmation', 'Story', 'Thought', 'Lesson', 'Habit'])

export async function classifyAndSave(
  body: string,
  source: Source,
  meta?: { author?: string; title?: string; type?: string; tags?: string[] }
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

  if (presetType) {
    type = presetType
    author = meta?.author ?? null
    tags = meta?.tags ?? []
    title = meta?.title ?? null
  } else {
    const classified = await classifyItem(body)
    type = classified.type
    author = meta?.author ?? classified.author
    tags = [...new Set([...(meta?.tags ?? []), ...classified.tags])]
    title = meta?.title ?? classified.title
  }

  db().insert(items).values({
    id, title, body: normalizedBody, type, source, author,
    tags: JSON.stringify(tags),
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }).run()

  return { id, type, tags, title }
}
