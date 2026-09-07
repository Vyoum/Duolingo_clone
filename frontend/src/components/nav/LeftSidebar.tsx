"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { showToast } from "@/lib/toast";

const NAV = [
  { href: "/", label: "LEARN", match: (p: string) => p === "/" },
  { href: "/practice", label: "PRACTICE", match: (p: string) => p.startsWith("/practice") },
  { href: "/leaderboard", label: "LEADERBOARDS", match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/quests", label: "QUESTS", match: (p: string) => p.startsWith("/quests") },
  { href: "/shop", label: "SHOP", match: (p: string) => p.startsWith("/shop") },
  { href: "/profile", label: "PROFILE", match: (p: string) => p.startsWith("/profile") },
] as const;

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r-2 border-duo-border bg-duo-bg px-4 py-6">
      <Link href="/" className="mb-6 px-3 text-[32px] font-black leading-none tracking-tight text-duo-green">
        duolingo
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5" aria-label="Main">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-extrabold tracking-wide transition ${
                active
                  ? "border-2 border-duo-blue bg-duo-surface text-duo-blue"
                  : "border-2 border-transparent text-white hover:bg-duo-bg-elevated"
              }`}
            >
              <NavIcon label={item.label} active={active} />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl border-2 border-transparent px-3 py-3 text-left text-[15px] font-extrabold tracking-wide text-white hover:bg-duo-bg-elevated"
          onClick={() => showToast("More — Coming soon")}
        >
          <MoreIcon />
          MORE
        </button>
      </nav>

      <div className="duo-panel mt-4 p-4">
        <div className="mb-2 flex items-start gap-2">
          <span className="text-2xl" aria-hidden>
            ♞
          </span>
          <p className="text-sm font-bold leading-snug text-white">
            Want to learn chess? Duolingo makes it easy!
          </p>
        </div>
        <button
          type="button"
          onClick={() => showToast("Chess — Coming soon")}
          className="text-sm font-extrabold tracking-wide text-duo-blue"
        >
          TRY CHESS
        </button>
      </div>
    </aside>
  );
}

function NavIcon({ label, active }: { label: string; active?: boolean }) {
  switch (label) {
    case "LEARN":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <path d="M6 14.5L16 6l10 8.5V26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14.5Z" fill="#FFC800" />
          <rect x="13" y="18" width="6" height="10" rx="1" fill="#FF4B4B" />
        </svg>
      );
    case "PRACTICE":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <rect x="4" y="12" width="8" height="8" rx="2" fill="#1CB0F6" />
          <rect x="20" y="12" width="8" height="8" rx="2" fill="#1CB0F6" />
          <rect x="11" y="14.5" width="10" height="3" rx="1.5" fill="#1899D6" />
        </svg>
      );
    case "LEADERBOARDS":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <path d="M8 6h16v10c0 6-5 10-8 11-3-1-8-5-8-11V6Z" fill="#FFC800" />
        </svg>
      );
    case "QUESTS":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <rect x="6" y="12" width="20" height="14" rx="3" fill="#FFC800" />
          <rect x="4" y="10" width="24" height="5" rx="2" fill="#FF9600" />
        </svg>
      );
    case "SHOP":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <path d="M6 12h20l-1 14H7L6 12Z" fill="#CE82FF" />
          <path d="M5 8h22l-1 4H6L5 8Z" fill="#FF4B4B" />
        </svg>
      );
    case "PROFILE":
      return (
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="14" fill={active ? "#4B2E6A" : "#3A2A4F"} />
          <circle cx="16" cy="13" r="5" fill="#F5D0C5" />
          <path d="M8 28c1.5-6 5-8 8-8s6.5 2 8 8" fill="#A855F7" />
        </svg>
      );
    default:
      return null;
  }
}

function MoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#CE82FF" />
      <circle cx="10" cy="16" r="2" fill="#fff" />
      <circle cx="16" cy="16" r="2" fill="#fff" />
      <circle cx="22" cy="16" r="2" fill="#fff" />
    </svg>
  );
}
