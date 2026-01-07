import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";
import { logOperation } from "@/lib/audit/loggingHelper";

export async function POST(req: NextRequest) {
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

    const { userSocietyId, approve, rejectionReason } = await req.json();

    if (!userSocietyId || approve === undefined) {
      return NextResponse.json(
        { error: "User society ID and approval decision are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get the user_society record to check society_id
    const { data: userSociety, error: fetchError } = await supabase
      .from("user_societies")
      .select("society_id, user_id, approval_status")
      .eq("id", userSocietyId)
      .single();

    if (fetchError || !userSociety) {
      return NextResponse.json(
        { error: "User society record not found" },
        { status: 404 }
      );
    }

    if (userSociety.approval_status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Check if requester is admin for this society
    const { data: requesterRole } = await supabase
      .from("user_societies")
      .select("role")
      .eq("user_id", decoded.userId)
      .eq("society_id", userSociety.society_id)
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
        { error: "Only admins can approve or reject users" },
        { status: 403 }
      );
    }

    // Update approval status
    const updateData: any = {
      approval_status: approve ? "approved" : "rejected",
      approved_by: decoded.userId,
      approved_at: new Date().toISOString(),
    };

    if (!approve && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from("user_societies")
      .update(updateData)
      .eq("id", userSocietyId);

    if (updateError) {
      throw updateError;
    }

    // Log the approval/rejection
    await logOperation({
      request: req,
      action: "UPDATE",
      entityType: "user_approval",
      entityId: userSocietyId,
      societyId: userSociety.society_id,
      userId: decoded.userId,
      newValues: {
        user_id: userSociety.user_id,
        approval_status: approve ? "approved" : "rejected",
        approved_by: decoded.userId,
      },
      description: `User ${
        approve ? "approved" : "rejected"
      } for society membership`,
    });

    return NextResponse.json({
      message: `User ${approve ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
