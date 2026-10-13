"""Build an honest incremental archive from received, verified artifacts."""
import argparse,hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p
def sha(file):return hashlib.sha256(file.read_bytes()).hexdigest()
def copy(source,dest):
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists() or sha(source)!=sha(dest):shutil.copy2(source,dest)
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--dest',type=Path,required=True);a=ap.parse_args()
    dest=a.dest.resolve();dest.mkdir(parents=True,exist_ok=True)
    entries=[];lessons=[];count=0
    for pkg in sorted((ROOT/'packages').glob('SOIL-*')):
        for f in (pkg/'course').glob('*.json'):copy(f,dest/'lessons'/pkg.name/f.name)
        if (pkg/'authoring-receipt.json').exists():copy(pkg/'authoring-receipt.json',dest/'lessons'/pkg.name/'authoring-receipt.json')
        for locale in ('ar-EG','en','it','de'):
            folder=pkg/'output'/locale
            if not (folder/'receipt.json').exists():continue
            receipt=p.read(folder/'receipt.json')
            if not receipt.get('generated') or not receipt.get('automatedAudioReview',{}).get('passed'):continue
            video=folder/'lesson.mp4'
            assert video.exists() and sha(video)==receipt['verification']['sha256'],'Video integrity mismatch'
            for f in folder.rglob('*'):
                if f.is_file() and f.name!='silent.mp4':copy(f,dest/'media'/pkg.name/locale/f.relative_to(folder))
            count+=1;lessons.append({'id':pkg.name,'locale':locale,'duration':receipt['verification']['durationSeconds'],'verified':True})
        for f in (pkg/'output/visuals').rglob('*'):
            if f.is_file():copy(f,dest/'media'/pkg.name/'visuals'/f.relative_to(pkg/'output/visuals'))
    for f in (ROOT/'private/assessments').rglob('*.json'):
        copy(f,dest/'trainer-only'/f.relative_to(ROOT/'private/assessments'))
    for name in ('README.md','machine-reference.json','editorial-review.json','editorial-patches.json','primary-reference-notes.json','blueprints.json','activities.json','visual-blueprints.json','verification.json'):
        copy(ROOT/name,dest/'reports'/name)
    for f in dest.rglob('*'):
        if f.is_file() and f.name!='archive-manifest.json':entries.append({'path':f.relative_to(dest).as_posix(),'bytes':f.stat().st_size,'sha256':sha(f)})
    result={'courseId':'SOIL','newVideos':count,'expectedNewVideos':116,'existingPilotVideos':4,
            'status':'media-complete' if count==116 else 'in-progress','published':False,
            'institutionalApproval':False,'liveAssistantTested':False,'media':lessons,'files':entries}
    p.write(dest/'archive-manifest.json',result)
    print(json.dumps({'newVideos':count,'expected':116,'files':len(entries),'archive':str(dest)}))
if __name__=='__main__':main()
