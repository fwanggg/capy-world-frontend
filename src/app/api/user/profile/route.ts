import { NextResponse } from "next/server";
import { requireAuth, getOrCreateWaitlistUser } from "@/lib/auth";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;

  const { user, error } = await getOrCreateWaitlistUser(userId);

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
