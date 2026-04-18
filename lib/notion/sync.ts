import { Client } from '@notionhq/client'
import { db } from '../db/client'
import { items, syncMeta } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DB_ID = process.env.NOTION_DATABASE_ID ?? ''
const NOTION_API_KEY = process.env.NOTION_API_KEY ?? ''

async function queryDatabase(filter?: object): Promise<{ results: unknown[] }> {
  const body: Record<string, unknown> = {}
  if (filter) body.filter = filter
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<{ results: unknown[] }>
}

function getSyncMeta(key: string): string | null {
  const database = db()
  const row = database.select().from(syncMeta).where(eq(syncMeta.key, key)).get()
  return row?.value ?? null
}

function setSyncMeta(key: string, value: string) {
  const database = db()
  const now = Date.now()
  const existing = database.select().from(syncMeta).where(eq(syncMeta.key, key)).get()
  if (existing) {
    database.update(syncMeta).set({ value, updatedAt: now }).where(eq(syncMeta.key, key)).run()
  } else {
    database.insert(syncMeta).values({ id: nanoid(), key, value, updatedAt: now }).run()
  }
}

export async function pushToNotion() {
  if (!DB_ID) return

  const database = db()
  const pending = database.select().from(items).where(eq(items.synced, 0)).all()

  for (const item of pending) {
    const tags = JSON.parse(item.tags) as string[]
    const props: Record<string, unknown> = {
      Title: { title: [{ text: { content: item.title ?? item.body.slice(0, 80) } }] },
      Type: { select: { name: item.type } },
      Source: { select: { name: item.source } },
      Body: { rich_text: [{ text: { content: item.body.slice(0, 2000) } }] },
      Tags: { multi_select: tags.map((t) => ({ name: t })) },
      Date: { date: { start: new Date(item.createdAt).toISOString().split('T')[0] } },
      Synced: { checkbox: true },
    }
    if (item.author) props.Author = { rich_text: [{ text: { content: item.author } }] }

    if (item.notionId) {
      await notion.pages.update({ page_id: item.notionId, properties: props as Parameters<typeof notion.pages.update>[0]['properties'] })
    } else {
      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: props as Parameters<typeof notion.pages.create>[0]['properties'],
      })
      database.update(items)
        .set({ notionId: page.id, synced: 1, updatedAt: Date.now() })
        .where(eq(items.id, item.id))
        .run()
      continue
    }

    database.update(items).set({ synced: 1, updatedAt: Date.now() }).where(eq(items.id, item.id)).run()
  }
}

export async function pullFromNotion() {
  if (!DB_ID) return

  const lastSync = getSyncMeta('lastPull')
  const database = db()

  const response = await queryDatabase(
    lastSync ? { timestamp: 'last_edited_time', last_edited_time: { after: lastSync } } : undefined
  )
  for (const page of response.results) {
    if (page.object !== 'page') continue
    const p = (page as { properties: Record<string, unknown> }).properties as Record<string, { type: string; title?: { plain_text: string }[]; rich_text?: { plain_text: string }[]; select?: { name: string }; multi_select?: { name: string }[]; date?: { start: string }; checkbox?: boolean }>

    const body = p.Body?.rich_text?.map((r) => r.plain_text).join('') ?? ''
    if (!body) continue

    const existing = database.select().from(items).where(eq(items.notionId, page.id)).get()
    const now = Date.now()
    const title = p.Title?.title?.map((t) => t.plain_text).join('') ?? null
    const type = (p.Type?.select?.name as 'Quote' | 'Affirmation' | 'Story' | 'Thought') ?? 'Thought'
    const source = (p.Source?.select?.name as 'manual' | 'whatsapp' | 'email' | 'voice') ?? 'manual'
    const author = p.Author?.rich_text?.map((r) => r.plain_text).join('') || null
    const tags = JSON.stringify(p.Tags?.multi_select?.map((t) => t.name) ?? [])

    if (existing) {
      database.update(items)
        .set({ title, body, type, source, author, tags, synced: 1, updatedAt: now })
        .where(eq(items.notionId, page.id))
        .run()
    } else {
      database.insert(items).values({
        id: nanoid(),
        title,
        body,
        type,
        source,
        author,
        tags,
        notionId: page.id,
        synced: 1,
        createdAt: now,
        updatedAt: now,
      }).run()
    }
  }

  setSyncMeta('lastPull', new Date().toISOString())
}

export async function runSync() {
  await pushToNotion()
  await pullFromNotion()
}
