// Edge Function: input text → output personas (embed + semantic search with optional demographic filters in one call)
// Auth: Per https://supabase.com/docs/guides/functions/auth — validate JWT inside function via getClaims.
// Deploy with --no-verify-jwt; we own auth validation.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

function errResponse(message: string, status: number, code?: string) {
  return new Response(
    JSON.stringify({ error: message, code: code ?? `embed_${status}` }),
    { status, headers: CORS }
  );
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SB_PUBLISHABLE_KEY");
    if (!supabaseUrl || !anonKey) {
      console.error("Embed: Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return errResponse("Embed service misconfigured", 500, "embed_config");
    }

    const supabase = createClient(supabaseUrl, anonKey);

    // Validate JWT per auth guide — getClaims validates the token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return errResponse("Missing Authorization header", 401, "embed_unauthorized");
    }

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Embed: getClaims failed", claimsError?.message ?? "no claims");
      return errResponse("Invalid JWT", 401, "embed_invalid_jwt");
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errResponse("Invalid JSON body", 400, "embed_bad_request");
    }

    const { input, count = 10, match_threshold = 0.3, age_min, age_max, profession, gender, location, spending_power, interests } = body;

    if (!input || typeof input !== "string") {
      return errResponse("Missing or invalid 'input' string", 400, "embed_bad_input");
    }

    let embedding: number[];
    try {
      const session = new Supabase.ai.Session("gte-small");
      embedding = await session.run(input, {
        mean_pool: true,
        normalize: true,
      });
    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error("Embed: AI session.run failed", msg);
      return errResponse(`Embedding failed: ${msg}`, 503, "embed_ai_error");
    }

    const supabaseWithUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: personas, error } = await supabaseWithUser.rpc("search_personas_semantic", {
      p_query_embedding: embedding,
      p_match_count: count,
      p_match_threshold: match_threshold,
      p_age_min: age_min ?? null,
      p_age_max: age_max ?? null,
      p_profession: profession ?? null,
      p_gender: gender ?? null,
      p_location: location ?? null,
      p_spending_power: spending_power ?? null,
      p_interests: Array.isArray(interests) && interests.length > 0 ? interests : null,
    });

    if (error) {
      console.error("Embed: RPC error", error.message, error);
      return errResponse(`Search failed: ${error.message}`, 500, "embed_rpc_error");
    }

    return new Response(
      JSON.stringify({ personas: personas ?? [] }),
      { headers: CORS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Embed: unexpected error", msg, stack);
    return errResponse(`Unexpected error: ${msg}`, 500, "embed_unexpected");
  }
});
