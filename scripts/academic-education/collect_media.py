"""Collect only verified exact-source receipts. Never imports or enables a course."""
import argparse
import json
from pathlib import Path
from media_plan import ROOT, package
from course_media import Bunny, production_plan, ready, write_json
from media_registry import checked_media, key, load_registry


def collect(source, output, verify_processing=False):
    registry = load_registry()
    conflicts, pending, failed = [], [], []
    bunny = None
    for path in sorted(source.rglob('receipt.json')):
        receipt = json.loads(path.read_text())
        lesson, locale = receipt['lessonId'], receipt['locale']
        plan, fingerprint = production_plan(lesson, locale)
        if receipt.get('fingerprint') != fingerprint or receipt.get('sourceSha256') != plan['sourceSha256']:
            raise ValueError('Stale receipt: ' + str(path))
        if verify_processing and receipt.get('uploaded') and not receipt.get('playbackReady'):
            bunny = bunny or Bunny()
            ready(bunny, receipt['videoId'], receipt, path)
        if not receipt.get('uploaded'):
            failed.append(key(lesson, locale))
            continue
        if not receipt.get('playbackReady'):
            pending.append(key(lesson, locale))
            continue
        checked_media(package(lesson, locale), {key(lesson, locale): receipt})
        previous = registry.get(key(lesson, locale))
        if previous and previous['videoId'] != receipt['videoId']:
            conflicts.append(key(lesson, locale))
            continue
        registry[key(lesson, locale)] = receipt
    if conflicts:
        raise ValueError('Conflicting video identities; preserve both receipts for review')
    expected = json.loads((ROOT / 'scripts/academic-education/media-request.json').read_text())['entries']
    missing = [key(e['lessonId'], e['locale']) for e in expected if key(e['lessonId'], e['locale']) not in registry]
    write_json(output / 'course-media-manifest.json', registry)
    summary = {'readyVideosIncludingPilot': len(registry), 'newReadyVideos': len(registry)-4,
               'pendingProcessing': pending, 'notUploaded': failed, 'missingReadyIdentities': missing,
               'productionActivated': False, 'published': False,
               'outputListening': 'pending-output-specific-review'}
    write_json(output / 'media-collection.json', summary)
    return summary


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('source', type=Path)
    p.add_argument('--output', type=Path, default=ROOT / 'tmp/academic-media-collection')
    p.add_argument('--verify-processing', action='store_true')
    a = p.parse_args()
    print(json.dumps(collect(a.source, a.output, a.verify_processing), indent=2))
