# Embedding Search Integration for search_clones

**Goal:** Most relevant personas based on customer prompt. User input can be weird/freeform.

**Current problem:** Sequential demographic filters (age first, then interests) can leave too few personas. Restricting by age first may not leave enough to match against interests.

**Interests vs embedding:** Both capture "topic" — interests are explicit tags, embedding captures semantic meaning from interaction_history. Overlap is real; need a clear strategy.

---

## Options

### A. Embedding-first (single shot)

- User prompt → embed → `match_persona_embeddings` → get chunks → aggregate by `persona_id` (max/avg similarity) → return top N personas
- Demographics: optional filter applied *after* embedding results
- **Pros:** Handles weird input. No sequential filter problem. One query.
- **Cons:** Ignores explicit demographics when user says "engineers in Seattle" unless we filter post-embed.

### B. Embedding first, demographics as post-filter

- Embed prompt → get top K chunks (e.g. 50–100) → dedupe to persona_ids
- Apply demographic filters on those persona_ids
- If result < N: relax filters or return embedding-only
- **Pros:** Embedding gives broad pool; demographics narrow when user is specific.
- **Cons:** Need to pick K. Relax logic adds complexity.

### C. Demographics first, embedding for ranking

- Apply demographic filters → get candidate set
- Rank by embedding similarity within that set
- **Pros:** Respects hard constraints.
- **Cons:** Same sequential problem — filter first can yield 0 or very few rows.

### D. RRF (Reciprocal Rank Fusion)

- Run embedding search → ranked list A
- Run demographic search → ranked list B
- Fuse ranks
- **Pros:** Best of both.
- **Cons:** Two queries, more logic, need scoring for demographic match.

### E. Embedding + demographics in one tool, LLM chooses

- `search_clones` accepts: `query` (freeform) + optional `demographic_filters`
- When `query` present: embed → get chunks → aggregate by persona_id
- When `demographic_filters` present: filter embedding results (or run both and merge)
- **Pros:** One tool, flexible. LLM can pass full prompt as query.
- **Cons:** Tool logic gets more complex.

---

## Recommended: A with optional post-filter (B-lite)

**Flow:**
1. `search_clones` gets `query` (required) + optional `demographic_filters` + `count`
2. Call embed Edge Function with `query` → get chunks
3. Aggregate chunks by `persona_id`: keep best similarity per persona (or avg)
4. Sort by similarity, take top `count * 2` or `count * 3` (buffer)
5. If `demographic_filters` provided: filter this list by demographics
6. Return top `count` personas

**Interests:** Drop from `search_clones` when using embedding. Embedding already captures topics from interaction_history. If we need explicit topic boost later, we can add it.

**Fallback:** If embed fails or returns 0 chunks, fall back to current demographic-only search (for backwards compatibility).

---

## Implementation sketch

1. **search_clones** schema change:
   - Add `query: string` (required when using embedding path)
   - Keep `demographic_filters` optional
   - Keep `count` optional (default 5)

2. **New flow in searchClones():**
   - If `query` provided: call `POST /functions/v1/embed` with `{ input: query }` → get chunks
   - Aggregate chunks by persona_id (max similarity)
   - Fetch persona rows for those ids
   - Apply demographic filters if provided
   - Return top N

3. **LLM prompt update:** Tell Capybara to pass the user's raw prompt (or a cleaned version) as `query` to search_clones, plus any extracted demographics as optional filters.

4. **Backward compat:** If `query` is empty/missing, use current demographic-only path.

---

## Implemented (2025-03)

- **Single SQL RPC:** `search_personas_semantic` — one query: embedding + demographics. Migration: `docs/migrations/011-search-personas-semantic.sql`
- **Embed Edge Function:** Accepts `input`, `count`, `match_threshold`, optional demographics. Returns `{ personas }`.
- **search_clones:** When `query` provided → embed path. When no query → demographic-only.
- **LLM prompt:** Translate user intent to keywords (don't dump raw input). Examples: "hate Atomic" → "hate Atomic design, minimal UI, design systems criticism". `match_threshold` adjustable for too loose/too strict.
