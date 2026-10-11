"""Use the existing GitHub receipt/Lovable coordination path, without cloud secrets."""
import base64,json,os,subprocess,tempfile,time,urllib.error,urllib.request,urllib.parse
from pathlib import Path
BRANCH='review/cabinet-ai-style-20261010'
REPO='cabicci/viva-ai-systems-55d35820'
PREFIX='docs/production/technical-v2'
ROOT=Path(__file__).resolve().parents[2]
def receipt_path(r,kind):
 if kind not in ('ready','ack','done'):raise ValueError('Invalid receipt lane')
 import re
 if not re.fullmatch(r'M\d{2}-L\d{2}',r['lessonId']) or r['locale'] not in ('ar-EG','ar-MSA','ar-Gulf','en'):raise ValueError('Invalid receipt identity')
 return f"{PREFIX}/{kind}/{r['lessonId']}__{r['locale']}.json"
def github_receipt(r,kind):
 path=receipt_path(r,kind)
 url=f'https://api.github.com/repos/{REPO}/contents/{path}?ref='+urllib.parse.quote(BRANCH,safe='')
 req=urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 try:
  with urllib.request.urlopen(req,timeout=30) as res:data=json.load(res)
 except urllib.error.HTTPError as e:
  if e.code==404:return None
  raise RuntimeError(f'Receipt lookup HTTP {e.code}; published video retained') from None
 return json.loads(base64.b64decode(data['content']))
def valid_ack(r,a):
 fields=('batchId','lessonId','locale','oldGuid','newGuid','sourceHash','videoSha256','audioSha256','backupSha256','backupArtifactId','backupRunId','sourceCommit')
 return bool(a and a.get('status')=='linked' and a.get('cloudReadbackVerified') is True and all(a.get(k)==r.get(k) for k in fields))
def commit_receipt(r,kind):
 """Push only one receipt in a separate worktree; original render source stays pinned."""
 if os.environ.get('GITHUB_REF')!='refs/heads/'+BRANCH:raise RuntimeError('Wrong production branch')
 root=ROOT
 path=receipt_path(r,kind);payload=json.dumps(r,ensure_ascii=False,indent=2)+'\n'
 target=Path(tempfile.mkdtemp(prefix='technical-receipt-'))
 def git(*args,cwd=root):return subprocess.run(['git',*args],cwd=cwd,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 git('worktree','add','--detach',str(target),'HEAD')
 try:
  git('config','user.name','github-actions[bot]',cwd=target);git('config','user.email','github-actions[bot]@users.noreply.github.com',cwd=target)
  for attempt in range(10):
   git('fetch','origin',BRANCH,cwd=target);git('reset','--hard','FETCH_HEAD',cwd=target)
   p=target/path
   if p.exists():
    existing=json.loads(p.read_text())
    if existing==r:return
    raise RuntimeError('Existing cell receipt differs; do not overwrite')
   p.parent.mkdir(parents=True,exist_ok=True);p.write_text(payload)
   git('add','--',path,cwd=target);git('commit','-m',f"media(technical): {kind} {r['lessonId']} {r['locale']}",cwd=target)
   result=subprocess.run(['git','push','origin',f'HEAD:refs/heads/{BRANCH}'],cwd=target,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
   if result.returncode==0:return
   if attempt<9:time.sleep(2+attempt%3)
  raise RuntimeError('Receipt push conflict; both videos retained')
 finally:git('worktree','remove','--force',str(target))
def await_mapping(r):
 for attempt in range(30):
  a=github_receipt(r,'ack')
  if a is not None:
   if not valid_ack(r,a):raise RuntimeError('Mapping receipt rejected; both videos retained')
   return a
  if attempt<29:time.sleep(30)
 raise RuntimeError('Cloud mapping pending; ready video and original retained without regeneration')
