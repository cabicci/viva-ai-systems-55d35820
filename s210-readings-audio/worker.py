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
IDS = ('S2-10-ar-EG-R01-r1', 'S2-10-ar-EG-R02-r1', 'S2-10-ar-EG-R03-r1', 'S2-10-ar-EG-R04-r1', 'S2-10-ar-EG-R05-r1', 'S2-10-ar-EG-R06-r1', 'S2-10-en-R01-r1', 'S2-10-en-R02-r1', 'S2-10-en-R03-r1', 'S2-10-en-R04-r1', 'S2-10-en-R05-r1', 'S2-10-en-R06-r1', 'S2-10-it-R01-r1', 'S2-10-it-R02-r1', 'S2-10-it-R03-r1', 'S2-10-it-R04-r1', 'S2-10-it-R05-r1', 'S2-10-it-R06-r1', 'S2-10-de-R01-r1', 'S2-10-de-R02-r1', 'S2-10-de-R03-r1', 'S2-10-de-R04-r1', 'S2-10-de-R05-r1', 'S2-10-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S210_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-10')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s210-readings-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('المادة العضوية جاية من كائنات حية وبقاياها المتحللة. ممكن تساعد تكتل حبيبات التربة وبناءها واحتفاظها بالماء ودورة العناصر. الفوائد دي مترابطة، لكن نسبة المادة العضوية وحدها ما تقيسش كل العناصر، ولا تثبت صرفًا جيدًا، ولا تشخص كل مشكلة في النبات.\n\nجدول الفصل بيستخدم 3–6% كمدى توضيحي واحد. المستويات المناسبة تختلف باختلاف قوام التربة والمناخ ونظام الزراعة وعمق أخذ العينة؛ أرض رملية وأخرى غنية بالطين مش لازم يكون لهم نفس المستوى الواقعي. استخدم طريقة المعمل المحلي وسياق الموقع بدل وصف «تربة صحية» عام.', 'المادة العضوية جاية من كائنات حية وبقاياها المتحللة. ممكن تساعد تكتل حبيبات التربة وبناءها واحتفاظها بالماء ودورة العناصر. الفوائد دي مترابطة، لكن نسبة المادة العضوية وحدها ما تقيسش كل العناصر، ولا تثبت صرف كويس، ولا تشخص كل مشكلة في النبات.\n\nجدول الفصل بيستخدم تلاتة إلى ستة في المية كمدى توضيحي واحد. المستويات المناسبة تختلف باختلاف قوام التربة والمناخ ونظام الزراعة وعمق أخذ العينة؛ أرض رملية وأخرى غنية بالطين مش لازم يكون لهم نفس المستوى الواقعي. استخدم طريقة المعمل المحلي وسياق الموقع بدل وصف «تربة صحية» عام.'), ('المدرّب المؤهل يسجل أولًا كتلة بوتقة نظيفة وجافة وفارغة. يضيف كمية ممثلة من تربة جففها الفرن ويسجل الكتلة مع البوتقة. حسب إجراء المعمل المعتمد، تُسخن البوتقة المحملة في فرن حرق مضبوط، وتبرد بالطريقة المحددة، ثم تُوزن تاني. سجّل هوية البوتقة وكل الأوزان قبل الحساب.\n\nتجفيف العينة أولًا يفصل الرطوبة العادية عن الفقد اللاحق بالحرق. والتبريد المضبوط يمنع لمسًا خطرًا ووزنًا غير ثابت؛ أداة التبريد وشروطه يحددهم إجراء المعمل. كطالب، ما ترفعش أو تفتح أو توزن بوتقة ساخنة. فرن الحرارة العالية يحتاج جهاز الموقع ووقاية وتهوية وعاملًا مدربًا.', 'المدرّب المؤهل بيسجل الأول كتلة بوتقة نظيفة وجافة وفارغة. يضيف كمية ممثلة من تربة جففها الفرن ويسجل الكتلة مع البوتقة. حسب إجراء المعمل المعتمد، البوتقة المحملة بتتسخن في فرن حرق مضبوط، وتبرد بالطريقة المحددة، وبعدين بتتوزن تاني. سجّل هوية البوتقة وكل الأوزان قبل الحساب.\n\nتجفيف العينة الأول بيفصل الرطوبة العادية عن الفقد اللاحق بالحرق. والتبريد المضبوط يمنع لمس خطر ووزن مش ثابت؛ أداة التبريد وشروطه يحددهم إجراء المعمل. كطالب، ما ترفعش أو تفتح أو توزن بوتقة ساخنة. فرن الحرارة العالية يحتاج جهاز الموقع ووقاية وتهوية وعامل مدرّب.'), ('جدول الفصل يعتبر المادة العضوية أقل من 2% منخفضة، و3–6% مناسبة، وفوق 6% مرتفعة، لكنه سايب 2–3% من غير فئة. حافظ على الفراغ ده: 2.5% ما ينفعش نحطها في واحد من الصفوف الثلاثة بالتخمين. الجدول نفسه بيقول ارجع لإرشاد المعمل أو المنطقة.\n\nالرقم الأعلى مش أفضل تلقائيًا لكل محصول. راجع عمق العينة وقوام التربة والمناخ وتاريخ الإدارة وطريقة التحليل وتفسير المعمل. الكمبوست أو السماد المتحلل أو محاصيل التغطية ممكن يكونوا مناسبين في ظروف معينة، لكن جودة المادة وعناصرها وأملاحها مهمة، وما فيش كمية تخرج من النسبة وحدها.', 'جدول الفصل يعتبر المادة العضوية أقل من اتنين في المية منخفضة، وتلاتة إلى ستة في المية مناسبة، وفوق ستة في المية مرتفعة، لكنه سايب اتنين إلى تلاتة في المية من غير فئة. حافظ على الفراغ ده: اتنين فاصلة خمسة في المية ما ينفعش نحطها في واحد من الصفوف الثلاثة بالتخمين. الجدول نفسه بيقول ارجع لإرشاد المعمل أو المنطقة.\n\nالرقم الأعلى مش أفضل بشكل تلقائي لكل محصول. راجع عمق العينة وقوام التربة والمناخ وتاريخ الإدارة وطريقة التحليل وتفسير المعمل. الكمبوست أو السماد المتحلل أو محاصيل التغطية ممكن يكونوا مناسبين في ظروف معينة، لكن جودة المادة وعناصرها وأملاحها مهمة، وما فيش كمية تخرج من النسبة وحدها.'), ('خلّي C كتلة البوتقة الفارغة، وD كتلتها مع التربة المجففة في الفرن قبل الحرق، وI كتلتها مع الباقي بعد الحرق والتبريد، كلها بالجرام. كتلة التربة الجافة أولًا D−C، والفقد المرصود D−I. احسب LOI% = 100×(D−I)/(D−C)، بشرط D−C موجب وإن كل الأوزان من نفس الطريقة المعلنة.\n\nالبوتقة موجودة في الوزنين المجمعين، فكتلتها بتُلغى عند حساب الفقد. القسمة على D بدل D−C تدخل كتلة البوتقة في المقام وتقلل النسبة خطأ. سيب الأرقام وخطوات الحساب واضحة؛ نسبة من غير تفسير مصدرها مش ملاحظة مفيدة.', 'خلّي سي كتلة البوتقة الفارغة، ودي كتلتها مع التربة المجففة في الفرن قبل الحرق، وآي كتلتها مع الباقي بعد الحرق والتبريد، كلها بالجرام. كتلة التربة الجافة أولًا دي ناقص سي، والفقد المرصود دي ناقص آي. احسب إل أو آي في المية بتساوي مية مضروبة في ناتج دي ناقص آي، مقسوم على ناتج دي ناقص سي، بشرط دي ناقص سي موجب وإن كل الأوزان من نفس الطريقة المعلنة.\n\nالبوتقة موجودة في الوزنين المجمعين، فكتلتها بتتلغي عند حساب الفقد. القسمة على دي بدل دي ناقص سي تدخل كتلة البوتقة في المقام وتقلل النسبة خطأ. سيب الأرقام وخطوات الحساب واضحة؛ نسبة من غير تفسير مصدرها مش ملاحظة مفيدة.'), ('دي أرقام مصطنعة للتدريب على الحساب، مش قياس حقل: بوتقة فارغة C=30.00 g؛ بوتقة مع تربة مجففة في الفرن D=35.00 g؛ بوتقة باردة مع الباقي بعد الحرق I=34.75 g. التربة الجافة 5.00 g، والفقد 0.25 g. إذن LOI = 0.25/5.00×100 = 5.0% من كتلة التربة المجففة.\n\nلو الوزن الأخير ناقص أو مش متأكد إن العينة جافة، ما تملاش الفراغ برقم شكله معقول. علّم النتيجة إنها غير مكتملة واطلب سجل المعمل أو إعادة الاختبار حسب إجراءه.', 'دي أرقام مصطنعة للتدريب على الحساب، مش قياس حقل: بوتقة فارغة سي بتساوي تلاتين فاصلة صفر صفر جرام؛ بوتقة مع تربة مجففة في الفرن دي بتساوي خمسة وتلاتين فاصلة صفر صفر جرام؛ بوتقة باردة مع الباقي بعد الحرق آي بتساوي أربعة وتلاتين فاصلة سبعة خمسة جرام. التربة الجافة خمسة فاصلة صفر صفر جرام، والفقد صفر فاصلة اتنين خمسة جرام. إذن إل أو آي بتساوي صفر فاصلة اتنين خمسة مقسومة على خمسة فاصلة صفر صفر ، والناتج مضروب في مية بتساوي خمسة فاصلة صفر في المية من كتلة التربة المجففة.\n\nلو الوزن الأخير ناقص أو مش متأكد إن العينة جافة، ما تملاش الفراغ برقم شكله معقول. علّم النتيجة إنها غير مكتملة واطلب سجل المعمل أو إعادة الاختبار حسب إجراءه.'), ('مثال المدرّس بيذكر نحو 400–500°C لعدة ساعات، لكن المدى ده وحده مش تعليمات تشغيل كاملة. المعمل لازم يحدد تجهيز العينة والبوتقة وجدول التجفيف والحرق والتبريد وعينات الشاهد (البلانك) أو فحوص الجودة والسلامة قبل اختبار حقيقي. طرق بدرجات وأوقات مختلفة مش تلقائيًا قابلة للمقارنة.\n\nLOI يصف الكتلة المفقودة تحت الطريقة المختارة. حسب معادن التربة وظروف القياس، رطوبة متبقية أو ماء مرتبط بالطين أو فقد غير عضوي آخر ممكن يدخل في الرقم؛ وبعض الكربونات قد تؤثر في طرق معينة. لذلك ظهور 5.0% LOI مش إعلان إن المادة العضوية بالضبط 5.0% في كل تربة. قارن الطرق أو اطلب تفسير معمل مناسب قبل الاستنتاج.', 'مثال المدرّس بيذكر نحو أربعمية إلى خمسمية درجة مئوية لعدة ساعات، لكن المدى ده وحده مش تعليمات تشغيل كاملة. المعمل لازم يحدد تجهيز العينة والبوتقة وجدول التجفيف والحرق والتبريد وعينات الشاهد (البلانك) أو فحوص الجودة والسلامة قبل اختبار حقيقي. طرق بدرجات وأوقات مختلفة مش بشكل تلقائي قابلة للمقارنة.\n\nإل أو آي يصف الكتلة المفقودة تحت الطريقة المختارة. حسب معادن التربة وظروف القياس، رطوبة متبقية أو ماء مرتبط بالطين أو فقد غير عضوي آخر ممكن يدخل في الرقم؛ وبعض الكربونات قد تؤثر في طرق معينة. لذلك ظهور خمسة فاصلة صفر في المية إل أو آي مش إعلان إن المادة العضوية بالضبط خمسة فاصلة صفر في المية في كل تربة. قارن الطرق أو اطلب تفسير معمل مناسب قبل الاستنتاج.')], 'en': [('Let C be the empty crucible mass, D the crucible plus oven-dry soil before ignition, and I the cooled crucible plus residue after ignition, all in grams. Initial dry soil mass is D−C. The observed ignition mass loss is D−I. Calculate LOI% = 100×(D−I)/(D−C), provided D−C is positive and all masses follow the same declared method.\n\nThe crucible is part of both combined weighings, so it cancels in the loss. Dividing by D instead of D−C would dilute the answer with vessel mass. Keep the values and arithmetic visible; an unexplained percentage is not a usable observation.', 'Let C be the empty crucible mass, D the crucible plus oven-dry soil before ignition, and I the cooled crucible plus residue after ignition, all in grams. Initial dry soil mass is D minus C. The observed ignition mass loss is D minus I. Calculate L O I percent equals one hundred multiplied by the difference D minus I, divided by the difference D minus C, provided D minus C is positive and all masses follow the same declared method.\n\nThe crucible is part of both combined weighings, so it cancels in the loss. Dividing by D instead of D minus C would dilute the answer with vessel mass. Keep the values and arithmetic visible; an unexplained percentage is not a usable observation.'), ("Organic matter comes from living material and its decomposed remains. It can help soil aggregation and structure, water retention and nutrient cycling. These are linked benefits, but an organic-matter percentage alone does not measure every nutrient, prove good drainage or diagnose all plant problems.\n\nA classroom table uses 3–6% as one illustrative interval. Organic-matter levels differ with texture, climate, crop system and sampling depth; a sandy soil and a clay-rich soil need not have the same realistic benchmark. Use a local laboratory's method and site context rather than a universal healthy-soil label.", "Organic matter comes from living material and its decomposed remains. It can help soil aggregation and structure, water retention and nutrient cycling. These are linked benefits, but an organic-matter percentage alone does not measure every nutrient, prove good drainage or diagnose all plant problems.\n\nA classroom table uses three to six percent as one illustrative interval. Organic-matter levels differ with texture, climate, crop system and sampling depth; a sandy soil and a clay-rich soil need not have the same realistic benchmark. Use a local laboratory's method and site context rather than a universal healthy-soil label."), ("The classroom table marks organic matter below 2% as Low, 3–6% as Optimum and above 6% as High, leaving the 2–3% interval undefined. Preserve that gap when reading it: 2.5% cannot be placed in one of its three rows by guesswork. The table itself says to consult laboratory-specific or regional guidance.\n\nA higher number is not automatically better in every crop system. First check sampling depth, soil texture, climate, management history, analytical method and the laboratory's interpretation. Compost, aged manure or cover crops may be considered when appropriate, but material quality, nutrients and salts matter and no amount follows from the percentage alone.", "The classroom table marks organic matter below two percent as Low, three to six percent as Optimum and above six percent as High, leaving the two to three percent interval undefined. Preserve that gap when reading it: two point five percent cannot be placed in one of its three rows by guesswork. The table itself says to consult laboratory-specific or regional guidance.\n\nA higher number is not automatically better in every crop system. First check sampling depth, soil texture, climate, management history, analytical method and the laboratory's interpretation. Compost, aged manure or cover crops may be considered when appropriate, but material quality, nutrients and salts matter and no amount follows from the percentage alone."), ('The teacher example mentions roughly 400–500°C for several hours, but that range alone is not a complete standard operating procedure. A laboratory must define its sample preparation, vessel, drying and ignition schedule, cooling, blanks or quality checks and safety controls before a real test. Methods at other temperatures and times are not automatically interchangeable.\n\nLOI reports the mass lost under the selected method. Depending on mineral composition and conditions, residual moisture, water held by clays or other inorganic contributions can add to the loss; some carbonates may be relevant under particular methods. Therefore a displayed 5.0% LOI should not be advertised as exactly 5.0% organic matter in every soil. Compare methods or seek an appropriate laboratory interpretation before making that inference.', 'The teacher example mentions roughly four hundred to five hundred degrees Celsius for several hours, but that range alone is not a complete standard operating procedure. A laboratory must define its sample preparation, vessel, drying and ignition schedule, cooling, blanks or quality checks and safety controls before a real test. Methods at other temperatures and times are not automatically interchangeable.\n\nL O I reports the mass lost under the selected method. Depending on mineral composition and conditions, residual moisture, water held by clays or other inorganic contributions can add to the loss; some carbonates may be relevant under particular methods. Therefore a displayed five point zero percent L O I should not be advertised as exactly five point zero percent organic matter in every soil. Compare methods or seek an appropriate laboratory interpretation before making that inference.'), ('These are made-up numbers for calculation practice, not a field measurement: empty crucible C=30.00 g; crucible plus oven-dry soil D=35.00 g; cooled crucible plus post-ignition residue I=34.75 g. Dry soil is 5.00 g. Loss is 0.25 g. Thus LOI is 0.25/5.00×100 = 5.0% by mass on the oven-dry soil basis.\n\nIf the final mass were missing or the sample were not confirmed dry, do not fill the blank with a plausible number. Mark the result incomplete and seek the laboratory record or repeat according to its procedure.', 'These are made-up numbers for calculation practice, not a field measurement: empty crucible C equals thirty point zero zero grams; crucible plus oven-dry soil D equals thirty-five point zero zero grams; cooled crucible plus post-ignition residue I equals thirty-four point seven five grams. Dry soil is five point zero zero grams. Loss is zero point two five grams. Thus L O I is zero point two five divided by five point zero zero, with the result multiplied by one hundred equals five point zero percent by mass on the oven-dry soil basis.\n\nIf the final mass were missing or the sample were not confirmed dry, do not fill the blank with a plausible number. Mark the result incomplete and seek the laboratory record or repeat according to its procedure.')], 'it': [("Indica con C la massa del crogiolo vuoto, con D quella del crogiolo più suolo essiccato prima dell'ignizione, e con I quella del crogiolo raffreddato più residuo dopo l'ignizione, tutte in grammi. La massa iniziale del suolo asciutto è D−C; la perdita osservata è D−I. Calcola LOI% = 100×(D−I)/(D−C), purché D−C sia positiva e tutte le masse seguano lo stesso metodo dichiarato.\n\nIl crogiolo compare in entrambe le pesate combinate e si elimina nel calcolo della perdita. Dividere per D anziché D−C diluirebbe il risultato con la massa del recipiente. Mostra valori e passaggi: una percentuale senza spiegazione non è un'osservazione utilizzabile.", "Indica con ci la massa del crogiolo vuoto, con di quella del crogiolo più suolo essiccato prima dell'ignizione, e con i quella del crogiolo raffreddato più residuo dopo l'ignizione, tutte in grammi. La massa iniziale del suolo asciutto è di meno ci; la perdita osservata è di meno i. Calcola elle o i per cento uguale a cento moltiplicato per la differenza di meno i, diviso per la differenza di meno ci, purché di meno ci sia positiva e tutte le masse seguano lo stesso metodo dichiarato.\n\nIl crogiolo compare in entrambe le pesate combinate e si elimina nel calcolo della perdita. Dividere per di anziché di meno ci diluirebbe il risultato con la massa del recipiente. Mostra valori e passaggi: una percentuale senza spiegazione non è un'osservazione utilizzabile."), ("L'esempio del manuale cita circa 400–500°C per diverse ore, ma questo intervallo non costituisce da solo una procedura operativa completa. Prima di una prova reale il laboratorio deve definire preparazione del campione, recipiente, programma di essiccazione e ignizione, raffreddamento, controlli di qualità e sicurezza. Metodi con temperature o tempi diversi non sono automaticamente confrontabili.\n\nLa LOI riporta la massa persa con il metodo scelto. In base alla composizione minerale e alle condizioni, umidità residua, acqua trattenuta dalle argille o altri contributi inorganici possono aumentare la perdita; con certi metodi possono contare anche alcuni carbonati. Perciò un valore LOI di 5.0% non va pubblicizzato come esattamente 5.0% di sostanza organica in ogni suolo. Confronta i metodi o chiedi l'interpretazione di un laboratorio idoneo prima di trarre questa conclusione.", "L'esempio del manuale cita circa tra quattrocento e cinquecento gradi Celsius per diverse ore, ma questo intervallo non costituisce da solo una procedura operativa completa. Prima di una prova reale il laboratorio deve definire preparazione del campione, recipiente, programma di essiccazione e ignizione, raffreddamento, controlli di qualità e sicurezza. Metodi con temperature o tempi diversi non sono automaticamente confrontabili.\n\nLa elle o i riporta la massa persa con il metodo scelto. In base alla composizione minerale e alle condizioni, umidità residua, acqua trattenuta dalle argille o altri contributi inorganici possono aumentare la perdita; con certi metodi possono contare anche alcuni carbonati. Perciò un valore elle o i di cinque virgola zero per cento non va pubblicizzato come esattamente cinque virgola zero per cento di sostanza organica in ogni suolo. Confronta i metodi o chiedi l'interpretazione di un laboratorio idoneo prima di trarre questa conclusione."), ("La sostanza organica proviene da organismi viventi e dai loro resti decomposti. Può favorire aggregazione e struttura del suolo, ritenzione idrica e ciclo degli elementi nutritivi. Sono benefici collegati, ma la sua percentuale da sola non misura tutti i nutrienti, non dimostra un buon drenaggio e non diagnostica ogni problema della coltura.\n\nUna tabella didattica usa 3–6% come intervallo illustrativo. Il contenuto di sostanza organica cambia con tessitura, clima, sistema colturale e profondità di campionamento: un suolo sabbioso e uno ricco d'argilla non devono avere lo stesso valore di riferimento realistico. Usa il metodo del laboratorio locale e il contesto del sito, non un'etichetta universale di suolo sano.", "La sostanza organica proviene da organismi viventi e dai loro resti decomposti. Può favorire aggregazione e struttura del suolo, ritenzione idrica e ciclo degli elementi nutritivi. Sono benefici collegati, ma la sua percentuale da sola non misura tutti i nutrienti, non dimostra un buon drenaggio e non diagnostica ogni problema della coltura.\n\nUna tabella didattica usa da tre a sei per cento come intervallo illustrativo. Il contenuto di sostanza organica cambia con tessitura, clima, sistema colturale e profondità di campionamento: un suolo sabbioso e uno ricco d'argilla non devono avere lo stesso valore di riferimento realistico. Usa il metodo del laboratorio locale e il contesto del sito, non un'etichetta universale di suolo sano."), ("La tabella didattica indica sostanza organica sotto 2% come bassa, 3–6% come ottimale e sopra 6% come alta, lasciando non classificato l'intervallo 2–3%. Conserva quel vuoto nell'interpretazione: non assegnare 2.5% a una delle tre righe per supposizione. La tabella stessa rimanda a indicazioni specifiche del laboratorio o della regione.\n\nUn valore più alto non è automaticamente migliore in ogni sistema colturale. Controlla prima profondità di prelievo, tessitura, clima, gestione precedente, metodo analitico e interpretazione del laboratorio. Compost, letame maturo o colture di copertura possono essere valutati dove appropriato, ma qualità, nutrienti e sali contano; dalla sola percentuale non deriva alcuna dose.", "La tabella didattica indica sostanza organica sotto due per cento come bassa, da tre a sei per cento come ottimale e sopra sei per cento come alta, lasciando non classificato l'intervallo da due a tre per cento. Conserva quel vuoto nell'interpretazione: non assegnare due virgola cinque per cento a una delle tre righe per supposizione. La tabella stessa rimanda a indicazioni specifiche del laboratorio o della regione.\n\nUn valore più alto non è automaticamente migliore in ogni sistema colturale. Controlla prima profondità di prelievo, tessitura, clima, gestione precedente, metodo analitico e interpretazione del laboratorio. Compost, letame maturo o colture di copertura possono essere valutati dove appropriato, ma qualità, nutrienti e sali contano; dalla sola percentuale non deriva alcuna dose."), ("Questi numeri sono inventati per esercitarsi nel calcolo, non provengono da una misura in campo: crogiolo vuoto C=30.00 g; crogiolo con suolo essiccato D=35.00 g; crogiolo raffreddato con residuo I=34.75 g. Il suolo asciutto pesa 5.00 g. La perdita è 0.25 g. Quindi la LOI è 0.25/5.00×100 = 5.0% in massa, riferita al suolo essiccato.\n\nSe manca la massa finale o non è confermata l'essiccazione del campione, non riempire il vuoto con un numero verosimile. Segna il risultato come incompleto e recupera il registro di laboratorio o ripeti secondo la sua procedura.", "Questi numeri sono inventati per esercitarsi nel calcolo, non provengono da una misura in campo: crogiolo vuoto ci uguale a trenta virgola zero zero grammi; crogiolo con suolo essiccato di uguale a trentacinque virgola zero zero grammi; crogiolo raffreddato con residuo i uguale a trentaquattro virgola sette cinque grammi. Il suolo asciutto pesa cinque virgola zero zero grammi. La perdita è zero virgola due cinque grammi. Quindi la elle o i è zero virgola due cinque diviso per cinque virgola zero zero, con il risultato moltiplicato per cento uguale a cinque virgola zero per cento in massa, riferita al suolo essiccato.\n\nSe manca la massa finale o non è confermata l'essiccazione del campione, non riempire il vuoto con un numero verosimile. Segna il risultato come incompleto e recupera il registro di laboratorio o ripeti secondo la sua procedura.")], 'de': [('C bezeichnet die Masse des leeren Tiegels, D die Masse von Tiegel und ofentrockenem Boden vor dem Glühen und I die Masse des abgekühlten Tiegels mit Rückstand nach dem Glühen; alle Werte sind in Gramm. Die anfängliche Trockenbodenmasse beträgt D−C, der beobachtete Glühverlust D−I. Berechne LOI% = 100×(D−I)/(D−C), sofern D−C positiv ist und alle Massen nach demselben angegebenen Verfahren bestimmt wurden.\n\nDer Tiegel ist in beiden kombinierten Wägungen enthalten und fällt bei der Verlustrechnung heraus. Eine Division durch D statt durch D−C würde das Ergebnis durch die Gefäßmasse verfälschen. Zeige Werte und Rechenschritte; ein unerklärter Prozentsatz ist keine brauchbare Beobachtung.', 'Ce bezeichnet die Masse des leeren Tiegels, De die Masse von Tiegel und ofentrockenem Boden vor dem Glühen und I die Masse des abgekühlten Tiegels mit Rückstand nach dem Glühen; alle Werte sind in Gramm. Die anfängliche Trockenbodenmasse beträgt De minus Ce, der beobachtete Glühverlust De minus I. Berechne El O I Prozent gleich einhundert mal die Differenz De minus I, geteilt durch die Differenz De minus Ce, sofern De minus Ce positiv ist und alle Massen nach demselben angegebenen Verfahren bestimmt wurden.\n\nDer Tiegel ist in beiden kombinierten Wägungen enthalten und fällt bei der Verlustrechnung heraus. Eine Division durch De statt durch De minus Ce würde das Ergebnis durch die Gefäßmasse verfälschen. Zeige Werte und Rechenschritte; ein unerklärter Prozentsatz ist keine brauchbare Beobachtung.'), ('Das Beispiel im Lehrtext erwähnt etwa 400–500°C über mehrere Stunden. Diese Angabe allein ist keine vollständige Arbeitsanweisung. Vor einer echten Untersuchung muss das Labor Probenvorbereitung, Gefäß, Trocknungs- und Glühprogramm, Abkühlung, Blindproben oder Qualitätskontrollen und Sicherheitsmaßnahmen festlegen. Verfahren mit anderen Temperaturen oder Zeiten sind nicht automatisch vergleichbar.\n\nLOI beschreibt den Massenverlust unter dem gewählten Verfahren. Je nach Mineralbestand und Bedingungen können Restfeuchte, an Tonmineralen gebundenes Wasser oder andere anorganische Anteile zum Verlust beitragen; bei bestimmten Verfahren können auch Carbonate relevant sein. Ein angezeigter LOI-Wert von 5.0% darf deshalb nicht für jeden Boden als exakt 5.0% organische Substanz bezeichnet werden. Vergleiche Verfahren oder hole eine geeignete Laborinterpretation ein, bevor du das folgerst.', 'Das Beispiel im Lehrtext erwähnt etwa vierhundert bis fünfhundert Grad Celsius über mehrere Stunden. Diese Angabe allein ist keine vollständige Arbeitsanweisung. Vor einer echten Untersuchung muss das Labor Probenvorbereitung, Gefäß, Trocknungs- und Glühprogramm, Abkühlung, Blindproben oder Qualitätskontrollen und Sicherheitsmaßnahmen festlegen. Verfahren mit anderen Temperaturen oder Zeiten sind nicht automatisch vergleichbar.\n\nEl O I beschreibt den Massenverlust unter dem gewählten Verfahren. Je nach Mineralbestand und Bedingungen können Restfeuchte, an Tonmineralen gebundenes Wasser oder andere anorganische Anteile zum Verlust beitragen; bei bestimmten Verfahren können auch Carbonate relevant sein. Ein angezeigter El O I-Wert von fünf Komma null Prozent darf deshalb nicht für jeden Boden als exakt fünf Komma null Prozent organische Substanz bezeichnet werden. Vergleiche Verfahren oder hole eine geeignete Laborinterpretation ein, bevor du das folgerst.'), ('Die Unterrichtstabelle bezeichnet organische Substanz unter 2% als niedrig, 3–6% als optimal und über 6% als hoch; für 2–3% gibt sie keine Kategorie an. Erhalte diese Lücke bei der Interpretation: 2.5% darf nicht durch Raten einer der drei Zeilen zugeordnet werden. Die Tabelle selbst verweist auf labor- oder regionsspezifische Hinweise.\n\nEin höherer Wert ist nicht in jedem Anbausystem automatisch besser. Prüfe zuerst Probenahmetiefe, Textur, Klima, Bewirtschaftung, Analysenverfahren und Laborinterpretation. Kompost, abgelagerter Mist oder Zwischenfrüchte können gegebenenfalls erwogen werden; Qualität, Nährstoffe und Salze sind dabei wichtig, und aus dem Prozentwert allein folgt keine Aufwandmenge.', 'Die Unterrichtstabelle bezeichnet organische Substanz unter zwei Prozent als niedrig, drei bis sechs Prozent als optimal und über sechs Prozent als hoch; für zwei bis drei Prozent gibt sie keine Kategorie an. Erhalte diese Lücke bei der Interpretation: zwei Komma fünf Prozent darf nicht durch Raten einer der drei Zeilen zugeordnet werden. Die Tabelle selbst verweist auf labor- oder regionsspezifische Hinweise.\n\nEin höherer Wert ist nicht in jedem Anbausystem automatisch besser. Prüfe zuerst Probenahmetiefe, Textur, Klima, Bewirtschaftung, Analysenverfahren und Laborinterpretation. Kompost, abgelagerter Mist oder Zwischenfrüchte können gegebenenfalls erwogen werden; Qualität, Nährstoffe und Salze sind dabei wichtig, und aus dem Prozentwert allein folgt keine Aufwandmenge.'), ('Diese Zahlen sind für die Rechenübung erfunden und keine Feldmessung: leerer Tiegel C=30.00 g; Tiegel mit ofentrockenem Boden D=35.00 g; abgekühlter Tiegel mit Glührückstand I=34.75 g. Die Trockenbodenmasse beträgt 5.00 g, der Verlust 0.25 g. Damit ist LOI 0.25/5.00×100 = 5.0% der Masse bezogen auf den ofentrockenen Boden.\n\nFehlt die Endmasse oder ist die Trocknung der Probe nicht bestätigt, ergänze keinen scheinbar plausiblen Wert. Markiere das Ergebnis als unvollständig und fordere das Laborprotokoll an oder wiederhole die Messung nach dessen Verfahren.', 'Diese Zahlen sind für die Rechenübung erfunden und keine Feldmessung: leerer Tiegel Ce gleich dreißig Komma null null Gramm; Tiegel mit ofentrockenem Boden De gleich fünfunddreißig Komma null null Gramm; abgekühlter Tiegel mit Glührückstand I gleich vierunddreißig Komma sieben fünf Gramm. Die Trockenbodenmasse beträgt fünf Komma null null Gramm, der Verlust null Komma zwei fünf Gramm. Damit ist El O I null Komma zwei fünf geteilt durch fünf Komma null null, das Ergebnis mal einhundert gleich fünf Komma null Prozent der Masse bezogen auf den ofentrockenen Boden.\n\nFehlt die Endmasse oder ist die Trocknung der Probe nicht bestätigt, ergänze keinen scheinbar plausiblen Wert. Markiere das Ergebnis als unvollständig und fordere das Laborprotokoll an oder wiederhole die Messung nach dessen Verfahren.'), ('Organische Substanz stammt von Lebewesen und ihren zersetzten Resten. Sie kann Bodenaggregate und Struktur, Wasserspeicherung und Nährstoffkreisläufe unterstützen. Diese Wirkungen hängen zusammen; der Prozentwert allein misst aber nicht alle Nährstoffe, belegt keine gute Drainage und erklärt nicht jedes Pflanzenproblem.\n\nEine Unterrichtstabelle nennt 3–6% als beispielhaften Bereich. Der Gehalt an organischer Substanz unterscheidet sich je nach Textur, Klima, Anbausystem und Probenahmetiefe; für sandige und tonreiche Böden muss derselbe Richtwert nicht realistisch sein. Nutze das Verfahren des örtlichen Labors und den Standortkontext statt eines allgemeinen Etiketts für gesunden Boden.', 'Organische Substanz stammt von Lebewesen und ihren zersetzten Resten. Sie kann Bodenaggregate und Struktur, Wasserspeicherung und Nährstoffkreisläufe unterstützen. Diese Wirkungen hängen zusammen; der Prozentwert allein misst aber nicht alle Nährstoffe, belegt keine gute Drainage und erklärt nicht jedes Pflanzenproblem.\n\nEine Unterrichtstabelle nennt drei bis sechs Prozent als beispielhaften Bereich. Der Gehalt an organischer Substanz unterscheidet sich je nach Textur, Klima, Anbausystem und Probenahmetiefe; für sandige und tonreiche Böden muss derselbe Richtwert nicht realistisch sein. Nutze das Verfahren des örtlichen Labors und den Standortkontext statt eines allgemeinen Etiketts für gesunden Boden.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s210-readings-audio-20261023-r1'
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
