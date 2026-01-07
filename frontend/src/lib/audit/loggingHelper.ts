import { NextRequest } from "next/server";
import { logAuditTrail, AuditLogParams } from "./logger";
import { getRequestMetadata } from "./metadata";

/**
 * Helper function to log CRUD operations with automatic before/after comparison
 */
export async function logOperation(params: {
  request: NextRequest;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  entityType: string;
  entityId?: string;
  societyId: string;
  userId: string | null;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string; // For logging purposes only, not stored
}) {
  try {
    const { ipAddress, userAgent } = getRequestMetadata(params.request);

    // Filter out sensitive fields from logging
    const sensitiveFields = ["password", "password_hash", "token"];

    const filterSensitiveData = (obj?: Record<string, any>) => {
      if (!obj) return undefined;
      const filtered = { ...obj };
      sensitiveFields.forEach((field) => {
        if (field in filtered) {
          filtered[field] = "[REDACTED]";
        }
      });
      return filtered;
    };

    const auditParams: AuditLogParams = {
      societyId: params.societyId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: filterSensitiveData(params.oldValues),
      newValues: filterSensitiveData(params.newValues),
      ipAddress,
      userAgent,
    };

    await logAuditTrail(auditParams);

    // Console log for debugging (in development)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AUDIT] ${params.action} ${params.entityType}:`,
        params.description || ""
      );
    }
  } catch (error) {
    console.error("Failed to log operation:", error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Helper to compare old and new values and get only changed fields
 */
export function getChangedFields(
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  if (!newValues) return {};
  if (!oldValues) return newValues;

  const changes: Record<string, any> = {};

  Object.keys(newValues).forEach((key) => {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changes[key] = {
        from: oldValues[key],
        to: newValues[key],
      };
    }
  });

  return changes;
}

/**
 * Helper to format audit logs for display
 */
export function formatAuditLogForDisplay(log: {
  action: string;
  entity_type: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}) {
  const changes = getChangedFields(log.old_values, log.new_values);
  const changeEntries = Object.entries(changes).map(
    ([key, value]: [string, any]) => {
      if (typeof value === "object" && "from" in value) {
        return `${key}: ${value.from} → ${value.to}`;
      }
      return `${key}: ${value}`;
    }
  );

  return {
    action: log.action,
    entityType: log.entity_type,
    changes: changeEntries.length > 0 ? changeEntries : ["Initial creation"],
  };
}
