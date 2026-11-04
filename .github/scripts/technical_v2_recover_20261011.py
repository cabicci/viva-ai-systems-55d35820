"""Resume four preserved Technical cells; never render, TTS, upload or query cloud."""
import base64
import datetime as dt
import json
import os
import re
import struct
import time
import urllib.error
import urllib.request
import uuid
import zlib

REPO = 'cabicci/viva-ai-systems-55d35820'
BRANCH = 'review/cabinet-ai-style-20261010'
SOURCE = 'fa66ec6500a4f2aab1db8b9fe0c838b2a97c305b'
RUN = 38092701309
BATCH = 'technical-motion-v2-20261011'
LIBRARY = 670679
COLLECTION = '4972720c-4dd7-48e6-b341-34e3b4875b26'
PREFIX = 'docs/production/technical-v2'
CELLS = [('M16-L01', 'ar-MSA', 11696434971),
         ('M19-L01', 'ar-MSA', 11699368524),
         ('M19-L02', 'ar-MSA', 11699228874),
         ('M21-L02', 'ar-EG', 11701237752)]
FIELDS = ('batchId', 'lessonId', 'locale', 'oldGuid', 'newGuid', 'sourceHash',
          'videoSha256', 'audioSha256', 'backupSha256', 'backupArtifactId',
          'backupRunId', 'sourceCommit')

def require(ok, reason):
    if not ok:
        raise RuntimeError(reason)

def request(url, method='GET', data=None, headers=None):
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(url, body, headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read()
        return json.loads(raw) if raw else {}

def gh(path, method='GET', data=None):
    return request('https://api.github.com/repos/' + REPO + path, method, data,
                   {'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN'],
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'})

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def artifact_url(artifact_id):
    req = urllib.request.Request(
        f'https://api.github.com/repos/{REPO}/actions/artifacts/{artifact_id}/zip',
        headers={'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN']})
    try:
        urllib.request.build_opener(NoRedirect()).open(req, timeout=60)
    except urllib.error.HTTPError as exc:
        require(exc.code == 302, f'Artifact redirect HTTP {exc.code}')
        url = exc.headers['Location']
        require(url.startswith('https://'), 'Artifact redirect must be HTTPS')
        return url
    raise RuntimeError('Artifact did not redirect')

def read_receipt_only(url, total, cell):
    """Range-read ZIP directory and one JSON member. No audio/video bytes read."""
    def read_at(start, size):
        require(0 <= start < total and 0 < size <= 131072 and start + size <= total,
                'Unexpected ZIP range')
        req = urllib.request.Request(url, headers={
            'Range': f'bytes={start}-{start + size - 1}'})
        with urllib.request.urlopen(req, timeout=60) as response:
            require(response.status == 206, 'Range unsupported; no full archive download')
            require(response.headers.get('Content-Range', '').startswith(
                f'bytes {start}-{start + size - 1}/'), 'Incorrect byte range')
            raw = response.read(size + 1)
        require(len(raw) == size, 'Truncated ZIP range')
        return raw

    end = read_at(total - 22, 22)
    fields = struct.unpack('<4s4H2IH', end)
    require(fields[0] == b'PK\x05\x06' and fields[1:3] == (0, 0)
            and fields[3] == fields[4] and fields[7] == 0, 'Unsupported ZIP footer')
    directory = read_at(fields[6], fields[5])
    pos, matches = 0, []
    while pos < len(directory):
        row = struct.unpack_from('<4s6H3I5H2I', directory, pos)
        require(row[0] == b'PK\x01\x02', 'Invalid ZIP directory')
        flags, method, crc, compressed, expanded = row[3], row[4], row[7], row[8], row[9]
        name_len, extra_len, comment_len, offset = row[10], row[11], row[12], row[16]
        name = directory[pos + 46:pos + 46 + name_len].decode('utf-8')
        if name in (f'technical-v2-output/{cell}/receipt.json', f'{cell}/receipt.json'):
            require(not flags & 1 and method in (0, 8) and expanded < 65536,
                    'Unsafe receipt entry')
            matches.append((offset, compressed, expanded, crc, method))
        pos += 46 + name_len + extra_len + comment_len
    require(len(matches) == 1, f'{cell}: exact saved receipt missing or ambiguous')
    offset, compressed, expanded, crc, method = matches[0]
    local = struct.unpack('<4s5H3I2H', read_at(offset, 30))
    require(local[0] == b'PK\x03\x04', 'Invalid local ZIP header')
    raw = read_at(offset + 30 + local[9] + local[10], compressed)
    raw = zlib.decompress(raw, -15) if method == 8 else raw
    require(len(raw) == expanded and zlib.crc32(raw) & 0xffffffff == crc,
            'Saved receipt CRC mismatch')
    return json.loads(raw)

def artifact(artifact_id, name):
    a = gh(f'/actions/artifacts/{artifact_id}')
    w = a['workflow_run']
    require(a['id'] == artifact_id and a['name'] == name and not a['expired']
            and a['size_in_bytes'] > 0 and w['id'] == RUN
            and w['repository_id'] == 1272666418
            and w['head_repository_id'] == 1272666418
            and w['head_sha'] == SOURCE and w['head_branch'] == BRANCH,
            'Artifact provenance mismatch')
    return a

def valid_receipt(r, lesson, locale, old):
    require(r['batchId'] == BATCH and r['lessonId'] == lesson and r['locale'] == locale
            and r['sourceCommit'] == SOURCE and str(r['backupRunId']) == str(RUN)
            and r['oldGuid'] == old['video_guid'] and r['sourceHash'] == old['source_sha256'],
            'Saved receipt identity mismatch')
    require(str(uuid.UUID(r['newGuid'])) == r['newGuid'] and r['newGuid'] != r['oldGuid'],
            'Invalid replacement identity')
    require(r['newTts'] is (locale == 'ar-EG') and r['durationSeconds'] > 0,
            'Saved receipt timing/TTS mismatch')
    require(all(re.fullmatch('[0-9a-fA-F]{64}', r[k]) for k in
                ('sourceHash', 'videoSha256', 'audioSha256', 'backupSha256')),
            'Saved hash missing')
    require(str(r['backupArtifactId']).isdigit(), 'Backup artifact ID missing')

def bunny(guid, method='GET'):
    require(method in ('GET', 'DELETE'), 'Recovery cannot create or upload media')
    return request(f'https://video.bunnycdn.com/library/{LIBRARY}/videos/{guid}', method,
                   headers={'AccessKey': os.environ['BUNNY_STREAM_API_KEY']})

def check_playable(r):
    p = request(f'https://video.bunnycdn.com/library/{LIBRARY}/videos/{r["newGuid"]}/play',
                headers={'Referer': 'https://masaarat.ai/'})
    v = p.get('video', {})
    require(p.get('isPlayable') is True and v.get('guid') == r['newGuid']
            and v.get('videoLibraryId') == LIBRARY and v.get('status') == 4
            and v.get('width') == 1920 and v.get('height') == 1080
            and v.get('title') == f'{BATCH}:{r["lessonId"]}__{r["locale"]}'
            and abs(v.get('length', -100) - r['durationSeconds']) <= 2,
            f'{r["lessonId"]}/{r["locale"]}: replacement not verified playable')

def path(r, kind):
    return f'{PREFIX}/{kind}/{r["lessonId"]}__{r["locale"]}.json'

def get_file(p, ref=BRANCH):
    from urllib.parse import quote
    try:
        data = gh('/contents/' + p + '?ref=' + quote(ref, safe=''))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    return json.loads(base64.b64decode(data['content']))

def valid_ack(r, ack):
    return (ack is not None and ack.get('status') == 'linked'
            and ack.get('cloudReadbackVerified') is True
            and all(ack.get(k) == r.get(k) for k in FIELDS))

def commit_files(files, message):
    for _ in range(8):
        head = gh('/git/ref/heads/' + BRANCH)['object']['sha']
        remaining = {}
        for p, data in files.items():
            existing = get_file(p, head)
            require(existing is None or existing == data, f'Conflicting receipt: {p}')
            if existing is None:
                remaining[p] = data
        if not remaining:
            return
        tree = gh('/git/commits/' + head)['tree']['sha']
        entries = [{'path': p, 'mode': '100644', 'type': 'blob',
                    'content': json.dumps(v, ensure_ascii=False, indent=2) + '\n'}
                   for p, v in remaining.items()]
        newtree = gh('/git/trees', 'POST', {'base_tree': tree, 'tree': entries})['sha']
        commit = gh('/git/commits', 'POST', {'message': message,
                    'tree': newtree, 'parents': [head]})['sha']
        # Fast-forward only. Concurrent unrelated commits are never reset.
        if gh('/git/ref/heads/' + BRANCH)['object']['sha'] != head:
            continue
        try:
            gh('/git/refs/heads/' + BRANCH, 'PATCH', {'sha': commit, 'force': False})
            print(json.dumps({'receiptCommit': commit, 'paths': list(remaining)}), flush=True)
            return
        except urllib.error.HTTPError as exc:
            if exc.code not in (409, 422):
                raise
    raise RuntimeError('Receipt branch remained busy; nothing overwritten')

def main():
    require(os.environ.get('GITHUB_REPOSITORY') == REPO
            and os.environ.get('GITHUB_REF') == 'refs/heads/' + BRANCH,
            'Wrong recovery scope')
    require(dt.datetime.now(dt.timezone.utc) < dt.datetime(2026, 10, 12, 22, 46, 59,
                                                        tzinfo=dt.timezone.utc),
            'Original authorization expired')
    run = gh(f'/actions/runs/{RUN}')
    require(run['repository']['full_name'] == REPO and run['head_sha'] == SOURCE
            and run['head_branch'] == BRANCH and run['event'] == 'push'
            and run['path'] == '.github/workflows/technical-motion-v2.yml',
            'Original producer run identity mismatch')
    rows = get_file(PREFIX + '/baseline.json', SOURCE)['rows']
    require(len(rows) == 320 and len({(r['lesson_id'], r['locale']) for r in rows}) == 320
            and len({r['video_guid'] for r in rows}) == 320, 'Invalid source baseline')
    pending, ready_files = [], {}
    for lesson, locale, aid in CELLS:
        cell = lesson + '__' + locale
        a = artifact(aid, f'technical-v2-receipts-{lesson}-{RUN}')
        r = read_receipt_only(artifact_url(aid), a['size_in_bytes'], cell)
        old = next(x for x in rows if x['lesson_id'] == lesson and x['locale'] == locale)
        valid_receipt(r, lesson, locale, old)
        artifact(int(r['backupArtifactId']), f'technical-v2-backup-{lesson}-{locale}-{RUN}')
        check_playable(r)
        done = get_file(path(r, 'done'))
        if done is not None:
            require(all(done.get(k) == r.get(k) for k in FIELDS)
                    and done.get('status') == 'linked-old-deleted'
                    and done.get('oldVideoRetained') is False, 'Existing done conflict')
            continue
        existing = get_file(path(r, 'ready'))
        if existing is not None:
            require(all(existing.get(k) == r.get(k) for k in FIELDS), 'Existing ready conflict')
            r = existing
        else:
            r['status'] = 'ready'
            ready_files[path(r, 'ready')] = r
        pending.append(r)
        print(json.dumps({'cell': cell, 'newGuid': r['newGuid'], 'evidence': 'verified'}), flush=True)
    commit_files(ready_files, 'media(technical): resume three preserved ready receipts [skip ci]')
    print('READY_FOR_CLOUD_COORDINATOR', flush=True)
    deadline = time.monotonic() + 2400
    while pending and time.monotonic() < deadline:
        for r in pending[:]:
            ack = get_file(path(r, 'ack'))
            if ack is None:
                continue
            require(valid_ack(r, ack), 'Cloud acknowledgement conflict')
            check_playable(r)
            try:
                old = bunny(r['oldGuid'])
            except urllib.error.HTTPError as exc:
                require(exc.code == 404, 'Original identity lookup failed')
                old = None
            if old is not None:
                require(old.get('guid') == r['oldGuid'] and old.get('videoLibraryId') == LIBRARY
                        and old.get('collectionId') == COLLECTION, 'Original deletion identity mismatch')
                result = bunny(r['oldGuid'], 'DELETE')
                require(result.get('success') is True, 'Original deletion not confirmed')
            try:
                bunny(r['oldGuid'])
            except urllib.error.HTTPError as exc:
                require(exc.code == 404, 'Original absence unverified')
            else:
                raise RuntimeError('Original still present')
            finished = dict(r, status='linked-old-deleted', oldVideoRetained=False,
                            mappingReceipt=ack)
            commit_files({path(r, 'done'): finished},
                         f'media(technical): recovered done {r["lessonId"]} {r["locale"]} [skip ci]')
            pending.remove(r)
            print(json.dumps({'cell': r['lessonId'] + '__' + r['locale'],
                              'status': 'linked-old-deleted'}), flush=True)
        if pending:
            time.sleep(20)
    require(not pending, 'Cloud acknowledgement pending; preserved uploaded videos and receipts')

if __name__ == '__main__':
    main()
