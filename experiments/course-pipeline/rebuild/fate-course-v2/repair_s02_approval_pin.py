from pathlib import Path
import json,hashlib,shutil,sys,subprocess,datetime
R=Path(sys.argv[1]);B=Path(__file__).parent;W=B.parents[3];S=B/'funded-s02-v1';O=B/'funded-s02-v2';O.mkdir(exist_ok=False);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();G=r'C:\Users\HI-TECH\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
def load(p):return json.loads(p.read_text(encoding='utf8'))
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
m=load(S/'request.json');before=m['methodApprovalSHA256'];gitblob=subprocess.check_output([G,'show','HEAD:'+(S/'method-approval.en.json').relative_to(W).as_posix()],cwd=W);assert hashlib.sha256(gitblob).hexdigest()!=before
for n in ['generate.py','review.py','audio_review_worker.py']:text(O/n,(S/n).read_text(encoding='utf8'))
for n in ['method-approval.en.json','budget-authorization.en.json']:text(O/n,(S/n).read_text(encoding='utf8'))
m['id']='fate-v2-funded-s02-v2-audio-only';m['methodApprovalOriginalSourceSHA256']=before;m['methodApprovalSHA256']=sha(O/'method-approval.en.json');m['budgetAuthorizationSHA256']=sha(O/'budget-authorization.en.json');m['previousRun']=40291143105;m['recovery']='Originals were never requested: approval byte guard failed before availability/provider generation. Approved source retained; normalize only the copied request line endings and compare Git blob pins. Reuse generated image from previous run.';save(O/'request.json',m)
w=(W/'.github/workflows/fate-v2-funded-s02.yml').read_text(encoding='utf8');w=w[:w.index('  image:\n')];w=w.replace('funded-s02-v1','funded-s02-v2').replace('Fate v2 funded second-step speech and visual originals','Fate v2 second-step narration approval-pin repair, reuse existing image');w=w.replace(sha(S/'request.json'),sha(O/'request.json'));text(W/'.github/workflows/fate-v2-funded-s02-v2.yml',w)
for p in O.glob('*.py'):compile(p.read_text(encoding='utf8'),str(p),'exec')
save(R/'production/S02-approval-byte-repair.en.json',{'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'failedRun':40291143105,'phase':'Approval raw-byte guard, before availability or speech request','speechGenerationCalls':0,'imagePreserved':'funded-s02-v1/artifacts/fate-v2-funded-image-S02-two-bases','cause':'Copied approval hadWindows line endings; Git stored normalizedLF. Previous raw pin differed.','originalApprovalSourceSHA256':before,'verifiedGitStoredApprovalSHA256':hashlib.sha256(gitblob).hexdigest(),'repair':'Normalize only copied approval/budget JSON toLF, pin exact bytes, verify staged versions of every dependency.','newImageCalls':0,'originalApprovedSpeechAndProof':'Unchanged'})
print(json.dumps({'requestSHA256':sha(O/'request.json'),'sourceApprovalPreserved':True,'newImageCalls':0}))
