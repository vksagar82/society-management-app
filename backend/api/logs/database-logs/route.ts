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
    const operation = searchParams.get("operation");
    const status = searchParams.get("status");
    const tableName = searchParams.get("table_name");

    let query = supabase
      .from("database_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (operation) query = query.eq("operation", operation);
    if (status) query = query.eq("status", status);
    if (tableName) query = query.eq("table_name", tableName);

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching database logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch database logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      operation,
      table_name,
      query,
      query_duration_ms,
      rows_affected,
      error_message,
      error_code,
      user_id,
      ip_address,
      status,
    } = await request.json();

    const { error } = await supabase.from("database_logs").insert({
      operation,
      table_name,
      query,
      query_duration_ms,
      rows_affected,
      error_message,
      error_code,
      user_id,
      ip_address,
      status: status || "success",
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging database operation:", error);
    return NextResponse.json(
      { error: "Failed to log database operation" },
      { status: 500 }
    );
  }
}
