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
IDS = ('S3-08-ar-EG-R01-r1', 'S3-08-ar-EG-R02-r1', 'S3-08-ar-EG-R03-r1', 'S3-08-ar-EG-R04-r1', 'S3-08-ar-EG-R05-r1', 'S3-08-ar-EG-R06-r1', 'S3-08-ar-EG-R07-r1', 'S3-08-en-R01-r1', 'S3-08-en-R02-r1', 'S3-08-en-R03-r1', 'S3-08-en-R04-r1', 'S3-08-en-R05-r1', 'S3-08-en-R06-r1', 'S3-08-en-R07-r1', 'S3-08-it-R01-r1', 'S3-08-it-R02-r1', 'S3-08-it-R03-r1', 'S3-08-it-R04-r1', 'S3-08-it-R05-r1', 'S3-08-it-R06-r1', 'S3-08-it-R07-r1', 'S3-08-de-R01-r1', 'S3-08-de-R02-r1', 'S3-08-de-R03-r1', 'S3-08-de-R04-r1', 'S3-08-de-R05-r1', 'S3-08-de-R06-r1', 'S3-08-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S308_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-08')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s308-readings-audio-20261023-r1')
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
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1', '/reading/0/paragraphs/2'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1'], 'R07': ['/reading/6/paragraphs/0', '/reading/6/paragraphs/1']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الأصل بيسميه تقرير تحليل للتربة: قطعة ١٠ م × ١٠ م (١٠٠ م²)، وقوامها لوم رملي، والمادة العضوية OM بنسبة ٠٫٨٪، وEC التربة بقيمة ٣٫٥ dS/m. ميه البئر موصوفة لوحدها إنها قليلة الملوحة من غير رقم ECw. اطلب طريقة استخلاص التربة ودرجة الحرارة وعمق وتاريخ العينة، وكمان ECw لميه البئر وتحليل الأيونات بشكل منفصل. ما تحوّلش رقم التربة لقياس لميه البئر؛ وطرق قياس التربة برضه ما ينفعش نستبدل واحدة بالتانية.\n\nفقط لو ثبت إن ٣٫٥ نتيجة ECe عند ٢٥°م، قارنها بجدول ECe. جدول استرشادي من FAO يحط ٢–٤ dS/m في نطاق قد تتضرر فيه المحاصيل الحساسة؛ ده لا يبرر تسمية ٣٫٥ «متوسطة الملوحة» في كل تصنيف، وقد تستخدم جداول أخرى مسميات مختلفة. نسبة ٠٫٨٪ قيمة مقاسة في الحالة، مش لكل الأراضي الجافة. هات ECw للبئر وتحليل الأيونات المناسب، ثم اربط الملوحة بنفس طريقة القياس بالمحصول والصرف.', 'الأصل بيسميه تقرير تحليل للتربة: قطعة عشرة متر مضروب في عشرة متر (مية متر مربع)، وقوامها لوم رملي، والمادة العضوية بنسبة صفر فاصلة تمانية في المية، وإي سي التربة بقيمة تلاتة فاصلة خمسة ديسي سيمنز لكل متر. ميه البئر موصوفة لوحدها إنها قليلة الملوحة من غير رقم إي سي دبليو. اطلب طريقة استخلاص التربة ودرجة الحرارة وعمق وتاريخ العينة، وكمان إي سي دبليو لميه البئر وتحليل الأيونات بشكل منفصل. ما تحوّلش رقم التربة لقياس لميه البئر؛ وطرق قياس التربة برضه ما ينفعش نستبدل واحدة بالتانية.\n\nفقط لو ثبت إن تلاتة فاصلة خمسة نتيجة إي سي إي عند خمسة وعشرين درجة مئوية، قارنها بجدول إي سي إي. جدول استرشادي من الفاو يحط اتنين إلى أربعة ديسي سيمنز لكل متر في نطاق قد تتضرر فيه المحاصيل الحساسة؛ ده لا يبرر تسمية تلاتة فاصلة خمسة «متوسطة الملوحة» في كل تصنيف، وقد تستخدم جداول أخرى مسميات مختلفة. نسبة صفر فاصلة تمانية في المية قيمة مقاسة في الحالة، مش لكل الأراضي الجافة. هات إي سي دبليو للبئر وتحليل الأيونات المناسب، ثم اربط الملوحة بنفس طريقة القياس بالمحصول والصرف.'), ('الأملاح ممكن تدخل من معادن التربة أو ماء جوفي قريب أو محسنات أو ماء الري. المطر الفعال القليل قد لا يغسل الأملاح الطبيعية كفاية؛ والبخر يزيل الماء ويترك الأملاح أقرب للسطح أو الجذور. ماء ري مالح يضيف حمل أملاح، لكن هل ملوحة التربة تزيد مع الوقت يتحدد بكميات المياه وجودتها واستخدام النبات وجزء الغسل والماء الجوفي ووجود مخرج صرف كافٍ. مش كل رية تزود الملوحة المقاسة حتمًا.\n\nفي رسم القطاع، وضح المطر أو الري نازلًا للجذور، وصعود الماء والبخر السطحي لو موجودين، وخروج الأملاح الذائبة مع صرف مضبوط. لو مياه الغسل ما لهاش مخرج أو هي نفسها بتضيف ملحًا زائدًا، الغسيل المقترح قد يفشل أو يسبب مشكلة. حلل ماء الري قبل نصيحة إدارة الأملاح.', 'الأملاح ممكن تدخل من معادن التربة أو ماء جوفي قريب أو محسنات أو ماء الري. المطر الفعال القليل ممكن ما يغسلش الأملاح الطبيعية كفاية؛ والبخر يزيل الماء ويترك الأملاح أقرب للسطح أو الجذور. ماء ري مالح يضيف حمل أملاح، لكن هل ملوحة التربة تزيد مع الوقت يتحدد بكميات الميه وجودتها واستخدام النبات وجزء الغسل والماء الجوفي ووجود مخرج صرف كافي. مش كل رية تزود الملوحة المقاسة حتمًا.\n\nفي رسم القطاع، وضح المطر أو الري نازل للجذور، وصعود الماء والبخر السطحي لو موجودين، وخروج الأملاح الذائبة مع صرف مضبوط. لو مياه الغسل ما لهاش مخرج أو هي نفسها بتضيف ملح زيادة، الغسيل المقترح قد يفشل أو يسبب مشكلة. حلل ماء الري قبل نصيحة تخص إدارة الأملاح.'), ('الجفاف الفعلي معناه إن منطقة الجذور ناقصها ماء ينفع النبات يستخدمه. في تربة مالحة، الماء ممكن يبقى موجودًا لكن الأملاح المذابة تقلل جهده المائي، فيصعب دخوله للجذور: ده غالبًا اسمه جفاف فسيولوجي أو إجهاد أسموزي. مش زي خزان تربة فاضي.\n\nالصوديوم الزائد قد يعطل امتصاص البوتاسيوم أو الكالسيوم، وبعض الأيونات مثل الكلوريد قد تؤذي محصولًا حساسًا عند تركيز كافٍ. صعوبة الامتصاص واختلال التغذية والسمية قد يجتمعوا، لكن لازم نشرح كل واحد لوحده. الرد يعتمد على تحليل التربة والماء وتحمل المحصول والصرف، مش إضافة ماء لأي نبات دابل.', 'الجفاف الفعلي معناه إن منطقة الجذور ناقصها ميه يقدر النبات يستخدمها. في تربة مالحة، الماء ممكن يبقى موجود لكن الأملاح المذابة تقلل جهده المائي، فيصعب دخوله للجذور: ده غالبًا اسمه جفاف فسيولوجي أو إجهاد أسموزي. مش زي خزان تربة فاضي.\n\nالصوديوم الزائد ممكن يعطل امتصاص البوتاسيوم أو الكالسيوم، وبعض الأيونات زي الكلوريد ممكن تضر محصول حساس عند تركيز كافي. صعوبة الامتصاص واختلال التغذية والسمية ممكن يجتمعوا، لكن لازم نشرح كل واحد لوحده. الرد يعتمد على تحليل التربة والماء وتحمل المحصول والصرف، مش إضافة ماء لأي نبات دابل.'), ('بعض الأراضي الجافة قلوية؛ ارتفاع pH قد يقلل توفر الحديد أو الزنك في ظروف معينة ويساهم في الاصفرار. لازم قياس pH ودليل عنصر مناسب. الجفاف وحده ما يعنيش القلوية.\n\nالكاليشي تراكم كربونات كالسيوم قد يعمل طبقة متماسكة تعوق الجذور أو حركة الماء. طبقة صلبة أخرى ممكن تكون دمكًا أو مادة متماسكة بالجبس أو أفقًا مختلفًا؛ افحص قطاعها وتركيبها لو لزم. ما تسمّيش أي عائق كاليشي، وما تفترضش عمقًا ثابتًا له.', 'بعض الأراضي الجافة قلوية؛ ارتفاع بي إتش قد يقلل توفر الحديد أو الزنك في ظروف معينة ويساهم في الاصفرار. لازم قياس بي إتش ودليل عنصر مناسب. الجفاف وحده ما يعنيش القلوية.\n\nالكاليشي هو تراكم كربونات الكالسيوم قد يعمل طبقة متماسكة تعوق الجذور أو حركة الماء. طبقة صلبة أخرى ممكن تكون دمك أو مادة متماسكة بالجبس أو أفق مختلف؛ افحص قطاعها وتركيبها لو لزم. ما تسمّيش أي عائق كاليشي، وما تفترضش عمق ثابت له.'), ('تخيل نباتًا في جردل رمل شاطئ جاف: الاحتفاظ بالماء والعناصر قد يبقى صعبًا. الصورة دي مدخل للسؤال، مش وصف لكل الصحارى. المناطق الجافة ممكن تضم تربة رملية أو لومية أو ناعمة، وبعض الصحارى باردة. ما تفترضش ملوحة أو طبقة صلبة من غير دليل.\n\nAridisols رتبة تربة مرتبطة بنظام رطوبة جاف وصفات تشخيصية في القطاع، مش مجرد «تربة اتكونت في حر شديد». قلة الماء المتاح للنبات لفترات طويلة نقطة أساسية. تصنيف قطاع حقيقي يحتاج متخصص يراجع الآفاق ونظام الرطوبة، مش كلمة صحراء. اسأل عن مشكلات المزرعة المقترحة فعليًا قبل العلاج.\n\nتمهيد ٥ دقايق: إيه أكبر تحدي في تربة مزرعة صحراوية مقترحة؟ شارك الأفكار على السبورة، وفكّر في مشكلات التربة كمان غير الحر وقلة الميه واختبر افتراضاتك. استخدم ورق الحالات وسبورة أو ورق وأقلام. الموضوع كله ٥٠ دقيقة: ٥ للتمهيد، و٢٥ لخطة المجموعة، و١٥ للشرح والعروض، و٥ للخلاصة والخروج. المجموعة من ٢–٣ أفراد وفيها حد بيسجّل؛ هتكمّل خطة من صفحة واحدة واختيار محصولين في الخطوة الجاية. خطوة تفسير الموقع دي مش الخطة كلها.', 'تخيل نبات في جردل رمل شاطئ جاف: الاحتفاظ بالماء والعناصر قد يبقى صعب. الصورة دي مدخل للسؤال، مش وصف لكل الصحارى. المناطق الجافة ممكن تضم تربة رملية أو لومية أو ناعمة، وبعض الصحارى باردة. ما تفترضش ملوحة أو طبقة صلبة من غير دليل.\n\nأريديسولز رتبة من رتب التربة مرتبطة بنظام رطوبة جاف وصفات تشخيصية في القطاع، مش مجرد «تربة اتكونت في حر شديد». قلة الماء المتاح للنبات لفترات طويلة نقطة أساسية. تصنيف قطاع حقيقي محتاج متخصص يراجع الآفاق ونظام الرطوبة، مش كلمة صحراء. اسأل عن مشكلات المزرعة المقترحة فعلي قبل العلاج.\n\nتمهيد خمسة دقايق: إيه أكبر تحدي في تربة مزرعة صحراوية مقترحة؟ شارك الأفكار على السبورة، وفكّر في مشكلات التربة كمان غير الحر وقلة الميه واختبر افتراضاتك. استخدم ورق الحالات وسبورة أو ورق وأقلام. الموضوع كله خمسين دقيقة: خمسة للتمهيد، وخمسة وعشرين لخطة المجموعة، وخمستاشر للشرح والعروض، وخمسة للخلاصة والخروج. المجموعة من اتنين إلى تلاتة أفراد وفيها حد بيسجّل؛ هتكمّل خطة من صفحة واحدة واختيار محصولين في الخطوة الجاية. خطوة تفسير الموقع دي مش الخطة كلها.'), ('في القطعة المذكورة، المادة العضوية المنخفضة المقاسة، وإجهاد جذور محتمل متعلق بالأملاح، وماء البئر الناقص تحليله ثلاث قضايا. قوام اللوم الرملي يؤثر في الخزن، لكن رسم الرمل الخالص لا يمثله بالحرف. ارسم عمودين يقارنوا كيف قد تغيّر المدخلات العضوية والتجمعات حركة الماء؛ ما ترسمش الكمبوست وهو بيسد كل المسام أو يوقف الصرف.\n\nقلة المادة العضوية ممكن تقلل مخزون الميه هنا، والملوحة في منطقة الجذور ممكن تصعّب امتصاصها. لو اتأكد إن الأملاح قللت النمو، كمية النبات والمخلفات اللي بترجع للتربة ممكن تقل، وده يساعد على استمرار قلة المدخلات العضوية؛ دي حلقة محتملة، مش تاريخ مثبت للقطعة. صرف اللوم الرملي ما يخليش غسل الملح مستحيل: ممكن يحصل لما ميه مناسبة تعدّي خلال منطقة الجذور، ومخرج صرف كافي يبعد الأملاح. الخطوة دي للتعرّف على الموقع وتفسيره. الخطوات الجاية هتختبر المحسنات وإدارة الميه والمحاصيل عشان خطة إصلاح في صفحة واحدة. لحد ما طريقة EC وكيمياء الميه تتعرف، يبقى بدري على تصنيف ملوحة دقيق أو جرعة محسن أو برنامج غسل أو اختيار محصولين بشكل نهائي.', 'في القطعة المذكورة، المادة العضوية المنخفضة المقاسة، وإجهاد جذور محتمل متعلق بالأملاح، وماء البئر الناقص تحليله ثلاث قضايا. قوام اللوم الرملي يؤثر في الخزن، لكن رسم الرمل الخالص لا يمثله بالحرف. ارسم عمودين يقارنوا كيف قد تغيّر المدخلات العضوية والتجمعات حركة الماء؛ ما ترسمش الكمبوست وهو بيسد كل المسام أو يوقف الصرف.\n\nقلة المادة العضوية ممكن تقلل مخزون الميه هنا، والملوحة في منطقة الجذور ممكن تصعّب امتصاصها. لو اتأكد إن الأملاح قللت النمو، كمية النبات والمخلفات اللي بترجع للتربة ممكن تقل، وده يساعد على استمرار قلة المدخلات العضوية؛ دي حلقة محتملة، مش تاريخ مثبت للقطعة. صرف اللوم الرملي ما يخليش غسل الملح مستحيل: ممكن يحصل لما ميه مناسبة تعدّي خلال منطقة الجذور، ومخرج صرف كافي يبعد الأملاح. الخطوة دي للتعرّف على الموقع وتفسيره. الخطوات الجاية هتختبر المحسنات وإدارة الميه والمحاصيل عشان خطة إصلاح في صفحة واحدة. لحد ما طريقة إي سي وكيمياء الميه تتعرف، يبقى بدري على تصنيف ملوحة دقيق أو جرعة محسن أو برنامج غسل أو اختيار محصولين بشكل نهائي.'), ('قلة الغطاء النباتي والمخلفات قد تقلل المادة العضوية في مكان جاف. الحرارة تؤثر في التحلل، لكن الجفاف الشديد ممكن يبطئ نشاط الميكروبات؛ الشمس القوية وحدها ما تثبتش تحللًا سريعًا. مقارنة الأصل بين بعض أراضي الصحراء تحت ١٪ وأرض أكثر رطوبة حوالي ٤–٥٪ مثال، مش حد ثابت لكل موقع.\n\nالمادة العضوية ممكن تساعد على تكوين تجمعات التربة ودخول الميه وتخزينها والاحتفاظ بالعناصر. في لوم رملي قليل المادة العضوية، ممكن يقل مخزون الميه في منطقة الجذور وتزيد قابلية غسل العناصر، لكن الميه مش دايمًا بتتصرف فورًا، ولا كل سماد لازم يتغسل. القوام والبناء والعمق والري والتحليل الفعلي هما اللي يحددوا حجم المشكلة. ضعف بناء السطح ممكن يزود التعرّض للتعرية أو الدمك مع طرق إدارة معينة.', 'قلة الغطاء النباتي والمخلفات ممكن تقلل المادة العضوية في مكان جاف. الحرارة تؤثر في التحلل، لكن الجفاف الشديد ممكن يبطئ نشاط الميكروبات؛ الشمس القوية وحدها ما تثبتش تحلل سريع. مقارنة الأصل بين بعض أراضي الصحراء تحت واحد في المية وأرض أكثر رطوبة حوالي أربعة إلى خمسة في المية مثال، مش حد ثابت لكل موقع.\n\nالمادة العضوية ممكن تساعد على تكوين تجمعات التربة ودخول الميه وتخزينها والاحتفاظ بالعناصر. في لوم رملي قليل المادة العضوية، ممكن يقل مخزون الميه في منطقة الجذور وتزيد قابلية غسل العناصر، لكن الميه مش دايمًا بتتصرف فورًا، ولا كل سماد لازم يتغسل. القوام والبناء والعمق والري والتحليل الفعلي هما اللي يحددوا حجم المشكلة. ضعف بناء السطح ممكن يزود التعرّض للتعرية أو الدمك مع طرق إدارة معينة.')], 'en': [('For the stated plot, the measured low organic matter, possible salt-related root-zone stress, and incompletely analysed borewell water are three concerns. The sandy-loam texture influences storage, but a sand-only picture does not exactly represent sandy loam. Sketch two columns to compare how better organic inputs and aggregation might change water movement; do not show compost sealing pores or stopping drainage altogether.\n\nLow organic matter may reduce water storage in this plot, while root-zone salinity may make water harder for plants to take up. If salinity actually suppresses growth, less plant biomass and residue may return to the soil, which can help keep organic inputs low; this is a possible feedback, not a proven history for this plot. Sandy-loam drainage does not make salt leaching impossible: it can occur when suitable water moves through the root zone and an adequate drainage outlet removes the salts. This step identifies and interprets the site. Later steps test amendments, water management and crop choices for a full one-page rehabilitation proposal. Until EC method and water chemistry are known, a precise salt classification, amendment dose, leaching schedule or two-crop prescription is premature.', 'For the stated plot, the measured low organic matter, possible salt-related root-zone stress, and incompletely analysed borewell water are three concerns. The sandy-loam texture influences storage, but a sand-only picture does not exactly represent sandy loam. Sketch two columns to compare how better organic inputs and aggregation might change water movement; do not show compost sealing pores or stopping drainage altogether.\n\nLow organic matter may reduce water storage in this plot, while root-zone salinity may make water harder for plants to take up. If salinity actually suppresses growth, less plant biomass and residue may return to the soil, which can help keep organic inputs low; this is a possible feedback, not a proven history for this plot. Sandy-loam drainage does not make salt leaching impossible: it can occur when suitable water moves through the root zone and an adequate drainage outlet removes the salts. This step identifies and interprets the site. Later steps test amendments, water management and crop choices for a full one-page rehabilitation proposal. Until E C method and water chemistry are known, a precise salt classification, amendment dose, leaching schedule or two-crop prescription is premature.'), ("Imagine growing in a bucket of dry beach sand: water and nutrients might be hard to retain. That picture is a hook, not a description of all deserts. Dry regions can contain sandy, loamy or fine soils; some deserts are cold. Neither salinity nor a hard layer can be assumed without evidence.\n\nAridisols are a soil order associated with an aridic moisture regime and diagnostic soil features; they are not simply 'soil formed under extreme heat'. Limited plant-available moisture over long periods is central. To classify a real profile, a trained soil survey needs its horizons and moisture regime rather than the word desert. Ask which challenges a proposed dryland farm actually has before choosing a remedy.\n\nFive-minute hook: what would be the biggest soil challenge in a proposed desert farm? Share ideas on the board and test assumptions beyond heat or lack of water. Use case sheets, paper/board and markers. The full parent topic is 50 minutes: 5 introduction, 25 group plan, 15 instruction/presentations, 5 wrap/exit. Its 2–3-person group with a writer develops the one-page/two-crop plan in the following step; do not treat this interpretation step as the whole plan.", "Imagine growing in a bucket of dry beach sand: water and nutrients might be hard to retain. That picture is a hook, not a description of all deserts. Dry regions can contain sandy, loamy or fine soils; some deserts are cold. Neither salinity nor a hard layer can be assumed without evidence.\n\nAridisols are a soil order associated with an aridic moisture regime and diagnostic soil features; they are not simply 'soil formed under extreme heat'. Limited plant-available moisture over long periods is central. To classify a real profile, a trained soil survey needs its horizons and moisture regime rather than the word desert. Ask which challenges a proposed dryland farm actually has before choosing a remedy.\n\nFive-minute hook: what would be the biggest soil challenge in a proposed desert farm? Share ideas on the board and test assumptions beyond heat or lack of water. Use case sheets, paper, board and markers. The full parent topic is fifty minutes: five introduction, twenty-five group plan, fifteen instruction, presentations, five wrap, exit. Its two to three-person group with a writer develops the one-page, two-crop plan in the following step; do not treat this interpretation step as the whole plan."), ('Physical drought means the root zone lacks usable water. In saline soil, water can be present but dissolved salts lower its water potential, so roots have more difficulty taking it up: this is often called physiological drought or osmotic stress. It is not the same as an empty soil reservoir.\n\nExcess sodium can interfere with uptake of potassium or calcium, and some ions such as chloride can directly injure sensitive crops at sufficient concentration. Osmotic difficulty, nutrient imbalance and ion toxicity may coexist but should be explained separately. The right response depends on soil/water chemistry, crop tolerance and drainage, not simply adding more water to every wilted plant.', 'Physical drought means the root zone lacks usable water. In saline soil, water can be present but dissolved salts lower its water potential, so roots have more difficulty taking it up: this is often called physiological drought or osmotic stress. It is not the same as an empty soil reservoir.\n\nExcess sodium can interfere with uptake of potassium or calcium, and some ions such as chloride can directly injure sensitive crops at sufficient concentration. Osmotic difficulty, nutrient imbalance and ion toxicity may coexist but should be explained separately. The right response depends on soil, water chemistry, crop tolerance and drainage, not simply adding more water to every wilted plant.'), ('Some dryland soils are alkaline; high pH can reduce availability of iron or zinc in some conditions and contribute to chlorosis. A measured pH and appropriate nutrient evidence are needed. Alkalinity is not present merely because the site is dry.\n\nCaliche is a calcium-carbonate accumulation that may become a cemented layer and restrict roots or water movement. A hard layer may instead be compaction, gypsum-cemented material or another horizon; inspect the profile and, if needed, test its composition. Do not call every obstruction caliche or assume it lies at one fixed depth.', 'Some dryland soils are alkaline; high P H can reduce availability of iron or zinc in some conditions and contribute to chlorosis. A measured P H and appropriate nutrient evidence are needed. Alkalinity is not present merely because the site is dry.\n\nCaliche is a calcium-carbonate accumulation that may become a cemented layer and restrict roots or water movement. A hard layer may instead be compaction, gypsum-cemented material or another horizon; inspect the profile and, if needed, test its composition. Do not call every obstruction caliche or assume it lies at one fixed depth.'), ('Sparse vegetation and limited litter input can contribute to low soil organic matter in a dry setting. Temperature also influences decomposition, but severe dryness can slow microbial breakdown; intense sun alone does not prove rapid decomposition. The original teaching comparison of some native desert soils below 1% versus wetter soils around 4–5% is only illustrative, not a threshold for every site.\n\nOrganic matter can support aggregates, infiltration, water storage and nutrient retention. In a sandy loam with low organic matter, limited root-zone storage and nutrient leaching may be concerns, but water does not always drain immediately and every fertilizer does not automatically wash away. Texture, structure, depth, irrigation and actual tests decide the severity. Weak surface structure can make erosion or compaction more likely under specific management.', 'Sparse vegetation and limited litter input can contribute to low soil organic matter in a dry setting. Temperature also influences decomposition, but severe dryness can slow microbial breakdown; intense sun alone does not prove rapid decomposition. The original teaching comparison of some native desert soils below one percent versus wetter soils around four to five percent is only illustrative, not a threshold for every site.\n\nOrganic matter can support aggregates, infiltration, water storage and nutrient retention. In a sandy loam with low organic matter, limited root-zone storage and nutrient leaching may be concerns, but water does not always drain immediately and every fertilizer does not automatically wash away. Texture, structure, depth, irrigation and actual tests decide the severity. Weak surface structure can make erosion or compaction more likely under specific management.'), ("The source explicitly calls this a SOIL analysis report: 10 m × 10 m (100 m²), sandy loam, OM 0.8%, and SOIL EC 3.5 dS/m. Borewell water is separately described as slightly saline, without a numerical ECw. Request soil-extraction method, temperature, sample depth/date and separate water ECw/ions. Do not convert the reported soil value into a borewell measurement; soil methods still cannot be interchanged.\n\nOnly if the 3.5 result is explicitly ECe at 25°C may it be compared with an ECe table. One FAO indicative table places ECe 2–4 dS/m in a band where sensitive crops may suffer some damage; it does not justify calling 3.5 a universal 'moderately saline' class, and another scheme may use different labels. The plot's 0.8% organic matter is a measured low value in this example, not proof that all dryland soil has that value. Obtain borewell ECw and relevant ion analysis, then relate the method-matched salinity to the intended crop and drainage.", "The source explicitly calls this a SOIL analysis report: ten metres multiplied by ten metres (one hundred square metres), sandy loam, organic matter zero point eight percent, and SOIL E C three point five decisiemens per metre. Borewell water is separately described as slightly saline, without a numerical E C w. Request soil-extraction method, temperature, sample depth, date and separate water E C w, ions. Do not convert the reported soil value into a borewell measurement; soil methods still cannot be interchanged.\n\nOnly if the three point five result is explicitly E C e at twenty-five degrees Celsius may it be compared with an E C e table. One FAO indicative table places E C e two to four decisiemens per metre in a band where sensitive crops may suffer some damage; it does not justify calling three point five a universal 'moderately saline' class, and another scheme may use different labels. The plot's zero point eight percent organic matter is a measured low value in this example, not proof that all dryland soil has that value. Obtain borewell E C w and relevant ion analysis, then relate the method-matched salinity to the intended crop and drainage.")], 'it': [('Alcuni suoli aridi sono alcalini; pH alto può ridurre la disponibilità di Fe o Zn in certe condizioni e contribuire a clorosi. Servono pH misurato e prove nutrienti appropriate. Aridità non significa automaticamente alcalinità.\n\nCaliche è accumulo di carbonato di calcio che può cementare uno strato e limitare radici o acqua. Uno strato duro può invece essere compattazione, gesso cementato o altro orizzonte; esamina profilo e, se occorre, composizione. Non chiamare caliche ogni ostacolo né fissarne la profondità senza prova.', 'Alcuni suoli aridi sono alcalini; pi acca alto può ridurre la disponibilità di ferro o zinco in certe condizioni e contribuire a clorosi. Servono pi acca misurato e prove nutrienti appropriate. Aridità non significa automaticamente alcalinità.\n\nCaliche è accumulo di carbonato di calcio che può cementare uno strato e limitare radici o acqua. Uno strato duro può invece essere compattazione, gesso cementato o altro orizzonte; esamina profilo e, se occorre, composizione. Non chiamare caliche ogni ostacolo né fissarne la profondità senza prova.'), ('I sali possono arrivare da minerali, falda poco profonda, ammendanti o acqua irrigua. Poca pioggia efficace può non lisciviare abbastanza; evaporazione elimina acqua e può concentrare sali in superficie o presso le radici. Acqua salina aggiunge carico, ma l’aumento nel tempo dipende da quantità/qualità dell’acqua, uso della pianta, quota di lisciviazione, falda e scarico di drenaggio. Non ogni irrigazione aumenta inevitabilmente l’EC misurata.\n\nIn una sezione disegna pioggia o irrigazione verso il basso, eventuale risalita ed evaporazione, e sali disciolti in uscita con drenaggio gestito. Se l’acqua di lavaggio non ha scarico o aggiunge troppo sale, un lavaggio può fallire o creare problemi. Analizza l’acqua prima di prescriverlo.', 'I sali possono arrivare da minerali, falda poco profonda, ammendanti o acqua irrigua. Poca pioggia efficace può non lisciviare abbastanza; evaporazione elimina acqua e può concentrare sali in superficie o presso le radici. Acqua salina aggiunge carico, ma l’aumento nel tempo dipende da quantità, qualità dell’acqua, uso della pianta, quota di lisciviazione, falda e scarico di drenaggio. Non ogni irrigazione aumenta inevitabilmente l’e ci misurata.\n\nIn una sezione disegna pioggia o irrigazione verso il basso, eventuale risalita ed evaporazione, e sali disciolti in uscita con drenaggio gestito. Se l’acqua di lavaggio non ha scarico o aggiunge troppo sale, un lavaggio può fallire o creare problemi. Analizza l’acqua prima di prescriverlo.'), ('Immagina di coltivare in un secchio di sabbia di spiaggia secca: trattenere acqua e nutrienti può essere difficile. È uno spunto, non descrive tutti i deserti. Le regioni aride possono avere suoli sabbiosi, franchi o fini; alcuni deserti sono freddi. Salinità e strato duro richiedono prove, non supposizioni.\n\nAridisol è un ordine legato a regime idrico aridico e caratteri diagnostici del profilo, non solo a «caldo estremo». La limitata acqua disponibile per lunghi periodi è centrale. Per classificare un profilo reale occorrono un rilevatore esperto, orizzonti e regime idrico. Chiedi quali difficoltà esistono davvero prima di scegliere rimedi.\n\nAvvio di 5 minuti: quale sarebbe il problema principale del suolo in una fattoria nel deserto? Condividi le idee alla lavagna e verifica le ipotesi considerando anche fattori diversi dal caldo e dalla scarsità d’acqua. Servono schede dei casi, carta o lavagna e pennarelli. L’intero argomento dura 50 minuti: 5 di introduzione, 25 per il piano di gruppo, 15 di spiegazione e presentazioni, 5 di conclusione. Gruppi di 2–3 persone, con una persona che prende appunti, svilupperanno nel passo successivo un piano di una pagina con due colture; questa fase di interpretazione non costituisce l’intero piano.', 'Immagina di coltivare in un secchio di sabbia di spiaggia secca: trattenere acqua e nutrienti può essere difficile. È uno spunto, non descrive tutti i deserti. Le regioni aride possono avere suoli sabbiosi, franchi o fini; alcuni deserti sono freddi. Salinità e strato duro richiedono prove, non supposizioni.\n\nAridisol è un ordine legato a regime idrico aridico e caratteri diagnostici del profilo, non solo a «caldo estremo». La limitata acqua disponibile per lunghi periodi è centrale. Per classificare un profilo reale occorrono un rilevatore esperto, orizzonti e regime idrico. Chiedi quali difficoltà esistono davvero prima di scegliere rimedi.\n\nAvvio di cinque minuti: quale sarebbe il problema principale del suolo in una fattoria nel deserto? Condividi le idee alla lavagna e verifica le ipotesi considerando anche fattori diversi dal caldo e dalla scarsità d’acqua. Servono schede dei casi, carta o lavagna e pennarelli. L’intero argomento dura cinquanta minuti: cinque di introduzione, venticinque per il piano di gruppo, quindici di spiegazione e presentazioni, cinque di conclusione. Gruppi di due a tre persone, con una persona che prende appunti, svilupperanno nel passo successivo un piano di una pagina con due colture; questa fase di interpretazione non costituisce l’intero piano.'), ('La fonte indica esplicitamente un rapporto di analisi del SUOLO: parcella di 10 m × 10 m (100 m²), franco sabbioso, OM 0,8% ed EC del SUOLO di 3,5 dS/m. L’acqua del pozzo è descritta separatamente come leggermente salina, senza un valore numerico di ECw. Richiedi il metodo di estrazione, la temperatura, la profondità e la data del campione e, separatamente, l’ECw dell’acqua e l’analisi degli ioni. Non trasformare il valore del suolo in una misura dell’acqua del pozzo e non equiparare metodi di estrazione diversi.\n\nSolo se 3,5 è esplicitamente ECe a 25°C confrontalo con tabella ECe. Una tabella indicativa FAO pone 2–4 dS/m in fascia dove colture sensibili possono subire danni; non giustifica «moderatamente salino» universale e altri schemi usano altri nomi. Lo 0,8% è una misura del caso, non di tutti i suoli aridi. Procurati ECw del pozzo e ioni pertinenti e rapporta salinità, coltura e drenaggio sul medesimo metodo.', 'La fonte indica esplicitamente un rapporto di analisi del SUOLO: parcella di dieci metri moltiplicato per dieci metri (cento metri quadrati), franco sabbioso, sostanza organica zero virgola otto per cento ed e ci del SUOLO di tre virgola cinque decisiemens per metro. L’acqua del pozzo è descritta separatamente come leggermente salina, senza un valore numerico di e ci doppia vu. Richiedi il metodo di estrazione, la temperatura, la profondità e la data del campione e, separatamente, l’e ci doppia vu dell’acqua e l’analisi degli ioni. Non trasformare il valore del suolo in una misura dell’acqua del pozzo e non equiparare metodi di estrazione diversi.\n\nSolo se tre virgola cinque è esplicitamente e ci e a venticinque gradi Celsius confrontalo con tabella e ci e. Una tabella indicativa FAO pone due a quattro decisiemens per metro in fascia dove colture sensibili possono subire danni; non giustifica «moderatamente salino» universale e altri schemi usano altri nomi. Lo zero virgola otto per cento è una misura del caso, non di tutti i suoli aridi. Procurati e ci doppia vu del pozzo e ioni pertinenti e rapporta salinità, coltura e drenaggio sul medesimo metodo.'), ('Nel lotto la bassa sostanza organica misurata, un possibile stress da sali e l’acqua di pozzo non analizzata completamente sono tre questioni. Il franco sabbioso influisce sulla riserva, ma un disegno di sabbia pura non lo rappresenta esattamente. Schizza due colonne per mostrare come apporti organici e aggregati potrebbero cambiare il movimento dell’acqua; non disegnare compost che tappa ogni poro o blocca tutto il drenaggio.\n\nPoca sostanza organica può ridurre la riserva qui mentre la salinità della zona radicale può ostacolare l’assorbimento. Se salinità confermata riduce crescita, meno biomassa può restituire meno residui: possibile retroazione, non storia dimostrata del lotto. Nel franco sabbioso lisciviare non è impossibile se acqua adatta attraversa la zona radicale e un drenaggio smaltisce i sali. Questo passo interpreta dati; passi successivi valutano ammendanti, acqua e colture per un piano di una pagina. Senza metodo EC e chimica dell’acqua, classe precisa, dose, lavaggio o due colture prescritte sarebbero prematuri.', 'Nel lotto la bassa sostanza organica misurata, un possibile stress da sali e l’acqua di pozzo non analizzata completamente sono tre questioni. Il franco sabbioso influisce sulla riserva, ma un disegno di sabbia pura non lo rappresenta esattamente. Schizza due colonne per mostrare come apporti organici e aggregati potrebbero cambiare il movimento dell’acqua; non disegnare compost che tappa ogni poro o blocca tutto il drenaggio.\n\nPoca sostanza organica può ridurre la riserva qui mentre la salinità della zona radicale può ostacolare l’assorbimento. Se salinità confermata riduce crescita, meno biomassa può restituire meno residui: possibile retroazione, non storia dimostrata del lotto. Nel franco sabbioso lisciviare non è impossibile se acqua adatta attraversa la zona radicale e un drenaggio smaltisce i sali. Questo passo interpreta dati; passi successivi valutano ammendanti, acqua e colture per un piano di una pagina. Senza metodo e ci e chimica dell’acqua, classe precisa, dose, lavaggio o due colture prescritte sarebbero prematuri.'), ('Scarsa vegetazione e poco residuo possono ridurre la sostanza organica in un luogo arido. La temperatura influisce sulla decomposizione, ma forte siccità può rallentare i microbi; sole intenso da solo non prova degradazione rapida. Il confronto didattico della fonte, alcuni deserti sotto 1% contro terreni umidi intorno a 4–5%, è illustrativo, non soglia universale.\n\nLa sostanza organica può favorire aggregati, infiltrazione, riserva idrica e trattenimento nutritivo. In franco sabbioso povero di organico si possono temere minore riserva radicale e lisciviazione, ma l’acqua non sparisce sempre subito e ogni concime non viene necessariamente perso. Tessitura, struttura, profondità, irrigazione e test determinano la gravità. Struttura superficiale debole può aumentare erosione o compattazione in certe gestioni.', 'Scarsa vegetazione e poco residuo possono ridurre la sostanza organica in un luogo arido. La temperatura influisce sulla decomposizione, ma forte siccità può rallentare i microbi; sole intenso da solo non prova degradazione rapida. Il confronto didattico della fonte, alcuni deserti sotto uno per cento contro terreni umidi intorno a quattro a cinque per cento, è illustrativo, non soglia universale.\n\nLa sostanza organica può favorire aggregati, infiltrazione, riserva idrica e trattenimento nutritivo. In franco sabbioso povero di organico si possono temere minore riserva radicale e lisciviazione, ma l’acqua non sparisce sempre subito e ogni concime non viene necessariamente perso. Tessitura, struttura, profondità, irrigazione e test determinano la gravità. Struttura superficiale debole può aumentare erosione o compattazione in certe gestioni.'), ('Siccità fisica significa poca acqua utilizzabile nella zona radicale. In suolo salino può essercene, ma i sali disciolti abbassano il potenziale idrico e rendono più difficile assorbirla: siccità fisiologica o stress osmotico. Non è un serbatoio di suolo vuoto.\n\nTroppo sodio può ostacolare assorbimento di K o Ca; ioni come cloruro possono danneggiare colture sensibili se abbastanza concentrati. Difficoltà osmotica, squilibrio nutritivo e tossicità possono convivere ma vanno spiegati separatamente. La risposta dipende da chimica di suolo/acqua, tolleranza della coltura e drenaggio, non da più acqua a ogni pianta sofferente.', 'Siccità fisica significa poca acqua utilizzabile nella zona radicale. In suolo salino può essercene, ma i sali disciolti abbassano il potenziale idrico e rendono più difficile assorbirla: siccità fisiologica o stress osmotico. Non è un serbatoio di suolo vuoto.\n\nTroppo sodio può ostacolare assorbimento di cappa o calcio; ioni come cloruro possono danneggiare colture sensibili se abbastanza concentrati. Difficoltà osmotica, squilibrio nutritivo e tossicità possono convivere ma vanno spiegati separatamente. La risposta dipende da chimica di suolo, acqua, tolleranza della coltura e drenaggio, non da più acqua a ogni pianta sofferente.')], 'de': [('Bei echter Trockenheit fehlt dem Wurzelraum nutzbares Wasser. Bei salzigem Boden kann Wasser vorhanden sein, doch gelöste Salze senken sein Potenzial und erschweren die Aufnahme: physiologische Trockenheit oder osmotischer Stress. Das ist kein leerer Bodenspeicher.\n\nZu viel Natrium kann die Aufnahme von K oder Ca stören; Chlorid und andere Ionen können empfindliche Kulturen bei genügender Konzentration direkt schädigen. Osmotische Hemmung, Nährstoffungleichgewicht und Ionenschaden können zugleich auftreten, sollen aber getrennt erklärt werden. Die Antwort hängt von Boden-/Wasserchemie, Kulturverträglichkeit und Abfluss ab, nicht schlicht von mehr Wasser für jede welke Pflanze.', 'Bei echter Trockenheit fehlt dem Wurzelraum nutzbares Wasser. Bei salzigem Boden kann Wasser vorhanden sein, doch gelöste Salze senken sein Potenzial und erschweren die Aufnahme: physiologische Trockenheit oder osmotischer Stress. Das ist kein leerer Bodenspeicher.\n\nZu viel Natrium kann die Aufnahme von Ka oder Kalzium stören; Chlorid und andere Ionen können empfindliche Kulturen bei genügender Konzentration direkt schädigen. Osmotische Hemmung, Nährstoffungleichgewicht und Ionenschaden können zugleich auftreten, sollen aber getrennt erklärt werden. Die Antwort hängt von Boden-, Wasserchemie, Kulturverträglichkeit und Abfluss ab, nicht schlicht von mehr Wasser für jede welke Pflanze.'), ('Die Quelle bezeichnet dies ausdrücklich als Bodenanalysebericht: 10 m × 10 m (100 m²), sandiger Lehm, OM 0,8% und BODEN-EC 3,5 dS/m. Brunnenwasser wird getrennt als leicht salzig beschrieben, ohne numerischen ECw-Wert. Extraktionsmethode, Temperatur, Probentiefe und Datum sowie getrennt den ECw des Wassers und die Ionenanalyse anfordern. Den Bodenwert nicht als Brunnenwassermessung umdeuten; verschiedene Bodenmethoden sind nicht austauschbar.\n\nNur wenn 3,5 ausdrücklich ECe bei 25 °C ist, darf es mit ECe-Tabelle verglichen werden. Eine FAO-Orientierung legt 2–4 dS/m in einen Bereich möglicher Schäden empfindlicher Kulturen; das rechtfertigt kein allgemeines „mäßig salzig“ für 3,5, und andere Schemata nutzen andere Namen. OM 0,8 % ist ein Fallmesswert, keine Aussage zu jedem Trockengebiet. Hole Brunnen-ECw und Ionenanalyse, dann beziehe methodengleiche Salinität auf Kultur und Entwässerung.', 'Die Quelle bezeichnet dies ausdrücklich als Bodenanalysebericht: zehn Meter mal zehn Meter (einhundert Quadratmeter), sandiger Lehm, organische Substanz null Komma acht Prozent und BODEN-E Ce drei Komma fünf Dezisiemens pro Meter. Brunnenwasser wird getrennt als leicht salzig beschrieben, ohne numerischen E Ce We-Wert. Extraktionsmethode, Temperatur, Probentiefe und Datum sowie getrennt den E Ce We des Wassers und die Ionenanalyse anfordern. Den Bodenwert nicht als Brunnenwassermessung umdeuten; verschiedene Bodenmethoden sind nicht austauschbar.\n\nNur wenn drei Komma fünf ausdrücklich E Ce E bei fünfundzwanzig Grad Celsius ist, darf es mit E Ce E-Tabelle verglichen werden. Eine FAO-Orientierung legt zwei bis vier Dezisiemens pro Meter in einen Bereich möglicher Schäden empfindlicher Kulturen; das rechtfertigt kein allgemeines „mäßig salzig“ für drei Komma fünf, und andere Schemata nutzen andere Namen. organische Substanz null Komma acht Prozent ist ein Fallmesswert, keine Aussage zu jedem Trockengebiet. Hole Brunnen-E Ce We und Ionenanalyse, dann beziehe methodengleiche Salinität auf Kultur und Entwässerung.'), ('Für die Fläche sind gemessen wenig Humus, möglicher Salzstress an Wurzeln und unzureichend analysiertes Brunnenwasser drei Bedenken. Sandiger Lehm beeinflusst Speicherung, aber ein Bild reinen Sands stellt ihn nicht exakt dar. Skizziere zwei Säulen, wie organische Einträge und Aggregate Wasserbewegung ändern könnten; zeige nicht, dass Kompost alle Poren abdichtet oder jede Entwässerung stoppt.\n\nWenig Humus kann hier Speicherung mindern, und Salz im Wurzelraum kann Aufnahme erschweren. Falls Salinität Wachstum tatsächlich hemmt, können weniger Biomasse und Rückstände den organischen Eintrag weiter senken: eine mögliche Rückkopplung, keine belegte Vergangenheit dieser Fläche. Sandiger Lehm verhindert Salzauswaschung nicht, wenn geeignetes Wasser die Wurzelzone durchströmt und ein Auslass Salz entfernt. Hier werden Probleme interpretiert; folgende Schritte prüfen Hilfsstoffe, Wasser und Kulturen für den vollständigen Ein-Seiten-Plan. Ohne EC-Methode und Wasserchemie sind Klasse, Dosis, Spülplan oder zwei festgelegte Kulturen verfrüht.', 'Für die Fläche sind gemessen wenig Humus, möglicher Salzstress an Wurzeln und unzureichend analysiertes Brunnenwasser drei Bedenken. Sandiger Lehm beeinflusst Speicherung, aber ein Bild reinen Sands stellt ihn nicht exakt dar. Skizziere zwei Säulen, wie organische Einträge und Aggregate Wasserbewegung ändern könnten; zeige nicht, dass Kompost alle Poren abdichtet oder jede Entwässerung stoppt.\n\nWenig Humus kann hier Speicherung mindern, und Salz im Wurzelraum kann Aufnahme erschweren. Falls Salinität Wachstum tatsächlich hemmt, können weniger Biomasse und Rückstände den organischen Eintrag weiter senken: eine mögliche Rückkopplung, keine belegte Vergangenheit dieser Fläche. Sandiger Lehm verhindert Salzauswaschung nicht, wenn geeignetes Wasser die Wurzelzone durchströmt und ein Auslass Salz entfernt. Hier werden Probleme interpretiert; folgende Schritte prüfen Hilfsstoffe, Wasser und Kulturen für den vollständigen Ein-Seiten-Plan. Ohne E Ce-Methode und Wasserchemie sind Klasse, Dosis, Spülplan oder zwei festgelegte Kulturen verfrüht.'), ('Manche Trockenböden sind alkalisch; hoher pH kann unter bestimmten Umständen Fe oder Zn weniger verfügbar machen und Chlorose fördern. Ein gemessener pH und geeignete Nährstoffbelege sind nötig. Trockenheit allein beweist keine Alkalität.\n\nKaliche ist eine Anreicherung von Calciumcarbonat, die eine verfestigte Schicht und Hindernis für Wurzeln oder Wasser bilden kann. Härte kann aber auch Verdichtung, gipszementiertes Material oder ein anderer Horizont sein. Prüfe Profil und Zusammensetzung; benenne nicht jedes Hindernis Kaliche und unterstelle keine feste Tiefe.', 'Manche Trockenböden sind alkalisch; hoher Pe Ha kann unter bestimmten Umständen Eisen oder Zink weniger verfügbar machen und Chlorose fördern. Ein gemessener Pe Ha und geeignete Nährstoffbelege sind nötig. Trockenheit allein beweist keine Alkalität.\n\nKaliche ist eine Anreicherung von Calciumcarbonat, die eine verfestigte Schicht und Hindernis für Wurzeln oder Wasser bilden kann. Härte kann aber auch Verdichtung, gipszementiertes Material oder ein anderer Horizont sein. Prüfe Profil und Zusammensetzung; benenne nicht jedes Hindernis Kaliche und unterstelle keine feste Tiefe.'), ('Salze stammen möglicherweise aus Mineralen, flachem Grundwasser, Bodenhilfsstoffen oder Bewässerungswasser. Wenig wirksamer Regen kann natürliche Salze unzureichend auswaschen; Verdunstung entfernt Wasser und kann Salze an Oberfläche oder Wurzeln konzentrieren. Salziges Gießwasser bringt Salze hinein; ob der Boden über Zeit salziger wird, hängt von Wassermenge/-qualität, Pflanzenverbrauch, Auswaschungsanteil, Grundwasser und Entwässerungsauslass ab. Nicht jede Gabe steigert messbar Salz.\n\nZeichne in einem Schnitt Regen oder Bewässerung nach unten, mögliche Aufwärtsbewegung und Verdunstung sowie gelöste Salze, die mit geregeltem Abfluss austreten. Fehlt dem Auswaschwasser ein Ausgang oder bringt es selbst viel Salz, kann Spülung scheitern oder schaden. Wasser vor einer Maßnahme prüfen.', 'Salze stammen möglicherweise aus Mineralen, flachem Grundwasser, Bodenhilfsstoffen oder Bewässerungswasser. Wenig wirksamer Regen kann natürliche Salze unzureichend auswaschen; Verdunstung entfernt Wasser und kann Salze an Oberfläche oder Wurzeln konzentrieren. Salziges Gießwasser bringt Salze hinein; ob der Boden über Zeit salziger wird, hängt von Wassermenge, -qualität, Pflanzenverbrauch, Auswaschungsanteil, Grundwasser und Entwässerungsauslass ab. Nicht jede Gabe steigert messbar Salz.\n\nZeichne in einem Schnitt Regen oder Bewässerung nach unten, mögliche Aufwärtsbewegung und Verdunstung sowie gelöste Salze, die mit geregeltem Abfluss austreten. Fehlt dem Auswaschwasser ein Ausgang oder bringt es selbst viel Salz, kann Spülung scheitern oder schaden. Wasser vor einer Maßnahme prüfen.'), ('Stelle dir Pflanzen in einem Eimer trockenen Strandsands vor: Wasser und Nährstoffe zu halten kann schwer sein. Dieses Bild ist ein Einstieg, keine Beschreibung aller Wüsten. Trockengebiete können sandige, lehmige oder feine Böden haben; manche Wüsten sind kalt. Salz oder harte Schicht nur mit Belegen annehmen.\n\nAridisole sind eine Bodenordnung mit aridischem Feuchteregime und diagnostischen Profilmerkmalen, nicht bloß „unter extremer Hitze entstanden“. Länger begrenztes pflanzenverfügbares Wasser ist zentral. Zur wirklichen Klassifikation müssen Fachleute Horizonte und Feuchteregime prüfen; das Wort Wüste genügt nicht. Frage zuerst nach tatsächlichen Problemen der geplanten Fläche.\n\nFünf Minuten Einstieg: Welches Bodenproblem erwartest du bei einem landwirtschaftlichen Betrieb in der Wüste? Sammelt Ideen und prüft auch andere Annahmen als Hitze oder Wassermangel. Verwendet Fallblätter, Tafel oder Papier und Stifte. Das gesamte Thema dauert 50 Minuten: 5 Minuten Einstieg, 25 Minuten Gruppenplan, 15 Minuten Erklärung und Präsentationen, 5 Minuten Abschluss. Gruppen von 2–3 Personen, von denen eine die Notizen übernimmt, entwickeln im nächsten Schritt einen einseitigen Plan mit zwei Kulturen; diese Interpretation ist nicht der ganze Plan.', 'Stelle dir Pflanzen in einem Eimer trockenen Strandsands vor: Wasser und Nährstoffe zu halten kann schwer sein. Dieses Bild ist ein Einstieg, keine Beschreibung aller Wüsten. Trockengebiete können sandige, lehmige oder feine Böden haben; manche Wüsten sind kalt. Salz oder harte Schicht nur mit Belegen annehmen.\n\nAridisole sind eine Bodenordnung mit aridischem Feuchteregime und diagnostischen Profilmerkmalen, nicht bloß „unter extremer Hitze entstanden“. Länger begrenztes pflanzenverfügbares Wasser ist zentral. Zur wirklichen Klassifikation müssen Fachleute Horizonte und Feuchteregime prüfen; das Wort Wüste genügt nicht. Frage zuerst nach tatsächlichen Problemen der geplanten Fläche.\n\nFünf Minuten Einstieg: Welches Bodenproblem erwartest du bei einem landwirtschaftlichen Betrieb in der Wüste? Sammelt Ideen und prüft auch andere Annahmen als Hitze oder Wassermangel. Verwendet Fallblätter, Tafel oder Papier und Stifte. Das gesamte Thema dauert fünfzig Minuten: fünf Minuten Einstieg, fünfundzwanzig Minuten Gruppenplan, fünfzehn Minuten Erklärung und Präsentationen, fünf Minuten Abschluss. Gruppen von zwei bis drei Personen, von denen eine die Notizen übernimmt, entwickeln im nächsten Schritt einen einseitigen Plan mit zwei Kulturen; diese Interpretation ist nicht der ganze Plan.'), ('Wenig Vegetation und Streueintrag können den Humus im Trockengebiet vermindern. Temperatur beeinflusst den Abbau, aber starke Trockenheit kann Mikroben bremsen; intensive Sonne beweist keine rasche Zersetzung. Der Quellvergleich mancher Wüstenböden unter 1 % mit feuchteren um 4–5 % illustriert nur, er ist keine Grenze für jeden Standort.\n\nOrganische Substanz kann Aggregate, Infiltration, Wasserspeicherung und Nährstoffbindung fördern. Bei sandigem Lehm mit wenig organischer Substanz können eine geringe Wasserspeicherung im Wurzelraum und Nährstoffauswaschung problematisch sein; Wasser fließt aber nicht immer sofort ab, und nicht jeder Dünger wird zwangsläufig ausgewaschen. Textur, Struktur, Tiefe, Bewässerung und Tests bestimmen das Ausmaß. Eine schwache Oberflächenstruktur kann je nach Bewirtschaftung Erosion oder Verdichtung begünstigen.', 'Wenig Vegetation und Streueintrag können den Humus im Trockengebiet vermindern. Temperatur beeinflusst den Abbau, aber starke Trockenheit kann Mikroben bremsen; intensive Sonne beweist keine rasche Zersetzung. Der Quellvergleich mancher Wüstenböden unter eins Prozent mit feuchteren um vier bis fünf Prozent illustriert nur, er ist keine Grenze für jeden Standort.\n\nOrganische Substanz kann Aggregate, Infiltration, Wasserspeicherung und Nährstoffbindung fördern. Bei sandigem Lehm mit wenig organischer Substanz können eine geringe Wasserspeicherung im Wurzelraum und Nährstoffauswaschung problematisch sein; Wasser fließt aber nicht immer sofort ab, und nicht jeder Dünger wird zwangsläufig ausgewaschen. Textur, Struktur, Tiefe, Bewässerung und Tests bestimmen das Ausmaß. Eine schwache Oberflächenstruktur kann je nach Bewirtschaftung Erosion oder Verdichtung begünstigen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s308-readings-audio-20261023-r1'
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
