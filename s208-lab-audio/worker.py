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
IDS = ('S2-08-ar-EG-reasoning-evidence-guidance-r1', 'S2-08-ar-EG-reasoning-completion-r1', 'S2-08-ar-EG-record-guidance-r1', 'S2-08-en-reasoning-evidence-guidance-r1', 'S2-08-en-reasoning-completion-r1', 'S2-08-en-record-guidance-r1', 'S2-08-it-reasoning-evidence-guidance-r1', 'S2-08-it-reasoning-completion-r1', 'S2-08-it-record-guidance-r1', 'S2-08-de-reasoning-evidence-guidance-r1', 'S2-08-de-reasoning-completion-r1', 'S2-08-de-record-guidance-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==12
    assert(req['scope'],req['stepId'])==('S208_LAB_12_SOURCEBOUND_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-08')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(12,12,12,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s208-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==12
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(3))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['reasoning-evidence-guidance', 'reasoning-completion', 'record-guidance']
        voice='Charon'if group in['reasoning-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'reasoning-evidence-guidance': ['/amendmentPractice/ui/modelHelp', '/amendmentPractice/ui/soilNotes/0', '/amendmentPractice/ui/soilNotes/1', '/amendmentPractice/ui/directions/0', '/amendmentPractice/ui/directions/1', '/amendmentPractice/ui/directions/2', '/amendmentPractice/ui/directions/3', '/amendmentPractice/ui/inputs/0', '/amendmentPractice/ui/inputs/1', '/amendmentPractice/ui/inputs/2', '/amendmentPractice/ui/inputs/3', '/amendmentPractice/ui/inputs/4', '/amendmentPractice/ui/inputs/5', '/amendmentPractice/ui/inputs/6', '/amendmentPractice/accessibility'], 'reasoning-completion': ['/amendmentPractice/passChecks/0/evidence', '/amendmentPractice/passChecks/0/decision', '/amendmentPractice/passChecks/1/evidence', '/amendmentPractice/passChecks/1/decision', '/amendmentPractice/passChecks/2/evidence', '/amendmentPractice/passChecks/2/decision'], 'record-guidance': ['/amendmentPractice/ui/recordHelp', '/amendmentPractice/ui/fields/0', '/amendmentPractice/ui/fields/1', '/amendmentPractice/ui/fields/2', '/amendmentPractice/ui/fields/3', '/amendmentPractice/ui/fields/4', '/amendmentPractice/ui/fields/5', '/amendmentPractice/ui/fields/6', '/amendmentPractice/ui/fields/7', '/amendmentPractice/ui/saved', '/studentDownloads/0/title']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or '/cases/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('A وB وC', 'إيه وبي وسي'), ('P/Al/Fe', 'الفوسفور والألومنيوم والحديد'), ('أوالفوسفور', 'أو الفوسفور'), ('استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nرمز العينة والحقل\n\nتاريخ الاختبار / الطالب اللي اختبر\n\nالعدة ودليلها والجدول المطابق\n\nالقيمة اللي اتشافت أو المجال اللي الجدول يدعمه\n\nدقة الجدول / عدم التأكد\n\nانتظار اللون الفعلي / الملاحظة\n\nاحتمال متعلق بالعناصر وفحص بديل\n\nفحص تالي حسب المحصول، من غير جرعة متخمنة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nورقة تدريب قرار تعديل pH', 'استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nرمز العينة والحقل\n\nتاريخ الاختبار / الطالب اللي اختبر\n\nالعدة ودليلها والجدول المطابق\n\nالقيمة اللي اتشافت أو المجال اللي الجدول يدعمه\n\nدقة الجدول / عدم التأكد\n\nانتظار اللون الفعلي / الملاحظة\n\nاحتمال متعلق بالعناصر وفحص بديل\n\nفحص تالي حسب المحصول، من غير جرعة متخمنة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nورقة تدريب قرار تعديل بي إتش'), ('الطالب يحدد اتجاه التغير الصحيح، ويفرق بين كربونات الكالسيوم وكربونات الكالسيوم والمغنيسيوم، ويشرح أكسدة الكبريت بواسطة الكائنات الدقيقة والسبب المرتبط بالمحصول أو التربة اللي قد يؤجل التوصية.\n\nالاجتياز بتفسير مشروط، مش ذكر اسم منتج فقط. اقتراح جرعة أو ضمان تغير pH فورًا من الرقم وحده لا يجتاز.\n\nالطالب يقارن الرمل والطين والمادة العضوية والتربة الجيرية من حيث الحموضة المخزونة أو مقاومة تغير pH، ويذكر الاختبار والهدف وفعالية المادة وظروف الأرض المطلوبة لتحديد جرعة للموقع.\n\nالاجتياز لما يفهم كل مدخلات القرار وحدودها. لا تُقيّم جرعة رقمية من غير بيانات حقيقية للمعمل والموقع.\n\nالطالب يخلّي إيه وبي وسي وفول الصويا 5.2 حالات نموذجية لحد ما القياس يثبت القيم الفعلية، ويطلب التشخيص قبل توصية مشروطة، ويشرح إمتى الكمبوست والسماد المتحلل ومحاصيل التغطية مفيدين من غير ادعاء إنهم يصلحوا pH تلقائيًا.\n\nالاجتياز بتمييز مبني على دليل وفحص تالٍ مناسب لكل حالة. الأعراض أو مفتاح الإجابة وحدهم لا يكفوا.', 'الطالب يحدد اتجاه التغير الصحيح، ويفرق بين كربونات الكالسيوم وكربونات الكالسيوم والمغنيسيوم، ويشرح أكسدة الكبريت بواسطة الكائنات الدقيقة والسبب المرتبط بالمحصول أو التربة اللي قد يؤجل التوصية.\n\nالاجتياز بتفسير مشروط، مش ذكر اسم منتج فقط. اقتراح جرعة أو ضمان تغير بي إتش فورًا من الرقم وحده لا يجتاز.\n\nالطالب يقارن الرمل والطين والمادة العضوية والتربة الجيرية من حيث الحموضة المخزونة أو مقاومة تغير بي إتش، ويذكر الاختبار والهدف وفعالية المادة وظروف الأرض المطلوبة لتحديد جرعة للموقع.\n\nالاجتياز لما يفهم كل مدخلات القرار وحدودها. لا تُقيّم جرعة رقمية من غير بيانات حقيقية للمعمل والموقع.\n\nالطالب يخلّي إيه وبي وسي وفول الصويا خمسة فاصلة اتنين حالات نموذجية لحد ما القياس يثبت القيم الفعلية، ويطلب التشخيص قبل توصية مشروطة، ويشرح إمتى الكمبوست والسماد المتحلل ومحاصيل التغطية مفيدين من غير ادعاء إنهم يصلحوا بي إتش تلقائيًا.\n\nالاجتياز بتمييز مبني على دليل وفحص تالٍ مناسب لكل حالة. الأعراض أو مفتاح الإجابة وحدهم لا يكفوا.'), ('تربتين للمثال عند نفس pH 5.2. شكل الحبيبات توضيحي، مش قياس قوام ولا عدد للحموضة. اختار تربة تشوفها؛ مفيش كمية إضافة أو تغير pH متحسب في المحاكاة.\n\nلو باقي الظروف متشابهة، الرملية غالبًا مقاومتها لتغير pH أقل. احتياج الجير لسه محتاج اختبار، مش حساب من شكل الحبيبات.\n\nالطين والمادة العضوية غالبًا يزودوا الحموضة المخزونة ومقاومة تغير pH. لسه محتاج اختبار احتياج جير أو فحص تنظيم مناسب.\n\nنفكر في رفع pH\n\nنفحص إمكان خفض pH\n\nنفكر في تحسين صحة التربة، مش علاج مضمون لبي إتش\n\nالدليل مش كفاية للقرار ده\n\nالمحصول والمدى المناسب له\n\nقياس pH من عينة ممثلة وطريقته\n\nاختبار تنظيم أو احتياج جير مناسب\n\nحالة Mg أوالفوسفور المثبتة حسب الحالة\n\nفعالية المادة وجودتها وأساس حساب الكمية\n\nالكربونات ومياه الري وجدوى الموقع\n\nنضج المادة وأملاحها وعناصرها والتوقيت\n\nمتاح بدايات جمل وتعريفات وصفوف الفوسفور والألومنيوم والحديد مبرزة في الجدول؛ مش مطلوب منك تحكي تجربة شخصية أو تخترع نتيجة معمل.', 'تربتين للمثال عند نفس بي إتش خمسة فاصلة اتنين. شكل الحبيبات توضيحي، مش قياس قوام ولا عدد للحموضة. اختار تربة تشوفها؛ مفيش كمية إضافة أو تغير بي إتش متحسب في المحاكاة.\n\nلو باقي الظروف متشابهة، الرملية غالبًا مقاومتها لتغير بي إتش أقل. احتياج الجير لسه محتاج اختبار، مش حساب من شكل الحبيبات.\n\nالطين والمادة العضوية غالبًا يزودوا الحموضة المخزونة ومقاومة تغير بي إتش. لسه محتاج اختبار احتياج جير أو فحص تنظيم مناسب.\n\nنفكر في رفع بي إتش\n\nنفحص إمكان خفض بي إتش\n\nنفكر في تحسين صحة التربة، مش علاج مضمون لبي إتش\n\nالدليل مش كفاية للقرار ده\n\nالمحصول والمدى المناسب له\n\nقياس بي إتش من عينة ممثلة وطريقته\n\nاختبار تنظيم أو احتياج جير مناسب\n\nحالة المغنيسيوم أوالفوسفور المثبتة حسب الحالة\n\nفعالية المادة وجودتها وأساس حساب الكمية\n\nالكربونات ومياه الري وجدوى الموقع\n\nنضج المادة وأملاحها وعناصرها والتوقيت\n\nمتاح بدايات جمل وتعريفات وصفوف الفوسفور والألومنيوم والحديد مبرزة في الجدول؛ مش مطلوب منك تحكي تجربة شخصية أو تخترع نتيجة معمل.'), ('تربتين للمثال عند نفس pH5.2. شكل الحبيبات توضيحي، مش قياس قوام ولا عدد للحموضة. اختار تربة تشوفها؛ مفيش كمية إضافة أو تغير pH متحسب في المحاكاة.\n\nلو باقي الظروف متشابهة، الرملية غالبًا مقاومتها لتغير pH أقل. احتياج الجير لسه محتاج اختبار، مش حساب من شكل الحبيبات.\n\nالطين والمادة العضوية غالبًا يزودوا الحموضة المخزونة ومقاومة تغير pH. لسه محتاج اختبار احتياج جير أو فحص تنظيم مناسب.\n\nنفكر في رفع pH\n\nنفحص إمكان خفض pH\n\nنفكر في تحسين صحة التربة، مش علاج مضمون لـpH\n\nالدليل مش كفاية للقرار ده\n\nالمحصول والمدى المناسب له\n\nقياس pH من عينة ممثلة وطريقته\n\nاختبار تنظيم أو احتياج جير مناسب\n\nحالة Mg أوP المثبتة حسب الحالة\n\nفعالية المادة وجودتها وأساس حساب الكمية\n\nالكربونات ومياه الري وجدوى الموقع\n\nنضج المادة وأملاحها وعناصرها والتوقيت\n\nمتاح بدايات جمل وتعريفات وصفوف P/Al/Fe مبرزة في الجدول؛ مش مطلوب منك تحكي تجربة شخصية أو تخترع نتيجة معمل.', 'تربتين للمثال عند نفس pH 5.2. شكل الحبيبات توضيحي، مش قياس قوام ولا عدد للحموضة. اختار تربة تشوفها؛ مفيش كمية إضافة أو تغير pH متحسب في المحاكاة.\n\nلو باقي الظروف متشابهة، الرملية غالبًا مقاومتها لتغير pH أقل. احتياج الجير لسه محتاج اختبار، مش حساب من شكل الحبيبات.\n\nالطين والمادة العضوية غالبًا يزودوا الحموضة المخزونة ومقاومة تغير pH. لسه محتاج اختبار احتياج جير أو فحص تنظيم مناسب.\n\nنفكر في رفع pH\n\nنفحص إمكان خفض pH\n\nنفكر في تحسين صحة التربة، مش علاج مضمون لـpH\n\nالدليل مش كفاية للقرار ده\n\nالمحصول والمدى المناسب له\n\nقياس pH من عينة ممثلة وطريقته\n\nاختبار تنظيم أو احتياج جير مناسب\n\nحالة Mg أوP المثبتة حسب الحالة\n\nفعالية المادة وجودتها وأساس حساب الكمية\n\nالكربونات ومياه الري وجدوى الموقع\n\nنضج المادة وأملاحها وعناصرها والتوقيت\n\nمتاح بدايات جمل وتعريفات وصفوف P/Al/Fe مبرزة في الجدول؛ مش مطلوب منك تحكي تجربة شخصية أو تخترع نتيجة معمل.'), ('لـpH', 'لبي إتش'), ('وP', 'والفوسفور')], 'en': [("Learner correctly states the direction of change, identifies calcium carbonate versus calcium-magnesium carbonate, describes sulfur's microbial oxidation and a crop/soil-specific reason to postpone a recommendation.\n\nPass with a qualified explanation, not a one-word product answer. A dose or immediate guaranteed pH change from pH alone does not pass.\n\nLearner compares sand, clay/organic matter and calcareous soil using reserve acidity or buffering, and names the test, target, material effectiveness and field conditions needed for a site rate.\n\nPass when all decision inputs and limits are understood. No numeric application rate is scored without actual lab and site data.\n\nLearner keeps A, B, C and soybean 5.2 as source model cases until verified; proposes measurement and diagnosis before conditional recommendations; explains when compost/manure/cover crops are useful but not automatic pH fixes.\n\nPass with evidence-based distinctions and an appropriate next check for each case. Symptoms or model key alone are insufficient.", "Learner correctly states the direction of change, identifies calcium carbonate versus calcium-magnesium carbonate, describes sulfur's microbial oxidation and a crop/soil-specific reason to postpone a recommendation.\n\nPass with a qualified explanation, not a one-word product answer. A dose or immediate guaranteed P H change from P H alone does not pass.\n\nLearner compares sand, clay/organic matter and calcareous soil using reserve acidity or buffering, and names the test, target, material effectiveness and field conditions needed for a site rate.\n\nPass when all decision inputs and limits are understood. No numeric application rate is scored without actual lab and site data.\n\nLearner keeps A, B, C and soybean five point two as source model cases until verified; proposes measurement and diagnosis before conditional recommendations; explains when compost/manure/cover crops are useful but not automatic P H fixes.\n\nPass with evidence-based distinctions and an appropriate next check for each case. Symptoms or model key alone are insufficient."), ('P/Al/Fe', 'phosphorus, aluminum and iron'), ('Two teaching soils at the same model pH 5.2. Grain shapes are schematic, not measured texture or a count of acidity. Select a soil to inspect; no amount or predicted pH change is simulated.\n\nUnder otherwise comparable conditions, a sandy soil often has less buffering. The lime requirement is still tested, not calculated from particle appearance.\n\nClay and organic matter often increase reserve acidity and resistance to pH change. A suitable buffer/lime-requirement test is still needed.\n\nConsider raising pH\n\nInvestigate possible lowering\n\nConsider a soil-health input, not a pH cure\n\nInsufficient evidence for that decision\n\nCrop and suitable target\n\nRepresentative pH result and named method\n\nAppropriate buffer / lime-requirement test\n\nConfirmed Mg or P status as relevant\n\nMaterial effectiveness, quality and rate basis\n\nCarbonates, irrigation water and site feasibility\n\nMaterial maturity, salt/nutrient load and timing\n\nSentence starters, definitions and highlighted phosphorus, aluminum and iron chart rows are available; no need to disclose a personal experience or invent a laboratory value.', 'Two teaching soils at the same model P H five point two. Grain shapes are schematic, not measured texture or a count of acidity. Select a soil to inspect; no amount or predicted P H change is simulated.\n\nUnder otherwise comparable conditions, a sandy soil often has less buffering. The lime requirement is still tested, not calculated from particle appearance.\n\nClay and organic matter often increase reserve acidity and resistance to P H change. A suitable buffer/lime-requirement test is still needed.\n\nConsider raising P H\n\nInvestigate possible lowering\n\nConsider a soil-health input, not a P H cure\n\nInsufficient evidence for that decision\n\nCrop and suitable target\n\nRepresentative P H result and named method\n\nAppropriate buffer / lime-requirement test\n\nConfirmed magnesium or phosphorus status as relevant\n\nMaterial effectiveness, quality and rate basis\n\nCarbonates, irrigation water and site feasibility\n\nMaterial maturity, salt/nutrient load and timing\n\nSentence starters, definitions and highlighted phosphorus, aluminum and iron chart rows are available; no need to disclose a personal experience or invent a laboratory value.'), ('Two teaching soils at the same model pH5.2. Grain shapes are schematic, not measured texture or a count of acidity. Select a soil to inspect; no amount or predicted pH change is simulated.\n\nUnder otherwise comparable conditions, a sandy soil often has less buffering. The lime requirement is still tested, not calculated from particle appearance.\n\nClay and organic matter often increase reserve acidity and resistance to pH change. A suitable buffer/lime-requirement test is still needed.\n\nConsider raising pH\n\nInvestigate possible lowering\n\nConsider a soil-health input, not a pH cure\n\nInsufficient evidence for that decision\n\nCrop and suitable target\n\nRepresentative pH result and named method\n\nAppropriate buffer / lime-requirement test\n\nConfirmed Mg or P status as relevant\n\nMaterial effectiveness, quality and rate basis\n\nCarbonates, irrigation water and site feasibility\n\nMaterial maturity, salt/nutrient load and timing\n\nSentence starters, definitions and highlighted P/Al/Fe chart rows are available; no need to disclose a personal experience or invent a laboratory value.', 'Two teaching soils at the same model pH 5.2. Grain shapes are schematic, not measured texture or a count of acidity. Select a soil to inspect; no amount or predicted pH change is simulated.\n\nUnder otherwise comparable conditions, a sandy soil often has less buffering. The lime requirement is still tested, not calculated from particle appearance.\n\nClay and organic matter often increase reserve acidity and resistance to pH change. A suitable buffer/lime-requirement test is still needed.\n\nConsider raising pH\n\nInvestigate possible lowering\n\nConsider a soil-health input, not a pH cure\n\nInsufficient evidence for that decision\n\nCrop and suitable target\n\nRepresentative pH result and named method\n\nAppropriate buffer / lime-requirement test\n\nConfirmed Mg or P status as relevant\n\nMaterial effectiveness, quality and rate basis\n\nCarbonates, irrigation water and site feasibility\n\nMaterial maturity, salt/nutrient load and timing\n\nSentence starters, definitions and highlighted P/Al/Fe chart rows are available; no need to disclose a personal experience or invent a laboratory value.'), ('Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field ID\n\nTest date / tester\n\nKit, manual and matching chart\n\nObserved value or supported interval\n\nChart resolution / uncertainty\n\nActual development wait / observation\n\nPossible nutrient issue and alternative check\n\nCrop-specific next investigation, without a guessed dose\n\nRow saved locally. No practical result or trainer signature has been created.\n\npH amendment decision worksheet', 'Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field ID\n\nTest date / tester\n\nKit, manual and matching chart\n\nObserved value or supported interval\n\nChart resolution / uncertainty\n\nActual development wait / observation\n\nPossible nutrient issue and alternative check\n\nCrop-specific next investigation, without a guessed dose\n\nRow saved locally. No practical result or trainer signature has been created.\n\nP H amendment decision worksheet')], 'it': [('Due suoli didattici allo stesso pH 5.2. Forme schematiche, non tessitura misurata o conteggio di acidità. Seleziona un suolo; nessuna dose o variazione di pH è simulata.\n\nA parità di altre condizioni il suolo sabbioso spesso è meno tamponato. Serve comunque un test del fabbisogno, non la forma dei granuli.\n\nArgilla e sostanza organica spesso aumentano acidità di riserva e resistenza al cambiamento. Occorre un test tampone/fabbisogno idoneo.\n\nConsiderare aumento del pH\n\nIndagare una possibile riduzione\n\nConsiderare salute del suolo, non cura del pH\n\nProve insufficienti per questa decisione\n\nColtura e intervallo obiettivo\n\npH rappresentativo e metodo dichiarato\n\nTest tampone / fabbisogno di calce idoneo\n\nStato Mg o fosforo confermato secondo il caso\n\nEfficacia/qualità del materiale e base della dose\n\nCarbonati, acqua irrigua e fattibilità del sito\n\nMaturità, sali/nutrienti del materiale e tempi\n\nOffri inizi di frase, definizioni e righe fosforo, alluminio e ferro evidenziate; nessuno deve raccontare esperienze personali o inventare risultati di laboratorio.', 'Due suoli didattici allo stesso P H cinque virgola due. Forme schematiche, non tessitura misurata o conteggio di acidità. Seleziona un suolo; nessuna dose o variazione di P H è simulata.\n\nA parità di altre condizioni il suolo sabbioso spesso è meno tamponato. Serve comunque un test del fabbisogno, non la forma dei granuli.\n\nArgilla e sostanza organica spesso aumentano acidità di riserva e resistenza al cambiamento. Occorre un test tampone/fabbisogno idoneo.\n\nConsiderare aumento del P H\n\nIndagare una possibile riduzione\n\nConsiderare salute del suolo, non cura del P H\n\nProve insufficienti per questa decisione\n\nColtura e intervallo obiettivo\n\nP H rappresentativo e metodo dichiarato\n\nTest tampone / fabbisogno di calce idoneo\n\nStato magnesio o fosforo confermato secondo il caso\n\nEfficacia/qualità del materiale e base della dose\n\nCarbonati, acqua irrigua e fattibilità del sito\n\nMaturità, sali/nutrienti del materiale e tempi\n\nOffri inizi di frase, definizioni e righe fosforo, alluminio e ferro evidenziate; nessuno deve raccontare esperienze personali o inventare risultati di laboratorio.'), ('Due suoli didattici allo stesso pH5.2. Forme schematiche, non tessitura misurata o conteggio di acidità. Seleziona un suolo; nessuna dose o variazione di pH è simulata.\n\nA parità di altre condizioni il suolo sabbioso spesso è meno tamponato. Serve comunque un test del fabbisogno, non la forma dei granuli.\n\nArgilla e sostanza organica spesso aumentano acidità di riserva e resistenza al cambiamento. Occorre un test tampone/fabbisogno idoneo.\n\nConsiderare aumento del pH\n\nIndagare una possibile riduzione\n\nConsiderare salute del suolo, non cura del pH\n\nProve insufficienti per questa decisione\n\nColtura e intervallo obiettivo\n\npH rappresentativo e metodo dichiarato\n\nTest tampone / fabbisogno di calce idoneo\n\nStato Mg oP confermato secondo il caso\n\nEfficacia/qualità del materiale e base della dose\n\nCarbonati, acqua irrigua e fattibilità del sito\n\nMaturità, sali/nutrienti del materiale e tempi\n\nOffri inizi di frase, definizioni e righe P/Al/Fe evidenziate; nessuno deve raccontare esperienze personali o inventare risultati di laboratorio.', 'Due suoli didattici allo stesso pH 5.2. Forme schematiche, non tessitura misurata o conteggio di acidità. Seleziona un suolo; nessuna dose o variazione di pH è simulata.\n\nA parità di altre condizioni il suolo sabbioso spesso è meno tamponato. Serve comunque un test del fabbisogno, non la forma dei granuli.\n\nArgilla e sostanza organica spesso aumentano acidità di riserva e resistenza al cambiamento. Occorre un test tampone/fabbisogno idoneo.\n\nConsiderare aumento del pH\n\nIndagare una possibile riduzione\n\nConsiderare salute del suolo, non cura del pH\n\nProve insufficienti per questa decisione\n\nColtura e intervallo obiettivo\n\npH rappresentativo e metodo dichiarato\n\nTest tampone / fabbisogno di calce idoneo\n\nStato Mg oP confermato secondo il caso\n\nEfficacia/qualità del materiale e base della dose\n\nCarbonati, acqua irrigua e fattibilità del sito\n\nMaturità, sali/nutrienti del materiale e tempi\n\nOffri inizi di frase, definizioni e righe P/Al/Fe evidenziate; nessuno deve raccontare esperienze personali o inventare risultati di laboratorio.'), ("L'allievo indica la direzione corretta del cambiamento, distingue carbonato di calcio da carbonato di calcio e magnesio, descrive l'ossidazione microbica dello zolfo e un motivo specifico di coltura o suolo per rinviare la raccomandazione.\n\nSuperato con spiegazione qualificata, non con il solo nome di un prodotto. Una dose o un cambiamento di pH immediato garantito dal solo valore non supera la prova.\n\nL'allievo confronta sabbia, argilla, sostanza organica e suolo calcareo in termini di acidità di riserva o potere tampone, e nomina test, obiettivo, efficacia del materiale e condizioni di campo necessari per una dose locale.\n\nSuperato quando comprende tutti i dati decisionali e i loro limiti. Non si valuta una dose numerica senza dati reali di laboratorio e sito.\n\nL’allievo mantiene A, B, C e soia 5.2 come casi modello finché non siano verificati, propone misure e diagnosi prima di raccomandazioni condizionate, e distingue i benefici di compost, letame maturo e colture di copertura dalle correzioni automatiche del pH.\n\nSuperato con distinzioni sostenute da prove e una verifica successiva appropriata per ogni caso. Sintomi e soluzione modello da soli non bastano.", "L'allievo indica la direzione corretta del cambiamento, distingue carbonato di calcio da carbonato di calcio e magnesio, descrive l'ossidazione microbica dello zolfo e un motivo specifico di coltura o suolo per rinviare la raccomandazione.\n\nSuperato con spiegazione qualificata, non con il solo nome di un prodotto. Una dose o un cambiamento di P H immediato garantito dal solo valore non supera la prova.\n\nL'allievo confronta sabbia, argilla, sostanza organica e suolo calcareo in termini di acidità di riserva o potere tampone, e nomina test, obiettivo, efficacia del materiale e condizioni di campo necessari per una dose locale.\n\nSuperato quando comprende tutti i dati decisionali e i loro limiti. Non si valuta una dose numerica senza dati reali di laboratorio e sito.\n\nL’allievo mantiene A, B, C e soia cinque virgola due come casi modello finché non siano verificati, propone misure e diagnosi prima di raccomandazioni condizionate, e distingue i benefici di compost, letame maturo e colture di copertura dalle correzioni automatiche del P H.\n\nSuperato con distinzioni sostenute da prove e una verifica successiva appropriata per ogni caso. Sintomi e soluzione modello da soli non bastano."), ('P/Al/Fe', 'fosforo, alluminio e ferro'), ('Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nID campione e campo\n\nData / esecutore\n\nKit, manuale e scala abbinata\n\nValore osservato o intervallo supportato\n\nRisoluzione / incertezza\n\nAttesa reale / osservazione\n\nPossibile problema nutritivo e verifica alternativa\n\nIndagine successiva per la coltura, senza dosi inventate\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nScheda decisionale ammendanti pH', 'Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nID campione e campo\n\nData / esecutore\n\nKit, manuale e scala abbinata\n\nValore osservato o intervallo supportato\n\nRisoluzione / incertezza\n\nAttesa reale / osservazione\n\nPossibile problema nutritivo e verifica alternativa\n\nIndagine successiva per la coltura, senza dosi inventate\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nScheda decisionale ammendanti P H'), ('oP', 'o fosforo')], 'de': [('Die lernende Person nennt die richtige Änderungsrichtung, trennt Calciumcarbonat von Calcium-Magnesium-Carbonat, erklärt die mikrobielle Schwefeloxidation und einen kultur- oder bodenbezogenen Grund, eine Empfehlung aufzuschieben.\n\nBestanden mit begründeter, bedingter Erklärung, nicht nur einem Produktnamen. Eine Dosis oder sofort garantierte pH-Änderung aus einem pH-Wert genügt nicht.\n\nSand, Ton, organische Substanz und kalkhaltiger Boden werden nach Reserveazidität und Pufferung verglichen; die Person benennt Untersuchung, Ziel, Materialwirksamkeit und Feldbedingungen für eine standortbezogene Dosis.\n\nBestanden, wenn alle entscheidenden Daten und Grenzen verstanden sind. Ohne echte Labor- und Standortdaten wird keine Zahlenmenge bewertet.\n\nA, B, C und Soja 5.2 bleiben Modellfälle bis zur Prüfung; vor bedingten Empfehlungen werden Messung und Diagnose vorgeschlagen; Nutzen und Grenzen von Kompost, gereiftem Mist und Zwischenfrüchten werden erläutert.\n\nBestanden mit belegten Unterscheidungen und passender nächster Prüfung für jeden Fall. Symptome oder Modelllösung allein reichen nicht.', 'Die lernende Person nennt die richtige Änderungsrichtung, trennt Calciumcarbonat von Calcium-Magnesium-Carbonat, erklärt die mikrobielle Schwefeloxidation und einen kultur- oder bodenbezogenen Grund, eine Empfehlung aufzuschieben.\n\nBestanden mit begründeter, bedingter Erklärung, nicht nur einem Produktnamen. Eine Dosis oder sofort garantierte P H-Änderung aus einem P H-Wert genügt nicht.\n\nSand, Ton, organische Substanz und kalkhaltiger Boden werden nach Reserveazidität und Pufferung verglichen; die Person benennt Untersuchung, Ziel, Materialwirksamkeit und Feldbedingungen für eine standortbezogene Dosis.\n\nBestanden, wenn alle entscheidenden Daten und Grenzen verstanden sind. Ohne echte Labor- und Standortdaten wird keine Zahlenmenge bewertet.\n\nA, B, C und Soja fünf Komma zwei bleiben Modellfälle bis zur Prüfung; vor bedingten Empfehlungen werden Messung und Diagnose vorgeschlagen; Nutzen und Grenzen von Kompost, gereiftem Mist und Zwischenfrüchten werden erläutert.\n\nBestanden mit belegten Unterscheidungen und passender nächster Prüfung für jeden Fall. Symptome oder Modelllösung allein reichen nicht.'), ('Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nTestdatum / prüfende Person\n\nSet, Anleitung und passende Skala\n\nBeobachteter Wert oder unterstütztes Intervall\n\nAuflösung / Unsicherheit\n\nEchte Entwicklungszeit / Beobachtung\n\nMögliche Nährstofffrage und alternative Prüfung\n\nNächste kulturspezifische Untersuchung, keine erfundene Menge\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nArbeitsblatt pH-Änderungsentscheidung', 'Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nTestdatum / prüfende Person\n\nSet, Anleitung und passende Skala\n\nBeobachteter Wert oder unterstütztes Intervall\n\nAuflösung / Unsicherheit\n\nEchte Entwicklungszeit / Beobachtung\n\nMögliche Nährstofffrage und alternative Prüfung\n\nNächste kulturspezifische Untersuchung, keine erfundene Menge\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nArbeitsblatt P H-Änderungsentscheidung'), ('P/Al/Fe', 'Phosphor, Aluminium und Eisen'), ('Zwei Lehrböden mit gleichem Modell-pH 5.2. Schematische Formen, keine gemessene Textur oder Säureanzahl. Boden wählen; keine Menge oder pH-Änderung simuliert.\n\nBei sonst vergleichbaren Bedingungen ist Sandboden oft weniger gepuffert. Kalkbedarf muss trotzdem getestet werden, nicht aus Körnerform berechnet.\n\nTon und organische Substanz erhöhen oft Reservesäure und Widerstand gegen pH-Änderung. Geeigneter Puffer-/Kalkbedarfstest bleibt nötig.\n\npH-Anhebung erwägen\n\nMögliche Absenkung untersuchen\n\nBodengesundheit erwägen, keine pH-Heilung\n\nUnzureichende Belege für diese Entscheidung\n\nKultur und geeigneter Zielbereich\n\nRepräsentativer pH und benannte Methode\n\nGeeigneter Puffer-/Kalkbedarfstest\n\nJe nach Fall bestätigter Mg- oder Phosphor-Status\n\nMaterialwirkung/-qualität und Mengenbasis\n\nCarbonate, Bewässerungswasser und Standorteignung\n\nReife, Salz-/Nährstofflast und Zeitpunkt\n\nBiete Satzanfänge, Begriffe und hervorgehobene Phosphor, Aluminium und Eisen-Zeilen; persönliche Erfahrungen und erfundene Laborwerte sind nicht nötig.', 'Zwei Lehrböden mit gleichem Modell-P H fünf Komma zwei. Schematische Formen, keine gemessene Textur oder Säureanzahl. Boden wählen; keine Menge oder P H-Änderung simuliert.\n\nBei sonst vergleichbaren Bedingungen ist Sandboden oft weniger gepuffert. Kalkbedarf muss trotzdem getestet werden, nicht aus Körnerform berechnet.\n\nTon und organische Substanz erhöhen oft Reservesäure und Widerstand gegen P H-Änderung. Geeigneter Puffer-/Kalkbedarfstest bleibt nötig.\n\nP H-Anhebung erwägen\n\nMögliche Absenkung untersuchen\n\nBodengesundheit erwägen, keine P H-Heilung\n\nUnzureichende Belege für diese Entscheidung\n\nKultur und geeigneter Zielbereich\n\nRepräsentativer P H und benannte Methode\n\nGeeigneter Puffer-/Kalkbedarfstest\n\nJe nach Fall bestätigter Magnesium- oder Phosphor-Status\n\nMaterialwirkung/-qualität und Mengenbasis\n\nCarbonate, Bewässerungswasser und Standorteignung\n\nReife, Salz-/Nährstofflast und Zeitpunkt\n\nBiete Satzanfänge, Begriffe und hervorgehobene Phosphor, Aluminium und Eisen-Zeilen; persönliche Erfahrungen und erfundene Laborwerte sind nicht nötig.'), ('Zwei Lehrböden mit gleichem Modell-pH5.2. Schematische Formen, keine gemessene Textur oder Säureanzahl. Boden wählen; keine Menge oder pH-Änderung simuliert.\n\nBei sonst vergleichbaren Bedingungen ist Sandboden oft weniger gepuffert. Kalkbedarf muss trotzdem getestet werden, nicht aus Körnerform berechnet.\n\nTon und organische Substanz erhöhen oft Reservesäure und Widerstand gegen pH-Änderung. Geeigneter Puffer-/Kalkbedarfstest bleibt nötig.\n\npH-Anhebung erwägen\n\nMögliche Absenkung untersuchen\n\nBodengesundheit erwägen, keine pH-Heilung\n\nUnzureichende Belege für diese Entscheidung\n\nKultur und geeigneter Zielbereich\n\nRepräsentativer pH und benannte Methode\n\nGeeigneter Puffer-/Kalkbedarfstest\n\nJe nach Fall bestätigter Mg- oderP-Status\n\nMaterialwirkung/-qualität und Mengenbasis\n\nCarbonate, Bewässerungswasser und Standorteignung\n\nReife, Salz-/Nährstofflast und Zeitpunkt\n\nBiete Satzanfänge, Begriffe und hervorgehobene P/Al/Fe-Zeilen; persönliche Erfahrungen und erfundene Laborwerte sind nicht nötig.', 'Zwei Lehrböden mit gleichem Modell-pH 5.2. Schematische Formen, keine gemessene Textur oder Säureanzahl. Boden wählen; keine Menge oder pH-Änderung simuliert.\n\nBei sonst vergleichbaren Bedingungen ist Sandboden oft weniger gepuffert. Kalkbedarf muss trotzdem getestet werden, nicht aus Körnerform berechnet.\n\nTon und organische Substanz erhöhen oft Reservesäure und Widerstand gegen pH-Änderung. Geeigneter Puffer-/Kalkbedarfstest bleibt nötig.\n\npH-Anhebung erwägen\n\nMögliche Absenkung untersuchen\n\nBodengesundheit erwägen, keine pH-Heilung\n\nUnzureichende Belege für diese Entscheidung\n\nKultur und geeigneter Zielbereich\n\nRepräsentativer pH und benannte Methode\n\nGeeigneter Puffer-/Kalkbedarfstest\n\nJe nach Fall bestätigter Mg- oderP-Status\n\nMaterialwirkung/-qualität und Mengenbasis\n\nCarbonate, Bewässerungswasser und Standorteignung\n\nReife, Salz-/Nährstofflast und Zeitpunkt\n\nBiete Satzanfänge, Begriffe und hervorgehobene P/Al/Fe-Zeilen; persönliche Erfahrungen und erfundene Laborwerte sind nicht nötig.'), ('oderP', 'oder Phosphor')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s208-lab-audio-20261023-r1'
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
    assert count < 3, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 12,'maximumCallsForLane':3,
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
    assert all(v<=3 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':3,'maximumBlindReviewPerLane':3,'maximumASRPerLane':3,'maximumTTSAggregate':12,'maximumBlindAggregate':12,'maximumASRAggregate':12,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
