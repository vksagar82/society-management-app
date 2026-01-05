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

    const supabase = createServerClient();

    // Check if requester is admin or developer
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    if (
      requesterError ||
      !requester ||
      (requester.global_role !== "admin" &&
        requester.global_role !== "developer")
    ) {
      return NextResponse.json(
        { error: "Only admins and developers can update user roles" },
        { status: 403 }
      );
    }

    const { userId, newRole, societyId, isGlobalRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "userId and newRole are required" },
        { status: 400 }
      );
    }

    if (!["developer", "admin", "manager", "member"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    let oldUserData, updatedUser, updateError;

    if (isGlobalRole) {
      // Update global role (only developers can do this)
      if (requester.global_role !== "developer") {
        return NextResponse.json(
          { error: "Only developers can update global roles" },
          { status: 403 }
        );
      }

      ({ data: oldUserData } = await supabase
        .from("users")
        .select("global_role")
        .eq("id", userId)
        .single());

      ({ data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ global_role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single());
    } else {
      // Update society-specific role
      if (!societyId) {
        return NextResponse.json(
          { error: "societyId is required for society role updates" },
          { status: 400 }
        );
      }

      ({ data: oldUserData } = await supabase
        .from("user_societies")
        .select("role")
        .eq("user_id", userId)
        .eq("society_id", societyId)
        .single());

      ({ data: updatedUser, error: updateError } = await supabase
        .from("user_societies")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("society_id", societyId)
        .select()
        .single());
    }

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Log the role update
    await logOperation({
      request: req,
      action: "UPDATE",
      entityType: isGlobalRole ? "user_global_role" : "user_society_role",
      entityId: userId,
      societyId: societyId || null,
      userId: decoded.userId,
      oldValues: { role: oldUserData?.role || oldUserData?.global_role },
      newValues: { role: newRole },
      description: `User ${isGlobalRole ? "global" : "society"} role updated: ${
        oldUserData?.role || oldUserData?.global_role
      } → ${newRole}`,
    });

    return NextResponse.json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
