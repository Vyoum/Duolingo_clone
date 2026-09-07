# Hosted deployment

Deployment files are prepared, but no hosted instance has been published or verified. This workspace has no Vercel login or selected backend hosting project. Do not substitute a local URL for an assignment's hosted URL.

## Render backend

`render.yaml` provisions PostgreSQL, Redis-compatible Key Value, three private services, and a public gateway. Progress and Gamification each have a 1 GB persistent disk. The Blueprint uses paid service plans; review the account's cost estimate before applying it.

1. Push the reviewed project to your Git repository.
2. In your Render account, create a Blueprint from that repository's `render.yaml`.
3. Confirm that all resources use the same region and finish deploying. Content runs Alembic migrations and seeds on startup.
4. Confirm the gateway's HTTPS `/health` and `/api/v1/path` return successful responses. Record its actual public URL.

Internal service `hostport` references are normalized to HTTP URLs by the shared runtime. PostgreSQL connection strings are normalized to SQLAlchemy's asyncpg URL by the content settings. Services with SQLite disks run as a single instance. Internal heart endpoints and answer-bearing content are not public routes.

The configuration follows Render's [Blueprint reference](https://render.com/docs/blueprint-spec), including private service references and disks. No cloud resources have been created by adding this file.

## Vercel frontend

1. Import the repository into the intended Vercel project; set **Root Directory** to `frontend`.
2. Set server-side `GATEWAY_URL` to the deployed HTTPS gateway origin (no `/api/v1` suffix) for the required environments.
3. Deploy. `frontend/vercel.json` uses the Next.js preset, `npm ci`, and `npm run build`.
4. Open the hosted path, complete a lesson, reload, and verify its crown and unlock. Check XP on Profile and Leaderboard after reward delivery.

The browser uses same-origin `/api/v1` calls. Only the Next.js server talks to the backend, so there is no browser-exposed backend environment variable. See Vercel's [deployment guide](https://vercel.com/docs/projects/deploy-from-cli) and [environment variable documentation](https://vercel.com/docs/environment-variables).

## Release smoke checks

- New learner: only the first lesson is available; crafted requests for later lessons fail.
- Wrong answer: one heart lost; retrying the same network request loses no additional heart.
- Correct completion: progress saved, next lesson unlocked, XP/streak eventually updated.
- Refresh/restart: attempts, completed nodes, hearts, and rewards remain.
- Zero hearts: answer submission blocked, break dialog shown, timestamp-based regeneration restores access.
- All five exercise types render and grade correctly across the first three lessons.

This remains a shared-user assignment demo. Production authentication and horizontal scaling are not part of this deployment.
