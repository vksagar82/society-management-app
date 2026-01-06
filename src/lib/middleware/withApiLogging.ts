import { NextRequest, NextResponse } from "next/server";
import { logApiRequest } from "./apiLogger";

export async function withApiLogging(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  societyId: string | null = null,
  userId: string | null = null
): Promise<NextResponse> {
  const startTime = Date.now();
  let response: NextResponse;
  let statusCode = 200;

  try {
    response = await handler();
    statusCode = response.status;
    return response;
  } catch (error) {
    statusCode = 500;
    throw error;
  } finally {
    const responseTime = Date.now() - startTime;

    // Log asynchronously without blocking the response
    logApiRequest(req, societyId, userId, statusCode, responseTime).catch(
      (err) => {
        console.error("Failed to log API request:", err);
      }
    );
  }
}
