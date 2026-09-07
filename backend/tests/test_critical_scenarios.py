"""High-priority integration scenarios using durable SQLite and fake Redis.

Exercise actual Progress/Gamification handlers and delivery functions. The
curriculum transport and Redis server are supplied by the existing stack fixture.
"""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from redis.exceptions import ConnectionError as RedisConnectionError

from conftest import ANSWERS, LESSON, USER, answer, game, headers, progress, start
from duolingo_shared import GAMIFICATION_CONSUMER_GROUP, LESSON_COMPLETED_STREAM
from duolingo_shared.runtime import transaction


def test_racing_final_answers_commit_one_completion_and_one_reward(stack):
    """P0: concurrent tabs and retries cannot multiply completion, XP, or hearts."""
    pc, gc, redis, exercises = stack
    started = start(pc)
    assert started.status_code == 200, started.text
    aid = started.json()['id']

    # Include a real mistake so heart preservation is checked as well as XP.
    mistake = answer(pc, aid, exercises[0]['id'], 1, 'initial-mistake')
    assert mistake.status_code == 200, mistake.text
    assert mistake.json()['hearts'] == 4
    for i, exercise in enumerate(exercises[:-1]):
        response = answer(pc, aid, exercise['id'], ANSWERS[i], f'prepare-{i}')
        assert response.status_code == 200, response.text

    # Four independently keyed submissions, each retried once, hit the final
    # exercise together. Whichever key wins must replay its original response;
    # all other keys must be rejected because the attempt has already completed.
    keys = ['tab-a', 'tab-b', 'tab-c', 'tab-d'] * 2
    barrier = Barrier(len(keys))

    def finish(key):
        barrier.wait(timeout=10)
        return key, answer(pc, aid, exercises[-1]['id'], ANSWERS[-1], key)

    with ThreadPoolExecutor(max_workers=len(keys)) as pool:
        results = list(pool.map(finish, keys))

    successful = [(key, response) for key, response in results if response.status_code == 200]
    assert len(successful) == 2, [(key, response.status_code, response.text) for key, response in results]
    winning_key = successful[0][0]
    assert all(key == winning_key for key, _ in successful)
    assert successful[0][1].json() == successful[1][1].json()
    assert all(response.status_code == 409 for key, response in results if key != winning_key)
    assert successful[0][1].json() == {
        'correct': True,
        'expected': 'adiós',
        'position': len(exercises),
        'completed': True,
        'hearts': 4,
        'out_of_hearts': False,
        'xp_earned': 20,
    }
    conflicting_retry = answer(pc, aid, exercises[-1]['id'], 'wrong', winning_key)
    assert conflicting_retry.status_code == 409

    with transaction(progress.DB) as db:
        attempt = db.execute('SELECT * FROM attempts WHERE id=?', (aid,)).fetchone()
        assert (attempt['status'], attempt['correct'], attempt['incorrect']) == ('completed', 5, 1)
        assert db.execute('SELECT COUNT(*) FROM answers WHERE attempt_id=?', (aid,)).fetchone()[0] == 6
        assert db.execute('SELECT COUNT(*) FROM completions WHERE user_id=? AND lesson_id=?', (USER, LESSON)).fetchone()[0] == 1
        assert db.execute('SELECT COUNT(*) FROM outbox').fetchone()[0] == 1

    progress.publish_once(redis)
    redis.xgroup_create(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, id='0')
    messages = redis.xreadgroup(
        GAMIFICATION_CONSUMER_GROUP, 'race-consumer', {LESSON_COMPLETED_STREAM: '>'}
    )[0][1]
    assert len(messages) == 1
    game.consume(messages)

    learner = gc.get('/api/v1/me', headers=headers()).json()
    assert (learner['xp'], learner['hearts'], learner['lessons_completed'], learner['streak']) == (20, 4, 1, 1)
    assert redis.zscore('leaderboard:all-time', USER) == 20
    path = pc.get('/api/v1/path', headers=headers()).json()
    skill = path['units'][0]['skills'][0]
    assert skill['crowns'] == 1
    assert skill['lessons'][1]['unlocked'] is True


def test_publish_response_loss_then_leaderboard_failure_recovers_without_double_xp(stack, monkeypatch):
    """P0: failures on both sides of delivery cannot lose or multiply rewards."""
    pc, gc, redis, exercises = stack
    started = start(pc)
    assert started.status_code == 200, started.text
    aid = started.json()['id']
    for i, exercise in enumerate(exercises):
        response = answer(pc, aid, exercise['id'], ANSWERS[i], f'answer-{i}')
        assert response.status_code == 200, response.text
    assert response.json()['completed'] is True

    original_xadd = redis.xadd

    def append_then_lose_response(*args, **kwargs):
        original_xadd(*args, **kwargs)
        raise RedisConnectionError('XADD committed, but its response was lost')

    with monkeypatch.context() as fault:
        fault.setattr(redis, 'xadd', append_then_lose_response)
        with pytest.raises(RedisConnectionError, match='response was lost'):
            progress.publish_once(redis)

    # Redis has the event, but the publisher rolled back its delivery marker.
    assert redis.xlen(LESSON_COMPLETED_STREAM) == 1
    with transaction(progress.DB) as db:
        assert db.execute('SELECT published FROM outbox').fetchone()[0] == 0

    progress.initialize()  # Reopen the persisted schema without clearing state.
    progress.publish_once(redis)
    published = redis.xrange(LESSON_COMPLETED_STREAM)
    assert len(published) == 2
    assert published[0][0] != published[1][0]
    assert published[0][1]['event'] == published[1][1]['event']
    with transaction(progress.DB) as db:
        assert db.execute('SELECT published FROM outbox').fetchone()[0] == 1

    redis.xgroup_create(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, id='0')
    messages = redis.xreadgroup(
        GAMIFICATION_CONSUMER_GROUP, 'failed-consumer', {LESSON_COMPLETED_STREAM: '>'}, count=10
    )[0][1]

    def fail_leaderboard(*args, **kwargs):
        raise RedisConnectionError('Leaderboard unavailable after reward commit')

    with monkeypatch.context() as fault:
        fault.setattr(redis, 'zadd', fail_leaderboard)
        with pytest.raises(RedisConnectionError, match='after reward commit'):
            game.consume(messages)

    # Reward is durable, but neither delivery can be ACKed before projection.
    with transaction(game.DB) as db:
        assert db.execute('SELECT xp FROM users WHERE id=?', (USER,)).fetchone()[0] == 20
        assert db.execute('SELECT COUNT(*) FROM events_processed').fetchone()[0] == 1
    assert redis.zscore('leaderboard:all-time', USER) is None
    assert redis.xpending(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP)['pending'] == 2

    game.initialize()
    recovered = redis.xautoclaim(
        LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP,
        'replacement-consumer', min_idle_time=0, start_id='0-0', count=10,
    )[1]
    assert len(recovered) == 2
    game.consume(recovered)
    # Even another explicit replay must leave the durable totals unchanged.
    game.consume(messages)

    learner = gc.get('/api/v1/me', headers=headers()).json()
    assert (learner['xp'], learner['lessons_completed'], learner['streak'], learner['hearts']) == (20, 1, 1, 5)
    assert learner['quests'][1]['current'] == 1
    assert redis.zscore('leaderboard:all-time', USER) == 20
    assert redis.xpending(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP)['pending'] == 0
    with transaction(game.DB) as db:
        assert db.execute('SELECT COUNT(*) FROM events_processed').fetchone()[0] == 1
    saved = pc.get(f'/api/v1/attempts/{aid}', headers=headers()).json()
    assert saved['status'] == 'completed'
    assert saved['position'] == len(exercises)
