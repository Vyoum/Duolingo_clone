"""Shared contracts used by multiple services.

Keeping event and exercise payload shapes in one package prevents
producer/consumer drift — both progress-service and gamification-service
import the same LessonCompletedEvent definition.
"""

from duolingo_shared.events import (
    GAMIFICATION_CONSUMER_GROUP,
    LESSON_COMPLETED_STREAM,
    LessonCompletedEvent,
)
from duolingo_shared.exercises import (
    ExercisePayload,
    ExerciseType,
    FillBlankPayload,
    MatchPair,
    MatchPayload,
    MultipleChoicePayload,
    TranslatePayload,
    TypeAnswerPayload,
)

__all__ = [
    "LessonCompletedEvent",
    "LESSON_COMPLETED_STREAM",
    "GAMIFICATION_CONSUMER_GROUP",
    "ExerciseType",
    "ExercisePayload",
    "MultipleChoicePayload",
    "TranslatePayload",
    "MatchPayload",
    "MatchPair",
    "FillBlankPayload",
    "TypeAnswerPayload",
]
