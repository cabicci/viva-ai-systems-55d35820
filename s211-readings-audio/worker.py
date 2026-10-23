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
IDS = ('S2-11-ar-EG-R01-r1', 'S2-11-ar-EG-R02-r1', 'S2-11-ar-EG-R03-r1', 'S2-11-ar-EG-R04-r1', 'S2-11-ar-EG-R05-r1', 'S2-11-ar-EG-R06-r1', 'S2-11-en-R01-r1', 'S2-11-en-R02-r1', 'S2-11-en-R03-r1', 'S2-11-en-R04-r1', 'S2-11-en-R05-r1', 'S2-11-en-R06-r1', 'S2-11-it-R01-r1', 'S2-11-it-R02-r1', 'S2-11-it-R03-r1', 'S2-11-it-R04-r1', 'S2-11-it-R05-r1', 'S2-11-it-R06-r1', 'S2-11-de-R01-r1', 'S2-11-de-R02-r1', 'S2-11-de-R03-r1', 'S2-11-de-R04-r1', 'S2-11-de-R05-r1', 'S2-11-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S211_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-11')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s211-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06']
        ri=int(group[1:])-1;voice='Charon'if ri%2==0 else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]==[f'/reading/{ri}/paragraphs/{i}'for i in range(len(u['sourceBindings']))] and len(u['sourceBindings'])in[2,3]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('بطاقة الأداء الكاملة تطلب بعدين ارتفاع طبقات الرمل والسلت والطين والارتفاع الكلي للطبقات المعدنية بالملليمتر، وبعدها نسبة كل طبقة التقريبية في البرطمان = ارتفاع الطبقة ÷ الارتفاع الكلي للطبقات المعدنية ×100. القياس والحساب يُدرّسان ويُقيّمان في S2-12؛ الخطوة دي تجهز البرطمانات نفسها بأسمائها وتسجل الوقت والعلامات اللي تخلي القياس اللاحق ممكنًا.\n\nبرطمان المدرّب الجاهز بعد 48 ساعة يعلمك تحط المسطرة فين، لكن لازم يبقى عليه اسم العينة وكمية التربة ومادة التفكيك ووقت البداية. ما تكتبش أرقامه على إنها نتيجة برطمانك اللي اتخلط حالًا. لو حد الطبقات مش واضح بدرجة تسمح بالقياس، السجل الصادق هو «غير واضح» والخطوة التالية مراجعة الطريقة أو الإعادة، مش اختراع نسبة دقيقة.', 'بطاقة الأداء الكاملة تطلب بعدين ارتفاع طبقات الرمل والسلت والطين والارتفاع الكلي للطبقات المعدنية بالملليمتر، وبعدها نسبة كل طبقة التقريبية في البرطمان بتساوي ارتفاع الطبقة مقسوم على الارتفاع الكلي للطبقات المعدنية ، والناتج مضروب في مية. القياس والحساب بيتدرّسوا وبيتقيّموا في خطوة المحطة التانية رقم اتناشر؛ الخطوة دي تجهز البرطمانات نفسها بأسمائها وتسجل الوقت والعلامات اللي تخلي القياس اللاحق ممكن.\n\nبرطمان المدرّب الجاهز بعد تمانية وأربعين ساعة يعلمك تحط المسطرة فين، لكن لازم يبقى عليه اسم العينة وكمية التربة ومادة التفكيك ووقت البداية. ما تكتبش أرقامه على إنها نتيجة برطمانك اللي اتخلط دلوقتي. لو حد الطبقات مش واضح بدرجة تسمح بالقياس، السجل الصادق هو «غير واضح» والخطوة التالية مراجعة الطريقة أو الإعادة، مش اختراع نسبة دقيقة.'), ('حسب تقسيم USDA لجزء التربة الناعم، الرمل حجمه 0.05–2 mm وغالبًا تحسه خشن؛ السلت 0.002–0.05 mm وإحساسه شبه الدقيق وهو جاف أو ناعم حريري وهو مبلول؛ والطين أقل من 0.002 mm وقد يبقى لزجًا وقابلًا للتشكيل وهو مبلول. تشبيه كرة السلة وكرة الجولف والبِلّية لتقريب فرق الأحجام فقط، مش رسم بمقياس أو طريقة قياس. التربة اللومية فئة من خلطات متعددة على مثلث القوام، مش شرط ثلثًا من كل مجموعة، ولا حبيبة رابعة أو ضمان خصوبة أو خلطة أصص تجارية.\n\nالتربة الأكثر رملية غالبًا فيها مسارات مسام أوسع وصرف أسرع. السلت قد يحتفظ بميه أكتر من الرمل لكنه معرض للانضغاط والتعرية. والطين قد يحتفظ بميه وكاتيونات مغذية قابلة للتبادل حسب نوع المعدن وحالة الأرض. مش كل الميه المحتجزة متاحة للجذور، وتشبع الأرض قد يقلل الأكسجين. أرض ملعب مطلوب تجف بسرعة قد تستفيد من رمل أكتر، لكن قرار الصرف الحقيقي يحتاج النظر للبناء وظروف الموقع.', 'حسب تقسيم يو إس دي إيه لجزء التربة الناعم، الرمل حجمه صفر فاصلة صفر خمسة إلى اتنين ملليمتر وغالبًا تحسه خشن؛ السلت صفر فاصلة صفر صفر اتنين إلى صفر فاصلة صفر خمسة ملليمتر وإحساسه شبه الدقيق وهو جاف أو ناعم حريري وهو مبلول؛ والطين أقل من صفر فاصلة صفر صفر اتنين ملليمتر وقد يبقى لزج وقابل للتشكيل وهو مبلول. تشبيه كرة السلة وكرة الجولف والبِلّية لتقريب فرق الأحجام فقط، مش رسم بمقياس أو طريقة قياس. التربة اللومية فئة من خلطات متعددة على مثلث القوام، مش شرط تلت من كل مجموعة، ولا حبيبة رابعة أو ضمان خصوبة أو خلطة أصص تجارية.\n\nالتربة الأكثر رملية غالبًا فيها مسارات مسام أوسع وصرف أسرع. السلت قد يحتفظ بميه أكتر من الرمل لكنه معرض للانضغاط والتعرية. والطين قد يحتفظ بميه وكاتيونات مغذية قابلة للتبادل حسب نوع المعدن وحالة الأرض. مش كل الميه المحتجزة متاحة للجذور، وتشبع الأرض قد يقلل الأكسجين. أرض ملعب مطلوب تجف بسرعة قد تستفيد من رمل أكتر، لكن قرار الصرف الحقيقي يحتاج النظر للبناء وظروف الموقع.'), ('حط كل برطمان بعد الخلط على سطح مستوٍ من غير تحريك، واكتب اسم العينة ووقت انتهاء الرجّ، ثم اتبع الجدول المختار. المثال التفصيلي يعلّم أعلى الرمل بعد نحو 1–2 دقيقة، وحد السلت بعد نحو 2–4 ساعات، وحد الطين الأخير بعد نحو 24–48 ساعة. التمهيد السابق يقول نحو دقيقة، وساعتين، وحتى 24–48 ساعة؛ ده نفس ترتيب الشرح، مش بروتوكول تاني تدمجه مع طريقة التقييم المختارة. ما تدخلش المادة العضوية الطافية في ارتفاع الطبقات المعدنية.\n\nحصة 75 دقيقة ما تديش ملاحظة بعد 48 ساعة. المدرّب ممكن يعرض برطمانًا جاهزًا موثقًا للشرح، لكن أنت ترجع لبرطماناتك في المراحل المجدولة. سجل الوقت الحقيقي وارتفاع الطبقات وأي حد مش واضح؛ الإضاءة من الجنب قد تساعد، لكن ما ترسمش خطًا مش قادر تشوفه. لو البرطمان اتحرك أو فضل عكرًا في الموعد المختار، سجّل ده واتبع قرار المدرّب المعلن بإعادة التجربة أو الانتظار لملاحظة لاحقة. برطمان عمره 15–20 دقيقة مش نتيجة نهائية لنسب الرمل والسلت والطين.', 'حط كل برطمان بعد الخلط على سطح مستوي من غير تحريك، واكتب اسم العينة ووقت انتهاء الرجّ، ثم اتبع الجدول المختار. المثال التفصيلي يعلّم أعلى الرمل بعد حوالي دقيقة لدقيقتين، وحد السلت بعد حوالي ساعتين لأربع ساعات، وحد الطين الأخير بعد نحو أربعة وعشرين إلى تمانية وأربعين ساعة. التمهيد السابق يقول نحو دقيقة، وساعتين، وحتى أربعة وعشرين إلى تمانية وأربعين ساعة؛ ده نفس ترتيب الشرح، مش بروتوكول تاني تدمجه مع طريقة التقييم المختارة. ما تدخلش المادة العضوية الطافية في ارتفاع الطبقات المعدنية.\n\nحصة خمسة وسبعين دقيقة ما تديش ملاحظة بعد تمانية وأربعين ساعة. المدرّب ممكن يعرض برطمان جاهز وموثق للشرح، لكن أنت ترجع لبرطماناتك في المراحل المجدولة. سجل الوقت الحقيقي وارتفاع الطبقات وأي حد مش واضح؛ الإضاءة من الجنب قد تساعد، لكن ما ترسمش خط مش قادر تشوفه. لو البرطمان اتحرك أو فضل عكر في الموعد المختار، سجّل ده واتبع قرار المدرّب المعلن بإعادة التجربة أو الانتظار لملاحظة لاحقة. برطمان عمره خمستاشر إلى عشرين دقيقة مش نتيجة نهائية لنسب الرمل والسلت والطين.'), ('سيناريو بطاقة الأداء بيستخدم برطمان زجاج سعة 1 لتر عليه اسم العينة، ونحو 1.5 كوب تربة مجهزة أو نص البرطمان تقريبًا في السيناريو ده، وميه لحد نحو تلاتة أرباعه، ونحو معلقة شاي من سائل غسيل الأطباق، وغطاء محكم ورجّ قوي لمدة 10–15 دقيقة. تمهيد سابق في الأصل يبدأ بدلًا من كده ببرطمان فيه تربة منخولة لحد نحو ثلثه ورجّ لبضع دقائق. دول وصفان منفصلان؛ ما تخلطش كمياتهم ولا تعتبر أي واحد إجراء معمل قياسيًا. قبل تقييم التطبيق، المدرّب يختار ويسجل الوعاء الفعلي، ومادة التفكيك وكميتها، وقياس التربة والميه، وطريقة الرجّ الآمنة والمواعيد.\n\nمادة تفكيك التكتلات تساعد تفصل تجمعات الطين. منتجات غسيل الأطباق المنزلية مختلفة؛ اسم منتج أو معلقة منه ما يثبتش إنها كلها تشتغل بنفس الطريقة. المدرّب يتحقق من المادة واستخدامها الآمن؛ إجراء المعمل قد يستخدم مادة محددة زي سداسي ميتافوسفات الصوديوم. افحص الزجاج من الشروخ، وثبّت الغطاء وامسك الوعاء بأمان، وبدّلوا أدوار الرجّ إذا لزم لتجنب التعب. مدة الرجّ وحدها لا تضمن تفكك التكتلات بالكامل.', 'سيناريو بطاقة الأداء بيستخدم برطمان زجاج سعة لتر واحد عليه اسم العينة، ونحو كوب ونص تربة مجهزة أو نص البرطمان تقريبًا في السيناريو ده، وميه لحد نحو تلاتة أرباعه، ونحو معلقة شاي من سائل غسيل الأطباق، وغطاء محكم ورجّ قوي لمدة عشر لخمستاشر دقيقة. تمهيد سابق في الأصل يبدأ بدلًا من كده ببرطمان فيه تربة منخولة لحد نحو ثلثه ورجّ لبضع دقائق. دول وصفين منفصلين؛ ما تخلطش كمياتهم ولا تعتبر أي واحد إجراء معمل قياسي. قبل تقييم التطبيق، المدرّب يختار ويسجل الوعاء الفعلي، ومادة التفكيك وكميتها، وقياس التربة والميه، وطريقة الرجّ الآمنة والمواعيد.\n\nمادة تفكيك التكتلات تساعد تفصل تجمعات الطين. منتجات غسيل الأطباق المنزلية مختلفة؛ اسم منتج أو معلقة منه ما يثبتش إنها كلها تشتغل بنفس الطريقة. المدرّب يتحقق من المادة واستخدامها الآمن؛ إجراء المعمل قد يستخدم مادة محددة زي سداسي ميتافوسفات الصوديوم. افحص الزجاج من الشروخ، وثبّت الغطاء وامسك الوعاء بأمان، وبدّلوا أدوار الرجّ إذا لزم لتجنب التعب. مدة الرجّ وحدها لا تضمن تفكك التكتلات بالكامل.'), ('فك تكتلات التربة من غير ما تطحن الحصى وتحوله لرمل. شيل الحجارة والجذور والبقايا الطافية الواضحة حسب طريقة التدريب المعلنة، واحتفظ بهوية كل واحدة من التلات عينات منفصلة. بعد تفكيك التكتلات في الميه، حبيبات الرمل الأكبر غالبًا بتنزل الأول، وبعدها جزء كبير من السلت، والطين الناعم يفضل معلق مدة أطول. الترسيب بيتأثر بالحجم والكثافة والتكتل وظروف السائل؛ جملة «الأثقل ينزل أولًا» وحدها مش تفسير كافٍ.\n\nالبرطمان الشفاف مستقيم الجوانب يسهل ملاحظة ارتفاع الطبقات. الطريقة المرئية دي تقدير تعليمي تقريبي؛ فئات القوام حسب USDA مبنية على نسب وزن الحبيبات المعدنية في جزء التربة أقل من 2 mm بطرق معملية مقبولة أو تقدير حقلي معاير. ارتفاع الطبقة مش تلقائيًا نفس النسبة الوزنية؛ عشان كده الخطوة الجاية تعتبر نسب البرطمان تقديرية وتراجع حدودها.', 'فك تكتلات التربة من غير ما تطحن الحصى وتحوله لرمل. شيل الحجارة والجذور والبقايا الطافية الواضحة حسب طريقة التدريب المعلنة، واحتفظ بهوية كل واحدة من التلات عينات منفصلة. بعد تفكيك التكتلات في الميه، حبيبات الرمل الأكبر غالبًا بتنزل الأول، وبعدها جزء كبير من السلت، والطين الناعم يفضل معلق مدة أطول. الترسيب بيتأثر بالحجم والكثافة والتكتل وظروف السائل؛ جملة «الأثقل ينزل أولًا» وحدها مش تفسير كافي.\n\nالبرطمان الشفاف مستقيم الجوانب يسهل ملاحظة ارتفاع الطبقات. الطريقة المرئية دي تقدير تعليمي تقريبي؛ فئات القوام حسب يو إس دي إيه مبنية على نسب وزن الحبيبات المعدنية في جزء التربة أقل من اتنين ملليمتر بطرق معملية مقبولة أو تقدير حقلي معاير. ارتفاع الطبقة مش تلقائيًا نفس النسبة الوزنية؛ عشان كده الخطوة الجاية تعتبر نسب البرطمان تقديرية وتراجع حدودها.')], 'en': [("Break up soil clods without grinding gravel into sand. Remove stones, roots and obvious floating debris according to the declared classroom method, and keep three different samples separately identified. After dispersal in water, the larger sand-sized particles generally settle first, then much of the silt, with fine clay remaining suspended longer. Settling reflects particle size, density, aggregation and liquid conditions—not the slogan 'heavier always wins' by itself.\n\nA straight-sided transparent jar makes heights easier to observe. This visual layer method provides an approximate teaching estimate; USDA texture classes are defined from mineral-particle weight proportions in the <2 mm fraction by accepted laboratory or calibrated field methods. Layer height is not automatically identical to weight percentage, so the next step treats any jar percentages as estimates and checks their limits.", "Break up soil clods without grinding gravel into sand. Remove stones, roots and obvious floating debris according to the declared classroom method, and keep three different samples separately identified. After dispersal in water, the larger sand-sized particles generally settle first, then much of the silt, with fine clay remaining suspended longer. Settling reflects particle size, density, aggregation and liquid conditions—not the slogan 'heavier always wins' by itself.\n\nA straight-sided transparent jar makes heights easier to observe. This visual layer method provides an approximate teaching estimate; U S D A texture classes are defined from mineral-particle weight proportions in the less than two millimetres fraction by accepted laboratory or calibrated field methods. Layer height is not automatically identical to weight percentage, so the next step treats any jar percentages as estimates and checks their limits."), ("Set each mixed jar level and undisturbed, write its sample ID and shaking-finished time, then follow the selected timetable. The detailed example marks the top of sand at about 1–2 minutes, the silt boundary at about 2–4 hours and the final settled clay boundary at about 24–48 hours. An earlier overview says about one minute, two hours and up to 24–48 hours; that is the same teaching sequence but not an extra second protocol to mix into the scored procedure. Do not count floating organic matter in mineral-layer height.\n\nA 75-minute lesson cannot provide a 48-hour observation. The teacher may show a documented pre-settled jar for explanation while you return to your own jars at scheduled stages. Record actual times, layer heights and any unclear interface; side lighting may help, but never draw a line where you cannot see one. If a jar is disturbed or still cloudy at the chosen time, report it and use the trainer's declared repeat or later-observation rule. A 15–20-minute settled jar is not a final sand–silt–clay composition.", "Set each mixed jar level and undisturbed, write its sample I D and shaking-finished time, then follow the selected timetable. The detailed example marks the top of sand at about one to two minutes, the silt boundary at about two to four hours and the final settled clay boundary at about twenty-four to forty-eight hours. An earlier overview says about one minute, two hours and up to twenty-four to forty-eight hours; that is the same teaching sequence but not an extra second protocol to mix into the scored procedure. Do not count floating organic matter in mineral-layer height.\n\nA seventy-five-minute lesson cannot provide a forty-eight-hour observation. The teacher may show a documented pre-settled jar for explanation while you return to your own jars at scheduled stages. Record actual times, layer heights and any unclear interface; side lighting may help, but never draw a line where you cannot see one. If a jar is disturbed or still cloudy at the chosen time, report it and use the trainer's declared repeat or later-observation rule. A fifteen to twenty-minute settled jar is not a final sand–silt–clay composition."), ("The full process card later asks for sand, silt, clay and total mineral-layer heights in millimetres, then each approximate jar percentage as layer height divided by total mineral-layer height times 100. The measurement and calculation stage is taught and scored in S2-12; this step prepares the same identified jars and records the timing and visible marks that make later measurement possible.\n\nA trainer's 48-hour pre-settled example can teach where to place a ruler, but label its sample, soil amount, dispersant and start time. Do not enter its numbers as the result from your own newly mixed jar. If an interface is too blurred to measure defensibly, the truthful record is 'unclear' and the next action is to examine the method or repeat—not to invent an exact percentage.", "The full process card later asks for sand, silt, clay and total mineral-layer heights in millimetres, then each approximate jar percentage as layer height divided by total mineral-layer height times one hundred. The measurement and calculation stage is taught and scored in station two step twelve; this step prepares the same identified jars and records the timing and visible marks that make later measurement possible.\n\nA trainer's forty-eight-hour pre-settled example can teach where to place a ruler, but label its sample, soil amount, dispersant and start time. Do not enter its numbers as the result from your own newly mixed jar. If an interface is too blurred to measure defensibly, the truthful record is 'unclear' and the next action is to examine the method or repeat—not to invent an exact percentage."), ('The process-card scenario uses a labelled 1-litre glass jar, about 1.5 cups of prepared soil or about half the jar in that scenario, water to about three-quarters, approximately one teaspoon of dishwashing liquid, a secured lid and 10–15 minutes of vigorous shaking. An earlier introduction instead starts with a jar about one-third full of sieved soil and several minutes of shaking. These are separate descriptions; do not combine their amounts or claim either is a standard laboratory SOP. The trainer must choose and record one actual container, dispersant and amount, soil and water measure, safe shaking method and times before the practical assessment.\n\nA dispersant helps separate clay aggregates. Household dishwashing products vary; a product name or a spoonful is not proof of equivalent dispersion. The trainer verifies the material and its safe use; a laboratory method may use a defined agent such as sodium hexametaphosphate. Inspect glass for cracks, use a secure lid and safe grip, and swap shaking turns if needed to avoid fatigue. Duration alone does not guarantee full disaggregation.', 'The process-card scenario uses a labelled one-litre glass jar, about one point five cups of prepared soil or about half the jar in that scenario, water to about three-quarters, approximately one teaspoon of dishwashing liquid, a secured lid and ten to fifteen minutes of vigorous shaking. An earlier introduction instead starts with a jar about one-third full of sieved soil and several minutes of shaking. These are separate descriptions; do not combine their amounts or claim either is a standard laboratory S O P. The trainer must choose and record one actual container, dispersant and amount, soil and water measure, safe shaking method and times before the practical assessment.\n\nA dispersant helps separate clay aggregates. Household dishwashing products vary; a product name or a spoonful is not proof of equivalent dispersion. The trainer verifies the material and its safe use; a laboratory method may use a defined agent such as sodium hexametaphosphate. Inspect glass for cracks, use a secure lid and safe grip, and swap shaking turns if needed to avoid fatigue. Duration alone does not guarantee full disaggregation.'), ('Under the USDA fine-earth convention, sand is 0.05–2 mm and usually feels gritty; silt is 0.002–0.05 mm and feels floury dry or silky wet; clay is smaller than 0.002 mm and can be sticky and plastic when wet. The basketball/golf-ball/marble comparison is a visual analogy for relative size, not a scale drawing or measurement method. Loam is a range of mixtures on a texture triangle, not exactly one third of each particle, a fourth mineral particle, a fertility guarantee or a commercial potting mix.\n\nSandier material often has larger pore pathways and faster drainage; silt can retain more water than sand but may compact and erode; clay can hold water and exchangeable cations, depending on mineral type and soil condition. Some held water may not be available to roots, and waterlogging can limit oxygen. A playground surface that must dry quickly may favour more sand, but the actual drainage decision also needs structure and site conditions.', 'Under the U S D A fine-earth convention, sand is zero point zero five to two millimetres and usually feels gritty; silt is zero point zero zero two to zero point zero five millimetres and feels floury dry or silky wet; clay is smaller than zero point zero zero two millimetres and can be sticky and plastic when wet. The basketball/golf-ball/marble comparison is a visual analogy for relative size, not a scale drawing or measurement method. Loam is a range of mixtures on a texture triangle, not exactly one third of each particle, a fourth mineral particle, a fertility guarantee or a commercial potting mix.\n\nSandier material often has larger pore pathways and faster drainage; silt can retain more water than sand but may compact and erode; clay can hold water and exchangeable cations, depending on mineral type and soil condition. Some held water may not be available to roots, and waterlogging can limit oxygen. A playground surface that must dry quickly may favour more sand, but the actual drainage decision also needs structure and site conditions.')], 'it': [("Disgrega le zolle senza macinare la ghiaia e trasformarla artificialmente in sabbia. Rimuovi pietre, radici e detriti galleggianti evidenti secondo il procedimento didattico dichiarato, e mantieni separati e identificati i tre campioni. Dopo dispersione in acqua, le particelle sabbiose più grandi in genere sedimentano per prime, poi gran parte del limo, mentre l'argilla fine resta sospesa più a lungo. La sedimentazione dipende da dimensione, densità, aggregazione e condizioni del liquido, non dal solo slogan 'vince sempre il più pesante'.\n\nUn barattolo trasparente a pareti diritte rende più facile osservare le altezze. Il metodo visivo degli strati fornisce una stima didattica approssimativa; le classi USDA si fondano sulle proporzioni in massa delle particelle minerali della frazione <2 mm tramite metodi di laboratorio accettati o stime di campo calibrate. L'altezza dello strato non equivale automaticamente alla percentuale in massa: nel passo successivo le percentuali ricavate dal barattolo restano stime con limiti da verificare.", "Disgrega le zolle senza macinare la ghiaia e trasformarla artificialmente in sabbia. Rimuovi pietre, radici e detriti galleggianti evidenti secondo il procedimento didattico dichiarato, e mantieni separati e identificati i tre campioni. Dopo dispersione in acqua, le particelle sabbiose più grandi in genere sedimentano per prime, poi gran parte del limo, mentre l'argilla fine resta sospesa più a lungo. La sedimentazione dipende da dimensione, densità, aggregazione e condizioni del liquido, non dal solo slogan 'vince sempre il più pesante'.\n\nUn barattolo trasparente a pareti diritte rende più facile osservare le altezze. Il metodo visivo degli strati fornisce una stima didattica approssimativa; le classi u esse di a si fondano sulle proporzioni in massa delle particelle minerali della frazione meno di due millimetri tramite metodi di laboratorio accettati o stime di campo calibrate. L'altezza dello strato non equivale automaticamente alla percentuale in massa: nel passo successivo le percentuali ricavate dal barattolo restano stime con limiti da verificare."), ("La scheda pratica completa richiede poi le altezze di sabbia, limo, argilla e del totale degli strati minerali in millimetri, quindi la percentuale approssimativa di ciascuno nel barattolo come altezza dello strato divisa per altezza minerale totale moltiplicata per 100. Misura e calcolo sono insegnati e valutati in S2-12; questo passo prepara gli stessi barattoli identificati e registra orari e segni visibili necessari per misurare più tardi.\n\nIl barattolo dimostrativo del formatore, sedimentato per 48 ore, può insegnare dove mettere il righello, ma va identificato con campione, quantità di suolo, disperdente e ora iniziale. Non riportare i suoi numeri come risultato del tuo barattolo appena agitato. Se il confine è troppo sfumato per misurarlo in modo difendibile, la registrazione corretta è 'non chiaro' e il passo successivo è riesaminare il metodo o ripetere, non inventare una percentuale esatta.", "La scheda pratica completa richiede poi le altezze di sabbia, limo, argilla e del totale degli strati minerali in millimetri, quindi la percentuale approssimativa di ciascuno nel barattolo come altezza dello strato divisa per altezza minerale totale moltiplicata per cento. Misura e calcolo sono insegnati e valutati in fase dodici della stazione due; questo passo prepara gli stessi barattoli identificati e registra orari e segni visibili necessari per misurare più tardi.\n\nIl barattolo dimostrativo del formatore, sedimentato per quarantotto ore, può insegnare dove mettere il righello, ma va identificato con campione, quantità di suolo, disperdente e ora iniziale. Non riportare i suoi numeri come risultato del tuo barattolo appena agitato. Se il confine è troppo sfumato per misurarlo in modo difendibile, la registrazione corretta è 'non chiaro' e il passo successivo è riesaminare il metodo o ripetere, non inventare una percentuale esatta."), ("Lo scenario della scheda pratica usa un barattolo di vetro etichettato da 1 litro, circa 1.5 tazze di suolo preparato oppure circa metà barattolo in quello scenario, acqua fino a circa tre quarti, circa un cucchiaino di detersivo per piatti, coperchio ben chiuso e agitazione vigorosa per 10–15 minuti. Una spiegazione precedente parte invece con un barattolo riempito per circa un terzo di suolo setacciato e qualche minuto di agitazione. Sono descrizioni distinte: non unire le quantità né trattare una delle due come procedura standard di laboratorio. Prima della valutazione pratica il formatore sceglie e registra recipiente effettivo, disperdente e quantità, misura di suolo e acqua, agitazione sicura e orari.\n\nUn disperdente aiuta a separare gli aggregati di argilla. I detersivi domestici variano: il nome di un prodotto o un cucchiaino non dimostrano una dispersione equivalente. Il formatore verifica materiale e uso sicuro; un metodo di laboratorio può impiegare un agente definito come l'esametafosfato di sodio. Controlla che il vetro non abbia crepe, serra il coperchio e afferra il barattolo in sicurezza; se serve, alternatevi nell'agitazione per evitare affaticamento. La durata da sola non garantisce che gli aggregati siano del tutto separati.", "Lo scenario della scheda pratica usa un barattolo di vetro etichettato da un litro, circa una tazza e mezza di suolo preparato oppure circa metà barattolo in quello scenario, acqua fino a circa tre quarti, circa un cucchiaino di detersivo per piatti, coperchio ben chiuso e agitazione vigorosa per un tempo compreso tra dieci e quindici minuti. Una spiegazione precedente parte invece con un barattolo riempito per circa un terzo di suolo setacciato e qualche minuto di agitazione. Sono descrizioni distinte: non unire le quantità né trattare una delle due come procedura standard di laboratorio. Prima della valutazione pratica il formatore sceglie e registra recipiente effettivo, disperdente e quantità, misura di suolo e acqua, agitazione sicura e orari.\n\nUn disperdente aiuta a separare gli aggregati di argilla. I detersivi domestici variano: il nome di un prodotto o un cucchiaino non dimostrano una dispersione equivalente. Il formatore verifica materiale e uso sicuro; un metodo di laboratorio può impiegare un agente definito come l'esametafosfato di sodio. Controlla che il vetro non abbia crepe, serra il coperchio e afferra il barattolo in sicurezza; se serve, alternatevi nell'agitazione per evitare affaticamento. La durata da sola non garantisce che gli aggregati siano del tutto separati."), ("Nella convenzione USDA per la terra fine, la sabbia misura 0.05–2 mm ed è di solito granulosa; il limo misura 0.002–0.05 mm ed è farinoso da asciutto o setoso da bagnato; l'argilla è inferiore a 0.002 mm e può risultare appiccicosa e plastica se bagnata. Il paragone con palla da basket, pallina da golf e biglia è una metafora visiva delle dimensioni relative, non un disegno in scala o un metodo di misura. Il suolo franco rappresenta un insieme di miscele nel triangolo tessiturale, non esattamente un terzo di ogni frazione, una quarta particella, una garanzia di fertilità o un terriccio commerciale.\n\nI materiali più sabbiosi spesso hanno pori più ampi e drenano prima; il limo può trattenere più acqua della sabbia ma compattarsi o erodersi; l'argilla può trattenere acqua e cationi scambiabili in funzione dei minerali e delle condizioni. Una parte dell'acqua trattenuta può non essere disponibile alle radici e il ristagno può ridurre l'ossigeno. Per un'area giochi che deve asciugare rapidamente può essere utile più sabbia, ma la decisione reale sul drenaggio richiede anche struttura e condizioni del sito.", "Nella convenzione u esse di a per la terra fine, la sabbia misura da zero virgola zero cinque a due millimetri ed è di solito granulosa; il limo misura da zero virgola zero zero due a zero virgola zero cinque millimetri ed è farinoso da asciutto o setoso da bagnato; l'argilla è inferiore a zero virgola zero zero due millimetri e può risultare appiccicosa e plastica se bagnata. Il paragone con palla da basket, pallina da golf e biglia è una metafora visiva delle dimensioni relative, non un disegno in scala o un metodo di misura. Il suolo franco rappresenta un insieme di miscele nel triangolo tessiturale, non esattamente un terzo di ogni frazione, una quarta particella, una garanzia di fertilità o un terriccio commerciale.\n\nI materiali più sabbiosi spesso hanno pori più ampi e drenano prima; il limo può trattenere più acqua della sabbia ma compattarsi o erodersi; l'argilla può trattenere acqua e cationi scambiabili in funzione dei minerali e delle condizioni. Una parte dell'acqua trattenuta può non essere disponibile alle radici e il ristagno può ridurre l'ossigeno. Per un'area giochi che deve asciugare rapidamente può essere utile più sabbia, ma la decisione reale sul drenaggio richiede anche struttura e condizioni del sito."), ("Poni ogni barattolo miscelato su una superficie piana senza disturbarlo, scrivi l'identificativo e l'ora di fine agitazione, poi segui il calendario scelto. L'esempio dettagliato segna il limite superiore della sabbia dopo circa 1–2 minuti, il limite del limo dopo circa 2–4 ore e il limite finale dell'argilla dopo circa 24–48 ore. Una descrizione precedente dice circa un minuto, due ore e fino a 24–48 ore: è la stessa sequenza didattica, non un secondo protocollo da mescolare con quello valutato. Escludi la sostanza organica galleggiante dall'altezza degli strati minerali.\n\nUna lezione di 75 minuti non permette un'osservazione a 48 ore. Il formatore può mostrare un barattolo già sedimentato e documentato, mentre tu torni ai tuoi barattoli nelle fasi programmate. Registra tempi reali, altezze degli strati e interfacce poco chiare; una luce laterale può aiutare, ma non tracciare un confine che non vedi. Se il barattolo viene mosso o resta torbido all'ora scelta, segnalalo e applica la regola dichiarata dal formatore per ripetere o osservare più tardi. Un barattolo sedimentato per 15–20 minuti non dà la composizione finale di sabbia, limo e argilla.", "Poni ogni barattolo miscelato su una superficie piana senza disturbarlo, scrivi l'identificativo e l'ora di fine agitazione, poi segui il calendario scelto. L'esempio dettagliato segna il limite superiore della sabbia dopo un intervallo tra circa uno e due minuti, il limite del limo dopo un intervallo tra circa due e quattro ore e il limite finale dell'argilla dopo un intervallo tra circa ventiquattro e quarantotto ore. Una descrizione precedente dice circa un minuto, due ore e fino all'intervallo da ventiquattro a quarantotto ore: è la stessa sequenza didattica, non un secondo protocollo da mescolare con quello valutato. Escludi la sostanza organica galleggiante dall'altezza degli strati minerali.\n\nUna lezione di settantacinque minuti non permette un'osservazione a quarantotto ore. Il formatore può mostrare un barattolo già sedimentato e documentato, mentre tu torni ai tuoi barattoli nelle fasi programmate. Registra tempi reali, altezze degli strati e interfacce poco chiare; una luce laterale può aiutare, ma non tracciare un confine che non vedi. Se il barattolo viene mosso o resta torbido all'ora scelta, segnalalo e applica la regola dichiarata dal formatore per ripetere o osservare più tardi. Un barattolo sedimentato per un tempo compreso tra quindici e venti minuti non dà la composizione finale di sabbia, limo e argilla.")], 'de': [('Das Szenario der Prozesskarte verwendet ein beschriftetes Glasgefäß von 1 Liter, etwa 1.5 Tassen vorbereiteten Boden oder in diesem Szenario ungefähr ein halbes Glas, Wasser bis etwa drei Viertel, ungefähr einen Teelöffel Geschirrspülmittel, einen fest geschlossenen Deckel und 10–15 Minuten kräftiges Schütteln. Eine frühere Einführung beginnt dagegen mit ungefähr einem Drittel gesiebten Bodens und einigen Minuten Schütteln. Dies sind getrennte Beschreibungen: Mische ihre Mengen nicht und nenne keine davon eine standardisierte Laboranweisung. Vor der praktischen Beurteilung legt die Lehrkraft ein tatsächliches Gefäß, Dispergiermittel samt Menge, Boden- und Wassermenge, sichere Schüttelmethode und Zeiten fest und hält sie fest.\n\nEin Dispergiermittel hilft, Tonaggregate zu trennen. Haushaltsreiniger unterscheiden sich; Produktname oder Löffelmenge belegen keine gleichwertige Dispersion. Die Lehrkraft prüft Material und sichere Anwendung; ein Laborverfahren kann einen definierten Stoff wie Natriumhexametaphosphat verwenden. Prüfe Glas auf Risse, schließe den Deckel fest und halte das Gefäß sicher. Wechselt euch beim Schütteln nötigenfalls gegen Ermüdung ab. Dauer allein garantiert keine vollständige Zerlegung der Aggregate.', 'Das Szenario der Prozesskarte verwendet ein beschriftetes Glasgefäß von einem Liter, etwa eins Komma fünf Tassen vorbereiteten Boden oder in diesem Szenario ungefähr ein halbes Glas, Wasser bis etwa drei Viertel, ungefähr einen Teelöffel Geschirrspülmittel, einen fest geschlossenen Deckel und zehn bis fünfzehn Minuten kräftiges Schütteln. Eine frühere Einführung beginnt dagegen mit ungefähr einem Drittel gesiebten Bodens und einigen Minuten Schütteln. Dies sind getrennte Beschreibungen: Mische ihre Mengen nicht und nenne keine davon eine standardisierte Laboranweisung. Vor der praktischen Beurteilung legt die Lehrkraft ein tatsächliches Gefäß, Dispergiermittel samt Menge, Boden- und Wassermenge, sichere Schüttelmethode und Zeiten fest und hält sie fest.\n\nEin Dispergiermittel hilft, Tonaggregate zu trennen. Haushaltsreiniger unterscheiden sich; Produktname oder Löffelmenge belegen keine gleichwertige Dispersion. Die Lehrkraft prüft Material und sichere Anwendung; ein Laborverfahren kann einen definierten Stoff wie Natriumhexametaphosphat verwenden. Prüfe Glas auf Risse, schließe den Deckel fest und halte das Gefäß sicher. Wechselt euch beim Schütteln nötigenfalls gegen Ermüdung ab. Dauer allein garantiert keine vollständige Zerlegung der Aggregate.'), ("Die vollständige Prozesskarte verlangt später die Höhen von Sand, Schluff, Ton und der gesamten Mineralschicht in Millimetern. Der ungefähre Glasanteil jeder Schicht ergibt sich als Schichthöhe geteilt durch die Gesamthöhe der mineralischen Schichten mal 100. Messung und Berechnung werden in S2-12 gelehrt und bewertet; hier bereitest du dieselben identifizierten Gläser vor und dokumentierst Zeiten und sichtbare Marken, die spätere Messungen ermöglichen.\n\nEin vorher 48 Stunden abgesetztes Demonstrationsglas kann zeigen, wie ein Lineal anzulegen ist. Es braucht aber Probenkennung, Bodenmenge, Dispergiermittel und Startzeit. Übertrage seine Zahlen nicht als Ergebnis deines gerade geschüttelten Glases. Ist eine Grenze zu verschwommen für eine vertretbare Messung, lautet der ehrliche Eintrag 'unklar'; danach wird die Methode überprüft oder wiederholt, statt einen exakten Prozentwert zu erfinden.", "Die vollständige Prozesskarte verlangt später die Höhen von Sand, Schluff, Ton und der gesamten Mineralschicht in Millimetern. Der ungefähre Glasanteil jeder Schicht ergibt sich als Schichthöhe geteilt durch die Gesamthöhe der mineralischen Schichten mal einhundert. Messung und Berechnung werden in Schritt zwölf der Station zwei gelehrt und bewertet; hier bereitest du dieselben identifizierten Gläser vor und dokumentierst Zeiten und sichtbare Marken, die spätere Messungen ermöglichen.\n\nEin vorher achtundvierzig Stunden abgesetztes Demonstrationsglas kann zeigen, wie ein Lineal anzulegen ist. Es braucht aber Probenkennung, Bodenmenge, Dispergiermittel und Startzeit. Übertrage seine Zahlen nicht als Ergebnis deines gerade geschüttelten Glases. Ist eine Grenze zu verschwommen für eine vertretbare Messung, lautet der ehrliche Eintrag 'unklar'; danach wird die Methode überprüft oder wiederholt, statt einen exakten Prozentwert zu erfinden."), ('Nach der USDA-Einteilung der Feinerde misst Sand 0.05–2 mm und fühlt sich meist körnig an; Schluff misst 0.002–0.05 mm und wirkt trocken mehlig, nass seidig oder glatt; Ton ist kleiner als 0.002 mm und kann nass klebrig und formbar sein. Der Vergleich mit Basketball, Golfball und Murmel veranschaulicht nur Größenunterschiede, ist weder maßstabsgerecht noch ein Messverfahren. Lehm ist eine Klasse verschiedener Mischungen im Texturdreieck, nicht zwingend genau ein Drittel jeder Fraktion, keine vierte Teilchengruppe, Fruchtbarkeitsgarantie oder handelsübliche Blumenerde.\n\nSandigere Böden haben oft größere Porenwege und lassen Wasser schneller abfließen; Schluff kann mehr Wasser als Sand halten, aber zu Verdichtung und Erosion neigen; Ton kann je nach Mineraltyp und Bodenzustand Wasser und austauschbare Kationen halten. Nicht alles gebundene Wasser ist für Wurzeln nutzbar, und Vernässung kann Sauerstoff begrenzen. Ein Spielplatz, der rasch trocknen soll, könnte von mehr Sand profitieren; die tatsächliche Entwässerung hängt aber auch von Gefüge und Standort ab.', 'Nach der U Es De A-Einteilung der Feinerde misst Sand null Komma null fünf bis zwei Millimeter und fühlt sich meist körnig an; Schluff misst null Komma null null zwei bis null Komma null fünf Millimeter und wirkt trocken mehlig, nass seidig oder glatt; Ton ist kleiner als null Komma null null zwei Millimeter und kann nass klebrig und formbar sein. Der Vergleich mit Basketball, Golfball und Murmel veranschaulicht nur Größenunterschiede, ist weder maßstabsgerecht noch ein Messverfahren. Lehm ist eine Klasse verschiedener Mischungen im Texturdreieck, nicht zwingend genau ein Drittel jeder Fraktion, keine vierte Teilchengruppe, Fruchtbarkeitsgarantie oder handelsübliche Blumenerde.\n\nSandigere Böden haben oft größere Porenwege und lassen Wasser schneller abfließen; Schluff kann mehr Wasser als Sand halten, aber zu Verdichtung und Erosion neigen; Ton kann je nach Mineraltyp und Bodenzustand Wasser und austauschbare Kationen halten. Nicht alles gebundene Wasser ist für Wurzeln nutzbar, und Vernässung kann Sauerstoff begrenzen. Ein Spielplatz, der rasch trocknen soll, könnte von mehr Sand profitieren; die tatsächliche Entwässerung hängt aber auch von Gefüge und Standort ab.'), ('Stelle jedes gemischte Glas eben und ungestört ab, notiere Probenkennung und Schüttelende und folge dem ausgewählten Zeitplan. Das ausführliche Beispiel markiert die Oberkante der Sandschicht nach ungefähr 1–2 Minuten, die Schluffgrenze nach 2–4 Stunden und die letzte Tongrenze nach etwa 24–48 Stunden. Eine frühere Übersicht nennt ungefähr eine Minute, zwei Stunden und bis zu 24–48 Stunden; das ist dieselbe Lehrabfolge und kein zweites Verfahren, dessen Zahlen man in die Bewertung mischen sollte. Schwimmende organische Stoffe gehören nicht zur Höhe der mineralischen Schichten.\n\nEine Unterrichtsstunde von 75 Minuten bietet keine Beobachtung nach 48 Stunden. Die Lehrkraft darf zur Erklärung ein dokumentiertes, vorher abgesetztes Glas zeigen; du kehrst zu den vorgesehenen Phasen zu deinen eigenen Gläsern zurück. Halte wirkliche Zeiten, Schichthöhen und unklare Übergänge fest. Seitenlicht kann helfen, doch zeichne keine Linie, die du nicht siehst. Wenn ein Glas gestört wird oder zur gewählten Zeit trüb bleibt, melde es und nutze die festgelegte Regel für Wiederholung oder spätere Beobachtung. Ein Glas nach nur 15–20 Minuten zeigt keine endgültige Sand-Schluff-Ton-Zusammensetzung.', 'Stelle jedes gemischte Glas eben und ungestört ab, notiere Probenkennung und Schüttelende und folge dem ausgewählten Zeitplan. Das ausführliche Beispiel markiert die Oberkante der Sandschicht nach ungefähr eine bis zwei Minuten, die Schluffgrenze nach zwei bis vier Stunden und die letzte Tongrenze nach etwa vierundzwanzig bis achtundvierzig Stunden. Eine frühere Übersicht nennt ungefähr eine Minute, zwei Stunden und bis zu vierundzwanzig bis achtundvierzig Stunden; das ist dieselbe Lehrabfolge und kein zweites Verfahren, dessen Zahlen man in die Bewertung mischen sollte. Schwimmende organische Stoffe gehören nicht zur Höhe der mineralischen Schichten.\n\nEine Unterrichtsstunde von fünfundsiebzig Minuten bietet keine Beobachtung nach achtundvierzig Stunden. Die Lehrkraft darf zur Erklärung ein dokumentiertes, vorher abgesetztes Glas zeigen; du kehrst zu den vorgesehenen Phasen zu deinen eigenen Gläsern zurück. Halte wirkliche Zeiten, Schichthöhen und unklare Übergänge fest. Seitenlicht kann helfen, doch zeichne keine Linie, die du nicht siehst. Wenn ein Glas gestört wird oder zur gewählten Zeit trüb bleibt, melde es und nutze die festgelegte Regel für Wiederholung oder spätere Beobachtung. Ein Glas nach nur fünfzehn bis zwanzig Minuten zeigt keine endgültige Sand-Schluff-Ton-Zusammensetzung.'), ("Zerbrich Bodenklumpen, ohne Kies zu Sand zu zermahlen. Entferne Steine, Wurzeln und offensichtliche schwimmende Reste nach dem angegebenen Unterrichtsverfahren und halte drei verschiedene Proben eindeutig getrennt. Nach Dispersion in Wasser sinken größere sandgroße Körner gewöhnlich zuerst, danach ein großer Teil des Schluffs, während feiner Ton länger in Schwebe bleibt. Das Absetzen hängt von Größe, Dichte, Aggregation und Flüssigkeit ab; der Satz 'schwerer gewinnt immer' reicht nicht aus.\n\nEin durchsichtiges Glas mit geraden Wänden erleichtert das Erkennen der Schichthöhen. Die visuelle Schichtmethode liefert eine ungefähre Unterrichtsschätzung. USDA-Texturklassen beruhen auf Massenanteilen mineralischer Teilchen in der <2-mm-Fraktion, ermittelt durch anerkannte Laborverfahren oder kalibrierte Feldmethoden. Schichthöhe ist nicht automatisch Massenprozent; im nächsten Schritt bleiben Glasprozente daher Schätzwerte, deren Grenzen geprüft werden.", "Zerbrich Bodenklumpen, ohne Kies zu Sand zu zermahlen. Entferne Steine, Wurzeln und offensichtliche schwimmende Reste nach dem angegebenen Unterrichtsverfahren und halte drei verschiedene Proben eindeutig getrennt. Nach Dispersion in Wasser sinken größere sandgroße Körner gewöhnlich zuerst, danach ein großer Teil des Schluffs, während feiner Ton länger in Schwebe bleibt. Das Absetzen hängt von Größe, Dichte, Aggregation und Flüssigkeit ab; der Satz 'schwerer gewinnt immer' reicht nicht aus.\n\nEin durchsichtiges Glas mit geraden Wänden erleichtert das Erkennen der Schichthöhen. Die visuelle Schichtmethode liefert eine ungefähre Unterrichtsschätzung. U Es De A-Texturklassen beruhen auf Massenanteilen mineralischer Teilchen in der kleiner als zwei-Millimeter-Fraktion, ermittelt durch anerkannte Laborverfahren oder kalibrierte Feldmethoden. Schichthöhe ist nicht automatisch Massenprozent; im nächsten Schritt bleiben Glasprozente daher Schätzwerte, deren Grenzen geprüft werden.")]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s211-readings-audio-20261023-r1'
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
