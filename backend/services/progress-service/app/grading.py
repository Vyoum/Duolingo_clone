"""Authoritative grading and safe public exercise projection."""
import unicodedata


def normalize(value):
    return ' '.join(unicodedata.normalize('NFC', str(value)).casefold().split())


def grade(payload, answer):
    kind = payload['type']
    if kind == 'multiple_choice':
        expected = payload['options'][payload['correct_index']]
        correct = type(answer) is int and answer == payload['correct_index']
    elif kind == 'translate':
        expected = ' '.join(payload['correct_tokens'])
        correct = isinstance(answer, list) and [normalize(x) for x in answer] == [normalize(x) for x in payload['correct_tokens']]
    elif kind == 'match':
        mapping = {p['left']: p['right'] for p in payload['pairs']}
        expected = ', '.join(f'{a} = {b}' for a, b in mapping.items())
        correct = isinstance(answer, dict) and answer == mapping
    else:
        answers = payload.get('accepted_answers', [payload.get('correct_answer', '')])
        expected = answers[0]
        correct = isinstance(answer, str) and normalize(answer) in [normalize(x) for x in answers]
    return correct, expected


def public_lesson(lesson):
    result = {**lesson, 'exercises': []}
    for exercise in lesson['exercises']:
        payload = dict(exercise['payload'])
        if payload['type'] == 'translate':
            payload['tokens'] = sorted(payload['correct_tokens'], key=str.casefold)
        if payload['type'] == 'match':
            payload['left'] = [pair['left'] for pair in payload['pairs']]
            payload['right'] = sorted(pair['right'] for pair in payload['pairs'])
        for key in ('correct_index', 'correct_tokens', 'correct_answer', 'accepted_answers', 'pairs'):
            payload.pop(key, None)
        result['exercises'].append({**exercise, 'payload': payload})
    return result
