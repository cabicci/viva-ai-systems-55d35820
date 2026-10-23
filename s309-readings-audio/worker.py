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
IDS = ('S3-09-ar-EG-R01-r1', 'S3-09-ar-EG-R02-r1', 'S3-09-ar-EG-R03-r1', 'S3-09-ar-EG-R04-r1', 'S3-09-ar-EG-R05-r1', 'S3-09-ar-EG-R06-r1', 'S3-09-ar-EG-R07-r1', 'S3-09-en-R01-r1', 'S3-09-en-R02-r1', 'S3-09-en-R03-r1', 'S3-09-en-R04-r1', 'S3-09-en-R05-r1', 'S3-09-en-R06-r1', 'S3-09-en-R07-r1', 'S3-09-it-R01-r1', 'S3-09-it-R02-r1', 'S3-09-it-R03-r1', 'S3-09-it-R04-r1', 'S3-09-it-R05-r1', 'S3-09-it-R06-r1', 'S3-09-it-R07-r1', 'S3-09-de-R01-r1', 'S3-09-de-R02-r1', 'S3-09-de-R03-r1', 'S3-09-de-R04-r1', 'S3-09-de-R05-r1', 'S3-09-de-R06-r1', 'S3-09-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S309_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s309-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R07': ('A', 'Charon', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1'], 'R07': ['/reading/6/paragraphs/0', '/reading/6/paragraphs/1', '/reading/6/paragraphs/2']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الأصل يسرد الشعير والكينوا وبنجر السكر ونخيل البلح والهليون والفستق كمرشحين متحملين للملح، ويختار الشعير مع السورجم أو اللوبيا كنموذج للقطعة. احتفظ بكل اسم، لكن «عالٍ» و«متوسط» في الجدول ما يختاروش محصولًا لو طريقة EC مجهولة. قارن مرجع تحمل موثوقًا بـ ECe للتربة وECw للماء بنفس طرق القياس، وافحص مخاطر الأيونات، وتحمل البادرات مقارنة بالنباتات الناضجة، والصنف، والإنتاجية المستهدفة، والظروف المحلية. الشعير وبنجر السكر نسبيًا أعلى تحملًا في جداول FAO من بعض المحاصيل الأخرى؛ ولا واحد محصن ضد الملح. في ملحق 1 من مرجع FAO، جدول A1.1 بيصنّف الهليون T، يعني متحمّل للملوحة، مش «متوسط» زي جدول الأصل. ده تصنيف نسبي بشروط قياس ملوحة التربة ومرحلة النمو المذكورة في المرجع، مش ضمان لنجاحه في أي حقل.\n\nالمحصول الزراعي التقليدي المتحمل للملح مش بالضرورة نباتًا ملحيًا «هالوفيت». تحمل الكينوا يتغير بالصنف والمرحلة؛ نخيل البلح قد يحتمل نسبيًا لكنه يحتاج وقتًا واستثمارًا طويلين؛ الهليون معمر وله إدارة خاصة. الفستق مش وصفة جاهزة لـ«ملوحة متوسطة»: الأصل الجذري والطعم والعمر والأيونات وشتاء المنطقة وجدوى البستان مهمة. اختار محصولين *مرشحين* مع سبب للجفاف وآخر للملح، واذكر أي فحص قد يغيّر كل اختيار.', 'الأصل يسرد الشعير والكينوا وبنجر السكر ونخيل البلح والهليون والفستق كمرشحين متحملين للملح، ويختار الشعير مع السورجم أو اللوبيا كنموذج للقطعة. احتفظ بكل اسم، لكن «عالٍ» و«متوسط» في الجدول ما يختاروش محصول لو طريقة إي سي مجهولة. قارن مرجع تحمل موثوق بـ إي سي إي للتربة وإي سي دبليو للماء بنفس طرق القياس، وافحص مخاطر الأيونات، وتحمل البادرات مقارنة بالنباتات الناضجة، والصنف، والإنتاجية المستهدفة، والظروف المحلية. الشعير وبنجر السكر نسبيًا أعلى تحملًا في جداول الفاو من بعض المحاصيل الأخرى؛ ولا واحد محصن ضد الملح. في ملحق واحد من مرجع الفاو، جدول إيه واحد نقطة واحد بيصنّف الهليون تي، يعني متحمّل للملوحة، مش «متوسط» زي جدول الأصل. ده تصنيف نسبي بشروط قياس ملوحة التربة ومرحلة النمو المذكورة في المرجع، مش ضمان لنجاحه في أي حقل.\n\nالمحصول الزراعي التقليدي المتحمل للملح مش بالضرورة نبات ملحي «هالوفيت». تحمل الكينوا يتغير بالصنف والمرحلة؛ نخيل البلح ممكن يحتمل نسبيًا لكنه يحتاج وقت واستثمار طويلين؛ الهليون معمر وله إدارة خاصة. الفستق مش وصفة جاهزة لـ«ملوحة متوسطة»: الأصل الجذري والطعم والعمر والأيونات وشتاء المنطقة وجدوى البستان مهمة. اختار محصولين مرشحين مع سبب للجفاف وآخر للملح، واذكر أي فحص قد يغيّر كل اختيار.'), ('الأول اتأكد من أخذ العينة وطريقة المعمل، وحلّل مياه البئر. افحص ميل الأرض وعمق منطقة الجذور وأي طبقة صلبة ودخول الميه في التربة ومخرج الصرف. لو الملوحة اتأكدت وفيه ميه مناسبة وصرف كافي، خطة محلية بيعدّها مختص ممكن تشمل غسل أملاح منضبط؛ ما تحددش كمية من التقرير الناقص. لو الصرف غير كافي أو الميه بتضيف حمل أملاح غير مناسب، لازم تتعامل مع القيود دي قبل ما توعد بغسل الأملاح أو نجاح محصول جديد.\n\nالمادة العضوية وغطاء السطح ممكن يساعدوا الخزن والبناء ويقللوا البخر؛ ما يعملوش مخرج صرف ولا يحولوا ماء غير مناسب لماء مناسب. رتّب الأولويات حسب القيد الأهم والمحصول والتكلفة. بعد التدخل، أعد القياس بنفس طريقة EC وعلى أعماق قابلة للمقارنة، وراقب استجابة المحصول بدل افتراض نجاح الخطة لمجرد إنها شكلها حلو.', 'الأول اتأكد من أخذ العينة وطريقة المعمل، وحلّل مياه البئر. افحص ميل الأرض وعمق منطقة الجذور وأي طبقة صلبة ودخول الميه في التربة ومخرج الصرف. لو الملوحة اتأكدت وفيه ميه مناسبة وصرف كافي، خطة محلية بيعدّها مختص ممكن تشمل غسل أملاح منضبط؛ ما تحددش كمية من التقرير الناقص. لو الصرف غير كافي أو الميه بتضيف حمل أملاح غير مناسب، لازم تتعامل مع القيود دي قبل ما توعد بغسل الأملاح أو نجاح محصول جديد.\n\nالمادة العضوية وغطاء السطح ممكن يساعدوا الخزن والبناء ويقللوا البخر؛ ما يعملوش مخرج صرف ولا يحولوا ماء غير مناسب لماء مناسب. رتّب الأولويات حسب القيد الأهم والمحصول والتكلفة. بعد التدخل، أعد القياس بنفس طريقة إي سي وعلى أعماق قابلة للمقارنة، وراقب استجابة المحصول بدل افتراض نجاح الخطة لمجرد إنها شكلها حلو.'), ('الحالة الأصلية لفني زراعي في قطعة ١٠ م × ١٠ م (١٠٠ م²) لوم رملي؛ المادة العضوية ٠٫٨٪، وEC للتربة ٣٫٥ dS/m، وماء البئر موصوف إنه قليل الملوحة. القضايا الثلاث: مادة عضوية قليلة مقاسة، وإجهاد ملحي محتمل عند الجذور، ومصدر ماء حمل الأملاح بتاعه غير مقاس. اطلب عمق وتاريخ العينة وطريقة EC للتربة، هل هي ECe أو مستخلص مخفف، وECw وأيونات الماء وpH وعمق القطاع والصرف. وصف الأصل «متوسطة الملوحة» مش بديل لمعرفة طريقة القياس.\n\nاعمل أربعة أعمدة في صفحة واحدة: الملاحظة والفحص الناقص؛ الآلية المحتملة؛ التدخل المشروط وأولويته؛ ودليل نجاحه أو مراجعته. اشرح أثر كل قضية على المحصول. ما توعدش إن كل رية تزود ملح الأرض، أو إن كل ماء الري في اللوم الرملي هيهرب قبل الجذور، أو إن الكمبوست لوحده يشيل الملح.', 'الحالة الأصلية لفني زراعي في قطعة عشرة متر مضروب في عشرة متر (مية متر مربع) لوم رملي؛ المادة العضوية صفر فاصلة تمانية في المية، وإي سي للتربة تلاتة فاصلة خمسة ديسي سيمنز لكل متر، وماء البئر موصوف إنه قليل الملوحة. القضايا الثلاث: مادة عضوية قليلة مقاسة، وإجهاد ملحي محتمل عند الجذور، ومصدر ماء حمل الأملاح بتاعه غير مقاس. اطلب عمق وتاريخ العينة وطريقة إي سي للتربة، هل هي إي سي إي أو مستخلص مخفف، وإي سي دبليو وأيونات الماء وبي إتش وعمق القطاع والصرف. وصف الأصل «متوسطة الملوحة» مش بديل لمعرفة طريقة القياس.\n\nاعمل أربعة أعمدة في صفحة واحدة: الملاحظة والفحص الناقص؛ الآلية المحتملة؛ التدخل المشروط وأولويته؛ ودليل نجاحه أو مراجعته. اشرح أثر كل قضية على المحصول. ما توعدش إن كل رية تزود ملح الأرض، أو إن كل ماء الري في اللوم الرملي هيهرب قبل الجذور، أو إن الكمبوست لوحده يشيل الملح.'), ('في مجموعة من طالبين أو ثلاثة، اختاروا كاتبًا واشتغلوا صفحة واحدة. ٥ دقائق لثلاث مشكلات وتأثيرها على المحصول؛ ١٠ دقائق لتسلسل محسنات التربة وقرار الماء/الصرف والغطاء؛ ٥ دقائق لمحصولين وسبب كل واحد؛ و٥ دقائق لعرض الخطة ومناقشتها. ده النشاط الأصلي ٢٥ دقيقة ضمن موضوع ٥٠ دقيقة: ٥ تمهيد، ٢٥ نشاط، ١٥ شرح وعروض، ٥ ختام. المدرّب ممكن يوفر قالبًا أو بدايات جمل أو قاموسًا مصورًا أو رسمًا مسمّى، لكن كل طالب يشرح قراره بنفسه.\n\nسؤال الخروج الأصلي: «إيه أهم إضافة للتربة الصحراوية، واذكر سببين لفائدتها؟» المادة العضوية ممكن تحسن خزن الماء والعناصر في القطعة قليلة OM الموصوفة. لكن إجابة السؤال ده وحدها ما تثبتش خطة كاملة تتعامل مع الملح والماء والصرف ومحصولين مناسبين. جاوب السؤال بدقة، ثم راجع باقي معايير الخطوة.\n\nنشاط المجموعة كله ٢٥ دقيقة: ٥ للمشكلات، و١٠ لخطة التحسين، و٥ لمحصولين، وآخر ٥ دقايق للمناقشة كلها. في المرحلة الأخيرة دي، الأصل بيختار مجموعتين أو تلاتة لعرض خططهم؛ مش بيدي كل مجموعة ٥ دقايق. كل مجموعة فيها فردين أو تلاتة وحد فيهم بيسجّل. وبرضه كل طالب بيشرح قرار بنفسه. الموضوع الأساسي ٥٠ دقيقة: ٥ + ٢٥ + ١٥ + ٥. استخدم قالب تنظيم بصري، أو بداية جملة، أو قاموس صغير، أو رسم عليه مسميات لما يفيدك. سجّل شرح كل طالب بكلامه هو.', 'في مجموعة من طالبين أو ثلاثة، اختاروا كاتب واشتغلوا صفحة واحدة. خمس دقايق لثلاث مشكلات وتأثيرها على المحصول؛ عشر دقايق لتسلسل محسنات التربة وقرار الماء، الصرف والغطاء؛ خمس دقايق لمحصولين وسبب كل واحد؛ وخمس دقايق لعرض الخطة ومناقشتها. ده النشاط الأصلي خمسة وعشرين دقيقة ضمن موضوع خمسين دقيقة: خمسة تمهيد، خمسة وعشرين نشاط، خمستاشر شرح وعروض، خمسة ختام. المدرّب ممكن يوفر قالب أو بدايات جمل أو قاموس مصور أو رسم عليه مسميات، لكن كل طالب يشرح قراره بنفسه.\n\nسؤال الخروج الأصلي: «إيه أهم إضافة للتربة الصحراوية، واذكر سببين لفائدتها؟» المادة العضوية ممكن تحسن خزن الماء والعناصر في القطعة قليلة المادة العضوية الموصوفة. لكن إجابة السؤال ده وحدها ما تثبتش خطة كاملة تتعامل مع الملح والماء والصرف ومحصولين مناسبين. جاوب السؤال بدقة، ثم راجع باقي معايير الخطوة.\n\nنشاط المجموعة كله خمسة وعشرين دقيقة: خمسة للمشكلات، وعشرة لخطة التحسين، وخمسة لمحصولين، وآخر خمسة دقايق للمناقشة كلها. في المرحلة الأخيرة دي، الأصل بيختار مجموعتين أو تلاتة لعرض خططهم؛ مش بيدي كل مجموعة خمسة دقايق. كل مجموعة فيها فردين أو تلاتة وحد فيهم بيسجّل. وبرضه كل طالب بيشرح قرار بنفسه. الموضوع الأساسي خمسين دقيقة: خمسة زائد خمسة وعشرين زائد خمستاشر زائد خمسة. استخدم قالب تنظيم بصري، أو بداية جملة، أو قاموس صغير، أو رسم عليه مسميات لما يفيدك. سجّل شرح كل طالب بكلامه هو.'), ('قائمة الأصل للمحاصيل المرشحة للجفاف: السورجم، الدخن، اللوبيا، البامية، التين الشوكي «نوبال»، والرمان. يذكر جذور السورجم وطبقة أوراقه الشمعية؛ كفاءة الدخن وسرعة نضجه؛ تثبيت اللوبيا للنيتروجين وجذورها؛ أداء البامية في الحر؛ تخزين التين الشوكي للماء في ألواحه؛ وملاءمة الرمان لبعض البيئات الجافة. دي أمثلة تعليمية، مش ضمان لكل صنف أو موسم. افحص الميه المطلوبة لتأسيس المحصول وعمق الجذور والحرارة والصنف وتوفر البذور وهدف الإنتاج.\n\nمحصول قد يحتمل الجفاف ويكون حساسًا لملح التربة أو ماء الري، والعكس ممكن. تثبيت اللوبيا للنيتروجين مثلًا ما يلغي قيد الماء أو الملح. مساحة القطعة الصغيرة تخليك تفكر في وقت الحصاد والسوق؛ شجرة معمرة أو نخلة مش زي محصول حقلي سريع.', 'قائمة الأصل للمحاصيل المرشحة للجفاف: السورجم، الدخن، اللوبيا، البامية، التين الشوكي «نوبال»، والرمان. يذكر جذور السورجم وطبقة أوراقه الشمعية؛ كفاءة الدخن وسرعة نضجه؛ تثبيت اللوبيا للنيتروجين وجذورها؛ أداء البامية في الحر؛ تخزين التين الشوكي للماء في ألواحه؛ وملاءمة الرمان لبعض البيئات الجافة. دي أمثلة تعليمية، مش ضمان لكل صنف أو موسم. افحص الميه المطلوبة لتأسيس المحصول وعمق الجذور والحرارة والصنف وتوفر البذور وهدف الإنتاج.\n\nمحصول ممكن يحتمل الجفاف ويكون حساس لملح التربة أو ماء الري، والعكس ممكن. تثبيت اللوبيا للنيتروجين مثلًا ما يلغي قيد الماء أو الملح. مساحة القطعة الصغيرة تخليك تفكر في وقت الحصاد والسوق؛ شجرة معمرة أو نخلة مش زي محصول حقلي سريع.'), ('مثال المدرّس بعد الزراعة بيقترح طبقة بسمك ٧–١٠ سم من القش أو رقائق الخشب، ومثال بنك الأسئلة المختلف بيذكر ٥–١٠ سم. النطاقين للنقاش، مش تعليمات عامة. القش ورقائق الخشب والحصى ممكن يغطّوا السطح؛ لكن نوع الغطاء وسمكه وظهور البادرات وتوزيع الري وحركة الرياح والتكلفة وجودة المادة بيغيروا النتيجة. الغطاء غالبًا بيقلل البخر والتعرية؛ ما بيشيلش الأملاح من منطقة الجذور بنفسه ولا بيلغي الري.\n\nمصدات الرياح ممكن تقلل الريح والتعرية، لكن الأشجار تستهلك ماء وضوءًا ومساحة. محاصيل تغطية زي البيقية والجاودار تحمي السطح وتضيف مخلفات، لكنها ممكن تنافس المحصول التالي على ماء شحيح وتحتاج موسمًا وبذورًا مناسبين. على قطعة ١٠٠ م²، قارن كلفة المساحة والماء. في سؤال متقدم، قارن التنقيط أو الجرار الفخارية المدفونة بالرش بحسب ظروف الأرض والصيانة؛ ما تعتبرش واحدًا أفضل دائمًا.', 'مثال المدرّس بعد الزراعة بيقترح طبقة بسمك سبعة إلى عشرة سنتيمتر من القش أو رقائق الخشب، ومثال بنك الأسئلة المختلف بيذكر خمسة إلى عشرة سنتيمتر. النطاقين للنقاش، مش تعليمات عامة. القش ورقائق الخشب والحصى ممكن يغطّوا السطح؛ لكن نوع الغطاء وسمكه وظهور البادرات وتوزيع الري وحركة الرياح والتكلفة وجودة المادة بيغيروا النتيجة. الغطاء غالبًا بيقلل البخر والتعرية؛ ما بيشيلش الأملاح من منطقة الجذور بنفسه ولا بيلغي الري.\n\nمصدات الرياح ممكن تقلل الريح والتعرية، لكن الأشجار تستهلك ماء وضوء ومساحة. محاصيل تغطية زي البيقية والجاودار تحمي السطح وتضيف مخلفات، لكنها ممكن تنافس المحصول التالي على ماء شحيح وتحتاج موسم وبذور مناسبين. على قطعة مية متر مربع، قارن تكلفة المساحة والماء. في سؤال متقدم، قارن التنقيط أو الجرار الفخارية المدفونة بالرش بحسب ظروف الأرض والصيانة؛ ما تعتبرش واحد أفضل دايمًا.'), ('نموذج المدرّس بيقترح طبقة كمبوست عالي الجودة أو سماد بلدي معتّق بسمك ٥–١٠ سم على القطعة كلها، تتخلط في أعلى ١٥ سم من التربة. نموذج مختلف في بنك الأسئلة بيقترح الخلط في أعلى ١٥–٢٠ سم لحالة رملية قلوية. احتفظ بالأرقام كاقتراحات في أمثلتها، مش جرعة تلقائية: على مساحة ١٠٠ م²، طبقة بسمك ٥ سم حجمها ٥ م³ قبل حساب الكثافة والخلط. قبل اختيار كمية فعلية وعمق خلط، لازم تعرف كتلة المادة ومحتواها من العناصر وpH وEC والأملاح ودرجة النضج والسلامة من مسببات المرض، وكمان توفرها والميزانية وتحاليل التربة والمحصول.\n\nالكمبوست الناضج أو السماد البلدي المعتّق المناسب ممكن يزود المادة العضوية ويدعم بناء التربة وخزن الماء ودورة العناصر. لكن مادة من الروث قد تضيف أملاحًا أو عناصر زائدة. الفحم الحيوي بديل يحتاج فحصًا منفصلًا: مادته الخام وطريقة إنتاجه يغيروا pH والأملاح والعناصر وتأثيره على الماء؛ مش هو الكمبوست ومش مضمون لكل تربة. ما ترسمش أي مادة كأنها سدادة تسد كل مسام التربة.', 'نموذج المدرّس بيقترح طبقة كمبوست عالي الجودة أو سماد بلدي معتّق بسمك خمسة إلى عشرة سنتيمتر على القطعة كلها، تتخلط في أعلى خمستاشر سنتيمتر من التربة. نموذج مختلف في بنك الأسئلة بيقترح الخلط في أعلى خمستاشر إلى عشرين سنتيمتر لحالة رملية قلوية. احتفظ بالأرقام كاقتراحات في أمثلتها، مش جرعة تلقائية: على مساحة مية متر مربع، طبقة بسمك خمسة سنتيمتر حجمها خمسة متر مكعب قبل حساب الكثافة والخلط. قبل اختيار كمية فعلية وعمق خلط، لازم تعرف كتلة المادة ومحتواها من العناصر وبي إتش وإي سي والأملاح ودرجة النضج والسلامة من مسببات المرض، وكمان توفرها والميزانية وتحاليل التربة والمحصول.\n\nالكمبوست الناضج أو السماد البلدي المعتّق المناسب ممكن يزود المادة العضوية ويدعم بناء التربة وخزن الماء ودورة العناصر. لكن مادة من الروث ممكن تضيف أملاح أو عناصر زائدة. الفحم الحيوي بديل محتاج فحص منفصل: مادته الخام وطريقة إنتاجه يغيروا بي إتش والأملاح والعناصر وتأثيره على الماء؛ مش هو الكمبوست ومش مضمون لكل تربة. ما ترسمش أي مادة كأنها سدادة تسد كل مسام التربة.')], 'en': [("In a group of two or three, appoint a writer and build a one-page plan. Use 5 minutes for three challenges and their crop impacts; 10 for a justified sequence of soil amendments, water/drainage decisions and surface management; 5 to select two crops and explain each; and 5 to present and discuss. This is the original 25-minute activity within a 50-minute topic (5-minute hook, 25-minute activity, 15-minute teaching/presentations, 5-minute wrap-up). The teacher may supply a graphic organiser, sentence starters, a mini-glossary or a labelled diagram. Every learner should still explain their own key decision.\n\nThe original exit ticket asks for the most important addition to desert soil and two reasons. Organic matter can improve water and nutrient retention in the described low-OM plot; a complete rehabilitation answer must also deal with measured salinity, water source and drainage. Respond to the exit ticket accurately without treating that one question as proof that a two-crop, water-safe rehabilitation plan is complete.\n\nThe whole group activity is 25 minutes: 5 for concerns, 10 for the improvement plan, 5 for two crops and 5 total for discussion. In that final phase the source selects two or three groups to present; it does not allot five minutes to every group. Groups contain two or three people with one writer. Each learner still explains a decision. The parent topic is 50 minutes: 5 + 25 + 15 + 5. Use a graphic organiser, sentence starter, mini-glossary or a labelled diagram when useful. Record each learner's own explanation.", "In a group of two or three, appoint a writer and build a one-page plan. Use five minutes for three challenges and their crop impacts; ten for a justified sequence of soil amendments, water, drainage decisions and surface management; five to select two crops and explain each; and five to present and discuss. This is the original twenty-five-minute activity within a fifty-minute topic (five-minute hook, twenty-five-minute activity, fifteen-minute teaching, presentations, five-minute wrap-up). The teacher may supply a graphic organiser, sentence starters, a mini-glossary or a labelled diagram. Every learner should still explain their own key decision.\n\nThe original exit ticket asks for the most important addition to desert soil and two reasons. Organic matter can improve water and nutrient retention in the described low-organic matter plot; a complete rehabilitation answer must also deal with measured salinity, water source and drainage. Respond to the exit ticket accurately without treating that one question as proof that a two-crop, water-safe rehabilitation plan is complete.\n\nThe whole group activity is twenty-five minutes: five for concerns, ten for the improvement plan, five for two crops and five total for discussion. In that final phase the source selects two or three groups to present; it does not allot five minutes to every group. Groups contain two or three people with one writer. Each learner still explains a decision. The parent topic is fifty minutes: five plus twenty-five plus fifteen plus five. Use a graphic organiser, sentence starter, mini-glossary or a labelled diagram when useful. Record each learner's own explanation."), ("The original technician case is a 10 m × 10 m (100 m²) sandy-loam pilot plot with organic matter 0.8%, a reported soil EC of 3.5 dS/m and borewell water described as slightly saline. The three planning concerns are low measured organic matter, possible root-zone salt stress and a water source whose salt loading is not quantified. They may interact, but a diagnosis needs sample depth, date, soil EC method (for example ECe versus a diluted extract), water ECw and relevant ions, pH, profile depth and drainage. The teacher's 'moderately saline' label is not a substitute for the missing EC method.\n\nA one-page plan can use four columns: observation and missing test; likely mechanism; conditional action with priority; and evidence of success or need to revise. Explain the impact of each concern on crops. Do not promise that every irrigation worsens salt, that every sandy-loam irrigation drains before roots use it, or that adding compost alone removes salts.", "The original technician case is a sandy-loam pilot plot, ten metres by ten metres, covering one hundred square metres with organic matter zero point eight percent, a reported soil E C of three point five decisiemens per metre and borewell water described as slightly saline. The three planning concerns are low measured organic matter, possible root-zone salt stress and a water source whose salt loading is not quantified. They may interact, but a diagnosis needs sample depth, date, soil E C method (for example E C e versus a diluted extract), water E C w and relevant ions, P H, profile depth and drainage. The teacher's 'moderately saline' label is not a substitute for the missing E C method.\n\nA one-page plan can use four columns: observation and missing test; likely mechanism; conditional action with priority; and evidence of success or need to revise. Explain the impact of each concern on crops. Do not promise that every irrigation worsens salt, that every sandy-loam irrigation drains before roots use it, or that adding compost alone removes salts."), ("The source lists barley, quinoa, sugar beet, date palm, asparagus and pistachio as salt-tolerant candidates, and uses barley plus sorghum or cowpea as a model pair for the plot. Keep each name, but the table's broad 'high' or 'moderate' words do not select a crop for an EC report whose method is missing. Compare a reliable crop tolerance source to method-matched soil ECe, borewell ECw and relevant ion risks; check seedling versus mature tolerance, cultivar, yield target and local conditions. Barley and sugar beet are relatively tolerant in FAO tables, while sorghum and cowpea occupy other tolerance ranges; none is immune to salt. In FAO Annex 1, Table A1.1, asparagus is rated T (tolerant), rather than the source table's Moderate. This is a relative rating under that table's stated soil-salinity and growth-stage conditions, not a guarantee for any field.\n\nA salt-tolerant conventional crop is not automatically a true halophyte. Quinoa tolerances vary by genotype and stage; date palm may be comparatively salt tolerant yet has a long establishment and investment horizon; asparagus needs perennial management. Pistachio is not a simple 'moderately saline' prescription: rootstock, scion, tree age, specific ions, winter climate and orchard economics matter. Select two *candidates* with separate reasons for water scarcity and salt exposure, then say what test could change each choice.", "The source lists barley, quinoa, sugar beet, date palm, asparagus and pistachio as salt-tolerant candidates, and uses barley plus sorghum or cowpea as a model pair for the plot. Keep each name, but the table's broad 'high' or 'moderate' words do not select a crop for an E C report whose method is missing. Compare a reliable crop tolerance source to method-matched soil E C e, borewell E C w and relevant ion risks; check seedling versus mature tolerance, cultivar, yield target and local conditions. Barley and sugar beet are relatively tolerant in FAO tables, while sorghum and cowpea occupy other tolerance ranges; none is immune to salt. In FAO Annex one, Table A one point one, asparagus is rated T (tolerant), rather than the source table's Moderate. This is a relative rating under that table's stated soil-salinity and growth-stage conditions, not a guarantee for any field.\n\nA salt-tolerant conventional crop is not automatically a true halophyte. Quinoa tolerances vary by genotype and stage; date palm may be comparatively salt tolerant yet has a long establishment and investment horizon; asparagus needs perennial management. Pistachio is not a simple 'moderately saline' prescription: rootstock, scion, tree age, specific ions, winter climate and orchard economics matter. Select two candidates with separate reasons for water scarcity and salt exposure, then say what test could change each choice."), ("The teacher's case suggests 7–10 cm of straw or wood-chip mulch after planting; the bank's three-technique answer uses 5–10 cm. Both are example ranges for discussion, not a universal instruction. Straw, wood chips or gravel can cover a surface, but material, depth, crop emergence, irrigation layout, wind movement, cost and any quality issues change the result. Surface cover often reduces evaporation and erosion; it does not itself remove root-zone salts or eliminate irrigation.\n\nWindbreaks can reduce damaging wind and erosion, but trees also take water, light and land. Cover crops such as vetch or rye can cover soil and supply residues, yet may compete with the next crop for scarce water and require a locally adapted season and seed source. On a 100 m² pilot, compare the area and water cost of each option. An advanced comparison may consider drip irrigation or buried clay pots against sprinklers, but explain the site conditions and maintenance before claiming one is superior.", "The teacher's case suggests seven to ten centimetres of straw or wood-chip mulch after planting; the bank's three-technique answer uses five to ten centimetres. Both are example ranges for discussion, not a universal instruction. Straw, wood chips or gravel can cover a surface, but material, depth, crop emergence, irrigation layout, wind movement, cost and any quality issues change the result. Surface cover often reduces evaporation and erosion; it does not itself remove root-zone salts or eliminate irrigation.\n\nWindbreaks can reduce damaging wind and erosion, but trees also take water, light and land. Cover crops such as vetch or rye can cover soil and supply residues, yet may compete with the next crop for scarce water and require a locally adapted season and seed source. On a pilot covering one hundred square metres, compare the area and water cost of each option. An advanced comparison may consider drip irrigation or buried clay pots against sprinklers, but explain the site conditions and maintenance before claiming one is superior."), ("The teacher's model proposes a 5–10 cm layer of high-quality compost or well-aged manure across the plot, incorporated into the upper 15 cm. A separate question-bank model suggests the upper 15–20 cm for a sandy, alkaline case. Keep those numbers as source proposals to evaluate, not automatic application rates: on 100 m², even 5 cm corresponds to 5 m³ before bulk-density and mixing calculations. Material mass, nutrient content, pH, EC/salts, maturity, pathogen safety, availability, budget and soil/crop tests must be known before a real rate or mixing depth is chosen.\n\nFinished compost or suitable aged manure can contribute organic matter and improve soil structure, water holding and nutrient cycling. Manure-derived material can also bring salts or excess nutrients. Biochar is another possible input, but its feedstock and production change pH, salts, nutrients and water effects; it is not interchangeable with compost and is not guaranteed to improve every soil. Do not depict any material as a plug sealing all soil pores.", "The teacher's model proposes a layer five to ten centimetres thick of high-quality compost or well-aged manure across the plot, incorporated into the upper fifteen centimetres. A separate question-bank model suggests the upper fifteen to twenty centimetres for a sandy, alkaline case. Keep those numbers as source proposals to evaluate, not automatic application rates: on one hundred square metres, even five centimetres corresponds to five cubic metres before bulk-density and mixing calculations. Material mass, nutrient content, P H, E C, salts, maturity, pathogen safety, availability, budget and soil, crop tests must be known before a real rate or mixing depth is chosen.\n\nFinished compost or suitable aged manure can contribute organic matter and improve soil structure, water holding and nutrient cycling. Manure-derived material can also bring salts or excess nutrients. Biochar is another possible input, but its feedstock and production change P H, salts, nutrients and water effects; it is not interchangeable with compost and is not guaranteed to improve every soil. Do not depict any material as a plug sealing all soil pores.")], 'it': [('Conferma prima il campionamento e il metodo di laboratorio e analizza l’acqua del pozzo. Esamina pendenza, profondità delle radici, eventuale strato duro, infiltrazione e uscita dell’acqua drenata. Se il sale è confermato e sono disponibili acqua adatta e drenaggio sufficiente, un piano locale qualificato può prevedere una lisciviazione controllata; il referto incompleto non permette di calcolarne il volume. Se il drenaggio è insufficiente o l’acqua apporta troppo sale, risolvi questi limiti prima di promettere lavaggio o colture.\n\nSostanza organica e copertura possono migliorare riserva idrica, struttura e controllo dell’evaporazione; non creano uno scarico di drenaggio né rendono adatta un’acqua inadatta. Assegna le priorità secondo il limite principale, la coltura e il costo. Dopo gli interventi, ripeti la stessa misura EC a profondità confrontabili e osserva la risposta della coltura invece di dedurre il successo dall’aspetto del piano.', 'Conferma prima il campionamento e il metodo di laboratorio e analizza l’acqua del pozzo. Esamina pendenza, profondità delle radici, eventuale strato duro, infiltrazione e uscita dell’acqua drenata. Se il sale è confermato e sono disponibili acqua adatta e drenaggio sufficiente, un piano locale qualificato può prevedere una lisciviazione controllata; il referto incompleto non permette di calcolarne il volume. Se il drenaggio è insufficiente o l’acqua apporta troppo sale, risolvi questi limiti prima di promettere lavaggio o colture.\n\nSostanza organica e copertura possono migliorare riserva idrica, struttura e controllo dell’evaporazione; non creano uno scarico di drenaggio né rendono adatta un’acqua inadatta. Assegna le priorità secondo il limite principale, la coltura e il costo. Dopo gli interventi, ripeti la stessa misura e ci a profondità confrontabili e osserva la risposta della coltura invece di dedurre il successo dall’aspetto del piano.'), ('Il caso del docente propone dopo la semina 7–10 cm di paglia o cippato attorno alle piante; la diversa risposta della banca usa 5–10 cm. Sono intervalli da discutere, non istruzioni universali. Paglia, cippato e ghiaia possono coprire il terreno, ma scelta, spessore, emergenza della coltura, disposizione dell’irrigazione, vento, costo e qualità cambiano il risultato. La copertura spesso riduce evaporazione ed erosione; non elimina da sola il sale della zona radicale né l’irrigazione.\n\nI frangivento possono ridurre vento ed erosione, ma gli alberi consumano anche acqua, luce e spazio. Colture di copertura come veccia e segale proteggono il suolo e forniscono residui, ma possono competere per la scarsa acqua e richiedono stagione e sementi adatte. Su 100 m² confronta area e consumo idrico. Un confronto avanzato può considerare goccia o vasi di argilla interrati rispetto agli irrigatori, valutando condizioni e manutenzione prima di proclamare una superiorità generale.', 'Il caso del docente propone dopo la semina sette a dieci centimetri di paglia o cippato attorno alle piante; la diversa risposta della banca usa cinque a dieci centimetri. Sono intervalli da discutere, non istruzioni universali. Paglia, cippato e ghiaia possono coprire il terreno, ma scelta, spessore, emergenza della coltura, disposizione dell’irrigazione, vento, costo e qualità cambiano il risultato. La copertura spesso riduce evaporazione ed erosione; non elimina da sola il sale della zona radicale né l’irrigazione.\n\nI frangivento possono ridurre vento ed erosione, ma gli alberi consumano anche acqua, luce e spazio. Colture di copertura come veccia e segale proteggono il suolo e forniscono residui, ma possono competere per la scarsa acqua e richiedono stagione e sementi adatte. Su cento metri quadrati confronta area e consumo idrico. Un confronto avanzato può considerare goccia o vasi di argilla interrati rispetto agli irrigatori, valutando condizioni e manutenzione prima di proclamare una superiorità generale.'), ('Il caso originale riguarda un appezzamento pilota franco-sabbioso di 10 m × 10 m (100 m²), con sostanza organica allo 0,8%, EC del suolo riferita come 3,5 dS/m e acqua di pozzo descritta come leggermente salina. I tre punti sono la bassa sostanza organica misurata, un possibile stress salino nella zona radicale e un’acqua il cui carico salino non è quantificato. Chiedi profondità e data del campione, metodo EC del suolo (ECe o estratto diluito), ECw e ioni dell’acqua, pH, profondità del profilo e drenaggio. L’etichetta originale «moderatamente salino» non sostituisce il metodo mancante.\n\nOrganizza la pagina in quattro colonne: osservazione e prova mancante; meccanismo probabile; azione condizionata e priorità; controllo del risultato. Spiega l’effetto di ogni problema sulle piante. Non promettere che ogni irrigazione aumenti il sale, che in un franco-sabbioso tutta l’acqua sfugga subito alle radici o che il compost elimini da solo i sali.', 'Il caso originale riguarda un appezzamento pilota franco-sabbioso di dieci metri moltiplicato per dieci metri (cento metri quadrati), con sostanza organica allo zero virgola otto per cento, e ci del suolo riferita come tre virgola cinque decisiemens per metro e acqua di pozzo descritta come leggermente salina. I tre punti sono la bassa sostanza organica misurata, un possibile stress salino nella zona radicale e un’acqua il cui carico salino non è quantificato. Chiedi profondità e data del campione, metodo e ci del suolo (e ci e o estratto diluito), e ci doppia vu e ioni dell’acqua, pi acca, profondità del profilo e drenaggio. L’etichetta originale «moderatamente salino» non sostituisce il metodo mancante.\n\nOrganizza la pagina in quattro colonne: osservazione e prova mancante; meccanismo probabile; azione condizionata e priorità; controllo del risultato. Spiega l’effetto di ogni problema sulle piante. Non promettere che ogni irrigazione aumenti il sale, che in un franco-sabbioso tutta l’acqua sfugga subito alle radici o che il compost elimini da solo i sali.'), ('Il modello del docente propone uno strato di 5–10 cm di compost di qualità o letame ben maturo su tutto il terreno, incorporato nei primi 15 cm. Un modello diverso nella banca di domande suggerisce i primi 15–20 cm per un caso sabbioso e alcalino. Conserva entrambi come proposte nei rispettivi esempi, non come dosi automatiche: su 100 m² uno strato di 5 cm equivale geometricamente a 5 m³ prima di densità, assestamento e miscelazione. Prima di una dose reale servono massa, nutrienti, pH, EC/sali, maturità, sicurezza igienica, disponibilità, budget e analisi di suolo e coltura.\n\nCompost maturo o letame stagionato idoneo possono apportare sostanza organica e sostenere struttura, ritenzione idrica e ciclo dei nutrienti. Il materiale da letame può anche apportare sali o nutrienti in eccesso. Il biochar è un’altra opzione da analizzare separatamente: biomassa e produzione ne modificano pH, sali, nutrienti ed effetti sull’acqua; non è intercambiabile con il compost e non migliora ogni suolo per definizione. Non rappresentare nessun prodotto come un tappo che sigilla tutti i pori.', 'Il modello del docente propone uno strato di cinque a dieci centimetri di compost di qualità o letame ben maturo su tutto il terreno, incorporato nei primi quindici centimetri. Un modello diverso nella banca di domande suggerisce i primi quindici a venti centimetri per un caso sabbioso e alcalino. Conserva entrambi come proposte nei rispettivi esempi, non come dosi automatiche: su cento metri quadrati uno strato di cinque centimetri equivale geometricamente a cinque metri cubi prima di densità, assestamento e miscelazione. Prima di una dose reale servono massa, nutrienti, pi acca, e ci, sali, maturità, sicurezza igienica, disponibilità, budget e analisi di suolo e coltura.\n\nCompost maturo o letame stagionato idoneo possono apportare sostanza organica e sostenere struttura, ritenzione idrica e ciclo dei nutrienti. Il materiale da letame può anche apportare sali o nutrienti in eccesso. Il biochar è un’altra opzione da analizzare separatamente: biomassa e produzione ne modificano pi acca, sali, nutrienti ed effetti sull’acqua; non è intercambiabile con il compost e non migliora ogni suolo per definizione. Non rappresentare nessun prodotto come un tappo che sigilla tutti i pori.'), ('In gruppi di due o tre, designate chi scrive e preparate una pagina. Dedicate 5 minuti a tre problemi e agli effetti sulla coltura; 10 a una sequenza motivata di ammendanti, acqua/drenaggio e copertura; 5 a due colture con una ragione ciascuna; 5 a presentazione e discussione. È l’attività originale di 25 minuti in un tema da 50: 5 introduzione, 25 attività, 15 spiegazione/presentazioni e 5 conclusione. Il formatore può offrire uno schema, inizi di frasi, glossario illustrato o disegno etichettato; ogni allievo deve comunque spiegare la propria scelta.\n\nLa domanda finale originale chiede la cosa più importante da aggiungere al suolo desertico e due ragioni. La sostanza organica può migliorare ritenzione di acqua e nutrienti nell’appezzamento descritto con poca sostanza organica; una risposta completa sul recupero deve anche affrontare sale, acqua, drenaggio e due colture. Rispondi alla domanda senza scambiarla per prova del piano completo.\n\nL’intera attività di gruppo dura 25 minuti: 5 per i problemi, 10 per il piano di miglioramento, 5 per due colture e 5 complessivi per la discussione. In quest’ultima fase la fonte seleziona due o tre gruppi per presentare il piano; non assegna cinque minuti a ogni gruppo. I gruppi hanno due o tre persone, una delle quali scrive. Ogni allievo deve comunque spiegare una decisione. L’argomento complessivo dura 50 minuti: 5 + 25 + 15 + 5. Usa uno schema grafico, un inizio di frase, un mini-glossario o un disegno con etichette quando è utile. Registra la spiegazione personale di ogni allievo.', 'In gruppi di due o tre, designate chi scrive e preparate una pagina. Dedicate cinque minuti a tre problemi e agli effetti sulla coltura; dieci a una sequenza motivata di ammendanti, acqua, drenaggio e copertura; cinque a due colture con una ragione ciascuna; cinque a presentazione e discussione. È l’attività originale di venticinque minuti in un tema da cinquanta: cinque introduzione, venticinque attività, quindici spiegazione, presentazioni e cinque conclusione. Il formatore può offrire uno schema, inizi di frasi, glossario illustrato o disegno etichettato; ogni allievo deve comunque spiegare la propria scelta.\n\nLa domanda finale originale chiede la cosa più importante da aggiungere al suolo desertico e due ragioni. La sostanza organica può migliorare ritenzione di acqua e nutrienti nell’appezzamento descritto con poca sostanza organica; una risposta completa sul recupero deve anche affrontare sale, acqua, drenaggio e due colture. Rispondi alla domanda senza scambiarla per prova del piano completo.\n\nL’intera attività di gruppo dura venticinque minuti: cinque per i problemi, dieci per il piano di miglioramento, cinque per due colture e cinque complessivi per la discussione. In quest’ultima fase la fonte seleziona due o tre gruppi per presentare il piano; non assegna cinque minuti a ogni gruppo. I gruppi hanno due o tre persone, una delle quali scrive. Ogni allievo deve comunque spiegare una decisione. L’argomento complessivo dura cinquanta minuti: cinque più venticinque più quindici più cinque. Usa uno schema grafico, un inizio di frase, un mini-glossario o un disegno con etichette quando è utile. Registra la spiegazione personale di ogni allievo.'), ('L’originale cita orzo, quinoa, barbabietola da zucchero, palma da datteri, asparago e pistacchio come candidate relativamente tolleranti al sale e propone orzo con sorgo o fagiolo dall’occhio come coppia modello. Conserva tutti i nomi, ma le classi generiche «alta» e «moderata» non scelgono una coltura se il metodo EC manca. Confronta una fonte attendibile con ECe del suolo e ECw del pozzo misurate con metodi appropriati, ioni rilevanti, fase della piantina, cultivar, resa attesa e clima locale. Orzo e barbabietola da zucchero risultano relativamente tolleranti nelle tabelle FAO, mentre sorgo e fagiolo dall’occhio rientrano in altri intervalli di tolleranza; nessuna specie è immune al sale. Nell’Allegato 1 della FAO, tabella A1.1, l’asparago è classificato T (tollerante), anziché «moderato» come nella tabella originale. È una classificazione relativa alle condizioni di salinità del suolo e di fase di crescita dichiarate nella tabella, non una garanzia per qualsiasi campo.\n\nUna coltura convenzionale tollerante al sale non è automaticamente una vera alofita. La quinoa varia secondo genotipo e fase; la palma da datteri può tollerare relativamente il sale, ma richiede tempi e investimenti lunghi; l’asparago è perenne. Il pistacchio non è una prescrizione per «salinità moderata»: portinnesto, marza, età, ioni specifici, clima invernale ed economia del frutteto contano. Scegli due *candidate* con motivazioni separate per poca acqua e sale, e indica quale prova potrebbe cambiare la scelta.', 'L’originale cita orzo, quinoa, barbabietola da zucchero, palma da datteri, asparago e pistacchio come candidate relativamente tolleranti al sale e propone orzo con sorgo o fagiolo dall’occhio come coppia modello. Conserva tutti i nomi, ma le classi generiche «alta» e «moderata» non scelgono una coltura se il metodo e ci manca. Confronta una fonte attendibile con e ci e del suolo e e ci doppia vu del pozzo misurate con metodi appropriati, ioni rilevanti, fase della piantina, cultivar, resa attesa e clima locale. Orzo e barbabietola da zucchero risultano relativamente tolleranti nelle tabelle FAO, mentre sorgo e fagiolo dall’occhio rientrano in altri intervalli di tolleranza; nessuna specie è immune al sale. Nell’Allegato uno della FAO, tabella a uno punto uno, l’asparago è classificato ti (tollerante), anziché «moderato» come nella tabella originale. È una classificazione relativa alle condizioni di salinità del suolo e di fase di crescita dichiarate nella tabella, non una garanzia per qualsiasi campo.\n\nUna coltura convenzionale tollerante al sale non è automaticamente una vera alofita. La quinoa varia secondo genotipo e fase; la palma da datteri può tollerare relativamente il sale, ma richiede tempi e investimenti lunghi; l’asparago è perenne. Il pistacchio non è una prescrizione per «salinità moderata»: portinnesto, marza, età, ioni specifici, clima invernale ed economia del frutteto contano. Scegli due candidate con motivazioni separate per poca acqua e sale, e indica quale prova potrebbe cambiare la scelta.')], 'de': [('Bildet Gruppen aus zwei oder drei Personen, bestimmt eine schreibende Person und erstellt eine Seite. Verwendet 5 Minuten für drei Probleme und Auswirkungen, 10 für begründete Reihenfolge von Bodenmaterial, Wasser/Entwässerung und Bedeckung, 5 für zwei Kulturen mit je einem Grund und 5 für Vortrag und Diskussion. Das ist die ursprüngliche 25-Minuten-Übung in einem 50-Minuten-Thema: 5 Einstieg, 25 Übung, 15 Erklärung/Vorträge und 5 Abschluss. Die Lehrkraft kann ein Schema, Satzanfänge, Bildglossar oder beschriftete Zeichnung anbieten; jede Person erläutert ihre Kernentscheidung selbst.\n\nDie ursprüngliche Abschlussfrage fragt nach dem wichtigsten Zusatz für Wüstenboden und zwei Gründen. Organische Substanz kann in der beschriebenen humusarmen Parzelle Wasser- und Nährstoffspeicherung verbessern. Eine vollständige Sanierung muss aber auch Salz, Wasserquelle, Entwässerung und zwei Kulturen behandeln. Beantworte die Abschlussfrage richtig, ohne sie als Beweis für den ganzen Plan auszugeben.\n\nDie gesamte Gruppenübung dauert 25 Minuten: 5 für die Probleme, 10 für den Verbesserungsplan, 5 für zwei Kulturen und insgesamt 5 für die Diskussion. In dieser letzten Phase wählt die Quelle zwei oder drei Gruppen aus, die ihre Pläne vorstellen; nicht jede Gruppe erhält fünf Minuten. Die Gruppen bestehen aus zwei oder drei Personen, von denen eine die Notizen übernimmt. Jede Person erläutert trotzdem eine Entscheidung. Das übergeordnete Thema dauert 50 Minuten: 5 + 25 + 15 + 5. Nutze bei Bedarf eine grafische Vorlage, einen Satzanfang, ein kleines Glossar oder eine beschriftete Zeichnung. Halte die eigene Erklärung jeder Person fest.', 'Bildet Gruppen aus zwei oder drei Personen, bestimmt eine schreibende Person und erstellt eine Seite. Verwendet fünf Minuten für drei Probleme und Auswirkungen, zehn für begründete Reihenfolge von Bodenmaterial, Wasser, Entwässerung und Bedeckung, fünf für zwei Kulturen mit je einem Grund und fünf für Vortrag und Diskussion. Das ist die ursprüngliche fünfundzwanzig-Minuten-Übung in einem fünfzig-Minuten-Thema: fünf Einstieg, fünfundzwanzig Übung, fünfzehn Erklärung, Vorträge und fünf Abschluss. Die Lehrkraft kann ein Schema, Satzanfänge, Bildglossar oder beschriftete Zeichnung anbieten; jede Person erläutert ihre Kernentscheidung selbst.\n\nDie ursprüngliche Abschlussfrage fragt nach dem wichtigsten Zusatz für Wüstenboden und zwei Gründen. Organische Substanz kann in der beschriebenen humusarmen Parzelle Wasser- und Nährstoffspeicherung verbessern. Eine vollständige Sanierung muss aber auch Salz, Wasserquelle, Entwässerung und zwei Kulturen behandeln. Beantworte die Abschlussfrage richtig, ohne sie als Beweis für den ganzen Plan auszugeben.\n\nDie gesamte Gruppenübung dauert fünfundzwanzig Minuten: fünf für die Probleme, zehn für den Verbesserungsplan, fünf für zwei Kulturen und insgesamt fünf für die Diskussion. In dieser letzten Phase wählt die Quelle zwei oder drei Gruppen aus, die ihre Pläne vorstellen; nicht jede Gruppe erhält fünf Minuten. Die Gruppen bestehen aus zwei oder drei Personen, von denen eine die Notizen übernimmt. Jede Person erläutert trotzdem eine Entscheidung. Das übergeordnete Thema dauert fünfzig Minuten: fünf plus fünfundzwanzig plus fünfzehn plus fünf. Nutze bei Bedarf eine grafische Vorlage, einen Satzanfang, ein kleines Glossar oder eine beschriftete Zeichnung. Halte die eigene Erklärung jeder Person fest.'), ('Das Lehrermodell empfiehlt nach dem Pflanzen 7–10 cm Stroh oder Holzhäcksel um die Pflanzen; die andere Antwort im Fragenkatalog nennt 5–10 cm. Das sind Diskussionsbeispiele, keine allgemeine Anweisung. Stroh, Holzstücke und Kies können bedecken, aber Material, Stärke, Auflaufen der Kultur, Bewässerungsanordnung, Wind, Kosten und Produktqualität beeinflussen das Ergebnis. Eine Bedeckung vermindert oft Verdunstung und Erosion; sie entfernt nicht selbst Salze aus dem Wurzelraum und ersetzt keine Bewässerung.\n\nWindschutz kann Wind und Abtrag vermindern, doch Bäume beanspruchen Wasser, Licht und Fläche. Zwischenfrüchte wie Wicke und Roggen bedecken den Boden und liefern Rückstände, können aber der Folgefrucht knappes Wasser entziehen und benötigen passende Saison und Saatgut. Vergleiche auf 100 m² Platz- und Wasserbedarf. In einer Zusatzaufgabe lassen sich Tropfbewässerung oder vergrabene Tontöpfe mit Beregnung vergleichen; Standort und Wartung müssen eine Überlegenheit erst begründen.', 'Das Lehrermodell empfiehlt nach dem Pflanzen sieben bis zehn Zentimeter Stroh oder Holzhäcksel um die Pflanzen; die andere Antwort im Fragenkatalog nennt fünf bis zehn Zentimeter. Das sind Diskussionsbeispiele, keine allgemeine Anweisung. Stroh, Holzstücke und Kies können bedecken, aber Material, Stärke, Auflaufen der Kultur, Bewässerungsanordnung, Wind, Kosten und Produktqualität beeinflussen das Ergebnis. Eine Bedeckung vermindert oft Verdunstung und Erosion; sie entfernt nicht selbst Salze aus dem Wurzelraum und ersetzt keine Bewässerung.\n\nWindschutz kann Wind und Abtrag vermindern, doch Bäume beanspruchen Wasser, Licht und Fläche. Zwischenfrüchte wie Wicke und Roggen bedecken den Boden und liefern Rückstände, können aber der Folgefrucht knappes Wasser entziehen und benötigen passende Saison und Saatgut. Vergleiche auf einhundert Quadratmetern Platz- und Wasserbedarf. In einer Zusatzaufgabe lassen sich Tropfbewässerung oder vergrabene Tontöpfe mit Beregnung vergleichen; Standort und Wartung müssen eine Überlegenheit erst begründen.'), ('Das Lehrermodell schlägt auf der ganzen Fläche 5–10 cm hochwertigen Kompost oder gut abgelagerten Mist vor, eingearbeitet in die oberen 15 cm. Ein anderes Modell im Fragenkatalog nennt für einen sandigen, alkalischen Fall die oberen 15–20 cm. Behalte beide Zahlen als Beispiele ihrer Fälle, nicht als automatische Aufwandmenge: Auf 100 m² entsprechen schon 5 cm einer geometrischen Schicht von 5 m³, vor Schüttdichte, Setzung und Mischung. Für eine reale Menge braucht man Masse, Nährstoffgehalt, pH, EC/Salze, Reife, hygienische Eignung, Verfügbarkeit, Budget sowie Boden- und Kulturprüfungen.\n\nGeeigneter reifer Kompost oder abgelagerter Mist kann organische Substanz zuführen und Struktur, Wasserspeicherung und Nährstoffkreislauf fördern. Stallmistprodukte können jedoch auch Salze und überschüssige Nährstoffe eintragen. Pflanzenkohle ist eine weitere, getrennt zu prüfende Option: Rohstoff und Herstellung ändern pH, Salze, Nährstoffe und Wassereffekte. Sie ist nicht mit Kompost austauschbar und verbessert nicht automatisch jeden Boden. Kein Material soll als Stopfen dargestellt werden, der alle Bodenporen verschließt.', 'Das Lehrermodell schlägt auf der ganzen Fläche fünf bis zehn Zentimeter hochwertigen Kompost oder gut abgelagerten Mist vor, eingearbeitet in die oberen fünfzehn Zentimeter. Ein anderes Modell im Fragenkatalog nennt für einen sandigen, alkalischen Fall die oberen fünfzehn bis zwanzig Zentimeter. Behalte beide Zahlen als Beispiele ihrer Fälle, nicht als automatische Aufwandmenge: Auf einhundert Quadratmetern entsprechen schon fünf Zentimeter einer geometrischen Schicht von fünf Kubikmetern, vor Schüttdichte, Setzung und Mischung. Für eine reale Menge braucht man Masse, Nährstoffgehalt, Pe Ha, E Ce, Salze, Reife, hygienische Eignung, Verfügbarkeit, Budget sowie Boden- und Kulturprüfungen.\n\nGeeigneter reifer Kompost oder abgelagerter Mist kann organische Substanz zuführen und Struktur, Wasserspeicherung und Nährstoffkreislauf fördern. Stallmistprodukte können jedoch auch Salze und überschüssige Nährstoffe eintragen. Pflanzenkohle ist eine weitere, getrennt zu prüfende Option: Rohstoff und Herstellung ändern Pe Ha, Salze, Nährstoffe und Wassereffekte. Sie ist nicht mit Kompost austauschbar und verbessert nicht automatisch jeden Boden. Kein Material soll als Stopfen dargestellt werden, der alle Bodenporen verschließt.'), ('Die Quelle nennt Gerste, Quinoa, Zuckerrübe, Dattelpalme, Spargel und Pistazie als salztolerante Kandidaten und verwendet Gerste mit Sorghum oder Augenbohne als Modellpaar. Behalte jeden Namen; „hoch“ oder „mittel“ aus der Tabelle wählen keine Kultur, wenn das EC-Verfahren unbekannt ist. Vergleiche verlässliche Toleranzdaten mit methodisch passendem Boden-ECe, Brunnen-ECw und relevanten Ionen und prüfe Keimlingsstadium, Sorte, Ertragsziel und örtliche Bedingungen. Gerste und Zuckerrübe sind in FAO-Tabellen relativ tolerant, aber keine Kultur ist salzimmun. Im FAO-Anhang 1, Tabelle A1.1, ist Spargel als T (tolerant) eingestuft, nicht als „mäßig“ wie in der ursprünglichen Tabelle. Diese relative Einstufung gilt unter den dort genannten Bedingungen für Bodensalzgehalt und Wachstumsstadium; sie garantiert keinen Erfolg auf jedem Feld.\n\nEine relativ salztolerante Nutzpflanze ist nicht automatisch ein echter Halophyt. Quinoas Reaktion hängt von Genotyp und Stadium ab; Dattelpalmen können relativ tolerant sein, brauchen aber lange Etablierung und Investitionen; Spargel ist mehrjährig. Pistazie ist kein einfaches Rezept für „mäßigen Salzgehalt“: Unterlage, Edelreis, Baumalter, Ionen, Winterklima und Wirtschaftlichkeit zählen. Wähle zwei *Kandidaten* mit getrennten Gründen für Wassermangel und Salz und nenne, welcher Befund jede Wahl ändern könnte.', 'Die Quelle nennt Gerste, Quinoa, Zuckerrübe, Dattelpalme, Spargel und Pistazie als salztolerante Kandidaten und verwendet Gerste mit Sorghum oder Augenbohne als Modellpaar. Behalte jeden Namen; „hoch“ oder „mittel“ aus der Tabelle wählen keine Kultur, wenn das E Ce-Verfahren unbekannt ist. Vergleiche verlässliche Toleranzdaten mit methodisch passendem Boden-E Ce E, Brunnen-E Ce We und relevanten Ionen und prüfe Keimlingsstadium, Sorte, Ertragsziel und örtliche Bedingungen. Gerste und Zuckerrübe sind in FAO-Tabellen relativ tolerant, aber keine Kultur ist salzimmun. Im FAO-Anhang eins, Tabelle A eins Punkt eins, ist Spargel als Te (tolerant) eingestuft, nicht als „mäßig“ wie in der ursprünglichen Tabelle. Diese relative Einstufung gilt unter den dort genannten Bedingungen für Bodensalzgehalt und Wachstumsstadium; sie garantiert keinen Erfolg auf jedem Feld.\n\nEine relativ salztolerante Nutzpflanze ist nicht automatisch ein echter Halophyt. Quinoas Reaktion hängt von Genotyp und Stadium ab; Dattelpalmen können relativ tolerant sein, brauchen aber lange Etablierung und Investitionen; Spargel ist mehrjährig. Pistazie ist kein einfaches Rezept für „mäßigen Salzgehalt“: Unterlage, Edelreis, Baumalter, Ionen, Winterklima und Wirtschaftlichkeit zählen. Wähle zwei Kandidaten mit getrennten Gründen für Wassermangel und Salz und nenne, welcher Befund jede Wahl ändern könnte.'), ('Die ursprüngliche Aufgabe betrifft eine 10 m × 10 m (100 m²) große sandige Lehmparzelle mit 0,8 % organischer Substanz, einem Boden-EC von 3,5 dS/m und Brunnenwasser, das als leicht salzhaltig beschrieben ist. Drei Planungsprobleme sind der gemessene geringe Humusanteil, möglicher Salzstress im Wurzelraum und eine nicht quantifizierte Salzfracht des Wassers. Erfrage Probenahmetiefe und -datum, Boden-EC-Verfahren (etwa ECe statt verdünnter Extrakt), ECw und Ionen des Wassers, pH, Profiltiefe und Entwässerung. Die Quellenbezeichnung „mäßig salzig“ ersetzt die fehlende Messmethode nicht.\n\nEine Seite kann vier Spalten haben: Beobachtung und fehlende Prüfung; vermuteter Mechanismus; bedingte Maßnahme und Priorität; Nachweis des Erfolgs oder Änderungsbedarf. Erkläre für jedes Problem die Wirkung auf Pflanzen. Behaupte nicht, dass jede Bewässerung den Bodensalzgehalt erhöht, dass im sandigen Lehm sämtliches Wasser sofort unter die Wurzeln läuft oder dass Kompost allein Salz entfernt.', 'Die ursprüngliche Aufgabe betrifft eine zehn Meter mal zehn Meter (einhundert Quadratmeter) große sandige Lehmparzelle mit null Komma acht Prozent organischer Substanz, einem Boden-E Ce von drei Komma fünf Dezisiemens pro Meter und Brunnenwasser, das als leicht salzhaltig beschrieben ist. Drei Planungsprobleme sind der gemessene geringe Humusanteil, möglicher Salzstress im Wurzelraum und eine nicht quantifizierte Salzfracht des Wassers. Erfrage Probenahmetiefe und -datum, Boden-E Ce-Verfahren (etwa E Ce E statt verdünnter Extrakt), E Ce We und Ionen des Wassers, Pe Ha, Profiltiefe und Entwässerung. Die Quellenbezeichnung „mäßig salzig“ ersetzt die fehlende Messmethode nicht.\n\nEine Seite kann vier Spalten haben: Beobachtung und fehlende Prüfung; vermuteter Mechanismus; bedingte Maßnahme und Priorität; Nachweis des Erfolgs oder Änderungsbedarf. Erkläre für jedes Problem die Wirkung auf Pflanzen. Behaupte nicht, dass jede Bewässerung den Bodensalzgehalt erhöht, dass im sandigen Lehm sämtliches Wasser sofort unter die Wurzeln läuft oder dass Kompost allein Salz entfernt.'), ('Prüfe zuerst Probenahme und Laborverfahren und analysiere das Brunnenwasser. Untersuche Gefälle, Wurzeltiefe, mögliche Sperrschicht, Versickerung und einen Abfluss für Dränwasser. Ist Salz bestätigt und sind geeignetes Wasser sowie funktionierende Entwässerung vorhanden, kann ein fachlich erstellter lokaler Plan kontrollierte Auswaschung enthalten; aus dem unvollständigen Befund lässt sich kein Volumen berechnen. Sind Entwässerung oder Wasserqualität ungeeignet, müssen diese Grenzen zuerst gelöst werden.\n\nOrganische Substanz und Bodenbedeckung können Speicherung, Struktur und Verdunstung verbessern; sie schaffen keinen Abfluss und machen ungeeignetes Wasser nicht geeignet. Lege Prioritäten nach der stärksten Standortgrenze, Kultur und Kosten fest. Nach Maßnahmen miss EC mit demselben Verfahren und vergleichbarer Tiefe erneut und beobachte die Pflanzen, statt Erfolg aus einem gut aussehenden Plan abzuleiten.', 'Prüfe zuerst Probenahme und Laborverfahren und analysiere das Brunnenwasser. Untersuche Gefälle, Wurzeltiefe, mögliche Sperrschicht, Versickerung und einen Abfluss für Dränwasser. Ist Salz bestätigt und sind geeignetes Wasser sowie funktionierende Entwässerung vorhanden, kann ein fachlich erstellter lokaler Plan kontrollierte Auswaschung enthalten; aus dem unvollständigen Befund lässt sich kein Volumen berechnen. Sind Entwässerung oder Wasserqualität ungeeignet, müssen diese Grenzen zuerst gelöst werden.\n\nOrganische Substanz und Bodenbedeckung können Speicherung, Struktur und Verdunstung verbessern; sie schaffen keinen Abfluss und machen ungeeignetes Wasser nicht geeignet. Lege Prioritäten nach der stärksten Standortgrenze, Kultur und Kosten fest. Nach Maßnahmen miss E Ce mit demselben Verfahren und vergleichbarer Tiefe erneut und beobachte die Pflanzen, statt Erfolg aus einem gut aussehenden Plan abzuleiten.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s309-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_SEVEN_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':7,'maximumBlindReviewPerLane':7,'maximumASRPerLane':7,'maximumTTSAggregate':28,'maximumBlindAggregate':28,'maximumASRAggregate':28,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
