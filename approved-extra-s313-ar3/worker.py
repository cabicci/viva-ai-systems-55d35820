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
IDS = ('S3-13-ar-EG-opening-r1', 'S3-13-ar-EG-guided-practice-r1', 'S3-13-ar-EG-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==3
    assert type(req['fixedLocaleLanes']) is dict and req['fixedLocaleLanes']=={'ar-EG': ['S3-13-ar-EG-opening-r1', 'S3-13-ar-EG-guided-practice-r1', 'S3-13-ar-EG-glossary-r1']},'Exact locale-to-ordered-UID lane map required before any provider operation'
    assert(req['scope'],req['stepId'])==('OWNER_APPROVED_EXACT_EXTRA_S313_AR3', 'S3-13')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(3,3,3,2,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-approved-extra-s313-ar3-20261024-r2')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==3
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allThreeCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG']for _ in range(3))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening','guided-practice','reflection','glossary']
        voice='Charon'if group in ['opening','reflection']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('العزّاقة اللي بتمشي وراها ممكن تشيل الحشائش بين صفوف مناسبة، لكن الموديل وعرض العمل والجزء الدوّار وحالة الأرض والحواجز وتدريب المشغّل هي اللي تحدد الأمان. هنا بنستخدم Honda FJ500-SER كمثال ليه دليل موثّق؛ والمدرّب لازم يطابق جهاز التدريب الفعلي مع دليله الخاص.\n\nسمِّ محرك FJ500-SER والقابض اللي بيشد السير ومسار نقل القدرة وناقل الحركة وذراع النقل والجزء الدوّار ومفاتيح المقبض والأجزاء الظاهرة المرتبطة بالسلامة من رسم المصنع الصحيح، من غير أجزاء DE/DER أو الرسم العام في الأصل.\n\nاشرح الفوائد المحتملة لمكافحة الحشائش والجهد وتهوية السطح والعزيق الخفيف، واختار آلة أو عملًا يدويًا أو بديلًا حسب عرض الصف والجذور والأرض والحجارة والحواجز ومكان تشغيل مفتوح مناسب ومخاطر العادم وتدريب المشغّل.\n\nحوّل الفدان المصري والمتر المربع والهكتار والأكر صح، وافصل سعة خزان الوقود عن الاستهلاك في الساعة وزمن إنجاز المساحة، وما تحسبش تكلفة خدمة أو كفاءة بأرقام غير موثقة للجهاز.', 'العزّاقة اللي بتمشي وراها ممكن تشيل الحشائش بين صفوف مناسبة، لكن الموديل وعرض العمل والجزء الدوّار وحالة الأرض والحواجز وتدريب المشغّل هي اللي تحدد الأمان. هنا بنستخدم هُوندا إف جي خمسمية-اس إي آر كمثال ليه دليل موثّق؛ والمدرّب لازم يطابق جهاز التدريب الفعلي مع دليله الخاص.\n\nسمِّ محرك إف جي خمسمية-اس إي آر والقابض اللي بيشد السير ومسار نقل القدرة وناقل الحركة وذراع النقل والجزء الدوّار ومفاتيح المقبض والأجزاء الظاهرة المرتبطة بالسلامة من رسم المصنع الصحيح، من غير أجزاء دي إي، دي إي آر أو الرسم العام في الأصل.\n\nاشرح الفوائد المحتملة لمكافحة الحشائش والجهد وتهوية السطح والعزيق الخفيف، واختار آلة أو عملًا يدويًا أو بديلًا حسب عرض الصف والجذور والأرض والحجارة والحواجز ومكان تشغيل مفتوح مناسب ومخاطر العادم وتدريب المشغّل.\n\nحوّل الفدان المصري والمتر المربع والهكتار والأكر صح، وافصل سعة خزان الوقود عن الاستهلاك في الساعة وزمن إنجاز المساحة، وما تحسبش تكلفة خدمة أو كفاءة بأرقام غير موثقة للجهاز.'), ('حرث\n\nتحريك ميكانيكي للتربة؛ فائدته وضرره حسب العمق والرطوبة والغرض.\n\nتهوية\n\nحركة وتبادل الهوا حوالين الجذور، مش نتيجة مضمونة لكل حرث.\n\nفدان\n\nوحدة مساحة مصرية تساوي ٤٢٠٠ م² = ٠٫٤٢ هكتار، أو حوالي ١٫٠٣٨ أكر.\n\nقابض\n\nيوصل أو يفصل نقل القدرة؛ قابض FJ500-SER من نوع شدّ السير حسب دليلها.\n\nسن دوّار\n\nجزء عامل في التربة يدور وقد يبلى ويشكل خطرًا لو بيتحرك.\n\nمنقّي هوا\n\nفلتر مدخل هوا المحرك، مش جزءًا بيشتغل في التربة.\n\nسعة الخزان\n\nحجم الوقود اللي يسعه، مش استهلاكًا في الساعة ولا مدة تشغيل.\n\nمعدل إنجاز\n\nزمن عمل مقاس لمساحة فعلية بشروط الحقل والمشغّل المذكورة.\n\nPPE\n\nوسائل الوقاية الشخصية المناسبة للعمل وتعليمات المصنع.', 'حرث\n\nتحريك ميكانيكي للتربة؛ فائدته وضرره حسب العمق والرطوبة والغرض.\n\nتهوية\n\nحركة وتبادل الهوا حوالين الجذور، مش نتيجة مضمونة لكل حرث.\n\nفدان\n\nوحدة مساحة مصرية تساوي أربعة آلاف ومتين متر مربع بتساوي صفر فاصلة أربعة اتنين هكتار، أو حوالي واحد فاصلة صفر تلاتة تمانية أكر.\n\nقابض\n\nيوصل أو يفصل نقل القدرة؛ قابض إف جي خمسمية-اس إي آر من نوع شدّ السير حسب دليلها.\n\nسن دوّار\n\nجزء عامل في التربة يدور وقد يبلى ويشكل خطرًا لو بيتحرك.\n\nمنقّي هوا\n\nفلتر مدخل هوا المحرك، مش جزءًا بيشتغل في التربة.\n\nسعة الخزان\n\nحجم الوقود اللي يسعه، مش استهلاكًا في الساعة ولا مدة تشغيل.\n\nمعدل إنجاز\n\nزمن عمل مقاس لمساحة فعلية بشروط الحقل والمشغّل المذكورة.\n\nمعدات الوقاية الشخصية\n\nوسائل الوقاية الشخصية المناسبة للعمل وتعليمات المصنع.'), ('على رسم SER أصلي ثلاثي الأبعاد، سمّي المجموعات الوظيفية الستة. ارجع لمسميات النسخ في دليل المصنع عشان تحدد هل العجلة الأمامية أو ضابط المقبض اللي في الرسم ينطبق على SER؛ ما تضيفش العجلة الخاصة بـDE/DER، وما تستبدلش ضابط الارتفاع الخاص بـSE/SER بتحكم نسخة تانية. اشرح وظيفة القابض من غير ما تخلطه بصندوق التروس.\n\nلحقل الأصل ذي الأكر الواحد، اختار يدوي أو SER أو طريقة أخرى من بيانات عرض الصف وجذور المحصول والحجارة وبلل الأرض ومكان التشغيل المفتوح ومخاطر العادم والتكلفة. قل إيه المعلومات الناقصة وإيه يغير قرارك.\n\nحوّل ٢ فدان إلى ٨٤٠٠ م² و٠٫٨٤ هكتار وحوالي ٢٫٠٧٦ أكر؛ صنّف ٤–٦ ساعات/فدان و٢٫٣ لتر/ساعة في الأصل كمعدلين غير مثبتين لـSER، و٢٫٤ لتر المصنع كسعة خزان. اعمل قائمة بيانات تكلفة بلا أسعار.\n\nقيّم الوظيفة والمصدر لكل جزء؛ ممنوع عجلة محركة أمامية أو قابض طردي أو قدرة ٥ حصان غير مثبتة.\n\nده تدريب معرفة وفهم. مفيش آلة فعلية اتطابقت أو اتفحصت أو اتشغّلت أو اتوافق عليها هنا. التشغيل والصيانة الحقيقيين ليهم مهام تحت الإشراف بالجهاز الفعلي ودليله.', 'على رسم اس إي آر أصلي ثلاثي الأبعاد، سمّي المجموعات الوظيفية الستة. ارجع لمسميات النسخ في دليل المصنع عشان تحدد هل العجلة الأمامية أو ضابط المقبض اللي في الرسم ينطبق على اس إي آر؛ ما تضيفش العجلة الخاصة بـدي إي، دي إي آر، وما تستبدلش ضابط الارتفاع الخاص بـإس إي، اس إي آر بتحكم نسخة تانية. اشرح وظيفة القابض من غير ما تخلطه بصندوق التروس.\n\nلحقل الأصل ذي الأكر الواحد، اختار يدوي أو اس إي آر أو طريقة أخرى من بيانات عرض الصف وجذور المحصول والحجارة وبلل الأرض ومكان التشغيل المفتوح ومخاطر العادم والتكلفة. قل إيه المعلومات الناقصة وإيه يغير قرارك.\n\nحوّل اتنين فدان إلى تمانية آلاف وأربعمية متر مربع وصفر فاصلة تمانية أربعة هكتار وحوالي اتنين فاصلة صفر سبعة ستة أكر؛ صنّف من أربعة لست ساعات لكل فدان، واتنين فاصلة تلاتة لتر في الساعة في الأصل كمعدلين غير مثبتين لـاس إي آر، واتنين فاصلة أربعة لتر المصنع كسعة خزان. اعمل قائمة بيانات تكلفة بلا أسعار.\n\nقيّم الوظيفة والمصدر لكل جزء؛ ممنوع عجلة محركة أمامية أو قابض طردي أو قدرة خمسة حصان غير مثبتة.\n\nده تدريب معرفة وفهم. مفيش آلة فعلية اتطابقت أو اتفحصت أو اتشغّلت أو اتوافق عليها هنا. التشغيل والصيانة الحقيقيين ليهم مهام تحت الإشراف بالجهاز الفعلي ودليله.')], 'en': [('A walk-behind cultivator may remove weeds between suitable rows, but its model, working parts, width, ground, guards and operator training determine whether that use is safe. This step uses Honda FJ500-SER as a documented teaching example; the trainer must match the actual training machine to its own manual.\n\nIdentify the FJ500-SER engine, belt-tension clutch/power path, transmission/shift, rotary tines, handle controls and safety-related visible parts using the applicable manufacturer illustration, without importing features from DE/DER or the generic teacher diagram.\n\nExplain conditional weed-control, labour, aeration and light-cultivation benefits, and decide whether machine, hand work or another method fits actual row spacing, roots, soil, stones, guards, an appropriate outdoor site, exhaust hazards and operator/trainer conditions.\n\nConvert Egyptian feddan, square metres, hectares and acres correctly; separate fuel-tank capacity, fuel-use rate and work-time rate and refuse unsupported service-cost or machine-efficiency calculations.', 'A walk-behind cultivator may remove weeds between suitable rows, but its model, working parts, width, ground, guards and operator training determine whether that use is safe. This step uses Honda F J five hundred-S E R as a documented teaching example; the trainer must match the actual training machine to its own manual.\n\nIdentify the F J five hundred-S E R engine, belt-tension clutch, power path, transmission, shift, rotary tines, handle controls and safety-related visible parts using the applicable manufacturer illustration, without importing features from D E, D E R or the generic teacher diagram.\n\nExplain conditional weed-control, labour, aeration and light-cultivation benefits, and decide whether machine, hand work or another method fits actual row spacing, roots, soil, stones, guards, an appropriate outdoor site, exhaust hazards and operator, trainer conditions.\n\nConvert Egyptian feddan, square metres, hectares and acres correctly; separate fuel-tank capacity, fuel-use rate and work-time rate and refuse unsupported service-cost or machine-efficiency calculations.'), ("On an original 3D SER schematic, identify six required functional groups. Use the manufacturer’s variant labels to check whether a pictured front wheel or handlebar adjuster applies to SER; do not import the DE/DER-only front wheel or replace the SE/SER height adjuster with another variant’s control. Explain what the clutch does without equating it to the gearbox.\n\nFor the original one-acre field, choose hand, SER or another method using provided row-clearance, crop-root, stone, soil-moisture, outdoor-site, exhaust-risk and cost facts. State which facts are missing and what would reverse the choice.\n\nConvert 2 feddans to 8,400 m², 0.84 ha and about 2.076 acres; categorize the source's 4–6 h/feddan and 2.3 L/h as unverified rates, and the manufacturer's 2.4 L as tank capacity. Draft a service-cost input checklist without prices.\n\nScore model-specific function and provenance; no powered-wheel, centrifugal-clutch or 5 HP claim.\n\nThis is a knowledge exercise. No actual machine has been matched, inspected, started or approved here. Real operation and maintenance belong to supervised tasks with the actual model and manual.", "On an original three dimensional S E R schematic, identify six required functional groups. Use the manufacturer’s variant labels to check whether a pictured front wheel or handlebar adjuster applies to S E R; do not import the D E, D E R-only front wheel or replace the S E, S E R height adjuster with another variant’s control. Explain what the clutch does without equating it to the gearbox.\n\nFor the original one-acre field, choose hand, S E R or another method using provided row-clearance, crop-root, stone, soil-moisture, outdoor-site, exhaust-risk and cost facts. State which facts are missing and what would reverse the choice.\n\nConvert two feddans to eight thousand four hundred square metres, zero point eight four hectares and about two point zero seven six acres; categorize the source's four to six hours per feddan and two point three litres per hour as unverified rates, and the manufacturer's two point four litres as tank capacity. Draft a service-cost input checklist without prices.\n\nScore model-specific function and provenance; no powered-wheel, centrifugal-clutch or five H P claim.\n\nThis is a knowledge exercise. No actual machine has been matched, inspected, started or approved here. Real operation and maintenance belong to supervised tasks with the actual model and manual."), ('tillage\n\nMechanical disturbance of soil; benefit and harm depend on depth, moisture and purpose.\n\naeration\n\nExchange and movement of air around roots, not a guaranteed result of repeated cultivation.\n\nfeddan\n\nEgyptian land-area unit of 4,200 m² = 0.42 ha, approximately 1.038 acres.\n\nclutch\n\nControl that connects/disconnects drive; the FJ500-SER manual calls its clutch belt-tension type.\n\nrotary tine\n\nSoil-working rotating element that can wear and is hazardous when moving.\n\nair cleaner\n\nEngine intake filter, not a soil-working part.\n\ntank capacity\n\nFuel volume a tank can contain, not a fuel-use rate or running duration.\n\nwork rate\n\nMeasured job time per actual area under stated field and operator conditions.\n\nPPE\n\nPersonal protective equipment selected for the actual task and manufacturer guidance.', 'tillage\n\nMechanical disturbance of soil; benefit and harm depend on depth, moisture and purpose.\n\naeration\n\nExchange and movement of air around roots, not a guaranteed result of repeated cultivation.\n\nfeddan\n\nEgyptian land-area unit of four thousand two hundred square metres equals zero point four two hectares, approximately one point zero three eight acres.\n\nclutch\n\nControl that connects, disconnects drive; the F J five hundred-S E R manual calls its clutch belt-tension type.\n\nrotary tine\n\nSoil-working rotating element that can wear and is hazardous when moving.\n\nair cleaner\n\nEngine intake filter, not a soil-working part.\n\ntank capacity\n\nFuel volume a tank can contain, not a fuel-use rate or running duration.\n\nwork rate\n\nMeasured job time per actual area under stated field and operator conditions.\n\nP P E\n\nPersonal protective equipment selected for the actual task and manufacturer guidance.')], 'it': [('Su uno schema 3D SER originale, identifica i sei gruppi funzionali richiesti. Usa le etichette delle varianti del costruttore per verificare se la ruota anteriore o il regolatore del manubrio raffigurati sono applicabili a SER: non importare la ruota riservata a DE/DER né sostituire il regolatore di altezza SE/SER con un comando di un’altra variante. Spiega la frizione senza confonderla con il cambio.\n\nNel caso di 1 acre scegli mano, SER o altro dalle informazioni su spazio file, radici, pietre, umidità, sito all’aperto, rischi dei gas di scarico e costo. Dichiara dati mancanti e cosa cambierebbe la scelta.\n\nConverti 2 feddan in 8.400 m², 0,84 ha e circa 2,076 acre; classifica 4–6 h/feddan e 2,3 L/h della fonte come tassi non verificati, e 2,4 L Honda come capacità. Prepara lista costi senza prezzi.\n\nValuta modello, funzione e fonte; nessuna ruota motrice, frizione centrifuga o 5 HP non verificati.\n\nQuesto è un esercizio di conoscenza. Qui nessuna macchina reale è stata identificata come corrispondente, ispezionata, avviata o approvata. Uso e manutenzione reali appartengono ad attività supervisionate con il modello e il manuale effettivi.', 'Su uno schema tridimensionale esse e erre originale, identifica i sei gruppi funzionali richiesti. Usa le etichette delle varianti del costruttore per verificare se la ruota anteriore o il regolatore del manubrio raffigurati sono applicabili a esse e erre: non importare la ruota riservata a di e, di e erre né sostituire il regolatore di altezza esse e, esse e erre con un comando di un’altra variante. Spiega la frizione senza confonderla con il cambio.\n\nNel caso di uno acre scegli mano, esse e erre o altro dalle informazioni su spazio file, radici, pietre, umidità, sito all’aperto, rischi dei gas di scarico e costo. Dichiara dati mancanti e cosa cambierebbe la scelta.\n\nConverti due feddan in ottomila quattrocento metri quadrati, zero virgola otto quattro ettari e circa due virgola zero sette sei acre; classifica quattro a sei ore per feddan e due virgola tre litri per ora della fonte come tassi non verificati, e due virgola quattro litri Honda come capacità. Prepara lista costi senza prezzi.\n\nValuta modello, funzione e fonte; nessuna ruota motrice, frizione centrifuga o cinque acca pi non verificati.\n\nQuesto è un esercizio di conoscenza. Qui nessuna macchina reale è stata identificata come corrispondente, ispezionata, avviata o approvata. Uso e manutenzione reali appartengono ad attività supervisionate con il modello e il manuale effettivi.'), ('Una motozappa condotta a piedi può eliminare infestanti fra file idonee, ma modello, larghezza, organi rotanti, suolo, protezioni e formazione stabiliscono la sicurezza. Honda FJ500-SER è un esempio documentato; il formatore dovrà confrontare la macchina reale col relativo manuale.\n\nDalla figura del costruttore applicabile identifica motore, frizione a tensione di cinghia, cambio, organo rotativo, comandi sul manubrio e parti di sicurezza FJ500-SER, senza importare DE/DER o il diagramma generico.\n\nSpiega benefici condizionati per infestanti, lavoro, aerazione e coltivazione leggera; scegli macchina, lavoro manuale o altro metodo in base a file, radici, suolo, pietre, protezioni, sito adatto all’aperto, rischi dei gas di scarico e preparazione dell’operatore.\n\nConverti feddan egiziano, m², ettari e acre; distingui capacità serbatoio, consumo orario e tempo di lavoro ed evita costi o efficienze non documentati.', 'Una motozappa condotta a piedi può eliminare infestanti fra file idonee, ma modello, larghezza, organi rotanti, suolo, protezioni e formazione stabiliscono la sicurezza. Honda effe i lunga cinquecento-esse e erre è un esempio documentato; il formatore dovrà confrontare la macchina reale col relativo manuale.\n\nDalla figura del costruttore applicabile identifica motore, frizione a tensione di cinghia, cambio, organo rotativo, comandi sul manubrio e parti di sicurezza effe i lunga cinquecento-esse e erre, senza importare di e, di e erre o il diagramma generico.\n\nSpiega benefici condizionati per infestanti, lavoro, aerazione e coltivazione leggera; scegli macchina, lavoro manuale o altro metodo in base a file, radici, suolo, pietre, protezioni, sito adatto all’aperto, rischi dei gas di scarico e preparazione dell’operatore.\n\nConverti feddan egiziano, metri quadrati, ettari e acre; distingui capacità serbatoio, consumo orario e tempo di lavoro ed evita costi o efficienze non documentati.'), ('lavorazione\n\nDisturbo meccanico del suolo; effetti secondo profondità, umidità e scopo.\n\naerazione\n\nMovimento/scambio d’aria presso le radici, non risultato garantito di lavorazioni ripetute.\n\nfeddan\n\nUnità di superficie egiziana di 4.200 m² = 0,42 ha, circa 1,038 acre.\n\nfrizione\n\nInnesta o disinnesta potenza; la SER usa tensione della cinghia secondo Honda.\n\ndente rotante\n\nParte che lavora il suolo, si usura ed è pericolosa quando si muove.\n\nfiltro aria\n\nFiltro dell’aspirazione del motore, non organo che lavora il suolo.\n\ncapacità del serbatoio\n\nVolume contenibile, non consumo orario né durata.\n\nritmo di lavoro\n\nTempo misurato per area effettiva sotto condizioni dichiarate.\n\nDPI\n\nDispositivi di protezione individuale adatti al compito e al manuale.', 'lavorazione\n\nDisturbo meccanico del suolo; effetti secondo profondità, umidità e scopo.\n\naerazione\n\nMovimento, scambio d’aria presso le radici, non risultato garantito di lavorazioni ripetute.\n\nfeddan\n\nUnità di superficie egiziana di quattromiladuecento metri quadrati uguale a zero virgola quattro due ettari, circa uno virgola zero tre otto acre.\n\nfrizione\n\nInnesta o disinnesta potenza; la esse e erre usa tensione della cinghia secondo Honda.\n\ndente rotante\n\nParte che lavora il suolo, si usura ed è pericolosa quando si muove.\n\nfiltro aria\n\nFiltro dell’aspirazione del motore, non organo che lavora il suolo.\n\ncapacità del serbatoio\n\nVolume contenibile, non consumo orario né durata.\n\nritmo di lavoro\n\nTempo misurato per area effettiva sotto condizioni dichiarate.\n\ndi pi i\n\nDispositivi di protezione individuale adatti al compito e al manuale.')], 'de': [('Bestimme auf einer eigenständigen SER-3D-Grafik die sechs geforderten Funktionsgruppen. Prüfe anhand der Variantenkennzeichnungen des Herstellers, ob ein gezeigtes Vorderrad oder eine Griffverstellung zur SER passt. Übernimm weder das nur DE/DER zugeordnete Vorderrad noch anstelle der SE/SER-Höhenverstellung ein Bedienelement einer anderen Variante. Erkläre die Kupplung, ohne sie mit dem Getriebe gleichzusetzen.\n\nFür den ursprünglichen 1-Acre-Fall anhand Reihen-/Wurzelabstand, Steinen, Feuchte, Betriebsort im Freien, Abgasrisiken und Kosten Handarbeit, SER oder anderes wählen. Fehlende Angaben und mögliche Umkehr der Wahl nennen.\n\n2 Feddan in 8.400 m², 0,84 ha und etwa 2,076 Acre umrechnen; 4–6 h/Feddan und 2,3 L/h der Quelle als SER-unbelegt sowie 2,4 L als Tankinhalt einordnen. Kosten-Checkliste ohne Preise erstellen.\n\nModellzuordnung und Funktion bewerten; kein angetriebenes Vorderrad, keine Fliehkraftkupplung oder unbelegten 5 HP.\n\nDies ist eine Wissensübung. Hier wurde keine tatsächliche Maschine abgeglichen, geprüft, gestartet oder freigegeben. Reale Bedienung und Wartung gehören zu betreuten Aufgaben mit dem tatsächlichen Modell und Handbuch.', 'Bestimme auf einer eigenständigen dreidimensionalen Grafik für Es E Er die sechs geforderten Funktionsgruppen. Prüfe anhand der Variantenkennzeichnungen des Herstellers, ob ein gezeigtes Vorderrad oder eine Griffverstellung zur Es E Er passt. Übernimm weder das nur De E, De E Er zugeordnete Vorderrad noch anstelle der Es E, Es E Er-Höhenverstellung ein Bedienelement einer anderen Variante. Erkläre die Kupplung, ohne sie mit dem Getriebe gleichzusetzen.\n\nFür den ursprünglichen eins-Acre-Fall anhand Reihen-, Wurzelabstand, Steinen, Feuchte, Betriebsort im Freien, Abgasrisiken und Kosten Handarbeit, Es E Er oder anderes wählen. Fehlende Angaben und mögliche Umkehr der Wahl nennen.\n\nzwei Feddan in achttausendvierhundert Quadratmeter, null Komma acht vier Hektar und etwa zwei Komma null sieben sechs Acre umrechnen; vier bis sechs Stunden je Feddan und zwei Komma drei Liter je Stunde der Quelle als Es E Er-unbelegt sowie zwei Komma vier Liter als Tankinhalt einordnen. Kosten-Checkliste ohne Preise erstellen.\n\nModellzuordnung und Funktion bewerten; kein angetriebenes Vorderrad, keine Fliehkraftkupplung oder unbelegten fünf Ha Pe.\n\nDies ist eine Wissensübung. Hier wurde keine tatsächliche Maschine abgeglichen, geprüft, gestartet oder freigegeben. Reale Bedienung und Wartung gehören zu betreuten Aufgaben mit dem tatsächlichen Modell und Handbuch.'), ('Bodenbearbeitung\n\nMechanische Bodenstörung; Nutzen und Schaden nach Tiefe, Feuchte und Zweck.\n\nBelüftung\n\nBewegung/Austausch der Luft bei Wurzeln, kein garantierter Effekt häufigen Fräsens.\n\nFeddan\n\nÄgyptische Flächeneinheit von 4.200 m² = 0,42 ha, rund 1,038 Acre.\n\nKupplung\n\nVerbindet/trennt Antrieb; SER hat laut Handbuch Riemenspannkupplung.\n\nFräszinken\n\nDrehendes Bodenarbeitsteil, das verschleißt und in Bewegung gefährlich ist.\n\nLuftfilter\n\nFilter am Motoransaugweg, kein Bodenarbeitsorgan.\n\nTankinhalt\n\nKraftstoffvolumen des Tanks, nicht Verbrauch pro Stunde oder Laufzeit.\n\nArbeitsleistung\n\nGemessene Auftragszeit pro tatsächlicher Fläche unter angegebenen Bedingungen.\n\nPSA\n\nAufgabe und Herstellervorgabe entsprechende persönliche Schutzausrüstung.', 'Bodenbearbeitung\n\nMechanische Bodenstörung; Nutzen und Schaden nach Tiefe, Feuchte und Zweck.\n\nBelüftung\n\nBewegung, Austausch der Luft bei Wurzeln, kein garantierter Effekt häufigen Fräsens.\n\nFeddan\n\nÄgyptische Flächeneinheit von viertausendzweihundert Quadratmeter gleich null Komma vier zwei Hektar, rund eins Komma null drei acht Acre.\n\nKupplung\n\nVerbindet, trennt Antrieb; Es E Er hat laut Handbuch Riemenspannkupplung.\n\nFräszinken\n\nDrehendes Bodenarbeitsteil, das verschleißt und in Bewegung gefährlich ist.\n\nLuftfilter\n\nFilter am Motoransaugweg, kein Bodenarbeitsorgan.\n\nTankinhalt\n\nKraftstoffvolumen des Tanks, nicht Verbrauch pro Stunde oder Laufzeit.\n\nArbeitsleistung\n\nGemessene Auftragszeit pro tatsächlicher Fläche unter angegebenen Bedingungen.\n\nPe Es A\n\nAufgabe und Herstellervorgabe entsprechende persönliche Schutzausrüstung.'), ('Eine handgeführte Bodenfräse kann Unkraut zwischen passenden Reihen bearbeiten. Modell, Arbeitsbreite, Fräswerk, Boden, Schutz und Ausbildung entscheiden jedoch über die Sicherheit. Honda FJ500-SER dient als dokumentiertes Lehrbeispiel; die Lehrkraft muss das tatsächliche Gerät mit dessen eigenem Handbuch abgleichen.\n\nBestimme anhand der passenden Herstellerzeichnung Motor, riemenspannende Kupplung, Getriebe, Fräsrotor, Handgriffsteuerung und sichtbare Sicherheitsbauteile der FJ500-SER, ohne DE/DER-Teile oder generische Lehrgrafik zu übernehmen.\n\nErkläre bedingte Wirkungen bei Unkraut, Arbeitsaufwand, Belüftung und flacher Bearbeitung; wähle Maschine, Handarbeit oder andere Methode nach Reihenabstand, Wurzeln, Boden, Steinen, Schutz, geeignetem Betriebsort im Freien, Abgasrisiken und Ausbildung.\n\nRechne ägyptische Feddan, m², Hektar und Acre richtig um; trenne Tankvolumen, Kraftstoffverbrauch und Arbeitszeit und verweigere unbelegte Dienstleistungskosten oder Effizienzzahlen.', 'Eine handgeführte Bodenfräse kann Unkraut zwischen passenden Reihen bearbeiten. Modell, Arbeitsbreite, Fräswerk, Boden, Schutz und Ausbildung entscheiden jedoch über die Sicherheit. Honda Ef Jot fünfhundert-Es E Er dient als dokumentiertes Lehrbeispiel; die Lehrkraft muss das tatsächliche Gerät mit dessen eigenem Handbuch abgleichen.\n\nBestimme anhand der passenden Herstellerzeichnung Motor, riemenspannende Kupplung, Getriebe, Fräsrotor, Handgriffsteuerung und sichtbare Sicherheitsbauteile der Ef Jot fünfhundert-Es E Er, ohne De E, De E Er-Teile oder generische Lehrgrafik zu übernehmen.\n\nErkläre bedingte Wirkungen bei Unkraut, Arbeitsaufwand, Belüftung und flacher Bearbeitung; wähle Maschine, Handarbeit oder andere Methode nach Reihenabstand, Wurzeln, Boden, Steinen, Schutz, geeignetem Betriebsort im Freien, Abgasrisiken und Ausbildung.\n\nRechne ägyptische Feddan, Quadratmeter, Hektar und Acre richtig um; trenne Tankvolumen, Kraftstoffverbrauch und Arbeitszeit und verweigere unbelegte Dienstleistungskosten oder Effizienzzahlen.')]}
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
    loc=os.environ.get('LOCALE_LANE');assert loc in ['ar-EG'];assert os.environ.get('GITHUB_JOB')=={'ar-EG':'narrate_ar','en':'narrate_en','it':'narrate_it','de':'narrate_de'}[loc];return loc

def require_actions():
    lane()
    assert os.environ.get('GITHUB_ACTIONS')=='true','Actions only'
    assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820' and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418' and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-approved-extra-s313-ar3-20261024-r2'
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
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 3,'maximumCallsForLane':3,
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_THREE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':3,'maximumBlindReviewPerLane':3,'maximumASRPerLane':3,'maximumTTSAggregate':3,'maximumBlindAggregate':3,'maximumASRAggregate':3,'maximumMetadataGETAggregate':2,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
