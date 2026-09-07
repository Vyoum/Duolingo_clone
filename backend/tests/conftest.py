import copy
import importlib.util
import sys
from pathlib import Path
from uuid import UUID

import fakeredis
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

SERVICES = Path(__file__).resolve().parents[1] / 'services'
sys.path.insert(0, str(SERVICES / 'shared'))


def load(name, service):
    folder = SERVICES / service / 'app'
    spec = importlib.util.spec_from_file_location(name, folder / 'main.py', submodule_search_locations=[str(folder)])
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


progress = load('progress_app', 'progress-service')
game = load('game_app', 'gamification-service')
gateway = load('gateway_app', 'gateway')
USER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
LESSON = '44444444-4444-4444-4444-444444444401'
SECOND = '44444444-4444-4444-4444-444444444402'
PAYLOADS = [
    {'type': 'multiple_choice', 'prompt': 'Hello?', 'options': ['hola', 'adios'], 'correct_index': 0},
    {'type': 'translate', 'prompt': 'Good morning', 'source_tokens': ['Good', 'morning'], 'correct_tokens': ['Buenos', 'días']},
    {'type': 'match', 'prompt': 'Match', 'pairs': [{'left': 'milk', 'right': 'leche'}, {'left': 'bread', 'right': 'pan'}]},
    {'type': 'fill_blank', 'prompt': 'Fill', 'sentence': 'Yo quiero ____.', 'options': ['agua', 'rojo'], 'correct_answer': 'agua'},
    {'type': 'type_answer', 'prompt': 'Goodbye?', 'accepted_answers': ['adiós', 'adios']},
]
ANSWERS = [0, ['Buenos', 'días'], {'milk': 'leche', 'bread': 'pan'}, 'agua', '  ADIÓS  ']


@pytest.fixture
def stack(tmp_path, monkeypatch):
    monkeypatch.setattr(progress, 'DB', str(tmp_path / 'progress.db'))
    monkeypatch.setattr(game, 'DB', str(tmp_path / 'game.db'))
    redis = fakeredis.FakeRedis(decode_responses=True)
    monkeypatch.setattr(game, 'client', redis)
    progress.initialize()
    game.initialize()
    pc, gc = TestClient(progress.app), TestClient(game.app)
    exercises = [{'id': str(UUID(int=i+100)), 'payload': p} for i, p in enumerate(PAYLOADS)]
    lesson = {'id': LESSON, 'xp_reward': 20, 'exercises': exercises}
    course = {'name': 'Spanish', 'units': [{'id': 'unit', 'title': 'Basics', 'skills': [{'id': 'skill', 'title': 'Greetings', 'lessons': [{'id': LESSON, 'xp_reward': 20}, {'id': SECOND, 'xp_reward': 10}]}]}]}
    monkeypatch.setattr(progress, 'curriculum', lambda: copy.deepcopy(course))
    def request(base, path, method='GET', **kwargs):
        if base == progress.CONTENT_URL:
            return copy.deepcopy(lesson | {'id': path.split('/')[-1]})
        response = gc.request(method, path, **kwargs)
        if response.is_error:
            raise HTTPException(response.status_code, response.json()['detail'])
        return response.json()
    monkeypatch.setattr(progress, 'request', request)
    return pc, gc, redis, exercises


def headers(key=None, user=USER):
    return {'X-User-Id': user, **({'Idempotency-Key': key} if key else {})}


def start(pc, key='start', lesson=LESSON):
    return pc.post('/api/v1/attempts', json={'lesson_id': lesson}, headers=headers(key))


def answer(pc, aid, eid, value, key):
    return pc.post(f'/api/v1/attempts/{aid}/answers', json={'exercise_id': eid, 'answer': value}, headers=headers(key))
