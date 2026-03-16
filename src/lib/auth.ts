import { verifyJWT, extractUserIdFromJWT } from "./jwt";
import { userIdToUUID } from "./uuid";
import { supabase } from "./supabase";
import { logAppUrlOnce, log } from "./logging";

export interface AuthResult {
  userId: string;
  userEmail?: string;
}

export async function getAuthFromRequest(
  req: Request
): Promise<AuthResult | null> {
  const isDev = process.env.DEV === "true";

  if (isDev) {
    const userIdHeader = req.headers.get("x-user-id");
    if (userIdHeader) {
      return {
        userId: userIdToUUID(userIdHeader),
        userEmail: "dev@example.com",
      };
    }
  }

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

export async function requireApproval(
  req: Request,
  userId: string
): Promise<Response | null> {
  const { data: user, error } = await supabase
    .from("waitlist")
    .select("approval_status")
    .eq("user_id", userId)
    .single();

  const status = user?.approval_status ?? (error ? "not_found" : "null");
  log.info("approval.check", `user_id=${userId} approval_status=${status}`, {
    userId,
    metadata: { approval_status: status, error: error?.message },
  });

  if (error || !user) return null;

  if (user.approval_status !== "approved") {
    return Response.json({ error: "Pending approval" }, { status: 403 });
  }

  return null;
}
