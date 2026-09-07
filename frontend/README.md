# Frontend

Next.js App Router, React, TypeScript, and Tailwind, using the existing dark Duolingo palette. Production builds use the supported Webpack bundler to avoid a Turbopack worker permission failure in the development environment.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Start the backend first with `docker compose up --build -d gateway` from the repository root. Open http://localhost:3000. `GATEWAY_URL` is server-only and defaults to http://localhost:8000.

- `/`: live zigzag path, crowns, rings, sequential locks.
- `/lesson/[lessonId]`: five exercise types, server feedback, progress, hearts, completion and break dialogs.
- `/profile`: live learner stats and achievements, existing decorative profile/social fixtures.
- `/quests`: live UTC daily goals and achievements.
- `/leaderboard`: real XP ranking with labeled seeded competitors.
- `/practice`, `/shop`: existing optional audio/Super placeholders; Practice links to working lessons.

```bash
npm run lint
npm run build
```

Browser tests require a running stack and Playwright Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

For UI-only checks with controlled HTTP responses, run `npx playwright test tests/player-ui.spec.ts` against a running frontend. These three browser tests passed in this workspace using installed Chrome; the real-stack test has not yet been run.

Set `PLAYWRIGHT_BASE_URL` for another frontend URL. Tests complete lessons using the real backend and leave the shared demo learner progressed. They do not delete its data. Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Google Chrome instead of Playwright's browser.

For Vercel, set project Root Directory to `frontend`, set `GATEWAY_URL` to the hosted gateway, and deploy using the checked-in `vercel.json`. Hosting has not yet been performed.
