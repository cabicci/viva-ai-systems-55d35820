"""Bounded course-media engine. Nothing here deploys, indexes, or uploads.

All provider calls run only via `produce` with a verified request snapshot.
The Python standard library is sufficient; rendering uses the pinned repo Remotion.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.request
import wave

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
OUT = ROOT / 'output'
LOCALES = tuple(json.loads((ROOT / 'course/manifest.json').read_text(encoding='utf-8'))['locales'])
STYLE = {
    'ar-EG': 'اقرأ بالمصري القاهري الطبيعي، مش فصحى ولا خليجي. ج زي G في gold وق همزة لما يكون طبيعي. شرح واضح وهادي لطلبة تعليم فني زراعي. اقرأ النص فقط من غير مقدمة أو تعليق.',
    'en': 'Read in clear natural English, as a calm agricultural vocational instructor. Moderate pace. Read the exact text only; do not add an introduction or commentary.',
    'it': 'Leggi in italiano naturale e chiaro, come un formatore agrario paziente. Ritmo moderato. Leggi soltanto il testo esatto, senza introduzioni o commenti.',
    'de': 'Lies in natürlichem, klarem Deutsch wie eine geduldige Lehrkraft im Agrarbereich. Mittleres Tempo. Lies nur den genauen Text ohne Einleitung oder Kommentare.',
}

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def content(locale):
    return read(ROOT / 'course' / f'{locale}.json')

def engine_hash():
    paths = ['experiments/course-pipeline/pipeline.py', 'remotion/src/course-pipeline/index.tsx',
             'experiments/course-pipeline/src/Diagram.tsx', 'remotion/bun.lock', 'src/assets/fonts/Cairo.ttf',
             'public/brand/masaarat-logo-lockup.png']
    hashes={p: hashlib.sha256((REPO / p).read_bytes()).hexdigest() for p in paths}
    for path in [ROOT/'generate_visuals.py',ROOT/'course/visuals.json']:
        if path.exists(): hashes[str(path.relative_to(ROOT))]=hashlib.sha256(path.read_bytes()).hexdigest()
    return digest(hashes)

def materialize_visuals():
    plan_path=ROOT/'course/visuals.json'
    if not plan_path.exists(): return {}, {}
    plan=read(plan_path)
    source=OUT/'visuals'
    receipt=read(source/'receipt.json')
    assert receipt.get('generated') and receipt.get('provider')=='gemini', 'Gemini visual generation is incomplete'
    assert receipt['planHash']==digest(plan), 'Visuals were generated for a different plan'
    target=REPO/'remotion/public/course-pipeline'
    target.mkdir(parents=True,exist_ok=True)
    mapping,hashes={},{}
    for asset in receipt['assets']:
        file=source/asset['filename']
        actual=hashlib.sha256(file.read_bytes()).hexdigest()
        assert actual==asset['sha256'], 'Visual asset integrity mismatch'
        shutil.copyfile(file,target/asset['filename'])
        hashes[asset['id']]=actual
        for scene in asset['scenes']:mapping[scene]=f'course-pipeline/{asset["filename"]}'
    return mapping,hashes

def snapshot():
    return {'manifest': digest(read(ROOT / 'course/manifest.json')),
            'content': {loc: digest(content(loc)) for loc in LOCALES}, 'engine': engine_hash()}

def validate():
    manifest = read(ROOT / 'course/manifest.json')
    assert manifest['locales'] == list(LOCALES), 'Unexpected locale scope'
    assert LOCALES and len(set(LOCALES)) == len(LOCALES) and set(LOCALES) <= set(STYLE), 'Unsupported or duplicate locale'
    assert manifest['mode'] in ('technical','academic'), 'Unknown learning mode'
    assert manifest['production'] == {'uploadToBunny': False, 'modifyPlatform': False, 'modifyDatabase': False}
    expected_ids = [s['id'] for s in content(LOCALES[0])['scenes']]
    assert expected_ids and len(set(expected_ids)) == len(expected_ids), 'Missing or duplicate scenes'
    structures = []
    for loc in LOCALES:
        data = content(loc)
        assert data['locale'] == loc and data['lessonId'] == manifest['lessonId']
        assert data['dir'] == ('rtl' if loc == 'ar-EG' else 'ltr')
        assert [s['id'] for s in data['scenes']] == expected_ids
        assert data['quiz'] and data['glossary'] and data['faq'], 'Missing learning components'
        if manifest['mode'] == 'technical':
            assert data['checklist'], 'Technical courses need observed performance criteria'
        assert all(q['answer'] in range(len(q['options'])) for q in data['quiz'])
        for scene in data['scenes']:
            assert all(scene.get(k) for k in ('id','title','lead','example','takeaway','labels','narration','caption'))
            assert scene['caption'] == scene['narration'], 'Captions must preserve spoken wording'
            assert len(scene['narration'].split()) >= 25, 'Unfinished narration'
        public = json.dumps(data, ensure_ascii=False)
        assert not re.search(r'spark|international\s+school|المدرسة|سبارك', public, re.I), 'Source branding leaked'
        if loc != 'ar-EG':
            assert not re.search('[\u0600-\u06ff]', public), 'Arabic leaked into another locale'
        structures.append((sorted(data['ui']), [s['id'] for s in data['scenes']],len(data['quiz']),len(data['glossary']),len(data['faq']),len(data.get('checklist',[]))))
    assert all(x == structures[0] for x in structures), 'Incomplete localization'
    return {'status': 'passed', 'locales': list(LOCALES), 'scenes': len(expected_ids)*len(LOCALES), 'questions': len(content(LOCALES[0])['quiz'])*len(LOCALES)}

def audio_key(scene, locale, media):
    # Visual-only changes do not invalidate narration.
    return digest({'text': scene['narration'], 'locale': locale, 'style': STYLE[locale],
                   'model': media['model'], 'voice': media['voice'], 'format': 'pcm-s16le-24000-mono-v1'})

def plan():
    validate()
    manifest = read(ROOT / 'course/manifest.json')
    result = []
    for loc in LOCALES:
        lesson = content(loc)
        result.append({'lesson': lesson['lessonId'], 'locale': loc, 'source': manifest['source']['sha256'],
                       'textHash': digest(lesson), 'audioKeys': [audio_key(s, loc, manifest['media']) for s in lesson['scenes']],
                       'renderHash': digest({'engine': engine_hash(), 'lesson': lesson, 'media': manifest['media']}),
                       'status': 'planned', 'ownerAccepted': False})
    return result

def request_json(url, key, payload=None):
    req = urllib.request.Request(url, data=json.dumps(payload, ensure_ascii=False).encode() if payload else None,
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        # Never echo provider URLs, payloads or credentials into logs.
        try:
            detail=json.loads(e.read()).get('error',{}).get('message','').replace(key,'[redacted]')[:350]
        except (ValueError,AttributeError):
            detail=''
        raise ProviderError(e.code, e.headers.get('Retry-After'),detail) from None

class ProviderError(Exception):
    def __init__(self, status, retry_after=None, detail=''):
        self.status = status
        self.retry_after = retry_after
        super().__init__(f'Provider returned HTTP {status}; request text was not changed. {detail}')

def valid_wav(path):
    try:
        with wave.open(str(path), 'rb') as wav:
            return wav.getnchannels() == 1 and wav.getsampwidth() == 2 and wav.getframerate() == 24000 and wav.getnframes() >= 24000
    except (OSError, EOFError, wave.Error):
        return False

def synthesize(scene, locale, media, key, path):
    if valid_wav(path):
        return 'reused'
    # Preserve the established model/voice. An unavailable model stops the cell.
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{media["model"]}:generateContent'
    payload = {'contents': [{'parts': [{'text': STYLE[locale] + '\n\n' + scene['narration']}]}],
               'generationConfig': {'responseModalities': ['AUDIO'], 'speechConfig': {
                   'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': media['voice']}}}}}
    for attempt in range(media['maxAttempts']):
        try:
            response = request_json(url, key, payload)
            parts = ((response.get('candidates') or [{}])[0].get('content') or {}).get('parts', [])
            inline = next((p['inlineData'] for p in parts if 'inlineData' in p), None)
            if not inline:
                raise RuntimeError('Provider returned no audio. Text has not been rewritten; inspect the cell before retrying.')
            data = base64.b64decode(inline['data'], validate=True)
            mime = inline.get('mimeType', '')
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix('.partial.wav')
            if data.startswith(b'RIFF'):
                tmp.write_bytes(data)
            else:
                assert 'audio/L16' in mime and ('rate=24000' in mime), f'Unsupported PCM format: {mime}'
                assert len(data) % 2 == 0, 'Truncated PCM'
                with wave.open(str(tmp), 'wb') as wav:
                    wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                    wav.writeframes(data)
            assert valid_wav(tmp), 'Invalid or empty provider audio'
            tmp.replace(path)
            return 'generated'
        except ProviderError as e:
            if e.status not in (429, 500, 502, 503, 504) or attempt + 1 == media['maxAttempts']:
                raise
            retry = float(e.retry_after) if e.retry_after and e.retry_after.isdigit() else 30 * (attempt + 1)
            time.sleep(min(retry, 60))
    raise RuntimeError('Audio attempts exhausted')

def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'

def assemble(lesson, media, folder, visual_mapping=None):
    fps = media['fps']
    scenes, cues, cursor = [], [], 0
    with wave.open(str(folder / 'master.wav'), 'wb') as master:
        master.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
        for scene in lesson['scenes']:
            path = folder / 'audio' / (audio_key(scene, lesson['locale'], media) + '.wav')
            with wave.open(str(path), 'rb') as audio:
                samples = audio.getnframes()
                pcm = audio.readframes(samples)
            duration = math.ceil((samples / 24000 + 0.6) * fps)
            padded_samples = duration * 24000 // fps
            master.writeframes(pcm + bytes((padded_samples - samples) * 2))
            scenes.append({**scene, 'startFrame': cursor, 'durationInFrames': duration})
            # Scene-aligned sentence timing is proportional, not forced word alignment.
            chunks = re.split(r'(?<=[.!?؟。])\s+', scene['caption'])
            total = sum(len(x) for x in chunks)
            pos = cursor / fps
            for chunk in chunks:
                end = pos + samples / 24000 * len(chunk) / total
                cues.append(f'{stamp(pos)} --> {stamp(end)}\n{chunk}\n')
                pos = end
            cursor += duration
    (folder / 'captions.vtt').write_text('WEBVTT\n\n' + '\n'.join(cues), encoding='utf-8')
    (folder / 'transcript.txt').write_text('\n\n'.join(s['narration'] for s in scenes), encoding='utf-8')
    props = {'locale': lesson['locale'], 'dir': lesson['dir'], 'title': lesson['subtitle'], 'visuals':visual_mapping or {},
             'eyebrow': lesson['eyebrow'], 'scenes': scenes, 'durationInFrames': cursor}
    write(folder / 'props.json', props)
    return props

def run(command, **kwargs):
    subprocess.run([str(c) for c in command], check=True, **kwargs)

def verify_media(folder, expected_seconds):
    result = subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(folder / 'lesson.mp4')])
    data = json.loads(result)
    video = next(s for s in data['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in data['streams'] if s['codec_type'] == 'audio')
    assert (video['width'], video['height']) == (1920,1080)
    assert video['codec_name'] == 'h264' and audio['codec_name'] == 'aac'
    assert abs(float(data['format']['duration']) - expected_seconds) < 0.2
    return {'video': 'h264', 'audio': 'aac', 'width':1920,'height':1080,
            'durationSeconds': float(data['format']['duration']), 'sha256': hashlib.sha256((folder / 'lesson.mp4').read_bytes()).hexdigest()}

def produce(locale, reuse_audio_only=False, request_file=None):
    validate()
    request = read(request_file or ROOT / 'pilot-request.json')
    assert request['snapshot'] == snapshot(), 'Authorized request does not match current source/renderer'
    assert request['locales'] == list(LOCALES) and request['lessonId'] == read(ROOT/'course/manifest.json')['lessonId']
    assert request['action'] == 'generate-preview-only'
    folder = OUT / locale
    folder.mkdir(parents=True, exist_ok=True)
    manifest = read(ROOT / 'course/manifest.json')
    lesson, media = content(locale), manifest['media']
    visual_mapping,visual_hashes=materialize_visuals()
    render_key = digest({'content': lesson, 'engine': engine_hash(), 'media': media,
                         'visuals':visual_hashes,
                         'audioKeys': [audio_key(s, locale, media) for s in lesson['scenes']]})
    previous = read(folder/'receipt.json') if (folder/'receipt.json').exists() else {}
    if previous.get('generated') and previous.get('renderKey') == render_key and (folder/'lesson.mp4').exists():
        actual = hashlib.sha256((folder/'lesson.mp4').read_bytes()).hexdigest()
        if actual == previous.get('verification',{}).get('sha256'):
            print(json.dumps({'locale':locale,'status':'reused-verified-render'}))
            return
    keys = [os.environ.get('GEMINI_API_KEY')] + [os.environ.get(f'GEMINI_API_KEY_{i}') for i in range(1,4)]
    key = next((k for k in keys if k), None)
    receipt = {'lessonId': lesson['lessonId'], 'locale': locale, 'snapshot': request['snapshot'],
               'renderKey': render_key,
               'visualAssetHashes':visual_hashes,
               'generated': False, 'ownerAccepted': False, 'listeningReviewed': False, 'uploaded': False,
               'mapped': False, 'published': False, 'captionTiming': 'scene-aligned, proportional sentence timings',
               'audio': [], 'stage': 'started'}
    write(folder / 'receipt.json', receipt)
    try:
        missing = any(not valid_wav(folder/'audio'/(audio_key(s,locale,media)+'.wav')) for s in lesson['scenes'])
        assert not (reuse_audio_only and missing), 'Required cached narration is missing; audio regeneration is disabled'
        if missing:
            assert key, 'GEMINI_API_KEY is required for missing audio; no key was found'
            model = request_json(f'https://generativelanguage.googleapis.com/v1beta/models/{media["model"]}', key)
            assert 'generateContent' in model.get('supportedGenerationMethods', []), 'TTS model unavailable'
        for i, scene in enumerate(lesson['scenes']):
            path = folder / 'audio' / (audio_key(scene, locale, media) + '.wav')
            status = synthesize(scene, locale, media, key, path)
            receipt['audio'].append({'scene':scene['id'],'key':path.stem,'status':status})
            receipt['stage'] = 'audio'
            write(folder / 'receipt.json', receipt)
            print(f'{locale} {scene["id"]}: {status}', flush=True)
            if status == 'generated' and i < len(lesson['scenes']) - 1:
                time.sleep(media['requestGapSeconds'])
        props = assemble(lesson, media, folder, visual_mapping)
        font_dest = REPO / 'remotion/public/course-pipeline'
        font_dest.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(REPO/'src/assets/fonts/Cairo.ttf', font_dest/'Cairo.ttf')
        shutil.copyfile(REPO/'public/brand/masaarat-logo-lockup.png', font_dest/'logo.png')
        receipt['stage'] = 'render'
        write(folder / 'receipt.json', receipt)
        run(['bun','x','remotion','render','src/course-pipeline/index.tsx','CoursePilot',
             folder/'silent.mp4','--props',folder/'props.json','--codec','h264','--crf','20','--concurrency','2'],cwd=REPO/'remotion')
        run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',folder/'silent.mp4','-i',folder/'master.wav',
             '-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',folder/'lesson.mp4'])
        receipt['verification'] = verify_media(folder, props['durationInFrames']/media['fps'])
        receipt['generated'] = True
        receipt['stage'] = 'ready-for-owner-review'
        write(folder / 'receipt.json', receipt)
        print(json.dumps({'locale':locale,'status':receipt['stage'],'seconds':receipt['verification']['durationSeconds']}))
    except Exception as error:
        receipt['stage'] = 'failed'
        receipt['error'] = str(error)[:300]
        write(folder / 'receipt.json', receipt)
        raise

def main():
    global ROOT, OUT, LOCALES
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['validate','plan','snapshot','request','produce','preview'])
    parser.add_argument('--locale', choices=tuple(STYLE))
    parser.add_argument('--package', type=Path, default=ROOT, help='Course package containing course/manifest.json and locale JSON files')
    parser.add_argument('--batch-id', help='Unique owner-authorized batch identifier, required for request')
    parser.add_argument('--reuse-audio-only', action='store_true', help='Refuse any new speech generation')
    parser.add_argument('--request-file', type=Path, help='Explicit immutable request for this render')
    args = parser.parse_args()
    ROOT = args.package.resolve()
    OUT = ROOT/'output'
    LOCALES = tuple(read(ROOT/'course/manifest.json')['locales'])
    if args.command == 'validate': print(json.dumps(validate()))
    elif args.command == 'plan': print(json.dumps(plan(), ensure_ascii=False, indent=2))
    elif args.command == 'snapshot': print(json.dumps(snapshot(), indent=2))
    elif args.command == 'request':
        assert args.batch_id, '--batch-id is required'
        validate()
        write(ROOT/'pilot-request.json', {'batchId':args.batch_id,'lessonId':read(ROOT/'course/manifest.json')['lessonId'],
                                         'locales':list(LOCALES),'action':'generate-preview-only','snapshot':snapshot()})
        print('Created bounded request from this exact course package.')
    elif args.command == 'produce':
        assert args.locale in LOCALES, '--locale must be in the course manifest'
        produce(args.locale, args.reuse_audio_only, args.request_file)
    elif args.command == 'preview':
        # Copy only rendered student media; receipts/answers never enter the media directory.
        available = []
        for locale in LOCALES:
            src, dest = OUT/locale, ROOT/'public/media'/locale
            dest.mkdir(parents=True, exist_ok=True)
            for name in ['lesson.mp4','master.wav','captions.vtt','transcript.txt']:
                if (src/name).exists(): shutil.copyfile(src/name,dest/name)
            if (dest/'lesson.mp4').exists(): available.append(locale)
        write(ROOT/'public/media/index.json', available)
        if (OUT/'visuals/receipt.json').exists():
            for asset in read(OUT/'visuals/receipt.json')['assets']:
                dest=ROOT/'visuals-v2'/asset['filename']
                dest.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(OUT/'visuals'/asset['filename'],dest)

if __name__ == '__main__': main()
