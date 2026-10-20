"""Audio-grounded timing review in short overlapping signal windows; zero speech regeneration."""
from pathlib import Path
import json,os,sys,wave,io,base64,urllib.request,hashlib,math
R=Path(__file__).parent;D=R/'base';O=R/'output';O.mkdir(exist_ok=True);sid='L01-S'+sys.argv[1];assert sid in ['L01-S01','L01-S03','L01-S04','L01-S08','L01-S10']
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def call(body=None):
 u='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash'+(':generateContent' if body else '')
 req=urllib.request.Request(u,data=json.dumps(body,ensure_ascii=False).encode() if body else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=240) as r:return json.load(r)
a=call();save('model-availability.json',a);assert 'generateContent' in a.get('supportedGenerationMethods',[])
w=(D/(sid+'.wav')).read_bytes();sha=hashlib.sha256(w).hexdigest();meta=json.loads((D/(sid+'.audio.json')).read_text());assert sha==meta['wavSHA256']
with wave.open(io.BytesIO(w),'rb') as f:rate=f.getframerate();params=f.getparams();raw=f.readframes(f.getnframes());width=f.getnchannels()*f.getsampwidth();duration=f.getnframes()/rate
state={'scene':sid,'audioSHA256':sha,'speechRegenerated':False,'maxCalls':math.ceil(duration/16),'attempts':[],'reason':'Review possible ASR omissions/mispronunciations and incorrect full-clip time expansion. Reanalyze short actual audio windows.'};save('review.json',state);words=[];captions=[]
for k in range(math.ceil(duration/16)):
 a=k*16;b=min(duration,a+16);start=max(0,a-.65);end=min(duration,b+.65);buf=io.BytesIO()
 with wave.open(buf,'wb') as f:f.setparams(params);f.writeframes(raw[round(start*rate)*width:round(end*rate)*width])
 clip=buf.getvalue();(O/f'{sid}-chunk-{k}.wav').write_bytes(clip)
 instruction='Listen to this actual Egyptian Arabic audio clip. Its exact duration is '+str(end-start)+' seconds. Return JSON with words [{word,start,end}] for every actually audible word and captions [{text,start,end}] of up to 9 words. Times are relative to THIS CLIP. Preserve spoken numbers and negation. Do not stretch timestamps, invent omitted words or infer from any script. Report uncertain words in uncertainty array. This is automatic audio analysis, not manual human listening or guaranteed forced alignment.'
 payload={'contents':[{'parts':[{'text':instruction},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(clip).decode()}}]}],'generationConfig':{'responseMimeType':'application/json','temperature':0.0}}
 save(f'{sid}-chunk-{k}.request.json',{'instruction':instruction,'clipSHA256':hashlib.sha256(clip).hexdigest(),'start':start,'end':end});state['attempts'].append({'chunk':k,'status':'STARTED_OUTCOME_UNKNOWN'});save('review.json',state)
 res=call(payload);save(f'{sid}-chunk-{k}.response.json',res);obj=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')))
 for item in obj['words']:
  assert 0<=item['start']<item['end']<=end-start+.2
  mid=start+(item['start']+item['end'])/2
  if a<=mid<b:words.append({'word':item['word'],'start':max(0,start+item['start']),'end':min(duration,start+item['end'])})
 state['attempts'][-1].update(status='PRESERVED',uncertainty=obj.get('uncertainty',[]));save('review.json',state)
words.sort(key=lambda x:x['start'])
# Caption display groups preserve measured word boundaries; no timing is calculated from text length.
for k in range(0,len(words),8):
 group=words[k:k+8];captions.append({'text':' '.join(w['word'] for w in group),'start':group[0]['start'],'end':group[-1]['end']})
t={'transcript':' '.join(x['word'] for x in words),'words':words,'captions':captions,'issues':state['attempts'],'provenance':{'actualAudioSHA256':sha,'durationSeconds':duration,'method':'Actual audio analyzed in 16-second core windows with 650ms context overlap; midpoint de-duplication; original unchanged','wordAccuracy':'Approximate automatic timing; no human accent certification','structuralIssues':[]}};save(sid+'.timing.json',t);state['status']='COMPLETE_REQUIRES_REVIEW';save('review.json',state)
