"use client";

import Link from "next/link";
import { SuperBadge, TopStatsBar } from "@/components/layout/TopStatsBar";

function toastComingSoon(label: string) {
  // Lightweight placeholder for the remaining optional collections.
  window.alert(`${label} — Coming soon`);
}

export function PracticeScreen() {
  return (
    <>
      <TopStatsBar />
      <div className="px-4"><Link href="/" className="action-button">Practice a lesson</Link></div>
      <div className="px-4 pb-4 pt-2">
        <Link href="/practice/legendary" className="legendary-card">
          <span className="legendary-card-art" aria-hidden>🏆</span>
          <span><strong>Legendary</strong><small>Beat the clock to earn 15 XP</small></span>
          <b>START</b>
        </Link>
        <h2 className="mb-3 text-2xl font-extrabold text-white">Today&apos;s Review</h2>

        {/* Featured Listen-Up card */}
        <Link
          href="/practice/listen"
          className="relative mb-8 w-full overflow-hidden rounded-2xl p-5 text-left"
          style={{
            background: "linear-gradient(135deg, #0E4D4A 0%, #1A3A6B 45%, #4B2A8A 100%)",
          }}
        >
          <SuperBadge />
          <h3 className="mt-3 text-2xl font-extrabold text-white">Listen-Up</h3>
          <p className="mt-1 max-w-[58%] text-sm font-semibold leading-snug text-white/85">
            Sharpen your ear with focused listening practice
          </p>
          <span className="mt-5 inline-flex rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold tracking-wide text-[#6B21A8]">
            UNLOCK
          </span>
          <div className="pointer-events-none absolute bottom-0 right-2">
            <ListenCharacter />
          </div>
        </Link>

        <h2 className="mb-3 text-2xl font-extrabold text-white">Conversation</h2>
        <div className="mb-8 space-y-3">
          <PracticeRow
            title="Speak"
            superBadge
            description="Improve your speaking skills with these phrases"
            href="/practice/speak"
            art={<MicArt />}
          />
          <PracticeRow
            title="Listen"
            superBadge
            description="Boost your listening skills with an audio-only session"
            href="/practice/listen"
            art={<HeadphonesArt />}
          />
        </div>

        <h2 className="mb-3 text-2xl font-extrabold text-white">Your collections</h2>
        <div className="space-y-3">
          <PracticeRow
            title="Mistakes"
            superBadge
            description="Start a personalized lesson to practice your mistakes"
            onClick={() => toastComingSoon("Mistakes")}
            art={<MistakesArt />}
          />
          <PracticeRow
            title="Words"
            superBadge
            description="Review your Spanish vocabulary at any time"
            onClick={() => toastComingSoon("Words")}
            art={<WordsArt />}
          />
          <PracticeRow
            title="Stories"
            description="Reread a story to review words in context"
            onClick={() => toastComingSoon("Stories")}
            art={<StoriesArt />}
          />
        </div>
      </div>
    </>
  );
}

function PracticeRow({
  title,
  description,
  superBadge,
  badge,
  art,
  onClick,
  href,
}: {
  title: string;
  description: string;
  superBadge?: boolean;
  badge?: string;
  art: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-2 border-[var(--duo-border)] bg-[var(--duo-bg)] px-4 py-4 text-left transition hover:bg-[#1a2c32]";

  const body = (
    <>
      {superBadge && (
        <div className="absolute right-3 top-3">
          <SuperBadge />
        </div>
      )}
      {badge && (
        <span className="absolute right-3 top-3 rounded-md bg-[#37464f] px-2 py-0.5 text-[10px] font-black text-white">
          {badge}
        </span>
      )}
      <div className="min-w-0 flex-1 pr-16">
        <h3 className="text-lg font-extrabold text-white">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-snug text-[var(--duo-text-muted)]">
          {description}
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-2 opacity-90">{art}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

function ListenCharacter() {
  return (
    <svg width="110" height="130" viewBox="0 0 110 130" aria-hidden>
      <ellipse cx="55" cy="122" rx="28" ry="6" fill="#00000044" />
      <rect x="38" y="78" width="34" height="40" rx="8" fill="#F472B6" />
      <rect x="40" y="108" width="14" height="16" rx="4" fill="#58CC02" />
      <rect x="56" y="108" width="14" height="16" rx="4" fill="#58CC02" />
      <circle cx="55" cy="52" r="28" fill="#F5C7A9" />
      <path d="M30 48c6-20 44-20 50 0-8 6-18 9-25 9s-17-3-25-9Z" fill="#3f3f46" />
      <rect x="22" y="42" width="14" height="22" rx="7" fill="#9CA3AF" />
      <rect x="74" y="42" width="14" height="22" rx="7" fill="#9CA3AF" />
      <path d="M36 52h38" stroke="#6B7280" strokeWidth="4" />
      <circle cx="46" cy="56" r="3" fill="#222" />
      <circle cx="64" cy="56" r="3" fill="#222" />
      <path d="M48 68c4 3 10 3 14 0" stroke="#222" strokeWidth="2" fill="none" />
      <rect x="18" y="70" width="12" height="8" rx="2" fill="#1CB0F6" />
    </svg>
  );
}

function MicArt() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <rect x="26" y="8" width="12" height="28" rx="6" fill="#2DD4BF" />
      <path
        d="M18 32c0 10 6 16 14 16s14-6 14-16"
        stroke="#14B8A6"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M32 48v8M24 56h16" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function HeadphonesArt() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <path
        d="M12 36V28c0-12 9-20 20-20s20 8 20 20v8"
        stroke="#FF4B4B"
        strokeWidth="6"
        fill="none"
      />
      <rect x="8" y="34" width="14" height="18" rx="4" fill="#FF4B4B" />
      <rect x="42" y="34" width="14" height="18" rx="4" fill="#FF4B4B" />
    </svg>
  );
}

function MistakesArt() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="28" r="24" fill="#FF9600" />
      <path
        d="M18 28a10 10 0 0 1 16-8M38 28a10 10 0 0 1-16 8"
        stroke="#fff"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M32 16l4 4-4 2M24 40l-4-4 4-2" fill="#fff" />
    </svg>
  );
}

function WordsArt() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden>
      <rect x="8" y="10" width="28" height="36" rx="6" fill="#1CB0F6" transform="rotate(-8 22 28)" />
      <rect x="28" y="8" width="28" height="36" rx="6" fill="#7FD9FF" transform="rotate(8 42 26)" />
      <circle cx="52" cy="12" r="3" fill="#FFC800" />
      <circle cx="10" cy="18" r="2" fill="#FFC800" />
    </svg>
  );
}

function StoriesArt() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden>
      <path d="M8 12c10 0 16 4 24 4s14-4 24-4v36c-10 0-16 4-24 4s-14-4-24-4V12Z" fill="#CE82FF" />
      <path d="M32 16v36" stroke="#A855F7" strokeWidth="3" />
      <path d="M14 20h12M14 28h10M38 20h12M38 28h10" stroke="#E9D5FF" strokeWidth="2" />
    </svg>
  );
}
