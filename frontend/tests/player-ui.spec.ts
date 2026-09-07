import { test, expect } from "@playwright/test";

// Browser contract test with controlled HTTP responses. Persistence and grading
// are exercised separately by backend tests and learning.spec.ts's real stack test.
test.beforeEach(async ({ context }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string") throw new Error("Playwright baseURL is required");
  await context.addCookies([
    { name: "duo_demo_session", value: "1", url: baseURL },
  ]);
});

test("UI renders five exercise types, restores progress, feedback, and completion", async ({ page }) => {
  let position = 0;
  let mistakes = 0;
  const exercises = [
    { id: "one", payload: { type: "multiple_choice", prompt: "Choose hello", options: ["hola", "adiós"] } },
    { id: "two", payload: { type: "translate", prompt: "Translate good morning", tokens: ["Buenos", "días"] } },
    { id: "three", payload: { type: "match", prompt: "Match food words", left: ["apple", "milk"], right: ["leche", "manzana"] } },
    { id: "four", payload: { type: "fill_blank", prompt: "Complete the sentence", sentence: "Yo quiero ____.", options: ["agua", "rojo"] } },
    { id: "five", payload: { type: "type_answer", prompt: "Type goodbye" } },
  ];
  const submissions: unknown[] = [];
  await page.route("**/api/v1/me", route => route.fulfill({ json: { hearts: 5, xp: 0, streak: 0 } }));
  await page.route("**/api/v1/attempts", route => route.fulfill({ json: { id: "demo", lesson_id: "demo", position, correct: position, incorrect: mistakes, status: "active", lesson: { xp_reward: 20, exercises } } }));
  await page.route("**/api/v1/attempts/demo/answers", async route => {
    const body = route.request().postDataJSON();
    expect(route.request().headers()["idempotency-key"]).toBeTruthy();
    submissions.push(body.answer);
    const correct = submissions.length !== 1;
    if (correct) position++; else mistakes++;
    await route.fulfill({ json: { correct, expected: "hola", position, completed: position === 5, hearts: 5 - mistakes, out_of_hearts: false, xp_earned: position === 5 ? 20 : 0 } });
  });
  await page.goto("/lesson/demo");
  await page.getByRole("button", { name: /adiós/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("Let’s try that again")).toBeVisible();
  await expect(page.getByLabel("4 hearts")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /hola/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Translate good morning" })).toBeVisible();
  await page.getByRole("button", { name: "Buenos", exact: true }).click();
  await page.getByRole("button", { name: "días", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Spanish match for apple").selectOption("manzana");
  await page.getByLabel("Spanish match for milk").selectOption("leche");
  await page.screenshot({ path: "test-results/player-ui.png", fullPage: true });
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /agua/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox").fill("adiós");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  expect(submissions).toEqual([1, 0, ["Buenos", "días"], { apple: "manzana", milk: "leche" }, "agua", "adiós"]);
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
