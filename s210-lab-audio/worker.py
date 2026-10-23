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
IDS = ('S2-10-ar-EG-demonstration-guidance-r1', 'S2-10-ar-EG-formula-guidance-r1', 'S2-10-ar-EG-knowledge-completion-r1', 'S2-10-ar-EG-record-guidance-r1', 'S2-10-en-demonstration-guidance-r1', 'S2-10-en-formula-guidance-r1', 'S2-10-en-knowledge-completion-r1', 'S2-10-en-record-guidance-r1', 'S2-10-it-demonstration-guidance-r1', 'S2-10-it-formula-guidance-r1', 'S2-10-it-knowledge-completion-r1', 'S2-10-it-record-guidance-r1', 'S2-10-de-demonstration-guidance-r1', 'S2-10-de-formula-guidance-r1', 'S2-10-de-knowledge-completion-r1', 'S2-10-de-record-guidance-r1')
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
    assert(req['scope'],req['stepId'])==('S210_LAB_16_FULL_SOURCE_LOI_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-10')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s210-lab-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['demonstration-guidance', 'formula-guidance', 'knowledge-completion', 'record-guidance']
        voice='Charon'if group in['formula-guidance', 'record-guidance']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'demonstration-guidance': ['/loiPractice/ui/modelHelp', '/loiPractice/physical', '/loiPractice/ui/steps/0', '/loiPractice/ui/steps/1', '/loiPractice/ui/steps/2', '/loiPractice/ui/steps/3', '/loiPractice/ui/steps/4', '/loiPractice/ui/orderGood', '/loiPractice/accessibility'], 'formula-guidance': ['/loiPractice/formula/variables/C', '/loiPractice/formula/variables/D', '/loiPractice/formula/variables/I', '/loiPractice/formula/expression', '/loiPractice/formula/example/provenance', '/loiPractice/formula/methodBoundary', '/loiPractice/ui/fiction', '/loiPractice/ui/rounding'], 'knowledge-completion': ['/loiPractice/passChecks/0/evidence', '/loiPractice/passChecks/0/decision', '/loiPractice/passChecks/1/evidence', '/loiPractice/passChecks/1/decision', '/loiPractice/passChecks/2/evidence', '/loiPractice/passChecks/2/decision'], 'record-guidance': ['/loiPractice/ui/recordHelp', '/loiPractice/ui/fields/0', '/loiPractice/ui/fields/1', '/loiPractice/ui/fields/2', '/loiPractice/ui/fields/3', '/loiPractice/ui/fields/4', '/loiPractice/ui/fields/5', '/loiPractice/ui/saved', '/loiPractice/ui/reasonBoundary', '/loiPractice/ui/tableWarning', '/studentDownloads/0/title']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or '/cases/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nهوية العينة والبوتقة الفعليتين\n\nاسم طريقة المعمل وإجراءه والمشغّل المؤهل\n\nتأكيد أساس التربة المجففة في الفرن وفحص الميزان\n\nظروف الحرق والتبريد المحددة اللي بيوفرها المدرّب\n\nأوزان C وD وI المسجلة ووحداتها؛ المجهول يفضل فاضي\n\nفقد غير عضوي محتمل ودليل التفسير المحلي\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nالإجابة النموذجية بتظهر بعد محاولتك. ده مش تقييم لمعنى تفسيرك ولا اعتماد لمهارة عملية.\n\nده مثال الفصل القديم بس: <2%، و3–6%، و>6%. الفراغ 2–3% متساب زي ما هو؛ نفس الهدف مش مناسب لكل تربة.\n\nورقة تدريب حساب الفقد بالحرق', 'استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nهوية العينة والبوتقة الفعليتين\n\nاسم طريقة المعمل وإجراءه والمشغّل المؤهل\n\nتأكيد أساس التربة المجففة في الفرن وفحص الميزان\n\nظروف الحرق والتبريد المحددة اللي بيوفرها المدرّب\n\nأوزان سي ودي وآي المسجلة ووحداتها؛ المجهول يفضل فاضي\n\nفقد غير عضوي محتمل ودليل التفسير المحلي\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nالإجابة النموذجية بتظهر بعد محاولتك. ده مش تقييم لمعنى تفسيرك ولا اعتماد لمهارة عملية.\n\nده مثال الفصل القديم بس: أقل من اتنين في المية، وتلاتة إلى ستة في المية، وأكبر من ستة في المية. الفراغ اتنين إلى تلاتة في المية متساب زي ما هو؛ نفس الهدف مش مناسب لكل تربة.\n\nورقة تدريب حساب الفقد بالحرق'), ('البوتقة الجافة الفارغة، بالجرام\n\nالبوتقة والتربة المجففة في الفرن قبل الحرق، بالجرام\n\nالبوتقة بعد تبريدها مع البقايا عقب الحرق، بالجرام\n\nLOI% = 100 × (D − I) / (D − C)\n\nأرقام مصطنعة لتدريب الحساب، وليست قياسًا من المصدر أو الحقل\n\nاكتب نسبة الفقد على أساس التربة المجففة في الفرن مع تحديد طريقة المعمل؛ ولا تعتبرها تلقائيًا النسبة الدقيقة للمادة العضوية\n\nكل رقم بتكتبه هنا للتدريب بس. تعديله مش قياس تربة ولا اختيار لطريقة معمل.\n\nدقة التدريب: الأوزان لـ0.01 g، وLOI لـ0.1 نقطة مئوية. ده سماح تعليمي، مش مواصفة معمل.', 'سي: البوتقة الجافة الفارغة، بالجرام\n\nدي: البوتقة والتربة المجففة في الفرن قبل الحرق، بالجرام\n\nآي: البوتقة بعد تبريدها مع البقايا عقب الحرق، بالجرام\n\nإل أو آي في المية بتساوي مية مضروبة في ناتج دي ناقص آي، مقسوم على ناتج دي ناقص سي\n\nأرقام مصطنعة لتدريب الحساب، ومش قياس من المصدر أو الحقل\n\nاكتب نسبة الفقد على أساس التربة المجففة في الفرن مع تحديد طريقة المعمل؛ ولا تعتبرها بشكل تلقائي النسبة الدقيقة للمادة العضوية\n\nكل رقم بتكتبه هنا للتدريب بس. تعديله مش قياس تربة ولا اختيار لطريقة معمل.\n\nدقة التدريب: الأوزان لأقرب صفر فاصلة صفر واحد جرام، ونسبة إل أو آي لأقرب صفر فاصلة واحد نقطة مئوية. ده سماح تعليمي، مش مواصفة معمل.'), ('الطالب يرتب ويشرح البوتقة الفارغة ثم التربة المجففة في الفرن معها، والحرق المضبوط، والتبريد الآمن، والوزن النهائي؛ ويحدد ضرورة طريقة الموقع والعامل المؤهل.\n\nالاجتياز بشرح صحيح وحدود سلامة واضحة. مشاهدة العرض لا تعطي الطالب كفاءة تشغيل الفرن.\n\nالطالب يحسب كتلة التربة الجافة والفقد بعد الحرق مع إلغاء كتلة البوتقة، ثم يقسم الفقد على التربة الجافة. في المثال: (35.00−34.75)/(35.00−30.00)×100 = 5.0% LOI.\n\nالاجتياز بمقام وحساب ووحدة نسبة صحيحين، مع توضيح إن الأرقام مثال مصطنع. نسبة من غير طريقة أو أوزان ما تكفيش.\n\nالطالب يوضح إن رطوبة متبقية أو ماء مرتبط بالطين أو فقدًا غير عضوي آخر ممكن يؤثر على LOI حسب الطريقة والتربة؛ ويعامل 3–6% كمثال فصل ويسأل عن سياق الأرض والمناخ والمعمل.\n\nالاجتياز بذكر تداخل صحيح واحد وحد واحد للطريقة أو الموقع. ادعاء إن الرقم هو المادة العضوية بالضبط أو إن كل أرض خارج 3–6% غير صحية لا يجتاز.', 'الطالب يرتب ويشرح البوتقة الفارغة ثم التربة المجففة في الفرن معها، والحرق المضبوط، والتبريد الآمن، والوزن النهائي؛ ويحدد ضرورة طريقة الموقع والعامل المؤهل.\n\nالاجتياز بشرح صحيح وحدود سلامة واضحة. مشاهدة العرض لا تعطي الطالب كفاءة تشغيل الفرن.\n\nالطالب يحسب كتلة التربة الجافة والفقد بعد الحرق مع إلغاء كتلة البوتقة، ثم يقسم الفقد على التربة الجافة. في المثال: ناتج خمسة وتلاتين فاصلة صفر صفر ناقص أربعة وتلاتين فاصلة سبعة خمسة، مقسوم على ناتج خمسة وتلاتين فاصلة صفر صفر ناقص تلاتين فاصلة صفر صفر، والناتج مضروب في مية بتساوي خمسة فاصلة صفر في المية إل أو آي.\n\nالاجتياز بمقام وحساب ووحدة نسبة صحيحين، مع توضيح إن الأرقام مثال مصطنع. نسبة من غير طريقة أو أوزان ما تكفيش.\n\nالطالب يوضح إن رطوبة متبقية أو ماء مرتبط بالطين أو فقد غير عضوي تاني ممكن يؤثر على إل أو آي حسب الطريقة والتربة؛ ويعامل تلاتة إلى ستة في المية كمثال فصل ويسأل عن سياق الأرض والمناخ والمعمل.\n\nالاجتياز بذكر تداخل صحيح واحد وحد واحد للطريقة أو الموقع. ادعاء إن الرقم هو المادة العضوية بالضبط أو إن كل أرض خارج تلاتة إلى ستة في المية غير صحية لا يجتاز.'), ('نفس البوتقة التوضيحية بتتنقل بين الميزان وفرن مقفول والتبريد المضبوط. شكل المحتويات وحجمها للتوضيح؛ مش عينة مقاسة ولا تعليمات تشغيل. مفيش ضبط حرارة أو مؤقت أو أزرار تشغيل فرن حقيقي.\n\nالمدرّب المؤهل يعمل أي تجفيف وحرق وتبريد ووزن حقيقي حسب إجراء المعمل. الطالب يلاحظ ويسجل الأوزان المعلنة ويفسر الحساب. تدريب الأونلاين بأرقام متخيلة ولا يعطي كفاءة استخدام معدات ساخنة.\n\nسجّل كتلة البوتقة النظيفة والجافة والفاضية: C\n\nضيف التربة المجففة في الفرن وسجّل كتلتها مع البوتقة: D\n\nالمشغّل المؤهل ينفّذ الحرق حسب طريقة المعمل\n\nالمشغّل المؤهل يكمّل التبريد بالطريقة المحددة\n\nسجّل كتلة البوتقة الباردة مع البقايا: I\n\nالترتيب صح. المعمل بيوفر الطريقة كاملة؛ متابعة العرض مش تأهيل للتعامل مع معدات سخنة.\n\nأوزان واضحة عالية التباين وقابلة لتعديل النص، وصيغة مكتوبة، وترتيب بلوحة المفاتيح ونطق للرموز من غير الاعتماد على اللون.', 'نفس البوتقة التوضيحية بتتنقل بين الميزان وفرن مقفول والتبريد المضبوط. شكل المحتويات وحجمها للتوضيح؛ مش عينة مقاسة ولا تعليمات تشغيل. مفيش ضبط حرارة أو مؤقت أو أزرار تشغيل فرن حقيقي.\n\nالمدرّب المؤهل يعمل أي تجفيف وحرق وتبريد ووزن حقيقي حسب إجراء المعمل. الطالب يلاحظ ويسجل الأوزان المعلنة ويفسر الحساب. تدريب الأونلاين بأرقام متخيلة ولا يعطي كفاءة استخدام معدات ساخنة.\n\nسجّل كتلة البوتقة النظيفة والجافة والفاضية: سي\n\nضيف التربة المجففة في الفرن وسجّل كتلتها مع البوتقة: دي\n\nالمشغّل المؤهل ينفّذ الحرق حسب طريقة المعمل\n\nالمشغّل المؤهل يكمّل التبريد بالطريقة المحددة\n\nسجّل كتلة البوتقة الباردة مع البقايا: آي\n\nالترتيب صح. المعمل بيوفر الطريقة كاملة؛ متابعة العرض مش تأهيل للتعامل مع معدات سخنة.\n\nأوزان واضحة عالية التباين وقابلة لتعديل النص، وصيغة مكتوبة، وترتيب بلوحة المفاتيح ونطق للرموز من غير الاعتماد على اللون.')], 'en': [("Learner orders and explains empty crucible, oven-dry soil plus crucible, controlled ignition, safe controlled cooling and final mass, and identifies the site's method and qualified operator as necessary.\n\nPass for a correct explanation and safety boundary; the student does not receive furnace-operation competence from watching a demonstration.\n\nLearner computes dry soil mass and post-ignition loss with crucible cancellation, then divides loss by dry soil mass. In the declared example: (35.00−34.75)/(35.00−30.00)×100 = 5.0% LOI.\n\nPass only with correct denominator, arithmetic, percent unit and explicit illustrative-data label; a percentage without method or masses is insufficient.\n\nLearner states that residual moisture, clay-bound water or other nonorganic mass loss can affect LOI depending on method and soil; interprets 3–6% only as a classroom example and asks for local soil, climate and laboratory context.\n\nPass with at least one correct interference and one site/method limitation. Calling the result exact OM or declaring all soils outside 3–6% unhealthy does not pass.", "Learner orders and explains empty crucible, oven-dry soil plus crucible, controlled ignition, safe controlled cooling and final mass, and identifies the site's method and qualified operator as necessary.\n\nPass for a correct explanation and safety boundary; the student does not receive furnace-operation competence from watching a demonstration.\n\nLearner computes dry soil mass and post-ignition loss with crucible cancellation, then divides loss by dry soil mass. In the declared example: the difference thirty-five point zero zero minus thirty-four point seven five, divided by the difference thirty-five point zero zero minus thirty point zero zero, with the result multiplied by one hundred equals five point zero percent L O I.\n\nPass only with correct denominator, arithmetic, percent unit and explicit illustrative-data label; a percentage without method or masses is insufficient.\n\nLearner states that residual moisture, clay-bound water or other nonorganic mass loss can affect L O I depending on method and soil; interprets three to six percent only as a classroom example and asks for local soil, climate and laboratory context.\n\nPass with at least one correct interference and one site, method limitation. Calling the result exact organic matter or declaring all soils outside three to six percent unhealthy does not pass."), ('Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nActual sample and crucible identifiers\n\nNamed laboratory method/SOP and qualified operator\n\nConfirmed oven-dry basis and balance checks\n\nMethod-defined ignition and cooling conditions supplied by the trainer\n\nRecorded C, D and I masses and units; unknown stays blank\n\nPossible nonorganic loss and local interpretation guide\n\nRow saved locally. No practical result or trainer signature has been created.\n\nThe model is shown after your attempt. This does not semantically grade your explanation or certify a practical skill.\n\nHistoric classroom example only: <2%, 3–6%, >6%. Its 2–3% gap is preserved; the same target does not fit every soil.\n\nLOI calculation worksheet', 'Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nActual sample and crucible identifiers\n\nNamed laboratory method, S O P and qualified operator\n\nConfirmed oven-dry basis and balance checks\n\nMethod-defined ignition and cooling conditions supplied by the trainer\n\nRecorded C, D and I masses and units; unknown stays blank\n\nPossible nonorganic loss and local interpretation guide\n\nRow saved locally. No practical result or trainer signature has been created.\n\nThe model is shown after your attempt. This does not semantically grade your explanation or certify a practical skill.\n\nHistoric classroom example only: less than two percent, three to six percent, greater than six percent. Its two to three percent gap is preserved; the same target does not fit every soil.\n\nL O I calculation worksheet'), ('empty dry crucible, g\n\ncrucible plus oven-dry soil before ignition, g\n\ncooled crucible plus post-ignition residue, g\n\nLOI% = 100 × (D − I) / (D − C)\n\ninvented arithmetic exercise, not source or measured soil\n\nReport percent loss on oven-dry soil by a stated laboratory method; do not equate unconditionally with exact organic matter\n\nEvery number entered here is fictional practice data. Editing it does not measure soil or select a laboratory method.\n\nExercise precision: masses to 0.01 g; LOI to 0.1 percentage point. This is a teaching tolerance, not a laboratory specification.', 'C: empty dry crucible, grams\n\nD: crucible plus oven-dry soil before ignition, grams\n\nI: cooled crucible plus post-ignition residue, grams\n\nL O I percent equals one hundred multiplied by the difference D minus I, divided by the difference D minus C\n\ninvented arithmetic exercise, not source or measured soil\n\nReport percent loss on oven-dry soil by a stated laboratory method; do not equate unconditionally with exact organic matter\n\nEvery number entered here is fictional practice data. Editing it does not measure soil or select a laboratory method.\n\nExercise precision: masses to zero point zero one grams; L O I to zero point one percentage point. This is a teaching tolerance, not a laboratory specification.')], 'it': [("Lo stesso crogiolo schematico passa da bilancia a forno chiuso e raffreddamento controllato. Contenuti e dimensioni sono illustrativi: nessun campione calibrato o istruzione operativa. Nessun comando reale di temperatura, tempo o forno.\n\nUn formatore qualificato svolge essiccazione, ignizione, raffreddamento e pesata reali secondo la procedura locale di laboratorio. Lo studente osserva, annota le masse dichiarate e spiega il calcolo. L'esercizio online usa masse inventate e non conferisce competenza a usare attrezzature calde.\n\nRegistra il crogiolo pulito, asciutto e vuoto: C\n\nAggiungi suolo essiccato e registra la massa complessiva: D\n\nL’operatore qualificato esegue l’ignizione secondo il metodo\n\nL’operatore qualificato completa il raffreddamento controllato\n\nRegistra crogiolo raffreddato e residuo: I\n\nSequenza corretta. Il laboratorio fornisce il metodo completo; osservare non abilita a maneggiare apparecchi caldi.\n\nMasse modificabili e ad alto contrasto, formula in testo, ordinamento accessibile da tastiera e narrazione dei simboli senza dipendere dal colore.", "Lo stesso crogiolo schematico passa da bilancia a forno chiuso e raffreddamento controllato. Contenuti e dimensioni sono illustrativi: nessun campione calibrato o istruzione operativa. Nessun comando reale di temperatura, tempo o forno.\n\nUn formatore qualificato svolge essiccazione, ignizione, raffreddamento e pesata reali secondo la procedura locale di laboratorio. Lo studente osserva, annota le masse dichiarate e spiega il calcolo. L'esercizio online usa masse inventate e non conferisce competenza a usare attrezzature calde.\n\nRegistra il crogiolo pulito, asciutto e vuoto: ci\n\nAggiungi suolo essiccato e registra la massa complessiva: di\n\nL’operatore qualificato esegue l’ignizione secondo il metodo\n\nL’operatore qualificato completa il raffreddamento controllato\n\nRegistra crogiolo raffreddato e residuo: i\n\nSequenza corretta. Il laboratorio fornisce il metodo completo; osservare non abilita a maneggiare apparecchi caldi.\n\nMasse modificabili e ad alto contrasto, formula in testo, ordinamento accessibile da tastiera e narrazione dei simboli senza dipendere dal colore."), ("Lo studente mette in ordine e spiega crogiolo vuoto, suolo essiccato con crogiolo, ignizione controllata, raffreddamento sicuro e pesata finale; riconosce la necessità del metodo locale e di un operatore qualificato.\n\nSupera la verifica con una spiegazione corretta e il limite di sicurezza; osservare la dimostrazione non certifica la capacità di azionare il forno.\n\nLo studente ricava la massa del suolo asciutto e la perdita dopo ignizione eliminando la massa del crogiolo, poi divide la perdita per la massa del suolo asciutto. Nell'esempio: (35.00−34.75)/(35.00−30.00)×100 = 5.0% LOI.\n\nSupera solo con denominatore, calcolo, unità percentuale ed etichetta di dati illustrativi corretti; una percentuale senza metodo e masse non basta.\n\nLo studente indica che, secondo metodo e suolo, umidità residua, acqua legata alle argille o altre perdite inorganiche possono influire sulla LOI; interpreta 3–6% soltanto come esempio didattico e chiede contesto locale e di laboratorio.\n\nSupera indicando almeno un'interferenza corretta e un limite legato a sito o metodo. Non supera se chiama il risultato sostanza organica esatta o giudica malsani tutti i suoli fuori 3–6%.", "Lo studente mette in ordine e spiega crogiolo vuoto, suolo essiccato con crogiolo, ignizione controllata, raffreddamento sicuro e pesata finale; riconosce la necessità del metodo locale e di un operatore qualificato.\n\nSupera la verifica con una spiegazione corretta e il limite di sicurezza; osservare la dimostrazione non certifica la capacità di azionare il forno.\n\nLo studente ricava la massa del suolo asciutto e la perdita dopo ignizione eliminando la massa del crogiolo, poi divide la perdita per la massa del suolo asciutto. Nell'esempio: la differenza tra trentacinque virgola zero zero e trentaquattro virgola sette cinque, divisa per la differenza tra trentacinque virgola zero zero e trenta virgola zero zero, con il risultato moltiplicato per cento uguale a cinque virgola zero per cento elle o i.\n\nSupera solo con denominatore, calcolo, unità percentuale ed etichetta di dati illustrativi corretti; una percentuale senza metodo e masse non basta.\n\nLo studente indica che, secondo metodo e suolo, umidità residua, acqua legata alle argille o altre perdite inorganiche possono influire sulla elle o i; interpreta da tre a sei per cento soltanto come esempio didattico e chiede contesto locale e di laboratorio.\n\nSupera indicando almeno un'interferenza corretta e un limite legato a sito o metodo. Non supera se chiama il risultato sostanza organica esatta o giudica malsani tutti i suoli fuori da tre a sei per cento."), ('Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nIdentità reali di campione e crogiolo\n\nMetodo/SOP e operatore qualificato\n\nConferma base secca e controlli della bilancia\n\nCondizioni di ignizione e raffreddamento fornite dal formatore\n\nMasse C, D e I registrate con unità; ignoto resta vuoto\n\nPossibile perdita inorganica e guida interpretativa locale\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nModello dopo il tentativo: non valuta semanticamente la spiegazione né certifica abilità pratica.\n\nSolo esempio didattico storico: <2%, 3–6%, >6%. Conserva la lacuna 2–3%; il riferimento non vale per ogni suolo.\n\nScheda di calcolo LOI', 'Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nIdentità reali di campione e crogiolo\n\nMetodo, esse o pi e operatore qualificato\n\nConferma base secca e controlli della bilancia\n\nCondizioni di ignizione e raffreddamento fornite dal formatore\n\nMasse ci, di e i registrate con unità; ignoto resta vuoto\n\nPossibile perdita inorganica e guida interpretativa locale\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nModello dopo il tentativo: non valuta semanticamente la spiegazione né certifica abilità pratica.\n\nSolo esempio didattico storico: meno di due per cento, da tre a sei per cento, più di sei per cento. Conserva la lacuna da due a tre per cento; il riferimento non vale per ogni suolo.\n\nScheda di calcolo elle o i'), ("crogiolo asciutto vuoto, g\n\ncrogiolo più suolo essiccato prima dell'ignizione, g\n\ncrogiolo raffreddato più residuo dopo l'ignizione, g\n\nLOI% = 100 × (D − I) / (D − C)\n\nesercizio aritmetico inventato, non dato del manuale né misura del suolo\n\nRiporta la percentuale persa sul suolo essiccato secondo un metodo dichiarato; non equipararla automaticamente alla sostanza organica esatta\n\nTutti i numeri inseriti sono dati inventati di esercizio. Modificarli non misura il suolo e non sceglie un metodo di laboratorio.\n\nPrecisione didattica: masse a 0.01 g e LOI a 0.1 punto percentuale. Non è una specifica di laboratorio.", "ci: crogiolo asciutto vuoto, grammi\n\ndi: crogiolo più suolo essiccato prima dell'ignizione, grammi\n\ni: crogiolo raffreddato più residuo dopo l'ignizione, grammi\n\nelle o i per cento uguale a cento moltiplicato per la differenza di meno i, diviso per la differenza di meno ci\n\nesercizio aritmetico inventato, non dato del manuale né misura del suolo\n\nRiporta la percentuale persa sul suolo essiccato secondo un metodo dichiarato; non equipararla automaticamente alla sostanza organica esatta\n\nTutti i numeri inseriti sono dati inventati di esercizio. Modificarli non misura il suolo e non sceglie un metodo di laboratorio.\n\nPrecisione didattica: masse a zero virgola zero uno grammi e elle o i a zero virgola uno punto percentuale. Non è una specifica di laboratorio.")], 'de': [('Derselbe schematische Tiegel wechselt zwischen Waage, geschlossenem Ofen und kontrollierter Abkühlung. Inhalt und Größe sind nur anschaulich, keine kalibrierte Probe oder Arbeitsanweisung. Keine echten Temperatur-, Zeit- oder Ofenbedienelemente.\n\nEine qualifizierte Lehrkraft führt echtes Trocknen, Glühen, Abkühlen und Wiegen gemäß örtlichem Laborverfahren durch. Lernende beobachten, notieren genannte Massen und erklären die Rechnung. Die Online-Übung nutzt erfundene Massen und vermittelt keine eigenständige Befähigung für heiße Geräte.\n\nSauberen, trockenen, leeren Tiegel erfassen: C\n\nOfentrockenen Boden zugeben und Gesamtmasse erfassen: D\n\nQualifizierte Fachkraft glüht nach dem Laborverfahren\n\nQualifizierte Fachkraft beendet kontrollierte Abkühlung\n\nAbgekühlten Tiegel mit Rückstand erfassen: I\n\nReihenfolge stimmt. Das Labor liefert das vollständige Verfahren; Zuschauen befähigt nicht zum Umgang mit heißen Geräten.\n\nÄnderbare kontrastreiche Massenwerte, Formel als Text, per Tastatur bedienbare Sortierung und gesprochene Symbole ohne Abhängigkeit von Farben.', 'Derselbe schematische Tiegel wechselt zwischen Waage, geschlossenem Ofen und kontrollierter Abkühlung. Inhalt und Größe sind nur anschaulich, keine kalibrierte Probe oder Arbeitsanweisung. Keine echten Temperatur-, Zeit- oder Ofenbedienelemente.\n\nEine qualifizierte Lehrkraft führt echtes Trocknen, Glühen, Abkühlen und Wiegen gemäß örtlichem Laborverfahren durch. Lernende beobachten, notieren genannte Massen und erklären die Rechnung. Die Online-Übung nutzt erfundene Massen und vermittelt keine eigenständige Befähigung für heiße Geräte.\n\nSauberen, trockenen, leeren Tiegel erfassen: Ce\n\nOfentrockenen Boden zugeben und Gesamtmasse erfassen: De\n\nQualifizierte Fachkraft glüht nach dem Laborverfahren\n\nQualifizierte Fachkraft beendet kontrollierte Abkühlung\n\nAbgekühlten Tiegel mit Rückstand erfassen: I\n\nReihenfolge stimmt. Das Labor liefert das vollständige Verfahren; Zuschauen befähigt nicht zum Umgang mit heißen Geräten.\n\nÄnderbare kontrastreiche Massenwerte, Formel als Text, per Tastatur bedienbare Sortierung und gesprochene Symbole ohne Abhängigkeit von Farben.'), ('Die lernende Person ordnet und erklärt den leeren Tiegel, Tiegel mit ofentrockenem Boden, kontrolliertes Glühen, sicheres kontrolliertes Abkühlen und Schlusswägung und benennt das örtliche Verfahren sowie qualifiziertes Personal als Voraussetzung.\n\nBestanden bei richtiger Erklärung und klarer Sicherheitsgrenze; das Beobachten der Vorführung bescheinigt keine Befähigung, den Ofen zu bedienen.\n\nDie lernende Person ermittelt Trockenbodenmasse und Glühverlust unter Abzug der Tiegelmasse und teilt den Verlust durch die Trockenbodenmasse. Im gekennzeichneten Beispiel: (35.00−34.75)/(35.00−30.00)×100 = 5.0% LOI.\n\nNur bestanden mit richtigem Nenner, Rechenweg, Prozentangabe und Kennzeichnung als erfundene Beispieldaten; ein Prozentsatz ohne Verfahren und Massen genügt nicht.\n\nDie lernende Person nennt, dass Restfeuchte, in Tonmineralen gebundenes Wasser oder andere anorganische Massenverluste je nach Boden und Methode LOI beeinflussen können; sie betrachtet 3–6% nur als Unterrichtsbeispiel und fragt nach Standort- und Laborkontext.\n\nBestanden mit mindestens einem richtigen Störfaktor und einer standort- oder verfahrensbezogenen Grenze. Die Aussage, das Ergebnis sei exakt organische Substanz oder alle Böden außerhalb von 3–6% seien ungesund, ist falsch.', 'Die lernende Person ordnet und erklärt den leeren Tiegel, Tiegel mit ofentrockenem Boden, kontrolliertes Glühen, sicheres kontrolliertes Abkühlen und Schlusswägung und benennt das örtliche Verfahren sowie qualifiziertes Personal als Voraussetzung.\n\nBestanden bei richtiger Erklärung und klarer Sicherheitsgrenze; das Beobachten der Vorführung bescheinigt keine Befähigung, den Ofen zu bedienen.\n\nDie lernende Person ermittelt Trockenbodenmasse und Glühverlust unter Abzug der Tiegelmasse und teilt den Verlust durch die Trockenbodenmasse. Im gekennzeichneten Beispiel: die Differenz fünfunddreißig Komma null null minus vierunddreißig Komma sieben fünf, geteilt durch die Differenz fünfunddreißig Komma null null minus dreißig Komma null null, das Ergebnis mal einhundert gleich fünf Komma null Prozent El O I.\n\nNur bestanden mit richtigem Nenner, Rechenweg, Prozentangabe und Kennzeichnung als erfundene Beispieldaten; ein Prozentsatz ohne Verfahren und Massen genügt nicht.\n\nDie lernende Person nennt, dass Restfeuchte, in Tonmineralen gebundenes Wasser oder andere anorganische Massenverluste je nach Boden und Methode El O I beeinflussen können; sie betrachtet drei bis sechs Prozent nur als Unterrichtsbeispiel und fragt nach Standort- und Laborkontext.\n\nBestanden mit mindestens einem richtigen Störfaktor und einer standort- oder verfahrensbezogenen Grenze. Die Aussage, das Ergebnis sei exakt organische Substanz oder alle Böden außerhalb von drei bis sechs Prozent seien ungesund, ist falsch.'), ('Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nEchte Proben- und Tiegelkennung\n\nLaborverfahren/SOP und qualifizierte Fachkraft\n\nBestätigte Trockenbasis und Waagenkontrollen\n\nVon Lehrkraft genannte Glüh- und Abkühlbedingungen\n\nErfasste C-, D- und I-Massen mit Einheit; Unbekanntes bleibt leer\n\nMöglicher anorganischer Verlust und örtliche Deutungshilfe\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nModell nach dem Versuch: keine semantische Bewertung oder Bescheinigung praktischer Kompetenz.\n\nNur historisches Lehrbeispiel: <2%, 3–6%, >6%. Lücke 2–3% bleibt; kein einheitlicher Zielwert für alle Böden.\n\nArbeitsblatt LOI-Berechnung', 'Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nEchte Proben- und Tiegelkennung\n\nLaborverfahren, Es O Pe und qualifizierte Fachkraft\n\nBestätigte Trockenbasis und Waagenkontrollen\n\nVon Lehrkraft genannte Glüh- und Abkühlbedingungen\n\nErfasste Ce-, De- und I-Massen mit Einheit; Unbekanntes bleibt leer\n\nMöglicher anorganischer Verlust und örtliche Deutungshilfe\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nModell nach dem Versuch: keine semantische Bewertung oder Bescheinigung praktischer Kompetenz.\n\nNur historisches Lehrbeispiel: kleiner als zwei Prozent, drei bis sechs Prozent, größer als sechs Prozent. Lücke zwei bis drei Prozent bleibt; kein einheitlicher Zielwert für alle Böden.\n\nArbeitsblatt El O I-Berechnung'), ('leerer trockener Tiegel, g\n\nTiegel mit ofentrockenem Boden vor dem Glühen, g\n\nabgekühlter Tiegel mit Rückstand nach dem Glühen, g\n\nLOI% = 100 × (D − I) / (D − C)\n\nerfundene Rechenübung, weder Quellenwert noch Bodenmessung\n\nProzentualen Verlust bezogen auf ofentrockenen Boden mit genanntem Laborverfahren berichten; nicht bedingungslos mit exakter organischer Substanz gleichsetzen\n\nAlle hier eingegebenen Zahlen sind erfundene Übungsdaten. Änderungen messen keinen Boden und wählen kein Laborverfahren.\n\nÜbungsgenauigkeit: Massen auf 0.01 g und LOI auf 0.1 Prozentpunkt. Keine Laborspezifikation.', 'Ce: leerer trockener Tiegel, Gramm\n\nDe: Tiegel mit ofentrockenem Boden vor dem Glühen, Gramm\n\nI: abgekühlter Tiegel mit Rückstand nach dem Glühen, Gramm\n\nEl O I Prozent gleich einhundert mal die Differenz De minus I, geteilt durch die Differenz De minus Ce\n\nerfundene Rechenübung, weder Quellenwert noch Bodenmessung\n\nProzentualen Verlust bezogen auf ofentrockenen Boden mit genanntem Laborverfahren berichten; nicht bedingungslos mit exakter organischer Substanz gleichsetzen\n\nAlle hier eingegebenen Zahlen sind erfundene Übungsdaten. Änderungen messen keinen Boden und wählen kein Laborverfahren.\n\nÜbungsgenauigkeit: Massen auf null Komma null eins Gramm und El O I auf null Komma eins Prozentpunkt. Keine Laborspezifikation.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s210-lab-audio-20261023-r1'
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
