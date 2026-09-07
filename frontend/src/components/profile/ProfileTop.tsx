"use client";

import { useState } from "react";

export function ProfileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-center border-b-2 border-[var(--duo-border)] bg-[var(--duo-bg)]">
      <h1 className="text-lg font-extrabold tracking-wide text-white">Profile</h1>
      <button
        type="button"
        aria-label="Settings"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--duo-text-muted)]"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19.4 13a7.7 7.7 0 0 0 .05-2l2.05-1.6-2-3.46-2.45.9a7.6 7.6 0 0 0-1.73-1L15 3h-6l-.37 2.84a7.6 7.6 0 0 0-1.73 1l-2.45-.9-2 3.46L4.55 11a7.7 7.7 0 0 0 0 2l-2.05 1.6 2 3.46 2.45-.9a7.6 7.6 0 0 0 1.73 1L9 21h6l.37-2.84a7.6 7.6 0 0 0 1.73-1l2.45.9 2-3.46L19.4 13Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}

export function AvatarCard() {
  return (
    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl bg-[var(--duo-avatar-bg)]">
      <div className="flex h-44 items-end justify-center pb-2">
        {/* Flat cartoon avatar — placeholder style matching Duo illustrations */}
        <svg width="140" height="150" viewBox="0 0 140 150" aria-hidden>
          <ellipse cx="70" cy="145" rx="40" ry="8" fill="#cfcfcf" />
          <rect x="45" y="95" width="50" height="45" rx="12" fill="#6D28D9" />
          <circle cx="70" cy="62" r="38" fill="#F5C7A9" />
          <path
            d="M32 58c8-28 68-28 76 0-10 8-24 12-38 12S42 66 32 58Z"
            fill="#1a1a1a"
          />
          <circle cx="56" cy="68" r="7" fill="#fff" />
          <circle cx="84" cy="68" r="7" fill="#fff" />
          <circle cx="57" cy="69" r="3" fill="#222" />
          <circle cx="85" cy="69" r="3" fill="#222" />
          <path
            d="M62 82c4 5 12 5 16 0"
            stroke="#222"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      <button
        type="button"
        aria-label="Edit profile"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--duo-border)] bg-white shadow"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20h4l10.5-10.5-4-4L4 16v4Z"
            stroke="#37464F"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="m13 6.5 4 4" stroke="#37464F" strokeWidth="2" />
        </svg>
      </button>
    </div>
  );
}

export function IdentityRow({
  displayName,
  username,
  joined,
  friendsCount,
}: {
  displayName: string;
  username: string;
  joined: string;
  friendsCount: number;
}) {
  return (
    <div className="mx-4 mt-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-2xl font-extrabold text-white">{displayName}</h2>
        <p className="text-[15px] font-semibold text-[var(--duo-text-muted)]">
          {username}
        </p>
        <p className="mt-2 text-sm font-bold text-white">{joined}</p>
        <button type="button" className="mt-1 text-sm font-extrabold text-[var(--duo-blue)]">
          {friendsCount} Friends
        </button>
      </div>
      <div className="flex shrink-0 gap-2 pt-1">
        <FlagBadge code="de" label="German" />
        <FlagBadge code="fr" label="French" />
      </div>
    </div>
  );
}

function FlagBadge({ code, label }: { code: "de" | "fr"; label: string }) {
  return (
    <div
      className="h-10 w-12 overflow-hidden rounded-xl border-2 border-[var(--duo-border)]"
      title={label}
      aria-label={label}
    >
      {code === "de" ? (
        <div className="flex h-full flex-col">
          <div className="flex-1 bg-black" />
          <div className="flex-1 bg-[#DD0000]" />
          <div className="flex-1 bg-[#FFCE00]" />
        </div>
      ) : (
        <div className="flex h-full">
          <div className="flex-1 bg-[#002395]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#ED2939]" />
        </div>
      )}
    </div>
  );
}

export function LinkedInBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <section className="duo-card relative mx-4 mt-5 overflow-hidden p-4">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setHidden(true)}
        className="absolute right-3 top-3 text-[var(--duo-text-muted)]"
      >
        ✕
      </button>
      <div className="flex items-start gap-3 pr-6">
        <p className="flex-1 text-lg font-extrabold leading-snug text-white">
          Add your Duolingo Score to LinkedIn!
        </p>
        <div className="relative h-16 w-16 shrink-0">
          <div className="absolute right-0 top-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A66C2] text-xs font-black text-white">
            in
          </div>
          <svg
            className="absolute bottom-0 left-0"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            aria-hidden
          >
            <ellipse cx="20" cy="24" rx="14" ry="12" fill="#58CC02" />
            <circle cx="14" cy="20" r="3" fill="#fff" />
            <circle cx="26" cy="20" r="3" fill="#fff" />
            <circle cx="14.5" cy="20.5" r="1.4" fill="#111" />
            <circle cx="26.5" cy="20.5" r="1.4" fill="#111" />
            <path d="M12 8c4-6 12-6 16 0-3 2-7 3-8 3s-5-1-8-3Z" fill="#58CC02" />
          </svg>
        </div>
      </div>
      <button type="button" className="duo-btn-blue mt-4 w-full py-3.5 text-[15px]">
        Get Started
      </button>
    </section>
  );
}
