"""Seed demo curriculum: one Spanish course with all five exercise types.

Idempotent: if any course already exists, this is a no-op so restarts do not
duplicate content. Invoke via `python -m app.seed` or the startup flag
RUN_SEED_ON_STARTUP=true.
"""

import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Course, Exercise, ExerciseTypeEnum, Lesson, Skill, Unit
from duolingo_shared.exercises import (
    FillBlankPayload,
    MatchPair,
    MatchPayload,
    MultipleChoicePayload,
    TranslatePayload,
    TypeAnswerPayload,
)


# Stable UUIDs so progress/gamification seeds (and demos) can hard-reference
# specific lessons without a lookup dance.
COURSE_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
UNIT_1_ID = uuid.UUID("22222222-2222-2222-2222-222222222201")
UNIT_2_ID = uuid.UUID("22222222-2222-2222-2222-222222222202")
SKILL_GREETINGS = uuid.UUID("33333333-3333-3333-3333-333333333301")
SKILL_FOOD = uuid.UUID("33333333-3333-3333-3333-333333333302")
SKILL_TRAVEL = uuid.UUID("33333333-3333-3333-3333-333333333303")
SKILL_FAMILY = uuid.UUID("33333333-3333-3333-3333-333333333304")
SKILL_NUMBERS = uuid.UUID("33333333-3333-3333-3333-333333333305")
LESSON_GREET_1 = uuid.UUID("44444444-4444-4444-4444-444444444401")
LESSON_GREET_2 = uuid.UUID("44444444-4444-4444-4444-444444444402")
LESSON_FOOD_1 = uuid.UUID("44444444-4444-4444-4444-444444444403")
LESSON_TRAVEL_1 = uuid.UUID("44444444-4444-4444-4444-444444444404")
LESSON_FAMILY_1 = uuid.UUID("44444444-4444-4444-4444-444444444405")
LESSON_NUMBERS_1 = uuid.UUID("44444444-4444-4444-4444-444444444406")


def _exercise(
    lesson_id: uuid.UUID,
    sort_order: int,
    payload_model,
) -> Exercise:
    """Build an Exercise ORM row from a validated shared payload model.

    Payload keeps the `type` discriminant so the JSON alone is a valid
    ExercisePayload — frontend can parse it as a discriminated union without
    stitching fields back together.
    """
    data = payload_model.model_dump(mode="json")
    exercise_type = ExerciseTypeEnum(data["type"])
    return Exercise(
        id=uuid.uuid4(),
        lesson_id=lesson_id,
        type=exercise_type,
        sort_order=sort_order,
        payload=data,
    )


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(Course).limit(1))
        if existing.scalar_one_or_none() is not None:
            print("Seed skipped: courses already present")
            return

        course = Course(
            id=COURSE_ID,
            name="Spanish",
            language_code="es",
            description="Learn Spanish from scratch — greetings through everyday travel.",
        )
        session.add(course)

        unit1 = Unit(id=UNIT_1_ID, course_id=COURSE_ID, title="Basics", sort_order=1)
        unit2 = Unit(id=UNIT_2_ID, course_id=COURSE_ID, title="Daily Life", sort_order=2)
        session.add_all([unit1, unit2])

        skills = [
            Skill(
                id=SKILL_GREETINGS,
                unit_id=UNIT_1_ID,
                title="Greetings",
                icon="wave",
                sort_order=1,
            ),
            Skill(
                id=SKILL_FOOD,
                unit_id=UNIT_1_ID,
                title="Food",
                icon="apple",
                sort_order=2,
            ),
            Skill(
                id=SKILL_TRAVEL,
                unit_id=UNIT_1_ID,
                title="Travel",
                icon="plane",
                sort_order=3,
            ),
            Skill(
                id=SKILL_FAMILY,
                unit_id=UNIT_2_ID,
                title="Family",
                icon="people",
                sort_order=1,
            ),
            Skill(
                id=SKILL_NUMBERS,
                unit_id=UNIT_2_ID,
                title="Numbers",
                icon="hash",
                sort_order=2,
            ),
        ]
        session.add_all(skills)

        lessons = [
            Lesson(id=LESSON_GREET_1, skill_id=SKILL_GREETINGS, sort_order=1, xp_reward=10),
            Lesson(id=LESSON_GREET_2, skill_id=SKILL_GREETINGS, sort_order=2, xp_reward=10),
            Lesson(id=LESSON_FOOD_1, skill_id=SKILL_FOOD, sort_order=1, xp_reward=15),
            Lesson(id=LESSON_TRAVEL_1, skill_id=SKILL_TRAVEL, sort_order=1, xp_reward=15),
            Lesson(id=LESSON_FAMILY_1, skill_id=SKILL_FAMILY, sort_order=1, xp_reward=10),
            Lesson(id=LESSON_NUMBERS_1, skill_id=SKILL_NUMBERS, sort_order=1, xp_reward=10),
        ]
        session.add_all(lessons)

        # At least one exercise of each of the five types across the curriculum.
        exercises = [
            # Lesson 1 — multiple choice + type answer
            _exercise(
                LESSON_GREET_1,
                1,
                MultipleChoicePayload(
                    prompt="How do you say 'hello' in Spanish?",
                    options=["hola", "adiós", "gracias", "por favor"],
                    correct_index=0,
                ),
            ),
            _exercise(
                LESSON_GREET_1,
                2,
                TypeAnswerPayload(
                    prompt="Type the Spanish word for 'goodbye'.",
                    accepted_answers=["adiós", "adios"],
                ),
            ),
            # Lesson 2 — translate
            _exercise(
                LESSON_GREET_2,
                1,
                TranslatePayload(
                    prompt="Translate to Spanish: 'Good morning'",
                    source_tokens=["Good", "morning"],
                    correct_tokens=["Buenos", "días"],
                ),
            ),
            _exercise(
                LESSON_GREET_2,
                2,
                MultipleChoicePayload(
                    prompt="What does 'gracias' mean?",
                    options=["please", "thank you", "sorry", "excuse me"],
                    correct_index=1,
                ),
            ),
            # Food — fill blank + match
            _exercise(
                LESSON_FOOD_1,
                1,
                FillBlankPayload(
                    prompt="Complete the sentence",
                    sentence="Yo quiero ____.",
                    options=["agua", "correr", "rápido"],
                    correct_answer="agua",
                ),
            ),
            _exercise(
                LESSON_FOOD_1,
                2,
                MatchPayload(
                    prompt="Match the Spanish food words",
                    pairs=[
                        MatchPair(left="apple", right="manzana"),
                        MatchPair(left="bread", right="pan"),
                        MatchPair(left="milk", right="leche"),
                    ],
                ),
            ),
            # Travel — multiple choice
            _exercise(
                LESSON_TRAVEL_1,
                1,
                MultipleChoicePayload(
                    prompt="How do you ask 'Where is the station?'",
                    options=[
                        "¿Dónde está la estación?",
                        "¿Cuánto cuesta?",
                        "¿Cómo te llamas?",
                    ],
                    correct_index=0,
                ),
            ),
            # Family — type answer
            _exercise(
                LESSON_FAMILY_1,
                1,
                TypeAnswerPayload(
                    prompt="Type the Spanish word for 'mother'.",
                    accepted_answers=["madre"],
                ),
            ),
            # Numbers — fill blank
            _exercise(
                LESSON_NUMBERS_1,
                1,
                FillBlankPayload(
                    prompt="Fill in the number word",
                    sentence="Tengo ____ manzanas.",
                    options=["dos", "rojo", "grande"],
                    correct_answer="dos",
                ),
            ),
        ]
        session.add_all(exercises)
        await session.commit()
        print(
            f"Seeded course {COURSE_ID}: "
            f"{len(skills)} skills, {len(lessons)} lessons, {len(exercises)} exercises"
        )


async def main() -> None:
    await seed()


if __name__ == "__main__":
    asyncio.run(main())
