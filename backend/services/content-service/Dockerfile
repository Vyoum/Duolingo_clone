# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Shared contracts package first (local path install).
# Build context must be the repo root:
#   docker build -f backend/services/content-service/Dockerfile .
COPY backend/services/shared /app/services/shared
RUN pip install --no-cache-dir /app/services/shared

COPY backend/services/content-service/requirements.txt /app/requirements.txt
RUN grep -v "duolingo-shared" /app/requirements.txt > /tmp/reqs.txt \
    && pip install --no-cache-dir -r /tmp/reqs.txt

COPY backend/services/content-service /app/services/content-service
WORKDIR /app/services/content-service

ENV PYTHONPATH=/app/services/content-service
EXPOSE 8001

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8001"]
