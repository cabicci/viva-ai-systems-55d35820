"""Recover retained exact-source audio without changing accepted production inputs."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import sys
import wave

from course_media import Bunny, production_plan, reusable, run, write_json
from media_plan import ROOT

FOCUS = 'Preserve meaning and all numbers; natural academic teaching.'
REQUEST = ROOT / 'scripts/academic-education/media-recovery-request.json'


def acceptable(text, seconds):
    return math.isfinite(seconds) and seconds > 0 and 35 <= len(text.split()) * 60 / seconds <= 300


def matching_receipt(source, lesson, locale, plan, fingerprint):
    rows = [json.loads(p.read_text()) for p in source.rglob('receipt.json')]
    if len(rows) != 1:
        raise ValueError('Expected exactly one retained receipt')
    row = rows[0]
    if (row.get('lessonId'), row.get('locale'), row.get('sourceSha256'), row.get('fingerprint')) != (
            lesson, locale, plan['sourceSha256'], fingerprint):
        raise ValueError('Recovery receipt does not match exact source and production identity')
    if row.get('uploaded'):
        raise ValueError('Recovery request must not regenerate an uploaded video')
    return row


def restore_audio(source, audio, names):
    audio.mkdir(parents=True, exist_ok=True)
    restored = 0
    for name in names:
        matches = list(source.rglob(name))
        if len(matches) > 1:
            raise ValueError('Ambiguous retained segment: ' + name)
        if matches:
            if matches[0].is_symlink():
                raise ValueError('Symlink audio rejected')
            shutil.copyfile(matches[0], audio / name)
            restored += 1
    if not restored:
        raise ValueError('No retained audio restored; refusing full regeneration')
    return restored


def join_pcm(parts, output):
    params = None
    frames = []
    for path in parts:
        with wave.open(str(path), 'rb') as stream:
            current = (stream.getnchannels(), stream.getsampwidth(), stream.getframerate(), stream.getcomptype())
            if params is not None and params != current:
                raise ValueError('Split recovery PCM format mismatch')
            params = current
            frames.append(stream.readframes(stream.getnframes()))
    with wave.open(str(output), 'wb') as stream:
        stream.setnchannels(params[0])
        stream.setsampwidth(params[1])
        stream.setframerate(params[2])
        stream.writeframes(b''.join(frames))


def generate_segment(tts, text, target, keys, locale, policy, split_dir):
    try:
        tts._tts(text, 'Charon', FOCUS, str(target), keys, locale, policy)
    except RuntimeError as error:
        # The observed OTHER response has no audio; never bypass an editorial rejection.
        if 'exhausted retries: None' not in str(error) or len(text.split()) < 4:
            raise
        words = text.split()
        midpoint = len(words) // 2
        halves = [' '.join(words[:midpoint]), ' '.join(words[midpoint:])]
        assert ' '.join(halves).split() == words
        split_dir.mkdir(parents=True, exist_ok=True)
        parts = []
        for index, half in enumerate(halves):
            path = split_dir / f'part-{index}.wav'
            tts._tts(half, 'Charon', FOCUS, str(path), keys, locale, policy)
            if not acceptable(half, tts._duration_s(str(path))):
                raise ValueError('Split recovery audio failed original duration gate')
            parts.append(path)
        join_pcm(parts, target)


def recover(lesson, locale, retained):
    request = json.loads(REQUEST.read_text())
    entries = [e for e in request['entries'] if (e['lesson'], e['locale']) == (lesson, locale)]
    if len(entries) != 1:
        raise ValueError('Identity outside failed-only recovery request')
    plan, fingerprint = production_plan(lesson, locale)
    if entries[0].get('fingerprint', fingerprint) != fingerprint:
        raise ValueError('Original production fingerprint changed')
    matching_receipt(retained / 'receipt', lesson, locale, plan, fingerprint)
    bunny = Bunny()
    if reusable(bunny.find(f'academic-course-{lesson}-{locale}-{fingerprint}')):
        run(lesson, locale)
        return
    sys.path.insert(0, str(ROOT / 'experiments/academic/media'))
    from policy import POLICY
    import gemini_tts as tts
    policy = POLICY if locale == 'ar-EG' else None
    tts_locale = None if locale == 'ar-EG' else locale
    work = ROOT / f'tmp/academic-course-media/{lesson}/{locale}/{fingerprint}'
    audio = work / 'audio'
    scenes = plan['scenes']
    names = [tts.segment_cache_name(i, 'Charon', s['spoken'], FOCUS, policy) for i, s in enumerate(scenes)]
    restored = restore_audio(retained / 'audio', audio, names)
    audit = {'lessonId': lesson, 'locale': locale, 'fingerprint': fingerprint,
             'sourceRunId': request['sourceRunId'], 'restoredSegments': restored,
             'retained': [], 'regenerated': [], 'outputListening': 'pending', 'complete': False}
    audit_path = work / 'recovery-audit.json'
    write_json(audit_path, audit)
    keys = None
    for scene, name in zip(scenes, names):
        target = audio / name
        before = hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None
        def valid():
            if not target.exists():
                return False
            try:
                return acceptable(scene['spoken'], tts._duration_s(str(target)))
            except Exception:
                return False
        if valid():
            audit['retained'].append({'sceneId': scene['id'], 'sha256': before})
            continue
        keys = keys or tts._collect_api_keys()
        item = {'sceneId': scene['id'], 'previousSha256': before, 'attempts': 0}
        audit['regenerated'].append(item)
        for attempt in range(1, 4):
            if target.exists():
                archive = work / 'rejected-audio' / f'{attempt}-{name}'
                archive.parent.mkdir(parents=True, exist_ok=True)
                target.replace(archive)
            item['attempts'] = attempt
            write_json(audit_path, audit)
            print(f'Recovering {scene["id"]}, attempt {attempt}/3', flush=True)
            generate_segment(tts, scene['spoken'], target, keys, tts_locale, policy,
                             work / 'split-recovery' / f'{scene["id"]}-{attempt}')
            if valid():
                item['sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
                item['durationSeconds'] = tts._duration_s(str(target))
                break
        else:
            raise ValueError('Recovery still fails original duration gate: ' + scene['id'])
        write_json(audit_path, audit)
    audit['complete'] = True
    write_json(audit_path, audit)
    # The original renderer repeats the same duration check and reuses the restored cache.
    run(lesson, locale)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--lesson', required=True)
    parser.add_argument('--locale', required=True)
    parser.add_argument('--retained', type=Path, required=True)
    args = parser.parse_args()
    recover(args.lesson, args.locale, args.retained)
