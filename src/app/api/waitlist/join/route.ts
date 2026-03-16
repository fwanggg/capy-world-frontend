import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  try {
    // TODO: if user reaction is good, change back to insert pending
    // currently reducing friction for users to join the waitlist, and early access is important for us.
    const { data: user, error } = await supabase
      .from("waitlist")
      .upsert(
        {
          id: userId,
          user_id: userId,
          approval_status: "approved",
        },
        { onConflict: "id" }
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
