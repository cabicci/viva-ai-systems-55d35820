from pathlib import Path
from selection_contract import review_gate
import os,sys,json,hashlib,subprocess,shutil,wave,math,datetime,re
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(p for p in M['parts'] if p['id']==sys.argv[1]);O=R/'output';O.mkdir();P=R/'public';P.mkdir();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['newProviderCalls']==M['newSpeechCalls']==M['newImageCalls']==M['maxSemanticCalls']==0
cache={}
def get(ref):
 k=(ref['run'],ref['artifact'])
 if k not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True,timeout=120);cache[k]=d
 f=cache[k]/ref['file'];assert sha(f)==ref['sha256'];return f
a=get(C['audio']);image=get(C['image']);clockFile=get(C['clock']);gateFile=get(C['review']);gate=json.loads(gateFile.read_text());clock=json.loads(clockFile.read_text());v=json.loads((a.parent/'verification.json').read_text())
assert gate['status']=='clear' and gate['sourceAudioSHA256']==sha(a)==v['wavSHA256']==clock['sourceAudioSHA256'] and v['model']==v['returnedModelVersion']==M['speechModel']
assert gate['voice']==v['voice']==C['voice'] and gate['textSHA256']==v['textSHA256']==C['textSHA256'] and gate['deliverySHA256']==v['deliverySHA256']==C['deliverySHA256']
assert C['imageReview']['status']=='usable' and C['imageReview']['imageSHA256']==sha(image)
assert sha(R/'contracts.json')==M['contractsSHA256'];contracts=json.loads((R/'contracts.json').read_text());contract=next(x for x in contracts['scenes'] if x['step']==C['step'] and x['sectionID']==C['sectionID']);assert {a['id'] for a in C['actions']}=={a['id'] for a in contract['actions']}
with wave.open(str(a),'rb') as f:assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);frames=f.getnframes();pcm=hashlib.sha256(f.readframes(frames)).hexdigest()
assert sha(get(C['verification']))==C['verification']['sha256'] and pcm==v['pcmSHA256']
review_gate(gate,C,pcm)
duration=frames/24000;assert frames==v['frames']==clock['audioFrames'];words=clock['words'];assert words and all(0<=w['start']<=w['end']<=duration+.05 for w in words)
state={'id':C['id'],'status':'VERIFYING_SAVED_ACTUAL_AUDIO_MAPPING','sourceAudioSHA256':sha(a),'actualClockSHA256':sha(clockFile),'audioGateSHA256':sha(gateFile),'model':M['analysisModel'],'newSpeechCalls':0,'analysisCalls':0,'startedUTC':now()};save('semantic-attempt.en.json',state)
try:
 sourceResponse=get(C['semanticResponse']);res=json.loads(sourceResponse.read_text());save('preserved-semantic-response.en.json',res)
 assert res.get('modelVersion')==M['analysisModel'] and res['candidates'][0].get('finishReason')=='STOP'
 x=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')))
 save('preserved-semantic-result.en.json',x)
 if C['originalPartID']=='S09-04-en':
  assert [(a['id'],a['startWordIndex'],a['endWordIndex']) for a in x['actions']]==[('unit',0,7),('unit',8,17),('unit',18,26),('unit',27,38),('unit',39,48),('mechanisms',49,58),('mechanisms',59,65),('conditions',66,77),('conditions',78,106)]
  x['actions']=[x['actions'][i] for i in [0,5,7]]
  assert x['captions'][10]['startWordIndex']==78 and x['captions'][10]['endWordIndex']==89 and x['captions'][11]['startWordIndex']==85
  assert words[84]['word']=='toxicity,' and words[85]['word']=='and';x['captions'][10]['endWordIndex']=84
 elif C['originalPartID']=='S10-02-en':
  assert x['captions'][7]['startWordIndex']==45 and x['captions'][7]['endWordIndex']==51 and x['captions'][8]['startWordIndex']==51 and words[50]['word']=='transformation' and words[51]['word']=='The'
  assert x['actions'][1]['id']=='conditions' and x['actions'][1]['startWordIndex']==40 and x['actions'][1]['endWordIndex']==51
  x['captions'][7]['endWordIndex']=50;x['actions'][1]['endWordIndex']=50
 else:raise ValueError('Uncommissioned semantic repair refused')
 approved=R/C['approvedSemanticRepair']['file'];assert sha(approved)==C['approvedSemanticRepair']['sha256'] and x==json.loads(approved.read_text())
 save('semantic-result.en.json',x);assert sha(O/'semantic-result.en.json')==C['approvedSemanticRepair']['sha256']
 save('index-reconciliation.en.json',{'sourceResponse':C['semanticResponse'],'documentedChanges':C['repairEvidence']['changes'],'approvedSemanticRepair':C['approvedSemanticRepair'],'newProviderCalls':0,'speechChanged':False,'sourceClockChanged':False})
 assert not x['unresolved'];assert len(x['actions'])==len(C['actions']) and {a['id'] for a in x['actions']}=={a['id'] for a in C['actions']}
 def interval(x):
  i,j=x['startWordIndex'],x['endWordIndex'];assert type(i)==type(j)==int and 0<=i<=j<len(words);start,end=words[i]['start'],words[j]['end'];assert 0<=start<end<=duration+.05;return start,end
 actions={}
 for act in x['actions']:
  start,end=interval(act);assert act['heardAnchor'] and 0<=act['uncertaintySeconds']<=1;meta=next(y for y in C['actions'] if y['id']==act['id']);actions[act['id']]=dict(meta,**act,start=start,end=end)
 captions=[];nextIndex=0;prev=-1
 for q in x['captions']:
  start,end=interval(q);assert q['startWordIndex']==nextIndex and start>=prev-.05 and q['text'].strip();nextIndex=q['endWordIndex']+1;prev=end;captions.append(dict(q,start=start,end=end,text=re.sub('[\u064b-\u065f\u0670]','',q['text'])))
 assert captions and nextIndex==len(words)
 for f in [a,image]:shutil.copyfile(f,P/f.name)
 for asset in M['brandAssets']:
  f=Path(os.environ['GITHUB_WORKSPACE'])/asset['path'];assert sha(f)==asset['sha256'];shutil.copyfile(f,P/asset['name'])
 data=dict(C,id='FateV2-'+C['id'],audioFile=a.name,imageFile=image.name,audioFrames=frames,frames=math.ceil(frames/800),durationSeconds=duration,actions=actions,captions=captions,wordTimings=words,audioGate=gate,audioGateSource=C['review'],audioGateSHA256=sha(gateFile),sourceClock=C['clock'],onsetOnlyWordIntervals=clock.get('onsetOnlyIndices',[]),timingMethod='Actual recording ASR; semantic unit-index mapping. Waveform-supported onset refinements only. No generated clock or text-length estimate, no time stretch.')
 (R/'render-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8');save('timing-and-inputs.en.json',data);shutil.copyfile(gateFile,O/'audio-gate.en.json');state.update(status='VALIDATED_FOR_SCENE_RENDER',finishedUTC=now());save('semantic-attempt.en.json',state);print(json.dumps({'id':C['id'],'durationSeconds':duration,'actions':len(actions),'captions':len(captions)}))
except Exception as e:state.update(status='INVALID_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('semantic-attempt.en.json',state);raise
