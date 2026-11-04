"""Prepare one localized walkthrough narration, after the course completion gate."""
import argparse,hashlib,json,os,sys,time,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--locale',required=True,choices=p.LOCALES);a=ap.parse_args()
    request=p.read(ROOT/'walkthrough-request.json');scripts=p.read(ROOT/'walkthroughs.json')
    assert request['action']=='produce-four-language-walkthrough' and request['courseMediaVerified'] is True
    assert request['scriptHash']==p.digest(scripts) and set(request['locales'])==set(p.LOCALES)
    folder=ROOT/'walkthrough-output'/a.locale;folder.mkdir(parents=True,exist_ok=True)
    media=p.read(ROOT.parent/'course/manifest.json')['media']
    scenes=[dict(s,caption=s['narration']) for s in scripts['locales'][a.locale]]
    assert [s['id'] for s in scenes]==[s['id'] for s in scripts['locales']['en']]
    keys=[os.environ.get(n) for n in ['GEMINI_API_KEY','GEMINI_API_KEY_2','GEMINI_API_KEY_3','GEMINI_API_KEY_4'] if os.environ.get(n)]
    assert keys;key=keys[list(p.LOCALES).index(a.locale)%len(keys)]
    for i,scene in enumerate(scenes):
        p.synthesize(scene,a.locale,media,key,folder/'audio'/(p.audio_key(scene,a.locale,media)+'.wav'))
        if i<len(scenes)-1:time.sleep(media['requestGapSeconds'])
    lesson={'locale':a.locale,'dir':'rtl' if a.locale=='ar-EG' else 'ltr','subtitle':'Masaarat course walkthrough','eyebrow':'MASAARAT','scenes':scenes}
    props=p.assemble(lesson,media,folder)
    receipt={'locale':a.locale,'scriptHash':p.digest(scripts),'audioKeys':[p.audio_key(s,a.locale,media) for s in scenes],
      'audioSha256':hashlib.sha256((folder/'master.wav').read_bytes()).hexdigest(),'audioGenerated':True,
      'seconds':props['durationInFrames']/media['fps'],'captions':'proportional sentence timings','videoGenerated':False,'published':False}
    p.write(folder/'receipt.json',receipt)
    # Reuse the existing real-audio comparison, without invoking a course render.
    import media as review
    p.ROOT=ROOT/'walkthrough-package';p.OUT=ROOT/'walkthrough-output'
    p.write(p.ROOT/'course'/(a.locale+'.json'),lesson)
    p.write(p.ROOT/'course/manifest.json',{'media':media})
    result=review.check_audio(a.locale)
    if not result['passed']:
        ids={x['scene'] for x in result['issues'] if x.get('severity')=='critical'}
        assert ids and ids<={s['id'] for s in scenes},'Walkthrough audio review needs interpretation'
        for scene in scenes:
            if scene['id'] not in ids:continue
            path=folder/'audio'/(p.audio_key(scene,a.locale,media)+'.wav')
            backup=folder/'rejected-audio'/path.name;backup.parent.mkdir(exist_ok=True);shutil.copy2(path,backup);path.unlink()
            p.synthesize(scene,a.locale,media,key,path)
        props=p.assemble(lesson,media,folder)
        result=review.check_audio(a.locale)
        assert result['passed'],'Walkthrough narration failed after one quality repair'
    receipt=p.read(folder/'receipt.json')
    receipt.update(audioSha256=hashlib.sha256((folder/'master.wav').read_bytes()).hexdigest(),seconds=props['durationInFrames']/media['fps'])
    p.write(folder/'receipt.json',receipt)
    print(json.dumps(receipt))
if __name__=='__main__':main()
