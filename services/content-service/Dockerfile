# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Shared contracts package first (local path install).
COPY services/shared /app/services/shared
RUN pip install --no-cache-dir /app/services/shared

COPY services/content-service/requirements.txt /app/requirements.txt
# Strip the editable shared line — already installed above.
RUN grep -v "duolingo-shared" /app/requirements.txt > /tmp/reqs.txt \
    && pip install --no-cache-dir -r /tmp/reqs.txt

COPY services/content-service /app/services/content-service
WORKDIR /app/services/content-service

ENV PYTHONPATH=/app/services/content-service
EXPOSE 8001

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8001"]
