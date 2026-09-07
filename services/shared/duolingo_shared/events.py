"""Cross-service event contracts published to Redis Streams.

Version these carefully: progress-service (producer) and gamification-service
(consumer) both import from this package so payload shape cannot silently drift.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# Redis Stream name + consumer group constants — single source of truth so
# producer and consumer never disagree on stream/group names.
LESSON_COMPLETED_STREAM = "events:lesson_completed"
GAMIFICATION_CONSUMER_GROUP = "gamification-service"


class LessonCompletedEvent(BaseModel):
    """Published by progress-service after a lesson attempt is marked complete.

    Gamification-service consumes this asynchronously to apply XP, streak,
    achievements, and leaderboard updates. `event_id` is the idempotency key
    stored in gamification.events_processed — at-least-once delivery must not
    double-apply effects.
    """

    event_id: UUID = Field(
        description="Unique id for this event; used as idempotency key by consumers"
    )
    user_id: UUID
    lesson_id: UUID
    lesson_attempt_id: UUID
    exercises_correct: int = Field(ge=0)
    exercises_incorrect: int = Field(ge=0)
    hearts_lost: int = Field(ge=0, description="Hearts lost during this attempt")
    xp_earned: int = Field(
        ge=0,
        description="XP awarded for this lesson (from content.lessons.xp_reward, "
        "possibly adjusted for performance — progress-service decides the value)",
    )
    completed_at: datetime = Field(
        description="UTC timestamp of completion; consumers convert to user-local date for streaks"
    )
