"""Pair-level grading, recovery, and completion use the real service handlers."""
import pytest
from fastapi import HTTPException

from conftest import game, headers, progress, start
from duolingo_shared import LessonCompletedEvent
from duolingo_shared.runtime import transaction


@pytest.fixture
def matching(stack, monkeypatch):
    pc, gc, _, exercises = stack
    transport = progress.request

    def curriculum_request(base, path, **kwargs):
        value = transport(base, path, **kwargs)
        if base == progress.CONTENT_URL:
            value['exercises'] = [exercises[2]]
        return value

    monkeypatch.setattr(progress, 'request', curriculum_request)
    started = start(pc)
    assert started.status_code == 200
    aid = started.json()['id']

    def pair(value, key):
        return pc.post(f'/api/v1/attempts/{aid}/answers', headers=headers(key), json={
            'exercise_id': exercises[2]['id'], 'answer': value, 'match_pair': True,
        })

    return pc, gc, aid, pair


def test_pairs_save_individually_and_complete_lesson_only_after_last_pair(matching):
    pc, gc, aid, pair = matching
    wrong = pair({'milk': 'pan'}, 'wrong')
    assert wrong.status_code == 200
    assert wrong.json()['correct'] is False
    assert wrong.json()['hearts'] == 4
    assert pair({'milk': 'pan'}, 'wrong').json() == wrong.json()
    assert pair({'milk': 'leche'}, 'wrong').status_code == 409

    first = pair({'milk': 'leche'}, 'first').json()
    assert first['correct'] is True and first['exercise_complete'] is False
    assert first['position'] == 0 and first['completed'] is False
    assert first['matched_pairs'] == {'milk': 'leche'}
    progress.initialize()
    saved = pc.get(f'/api/v1/attempts/{aid}', headers=headers()).json()
    assert saved['matched_pairs'] == {'milk': 'leche'}
    assert saved['correct'] == 0
    with transaction(progress.DB) as db:
        assert db.execute('SELECT COUNT(*) FROM outbox').fetchone()[0] == 0

    assert pair({'milk': 'leche'}, 'duplicate').status_code == 409
    last = pair({'bread': 'pan'}, 'last').json()
    assert last['exercise_complete'] is True and last['completed'] is True
    assert last['position'] == 1 and last['hearts'] == 4
    assert pair({'bread': 'pan'}, 'last').json() == last
    with transaction(progress.DB) as db:
        events = db.execute('SELECT payload FROM outbox').fetchall()
        assert len(events) == 1
        event = LessonCompletedEvent.model_validate_json(events[0][0])
        assert (event.exercises_correct, event.exercises_incorrect, event.hearts_lost) == (1, 1, 1)
    game.apply_event(event)
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 20


def test_pair_retry_after_lost_heart_response_does_not_charge_again(matching, monkeypatch):
    pc, gc, aid, pair = matching
    transport = progress.request

    def lost_response(base, path, **kwargs):
        result = transport(base, path, **kwargs)
        if path == '/internal/hearts':
            raise HTTPException(503, 'Heart committed but response lost')
        return result

    with monkeypatch.context() as fault:
        fault.setattr(progress, 'request', lost_response)
        assert pair({'milk': 'pan'}, 'lost').status_code == 503
    assert pair({'milk': 'pan'}, 'lost').json()['hearts'] == 4
    assert gc.get('/api/v1/me', headers=headers()).json()['hearts'] == 4
    assert pc.get(f'/api/v1/attempts/{aid}', headers=headers()).json()['matched_pairs'] == {}


def test_invalid_pairs_do_not_cost_hearts(matching):
    _, gc, _, pair = matching
    for value in ({}, {'milk': 'leche', 'bread': 'pan'}, {'unknown': 'pan'}, {'milk': 'unknown'}, 'leche'):
        assert pair(value, 'invalid').status_code == 422
    assert gc.get('/api/v1/me', headers=headers()).json()['hearts'] == 5
