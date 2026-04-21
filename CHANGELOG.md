# Changelog

All notable changes to Lumina are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased] - 2026-04-21

### Added
- Drafts tag routing: type tags (quote/affirmation/story/thought) skip AI; thematic tags (lessons/habit/inspiring) are passed as item tags
- Ingest deduplication: duplicate items (same body text) are detected and skipped without re-inserting or calling AI
- Notion deletion sync: daily job at 03:00 removes local items deleted/archived in Notion, with full pagination
- New daily_random reminders created via API are immediately scheduled for today without waiting for midnight
- Integrations nav button (📱) added to feed page header
- ntfy notifications now send with Markdown enabled
- ntfy error logging when push fails

### Fixed
- ntfy notifications crashing on Hebrew/non-ASCII item titles (HTTP headers must be ASCII)
- Daily random reminders now use remaining window when scheduler starts mid-day (was picking times already in the past)

### Changed
- Reminders nav button now has a `title` tooltip attribute

---

## [Unreleased] - 2026-04-21

### Added
- Drafts app integration: two iOS Drafts Actions for capturing content into Lumina
  - "Send to Lumina": sends current draft immediately via POST /api/ingest/shortcut
  - "Flush to Lumina": batch sends all drafts tagged `lumina`, archives them after
- ntfy push notifications: reminders now send via ntfy.sh instead of requiring Telegram
  - New `lib/ntfy/notify.ts` module, NTFY_TOPIC env var, ntfy takes priority over Telegram
- Reminders: "↻ Random times/day" (scatter) mode — pick N times, spread across 08:00–22:00
- Reminders: "🎲 Daily random" mode — picks a fresh random time each day at midnight
- Integrations page: Drafts section with pre-filled action scripts, ntfy section with topic
- /api/config now returns ntfyTopic for integrations page display
- DB migration: added `mode` column to reminder_schedules ('fixed' | 'daily_random')

## [Unreleased] - 2026-04-18

### Added
- Reminders system: scheduled Telegram push notifications at configurable times of day
- reminder_schedules table (hour, minute, type filter, pinned item, enabled toggle)
- Minute-granularity cron job sends random or pinned item via Telegram at each slot
- Auto-captures Telegram chat ID from first bot message (no manual config needed)
- GET /api/items/random — public random item endpoint (optional ?type= filter)
- GET /api/reminders/random — Bearer-auth endpoint for iOS Shortcuts pull delivery
- CRUD API for reminder schedules (GET/POST /api/reminders, PUT/DELETE /api/reminders/[id])
- /reminders settings page: add time slots, toggle enabled, pick random or specific item
- Item picker in reminder form: search library and pin a specific item to a slot
- ⇄ Shuffle button on main feed navigates to a random item
- Bumped version to 0.3.0

## [0.2.0] - 2026-04-18

### Added
- Full dark mode across feed, item cards, and detail page (amber accents, zinc tones)
- Editorial card design: colored left-border per type, large `"` mark for Quote cards
- Author/source badge and hover Edit/Delete actions directly on item cards
- Version badge in header (v0.2.0) with /api/version endpoint baked at build time
- Telegram bot ingest: webhook handler, auto-classify, reply with type + tags
- Email IMAP ingest: polls dedicated Gmail address every 15 min via imapflow
- iOS Shortcuts ingest endpoint with Bearer token auth
- WhatsApp Cloud API webhook (GET verify + POST ingest, HMAC-SHA256 validated)
- Shared classifyAndSave() pipeline used by all ingest integrations
- INGEST_API_KEY generated and deployed to pi5
- lib/ingest/auth.ts — shared Bearer token validation
- lib/telegram/bot.ts — sendMessage + registerWebhook helpers
- /api/ingest/telegram-register — one-shot webhook registration endpoint
- telegram and shortcut added to source enum in DB schema

### Changed
- Notion database moved from project doc to dedicated Technical / Databases area
- Removed 2 duplicate databases; single clean Lumina Items DB (3604f8ed...)
- Scheduler now runs email check alongside Notion sync every 15 min
- package.json version bumped to 0.2.0

### Fixed
- All items re-synced to new Notion DB after migration

## [0.1.0] - 2026-04-18

### Added
- Initial MVP: Next.js 16 + Tailwind CSS web app on pi5:3009
- SQLite + Drizzle ORM local database with items + syncMeta tables
- Claude Haiku 4.5 auto-classification with prompt caching
- Notion bidirectional sync (push/pull every 15 min via node-cron)
- Feed view with full-text search and type filter
- Capture form with AI auto-classify button
- Item detail page with edit and delete
- Dark editorial capture screen
- deploy.sh + lumina.service systemd unit
- nginx-proxy routing for /lumina
- myweb dashboard card added
- GitHub repo: uca100/lumina-app
