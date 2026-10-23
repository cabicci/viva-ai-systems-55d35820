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
IDS = ('S2-05-ar-EG-supervised-stages-r1', 'S2-05-ar-EG-practical-completion-r1', 'S2-05-ar-EG-card-scope-r1', 'S2-05-ar-EG-record-and-product-guidance-r1', 'S2-05-en-supervised-stages-r1', 'S2-05-en-practical-completion-r1', 'S2-05-en-card-scope-r1', 'S2-05-en-record-and-product-guidance-r1', 'S2-05-it-supervised-stages-r1', 'S2-05-it-practical-completion-r1', 'S2-05-it-card-scope-r1', 'S2-05-it-record-and-product-guidance-r1', 'S2-05-de-supervised-stages-r1', 'S2-05-de-practical-completion-r1', 'S2-05-de-card-scope-r1', 'S2-05-de-record-and-product-guidance-r1')
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
    assert(req['scope'],req['stepId'])==('S205_SIXTEEN_SUPERVISED_LABORATORY_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-05')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s205-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==16
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(4))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['supervised-stages','practical-completion','card-scope','record-and-product-guidance']
        voice='Charon'if group in['practical-completion','record-and-product-guidance']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'supervised-stages':('/labPractice/stages/',),'practical-completion':('/labPractice/passChecks/',),'card-scope':('/labPractice/cards/',),'record-and-product-guidance':('/labPractice/ui/','/finalCardRecords/localOnly','/finalCardRecords/controls/boundary','/studentDownloads/0/title')}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('أداءً آمنًا فرديًا موثقًا', 'أداء آمن وفردي متوثق'), ('المدرّب يشوف كل طالب وهو يحدد مكان غسل العين ودش السلامة والمخرج وطفاية الحريق ومسار المخلفات المخصص؛ ويستخدم البطاقة ونشرة بيانات السلامة المعنيتين؛ ويختار معدات الوقاية المناسبة للمادة والمهمة؛ ويميّز دور البيكر والمخبار المدرّج والمنخل والهاون والمدقة والميزان وجهاز pH والكولوريميتر.\n\nالاجتياز يتطلب أداء آمن وفردي متوثق من المدرّب. الاختبار الإلكتروني أو أداء المجموعة أو صورة الأدوات ما يكفيش. أي تصرف غير آمن يوقف التدريب في المحطة دي لحد التصحيح.\n\nالمدرّب يسجل هوية العينة عند الاستلام، حالتها قبل التجفيف، التحليل المطلوب، وقت بداية ونهاية تجفيف الطالب نفسه أو طريقة الحفظ البديلة، نظافة الصينية وطبقة التربة الرفيعة بعيد عن الشمس والتلوث، تفكيك الكتل بلطف، استخدام منخل 2 مم عند لزومه، واستمرار هوية العينة.\n\nالاجتياز يكون بعد ما الطالب ينفذ كل مرحلة مطلوبة بنفسه خلال الزمن الحقيقي ويسجلها المدرّب. العينة اللي اتسلّمت مجففة من قبل تسمح بتقييم التفكيك والنخل فقط؛ ما تثبتش مهارة التجفيف.\n\nالمدرّب يفحص غياب الحجارة والجذور والأوراق الظاهرة، جفاف العينة وتفتتها حسب المهمة دي، تجانس المادة المنخولة، وزن 450–550 جم، غلق الكيس بإحكام، وصحة التاريخ ورمز الحقل وعمق السحب واسم جامع العينة مقارنة بسجل الحقل، مع شرح الطالب لاستثناءات طريقة التجفيف.\n\nالاجتياز يحتاج كل معايير بطاقة المنتج الأصلية ودليل تنفيذ الطالب الفردي. سماحية 450–550 جم خاصة ببطاقة التقييم دي، مش قاعدة لكل معمل. الكيس الصحيح وحده ما يثبتش مين جفّف العينة.', 'المدرّب يشوف كل طالب وهو يحدد مكان غسل العين ودش السلامة والمخرج وطفاية الحريق ومسار المخلفات المخصص؛ ويستخدم البطاقة ونشرة بيانات السلامة المعنيتين؛ ويختار معدات الوقاية المناسبة للمادة والمهمة؛ ويميّز دور البيكر والمخبار المدرّج والمنخل والهاون والمدقة والميزان وجهاز بي إتش والكولوريميتر.\n\nالاجتياز يتطلب أداء آمن وفردي متوثق من المدرّب. الاختبار الإلكتروني أو أداء المجموعة أو صورة الأدوات ما يكفيش. أي تصرف غير آمن يوقف التدريب في المحطة دي لحد التصحيح.\n\nالمدرّب يسجل هوية العينة عند الاستلام، حالتها قبل التجفيف، التحليل المطلوب، وقت بداية ونهاية تجفيف الطالب نفسه أو طريقة الحفظ البديلة، نظافة الصينية وطبقة التربة الرفيعة بعيد عن الشمس والتلوث، تفكيك الكتل بلطف، استخدام منخل اتنين مليمتر عند لزومه، واستمرار هوية العينة.\n\nالاجتياز يكون بعد ما الطالب ينفذ كل مرحلة مطلوبة بنفسه خلال الزمن الحقيقي ويسجلها المدرّب. العينة اللي اتسلّمت مجففة من قبل تسمح بتقييم التفكيك والنخل فقط؛ ما تثبتش مهارة التجفيف.\n\nالمدرّب يفحص غياب الحجارة والجذور والأوراق الظاهرة، جفاف العينة وتفتتها حسب المهمة دي، تجانس المادة المنخولة، وزن أربعمية وخمسين لخمسمية وخمسين جرام، غلق الكيس بإحكام، وصحة التاريخ ورمز الحقل وعمق السحب واسم جامع العينة مقارنة بسجل الحقل، مع شرح الطالب لاستثناءات طريقة التجفيف.\n\nالاجتياز يحتاج كل معايير بطاقة المنتج الأصلية ودليل تنفيذ الطالب الفردي. سماحية أربعمية وخمسين لخمسمية وخمسين جرام خاصة ببطاقة التقييم دي، مش قاعدة لكل معمل. الكيس الصحيح وحده ما يثبتش مين جفّف العينة.'), ('المهمة دي هدفها حوالي 500 g، والمسموح 450–550 g. الكتلة وحدها مش كفاية لاجتياز معايير المنتج الستة.\n\nاكتب ملاحظات تدريب بس. السجل المحلي ده مش توقيع مدرّب ولا تسليم فعلي لمعمل.\n\nرمز العينة / الحقل\n\nتاريخ الجمع\n\nعمق سحب العينة\n\nاسم جامع العينة\n\nالتحليل المطلوب / طريقته\n\nبداية التجفيف لو مطلوب\n\nالملاحظات المؤرخة / حالة العينة\n\nنهاية التجفيف الفعلية وحالته لو اتشافت\n\nنظافة الأدوات / جزء النخل / الكتلة\n\nإيه اللي المدرّب لسه محتاج يشوفه؟\n\nاستخدم دليل حقيقي بس. المدخلات المحلية والأسماء المكتوبة ملاحظات من غير توقيع، مش قرارات أو توقيعات مدرّب موثّقة. مراجعة المنتج ما تثبتش مين نفّذ التحضير؛ الفعل العملي محتاج ملاحظة لكل فرد. بنود الكيت بتخص المثال التعليمي الموثّق، ولازم يتوفر الدليل أو إجراء التشغيل القياسي (SOP) المطابق للجهاز المستخدم فعلي؛ غير كده سيبها غير مقيّمة.\n\nالسجل الفاضي ده مش ملاحظة ولا اجتياز. سيب القرارات والبيانات الفعلية فاضية لحد ما المدرّب يشوف أو يراجع البند الفردي فعلًا.\n\nورقة تدريب تجهيز العينة', 'المهمة دي هدفها حوالي خمسمية جرام، والمسموح أربعمية وخمسين لخمسمية وخمسين جرام. الكتلة وحدها مش كفاية لاجتياز معايير المنتج الستة.\n\nاكتب ملاحظات تدريب بس. السجل المحلي ده مش توقيع مدرّب ولا تسليم فعلي لمعمل.\n\nرمز العينة / الحقل\n\nتاريخ الجمع\n\nعمق سحب العينة\n\nاسم جامع العينة\n\nالتحليل المطلوب / طريقته\n\nبداية التجفيف لو مطلوب\n\nالملاحظات المؤرخة / حالة العينة\n\nنهاية التجفيف الفعلية وحالته لو اتشافت\n\nنظافة الأدوات / جزء النخل / الكتلة\n\nإيه اللي المدرّب لسه محتاج يشوفه؟\n\nاستخدم دليل حقيقي بس. المدخلات المحلية والأسماء المكتوبة ملاحظات من غير توقيع، مش قرارات أو توقيعات مدرّب موثّقة. مراجعة المنتج ما تثبتش مين نفّذ التحضير؛ الفعل العملي محتاج ملاحظة لكل فرد. بنود الكيت بتخص المثال التعليمي الموثّق، ولازم يتوفر الدليل أو إجراء التشغيل القياسي (إس أو بي) المطابق للجهاز المستخدم فعلي؛ غير كده سيبها غير مقيّمة.\n\nالسجل الفاضي ده مش ملاحظة ولا اجتياز. سيب القرارات والبيانات الفعلية فاضية لحد ما المدرّب يشوف أو يراجع البند الفردي فعلًا.\n\nورقة تدريب تجهيز العينة'), ('بطاقة الملاحظة دي فيها تسعة أفعال موزعة بين تحضير العينة وخطوة pH اللاحقة. اللي بيتقيّم هنا هو الوقاية، وتفكيك الكتل برفق، والنخل عند 2 mm. العينة المعطاة مجففة من قبل، فالنشاط ده ما يثبتش إنك جففتها بنفسك. مقادير البطاقة 20 g و20 mL، والخلط دقيقة والترسيب 15 دقيقة، ومعايرة الجهاز والقراءة الثابتة تخص حالة pH التعليمية اللاحقة، وحسب بروتوكولها.\n\nالمدرّب يفحص ستة معايير المنتج في بطاقة التقييم: لا شوائب ظاهرة؛ جفاف مناسب وتفتت من غير تكتل؛ تفكيك الكتل برفق ونخل وتجانس؛ وزن 450–550 g؛ غلق محكم؛ بطاقة واضحة فيها التاريخ ورمز الحقل والعمق واسم جامع العينة. يلاحظ التجفيف والتجهيز الفردي منفصلين علشان جودة المنتج ما تتحسبش دليل على العملية.', 'بطاقة الملاحظة دي فيها تسعة أفعال موزعة بين تحضير العينة وخطوة بي إتش اللاحقة. اللي بيتقيّم هنا هو الوقاية، وتفكيك الكتل برفق، والنخل عند اتنين مليمتر. العينة المعطاة مجففة من قبل، فالنشاط ده ما يثبتش إنك جففتها بنفسك. مقادير البطاقة عشرين جرام وعشرين مليلتر، والخلط دقيقة والترسيب خمستاشر دقيقة، ومعايرة الجهاز والقراءة الثابتة تخص حالة بي إتش التعليمية اللاحقة، وحسب بروتوكولها.\n\nالمدرّب يفحص ستة معايير المنتج في بطاقة التقييم: لا شوائب ظاهرة؛ جفاف مناسب وتفتت من غير تكتل؛ تفكيك الكتل برفق ونخل وتجانس؛ وزن أربعمية وخمسين لخمسمية وخمسين جرام؛ غلق محكم؛ بطاقة واضحة فيها التاريخ ورمز الحقل والعمق واسم جامع العينة. يلاحظ التجفيف والتجهيز الفردي منفصلين علشان جودة المنتج ما تتحسبش دليل على العملية.'), ('بعيدًا عن الشمس', 'بعيد عن الشمس'), ('حدد مخرج الموقع وغسل العين والدش وطفاية الحريق وعبوات المخلفات؛ ورّي نشرة المادة المناسبة واختار الوقاية المتوافقة قبل لمس العينة.\n\nالمدرّب يسجل أداء كل طالب وأي تصحيح.\n\nطابق بطاقة العينة مع سجل الحقل وسجل الرمز الكامل وتاريخ الجمع والمكان والعمق والجامع.\n\nالمدرّب يوقع على مطابقة الهوية.\n\nتأكد من التحليل المطلوب. لو طريقته محتاجة تجفيف، افرد طبقة رفيعة معلّمة في مكان نظيف جيد التهوية بعيد عن الشمس؛ وسجل بداية التجفيف والملاحظة ووقت اكتماله الحقيقي.\n\nالمدرّب يشوف تجهيز الطالب واكتماله عبر المراحل؛ العينة المجففة من قبل ما تعطيش دليل المهارة دي.\n\nفكّ الكتل الجافة برفق من غير طحن حجارة، ومرّرها في منخل 2 مم المطلوب، واحتفظ بجزء التربة الدقيقة المعروف هويته.\n\nالمدرّب يلاحظ اختيار الأداة ونظافتها وفصل المواد.\n\nزِن واقفل منتج بطاقة التقييم في نطاق 450–550 g، وافحص البطاقة الكاملة المطابقة، واشرح تحليل ما يناسبوش التجفيف.\n\nالمدرّب يفحص كل معايير المنتج ويسجل الأداء الفعلي للطالب.', 'حدد مخرج الموقع وغسل العين والدش وطفاية الحريق وعبوات المخلفات؛ ورّي نشرة المادة المناسبة واختار الوقاية المتوافقة قبل لمس العينة.\n\nالمدرّب يسجل أداء كل طالب وأي تصحيح.\n\nطابق بطاقة العينة مع سجل الحقل وسجل الرمز الكامل وتاريخ الجمع والمكان والعمق والجامع.\n\nالمدرّب يوقع على مطابقة الهوية.\n\nتأكد من التحليل المطلوب. لو طريقته محتاجة تجفيف، افرد طبقة رفيعة معلّمة في مكان نظيف جيد التهوية بعيد عن الشمس؛ وسجل بداية التجفيف والملاحظة ووقت اكتماله الحقيقي.\n\nالمدرّب يشوف تجهيز الطالب واكتماله عبر المراحل؛ العينة المجففة من قبل ما تعطيش دليل المهارة دي.\n\nفكّ الكتل الجافة برفق من غير طحن حجارة، ومرّرها في منخل اتنين مليمتر المطلوب، واحتفظ بجزء التربة الدقيقة المعروف هويته.\n\nالمدرّب يلاحظ اختيار الأداة ونظافتها وفصل المواد.\n\nزِن واقفل منتج بطاقة التقييم في نطاق أربعمية وخمسين لخمسمية وخمسين جرام، وافحص البطاقة الكاملة المطابقة، واشرح تحليل ما يناسبوش التجفيف.\n\nالمدرّب يفحص كل معايير المنتج ويسجل الأداء الفعلي للطالب.'), ('دليلًا على العملية', 'دليل على العملية'), ('فعليًا', 'فعلي'), ('لو طريقته تحتاج تجفيفًا', 'لو طريقته محتاجة تجفيف'), ('مسبقًا', 'من قبل'), ('واشرح تحليلًا لا يناسبه التجفيف', 'واشرح تحليل ما يناسبوش التجفيف')], 'en': [('2 mm sieve', 'two-millimetre sieve'), ('2 mm sieving', 'two-millimetre sieving'), ('450–550 g tolerance', '450–550-gram tolerance'), ("Point to site-specific exit, eye-wash, shower, fire extinguisher and waste containers; show relevant SDS and choose compatible PPE before touching the sample.\n\nTrainer records each learner's demonstration and any correction.\n\nRead source label against field record and record the full sample ID, collection date, location/depth and collector.\n\nTrainer signs identity match.\n\nConfirm the requested analysis. If this protocol calls for drying, spread a thin labelled layer in a clean ventilated place away from direct sun; log start, observation and actual completion time.\n\nTrainer observes the learner's preparation and completion across stages; pre-dried sample cannot earn this evidence.\n\nGently break dry aggregates without grinding stones; pass through the required two-millimetre sieve and retain the correct identified fine-earth fraction.\n\nTrainer observes tool choice, cleaning and material separation.\n\nWeigh and seal the assessment-card final product weighing450–550 g, check the complete matching label and explain a test for which drying would be inappropriate.\n\nTrainer checks all product criteria and records actual learner performance.", "Point to site-specific exit, eye-wash, shower, fire extinguisher and waste containers; show relevant S D S and choose compatible P P E before touching the sample.\n\nTrainer records each learner's demonstration and any correction.\n\nRead source label against field record and record the full sample ID, collection date, location/depth and collector.\n\nTrainer signs identity match.\n\nConfirm the requested analysis. If this protocol calls for drying, spread a thin labelled layer in a clean ventilated place away from direct sun; log start, observation and actual completion time.\n\nTrainer observes the learner's preparation and completion across stages; pre-dried sample cannot earn this evidence.\n\nGently break dry aggregates without grinding stones; pass through the required two-millimetre sieve and retain the correct identified fine-earth fraction.\n\nTrainer observes tool choice, cleaning and material separation.\n\nWeigh and seal the assessment-card final product weighingfour hundred and fifty to five hundred and fifty grams, check the complete matching label and explain a test for which drying would be inappropriate.\n\nTrainer checks all product criteria and records actual learner performance."), ('This card targets about 500 g, with 450–550 g allowed. Mass alone does not satisfy all six product criteria.\n\nUse training notes only. This local record is not a trainer signature or a real laboratory submission.\n\nSample ID / field\n\nCollection date\n\nSampling depth\n\nCollector\n\nRequested analysis / method\n\nDrying start, if required\n\nDated observations / condition\n\nActual drying end / condition, if observed\n\nTool cleaning / sieve fraction / mass\n\nWhat the trainer must still observe\n\nUse actual evidence only. Local entries and typed names are unsigned notes, not authenticated trainer decisions or signatures. Product review does not prove who performed preparation; process actions need individual observation. Kit-specific rows refer to the documented teaching example and require the actual matching manual/SOP; otherwise leave them unassessed.\n\nThis blank record is not an observation or a pass. Leave decisions and actual data blank until the trainer actually observes or reviews the individual requirement.\n\nSample preparation worksheet', 'This card targets about five hundred grams, with four hundred and fifty to five hundred and fifty grams allowed. Mass alone does not satisfy all six product criteria.\n\nUse training notes only. This local record is not a trainer signature or a real laboratory submission.\n\nSample ID / field\n\nCollection date\n\nSampling depth\n\nCollector\n\nRequested analysis / method\n\nDrying start, if required\n\nDated observations / condition\n\nActual drying end / condition, if observed\n\nTool cleaning / sieve fraction / mass\n\nWhat the trainer must still observe\n\nUse actual evidence only. Local entries and typed names are unsigned notes, not authenticated trainer decisions or signatures. Product review does not prove who performed preparation; process actions need individual observation. Kit-specific rows refer to the documented teaching example and require the actual matching manual/S O P; otherwise leave them unassessed.\n\nThis blank record is not an observation or a pass. Leave decisions and actual data blank until the trainer actually observes or reviews the individual requirement.\n\nSample preparation worksheet'), ('This nine-action observation card spans sample preparation and the later pH step. The actions assessed here are PPE, gentle aggregate breakup and two-millimetre sieving. The supplied sample is already air-dried, so this activity does not demonstrate your drying skill. The card’s 20 g / 20 mL / 1 minute / 15 minutes and calibrated stable reading belong to the later pH teaching scenario and remain subject to its protocol.\n\nTrainer checks six product criteria: no visible debris; appropriately air-dried crumbly condition; gently crushed and sieved uniform texture; 450–550 g; secure seal; legible matching date, Field ID, depth and collector name. Observe individual drying and preparation separately so the product is not mistaken for process proof.', 'This nine-action observation card spans sample preparation and the later P H step. The actions assessed here are P P E, gentle aggregate breakup and two-millimetre sieving. The supplied sample is already air-dried, so this activity does not demonstrate your drying skill. The card’s twenty grams / twenty millilitres / one minute / fifteen minutes and calibrated stable reading belong to the later P H teaching scenario and remain subject to its protocol.\n\nTrainer checks six product criteria: no visible debris; appropriately air-dried crumbly condition; gently crushed and sieved uniform texture; four hundred and fifty to five hundred and fifty grams; secure seal; legible matching date, Field ID, depth and collector name. Observe individual drying and preparation separately so the product is not mistaken for process proof.'), ("Trainer observes the learner identify the eye-wash, shower, exit, extinguisher and designated waste route; use the applicable label/SDS; select task- and chemical-compatible PPE; match beaker, graduated cylinder, sieve, mortar/pestle, balance, pH device and colorimeter to their intended roles.\n\nPass only with individual, safe demonstration and recorded trainer evidence. A quiz, group action or photograph of equipment is insufficient; unsafe actions pause the practice and require remediation.\n\nTrainer records sample ID at receipt, pre-drying condition, method requested, learner's own drying start/end or other protocol-specific handling, clean thin-layer tray away from sun/contamination, gentle aggregate breakdown, two-millimetre sieve use where appropriate and retained sample identity.\n\nPass only when the learner personally performs every required stage over actual elapsed time and the trainer records it. A pre-dried supplied sample permits crush/sieve assessment only and cannot prove drying skill.\n\nTrainer checks no visible stones/roots/leaves, appropriately dry crumbly sample for this assessment task, uniform sieved material, measured 450–550 g, securely sealed bag, accurate date, Field ID, sample depth and collector's name matching the full field record, plus the learner's explanation of method exceptions.\n\nPass only if all product criteria and individual process evidence are present; the 450–550-gram tolerance belongs to this assessment card, not every laboratory. A correct final bag does not prove who dried it.", "Trainer observes the learner identify the eye-wash, shower, exit, extinguisher and designated waste route; use the applicable label/S D S; select task- and chemical-compatible P P E; match beaker, graduated cylinder, sieve, mortar/pestle, balance, P H device and colorimeter to their intended roles.\n\nPass only with individual, safe demonstration and recorded trainer evidence. A quiz, group action or photograph of equipment is insufficient; unsafe actions pause the practice and require remediation.\n\nTrainer records sample ID at receipt, pre-drying condition, method requested, learner's own drying start/end or other protocol-specific handling, clean thin-layer tray away from sun/contamination, gentle aggregate breakdown, two-millimetre sieve use where appropriate and retained sample identity.\n\nPass only when the learner personally performs every required stage over actual elapsed time and the trainer records it. A pre-dried supplied sample permits crush/sieve assessment only and cannot prove drying skill.\n\nTrainer checks no visible stones/roots/leaves, appropriately dry crumbly sample for this assessment task, uniform sieved material, measured four hundred and fifty to five hundred and fifty grams, securely sealed bag, accurate date, Field ID, sample depth and collector's name matching the full field record, plus the learner's explanation of method exceptions.\n\nPass only if all product criteria and individual process evidence are present; the four hundred and fifty to five hundred and fifty-gram tolerance belongs to this assessment card, not every laboratory. A correct final bag does not prove who dried it."), ('assessment-card 450–550 g final product', 'assessment-card final product weighing450–550 g'), ('weighingfour hundred', 'weighing four hundred')], 'it': [("Il formatore osserva ogni allievo mentre individua lavaocchi, doccia, uscita, estintore e percorso dei rifiuti; consulta etichetta e SDS applicabili; sceglie DPI compatibili con sostanza e mansione; associa becher, cilindro graduato, setaccio, mortaio e pestello, bilancia, dispositivo pH e colorimetro ai rispettivi impieghi.\n\nSupera solo con dimostrazione individuale sicura e prova registrata dal formatore. Quiz, azione di gruppo o foto degli strumenti non bastano. Una condotta insicura sospende quella pratica fino alla correzione.\n\nIl formatore registra ID all'arrivo, stato prima dell'essiccazione, metodo richiesto, inizio e fine dell'essiccazione eseguita dall'allievo o altra conservazione prevista, vassoio pulito con strato sottile lontano da sole e contaminazione, disgregazione delicata, setaccio da 2 mm se previsto e continuità dell'identità.\n\nSupera solo se l'allievo esegue personalmente ogni fase necessaria durante il tempo effettivo e il formatore la documenta. Un campione fornito già asciutto permette di valutare disgregazione e setacciatura, non l'essiccazione.\n\nIl formatore verifica assenza di sassi, radici e foglie visibili, consistenza asciutta e friabile appropriata a questo compito, uniformità del materiale setacciato, massa di 450–550 g, chiusura sicura, data, ID del campo, profondità e nome del raccoglitore leggibili e coerenti con il registro, più la spiegazione delle eccezioni al metodo.\n\nServono tutti i criteri della scheda prodotto originale e la prova del lavoro individuale. La tolleranza 450–550 g vale per questa scheda, non per ogni laboratorio; un sacchetto corretto da solo non dimostra chi abbia essiccato il campione.", "Il formatore osserva ogni allievo mentre individua lavaocchi, doccia, uscita, estintore e percorso dei rifiuti; consulta etichetta e S D S applicabili; sceglie D P I compatibili con sostanza e mansione; associa becher, cilindro graduato, setaccio, mortaio e pestello, bilancia, dispositivo P H e colorimetro ai rispettivi impieghi.\n\nSupera solo con dimostrazione individuale sicura e prova registrata dal formatore. Quiz, azione di gruppo o foto degli strumenti non bastano. Una condotta insicura sospende quella pratica fino alla correzione.\n\nIl formatore registra I D all'arrivo, stato prima dell'essiccazione, metodo richiesto, inizio e fine dell'essiccazione eseguita dall'allievo o altra conservazione prevista, vassoio pulito con strato sottile lontano da sole e contaminazione, disgregazione delicata, setaccio da due millimetri se previsto e continuità dell'identità.\n\nSupera solo se l'allievo esegue personalmente ogni fase necessaria durante il tempo effettivo e il formatore la documenta. Un campione fornito già asciutto permette di valutare disgregazione e setacciatura, non l'essiccazione.\n\nIl formatore verifica assenza di sassi, radici e foglie visibili, consistenza asciutta e friabile appropriata a questo compito, uniformità del materiale setacciato, massa di quattrocentocinquanta a cinquecentocinquanta grammi, chiusura sicura, data, I D del campo, profondità e nome del raccoglitore leggibili e coerenti con il registro, più la spiegazione delle eccezioni al metodo.\n\nServono tutti i criteri della scheda prodotto originale e la prova del lavoro individuale. La tolleranza quattrocentocinquanta a cinquecentocinquanta grammi vale per questa scheda, non per ogni laboratorio; un sacchetto corretto da solo non dimostra chi abbia essiccato il campione."), ("Indica uscita, lavaocchi, doccia, estintore e contenitori dei rifiuti del sito; mostra la SDS pertinente e scegli DPI compatibili prima di toccare il campione.\n\nIl formatore registra la dimostrazione di ciascun allievo e le correzioni.\n\nConfronta etichetta e registro del campo; registra ID completo, data, posizione, profondità e raccoglitore.\n\nIl formatore firma la corrispondenza dell'identità.\n\nConferma l'analisi. Se il metodo richiede essiccazione, stendi uno strato sottile etichettato in luogo pulito e ventilato senza sole diretto; registra inizio, osservazioni e fine reale.\n\nIl formatore osserva preparazione e completamento in più fasi; un campione già asciutto non prova questa abilità.\n\nDisgrega delicatamente gli aggregati asciutti senza macinare pietre; usa il setaccio da 2 mm previsto e conserva la frazione fine identificata.\n\nIl formatore osserva scelta e pulizia degli strumenti e separazione dei materiali.\n\nPesa e chiudi il prodotto della scheda di valutazione a 450–550 g, controlla l'etichetta completa e spiega un'analisi incompatibile con l'essiccazione.\n\nIl formatore verifica tutti i criteri del prodotto e registra l'esecuzione personale.", "Indica uscita, lavaocchi, doccia, estintore e contenitori dei rifiuti del sito; mostra la S D S pertinente e scegli D P I compatibili prima di toccare il campione.\n\nIl formatore registra la dimostrazione di ciascun allievo e le correzioni.\n\nConfronta etichetta e registro del campo; registra I D completo, data, posizione, profondità e raccoglitore.\n\nIl formatore firma la corrispondenza dell'identità.\n\nConferma l'analisi. Se il metodo richiede essiccazione, stendi uno strato sottile etichettato in luogo pulito e ventilato senza sole diretto; registra inizio, osservazioni e fine reale.\n\nIl formatore osserva preparazione e completamento in più fasi; un campione già asciutto non prova questa abilità.\n\nDisgrega delicatamente gli aggregati asciutti senza macinare pietre; usa il setaccio da due millimetri previsto e conserva la frazione fine identificata.\n\nIl formatore osserva scelta e pulizia degli strumenti e separazione dei materiali.\n\nPesa e chiudi il prodotto della scheda di valutazione a quattrocentocinquanta a cinquecentocinquanta grammi, controlla l'etichetta completa e spiega un'analisi incompatibile con l'essiccazione.\n\nIl formatore verifica tutti i criteri del prodotto e registra l'esecuzione personale."), ('Questa scheda di osservazione comprende nove azioni distribuite fra la preparazione del campione e la successiva tappa del pH. Qui si valutano DPI, disgregazione delicata e setacciatura a 2 mm. Il campione fornito è già asciutto, quindi questa attività non dimostra la tua abilità di essiccazione. I 20 g / 20 mL / 1 minuto / 15 minuti della scheda, la calibrazione e la lettura stabile appartengono al successivo scenario didattico del pH, secondo il relativo protocollo.\n\nIl formatore controlla i sei criteri del prodotto originale: assenza di residui visibili, consistenza asciutta e friabile appropriata, uniformità dopo disgregazione e setaccio, 450–550 g, chiusura sicura, etichetta leggibile coerente con data, ID campo, profondità e raccoglitore. Osserva a parte essiccazione e preparazione individuali, perché il prodotto non prova da solo il processo.', 'Questa scheda di osservazione comprende nove azioni distribuite fra la preparazione del campione e la successiva tappa del P H. Qui si valutano D P I, disgregazione delicata e setacciatura a due millimetri. Il campione fornito è già asciutto, quindi questa attività non dimostra la tua abilità di essiccazione. I venti grammi / venti millilitri / un minuto / quindici minuti della scheda, la calibrazione e la lettura stabile appartengono al successivo scenario didattico del P H, secondo il relativo protocollo.\n\nIl formatore controlla i sei criteri del prodotto originale: assenza di residui visibili, consistenza asciutta e friabile appropriata, uniformità dopo disgregazione e setaccio, quattrocentocinquanta a cinquecentocinquanta grammi, chiusura sicura, etichetta leggibile coerente con data, I D campo, profondità e raccoglitore. Osserva a parte essiccazione e preparazione individuali, perché il prodotto non prova da solo il processo.'), ('Questo compito mira a circa 500 g, con tolleranza 450–550 g. La massa da sola non soddisfa i sei criteri.\n\nSolo note didattiche locali: non sono firma del formatore né invio reale al laboratorio.\n\nID campione / campo\n\nData di raccolta\n\nProfondità\n\nRaccoglitore\n\nAnalisi richiesta / metodo\n\nInizio essiccazione, se richiesto\n\nOsservazioni datate / condizione\n\nFine reale / condizione, se osservata\n\nPulizia / frazione / massa\n\nCosa deve ancora osservare il formatore\n\nUsa soltanto evidenze effettive. Inserimenti locali e nomi digitati sono note non firmate, non decisioni o firme autenticate del formatore. La revisione del prodotto non prova chi ha eseguito la preparazione; le procedure richiedono osservazione individuale. Le righe specifiche del kit riguardano l’esempio documentato e richiedono manuale/SOP effettivi corrispondenti; altrimenti restano non valutate.\n\nQuesta scheda vuota non è un’osservazione né un superamento. Lascia decisioni e dati reali vuoti fino all’effettiva osservazione o revisione individuale del formatore.\n\nScheda di preparazione del campione', 'Questo compito mira a circa cinquecento grammi, con tolleranza quattrocentocinquanta a cinquecentocinquanta grammi. La massa da sola non soddisfa i sei criteri.\n\nSolo note didattiche locali: non sono firma del formatore né invio reale al laboratorio.\n\nI D campione / campo\n\nData di raccolta\n\nProfondità\n\nRaccoglitore\n\nAnalisi richiesta / metodo\n\nInizio essiccazione, se richiesto\n\nOsservazioni datate / condizione\n\nFine reale / condizione, se osservata\n\nPulizia / frazione / massa\n\nCosa deve ancora osservare il formatore\n\nUsa soltanto evidenze effettive. Inserimenti locali e nomi digitati sono note non firmate, non decisioni o firme autenticate del formatore. La revisione del prodotto non prova chi ha eseguito la preparazione; le procedure richiedono osservazione individuale. Le righe specifiche del kit riguardano l’esempio documentato e richiedono manuale/S O P effettivi corrispondenti; altrimenti restano non valutate.\n\nQuesta scheda vuota non è un’osservazione né un superamento. Lascia decisioni e dati reali vuoti fino all’effettiva osservazione o revisione individuale del formatore.\n\nScheda di preparazione del campione'), ('a quattrocentocinquanta a cinquecentocinquanta grammi', 'tra quattrocentocinquanta e cinquecentocinquanta grammi')], 'de': [('2-mm-', 'Zwei-Millimeter-'), ('Die Lehrkraft beobachtet jede lernende Person beim Auffinden von Augendusche, Notdusche, Ausgang, Feuerlöscher und vorgesehenem Entsorgungsweg; beim Lesen von Etikett und zutreffendem SDS; bei der Wahl chemikalien- und tätigkeitsgeeigneter Schutzausrüstung; und bei der Zuordnung von Becherglas, Messzylinder, Sieb, Mörser/Stößel, Waage, pH-Gerät und Kolorimeter.\n\nBestanden nur nach sicherer individueller Vorführung mit dokumentierter Beobachtung. Quiz, Gruppenleistung oder Gerätefoto genügen nicht. Unsicheres Handeln unterbricht diese Praxisstation bis zur Korrektur.\n\nDie Lehrkraft hält Probenkennung bei Annahme, Zustand vor der Trocknung, verlangte Methode, Beginn und Ende der von der lernenden Person ausgeführten Trocknung oder andere vorgeschriebene Behandlung, sauberes dünn belegtes Tablett ohne Sonne und Verunreinigung, vorsichtiges Lösen der Klumpen, gegebenenfalls Zwei-Millimeter-Sieb und durchgehende Kennzeichnung fest.\n\nBestanden nur, wenn die lernende Person jede erforderliche Phase selbst über die tatsächliche Zeit ausführt und die Lehrkraft sie erfasst. Eine schon trocken ausgegebene Probe erlaubt nur die Bewertung von Zerkleinern der Klumpen und Sieben, nicht des Trocknens.\n\nDie Lehrkraft prüft auf sichtbare Steine, Wurzeln und Blätter; für diese Aufgabe passenden trockenen, krümeligen Zustand; gleichmäßiges Siebgut; 450–550 g; dichten Verschluss; lesbare und mit dem Feldprotokoll übereinstimmende Angaben zu Datum, Feldkennung, Tiefe und sammelnder Person sowie die Erklärung methodischer Ausnahmen.\n\nAlle sechs ursprünglichen Produktkriterien und der Nachweis der eigenen Arbeit sind erforderlich. 450–550 g gelten nur für diese Bewertungskarte, nicht für jedes Labor. Ein korrektes Endprodukt beweist nicht, wer es getrocknet hat.', 'Die Lehrkraft beobachtet jede lernende Person beim Auffinden von Augendusche, Notdusche, Ausgang, Feuerlöscher und vorgesehenem Entsorgungsweg; beim Lesen von Etikett und zutreffendem S D S; bei der Wahl chemikalien- und tätigkeitsgeeigneter Schutzausrüstung; und bei der Zuordnung von Becherglas, Messzylinder, Sieb, Mörser/Stößel, Waage, P H-Gerät und Kolorimeter.\n\nBestanden nur nach sicherer individueller Vorführung mit dokumentierter Beobachtung. Quiz, Gruppenleistung oder Gerätefoto genügen nicht. Unsicheres Handeln unterbricht diese Praxisstation bis zur Korrektur.\n\nDie Lehrkraft hält Probenkennung bei Annahme, Zustand vor der Trocknung, verlangte Methode, Beginn und Ende der von der lernenden Person ausgeführten Trocknung oder andere vorgeschriebene Behandlung, sauberes dünn belegtes Tablett ohne Sonne und Verunreinigung, vorsichtiges Lösen der Klumpen, gegebenenfalls Zwei-Millimeter-Sieb und durchgehende Kennzeichnung fest.\n\nBestanden nur, wenn die lernende Person jede erforderliche Phase selbst über die tatsächliche Zeit ausführt und die Lehrkraft sie erfasst. Eine schon trocken ausgegebene Probe erlaubt nur die Bewertung von Zerkleinern der Klumpen und Sieben, nicht des Trocknens.\n\nDie Lehrkraft prüft auf sichtbare Steine, Wurzeln und Blätter; für diese Aufgabe passenden trockenen, krümeligen Zustand; gleichmäßiges Siebgut; vierhundertfünfzig bis fünfhundertfünfzig Gramm; dichten Verschluss; lesbare und mit dem Feldprotokoll übereinstimmende Angaben zu Datum, Feldkennung, Tiefe und sammelnder Person sowie die Erklärung methodischer Ausnahmen.\n\nAlle sechs ursprünglichen Produktkriterien und der Nachweis der eigenen Arbeit sind erforderlich. vierhundertfünfzig bis fünfhundertfünfzig Gramm gelten nur für diese Bewertungskarte, nicht für jedes Labor. Ein korrektes Endprodukt beweist nicht, wer es getrocknet hat.'), ('Diese Beobachtungskarte umfasst neun Handlungen über die Probenvorbereitung und den späteren pH-Schritt. Hier werden Schutz, vorsichtiges Lösen der Aggregate und Sieben mit 2 mm bewertet. Die ausgegebene Probe ist bereits trocken; diese Aktivität weist deshalb nicht deine eigene Trocknungsleistung nach. Die Kartenangaben 20 g / 20 mL / 1 Minute / 15 Minuten sowie Kalibrierung und stabiler Messwert gehören zum späteren pH-Lernszenario nach dessen Protokoll.\n\nDie Lehrkraft prüft sechs ursprüngliche Produktkriterien: keine sichtbaren Rückstände, passend trocken-krümelig, nach Lösen und Sieben gleichmäßig, 450–550 g, dicht verschlossen sowie lesbares, zum Feldprotokoll passendes Datum, Feldkennung, Tiefe und Name. Individuelle Trocknung und Vorbereitung werden getrennt beobachtet, weil das Produkt den Prozess allein nicht beweist.', 'Diese Beobachtungskarte umfasst neun Handlungen über die Probenvorbereitung und den späteren P H-Schritt. Hier werden Schutz, vorsichtiges Lösen der Aggregate und Sieben mit zwei Millimeter bewertet. Die ausgegebene Probe ist bereits trocken; diese Aktivität weist deshalb nicht deine eigene Trocknungsleistung nach. Die Kartenangaben zwanzig Gramm / zwanzig Milliliter / eine Minute / fünfzehn Minuten sowie Kalibrierung und stabiler Messwert gehören zum späteren P H-Lernszenario nach dessen Protokoll.\n\nDie Lehrkraft prüft sechs ursprüngliche Produktkriterien: keine sichtbaren Rückstände, passend trocken-krümelig, nach Lösen und Sieben gleichmäßig, vierhundertfünfzig bis fünfhundertfünfzig Gramm, dicht verschlossen sowie lesbares, zum Feldprotokoll passendes Datum, Feldkennung, Tiefe und Name. Individuelle Trocknung und Vorbereitung werden getrennt beobachtet, weil das Produkt den Prozess allein nicht beweist.'), ('Dieses Produkt hat etwa 500 g als Ziel, zulässig sind 450–550 g. Masse allein erfüllt nicht alle sechs Kriterien.\n\nNur lokale Übungsnotizen, keine Unterschrift und kein echter Laborauftrag.\n\nProbenkennung / Feld\n\nEntnahmedatum\n\nEntnahmetiefe\n\nSammelnde Person\n\nAnalyse / Methode\n\nTrocknungsbeginn, falls nötig\n\nDatierte Beobachtungen / Zustand\n\nTatsächliches Ende / Zustand, falls beobachtet\n\nReinigung / Siebfraktion / Masse\n\nWas muss die Lehrkraft noch beobachten\n\nNur tatsächliche Nachweise verwenden. Lokale Eingaben und getippte Namen sind unsignierte Notizen, keine authentifizierten Entscheidungen oder Unterschriften der Lehrkraft. Produktprüfung belegt nicht, wer die Vorbereitung ausführte; Verfahren benötigen Einzelbeobachtung. Gerätespezifische Zeilen beziehen sich auf das dokumentierte Lehrbeispiel und erfordern passende tatsächliche Anleitung/SOP; andernfalls bleiben sie ungeprüft.\n\nDieses leere Protokoll belegt keine Beobachtung und kein Bestehen. Entscheidungen und tatsächliche Daten bleiben leer, bis die Lehrkraft die individuelle Anforderung wirklich beobachtet oder geprüft hat.\n\nArbeitsblatt Probenvorbereitung', 'Dieses Produkt hat etwa fünfhundert Gramm als Ziel, zulässig sind vierhundertfünfzig bis fünfhundertfünfzig Gramm. Masse allein erfüllt nicht alle sechs Kriterien.\n\nNur lokale Übungsnotizen, keine Unterschrift und kein echter Laborauftrag.\n\nProbenkennung / Feld\n\nEntnahmedatum\n\nEntnahmetiefe\n\nSammelnde Person\n\nAnalyse / Methode\n\nTrocknungsbeginn, falls nötig\n\nDatierte Beobachtungen / Zustand\n\nTatsächliches Ende / Zustand, falls beobachtet\n\nReinigung / Siebfraktion / Masse\n\nWas muss die Lehrkraft noch beobachten\n\nNur tatsächliche Nachweise verwenden. Lokale Eingaben und getippte Namen sind unsignierte Notizen, keine authentifizierten Entscheidungen oder Unterschriften der Lehrkraft. Produktprüfung belegt nicht, wer die Vorbereitung ausführte; Verfahren benötigen Einzelbeobachtung. Gerätespezifische Zeilen beziehen sich auf das dokumentierte Lehrbeispiel und erfordern passende tatsächliche Anleitung/S O P; andernfalls bleiben sie ungeprüft.\n\nDieses leere Protokoll belegt keine Beobachtung und kein Bestehen. Entscheidungen und tatsächliche Daten bleiben leer, bis die Lehrkraft die individuelle Anforderung wirklich beobachtet oder geprüft hat.\n\nArbeitsblatt Probenvorbereitung'), ('Zeige Ausgang, Augendusche, Notdusche, Feuerlöscher und Abfallbehälter am Standort; lege das relevante SDS vor und wähle vor dem Anfassen der Probe kompatiblen Schutz.\n\nDie Lehrkraft erfasst jede individuelle Vorführung und Korrektur.\n\nGleiche Etikett und Feldprotokoll ab; erfasse vollständige Kennung, Entnahmedatum, Ort, Tiefe und sammelnde Person.\n\nDie Lehrkraft bestätigt die Übereinstimmung der Kennung mit ihrer Unterschrift.\n\nBestätige die Analyse. Verlangt sie Trocknung, verteile eine dünne gekennzeichnete Schicht sauber und belüftet ohne direkte Sonne; dokumentiere Beginn, Kontrollen und tatsächliches Ende.\n\nDie Lehrkraft beobachtet Vorbereitung und Abschluss über mehrere Phasen; eine schon trockene Probe belegt diese Fertigkeit nicht.\n\nLöse trockene Klumpen vorsichtig ohne Steine zu zermahlen; nutze das verlangte Zwei-Millimeter-Sieb und behalte die gekennzeichnete Feinbodenfraktion.\n\nDie Lehrkraft beobachtet Gerätewahl, Reinigung und Materialtrennung.\n\nWiege und verschließe das Produkt der Bewertungskarte mit 450–550 g, prüfe das vollständige Etikett und erkläre eine Analyse, für die Trocknen ungeeignet wäre.\n\nDie Lehrkraft kontrolliert sämtliche Produktkriterien und dokumentiert die tatsächliche Leistung der lernenden Person.', 'Zeige Ausgang, Augendusche, Notdusche, Feuerlöscher und Abfallbehälter am Standort; lege das relevante S D S vor und wähle vor dem Anfassen der Probe kompatiblen Schutz.\n\nDie Lehrkraft erfasst jede individuelle Vorführung und Korrektur.\n\nGleiche Etikett und Feldprotokoll ab; erfasse vollständige Kennung, Entnahmedatum, Ort, Tiefe und sammelnde Person.\n\nDie Lehrkraft bestätigt die Übereinstimmung der Kennung mit ihrer Unterschrift.\n\nBestätige die Analyse. Verlangt sie Trocknung, verteile eine dünne gekennzeichnete Schicht sauber und belüftet ohne direkte Sonne; dokumentiere Beginn, Kontrollen und tatsächliches Ende.\n\nDie Lehrkraft beobachtet Vorbereitung und Abschluss über mehrere Phasen; eine schon trockene Probe belegt diese Fertigkeit nicht.\n\nLöse trockene Klumpen vorsichtig ohne Steine zu zermahlen; nutze das verlangte Zwei-Millimeter-Sieb und behalte die gekennzeichnete Feinbodenfraktion.\n\nDie Lehrkraft beobachtet Gerätewahl, Reinigung und Materialtrennung.\n\nWiege und verschließe das Produkt der Bewertungskarte mit vierhundertfünfzig bis fünfhundertfünfzig Gramm, prüfe das vollständige Etikett und erkläre eine Analyse, für die Trocknen ungeeignet wäre.\n\nDie Lehrkraft kontrolliert sämtliche Produktkriterien und dokumentiert die tatsächliche Leistung der lernenden Person.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s205-lab-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':4,'maximumBlindReviewPerLane':4,'maximumASRPerLane':4,'maximumTTSAggregate':16,'maximumBlindAggregate':16,'maximumASRAggregate':16,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
