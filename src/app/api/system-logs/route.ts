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

    // Check if requester is developer
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("global_role")
      .eq("id", decoded.userId)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Only developers can view system logs
    if (requester.global_role !== "developer") {
      return NextResponse.json(
        { error: "Only developers can view system logs" },
        { status: 403 }
      );
    }

    // Get query parameters
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") || "100"),
      1000
    );
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    // Fetch from request_logs table which contains all API request details
    const {
      data: logs,
      error: logsError,
      count,
    } = await supabase
      .from("request_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error("Error fetching logs:", logsError);
      return NextResponse.json(
        { error: "Failed to fetch system logs", logs: [] },
        { status: 500 }
      );
    }

    // Transform request logs to system logs format with full details
    const systemLogs = (logs || []).map((log: any) => {
      const statusCode = log.status_code;
      const isError = statusCode >= 400;

      let type = "info";
      let severity = "low";

      if (statusCode >= 500) {
        type = "api_error";
        severity = "critical";
      } else if (statusCode >= 400) {
        type = "api_error";
        severity = "high";
      } else if (statusCode >= 200 && statusCode < 300) {
        type = "info";
        severity = "low";
      }

      // Format headers if they're stored as JSONB
      let formattedHeaders = null;
      if (log.request_headers) {
        formattedHeaders =
          typeof log.request_headers === "string"
            ? log.request_headers
            : JSON.stringify(log.request_headers, null, 2);
      }

      // Format request body
      let formattedRequestBody = null;
      if (log.request_body) {
        formattedRequestBody =
          typeof log.request_body === "string"
            ? log.request_body
            : JSON.stringify(log.request_body, null, 2);
      }

      // Format response body
      let formattedResponseBody = null;
      if (log.response_body) {
        formattedResponseBody =
          typeof log.response_body === "string"
            ? log.response_body
            : JSON.stringify(log.response_body, null, 2);
      }

      return {
        id: log.id,
        type,
        severity,
        message: `${log.method} ${log.path} - Status: ${statusCode}${
          log.error_message ? ` - ${log.error_message}` : ""
        }`,
        code: log.error_code || `HTTP_${statusCode}`,
        path: log.path,
        method: log.method,
        status_code: statusCode,
        response_time: log.response_time_ms,
        timestamp: log.created_at,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        user_id: log.user_id,
        society_id: log.society_id,
        headers: formattedHeaders,
        request_body: formattedRequestBody,
        response_body: formattedResponseBody,
      };
    });

    return NextResponse.json({
      logs: systemLogs,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in system logs:", error);
    return NextResponse.json(
      { error: "Internal server error", logs: [] },
      { status: 500 }
    );
  }
}
