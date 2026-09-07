"""Skill detail endpoints — lessons under a skill."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Skill
from app.schemas import LessonOut, SkillDetailOut

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get(
    "/{skill_id}/lessons",
    response_model=SkillDetailOut,
    summary="Get skill with its lessons",
    description="Returns ordered lessons for a skill (exercises loaded separately).",
    responses={404: {"description": "Skill not found"}},
)
async def get_skill_lessons(
    skill_id: UUID, db: AsyncSession = Depends(get_db)
) -> SkillDetailOut:
    stmt = (
        select(Skill)
        .where(Skill.id == skill_id)
        .options(selectinload(Skill.lessons))
    )
    result = await db.execute(stmt)
    skill = result.scalar_one_or_none()
    if skill is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found"
        )

    lessons = [
        LessonOut.model_validate(lesson)
        for lesson in sorted(skill.lessons, key=lambda L: L.sort_order)
    ]
    return SkillDetailOut(
        id=skill.id,
        unit_id=skill.unit_id,
        title=skill.title,
        icon=skill.icon,
        sort_order=skill.sort_order,
        lessons=lessons,
    )
