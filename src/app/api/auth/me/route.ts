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

    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        *,
        user_societies!inner(society_id, role, flat_no, wing, is_primary, approval_status)
      `
      )
      .eq("id", decoded.userId)
      .eq("user_societies.is_primary", true)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primarySociety = user.user_societies?.[0];

    // Check if user has any approved societies
    const { data: approvedSocieties } = await supabase
      .from("user_societies")
      .select("society_id, approval_status")
      .eq("user_id", decoded.userId)
      .eq("approval_status", "approved");

    const hasApprovedSociety =
      approvedSocieties && approvedSocieties.length > 0;

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      global_role: user.global_role,
      role: primarySociety?.role || null,
      society_id: primarySociety?.society_id || null,
      flat_no: primarySociety?.flat_no || null,
      wing: primarySociety?.wing || null,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      approval_status: primarySociety?.approval_status || "pending",
      has_approved_society: hasApprovedSociety,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
