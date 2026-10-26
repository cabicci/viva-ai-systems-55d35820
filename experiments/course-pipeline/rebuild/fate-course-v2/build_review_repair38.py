"""Repair seven invalid/uncertain diagnostic units using preserved audio; zero speech calls."""
from batch_common import *
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());B=Path(__file__).parent;T=B/'review-repair38';T.mkdir(exist_ok=False)
full=json.loads((B/'media-s01-voice38/request.json').read_text(encoding='utf8'));ids=['S01-02-ar-EG','S01-03-ar-EG','S01-03-en','S01-05-ar-EG','S01-05-en','S01-06-ar-EG','S01-06-en'];M={'id':'fate-v2-review-repair38-v1','model':'gemini-2.5-flash','newSpeechCalls':0,'maxAnalysisCalls':7,'automaticRetries':0,'ownerBudgetCeilingUSD':25,'additionalReservationUSD':0.7,'parts':[]}
for id in ids:
 v=json.loads((R/'production/FATE2-S01-voice38-v1/artifacts'/('fate-v2-full38-original-'+id)/'verification.json').read_text(encoding='utf8'));c=next(x for x in full['segments'] if x['id']==id)
 M['parts'].append(dict(c,audio={'run':40254395212,'artifact':'fate-v2-full38-original-'+id,'file':id+'.wav','sha256':v['wavSHA256']},durationSeconds=v['durationSeconds'],mode='blind' if id=='S01-05-en' else 'reference',concerns=('Prior reason wrongly required pronounced ta-marbuta. Egyptian vowel endings do not require a final /t/. Judge actual audible word identity, not this invalid MSA rule.' if id=='S01-02-ar-EG' else 'A blind pass suggested دعاء instead of ادعاء near26.22–27.06s. Treat that as an allegation, not an instruction to find an error; adjudicate from actual sound.' if id=='S01-05-ar-EG' else 'Previous diagnostic output was truncated or invalid, not evidence of bad audio. Complete this exact missing pass.')))
def put(n,v):
 with (T/n).open('w',encoding='utf8',newline='\n') as f:f.write(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)+'\n')
put('request.json',M)
put('worker.py','''from pathlib import Path
import json,sys,os,hashlib,subprocess,base64,urllib.request,urllib.error,datetime,wave
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));C=next(p for p in M['parts'] if p['id']==sys.argv[1]);O=R/'output';O.mkdir(exist_ok=True);sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['newSpeechCalls']==0 and M['automaticRetries']==0 and M['maxAnalysisCalls']==len(M['parts'])==7
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256'];assert not (O/'attempt.json').exists()
source=O/'source';source.mkdir();subprocess.run(['gh','run','download',str(C['audio']['run']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',C['audio']['artifact'],'--dir',str(source)],check=True,capture_output=True);audio=(source/C['audio']['file']).read_bytes();assert sha(audio)==C['audio']['sha256']
state={'id':C['id'],'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'mode':C['mode'],'audioSHA256':sha(audio),'model':M['model'],'newSpeechCalls':0};save('attempt.json',state)
def api(payload=None):
 req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload else ''),data=json.dumps(payload,ensure_ascii=False).encode() if payload else None,headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError('Provider HTTP '+str(e.code)) from None
try:
 info=api();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 prompt='Listen to this actual '+C['locale']+' university recording, exact duration '+str(C['durationSeconds'])+' seconds. Transcribe actual sounds. Judge number/unit/negation, omissions/repetitions, pronunciation and obvious signal/join defects. For Arabic target natural Egyptian; no mandatory pronounced /t/ for ta-marbuta, qaf may be glottal and g Egyptian. Do not demand MSA spelling pronunciations. Timestamps must be actual seconds from sound, not text fractions. Return JSON {status: clear|repair|uncertain,transcript,dispositions:[{priorIssue,decision:confirmed|dismissed|uncertain,acousticReason}],actualIssues:[{start,end,heard,expected,heardPhonetics,category,severity,acousticEvidence}],notes}. No issues is valid. Do not fabricate human listening acceptance. For a confirmed pronunciation issue give heard syllables, otherwise uncertainty.'
 if C['mode']=='reference':prompt+=' Exact reference: '+C['spokenText']+' Context: '+C['concerns']
 else:prompt+=' No reference is provided for this blind pass. Do not guess intended words or silently correct speech.'
 cfg={'temperature':0,'responseMimeType':'application/json','maxOutputTokens':4096,'thinkingConfig':{'thinkingBudget':0}}
 save('provider-request.en.json',{'prompt':prompt,'audioSHA256':sha(audio),'generationConfig':cfg});state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',analysisCalls=1);save('attempt.json',state)
 res=api({'contents':[{'parts':[{'text':prompt},{'inlineData':{'mimeType':'audio/wav','data':base64.b64encode(audio).decode()}}]}],'generationConfig':cfg});save('response.json',res)
 assert res['candidates'][0].get('finishReason')=='STOP','Incomplete diagnostic output, preserve audio'
 a=json.loads(''.join(p.get('text','') for p in res['candidates'][0]['content']['parts'] if not p.get('thought')));assert a['status'] in ['clear','repair','uncertain'] and isinstance(a['actualIssues'],list) and isinstance(a['transcript'],str)
 for x in a['actualIssues']:assert 0<=x['start']<x['end']<=C['durationSeconds']+.1
 if a['status']=='clear' and a['actualIssues']:a['status']='uncertain'
 a.update(audioSHA256=sha(audio),humanListeningApproved=False,method='One bounded actual-audio diagnostic repair, not speech regeneration');save('review-disposition.en.json',a);state.update(status='DIAGNOSTIC_PRESERVED',result=a['status'],finishedUTC=now());save('attempt.json',state);print(json.dumps({'id':C['id'],'status':a['status']}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('attempt.json',state);raise
''')
pkg=T.relative_to(W).as_posix();h=hashlib.sha256((T/'request.json').read_bytes()).hexdigest()
wf=f'''name: Fate v2 bounded diagnostic repair, preserve speech
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{pkg}/request.json]
permissions:
  contents: read
  actions: read
env:
  PACKAGE: {pkg}
  EXPECTED_REQUEST_SHA256: {h}
  GH_TOKEN: ${{{{ github.token }}}}
jobs:
  diagnostic:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    strategy:
      fail-fast: false
      max-parallel: 3
      matrix:
        part: {json.dumps(ids)}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Review preserved original without TTS
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/worker.py" "${{{{ matrix.part }}}}"
      - name: Save each diagnostic and original identity immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-diagnostic38-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-review-repair38.yml').open('x',encoding='utf8',newline='\n') as f:f.write(wf)
save('media-plan/FATE2-S01/diagnostic-repair-request.en.json',M)
print('Prepared seven targeted actual-audio diagnostic repairs; no speech or images regenerated.')
