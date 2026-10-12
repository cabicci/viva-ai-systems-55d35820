"""Import only approved, exact-source Academic sections into the dedicated index.

Default is local validation only. --apply requires service credentials and checks
every corresponding approved production lesson before any paid embeddings or writes.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request

SHA = re.compile(r'^[a-f0-9]{64}$')
COURSE = re.compile(r'^AC-[A-Z0-9]+$')
LESSON = re.compile(r'^AC-[A-Z0-9]+-M[0-9]{2}-L[0-9]{2}$')
LOCALES = {'ar-EG', 'ar-MSA', 'ar-Gulf', 'en'}


def validate(row):
    expected = {'courseId', 'lessonId', 'locale', 'version', 'sectionId',
                'text', 'sha256', 'sourceSha256', 'approval'}
    if not isinstance(row, dict) or set(row) != expected:
        raise ValueError('Unexpected corpus fields')
    if not COURSE.fullmatch(row['courseId']) or not LESSON.fullmatch(row['lessonId']):
        raise ValueError('Invalid Academic identity')
    if not row['lessonId'].startswith(row['courseId'] + '-') or row['locale'] not in LOCALES:
        raise ValueError('Cross-course or locale identity')
    if not isinstance(row['sectionId'], str) or not re.fullmatch(r'[A-Za-z0-9_-]+', row['sectionId']):
        raise ValueError('Invalid section')
    if not isinstance(row['version'], str) or not 1 <= len(row['version']) <= 80:
        raise ValueError('Invalid version')
    if not isinstance(row['text'], str) or not 1 <= len(row['text']) <= 12000:
        raise ValueError('Invalid section text')
    if row['approval'] != 'PENDING_EDITORIAL':
        raise ValueError('Unexpected local approval field')
    if not SHA.fullmatch(row['sourceSha256']) or row['sha256'] != hashlib.sha256(row['text'].encode()).hexdigest():
        raise ValueError('Corrupt corpus hash')
    return row


def load(path):
    rows = [validate(json.loads(line)) for line in path.read_text().splitlines() if line.strip()]
    identities = [(r['courseId'], r['lessonId'], r['locale'], r['sectionId'], r['version']) for r in rows]
    if not rows or len(identities) != len(set(identities)):
        raise ValueError('Empty or duplicate corpus')
    return rows


def request(url, key, method='GET', body=None, extra=None):
    payload = json.dumps(body).encode() if body is not None else None
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key,
               'Content-Type': 'application/json', **(extra or {})}
    req = urllib.request.Request(url, method=method, headers=headers, data=payload)
    with urllib.request.urlopen(req, timeout=60) as res:
        content = res.read()
        return json.loads(content) if content else None


def verify_approved(rows, base, service):
    source_by_lesson = {}
    for row in rows:
        identity = (row['courseId'], row['lessonId'], row['locale'])
        previous = source_by_lesson.setdefault(identity, row['sourceSha256'])
        if previous != row['sourceSha256']:
            raise ValueError('Conflicting source versions for one lesson')
    for (course, lesson, locale), source_sha in source_by_lesson.items():
        params = urllib.parse.urlencode({'select': 'source_sha256,approved',
            'course_id': 'eq.'+course, 'lesson_id': 'eq.'+lesson, 'locale': 'eq.'+locale})
        found = request(base + '/rest/v1/academic_lesson_content?' + params, service)
        if len(found) != 1 or found[0]['approved'] is not True or found[0]['source_sha256'] != source_sha:
            raise ValueError('Unapproved or changed Academic source: ' + lesson + ' ' + locale)


def embed(text, key):
    payload = json.dumps({'model': 'text-embedding-3-small', 'input': text}).encode()
    req = urllib.request.Request('https://api.openai.com/v1/embeddings', method='POST',
        data=payload, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(req, timeout=60) as res:
        result = json.loads(res.read())
    vector = result['data'][0]['embedding']
    if len(vector) != 1536:
        raise ValueError('Unexpected embedding dimension')
    return vector


def apply(rows, base, service, openai):
    verify_approved(rows, base, service)  # No provider calls or writes until every source passes.
    endpoint = base + '/rest/v1/academic_rag_chunks?' + urllib.parse.urlencode({
        'on_conflict': 'course_id,lesson_id,locale,section_id,content_version'})
    for index, row in enumerate(rows, 1):
        body = {'course_id': row['courseId'], 'lesson_id': row['lessonId'],
                'locale': row['locale'], 'section_id': row['sectionId'],
                'content_version': row['version'], 'source_sha256': row['sourceSha256'],
                'content_sha256': row['sha256'], 'content': row['text'],
                'embedding': embed(row['text'], openai)}
        request(endpoint, service, 'POST', body, {'Prefer': 'resolution=merge-duplicates,return=minimal'})
        if index % 20 == 0:
            print(json.dumps({'imported': index, 'total': len(rows)}), flush=True)
    print(json.dumps({'imported': len(rows), 'courseIds': sorted({r['courseId'] for r in rows})}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('corpus', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    rows = load(args.corpus)
    if not args.apply:
        print(json.dumps({'validated': len(rows), 'uploaded': False}))
        return
    base = os.environ['SUPABASE_URL'].rstrip('/')
    service = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    openai = os.environ['OPENAI_API_KEY']
    if not base.startswith('https://') or not service or not openai:
        raise ValueError('Missing trusted server credentials')
    apply(rows, base, service, openai)


if __name__ == '__main__':
    main()
