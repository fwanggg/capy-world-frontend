# Testing Semantic Search in Supabase

When `search_clones` returns 0 personas for a semantic query, use these steps to debug in Supabase.

## Auth: JWT validation inside function

Per [Supabase Edge Functions auth guide](https://supabase.com/docs/guides/functions/auth): we skip gateway JWT verification and validate **inside the function** via `supabase.auth.getClaims(token)`.

**Flow:**
1. Chat route passes user's `Authorization` header to orchestrator
2. `supabase.functions.invoke('embed', { headers: { Authorization } })` forwards it
3. Deploy with `--no-verify-jwt` so the gateway doesn't validate (we do it ourselves)
4. Embed function: extracts token → `getClaims(token)` → 401 if invalid → proceed if valid

**Deploy:**
```bash
supabase functions deploy embed --no-verify-jwt
```

**Secrets:** Add `SUPABASE_ANON_KEY` (or `SB_PUBLISHABLE_KEY`) to Edge Function secrets if not auto-injected.

The backend sends `X-API-Key: <EMBED_API_KEY>` when calling embed. If `EMBED_API_KEY` is not set in the function, the key check is skipped (backward compat).

## 401 Invalid JWT or Invalid API key

- **Invalid JWT:** Set `verify_jwt = false` in `config.toml` (already done) and use `EMBED_API_KEY` instead.
- **Invalid or missing API key:** Ensure `EMBED_API_KEY` is set in both Supabase secrets and `.env`, and they match.

## 0. Populate persona_embeddings (required first time)

**If `persona_embeddings` is empty, semantic search will always return 0.** Populate it using the `embed-personas` Edge Function:

1. **Deploy the function** (if not already):
   ```bash
   supabase functions deploy embed-personas
   ```

2. **Invoke from Supabase Dashboard:**
   - Go to **Edge Functions** → **embed-personas** → **Invoke**
   - Request body (optional): `{}` to embed all personas, or `{"persona_ids": [1, 2, 3]}` for specific IDs
   - Click **Invoke**

3. **Expected response:**
   ```json
   {"message":"Embeddings populated","personas_processed":N,"chunks_embedded":M}
   ```

4. **Verify** in SQL Editor: `SELECT count(*) FROM persona_embeddings;`

---

## 1. Check if persona_embeddings has data

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- How many embedding chunks exist?
SELECT count(*) AS total_chunks, count(DISTINCT persona_id) AS personas_with_embeddings
FROM persona_embeddings;

-- Sample of what's stored
SELECT persona_id, left(chunk_text, 80) AS chunk_preview
FROM persona_embeddings
LIMIT 5;
```

**If `total_chunks` is 0:** Embeddings were never generated. You need to run the embed-personas script (or equivalent) to populate `persona_embeddings` from `personas.interaction_history` before semantic search will work.

---

## 2. Check personas table

```sql
SELECT id, anonymous_id, profession, location, 
       jsonb_array_length(COALESCE(interaction_history->'posts', '[]'::jsonb)) AS post_count
FROM personas
LIMIT 10;
```

Confirm personas exist and have `interaction_history` (or similar content) that can be embedded.

---

## 3. Test the embed Edge Function directly

Get your Supabase project URL and service role key from **Project Settings → API**.

```bash
# Replace with your values
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SERVICE_ROLE_KEY="eyJ..."

curl -X POST "$SUPABASE_URL/functions/v1/embed" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "automation tools productivity workflow",
    "count": 10,
    "match_threshold": 0
  }'
```

**`match_threshold: 0`** returns all matches (no similarity cutoff), so you can see if any personas are found at all. If you get `personas: []` with threshold 0, the issue is likely empty `persona_embeddings` or embedding model mismatch.

---

## 4. Inspect raw similarities (no threshold)

Add a debug RPC to see actual similarity scores. In **SQL Editor**, run:

```sql
-- One-time: create debug function that ignores threshold
create or replace function search_personas_semantic_debug(
  p_query_embedding vector(384),
  p_match_count int default 20
)
returns table (
  id integer,
  anonymous_id text,
  similarity float,
  chunk_sample text
)
language plpgsql
as $$
begin
  return query
  with best_per_persona as (
    select
      pe.persona_id,
      min(pe.embedding <=> p_query_embedding) as distance
    from persona_embeddings pe
    group by pe.persona_id
  )
  select
    p.id,
    p.anonymous_id,
    (1 - b.distance)::float as similarity,
    (select left(pe2.chunk_text, 60) from persona_embeddings pe2 
     where pe2.persona_id = p.id 
     order by pe2.embedding <=> p_query_embedding 
     limit 1) as chunk_sample
  from best_per_persona b
  join personas p on p.id = b.persona_id
  order by b.distance asc
  limit least(p_match_count, 100);
end;
$$;
```

You still need a `vector(384)` to call this. Get one by temporarily modifying the embed function to return the embedding, or by calling it from a small script.

---

## 5. Quick script: get embedding and run debug search

Save as `scripts/test-semantic-search.ts` (or `.js`) and run with `npx tsx`:

```typescript
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
const url = process.env.SUPABASE_URL!.replace(/\/$/, '') + '/functions/v1/embed';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 1. Call embed with threshold 0 to see raw results
const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'automation tools productivity workflow',
    count: 20,
    match_threshold: 0,  // no cutoff - see everything
  }),
});
const data = await res.json();
console.log('Embed response:', JSON.stringify(data, null, 2));
```

Run with `match_threshold: 0` first. If you get personas, the search works and the original threshold (0.25) was too strict. If you still get 0, `persona_embeddings` is likely empty.

---

## 6. Common causes of 0 results

| Cause | Fix |
|-------|-----|
| `persona_embeddings` empty | Invoke `embed-personas` Edge Function (see section 0 above) |
| `match_threshold` too high | Try 0.1 or 0 in the embed call |
| Embedding model mismatch | Ensure embed function and embed script both use `gte-small` (384 dims) with `normalize: true` |
| Query too keyword-heavy | Simplify query, e.g. "automation productivity" instead of a long list |

---

## 7. Verify migration 011 is applied

```sql
-- Check if search_personas_semantic exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'search_personas_semantic';
```

If empty, run `docs/migrations/011-search-personas-semantic.sql` in the SQL Editor.
