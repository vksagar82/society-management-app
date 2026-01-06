import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function logApiRequest(
  req: NextRequest,
  societyId: string | null,
  userId: string | null,
  statusCode: number,
  responseTime: number
) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.from("api_requests").insert({
      society_id: societyId,
      user_id: userId,
      method: req.method,
      path: req.nextUrl.pathname,
      status_code: statusCode,
      response_time_ms: responseTime,
      ip_address:
        req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    if (error) {
      console.error("Failed to log API request:", error);
    }
  } catch (error) {
    console.error("Error in logApiRequest:", error);
  }
}

export async function getApiRequestCount(
  societyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const supabase = createServerClient();

    let query = supabase
      .from("api_requests")
      .select("id", { count: "exact", head: true });

    if (societyId) {
      query = query.eq("society_id", societyId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("created_at", endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      console.error("Failed to fetch API request count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getApiRequestCount:", error);
    return 0;
  }
}
