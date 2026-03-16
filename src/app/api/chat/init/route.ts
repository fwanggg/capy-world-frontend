import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireApproval } from "@/lib/auth";
import { log } from "@/lib/logging";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const body = await req.json();
    const { mode, studyroom_id } = body;

    if (!mode || !["god", "conversation"].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "god" or "conversation"' },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("waitlist")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not on waitlist. Please sign up at /waitlist first." },
        { status: 403 }
      );
    }

    if (studyroom_id) {
      const { data: studyroom, error: srError } = await supabase
        .from("studyrooms")
        .select("session_id")
        .eq("id", studyroom_id)
        .eq("user_id", userId)
        .single();

      if (!srError && studyroom?.session_id) {
        const { data: existingSession, error: sessError } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("id", studyroom.session_id)
          .single();

        if (!sessError && existingSession) {
          return NextResponse.json(existingSession);
        }
      }
    }

    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single();

    if (error) throw error;

    log.info("chat.session_init", `Session initialized with mode: ${mode}`, {
      userId,
      metadata: { sessionId: session.id, mode },
    });

    return NextResponse.json(session);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error("chat.init_failed", errorMsg, { userId });
    return NextResponse.json(
      { error: "Failed to initialize chat", details: errorMsg },
      { status: 500 }
    );
  }
}
