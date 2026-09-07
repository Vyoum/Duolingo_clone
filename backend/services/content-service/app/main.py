"""Content Service — owns Course/Unit/Skill/Lesson/Exercise (read-mostly).

Other services call these HTTP endpoints for curriculum data. Lesson
completion and XP live elsewhere; this service never mutates learner state.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.routers import courses, lessons, skills


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.run_seed_on_startup:
        # Import lazily so alembic migrations don't pull seed deps at import time.
        from app.seed import seed

        await seed()
    yield


app = FastAPI(
    title="Content Service",
    description=(
        "Curriculum catalog for the Duolingo clone. Read-heavy: courses, units, "
        "skills, lessons, and typed exercises."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(courses.router, prefix=settings.api_prefix)
app.include_router(skills.router, prefix=settings.api_prefix)
app.include_router(lessons.router, prefix=settings.api_prefix)


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
