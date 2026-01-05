import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { getAuditLogs } from "@/lib/audit/logger";
import { verifyToken } from "@/lib/auth/utils";

// Validate bearer token and return user id
function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      response: NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      response: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { userId: decoded.userId };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = authenticate(req);
    if ("response" in authResult) return authResult.response;
    const requesterId = authResult.userId;

    // Use service client for database queries
    const supabase = createServerClient();

    // Get user's global role and society
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        global_role,
        user_societies!inner(society_id, role, is_primary)
      `
      )
      .eq("id", requesterId)
      .eq("user_societies.is_primary", true)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    const primarySociety = user?.user_societies?.[0];
    const societyId = primarySociety?.society_id;

    if (!user || !societyId) {
      console.error("No society found for user:", requesterId);
      return NextResponse.json({ error: "No society found" }, { status: 404 });
    }

    // Only admins and developers can view audit logs
    const isAuthorized =
      user.global_role === "developer" ||
      user.global_role === "admin" ||
      primarySociety?.role === "admin";
    if (!isAuthorized) {
      console.warn(
        "Unauthorized user trying to access audit logs:",
        requesterId
      );
      return NextResponse.json(
        { error: "Only admins and developers can view audit logs" },
        { status: 403 }
      );
    }

    const userData = { society_id: societyId };

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const entityType = searchParams.get("entityType") || undefined;
    const action = searchParams.get("action") || undefined;
    const userFilter = searchParams.get("userId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const filters = {
      entityType,
      action,
      userId: userFilter || undefined,
      limit,
      offset,
    };

    const { logs, count } = await getAuditLogs(userData.society_id, filters);

    return NextResponse.json({ logs, count });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: errorMessage },
      { status: 500 }
    );
  }
}
