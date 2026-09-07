# Backend

The recommended local setup is `docker compose up --build -d gateway` from the repository root. This starts PostgreSQL, Redis, Content, Progress, Gamification, and Gateway. Only Gateway publishes a host port (8000).

| Service | Source | Store | Default host-development port |
| --- | --- | --- | --- |
| Content | `services/content-service` | PostgreSQL + Alembic | 8001 |
| Progress | `services/progress-service` | SQLite WAL + outbox | 8002 |
| Gamification | `services/gamification-service` | SQLite WAL + Redis | 8003 |
| Gateway | `services/gateway` | Redis rate counters | 8000 |

For running services outside Docker, install shared contracts and dependencies from the repository root:

```bash
.venv/bin/pip install -e backend/services/shared
.venv/bin/pip install -r backend/services/requirements.txt
.venv/bin/pip install -r backend/services/content-service/requirements.txt
```

Content requires `DATABASE_URL`, `alembic upgrade head`, and `python -m app.seed` from its service directory. See its [README](services/content-service/README.md).

Run each remaining service from its own directory with `uvicorn app.main:app --port PORT`. Progress defaults to `CONTENT_URL=http://localhost:8001`, `GAME_URL=http://localhost:8003`, and `DB_PATH=data/progress.db`. Gamification defaults to `DB_PATH=data/gamification.db`. Gateway uses those same service URLs plus `PROGRESS_URL=http://localhost:8002`. All use `REDIS_URL=redis://localhost:6379/0`. PostgreSQL and Redis must already be running and reachable.

Progress/gamification initialize schema v1 on startup and run their event worker in the same process. Use one Uvicorn worker per service. Heart writes are private HTTP calls from Progress to Gamification.

See the root [README](../README.md) for API contracts, schemas, failure recovery, and test instructions.
