"""Public allowlisted API, fixed demo identity, Redis rate limiting."""
import os
import re
import time
from uuid import UUID

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from duolingo_shared.runtime import CONTENT_URL, GAME_URL, PROGRESS_URL, REDIS_URL

app = FastAPI(title='Learning API gateway')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','), allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'Idempotency-Key'])
USER = str(UUID(os.getenv('MOCK_USER_ID', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')))
limiter = redis.from_url(REDIS_URL, socket_timeout=3)
RATE_LIMIT = int(os.getenv('RATE_LIMIT', '120'))
LIMIT_SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n"


@app.get('/health')
async def health():
    try:
        await limiter.ping()
    except redis.RedisError:
        return JSONResponse({'status': 'unavailable', 'dependency': 'redis'}, status_code=503)
    return {'status': 'ok'}


@app.api_route('/api/v1/{path:path}', methods=['GET', 'POST'])
async def proxy(path: str, req: Request):
    # A single fixed learner is deliberate for the assignment. Never forward a
    # caller-provided user header or expose the internal heart mutation API.
    if req.method == 'GET' and path in ('me', 'leaderboard'):
        base = GAME_URL
    elif req.method == 'GET' and (path == 'path' or re.fullmatch(r'attempts/[0-9a-f-]{36}', path) or re.fullmatch(r'practice/legendary/[0-9a-f-]{36}', path)):
        base = PROGRESS_URL
    elif req.method == 'POST' and (path == 'attempts' or path == 'practice/legendary' or re.fullmatch(r'attempts/[0-9a-f-]{36}/answers', path) or re.fullmatch(r'practice/legendary/[0-9a-f-]{36}/answers', path)):
        base = PROGRESS_URL
    elif req.method == 'GET' and (path == 'courses' or re.fullmatch(r'courses/[0-9a-f-]{36}', path) or re.fullmatch(r'skills/[0-9a-f-]{36}/lessons', path)):
        base = CONTENT_URL
    else:
        return JSONResponse({'detail': 'Route not found'}, status_code=404)
    try:
        count = await limiter.eval(LIMIT_SCRIPT, 1, f'rate:{USER}:{int(time.time() // 60)}')
        if count > RATE_LIMIT:
            return JSONResponse({'detail': 'Too many requests. Try again in a minute.'}, status_code=429, headers={'Retry-After': '60'})
    except redis.RedisError:
        return JSONResponse({'detail': 'Rate limit service unavailable. Please retry.'}, status_code=503)
    body = bytearray()
    async for chunk in req.stream():
        body.extend(chunk)
        if len(body) > 16384:
            return JSONResponse({'detail': 'Request too large'}, status_code=413)
    headers = {'X-User-Id': USER, 'Content-Type': 'application/json'}
    if 'idempotency-key' in req.headers:
        headers['Idempotency-Key'] = req.headers['idempotency-key']
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(req.method, base + '/api/v1/' + path, content=bytes(body), headers=headers)
        return Response(response.content, status_code=response.status_code, media_type='application/json', headers={'Cache-Control': 'no-store'})
    except httpx.RequestError:
        return JSONResponse({'detail': 'Learning service unavailable. Please retry.'}, status_code=503)
