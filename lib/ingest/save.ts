import { db } from '../db/client'
import { items } from '../db/schema'
import { classifyItem } from '../ai/claude'
import { nanoid } from 'nanoid'

type Source = 'manual' | 'whatsapp' | 'email' | 'voice' | 'telegram' | 'shortcut'

export async function classifyAndSave(body: string, source: Source, meta?: { author?: string; title?: string }) {
  const classified = await classifyItem(body)
  const now = Date.now()
  const id = nanoid()

  const database = db()
  database.insert(items).values({
    id,
    title: meta?.title ?? classified.title,
    body,
    type: classified.type,
    source,
    author: meta?.author ?? classified.author,
    tags: JSON.stringify(classified.tags),
    synced: 0,
    createdAt: now,
    updatedAt: now,
  }).run()

  return { id, type: classified.type, tags: classified.tags, title: classified.title }
}
