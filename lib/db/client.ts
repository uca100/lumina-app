import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

const DB_PATH = path.join(process.cwd(), 'lumina.db')

let _sqlite: Database.Database | null = null
let _db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!_db) {
    _sqlite = new Database(DB_PATH)
    _sqlite.pragma('journal_mode = WAL')
    _sqlite.pragma('foreign_keys = ON')
    _db = drizzle(_sqlite, { schema })
    ensureSchema(_sqlite)
  }
  return _db
}

function ensureSchema(sqlite: Database.Database) {
  // migrations — safe to run multiple times
  for (const sql of [
    `ALTER TABLE reminder_schedules ADD COLUMN item_id TEXT`,
    `ALTER TABLE reminder_schedules ADD COLUMN mode TEXT NOT NULL DEFAULT 'fixed'`,
    `ALTER TABLE reminder_schedules ADD COLUMN count INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE items ADD COLUMN summary TEXT`,
    `ALTER TABLE items ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE reminder_schedules ADD COLUMN daily_fire_minutes TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE reminder_schedules ADD COLUMN daily_fire_date TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'`,
    `ALTER TABLE items ADD COLUMN mark INTEGER NOT NULL DEFAULT 2`,
    `ALTER TABLE items ADD COLUMN user_id TEXT`,
    `ALTER TABLE reminder_schedules ADD COLUMN user_id TEXT`,
  ]) {
    try { sqlite.exec(sql) } catch { /* column already exists */ }
  }

  sqlite.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      ntfy_topic TEXT,
      telegram_chat_id INTEGER,
      ingest_api_key TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

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
    CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
      id UNINDEXED,
      title,
      body,
      tags
    );

    CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
      INSERT INTO items_fts(id, title, body, tags) VALUES (new.id, COALESCE(new.title, ''), new.body, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
      INSERT INTO items_fts(id, title, body, tags) VALUES (new.id, COALESCE(new.title, ''), new.body, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
    END;

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

  // Populate FTS index for existing items on first run
  const { n } = sqlite.prepare('SELECT COUNT(*) as n FROM items_fts').get() as { n: number }
  if (n === 0) {
    sqlite.exec(`INSERT INTO items_fts(id, title, body, tags) SELECT id, COALESCE(title, ''), body, tags FROM items`)
  }
}

export function initDb() {
  getDb()
  console.log('> Lumina DB initialized')
}

export function db() {
  return getDb()
}

export function rawDb() {
  getDb()
  return _sqlite!
}
