import { test, expect } from "@playwright/test";

// Browser contract test with controlled HTTP responses. Persistence and grading
// are exercised separately by backend tests and learning.spec.ts's real stack test.
test.beforeEach(async ({ context, page }, testInfo) => {
  await page.route("**/api/warmup", route => route.fulfill({ json: { ready: true } }));
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string") throw new Error("Playwright baseURL is required");
  await context.addCookies([
    { name: "duo_demo_session", value: "1", url: baseURL },
  ]);
});

test("UI renders five exercise types, restores progress, feedback, and completion", async ({ page }) => {
  let position = 0;
  let mistakes = 0;
  const matched: Record<string, string> = {};
  const exercises = [
    { id: "one", payload: { type: "multiple_choice", prompt: "Choose hello", options: ["hola", "adiós"] } },
    { id: "two", payload: { type: "translate", prompt: "Translate good morning", tokens: ["Buenos", "días"] } },
    { id: "three", payload: { type: "match", prompt: "Match food words", left: ["apple", "milk"], right: ["leche", "manzana"] } },
    { id: "four", payload: { type: "fill_blank", prompt: "Complete the sentence", sentence: "Yo quiero ____.", options: ["agua", "rojo"] } },
    { id: "five", payload: { type: "type_answer", prompt: "Type goodbye" } },
  ];
  const submissions: unknown[] = [];
  await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts: 5, xp: 0, streak: 0 } }));
  await page.route("**/api/v1/attempts", route => route.fulfill({ json: { id: "demo", lesson_id: "demo", position, correct: position, incorrect: mistakes, status: "active", matched_pairs: position === 2 ? matched : {}, lesson: { xp_reward: 20, exercises } } }));
  await page.route("**/api/v1/attempts/demo/answers", async route => {
    const body = route.request().postDataJSON();
    expect(route.request().headers()["idempotency-key"]).toBeTruthy();
    submissions.push(body.answer);
    if (body.match_pair) {
      Object.assign(matched, body.answer);
      const exerciseComplete = Object.keys(matched).length === 2;
      if (exerciseComplete) position++;
      await route.fulfill({ json: { correct: true, expected: "Pair matched!", position, completed: false, hearts: 5 - mistakes, out_of_hearts: false, xp_earned: 0, exercise_complete: exerciseComplete, matched_pairs: matched } });
      return;
    }
    const correct = submissions.length !== 1;
    if (correct) position++; else mistakes++;
    await route.fulfill({ json: { correct, expected: "hola", position, completed: position === 5, hearts: 5 - mistakes, out_of_hearts: false, xp_earned: position === 5 ? 20 : 0 } });
  });
  await page.goto("/lesson/demo");
  await page.getByRole("button", { name: /adiós/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Let’s try that again")).toBeVisible();
  const feedbackBar = page.getByTestId("feedback-bar");
  await expect(feedbackBar).toHaveClass(/incorrect/);
  await expect(feedbackBar.locator(".feedback-motion")).toBeVisible();
  const hearts = page.getByLabel("4 hearts");
  await expect(hearts).toHaveClass(/heart-shake/);
  await expect(hearts).toContainText("4");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /hola/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByTestId("correct-voice")).toBeVisible();
  await expect(page.getByTestId("feedback-bar")).toHaveClass(/correct/);
  await expect(page.getByTestId("feedback-bar").locator(".feedback-motion")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Translate good morning" })).toBeVisible();
  await page.getByRole("button", { name: "Buenos", exact: true }).click();
  await page.getByRole("button", { name: "días", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tap the matching pairs" })).toBeVisible();
  await page.getByRole("button", { name: "apple", exact: true }).click();
  await page.getByRole("button", { name: "manzana", exact: true }).click();
  await expect(page.getByRole("button", { name: "apple, matched", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("button", { name: "apple, matched", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "leche", exact: true }).click();
  await page.getByRole("button", { name: "milk", exact: true }).click();
  await page.screenshot({ path: "test-results/player-ui.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /agua/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox").fill("adiós");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await expect(page.getByTestId("lesson-celebration")).toBeVisible();
  await expect(page.getByTestId("xp-rollup")).toHaveAttribute("aria-label", "20 XP earned");
  await expect(page.getByTestId("xp-rollup")).toContainText("20 XP");
  expect(submissions).toEqual([1, 0, ["Buenos", "días"], { apple: "manzana" }, { milk: "leche" }, "agua", "adiós"]);
});

test("UI shows out-of-hearts dialog when start is blocked", async ({ page }) => {
  await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts: 0 } }));
  await page.route("**/api/v1/attempts", route => route.fulfill({ status: 403, json: { detail: "Out of hearts. A heart regenerates every 30 minutes." } }));
  await page.goto("/lesson/demo");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Time for a little break" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the path" })).toBeVisible();
});

test("UI path distinguishes completed, available, and locked lessons", async ({ page }) => {
  await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts: 4, xp: 10, streak: 1 } }));
  await page.route("**/api/v1/path", route => route.fulfill({ json: { name: "Spanish", units: [{ id: "basics", title: "Basics", skills: [
    { id: "greetings", title: "Greetings", icon: "wave", crowns: 1, lessons: [
      { id: "first", completed: true, unlocked: true, xp_reward: 10 },
      { id: "second", completed: false, unlocked: true, xp_reward: 10 },
    ] },
    { id: "food", title: "Food", icon: "apple", crowns: 0, lessons: [{ id: "third", completed: false, unlocked: false, xp_reward: 15 }] },
  ] }] } }));
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Greetings, lesson 1, completed/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Greetings, lesson 2, start/ })).toHaveAttribute("href", "/lesson/second");
  await expect(page.getByRole("button", { name: /Food, lesson 1, locked/ })).toBeDisabled();
  await page.screenshot({ path: "test-results/path-ui.png", fullPage: true });
});

test("responsive stats show live XP and desktop-only gems", async ({ page }) => {
  await page.route("**/api/v1/me", route => route.fulfill({
    json: { hearts: 4, xp: 987, streak: 12 },
  }));
  await page.route("**/api/v1/path", route => route.fulfill({
    json: { name: "Spanish", units: [] },
  }));

  await page.goto("/");
  const mobileStats = page.getByRole("banner", { name: "Mobile learner statistics" });
  await expect(mobileStats).toBeVisible();
  await expect(mobileStats.getByLabel("Day streak: 12")).toBeVisible();
  await expect(mobileStats.getByLabel("Total XP: 987")).toBeVisible();
  await expect(mobileStats.getByLabel("Hearts: 4")).toBeVisible();
  await expect(mobileStats.getByText("132", { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopStats = page.getByLabel("Desktop learner statistics");
  await expect(desktopStats).toBeVisible();
  await expect(desktopStats.getByLabel("Total XP: 987")).toBeVisible();
  await expect(desktopStats.getByLabel("Day streak: 12")).toBeVisible();
  await expect(desktopStats.getByLabel("Gems: 132")).toBeVisible();
  await expect(desktopStats.getByLabel("Hearts: 4")).toBeVisible();
  await expect(desktopStats.getByText("20", { exact: true })).toHaveCount(0);
});

test("achievement badges show live progress and celebrate each unlock once", async ({ page }) => {
  let firstSteps = 0;
  const learner = () => ({
    user_id: "demo",
    name: "Vyoum",
    hearts: 5,
    xp: firstSteps ? 10 : 0,
    streak: 0,
    lessons_completed: firstSteps,
    next_heart_at: null,
    quests: [],
    achievements: [
      { name: "First steps", current: firstSteps, target: 1 },
      { name: "XP explorer", current: 10, target: 100 },
      { name: "On fire", current: 0, target: 3 },
    ],
  });
  await page.route("**/api/v1/me", route => route.fulfill({ json: learner() }));

  await page.goto("/profile");
  const badges = page.locator('[data-testid="achievement-badges"]:visible');
  await expect(badges).toBeVisible();
  await expect(badges.getByLabel("First steps, 0 of 1")).toBeVisible();
  await expect(badges.getByLabel("XP explorer, 10 of 100")).toBeVisible();

  firstSteps = 1;
  await page.evaluate(() => window.dispatchEvent(new Event("learner-updated")));
  const modal = page.getByTestId("badge-unlock-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("heading", { name: "First steps" })).toBeVisible();
  await page.getByRole("button", { name: "Awesome" }).click();
  await expect(modal).toHaveCount(0);
  await expect(badges.getByLabel("First steps, unlocked")).toBeVisible();

  await page.reload();
  await expect(badges.getByLabel("First steps, unlocked")).toBeVisible();
  await expect(modal).toHaveCount(0);
});

test("Legendary practice shows a timer, retries safely, awards XP, and returns to the path", async ({ page }) => {
  const session = {
    id: "11111111-1111-1111-1111-111111111111", position: 0, status: "active",
    deadline: new Date(Date.now() + 60_000).toISOString(), xp_reward: 15,
    lesson: { exercises: [
      { id: "one", payload: { type: "multiple_choice", prompt: "Choose hello", options: ["hola", "adiós"] } },
      { id: "two", payload: { type: "type_answer", prompt: "Type goodbye" } },
    ] },
  };
  let calls = 0;
  await page.route("**/api/v1/practice/legendary", route => route.fulfill({ json: session }));
  await page.route("**/api/v1/practice/legendary/*/answers", async route => {
    calls++;
    if (calls <= 3) { await route.abort("failed"); return; }
    const body = route.request().postDataJSON();
    const final = body.exercise_id === "two";
    await route.fulfill({ json: { correct: true, timeout: false, completed: final, xp_earned: final ? 15 : 0, position: final ? 2 : 1 } });
  });
  await page.goto("/practice/legendary");
  await page.getByRole("button", { name: "Start Legendary" }).click();
  await expect(page.getByLabel(/seconds remaining/)).toBeVisible();
  await page.getByRole("button", { name: "hola", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry saving answer" })).toBeVisible();
  await page.getByRole("button", { name: "Retry saving answer" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Legendary answer").fill("adiós");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Legendary complete!" })).toBeVisible();
  await expect(page.getByText("You earned 15 XP.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to the path" })).toHaveAttribute("href", "/");
  expect(calls).toBe(5);
});

test("Legendary practice ends a run when its server deadline has passed", async ({ page }) => {
  await page.route("**/api/v1/practice/legendary", route => route.fulfill({ json: {
    id: "22222222-2222-2222-2222-222222222222", position: 0, status: "active",
    deadline: new Date(Date.now() - 1_000).toISOString(), xp_reward: 15,
    lesson: { exercises: [{ id: "one", payload: { type: "multiple_choice", prompt: "Choose hello", options: ["hola", "adiós"] } }] },
  } }));
  await page.route("**/api/v1/practice/legendary/*/answers", route => route.fulfill({ json: { correct: false, timeout: true, completed: false, xp_earned: 0, position: 0 } }));
  await page.goto("/practice/legendary");
  await page.getByRole("button", { name: "Start Legendary" }).click();
  await expect(page.getByRole("heading", { name: "Time’s up" })).toBeVisible();
  await expect(page.getByText(/did not earn XP/)).toBeVisible();
});

test("speaking practice uses recognition and falls back to typing", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__disableSpeech")) {
      Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: undefined });
      Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: undefined });
      return;
    }
    class FakeRecognition {
      lang = ""; continuous = false; interimResults = false; maxAlternatives = 1;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() { window.setTimeout(() => { const result = Object.assign([{ transcript: "hola", confidence: 1 }], { isFinal: true }); this.onresult?.({ results: [result] }); }, 0); }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeRecognition });
    Object.defineProperty(window, "webkitSpeechRecognition", { configurable: true, value: FakeRecognition });
  });
  await page.goto("/practice/speak");
  await expect(page.getByText("Microphone ready")).toBeVisible();
  await page.getByRole("button", { name: "Tap to speak" }).click();
  await expect(page.getByText("✓ Sounded great!")).toBeVisible();

  await page.evaluate(() => sessionStorage.setItem("__disableSpeech", "1"));
  await page.reload();
  await expect(page.getByText("Mic unavailable — typing enabled")).toBeVisible();
  await page.getByLabel("Type the Spanish phrase").fill("hola");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("✓ Sounded great!")).toBeVisible();
});

test("listening practice plays normal and slow audio and has a no-audio fallback", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__disableAudio")) {
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
      return;
    }
    class FakeUtterance {
      lang = ""; rate = 1; onend: (() => void) | null = null; onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    const played: number[] = [];
    Object.defineProperty(window, "__playedRates", { value: played });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FakeUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      cancel() {}, getVoices() { return [{}]; }, onvoiceschanged: null,
      speak(utterance: FakeUtterance) { played.push(utterance.rate); window.setTimeout(() => utterance.onend?.(), 0); },
    } });
  });
  await page.goto("/practice/listen");
  await page.getByRole("button", { name: "Play Spanish phrase", exact: true }).click();
  await page.getByRole("button", { name: "Play Spanish phrase slowly" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __playedRates: number[] }).__playedRates)).toEqual([0.92, 0.65]);
  await page.getByRole("button", { name: "hello", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("✓ You got it!")).toBeVisible();

  await page.evaluate(() => sessionStorage.setItem("__disableAudio", "1"));
  await page.reload();
  await expect(page.getByText("Audio is unavailable in this browser.")).toBeVisible();
  await expect(page.getByText("hola", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Spanish phrase", exact: true })).toBeDisabled();
});

test("placeholder actions use dismissible, self-expiring app toasts", async ({ page }) => {
  await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts: 5, xp: 20, streak: 2, achievements: [], quests: [] } }));
  await page.goto("/practice");
  const notices = page.getByLabel("Notifications");
  await page.getByRole("button", { name: /Mistakes/ }).click();
  const first = notices.getByRole("status").filter({ hasText: "Mistakes — Coming soon" });
  await expect(first).toBeVisible();
  await first.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(first).toHaveCount(0);

  await page.getByRole("button", { name: /Stories/ }).click();
  const second = notices.getByRole("status").filter({ hasText: "Stories — Coming soon" });
  await expect(second).toBeVisible();
  await expect(second).toHaveCount(0, { timeout: 5_000 });

  await page.evaluate(() => {
    for (const message of ["One", "Two", "Three", "Four"]) {
      window.dispatchEvent(new CustomEvent("duo-toast", {
        detail: { message, tone: "info", duration: 8_000 },
      }));
    }
  });
  await expect(notices.getByRole("status")).toHaveCount(3);
  await expect(notices.getByRole("status").filter({ hasText: "One" })).toHaveCount(0);
  await expect(notices.getByRole("status").filter({ hasText: "Four" })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`matching tiles handle selection, mistakes, and retry safely at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: width === 1440 ? "reduce" : "no-preference" });
    const matched: Record<string, string> = {};
    const solutions: Record<string, string> = { apple: "manzana", bread: "pan", milk: "leche" };
    const requests: { key: string; body: unknown }[] = [];
    let hearts = 5;
    let dropped = false;
    let lastReply: Record<string, unknown> = {};
    await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts, xp: 0, streak: 0 } }));
    await page.route("**/api/v1/attempts", route => route.fulfill({ json: {
      id: "matching", lesson_id: "demo", position: 0, status: "active", correct: 0, incorrect: 0,
      matched_pairs: matched, lesson: { xp_reward: 15, exercises: [{ id: "pairs", payload: {
        type: "match", prompt: "Match food words", left: Object.keys(solutions), right: ["leche", "manzana", "pan"],
      } }] },
    } }));
    await page.route("**/api/v1/attempts/matching/answers", async route => {
      const body = route.request().postDataJSON();
      const key = route.request().headers()["idempotency-key"];
      expect(body.match_pair).toBe(true);
      const retry = requests.some(request => request.key === key);
      requests.push({ key, body });
      if (retry) { await route.fulfill({ json: lastReply }); return; }
      const [left, right] = Object.entries(body.answer)[0];
      const correct = solutions[left] === right;
      if (correct) matched[left] = right as string; else hearts--;
      const complete = Object.keys(matched).length === 3;
      lastReply = { correct, expected: correct ? "Pair matched!" : "Those don’t match.",
        position: complete ? 1 : 0, completed: complete, exercise_complete: complete,
        hearts, out_of_hearts: false, matched_pairs: { ...matched }, xp_earned: complete ? 15 : 0 };
      if (correct && !dropped) { dropped = true; await route.abort("failed"); return; }
      await route.fulfill({ json: lastReply });
    });

    await page.goto("/lesson/demo");
    await expect(page.getByRole("heading", { name: "Tap the matching pairs" })).toBeVisible();
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
    const word = (name: string) => page.getByRole("button", { name, exact: true });
    await word("milk").click();
    await expect(word("milk")).toHaveAttribute("aria-pressed", "true");
    await word("milk").click();
    await expect(word("milk")).toHaveAttribute("aria-pressed", "false");
    await word("milk").click();
    await word("apple").click();
    await expect(word("milk")).toHaveAttribute("aria-pressed", "false");
    expect(requests).toHaveLength(0);
    await page.screenshot({ path: `test-results/matching-${width}.png`, fullPage: true });
    await word("leche").click();
    await expect(page.getByText("Those don’t match. Try again.")).toBeVisible();
    await expect(page.getByLabel("4 hearts")).toBeVisible();
    if (width === 1440) await expect(word("apple")).toHaveCSS("animation-name", "none");

    await expect(word("apple")).toBeEnabled();
    await word("apple").focus();
    await page.keyboard.press("Enter");
    await word("manzana").click();
    await expect(word("bread")).toBeDisabled();
    await expect(word("apple, matched")).toBeDisabled();
    expect(requests[1]).toEqual(requests[2]);
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
    await word("pan").click();
    await word("bread").click();
    await word("milk").click();
    await word("leche").click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
    await expect(page.getByTestId("xp-rollup")).toContainText("15 XP");
    expect(requests).toHaveLength(5);
  });
}
