import { NextResponse } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireApproval } from "@/lib/auth";
import { callCapybaraAI, callMultipleClones } from "@/lib/langgraph-orchestrator";
import { log } from "@/lib/logging";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const approvalError = await requireApproval(req, userId);
  if (approvalError) return approvalError;

  try {
    const body = await req.json();
    const { session_id, content, target_clones, target } = body;
    const wantsStream = !!body.stream;

    if (!session_id || !content) {
      return NextResponse.json(
        { error: "Missing session_id or content" },
        { status: 400 }
      );
    }

    const result = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", userId)
      .single();

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to fetch session", details: result.error.message },
        { status: 500 }
      );
    }

    const session = result.data;
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const msgResult = await supabase
      .from("chat_messages")
      .insert({
        session_id,
        role: "user",
        sender_id: userId,
        content,
      })
      .select()
      .single();
    if (msgResult.error) throw msgResult.error;
    const userMessage = msgResult.data;

    const { data: lastMessagesData } = await supabase
      .from("chat_messages")
      .select("role, sender_id, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .limit(20);
    const lastMessages = lastMessagesData || [];

    const messageHistory = lastMessages.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    );

    const labeledHistory = lastMessages
      .map((msg) => {
        if (msg.role === "user") return `[USER]: ${msg.content}`;
        if (msg.role === "capybara") return `[CAPYSAN]: ${msg.content}`;
        if (msg.role === "clone") return `[CLONE ${msg.sender_id}]: ${msg.content}`;
        return `[${msg.role.toUpperCase()}]: ${msg.content}`;
      })
      .join("\n");

    const hasExplicitClones = target_clones && target_clones.length > 0;
    const routeToCapybara = !(target === "clones" || hasExplicitClones);

    let responses: { role: string; sender_id: string; content: string }[] = [];
    let sessionTransition: { clone_ids: string[]; clone_names: string[] } | undefined;
    let capybaraReasoning: unknown[] | undefined;

    if (routeToCapybara) {
      if (wantsStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const writeSSE = (obj: unknown) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
              );
            };
            try {
              const authHeader = req.headers.get("authorization");
              const capybaraResult = await callCapybaraAI(
                session_id,
                content,
                messageHistory,
                labeledHistory,
                {
                  authToken: authHeader ?? undefined,
                  onReasoningStep(step) {
                    writeSSE({ type: "reasoning", step });
                  },
                  onRelayMessages(messages) {
                    writeSSE({ type: "relay", messages });
                  },
                }
              );
              sessionTransition = capybaraResult.session_transition;
              capybaraReasoning = capybaraResult.reasoning;

              const finalResponse = {
                role: "capybara",
                sender_id: "capybara-ai",
                content: capybaraResult.response,
              };
              await supabase.from("chat_messages").insert({
                session_id,
                role: finalResponse.role,
                sender_id: finalResponse.sender_id,
                content: finalResponse.content,
              });

              // Refetch relay (ask + clone responses) so conversation appears in chat
              const { data: relayData } = await supabase
                .from("chat_messages")
                .select("role, sender_id, content")
                .eq("session_id", session_id)
                .gt("created_at", userMessage.created_at)
                .order("created_at", { ascending: true });
              responses = (relayData || []).map((m) => ({
                role: m.role,
                sender_id: m.sender_id,
                content: m.content,
              }));

              const donePayload: Record<string, unknown> = {
                type: "done",
                user_message: userMessage,
                ai_responses: responses,
                capybara_reasoning: capybaraReasoning,
              };
              if (sessionTransition) donePayload.session_transition = sessionTransition;
              writeSSE(donePayload);
            } catch (streamErr) {
              const msg =
                streamErr instanceof Error ? streamErr.message : String(streamErr);
              writeSSE({ type: "error", error: msg });
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      }

      const authHeader = req.headers.get("authorization");
      const capybaraResult = await callCapybaraAI(
        session_id,
        content,
        messageHistory,
        labeledHistory,
        { authToken: authHeader ?? undefined }
      );
      // Refetch relay messages (ask + clone responses) persisted by send_message tool
      const { data: relayData } = await supabase
        .from("chat_messages")
        .select("role, sender_id, content")
        .eq("session_id", session_id)
        .gt("created_at", userMessage.created_at)
        .order("created_at", { ascending: true });
      const relayResponses = (relayData || []).map((m) => ({
        role: m.role,
        sender_id: m.sender_id,
        content: m.content,
      }));

      const finalResponse = {
        role: "capybara",
        sender_id: "capybara-ai",
        content: capybaraResult.response,
      };
      responses = [...relayResponses, finalResponse];
      sessionTransition = capybaraResult.session_transition;
      capybaraReasoning = capybaraResult.reasoning;
    } else {
      const clonesInScope = target_clones || session.active_clones;
      if (!clonesInScope || (clonesInScope as unknown[]).length === 0) {
        return NextResponse.json(
          { error: "No active clones in session" },
          { status: 400 }
        );
      }
      const cloneResponses = await callMultipleClones(
        clonesInScope as string[],
        session_id,
        content,
        null
      );
      responses = cloneResponses.map((r) => ({
        role: "clone",
        sender_id: r.clone_id,
        content: String(r.content),
      }));
    }

    // Persist responses (Capysan path already persisted relay + final above)
    if (!routeToCapybara) {
      for (const r of responses) {
        await supabase.from("chat_messages").insert({
          session_id,
          role: r.role,
          sender_id: r.sender_id,
          content: r.content,
        });
      }
    }

    const responseBody: Record<string, unknown> = {
      user_message: userMessage,
      ai_responses: responses,
    };
    if (sessionTransition) responseBody.session_transition = sessionTransition;
    if (capybaraReasoning) responseBody.capybara_reasoning = capybaraReasoning;

    return NextResponse.json(responseBody);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.error("chat.message_failed", errorMsg, { userId });
    return NextResponse.json(
      { error: "Failed to process message", details: errorMsg },
      { status: 500 }
    );
  }
}
