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
IDS = ('S2-12-ar-EG-jar-math-guidance-r1', 'S2-12-ar-EG-triangle-guidance-r1', 'S2-12-ar-EG-source-card-guidance-r1', 'S2-12-ar-EG-practical-measurement-r1', 'S2-12-ar-EG-knowledge-completion-r1', 'S2-12-ar-EG-record-guidance-r1', 'S2-12-en-jar-math-guidance-r1', 'S2-12-en-triangle-guidance-r1', 'S2-12-en-source-card-guidance-r1', 'S2-12-en-practical-measurement-r1', 'S2-12-en-knowledge-completion-r1', 'S2-12-en-record-guidance-r1', 'S2-12-it-jar-math-guidance-r1', 'S2-12-it-triangle-guidance-r1', 'S2-12-it-source-card-guidance-r1', 'S2-12-it-practical-measurement-r1', 'S2-12-it-knowledge-completion-r1', 'S2-12-it-record-guidance-r1', 'S2-12-de-jar-math-guidance-r1', 'S2-12-de-triangle-guidance-r1', 'S2-12-de-source-card-guidance-r1', 'S2-12-de-practical-measurement-r1', 'S2-12-de-knowledge-completion-r1', 'S2-12-de-record-guidance-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==24
    assert(req['scope'],req['stepId'])==('S212_LAB_24_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-12')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s212-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==24
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(6))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['jar-math-guidance', 'triangle-guidance', 'source-card-guidance', 'practical-measurement', 'knowledge-completion', 'record-guidance']
        voice='Charon'if group in['triangle-guidance', 'practical-measurement', 'record-guidance']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'jar-math-guidance': ['/texturePractice/ui/jarModel', '/texturePractice/ui/jarHelp', '/texturePractice/ui/badMarkers', '/texturePractice/ui/badDenominator', '/texturePractice/ui/badMath', '/texturePractice/ui/goodMath'], 'triangle-guidance': ['/texturePractice/ui/triangleHelp', '/texturePractice/ui/badPercent', '/texturePractice/ui/classGood', '/texturePractice/ui/classBad', '/texturePractice/ui/thresholdNote', '/texturePractice/ui/classNames/0', '/texturePractice/ui/classNames/1', '/texturePractice/ui/classNames/2', '/texturePractice/ui/classNames/3', '/texturePractice/ui/classNames/4', '/texturePractice/ui/classNames/5', '/texturePractice/ui/classNames/6', '/texturePractice/ui/classNames/7', '/texturePractice/ui/classNames/8', '/texturePractice/ui/classNames/9', '/texturePractice/ui/classNames/10', '/texturePractice/ui/classNames/11'], 'source-card-guidance': ['/texturePractice/card/scenario', '/texturePractice/card/observedRowsForThisStep/0/criterion', '/texturePractice/card/observedRowsForThisStep/1/criterion', '/texturePractice/card/observedRowsForThisStep/2/criterion', '/texturePractice/card/observedRowsForThisStep/3/criterion', '/texturePractice/card/observedRowsForThisStep/4/criterion', '/texturePractice/card/observedRowsForThisStep/5/criterion', '/texturePractice/card/bridgeToPreviousStep'], 'practical-measurement': ['/texturePractice/practical/0/title', '/texturePractice/practical/0/conditions', '/texturePractice/practical/0/observationRows/0', '/texturePractice/practical/0/observationRows/1', '/texturePractice/practical/0/observationRows/2', '/texturePractice/practical/0/observationRows/3', '/texturePractice/practical/0/observationRows/4', '/texturePractice/practical/0/observationRows/5'], 'knowledge-completion': ['/texturePractice/passChecks/0/evidence', '/texturePractice/passChecks/0/decision', '/texturePractice/passChecks/1/evidence', '/texturePractice/passChecks/1/decision', '/texturePractice/passChecks/2/evidence', '/texturePractice/passChecks/2/decision'], 'record-guidance': ['/texturePractice/ui/recordHelp', '/texturePractice/ui/fields/0', '/texturePractice/ui/fields/1', '/texturePractice/ui/fields/2', '/texturePractice/ui/fields/3', '/texturePractice/ui/fields/4', '/texturePractice/ui/fields/5', '/texturePractice/ui/fields/6', '/texturePractice/ui/fields/7', '/texturePractice/ui/fields/8', '/texturePractice/ui/saved', '/texturePractice/ui/reasonBoundary', '/texturePractice/ui/notReady', '/texturePractice/ui/knowledgeOnly', '/studentDownloads/0/title']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('العلامة أو الوقت المجهول يفضل فاضي ومعاه تفسير. ملاحظات المسودة مش قياس مثبت ولا تحقق من الوقت ولا اعتماد مدرّب أو نتيجة معمل.\n\nهوية العينة، وبرطمانك ولا مثال تدريبي\n\nالطريقة المختارة وسجل مراحل الترسيب الفعلية ووقت الملاحظة الحقيقي\n\nمرجع القاع وعلامات الرمل والسلت والنهاية التراكمية، mm\n\nسُمك الرمل والسلت والطين المنفصل والإجمالي، mm\n\nنسب الرمل والسلت والطين قبل التقريب\n\nالنسب بعد التقريب ومراجعة المجموع\n\nمرجع المثلث ونقطة التقاطع والفئة المبدئية\n\nالحد غير الواضح والبيانات الناقصة والخطوة الجاية\n\nتعقيب المدرّب على أداء الطالب والتاريخ (فاضي)\n\nالمسودة اتحفظت محليًا؛ معيار القياس الفعلي لسه ما اتلاحظش.\n\nالنموذج بعد المحاولة مش اعتماد لمعنى الإجابة ولا اجتياز عملي متلاحظ.\n\nكمّل صفوف التدريب المعلّمة الأول. ما تخترعش ملاحظة علشان تفتح مثال.\n\nتدريب حساب وتتبع؛ القياس الحقيقي لسه ما اتلاحظش\n\nورقة تدريب قياس الطبقات والقوام', 'العلامة أو الوقت المجهول يفضل فاضي ومعاه تفسير. ملاحظات المسودة مش قياس مثبت ولا تحقق من الوقت ولا اعتماد مدرّب أو نتيجة معمل.\n\nهوية العينة، وبرطمانك ولا مثال تدريبي\n\nالطريقة المختارة وسجل مراحل الترسيب الفعلية ووقت الملاحظة الحقيقي\n\nمرجع القاع وعلامات الرمل والسلت والنهاية التراكمية، ملليمتر\n\nسُمك الرمل والسلت والطين المنفصل والإجمالي، ملليمتر\n\nنسب الرمل والسلت والطين قبل التقريب\n\nالنسب بعد التقريب ومراجعة المجموع\n\nمرجع المثلث ونقطة التقاطع والفئة المبدئية\n\nالحد غير الواضح والبيانات الناقصة والخطوة الجاية\n\nتعقيب المدرّب على أداء الطالب والتاريخ (فاضي)\n\nالمسودة اتحفظت محليًا؛ معيار القياس الفعلي لسه ما اتلاحظش.\n\nالنموذج بعد المحاولة مش اعتماد لمعنى الإجابة ولا اجتياز عملي متلاحظ.\n\nكمّل صفوف التدريب المعلّمة الأول. ما تخترعش ملاحظة علشان تفتح مثال.\n\nتدريب حساب وتتبع؛ القياس الحقيقي لسه ما اتلاحظش\n\nورقة تدريب قياس الطبقات والقوام'), ('برطمان تدريب قابل للتعديل ·3D\n\nده تمرين علامات توضيحي من مثال 80 mm المعطى، مش قياس برطمان طالب. حرّك العلامات التراكمية لـ 44 و 68 و 80 mm؛ سُمك الطبقة هو الفرق بين علامتين متتاليتين. البقايا الطافية خارج القياس.\n\nاستخدم علامات المثال 44 و 68 و 80 mm بالترتيب التصاعدي. إجمالي صفر أو علامة سالبة أو ترتيب معكوس ما ينفعش للحساب ده.\n\nاقسم سُمك كل طبقة على إجمالي ارتفاع الطبقات المعدنية، مش علامة وسطية ولا سُمك الطبقة نفسها.\n\nاطرح العلامات المتتالية، وبعدها اقسم كل سُمك على 80 mm واضرب في 100. دقة التدريب 0.1 mm و 0.1 نقطة مئوية؛ دي مش مواصفة دقة معمل.\n\nالمثال بيدي 44/24/12 mm و 55/30/15%. ده فحص لحساب الأرقام المعطاة بس؛ قياس الطالب الفعلي لسه ما اتلاحظش.', 'برطمان تدريب قابل للتعديل ; ثلاثي الأبعاد\n\nده تمرين علامات توضيحي من مثال تمانين ملليمتر المعطى، مش قياس برطمان طالب. حرّك العلامات التراكمية لـ أربعة وأربعين و تمانية وستين و تمانين ملليمتر؛ سُمك الطبقة هو الفرق بين علامتين متتاليتين. البقايا الطافية خارج القياس.\n\nاستخدم علامات المثال أربعة وأربعين و تمانية وستين و تمانين ملليمتر بالترتيب التصاعدي. إجمالي صفر أو علامة سالبة أو ترتيب معكوس ما ينفعش للحساب ده.\n\nاقسم سُمك كل طبقة على إجمالي ارتفاع الطبقات المعدنية، مش علامة وسطية ولا سُمك الطبقة نفسها.\n\nاطرح العلامات المتتالية، وبعدها اقسم كل سُمك على تمانين ملليمتر واضرب في مية. دقة التدريب صفر فاصلة واحد ملليمتر و صفر فاصلة واحد نقطة مئوية؛ دي مش مواصفة دقة معمل.\n\nالمثال بيدي أربعة وأربعين, أربعة وعشرين, اتناشر ملليمتر و خمسة وخمسين, تلاتين, خمستاشر في المية. ده فحص لحساب الأرقام المعطاة بس؛ قياس الطالب الفعلي لسه ما اتلاحظش.'), ('برطمان عرض منفصل مترسّب 48 ساعة ينفع للتدريب على القياس بس. الخطوة اللي فاتت غطّت تجهيز البنود 1–6 ؛ وهنا البنود 7–12 لارتفاع الطبقات الكلي وسُمك الرمل والسلت والطين والنسب التلاتة وتسجيلها بوضوح. برطماناتك محتاجة ملاحظات متأخرة حقيقية وتحقق المدرّب.\n\nقِس الارتفاع الكلي للطبقات المعدنية بالملليمتر\n\nقِس سُمك الرمل المنفصل بالملليمتر\n\nقِس سُمك السلت المنفصل بالملليمتر\n\nقِس سُمك الطين المنفصل بالملليمتر\n\nاحسب نسب الرمل والسلت والطين\n\nسجل كل النسب بوضوح\n\nالتطبيق ليه 12 بند: التجهيز في الخطوة اللي فاتت، وبعده القياس والتسجيل هنا. برطمان العرض المجهّز ما ينفعش يحل محل برطماناتك اللي المدرّب بيلاحظ قياسك ليها.', 'برطمان عرض منفصل مترسّب تمانية وأربعين ساعة ينفع للتدريب على القياس بس. الخطوة اللي فاتت غطّت تجهيز البنود واحد إلى ستة؛ وهنا البنود سبعة إلى اتناشر لارتفاع الطبقات الكلي وسُمك الرمل والسلت والطين والنسب التلاتة وتسجيلها بوضوح. برطماناتك محتاجة ملاحظات متأخرة حقيقية وتحقق المدرّب.\n\nقِس الارتفاع الكلي للطبقات المعدنية بالملليمتر\n\nقِس سُمك الرمل المنفصل بالملليمتر\n\nقِس سُمك السلت المنفصل بالملليمتر\n\nقِس سُمك الطين المنفصل بالملليمتر\n\nاحسب نسب الرمل والسلت والطين\n\nسجل كل النسب بوضوح\n\nالتطبيق ليه اتناشر بند: التجهيز في الخطوة اللي فاتت، وبعده القياس والتسجيل هنا. برطمان العرض المجهّز ما ينفعش يحل محل برطماناتك اللي المدرّب بيلاحظ قياسك ليها.'), ('حدود المناطق وقواعد التصنيف من ملف USDA الرسمي لسنة 2024. أرقام المناطق بتوصلك للمفتاح المترجم. الرمل بيزيد من اليمين للشمال، والطين لفوق، والسلت لتحت على الضلع اليمين. خطوط الإرشاد بتتقاطع عند النسب المتوازنة المختارة؛ نسب ارتفاع البرطمان تفضل تقدير تقريبي.\n\nاكتب تلات نسب محددة من صفر لـ 100 ، مجموعها 100 قبل الرسم. مجموع 99 أو 101 بعد التقريب محتاج مراجعة الارتفاعات الأصلية؛ مش هنعدله تلقائيًا.\n\nالفئة مناسبة لقاعدة التصنيف الأساسية في المرجع الرسمي. اشرح الخطوط التلاتة؛ الحساب ده ما بيخلقش قياسات لعينتك.\n\nتتبع خط الرمل المائل وخط الطين الأفقي وخط السلت المائل، وقارن نقطة التقاطع برقم المنطقة ومفتاحها.\n\nنقطة 30/30/40 على حد 40% طين؛ ملف المرجع الرسمي بيدخلها في فئة الطين. قاعدة الحد واضحة، مش تخمين من اللون.\n\nرمل\n\nرمل لومي\n\nلومية رملية\n\nلومية طينية رملية\n\nلومية\n\nطين رملي\n\nلومية طينية\n\nطين سلتي\n\nلومية طينية سلتية\n\nلومية سلتية\n\nسلت\n\nطين', 'حدود المناطق وقواعد التصنيف من ملف يو إس دي إيه الرسمي لسنة ألفين وأربعة وعشرين. أرقام المناطق بتوصلك للمفتاح المترجم. الرمل بيزيد من اليمين للشمال، والطين لفوق، والسلت لتحت على الضلع اليمين. خطوط الإرشاد بتتقاطع عند النسب المتوازنة المختارة؛ نسب ارتفاع البرطمان تفضل تقدير تقريبي.\n\nاكتب تلات نسب محددة من صفر لـ مية، مجموعها مية قبل الرسم. مجموع تسعة وتسعين أو مية وواحد بعد التقريب محتاج مراجعة الارتفاعات الأصلية؛ مش هنعدله تلقائيًا.\n\nالفئة مناسبة لقاعدة التصنيف الأساسية في المرجع الرسمي. اشرح الخطوط التلاتة؛ الحساب ده ما بيخلقش قياسات لعينتك.\n\nتتبع خط الرمل المائل وخط الطين الأفقي وخط السلت المائل، وقارن نقطة التقاطع برقم المنطقة ومفتاحها.\n\nنقطة تلاتين, تلاتين, أربعين على حد أربعين في المية طين؛ ملف المرجع الرسمي بيدخلها في فئة الطين. قاعدة الحد واضحة، مش تخمين من اللون.\n\nرمل\n\nرمل لومي\n\nلومية رملية\n\nلومية طينية رملية\n\nلومية\n\nطين رملي\n\nلومية طينية\n\nطين سلتي\n\nلومية طينية سلتية\n\nلومية سلتية\n\nسلت\n\nطين'), ('في كل واحد من برطماناته التلاتة، الطالب يشير إلى القاع وحد الرمل وحد السلت والحد المعدني الأخير بعد فترة الملاحظة المعلنة، ويسجل الارتفاع بالملليمتر ويحسب كل طبقة بطرح العلامات المتتابعة، ويذكر أي حد غير واضح.\n\nيجتاز لما قياسات سُمك الطبقات والارتفاع الكلي في البرطمانات التلاتة تكون قابلة للتتبع ومتسقة حسابيًا، والمدرّب شاف الطالب وهو بيقيسها. برطمان المدرّب الجاهز أو جدول الأرقام المعطاة ما يثبتوش المهارة.\n\nيستخدم سُمك الطبقة ÷ ارتفاع الطبقات المعدنية الكلي ×100 للمجموعات التلاتة، ويعرض المقام وإلغاء وحدة mm، ويحسب الجزء الناقص بالطرح، ويميز مجموعًا قريبًا من 100% بسبب التقريب عن خطأ قياس أو حساب.\n\nيجتاز مع مقام وحساب صحيحين وفحص مجموع مبرر؛ عدد أسئلة ثابت أو إجابة آلة حاسبة من غير شرح مش كفاية.\n\nيتتبع محاور الرمل والطين والسلت المطبوعة باتجاهاتها ونقطة تقاطعها، ويعطي تربة لومية رملية لـ55/30/15، ولومية لـ40/40/20، وطينية لـ15/30/55، ويذكر إن برطمان التدريب يعطي تقدير ارتفاع أوليًا.\n\nيجتاز لما الاسم وطريقة تتبع الخطوط يتوافقوا مع الرسم المحدد. الحاسبة تؤكد المثال، لكنها لا تولّد قياسات الطالب.', 'في كل واحد من برطماناته التلاتة، الطالب يشير إلى القاع وحد الرمل وحد السلت والحد المعدني الأخير بعد فترة الملاحظة المعلنة، ويسجل الارتفاع بالملليمتر ويحسب كل طبقة بطرح العلامات المتتابعة، ويذكر أي حد غير واضح.\n\nيجتاز لما قياسات سُمك الطبقات والارتفاع الكلي في البرطمانات التلاتة تكون قابلة للتتبع ومتسقة حسابيًا، والمدرّب شاف الطالب وهو بيقيسها. برطمان المدرّب الجاهز أو جدول الأرقام المعطاة ما يثبتوش المهارة.\n\nيستخدم سُمك الطبقة مقسوم على ارتفاع الطبقات المعدنية الكلي مضروب في مية للمجموعات التلاتة، ويعرض المقام وإلغاء وحدة ملليمتر، ويحسب الجزء الناقص بالطرح، ويميز مجموع قريب من مية في المية بسبب التقريب عن خطأ قياس أو حساب.\n\nيجتاز مع مقام وحساب صحيحين وفحص مجموع مبرر؛ عدد أسئلة ثابت أو إجابة آلة حاسبة من غير شرح مش كفاية.\n\nيتتبع محاور الرمل والطين والسلت المطبوعة باتجاهاتها ونقطة تقاطعها، ويعطي تربة لومية رملية لـخمسة وخمسين, تلاتين, خمستاشر، ولومية لـأربعين, أربعين, عشرين، وطينية لـخمستاشر, تلاتين, خمسة وخمسين، ويذكر إن برطمان التدريب بيدي تقدير ارتفاع أولي.\n\nيجتاز لما الاسم وطريقة تتبع الخطوط يتوافقوا مع الرسم المحدد. الحاسبة تؤكد المثال، لكنها لا تولّد قياسات الطالب.'), ('قِس تلات برطمانات حقيقية\n\nبرطمانات منفصلة بأسماء الطالب من S2-11 لها ملاحظات مبكرة ومتأخرة ونهائية فعلية تحت طريقة المدرّب الآمنة المعلنة. برطمان عرض مترسب مسبقًا للتدريب فقط.\n\nيربط كل برطمان باسمه السابق وسجل توقيته\n\nيفحص الحد النهائي الحقيقي ويذكر أي تحريك أو عدم وضوح\n\nيضع المسطرة من القاع ويقرأ كل علامة تراكمية بالملليمتر\n\nيطرح العلامات المتتالية ليحسب سُمك الرمل والسلت والطين\n\nيقيس الارتفاع المعدني النهائي ويتحقق إن مجموع السُمك يساويه\n\nيسجل تلات صفوف منفصلة A وB وC ويميز أي أرقام أمثلة معطاة', 'قِس تلات برطمانات حقيقية\n\nبرطمانات منفصلة بأسماء الطالب من خطوة المحطة التانية رقم حداشر لها ملاحظات مبكرة ومتأخرة ونهائية فعلية تحت طريقة المدرّب الآمنة المعلنة. برطمان عرض مترسب مسبقًا للتدريب فقط.\n\nيربط كل برطمان باسمه السابق وسجل توقيته\n\nيفحص الحد النهائي الحقيقي ويذكر أي تحريك أو عدم وضوح\n\nيضع المسطرة من القاع ويقرأ كل علامة تراكمية بالملليمتر\n\nيطرح العلامات المتتالية ليحسب سُمك الرمل والسلت والطين\n\nيقيس الارتفاع المعدني النهائي ويتحقق إن مجموع السُمك يساويه\n\nيسجل تلات صفوف منفصلة إيه وبي وسي ويميز أي أرقام أمثلة معطاة')], 'en': [('A separate teaching jar prepared for 48 hours supports measurement rehearsal only. The previous step covers setup items 1–6; items 7–12 here cover total and separate sand, silt and clay heights, all three percentages and clear recording. Your own jars require real later observations and trainer verification.\n\nMeasure total mineral-layer height in mm\n\nMeasure separate sand height in mm\n\nMeasure separate silt height in mm\n\nMeasure separate clay height in mm\n\nCalculate sand, silt and clay percentages\n\nRecord all percentages clearly\n\nThe twelve-item activity continues: preparation in the previous step, then measurement and recording here. A prepared demonstration jar cannot replace your individually observed jars.', 'A separate teaching jar prepared for forty-eight hours supports measurement rehearsal only. The previous step covers setup items one to six; items seven to twelve here cover total and separate sand, silt and clay heights, all three percentages and clear recording. Your own jars require real later observations and trainer verification.\n\nMeasure total mineral-layer height in millimetres \n\nMeasure separate sand height in millimetres \n\nMeasure separate silt height in millimetres \n\nMeasure separate clay height in millimetres \n\nCalculate sand, silt and clay percentages\n\nRecord all percentages clearly\n\nThe twelve-item activity continues: preparation in the previous step, then measurement and recording here. A prepared demonstration jar cannot replace your individually observed jars.'), ('Editable teaching jar ·3D\n\nSynthetic marker exercise based on the supplied 80 mm example, not a measured student jar. Move the cumulative marks to 44,68,80 mm; the layer thickness is the difference between successive marks. Floating material is excluded.\n\nUse the assigned 44,68,80 mm cumulative marks in increasing order. Zero total, negative or reversed marks cannot support this example.\n\nDivide every separate layer by the total mineral-layer height, not a cumulative intermediate mark or its own thickness.\n\nSubtract consecutive marks, then divide each thickness by 80 mm and multiply by 100. Use 0.1 mm and 0.1 percentage-point precision for this exercise, not as a laboratory tolerance.\n\nThe example gives 44/24/12 mm and 55/30/15%. This checks the supplied calculation only; individual measurement remains unobserved.', 'Editable teaching jar ; three dimensional\n\nSynthetic marker exercise based on the supplied example with a total height of eighty millimetres, not a measured student jar. Move the cumulative marks to forty-four, sixty-eight, eighty millimetres; the layer thickness is the difference between successive marks. Floating material is excluded.\n\nUse the assigned forty-four, sixty-eight, eighty millimetres cumulative marks in increasing order. Zero total, negative or reversed marks cannot support this example.\n\nDivide every separate layer by the total mineral-layer height, not a cumulative intermediate mark or its own thickness.\n\nSubtract consecutive marks, then divide each thickness by eighty millimetres and multiply by one hundred. Use zero point one millimetre and zero point one percentage-point precision for this exercise, not as a laboratory tolerance.\n\nThe example gives forty-four, twenty-four, twelve millimetres and fifty-five, thirty, fifteen percent. This checks the supplied calculation only; individual measurement remains unobserved.'), ("For each of three identified jars, the learner points to the actual basal, sand, silt and final mineral marks after the declared observation period; records heights in mm and obtains each layer by subtracting successive marks, noting any unclear boundary.\n\nPass when all three jars have traceable, arithmetically consistent layer and total measurements observed by the trainer. Do not pass from the trainer's pre-settled demonstration jar or a table of supplied values.\n\nUses layer thickness / total mineral-layer thickness × 100 for all three fractions, shows the denominator and units cancelling, identifies a missing fraction by subtraction, and explains a near-100% rounding total versus a real measurement or arithmetic error.\n\nPass with the right denominator, calculations and a justified total check; a fixed question count or an unexplained calculator answer is insufficient.\n\nTraces the printed chart's labelled sand, clay and silt axes with the correct direction and intersection; gives sandy loam for 55/30/15, loam for 40/40/20 and clay for 15/30/55, and explains the provisional nature of a jar-height estimate.\n\nPass when the class and line-tracing reasoning agree on the specified chart. A calculator may confirm the worked point; it cannot create a student's measurements.", "For each of three identified jars, the learner points to the actual basal, sand, silt and final mineral marks after the declared observation period; records heights in millimetres and obtains each layer by subtracting successive marks, noting any unclear boundary.\n\nPass when all three jars have traceable, arithmetically consistent layer and total measurements observed by the trainer. Do not pass from the trainer's pre-settled demonstration jar or a table of supplied values.\n\nUses layer thickness divided by total mineral-layer thickness multiplied by one hundred for all three fractions, shows the denominator and units cancelling, identifies a missing fraction by subtraction, and explains a near-one hundred percent rounding total versus a real measurement or arithmetic error.\n\nPass with the right denominator, calculations and a justified total check; a fixed question count or an unexplained calculator answer is insufficient.\n\nTraces the printed chart's labelled sand, clay and silt axes with the correct direction and intersection; gives sandy loam for fifty-five, thirty, fifteen, loam for forty, forty, twenty and clay for fifteen, thirty, fifty-five, and explains the provisional nature of a jar-height estimate.\n\nPass when the class and line-tracing reasoning agree on the specified chart. A calculator may confirm the worked point; it cannot create a student's measurements."), ("Measure three real jars\n\nThree individually identified jars from S2-11 have real early, later and final observations under the trainer's declared safe procedure. A separate pre-settled jar may be used only for rehearsal.\n\nMatches every jar to the student's earlier ID and timed record\n\nChecks the actual final boundary and notes disturbance or uncertainty\n\nPlaces the ruler at the bottom and reads each cumulative mark in mm\n\nSubtracts successive marks for sand, silt and clay thicknesses\n\nMeasures the final total mineral height and verifies the three thicknesses sum to it\n\nRecords three separate rows A, B and C and distinguishes any supplied example values", "Measure three real jars\n\nThree individually identified jars from station two step eleven have real early, later and final observations under the trainer's declared safe procedure. A separate pre-settled jar may be used only for rehearsal.\n\nMatches every jar to the student's earlier ID and timed record\n\nChecks the actual final boundary and notes disturbance or uncertainty\n\nPlaces the ruler at the bottom and reads each cumulative mark in millimetres \n\nSubtracts successive marks for sand, silt and clay thicknesses\n\nMeasures the final total mineral height and verifies the three thicknesses sum to it\n\nRecords three separate rows A, B and C and distinguishes any supplied example values"), ('Region boundaries and classification inequalities come from the official 2024 USDA workbook. Region numbers identify the translated legend. Sand increases right-to-left, clay upward, silt down the right edge. Guidelines meet at the selected balanced percentages; jar-height percentages remain an approximation.\n\nEnter three finite percentages from 0 to 100 that total 100 before plotting. A rounded 99/101 total must be checked against raw heights; it is not silently normalized.\n\nClass matches the official basic-class convention. Explain the three traced lines; this calculation does not create your sample measurements.\n\nTrace the sand diagonal, horizontal clay line and silt diagonal, then compare the intersection with the numbered region and legend.\n\n30/30/40 sits on the 40% clay threshold; the official workbook includes it in clay. Boundary convention is explicit, not guessed from a colour.\n\nSand\n\nLoamy sand\n\nSandy loam\n\nSandy clay loam\n\nLoam\n\nSandy clay\n\nClay loam\n\nSilty clay\n\nSilty clay loam\n\nSilt loam\n\nSilt\n\nClay', 'Region boundaries and classification inequalities come from the official twenty twenty-four U S D A workbook. Region numbers identify the translated legend. Sand increases right-to-left, clay upward, silt down the right edge. Guidelines meet at the selected balanced percentages; jar-height percentages remain an approximation.\n\nEnter three finite percentages from zero to one hundred that total one hundred before plotting. A rounded ninety-nine or one hundred and one total must be checked against raw heights; it is not silently normalized.\n\nClass matches the official basic-class convention. Explain the three traced lines; this calculation does not create your sample measurements.\n\nTrace the sand diagonal, horizontal clay line and silt diagonal, then compare the intersection with the numbered region and legend.\n\nthirty, thirty, forty sits on the forty percent clay threshold; the official workbook includes it in clay. Boundary convention is explicit, not guessed from a colour.\n\nSand\n\nLoamy sand\n\nSandy loam\n\nSandy clay loam\n\nLoam\n\nSandy clay\n\nClay loam\n\nSilty clay\n\nSilty clay loam\n\nSilt loam\n\nSilt\n\nClay'), ('Unknown marks or times stay blank with an explanation. Draft notes are not measured evidence, verified chronology, trainer approval or a laboratory result.\n\nSample ID and own/practice identity\n\nSelected method, real settling history and observation time\n\nBottom reference and cumulative sand/silt/final marks, mm\n\nSeparate sand/silt/clay thicknesses and total, mm\n\nUnrounded sand/silt/clay percentages\n\nRounded percentages and total check\n\nTriangle reference, traced intersection and provisional class\n\nUnclear boundary, missing data and next action\n\nIndividual trainer feedback and date (blank)\n\nDraft saved locally; measurement criterion remains unobserved.\n\nA model after your attempt is not semantic approval or an observed practical pass.\n\nComplete the identified practice rows first. Do not invent an observation to unlock an example.\n\nCalculation and tracing rehearsal; real measurement unobserved\n\nLayer measurement and texture worksheet', 'Unknown marks or times stay blank with an explanation. Draft notes are not measured evidence, verified chronology, trainer approval or a laboratory result.\n\nSample ID and whether it is your own jar or a practice example\n\nSelected method, real settling history and observation time\n\nBottom reference and cumulative sand, silt, final marks, millimetres \n\nSeparate sand, silt, clay thicknesses and total, millimetres \n\nUnrounded sand, silt, clay percentages\n\nRounded percentages and total check\n\nTriangle reference, traced intersection and provisional class\n\nUnclear boundary, missing data and next action\n\nIndividual trainer feedback and date (blank)\n\nDraft saved locally; measurement criterion remains unobserved.\n\nA model after your attempt is not semantic approval or an observed practical pass.\n\nComplete the identified practice rows first. Do not invent an observation to unlock an example.\n\nCalculation and tracing rehearsal; real measurement unobserved\n\nLayer measurement and texture worksheet')], 'it': [('Barattolo didattico modificabile ·3D\n\nEsercizio sintetico sull’esempio fornito di 80 mm, non una misura dello studente. Porta le quote cumulative a 44,68,80 mm; ogni spessore è la differenza tra quote consecutive. Escludi residui galleggianti.\n\nUsa le quote assegnate 44,68,80 mm in ordine crescente. Totale nullo, quote negative o invertite non sostengono il calcolo.\n\nDividi ogni spessore per l’altezza minerale totale, non per una quota intermedia o per se stesso.\n\nSottrai quote consecutive, dividi per 80 mm e moltiplica per 100. Precisione didattica 0.1 mm e 0.1 punto percentuale; non tolleranza di laboratorio.\n\nL’esempio dà44/24/12 mm e 55/30/15%. Solo calcolo fornito verificato; misurazione individuale ancora non osservata.', 'Barattolo didattico modificabile ; tridimensionale\n\nEsercizio sintetico sull’esempio fornito di ottanta millimetri, non una misura dello studente. Porta le quote cumulative a quarantaquattro, sessantotto, ottanta millimetri; ogni spessore è la differenza tra quote consecutive. Escludi residui galleggianti.\n\nUsa le quote assegnate quarantaquattro, sessantotto, ottanta millimetri in ordine crescente. Totale nullo, quote negative o invertite non sostengono il calcolo.\n\nDividi ogni spessore per l’altezza minerale totale, non per una quota intermedia o per se stesso.\n\nSottrai quote consecutive, dividi per ottanta millimetri e moltiplica per cento. Precisione didattica zero virgola un millimetro e zero virgola uno punto percentuale; non tolleranza di laboratorio.\n\nL’esempio dà quarantaquattro, ventiquattro, dodici millimetri e cinquantacinque, trenta, quindici per cento. Solo calcolo fornito verificato; misurazione individuale ancora non osservata.'), ('Confini e disuguaglianze provengono dal file ufficiale USDA 2024. I numeri rinviano alla legenda tradotta. Sabbia cresce verso sinistra, argilla verso l’alto e limo lungo il lato destro verso il basso. Le guide si incontrano nei valori bilanciati; le percentuali del barattolo restano stime.\n\nInserisci tre percentuali finite da 0 a 100 con somma 100. Un totale arrotondato 99/101 richiede le altezze originali; nessuna normalizzazione silenziosa.\n\nClasse coerente con la convenzione ufficiale di base. Spiega le tre linee: il calcolo non crea misure del campione.\n\nTraccia diagonale sabbia, orizzontale argilla e diagonale limo; confronta l’intersezione con regione numerata e legenda.\n\n30/30/40 è sulla soglia 40% argilla; il file ufficiale lo include in argilla. Convenzione esplicita, non supposizione dal colore.\n\nSabbia\n\nSabbia franca\n\nFranco sabbioso\n\nFranco sabbioso argilloso\n\nFranco\n\nArgilla sabbiosa\n\nFranco argilloso\n\nArgilla limosa\n\nFranco limoso argilloso\n\nFranco limoso\n\nLimo\n\nArgilla', 'Confini e disuguaglianze provengono dal file ufficiale u esse di a duemilaventiquattro. I numeri rinviano alla legenda tradotta. Sabbia cresce verso sinistra, argilla verso l’alto e limo lungo il lato destro verso il basso. Le guide si incontrano nei valori bilanciati; le percentuali del barattolo restano stime.\n\nInserisci tre percentuali finite da zero a cento con somma cento. Un totale arrotondato novantanove o centouno richiede le altezze originali; nessuna normalizzazione silenziosa.\n\nClasse coerente con la convenzione ufficiale di base. Spiega le tre linee: il calcolo non crea misure del campione.\n\nTraccia diagonale sabbia, orizzontale argilla e diagonale limo; confronta l’intersezione con regione numerata e legenda.\n\ntrenta, trenta, quaranta è sulla soglia quaranta per cento argilla; il file ufficiale lo include in argilla. Convenzione esplicita, non supposizione dal colore.\n\nSabbia\n\nSabbia franca\n\nFranco sabbioso\n\nFranco sabbioso argilloso\n\nFranco\n\nArgilla sabbiosa\n\nFranco argilloso\n\nArgilla limosa\n\nFranco limoso argilloso\n\nFranco limoso\n\nLimo\n\nArgilla'), ("Misurare tre barattoli reali\n\nI tre barattoli personali identificati in S2-11 hanno vere osservazioni iniziali, successive e finali secondo il procedimento sicuro dichiarato dal formatore. Un barattolo preparato separato serve solo a esercitarsi.\n\nAbbina ogni barattolo all'identificativo e al registro orario precedente\n\nControlla il limite finale reale e annota disturbi o incertezze\n\nPone il righello dal fondo e legge ogni segno cumulativo in mm\n\nSottrae segni consecutivi per gli spessori di sabbia, limo e argilla\n\nMisura l'altezza minerale totale e verifica che gli spessori la sommino\n\nRegistra tre righe distinte A, B e C distinguendo eventuali esempi forniti", "Misurare tre barattoli reali\n\nI tre barattoli personali identificati in fase undici della stazione due hanno vere osservazioni iniziali, successive e finali secondo il procedimento sicuro dichiarato dal formatore. Un barattolo preparato separato serve solo a esercitarsi.\n\nAbbina ogni barattolo all'identificativo e al registro orario precedente\n\nControlla il limite finale reale e annota disturbi o incertezze\n\nPone il righello dal fondo e legge ogni segno cumulativo in millimetri \n\nSottrae segni consecutivi per gli spessori di sabbia, limo e argilla\n\nMisura l'altezza minerale totale e verifica che gli spessori la sommino\n\nRegistra tre righe distinte A, B e C distinguendo eventuali esempi forniti"), ("Per ciascuno dei tre propri barattoli identificati, lo studente indica fondo, limiti di sabbia e limo e limite minerale finale dopo il tempo dichiarato; registra quote in mm, sottrae segni successivi per ogni strato e annota confini incerti.\n\nSupera se il formatore osserva misure rintracciabili e aritmeticamente coerenti di tutti e tre i barattoli. Il barattolo dimostrativo già pronto o una tabella con numeri forniti non sostituiscono la prova.\n\nUsa spessore dello strato / spessore minerale totale ×100 per tutte e tre le frazioni, mostra il denominatore e la cancellazione dei mm, ricava una frazione mancante per sottrazione e distingue un totale vicino a 100% per arrotondamento da un errore di misura o calcolo.\n\nSupera con denominatore, calcoli e controllo del totale motivati; un numero fisso di domande o un risultato inspiegato della calcolatrice non basta.\n\nSegue le scale stampate di sabbia, argilla e limo nella direzione corretta e la loro intersezione; dà franco sabbioso per 55/30/15, franco per 40/40/20 e argilloso per 15/30/55, spiegando che una stima per altezza nel barattolo resta provvisoria.\n\nSupera quando classe e ragionamento sulle linee coincidono sul grafico scelto. La calcolatrice può confermare l'esempio, ma non produrre le misure personali.", "Per ciascuno dei tre propri barattoli identificati, lo studente indica fondo, limiti di sabbia e limo e limite minerale finale dopo il tempo dichiarato; registra quote in millimetri, sottrae segni successivi per ogni strato e annota confini incerti.\n\nSupera se il formatore osserva misure rintracciabili e aritmeticamente coerenti di tutti e tre i barattoli. Il barattolo dimostrativo già pronto o una tabella con numeri forniti non sostituiscono la prova.\n\nUsa spessore dello strato diviso per spessore minerale totale moltiplicato per cento per tutte e tre le frazioni, mostra il denominatore e la cancellazione dei millimetri, ricava una frazione mancante per sottrazione e distingue un totale vicino a cento per cento per arrotondamento da un errore di misura o calcolo.\n\nSupera con denominatore, calcoli e controllo del totale motivati; un numero fisso di domande o un risultato inspiegato della calcolatrice non basta.\n\nSegue le scale stampate di sabbia, argilla e limo nella direzione corretta e la loro intersezione; dà franco sabbioso per cinquantacinque, trenta, quindici, franco per quaranta, quaranta, venti e argilloso per quindici, trenta, cinquantacinque, spiegando che una stima per altezza nel barattolo resta provvisoria.\n\nSupera quando classe e ragionamento sulle linee coincidono sul grafico scelto. La calcolatrice può confermare l'esempio, ma non produrre le misure personali."), ('Quote e tempi ignoti restano vuoti con spiegazione. Note provvisorie non provano misure, cronologia, approvazione o risultati di laboratorio.\n\nID campione e proprio barattolo/esempio\n\nMetodo, storia reale di sedimentazione e ora osservata\n\nRiferimento fondo e quote cumulative sabbia/limo/finale, mm\n\nSpessori distinti sabbia/limo/argilla e totale, mm\n\nPercentuali sabbia/limo/argilla non arrotondate\n\nPercentuali arrotondate e controllo somma\n\nRiferimento triangolo, intersezione e classe provvisoria\n\nInterfaccia incerta, dati mancanti e prossima azione\n\nCommento individuale del formatore e data (vuoto)\n\nBozza locale salvata; criterio di misurazione non osservato.\n\nIl modello dopo il tentativo non approva semanticamente né certifica una prestazione pratica.\n\nCompleta prima le righe identificate. Non inventare osservazioni per aprire un esempio.\n\nCalcolo e tracciamento; misura reale non osservata\n\nScheda di misura degli strati e tessitura', 'Quote e tempi ignoti restano vuoti con spiegazione. Note provvisorie non provano misure, cronologia, approvazione o risultati di laboratorio.\n\nID campione e indicazione se si tratta del proprio barattolo o di un esempio\n\nMetodo, storia reale di sedimentazione e ora osservata\n\nRiferimento fondo e quote cumulative sabbia, limo, finale, millimetri \n\nSpessori distinti sabbia, limo, argilla e totale, millimetri \n\nPercentuali sabbia, limo, argilla non arrotondate\n\nPercentuali arrotondate e controllo somma\n\nRiferimento triangolo, intersezione e classe provvisoria\n\nInterfaccia incerta, dati mancanti e prossima azione\n\nCommento individuale del formatore e data (vuoto)\n\nBozza locale salvata; criterio di misurazione non osservato.\n\nIl modello dopo il tentativo non approva semanticamente né certifica una prestazione pratica.\n\nCompleta prima le righe identificate. Non inventare osservazioni per aprire un esempio.\n\nCalcolo e tracciamento; misura reale non osservata\n\nScheda di misura degli strati e tessitura'), ("Un barattolo didattico separato preparato per 48 ore serve solo a esercitare la misura. La tappa precedente copre la preparazione, voci 1–6; qui le voci 7–12 riguardano altezza totale, spessori distinti di sabbia, limo e argilla, tre percentuali e registrazione chiara. I tuoi barattoli richiedono osservazioni successive reali e verifica del formatore.\n\nMisurare l'altezza minerale totale in mm\n\nMisurare lo spessore distinto della sabbia in mm\n\nMisurare lo spessore distinto del limo in mm\n\nMisurare lo spessore distinto dell'argilla in mm\n\nCalcolare le percentuali di sabbia, limo e argilla\n\nRegistrare chiaramente tutte le percentuali\n\nL’attività di dodici voci prosegue: preparazione nella tappa precedente, misura e registrazione qui. Un barattolo dimostrativo preparato non sostituisce i tuoi barattoli osservati individualmente.", "Un barattolo didattico separato preparato per quarantotto ore serve solo a esercitare la misura. La tappa precedente copre la preparazione, voci uno a sei; qui le voci sette a dodici riguardano altezza totale, spessori distinti di sabbia, limo e argilla, tre percentuali e registrazione chiara. I tuoi barattoli richiedono osservazioni successive reali e verifica del formatore.\n\nMisurare l'altezza minerale totale in millimetri \n\nMisurare lo spessore distinto della sabbia in millimetri \n\nMisurare lo spessore distinto del limo in millimetri \n\nMisurare lo spessore distinto dell'argilla in millimetri \n\nCalcolare le percentuali di sabbia, limo e argilla\n\nRegistrare chiaramente tutte le percentuali\n\nL’attività di dodici voci prosegue: preparazione nella tappa precedente, misura e registrazione qui. Un barattolo dimostrativo preparato non sostituisce i tuoi barattoli osservati individualmente.")], 'de': [('Drei echte Gläser messen\n\nDrei individuell bezeichnete Gläser aus S2-11 haben echte frühe, spätere und letzte Beobachtungen nach dem festgelegten sicheren Verfahren. Ein getrenntes vorbereitetes Glas dient nur zum Üben.\n\nJedes Glas der früheren eigenen Kennung und Zeitliste zuordnen\n\nTatsächliche letzte Grenze prüfen und Störungen oder Unsicherheit notieren\n\nLineal unten ansetzen und jede kumulative Marke in mm lesen\n\nAufeinanderfolgende Marken zu Sand-, Schluff- und Tondicken subtrahieren\n\nLetzte gesamte Mineralhöhe messen und die Summe der drei Dicken abgleichen\n\nDrei getrennte Reihen A, B und C notieren und vorgegebene Beispielwerte abgrenzen', 'Drei echte Gläser messen\n\nDrei individuell bezeichnete Gläser aus Schritt elf der Station zwei haben echte frühe, spätere und letzte Beobachtungen nach dem festgelegten sicheren Verfahren. Ein getrenntes vorbereitetes Glas dient nur zum Üben.\n\nJedes Glas der früheren eigenen Kennung und Zeitliste zuordnen\n\nTatsächliche letzte Grenze prüfen und Störungen oder Unsicherheit notieren\n\nLineal unten ansetzen und jede kumulative Marke in Millimeter lesen\n\nAufeinanderfolgende Marken zu Sand-, Schluff- und Tondicken subtrahieren\n\nLetzte gesamte Mineralhöhe messen und die Summe der drei Dicken abgleichen\n\nDrei getrennte Reihen A, B und C notieren und vorgegebene Beispielwerte abgrenzen'), ('Ein gesondertes, über 48 Stunden vorbereitetes Lehrglas dient nur zur Messübung. Die vorige Lernstufe behandelt Vorbereitungspunkte 1–6; Punkte 7–12 hier betreffen Gesamt- und einzelne Sand-, Schluff- und Tonhöhen, alle drei Anteile und klare Aufzeichnung. Deine eigenen Gläser benötigen echte spätere Beobachtungen und Prüfung durch die Lehrkraft.\n\nGesamte Mineralschichthöhe in mm messen\n\nSeparate Sandhöhe in mm messen\n\nSeparate Schluffhöhe in mm messen\n\nSeparate Tonhöhe in mm messen\n\nSand-, Schluff- und Tonanteile berechnen\n\nAlle Prozentwerte eindeutig notieren\n\nDie zwölfteilige Tätigkeit wird fortgesetzt: Vorbereitung in der vorigen Lernstufe, danach Messen und Aufzeichnen hier. Ein vorbereitetes Lehrglas ersetzt nicht deine individuell beobachteten Gläser.', 'Ein gesondertes, über achtundvierzig Stunden vorbereitetes Lehrglas dient nur zur Messübung. Die vorige Lernstufe behandelt Vorbereitungspunkte eins bis sechs; Punkte sieben bis zwölf hier betreffen Gesamt- und einzelne Sand-, Schluff- und Tonhöhen, alle drei Anteile und klare Aufzeichnung. Deine eigenen Gläser benötigen echte spätere Beobachtungen und Prüfung durch die Lehrkraft.\n\nGesamte Mineralschichthöhe in Millimeter messen\n\nSeparate Sandhöhe in Millimeter messen\n\nSeparate Schluffhöhe in Millimeter messen\n\nSeparate Tonhöhe in Millimeter messen\n\nSand-, Schluff- und Tonanteile berechnen\n\nAlle Prozentwerte eindeutig notieren\n\nDie zwölfteilige Tätigkeit wird fortgesetzt: Vorbereitung in der vorigen Lernstufe, danach Messen und Aufzeichnen hier. Ein vorbereitetes Lehrglas ersetzt nicht deine individuell beobachteten Gläser.'), ('Für jedes der drei eigenen gekennzeichneten Gläser zeigt die lernende Person nach der vorgesehenen Absetzzeit Boden, Sand-, Schluff- und letzte Mineralgrenze; sie misst Höhen in mm, berechnet Schichtdicken aus aufeinanderfolgenden Marken und benennt unklare Übergänge.\n\nBestanden, wenn die Lehrkraft Messungen an allen drei eigenen Gläsern beobachtet hat und Kennung sowie Rechnung nachvollziehbar sind. Ein Demonstrationsglas oder vorgegebene Wertetabelle genügt nicht.\n\nSchichtdicke / gesamte Mineralschichthöhe ×100 wird für drei Fraktionen benutzt, Nenner und Kürzung der mm gezeigt, eine fehlende Fraktion durch Subtraktion ermittelt und eine rundungsbedingte Summe nahe 100% von Mess- oder Rechenfehlern unterschieden.\n\nBestanden bei richtigem Nenner, nachvollziehbaren Rechnungen und begründeter Summenprüfung; eine starre Fragenzahl oder unerklärte Rechnerantwort genügt nicht.\n\nDie gedruckten Sand-, Ton- und Schluffachsen werden in der richtigen Richtung bis zur Schnittstelle verfolgt; die Klassen sind sandiger Lehm für 55/30/15, Lehm für 40/40/20 und Ton für 15/30/55. Die Glas-Höhenschätzung wird als vorläufig erklärt.\n\nBestanden, wenn Klassenname und Linienweg auf der angegebenen Grafik übereinstimmen. Der Rechner kann ein Beispiel prüfen, aber keine eigenen Glasdaten erzeugen.', 'Für jedes der drei eigenen gekennzeichneten Gläser zeigt die lernende Person nach der vorgesehenen Absetzzeit Boden, Sand-, Schluff- und letzte Mineralgrenze; sie misst Höhen in Millimeter, berechnet Schichtdicken aus aufeinanderfolgenden Marken und benennt unklare Übergänge.\n\nBestanden, wenn die Lehrkraft Messungen an allen drei eigenen Gläsern beobachtet hat und Kennung sowie Rechnung nachvollziehbar sind. Ein Demonstrationsglas oder vorgegebene Wertetabelle genügt nicht.\n\nSchichtdicke geteilt durch gesamte Mineralschichthöhe mal einhundert wird für drei Fraktionen benutzt, Nenner und Kürzung der Millimeter gezeigt, eine fehlende Fraktion durch Subtraktion ermittelt und eine rundungsbedingte Summe nahe einhundert Prozent von Mess- oder Rechenfehlern unterschieden.\n\nBestanden bei richtigem Nenner, nachvollziehbaren Rechnungen und begründeter Summenprüfung; eine starre Fragenzahl oder unerklärte Rechnerantwort genügt nicht.\n\nDie gedruckten Sand-, Ton- und Schluffachsen werden in der richtigen Richtung bis zur Schnittstelle verfolgt; die Klassen sind sandiger Lehm für fünfundfünfzig, dreißig, fünfzehn, Lehm für vierzig, vierzig, zwanzig und Ton für fünfzehn, dreißig, fünfundfünfzig. Die Glas-Höhenschätzung wird als vorläufig erklärt.\n\nBestanden, wenn Klassenname und Linienweg auf der angegebenen Grafik übereinstimmen. Der Rechner kann ein Beispiel prüfen, aber keine eigenen Glasdaten erzeugen.'), ('Grenzen und Klassifikationsvergleiche stammen aus der offiziellen USDA-Datei 2024. Zahlen verweisen auf die übersetzte USDA-Legende, nicht ein deutsches Klassifikationssystem. Sand nimmt nach links zu, Ton nach oben, Schluff rechts nach unten. Linien treffen sich bei ausgeglichenen Anteilen; Glashöhenanteile bleiben Näherungen.\n\nDrei endliche Prozentwerte von 0 bis 100 mit Summe 100 eingeben. Gerundete 99/101 brauchen Prüfung der Rohhöhen; keine stillschweigende Normalisierung.\n\nKlasse stimmt mit offizieller Grundkonvention. Drei Linien erklären; Rechnung erzeugt keine Probenmessung.\n\nSanddiagonale, waagerechte Tonlinie und Schluffdiagonale verfolgen; Schnittpunkt mit nummeriertem Bereich und Legende vergleichen.\n\n30/30/40 liegt auf der 40%-Tongrenze; offizielle Datei zählt den Punkt zu Ton. Explizite Grenzregel statt Farbraten.\n\nSand\n\nLehmiger Sand\n\nSandiger Lehm\n\nSandig-toniger Lehm\n\nLehm\n\nSandiger Ton\n\nToniger Lehm\n\nSchluffiger Ton\n\nSchluffig-toniger Lehm\n\nSchluffiger Lehm\n\nSchluff\n\nTon', 'Grenzen und Klassifikationsvergleiche stammen aus der offiziellen U Es De A-Datei zweitausendvierundzwanzig. Zahlen verweisen auf die übersetzte U Es De A-Legende, nicht ein deutsches Klassifikationssystem. Sand nimmt nach links zu, Ton nach oben, Schluff rechts nach unten. Linien treffen sich bei ausgeglichenen Anteilen; Glashöhenanteile bleiben Näherungen.\n\nDrei endliche Prozentwerte von null bis einhundert mit Summe einhundert eingeben. Gerundete neunundneunzig oder einhunderteins brauchen Prüfung der Rohhöhen; keine stillschweigende Normalisierung.\n\nKlasse stimmt mit offizieller Grundkonvention. Drei Linien erklären; Rechnung erzeugt keine Probenmessung.\n\nSanddiagonale, waagerechte Tonlinie und Schluffdiagonale verfolgen; Schnittpunkt mit nummeriertem Bereich und Legende vergleichen.\n\ndreißig, dreißig, vierzig liegt auf der vierzig Prozent-Tongrenze; offizielle Datei zählt den Punkt zu Ton. Explizite Grenzregel statt Farbraten.\n\nSand\n\nLehmiger Sand\n\nSandiger Lehm\n\nSandig-toniger Lehm\n\nLehm\n\nSandiger Ton\n\nToniger Lehm\n\nSchluffiger Ton\n\nSchluffig-toniger Lehm\n\nSchluffiger Lehm\n\nSchluff\n\nTon'), ('Unbekannte Marken/Zeiten mit Erklärung leer lassen. Entwurfsnotizen bestätigen weder Messung noch Chronologie, Freigabe oder Laborbefund.\n\nProbenkennung und eigenes Glas/Übungsbeispiel\n\nVerfahren, echte Absetzgeschichte und Beobachtungszeit\n\nBodenbezug und Sand-/Schluff-/Endsummenmarken, mm\n\nEinzelne Sand-/Schluff-/Tondicken und Gesamthöhe, mm\n\nUngerundete Sand-/Schluff-/Tonanteile\n\nGerundete Anteile und Summenprüfung\n\nDreiecksreferenz, Schnittpunkt und vorläufige Klasse\n\nUnklare Grenze, fehlende Angaben und nächster Schritt\n\nIndividuelle Rückmeldung der Lehrkraft und Datum (leer)\n\nEntwurf lokal gespeichert; Messkriterium unbeobachtet.\n\nModell nach dem Versuch ist weder semantische Freigabe noch beobachtete Praxis.\n\nZuerst gekennzeichnete Übungszeilen vervollständigen. Keine Beobachtungen zum Freischalten erfinden.\n\nRechnen und Verfolgen; echte Messung unbeobachtet\n\nArbeitsblatt Schichtmessung und Textur', 'Unbekannte Marken, Zeiten mit Erklärung leer lassen. Entwurfsnotizen bestätigen weder Messung noch Chronologie, Freigabe oder Laborbefund.\n\nProbenkennung und Angabe, ob eigenes Glas oder Übungsbeispiel\n\nVerfahren, echte Absetzgeschichte und Beobachtungszeit\n\nBodenbezug und Sand-, Schluff-, Endsummenmarken, Millimeter \n\nEinzelne Sand-, Schluff-, Tondicken und Gesamthöhe, Millimeter \n\nUngerundete Sand-, Schluff-, Tonanteile\n\nGerundete Anteile und Summenprüfung\n\nDreiecksreferenz, Schnittpunkt und vorläufige Klasse\n\nUnklare Grenze, fehlende Angaben und nächster Schritt\n\nIndividuelle Rückmeldung der Lehrkraft und Datum (leer)\n\nEntwurf lokal gespeichert; Messkriterium unbeobachtet.\n\nModell nach dem Versuch ist weder semantische Freigabe noch beobachtete Praxis.\n\nZuerst gekennzeichnete Übungszeilen vervollständigen. Keine Beobachtungen zum Freischalten erfinden.\n\nRechnen und Verfolgen; echte Messung unbeobachtet\n\nArbeitsblatt Schichtmessung und Textur'), ('Veränderbares Lehrglas ·3D\n\nSynthetische Markenübung am vorgegebenen 80 mm-Beispiel, keine Schülermessung. Summenmarken auf 44,68,80 mm stellen; Schichtdicken ergeben sich aus benachbarten Marken. Schwimmendes ausschließen.\n\nVorgegebene 44/68/80 mm-Marken aufsteigend nutzen. Nullsumme, negative oder vertauschte Marken sind ungültig.\n\nJede Dicke durch gesamte Mineralhöhe teilen, nicht durch Zwischenmarke oder eigene Dicke.\n\nBenachbarte Marken subtrahieren, durch 80 mm teilen und mit 100 multiplizieren. Übungsgenauigkeit 0.1 mm und 0.1 Prozentpunkt, keine Labortoleranz.\n\nBeispiel ergibt 44/24/12 mm und 55/30/15%. Nur vorgegebene Rechnung geprüft; individuelle Messung bleibt unbeobachtet.', 'Veränderbares Lehrglas ; dreidimensional\n\nSynthetische Markenübung am vorgegebenen achtzig Millimeter -Beispiel, keine Schülermessung. Summenmarken auf vierundvierzig, achtundsechzig, achtzig Millimeter stellen; Schichtdicken ergeben sich aus benachbarten Marken. Schwimmendes ausschließen.\n\nVorgegebene vierundvierzig, achtundsechzig, achtzig Millimeter -Marken aufsteigend nutzen. Nullsumme, negative oder vertauschte Marken sind ungültig.\n\nJede Dicke durch gesamte Mineralhöhe teilen, nicht durch Zwischenmarke oder eigene Dicke.\n\nBenachbarte Marken subtrahieren, durch achtzig Millimeter teilen und mit einhundert multiplizieren. Übungsgenauigkeit null Komma eins Millimeter und null Komma eins Prozentpunkt, keine Labortoleranz.\n\nBeispiel ergibt vierundvierzig, vierundzwanzig, zwölf Millimeter und fünfundfünfzig, dreißig, fünfzehn Prozent. Nur vorgegebene Rechnung geprüft; individuelle Messung bleibt unbeobachtet.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s212-lab-audio-20261023-r1'
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
    assert count < 6, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 24,'maximumCallsForLane':6,
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
    assert all(v<=6 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':6,'maximumBlindReviewPerLane':6,'maximumASRPerLane':6,'maximumTTSAggregate':24,'maximumBlindAggregate':24,'maximumASRAggregate':24,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
