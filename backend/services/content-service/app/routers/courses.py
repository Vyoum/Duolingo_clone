"""Course list and detail endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Course, Unit
from app.schemas import CourseDetailOut, CourseListOut, CourseOut, SkillOut, UnitOut

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get(
    "",
    response_model=CourseListOut,
    summary="List all courses",
    description="Returns every course in the catalog (typically one for the demo).",
)
async def list_courses(db: AsyncSession = Depends(get_db)) -> CourseListOut:
    result = await db.execute(select(Course).order_by(Course.name))
    courses = list(result.scalars().all())
    total_result = await db.execute(select(func.count()).select_from(Course))
    total = total_result.scalar_one()
    return CourseListOut(items=[CourseOut.model_validate(c) for c in courses], total=total)


@router.get(
    "/{course_id}",
    response_model=CourseDetailOut,
    summary="Get course with units and skills",
    description="Full curriculum tree used to render the skill-path home screen.",
    responses={404: {"description": "Course not found"}},
)
async def get_course(
    course_id: UUID, db: AsyncSession = Depends(get_db)
) -> CourseDetailOut:
    # Eager-load units → skills so we avoid N+1 queries for the tree view.
    stmt = (
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.units).selectinload(Unit.skills))
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    units = [
        UnitOut(
            id=unit.id,
            course_id=unit.course_id,
            title=unit.title,
            sort_order=unit.sort_order,
            skills=[
                SkillOut.model_validate(skill)
                for skill in sorted(unit.skills, key=lambda s: s.sort_order)
            ],
        )
        for unit in sorted(course.units, key=lambda u: u.sort_order)
    ]
    return CourseDetailOut(
        id=course.id,
        name=course.name,
        language_code=course.language_code,
        description=course.description,
        created_at=course.created_at,
        units=units,
    )
