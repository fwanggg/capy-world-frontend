import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { log } from "@/lib/logging";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  try {
    const { data: user, error } = await supabase
      .from("waitlist")
      .select("*")
      .eq("user_id", userId)
      .single();

    const status = user?.approval_status ?? (error ? "not_found" : "null");
    log.info("approval.profile", `user_id=${userId} approval_status=${status}`, {
      userId,
      metadata: { approval_status: status, error: error?.message },
    });

    if (error) throw error;

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
