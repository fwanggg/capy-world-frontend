import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = await req.json();
    const { query, limit = 100 } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const { data: clones, error } = await supabase
      .from("agent_memory")
      .select("id, reddit_username, system_prompt")
      .ilike("reddit_username", `%${query}%`)
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      query,
      count: clones?.length || 0,
      clones,
    });
  } catch (error) {
    console.error("Clone search error:", error);
    return NextResponse.json(
      { error: "Failed to search clones" },
      { status: 500 }
    );
  }
}
