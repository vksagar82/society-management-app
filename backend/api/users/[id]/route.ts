import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (requesterError || !requester) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Only developers and admins can delete users
    const isAuthorized =
      requester.global_role === "developer" ||
      requester.global_role === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Only admins and developers can delete users" },
        { status: 403 }
      );
    }

    const userIdToDelete = params.id;

    // Prevent self-deletion
    if (userIdToDelete === decoded.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user to delete exists
    const { data: userToDelete, error: userCheckError } = await supabase
      .from("users")
      .select("id, email, full_name, global_role")
      .eq("id", userIdToDelete)
      .single();

    if (userCheckError || !userToDelete) {
      return NextResponse.json(
        { error: "User to delete not found" },
        { status: 404 }
      );
    }

    // Prevent deleting developer accounts unless requester is also a developer
    if (
      userToDelete.global_role === "developer" &&
      requester.global_role !== "developer"
    ) {
      return NextResponse.json(
        { error: "Only developers can delete other developer accounts" },
        { status: 403 }
      );
    }

    // Delete the user (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userIdToDelete);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User deleted successfully",
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        full_name: userToDelete.full_name,
      },
    });
  } catch (error) {
    console.error("Error in user deletion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
