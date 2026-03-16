import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { log } from "@/lib/logging";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const { data: user, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

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
