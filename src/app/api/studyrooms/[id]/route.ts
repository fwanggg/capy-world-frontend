import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireApproval } from "@/lib/auth";
import { log } from "@/lib/logging";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const { id } = await params;

    const { data: studyroom, error } = await supabase
      .from("studyrooms")
      .select("id, name, display_name, session_id, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !studyroom) {
      return NextResponse.json(
        { error: "Studyroom not found" },
        { status: 404 }
      );
    }

    let session = null;
    if (studyroom.session_id) {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id, mode, active_clones, metadata")
        .eq("id", studyroom.session_id)
        .single();
      session = data;
    }

    return NextResponse.json({ ...studyroom, session });
  } catch (error) {
    console.error("[STUDYROOMS] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get studyroom" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("studyrooms")
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Studyroom not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[STUDYROOMS] Rename error:", error);
    return NextResponse.json(
      { error: "Failed to rename studyroom" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const { id } = await params;

    const { data: studyroom, error: srFetchError } = await supabase
      .from("studyrooms")
      .select("id, name, display_name, session_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (srFetchError || !studyroom) {
      return NextResponse.json(
        { error: "Studyroom not found" },
        { status: 404 }
      );
    }

    let sessionId: string | null = studyroom.session_id;
    let threadId: string | null = null;

    if (sessionId) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("id, metadata")
        .eq("id", sessionId)
        .single();

      if (session?.metadata?.thread_id) {
        threadId = session.metadata.thread_id as string;
      }
    }

    const { error: deleteError } = await supabase
      .from("studyrooms")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    if (threadId) {
      await supabase.from("checkpoint_blobs").delete().eq("thread_id", threadId);
      await supabase.from("checkpoint_writes").delete().eq("thread_id", threadId);
    }

    if (sessionId) {
      const { error: sessionError } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (sessionError) throw sessionError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as { message?: string };
    log.error(
      "studyrooms.delete_failed",
      `Studyroom delete failed: ${err?.message ?? String(error)}`,
      { userId }
    );
    return NextResponse.json(
      { error: "Failed to delete studyroom" },
      { status: 500 }
    );
  }
}
