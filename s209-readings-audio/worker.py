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
IDS = ('S2-09-ar-EG-R01-r1', 'S2-09-ar-EG-R02-r1', 'S2-09-ar-EG-R03-r1', 'S2-09-ar-EG-R04-r1', 'S2-09-ar-EG-R05-r1', 'S2-09-ar-EG-R06-r1', 'S2-09-ar-EG-R07-r1', 'S2-09-en-R01-r1', 'S2-09-en-R02-r1', 'S2-09-en-R03-r1', 'S2-09-en-R04-r1', 'S2-09-en-R05-r1', 'S2-09-en-R06-r1', 'S2-09-en-R07-r1', 'S2-09-it-R01-r1', 'S2-09-it-R02-r1', 'S2-09-it-R03-r1', 'S2-09-it-R04-r1', 'S2-09-it-R05-r1', 'S2-09-it-R06-r1', 'S2-09-it-R07-r1', 'S2-09-de-R01-r1', 'S2-09-de-R02-r1', 'S2-09-de-R03-r1', 'S2-09-de-R04-r1', 'S2-09-de-R05-r1', 'S2-09-de-R06-r1', 'S2-09-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S209_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s209-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06','R07']
        ri=int(group[1:])-1;voice='Charon'if ri%2==0 else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]==[f'/reading/{ri}/paragraphs/{i}'for i in range(len(u['sourceBindings']))] and len(u['sourceBindings'])in[2,3]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('البوتاسيوم البوتاسيوم', 'البوتاسيوم ورمزه كيه'), ('التقرير ممكن يكتب عنصرًا بوحدة جزء في المليون ppm، أو يكتب فئة منخفض/متوسط أو مناسب/مرتفع. ppm يعني جزءًا من مليون على أساس الكتلة أو الحجم المعلن. في نتيجة على كتلة التربة، 1 ppm ممكن تكتب 1 mg/kg؛ وفي محلول قد تعني mg/L. ما تحولش بينهم من غير أساس التقرير وحسابات المعمل.\n\nنفس الرقم ممكن يأخذ فئة مختلفة بتغير الاستخلاص أو المنطقة أو المحصول أو معايرة التفسير. خليك حاطط طريقة التقرير ومرجعه جنب النتيجة. الفئة تفسير لاحتمال استجابة المحصول في ظروف معينة، مش عدد شكاير مباشر.', 'التقرير ممكن يكتب عنصر بوحدة جزء في المليون جزء في المليون، أو يكتب فئة منخفض/متوسط أو مناسب/مرتفع. جزء في المليون يعني جزء من مليون على أساس الكتلة أو الحجم المعلن. في نتيجة على كتلة التربة، جزء واحد في المليون ممكن تكتب مليجرام واحد لكل كيلوجرام؛ وفي محلول قد تعني مليجرام لكل لتر. ما تحولش بينهم من غير أساس التقرير وحسابات المعمل.\n\nنفس الرقم ممكن يأخذ فئة مختلفة بتغير الاستخلاص أو المنطقة أو المحصول أو معايرة التفسير. خليك حاطط طريقة التقرير ومرجعه جنب النتيجة. الفئة تفسير لاحتمال استجابة المحصول في ظروف معينة، مش عدد شكاير مباشر.'), ('الجدول التعليمي تحت حافظ أرقام المثال عمدًا. فيه فراغات غير مصنفة: المادة العضوية 2–3%، وP بين 15–20 وبين 40–50 ppm، وK بين 100–120 وبين 200–250 ppm؛ الصفوف ما خصصتش لهم فئة. صف N ما فيهش حد ثابت للفئة المناسبة أو المرتفعة. ما تخترعش فئة داخل الفراغ أو تنقل الحدود لمعمل تاني.\n\nالإجراءات المبسطة في الجدول — فحص جدوى الجير لما pH منخفض للمحصول، أو بحث إضافة P أو K مناسبة لما يثبت نقصهما، أو مواد عضوية عند الحاجة — أسئلة للتوصية المحلية، مش أوامر تلقائية. pH المرتفع لا يعني كبريتًا تلقائيًا في الأرض الجيرية، وقراءة N منخفضة في وقت واحد ما تثبتش وحدها جرعة نيتروجين ثابتة.', 'الجدول التعليمي تحت حافظ أرقام المثال عمدًا. فيه فراغات غير مصنفة: المادة العضوية اتنين إلى تلاتة في المية، والفوسفور بين خمستاشر إلى عشرين وبين أربعين إلى خمسين جزء في المليون، والبوتاسيوم بين مية إلى مية وعشرين وبين ميتين إلى ميتين وخمسين جزء في المليون؛ الصفوف ما خصصتش لهم فئة. صف النيتروجين ما فيهش حد ثابت للفئة المناسبة أو المرتفعة. ما تخترعش فئة داخل الفراغ أو تنقل الحدود لمعمل تاني.\n\nالإجراءات المبسطة في الجدول — فحص جدوى الجير لما بي إتش منخفض للمحصول، أو بحث إضافة الفوسفور أو البوتاسيوم مناسبة لما يثبت نقصهما، أو مواد عضوية عند الحاجة — أسئلة للتوصية المحلية، مش أوامر تلقائية. بي إتش المرتفع لا يعني كبريتًا تلقائيًا في الأرض الجيرية، وقراءة النيتروجين منخفضة في وقت واحد ما تثبتش وحدها جرعة نيتروجين ثابتة.'), ('الفوسفور الفوسفور', 'الفوسفور ورمزه بي'), ('النيتروجين N يساعد النمو الورقي وبروتينات النبات. الفوسفور P يدخل في نقل الطاقة ونمو الجذور والتكاثر. البوتاسيوم K يساعد تنظيم استخدام الماء وعمليات نباتية كثيرة. دي روابط تمهيدية مفيدة، مش طريقة لتشخيص نقص من ورقة صفراء واحدة أو لحساب جرعة سماد.\n\nاسم العنصر في تقرير التربة، وصورته الكيميائية المقاسة، والرقم على شكارة السماد ممكن يكونوا بأسس مختلفة. راجع تسمية كل واحد قبل المقارنة.', 'النيتروجين النيتروجين يساعد النمو الورقي وبروتينات النبات. الفوسفور الفوسفور يدخل في نقل الطاقة ونمو الجذور والتكاثر. البوتاسيوم البوتاسيوم يساعد تنظيم استخدام الماء وعمليات نباتية كثيرة. دي روابط تمهيدية مفيدة، مش طريقة لتشخيص نقص من ورقة صفراء واحدة أو لحساب جرعة سماد.\n\nاسم العنصر في تقرير التربة، وصورته الكيميائية المقاسة، والرقم على شكارة السماد ممكن يكونوا بأسس مختلفة. راجع تسمية كل واحد قبل المقارنة.'), ('النيتروجين النيتروجين', 'النيتروجين ورمزه إن'), ('بعدها نرشّح معلق التربة لنأخذ سائلًا مستخلصًا. في طريقة لونية، كاشف محدد يتفاعل مع جزء مقاس من المستخلص فيظهر لون. نقارن اللون بجدول الطقم أو نقرأه بجهاز مناسب بعد فحص عينة الشاهد (البلانك) أو المعايرة المطلوبة حسب الطريقة. الخطوات الدقيقة تخص الطقم أو المعمل الفعلي، مش وصفة عامة من أربع كلمات.\n\nممكن المدرّب يعرض بدل كده تقرير معمل بطريقة جهازية. الجهاز الرقمي مش لازم يستخدم نفس التفاعل اللوني. اسأل عن طريقة الاستخلاص وطريقة القراءة، وما تنقلش نتيجة طقم لوني إلى مجال مرجعي لطريقة مختلفة.', 'بعدها نرشّح معلق التربة لنأخذ سائل مستخلص. في طريقة لونية، كاشف محدد يتفاعل مع جزء مقاس من المستخلص فيظهر لون. نقارن اللون بجدول الطقم أو نقرأه بجهاز مناسب بعد فحص عينة الشاهد (البلانك) أو المعايرة المطلوبة حسب الطريقة. الخطوات الدقيقة تخص الطقم أو المعمل الفعلي، مش وصفة عامة من أربع كلمات.\n\nممكن المدرّب يعرض بدل كده تقرير معمل بطريقة جهازية. الجهاز الرقمي مش لازم يستخدم نفس التفاعل اللوني. اسأل عن طريقة الاستخلاص وطريقة القراءة، وما تنقلش نتيجة طقم لوني إلى مجال مرجعي لطريقة مختلفة.'), ('بين أربعين إلى خمسين', 'بين أربعين وخمسين'), ('بين خمستاشر إلى عشرين', 'بين خمستاشر وعشرين'), ('بين مية إلى مية وعشرين', 'بين مية ومية وعشرين'), ('بين ميتين إلى ميتين وخمسين', 'بين ميتين وميتين وخمسين'), ('جزء في المليون جزء في المليون', 'جزء في المليون، واختصارها بي بي إم'), ('فكر دقيقة: داخل جدول المثال المعروض فقط، pH 5.5 في صف pH المنخفض، وP 12 ppm في صف الفوسفور المنخفض. ناقش مع زميلك دقيقتين ليه التصنيف مرتبط بطريقة الجدول وصلته بالمنطقة. شارك دقيقتين واذكر المحصول وطريقة المعمل ونتيجة الحموضة المخزونة وتوصية P المعايرة اللي تحتاجهم قبل أي كمية.\n\nالاتجاه المقبول قد يكون بحث التجيير وخطة فوسفور، لكن عدد الشكاير لا يخرج من pH 5.5 و12 ppm وحدهما. اكتب X لكمية جير محتملة وY لكمية سماد محتملة كرمزين مجهولين، مش صفر ولا أرقام تخمين.', 'فكر دقيقة: داخل جدول المثال المعروض فقط، بي إتش خمسة فاصلة خمسة في صف بي إتش المنخفض، والفوسفور اتناشر جزء في المليون في صف الفوسفور المنخفض. ناقش مع زميلك دقيقتين ليه التصنيف مرتبط بطريقة الجدول وصلته بالمنطقة. شارك دقيقتين واذكر المحصول وطريقة المعمل ونتيجة الحموضة المخزونة وتوصية الفوسفور المعايرة اللي تحتاجهم قبل أي كمية.\n\nالاتجاه المقبول قد يكون بحث التجيير وخطة فوسفور، لكن عدد الشكاير لا يخرج من بي إتش خمسة فاصلة خمسة و اتناشر جزء في المليون وحدهما. اكتب إكس لكمية جير محتملة وواي لكمية سماد محتملة كرمزين مجهولين، مش صفر ولا أرقام تخمين.'), ('في عرض المدرّب لطقم سريع، كمية معلومة من تربة مجهزة تتخلط بمحلول استخلاص محدد. الطريقة وكمية التربة بالنسبة للمحلول ووقت الخلط والظروف يحددوا أي جزء من العنصر هيدخل السائل. العرض يقدر يوضح الفكرة من غير ما الطالب يتعامل مع الكواشف.\n\nما تتخيلش إن المحلول ينسخ عمل الجذور أو يطلع كل العنصر في التربة. مستخلص تحليل التربة مؤشر تحدده الطريقة، والمعامل تربطه باستجابة المحصول من تجارب معايرة؛ المخزون الكلي وما يستطيع محصول بعينه امتصاصه سؤالان مختلفان. سجّل اسم الطريقة وأساس العينة ومعنى النتيجة في تقرير المعمل.', 'في عرض المدرّب لطقم سريع، كمية معلومة من تربة مجهزة تتخلط بمحلول استخلاص محدد. الطريقة وكمية التربة بالنسبة للمحلول ووقت الخلط والظروف يحددوا أي جزء من العنصر هيدخل السائل. العرض يقدر يوضح الفكرة من غير ما الطالب يتعامل مع الكواشف.\n\nما تتخيلش إن المحلول ينسخ عمل الجذور أو يطلع كل العنصر في التربة. مستخلص تحليل التربة مؤشر تحدده الطريقة، والمعامل تربطه باستجابة المحصول من تجارب معايرة؛ المخزون الكلي وما يستطيع محصول بعينه امتصاصه سؤالين مختلفين. سجّل اسم الطريقة وأساس العينة ومعنى النتيجة في تقرير المعمل.'), ('قياس N السريع ممكن يتغير مع الوقت وحركة الماء والعمليات الحيوية. اعتبر N مثل وجبة تتحرك أو تُستهلك بسرعة، وP وK أقرب لمخزن في التشبيه؛ ده يساعدك تفتكر التوقيت، لكنه مش قاعدة كيميائية أو زراعية. خطة N تعتمد على طلب المحصول وتوقيت الإضافة والإضافات السابقة وإمداد التربة وتوصية محلية مناسبة، مش رقم منخفض واحد.\n\nتركيز P أو K بوحدة ppm في تحليل التربة مختلف عن ملصق السماد. شكارة مكتوب عليها 11-52-0 تعني نسبًا مئوية من N وفوسفات محسوبًا P2O5 وبوتاس محسوبًا K2O في المنتج. ما تعنيش إن التربة فيها 11 أو 52 أو 0 ppm. اقرأ نتائج التقرير وطريقته وتفسيره وتوصية المحصول منفصلين عن التحليل المضمون للمنتج.', 'قياس النيتروجين السريع ممكن يتغير مع الوقت وحركة الماء والعمليات الحيوية. اعتبر النيتروجين مثل وجبة تتحرك أو تُستهلك بسرعة، والفوسفور والبوتاسيوم أقرب لمخزن في التشبيه؛ ده يساعدك تفتكر التوقيت، لكنه مش قاعدة كيميائية أو زراعية. خطة النيتروجين تعتمد على طلب المحصول وتوقيت الإضافة والإضافات السابقة وإمداد التربة وتوصية محلية مناسبة، مش رقم منخفض واحد.\n\nتركيز الفوسفور أو البوتاسيوم بوحدة جزء في المليون في تحليل التربة مختلف عن ملصق السماد. شكارة مكتوب عليها حداشر، اتنين وخمسين، صفر تعني نسب مئوية من النيتروجين وفوسفات محسوب بي اتنين أو خمسة وبوتاس محسوب كيه اتنين أو في المنتج. ما تعنيش إن التربة فيها حداشر أو اتنين وخمسين أو صفر جزء في المليون. اقرأ نتائج التقرير وطريقته وتفسيره وتوصية المحصول منفصلين عن التحليل المضمون للمنتج.'), ('كبريتًا تلقائيًا', 'كبريت تلقائي')], 'en': [("A quick N measurement can change with timing, water movement and biological processes. Think of N as a meal that can move or be used quickly, while P and K tests are sometimes compared with a pantry; the analogy helps remember timing but is not a chemical or agronomic rule. Nitrogen planning depends on crop demand, timing, prior inputs, soil supply and an appropriate local recommendation—not one low number alone.\n\nA soil-test P or K concentration in ppm is different from a fertilizer label. A bag marked 11-52-0 reports percentage N, phosphate expressed as P2O5 and potash expressed as K2O. It does not say that the soil contains 11, 52 or 0 ppm. Read the report's results, method, interpretation and crop-specific recommendation separately from the product's guaranteed analysis.", "A quick nitrogen measurement can change with timing, water movement and biological processes. Think of nitrogen as a meal that can move or be used quickly, while phosphorus and potassium tests are sometimes compared with a pantry; the analogy helps remember timing but is not a chemical or agronomic rule. Nitrogen planning depends on crop demand, timing, prior inputs, soil supply and an appropriate local recommendation—not one low number alone.\n\nA soil-test phosphorus or potassium concentration in parts per million is different from a fertilizer label. A bag marked eleven, fifty-two, zero reports percentage nitrogen, phosphate expressed as P two O five and potash expressed as K two O. It does not say that the soil contains eleven, fifty-two or zero parts per million. Read the report's results, method, interpretation and crop-specific recommendation separately from the product's guaranteed analysis."), ("A report may state a nutrient in parts per million (ppm), or provide a Low, Medium/Optimum or High class. Ppm means one part in a million parts on the stated mass or volume basis. For a mass-of-soil result, 1 ppm can be expressed as 1 mg/kg; a solution result might be mg/L. Do not convert one into the other without the laboratory's reporting basis and calculation.\n\nThe same number can receive a different class when the extraction method, region, crop or calibration changes. Keep the report's method and reference beside the result. A class is an interpretation of crop response probability under stated conditions, not a direct bag count.", "A report may state a nutrient in parts per million (parts per million), or provide a Low, Medium/Optimum or High class. Ppm means one part in a million parts on the stated mass or volume basis. For a mass-of-soil result, one part per million can be expressed as one milligram per kilogram; a solution result might be milligrams per litre. Do not convert one into the other without the laboratory's reporting basis and calculation.\n\nThe same number can receive a different class when the extraction method, region, crop or calibration changes. Keep the report's method and reference beside the result. A class is an interpretation of crop response probability under stated conditions, not a direct bag count."), ('Nitrogen (N) supports leafy growth and plant proteins. Phosphorus (P) is involved in energy transfer, roots and reproductive growth. Potassium (K) helps regulate water use and many plant processes. These are useful first associations, not a way to diagnose a deficiency from one yellow leaf or to calculate a fertilizer rate.\n\nThe nutrient name on a soil report, the chemical form measured and the number on a fertilizer bag may not use the same basis. Confirm each label before comparing them.', 'Nitrogen (nitrogen) supports leafy growth and plant proteins. Phosphorus (phosphorus) is involved in energy transfer, roots and reproductive growth. Potassium (potassium) helps regulate water use and many plant processes. These are useful first associations, not a way to diagnose a deficiency from one yellow leaf or to calculate a fertilizer rate.\n\nThe nutrient name on a soil report, the chemical form measured and the number on a fertilizer bag may not use the same basis. Confirm each label before comparing them.'), ('Nitrogen (nitrogen)', 'Nitrogen, symbol N'), ('Phosphorus (phosphorus)', 'Phosphorus, symbol P'), ('Potassium (potassium)', 'Potassium, symbol K'), ('Ppm means', 'P P M means'), ("The training table below deliberately preserves its example figures. It has unclassified gaps: organic matter 2–3%, P 15–20 and 40–50 ppm, and K 100–120 and 200–250 ppm are not assigned by those rows. Its nitrogen row gives no stable optimum or high boundary. Do not invent a class inside a gap or transfer these cutoffs to another laboratory.\n\nThe table's simple actions—consider lime for a low crop-relevant pH, consider a suitable phosphorus or potassium input when truly deficient, and use organic inputs when appropriate—are questions for a local recommendation, not automatic prescriptions. High pH does not automatically justify sulfur on a calcareous field. A low N snapshot does not by itself prove a fixed nitrogen dose.", "The training table below deliberately preserves its example figures. It has unclassified gaps: organic matter two to three percent, phosphorus fifteen to twenty and forty to fifty parts per million, and potassium one hundred to one hundred twenty and two hundred to two hundred fifty parts per million are not assigned by those rows. Its nitrogen row gives no stable optimum or high boundary. Do not invent a class inside a gap or transfer these cutoffs to another laboratory.\n\nThe table's simple actions—consider lime for a low crop-relevant P H, consider a suitable phosphorus or potassium input when truly deficient, and use organic inputs when appropriate—are questions for a local recommendation, not automatic prescriptions. High P H does not automatically justify sulfur on a calcareous field. A low nitrogen snapshot does not by itself prove a fixed nitrogen dose."), ("Think for one minute: under the displayed teaching table only, pH 5.5 is in its low-pH row and P 12 ppm is in its low-P row. Pair for two minutes to explain why those classes depend on the table's method and local relevance. Share for two minutes what crop, lab method, reserve-acidity result and calibrated P recommendation you still need before giving an amount.\n\nThe defensible direction may be to investigate liming and a phosphorus plan, but no number of bags follows from pH 5.5 and 12 ppm alone. Record X for a possible lime amount and Y for a possible fertilizer amount as unresolved placeholders, not as zero or guessed values.", "Think for one minute: under the displayed teaching table only, P H five point five is in its low-P H row and phosphorus twelve parts per million is in its low-phosphorus row. Pair for two minutes to explain why those classes depend on the table's method and local relevance. Share for two minutes what crop, lab method, reserve-acidity result and calibrated phosphorus recommendation you still need before giving an amount.\n\nThe defensible direction may be to investigate liming and a phosphorus plan, but no number of bags follows from P H five point five and twelve parts per million alone. Record X for a possible lime amount and Y for a possible fertilizer amount as unresolved placeholders, not as zero or guessed values."), ('parts per million (parts per million)', 'parts per million, abbreviated P P M'), ('reports percentage nitrogen', 'reports percentages of nitrogen')], 'it': [('Il piano azoto', 'Il piano dell’azoto'), ('Il rapporto può indicare parti per milione (ppm) o categorie Basso, Medio/Adatto e Alto. Ppm significa una parte su un milione sulla base di massa o volume dichiarata. Per una massa di suolo, 1 ppm può essere 1 mg/kg; in soluzione può essere mg/L. Non convertire senza base del rapporto e calcolo del laboratorio.\n\nLo stesso numero può avere classe diversa con estraente, regione, coltura o calibrazione differenti. Tieni metodo e riferimento accanto al risultato. La categoria interpreta la probabile risposta colturale nelle condizioni dichiarate, non il numero diretto di sacchi.', 'Il rapporto può indicare parti per milione (parti per milione) o categorie Basso, Medio/Adatto e Alto. Ppm significa una parte su un milione sulla base di massa o volume dichiarata. Per una massa di suolo, una parte per milione può essere un milligrammo per chilogrammo; in soluzione può essere milligrammi per litro. Non convertire senza base del rapporto e calcolo del laboratorio.\n\nLo stesso numero può avere classe diversa con estraente, regione, coltura o calibrazione differenti. Tieni metodo e riferimento accanto al risultato. La categoria interpreta la probabile risposta colturale nelle condizioni dichiarate, non il numero diretto di sacchi.'), ('Immagina azoto', 'Immagina l’azoto'), ("L'azoto (N) sostiene crescita fogliare e proteine della pianta. Il fosforo (P) partecipa al trasferimento di energia, allo sviluppo radicale e riproduttivo. Il potassio (K) aiuta a regolare l'acqua e molti processi vegetali. Sono prime associazioni utili, non un modo per diagnosticare una carenza da una sola foglia gialla o per calcolare una dose.\n\nIl nome del nutriente sul rapporto del suolo, la forma chimica misurata e il numero sul sacco del concime possono usare basi diverse. Controlla ogni etichetta prima di confrontarle.", "L'azoto (azoto) sostiene crescita fogliare e proteine della pianta. Il fosforo (fosforo) partecipa al trasferimento di energia, allo sviluppo radicale e riproduttivo. Il potassio (potassio) aiuta a regolare l'acqua e molti processi vegetali. Sono prime associazioni utili, non un modo per diagnosticare una carenza da una sola foglia gialla o per calcolare una dose.\n\nIl nome del nutriente sul rapporto del suolo, la forma chimica misurata e il numero sul sacco del concime possono usare basi diverse. Controlla ogni etichetta prima di confrontarle."), ("La tabella seguente conserva deliberatamente i numeri dell'esempio. Ha intervalli senza classe: sostanza organica 2–3%, P 15–20 e 40–50 ppm, K 100–120 e 200–250 ppm. La riga N non dà soglie stabili di adeguato o alto. Non inventare una classe in un intervallo vuoto né trasferire queste soglie a un altro laboratorio.\n\nLe azioni semplici della tabella — valutare calce per pH basso rispetto alla coltura, possibili apporti P o K se la carenza è confermata, o materiali organici idonei — richiedono una raccomandazione locale, non sono prescrizioni automatiche. Un pH alto non impone zolfo in un terreno calcareo. Un solo valore basso di N non dimostra una dose fissa.", "La tabella seguente conserva deliberatamente i numeri dell'esempio. Ha intervalli senza classe: sostanza organica due a tre per cento, fosforo quindici a venti e quaranta a cinquanta parti per milione, potassio cento a centoventi e duecento a duecentocinquanta parti per milione. La riga azoto non dà soglie stabili di adeguato o alto. Non inventare una classe in un intervallo vuoto né trasferire queste soglie a un altro laboratorio.\n\nLe azioni semplici della tabella — valutare calce per P H basso rispetto alla coltura, possibili apporti fosforo o potassio se la carenza è confermata, o materiali organici idonei — richiedono una raccomandazione locale, non sono prescrizioni automatiche. Un P H alto non impone zolfo in un terreno calcareo. Un solo valore basso di azoto non dimostra una dose fissa."), ('Pensa per un minuto: solo nella tabella mostrata, pH 5.5 ricade nella riga del pH basso e P 12 ppm in quella del P basso. Confrontati per due minuti sul perché le classi dipendono da metodo e pertinenza locale. Condividi per due minuti quali coltura, metodo di laboratorio, acidità di riserva e raccomandazione P calibrata mancano prima di dare una quantità.\n\nLa direzione difendibile può essere valutare calce e piano fosforo, ma dai soli pH 5.5 e 12 ppm non segue alcun numero di sacchi. Scrivi X per possibile calce e Y per possibile concime come incognite, non zero o stime inventate.', 'Pensa per un minuto: solo nella tabella mostrata, P H cinque virgola cinque ricade nella riga del P H basso e fosforo dodici parti per milione in quella del fosforo basso. Confrontati per due minuti sul perché le classi dipendono da metodo e pertinenza locale. Condividi per due minuti quali coltura, metodo di laboratorio, acidità di riserva e raccomandazione fosforo calibrata mancano prima di dare una quantità.\n\nLa direzione difendibile può essere valutare calce e piano fosforo, ma dai soli P H cinque virgola cinque e dodici parti per milione non segue alcun numero di sacchi. Scrivi X per possibile calce e Y per possibile concime come incognite, non zero o stime inventate.'), ('Ppm significa', 'Pi pi emme significa'), ('Una concentrazione fosforo o potassio', 'Una concentrazione di fosforo o potassio'), ("Una misura rapida di N cambia con tempo, movimento dell'acqua e processi biologici. Immagina N come un pasto che può muoversi o essere usato presto, mentre P e K a volte si paragonano a una dispensa: l'analogia ricorda il tempo, ma non è una legge agronomica. Il piano N dipende da fabbisogno della coltura, tempo, apporti precedenti, disponibilità del suolo e indicazione locale appropriata, non da un solo numero basso.\n\nUna concentrazione P o K in ppm nel suolo non è l'etichetta del concime. Un sacco 11-52-0 dichiara percentuali di N, fosfato espresso come P2O5 e potassa espressa come K2O. Non significa che il suolo contenga 11, 52 o 0 ppm. Leggi risultati, metodo, interpretazione e consiglio colturale del rapporto separatamente dall'analisi garantita del prodotto.", "Una misura rapida di azoto cambia con tempo, movimento dell'acqua e processi biologici. Immagina azoto come un pasto che può muoversi o essere usato presto, mentre fosforo e potassio a volte si paragonano a una dispensa: l'analogia ricorda il tempo, ma non è una legge agronomica. Il piano azoto dipende da fabbisogno della coltura, tempo, apporti precedenti, disponibilità del suolo e indicazione locale appropriata, non da un solo numero basso.\n\nUna concentrazione fosforo o potassio in parti per milione nel suolo non è l'etichetta del concime. Un sacco undici, cinquantadue, zero dichiara percentuali di azoto, fosfato espresso come pi due o cinque e potassa espressa come cappa due o. Non significa che il suolo contenga undici, cinquantadue o zero parti per milione. Leggi risultati, metodo, interpretazione e consiglio colturale del rapporto separatamente dall'analisi garantita del prodotto."), ('azoto (azoto)', 'azoto, simbolo enne'), ('fosforo (fosforo)', 'fosforo, simbolo pi'), ('parti per milione (parti per milione)', 'parti per milione, abbreviate pi pi emme'), ('possibili apporti fosforo o potassio', 'possibili apporti di fosforo o potassio'), ('potassio (potassio)', 'potassio, simbolo cappa'), ('raccomandazione fosforo calibrata', 'raccomandazione calibrata per il fosforo')], 'de': [('Denke eine Minute nach: Nur innerhalb der gezeigten Lehrtabelle liegt pH 5.5 in der Niedrig-pH-Zeile und P 12 ppm in der Niedrig-P-Zeile. Besprich zwei Minuten mit einer anderen Person, warum diese Stufen von Methode und örtlicher Eignung abhängen. Teile zwei Minuten lang mit, welche Kultur, Labormethode, Reserveazidität und kalibrierte P-Empfehlung vor einer Menge noch nötig sind.\n\nDie vertretbare Richtung kann eine Kalkprüfung und ein Phosphorplan sein, doch aus pH 5.5 und 12 ppm folgt keine Sackzahl. Trage X als mögliche Kalk- und Y als mögliche Düngermenge als ungeklärte Platzhalter ein, nicht als null oder Schätzung.', 'Denke eine Minute nach: Nur innerhalb der gezeigten Lehrtabelle liegt P H fünf Komma fünf in der Niedrig-P H-Zeile und Phosphor zwölf Teile pro Million in der Niedrig-Phosphor-Zeile. Besprich zwei Minuten mit einer anderen Person, warum diese Stufen von Methode und örtlicher Eignung abhängen. Teile zwei Minuten lang mit, welche Kultur, Labormethode, Reserveazidität und kalibrierte Phosphor-Empfehlung vor einer Menge noch nötig sind.\n\nDie vertretbare Richtung kann eine Kalkprüfung und ein Phosphorplan sein, doch aus P H fünf Komma fünf und zwölf Teile pro Million folgt keine Sackzahl. Trage X als mögliche Kalk- und Y als mögliche Düngermenge als ungeklärte Platzhalter ein, nicht als null oder Schätzung.'), ('Die folgende Lehrtabelle bewahrt ihre Beispielzahlen bewusst. Einige Bereiche sind nicht klassifiziert: organische Substanz 2–3%, P 15–20 und 40–50 ppm sowie K 100–120 und 200–250 ppm. Die N-Zeile bietet keine stabile Grenze für Geeignet oder Hoch. Erfinde keine Klasse in einer Lücke und übertrage die Schwellen nicht auf ein anderes Labor.\n\nDie einfachen Aussagen der Tabelle — Kalk bei kulturbezogen niedrigem pH prüfen, bei bestätigtem Mangel geeigneten P- oder K-Einsatz erwägen und organisches Material bei Bedarf einsetzen — erfordern lokale Empfehlungen und sind keine Automatismen. Hoher pH rechtfertigt nicht automatisch Schwefel auf kalkhaltigem Boden. Ein einzelner niedriger N-Messwert beweist keine feste N-Menge.', 'Die folgende Lehrtabelle bewahrt ihre Beispielzahlen bewusst. Einige Bereiche sind nicht klassifiziert: organische Substanz zwei bis drei Prozent, Phosphor fünfzehn bis zwanzig und vierzig bis fünfzig Teile pro Million sowie Kalium einhundert bis einhundertzwanzig und zweihundert bis zweihundertfünfzig Teile pro Million. Die Stickstoff-Zeile bietet keine stabile Grenze für Geeignet oder Hoch. Erfinde keine Klasse in einer Lücke und übertrage die Schwellen nicht auf ein anderes Labor.\n\nDie einfachen Aussagen der Tabelle — Kalk bei kulturbezogen niedrigem P H prüfen, bei bestätigtem Mangel geeigneten Phosphor- oder Kalium-Einsatz erwägen und organisches Material bei Bedarf einsetzen — erfordern lokale Empfehlungen und sind keine Automatismen. Hoher P H rechtfertigt nicht automatisch Schwefel auf kalkhaltigem Boden. Ein einzelner niedriger Stickstoff-Messwert beweist keine feste Stickstoff-Menge.'), ('Ein Bericht nennt gegebenenfalls Teile pro Million (ppm) oder die Stufen Niedrig, Mittel/Geeignet und Hoch. Ppm heißt ein Teil in einer Million auf der angegebenen Masse- oder Volumenbasis. Bei Bodenmasse kann 1 ppm als 1 mg/kg angegeben sein, in einer Lösung möglicherweise als mg/L. Wandle nicht ohne Berichtsgrundlage und Laborrechnung um.\n\nDieselbe Zahl kann je nach Extraktion, Region, Kultur oder Kalibrierung anders eingestuft werden. Bewahre Methode und Referenz beim Ergebnis auf. Eine Stufe deutet die Wahrscheinlichkeit einer Kulturreaktion unter genannten Bedingungen, nicht direkt die Sackzahl.', 'Ein Bericht nennt gegebenenfalls Teile pro Million (Teile pro Million) oder die Stufen Niedrig, Mittel/Geeignet und Hoch. Ppm heißt ein Teil in einer Million auf der angegebenen Masse- oder Volumenbasis. Bei Bodenmasse kann ein Teil pro Million als ein Milligramm je Kilogramm angegeben sein, in einer Lösung möglicherweise als Milligramm je Liter. Wandle nicht ohne Berichtsgrundlage und Laborrechnung um.\n\nDieselbe Zahl kann je nach Extraktion, Region, Kultur oder Kalibrierung anders eingestuft werden. Bewahre Methode und Referenz beim Ergebnis auf. Eine Stufe deutet die Wahrscheinlichkeit einer Kulturreaktion unter genannten Bedingungen, nicht direkt die Sackzahl.'), ('Eine schnelle N-Messung kann sich durch Zeitpunkt, Wasserbewegung und biologische Vorgänge ändern. N als rasch genutzte oder bewegte Mahlzeit und P/K als Vorratskammer zu denken hilft beim Merken der Zeit, ist aber keine chemische oder agronomische Regel. N-Planung richtet sich nach Kulturbedarf, Zeitpunkt, früheren Gaben, Bodennachlieferung und geeigneter örtlicher Empfehlung, nicht nach einer niedrigen Zahl allein.\n\nEin P- oder K-Gehalt in ppm des Bodens ist etwas anderes als das Düngeretikett. Ein Sack 11-52-0 nennt Prozentanteile N, Phosphat als P2O5 und Kali als K2O im Produkt. Das heißt nicht, der Boden enthalte 11, 52 oder 0 ppm. Lies Ergebnisse, Methode, Deutung und kulturbezogene Empfehlung des Bodenberichts getrennt von der garantierten Produktanalyse.', 'Eine schnelle Stickstoff-Messung kann sich durch Zeitpunkt, Wasserbewegung und biologische Vorgänge ändern. Stickstoff als rasch genutzte oder bewegte Mahlzeit und Phosphor/Kalium als Vorratskammer zu denken hilft beim Merken der Zeit, ist aber keine chemische oder agronomische Regel. Stickstoff-Planung richtet sich nach Kulturbedarf, Zeitpunkt, früheren Gaben, Bodennachlieferung und geeigneter örtlicher Empfehlung, nicht nach einer niedrigen Zahl allein.\n\nEin Phosphor- oder Kalium-Gehalt in Teile pro Million des Bodens ist etwas anderes als das Düngeretikett. Ein Sack elf, zweiundfünfzig, null nennt Prozentanteile Stickstoff, Phosphat als Pe zwei O fünf und Kali als Ka zwei O im Produkt. Das heißt nicht, der Boden enthalte elf, zweiundfünfzig oder null Teile pro Million. Lies Ergebnisse, Methode, Deutung und kulturbezogene Empfehlung des Bodenberichts getrennt von der garantierten Produktanalyse.'), ('Gehalt in Teile pro Million', 'Gehalt in Teilen pro Million'), ('Kalium (Kalium)', 'Kalium, Symbol Ka'), ('Phosphor (Phosphor)', 'Phosphor, Symbol Pe'), ('Ppm heißt', 'Pe Pe Em heißt'), ('Stickstoff (N) unterstützt Blattwachstum und Pflanzenproteine. Phosphor (P) ist an Energietransport, Wurzeln und Fortpflanzungswachstum beteiligt. Kalium (K) hilft bei der Regelung des Wasserhaushalts und vieler Prozesse. Diese ersten Zuordnungen sind nützlich, aber keine Mangelprüfung aus einem gelben Blatt und keine Formel für eine Düngegabe.\n\nNährstoffname im Bodenbericht, gemessene chemische Form und Zahlen auf dem Düngersack können auf unterschiedlichen Grundlagen beruhen. Prüfe jede Bezeichnung vor dem Vergleich.', 'Stickstoff (Stickstoff) unterstützt Blattwachstum und Pflanzenproteine. Phosphor (Phosphor) ist an Energietransport, Wurzeln und Fortpflanzungswachstum beteiligt. Kalium (Kalium) hilft bei der Regelung des Wasserhaushalts und vieler Prozesse. Diese ersten Zuordnungen sind nützlich, aber keine Mangelprüfung aus einem gelben Blatt und keine Formel für eine Düngegabe.\n\nNährstoffname im Bodenbericht, gemessene chemische Form und Zahlen auf dem Düngersack können auf unterschiedlichen Grundlagen beruhen. Prüfe jede Bezeichnung vor dem Vergleich.'), ('Stickstoff (Stickstoff)', 'Stickstoff, Symbol En'), ('Teile pro Million (Teile pro Million)', 'Teile pro Million, abgekürzt Pe Pe Em')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s209-readings-audio-20261023-r1'
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
