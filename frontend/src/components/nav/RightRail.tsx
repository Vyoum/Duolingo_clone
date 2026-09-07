"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SuperBadge } from "@/components/layout/TopStatsBar";
import { useApi, type Learner } from "@/lib/api";

const FOOTER_LINKS = [
  "ABOUT",
  "BLOG",
  "STORE",
  "EFFICACY",
  "CAREERS",
  "INVESTORS",
  "TERMS",
  "PRIVACY",
];

export function RightRail() {
  const pathname = usePathname();
  const { data } = useApi<Learner>("me", true);

  const variant = pathname.startsWith("/quests")
    ? "quests"
    : pathname.startsWith("/leaderboard")
      ? "leaderboard"
      : "learn";

  return (
    <aside className="sticky top-0 flex h-screen w-[368px] shrink-0 flex-col gap-4 overflow-y-auto border-l-2 border-[var(--duo-border)] bg-[var(--duo-bg)] px-5 py-5">
      <StatsRow learner={data} />

      {variant === "learn" && (
        <>
          <SuperCard />
          <LeagueCard />
          <QuestsCard />
          <AdCard />
        </>
      )}

      {variant === "quests" && (
        <>
          <MonthlyBadgesCard />
          <FooterLinks />
        </>
      )}

      {variant === "leaderboard" && (
        <>
          <StatusCard />
          <FooterLinks />
        </>
      )}
    </aside>
  );
}

function StatsRow({ learner }: { learner: Learner | null | undefined }) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-1 text-[15px] font-extrabold"
      aria-label="Desktop learner statistics"
    >
      <span
        className="flex items-center gap-1.5 text-[var(--duo-yellow)]"
        aria-label={`Total XP: ${learner?.xp ?? "loading"}`}
        title="Total XP"
      >
        <span aria-hidden>⚡</span> <span>{learner?.xp ?? "…"}</span>
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-text-muted)]" aria-label={`Day streak: ${learner?.streak ?? "loading"}`} title="Day streak">
        <span aria-hidden>🔥</span> {learner?.streak ?? "…"}
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-blue)]" aria-label="Gems: 132" title="Gems">
        <span aria-hidden>💎</span> 132
      </span>
      <span className="flex items-center gap-1 text-[#FF4B4B]" aria-label={`Hearts: ${learner?.hearts ?? "loading"}`} title="Hearts">
        <span aria-hidden>♥</span> {learner?.hearts ?? "…"}
      </span>
    </div>
  );
}

function SuperCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <SuperBadge />
        <HoloOwlMini />
      </div>
      <h3 className="text-lg font-extrabold text-white">Try Super for free</h3>
      <p className="mt-1 text-sm font-semibold leading-snug text-[var(--duo-text-muted)]">
        No ads, personalized practice, and unlimited Legendary!
      </p>
      <button
        type="button"
        onClick={() => window.alert("Super — Coming soon")}
        className="duo-btn-blue mt-4 w-full py-3 text-sm"
      >
        TRY 1 WEEK FREE
      </button>
    </section>
  );
}

function LeagueCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-extrabold text-white">Silver League</h3>
        <Link href="/leaderboard" className="text-sm font-extrabold text-[var(--duo-blue)]">
          VIEW LEAGUE
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          😴
        </span>
        <p className="text-sm font-semibold leading-snug text-[var(--duo-text-muted)]">
          Complete a lesson to join this week&apos;s leaderboard
        </p>
      </div>
    </section>
  );
}

function QuestsCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-extrabold text-white">Daily Quests</h3>
        <Link href="/quests" className="text-sm font-extrabold text-[var(--duo-blue)]">
          VIEW ALL
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          ⚡
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white">Earn 10 XP</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-[#37464F]">
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white/80">
                0 / 10
              </span>
            </div>
            <span aria-hidden>🧰</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--duo-text-muted)]">
        Advertisement
      </p>
      <p className="mt-2 text-sm font-extrabold text-white">
        Get Photoshop for ₹733.96/month
      </p>
      <button
        type="button"
        className="mt-3 text-sm font-extrabold text-[var(--duo-blue)]"
        onClick={() => window.alert("Ad placeholder")}
      >
        Learn more
      </button>
    </section>
  );
}

function MonthlyBadgesCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <h3 className="mb-4 font-extrabold text-white">Monthly Badges</h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#37464F] text-xl">
            🏅
          </div>
          <p className="text-sm font-semibold leading-snug text-[var(--duo-text-muted)]">
            Complete 20 quests to earn this month&apos;s badge
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#37464F] text-xl">
            🎧
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">Zari&apos;s Movie Binge</p>
            <p className="text-sm font-semibold text-[var(--duo-text-muted)]">June 2025</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusCard() {
  const emojis = ["😎", "🎉", "💪", "👀", "🍿", "🇩🇪", "🔥", "💚", "🎯", "📚", "✨", "🦉"];
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-extrabold text-white">Set your status</h3>
        <button type="button" className="text-sm font-extrabold text-[var(--duo-blue)]">
          CLEAR
        </button>
      </div>
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#37464F] text-3xl">
          🧑
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            className="flex h-10 items-center justify-center rounded-xl border-2 border-[var(--duo-border)] text-lg hover:border-[var(--duo-blue)]"
          >
            {e}
          </button>
        ))}
      </div>
    </section>
  );
}

function FooterLinks() {
  return (
    <div className="mt-auto flex flex-wrap gap-x-3 gap-y-2 pb-4">
      {FOOTER_LINKS.map((link) => (
        <button
          key={link}
          type="button"
          className="text-[11px] font-extrabold tracking-wide text-[var(--duo-text-muted)] hover:text-white"
        >
          {link}
        </button>
      ))}
    </div>
  );
}

function HoloOwlMini() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
      <defs>
        <linearGradient id="ho" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="50%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#E879F9" />
        </linearGradient>
      </defs>
      <ellipse cx="28" cy="32" rx="18" ry="16" fill="url(#ho)" />
      <circle cx="21" cy="28" r="5" fill="#fff" />
      <circle cx="35" cy="28" r="5" fill="#fff" />
      <circle cx="21.5" cy="28.5" r="2" fill="#111" />
      <circle cx="35.5" cy="28.5" r="2" fill="#111" />
    </svg>
  );
}
