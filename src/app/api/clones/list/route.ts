import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("active_clones")
      .eq("id", session_id)
      .single();

    if (sessionError) throw sessionError;

    const cloneIds = (session?.active_clones as string[]) || [];

    if (cloneIds.length === 0) {
      return NextResponse.json({ clones: [] });
    }

    const { data: clones, error } = await supabase
      .from("agent_memory")
      .select("id, reddit_username, system_prompt")
      .in("id", cloneIds);

    if (error) throw error;

    return NextResponse.json({ clones });
  } catch (error) {
    console.error("Clone list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clones" },
      { status: 500 }
    );
  }
}
