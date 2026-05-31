# Lumina Project Mandates

This file contains foundational mandates and conventions for the Lumina project.

## Content Architecture

### Item Types
The `ITEM_TYPES` constant in `lib/types.ts` is the single source of truth for allowed item types.
- **Advice**: Use this for practical guidance, suggestions, or wisdom for action. It is preferred for business, career, and marketing content.
- **Quote, Affirmation, Story, Thought, Lesson, Habit**: Standard structural types.

### Tagging Rules
- **Buddhist Content**: All content authored by or related to Buddhist teachers (e.g., Ajahn Chah, Ajahn Brahm) MUST be tagged with `buddhism`.
- **Business/Career**: Items classified as `Advice` related to work or strategy should be tagged with `business`.
- **Vocabulary**: Always check `lib/ai/claude.ts` for the current tag vocabulary before suggesting new tags in the AI prompts.

## Development & Deployment

### Versioning
- Versioning is managed in `package.json`.
- Every deployment requires a version bump and an entry in `CHANGELOG.md`.
- Use `./deploy.sh` to build and sync to the Raspberry Pi production server.

### Database
- The production database is SQLite (`lumina.db`).
- Schema updates must be added to `ensureSchema` in `lib/db/client.ts` to ensure automatic migration.
- Malformed JSON in the `tags` column will break the search API; always validate JSON before updating tags manually.
