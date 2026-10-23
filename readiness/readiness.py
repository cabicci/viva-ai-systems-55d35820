import hashlib,json,os,time,urllib.request
from pathlib import Path
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert os.environ['BUNNY_STREAM_LIBRARY_ID'].strip()=='670679'
raw=Path('manifest.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==os.environ['MANIFEST_SHA']
m=json.loads(raw);assert m['getBudget']==12 and len(m['entries'])==12
assert len({e['guid'] for e in m['entries']})==12
out=Path('output');out.mkdir(exist_ok=False)
for i,e in enumerate(m['entries']):
 req=urllib.request.Request('https://video.bunnycdn.com/library/670679/videos/'+e['guid'],headers={'AccessKey':os.environ['BUNNY_STREAM_API_KEY'],'Accept':'application/json'},method='GET')
 with urllib.request.urlopen(req,timeout=30) as response:obj=json.load(response)
 assert obj['guid']==e['guid'] and str(obj['videoLibraryId'])=='670679'
 row={k:obj.get(k)for k in ['guid','videoLibraryId','status','length','availableResolutions','originalHash','encodeProgress','storageSize']}
 row.update(identity=e['identity'],atUTC=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),stage='EXISTING_GUID_READ_ONLY_NO_CREATE_UPLOAD')
 if row['status']==4:
  assert (row['originalHash'] or '').lower()==e['sourceSHA256']
  assert abs(row['length']-e['durationSeconds'])<=2
  row['state']='READY_STATUS4_EXACT_ORIGINAL_HASH_DURATION_VERIFIED'
 else:row['state']='REMOTE_READINESS_NOT_VERIFIED'
 with (out/('%02d-'%i+e['guid']+'.json')).open('x')as f:json.dump(row,f,indent=2)
