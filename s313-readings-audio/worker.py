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
IDS = ('S3-13-ar-EG-R01-r1', 'S3-13-ar-EG-R02-r1', 'S3-13-ar-EG-R03-r1', 'S3-13-ar-EG-R04-r1', 'S3-13-ar-EG-R05-r1', 'S3-13-ar-EG-R06-r1', 'S3-13-ar-EG-R07-r1', 'S3-13-en-R01-r1', 'S3-13-en-R02-r1', 'S3-13-en-R03-r1', 'S3-13-en-R04-r1', 'S3-13-en-R05-r1', 'S3-13-en-R06-r1', 'S3-13-en-R07-r1', 'S3-13-it-R01-r1', 'S3-13-it-R02-r1', 'S3-13-it-R03-r1', 'S3-13-it-R04-r1', 'S3-13-it-R05-r1', 'S3-13-it-R06-r1', 'S3-13-it-R07-r1', 'S3-13-de-R01-r1', 'S3-13-de-R02-r1', 'S3-13-de-R03-r1', 'S3-13-de-R04-r1', 'S3-13-de-R05-r1', 'S3-13-de-R06-r1', 'S3-13-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S313_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-13')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s313-readings-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==28
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyEightCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(7))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R07': ('A', 'Charon', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/1/paragraphs/2'], 'R04': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R05': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R06': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R07': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1', '/reading/5/paragraphs/2']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الأصل بيصف عزّاقة صغيرة بشفرات أو أسنان دوّارة تشيل الحشائش وتفك طبقة سطحية بين صفوف ضيقة. Honda بتسمي FJ500-SER الموثّقة هنا آلة حرث. استخدامها بين صفوف معينة يتوقف على عرض الجزء الفعلي والمسافة بين الصفوف وبعده عن جذور المحصول والغطاء ومسار المشغّل وحالة الأرض. دليل المصنع يحذر من الحجارة والأسلاك ومخاطر مشابهة؛ محرك البنزين بيطلع أول أكسيد الكربون، ودليل المصنع بيمنع تشغيله في مكان مغلق، بما فيه الصوبة المقفولة.\n\nالفوائد المحتملة: جهد يدوي أقل، منافسة حشائش أقل، تهوية خفيفة للسطح، تهيئة خفيفة للمهد، أو خلط مناسب بملحق مصرح به. دي مش وفورات أو تحسين بناء تربة مضمون. الحرث المتكرر أو المشي على تربة مبلولة ممكن يضر البناء ويزود الدمك. في حالة الأكر الواحد في الأصل، قارن توفر العمالة والتكاليف والنقل وضرر المحصول والتربة والوصول والمخاطر بالعمل اليدوي أو طريقة مكافحة أخرى. الأكر الواحد مش هو الفدان المصري.', 'الأصل بيصف عزّاقة صغيرة بشفرات أو أسنان دوّارة تشيل الحشائش وتفك طبقة سطحية بين صفوف ضيقة. Honda بتسمي إف جي خمسمية-اس إي آر الموثّقة هنا آلة حرث. استخدامها بين صفوف معينة يتوقف على عرض الجزء الفعلي والمسافة بين الصفوف وبعده عن جذور المحصول والغطاء ومسار المشغّل وحالة الأرض. دليل المصنع يحذر من الحجارة والأسلاك ومخاطر مشابهة؛ محرك البنزين بيطلع أول أكسيد الكربون، ودليل المصنع بيمنع تشغيله في مكان مغلق، بما فيه الصوبة المقفولة.\n\nالفوائد المحتملة: جهد يدوي أقل، منافسة حشائش أقل، تهوية خفيفة للسطح، تهيئة خفيفة للمهد، أو خلط مناسب بملحق مصرح به. دي مش وفورات أو تحسين بناء تربة مضمون. الحرث المتكرر أو المشي على تربة مبلولة ممكن يضر البناء ويزود الدمك. في حالة الأكر الواحد في الأصل، قارن توفر العمالة والتكاليف والنقل وضرر المحصول والتربة والوصول والمخاطر بالعمل اليدوي أو طريقة مكافحة أخرى. الأكر الواحد مش هو الفدان المصري.'), ('الفدان المصري يساوي ٤٢٠٠ م² = ٠٫٤٢ هكتار، أو حوالي ١٫٠٣٨ أكر. الأكر حوالي ٤٠٤٧ م²؛ يعني نقاش الأصل عن أكر واحد يقارب ٠٫٩٦٤ فدان. عبارة «٤–٦ ساعات لكل فدان» لو اتقاست لآلة وحقل معينين، دي زمن لكل مساحة، مش تحويل الفدان إلى عدد أكرات. ما تكتبش إن الفدان يساوي ١٫٠٤–١٫٥٦ أكر اعتمادًا على الساعات.\n\nلتقدير خدمة حقيقية، هات أطوال الصفوف وعرض العمل المناسب والعوائق واللفات ورطوبة الأرض وزمن النقل والتجهيز والعمل المقاس واستهلاك الوقود المقاس أو الموثق؛ وبعدها تكلفة الصيانة والعمالة والوقاية والتنقل والأسعار المحلية. التكلفة التقديرية = كميات موثقة × أسعار وحدات فعلية + مصروفات مبررة. من غيرها اعرض قالب حساب أو افتراضات واضحة، مش ربحًا مضمونًا أو لتر/ساعة متخيلًا من سعة الخزان. خدمة مزارع صغيرة فكرة مشروع ممكنة، مش دليل إنها أرخص من كل جرار أو عمل يدوي.', 'الفدان المصري يساوي أربعة آلاف ومتين متر مربع بتساوي صفر فاصلة أربعة اتنين هكتار، أو حوالي واحد فاصلة صفر تلاتة تمانية أكر. الأكر حوالي أربعة آلاف سبعة وأربعين متر مربع؛ يعني نقاش الأصل عن أكر واحد يقارب صفر فاصلة تسعة ستة أربعة فدان. عبارة «أربعة إلى ستة ساعات لكل فدان» لو اتقاست لآلة وحقل معينين، دي زمن لكل مساحة، مش تحويل الفدان إلى عدد أكرات. ما تكتبش إن الفدان يساوي واحد فاصلة صفر أربعة إلى واحد فاصلة خمسة ستة أكر اعتمادًا على الساعات.\n\nلتقدير خدمة حقيقية، هات أطوال الصفوف وعرض العمل المناسب والعوائق واللفات ورطوبة الأرض وزمن النقل والتجهيز والعمل المقاس واستهلاك الوقود المقاس أو الموثق؛ وبعدها تكلفة الصيانة والعمالة والوقاية والتنقل والأسعار المحلية. التكلفة التقديرية بتساوي كميات موثقة مضروب في أسعار وحدات فعلية زائد مصروفات مبررة. من غيرها اعرض قالب حساب أو افتراضات واضحة، مش ربحًا مضمونًا أو لتر لكل ساعة متخيلًا من سعة الخزان. خدمة مزارع صغيرة فكرة مشروع ممكنة، مش دليل إنها أرخص من كل جرار أو عمل يدوي.'), ('الموضوع الأصلي مقدر بـ٩٠ دقيقة: ٤٥ نظرية و٤٥ تطبيق. خلال الموضوع كله الطالب يتعرف على الأجزاء والفوائد وبعدين التشغيل الآمن والصيانة وحل الأعطال. الخطوة دي للفهم والاختيار؛ الخطوتين الجايين محتاجين دورة تشغيل وصيانة فعلية يلاحظها المدرّب لكل طالب. مشاهدة عرض أو نجاح اختبار هنا ما يسمحش بتشغيل الجهاز. المدرّب يطابق الموديل الفعلي وحالته ودليله وشروط تشغيله المحلية.\n\nالحرث تحريك ميكانيكي للتربة؛ التهوية تبادل الهوا حوالين الجذور؛ «زراعي» هنا يعني إدارة المحصول والتربة. الفدان وحدة مساحة مصرية. القابض يوصل أو يفصل نقل القدرة للأجزاء العاملة. منقّي الهوا يحمي مدخل هوا المحرك، وPPE وسائل وقاية مناسبة للمهمة. افهم وظيفة كل اسم مش تحفظه بس. الحشائش بتنافس على الماء والعناصر والضوء؛ شيلها قد يساعد المحصول لكنه ما يضمنش زيادة إنتاج.', 'الموضوع الأصلي مقدّر بمدة تسعين دقيقة: خمسة وأربعين نظرية وخمسة وأربعين تطبيق. خلال الموضوع كله الطالب يتعرف على الأجزاء والفوائد وبعدين التشغيل الآمن والصيانة وحل الأعطال. الخطوة دي للفهم والاختيار؛ الخطوتين الجايين محتاجين دورة تشغيل وصيانة فعلية يلاحظها المدرّب لكل طالب. مشاهدة عرض أو نجاح اختبار هنا ما يسمحش بتشغيل الجهاز. المدرّب يطابق الموديل الفعلي وحالته ودليله وشروط تشغيله المحلية.\n\nالحرث تحريك ميكانيكي للتربة؛ التهوية تبادل الهوا حوالين الجذور؛ «زراعي» هنا يعني إدارة المحصول والتربة. الفدان وحدة مساحة مصرية. القابض يوصل أو يفصل نقل القدرة للأجزاء العاملة. منقّي الهوا يحمي مدخل هوا المحرك، ومعدات الوقاية الشخصية وسائل وقاية مناسبة للمهمة. افهم وظيفة كل اسم مش تحفظه بس. الحشائش بتنافس على الماء والعناصر والضوء؛ شيلها ممكن يساعد المحصول لكنه ما يضمنش زيادة إنتاج.'), ('جرّب تسمّي الوظيفة قبل ما تستخدم بطاقة الجزء، وبعدين اشرحها لزميل. قارن تلات فوايد واختيار حالة الأكر الواحد. الموضوع الأصلي مخصص له ٩٠ دقيقة: ٤٥ نظرية و٤٥ عملي؛ الأوقات دي للموضوع كله، مش مدة منفصلة لكل واحدة من الخطوات التلاتة. التشغيل والصيانة الفعليين لسه في خطواتهم تحت الإشراف.', 'جرّب تسمّي الوظيفة قبل ما تستخدم بطاقة الجزء، وبعدين اشرحها لزميل. قارن تلات فوايد واختيار حالة الأكر الواحد. الموضوع الأصلي مخصص له تسعين دقيقة: خمسة وأربعين نظرية وخمسة وأربعين عملي؛ الأوقات دي للموضوع كله، مش مدة منفصلة لكل واحدة من الخطوات التلاتة. التشغيل والصيانة الفعليين لسه في خطواتهم تحت الإشراف.'), ('دليل FJ500 فيه عمود خاص بـSER: محرك GX160 سعته ١٦٣ سم³، رباعي الأشواط وبتبريد هوائي قسري، إشعال مغناطيسي ترانزستوري، قابض شدّ سير، نقلة أمامية وواحدة خلفية، كتلة جافة ٥٧ كجم، وسعة خزان وقود ٢٫٤ لتر. افحص عينة الجهاز ورقمه التسلسلي والدليل الحالي قبل أي استعمال. ٢٫٤ لتر معناها حجم الخزان؛ **مش** ٢٫٤ لتر لكل ساعة، وما نقدرش نستنتج مدة التشغيل منها وحدها.\n\nالأصل ص٢٠٠ كاتب ٥ حصان و٤ كم/ساعة و٢٫٣ لتر/ساعة و٩٠ كجم و٤–٦ ساعات لكل فدان لآلة عامة غير محددة. الأرقام دي مش مواصفات موثقة لـSER، وما ينفعش تحسب بيها فاتورة تشغيله. وكذلك قاعدة الأصل «ما يزيدش التشغيل المتصل عن ساعتين» مش مثبتة كحد مصنع لهذا الموديل. خطط للراحة والتبريد الآمن حسب الدليل الفعلي وحالة الجهاز والمدرّب والظروف، من غير حد زمني مخترع.', 'دليل إف جي خمسمية فيه عمود خاص بـاس إي آر: محرك جي إكس مية وستين سعته مية تلاتة وستين سنتيمتر مكعب، رباعي الأشواط وبتبريد هوائي قسري، إشعال مغناطيسي ترانزستوري، قابض شدّ سير، نقلة أمامية وواحدة خلفية، كتلة جافة سبعة وخمسين كيلوجرام، وسعة خزان وقود اتنين فاصلة أربعة لتر. افحص عينة الجهاز ورقمه التسلسلي والدليل الحالي قبل أي استعمال. اتنين فاصلة أربعة لتر معناها حجم الخزان؛ مش اتنين فاصلة أربعة لتر لكل ساعة، وما نقدرش نستنتج مدة التشغيل منها وحدها.\n\nالأصل في صفحة ميتين كاتب خمسة حصان وأربعة كيلومتر لكل ساعة واتنين فاصلة تلاتة لتر لكل ساعة وتسعين كيلوجرام وأربعة إلى ستة ساعات لكل فدان لآلة عامة غير محددة. الأرقام دي مش مواصفات موثقة لـاس إي آر، وما ينفعش تحسب بيها فاتورة تشغيله. وكذلك قاعدة الأصل «ما يزيدش التشغيل المتصل عن ساعتين» مش مثبتة كحد مصنع لهذا الموديل. خطط للراحة والتبريد الآمن حسب الدليل الفعلي وحالة الجهاز والمدرّب والظروف، من غير حد زمني مخترع.'), ('في رسم دليل Honda المناسب لـFJ500-SER حدد محرك GX160 المبرد بالهوا، ذراع السرعة، مفتاح المحرك، ذراع القابض، ذراع النقل، غطاء السير، ضبط ارتفاع المقبض، الأسنان الدوّارة، قضبان السحب ومنقّي الهوا. المحرك يولد الدوران؛ قابض SER **من نوع شدّ السير** يتحكم فيه ذراعه، وناقل الحركة يختار الأمام أو الخلف الموثق قبل وصول الحركة للجزء الدوّار. ده شرح وظيفي للتعلم، مش خطوات تشغيل. ممكن تشبّه المحرك بالقلب والأسنان باليدين؛ القابض يوصل أو يفصل القدرة لكنه مش صندوق التروس. بطاقات الصورة والاسم تكون من نسخة SER فقط.\n\nرسم المدرّس العام فيه عجلات ضمن مسار الحركة. دليل Honda بيضع العجلة الأمامية لنسختَي **DE وDER** فقط، والجزء الدوّار **لـSER وDER**. ما ترسمش عجلة أمامية محركة لـSER. أسطوانات القابض الطردي والنحاس/الكربون، ودفع العجلات، وقدرة ٥ حصان، وتفاصيل قصة الشرارة في الأصل مش مثبتة لموديل SER. الدليل يذكر إشعالًا مغناطيسيًا ترانزستوريًا، مش التفاصيل الإضافية. الأسنان ممكن تبلى؛ الفحص والتبديل فقط بعد إيقاف المحرك ومنع التشغيل غير المقصود واتباع الدليل وإشراف المدرّب. ما تخترعش نوع صلب الأسنان أو ملحقًا لم يظهر في الجهاز الحقيقي.', 'في رسم دليل Honda المناسب لـإف جي خمسمية-اس إي آر حدد محرك جي إكس مية وستين المبرد بالهوا، ذراع السرعة، مفتاح المحرك، ذراع القابض، ذراع النقل، غطاء السير، ضبط ارتفاع المقبض، الأسنان الدوّارة، قضبان السحب ومنقّي الهوا. المحرك يولد الدوران؛ قابض اس إي آر من نوع شدّ السير يتحكم فيه ذراعه، وناقل الحركة يختار الأمام أو الخلف الموثق قبل وصول الحركة للجزء الدوّار. ده شرح وظيفي للتعلم، مش خطوات تشغيل. ممكن تشبّه المحرك بالقلب والأسنان باليدين؛ القابض يوصل أو يفصل القدرة لكنه مش صندوق التروس. بطاقات الصورة والاسم تكون من نسخة اس إي آر فقط.\n\nرسم المدرّس العام فيه عجلات ضمن مسار الحركة. دليل Honda بيضع العجلة الأمامية لنسختَي دي إي ودي إي آر فقط، والجزء الدوّار لـاس إي آر ودي إي آر. ما ترسمش عجلة أمامية محركة لـاس إي آر. أسطوانات القابض الطردي والنحاس، الكربون، ودفع العجلات، وقدرة خمسة حصان، وتفاصيل قصة الشرارة في الأصل مش مثبتة لموديل اس إي آر. الدليل يذكر إشعال مغناطيسيًا ترانزستوريًا، مش التفاصيل الإضافية. الأسنان ممكن تبلى؛ الفحص والتبديل فقط بعد إيقاف المحرك ومنع التشغيل غير المقصود واتباع الدليل وإشراف المدرّب. ما تخترعش نوع صلب الأسنان أو ملحقًا لم يظهر في الجهاز الحقيقي.'), ('قبل ما ترشح SER، قارن عرض الصف الحقيقي ومنطقة جذور المحصول بالجزء الدوّار والخلوص الآمن؛ افحص حجارة وأسلاك وميل الأرض وبلل التربة والرؤية والناس القريبين والحواجز والتدريب ومكان تشغيل مفتوح مناسب وخطر أول أكسيد الكربون. عزّاقة دوّارة عريضة ممكن ما تنفعش بين صفوف قريبة رغم وصف الأصل لها بأنها «للصفوف الضيقة». اختار نزع حشائش يدويًا أو أداة أصغر مناسبة أو أجل العمل لو مخاطرها أو تلف المحصول أكبر من فائدتها.\n\nالمشغّل يقرأ الدليل ويتبعه. السلامة تعني إيقاف ومنع تشغيل غير مقصود قبل فحص الأسنان وإبعاد الناس، وممنوع تشغيل محرك البنزين في صوبة مقفولة أو أي حيز مغلق، حسب منع دليل المصنع. الخطوة دي ما بتديش تصريح تشغيل. الخطوة الجاية للفحص والتشغيل تحت إشراف، وS3-15 للصيانة وحل الأعطال.\n\nالمصنع بيحذر إن العادم ممكن يتجمع في الأماكن المغلقة وحتى المغلقة جزئيًا. ما تشغّلش عزّاقة البنزين في حيز مغلق ممكن أول أكسيد الكربون يتجمع فيه. مثال الصوبة مش تصريح تشغيل جوه مكان مغلق، واقتراح مروحة أو ترتيب للعادم ما يثبتش الأمان.', 'قبل ما ترشح اس إي آر، قارن عرض الصف الحقيقي ومنطقة جذور المحصول بالجزء الدوّار والخلوص الآمن؛ افحص حجارة وأسلاك وميل الأرض وبلل التربة والرؤية والناس القريبين والحواجز والتدريب ومكان تشغيل مفتوح مناسب وخطر أول أكسيد الكربون. عزّاقة دوّارة عريضة ممكن ما تنفعش بين صفوف قريبة رغم وصف الأصل لها بأنها «للصفوف الضيقة». اختار نزع حشائش يدويًا أو أداة أصغر مناسبة أو أجل العمل لو مخاطرها أو تلف المحصول أكبر من فائدتها.\n\nالمشغّل يقرأ الدليل ويتبعه. السلامة تعني إيقاف ومنع تشغيل غير مقصود قبل فحص الأسنان وإبعاد الناس، وممنوع تشغيل محرك البنزين في صوبة مقفولة أو أي حيز مغلق، حسب منع دليل المصنع. الخطوة دي ما بتديش تصريح تشغيل. الخطوة الجاية للفحص والتشغيل تحت إشراف، والخطوة إس تلاتة خمستاشر للصيانة وحل الأعطال.\n\nالمصنع بيحذر إن العادم ممكن يتجمع في الأماكن المغلقة وحتى المغلقة جزئيًا. ما تشغّلش عزّاقة البنزين في حيز مغلق ممكن أول أكسيد الكربون يتجمع فيه. مثال الصوبة مش تصريح تشغيل جوه مكان مغلق، واقتراح مروحة أو ترتيب للعادم ما يثبتش الأمان.')], 'en': [("Before recommending SER, compare the real row spacing and crop-root zone with the actual working assembly and safe clearance; inspect stones, wire, field slope, soil wetness, visibility, people nearby, guards, training, an appropriate outdoor site and carbon-monoxide exposure. A broad rotary tiller may be inappropriate between close planted rows even when the source calls the machine a 'narrow-row weeder'. Choose hand weeding, a different appropriately sized tool or a delayed operation when hazards or crop damage outweigh the benefit.\n\nThe operator must read and follow the manual. Safety includes stopping and disabling unintended start before tine inspection, keeping people clear, and never running the gasoline engine in an enclosed greenhouse or other confined space, as prohibited by the manual. This lesson cannot certify operation. The next step addresses supervised pre-use and safe running; S3-15 addresses maintenance/troubleshooting.\n\nThe manufacturer warns that exhaust can accumulate in confined and even partially enclosed areas. Do not operate the gasoline tiller in a confined space where carbon monoxide can collect. A greenhouse example is not permission to run it indoors, and a proposed fan or exhaust arrangement does not establish safety.", "Before recommending S E R, compare the real row spacing and crop-root zone with the actual working assembly and safe clearance; inspect stones, wire, field slope, soil wetness, visibility, people nearby, guards, training, an appropriate outdoor site and carbon-monoxide exposure. A broad rotary tiller may be inappropriate between close planted rows even when the source calls the machine a 'narrow-row weeder'. Choose hand weeding, a different appropriately sized tool or a delayed operation when hazards or crop damage outweigh the benefit.\n\nThe operator must read and follow the manual. Safety includes stopping and disabling unintended start before tine inspection, keeping people clear, and never running the gasoline engine in an enclosed greenhouse or other confined space, as prohibited by the manual. This lesson cannot certify operation. The next step addresses supervised pre-use and safe running; step S three fifteen addresses maintenance, troubleshooting.\n\nThe manufacturer warns that exhaust can accumulate in confined and even partially enclosed areas. Do not operate the gasoline tiller in a confined space where carbon monoxide can collect. A greenhouse example is not permission to run it indoors, and a proposed fan or exhaust arrangement does not establish safety."), ("On the applicable Honda FJ500-SER manual drawing, identify the GX160 forced-air-cooled engine, throttle lever, engine switch, clutch lever, shift lever, belt cover, handlebar-height adjuster, rotary tines, drag bars and air cleaner. The engine provides rotation; the SER clutch is **belt-tension type**, controlled by its lever, and the transmission selects the documented forward or reverse state before power reaches the rotary. This is a functional description for study, not a hands-on operating sequence. The engine is like a heart and the tines like working hands; the clutch engages or disengages power, but it is not the gearbox itself. Make picture/name cards only from the applicable variant.\n\nThe original teacher diagram is generic and shows wheels in a power chain. The Honda manual's front wheel is labelled **DE and DER types**, while the rotary is labelled **SER and DER types**. Do not draw or label a powered front wheel as a SER part. The teacher's centrifugal cylinders/carbon-copper clutch, wheel drive, 5 HP rating and detailed ignition story are not confirmed SER facts. The manual identifies a transistor-magneto ignition but no basis for that extra story. Tines can wear; inspect/replace only under the manual's stopped-engine, anti-start and trainer conditions. Do not invent tine steel grade or the presence of a specific attachment on an unseen training machine.", "On the applicable Honda F J five hundred-S E R manual drawing, identify the G X one hundred sixty forced-air-cooled engine, throttle lever, engine switch, clutch lever, shift lever, belt cover, handlebar-height adjuster, rotary tines, drag bars and air cleaner. The engine provides rotation; the S E R clutch is belt-tension type, controlled by its lever, and the transmission selects the documented forward or reverse state before power reaches the rotary. This is a functional description for study, not a hands-on operating sequence. The engine is like a heart and the tines like working hands; the clutch engages or disengages power, but it is not the gearbox itself. Make picture, name cards only from the applicable variant.\n\nThe original teacher diagram is generic and shows wheels in a power chain. The Honda manual's front wheel is labelled D E and D E R types, while the rotary is labelled S E R and D E R types. Do not draw or label a powered front wheel as a S E R part. The teacher's centrifugal cylinders, carbon-copper clutch, wheel drive, five H P rating and detailed ignition story are not confirmed S E R facts. The manual identifies a transistor-magneto ignition but no basis for that extra story. Tines can wear; inspect, replace only under the manual's stopped-engine, anti-start and trainer conditions. Do not invent tine steel grade or the presence of a specific attachment on an unseen training machine."), ("One Egyptian feddan is 4,200 m² = 0.42 ha, or approximately 1.038 acres. One acre is about 4,047 m², so the teacher's one-acre discussion is roughly 0.964 feddan. A statement such as '4–6 hours per feddan', even if measured for another machine and field, expresses time per area, not a conversion of a feddan into different acreages. Never write 'one feddan = 1.04–1.56 acres' based on its 4–6 hours.\n\nFor a service job, obtain actual row lengths, cultivable width, obstacles, turns, soil moisture, transport/setup, measured work-time and measured or documented fuel consumption; separately budget repairs, labour, PPE, travel and local prices. Estimated cost = documented quantities × actual unit prices plus justified overhead. Without those inputs, show a calculation template or range of assumptions, not a profit promise or a false L/hour derived from tank size. Charging neighbouring small farms is a possible service project, not proof of a lower cost than every tractor or hand-work case.", "One Egyptian feddan is four thousand two hundred square metres equals zero point four two hectares, or approximately one point zero three eight acres. One acre is about four thousand forty-seven square metres, so the teacher's one-acre discussion is roughly zero point nine six four feddan. A statement such as 'four to six hours per feddan', even if measured for another machine and field, expresses time per area, not a conversion of a feddan into different acreages. Never write 'one feddan equals one point zero four to one point five six acres' based on its four to six hours.\n\nFor a service job, obtain actual row lengths, cultivable width, obstacles, turns, soil moisture, transport, setup, measured work-time and measured or documented fuel consumption; separately budget repairs, labour, P P E, travel and local prices. Estimated cost equals documented quantities multiplied by actual unit prices plus justified overhead. Without those inputs, show a calculation template or range of assumptions, not a profit promise or a false litres per hour derived from tank size. Charging neighbouring small farms is a possible service project, not proof of a lower cost than every tractor or hand-work case."), ("The manufacturer's FJ500 manual has a column for SER. It identifies the GX160 163 cm³ four-stroke forced-air-cooled engine, transistor-magneto ignition, belt-tension clutch, one forward/one reverse transmission, 57 kg dry mass and 2.4 L fuel-tank capacity for SER. Check the exact specimen/serial and current manual before use. A 2.4 L tank holds up to a volume of fuel; it is **not** a rate in L/hour and cannot tell us running duration on its own.\n\nTeacher p. 200 records 5 HP, 4 km/h, 2.3 L/hour, 90 kg, and 4–6 hours per feddan for an unspecified generic weeder. They are not verified SER specifications and cannot support an SER operating bill. Likewise, the teacher's universal 'no more than two hours continuously' note is not a manufacturer SER rule. Plan safe rest/cooling and follow the actual manual, machine condition, trainer and working conditions rather than substituting an unsupported time limit.", "The manufacturer's F J five hundred manual has a column for S E R. It identifies the G X one hundred sixty, a one hundred sixty-three cubic centimetre four-stroke forced-air-cooled engine, transistor-magneto ignition, belt-tension clutch, one forward, one reverse transmission, fifty-seven kilograms dry mass and two point four litres fuel-tank capacity for S E R. Check the exact specimen, serial and current manual before use. A two point four litre tank holds up to a volume of fuel; it is not a rate in litres per hour and cannot tell us running duration on its own.\n\nTeacher p. two hundred records five H P, four kilometres per hour, two point three litres per hour, ninety kilograms, and four to six hours per feddan for an unspecified generic weeder. They are not verified S E R specifications and cannot support an S E R operating bill. Likewise, the teacher's universal 'no more than two hours continuously' note is not a manufacturer S E R rule. Plan safe rest, cooling and follow the actual manual, machine condition, trainer and working conditions rather than substituting an unsupported time limit."), ('The original topic estimates 90 minutes: 45 minutes of theory and 45 minutes of practical workshop. Across the topic, learners identify parts, explain benefits, operate safely, maintain and troubleshoot. This step covers knowledge and choice; later steps require an individually observed safe machine cycle and maintenance. Watching a demonstration or passing this quiz does not authorize operation. A trainer must match the actual model, its condition, instructions and local operator requirements.\n\nTillage is mechanical soil disturbance; aeration is the movement/exchange of air around roots; agronomic refers to crop/soil practice. An Egyptian feddan is an area unit. A clutch connects or disconnects power transfer to working parts. The air cleaner protects the engine air intake; PPE means suitable personal protective equipment. These names need function, not memorization alone. Weeds compete with crops for water, nutrients and light; removing them may help a crop but does not guarantee yield.', 'The original topic estimates ninety minutes: forty-five minutes of theory and forty-five minutes of practical workshop. Across the topic, learners identify parts, explain benefits, operate safely, maintain and troubleshoot. This step covers knowledge and choice; later steps require an individually observed safe machine cycle and maintenance. Watching a demonstration or passing this quiz does not authorize operation. A trainer must match the actual model, its condition, instructions and local operator requirements.\n\nTillage is mechanical soil disturbance; aeration is the movement, exchange of air around roots; agronomic refers to crop, soil practice. An Egyptian feddan is an area unit. A clutch connects or disconnects power transfer to working parts. The air cleaner protects the engine air intake; P P E means suitable personal protective equipment. These names need function, not memorization alone. Weeds compete with crops for water, nutrients and light; removing them may help a crop but does not guarantee yield.'), ("The teacher source describes a compact walk-behind narrow-row weeder with rotating blades/tines that cut or bury weeds and loosen a shallow soil layer. Honda names the selected FJ500-SER a tiller. A particular attachment or row-weeding job is possible only if its actual working width, row spacing, root clearance, covers, operator path and ground conditions permit it. The manual warns against hard stones, wires and other hazards; the gasoline engine releases carbon monoxide, and the manufacturer prohibits running it in a confined space, including an enclosed greenhouse.\n\nPotential advantages are less hand-weeding labour, reduced weed competition, some light surface aeration, light seedbed preparation and conditional incorporation with the appropriate implement. These are not guaranteed savings or soil-structure improvements. Repeated tillage or travel on wet soil can damage structure and compound compaction. For the teacher's 1-acre choice, compare labour availability, fixed/running cost, transport, crop and soil damage, access and risk against hand work or another weed-control method. One acre is not exactly one Egyptian feddan.", "The teacher source describes a compact walk-behind narrow-row weeder with rotating blades, tines that cut or bury weeds and loosen a shallow soil layer. Honda names the selected F J five hundred-S E R a tiller. A particular attachment or row-weeding job is possible only if its actual working width, row spacing, root clearance, covers, operator path and ground conditions permit it. The manual warns against hard stones, wires and other hazards; the gasoline engine releases carbon monoxide, and the manufacturer prohibits running it in a confined space, including an enclosed greenhouse.\n\nPotential advantages are less hand-weeding labour, reduced weed competition, some light surface aeration, light seedbed preparation and conditional incorporation with the appropriate implement. These are not guaranteed savings or soil-structure improvements. Repeated tillage or travel on wet soil can damage structure and compound compaction. For the teacher's one-acre choice, compare labour availability, fixed, running cost, transport, crop and soil damage, access and risk against hand work or another weed-control method. One acre is not exactly one Egyptian feddan."), ('Try naming the function before using the part card, then explain it to a partner. Compare three benefits and the one-acre choice. The original topic allocates 90 minutes across 45 minutes theory and 45 minutes practical; those topic times are not separate durations for each of the three steps. Actual operation and maintenance remain in their supervised steps.', 'Try naming the function before using the part card, then explain it to a partner. Compare three benefits and the one-acre choice. The original topic allocates ninety minutes across forty-five minutes theory and forty-five minutes practical; those topic times are not separate durations for each of the three steps. Actual operation and maintenance remain in their supervised steps.')], 'it': [('Il tema originale stima 90 minuti: 45 di teoria e 45 di laboratorio. Nel tema completo gli allievi identificano parti e benefici, poi operano, mantengono e ricercano guasti. Qui si valutano conoscenza e scelta; le fasi successive richiedono ciclo sicuro e manutenzione osservati individualmente. Una dimostrazione o un quiz non autorizzano l’uso. Il formatore deve verificare modello reale, stato, istruzioni e requisiti locali per l’operatore.\n\nLavorazione significa disturbo meccanico del suolo; aerazione significa movimento e scambio d’aria presso le radici; agronomico riguarda coltura e suolo. Il feddan egiziano misura area. La frizione collega o scollega potenza agli organi di lavoro. Il filtro aria protegge l’aspirazione del motore; DPI sono protezioni personali appropriate. Servono funzioni, non soli nomi. Le infestanti competono per acqua, nutrienti e luce; eliminarle può aiutare ma non garantisce produzione.', 'Il tema originale stima novanta minuti: quarantacinque di teoria e quarantacinque di laboratorio. Nel tema completo gli allievi identificano parti e benefici, poi operano, mantengono e ricercano guasti. Qui si valutano conoscenza e scelta; le fasi successive richiedono ciclo sicuro e manutenzione osservati individualmente. Una dimostrazione o un quiz non autorizzano l’uso. Il formatore deve verificare modello reale, stato, istruzioni e requisiti locali per l’operatore.\n\nLavorazione significa disturbo meccanico del suolo; aerazione significa movimento e scambio d’aria presso le radici; agronomico riguarda coltura e suolo. Il feddan egiziano misura area. La frizione collega o scollega potenza agli organi di lavoro. Il filtro aria protegge l’aspirazione del motore; di pi i sono protezioni personali appropriate. Servono funzioni, non soli nomi. Le infestanti competono per acqua, nutrienti e luce; eliminarle può aiutare ma non garantisce produzione.'), ('La fonte docente descrive un mezzo compatto per file strette con lame o denti rotanti che tagliano o interrano infestanti e smuovono uno strato superficiale. Honda chiama FJ500-SER una motozappa. Lavorare davvero fra file dipende da larghezza effettiva, distanza, spazio dalle radici, coperture, percorso dell’operatore e suolo. Il manuale avverte di pietre, fili e altri pericoli; il motore a benzina emette monossido di carbonio e il manuale vieta di farlo funzionare in uno spazio confinato, compresa una serra chiusa.\n\nVantaggi possibili: meno lavoro a mano, minore competizione delle infestanti, lieve aerazione superficiale, preparazione leggera del letto e incorporazione condizionata con attrezzo adatto. Non sono risparmi o miglioramenti strutturali garantiti. Lavorazioni ripetute o passaggi su bagnato possono danneggiare la struttura e aggravare compattazione. Per il caso di 1 acre confronta manodopera, costi fissi e correnti, trasporto, danni a coltura e suolo, accesso e rischi con lavoro manuale o altri metodi. Un acre non è un feddan egiziano.', 'La fonte docente descrive un mezzo compatto per file strette con lame o denti rotanti che tagliano o interrano infestanti e smuovono uno strato superficiale. Honda chiama effe i cinquecento-esse e erre una motozappa. Lavorare davvero fra file dipende da larghezza effettiva, distanza, spazio dalle radici, coperture, percorso dell’operatore e suolo. Il manuale avverte di pietre, fili e altri pericoli; il motore a benzina emette monossido di carbonio e il manuale vieta di farlo funzionare in uno spazio confinato, compresa una serra chiusa.\n\nVantaggi possibili: meno lavoro a mano, minore competizione delle infestanti, lieve aerazione superficiale, preparazione leggera del letto e incorporazione condizionata con attrezzo adatto. Non sono risparmi o miglioramenti strutturali garantiti. Lavorazioni ripetute o passaggi su bagnato possono danneggiare la struttura e aggravare compattazione. Per il caso di uno acre confronta manodopera, costi fissi e correnti, trasporto, danni a coltura e suolo, accesso e rischi con lavoro manuale o altri metodi. Un acre non è un feddan egiziano.'), ('La tabella Honda per SER indica motore GX160 a quattro tempi da 163 cm³ raffreddato ad aria forzata, accensione a magnete transistor, frizione a tensione di cinghia, una marcia avanti e una retro, massa secca 57 kg e serbatoio 2,4 L. Prima dell’uso controlla esemplare, numero di serie e manuale aggiornato. Un serbatoio da 2,4 L contiene un volume: **non** è un consumo in L/ora e da solo non dà autonomia.\n\nIl docente p.200 riporta 5 HP, 4 km/h, 2,3 L/ora, 90 kg e 4–6 ore per feddan per una macchina generica non specificata. Questi dati non sono specifiche SER verificate e non consentono di calcolare i costi di esercizio. Anche «massimo due ore continuative» non è regola del costruttore confermata per SER. Organizza pause e raffreddamento seguendo manuale reale, stato della macchina, formatore e condizioni, senza limite universale inventato.', 'La tabella Honda per esse e erre indica motore gi ics centosessanta a quattro tempi da centosessantatré centimetri cubi raffreddato ad aria forzata, accensione a magnete transistor, frizione a tensione di cinghia, una marcia avanti e una retro, massa secca cinquantasette chilogrammi e serbatoio due virgola quattro litri. Prima dell’uso controlla esemplare, numero di serie e manuale aggiornato. Un serbatoio da due virgola quattro litri contiene un volume: non è un consumo in litri all’ora e da solo non dà autonomia.\n\nIl docente pagina duecento riporta cinque acca pi, quattro chilometri orari, due virgola tre litri all’ora, novanta chilogrammi e quattro a sei ore per feddan per una macchina generica non specificata. Questi dati non sono specifiche esse e erre verificate e non consentono di calcolare i costi di esercizio. Anche «massimo due ore continuative» non è regola del costruttore confermata per esse e erre. Organizza pause e raffreddamento seguendo manuale reale, stato della macchina, formatore e condizioni, senza limite universale inventato.'), ('Prima di consigliare SER confronta distanza fra file e zona radicale con rotore reale e spazio di sicurezza; controlla pietre, fili, pendio, bagnato, visibilità, persone, protezioni, formazione, sito adatto all’aperto ed esposizione al monossido di carbonio. Una motozappa larga può non stare fra file fitte anche se la fonte la chiama mezzo per file strette. Scegli estirpazione manuale, attrezzo più adatto o rinvio se rischio o danno alla coltura superano il beneficio.\n\nL’operatore deve leggere e seguire il manuale. Arresta e impedisci avvio involontario prima di ispezionare i denti, tieni lontane persone e non far funzionare il motore a benzina in una serra chiusa o in un altro spazio confinato, come vietato dal manuale. Questa fase non abilita a usare il mezzo. S3-14 copre controlli e funzionamento supervisionati e S3-15 manutenzione/guasti.\n\nIl costruttore avverte che i gas di scarico possono accumularsi in spazi confinati e persino parzialmente chiusi. Non far funzionare la motozappa a benzina in uno spazio confinato dove il monossido di carbonio può accumularsi. Un esempio in serra non autorizza l’uso al chiuso e un ventilatore o una soluzione di scarico proposti non dimostrano la sicurezza.', 'Prima di consigliare esse e erre confronta distanza fra file e zona radicale con rotore reale e spazio di sicurezza; controlla pietre, fili, pendio, bagnato, visibilità, persone, protezioni, formazione, sito adatto all’aperto ed esposizione al monossido di carbonio. Una motozappa larga può non stare fra file fitte anche se la fonte la chiama mezzo per file strette. Scegli estirpazione manuale, attrezzo più adatto o rinvio se rischio o danno alla coltura superano il beneficio.\n\nlitri’operatore deve leggere e seguire il manuale. Arresta e impedisci avvio involontario prima di ispezionare i denti, tieni lontane persone e non far funzionare il motore a benzina in una serra chiusa o in un altro spazio confinato, come vietato dal manuale. Questa fase non abilita a usare il mezzo. passo esse tre quattordici copre controlli e funzionamento supervisionati e passo esse tre quindici manutenzione, guasti.\n\nIl costruttore avverte che i gas di scarico possono accumularsi in spazi confinati e persino parzialmente chiusi. Non far funzionare la motozappa a benzina in uno spazio confinato dove il monossido di carbonio può accumularsi. Un esempio in serra non autorizza l’uso al chiuso e un ventilatore o una soluzione di scarico proposti non dimostrano la sicurezza.'), ('Prova a nominare la funzione prima di usare la scheda della parte, poi spiegala a un compagno. Confronta tre benefici e la scelta per un acre. L’argomento originale prevede 90 minuti: 45 di teoria e 45 di pratica; questi tempi riguardano l’argomento, non sono durate separate per ciascuno dei tre passi. Uso e manutenzione reali restano nei rispettivi passi supervisionati.', 'Prova a nominare la funzione prima di usare la scheda della parte, poi spiegala a un compagno. Confronta tre benefici e la scelta per un acre. litri’argomento originale prevede novanta minuti: quarantacinque di teoria e quarantacinque di pratica; questi tempi riguardano l’argomento, non sono durate separate per ciascuno dei tre passi. Uso e manutenzione reali restano nei rispettivi passi supervisionati.'), ('Sul disegno Honda FJ500-SER identifica motore GX160 raffreddato ad aria, leva acceleratore, interruttore motore, leva frizione, leva cambio, copertura cinghia, regolatore altezza manubrio, denti rotanti, barre di trascinamento e filtro aria. Il motore dà rotazione; la frizione SER è **a tensione di cinghia** azionata dalla leva, mentre il cambio seleziona avanti o retro prima del rotore. È descrizione funzionale didattica, non sequenza d’avvio. Il motore è come il cuore e i denti come mani; la frizione innesta la potenza ma non è il cambio. Crea schede solo dalle parti della variante corretta.\n\nIl diagramma docente è generico e mette ruote nel percorso. Honda indica la ruota anteriore solo per **DE e DER**, mentre il rotore riguarda **SER e DER**. Non disegnare una ruota anteriore motrice SER. Cilindri centrifughi carbonio/rame, azionamento delle ruote, 5 HP e storia dettagliata dell’accensione della fonte non sono fatti confermati SER. Il manuale cita accensione a magnete transistor, non gli altri dettagli. I denti si usurano: ispezione/sostituzione solo dopo arresto, prevenzione di avvio involontario e indicazioni di manuale/formatore. Non inventare acciaio o accessori non visti sulla macchina reale.', 'Sul disegno Honda effe i cinquecento-esse e erre identifica motore gi ics centosessanta raffreddato ad aria, leva acceleratore, interruttore motore, leva frizione, leva cambio, copertura cinghia, regolatore altezza manubrio, denti rotanti, barre di trascinamento e filtro aria. Il motore dà rotazione; la frizione esse e erre è a tensione di cinghia azionata dalla leva, mentre il cambio seleziona avanti o retro prima del rotore. È descrizione funzionale didattica, non sequenza d’avvio. Il motore è come il cuore e i denti come mani; la frizione innesta la potenza ma non è il cambio. Crea schede solo dalle parti della variante corretta.\n\nIl diagramma docente è generico e mette ruote nel percorso. Honda indica la ruota anteriore solo per di e e di e erre, mentre il rotore riguarda esse e erre e di e erre. Non disegnare una ruota anteriore motrice esse e erre. Cilindri centrifughi carbonio, rame, azionamento delle ruote, cinque acca pi e storia dettagliata dell’accensione della fonte non sono fatti confermati esse e erre. Il manuale cita accensione a magnete transistor, non gli altri dettagli. I denti si usurano: ispezione, sostituzione solo dopo arresto, prevenzione di avvio involontario e indicazioni di manuale, formatore. Non inventare acciaio o accessori non visti sulla macchina reale.'), ('Un feddan egiziano corrisponde a 4.200 m² = 0,42 ha, ossia circa 1,038 acre. Un acre è circa 4.047 m²: il campo da 1 acre della fonte equivale a circa 0,964 feddan. «4–6 ore per feddan», persino se misurate per altra macchina e terreno, sono tempo per superficie, non conversione dell’area in acre. Non scrivere «un feddan = 1,04–1,56 acre» in base alle ore.\n\nPer una prestazione chiedi lunghezze delle file, larghezza realmente coltivabile, ostacoli, svolte, umidità, trasporto/montaggio, tempo misurato e consumo orario misurato o documentato; separa manutenzione, lavoro, DPI, viaggio e prezzi locali. Costo stimato = quantità documentate × prezzi unitari reali più spese motivate. Senza dati usa un modello di calcolo con ipotesi, non profitto promesso o L/ora ricavati dal serbatoio. Servire piccoli vicini è possibile, non prova costi minori in ogni caso di trattore o lavoro manuale.', 'Un feddan egiziano corrisponde a quattromiladuecento metri quadrati uguale a zero virgola quattro due ettari, ossia circa uno virgola zero tre otto acre. Un acre è circa quattromilaquarantasette metri quadrati: il campo da uno acre della fonte equivale a circa zero virgola nove sei quattro feddan. «quattro a sei ore per feddan», persino se misurate per altra macchina e terreno, sono tempo per superficie, non conversione dell’area in acre. Non scrivere «un feddan uguale a uno virgola zero quattro a uno virgola cinque sei acre» in base alle ore.\n\nPer una prestazione chiedi lunghezze delle file, larghezza realmente coltivabile, ostacoli, svolte, umidità, trasporto, montaggio, tempo misurato e consumo orario misurato o documentato; separa manutenzione, lavoro, di pi i, viaggio e prezzi locali. Costo stimato uguale a quantità documentate moltiplicato per prezzi unitari reali più spese motivate. Senza dati usa un modello di calcolo con ipotesi, non profitto promesso o litri all’ora ricavati dal serbatoio. Servire piccoli vicini è possibile, non prova costi minori in ogni caso di trattore o lavoro manuale.')], 'de': [('Das Originalthema veranschlagt 90 Minuten: 45 Minuten Theorie und 45 Minuten Praxis. Über das Thema hinweg sollen Lernende Teile und Nutzen erkennen, sicher bedienen, warten und Störungen beurteilen. Dieser Schritt behandelt Wissen und Wahl; spätere Schritte erfordern individuell beobachteten sicheren Betrieb und Wartung. Vorführung oder Quiz geben keine Bedienfreigabe. Die Lehrkraft muss tatsächliches Modell, Zustand, Anweisungen und örtliche Anforderungen vergleichen.\n\nBodenbearbeitung ist mechanische Störung des Bodens; Belüftung ist Luftaustausch bei den Wurzeln; pflanzenbaulich bezieht sich auf Kultur und Boden. Der ägyptische Feddan ist eine Flächeneinheit. Die Kupplung verbindet oder trennt Kraft zu den Arbeitsteilen. Der Luftfilter schützt den Motoreinlass; PSA sind passende persönliche Schutzmittel. Die Funktion zählt, nicht nur der Name. Unkraut konkurriert um Wasser, Nährstoffe und Licht; Entfernen kann helfen, garantiert aber keinen Ertrag.', 'Das Originalthema veranschlagt neunzig Minuten: fünfundvierzig Minuten Theorie und fünfundvierzig Minuten Praxis. Über das Thema hinweg sollen Lernende Teile und Nutzen erkennen, sicher bedienen, warten und Störungen beurteilen. Dieser Schritt behandelt Wissen und Wahl; spätere Schritte erfordern individuell beobachteten sicheren Betrieb und Wartung. Vorführung oder Quiz geben keine Bedienfreigabe. Die Lehrkraft muss tatsächliches Modell, Zustand, Anweisungen und örtliche Anforderungen vergleichen.\n\nBodenbearbeitung ist mechanische Störung des Bodens; Belüftung ist Luftaustausch bei den Wurzeln; pflanzenbaulich bezieht sich auf Kultur und Boden. Der ägyptische Feddan ist eine Flächeneinheit. Die Kupplung verbindet oder trennt Kraft zu den Arbeitsteilen. Der Luftfilter schützt den Motoreinlass; Pe Es A sind passende persönliche Schutzmittel. Die Funktion zählt, nicht nur der Name. Unkraut konkurriert um Wasser, Nährstoffe und Licht; Entfernen kann helfen, garantiert aber keinen Ertrag.'), ('Die Honda-Tabelle hat eine SER-Spalte: GX160, 163 cm³ luftgekühlter Viertaktmotor, Transistor-Magnetzündung, Riemenspannkupplung, ein Vorwärts- und ein Rückwärtsgang, 57 kg Trockenmasse und 2,4 L Tankinhalt. Vor Verwendung tatsächliches Gerät, Seriennummer und aktuelles Handbuch prüfen. Der 2,4-L-Tank fasst ein Kraftstoffvolumen; er ist **kein** Verbrauch in L/Stunde und verrät allein keine Laufzeit.\n\nLehrerseite 200 nennt 5 HP, 4 km/h, 2,3 L/Stunde, 90 kg und 4–6 Stunden je Feddan für ein nicht spezifiziertes allgemeines Gerät. Diese Angaben sind keine bestätigten SER-Spezifikationen und erlauben keine Betriebskostenberechnung. Ebenso ist „höchstens zwei Stunden am Stück“ keine bestätigte Herstellerregel für SER. Pausen und Abkühlung nach realem Handbuch, Zustand, Lehrkraft und Bedingungen planen, ohne unbelegtes allgemeines Zeitlimit.', 'Die Honda-Tabelle hat eine Es E Er-Spalte: Ge Iks einhundertsechzig, einhundertdreiundsechzig Kubikzentimeter luftgekühlter Viertaktmotor, Transistor-Magnetzündung, Riemenspannkupplung, ein Vorwärts- und ein Rückwärtsgang, siebenundfünfzig Kilogramm Trockenmasse und zwei Komma vier Liter Tankinhalt. Vor Verwendung tatsächliches Gerät, Seriennummer und aktuelles Handbuch prüfen. Der zwei Komma vier-Liter-Tank fasst ein Kraftstoffvolumen; er ist kein Verbrauch in Liter pro Stunde und verrät allein keine Laufzeit.\n\nLehrerseite zweihundert nennt fünf Ha Pe, vier Kilometer pro Stunde, zwei Komma drei Liter pro Stunde, neunzig Kilogramm und vier bis sechs Stunden je Feddan für ein nicht spezifiziertes allgemeines Gerät. Diese Angaben sind keine bestätigten Es E Er-Spezifikationen und erlauben keine Betriebskostenberechnung. Ebenso ist „höchstens zwei Stunden am Stück“ keine bestätigte Herstellerregel für Es E Er. Pausen und Abkühlung nach realem Handbuch, Zustand, Lehrkraft und Bedingungen planen, ohne unbelegtes allgemeines Zeitlimit.'), ('Die Lehrquelle schildert ein kompaktes Gerät für enge Reihen mit rotierenden Messern/Zinken, das Unkraut schneidet oder vergräbt und oberflächlichen Boden lockert. Honda bezeichnet FJ500-SER als Bodenfräse. Einsatz zwischen konkreten Reihen setzt tatsächliche Arbeitsbreite, Reihen- und Wurzelabstand, Abdeckung, sicheren Bedienweg und Bodenverhältnisse voraus. Das Handbuch warnt vor Steinen, Drähten und Gefahren; der Benzinmotor stößt Kohlenmonoxid aus. Das Handbuch untersagt den Betrieb in geschlossenen Räumen, in denen sich Abgase sammeln können; auch teilweise umschlossene Bereiche sind gefährlich.\n\nMögliche Vorteile: weniger Handjätarbeit, weniger Unkrautkonkurrenz, leichte Oberflächenbelüftung, flache Saatbettbereitung oder bedingtes Einarbeiten mit geeignetem Werkzeug. Einsparungen und Gefügeverbesserungen sind nicht garantiert. Wiederholtes Fräsen oder Verkehr auf nassem Boden kann Gefüge und Verdichtung verschlechtern. Vergleiche für den 1-Acre-Fall Arbeit, feste/laufende Kosten, Transport, Kultur- und Bodenschäden, Zugang und Risiko mit Handarbeit oder anderer Methode. Ein Acre ist nicht ein ägyptischer Feddan.', 'Die Lehrquelle schildert ein kompaktes Gerät für enge Reihen mit rotierenden Messern, Zinken, das Unkraut schneidet oder vergräbt und oberflächlichen Boden lockert. Honda bezeichnet Ef Jot fünfhundert-Es E Er als Bodenfräse. Einsatz zwischen konkreten Reihen setzt tatsächliche Arbeitsbreite, Reihen- und Wurzelabstand, Abdeckung, sicheren Bedienweg und Bodenverhältnisse voraus. Das Handbuch warnt vor Steinen, Drähten und Gefahren; der Benzinmotor stößt Kohlenmonoxid aus. Das Handbuch untersagt den Betrieb in geschlossenen Räumen, in denen sich Abgase sammeln können; auch teilweise umschlossene Bereiche sind gefährlich.\n\nMögliche Vorteile: weniger Handjätarbeit, weniger Unkrautkonkurrenz, leichte Oberflächenbelüftung, flache Saatbettbereitung oder bedingtes Einarbeiten mit geeignetem Werkzeug. Einsparungen und Gefügeverbesserungen sind nicht garantiert. Wiederholtes Fräsen oder Verkehr auf nassem Boden kann Gefüge und Verdichtung verschlechtern. Vergleiche für den eins-Acre-Fall Arbeit, feste, laufende Kosten, Transport, Kultur- und Bodenschäden, Zugang und Risiko mit Handarbeit oder anderer Methode. Ein Acre ist nicht ein ägyptischer Feddan.'), ('Ein ägyptischer Feddan entspricht 4.200 m² = 0,42 ha, also ungefähr 1,038 Acre. Ein Acre hat etwa 4.047 m²; der 1-Acre-Fall der Quelle entspricht ungefähr 0,964 Feddan. „4–6 Stunden/Feddan“ wäre selbst nach Messung an einem anderen Gerät Zeit pro Fläche, keine Umrechnung in Acre. Schreibe nicht „ein Feddan = 1,04–1,56 Acre“ aus einer Stundenangabe.\n\nFür einen Auftrag ermittle echte Reihenlängen, nutzbare Breite, Hindernisse, Wendungen, Bodenfeuchte, Transport/Rüsten, gemessene Arbeitszeit und belegten Kraftstoffverbrauch; zusätzlich Reparaturen, Arbeit, PSA, Reise und örtliche Preise. Kalkulation = belegte Mengen × echte Einheitspreise plus begründete Kosten. Ohne Daten nur Rechenschema und gekennzeichnete Annahmen, weder Gewinnversprechen noch Liter pro Stunde aus Tankgröße. Dienstleistung für kleine Nachbarhöfe ist möglich, aber nicht in jedem Fall günstiger als Traktor oder Handarbeit.', 'Ein ägyptischer Feddan entspricht viertausendzweihundert Quadratmeter gleich null Komma vier zwei Hektar, also ungefähr eins Komma null drei acht Acre. Ein Acre hat etwa viertausendsiebenundvierzig Quadratmeter; der eins-Acre-Fall der Quelle entspricht ungefähr null Komma neun sechs vier Feddan. „vier bis sechs Stunden pro Feddan“ wäre selbst nach Messung an einem anderen Gerät Zeit pro Fläche, keine Umrechnung in Acre. Schreibe nicht „ein Feddan gleich eins Komma null vier bis eins Komma fünf sechs Acre“ aus einer Stundenangabe.\n\nFür einen Auftrag ermittle echte Reihenlängen, nutzbare Breite, Hindernisse, Wendungen, Bodenfeuchte, Transport, Rüsten, gemessene Arbeitszeit und belegten Kraftstoffverbrauch; zusätzlich Reparaturen, Arbeit, Pe Es A, Reise und örtliche Preise. Kalkulation gleich belegte Mengen mal echte Einheitspreise plus begründete Kosten. Ohne Daten nur Rechenschema und gekennzeichnete Annahmen, weder Gewinnversprechen noch Liter pro Stunde aus Tankgröße. Dienstleistung für kleine Nachbarhöfe ist möglich, aber nicht in jedem Fall günstiger als Traktor oder Handarbeit.'), ('In der zutreffenden Honda-FJ500-SER-Zeichnung findest du luftgekühlten GX160-Motor, Gashebel, Motorschalter, Kupplungshebel, Schalthebel, Riemenabdeckung, Griffhöhenverstellung, Fräszinken, Schleppstangen und Luftfilter. Der Motor liefert Drehung; die SER-Kupplung ist eine **Riemenspannkupplung**, die mit dem Hebel gesteuert wird, und das Getriebe wählt dokumentiertes Vorwärts oder Rückwärts vor dem Rotor. Das ist eine funktionale Lehrbeschreibung, keine Startfolge. Motor wie Herz und Zinken wie Hände sind Merkhilfen; Kupplung und Getriebe sind verschieden. Bildkarten nur für die passende Variante erstellen.\n\nDie allgemeine Lehrgrafik zeigt Räder im Kraftweg. Honda kennzeichnet das Vorderrad nur für **DE und DER**, den Rotor für **SER und DER**. Kein angetriebenes SER-Vorderrad zeichnen. Fliehkraftzylinder aus Kohlenstoff/Kupfer, Radantrieb, 5 HP und die ausführliche Zündgeschichte der Quelle sind keine belegten SER-Daten. Das Handbuch nennt Transistor-Magnetzündung, nicht die Zusatzgeschichte. Zinken verschleißen; Kontrolle/Wechsel nur nach Motorstopp, Verhinderung unbeabsichtigten Starts und unter Handbuch/Lehrkraft. Weder Stahlgüte noch ungesehenes Anbaugerät erfinden.', 'In der zutreffenden Honda-Ef Jot fünfhundert-Es E Er-Zeichnung findest du luftgekühlten Ge Iks einhundertsechzig-Motor, Gashebel, Motorschalter, Kupplungshebel, Schalthebel, Riemenabdeckung, Griffhöhenverstellung, Fräszinken, Schleppstangen und Luftfilter. Der Motor liefert Drehung; die Es E Er-Kupplung ist eine Riemenspannkupplung, die mit dem Hebel gesteuert wird, und das Getriebe wählt dokumentiertes Vorwärts oder Rückwärts vor dem Rotor. Das ist eine funktionale Lehrbeschreibung, keine Startfolge. Motor wie Herz und Zinken wie Hände sind Merkhilfen; Kupplung und Getriebe sind verschieden. Bildkarten nur für die passende Variante erstellen.\n\nDie allgemeine Lehrgrafik zeigt Räder im Kraftweg. Honda kennzeichnet das Vorderrad nur für De E und De E Er, den Rotor für Es E Er und De E Er. Kein angetriebenes Es E Er-Vorderrad zeichnen. Fliehkraftzylinder aus Kohlenstoff, Kupfer, Radantrieb, fünf Ha Pe und die ausführliche Zündgeschichte der Quelle sind keine belegten Es E Er-Daten. Das Handbuch nennt Transistor-Magnetzündung, nicht die Zusatzgeschichte. Zinken verschleißen; Kontrolle, Wechsel nur nach Motorstopp, Verhinderung unbeabsichtigten Starts und unter Handbuch, Lehrkraft. Weder Stahlgüte noch ungesehenes Anbaugerät erfinden.'), ('Versuche zuerst, die Funktion ohne Bauteilkarte zu benennen, und erkläre sie dann einer Partnerperson. Vergleiche drei Vorteile und die Entscheidung für einen Acre. Das ursprüngliche Thema umfasst 90 Minuten: 45 Minuten Theorie und 45 Minuten Praxis; dies sind Themenzeiten, keine eigenen Zeitvorgaben für jeden der drei Schritte. Tatsächliche Bedienung und Wartung bleiben ihren betreuten Schritten vorbehalten.', 'Versuche zuerst, die Funktion ohne Bauteilkarte zu benennen, und erkläre sie dann einer Partnerperson. Vergleiche drei Vorteile und die Entscheidung für einen Acre. Das ursprüngliche Thema umfasst neunzig Minuten: fünfundvierzig Minuten Theorie und fünfundvierzig Minuten Praxis; dies sind Themenzeiten, keine eigenen Zeitvorgaben für jeden der drei Schritte. Tatsächliche Bedienung und Wartung bleiben ihren betreuten Schritten vorbehalten.'), ('Vor einer SER-Empfehlung echten Reihenabstand und Wurzelzone mit Fräseinheit und Sicherheitsabstand vergleichen; Steine, Draht, Hang, Nässe, Sicht, Menschen, Schutz, Ausbildung, geeigneten Betriebsort im Freien und Kohlenmonoxidrisiko prüfen. Eine breite Fräse kann für dicht bepflanzte Reihen ungeeignet sein, selbst wenn die Quelle „Schmalreihengerät“ sagt. Handjäten, kleineres passendes Werkzeug oder Aufschub wählen, wenn Gefahr oder Pflanzenschaden den Nutzen übersteigen.\n\nBedienende müssen das Handbuch lesen und beachten. Vor Zinkenkontrolle stoppen und unbeabsichtigtes Starten verhindern, Personen fernhalten und den Benzinmotor niemals in einem geschlossenen Gewächshaus oder anderen geschlossenen Raum betreiben, wie es das Handbuch untersagt. Diese Lektion bescheinigt keine Bedienung. S3-14 behandelt angeleitete Vorprüfung und Betrieb, S3-15 Wartung und Fehlersuche.\n\nDer Hersteller warnt vor Abgasansammlung in geschlossenen und sogar teilweise umschlossenen Bereichen. Die Benzinfräse nicht in einem geschlossenen Raum betreiben, in dem sich Kohlenmonoxid ansammeln kann. Ein Gewächshausbeispiel ist keine Erlaubnis für Innenbetrieb; ein vorgeschlagener Ventilator oder eine Abgaslösung belegt keine Sicherheit.', 'Vor einer Es E Er-Empfehlung echten Reihenabstand und Wurzelzone mit Fräseinheit und Sicherheitsabstand vergleichen; Steine, Draht, Hang, Nässe, Sicht, Menschen, Schutz, Ausbildung, geeigneten Betriebsort im Freien und Kohlenmonoxidrisiko prüfen. Eine breite Fräse kann für dicht bepflanzte Reihen ungeeignet sein, selbst wenn die Quelle „Schmalreihengerät“ sagt. Handjäten, kleineres passendes Werkzeug oder Aufschub wählen, wenn Gefahr oder Pflanzenschaden den Nutzen übersteigen.\n\nBedienende müssen das Handbuch lesen und beachten. Vor Zinkenkontrolle stoppen und unbeabsichtigtes Starten verhindern, Personen fernhalten und den Benzinmotor niemals in einem geschlossenen Gewächshaus oder anderen geschlossenen Raum betreiben, wie es das Handbuch untersagt. Diese Lektion bescheinigt keine Bedienung. Schritt Es drei vierzehn behandelt angeleitete Vorprüfung und Betrieb, Schritt Es drei fünfzehn Wartung und Fehlersuche.\n\nDer Hersteller warnt vor Abgasansammlung in geschlossenen und sogar teilweise umschlossenen Bereichen. Die Benzinfräse nicht in einem geschlossenen Raum betreiben, in dem sich Kohlenmonoxid ansammeln kann. Ein Gewächshausbeispiel ist keine Erlaubnis für Innenbetrieb; ein vorgeschlagener Ventilator oder eine Abgaslösung belegt keine Sicherheit.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s313-readings-audio-20261023-r1'
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
