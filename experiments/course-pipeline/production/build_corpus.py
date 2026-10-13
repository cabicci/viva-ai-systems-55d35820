"""Prepare server-only retrieval records, excluding assessments and learner records."""
import hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p
def build():
    records=[]
    for package in sorted((ROOT/'packages').glob('SOIL-*')):
        receipt=p.read(package/'authoring-receipt.json')
        if receipt.get('status')!='authored-and-automatically-checked':continue
        manifest=p.read(package/'course/manifest.json')
        for locale in manifest['locales']:
            lesson=p.read(package/'course'/(locale+'.json'))
            for scene in lesson['scenes']:
                text='\n\n'.join(scene[k] for k in ('title','lead','explanation','example','takeaway'))
                records.append({'courseId':'SOIL','lessonId':lesson['lessonId'],'locale':locale,'sectionId':scene['id'],
                  'audience':'learner','content':text,'pages':scene['sourcePages'],'sourceHash':manifest['source']['sha256'],
                  'contentHash':hashlib.sha256(text.encode()).hexdigest(),'releaseApproved':False})
    for locale in p.LOCALES:
        lesson=p.content(locale)
        for scene in lesson['scenes']:
            text='\n\n'.join(scene[k] for k in ('title','lead','example','takeaway'))
            records.append({'courseId':'SOIL','lessonId':lesson['lessonId'],'locale':locale,'sectionId':scene['id'],
              'audience':'learner','content':text,'pages':[4,5,6,7,8,9],
              'sourceHash':p.read(ROOT.parent/'course/manifest.json')['source']['sha256'],
              'contentHash':hashlib.sha256(text.encode()).hexdigest(),'releaseApproved':False})
    out={'courseId':'SOIL','status':'prepared-not-indexed','expectedChunks':824,'chunks':records,
         'includesTrainerAnswers':False,'includesLearnerData':False,'liveEnabled':False}
    p.write(ROOT/'private/assistant-corpus.json',out)
    print(json.dumps({'preparedChunks':len(records),'expected':824,'indexed':False,'live':False}))
if __name__=='__main__':build()
