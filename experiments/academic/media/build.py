"""Bounded, new Academic pilot media only. No production registry edits."""
from pathlib import Path
import argparse, hashlib, json, math, subprocess, sys
from policy import ROOT, POLICY, SAMPLE, policy_record
from gemini_tts import synthesize_segments, GAP_MS, MODEL

LOCALES = ['ar-EG', 'ar-MSA', 'ar-Gulf', 'en']
def package(locale):
    if locale not in LOCALES: raise ValueError('Invalid locale')
    return json.loads((ROOT / f'experiments/academic/content/{locale}.json').read_text())

def scenes_for(data):
    return [dict(id='intro', title=data['title'], detail=data['goals'][0], spoken=data['intro'], diagram='customer')] + [dict(id=s['id'], title=s['title'], detail=s['reflection'], spoken=s['text'], diagram=s['id']) for s in data['sections']] + [dict(id='application', title=data['example']['title'], detail=data['summary'][0], spoken=data['assignment']['prompt'], diagram='decision')]

def fingerprint(locale, sample=False):
    data=package(locale)
    h=hashlib.sha256(json.dumps({'scenes':scenes_for(data),'sample':SAMPLE if sample else None,'policy':policy_record(),'locale':locale,'voice':'Charon','model':MODEL},ensure_ascii=False,sort_keys=True).encode())
    for file in [Path(__file__),Path(__file__).with_name('policy.py'),Path(__file__).parent/'vendor/gemini_tts.py',ROOT/'remotion/src/academic/index.tsx',ROOT/'experiments/academic/Diagram.tsx',ROOT/'remotion/scripts/lib/locale_profiles.py']:
        h.update(file.read_bytes())
    return h.hexdigest()

def run(args):
    data=package(args.locale); digest=fingerprint(args.locale,args.sample)
    if args.fingerprint: print(digest); return
    work=ROOT/f'tmp/academic-media/{args.locale}/{digest}'
    work.mkdir(parents=True,exist_ok=True)
    scenes=scenes_for(data)
    if args.sample:
        if args.locale!='ar-EG': raise ValueError('Calibration sample is Egyptian only')
        scenes=[dict(id='pronunciation',title=data['title'],detail=data['goals'][0],spoken=SAMPLE,diagram='customer')]
    durations=synthesize_segments([(i,'Charon',s['spoken'],'Preserve meaning and all numbers; natural academic teaching.') for i,s in enumerate(scenes)],str(work/'audio'),str(work/'audio/master.mp3'),locale=None if args.locale=='ar-EG' else args.locale,narration_policy=POLICY if args.locale=='ar-EG' else None)
    frames=[math.ceil((d+(GAP_MS/1000 if i<len(durations)-1 else .5))*30) for i,d in enumerate(durations)]
    props={'locale':args.locale,'title':data['title'],'scenes':scenes,'sceneFrames':frames}
    (work/'props.json').write_text(json.dumps(props,ensure_ascii=False))
    silent=work/'silent.mp4';output=work/'lesson.mp4'
    subprocess.run(['npx','--no-install','remotion','render','src/academic/index.tsx','academic-pilot',str(silent),'--props',str(work/'props.json'),'--codec=h264','--crf=20','--concurrency=2'],cwd=ROOT/'remotion',check=True)
    subprocess.run(['ffmpeg','-y','-i',str(silent),'-i',str(work/'audio/master.mp3'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',str(output)],check=True,capture_output=True)
    streams=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(output)]))
    if not any(s['codec_type']=='audio' for s in streams['streams']):raise RuntimeError('Audio stream absent')
    if not any(s['codec_type']=='video' for s in streams['streams']):raise RuntimeError('Video stream absent')
    (work/'transcript.txt').write_text('\n\n'.join(s['spoken'] for s in scenes))
    receipt={'lessonId':data['id'],'locale':args.locale,'fingerprint':digest,'durationSeconds':float(streams['format']['duration']),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'audioAcceptance':'pending-listener-review','videoPath':str(output),'sample':args.sample}
    (work/'receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--locale',choices=LOCALES,required=True);p.add_argument('--sample',action='store_true');p.add_argument('--fingerprint',action='store_true');run(p.parse_args())
