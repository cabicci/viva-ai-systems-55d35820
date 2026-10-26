"""Prepare the bounded first-step media batch from reviewed local scripts; no provider calls."""
from batch_common import *
import shutil

W=next(p for p in Path(__file__).resolve().parents if (p/'.git').exists())
old=W/'experiments/course-pipeline/rebuild/fate-L02-L07-bilingual-v1'
T=Path(__file__).parent/'media-s01';assert not T.exists();T.mkdir()
draft=json.loads((R/'media-plan/FATE2-S01/request.draft.en.json').read_text(encoding='utf8'))
assert draft['model']=='gemini-2.5-pro-preview-tts' and len(draft['parts'])==12
budget=json.loads((R/'RUN.en.json').read_text(encoding='utf8'))['ownerBudget'];assert budget['ceiling']==25
segments=[]
for part in draft['parts']:
    delivery=part['delivery']
    if part['locale']=='ar-EG':
        delivery='اتكلّم بالمصري القاهري الطبيعي، كأنّك مدرّس بيشرح لطلبة جامعة بهدوء ووضوح. الجيم مصرية زي G في gold، والقاف همزة في الكلمات اليومية اللّي المصريين بينطقوها كده. نبرة دافية وسرعة متوسّطة ووقفات طبيعية. راعي الشدّات من غير مبالغة أو تطويل. حافظ على كلّ الأرقام والوحدات والنفي. اقرأ نصّ الإلقاء بسّ من غير مقدّمة أو تعليق أو قراءة التعليمات. بلاش فصحى أو لهجة خليجية أو نبرة نشرات الأخبار. المَيّه هنا ميّه الحقل، el-MAY-ya، مش الرقم مية. المَحْصول بصاد واضحة.\n'+delivery
    segment={'id':part['id'],'locale':part['locale'],'voice':part['voice'],'spokenText':part['text'],'delivery':delivery,'textSHA256':hashlib.sha256(part['text'].encode()).hexdigest(),'deliverySHA256':hashlib.sha256(delivery.encode()).hexdigest(),'semanticID':part['semanticID'],'scene':part['scene']}
    segments.append(segment)
request={'id':'fate-v2-s01-media-20261026-v1','model':draft['model'],'analysisModel':'gemini-2.5-flash','imageModel':'gemini-nano-banana-2.1','automaticRetries':0,'maxSpeechCalls':12,'maxAnalysisCalls':24,'maxImageCalls':3,'retained':[],'segments':segments,
 'budget':{'ownerCeilingUSD':25,'initialTTSCalls':12,'initialImageCalls':3,'audioReviewCalls':24,'repairTTSCallsReservedNotDispatched':2,'repairImageCallsReservedNotDispatched':2,'conservativeInternalReservationUSD':20,'noAutomaticRefill':True,'pricingEvidence':'Google official Gemini pricing inspected 2026-10-26: Pro TTS input $1/M, audio output $20/M. TTS output bounded8192 tokens per request. Reservation is planning, not an account-wide billing cap. Image model must first answer availability; no silent alias or provider substitution.'},
 'sourceLessonSHA256':hashlib.sha256((R/'lessons/FATE2-S01/lesson.public.json').read_bytes()).hexdigest(),'newMethodApprovalRequired':False,'approvalLimits':'Existing same-course voice/method approval retained. New clips require actual review; no acceptance fabricated. Full new video needs scoped sync sample review.'}
def put(name,ob):
    (T/name).write_text(ob if isinstance(ob,str) else json.dumps(ob,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
put('request.json',request)
generate=(old/'audio/generate.py').read_text(encoding='utf8')
generate=generate.replace("len(M['segments'])==45","len(M['segments'])==12").replace("'responseModalities':['AUDIO']","'responseModalities':['AUDIO'],'maxOutputTokens':8192")
assert '==45' not in generate
put('generate.py',generate)
put('review.py',(old/'audio/review.py').read_text(encoding='utf8'))
review=(old/'audio/audio_review_worker.py').read_text(encoding='utf8')
review=review.replace("'responseMimeType':'application/json','temperature':0.0","'responseMimeType':'application/json','temperature':0.0,'maxOutputTokens':2048")
put('audio_review_worker.py',review)
style=json.loads((old/'images/request.json').read_text(encoding='utf8'))['style']
chosen=[draft['visualContracts'][i] for i in [0,1,3]]
image={'id':'fate-v2-s01-images-v1','imageModel':'gemini-nano-banana-2.1','reviewModel':'gemini-2.5-flash','automaticRetries':0,'maxImageCalls':3,'maxReviewCalls':0,'style':style,'scenes':[{'id':x['id'],'title':{'en':x['id']},'meaning':x['prompt'],'visualContract':x['prompt']+' Actions will be composed separately: '+'; '.join(x['actions'])} for x in chosen]}
put('images/request.json' if False else 'images-request.json',image)
imageworker=(old/'images/worker.py').read_text(encoding='utf8').replace("R/'request.json'","R/'images-request.json'").replace("len(M['scenes'])==43","len(M['scenes'])==3")
put('image_worker.py',imageworker)
hash_audio=hashlib.sha256((T/'request.json').read_bytes()).hexdigest();hash_image=hashlib.sha256((T/'images-request.json').read_bytes()).hexdigest()
package=T.relative_to(W).as_posix()
workflow=f'''name: Fate v2 S01 bounded original media
on:
  push:
    branches: [work/masaarat/0c0df2131ade371ac908def0]
    paths: [{package}/request.json]
permissions:
  contents: read
concurrency:
  group: fate-v2-s01-initial-media
  cancel-in-progress: false
env:
  PACKAGE: {package}
  PYTHONUNBUFFERED: '1'
jobs:
  audio:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    strategy:
      fail-fast: false
      max-parallel: 3
      matrix:
        part: {json.dumps([x['id'] for x in segments])}
    env:
      EXPECTED_REQUEST_SHA256: {hash_audio}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify exact model and generate one coherent original
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/generate.py" "${{{{ matrix.part }}}}"
      - name: Retain this original immediately before any review
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-original-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
      - name: Blind then reference actual-audio checks without regeneration
        if: success()
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/review.py" "${{{{ matrix.part }}}}"
      - name: Retain actual review independently
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-review-${{{{ matrix.part }}}}
          path: ${{{{ env.PACKAGE }}}}/output/review*
          retention-days: 30
  image:
    if: github.run_attempt == 1
    runs-on: ubuntu-22.04
    timeout-minutes: 12
    strategy:
      fail-fast: false
      max-parallel: 2
      matrix:
        scene: {json.dumps([x['id'] for x in chosen])}
    env:
      EXPECTED_REQUEST_SHA256: {hash_image}
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Verify approved exact image model and generate one ingredient
        env:
          GEMINI_API_KEY: ${{{{ secrets.GEMINI_API_KEY }}}}
        run: python "$PACKAGE/image_worker.py" "${{{{ matrix.scene }}}}" generate
      - name: Retain each result or availability blocker immediately
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: fate-v2-image-${{{{ matrix.scene }}}}
          path: ${{{{ env.PACKAGE }}}}/output/
          retention-days: 30
'''
target=W/'.github/workflows/fate-v2-s01-media-v1.yml';assert not target.exists();target.write_text(workflow,encoding='utf8')
save('media-plan/FATE2-S01/dispatch-ready.en.json',{'requestSHA256':hash_audio,'imageRequestSHA256':hash_image,'budget':request['budget'],'sourceLessonSHA256':request['sourceLessonSHA256'],'workflow':target.relative_to(W).as_posix(),'package':T.relative_to(P).as_posix(),'status':'prepared_not_pushed','originalWorkerProvenance':'Existing same-project L02-L07 workers adapted for exact12/3 scopes and capped TTS/reviewer output; no old request replay.'})
print('Prepared exact12 TTS originals,24 audio checks,3 image ingredients; no automatic retries or repairs. Budget25USD.')
