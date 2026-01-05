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
    const societyId = req.nextUrl.searchParams.get("society_id");

    if (!societyId) {
      return NextResponse.json(
        { error: "Society ID is required" },
        { status: 400 }
      );
    }

    // Check if requester is admin for this society
    const { data: requesterRole } = await supabase
      .from("user_societies")
      .select("role")
      .eq("user_id", decoded.userId)
      .eq("society_id", societyId)
      .eq("approval_status", "approved")
      .single();

    const { data: requester } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    const isAdmin =
      requester?.global_role === "admin" ||
      requester?.global_role === "developer" ||
      requesterRole?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can view pending approvals" },
        { status: 403 }
      );
    }

    // Get pending user requests for this society
    const { data: pendingRequests, error } = await supabase
      .from("user_societies")
      .select(
        `
        id,
        user_id,
        created_at,
        approval_status,
        users!user_societies_user_id_fkey (
          full_name,
          email,
          phone
        )
      `
      )
      .eq("society_id", societyId)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const formattedRequests = pendingRequests.map((req: any) => ({
      id: req.id,
      user_id: req.user_id,
      full_name: req.users.full_name,
      email: req.users.email,
      phone: req.users.phone,
      created_at: req.created_at,
      approval_status: req.approval_status,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Get pending approvals error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
