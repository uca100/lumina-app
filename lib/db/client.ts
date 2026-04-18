import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

const DB_PATH = path.join(process.cwd(), 'lumina.db')

let _db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    _db = drizzle(sqlite, { schema })
    ensureSchema(sqlite)
  }
  return _db
}

function ensureSchema(sqlite: Database.Database) {
  // migrate existing reminder_schedules table if item_id column is missing
  try {
    sqlite.exec(`ALTER TABLE reminder_schedules ADD COLUMN item_id TEXT`)
  } catch {
    // column already exists — ignore
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Thought',
      source TEXT NOT NULL DEFAULT 'manual',
      author TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      notion_id TEXT,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_synced ON items(synced);
    CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);

    CREATE TABLE IF NOT EXISTS sync_meta (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminder_schedules (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      types_filter TEXT NOT NULL DEFAULT '[]',
      item_id TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      chat_id INTEGER,
      created_at INTEGER NOT NULL
    );
  `)
}

export function initDb() {
  getDb()
  console.log('> Lumina DB initialized')
}

export function db() {
  return getDb()
}
