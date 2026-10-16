"""Verify authoring, localization, source lineage and received media independently."""
import hashlib,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p
from media_current import current
from illustration_distinct import verified as art_verified
from lesson_art import ready as art_ready
from arabic_review import reviewed as arabic_reviewed
def main():
    plan=p.read(ROOT.parent/'planning/curriculum-map.json');blueprints=p.read(ROOT/'blueprints.json');activities=p.read(ROOT/'activities.json')
    results=[];video_count=0;errors=[]
    for spec in plan['lessons']:
        lid=spec['id']
        if lid=='SOIL-U1-L03':
            results.append({'lessonId':lid,'status':'reused-pilot'});continue
        folder=ROOT/'output'/lid;pkg=ROOT/'packages'/lid
        if not (folder/'authoring-receipt.json').exists():
            results.append({'lessonId':lid,'status':'pending'});continue
        receipt=p.read(folder/'authoring-receipt.json')
        if receipt.get('status')!='authored-and-automatically-checked' or receipt.get('arEGNarrationStyle')!='egyptian-validated' or receipt.get('canonicalActivityHash')!=p.digest(activities[lid]) or receipt.get('canonicalNarrationHash')!=p.digest(blueprints[lid]):
            results.append({'lessonId':lid,'status':'pending-current-revision'});continue
        try:
            en=p.read(folder/'en.json')
            assert en['activity']==activities[lid], 'Canonical activity mismatch'
            assert [s['narration'] for s in en['scenes']]==blueprints[lid],'Canonical narration mismatch'
            assert len(en['scenes'])==6 and len(en['quiz'])==4
            for loc in ['en','ar-EG','it','de']:
                data=p.read(folder/(loc+'.json'))
                assert p.digest(data)==receipt['locales'][loc]['contentHash'],'Receipt mismatch'
                assert data['locale']==loc and data['lessonId']==lid
                assert [s['id'] for s in data['scenes']]==[s['id'] for s in en['scenes']]
                assert [s['sourcePages'] for s in data['scenes']]==[s['sourcePages'] for s in en['scenes']]
                assert [q['answer'] for q in data['quiz']]==[q['answer'] for q in en['quiz']]
                if loc!='ar-EG':assert not re.search(r'[\u0600-\u06ff]',json.dumps(data,ensure_ascii=False))
                if (pkg/'course'/(loc+'.json')).exists():
                    public=p.read(pkg/'course'/(loc+'.json'))
                    assert 'trainerAssessment' not in public and 'visuals' not in public
                if (pkg/'output'/loc/'receipt.json').exists():
                    mr=p.read(pkg/'output'/loc/'receipt.json')
                    if current(pkg,loc):
                        video=pkg/'output'/loc/'lesson.mp4'
                        assert hashlib.sha256(video.read_bytes()).hexdigest()==mr['verification']['sha256']
                        video_count+=1
            results.append({'lessonId':lid,'status':'authoring-verified','mediaExpected':spec['type']=='lesson'})
        except (AssertionError,KeyError,FileNotFoundError) as e:
            errors.append({'lessonId':lid,'error':str(e)})
    done=sum(x['status']=='authoring-verified' for x in results)
    art_ids=list(p.read(ROOT/'lesson-illustrations.json'))
    art_count=sum(3 for lid in art_ids if art_verified(lid))
    arabic_count=sum(arabic_reviewed(x['id']) for x in plan['lessons'])
    report={'status':'complete' if done==33 and video_count==116 and art_count==90 and arabic_count==34 and not errors else 'in-progress',
      'newLessonsVerified':done,'expectedNewLessons':33,'newVideosVerified':video_count,'expectedNewVideos':116,
      'independentIllustrationsGenerated':sum(3 for lid in art_ids if art_ready(lid)),
      'independentIllustrationsVerified':art_count,'expectedIndependentIllustrations':90,
      'arabicEditorialLessonsPassed':arabic_count,'expectedArabicEditorialLessons':34,'humanArabicReview':False,
      'pilotReused':True,'liveAssistantVerified':False,'institutionallyApproved':False,'errors':errors,'lessons':results}
    p.write(ROOT/'verification.json',report)
    print(json.dumps({k:v for k,v in report.items() if k not in ['lessons']}))
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
