from batch_common import *
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'media-s01-voice38';T.mkdir(exist_ok=False)
old=json.loads((B/'media-s01/request.json').read_text(encoding='utf8'));proof=json.loads((B/'voice38-proof/request.json').read_text(encoding='utf8'));approval=(R/'production/voice38-proof-v1/owner-acceptance.en.json').read_bytes();accepted=json.loads(approval)
assert accepted['ownerAnswer']=='اعتمد العربي والإنجليزي وكمّل'
for p in old['segments']:
    profile=next(x for x in proof['segments'] if x['locale']==p['locale'] and x['voice']==p['voice']);p['delivery']=profile['delivery'];p['deliverySHA256']=profile['deliverySHA256']
M={'id':'fate-v2-s01-voice38-full-v1','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':12,'maxAnalysisCalls':24,'retained':[],'segments':old['segments'],'methodApprovalSHA256':hashlib.sha256((json.dumps(accepted,ensure_ascii=False,indent=2)+'\n').encode()).hexdigest(),'methodApprovalScope':'Four exact clips and unchanged3.8 voice/delivery method; no unheard clip acceptance inferred.','ownerBudgetCeilingUSD':25,'additionalReservationUSD':3.36,'cumulativeConservativeReservationUSD':18.92,'sourceLessonSHA256':old['sourceLessonSHA256'],'images':'Reuse three inspected existing originals, no new image calls.','fullVideoRenderAllowed':False,'nextGate':'Actual-audio review/timing and a short synchronized sample; no full video before scoped acceptance.'}
def put(n,v):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)+'\n')
put('request.json',M);put('method-approval.en.json',accepted)
for name in ['review.py','audio_review_worker.py']:put(name,(B/'voice38-proof'/name).read_text(encoding='utf8'))
gen=(B/'voice38-proof/generate.py').read_text(encoding='utf8').replace("len(M['segments'])==4","len(M['segments'])==12").replace("'maxOutputTokens':2048","'maxOutputTokens':8192")
gen=gen.replace("state={'id':sid", "assert sha((R/'method-approval.en.json').read_bytes())==M['methodApprovalSHA256']\nstate={'id':sid")
put('generate.py',gen)
pkg=T.relative_to(W).as_posix();sha=hashlib.sha256((T/'request.json').read_bytes()).hexdigest()
wf=(W/'.github/workflows/fate-v2-voice38-proof.yml').read_text(encoding='utf8')
wf=wf.replace('Fate v2 Gemini 3.8 highest-quality voice proof','Fate v2 S01 accepted3.8 full bilingual narration').replace((B/'voice38-proof').relative_to(W).as_posix(),pkg).replace(hashlib.sha256((B/'voice38-proof/request.json').read_bytes()).hexdigest(),sha).replace('fate-v2-voice38-proof','fate-v2-s01-full38').replace('voice-proof:','narration:').replace('max-parallel: 2','max-parallel: 3').replace('timeout-minutes: 10','timeout-minutes: 15').replace('part: [AR-Charon, AR-Kore, EN-Charon, EN-Kore]','part: '+json.dumps([p['id'] for p in M['segments']])).replace('fate-v2-voice38-original-','fate-v2-full38-original-').replace('fate-v2-voice38-review-','fate-v2-full38-review-')
with (W/'.github/workflows/fate-v2-s01-full38.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
save('media-plan/FATE2-S01/voice38-selected-request.en.json',M)
print('Prepared12 complete bilingual3.8 passages with accepted delivery fingerprints; no new image calls, no full-video permission.')
