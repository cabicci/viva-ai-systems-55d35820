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
IDS = ('S2-15-ar-EG-report-record-layout-r1', 'S2-15-ar-EG-report-process-and-peer-r1', 'S2-15-ar-EG-report-criteria-r1', 'S2-15-ar-EG-report-trainer-and-timing-r1', 'S2-15-en-report-record-layout-r1', 'S2-15-en-report-process-and-peer-r1', 'S2-15-en-report-criteria-r1', 'S2-15-en-report-trainer-and-timing-r1', 'S2-15-it-report-record-layout-r1', 'S2-15-it-report-process-and-peer-r1', 'S2-15-it-report-criteria-r1', 'S2-15-it-report-trainer-and-timing-r1', 'S2-15-de-report-record-layout-r1', 'S2-15-de-report-process-and-peer-r1', 'S2-15-de-report-criteria-r1', 'S2-15-de-report-trainer-and-timing-r1')
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
    assert(req['scope'],req['stepId'])==('S215_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-15')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s215-guidance-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['report-record-layout','report-process-and-peer','report-criteria','report-trainer-and-timing']
        voice='Charon'if group in ['report-record-layout','report-criteria']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'report-record-layout': ['/portfolio/ui/modelHelp', '/portfolio/ui/sections/0', '/portfolio/ui/sections/1', '/portfolio/ui/sections/2', '/portfolio/ui/sections/3', '/portfolio/ui/sections/4', '/portfolio/ui/identityFields/0', '/portfolio/ui/identityFields/1', '/portfolio/ui/resultColumns/0', '/portfolio/ui/resultColumns/1', '/portfolio/ui/resultColumns/2', '/portfolio/ui/resultNames/0', '/portfolio/ui/resultNames/1', '/portfolio/ui/resultNames/2', '/portfolio/ui/resultNames/3', '/portfolio/ui/resultNames/4', '/portfolio/ui/resultNames/5', '/portfolio/ui/reportFields/0', '/portfolio/ui/reportFields/1', '/portfolio/ui/reportFields/2', '/portfolio/ui/reportFields/3', '/portfolio/ui/reportFields/4', '/portfolio/ui/recordHelp'], 'report-process-and-peer': ['/portfolio/sequence/0', '/portfolio/sequence/1', '/portfolio/sequence/2', '/portfolio/sequence/3', '/portfolio/sequence/4', '/portfolio/peerReview/prompt', '/portfolio/peerReview/trainerBoundary', '/portfolio/ui/casesHelp', '/portfolio/ui/reason', '/portfolio/ui/reasonBoundary'], 'report-criteria': ['/portfolio/passChecks/0/evidence', '/portfolio/passChecks/0/decision', '/portfolio/passChecks/1/evidence', '/portfolio/passChecks/1/decision', '/portfolio/passChecks/2/evidence', '/portfolio/passChecks/2/decision', '/portfolio/passChecks/3/evidence', '/portfolio/passChecks/3/decision'], 'report-trainer-and-timing': ['/portfolio/ui/trainerTitle', '/portfolio/ui/trainerRows/0', '/portfolio/ui/trainerRows/1', '/portfolio/ui/trainerRows/2', '/portfolio/ui/trainerRows/3', '/portfolio/ui/trainerRows/4', '/portfolio/ui/trainerNote', '/portfolio/practical/instruction', '/portfolio/ui/timing']}, 'en': {'report-record-layout': ['/portfolio/ui/modelHelp', '/portfolio/ui/sections/0', '/portfolio/ui/sections/1', '/portfolio/ui/sections/2', '/portfolio/ui/sections/3', '/portfolio/ui/sections/4', '/portfolio/ui/identityFields/0', '/portfolio/ui/identityFields/1', '/portfolio/ui/resultColumns/0', '/portfolio/ui/resultColumns/1', '/portfolio/ui/resultColumns/2', '/portfolio/ui/resultNames/0', '/portfolio/ui/resultNames/1', '/portfolio/ui/resultNames/2', '/portfolio/ui/resultNames/3', '/portfolio/ui/resultNames/4', '/portfolio/ui/resultNames/5', '/portfolio/ui/reportFields/0', '/portfolio/ui/reportFields/1', '/portfolio/ui/reportFields/2', '/portfolio/ui/reportFields/3', '/portfolio/ui/reportFields/4', '/portfolio/ui/recordHelp'], 'report-process-and-peer': ['/portfolio/sequence/0', '/portfolio/sequence/1', '/portfolio/sequence/2', '/portfolio/sequence/3', '/portfolio/sequence/4', '/portfolio/peerReview/prompt', '/portfolio/peerReview/trainerBoundary', '/portfolio/ui/casesHelp', '/portfolio/ui/reason', '/portfolio/ui/reasonBoundary'], 'report-criteria': ['/portfolio/passChecks/0/evidence', '/portfolio/passChecks/0/decision', '/portfolio/passChecks/1/evidence', '/portfolio/passChecks/1/decision', '/portfolio/passChecks/2/evidence', '/portfolio/passChecks/2/decision', '/portfolio/passChecks/3/evidence', '/portfolio/passChecks/3/decision'], 'report-trainer-and-timing': ['/portfolio/ui/trainerTitle', '/portfolio/ui/trainerRows/0', '/portfolio/ui/trainerRows/1', '/portfolio/ui/trainerRows/2', '/portfolio/ui/trainerRows/3', '/portfolio/ui/trainerRows/4', '/portfolio/ui/trainerNote', '/portfolio/practical/instruction', '/portfolio/ui/timing']}, 'it': {'report-record-layout': ['/portfolio/ui/modelHelp', '/portfolio/ui/sections/0', '/portfolio/ui/sections/1', '/portfolio/ui/sections/2', '/portfolio/ui/sections/3', '/portfolio/ui/sections/4', '/portfolio/ui/identityFields/0', '/portfolio/ui/identityFields/1', '/portfolio/ui/resultColumns/0', '/portfolio/ui/resultColumns/1', '/portfolio/ui/resultColumns/2', '/portfolio/ui/resultNames/0', '/portfolio/ui/resultNames/1', '/portfolio/ui/resultNames/2', '/portfolio/ui/resultNames/3', '/portfolio/ui/resultNames/4', '/portfolio/ui/resultNames/5', '/portfolio/ui/reportFields/0', '/portfolio/ui/reportFields/1', '/portfolio/ui/reportFields/2', '/portfolio/ui/reportFields/3', '/portfolio/ui/reportFields/4', '/portfolio/ui/recordHelp'], 'report-process-and-peer': ['/portfolio/sequence/0', '/portfolio/sequence/1', '/portfolio/sequence/2', '/portfolio/sequence/3', '/portfolio/sequence/4', '/portfolio/peerReview/prompt', '/portfolio/peerReview/trainerBoundary', '/portfolio/ui/casesHelp', '/portfolio/ui/reason', '/portfolio/ui/reasonBoundary'], 'report-criteria': ['/portfolio/passChecks/0/evidence', '/portfolio/passChecks/0/decision', '/portfolio/passChecks/1/evidence', '/portfolio/passChecks/1/decision', '/portfolio/passChecks/2/evidence', '/portfolio/passChecks/2/decision', '/portfolio/passChecks/3/evidence', '/portfolio/passChecks/3/decision'], 'report-trainer-and-timing': ['/portfolio/ui/trainerTitle', '/portfolio/ui/trainerRows/0', '/portfolio/ui/trainerRows/1', '/portfolio/ui/trainerRows/2', '/portfolio/ui/trainerRows/3', '/portfolio/ui/trainerRows/4', '/portfolio/ui/trainerNote', '/portfolio/practical/instruction', '/portfolio/ui/timing']}, 'de': {'report-record-layout': ['/portfolio/ui/modelHelp', '/portfolio/ui/sections/0', '/portfolio/ui/sections/1', '/portfolio/ui/sections/2', '/portfolio/ui/sections/3', '/portfolio/ui/sections/4', '/portfolio/ui/identityFields/0', '/portfolio/ui/identityFields/1', '/portfolio/ui/resultColumns/0', '/portfolio/ui/resultColumns/1', '/portfolio/ui/resultColumns/2', '/portfolio/ui/resultNames/0', '/portfolio/ui/resultNames/1', '/portfolio/ui/resultNames/2', '/portfolio/ui/resultNames/3', '/portfolio/ui/resultNames/4', '/portfolio/ui/resultNames/5', '/portfolio/ui/reportFields/0', '/portfolio/ui/reportFields/1', '/portfolio/ui/reportFields/2', '/portfolio/ui/reportFields/3', '/portfolio/ui/reportFields/4', '/portfolio/ui/recordHelp'], 'report-process-and-peer': ['/portfolio/sequence/0', '/portfolio/sequence/1', '/portfolio/sequence/2', '/portfolio/sequence/3', '/portfolio/sequence/4', '/portfolio/peerReview/prompt', '/portfolio/peerReview/trainerBoundary', '/portfolio/ui/casesHelp', '/portfolio/ui/reason', '/portfolio/ui/reasonBoundary'], 'report-criteria': ['/portfolio/passChecks/0/evidence', '/portfolio/passChecks/0/decision', '/portfolio/passChecks/1/evidence', '/portfolio/passChecks/1/decision', '/portfolio/passChecks/2/evidence', '/portfolio/passChecks/2/decision', '/portfolio/passChecks/3/evidence', '/portfolio/passChecks/3/decision'], 'report-trainer-and-timing': ['/portfolio/ui/trainerTitle', '/portfolio/ui/trainerRows/0', '/portfolio/ui/trainerRows/1', '/portfolio/ui/trainerRows/2', '/portfolio/ui/trainerRows/3', '/portfolio/ui/trainerRows/4', '/portfolio/ui/trainerNote', '/portfolio/practical/instruction', '/portfolio/ui/timing']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/portfolio/')for b in u['sourceBindings']);assert not any('/cases/'in b['pointer']or'/ui/scenarios/'in b['pointer']or'/ui/steps/'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('Paddock 3: بطاقة تقييم المنتج بخمس خانات للمدرّب\n\nالتقرير فيه اسم Paddock 3\n\nالنتايج الخمس pH/OM/N/P/K كلها موجودة\n\nشرح النتايج بلغة بسيطة\n\nتوصية محددة واحدة على الأقل مرتبطة بالنقص وبدليل؛ مثال مسحوق العظم محتاج تحقق من المحصول والمعمل والموقع\n\nالتقرير مرتب ومقروء وشكله مهني\n\nسجل المدرّب لسه من غير ملاحظة أو توقيع. معايير المنتج الأصلية الخمسة محفوظة؛ مفيش ضغطة طالب بتسجّل قرار مدرّب.\n\nالخطوة دي بتقيّم التقرير ومراجعة الزميل، وما بتمنحش مهارة ميدانية جديدة. بطاقة منتج Paddock 3 تحتفظ بخانات المدرّب الأصلية الخمس، ولازم مراجع فعلي يسجل الدليل والتصحيح.\n\nخطة الأصل 60 دقيقة نشاط: 5 تمهيد + 10 مفاهيم + 35 كتابة + 10 مناقشة. تعليمات التيسير بتذكر كمان 5 دقايق تجهيز؛ تتنظم ضمن التحضير بدل ما نزود المدة من غير توضيح. مجموعات 3–4 وتنبيه قبل النهاية بـ15 ثم 5 دقايق؛ شرح الزميل دقيقتين جوّه التدريب. مقارنة النموذج بعد المحاولة والمراجعة. الجدول الجاهز وبدايات الجمل مساعدة، مش إثبات إن الطالب بنى الجدول لوحده.', 'بادوك تلاتة: بطاقة تقييم المنتج بخمس خانات للمدرّب\n\nالتقرير فيه اسم بادوك تلاتة\n\nالنتايج الخمس بي إتش، المادة العضوية، النيتروجين والفوسفور والبوتاسيوم كلها موجودة\n\nشرح النتايج بلغة بسيطة\n\nتوصية محددة واحدة على الأقل مرتبطة بالنقص وبدليل؛ مثال مسحوق العظم محتاج تحقق من المحصول والمعمل والموقع\n\nالتقرير مرتب ومقروء وشكله مهني\n\nسجل المدرّب لسه من غير ملاحظة أو توقيع. معايير المنتج الأصلية الخمسة محفوظة؛ مفيش ضغطة طالب بتسجّل قرار مدرّب.\n\nالخطوة دي بتقيّم التقرير ومراجعة الزميل، وما بتمنحش مهارة ميدانية جديدة. بطاقة منتج بادوك تلاتة تحتفظ بخانات المدرّب الأصلية الخمس، ولازم مراجع فعلي يسجل الدليل والتصحيح.\n\nخطة الأصل ستين دقيقة نشاط: خمسة تمهيد زائد عشرة مفاهيم زائد خمسة وتلاتين كتابة زائد عشرة مناقشة. تعليمات التيسير بتذكر كمان خمسة دقايق تجهيز؛ تتنظم ضمن التحضير بدل ما نزود المدة من غير توضيح. مجموعات تلاتة إلى أربعة وتنبيه قبل النهاية بـخمستاشر ثم خمسة دقايق؛ شرح الزميل دقيقتين جوّه التدريب. مقارنة النموذج بعد المحاولة والمراجعة. الجدول الجاهز وبدايات الجمل مساعدة، مش إثبات إن الطالب بنى الجدول لوحده.'), ('ألواح الورق بتدرّبك على تنظيم التقرير. مش قياسات تربة ولا تقرير معتمد. اختار قسم واتدرّب على الترتيب كامل. في كل مثال، اكتب محاولتك قبل ما تفتح المقارنة؛ الزر بيتأكد بس إن فيه كلام مكتوب.\n\nالعنوان وبيانات العميل\n\nالمقدمة والهدف\n\nالطريقة والملاحظات\n\nالنتائج\n\nالتفسير والتوصيات\n\nالعميل / الحقل / رقم العينة\n\nتاريخ الجمع والاختبار / الموقع / المحصول\n\nالنتيجة\n\nالقيمة الفعلية، أو سيبها فاضية\n\nالطريقة / الوحدة / أصل الرقم / السجل / سبب نقص البيانات\n\npH بتاعك، مالوش وحدة\n\nنسب الرمل والسلت والطين وتصنيف القوام بتوعك\n\nمادة عضوية معطاة 2.1%\n\nP معطى 12 ppm\n\nK معطى 185 ppm\n\nN: مش معطى\n\nفسّر كل نتيجة بمرجعها، أو اكتب إنها مش محسومة واشرح ليه\n\nالخطوة المشروطة الأولى ودليلها\n\nالخطوة المشروطة التانية ودليلها\n\nأولوية واحدة وسببها وإيه اللي ممكن يغيّرها\n\nملاحظات ومعلومات ناقصة وتعقيب المدرّب، يفضل فاضي لحد ما يوصلك\n\nسيب القيمة اللي مش عارفها فاضية واكتب السبب. الحفظ ما بيتحققش من القياس أو التفسير أو ترتيب التنفيذ، ومش اجتياز عملي. الأرقام المعطاة هنا للتدريب، مش دليل إن المدرّب سلّم ورقة نتائج فعلية.', 'ألواح الورق بتدرّبك على تنظيم التقرير. مش قياسات تربة ولا تقرير معتمد. اختار قسم واتدرّب على الترتيب كامل. في كل مثال، اكتب محاولتك قبل ما تفتح المقارنة؛ الزر بيتأكد بس إن فيه كلام مكتوب.\n\nالعنوان وبيانات العميل\n\nالمقدمة والهدف\n\nالطريقة والملاحظات\n\nالنتائج\n\nالتفسير والتوصيات\n\nالعميل، الحقل، رقم العينة\n\nتاريخ الجمع والاختبار، الموقع، المحصول\n\nالنتيجة\n\nالقيمة الفعلية، أو سيبها فاضية\n\nالطريقة، الوحدة، أصل الرقم، السجل، سبب نقص البيانات\n\nبي إتش بتاعك، مالوش وحدة\n\nنسب الرمل والسلت والطين وتصنيف القوام بتوعك\n\nمادة عضوية معطاة اتنين فاصلة واحد في المية \n\nالفوسفور معطى اتناشر جزء في المليون\n\nالبوتاسيوم معطى مية خمسة وتمانين جزء في المليون\n\nالنيتروجين: مش معطى\n\nفسّر كل نتيجة بمرجعها، أو اكتب إنها مش محسومة واشرح ليه\n\nالخطوة المشروطة الأولى ودليلها\n\nالخطوة المشروطة التانية ودليلها\n\nأولوية واحدة وسببها وإيه اللي ممكن يغيّرها\n\nملاحظات ومعلومات ناقصة وتعقيب المدرّب، يفضل فاضي لحد ما يوصلك\n\nسيب القيمة اللي مش عارفها فاضية واكتب السبب. الحفظ ما بيتحققش من القياس أو التفسير أو ترتيب التنفيذ، ومش اجتياز عملي. الأرقام المعطاة هنا للتدريب، مش دليل إن المدرّب سلّم ورقة نتائج فعلية.'), ('الأقسام الخمسة موجودة وهوية العميل والحقل والعينة والتاريخ والطريقة الحقيقية أو غيابها واضح. الجدول يذكر العنصر والنتيجة والوحدة والطريقة والمرجع والتفسير، ويشرح أدوار N وP وK والمادة العضوية، وإن CEC قدرة على حفظ كاتيونات قابلة للتبادل، من غير الادعاء إنه بيحفظ النترات.\n\nيجتاز لما التقرير يكون قابل للتتبع وسليم علميًا ومفهوم؛ غياب مصدر البيانات أو وجود وحدة مضللة ترجع لمراجعة موجّهة.\n\nجدول Field B فيه 6.2 و6.4 و6.1 و6.3 و6.2 ومجموع 31.2 وقسمة على 5 فتطلع 6.24؛ اسمه متوسط خمس قراءات، والتاريخ معلوم فعلًا أو مذكور إنه ناقص.\n\nما يجتازش غير بعد صحة القراءات الخمس والحساب وهوية الحقل والتمييز بين متوسط القراءات وقياس العينة المجمّعة.\n\nفي الحالة المحددة، يربط الحموضة والمغذيات بخطة معملية مناسبة لطريقة التحليل والمحصول، ويربط سوء الصرف والانضغاط بفحص الحقل. يشرح ليه اصفرار الورق وحده مش تشخيص، وما يحددش جرعات ثابتة للجير أو السماد أو مقدار حرث ثابت.\n\nيجتاز لما الأولوية وكل إجراء مبنيين على الدليل وحدوده؛ السبب أو الجرعة غير المدعومين يستلزموا إعادة موجّهة.\n\nيحدد في تقرير زميله نقص في طريقة أو تاريخ أو وحدة أو مصدر، ومشكلة تفسير أو توصية، ويكتب تصحيح محدد؛ يفصل درجة ثقته عن دليل الأداء.\n\nيجتاز لما التصحيح محدد وسليم؛ رقم الثقة وحده مش اجتياز.', 'الأقسام الخمسة موجودة وهوية العميل والحقل والعينة والتاريخ والطريقة الحقيقية أو غيابها واضح. الجدول يذكر العنصر والنتيجة والوحدة والطريقة والمرجع والتفسير، ويشرح أدوار النيتروجين والفوسفور والبوتاسيوم والمادة العضوية، وإن سي إي سي قدرة على حفظ كاتيونات قابلة للتبادل، من غير الادعاء إنه بيحفظ النترات.\n\nيجتاز لما التقرير يكون قابل للتتبع وسليم علميًا ومفهوم؛ غياب مصدر البيانات أو وجود وحدة مضللة ترجع لمراجعة موجّهة.\n\nجدول الحقل بي فيه ستة فاصلة اتنين وستة فاصلة أربعة وستة فاصلة واحد وستة فاصلة تلاتة وستة فاصلة اتنين ومجموع واحد وتلاتين فاصلة اتنين وقسمة على خمسة فتطلع ستة فاصلة اتنين أربعة؛ اسمه متوسط خمس قراءات، والتاريخ معلوم فعلًا أو مذكور إنه ناقص.\n\nما يجتازش غير بعد صحة القراءات الخمس والحساب وهوية الحقل والتمييز بين متوسط القراءات وقياس العينة المجمّعة.\n\nفي الحالة المحددة، يربط الحموضة والمغذيات بخطة معملية مناسبة لطريقة التحليل والمحصول، ويربط سوء الصرف والانضغاط بفحص الحقل. يشرح ليه اصفرار الورق وحده مش تشخيص، وما يحددش جرعات ثابتة للجير أو السماد أو مقدار حرث ثابت.\n\nيجتاز لما الأولوية وكل إجراء مبنيين على الدليل وحدوده؛ السبب أو الجرعة غير المدعومين يستلزموا إعادة موجّهة.\n\nيحدد في تقرير زميله نقص في طريقة أو تاريخ أو وحدة أو مصدر، ومشكلة تفسير أو توصية، ويكتب تصحيح محدد؛ يفصل درجة ثقته عن دليل الأداء.\n\nيجتاز لما التصحيح محدد وسليم؛ رقم الثقة وحده مش اجتياز.'), ('رتّب الأقسام الخمسة وحوّل رقمًا مبهمًا إلى صف واضح فيه الوحدة والمصدر.\n\nاشرح pH وNPK والمادة العضوية وCEC لزميلك في دقيقتين ثم صحح عبارة خاطئة.\n\nاكتب تقرير West Field بأولويات مشروطة، وراجع تقرير زميلك.\n\nاحسب متوسط Field B وهو 6.24 مع إبقاء القراءات الخمس والتاريخ غير المعروف.\n\nقارن منتج Paddock 3 بالخانات الخمس؛ لا توقّع بدل المدرّب.\n\nراجع تقرير West Field أو Paddock 3 لزميلك: علّم حقيقة أو طريقة ناقصة، وخطأ استدلال، واكتب تعديلًا محددًا. بعدين قيّم ثقتك من ١ إلى ٥ للتخطيط للتدريب فقط.\n\nالمدرّب الحقيقي فقط يسجل نعم/لا والدليل والإجراء التصحيحي ويوقّع بطاقة منتج Paddock 3.\n\nدي بيانات تدريب، مش قياساتك. التاريخ والمعمل والملاحظات اللي مش معطاة تفضل غير معروفة. نطاقات الأمثلة مش حدود معمل محلي.\n\nاكتب محاولتك لتقرير الحالة دي بأقسامه الخمسة وملاحظة نقدية، ووضّح أي معلومات مش معروفة. اكتمال التقرير ومعنى الكلام مش بيتراجعوا تلقائيًا.\n\nالمقارنة ما بتحكمش على معنى إجابتك ولا بتثبت مهارة عملية.', 'رتّب الأقسام الخمسة وحوّل رقم مبهم إلى صف واضح فيه الوحدة والمصدر.\n\nاشرح بي إتش والنيتروجين والفوسفور والبوتاسيوم والمادة العضوية وسي إي سي لزميلك في دقيقتين ثم صحح عبارة خاطئة.\n\nاكتب تقرير حقل ويست فيلد بأولويات مشروطة، وراجع تقرير زميلك.\n\nاحسب متوسط الحقل بي وهو ستة فاصلة اتنين أربعة مع إبقاء القراءات الخمس والتاريخ غير المعروف.\n\nقارن منتج بادوك تلاتة بالخانات الخمس؛ لا توقّع بدل المدرّب.\n\nراجع تقرير حقل ويست فيلد أو بادوك تلاتة لزميلك: علّم حقيقة أو طريقة ناقصة، وخطأ استدلال، واكتب تعديلًا محددًا. بعدين قيّم ثقتك من واحد لخمسة للتخطيط للتدريب فقط.\n\nالمدرّب الحقيقي فقط يسجل نعم، لا والدليل والإجراء التصحيحي ويوقّع بطاقة منتج بادوك تلاتة.\n\nدي بيانات تدريب، مش قياساتك. التاريخ والمعمل والملاحظات اللي مش معطاة تفضل غير معروفة. نطاقات الأمثلة مش حدود معمل محلي.\n\nاكتب محاولتك لتقرير الحالة دي بأقسامه الخمسة وملاحظة نقدية، ووضّح أي معلومات مش معروفة. اكتمال التقرير ومعنى الكلام مش بيتراجعوا تلقائيًا.\n\nالمقارنة ما بتحكمش على معنى إجابتك ولا بتثبت مهارة عملية.')], 'en': [('All five sections present; client/field/sample/date and real method or unknown marked; table identifies property, result, unit, method/reference and interpretation; farmer explanation distinguishes N/P/K roles, OM and exchangeable-cation CEC without saying CEC retains nitrate.\n\nPass if report is traceable, scientifically accurate and intelligible; missing provenance or a misleading unit requires guided revision.\n\nField B table gives 6.2, 6.4, 6.1, 6.3, 6.2 and 31.2/5 = 6.24, labelled mean of five pH readings; test date is recorded if known, otherwise expressly missing.\n\nPass only when all five figures, arithmetic, sample identity and mean-vs-pooled distinction are correct.\n\nFor the stated case, links acidity/nutrients to a method- and crop-specific lab plan and links poor drainage/compaction to field investigation; states why leaf yellowing alone is not a diagnosis and avoids fixed lime/fertilizer/tillage rates.\n\nPass when priority and each proposed action follow the evidence and its limits; unsupported causes and doses trigger targeted retry.\n\nAnnotates a draft report with at least one missing method/date/unit or source, one interpretation/recommendation issue, and a clear corrected sentence or table cell; separates self-rated confidence from assessed work.\n\nPass when corrections are specific and scientifically sound; a numeric confidence score alone never passes.', 'All five sections present; client, field, sample, date and real method or unknown marked; table identifies property, result, unit, method, reference and interpretation; farmer explanation distinguishes nitrogen, phosphorus, potassium roles, organic matter and exchangeable-cation C E C without saying C E C retains nitrate.\n\nPass if report is traceable, scientifically accurate and intelligible; missing provenance or a misleading unit requires guided revision.\n\nField B table gives six point two, six point four, six point one, six point three, six point two and thirty-one point two divided by five equals six point two four, labelled mean of five P H readings; test date is recorded if known, otherwise expressly missing.\n\nPass only when all five figures, arithmetic, sample identity and mean-vs-pooled distinction are correct.\n\nFor the stated case, links acidity, nutrients to a method- and crop-specific lab plan and links poor drainage, compaction to field investigation; states why leaf yellowing alone is not a diagnosis and avoids fixed lime, fertilizer, tillage rates.\n\nPass when priority and each proposed action follow the evidence and its limits; unsupported causes and doses trigger targeted retry.\n\nAnnotates a draft report with at least one missing method, date, unit or source, one interpretation, recommendation issue, and a clear corrected sentence or table cell; separates self-rated confidence from assessed work.\n\nPass when corrections are specific and scientifically sound; a numeric confidence score alone never passes.'), ("Order the five report sections and turn an unexplained result into a farmer-readable table row with source and units.\n\nExplain pH, NPK, OM and CEC to a partner in two minutes, then revise an inaccurate statement.\n\nBuild the West Field case report with prioritized conditional actions and peer review.\n\nCalculate Field B's mean 6.24 while preserving all five readings and unknown date.\n\nInspect the Paddock 3 one-page product against all five trainer checklist rows; do not self-sign the trainer record.\n\nReview a partner's West Field or Paddock 3 draft against the source case and five sections. Mark a missing fact or method, a reasoning error, and a concrete correction. Then re-rate confidence 1–5 for planning only.\n\nOnly a real trainer can record the Paddock 3 product-card yes/no, observation, corrective action and sign-off.\n\nThese are teaching fixtures, not your measurements. Keep dates, laboratory and field observations unknown where absent. Example reference ranges below are not local laboratory thresholds.\n\nWrite your own five-section report attempt and one critique for this case, marking unknown facts explicitly. Completeness and meaning are not checked automatically.\n\nThe comparison checks no free-text meaning and certifies no practical skill.", "Order the five report sections and turn an unexplained result into a farmer-readable table row with source and units.\n\nExplain P H, nitrogen phosphorus potassium, organic matter and C E C to a partner in two minutes, then revise an inaccurate statement.\n\nBuild the West Field case report with prioritized conditional actions and peer review.\n\nCalculate Field B's mean six point two four while preserving all five readings and unknown date.\n\nInspect the Paddock three one-page product against all five trainer checklist rows; do not self-sign the trainer record.\n\nReview a partner's West Field or Paddock three draft against the source case and five sections. Mark a missing fact or method, a reasoning error, and a concrete correction. Then re-rate confidence one to five for planning only.\n\nOnly a real trainer can record the Paddock three product-card yes, no, observation, corrective action and sign-off.\n\nThese are teaching fixtures, not your measurements. Keep dates, laboratory and field observations unknown where absent. Example reference ranges below are not local laboratory thresholds.\n\nWrite your own five-section report attempt and one critique for this case, marking unknown facts explicitly. Completeness and meaning are not checked automatically.\n\nThe comparison checks no free-text meaning and certifies no practical skill."), ('Paddock 3: five-row trainer product card\n\nReport identifies Paddock 3\n\nAll five results pH/OM/N/P/K listed\n\nPlain language explains the findings\n\nAt least one specific deficiency-related action with evidence; the source’s bone-meal example requires crop/lab/site qualification\n\nReport is organized, legible and professional\n\nTrainer record remains unobserved and unsigned. The five original product criteria are preserved; no learner click records a trainer decision.\n\nThis step assesses a report and peer review; no new field skill is certified. The Paddock 3 product card retains its five original trainer checklist rows and requires an actual reviewer to mark evidence and any corrective action.\n\nThe overview is 60 active minutes: 5 introduction + 10 concepts + 35 writing + 10 discussion. The facilitation notes also name a 5-minute setup; arrange it within preparation rather than silently adding a different total. Groups of 3–4; 15- and 5-minute warnings; a 2-minute partner explanation fits within practice. Compare models only after attempts and critique. Prepared tables/sentence starters are support, not evidence of independent table construction.', 'Paddock three: five-row trainer product card\n\nReport identifies Paddock three\n\nAll five results P H, organic matter, nitrogen, phosphorus, potassium listed\n\nPlain language explains the findings\n\nAt least one specific deficiency-related action with evidence; the source’s bone-meal example requires crop, lab, site qualification\n\nReport is organized, legible and professional\n\nTrainer record remains unobserved and unsigned. The five original product criteria are preserved; no learner click records a trainer decision.\n\nThis step assesses a report and peer review; no new field skill is certified. The Paddock three product card retains its five original trainer checklist rows and requires an actual reviewer to mark evidence and any corrective action.\n\nThe overview is sixty active minutes: five introduction plus ten concepts plus thirty-five writing plus ten discussion. The facilitation notes also name a five-minute setup; arrange it within preparation rather than silently adding a different total. Groups of three to four; fifteen- and five-minute warnings; a two-minute partner explanation fits within practice. Compare models only after attempts and critique. Prepared tables, sentence starters are support, not evidence of independent table construction.'), ('Paper panels rehearse report organization. They represent no soil measurement or approved report. Select a section and practise the complete order. For each worked case, write your own attempt before opening the comparison; the button checks only that text has been entered.\n\nTitle and client information\n\nIntroduction / objective\n\nMethods and observations\n\nResults\n\nInterpretation and recommendations\n\nClient / field / sample ID\n\nCollection and test dates / location / crop\n\nParameter\n\nActual value (or blank)\n\nMethod / units / origin / record / missing-data reason\n\nOwn pH (unitless)\n\nOwn sand/silt/clay percentages and texture class\n\nSupplied OM 2.1%\n\nSupplied P 12 ppm\n\nSupplied K 185 ppm\n\nN: not supplied\n\nInterpret each result with its reference, or mark unresolved and explain\n\nFirst conditional action and its evidence\n\nSecond conditional action and its evidence\n\nOne priority, reason and what could change it\n\nComments, missing information and trainer feedback (blank until received)\n\nKeep unknown values blank and explain why. Saving does not validate results, interpretation, chronology or a practical pass. Supplied figures below are curriculum fixtures, not proof a real trainer released the handout.', 'Paper panels rehearse report organization. They represent no soil measurement or approved report. Select a section and practise the complete order. For each worked case, write your own attempt before opening the comparison; the button checks only that text has been entered.\n\nTitle and client information\n\nIntroduction, objective\n\nMethods and observations\n\nResults\n\nInterpretation and recommendations\n\nClient, field, sample ID\n\nCollection and test dates, location, crop\n\nParameter\n\nActual value (or blank)\n\nMethod, units, origin, record, missing-data reason\n\nOwn P H (unitless)\n\nOwn sand, silt, clay percentages and texture class\n\nSupplied organic matter two point one percent \n\nSupplied phosphorus twelve parts per million\n\nSupplied potassium one hundred eighty-five parts per million\n\nnitrogen: not supplied\n\nInterpret each result with its reference, or mark unresolved and explain\n\nFirst conditional action and its evidence\n\nSecond conditional action and its evidence\n\nOne priority, reason and what could change it\n\nComments, missing information and trainer feedback (blank until received)\n\nKeep unknown values blank and explain why. Saving does not validate results, interpretation, chronology or a practical pass. Supplied figures below are curriculum fixtures, not proof a real trainer released the handout.')], 'it': [('Cinque sezioni presenti; cliente, campo, campione, data e metodo reale o assente indicati. La tabella nomina parametro, risultato, unità, metodo/riferimento e interpretazione. La spiegazione di NPK, sostanza organica e CEC non attribuisce a CEC la ritenzione del nitrato.\n\nSuperato se il rapporto è tracciabile, corretto e comprensibile; provenienza o unità fuorvianti richiedono revisione mirata.\n\nField B riporta 6.2, 6.4, 6.1, 6.3, 6.2 e 31.2/5 = 6.24, come media di cinque letture; data reale oppure mancante.\n\nSuperato solo con cinque valori, calcolo, identità del campo e distinzione tra media delle letture e misura di una miscela.\n\nNel caso dato collega acidità e nutrienti a un piano calibrato per coltura/metodo e drenaggio/compattazione a un sopralluogo; le foglie gialle da sole non provano carenza di N e non indicano dosi.\n\nSuperato se priorità e azioni seguono prove e limiti; causa o dose non documentata comporta nuovo tentativo guidato.\n\nSegnala almeno una mancanza di metodo/data/unità/fonte, un problema di interpretazione o raccomandazione e una correzione precisa; separa fiducia percepita e prestazione.\n\nSuperato se le correzioni sono specifiche e fondate; un punteggio di fiducia da solo non basta.', 'Cinque sezioni presenti; cliente, campo, campione, data e metodo reale o assente indicati. La tabella nomina parametro, risultato, unità, metodo, riferimento e interpretazione. La spiegazione di enne pi cappa, sostanza organica e ci e ci non attribuisce a ci e ci la ritenzione del nitrato.\n\nSuperato se il rapporto è tracciabile, corretto e comprensibile; provenienza o unità fuorvianti richiedono revisione mirata.\n\nField B riporta sei virgola due, sei virgola quattro, sei virgola uno, sei virgola tre, sei virgola due e trentuno virgola due diviso per cinque uguale a sei virgola due quattro, come media di cinque letture; data reale oppure mancante.\n\nSuperato solo con cinque valori, calcolo, identità del campo e distinzione tra media delle letture e misura di una miscela.\n\nNel caso dato collega acidità e nutrienti a un piano calibrato per coltura, metodo e drenaggio, compattazione a un sopralluogo; le foglie gialle da sole non provano carenza di azoto e non indicano dosi.\n\nSuperato se priorità e azioni seguono prove e limiti; causa o dose non documentata comporta nuovo tentativo guidato.\n\nSegnala almeno una mancanza di metodo, data, unità, fonte, un problema di interpretazione o raccomandazione e una correzione precisa; separa fiducia percepita e prestazione.\n\nSuperato se le correzioni sono specifiche e fondate; un punteggio di fiducia da solo non basta.'), ('I pannelli di carta esercitano l’organizzazione del rapporto; non rappresentano misure del suolo né un rapporto approvato. Seleziona una sezione ed esercitati con l’ordine completo. Per ogni caso, scrivi un tuo tentativo prima di aprire il confronto; il pulsante controlla soltanto che sia stato inserito del testo.\n\nTitolo e dati del cliente\n\nIntroduzione / obiettivo\n\nMetodi e osservazioni\n\nRisultati\n\nInterpretazione e raccomandazioni\n\nCliente / campo / ID campione\n\nDate di raccolta e prova / sito / coltura\n\nParametro\n\nValore reale, o vuoto\n\nMetodo / unità / origine / registro / motivo del dato mancante\n\nTuo pH (senza unità)\n\nTue percentuali sabbia/limo/argilla e classe\n\nOM fornita 2.1%\n\nP fornito 12 ppm\n\nK fornito 185 ppm\n\nN: non fornito\n\nInterpreta ogni risultato con riferimento, oppure irrisolto con motivo\n\nPrima azione condizionata e prova\n\nSeconda azione condizionata e prova\n\nUna priorità, motivo e cosa potrebbe cambiarla\n\nCommenti, informazioni mancanti e riscontro del formatore (lascia vuoto finché non è stato ricevuto)\n\nLascia ignoti vuoti e motiva. Salvare non verifica risultati, significato, cronologia o pratica. Le cifre fornite sono dati didattici, non prova di consegna reale da parte del formatore.', 'I pannelli di carta esercitano l’organizzazione del rapporto; non rappresentano misure del suolo né un rapporto approvato. Seleziona una sezione ed esercitati con l’ordine completo. Per ogni caso, scrivi un tuo tentativo prima di aprire il confronto; il pulsante controlla soltanto che sia stato inserito del testo.\n\nTitolo e dati del cliente\n\nIntroduzione, obiettivo\n\nMetodi e osservazioni\n\nRisultati\n\nInterpretazione e raccomandazioni\n\nCliente, campo, ID campione\n\nDate di raccolta e prova, sito, coltura\n\nParametro\n\nValore reale, o vuoto\n\nMetodo, unità, origine, registro, motivo del dato mancante\n\nTuo pi acca (senza unità)\n\nTue percentuali sabbia, limo, argilla e classe\n\nsostanza organica fornita due virgola uno per cento \n\nfosforo fornito dodici parti per milione\n\npotassio fornito centottantacinque parti per milione\n\nazoto: non fornito\n\nInterpreta ogni risultato con riferimento, oppure irrisolto con motivo\n\nPrima azione condizionata e prova\n\nSeconda azione condizionata e prova\n\nUna priorità, motivo e cosa potrebbe cambiarla\n\nCommenti, informazioni mancanti e riscontro del formatore (lascia vuoto finché non è stato ricevuto)\n\nLascia ignoti vuoti e motiva. Salvare non verifica risultati, significato, cronologia o pratica. Le cifre fornite sono dati didattici, non prova di consegna reale da parte del formatore.'), ('Ordina cinque sezioni e trasforma un numero opaco in riga con unità e fonte.\n\nSpiega pH, NPK, sostanza organica e CEC a un collega in due minuti, poi correggi una frase sbagliata.\n\nRedigi West Field con priorità condizionate e revisione tra pari.\n\nCalcola la media Field B 6.24 mantenendo cinque letture e data sconosciuta.\n\nConfronta il prodotto Paddock 3 con cinque criteri; non firmare al posto del formatore.\n\nRivedi West Field o Paddock 3 di un collega: trova un fatto/metodo mancante, un errore di ragionamento e una correzione precisa. Poi valuta la fiducia 1–5 solo per pianificare esercizio.\n\nSolo il formatore reale può segnare sì/no, prova, correzione e firma nelle cinque righe Paddock 3.\n\nDati didattici, non tue misure. Date, laboratorio e osservazioni assenti restano ignoti. Intervalli illustrativi, non soglie del laboratorio locale.\n\nScrivi il tuo tentativo di rapporto nelle cinque sezioni e una critica per questo caso, indicando esplicitamente i dati ignoti. Completezza e significato non vengono verificati automaticamente.\n\nIl confronto non valuta il significato del testo e non certifica abilità pratiche.', 'Ordina cinque sezioni e trasforma un numero opaco in riga con unità e fonte.\n\nSpiega pi acca, enne pi cappa, sostanza organica e ci e ci a un collega in due minuti, poi correggi una frase sbagliata.\n\nRedigi West Field con priorità condizionate e revisione tra pari.\n\nCalcola la media Field B sei virgola due quattro mantenendo cinque letture e data sconosciuta.\n\nConfronta il prodotto Paddock tre con cinque criteri; non firmare al posto del formatore.\n\nRivedi West Field o Paddock tre di un collega: trova un fatto, metodo mancante, un errore di ragionamento e una correzione precisa. Poi valuta la fiducia uno a cinque solo per pianificare esercizio.\n\nSolo il formatore reale può segnare sì, no, prova, correzione e firma nelle cinque righe Paddock tre.\n\nDati didattici, non tue misure. Date, laboratorio e osservazioni assenti restano ignoti. Intervalli illustrativi, non soglie del laboratorio locale.\n\nScrivi il tuo tentativo di rapporto nelle cinque sezioni e una critica per questo caso, indicando esplicitamente i dati ignoti. Completezza e significato non vengono verificati automaticamente.\n\nIl confronto non valuta il significato del testo e non certifica abilità pratiche.'), ('Paddock 3: cinque criteri del prodotto per il formatore\n\nIl rapporto identifica Paddock 3\n\nTutti i cinque risultati pH/OM/N/P/K presenti\n\nLinguaggio semplice per spiegare i risultati\n\nAlmeno un’azione specifica legata a carenza con prove; farina d’ossa solo con verifica coltura/laboratorio/sito\n\nRapporto ordinato, leggibile e professionale\n\nRegistro non osservato e non firmato. Cinque criteri originali conservati; nessun clic dello studente registra decisioni del formatore.\n\nQuesto passo valuta rapporto e revisione tra pari; non certifica una nuova abilità di campo. La scheda Paddock 3 mantiene le cinque righe originali e richiede un valutatore reale.\n\nPiano di 60 minuti: 5 introduzione + 10 concetti + 35 scrittura + 10 discussione. Le note indicano anche 5 minuti di preparazione: organizzarli senza aggiungere tacitamente tempo al totale. Gruppi di 3–4, avvisi a 15 e 5 minuti; spiegazione a coppie di 2 minuti nella pratica. Modelli dopo tentativo e critica. Tabelle pronte e avvii di frase non provano costruzione indipendente.', 'Paddock tre: cinque criteri del prodotto per il formatore\n\nIl rapporto identifica Paddock tre\n\nTutti i cinque risultati pi acca, sostanza organica, azoto, fosforo, potassio presenti\n\nLinguaggio semplice per spiegare i risultati\n\nAlmeno un’azione specifica legata a carenza con prove; farina d’ossa solo con verifica coltura, laboratorio, sito\n\nRapporto ordinato, leggibile e professionale\n\nRegistro non osservato e non firmato. Cinque criteri originali conservati; nessun clic dello studente registra decisioni del formatore.\n\nQuesto passo valuta rapporto e revisione tra pari; non certifica una nuova abilità di campo. La scheda Paddock tre mantiene le cinque righe originali e richiede un valutatore reale.\n\nPiano di sessanta minuti: cinque introduzione più dieci concetti più trentacinque scrittura più dieci discussione. Le note indicano anche cinque minuti di preparazione: organizzarli senza aggiungere tacitamente tempo al totale. Gruppi di tre a quattro, avvisi a quindici e cinque minuti; spiegazione a coppie di due minuti nella pratica. Modelli dopo tentativo e critica. Tabelle pronte e avvii di frase non provano costruzione indipendente.')], 'de': [('Die Papierfelder dienen dazu, die Berichtsgliederung zu üben; sie zeigen weder Bodenmessungen noch einen freigegebenen Bericht. Wähle einen Abschnitt und übe die vollständige Reihenfolge. Schreibe für jeden Fall einen eigenen Versuch, bevor du den Vergleich öffnest; die Schaltfläche prüft nur, ob Text eingegeben wurde.\n\nTitel und Auftraggeber\n\nEinleitung / Ziel\n\nVerfahren und Beobachtungen\n\nErgebnisse\n\nDeutung und Empfehlungen\n\nAuftraggeber / Feld / Proben-ID\n\nEntnahme-/Testdaten / Standort / Kultur\n\nParameter\n\nTatsächlicher Wert oder leer\n\nVerfahren / Einheit / Herkunft / Protokoll / Grund fehlender Daten\n\nEigener pH (einheitenlos)\n\nEigene Sand-/Schluff-/Tonanteile und Klasse\n\nBereitgestellte OM 2.1%\n\nBereitgestelltes P 12 ppm\n\nBereitgestelltes K 185 ppm\n\nN: nicht bereitgestellt\n\nJeden Befund mit Referenz deuten oder als offen begründen\n\nErster bedingter Schritt und Beleg\n\nZweiter bedingter Schritt und Beleg\n\nEine Priorität, Grund und mögliche Änderung\n\nAnmerkungen, offene Daten und Rückmeldung (bis Erhalt leer)\n\nUnbekanntes leer lassen und begründen. Speichern bestätigt weder Befund, Deutung, Reihenfolge noch Praxis. Vorgegebene Zahlen sind Lehrdaten, kein Nachweis einer echten Ergebnisübergabe.', 'Die Papierfelder dienen dazu, die Berichtsgliederung zu üben; sie zeigen weder Bodenmessungen noch einen freigegebenen Bericht. Wähle einen Abschnitt und übe die vollständige Reihenfolge. Schreibe für jeden Fall einen eigenen Versuch, bevor du den Vergleich öffnest; die Schaltfläche prüft nur, ob Text eingegeben wurde.\n\nTitel und Auftraggeber\n\nEinleitung, Ziel\n\nVerfahren und Beobachtungen\n\nErgebnisse\n\nDeutung und Empfehlungen\n\nAuftraggeber, Feld, Proben-ID\n\nEntnahme-, Testdaten, Standort, Kultur\n\nParameter\n\nTatsächlicher Wert oder leer\n\nVerfahren, Einheit, Herkunft, Protokoll, Grund fehlender Daten\n\nEigener Pe Ha (einheitenlos)\n\nEigene Sand-, Schluff-, Tonanteile und Klasse\n\nBereitgestellte organische Substanz zwei Komma eins Prozent \n\nBereitgestelltes Phosphor zwölf Teile pro Million\n\nBereitgestelltes Kalium einhundertfünfundachtzig Teile pro Million\n\nStickstoff: nicht bereitgestellt\n\nJeden Befund mit Referenz deuten oder als offen begründen\n\nErster bedingter Schritt und Beleg\n\nZweiter bedingter Schritt und Beleg\n\nEine Priorität, Grund und mögliche Änderung\n\nAnmerkungen, offene Daten und Rückmeldung (bis Erhalt leer)\n\nUnbekanntes leer lassen und begründen. Speichern bestätigt weder Befund, Deutung, Reihenfolge noch Praxis. Vorgegebene Zahlen sind Lehrdaten, kein Nachweis einer echten Ergebnisübergabe.'), ('Fünf Abschnitte; Betrieb, Feld, Probe, Datum sowie echte Methode oder Lücke sind erkennbar. Tabelle nennt Parameter, Wert, Einheit, Methode/Referenz und Deutung. NPK, organische Substanz und KAK werden verständlich erklärt, ohne KAK als Nitratbindung auszugeben.\n\nBestanden bei nachvollziehbarem, korrektem und verständlichem Bericht; irreführende Herkunft oder Einheit verlangt gezielte Überarbeitung.\n\nField B zeigt 6.2, 6.4, 6.1, 6.3, 6.2 und 31.2/5 = 6.24, als Mittel fünf einzelner Werte; Datum belegt oder als fehlend markiert.\n\nNur bestanden, wenn alle fünf Werte, Rechnung, Feldkennung und Unterschied zwischen Mittel und Mischprobenmessung stimmen.\n\nFür den Fall werden Säure/Nährstoffe mit kultur- und methodenbezogener Laborplanung, Entwässerung/Verdichtung mit Standortprüfung verknüpft; gelbe Blätter allein beweisen keinen N-Mangel und keine Dosis.\n\nBestanden, wenn Priorität und Maßnahme den Belegen und Grenzen folgen; unbelegte Ursache oder Dosis führt zur gezielten Wiederholung.\n\nMindestens eine fehlende Methode/Datum/Einheit/Quelle, ein Deutungs- oder Empfehlungsfehler sowie eine konkrete Korrektur; Selbstvertrauen wird von Leistung getrennt.\n\nBestanden bei genauer fachlich richtiger Berichtigung; die Vertrauenszahl allein reicht nicht.', 'Fünf Abschnitte; Betrieb, Feld, Probe, Datum sowie echte Methode oder Lücke sind erkennbar. Tabelle nennt Parameter, Wert, Einheit, Methode, Referenz und Deutung. En Pe Ka, organische Substanz und Ka A Ka werden verständlich erklärt, ohne Ka A Ka als Nitratbindung auszugeben.\n\nBestanden bei nachvollziehbarem, korrektem und verständlichem Bericht; irreführende Herkunft oder Einheit verlangt gezielte Überarbeitung.\n\nField B zeigt sechs Komma zwei, sechs Komma vier, sechs Komma eins, sechs Komma drei, sechs Komma zwei und einunddreißig Komma zwei geteilt durch fünf gleich sechs Komma zwei vier, als Mittel fünf einzelner Werte; Datum belegt oder als fehlend markiert.\n\nNur bestanden, wenn alle fünf Werte, Rechnung, Feldkennung und Unterschied zwischen Mittel und Mischprobenmessung stimmen.\n\nFür den Fall werden Säure, Nährstoffe mit kultur- und methodenbezogener Laborplanung, Entwässerung, Verdichtung mit Standortprüfung verknüpft; gelbe Blätter allein beweisen keinen Stickstoff-Mangel und keine Dosis.\n\nBestanden, wenn Priorität und Maßnahme den Belegen und Grenzen folgen; unbelegte Ursache oder Dosis führt zur gezielten Wiederholung.\n\nMindestens eine fehlende Methode, Datum, Einheit, Quelle, ein Deutungs- oder Empfehlungsfehler sowie eine konkrete Korrektur; Selbstvertrauen wird von Leistung getrennt.\n\nBestanden bei genauer fachlich richtiger Berichtigung; die Vertrauenszahl allein reicht nicht.'), ('Fünf Berichtsteile ordnen und einen unklaren Wert zur Zeile mit Einheit und Quelle machen.\n\npH, NPK, organische Substanz und KAK zwei Minuten einem Partner erklären und einen Fehler berichtigen.\n\nWest Field mit bedingten Prioritäten erstellen und gegenseitig prüfen.\n\nField-B-Mittel 6.24 bei fünf Einzelwerten und fehlendem Datum berechnen.\n\nPaddock-3-Produkt an fünf Punkten ansehen; keine Lehrkraft-Unterschrift selbst setzen.\n\nPrüfe einen West-Field- oder Paddock-3-Bericht: markiere fehlende Tatsache/Methode, Denkfehler und genaue Berichtigung. Danach Vertrauen 1–5 nur für Übungsplanung einschätzen.\n\nNur die reale Lehrkraft trägt Ja/Nein, Beleg, Korrektur und Unterschrift auf der Paddock-3-Produktkarte ein.\n\nLehrdaten, keine eigenen Messungen. Fehlende Daten zu Datum, Labor und Beobachtungen bleiben unbekannt. Beispielbereiche sind keine örtlichen Laborgrenzen.\n\nSchreibe für diesen Fall deinen eigenen Berichtsentwurf mit fünf Abschnitten und eine kritische Anmerkung. Benenne unbekannte Angaben ausdrücklich. Vollständigkeit und Bedeutung werden nicht automatisch geprüft.\n\nDer Vergleich bewertet keine Freitextbedeutung und bestätigt keine praktische Leistung.', 'Fünf Berichtsteile ordnen und einen unklaren Wert zur Zeile mit Einheit und Quelle machen.\n\nPe Ha, En Pe Ka, organische Substanz und Ka A Ka zwei Minuten einem Partner erklären und einen Fehler berichtigen.\n\nWest Field mit bedingten Prioritäten erstellen und gegenseitig prüfen.\n\nField-B-Mittel sechs Komma zwei vier bei fünf Einzelwerten und fehlendem Datum berechnen.\n\nPaddock-drei-Produkt an fünf Punkten ansehen; keine Lehrkraft-Unterschrift selbst setzen.\n\nPrüfe einen West-Field- oder Paddock-drei-Bericht: markiere fehlende Tatsache, Methode, Denkfehler und genaue Berichtigung. Danach Vertrauen eins bis fünf nur für Übungsplanung einschätzen.\n\nNur die reale Lehrkraft trägt Ja, Nein, Beleg, Korrektur und Unterschrift auf der Paddock-drei-Produktkarte ein.\n\nLehrdaten, keine eigenen Messungen. Fehlende Daten zu Datum, Labor und Beobachtungen bleiben unbekannt. Beispielbereiche sind keine örtlichen Laborgrenzen.\n\nSchreibe für diesen Fall deinen eigenen Berichtsentwurf mit fünf Abschnitten und eine kritische Anmerkung. Benenne unbekannte Angaben ausdrücklich. Vollständigkeit und Bedeutung werden nicht automatisch geprüft.\n\nDer Vergleich bewertet keine Freitextbedeutung und bestätigt keine praktische Leistung.'), ('Paddock 3: fünf Produktkriterien für die Lehrkraft\n\nBericht nennt Paddock 3\n\nAlle fünf Ergebnisse pH/OM/N/P/K vorhanden\n\nEinfache verständliche Deutung\n\nMindestens eine konkrete mangelbezogene Maßnahme mit Beleg; Knochenmehlbeispiel nur mit Kultur-/Labor-/Standortprüfung\n\nBericht geordnet, lesbar und professionell\n\nProtokoll unbeobachtet und ohne Unterschrift. Fünf Originalkriterien erhalten; kein Schülerklick erfasst Lehrkraftentscheidungen.\n\nDieser Schritt prüft Bericht und Partnerkritik, bescheinigt keine neue Feldfertigkeit. Die Paddock-3-Karte behält die fünf ursprünglichen Prüfpunkte; ein echter Bewerter dokumentiert Belege und Korrekturen.\n\n60 aktive Minuten: 5 Einstieg + 10 Begriffe + 35 Schreiben + 10 Austausch. Die Moderation nennt zusätzlich 5 Minuten Vorbereitung; ohne stillschweigende Verlängerung organisieren. Gruppen von 3–4, Hinweise bei 15 und 5 Restminuten; 2 Minuten Partnererklärung innerhalb der Übung. Muster nach Versuch und Kritik. Vorgefüllte Tabellen/Satzanfänge bestätigen keinen selbstständigen Tabellenaufbau.', 'Paddock drei: fünf Produktkriterien für die Lehrkraft\n\nBericht nennt Paddock drei\n\nAlle fünf Ergebnisse Pe Ha, organische Substanz, Stickstoff, Phosphor, Kalium vorhanden\n\nEinfache verständliche Deutung\n\nMindestens eine konkrete mangelbezogene Maßnahme mit Beleg; Knochenmehlbeispiel nur mit Kultur-, Labor-, Standortprüfung\n\nBericht geordnet, lesbar und professionell\n\nProtokoll unbeobachtet und ohne Unterschrift. Fünf Originalkriterien erhalten; kein Schülerklick erfasst Lehrkraftentscheidungen.\n\nDieser Schritt prüft Bericht und Partnerkritik, bescheinigt keine neue Feldfertigkeit. Die Paddock-drei-Karte behält die fünf ursprünglichen Prüfpunkte; ein echter Bewerter dokumentiert Belege und Korrekturen.\n\nsechzig aktive Minuten: fünf Einstieg plus zehn Begriffe plus fünfunddreißig Schreiben plus zehn Austausch. Die Moderation nennt zusätzlich fünf Minuten Vorbereitung; ohne stillschweigende Verlängerung organisieren. Gruppen von drei bis vier, Hinweise bei fünfzehn und fünf Restminuten; zwei Minuten Partnererklärung innerhalb der Übung. Muster nach Versuch und Kritik. Vorgefüllte Tabellen, Satzanfänge bestätigen keinen selbstständigen Tabellenaufbau.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s215-guidance-audio-20261023-r1'
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
