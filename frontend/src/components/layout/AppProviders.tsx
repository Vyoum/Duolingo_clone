"use client";

import { BadgeUnlockWatcher } from "@/components/learn/BadgeUnlock";
import { ToastViewport } from "@/components/layout/ToastViewport";

/** Client-only global overlays that belong on every route. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BadgeUnlockWatcher />
      <ToastViewport />
      {children}
    </>
  );
}
