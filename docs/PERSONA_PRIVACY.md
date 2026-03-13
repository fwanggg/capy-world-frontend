# Persona Privacy: anonymous_id

## Overview

Reddit usernames are never exposed to the frontend, LLM, or any external API. The app uses `anonymous_id` as the sole user-facing identifier for personas.

## anonymous_id

- **Formula:** `left(md5(reddit_username), 8)` (PostgreSQL)
- **Write path:** Hash only when inserting or backfilling a persona
- **Read path:** Use `anonymous_id` as-is; no rehashing

## Future Inserts

When inserting new rows into the `personas` table, **you must set `anonymous_id`**:

**SQL:**
```sql
INSERT INTO personas (reddit_username, anonymous_id, ...)
VALUES ('example_user', left(md5('example_user'), 8), ...);
```

**Or in application code (Node/TS):**
```ts
import { createHash } from 'crypto'
const anonymous_id = createHash('md5').update(reddit_username).digest('hex').slice(0, 8)
```

## Migration

Migrations are managed separately (not in repo). Schema: add `anonymous_id` column, backfill with `left(md5(reddit_username), 8)`.
