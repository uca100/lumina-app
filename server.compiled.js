"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_http = require("http");
var import_next = __toESM(require("next"));

// lib/db/client.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");
var import_path = __toESM(require("path"));

// lib/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  items: () => items,
  reminderSchedules: () => reminderSchedules,
  syncMeta: () => syncMeta
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var items = (0, import_sqlite_core.sqliteTable)("items", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  title: (0, import_sqlite_core.text)("title"),
  body: (0, import_sqlite_core.text)("body").notNull(),
  type: (0, import_sqlite_core.text)("type", { enum: ["Quote", "Affirmation", "Story", "Thought", "Lesson", "Habit", "Pattern"] }).notNull().default("Thought"),
  source: (0, import_sqlite_core.text)("source", { enum: ["manual", "whatsapp", "email", "voice", "telegram", "shortcut"] }).notNull().default("manual"),
  author: (0, import_sqlite_core.text)("author"),
  tags: (0, import_sqlite_core.text)("tags").notNull().default("[]"),
  summary: (0, import_sqlite_core.text)("summary"),
  pinned: (0, import_sqlite_core.integer)("pinned").notNull().default(0),
  notionId: (0, import_sqlite_core.text)("notion_id"),
  synced: (0, import_sqlite_core.integer)("synced").notNull().default(0),
  createdAt: (0, import_sqlite_core.integer)("created_at").notNull(),
  updatedAt: (0, import_sqlite_core.integer)("updated_at").notNull()
}, (t) => [
  (0, import_sqlite_core.index)("idx_items_type").on(t.type),
  (0, import_sqlite_core.index)("idx_items_synced").on(t.synced),
  (0, import_sqlite_core.index)("idx_items_created").on(t.createdAt)
]);
var syncMeta = (0, import_sqlite_core.sqliteTable)("sync_meta", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  key: (0, import_sqlite_core.text)("key").notNull().unique(),
  value: (0, import_sqlite_core.text)("value").notNull(),
  updatedAt: (0, import_sqlite_core.integer)("updated_at").notNull()
});
var reminderSchedules = (0, import_sqlite_core.sqliteTable)("reminder_schedules", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  label: (0, import_sqlite_core.text)("label").notNull().default(""),
  hour: (0, import_sqlite_core.integer)("hour").notNull(),
  minute: (0, import_sqlite_core.integer)("minute").notNull(),
  typesFilter: (0, import_sqlite_core.text)("types_filter").notNull().default("[]"),
  itemId: (0, import_sqlite_core.text)("item_id"),
  mode: (0, import_sqlite_core.text)("mode", { enum: ["fixed", "daily_random", "daily_scatter"] }).notNull().default("fixed"),
  count: (0, import_sqlite_core.integer)("count").notNull().default(1),
  enabled: (0, import_sqlite_core.integer)("enabled").notNull().default(1),
  chatId: (0, import_sqlite_core.integer)("chat_id"),
  dailyFireMinutes: (0, import_sqlite_core.text)("daily_fire_minutes").notNull().default("[]"),
  dailyFireDate: (0, import_sqlite_core.text)("daily_fire_date").notNull().default(""),
  createdAt: (0, import_sqlite_core.integer)("created_at").notNull()
});

// lib/db/client.ts
var DB_PATH = import_path.default.join(process.cwd(), "lumina.db");
var _db = null;
function getDb() {
  if (!_db) {
    const sqlite = new import_better_sqlite3.default(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = (0, import_better_sqlite32.drizzle)(sqlite, { schema: schema_exports });
    ensureSchema(sqlite);
  }
  return _db;
}
function ensureSchema(sqlite) {
  for (const sql of [
    `ALTER TABLE reminder_schedules ADD COLUMN item_id TEXT`,
    `ALTER TABLE reminder_schedules ADD COLUMN mode TEXT NOT NULL DEFAULT 'fixed'`,
    `ALTER TABLE reminder_schedules ADD COLUMN count INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE items ADD COLUMN summary TEXT`,
    `ALTER TABLE items ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE reminder_schedules ADD COLUMN daily_fire_minutes TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE reminder_schedules ADD COLUMN daily_fire_date TEXT NOT NULL DEFAULT ''`
  ]) {
    try {
      sqlite.exec(sql);
    } catch {
    }
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
  `);
}
function initDb() {
  getDb();
  console.log("> Lumina DB initialized");
}
function db() {
  return getDb();
}

// lib/scheduler/jobs.ts
var import_node_cron = __toESM(require("node-cron"));

// lib/notion/sync.ts
var import_client = require("@notionhq/client");
var import_drizzle_orm = require("drizzle-orm");
var import_nanoid = require("nanoid");
var notion = new import_client.Client({ auth: process.env.NOTION_API_KEY });
var DB_ID = process.env.NOTION_DATABASE_ID ?? "";
var NOTION_API_KEY = process.env.NOTION_API_KEY ?? "";
async function queryDatabase(filter, cursor) {
  const body = { page_size: 100 };
  if (filter) body.filter = filter;
  if (cursor) body.start_cursor = cursor;
  const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return res.json();
}
async function fetchAllNotionIds() {
  const ids = /* @__PURE__ */ new Set();
  let cursor;
  do {
    const res = await queryDatabase(void 0, cursor);
    for (const page of res.results) {
      const p = page;
      if (p.object === "page") ids.add(p.id);
    }
    cursor = res.has_more && res.next_cursor ? res.next_cursor : void 0;
  } while (cursor);
  return ids;
}
function getSyncMeta(key) {
  const database = db();
  const row = database.select().from(syncMeta).where((0, import_drizzle_orm.eq)(syncMeta.key, key)).get();
  return row?.value ?? null;
}
function setSyncMeta(key, value) {
  const database = db();
  const now = Date.now();
  const existing = database.select().from(syncMeta).where((0, import_drizzle_orm.eq)(syncMeta.key, key)).get();
  if (existing) {
    database.update(syncMeta).set({ value, updatedAt: now }).where((0, import_drizzle_orm.eq)(syncMeta.key, key)).run();
  } else {
    database.insert(syncMeta).values({ id: (0, import_nanoid.nanoid)(), key, value, updatedAt: now }).run();
  }
}
async function pushToNotion() {
  if (!DB_ID) return;
  const database = db();
  const pending = database.select().from(items).where((0, import_drizzle_orm.eq)(items.synced, 0)).all();
  for (const item of pending) {
    const tags = JSON.parse(item.tags);
    const props = {
      Title: { title: [{ text: { content: item.title ?? item.body.slice(0, 80) } }] },
      Type: { select: { name: item.type } },
      Source: { select: { name: item.source } },
      Body: { rich_text: [{ text: { content: item.body.slice(0, 2e3) } }] },
      Tags: { multi_select: tags.map((t) => ({ name: t })) },
      Date: { date: { start: new Date(item.createdAt).toISOString().split("T")[0] } },
      Synced: { checkbox: true }
    };
    if (item.author) props.Author = { rich_text: [{ text: { content: item.author } }] };
    if (item.notionId) {
      await notion.pages.update({ page_id: item.notionId, properties: props });
    } else {
      const page = await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: props
      });
      database.update(items).set({ notionId: page.id, synced: 1, updatedAt: Date.now() }).where((0, import_drizzle_orm.eq)(items.id, item.id)).run();
      continue;
    }
    database.update(items).set({ synced: 1, updatedAt: Date.now() }).where((0, import_drizzle_orm.eq)(items.id, item.id)).run();
  }
}
async function pullFromNotion() {
  if (!DB_ID) return;
  const lastSync = getSyncMeta("lastPull");
  const database = db();
  const response = await queryDatabase(
    lastSync ? { timestamp: "last_edited_time", last_edited_time: { after: lastSync } } : void 0
  );
  for (const _page of response.results) {
    const page = _page;
    if (page.object !== "page") continue;
    const p = page.properties;
    const body = p.Body?.rich_text?.map((r) => r.plain_text).join("") ?? "";
    if (!body) continue;
    const existing = database.select().from(items).where((0, import_drizzle_orm.eq)(items.notionId, page.id)).get();
    const now = Date.now();
    const title = p.Title?.title?.map((t) => t.plain_text).join("") ?? null;
    const type = p.Type?.select?.name ?? "Thought";
    const source = p.Source?.select?.name ?? "manual";
    const author = p.Author?.rich_text?.map((r) => r.plain_text).join("") || null;
    const tags = JSON.stringify(p.Tags?.multi_select?.map((t) => t.name) ?? []);
    if (existing) {
      const mergedBody = body.length >= existing.body.length ? body : existing.body;
      database.update(items).set({ title, body: mergedBody, type, source, author, tags, synced: 1, updatedAt: now }).where((0, import_drizzle_orm.eq)(items.notionId, page.id)).run();
    } else {
      database.insert(items).values({
        id: (0, import_nanoid.nanoid)(),
        title,
        body,
        type,
        source,
        author,
        tags,
        notionId: page.id,
        synced: 1,
        createdAt: now,
        updatedAt: now
      }).run();
    }
  }
  setSyncMeta("lastPull", (/* @__PURE__ */ new Date()).toISOString());
}
async function syncDeletions() {
  if (!DB_ID) return;
  const notionIds = await fetchAllNotionIds();
  const database = db();
  const local = database.select({ id: items.id, notionId: items.notionId }).from(items).where((0, import_drizzle_orm.isNotNull)(items.notionId)).all();
  let deleted = 0;
  for (const item of local) {
    if (item.notionId && !notionIds.has(item.notionId)) {
      database.delete(items).where((0, import_drizzle_orm.eq)(items.id, item.id)).run();
      deleted++;
    }
  }
  if (deleted > 0) console.log(`[Lumina] Deletion sync: removed ${deleted} item(s) deleted in Notion`);
}
async function runSync() {
  await pushToNotion();
  await pullFromNotion();
}

// lib/email/ingest.ts
var import_imapflow = require("imapflow");

// lib/ai/claude.ts
var import_sdk = __toESM(require("@anthropic-ai/sdk"));
var client = new import_sdk.default({ apiKey: process.env.CLAUDE_API_KEY });
var SYSTEM_PROMPT = `You are a content classifier for a personal inspiration app called Lumina.
When given a piece of text, you will:
1. Classify it as one of: Quote, Affirmation, Story, Thought, Lesson, Habit, or Pattern
2. Extract the author if present (for quotes)
3. Choose 3\u20135 tags from the vocabulary below
4. Generate a short title (max 7 words, no articles like "A" or "The" at start)
5. Generate a summary: copy the opening 1\u20132 sentences of the content exactly as written. Never paraphrase or reword \u2014 preserve the original language and phrasing. If the content is a single short sentence, copy it exactly.

Language rule: generate the title and summary in the same language as the input content. If the input is Hebrew, output Hebrew. If English, output English.

Definitions:
- Quote: A memorable statement attributed to a specific person
- Affirmation: A positive self-directed statement meant to be repeated
- Story: A narrative or anecdote, longer-form
- Thought: A personal reflection, idea, or insight
- Lesson: A key takeaway, learning, or principle derived from experience
- Habit: A routine, practice, or behavioral pattern worth building
- Pattern: A recurring theme, structure, or principle observed across experience or knowledge

## Tag vocabulary (use ONLY these, all lowercase, pick the most specific fit):
mindset, growth, resilience, identity, self-belief, confidence, courage, fear, ego, clarity
gratitude, presence, awareness, acceptance, peace, joy, love, pain, grief, loneliness
stoicism, philosophy, meaning, purpose, truth, wisdom, perspective, paradox
discipline, consistency, focus, habits, rest, energy, health, sleep
creativity, learning, reading, writing, thinking, curiosity, excellence, mastery
leadership, communication, relationships, trust, kindness, family, community
money, career, ambition, risk, failure, success, work, productivity
mortality, time, urgency, patience, change, uncertainty, faith, spirituality

Rules for tags:
- Never use the type name (quote, lesson, etc.) as a tag
- Never use the author's name as a tag
- Do not repeat similar concepts (e.g., pick one of resilience/strength/perseverance)
- Prefer specific over generic (e.g., "stoicism" over "philosophy" if clearly stoic)

Respond ONLY with valid JSON in this exact shape:
{
  "type": "Quote" | "Affirmation" | "Story" | "Thought" | "Lesson" | "Habit" | "Pattern",
  "author": string | null,
  "tags": string[],
  "title": string,
  "summary": string
}

No markdown, no explanation, only the JSON object.`;
async function classifyItem(body) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }
      }
    ],
    messages: [{ role: "user", content: body }]
  });
  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const text2 = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(text2);
}

// lib/ingest/save.ts
var import_nanoid2 = require("nanoid");
var import_drizzle_orm2 = require("drizzle-orm");
var VALID_TYPES = /* @__PURE__ */ new Set(["Quote", "Affirmation", "Story", "Thought", "Lesson", "Habit", "Pattern"]);
async function classifyAndSave(body, source, meta) {
  const normalizedBody = body.trim();
  const existing = db().select().from(items).where((0, import_drizzle_orm2.eq)(items.body, normalizedBody)).get();
  if (existing) return { id: existing.id, type: existing.type, tags: JSON.parse(existing.tags), title: existing.title, duplicate: true };
  const now = Date.now();
  const id = (0, import_nanoid2.nanoid)();
  const presetType = meta?.type && VALID_TYPES.has(meta.type) ? meta.type : null;
  let type;
  let author;
  let tags;
  let title;
  let summary;
  const classified = await classifyItem(body);
  type = presetType ?? classified.type;
  author = meta?.author ?? classified.author;
  tags = [.../* @__PURE__ */ new Set([...meta?.tags ?? [], ...classified.tags])];
  title = meta?.title ?? classified.title;
  summary = classified.summary;
  db().insert(items).values({
    id,
    title,
    body: normalizedBody,
    type,
    source,
    author,
    summary,
    tags: JSON.stringify(tags),
    synced: 0,
    createdAt: now,
    updatedAt: now
  }).run();
  return { id, type, tags, title };
}

// lib/email/ingest.ts
async function checkEmail() {
  const host = process.env.EMAIL_IMAP_HOST;
  const user = process.env.EMAIL_IMAP_USER;
  const pass = process.env.EMAIL_IMAP_PASS;
  if (!host || !user || !pass) return;
  const client2 = new import_imapflow.ImapFlow({
    host,
    port: Number(process.env.EMAIL_IMAP_PORT ?? 993),
    secure: true,
    auth: { user, pass },
    logger: false
  });
  await client2.connect();
  try {
    const lock = await client2.getMailboxLock("INBOX");
    try {
      const messages = client2.fetch({ seen: false }, { envelope: true, bodyStructure: true, source: true });
      for await (const msg of messages) {
        if (!msg.source) continue;
        const raw = msg.source.toString();
        const body = extractBody(raw);
        const subject = msg.envelope?.subject ?? "";
        if (!body.trim()) continue;
        const combined = subject ? `${subject}

${body}` : body;
        await classifyAndSave(combined.slice(0, 4e3), "email", { title: subject || void 0 });
        await client2.messageFlagsAdd(msg.seq, ["\\Seen"]);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client2.logout();
  }
}
function extractBody(raw) {
  const lines = raw.split("\r\n");
  let inBody = false;
  let inPlainText = false;
  const bodyLines = [];
  for (const line of lines) {
    if (!inBody && line === "") {
      inBody = true;
      inPlainText = true;
      continue;
    }
    if (inBody && inPlainText) {
      if (line.startsWith("--")) break;
      bodyLines.push(line);
    }
  }
  return bodyLines.join("\n").replace(/=\r?\n/g, "").replace(/=[0-9A-F]{2}/gi, (m) => String.fromCharCode(parseInt(m.slice(1), 16))).trim();
}

// lib/scheduler/jobs.ts
var import_drizzle_orm3 = require("drizzle-orm");

// lib/telegram/bot.ts
var BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
async function sendMessage(chatId, text2) {
  await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text2, parse_mode: "Markdown" })
  });
}

// lib/ntfy/notify.ts
var NTFY_BASE = "https://ntfy.sh";
var TYPE_EMOJI = {
  Quote: "speech_balloon",
  Affirmation: "star",
  Story: "books",
  Thought: "thought_balloon",
  Lesson: "mortar_board",
  Habit: "seedling",
  Pattern: "diamond_shape_with_a_dot_inside"
};
async function sendNtfy(message, title, type, clickUrl) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const tag = (type && TYPE_EMOJI[type]) ?? "sparkles";
  const res = await fetch(`${NTFY_BASE}/${topic}`, {
    method: "POST",
    headers: {
      "Title": (title ?? "Lumina").replace(/[^\x00-\x7F]/g, "").trim() || "Lumina",
      "Priority": "default",
      "Tags": tag,
      "Content-Type": "text/plain",
      "Markdown": "yes",
      ...clickUrl ? {
        "Click": clickUrl,
        "Actions": `view, Open in Lumina, ${clickUrl}`
      } : {}
    },
    body: message
  });
  if (!res.ok) {
    console.error(`[Lumina] ntfy failed: ${res.status} ${await res.text()}`);
  }
}

// lib/scheduler/jobs.ts
var NTFY_MAX_BODY = 400;
async function fireReminder(schedule, chatId) {
  let pick;
  if (schedule.itemId) {
    pick = db().select().from(items).where((0, import_drizzle_orm3.eq)(items.id, schedule.itemId)).get();
    if (!pick) return;
  } else {
    const types = JSON.parse(schedule.typesFilter);
    const all = types.length ? db().select().from(items).where((0, import_drizzle_orm3.inArray)(items.type, types)).all() : db().select().from(items).all();
    if (!all.length) return;
    pick = all[Math.floor(Math.random() * all.length)];
  }
  let notifBody = pick.body;
  if (notifBody.length > NTFY_MAX_BODY) {
    notifBody = notifBody.slice(0, NTFY_MAX_BODY - 1) + "\u2026";
  }
  const lines = [
    notifBody,
    ...pick.author ? [`\u2014 ${pick.author}`] : []
  ];
  const text2 = lines.join("\n");
  if (process.env.NTFY_TOPIC) {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
    const isAffirmation = pick.type === "Affirmation";
    const clickUrl = isAffirmation ? `${baseUrl}/lumina/affirmations` : `${baseUrl}/lumina/view/${pick.id}`;
    const notifTitle = isAffirmation ? "Today's Affirmations" : pick.title ?? void 0;
    await sendNtfy(text2, notifTitle, pick.type ?? void 0, clickUrl);
  } else if (chatId) {
    await sendMessage(chatId, text2);
  }
}
function randomMinutesInWindow(count, windowStart) {
  const END = 22 * 60;
  const available = END - windowStart;
  if (available <= 0) return [];
  const segment = Math.floor(available / count);
  const result = [];
  for (let i = 0; i < count; i++) {
    const base = windowStart + i * segment;
    const offset = Math.floor(Math.random() * Math.max(segment, 1));
    result.push(Math.min(base + offset, END - 1));
  }
  return result;
}
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function scheduleSingleDailyRandom(schedule) {
  const meta = db().select().from(syncMeta).where((0, import_drizzle_orm3.eq)(syncMeta.key, "telegram_chat_id")).get();
  const chatId = schedule.chatId ?? (meta ? Number(meta.value) : null);
  const now = /* @__PURE__ */ new Date();
  const today = todayStr();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const fireMinutes = JSON.parse(schedule.dailyFireMinutes);
  if (schedule.dailyFireDate === today && fireMinutes.length > 0) {
    const pastDue = fireMinutes.filter((m2) => m2 <= currentMinute);
    if (pastDue.length > 0) {
      const remaining = fireMinutes.filter((m2) => m2 > currentMinute);
      db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(remaining) }).where((0, import_drizzle_orm3.eq)(reminderSchedules.id, schedule.id)).run();
      await fireReminder(schedule, chatId).catch((err) => console.error("[Lumina] Catch-up reminder error:", schedule.id, err));
    }
    return;
  }
  const windowStart = Math.max(8 * 60, currentMinute + 1);
  const [minute] = randomMinutesInWindow(1, windowStart);
  if (minute === void 0) return;
  db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify([minute]), dailyFireDate: today }).where((0, import_drizzle_orm3.eq)(reminderSchedules.id, schedule.id)).run();
  const h = Math.floor(minute / 60), m = minute % 60;
  console.log(`[Lumina] Daily random scheduled: ${schedule.label || schedule.id} at ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}
async function scheduleDailyScatter(schedule) {
  const now = /* @__PURE__ */ new Date();
  const today = todayStr();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const fireMinutes = JSON.parse(schedule.dailyFireMinutes);
  if (schedule.dailyFireDate === today && fireMinutes.length > 0) {
    return;
  }
  const windowStart = Math.max(8 * 60, currentMinute + 1);
  const count = schedule.count ?? 1;
  const minutes = randomMinutesInWindow(count, windowStart);
  if (!minutes.length) return;
  db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(minutes), dailyFireDate: today }).where((0, import_drizzle_orm3.eq)(reminderSchedules.id, schedule.id)).run();
  console.log(`[Lumina] Daily scatter scheduled: ${schedule.label || schedule.id} \u2014 ${minutes.length}\xD7 today`);
}
function scheduleDailyRandoms() {
  const randoms = db().select().from(reminderSchedules).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(reminderSchedules.mode, "daily_random"), (0, import_drizzle_orm3.eq)(reminderSchedules.enabled, 1))).all();
  for (const schedule of randoms) {
    scheduleSingleDailyRandom(schedule).catch(console.error);
  }
  const scatters = db().select().from(reminderSchedules).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(reminderSchedules.mode, "daily_scatter"), (0, import_drizzle_orm3.eq)(reminderSchedules.enabled, 1))).all();
  for (const schedule of scatters) {
    scheduleDailyScatter(schedule).catch(console.error);
  }
}
function initReminderJobs() {
  import_node_cron.default.schedule("* * * * *", async () => {
    const now = /* @__PURE__ */ new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const today = todayStr();
    const currentMinute = h * 60 + m;
    const due = db().select().from(reminderSchedules).where((0, import_drizzle_orm3.and)(
      (0, import_drizzle_orm3.eq)(reminderSchedules.hour, h),
      (0, import_drizzle_orm3.eq)(reminderSchedules.minute, m),
      (0, import_drizzle_orm3.eq)(reminderSchedules.enabled, 1),
      (0, import_drizzle_orm3.eq)(reminderSchedules.mode, "fixed")
    )).all();
    const meta = db().select().from(syncMeta).where((0, import_drizzle_orm3.eq)(syncMeta.key, "telegram_chat_id")).get();
    const globalChatId = meta ? Number(meta.value) : null;
    for (const schedule of due) {
      try {
        const chatId = schedule.chatId ?? globalChatId;
        if (!chatId && !process.env.NTFY_TOPIC) continue;
        await fireReminder(schedule, chatId);
      } catch (err) {
        console.error("[Lumina] Reminder error:", schedule.id, err);
      }
    }
    const dailies = db().select().from(reminderSchedules).where((0, import_drizzle_orm3.and)(
      (0, import_drizzle_orm3.eq)(reminderSchedules.enabled, 1),
      (0, import_drizzle_orm3.inArray)(reminderSchedules.mode, ["daily_random", "daily_scatter"])
    )).all();
    for (const schedule of dailies) {
      if (schedule.dailyFireDate !== today) continue;
      const fireMinutes = JSON.parse(schedule.dailyFireMinutes);
      if (!fireMinutes.includes(currentMinute)) continue;
      const remaining = fireMinutes.filter((mm) => mm !== currentMinute);
      db().update(reminderSchedules).set({ dailyFireMinutes: JSON.stringify(remaining) }).where((0, import_drizzle_orm3.eq)(reminderSchedules.id, schedule.id)).run();
      try {
        const chatId = schedule.chatId ?? globalChatId;
        if (!chatId && !process.env.NTFY_TOPIC) continue;
        await fireReminder(schedule, chatId);
      } catch (err) {
        console.error("[Lumina] Reminder error:", schedule.id, err);
      }
    }
  });
  import_node_cron.default.schedule("0 0 * * *", scheduleDailyRandoms);
  scheduleDailyRandoms();
}
function initScheduler() {
  import_node_cron.default.schedule("*/15 * * * *", async () => {
    console.log("[Lumina] Running Notion sync...");
    try {
      await runSync();
      console.log("[Lumina] Sync complete");
    } catch (err) {
      console.error("[Lumina] Sync error:", err);
    }
    if (process.env.EMAIL_IMAP_USER) {
      console.log("[Lumina] Checking email...");
      try {
        await checkEmail();
        console.log("[Lumina] Email check complete");
      } catch (err) {
        console.error("[Lumina] Email error:", err);
      }
    }
  });
  import_node_cron.default.schedule("0 3 * * *", async () => {
    console.log("[Lumina] Running deletion sync...");
    try {
      await syncDeletions();
    } catch (err) {
      console.error("[Lumina] Deletion sync error:", err);
    }
  });
  initReminderJobs();
  console.log("> Lumina scheduler started (Notion sync + email check every 15 min, reminders every minute)");
}

// server.ts
var port = parseInt(process.env.PORT ?? "3009", 10);
var dev = process.env.NODE_ENV !== "production";
var app = (0, import_next.default)({ dev, port });
var handle = app.getRequestHandler();
app.prepare().then(() => {
  initDb();
  initScheduler();
  (0, import_http.createServer)((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Lumina ready on http://localhost:${port}/lumina (${dev ? "development" : "production"})`);
  });
});
