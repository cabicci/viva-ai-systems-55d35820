"""Replace an invalid timing clock using actual WAV word timestamps, never time scaling."""
from pathlib import Path
import json,os,hashlib,subprocess,wave,re,difflib,datetime
from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download
R=Path(__file__).parent;O=R/'output';O.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
M=json.loads((R/'request.json').read_text(encoding='utf8'))
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
def get(run,name,folder):
 folder.mkdir(exist_ok=False,parents=True)
 subprocess.run(['gh','run','download',str(run),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',name,'--dir',str(folder)],check=True,capture_output=True)
get(40254734962,'fate-v2-sync38-S01-01-en',O/'previous')
C=json.loads((O/'previous/input.json').read_text(encoding='utf8'))
V=json.loads((O/'previous/verification.json').read_text(encoding='utf8'));assert V['reviewStatus']=='clear'
get(40254395212,'fate-v2-full38-original-S01-01-en',O/'original')
source=O/'original/S01-01-en.wav';assert sha(source.read_bytes())==V['audioSHA256']
with wave.open(str(source),'rb') as f:duration=f.getnframes()/f.getframerate()
assert abs(duration-V['durationSeconds'])<.0001
model_id='Systran/faster-whisper-small.en';revision='d1d751a5f8271d482d14ca55d9e2deeebbae577f'
model_path=snapshot_download(model_id,revision=revision,allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json'])
engine=WhisperModel(model_path,device='cpu',compute_type='int8',cpu_threads=2)
segments,info=engine.transcribe(str(source),language='en',beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
segments=list(segments);words=[{'word':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for s in segments for w in s.words]
problems=[];prev=-1
for w in words:
 if not 0<=w['start']<w['end']<=duration+.05 or w['start']<prev-.05:problems.append('invalid actual-word clock')
 prev=w['start']
norm=lambda x:re.sub(r'[^a-z0-9 ]',' ',x.lower()).split()
heard=' '.join(w['word'] for w in words);reference=C['spokenText'];match=difflib.SequenceMatcher(a=norm(reference),b=norm(heard)).ratio()
if match<.92:problems.append('ASR/reference difference needs reconciliation')
if norm(heard).count('not')!=norm(reference).count('not') or norm(heard).count('never')!=norm(reference).count('never'):problems.append('critical negation transcript difference')
tokens=[re.sub('[^a-z0-9]','',w['word'].lower()) for w in words]
actions=[]
for id,phrase in [('sample-result',['the','analysis']),('exposure',['exposure','asks']),('risk-evidence',['risk','assessment'])]:
 indexes=[i for i in range(len(tokens)-len(phrase)+1) if tokens[i:i+len(phrase)]==phrase]
 if len(indexes)!=1:problems.append('unresolved acoustic anchor '+id);continue
 i=indexes[0];end=min(len(words)-1,i+7)
 actions.append({'id':id,'start':words[i]['start'],'end':words[end]['end'],'heardAnchor':' '.join(w['word'] for w in words[i:end+1]),'uncertaintySeconds':.5})
captions=[]
for i in range(0,len(words),9):
 chunk=words[i:i+9];captions.append({'text':' '.join(w['word'] for w in chunk),'start':chunk[0]['start'],'end':chunk[-1]['end']})
if words and words[-1]['end']<duration-2:problems.append('word clock ends before recording tail')
timing={'words':words,'captions':captions,'actions':actions,'issues':problems,'method':'Actual-WAV faster-whisper1.2.1 small.en word timestamps; model revision pinned. Not phonetic forced alignment or text-length estimates.','referenceAgreement':match,'modelID':model_id,'modelRevision':revision,'durationSeconds':duration}
(O/'timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
V.update(timingProblems=problems,readyForRenderReview=not problems,method=timing['method'],previousInvalidClockPreserved='previous/timing.json',newSpeechCalls=0)
(O/'verification.json').write_text(json.dumps(V,indent=2)+'\n',encoding='utf8')
(O/'asr-provenance.en.json').write_text(json.dumps({'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceSHA256':sha(source.read_bytes()),'model':model_id,'revision':revision,'language':info.language,'wordCount':len(words),'referenceAgreement':match,'noTimeScaling':True,'newSpeechCalls':0},indent=2)+'\n',encoding='utf8')
print(json.dumps({'words':len(words),'durationSeconds':duration,'referenceAgreement':match,'problems':problems}))
assert not problems,'Preserve recording and reconcile timing metadata only'
