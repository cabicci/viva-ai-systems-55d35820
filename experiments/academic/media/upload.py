"""Create-only Bunny delivery, reusing the existing transport. Never delete media."""
from pathlib import Path
import importlib.util, json, os, subprocess, sys, urllib.parse
ROOT=Path(__file__).resolve().parents[3]
locale=sys.argv[1]
if locale not in ['ar-EG','ar-MSA','ar-Gulf','en']:raise ValueError('Invalid locale')
sys.path.insert(0,str(Path(__file__).parent))
from build import fingerprint
digest=fingerprint(locale)
work=ROOT/f'tmp/academic-media/{locale}/{digest}'
receipt=json.loads((work/'receipt.json').read_text())
title=f'academic-pilot-AC-BUS-M01-L01-{locale}-{digest[:16]}'
os.environ['LID']='academic-pilot-ac-bus-m01-l01';os.environ['LOCALE']=locale
spec=importlib.util.spec_from_file_location('existing_bunny_transport',ROOT/'.github/scripts/upload_bunny_locale.py')
transport=importlib.util.module_from_spec(spec);spec.loader.exec_module(transport)
result=json.loads(transport._req('GET',transport.BASE+'?'+urllib.parse.urlencode({'search':title,'itemsPerPage':100})))
matches=[v for v in result.get('items',[]) if v.get('title')==title]
if len(matches)>1:raise RuntimeError('Ambiguous pilot receipt; do not create another video')
if matches:
    guid=matches[0]['guid']
    if matches[0].get('status') in [0,5,6]:raise RuntimeError('Existing incomplete pilot requires explicit repair; retained untouched')
else:
    guid=transport.create_video(title)
    # Save the identity before upload so even a failed upload is traceable; no delete fallback.
    receipt['videoId']=guid;(work/'receipt.json').write_text(json.dumps(receipt,indent=2))
    transport.upload_mp4(guid,str(work/'lesson.mp4'))
os.environ['GUID']=guid
subprocess.run([sys.executable,str(ROOT/'.github/scripts/verify_bunny_ready.py')],check=True)
receipt.update(videoId=guid,provider='bunny',embedUrl=f'https://iframe.mediadelivery.net/embed/{transport.LIBRARY_ID}/{guid}?autoplay=false&preload=false',playbackReady=True)
(work/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))
