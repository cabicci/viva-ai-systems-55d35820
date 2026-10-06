"""Read-only follow-up for already uploaded Academic pilot identities."""
import json, os, time, urllib.request
from pathlib import Path

request=json.loads(Path(__file__).with_name('verification-request.json').read_text())
pending=dict(request['videos']);results={}
library=os.environ['BUNNY_STREAM_LIBRARY_ID']
key=os.environ['BUNNY_STREAM_API_KEY']
output=Path('tmp/academic-verification.json')
output.parent.mkdir(parents=True,exist_ok=True)
attempts=min(20,max(1,int(request.get('maxAttempts',20))))
for attempt in range(attempts):
    for locale,guid in list(pending.items()):
        req=urllib.request.Request(f'https://video.bunnycdn.com/library/{library}/videos/{guid}',headers={'AccessKey':key,'accept':'application/json'})
        with urllib.request.urlopen(req,timeout=30) as response:data=json.loads(response.read())
        if not data.get('title','').startswith(f'academic-pilot-AC-BUS-M01-L01-{locale}-'):
            raise RuntimeError('Identity mismatch: no further operation allowed')
        ready=data.get('status')==4 and (data.get('length') or 0)>0
        results[locale]={'videoId':guid,'provider':'bunny','status':data.get('status'),'durationSeconds':data.get('length'),'playbackReady':ready,'embedUrl':f'https://iframe.mediadelivery.net/embed/{library}/{guid}?autoplay=false&preload=false' if ready else None,'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
        print(locale,results[locale]['status'],ready,flush=True)
        if ready or data.get('status') in [5,6]:del pending[locale]
    output.write_text(json.dumps(results,indent=2))
    if not pending:break
    if attempt<attempts-1:time.sleep(15)
if not all(r['playbackReady'] for r in results.values()):raise SystemExit('Playback remains unverified; no media changed.')
