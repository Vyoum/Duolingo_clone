"""SQLAlchemy models for the content hierarchy.

Course → Unit → Skill → Lesson → Exercise

Content is read-mostly after seeding. Progress and gamification live in
other services; this service only owns the curriculum graph.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExerciseTypeEnum(str, enum.Enum):
    """Mirrors duolingo_shared.ExerciseType — kept as a DB enum for integrity.

    We intentionally duplicate the string values rather than importing the
    shared StrEnum into the ORM layer, so Alembic migrations stay free of
    package-import side effects. Values must stay in sync with the shared package.
    """

    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"
    MATCH = "match"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    language_code: Mapped[str] = mapped_column(
        String(10), nullable=False, doc="ISO-ish code, e.g. 'es' for Spanish"
    )
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course",
        order_by="Unit.sort_order",
        cascade="all, delete-orphan",
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    course: Mapped["Course"] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit",
        order_by="Skill.sort_order",
        cascade="all, delete-orphan",
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("units.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    icon: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="star",
        doc="Icon key consumed by the frontend skill-tree (e.g. 'food', 'travel')",
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    unit: Mapped["Unit"] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill",
        order_by="Lesson.sort_order",
        cascade="all, delete-orphan",
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_reward: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, doc="Base XP granted on lesson completion"
    )

    skill: Mapped["Skill"] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson",
        order_by="Exercise.sort_order",
        cascade="all, delete-orphan",
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[ExerciseTypeEnum] = mapped_column(
        Enum(
            ExerciseTypeEnum,
            name="exercise_type",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # JSONB shape is validated at write-time via shared Pydantic payloads;
    # see duolingo_shared.exercises for per-type documentation.
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")
