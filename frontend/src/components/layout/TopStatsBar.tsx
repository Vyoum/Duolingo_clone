"use client";
import { useApi, type Learner } from "@/lib/api";

export function TopStatsBar() {
  const { data, error } = useApi<Learner>("me", true);
  return <header className="sticky top-0 z-40 flex h-14 items-center justify-around gap-2 bg-[var(--duo-bg)] px-4 font-extrabold lg:hidden" aria-label="Mobile learner statistics">
    <span aria-label={`Day streak: ${data?.streak ?? "loading"}`} title="Day streak"><span aria-hidden>🔥</span> {data?.streak ?? "…"}</span>
    <span className="text-[var(--duo-yellow)]" aria-label={`Total XP: ${data?.xp ?? "loading"}`} title="Total XP"><span aria-hidden>⚡</span> {data?.xp ?? "…"}</span>
    <span className="text-[var(--duo-heart)]" aria-label={`Hearts: ${data?.hearts ?? "loading"}`} title={data?.next_heart_at ? `Next heart: ${new Date(data.next_heart_at).toLocaleTimeString()}` : "Hearts"}><span aria-hidden>♥</span> {data?.hearts ?? "…"}</span>
    {error && <span role="status" className="text-xs" title={error}>Offline</span>}
  </header>;
}

export function SuperBadge() {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black italic tracking-wide text-white"
      style={{
        background: "linear-gradient(90deg, #58CC02, #1CB0F6, #CE82FF)",
      }}
    >
      SUPER
    </span>
  );
}
