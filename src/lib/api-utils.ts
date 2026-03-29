import { NextResponse } from "next/server";

/**
 * Centralized API error handler.
 * Usage: return apiError("Something went wrong", 400);
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap an async API handler with error catching.
 * Logs the error and returns a generic 500 response.
 */
export function withErrorHandler(
  label: string,
  handler: (req: Request, ctx: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error(`${label} error:`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
