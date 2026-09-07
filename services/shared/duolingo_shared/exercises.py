"""Exercise type enum and typed payload shapes stored in content.exercises.payload.

Each exercise type has a different JSON shape. Documenting them here (and
validating with Pydantic) means the content seed, progress answer-checker,
and frontend component registry all agree on the contract.
"""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class ExerciseType(StrEnum):
    """Discriminant for exercise payload shapes and frontend renderers."""

    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"
    MATCH = "match"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class MultipleChoicePayload(BaseModel):
    """Pick one correct option from a fixed list.

    Example:
        {"prompt": "What is 'cat' in Spanish?", "options": ["gato", "perro", "casa"],
         "correct_index": 0}
    """

    type: Literal[ExerciseType.MULTIPLE_CHOICE] = ExerciseType.MULTIPLE_CHOICE
    prompt: str
    options: list[str] = Field(min_length=2)
    correct_index: int = Field(ge=0, description="0-based index into options")


class TranslatePayload(BaseModel):
    """Reorder / select tokens to form the correct translation.

    `source_tokens` are shown to the learner; `correct_tokens` is the ordered
    answer. Using tokens (not free text) keeps grading deterministic.
    """

    type: Literal[ExerciseType.TRANSLATE] = ExerciseType.TRANSLATE
    prompt: str
    source_tokens: list[str] = Field(min_length=1)
    correct_tokens: list[str] = Field(min_length=1)


class MatchPair(BaseModel):
    left: str
    right: str


class MatchPayload(BaseModel):
    """Match left-column items to right-column items (order of pairs is the key)."""

    type: Literal[ExerciseType.MATCH] = ExerciseType.MATCH
    prompt: str
    pairs: list[MatchPair] = Field(min_length=2)


class FillBlankPayload(BaseModel):
    """Sentence with a blank; learner picks or types the missing word.

    `sentence` uses `____` as the blank placeholder.
    """

    type: Literal[ExerciseType.FILL_BLANK] = ExerciseType.FILL_BLANK
    prompt: str
    sentence: str = Field(description="Sentence containing ____ as the blank")
    options: list[str] | None = Field(
        default=None,
        description="If set, render as multiple-choice; otherwise free-text",
    )
    correct_answer: str


class TypeAnswerPayload(BaseModel):
    """Free-text answer; compared case-insensitively after strip.

    `accepted_answers` allows minor variants (e.g. "el gato" / "gato").
    """

    type: Literal[ExerciseType.TYPE_ANSWER] = ExerciseType.TYPE_ANSWER
    prompt: str
    accepted_answers: list[str] = Field(min_length=1)


# Discriminated union — FastAPI/Pydantic can validate any of the five shapes
# keyed off the `type` field.
ExercisePayload = Annotated[
    MultipleChoicePayload
    | TranslatePayload
    | MatchPayload
    | FillBlankPayload
    | TypeAnswerPayload,
    Field(discriminator="type"),
]
