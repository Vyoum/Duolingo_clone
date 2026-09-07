"""Durable rewards and hearts; Redis Streams consumer and sorted-set leaderboard."""
import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import UUID

import redis
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from duolingo_shared import LessonCompletedEvent, LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP
from duolingo_shared.runtime import REDIS_URL, transaction

DB = os.getenv('DB_PATH', 'data/gamification.db')
HEART_SECONDS = 1800
log = logging.getLogger(__name__)
client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=5)


def initialize():
    with transaction(DB) as db:
        db.execute('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0, hearts INTEGER NOT NULL DEFAULT 5 CHECK(hearts BETWEEN 0 AND 5), heart_at REAL NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS events_processed (id TEXT PRIMARY KEY, attempt_id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), day TEXT NOT NULL, xp INTEGER NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS heart_operations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, cost INTEGER NOT NULL, fingerprint TEXT NOT NULL, response TEXT NOT NULL)')


def user_row(db, user, now=None):
    now = time.time() if now is None else now
    db.execute('INSERT OR IGNORE INTO users(id,heart_at) VALUES(?,?)', (user, now))
    row = db.execute('SELECT * FROM users WHERE id=?', (user,)).fetchone()
    gained = max(0, int((now - row['heart_at']) // HEART_SECONDS))
    hearts = min(5, row['hearts'] + gained)
    anchor = now if hearts == 5 else row['heart_at'] + gained * HEART_SECONDS
    db.execute('UPDATE users SET hearts=?,heart_at=? WHERE id=?', (hearts, anchor, user))
    return db.execute('SELECT * FROM users WHERE id=?', (user,)).fetchone()


def apply_event(event):
    with transaction(DB) as db:
        user = str(event.user_id)
        user_row(db, user)
        inserted = db.execute('INSERT OR IGNORE INTO events_processed VALUES(?,?,?,?,?)', (str(event.event_id), str(event.lesson_attempt_id), user, event.completed_at.astimezone(timezone.utc).date().isoformat(), event.xp_earned)).rowcount
        if inserted:
            db.execute('UPDATE users SET xp=xp+? WHERE id=?', (event.xp_earned, user))


def sync_board():
    # Absolute scores make Redis replay/rebuild safe. Serialize DB snapshot and
    # ZADD to prevent an older snapshot overwriting a newer score.
    with transaction(DB) as db:
        scores = {r['id']: r['xp'] for r in db.execute('SELECT id,xp FROM users')}
        scores.update({'seed:Lucia': 120, 'seed:Arjun': 95, 'seed:Maya': 70, 'seed:Leo': 45, 'seed:Sofia': 20})
        client.zadd('leaderboard:all-time', scores)


def consume(messages):
    for mid, fields in messages:
        event = LessonCompletedEvent.model_validate_json(fields['event'])
        apply_event(event)
        sync_board()
        client.xack(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, mid)


def worker(stop):
    while not stop.is_set():
        try:
            try:
                client.xgroup_create(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, id='0', mkstream=True)
            except redis.ResponseError as exc:
                if 'BUSYGROUP' not in str(exc):
                    raise
            # Recover pending deliveries from crashed consumers before new work.
            recovered = client.xautoclaim(LESSON_COMPLETED_STREAM, GAMIFICATION_CONSUMER_GROUP, 'rewards', min_idle_time=1000, start_id='0-0', count=50)
            consume(recovered[1])
            batches = client.xreadgroup(GAMIFICATION_CONSUMER_GROUP, 'rewards', {LESSON_COMPLETED_STREAM: '>'}, count=50, block=1000)
            for _, messages in batches:
                consume(messages)
            sync_board()
        except Exception:
            log.exception('Reward delivery failed; pending messages will be retried')
            stop.wait(2)


@asynccontextmanager
async def lifespan(app):
    initialize()
    stop = threading.Event()
    thread = threading.Thread(target=worker, args=(stop,), daemon=True)
    thread.start()
    yield
    stop.set()
    thread.join(timeout=6)


app = FastAPI(title='Gamification service', lifespan=lifespan)


@app.get('/health')
def health():
    with transaction(DB) as db:
        db.execute('SELECT 1')
    return {'status': 'ok'}


@app.get('/api/v1/me')
def me(x_user_id: UUID = Header()):
    user = str(x_user_id)
    today = datetime.now(timezone.utc).date()
    with transaction(DB) as db:
        row = user_row(db, user)
        days = {r[0] for r in db.execute('SELECT DISTINCT day FROM events_processed WHERE user_id=?', (user,))}
        day = today if today.isoformat() in days else today - timedelta(days=1)
        streak = 0
        while day.isoformat() in days:
            streak += 1
            day -= timedelta(days=1)
        daily = db.execute('SELECT COALESCE(SUM(xp),0), COUNT(*) FROM events_processed WHERE user_id=? AND day=?', (user, today.isoformat())).fetchone()
        total = db.execute('SELECT COUNT(*) FROM events_processed WHERE user_id=?', (user,)).fetchone()[0]
        achievements = [{'name': 'First steps', 'current': min(total, 1), 'target': 1}, {'name': 'XP explorer', 'current': min(row['xp'], 100), 'target': 100}, {'name': 'On fire', 'current': min(streak, 3), 'target': 3}]
        return {'user_id': user, 'name': 'Vyoum', 'xp': row['xp'], 'streak': streak, 'hearts': row['hearts'], 'next_heart_at': None if row['hearts'] == 5 else datetime.fromtimestamp(row['heart_at'] + HEART_SECONDS, timezone.utc).isoformat(), 'lessons_completed': total, 'achievements': achievements, 'quests': [{'name': 'Earn 10 XP today', 'current': min(daily[0], 10), 'target': 10}, {'name': 'Complete 2 lessons today', 'current': min(daily[1], 2), 'target': 2}], 'quest_day': today.isoformat()}


class HeartOperation(BaseModel):
    user_id: UUID
    operation: str = Field(min_length=1, max_length=200)
    cost: int = Field(ge=0, le=1)
    fingerprint: str = Field(max_length=20000)


@app.post('/internal/hearts')
def hearts(body: HeartOperation):
    user = str(body.user_id)
    with transaction(DB) as db:
        old = db.execute('SELECT * FROM heart_operations WHERE id=?', (body.operation,)).fetchone()
        if old:
            if (old['user_id'], old['cost'], old['fingerprint']) != (user, body.cost, body.fingerprint):
                raise HTTPException(409, 'A pending answer must be retried unchanged')
            return json.loads(old['response'])
        row = user_row(db, user)
        if row['hearts'] == 0:
            raise HTTPException(403, 'Out of hearts. A heart regenerates every 30 minutes.')
        remaining = row['hearts'] - body.cost
        db.execute('UPDATE users SET hearts=? WHERE id=?', (remaining, user))
        response = {'hearts': remaining}
        db.execute('INSERT INTO heart_operations VALUES(?,?,?,?,?)', (body.operation, user, body.cost, body.fingerprint, json.dumps(response)))
        return response


@app.get('/api/v1/leaderboard')
def leaderboard(x_user_id: UUID = Header()):
    me(x_user_id)
    try:
        sync_board()
        rows = client.zrevrange('leaderboard:all-time', 0, 49, withscores=True)
    except redis.RedisError as exc:
        raise HTTPException(503, 'Leaderboard is temporarily unavailable') from exc
    return {'period': 'All time', 'items': [{'rank': i+1, 'user_id': user, 'name': user[5:] if user.startswith('seed:') else 'Vyoum', 'xp': int(xp), 'is_you': user == str(x_user_id), 'seeded': user.startswith('seed:')} for i, (user, xp) in enumerate(rows)]}
