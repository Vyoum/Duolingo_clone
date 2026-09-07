"""Pydantic response schemas for content-service read APIs.

Request bodies are minimal here — content is seeded, not created via API
in this assignment. Nested response shapes mirror the curriculum hierarchy
so the frontend can render a skill tree with one course fetch.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from duolingo_shared.exercises import ExerciseType


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lesson_id: UUID
    type: ExerciseType
    sort_order: int
    payload: dict = Field(
        description="Type-specific JSON; see duolingo_shared.exercises for shapes"
    )


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    skill_id: UUID
    sort_order: int
    xp_reward: int


class LessonDetailOut(LessonOut):
    """Lesson plus ordered exercises — used by the lesson player."""

    exercises: list[ExerciseOut] = []


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    unit_id: UUID
    title: str
    icon: str
    sort_order: int


class SkillDetailOut(SkillOut):
    """Skill plus ordered lessons (without nested exercises)."""

    lessons: list[LessonOut] = []


class UnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    sort_order: int
    skills: list[SkillOut] = []


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    language_code: str
    description: str
    created_at: datetime


class CourseDetailOut(CourseOut):
    """Full curriculum tree for one course (units → skills, no exercises)."""

    units: list[UnitOut] = []


class CourseListOut(BaseModel):
    items: list[CourseOut]
    total: int
