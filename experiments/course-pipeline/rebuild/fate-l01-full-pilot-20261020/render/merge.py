from pathlib import Path
import sys,json,subprocess,os,hashlib
R=Path(__file__).parent;lang=sys.argv[1];run=os.environ['GITHUB_RUN_ID'];repo=os.environ['GITHUB_REPOSITORY'];C=R/'collected';C.mkdir(exist_ok=True);O=R/'final';O.mkdir(exist_ok=True)
req=json.loads((R/'render-request.json').read_text());records=[];offset=0;captions=[];words=[];concat=[]
for i in range(1,11):
 sid=f'{lang}-L01-S{i:02d}';dest=C/sid;source=str(req.get('sourceRuns',{}).get(sid,run))
 subprocess.run(['gh','run','download',source,'--repo',repo,'--name','fate-l01-render-'+sid,'--dir',str(dest)],check=True)
 video=dest/(sid+'.mp4');assert video.exists();probe=json.loads((dest/'probe.json').read_text());meta=json.loads((dest/'timing-and-inputs.json').read_text());duration=float(probe['format']['duration']);records.append({'scene':sid,'start':offset,'duration':duration,'renderRun':source,'sha256':hashlib.sha256(video.read_bytes()).hexdigest()})
 for c in meta['captions']:captions.append({**c,'start':c['start']+offset,'end':c['end']+offset})
 for w in meta['wordTimings']:words.append({**w,'start':w['start']+offset,'end':w['end']+offset})
 concat.append("file '"+video.resolve().as_posix()+"'");offset+=duration
(O/'concat.txt').write_text('\n'.join(concat)+'\n');out=O/f'L01-{lang}.mp4'
subprocess.run(['ffmpeg','-hide_banner','-v','error','-f','concat','-safe','0','-i',str(O/'concat.txt'),'-c','copy','-movflags','+faststart',str(out)],check=True)
probe=subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out)]);(O/f'L01-{lang}.probe.json').write_bytes(probe)
def stamp(x):
 ms=round(x*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
(O/f'L01-{lang}.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for c in captions)+'\n',encoding='utf-8')
(O/f'L01-{lang}.timing.json').write_text(json.dumps({'chapters':records,'captions':captions,'words':words,'method':'Actual recording model timestamps, placed using measured rendered scene durations; approximate not phonetic forced alignment'},ensure_ascii=False,indent=2),encoding='utf-8')
record={'execution':'GitHub Actions','run':run,'language':lang,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'durationSeconds':float(json.loads(probe)['format']['duration']),'chapters':records,'humanPlaybackReviewed':False,'publication':'not published'}
(O/f'L01-{lang}.verification.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
