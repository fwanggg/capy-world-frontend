import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const isDev = process.env.DEV === "true";

  try {
    const { data: user, error } = await supabase
      .from("waitlist")
      .upsert(
        {
          user_id: userId,
          approval_status: isDev ? "approved" : "pending",
        },
        { onConflict: "user_id" }
      )
      .select("approval_status")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to join waitlist", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ approval_status: user?.approval_status });
  } catch (error) {
    console.error("Waitlist join error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
