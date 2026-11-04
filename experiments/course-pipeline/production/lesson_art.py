"""Independent written-lesson artwork; never substitutes for or regenerates video art/audio."""
import argparse,hashlib,json,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p

def plans(lid):
    authored=p.read(ROOT/'lesson-illustrations.json')
    assert lid in authored and len(authored[lid])==3
    plan=p.read(ROOT.parent/'course/visuals.json')
    video=p.read(ROOT/'visual-blueprints.json').get(lid)
    if video is None:
        assert lid=='SOIL-U1-L03'
        video=[a['subject'] for a in plan['assets']]
    old='\n'.join(video)
    scenes=['tools','zones','mix'] if lid=='SOIL-U1-L03' else ['s02','s04','s06']
    plan['assets']=[{'id':lid.lower()+'-lesson-art-'+str(i+1),'scenes':[scenes[i]],
        'subject':subject+'\nThis is a new standalone written-lesson illustration. Do not recreate, crop, recolor or merely change the camera angle of any video composition below. Use the requested different setting, object grouping and teaching example. VIDEO COMPOSITIONS TO AVOID:\n'+old}
        for i,subject in enumerate(authored[lid])]
    plan['purpose']='written-lesson-only'
    contract={'version':2,'reviewModel':'gemini-2.5-flash','maxRepairsPerAsset':1,
        'global':p.read(ROOT.parent/'course/visual-contract.json')['global'],
        'assets':{a['id']:[{'id':'content','requirement':authored[lid][i]}]
            for i,a in enumerate(plan['assets'])}}
    # Actual picture-to-picture comparison is a separate check; old scenes are
    # generation exclusions, never additional required objects in this contract.
    return plan,contract

def ready(lid):
    plan,contract=plans(lid);dest=ROOT/'packages'/lid/'output/lesson-visuals'
    try:
        receipt=p.read(dest/'receipt.json')
        return (receipt.get('qualityPassed') and receipt['planHash']==p.digest(plan)
            and receipt['qualityContractHash']==p.digest(contract)
            and len(receipt['assets'])==3
            and len({a['sha256'] for a in receipt['assets']})==3
            and all(hashlib.sha256((dest/a['filename']).read_bytes()).hexdigest()==a['sha256'] for a in receipt['assets']))
    except (OSError,KeyError,ValueError):return False

def produce(lid):
    import generate_visuals as g
    import visual_quality as q
    plan,contract=plans(lid);dest=ROOT/'packages'/lid/'output/lesson-visuals';dest.mkdir(parents=True,exist_ok=True)
    if ready(lid):print(lid+': reuse independent lesson art',flush=True);return
    keys=[os.environ.get(n) for n in ['GEMINI_API_KEY','GEMINI_API_KEY_2','GEMINI_API_KEY_3','GEMINI_API_KEY_4'] if os.environ.get(n)]
    assert keys,'Missing image provider credential'
    key=keys[int(hashlib.sha256(lid.encode()).hexdigest()[:8],16)%len(keys)]
    previous=p.read(dest/'receipt.json') if (dest/'receipt.json').exists() else {}
    retained={a['id']:a for a in previous.get('assets',[])} if previous.get('planHash')==p.digest(plan) else {}
    overrides=p.read(ROOT/'illustration-review.json')
    receipt={'lessonId':lid,'purpose':'written-lesson-only','planHash':p.digest(plan),
        'qualityContractHash':p.digest(contract),'generated':False,'qualityPassed':False,'assets':[]}
    for asset in plan['assets']:
        old=retained.get(asset['id'])
        entry=old if old and (dest/old['filename']).exists() and hashlib.sha256((dest/old['filename']).read_bytes()).hexdigest()==old['sha256'] else g.generate(plan,asset,key,dest)
        review=q.check(asset,dest/entry['filename'],contract,key)
        match=next((o for o in overrides if o['sha256']==entry['sha256']),None)
        if match:
            review['originalChecks']=review['checks']
            review['checks']=[{**c,'pass':True,'reason':match['reason']} if c['id'] in match['criteria'] else c for c in review['checks']]
            review['passed']=all(c['pass'] for c in review['checks'])
            entry['agentVisualReview']=match
        if not review['passed']:
            assert entry.get('repairCount',0)<1,'Independent art used its bounded repair; inspect remaining issue: '+asset['id']
            reasons=[c['reason'] for c in review['checks'] if not c['pass']]
            entry=g.generate(plan,{**asset,'subject':asset['subject']+'\nRequired correction: '+json.dumps(reasons)},key,dest)
            entry['repairCount']=1;review=q.check(asset,dest/entry['filename'],contract,key)
        entry['automatedQuality']=review;receipt['assets'].append(entry);p.write(dest/'receipt.json',receipt)
        assert review['passed'],'Lesson illustration needs review after one repair: '+asset['id']
        print(asset['id']+': passed',flush=True)
    assert len({a['sha256'] for a in receipt['assets']})==3
    receipt.update(generated=True,qualityPassed=True);p.write(dest/'receipt.json',receipt)
    if lid=='SOIL-U1-L03':
        from illustration_distinct import compare
        compare(lid)

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--lesson',required=True);a=ap.parse_args()
    req=p.read(ROOT/'illustration-request.json')
    assert req['action']=='produce-independent-lesson-illustrations' and a.lesson in req['lessons']
    assert req['blueprintHash']==hashlib.sha256((ROOT/'lesson-illustrations.json').read_bytes()).hexdigest()
    produce(a.lesson)
