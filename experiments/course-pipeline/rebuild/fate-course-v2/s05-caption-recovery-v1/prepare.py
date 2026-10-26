from pathlib import Path
import os,sys,json,hashlib,subprocess,shutil,wave,math,base64,urllib.request,urllib.error,datetime,re
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(p for p in M['parts'] if p['id']==sys.argv[1]);O=R/'output';O.mkdir();P=R/'public';P.mkdir();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha(R/'request.json')==os.environ['EXPECTED_REQUEST_SHA256'] and os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['newProviderCalls']==M['newSpeechCalls']==M['newImageCalls']==M['maxSemanticCalls']==0
cache={}
def get(ref):
 k=(ref['run'],ref['artifact'])
 if k not in cache:
  d=R/'downloads'/str(ref['run'])/ref['artifact'];d.mkdir(parents=True);subprocess.run(['gh','run','download',str(ref['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',ref['artifact'],'--dir',str(d)],check=True,capture_output=True);cache[k]=d
 f=cache[k]/ref['file'];assert sha(f)==ref['sha256'];return f
a=get(C['audio']);image=get(C['image']);clockFile=get(C['clock']);gateFile=get(C['review']);gate=json.loads(gateFile.read_text());clock=json.loads(clockFile.read_text());v=json.loads((a.parent/'verification.json').read_text())
assert gate['status']=='clear' and gate['sourceAudioSHA256']==sha(a)==v['wavSHA256']==clock['sourceAudioSHA256'] and v['model']==v['returnedModelVersion']==M['speechModel']
assert gate['voice']==v['voice']==C['voice'] and gate['textSHA256']==v['textSHA256']==C['textSHA256'] and gate['deliverySHA256']==v['deliverySHA256']==C['deliverySHA256']
assert C['imageReview']['status']=='usable' and C['imageReview']['imageSHA256']==sha(image)
assert sha(R/'contracts.json')==M['contractsSHA256'];contracts=json.loads((R/'contracts.json').read_text());contract=next(x for x in contracts['scenes'] if x['step']==C['step'] and x['sectionID']==C['sectionID']);assert {a['id'] for a in C['actions']}=={a['id'] for a in contract['actions']}
with wave.open(str(a),'rb') as f:assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(24000,1,2);frames=f.getnframes()
duration=frames/24000;assert frames==v['frames']==clock['audioFrames'];words=clock['words'];assert words and all(0<=w['start']<=w['end']<=duration+.05 for w in words)
state={'id':C['id'],'status':'VERIFYING_SAVED_ACTUAL_AUDIO_MAPPING','sourceAudioSHA256':sha(a),'actualClockSHA256':sha(clockFile),'audioGateSHA256':sha(gateFile),'model':M['analysisModel'],'newSpeechCalls':0,'analysisCalls':0,'startedUTC':now()};save('semantic-attempt.en.json',state)
schema={'type':'OBJECT','properties':{'actions':{'type':'ARRAY','items':{'type':'OBJECT','properties':{'id':{'type':'STRING'},'startWordIndex':{'type':'INTEGER'},'endWordIndex':{'type':'INTEGER'},'heardAnchor':{'type':'STRING'},'uncertaintySeconds':{'type':'NUMBER'}},'required':['id','startWordIndex','endWordIndex','heardAnchor','uncertaintySeconds']}},'captions':{'type':'ARRAY','items':{'type':'OBJECT','properties':{'text':{'type':'STRING'},'startWordIndex':{'type':'INTEGER'},'endWordIndex':{'type':'INTEGER'}},'required':['text','startWordIndex','endWordIndex']}},'captionCorrections':{'type':'ARRAY','items':{'type':'OBJECT','properties':{'asrIndex':{'type':'INTEGER'},'from':{'type':'STRING'},'to':{'type':'STRING'},'acousticReason':{'type':'STRING'}},'required':['asrIndex','from','to','acousticReason']}},'unresolved':{'type':'ARRAY','items':{'type':'STRING'}}},'required':['actions','captions','captionCorrections','unresolved']}
try:
 prompt='Listen to this actual '+C['locale']+' university recording. Return explanatory action and caption ASR UNIT INDICES only; never invent timestamps or distribute time using text length. ASR clock is independently actual-audio-derived. Every actionID exactly once; anchor its meaningful introductory clause, not just a later number or keyword. If unsupported return unresolved. Egyptian is intentionally colloquial with legitimate connected variants. Captions are clean natural writing, no pronunciation diacritics; preserve every number, unit, assumption, negation and case. Correct ASR spelling only if actual sound plus reference support it. Each caption span preferably<=10displaywords and indicespartitioneveryunit exactly once from0to'+str(len(words)-1)+' in order without omissions or duplicate units. A single numeric ASRunit can represent several words: never invent subunit timing. Do not add text from an image or future scene. Reference: '+C['spokenText']+' Actions: '+json.dumps(C['actions'],ensure_ascii=False)+' ASR units: '+json.dumps([{'index':i,'word':w['word']} for i,w in enumerate(words)],ensure_ascii=False)
 sourceResponse=get(C['semanticResponse']);res=json.loads(sourceResponse.read_text());save('preserved-semantic-response.en.json',res)
 assert res.get('modelVersion')==M['analysisModel'] and res['candidates'][0].get('finishReason')=='STOP'
 x=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')))
 save('preserved-semantic-result.en.json',x)
 for fix in C['indexCorrections']:
  matching=[q for q in x['captions'] if q['text']==fix['caption'] and q[fix['field']]==fix['old']]
  assert len(matching)==1;matching[0][fix['field']]=fix['new']
 save('semantic-result.en.json',x);assert sha(O/'semantic-result.en.json')==C['repairedSemanticSHA256'];save('index-reconciliation.en.json',{'sourceResponse':C['semanticResponse'],'corrections':C['indexCorrections'],'newProviderCalls':0,'speechChanged':False})
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
