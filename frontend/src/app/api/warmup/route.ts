export const dynamic = "force-dynamic";

// Short probes keep each function invocation bounded; the browser retries while
// Render starts the services. Targets are server configuration, never user input.
export async function GET() {
  const enabled = process.env.WARMUP_ENABLED === "true";
  const targets = [
    process.env.GATEWAY_URL ? `${process.env.GATEWAY_URL.replace(/\/$/, "")}/health` : undefined,
    process.env.CONTENT_HEALTH_URL,
    process.env.PROGRESS_HEALTH_URL,
    process.env.GAMIFICATION_HEALTH_URL,
  ];
  if (!enabled) return Response.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
  const checks = await Promise.all(targets.map(async target => {
    if (!target) return false;
    try {
      const response = await fetch(target, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000) });
      const data = await response.json();
      return response.ok && data.status === "ok";
    } catch { return false; }
  }));
  return Response.json({ ready: checks.every(Boolean) }, { headers: { "Cache-Control": "no-store" } });
}
