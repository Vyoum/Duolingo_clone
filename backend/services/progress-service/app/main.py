"""Attempts, server grading, sequential unlocking, transactional event outbox."""
import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import UUID, uuid4

import redis
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from duolingo_shared import LessonCompletedEvent, LESSON_COMPLETED_STREAM
from duolingo_shared.runtime import CONTENT_URL, GAME_URL, REDIS_URL, request, transaction
from .grading import grade, public_lesson

DB = os.getenv('DB_PATH', 'data/progress.db')
SEED_DEMO_LEARNER = os.getenv('SEED_DEMO_LEARNER', '').lower() in {'1', 'true', 'yes'}
DEMO_USER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
# Matches content-service seed lesson IDs (Greetings 1 + 2).
DEMO_LESSONS = (
    '44444444-4444-4444-4444-444444444401',
    '44444444-4444-4444-4444-444444444402',
)
log = logging.getLogger(__name__)


def initialize():
    with transaction(DB) as db:
        db.execute('CREATE TABLE IF NOT EXISTS attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, lesson_id TEXT NOT NULL, start_key TEXT NOT NULL, lesson TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, incorrect INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT "active", UNIQUE(user_id,start_key))')
        db.execute('CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON attempts(user_id) WHERE status="active"')
        db.execute('CREATE TABLE IF NOT EXISTS start_requests (user_id TEXT NOT NULL, key TEXT NOT NULL, lesson_id TEXT NOT NULL, attempt_id TEXT NOT NULL REFERENCES attempts(id), PRIMARY KEY(user_id,key))')
        db.execute('INSERT OR IGNORE INTO start_requests SELECT user_id,start_key,lesson_id,id FROM attempts')
        db.execute('CREATE TABLE IF NOT EXISTS answers (attempt_id TEXT NOT NULL REFERENCES attempts(id), key TEXT NOT NULL, body TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(attempt_id,key))')
        db.execute('CREATE TABLE IF NOT EXISTS completions (user_id TEXT NOT NULL, lesson_id TEXT NOT NULL, PRIMARY KEY(user_id,lesson_id))')
        db.execute('CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, payload TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0)')
        db.execute('CREATE TABLE IF NOT EXISTS matched_pairs (attempt_id TEXT NOT NULL REFERENCES attempts(id), exercise_id TEXT NOT NULL, left_word TEXT NOT NULL, right_word TEXT NOT NULL, PRIMARY KEY(attempt_id,exercise_id,left_word), UNIQUE(attempt_id,exercise_id,right_word))')
        db.execute('CREATE TABLE IF NOT EXISTS practice_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, start_key TEXT NOT NULL, lesson TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT "active", deadline REAL NOT NULL, UNIQUE(user_id,start_key))')
        db.execute('CREATE TABLE IF NOT EXISTS practice_answers (session_id TEXT NOT NULL REFERENCES practice_sessions(id), key TEXT NOT NULL, body TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(session_id,key))')
        db.execute('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    if SEED_DEMO_LEARNER:
        seed_demo_learner()


def seed_demo_learner():
    """Give the fixed demo user two completed Greetings lessons (idempotent)."""
    with transaction(DB) as db:
        if db.execute('SELECT 1 FROM meta WHERE key=?', ('demo_learner_seeded',)).fetchone():
            return
        existing = db.execute('SELECT COUNT(*) FROM completions WHERE user_id=?', (DEMO_USER,)).fetchone()[0]
        if existing == 0:
            for lesson_id in DEMO_LESSONS:
                db.execute('INSERT OR IGNORE INTO completions VALUES(?,?)', (DEMO_USER, lesson_id))
            log.info('Seeded demo learner completions for %s', DEMO_USER)
        db.execute('INSERT INTO meta VALUES(?,?)', ('demo_learner_seeded', '1'))


def publish_once(client):
    with transaction(DB) as db:
        for row in db.execute('SELECT * FROM outbox WHERE published=0 LIMIT 50').fetchall():
            client.xadd(LESSON_COMPLETED_STREAM, {'event': row['payload']})
            db.execute('UPDATE outbox SET published=1 WHERE id=?', (row['id'],))


def publisher(stop):
    client = redis.Redis.from_url(REDIS_URL, socket_timeout=5)
    while not stop.is_set():
        try:
            publish_once(client)
        except Exception:
            log.exception('Outbox delivery failed; retrying')
        stop.wait(1)
    client.close()


@asynccontextmanager
async def lifespan(app):
    initialize()
    stop = threading.Event()
    worker = threading.Thread(target=publisher, args=(stop,), daemon=True)
    worker.start()
    yield
    stop.set()
    worker.join(timeout=6)


app = FastAPI(title='Progress service', lifespan=lifespan)


def curriculum():
    courses = request(CONTENT_URL, '/api/v1/courses')['items']
    if not courses:
        raise HTTPException(503, 'Curriculum has not been seeded')
    course = request(CONTENT_URL, '/api/v1/courses/' + courses[0]['id'])
    for unit in course['units']:
        for skill in unit['skills']:
            skill['lessons'] = request(CONTENT_URL, '/api/v1/skills/' + skill['id'] + '/lessons')['lessons']
    return course


def owned(db, attempt_id, user):
    row = db.execute('SELECT * FROM attempts WHERE id=? AND user_id=?', (str(attempt_id), str(user))).fetchone()
    if not row:
        raise HTTPException(404, 'Attempt not found')
    return row


def matched_pairs(db, attempt_id, exercise_id):
    return dict(db.execute(
        'SELECT left_word,right_word FROM matched_pairs WHERE attempt_id=? AND exercise_id=?',
        (attempt_id, exercise_id),
    ).fetchall())


def attempt_view(row, db):
    lesson = public_lesson(json.loads(row['lesson']))
    current = lesson['exercises'][row['position']] if row['position'] < len(lesson['exercises']) else None
    pairs = matched_pairs(db, row['id'], current['id']) if current else {}
    return {k: row[k] for k in ('id', 'lesson_id', 'position', 'correct', 'incorrect', 'status')} | {'lesson': lesson, 'matched_pairs': pairs}


@app.get('/health')
def health():
    with transaction(DB) as db:
        db.execute('SELECT 1')
    return {'status': 'ok'}


@app.get('/api/v1/path')
def path(x_user_id: UUID = Header()):
    course = curriculum()
    with transaction(DB) as db:
        done = {r[0] for r in db.execute('SELECT lesson_id FROM completions WHERE user_id=?', (str(x_user_id),))}
    unlocked = True
    for unit in course['units']:
        for skill in unit['skills']:
            for lesson in skill['lessons']:
                lesson['completed'] = lesson['id'] in done
                lesson['unlocked'] = unlocked or lesson['completed']
                unlocked = unlocked and lesson['completed']
            skill['crowns'] = sum(l['completed'] for l in skill['lessons'])
    return course


class Start(BaseModel):
    lesson_id: UUID


@app.post('/api/v1/attempts')
def start(body: Start, x_user_id: UUID = Header(), idempotency_key: str = Header(min_length=1, max_length=128)):
    user, lesson_id = str(x_user_id), str(body.lesson_id)
    with transaction(DB) as db:
        previous = db.execute('SELECT a.* FROM attempts a JOIN start_requests s ON s.attempt_id=a.id WHERE s.user_id=? AND s.key=?', (user, idempotency_key)).fetchone()
        if previous:
            if previous['lesson_id'] != lesson_id:
                raise HTTPException(409, 'Idempotency key belongs to a different lesson')
            return attempt_view(previous, db)
    course = path(x_user_id)
    lessons = [l for u in course['units'] for s in u['skills'] for l in s['lessons']]
    selected = next((l for l in lessons if l['id'] == lesson_id), None)
    if not selected:
        raise HTTPException(404, 'Lesson not found')
    if not selected['unlocked']:
        raise HTTPException(403, 'Complete the previous lesson first')
    lesson = request(CONTENT_URL, '/api/v1/lessons/' + lesson_id)
    if not lesson['exercises']:
        raise HTTPException(409, 'Lesson has no exercises')
    stats = request(GAME_URL, '/api/v1/me', headers={'X-User-Id': user})
    if stats['hearts'] == 0:
        raise HTTPException(403, 'Out of hearts. A heart regenerates every 30 minutes.')
    with transaction(DB) as db:
        # Recheck after network calls: concurrent starts must return the same attempt.
        previous = db.execute('SELECT a.* FROM attempts a JOIN start_requests s ON s.attempt_id=a.id WHERE s.user_id=? AND s.key=?', (user, idempotency_key)).fetchone()
        if previous:
            if previous['lesson_id'] != lesson_id:
                raise HTTPException(409, 'Idempotency key belongs to a different lesson')
            return attempt_view(previous, db)
        active = db.execute('SELECT * FROM attempts WHERE user_id=? AND status="active"', (user,)).fetchone()
        if active and active['lesson_id'] == lesson_id:
            db.execute('INSERT INTO start_requests VALUES(?,?,?,?)', (user, idempotency_key, lesson_id, active['id']))
            return attempt_view(active, db)
        if active:
            db.execute('UPDATE attempts SET status="abandoned" WHERE id=?', (active['id'],))
        aid = str(uuid4())
        db.execute('INSERT INTO attempts(id,user_id,lesson_id,start_key,lesson) VALUES(?,?,?,?,?)', (aid, user, lesson_id, idempotency_key, json.dumps(lesson)))
        db.execute('INSERT INTO start_requests VALUES(?,?,?,?)', (user, idempotency_key, lesson_id, aid))
        return attempt_view(owned(db, aid, user), db)


@app.get('/api/v1/attempts/{attempt_id}')
def get_attempt(attempt_id: UUID, x_user_id: UUID = Header()):
    with transaction(DB) as db:
        return attempt_view(owned(db, attempt_id, x_user_id), db)


class Answer(BaseModel):
    exercise_id: UUID
    answer: str | int | list[str] | dict[str, str]
    match_pair: bool = False


@app.post('/api/v1/attempts/{attempt_id}/answers')
def submit(attempt_id: UUID, body: Answer, x_user_id: UUID = Header(), idempotency_key: str = Header(min_length=1, max_length=128)):
    user, aid = str(x_user_id), str(attempt_id)
    # Keep fingerprints of legacy full-exercise submissions stable.
    encoded = json.dumps(body.model_dump(mode='json', exclude_defaults=True), sort_keys=True)
    with transaction(DB) as db:
        row = owned(db, aid, user)
        old = db.execute('SELECT * FROM answers WHERE attempt_id=? AND key=?', (aid, idempotency_key)).fetchone()
        if old:
            if old['body'] != encoded:
                raise HTTPException(409, 'Idempotency key reused with a different answer')
            return json.loads(old['response'])
        if row['status'] != 'active':
            raise HTTPException(409, 'Attempt is no longer active')
        lesson = json.loads(row['lesson'])
        exercise = lesson['exercises'][row['position']]
        if exercise['id'] != str(body.exercise_id):
            raise HTTPException(409, 'Answer the current exercise first')
        pairs = matched_pairs(db, aid, exercise['id'])
        if body.match_pair:
            payload = exercise['payload']
            if payload['type'] != 'match' or not isinstance(body.answer, dict) or len(body.answer) != 1:
                raise HTTPException(422, 'Submit exactly one pair for a matching exercise')
            left, right = next(iter(body.answer.items()))
            solutions = {pair['left']: pair['right'] for pair in payload['pairs']}
            if left not in solutions or right not in solutions.values():
                raise HTTPException(422, 'Choose words from the current exercise')
            if left in pairs or right in pairs.values():
                raise HTTPException(409, 'That word has already been matched')
            correct = solutions[left] == right
            expected = 'Pair matched!' if correct else 'Those words do not match. Try again.'
            exercise_complete = correct and len(pairs) + 1 == len(solutions)
        else:
            correct, expected = grade(exercise['payload'], body.answer)
            exercise_complete = correct
        # Stable across rollback/retry, independent of the caller's key. The game
        # service stores a request fingerprint so changed retries cannot sneak through.
        operation = f'{aid}:{row["position"]}:{row["incorrect"]}'
        if pairs or body.match_pair:
            operation += f':pairs:{len(pairs)}'
        hearts = request(GAME_URL, '/internal/hearts', method='POST', json={'user_id': user, 'operation': operation, 'cost': 0 if correct else 1, 'fingerprint': encoded})
        if body.match_pair and correct:
            db.execute('INSERT INTO matched_pairs VALUES(?,?,?,?)', (aid, exercise['id'], left, right))
            pairs[left] = right
        position = row['position'] + int(exercise_complete)
        completed = position == len(lesson['exercises'])
        db.execute('UPDATE attempts SET position=?, correct=correct+?, incorrect=incorrect+?, status=? WHERE id=?', (position, int(exercise_complete), int(not correct), 'completed' if completed else 'active', aid))
        if completed:
            first = db.execute('INSERT OR IGNORE INTO completions VALUES(?,?)', (user, lesson['id'])).rowcount == 1
            event = LessonCompletedEvent(event_id=uuid4(), user_id=x_user_id, lesson_id=lesson['id'], lesson_attempt_id=attempt_id, exercises_correct=row['correct']+1, exercises_incorrect=row['incorrect'], hearts_lost=row['incorrect'], xp_earned=lesson['xp_reward'] if first else 5, completed_at=datetime.now(timezone.utc))
            db.execute('INSERT INTO outbox(id,payload) VALUES(?,?)', (str(event.event_id), event.model_dump_json()))
        result = {'correct': correct, 'expected': expected, 'position': position, 'completed': completed, 'hearts': hearts['hearts'], 'out_of_hearts': hearts['hearts'] == 0, 'xp_earned': event.xp_earned if completed else 0}
        if body.match_pair:
            result.update(exercise_complete=exercise_complete, matched_pairs=pairs)
        db.execute('INSERT INTO answers VALUES(?,?,?,?)', (aid, idempotency_key, encoded, json.dumps(result)))
        return result


class PracticeStart(BaseModel):
    duration_seconds: int = 90


class PracticeAnswer(BaseModel):
    exercise_id: UUID
    answer: str | int | list[str] | dict[str, str]


def practice_view(row):
    lesson = public_lesson(json.loads(row['lesson']))
    return {
        'id': row['id'], 'position': row['position'], 'status': row['status'],
        'deadline': datetime.fromtimestamp(row['deadline'], timezone.utc).isoformat(),
        'lesson': lesson, 'xp_reward': 15,
    }


def practice_snapshot(user):
    """Take a deterministic, server-owned sample of seeded exercises."""
    course = curriculum()
    ids = [lesson['id'] for unit in course['units'] for skill in unit['skills'] for lesson in skill['lessons']]
    exercises = []
    for lesson_id in ids:
        lesson = request(CONTENT_URL, '/api/v1/lessons/' + lesson_id)
        # Matching is intentionally omitted here: its per-pair protocol belongs
        # to the lesson player, while Legendary grades one exercise submission.
        exercises.extend(ex for ex in lesson['exercises'] if ex['payload']['type'] != 'match')
        if len(exercises) >= 5:
            break
    if not exercises:
        raise HTTPException(503, 'No practice exercises are available')
    return {'id': 'legendary-practice', 'exercises': exercises[:5]}


@app.post('/api/v1/practice/legendary')
def start_legendary(body: PracticeStart, x_user_id: UUID = Header(), idempotency_key: str = Header(min_length=1, max_length=128)):
    if not 15 <= body.duration_seconds <= 600:
        raise HTTPException(422, 'Practice duration must be between 15 seconds and 10 minutes')
    user = str(x_user_id)
    with transaction(DB) as db:
        old = db.execute('SELECT * FROM practice_sessions WHERE user_id=? AND start_key=?', (user, idempotency_key)).fetchone()
        if old:
            return practice_view(old)
    snapshot = practice_snapshot(user)
    with transaction(DB) as db:
        old = db.execute('SELECT * FROM practice_sessions WHERE user_id=? AND start_key=?', (user, idempotency_key)).fetchone()
        if old:
            return practice_view(old)
        session_id = str(uuid4())
        db.execute('INSERT INTO practice_sessions(id,user_id,start_key,lesson,deadline) VALUES(?,?,?,?,?)', (session_id, user, idempotency_key, json.dumps(snapshot), time.time() + body.duration_seconds))
        return practice_view(db.execute('SELECT * FROM practice_sessions WHERE id=?', (session_id,)).fetchone())


@app.get('/api/v1/practice/legendary/{session_id}')
def get_legendary(session_id: UUID, x_user_id: UUID = Header()):
    with transaction(DB) as db:
        row = db.execute('SELECT * FROM practice_sessions WHERE id=? AND user_id=?', (str(session_id), str(x_user_id))).fetchone()
        if not row:
            raise HTTPException(404, 'Practice session not found')
        return practice_view(row)


@app.post('/api/v1/practice/legendary/{session_id}/answers')
def submit_legendary(session_id: UUID, body: PracticeAnswer, x_user_id: UUID = Header(), idempotency_key: str = Header(min_length=1, max_length=128)):
    user, sid = str(x_user_id), str(session_id)
    encoded = json.dumps(body.model_dump(mode='json'), sort_keys=True)
    with transaction(DB) as db:
        row = db.execute('SELECT * FROM practice_sessions WHERE id=? AND user_id=?', (sid, user)).fetchone()
        if not row:
            raise HTTPException(404, 'Practice session not found')
        old = db.execute('SELECT * FROM practice_answers WHERE session_id=? AND key=?', (sid, idempotency_key)).fetchone()
        if old:
            if old['body'] != encoded:
                raise HTTPException(409, 'Idempotency key reused with a different answer')
            return json.loads(old['response'])
        if row['status'] != 'active':
            raise HTTPException(409, 'Practice session is no longer active')
        if time.time() >= row['deadline']:
            result = {'correct': False, 'timeout': True, 'completed': False, 'xp_earned': 0, 'position': row['position']}
            db.execute('UPDATE practice_sessions SET status="timed_out" WHERE id=?', (sid,))
            db.execute('INSERT INTO practice_answers VALUES(?,?,?,?)', (sid, idempotency_key, encoded, json.dumps(result)))
            return result
        lesson = json.loads(row['lesson'])
        exercise = lesson['exercises'][row['position']]
        if exercise['id'] != str(body.exercise_id):
            raise HTTPException(409, 'Answer the current practice exercise first')
        correct, expected = grade(exercise['payload'], body.answer)
        position = row['position'] + int(correct)
        completed = position == len(lesson['exercises'])
        xp = 15 if completed else 0
        if completed:
            # The reward endpoint keys on this session ID, so transport retries
            # cannot award XP twice.
            request(GAME_URL, '/internal/practice-rewards', method='POST', json={'user_id': user, 'session_id': sid, 'xp': xp})
        db.execute('UPDATE practice_sessions SET position=?, status=? WHERE id=?', (position, 'completed' if completed else 'active', sid))
        result = {'correct': correct, 'expected': expected, 'timeout': False, 'completed': completed, 'xp_earned': xp, 'position': position}
        db.execute('INSERT INTO practice_answers VALUES(?,?,?,?)', (sid, idempotency_key, encoded, json.dumps(result)))
        return result
