# Content Service — local development notes
#
# From repo root:
#   python -m venv .venv && source .venv/bin/activate
#   pip install -e services/shared
#   pip install -r services/content-service/requirements.txt
#   createdb content_db   # or use docker-compose Postgres later
#   cd services/content-service && alembic upgrade head && python -m app.seed
#   uvicorn app.main:app --reload --port 8001
#
# Endpoints (prefix /api/v1):
#   GET /api/v1/courses
#   GET /api/v1/courses/{id}
#   GET /api/v1/skills/{id}/lessons
#   GET /api/v1/lessons/{id}/exercises
#   GET /health
