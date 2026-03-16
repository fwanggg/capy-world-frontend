import { verifyJWT, extractUserIdFromJWT } from "./jwt";
import { supabase } from "./supabase";
import { logAppUrlOnce, log } from "./logging";

export interface AuthResult {
  userId: string;
  userEmail?: string;
}

export async function getAuthFromRequest(
  req: Request
): Promise<AuthResult | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);
  if (!payload) return null;

  return {
    userId: extractUserIdFromJWT(payload),
    userEmail: payload.email,
  };
}

export async function requireAuth(req: Request): Promise<AuthResult | Response> {
  logAppUrlOnce();
  const auth = await getAuthFromRequest(req);
  if (!auth) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  return auth;
}

export type WaitlistUser = { approval_status: string; [key: string]: unknown };

export async function getOrCreateWaitlistUser(userId: string): Promise<{
  user: WaitlistUser | null;
  error: unknown;
}> {
  let { data: user, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!user && !error) {
    const { data: upserted, error: upsertError } = await supabase
      .from("waitlist")
      .upsert(
        { user_id: userId, approval_status: "approved" },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();
    if (!upsertError && upserted) {
      user = upserted;
      log.info("approval.check", `Created waitlist entry for user_id=${userId}`);
    } else if (upsertError) {
      console.error("[AUTH] Waitlist upsert failed:", upsertError.message, { userId });
      log.warn("approval.check", `Upsert failed for user_id=${userId}`, {
        userId,
        metadata: { error: upsertError.message },
      });
    }
  }

  const status = user?.approval_status ?? (error ? "error" : "not_found");
  log.info("approval.check", `user_id=${userId} approval_status=${status}`, {
    userId,
    metadata: { approval_status: status, error: error?.message },
  });

  return { user: user as WaitlistUser | null, error };
}

export async function requireApproval(
  req: Request,
  userId: string
): Promise<Response | null> {
  const { user, error } = await getOrCreateWaitlistUser(userId);

  if (error || !user) {
    return Response.json(
      { error: "Not on waitlist. Please sign up at /waitlist first." },
      { status: 403 }
    );
  }

  if (user.approval_status !== "approved") {
    return Response.json({ error: "Pending approval" }, { status: 403 });
  }

  return null;
}
