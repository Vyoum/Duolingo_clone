"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SuperBadge } from "@/components/layout/TopStatsBar";
import { useApi, type Learner } from "@/lib/api";
import { AnimatedNumber } from "@/lib/motion";
import { showToast } from "@/lib/toast";

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
    <aside className="desktop-right-rail sticky top-0 flex h-screen w-[420px] shrink-0 flex-col gap-5 overflow-y-auto bg-[var(--duo-bg)] px-6 py-6">
      <StatsRow learner={data} />

      {variant === "learn" && (
        <>
          <SuperCard />
          <LeagueCard learner={data} />
          <QuestsCard learner={data} />
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
      className="flex items-center justify-between gap-2 px-1 text-[17px] font-extrabold"
      aria-label="Desktop learner statistics"
    >
      <span
        className="flex items-center gap-1.5 text-[var(--duo-yellow)]"
        aria-label={`Total XP: ${learner?.xp ?? 20}`}
        title="Total XP"
      >
        <span className="course-flag" aria-hidden>🇪🇸</span> <AnimatedNumber value={learner?.xp ?? 20} />
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-text-muted)]" aria-label={`Day streak: ${learner?.streak ?? 2}`} title="Day streak">
        <span aria-hidden>🔥</span> <AnimatedNumber value={learner?.streak ?? 2} />
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-blue)]" aria-label="Gems: 100" title="Gems">
        <span aria-hidden>💎</span> 100
      </span>
      <span className="flex items-center gap-1 text-[#FF4B4B]" aria-label={`Hearts: ${learner?.hearts ?? 5}`} title="Hearts">
        <span aria-hidden>♥</span> <AnimatedNumber value={learner?.hearts ?? 5} />
      </span>
    </div>
  );
}

function SuperCard() {
  return (
    <section className="super-promo rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <div className="mb-2 flex items-start justify-between gap-2">
        <SuperBadge />
        <HoloOwlMini />
      </div>
      <h3 className="text-xl font-extrabold text-white">Try Super for free</h3>
      <p className="mt-2 text-base font-semibold leading-snug text-[var(--duo-text-muted)]">
        No ads, personalized practice, and unlimited Legendary!
      </p>
      <button
        type="button"
        onClick={() => showToast("Super — Coming soon")}
        className="duo-btn-blue mt-5 w-full py-4 text-[15px]"
      >
        TRY 1 WEEK FREE
      </button>
    </section>
  );
}

function LeagueCard({ learner }: { learner: Learner | null | undefined }) {
  const xp = learner?.xp ?? 0;
  const joined = (learner?.lessons_completed ?? 0) > 0 || xp > 0;
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-white">Silver League</h3>
        <Link href="/leaderboard" className="text-sm font-extrabold text-[var(--duo-blue)]">
          VIEW LEAGUE
        </Link>
      </div>
      {joined ? (
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>
            🥈
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold text-white">You&apos;re in the league!</p>
            <p className="text-base font-semibold text-[var(--duo-text-muted)]">
              <AnimatedNumber value={xp} /> total XP
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-5xl" aria-hidden>
            😴
          </span>
          <p className="text-base font-semibold leading-snug text-[var(--duo-text-muted)]">
            Complete a lesson to join this week&apos;s leaderboard
          </p>
        </div>
      )}
    </section>
  );
}

function QuestsCard({ learner }: { learner: Learner | null | undefined }) {
  const quest = learner?.quests?.[0];
  const current = quest?.current ?? Math.min(learner?.xp ?? 0, 10);
  const target = quest?.target ?? 10;
  const label = quest?.name ?? "Earn 10 XP";
  const pct = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-white">Daily Quests</h3>
        <Link href="/quests" className="text-sm font-extrabold text-[var(--duo-blue)]">
          VIEW ALL
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-3xl" aria-hidden>
          ⚡
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-white">{label}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-[#37464F]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--duo-yellow)]"
                style={{ width: `${pct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white">
                {current} / {target}
              </span>
            </div>
            <span className="text-xl" aria-hidden>🧰</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <div className="discovery-card">
        <h3>Discover more</h3>
        <Link href="/practice">Explore language practice <span aria-hidden>›</span></Link>
        <Link href="/practice/listen">Build your listening skills <span aria-hidden>›</span></Link>
      </div>
    </section>
  );
}

function MonthlyBadgesCard() {
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <h3 className="mb-5 text-lg font-extrabold text-white">Monthly Badges</h3>
      <div className="space-y-5">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#37464F] text-2xl">
            🏅
          </div>
          <p className="text-base font-semibold leading-snug text-[var(--duo-text-muted)]">
            Complete 20 quests to earn this month&apos;s badge
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#37464F] text-2xl">
            🎧
          </div>
          <div>
            <p className="text-base font-extrabold text-white">Zari&apos;s Movie Binge</p>
            <p className="text-base font-semibold text-[var(--duo-text-muted)]">June 2025</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusCard() {
  const emojis = ["😎", "🎉", "💪", "👀", "🍿", "🇩🇪", "🔥", "💚", "🎯", "📚", "✨", "🦉"];
  return (
    <section className="rounded-2xl border-2 border-[var(--duo-border)] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-white">Set your status</h3>
        <button type="button" className="text-sm font-extrabold text-[var(--duo-blue)]">
          CLEAR
        </button>
      </div>
      <div className="mb-5 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#37464F] text-4xl">
          🧑
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2.5">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            className="flex h-12 items-center justify-center rounded-xl border-2 border-[var(--duo-border)] text-xl hover:border-[var(--duo-blue)]"
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
