"""Bounded English S1-01 assembly of ten existing encoded clips. No scene render/provider calls."""
from __future__ import annotations
import argparse
import datetime
from fractions import Fraction
import hashlib
import json
import math
import os
import re
from pathlib import Path
import struct
import subprocess
import wave

HERE = Path(__file__).resolve().parent
FPS = 30
RATE = 24000
SAMPLES_PER_FRAME = 800
BRANCH='refs/heads/work/soil-s101-en-assembly-20261022-r1'
REPOSITORY='cabicci/viva-ai-systems-55d35820'
REPOSITORY_ID='1272666418'
SCENES=['s101-purpose','s101-site','s101-communication','s101-limits','s101-environment','s101-ppe','s101-chemical','s101-checklist','s101-example-route','s101-example-gloves']

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            result.update(chunk)
    return result.hexdigest()

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(path)

def input_path(root, relative):
    assert isinstance(relative, str) and relative
    relative_path = Path(relative)
    assert not relative_path.is_absolute() and '..' not in relative_path.parts
    path = (root / relative_path).resolve()
    assert path.is_relative_to(root.resolve()), 'Input escaped package input root'
    assert path.is_file(), 'Required exact input is missing'
    return path

def checked_pin(root, pin):
    assert isinstance(pin.get('sha256'), str) and len(pin['sha256']) == 64
    path = input_path(root, pin['path'])
    assert sha(path) == pin['sha256'], 'Input SHA256 mismatch'
    return path

def contract(manifest,root,*,offline_fixture=False):
    assert offline_fixture is False,'Synthetic fixtures never enter production contract'
    assert manifest['schemaVersion']==1 and manifest['status']=='ALL_TEN_ENCODED_CLIP_QA_BOUND_PACKAGE_PREPARED_FOR_ROOT_REVIEW'
    assert manifest['scope']=='S1-01_FULL_ENGLISH_LESSON_ONLY'and manifest['lessonId']=='S1-01'and manifest['locale']=='en'
    assert manifest['repository']==REPOSITORY and str(manifest['repositoryId'])==REPOSITORY_ID
    assert 'refs/heads/'+manifest['branch']==BRANCH
    assert manifest['fps']==FPS and manifest['audioFormat']=={'sampleRate':RATE,'channels':1,'sampleWidthBytes':2}
    assert manifest['rolloutApproved']is False and manifest['ownerFullVideoApproved']is False and manifest['providerCalls']==0
    assert manifest['ownerDelegatedMediaReview']is True and all(manifest['gates'].values())
    blocks=manifest['blocks'];assert [b['sceneId']for b in blocks]==SCENES and [b['id']for b in blocks]==['en-'+s for s in SCENES]
    assert [b['sequence']for b in blocks]==list(range(1,11));cursor=frames=source=padding=0
    for block in blocks:
        sid=block['sceneId'];count=block['sampleCount'];fc=block['frameCount'];assert type(count)is int and count>0 and type(fc)is int and fc>0
        assert fc==math.ceil(count/SAMPLES_PER_FRAME) and block['covers']==[sid] and block['video']['container']=='ivf'
        assert block['startSample']==cursor and block['startVideoFrame']==frames
        pad=fc*SAMPLES_PER_FRAME-count;assert 0<=pad<=799 and block['endPaddingSamples']==pad
        for key in ['audio','video','captions','encoding','rootQa']:checked_pin(root,block[key])
        enc=read(checked_pin(root,block['encoding']));qa=read(checked_pin(root,block['rootQa']));caps=read(checked_pin(root,block['captions']))
        assert enc['sceneId']==qa['sceneId']==caps['sceneId']==sid and enc['locale']==qa['locale']==caps['locale']=='en'
        assert enc['videoSha256']==qa['videoSha256']==block['video']['sha256'];assert enc['inputs']['audioSha256']==qa['audioSha256']==caps['audioSha256']==block['audio']['sha256']
        assert enc['frames']==qa['frames']==fc and enc['fps']==FPS and (enc['width'],enc['height'])==(1920,1080)
        assert len(enc['packetHashes'])==fc and all(re.fullmatch('[a-f0-9]{64}',h)for h in enc['packetHashes'])
        assert hashlib.sha256(json.dumps(enc['inputs'],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==enc['inputSignature']
        assert caps['runtimePlanSha256']==enc['inputs']['runtimePlanSha256']and qa['rendererSha256']==enc['inputs']['rendererSha256']
        assert qa['sourceEncodeReceiptSha256']==enc['sourceEncodeReceiptSha256']and qa['status']=='ROOT_ACTUAL_ENCODED_CLIP_QA_BOUND'
        assert qa['packetAndFullDecodeVerifiedByRootEvidence']is True and qa['actualEventFramesReviewed']>0 and qa['contactSheetHashes']
        assert caps['assessmentExcluded']is True and caps['durationSeconds']==count/RATE
        assert ' '.join(' '.join(c['text']for c in caps['captions']).split())==' '.join(caps['completeCaptionText'].split())
        assert [c['index']for c in caps['captions']]==sorted(set(c['index']for c in caps['captions'])) # Retain authored indices; site10 was merged, not renumbered.
        for c in caps['captions']:
            assert c['audioSha256']==block['audio']['sha256']and 0<=c['start']<c['end']<=count/RATE and isinstance(c['text'],str)and c['text']
        cursor+=fc*SAMPLES_PER_FRAME;frames+=fc;source+=count;padding+=pad
    assert manifest['totals']=={'videoFrames':frames,'masterSamples':cursor,'durationSeconds':frames/FPS,'originalSourceSamples':source,'explicitEndPaddingSamples':padding}
    return blocks


def pcm_info(path):
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getcomptype()) == (1, 2, RATE, 'NONE')
        count = wav.getnframes()
        digest = hashlib.sha256()
        read_count = 0
        while True:
            data = wav.readframes(65536)
            if not data:
                break
            assert len(data) % 2 == 0
            read_count += len(data) // 2
            digest.update(data)
        assert read_count == count > 0, 'PCM sample count disagrees with WAV header'
        return {'sampleCount': count, 'pcmSha256': digest.hexdigest(), 'durationSeconds': count / RATE}

def inspect_ivf(path, expected_frames, expected_hashes=None):
    with Path(path).open('rb') as stream:
        header = stream.read(32)
        assert len(header) == 32
        signature, version, length, codec, width, height, rate, scale, declared, unused = struct.unpack('<4sHH4sHHIIII', header)
        assert signature == b'DKIF' and version == 0 and length == 32
        assert codec in (b'VP80', b'VP90', b'AV01') and (width, height) == (1920, 1080)
        assert Fraction(rate, scale) == FPS and declared == expected_frames
        packets = 0
        while True:
            frame_header = stream.read(12)
            if not frame_header:
                break
            assert len(frame_header) == 12, 'Truncated IVF packet header'
            size, timestamp = struct.unpack('<IQ', frame_header)
            assert timestamp == packets and size > 0, 'Unexpected IVF frame timestamp/packet size'
            payload=stream.read(size)
            assert len(payload)==size,'Truncated IVF frame payload'
            if expected_hashes is not None:assert hashlib.sha256(payload).hexdigest()==expected_hashes[packets],'Encoded IVF packet hash differs from captured receipt'
            packets += 1
        assert packets == expected_frames, 'IVF actual packets differ from expected frames'
    return {'codecFourCC': codec.decode(), 'frames': packets, 'width': width, 'height': height,
            'rate': rate, 'scale': scale, 'timestampPolicy': 'consecutive frame indices from zero'}

def probe(path):
    raw = subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-show_data', '-of', 'json', str(path)])
    return json.loads(raw)

def video_info(path, expected_frames):
    raw = probe(path)
    streams = [s for s in raw['streams'] if s['codec_type'] == 'video']
    assert len(streams) == 1
    stream = streams[0]
    assert (stream['width'], stream['height']) == (1920, 1080)
    assert Fraction(stream['r_frame_rate']) == FPS
    if Path(path).suffix.lower() == '.ivf' and stream['avg_frame_rate'] == '0/0':
        pass  # IVF header and packet timestamps independently establish 30fps.
    else:
        assert Fraction(stream['avg_frame_rate']) == FPS
    assert int(stream['nb_read_frames']) == expected_frames, 'Decoded video frame count mismatch'
    return raw

def validate_inputs(manifest, root, *, offline_fixture=False, video_inspector=video_info):
    blocks = contract(manifest, root, offline_fixture=offline_fixture)
    verified = []
    cursor_samples = 0
    cursor_frames = 0
    for block in blocks:
        audio = checked_pin(root, block['audio'])
        video = checked_pin(root, block['video'])
        pcm = pcm_info(audio)
        assert pcm['sampleCount'] == block['sampleCount'], 'Manifest sample count changed'
        assert pcm['pcmSha256'] == block['pcmSha256'], 'Manifest PCM hash changed'
        if block['video']['container'] == 'ivf':
            ivf = inspect_ivf(video,block['frameCount'],read(checked_pin(root,block['encoding']))['packetHashes'])
        else:
            ivf = None
        video_metadata = video_inspector(video, block['frameCount'])
        padding = block['frameCount'] * SAMPLES_PER_FRAME - block['sampleCount']
        verified.append({'id': block['id'], 'covers': block['covers'], 'audio': block['audio'], 'video': block['video'],
                         'sampleCount': block['sampleCount'], 'frameCount': block['frameCount'], 'pcmSha256': pcm['pcmSha256'],
                         'startSample': cursor_samples, 'startVideoFrame': cursor_frames, 'endPaddingSamples': padding,
                         'paddingSeconds': padding / RATE, 'ivf': ivf, 'videoProbe': video_metadata})
        cursor_samples += block['sampleCount'] + padding
        cursor_frames += block['frameCount']
    assert cursor_samples == cursor_frames * SAMPLES_PER_FRAME
    return {'blocks': verified, 'totalSamples': cursor_samples, 'totalVideoFrames': cursor_frames,
            'durationSeconds': cursor_samples / RATE, 'fps': FPS, 'sampleRate': RATE}

def append_master(verified, root, target):
    assert not target.exists(), 'Refuse to overwrite existing lossless master'
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), 'wb') as master:
        master.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        for block in verified['blocks']:
            source = checked_pin(root, block['audio'])
            with wave.open(str(source), 'rb') as wav:
                while True:
                    data = wav.readframes(65536)
                    if not data:
                        break
                    master.writeframesraw(data)
            master.writeframesraw(b'\x00\x00' * block['endPaddingSamples'])
    return verify_master(verified, root, target)

def verify_master(verified, root, target):
    reused = []
    with wave.open(str(target), 'rb') as master:
        assert (master.getnchannels(), master.getsampwidth(), master.getframerate()) == (1, 2, RATE)
        assert master.getnframes() == verified['totalSamples']
        for block in verified['blocks']:
            assert master.tell() == block['startSample']
            digest = hashlib.sha256()
            source = checked_pin(root, block['audio'])
            with wave.open(str(source), 'rb') as wav:
                while True:
                    expected = wav.readframes(65536)
                    if not expected:
                        break
                    actual = master.readframes(len(expected) // 2)
                    assert actual == expected, 'Source PCM changed in assembled master'
                    digest.update(actual)
            assert digest.hexdigest() == block['pcmSha256']
            padding = master.readframes(block['endPaddingSamples'])
            assert padding == b'\x00\x00' * block['endPaddingSamples']
            reused.append({'id': block['id'], 'sourceWavSha256': sha(source), 'sourcePcmSha256': digest.hexdigest(),
                           'exactMasterStartSample': block['startSample'], 'sourceSamplesPreserved': block['sampleCount'],
                           'explicitEndZeroPaddingSamples': block['endPaddingSamples'], 'byteIdenticalPcmAtOffset': True})
        assert master.tell() == verified['totalSamples'] and master.readframes(1) == b''
    return {'masterSha256': sha(target), 'masterPcmSha256': pcm_info(target)['pcmSha256'], 'totalSamples': verified['totalSamples'],
            'method': 'Exact source PCM byte comparison at each recorded sample offset; no listening claim.', 'sources': reused}

def stable_codec(raw):
    stream = next(s for s in raw['streams'] if s['codec_type'] == 'video')
    keys = ['codec_name', 'profile', 'codec_tag_string', 'width', 'height', 'pix_fmt', 'level', 'has_b_frames',
            'r_frame_rate', 'avg_frame_rate', 'time_base', 'extradata']
    assert stream['codec_name'] == 'h264' and stream['pix_fmt'] == 'yuv420p'
    assert stream['has_b_frames'] == 0, 'Stable packet-order concat requires no B-frame reordering'
    assert stream.get('extradata'), 'H264 parameter-set evidence missing'
    return {key: stream.get(key) for key in keys}

def exact_video_duration(raw, frames):
    stream = next(s for s in raw['streams'] if s['codec_type'] == 'video')
    assert Fraction(int(stream['duration_ts'])) * Fraction(stream['time_base']) == Fraction(frames, FPS), 'Encoded video duration differs from its exact frame grid'

def packet_grid(path, frames):
    raw = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_packets',
                                   '-show_entries', 'packet=pts,dts,duration', '-of', 'json', str(path)])
    packets = json.loads(raw)['packets']
    assert len(packets) == frames
    for index, packet in enumerate(packets):
        assert int(packet['pts']) == int(packet['dts']) == index * 1000
        assert int(packet['duration']) == 1000
    return {'packets': frames, 'timeBase': '1/30000', 'firstPts': 0, 'lastPts': (frames - 1) * 1000,
            'durationPerPacket': 1000, 'probePacketJsonSha256': hashlib.sha256(raw).hexdigest()}

def production_gate():
    assert os.environ.get('GITHUB_ACTIONS')=='true','Assembly execution is Actions only'
    assert os.environ.get('GITHUB_REPOSITORY')==REPOSITORY and os.environ.get('GITHUB_REPOSITORY_ID')==REPOSITORY_ID
    assert os.environ.get('GITHUB_REF')==BRANCH and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'and os.environ.get('GITHUB_EVENT_NAME')=='push'
    event=read(os.environ['GITHUB_EVENT_PATH']);assert event['created']is True and event['before']=='0'*40
    assert event['ref']==BRANCH and event['after']==os.environ['GITHUB_SHA']and re.fullmatch('[a-f0-9]{40}',event['after'])
    assert event['repository']['full_name']==REPOSITORY and str(event['repository']['id'])==REPOSITORY_ID
    frozen=read(HERE/'freeze.json')
    for relative,expected in frozen['sha256'].items():assert sha(input_path(HERE,relative))==expected
    for name,env in [('manifest.json','MANIFEST_SHA'),('assemble.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/name)==os.environ[env]


def execute():
    production_gate()
    manifest = read(HERE / 'manifest.json')
    root = HERE / 'inputs'
    out = HERE / 'output'
    assert not out.exists(), 'Refuse previous or ambiguous assembly state'
    verified = validate_inputs(manifest, root)
    out.mkdir()
    write(out / 'verified-inputs.json', verified)
    version = subprocess.check_output(['ffmpeg', '-version'], text=True)
    (out / 'ffmpeg-version.txt').write_text(version, encoding='utf-8')
    (out / 'ffprobe-version.txt').write_text(subprocess.check_output(['ffprobe', '-version'], text=True), encoding='utf-8')
    available_filters = subprocess.check_output(['ffmpeg', '-hide_banner', '-bsfs'], text=True)
    (out / 'available-bitstream-filters.txt').write_text(available_filters, encoding='utf-8')
    assert 'setts' in available_filters.split(), 'Required timestamp bitstream filter unavailable; stop before encoding'
    journal = {'atUTC': now(), 'state': 'ASSEMBLY_RESERVED_NO_AUTOMATIC_REPEAT', 'commands': [],
               'manifestSha256': sha(HERE / 'manifest.json'), 'workerSha256': sha(HERE / 'assemble.py')}
    write(out / 'attempt.json', journal)
    def run(command, label):
        entry = {'label': label, 'command': command, 'reservedBeforeExecutionUTC': now(), 'state': 'STARTED'}
        journal['commands'].append(entry)
        write(out / 'attempt.json', journal)
        result = subprocess.run(command, capture_output=True, text=True)
        (out / (label + '.stderr.txt')).write_text(result.stderr, encoding='utf-8')
        entry.update(returnCode=result.returncode, finishedUTC=now(), state='SUCCESS' if result.returncode == 0 else 'FAILED')
        write(out / 'attempt.json', journal)
        assert result.returncode == 0, 'FFmpeg operation failed; no retry'
    try:
        parts = out / 'parts'
        parts.mkdir()
        signature = None
        encoded = []
        for index, block in enumerate(verified['blocks']):
            source = checked_pin(root, block['video'])
            target = parts / f'{index:03d}.mp4'
            command = ['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-i', str(source), '-map', '0:v:0', '-an',
                       '-vf', 'format=yuv420p,setsar=1', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                       '-profile:v', 'high', '-level:v', '4.0', '-pix_fmt', 'yuv420p', '-r', '30', '-fps_mode', 'cfr',
                       '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-bf', '0', '-refs', '3',
                       '-flags', '+cgop', '-frames:v', str(block['frameCount']), '-video_track_timescale', '30000',
                       '-movflags', '+faststart', str(target)]
            run(command, f'encode-{index:03d}')
            raw = video_info(target, block['frameCount'])
            exact_video_duration(raw, block['frameCount'])
            actual_signature = stable_codec(raw)
            if signature is None:
                signature = actual_signature
            assert actual_signature == signature, 'Encoded H264 codec/parameter-set mismatch'
            encoded.append({'id': block['id'], 'file': target.relative_to(out).as_posix(), 'sha256': sha(target),
                            'frameCount': block['frameCount'], 'codecSignature': actual_signature})
        write(out / 'encoded-parts.json', encoded)
        concat = out / 'concat.txt'
        concat.write_text(''.join("file '" + item['file'] + "'\n" for item in encoded), encoding='utf-8', newline='\n')
        video = out / 'lesson-video-only.mp4'
        run(['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-f', 'concat', '-safe', '1', '-i', str(concat),
             '-map', '0:v:0', '-c:v', 'copy', '-an', '-bsf:v', 'setts=pts=N*1000:dts=N*1000:duration=1000:time_base=1/30000',
             '-video_track_timescale', '30000', '-movflags', '+faststart', str(video)], 'concat-video')
        exact_video_duration(video_info(video, verified['totalVideoFrames']), verified['totalVideoFrames'])
        write(out / 'concat-packet-grid.json', packet_grid(video, verified['totalVideoFrames']))
        master = out / 'S1-01-en-lossless-master.wav'
        reuse = append_master(verified, root, master)
        write(out / 'pcm-reuse-verification.json', reuse)
        write_captions(verified,root,out)
        final = out / 'S1-01-en-full-lesson-candidate.mp4'
        run(['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-i', str(video), '-i', str(master),
             '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '24000', '-ac', '1',
             '-movflags', '+faststart', str(final)], 'mux-lossy-aac')
        final_probe = video_info(final, verified['totalVideoFrames'])
        exact_video_duration(final_probe, verified['totalVideoFrames'])
        write(out / 'final-video-packet-grid.json', packet_grid(final, verified['totalVideoFrames']))
        sound = [s for s in final_probe['streams'] if s['codec_type'] == 'audio']
        assert len(sound) == 1 and sound[0]['codec_name'] == 'aac'
        assert int(sound[0]['sample_rate']) == RATE and sound[0]['channels'] == 1
        assert abs(float(sound[0]['duration']) - verified['durationSeconds']) <= 1024 / RATE
        assert abs(float(final_probe['format']['duration']) - verified['durationSeconds']) <= 1024 / RATE
        run(['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-i', str(final), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'rawvideo', '-c:a', 'pcm_s16le', '-f', 'null', '-'], 'full-final-decode')
        reuse_again = verify_master(verified, root, master)
        assert reuse_again == reuse
        write(out / 'final-probe.json', final_probe)
        write(out / 'completion.json', {'atUTC': now(), 'status': 'FULL_ENGLISH_FIRST_LESSON_CANDIDATE_NOT_OWNER_VIDEO_APPROVED',
              'lessonId':'S1-01','locale':'en','blocks':10,'scenes':10, 'totalVideoFrames': verified['totalVideoFrames'],
              'totalMasterSamples': verified['totalSamples'], 'durationSeconds': verified['durationSeconds'],
              'mp4Sha256': sha(final), 'losslessWavSha256': sha(master), 'audioInMp4': 'AAC is lossy; source PCM preservation applies to the separate lossless master WAV.',
              'allOriginalPcmVerifiedAtExactOffsets': True, 'explicitPaddingOnly': True, 'fullDecodePassed': True,
              'rolloutApproved': False, 'ownerFullVideoApproved': False, 'providerCalls': 0})
        journal.update(state='COMPLETED_CANDIDATE_AWAITING_COURSE_FINAL_QA', finishedUTC=now())
        write(out / 'attempt.json', journal)
    except Exception as error:
        journal.update(state='FAILED_NO_AUTOMATIC_REPEAT', errorType=type(error).__name__, finishedUTC=now())
        write(out / 'attempt.json', journal)
        raise

def write_captions(verified,root,out):
    rows=[]
    for block in verified['blocks']:
        caps=read(checked_pin(root,next(b for b in read(HERE/'manifest.json')['blocks']if b['id']==block['id'])['captions']))
        offset=Fraction(block['startSample'],RATE)
        for c in caps['captions']:
            start=offset+Fraction(str(c['start']));end=offset+Fraction(str(c['end']))
            rows.append({'sceneId':caps['sceneId'],'indexInScene':c['index'],'text':c['text'],'sourceLocalStartSeconds':c['start'],'sourceLocalEndSeconds':c['end'],'globalStartSecondsExact':str(start),'globalEndSecondsExact':str(end),'sceneStartSample':block['startSample']})
    write(out/'S1-01-en-caption-timeline.json',{'method':'Exact measured source caption times plus integer PCM scene offset; VTT/SRT exports round only to nearest millisecond. Burned original frames are unchanged.','captions':rows})
    def ts(value,comma=False):
        n=round(Fraction(value)*1000);h,n=divmod(n,3600000);m,n=divmod(n,60000);sec,ms=divmod(n,1000);return f'{h:02d}:{m:02d}:{sec:02d}'+(','if comma else'.')+f'{ms:03d}'
    (out/'S1-01-en-captions.vtt').write_text('WEBVTT\n\n'+''.join(ts(c['globalStartSecondsExact'])+' --> '+ts(c['globalEndSecondsExact'])+'\n'+c['text']+'\n\n'for c in rows),'utf-8')
    (out/'S1-01-en-captions.srt').write_text(''.join(str(i+1)+'\n'+ts(c['globalStartSecondsExact'],True)+' --> '+ts(c['globalEndSecondsExact'],True)+'\n'+c['text']+'\n\n'for i,c in enumerate(rows)),'utf-8')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['validate', 'execute'])
    args = parser.parse_args()
    try:
        if args.command == 'validate':
            result = validate_inputs(read(HERE / 'manifest.json'), HERE / 'inputs')
            print(json.dumps({'verifiedBlocks': len(result['blocks']), 'totalFrames': result['totalVideoFrames'], 'providerCalls': 0}))
        else:
            execute()
    except Exception as error:
        raise SystemExit('Assembly stopped: ' + type(error).__name__ + '. No automatic repeat.') from None

if __name__ == '__main__':
    main()
