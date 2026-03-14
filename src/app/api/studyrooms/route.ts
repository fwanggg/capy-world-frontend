import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireApproval } from "@/lib/auth";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const { data, error } = await supabase
      .from("studyrooms")
      .select("id, name, display_name, session_id, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[STUDYROOMS] List error:", error);
    return NextResponse.json(
      { error: "Failed to list studyrooms" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const body = await req.json();
    let { name } = body;

    if (!name) {
      const { count } = await supabase
        .from("studyrooms")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      name = `Studyroom ${(count ?? 0) + 1}`;
    }

    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        mode: "god",
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw sessionError ?? new Error("Failed to create session");
    }

    const { data: studyroom, error } = await supabase
      .from("studyrooms")
      .insert({
        user_id: userId,
        name,
        display_name: body.name ? name : null,
        session_id: session.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...studyroom, session });
  } catch (error) {
    console.error("[STUDYROOMS] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create studyroom" },
      { status: 500 }
    );
  }
}
