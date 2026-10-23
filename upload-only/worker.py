"""Upload already-reviewed source bytes only. No rendering, generation or platform edits."""
import hashlib,json,os,re,sys,time,urllib.request,urllib.error,urllib.parse
from pathlib import Path
REPO='cabicci/viva-ai-systems-55d35820'
OUT=Path('output');OUT.mkdir(exist_ok=True)
def load(p):return json.loads(Path(p).read_text(encoding='utf-8'))
def save(name,data):
 p=OUT/name
 with p.open('x',encoding='utf-8')as f:json.dump(data,f,indent=2);f.write('\n')
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
def request(url,method='GET',headers=None,data=None):
 req=urllib.request.Request(url,method=method,headers=headers or {},data=data)
 try:
  with urllib.request.build_opener(NoRedirect).open(req,timeout=180)as f:return f.status,dict(f.headers),f.read()
 except urllib.error.HTTPError as e:
  if e.code in (301,302,303,307,308):return e.code,dict(e.headers),b''
  raise RuntimeError('Remote HTTP '+str(e.code)) from None
def validate(m):
 assert m['schema']=='masaarat.reviewed-bunny-upload.v1' and m['repository']==REPO
 assert m['expectedLibraryId']=='670679' and len(m['entries'])==1
 assert m['platformMappingChanges']is False and m['createBudget']==1 and m['putBudget']==1
 assert m['automaticMutationRetries']==0
 for v in m['entries']:
  assert re.fullmatch(r'SOIL-REBUILD-S[123]-\d\d',v['lessonId'])
  assert v['locale']in ['ar-EG','en','it','de']
  assert v['identity']==v['lessonId']+':'+v['locale']+':'+v['video']['sha256']
  assert re.fullmatch('[0-9a-f]{64}',v['video']['sha256']) and v['video']['bytes']>10000
  assert v['video']['assetId']>0 and v['captions']['assetId']>0
  assert v['durationSeconds']>0 and v['durationToleranceSeconds']==2
 return m['entries'][0]
def download_asset(a,dst):
 token=os.environ['GH_TOKEN'];url=f'https://api.github.com/repos/{REPO}/releases/assets/{a["assetId"]}'
 status,headers,body=request(url,headers={'Authorization':'Bearer '+token,'Accept':'application/octet-stream','X-GitHub-Api-Version':'2022-11-28'})
 if status==302:
  location=headers.get('Location',headers.get('location',''));parsed=urllib.parse.urlparse(location)
  assert parsed.scheme=='https' and parsed.hostname in ['release-assets.githubusercontent.com','objects.githubusercontent.com']
  status,_,body=request(location) # Never forward GitHub credentials to signed asset host.
 assert status==200 and len(body)==a['bytes'] and hashlib.sha256(body).hexdigest()==a['sha256']
 with Path(dst).open('xb')as f:f.write(body)
def prepared():
 m=load('manifest.json');expected=os.environ.get('MANIFEST_SHA')
 assert expected and digest('manifest.json')==expected
 v=validate(m)
 assert os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
 return m,v
def prepare():
 m,v=prepared();download_asset(v['video'],OUT/'source.mp4');download_asset(v['captions'],OUT/'source.vtt')
 assert (OUT/'source.vtt').read_text(encoding='utf-8-sig').startswith('WEBVTT')
 save('prepared.json',{'state':'EXACT_ORIGINAL_BYTES_VERIFIED','identity':v['identity'],'manifestSHA256':digest('manifest.json'),'videoSHA256':digest(OUT/'source.mp4'),'videoBytes':(OUT/'source.mp4').stat().st_size,'captionsSHA256':digest(OUT/'source.vtt'),'platformMappingChanged':False})
def bunny(method,suffix,data=None):
 lib=os.environ['BUNNY_STREAM_LIBRARY_ID'].strip();key=os.environ['BUNNY_STREAM_API_KEY']
 assert lib=='670679' and key
 status,_,body=request('https://video.bunnycdn.com/library/'+lib+'/videos'+suffix,method,{'AccessKey':key,'Accept':'application/json','Content-Type':'application/octet-stream'if method=='PUT'else'application/json'},data)
 assert 200<=status<300
 return json.loads(body)if body else {}
def create():
 m,v=prepared();assert load(OUT/'prepared.json')['identity']==v['identity']
 assert digest(OUT/'source.mp4')==v['video']['sha256']
 save('create-intent.json',{'state':'ONE_CREATE_INTENT_NO_RETRY','identity':v['identity'],'maxCalls':1,'atUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
 title='Masaarat Soil '+v['lessonId']+' '+v['locale']+' '+v['video']['sha256'][:16]
 result=bunny('POST','',json.dumps({'title':title}).encode())
 guid=result['guid'];assert re.fullmatch('[0-9a-fA-F-]{36}',guid)and str(result['videoLibraryId'])=='670679'
 save('created.json',{'state':'GUID_CREATED_UPLOAD_NOT_ATTEMPTED','identity':v['identity'],'guid':guid,'videoLibraryId':670679,'title':title,'platformMappingChanged':False})
def upload():
 m,v=prepared();created=load(OUT/'created.json');assert created['identity']==v['identity']
 assert digest(OUT/'source.mp4')==v['video']['sha256']
 save('put-intent.json',{'state':'ONE_PUT_INTENT_NO_RETRY','identity':v['identity'],'guid':created['guid'],'sourceSHA256':v['video']['sha256']})
 result=bunny('PUT','/'+created['guid'],(OUT/'source.mp4').read_bytes())
 assert result.get('success')is True
 save('uploaded.json',{'state':'ORIGINAL_MP4_UPLOAD_ACKNOWLEDGED_NOT_YET_READY','identity':v['identity'],'guid':created['guid'],'sourceSHA256':v['video']['sha256'],'captionState':'EXACT_VTT_TRANSFERRED_NOT_YET_ADDED_TO_BUNNY','platformMappingChanged':False})
def readiness():
 m,v=prepared();created=load(OUT/'created.json');guid=created['guid'];checks=[]
 assert load(OUT/'uploaded.json')['identity']==v['identity']
 for i in range(8):
  r=bunny('GET','/'+guid)
  assert r['guid']==guid and str(r['videoLibraryId'])=='670679'
  row={k:r.get(k)for k in ['guid','videoLibraryId','status','length','availableResolutions','originalHash','encodeProgress','storageSize']};row['attempt']=i+1;checks.append(row)
  save(f'readiness-{i+1:02d}.json',row)
  if r['status']==4:
   assert abs(r['length']-v['durationSeconds'])<=v['durationToleranceSeconds']
   save('ready.json',{'state':'BUNNY_STATUS4_DURATION_VERIFIED_PLAYBACK_CHECK_PENDING','identity':v['identity'],'guid':guid,'videoLibraryId':670679,'playbackURL':f'https://iframe.mediadelivery.net/embed/670679/{guid}?autoplay=false','checks':checks,'sourceBytesVerifiedBeforePUT':True,'captionState':'NOT_ADDED_YET','platformMappingChanged':False,'browserPlaybackVerified':False});return
  assert r['status']not in [5,6], 'Bunny encoding failed; preserve GUID and never recreate automatically'
  if i<7:time.sleep(20)
 save('pending.json',{'state':'UPLOADED_ENCODING_PENDING_NO_RETRY','identity':v['identity'],'guid':guid,'checks':checks,'next':'Read-only continuation for same GUID; no new create/put.'})
if __name__=='__main__':
 mode=sys.argv[-1]
 if mode=='validate':validate(load('manifest.json'));print('Bounded original-byte upload manifest valid; zero writes')
 elif mode=='prepare':prepare()
 elif mode=='create':create()
 elif mode=='upload':upload()
 elif mode=='readiness':readiness()
 else:raise SystemExit('Invalid mode')
