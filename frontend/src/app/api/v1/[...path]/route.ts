import type { NextRequest } from "next/server";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const gateway = (process.env.GATEWAY_URL || (process.env.VERCEL ? "" : "http://localhost:8000")).replace(/\/$/, "");
  if (!gateway) {
    return Response.json({ detail: "GATEWAY_URL is not set. Add it in Vercel env vars." }, { status: 503 });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = request.headers.get("Idempotency-Key");
  if (key) headers["Idempotency-Key"] = key;
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && new TextEncoder().encode(body).length > 16384) {
      return Response.json({ detail: "Request too large" }, { status: 413 });
    }
    const response = await fetch(`${gateway}/api/v1/${path.map(encodeURIComponent).join("/")}`, {
      method: request.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(35000),
    });
    return new Response(await response.text(), {
      status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ detail: "Cannot reach the learning service. Please try again." }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
