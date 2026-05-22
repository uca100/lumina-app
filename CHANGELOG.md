# Changelog

All notable changes to Lumina are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.3.0] - 2026-05-23

### Added
- Search now also matches by tag name — the `q` text search unions FTS results with a direct `LIKE` on the tags column, so typing a tag name in the search box reliably surfaces items with that tag

### Fixed
- Share links (`/view/[id]`) now work for anonymous users — added nginx bypasses for `/lumina/_next/` (JS assets) and `/lumina/api/items/[id]/public` (item data API) so the view page loads fully without a Tailscale auth-gateway session

## [1.2.1] - 2026-05-21

### Fixed
- Bulk import now preserves newlines from Telegram `/bulk` command — previously `split(/\s+/)` collapsed multi-line text into one line before preprocessing, so table detection never fired
- Markdown pipe-table pre-processing in `bulkSave` now correctly converts `|col|col|col|` rows into clean readable text before AI extraction

## [1.2.0] - 2026-05-21

### Added
- **Telegram bot commands** — full command set: `/random [type]`, `/today`, `/last [n]`, `/stats`, `/search <query>`, `/help`, plus type-specific save commands (`/quote`, `/lesson`, `/thought`, `/story`, `/habit`, `/affirmation <text>`)
- **Bulk import** — `/bulk <text>` on Telegram and `lumina bulk` email subject: AI splits a wall of text into individual items and saves them all to the review queue. Auto-batches texts up to 16,000 chars
- **Telegram integration live** — bot token + webhook configured, chat ID auto-assigned on first message
- **Email integration live** — Gmail IMAP polling every 15 min; emails with `lumina` in subject or body are saved + marked read + labeled; all others untouched
- **`bulkExtract` AI function** — separate Claude Haiku call with a prompt tuned for splitting multi-item text into a JSON array
- **`savePreclassified`** — bypasses AI for bulk items already classified, saves directly to DB as review

### Changed
- **Integrations page** fully rewritten — status badges (connected/not), commands reference, email trigger docs, bulk import docs, Drafts scripts updated (removed deprecated `pattern` type), iOS Shortcuts section improved

### Fixed
- Email ingest no longer hangs when Gmail label doesn't exist (was blocking on `getMailboxLock` for non-existent label)

## [1.1.2] - 2026-05-19

### Fixed
- Shortcut ingest endpoint now always lets AI generate the title — any incoming `title` field
  in the payload is ignored, making the fix robust even for old Drafts scripts that still send
  `draft.title` (the first line of the body)

## [1.1.1] - 2026-05-18

### Added
- `components/ShareButtons.tsx` — generic Copy/Share component (light + dark variants)
  used in ItemCard, item detail page, and public view page
- Public view page (`/view/<id>`) now shows creation date and Copy/Share buttons
- Item detail page (`/item/<id>`) now has Copy/Share buttons below tags
- Admin nav link (⚙) added to main header
- Users page back link now points to `/admin` instead of home

### Fixed
- AI classification failures now log to server console (`[classifyAndSave] AI classification failed`)
  instead of being swallowed silently
- Drafts action scripts no longer send `title` in the payload — AI always generates
  a proper short title instead of duplicating the body's first line
- Backfill (`/admin` → Run backfill) now also fixes items where the title is a
  verbatim copy of the body opening, not just items with empty tags

---

## [1.1.0] - 2026-05-18

### Added
- Item sharing: Copy and Share buttons appear on hover for every item card
  - **Copy** copies formatted text (title, body, author, "✦ Lumina") to clipboard
  - **Share** copies a public link `https://myweb.../lumina/view/<id>` to clipboard
- Public item view at `/view/<id>` — no authentication required, safe because item IDs are unguessable 21-char nanoids
- Public API endpoint `GET /api/items/<id>/public` — no-auth, returns item JSON for the shared view
- Rate limiting on all 4 ingest endpoints (20 req/60s per bearer token, returns 429)
- nginx: `/lumina/view/` bypass block (no auth_request) added before main auth-gated location
- Lumina proxy: `/view/` added to `PUBLIC_PATHS`
- SQLite WAL integrity check: weekly Sunday cron on Pi5 at 04:30, alerts Telegram on failure

---

## [1.0.3] - 2026-05-18

### Added
- Export endpoint `GET /api/export` — downloads all published items as `lumina-export-YYYY-MM-DD.json`; auth-gated
- Export button on `/admin` page
- Weekly digest: every Sunday at 20:00 sends ntfy to all users with an ntfyTopic — item count, type breakdown, and a spotlight item

### Fixed
- AI classification failure now routes item to `review` queue instead of silently saving as type `Thought`
- `Pattern` type fully removed from AI classifier prompt and type unions in `lib/ai/claude.ts`

---

## [1.0.0] - 2026-05-18

### Added
- Full-text search (SQLite FTS5) across title, body, and tags — replaces LIKE substring search
- `items_fts` virtual table with triggers to keep index in sync on insert/update/delete
- FTS index auto-populated from existing items on first start
- `rawDb()` export from `lib/db/client.ts` for raw SQLite access
- Uptime Kuma monitor for Lumina (60s interval, checks `/lumina/api/version`)

### Changed
- Search query split into quoted tokens for AND matching; falls back to LIKE on parse error

---

## [0.9.9] - 2026-05-18

### Added
- Admin index page at `/admin` with backfill tool (re-classify untagged items)

### Changed
- `ITEM_TYPES` centralised into `lib/types.ts` — single source of truth for all pages
- Removed `Pattern` type (zero items, never used) from all type lists and accent/badge maps

### Removed
- Backfill button removed from main feed header — moved to `/admin`

---

## [0.9.8] - 2026-05-18

### Added
- PWA support: `app/manifest.ts` with name, icons, standalone display, dark theme color
- Apple-specific meta tags in `layout.tsx` (`apple-mobile-web-app-capable`, status bar, touch icon)
- App icons: 192×192, 512×512 PNG and 180×180 apple-touch-icon generated from SVG
- nginx: `/lumina/manifest.webmanifest` and `/lumina/icons/` bypass auth-gateway (required for browser install prompt)
- Lumina proxy: `/manifest.webmanifest` and `/icons/` added to `PUBLIC_PATHS`

---

## [0.9.7] - 2026-05-16

### Fixed
- Drafts app "Send to Lumina" and "Flush to Lumina" actions now work end-to-end
  - nginx: added `/lumina/api/ingest/` location that bypasses auth-gateway (ingest endpoints carry their own Bearer token auth)
  - AI model name corrected: `claude-haiku-4-5` → `claude-haiku-4-5-20251001`
  - `classifyAndSave` now catches AI classification failures and falls back to saving item as type Thought rather than returning 500
- ntfy notification links now open correctly: `jobs.ts` was building relative URLs when `NEXT_PUBLIC_BASE_URL` is unset — now falls back to `https://myweb.tail075174.ts.net`
- View page (`/view/[id]`) no longer shows "Item not found" when opened from ntfy: removed `/view/` from proxy `PUBLIC_PATHS` so unauthenticated requests go through auto-login and get a valid session before the page loads

### Changed
- Drafts integration scripts updated: full TYPE_MAP (all 7 types), THEMATIC = ["lessons", "inspiring"]
- Integrations page Drafts scripts updated to match

---

## [0.9.6] - 2026-05-15

### Added
- Auto-login via X-Auth-User header: when auth-gateway has already authenticated the user, Lumina's proxy redirects to /api/auth/auto-login instead of /login — no second username/password prompt
- New GET /api/auth/auto-login route: reads X-Auth-User set by nginx, looks up user in DB, signs JWT session cookie, redirects to original path
- Lumina now gated by nginx auth_request /auth/check — single login for all apps

---

## [0.9.5] - 2026-05-15

### Fixed
- DB crash recovery: all 234 items restored from Notion were stuck as `draft` — bulk-updated to `published` via direct sqlite3
- `pullFromNotion()` never set `status` on items it inserted or updated — items from Notion always get `status='published'` now (Notion only stores published items)
- `server.compiled.js` recompiled to include previously uncommitted changes (pagination + User field from v0.9.4)

---


## [Unreleased] - 2026-05-23

### Added
- install.sh: full idempotent setup script for fresh server restore
- Mirrored to ~/projects/install-scripts/lumina.sh
- Architecture diagram and folder structure added to Notion project page

## [Unreleased] - 2026-05-14

### Fixed
- Notion sync returning error after Pi5 recovery: wrong NOTION_API_KEY in .env.local — updated to correct integration key.
- `pullFromNotion()` was not paginating: only fetched first 100 items. Fixed with `do...while` cursor loop so all items are pulled (234 synced from Notion).

---

## [Unreleased] - 2026-05-10

### Changed
- One-time data operation: AI-classified and published all 24 inbox items (draft/review) — generated summaries and set status to published.
- One-time data operation: AI-generated fresh titles for all 242 items in the database using a dedicated title prompt.

---

## [0.9.3] - 2026-05-10

### Fixed
- Flush action (Drafts → Lumina) returning 401: `getUserByIngestKey` had no fallback for the legacy `INGEST_API_KEY` env var from pre-multi-user setup. Added fallback so existing Drafts actions still work without reconfiguration.

### Changed
- One-time AI backfill: generated proper short titles and summaries for all 48 draft/review items (43 stories, 2 quotes, 3 draft stories) that had body text as their title.

---

## [0.9.2] - 2026-05-09

### Fixed
- Login page redirect loop: proxy intercepted `/api/auth/me` (not in public paths), returned 307 → login page (200), so `fetch` resolved `r.ok=true` and `router.replace('/')` fired immediately — user was stuck looping before the form was usable. Fixed by letting all `/api/` routes through the proxy (they return 401 from their own handlers); also added `redirect:'manual'` to the auth check fetch as defense.

---

## [0.9.1] - 2026-05-08

### Fixed
- Proxy (auth middleware) now correctly intercepts unauthenticated requests — root cause was that matcher paths must be WITHOUT the basePath prefix (`/lumina`); Next.js prepends basePath at build time, so `/lumina/:path*` compiled to a regex matching `/lumina/lumina/:path*` (never matched anything)
- Redirect URL from proxy was doubled (`/lumina/lumina/login`) — fixed by setting `loginUrl.pathname = '/login'` (without basePath) since Next.js adds basePath automatically
- Added `Cache-Control: no-cache, no-store, must-revalidate` to nginx lumina block (matching health-os) to prevent cached responses from bypassing the proxy
- Backfilled all existing `reminder_schedules` rows with userId `uri` so per-user scheduling works correctly

---

## [0.9.0] - 2026-05-08

### Added
- Multi-user support: each user has private items + access to the shared item pool (userId IS NULL)
- User accounts with bcryptjs password hashing and JWT session cookies (7-day expiry)
- Per-user delivery: each user has their own `ntfyTopic` and `telegramChatId` in the users table
- Per-user affirmation order (stored per-user in syncMeta)
- Per-user reminder schedules with ownership verification
- Login page, setup bootstrap route (first user only), admin users page at `/admin/users`
- Item marks 1–3 (Low/Medium/High) for weighted random selection
- Weighted pick algorithm: mark-3 items appear 3× more than mark-1 in shuffle/reminders
- Inline mark toggle on Inbox cards; mark selector (Low/Med/High) on the edit page
- `UserBadge` component on all page headers — shows username + Sign out button
- Notion sync now restricted to shared items only (userId IS NULL)
- Ingest routes resolve user from ingestApiKey (shortcut) or chatId (Telegram) with backwards-compat fallback
- Replaced deprecated Next.js `middleware.ts` with `proxy.ts` (Next.js 16 convention)

## [0.8.1] - 2026-05-08

### Fixed
- All areas of the app now gate on `published` status only — affirmations page, shuffle/random, reminders/ntfy scheduler, and reminders random endpoint all skip draft/review items
- Main feed defaults to showing `published` items; status filter row still lets you browse draft/review
- Edit page from Inbox now shows "← Inbox" back button and returns to `/queue` instead of the feed
- Affirmations settings page bug: pinned items older than the 100-item API limit were invisible in the Daily Set — fixed by fetching pinned items separately with `?pinned=1` so all pinned items always load regardless of age

---

## [0.8.0] - 2026-05-07

### Added
- Item status system: `draft`, `review`, `published` — only `published` items sync to Notion
- Manual captures default to `draft`; ingested items (Telegram, email, WhatsApp, shortcut, voice) default to `review`
- Status badge on `ItemCard` (shown only for non-published items)
- Status selector in item edit form with color-coded buttons and descriptions
- Status filter row on main feed (`All / Draft / Review / Published`)
- Dedicated Inbox page (`/queue`) — shows pending-review and draft items grouped separately, with one-click **Publish**, **→ Draft**, **→ Review**, **Edit**, and **Delete** actions per item
- `PATCH /api/items/:id` endpoint for lightweight status-only updates
- `Status` property pushed to Notion alongside item data

---

## [0.7.5] - 2026-05-04

### Fixed
- ntfy notifications now show the correct Hebrew (and any non-ASCII) title instead of falling back to "Lumina" — switched from HTTP headers (ASCII-only) to ntfy's JSON API which handles Unicode natively

---

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
