"""S106 twentyfour full reading passages, thin diagnostic artifacts in four fixed lanes; no retries or integration. Production commands are GitHub Actions only."""
from __future__ import annotations
import argparse
import base64
import datetime
import difflib
import hashlib
import importlib.metadata
import importlib.util
import json
import math
import os
import re
from pathlib import Path
import time
import urllib.request
import wave

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,request,fp,code,msg,headers,newurl):return None
urlopen=urllib.request.build_opener(NoRedirect()).open
HERE = Path(__file__).resolve().parent
if os.name=='nt':HERE=Path(chr(92)*2+'?'+chr(92)+str(HERE).removeprefix(chr(92)*2+'?'+chr(92)))
OUT = HERE / 'output'
FROZEN = ['.gitignore', 'README.en.txt', 'freeze_package.py', 'offline_check.py', 'owner-authority.json', 'cumulative-attempt-ledger.json', 'cache-live-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/worker-derivation.json', 'request.json', 'runtime.json', 'vendor/course/manifest.json', 'vendor/pipeline-engine.py', 'worker.py', 'provenance/narration-ar-EG.json', 'provenance/narration-en.json', 'provenance/narration-it.json', 'provenance/narration-de.json', 'thin_artifacts.py']
IDS = ('S3-06-ar-EG-components-and-sequence-r1', 'S3-06-ar-EG-records-r1', 'S3-06-ar-EG-practical-checklist-r1', 'S3-06-ar-EG-criteria-r1', 'S3-06-en-components-and-sequence-r1', 'S3-06-en-records-r1', 'S3-06-en-practical-checklist-r1', 'S3-06-en-criteria-r1', 'S3-06-it-components-and-sequence-r1', 'S3-06-it-records-r1', 'S3-06-it-practical-checklist-r1', 'S3-06-it-criteria-r1', 'S3-06-de-components-and-sequence-r1', 'S3-06-de-records-r1', 'S3-06-de-practical-checklist-r1', 'S3-06-de-criteria-r1')
PROMPT = 'Listen to the complete attached course narration in its spoken language and transcribe only words actually heard, without translating or inferring missing words. Retain uncertainty. Inspect clipping, repetitions, distorted or dropped words, numbers, units, negations, conditional statements and naturally connected speech. For Arabic accept natural Egyptian consonants and connected forms; do not demand formal qaf or case endings. Some scientific terms legitimately retain formal pronunciation. Return JSON: transcript, uncertainWords, findings(startSeconds/endSeconds in this recording, heardText, issueType, observation, certainty), overall(needs_review/uncertain/no_defect_detected), limitations. Do not generate audio, claim human listening approval, certify speaker identity or infer a successful practical task.'

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    temporary.replace(path)

def exclusive(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
        stream.flush()
        os.fsync(stream.fileno())

def validate():
    req,runtime,freeze=(read(HERE/n)for n in ['request.json','runtime.json','freeze.json'])
    assert set(freeze['sha256'])==set(FROZEN) and len(FROZEN)==len(set(FROZEN))==19
    for name,h in freeze['sha256'].items():
        p=(HERE/name).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozen preimage mismatch'
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==16
    assert(req['scope'],req['stepId'])==('S306_SIXTEEN_PRACTICE_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-06')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s306-practice-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==16
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allSixteenCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(4))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['components-and-sequence','records','practical-checklist','criteria']
        voice='Charon'if group in ['components-and-sequence','practical-checklist']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'components-and-sequence': ['/dripPractice/ui/modelHelp', '/dripPractice/ui/partTitle', '/dripPractice/ui/parts/0', '/dripPractice/ui/functions/0', '/dripPractice/ui/parts/1', '/dripPractice/ui/functions/1', '/dripPractice/ui/parts/2', '/dripPractice/ui/functions/2', '/dripPractice/ui/parts/3', '/dripPractice/ui/functions/3', '/dripPractice/ui/parts/4', '/dripPractice/ui/functions/4', '/dripPractice/ui/parts/5', '/dripPractice/ui/functions/5', '/dripPractice/ui/parts/6', '/dripPractice/ui/functions/6', '/dripPractice/ui/orderTitle', '/dripPractice/ui/orderHelp', '/dripPractice/ui/steps/0', '/dripPractice/ui/steps/1', '/dripPractice/ui/steps/2', '/dripPractice/ui/steps/3', '/dripPractice/ui/steps/4', '/dripPractice/ui/steps/5', '/dripPractice/ui/steps/6'], 'records': ['/dripPractice/ui/sampleNotes', '/dripPractice/ui/sampleNames/0', '/dripPractice/ui/sampleNames/1', '/dripPractice/ui/sampleNames/2', '/dripPractice/ui/sampleFields/0', '/dripPractice/ui/sampleFields/1', '/dripPractice/ui/sampleFields/2', '/dripPractice/ui/sampleFields/3', '/dripPractice/ui/kitNotes', '/dripPractice/ui/kitFields/0', '/dripPractice/ui/kitFields/1', '/dripPractice/ui/kitFields/2', '/dripPractice/ui/kitFields/3', '/dripPractice/ui/kitFields/4', '/dripPractice/ui/kitFields/5', '/dripPractice/ui/kitFields/6', '/dripPractice/ui/kitFields/7', '/dripPractice/ui/testNotes', '/dripPractice/ui/testFields/0', '/dripPractice/ui/testFields/1', '/dripPractice/ui/testFields/2', '/dripPractice/ui/testFields/3', '/dripPractice/ui/testFields/4', '/dripPractice/ui/testFields/5', '/dripPractice/ui/notes', '/dripPractice/ui/noKit'], 'practical-checklist': ['/dripPractice/studentTask', '/dripPractice/equipmentGate', '/dripPractice/ui/trainerTitle', '/dripPractice/checklist/0/evidence', '/dripPractice/checklist/1/evidence', '/dripPractice/checklist/2/evidence', '/dripPractice/checklist/3/evidence', '/dripPractice/checklist/4/evidence', '/dripPractice/checklist/5/evidence', '/dripPractice/checklist/6/evidence', '/dripPractice/checklist/7/evidence', '/dripPractice/checklist/8/evidence', '/dripPractice/checklist/9/evidence'], 'criteria': ['/dripPractice/passChecks/0/evidence', '/dripPractice/passChecks/0/decision', '/dripPractice/passChecks/1/evidence', '/dripPractice/passChecks/1/decision', '/dripPractice/passChecks/2/evidence', '/dripPractice/passChecks/2/decision', '/dripPractice/practicalDecision']}, 'en': {'components-and-sequence': ['/dripPractice/ui/modelHelp', '/dripPractice/ui/partTitle', '/dripPractice/ui/parts/0', '/dripPractice/ui/functions/0', '/dripPractice/ui/parts/1', '/dripPractice/ui/functions/1', '/dripPractice/ui/parts/2', '/dripPractice/ui/functions/2', '/dripPractice/ui/parts/3', '/dripPractice/ui/functions/3', '/dripPractice/ui/parts/4', '/dripPractice/ui/functions/4', '/dripPractice/ui/parts/5', '/dripPractice/ui/functions/5', '/dripPractice/ui/parts/6', '/dripPractice/ui/functions/6', '/dripPractice/ui/orderTitle', '/dripPractice/ui/orderHelp', '/dripPractice/ui/steps/0', '/dripPractice/ui/steps/1', '/dripPractice/ui/steps/2', '/dripPractice/ui/steps/3', '/dripPractice/ui/steps/4', '/dripPractice/ui/steps/5', '/dripPractice/ui/steps/6'], 'records': ['/dripPractice/ui/sampleNotes', '/dripPractice/ui/sampleNames/0', '/dripPractice/ui/sampleNames/1', '/dripPractice/ui/sampleNames/2', '/dripPractice/ui/sampleFields/0', '/dripPractice/ui/sampleFields/1', '/dripPractice/ui/sampleFields/2', '/dripPractice/ui/sampleFields/3', '/dripPractice/ui/kitNotes', '/dripPractice/ui/kitFields/0', '/dripPractice/ui/kitFields/1', '/dripPractice/ui/kitFields/2', '/dripPractice/ui/kitFields/3', '/dripPractice/ui/kitFields/4', '/dripPractice/ui/kitFields/5', '/dripPractice/ui/kitFields/6', '/dripPractice/ui/kitFields/7', '/dripPractice/ui/testNotes', '/dripPractice/ui/testFields/0', '/dripPractice/ui/testFields/1', '/dripPractice/ui/testFields/2', '/dripPractice/ui/testFields/3', '/dripPractice/ui/testFields/4', '/dripPractice/ui/testFields/5', '/dripPractice/ui/notes', '/dripPractice/ui/noKit'], 'practical-checklist': ['/dripPractice/studentTask', '/dripPractice/equipmentGate', '/dripPractice/ui/trainerTitle', '/dripPractice/checklist/0/evidence', '/dripPractice/checklist/1/evidence', '/dripPractice/checklist/2/evidence', '/dripPractice/checklist/3/evidence', '/dripPractice/checklist/4/evidence', '/dripPractice/checklist/5/evidence', '/dripPractice/checklist/6/evidence', '/dripPractice/checklist/7/evidence', '/dripPractice/checklist/8/evidence', '/dripPractice/checklist/9/evidence'], 'criteria': ['/dripPractice/passChecks/0/evidence', '/dripPractice/passChecks/0/decision', '/dripPractice/passChecks/1/evidence', '/dripPractice/passChecks/1/decision', '/dripPractice/passChecks/2/evidence', '/dripPractice/passChecks/2/decision', '/dripPractice/practicalDecision']}, 'it': {'components-and-sequence': ['/dripPractice/ui/modelHelp', '/dripPractice/ui/partTitle', '/dripPractice/ui/parts/0', '/dripPractice/ui/functions/0', '/dripPractice/ui/parts/1', '/dripPractice/ui/functions/1', '/dripPractice/ui/parts/2', '/dripPractice/ui/functions/2', '/dripPractice/ui/parts/3', '/dripPractice/ui/functions/3', '/dripPractice/ui/parts/4', '/dripPractice/ui/functions/4', '/dripPractice/ui/parts/5', '/dripPractice/ui/functions/5', '/dripPractice/ui/parts/6', '/dripPractice/ui/functions/6', '/dripPractice/ui/orderTitle', '/dripPractice/ui/orderHelp', '/dripPractice/ui/steps/0', '/dripPractice/ui/steps/1', '/dripPractice/ui/steps/2', '/dripPractice/ui/steps/3', '/dripPractice/ui/steps/4', '/dripPractice/ui/steps/5', '/dripPractice/ui/steps/6'], 'records': ['/dripPractice/ui/sampleNotes', '/dripPractice/ui/sampleNames/0', '/dripPractice/ui/sampleNames/1', '/dripPractice/ui/sampleNames/2', '/dripPractice/ui/sampleFields/0', '/dripPractice/ui/sampleFields/1', '/dripPractice/ui/sampleFields/2', '/dripPractice/ui/sampleFields/3', '/dripPractice/ui/kitNotes', '/dripPractice/ui/kitFields/0', '/dripPractice/ui/kitFields/1', '/dripPractice/ui/kitFields/2', '/dripPractice/ui/kitFields/3', '/dripPractice/ui/kitFields/4', '/dripPractice/ui/kitFields/5', '/dripPractice/ui/kitFields/6', '/dripPractice/ui/kitFields/7', '/dripPractice/ui/testNotes', '/dripPractice/ui/testFields/0', '/dripPractice/ui/testFields/1', '/dripPractice/ui/testFields/2', '/dripPractice/ui/testFields/3', '/dripPractice/ui/testFields/4', '/dripPractice/ui/testFields/5', '/dripPractice/ui/notes', '/dripPractice/ui/noKit'], 'practical-checklist': ['/dripPractice/studentTask', '/dripPractice/equipmentGate', '/dripPractice/ui/trainerTitle', '/dripPractice/checklist/0/evidence', '/dripPractice/checklist/1/evidence', '/dripPractice/checklist/2/evidence', '/dripPractice/checklist/3/evidence', '/dripPractice/checklist/4/evidence', '/dripPractice/checklist/5/evidence', '/dripPractice/checklist/6/evidence', '/dripPractice/checklist/7/evidence', '/dripPractice/checklist/8/evidence', '/dripPractice/checklist/9/evidence'], 'criteria': ['/dripPractice/passChecks/0/evidence', '/dripPractice/passChecks/0/decision', '/dripPractice/passChecks/1/evidence', '/dripPractice/passChecks/1/decision', '/dripPractice/passChecks/2/evidence', '/dripPractice/passChecks/2/decision', '/dripPractice/practicalDecision']}, 'de': {'components-and-sequence': ['/dripPractice/ui/modelHelp', '/dripPractice/ui/partTitle', '/dripPractice/ui/parts/0', '/dripPractice/ui/functions/0', '/dripPractice/ui/parts/1', '/dripPractice/ui/functions/1', '/dripPractice/ui/parts/2', '/dripPractice/ui/functions/2', '/dripPractice/ui/parts/3', '/dripPractice/ui/functions/3', '/dripPractice/ui/parts/4', '/dripPractice/ui/functions/4', '/dripPractice/ui/parts/5', '/dripPractice/ui/functions/5', '/dripPractice/ui/parts/6', '/dripPractice/ui/functions/6', '/dripPractice/ui/orderTitle', '/dripPractice/ui/orderHelp', '/dripPractice/ui/steps/0', '/dripPractice/ui/steps/1', '/dripPractice/ui/steps/2', '/dripPractice/ui/steps/3', '/dripPractice/ui/steps/4', '/dripPractice/ui/steps/5', '/dripPractice/ui/steps/6'], 'records': ['/dripPractice/ui/sampleNotes', '/dripPractice/ui/sampleNames/0', '/dripPractice/ui/sampleNames/1', '/dripPractice/ui/sampleNames/2', '/dripPractice/ui/sampleFields/0', '/dripPractice/ui/sampleFields/1', '/dripPractice/ui/sampleFields/2', '/dripPractice/ui/sampleFields/3', '/dripPractice/ui/kitNotes', '/dripPractice/ui/kitFields/0', '/dripPractice/ui/kitFields/1', '/dripPractice/ui/kitFields/2', '/dripPractice/ui/kitFields/3', '/dripPractice/ui/kitFields/4', '/dripPractice/ui/kitFields/5', '/dripPractice/ui/kitFields/6', '/dripPractice/ui/kitFields/7', '/dripPractice/ui/testNotes', '/dripPractice/ui/testFields/0', '/dripPractice/ui/testFields/1', '/dripPractice/ui/testFields/2', '/dripPractice/ui/testFields/3', '/dripPractice/ui/testFields/4', '/dripPractice/ui/testFields/5', '/dripPractice/ui/notes', '/dripPractice/ui/noKit'], 'practical-checklist': ['/dripPractice/studentTask', '/dripPractice/equipmentGate', '/dripPractice/ui/trainerTitle', '/dripPractice/checklist/0/evidence', '/dripPractice/checklist/1/evidence', '/dripPractice/checklist/2/evidence', '/dripPractice/checklist/3/evidence', '/dripPractice/checklist/4/evidence', '/dripPractice/checklist/5/evidence', '/dripPractice/checklist/6/evidence', '/dripPractice/checklist/7/evidence', '/dripPractice/checklist/8/evidence', '/dripPractice/checklist/9/evidence'], 'criteria': ['/dripPractice/passChecks/0/evidence', '/dripPractice/passChecks/0/decision', '/dripPractice/passChecks/1/evidence', '/dripPractice/passChecks/1/decision', '/dripPractice/passChecks/2/evidence', '/dripPractice/passChecks/2/decision', '/dripPractice/practicalDecision']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('المدرّب يسجل هوية الطالب ومكان وعمق العينة الحقيقي (بطاقة صندوق الزراعة تقترح نحو ١٠–١٥ سم)، والقوام وما لاحظه من ضغط وشرائط ولون وآثار ماء، والحكم عن الرطوبة وسببه المرتبط بقوام العينة. الطالب يقول الحالة اللي شافها حتى لو مش جافة.\n\nالاجتياز بأداء فردي شاهده المدرّب وتفسير تدعمه الملاحظة؛ ضغطة في المحاكاة أو إجابة جماعية أو وصف «جافة جدًا» محفوظ مش كفاية.\n\nيطابق كل جزء بوظيفته ويرتب التخطيط ووضع العلامات والتخريم حسب الدليل وتثبيت النقاطات وإغلاق النهاية وتركيب الوصلة والتحقق من الفلتر والضغط والاختبار المنضبط والتنظيف؛ من غير اختراع أرقام للضغط أو التدفق أو المسافات.\n\nينجح لو الوظائف والترتيب والتوافق وحدود الاختبار صحيحة؛ أي خطأ في الأمان أو مراجعة دليل الطقم يحتاج مراجعة موجهة وإعادة.\n\nالمدرّب يشوف نفس الطالب يستخدم وسيلة الحماية والأداة المناسبة، ويحدد ثلاثة ثقوب حسب مواضع ثلاثة نباتات على أنبوب متوافق مقاسه متر، ويركب النقاطات والسدادة والوصلة، ثم يختبر في ظروف تشغيل الطقم ثبات الوصلات وخروج المياه من الثلاثة وعدم التسريب، ويصلح العيوب وينظف.\n\nالاجتياز بعد تسجيل كل فحوص الأمان والوظيفة الفردية وتوقيع المدرّب. الخط غير المختبر أو اللي بيسرّب يفضل غير مجتاز حتى يتصلح ويتعاد اختباره بأمان.\n\nC01 وC03 ينجحوا فقط بتسجيل المدرّب أدلة فردية على كل فحوص الأمان والوظيفة المناسبة؛ ما فيش درجة رقمية بديلة ثابتة. أي فشل يتصلح ويتعاد اختباره. C02 يتقيّم أونلاين وحده.', 'المدرّب يسجل هوية الطالب ومكان وعمق العينة الحقيقي (بطاقة صندوق الزراعة تقترح عمق تقريبي من عشرة لخمستاشر سنتيمتر)، والقوام وما لاحظه من ضغط وشرائط ولون وآثار ماء، والحكم عن الرطوبة وسببه المرتبط بقوام العينة. الطالب يقول الحالة اللي شافها حتى لو مش جافة.\n\nالاجتياز بأداء فردي شاهده المدرّب وتفسير تدعمه الملاحظة؛ ضغطة في المحاكاة أو إجابة جماعية أو وصف «جافة جدًا» محفوظ مش كفاية.\n\nيطابق كل جزء بوظيفته ويرتب التخطيط ووضع العلامات والتخريم حسب الدليل وتثبيت النقاطات وإغلاق النهاية وتركيب الوصلة والتحقق من الفلتر والضغط والاختبار المنضبط والتنظيف؛ من غير اختراع أرقام للضغط أو التدفق أو المسافات.\n\nينجح لو الوظائف والترتيب والتوافق وحدود الاختبار صحيحة؛ أي خطأ في الأمان أو مراجعة دليل الطقم يحتاج مراجعة موجهة وإعادة.\n\nالمدرّب يشوف نفس الطالب يستخدم وسيلة الحماية والأداة المناسبة، ويحدد تلات ثقوب حسب مواضع تلات نباتات على أنبوب متوافق مقاسه متر، ويركب النقاطات والسدادة والوصلة، ثم يختبر في ظروف تشغيل الطقم ثبات الوصلات وخروج المياه من الثلاثة وعدم التسريب، ويصلح العيوب وينظف.\n\nالاجتياز بعد تسجيل كل فحوص الأمان والوظيفة الفردية وتوقيع المدرّب. الخط غير المختبر أو اللي بيسرّب يفضل غير مجتاز حتى يتصلح ويتعاد اختباره بأمان.\n\nسي زيرو واحد وسي زيرو تلاتة ينجحوا فقط بتسجيل المدرّب أدلة فردية على كل فحوص الأمان والوظيفة المناسبة؛ ما فيش درجة رقمية بديلة ثابتة. أي فشل يتصلح ويتعاد اختباره. سي زيرو اتنين يتقيّم أونلاين وحده.'), ('تكليف التدريب: خط متر وثلاث نقاطات. المواضع وشكل الأجزاء للتوضيح، مش مقاسات الطقم ولا مقاس التخريم ولا عرض تشغيل منتج. اختار جزء عشان تعرف وظيفته. صورة الخط المتجمع مش اختبار مياه.\n\nوصل كل جزء بوظيفته\n\nالأنبوب\n\nبينقل المياه على طول الخط\n\nثلاث نقاطات\n\nبتوصل المياه قرب النباتات التلاتة المقصودة\n\nأداة تخريم متوافقة\n\nبتعمل ثقوب بمقاس المنتج بالأداة الآمنة المناسبة\n\nسدادة النهاية\n\nبتقفل نهاية الخط\n\nوصلة التغذية\n\nبتوصل الخط المعزول بالتغذية المتوافقة\n\nالفلتر قبل الخط\n\nبيقلل الجسيمات اللي ممكن تسد النقاطات\n\nتنظيم الضغط حسب الطقم\n\nبيحافظ على حدود تشغيل الطقم المختار أو بيفحصها\n\nرتّب منطق التجهيز الآمن\n\nكل بطاقة تظهر مرة واحدة. ترتيب الأجزاء ومراجعة الدليل قبل التخريم، والتخريم قبل تثبيت النقاطات. النقاطات والغلق والوصلة قبل الاختبار. الأجزاء المستقلة ممكن يتغير ترتيبها لو دليل الطقم يسمح. ده تدريب فهم، مش تصريح تشغيل.\n\nرتب الأجزاء المفصولة وسمّيها\n\nراجع الحماية وتوافق الأداة وحدود دليل الطقم الفعلي\n\nقِس متر وعلّم تلات مواضع حسب النباتات واستخدم أداة التخريم المطابقة\n\nثبّت الثلاث نقاطات المتوافقة\n\nركّب سدادة نهاية الخط\n\nركّب الوصلة على الخط المعزول اللي مش شغال\n\nاختبار تحت تحكم المدرّب لكل المخارج والوصلات؛ افصل قبل الإصلاح وأعد الفحص ونضّف', 'تكليف التدريب: خط متر وتلات نقاطات. المواضع وشكل الأجزاء للتوضيح، مش مقاسات الطقم ولا مقاس التخريم ولا عرض تشغيل منتج. اختار جزء عشان تعرف وظيفته. صورة الخط المتجمع مش اختبار مياه.\n\nوصل كل جزء بوظيفته\n\nالأنبوب\n\nبينقل المياه على طول الخط\n\nتلات نقاطات\n\nبتوصل المياه قرب النباتات التلاتة المقصودة\n\nأداة تخريم متوافقة\n\nبتعمل ثقوب بمقاس المنتج بالأداة الآمنة المناسبة\n\nسدادة النهاية\n\nبتقفل نهاية الخط\n\nوصلة التغذية\n\nبتوصل الخط المعزول بالتغذية المتوافقة\n\nالفلتر قبل الخط\n\nبيقلل الجسيمات اللي ممكن تسد النقاطات\n\nتنظيم الضغط حسب الطقم\n\nبيحافظ على حدود تشغيل الطقم المختار أو بيفحصها\n\nرتّب منطق التجهيز الآمن\n\nكل بطاقة تظهر مرة واحدة. ترتيب الأجزاء ومراجعة الدليل قبل التخريم، والتخريم قبل تثبيت النقاطات. النقاطات والغلق والوصلة قبل الاختبار. الأجزاء المستقلة ممكن يتغير ترتيبها لو دليل الطقم يسمح. ده تدريب فهم، مش تصريح تشغيل.\n\nرتب الأجزاء المفصولة وسمّيها\n\nراجع الحماية وتوافق الأداة وحدود دليل الطقم الفعلي\n\nقيس متر وعلّم تلات مواضع حسب النباتات واستخدم أداة التخريم المطابقة\n\nثبّت التلات نقاطات المتوافقة\n\nركّب سدادة نهاية الخط\n\nركّب الوصلة على الخط المعزول اللي مش شغال\n\nاختبار تحت تحكم المدرّب لكل المخارج والوصلات؛ افصل قبل الإصلاح وأعد الفحص ونضّف'), ('في تمرين بطاقة الأداء ده، استخدم جاروف زراعة يدوي صغير (trowel) عشان تاخد بنفسك عينة من منطقة الجذور اللي يحددها المدرّب في صندوق الزراعة المتوفر، اللي فيه نباتات صغيرة وتربة لوم رملي. سجّل وفسّر ملاحظات الرطوبة الفعلية، وبعدها ركّب بنفسك واختبر خط بطول متر وثلاث نقاطات تحت ملاحظة المدرّب، بالطقم المتوافق اللي اتراجع ودليله.\n\nلازم تسجيل الطقم المتوافق ودليل مصنعه، بما فيه توافق أداة التخريم والنقاطات وحدود ضغط التشغيل وتدفقه، قبل عرض تشغيلي تفصيلي أو اختبار ماء حقيقي.\n\nملاحظة المدرّب: بنود البطاقة العشرة\n\nلبس وسيلة الحماية المناسبة للشغل، زي جوانتي مناسب للمهمة، وجهّز مكان آمن\n\nاستخدم جاروف زراعة يدوي صغير عشان ياخد عينة من منطقة الجذور النشطة؛ عمق نحو ١٠–١٥ سم خاص بتمرين صندوق الزراعة ده بس\n\nنفّذ بنفسه اختبار الملمس والشكل وسجّل الملاحظات\n\nفسّر الرطوبة من الأدلة والقوام الحقيقيين، مش إجابة «جافة جدًا» الجاهزة\n\nسمّى الأنبوب والثلاث نقاطات وأداة التخريم والسدادة والوصلة والفلتر/التحكم المطلوب\n\nقاس أنبوبًا متوافقًا بطول متر وعمل ثلاثة ثقوب حسب مواقع النباتات بأمان\n\nثبّت ثلاث نقاطات متوافقة جيدًا\n\nثبت سدادة النهاية بإحكام\n\nثبت وصلة المصدر حسب تعليمات الطقم الحقيقي\n\nاختبار تحت تحكم المدرّب أكد خروج الماء من الثلاثة وعدم تسريب الوصلات؛ الطالب يصلح العيوب بأمان وينظف', 'في تمرين بطاقة الأداء ده، استخدم جاروف زراعة يدوي صغير عشان تاخد بنفسك عينة من منطقة الجذور اللي يحددها المدرّب في صندوق الزراعة المتوفر، اللي فيه نباتات صغيرة وتربة لوم رملي. سجّل وفسّر ملاحظات الرطوبة الفعلية، وبعدها ركّب بنفسك واختبر خط بطول متر وتلات نقاطات تحت ملاحظة المدرّب، بالطقم المتوافق اللي اتراجع ودليله.\n\nلازم تسجيل الطقم المتوافق ودليل مصنعه، بما فيه توافق أداة التخريم والنقاطات وحدود ضغط التشغيل وتدفقه، قبل عرض تشغيلي تفصيلي أو اختبار ماء حقيقي.\n\nملاحظة المدرّب: بنود البطاقة العشرة\n\nلبس وسيلة الحماية المناسبة للشغل، زي جوانتي مناسب للمهمة، وجهّز مكان آمن\n\nاستخدم جاروف زراعة يدوي صغير عشان ياخد عينة من منطقة الجذور النشطة؛ عمق عمق تقريبي من عشرة لخمستاشر سنتيمتر خاص بتمرين صندوق الزراعة ده بس\n\nنفّذ بنفسه اختبار الملمس والشكل وسجّل الملاحظات\n\nفسّر الرطوبة من الأدلة والقوام الحقيقيين، مش إجابة «جافة جدًا» الجاهزة\n\nسمّى الأنبوب والتلات نقاطات وأداة التخريم والسدادة والوصلة والفلتر وأجزاء التحكم المطلوبة\n\nقاس أنبوب متوافقًا بطول متر وعمل تلات ثقوب حسب مواقع النباتات بأمان\n\nثبّت تلات نقاطات متوافقة جيدًا\n\nثبت سدادة النهاية بإحكام\n\nثبت وصلة المصدر حسب تعليمات الطقم الحقيقي\n\nاختبار تحت تحكم المدرّب أكد خروج الماء من الثلاثة وعدم تسريب الوصلات؛ الطالب يصلح العيوب بأمان وينظف'), ('ملاحظات عينات فعلية قبل المياه وبعدها\n\nرمل\n\nلوم\n\nطين\n\nالمكان والعمق والتاريخ وكود العينة\n\nقبل الإضافة: الحبيبات والكرة والشريط وآثار البلل اللي شفتها\n\nالمياه المضافة فعلًا والملاحظة بعدها، أو التجربة ما اتعملتش\n\nتفسير حسب القوام والدليل واللي لسه مش معروف\n\nسجل الطقم والتغذية الفعليين\n\nالماركة والموديل\n\nتوافق الأنبوب والنقاطات\n\nاسم الأداة ومواصفة الثقب من الدليل\n\nاسم الدليل وإصداره والصفحة المطلوبة\n\nالفلتر وجودة المياه الفعلية\n\nتنظيم الضغط والعداد وحدود المنتج من الدليل\n\nالتغذية والعزل الآمن ومراجعة المدرّب\n\nالمعدات أو المعلومات الناقصة؛ من غير افتراض أرقام\n\nسجل الملاحظة الفردية للمخارج والمتابعة\n\nالنقاطة ١: الملاحظة والطريقة والوحدة لو اتقاست\n\nالنقاطة ٢: الملاحظة والطريقة والوحدة لو اتقاست\n\nالنقاطة ٣: الملاحظة والطريقة والوحدة لو اتقاست\n\nالوصلات والتسريب والإصلاح الآمن\n\nدليل إعادة الاختبار والعيوب اللي لسه موجودة\n\nالطالب والمدرّب والتاريخ والمكان ودليل التنظيف\n\nلسه مفيش ملاحظة أو قرار مدرّب أو توقيع متسجل. يتكتبوا بعد شغل فعلي تحت الإشراف.\n\nالطقم المتوافق الفعلي لسه مش متسجل. مفيش ضغط أو تصرف أو مقاس ثقب أو مسافات نقاطات رقمية متفترضة.', 'ملاحظات عينات فعلية قبل المياه وبعدها\n\nرمل\n\nلوم\n\nطين\n\nالمكان والعمق والتاريخ وكود العينة\n\nقبل الإضافة: الحبيبات والكرة والشريط وآثار البلل اللي شفتها\n\nالمياه المضافة فعلًا والملاحظة بعدها، أو التجربة ما اتعملتش\n\nتفسير حسب القوام والدليل واللي لسه مش معروف\n\nسجل الطقم والتغذية الفعليين\n\nالماركة والموديل\n\nتوافق الأنبوب والنقاطات\n\nاسم الأداة ومواصفة الثقب من الدليل\n\nاسم الدليل وإصداره والصفحة المطلوبة\n\nالفلتر وجودة المياه الفعلية\n\nتنظيم الضغط والعداد وحدود المنتج من الدليل\n\nالتغذية والعزل الآمن ومراجعة المدرّب\n\nالمعدات أو المعلومات الناقصة؛ من غير افتراض أرقام\n\nسجل الملاحظة الفردية للمخارج والمتابعة\n\nالنقاطة واحد: الملاحظة والطريقة والوحدة لو اتقاست\n\nالنقاطة اتنين: الملاحظة والطريقة والوحدة لو اتقاست\n\nالنقاطة تلاتة: الملاحظة والطريقة والوحدة لو اتقاست\n\nالوصلات والتسريب والإصلاح الآمن\n\nدليل إعادة الاختبار والعيوب اللي لسه موجودة\n\nالطالب والمدرّب والتاريخ والمكان ودليل التنظيف\n\nلسه مفيش ملاحظة أو قرار مدرّب أو توقيع متسجل. يتكتبوا بعد شغل فعلي تحت الإشراف.\n\nالطقم المتوافق الفعلي لسه مش متسجل. مفيش ضغط أو تصرف أو مقاس ثقب أو مسافات نقاطات رقمية متفترضة.')], 'en': [('Actual sample observations: before and after\n\nSand\n\nLoam\n\nClay\n\nPlace, depth, date and sample identity\n\nBefore addition: actual grains/ball/ribbon/stain observations\n\nActual water added and after-observations, or not performed\n\nTexture-specific interpretation, guide and uncertainties\n\nActual kit and supply record\n\nManufacturer and model\n\nTube and emitter compatibility\n\nPunch/tool identity and hole specification from the manual\n\nManual title/version and relevant page\n\nFilter and actual water quality\n\nPressure control/gauge and product limits from the manual\n\nSafe supply, isolation and trainer verification\n\nMissing equipment or information; no value inferred\n\nActual individual output and follow-up record\n\nOutlet 1: observation, method and units if measured\n\nOutlet 2: observation, method and units if measured\n\nOutlet 3: observation, method and units if measured\n\nJoints, leaks and safe corrective action\n\nRetest evidence and remaining defects\n\nStudent, trainer, date/site and clean-up evidence\n\nNo observation, trainer decision or signature has been recorded. Complete them only after actual supervised work.\n\nActual compatible kit not recorded. No product pressure, flow, hole-size or numerical emitter spacing is supplied.', 'Actual sample observations: before and after\n\nSand\n\nLoam\n\nClay\n\nPlace, depth, date and sample identity\n\nBefore addition: actual grains, ball, ribbon, stain observations\n\nActual water added and after-observations, or not performed\n\nTexture-specific interpretation, guide and uncertainties\n\nActual kit and supply record\n\nManufacturer and model\n\nTube and emitter compatibility\n\nPunch, tool identity and hole specification from the manual\n\nManual title, version and relevant page\n\nFilter and actual water quality\n\nPressure control, gauge and product limits from the manual\n\nSafe supply, isolation and trainer verification\n\nMissing equipment or information; no value inferred\n\nActual individual output and follow-up record\n\nOutlet one: observation, method and units if measured\n\nOutlet two: observation, method and units if measured\n\nOutlet three: observation, method and units if measured\n\nJoints, leaks and safe corrective action\n\nRetest evidence and remaining defects\n\nStudent, trainer, date, site and clean-up evidence\n\nNo observation, trainer decision or signature has been recorded. Complete them only after actual supervised work.\n\nActual compatible kit not recorded. No product pressure, flow, hole-size or numerical emitter spacing is supplied.'), ("For this supervised process-card exercise, use a trowel to take your own sample from the trainer-designated root zone of the provided planter box containing young plants in sandy loam. Record and interpret the actual moisture observations, then personally assemble and test a one-metre line with three emitters under trainer observation, using the verified compatible kit and its manual.\n\nA compatible kit and its manufacturer instructions, including punch/emitter size and operating pressure/flow, must be recorded before detailed demonstration or actual water test.\n\nTrainer observation: ten original checklist items\n\nSuitable PPE used (for example, gloves appropriate to the task) and workspace made safe\n\nUses a trowel to take a sample from the active root zone; approximately 10–15 cm applies only to this planter-box exercise\n\nFeel and appearance test personally performed and observations recorded\n\nMoisture interpreted from actual evidence and texture, not a prescribed 'too dry' answer\n\nTubing, three emitters, punch, cap, connector and required filter/control components identified\n\nOne-metre compatible tube measured and three plant-aligned holes punched safely\n\nThree compatible emitters firmly seated\n\nEnd cap fitted securely\n\nSource connector fitted per actual kit instructions\n\nTrainer-controlled test confirms all three outputs and leak-free joints; student corrects faults safely and cleans up", "For this supervised process-card exercise, use a trowel to take your own sample from the trainer-designated root zone of the provided planter box containing young plants in sandy loam. Record and interpret the actual moisture observations, then personally assemble and test a one-metre line with three emitters under trainer observation, using the verified compatible kit and its manual.\n\nA compatible kit and its manufacturer instructions, including punch, emitter size and operating pressure, flow, must be recorded before detailed demonstration or actual water test.\n\nTrainer observation: ten original checklist items\n\nSuitable personal protective equipment used (for example, gloves appropriate to the task) and workspace made safe\n\nUses a trowel to take a sample from the active root zone; approximately ten to fifteen centimetres applies only to this planter-box exercise\n\nFeel and appearance test personally performed and observations recorded\n\nMoisture interpreted from actual evidence and texture, not a prescribed 'too dry' answer\n\nTubing, three emitters, punch, cap, connector and required filter, control components identified\n\nOne-metre compatible tube measured and three plant-aligned holes punched safely\n\nThree compatible emitters firmly seated\n\nEnd cap fitted securely\n\nSource connector fitted per actual kit instructions\n\nTrainer-controlled test confirms all three outputs and leak-free joints; student corrects faults safely and cleans up"), ('One-metre / three-emitter teaching brief. Positions and component shapes are schematic, not actual kit dimensions, hole sizes or a product demonstration. Select a component to inspect its role. An assembled picture is not a water test.\n\nMatch each component to its function\n\nTube\n\nCarries water along the line\n\nThree emitters\n\nRelease water near the three intended plants\n\nMatching punch\n\nMakes product-matched holes with the safe kit tool\n\nEnd cap\n\nCloses the downstream end\n\nSupply connector\n\nJoins the isolated line to its compatible supply\n\nUpstream filter\n\nReduces particles that could block emitters\n\nKit-required pressure controls\n\nMaintain/check the selected kit’s operating limits\n\nArrange a safe conceptual workflow\n\nEach card must appear once. Layout and kit verification precede punching; punching precedes emitter seating; emitters, end closure and connector precede a test. Independent closures may change order where the real manual allows. This is reasoning practice, not permission to operate.\n\nLay out and name the disconnected components\n\nCheck PPE, tool compatibility and actual kit/manual limits\n\nMeasure one metre, mark three plant positions and use the kit-matched punch\n\nSeat the three compatible emitters\n\nFit the downstream end cap\n\nFit the connector to the isolated, inactive line\n\nTrainer-controlled test of all three outlets and joints; isolate before fault correction, retest and tidy', 'One-metre, three-emitter teaching brief. Positions and component shapes are schematic, not actual kit dimensions, hole sizes or a product demonstration. Select a component to inspect its role. An assembled picture is not a water test.\n\nMatch each component to its function\n\nTube\n\nCarries water along the line\n\nThree emitters\n\nRelease water near the three intended plants\n\nMatching punch\n\nMakes product-matched holes with the safe kit tool\n\nEnd cap\n\nCloses the downstream end\n\nSupply connector\n\nJoins the isolated line to its compatible supply\n\nUpstream filter\n\nReduces particles that could block emitters\n\nKit-required pressure controls\n\nMaintain or check the selected kit’s operating limits\n\nArrange a safe conceptual workflow\n\nEach card must appear once. Layout and kit verification precede punching; punching precedes emitter seating; emitters, end closure and connector precede a test. Independent closures may change order where the real manual allows. This is reasoning practice, not permission to operate.\n\nLay out and name the disconnected components\n\nCheck personal protective equipment, tool compatibility and actual kit and manual limits\n\nMeasure one metre, mark three plant positions and use the kit-matched punch\n\nSeat the three compatible emitters\n\nFit the downstream end cap\n\nFit the connector to the isolated, inactive line\n\nTrainer-controlled test of all three outlets and joints; isolate before fault correction, retest and tidy'), ("Trainer records student ID, actual sampling position/depth (source card offers approximately 10–15 cm for its planter box), texture, squeeze/ribbon/color/water-stain observations, moisture judgment and a texture-specific reason. The student reports the observed state, even if it is not dry.\n\nPass only on individual observed sampling and supported interpretation; a simulator click, group answer or scripted 'too dry' label does not pass.\n\nMatches each listed component to its function and orders layout, kit-guided marking/punching, emitter seating, end closure, source connector, filtration/pressure verification, controlled water test and clean-up. No invented pressure, flow or hole-spacing numbers.\n\nPass when functions, sequence, kit compatibility and test boundary are correct; missing safety or kit verification triggers targeted retry.\n\nTrainer witnesses the same student use the suitable PPE/tool, position three holes for three plants along a measured 1 m compatible tube, fit three emitters, cap and connect, then test under kit-specified operating conditions for secure joints, leaks and all three outputs, correct defects and tidy the site.\n\nPass only after all individual safety and functional checks are observed and signed. Any untested or leaking line remains unpassed until safely corrected and retested.\n\nC01 and C03 pass only with trainer-recorded individual evidence for all applicable safety and functional checks; no fixed score substitution. Correct and retest any failure. C02 is assessed separately online.", "Trainer records student ID, actual sampling position, depth (source card offers approximately ten to fifteen centimetres for its planter box), texture, squeeze, ribbon, color, water-stain observations, moisture judgment and a texture-specific reason. The student reports the observed state, even if it is not dry.\n\nPass only on individual observed sampling and supported interpretation; a simulator click, group answer or scripted 'too dry' label does not pass.\n\nMatches each listed component to its function and orders layout, kit-guided marking, punching, emitter seating, end closure, source connector, filtration, pressure verification, controlled water test and clean-up. No invented pressure, flow or hole-spacing numbers.\n\nPass when functions, sequence, kit compatibility and test boundary are correct; missing safety or kit verification triggers targeted retry.\n\nTrainer witnesses the same student use the suitable personal protective equipment and tool, position three holes for three plants along a measured one-metre compatible tube, fit three emitters, cap and connect, then test under kit-specified operating conditions for secure joints, leaks and all three outputs, correct defects and tidy the site.\n\nPass only after all individual safety and functional checks are observed and signed. Any untested or leaking line remains unpassed until safely corrected and retested.\n\nC zero one and C zero three pass only with trainer-recorded individual evidence for all applicable safety and functional checks; no fixed score substitution. Correct and retest any failure. C zero two is assessed separately online.")], 'it': [('Compito didattico: un metro e tre gocciolatori. Posizioni e forme sono schematiche, non misure del kit, fori o dimostrazione operativa. Selezionare un componente per la funzione. Immagine montata non significa prova idrica.\n\nAssocia parte e funzione\n\nTubo\n\nTrasporta acqua lungo la linea\n\nTre gocciolatori\n\nErogano vicino alle tre piante previste\n\nPunzone compatibile\n\nCrea fori compatibili con l’attrezzo sicuro\n\nTappo terminale\n\nChiude l’estremità a valle\n\nRaccordo\n\nCollega la linea isolata alla fonte compatibile\n\nFiltro a monte\n\nRiduce particelle che ostruiscono i gocciolatori\n\nControlli di pressione del kit\n\nMantengono o verificano i limiti del kit scelto\n\nOrdina la logica di preparazione sicura\n\nOgni scheda una volta. Disposizione e verifica del kit precedono i fori, i fori precedono i gocciolatori; gocciolatori, tappo e raccordo precedono la prova. Chiusure indipendenti possono cambiare ordine se consentito dal manuale. È ragionamento, non permesso operativo.\n\nDisporre e nominare i pezzi scollegati\n\nVerificare protezioni, attrezzi e limiti del manuale reale\n\nMisurare un metro, segnare tre piante e usare il punzone compatibile\n\nInserire i tre gocciolatori compatibili\n\nMontare il tappo a valle\n\nMontare raccordo sulla linea isolata e inattiva\n\nProva controllata dal formatore di sbocchi/giunti; isolare prima di correggere, riprovare e riordinare', 'Compito didattico: un metro e tre gocciolatori. Posizioni e forme sono schematiche, non misure del kit, fori o dimostrazione operativa. Selezionare un componente per la funzione. Immagine montata non significa prova idrica.\n\nAssocia parte e funzione\n\nTubo\n\nTrasporta acqua lungo la linea\n\nTre gocciolatori\n\nErogano vicino alle tre piante previste\n\nPunzone compatibile\n\nCrea fori compatibili con l’attrezzo sicuro\n\nTappo terminale\n\nChiude l’estremità a valle\n\nRaccordo\n\nCollega la linea isolata alla fonte compatibile\n\nFiltro a monte\n\nRiduce particelle che ostruiscono i gocciolatori\n\nControlli di pressione del kit\n\nMantengono o verificano i limiti del kit scelto\n\nOrdina la logica di preparazione sicura\n\nOgni scheda una volta. Disposizione e verifica del kit precedono i fori, i fori precedono i gocciolatori; gocciolatori, tappo e raccordo precedono la prova. Chiusure indipendenti possono cambiare ordine se consentito dal manuale. È ragionamento, non permesso operativo.\n\nDisporre e nominare i pezzi scollegati\n\nVerificare protezioni, attrezzi e limiti del manuale reale\n\nMisurare un metro, segnare tre piante e usare il punzone compatibile\n\nInserire i tre gocciolatori compatibili\n\nMontare il tappo a valle\n\nMontare raccordo sulla linea isolata e inattiva\n\nProva controllata dal formatore di sbocchi, giunti; isolare prima di correggere, riprovare e riordinare'), ('L’istruttore registra studente, punto e profondità reali di prelievo (circa 10–15 cm solo per la fioriera della scheda originale), tessitura, forma, nastro, colore e tracce d’acqua, giudizio e motivazione. Si riferisce la condizione osservata anche se non è secca.\n\nSuperamento solo con prelievo individuale osservato e interpretazione giustificata; un clic simulato, una risposta collettiva o «troppo secco» recitato non bastano.\n\nAssocia i componenti alla funzione e ordina disposizione, marcatura e foratura secondo il manuale, inserimento, chiusura, raccordo, verifica di filtro e pressione, prova controllata e pulizia. Nessun numero inventato per pressione, portata o distanza.\n\nSuperamento se funzioni, sequenza, compatibilità e confini della prova sono corretti; errori di sicurezza o mancata verifica del kit richiedono ripasso mirato.\n\nL’istruttore osserva lo stesso studente usare protezioni e attrezzi adatti, segnare tre fori secondo tre piante su tubo compatibile da un metro, inserire gocciolatori, tappo e raccordo, poi provare nelle condizioni previste dal kit tutti e tre gli sbocchi e i giunti, correggere i difetti e riordinare.\n\nSuperamento soltanto dopo registrazione e firma di tutte le verifiche individuali di sicurezza e funzionalità. Una linea non provata o con perdite resta non superata finché non viene corretta e riprovata in sicurezza.\n\nC01 e C03 si superano soltanto con prove individuali registrate e firmate dall’istruttore per tutti i controlli pertinenti. Nessuna soglia numerica sostitutiva. Correggere e riprovare ogni errore. C02 è valutato separatamente online.', 'L’istruttore registra studente, punto e profondità reali di prelievo (da dieci a quindici centimetri circa solo per la fioriera della scheda originale), tessitura, forma, nastro, colore e tracce d’acqua, giudizio e motivazione. Si riferisce la condizione osservata anche se non è secca.\n\nSuperamento solo con prelievo individuale osservato e interpretazione giustificata; un clic simulato, una risposta collettiva o «troppo secco» recitato non bastano.\n\nAssocia i componenti alla funzione e ordina disposizione, marcatura e foratura secondo il manuale, inserimento, chiusura, raccordo, verifica di filtro e pressione, prova controllata e pulizia. Nessun numero inventato per pressione, portata o distanza.\n\nSuperamento se funzioni, sequenza, compatibilità e confini della prova sono corretti; errori di sicurezza o mancata verifica del kit richiedono ripasso mirato.\n\nL’istruttore osserva lo stesso studente usare protezioni e attrezzi adatti, segnare tre fori secondo tre piante su tubo compatibile da un metro, inserire gocciolatori, tappo e raccordo, poi provare nelle condizioni previste dal kit tutti e tre gli sbocchi e i giunti, correggere i difetti e riordinare.\n\nSuperamento soltanto dopo registrazione e firma di tutte le verifiche individuali di sicurezza e funzionalità. Una linea non provata o con perdite resta non superata finché non viene corretta e riprovata in sicurezza.\n\nC zero uno e C zero tre si superano soltanto con prove individuali registrate e firmate dall’istruttore per tutti i controlli pertinenti. Nessuna soglia numerica sostitutiva. Correggere e riprovare ogni errore. C zero due è valutato separatamente online.'), ('Osservazioni reali prima e dopo l’acqua\n\nSabbia\n\nFranco\n\nArgilla\n\nPunto, profondità, data e identità\n\nGranuli, palla, nastro e macchie prima\n\nAcqua realmente aggiunta e osservazione successiva, oppure non eseguito\n\nInterpretazione per tessitura, guida e incertezze\n\nRegistro del kit e alimentazione reali\n\nMarca e modello\n\nCompatibilità tubo/gocciolatore\n\nAttrezzo e foro prescritti dal manuale\n\nTitolo/versione/pagina del manuale\n\nFiltro e qualità reale dell’acqua\n\nRegolazione/manometro e limiti del prodotto\n\nFonte, isolamento e verifica del formatore\n\nAttrezzi o dati mancanti; nessuna cifra dedotta\n\nOsservazioni individuali degli sbocchi\n\nSbocco1: osservazione, metodo e unità se misurati\n\nSbocco2: osservazione, metodo e unità se misurati\n\nSbocco3: osservazione, metodo e unità se misurati\n\nGiunti, perdite e correzione sicura\n\nProve di ripetizione e difetti residui\n\nStudente, formatore, data/sito e pulizia\n\nNessuna osservazione, decisione del formatore o firma registrata. Compilare solo dopo lavoro reale supervisionato.\n\nKit reale compatibile non registrato. Nessuna pressione, portata, misura foro o distanza numerica dedotta.', 'Osservazioni reali prima e dopo l’acqua\n\nSabbia\n\nFranco\n\nArgilla\n\nPunto, profondità, data e identità\n\nGranuli, palla, nastro e macchie prima\n\nAcqua realmente aggiunta e osservazione successiva, oppure non eseguito\n\nInterpretazione per tessitura, guida e incertezze\n\nRegistro del kit e alimentazione reali\n\nMarca e modello\n\nCompatibilità tubo, gocciolatore\n\nAttrezzo e foro prescritti dal manuale\n\nTitolo, versione, pagina del manuale\n\nFiltro e qualità reale dell’acqua\n\nRegolazione, manometro e limiti del prodotto\n\nFonte, isolamento e verifica del formatore\n\nAttrezzi o dati mancanti; nessuna cifra dedotta\n\nOsservazioni individuali degli sbocchi\n\nSbocco uno: osservazione, metodo e unità se misurati\n\nSbocco due: osservazione, metodo e unità se misurati\n\nSbocco tre: osservazione, metodo e unità se misurati\n\nGiunti, perdite e correzione sicura\n\nProve di ripetizione e difetti residui\n\nStudente, formatore, data, sito e pulizia\n\nNessuna osservazione, decisione del formatore o firma registrata. Compilare solo dopo lavoro reale supervisionato.\n\nKit reale compatibile non registrato. Nessuna pressione, portata, misura foro o distanza numerica dedotta.'), ('Per questo esercizio supervisionato della scheda pratica, usa una paletta da giardinaggio per prelevare personalmente un campione dalla zona radicale indicata dall’istruttore nella fioriera fornita, con giovani piante in terreno franco sabbioso. Registra e interpreta le osservazioni reali sull’umidità, poi monta e prova personalmente una linea di un metro con tre gocciolatori sotto osservazione dell’istruttore, con il kit compatibile verificato e il relativo manuale.\n\nPrima di dimostrazione operativa dettagliata o prova con acqua occorrono kit compatibile e manuale del produttore, con misura di punzone/gocciolatore e limiti di pressione/portata.\n\nOsservazione del formatore: dieci voci\n\nDispositivi di protezione adatti usati, per esempio guanti appropriati al compito, e area resa sicura\n\nUsa una paletta da giardinaggio per prelevare un campione dalla zona radicale attiva; circa 10–15 cm vale soltanto per questo esercizio con la fioriera\n\nProva tattile e visiva eseguita personalmente e annotata\n\nUmidità interpretata da osservazioni e tessitura effettive, non da «troppo secco» predefinito\n\nRiconosciuti tubo, tre gocciolatori, punzone, tappo, raccordo e filtro/controlli richiesti\n\nTubo compatibile da un metro misurato e tre fori sicuri allineati alle piante\n\nTre gocciolatori compatibili inseriti saldamente\n\nTappo terminale fissato\n\nRaccordo montato secondo il kit reale\n\nProva controllata dall’istruttore conferma tre sbocchi e giunti senza perdite; correzione sicura e pulizia', 'Per questo esercizio supervisionato della scheda pratica, usa una paletta da giardinaggio per prelevare personalmente un campione dalla zona radicale indicata dall’istruttore nella fioriera fornita, con giovani piante in terreno franco sabbioso. Registra e interpreta le osservazioni reali sull’umidità, poi monta e prova personalmente una linea di un metro con tre gocciolatori sotto osservazione dell’istruttore, con il kit compatibile verificato e il relativo manuale.\n\nPrima di dimostrazione operativa dettagliata o prova con acqua occorrono kit compatibile e manuale del produttore, con misura di punzone, gocciolatore e limiti di pressione, portata.\n\nOsservazione del formatore: dieci voci\n\nDispositivi di protezione adatti usati, per esempio guanti appropriati al compito, e area resa sicura\n\nUsa una paletta da giardinaggio per prelevare un campione dalla zona radicale attiva; da dieci a quindici centimetri circa vale soltanto per questo esercizio con la fioriera\n\nProva tattile e visiva eseguita personalmente e annotata\n\nUmidità interpretata da osservazioni e tessitura effettive, non da «troppo secco» predefinito\n\nRiconosciuti tubo, tre gocciolatori, punzone, tappo, raccordo e filtro, controlli richiesti\n\nTubo compatibile da un metro misurato e tre fori sicuri allineati alle piante\n\nTre gocciolatori compatibili inseriti saldamente\n\nTappo terminale fissato\n\nRaccordo montato secondo il kit reale\n\nProva controllata dall’istruttore conferma tre sbocchi e giunti senza perdite; correzione sicura e pulizia')], 'de': [('Die Lehrkraft dokumentiert Person, tatsächlichen Entnahmeort und Tiefe (etwa 10–15 cm nur für den Pflanzkasten der Originalkarte), Textur, Kugel-, Band-, Farb- und Feuchtespuren sowie begründetes Urteil. Die beobachtete Lage gilt auch dann, wenn sie nicht trocken ist.\n\nBestanden nur bei einzeln beobachteter Entnahme und begründeter Deutung. Simulationsklick, Gruppenantwort oder auswendig gelerntes „zu trocken“ genügt nicht.\n\nOrdnet jedes Bauteil seiner Funktion zu und bringt Auslegen, Markieren und kitgerechtes Lochen, Einsetzen, Verschließen, Anschließen, Filter- und Druckprüfung, kontrollierten Test und Aufräumen in Reihenfolge. Keine erfundenen Druck-, Durchfluss- oder Abstandsangaben.\n\nBestanden bei korrekten Funktionen, Ablauf, Bauteilkompatibilität und Prüfgrenzen; Fehler bei Sicherheit oder Kitprüfung führen zu gezielter Wiederholung.\n\nDie Lehrkraft beobachtet dieselbe lernende Person beim Verwenden geeigneter Schutzausrüstung und Werkzeuge, beim Positionieren von drei Löchern für drei Pflanzen an einem gemessenen kompatiblen 1-m-Schlauch, beim Einsetzen dreier Tropfer, Verschließen und Anschließen. Die Person testet anschließend unter den vom Kit vorgegebenen Betriebsbedingungen den festen Sitz der Verbindungen, Lecks und alle drei Auslässe, behebt Mängel und räumt den Arbeitsplatz auf.\n\nBestanden erst nach Dokumentation und Unterschrift aller individuellen Sicherheits- und Funktionskontrollen. Eine ungeprüfte oder undichte Leitung bleibt bis zur sicheren Korrektur und Nachprüfung offen.\n\nC01 und C03 bestehen nur mit von der Lehrkraft dokumentierten individuellen Sicherheits- und Funktionsnachweisen für alle zutreffenden Punkte. Keine feste Ersatz-Punktzahl. Fehler korrigieren und erneut prüfen. C02 wird getrennt online bewertet.', 'Die Lehrkraft dokumentiert Person, tatsächlichen Entnahmeort und Tiefe (etwa zehn bis fünfzehn Zentimeter nur für den Pflanzkasten der Originalkarte), Textur, Kugel-, Band-, Farb- und Feuchtespuren sowie begründetes Urteil. Die beobachtete Lage gilt auch dann, wenn sie nicht trocken ist.\n\nBestanden nur bei einzeln beobachteter Entnahme und begründeter Deutung. Simulationsklick, Gruppenantwort oder auswendig gelerntes „zu trocken“ genügt nicht.\n\nOrdnet jedes Bauteil seiner Funktion zu und bringt Auslegen, Markieren und kitgerechtes Lochen, Einsetzen, Verschließen, Anschließen, Filter- und Druckprüfung, kontrollierten Test und Aufräumen in Reihenfolge. Keine erfundenen Druck-, Durchfluss- oder Abstandsangaben.\n\nBestanden bei korrekten Funktionen, Ablauf, Bauteilkompatibilität und Prüfgrenzen; Fehler bei Sicherheit oder Kitprüfung führen zu gezielter Wiederholung.\n\nDie Lehrkraft beobachtet dieselbe lernende Person beim Verwenden geeigneter Schutzausrüstung und Werkzeuge, beim Positionieren von drei Löchern für drei Pflanzen an einem gemessenen kompatiblen Ein-Meter-Schlauch, beim Einsetzen dreier Tropfer, Verschließen und Anschließen. Die Person testet anschließend unter den vom Kit vorgegebenen Betriebsbedingungen den festen Sitz der Verbindungen, Lecks und alle drei Auslässe, behebt Mängel und räumt den Arbeitsplatz auf.\n\nBestanden erst nach Dokumentation und Unterschrift aller individuellen Sicherheits- und Funktionskontrollen. Eine ungeprüfte oder undichte Leitung bleibt bis zur sicheren Korrektur und Nachprüfung offen.\n\nC null eins und C null drei bestehen nur mit von der Lehrkraft dokumentierten individuellen Sicherheits- und Funktionsnachweisen für alle zutreffenden Punkte. Keine feste Ersatz-Punktzahl. Fehler korrigieren und erneut prüfen. C null zwei wird getrennt online bewertet.'), ('Echte Probenbeobachtung vor und nach Wasser\n\nSand\n\nLehm\n\nTon\n\nStelle, Tiefe, Datum und Probenkennung\n\nKörner, Kugel, Band und Flecken vorher\n\nWirkliche Zugabe und Nachbeobachtung oder nicht durchgeführt\n\nTexturbezogene Deutung, Anleitung und Unsicherheit\n\nEchtes Kit und Versorgung protokollieren\n\nHersteller und Modell\n\nSchlauch-/Tropferkompatibilität\n\nWerkzeug und Lochvorgabe der Anleitung\n\nTitel/Version/Seite der Anleitung\n\nFilter und tatsächliche Wasserqualität\n\nDruckregelung/Messung und Produktgrenzen\n\nQuelle, Absperrung und Lehrkraftprüfung\n\nFehlende Ausrüstung/Daten; keine Zahl ableiten\n\nIndividuelles Auslass- und Folgeprotokoll\n\nAuslass1: Beobachtung, Methode und Einheit falls gemessen\n\nAuslass2: Beobachtung, Methode und Einheit falls gemessen\n\nAuslass3: Beobachtung, Methode und Einheit falls gemessen\n\nVerbindungen, Lecks und sichere Korrektur\n\nNachprüfbelege und Restfehler\n\nPerson, Lehrkraft, Datum/Ort und Aufräumbeleg\n\nNoch keine Beobachtung, Lehrkraftentscheidung oder Unterschrift dokumentiert. Erst nach echter betreuter Arbeit ausfüllen.\n\nTatsächlich kompatibles Kit nicht dokumentiert. Keine Druck-, Durchfluss-, Loch- oder Zahlenabstände erfunden.', 'Echte Probenbeobachtung vor und nach Wasser\n\nSand\n\nLehm\n\nTon\n\nStelle, Tiefe, Datum und Probenkennung\n\nKörner, Kugel, Band und Flecken vorher\n\nWirkliche Zugabe und Nachbeobachtung oder nicht durchgeführt\n\nTexturbezogene Deutung, Anleitung und Unsicherheit\n\nEchtes Kit und Versorgung protokollieren\n\nHersteller und Modell\n\nSchlauch-, Tropferkompatibilität\n\nWerkzeug und Lochvorgabe der Anleitung\n\nTitel, Version, Seite der Anleitung\n\nFilter und tatsächliche Wasserqualität\n\nDruckregelung, Messung und Produktgrenzen\n\nQuelle, Absperrung und Lehrkraftprüfung\n\nFehlende Ausrüstung, Daten; keine Zahl ableiten\n\nIndividuelles Auslass- und Folgeprotokoll\n\nAuslass eins: Beobachtung, Methode und Einheit falls gemessen\n\nAuslass zwei: Beobachtung, Methode und Einheit falls gemessen\n\nAuslass drei: Beobachtung, Methode und Einheit falls gemessen\n\nVerbindungen, Lecks und sichere Korrektur\n\nNachprüfbelege und Restfehler\n\nPerson, Lehrkraft, Datum, Ort und Aufräumbeleg\n\nNoch keine Beobachtung, Lehrkraftentscheidung oder Unterschrift dokumentiert. Erst nach echter betreuter Arbeit ausfüllen.\n\nTatsächlich kompatibles Kit nicht dokumentiert. Keine Druck-, Durchfluss-, Loch- oder Zahlenabstände erfunden.'), ('Verwende bei dieser betreuten Übung der Arbeitskarte eine Pflanzkelle, um selbst eine Probe aus dem von der Lehrkraft bestimmten Wurzelraum des bereitgestellten Pflanzkastens mit jungen Pflanzen in sandigem Lehm zu entnehmen. Dokumentiere und deute die tatsächlichen Feuchtebeobachtungen; montiere und prüfe danach selbst eine einen Meter lange Leitung mit drei Tropfern unter Beobachtung der Lehrkraft, mit dem geprüften kompatiblen Kit und seiner Anleitung.\n\nVor genauer Vorführung oder echtem Wassertest müssen ein kompatibles Kit und dessen Herstelleranleitung samt passenden Loch-/Tropfergrößen und Druck-/Durchflussgrenzen dokumentiert sein.\n\nLehrkraftbeobachtung: zehn Originalpunkte\n\nGeeignete Schutzausrüstung verwendet, zum Beispiel für die Aufgabe passende Handschuhe, und Arbeitsplatz gesichert\n\nEntnimmt mit einer Pflanzkelle eine Probe aus dem aktiven Wurzelraum; etwa 10–15 cm gilt nur für diese Pflanzkastenübung\n\nTast- und Sichtprüfung eigenhändig durchgeführt und erfasst\n\nFeuchte nach wirklichem Befund und Textur gedeutet, nicht nach vorgegebenem „zu trocken“\n\nSchlauch, drei Tropfer, Werkzeug, Verschluss, Anschluss und nötige Filter-/Regelteile benannt\n\nPassenden Ein-Meter-Schlauch gemessen und drei pflanzenbezogene Löcher sicher gesetzt\n\nDrei kompatible Tropfer fest eingesetzt\n\nEndverschluss sicher angebracht\n\nQuellenanschluss nach wirklicher Kit-Anleitung angebracht\n\nVon Lehrkraft kontrollierter Test bestätigt drei Ausläufe und dichte Verbindungen; Fehler sicher korrigiert und aufgeräumt', 'Verwende bei dieser betreuten Übung der Arbeitskarte eine Pflanzkelle, um selbst eine Probe aus dem von der Lehrkraft bestimmten Wurzelraum des bereitgestellten Pflanzkastens mit jungen Pflanzen in sandigem Lehm zu entnehmen. Dokumentiere und deute die tatsächlichen Feuchtebeobachtungen; montiere und prüfe danach selbst eine einen Meter lange Leitung mit drei Tropfern unter Beobachtung der Lehrkraft, mit dem geprüften kompatiblen Kit und seiner Anleitung.\n\nVor genauer Vorführung oder echtem Wassertest müssen ein kompatibles Kit und dessen Herstelleranleitung samt passenden Loch-, Tropfergrößen und Druck-, Durchflussgrenzen dokumentiert sein.\n\nLehrkraftbeobachtung: zehn Originalpunkte\n\nGeeignete Schutzausrüstung verwendet, zum Beispiel für die Aufgabe passende Handschuhe, und Arbeitsplatz gesichert\n\nEntnimmt mit einer Pflanzkelle eine Probe aus dem aktiven Wurzelraum; etwa zehn bis fünfzehn Zentimeter gilt nur für diese Pflanzkastenübung\n\nTast- und Sichtprüfung eigenhändig durchgeführt und erfasst\n\nFeuchte nach wirklichem Befund und Textur gedeutet, nicht nach vorgegebenem „zu trocken“\n\nSchlauch, drei Tropfer, Werkzeug, Verschluss, Anschluss und nötige Filter-, Regelteile benannt\n\nPassenden Ein-Meter-Schlauch gemessen und drei pflanzenbezogene Löcher sicher gesetzt\n\nDrei kompatible Tropfer fest eingesetzt\n\nEndverschluss sicher angebracht\n\nQuellenanschluss nach wirklicher Kit-Anleitung angebracht\n\nVon Lehrkraft kontrollierter Test bestätigt drei Ausläufe und dichte Verbindungen; Fehler sicher korrigiert und aufgeräumt')]}
        for change in u['spokenAdaptationChanges']:
            assert(change['written'],change['spoken'])in allowedByLocale[u['locale']]
            assert reconstructed.count(change['written'])==change['occurrences']
            reconstructed=reconstructed.replace(change['written'],change['spoken'])
        assert reconstructed==u['spokenText']
        assert u['spokenTextSha256']==plan['spokenTextSHA256']==hashlib.sha256(u['spokenText'].encode()).hexdigest()
        assert u['deliverySha256']==hashlib.sha256(u['delivery'].encode()).hexdigest()
        fp={'model':req['model'],'locale':u['locale'],'voice':u['voice'],'spokenText':u['spokenText'],'delivery':u['delivery'],'format':'pcm-s16le-24000-mono-v1'}
        assert hashlib.sha256(json.dumps(fp,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()==u['requestFingerprintSha256']==plan['requestFingerprintSHA256']
        assert(u['maximumProviderCalls'],u['maximumBlindAudioReviewCalls'],u['maximumASRInvocations'],u['automaticRetries'])==(1,1,1,0)
        assert not u['assessmentSolutionsIncluded']and not u['quizOrWrittenKeysIncluded']
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req,runtime

def lane():
    loc=os.environ.get('LOCALE_LANE');assert loc in ['ar-EG','en','it','de'];assert os.environ.get('GITHUB_JOB')=={'ar-EG':'narrate_ar','en':'narrate_en','it':'narrate_it','de':'narrate_de'}[loc];return loc

def require_actions():
    lane()
    assert os.environ.get('GITHUB_ACTIONS')=='true','Actions only'
    assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820' and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418' and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s306-practice-audio-20261023-r1'
    event=read(os.environ['GITHUB_EVENT_PATH'])
    assert event['created'] is True and event['before']=='0'*40 and event['after']==os.environ['GITHUB_SHA'] and event['ref']==os.environ['GITHUB_REF']
    assert event['repository']['full_name']=='cabicci/viva-ai-systems-55d35820' and event['repository']['id']==1272666418 and event['repository']['private'] is False
    for n,e in [('request.json','REQUEST_SHA'),('worker.py','WORKER_SHA'),('freeze.json','FREEZE_SHA')]:assert sha(HERE/n)==os.environ[e]

def require_shared_preconditions():
    # Unit/operation attempt files isolate failures. Only shared prerequisites block unrelated units.
    assert not(OUT/'shared-provider-stop.json').exists(),'Confirmed shared provider failure; no later calls'
    for p in [OUT/'model-preflight-attempt.json',OUT/'runtime-setup-attempt.json']:
        if p.exists():
            state=read(p).get('state','')
            assert not state.startswith('FAILED'),'Shared provider/runtime preflight failed; no generation'


def provider_key():
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        raise RuntimeError('Required server credential unavailable; zero calls')
    return key

def selected(unit_id):
    req, runtime = validate()
    assert unit_id in IDS
    chosen=next(u for u in req['units']if u['id']==unit_id)
    assert chosen['locale']==lane()and unit_id in req['fixedLocaleLanes'][lane()],'Cross-lane invocation rejected before reservation'
    return req,runtime,chosen

def folder(unit_id):
    assert unit_id in IDS
    return OUT / unit_id

def reserve(unit_id, kind, audio_sha=None):
    assert kind in ('tts', 'blind-review', 'asr')
    require_shared_preconditions()
    p = folder(unit_id) / (kind + '-attempt.json')
    count = len(list(OUT.glob('*/' + kind + '-attempt.json')))
    assert count < 4, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 16,'maximumCallsForLane':4,
             'requestSha256': sha(HERE / 'request.json'), 'workerSha256': sha(HERE / 'worker.py'),
             'audioSha256': audio_sha, 'humanListeningApproved': False,
             'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'githubRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT')}
    exclusive(p, entry)
    return p, entry

def load_engine():
    spec = importlib.util.spec_from_file_location('frozen_audio_engine', HERE / 'vendor/pipeline-engine.py')
    engine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(engine)
    # Use the same no-redirect opener for frozen engine metadata/TTS calls.
    engine.urllib.request.urlopen=urlopen
    return engine

def audio_info(path):
    with wave.open(str(path), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 24000)
        assert wav.getnframes() >= 24000
        pcm = wav.readframes(wav.getnframes())
        assert len(pcm) == wav.getnframes() * 2
        return {'channels': 1, 'sampleWidthBytes': 2, 'sampleRate': 24000,
                'frames': wav.getnframes(), 'durationSeconds': wav.getnframes() / 24000,
                'pcmSha256': hashlib.sha256(pcm).hexdigest()}

def safe_failure(attempt, state, error):
    # Never serialize str(error), response body, request headers or credential values.
    state.update(state='FAILED_OR_OUTCOME_UNKNOWN_NO_RETRY', errorType=type(error).__name__,
                 httpStatus=getattr(error, 'code', getattr(error, 'status', None)), finishedUTC=now())
    write(attempt, state)
    if state.get('httpStatus')in[301,302,303,307,308,401,403,404,429,500,502,503,504]:write(OUT/'shared-provider-stop.json',{'state':'CONFIRMED_PROVIDER_HTTP_FAILURE_STOP_REMAINING_CALLS','httpStatus':state['httpStatus']})

def preflight():
    require_actions()
    req, runtime = validate()
    require_shared_preconditions()
    key = provider_key()
    engine = load_engine()
    attempt = OUT / 'model-preflight-attempt.json'
    state = {'atUTC': now(), 'state': 'METADATA_GET_RESERVED_NO_RETRY', 'maximumGETCalls': 2, 'callsStarted': 0}
    exclusive(attempt, state)
    models = []
    try:
        for model in (req['model'], runtime['reviewModel']):
            state.update(callsStarted=state['callsStarted'] + 1, lastModel=model)
            write(attempt, state)
            result = engine.request_json('https://generativelanguage.googleapis.com/v1beta/models/' + model, key, max_attempts=1)
            write(OUT / ('model-' + model + '.raw.json'), result)
            assert result.get('name') == 'models/' + model, 'Server model identity mismatch'
            methods = result.get('supportedGenerationMethods', [])
            assert isinstance(methods, list) and methods, 'Server supplied no supported methods; unresolved availability'
            models.append({'requestedModel': model, 'serverName': result['name'], 'version': result.get('version'),
                           'supportedGenerationMethods': methods, 'selectedEndpoint': '/v1beta/interactions',
                           'endpointEvidence': 'Frozen official API documentation references; metadata methods retained verbatim.'})
        write(OUT / 'model-preflight.json', {'atUTC': now(), 'requestSha256': sha(HERE / 'request.json'),
              'githubRunId': os.environ.get('GITHUB_RUN_ID'), 'models': models, 'ttsCalls': 0,
              'noFallback': True, 'actualAudioOutputNotYetVerified': True})
        state.update(state='EXACT_MODELS_METADATA_AVAILABLE', finishedUTC=now())
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Preferred model unavailable or unresolved; no generation or fallback') from None

def require_preflight(req, runtime):
    assert read(OUT/'model-preflight-attempt.json')['state']=='EXACT_MODELS_METADATA_AVAILABLE'
    receipt = read(OUT / 'model-preflight.json')
    assert receipt['requestSha256'] == sha(HERE / 'request.json')
    assert receipt['githubRunId'] == os.environ.get('GITHUB_RUN_ID')
    assert [m['requestedModel'] for m in receipt['models']] == [req['model'], runtime['reviewModel']]

def produce(unit_id):
    require_actions()
    req, runtime, unit = selected(unit_id)
    require_preflight(req, runtime)
    require_asr_runtime(runtime)
    require_shared_preconditions()
    key = provider_key()
    target = folder(unit_id) / 'voice.wav'
    assert not target.exists(), 'Refuse existing media'
    engine = load_engine()
    payload = {'model': req['model'], 'input': [{'type': 'user_input', 'content': [{'type': 'text',
               'text': unit['spokenText'], 'annotations': [{'type': 'speech_metadata', 'style': unit['delivery']}]}]}],
               'response_format': {'type': 'audio', 'mime_type': 'audio/wav', 'sample_rate': 24000},
               'generation_config': {'speech_config': [{'voice': unit['voice']}]}}
    attempt, state = reserve(unit_id, 'tts')
    original_request = engine.request_json
    def tracked(url, credential, payload=None, max_attempts=1):
        assert max_attempts == 1 and state.get('providerCalls', 0) == 0
        assert payload['generation_config']['speech_config'][0]['voice'] == unit['voice']
        write(folder(unit_id) / 'tts-request.json', {'model': req['model'], 'locale': unit['locale'],
              'format': 'pcm-s16le-24000-mono-v1', 'body': payload})
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN', providerCalls=1, startedUTC=now())
        write(attempt, state)
        response = original_request(url, credential, payload, max_attempts=1)
        write(folder(unit_id) / 'tts-response.raw.json', response)
        return response
    engine.request_json = tracked
    try:
        response = tracked('https://generativelanguage.googleapis.com/v1beta/interactions', key, payload, max_attempts=1)
        blocks = [content for step in response.get('steps', []) if step.get('type') == 'model_output'
                  for content in step.get('content', []) if content.get('type') == 'audio']
        assert len(blocks) == 1, 'Expected exactly one complete audio block'
        block = blocks[0]
        data = base64.b64decode(block['data'], validate=True)
        (folder(unit_id) / 'provider-audio.original.bin').write_bytes(data)
        write(folder(unit_id) / 'provider-audio-format.json', {'mimeType': block.get('mime_type'),
              'sourceResponseSha256': sha(folder(unit_id) / 'tts-response.raw.json')})
        assert data.startswith(b'RIFF'), 'Expected complete unary WAV output'
        temporary = target.with_suffix('.partial.wav')
        temporary.write_bytes(data)
        assert engine.valid_wav(temporary), 'Invalid provider WAV'
        temporary.replace(target)
        assert state['providerCalls'] == 1
        state.update(state='GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW', file='voice.wav',
                     sha256=sha(target), audio=audio_info(target), finishedUTC=now(), ownerAccepted=False)
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single TTS attempt failed; no retry') from None

def verified_audio(unit_id):
    state = read(folder(unit_id) / 'tts-attempt.json')
    path = folder(unit_id) / 'voice.wav'
    assert state['state'] == 'GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW'
    assert sha(path) == state['sha256'] and audio_info(path) == state['audio']
    upload = read(folder(unit_id) / 'audio-upload-receipt.json')
    assert upload['audioSha256'] == state['sha256'] and upload['artifactId'] and upload['artifactDigest']
    return path, state

def uploaded(unit_id, artifact_id, artifact_digest):
    require_actions()
    selected(unit_id)
    path = folder(unit_id) / 'voice.wav'
    state = read(folder(unit_id) / 'tts-attempt.json')
    assert re.fullmatch(r'[1-9][0-9]*',artifact_id) and re.fullmatch(r'(?:sha256:)?[0-9a-fA-F]{64}',artifact_digest)
    assert sha(path) == state['sha256']
    exclusive(folder(unit_id) / 'audio-upload-receipt.json', {'atUTC': now(), 'artifactId': artifact_id,
              'artifactDigest': artifact_digest, 'audioSha256': sha(path), 'githubRunId':os.environ.get('GITHUB_RUN_ID'), 'beforeReviewAndASR': True})

def blind_review(unit_id):
    require_actions()
    req, runtime, unit = selected(unit_id)
    require_preflight(req, runtime)
    path, voice = verified_audio(unit_id)
    key = provider_key()
    payload = {'model': runtime['reviewModel'], 'input': [{'type': 'text', 'text': PROMPT},
        {'type': 'audio', 'mime_type': 'audio/wav', 'data': base64.b64encode(path.read_bytes()).decode('ascii')}],
        'response_format': {'type': 'text', 'mime_type': 'application/json'},
        'generation_config': {'thinking_level': 'high', 'max_output_tokens': 32768}}
    assert len(json.dumps(payload).encode('utf-8')) < 20000000, 'Inline audio request too large'
    write(folder(unit_id) / 'blind-review-prompt.json', {'model': runtime['reviewModel'], 'prompt': PROMPT,
          'referenceTranscriptSupplied': False, 'unitSpecificRepairTermsSupplied': False, 'audioSha256': sha(path), 'sourceReferenceSupplied':False})
    attempt, state = reserve(unit_id, 'blind-review', sha(path))
    try:
        request = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/interactions',
                  data=json.dumps(payload).encode('utf-8'), headers={'x-goog-api-key': key, 'Content-Type': 'application/json'}, method='POST')
        state.update(state='PROVIDER_INVOCATION_STARTED_OUTCOME_UNKNOWN', providerCalls=1, startedUTC=now())
        write(attempt, state)
        with urlopen(request, timeout=900) as response:
            raw_bytes = response.read()
        (folder(unit_id) / 'blind-review-response.raw.json').write_bytes(raw_bytes)
        raw = json.loads(raw_bytes)
        text = '\n'.join(p.get('text', '') for step in raw.get('steps', []) if step.get('type') == 'model_output'
                         for p in step.get('content', []) if p.get('type') == 'text')
        result = json.loads(text)
        assert isinstance(result['transcript'], str) and isinstance(result['findings'], list)
        assert result['overall'] in ('needs_review','uncertain','no_defect_detected')
        invalid = []
        for index, finding in enumerate(result['findings']):
            try:
                assert 0 <= float(finding['startSeconds']) < float(finding['endSeconds']) <= voice['audio']['durationSeconds'] + 0.25
            except (KeyError, TypeError, ValueError, AssertionError):
                invalid.append(index)
        write(folder(unit_id) / 'blind-review.json', {'audioSha256': sha(path), 'result': result,
              'invalidTimestampFindingIndexes': invalid, 'humanListeningApproved': False,
              'reviewLimitations': 'Model diagnostic only; invalid timing is a review defect, not evidence of defective speech.'})
        state.update(state='MODEL_DIAGNOSTIC_ONLY', finishedUTC=now(), invalidTimestampFindingIndexes=invalid,
                     modelVersion=raw.get('model'), usage=raw.get('usage'))
        write(attempt, state)
        if invalid:raise RuntimeError('Invalid finding timestamps preserved; stop current review action; independent unit diagnostics remain eligible')
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single blind review failed; no retry') from None

def verify_wheel():
    _, runtime = validate()
    wheels = list((HERE / 'wheels').glob('faster_whisper-1.2.1-*.whl'))
    assert len(wheels) == 1 and sha(wheels[0]) == runtime['asr']['wheelSha256']
    write(OUT / 'asr-wheel-verification.json', {'sha256': sha(wheels[0]), 'version': '1.2.1'})

def prepare_asr_runtime():
    require_actions();_,runtime=validate();require_shared_preconditions();verify_wheel()
    attempt=OUT/'runtime-setup-attempt.json';state={'state':'RESERVED_RUNTIME_SETUP_NO_RETRY','atUTC':now(),'providerCalls':0,'asrInvocations':0};exclusive(attempt,state)
    try:
        from faster_whisper import WhisperModel
        from huggingface_hub import snapshot_download
        cfg=runtime['asr'];assert importlib.metadata.version('faster-whisper')==cfg['packageVersion']
        modelpath=Path(snapshot_download(repo_id=cfg['modelRepo'],revision=cfg['modelRevision'],cache_dir=str(HERE/'model-cache'),allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*','preprocessor_config.json']))
        model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True);assert set(cfg['languageByLocale'].values()).issubset(set(model.supported_languages));del model
        files=[{'name':p.relative_to(modelpath).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(modelpath.rglob('*')) if p.is_file()]
        assert files and any(p['name']=='model.bin' for p in files)
        exclusive(OUT/'runtime-ready.json',{'state':'PINNED_RUNTIME_PRELOADED_NO_SPEECH_INVOCATION','requestSha256':sha(HERE/'request.json'),'settings':cfg,'modelPath':str(modelpath),'files':files,'packageVersions':{d.metadata['Name']:d.version for d in importlib.metadata.distributions()},'asrInvocations':0,'providerCalls':0})
        state.update(state='RUNTIME_READY_NO_SPEECH_INVOCATION',finishedUTC=now());write(attempt,state)
    except Exception as error:safe_failure(attempt,state,error);raise RuntimeError('Pinned runtime failed before TTS; no retry') from None

def require_asr_runtime(runtime):
    ready=read(OUT/'runtime-ready.json')
    assert ready['state']=='PINNED_RUNTIME_PRELOADED_NO_SPEECH_INVOCATION' and ready['requestSha256']==sha(HERE/'request.json') and ready['settings']==runtime['asr']
    assert read(OUT/'runtime-setup-attempt.json')['state']=='RUNTIME_READY_NO_SPEECH_INVOCATION'
    for row in ready['files']:assert sha(Path(ready['modelPath'])/row['name'])==row['sha256']
    return ready

def asr(unit_id):
    require_actions()
    _,runtime,unit=selected(unit_id);require_shared_preconditions()
    path,voice=verified_audio(unit_id);ready=require_asr_runtime(runtime)
    from faster_whisper import WhisperModel
    cfg={**runtime['asr'],'language':runtime['asr']['languageByLocale'][unit['locale']]};assert importlib.metadata.version('faster-whisper')==cfg['packageVersion'];verify_wheel()
    modelpath=Path(ready['modelPath'])
    write(folder(unit_id)/'asr-resolved-runtime.json',ready)
    model=WhisperModel(str(modelpath),device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,local_files_only=True)
    attempt, state = reserve(unit_id, 'asr', sha(path))
    try:
        assert cfg['language']in set(model.supported_languages)
        started = time.monotonic()
        state.update(state='ASR_INVOCATION_STARTED_OUTCOME_UNKNOWN',asrInvocations=1)
        write(attempt,state)
        segments, info = model.transcribe(str(path), language=cfg['language'], word_timestamps=True, beam_size=5, temperature=0,
                                         vad_filter=False, condition_on_previous_text=False)
        rows, words = [], []
        for segment in segments:
            ws = [{'segmentId': segment.id, 'wordIndex': i, 'word': word.word, 'start': float(word.start),
                   'end': float(word.end), 'probability': float(word.probability)} for i, word in enumerate(segment.words or [])]
            words.extend(ws)
            rows.append({'id': segment.id, 'start': segment.start, 'end': segment.end, 'text': segment.text,
                         'avgLogprob': segment.avg_logprob, 'noSpeechProbability': segment.no_speech_prob, 'words': ws})
        timing_issues=[]
        for index,word in enumerate(words):
            word['actualWordIndex']=index
            if not (math.isfinite(word['start']) and math.isfinite(word['end']) and 0<=word['start']<=word['end']<=voice['audio']['durationSeconds']+.25):timing_issues.append({'actualWordIndex':index,'kind':'INVALID_ACTUAL_WORD_TIMESTAMP'})
            elif word['start']==word['end']:timing_issues.append({'actualWordIndex':index,'kind':'ZERO_DURATION_REQUIRES_GROUP_REVIEW'})
        write(folder(unit_id) / 'asr-word-timestamps.json', {'atUTC': now(), 'audioSha256': sha(path), 'audio': voice['audio'],
              'settings': cfg, 'segments': rows, 'words': words, 'elapsedASRSeconds': time.monotonic() - started,
              'language': info.language, 'wordCount':len(words),'timingIssues':timing_issues,'resolvedRuntimeSha256':sha(folder(unit_id)/'asr-resolved-runtime.json'), 'initialPromptSupplied': False, 'referenceTranscriptSupplied': False,
              'method': 'ASR_ESTIMATES_NOT_FORCED_ALIGNMENT_OR_PRONUNCIATION_APPROVAL', 'humanListeningApproved': False})
        assert words and not any(i['kind']=='INVALID_ACTUAL_WORD_TIMESTAMP' for i in timing_issues),'ASR empty or invalid; preserve evidence and stop later calls'
        state.update(state='ASR_DIAGNOSTIC_ONLY', finishedUTC=now(), wordCount=len(words))
        write(attempt, state)
    except Exception as error:
        safe_failure(attempt, state, error)
        raise RuntimeError('Single ASR invocation failed; no retry') from None

def compare(unit_id):
    _, _, unit = selected(unit_id)
    path, _ = verified_audio(unit_id)
    reference = unit['spokenText']
    comparisons = {}
    for name, filename, extract in [('asr', 'asr-word-timestamps.json', lambda r: ''.join(s['text'] for s in r['segments'])),
                                    ('blindReview', 'blind-review.json', lambda r: r['result']['transcript'])]:
        source = folder(unit_id) / filename
        if source.exists():
            result = read(source)
            assert result['audioSha256'] == sha(path)
            heard = extract(result)
            comparisons[name] = {'transcript': heard, 'sequenceSimilarityDiagnosticOnly': difflib.SequenceMatcher(None, reference, heard).ratio(),
                                 'wordDiffDiagnosticOnly': list(difflib.ndiff(reference.split(), heard.split()))}
    write(folder(unit_id) / 'reference-comparison.json', {'audioSha256': sha(path), 'referenceTextNotSentToReviewers': reference,
          'comparisons': comparisons, 'humanListeningApproved': False, 'ownerAccepted': False,
          'limitations': 'Offline text comparison after independent actual-audio reviews. Similarity is not a pass criterion or acoustic proof. Review repaired words, negations, conditions, uncertainty and voice continuity before assembly.'})
    assert set(comparisons) == {'asr', 'blindReview'}, 'Incomplete diagnostics; stop dependent production'
    assert read(folder(unit_id) / 'blind-review-attempt.json')['state'] == 'MODEL_DIAGNOSTIC_ONLY'
    assert not read(folder(unit_id)/'blind-review.json')['invalidTimestampFindingIndexes']
    assert read(folder(unit_id) / 'asr-attempt.json')['state'] == 'ASR_DIAGNOSTIC_ONLY'

def summarize():
    require_actions();req,_=validate();rows=[];failed=False
    for u in [x for x in req['units']if x['locale']==lane()]:
        uid=u['id'];record={'unitId':uid,'audioPreserved':(folder(uid)/'voice.wav').exists(),'completeDiagnostics':False,'attempts':{},'humanListeningApproved':False,'integrationApproved':False}
        for kind in ['tts','blind-review','asr']:
            p=folder(uid)/(kind+'-attempt.json');record['attempts'][kind]=read(p) if p.exists() else None
        try:compare(uid);record['completeDiagnostics']=True
        except Exception as error:record['diagnosticErrorType']=type(error).__name__;failed=True
        rows.append(record)
    actual={kind:sum(int((u['attempts'][kind]or{}).get('providerCalls',0)if kind!='asr'else(u['attempts'][kind]or{}).get('asrInvocations',0))for u in rows)for kind in ['tts','blind-review','asr']}
    assert all(v<=4 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_FOUR_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':4,'maximumBlindReviewPerLane':4,'maximumASRPerLane':4,'maximumTTSAggregate':16,'maximumBlindAggregate':16,'maximumASRAggregate':16,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
    if failed:raise RuntimeError('Partial or failed diagnostics preserved; no automatic repeat or adoption')


def stage_diagnostics(unit_id):
    require_actions();selected(unit_id)
    from thin_artifacts import stage_unit
    stage_unit(folder(unit_id),HERE/'diagnostics-output'/unit_id,unit=unit_id,request_sha=sha(HERE/'request.json'),worker_sha=sha(HERE/'worker.py'),run_id=os.environ['GITHUB_RUN_ID'],commit=os.environ['GITHUB_SHA'])

def stage_complete_bundle():
    require_actions();req,_=validate()
    from thin_artifacts import stage_complete
    stage_complete(OUT,HERE/'complete-output',units=req['fixedLocaleLanes'][lane()],request_sha=sha(HERE/'request.json'),worker_sha=sha(HERE/'worker.py'),run_id=os.environ['GITHUB_RUN_ID'],commit=os.environ['GITHUB_SHA'])

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['prepare-asr-runtime', 'summarize', 'validate', 'preflight', 'produce', 'uploaded', 'blind-review', 'verify-wheel', 'asr', 'compare', 'stage-diagnostics', 'stage-complete'])
    parser.add_argument('--unit', choices=IDS)
    parser.add_argument('--artifact-id')
    parser.add_argument('--artifact-digest')
    args = parser.parse_args()
    try:
        if args.command == 'validate':
            validate()
            print('Frozen thirtytwo S1-03 reading remainder sections verified; zero provider calls.')
        elif args.command == 'prepare-asr-runtime':
            prepare_asr_runtime()
        elif args.command == 'summarize':
            summarize()
        elif args.command == 'verify-wheel':
            verify_wheel()
        elif args.command == 'preflight':
            preflight()
        elif args.command == 'stage-complete':
            stage_complete_bundle()
        elif args.command == 'stage-diagnostics':
            assert args.unit
            stage_diagnostics(args.unit)
        elif args.command == 'uploaded':
            uploaded(args.unit, args.artifact_id, args.artifact_digest)
        else:
            assert args.unit
            {'produce': produce, 'blind-review': blind_review, 'asr': asr, 'compare': compare}[args.command](args.unit)
    except Exception as error:
        failurepath=(folder(args.unit) if args.unit else OUT)/('failure-'+args.command+'.json')
        if not failurepath.exists():write(failurepath,{'atUTC':now(),'operation':args.command,'unitId':args.unit,'errorType':type(error).__name__,'noRetry':True,'secretPayloadLogged':False,'perUnitOperationIsolation':True})
        raise SystemExit('Bounded operation failed; inspect sanitized evidence. No automatic retry.') from None

if __name__ == '__main__':
    main()
