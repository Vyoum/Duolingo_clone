/** Retry only transient failures, and only replay writes carrying a stable key. */
export async function retryFetch(url: string, init: RequestInit): Promise<Response> {
  const safe = !init.method || init.method === "GET" || new Headers(init.headers).has("Idempotency-Key");
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(40000) });
      if (!safe || attempt >= 2 || ![502, 503, 504].includes(response.status)) return response;
      await response.body?.cancel();
    } catch (error) {
      if (!safe || attempt >= 2) throw error;
    }
    // Wake every dependency again if the tab was left open while Render slept.
    // The route accepts no caller-supplied targets and never retries a mutation.
    await fetch("/api/warmup", { cache: "no-store", signal: AbortSignal.timeout(5000) }).catch(() => undefined);
    await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}
