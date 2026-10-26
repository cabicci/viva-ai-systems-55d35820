"""Build one exact, non-paid Actions assembly request from actual selected scenes."""
from pathlib import Path
import argparse,json,hashlib,sys,re,shutil,datetime
B=Path(__file__).parent;sys.path.insert(0,str(B/'rest-master-assembly'))
from selection_contract import step_id,LOCALES,sha,beneath,local_artifact,review_gate,scene_bindings
def load(p):return json.loads(Path(p).read_text(encoding='utf8'))
def text(p,s):
 with Path(p).open('w',encoding='utf8',newline='\n') as f:f.write(s)
def save(p,v):text(p,json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def main():
 a=argparse.ArgumentParser(description=__doc__);a.add_argument('--root',required=True);a.add_argument('--step',required=True);a.add_argument('--selection',required=True);a.add_argument('--version',default='v1');args=a.parse_args();R=Path(args.root).resolve();step=step_id(args.step)
 if not re.fullmatch(r'[a-z0-9-]{1,40}',args.version):raise ValueError('Explicit safe version name required')
 selection=load(args.selection)
 if selection.get('step')!=step:raise ValueError('Selection belongs to another step')
 lessons=load(R/f'lessons/{step}/lesson.public.json');draftFile=R/f'media-plan/{step}/spoken-draft.en.json';draft=load(draftFile);lessonHash=sha(R/f'lessons/{step}/lesson.public.json')
 run=load(R/'RUN.en.json');P=R.parent;approval=R/'production/voice38-proof-v1/owner-acceptance.en.json';approved=load(approval)
 if approved.get('ownerAnswer')!='اعتمد العربي والإنجليزي وكمّل':raise ValueError('Accepted speech method provenance missing')
 if not all(sha(P/k)==h for k,h in run['oldEdition']['protectedFilePreimages'].items()):raise ValueError('Protected original edition changed; inspect before proceeding')
 result={};sceneCount=None
 for locale,provided in selection.get('locales',{}).items():
  if locale not in LOCALES:raise ValueError('Uncommissioned locale')
  source=[p for p in draft['parts'] if p['locale']==locale];count=len(source)
  if count not in [5,6] or (sceneCount is not None and count!=sceneCount):raise ValueError('Unexpected source scene count')
  sceneCount=count
  if len(provided)!=count:raise ValueError('A locale must contain every selected ordinary explanatory scene')
  result[locale]=[]
  for i,(part,s) in enumerate(zip(provided,source),1):
   if part.get('sceneIndex')!=i:raise ValueError('Scene order must match source sequence')
   if s['sourceLessonSHA256']!=lessonHash or hashlib.sha256(s['spokenText'].encode()).hexdigest()!=s['textSHA256']:raise ValueError('Current source/script binding changed')
   p=dict(part,sectionID=s['sectionID'],voice=s['voice'],textSHA256=s['textSHA256'],deliverySHA256=part.get('deliverySHA256'))
   if p['voice']!=('Charon' if i%2 else 'Kore'):raise ValueError('Expected accepted alternating complete-passage voices')
   if not re.fullmatch(r'[0-9a-f]{64}',str(p['deliverySHA256'])):raise ValueError('Exact accepted delivery hash required')
   proofID=('AR' if locale=='ar-EG' else 'EN')+'-'+p['voice'];proof=next(x for x in approved['files'] if x['id']==proofID)
   if p['deliverySHA256']!=proof['deliverySHA256']:raise ValueError('Delivery differs from the owner-accepted method')
   if 'title' not in p:
    p['title']={}
    for loc,code in LOCALES.items():
     sec=next((x for x in lessons[code]['sections'] if x['id']==s['sectionID']),None);p['title'][code]=sec['title'] if sec else lessons[code]['example']['title']
   paths={n:local_artifact(R,p[n]) for n in ['audio','audioGate','visual','timing','render','selectedVideo']}
   gate=load(paths['audioGate']);timing=load(paths['timing']);render=load(paths['render']);review_gate(gate,p);scene_bindings(p,timing,render)
   v=load(paths['audio'].parent/'verification.json')
   for k in ['textSHA256','deliverySHA256','voice']:
    if v[k]!=p[k]:raise ValueError('Original recording differs from current reviewed request: '+k)
   if v['wavSHA256']!=p['audio']['sha256']:raise ValueError('Original WAV identity mismatch')
   if v['model']!='gemini-3.8-flash-tts' or v['returnedModelVersion']!=v['model']:raise ValueError('No silent speech model substitution')
   review_gate(gate,p,v['pcmSHA256']);result[locale].append(p)
 if not result:raise ValueError('At least one complete ready locale required')
 out=B/'rest-master-assembly/jobs'/f'{step}-{args.version}'
 if out.exists():raise FileExistsError('Version already exists; never overwrite an existing request')
 # All actual input guards pass before creating an output.
 out.mkdir(parents=True)
 for n in ['assemble.py','selection_contract.py']:text(out/n,(B/'rest-master-assembly'/n).read_text(encoding='utf8'))
 text(out/'method-approval.en.json',approval.read_text(encoding='utf8'))
 m={'schema':'course-master-assembly.v1','id':f'{step}-masters-{args.version}','step':step,'sceneCount':sceneCount,'newProviderCalls':0,'speechModel':'gemini-3.8-flash-tts','sourceLessonSHA256':lessonHash,'sourceSpokenDraftSHA256':sha(draftFile),'actualSelectionSHA256':sha(args.selection),'implementationSHA256':sha(out/'assemble.py'),'selectionContractSHA256':sha(out/'selection_contract.py'),'methodApprovalOriginalSHA256':sha(approval),'methodApprovalCopySHA256':sha(out/'method-approval.en.json'),'locales':result,'scope':'Ordinary explanatory scenes only. Written lesson, independent practice and private assessment keys remain separate.','ownerFullMasterListening':'Not claimed','createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat()};save(out/'request.json',m)
 package=out.relative_to(B.parents[3]).as_posix();artifactPrefix='fate-v2-master-'+step+'-'+args.version
 workflow='''name: Fate v2 STEP selected bilingual master assembly VERSION
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [PACKAGE/request.json]
permissions:
  contents: read
  actions: read
concurrency:
  group: ARTIFACTPREFIX
  cancel-in-progress: false
env:
  PACKAGE: PACKAGEVALUE
  EXPECTED_REQUEST_SHA256: REQUESTHASH
  GH_TOKEN: ${{ github.token }}
  PYTHONUNBUFFERED: '1'
jobs:
  assemble:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    strategy:
      fail-fast: false
      max-parallel: 2
      matrix:
        locale: LOCALELIST
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify actual clear source gates and assemble retained speech
        run: |
          command -v ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y ffmpeg)
          python "$PACKAGE/assemble.py" "${{ matrix.locale }}"
      - name: Deliver each completed step and locale immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: ARTIFACTPREFIX-${{ matrix.locale }}
          path: ${{ env.PACKAGE }}/output/
          retention-days: 30
'''
 workflow=workflow.replace('STEP',step).replace('VERSION',args.version).replace('PACKAGE/request.json',package+'/request.json').replace('PACKAGEVALUE',package).replace('ARTIFACTPREFIX',artifactPrefix).replace('REQUESTHASH',sha(out/'request.json')).replace('LOCALELIST',json.dumps(list(result)))
 text(out/'workflow.en.yml',workflow)
 print(json.dumps({'package':str(out),'requestSHA256':sha(out/'request.json'),'workflowSource':str(out/'workflow.en.yml'),'workflowTargetRelative':f'.github/workflows/fate-v2-master-{step}-{args.version}.yml','artifactPrefix':artifactPrefix,'step':step,'locales':list(result),'newProviderCalls':0}))
if __name__=='__main__':main()
