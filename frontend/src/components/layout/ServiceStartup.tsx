"use client";

import { useEffect, useState } from "react";

export function ServiceStartup({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"waiting" | "ready" | "failed">("waiting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + 120000;
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      const started = Date.now();
      try {
        const response = await fetch("/api/warmup", {
          cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        });
        const data = await response.json();
        if (!controller.signal.aborted && response.ok && data.ready === true) {
          setState("ready");
          return;
        }
      } catch { /* A sleeping service is expected during startup. */ }
      if (controller.signal.aborted) return;
      if (Date.now() >= deadline) setState("failed");
      else timer = setTimeout(check, Math.min(Math.max(0, 5000 - (Date.now() - started)), deadline - Date.now()));
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [attempt]);

  if (state === "ready") return children;
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border-2 border-[var(--duo-border)] p-8 text-center">
        <h1 className="text-2xl font-extrabold">{state === "failed" ? "Taking a little longer" : "Getting your lessons ready…"}</h1>
        <p role="status" aria-live="polite" className="mt-4">
          {state === "failed" ? "We couldn’t connect yet. Please try again." : "The learning services are waking up. This can take up to two minutes after inactivity."}
        </p>
        {state === "failed" && <button className="mt-6 rounded-xl bg-[#58cc02] px-6 py-3 font-bold text-white" onClick={() => { setState("waiting"); setAttempt(value => value + 1); }}>Retry</button>}
      </div>
    </main>
  );
}
