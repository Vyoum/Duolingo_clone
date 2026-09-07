# Hosted deployment

Live demo for this submission:

| Role | URL |
| --- | --- |
| Frontend (open this) | https://duolingo-clone-vyoum.vercel.app |
| Gateway | https://gateway-b711.onrender.com |
| Gateway `/health` | https://gateway-b711.onrender.com/health |
| Content `/health` | https://content-3q6p.onrender.com/health |
| Progress `/health` | https://progress-bhef.onrender.com/health |
| Gamification `/health` | https://gamification-b7nt.onrender.com/health |

Click **LOG IN** on the Vercel app (demo cookie, no real auth). Bare Render service roots return FastAPI `{"detail":"Not Found"}`; use `/health` to verify a service is up.

## What persists where

| Data | Store | Local Compose | Render Free (this demo) |
| --- | --- | --- | --- |
| Curriculum | PostgreSQL (Content) | Durable volume | Durable (Free Postgres, 30-day clock) |
| Attempts, completions | SQLite (Progress) | Durable named volume | Ephemeral disk — can reset on redeploy/restart |
| XP, streak, hearts | SQLite (Gamification) | Durable named volume | Ephemeral disk — can reset on redeploy/restart |
| Rate limit / stream / board | Redis | AOF volume | Free Key Value is memory-oriented; restarts may clear cache |

**Planned (scoped out):** move Progress and Gamification to managed Postgres (Neon preferred, because Render allows only one Free Postgres and Content already uses it). That requires code changes beyond `DATABASE_URL` — see README [Planned migration](README.md#planned-migration-scoped-out-of-this-submission).

## Render backend (this submission)

Services were created as Free **web services** (not the paid Blueprint). Public health endpoints are linked above for evaluation. The browser still talks only to Vercel → gateway.

During the evaluation window, periodic `/health` pings (~every 13 minutes) keep services from sleeping. That reduces cold starts; it does not protect SQLite from a redeploy wipe.

Optional paid path: import [`render.yaml`](render.yaml) for private services + persistent disks. Review cost before applying.

## Vercel frontend

1. Root Directory: `frontend`.
2. Server-only env (then **Redeploy**):

```dotenv
GATEWAY_URL=https://gateway-b711.onrender.com
WARMUP_ENABLED=true
CONTENT_HEALTH_URL=https://content-3q6p.onrender.com/health
PROGRESS_HEALTH_URL=https://progress-bhef.onrender.com/health
GAMIFICATION_HEALTH_URL=https://gamification-b7nt.onrender.com/health
```

3. Open the hosted path, complete a lesson, reload, and check crown / Profile XP / Leaderboard.

If services were idle, expect ~30–60 seconds or the **Getting your lessons ready…** screen. Refresh or Retry once.

## Release smoke checks

- New learner: only the first lesson is available; crafted requests for later lessons fail.
- Wrong answer: one heart lost; retrying the same network request loses no additional heart.
- Correct completion: progress saved, next lesson unlocked, XP/streak eventually updated.
- Refresh while services stay up: attempts, completed nodes, hearts, and rewards remain.
- After a Free Progress/Gamification redeploy: learner SQLite may reset until the Neon/Postgres migration lands.
- Zero hearts: answer submission blocked, break dialog shown, timestamp-based regeneration restores access.
- All five exercise types render and grade correctly across the first three lessons.

This remains a shared-user assignment demo. Production authentication and horizontal scaling are not part of this deployment.
