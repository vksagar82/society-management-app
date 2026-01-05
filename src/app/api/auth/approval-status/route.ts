import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user's society memberships with approval status
    const { data: userSocieties, error } = await supabase
      .from("user_societies")
      .select(
        `
        society_id,
        approval_status,
        created_at,
        societies (
          name
        )
      `
      )
      .eq("user_id", decoded.userId);

    if (error) {
      throw error;
    }

    const societies = userSocieties.map((us: any) => ({
      society_id: us.society_id,
      society_name: us.societies.name,
      approval_status: us.approval_status,
      created_at: us.created_at,
    }));

    return NextResponse.json({ societies });
  } catch (error) {
    console.error("Get approval status error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
