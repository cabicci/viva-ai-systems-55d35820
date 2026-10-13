"""Download immutable run artifacts into durable local work folders; no cloud writes."""
import argparse,json,os,shutil,subprocess,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
GH=os.environ.get('GH_PATH') or shutil.which('gh') or 'E:/DevTools/GitHubCLI/gh.exe'
REPO='cabicci/viva-ai-systems-55d35820'
def call(args):
    return subprocess.check_output([GH,*args],cwd=ROOT.parents[2],text=True,encoding='utf-8')

def download(run,name,target):
    base=(ROOT/'private/incoming'/run).resolve();base.mkdir(parents=True,exist_ok=True)
    for attempt in range(3):
        stage=Path(tempfile.mkdtemp(prefix=target.name+'-download-',dir=base)).resolve()
        try:
            subprocess.run([GH,'run','download',run,'-R',REPO,'-n',name,'-D',str(stage)],cwd=ROOT,check=True)
            shutil.copytree(stage,target,dirs_exist_ok=True)
            assert stage.is_relative_to(base) and '-download-' in stage.name
            shutil.rmtree(stage)
            return
        except subprocess.CalledProcessError:
            if attempt==2:raise
            time.sleep(2*(attempt+1))
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--run',required=True);ap.add_argument('--kind',choices=['author','media','illustrations'],required=True);ap.add_argument('--limit',type=int);a=ap.parse_args()
    result=json.loads(call(['api',f'repos/{REPO}/actions/runs/{a.run}/artifacts','--paginate']))
    count=0
    for artifact in result['artifacts']:
        name=artifact['name'];prefix='soil-'+a.kind+'-'
        if not name.startswith(prefix) or artifact['expired']:continue
        lid=name[len(prefix):];target=ROOT/'private/incoming'/a.run/str(artifact['id'])
        marker=target/'.received'
        if marker.exists():continue
        download(a.run,name,target)
        dest=ROOT/('output' if a.kind=='author' else 'packages')/lid
        if a.kind=='illustrations':dest=dest/'output/lesson-visuals'
        if a.kind=='author':
            from restore_author import accepted
            if accepted(dest,lid) and not accepted(target,lid):
                if (target/'cache').exists():shutil.copytree(target/'cache',dest/'cache',dirs_exist_ok=True)
            else:shutil.copytree(target,dest,dirs_exist_ok=True)
        else:shutil.copytree(target,dest,dirs_exist_ok=True)
        marker.write_text(name,encoding='utf-8');count+=1
        print(json.dumps({'received':name,'run':a.run}),flush=True)
        if a.limit and count>=a.limit:break
    print(json.dumps({'run':a.run,'kind':a.kind,'newArtifacts':count}))
if __name__=='__main__':main()
