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
IDS = ('S2-06-ar-EG-supervised-stages-r1', 'S2-06-ar-EG-practical-completion-r1', 'S2-06-ar-EG-card-scope-r1', 'S2-06-ar-EG-record-and-method-guidance-r1', 'S2-06-en-supervised-stages-r1', 'S2-06-en-practical-completion-r1', 'S2-06-en-card-scope-r1', 'S2-06-en-record-and-method-guidance-r1', 'S2-06-it-supervised-stages-r1', 'S2-06-it-practical-completion-r1', 'S2-06-it-card-scope-r1', 'S2-06-it-record-and-method-guidance-r1', 'S2-06-de-supervised-stages-r1', 'S2-06-de-practical-completion-r1', 'S2-06-de-card-scope-r1', 'S2-06-de-record-and-method-guidance-r1')
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
    assert(req['scope'],req['stepId'])==('S206_SIXTEEN_SUPERVISED_METHOD_RECORD_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-06')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_4_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s206-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==16
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTargetCompleteIdentitiesCheckedAgainstPriorRequests']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(4))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['supervised-stages','practical-completion','card-scope','record-and-method-guidance']
        voice='Charon'if group in['practical-completion','record-and-method-guidance']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'supervised-stages':('/methodPractice/method/role','/methodPractice/method/product','/methodPractice/method/manualScope','/methodPractice/method/fieldGate','/methodPractice/ui/steps/'),'practical-completion':('/methodPractice/passChecks/',),'card-scope':('/methodPractice/cards/','/methodPractice/guidedPhysical'),'record-and-method-guidance':('/methodPractice/ui/modelHelp','/methodPractice/ui/recordHelp','/methodPractice/ui/fields/','/finalCardRecords/localOnly','/finalCardRecords/controls/boundary','/studentDownloads/0/title')}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الرسم بيوضح التسلسل، مش جهاز Rapitest معاير ولا جدول pH ينفع تقرأ منه. اللون هنا مش نتيجة قياس. اختيار مرحلة متأخرة مش إتمام انتظار حقيقي.\n\nاستخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nرمز العينة والحقل\n\nتاريخ الاختبار / الطالب اللي اختبر\n\nالعدة ودليلها والجدول المطابق\n\nالقيمة اللي اتشافت أو المجال اللي الجدول يدعمه\n\nدقة الجدول / عدم التأكد\n\nمدة انتظار ظهور اللون الفعلية / الملاحظة\n\nاحتمال متعلق بالعناصر وفحص بديل\n\nفحص تالي حسب المحصول، من غير جرعة متخمنة\n\nاستخدم دليل حقيقي بس. المدخلات المحلية والأسماء المكتوبة ملاحظات من غير توقيع، مش قرارات أو توقيعات مدرّب موثّقة. مراجعة المنتج ما تثبتش مين نفّذ التحضير؛ الفعل العملي محتاج ملاحظة لكل فرد. بنود الكيت بتخص المثال التعليمي الموثّق، ولازم يتوفر الدليل أو إجراء التشغيل القياسي (SOP) المطابق للجهاز المستخدم فعلاً؛ غير كده سيبها غير مقيّمة.\n\nالسجل الفاضي ده مش ملاحظة ولا اجتياز. سيب القرارات والبيانات الفعلية فاضية لحد ما المدرّب يشوف أو يراجع البند الفردي فعلًا.\n\nورقة تدريب عِدة pH اللونية', 'الرسم بيوضح التسلسل، مش جهاز Rapitest معاير ولا جدول بي إتش ينفع تقرأ منه. اللون هنا مش نتيجة قياس. اختيار مرحلة متأخرة مش إتمام انتظار حقيقي.\n\nاستخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nرمز العينة والحقل\n\nتاريخ الاختبار / الطالب اللي اختبر\n\nالعدة ودليلها والجدول المطابق\n\nالقيمة اللي اتشافت أو المجال اللي الجدول يدعمه\n\nدقة الجدول / عدم التأكد\n\nمدة انتظار ظهور اللون الفعلية / الملاحظة\n\nاحتمال متعلق بالعناصر وفحص بديل\n\nفحص تالي حسب المحصول، من غير جرعة متخمنة\n\nاستخدم دليل حقيقي بس. المدخلات المحلية والأسماء المكتوبة ملاحظات من غير توقيع، مش قرارات أو توقيعات مدرّب موثّقة. مراجعة المنتج ما تثبتش مين نفّذ التحضير؛ الفعل العملي محتاج ملاحظة لكل فرد. بنود الكيت بتخص المثال التعليمي الموثّق، ولازم يتوفر الدليل أو إجراء التشغيل القياسي (إس أو بي) المطابق للجهاز المستخدم فعلاً؛ غير كده سيبها غير مقيّمة.\n\nالسجل الفاضي ده مش ملاحظة ولا اجتياز. سيب القرارات والبيانات الفعلية فاضية لحد ما المدرّب يشوف أو يراجع البند الفردي فعلًا.\n\nورقة تدريب عِدة بي إتش اللونية'), ('الفحوص التمانية هي كمية التربة والكاشف والماء، والرجّ بعد الإغلاق للوقت المحدد بالعدة الفعلية، والترسيب وظهور اللون، والمقارنة بالجدول المطابق، وتسجيل النتيجة، وتنظيف الأداة والسطح. سجّل كمان فحص الوقاية ونشرة السلامة وهوية الجدول وعدم اليقين. استخدم قيم الشركة الفعلية، وما تخترعش أرقام.\n\nاحتفظ بمعايير بطاقة النهاية للوقاية والتربة والكاشف والماء الصحيحين والخلط وظهور اللون حسب الشركة وقراءة الجدول والتنظيف والتخلص من المخلفات. لا يجتاز إلا طالب ينفذ بنفسه تحت ملاحظة المدرّب وبطريقة العدة الفعلية.\n\nالمدرّب يختار العدة الفعلية ويتأكد من دليلها ونشرة كاشفها، ويقيس A/B/C بنفسه قبل التدريب. كل طالب يقيس تحت ملاحظة فردية ويسجل النتيجة الحقيقية وعدم اليقين وينظف ويتخلص من المخلفات بأمان. أدوار الكاتب والمحلل تتبدل، لكن قياس طالب ما ينجّحش طالب تاني.', 'الفحوص التمانية هي كمية التربة والكاشف والماء، والرجّ بعد الإغلاق للوقت المحدد بالعدة الفعلية، والترسيب وظهور اللون، والمقارنة بالجدول المطابق، وتسجيل النتيجة، وتنظيف الأداة والسطح. سجّل كمان فحص الوقاية ونشرة السلامة وهوية الجدول وعدم اليقين. استخدم قيم الشركة الفعلية، وما تخترعش أرقام.\n\nاحتفظ بمعايير بطاقة النهاية للوقاية والتربة والكاشف والماء الصحيحين والخلط وظهور اللون حسب الشركة وقراءة الجدول والتنظيف والتخلص من المخلفات. لا يجتاز إلا طالب ينفذ بنفسه تحت ملاحظة المدرّب وبطريقة العدة الفعلية.\n\nالمدرّب يختار العدة الفعلية ويتأكد من دليلها ونشرة كاشفها، ويقيس إيه/بي/سي بنفسه قبل التدريب. كل طالب يقيس تحت ملاحظة فردية ويسجل النتيجة الحقيقية وعدم اليقين وينظف ويتخلص من المخلفات بأمان. أدوار الكاتب والمحلل تتبدل، لكن قياس طالب ما ينجّحش طالب تاني.'), ('المدرّب يسجل العدة الفعلية ودليلها، ويشوف كل طالب وهو يحط كمية العينة الصحيحة والكمية المحددة من كاشف pH المطابق وماء العلامة المحددة، ويقفل ويخلط ويستنى وقت ظهور اللون الحقيقي؛ ما يستبدلش وقت أو كمية من عدة مختلفة.\n\nالاجتياز بعد تنفيذ كل مرحلة تخص العدة من نفس الطالب مع وقاية متوافقة. لو العدة أو دليلها أو نشرة سلامة الكاشف ناقصين، المهارة العملية غير مُقيّمة؛ التدريب الإلكتروني فقط يفضل متاح.\n\nالمدرّب يشوف مقارنة جدول نفس العدة في ضوء نهار غير مباشر، ويتأكد من هوية العينة وأن القراءة ضمن مدى الجدول، ويسجل عدم اليقين أو صعوبة مطابقة اللون بدل اختراع دقة عشرية.\n\nالاجتياز يتطلب صحة الهوية والجدول والقراءة المدعومة والتسجيل. قاعدة عامة للأزرق أو البنفسجي، أو جدول مستعار، أو تخمين خارج المدى، ما يجتازوش.\n\nالمدرّب يلاحظ الوقاية ونظافة السطح وتنظيف الأدوات وفصل المخلفات حسب الموقع، ويسمع من الطالب مقارنة بين فحص الحقل السريع وجهاز pH المُعاير والمعمل وحدود كل واحد.\n\nالاجتياز يحتاج إكمالًا آمنًا ملحوظًا وسببًا واضحًا لاختيار الطريقة. التعامل مع الكاشف من غير إشراف أو التخلص غير الآمن يوقف التطبيق لحد التصحيح.', 'المدرّب يسجل العدة الفعلية ودليلها، ويشوف كل طالب وهو يحط كمية العينة الصحيحة والكمية المحددة من كاشف بي إتش المطابق وماء العلامة المحددة، ويقفل ويخلط ويستنى وقت ظهور اللون الحقيقي؛ ما يستبدلش وقت أو كمية من عدة مختلفة.\n\nالاجتياز بعد تنفيذ كل مرحلة تخص العدة من نفس الطالب مع وقاية متوافقة. لو العدة أو دليلها أو نشرة سلامة الكاشف ناقصين، المهارة العملية غير مُقيّمة؛ التدريب الإلكتروني فقط يفضل متاح.\n\nالمدرّب يشوف مقارنة جدول نفس العدة في ضوء نهار غير مباشر، ويتأكد من هوية العينة وأن القراءة ضمن مدى الجدول، ويسجل عدم اليقين أو صعوبة مطابقة اللون بدل اختراع دقة عشرية.\n\nالاجتياز يتطلب صحة الهوية والجدول والقراءة المدعومة والتسجيل. قاعدة عامة للأزرق أو البنفسجي، أو جدول مستعار، أو تخمين خارج المدى، ما يجتازوش.\n\nالمدرّب يلاحظ الوقاية ونظافة السطح وتنظيف الأدوات وفصل المخلفات حسب الموقع، ويسمع من الطالب مقارنة بين فحص الحقل السريع وجهاز بي إتش المُعاير والمعمل وحدود كل واحد.\n\nالاجتياز يحتاج إكمالًا آمنًا ملحوظًا وسببًا واضحًا لاختيار الطريقة. التعامل مع الكاشف من غير إشراف أو التخلص غير الآمن يوقف التطبيق لحد التصحيح.'), ('طالبًا تانيًا', 'طالب تاني'), ('فعليًا', 'فعلاً'), ('مثال تدريبي موثّق، مش ادعاء إنها متوفرة في مصر أو إنها نفس عدة موقع التدريب\n\nRapitest Soil Test Kit 1601، مقارن ألوان pH\n\nطريقة pH في الصفحة الأولى من دليل Rapitest 1601: المقارن الأخضر وجدوله الخاص، التربة لعلامتها، كبسولة pH خضراء واحدة، ماء ويفضّل مقطرًا لعلامته، إغلاق ورجّ، حوالي دقيقة للترسيب وظهور اللون، ثم مقارنة في ضوء النهار بعيدًا عن الشمس المباشرة. تعليماتها مختلفة عن اختبار NPK أو أي عدة تانية.\n\nقبل التقييم العملي يسجل المدرّب اسم وموديل العدة الفعلية وإصدار دليلها ونشرة سلامة الكاشف ومدى جدولها؛ الطالب يتبع التعليمات الفعلية. لو مش متاحين، المحاكاة فقط مستمرة ومافيش اجتياز عملي.\n\nراجع هوية العينة والجدول المطابق وبطاقة الكاشف ونشرة السلامة والوقاية\n\nالتربة لعلامة التربة في المقارن ده\n\nكبسولة pH خضرا واحدة مطابقة\n\nالمَيّه لعلامة الماء في المقارن ده\n\nاقفل الغطا بإحكام ورُجّ كويس\n\nاستنى الترسيب وتكوّن اللون: حوالي دقيقة للمثال ده\n\nقارن السائل فوق التربة بجدوله في ضوء نهار غير مباشر\n\nسجّل قراءة يدعمها الجدول ونظّف واتخلص من المخلفات حسب الموقع', 'مثال تدريبي موثّق، مش ادعاء إنها متوفرة في مصر أو إنها نفس عدة موقع التدريب\n\nRapitest Soil Test Kit واحد ستة صفر واحد، مقارن ألوان بي إتش\n\nطريقة بي إتش في الصفحة الأولى من دليل Rapitest واحد ستة صفر واحد: المقارن الأخضر وجدوله الخاص، التربة لعلامتها، كبسولة بي إتش خضراء واحدة، ماء ويفضّل مقطرًا لعلامته، إغلاق ورجّ، حوالي دقيقة للترسيب وظهور اللون، ثم مقارنة في ضوء النهار بعيدًا عن الشمس المباشرة. تعليماتها مختلفة عن اختبار إن بي كي أو أي عدة تانية.\n\nقبل التقييم العملي يسجل المدرّب اسم وموديل العدة الفعلية وإصدار دليلها ونشرة سلامة الكاشف ومدى جدولها؛ الطالب يتبع التعليمات الفعلية. لو مش متاحين، المحاكاة فقط مستمرة ومافيش اجتياز عملي.\n\nراجع هوية العينة والجدول المطابق وبطاقة الكاشف ونشرة السلامة والوقاية\n\nالتربة لعلامة التربة في المقارن ده\n\nكبسولة بي إتش خضرا واحدة مطابقة\n\nالمَيّه لعلامة الماء في المقارن ده\n\nاقفل الغطا بإحكام ورُجّ كويس\n\nاستنى الترسيب وتكوّن اللون: حوالي دقيقة للمثال ده\n\nقارن السائل فوق التربة بجدوله في ضوء نهار غير مباشر\n\nسجّل قراءة يدعمها الجدول ونظّف واتخلص من المخلفات حسب الموقع'), ('نحو دقيقة', 'حوالي دقيقة'), ('وقتًا', 'وقت'), ('وهو يضع', 'وهو يحط'), ('وينتظر وقت', 'ويستنى وقت'), ('يفضل متاحًا', 'يفضل متاح')], 'en': [("The eight checks are correct sample amount, reagent quantity, water fill, capped shaking for the actual kit’s duration, settling/colour development, comparison with the matching chart, recording the value, and cleaning the equipment/bench. Also record PPE and SDS checks, chart identity and uncertainty. Use the actual manufacturer’s values; do not invent them.\n\nRetain source's PPE, correct soil/reagent/water, manufacturer mixing/development, chart reading and cleanup/disposal checks. Only an individually observed learner under the actual kit protocol can pass.\n\nTrainer selects the actual kit, verifies manual/SDS and pretests samples A/B/C. Each learner measures under observation, records actual result and uncertainty, cleans and disposes safely. Group recorder/analyst roles rotate, but one learner's test does not pass another.", "The eight checks are correct sample amount, reagent quantity, water fill, capped shaking for the actual kit’s duration, settling/colour development, comparison with the matching chart, recording the value, and cleaning the equipment/bench. Also record P P E and S D S checks, chart identity and uncertainty. Use the actual manufacturer’s values; do not invent them.\n\nRetain source's P P E, correct soil/reagent/water, manufacturer mixing/development, chart reading and cleanup/disposal checks. Only an individually observed learner under the actual kit protocol can pass.\n\nTrainer selects the actual kit, verifies manual/S D S and pretests samples A/B/C. Each learner measures under observation, records actual result and uncertainty, cleans and disposes safely. Group recorder/analyst roles rotate, but one learner's test does not pass another."), ('This schematic shows the procedure, not a calibrated Rapitest device or a readable pH chart. No colour here is a measured pH. Selecting a later phase does not complete a real wait.\n\nUse only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field ID\n\nTest date / tester\n\nKit, manual and matching chart\n\nObserved value or supported interval\n\nChart resolution / uncertainty\n\nActual development wait / observation\n\nPossible nutrient issue and alternative check\n\nCrop-specific next investigation, without a guessed dose\n\nUse actual evidence only. Local entries and typed names are unsigned notes, not authenticated trainer decisions or signatures. Product review does not prove who performed preparation; process actions need individual observation. Kit-specific rows refer to the documented teaching example and require the actual matching manual/SOP; otherwise leave them unassessed.\n\nThis blank record is not an observation or a pass. Leave decisions and actual data blank until the trainer actually observes or reviews the individual requirement.\n\nColour-kit practice worksheet', 'This schematic shows the procedure, not a calibrated Rapitest device or a readable P H chart. No colour here is a measured P H. Selecting a later phase does not complete a real wait.\n\nUse only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field I D\n\nTest date / tester\n\nKit, manual and matching chart\n\nObserved value or supported interval\n\nChart resolution / uncertainty\n\nActual development wait / observation\n\nPossible nutrient issue and alternative check\n\nCrop-specific next investigation, without a guessed dose\n\nUse actual evidence only. Local entries and typed names are unsigned notes, not authenticated trainer decisions or signatures. Product review does not prove who performed preparation; process actions need individual observation. Kit-specific rows refer to the documented teaching example and require the actual matching manual/S O P; otherwise leave them unassessed.\n\nThis blank record is not an observation or a pass. Leave decisions and actual data blank until the trainer actually observes or reviews the individual requirement.\n\nColour-kit practice worksheet'), ('Trainer records the exact kit and manual and directly observes each learner use the correct sample fill/measure, matched pH reagent quantity, specified water and closure, mixing and real development wait; no substituted time or amount from another kit.\n\nPass only when every kit-specific stage is correctly performed by that learner with compatible PPE. If the physical kit/manual/SDS is missing, record unassessed and allow online rehearsal without practical credit.\n\nTrainer observes same-kit chart comparison in diffuse daylight, identifies the actual sample, verifies value or interval is within chart scale, and records uncertainty or poor colour match instead of invented decimal precision.\n\nPass when identity, chart, supported reading and recording are all correct. A universal blue/purple rule, a borrowed chart or an out-of-range guess does not pass.\n\nTrainer observes safe PPE, bench hygiene, correct cleaning and site-specific waste separation and hears a comparison of quick field-kit screening with calibrated meter/lab testing and its limitations.\n\nPass only with both observed safe completion and a justified method choice. Unsupervised reagent use or unsafe disposal is a stop-and-remediate condition.', 'Trainer records the exact kit and manual and directly observes each learner use the correct sample fill/measure, matched P H reagent quantity, specified water and closure, mixing and real development wait; no substituted time or amount from another kit.\n\nPass only when every kit-specific stage is correctly performed by that learner with compatible P P E. If the physical kit/manual/S D S is missing, record unassessed and allow online rehearsal without practical credit.\n\nTrainer observes same-kit chart comparison in diffuse daylight, identifies the actual sample, verifies value or interval is within chart scale, and records uncertainty or poor colour match instead of invented decimal precision.\n\nPass when identity, chart, supported reading and recording are all correct. A universal blue/purple rule, a borrowed chart or an out-of-range guess does not pass.\n\nTrainer observes safe P P E, bench hygiene, correct cleaning and site-specific waste separation and hears a comparison of quick field-kit screening with calibrated meter/lab testing and its limitations.\n\nPass only with both observed safe completion and a justified method choice. Unsupervised reagent use or unsafe disposal is a stop-and-remediate condition.'), ("documented teaching example, not a claim of Egyptian availability or the exact equipment at the training site\n\nRapitest Soil Test Kit 1601, pH comparator\n\nThe pH procedure on manual page 1 uses the green comparator, soil fill line, one matching green powder capsule, preferably distilled water to its fill line, a tight cap, shaking, about one minute for settling/colour development, and that comparator's own chart in daylight away from direct sun. These instructions are not interchangeable with the NPK tests or another kit.\n\nBefore practical scoring, the trainer records the actual kit make/model, current manual revision, reagent SDS and chart range; the learner follows those exact instructions. If these are unavailable, only the simulation can proceed and no practical pass is awarded.\n\nCheck sample identity, matched chart, label/SDS and PPE\n\nSoil to this comparator’s soil line\n\nOne matching green pH capsule\n\nWater to this comparator’s water line\n\nFit the cap and shake thoroughly\n\nAllow settling and colour development: about 1 minute for this example\n\nCompare liquid above soil with its own chart in diffuse daylight\n\nRecord supported result and clean/dispose by site procedure", "documented teaching example, not a claim of Egyptian availability or the exact equipment at the training site\n\nRapitest Soil Test Kit one six zero one, P H comparator\n\nThe P H procedure on manual page one uses the green comparator, soil fill line, one matching green powder capsule, preferably distilled water to its fill line, a tight cap, shaking, about one minute for settling/colour development, and that comparator's own chart in daylight away from direct sun. These instructions are not interchangeable with the N P K tests or another kit.\n\nBefore practical scoring, the trainer records the actual kit make/model, current manual revision, reagent S D S and chart range; the learner follows those exact instructions. If these are unavailable, only the simulation can proceed and no practical pass is awarded.\n\nCheck sample identity, matched chart, label/S D S and P P E\n\nSoil to this comparator’s soil line\n\nOne matching green P H capsule\n\nWater to this comparator’s water line\n\nFit the cap and shake thoroughly\n\nAllow settling and colour development: about one minute for this example\n\nCompare liquid above soil with its own chart in diffuse daylight\n\nRecord supported result and clean/dispose by site procedure")], 'it': [("Esempio didattico documentato, non prova di disponibilità in Egitto o del kit posseduto dal centro\n\nRapitest Soil Test Kit 1601, comparatore colorimetrico del pH\n\nLa procedura pH a pagina 1 del manuale Rapitest 1601 usa il comparatore verde con la propria scala, terra fino alla tacca, una capsula verde corrispondente, acqua preferibilmente distillata fino alla tacca, tappo ben chiuso, agitazione, circa un minuto di sedimentazione e sviluppo del colore e confronto con quella scala alla luce del giorno senza sole diretto. Non è intercambiabile con NPK né con altri kit.\n\nPrima di valutare la pratica, il formatore registra marca e modello del kit reale, versione del manuale, SDS del reagente e intervallo della scala; l'allievo segue quelle istruzioni. Se mancano, solo simulazione, senza superamento pratico.\n\nControlla identità, scala abbinata, SDS e DPI\n\nTerra alla tacca del comparatore\n\nUna capsula pH verde corrispondente\n\nAcqua alla tacca del comparatore\n\nChiudi bene e agita a fondo\n\nAttendi sedimentazione e colore: circa 1 minuto in questo esempio\n\nConfronta il liquido sovrastante con la propria scala in luce diffusa\n\nRegistra il valore supportato e pulisci/smaltisci secondo il sito", "Esempio didattico documentato, non prova di disponibilità in Egitto o del kit posseduto dal centro\n\nRapitest Soil Test Kit uno sei zero uno, comparatore colorimetrico del P H\n\nLa procedura P H a pagina un del manuale Rapitest uno sei zero uno usa il comparatore verde con la propria scala, terra fino alla tacca, una capsula verde corrispondente, acqua preferibilmente distillata fino alla tacca, tappo ben chiuso, agitazione, circa un minuto di sedimentazione e sviluppo del colore e confronto con quella scala alla luce del giorno senza sole diretto. Non è intercambiabile con N P K né con altri kit.\n\nPrima di valutare la pratica, il formatore registra marca e modello del kit reale, versione del manuale, S D S del reagente e intervallo della scala; l'allievo segue quelle istruzioni. Se mancano, solo simulazione, senza superamento pratico.\n\nControlla identità, scala abbinata, S D S e D P I\n\nTerra alla tacca del comparatore\n\nUna capsula P H verde corrispondente\n\nAcqua alla tacca del comparatore\n\nChiudi bene e agita a fondo\n\nAttendi sedimentazione e colore: circa un minuto in questo esempio\n\nConfronta il liquido sovrastante con la propria scala in luce diffusa\n\nRegistra il valore supportato e pulisci/smaltisci secondo il sito"), ("Gli otto controlli sono quantità corretta di terra, reagente e acqua, agitazione a tappo chiuso per la durata del kit effettivo, sedimentazione e sviluppo del colore, confronto con la scala corrispondente, registrazione del valore e pulizia di strumenti e banco. Registra anche i controlli di DPI e SDS, l’identità della scala e l’incertezza. Usa i valori effettivi del produttore, senza inventarli.\n\nConservare DPI, dosi corrette di terra/reagente/acqua, mescolamento e sviluppo secondo produttore, lettura della scala, pulizia e smaltimento della scheda finale. Supera solo l'allievo osservato individualmente mentre segue il protocollo del kit reale.\n\nIl formatore sceglie il kit reale, verifica manuale/SDS e prova A/B/C in anticipo. Ogni allievo misura sotto osservazione, registra risultato e incertezza, pulisce e smaltisce in sicurezza. I ruoli di scrivente e analista ruotano, ma la prova di uno non promuove l'altro.", "Gli otto controlli sono quantità corretta di terra, reagente e acqua, agitazione a tappo chiuso per la durata del kit effettivo, sedimentazione e sviluppo del colore, confronto con la scala corrispondente, registrazione del valore e pulizia di strumenti e banco. Registra anche i controlli di D P I e S D S, l’identità della scala e l’incertezza. Usa i valori effettivi del produttore, senza inventarli.\n\nConservare D P I, dosi corrette di terra/reagente/acqua, mescolamento e sviluppo secondo produttore, lettura della scala, pulizia e smaltimento della scheda finale. Supera solo l'allievo osservato individualmente mentre segue il protocollo del kit reale.\n\nIl formatore sceglie il kit reale, verifica manuale/S D S e prova A/B/C in anticipo. Ogni allievo misura sotto osservazione, registra risultato e incertezza, pulisce e smaltisce in sicurezza. I ruoli di scrivente e analista ruotano, ma la prova di uno non promuove l'altro."), ("Il formatore registra kit e manuale esatti e osserva ciascun allievo usare terra nella quantità corretta, reagente pH corrispondente, acqua alla tacca, chiusura, agitazione e attesa reale. Non si prendono quantità o tempi da un altro kit.\n\nSuperamento solo dopo esecuzione individuale di ogni fase del kit con DPI compatibili. Se kit, manuale o SDS reali mancano, la pratica è non valutata; la simulazione online può proseguire senza credito pratico.\n\nIl formatore osserva il confronto con la scala del medesimo kit in luce diffusa, controlla l'identità del campione, un valore entro il campo della scala e la registrazione di incertezza o corrispondenza cromatica scarsa invece di decimali inventati.\n\nServono identità, scala, lettura sostenuta e registro corretti. Una regola universale blu/viola, una scala presa in prestito o una stima fuori intervallo non superano la prova.\n\nIl formatore osserva DPI, igiene del banco, pulizia e separazione dei rifiuti del sito e ascolta un confronto motivato fra screening colorimetrico, pH-metro calibrato e prova di laboratorio.\n\nServono sia conclusione sicura osservata sia scelta motivata del metodo. Reagenti usati senza supervisione o smaltimento insicuro fermano l'esercizio fino alla correzione.", "Il formatore registra kit e manuale esatti e osserva ciascun allievo usare terra nella quantità corretta, reagente P H corrispondente, acqua alla tacca, chiusura, agitazione e attesa reale. Non si prendono quantità o tempi da un altro kit.\n\nSuperamento solo dopo esecuzione individuale di ogni fase del kit con D P I compatibili. Se kit, manuale o S D S reali mancano, la pratica è non valutata; la simulazione online può proseguire senza credito pratico.\n\nIl formatore osserva il confronto con la scala del medesimo kit in luce diffusa, controlla l'identità del campione, un valore entro il campo della scala e la registrazione di incertezza o corrispondenza cromatica scarsa invece di decimali inventati.\n\nServono identità, scala, lettura sostenuta e registro corretti. Una regola universale blu/viola, una scala presa in prestito o una stima fuori intervallo non superano la prova.\n\nIl formatore osserva D P I, igiene del banco, pulizia e separazione dei rifiuti del sito e ascolta un confronto motivato fra screening colorimetrico, P H-metro calibrato e prova di laboratorio.\n\nServono sia conclusione sicura osservata sia scelta motivata del metodo. Reagenti usati senza supervisione o smaltimento insicuro fermano l'esercizio fino alla correzione."), ('Schema della procedura, non dispositivo Rapitest calibrato né scala pH leggibile. Nessun colore rappresenta un pH misurato. Scegliere una fase non completa l’attesa reale.\n\nSolo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nID campione e campo\n\nData / esecutore\n\nKit, manuale e scala abbinata\n\nValore osservato o intervallo supportato\n\nRisoluzione / incertezza\n\nAttesa reale / osservazione\n\nPossibile problema nutritivo e verifica alternativa\n\nIndagine successiva per la coltura, senza dosi inventate\n\nUsa soltanto evidenze effettive. Inserimenti locali e nomi digitati sono note non firmate, non decisioni o firme autenticate del formatore. La revisione del prodotto non prova chi ha eseguito la preparazione; le procedure richiedono osservazione individuale. Le righe specifiche del kit riguardano l’esempio documentato e richiedono manuale/SOP effettivi corrispondenti; altrimenti restano non valutate.\n\nQuesta scheda vuota non è un’osservazione né un superamento. Lascia decisioni e dati reali vuoti fino all’effettiva osservazione o revisione individuale del formatore.\n\nScheda del kit pH colorimetrico', 'Schema della procedura, non dispositivo Rapitest calibrato né scala P H leggibile. Nessun colore rappresenta un P H misurato. Scegliere una fase non completa l’attesa reale.\n\nSolo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nI D campione e campo\n\nData / esecutore\n\nKit, manuale e scala abbinata\n\nValore osservato o intervallo supportato\n\nRisoluzione / incertezza\n\nAttesa reale / osservazione\n\nPossibile problema nutritivo e verifica alternativa\n\nIndagine successiva per la coltura, senza dosi inventate\n\nUsa soltanto evidenze effettive. Inserimenti locali e nomi digitati sono note non firmate, non decisioni o firme autenticate del formatore. La revisione del prodotto non prova chi ha eseguito la preparazione; le procedure richiedono osservazione individuale. Le righe specifiche del kit riguardano l’esempio documentato e richiedono manuale/S O P effettivi corrispondenti; altrimenti restano non valutate.\n\nQuesta scheda vuota non è un’osservazione né un superamento. Lascia decisioni e dati reali vuoti fino all’effettiva osservazione o revisione individuale del formatore.\n\nScheda del kit P H colorimetrico'), ('pagina un del', 'pagina uno del')], 'de': [('Die Lehrkraft erfasst genaues Set und Handbuch und beobachtet jede lernende Person bei richtiger Bodenmenge, passendem pH-Reagenz, Wasserstand, Verschluss, Schütteln und realer Farbentwicklungszeit. Mengen und Zeiten eines anderen Sets werden nicht übertragen.\n\nBestanden nur, wenn alle setgebundenen Phasen individuell und mit passendem Schutz ausgeführt sind. Ohne echtes Set, Handbuch oder SDS bleibt die Praxis unbewertet; Online-Übung ist ohne Praxisgutschrift möglich.\n\nDie Lehrkraft beobachtet den Vergleich mit der Skala desselben Sets bei diffusem Tageslicht, prüft Probenkennung und Skalenbereich und lässt Unsicherheit oder schlechten Farbabgleich festhalten statt erfundener Dezimalstellen.\n\nKennung, passende Skala, gestützte Lesung und Aufzeichnung müssen stimmen. Allgemeine Blau-/Violettregel, fremde Skala oder Schätzung außerhalb des Bereichs reichen nicht.\n\nDie Lehrkraft beobachtet Schutz, sauberen Arbeitsplatz, Reinigung und standortgerechte Abfalltrennung und hört einen begründeten Vergleich von Feldtest, kalibriertem pH-Meter und Labor.\n\nNur sicher beobachteter Abschluss plus begründete Methodenwahl bestehen. Unbeaufsichtigter Reagenzeinsatz oder unsichere Entsorgung stoppen die Station bis zur Nachbesserung.', 'Die Lehrkraft erfasst genaues Set und Handbuch und beobachtet jede lernende Person bei richtiger Bodenmenge, passendem P H-Reagenz, Wasserstand, Verschluss, Schütteln und realer Farbentwicklungszeit. Mengen und Zeiten eines anderen Sets werden nicht übertragen.\n\nBestanden nur, wenn alle setgebundenen Phasen individuell und mit passendem Schutz ausgeführt sind. Ohne echtes Set, Handbuch oder S D S bleibt die Praxis unbewertet; Online-Übung ist ohne Praxisgutschrift möglich.\n\nDie Lehrkraft beobachtet den Vergleich mit der Skala desselben Sets bei diffusem Tageslicht, prüft Probenkennung und Skalenbereich und lässt Unsicherheit oder schlechten Farbabgleich festhalten statt erfundener Dezimalstellen.\n\nKennung, passende Skala, gestützte Lesung und Aufzeichnung müssen stimmen. Allgemeine Blau-/Violettregel, fremde Skala oder Schätzung außerhalb des Bereichs reichen nicht.\n\nDie Lehrkraft beobachtet Schutz, sauberen Arbeitsplatz, Reinigung und standortgerechte Abfalltrennung und hört einen begründeten Vergleich von Feldtest, kalibriertem P H-Meter und Labor.\n\nNur sicher beobachteter Abschluss plus begründete Methodenwahl bestehen. Unbeaufsichtigter Reagenzeinsatz oder unsichere Entsorgung stoppen die Station bis zur Nachbesserung.'), ('Die acht Kontrollen betreffen die richtige Boden-, Reagenz- und Wassermenge, fest verschlossenes Schütteln für die Dauer des tatsächlichen Sets, Absetzen/Farbentwicklung, Vergleich mit der passenden Skala, Aufzeichnung des Wertes sowie Geräte- und Arbeitsplatzreinigung. Erfasse außerdem Schutz- und SDS-Prüfung, Skalenidentität und Unsicherheit. Nutze die tatsächlichen Herstellerwerte, statt sie zu erfinden.\n\nSchutz, korrekte Mengen von Erde/Reagenz/Wasser, Mischen und Entwicklung nach Hersteller, Skalenlesung sowie Reinigung und Entsorgung der Abschlusskarte erhalten. Bestanden nur durch individuell beobachtete Arbeit nach wirklichem Setprotokoll.\n\nDie Lehrkraft wählt das wirkliche Set, prüft Handbuch/SDS und testet A/B/C vorher. Jede lernende Person misst unter Beobachtung der Lehrkraft, notiert tatsächlichen Wert und Unsicherheit, reinigt und entsorgt sicher. Schreib- und Analytikerrollen wechseln, aber die Messung einer Person besteht nicht für andere.', 'Die acht Kontrollen betreffen die richtige Boden-, Reagenz- und Wassermenge, fest verschlossenes Schütteln für die Dauer des tatsächlichen Sets, Absetzen/Farbentwicklung, Vergleich mit der passenden Skala, Aufzeichnung des Wertes sowie Geräte- und Arbeitsplatzreinigung. Erfasse außerdem Schutz- und S D S-Prüfung, Skalenidentität und Unsicherheit. Nutze die tatsächlichen Herstellerwerte, statt sie zu erfinden.\n\nSchutz, korrekte Mengen von Erde/Reagenz/Wasser, Mischen und Entwicklung nach Hersteller, Skalenlesung sowie Reinigung und Entsorgung der Abschlusskarte erhalten. Bestanden nur durch individuell beobachtete Arbeit nach wirklichem Setprotokoll.\n\nDie Lehrkraft wählt das wirkliche Set, prüft Handbuch/S D S und testet A/B/C vorher. Jede lernende Person misst unter Beobachtung der Lehrkraft, notiert tatsächlichen Wert und Unsicherheit, reinigt und entsorgt sicher. Schreib- und Analytikerrollen wechseln, aber die Messung einer Person besteht nicht für andere.'), ('Dokumentiertes Lehrbeispiel, kein Beleg für Verfügbarkeit in Ägypten oder die Ausstattung des Trainingsorts\n\nRapitest Soil Test Kit 1601, pH-Farbkomparator\n\nDas pH-Verfahren auf Seite 1 des Rapitest eins sechs null eins Handbuchs nutzt den grünen Komparator mit eigener Skala: Erde bis zur Bodenlinie, eine passende grüne pH-Kapsel, vorzugsweise destilliertes Wasser bis zur Wasserlinie, Deckel fest schließen und schütteln, ungefähr eine Minute absetzen und Farbe entwickeln lassen, dann bei Tageslicht ohne direkte Sonne mit dieser Skala vergleichen. Es ist nicht mit dem NPK-Verfahren oder anderen Sets austauschbar.\n\nVor einer praktischen Bewertung erfasst die Lehrkraft wirkliches Set, Handbuchstand, Reagenz-SDS und Skalenbereich. Die lernende Person folgt genau diesen Anweisungen. Fehlen sie, bleibt nur die Simulation ohne praktische Anerkennung.\n\nKennung, passende Skala, SDS und Schutz prüfen\n\nErde bis zur Bodenmarke dieses Komparators\n\nEine passende grüne pH-Kapsel\n\nWasser bis zur Wassermarke dieses Komparators\n\nDeckel fest schließen und gründlich schütteln\n\nAbsetzen und Farbentwicklung: hier etwa 1 Minute\n\nÜberstehende Flüssigkeit bei diffusem Tageslicht mit eigener Skala vergleichen\n\nUnterstützten Wert notieren; nach Standortverfahren reinigen/entsorgen', 'Dokumentiertes Lehrbeispiel, kein Beleg für Verfügbarkeit in Ägypten oder die Ausstattung des Trainingsorts\n\nRapitest Soil Test Kit eins sechs null eins, P H-Farbkomparator\n\nDas P H-Verfahren auf Seite eine des Rapitest eins sechs null eins Handbuchs nutzt den grünen Komparator mit eigener Skala: Erde bis zur Bodenlinie, eine passende grüne P H-Kapsel, vorzugsweise destilliertes Wasser bis zur Wasserlinie, Deckel fest schließen und schütteln, ungefähr eine Minute absetzen und Farbe entwickeln lassen, dann bei Tageslicht ohne direkte Sonne mit dieser Skala vergleichen. Es ist nicht mit dem N P K-Verfahren oder anderen Sets austauschbar.\n\nVor einer praktischen Bewertung erfasst die Lehrkraft wirkliches Set, Handbuchstand, Reagenz-S D S und Skalenbereich. Die lernende Person folgt genau diesen Anweisungen. Fehlen sie, bleibt nur die Simulation ohne praktische Anerkennung.\n\nKennung, passende Skala, S D S und Schutz prüfen\n\nErde bis zur Bodenmarke dieses Komparators\n\nEine passende grüne P H-Kapsel\n\nWasser bis zur Wassermarke dieses Komparators\n\nDeckel fest schließen und gründlich schütteln\n\nAbsetzen und Farbentwicklung: hier etwa eine Minute\n\nÜberstehende Flüssigkeit bei diffusem Tageslicht mit eigener Skala vergleichen\n\nUnterstützten Wert notieren; nach Standortverfahren reinigen/entsorgen'), ('Rapitest-1601-', 'Rapitest eins sechs null eins '), ('Seite eine des', 'Seite eins des'), ('Verfahrensschema, kein kalibriertes Rapitest-Gerät und keine ablesbare pH-Farbskala. Keine Farbe ist ein Messwert. Phasenwahl ersetzt keine echte Wartezeit.\n\nNur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nTestdatum / prüfende Person\n\nSet, Anleitung und passende Skala\n\nBeobachteter Wert oder unterstütztes Intervall\n\nAuflösung / Unsicherheit\n\nEchte Entwicklungszeit / Beobachtung\n\nMögliche Nährstofffrage und alternative Prüfung\n\nNächste kulturspezifische Untersuchung, keine erfundene Menge\n\nNur tatsächliche Nachweise verwenden. Lokale Eingaben und getippte Namen sind unsignierte Notizen, keine authentifizierten Entscheidungen oder Unterschriften der Lehrkraft. Produktprüfung belegt nicht, wer die Vorbereitung ausführte; Verfahren benötigen Einzelbeobachtung. Gerätespezifische Zeilen beziehen sich auf das dokumentierte Lehrbeispiel und erfordern passende tatsächliche Anleitung/SOP; andernfalls bleiben sie ungeprüft.\n\nDieses leere Protokoll belegt keine Beobachtung und kein Bestehen. Entscheidungen und tatsächliche Daten bleiben leer, bis die Lehrkraft die individuelle Anforderung wirklich beobachtet oder geprüft hat.\n\nArbeitsblatt Farb-pH-Test', 'Verfahrensschema, kein kalibriertes Rapitest-Gerät und keine ablesbare P H-Farbskala. Keine Farbe ist ein Messwert. Phasenwahl ersetzt keine echte Wartezeit.\n\nNur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nTestdatum / prüfende Person\n\nSet, Anleitung und passende Skala\n\nBeobachteter Wert oder unterstütztes Intervall\n\nAuflösung / Unsicherheit\n\nEchte Entwicklungszeit / Beobachtung\n\nMögliche Nährstofffrage und alternative Prüfung\n\nNächste kulturspezifische Untersuchung, keine erfundene Menge\n\nNur tatsächliche Nachweise verwenden. Lokale Eingaben und getippte Namen sind unsignierte Notizen, keine authentifizierten Entscheidungen oder Unterschriften der Lehrkraft. Produktprüfung belegt nicht, wer die Vorbereitung ausführte; Verfahren benötigen Einzelbeobachtung. Gerätespezifische Zeilen beziehen sich auf das dokumentierte Lehrbeispiel und erfordern passende tatsächliche Anleitung/S O P; andernfalls bleiben sie ungeprüft.\n\nDieses leere Protokoll belegt keine Beobachtung und kein Bestehen. Entscheidungen und tatsächliche Daten bleiben leer, bis die Lehrkraft die individuelle Anforderung wirklich beobachtet oder geprüft hat.\n\nArbeitsblatt Farb-P H-Test')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s206-lab-audio-20261023-r1'
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
