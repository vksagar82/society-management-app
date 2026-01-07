import { NextRequest } from "next/server";

export function getRequestMetadata(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("cf-connecting-ip") ||
    request.ip ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  return {
    ipAddress: ip.trim(),
    userAgent,
  };
}
