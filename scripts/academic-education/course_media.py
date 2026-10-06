"""Resumable, create-only Academic media production; never edits production registries."""
import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from media_plan import ROOT, LOCALES, PILOT, canonical, digest, make_plan, package

REQUEST = ROOT / 'scripts/academic-education/media-request.json'
RENDERER = 'src/academic-course/index.tsx'


def policy_sha():
    paths = ['experiments/academic/media/policy.py', 'experiments/academic/media/vendor/gemini_tts.py',
             'remotion/scripts/lib/locale_profiles.py']
    return digest({p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in paths})


def production_plan(lesson, locale):
    request = json.loads(REQUEST.read_text())
    approval = request['pilotAcceptance']
    if not (approval['accepted'] is True and approval['policySha256'] == policy_sha()
            and approval['ownerDecisionReference'] and set(approval['locales']) == set(LOCALES)):
        raise ValueError('Current voice policy lacks recorded pilot acceptance')
    entries = {(r['lessonId'], r['locale']): r for r in request['entries']}
    if len(entries) != len(request['entries']) or (lesson, locale) not in entries or lesson == PILOT:
        raise ValueError('Identity outside bounded production request')
    plan = make_plan(package(lesson, locale))
    if entries[(lesson, locale)]['sourceSha256'] != plan['sourceSha256']:
        raise ValueError('Source changed; re-review request before generation')
    files = ['scripts/academic-education/media_plan.py', 'scripts/academic-education/course_media.py',
             'remotion/' + RENDERER, 'remotion/bun.lock', 'public/brand/masaarat-logo-lockup.png',
             'src/lib/lesson-visuals/v1/fonts/Tajawal-Regular.woff2',
             'src/lib/lesson-visuals/v1/fonts/Tajawal-Bold.woff2']
    fingerprint = digest({'plan': plan, 'voice': 'Charon', 'policy': policy_sha(),
                          'files': {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in files}})
    return plan, fingerprint


def frame_durations(durations, gap=.5, fps=30):
    frames, elapsed, previous = [], 0., 0
    for i, duration in enumerate(durations):
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError('Invalid audio duration')
        elapsed += duration + (gap if i < len(durations)-1 else 0)
        boundary = round(elapsed * fps)
        frames.append(boundary - previous)
        previous = boundary
    return frames


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)


class Bunny:
    def __init__(self):
        self.library = os.environ['BUNNY_STREAM_LIBRARY_ID']
        self.key = os.environ['BUNNY_STREAM_API_KEY']
        if not self.library.isdigit():
            raise ValueError('Invalid library identity')
        self.base = f'https://video.bunnycdn.com/library/{self.library}/videos'

    def request(self, method, suffix='', data=None, binary=False):
        body = data if binary else json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(self.base + suffix, data=body, method=method,
            headers={'AccessKey': self.key, 'accept': 'application/json',
                     'Content-Type': 'application/octet-stream' if binary else 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=600 if binary else 60) as response:
                raw = response.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            raise RuntimeError(f'Bunny {method} failed with HTTP {error.code}; no secret/body logged') from None

    def find(self, title):
        result = self.request('GET', '?' + urllib.parse.urlencode({'search': title, 'itemsPerPage': 100}))
        matches = [v for v in result.get('items', []) if v.get('title') == title]
        if len(matches) > 1:
            raise ValueError('Duplicate exact media identities require review')
        return matches[0] if matches else None


def reusable(meta):
    if meta is None:
        return False
    if meta.get('status') in (0, 5, 6):
        raise ValueError('Existing incomplete/error upload preserved; do not generate a duplicate')
    return True


def ready(bunny, guid, receipt, receipt_path):
    for attempt in range(20):
        meta = bunny.request('GET', '/' + guid)
        receipt.update(videoId=guid, provider='bunny', providerStatus=meta.get('status'),
                       playbackReady=False, checkedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        if meta.get('status') == 4 and (meta.get('length') or 0) > 0:
            receipt.update(playbackReady=True, durationSeconds=meta['length'],
                embedUrl=f'https://iframe.mediadelivery.net/embed/{bunny.library}/{guid}?autoplay=false&preload=false')
            write_json(receipt_path, receipt)
            return
        write_json(receipt_path, receipt)
        if meta.get('status') in (5, 6):
            raise RuntimeError('Bunny processing failed; identity retained')
        if attempt < 19:
            time.sleep(15)
    # Upload remains successful; collection can recheck processing without render/TTS.
    receipt['processingPending'] = True
    write_json(receipt_path, receipt)


def render(plan, fingerprint, work):
    sys.path.insert(0, str(ROOT / 'experiments/academic/media'))
    from policy import POLICY
    from gemini_tts import synthesize_segments
    scenes = plan['scenes']
    locale = plan['locale']
    durations = synthesize_segments(
        [(i, 'Charon', s['spoken'], 'Preserve meaning and all numbers; natural academic teaching.')
         for i, s in enumerate(scenes)], str(work / 'audio'), str(work / 'audio/master.mp3'),
        locale=None if locale == 'ar-EG' else locale,
        narration_policy=POLICY if locale == 'ar-EG' else None)
    # Flag severe missing/repeated output before upload; this is not listening acceptance.
    for scene, duration in zip(scenes, durations):
        rate = len(scene['spoken'].split()) * 60 / duration
        if not (35 <= rate <= 300):
            raise ValueError(f'Audio length anomaly in {scene["id"]}; review retained segment')
    props = dict(plan, sceneFrames=frame_durations(durations))
    write_json(work / 'props.json', props)
    (work / 'transcript.txt').write_text('\n\n'.join(s['spoken'] for s in scenes))
    timeline, elapsed = [], 0.
    for i, (scene, duration) in enumerate(zip(scenes, durations)):
        timeline.append({'sceneId': scene['id'], 'startSeconds': elapsed,
                         'endSeconds': elapsed + duration, 'spoken': scene['spoken']})
        elapsed += duration + (.5 if i < len(durations)-1 else 0)
    write_json(work / 'listening-timeline.json', timeline)
    silent, output = work / 'silent.mp4', work / 'lesson.mp4'
    subprocess.run(['npx', '--no-install', 'remotion', 'render', RENDERER, 'academic-course', str(silent),
                    '--props', str(work / 'props.json'), '--codec=h264', '--crf=20', '--concurrency=2'],
                   cwd=ROOT / 'remotion', check=True)
    subprocess.run(['ffmpeg', '-y', '-i', str(silent), '-i', str(work / 'audio/master.mp3'),
        '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', str(output)], check=True, capture_output=True)
    meta = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams',
                                              '-show_format', '-of', 'json', str(output)]))
    streams = {s['codec_type']: s for s in meta['streams']}
    if not {'video', 'audio'}.issubset(streams) or streams['video']['width'] != 1920:
        raise ValueError('Invalid audio/video streams')
    if abs(float(meta['format']['duration']) - elapsed) > .25:
        raise ValueError('Mux timeline drift; preserve output for repair')
    return {'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
            'durationSeconds': float(meta['format']['duration']), 'generated': True}


def run(lesson, locale, preview=False):
    plan, fingerprint = production_plan(lesson, locale)
    work = ROOT / f'tmp/academic-course-media/{lesson}/{locale}/{fingerprint}'
    work.mkdir(parents=True, exist_ok=True)
    if preview:
        samples = [plan['scenes'][0], next(s for s in plan['scenes'] if s.get('cells')),
                   max(plan['scenes'], key=lambda s: len(s['display']))]
        for i, sample in enumerate(samples):
            props_path = work / f'preview-{i}.json'
            write_json(props_path, dict(plan, scenes=[sample], sceneFrames=[120]))
            subprocess.run(['npx', '--no-install', 'remotion', 'still', RENDERER, 'academic-course',
                str(work / f'preview-{i}.png'), '--props', str(props_path), '--frame=45'],
                cwd=ROOT / 'remotion', check=True)
        return
    receipt_path = work / 'receipt.json'
    receipt = {'lessonId': lesson, 'locale': locale, 'sourceSha256': plan['sourceSha256'],
        'fingerprint': fingerprint, 'pilotVoiceAccepted': True, 'outputListening': 'pending',
        'generated': False, 'uploaded': False, 'playbackReady': False,
        'productionActivated': False, 'commit': os.environ.get('GITHUB_SHA')}
    write_json(receipt_path, receipt)
    bunny = Bunny()
    title = f'academic-course-{lesson}-{locale}-{fingerprint}'
    existing = bunny.find(title)
    if reusable(existing):
        receipt.update(videoId=existing['guid'], uploaded=True, reusedExisting=True)
        ready(bunny, existing['guid'], receipt, receipt_path)
        return
    receipt.update(render(plan, fingerprint, work))
    write_json(receipt_path, receipt)
    # Reread after expensive generation; never create a second exact identity.
    existing = bunny.find(title)
    if reusable(existing):
        guid = existing['guid']
        receipt['reusedExisting'] = True
    else:
        guid = bunny.request('POST', data={'title': title})['guid']
        receipt['videoId'] = guid
        write_json(receipt_path, receipt)
        bunny.request('PUT', '/' + guid, (work / 'lesson.mp4').read_bytes(), binary=True)
    receipt.update(videoId=guid, uploaded=True)
    write_json(receipt_path, receipt)
    ready(bunny, guid, receipt, receipt_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--lesson', required=True)
    parser.add_argument('--locale', required=True, choices=LOCALES)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    run(args.lesson, args.locale, args.preview)
