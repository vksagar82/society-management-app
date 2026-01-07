import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";

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

    const supabase = createServerClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `global_role, user_societies:user_societies!user_societies_user_id_fkey(society_id, role, is_primary)`
      )
      .eq("id", requesterId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    const primarySociety =
      user?.user_societies?.find(
        (s: { is_primary?: boolean }) => s?.is_primary
      ) || user?.user_societies?.[0];

    const requestedSocietyId =
      req.nextUrl.searchParams.get("society_id") || primarySociety?.society_id;

    if (!user || !requestedSocietyId) {
      return NextResponse.json({ error: "No society found" }, { status: 404 });
    }

    const isDeveloper = user.global_role === "developer";
    const isGlobalAdmin = user.global_role === "admin";
    const isSocietyAdmin = user.user_societies?.some(
      (s: { society_id?: string; role?: string }) =>
        s.society_id === requestedSocietyId && s.role === "admin"
    );

    if (!isDeveloper && !isGlobalAdmin && !isSocietyAdmin) {
      return NextResponse.json(
        { error: "Only admins and developers can view system status" },
        { status: 403 }
      );
    }

    const { data: latestEvents, error: backupError } = await supabase
      .from("audit_logs")
      .select("created_at")
      .eq("society_id", requestedSocietyId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (backupError) {
      console.error("Failed to fetch last backup timestamp:", backupError);
    }

    const { count: cacheEntries, error: cacheError } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("society_id", requestedSocietyId);

    if (cacheError) {
      console.error("Failed to count cache entries:", cacheError);
    }

    return NextResponse.json({
      dbStatus: "connected",
      cacheStatus: "active",
      lastBackup: latestEvents?.[0]?.created_at || "",
      cacheEntries: cacheEntries ?? 0,
    });
  } catch (error) {
    console.error("Error fetching system status:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch system status", details: message },
      { status: 500 }
    );
  }
}
