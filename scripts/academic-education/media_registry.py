"""Validate exact media identities for review and private production import."""
import json
import re
from media_plan import ROOT, digest

MANIFEST = ROOT / 'experiments/academic/course-media-manifest.json'
GUID = re.compile(r'[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}')


def key(lesson, locale):
    return f'{lesson}__{locale}'


def checked_media(data, registry):
    row = registry.get(key(data['id'], data['locale']))
    if not row or not row.get('playbackReady'):
        return None
    if row.get('lessonId') != data['id'] or row.get('locale') != data['locale']:
        raise ValueError('Media lesson/locale identity mismatch')
    if row.get('sourceSha256') != digest(data):
        raise ValueError('Media source changed; do not attach stale video')
    guid = row.get('videoId', '')
    url = row.get('embedUrl', '')
    if not GUID.fullmatch(guid) or not re.fullmatch(
            r'https://iframe\.mediadelivery\.net/embed/\d+/' + re.escape(guid)
            + r'\?autoplay=false&preload=false', url):
        raise ValueError('Invalid or autoplay media URL')
    if row.get('durationSeconds', 0) <= 0:
        raise ValueError('Empty media cannot be ready')
    return row


def load_registry():
    return json.loads(MANIFEST.read_text())
