import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth/utils";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

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

    // Check if user is developer/admin
    const { data: userData } = await supabase
      .from("users")
      .select("global_role, role")
      .eq("id", decoded.userId)
      .single();

    if (
      userData?.global_role !== "developer" &&
      userData?.global_role !== "admin" &&
      userData?.role !== "developer" &&
      userData?.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const level = searchParams.get("level");
    const source = searchParams.get("source");
    const environment = searchParams.get("environment");
    const requestId = searchParams.get("request_id");

    let query = supabase
      .from("server_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (level) query = query.eq("level", level);
    if (source) query = query.eq("source", source);
    if (environment) query = query.eq("environment", environment);
    if (requestId) query = query.eq("request_id", requestId);

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching server logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch server logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      level,
      source,
      message,
      error_code,
      stack_trace,
      context,
      user_id,
      request_id,
      hostname,
      environment,
    } = await request.json();

    const { error } = await supabase.from("server_logs").insert({
      level,
      source,
      message,
      error_code,
      stack_trace,
      context,
      user_id,
      request_id,
      hostname: hostname || process.env.VERCEL_URL || "localhost",
      environment:
        environment ||
        (process.env.NODE_ENV === "production" ? "production" : "development"),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging server event:", error);
    return NextResponse.json(
      { error: "Failed to log server event" },
      { status: 500 }
    );
  }
}
