# Changelog

All notable changes to Lumina will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [Unreleased] - 2026-04-18

### Added
- Initial MVP: Next.js 16 + Tailwind web app on pi5 port 3009
- SQLite + Drizzle ORM local database with items and sync_meta tables
- Claude Haiku AI auto-classification with prompt caching (type, author, tags, title)
- Notion bidirectional sync — push unsynced items, pull Notion edits back every 15 min
- Feed view with full-text search and type filter (All / Quote / Affirmation / Story / Thought)
- Dark editorial capture screen with AI classify button
- Item detail page with inline edit and delete
- REST API: GET/POST /api/items, GET/PUT/DELETE /api/items/[id], POST /api/classify, POST /api/sync
- deploy.sh and lumina.service for pi5 deployment
- nginx-proxy /lumina route added and deployed
- GitHub repo: uca100/lumina-app
