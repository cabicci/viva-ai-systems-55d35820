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
IDS = ('S2-14-ar-EG-report-sequence-r1', 'S2-14-ar-EG-knowledge-completion-r1', 'S2-14-ar-EG-record-guidance-r1', 'S2-14-ar-EG-provenance-guidance-r1', 'S2-14-ar-EG-facilitation-r1', 'S2-14-ar-EG-scaffold-and-disclosure-r1', 'S2-14-en-report-sequence-r1', 'S2-14-en-knowledge-completion-r1', 'S2-14-en-record-guidance-r1', 'S2-14-en-provenance-guidance-r1', 'S2-14-en-facilitation-r1', 'S2-14-en-scaffold-and-disclosure-r1', 'S2-14-it-report-sequence-r1', 'S2-14-it-knowledge-completion-r1', 'S2-14-it-record-guidance-r1', 'S2-14-it-provenance-guidance-r1', 'S2-14-it-facilitation-r1', 'S2-14-it-scaffold-and-disclosure-r1', 'S2-14-de-report-sequence-r1', 'S2-14-de-knowledge-completion-r1', 'S2-14-de-record-guidance-r1', 'S2-14-de-provenance-guidance-r1', 'S2-14-de-facilitation-r1', 'S2-14-de-scaffold-and-disclosure-r1')
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
    assert(req['scope'],req['stepId'])==('S214_LAB_24_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-14')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s214-lab-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['report-sequence','knowledge-completion','record-guidance','provenance-guidance','facilitation','scaffold-and-disclosure']
        voice='Charon'if group in['knowledge-completion','provenance-guidance','scaffold-and-disclosure']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'report-sequence': ['/reportPractice/ui/boundary', '/reportPractice/ui/modelHelp', '/reportPractice/sequence/0', '/reportPractice/sequence/1', '/reportPractice/sequence/2'], 'knowledge-completion': ['/reportPractice/passChecks/0/evidence', '/reportPractice/passChecks/0/decision', '/reportPractice/passChecks/1/evidence', '/reportPractice/passChecks/1/decision', '/reportPractice/passChecks/2/evidence', '/reportPractice/passChecks/2/decision'], 'record-guidance': ['/reportPractice/ui/recordHelp', '/reportPractice/ui/sections/0', '/reportPractice/ui/sections/1', '/reportPractice/ui/sections/2', '/reportPractice/ui/sections/3', '/reportPractice/ui/sections/4', '/reportPractice/ui/identityFields/0', '/reportPractice/ui/identityFields/1', '/reportPractice/ui/resultColumns/0', '/reportPractice/ui/resultColumns/1', '/reportPractice/ui/resultColumns/2', '/reportPractice/ui/resultNames/0', '/reportPractice/ui/resultNames/1', '/reportPractice/ui/resultNames/2', '/reportPractice/ui/resultNames/3', '/reportPractice/ui/resultNames/4', '/reportPractice/ui/resultNames/5', '/reportPractice/ui/reportFields/0', '/reportPractice/ui/reportFields/1', '/reportPractice/ui/reportFields/2', '/reportPractice/ui/reportFields/3', '/reportPractice/ui/reportFields/4', '/reportPractice/ui/knowledgeOnly', '/studentDownloads/0/title'], 'provenance-guidance': ['/reportPractice/ui/provenance', '/reportPractice/ui/originOptions/0', '/reportPractice/ui/originOptions/1', '/reportPractice/ui/originOptions/2', '/reportPractice/ui/originRows/0', '/reportPractice/ui/originRows/1', '/reportPractice/ui/originRows/2', '/reportPractice/ui/originRows/3', '/reportPractice/ui/originRows/4', '/reportPractice/ui/originRows/5', '/reportPractice/ui/originGood', '/reportPractice/ui/originBad'], 'facilitation': ['/reportPractice/ui/facilitation'], 'scaffold-and-disclosure': ['/reportPractice/ui/starter', '/reportPractice/ui/reason', '/reportPractice/ui/empty', '/reportPractice/ui/reasonBoundary', '/reportPractice/ui/need', '/reportPractice/ui/notes']}, 'en': {'report-sequence': ['/reportPractice/ui/boundary', '/reportPractice/ui/modelHelp', '/reportPractice/sequence/0', '/reportPractice/sequence/1', '/reportPractice/sequence/2'], 'knowledge-completion': ['/reportPractice/passChecks/0/evidence', '/reportPractice/passChecks/0/decision', '/reportPractice/passChecks/1/evidence', '/reportPractice/passChecks/1/decision', '/reportPractice/passChecks/2/evidence', '/reportPractice/passChecks/2/decision'], 'record-guidance': ['/reportPractice/ui/recordHelp', '/reportPractice/ui/sections/0', '/reportPractice/ui/sections/1', '/reportPractice/ui/sections/2', '/reportPractice/ui/sections/3', '/reportPractice/ui/sections/4', '/reportPractice/ui/identityFields/0', '/reportPractice/ui/identityFields/1', '/reportPractice/ui/resultColumns/0', '/reportPractice/ui/resultColumns/1', '/reportPractice/ui/resultColumns/2', '/reportPractice/ui/resultNames/0', '/reportPractice/ui/resultNames/1', '/reportPractice/ui/resultNames/2', '/reportPractice/ui/resultNames/3', '/reportPractice/ui/resultNames/4', '/reportPractice/ui/resultNames/5', '/reportPractice/ui/reportFields/0', '/reportPractice/ui/reportFields/1', '/reportPractice/ui/reportFields/2', '/reportPractice/ui/reportFields/3', '/reportPractice/ui/reportFields/4', '/reportPractice/ui/knowledgeOnly', '/studentDownloads/0/title'], 'provenance-guidance': ['/reportPractice/ui/provenance', '/reportPractice/ui/originOptions/0', '/reportPractice/ui/originOptions/1', '/reportPractice/ui/originOptions/2', '/reportPractice/ui/originRows/0', '/reportPractice/ui/originRows/1', '/reportPractice/ui/originRows/2', '/reportPractice/ui/originRows/3', '/reportPractice/ui/originRows/4', '/reportPractice/ui/originRows/5', '/reportPractice/ui/originGood', '/reportPractice/ui/originBad'], 'facilitation': ['/reportPractice/ui/facilitation'], 'scaffold-and-disclosure': ['/reportPractice/ui/starter', '/reportPractice/ui/reason', '/reportPractice/ui/empty', '/reportPractice/ui/reasonBoundary', '/reportPractice/ui/need', '/reportPractice/ui/notes']}, 'it': {'report-sequence': ['/reportPractice/ui/boundary', '/reportPractice/ui/modelHelp', '/reportPractice/sequence/0', '/reportPractice/sequence/1', '/reportPractice/sequence/2'], 'knowledge-completion': ['/reportPractice/passChecks/0/evidence', '/reportPractice/passChecks/0/decision', '/reportPractice/passChecks/1/evidence', '/reportPractice/passChecks/1/decision', '/reportPractice/passChecks/2/evidence', '/reportPractice/passChecks/2/decision'], 'record-guidance': ['/reportPractice/ui/recordHelp', '/reportPractice/ui/sections/0', '/reportPractice/ui/sections/1', '/reportPractice/ui/sections/2', '/reportPractice/ui/sections/3', '/reportPractice/ui/sections/4', '/reportPractice/ui/identityFields/0', '/reportPractice/ui/identityFields/1', '/reportPractice/ui/resultColumns/0', '/reportPractice/ui/resultColumns/1', '/reportPractice/ui/resultColumns/2', '/reportPractice/ui/resultNames/0', '/reportPractice/ui/resultNames/1', '/reportPractice/ui/resultNames/2', '/reportPractice/ui/resultNames/3', '/reportPractice/ui/resultNames/4', '/reportPractice/ui/resultNames/5', '/reportPractice/ui/reportFields/0', '/reportPractice/ui/reportFields/1', '/reportPractice/ui/reportFields/2', '/reportPractice/ui/reportFields/3', '/reportPractice/ui/reportFields/4', '/reportPractice/ui/knowledgeOnly', '/studentDownloads/0/title'], 'provenance-guidance': ['/reportPractice/ui/provenance', '/reportPractice/ui/originOptions/0', '/reportPractice/ui/originOptions/1', '/reportPractice/ui/originOptions/2', '/reportPractice/ui/originRows/0', '/reportPractice/ui/originRows/1', '/reportPractice/ui/originRows/2', '/reportPractice/ui/originRows/3', '/reportPractice/ui/originRows/4', '/reportPractice/ui/originRows/5', '/reportPractice/ui/originGood', '/reportPractice/ui/originBad'], 'facilitation': ['/reportPractice/ui/facilitation'], 'scaffold-and-disclosure': ['/reportPractice/ui/starter', '/reportPractice/ui/reason', '/reportPractice/ui/empty', '/reportPractice/ui/reasonBoundary', '/reportPractice/ui/need', '/reportPractice/ui/notes']}, 'de': {'report-sequence': ['/reportPractice/ui/boundary', '/reportPractice/ui/modelHelp', '/reportPractice/sequence/0', '/reportPractice/sequence/1', '/reportPractice/sequence/2'], 'knowledge-completion': ['/reportPractice/passChecks/0/evidence', '/reportPractice/passChecks/0/decision', '/reportPractice/passChecks/1/evidence', '/reportPractice/passChecks/1/decision', '/reportPractice/passChecks/2/evidence', '/reportPractice/passChecks/2/decision'], 'record-guidance': ['/reportPractice/ui/recordHelp', '/reportPractice/ui/sections/0', '/reportPractice/ui/sections/1', '/reportPractice/ui/sections/2', '/reportPractice/ui/sections/3', '/reportPractice/ui/sections/4', '/reportPractice/ui/identityFields/0', '/reportPractice/ui/identityFields/1', '/reportPractice/ui/resultColumns/0', '/reportPractice/ui/resultColumns/1', '/reportPractice/ui/resultColumns/2', '/reportPractice/ui/resultNames/0', '/reportPractice/ui/resultNames/1', '/reportPractice/ui/resultNames/2', '/reportPractice/ui/resultNames/3', '/reportPractice/ui/resultNames/4', '/reportPractice/ui/resultNames/5', '/reportPractice/ui/reportFields/0', '/reportPractice/ui/reportFields/1', '/reportPractice/ui/reportFields/2', '/reportPractice/ui/reportFields/3', '/reportPractice/ui/reportFields/4', '/reportPractice/ui/knowledgeOnly', '/studentDownloads/0/title'], 'provenance-guidance': ['/reportPractice/ui/provenance', '/reportPractice/ui/originOptions/0', '/reportPractice/ui/originOptions/1', '/reportPractice/ui/originOptions/2', '/reportPractice/ui/originRows/0', '/reportPractice/ui/originRows/1', '/reportPractice/ui/originRows/2', '/reportPractice/ui/originRows/3', '/reportPractice/ui/originRows/4', '/reportPractice/ui/originRows/5', '/reportPractice/ui/originGood', '/reportPractice/ui/originBad'], 'facilitation': ['/reportPractice/ui/facilitation'], 'scaffold-and-disclosure': ['/reportPractice/ui/starter', '/reportPractice/ui/reason', '/reportPractice/ui/empty', '/reportPractice/ui/reasonBoundary', '/reportPractice/ui/need', '/reportPractice/ui/notes']}}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('المحاكاة دي مش بتقيس تربة ولا بتعتمد التعامل مع الكواشف. التطبيق حسب العدة الفعلية ودليلها ونشرة السلامة، وبملاحظة المدرّب لكل طالب.\n\nالمكعبات بتمثل جدول الدرس التوضيحي بس. الفراغات بينها مقصودة ومش متصنفة. دي مش حدود معمل خاصة بمحصول، ولا حاسبة جرعات، ولا محاكاة للتربة.\n\nفرز كل رقم للحقل 3 حسب مصدره: قسته بنفسك، المدرّب قدّمه، اتعرض قدامك، أو ناقص. أضف الطرق والوحدات.\n\nلكل قيمة في الجدول اختار تصنيف بس لو مرجع مناسب بيغطيها؛ علّم المادة العضوية 2.1% وباقي الفراغات «غير محسوم».\n\nاكتب خطوتين مشروطتين للطماطم، واختار واحدة أولى مع تحديد دليل المعمل أو الحقل الناقص.', 'المحاكاة دي مش بتقيس تربة ولا بتعتمد التعامل مع الكواشف. التطبيق حسب العدة الفعلية ودليلها ونشرة السلامة، وبملاحظة المدرّب لكل طالب.\n\nالنطاقات بتعرض جدول الدرس التوضيحي بس. الفراغات بينها مقصودة ومش متصنفة. دي مش حدود معمل خاصة بمحصول، ولا حاسبة جرعات، ولا محاكاة للتربة.\n\nافرز كل رقم للحقل تلاتة حسب مصدره: قسته بنفسك، المدرّب قدّمه، اتعرض قدامك، أو ناقص. أضف الطرق والوحدات.\n\nلكل قيمة في الجدول اختار تصنيف بس لو مرجع مناسب بيغطيها؛ علّم المادة العضوية اتنين فاصلة واحد في المية وباقي الفراغات «غير محسوم».\n\nاكتب خطوتين مشروطتين للطماطم، واختار واحدة أولى مع تحديد دليل المعمل أو الحقل الناقص.'), ('بداية جملة تساعدك: «لأن [النتيجة] معناها [التفسير حسب مرجع محدد]، فالخطوة الجاية [الإجراء]، بشرط [الدليل أو الشرط الناقص]».\n\nجرّب تفسّر الأول قبل ما تقارن\n\nاكتب محاولتك الأول.\n\nالمقارنة ما بتحكمش على معنى إجابتك ولا بتثبت مهارة عملية.\n\nاكتب هوية العينة وملاحظة عن الدليل الناقص. سيب النتايج اللي مش متاحة فاضية.\n\nملاحظة التنفيذ / التعقيب / التاريخ / التوقيع: فاضي لحد الملاحظة الفعلية', 'بداية جملة تساعدك: «لأن النتيجة معناها التفسير حسب مرجع محدد، فالخطوة الجاية الإجراء، بشرط الدليل أو الشرط الناقص».\n\nجرّب تفسّر الأول قبل ما تقارن\n\nاكتب محاولتك الأول.\n\nالمقارنة ما بتحكمش على معنى إجابتك ولا بتثبت مهارة عملية.\n\nاكتب هوية العينة وملاحظة عن الدليل الناقص. سيب النتايج اللي مش متاحة فاضية.\n\nملاحظة التنفيذ، التعقيب، التاريخ، التوقيع: فاضي لحد الملاحظة الفعلية'), ('خطة النشاط 95 دقيقة = 5 + 35 + 10 + 45. جزء الحقل 3 فيه 40 دقيقة و5 مناقشة، وجوّه الأربعين مرحلتين مقترحتين 20 + 20. التجفيف والترسيب الكامل وانتظار المعمل ليهم وقت زيادة. المدرّب يسلّم نتائج المادة العضوية وP وK بعد القياسات العملية؛ ضغطة أونلاين ما تثبتش إن ده حصل. ملاحظة كل طالب والتوقيع منفصلين. لكل مجموعة، المدرّب يجهّز طقم أدوات واحد وعينة واحدة محددة الهوية، متجففة ومتغربلة، حسب التجهيزات الفعلية والطريقة الآمنة المعتمدة. يجهّز قوالب تقرير فاضية ويحتفظ بورقة نتائج المادة العضوية وP وK منفصلة لحد مرحلة تسليمها. ولو طالب محتاج مساعدة، ممكن يعلّم له على الصفوف المناسبة في جدول التفسير، من غير ما يملا فراغات التصنيف أو يفترض إن المادة العضوية منخفضة.', 'خطة النشاط خمسة وتسعين دقيقة بتساوي خمسة زائد خمسة وتلاتين زائد عشرة زائد خمسة وأربعين. جزء الحقل تلاتة فيه أربعين دقيقة وخمسة مناقشة، وجوّه الأربعين مرحلتين مقترحتين عشرين زائد عشرين. التجفيف والترسيب الكامل وانتظار المعمل ليهم وقت زيادة. المدرّب يسلّم نتائج المادة العضوية والفوسفور والبوتاسيوم بعد القياسات العملية؛ ضغطة أونلاين ما تثبتش إن ده حصل. ملاحظة كل طالب والتوقيع منفصلين. لكل مجموعة، المدرّب يجهّز طقم أدوات واحد وعينة واحدة محددة الهوية، متجففة ومتغربلة، حسب التجهيزات الفعلية والطريقة الآمنة المعتمدة. يجهّز قوالب تقرير فاضية ويحتفظ بورقة نتائج المادة العضوية والفوسفور والبوتاسيوم منفصلة لحد مرحلة تسليمها. ولو طالب محتاج مساعدة، ممكن يعلّم له على الصفوف المناسبة في جدول التفسير، من غير ما يملا فراغات التصنيف أو يفترض إن المادة العضوية منخفضة.'), ('سيب القيمة اللي مش عارفها فاضية واكتب السبب. الحفظ ما بيتحققش من القياس أو التفسير أو ترتيب التنفيذ، ومش اجتياز عملي. الأرقام المعطاة هنا للتدريب، مش دليل إن المدرّب سلّم ورقة نتائج فعلية.\n\n1. بيانات العميل والعينة\n\n2. النتائج وأصل كل رقم\n\n3. التفسير والمرجع\n\n4. خطوتين مشروطتين وأولوية واحدة\n\n5. الملاحظات والدليل اللي لسه ناقص\n\nالعميل / الحقل / رقم العينة\n\nتاريخ الجمع والاختبار / الموقع / المحصول\n\nالنتيجة\n\nالقيمة الفعلية، أو سيبها فاضية\n\nالطريقة / الوحدة / أصل الرقم / السجل / سبب نقص البيانات\n\npH بتاعك، مالوش وحدة\n\nنسب الرمل والسلت والطين وتصنيف القوام بتوعك\n\nمادة عضوية معطاة 2.1%\n\nP معطى 12 ppm\n\nK معطى 185 ppm\n\nN: مش معطى\n\nفسّر كل نتيجة بمرجعها، أو اكتب إنها مش محسومة واشرح ليه\n\nالخطوة المشروطة الأولى ودليلها\n\nالخطوة المشروطة التانية ودليلها\n\nأولوية واحدة وسببها وإيه اللي ممكن يغيّرها\n\nملاحظات ومعلومات ناقصة وتعقيب المدرّب، يفضل فاضي لحد ما يوصلك\n\nتدريب تقرير؛ ملاحظة التنفيذ الفعلي منفصلة\n\nورقة تدريب التقرير المتكامل', 'سيب القيمة اللي مش عارفها فاضية واكتب السبب. الحفظ ما بيتحققش من القياس أو التفسير أو ترتيب التنفيذ، ومش اجتياز عملي. الأرقام المعطاة هنا للتدريب، مش دليل إن المدرّب سلّم ورقة نتائج فعلية.\n\nواحد. بيانات العميل والعينة\n\nاتنين. النتائج وأصل كل رقم\n\nتلاتة. التفسير والمرجع\n\nأربعة. خطوتين مشروطتين وأولوية واحدة\n\nخمسة. الملاحظات والدليل اللي لسه ناقص\n\nالعميل، الحقل، رقم العينة\n\nتاريخ الجمع والاختبار، الموقع، المحصول\n\nالنتيجة\n\nالقيمة الفعلية، أو سيبها فاضية\n\nالطريقة، الوحدة، أصل الرقم، السجل، سبب نقص البيانات\n\nبي إتش بتاعك، مالوش وحدة\n\nنسب الرمل والسلت والطين وتصنيف القوام بتوعك\n\nمادة عضوية معطاة اتنين فاصلة واحد في المية \n\nالفوسفور معطى اتناشر جزء في المليون\n\nالبوتاسيوم معطى مية وخمسة وتمانين جزء في المليون\n\nالنيتروجين: مش معطى\n\nفسّر كل نتيجة بمرجعها، أو اكتب إنها مش محسومة واشرح ليه\n\nالخطوة المشروطة الأولى ودليلها\n\nالخطوة المشروطة التانية ودليلها\n\nأولوية واحدة وسببها وإيه اللي ممكن يغيّرها\n\nملاحظات ومعلومات ناقصة وتعقيب المدرّب، يفضل فاضي لحد ما يوصلك\n\nتدريب تقرير؛ ملاحظة التنفيذ الفعلي منفصلة\n\nورقة تدريب التقرير المتكامل'), ('كل رقم للحقل 3 جاي منين؟\n\nقياس الطالب الفعلي على مراحل، ولسه مش متسجّل هنا\n\nنتيجة مقدّمة من المدرّب، وطريقتها لسه مطلوبة\n\nمفيش نتيجة مقدّمة؛ الناقص مش صفر\n\nسجل pH بتاعك\n\nسجل القوام بتاعك\n\nمادة عضوية 2.1%\n\nP 12 ppm\n\nK 185 ppm\n\nN: مفيش رقم\n\nأصل الأرقام صح: pH والقوام بتوعك يفضلوا فاضيين لحد القياس الفعلي؛ المادة العضوية وP وK مقدّمين؛ وN ناقص.\n\nراجع مين قاس كل نتيجة. النموذج مش ملاحظتك، وعدم وجود رقم N معناه ناقص، مش صفر.', 'كل رقم للحقل تلاتة جاي منين؟\n\nقياس الطالب الفعلي على مراحل، ولسه مش متسجّل هنا\n\nنتيجة مقدّمة من المدرّب، وطريقتها لسه مطلوبة\n\nمفيش نتيجة مقدّمة؛ الناقص مش صفر\n\nسجل بي إتش بتاعك\n\nسجل القوام بتاعك\n\nمادة عضوية اتنين فاصلة واحد في المية \n\nالفوسفور اتناشر جزء في المليون\n\nالبوتاسيوم مية وخمسة وتمانين جزء في المليون\n\nالنيتروجين: مفيش رقم\n\nأصل الأرقام صح: بي إتش والقوام بتوعك يفضلوا فاضيين لحد القياس الفعلي؛ المادة العضوية والفوسفور والبوتاسيوم مقدّمين؛ والنيتروجين ناقص.\n\nراجع مين قاس كل نتيجة. النموذج مش ملاحظتك، وعدم وجود رقم النيتروجين معناه ناقص، مش صفر.'), ('يسجّل العميل ورقم الحقل 3 والعينة والتاريخ، ويفصل pH والقوام اللي قاسهم عن المادة العضوية 2.1% والفوسفور 12 ppm والبوتاسيوم 185 ppm المقدّمين من المدرّب، مع الوحدات والطريقة أو توضيح غيابها، ومن غير اختراع نتيجة نيتروجين.\n\nيجتاز لما أصل كل رقم ووحدته يكونوا صحيحين، والطرق الناقصة متعلّم عليها. نسخ قياسات نموذج الحل أو ادّعاء تنفيذ تحليل NPK أو المادة العضوية يستلزم مراجعة موجّهة ومحاولة جديدة.\n\nيتعامل مع جدول الدرس كأمثلة مش حدود عامة، ويكتشف إن 2.1% مادة عضوية واقعة في فراغ 2–3%، وينتبه لفراغات P وK، ويربط تفسير pH/P/K بطريقة الاختبار والمحصول والمعايرة الخاصة بالمنطقة في المعمل، وما يحسمش تصنيف بدون سند.\n\nيجتاز لما كل تصنيف يكون له مرجع مناسب ومعلن أو يكتبه غير محسوم. تكرار وصف النموذج لـ2.1% إنها منخفضة من نفس الجدول مش كفاية.\n\nيقدم خطوتين واقعيتين لحالة طماطم فعلية أو حالة تدريب موضّح إنها معطاة، ويبرر الأولوية ويطلب البيانات الناقصة زي احتياج الجير وطريقة استخلاص P وتحليل محسن التربة وخطة المحصول ومصادر المغذيات السابقة، من غير تخمين جرعة.\n\nيجتاز لما الاقتراح والأولوية مرتبطين بدليل الحالة وحدودها. أي معدل ثابت للكمبوست بسمك 2–3 بوصة، أو أي جرعة سماد أو جير من غير سند للحقل تستلزم مراجعة ومحاولة تانية.', 'يسجّل العميل ورقم الحقل تلاتة والعينة والتاريخ، ويفصل بي إتش والقوام اللي قاسهم عن المادة العضوية اتنين فاصلة واحد في المية والفوسفور اتناشر جزء في المليون والبوتاسيوم مية وخمسة وتمانين جزء في المليون المقدّمين من المدرّب، مع الوحدات والطريقة أو توضيح غيابها، ومن غير اختراع نتيجة نيتروجين.\n\nيجتاز لما أصل كل رقم ووحدته يكونوا صحيحين، والطرق الناقصة متعلّم عليها. نسخ قياسات نموذج الحل أو ادّعاء تنفيذ تحليل النيتروجين والفوسفور والبوتاسيوم أو المادة العضوية يستلزم مراجعة موجّهة ومحاولة جديدة.\n\nيتعامل مع جدول الدرس كأمثلة مش حدود عامة، ويكتشف إن اتنين فاصلة واحد في المية مادة عضوية واقعة في فراغ اتنين إلى تلاتة في المية، وينتبه لفراغات الفوسفور والبوتاسيوم، ويربط تفسير بي إتش، الفوسفور، البوتاسيوم بطريقة الاختبار والمحصول والمعايرة الخاصة بالمنطقة في المعمل، وما يحسمش تصنيف بدون سند.\n\nيجتاز لما كل تصنيف يكون له مرجع مناسب ومعلن أو يكتبه غير محسوم. تكرار وصف النموذج لـاتنين فاصلة واحد في المية إنها منخفضة من نفس الجدول مش كفاية.\n\nيقدم خطوتين واقعيتين لحالة طماطم فعلية أو حالة تدريب موضّح إنها معطاة، ويبرر الأولوية ويطلب البيانات الناقصة زي احتياج الجير وطريقة استخلاص الفوسفور وتحليل محسن التربة وخطة المحصول ومصادر المغذيات السابقة، من غير تخمين جرعة.\n\nيجتاز لما الاقتراح والأولوية مرتبطين بدليل الحالة وحدودها. أي معدل ثابت للكمبوست بسمك اتنين إلى تلاتة بوصة، أو أي جرعة سماد أو جير من غير سند للحقل تستلزم مراجعة ومحاولة تانية.')], 'en': [('A schematic online rehearsal does not measure soil or certify chemical handling. Actual kit/manual/SDS and individual trainer observation govern practical work.\n\nThe blocks reproduce this lesson’s illustrative chart only. Space between blocks is deliberately unclassified. This is not a crop-specific laboratory scale, a nutrient-dose calculator or a soil simulation.\n\nSort each Field 3 value by provenance: learner measured, trainer supplied, trainer demonstration, or missing; add methods and units.\n\nFor each chart value, choose class only if a valid cited interpretation covers it; mark OM 2.1% and other chart gaps unresolved.\n\nWrite two conditional tomato actions and choose one priority, naming the missing laboratory or site evidence.', 'A schematic online rehearsal does not measure soil or certify chemical handling. Actual kit, manual, SDS and individual trainer observation govern practical work.\n\nThe bands reproduce this lesson’s illustrative chart only. Space between blocks is deliberately unclassified. This is not a crop-specific laboratory scale, a nutrient-dose calculator or a soil simulation.\n\nSort each Field three value by provenance: learner measured, trainer supplied, trainer demonstration, or missing; add methods and units.\n\nFor each chart value, choose class only if a valid cited interpretation covers it; mark organic matter two point one percent and other chart gaps unresolved.\n\nWrite two conditional tomato actions and choose one priority, naming the missing laboratory or site evidence.'), ('Active plan: 95 minutes = 5 + 35 + 10 + 45. The Field 3 block is 40 minutes plus 5 discussion; inside the 40, 20 + 20 are proposed active stages. Drying, full settling and laboratory waits are additional elapsed time. The trainer releases OM/P/K only after physical measurements; an online click cannot verify that event. Keep individual observations and signatures separate. For group work, the trainer prepares one equipment set and one identified, pre-dried, sieved sample per group, subject to actual facilities and the approved safe method. Prepare blank report templates and keep the supplied OM/P/K handout separate until its release stage. For support, highlight the relevant interpretation-table rows without filling unclassified intervals or assuming low organic matter.', 'Active plan: ninety-five minutes equals five plus thirty-five plus ten plus forty-five. The Field three block is forty minutes plus five discussion; inside the forty, twenty plus twenty are proposed active stages. Drying, full settling and laboratory waits are additional elapsed time. The trainer releases organic matter, P, K only after physical measurements; an online click cannot verify that event. Keep individual observations and signatures separate. For group work, the trainer prepares one equipment set and one identified, pre-dried, sieved sample per group, subject to actual facilities and the approved safe method. Prepare blank report templates and keep the supplied organic matter, P, K handout separate until its release stage. For support, highlight the relevant interpretation-table rows without filling unclassified intervals or assuming low organic matter.'), ("Identifies client, Field 3/sample ID and date; tables actual learner pH and texture separately from supplied OM 2.1%, P 12 ppm and K 185 ppm; gives correct units, test method or explicitly missing method, and no fabricated N result.\n\nPass when provenance and units are accurate and an incomplete method is flagged; copied model measurements or implied independent NPK/OM performance require targeted review and retry.\n\nTreats source ranges as illustrative, spots OM 2.1% in the 2–3% gap and P/K gaps, and conditions pH/P/K interpretations on test method, crop and regional laboratory calibration; does not assign a final class to an unsupported value.\n\nPass when each class is tied to a suitable stated reference or marked unresolved. Repeating the model's unsupported OM label is insufficient.\n\nFor the actual or distinctly supplied tomato case, proposes two feasible next actions with rationale, a defensible priority, and missing data such as lime requirement, P extraction, amendment analysis, site/crop plan and nutrient credits; gives no guessed lime or fertilizer rate.\n\nPass when action and priority follow the case evidence and limits; fixed 2–3-inch compost, fertilizer or lime rates without a site-specific basis require review and retry.", "Identifies client, Field three, sample ID and date; tables actual learner P H and texture separately from supplied organic matter two point one percent, P twelve parts per million and K one hundred eighty-five parts per million; gives correct units, test method or explicitly missing method, and no fabricated N result.\n\nPass when provenance and units are accurate and an incomplete method is flagged; copied model measurements or implied independent N P K, organic matter performance require targeted review and retry.\n\nTreats source ranges as illustrative, spots organic matter two point one percent in the two to three percent gap and P, K gaps, and conditions P H, P, K interpretations on test method, crop and regional laboratory calibration; does not assign a final class to an unsupported value.\n\nPass when each class is tied to a suitable stated reference or marked unresolved. Repeating the model's unsupported organic matter label is insufficient.\n\nFor the actual or distinctly supplied tomato case, proposes two feasible next actions with rationale, a defensible priority, and missing data such as lime requirement, P extraction, amendment analysis, site, crop plan and nutrient credits; gives no guessed lime or fertilizer rate.\n\nPass when action and priority follow the case evidence and limits; fixed two to three-inch compost, fertilizer or lime rates without a site-specific basis require review and retry."), ('Keep unknown values blank and explain why. Saving does not validate results, interpretation, chronology or a practical pass. Supplied figures below are curriculum fixtures, not proof a real trainer released the handout.\n\n1. Client and sample information\n\n2. Results and provenance\n\n3. Interpretation and reference\n\n4. Two conditional actions and one priority\n\n5. Comments and remaining evidence\n\nClient / field / sample ID\n\nCollection and test dates / location / crop\n\nParameter\n\nActual value (or blank)\n\nMethod / units / origin / record / missing-data reason\n\nOwn pH (unitless)\n\nOwn sand/silt/clay percentages and texture class\n\nSupplied OM 2.1%\n\nSupplied P 12 ppm\n\nSupplied K 185 ppm\n\nN: not supplied\n\nInterpret each result with its reference, or mark unresolved and explain\n\nFirst conditional action and its evidence\n\nSecond conditional action and its evidence\n\nOne priority, reason and what could change it\n\nComments, missing information and trainer feedback (blank until received)\n\nReport rehearsal; actual practical observation remains separate\n\nIntegrated report practice worksheet', 'Keep unknown values blank and explain why. Saving does not validate results, interpretation, chronology or a practical pass. Supplied figures below are curriculum fixtures, not proof a real trainer released the handout.\n\none. Client and sample information\n\ntwo. Results and provenance\n\nthree. Interpretation and reference\n\nfour. Two conditional actions and one priority\n\nfive. Comments and remaining evidence\n\nClient, field, sample ID\n\nCollection and test dates, location, crop\n\nParameter\n\nActual value (or blank)\n\nMethod, units, origin, record, missing-data reason\n\nOwn P H (unitless)\n\nOwn sand, silt, clay percentages and texture class\n\nSupplied organic matter two point one percent \n\nSupplied P twelve parts per million\n\nSupplied K one hundred eighty-five parts per million\n\nN: not supplied\n\nInterpret each result with its reference, or mark unresolved and explain\n\nFirst conditional action and its evidence\n\nSecond conditional action and its evidence\n\nOne priority, reason and what could change it\n\nComments, missing information and trainer feedback (blank until received)\n\nReport rehearsal; actual practical observation remains separate\n\nIntegrated report practice worksheet'), ('Sentence starter: “Because [result] means [interpretation under named reference], the next action is [action], provided [missing evidence/condition].”\n\nAttempt your explanation before comparing\n\nWrite your own attempt first.\n\nThe comparison checks no free-text meaning and certifies no practical skill.\n\nAdd sample identity and a missing-evidence/comment note. Leave unavailable results blank.\n\nPhysical observation / feedback / date / signature: blank until observed', 'Sentence starter: “Because result means interpretation under named reference, the next action is action, provided missing evidence, condition.”\n\nAttempt your explanation before comparing\n\nWrite your own attempt first.\n\nThe comparison checks no free-text meaning and certifies no practical skill.\n\nAdd sample identity and a missing-evidence, comment note. Leave unavailable results blank.\n\nPhysical observation, feedback, date, signature: blank until observed'), ('Where did each Field 3 value come from?\n\nLearner’s own staged measurement, not yet supplied here\n\nTrainer-supplied result; method still required\n\nNo result supplied; missing is not zero\n\nOwn pH record\n\nOwn texture record\n\nOM 2.1%\n\nP 12 ppm\n\nK 185 ppm\n\nN: no number\n\nOrigins agree: personal pH/texture stay blank until actually measured; OM/P/K are supplied; N remains missing.\n\nRevisit who measured each result. A model is not your observation, and no N number means missing, not zero.', 'Where did each Field three value come from?\n\nLearner’s own staged measurement, not yet supplied here\n\nTrainer-supplied result; method still required\n\nNo result supplied; missing is not zero\n\nOwn P H record\n\nOwn texture record\n\norganic matter two point one percent \n\nP twelve parts per million\n\nK one hundred eighty-five parts per million\n\nN: no number\n\nOrigins agree: personal P H, texture stay blank until actually measured; organic matter, P, K are supplied; N remains missing.\n\nRevisit who measured each result. A model is not your observation, and no N number means missing, not zero.')], 'it': [('Avvio di frase: «Poiché [risultato] significa [interpretazione con riferimento], il prossimo passo è [azione], purché [prova/condizione mancante]».\n\nProva a spiegare prima del confronto\n\nScrivi prima un tentativo.\n\nIl confronto non valuta il significato del testo e non certifica abilità pratiche.\n\nInserisci identità e nota sui dati mancanti. Lascia vuoti i risultati non disponibili.\n\nOsservazione / riscontro / data / firma: vuoti fino all’osservazione', 'Avvio di frase: «Poiché risultato significa interpretazione con riferimento, il prossimo passo è azione, purché prova, condizione mancante».\n\nProva a spiegare prima del confronto\n\nScrivi prima un tentativo.\n\nIl confronto non valuta il significato del testo e non certifica abilità pratiche.\n\nInserisci identità e nota sui dati mancanti. Lascia vuoti i risultati non disponibili.\n\nOsservazione, riscontro, data, firma: vuoti fino all’osservazione'), ('Da dove proviene ogni valore del Campo 3?\n\nMisura personale nelle fasi pratiche, qui ancora non disponibile\n\nDato fornito dal formatore; metodo ancora necessario\n\nNessun dato fornito; mancante non è zero\n\nTuo registro pH\n\nTuo registro tessitura\n\nOM 2.1%\n\nP 12 ppm\n\nK 185 ppm\n\nN: nessun numero\n\nOrigini corrette: pH/tessitura personali vuoti fino alla misura; OM/P/K forniti; N mancante.\n\nRivedi chi ha misurato. Il modello non è una tua osservazione; N assente non vale zero.', 'Da dove proviene ogni valore del Campo tre?\n\nMisura personale nelle fasi pratiche, qui ancora non disponibile\n\nDato fornito dal formatore; metodo ancora necessario\n\nNessun dato fornito; mancante non è zero\n\nTuo registro pi acca\n\nTuo registro tessitura\n\nsostanza organica due virgola uno per cento \n\npi dodici parti per milione\n\ncappa centottantacinque parti per milione\n\nenne: nessun numero\n\nOrigini corrette: pi acca, tessitura personali vuoti fino alla misura; sostanza organica, pi, cappa forniti; enne mancante.\n\nRivedi chi ha misurato. Il modello non è una tua osservazione; enne assente non vale zero.'), ("Identifica cliente, Campo 3, campione e data; separa pH e tessitura realmente misurati da sostanza organica 2.1%, P 12 ppm e K 185 ppm forniti; riporta unità, metodo o sua assenza e non inventa un risultato per N.\n\nSupera se provenienza e unità sono corrette e il metodo mancante è segnalato; copiare misure del modello o attribuirsi analisi NPK/OM richiede ripasso mirato e nuovo tentativo.\n\nTratta gli intervalli della tabella come esempi, riconosce 2.1% OM nella lacuna 2–3% e le altre lacune P/K, condiziona pH/P/K a metodo, coltura e riferimento regionale; non attribuisce una classe finale senza supporto.\n\nSupera quando ogni classe è sostenuta da un riferimento idoneo o marcata irrisolta. Ripetere la classificazione OM del modello non basta.\n\nPer il caso reale o esplicitamente fornito sul pomodoro propone due azioni possibili e motivate, una priorità e dati mancanti quali fabbisogno di calce, estrazione di P, analisi dell'ammendante, piano colturale e apporti pregressi; non inventa una dose.\n\nSupera quando azioni e priorità derivano dalle prove e dai limiti del caso; dosi fisse di calce, compost o concime senza base locale richiedono ripasso.", "Identifica cliente, Campo tre, campione e data; separa pi acca e tessitura realmente misurati da sostanza organica due virgola uno per cento, pi dodici parti per milione e cappa centottantacinque parti per milione forniti; riporta unità, metodo o sua assenza e non inventa un risultato per enne.\n\nSupera se provenienza e unità sono corrette e il metodo mancante è segnalato; copiare misure del modello o attribuirsi analisi enne pi cappa, sostanza organica richiede ripasso mirato e nuovo tentativo.\n\nTratta gli intervalli della tabella come esempi, riconosce due virgola uno per cento sostanza organica nella lacuna due a tre per cento e le altre lacune pi, cappa, condiziona pi acca, pi, cappa a metodo, coltura e riferimento regionale; non attribuisce una classe finale senza supporto.\n\nSupera quando ogni classe è sostenuta da un riferimento idoneo o marcata irrisolta. Ripetere la classificazione sostanza organica del modello non basta.\n\nPer il caso reale o esplicitamente fornito sul pomodoro propone due azioni possibili e motivate, una priorità e dati mancanti quali fabbisogno di calce, estrazione di pi, analisi dell'ammendante, piano colturale e apporti pregressi; non inventa una dose.\n\nSupera quando azioni e priorità derivano dalle prove e dai limiti del caso; dosi fisse di calce, compost o concime senza base locale richiedono ripasso."), ('La simulazione non misura terreno né certifica uso di reagenti. Kit reale, manuale/SDS e osservazione individuale del formatore regolano la pratica.\n\nI blocchi riproducono solo la tabella illustrativa della lezione. Gli spazi sono deliberatamente non classificati. Non è una scala di laboratorio per una coltura, un calcolatore di dosi o una simulazione del suolo.\n\nClassifica ogni valore del Campo 3 per provenienza: misurato da te, fornito dal formatore, dimostrato o mancante; aggiungi metodi e unità.\n\nPer ogni valore usa una classe solo se un riferimento valido la copre; segna OM 2.1% e altri vuoti come irrisolti.\n\nScrivi due azioni condizionate per il pomodoro e scegline una prioritaria indicando dati di laboratorio o sito ancora necessari.', 'La simulazione non misura terreno né certifica uso di reagenti. Kit reale, manuale, SDS e osservazione individuale del formatore regolano la pratica.\n\nLe fasce riproducono solo la tabella illustrativa della lezione. Gli spazi sono deliberatamente non classificati. Non è una scala di laboratorio per una coltura, un calcolatore di dosi o una simulazione del suolo.\n\nClassifica ogni valore del Campo tre per provenienza: misurato da te, fornito dal formatore, dimostrato o mancante; aggiungi metodi e unità.\n\nPer ogni valore usa una classe solo se un riferimento valido la copre; segna sostanza organica due virgola uno per cento e altri vuoti come irrisolti.\n\nScrivi due azioni condizionate per il pomodoro e scegline una prioritaria indicando dati di laboratorio o sito ancora necessari.'), ('Lascia ignoti vuoti e motiva. Salvare non verifica risultati, significato, cronologia o pratica. Le cifre fornite sono dati didattici, non prova di consegna reale da parte del formatore.\n\n1. Cliente e campione\n\n2. Risultati e provenienza\n\n3. Interpretazione e riferimento\n\n4. Due azioni condizionate e una priorità\n\n5. Commenti e prove ancora mancanti\n\nCliente / campo / ID campione\n\nDate di raccolta e prova / sito / coltura\n\nParametro\n\nValore reale, o vuoto\n\nMetodo / unità / origine / registro / motivo del dato mancante\n\nTuo pH (senza unità)\n\nTue percentuali sabbia/limo/argilla e classe\n\nOM fornita 2.1%\n\nP fornito 12 ppm\n\nK fornito 185 ppm\n\nN: non fornito\n\nInterpreta ogni risultato con riferimento, oppure irrisolto con motivo\n\nPrima azione condizionata e prova\n\nSeconda azione condizionata e prova\n\nUna priorità, motivo e cosa potrebbe cambiarla\n\nCommenti, informazioni mancanti e riscontro del formatore (lascia vuoto finché non è stato ricevuto)\n\nEsercizio di rapporto; osservazione pratica separata\n\nScheda rapporto integrato', 'Lascia ignoti vuoti e motiva. Salvare non verifica risultati, significato, cronologia o pratica. Le cifre fornite sono dati didattici, non prova di consegna reale da parte del formatore.\n\nuno. Cliente e campione\n\ndue. Risultati e provenienza\n\ntre. Interpretazione e riferimento\n\nquattro. Due azioni condizionate e una priorità\n\ncinque. Commenti e prove ancora mancanti\n\nCliente, campo, ID campione\n\nDate di raccolta e prova, sito, coltura\n\nParametro\n\nValore reale, o vuoto\n\nMetodo, unità, origine, registro, motivo del dato mancante\n\nTuo pi acca (senza unità)\n\nTue percentuali sabbia, limo, argilla e classe\n\nsostanza organica fornita due virgola uno per cento \n\npi fornito dodici parti per milione\n\ncappa fornito centottantacinque parti per milione\n\nenne: non fornito\n\nInterpreta ogni risultato con riferimento, oppure irrisolto con motivo\n\nPrima azione condizionata e prova\n\nSeconda azione condizionata e prova\n\nUna priorità, motivo e cosa potrebbe cambiarla\n\nCommenti, informazioni mancanti e riscontro del formatore (lascia vuoto finché non è stato ricevuto)\n\nEsercizio di rapporto; osservazione pratica separata\n\nScheda rapporto integrato'), ('Piano attivo: 95 minuti = 5 + 35 + 10 + 45. Campo 3: 40 minuti più 5 discussione; nei 40 sono proposte fasi attive 20 + 20. Essiccazione, sedimentazione e laboratorio richiedono altro tempo. Il formatore consegna OM/P/K dopo le misure fisiche; un clic online non verifica questo evento. Osservazioni individuali e firme separate. Per il lavoro di gruppo, il formatore prepara un set di attrezzature e un campione identificato, già essiccato e setacciato per ciascun gruppo, compatibilmente con le strutture disponibili e il metodo sicuro approvato. Prepara modelli di rapporto vuoti e tiene separata la scheda OM/P/K fino alla fase prevista per la consegna. Per chi ha bisogno di supporto, evidenzia le righe pertinenti della tabella interpretativa senza colmare gli intervalli non classificati né presumere un basso contenuto di sostanza organica.', 'Piano attivo: novantacinque minuti uguale a cinque più trentacinque più dieci più quarantacinque. Campo tre: quaranta minuti più cinque discussione; nei quaranta sono proposte fasi attive venti più venti. Essiccazione, sedimentazione e laboratorio richiedono altro tempo. Il formatore consegna sostanza organica, pi, cappa dopo le misure fisiche; un clic online non verifica questo evento. Osservazioni individuali e firme separate. Per il lavoro di gruppo, il formatore prepara un set di attrezzature e un campione identificato, già essiccato e setacciato per ciascun gruppo, compatibilmente con le strutture disponibili e il metodo sicuro approvato. Prepara modelli di rapporto vuoti e tiene separata la scheda sostanza organica, pi, cappa fino alla fase prevista per la consegna. Per chi ha bisogno di supporto, evidenzia le righe pertinenti della tabella interpretativa senza colmare gli intervalli non classificati né presumere un basso contenuto di sostanza organica.')], 'de': [('Aktivplan: 95 Minuten = 5 + 35 + 10 + 45. Feld 3: 40 Minuten plus 5 Austausch, darin vorgeschlagene aktive Stufen 20 + 20. Trocknen, vollständiges Absetzen und Labor brauchen zusätzliche Zeit. Die Fachkraft gibt OM/P/K nach den physikalischen Messungen aus; ein Online-Klick bestätigt das nicht. Einzelbeobachtungen und Unterschriften getrennt. Für die Gruppenarbeit bereitet die Fachkraft je Gruppe einen Gerätesatz und eine gekennzeichnete, bereits getrocknete und gesiebte Probe vor, soweit die tatsächliche Ausstattung und das freigegebene sichere Verfahren dies erlauben. Leere Berichtsvorlagen werden vorbereitet; das OM/P/K-Datenblatt bleibt bis zur vorgesehenen Ausgabe getrennt. Zur Unterstützung werden die passenden Zeilen der Interpretationstabelle hervorgehoben, ohne unklassifizierte Intervalle auszufüllen oder einen niedrigen Gehalt an organischer Substanz vorauszusetzen.', 'Aktivplan: fünfundneunzig Minuten gleich fünf plus fünfunddreißig plus zehn plus fünfundvierzig. Feld drei: vierzig Minuten plus fünf Austausch, darin vorgeschlagene aktive Stufen zwanzig plus zwanzig. Trocknen, vollständiges Absetzen und Labor brauchen zusätzliche Zeit. Die Fachkraft gibt organische Substanz, Pe, Ka nach den physikalischen Messungen aus; ein Online-Klick bestätigt das nicht. Einzelbeobachtungen und Unterschriften getrennt. Für die Gruppenarbeit bereitet die Fachkraft je Gruppe einen Gerätesatz und eine gekennzeichnete, bereits getrocknete und gesiebte Probe vor, soweit die tatsächliche Ausstattung und das freigegebene sichere Verfahren dies erlauben. Leere Berichtsvorlagen werden vorbereitet; das organische Substanz, Pe, Ka-Datenblatt bleibt bis zur vorgesehenen Ausgabe getrennt. Zur Unterstützung werden die passenden Zeilen der Interpretationstabelle hervorgehoben, ohne unklassifizierte Intervalle auszufüllen oder einen niedrigen Gehalt an organischer Substanz vorauszusetzen.'), ('Die Simulation misst keinen Boden und bestätigt keinen Reagenzumgang. Echtes Set, Anleitung/SDS und individuelle Beobachtung bestimmen die Praxis.\n\nDie Blöcke zeigen nur die beispielhafte Lehrtabelle. Zwischenräume bleiben bewusst unklassifiziert. Keine kulturspezifische Laborskala, Mengenberechnung oder Bodensimulation.\n\nSortiere jeden Feld-3-Wert nach Herkunft: selbst gemessen, von der Fachkraft erhalten, vorgeführt oder fehlend; ergänze Verfahren und Einheiten.\n\nVergib für einen Tabellenwert nur mit gültiger einschlägiger Referenz eine Klasse; organische Substanz 2.1% und andere Lücken bleiben offen.\n\nSchreibe zwei bedingte Schritte für Tomaten und wähle eine Priorität samt noch nötigen Labor- oder Standortdaten.', 'Die Simulation misst keinen Boden und bestätigt keinen Reagenzumgang. Echtes Set, Anleitung, SDS und individuelle Beobachtung bestimmen die Praxis.\n\nDie Bänder zeigen nur die beispielhafte Lehrtabelle. Zwischenräume bleiben bewusst unklassifiziert. Keine kulturspezifische Laborskala, Mengenberechnung oder Bodensimulation.\n\nSortiere jeden Feld-drei-Wert nach Herkunft: selbst gemessen, von der Fachkraft erhalten, vorgeführt oder fehlend; ergänze Verfahren und Einheiten.\n\nVergib für einen Tabellenwert nur mit gültiger einschlägiger Referenz eine Klasse; organische Substanz zwei Komma eins Prozent und andere Lücken bleiben offen.\n\nSchreibe zwei bedingte Schritte für Tomaten und wähle eine Priorität samt noch nötigen Labor- oder Standortdaten.'), ('Nennt Auftraggeber, Feld 3, Proben-ID und Datum; trennt eigenen pH und eigene Textur von den bereitgestellten Werten organische Substanz 2.1%, P 12 ppm und K 185 ppm, dokumentiert Einheiten und Verfahren oder deren Fehlen und erfindet keinen N-Wert.\n\nBestanden bei korrekter Herkunft und Einheit sowie klar markierter fehlender Methode; kopierte Musterwerte oder behauptete eigenständige NPK/OM-Analysen führen zu gezielter Wiederholung.\n\nBehandelt die Tabellenwerte als Beispiele, erkennt 2.1% organische Substanz in der Lücke 2–3% sowie P/K-Lücken und bindet pH/P/K-Deutung an Verfahren, Kultur und regionale Laborkalibrierung; vergibt keine unbelegte endgültige Klasse.\n\nBestanden, wenn jede Klasse auf einer geeigneten benannten Referenz beruht oder offen bleibt. Die unbelegte OM-Etikette des Musters zu wiederholen reicht nicht.\n\nSchlägt für einen echten oder ausdrücklich vorgegebenen Tomatenfall zwei plausible nächste Schritte mit Gründen vor, wählt eine Priorität und nennt fehlende Daten wie Kalkbedarf, P-Extraktion, Analyse des Bodenverbesserungsmittels, Kulturplan und frühere Nährstoffgaben; keine erfundene Menge.\n\nBestanden, wenn Maßnahme und Vorrang aus Fall und Unsicherheit folgen; pauschale Kalk-, Kompost- oder Düngermengen ohne Standortgrundlage erfordern Wiederholung.', 'Nennt Auftraggeber, Feld drei, Proben-ID und Datum; trennt eigenen Pe Ha und eigene Textur von den bereitgestellten Werten organische Substanz zwei Komma eins Prozent, Pe zwölf Teile pro Million und Ka einhundertfünfundachtzig Teile pro Million, dokumentiert Einheiten und Verfahren oder deren Fehlen und erfindet keinen En-Wert.\n\nBestanden bei korrekter Herkunft und Einheit sowie klar markierter fehlender Methode; kopierte Musterwerte oder behauptete eigenständige En Pe Ka, organische Substanz-Analysen führen zu gezielter Wiederholung.\n\nBehandelt die Tabellenwerte als Beispiele, erkennt zwei Komma eins Prozent organische Substanz in der Lücke zwei bis drei Prozent sowie Pe, Ka-Lücken und bindet Pe Ha, Pe, Ka-Deutung an Verfahren, Kultur und regionale Laborkalibrierung; vergibt keine unbelegte endgültige Klasse.\n\nBestanden, wenn jede Klasse auf einer geeigneten benannten Referenz beruht oder offen bleibt. Die unbelegte organische Substanz-Etikette des Musters zu wiederholen reicht nicht.\n\nSchlägt für einen echten oder ausdrücklich vorgegebenen Tomatenfall zwei plausible nächste Schritte mit Gründen vor, wählt eine Priorität und nennt fehlende Daten wie Kalkbedarf, Pe-Extraktion, Analyse des Bodenverbesserungsmittels, Kulturplan und frühere Nährstoffgaben; keine erfundene Menge.\n\nBestanden, wenn Maßnahme und Vorrang aus Fall und Unsicherheit folgen; pauschale Kalk-, Kompost- oder Düngermengen ohne Standortgrundlage erfordern Wiederholung.'), ('Satzanfang: „Weil [Ergebnis] nach [benannter Referenz] [Deutung] bedeutet, folgt [Schritt], sofern [fehlender Beleg/Voraussetzung].“\n\nVor dem Vergleich selbst begründen\n\nZuerst eigenen Versuch schreiben.\n\nDer Vergleich bewertet keine Freitextbedeutung und bestätigt keine praktische Leistung.\n\nProbenkennung und Kommentar zu fehlenden Belegen eintragen. Nicht verfügbare Ergebnisse leer lassen.\n\nBeobachtung / Rückmeldung / Datum / Unterschrift: bis Beobachtung leer', 'Satzanfang: „Weil Ergebnis nach benannter Referenz Deutung bedeutet, folgt Schritt, sofern fehlender Beleg, Voraussetzung.“\n\nVor dem Vergleich selbst begründen\n\nZuerst eigenen Versuch schreiben.\n\nDer Vergleich bewertet keine Freitextbedeutung und bestätigt keine praktische Leistung.\n\nProbenkennung und Kommentar zu fehlenden Belegen eintragen. Nicht verfügbare Ergebnisse leer lassen.\n\nBeobachtung, Rückmeldung, Datum, Unterschrift: bis Beobachtung leer'), ('Unbekanntes leer lassen und begründen. Speichern bestätigt weder Befund, Deutung, Reihenfolge noch Praxis. Vorgegebene Zahlen sind Lehrdaten, kein Nachweis einer echten Ergebnisübergabe.\n\n1. Auftraggeber und Probe\n\n2. Ergebnisse und Herkunft\n\n3. Deutung und Referenz\n\n4. Zwei bedingte Schritte und eine Priorität\n\n5. Anmerkungen und fehlende Belege\n\nAuftraggeber / Feld / Proben-ID\n\nEntnahme-/Testdaten / Standort / Kultur\n\nParameter\n\nTatsächlicher Wert oder leer\n\nVerfahren / Einheit / Herkunft / Protokoll / Grund fehlender Daten\n\nEigener pH (einheitenlos)\n\nEigene Sand-/Schluff-/Tonanteile und Klasse\n\nBereitgestellte OM 2.1%\n\nBereitgestelltes P 12 ppm\n\nBereitgestelltes K 185 ppm\n\nN: nicht bereitgestellt\n\nJeden Befund mit Referenz deuten oder als offen begründen\n\nErster bedingter Schritt und Beleg\n\nZweiter bedingter Schritt und Beleg\n\nEine Priorität, Grund und mögliche Änderung\n\nAnmerkungen, offene Daten und Rückmeldung (bis Erhalt leer)\n\nBerichtsübung; tatsächliche Praxisbeobachtung getrennt\n\nArbeitsblatt integrierter Bericht', 'Unbekanntes leer lassen und begründen. Speichern bestätigt weder Befund, Deutung, Reihenfolge noch Praxis. Vorgegebene Zahlen sind Lehrdaten, kein Nachweis einer echten Ergebnisübergabe.\n\neins. Auftraggeber und Probe\n\nzwei. Ergebnisse und Herkunft\n\ndrei. Deutung und Referenz\n\nvier. Zwei bedingte Schritte und eine Priorität\n\nfünf. Anmerkungen und fehlende Belege\n\nAuftraggeber, Feld, Proben-ID\n\nEntnahme-, Testdaten, Standort, Kultur\n\nParameter\n\nTatsächlicher Wert oder leer\n\nVerfahren, Einheit, Herkunft, Protokoll, Grund fehlender Daten\n\nEigener Pe Ha (einheitenlos)\n\nEigene Sand-, Schluff-, Tonanteile und Klasse\n\nBereitgestellte organische Substanz zwei Komma eins Prozent \n\nBereitgestelltes Pe zwölf Teile pro Million\n\nBereitgestelltes Ka einhundertfünfundachtzig Teile pro Million\n\nEn: nicht bereitgestellt\n\nJeden Befund mit Referenz deuten oder als offen begründen\n\nErster bedingter Schritt und Beleg\n\nZweiter bedingter Schritt und Beleg\n\nEine Priorität, Grund und mögliche Änderung\n\nAnmerkungen, offene Daten und Rückmeldung (bis Erhalt leer)\n\nBerichtsübung; tatsächliche Praxisbeobachtung getrennt\n\nArbeitsblatt integrierter Bericht'), ('Woher stammt jeder Feld-3-Wert?\n\nEigene praktische Messung in Stufen; hier noch nicht vorhanden\n\nVon der Fachkraft bereitgestellt; Verfahren noch nötig\n\nKein Befund bereitgestellt; fehlend heißt nicht null\n\nEigenes pH-Protokoll\n\nEigenes Texturprotokoll\n\nOM 2.1%\n\nP 12 ppm\n\nK 185 ppm\n\nN: keine Zahl\n\nHerkunft stimmt: eigene pH-/Texturwerte bis zur Messung leer; OM/P/K bereitgestellt; N fehlt.\n\nPrüfe die Herkunft: ein Muster ist keine eigene Beobachtung, fehlendes N ist nicht null.', 'Woher stammt jeder Feld-drei-Wert?\n\nEigene praktische Messung in Stufen; hier noch nicht vorhanden\n\nVon der Fachkraft bereitgestellt; Verfahren noch nötig\n\nKein Befund bereitgestellt; fehlend heißt nicht null\n\nEigenes Pe Ha-Protokoll\n\nEigenes Texturprotokoll\n\norganische Substanz zwei Komma eins Prozent \n\nPe zwölf Teile pro Million\n\nKa einhundertfünfundachtzig Teile pro Million\n\nEn: keine Zahl\n\nHerkunft stimmt: eigene Pe Ha-, Texturwerte bis zur Messung leer; organische Substanz, Pe, Ka bereitgestellt; En fehlt.\n\nPrüfe die Herkunft: ein Muster ist keine eigene Beobachtung, fehlendes En ist nicht null.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s214-lab-audio-20261023-r1'
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
