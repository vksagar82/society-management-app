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

    // Check if requester is admin or developer
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Allow developers and admins to view users
    const isAuthorized =
      requester.global_role === "developer" ||
      requester.global_role === "admin";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Only admins and developers can view users" },
        { status: 403 }
      );
    }

    // Get query parameters
    const societyId = req.nextUrl.searchParams.get("society_id");

    // If society_id is provided, only return users from that society
    if (societyId) {
      // First get user_societies for the specified society
      const { data: userSocieties, error: userSocietiesError } = await supabase
        .from("user_societies")
        .select("user_id, role, flat_no, wing")
        .eq("society_id", societyId);

      if (userSocietiesError) {
        throw userSocietiesError;
      }

      if (!userSocieties || userSocieties.length === 0) {
        return NextResponse.json([]);
      }

      const userIds = userSocieties.map((us) => us.user_id);

      // Then get users who belong to this society
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(
          "id, email, full_name, phone, global_role, is_active, created_at"
        )
        .in("id", userIds)
        .order("created_at", { ascending: false });

      if (usersError) {
        throw usersError;
      }

      // Combine user data with their society-specific info
      const usersWithSocietyInfo = users.map((user) => {
        const societyInfo = userSocieties.find((us) => us.user_id === user.id);
        return {
          ...user,
          role: societyInfo?.role || "member",
          flat_no: societyInfo?.flat_no,
          wing: societyInfo?.wing,
        };
      });

      return NextResponse.json(usersWithSocietyInfo);
    }

    // If no society_id, return all users (for developers)
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, phone, global_role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
