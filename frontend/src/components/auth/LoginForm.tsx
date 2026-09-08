"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { showToast } from "@/lib/toast";

const DEMO_COOKIE = "duo_demo_session=1; path=/; max-age=604800; SameSite=Lax";

/** Fixed mocked learner (same UUID as gateway MOCK_USER_ID / README). */
export const DEMO_LEARNER = {
  name: "Vyoum",
  username: "Vyoumm",
  password: "demo123",
  userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  progress: "20 XP · 2-day streak · Greetings done",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function enterDemo() {
    document.cookie = DEMO_COOKIE;
    router.push("/");
    router.refresh();
  }

  function useDemoAccount() {
    setEmail(DEMO_LEARNER.username);
    setPassword(DEMO_LEARNER.password);
    setShowPassword(true);
    enterDemo();
  }

  function fillDemoCredentials() {
    setEmail(DEMO_LEARNER.username);
    setPassword(DEMO_LEARNER.password);
    setShowPassword(true);
    showToast("Demo credentials filled — click LOG IN");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    enterDemo();
  }

  return (
    <div className="relative flex min-h-full flex-col bg-[#131f24]">
      {/* Top bar */}
      <header className="flex items-start justify-between gap-4 px-4 py-4 md:px-8 md:py-5">
        <Link
          href="/login"
          aria-label="Close"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center text-[#afafaf] transition hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 4l12 12M16 4 4 16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        <aside
          className="w-full max-w-[280px] rounded-2xl border-2 border-[#37464f] bg-[#1a2c32] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:max-w-[300px]"
          aria-label="Demo learner credentials"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1cb0f6]">
            Demo learner
          </p>
          <p className="mt-1 text-[15px] font-extrabold text-white">{DEMO_LEARNER.name}</p>
          <p className="mt-1.5 text-[11px] font-semibold leading-snug text-[#afc2ca]">
            Real seeded backend learner — not a UI mock. Progress (Greetings done, XP, streak) is stored in Progress/Gamification and shows on the path after login.
          </p>
          <dl className="mt-2 space-y-1 text-[12px] font-bold leading-snug text-[#afafaf]">
            <div className="flex gap-2">
              <dt className="shrink-0 text-[#7a929c]">User</dt>
              <dd className="min-w-0 break-all text-white">{DEMO_LEARNER.username}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-[#7a929c]">Pass</dt>
              <dd className="text-white">{DEMO_LEARNER.password}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-[#7a929c]">ID</dt>
              <dd className="min-w-0 break-all font-mono text-[10px] text-[#d1d0d3]">
                {DEMO_LEARNER.userId}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-[#7a929c]">Seed</dt>
              <dd className="text-[#9ce455]">{DEMO_LEARNER.progress}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="rounded-xl border-2 border-[#37464f] px-3 py-2 text-[11px] font-extrabold tracking-wide text-[#afafaf] transition hover:border-[#1cb0f6] hover:text-[#1cb0f6]"
            >
              FILL CREDENTIALS
            </button>
            <button
              type="button"
              onClick={useDemoAccount}
              className="rounded-xl bg-[#1cb0f6] px-3 py-2 text-[11px] font-extrabold tracking-wide text-[#131f24] shadow-[0_3px_0_#1899d6] transition active:translate-y-[1px] active:shadow-[0_2px_0_#1899d6]"
            >
              LOG IN AS DEMO
            </button>
          </div>
        </aside>
      </header>

      {/* Centered form — web modal width */}
      <main className="flex flex-1 flex-col items-center px-6 pb-10 pt-2 md:pt-6">
        <div className="w-full max-w-[375px]">
          <h1 className="mb-8 text-center text-[28px] font-extrabold leading-none text-white">
            Log in
          </h1>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="login-email">
              Email or username
            </label>
            <input
              id="login-email"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[52px] w-full rounded-2xl border-2 border-[#e5e5a8] bg-[#ffffd6] px-4 text-[16px] font-bold text-[#131f24] outline-none placeholder:text-[#7a7a5c] focus:border-[#1cb0f6]"
            />

            <div className="relative">
              <label className="sr-only" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[52px] w-full rounded-2xl border-2 border-[#e5e5a8] bg-[#ffffd6] py-3 pl-4 pr-24 text-[16px] font-bold text-[#131f24] outline-none placeholder:text-[#7a7a5c] focus:border-[#1cb0f6]"
              />
              <button
                type="button"
                onClick={() => {
                  if (password.length === 0) {
                    showToast("Password reset — Coming soon in demo mode");
                    return;
                  }
                  setShowPassword((v) => !v);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-extrabold tracking-wide text-[#7a9bb0] hover:text-[#1cb0f6]"
              >
                FORGOT?
              </button>
            </div>

            <button
              type="submit"
              className="mt-2 h-[50px] w-full rounded-2xl bg-[#1cb0f6] text-[15px] font-extrabold tracking-wide text-[#131f24] shadow-[0_4px_0_#1899d6] transition active:translate-y-[2px] active:shadow-[0_2px_0_#1899d6]"
            >
              LOG IN
            </button>
          </form>

          <p className="mt-4 text-center text-[13px] font-bold leading-snug text-[#1cb0f6]">
            Demo user with real seeded progress — not a mock UI. Log in above to open the path mid-course (Greetings already done).
          </p>

          {/* OR divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#37464f]" />
            <span className="text-[14px] font-extrabold tracking-wide text-[#52656d]">
              OR
            </span>
            <div className="h-px flex-1 bg-[#37464f]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SocialButton
              label="GOOGLE"
              onClick={enterDemo}
              icon={<GoogleIcon />}
            />
            <SocialButton
              label="FACEBOOK"
              onClick={enterDemo}
              icon={<FacebookIcon />}
            />
          </div>

          <footer className="mt-10 space-y-3 text-center text-[12px] font-semibold leading-relaxed text-[#52656d]">
            <p>
              By signing in to Duolingo, you agree to our{" "}
              <span className="text-[#afafaf]">Terms</span> and{" "}
              <span className="text-[#afafaf]">Privacy Policy</span>.
            </p>
            <p>
              This site is protected by reCAPTCHA Enterprise and the Google{" "}
              <span className="text-[#afafaf]">Privacy Policy</span> and{" "}
              <span className="text-[#afafaf]">Terms of Service</span> apply.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border-2 border-[#37464f] text-[13px] font-extrabold tracking-wide text-[#afafaf] transition hover:border-[#52656d] hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}
