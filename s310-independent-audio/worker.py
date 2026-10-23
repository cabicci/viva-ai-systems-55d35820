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
IDS = ('S3-10-ar-EG-opening-r1', 'S3-10-ar-EG-guided-practice-r1', 'S3-10-ar-EG-reflection-r1', 'S3-10-ar-EG-glossary-r1', 'S3-10-en-opening-r1', 'S3-10-en-guided-practice-r1', 'S3-10-en-reflection-r1', 'S3-10-en-glossary-r1', 'S3-10-it-opening-r1', 'S3-10-it-guided-practice-r1', 'S3-10-it-reflection-r1', 'S3-10-it-glossary-r1', 'S3-10-de-opening-r1', 'S3-10-de-guided-practice-r1', 'S3-10-de-reflection-r1', 'S3-10-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S310_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-10')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s310-independent-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening','guided-practice','reflection','glossary']
        voice='Charon'if group in ['opening','reflection']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('قائمة المحاصيل بداية احتمال مش قرار جاهز. افحص العينات الثلاث الحقيقية وسجّل اللي حسيته بإيدك، وبعدها راجع الصرف والعناصر وpH والماء والجو قبل ما ترشح محصول أو توعد بمكسب.\n\nافحص ثلاث عينات تربة حقيقية غير معنونة وبرطوبة مناسبة. اكتب إحساس الحبيبات والخشونة والنعومة واللزوجة وشكل الكرة والشريط قبل تخمين مجموعة القوام؛ وافصل القوام عن الصرف والخصوبة المقاسين.\n\nرشّح ثلاثة محاصيل مبررة لكل مجموعة رملية أو طينية أو لومية، ثم اعمل جدولًا منفصلًا لثلاثة تقارير تربة فيه محصولان مناسبَان بشروط ومحصول أقل ملاءمة لكل تقرير، مع تسمية البيانات المحلية الناقصة.\n\nاشرح إزاي مطابقة المحصول للتربة ممكن تساعد الجذور والماء والعناصر وتقلل بعض التكاليف أو المخاطر، واعرض بديلًا مبررًا من غير ضمان إنتاج أو ربح أو مناعة ضد المرض.', 'قائمة المحاصيل بداية احتمال مش قرار جاهز. افحص العينات الثلاث الحقيقية وسجّل اللي حسيته بإيدك، وبعدها راجع الصرف والعناصر وبي إتش والماء والجو قبل ما ترشح محصول أو توعد بمكسب.\n\nافحص ثلاث عينات تربة حقيقية غير معنونة وبرطوبة مناسبة. اكتب إحساس الحبيبات والخشونة والنعومة واللزوجة وشكل الكرة والشريط قبل تخمين مجموعة القوام؛ وافصل القوام عن الصرف والخصوبة المقاسين.\n\nرشّح ثلاثة محاصيل مبررة لكل مجموعة رملية أو طينية أو لومية، ثم اعمل جدولًا منفصلًا لثلاثة تقارير تربة فيه محصولان مناسبَان بشروط ومحصول أقل ملاءمة لكل تقرير، مع تسمية البيانات المحلية الناقصة.\n\nاشرح إزاي مطابقة المحصول للتربة ممكن تساعد الجذور والماء والعناصر وتقلل بعض التكاليف أو المخاطر، واعرض بديلًا مبررًا من غير ضمان إنتاج أو ربح أو مناعة ضد المرض.'), ('قدام المدرّب، افحص ثلاث عينات حقيقية غير معنونة في حوالي ٥ دقائق. اكتب ملاحظة الخشونة/النعومة والكرة والشريط قبل ما تقترح المجموعة، واذكر فحصًا لفئة أدق.\n\nفي حوالي ١٥ دقيقة ضع ثلاثة محاصيل مختلفة على الأقل تحت كل مجموعة رملية وطينية ولومية من قوائم الأصل، ولكل محصول سبب وشرط يحد الاختيار.\n\nفي حوالي ١٥ دقيقة انصح عميل الجزر في الطين المدكوك: مسار تحسين للتربة ومسار محصول بديل منفصل، واشرح أثر كل مسار على الجذور والميه، وتكلفته، والفحوص اللي محتاجها.\n\nاقضِ حوالي ١٠ دقائق تشرح أحد المسارين لزميل، ثم جاوب سؤال الخروج الأصلي عن محصول واحد للرمل وتدخل واحد وقل ليه ده أضيق من النشاط كله. اختياري: ميزانية لحوض ١٠ × ١٠ قدم بأسعار محلية مفترضة ومعلنة.\n\nالمدرّب يقارن ملاحظات كل طالب بالعينات الفعلية؛ ما تكشفش الأسماء أو تمنح اجتيازًا تلقائيًا.\n\nده تدريب على التخطيط. النماذج على الشاشة ما بتحددش هوية عيناتك الحقيقية النهارده، وما تثبتش إتقان الفحص باللمس. الملاحظات الفعلية وتوقيع المدرّب لسه مش متسجلين.', 'قدام المدرّب، افحص ثلاث عينات حقيقية غير معنونة في حوالي خمس دقايق. اكتب ملاحظة الخشونة، النعومة والكرة والشريط قبل ما تقترح المجموعة، واذكر فحصًا لفئة أدق.\n\nفي حوالي خمستاشر دقيقة ضع ثلاثة محاصيل مختلفة على الأقل تحت كل مجموعة رملية وطينية ولومية من قوائم الأصل، ولكل محصول سبب وشرط يحد الاختيار.\n\nفي حوالي خمستاشر دقيقة انصح عميل الجزر في الطين المدكوك: مسار تحسين للتربة ومسار محصول بديل منفصل، واشرح أثر كل مسار على الجذور والميه، وتكلفته، والفحوص اللي محتاجها.\n\nاقضِ حوالي عشر دقايق تشرح أحد المسارين لزميل، ثم جاوب سؤال الخروج الأصلي عن محصول واحد للرمل وتدخل واحد وقل ليه ده أضيق من النشاط كله. اختياري: ميزانية لحوض عشرة مضروب في عشرة قدم بأسعار محلية مفترضة ومعلنة.\n\nالمدرّب يقارن ملاحظات كل طالب بالعينات الفعلية؛ ما تكشفش الأسماء أو تمنح اجتيازًا تلقائيًا.\n\nده تدريب على التخطيط. النماذج على الشاشة ما بتحددش هوية عيناتك الحقيقية النهارده، وما تثبتش إتقان الفحص باللمس. الملاحظات الفعلية وتوقيع المدرّب لسه مش متسجلين.'), ('قوام التربة\n\nنِسَب الرمل والسلت والطين في الجزء المعدني الدقيق من التربة.\n\nرمل\n\nأكبر الكسور الثلاثة المذكورة من الحبيبات الدقيقة؛ الإحساس بخشونته مجرد علامة حقلية.\n\nسلت\n\nحبيبات معدنية متوسطة الحجم قد تحسها ناعمة كالدقيق وهي جافة؛ مش مرادف لطين مبلول.\n\nطين\n\nأدق الكسور المعدنية المذكورة؛ العينة الغنية به ممكن تلزق وتعمل شريطًا لو رطوبتها مناسبة.\n\nلوم\n\nفئة قوام USDA بنسب محددة من الرمل والسلت والطين، مش مرادف أرض خصبة.\n\nاختبار الشريط\n\nعلامة قوام حقلية من طول وسلوك شريط تربة رطب؛ تحتاج باقي ملمس التربة وقد يلزم تأكيد معملي.\n\nدمك\n\nزيادة كثافة بناء التربة بشكل ممكن يعوق حركة الجذور والهواء والميه، حتى لو نسب أحجام الحبيبات مناسبة.\n\nصرف\n\nحركة وخروج الماء الزائد من منطقة الجذور؛ اسم القوام مش قياس مباشر له.\n\nاحتفاظ بالعناصر\n\nقدرة التربة على مسك أيونات العناصر، مختلفة عن الكمية المتاحة للمحصول حاليًا.\n\nدرنة البطاطس\n\nساق أرضية متضخمة لتخزين الغذاء في البطاطس.\n\nجذر البطاطا التخزيني\n\nجذر متضخم لتخزين الغذاء في البطاطا، ومختلف نباتيًا عن درنة ساق البطاطس.\n\nملاءمة المحصول\n\nتوافق مبرر بين محصول وظروف موقع مقاسة وموسم وإدارة، مش القوام وحده.', 'قوام التربة\n\nنِسَب الرمل والسلت والطين في الجزء المعدني الدقيق من التربة.\n\nرمل\n\nأكبر الكسور الثلاثة المذكورة من الحبيبات الدقيقة؛ الإحساس بخشونته مجرد علامة حقلية.\n\nسلت\n\nحبيبات معدنية متوسطة الحجم قد تحسها ناعمة كالدقيق وهي جافة؛ مش مرادف لطين مبلول.\n\nطين\n\nأدق الكسور المعدنية المذكورة؛ العينة الغنية به ممكن تلزق وتعمل شريطًا لو رطوبتها مناسبة.\n\nلوم\n\nفئة قوام وزارة الزراعة الأمريكية بنسب محددة من الرمل والسلت والطين، مش مرادف أرض خصبة.\n\nاختبار الشريط\n\nعلامة قوام حقلية من طول وسلوك شريط تربة رطب؛ تحتاج باقي ملمس التربة وقد يلزم تأكيد معملي.\n\nدمك\n\nزيادة كثافة بناء التربة بشكل ممكن يعوق حركة الجذور والهواء والميه، حتى لو نسب أحجام الحبيبات مناسبة.\n\nصرف\n\nحركة وخروج الماء الزائد من منطقة الجذور؛ اسم القوام مش قياس مباشر له.\n\nاحتفاظ بالعناصر\n\nقدرة التربة على مسك أيونات العناصر، مختلفة عن الكمية المتاحة للمحصول حاليًا.\n\nدرنة البطاطس\n\nساق أرضية متضخمة لتخزين الغذاء في البطاطس.\n\nجذر البطاطا التخزيني\n\nجذر متضخم لتخزين الغذاء في البطاطا، ومختلف نباتيًا عن درنة ساق البطاطس.\n\nملاءمة المحصول\n\nتوافق مبرر بين محصول وظروف موقع مقاسة وموسم وإدارة، مش القوام وحده.')], 'en': [('A crop list is a starting hypothesis. Examine the three real samples, record what you observed, then check drainage, fertility, pH, water and climate before recommending a crop or claiming an economic benefit.\n\nExamine three unlabelled, suitably moistened real soil samples; record gritty/sticky/smooth feel, shape and ribbon evidence before a tentative texture-group identification, and separate texture from measured drainage and fertility.\n\nGive three justified crop candidates for each of sandy, clay and loamy samples, then make a separate two-suitable/one-risky-crop chart for each of three soil reports, naming the missing local evidence.\n\nExplain how a better crop/soil match may support roots, water and nutrient uptake and reduce some costs or risks, while using a reasoned alternative and avoiding guaranteed yield, profit or disease immunity.', 'A crop list is a starting hypothesis. Examine the three real samples, record what you observed, then check drainage, fertility, p H, water and climate before recommending a crop or claiming an economic benefit.\n\nExamine three unlabelled, suitably moistened real soil samples; record gritty, sticky, smooth feel, shape and ribbon evidence before a tentative texture-group identification, and separate texture from measured drainage and fertility.\n\nGive three justified crop candidates for each of sandy, clay and loamy samples, then make a separate two-suitable, one-risky-crop chart for each of three soil reports, naming the missing local evidence.\n\nExplain how a better crop, soil match may support roots, water and nutrient uptake and reduce some costs or risks, while using a reasoned alternative and avoiding guaranteed yield, profit or disease immunity.'), ("Under a trainer, inspect three real unlabelled samples in about 5 minutes. Write each sample's feel/ball/ribbon observations before proposing a sandy, clay or loamy group; name a test for a more precise class.\n\nIn about 15 minutes put at least three distinct source-list crops under each of sandy, clay and loamy groups, one reason and one limiting condition for each.\n\nIn about 15 minutes advise the compacted-clay carrot client with one management path and a separate alternative-crop path; explain root, water, cost and test needs.\n\nSpend about 10 minutes explaining one client path to a partner; then complete the original sandy-soil one-crop/one-action exit ticket and state why it is narrower than the full challenge. Optional: budget a 10 × 10 foot bed with explicit local prices.\n\nThe trainer compares the learner's individual observations with the actual samples; do not pre-reveal labels or auto-pass.\n\nThis is a planning rehearsal. Screen models do not identify today's real samples or certify tactile skill. Real observation and the trainer's signature remain unrecorded.", "Under a trainer, inspect three real unlabelled samples in about five minutes. Write each sample's feel, ball, ribbon observations before proposing a sandy, clay or loamy group; name a test for a more precise class.\n\nIn about fifteen minutes put at least three distinct source-list crops under each of sandy, clay and loamy groups, one reason and one limiting condition for each.\n\nIn about fifteen minutes advise the compacted-clay carrot client with one management path and a separate alternative-crop path; explain root, water, cost and test needs.\n\nSpend about ten minutes explaining one client path to a partner; then complete the original sandy-soil one-crop, one-action exit ticket and state why it is narrower than the full challenge. Optional: budget a ten multiplied by ten foot bed with explicit local prices.\n\nThe trainer compares the learner's individual observations with the actual samples; do not pre-reveal labels or auto-pass.\n\nThis is a planning rehearsal. Screen models do not identify today's real samples or certify tactile skill. Real observation and the trainer's signature remain unrecorded."), ('soil texture\n\nThe relative percentages of sand, silt and clay in the fine-earth mineral fraction.\n\nsand\n\nThe coarser of the three named fine-earth particle-size fractions; a sandy feel alone is only a field clue.\n\nsilt\n\nThe intermediate-size mineral fraction, often smooth/flour-like when dry, not a synonym for wet mud.\n\nclay\n\nThe finest named mineral fraction; clay-rich field material often feels sticky and ribbons when suitably moist.\n\nloam\n\nA USDA texture class with a particular range of sand, silt and clay proportions, not a synonym for fertile soil.\n\nribbon test\n\nA field texture clue based on the length and behaviour of a moist soil ribbon; it needs other feel clues and may need laboratory confirmation.\n\ncompaction\n\nDense soil structure that can impede roots, air and water movement even when the particle texture is suitable.\n\ndrainage\n\nMovement and removal of excess water through and away from the root zone; texture is not a direct measurement of it.\n\nnutrient retention\n\nCapacity to hold nutrient ions, distinct from the measured amount currently available to a crop.\n\npotato tuber\n\nAn enlarged underground stem used for potato storage.\n\nsweet-potato storage root\n\nAn enlarged root used for sweet-potato storage, botanically different from a potato stem tuber.\n\ncrop suitability\n\nA reasoned fit between a crop and measured site conditions, season and management rather than texture alone.', 'soil texture\n\nThe relative percentages of sand, silt and clay in the fine-earth mineral fraction.\n\nsand\n\nThe coarser of the three named fine-earth particle-size fractions; a sandy feel alone is only a field clue.\n\nsilt\n\nThe intermediate-size mineral fraction, often smooth, flour-like when dry, not a synonym for wet mud.\n\nclay\n\nThe finest named mineral fraction; clay-rich field material often feels sticky and ribbons when suitably moist.\n\nloam\n\nA U S D A texture class with a particular range of sand, silt and clay proportions, not a synonym for fertile soil.\n\nribbon test\n\nA field texture clue based on the length and behaviour of a moist soil ribbon; it needs other feel clues and may need laboratory confirmation.\n\ncompaction\n\nDense soil structure that can impede roots, air and water movement even when the particle texture is suitable.\n\ndrainage\n\nMovement and removal of excess water through and away from the root zone; texture is not a direct measurement of it.\n\nnutrient retention\n\nCapacity to hold nutrient ions, distinct from the measured amount currently available to a crop.\n\npotato tuber\n\nAn enlarged underground stem used for potato storage.\n\nsweet-potato storage root\n\nAn enlarged root used for sweet-potato storage, botanically different from a potato stem tuber.\n\ncrop suitability\n\nA reasoned fit between a crop and measured site conditions, season and management rather than texture alone.')], 'it': [('Sotto la guida del formatore, esamina tre campioni reali non etichettati in circa 5 minuti. Annota tatto, pallina e nastro prima di proporre il gruppo sabbioso, argilloso o franco; indica una prova per la classe precisa.\n\nIn circa 15 minuti assegna almeno tre colture diverse della fonte a ciascun gruppo sabbioso, argilloso e franco, con un motivo e una condizione limitante per ognuna.\n\nIn circa 15 minuti consiglia al cliente che vuole carote in argilla compattata una via di gestione e una distinta coltura alternativa; spiega radici, acqua, costi e prove necessarie.\n\nDedica circa 10 minuti a spiegare al compagno una via, poi rispondi alla domanda finale originale su una coltura da sabbia e un intervento spiegando perché è più ristretta della sfida. Facoltativo: bilancio di un’aiuola di 10 × 10 piedi con prezzi locali dichiarati.\n\nIl formatore confronta osservazioni individuali e campioni effettivi; non svelare le etichette né approvare automaticamente.\n\nQuesta è un’esercitazione di pianificazione. I modelli sullo schermo non identificano i campioni reali di oggi e non certificano l’abilità tattile. Le osservazioni reali e la firma del formatore non sono ancora registrate.', 'Sotto la guida del formatore, esamina tre campioni reali non etichettati in circa cinque minuti. Annota tatto, pallina e nastro prima di proporre il gruppo sabbioso, argilloso o franco; indica una prova per la classe precisa.\n\nIn circa quindici minuti assegna almeno tre colture diverse della fonte a ciascun gruppo sabbioso, argilloso e franco, con un motivo e una condizione limitante per ognuna.\n\nIn circa quindici minuti consiglia al cliente che vuole carote in argilla compattata una via di gestione e una distinta coltura alternativa; spiega radici, acqua, costi e prove necessarie.\n\nDedica circa dieci minuti a spiegare al compagno una via, poi rispondi alla domanda finale originale su una coltura da sabbia e un intervento spiegando perché è più ristretta della sfida. Facoltativo: bilancio di un’aiuola di dieci moltiplicato per dieci piedi con prezzi locali dichiarati.\n\nIl formatore confronta osservazioni individuali e campioni effettivi; non svelare le etichette né approvare automaticamente.\n\nQuesta è un’esercitazione di pianificazione. I modelli sullo schermo non identificano i campioni reali di oggi e non certificano l’abilità tattile. Le osservazioni reali e la firma del formatore non sono ancora registrate.'), ('Un elenco di colture è solo un’ipotesi iniziale. Esamina i tre campioni reali e annota ciò che osservi; verifica poi drenaggio, fertilità, pH, acqua e clima prima di consigliare una coltura o promettere un vantaggio economico.\n\nEsaminare tre campioni di suolo reali, non etichettati e opportunamente umidi; annotare granulosità, adesività, liscezza, forma e nastro prima di una classificazione provvisoria e separare la tessitura dal drenaggio e dalla fertilità misurati.\n\nMotivare tre colture candidate per ciascuno dei gruppi sabbioso, argilloso e franco; creare poi una tabella separata per tre rapporti, con due colture condizionatamente adatte e una a rischio per ciascuno e con le verifiche locali mancanti.\n\nSpiegare come un miglior abbinamento possa aiutare radici, acqua e nutrienti e ridurre alcuni costi o rischi, proponendo un’alternativa motivata senza garantire resa, profitto o immunità dalle malattie.', 'Un elenco di colture è solo un’ipotesi iniziale. Esamina i tre campioni reali e annota ciò che osservi; verifica poi drenaggio, fertilità, pi acca, acqua e clima prima di consigliare una coltura o promettere un vantaggio economico.\n\nEsaminare tre campioni di suolo reali, non etichettati e opportunamente umidi; annotare granulosità, adesività, liscezza, forma e nastro prima di una classificazione provvisoria e separare la tessitura dal drenaggio e dalla fertilità misurati.\n\nMotivare tre colture candidate per ciascuno dei gruppi sabbioso, argilloso e franco; creare poi una tabella separata per tre rapporti, con due colture condizionatamente adatte e una a rischio per ciascuno e con le verifiche locali mancanti.\n\nSpiegare come un miglior abbinamento possa aiutare radici, acqua e nutrienti e ridurre alcuni costi o rischi, proponendo un’alternativa motivata senza garantire resa, profitto o immunità dalle malattie.'), ('tessitura del suolo\n\nPercentuali relative di sabbia, limo e argilla nella terra fine minerale.\n\nsabbia\n\nFrazione più grossolana delle tre particelle minerali nominate; la sensazione granulosa è solo un indizio.\n\nlimo\n\nFrazione minerale intermedia, spesso liscia o farinosa da asciutta, non sinonimo di fango.\n\nargilla\n\nFrazione minerale più fine; un materiale ricco di argilla può essere adesivo e fare un nastro se umido correttamente.\n\nfranco\n\nClasse tessiturale USDA entro particolari proporzioni di sabbia, limo e argilla, non sinonimo di suolo fertile.\n\nprova del nastro\n\nIndizio di tessitura da lunghezza e comportamento di un nastro di suolo umido, da unire ad altri e talvolta a conferma di laboratorio.\n\ncompattazione\n\nStruttura densa che può ostacolare radici, aria e acqua anche con tessitura adatta.\n\ndrenaggio\n\nMovimento e rimozione dell’acqua in eccesso dalla zona radicale; la tessitura non ne è una misura diretta.\n\nritenzione di nutrienti\n\nCapacità di trattenere ioni nutritivi, distinta dalla quantità disponibile oggi per la coltura.\n\ntubero di patata\n\nFusto sotterraneo ingrossato che conserva riserve nella patata.\n\nradice di riserva della patata dolce\n\nRadice ingrossata che conserva riserve, botanicamente diversa dal tubero di fusto della patata.\n\nidoneità colturale\n\nCorrispondenza motivata fra coltura e condizioni misurate, stagione e gestione, non sola tessitura.', 'tessitura del suolo\n\nPercentuali relative di sabbia, limo e argilla nella terra fine minerale.\n\nsabbia\n\nFrazione più grossolana delle tre particelle minerali nominate; la sensazione granulosa è solo un indizio.\n\nlimo\n\nFrazione minerale intermedia, spesso liscia o farinosa da asciutta, non sinonimo di fango.\n\nargilla\n\nFrazione minerale più fine; un materiale ricco di argilla può essere adesivo e fare un nastro se umido correttamente.\n\nfranco\n\nClasse tessiturale u esse di a entro particolari proporzioni di sabbia, limo e argilla, non sinonimo di suolo fertile.\n\nprova del nastro\n\nIndizio di tessitura da lunghezza e comportamento di un nastro di suolo umido, da unire ad altri e talvolta a conferma di laboratorio.\n\ncompattazione\n\nStruttura densa che può ostacolare radici, aria e acqua anche con tessitura adatta.\n\ndrenaggio\n\nMovimento e rimozione dell’acqua in eccesso dalla zona radicale; la tessitura non ne è una misura diretta.\n\nritenzione di nutrienti\n\nCapacità di trattenere ioni nutritivi, distinta dalla quantità disponibile oggi per la coltura.\n\ntubero di patata\n\nFusto sotterraneo ingrossato che conserva riserve nella patata.\n\nradice di riserva della patata dolce\n\nRadice ingrossata che conserva riserve, botanicamente diversa dal tubero di fusto della patata.\n\nidoneità colturale\n\nCorrispondenza motivata fra coltura e condizioni misurate, stagione e gestione, non sola tessitura.')], 'de': [('Bodentextur\n\nRelative Anteile von Sand, Schluff und Ton in der mineralischen Feinerde.\n\nSand\n\nGröbere der drei Feinboden-Korngrößenfraktionen; ein körniges Gefühl ist nur ein Feldhinweis.\n\nSchluff\n\nMittlere Mineralfraktion, trocken oft glatt oder mehlig, kein Synonym für nassen Schlamm.\n\nTon\n\nFeinste genannte Mineralfraktion; tonreiches Material kann bei passender Feuchte kleben und Bändchen bilden.\n\nLehm\n\nUSDA-Texturklasse mit bestimmten Anteilen von Sand, Schluff und Ton, kein Synonym für fruchtbaren Boden.\n\nBändchenprobe\n\nFeldhinweis aus Länge und Verhalten eines feuchten Bodenbändchens; weitere Hinweise und gegebenenfalls Labor nötig.\n\nVerdichtung\n\nDichte Bodenstruktur, die Wurzeln, Luft und Wasser auch bei geeigneter Textur behindern kann.\n\nEntwässerung\n\nBewegung und Ableitung überschüssigen Wassers aus dem Wurzelraum; Textur misst sie nicht unmittelbar.\n\nNährstoffbindung\n\nFähigkeit Nährstoffionen festzuhalten, verschieden von der aktuell verfügbaren Menge.\n\nKartoffelknolle\n\nVerdickter unterirdischer Spross, der Vorräte in der Kartoffel speichert.\n\nSpeicherwurzel der Süßkartoffel\n\nVerdickte Wurzel mit Vorräten, botanisch anders als die Sprossknolle der Kartoffel.\n\nKultureignung\n\nBegründete Übereinstimmung von Kultur, gemessenem Standort, Saison und Management statt Textur allein.', 'Bodentextur\n\nRelative Anteile von Sand, Schluff und Ton in der mineralischen Feinerde.\n\nSand\n\nGröbere der drei Feinboden-Korngrößenfraktionen; ein körniges Gefühl ist nur ein Feldhinweis.\n\nSchluff\n\nMittlere Mineralfraktion, trocken oft glatt oder mehlig, kein Synonym für nassen Schlamm.\n\nTon\n\nFeinste genannte Mineralfraktion; tonreiches Material kann bei passender Feuchte kleben und Bändchen bilden.\n\nLehm\n\nU Es De A-Texturklasse mit bestimmten Anteilen von Sand, Schluff und Ton, kein Synonym für fruchtbaren Boden.\n\nBändchenprobe\n\nFeldhinweis aus Länge und Verhalten eines feuchten Bodenbändchens; weitere Hinweise und gegebenenfalls Labor nötig.\n\nVerdichtung\n\nDichte Bodenstruktur, die Wurzeln, Luft und Wasser auch bei geeigneter Textur behindern kann.\n\nEntwässerung\n\nBewegung und Ableitung überschüssigen Wassers aus dem Wurzelraum; Textur misst sie nicht unmittelbar.\n\nNährstoffbindung\n\nFähigkeit Nährstoffionen festzuhalten, verschieden von der aktuell verfügbaren Menge.\n\nKartoffelknolle\n\nVerdickter unterirdischer Spross, der Vorräte in der Kartoffel speichert.\n\nSpeicherwurzel der Süßkartoffel\n\nVerdickte Wurzel mit Vorräten, botanisch anders als die Sprossknolle der Kartoffel.\n\nKultureignung\n\nBegründete Übereinstimmung von Kultur, gemessenem Standort, Saison und Management statt Textur allein.'), ('Eine Kulturliste ist nur eine erste Hypothese. Untersuche drei echte Proben und halte deine Beobachtungen fest. Prüfe danach Entwässerung, Nährstoffe, pH, Wasser und Klima, bevor du eine Kultur empfiehlst oder einen wirtschaftlichen Vorteil behauptest.\n\nDrei echte unbeschriftete und passend angefeuchtete Bodenproben untersuchen; körniges, klebriges oder glattes Gefühl sowie Form- und Bändchenbefunde vor einer vorläufigen Texturgruppe aufschreiben und Textur von gemessener Entwässerung und Fruchtbarkeit trennen.\n\nJe drei begründete Kulturkandidaten für sandige, tonreiche und lehmige Proben nennen und eine getrennte Tabelle zu drei Bodenberichten erstellen: je zwei bedingt geeignete und eine riskante Kultur mit fehlenden örtlichen Daten.\n\nErklären, wie ein besserer Boden-Kultur-Abgleich Wurzeln, Wasser- und Nährstoffaufnahme fördern und manche Kosten oder Risiken senken kann; eine begründete Alternative nennen, ohne Ertrag, Gewinn oder Krankheitsfreiheit zu garantieren.', 'Eine Kulturliste ist nur eine erste Hypothese. Untersuche drei echte Proben und halte deine Beobachtungen fest. Prüfe danach Entwässerung, Nährstoffe, Pe Ha, Wasser und Klima, bevor du eine Kultur empfiehlst oder einen wirtschaftlichen Vorteil behauptest.\n\nDrei echte unbeschriftete und passend angefeuchtete Bodenproben untersuchen; körniges, klebriges oder glattes Gefühl sowie Form- und Bändchenbefunde vor einer vorläufigen Texturgruppe aufschreiben und Textur von gemessener Entwässerung und Fruchtbarkeit trennen.\n\nJe drei begründete Kulturkandidaten für sandige, tonreiche und lehmige Proben nennen und eine getrennte Tabelle zu drei Bodenberichten erstellen: je zwei bedingt geeignete und eine riskante Kultur mit fehlenden örtlichen Daten.\n\nErklären, wie ein besserer Boden-Kultur-Abgleich Wurzeln, Wasser- und Nährstoffaufnahme fördern und manche Kosten oder Risiken senken kann; eine begründete Alternative nennen, ohne Ertrag, Gewinn oder Krankheitsfreiheit zu garantieren.'), ('Untersuche unter Aufsicht etwa 5 Minuten drei echte unbeschriftete Proben. Schreibe Gefühl, Ball- und Bändchenbeobachtung vor einer vorläufigen sandigen, tonreichen oder lehmigen Gruppe auf und nenne einen Test für eine genauere Klasse.\n\nOrdne in etwa 15 Minuten mindestens drei verschiedene Quellkulturen jeder der Gruppen Sand, Ton und Lehm zu und gib für jede einen Grund und eine einschränkende Bedingung an.\n\nBerate in etwa 15 Minuten den Karottenkunden auf verdichtetem Ton mit einem Bodenverbesserungsweg und einer getrennten Kultur-Alternative; begründe Wurzeln, Wasser, Kosten und Prüfungen.\n\nErkläre einem Partner in etwa 10 Minuten einen Weg und beantworte die Quell-Abschlussfrage zu einer Sandkultur und einer Maßnahme; sage, warum sie enger ist als die volle Aufgabe. Wahlweise ein Budget für 10 × 10 Fuß mit ausdrücklich angenommenen örtlichen Preisen.\n\nDie Lehrkraft vergleicht individuelle Beobachtungen mit den echten Proben; keine vorzeitigen Etiketten oder automatische Freigabe.\n\nDies ist eine Planungsübung. Bildschirmmodelle bestimmen weder die Identität der heutigen echten Proben noch bestätigen sie praktische Tastfähigkeiten. Reale Beobachtungen und die Unterschrift der Lehrkraft sind noch nicht dokumentiert.', 'Untersuche unter Aufsicht etwa fünf Minuten drei echte unbeschriftete Proben. Schreibe Gefühl, Ball- und Bändchenbeobachtung vor einer vorläufigen sandigen, tonreichen oder lehmigen Gruppe auf und nenne einen Test für eine genauere Klasse.\n\nOrdne in etwa fünfzehn Minuten mindestens drei verschiedene Quellkulturen jeder der Gruppen Sand, Ton und Lehm zu und gib für jede einen Grund und eine einschränkende Bedingung an.\n\nBerate in etwa fünfzehn Minuten den Karottenkunden auf verdichtetem Ton mit einem Bodenverbesserungsweg und einer getrennten Kultur-Alternative; begründe Wurzeln, Wasser, Kosten und Prüfungen.\n\nErkläre einem Partner in etwa zehn Minuten einen Weg und beantworte die Quell-Abschlussfrage zu einer Sandkultur und einer Maßnahme; sage, warum sie enger ist als die volle Aufgabe. Wahlweise ein Budget für zehn mal zehn Fuß mit ausdrücklich angenommenen örtlichen Preisen.\n\nDie Lehrkraft vergleicht individuelle Beobachtungen mit den echten Proben; keine vorzeitigen Etiketten oder automatische Freigabe.\n\nDies ist eine Planungsübung. Bildschirmmodelle bestimmen weder die Identität der heutigen echten Proben noch bestätigen sie praktische Tastfähigkeiten. Reale Beobachtungen und die Unterschrift der Lehrkraft sind noch nicht dokumentiert.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s310-independent-audio-20261023-r1'
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
