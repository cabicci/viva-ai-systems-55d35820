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
IDS = ('S3-11-ar-EG-R01-r1', 'S3-11-ar-EG-R02-r1', 'S3-11-ar-EG-R03-r1', 'S3-11-ar-EG-R04-r1', 'S3-11-ar-EG-R05-r1', 'S3-11-ar-EG-R06-r1', 'S3-11-ar-EG-R07-r1', 'S3-11-ar-EG-R08-r1', 'S3-11-ar-EG-R09-r1', 'S3-11-en-R01-r1', 'S3-11-en-R02-r1', 'S3-11-en-R03-r1', 'S3-11-en-R04-r1', 'S3-11-en-R05-r1', 'S3-11-en-R06-r1', 'S3-11-en-R07-r1', 'S3-11-en-R08-r1', 'S3-11-en-R09-r1', 'S3-11-it-R01-r1', 'S3-11-it-R02-r1', 'S3-11-it-R03-r1', 'S3-11-it-R04-r1', 'S3-11-it-R05-r1', 'S3-11-it-R06-r1', 'S3-11-it-R07-r1', 'S3-11-it-R08-r1', 'S3-11-it-R09-r1', 'S3-11-de-R01-r1', 'S3-11-de-R02-r1', 'S3-11-de-R03-r1', 'S3-11-de-R04-r1', 'S3-11-de-R05-r1', 'S3-11-de-R06-r1', 'S3-11-de-R07-r1', 'S3-11-de-R08-r1', 'S3-11-de-R09-r1')
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
    assert(req['scope'],req['stepId'])==('S311_THIRTYSIX_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-11')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(36,36,36,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s311-readings-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==36
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allThirtySixCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(9))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R07': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R08': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R09': ('A', 'Charon', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/3/paragraphs/2', '/reading/3/paragraphs/3'], 'R06': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R07': ['/reading/4/paragraphs/2', '/reading/4/paragraphs/3'], 'R08': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1'], 'R09': ['/reading/6/paragraphs/0', '/reading/6/paragraphs/1']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('احتفظ بنواتج النشاط الأصلي: ٥ دقائق لفحص ثلاث عينات غير معنونة، و١٥ دقيقة لترشيح ثلاثة محاصيل لكل قوام، و١٥ دقيقة لمسارين لعميل الجزر، و١٠ دقائق لشرح أحدهما لزميل. المدرّب قد يضبط الـ٤٥ دقيقة ويقبل بدائل مبررة مش أسماء النموذج فقط. سؤال الخروج الفردي يسأل عن محصول واحد للرمل وتدخل واحد مع السبب؛ لا يحل محل التسعة محاصيل ولا لمس العينات الحقيقية في S3-10.\n\nنموذج المدرّس بيقترح طبقة بسمك ٢–٣ بوصة من مادة عضوية كبيرة الحجم، تتخلط في أعلى ٦–٨ بوصات من التربة، وحوض مرتفع بارتفاع ٨–١٢ بوصة مليان خليط ٥٠٪ من التربة الطينية الموجودة و٥٠٪ كمبوست، وبعدها فجل دايكون أو برسيم. احتفظ بالأرقام ووحداتها كاقتراحات تعليمية غير متحقق منها، مش وصفة للحقل: افحص عناصر وأملاح المادة وعمق منطقة الجذور والصرف وملاءمة الخليط الأول. مثال ٥٠:٥٠ منفصل عن نسب خلط الأوساط الزراعية التانية وعن مهمة بنك الأسئلة اللي وزنها ٥ كجم. ما تحددش المقادير دي لعميل حقيقي قبل تصميم يناسب الموقع وموافقة المدرّب.', 'احتفظ بنواتج النشاط الأصلي: خمس دقايق لفحص ثلاث عينات غير معنونة، و خمستاشر دقيقة لترشيح ثلاثة محاصيل لكل قوام، و خمستاشر دقيقة لمسارين لعميل الجزر، و عشر دقايق لشرح أحدهما لزميل. المدرّب ممكن يضبط الـ خمسة وأربعين دقيقة ويقبل بدائل مبررة مش أسماء النموذج فقط. سؤال الخروج الفردي يسأل عن محصول واحد للرمل وتدخل واحد مع السبب؛ لا يحل محل التسعة محاصيل ولا لمس العينات الحقيقية في الخطوة تلاتة عشرة.\n\nنموذج المدرّس بيقترح طبقة بسمك اتنين إلى تلاتة بوصة من مادة عضوية كبيرة الحجم، تتخلط في أعلى ستة إلى تمانية بوصات من التربة، وحوض مرتفع بارتفاع تمانية إلى اتناشر بوصة مليان خليط خمسين  في المية من التربة الطينية الموجودة و خمسين  في المية كمبوست، وبعدها فجل دايكون أو برسيم. احتفظ بالأرقام ووحداتها كاقتراحات تعليمية غير متحقق منها، مش وصفة للحقل: افحص عناصر وأملاح المادة وعمق منطقة الجذور والصرف وملاءمة الخليط الأول. مثال خمسين لخمسين منفصل عن نسب خلط الأوساط الزراعية التانية وعن مهمة بنك الأسئلة اللي وزنها خمسة كيلوجرام. ما تحددش المقادير دي لعميل حقيقي قبل تصميم يناسب الموقع وموافقة المدرّب.'), ('الأصل يعرض طريقين: غيّر التربة أو غيّر المحصول. قبلهم افصل القوام المعدني عن الدمك والبناء والصرف والمادة العضوية والعناصر وpH والملح والماء والجو. افحص منطقة الجذور واسأل عن مرور الآلات وهل التربة مبلولة. الحوض المرتفع فوق منطقة مشبعة لا يثبت إن الماء عنده مخرج آمن.\n\nالمادة العضوية قد تدعم تجمعات الحبيبات وحركة الماء، لكنها ما تحولش معدن الطين لرمل ولا تفتح كل طبقة صماء تلقائيًا. الجبس مش علاج لكل طين؛ يُدرس فقط بعد تشخيص صودية التربة مع مخرج ماء وتوصية محلية مؤهلة.', 'الأصل يعرض طريقين: غيّر التربة أو غيّر المحصول. قبلهم افصل القوام المعدني عن الدمك والبناء والصرف والمادة العضوية والعناصر وبي إتش والملح والماء والجو. افحص منطقة الجذور واسأل عن مرور الآلات وهل التربة مبلولة. الحوض المرتفع فوق منطقة مشبعة لا يثبت إن الماء عنده مخرج آمن.\n\nالمادة العضوية ممكن تدعم تجمعات الحبيبات وحركة الماء، لكنها ما تحولش معدن الطين لرمل ولا تفتح كل طبقة صماء تلقائي. الجبس مش علاج لكل طين؛ نفكر فيه بس بعد تشخيص صودية التربة مع مخرج ماء وتوصية محلية مؤهلة.'), ('الأصل يقترح كمبوستًا أو بيتموس وأحواضًا مرتفعة وتجنب شغل الطين وهو مبلول. المدخل العضوي المناسب قد يحسن تجمعات التربة والمسام مع الوقت؛ والبيتموس له تكلفة ومشكلات مصدر وأثر بيئي. الحوض المرتفع يحتاج عمق جذور كافيًا وجوانب ثابتة ومسار صرف وخليط زراعة مناسبًا. أوقف مرور الآلات والحرث لما التربة تلطخ الأدوات أو تعمل كرة لزجة. لو طبقة مانعة أو تغدق مستمر، حدد السبب والصرف وحركة المعدات؛ الخلط والحرث المتكرر وحدهم ما يضمنوش العلاج.\n\nالفجل الدايكون والبرسيم خيارات تغطية وردت في الأصل. جذورهم ومخلفاتهم قد تفيد بعض مناطق الدمك لو ثبتوا ووصلوا للطبقة، لكن مش مضمونين يكسروا كل طبقة آلات عميقة. رطوبة الأرض وعمق العائق وبقاء الجذور ووقت إنهاء الغطاء ومرور العجلات لاحقًا كلها مهمة.', 'الأصل يقترح كمبوست أو بيتموس وأحواض مرتفعة وتجنب شغل الطين وهو مبلول. المدخل العضوي المناسب ممكن يحسن تجمعات التربة والمسام مع الوقت؛ والبيتموس له تكلفة ومشكلات مصدر وأثر بيئي. الحوض المرتفع يحتاج عمق جذور كافي وجوانب ثابتة ومسار صرف وخليط زراعة مناسب. أوقف مرور الآلات والحرث لما التربة تلطخ الأدوات أو تعمل كرة لزجة. لو طبقة مانعة أو تغدق مستمر، حدد السبب والصرف وحركة المعدات؛ الخلط والحرث المتكرر وحدهم ما يضمنوش العلاج.\n\nالفجل الدايكون والبرسيم خيارات تغطية وردت في الأصل. جذورهم ومخلفاتهم ممكن تفيد بعض مناطق الدمك لو ثبتوا ووصلوا للطبقة، لكن مش مضمونين يكسروا كل طبقة آلات عميقة. رطوبة الأرض وعمق العائق وبقاء الجذور ووقت إنهاء الغطاء ومرور العجلات بعد كده كلها مهمة.'), ('الأصل يقترح كمبوستًا أو سمادًا بلديًا معتّقًا لزيادة OM، وملش قش أو رقائق خشب أو بلاستيك لتقليل البخر، ومحصول تغطية خارج الموسم مثل البرسيم أو البيقية. اختار مادة نظيفة مناسبة، وافحص عناصر وأملاح الكمبوست/السماد، ووفر ماء تأسيس محصول التغطية وخطة إنهائه. ملش البلاستيك لا يضيف مادة عضوية ويحتاج جمعًا وتخلصًا مناسبًا. الرمل المكشوف أو الري القليل أو الملح الزائد قد يغيّروا الخيار.\n\nالبرسيم أو البيقية ممكن يضيفوا مخلفات، ولو بكتيريا العقد فعالة والظروف مناسبة قد يساهموا بنيتروجين. انتقال النيتروجين وتحرره بعد التحلل متغيران؛ ما تحسبش رصيد سماد ثابت من غير دليل.', 'الأصل يقترح كمبوست أو سماد بلدي معتّق لزيادة المادة العضوية، وملش قش أو رقائق خشب أو بلاستيك لتقليل البخر، ومحصول تغطية خارج الموسم مثل البرسيم أو البيقية. اختار مادة نظيفة مناسبة، وافحص عناصر وأملاح الكمبوست، السماد، ووفر ماء تأسيس محصول التغطية وخطة إنهائه. ملش البلاستيك لا يضيف مادة عضوية ويحتاج جمع وتخلص مناسب. الرمل المكشوف أو الري القليل أو الملح الزائد ممكن يغيّروا الخيار.\n\nالبرسيم أو البيقية ممكن يضيفوا مخلفات، ولو بكتيريا العقد فعالة والظروف مناسبة ممكن يساهموا بنيتروجين. انتقال النيتروجين وتحرره بعد التحلل متغيران؛ ما تحسبش رصيد سماد ثابت من غير دليل.'), ('المرحلة ١: اقطع أو حوّل مرور الآلات، وافحص عمق واستمرار الطبقة المدكوكة، وحلل OM والعناصر وpH وأي ملوحة أو تلوث يخص الموقع. راقب حركة الماء في وقت مناسب. المرحلة ٢: لما الظروف تسمح، اختار كمية موثقة من كمبوست نظيف/سماد معتّق ومحصول تغطية أو حوضًا مناسبًا، وتعامل مع الصرف والمرور. فكر في تفكيك ميكانيكي عميق فقط بعد تشخيص وبحالة جفاف مناسبة، من غير وعد بأثر دائم لو الآلات رجعت. المرحلة ٣: بعد نمو النباتات وتغيرات الجو قارن تسرب الماء والجذور والتحاليل بخط الأساس، وعدل الخطة ثم جرّب محصولًا مناسبًا. ٣–٦ شهور إطار تخطيط في البنك، مش موعد مضمون لإصلاح كامل.\n\nالكمبوست مادة عضوية وعناصرها متغيرة وقد تتحرر تدريجيًا؛ الإفراط فيه ممكن يضيف ملحًا وعناصر. السماد المعدني قد يعطي عناصر محددة بسرعة أكبر بعد فحوص التربة والمحصول، لكنه لا يزيل الدمك ولا يبني مسامًا وحده. ولا واحد منهم مستدام أو ضار في كل جرعة؛ الفاقد ووقت الإضافة وجودة المصدر واستجابة النبات والمتابعة طويلة المدى تحدد. ما تخترعش جرعة أو تضمن زيادة محصول.', 'المرحلة واحد: اقطع أو حوّل مرور الآلات، وافحص عمق واستمرار الطبقة المدكوكة، وحلل المادة العضوية والعناصر وبي إتش وأي ملوحة أو تلوث يخص الموقع. راقب حركة الماء في وقت مناسب. المرحلة اتنين: لما الظروف تسمح، اختار كمية موثقة من كمبوست نظيف، سماد معتّق ومحصول تغطية أو حوضًا مناسب، وتعامل مع الصرف والمرور. فكر في تفكيك ميكانيكي عميق فقط بعد تشخيص وبحالة جفاف مناسبة، من غير وعد بأثر دائم لو الآلات رجعت. المرحلة تلاتة: بعد نمو النباتات وتغيرات الجو قارن تسرب الماء والجذور والتحاليل بخط الأساس، وعدل الخطة ثم جرّب محصول مناسب. تلاتة إلى ستة شهور إطار تخطيط في البنك، مش موعد مضمون لإصلاح كامل.\n\nالكمبوست مادة عضوية وعناصرها متغيرة وقد تتحرر تدريجيًا؛ الإفراط فيه ممكن يضيف ملح وعناصر. السماد المعدني ممكن يعطي عناصر محددة بسرعة أكبر بعد فحوص التربة والمحصول، لكنه لا يزيل الدمك ولا يبني مسام وحده. ولا واحد منهم مستدام أو ضار في كل جرعة؛ الفاقد ووقت الإضافة وجودة المصدر واستجابة النبات والمتابعة طويلة المدى تحدد. ما تخترعش جرعة أو تضمن زيادة محصول.'), ('حالة البنك تقارن الجزر أو البطاطس عميقة الجذور والذرة وحقل أرز مع مرعى حشائش أو أعشاب محلية قليلة العمق ومتأقلمة مع الجفاف. من الاختيارات دي، غطاء نباتي ثابت يناسب المكان نقطة بداية أقل تعرية لتربة صخرية ضحلة منحدرة؛ النوع وعمق جذوره يحتاجان فحصًا محليًا. ما تكشفش تربة ضحلة لمحصول كثير تقليب لمجرد إنه معروف.\n\nالزراعة من غير حرث مع بقاء مخلفات المحصول على السطح قد يحميه من الرياح والمياه ويضيف مواد عضوية مع الوقت. ده نظام إدارة، مش وعد بزيادة OM فورًا أو إصلاح كل طبقة مدكوكة. راجع تثبيت الغطاء والحشائش والآفات والرطوبة وكمية المخلفات وبقاءها؛ المنحدر الشديد قد يحتاج إجراءات كنتور أو غطاء دائم إضافية. ما تسيبش المنحدر عاريًا وانت مستني تحسنًا افتراضيًا.', 'حالة البنك تقارن الجزر أو البطاطس عميقة الجذور والذرة وحقل أرز مع مرعى حشائش أو أعشاب محلية قليلة العمق ومتأقلمة مع الجفاف. من الاختيارات دي، غطاء نباتي ثابت يناسب المكان نقطة بداية أقل تعرية لتربة صخرية ضحلة منحدرة؛ النوع وعمق جذوره يحتاجان فحص محلي. ما تكشفش تربة ضحلة لمحصول كثير تقليب لمجرد إنه معروف.\n\nالزراعة من غير حرث مع بقاء مخلفات المحصول على السطح ممكن يحميه من الرياح والمياه ويضيف مواد عضوية مع الوقت. ده نظام إدارة، مش وعد بزيادة المادة العضوية فورًا أو إصلاح كل طبقة مدكوكة. راجع تثبيت الغطاء والحشائش والآفات والرطوبة وكمية المخلفات وبقاءها؛ المنحدر الشديد قد يحتاج إجراءات كنتور أو غطاء دائم إضافية. ما تسيبش المنحدر عاريًا وانت مستني تحسن افتراضي.'), ('قائمة الأصل بتشمل كمان متحلّل أوراق الشجر، جنب الكمبوست والسماد البلدي القديم. جودة المادة وتحليل العناصر والأملاح والغرض من استخدامها مهمين؛ المواد دي مش أسمدة متساوية ينفع نبدّلها تلقائيًا. اقتراح الأصل بنسبة ٥٠:٥٠ ما بيحددش النسبة بالكتلة ولا بالحجم، فما نفترضش أي أساس منهم أو نعتبرها مواصفة معتمدة للموقع الفعلي.\n\nاربط ده بورشة S3-10: ٥ دقايق لملاحظة العينات الحقيقية، و١٥ لتخطيط المحاصيل التسعة، و١٥ لمساري العميل، و١٠ لشرح الزملاء. الميسّر يقدر يعدّل توزيع الـ٤٥ دقيقة. احتفظ بسؤال الخروج المنفصل للتربة الرملية: محصول واحد وإجراء واحد. دي أنشطة مخططة، مش دليل إنها حصلت. استخدم القاموس وبدايات الجمل: افحص الأول…؛ اختيار ممكن لإدارة التربة هو… لو…؛ محصول بديل هو… لأن… . زميلك ممكن يسأل عن سبب الاختيار؛ احتفظ بتفسيرك الفردي واقبل إجابات تانية أسبابها واضحة ومقنعة.', 'قائمة الأصل بتشمل كمان متحلّل أوراق الشجر، جنب الكمبوست والسماد البلدي القديم. جودة المادة وتحليل العناصر والأملاح والغرض من استخدامها مهمين؛ المواد دي مش أسمدة متساوية ينفع نبدّلها تلقائي. اقتراح الأصل بنسبة خمسين لخمسين ما بيحددش النسبة بالكتلة ولا بالحجم، فما نفترضش أي أساس منهم أو نعتبرها مواصفة معتمدة للموقع الفعلي.\n\nاربط ده بورشة الخطوة تلاتة عشرة: خمس دقايق لملاحظة العينات الحقيقية، و خمستاشر لتخطيط المحاصيل التسعة، و خمستاشر لمساري العميل، و عشرة لشرح الزملاء. الميسّر يقدر يعدّل توزيع الـ خمسة وأربعين دقيقة. احتفظ بسؤال الخروج المنفصل للتربة الرملية: محصول واحد وإجراء واحد. دي أنشطة مخططة، مش دليل إنها حصلت. استخدم القاموس وبدايات الجمل: افحص الأول…؛ اختيار ممكن لإدارة التربة هو… لو…؛ محصول بديل هو… لأن… . زميلك ممكن يسأل عن سبب الاختيار؛ احتفظ بتفسيرك الفردي واقبل إجابات تانية أسبابها واضحة ومقنعة.'), ('للرمل الجاف، الأصل يسرد البطاطا واللوبيا والدخن والسورجم، وأعشاب الروزماري والزعتر واللافندر والأوريجانو. دي مرشحات مش محاصيل «مضادة للجفاف» بلا شروط؛ افحص ماء الإنبات والصنف والحر وعمق الجذر والملوحة والسوق. وللطين الثقيل الرطب يسرد بعض أصناف الأرز والقلقاس لو الجو والماء المنضبط مناسبين، وخسًا أو سبانخ على خطوط مرتفعة، وبعض حشائش ومراعي وبرسيم. الجذر الضحل مش دليل تحمل ماء راكد؛ محصول يناسب غمرًا مُدارًا لا يثبت صلاحية أرض متغدقة بلا تحكم.\n\nلعميل الجزر في الطين المدكوك، النموذج يقترح فاصوليا شجيرية أو متسلقة أو خسًا أو سبانخ. الفاصوليا تحتاج صرفًا مناسبًا، وتثبيت النيتروجين يحتاج بكتيريا عقد ملائمة ونشطة وظروفًا مناسبة. الورقيات على خطوط مرتفعة ومصروفة قد تكون تجربة ممكنة، لكن غمر الجذور المزمن يؤذيها برضه. الجزر نفسه ممكن ينمو في طين أثقل لو بناؤه وصرفه مناسبين؛ فلا مسار تلقائي.', 'للرمل الجاف، الأصل يسرد البطاطا واللوبيا والدخن والسورجم، وأعشاب الروزماري والزعتر واللافندر والأوريجانو. دي مرشحات مش محاصيل «مضادة للجفاف» بلا شروط؛ افحص ماء الإنبات والصنف والحر وعمق الجذر والملوحة والسوق. وللطين الثقيل الرطب يسرد بعض أصناف الأرز والقلقاس لو الجو والماء المنضبط مناسبين، وخس أو سبانخ على خطوط مرتفعة، وبعض حشائش ومراعي وبرسيم. الجذر الضحل مش دليل تحمل ماء راكد؛ محصول يناسب غمرًا مُدارًا لا يثبت صلاحية أرض متغدقة بلا تحكم.\n\nلعميل الجزر في الطين المدكوك، النموذج يقترح فاصوليا شجيرية أو متسلقة أو خسًا أو سبانخ. الفاصوليا تحتاج صرفًا مناسب، وتثبيت النيتروجين يحتاج بكتيريا عقد ملائمة ونشطة وظروف مناسبة. الورقيات على خطوط مرتفعة ومصروفة ممكن تكون تجربة ممكنة، لكن غمر الجذور المزمن يؤذيها برضه. الجزر نفسه ممكن ينمو في طين أثقل لو بناؤه وصرفه مناسبين؛ فلا مسار تلقائي.')], 'en': [('Keep the original workshop outputs: 5 minutes observing three unlabelled samples, 15 minutes proposing three crops per texture, 15 minutes giving two paths for the carrot client, and 10 minutes explaining one path to a partner. The trainer may flex the 45-minute schedule and accepts well-defended alternatives, not only model crop names. The individual exit ticket asks for one sandy-soil crop and one management action with reasons; it cannot replace the three-crops-per-texture task or real-sample observation in S3-10.\n\nThe teacher model gives 2–3 inches of bulky organic matter mixed into the top 6–8 inches, an 8–12-inch-high raised bed filled with 50% existing clay soil and 50% compost, then daikon or clover. Preserve those exact source quantities as *unverified teaching proposals*, not a field recipe: test compost/manure nutrients and salts, root-zone depth, drainage and material suitability first. The 50:50 example is separate from other course potting-mix ratios and a 5 kg bank task. Do not specify these amounts to a real client without a site-specific design and trainer approval.', 'Keep the original workshop outputs: five minutes observing three unlabelled samples, fifteen minutes proposing three crops per texture, fifteen minutes giving two paths for the carrot client, and ten minutes explaining one path to a partner. The trainer may flex the forty-five-minute schedule and accepts well-defended alternatives, not only model crop names. The individual exit ticket asks for one sandy-soil crop and one management action with reasons; it cannot replace the three-crops-per-texture task or real-sample observation in step S three ten.\n\nThe teacher model gives two to three inches of bulky organic matter mixed into the top six to eight inches, an eight to twelve-inch-high raised bed filled with fifty percent existing clay soil and fifty percent compost, then daikon or clover. Preserve those exact source quantities as unverified teaching proposals, not a field recipe: test compost, manure nutrients and salts, root-zone depth, drainage and material suitability first. The fifty to fifty example is separate from other course potting-mix ratios and a five-kilogram bank task. Do not specify these amounts to a real client without a site-specific design and trainer approval.'), ('Phase 1: stop or redirect machinery, inspect how deep and continuous the compacted zone is and test organic matter, nutrients, pH and any site-relevant salinity or contamination. Observe water movement in suitable conditions. Phase 2: when conditions allow, choose a documented clean compost/aged-manure amount and a cover crop or suitable bed system; address drainage and traffic. A deep mechanical intervention is considered only after diagnosis and at an appropriate dry condition, with no claim of lasting benefit if traffic resumes. Phase 3: after growth and weathering, compare infiltration/root evidence and soil tests with baseline, adjust the plan and trial a suitable crop. Three to six months is the planning window from the question bank, not a guaranteed date for complete restoration.\n\nCompost is an organic-matter input with variable, often gradual nutrient availability and possible nutrient/salt overload. A mineral fertilizer can supply specified nutrients more promptly after soil and crop tests, but does not physically remove compaction or replace root-zone structure. Neither is inherently sustainable or harmful at every rate; losses, application timing, source quality, crop response and longer-term monitoring decide. Do not invent a rate or claim that yield must rise.', 'Phase one: stop or redirect machinery, inspect how deep and continuous the compacted zone is and test organic matter, nutrients, p H and any site-relevant salinity or contamination. Observe water movement in suitable conditions. Phase two: when conditions allow, choose a documented clean compost, aged-manure amount and a cover crop or suitable bed system; address drainage and traffic. A deep mechanical intervention is considered only after diagnosis and at an appropriate dry condition, with no claim of lasting benefit if traffic resumes. Phase three: after growth and weathering, compare infiltration, root evidence and soil tests with baseline, adjust the plan and trial a suitable crop. Three to six months is the planning window from the question bank, not a guaranteed date for complete restoration.\n\nCompost is an organic-matter input with variable, often gradual nutrient availability and possible nutrient, salt overload. A mineral fertilizer can supply specified nutrients more promptly after soil and crop tests, but does not physically remove compaction or replace root-zone structure. Neither is inherently sustainable or harmful at every rate; losses, application timing, source quality, crop response and longer-term monitoring decide. Do not invent a rate or claim that yield must rise.'), ('The original lesson offers two options: change the soil or change the crop. Before either, describe mineral texture separately from compaction, structure, drainage, organic matter, nutrients, pH, salinity, water supply and climate. Probe or inspect the root zone and ask when the land carries machinery and whether it is wet. A raised bed above a saturated area is not proof that water has a safe exit.\n\nOrganic material can help aggregation and water management, but it does not turn clay mineral particles into sand or cure an impermeable layer automatically. Gypsum is not a general remedy for every clay texture; consider it only after a sodicity diagnosis, with water movement and an appropriate local recommendation.', 'The original lesson offers two options: change the soil or change the crop. Before either, describe mineral texture separately from compaction, structure, drainage, organic matter, nutrients, p H, salinity, water supply and climate. Probe or inspect the root zone and ask when the land carries machinery and whether it is wet. A raised bed above a saturated area is not proof that water has a safe exit.\n\nOrganic material can help aggregation and water management, but it does not turn clay mineral particles into sand or cure an impermeable layer automatically. Gypsum is not a general remedy for every clay texture; consider it only after a sodicity diagnosis, with water movement and an appropriate local recommendation.'), ('The source material list also explicitly includes leaf mould alongside compost and aged manure. Material quality, nutrient/salt analysis and purpose matter; these materials are not automatically interchangeable fertilizers. The50:50 source proposal does not specify mass or volume, so neither basis may be inferred or used as an approved real-site specification.\n\nLink with the S3-10 workshop:5minutes real-sample observation,15nine-crop planning,15two-path client and10peer explanation; facilitator may flex the45minutes. Retain the separate one-crop/one-action sandy exit ticket. These are planned activities, not evidence they occurred. Use the glossary and sentence starters: First check…; One management option is…if…; An alternative crop is…because… . A partner may question the choice; keep your individual reasoning and accept other well-defended answers.', 'The source material list also explicitly includes leaf mould alongside compost and aged manure. Material quality, nutrient, salt analysis and purpose matter; these materials are not automatically interchangeable fertilizers. The fifty to fifty source proposal does not specify mass or volume, so neither basis may be inferred or used as an approved real-site specification.\n\nLink with the step S three ten workshop:five minutes real-sample observation,fifteen nine-crop planning,fifteen two-path client and ten peer explanation; facilitator may flex the forty-five minutes. Retain the separate one-crop, one-action sandy exit ticket. These are planned activities, not evidence they occurred. Use the glossary and sentence starters: First check…; One management option is…if…; An alternative crop is…because… . A partner may question the choice; keep your individual reasoning and accept other well-defended answers.'), ('The source proposes compost or peat moss, raised beds and avoiding work on wet clay. Appropriate organic inputs can support aggregation and porosity over time; peat has sourcing and environmental tradeoffs. Raised beds need adequate root depth, stable sides, an outlet or drainage design and a medium suited to the crop. Stop traffic and cultivation while the soil smears or forms a sticky ball. Where a restrictive layer or waterlogging persists, test the cause and plan drainage/traffic control; merely mixing compost or repeatedly tilling will not guarantee a fix.\n\nDaikon radish and clover are source cover-crop options. Roots and residues may help some compacted zones when they establish and reach the layer, but they cannot be assumed to break every deep machinery pan. Drying state, layer depth, root survival, termination and future wheel traffic matter.', 'The source proposes compost or peat moss, raised beds and avoiding work on wet clay. Appropriate organic inputs can support aggregation and porosity over time; peat has sourcing and environmental tradeoffs. Raised beds need adequate root depth, stable sides, an outlet or drainage design and a medium suited to the crop. Stop traffic and cultivation while the soil smears or forms a sticky ball. Where a restrictive layer or waterlogging persists, test the cause and plan drainage, traffic control; merely mixing compost or repeatedly tilling will not guarantee a fix.\n\nDaikon radish and clover are source cover-crop options. Roots and residues may help some compacted zones when they establish and reach the layer, but they cannot be assumed to break every deep machinery pan. Drying state, layer depth, root survival, termination and future wheel traffic matter.'), ('The teacher source proposes compost or aged manure to increase organic matter, straw, wood-chip or plastic surface mulch to reduce evaporation, and an off-season clover or vetch cover crop. Select clean, suitable material, check compost/manure nutrient and salt content, water the establishing cover crop and plan how and when to terminate it. Plastic mulch is not an organic-matter input and needs retrieval and waste handling. Bare sand, limited irrigation or excess salts can change the choice.\n\nA clover or vetch crop can add residue and, when effective rhizobia nodulation and conditions allow, contribute nitrogen. Nitrogen transfer and later release are variable; do not promise a fixed fertilizer credit without evidence.', 'The teacher source proposes compost or aged manure to increase organic matter, straw, wood-chip or plastic surface mulch to reduce evaporation, and an off-season clover or vetch cover crop. Select clean, suitable material, check compost, manure nutrient and salt content, water the establishing cover crop and plan how and when to terminate it. Plastic mulch is not an organic-matter input and needs retrieval and waste handling. Bare sand, limited irrigation or excess salts can change the choice.\n\nA clover or vetch crop can add residue and, when effective rhizobia nodulation and conditions allow, contribute nitrogen. Nitrogen transfer and later release are variable; do not promise a fixed fertilizer credit without evidence.')], 'it': [('Conserva i prodotti dell’attività: 5 minuti per osservare tre campioni reali non etichettati, 15 minuti per proporre tre colture per tessitura, 15 minuti per due percorsi del cliente e 10 minuti per spiegare un percorso a un compagno. Il formatore può adattare i 45 minuti e accetta alternative ben motivate, non solo i nomi del modello. Il biglietto individuale finale chiede una coltura per sabbia e un’azione gestionale con motivi; non sostituisce le nove colture né l’osservazione dei campioni veri in S3-10.\n\nIl modello del docente propone uno strato di 2–3 pollici di materiale organico voluminoso mescolato nei primi 6–8 pollici di suolo, un’aiuola alta 8–12 pollici riempita con 50% del suolo argilloso esistente e 50% compost, poi daikon o trifoglio. Mantieni cifre e unità come proposte didattiche non verificate, non come ricetta: prima controlla nutrienti e sali del materiale, profondità radicale, drenaggio e idoneità. Questo 50:50 è distinto dagli altri substrati del corso e dal compito della banca di domande da 5 kg. Nessuna dose per un cliente reale senza progetto specifico e approvazione del formatore.', 'Conserva i prodotti dell’attività: cinque minuti per osservare tre campioni reali non etichettati, quindici minuti per proporre tre colture per tessitura, quindici minuti per due percorsi del cliente e dieci minuti per spiegare un percorso a un compagno. Il formatore può adattare i quarantacinque minuti e accetta alternative ben motivate, non solo i nomi del modello. Il biglietto individuale finale chiede una coltura per sabbia e un’azione gestionale con motivi; non sostituisce le nove colture né l’osservazione dei campioni veri in passo S tre dieci.\n\nIl modello del docente propone uno strato di due a tre pollici di materiale organico voluminoso mescolato nei primi sei a otto pollici di suolo, un’aiuola alta otto a dodici pollici riempita con cinquanta per cento del suolo argilloso esistente e cinquanta per cento compost, poi daikon o trifoglio. Mantieni cifre e unità come proposte didattiche non verificate, non come ricetta: prima controlla nutrienti e sali del materiale, profondità radicale, drenaggio e idoneità. Questo cinquanta a cinquanta è distinto dagli altri substrati del corso e dal compito della banca di domande da cinque chilogrammi. Nessuna dose per un cliente reale senza progetto specifico e approvazione del formatore.'), ('Fase 1: interrompi o devia le macchine; verifica profondità e continuità dello strato compatto, sostanza organica, nutrienti, pH e salinità o contaminazione se pertinenti. Osserva il movimento dell’acqua in condizioni adatte. Fase 2: scegli, quando possibile, una quantità documentata di compost pulito o letame maturo e una copertura o aiuola adatta; gestisci drenaggio e traffico. Un intervento meccanico profondo si considera solo dopo diagnosi e con umidità appropriata, senza promessa di durata se torna il traffico. Fase 3: dopo crescita e condizioni atmosferiche confronta infiltrazione, radici e analisi con la base, correggi il piano e prova una coltura adatta. I 3–6 mesi sono una finestra di pianificazione, non una garanzia di recupero completo.\n\nIl compost apporta sostanza organica e nutrienti variabili, spesso graduali, ma un eccesso può caricare sali e nutrienti. Il concime minerale può fornire nutrienti specifici più rapidamente dopo analisi del suolo e fabbisogni colturali, ma non rimuove fisicamente la compattazione né sostituisce la struttura del suolo nella zona radicale. Nessuno dei due è sempre sostenibile o dannoso: perdite, tempi, qualità, risposta e monitoraggio decidono. Non inventare dosi né garantire aumenti produttivi.', 'Fase uno: interrompi o devia le macchine; verifica profondità e continuità dello strato compatto, sostanza organica, nutrienti, pi acca e salinità o contaminazione se pertinenti. Osserva il movimento dell’acqua in condizioni adatte. Fase due: scegli, quando possibile, una quantità documentata di compost pulito o letame maturo e una copertura o aiuola adatta; gestisci drenaggio e traffico. Un intervento meccanico profondo si considera solo dopo diagnosi e con umidità appropriata, senza promessa di durata se torna il traffico. Fase tre: dopo crescita e condizioni atmosferiche confronta infiltrazione, radici e analisi con la base, correggi il piano e prova una coltura adatta. I tre a sei mesi sono una finestra di pianificazione, non una garanzia di recupero completo.\n\nIl compost apporta sostanza organica e nutrienti variabili, spesso graduali, ma un eccesso può caricare sali e nutrienti. Il concime minerale può fornire nutrienti specifici più rapidamente dopo analisi del suolo e fabbisogni colturali, ma non rimuove fisicamente la compattazione né sostituisce la struttura del suolo nella zona radicale. Nessuno dei due è sempre sostenibile o dannoso: perdite, tempi, qualità, risposta e monitoraggio decidono. Non inventare dosi né garantire aumenti produttivi.'), ('La lezione originale presenta due vie: cambiare il suolo oppure la coltura. Prima distingui tessitura minerale da compattazione, struttura, drenaggio, sostanza organica, nutrienti, pH, salinità, disponibilità idrica e clima. Esamina la zona radicale e verifica quando passano le macchine e se il suolo è bagnato. Un’aiuola rialzata sopra un terreno saturo non dimostra che l’acqua abbia una via d’uscita sicura.\n\nLa sostanza organica può favorire gli aggregati e la gestione dell’acqua, ma non trasforma le particelle argillose in sabbia né elimina automaticamente uno strato impermeabile. Il gesso non è un rimedio generale per ogni argilla: valutarlo solo dopo diagnosi di sodicità, con movimento dell’acqua e indicazione locale qualificata.', 'La lezione originale presenta due vie: cambiare il suolo oppure la coltura. Prima distingui tessitura minerale da compattazione, struttura, drenaggio, sostanza organica, nutrienti, pi acca, salinità, disponibilità idrica e clima. Esamina la zona radicale e verifica quando passano le macchine e se il suolo è bagnato. Un’aiuola rialzata sopra un terreno saturo non dimostra che l’acqua abbia una via d’uscita sicura.\n\nLa sostanza organica può favorire gli aggregati e la gestione dell’acqua, ma non trasforma le particelle argillose in sabbia né elimina automaticamente uno strato impermeabile. Il gesso non è un rimedio generale per ogni argilla: valutarlo solo dopo diagnosi di sodicità, con movimento dell’acqua e indicazione locale qualificata.'), ('L’elenco originale comprende anche terriccio di foglie decomposte, oltre a compost e letame maturo. Contano qualità, analisi di nutrienti e sali e scopo: i materiali non sono fertilizzanti automaticamente intercambiabili. La proposta50:50 non specifica massa o volume: nessuna delle due basi può essere dedotta o usata come specifica approvata per il sito reale.\n\nCollega questo lavoro al laboratorio S3-10: 5 minuti di osservazione dei campioni reali, 15 per il piano di nove colture, 15 per i due percorsi del cliente e 10 di spiegazione tra pari; il facilitatore può adattare i 45 minuti. Conserva la domanda finale distinta sul suolo sabbioso: una coltura e un intervento. Sono attività previste, non prove che siano avvenute. Usa il glossario e gli inizi di frase: Prima verifica…; Un’opzione gestionale è… se…; Una coltura alternativa è… perché… . Un compagno può mettere in discussione la scelta; conserva il ragionamento individuale e accetta altre risposte ben motivate.', 'L’elenco originale comprende anche terriccio di foglie decomposte, oltre a compost e letame maturo. Contano qualità, analisi di nutrienti e sali e scopo: i materiali non sono fertilizzanti automaticamente intercambiabili. La proposta cinquanta a cinquanta non specifica massa o volume: nessuna delle due basi può essere dedotta o usata come specifica approvata per il sito reale.\n\nCollega questo lavoro al laboratorio passo S tre dieci: cinque minuti di osservazione dei campioni reali, quindici per il piano di nove colture, quindici per i due percorsi del cliente e dieci di spiegazione tra pari; il facilitatore può adattare i quarantacinque minuti. Conserva la domanda finale distinta sul suolo sabbioso: una coltura e un intervento. Sono attività previste, non prove che siano avvenute. Usa il glossario e gli inizi di frase: Prima verifica…; Un’opzione gestionale è… se…; Una coltura alternativa è… perché… . Un compagno può mettere in discussione la scelta; conserva il ragionamento individuale e accetta altre risposte ben motivate.')], 'de': [('Die Lehrervorlage schlägt Kompost oder abgelagerten Mist zur Erhöhung organischer Substanz vor, Stroh-, Holzhäcksel- oder Plastikmulch gegen Verdunstung sowie Klee oder Wicke als Zwischenfrucht. Wähle sauberes geeignetes Material, prüfe Nährstoff- und Salzgehalt von Kompost/Mist, sichere Wasser für die Etablierung der Begrünung und plane deren Beendigung. Plastik liefert keine organische Substanz und muss eingesammelt und entsorgt werden. Offener Sand, knappes Bewässerungswasser oder überschüssiges Salz ändern die Wahl.\n\nKlee oder Wicke können Rückstände liefern und bei wirksamen passenden Knöllchenbakterien unter geeigneten Bedingungen Stickstoff beitragen. Übertragung und spätere Freisetzung schwanken; rechne ohne Beleg keinen festen Düngergutschriftwert an.', 'Die Lehrervorlage schlägt Kompost oder abgelagerten Mist zur Erhöhung organischer Substanz vor, Stroh-, Holzhäcksel- oder Plastikmulch gegen Verdunstung sowie Klee oder Wicke als Zwischenfrucht. Wähle sauberes geeignetes Material, prüfe Nährstoff- und Salzgehalt von Kompost, Mist, sichere Wasser für die Etablierung der Begrünung und plane deren Beendigung. Plastik liefert keine organische Substanz und muss eingesammelt und entsorgt werden. Offener Sand, knappes Bewässerungswasser oder überschüssiges Salz ändern die Wahl.\n\nKlee oder Wicke können Rückstände liefern und bei wirksamen passenden Knöllchenbakterien unter geeigneten Bedingungen Stickstoff beitragen. Übertragung und spätere Freisetzung schwanken; rechne ohne Beleg keinen festen Düngergutschriftwert an.'), ('Die Vorlage nennt zwei Wege: den Boden verändern oder die Kultur wechseln. Unterscheide zuvor mineralische Körnung von Verdichtung, Gefüge, Entwässerung, organischer Substanz, Nährstoffen, pH, Salzgehalt, Wasserangebot und Klima. Untersuche den Wurzelraum und frage, wann Maschinen darüber fahren und ob der Boden nass ist. Ein Hochbeet auf gesättigtem Untergrund beweist keinen sicheren Wasserabfluss.\n\nOrganische Stoffe können Krümelgefüge und Wasserhaushalt fördern; Tonminerale werden dadurch aber nicht zu Sand und eine undurchlässige Schicht verschwindet nicht automatisch. Gips ist kein allgemeines Heilmittel für Ton. Er kommt nur nach Sodizitätsdiagnose, gesichertem Wasserweg und geeigneter örtlicher Empfehlung in Betracht.', 'Die Vorlage nennt zwei Wege: den Boden verändern oder die Kultur wechseln. Unterscheide zuvor mineralische Körnung von Verdichtung, Gefüge, Entwässerung, organischer Substanz, Nährstoffen, Pe Ha, Salzgehalt, Wasserangebot und Klima. Untersuche den Wurzelraum und frage, wann Maschinen darüber fahren und ob der Boden nass ist. Ein Hochbeet auf gesättigtem Untergrund beweist keinen sicheren Wasserabfluss.\n\nOrganische Stoffe können Krümelgefüge und Wasserhaushalt fördern; Tonminerale werden dadurch aber nicht zu Sand und eine undurchlässige Schicht verschwindet nicht automatisch. Gips ist kein allgemeines Heilmittel für Ton. Er kommt nur nach Sodizitätsdiagnose, gesichertem Wasserweg und geeigneter örtlicher Empfehlung in Betracht.'), ('Die ursprüngliche Materialliste nennt zusätzlich Laubhumus neben Kompost und abgelagertem Mist. Qualität, Nährstoff- und Salzanalysen sowie Zweck sind wichtig; die Materialien sind keine automatisch austauschbaren Dünger. Der50:50-Vorschlag nennt keine Masse- oder Volumenbasis. Keine davon darf unterstellt oder als freigegebene Vorgabe für den realen Standort verwendet werden.\n\nMit dem Workshop S3-10 verknüpfen: 5 Minuten echte Proben beobachten, 15 Minuten neun Kulturen planen, 15 Minuten zwei Wege für den Kunden und 10 Minuten Erklärung im Austausch; die moderierende Person kann die 45 Minuten flexibel verteilen. Die getrennte Abschlussfrage zum Sandboden mit einer Kultur und einer Maßnahme beibehalten. Dies sind geplante Aktivitäten, kein Nachweis ihrer Durchführung. Glossar und Satzanfänge nutzen: Zuerst prüfen…; Eine Bewirtschaftungsoption ist… wenn…; Eine alternative Kultur ist… weil… . Eine Partnerperson kann die Wahl hinterfragen; halte deine individuelle Begründung fest und akzeptiere andere gut begründete Antworten.', 'Die ursprüngliche Materialliste nennt zusätzlich Laubhumus neben Kompost und abgelagertem Mist. Qualität, Nährstoff- und Salzanalysen sowie Zweck sind wichtig; die Materialien sind keine automatisch austauschbaren Dünger. Der fünfzig zu fünfzig-Vorschlag nennt keine Masse- oder Volumenbasis. Keine davon darf unterstellt oder als freigegebene Vorgabe für den realen Standort verwendet werden.\n\nMit dem Workshop Schritt S drei zehn verknüpfen: fünf Minuten echte Proben beobachten, fünfzehn Minuten neun Kulturen planen, fünfzehn Minuten zwei Wege für den Kunden und zehn Minuten Erklärung im Austausch; die moderierende Person kann die fünfundvierzig Minuten flexibel verteilen. Die getrennte Abschlussfrage zum Sandboden mit einer Kultur und einer Maßnahme beibehalten. Dies sind geplante Aktivitäten, kein Nachweis ihrer Durchführung. Glossar und Satzanfänge nutzen: Zuerst prüfen…; Eine Bewirtschaftungsoption ist… wenn…; Eine alternative Kultur ist… weil… . Eine Partnerperson kann die Wahl hinterfragen; halte deine individuelle Begründung fest und akzeptiere andere gut begründete Antworten.'), ('Erhalte alle Ergebnisse der Übung: 5 Minuten drei echte unbeschriftete Proben fühlen, 15 Minuten je drei Kulturen pro Körnung vorschlagen, 15 Minuten zwei Wege für den Möhrenkunden entwickeln und 10 Minuten einen Weg einem Partner erklären. Die Lehrkraft darf den 45-Minuten-Ablauf anpassen und begründete Alternativen statt nur der Modellpflanzen annehmen. Das individuelle Abschlussticket fragt eine Sandkultur und eine Bewirtschaftungsmaßnahme mit Begründung ab; es ersetzt weder die neun Kulturvorschläge noch die echten Proben aus S3-10.\n\nDas Lehrermodell nennt 2–3 Zoll grobes organisches Material in den oberen 6–8 Zoll, ein 8–12 Zoll hohes Hochbeet aus 50% vorhandenem Tonboden und 50% Kompost, danach Daikon oder Klee. Bewahre Werte und Einheiten als *ungeprüfte Lehrvorschläge*, nicht als Feldrezept: prüfe zuerst Nährstoffe und Salze des Materials, Wurzeltiefe, Entwässerung und Eignung. Dieses 50:50-Beispiel ist getrennt von anderen Substratmischungen im Kurs und von einer 5-kg-Aufgabe im Fragenkatalog. Keine Menge für einen realen Kunden ohne standortspezifischen Plan und Freigabe der Lehrkraft.', 'Erhalte alle Ergebnisse der Übung: fünf Minuten drei echte unbeschriftete Proben fühlen, fünfzehn Minuten je drei Kulturen pro Körnung vorschlagen, fünfzehn Minuten zwei Wege für den Möhrenkunden entwickeln und zehn Minuten einen Weg einem Partner erklären. Die Lehrkraft darf den fünfundvierzig-Minuten-Ablauf anpassen und begründete Alternativen statt nur der Modellpflanzen annehmen. Das individuelle Abschlussticket fragt eine Sandkultur und eine Bewirtschaftungsmaßnahme mit Begründung ab; es ersetzt weder die neun Kulturvorschläge noch die echten Proben aus Schritt S drei zehn.\n\nDas Lehrermodell nennt zwei bis drei Zoll grobes organisches Material in den oberen sechs bis acht Zoll, ein acht bis zwölf Zoll hohes Hochbeet aus fünfzig Prozent vorhandenem Tonboden und fünfzig Prozent Kompost, danach Daikon oder Klee. Bewahre Werte und Einheiten als ungeprüfte Lehrvorschläge, nicht als Feldrezept: prüfe zuerst Nährstoffe und Salze des Materials, Wurzeltiefe, Entwässerung und Eignung. Dieses fünfzig zu fünfzig-Beispiel ist getrennt von anderen Substratmischungen im Kurs und von einer fünf-Kilogramm-Aufgabe im Fragenkatalog. Keine Menge für einen realen Kunden ohne standortspezifischen Plan und Freigabe der Lehrkraft.'), ('Phase 1: Maschinenverkehr stoppen oder umlenken, Tiefe und Durchgängigkeit der dichten Schicht untersuchen und organische Substanz, Nährstoffe, pH sowie bei Bedarf Salz oder Kontamination testen. Wasserbewegung unter geeigneten Bedingungen beobachten. Phase 2: wenn möglich eine dokumentierte Menge sauberen Komposts oder reifen Mists und Begrünung oder ein geeignetes Beet wählen; Entwässerung und Verkehr regeln. Tiefes mechanisches Lockern nur nach Diagnose und bei geeigneter Trockenheit erwägen, ohne dauerhaften Erfolg zu versprechen, wenn Verkehr zurückkehrt. Phase 3: nach Wachstum und Witterung Infiltration, Wurzeln und Bodenanalysen mit Ausgangswerten vergleichen, Plan anpassen und passende Kultur erproben. 3–6 Monate sind ein Planungsfenster des Fragenkatalogs, keine Garantie vollständiger Wiederherstellung.\n\nKompost liefert organische Substanz und variable, oft allmählich verfügbare Nährstoffe; zu viel kann Salz und Nährstoffe anreichern. Mineraldünger kann nach Boden- und Kulturprüfung bestimmte Nährstoffe rascher liefern, beseitigt aber weder mechanische Verdichtung noch ersetzt er Porengefüge. Keines ist bei jeder Menge grundsätzlich nachhaltig oder schädlich: Verluste, Zeitpunkt, Materialqualität, Pflanzenreaktion und Langzeitkontrolle entscheiden. Erfinde keine Gabe und garantiere keinen Mehrertrag.', 'Phase eins: Maschinenverkehr stoppen oder umlenken, Tiefe und Durchgängigkeit der dichten Schicht untersuchen und organische Substanz, Nährstoffe, Pe Ha sowie bei Bedarf Salz oder Kontamination testen. Wasserbewegung unter geeigneten Bedingungen beobachten. Phase zwei: wenn möglich eine dokumentierte Menge sauberen Komposts oder reifen Mists und Begrünung oder ein geeignetes Beet wählen; Entwässerung und Verkehr regeln. Tiefes mechanisches Lockern nur nach Diagnose und bei geeigneter Trockenheit erwägen, ohne dauerhaften Erfolg zu versprechen, wenn Verkehr zurückkehrt. Phase drei: nach Wachstum und Witterung Infiltration, Wurzeln und Bodenanalysen mit Ausgangswerten vergleichen, Plan anpassen und passende Kultur erproben. drei bis sechs Monate sind ein Planungsfenster des Fragenkatalogs, keine Garantie vollständiger Wiederherstellung.\n\nKompost liefert organische Substanz und variable, oft allmählich verfügbare Nährstoffe; zu viel kann Salz und Nährstoffe anreichern. Mineraldünger kann nach Boden- und Kulturprüfung bestimmte Nährstoffe rascher liefern, beseitigt aber weder mechanische Verdichtung noch ersetzt er Porengefüge. Keines ist bei jeder Menge grundsätzlich nachhaltig oder schädlich: Verluste, Zeitpunkt, Materialqualität, Pflanzenreaktion und Langzeitkontrolle entscheiden. Erfinde keine Gabe und garantiere keinen Mehrertrag.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s311-readings-audio-20261023-r1'
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
