# Changelog

All notable changes to Lumina are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [0.7.4] - 2026-05-04

### Fixed
- Affirmation notifications now show "Today's Affirmations" as the title instead of the item's own title
- Notifications now show the original body text verbatim (previously used AI-generated summary which could change meaning)
- Fixed broken "Open in Lumina" link on `/view/[id]` page (double `/lumina` prefix due to Next.js basePath)
- Notion pull no longer overwrites local body with truncated version (Notion caps at 2000 chars on push — local body is preserved if longer)

### Changed
- All save paths unified: `POST /api/items` (CaptureForm) now goes through `classifyAndSave` like all other ingests — every item gets AI classification, deduplication check, and summary regardless of source
- AI summary prompt updated to copy opening sentences verbatim instead of paraphrasing/distilling

---

## [0.7.3] - 2026-05-03

### Added
- New `/view/[id]` page — clean, read-only notification landing view: full-screen, type-colored gradient, large serif text, no edit UI; "Open in Lumina" link at the bottom goes to the full item page
- ntfy notifications now include an "Open in Lumina" action button (via `Actions` header) for a visible tap target inside the app

### Changed
- Notification click URL for non-Affirmation items now points to `/view/[id]` instead of `/item/[id]`
- Affirmation notifications continue to link to `/affirmations` (daily page)

---

## [0.7.2] - 2026-05-03

### Fixed
- Daily random/scatter reminders now persist fire times to the DB so they survive server restarts — previously a restart between midnight and the scheduled time would silently drop the day's notification
- On restart, any past-due reminders from the same day fire immediately as catch-up
- ntfy notification body truncated to 400 chars to prevent OS-level truncation in the notification tray

---

## [0.7.1] - 2026-05-02

### Added
- Affirmations settings page (`/affirmations/settings`): manage daily set, reorder with ↑↓, daily notification time picker, random pool view — all in one place
- Daily notification can be set directly from affirmations settings (no need to go to Reminders page)
- Random Pool section shows non-pinned Affirmation items feeding "Today's Pick"
- `GET /api/items?pinned=1` filter — daily set now shows all pinned items regardless of type (fixes Pattern/Quote/etc. not appearing)
- `GET/POST /api/affirmations/order` — stores display order of daily set in DB

### Fixed
- Daily affirmations page was filtering to `type=Affirmation` only — any other type (Pattern, Quote, etc.) pinned as daily was invisible
- `NEXT_PUBLIC_BASE_URL` now set on pi5 so scheduled reminder notifications include the full clickable deep link

---

## [0.7.0] - 2026-05-02

### Added
- **Hebrew RTL support**: items with Hebrew text now render right-to-left with correct alignment and system font fallback in both the feed card and item detail view
- **Affirmations page** (`/affirmations`): dedicated page with three sections — Today's Affirmation (date-seeded daily pick with "Show another" button), Daily Affirmations (pinned items), and More Affirmations
- **Pin as daily affirmation**: checkbox in the item edit UI to mark any affirmation as a pinned daily one; stored in new `pinned` DB column (auto-migrated)
- **ntfy click link**: push notifications now include a deep link — affirmation notifications open the Affirmations page, all other types open the item detail page
- `✿` nav button in the feed header linking to the Affirmations page

---

## [0.6.1] - 2026-04-26

### Fixed
- AI classifier now generates title and summary in the same language as the input content (Hebrew in → Hebrew out)

---

## [0.6.0] - 2026-04-25

### Added
- **Pattern** category: new type for recurring themes and observed principles, with orange color scheme and ◇ icon; added to AI classifier, all type maps, Drafts scripts, ntfy emoji
- **Tag filtering**: horizontal scrollable tag strip below type filters; click any tag in the strip or on a card to filter the feed; active tag shown as dismissable chip; filters stack with type + text search
- `/api/items/tags` endpoint: returns all unique tags sorted by frequency with counts
- `/api/items/backfill` endpoint: re-classifies all items with empty tags using AI; accessible via "✦ Fix tags" button in the feed header
- Delete button now visible in edit mode on the item detail page

### Fixed
- Clicking "Edit" on a card now opens the item directly in edit mode (no double-click)
- Duplicate prevention added to `POST /api/items` (CaptureForm path was missing the check)
- AI classification now always runs on every insert — removed the "skip AI when type+tags preset" branch; ensures all items get standardized tags regardless of ingestion source
- Drafts flush scripts updated to include `pattern` in TYPE_MAP

### Changed
- Tag cloud replaced with a single-line horizontal scroll strip (hides scrollbar, no wrapping)

---

## [Unreleased] - 2026-04-24

### Added
- Telegram linking: integrations page now fetches and displays the bot username (@botname) with a direct t.me link and numbered step-by-step setup instructions
- Config API exposes `telegramBotUsername` via a live call to Telegram's `getMe`

### Fixed
- Items from Drafts with a preset type but no tags were skipping AI entirely — now AI always runs for tags and summary; preset type/author/title still override AI output
- Tags from Drafts actions now always populated (either from AI or explicit tags in payload)

### Changed
- AI system prompt: enforced a controlled tag vocabulary (60+ canonical tags across 8 categories), lowercase-only, no type/author names as tags, deduplication rules
- Title generation: max 7 words, no leading articles
- Summary: must not restate the title; short content (< 180 chars) used verbatim

---

## [Unreleased] - 2026-04-23

### Added
- `summary` field on all items: a concise 1-2 sentence version of the content, used in ntfy notifications instead of the full body
- AI classifier now generates a `summary` on every new item: short content (< 160 chars) uses the content itself; long content gets a distilled insight
- Backfilled all 22 existing items with hand-crafted summaries
- DB auto-migration adds `summary TEXT` column on startup (idempotent)

### Changed
- Notifications now send `summary` (or `body` as fallback) instead of the full body — removed redundant bold title from notification text
- `classifyItem` return type extended with `summary: string`

---

## [Unreleased] - 2026-04-22 (session 3)

### Added
- `Lesson` and `Habit` as new item types, added everywhere: DB schema enum, AI classifier prompt/definitions, ingest validation, Notion sync, all API routes, scheduler, feed filters, capture form, item detail page, reminders type filter, and Drafts integrations code
- Per-type emoji in ntfy notifications: Quote 💬, Affirmation ⭐, Story 📚, Thought 💭, Lesson 🎓, Habit 🌱
- Lesson/Habit color themes: rose (Lesson) and teal (Habit) across all UI components

### Changed
- Removed `#hashtag` lines from notification message body (tags no longer appended)
- Removed ntfy `Tags` sparkles header; replaced with per-type emoji tags
- Drafts TYPE_MAP updated to include `lesson` and `habit` as type keywords; `habit` removed from THEMATIC list

---

## [Unreleased] - 2026-04-22 (session 2)

### Added
- `daily_scatter` reminder mode: N random times per day, spread across 08:00–22:00, re-picked each morning at midnight
- `count` column on `reminder_schedules` table to store times-per-day for scatter mode

### Changed
- Reminders page fully redesigned: replaced 4-mode toggle with 3 simple questions (how many / when / what)
- Removed Telegram status and iOS Shortcuts sections from reminders page (belong in Integrations)

### Fixed
- **Recurring crashes (SIGSEGV exit 139):** tsx v4.21 was crashing on pi5 ARM64 every 30–110 min with no trace. Fixed by compiling server.ts to server.compiled.js at build time (esbuild, CJS, packages external) and running plain `node server.compiled.js` — no tsx at runtime.

---

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
