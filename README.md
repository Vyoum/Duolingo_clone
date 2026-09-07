# Duolingo Clone — Microservices

A Duolingo-style learning app split into FastAPI microservices with a Next.js frontend.

## Why microservices (and the tradeoff)

This assignment uses microservices specifically to demonstrate **service boundaries**, **async messaging**, and a **saga / eventual-consistency** pattern for lesson completion (Progress publishes → Gamification consumes). The cost is more moving parts to deploy and debug. The non-negotiable correctness property is **idempotent consumers** on `LessonCompleted` so at-least-once delivery never double-applies XP/streak.

## Messaging choice

**Redis Streams** (not Kafka): three consumers and low volume do not justify Kafka's ops cost. Streams still give consumer groups, persistence, and replay while we already need Redis for leaderboards and rate limiting.

## Current status

| Piece | Status |
|---|---|
| `services/shared` — event + exercise contracts | ✅ |
| `services/content-service` — models, Alembic, seed, read APIs | ✅ |
| progress-service | ⏳ next |
| gamification-service | ⏳ |
| api-gateway | ⏳ |
| frontend | ⏳ |
| docker-compose (all services) | ⏳ (comes with gateway/infra pass) |

## Content service (local)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e services/shared
pip install -r services/content-service/requirements.txt

# Postgres DB named content_db must exist
cd services/content-service
cp .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8001
```

- `GET /api/v1/courses`
- `GET /api/v1/courses/{id}`
- `GET /api/v1/skills/{id}/lessons`
- `GET /api/v1/lessons/{id}/exercises`
- `GET /health`
