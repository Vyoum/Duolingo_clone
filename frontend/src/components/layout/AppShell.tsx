import { BottomNav } from "@/components/nav/BottomNav";
import { LeftSidebar } from "@/components/nav/LeftSidebar";
import { RightRail } from "@/components/nav/RightRail";

/**
 * Duo web layout on large screens (left nav + center + right widgets).
 * Mobile keeps the phone-width shell + bottom tab bar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop / tablet web view */}
      <div className="desktop-learning-shell hidden min-h-screen bg-[var(--duo-bg)] lg:flex">
        <LeftSidebar />
        <main className="desktop-learning-main flex min-w-0 flex-1 justify-center">
          <div className="desktop-learning-content w-full max-w-[780px] px-6 py-6">{children}</div>
        </main>
        <RightRail />
      </div>

      {/* Mobile view */}
      <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col bg-[var(--duo-bg)] lg:hidden">
        <div className="flex-1 pb-[calc(var(--duo-nav-height)+12px)]">{children}</div>
        <BottomNav />
      </div>
    </>
  );
}
