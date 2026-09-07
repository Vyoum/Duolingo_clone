"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function HomeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M6 14.5L16 6l10 8.5V26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14.5Z"
        fill="#FFC800"
        stroke="#E5A500"
        strokeWidth="1.5"
      />
      <rect x="13" y="18" width="6" height="10" rx="1" fill="#FF4B4B" />
      <circle cx="22" cy="11" r="2.2" fill="#58CC02" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4" y="12" width="8" height="8" rx="2" fill="#1CB0F6" />
      <rect x="20" y="12" width="8" height="8" rx="2" fill="#1CB0F6" />
      <rect x="11" y="14.5" width="10" height="3" rx="1.5" fill="#1899D6" />
    </svg>
  );
}

function LeaguesIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 6h16v10c0 6-5 10-8 11-3-1-8-5-8-11V6Z"
        fill="#FFC800"
        stroke="#E5A500"
        strokeWidth="1.5"
      />
      <path d="M12 14h8M12 18h5" stroke="#8F7200" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function QuestsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="6" y="12" width="20" height="14" rx="3" fill="#FFC800" />
      <rect x="4" y="10" width="24" height="5" rx="2" fill="#FF9600" />
      <rect x="13" y="15" width="6" height="5" rx="1" fill="#FFD900" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M6 12h20l-1 14H7L6 12Z" fill="#CE82FF" />
      <path d="M5 8h22l-1 4H6L5 8Z" fill="#FF4B4B" />
      <rect x="12" y="18" width="8" height="8" fill="#1CB0F6" />
    </svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" fill={active ? "#4B2E6A" : "#3A2A4F"} />
      <circle cx="16" cy="13" r="5" fill="#F5D0C5" />
      <path d="M8 28c1.5-6 5-8 8-8s6.5 2 8 8" fill="#A855F7" />
      <path
        d="M10 12c2-4 10-4 12 0-2 1-4 1.5-6 1.5S12 13 10 12Z"
        fill="#7C3AED"
      />
    </svg>
  );
}

const items: NavItem[] = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/practice", label: "Practice", icon: <PracticeIcon /> },
  { href: "/leaderboard", label: "Leagues", icon: <LeaguesIcon /> },
  { href: "/quests", label: "Quests", icon: <QuestsIcon /> },
  { href: "/shop", label: "Shop", icon: <ShopIcon /> },
  { href: "/profile", label: "Profile", icon: <ProfileIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 flex h-[var(--duo-nav-height)] w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t-2 border-duo-border bg-duo-bg px-1"
      aria-label="Main"
    >
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
              active ? "outline outline-[3px] outline-duo-blue" : ""
            }`}
          >
            {item.href === "/profile" ? <ProfileIcon active={active} /> : item.icon}
          </Link>
        );
      })}
    </nav>
  );
}
