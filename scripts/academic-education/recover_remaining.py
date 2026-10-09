"""Finish the one retained failed output, keeping original production inputs."""
import hashlib
from pathlib import Path
import sys

import recover_media as recovery
from course_media import production_plan, write_json
from media_plan import ROOT

LESSON = 'AC-BUS-M03-L03'
LOCALE = 'ar-EG'
FINGERPRINT = 'bf9883b0871462ea923d45843dcfadc157b660d2d171d20f5dbea5d2640244e3'
LABEL = 'تعديل النموذج:'
MAX_ATTEMPTS = 8


def retry_label(generate, tts, text, target, keys, locale, policy, split_dir):
    if text != LABEL:
        return generate(tts, text, target, keys, locale, policy, split_dir)
    audit = {'sceneId': 'case-step-5-1', 'spoken': text,
             'originalDurationGate': [35, 300], 'attempts': [],
             'outputListening': 'pending'}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        if target.exists():
            archive = split_dir / f'rejected-label-{attempt}.wav'
            archive.parent.mkdir(parents=True, exist_ok=True)
            target.replace(archive)
        # Provider failures and editorial rejections propagate. No prompt, voice,
        # text, playback speed, silence or duration-gate changes are made.
        generate(tts, text, target, keys, locale, policy, split_dir)
        seconds = tts._duration_s(str(target))
        valid = recovery.acceptable(text, seconds)
        audit['attempts'].append({'attempt': attempt, 'seconds': seconds,
                                 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                                 'valid': valid})
        write_json(split_dir / 'short-segment-audit.json', audit)
        print(f'Short label attempt {attempt}/{MAX_ATTEMPTS}: duration gate {valid}', flush=True)
        if valid:
            return
    raise ValueError('Short label still fails original duration gate after bounded recovery')


def main(retained):
    plan, fingerprint = production_plan(LESSON, LOCALE)
    if fingerprint != FINGERPRINT:
        raise ValueError('Original production fingerprint changed')
    label = [s for s in plan['scenes'] if s['id'] == 'case-step-5-1']
    if len(label) != 1 or label[0]['spoken'] != LABEL:
        raise ValueError('Exact original label changed')
    generate = recovery.generate_segment
    recovery.generate_segment = lambda *args: retry_label(generate, *args)
    try:
        recovery.recover(LESSON, LOCALE, retained)
    finally:
        recovery.generate_segment = generate


if __name__ == '__main__':
    main(Path(sys.argv[1]))
