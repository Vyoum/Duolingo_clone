import { test, expect } from "@playwright/test";

// Runs against the real stack; never resets or deletes learner data.
test("complete all five exercise types, resume, unlock, and persist rewards", async ({ page, request }) => {
  const beforeResponse = await request.get("/api/v1/me");
  expect(beforeResponse.ok(), "Start the backend and frontend before running this test").toBeTruthy();
  const before = await beforeResponse.json();
  test.skip(before.hearts === 0, "Demo learner is out of hearts; wait for regeneration.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Basics", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/learning-path.png", fullPage: true });
  await page.getByRole("link", { name: /Greetings, lesson 1/ }).click();
  await expect(page.getByRole("heading", { name: "How do you say 'hello' in Spanish?" })).toBeVisible();
  await page.getByRole("button", { name: /hola/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("✓ Nicely done!")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Type the Spanish word for 'goodbye'." })).toBeVisible();
  await page.getByRole("textbox").fill("adiós");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await page.getByRole("link", { name: "Back to the path" }).click();
  await expect(page.getByRole("link", { name: /Greetings, lesson 1, completed/ })).toBeVisible();

  await page.getByRole("link", { name: /Greetings, lesson 2/ }).click();
  await page.getByRole("button", { name: "Buenos", exact: true }).click();
  await page.getByRole("button", { name: "días", exact: true }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /thank you/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("link", { name: "Back to the path" }).click();

  await page.getByRole("link", { name: /Food, lesson 1/ }).click();
  await page.getByRole("button", { name: /agua/ }).click();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "apple", exact: true }).click();
  await page.getByRole("button", { name: "manzana", exact: true }).click();
  await page.getByRole("button", { name: "bread", exact: true }).click();
  await page.getByRole("button", { name: "pan", exact: true }).click();
  await page.getByRole("button", { name: "milk", exact: true }).click();
  await page.getByRole("button", { name: "leche", exact: true }).click();
  await page.screenshot({ path: "test-results/matching-exercise.png", fullPage: true });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await page.getByRole("link", { name: "Back to the path" }).click();
  await expect.poll(async () => (await (await request.get("/api/v1/me")).json()).xp, { timeout: 20000, intervals: [1000, 2000] }).toBeGreaterThan(before.xp);
  await page.reload();
  await expect(page.getByRole("link", { name: /Travel, lesson 1/ })).toBeVisible();
  await page.goto("/leaderboard");
  await expect(page.getByText("Vyoum (you)")).toBeVisible();
  await page.goto("/quests");
  await expect(page.getByText("Earn 10 XP today")).toBeVisible();
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Vyoum's progress" })).toBeVisible();
});

test("path reports service failure with a retry action", async ({ page }) => {
  await page.route("**/api/v1/path", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Learning service unavailable. Please retry." }) }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Learning service unavailable");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
