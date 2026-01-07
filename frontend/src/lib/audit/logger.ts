import { createServerClient } from "@/lib/supabase/client";

export interface AuditLogParams {
  societyId: string;
  userId: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "EXPORT";
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditTrail(params: AuditLogParams) {
  try {
    const supabase = createServerClient();

    const { error } = await supabase.from("audit_logs").insert({
      society_id: params.societyId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      user_id: params.userId,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });

    if (error) {
      console.error("Failed to log audit trail:", error);
    }
  } catch (error) {
    console.error("Error in logAuditTrail:", error);
  }
}

export async function getAuditLogs(
  societyId: string,
  filters?: {
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const supabase = createServerClient();

    let query = supabase
      .from("audit_logs")
      .select(
        `id,
        action,
        entity_type,
        entity_id,
        user_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at`,
        { count: "exact" }
      )
      .eq("society_id", societyId)
      .order("created_at", { ascending: false });

    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString());
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch audit logs - Supabase Error:", error);
      throw new Error(`Supabase query error: ${JSON.stringify(error)}`);
    }

    // Fetch user data for all logs
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((log: any) => log.user_id))];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) {
        console.error("Failed to fetch user data:", usersError);
      }

      const userMap = new Map((users || []).map((u: any) => [u.id, u]));

      // Enrich logs with user data
      const enrichedLogs = data.map((log: any) => ({
        ...log,
        user: userMap.get(log.user_id),
      }));

      return { logs: enrichedLogs, count: count || 0 };
    }

    return { logs: data || [], count: count || 0 };
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    throw error;
  }
}
