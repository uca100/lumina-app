# Changelog

All notable changes to Lumina are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased] - 2026-04-18

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
