FROM python:3.12-slim
WORKDIR /app
COPY backend/services/shared /app/shared
COPY backend/services/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir /app/shared -r /app/requirements.txt
COPY backend/services/progress-service/app /app/app
ENV DB_PATH=/data/service.db
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
