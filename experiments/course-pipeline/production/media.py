"""Run shared Gemini/Remotion engine for one explicitly authorized, reviewed lesson."""
import argparse,hashlib,sys,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p
import generate_visuals as g
import visual_quality as q
base_engine=p.engine_hash
base_run=p.run
def engine_hash():
    return p.digest({'shared':base_engine(),'batchMedia':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                     'imageGenerator':hashlib.sha256(Path(g.__file__).read_bytes()).hexdigest(),
                     'imageQA':hashlib.sha256(Path(q.__file__).read_bytes()).hexdigest(),
                     'renderer':hashlib.sha256((p.REPO/'remotion/src/course-curriculum/index.tsx').read_bytes()).hexdigest()})
def run(command,**kwargs):
    command=['src/course-curriculum/index.tsx' if str(x)=='src/course-pipeline/index.tsx' else x for x in command]
    return base_run(command,**kwargs)
p.engine_hash=engine_hash;p.run=run

def configure(lid):
    p.ROOT=ROOT/'packages'/lid;p.OUT=p.ROOT/'output';p.LOCALES=tuple(p.read(p.ROOT/'course/manifest.json')['locales'])
def prepare(lid):
    configure(lid);p.validate()
    p.write(p.ROOT/'pilot-request.json',{'batchId':'SOIL-FULL-MEDIA-20261013-01','lessonId':lid,'locales':list(p.LOCALES),
                                       'action':'generate-preview-only','snapshot':p.snapshot()})
def images():
    import os
    plan=p.read(p.ROOT/'course/visuals.json');contract=p.read(p.ROOT/'course/visual-contract.json')
    assert len(plan['assets'])==3 and contract['maxRepairsPerAsset']==1
    dest=p.OUT/'visuals';dest.mkdir(parents=True,exist_ok=True)
    key=next((os.environ.get(n) for n in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3'] if os.environ.get(n)),None)
    assert key
    old=p.read(dest/'receipt.json') if (dest/'receipt.json').exists() else {}
    if old.get('qualityPassed') and old.get('planHash')==p.digest(plan) and old.get('qualityContractHash')==p.digest(contract):
        if all(hashlib.sha256((dest/a['filename']).read_bytes()).hexdigest()==a['sha256'] for a in old['assets']):
            print('Reuse all verified visual assets',flush=True);return
    receipt={'provider':'gemini','model':plan['model'],'planHash':p.digest(plan),'qualityContractHash':p.digest(contract),
             'assets':[],'generated':False,'qualityPassed':False,'ownerAccepted':False}
    for asset in plan['assets']:
        entry=g.generate(plan,asset,key,dest);review=q.check(asset,dest/entry['filename'],contract,key)
        if not review['passed']:
            issues=[c['reason'] for c in review['checks'] if not c['pass']]
            entry=g.generate(plan,{**asset,'subject':asset['subject']+'\nRequired corrections: '+str(issues)},key,dest)
            entry['repairCount']=1;review=q.check(asset,dest/entry['filename'],contract,key)
        entry['automatedQuality']=review;receipt['assets'].append(entry);p.write(dest/'receipt.json',receipt)
        assert review['passed'],'Visual failed after bounded repair: '+asset['id']
        print(asset['id']+': image quality passed',flush=True)
    receipt.update(generated=True,qualityPassed=True);p.write(dest/'receipt.json',receipt)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('command',choices=['prepare','produce']);ap.add_argument('--lesson',required=True)
    a=ap.parse_args()
    request=p.read(ROOT/'media-request.json')
    assert a.lesson in request['lessons'] and request['action']=='produce-full-course-preview'
    configure(a.lesson)
    reviewed=p.read(p.ROOT/'authoring-receipt.json')
    assert {loc:reviewed['locales'][loc]['contentHash'] for loc in reviewed['locales']}==request['contentHashes'][a.lesson], 'Unexpected authored content'
    if a.command=='prepare':prepare(a.lesson);return
    assert p.read(p.ROOT/'pilot-request.json')['snapshot']==p.snapshot(),'Changed media request'
    reviewed=p.read(p.ROOT/'authoring-receipt.json')
    assert reviewed['status']=='authored-and-automatically-checked'
    images()
    for locale in p.LOCALES:
        p.produce(locale)
        silent=p.OUT/locale/'silent.mp4'
        if silent.exists():silent.unlink()
    print(a.lesson+': all four media cells completed',flush=True)
if __name__=='__main__':main()
