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
IDS = ('S2-09-ar-EG-opening-r1', 'S2-09-ar-EG-E01-r1', 'S2-09-ar-EG-E02-r1', 'S2-09-ar-EG-E03-r1', 'S2-09-ar-EG-E04-r1', 'S2-09-ar-EG-guided-practice-r1', 'S2-09-ar-EG-reflection-r1', 'S2-09-ar-EG-comparison-r1', 'S2-09-ar-EG-glossary-r1', 'S2-09-en-opening-r1', 'S2-09-en-E01-r1', 'S2-09-en-E02-r1', 'S2-09-en-E03-r1', 'S2-09-en-E04-r1', 'S2-09-en-guided-practice-r1', 'S2-09-en-reflection-r1', 'S2-09-en-comparison-r1', 'S2-09-en-glossary-r1', 'S2-09-it-opening-r1', 'S2-09-it-E01-r1', 'S2-09-it-E02-r1', 'S2-09-it-E03-r1', 'S2-09-it-E04-r1', 'S2-09-it-guided-practice-r1', 'S2-09-it-reflection-r1', 'S2-09-it-comparison-r1', 'S2-09-it-glossary-r1', 'S2-09-de-opening-r1', 'S2-09-de-E01-r1', 'S2-09-de-E02-r1', 'S2-09-de-E03-r1', 'S2-09-de-E04-r1', 'S2-09-de-guided-practice-r1', 'S2-09-de-reflection-r1', 'S2-09-de-comparison-r1', 'S2-09-de-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==36
    assert(req['scope'],req['stepId'])==('S209_REMAINDER_36_SOURCEBOUND_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(36,36,36,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s209-remainder-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==36
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(9))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening', 'E01', 'E02', 'E03', 'E04', 'guided-practice', 'reflection', 'comparison', 'glossary']
        voice='Charon'if group in['E01', 'E03', 'reflection', 'glossary']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/columns/4', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/0/4', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/1/4', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/2/4', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/3/4', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3', '/comparison/rows/4/4'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or '/cases/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('أقدر أجهز وأحدد عينة حسب تعليمات الاختبار الشائع المحدد، وبعدها أشرح عرض المدرّب لاستخلاص NPK ووحداته وطريقته وتفسيره والدليل الناقص قبل ما أقول كمية سماد؟\n\nمراجعة ذاتية فقط', 'أقدر أجهز وأحدد عينة حسب تعليمات الاختبار الشائع المحدد، وبعدها أشرح عرض المدرّب لاستخلاص إن بي كيه ووحداته وطريقته وتفسيره والدليل الناقص قبل ما أقول كمية سماد؟\n\nمراجعة ذاتية فقط'), ('أو أساسًا معلنًا غيرهما', 'أو أساس تاني معلن غيرهم'), ('أو محصولًا', 'أو محصول'), ('الفوسفور التربة', 'فوسفور التربة'), ('المدرّب يعرض طقم P سريعًا: تربة مقاسة مع محلول استخلاص، ثم ترشيح وتفاعل وقراءة على جدوله. طالب قال اللون بيقيس كل P في الحقل.\n\nرتب المراحل الأربع بالترتيب اللي شفته، واذكر كميات الطريقة وكاشفها من دليل الطقم بدل اختراعهم.\n\nاللون أو الجهاز يمثّل الجزء والاستجابة اللذين تحددهما الطريقة، مش إجمالي P في التربة.\n\nقرار المحصول يحتاج كمان تفسير الطقم أو المعمل المعاير وسياق الحقل.\n\nمؤشر الاختبار يكتسب معناه من طريقته ومعايرة تفسيره.', 'المدرّب يعرض طقم سريع للفوسفور: تربة مقاسة مع محلول استخلاص، ثم ترشيح وتفاعل وقراءة على جدوله. طالب قال اللون بيقيس كل الفوسفور في الحقل.\n\nرتب المراحل الأربع بالترتيب اللي شفته، واذكر كميات الطريقة وكاشفها من دليل الطقم بدل اختراعهم.\n\nاللون أو الجهاز يمثّل الجزء والاستجابة اللذين تحددهما الطريقة، مش إجمالي الفوسفور في التربة.\n\nقرار المحصول يحتاج كمان تفسير الطقم أو المعمل المعاير وسياق الحقل.\n\nمؤشر الاختبار يكتسب معناه من طريقته ومعايرة تفسيره.'), ('تسجيلًا معمليًا', 'تسجيل معملي'), ('تقرير تدريبي فيه pH 5.5 وP 12 ppm. شخص نسخ جدول المثال وكتب «حط X جير وY سماد» من غير ما يعرف الكميتين.\n\nداخل الجدول ده الأرقام في صفوف المنخفض. قول «داخل الجدول ده» لأنه ما فيهوش طريقة أو معايرة إقليمية.\n\nاطلب هدف المحصول واحتياج الجير، وطريقة استخلاص P والتوصية المحلية المناسبة.\n\nسيب X وY فارغين لحد ما تعرف المدخلات دي وتحليل المنتج وظروف الإضافة.\n\nفئة الفصل مش كمية تطبيق للحقل.', 'تقرير تدريبي فيه بي إتش خمسة فاصلة خمسة والفوسفور اتناشر جزء في المليون. شخص نسخ جدول المثال وكتب «حط إكس جير وواي سماد» من غير ما يعرف الكميتين.\n\nداخل الجدول ده الأرقام في صفوف المنخفض. قول «داخل الجدول ده» لأنه ما فيهوش طريقة أو معايرة إقليمية.\n\nاطلب هدف المحصول واحتياج الجير، وطريقة استخلاص الفوسفور والتوصية المحلية المناسبة.\n\nسيب إكس وواي فارغين لحد ما تعرف المدخلات دي وتحليل المنتج وظروف الإضافة.\n\nفئة الفصل مش كمية تطبيق للحقل.'), ('تقرير مكتوب فيه بس «P 18 ppm»، وطالب صنّفه منخفضًا من جدول الفصل.\n\n18 واقع في فراغ 15–20 ppm في الجدول، وبالتالي المثال نفسه ما أعطاهوش فئة.\n\nطريقة الاستخلاص وأساس العينة والمحصول والدليل الإقليمي ناقصين؛ ما تستعيرش جدولًا مختلفًا عشوائيًا.\n\nاطلب تفسير المعمل، وما تختارش سماد P أو كميته من الرقم وحده.\n\nقول «غير مصنف بالدليل المتاح» أفضل من تخمين واثق.', 'تقرير مكتوب فيه بس «الفوسفور تمنتاشر جزء في المليون»، وطالب صنّفه منخفض من جدول الفصل.\n\nتمنتاشر واقع في فراغ خمستاشر إلى عشرين جزء في المليون في الجدول، وبالتالي المثال نفسه ما أعطاهوش فئة.\n\nطريقة الاستخلاص وأساس العينة والمحصول والدليل الإقليمي ناقصين؛ ما تستعيرش جدول مختلف بشكل عشوائي.\n\nاطلب تفسير المعمل، وما تختارش سماد الفوسفور أو كميته من الرقم وحده.\n\nقول «غير مصنف بالدليل المتاح» أفضل من تخمين واثق.'), ('رتب أولًا الاستخلاص والترشيح وتفاعل الكاشف والقراءة. بعدين صنّف أربع بطاقات: وحدة تحليل تربة أو ملصق منتج أو فئة جدول تعليمي أو دليل ناقص. البطاقات فيها pH 5.5 وP 12 ppm وP 18 ppm و11-52-0. لكل بطاقة اذكر الطريقة أو بيانات المحصول الناقصة، وسيب كميتي التطبيق X/Y فارغتين.\n\nالمدرّب يعرض طقمًا حقيقيًا بدليله أو تسجيلًا معمليًا؛ الطالب يشرح الترتيب اللي شافه والتفسير. لا تسجل مناولة كواشف أو اجتياز تشغيل مستقل.', 'رتب أولًا الاستخلاص والترشيح وتفاعل الكاشف والقراءة. بعدين صنّف أربع بطاقات: وحدة تحليل تربة أو ملصق منتج أو فئة جدول تعليمي أو دليل ناقص. البطاقات فيها بي إتش خمسة فاصلة خمسة والفوسفور اتناشر جزء في المليون والفوسفور تمنتاشر جزء في المليون و حداشر، اتنين وخمسين، صفر. لكل بطاقة اذكر الطريقة أو بيانات المحصول الناقصة، وسيب كميتي التطبيق إكس وواي فارغتين.\n\nالمدرّب يعرض طقمًا حقيقيًا بدليله أو تسجيلًا معمليًا؛ الطالب يشرح الترتيب اللي شافه والتفسير. لا تسجل مناولة كواشف أو اجتياز تشغيل مستقل.'), ('طالب شاف P في تحليل التربة 12 ppm وشكارة مكتوب عليها 11-52-0، فقال إنها هتزود P التربة 52 ppm.\n\nppm في تحليل التربة له طريقة وأساس عينة؛ مش نسبة المنتج المئوية.\n\n11-52-0 هي نسب N وP2O5 وK2O في المنتج، مش تغيرًا مباشرًا في P نتيجة تحليل التربة.\n\nالكمية تحتاج توصية عناصر معايرة للمحصول ومحتوى المنتج ومساحة وطريقة الإضافة، مع احتساب الرصيد والحدود.\n\nافصل وحدات تحليل التربة عن تحليل عبوة السماد.', 'طالب شاف الفوسفور في تحليل التربة اتناشر جزء في المليون وشكارة مكتوب عليها حداشر، اتنين وخمسين، صفر، فقال إنها هتزود الفوسفور التربة اتنين وخمسين جزء في المليون.\n\nجزء في المليون في تحليل التربة له طريقة وأساس عينة؛ مش نسبة المنتج المئوية.\n\nحداشر، اتنين وخمسين، صفر هي نسب النيتروجين وبي اتنين أو خمسة وكيه اتنين أو في المنتج، مش تغيرًا مباشرًا في الفوسفور نتيجة تحليل التربة.\n\nالكمية تحتاج توصية عناصر معايرة للمحصول ومحتوى المنتج ومساحة وطريقة الإضافة، مع احتساب الرصيد والحدود.\n\nافصل وحدات تحليل التربة عن تحليل عبوة السماد.'), ('طقمًا حقيقيًا', 'طقم حقيقي'), ('عشرة جزء في المليون', 'عشر أجزاء في المليون'), ('لون أو رقم تحليل التربة ما يبقاش مفيد إلا لما تعرف إيه اللي اتستخلص، واتقاس إزاي، وبأي وحدة، ويتفسر للمحصول إزاي. شوف عرض المدرّب، وبعدها اشرح الدليل والمعلومات الناقصة قبل ما تفكر في توصية سماد.\n\nترتب الاستخلاص والترشيح وتفاعل الكاشف والقراءة، وتشرح الطريقة المعروضة تقيس إيه وما تقدرش تقيس إيه.\n\nتقرأ pH ونسبة المادة العضوية ونتائج العناصر مع الوحدات والطريقة والمرجع الخاص بالمحصول، وتفرق بين مؤشر التحليل ومخزون العناصر الكلي وجرعة السماد.\n\nتحدد طريقة التحليل والتفسير المحلي والمحصول والحقل والمنتج اللي بياناتهم ناقصة ومانعين تصنيف NPK أو تحديد كمية عامة، وتسيب X وY مجهولين لحد ما يبقى عندك دليل.', 'لون أو رقم تحليل التربة ما يبقاش مفيد إلا لما تعرف إيه اللي اتستخلص، واتقاس إزاي، وبأي وحدة، ويتفسر للمحصول إزاي. شوف عرض المدرّب، وبعدها اشرح الدليل والمعلومات الناقصة قبل ما تفكر في توصية سماد.\n\nترتب الاستخلاص والترشيح وتفاعل الكاشف والقراءة، وتشرح الطريقة المعروضة تقيس إيه وما تقدرش تقيس إيه.\n\nتقرأ بي إتش ونسبة المادة العضوية ونتائج العناصر مع الوحدات والطريقة والمرجع الخاص بالمحصول، وتفرق بين مؤشر التحليل ومخزون العناصر الكلي وجرعة السماد.\n\nتحدد طريقة التحليل والتفسير المحلي والمحصول والحقل والمنتج اللي بياناتهم ناقصة ومانعين تصنيف إن بي كيه أو تحديد كمية عامة، وتسيب إكس وواي مجهولين لحد ما يبقى عندك دليل.'), ('مثال فصل تاريخي فقط؛ مش توصية عامة لمعمل أو حقل\n\nجدول المثال لا يحدد طريقة استخلاص أو منطقة أو محصولًا أو أساس عينة أو كل حدود الفئات. ممنوع اعتباره جدول تشخيص عام أو حساب جرعة سماد.\n\nالبند\n\nمنخفض في المثال\n\nمناسب في المثال\n\nمرتفع في المثال\n\nاتجاه تعليمي مشروط\n\npH\n\n< 6.0\n\n6.0–7.5\n\n> 7.5\n\nالمنخفض: افحص احتياج الجير للمحصول؛ المرتفع: افحص الجدوى والكيمياء قبل أي تحميض\n\nالمادة العضوية\n\n< 2%\n\n3–6%\n\n> 6%\n\nالمنخفض: افحص ملاءمة الكمبوست أو السماد المتحلل أو التغطية؛ النسبة حسب الطريقة والموقع\n\nP\n\n< 15 ppm\n\n20–40 ppm\n\n> 50 ppm\n\nالمنخفض: اطلب إرشاد P معايرًا؛ المرتفع: تجنب إضافة P تلقائيًا\n\nK\n\n< 100 ppm\n\n120–200 ppm\n\n> 250 ppm\n\nالمنخفض: اطلب إرشاد K معايرًا؛ المرتفع: تجنب إضافة K تلقائيًا\n\nN\n\n< 10 ppm\n\nيختلف كثيرًا\n\nيختلف كثيرًا\n\nخطط حسب المحصول والتوقيت ورصيد العناصر والطريقة المحلية؛ لا حد عام', 'مثال فصل تاريخي فقط؛ مش توصية عامة لمعمل أو حقل\n\nجدول المثال لا يحدد طريقة استخلاص أو منطقة أو محصولًا أو أساس عينة أو كل حدود الفئات. ممنوع اعتباره جدول تشخيص عام أو حساب جرعة سماد.\n\nالبند\n\nمنخفض في المثال\n\nمناسب في المثال\n\nمرتفع في المثال\n\nاتجاه تعليمي مشروط\n\nبي إتش\n\nأقل من  ستة فاصلة صفر\n\nستة فاصلة صفر إلى سبعة فاصلة خمسة\n\nأكبر من  سبعة فاصلة خمسة\n\nالمنخفض: افحص احتياج الجير للمحصول؛ المرتفع: افحص الجدوى والكيمياء قبل أي تحميض\n\nالمادة العضوية\n\nأقل من  اتنين في المية\n\nتلاتة إلى ستة في المية\n\nأكبر من  ستة في المية\n\nالمنخفض: افحص ملاءمة الكمبوست أو السماد المتحلل أو التغطية؛ النسبة حسب الطريقة والموقع\n\nالفوسفور\n\nأقل من  خمستاشر جزء في المليون\n\nعشرين إلى أربعين جزء في المليون\n\nأكبر من  خمسين جزء في المليون\n\nالمنخفض: اطلب إرشاد معاير للفوسفور؛ المرتفع: تجنب إضافة الفوسفور تلقائيًا\n\nالبوتاسيوم\n\nأقل من  مية جزء في المليون\n\nمية وعشرين إلى ميتين جزء في المليون\n\nأكبر من  ميتين وخمسين جزء في المليون\n\nالمنخفض: اطلب إرشاد معاير للبوتاسيوم؛ المرتفع: تجنب إضافة البوتاسيوم تلقائيًا\n\nالنيتروجين\n\nأقل من  عشرة جزء في المليون\n\nيختلف كثيرًا\n\nيختلف كثيرًا\n\nخطط حسب المحصول والتوقيت ورصيد العناصر والطريقة المحلية؛ لا حد عام'), ('محلول استخلاص\n\nسائل تحدده طريقة التحليل لتحرير جزء معلوم التعريف من مكوّن في التربة من أجل قياسه.\n\nراشح\n\nالسائل الناتج بعد فصل الجسيمات من معلق التربة بالطريقة المحددة.\n\nتفاعل لوني\n\nتفاعل كاشف خاص بالطريقة يعطي لونًا يقارن بجدول أو يُقاس بجهاز مناسب.\n\nppm\n\nأجزاء في المليون على أساس كتلة أو حجم محدد في التقرير؛ اسأل هل هي mg/kg تربة أو mg/L محلول أو أساسًا معلنًا غيرهما.\n\nمعايرة تفسير الاختبار\n\nالربط الخاص بالطريقة والمنطقة بين مؤشر الاختبار واستجابة المحصول أو فئته.\n\nملصق N-P-K\n\nنسب السماد المئوية من N والفوسفات محسوبًا P2O5 والبوتاس محسوبًا K2O؛ ليست أرقام ppm في تحليل التربة.', 'محلول استخلاص\n\nسائل تحدده طريقة التحليل لتحرير جزء معلوم التعريف من مكوّن في التربة من أجل قياسه.\n\nراشح\n\nالسائل الناتج بعد فصل الجسيمات من معلق التربة بالطريقة المحددة.\n\nتفاعل لوني\n\nتفاعل كاشف خاص بالطريقة يعطي لونًا يقارن بجدول أو يُقاس بجهاز مناسب.\n\nجزء في المليون\n\nأجزاء في المليون على أساس كتلة أو حجم محدد في التقرير؛ اسأل هل هي مليجرام لكل كيلوجرام تربة أو مليجرام لكل لتر محلول أو أساسًا معلنًا غيرهما.\n\nمعايرة تفسير الاختبار\n\nالربط الخاص بالطريقة والمنطقة بين مؤشر الاختبار واستجابة المحصول أو فئته.\n\nملصق النيتروجين-الفوسفور-البوتاسيوم\n\nنسب السماد المئوية من النيتروجين والفوسفات محسوب بي اتنين أو خمسة والبوتاس محسوب كيه اتنين أو؛ ليست أرقام جزء في المليون في تحليل التربة.'), ('مش تغيرًا مباشرًا', 'مش تغير مباشر')], 'en': [("A classroom report shows pH 5.5 and P 12 ppm. Someone copies the example table and writes 'apply X lime and Y fertilizer' without knowing either amount.\n\nUnder that table, the values fall in its low rows. Say 'under that table' because the table has no method or regional calibration.\n\nAsk for crop target and lime requirement, and for the P extraction method and suitable local recommendation.\n\nKeep X and Y blank until those inputs, product analyses and application conditions are known.\n\nA classroom class is not a field application rate.", "A classroom report shows P H five point five and phosphorus twelve parts per million. Someone copies the example table and writes 'apply X lime and Y fertilizer' without knowing either amount.\n\nUnder that table, the values fall in its low rows. Say 'under that table' because the table has no method or regional calibration.\n\nAsk for crop target and lime requirement, and for the phosphorus extraction method and suitable local recommendation.\n\nKeep X and Y blank until those inputs, product analyses and application conditions are known.\n\nA classroom class is not a field application rate."), ("A colour or number from a soil test is useful only when you know what was extracted, how it was measured, its unit and the crop-specific interpretation. Watch the trainer's demonstration, then explain the evidence and the missing information before considering a fertilizer recommendation.\n\nPut extraction, filtration, reagent reaction and reading in order, and explain what the demonstrated method can and cannot measure.\n\nRead pH, organic-matter percentage and nutrient results with their units, methods and crop-specific reference; distinguish an extracted test index from total soil reserves and a fertilizer rate.\n\nIdentify the missing method, local interpretation, crop, field and product information that prevents a universal NPK class or amount; leave X and Y as unknowns until supported.", "A colour or number from a soil test is useful only when you know what was extracted, how it was measured, its unit and the crop-specific interpretation. Watch the trainer's demonstration, then explain the evidence and the missing information before considering a fertilizer recommendation.\n\nPut extraction, filtration, reagent reaction and reading in order, and explain what the demonstrated method can and cannot measure.\n\nRead P H, organic-matter percentage and nutrient results with their units, methods and crop-specific reference; distinguish an extracted test index from total soil reserves and a fertilizer rate.\n\nIdentify the missing method, local interpretation, crop, field and product information that prevents a universal N P K class or amount; leave X and Y as unknowns until supported."), ("A learner sees a P soil-test result of 12 ppm and a bag labelled 11-52-0. They claim the bag will add 52 ppm of soil P.\n\nThe soil report's ppm result has a method and sample basis; it is not a product percentage.\n\n11-52-0 gives percentages of N, P2O5 and K2O in the product, not a direct change in soil-test P.\n\nRate requires a calibrated crop nutrient recommendation, product content, area and application method, with any credits and limits.\n\nKeep soil-test units and fertilizer-product analysis separate.", "A learner sees a phosphorus soil-test result of twelve parts per million and a bag labelled eleven, fifty-two, zero. They claim the bag will add fifty-two parts per million of soil phosphorus.\n\nThe soil report's parts per million result has a method and sample basis; it is not a product percentage.\n\neleven, fifty-two, zero gives percentages of nitrogen, P two O five and K two O in the product, not a direct change in soil-test phosphorus.\n\nRate requires a calibrated crop nutrient recommendation, product content, area and application method, with any credits and limits.\n\nKeep soil-test units and fertilizer-product analysis separate."), ("A report says only 'P 18 ppm' and a learner labels it Low using the classroom table.\n\n18 falls in the table's 15–20 ppm gap, so the example provides no category even on its own terms.\n\nThe extraction method, sample basis, crop and regional guide are absent, so a different table cannot be borrowed casually.\n\nRequest the laboratory's interpretation; do not choose a P fertilizer or amount from this number alone.\n\nAn honest 'unclassified with this evidence' is more useful than a confident guess.", "A report says only 'phosphorus eighteen parts per million' and a learner labels it Low using the classroom table.\n\neighteen falls in the table's fifteen to twenty parts per million gap, so the example provides no category even on its own terms.\n\nThe extraction method, sample basis, crop and regional guide are absent, so a different table cannot be borrowed casually.\n\nRequest the laboratory's interpretation; do not choose a phosphorus fertilizer or amount from this number alone.\n\nAn honest 'unclassified with this evidence' is more useful than a confident guess."), ("A trainer shows a rapid P kit: measured soil is mixed with extractant, filtered, reacted and read against its chart. A learner says the colour measures all P in the field.\n\nPut the four stages in their observed order and name the method-specific quantities and reagent from the kit instructions, rather than inventing them.\n\nThe colour or instrument represents the fraction and response defined by that method, not total P in the soil.\n\nA crop decision also needs the kit or laboratory's calibrated interpretation and field context.\n\nA test index acquires meaning through its method and calibration.", "A trainer shows a rapid phosphorus kit: measured soil is mixed with extractant, filtered, reacted and read against its chart. A learner says the colour measures all phosphorus in the field.\n\nPut the four stages in their observed order and name the method-specific quantities and reagent from the kit instructions, rather than inventing them.\n\nThe colour or instrument represents the fraction and response defined by that method, not total phosphorus in the soil.\n\nA crop decision also needs the kit or laboratory's calibrated interpretation and field context.\n\nA test index acquires meaning through its method and calibration."), ('Can I prepare and identify a sample as instructed for the stated common test, then explain what the trainer demonstrated about NPK extraction, units, method, interpretation and missing evidence before a fertilizer amount?\n\nSelf-check only', 'Can I prepare and identify a sample as instructed for the stated common test, then explain what the trainer demonstrated about N P K extraction, units, method, interpretation and missing evidence before a fertilizer amount?\n\nSelf-check only'), ('First arrange extraction, filtration, reagent reaction and readout. Then tag each of four cards as soil-test unit, product label, teaching-table class or missing evidence. Cards include pH 5.5, P 12 ppm, P 18 ppm and 11-52-0. For each card state the method or crop information still needed; leave X/Y application amounts blank.\n\nTrainer demonstrates with actual kit/manual or a recorded lab example; learner explains the observed order and interpretation. No student chemical handling or independent-operation pass is recorded.', 'First arrange extraction, filtration, reagent reaction and readout. Then tag each of four cards as soil-test unit, product label, teaching-table class or missing evidence. Cards include P H five point five, phosphorus twelve parts per million, phosphorus eighteen parts per million and eleven, fifty-two, zero. For each card state the method or crop information still needed; leave X/Y application amounts blank.\n\nTrainer demonstrates with actual kit/manual or a recorded lab example; learner explains the observed order and interpretation. No student chemical handling or independent-operation pass is recorded.'), ('Historic classroom example only; not a universal laboratory or field recommendation\n\nThe historic table provides no extraction method, region, crop, sample basis or full category rules. Never use it as a universal diagnostic or fertilizer-rate chart.\n\nParameter\n\nExample low\n\nExample optimum\n\nExample high\n\nConditional classroom direction\n\npH\n\n< 6.0\n\n6.0–7.5\n\n> 7.5\n\nLow: investigate lime for the crop; high: assess feasibility and chemistry before any acidification\n\nOrganic matter\n\n< 2%\n\n3–6%\n\n> 6%\n\nLow: assess suitable compost, manure or cover crops; percentage depends on method and site\n\nP\n\n< 15 ppm\n\n20–40 ppm\n\n> 50 ppm\n\nLow: seek calibrated P guidance; high: avoid automatic additional P\n\nK\n\n< 100 ppm\n\n120–200 ppm\n\n> 250 ppm\n\nLow: seek calibrated K guidance; high: avoid automatic additional K\n\nN\n\n< 10 ppm\n\nvaries greatly\n\nvaries greatly\n\nPlan from crop demand, timing, credits and local method; no universal cutoff', 'Historic classroom example only; not a universal laboratory or field recommendation\n\nThe historic table provides no extraction method, region, crop, sample basis or full category rules. Never use it as a universal diagnostic or fertilizer-rate chart.\n\nParameter\n\nExample low\n\nExample optimum\n\nExample high\n\nConditional classroom direction\n\nP H\n\nless than  six point zero\n\nsix point zero to seven point five\n\ngreater than  seven point five\n\nLow: investigate lime for the crop; high: assess feasibility and chemistry before any acidification\n\nOrganic matter\n\nless than  two percent\n\nthree to six percent\n\ngreater than  six percent\n\nLow: assess suitable compost, manure or cover crops; percentage depends on method and site\n\nphosphorus\n\nless than  fifteen parts per million\n\ntwenty to forty parts per million\n\ngreater than  fifty parts per million\n\nLow: seek calibrated phosphorus guidance; high: avoid automatic additional phosphorus\n\npotassium\n\nless than  one hundred parts per million\n\none hundred twenty to two hundred parts per million\n\ngreater than  two hundred fifty parts per million\n\nLow: seek calibrated potassium guidance; high: avoid automatic additional potassium\n\nnitrogen\n\nless than  ten parts per million\n\nvaries greatly\n\nvaries greatly\n\nPlan from crop demand, timing, credits and local method; no universal cutoff'), ("extractant\n\nA solution specified by a test method to release a defined fraction of a soil constituent for measurement.\n\nfiltrate\n\nThe liquid obtained after separating particles from the soil suspension in the stated method.\n\ncolour reaction\n\nA method-specific reagent reaction whose colour can be compared with a chart or measured by a suitable instrument.\n\nppm\n\nParts per million on the report's stated mass or volume basis; ask whether the result is mg/kg soil, mg/L solution or another declared basis.\n\ncalibration\n\nThe method- and region-specific link between a test index and crop response or category.\n\nN-P-K label\n\nFertilizer percentages of N, phosphate as P2O5 and potash as K2O; not the soil-test ppm values.", "extractant\n\nA solution specified by a test method to release a defined fraction of a soil constituent for measurement.\n\nfiltrate\n\nThe liquid obtained after separating particles from the soil suspension in the stated method.\n\ncolour reaction\n\nA method-specific reagent reaction whose colour can be compared with a chart or measured by a suitable instrument.\n\nparts per million\n\nParts per million on the report's stated mass or volume basis; ask whether the result is milligrams per kilogram soil, milligrams per litre solution or another declared basis.\n\ncalibration\n\nThe method- and region-specific link between a test index and crop response or category.\n\nnitrogen-phosphorus-potassium label\n\nFertilizer percentages of nitrogen, phosphate as P two O five and potash as K two O; not the soil-test parts per million values.")], 'it': [('I parti per milione', 'Le parti per milione'), ('Il formatore mostra un kit rapido per P: suolo misurato con estraente, filtrazione, reazione e lettura sulla scala. Un allievo dice che il colore misura tutto il P del campo.\n\nDisponi le quattro fasi osservate e nomina quantità e reagente del metodo secondo il kit, senza inventarli.\n\nColore o strumento rappresentano frazione e risposta definite dal metodo, non P totale del suolo.\n\nLa decisione colturale richiede anche interpretazione calibrata e contesto del campo.\n\nUn indice acquista significato dal metodo e dalla sua calibrazione.', 'Il formatore mostra un kit rapido per fosforo: suolo misurato con estraente, filtrazione, reazione e lettura sulla scala. Un allievo dice che il colore misura tutto il fosforo del campo.\n\nDisponi le quattro fasi osservate e nomina quantità e reagente del metodo secondo il kit, senza inventarli.\n\nColore o strumento rappresentano frazione e risposta definite dal metodo, non fosforo totale del suolo.\n\nLa decisione colturale richiede anche interpretazione calibrata e contesto del campo.\n\nUn indice acquista significato dal metodo e dalla sua calibrazione.'), ("Ordina prima estrazione, filtrazione, reazione del reagente e lettura. Poi assegna quattro schede a unità del test del suolo, etichetta del prodotto, classe didattica o dato mancante. Le schede riportano pH 5.5, P 12 ppm, P 18 ppm e 11-52-0. Per ognuna indica metodo o coltura ancora da conoscere e lascia vuote le quantità X/Y.\n\nIl formatore esegue la dimostrazione con kit e manuale reali o con un esempio registrato di laboratorio; l'allievo spiega l'ordine osservato e l'interpretazione. Non si registra alcuna manipolazione di reagenti da parte dell'allievo né il superamento di una prova di esecuzione autonoma.", "Ordina prima estrazione, filtrazione, reazione del reagente e lettura. Poi assegna quattro schede a unità del test del suolo, etichetta del prodotto, classe didattica o dato mancante. Le schede riportano P H cinque virgola cinque, fosforo dodici parti per milione, fosforo diciotto parti per milione e undici, cinquantadue, zero. Per ognuna indica metodo o coltura ancora da conoscere e lascia vuote le quantità X/Y.\n\nIl formatore esegue la dimostrazione con kit e manuale reali o con un esempio registrato di laboratorio; l'allievo spiega l'ordine osservato e l'interpretazione. Non si registra alcuna manipolazione di reagenti da parte dell'allievo né il superamento di una prova di esecuzione autonoma."), ('So preparare e identificare il campione secondo il test comune dichiarato, poi spiegare estrazione NPK, unità, metodo, interpretazione e dati mancanti mostrati dal formatore prima di una dose?\n\nSolo autoverifica', 'So preparare e identificare il campione secondo il test comune dichiarato, poi spiegare estrazione enne pi cappa, unità, metodo, interpretazione e dati mancanti mostrati dal formatore prima di una dose?\n\nSolo autoverifica'), ("Solo esempio didattico storico; non una raccomandazione universale di laboratorio o campo\n\nLa tabella storica non specifica estraente, regione, coltura, base del campione o regole complete. Non usarla come diagnosi universale o tabella di dosi.\n\nParametro\n\nBasso nell'esempio\n\nAdeguato nell'esempio\n\nAlto nell'esempio\n\nDirezione didattica condizionata\n\npH\n\n< 6.0\n\n6.0–7.5\n\n> 7.5\n\nBasso: valutare calce per la coltura; alto: verificare fattibilità e chimica prima di acidificare\n\nSostanza organica\n\n< 2%\n\n3–6%\n\n> 6%\n\nBasso: valutare compost, letame o colture di copertura idonei; percentuale dipendente da metodo e sito\n\nP\n\n< 15 ppm\n\n20–40 ppm\n\n> 50 ppm\n\nBasso: chiedere guida P calibrata; alto: evitare P aggiuntivo automatico\n\nK\n\n< 100 ppm\n\n120–200 ppm\n\n> 250 ppm\n\nBasso: chiedere guida K calibrata; alto: evitare K aggiuntivo automatico\n\nN\n\n< 10 ppm\n\nvaria molto\n\nvaria molto\n\nPianificare da coltura, tempi, apporti già disponibili e metodo locale; nessuna soglia universale", "Solo esempio didattico storico; non una raccomandazione universale di laboratorio o campo\n\nLa tabella storica non specifica estraente, regione, coltura, base del campione o regole complete. Non usarla come diagnosi universale o tabella di dosi.\n\nParametro\n\nBasso nell'esempio\n\nAdeguato nell'esempio\n\nAlto nell'esempio\n\nDirezione didattica condizionata\n\nP H\n\nmeno di  sei virgola zero\n\nsei virgola zero a sette virgola cinque\n\npiù di  sette virgola cinque\n\nBasso: valutare calce per la coltura; alto: verificare fattibilità e chimica prima di acidificare\n\nSostanza organica\n\nmeno di  due per cento\n\ntre a sei per cento\n\npiù di  sei per cento\n\nBasso: valutare compost, letame o colture di copertura idonei; percentuale dipendente da metodo e sito\n\nfosforo\n\nmeno di  quindici parti per milione\n\nventi a quaranta parti per milione\n\npiù di  cinquanta parti per milione\n\nBasso: chiedere guida fosforo calibrata; alto: evitare fosforo aggiuntivo automatico\n\npotassio\n\nmeno di  cento parti per milione\n\ncentoventi a duecento parti per milione\n\npiù di  duecentocinquanta parti per milione\n\nBasso: chiedere guida potassio calibrata; alto: evitare potassio aggiuntivo automatico\n\nazoto\n\nmeno di  dieci parti per milione\n\nvaria molto\n\nvaria molto\n\nPianificare da coltura, tempi, apporti già disponibili e metodo locale; nessuna soglia universale"), ("Un allievo vede P del suolo a 12 ppm e un sacco 11-52-0; sostiene che il sacco aggiungerà 52 ppm di P nel suolo.\n\nI ppm del rapporto hanno un metodo e una base del campione; non sono una percentuale del prodotto.\n\n11-52-0 indica percentuali di N, P2O5 e K2O nel prodotto, non variazione diretta del test del suolo.\n\nLa dose richiede raccomandazione colturale calibrata, contenuto del prodotto, superficie e tecnica, con apporti e limiti.\n\nSepara unità dell'analisi del suolo e composizione del fertilizzante.", "Un allievo vede fosforo del suolo a dodici parti per milione e un sacco undici, cinquantadue, zero; sostiene che il sacco aggiungerà cinquantadue parti per milione di fosforo nel suolo.\n\nI parti per milione del rapporto hanno un metodo e una base del campione; non sono una percentuale del prodotto.\n\nundici, cinquantadue, zero indica percentuali di azoto, pi due o cinque e cappa due o nel prodotto, non variazione diretta del test del suolo.\n\nLa dose richiede raccomandazione colturale calibrata, contenuto del prodotto, superficie e tecnica, con apporti e limiti.\n\nSepara unità dell'analisi del suolo e composizione del fertilizzante."), ("Un colore o un numero di un'analisi del suolo serve solo se sai cosa è stato estratto, come è stato misurato, con quale unità e come viene interpretato per la coltura. Osserva la dimostrazione del formatore, poi spiega le prove e i dati mancanti prima di considerare un concime.\n\nOrdinare estrazione, filtrazione, reazione col reagente e lettura, spiegando cosa il metodo dimostrato può e non può misurare.\n\nLeggere pH, percentuale di sostanza organica e nutrienti con unità, metodo e riferimento per la coltura; distinguere un indice estratto dalle riserve totali e dalla dose di fertilizzante.\n\nIndicare metodo, interpretazione locale, coltura, campo e prodotto mancanti che impediscono una categoria o quantità NPK universale; lasciare X e Y incogniti finché non giustificati.", "Un colore o un numero di un'analisi del suolo serve solo se sai cosa è stato estratto, come è stato misurato, con quale unità e come viene interpretato per la coltura. Osserva la dimostrazione del formatore, poi spiega le prove e i dati mancanti prima di considerare un concime.\n\nOrdinare estrazione, filtrazione, reazione col reagente e lettura, spiegando cosa il metodo dimostrato può e non può misurare.\n\nLeggere P H, percentuale di sostanza organica e nutrienti con unità, metodo e riferimento per la coltura; distinguere un indice estratto dalle riserve totali e dalla dose di fertilizzante.\n\nIndicare metodo, interpretazione locale, coltura, campo e prodotto mancanti che impediscono una categoria o quantità enne pi cappa universale; lasciare X e Y incogniti finché non giustificati."), ("Un rapporto dice solo «P 18 ppm» e un allievo lo classifica Basso dalla tabella didattica.\n\n18 cade nell'intervallo vuoto 15–20 ppm, quindi la stessa tabella non assegna alcuna classe.\n\nMancano estraente, base del campione, coltura e guida regionale: non prendere a caso un'altra tabella.\n\nChiedi l'interpretazione del laboratorio; non scegliere fonte o dose di P da questo numero.\n\n«Non classificabile con questi dati» è meglio di una congettura sicura.", "Un rapporto dice solo «fosforo diciotto parti per milione» e un allievo lo classifica Basso dalla tabella didattica.\n\ndiciotto cade nell'intervallo vuoto quindici a venti parti per milione, quindi la stessa tabella non assegna alcuna classe.\n\nMancano estraente, base del campione, coltura e guida regionale: non prendere a caso un'altra tabella.\n\nChiedi l'interpretazione del laboratorio; non scegliere fonte o dose di fosforo da questo numero.\n\n«Non classificabile con questi dati» è meglio di una congettura sicura."), ('Un rapporto scolastico dà pH 5.5 e P 12 ppm. Qualcuno copia la tabella e scrive «X calce e Y concime» senza conoscere le quantità.\n\nIn quella tabella entrambi i valori sono nelle righe basse. Specifica «in quella tabella», perché non dichiara metodo o calibrazione regionale.\n\nChiedi obiettivo della coltura, fabbisogno di calce, metodo P e raccomandazione locale adatta.\n\nLascia X e Y vuoti finché non conosci dati, analisi del prodotto e condizioni applicative.\n\nLa categoria scolastica non è una dose di campo.', 'Un rapporto scolastico dà P H cinque virgola cinque e fosforo dodici parti per milione. Qualcuno copia la tabella e scrive «X calce e Y concime» senza conoscere le quantità.\n\nIn quella tabella entrambi i valori sono nelle righe basse. Specifica «in quella tabella», perché non dichiara metodo o calibrazione regionale.\n\nChiedi obiettivo della coltura, fabbisogno di calce, metodo fosforo e raccomandazione locale adatta.\n\nLascia X e Y vuoti finché non conosci dati, analisi del prodotto e condizioni applicative.\n\nLa categoria scolastica non è una dose di campo.'), ('estraente\n\nSoluzione prescritta da un metodo per rendere misurabile una frazione definita di un costituente del suolo.\n\nfiltrato\n\nLiquido ottenuto dopo aver separato le particelle dalla sospensione secondo il metodo.\n\nreazione colorimetrica\n\nReazione con reagente specifico il cui colore si confronta con una scala o si misura con uno strumento adatto.\n\nppm\n\nParti per milione sulla base di massa o volume del rapporto; chiedi se è mg/kg suolo, mg/L soluzione o altra base dichiarata.\n\ncalibrazione interpretativa\n\nLegame specifico del metodo e della regione tra indice del test e risposta o categoria della coltura.\n\netichetta N-P-K\n\nPercentuali di N, fosfato come P2O5 e potassa come K2O nel concime, non i ppm del suolo.', 'estraente\n\nSoluzione prescritta da un metodo per rendere misurabile una frazione definita di un costituente del suolo.\n\nfiltrato\n\nLiquido ottenuto dopo aver separato le particelle dalla sospensione secondo il metodo.\n\nreazione colorimetrica\n\nReazione con reagente specifico il cui colore si confronta con una scala o si misura con uno strumento adatto.\n\nparti per milione\n\nParti per milione sulla base di massa o volume del rapporto; chiedi se è milligrammi per chilogrammo suolo, milligrammi per litro soluzione o altra base dichiarata.\n\ncalibrazione interpretativa\n\nLegame specifico del metodo e della regione tra indice del test e risposta o categoria della coltura.\n\netichetta azoto-fosforo-potassio\n\nPercentuali di azoto, fosfato come pi due o cinque e potassa come cappa due o nel concime, non i parti per milione del suolo.'), ('guida fosforo calibrata', 'guida calibrata per il fosforo'), ('guida potassio calibrata', 'guida calibrata per il potassio'), ('metodo fosforo', 'metodo per il fosforo'), ('non i parti per milione', 'non le parti per milione'), ('vede fosforo del suolo', 'vede il fosforo del suolo')], 'de': [('Der Teile pro Million-Bodenwert', 'Der in Teilen pro Million angegebene Bodenwert'), ('Die Lehrkraft zeigt einen P-Schnelltest: gemessener Boden wird extrahiert, filtriert, zur Reaktion gebracht und anhand der Skala gelesen. Eine Person meint, die Farbe messe sämtliches P im Feld.\n\nOrdne die vier beobachteten Schritte und nenne verfahrensabhängige Mengen und Reagenz nach Testanleitung, statt sie zu erfinden.\n\nFarbe oder Instrument stehen für den durch das Verfahren definierten Anteil und die Reaktion, nicht für den gesamten P-Vorrat.\n\nEine Kulturentscheidung braucht außerdem kalibrierte Test- oder Labordeutung und Feldzusammenhang.\n\nEin Testindex wird durch Methode und Kalibrierung aussagekräftig.', 'Die Lehrkraft zeigt einen Phosphor-Schnelltest: gemessener Boden wird extrahiert, filtriert, zur Reaktion gebracht und anhand der Skala gelesen. Eine Person meint, die Farbe messe sämtliches Phosphor im Feld.\n\nOrdne die vier beobachteten Schritte und nenne verfahrensabhängige Mengen und Reagenz nach Testanleitung, statt sie zu erfinden.\n\nFarbe oder Instrument stehen für den durch das Verfahren definierten Anteil und die Reaktion, nicht für den gesamten Phosphor-Vorrat.\n\nEine Kulturentscheidung braucht außerdem kalibrierte Test- oder Labordeutung und Feldzusammenhang.\n\nEin Testindex wird durch Methode und Kalibrierung aussagekräftig.'), ('Ein Bericht nennt nur „P 18 ppm“, und eine Person nennt es nach der Unterrichtstabelle Niedrig.\n\n18 liegt in der Tabellenlücke 15–20 ppm, sodass bereits das Beispiel selbst keine Klasse gibt.\n\nExtraktion, Probenbasis, Kultur und Regionalhilfe fehlen; eine andere Tabelle darf nicht beliebig übernommen werden.\n\nBitte um Labordeutung und wähle weder P-Dünger noch Menge nur aus dieser Zahl.\n\n„Mit diesen Daten nicht eingestuft“ ist besser als sicheres Raten.', 'Ein Bericht nennt nur „Phosphor achtzehn Teile pro Million“, und eine Person nennt es nach der Unterrichtstabelle Niedrig.\n\nachtzehn liegt in der Tabellenlücke fünfzehn bis zwanzig Teile pro Million, sodass bereits das Beispiel selbst keine Klasse gibt.\n\nExtraktion, Probenbasis, Kultur und Regionalhilfe fehlen; eine andere Tabelle darf nicht beliebig übernommen werden.\n\nBitte um Labordeutung und wähle weder Phosphor-Dünger noch Menge nur aus dieser Zahl.\n\n„Mit diesen Daten nicht eingestuft“ ist besser als sicheres Raten.'), ('Ein Unterrichtsbericht zeigt pH 5.5 und P 12 ppm. Jemand kopiert die Beispieltabelle und schreibt „X Kalk und Y Dünger ausbringen“, ohne die Mengen zu kennen.\n\nNach genau dieser Tabelle liegen beide Zahlen in niedrigen Zeilen. Sage „nach dieser Tabelle“, denn Methode und regionale Kalibrierung fehlen.\n\nFrage nach Kulturziel, Kalkbedarf, P-Extraktionsverfahren und geeigneter lokaler Empfehlung.\n\nLass X und Y offen, bis diese Daten, Produktanalyse und Anwendungsbedingungen bekannt sind.\n\nEine Unterrichtsstufe ist keine Feldmenge.', 'Ein Unterrichtsbericht zeigt P H fünf Komma fünf und Phosphor zwölf Teile pro Million. Jemand kopiert die Beispieltabelle und schreibt „X Kalk und Y Dünger ausbringen“, ohne die Mengen zu kennen.\n\nNach genau dieser Tabelle liegen beide Zahlen in niedrigen Zeilen. Sage „nach dieser Tabelle“, denn Methode und regionale Kalibrierung fehlen.\n\nFrage nach Kulturziel, Kalkbedarf, Phosphor-Extraktionsverfahren und geeigneter lokaler Empfehlung.\n\nLass X und Y offen, bis diese Daten, Produktanalyse und Anwendungsbedingungen bekannt sind.\n\nEine Unterrichtsstufe ist keine Feldmenge.'), ('Eine Farbe oder Zahl aus der Bodenprüfung hilft nur, wenn bekannt ist, was extrahiert und wie gemessen wurde, welche Einheit gilt und wie das Ergebnis für die Kultur gedeutet wird. Beobachte die Vorführung der Lehrkraft und erkläre danach Belege und fehlende Angaben vor einer Düngeempfehlung.\n\nExtraktion, Filtration, Reagenzreaktion und Ablesung ordnen und erläutern, was das vorgeführte Verfahren messen kann und was nicht.\n\npH, Anteil organischer Substanz und Nährstoffwerte mit Einheiten, Methode und kulturbezogenem Bezug lesen; einen extrahierten Testindex von Gesamtvorrat und Düngegabe unterscheiden.\n\nFehlende Methode, lokale Deutung, Kultur, Feld- und Produktdaten erkennen, die eine allgemeine NPK-Klasse oder Menge verhindern; X und Y bis zu belastbaren Belegen offenlassen.', 'Eine Farbe oder Zahl aus der Bodenprüfung hilft nur, wenn bekannt ist, was extrahiert und wie gemessen wurde, welche Einheit gilt und wie das Ergebnis für die Kultur gedeutet wird. Beobachte die Vorführung der Lehrkraft und erkläre danach Belege und fehlende Angaben vor einer Düngeempfehlung.\n\nExtraktion, Filtration, Reagenzreaktion und Ablesung ordnen und erläutern, was das vorgeführte Verfahren messen kann und was nicht.\n\nP H, Anteil organischer Substanz und Nährstoffwerte mit Einheiten, Methode und kulturbezogenem Bezug lesen; einen extrahierten Testindex von Gesamtvorrat und Düngegabe unterscheiden.\n\nFehlende Methode, lokale Deutung, Kultur, Feld- und Produktdaten erkennen, die eine allgemeine En Pe Ka-Klasse oder Menge verhindern; X und Y bis zu belastbaren Belegen offenlassen.'), ('Eine Person sieht P im Bodenbericht mit 12 ppm und einen Sack 11-52-0 und behauptet, er erhöhe Boden-P um 52 ppm.\n\nDer ppm-Bodenwert hat Verfahren und Probenbasis; er ist kein Produktprozent.\n\n11-52-0 sind Prozentanteile N, P2O5 und K2O im Dünger, keine direkte Änderung des Boden-P-Testwertes.\n\nEine Menge erfordert kalibrierte Kulturempfehlung, Produktgehalt, Fläche, Ausbringungsverfahren sowie Gutschriften und Grenzen.\n\nBodentest-Einheiten und Düngeranalyse getrennt halten.', 'Eine Person sieht Phosphor im Bodenbericht mit zwölf Teile pro Million und einen Sack elf, zweiundfünfzig, null und behauptet, er erhöhe Boden-Phosphor um zweiundfünfzig Teile pro Million.\n\nDer Teile pro Million-Bodenwert hat Verfahren und Probenbasis; er ist kein Produktprozent.\n\nelf, zweiundfünfzig, null sind Prozentanteile Stickstoff, Pe zwei O fünf und Ka zwei O im Dünger, keine direkte Änderung des Boden-Phosphor-Testwertes.\n\nEine Menge erfordert kalibrierte Kulturempfehlung, Produktgehalt, Fläche, Ausbringungsverfahren sowie Gutschriften und Grenzen.\n\nBodentest-Einheiten und Düngeranalyse getrennt halten.'), ('Extraktionslösung\n\nIm Testverfahren festgelegte Flüssigkeit, die einen definierten Anteil eines Bodenbestandteils für die Messung herauslöst.\n\nFiltrat\n\nFlüssigkeit nach Abtrennung der Partikel aus der Bodensuspension nach dem festgelegten Verfahren.\n\nFarbreaktion\n\nVerfahrensabhängige Reagenzreaktion, deren Farbe mit einer Skala verglichen oder mit passendem Gerät gemessen wird.\n\nppm\n\nTeile pro Million auf der im Bericht genannten Masse- oder Volumenbasis; nach mg/kg Boden, mg/L Lösung oder anderer Grundlage fragen.\n\nInterpretationskalibrierung\n\nVerfahrens- und regionsbezogene Verbindung zwischen Testindex und Kulturreaktion oder Kategorie.\n\nN-P-K-Etikett\n\nDüngerprozente von N, Phosphat als P2O5 und Kali als K2O, nicht die ppm des Bodentests.', 'Extraktionslösung\n\nIm Testverfahren festgelegte Flüssigkeit, die einen definierten Anteil eines Bodenbestandteils für die Messung herauslöst.\n\nFiltrat\n\nFlüssigkeit nach Abtrennung der Partikel aus der Bodensuspension nach dem festgelegten Verfahren.\n\nFarbreaktion\n\nVerfahrensabhängige Reagenzreaktion, deren Farbe mit einer Skala verglichen oder mit passendem Gerät gemessen wird.\n\nTeile pro Million\n\nTeile pro Million auf der im Bericht genannten Masse- oder Volumenbasis; nach Milligramm je Kilogramm Boden, Milligramm je Liter Lösung oder anderer Grundlage fragen.\n\nInterpretationskalibrierung\n\nVerfahrens- und regionsbezogene Verbindung zwischen Testindex und Kulturreaktion oder Kategorie.\n\nStickstoff-Phosphor-Kalium-Etikett\n\nDüngerprozente von Stickstoff, Phosphat als Pe zwei O fünf und Kali als Ka zwei O, nicht die Teile pro Million des Bodentests.'), ('Kann ich eine Probe nach dem angegebenen gebräuchlichen Test vorbereiten und kennzeichnen und dann erklären, was die Lehrkraft zu NPK-Extraktion, Einheiten, Methode, Deutung und fehlenden Belegen vor einer Düngegabe gezeigt hat?\n\nNur Selbstkontrolle', 'Kann ich eine Probe nach dem angegebenen gebräuchlichen Test vorbereiten und kennzeichnen und dann erklären, was die Lehrkraft zu En Pe Ka-Extraktion, Einheiten, Methode, Deutung und fehlenden Belegen vor einer Düngegabe gezeigt hat?\n\nNur Selbstkontrolle'), ('Nur historisches Unterrichtsbeispiel; keine allgemeine Labor- oder Feldempfehlung\n\nDie historische Tabelle nennt weder Extraktion, Region, Kultur, Probenbasis noch vollständige Stufenregeln. Nie als allgemeine Diagnose- oder Düngetabelle verwenden.\n\nParameter\n\nBeispiel niedrig\n\nBeispiel geeignet\n\nBeispiel hoch\n\nBedingte Unterrichtsrichtung\n\npH\n\n< 6.0\n\n6.0–7.5\n\n> 7.5\n\nNiedrig: Kalkbedarf der Kultur prüfen; hoch: Machbarkeit und Chemie vor Ansäuerung prüfen\n\nOrganische Substanz\n\n< 2%\n\n3–6%\n\n> 6%\n\nNiedrig: geeigneten Kompost, Mist oder Zwischenfrüchte prüfen; Prozentsatz hängt von Methode und Ort ab\n\nP\n\n< 15 ppm\n\n20–40 ppm\n\n> 50 ppm\n\nNiedrig: kalibrierte P-Beratung einholen; hoch: P nicht automatisch zusätzlich geben\n\nK\n\n< 100 ppm\n\n120–200 ppm\n\n> 250 ppm\n\nNiedrig: kalibrierte K-Beratung einholen; hoch: K nicht automatisch zusätzlich geben\n\nN\n\n< 10 ppm\n\nstark unterschiedlich\n\nstark unterschiedlich\n\nNach Kulturbedarf, Zeit, Nährstoffgutschriften und örtlicher Methode planen; keine allgemeine Grenze', 'Nur historisches Unterrichtsbeispiel; keine allgemeine Labor- oder Feldempfehlung\n\nDie historische Tabelle nennt weder Extraktion, Region, Kultur, Probenbasis noch vollständige Stufenregeln. Nie als allgemeine Diagnose- oder Düngetabelle verwenden.\n\nParameter\n\nBeispiel niedrig\n\nBeispiel geeignet\n\nBeispiel hoch\n\nBedingte Unterrichtsrichtung\n\nP H\n\nkleiner als  sechs Komma null\n\nsechs Komma null bis sieben Komma fünf\n\ngrößer als  sieben Komma fünf\n\nNiedrig: Kalkbedarf der Kultur prüfen; hoch: Machbarkeit und Chemie vor Ansäuerung prüfen\n\nOrganische Substanz\n\nkleiner als  zwei Prozent\n\ndrei bis sechs Prozent\n\ngrößer als  sechs Prozent\n\nNiedrig: geeigneten Kompost, Mist oder Zwischenfrüchte prüfen; Prozentsatz hängt von Methode und Ort ab\n\nPhosphor\n\nkleiner als  fünfzehn Teile pro Million\n\nzwanzig bis vierzig Teile pro Million\n\ngrößer als  fünfzig Teile pro Million\n\nNiedrig: kalibrierte Phosphor-Beratung einholen; hoch: Phosphor nicht automatisch zusätzlich geben\n\nKalium\n\nkleiner als  einhundert Teile pro Million\n\neinhundertzwanzig bis zweihundert Teile pro Million\n\ngrößer als  zweihundertfünfzig Teile pro Million\n\nNiedrig: kalibrierte Kalium-Beratung einholen; hoch: Kalium nicht automatisch zusätzlich geben\n\nStickstoff\n\nkleiner als  zehn Teile pro Million\n\nstark unterschiedlich\n\nstark unterschiedlich\n\nNach Kulturbedarf, Zeit, Nährstoffgutschriften und örtlicher Methode planen; keine allgemeine Grenze'), ('Ordne zuerst Extraktion, Filtration, Reagenzreaktion und Ablesung. Kennzeichne dann vier Karten als Bodentest-Einheit, Produktetikett, Lehrtabellenklasse oder fehlenden Beleg. Karten: pH 5.5, P 12 ppm, P 18 ppm und 11-52-0. Nenne zu jeder Karte fehlendes Verfahren oder Kulturangaben; die Ausbringungsmengen X/Y bleiben leer.\n\nDie Lehrkraft zeigt tatsächlichen Test samt Handbuch oder ein aufgezeichnetes Laborbeispiel; Lernende erklären beobachtete Reihenfolge und Deutung. Keine eigene Reagenzhandhabung oder selbstständige Gerätefreigabe.', 'Ordne zuerst Extraktion, Filtration, Reagenzreaktion und Ablesung. Kennzeichne dann vier Karten als Bodentest-Einheit, Produktetikett, Lehrtabellenklasse oder fehlenden Beleg. Karten: P H fünf Komma fünf, Phosphor zwölf Teile pro Million, Phosphor achtzehn Teile pro Million und elf, zweiundfünfzig, null. Nenne zu jeder Karte fehlendes Verfahren oder Kulturangaben; die Ausbringungsmengen X/Y bleiben leer.\n\nDie Lehrkraft zeigt tatsächlichen Test samt Handbuch oder ein aufgezeichnetes Laborbeispiel; Lernende erklären beobachtete Reihenfolge und Deutung. Keine eigene Reagenzhandhabung oder selbstständige Gerätefreigabe.'), ('mit zwölf Teile pro Million', 'mit zwölf Teilen pro Million'), ('sämtliches Phosphor', 'sämtlichen Phosphor')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s209-remainder-audio-20261023-r1'
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
    assert count < 9, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 36,'maximumCallsForLane':9,
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
    assert all(v<=9 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':9,'maximumBlindReviewPerLane':9,'maximumASRPerLane':9,'maximumTTSAggregate':36,'maximumBlindAggregate':36,'maximumASRAggregate':36,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
