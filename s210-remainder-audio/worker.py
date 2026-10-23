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
IDS = ('S2-10-ar-EG-opening-r1', 'S2-10-ar-EG-E01-r1', 'S2-10-ar-EG-E02-r1', 'S2-10-ar-EG-E03-r1', 'S2-10-ar-EG-E04-r1', 'S2-10-ar-EG-guided-practice-r1', 'S2-10-ar-EG-reflection-r1', 'S2-10-ar-EG-glossary-r1', 'S2-10-en-opening-r1', 'S2-10-en-E01-r1', 'S2-10-en-E02-r1', 'S2-10-en-E03-r1', 'S2-10-en-E04-r1', 'S2-10-en-guided-practice-r1', 'S2-10-en-reflection-r1', 'S2-10-en-glossary-r1', 'S2-10-it-opening-r1', 'S2-10-it-E01-r1', 'S2-10-it-E02-r1', 'S2-10-it-E03-r1', 'S2-10-it-E04-r1', 'S2-10-it-guided-practice-r1', 'S2-10-it-reflection-r1', 'S2-10-it-glossary-r1', 'S2-10-de-opening-r1', 'S2-10-de-E01-r1', 'S2-10-de-E02-r1', 'S2-10-de-E03-r1', 'S2-10-de-E04-r1', 'S2-10-de-guided-practice-r1', 'S2-10-de-reflection-r1', 'S2-10-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S210_REMAINDER_32_FULL_SOURCE_LOI_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-10')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s210-remainder-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==32
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(8))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening', 'E01', 'E02', 'E03', 'E04', 'guided-practice', 'reflection', 'glossary']
        voice='Charon'if group in['E01', 'E03', 'reflection', 'glossary']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or '/cases/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('أقدر أشرح تجهيز عينة الاختبار المحدد، وإزاي المدرّب حصل على أوزان LOI وفسرها، من غير ادعاء إني شغلت الفرن؟\n\nمراجعة ذاتية فقط', 'أقدر أشرح تجهيز عينة الاختبار المحدد، وإزاي المدرّب حصل على أوزان إل أو آي وفسرها، من غير ادعاء إني شغلت الفرن؟\n\nمراجعة ذاتية فقط'), ('المادة العضوية تساعد وظائف مهمة في التربة. في اختبار الفقد بالحرق LOI، المدرّب المؤهل يعرض وزن العينة الجافة وتسخينها بطريقة معملية، ثم تبريدها وإعادة وزنها. إنت هتشرح وتحسب الفقد المسجل، وتحدد النتيجة تثبت إيه وما تثبتش إيه.\n\nتشرح ترتيب وغرض وزن البوتقة الفارغة والعينة المجففة في الفرن والحرق بضبط الطريقة والتبريد والوزن الأخير، من غير تشغيل فرن الحرق.\n\nتحسب نسبة LOI في مثال تدريبي من كتل معلنة، باستخدام كتلة التربة المجففة في الفرن قبل الحرق، مش التربة مع البوتقة، في المقام، وتذكر الوحدة والطريقة.\n\nتشرح ليه LOI تقدير فقد كتلة يتغير بالطريقة، مش قيمة دقيقة عامة للمادة العضوية، وليه مدى 3–6% في مثال الفصل ما ينفعش نعممه على كل أرض.', 'المادة العضوية تساعد وظائف مهمة في التربة. في اختبار الفقد بالحرق إل أو آي، المدرّب المؤهل يعرض وزن العينة الجافة وتسخينها بطريقة معملية، ثم تبريدها وإعادة وزنها. إنت هتشرح وتحسب الفقد المسجل، وتحدد النتيجة تثبت إيه وما تثبتش إيه.\n\nتشرح ترتيب وغرض وزن البوتقة الفارغة والعينة المجففة في الفرن والحرق بضبط الطريقة والتبريد والوزن الأخير، من غير تشغيل فرن الحرق.\n\nتحسب نسبة إل أو آي في مثال تدريبي من كتل معلنة، باستخدام كتلة التربة المجففة في الفرن قبل الحرق، مش التربة مع البوتقة، في المقام، وتذكر الوحدة والطريقة.\n\nتشرح ليه إل أو آي تقدير فقد كتلة يتغير بالطريقة، مش قيمة دقيقة عامة للمادة العضوية، وليه مدى تلاتة إلى ستة في المية في مثال الفصل ما ينفعش نعممه على كل أرض.'), ('المادة العضوية في التربة\n\nمواد عضوية ونواتج تحللها داخل التربة، لها صلة بالبناء والماء ودورة العناصر.\n\nالفقد بالحرق LOI\n\nالنسبة المئوية لفقد كتلة عينة مجففة في الفرن بعد تسخينها بطريقة معملية محددة.\n\nبوتقة\n\nوعاء معمل مقاوم للحرارة؛ كتلته لا تدخل في كتلة التربة الجافة المستخدمة بالحساب.\n\nأساس التربة المجففة في الفرن\n\nكتلة العينة بعد التجفيف المحدد وقبل الحرق، وهي مقام النسبة في المثال.\n\nتداخل في القياس\n\nسبب لتغير الكتلة غير فقد المادة العضوية تحت طريقة محددة.', 'المادة العضوية في التربة\n\nمواد عضوية ونواتج تحللها داخل التربة، لها صلة بالبناء والماء ودورة العناصر.\n\nالفقد بالحرق إل أو آي\n\nالنسبة المئوية لفقد كتلة عينة مجففة في الفرن بعد تسخينها بطريقة معملية محددة.\n\nبوتقة\n\nوعاء معمل مقاوم للحرارة؛ كتلته لا تدخل في كتلة التربة الجافة المستخدمة بالحساب.\n\nأساس التربة المجففة في الفرن\n\nكتلة العينة بعد التجفيف المحدد وقبل الحرق، وهي مقام النسبة في المثال.\n\nتداخل في القياس\n\nسبب لتغير الكتلة غير فقد المادة العضوية تحت طريقة محددة.'), ('المدرّب قال فيه فقد كتلة 5% بطريقة معلنة. حد كتب «المادة العضوية بالضبط 5%» في خطة المحصول.\n\nالميزان رصد فرق كتلة، مش تركيب كل جزء مفقود.\n\nافحص هل طريقة القياس ومعادن التربة يسمحوا لفقد غير عضوي أو رطوبة متبقية يأثروا على الرقم.\n\nاكتب 5% LOI مع الطريقة واطلب تفسيرًا معايرًا قبل تسميته مادة عضوية دقيقة.\n\nالقياس وتفسيره البيولوجي ادعاءان مختلفان.', 'المدرّب قال فيه فقد كتلة خمسة في المية بطريقة معلنة. حد كتب «المادة العضوية بالضبط خمسة في المية» في خطة المحصول.\n\nالميزان رصد فرق كتلة، مش تركيب كل جزء مفقود.\n\nافحص هل طريقة القياس ومعادن التربة يسمحوا لفقد غير عضوي أو رطوبة متبقية يأثروا على الرقم.\n\nاكتب خمسة في المية إل أو آي مع الطريقة واطلب تفسير معاير قبل تسميته مادة عضوية دقيقة.\n\nالقياس وتفسيره البيولوجي ادعاءين مختلفين.'), ('تقرير بيقول مادة عضوية 2.5%، وطالب مصر إن جدول الفصل يصنفها ناقصة.\n\nجدول المثال يقول منخفض تحت 2% ومناسب 3–6%؛ 2.5% في الفراغ غير المصنف.\n\nاسأل عن طريقة المعمل والتفسير المناسب للمنطقة والتربة، مع العمق وقوام التربة والمناخ.\n\nما توصيّش بكمبوست وجرعة متخيلة من الرقم وحده.\n\nغير مصنف في الجدول ده ما يعنيش صحي أو غير صحي أو إن الاحتياج صفر.', 'تقرير بيقول مادة عضوية اتنين فاصلة خمسة في المية، وطالب مصر إن جدول الفصل يصنفها ناقصة.\n\nجدول المثال يقول منخفض تحت اتنين في المية ومناسب تلاتة إلى ستة في المية؛ اتنين فاصلة خمسة في المية في الفراغ غير المصنف.\n\nاسأل عن طريقة المعمل والتفسير المناسب للمنطقة والتربة، مع العمق وقوام التربة والمناخ.\n\nما توصيّش بكمبوست وجرعة متخيلة من الرقم وحده.\n\nغير مصنف في الجدول ده ما يعنيش صحي أو غير صحي أو إن الاحتياج صفر.'), ('رتب المراحل الخمس اللي عرضها المدرّب، ثم حط C وD وI على الأوزان المسجلة، واحسب التربة الجافة والفقد وLOI% من مثال مصطنع واضح: 30.00/35.00/34.75 g. بعدين حدد هل 2.5% مصنفة في الجدول، واذكر تداخلًا غير عضوي واحدًا وبيانًا ناقصًا عن الموقع أو الطريقة.\n\nعرض المعمل الحقيقي يحتاج إجراءه المعتمد ومدرّبًا مؤهلًا فقط؛ حساب الطالب من أرقام متخيلة لا يثبت كفاءة التشغيل.', 'رتب المراحل الخمس اللي عرضها المدرّب، ثم حط سي ودي وآي على الأوزان المسجلة، واحسب التربة الجافة والفقد وإل أو آي في المية من مثال مصطنع واضح: تلاتين فاصلة صفر صفر، خمسة وتلاتين فاصلة صفر صفر، أربعة وتلاتين فاصلة سبعة خمسة جرام. بعدين حدد هل اتنين فاصلة خمسة في المية مصنفة في الجدول، واذكر تداخل غير عضوي واحد وبيان ناقص عن الموقع أو الطريقة.\n\nعرض المعمل الحقيقي يحتاج إجراءه المعتمد ومدرّب مؤهل فقط؛ حساب الطالب من أرقام متخيلة لا يثبت كفاءة التشغيل.'), ('طالب عايز ياخد البوتقة مباشرة من فرن ساخن ويزنها قبل ما المدرّب يخلص مرحلة التبريد المعملية.\n\nتوقف؛ البوتقة الساخنة تسبب حرقًا وقد تدي وزنًا غير ثابت.\n\nالعامل المدرب وحده يتبع إجراءات الفرن والوقاية والتبريد والوزن المعتمدة في الموقع.\n\nالطالب يقدر يسجل التسلسل المعروض ويناقش أهمية التبريد من غير لمس الجهاز.\n\nفهم الطريقة مش تصريحًا لتشغيل الفرن.', 'طالب عايز ياخد البوتقة مباشرة من فرن ساخن ويزنها قبل ما المدرّب يخلص مرحلة التبريد المعملية.\n\nتوقف؛ البوتقة الساخنة تسبب حرق وممكن تدي وزن مش ثابت.\n\nالعامل المدرب وحده يتبع إجراءات الفرن والوقاية والتبريد والوزن المعتمدة في الموقع.\n\nالطالب يقدر يسجل التسلسل المعروض ويناقش أهمية التبريد من غير لمس الجهاز.\n\nفهم الطريقة مش تصريح لتشغيل الفرن.'), ('ورقة تدريب فيها C=30.00 g وD=35.00 g وI=34.75 g. طالب قسم 0.25 g على 35.00 g.\n\nاطرح C من D فتطلع كتلة التربة المجففة في الفرن قبل الحرق: 5.00 g.\n\nاطرح I من D فتطلع الكتلة المفقودة: 0.25 g.\n\nاقسم 0.25 على 5.00 ثم اضرب في 100: النتيجة 5.0% LOI. اذكر إن الأوزان متخيلة للتدريب.\n\nالبوتقة خارج مقام الحساب.', 'ورقة تدريب فيها سي بتساوي تلاتين فاصلة صفر صفر جرام ودي بتساوي خمسة وتلاتين فاصلة صفر صفر جرام وآي بتساوي أربعة وتلاتين فاصلة سبعة خمسة جرام. طالب قسم صفر فاصلة اتنين خمسة جرام على خمسة وتلاتين فاصلة صفر صفر جرام.\n\nاطرح سي من دي فتطلع كتلة التربة المجففة في الفرن قبل الحرق: خمسة فاصلة صفر صفر جرام.\n\nاطرح آي من دي فتطلع الكتلة المفقودة: صفر فاصلة اتنين خمسة جرام.\n\nاقسم صفر فاصلة اتنين خمسة على خمسة فاصلة صفر صفر ثم اضرب في مية: النتيجة خمسة فاصلة صفر في المية إل أو آي. اذكر إن الأوزان متخيلة للتدريب.\n\nالبوتقة خارج مقام الحساب.')], 'en': [('A practice record gives C=30.00 g, D=35.00 g and I=34.75 g. A learner divides 0.25 g by 35.00 g.\n\nSubtract C from D to find the initial oven-dry soil mass: 5.00 g.\n\nSubtract I from D to find the loss: 0.25 g.\n\nDivide 0.25 by 5.00, then multiply by 100: 5.0% LOI. State that the masses were invented for practice.\n\nThe vessel is excluded from the denominator.', 'A practice record gives C equals thirty point zero zero grams, D equals thirty-five point zero zero grams and I equals thirty-four point seven five grams. A learner divides zero point two five grams by thirty-five point zero zero grams.\n\nSubtract C from D to find the initial oven-dry soil mass: five point zero zero grams.\n\nSubtract I from D to find the loss: zero point two five grams.\n\nDivide zero point two five by five point zero zero, then multiply by one hundred: five point zero percent L O I. State that the masses were invented for practice.\n\nThe vessel is excluded from the denominator.'), ('A report shows 2.5% organic matter and a learner insists the classroom table classifies it as deficient.\n\nThe example table says Low below 2% and Optimum 3–6%; 2.5% lies in its unclassified gap.\n\nAsk for the laboratory method and regional/soil-specific interpretation, including depth, texture and climate.\n\nDo not prescribe compost at a guessed rate from this number alone.\n\nUnclassified by this table does not mean healthy, unhealthy or zero need.', 'A report shows two point five percent organic matter and a learner insists the classroom table classifies it as deficient.\n\nThe example table says Low below two percent and Optimum three to six percent; two point five percent lies in its unclassified gap.\n\nAsk for the laboratory method and regional, soil-specific interpretation, including depth, texture and climate.\n\nDo not prescribe compost at a guessed rate from this number alone.\n\nUnclassified by this table does not mean healthy, unhealthy or zero need.'), ("A trainer reports 5% mass loss under a named method. Someone writes 'exactly 5% organic matter' on the crop plan.\n\nThe instrument observed a mass difference, not the composition of each lost component.\n\nCheck whether the method and soil composition allow nonorganic mass loss or residual moisture to affect the figure.\n\nReport 5% LOI with its method and seek a calibrated interpretation before calling it exact organic matter.\n\nThe measurement and its biological interpretation are different claims.", "A trainer reports five percent mass loss under a named method. Someone writes 'exactly five percent organic matter' on the crop plan.\n\nThe instrument observed a mass difference, not the composition of each lost component.\n\nCheck whether the method and soil composition allow nonorganic mass loss or residual moisture to affect the figure.\n\nReport five percent L O I with its method and seek a calibrated interpretation before calling it exact organic matter.\n\nThe measurement and its biological interpretation are different claims."), ('Can I explain how a sample was prepared for the stated test and how the trainer obtained and interpreted the LOI masses without claiming I operated the furnace?\n\nSelf-check only', 'Can I explain how a sample was prepared for the stated test and how the trainer obtained and interpreted the L O I masses without claiming I operated the furnace?\n\nSelf-check only'), ("Order five trainer-demonstrated stages; drag C, D and I to their recorded masses; compute dry soil, mass loss and LOI% for the explicitly invented 30.00/35.00/34.75 g example. Then choose whether a 2.5% row is classified and identify one nonorganic interference and one missing site/method fact.\n\nUse the actual approved laboratory method only for a qualified trainer's demonstration; the learner's arithmetic is done on fictional data and does not certify operation.", "Order five trainer-demonstrated stages; drag C, D and I to their recorded masses; compute dry soil, mass loss and L O I percent for the explicitly invented thirty point zero zero, thirty-five point zero zero, thirty-four point seven five grams example. Then choose whether a two point five percent row is classified and identify one nonorganic interference and one missing site, method fact.\n\nUse the actual approved laboratory method only for a qualified trainer's demonstration; the learner's arithmetic is done on fictional data and does not certify operation."), ('Organic matter supports several soil functions. In loss on ignition (LOI), a qualified trainer shows how a dry sample is weighed, heated under a laboratory method, cooled and reweighed. You will explain and calculate the recorded mass loss, then decide what the result does and does not prove.\n\nExplain the order and purpose of the empty-crucible mass, oven-dry sample mass, method-controlled ignition, controlled cooling and final mass without operating the furnace.\n\nCalculate a training LOI percentage from stated masses, using the initial oven-dry soil mass—not soil plus crucible—as the denominator, and report the unit and method.\n\nExplain why LOI is a method-dependent mass-loss estimate, not a universal exact organic-matter value, and why the classroom 3–6% range cannot be imposed on every soil.', 'Organic matter supports several soil functions. In loss on ignition (L O I), a qualified trainer shows how a dry sample is weighed, heated under a laboratory method, cooled and reweighed. You will explain and calculate the recorded mass loss, then decide what the result does and does not prove.\n\nExplain the order and purpose of the empty-crucible mass, oven-dry sample mass, method-controlled ignition, controlled cooling and final mass without operating the furnace.\n\nCalculate a training L O I percentage from stated masses, using the initial oven-dry soil mass—not soil plus crucible—as the denominator, and report the unit and method.\n\nExplain why L O I is a method-dependent mass-loss estimate, not a universal exact organic-matter value, and why the classroom three to six percent range cannot be imposed on every soil.'), ('soil organic matter\n\nOrganic materials and their decomposed products in soil, relevant to structure, water and nutrient cycling.\n\nloss on ignition (LOI)\n\nPercent mass lost from an oven-dry sample after heating under a stated laboratory method.\n\ncrucible\n\nA heat-resistant laboratory vessel; its own mass is excluded from the dry-soil calculation.\n\noven-dry basis\n\nThe sample mass after the specified drying step, before ignition, used as the denominator in this example.\n\ninterference\n\nA process other than loss of organic matter that changes the recorded mass under a method.', 'soil organic matter\n\nOrganic materials and their decomposed products in soil, relevant to structure, water and nutrient cycling.\n\nloss on ignition (L O I)\n\nPercent mass lost from an oven-dry sample after heating under a stated laboratory method.\n\ncrucible\n\nA heat-resistant laboratory vessel; its own mass is excluded from the dry-soil calculation.\n\noven-dry basis\n\nThe sample mass after the specified drying step, before ignition, used as the denominator in this example.\n\ninterference\n\nA process other than loss of organic matter that changes the recorded mass under a method.')], 'it': [("Il formatore comunica una perdita di massa del 5% con metodo dichiarato. Qualcuno scrive 'esattamente 5% di sostanza organica' nel piano colturale.\n\nLa bilancia osserva una differenza di massa, non la composizione di ogni componente perso.\n\nVerifica se metodo e minerali del suolo permettono a perdite inorganiche o umidità residua di influire sul risultato.\n\nRiporta 5% LOI con il metodo e chiedi un'interpretazione calibrata prima di chiamarlo sostanza organica esatta.\n\nMisura e interpretazione biologica sono affermazioni diverse.", "Il formatore comunica una perdita di massa del cinque per cento con metodo dichiarato. Qualcuno scrive 'esattamente cinque per cento di sostanza organica' nel piano colturale.\n\nLa bilancia osserva una differenza di massa, non la composizione di ogni componente perso.\n\nVerifica se metodo e minerali del suolo permettono a perdite inorganiche o umidità residua di influire sul risultato.\n\nRiporta cinque per cento elle o i con il metodo e chiedi un'interpretazione calibrata prima di chiamarlo sostanza organica esatta.\n\nMisura e interpretazione biologica sono affermazioni diverse."), ("La sostanza organica contribuisce a diverse funzioni del suolo. Nella perdita per ignizione (LOI), un formatore qualificato mostra come un campione asciutto viene pesato, riscaldato secondo un metodo di laboratorio, raffreddato e pesato di nuovo. Spiegherai e calcolerai la perdita di massa registrata, distinguendo ciò che il risultato dimostra da ciò che non dimostra.\n\nSpiegare l'ordine e lo scopo della pesata del crogiolo vuoto, della pesata del campione essiccato in stufa, dell'ignizione controllata, del raffreddamento controllato e della pesata finale senza azionare il forno.\n\nCalcolare una percentuale LOI didattica dalle masse indicate, usando come denominatore la massa iniziale del solo suolo essiccato in stufa, non quella del suolo con il crogiolo, e dichiarare unità e metodo.\n\nSpiegare perché la LOI è una stima della perdita di massa dipendente dal metodo, non un valore universale ed esatto della sostanza organica, e perché l'intervallo didattico 3–6% non vale per ogni suolo.", "La sostanza organica contribuisce a diverse funzioni del suolo. Nella perdita per ignizione (elle o i), un formatore qualificato mostra come un campione asciutto viene pesato, riscaldato secondo un metodo di laboratorio, raffreddato e pesato di nuovo. Spiegherai e calcolerai la perdita di massa registrata, distinguendo ciò che il risultato dimostra da ciò che non dimostra.\n\nSpiegare l'ordine e lo scopo della pesata del crogiolo vuoto, della pesata del campione essiccato in stufa, dell'ignizione controllata, del raffreddamento controllato e della pesata finale senza azionare il forno.\n\nCalcolare una percentuale elle o i didattica dalle masse indicate, usando come denominatore la massa iniziale del solo suolo essiccato in stufa, non quella del suolo con il crogiolo, e dichiarare unità e metodo.\n\nSpiegare perché la elle o i è una stima della perdita di massa dipendente dal metodo, non un valore universale ed esatto della sostanza organica, e perché l'intervallo didattico da tre a sei per cento non vale per ogni suolo."), ("Metti in ordine le cinque fasi mostrate dal formatore; associa C, D e I alle masse; calcola suolo asciutto, perdita di massa e LOI% per l'esempio esplicitamente inventato 30.00/35.00/34.75 g. Poi indica se 2.5% è classificato e identifica un'interferenza inorganica e un dato mancante su sito o metodo.\n\nPer la dimostrazione reale serve il metodo approvato del laboratorio e un formatore qualificato; il calcolo dello studente usa dati inventati e non certifica la capacità operativa.", "Metti in ordine le cinque fasi mostrate dal formatore; associa ci, di e i alle masse; calcola suolo asciutto, perdita di massa e elle o i per cento per l'esempio esplicitamente inventato trenta virgola zero zero, trentacinque virgola zero zero, trentaquattro virgola sette cinque grammi. Poi indica se due virgola cinque per cento è classificato e identifica un'interferenza inorganica e un dato mancante su sito o metodo.\n\nPer la dimostrazione reale serve il metodo approvato del laboratorio e un formatore qualificato; il calcolo dello studente usa dati inventati e non certifica la capacità operativa."), ('So spiegare come è stato preparato il campione e come il formatore ha ottenuto e interpretato le masse LOI, senza sostenere di aver azionato il forno?\n\nSolo autovalutazione', 'So spiegare come è stato preparato il campione e come il formatore ha ottenuto e interpretato le masse elle o i, senza sostenere di aver azionato il forno?\n\nSolo autovalutazione'), ('Un esempio dà C=30.00 g, D=35.00 g e I=34.75 g. Uno studente divide 0.25 g per 35.00 g.\n\nSottrai C da D per la massa iniziale del suolo essiccato: 5.00 g.\n\nSottrai I da D per la perdita: 0.25 g.\n\nDividi 0.25 per 5.00 e moltiplica per 100: 5.0% LOI. Dichiara che le masse sono state inventate per esercizio.\n\nLa massa del recipiente non entra nel denominatore.', 'Un esempio dà ci uguale a trenta virgola zero zero grammi, di uguale a trentacinque virgola zero zero grammi e i uguale a trentaquattro virgola sette cinque grammi. Uno studente divide zero virgola due cinque grammi per trentacinque virgola zero zero grammi.\n\nSottrai ci da di per la massa iniziale del suolo essiccato: cinque virgola zero zero grammi.\n\nSottrai i da di per la perdita: zero virgola due cinque grammi.\n\nDividi zero virgola due cinque per cinque virgola zero zero e moltiplica per cento: cinque virgola zero per cento elle o i. Dichiara che le masse sono state inventate per esercizio.\n\nLa massa del recipiente non entra nel denominatore.'), ('Un rapporto riporta 2.5% di sostanza organica e uno studente insiste che la tabella didattica lo classifichi come carente.\n\nLa tabella indica basso sotto 2% e ottimale 3–6%; 2.5% cade nel vuoto non classificato.\n\nChiedi metodo del laboratorio e interpretazione regionale e specifica del suolo, considerando profondità, tessitura e clima.\n\nNon prescrivere compost a una dose ipotizzata sulla sola base di quel numero.\n\nNon classificato in questa tabella non significa sano, malsano o assenza di necessità.', 'Un rapporto riporta due virgola cinque per cento di sostanza organica e uno studente insiste che la tabella didattica lo classifichi come carente.\n\nLa tabella indica basso sotto due per cento e ottimale da tre a sei per cento; due virgola cinque per cento cade nel vuoto non classificato.\n\nChiedi metodo del laboratorio e interpretazione regionale e specifica del suolo, considerando profondità, tessitura e clima.\n\nNon prescrivere compost a una dose ipotizzata sulla sola base di quel numero.\n\nNon classificato in questa tabella non significa sano, malsano o assenza di necessità.'), ("sostanza organica del suolo\n\nMateriali organici e prodotti della loro decomposizione nel suolo, collegati a struttura, acqua e ciclo dei nutrienti.\n\nperdita per ignizione (LOI)\n\nPercentuale di massa persa da un campione essiccato dopo riscaldamento secondo un metodo di laboratorio dichiarato.\n\ncrogiolo\n\nRecipiente da laboratorio resistente al calore; la sua massa non entra nella massa del suolo asciutto usata nel calcolo.\n\nbase del suolo essiccato\n\nMassa del campione dopo l'essiccazione specificata e prima dell'ignizione, denominatore di questo esempio.\n\ninterferenza\n\nProcesso diverso dalla perdita di sostanza organica che modifica la massa registrata con un metodo.", "sostanza organica del suolo\n\nMateriali organici e prodotti della loro decomposizione nel suolo, collegati a struttura, acqua e ciclo dei nutrienti.\n\nperdita per ignizione (elle o i)\n\nPercentuale di massa persa da un campione essiccato dopo riscaldamento secondo un metodo di laboratorio dichiarato.\n\ncrogiolo\n\nRecipiente da laboratorio resistente al calore; la sua massa non entra nella massa del suolo asciutto usata nel calcolo.\n\nbase del suolo essiccato\n\nMassa del campione dopo l'essiccazione specificata e prima dell'ignizione, denominatore di questo esempio.\n\ninterferenza\n\nProcesso diverso dalla perdita di sostanza organica che modifica la massa registrata con un metodo.")], 'de': [('Ein Bericht nennt 2.5% organische Substanz. Eine lernende Person behauptet, die Unterrichtstabelle stufe dies als mangelhaft ein.\n\nDie Beispieltabelle nennt niedrig unter 2% und optimal 3–6%; 2.5% liegt in der nicht klassifizierten Lücke.\n\nFrage nach Laborverfahren und regionaler sowie bodenspezifischer Interpretation mit Tiefe, Textur und Klima.\n\nVerschreibe anhand dieses Werts keine geschätzte Kompostmenge.\n\nIn dieser Tabelle nicht klassifiziert heißt weder gesund noch ungesund noch ohne Bedarf.', 'Ein Bericht nennt zwei Komma fünf Prozent organische Substanz. Eine lernende Person behauptet, die Unterrichtstabelle stufe dies als mangelhaft ein.\n\nDie Beispieltabelle nennt niedrig unter zwei Prozent und optimal drei bis sechs Prozent; zwei Komma fünf Prozent liegt in der nicht klassifizierten Lücke.\n\nFrage nach Laborverfahren und regionaler sowie bodenspezifischer Interpretation mit Tiefe, Textur und Klima.\n\nVerschreibe anhand dieses Werts keine geschätzte Kompostmenge.\n\nIn dieser Tabelle nicht klassifiziert heißt weder gesund noch ungesund noch ohne Bedarf.'), ('Ein Übungsprotokoll nennt C=30.00 g, D=35.00 g und I=34.75 g. Eine lernende Person teilt 0.25 g durch 35.00 g.\n\nZiehe C von D ab, um die anfängliche Trockenbodenmasse zu erhalten: 5.00 g.\n\nZiehe I von D ab, um den Verlust zu erhalten: 0.25 g.\n\nTeile 0.25 durch 5.00 und multipliziere mit 100: 5.0% LOI. Kennzeichne die Massen als erfundene Übungswerte.\n\nDie Gefäßmasse gehört nicht in den Nenner.', 'Ein Übungsprotokoll nennt Ce gleich dreißig Komma null null Gramm, De gleich fünfunddreißig Komma null null Gramm und I gleich vierunddreißig Komma sieben fünf Gramm. Eine lernende Person teilt null Komma zwei fünf Gramm durch fünfunddreißig Komma null null Gramm.\n\nZiehe Ce von De ab, um die anfängliche Trockenbodenmasse zu erhalten: fünf Komma null null Gramm.\n\nZiehe I von De ab, um den Verlust zu erhalten: null Komma zwei fünf Gramm.\n\nTeile null Komma zwei fünf durch fünf Komma null null und multipliziere mit einhundert: fünf Komma null Prozent El O I. Kennzeichne die Massen als erfundene Übungswerte.\n\nDie Gefäßmasse gehört nicht in den Nenner.'), ("Eine Lehrkraft meldet 5% Massenverlust nach einem benannten Verfahren. Jemand trägt 'exakt 5% organische Substanz' in den Anbauplan ein.\n\nDie Waage erfasst einen Massenunterschied, nicht die Zusammensetzung aller verlorenen Bestandteile.\n\nPrüfe, ob Verfahren und Bodenzusammensetzung anorganische Verluste oder Restfeuchte wirksam werden lassen.\n\nBerichte 5% LOI mit dem Verfahren und fordere eine kalibrierte Interpretation an, bevor du von exakter organischer Substanz sprichst.\n\nMesswert und biologische Deutung sind unterschiedliche Aussagen.", "Eine Lehrkraft meldet fünf Prozent Massenverlust nach einem benannten Verfahren. Jemand trägt 'exakt fünf Prozent organische Substanz' in den Anbauplan ein.\n\nDie Waage erfasst einen Massenunterschied, nicht die Zusammensetzung aller verlorenen Bestandteile.\n\nPrüfe, ob Verfahren und Bodenzusammensetzung anorganische Verluste oder Restfeuchte wirksam werden lassen.\n\nBerichte fünf Prozent El O I mit dem Verfahren und fordere eine kalibrierte Interpretation an, bevor du von exakter organischer Substanz sprichst.\n\nMesswert und biologische Deutung sind unterschiedliche Aussagen."), ('Kann ich erklären, wie eine Probe für den angegebenen Test vorbereitet wurde und wie die Lehrkraft die LOI-Massen gewonnen und gedeutet hat, ohne zu behaupten, ich hätte den Ofen bedient?\n\nNur Selbsteinschätzung', 'Kann ich erklären, wie eine Probe für den angegebenen Test vorbereitet wurde und wie die Lehrkraft die El O I-Massen gewonnen und gedeutet hat, ohne zu behaupten, ich hätte den Ofen bedient?\n\nNur Selbsteinschätzung'), ('Ordne die fünf von der Lehrkraft gezeigten Schritte; verbinde C, D und I mit den erfassten Massen; berechne Trockenboden, Massenverlust und LOI% für das ausdrücklich erfundene Beispiel 30.00/35.00/34.75 g. Entscheide dann, ob 2.5% klassifiziert ist, und nenne einen anorganischen Störfaktor und eine fehlende Standort- oder Verfahrensangabe.\n\nEine echte Vorführung erfordert das genehmigte Laborverfahren und eine qualifizierte Lehrkraft; die Rechenaufgabe nutzt erfundene Daten und bescheinigt keine Bedienkompetenz.', 'Ordne die fünf von der Lehrkraft gezeigten Schritte; verbinde Ce, De und I mit den erfassten Massen; berechne Trockenboden, Massenverlust und El O I Prozent für das ausdrücklich erfundene Beispiel dreißig Komma null null, fünfunddreißig Komma null null, vierunddreißig Komma sieben fünf Gramm. Entscheide dann, ob zwei Komma fünf Prozent klassifiziert ist, und nenne einen anorganischen Störfaktor und eine fehlende Standort- oder Verfahrensangabe.\n\nEine echte Vorführung erfordert das genehmigte Laborverfahren und eine qualifizierte Lehrkraft; die Rechenaufgabe nutzt erfundene Daten und bescheinigt keine Bedienkompetenz.'), ('Organische Substanz unterstützt verschiedene Bodenfunktionen. Beim Glühverlust (LOI) zeigt eine qualifizierte Lehrkraft, wie eine trockene Probe gewogen, nach einem Laborverfahren erhitzt, abgekühlt und erneut gewogen wird. Du erklärst und berechnest den erfassten Massenverlust und unterscheidest, was das Ergebnis belegt und was nicht.\n\nReihenfolge und Zweck der Wägung des leeren Tiegels, der ofentrockenen Probe, des kontrollierten Glühens, des kontrollierten Abkühlens und der abschließenden Wägung erklären, ohne den Glühofen zu bedienen.\n\nDen Glühverlust einer Übungsprobe aus angegebenen Massen berechnen, dabei die anfängliche Masse des ofentrockenen Bodens statt Boden und Tiegel zusammen als Nenner verwenden sowie Einheit und Verfahren nennen.\n\nErklären, weshalb LOI eine verfahrensabhängige Schätzung des Massenverlusts und kein allgemein gültiger exakter Wert der organischen Substanz ist und weshalb der Unterrichtsbereich 3–6% nicht auf jeden Boden übertragbar ist.', 'Organische Substanz unterstützt verschiedene Bodenfunktionen. Beim Glühverlust (El O I) zeigt eine qualifizierte Lehrkraft, wie eine trockene Probe gewogen, nach einem Laborverfahren erhitzt, abgekühlt und erneut gewogen wird. Du erklärst und berechnest den erfassten Massenverlust und unterscheidest, was das Ergebnis belegt und was nicht.\n\nReihenfolge und Zweck der Wägung des leeren Tiegels, der ofentrockenen Probe, des kontrollierten Glühens, des kontrollierten Abkühlens und der abschließenden Wägung erklären, ohne den Glühofen zu bedienen.\n\nDen Glühverlust einer Übungsprobe aus angegebenen Massen berechnen, dabei die anfängliche Masse des ofentrockenen Bodens statt Boden und Tiegel zusammen als Nenner verwenden sowie Einheit und Verfahren nennen.\n\nErklären, weshalb El O I eine verfahrensabhängige Schätzung des Massenverlusts und kein allgemein gültiger exakter Wert der organischen Substanz ist und weshalb der Unterrichtsbereich drei bis sechs Prozent nicht auf jeden Boden übertragbar ist.'), ('organische Bodensubstanz\n\nOrganische Stoffe und ihre Zersetzungsprodukte im Boden; wichtig für Struktur, Wasser und Nährstoffkreisläufe.\n\nGlühverlust (LOI)\n\nProzentualer Massenverlust einer ofentrockenen Probe nach Erhitzen gemäß einem angegebenen Laborverfahren.\n\nTiegel\n\nHitzebeständiges Laborgefäß; seine Eigenmasse gehört nicht zur berechneten Trockenbodenmasse.\n\nBezug auf ofentrockenen Boden\n\nMasse der Probe nach festgelegter Trocknung und vor dem Glühen; im Beispiel der Nenner.\n\nStörfaktor\n\nEin Vorgang außer dem Verlust organischer Substanz, der die erfasste Masse unter einem Verfahren verändert.', 'organische Bodensubstanz\n\nOrganische Stoffe und ihre Zersetzungsprodukte im Boden; wichtig für Struktur, Wasser und Nährstoffkreisläufe.\n\nGlühverlust (El O I)\n\nProzentualer Massenverlust einer ofentrockenen Probe nach Erhitzen gemäß einem angegebenen Laborverfahren.\n\nTiegel\n\nHitzebeständiges Laborgefäß; seine Eigenmasse gehört nicht zur berechneten Trockenbodenmasse.\n\nBezug auf ofentrockenen Boden\n\nMasse der Probe nach festgelegter Trocknung und vor dem Glühen; im Beispiel der Nenner.\n\nStörfaktor\n\nEin Vorgang außer dem Verlust organischer Substanz, der die erfasste Masse unter einem Verfahren verändert.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s210-remainder-audio-20261023-r1'
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
