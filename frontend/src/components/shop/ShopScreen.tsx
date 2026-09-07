"use client";

import { SuperBadge, TopStatsBar } from "@/components/layout/TopStatsBar";
import { showToast } from "@/lib/toast";

function toastComingSoon(label: string) {
  showToast(`${label} — Coming soon`);
}

export function ShopScreen() {
  return (
    <>
      <TopStatsBar />
      <div className="px-4 pb-6 pt-2">
        {/* Super trial promo */}
        <section
          className="relative mb-8 overflow-hidden rounded-2xl px-5 pb-5 pt-4 text-center"
          style={{
            background: "linear-gradient(135deg, #0D9488 0%, #1D4ED8 50%, #6D28D9 100%)",
          }}
        >
          <div className="flex justify-end">
            <SuperBadge />
          </div>
          <div className="mx-auto my-2 flex justify-center">
            <HoloOwl />
          </div>
          <p className="mx-auto max-w-[280px] text-lg font-extrabold leading-snug text-white">
            Start a 1 week free trial to enjoy exclusive Super benefits
          </p>
          <button
            type="button"
            onClick={() => toastComingSoon("Super free trial")}
            className="mt-4 w-full rounded-2xl border-b-4 border-[#C4B5FD] bg-white py-3.5 text-sm font-extrabold tracking-wide text-duo-bg transition active:translate-y-[2px] active:border-b-2"
          >
            START MY FREE 7 DAYS
          </button>
        </section>

        <SectionTitle>Hearts</SectionTitle>

        <ShopRow
          icon={<HeartRefillIcon />}
          title="Refill Hearts"
          description="Get full hearts so you can worry less about making mistakes in a lesson"
          action={
            <span className="rounded-2xl border-2 border-duo-border px-4 py-2 text-sm font-extrabold tracking-wide text-duo-muted">
              FULL
            </span>
          }
        />

        <ShopRow
          icon={<UnlimitedHeartIcon />}
          title="Unlimited Hearts"
          description="Never run out of hearts with Super!"
          action={
            <button
              type="button"
              onClick={() => toastComingSoon("Unlimited Hearts")}
              className="rounded-2xl border-2 border-b-4 border-duo-border px-3 py-2 text-sm font-extrabold tracking-wide text-[#F472B6]"
            >
              FREE TRIAL
            </button>
          }
        />

        <SectionTitle>Power-Ups</SectionTitle>

        <ShopRow
          icon={<StreakFreezeIcon />}
          title="Streak Freeze"
          description="Streak Freeze allows your streak to remain in place for one full day of inactivity."
          meta="0 / 2 EQUIPPED"
          action={
            <button
              type="button"
              onClick={() => toastComingSoon("Streak Freeze")}
              className="flex items-center gap-1 rounded-2xl border-2 border-b-4 border-duo-border px-3 py-2 text-sm font-extrabold tracking-wide text-white"
            >
              GET FOR:
              <GemTiny />
              200
            </button>
          }
        />
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-2 flex items-center gap-3">
      <h2 className="text-2xl font-extrabold text-white">{children}</h2>
      <div className="h-0.5 flex-1 bg-duo-border" />
    </div>
  );
}

function ShopRow({
  icon,
  title,
  description,
  action,
  meta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  meta?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b-2 border-duo-border py-5">
      <div className="shrink-0 pt-1">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-extrabold text-white">{title}</h3>
            <p className="mt-1 text-sm font-semibold leading-snug text-duo-muted">
              {description}
            </p>
            {meta && (
              <span className="mt-2 inline-block rounded-full bg-duo-surface px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-duo-muted">
                {meta}
              </span>
            )}
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </div>
  );
}

function GemTiny() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2 4 8l8 14 8-14-8-6Z" fill="#1CB0F6" />
    </svg>
  );
}

function HeartRefillIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
      <path
        d="M24 42s-14-9-18-17C2.5 17 7 10 14 10c3.5 0 6 2 8 4.5C24 12 26.5 10 30 10c7 0 11.5 7 8 15-4 8-14 17-14 17Z"
        fill="#FF4B4B"
        stroke="#fff"
        strokeWidth="3"
      />
    </svg>
  );
}

function UnlimitedHeartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="uh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M24 42s-14-9-18-17C2.5 17 7 10 14 10c3.5 0 6 2 8 4.5C24 12 26.5 10 30 10c7 0 11.5 7 8 15-4 8-14 17-14 17Z"
        fill="url(#uh)"
      />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontSize="16"
        fontWeight="900"
        fill="#fff"
      >
        ∞
      </text>
    </svg>
  );
}

function StreakFreezeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden>
      <rect x="10" y="10" width="28" height="28" rx="8" fill="#7DD3FC" />
      <rect x="14" y="14" width="20" height="20" rx="5" fill="#38BDF8" />
      <path
        d="M24 18c3 2 4 5 4 8 0 4-2 8-4 10-2-2-4-6-4-10 0-3 1-6 4-8Z"
        fill="#E0F2FE"
      />
    </svg>
  );
}

function HoloOwl() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
      <defs>
        <linearGradient id="owl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="40%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#E879F9" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="56" rx="28" ry="26" fill="url(#owl)" />
      <circle cx="34" cy="48" r="10" fill="#fff" />
      <circle cx="62" cy="48" r="10" fill="#fff" />
      <circle cx="35" cy="49" r="4" fill="#111" />
      <circle cx="63" cy="49" r="4" fill="#111" />
      <path d="M44 58l4 6 4-6" fill="#F59E0B" />
      <path d="M28 28c6-10 16-12 20-8 4-4 14-2 20 8-8 2-14 4-20 4s-12-2-20-4Z" fill="url(#owl)" />
    </svg>
  );
}
