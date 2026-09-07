import fakeredis.aioredis
import httpx
from fastapi.testclient import TestClient
from conftest import gateway


def test_gateway_allowlist_identity_rate_limit_and_upstream_errors(monkeypatch):
    monkeypatch.setattr(gateway, 'limiter', fakeredis.aioredis.FakeRedis())
    monkeypatch.setattr(gateway, 'RATE_LIMIT', 2)
    seen = []
    def upstream(request):
        seen.append(request)
        return httpx.Response(200, json={'user_id': request.headers['X-User-Id']})
    factory = httpx.AsyncClient
    monkeypatch.setattr(gateway.httpx, 'AsyncClient', lambda **kwargs: factory(transport=httpx.MockTransport(upstream), **kwargs))
    with TestClient(gateway.app) as client:
        assert client.get('/api/v1/internal/hearts').status_code == 404
        assert client.get('/api/v1/lessons/44444444-4444-4444-4444-444444444401').status_code == 404
        assert client.post('/api/v1/me').status_code == 404
        response = client.get('/api/v1/me', headers={'X-User-Id': 'attacker'})
        assert response.json()['user_id'] == gateway.USER
        response = client.post('/api/v1/attempts', json={'lesson_id': 'demo'}, headers={'Idempotency-Key': 'retry-key'})
        assert seen[-1].headers['Idempotency-Key'] == 'retry-key'
        response = client.get('/api/v1/me')
        assert response.status_code == 429 and response.headers['Retry-After'] == '60'


def test_gateway_fails_cleanly_when_redis_is_down(monkeypatch):
    class Broken:
        async def eval(self, *args):
            raise gateway.redis.ConnectionError('offline')
    monkeypatch.setattr(gateway, 'limiter', Broken())
    with TestClient(gateway.app) as client:
        assert client.get('/api/v1/me').status_code == 503
