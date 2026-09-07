from conftest import headers


def start(pc, key, duration=60):
    return pc.post('/api/v1/practice/legendary', json={'duration_seconds': duration}, headers=headers(key))


def answer_for(payload):
    if payload['type'] == 'multiple_choice':
        return payload['correct_index']
    if payload['type'] == 'translate':
        return payload['correct_tokens']
    return payload.get('correct_answer', payload.get('accepted_answers', [''])[0])


def test_legendary_completion_is_idempotent_and_awards_xp_once(stack):
    pc, gc, _, exercises = stack
    session = start(pc, 'legendary-start').json()
    assert session['status'] == 'active'
    assert len(session['lesson']['exercises']) >= 3
    assert all('correct_index' not in item['payload'] for item in session['lesson']['exercises'])

    final_key = None
    for index, item in enumerate(session['lesson']['exercises']):
        # The fixture's exercise IDs map directly to the original safe grader payloads.
        payload = next(source for source in exercises if str(source['id']) == item['id'])['payload']
        key = f'answer-{index}'
        reply = pc.post(f"/api/v1/practice/legendary/{session['id']}/answers", json={'exercise_id': item['id'], 'answer': answer_for(payload)}, headers=headers(key))
        assert reply.status_code == 200
        final_key = key
    result = reply.json()
    assert result['completed'] is True and result['xp_earned'] == 15
    assert pc.post(f"/api/v1/practice/legendary/{session['id']}/answers", json={'exercise_id': item['id'], 'answer': answer_for(payload)}, headers=headers(final_key)).json() == result
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 15


def test_legendary_timeout_is_saved_and_cannot_reward(stack):
    pc, gc, _, _ = stack
    session = start(pc, 'timed-start').json()
    import progress_app as progress
    with progress.transaction(progress.DB) as db:
        db.execute('UPDATE practice_sessions SET deadline=0 WHERE id=?', (session['id'],))
    exercise = session['lesson']['exercises'][0]
    response = pc.post(f"/api/v1/practice/legendary/{session['id']}/answers", json={'exercise_id': exercise['id'], 'answer': 0}, headers=headers('timeout-answer'))
    assert response.status_code == 200 and response.json()['timeout'] is True
    assert pc.post(f"/api/v1/practice/legendary/{session['id']}/answers", json={'exercise_id': exercise['id'], 'answer': 0}, headers=headers('timeout-answer')).json()['timeout'] is True
    assert pc.post(f"/api/v1/practice/legendary/{session['id']}/answers", json={'exercise_id': exercise['id'], 'answer': 0}, headers=headers('late-answer')).status_code == 409
    assert gc.get('/api/v1/me', headers=headers()).json()['xp'] == 0
