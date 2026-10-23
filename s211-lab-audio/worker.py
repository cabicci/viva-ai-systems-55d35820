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
IDS = ('S2-11-ar-EG-staged-observation-guidance-r1', 'S2-11-ar-EG-source-card-guidance-r1', 'S2-11-ar-EG-practical-setup-r1', 'S2-11-ar-EG-practical-return-r1', 'S2-11-ar-EG-knowledge-completion-r1', 'S2-11-ar-EG-record-guidance-r1', 'S2-11-ar-EG-facilitation-and-materials-r1', 'S2-11-en-staged-observation-guidance-r1', 'S2-11-en-source-card-guidance-r1', 'S2-11-en-practical-setup-r1', 'S2-11-en-practical-return-r1', 'S2-11-en-knowledge-completion-r1', 'S2-11-en-record-guidance-r1', 'S2-11-en-facilitation-and-materials-r1', 'S2-11-it-staged-observation-guidance-r1', 'S2-11-it-source-card-guidance-r1', 'S2-11-it-practical-setup-r1', 'S2-11-it-practical-return-r1', 'S2-11-it-knowledge-completion-r1', 'S2-11-it-record-guidance-r1', 'S2-11-it-facilitation-and-materials-r1', 'S2-11-de-staged-observation-guidance-r1', 'S2-11-de-source-card-guidance-r1', 'S2-11-de-practical-setup-r1', 'S2-11-de-practical-return-r1', 'S2-11-de-knowledge-completion-r1', 'S2-11-de-record-guidance-r1', 'S2-11-de-facilitation-and-materials-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==28
    assert(req['scope'],req['stepId'])==('S211_LAB_28_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-11')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s211-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==28
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(7))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['staged-observation-guidance', 'source-card-guidance', 'practical-setup', 'practical-return', 'knowledge-completion', 'record-guidance', 'facilitation-and-materials']
        voice='Charon'if group in['source-card-guidance', 'practical-return', 'record-guidance']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'staged-observation-guidance': ['/jarPractice/ui/modelHelp', '/jarPractice/trainerLink', '/jarPractice/ui/stages/0', '/jarPractice/ui/stages/1', '/jarPractice/ui/stages/2', '/jarPractice/ui/stages/3', '/jarPractice/ui/stages/4', '/jarPractice/ui/layers/0', '/jarPractice/ui/layers/1', '/jarPractice/ui/layers/2', '/jarPractice/ui/layers/3', '/jarPractice/ui/orderGood', '/jarPractice/ui/timeGood'], 'source-card-guidance': ['/jarPractice/card/scenario', '/jarPractice/card/observedRows/0/sourceCriterion', '/jarPractice/card/observedRows/1/sourceCriterion', '/jarPractice/card/observedRows/2/sourceCriterion', '/jarPractice/card/observedRows/3/sourceCriterion', '/jarPractice/card/observedRows/4/sourceCriterion', '/jarPractice/card/observedRows/5/sourceCriterion', '/jarPractice/card/observedRows/6/sourceCriterion', '/jarPractice/card/observedRows/7/sourceCriterion', '/jarPractice/card/observedRows/8/sourceCriterion', '/jarPractice/card/observedRows/9/sourceCriterion', '/jarPractice/card/observedRows/10/sourceCriterion', '/jarPractice/card/observedRows/11/sourceCriterion', '/jarPractice/card/adaptation', '/jarPractice/ui/cupNote'], 'practical-setup': ['/jarPractice/practical/0/title', '/jarPractice/practical/0/conditions', '/jarPractice/practical/0/observationRows/0', '/jarPractice/practical/0/observationRows/1', '/jarPractice/practical/0/observationRows/2', '/jarPractice/practical/0/observationRows/3', '/jarPractice/practical/0/observationRows/4', '/jarPractice/practical/0/observationRows/5', '/jarPractice/practical/0/observationRows/6'], 'practical-return': ['/jarPractice/practical/1/title', '/jarPractice/practical/1/conditions', '/jarPractice/practical/1/observationRows/0', '/jarPractice/practical/1/observationRows/1', '/jarPractice/practical/1/observationRows/2', '/jarPractice/practical/1/observationRows/3', '/jarPractice/practical/1/observationRows/4', '/jarPractice/practical/1/observationRows/5'], 'knowledge-completion': ['/jarPractice/passChecks/0/evidence', '/jarPractice/passChecks/0/decision', '/jarPractice/passChecks/1/evidence', '/jarPractice/passChecks/1/decision', '/jarPractice/passChecks/2/evidence', '/jarPractice/passChecks/2/decision'], 'record-guidance': ['/jarPractice/ui/recordHelp', '/jarPractice/ui/fields/0', '/jarPractice/ui/fields/1', '/jarPractice/ui/fields/2', '/jarPractice/ui/fields/3', '/jarPractice/ui/fields/4', '/jarPractice/ui/fields/5', '/jarPractice/ui/fields/6', '/jarPractice/ui/fields/7', '/jarPractice/ui/fields/8', '/jarPractice/ui/saved', '/jarPractice/ui/reasonBoundary', '/studentDownloads/0/title'], 'facilitation-and-materials': ['/jarPractice/ui/facilitation', '/jarPractice/ui/materials']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('ارجع وعلّم حدود الطبقات الحقيقية\n\nمراحل منفصلة تتجاوز حصة 75 دقيقة؛ الدليل على برطمانات الطالب التلاتة، مش برطمان عرض جاهز.\n\nيسجل ملاحظة الرمل المبكرة وعلامتها حسب الجدول\n\nيرجع لمرحلة السلت ويسجل الوقت والحد الظاهر\n\nيرجع لمرحلة الطين الأخيرة ويسجل الوقت والحد أو عدم وضوحه\n\nيستبعد المادة العضوية الطافية من سجل الطبقات المعدنية\n\nيستخدم إضاءة جانبية من غير تحريك عند الحاجة ويبلغ عن العكارة أو اضطراب العينة\n\nيربط ملاحظات المراحل التلاتة بأسماء العينات نفسها وسجل المدرّب', 'ارجع وعلّم حدود الطبقات الحقيقية\n\nمراحل منفصلة تتجاوز حصة خمسة وسبعين دقيقة؛ الدليل على برطمانات الطالب التلاتة، مش برطمان عرض جاهز.\n\nيسجل ملاحظة الرمل المبكرة وعلامتها حسب الجدول\n\nيرجع لمرحلة السلت ويسجل الوقت والحد الظاهر\n\nيرجع لمرحلة الطين الأخيرة ويسجل الوقت والحد أو عدم وضوحه\n\nيستبعد المادة العضوية الطافية من سجل الطبقات المعدنية\n\nيستخدم إضاءة جانبية من غير تحريك عند الحاجة ويبلغ عن العكارة أو اضطراب العينة\n\nيربط ملاحظات المراحل التلاتة بأسماء العينات نفسها وسجل المدرّب'), ('الطالب يذكر مدى USDA للتربة الناعمة: الرمل 0.05–2 mm، السلت 0.002–0.05 mm، والطين أقل من 0.002 mm، ويفسر التفكيك وترتيب الترسيب ويميز تقدير ارتفاع الطبقات عن النسب الوزنية في التحليل المعملي.\n\nيجتاز إذا صحت الأحجام والحدود. الوزن وحده، من غير حجم وكثافة وتكتل وطريقة التفكيك، مش تفسير كافٍ.\n\nالمدرّب يتحقق من أسماء عينات الطالب التلاتة، وسلامة الوعاء والغطاء، وتجهيز التربة، وكميات التربة والميه ومادة التفكيك المسجلة، والخلط والرجّ ووقت البداية. كميات بطاقة المصدر تُستخدم فقط لو المدرّب اختار الطريقة دي ووثق المنتج والإجراء.\n\nكل بند حرج في كل برطمان لازم يتشاف أو يُعاد بشكل صحيح. مشاهدة زميل أو استخدام برطمان مترسب مسبقًا ما يعوضش التجهيز.\n\nالمدرّب يسجل علامات الرمل والسلت والطين الحقيقية في مواعيدها على برطمانات الطالب التلاتة، ويحدد أي حد مش واضح أو تحريك للعينة. الترسيب قد يحتاج 24–48 ساعة، فالدليل يُجمع على مراحل منفصلة.\n\nالاجتياز بعد توثيق الملاحظات المتأخرة الحقيقية ومراجعتها فقط. نظرة الحصة لمدة 15–20 دقيقة أو برطمان المدرّب الجاهز مش نتيجة نهائية.', 'الطالب يذكر مدى يو إس دي إيه للتربة الناعمة: الرمل صفر فاصلة صفر خمسة إلى اتنين ملليمتر، السلت صفر فاصلة صفر صفر اتنين إلى صفر فاصلة صفر خمسة ملليمتر، والطين أقل من صفر فاصلة صفر صفر اتنين ملليمتر، ويفسر التفكيك وترتيب الترسيب ويميز تقدير ارتفاع الطبقات عن النسب الوزنية في التحليل المعملي.\n\nيجتاز إذا صحت الأحجام والحدود. الوزن وحده، من غير حجم وكثافة وتكتل وطريقة التفكيك، مش تفسير كافي.\n\nالمدرّب يتحقق من أسماء عينات الطالب التلاتة، وسلامة الوعاء والغطاء، وتجهيز التربة، وكميات التربة والميه ومادة التفكيك المسجلة، والخلط والرجّ ووقت البداية. كميات بطاقة المصدر تُستخدم فقط لو المدرّب اختار الطريقة دي ووثق المنتج والإجراء.\n\nكل بند حرج في كل برطمان لازم يتشاف أو يُعاد بشكل صحيح. مشاهدة زميل أو استخدام برطمان مترسب مسبقًا ما يعوضش التجهيز.\n\nالمدرّب يسجل علامات الرمل والسلت والطين الحقيقية في مواعيدها على برطمانات الطالب التلاتة، ويحدد أي حد مش واضح أو تحريك للعينة. الترسيب قد يحتاج أربعة وعشرين إلى تمانية وأربعين ساعة، فالدليل يُجمع على مراحل منفصلة.\n\nالاجتياز بعد توثيق الملاحظات المتأخرة الحقيقية ومراجعتها فقط. نظرة الحصة لمدة خمستاشر إلى عشرين دقيقة أو برطمان المدرّب الجاهز مش نتيجة نهائية.'), ('برطمان زجاج بغطاء سعة 1 لتر، ونحو نصفه تربة، وميه لحد نحو تلاتة أرباعه، ونحو معلقة شاي من سائل غسيل الأطباق، ورجّ قوي 10–15 دقيقة؛ بعدين برطمان منفصل مترسب مسبقًا لمدة 48 ساعة للقياس. دي شروط بطاقة المصدر، مش إجراء موقع آمن أو قياسي تلقائيًا.\n\nالبرطمان نصفه تقريبًا من عينة التربة المحددة\n\nالميه لحد نحو تلاتة أرباع البرطمان\n\nنحو معلقة شاي من سائل الغسيل المذكور\n\nالغطاء متثبت بإحكام\n\nرجّ قوي لمدة لا تقل عن 10 دقائق\n\nوضع ثابت ومستوٍ من غير تحريك\n\nقياس ارتفاع الطبقات المعدنية الكلي بالملليمتر على البرطمان الجاهز\n\nقياس طبقة الرمل بالملليمتر\n\nقياس طبقة السلت بالملليمتر\n\nقياس طبقة الطين بالملليمتر\n\nحساب نسب الرمل والسلت والطين\n\nتسجيل النسب بوضوح\n\nالمدرّب يلاحظ بنود التجهيز 1–6 لكل طالب على عيناته الحقيقية، والحدود اللاحقة في البرطمانات نفسها. البنود 7–12 تُدرّس وتُقيّم في S2-12. برطمان العرض الجاهز ما يعطيش دليلًا على أداء الطالب في الترسيب.\n\nالأصل بيذكر كمان حوالي1.5كوب لبرطمان1لتر، وبيقول في موضع تاني نص البرطمان. حافظنا على الوصفين، من غير اعتبارهم نفس الحجم؛ المدرّب يحدد القياس الفعلي وتعريف الكوب، من غير تحويل متخيل.', 'برطمان زجاج بغطاء سعة لتر واحد، ونحو نصفه تربة، وميه لحد نحو تلاتة أرباعه، ونحو معلقة شاي من سائل غسيل الأطباق، ورجّ قوي عشر لخمستاشر دقيقة؛ بعدين برطمان منفصل مترسب مسبقًا لمدة تمانية وأربعين ساعة للقياس. دي شروط بطاقة المصدر، مش إجراء موقع آمن أو قياسي تلقائيًا.\n\nالبرطمان نصفه تقريبًا من عينة التربة المحددة\n\nالميه لحد نحو تلاتة أرباع البرطمان\n\nنحو معلقة شاي من سائل الغسيل المذكور\n\nالغطاء متثبت بإحكام\n\nرجّ قوي لمدة ما تقلش عن عشر دقايق\n\nوضع ثابت ومستوي من غير تحريك\n\nقياس ارتفاع الطبقات المعدنية الكلي بالملليمتر على البرطمان الجاهز\n\nقياس طبقة الرمل بالملليمتر\n\nقياس طبقة السلت بالملليمتر\n\nقياس طبقة الطين بالملليمتر\n\nحساب نسب الرمل والسلت والطين\n\nتسجيل النسب بوضوح\n\nالمدرّب يلاحظ بنود التجهيز واحد إلى ستة لكل طالب على عيناته الحقيقية، والحدود اللاحقة في البرطمانات نفسها. البنود سبعة إلى اتناشر تُدرّس وتُقيّم في خطوة المحطة التانية رقم اتناشر. برطمان العرض الجاهز ما يعطيش دليل على أداء الطالب في الترسيب.\n\nالأصل بيذكر كمان حوالي كوب ونص لبرطمان سعة لتر واحد، وبيقول في موضع تاني نص البرطمان. حافظنا على الوصفين، من غير اعتبارهم نفس الحجم؛ المدرّب يحدد القياس الفعلي وتعريف الكوب، من غير تحويل متخيل.'), ('توقيت الدرس في الأصل:5دقايق تمهيد لسلوك المية، و5دقايق تفكير ومناقشة في أزواج ومشاركة. حصة75دقيقة بعدها زيارات الملاحظة المطلوبة؛ مش معناها ملاحظة48ساعة.\n\nللطريقة المختارة تحت الإشراف: تلات عينات تربة مختلفة، وبرطمانات شفافة مستقيمة الجوانب وأغطيتها مفحوصة، ومية، ومادة مشتتة معتمدة من المدرّب لو الطريقة بتستخدمها، وماركر ثابت، ومسطرة، وآلة حاسبة، ومثلث القوام للتصنيف في الخطوة الجاية. برطمان العرض المجهز له هوية لوحده. نشاط الأصل فيه25دقيقة للتجهيز، و10دقايق للحساب والتصنيف، و10دقايق للتفسير؛ آخر جزئين في الخطوة الجاية، والملاحظات الحقيقية اللاحقة تفضل منفصلة.', 'توقيت الدرس في الأصل: خمسة دقايق تمهيد لسلوك المية، وخمسة دقايق تفكير ومناقشة في أزواج ومشاركة. حصة خمسة وسبعين دقيقة بعدها زيارات الملاحظة المطلوبة؛ مش معناها ملاحظة تمانية وأربعين ساعة.\n\nللطريقة المختارة تحت الإشراف: تلات عينات تربة مختلفة، وبرطمانات شفافة مستقيمة الجوانب وأغطيتها مفحوصة، ومية، ومادة مشتتة معتمدة من المدرّب لو الطريقة بتستخدمها، وماركر ثابت، ومسطرة، وآلة حاسبة، ومثلث القوام للتصنيف في الخطوة الجاية. برطمان العرض المجهز له هوية لوحده. نشاط الأصل فيه خمسة وعشرين دقيقة للتجهيز، وعشر دقايق للحساب والتصنيف، وعشر دقايق للتفسير؛ آخر جزئين في الخطوة الجاية، والملاحظات الحقيقية اللاحقة تفضل منفصلة.'), ('جهز تلات برطمانات قابلة للتتبع بأمان\n\nالمدرّب يعلن الوعاء الفعلي والمنتج المُفكك وكميته وملء التربة والميه المقاس وطريقة الرجّ الآمنة والجدول قبل الملاحظة. كميات الزجاج والصابون في بطاقة المصدر مجرد سيناريو معرّف.\n\nيسمي عينات التربة التلاتة بشكل صحيح ويحتفظ بكل واحدة منفصلة\n\nيفحص سلامة الوعاء والغطاء وطريقة التعامل الآمن\n\nيفك التكتلات من غير طحن الحجارة ويشيل البقايا المطلوبة\n\nيسجل كميات التربة والميه الفعلية حسب الطريقة المختارة\n\nيسجل اسم مادة التفكيك المعتمدة وكميتها أو طريقة معتمدة من غيرها\n\nيثبت الغطاء ويرجّ بطريقة آمنة طوال المدة التي شاهدها المدرّب\n\nيسجل وقت انتهاء الرجّ وبداية الترسيب ويضع كل برطمان مستويًا ومن غير تحريك', 'جهز تلات برطمانات قابلة للتتبع بأمان\n\nالمدرّب يعلن الوعاء الفعلي والمنتج المُفكك وكميته وملء التربة والميه المقاس وطريقة الرجّ الآمنة والجدول قبل الملاحظة. كميات الزجاج والصابون في بطاقة المصدر مجرد سيناريو معرّف.\n\nيسمي عينات التربة التلاتة بشكل صحيح ويحتفظ بكل واحدة منفصلة\n\nيفحص سلامة الوعاء والغطاء وطريقة التعامل الآمن\n\nيفك التكتلات من غير طحن الحجارة ويشيل البقايا المطلوبة\n\nيسجل كميات التربة والميه الفعلية حسب الطريقة المختارة\n\nيسجل اسم مادة التفكيك المعتمدة وكميتها أو طريقة معتمدة من غيرها\n\nيثبت الغطاء ويرجّ بطريقة آمنة طوال المدة التي شاهدها المدرّب\n\nيسجل وقت انتهاء الرجّ وبداية الترسيب ويضع كل برطمان مستوي ومن غير تحريك'), ('دي برطمانات توضيحية، مش عينات مقاسة. اختيار المرحلة مش مرور وقت حقيقي، وما بيطلعش ارتفاع أو نسبة أو تصنيف قوام. البقايا اللي طافية مش طبقة معدنية. تابع نفس البرطمان المحدد في مواعيد الملاحظة الحقيقية.\n\nاستخدم التدريب على بطاقة الإجراء عشان تتعلم التسلسل. اجتياز المعايير العملية محتاج إشراف فردي وملاحظة فعلية لتنفيذك أنت.\n\nالحالة الأولية بعد الخلط\n\nملاحظة الرمل بدري · حوالي1–2دقيقة\n\nملاحظة السلت بعدين · حوالي2–4ساعات\n\nملاحظة الطين النهائية · حوالي24–48ساعة\n\nالحد مش واضح · سجّل عدم اليقين\n\nرمل · تحت\n\nسلت · في النص\n\nطين · أعلى طبقة معدنية\n\nبقايا عضوية طافية · خارج القياس\n\nالترتيب مناسب لبطاقة المثال. المواد الفعلية والرج الآمن وأداء كل طالب لسه محتاجين ملاحظة المدرّب.\n\nمناسب لمواعيد المثال ده بس. سجّل وقت البداية والملاحظات الحقيقية لنفس البرطمانات؛ الانتظار أونلاين مش ملاحظة فعلية.', 'دي برطمانات توضيحية، مش عينات مقاسة. اختيار المرحلة مش مرور وقت حقيقي، وما بيطلعش ارتفاع أو نسبة أو تصنيف قوام. البقايا اللي طافية مش طبقة معدنية. تابع نفس البرطمان المحدد في مواعيد الملاحظة الحقيقية.\n\nاستخدم التدريب على بطاقة الإجراء عشان تتعلم التسلسل. اجتياز المعايير العملية محتاج إشراف فردي وملاحظة فعلية لتنفيذك أنت.\n\nالحالة الأولية بعد الخلط\n\nملاحظة الرمل بدري · حوالي دقيقة لدقيقتين\n\nملاحظة السلت بعدين · حوالي ساعتين لأربع ساعات\n\nملاحظة الطين النهائية · حوالي أربعة وعشرين إلى تمانية وأربعين ساعة\n\nالحد مش واضح · سجّل عدم اليقين\n\nرمل · تحت\n\nسلت · في النص\n\nطين · أعلى طبقة معدنية\n\nبقايا عضوية طافية · خارج القياس\n\nالترتيب مناسب لبطاقة المثال. المواد الفعلية والرج الآمن وأداء كل طالب لسه محتاجين ملاحظة المدرّب.\n\nمناسب لمواعيد المثال ده بس. سجّل وقت البداية والملاحظات الحقيقية لنفس البرطمانات؛ الانتظار أونلاين مش ملاحظة فعلية.')], 'en': [("Learner gives USDA fine-earth ranges sand 0.05–2 mm, silt 0.002–0.05 mm, clay <0.002 mm, explains dispersion and settling order, and distinguishes a height-based classroom estimate from a laboratory weight-percentage determination.\n\nPass with correct sizes and limitations. Particle weight alone, without size, density, aggregation and dispersal, is not a sufficient explanation.\n\nTrainer checks each student's three sample IDs, safe approved vessel and lid, prepared material, documented soil/water/dispersant quantities, mixing, shaking and start time. The source process-card amounts are used only when the trainer explicitly selects that classroom protocol and material.\n\nAll critical rows for each jar must be observed or validly repeated. Watching a teammate or using a pre-settled jar cannot replace this preparation.\n\nTrainer records actual timed sand, silt and final clay observations on the learner's own three jars, with any blurred interface or disturbance flagged. Settling may require 24–48 hours, so evidence is collected in separate scheduled stages.\n\nPass only after the real later observations are documented and reviewed. A 15–20-minute class view or trainer's pre-settled jar is not a final result.", "Learner gives U S D A fine-earth ranges sand zero point zero five to two millimetres, silt zero point zero zero two to zero point zero five millimetres, clay less than zero point zero zero two millimetres, explains dispersion and settling order, and distinguishes a height-based classroom estimate from a laboratory weight-percentage determination.\n\nPass with correct sizes and limitations. Particle weight alone, without size, density, aggregation and dispersal, is not a sufficient explanation.\n\nTrainer checks each student's three sample IDs, safe approved vessel and lid, prepared material, documented soil/water/dispersant quantities, mixing, shaking and start time. The source process-card amounts are used only when the trainer explicitly selects that classroom protocol and material.\n\nAll critical rows for each jar must be observed or validly repeated. Watching a teammate or using a pre-settled jar cannot replace this preparation.\n\nTrainer records actual timed sand, silt and final clay observations on the learner's own three jars, with any blurred interface or disturbance flagged. Settling may require twenty-four to forty-eight hours, so evidence is collected in separate scheduled stages.\n\nPass only after the real later observations are documented and reviewed. A fifteen to twenty-minute class view or trainer's pre-settled jar is not a final result."), ("One-litre lidded glass jar, approximately half soil, water to about three-quarters, about 1 teaspoon dishwashing liquid, vigorous shaking 10–15 minutes; then a separate pre-settled 48-hour jar for measurement. These are source-card conditions, not an automatically safe or standardized site SOP.\n\nJar about half full with source soil\n\nWater to about three-quarters full\n\nApprox. 1 tsp stated dishwashing liquid\n\nLid secured\n\nVigorous shaking at least 10 minutes\n\nStable level undisturbed placement\n\nTotal mineral layer height measured in mm on pre-settled jar\n\nSand layer measured in mm\n\nSilt layer measured in mm\n\nClay layer measured in mm\n\nSand, silt and clay percentages calculated\n\nPercentages recorded clearly\n\nThe trainer checks physical rows 1–6 on each learner's real preparation and later boundaries on the same jars; rows 7–12 are taught and assessed in S2-12. A pre-settled demonstration jar cannot supply personal settling-performance evidence.\n\nThe source also lists about1.5cups for a1-litre jar and separately says half full. These are retained as source descriptions, not asserted equal volumes; the trainer documents an actual measure and cup definition. No conversion is invented.", "One-litre lidded glass jar, approximately half soil, water to about three-quarters, about one teaspoon dishwashing liquid, vigorous shaking ten to fifteen minutes; then a separate pre-settled forty-eight-hour jar for measurement. These are source-card conditions, not an automatically safe or standardized site S O P.\n\nJar about half full with source soil\n\nWater to about three-quarters full\n\nApproximately one teaspoon stated dishwashing liquid\n\nLid secured\n\nVigorous shaking at least ten minutes\n\nStable level undisturbed placement\n\nTotal mineral layer height measured in millimetres on pre-settled jar\n\nSand layer measured in millimetres\n\nSilt layer measured in millimetres\n\nClay layer measured in millimetres\n\nSand, silt and clay percentages calculated\n\nPercentages recorded clearly\n\nThe trainer checks physical rows one to six on each learner's real preparation and later boundaries on the same jars; rows seven to twelve are taught and assessed in station two step twelve. A pre-settled demonstration jar cannot supply personal settling-performance evidence.\n\nThe source also lists about one and a half cups for a one-litre jar and separately says half full. These are retained as source descriptions, not asserted equal volumes; the trainer documents an actual measure and cup definition. No conversion is invented."), ('Record an actual or explicitly labelled teaching observation. Unknown times or boundaries stay blank; explain uncertainty and the next action. Saving text does not confirm the truth, duration, trainer signature or practical pass.\n\nSample ID\n\nSelected procedure, amounts and material\n\nOwn jar or separately identified prepared demonstration\n\nShaking-finished timestamp\n\nActual sand-observation timestamp\n\nActual silt-observation timestamp\n\nActual clay-observation timestamp\n\nVisible boundary or uncertainty / missing data\n\nNext action and trainer feedback\n\nDraft saved locally; no practical pass or signature created.\n\nThe model is shown after your attempt; this does not semantically approve your explanation.\n\nSedimentation-jar worksheet', 'Record an actual or explicitly labelled teaching observation. Unknown times or boundaries stay blank; explain uncertainty and the next action. Saving text does not confirm the truth, duration, trainer signature or practical pass.\n\nSample I D\n\nSelected procedure, amounts and material\n\nOwn jar or separately identified prepared demonstration\n\nShaking-finished timestamp\n\nActual sand-observation timestamp\n\nActual silt-observation timestamp\n\nActual clay-observation timestamp\n\nVisible boundary or uncertainty / missing data\n\nNext action and trainer feedback\n\nDraft saved locally; no practical pass or signature created.\n\nThe model is shown after your attempt; this does not semantically approve your explanation.\n\nSedimentation-jar worksheet'), ("Return and mark actual boundaries\n\nSeparate scheduled stages continue beyond the 75-minute class. Evidence belongs to the learner's three labelled jars, not a prepared demonstration jar.\n\nLogs actual early sand observation and mark under the posted timetable\n\nReturns for the silt-stage observation and records time and visible boundary\n\nReturns for final clay-stage observation and records time, boundary or uncertainty\n\nExcludes floating organic matter from mineral-layer record\n\nUses side light without moving jar when needed and reports a disturbed or cloudy sample\n\nLinks all three stage notes to the same sample IDs and trainer record", "Return and mark actual boundaries\n\nSeparate scheduled stages continue beyond the seventy-five-minute class. Evidence belongs to the learner's three labelled jars, not a prepared demonstration jar.\n\nLogs actual early sand observation and mark under the posted timetable\n\nReturns for the silt-stage observation and records time and visible boundary\n\nReturns for final clay-stage observation and records time, boundary or uncertainty\n\nExcludes floating organic matter from mineral-layer record\n\nUses side light without moving jar when needed and reports a disturbed or cloudy sample\n\nLinks all three stage notes to the same sample IDs and trainer record"), ('Source lesson timing:5-minute water-behaviour introduction and5-minute think–pair–share. The75-minute class is followed by the required later visits; it is not48hours of observation.\n\nFor the selected supervised method: three distinct soil samples, suitable clear straight-sided jars with checked lids, water, trainer-approved dispersant/material if used, permanent marker, ruler, calculator and a texture triangle for the later classification step. A pre-settled jar has its own identity. Source activity timing is25minutes setup,10minutes calculation/classification and10minutes interpretation; the last two tasks continue in the next step, and real later observations remain separate.', 'Source lesson timing: five-minute water-behaviour introduction and five-minute think–pair–share. The seventy-five-minute class is followed by the required later visits; it is not forty-eight hours of observation.\n\nFor the selected supervised method: three distinct soil samples, suitable clear straight-sided jars with checked lids, water, trainer-approved dispersant/material if used, permanent marker, ruler, calculator and a texture triangle for the later classification step. A pre-settled jar has its own identity. Source activity timing is twenty-five minutes setup, ten minutes calculation/classification and ten minutes interpretation; the last two tasks continue in the next step, and real later observations remain separate.'), ('These are schematic teaching jars, not measured samples. Selecting a stage does not pass real time or generate a height, percentage or texture class. Floating debris is not a mineral layer. Follow the same identified jar through its real observation schedule.\n\nUse this process-card rehearsal to learn the sequence. Practical criteria require individual supervision and a real observation of your own performance.\n\nMixed starting condition\n\nEarly sand observation · about1–2minutes\n\nLater silt observation · about2–4hours\n\nFinal clay observation · about24–48hours\n\nUnclear boundary · record uncertainty\n\nSand · bottom\n\nSilt · middle\n\nClay · upper mineral layer\n\nFloating organic debris · excluded\n\nSource-card order fits. Actual materials, safe shaking and individual performance still need the trainer’s observation.\n\nMatches this teaching timetable only. Record real start and observation times on the same jars; no online wait counts as a physical observation.', 'These are schematic teaching jars, not measured samples. Selecting a stage does not pass real time or generate a height, percentage or texture class. Floating debris is not a mineral layer. Follow the same identified jar through its real observation schedule.\n\nUse this process-card rehearsal to learn the sequence. Practical criteria require individual supervision and a real observation of your own performance.\n\nMixed starting condition\n\nEarly sand observation · about one to two minutes\n\nLater silt observation · about two to four hours\n\nFinal clay observation · about twenty-four to forty-eight hours\n\nUnclear boundary · record uncertainty\n\nSand · bottom\n\nSilt · middle\n\nClay · upper mineral layer\n\nFloating organic debris · excluded\n\nSource-card order fits. Actual materials, safe shaking and individual performance still need the trainer’s observation.\n\nMatches this teaching timetable only. Record real start and observation times on the same jars; no online wait counts as a physical observation.')], 'it': [('Annota osservazioni reali o esplicitamente didattiche. Tempi o interfacce ignoti restano vuoti, con incertezza e azione successiva. Salvare testo non prova verità, durata, firma o competenza.\n\nID campione\n\nProcedura scelta, quantità e materiale\n\nProprio barattolo o dimostrazione preparata con ID diverso\n\nData e ora fine agitazione\n\nOra reale osservazione sabbia\n\nOra reale osservazione limo\n\nOra reale osservazione argilla\n\nInterfaccia visibile o incertezza/dati mancanti\n\nAzione successiva e commento del formatore\n\nBozza salvata localmente; nessuna competenza o firma creata.\n\nModello dopo il tentativo; nessuna approvazione semantica della spiegazione.\n\nScheda del barattolo di sedimentazione', 'Annota osservazioni reali o esplicitamente didattiche. Tempi o interfacce ignoti restano vuoti, con incertezza e azione successiva. Salvare testo non prova verità, durata, firma o competenza.\n\nIdentificativo del campione\n\nProcedura scelta, quantità e materiale\n\nProprio barattolo o dimostrazione preparata con identificativo diverso\n\nData e ora fine agitazione\n\nOra reale osservazione sabbia\n\nOra reale osservazione limo\n\nOra reale osservazione argilla\n\nInterfaccia visibile o incertezza/dati mancanti\n\nAzione successiva e commento del formatore\n\nBozza salvata localmente; nessuna competenza o firma creata.\n\nModello dopo il tentativo; nessuna approvazione semantica della spiegazione.\n\nScheda del barattolo di sedimentazione'), ('Barattoli schematici, non campioni misurati. Selezionare una fase non fa trascorrere tempo reale né produce altezze, percentuali o classi. I residui galleggianti non sono uno strato minerale. Segui lo stesso barattolo nei veri appuntamenti.\n\nUsa questa esercitazione sulla scheda di procedura per imparare la sequenza. I criteri pratici richiedono supervisione individuale e osservazione reale della tua prestazione.\n\nCondizione iniziale miscelata\n\nSabbia iniziale · circa1–2minuti\n\nLimo successivo · circa2–4ore\n\nArgilla finale · circa24–48ore\n\nInterfaccia incerta · annotare incertezza\n\nSabbia · fondo\n\nLimo · centro\n\nArgilla · strato minerale superiore\n\nResidui organici galleggianti · esclusi\n\nOrdine coerente con la scheda. Materiali, agitazione sicura e prestazione individuale richiedono ancora osservazione.\n\nSolo calendario didattico. Registra tempi reali sugli stessi barattoli; nessuna attesa online dimostra osservazioni pratiche.', 'Barattoli schematici, non campioni misurati. Selezionare una fase non fa trascorrere tempo reale né produce altezze, percentuali o classi. I residui galleggianti non sono uno strato minerale. Segui lo stesso barattolo nei veri appuntamenti.\n\nUsa questa esercitazione sulla scheda di procedura per imparare la sequenza. I criteri pratici richiedono supervisione individuale e osservazione reale della tua prestazione.\n\nCondizione iniziale miscelata\n\nSabbia iniziale · circa da uno a due minuti\n\nLimo successivo · circa da due a quattro ore\n\nArgilla finale · circa da ventiquattro a quarantotto ore\n\nInterfaccia incerta · annotare incertezza\n\nSabbia · fondo\n\nLimo · centro\n\nArgilla · strato minerale superiore\n\nResidui organici galleggianti · esclusi\n\nOrdine coerente con la scheda. Materiali, agitazione sicura e prestazione individuale richiedono ancora osservazione.\n\nSolo calendario didattico. Registra tempi reali sugli stessi barattoli; nessuna attesa online dimostra osservazioni pratiche.'), ("Barattolo di vetro da 1 litro con coperchio, circa metà suolo, acqua a circa tre quarti, circa un cucchiaino di detersivo per piatti, agitazione vigorosa per 10–15 minuti; quindi un barattolo distinto sedimentato in precedenza per 48 ore per misurare. Sono condizioni della scheda originale, non una procedura di sito automaticamente sicura o standard.\n\nBarattolo riempito circa a metà con il suolo indicato\n\nAcqua fino a circa tre quarti\n\nCirca 1 cucchiaino del detersivo indicato\n\nCoperchio chiuso saldamente\n\nAgitazione vigorosa per almeno 10 minuti\n\nPosizionamento stabile e piano senza disturbo\n\nAltezza totale degli strati minerali in mm su barattolo già sedimentato\n\nAltezza della sabbia in mm\n\nAltezza del limo in mm\n\nAltezza dell'argilla in mm\n\nPercentuali di sabbia, limo e argilla calcolate\n\nPercentuali registrate chiaramente\n\nIl formatore osserva fisicamente le righe 1–6 sulla preparazione reale di ogni studente e i confini successivi sugli stessi barattoli; le righe 7–12 si insegnano e valutano in S2-12. Un barattolo dimostrativo già pronto non prova la sedimentazione personale.\n\nL’originale cita anche circa1.5tazze per un barattolo da1litro e altrove metà recipiente. Non sono dichiarati volumi equivalenti: il formatore documenta misura e definizione di tazza, senza conversioni inventate.", "Barattolo di vetro da un litro con coperchio, circa metà suolo, acqua a circa tre quarti, circa un cucchiaino di detersivo per piatti, agitazione vigorosa per un tempo compreso tra dieci e quindici minuti; quindi un barattolo distinto sedimentato in precedenza per quarantotto ore per misurare. Sono condizioni della scheda originale, non una procedura di sito automaticamente sicura o standard.\n\nBarattolo riempito circa a metà con il suolo indicato\n\nAcqua fino a circa tre quarti\n\nCirca un cucchiaino del detersivo indicato\n\nCoperchio chiuso saldamente\n\nAgitazione vigorosa per almeno dieci minuti\n\nPosizionamento stabile e piano senza disturbo\n\nAltezza totale degli strati minerali in millimetri su barattolo già sedimentato\n\nAltezza della sabbia in millimetri\n\nAltezza del limo in millimetri\n\nAltezza dell'argilla in millimetri\n\nPercentuali di sabbia, limo e argilla calcolate\n\nPercentuali registrate chiaramente\n\nIl formatore osserva fisicamente le righe da uno a sei sulla preparazione reale di ogni studente e i confini successivi sugli stessi barattoli; le righe da sette a dodici si insegnano e valutano in fase dodici della stazione due. Un barattolo dimostrativo già pronto non prova la sedimentazione personale.\n\nL’originale cita anche circa una tazza e mezza per un barattolo da un litro e altrove metà recipiente. Non sono dichiarati volumi equivalenti: il formatore documenta misura e definizione di tazza, senza conversioni inventate."), ("Lo studente indica gli intervalli USDA della terra fine: sabbia 0.05–2 mm, limo 0.002–0.05 mm, argilla <0.002 mm; spiega dispersione e ordine di sedimentazione e distingue la stima didattica basata sulle altezze dalla determinazione di laboratorio delle percentuali in massa.\n\nSupera con dimensioni e limiti corretti. Il solo peso, senza considerare dimensioni, densità, aggregazione e dispersione, non basta a spiegare la sedimentazione.\n\nIl formatore controlla i tre identificativi dei campioni, il recipiente e coperchio sicuri, il materiale preparato, le quantità documentate di suolo, acqua e disperdente, l'agitazione e l'ora iniziale. Le quantità della scheda originale valgono soltanto se il formatore sceglie e documenta quel procedimento e materiale.\n\nTutte le righe critiche di ogni barattolo devono essere osservate o ripetute correttamente. Guardare un compagno o usare un barattolo già sedimentato non sostituisce la preparazione.\n\nIl formatore registra le osservazioni effettive e datate dei confini di sabbia, limo e argilla sui tre barattoli dello studente, segnalando interfacce sfumate o disturbi. La sedimentazione può richiedere 24–48 ore, quindi le prove si raccolgono in fasi separate.\n\nSupera soltanto dopo che le osservazioni successive sono documentate e riviste. Una visione in classe dopo 15–20 minuti o il barattolo già pronto del formatore non costituisce risultato finale.", "Lo studente indica gli intervalli u esse di a della terra fine: sabbia da zero virgola zero cinque a due millimetri, limo da zero virgola zero zero due a zero virgola zero cinque millimetri, argilla meno di zero virgola zero zero due millimetri; spiega dispersione e ordine di sedimentazione e distingue la stima didattica basata sulle altezze dalla determinazione di laboratorio delle percentuali in massa.\n\nSupera con dimensioni e limiti corretti. Il solo peso, senza considerare dimensioni, densità, aggregazione e dispersione, non basta a spiegare la sedimentazione.\n\nIl formatore controlla i tre identificativi dei campioni, il recipiente e coperchio sicuri, il materiale preparato, le quantità documentate di suolo, acqua e disperdente, l'agitazione e l'ora iniziale. Le quantità della scheda originale valgono soltanto se il formatore sceglie e documenta quel procedimento e materiale.\n\nTutte le righe critiche di ogni barattolo devono essere osservate o ripetute correttamente. Guardare un compagno o usare un barattolo già sedimentato non sostituisce la preparazione.\n\nIl formatore registra le osservazioni effettive e datate dei confini di sabbia, limo e argilla sui tre barattoli dello studente, segnalando interfacce sfumate o disturbi. La sedimentazione può richiedere da ventiquattro a quarantotto ore, quindi le prove si raccolgono in fasi separate.\n\nSupera soltanto dopo che le osservazioni successive sono documentate e riviste. Una visione in classe dopo un tempo compreso tra quindici e venti minuti o il barattolo già pronto del formatore non costituisce risultato finale."), ('Tempi originali:5minuti per l’introduzione sull’acqua e5minuti di riflessione–coppia–condivisione. Dopo la lezione di75minuti servono visite successive; non sono48ore di osservazione.\n\nPer il metodo supervisionato scelto: tre campioni distinti, barattoli trasparenti a pareti dritte con coperchi controllati, acqua, eventuale disperdente approvato, pennarello permanente, righello, calcolatrice e triangolo tessiturale per la fase successiva. Il barattolo preparato ha identità separata. L’attività originale prevede25minuti preparazione,10minuti calcolo/classificazione e10minuti interpretazione: le ultime due parti proseguono nella prossima tappa, con osservazioni reali successive separate.', 'Tempi originali: cinque minuti per l’introduzione sull’acqua e cinque minuti di riflessione–coppia–condivisione. Dopo la lezione di settantacinque minuti servono visite successive; non sono quarantotto ore di osservazione.\n\nPer il metodo supervisionato scelto: tre campioni distinti, barattoli trasparenti a pareti dritte con coperchi controllati, acqua, eventuale disperdente approvato, pennarello permanente, righello, calcolatrice e triangolo tessiturale per la fase successiva. Il barattolo preparato ha identità separata. L’attività originale prevede venticinque minuti preparazione, dieci minuti calcolo/classificazione e dieci minuti interpretazione: le ultime due parti proseguono nella prossima tappa, con osservazioni reali successive separate.'), ("Tornare e segnare i confini reali\n\nLe fasi distinte proseguono oltre la lezione di 75 minuti. La prova appartiene ai tre barattoli identificati dello studente, non a un barattolo dimostrativo già sedimentato.\n\nRegistra la prima osservazione della sabbia e il segno secondo il calendario\n\nTorna nella fase del limo e annota ora e confine visibile\n\nTorna nella fase finale dell'argilla e annota ora, confine oppure incertezza\n\nEsclude la sostanza organica galleggiante dalla registrazione minerale\n\nSe necessario usa luce laterale senza muovere il barattolo e segnala un campione torbido o disturbato\n\nCollega le tre osservazioni ai medesimi identificativi e al registro del formatore", "Tornare e segnare i confini reali\n\nLe fasi distinte proseguono oltre la lezione di settantacinque minuti. La prova appartiene ai tre barattoli identificati dello studente, non a un barattolo dimostrativo già sedimentato.\n\nRegistra la prima osservazione della sabbia e il segno secondo il calendario\n\nTorna nella fase del limo e annota ora e confine visibile\n\nTorna nella fase finale dell'argilla e annota ora, confine oppure incertezza\n\nEsclude la sostanza organica galleggiante dalla registrazione minerale\n\nSe necessario usa luce laterale senza muovere il barattolo e segnala un campione torbido o disturbato\n\nCollega le tre osservazioni ai medesimi identificativi e al registro del formatore")], 'de': [('Die lernende Person nennt die USDA-Bereiche der Feinerde: Sand 0.05–2 mm, Schluff 0.002–0.05 mm, Ton <0.002 mm; sie erklärt Dispersion und Absetzfolge und unterscheidet die Unterrichtsschätzung aus Schichthöhen von der Laborbestimmung der Massenanteile.\n\nBestanden mit richtigen Größen und Grenzen. Allein das Gewicht ohne Größe, Dichte, Aggregation und Dispersion erklärt das Absetzen nicht ausreichend.\n\nDie Lehrkraft prüft die drei Probenkennungen, sicheres Gefäß und Deckel, aufbereitetes Material, dokumentierte Mengen von Boden, Wasser und Dispergiermittel, Schütteln und Beginn. Die Mengen der Quellkarte gelten nur, wenn die Lehrkraft dieses Verfahren samt Material ausdrücklich auswählt und dokumentiert.\n\nAlle kritischen Schritte sind an jedem Glas zu beobachten oder gültig zu wiederholen. Das Zuschauen bei anderen oder ein bereits abgesetztes Glas ersetzen die Vorbereitung nicht.\n\nDie Lehrkraft erfasst die tatsächlichen zeitgebundenen Sand-, Schluff- und Tongrenzen an den drei eigenen Gläsern der lernenden Person und kennzeichnet trübe Grenzen oder Störungen. Das Absetzen kann 24–48 Stunden benötigen, daher wird der Nachweis in getrennten Phasen gesammelt.\n\nBestanden erst nach dokumentierten und geprüften späteren Beobachtungen. Ein Blick nach 15–20 Minuten oder ein vorbereitetes Glas der Lehrkraft ist kein Endergebnis.', 'Die lernende Person nennt die U Es De A-Bereiche der Feinerde: Sand null Komma null fünf bis zwei Millimeter, Schluff null Komma null null zwei bis null Komma null fünf Millimeter, Ton kleiner als null Komma null null zwei Millimeter; sie erklärt Dispersion und Absetzfolge und unterscheidet die Unterrichtsschätzung aus Schichthöhen von der Laborbestimmung der Massenanteile.\n\nBestanden mit richtigen Größen und Grenzen. Allein das Gewicht ohne Größe, Dichte, Aggregation und Dispersion erklärt das Absetzen nicht ausreichend.\n\nDie Lehrkraft prüft die drei Probenkennungen, sicheres Gefäß und Deckel, aufbereitetes Material, dokumentierte Mengen von Boden, Wasser und Dispergiermittel, Schütteln und Beginn. Die Mengen der Quellkarte gelten nur, wenn die Lehrkraft dieses Verfahren samt Material ausdrücklich auswählt und dokumentiert.\n\nAlle kritischen Schritte sind an jedem Glas zu beobachten oder gültig zu wiederholen. Das Zuschauen bei anderen oder ein bereits abgesetztes Glas ersetzen die Vorbereitung nicht.\n\nDie Lehrkraft erfasst die tatsächlichen zeitgebundenen Sand-, Schluff- und Tongrenzen an den drei eigenen Gläsern der lernenden Person und kennzeichnet trübe Grenzen oder Störungen. Das Absetzen kann vierundzwanzig bis achtundvierzig Stunden benötigen, daher wird der Nachweis in getrennten Phasen gesammelt.\n\nBestanden erst nach dokumentierten und geprüften späteren Beobachtungen. Ein Blick nach fünfzehn bis zwanzig Minuten oder ein vorbereitetes Glas der Lehrkraft ist kein Endergebnis.'), ('Ein 1-Liter-Glas mit Deckel, ungefähr halb mit Boden, Wasser bis etwa drei Viertel, ungefähr ein Teelöffel Geschirrspülmittel, kräftiges Schütteln für 10–15 Minuten; anschließend ein separates, 48 Stunden vorher abgesetztes Glas für die Messung. Dies sind Bedingungen der Quellkarte, nicht automatisch eine sichere oder standardisierte örtliche Arbeitsanweisung.\n\nGlas ungefähr halb mit der angegebenen Bodenprobe gefüllt\n\nWasser bis ungefähr drei Viertel\n\nUngefähr 1 TL des angegebenen Geschirrspülmittels\n\nDeckel fest verschlossen\n\nMindestens 10 Minuten kräftig geschüttelt\n\nStabil, eben und ungestört aufgestellt\n\nMineralgesamthöhe am vorher abgesetzten Glas in mm gemessen\n\nSandschicht in mm gemessen\n\nSchluffschicht in mm gemessen\n\nTonschicht in mm gemessen\n\nSand-, Schluff- und Tonprozente berechnet\n\nProzentwerte klar dokumentiert\n\nDie Lehrkraft prüft die körperliche Ausführung der Schritte 1–6 bei jeder tatsächlichen Vorbereitung und die späteren Grenzen an denselben eigenen Gläsern; Schritte 7–12 werden in S2-12 gelehrt und bewertet. Ein vorbereitetes Demonstrationsglas beweist keine persönliche Sedimentationsleistung.\n\nDie Quelle nennt etwa1.5Tassen für ein1-Liter-Glas und andernorts halb voll. Keine Gleichsetzung dieser Volumina: Lehrkraft dokumentiert echte Menge und Tassendefinition, ohne erfundene Umrechnung.', 'Ein Ein-Liter-Glas mit Deckel, ungefähr halb mit Boden, Wasser bis etwa drei Viertel, ungefähr ein Teelöffel Geschirrspülmittel, kräftiges Schütteln für zehn bis fünfzehn Minuten; anschließend ein separates, achtundvierzig Stunden vorher abgesetztes Glas für die Messung. Dies sind Bedingungen der Quellkarte, nicht automatisch eine sichere oder standardisierte örtliche Arbeitsanweisung.\n\nGlas ungefähr halb mit der angegebenen Bodenprobe gefüllt\n\nWasser bis ungefähr drei Viertel\n\nUngefähr ein Teelöffel des angegebenen Geschirrspülmittels\n\nDeckel fest verschlossen\n\nMindestens zehn Minuten kräftig geschüttelt\n\nStabil, eben und ungestört aufgestellt\n\nMineralgesamthöhe am vorher abgesetzten Glas in Millimeter gemessen\n\nSandschicht in Millimeter gemessen\n\nSchluffschicht in Millimeter gemessen\n\nTonschicht in Millimeter gemessen\n\nSand-, Schluff- und Tonprozente berechnet\n\nProzentwerte klar dokumentiert\n\nDie Lehrkraft prüft die körperliche Ausführung der Schritte eins bis sechs bei jeder tatsächlichen Vorbereitung und die späteren Grenzen an denselben eigenen Gläsern; Schritte sieben bis zwölf werden in Schritt zwölf der Station zwei gelehrt und bewertet. Ein vorbereitetes Demonstrationsglas beweist keine persönliche Sedimentationsleistung.\n\nDie Quelle nennt etwa eineinhalb Tassen für ein Ein-Liter-Glas und andernorts halb voll. Keine Gleichsetzung dieser Volumina: Lehrkraft dokumentiert echte Menge und Tassendefinition, ohne erfundene Umrechnung.'), ('Originalzeiten:5Minuten Wassereinstieg und5Minuten Denken–Paar–Teilen. Auf75Minuten Unterricht folgen nötige spätere Besuche; das sind keine48Stunden Beobachtung.\n\nFür das gewählte betreute Verfahren: drei verschiedene Bodenproben, geeignete klare geradwandige Gläser mit geprüften Deckeln, Wasser, gegebenenfalls freigegebenes Dispergiermittel, wasserfester Stift, Lineal, Rechner und Texturdreieck für die nächste Stufe. Vorbereitetes Lehrglas gesondert kennzeichnen. Originalaktivität:25Minuten Vorbereitung,10Minuten Berechnung/Klassifikation,10Minuten Deutung; letzte Teile folgen in der nächsten Stufe, echte spätere Beobachtungen bleiben getrennt.', 'Originalzeiten: fünf Minuten Wassereinstieg und fünf Minuten Denken–Paar–Teilen. Auf fünfundsiebzig Minuten Unterricht folgen nötige spätere Besuche; das sind keine achtundvierzig Stunden Beobachtung.\n\nFür das gewählte betreute Verfahren: drei verschiedene Bodenproben, geeignete klare geradwandige Gläser mit geprüften Deckeln, Wasser, gegebenenfalls freigegebenes Dispergiermittel, wasserfester Stift, Lineal, Rechner und Texturdreieck für die nächste Stufe. Vorbereitetes Lehrglas gesondert kennzeichnen. Originalaktivität: fünfundzwanzig Minuten Vorbereitung, zehn Minuten Berechnung/Klassifikation, zehn Minuten Deutung; letzte Teile folgen in der nächsten Stufe, echte spätere Beobachtungen bleiben getrennt.'), ('Schematische Lehrgläser, keine gemessenen Proben. Phasenwahl lässt keine echte Zeit vergehen und erzeugt keine Höhe, Prozentzahl oder Texturklasse. Schwimmende Reste sind keine Mineralschicht. Dasselbe Glas zu echten Terminen verfolgen.\n\nNutze diese Übung mit der Ablaufkarte, um die Reihenfolge zu lernen. Praktische Kriterien erfordern individuelle Aufsicht und eine reale Beobachtung deiner eigenen Leistung.\n\nGemischter Anfangszustand\n\nFrüher Sand · etwa1–2Minuten\n\nSpäterer Schluff · etwa2–4Stunden\n\nAbschließender Ton · etwa24–48Stunden\n\nUnklare Grenze · Unsicherheit notieren\n\nSand · unten\n\nSchluff · Mitte\n\nTon · obere Mineralschicht\n\nSchwimmende organische Reste · ausgeschlossen\n\nAblauf passt zur Karte. Material, sicheres Schütteln und individuelle Leistung müssen weiter beobachtet werden.\n\nNur dieser Lehrzeitplan. Echte Start- und Beobachtungszeiten am selben Glas erfassen; Onlinewartezeit belegt keine Praxis.', 'Schematische Lehrgläser, keine gemessenen Proben. Phasenwahl lässt keine echte Zeit vergehen und erzeugt keine Höhe, Prozentzahl oder Texturklasse. Schwimmende Reste sind keine Mineralschicht. Dasselbe Glas zu echten Terminen verfolgen.\n\nNutze diese Übung mit der Ablaufkarte, um die Reihenfolge zu lernen. Praktische Kriterien erfordern individuelle Aufsicht und eine reale Beobachtung deiner eigenen Leistung.\n\nGemischter Anfangszustand\n\nFrüher Sand · etwa eine bis zwei Minuten\n\nSpäterer Schluff · etwa zwei bis vier Stunden\n\nAbschließender Ton · etwa vierundzwanzig bis achtundvierzig Stunden\n\nUnklare Grenze · Unsicherheit notieren\n\nSand · unten\n\nSchluff · Mitte\n\nTon · obere Mineralschicht\n\nSchwimmende organische Reste · ausgeschlossen\n\nAblauf passt zur Karte. Material, sicheres Schütteln und individuelle Leistung müssen weiter beobachtet werden.\n\nNur dieser Lehrzeitplan. Echte Start- und Beobachtungszeiten am selben Glas erfassen; Onlinewartezeit belegt keine Praxis.'), ('Zurückkehren und echte Schichtgrenzen markieren\n\nGetrennte Phasen dauern länger als die 75-minütige Unterrichtsstunde. Der Nachweis gehört zu den drei bezeichneten eigenen Gläsern und nicht zu einem vorbereiteten Demonstrationsglas.\n\nFrühe Sandbeobachtung und Marke nach Zeitplan dokumentieren\n\nZur Schluffphase zurückkehren und Zeit und sichtbare Grenze erfassen\n\nZur letzten Tonphase zurückkehren und Zeit, Grenze oder Unsicherheit erfassen\n\nSchwimmende organische Substanz aus der Mineralschichtdokumentation ausschließen\n\nBei Bedarf Seitenlicht ohne Bewegen nutzen und Trübung oder Störung melden\n\nAlle drei Phasennotizen mit denselben Probenkennungen und dem Lehrkraftprotokoll verknüpfen', 'Zurückkehren und echte Schichtgrenzen markieren\n\nGetrennte Phasen dauern länger als die fünfundsiebzig-minütige Unterrichtsstunde. Der Nachweis gehört zu den drei bezeichneten eigenen Gläsern und nicht zu einem vorbereiteten Demonstrationsglas.\n\nFrühe Sandbeobachtung und Marke nach Zeitplan dokumentieren\n\nZur Schluffphase zurückkehren und Zeit und sichtbare Grenze erfassen\n\nZur letzten Tonphase zurückkehren und Zeit, Grenze oder Unsicherheit erfassen\n\nSchwimmende organische Substanz aus der Mineralschichtdokumentation ausschließen\n\nBei Bedarf Seitenlicht ohne Bewegen nutzen und Trübung oder Störung melden\n\nAlle drei Phasennotizen mit denselben Probenkennungen und dem Lehrkraftprotokoll verknüpfen')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s211-lab-audio-20261023-r1'
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
    assert count < 7, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 28,'maximumCallsForLane':7,
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
    assert all(v<=7 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':7,'maximumBlindReviewPerLane':7,'maximumASRPerLane':7,'maximumTTSAggregate':28,'maximumBlindAggregate':28,'maximumASRAggregate':28,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
