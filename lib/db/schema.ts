import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  title: text('title'),
  body: text('body').notNull(),
  type: text('type', { enum: ['Quote', 'Affirmation', 'Story', 'Thought'] }).notNull().default('Thought'),
  source: text('source', { enum: ['manual', 'whatsapp', 'email', 'voice', 'telegram', 'shortcut'] }).notNull().default('manual'),
  author: text('author'),
  tags: text('tags').notNull().default('[]'),
  notionId: text('notion_id'),
  synced: integer('synced').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (t) => [
  index('idx_items_type').on(t.type),
  index('idx_items_synced').on(t.synced),
  index('idx_items_created').on(t.createdAt),
])

export const syncMeta = sqliteTable('sync_meta', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const reminderSchedules = sqliteTable('reminder_schedules', {
  id: text('id').primaryKey(),
  label: text('label').notNull().default(''),
  hour: integer('hour').notNull(),
  minute: integer('minute').notNull(),
  typesFilter: text('types_filter').notNull().default('[]'),
  itemId: text('item_id'),
  mode: text('mode', { enum: ['fixed', 'daily_random', 'daily_scatter'] }).notNull().default('fixed'),
  count: integer('count').notNull().default(1),
  enabled: integer('enabled').notNull().default(1),
  chatId: integer('chat_id'),
  createdAt: integer('created_at').notNull(),
})
