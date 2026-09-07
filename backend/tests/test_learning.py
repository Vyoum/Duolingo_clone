import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from duolingo_shared import LessonCompletedEvent, LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP
from duolingo_shared.runtime import transaction
from conftest import ANSWERS, LESSON, SECOND, USER, PAYLOADS, answer, game, headers, progress, start


def complete(stack):
    pc, _, _, exercises = stack
    attempt = start(pc).json()
    for i, ex in enumerate(exercises):
        response = answer(pc, attempt['id'], ex['id'], ANSWERS[i], f'answer-{i}')
        assert response.status_code == 200, response.text
    return attempt, response.json()


def test_all_types_completion_unlock_event_and_rewards(stack):
    pc, gc, redis, _ = stack
    assert start(pc, 'locked', SECOND).status_code == 403
    attempt, result = complete(stack)
    assert result['completed'] and result['xp_earned'] == 20
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 0
    progress.publish_once(redis)
    events = redis.xrange(LESSON_COMPLETED_STREAM)
    assert len(events) == 1
    event = LessonCompletedEvent.model_validate_json(events[0][1]['event'])
    for _ in range(3):
        game.apply_event(event)
    # Different event UUID with the same attempt must also deduplicate.
    game.apply_event(event.model_copy(update={'event_id': uuid4()}))
    stats = gc.get('/api/v1/me', headers=headers()).json()
    assert (stats['xp'], stats['streak'], stats['lessons_completed']) == (20, 1, 1)
    assert stats['quests'][0]['current'] == 10
    assert stats['achievements'][0]['current'] == 1
    path = pc.get('/api/v1/path', headers=headers()).json()
    assert path['units'][0]['skills'][0]['crowns'] == 1
    assert path['units'][0]['skills'][0]['lessons'][1]['unlocked']
    board = gc.get('/api/v1/leaderboard', headers=headers()).json()
    assert next(r for r in board['items'] if r['is_you'])['xp'] == 20
    assert sum(r['seeded'] for r in board['items']) == 5
    # Reinitializing schema does not erase persisted learner state.
    progress.initialize(); game.initialize()
    assert pc.get(f'/api/v1/attempts/{attempt["id"]}', headers=headers()).json()['status'] == 'completed'
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 20


def test_start_resume_and_no_answer_leak(stack):
    pc, _, _, exercises = stack
    first = start(pc).json()
    assert start(pc).json()['id'] == first['id']
    assert start(pc, 'another-key').json()['id'] == first['id']
    assert start(pc, 'start', SECOND).status_code == 409
    assert start(pc, 'another-key', SECOND).status_code == 409
    serialized = json.dumps(first)
    for field in ('correct_index', 'correct_tokens', 'accepted_answers', 'correct_answer', '"pairs"'):
        assert field not in serialized
    answer(pc, first['id'], exercises[0]['id'], 0, 'one')
    assert start(pc).json()['position'] == 1
    assert pc.get(f'/api/v1/attempts/{first["id"]}', headers=headers(user=str(uuid4()))).status_code == 404
    assert answer(pc, first['id'], exercises[3]['id'], 'agua', 'skip').status_code == 409


def test_concurrent_answer_retries_lose_one_heart(stack):
    pc, gc, _, exercises = stack
    aid = start(pc).json()['id']
    def submit(_):
        return answer(pc, aid, exercises[0]['id'], 1, 'same')
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(submit, range(4)))
    assert all(r.status_code == 200 for r in results)
    assert all(r.json()['hearts'] == 4 for r in results)
    assert gc.get('/api/v1/me', headers=headers()).json()['hearts'] == 4
    assert answer(pc, aid, exercises[0]['id'], 0, 'same').status_code == 409


def test_out_of_hearts_and_regeneration(stack):
    pc, gc, _, exercises = stack
    aid = start(pc).json()['id']
    for i in range(5):
        result = answer(pc, aid, exercises[0]['id'], 1, str(i)).json()
    assert result['out_of_hearts'] and result['hearts'] == 0
    assert answer(pc, aid, exercises[0]['id'], 0, 'correct').status_code == 403
    with transaction(game.DB) as db:
        row = db.execute('SELECT * FROM users WHERE id=?', (USER,)).fetchone()
        anchor = row['heart_at']
        assert game.user_row(db, USER, anchor + 1799)['hearts'] == 0
        assert game.user_row(db, USER, anchor + 1800)['hearts'] == 1
        assert game.user_row(db, USER, anchor + 18000)['hearts'] == 5


def test_heart_commit_then_network_failure_retries_safely(stack, monkeypatch):
    pc, gc, _, exercises = stack
    aid = start(pc).json()['id']
    original = progress.request
    def ambiguous(base, path, **kwargs):
        result = original(base, path, **kwargs)
        if path == '/internal/hearts':
            raise HTTPException(503, 'Connection lost after heart commit')
        return result
    monkeypatch.setattr(progress, 'request', ambiguous)
    assert answer(pc, aid, exercises[0]['id'], 1, 'retry').status_code == 503
    monkeypatch.setattr(progress, 'request', original)
    assert answer(pc, aid, exercises[0]['id'], 1, 'retry').json()['hearts'] == 4
    assert gc.get('/api/v1/me', headers=headers()).json()['hearts'] == 4


def test_outbox_survives_failed_publish_and_duplicate_delivery(stack):
    _, gc, redis, _ = stack
    complete(stack)
    class Broken:
        def xadd(self, *args, **kwargs):
            raise ConnectionError('Redis offline')
    with pytest.raises(ConnectionError):
        progress.publish_once(Broken())
    with transaction(progress.DB) as db:
        assert db.execute('SELECT published FROM outbox').fetchone()[0] == 0
    progress.publish_once(redis)
    redis.xgroup_create(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, id='0')
    batches = redis.xreadgroup(GAMIFICATION_CONSUMER_GROUP, 'crashed', {LESSON_COMPLETED_STREAM: '>'})
    # Commit reward but simulate crash before ACK; recovered delivery is safe.
    event = LessonCompletedEvent.model_validate_json(batches[0][1][0][1]['event'])
    game.apply_event(event)
    recovered = redis.xautoclaim(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, 'recovered', 0, '0-0')
    game.consume(recovered[1])
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 20
    assert redis.xpending(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP)['pending'] == 0


def test_streak_uses_event_day_and_handles_out_of_order(stack):
    _, gc, _, _ = stack
    today = datetime.now(timezone.utc)
    for ago in (1, 0, 2, 0):
        game.apply_event(LessonCompletedEvent(event_id=uuid4(), user_id=UUID(USER), lesson_id=UUID(LESSON), lesson_attempt_id=uuid4(), exercises_correct=1, exercises_incorrect=0, hearts_lost=0, xp_earned=5, completed_at=today-timedelta(days=ago)))
    assert gc.get('/api/v1/me', headers=headers()).json()['streak'] == 3


@pytest.mark.parametrize('payload,answer', list(zip(PAYLOADS, ANSWERS)))
def test_grading_accepts_valid_answers_and_rejects_wrong_shapes(payload, answer):
    assert progress.grade(payload, answer)[0]
    assert not progress.grade(payload, None)[0]
