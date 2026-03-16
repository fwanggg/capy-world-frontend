import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { wouldExceedPersonaLimit } from "@/lib/persona-limit";

export async function PUT(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  try {
    const body = await req.json();
    const { session_id, clone_ids } = body;

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", session_id)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const ids = Array.isArray(clone_ids) ? clone_ids : [];
    const limitCheck = await wouldExceedPersonaLimit(userId, session_id, ids.length);
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.message, limit: limitCheck.limit, total: limitCheck.total },
        { status: 403 }
      );
    }

    const mode = ids.length > 0 ? "conversation" : "god";

    const { data: updated, error } = await supabase
      .from("chat_sessions")
      .update({ active_clones: ids, mode })
      .eq("id", session_id)
      .select()
      .single();

    if (error) throw error;

    let clone_names: string[] = [];
    if (ids.length > 0) {
      const { data: clones, error: clonesError } = await supabase
        .from("personas")
        .select("anonymous_id")
        .in("id", ids);

      if (!clonesError && clones) {
        clone_names = clones.map((c: { anonymous_id: string }) => c.anonymous_id);
      }
    }

    return NextResponse.json({ ...updated, clone_names });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
