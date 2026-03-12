/**
 * One-time (re-runnable) script to embed persona interaction_history into persona_embeddings.
 *
 * Usage:
 *   npx tsx backend/src/scripts/embed-personas.ts
 *
 * Requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env
 * Embeddings generated locally via Transformers.js (no API key needed).
 */

import 'dotenv/config'
import { supabase } from 'shared'
import { embedTexts } from '../services/llm'

const BATCH_SIZE = 50
const MIN_CHUNK_LENGTH = 30

interface HistoryItem {
  type?: string
  content?: string
  subreddit?: string
  score?: number
  created_at?: string
  content_id?: string
  replying_to_ref?: string
}

/**
 * Turn a persona's interaction_history JSONB into an array of text chunks.
 * Each post/comment becomes its own chunk so diverse topics get separate vectors.
 * Very short items are grouped together to avoid noise.
 */
function chunkInteractionHistory(history: any): string[] {
  const chunks: string[] = []
  let shortBuffer = ''

  const flush = () => {
    if (shortBuffer.length >= MIN_CHUNK_LENGTH) {
      chunks.push(shortBuffer.trim())
    }
    shortBuffer = ''
  }

  const processItems = (items: HistoryItem[]) => {
    for (const item of items) {
      const sub = item.subreddit ? `[r/${item.subreddit}] ` : ''
      const content = item.content || ''
      const text = `${sub}${content}`.trim()

      if (text.length < MIN_CHUNK_LENGTH) {
        shortBuffer += (shortBuffer ? '\n' : '') + text
      } else {
        flush()
        chunks.push(text)
      }
    }
  }

  if (Array.isArray(history?.posts)) processItems(history.posts)
  if (Array.isArray(history?.comments)) processItems(history.comments)

  flush()
  return chunks
}

const PAGE_SIZE = 100

async function fetchAlreadyEmbedded(): Promise<Set<number>> {
  const ids = new Set<number>()
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('persona_embeddings')
      .select('persona_id')
      .range(offset, offset + PAGE_SIZE - 1)
    if (!data || data.length === 0) break
    for (const r of data) ids.add(r.persona_id)
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return ids
}

async function main() {
  console.log('[EMBED] Starting persona embedding ingestion...')

  // Find personas that already have embeddings (for incremental runs)
  const alreadyEmbedded = await fetchAlreadyEmbedded()
  console.log(`[EMBED] ${alreadyEmbedded.size} personas already have embeddings`)

  let totalChunks = 0
  let totalPersonas = 0
  let skipped = 0
  let offset = 0

  // Paginate through personas to avoid statement timeout on large tables
  while (true) {
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, reddit_username, interaction_history')
      .not('interaction_history', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error(`[EMBED] Failed to fetch personas at offset ${offset}:`, error)
      process.exit(1)
    }

    if (!personas || personas.length === 0) break

    for (const persona of personas) {
      if (alreadyEmbedded.has(persona.id)) {
        skipped++
        continue
      }

      const chunks = chunkInteractionHistory(persona.interaction_history)
      if (chunks.length === 0) continue

      console.log(`[EMBED] Persona ${persona.id} (${persona.reddit_username}): embedding ${chunks.length} chunks...`)

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        const vectors = await embedTexts(batch)

        const rows = batch.map((text, idx) => ({
          persona_id: persona.id,
          chunk_text: text,
          embedding: JSON.stringify(vectors[idx]),
        }))

        const { error: insertError } = await supabase
          .from('persona_embeddings')
          .insert(rows)

        if (insertError) {
          console.error(`[EMBED] Insert error for persona ${persona.id}:`, insertError)
        }
      }

      totalChunks += chunks.length
      totalPersonas++
      console.log(`[EMBED] Persona ${persona.id}: ${chunks.length} chunks embedded (total: ${totalPersonas} personas, ${totalChunks} chunks)`)
    }

    if (personas.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    console.log(`[EMBED] Fetching next page (offset ${offset})...`)
  }

  console.log(`\n[EMBED] Done! Embedded ${totalChunks} chunks across ${totalPersonas} personas (${skipped} already had embeddings)`)
  process.exit(0)
}

main().catch((err) => {
  console.error('[EMBED] Fatal error:', err)
  process.exit(1)
})
