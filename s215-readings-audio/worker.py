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
IDS = ('S2-15-ar-EG-R01-r1', 'S2-15-ar-EG-R02-r1', 'S2-15-ar-EG-R03-r1', 'S2-15-ar-EG-R04-r1', 'S2-15-ar-EG-R05-r1', 'S2-15-ar-EG-R06-r1', 'S2-15-ar-EG-R07-r1', 'S2-15-en-R01-r1', 'S2-15-en-R02-r1', 'S2-15-en-R03-r1', 'S2-15-en-R04-r1', 'S2-15-en-R05-r1', 'S2-15-en-R06-r1', 'S2-15-en-R07-r1', 'S2-15-it-R01-r1', 'S2-15-it-R02-r1', 'S2-15-it-R03-r1', 'S2-15-it-R04-r1', 'S2-15-it-R05-r1', 'S2-15-it-R06-r1', 'S2-15-it-R07-r1', 'S2-15-de-R01-r1', 'S2-15-de-R02-r1', 'S2-15-de-R03-r1', 'S2-15-de-R04-r1', 'S2-15-de-R05-r1', 'S2-15-de-R06-r1', 'S2-15-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S215_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-15')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s215-readings-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('اقرأ تقرير زميلك كأنك صاحب الأرض: هل الحقل والعينة والمحصول معروفين؟ هل التاريخ والطريقة والوحدات ومصدر كل نتيجة واضح؟ هل وصف منخفض/ملائم/مرتفع له مرجع مناسب؟ هل كل توصية مبنية على دليل ومكتوب فيها اللي لسه مش محسوم، ومن غير جرعة مختلقة؟ علّم فجوة واكتب تصحيح محدد واطلب تعديل التقرير.\n\nبعد التصحيح سجّل ثقتك من ١ إلى ٥ لتحدد اللي هتتدرّب عليه. الثقة معلومة مفيدة، لكنها مش نتيجة اجتياز؛ التقرير ومراجعة المنتج الحقيقية عند المدرّب هما الدليل.', 'اقرأ تقرير زميلك كأنك صاحب الأرض: هل الحقل والعينة والمحصول معروفين؟ هل التاريخ والطريقة والوحدات ومصدر كل نتيجة واضح؟ هل وصف منخفض، ملائم، مرتفع له مرجع مناسب؟ هل كل توصية مبنية على دليل ومكتوب فيها اللي لسه مش محسوم، ومن غير جرعة مختلقة؟ علّم فجوة واكتب تصحيح محدد واطلب تعديل التقرير.\n\nبعد التصحيح سجّل ثقتك من واحد لخمسة لتحدد اللي هتتدرّب عليه. الثقة معلومة مفيدة، لكنها مش نتيجة اجتياز؛ التقرير ومراجعة المنتج الحقيقية عند المدرّب هما الدليل.'), ('الأقسام الخمسة: ١ العنوان وبيانات العميل والحقل والعينة والتاريخ والمُعد؛ ٢ الهدف وسبب الاختبار والمحصول؛ ٣ الطريقة والملاحظات الحقيقية؛ ٤ جدول النتائج بوحداتها ومصدرها ومرجع مناسب؛ ٥ التفسير والتوصيات المشروطة حسب الأولوية. القسم الخامس يفسّر الأرقام مش يكررها.\n\nممكن نشبّه ترتيب التقرير بعنوان البيت وخطته وأدوات بنائه والهيكل ثم طريقة استخدامه. الأصل يقترح قسمًا «خامسًا» للصحة طويلة المدى رغم وجود خمسة أساسية؛ خلّيه إضافة اختيارية بعدهم. عرّف انضغاط التربة والنقص والحرث بكلام قصير عند أول ظهور.', 'الأقسام الخمسة: واحد العنوان وبيانات العميل والحقل والعينة والتاريخ واللي جهّز التقرير؛ اتنين الهدف وسبب الاختبار والمحصول؛ تلاتة الطريقة والملاحظات الحقيقية؛ أربعة جدول النتائج بوحداتها ومصدرها ومرجع مناسب؛ خمسة التفسير والتوصيات المشروطة حسب الأولوية. القسم الخامس يفسّر الأرقام مش يكررها.\n\nممكن نشبّه ترتيب التقرير بعنوان البيت وخطته وأدوات بنائه والهيكل ثم طريقة استخدامه. الأصل يقترح قسم «خامسًا» للصحة طويلة المدى رغم وجود خمسة أساسية؛ خلّيه إضافة اختيارية بعدهم. عرّف انضغاط التربة والنقص والحرث بكلام قصير عند أول ظهور.'), ('بدل المصطلحات المعقدة قول: «pH المقاس 5.0 يعني تربة حامضية، ونحتاج نعرف احتياج المحصول واختبار التجيير قبل اختيار العلاج أو الجرعة». مثال الأصل 10^-5 mol/L تقريب تركيز للتعليم، مش التعريف الدقيق؛ تعريف pH العلمي مرتبط بنشاط أيون الهيدروجين. حوالي ٧ متعادل، الأقل حامضي والأعلى قلوي، والملائم يتغير حسب المحصول والطريقة. النيتروجين يدعم النمو الخضري، والفوسفور يشارك في الجذور والتكاثر، والبوتاسيوم له وظائف نباتية كثيرة. نقص K ممكن يكون سبب محتمل لضعف السيقان أو قابلية المحصول للضرر، لكن الأعراض وحدها ما تثبتش سبب واحد.\n\nالمادة العضوية بتأثر في البنية ودورة الماء والمغذيات، لكن «كل ما زادت أحسن» تعميم غلط. CEC قدرة التربة على الاحتفاظ بالكاتيونات القابلة للتبادل زي K وCa وMg، وبتتأثر بالطين والمادة العضوية؛ مش قياس لكل المغذيات ولا للنترات. في تمرين دقيقتين، طالب يشرح المادة العضوية لمبتدئ والتاني يشرح N-P-K، وبعدين يبدّلوا ويصححوا التعبير. الرسم التعليمي ما يربطش العرض بسبب واحد حتمي.', 'بدل المصطلحات المعقدة قول: «بي إتش المقاس خمسة فاصلة صفر يعني تربة حامضية، ونحتاج نعرف احتياج المحصول واختبار التجيير قبل اختيار العلاج أو الجرعة». مثال الأصل عشرة أس سالب خمسة مول لكل لتر تقريب تركيز للتعليم، مش التعريف الدقيق؛ تعريف بي إتش العلمي مرتبط بنشاط أيون الهيدروجين. حوالي سبعة متعادل، الأقل حامضي والأعلى قلوي، والملائم يتغير حسب المحصول والطريقة. النيتروجين يدعم النمو الخضري، والفوسفور يشارك في الجذور والتكاثر، والبوتاسيوم له وظائف نباتية كثيرة. نقص البوتاسيوم ممكن يكون سبب محتمل لضعف السيقان أو قابلية المحصول للضرر، لكن الأعراض وحدها ما تثبتش سبب واحد.\n\nالمادة العضوية بتأثر في البنية ودورة الماء والمغذيات، لكن «كل ما زادت أحسن» تعميم غلط. سي إي سي قدرة التربة على الاحتفاظ بالكاتيونات القابلة للتبادل زي البوتاسيوم والكالسيوم والماغنيسيوم، وبتتأثر بالطين والمادة العضوية؛ مش قياس لكل المغذيات ولا للنترات. في تمرين دقيقتين، طالب يشرح المادة العضوية لمبتدئ والتاني يشرح النيتروجين والفوسفور والبوتاسيوم، وبعدين يبدّلوا ويصححوا التعبير. الرسم التعليمي ما يربطش العرض بسبب واحد حتمي.'), ('جدول الشرح في الأصل: pH 5.2، مادة عضوية 2.1%، N منخفض، P 25 ppm، K 180 ppm. نطاقات المثال المطبوعة pH 6.0–7.0، مادة عضوية 3.0–5.0%، N «ملائم»، P 30–50 ppm، K 150–250 ppm؛ احتفظ بها كبيانات مثال فقط، لأنها تختلف عن جدول آخر وطريقة المختبر ناقصة. صف النتيجة الحقيقية لازم يبيّن الخاصية والرقم والوحدة والطريقة والمصدر والمرجع والحالة، واكتب «غير محسوم» عند نقص السند. وحدات زي mg/L وµg/L وmg/kg لوحدها ما بتحددش المادة اللي اتقاست؛ ما تنقلش صفوف من غير اسم المادة على إنها نتائج عناصر التربة.\n\nابدأ كل توصية بفعل واضح واربط ترتيبها بسبب الحالة. مثال الأصل يرتب الحموضة ثم المادة العضوية ثم N/P ومراقبة K؛ ده مش ترتيب عام. راجع هدف المحصول واحتياج الجير، واحتياجات المغذيات المعايرة وأرصدة العناصر من الإضافات السابقة، وتركيب الإضافة، والصرف والانضغاط قبل ذكر منتج أو جرعة. راقب K لو مرجع المعمل يدعم حالته.', 'جدول الشرح في الأصل: بي إتش خمسة فاصلة اتنين، مادة عضوية اتنين فاصلة واحد في المية، النيتروجين منخفض، الفوسفور خمسة وعشرين جزء في المليون، البوتاسيوم مية وتمانين جزء في المليون. نطاقات المثال المطبوعة بي إتش ستة فاصلة صفر إلى سبعة فاصلة صفر، مادة عضوية تلاتة فاصلة صفر إلى خمسة فاصلة صفر في المية، النيتروجين «ملائم»، الفوسفور تلاتين إلى خمسين جزء في المليون، البوتاسيوم مية وخمسين إلى ميتين وخمسين جزء في المليون؛ احتفظ بها كبيانات مثال فقط، لأنها تختلف عن جدول آخر وطريقة المختبر ناقصة. صف النتيجة الحقيقية لازم يبيّن الخاصية والرقم والوحدة والطريقة والمصدر والمرجع والحالة، واكتب «غير محسوم» عند نقص السند. وحدات زي ملليجرام لكل لتر وميكروجرام لكل لتر وملليجرام لكل كيلوجرام لوحدها ما بتحددش المادة اللي اتقاست؛ ما تنقلش صفوف من غير اسم المادة على إنها نتائج عناصر التربة.\n\nابدأ كل توصية بفعل واضح واربط ترتيبها بسبب الحالة. مثال الأصل يرتب الحموضة ثم المادة العضوية ثم النيتروجين، الفوسفور ومراقبة البوتاسيوم؛ ده مش ترتيب عام. راجع هدف المحصول واحتياج الجير، واحتياجات المغذيات المعايرة وأرصدة العناصر من الإضافات السابقة، وتركيب الإضافة، والصرف والانضغاط قبل ذكر منتج أو جرعة. راقب البوتاسيوم لو مرجع المعمل يدعم حالته.'), ('حالة طماطم Farmer Jones في West Field: pH 5.5، مادة عضوية 1.5%، N منخفض، P 15 ppm، K 200 ppm، مع انضغاط وصرف بطيء بعد المطر. نطاقات النموذج للطماطم pH 6.0–6.8، مادة عضوية >3%، N «ملائم»، P >50 ppm، K 175–250 ppm. دي تسميات هدف داخل النشاط مش توصية معملية محلية متحقق منها؛ خصوصًا P >50 بلا طريقة استخراج وبيختلف عن جدول آخر. التاريخ والمعمل والطريقة وتفاصيل سحب العينة وعمق طبقة الانضغاط غير معروفين، فلا تخترعهم.\n\nفي مجموعات ٣–٤، اكتبوا الأقسام الخمسة وجدولًا واضحًا وأولويات: ٥ دقائق تجهيز، ٣٥ كتابة، ١٠ نقاش، وتنبيه عند بقاء ١٥ ثم ٥ دقائق. ناقشوا الحموضة وN/P والصرف لكن لا تحددوا جيرًا أو سمادًا قبل خطة مختبرية مناسبة. لا تختاروا سمادًا متوازنًا تلقائيًا وK قد يكون كافيًا. افحصوا موضع الطبقة المانعة والماء ومخرج الصرف قبل الحرث العميق، ولا تحرثوا أرضًا غير مناسبة الرطوبة. اسمعوا تبريرات الأولوية المختلفة ثم قارنوا النموذج بعد المحاولة. بدايات الجمل والجدول الجاهز تساعد التدريب، ولا تثبت بناء التقرير باستقلال. إدارة الغطاء النباتي/الدورة الزراعية إضافة اختيارية طويلة المدى.', 'حالة طماطم المزارع جونز في حقل ويست فيلد: بي إتش خمسة فاصلة خمسة، مادة عضوية واحد فاصلة خمسة في المية، النيتروجين منخفض، الفوسفور خمستاشر جزء في المليون، البوتاسيوم ميتين جزء في المليون، مع انضغاط وصرف بطيء بعد المطر. نطاقات النموذج للطماطم بي إتش ستة فاصلة صفر إلى ستة فاصلة تمانية، مادة عضوية أكبر من تلاتة في المية، النيتروجين «ملائم»، الفوسفور أكبر من خمسين جزء في المليون، البوتاسيوم مية وخمسة وسبعين إلى ميتين وخمسين جزء في المليون. دي تسميات هدف داخل النشاط مش توصية معملية محلية متحقق منها؛ خصوصًا الفوسفور أكبر من خمسين بلا طريقة استخراج وبيختلف عن جدول آخر. التاريخ والمعمل والطريقة وتفاصيل سحب العينة وعمق طبقة الانضغاط غير معروفين، فلا تخترعهم.\n\nفي مجموعات تلاتة إلى أربعة، اكتبوا الأقسام الخمسة وجدولًا واضحًا وأولويات: خمس دقايق تجهيز، خمسة وتلاتين كتابة، عشرة نقاش، وتنبيه عند بقاء خمستاشر ثم خمس دقايق. ناقشوا الحموضة والنيتروجين، الفوسفور والصرف لكن لا تحددوا جيرًا أو سمادًا قبل خطة مختبرية مناسبة. لا تختاروا سمادًا متوازنًا تلقائيًا والبوتاسيوم قد يكون كافيًا. افحصوا موضع الطبقة المانعة والماء ومخرج الصرف قبل الحرث العميق، ولا تحرثوا أرضًا غير مناسبة الرطوبة. اسمعوا تبريرات الأولوية المختلفة ثم قارنوا النموذج بعد المحاولة. بدايات الجمل والجدول الجاهز تساعد التدريب، ولا تثبت بناء التقرير باستقلال. إدارة الغطاء النباتي، الدورة الزراعية إضافة اختيارية طويلة المدى.'), ('مثال أخذ العينة التعليمي: ١٠ قلوب تربة من أعلى ١٥ سم بمسار متعرج وتجميعها في جردل نظيف. في تقرير شغل حقيقي اكتب العدد والعمق والمسار والتاريخ وهوية الحقل الفعلية. استبدل [Lab Name] و[Test Kit Name] باسم الخدمة أو الجهاز الفعلي وطريقته بعد التحقق منهم، أو اكتب إنه غير معلوم؛ الأقواس دي مش دليل معمل.\n\nسجّل اللون والملمس والرطوبة والماء الراكد وحالة المحصول والحشائش كملاحظات. اصفرار الورق يفتح سؤالًا عن N، لكن ما يثبتش نقصه؛ افحص التغذية والمرض والجذور والغمر. الصرف البطيء ممكن يضر الجذور والامتصاص، لكن سببه محتاج فحص. افصل في التقرير الملاحظة والتفسير المحتمل والفحص المقترح.', 'مثال أخذ العينة التعليمي: عشرة قلوب تربة من أعلى خمستاشر سنتيمتر بمسار متعرج وتجميعها في جردل نظيف. في تقرير شغل حقيقي اكتب العدد والعمق والمسار والتاريخ وهوية الحقل الفعلية. استبدل مكان اسم المعمل ومكان اسم طقم الاختبار باسم الخدمة أو الجهاز الفعلي وطريقته بعد التحقق منهم، أو اكتب إنه غير معلوم؛ الأقواس دي مش دليل معمل.\n\nسجّل اللون والملمس والرطوبة والماء الراكد وحالة المحصول والحشائش كملاحظات. اصفرار الورق يفتح سؤالًا عن النيتروجين، لكن ما يثبتش نقصه؛ افحص التغذية والمرض والجذور والغمر. الصرف البطيء ممكن يضر الجذور والامتصاص، لكن سببه محتاج فحص. افصل في التقرير الملاحظة والتفسير المحتمل والفحص المقترح.'), ('مزارع جاب عينة لأن الذرة ضعيفة؛ صفحة أرقام من غير تفسير مش هتجاوب سؤاله. دور الفني إنه يحوّل النتائج والطريقة والشك إلى كلام واضح وخطوة تالية معقولة. افتكر تعليمات مربكة صعّبت عليك شغل، وقارن نص مليان مصطلحات بصفحة فيها عناوين وجدول وأولويات.\n\nوقت التعلم الفعّال ٦٠ دقيقة: ٥ للتمهيد، ١٠ لمراجعة الفكرة، ٣٥ لكتابة التقرير في مجموعات و١٠ للمناقشة. الأهداف: شكل التقرير، شرح البيانات، تنظيم النتائج، توثيق الطريقة والملاحظات، واقتراح خطوات أساسية. الطالب يقيّم ثقته من ١ إلى ٥ للتخطيط للمراجعة فقط؛ التقرير نفسه دليل الاجتياز.', 'مزارع جاب عينة لأن الذرة ضعيفة؛ صفحة أرقام من غير تفسير مش هتجاوب سؤاله. دور الفني إنه يحوّل النتائج والطريقة والشك إلى كلام واضح وخطوة تالية معقولة. افتكر تعليمات مربكة صعّبت عليك شغل، وقارن نص مليان مصطلحات بصفحة فيها عناوين وجدول وأولويات.\n\nوقت التعلم الفعّال ستين دقيقة: خمسة للتمهيد، عشرة لمراجعة الفكرة، خمسة وتلاتين لكتابة التقرير في مجموعات وعشرة للمناقشة. الأهداف: شكل التقرير، شرح البيانات، تنظيم النتائج، توثيق الطريقة والملاحظات، واقتراح خطوات أساسية. الطالب يقيّم ثقته من واحد لخمسة للتخطيط للمراجعة فقط؛ التقرير نفسه دليل الاجتياز.')], 'en': [("1. Title and client information: client, field, sample, date and preparer. 2. Introduction/objective: why the test was requested and the crop or decision. 3. Methods and observations: sampling and analytical methods actually used, plus what was seen in the field. 4. Results: a table of measurements, units, source and suitable reference. 5. Interpretation and recommendations: what each result means, priority, conditions and follow-up. The fifth section explains the numbers; it is not a raw data duplicate.\n\nThe house analogy can cue the sequence: address, plan, tools, built frame, then how to use it. A source extension asks for a 'fifth' long-term-health section even though five core sections already exist; add long-term management as an optional extra or subsection, never replace one of the five. Define compacted, deficient and tillage in short learner-friendly sentences in every locale.", "one. Title and client information: client, field, sample, date and preparer. two. Introduction, objective: why the test was requested and the crop or decision. three. Methods and observations: sampling and analytical methods actually used, plus what was seen in the field. four. Results: a table of measurements, units, source and suitable reference. five. Interpretation and recommendations: what each result means, priority, conditions and follow-up. The fifth section explains the numbers; it is not a raw data duplicate.\n\nThe house analogy can cue the sequence: address, plan, tools, built frame, then how to use it. A source extension asks for a 'fifth' long-term-health section even though five core sections already exist; add long-term management as an optional extra or subsection, never replace one of the five. Define compacted, deficient and tillage in short learner-friendly sentences in every locale."), ("A farmer brings a soil sample because the corn is growing poorly; a page of unexplained numbers will not answer the management question. The technician's job is to translate findings, methods and uncertainty into plain language and a sensible next step. Recall when confusing instructions last made a task harder; compare a jargon-heavy page with a clear page using headings, a table and prioritized actions.\n\nThis is a 60-minute active lesson: 5 minutes introduction and outcomes, 10 minutes concept review, then 35 minutes group writing and 10 minutes discussion. The five aims are to explain report structure, translate data, organize findings, document methods/observations and propose basic actions. A 1–5 confidence rating against each aim helps plan revision; actual report evidence determines achievement.", "A farmer brings a soil sample because the corn is growing poorly; a page of unexplained numbers will not answer the management question. The technician's job is to translate findings, methods and uncertainty into plain language and a sensible next step. Recall when confusing instructions last made a task harder; compare a jargon-heavy page with a clear page using headings, a table and prioritized actions.\n\nThis is a sixty-minute active lesson: five minutes introduction and outcomes, ten minutes concept review, then thirty-five minutes group writing and ten minutes discussion. The five aims are to explain report structure, translate data, organize findings, document methods, observations and propose basic actions. A one to five confidence rating against each aim helps plan revision; actual report evidence determines achievement."), ("Farmer Jones's West Field is a supplied tomato case: pH 5.5; OM 1.5%; N Low; P 15 ppm; K 200 ppm; visible compaction and slow drainage after rain. The source model gives tomato bands pH 6.0–6.8, OM >3%, N 'Optimal', P >50 ppm and K 175–250 ppm. These are provided classroom target labels, not independently validated local lab ranges. In particular, P >50 ppm conflicts with another source table and its extraction method is missing. The date, exact lab, test method, sampling details and measured compaction layer are not supplied; do not invent them.\n\nIn groups of three or four, make all five report sections, a farmer-readable table and prioritized bullets; trainer setup is 5 minutes, writing 35 and discussion 10 with 15- and 5-minute warnings during work. Address acidity, N/P questions and compaction/drainage, but seek a lab-calibrated tomato plan before nutrient or lime rates. Do not automatically select a balanced fertilizer when K may already be adequate. Check where a restrictive layer lies and whether drainage has an outlet before deep tillage/subsoiling; avoid tillage in unsuitable wet conditions. Ask one group for its priority and another for its compaction reasoning; compare with the model after attempts, accepting supported alternatives. Sentence starters or a pre-filled table can support practice, while a long-term cover-crop/rotation section is an optional extension, not proof the learner built the table independently.", "Farmer Jones's West Field is a supplied tomato case: P H five point five; organic matter one point five percent; N Low; P fifteen parts per million; K two hundred parts per million; visible compaction and slow drainage after rain. The source model gives tomato bands P H six point zero to six point eight, organic matter greater than three percent, N 'Optimal', P greater than fifty parts per million and K one hundred seventy-five to two hundred fifty parts per million. These are provided classroom target labels, not independently validated local lab ranges. In particular, P greater than fifty parts per million conflicts with another source table and its extraction method is missing. The date, exact lab, test method, sampling details and measured compaction layer are not supplied; do not invent them.\n\nIn groups of three or four, make all five report sections, a farmer-readable table and prioritized bullets; trainer setup is five minutes, writing thirty-five and discussion ten with fifteen- and five-minute warnings during work. Address acidity, N, P questions and compaction, drainage, but seek a lab-calibrated tomato plan before nutrient or lime rates. Do not automatically select a balanced fertilizer when K may already be adequate. Check where a restrictive layer lies and whether drainage has an outlet before deep tillage, subsoiling; avoid tillage in unsuitable wet conditions. Ask one group for its priority and another for its compaction reasoning; compare with the model after attempts, accepting supported alternatives. Sentence starters or a pre-filled table can support practice, while a long-term cover-crop, rotation section is an optional extension, not proof the learner built the table independently."), ("Instead of a string of chemical jargon, say: 'The measured pH is 5.0, an acidic result. We need the crop target and a lime-requirement test before choosing a treatment or rate.' The classroom comparison writes hydrogen-ion concentration as 10^-5 mol/L for pH 5.0; that is a simplified concentration example, not an exact pH definition. pH is formally based on hydrogen-ion activity. Around 7 is neutral, lower is acidic and higher alkaline, while suitable ranges depend on crop and method. For farmer language: N supports vegetative growth; P supports root and reproductive processes; K supports many plant functions. Low K can be one possible contributor to weak stems or crop vulnerability, but symptoms alone do not prove a single cause.\n\nOrganic matter contributes to soil structure, water and nutrient cycling; its percentage and amendment quality need context, so 'more is always better' is false. CEC describes soil capacity to retain exchangeable positive ions, including K, Ca and Mg, and depends on clay minerals and organic matter; it is not a measure of every nutrient or nitrate. In a two-minute pair exercise, one learner explains OM to a new gardener and the other explains N-P-K, then they exchange and refine the explanations. Use leaves, roots and the whole plant as discussion cues, without treating N, P or K as the sole cause of a crop symptom.", "Instead of a string of chemical jargon, say: 'The measured P H is five point zero, an acidic result. We need the crop target and a lime-requirement test before choosing a treatment or rate.' The classroom comparison writes hydrogen-ion concentration as ten to the power of minus five moles per litre for P H five point zero; that is a simplified concentration example, not an exact P H definition. P H is formally based on hydrogen-ion activity. Around seven is neutral, lower is acidic and higher alkaline, while suitable ranges depend on crop and method. For farmer language: N supports vegetative growth; P supports root and reproductive processes; K supports many plant functions. Low K can be one possible contributor to weak stems or crop vulnerability, but symptoms alone do not prove a single cause.\n\nOrganic matter contributes to soil structure, water and nutrient cycling; its percentage and amendment quality need context, so 'more is always better' is false. C E C describes soil capacity to retain exchangeable positive ions, including K, calcium and magnesium, and depends on clay minerals and organic matter; it is not a measure of every nutrient or nitrate. In a two-minute pair exercise, one learner explains organic matter to a new gardener and the other explains N P K, then they exchange and refine the explanations. Use leaves, roots and the whole plant as discussion cues, without treating N, P or K as the sole cause of a crop symptom."), ("Read a partner's report as if you were the farmer. Can you identify your field, sample and crop? Are dates, methods, units and the source of each value visible? Does a claimed low/optimum/high class cite an applicable lab reference? Does each suggested action follow the findings, name its uncertainty and avoid an invented rate? Mark one gap, show a corrected sentence or cell, and ask the writer to revise.\n\nAfter revising, use the 1–5 self-rating to choose a skill to practise next. Your confidence is useful feedback, not a pass result; the report and the trainer's separate product evaluation are the evidence.", "Read a partner's report as if you were the farmer. Can you identify your field, sample and crop? Are dates, methods, units and the source of each value visible? Does a claimed low, optimum, high class cite an applicable lab reference? Does each suggested action follow the findings, name its uncertainty and avoid an invented rate? Mark one gap, show a corrected sentence or cell, and ask the writer to revise.\n\nAfter revising, use the one to five self-rating to choose a skill to practise next. Your confidence is useful feedback, not a pass result; the report and the trainer's separate product evaluation are the evidence."), ("The source's teaching table reads pH 5.2, OM 2.1%, N Low, P 25 ppm and K 180 ppm. It prints illustrative bands pH 6.0–7.0, OM 3.0–5.0%, N Optimum, P 30–50 ppm and K 150–250 ppm, and labels the entries. Preserve those values as a supplied model, but the bands differ from the other teaching table and have no lab method. A real result row needs parameter, result, unit, source/method, applicable reference and status, with 'unresolved' when support is missing. Units such as mg/L, µg/L and mg/kg do not identify the measured substance on their own; do not report unidentified rows as soil nutrient results.\n\nUse a short prioritized bullet list beginning with a clear action verb. The model orders acidity, OM, N/P and K monitoring; this is not a universal sequence. Confirm crop target and lime requirement, calibrated nutrient needs and credits, amendment analysis, drainage and compaction before saying 'apply' a specific product or rate. Monitor K only if its reference justifies that status. Explain why the first action is first for this case.", "The source's teaching table reads P H five point two, organic matter two point one percent, N Low, P twenty-five parts per million and K one hundred eighty parts per million. It prints illustrative bands P H six point zero to seven point zero, organic matter three point zero to five point zero percent, N Optimum, P thirty to fifty parts per million and K one hundred fifty to two hundred fifty parts per million, and labels the entries. Preserve those values as a supplied model, but the bands differ from the other teaching table and have no lab method. A real result row needs parameter, result, unit, source, method, applicable reference and status, with 'unresolved' when support is missing. Units such as milligrams per litre, micrograms per litre and milligrams per kilogram do not identify the measured substance on their own; do not report unidentified rows as soil nutrient results.\n\nUse a short prioritized bullet list beginning with a clear action verb. The model orders acidity, organic matter, N, P and K monitoring; this is not a universal sequence. Confirm crop target and lime requirement, calibrated nutrient needs and credits, amendment analysis, drainage and compaction before saying 'apply' a specific product or rate. Monitor K only if its reference justifies that status. Explain why the first action is first for this case."), ('The teaching method example takes 10 cores from the top 15 cm in a zigzag route and combines them in a clean bucket. It is a specific classroom scenario; a report of real work must state the actual sampling pattern, depth, number, date and field identity. Replace [Lab Name] or [Test Kit Name] only with a verified actual service/device and method, or mark it missing. A placeholder is not evidence of laboratory testing.\n\nRecord soil appearance, feel, moisture, standing water, crop condition and relevant weeds as observations. Yellow leaves can raise a nitrogen question but do not confirm N deficiency: nutrient status, disease, root damage and waterlogging require checking. Slow drainage can restrict roots or nutrient uptake, but the cause must be investigated. Put observation, possible interpretation and proposed test in separate report cells so a farmer can see the uncertainty.', 'The teaching method example takes ten cores from the top fifteen centimetres in a zigzag route and combines them in a clean bucket. It is a specific classroom scenario; a report of real work must state the actual sampling pattern, depth, number, date and field identity. Replace placeholder Lab Name or placeholder Test Kit Name only with a verified actual service, device and method, or mark it missing. A placeholder is not evidence of laboratory testing.\n\nRecord soil appearance, feel, moisture, standing water, crop condition and relevant weeds as observations. Yellow leaves can raise a nitrogen question but do not confirm N deficiency: nutrient status, disease, root damage and waterlogging require checking. Slow drainage can restrict roots or nutrient uptake, but the cause must be investigated. Put observation, possible interpretation and proposed test in separate report cells so a farmer can see the uncertainty.')], 'it': [("Al posto di gergo chimico: “Il pH misurato è 5.0, quindi il risultato è acido; occorrono obiettivo della coltura e fabbisogno di calce prima di scegliere intervento o dose.” Il 10^-5 mol/L del confronto didattico è una semplificazione in concentrazione, non una definizione esatta; formalmente il pH dipende dall’attività degli ioni idrogeno. Circa 7 è neutro, sotto acido, sopra alcalino; l’intervallo utile varia con coltura e metodo. N sostiene la crescita vegetativa, P partecipa a radici e riproduzione, K sostiene molte funzioni della pianta. Una carenza di K può contribuire a fusti deboli o a una maggiore vulnerabilità della coltura, ma i sintomi da soli non dimostrano un'unica causa.\n\nLa sostanza organica contribuisce a struttura e cicli di acqua/nutrienti; “più è sempre meglio” è falso. La CEC è la capacità di trattenere cationi scambiabili come K, Ca e Mg, influenzata da argille e sostanza organica; non misura ogni nutriente né il nitrato. In coppia per due minuti, uno spiega la sostanza organica e l’altro N-P-K a un principiante, poi si scambiano e migliorano le frasi. Il disegno non deve far sembrare un singolo nutriente causa certa di un sintomo.", "Al posto di gergo chimico: “Il pi acca misurato è cinque virgola zero, quindi il risultato è acido; occorrono obiettivo della coltura e fabbisogno di calce prima di scegliere intervento o dose.” Il dieci alla meno cinque moli per litro del confronto didattico è una semplificazione in concentrazione, non una definizione esatta; formalmente il pi acca dipende dall’attività degli ioni idrogeno. Circa sette è neutro, sotto acido, sopra alcalino; l’intervallo utile varia con coltura e metodo. enne sostiene la crescita vegetativa, pi partecipa a radici e riproduzione, cappa sostiene molte funzioni della pianta. Una carenza di cappa può contribuire a fusti deboli o a una maggiore vulnerabilità della coltura, ma i sintomi da soli non dimostrano un'unica causa.\n\nLa sostanza organica contribuisce a struttura e cicli di acqua, nutrienti; “più è sempre meglio” è falso. La ci e ci è la capacità di trattenere cationi scambiabili come cappa, calcio e magnesio, influenzata da argille e sostanza organica; non misura ogni nutriente né il nitrato. In coppia per due minuti, uno spiega la sostanza organica e l’altro enne pi cappa a un principiante, poi si scambiano e migliorano le frasi. Il disegno non deve far sembrare un singolo nutriente causa certa di un sintomo."), ('Il caso fornito di Farmer Jones, West Field, pomodori: pH 5.5, sostanza organica 1.5%, N Basso, P 15 ppm, K 200 ppm, compattazione visibile e drenaggio lento dopo la pioggia. Il modello offre obiettivi pH 6.0–6.8, sostanza organica >3%, N “Ottimale”, P >50 ppm, K 175–250 ppm. Sono etichette del caso didattico, non intervalli locali validati; soprattutto P >50 manca di metodo e contrasta un’altra tabella. Data, laboratorio, metodo, dettagli del campionamento e profondità dello strato resistente non sono forniti.\n\nIn gruppi di 3–4, prepara cinque sezioni, tabella comprensibile e punti ordinati: 5 minuti preparazione, 35 scrittura, 10 discussione, avvisi quando restano 15 e 5 minuti. Affronta acidità, N/P e drenaggio ma richiedi piano di laboratorio calibrato prima di dosi. Non scegliere automaticamente fertilizzante bilanciato se K può essere sufficiente. Verifica lo strato, l’umidità e lo sbocco prima della ripuntatura, evitando condizioni troppo bagnate. Ascolta priorità alternative motivate prima del modello. Frasi iniziali e tabella precompilata aiutano a esercitarsi ma non dimostrano autonomia; coperture/rotazioni sono estensione facoltativa.', 'Il caso fornito di Farmer Jones, West Field, pomodori: pi acca cinque virgola cinque, sostanza organica uno virgola cinque per cento, enne Basso, pi quindici parti per milione, cappa duecento parti per milione, compattazione visibile e drenaggio lento dopo la pioggia. Il modello offre obiettivi pi acca sei virgola zero a sei virgola otto, sostanza organica superiore a tre per cento, enne “Ottimale”, pi superiore a cinquanta parti per milione, cappa centosettantacinque a duecentocinquanta parti per milione. Sono etichette del caso didattico, non intervalli locali validati; soprattutto pi superiore a cinquanta manca di metodo e contrasta un’altra tabella. Data, laboratorio, metodo, dettagli del campionamento e profondità dello strato resistente non sono forniti.\n\nIn gruppi di tre a quattro, prepara cinque sezioni, tabella comprensibile e punti ordinati: cinque minuti preparazione, trentacinque scrittura, dieci discussione, avvisi quando restano quindici e cinque minuti. Affronta acidità, enne, pi e drenaggio ma richiedi piano di laboratorio calibrato prima di dosi. Non scegliere automaticamente fertilizzante bilanciato se cappa può essere sufficiente. Verifica lo strato, l’umidità e lo sbocco prima della ripuntatura, evitando condizioni troppo bagnate. Ascolta priorità alternative motivate prima del modello. Frasi iniziali e tabella precompilata aiutano a esercitarsi ma non dimostrano autonomia; coperture, rotazioni sono estensione facoltativa.'), ('La tabella didattica originale contiene pH 5.2, sostanza organica 2.1%, N Basso, P 25 ppm, K 180 ppm. Riporta intervalli illustrativi pH 6.0–7.0, sostanza organica 3.0–5.0%, N “Ottimale”, P 30–50 ppm, K 150–250 ppm. Conservali come dati del modello: differiscono da un’altra tabella e manca il metodo. Una riga reale richiede parametro, valore, unità, fonte/metodo, riferimento applicabile e stato; se manca il supporto scrivi “non determinato”. Unità come mg/L, µg/L e mg/kg non identificano da sole la sostanza misurata: non riportare righe senza analiti identificati come risultati dei nutrienti del suolo.\n\nUsa punti con verbi chiari e motiva l’ordine. Il modello mette acidità, sostanza organica, N/P e monitoraggio di K: non è una sequenza universale. Controlla obiettivo colturale e fabbisogno di calce, fabbisogni nutritivi calibrati e apporti di nutrienti già disponibili, analisi dell’ammendante, drenaggio e compattazione prima di nominare prodotto o dose. Monitora K solo se il riferimento lo giustifica.', 'La tabella didattica originale contiene pi acca cinque virgola due, sostanza organica due virgola uno per cento, enne Basso, pi venticinque parti per milione, cappa centottanta parti per milione. Riporta intervalli illustrativi pi acca sei virgola zero a sette virgola zero, sostanza organica tre virgola zero a cinque virgola zero per cento, enne “Ottimale”, pi trenta a cinquanta parti per milione, cappa centocinquanta a duecentocinquanta parti per milione. Conservali come dati del modello: differiscono da un’altra tabella e manca il metodo. Una riga reale richiede parametro, valore, unità, fonte, metodo, riferimento applicabile e stato; se manca il supporto scrivi “non determinato”. Unità come milligrammi per litro, microgrammi per litro e milligrammi per chilogrammo non identificano da sole la sostanza misurata: non riportare righe senza analiti identificati come risultati dei nutrienti del suolo.\n\nUsa punti con verbi chiari e motiva l’ordine. Il modello mette acidità, sostanza organica, enne, pi e monitoraggio di cappa: non è una sequenza universale. Controlla obiettivo colturale e fabbisogno di calce, fabbisogni nutritivi calibrati e apporti di nutrienti già disponibili, analisi dell’ammendante, drenaggio e compattazione prima di nominare prodotto o dose. Monitora cappa solo se il riferimento lo giustifica.'), ('Le cinque sezioni: 1 titolo e dati di cliente, campo, campione, data e autore; 2 scopo e coltura/decisione; 3 metodi effettivi e osservazioni; 4 tabella con misure, unità, fonte e riferimento adatto; 5 interpretazione, priorità, condizioni e raccomandazioni. La quinta interpreta i numeri, non li ripete.\n\nL’analogia della casa aiuta a ricordare indirizzo, progetto, strumenti, struttura e uso. La fonte propone una “quinta” sezione sulla salute a lungo termine benché le sezioni essenziali siano già cinque: aggiungila soltanto come estensione facoltativa. Definisci compattato, carente e lavorazione con frasi brevi alla prima comparsa.', 'Le cinque sezioni: uno titolo e dati di cliente, campo, campione, data e autore; due scopo e coltura, decisione; tre metodi effettivi e osservazioni; quattro tabella con misure, unità, fonte e riferimento adatto; cinque interpretazione, priorità, condizioni e raccomandazioni. La quinta interpreta i numeri, non li ripete.\n\nL’analogia della casa aiuta a ricordare indirizzo, progetto, strumenti, struttura e uso. La fonte propone una “quinta” sezione sulla salute a lungo termine benché le sezioni essenziali siano già cinque: aggiungila soltanto come estensione facoltativa. Definisci compattato, carente e lavorazione con frasi brevi alla prima comparsa.'), ('Leggi il rapporto del compagno come se fossi il cliente: campo, campione e coltura sono identificati? Date, metodi, unità e fonte di ogni risultato sono visibili? La classe basso/ottimo/alto cita un riferimento applicabile? Ogni azione segue i dati, dichiara l’incertezza ed evita dosi inventate? Segna una lacuna, proponi una correzione concreta e chiedi la revisione.\n\nDopo la correzione dai un voto di fiducia 1–5 per scegliere cosa esercitare ancora. La fiducia è feedback, non un giudizio di superamento; contano il rapporto e la valutazione separata del prodotto da parte del formatore.', 'Leggi il rapporto del compagno come se fossi il cliente: campo, campione e coltura sono identificati? Date, metodi, unità e fonte di ogni risultato sono visibili? La classe basso, ottimo, alto cita un riferimento applicabile? Ogni azione segue i dati, dichiara l’incertezza ed evita dosi inventate? Segna una lacuna, proponi una correzione concreta e chiedi la revisione.\n\nDopo la correzione dai un voto di fiducia uno a cinque per scegliere cosa esercitare ancora. La fiducia è feedback, non un giudizio di superamento; contano il rapporto e la valutazione separata del prodotto da parte del formatore.'), ('L’esempio di prelievo usa 10 carote nei primi 15 cm seguendo uno zigzag e mescolate in un secchio pulito. In un rapporto reale descrivi numero, profondità, percorso, data e identità del campo effettivi. Sostituisci [Lab Name] e [Test Kit Name] soltanto con un servizio o dispositivo verificato, altrimenti indica che manca: un segnaposto non dimostra l’analisi.\n\nRegistra aspetto, tessitura percepita, umidità, acqua stagnante, stato delle colture e infestanti come osservazioni. Il giallo delle foglie può suggerire di indagare N ma non ne prova la carenza; considera nutrizione, malattie, radici e ristagno. Il drenaggio lento può ostacolare radici e assorbimento, ma la causa va indagata. Tieni distinti fatto osservato, interpretazione possibile e test proposto.', 'L’esempio di prelievo usa dieci carote nei primi quindici centimetri seguendo uno zigzag e mescolate in un secchio pulito. In un rapporto reale descrivi numero, profondità, percorso, data e identità del campo effettivi. Sostituisci segnaposto nome del laboratorio e segnaposto nome del kit di analisi soltanto con un servizio o dispositivo verificato, altrimenti indica che manca: un segnaposto non dimostra l’analisi.\n\nRegistra aspetto, tessitura percepita, umidità, acqua stagnante, stato delle colture e infestanti come osservazioni. Il giallo delle foglie può suggerire di indagare enne ma non ne prova la carenza; considera nutrizione, malattie, radici e ristagno. Il drenaggio lento può ostacolare radici e assorbimento, ma la causa va indagata. Tieni distinti fatto osservato, interpretazione possibile e test proposto.'), ('Un agricoltore porta un campione perché il mais cresce male: numeri senza spiegazioni non risolvono la sua domanda. Il tecnico traduce risultati, metodo e incertezza in lingua comune e in un prossimo passo sensato. Ricorda quando istruzioni confuse hanno ostacolato un tuo compito; confronta una pagina piena di gergo con titoli, tabella e priorità.\n\nL’attività dura 60 minuti effettivi: 5 introduzione, 10 ripasso dei concetti, 35 lavoro di gruppo sul rapporto e 10 discussione. I cinque obiettivi sono struttura, traduzione dei dati, organizzazione, documentazione di metodi/osservazioni e azioni iniziali. Il voto di fiducia 1–5 orienta il ripasso; la prova di apprendimento è il rapporto.', 'Un agricoltore porta un campione perché il mais cresce male: numeri senza spiegazioni non risolvono la sua domanda. Il tecnico traduce risultati, metodo e incertezza in lingua comune e in un prossimo passo sensato. Ricorda quando istruzioni confuse hanno ostacolato un tuo compito; confronta una pagina piena di gergo con titoli, tabella e priorità.\n\nL’attività dura sessanta minuti effettivi: cinque introduzione, dieci ripasso dei concetti, trentacinque lavoro di gruppo sul rapporto e dieci discussione. I cinque obiettivi sono struttura, traduzione dei dati, organizzazione, documentazione di metodi, osservazioni e azioni iniziali. Il voto di fiducia uno a cinque orienta il ripasso; la prova di apprendimento è il rapporto.')], 'de': [('Das Lehrbeispiel entnimmt 10 Bodenkerne aus den oberen 15 cm im Zickzack und mischt sie in einem sauberen Eimer. Ein echter Bericht muss wirkliche Zahl, Tiefe, Weg, Datum und Feldkennung nennen. Ersetze [Lab Name] oder [Test Kit Name] nur durch nachgewiesene Dienste/Geräte; sonst vermerke die Lücke. Ein Platzhalter belegt keine Laborprüfung.\n\nErfasse Erscheinung, gefühlte Textur, Feuchte, stehendes Wasser, Pflanzenzustand und Unkraut als Beobachtung. Gelbe Blätter können eine N-Frage auslösen, bestätigen aber keinen N-Mangel; Ernährung, Krankheiten, Wurzeln und Staunässe sind zu prüfen. Schlechte Entwässerung kann Wurzeln und Aufnahme stören, doch die Ursache muss untersucht werden. Schreibe Beobachtung, mögliche Deutung und nötigen Test in getrennte Felder.', 'Das Lehrbeispiel entnimmt zehn Bodenkerne aus den oberen fünfzehn Zentimetern im Zickzack und mischt sie in einem sauberen Eimer. Ein echter Bericht muss wirkliche Zahl, Tiefe, Weg, Datum und Feldkennung nennen. Ersetze Platzhalter Laborname oder Platzhalter Name des Testkits nur durch nachgewiesene Dienste, Geräte; sonst vermerke die Lücke. Ein Platzhalter belegt keine Laborprüfung.\n\nErfasse Erscheinung, gefühlte Textur, Feuchte, stehendes Wasser, Pflanzenzustand und Unkraut als Beobachtung. Gelbe Blätter können eine En-Frage auslösen, bestätigen aber keinen En-Mangel; Ernährung, Krankheiten, Wurzeln und Staunässe sind zu prüfen. Schlechte Entwässerung kann Wurzeln und Aufnahme stören, doch die Ursache muss untersucht werden. Schreibe Beobachtung, mögliche Deutung und nötigen Test in getrennte Felder.'), ('Der bereitgestellte Tomatenfall Farmer Jones, West Field: pH 5.5, organische Substanz 1.5%, N Niedrig, P 15 ppm, K 200 ppm, Verdichtung und langsame Entwässerung nach Regen. Das Modell nennt pH 6.0–6.8, organische Substanz >3%, N „Optimal“, P >50 ppm und K 175–250 ppm. Diese Unterrichtsziele sind keine lokal validierten Laborbereiche. Gerade P >50 hat keine Extraktionsmethode und widerspricht einer anderen Tabelle. Datum, Labor, Methode, Probenahme und Tiefe der Sperrschicht fehlen; erfinde sie nicht.\n\nIn Dreier- oder Vierergruppen werden alle fünf Abschnitte, eine verständliche Tabelle und begründete Prioritäten erstellt: 5 Minuten Vorbereitung, 35 Schreiben, 10 Gespräch; Warnungen bei 15 und 5 Minuten Restzeit. Säure, N/P und Entwässerung gehören hinein, aber Kalk- und Düngermengen erst nach kultur- und laborbezogener Prüfung. Kein automatischer Volldünger, wenn K ausreichend sein kann. Prüfe Schicht, Feuchte und Abfluss vor tiefem Lockern und meide ungeeignet nassen Boden. Lass alternative begründete Reihenfolgen zu und zeige das Modell erst danach. Satzanfänge und vorbereitete Tabellen sind Hilfen, keine selbstständige Leistung; Zwischenfrucht/Fruchtfolge ist ein freiwilliger Zusatz.', 'Der bereitgestellte Tomatenfall Farmer Jones, West Field: Pe Ha fünf Komma fünf, organische Substanz eins Komma fünf Prozent, En Niedrig, Pe fünfzehn Teile pro Million, Ka zweihundert Teile pro Million, Verdichtung und langsame Entwässerung nach Regen. Das Modell nennt Pe Ha sechs Komma null bis sechs Komma acht, organische Substanz größer als drei Prozent, En „Optimal“, Pe größer als fünfzig Teile pro Million und Ka einhundertfünfundsiebzig bis zweihundertfünfzig Teile pro Million. Diese Unterrichtsziele sind keine lokal validierten Laborbereiche. Gerade Pe größer als fünfzig hat keine Extraktionsmethode und widerspricht einer anderen Tabelle. Datum, Labor, Methode, Probenahme und Tiefe der Sperrschicht fehlen; erfinde sie nicht.\n\nIn Dreier- oder Vierergruppen werden alle fünf Abschnitte, eine verständliche Tabelle und begründete Prioritäten erstellt: fünf Minuten Vorbereitung, fünfunddreißig Schreiben, zehn Gespräch; Warnungen bei fünfzehn und fünf Minuten Restzeit. Säure, En, Pe und Entwässerung gehören hinein, aber Kalk- und Düngermengen erst nach kultur- und laborbezogener Prüfung. Kein automatischer Volldünger, wenn Ka ausreichend sein kann. Prüfe Schicht, Feuchte und Abfluss vor tiefem Lockern und meide ungeeignet nassen Boden. Lass alternative begründete Reihenfolgen zu und zeige das Modell erst danach. Satzanfänge und vorbereitete Tabellen sind Hilfen, keine selbstständige Leistung; Zwischenfrucht, Fruchtfolge ist ein freiwilliger Zusatz.'), ('Die Lehrtabelle zeigt pH 5.2, organische Substanz 2.1%, N Niedrig, P 25 ppm, K 180 ppm. Ihre Beispielbereiche sind pH 6.0–7.0, organische Substanz 3.0–5.0%, N „Optimal“, P 30–50 ppm, K 150–250 ppm. Bewahre diese Angaben als Lehrbeispiel: Eine andere Tabelle widerspricht und die Labormethode fehlt. Jede reale Ergebniszeile braucht Parameter, Wert, Einheit, Quelle/Methode, anwendbare Referenz und Bewertung; ohne Grundlage „ungeklärt“. Einheiten wie mg/L, µg/L und mg/kg benennen allein keinen gemessenen Stoff. Übernimm Zeilen ohne benannten Stoff nicht als Bodennährstoffergebnisse.\n\nBeginne Prioritätspunkte mit klaren Tätigkeiten und begründe ihre Reihenfolge. Das Modell stellt Säure, organische Substanz, N/P und K-Kontrolle in diese Folge; sie gilt nicht allgemein. Prüfe Kulturziel und Kalkbedarf, methodenkalibrierten Nährstoffbedarf und anzurechnende Nährstoffbeiträge, Stoffanalyse, Entwässerung und Verdichtung vor Produkt- oder Mengenangaben. K nur überwachen, wenn die passende Referenz dies trägt.', 'Die Lehrtabelle zeigt Pe Ha fünf Komma zwei, organische Substanz zwei Komma eins Prozent, En Niedrig, Pe fünfundzwanzig Teile pro Million, Ka einhundertachtzig Teile pro Million. Ihre Beispielbereiche sind Pe Ha sechs Komma null bis sieben Komma null, organische Substanz drei Komma null bis fünf Komma null Prozent, En „Optimal“, Pe dreißig bis fünfzig Teile pro Million, Ka einhundertfünfzig bis zweihundertfünfzig Teile pro Million. Bewahre diese Angaben als Lehrbeispiel: Eine andere Tabelle widerspricht und die Labormethode fehlt. Jede reale Ergebniszeile braucht Parameter, Wert, Einheit, Quelle, Methode, anwendbare Referenz und Bewertung; ohne Grundlage „ungeklärt“. Einheiten wie Milligramm pro Liter, Mikrogramm pro Liter und Milligramm pro Kilogramm benennen allein keinen gemessenen Stoff. Übernimm Zeilen ohne benannten Stoff nicht als Bodennährstoffergebnisse.\n\nBeginne Prioritätspunkte mit klaren Tätigkeiten und begründe ihre Reihenfolge. Das Modell stellt Säure, organische Substanz, En, Pe und Ka-Kontrolle in diese Folge; sie gilt nicht allgemein. Prüfe Kulturziel und Kalkbedarf, methodenkalibrierten Nährstoffbedarf und anzurechnende Nährstoffbeiträge, Stoffanalyse, Entwässerung und Verdichtung vor Produkt- oder Mengenangaben. Ka nur überwachen, wenn die passende Referenz dies trägt.'), ('Die fünf Teile sind: 1 Titel und Angaben zu Auftraggeber, Feld, Probe, Datum und Verfasser; 2 Ziel und Kultur/Entscheidung; 3 tatsächlich verwendete Methoden und Beobachtungen; 4 Tabelle mit Werten, Einheiten, Quelle und passender Referenz; 5 Deutung, Prioritäten, Bedingungen und Empfehlungen. Teil fünf erläutert die Werte, statt sie zu wiederholen.\n\nAls Gedächtnishilfe dient ein Haus: Adresse, Plan, Werkzeuge, Rohbau und Nutzung. Die Quelle schlägt eine „fünfte“ Langfrist-Sektion vor, obwohl bereits fünf Pflichtteile existieren. Füge langfristige Bodengesundheit nur zusätzlich oder als Unterpunkt hinzu. Erkläre Verdichtung, Mangel und Bodenbearbeitung beim ersten Auftreten in kurzen Sätzen.', 'Die fünf Teile sind: eins Titel und Angaben zu Auftraggeber, Feld, Probe, Datum und Verfasser; zwei Ziel und Kultur, Entscheidung; drei tatsächlich verwendete Methoden und Beobachtungen; vier Tabelle mit Werten, Einheiten, Quelle und passender Referenz; fünf Deutung, Prioritäten, Bedingungen und Empfehlungen. Teil fünf erläutert die Werte, statt sie zu wiederholen.\n\nAls Gedächtnishilfe dient ein Haus: Adresse, Plan, Werkzeuge, Rohbau und Nutzung. Die Quelle schlägt eine „fünfte“ Langfrist-Sektion vor, obwohl bereits fünf Pflichtteile existieren. Füge langfristige Bodengesundheit nur zusätzlich oder als Unterpunkt hinzu. Erkläre Verdichtung, Mangel und Bodenbearbeitung beim ersten Auftreten in kurzen Sätzen.'), ('Ein Landwirt lässt Boden prüfen, weil der Mais schlecht wächst. Unerklärte Zahlen beantworten seine Frage nicht. Die Fachkraft übersetzt Ergebnisse, Verfahren und Unsicherheit in Alltagssprache und sinnvolle Folgeschritte. Erinnere dich, wann unklare Anweisungen deine Arbeit erschwert haben; vergleiche Fachjargon mit einer Seite aus Überschriften, Tabelle und Prioritäten.\n\nDie aktive Stunde umfasst 60 Minuten: 5 Einstieg, 10 Begriffe, 35 Bericht in Gruppen und 10 Besprechung. Fünf Ziele: Berichtsaufbau, verständliche Daten, geordnete Ergebnisse, dokumentierte Methoden/Beobachtungen und begründete erste Schritte. Ein Selbstwert 1–5 plant die Wiederholung; der tatsächliche Bericht zeigt die Leistung.', 'Ein Landwirt lässt Boden prüfen, weil der Mais schlecht wächst. Unerklärte Zahlen beantworten seine Frage nicht. Die Fachkraft übersetzt Ergebnisse, Verfahren und Unsicherheit in Alltagssprache und sinnvolle Folgeschritte. Erinnere dich, wann unklare Anweisungen deine Arbeit erschwert haben; vergleiche Fachjargon mit einer Seite aus Überschriften, Tabelle und Prioritäten.\n\nDie aktive Stunde umfasst sechzig Minuten: fünf Einstieg, zehn Begriffe, fünfunddreißig Bericht in Gruppen und zehn Besprechung. Fünf Ziele: Berichtsaufbau, verständliche Daten, geordnete Ergebnisse, dokumentierte Methoden, Beobachtungen und begründete erste Schritte. Ein Selbstwert eins bis fünf plant die Wiederholung; der tatsächliche Bericht zeigt die Leistung.'), ('Lies den Bericht eines Partners als Betrieb: Sind Feld, Probe und Kultur erkennbar? Stehen Datum, Methode, Einheit und Quelle bei jedem Wert? Beruht „niedrig/optimal/hoch“ auf passender Laborreferenz? Folgt jede Maßnahme den Befunden, benennt Unsicherheit und vermeidet erfundene Dosierungen? Markiere eine Lücke, formuliere eine konkrete Berichtigung und bitte um Änderung.\n\nNach der Berichtigung dient die Einschätzung 1–5 der Wahl weiterer Übungen. Sie ist hilfreiches Feedback, kein Bestehen; maßgeblich sind der Bericht und die getrennte Produktprüfung durch eine reale Lehrkraft.', 'Lies den Bericht eines Partners als Betrieb: Sind Feld, Probe und Kultur erkennbar? Stehen Datum, Methode, Einheit und Quelle bei jedem Wert? Beruht „niedrig, optimal, hoch“ auf passender Laborreferenz? Folgt jede Maßnahme den Befunden, benennt Unsicherheit und vermeidet erfundene Dosierungen? Markiere eine Lücke, formuliere eine konkrete Berichtigung und bitte um Änderung.\n\nNach der Berichtigung dient die Einschätzung eins bis fünf der Wahl weiterer Übungen. Sie ist hilfreiches Feedback, kein Bestehen; maßgeblich sind der Bericht und die getrennte Produktprüfung durch eine reale Lehrkraft.'), ('Statt chemischem Jargon: „Der gemessene pH ist 5.0, also sauer. Vor Mittel und Menge benötigen wir Kulturziel und Kalkbedarfstest.“ Das 10^-5 mol/L der Quelle ist ein vereinfachtes Konzentrationsbeispiel, keine exakte pH-Definition; formal beruht pH auf der Wasserstoffionenaktivität. Etwa 7 gilt als neutral, darunter sauer, darüber alkalisch; passende Bereiche hängen von Kultur und Methode ab. N fördert vegetatives Wachstum, P beteiligt sich an Wurzeln und Fortpflanzung, K an vielen Pflanzenfunktionen. Ein Symptom beweist keinen einzelnen Mangel.\n\nOrganische Substanz wirkt an Struktur sowie Wasser- und Nährstoffkreisläufen mit; „mehr ist immer besser“ stimmt nicht. Die Kationenaustauschkapazität (KAK/CEC) beschreibt die Bindung austauschbarer positiver Ionen wie K, Ca und Mg und hängt von Tonmineralen und organischer Substanz ab; sie misst nicht alle Nährstoffe oder Nitrat. Im Zweiergespräch erklärt eine Person organische Substanz, die andere N-P-K für Neulinge; danach tauschen und verbessern sie ihre Sätze. Auch die Grafik darf kein Symptom einer einzigen sicheren Ursache zuordnen.', 'Statt chemischem Jargon: „Der gemessene Pe Ha ist fünf Komma null, also sauer. Vor Mittel und Menge benötigen wir Kulturziel und Kalkbedarfstest.“ Das zehn hoch minus fünf Mol pro Liter der Quelle ist ein vereinfachtes Konzentrationsbeispiel, keine exakte Pe Ha-Definition; formal beruht Pe Ha auf der Wasserstoffionenaktivität. Etwa sieben gilt als neutral, darunter sauer, darüber alkalisch; passende Bereiche hängen von Kultur und Methode ab. En fördert vegetatives Wachstum, Pe beteiligt sich an Wurzeln und Fortpflanzung, Ka an vielen Pflanzenfunktionen. Ein Symptom beweist keinen einzelnen Mangel.\n\nOrganische Substanz wirkt an Struktur sowie Wasser- und Nährstoffkreisläufen mit; „mehr ist immer besser“ stimmt nicht. Die Kationenaustauschkapazität (Ka A Ka, Ce E Ce) beschreibt die Bindung austauschbarer positiver Ionen wie Ka, Kalzium und Magnesium und hängt von Tonmineralen und organischer Substanz ab; sie misst nicht alle Nährstoffe oder Nitrat. Im Zweiergespräch erklärt eine Person organische Substanz, die andere En Pe Ka für Neulinge; danach tauschen und verbessern sie ihre Sätze. Auch die Grafik darf kein Symptom einer einzigen sicheren Ursache zuordnen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s215-readings-audio-20261023-r1'
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
