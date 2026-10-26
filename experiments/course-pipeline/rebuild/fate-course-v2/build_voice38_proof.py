"""Owner-requested higher-tier voice change: four short clips, not a new full batch."""
from batch_common import *
W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists());T=Path(__file__).parent/'voice38-proof';T.mkdir(exist_ok=False)
texts=[('AR-Charon','ar-EG','Charon','في المثال ده، وجود متبقّي في المَحْصول ما يثبتش لوحده إنّ فيه ضرر. لازم نعرف كمّية التعرُّض، وطريقه، والمدّة اللّي حصل فيها.'),('AR-Kore','ar-EG','Kore','ولو المادّة ظهرت في ميّه المجرى، نراجع مكان العيّنة وتوقيتها. القياس يجاوب سؤالًا محدَّدًا؛ ما نكمّلش باقي القصّة بتخمين، ولا نحكم من صورة.'),('EN-Charon','en','Charon','In this example, a residue in the crop does not establish harm by itself. We need the exposure amount, route and duration before drawing that conclusion.'),('EN-Kore','en','Kore','If the substance appears in stream water, check where and when the sample was collected. Each measurement answers a specific question; missing evidence remains unknown.')]
ar='اتكلّم بالمصري القاهري الطبيعي، كأنّك مدرّس بيشرح لطلبة جامعة بهدوء ووضوح. الجيم مصرية زي G في gold، والقاف همزة في الكلام اليومي حيث ينطقها المصريون طبيعيًا. راعي الشدّات من غير مبالغة، وحافظ على المعنى والنفي. نبرة دافية ثابتة وسرعة متوسطة، بلاش فصحى أو لهجة خليجية أو نبرة أخبار. المَيّه هي مياه الحقل el-MAY-ya، والمَحْصول بصاد واضحة el-mah-SOOL. لا تضف كلامًا.'
en='Clear natural university English, warm and measured, stable timbre, complete connected phrases. Preserve every qualification and negation. No greeting, roleplay or added words.'
M={'id':'fate-v2-voice38-proof-v1','model':'gemini-3.8-flash-tts','analysisModel':'gemini-2.5-flash','automaticRetries':0,'maxSpeechCalls':4,'maxAnalysisCalls':8,'retained':[],'ownerAuthorization':'لاء غير للاعلي','ownerBudgetCeilingUSD':25,'incrementalReservationUSD':2,'methodChangeListeningRequired':True,'generationSchema':'Documented GenerateContent speech_metadata.style and speechConfig.voiceConfig.voice; WAV unary response.','evidenceURLs':['https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash-tts','https://ai.google.dev/gemini-api/docs/generate-content/speech-generation','https://ai.google.dev/gemini-api/docs/pricing'],'segments':[]}
for id,locale,voice,text in texts:
 d=ar if locale=='ar-EG' else en;M['segments'].append({'id':id,'locale':locale,'voice':voice,'spokenText':text,'delivery':d,'textSHA256':hashlib.sha256(text.encode()).hexdigest(),'deliverySHA256':hashlib.sha256(d.encode()).hexdigest()})
def put(name,value):
 with (T/name).open('w',encoding='utf8',newline='\n') as f:f.write(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2)+'\n')
put('request.json',M)
for name in ['review.py','audio_review_worker.py']:put(name,(Path(__file__).parent/'media-s01'/name).read_text(encoding='utf8'))
put('generate.py','''from pathlib import Path
import os,sys,json,hashlib,base64,urllib.request,urllib.error,datetime,wave,io,array
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text(encoding='utf8'));sid=sys.argv[1];C=next(p for p in M['segments'] if p['id']==sid);O=R/'output';O.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest();now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(n,v):(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
assert sha((R/'request.json').read_bytes())==os.environ['EXPECTED_REQUEST_SHA256']
assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and M['model']=='gemini-3.8-flash-tts' and M['automaticRetries']==0 and M['maxSpeechCalls']==len(M['segments'])==4
assert C['voice'] in ['Charon','Kore'] and not (O/'attempt.json').exists()
assert sha(C['spokenText'].encode())==C['textSHA256'] and sha(C['delivery'].encode())==C['deliverySHA256']
state={'id':sid,'status':'VERIFYING_AVAILABILITY','startedUTC':now(),'model':M['model'],'voice':C['voice'],'requestSHA256':sha((R/'request.json').read_bytes()),'runID':os.environ['GITHUB_RUN_ID'],'commit':os.environ['GITHUB_SHA'],'speechCalls':0,'ownerListeningApproved':False};save('attempt.json',state)
def api(payload=None):
 url='https://generativelanguage.googleapis.com/v1beta/models/'+M['model']+(':generateContent' if payload is not None else '')
 req=urllib.request.Request(url,data=None if payload is None else json.dumps(payload,ensure_ascii=False).encode(),headers={'x-goog-api-key':os.environ['GEMINI_API_KEY'],'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=180) as r:return json.load(r)
 except urllib.error.HTTPError as e:
  try:save('provider-error.json',json.loads(e.read()))
  except Exception:pass
  raise RuntimeError('Provider HTTP '+str(e.code)) from None
 except Exception as e:raise RuntimeError('Transport/result '+type(e).__name__) from None
try:
 info=api();save('availability.json',info);assert 'generateContent' in info.get('supportedGenerationMethods',[])
 payload={'contents':[{'role':'user','parts':[{'text':C['spokenText'],'speech_metadata':{'style':C['delivery']}}]}],'generationConfig':{'responseModalities':['AUDIO'],'maxOutputTokens':2048,'speechConfig':{'voiceConfig':{'voice':C['voice']}}}}
 save('provider-request.json',payload);state.update(status='REQUEST_STARTED_OUTCOME_UNKNOWN',speechCalls=1);save('attempt.json',state)
 result=api(payload);part=next(p['inlineData'] for p in result['candidates'][0]['content']['parts'] if p.get('inlineData',{}).get('mimeType','').startswith('audio/') and not p.get('thought'));raw=base64.b64decode(part['data'],validate=True);(O/'original-provider.bin').write_bytes(raw);save('response-metadata.json',{k:v for k,v in result.items() if k!='candidates'})
 assert result.get('modelVersion','').startswith(M['model']), 'Unexpected returned model'
 if raw.startswith(b'RIFF') and raw[8:12]==b'WAVE':wav=raw
 else:
  assert part['mimeType'].lower().startswith('audio/l16') and 'rate=24000' in part['mimeType'].lower() and len(raw)%2==0
  b=io.BytesIO()
  with wave.open(b,'wb') as f:f.setparams((1,2,24000,0,'NONE','not compressed'));f.writeframes(raw)
  wav=b.getvalue()
 (O/(sid+'.wav')).write_bytes(wav)
 with wave.open(io.BytesIO(wav),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,24000)
  frames=f.getnframes();pcm=f.readframes(frames)
 a=array.array('h',pcm)
 if sys.byteorder!='little':a.byteswap()
 assert a and max(abs(x) for x in a)>100
 check={'wavSHA256':sha(wav),'providerOriginalSHA256':sha(raw),'pcmSHA256':sha(pcm),'durationSeconds':frames/24000,'frames':frames,'sampleRate':24000,'channels':1,'bitsPerSample':16,'peak':max(abs(x) for x in a),'clippedFraction':sum(abs(x)>=32767 for x in a)/len(a),'model':M['model'],'voice':C['voice'],'returnedModelVersion':result.get('modelVersion'),'textSHA256':C['textSHA256'],'deliverySHA256':C['deliverySHA256'],'humanListeningApproved':False};save('verification.json',check);state.update(status='PRESERVED_FOR_NEW_METHOD_LISTENING',finishedUTC=now(),durationSeconds=frames/24000,wavSHA256=sha(wav));save('attempt.json',state);print(json.dumps({'id':sid,'status':state['status'],'seconds':frames/24000}))
except Exception as e:
 state.update(status='FAILED_OR_AMBIGUOUS_NO_RETRY',error=str(e),finishedUTC=now());save('attempt.json',state);raise
''')
sha=hashlib.sha256((T/'request.json').read_bytes()).hexdigest();pkg=T.relative_to(W).as_posix()
workflow=f'''name: Fate v2 Gemini 3.8 highest-quality voice proof
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{pkg}/request.json]
permissions:
  contents: read
concurrency:
  group: fate-v2-voice38-proof
  cancel-in-progress: false
env:
  PACKAGE: {pkg}
  EXPECTED_REQUEST_SHA256: {sha}
  PYTHONUNBUFFERED: '1'
jobs:
  voice-proof:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    strategy:
      fail-fast: false
      max-parallel: 2
      matrix:
        part: [AR-Charon, AR-Kore, EN-Charon, EN-Kore]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify model availability and retain original audio
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/generate.py" "${{{{ matrix.part }}}}"
      - name: Deliver each original immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-voice38-original-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Actual blind and reference acoustic checks
        if: success()
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/review.py" "${{{{ matrix.part }}}}"
      - name: Preserve actual diagnostic results separately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-voice38-review-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/review*
          retention-days: 30
'''
with (W/'.github/workflows/fate-v2-voice38-proof.yml').open('x',encoding='utf8',newline='\n') as f:f.write(workflow)
save('media-plan/voice38-proof/request.en.json',M)
save('media-plan/voice38-proof/DECISION.en.md','# Higher-tier narration change\n\nOwner explicitly requested switching to the higher model. Google\'s current official model and speech pages identify gemini-3.8-flash-tts as the flagship creative TTS tier for maximum fidelity and regional dialects. Actual account availability and successful Charon/Kore requests still require service evidence. No silent downgrade.\n\nThe current2.5Pro run40253298480 was cancelled; retain all completed audio, image and review artifacts. Preserve reviewed images for reuse. Prior2.5 voice acceptance does not approve the changed3.8 delivery. Four short independent voice clips (about50words per locale) are the only new speech authorised in this initial proof, plus eight bounded actual-audio checks. Keep the same25USD first-batch ceiling; no budget refill. Listening approval is required before full3.8 recording.\n')
print('Prepared four short3.8 voice samples, about50words per locale; model must verify on service, no fallback.')
