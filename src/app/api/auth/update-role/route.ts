import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";

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

    // Check if requester is admin
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("role")
      .eq("id", decoded.userId)
      .single();

    if (requesterError || !requester || requester.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update user roles" },
        { status: 403 }
      );
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "userId and newRole are required" },
        { status: 400 }
      );
    }

    if (!["admin", "manager", "member"].includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
