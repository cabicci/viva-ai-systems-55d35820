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
IDS = ('S2-06-ar-EG-opening-r1', 'S2-06-ar-EG-E01-r1', 'S2-06-ar-EG-E02-r1', 'S2-06-ar-EG-E03-r1', 'S2-06-ar-EG-guided-practice-r1', 'S2-06-ar-EG-reflection-r1', 'S2-06-ar-EG-comparison-r1', 'S2-06-ar-EG-glossary-r1', 'S2-06-en-opening-r1', 'S2-06-en-E01-r1', 'S2-06-en-E02-r1', 'S2-06-en-E03-r1', 'S2-06-en-guided-practice-r1', 'S2-06-en-reflection-r1', 'S2-06-en-comparison-r1', 'S2-06-en-glossary-r1', 'S2-06-it-opening-r1', 'S2-06-it-E01-r1', 'S2-06-it-E02-r1', 'S2-06-it-E03-r1', 'S2-06-it-guided-practice-r1', 'S2-06-it-reflection-r1', 'S2-06-it-comparison-r1', 'S2-06-it-glossary-r1', 'S2-06-de-opening-r1', 'S2-06-de-E01-r1', 'S2-06-de-E02-r1', 'S2-06-de-E03-r1', 'S2-06-de-guided-practice-r1', 'S2-06-de-reflection-r1', 'S2-06-de-comparison-r1', 'S2-06-de-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==32
    assert(req['scope'],req['stepId'])==('S206_THIRTY_TWO_CORE_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-06')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_8_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s206-remainder-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==32
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTargetCompleteIdentitiesCheckedAgainstPriorRequests']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(8))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening','E01','E02','E03','guided-practice','reflection','comparison','glossary']
        voice='Charon'if group in['E01','E03','reflection','glossary','knowledge-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'opening':('/intro','/goals/'),'E01':('/examples/0/',),'E02':('/examples/1/',),'E03':('/examples/2/',),'guided-practice':('/guidedPractice/prompt','/guidedPractice/learnerActions/','/guidedPractice/practicalBoundary'),'reflection':('/selfReflection/','/reflectionItems/'),'comparison':('/comparisonLabel','/comparison/'),'glossary':('/glossary/',),'model-and-workbook-guidance':('/phPractice/ui/','/studentDownloads/0/title'),'knowledge-completion':('/phPractice/passChecks/',)}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('اختار عينة معلّمة ومقارن pH Rapitest 1601، وبعدين رتّب تمن حركات: راجع البطاقة ونشرة السلامة والجدول؛ تربة لعلامتها؛ كبسولة pH المطابقة؛ ماء لعلامته؛ اقفل ورُجّ؛ انتظر الترسيب واللون؛ قارن السائل فوق التربة بجدوله في ضوء نهار غير مباشر؛ سجّل ونظف حسب إجراء الموقع. ارفض جدول NPK أو كمية كاشف عشوائية أو قراءة عشرية مختلقة.\n\nالمدرّب يختار العدة الفعلية ويتأكد من دليلها ونشرة كاشفها، ويقيس A/B/C بنفسه قبل التدريب. كل طالب يقيس تحت ملاحظة فردية ويسجل النتيجة الحقيقية وعدم اليقين وينظف ويتخلص من المخلفات بأمان. أدوار الكاتب والمحلل تتبدل، لكن قياس طالب ما ينجّحش طالب تاني.', 'اختار عينة معلّمة ومقارن بي إتش Rapitest واحد ستة صفر واحد، وبعدين رتّب تمن حركات: راجع البطاقة ونشرة السلامة والجدول؛ تربة لعلامتها؛ كبسولة بي إتش المطابقة؛ ماء لعلامته؛ اقفل ورُجّ؛ انتظر الترسيب واللون؛ قارن السائل فوق التربة بجدوله في ضوء نهار غير مباشر؛ سجّل ونظف حسب إجراء الموقع. ارفض جدول إن بي كي أو كمية كاشف عشوائية أو قراءة عشرية مختلقة.\n\nالمدرّب يختار العدة الفعلية ويتأكد من دليلها ونشرة كاشفها، ويقيس إيه/بي/سي بنفسه قبل التدريب. كل طالب يقيس تحت ملاحظة فردية ويسجل النتيجة الحقيقية وعدم اليقين وينظف ويتخلص من المخلفات بأمان. أدوار الكاتب والمحلل تتبدل، لكن قياس طالب ما ينجّحش طالب تاني.'), ('تطبيقًا عمليًا', 'تطبيق عملي'), ('تنتظر وقت الترسيب وظهور اللون المطلوب فعلًا', 'تستنى وقت الترسيب وظهور اللون المطلوب فعلاً'), ('تُستخدم', 'بتتستخدم'), ('ثماني حركات', 'تمن حركات'), ('جهازًا رقميًا', 'جهاز رقمي'), ('طالب حط محلول اختبار pH البنفسجي جنب جدول مستعار من عدة NPK مختلفة.\n\nوقف: الجدول ممكن يخص مؤشرًا وتغيّر لون مختلفين، فالشكل ده مش قراءة pH صحيحة.\n\nهات جدول المقارن الخاص بعدة pH نفسها وقارن سائلها في إضاءة مناسبة.\n\nلو مفيش جدول أو دليل مطابق، سجّل إنها غير مُقيّمة واستخدم عدة موثّقة أو معمل.\n\nاللون معناه جوه طريقته وجدوله فقط.', 'طالب حط محلول اختبار بي إتش البنفسجي جنب جدول مستعار من عدة إن بي كي مختلفة.\n\nوقف: الجدول ممكن يخص مؤشرًا وتغيّر لون مختلفين، فالشكل ده مش قراءة بي إتش صحيحة.\n\nهات جدول المقارن الخاص بعدة بي إتش نفسها وقارن سائلها في إضاءة مناسبة.\n\nلو مفيش جدول أو دليل مطابق، سجّل إنها غير مُقيّمة واستخدم عدة موثّقة أو معمل.\n\nاللون معناه جوه طريقته وجدوله فقط.'), ('طالبًا تانيًا', 'طالب تاني'), ('عاليًا', 'عالي'), ('قياس لوني\n\nطريقة تقارن لون ظهر أثناء التفاعل بجدول مرجعي خاص بنفس الطريقة.\n\nمقارن الألوان\n\nحجرة العدة وجدول الألوان المطابق اللي بنقدّر بيهم نتيجة الاختبار.\n\nكاشف\n\nمادة اختبار بتتستخدم حسب بطاقتها ونشرة سلامتها وتعليمات الشركة.\n\nدقة التدريج\n\nأصغر فرق pH يقدر الجدول أو الجهاز يميّزه؛ ما تخترعش قراءة أدق.\n\nمعايرة\n\nفحص وضبط الجهاز الرقمي بمحاليل منظمة معروفة حسب طريقته.', 'قياس لوني\n\nطريقة تقارن لون ظهر أثناء التفاعل بجدول مرجعي خاص بنفس الطريقة.\n\nمقارن الألوان\n\nحجرة العدة وجدول الألوان المطابق اللي بنقدّر بيهم نتيجة الاختبار.\n\nكاشف\n\nمادة اختبار بتتستخدم حسب بطاقتها ونشرة سلامتها وتعليمات الشركة.\n\nدقة التدريج\n\nأصغر فرق بي إتش يقدر الجدول أو الجهاز يميّزه؛ ما تخترعش قراءة أدق.\n\nمعايرة\n\nفحص وضبط الجهاز الرقمي بمحاليل منظمة معروفة حسب طريقته.'), ('لـpH', 'لبي إتش'), ('لون المحلول لوحده مش نتيجة pH. لازم نعرف العينة والعدة والكاشف وجدول الألوان اللي طلع منه اللون. هتتدرّب على تسلسل عدة موثّقة، وبعدها تطبّقه على العدة الموجودة فعلًا تحت إشراف المدرّب.\n\nتحت ملاحظة المدرّب، تحدد العدة الفعلية ودليلها، وتقيس التربة والكاشف والماء حسب علاماتها، وتقفل وتخلط كما هو محدد، وتستنى وقت الترسيب وظهور اللون المطلوب فعلاً.\n\nتقارن السائل الصافي فقط بجدول الألوان الخاص بنفس عدة pH وفي إضاءة مناسبة، وتسجل أقرب قيمة يدعمها الجدول أو مداها ودرجة عدم اليقين، وتحافظ على هوية العينة والعدة.\n\nتختار معدات الوقاية المناسبة ونشرة سلامة الكاشف، وتنظف الأدوات وتتخلص من المخلفات وفق نظام الموقع، وتشرح إمتى تكفي عدة الحقل اللونية وإمتى تحتاج جهاز رقمي مُعاير أو معمل.', 'لون المحلول لوحده مش نتيجة بي إتش. لازم نعرف العينة والعدة والكاشف وجدول الألوان اللي طلع منه اللون. هتتدرّب على تسلسل عدة موثّقة، وبعدها تطبّقه على العدة الموجودة فعلًا تحت إشراف المدرّب.\n\nتحت ملاحظة المدرّب، تحدد العدة الفعلية ودليلها، وتقيس التربة والكاشف والماء حسب علاماتها، وتقفل وتخلط كما هو محدد، وتستنى وقت الترسيب وظهور اللون المطلوب فعلاً.\n\nتقارن السائل الصافي فقط بجدول الألوان الخاص بنفس عدة بي إتش وفي إضاءة مناسبة، وتسجل أقرب قيمة يدعمها الجدول أو مداها ودرجة عدم اليقين، وتحافظ على هوية العينة والعدة.\n\nتختار معدات الوقاية المناسبة ونشرة سلامة الكاشف، وتنظف الأدوات وتتخلص من المخلفات وفق نظام الموقع، وتشرح إمتى تكفي عدة الحقل اللونية وإمتى تحتاج جهاز رقمي مُعاير أو معمل.'), ('لونًا', 'لون'), ('محصول صويا نموه ضعيف وأوراقه صفراء، والمزارع بيسأل هل pH التربة هو السبب.\n\nافحص مكان الأعراض والجذور والرطوبة ونمط الحقل؛ وخد عينة ممثلة حسب بروتوكول المحصول.\n\nاعمل فحص pH أولي بعدة لونية بجدولها أو جهاز رقمي مُعاير، وابعت عينة مناسبة للمعمل لتأكيد النتيجة وتفسير التربة والعناصر لو هتتخذ قرار إدارة.\n\nلو التربة حمضية بدرجة مؤثرة، ممكن نفكر في الجير بعد توصية مناسبة للتربة والمحصول؛ ولو pH عالي، استراتيجية خفضه أو إدارة أخرى تتحدد حسب التربة والمحصول. المنتج والجرعة والوقت يحتاجوا إرشادًا من الاختبار المحلي؛ الاصفرار وحده ما يثبتش أي حالة.\n\nقِس وشخّص أولًا؛ ما توصي بتعديل للمحصول إلا بدليل.', 'محصول صويا نموه ضعيف وأوراقه صفراء، والمزارع بيسأل هل بي إتش التربة هو السبب.\n\nافحص مكان الأعراض والجذور والرطوبة ونمط الحقل؛ وخد عينة ممثلة حسب بروتوكول المحصول.\n\nاعمل فحص بي إتش أولي بعدة لونية بجدولها أو جهاز رقمي مُعاير، وابعت عينة مناسبة للمعمل لتأكيد النتيجة وتفسير التربة والعناصر لو هتتخذ قرار إدارة.\n\nلو التربة حمضية بدرجة مؤثرة، ممكن نفكر في الجير بعد توصية مناسبة للتربة والمحصول؛ ولو بي إتش عالي، استراتيجية خفضه أو إدارة أخرى تتحدد حسب التربة والمحصول. المنتج والجرعة والوقت يحتاجوا إرشادًا من الاختبار المحلي؛ الاصفرار وحده ما يثبتش أي حالة.\n\nقِس وشخّص أولًا؛ ما توصي بتعديل للمحصول إلا بدليل.'), ('معملًا', 'معمل'), ('مفتاح الأصل متوقع للعينة A نحو 5.5، لكن عينة الصف المجهزة طلعت أقرب لبي إتش 6 على جدول العدة.\n\nسجل القيمة الحقيقية للصف أو مداها ودقة تدريج العدة؛ ما تبدّلهاش بـ5.5.\n\nالمدرّب يراجع التجهيز وممكن يؤكد بطريقة مُعايرة، وبعدها يعدّل مفتاح النشاط الخاص.\n\nفسّر النتيجة المقاسة للمحصول المطلوب، مش الرقم المستهدف المطبوع في الورقة.\n\nالرقم النموذجي ما يحلّش محل دليل القياس.', 'مفتاح الأصل متوقع للعينة إيه نحو خمسة فاصلة خمسة، لكن عينة الصف المجهزة طلعت أقرب لبي إتش ستة على جدول العدة.\n\nسجل القيمة الحقيقية للصف أو مداها ودقة تدريج العدة؛ ما تبدّلهاش بخمسة فاصلة خمسة.\n\nالمدرّب يراجع التجهيز وممكن يؤكد بطريقة مُعايرة، وبعدها يعدّل مفتاح النشاط الخاص.\n\nفسّر النتيجة المقاسة للمحصول المطلوب، مش الرقم المستهدف المطبوع في الورقة.\n\nالرقم النموذجي ما يحلّش محل دليل القياس.'), ('مُعايرًا', 'مُعاير'), ('وقتًا', 'وقت'), ('٥. تختار عدة حقل ولا جهاز رقمي ولا معمل؟\n\nالطريقة\n\nإيه فايدتها؟\n\nحدودها والخطوة التالية\n\nعدة حقل لونية\n\nتقدير سريع ومتنقل بجدولها المطابق\n\nتدريج الألوان محدود، والقراءة بتعتمد على تمييز الشخص للون؛ راعي مدى العدة وعدم اليقين.\n\nجهاز pH رقمي\n\nرقم بعد المعايرة واستقرار القراءة\n\nاتبع طريقة الجهاز لتحضير التربة أو معلّق التربة، وافحص محاليل المعايرة المنظمة حسب الدليل.\n\nمعمل متخصص\n\nقياس pH بطريقة مضبوطة، وممكن كمان يوفّر تفسير أوسع لحالة التربة\n\nيحتاج عينة ممثلة وطريقة تسليم مناسبة ووقت', 'خمسة. تختار عدة حقل ولا جهاز رقمي ولا معمل؟\n\nالطريقة\n\nإيه فايدتها؟\n\nحدودها والخطوة التالية\n\nعدة حقل لونية\n\nتقدير سريع ومتنقل بجدولها المطابق\n\nتدريج الألوان محدود، والقراءة بتعتمد على تمييز الشخص للون؛ راعي مدى العدة وعدم اليقين.\n\nجهاز بي إتش رقمي\n\nرقم بعد المعايرة واستقرار القراءة\n\nاتبع طريقة الجهاز لتحضير التربة أو معلّق التربة، وافحص محاليل المعايرة المنظمة حسب الدليل.\n\nمعمل متخصص\n\nقياس بي إتش بطريقة مضبوطة، وممكن كمان يوفّر تفسير أوسع لحالة التربة\n\nيحتاج عينة ممثلة وطريقة تسليم مناسبة ووقت')], 'en': [("5. Choose field colour, digital meter or laboratory test\n\nMethod\n\nUseful strength\n\nLimit and next check\n\nColour field kit\n\nQuick portable estimate with its matched chart\n\nLimited chart resolution and visual colour judgement; respect range and uncertainty\n\nDigital pH meter\n\nNumerical reading after calibration and stabilization\n\nMust follow meter's soil/slurry protocol and buffer checks\n\nProfessional laboratory\n\npH measurement by a controlled method, with possible broader soil interpretation\n\nRequires representative sample, method-specific submission and turnaround", "five. Choose field colour, digital meter or laboratory test\n\nMethod\n\nUseful strength\n\nLimit and next check\n\nColour field kit\n\nQuick portable estimate with its matched chart\n\nLimited chart resolution and visual colour judgement; respect range and uncertainty\n\nDigital P H meter\n\nNumerical reading after calibration and stabilization\n\nMust follow meter's soil/slurry protocol and buffer checks\n\nProfessional laboratory\n\nP H measurement by a controlled method, with possible broader soil interpretation\n\nRequires representative sample, method-specific submission and turnaround"), ("A coloured solution is not a pH result until you know which sample, kit, reagent and chart produced it. In this step you practise the full sequence on one documented field kit, then learn how to transfer the method to the actual kit in a trainer-supervised laboratory.\n\nUnder trainer observation, identify the actual kit and its manual, measure sample, reagent and water to its markings, close and mix as specified, and wait for the required settling and colour-development condition.\n\nCompare the clear liquid only with the colour chart supplied for the same pH comparator under suitable light, record the closest supported pH or chart interval and uncertainty, and preserve sample and kit identity.\n\nSelect task-appropriate PPE and the reagent's SDS, clean equipment and dispose of waste per site rule, and explain when a field colour kit is enough and when calibrated digital or laboratory measurement is needed.", "A coloured solution is not a P H result until you know which sample, kit, reagent and chart produced it. In this step you practise the full sequence on one documented field kit, then learn how to transfer the method to the actual kit in a trainer-supervised laboratory.\n\nUnder trainer observation, identify the actual kit and its manual, measure sample, reagent and water to its markings, close and mix as specified, and wait for the required settling and colour-development condition.\n\nCompare the clear liquid only with the colour chart supplied for the same P H comparator under suitable light, record the closest supported P H or chart interval and uncertainty, and preserve sample and kit identity.\n\nSelect task-appropriate P P E and the reagent's S D S, clean equipment and dispose of waste per site rule, and explain when a field colour kit is enough and when calibrated digital or laboratory measurement is needed."), ('A soybean crop is stunted and yellow, and the grower asks whether soil pH is the problem.\n\nInspect where symptoms occur and check roots, moisture and field pattern; collect a representative sample using the relevant crop protocol.\n\nUse a matched colour kit or calibrated digital meter for initial pH, and send an appropriate sample for laboratory confirmation and nutrient and soil interpretation if management is contemplated.\n\nIf the soil is sufficiently acidic, liming might be considered; if high-pH, a crop and soil specific acidification or other management strategy might be considered. A product, dose and timing require local test guidance; yellowing alone proves neither case.\n\nMeasure and diagnose first; recommend a crop-specific adjustment only with supporting evidence.', 'A soybean crop is stunted and yellow, and the grower asks whether soil P H is the problem.\n\nInspect where symptoms occur and check roots, moisture and field pattern; collect a representative sample using the relevant crop protocol.\n\nUse a matched colour kit or calibrated digital meter for initial P H, and send an appropriate sample for laboratory confirmation and nutrient and soil interpretation if management is contemplated.\n\nIf the soil is sufficiently acidic, liming might be considered; if high-P H, a crop and soil specific acidification or other management strategy might be considered. A product, dose and timing require local test guidance; yellowing alone proves neither case.\n\nMeasure and diagnose first; recommend a crop-specific adjustment only with supporting evidence.'), ('A student holds a violet pH solution beside a chart borrowed from an unrelated NPK kit.\n\nStop: the chart may use a different indicator and colour response, so the appearance is not a valid pH reading.\n\nFind the chart supplied with the exact pH comparator and compare its liquid in suitable light.\n\nIf no matching chart or manual exists, mark unassessed and use a documented kit or laboratory.\n\nA colour has meaning only inside its own method.', 'A student holds a violet P H solution beside a chart borrowed from an unrelated N P K kit.\n\nStop: the chart may use a different indicator and colour response, so the appearance is not a valid P H reading.\n\nFind the chart supplied with the exact P H comparator and compare its liquid in suitable light.\n\nIf no matching chart or manual exists, mark unassessed and use a documented kit or laboratory.\n\nA colour has meaning only inside its own method.'), ("Choose a labelled sample and the Rapitest 1601 pH comparator, then place the eight actions in order: check label/SDS and chart; add soil to its line; add the matching pH capsule; add water to its line; cap/shake; wait for settling/colour; compare above-soil liquid with its chart in diffuse daylight; record result and clean by site procedure. Reject an NPK chart, arbitrary reagent amount or invented precise reading.\n\nTrainer selects the actual kit, verifies manual/SDS and pretests samples A/B/C. Each learner measures under observation, records actual result and uncertainty, cleans and disposes safely. Group recorder/analyst roles rotate, but one learner's test does not pass another.", "Choose a labelled sample and the Rapitest one six zero one P H comparator, then place the eight actions in order: check label/S D S and chart; add soil to its line; add the matching P H capsule; add water to its line; cap/shake; wait for settling/colour; compare above-soil liquid with its chart in diffuse daylight; record result and clean by site procedure. Reject an N P K chart, arbitrary reagent amount or invented precise reading.\n\nTrainer selects the actual kit, verifies manual/S D S and pretests samples A/B/C. Each learner measures under observation, records actual result and uncertainty, cleans and disposes safely. Group recorder/analyst roles rotate, but one learner's test does not pass another."), ("The source key expects A around 5.5, but the class's prepared Sample A reads nearest pH 6 on its kit chart.\n\nRecord the class's actual value or interval and the kit resolution; do not overwrite it with 5.5.\n\nThe trainer checks the preparation and may confirm with a calibrated method, then updates the private activity key.\n\nInterpret the measured result for the intended crop, not the target number on a worksheet.\n\nModel examples never replace measured evidence.", "The source key expects A around five point five, but the class's prepared Sample A reads nearest P H six on its kit chart.\n\nRecord the class's actual value or interval and the kit resolution; do not overwrite it with five point five.\n\nThe trainer checks the preparation and may confirm with a calibrated method, then updates the private activity key.\n\nInterpret the measured result for the intended crop, not the target number on a worksheet.\n\nModel examples never replace measured evidence."), ("colorimetric\n\nA method that compares a developed colour with a method-specific reference chart.\n\ncomparator\n\nThe kit's chamber and matched colour chart used to judge a test result.\n\nreagent\n\nA test chemical used according to its own label, SDS and manufacturer procedure.\n\nresolution\n\nThe smallest pH difference supported by a chart or device; do not invent finer readings.\n\ncalibration\n\nChecking and adjusting a digital meter against known buffer standards according to its method.", "colorimetric\n\nA method that compares a developed colour with a method-specific reference chart.\n\ncomparator\n\nThe kit's chamber and matched colour chart used to judge a test result.\n\nreagent\n\nA test chemical used according to its own label, S D S and manufacturer procedure.\n\nresolution\n\nThe smallest P H difference supported by a chart or device; do not invent finer readings.\n\ncalibration\n\nChecking and adjusting a digital meter against known buffer standards according to its method."), ('crop/soil-specific', 'crop and soil specific'), ('digital/laboratory', 'digital or laboratory'), ('nutrient/soil interpretation', 'nutrient and soil interpretation')], 'it': [('5. Kit da campo, pH-metro o laboratorio?\n\nMetodo\n\nPunto utile\n\nLimite e controllo successivo\n\nKit colorimetrico da campo\n\nStima rapida e portatile con scala corrispondente\n\nTacche limitate e giudizio del colore; rispettare intervallo e incertezza\n\npH-metro digitale\n\nNumero dopo calibrazione e stabilizzazione\n\nSeguire metodo della sospensione e controlli con soluzioni tampone\n\nLaboratorio professionale\n\nMisura del pH con un metodo controllato ed eventuale interpretazione più ampia del suolo\n\nServono campione rappresentativo, consegna adatta e tempo', 'cinque. Kit da campo, P H-metro o laboratorio?\n\nMetodo\n\nPunto utile\n\nLimite e controllo successivo\n\nKit colorimetrico da campo\n\nStima rapida e portatile con scala corrispondente\n\nTacche limitate e giudizio del colore; rispettare intervallo e incertezza\n\nP H-metro digitale\n\nNumero dopo calibrazione e stabilizzazione\n\nSeguire metodo della sospensione e controlli con soluzioni tampone\n\nLaboratorio professionale\n\nMisura del P H con un metodo controllato ed eventuale interpretazione più ampia del suolo\n\nServono campione rappresentativo, consegna adatta e tempo'), ('Colorimetrico\n\nMetodo che confronta il colore sviluppato con una scala specifica del procedimento.\n\nComparatore\n\nCamera del kit e scala corrispondente usate per giudicare il risultato.\n\nReagente\n\nSostanza di prova usata secondo etichetta, SDS e procedura del produttore.\n\nRisoluzione\n\nPiù piccola differenza pH leggibile da scala o strumento; non inventare cifre più fini.\n\nCalibrazione\n\nVerifica e regolazione del pH-metro con soluzioni tampone note secondo il metodo.', 'Colorimetrico\n\nMetodo che confronta il colore sviluppato con una scala specifica del procedimento.\n\nComparatore\n\nCamera del kit e scala corrispondente usate per giudicare il risultato.\n\nReagente\n\nSostanza di prova usata secondo etichetta, S D S e procedura del produttore.\n\nRisoluzione\n\nPiù piccola differenza P H leggibile da scala o strumento; non inventare cifre più fini.\n\nCalibrazione\n\nVerifica e regolazione del P H-metro con soluzioni tampone note secondo il metodo.'), ("La chiave della fonte attende A vicino a 5.5, ma A preparato in classe dà il colore più vicino a pH 6.\n\nRegistra valore o intervallo reali e risoluzione del kit; non sostituirli con 5.5.\n\nIl formatore controlla la preparazione, può confermare con metodo calibrato e aggiorna la chiave privata.\n\nInterpreta la misura per la coltura prevista, non il numero obiettivo del foglio.\n\nL'esempio modello non sostituisce la misura.", "La chiave della fonte attende A vicino a cinque virgola cinque, ma A preparato in classe dà il colore più vicino a P H sei.\n\nRegistra valore o intervallo reali e risoluzione del kit; non sostituirli con cinque virgola cinque.\n\nIl formatore controlla la preparazione, può confermare con metodo calibrato e aggiorna la chiave privata.\n\nInterpreta la misura per la coltura prevista, non il numero obiettivo del foglio.\n\nL'esempio modello non sostituisce la misura."), ("La soia cresce poco e ingiallisce; il coltivatore chiede se sia colpa del pH.\n\nControlla posizione dei sintomi, radici, umidità e andamento nel campo; preleva campione rappresentativo secondo il protocollo della coltura.\n\nMisura inizialmente con kit e scala corrispondenti o pH-metro calibrato; se si pensa a una gestione correttiva, invia campione adeguato al laboratorio per conferma e interpretazione.\n\nSe il suolo è sufficientemente acido, si può valutare calce con una raccomandazione per suolo e coltura; se il pH è alto, acidificazione o altra gestione dipendono dal contesto. Prodotto, dose e tempo richiedono indicazioni locali: l'ingiallimento da solo non prova nessuno dei due casi.\n\nMisura e diagnostica prima; proponi correzioni colturali solo con prove.", "La soia cresce poco e ingiallisce; il coltivatore chiede se sia colpa del P H.\n\nControlla posizione dei sintomi, radici, umidità e andamento nel campo; preleva campione rappresentativo secondo il protocollo della coltura.\n\nMisura inizialmente con kit e scala corrispondenti o P H-metro calibrato; se si pensa a una gestione correttiva, invia campione adeguato al laboratorio per conferma e interpretazione.\n\nSe il suolo è sufficientemente acido, si può valutare calce con una raccomandazione per suolo e coltura; se il P H è alto, acidificazione o altra gestione dipendono dal contesto. Prodotto, dose e tempo richiedono indicazioni locali: l'ingiallimento da solo non prova nessuno dei due casi.\n\nMisura e diagnostica prima; proponi correzioni colturali solo con prove."), ("Scegli campione etichettato e comparatore pH Rapitest 1601, poi ordina otto azioni: controlla etichetta/SDS/scala; terra alla sua tacca; capsula pH corrispondente; acqua alla sua tacca; chiudi e agita; attendi sedimentazione/colore; confronta liquido sovrastante con la scala in luce diffusa; registra e pulisci secondo il sito. Rifiuta scala NPK, quantità arbitraria o decimali inventati.\n\nIl formatore sceglie il kit reale, verifica manuale/SDS e prova A/B/C in anticipo. Ogni allievo misura sotto osservazione, registra risultato e incertezza, pulisce e smaltisce in sicurezza. I ruoli di scrivente e analista ruotano, ma la prova di uno non promuove l'altro.", "Scegli campione etichettato e comparatore P H Rapitest uno sei zero uno, poi ordina otto azioni: controlla etichetta/S D S/scala; terra alla sua tacca; capsula P H corrispondente; acqua alla sua tacca; chiudi e agita; attendi sedimentazione/colore; confronta liquido sovrastante con la scala in luce diffusa; registra e pulisci secondo il sito. Rifiuta scala N P K, quantità arbitraria o decimali inventati.\n\nIl formatore sceglie il kit reale, verifica manuale/S D S e prova A/B/C in anticipo. Ogni allievo misura sotto osservazione, registra risultato e incertezza, pulisce e smaltisce in sicurezza. I ruoli di scrivente e analista ruotano, ma la prova di uno non promuove l'altro."), ("Un allievo accosta una soluzione pH viola alla scala presa da un kit NPK non collegato.\n\nFermati: l'indicatore e la risposta cromatica possono essere diversi, quindi l'aspetto non è un valore pH valido.\n\nTrova la scala fornita con quel comparatore pH e confronta il suo liquido con luce idonea.\n\nSe non ci sono scala o manuale corrispondenti, segna non valutato e usa kit documentato o laboratorio.\n\nIl colore ha significato solo nel suo metodo.", "Un allievo accosta una soluzione P H viola alla scala presa da un kit N P K non collegato.\n\nFermati: l'indicatore e la risposta cromatica possono essere diversi, quindi l'aspetto non è un valore P H valido.\n\nTrova la scala fornita con quel comparatore P H e confronta il suo liquido con luce idonea.\n\nSe non ci sono scala o manuale corrispondenti, segna non valutato e usa kit documentato o laboratorio.\n\nIl colore ha significato solo nel suo metodo."), ("Una soluzione colorata non è un risultato di pH finché non sai quale campione, kit, reagente e scala cromatica l'hanno prodotta. In questa tappa provi la sequenza con un kit documentato e impari a trasferirla al kit reale sotto la supervisione del formatore.\n\nSotto osservazione del formatore, identifica kit e manuale reali, dosa terra, reagente e acqua fino alle rispettive tacche, chiudi e mescola come previsto e attendi davvero le condizioni di sedimentazione e sviluppo del colore.\n\nConfronta solo il liquido limpido con la scala dello stesso comparatore pH in luce adatta; registra il valore o intervallo sostenuto dalla scala e l'incertezza, preservando l'identità di campione e kit.\n\nScegli DPI idonei e consulta la SDS del reagente, pulisci e smaltisci secondo il sito, poi spiega quando basta un kit colorimetrico da campo e quando servono pH-metro calibrato o laboratorio.", "Una soluzione colorata non è un risultato di P H finché non sai quale campione, kit, reagente e scala cromatica l'hanno prodotta. In questa tappa provi la sequenza con un kit documentato e impari a trasferirla al kit reale sotto la supervisione del formatore.\n\nSotto osservazione del formatore, identifica kit e manuale reali, dosa terra, reagente e acqua fino alle rispettive tacche, chiudi e mescola come previsto e attendi davvero le condizioni di sedimentazione e sviluppo del colore.\n\nConfronta solo il liquido limpido con la scala dello stesso comparatore P H in luce adatta; registra il valore o intervallo sostenuto dalla scala e l'incertezza, preservando l'identità di campione e kit.\n\nScegli D P I idonei e consulta la S D S del reagente, pulisci e smaltisci secondo il sito, poi spiega quando basta un kit colorimetrico da campo e quando servono P H-metro calibrato o laboratorio.")], 'de': [('5. Farbtest, Digitalgerät oder Labor wählen\n\nMethode\n\nNützliche Stärke\n\nGrenze und nächster Schritt\n\nFarbtest für das Feld\n\nSchnelle tragbare Schätzung mit passender Skala\n\nBegrenzte Stufen und Farbempfinden; Bereich und Unsicherheit beachten\n\nDigitales pH-Meter\n\nZahl nach Kalibrierung und stabilem Messwert\n\nGeräteverfahren für Bodensuspension und Pufferprüfung beachten\n\nFachlabor\n\npH-Messung mit kontrolliertem Verfahren und gegebenenfalls breitere Bodeninterpretation\n\nRepräsentative Probe, verfahrensgerechte Einsendung und Zeit nötig', 'fünf. Farbtest, Digitalgerät oder Labor wählen\n\nMethode\n\nNützliche Stärke\n\nGrenze und nächster Schritt\n\nFarbtest für das Feld\n\nSchnelle tragbare Schätzung mit passender Skala\n\nBegrenzte Stufen und Farbempfinden; Bereich und Unsicherheit beachten\n\nDigitales P H-Meter\n\nZahl nach Kalibrierung und stabilem Messwert\n\nGeräteverfahren für Bodensuspension und Pufferprüfung beachten\n\nFachlabor\n\nP H-Messung mit kontrolliertem Verfahren und gegebenenfalls breitere Bodeninterpretation\n\nRepräsentative Probe, verfahrensgerechte Einsendung und Zeit nötig'), ('Die Quelllösung erwartet A nahe 5.5, doch die vorbereitete Klassenprobe liegt am nächsten bei pH 6.\n\nNotiere den tatsächlichen Wert oder Bereich und die Auflösung; überschreibe ihn nicht mit 5.5.\n\nDie Lehrkraft prüft die Vorbereitung, kann kalibriert gegenmessen und passt den privaten Lösungsschlüssel an.\n\nDeute den Messwert für die vorgesehene Kultur, nicht die Zielzahl auf dem Blatt.\n\nModellzahlen ersetzen keine Messdaten.', 'Die Quelllösung erwartet A nahe fünf Komma fünf, doch die vorbereitete Klassenprobe liegt am nächsten bei P H sechs.\n\nNotiere den tatsächlichen Wert oder Bereich und die Auflösung; überschreibe ihn nicht mit fünf Komma fünf.\n\nDie Lehrkraft prüft die Vorbereitung, kann kalibriert gegenmessen und passt den privaten Lösungsschlüssel an.\n\nDeute den Messwert für die vorgesehene Kultur, nicht die Zielzahl auf dem Blatt.\n\nModellzahlen ersetzen keine Messdaten.'), ('Die Sojapflanzen sind klein und gelb; der Betrieb fragt, ob Boden-pH die Ursache sei.\n\nPrüfe Symptomort, Wurzeln, Feuchtigkeit und Feldmuster und entnimm nach Kulturverfahren eine repräsentative Probe.\n\nMiss zunächst mit passendem Farbset oder kalibriertem Digitalgerät; bei geplanter Maßnahme lass eine geeignete Probe im Labor bestätigen und Boden/Nährstoffe deuten.\n\nBei deutlich saurem Boden kann Kalk nach standort- und kulturbezogener Empfehlung erwogen werden; bei hohem pH hängen Ansäuerung oder andere Maßnahmen vom Boden und der Kultur ab. Produkt, Dosis und Zeitpunkt brauchen lokale Messgrundlage; Gelbfärbung allein beweist beides nicht.\n\nErst messen und diagnostizieren, dann eine gestützte Kulturmaßnahme empfehlen.', 'Die Sojapflanzen sind klein und gelb; der Betrieb fragt, ob Boden-P H die Ursache sei.\n\nPrüfe Symptomort, Wurzeln, Feuchtigkeit und Feldmuster und entnimm nach Kulturverfahren eine repräsentative Probe.\n\nMiss zunächst mit passendem Farbset oder kalibriertem Digitalgerät; bei geplanter Maßnahme lass eine geeignete Probe im Labor bestätigen und Boden/Nährstoffe deuten.\n\nBei deutlich saurem Boden kann Kalk nach standort- und kulturbezogener Empfehlung erwogen werden; bei hohem P H hängen Ansäuerung oder andere Maßnahmen vom Boden und der Kultur ab. Produkt, Dosis und Zeitpunkt brauchen lokale Messgrundlage; Gelbfärbung allein beweist beides nicht.\n\nErst messen und diagnostizieren, dann eine gestützte Kulturmaßnahme empfehlen.'), ('Eine gefärbte Lösung ist erst dann ein pH-Ergebnis, wenn Probe, Testset, Reagenz und Farbskala bekannt sind. Du übst die vollständige Folge an einem dokumentierten Set und überträgst die Methode dann unter Aufsicht auf das tatsächlich vorhandene Gerät.\n\nUnter Beobachtung der Lehrkraft erkennst du das tatsächliche Set und Handbuch, dosierst Boden, Reagenz und Wasser an den vorgesehenen Markierungen, verschließt und mischst wie vorgeschrieben und wartest die nötige Absetz- und Farbentwicklungszeit wirklich ab.\n\nDu vergleichst nur die klare Flüssigkeit mit der Farbskala desselben pH-Komparators bei passendem Licht, notierst den gestützten Wert oder Bereich samt Unsicherheit und hältst Proben- und Setidentität fest.\n\nDu wählst geeignete Schutzausrüstung und das SDS des Reagenzes, reinigst und entsorgst nach Standortregel und erklärst, wann ein Feld-Farbtest reicht oder ein kalibriertes Digitalgerät beziehungsweise Labor nötig ist.', 'Eine gefärbte Lösung ist erst dann ein P H-Ergebnis, wenn Probe, Testset, Reagenz und Farbskala bekannt sind. Du übst die vollständige Folge an einem dokumentierten Set und überträgst die Methode dann unter Aufsicht auf das tatsächlich vorhandene Gerät.\n\nUnter Beobachtung der Lehrkraft erkennst du das tatsächliche Set und Handbuch, dosierst Boden, Reagenz und Wasser an den vorgesehenen Markierungen, verschließt und mischst wie vorgeschrieben und wartest die nötige Absetz- und Farbentwicklungszeit wirklich ab.\n\nDu vergleichst nur die klare Flüssigkeit mit der Farbskala desselben P H-Komparators bei passendem Licht, notierst den gestützten Wert oder Bereich samt Unsicherheit und hältst Proben- und Setidentität fest.\n\nDu wählst geeignete Schutzausrüstung und das S D S des Reagenzes, reinigst und entsorgst nach Standortregel und erklärst, wann ein Feld-Farbtest reicht oder ein kalibriertes Digitalgerät beziehungsweise Labor nötig ist.'), ('Eine lernende Person hält violette pH-Lösung an die Skala eines fremden NPK-Sets.\n\nStopp: Indikator und Farbreaktion können verschieden sein; das Aussehen ist kein gültiger pH-Wert.\n\nSuche die Skala des genau passenden pH-Komparators und vergleiche seine Flüssigkeit bei geeignetem Licht.\n\nOhne passende Skala oder Anleitung als unbewertet vermerken und dokumentiertes Set oder Labor verwenden.\n\nFarbe hat nur innerhalb ihrer Methode Bedeutung.', 'Eine lernende Person hält violette P H-Lösung an die Skala eines fremden N P K-Sets.\n\nStopp: Indikator und Farbreaktion können verschieden sein; das Aussehen ist kein gültiger P H-Wert.\n\nSuche die Skala des genau passenden P H-Komparators und vergleiche seine Flüssigkeit bei geeignetem Licht.\n\nOhne passende Skala oder Anleitung als unbewertet vermerken und dokumentiertes Set oder Labor verwenden.\n\nFarbe hat nur innerhalb ihrer Methode Bedeutung.'), ('Kolorimetrisch\n\nEin Verfahren, das entwickelte Farbe mit einer methodenspezifischen Referenzskala vergleicht.\n\nFarbkomparator\n\nPrüfraum und passende Farbskala des Sets zur Einschätzung des Ergebnisses.\n\nReagenz\n\nPrüfchemikalie nach eigenem Etikett, SDS und Herstellerverfahren.\n\nAuflösung\n\nKleinster pH-Unterschied, den Skala oder Gerät trägt; keine feineren Werte erfinden.\n\nKalibrierung\n\nPrüfen und Einstellen eines Digitalgeräts mit bekannten Pufferstandards nach Verfahren.', 'Kolorimetrisch\n\nEin Verfahren, das entwickelte Farbe mit einer methodenspezifischen Referenzskala vergleicht.\n\nFarbkomparator\n\nPrüfraum und passende Farbskala des Sets zur Einschätzung des Ergebnisses.\n\nReagenz\n\nPrüfchemikalie nach eigenem Etikett, S D S und Herstellerverfahren.\n\nAuflösung\n\nKleinster P H-Unterschied, den Skala oder Gerät trägt; keine feineren Werte erfinden.\n\nKalibrierung\n\nPrüfen und Einstellen eines Digitalgeräts mit bekannten Pufferstandards nach Verfahren.'), ('Rapitest-1601-', 'Rapitest eins sechs null eins '), ('Wähle beschriftete Probe und Rapitest eins sechs null eins pH-Komparator und ordne acht Handlungen: Etikett/SDS/Skala prüfen; Erde bis zur Linie; passende pH-Kapsel; Wasser bis zur Linie; schließen und schütteln; absetzen und Farbe entwickeln lassen; Flüssigkeit über Erde bei diffusem Tageslicht mit eigener Skala vergleichen; notieren und nach Standortverfahren reinigen. Falsche NPK-Skala, beliebige Reagenzmenge und erfundene Dezimalwerte ablehnen.\n\nDie Lehrkraft wählt das wirkliche Set, prüft Handbuch/SDS und testet A/B/C vorher. Jede lernende Person misst unter Beobachtung der Lehrkraft, notiert tatsächlichen Wert und Unsicherheit, reinigt und entsorgt sicher. Schreib- und Analytikerrollen wechseln, aber die Messung einer Person besteht nicht für andere.', 'Wähle beschriftete Probe und Rapitest eins sechs null eins P H-Komparator und ordne acht Handlungen: Etikett/S D S/Skala prüfen; Erde bis zur Linie; passende P H-Kapsel; Wasser bis zur Linie; schließen und schütteln; absetzen und Farbe entwickeln lassen; Flüssigkeit über Erde bei diffusem Tageslicht mit eigener Skala vergleichen; notieren und nach Standortverfahren reinigen. Falsche N P K-Skala, beliebige Reagenzmenge und erfundene Dezimalwerte ablehnen.\n\nDie Lehrkraft wählt das wirkliche Set, prüft Handbuch/S D S und testet A/B/C vorher. Jede lernende Person misst unter Beobachtung der Lehrkraft, notiert tatsächlichen Wert und Unsicherheit, reinigt und entsorgt sicher. Schreib- und Analytikerrollen wechseln, aber die Messung einer Person besteht nicht für andere.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s206-remainder-audio-20261023-r1'
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
    assert count < 8, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 32,'maximumCallsForLane':8,
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
    assert all(v<=8 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':8,'maximumBlindReviewPerLane':8,'maximumASRPerLane':8,'maximumTTSAggregate':32,'maximumBlindAggregate':32,'maximumASRAggregate':32,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
