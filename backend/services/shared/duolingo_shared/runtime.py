"""Small service runtime: separate durable SQLite files and bounded HTTP calls."""
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

import httpx
from fastapi import HTTPException


@contextmanager
def transaction(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=15)
    db.row_factory = sqlite3.Row
    try:
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('PRAGMA foreign_keys=ON')
        db.execute('BEGIN IMMEDIATE')
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()


def request(base, path, method='GET', **kwargs):
    try:
        response = httpx.request(method, base + path, timeout=10, **kwargs)
    except httpx.RequestError as exc:
        raise HTTPException(503, 'A learning service is unavailable. Please retry.') from exc
    if response.is_error:
        try:
            detail = response.json().get('detail', 'Service request failed')
        except ValueError:
            detail = 'Service request failed'
        raise HTTPException(response.status_code, detail)
    return response.json()


def service_url(name, fallback):
    value = os.getenv(name, fallback).rstrip('/')
    return value if '://' in value else 'http://' + value


CONTENT_URL = service_url('CONTENT_URL', 'http://localhost:8001')
GAME_URL = service_url('GAME_URL', 'http://localhost:8003')
PROGRESS_URL = service_url('PROGRESS_URL', 'http://localhost:8002')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
