import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/utils";
import { getApiRequestCount } from "@/lib/middleware/apiLogger";
import { createServerClient } from "@/lib/supabase/client";

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

    // Get user's role and society
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `global_role,
         user_societies:user_societies!user_societies_user_id_fkey(society_id, is_primary)`
      )
      .eq("id", decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primarySociety =
      user.user_societies?.find(
        (s: { is_primary?: boolean }) => s?.is_primary
      ) || user.user_societies?.[0];

    const societyId =
      req.nextUrl.searchParams.get("society_id") || primarySociety?.society_id;

    if (!societyId) {
      return NextResponse.json({ error: "No society found" }, { status: 404 });
    }

    // Only developers and admins can view API request stats
    const isDeveloper = user.global_role === "developer";
    const isAdmin = user.global_role === "admin";

    if (!isDeveloper && !isAdmin) {
      return NextResponse.json(
        { error: "Only developers and admins can view API statistics" },
        { status: 403 }
      );
    }

    // Get date range from query parameters
    const startDateParam = req.nextUrl.searchParams.get("startDate");
    const endDateParam = req.nextUrl.searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const count = await getApiRequestCount(societyId, startDate, endDate);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching API request count:", error);
    return NextResponse.json(
      { error: "Failed to fetch API request count" },
      { status: 500 }
    );
  }
}
