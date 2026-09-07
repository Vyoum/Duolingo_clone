import { test, expect } from "@playwright/test";
import { GET } from "../src/app/api/warmup/route";
import { retryFetch } from "../src/lib/retry-fetch";

test("health probes start concurrently and reject a platform loading page", async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    WARMUP_ENABLED: "true", GATEWAY_URL: "https://gateway.test",
    CONTENT_HEALTH_URL: "https://content.test/health",
    PROGRESS_HEALTH_URL: "https://progress.test/health",
    GAMIFICATION_HEALTH_URL: "https://game.test/health",
  });
  const pending: Array<(response: Response) => void> = [];
  globalThis.fetch = async () => new Promise(resolve => pending.push(resolve));
  try {
    const result = GET();
    expect(pending).toHaveLength(4);
    pending.forEach((resolve, index) => resolve(index === 2 ? new Response("Loading…") : Response.json({ status: "ok" })));
    expect(await (await result).json()).toEqual({ ready: false });
    globalThis.fetch = async () => Response.json({ status: "ok" });
    expect(await (await GET()).json()).toEqual({ ready: true });
    delete process.env.CONTENT_HEALTH_URL;
    expect(await (await GET()).json()).toEqual({ ready: false });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ["WARMUP_ENABLED", "GATEWAY_URL", "CONTENT_HEALTH_URL", "PROGRESS_HEALTH_URL", "GAMIFICATION_HEALTH_URL"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});

test("temporary failures replay the same keyed answer and do not retry conflicts or unkeyed writes", async () => {
  const originalFetch = globalThis.fetch;
  const submissions: RequestInit[] = [];
  globalThis.fetch = async (url, init) => {
    if (url === "/api/warmup") return Response.json({ ready: true });
    submissions.push(init!);
    return submissions.length === 1 ? new Response("sleeping", { status: 503 }) : Response.json({ saved: true });
  };
  try {
    await retryFetch("/answer", { method: "POST", headers: { "Idempotency-Key": "same-key" }, body: '{"answer":0}' });
    expect(submissions).toHaveLength(2);
    expect(submissions[0].body).toBe(submissions[1].body);
    expect(submissions[0].headers).toEqual(submissions[1].headers);
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 409 }); };
    expect((await retryFetch("/answer", { method: "POST", headers: { "Idempotency-Key": "key" } })).status).toBe(409);
    expect(calls).toBe(1);
    globalThis.fetch = async () => { calls++; return new Response(null, { status: 503 }); };
    await retryFetch("/answer", { method: "POST" });
    expect(calls).toBe(2);
  } finally { globalThis.fetch = originalFetch; }
});

test("startup waits, times out, and recovers with Retry", async ({ page }) => {
  test.skip(process.env.WARMUP_ENABLED !== "true", "Start Next with WARMUP_ENABLED=true for startup UI coverage");
  let ready = false;
  await page.route("**/api/warmup", route => route.fulfill({ json: { ready } }));
  await page.clock.install();
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Getting your lessons ready…" })).toBeVisible();
  await page.clock.fastForward(121000);
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
  ready = true;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Taking a little longer" })).toHaveCount(0);
  await expect(page.locator("form")).toBeVisible();
});
