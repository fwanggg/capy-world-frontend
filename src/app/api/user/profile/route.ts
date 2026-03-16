import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { log } from "@/lib/logging";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

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
      log.info("approval.profile", `Created waitlist entry for user_id=${userId}`);
    } else if (upsertError) {
      console.error("[PROFILE] Waitlist upsert failed:", upsertError.message, { userId });
    }
  }

  const status = user?.approval_status ?? (error ? "error" : "not_found");
  log.info("approval.profile", `user_id=${userId} approval_status=${status}`, {
    userId,
    metadata: { approval_status: status, error: error?.message },
  });

  if (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ approval_status: null });
  }

  return NextResponse.json(user);
}
