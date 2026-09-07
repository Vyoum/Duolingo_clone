"""Lesson detail endpoints — exercises for the lesson player."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Lesson
from app.schemas import ExerciseOut, LessonDetailOut

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get(
    "/{lesson_id}/exercises",
    response_model=LessonDetailOut,
    summary="Get lesson with ordered exercises",
    description=(
        "Payload shapes vary by exercise type. See duolingo_shared.exercises "
        "for the documented JSON contracts used by the frontend component registry."
    ),
    responses={404: {"description": "Lesson not found"}},
)
async def get_lesson_exercises(
    lesson_id: UUID, db: AsyncSession = Depends(get_db)
) -> LessonDetailOut:
    stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.exercises))
    )
    result = await db.execute(stmt)
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    exercises = [
        ExerciseOut(
            id=ex.id,
            lesson_id=ex.lesson_id,
            type=ex.type.value,  # type: ignore[arg-type]
            sort_order=ex.sort_order,
            payload=ex.payload,
        )
        for ex in sorted(lesson.exercises, key=lambda e: e.sort_order)
    ]
    return LessonDetailOut(
        id=lesson.id,
        skill_id=lesson.skill_id,
        sort_order=lesson.sort_order,
        xp_reward=lesson.xp_reward,
        exercises=exercises,
    )


@router.get(
    "/{lesson_id}",
    response_model=LessonDetailOut,
    summary="Get a single lesson (with exercises)",
    responses={404: {"description": "Lesson not found"}},
)
async def get_lesson(
    lesson_id: UUID, db: AsyncSession = Depends(get_db)
) -> LessonDetailOut:
    # Same payload as /exercises — convenience alias for gateway routing.
    return await get_lesson_exercises(lesson_id, db)
