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

    // Check if requester is admin
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("role, society_id")
      .eq("id", decoded.userId)
      .single();

    if (requesterError || !requester || requester.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view users" },
        { status: 403 }
      );
    }

    // Get query parameters
    const societyId = req.nextUrl.searchParams.get("society_id");

    let query = supabase
      .from("users")
      .select("id, email, full_name, phone, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
