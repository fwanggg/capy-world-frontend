// Edge Function: Populate persona_embeddings from personas.interaction_history
// Invoke from Supabase Dashboard → Edge Functions → embed-personas → Invoke
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const session = new Supabase.ai.Session("gte-small");
const MAX_CHUNK_CHARS = 500; // gte-small truncates at 512 tokens; ~500 chars is safe

function extractChunks(history: unknown): string[] {
  if (!history || typeof history !== "object") return [];
  const parsed = typeof history === "string"
    ? (() => { try { return JSON.parse(history) } catch { return {} } })()
    : history as Record<string, unknown>;

  const chunks: string[] = [];
  const textFrom = (obj: unknown): string => {
    if (!obj || typeof obj !== "object") return "";
    const o = obj as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof o.title === "string") parts.push(o.title);
    if (typeof o.selftext === "string") parts.push(o.selftext);
    if (typeof o.body === "string") parts.push(o.body);
    if (typeof o.content === "string") parts.push(o.content);
    return parts.join(" ").trim();
  };

  const posts = Array.isArray(parsed.posts) ? parsed.posts : [];
  const comments = Array.isArray(parsed.comments) ? parsed.comments : [];

  for (const p of posts) {
    const t = textFrom(p);
    if (t.length >= 20) {
      chunks.push(t.length > MAX_CHUNK_CHARS ? t.slice(0, MAX_CHUNK_CHARS) + "…" : t);
    }
  }
  for (const c of comments) {
    const t = textFrom(c);
    if (t.length >= 20) {
      chunks.push(t.length > MAX_CHUNK_CHARS ? t.slice(0, MAX_CHUNK_CHARS) + "…" : t);
    }
  }

  // If no posts/comments, try raw JSON string as fallback (truncated)
  if (chunks.length === 0 && (posts.length > 0 || comments.length > 0)) {
    const raw = JSON.stringify(parsed);
    if (raw.length >= 50) {
      chunks.push(raw.slice(0, MAX_CHUNK_CHARS) + (raw.length > MAX_CHUNK_CHARS ? "…" : ""));
    }
  }
  return chunks;
}

/** Build a fallback chunk from demographics when interaction_history has no text */
function fallbackChunk(persona: { profession?: string; location?: string; interests?: unknown }): string | null {
  const parts: string[] = [];
  if (persona.profession) parts.push(`profession: ${persona.profession}`);
  if (persona.location) parts.push(`location: ${persona.location}`);
  if (Array.isArray(persona.interests)) {
    const names = persona.interests.map((i) => (typeof i === "object" && i && "name" in i ? (i as { name: string }).name : String(i)));
    if (names.length) parts.push(`interests: ${names.join(", ")}`);
  }
  return parts.length >= 1 ? parts.join(". ") : null;
}

Deno.serve(async (req) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { persona_ids?: number[] };
    const personaIds = Array.isArray(body?.persona_ids) && body.persona_ids.length > 0
      ? body.persona_ids
      : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase.from("personas").select("id, interaction_history, profession, location, interests");
    if (personaIds) query = query.in("id", personaIds);

    const { data: personas, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch personas: ${fetchError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!personas?.length) {
      return new Response(
        JSON.stringify({ message: "No personas found", embedded: 0, chunks: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete existing embeddings for personas we're re-embedding
    const ids = personas.map((p) => p.id);
    await supabase.from("persona_embeddings").delete().in("persona_id", ids);

    let totalChunks = 0;
    for (const p of personas) {
      let chunks = extractChunks(p.interaction_history);
      if (chunks.length === 0) {
        const fb = fallbackChunk(p);
        if (fb) chunks = [fb];
      }
      for (const chunk of chunks) {
        const embedding = await session.run(chunk, {
          mean_pool: true,
          normalize: true,
        });
        const { error: insertError } = await supabase.from("persona_embeddings").insert({
          persona_id: p.id,
          chunk_text: chunk,
          embedding,
        });
        if (insertError) {
          console.error(`Insert error for persona ${p.id}:`, insertError);
          continue;
        }
        totalChunks++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Embeddings populated",
        personas_processed: personas.length,
        chunks_embedded: totalChunks,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("embed-personas error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
