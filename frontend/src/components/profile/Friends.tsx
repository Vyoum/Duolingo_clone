"use client";

import { useState } from "react";
import type { Friend } from "@/lib/profile-data";

function AvatarBubble({ name, hue }: { name: string; hue: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
      style={{ background: hue }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function FriendSuggestions({ suggestions }: { suggestions: Friend[] }) {
  const [items, setItems] = useState(suggestions);

  return (
    <section className="mx-4 mt-8">
      <h3 className="mb-3 text-2xl font-extrabold text-white">Friend suggestions</h3>
      <div className="duo-card overflow-hidden">
        {items.map((friend, index) => (
          <div
            key={friend.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              index < items.length - 1 ? "border-b-2 border-[var(--duo-border)]" : ""
            }`}
          >
            <AvatarBubble name={friend.name} hue={friend.avatarHue} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold text-white">{friend.name}</p>
              <p className="truncate text-sm font-semibold text-[var(--duo-text-muted)]">
                {friend.caption}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Add ${friend.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--duo-blue)] text-xl font-black text-[#131f24]"
            >
              +
            </button>
            <button
              type="button"
              aria-label={`Dismiss ${friend.name}`}
              onClick={() => setItems((prev) => prev.filter((f) => f.id !== friend.id))}
              className="px-1 text-lg font-bold text-[var(--duo-text-muted)]"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex w-full items-center justify-between border-t-2 border-[var(--duo-border)] px-4 py-3.5 text-left font-extrabold text-white"
        >
          View all
          <span className="text-[var(--duo-text-muted)]">›</span>
        </button>
      </div>
    </section>
  );
}

export function FriendsSection({ following }: { following: Friend[] }) {
  const [tab, setTab] = useState<"following" | "followers">("following");
  const preview = following.slice(0, 2);
  const remaining = Math.max(following.length - preview.length, 0);

  return (
    <section className="mx-4 mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-2xl font-extrabold text-white">Friends</h3>
        <button type="button" className="text-sm font-extrabold tracking-wide text-[var(--duo-blue)]">
          ADD FRIENDS
        </button>
      </div>

      <div className="mb-3 flex border-b-2 border-[var(--duo-border)]">
        {(
          [
            ["following", "FOLLOWING"],
            ["followers", "FOLLOWERS"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-extrabold tracking-wide ${
              tab === key
                ? "border-b-4 border-[var(--duo-blue)] text-[var(--duo-blue)]"
                : "text-[var(--duo-text-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="duo-card overflow-hidden">
        {tab === "following" ? (
          <>
            {preview.map((friend, index) => (
              <div
                key={friend.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  index < preview.length - 1
                    ? "border-b-2 border-[var(--duo-border)]"
                    : ""
                }`}
              >
                <AvatarBubble name={friend.name} hue={friend.avatarHue} />
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-white">{friend.name}</p>
                  <p className="text-sm font-semibold text-[var(--duo-text-muted)]">
                    {friend.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <button
                type="button"
                className="flex w-full items-center justify-between border-t-2 border-[var(--duo-border)] px-4 py-3.5 font-extrabold text-white"
              >
                View {remaining} more
                <span className="text-[var(--duo-text-muted)]">›</span>
              </button>
            )}
          </>
        ) : (
          <p className="px-4 py-8 text-center font-bold text-[var(--duo-text-muted)]">
            No followers yet
          </p>
        )}
      </div>
    </section>
  );
}

export function InviteFriendsCard() {
  return (
    <section className="duo-card mx-4 mt-5 p-4">
      <div className="flex items-start gap-3">
        <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
          <ellipse cx="24" cy="28" rx="16" ry="14" fill="#58CC02" />
          <circle cx="18" cy="24" r="3.5" fill="#fff" />
          <circle cx="30" cy="24" r="3.5" fill="#fff" />
          <circle cx="18.5" cy="24.5" r="1.6" fill="#111" />
          <circle cx="30.5" cy="24.5" r="1.6" fill="#111" />
          <rect x="28" y="8" width="14" height="18" rx="2" fill="#FFC800" />
          <path d="M28 10h14l-7 6-7-6Z" fill="#FF9600" />
        </svg>
        <div>
          <h4 className="text-lg font-extrabold text-white">Invite friends</h4>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--duo-text-muted)]">
            Tell your friends it&apos;s free and fun to learn a language on Duolingo!
          </p>
        </div>
      </div>
      <button type="button" className="duo-btn-blue mt-4 w-full py-3.5 text-[15px]">
        Invite Friends
      </button>
    </section>
  );
}
