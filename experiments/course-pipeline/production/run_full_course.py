"""Coordinate this authorized production run. No deployment, indexing or learner messages."""
import argparse,hashlib,json,os,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
GH=os.environ.get('GH_PATH') or 'E:/DevTools/GitHubCLI/gh.exe'
REMOTE='cabicci/viva-ai-systems-55d35820'
STATE=ROOT/'private/orchestration.json'
def shell(args,**kw):
    return subprocess.check_output([str(x) for x in args],cwd=REPO,text=True,encoding='utf-8',**kw)
def gh(*args):return json.loads(shell([GH,*args]))
def script(name,*args):return shell([sys.executable,ROOT/name,*args])
def write(file,data):
    file.parent.mkdir(parents=True,exist_ok=True);file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def save(state):write(STATE,state)
def log(stage,**data):print(json.dumps({'stage':stage,**data},ensure_ascii=False),flush=True)
def commit_request(payload):
    if shell(['git','diff','--cached','--name-only']).strip():raise RuntimeError('Staged work needs attention before media request')
    request=ROOT/'media-request.json';write(request,payload)
    shell(['git','add','experiments/course-pipeline/production/media-request.json'])
    shell(['git','commit','-m','Request bounded soil media batch '+payload['batchId']])
    sha=shell(['git','rev-parse','HEAD']).strip()
    shell(['git','push','origin','work/soil-course-pipeline-20261013'])
    return sha
def run_for(sha):
    runs=gh('api',f'repos/{REMOTE}/actions/runs?head_sha={sha}&per_page=100')['workflow_runs']
    for r in runs:
        if r['head_sha']==sha and r['name']=='Soil full-course four-language media':return {'databaseId':r['id'],'status':r['status'],'conclusion':r['conclusion']}
def payload(ids,state,kind):
    hashes={}
    for lid in ids:
        r=json.loads((ROOT/'output'/lid/'authoring-receipt.json').read_text(encoding='utf-8'))
        hashes[lid]={loc:x['contentHash'] for loc,x in r['locales'].items()}
    return {'action':'produce-full-course-preview','batchId':kind+'-'+state['authorRun'],
      'authorRun':int(state['authorRun']),'lessons':ids,'contentHashes':hashes,
      'locales':['ar-EG','en','it','de'],'publish':False}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--author-run',required=True);ap.add_argument('--archive',required=True);a=ap.parse_args()
    state=json.loads(STATE.read_text(encoding='utf-8')) if STATE.exists() else {}
    if state.get('authorRun')!=a.author_run:state={'authorRun':a.author_run,'archive':a.archive}
    plan=json.loads((ROOT.parent/'planning/curriculum-map.json').read_text(encoding='utf-8'))
    teaching=[x['id'] for x in plan['lessons'] if x['type']=='lesson' and x['id']!='SOIL-U1-L03']
    last=None
    while True:
        status=gh('run','view',a.author_run,'-R',REMOTE,'--json','status,conclusion')
        script('sync.py','--run',a.author_run,'--kind','author')
        script('build_packages.py')
        report=json.loads(script('verify_course.py'))
        ready=[r['lessonId'] for r in json.loads((ROOT/'verification.json').read_text(encoding='utf-8'))['lessons'] if r['status']=='authoring-verified']
        if len([x for x in teaching if x in ready])>=4 and not state.get('initialSha'):
            ids=[x for x in teaching if x in ready][:4]
            state['initialIds']=ids;state['initialSha']=commit_request(payload(ids,state,'SOIL-FIRST'))
            save(state);log('initial-media-requested',lessons=ids)
        for label in ['initial','full']:
            if state.get(label+'Sha') and not state.get(label+'Run'):
                run=run_for(state[label+'Sha'])
                if run:state[label+'Run']=run['databaseId'];save(state)
            if state.get(label+'Run'):
                script('sync.py','--run',str(state[label+'Run']),'--kind','media')
                media_status=gh('run','view',str(state[label+'Run']),'-R',REMOTE,'--json','status,conclusion')
                state[label+'Status']=media_status
                if media_status['status']=='completed' and media_status['conclusion']!='success':
                    save(state);log('media-needs-attention',run=state[label+'Run'],status=media_status);return 2
        if status['status']=='completed':
            if status['conclusion']!='success':
                successor=state.get('successorRun')
                if successor and str(successor)!=a.author_run:
                    state['priorAuthorRun']=a.author_run;a.author_run=str(successor);state['authorRun']=a.author_run;state.pop('successorRun',None)
                    save(state);log('resuming-cached-completion-pass',run=a.author_run);continue
                save(state);log('authoring-needs-attention',run=a.author_run,status=status);return 2
            if len(ready)!=33:raise RuntimeError('Successful authoring run has incomplete verified content')
            if not state.get('fullSha'):
                script('build_corpus.py')
                state['fullSha']=commit_request(payload(teaching,state,'SOIL-FULL'))
                save(state);log('full-media-requested',lessons=len(teaching))
        script('build_packages.py')
        script('archive.py','--dest',a.archive)
        report=json.loads(script('verify_course.py'))
        current=(len(ready),report['newVideosVerified'])
        if current!=last:log('progress',lessons=current[0],videos=current[1]);last=current
        state['verifiedLessons']=current[0];state['verifiedVideos']=current[1];save(state)
        if report['status']=='complete':
            log('technical-production-complete',archive=a.archive);return 0
        time.sleep(45)
if __name__=='__main__':raise SystemExit(main())
