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
IDS = ('S3-02-ar-EG-R01-r1', 'S3-02-ar-EG-R02-r1', 'S3-02-ar-EG-R03-r1', 'S3-02-ar-EG-R04-r1', 'S3-02-ar-EG-R05-r1', 'S3-02-ar-EG-R06-r1', 'S3-02-ar-EG-R07-r1', 'S3-02-en-R01-r1', 'S3-02-en-R02-r1', 'S3-02-en-R03-r1', 'S3-02-en-R04-r1', 'S3-02-en-R05-r1', 'S3-02-en-R06-r1', 'S3-02-en-R07-r1', 'S3-02-it-R01-r1', 'S3-02-it-R02-r1', 'S3-02-it-R03-r1', 'S3-02-it-R04-r1', 'S3-02-it-R05-r1', 'S3-02-it-R06-r1', 'S3-02-it-R07-r1', 'S3-02-de-R01-r1', 'S3-02-de-R02-r1', 'S3-02-de-R03-r1', 'S3-02-de-R04-r1', 'S3-02-de-R05-r1', 'S3-02-de-R06-r1', 'S3-02-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S302_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-02')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s302-readings-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('اكتب محصولين على الأقل من كل مجموعة واشرح سبب اختيار كل واحد. نموذج الحل يقترح الذرة والشعير من الحبوب؛ فول الصويا والبرسيم أو البرسيم الحجازي من البقوليات؛ الجزر أو البطاطس ومعهما الخس أو السبانخ من الخضار؛ الفراولة والشمام من الفاكهة. دي احتمالات، مش ملاءمة مثبتة. افحص الصنف والموسم والتحليل والصرف والمياه والآفات والمعدات والسوق قبل نصيحة الزراعة. محصول بقولي للغطاء أو العلف يختلف في الغرض وأثر الحصاد عن محصول بناخد إنتاجه.\n\nالفراولة مش شجرة بستان. والبرسيم أو البرسيم الحجازي أو زراعة فاكهة مستمرة ممكن تشغل الأرض لأكتر من سنة. اسأل هتتأسس وتفضل قد إيه، وهل هتتحصد أو تُنهى، وإيه متطلباتها من الحموضة والصرف. ما تحطش محصول معمّر في خانة موسم واحد من جدول دورة سنوية من غير ما توضح النتيجة.', 'اكتب محصولين على الأقل من كل مجموعة واشرح سبب اختيار كل واحد. نموذج الحل يقترح الذرة والشعير من الحبوب؛ فول الصويا والبرسيم أو البرسيم الحجازي من البقوليات؛ الجزر أو البطاطس ومعهما الخس أو السبانخ من الخضار؛ الفراولة والشمام من الفاكهة. دي احتمالات، مش ملاءمة مثبتة. افحص الصنف والموسم والتحليل والصرف والمياه والآفات والمعدات والسوق قبل نصيحة الزراعة. محصول بقولي للغطاء أو العلف يختلف في الغرض وأثر الحصاد عن محصول بناخد إنتاجه.\n\nالفراولة مش شجرة بستان. والبرسيم أو البرسيم الحجازي أو زراعة فاكهة مستمرة ممكن تشغل الأرض لأكتر من سنة. اسأل هتتأسس وتفضل قد إيه، وهل هتتحصد أو هتتنهى، وإيه متطلباتها من الحموضة والصرف. ما تحطش محصول معمّر في خانة موسم واحد من جدول دورة سنوية من غير ما توضح النتيجة.'), ('الخس والقمح أمثلة لمحاصيل تناسب موسم أبرد، والذرة والطماطم مثالين لموسم أدفأ. دي مقارنة موسمية، مش تقويم زراعة صالح لكل مكان. طابق المحصول والصنف مع الحرارة المحلية وطول موسم النمو. قارن احتياج المياه بالمطر الموثوق والري المتاح؛ الذرة الرفيعة ممكن تتحمل الجفاف نسبيًا، لكن تحمل الجفاف ما يعنيش إنها مش محتاجة مياه.\n\nشدة الضوء والشمس المباشرة وطول النهار بيأثروا على نمو وتزهير ونضج المحاصيل بطرق مختلفة. ٦–٨ ساعات شمس مباشرة مثال شائع لظروف الشمس الكاملة، مش احتياج موحد لكل محصول. سجل ضوء الموقع واحتياج المحصول قبل الحكم. لو هننقل المثال لمكان في مصر، لازم بيانات مناخ وموسم ومياه حقيقية؛ تغيير اسم مكان المثال المعتدل مش توطين.', 'الخس والقمح أمثلة لمحاصيل تناسب موسم أبرد، والذرة والطماطم مثالين لموسم أدفأ. دي مقارنة موسمية، مش تقويم زراعة صالح لكل مكان. طابق المحصول والصنف مع الحرارة المحلية وطول موسم النمو. قارن احتياج المياه بالمطر الموثوق والري المتاح؛ الذرة الرفيعة ممكن تتحمل الجفاف نسبيًا، لكن تحمل الجفاف ما يعنيش إنها مش محتاجة مياه.\n\nشدة الضوء والشمس المباشرة وطول النهار بيأثروا على نمو وتزهير ونضج المحاصيل بطرق مختلفة. ستة إلى تمانية ساعات شمس مباشرة مثال شائع لظروف الشمس الكاملة، مش احتياج موحد لكل محصول. سجل ضوء الموقع واحتياج المحصول قبل الحكم. لو هننقل المثال لمكان في مصر، لازم بيانات مناخ وموسم ومياه حقيقية؛ تغيير اسم مكان المثال المعتدل مش توطين.'), ('بما إن النيتروجين المقاس منخفض بعد تلات مواسم ذرة، ففحص محصول بقولي مناسب للموقع اختيار معقول للسنة الأولى؛ بشرط ملاءمة المحصول وتكوّن عقد فعالة والموسم والمياه وتاريخ الآفات، وهل الغرض حصاد ولا غطاء. تثبيت النيتروجين والرصيد للمحصول التالي مش مضمونين ولا بديلًا تلقائيًا لكل السماد. نقص الغلة ممكن يرتبط بالمياه أو الانضغاط أو الآفات أو الأمراض أو الملوحة وغيرها؛ اجمع دليل قبل تحديد السبب.\n\nنشاط التوسّع ممكن يضيف سنة رابعة أو محصول غطاء من البرسيم أو أثر السوق والمعدات أو معجم ورسمة للمحاصيل. دي إضافات للحالة، وما تلغيش احتياجات المحصول أو مدة شغل المعمّر للأرض. ترتيب التلات سنين وتعليل كل سنة بيتدرس ويتقيّم في الخطوة الجاية.', 'بما إن النيتروجين المقاس منخفض بعد تلات مواسم ذرة، ففحص محصول بقولي مناسب للموقع اختيار معقول للسنة الأولى؛ بشرط ملاءمة المحصول وتكوّن عقد فعالة والموسم والمياه وتاريخ الآفات، وهل الغرض حصاد ولا غطاء. تثبيت النيتروجين والرصيد للمحصول التالي مش مضمونين ولا بديل تلقائي لكل السماد. نقص الغلة ممكن يرتبط بالمياه أو الانضغاط أو الآفات أو الأمراض أو الملوحة وغيرها؛ اجمع دليل قبل تحديد السبب.\n\nنشاط التوسّع ممكن يضيف سنة رابعة أو محصول غطاء من البرسيم أو أثر السوق والمعدات أو معجم ورسمة للمحاصيل. دي إضافات للحالة، وما تلغيش احتياجات المحصول أو مدة شغل المعمّر للأرض. ترتيب التلات سنين وتعليل كل سنة بيتدرس ويتقيّم في الخطوة الجاية.'), ('حقل لزج والمياه واقفة فيه أيام ممكن يكون غنيًا بالطين، لكن الملاحظة وحدها ما تثبتش القوام. الانضغاط أو طبقة غير نافذة أو منسوب مياه مرتفع أو مخرج صرف مسدود ممكن يعملوا النتيجة نفسها. افحص قطاع التربة والصرف والقوام قبل ما تاخد إجراء.\n\nمن المعقول نقلق على الجزر في منطقة جذور مشبعة أو فيها عوائق؛ الجذر المتضخم ممكن يتشوّه أو يعاني قلة تهوية. ما تصفش محصول بديل أو علاج صرف قبل ما تحدد السبب واحتياجات المحصول فعليًا.', 'حقل لزج والمياه واقفة فيه أيام ممكن يكون غني بالطين، لكن الملاحظة وحدها ما تثبتش القوام. الانضغاط أو طبقة غير نافذة أو منسوب مياه مرتفع أو مخرج صرف مسدود ممكن يعملوا النتيجة نفسها. افحص قطاع التربة والصرف والقوام قبل ما تاخد إجراء.\n\nمن المعقول نقلق على الجزر في منطقة جذور مشبعة أو فيها عوائق؛ الجذر المتضخم ممكن يتشوّه أو يعاني قلة تهوية. ما تصفش محصول بديل أو علاج صرف قبل ما تحدد السبب واحتياجات المحصول فعليًا.'), ('رقم pH يعبّر عن حموضة التربة أو قلويتها. المدى 6.0–7.0 في المثال التعليمي مفيد لكثير من المحاصيل، لكن 6.0 حمضي قليلًا و7.0 متعادل، ومفيش مدى واحد مناسب للكل. التوت الأزرق استثناء واضح: محتاج منطقة جذور حمضية بوضوح وجيدة الصرف؛ pH \u200f6.2 مش موقع جاهز له. الصنف والتحليل والتوصية المحلية يحددوا هل تعديل الحموضة ممكن أصلًا.\n\nاقرأ نتائج النيتروجين والفوسفور والبوتاسيوم كل واحد لوحده، وما تستبدلش التحليل بلون التربة أو قوامها. تقرير نيتروجين منخفض ما يثبتش إن ده السبب الوحيد لنقص الغلة. وكفاية الفوسفور والبوتاسيوم في الحالة التعليمية ما تعنيش إلغاء الفحص أو الإدارة بعد كده.', 'رقم بي إتش يعبّر عن حموضة التربة أو قلويتها. المدى ستة فاصلة صفر إلى سبعة فاصلة صفر في المثال التعليمي مفيد لكثير من المحاصيل، لكن ستة فاصلة صفر حمضي شوية وسبعة فاصلة صفر متعادل، ومفيش مدى واحد مناسب للكل. التوت الأزرق استثناء واضح: محتاج منطقة جذور حمضية بوضوح وجيدة الصرف؛ بي إتش ستة فاصلة اتنين مش موقع جاهز له. الصنف والتحليل والتوصية المحلية يحددوا هل تعديل الحموضة ممكن أصلًا.\n\nاقرأ نتائج النيتروجين والفوسفور والبوتاسيوم كل واحد لوحده، وما تستبدلش التحليل بلون التربة أو قوامها. تقرير نيتروجين منخفض ما يثبتش إن ده السبب الوحيد لنقص الغلة. وكفاية الفوسفور والبوتاسيوم في الحالة التعليمية ما تعنيش إلغاء الفحص أو الإدارة بعد كده.'), ('مزارع الحالة عنده ١٠ هكتارات، تربتها لوم رملي، pH \u200f6.2 (حمضية قليلًا)، النيتروجين منخفض بالتحليل، والفوسفور والبوتاسيوم كافيين. المناخ المذكور معتدل بمطر متوسط، ويتيح في المثال محاصيل للمواسم الأدفأ والأبرد. الذرة اتزرعت تلات سنين متتابعة والغلة المبلغ عنها قلت. اسم المكان غير محدد، فالمناخ ده مش بيانات من موقع مصري.\n\nالنشاط أربع أجزاء مترابطة: ١٠ دقايق لتحليل المرشحين، ١٠ لاختيار رد السنة الأولى، ١٥ لبناء وتعليل ترتيب تلات سنين، و١٠ لمقارنة الخطط في مجموعة؛ الإجمالي ٤٥ دقيقة. الخطوة دي بتكمل تحليل الموقع وتوصية السنة الأولى، والخطوة الجاية بتدرّس وتقيم خطة التلات سنين والمقارنة. النقاش يساعد، لكن كل طالب يكتب منطقه بنفسه.\n\nالسيد إيفانز · حالة تعليمية بمناخ معتدل ومساحة 10 هكتارات. دي معطيات حالة تدريب، مش قياساتك من الحقل. الموقع مش محدد. حافظ على المناخ والتربة وتاريخ المحاصيل زي ما هم؛ مفيش مكان مصري متحقق منه. مجموعات 3–4 بورق وقلم أو ورقة التدريب دي. الأجزاء الأربعة 45 دقيقة نشاط: 10 تحليل و10 اختيار السنة الأولى هنا؛ و15 خطة تلات سنين و10 مقارنة في الخطوة الجاية. دقيقتين التجهيز المذكورين لوحدهم للتحضير، مش بنحسبهم جوّه الـ45 من غير توضيح. كل طالب يقدّم تفسيره هو. السنة الرابعة وغطاء البرسيم والسوق والمعدات والمعجم ورسمة الخطة امتدادات للتدريب.', 'مزارع الحالة عنده عشرة هكتارات، تربتها لوم رملي، بي إتش ستة فاصلة اتنين (حمضية شوية)، النيتروجين منخفض بالتحليل، والفوسفور والبوتاسيوم كافيين. المناخ المذكور معتدل بمطر متوسط، ويتيح في المثال محاصيل للمواسم الأدفأ والأبرد. الذرة اتزرعت تلات سنين متتابعة والغلة المبلغ عنها قلت. اسم المكان غير محدد، فالمناخ ده مش بيانات من موقع مصري.\n\nالنشاط أربع أجزاء مترابطة: عشرة دقايق لتحليل المرشحين، عشرة لاختيار رد السنة الأولى، خمستاشر لبناء وتعليل ترتيب تلات سنين، وعشرة لمقارنة الخطط في مجموعة؛ الإجمالي خمسة وأربعين دقيقة. الخطوة دي بتكمل تحليل الموقع وتوصية السنة الأولى، والخطوة الجاية بتدرّس وتقيم خطة التلات سنين والمقارنة. النقاش يساعد، لكن كل طالب يكتب منطقه بنفسه.\n\nالسيد إيفانز · حالة تعليمية بمناخ معتدل ومساحة عشرة هكتارات. دي معطيات حالة تدريب، مش قياساتك من الحقل. الموقع مش محدد. حافظ على المناخ والتربة وتاريخ المحاصيل زي ما هم؛ مفيش مكان مصري متحقق منه. مجموعات تلاتة إلى أربعة بورق وقلم أو ورقة التدريب دي. الأجزاء الأربعة خمسة وأربعين دقيقة نشاط: عشرة تحليل وعشرة اختيار السنة الأولى هنا؛ وخمستاشر خطة تلات سنين وعشرة مقارنة في الخطوة الجاية. دقيقتين التجهيز المذكورين لوحدهم للتحضير، مش بنحسبهم جوه خمسة وأربعين دقيقة من غير توضيح. كل طالب يقدّم تفسيره هو. السنة الرابعة وغطاء البرسيم والسوق والمعدات والمعجم ورسمة الخطة امتدادات للتدريب.')], 'en': [('Because tested nitrogen is low after three maize crops, a suitable legume is a reasonable group to investigate for year one, subject to crop fit, compatible nodulation, season, water, pest history and the intended harvest or cover-crop use. Its nitrogen fixation and later credit are conditional and measurable, not a guaranteed replacement for all fertiliser. Declining yield might also reflect water, compaction, pests, disease, salinity or other constraints; collect evidence before deciding why it fell.\n\nAn extension challenge may ask for a fourth year, a clover cover crop, market/equipment implications or a crop glossary and diagram. These enrich the adviser exercise; they do not override the crop requirements or the time a perennial remains in the field. The three-year sequence and year-by-year justifications are taught and assessed in the following step.', 'Because tested nitrogen is low after three maize crops, a suitable legume is a reasonable group to investigate for year one, subject to crop fit, compatible nodulation, season, water, pest history and the intended harvest or cover-crop use. Its nitrogen fixation and later credit are conditional and measurable, not a guaranteed replacement for all fertiliser. Declining yield might also reflect water, compaction, pests, disease, salinity or other constraints; collect evidence before deciding why it fell.\n\nAn extension challenge may ask for a fourth year, a clover cover crop, market, equipment implications or a crop glossary and diagram. These enrich the adviser exercise; they do not override the crop requirements or the time a perennial remains in the field. The three-year sequence and year-by-year justifications are taught and assessed in the following step.'), ("Record the field's texture, structure, drainage, pH, nutrient test, irrigation or rainfall, temperature and season before narrowing candidates. Sandy soil often drains readily but may retain less water and soluble nutrients. Clay-rich soil can retain more cations and water yet may be difficult to work if compacted or wet. Loam balances particle fractions, but the word alone does not certify drainage, aeration or fertility. Keep local terms for sand, loam and clay distinct when translating them.\n\nMatch each crop's actual requirements with measured or observed site qualities. A group-level association is only a first clue. A carrot root needs a workable, unobstructed rooting zone, not one compulsory texture label. Some cereals tolerate wet conditions better than others; do not call all grains flood-tolerant. Soil structure, slope, water table and salinity may overturn a simple texture guess.", "Record the field's texture, structure, drainage, P H, nutrient test, irrigation or rainfall, temperature and season before narrowing candidates. Sandy soil often drains readily but may retain less water and soluble nutrients. Clay-rich soil can retain more cations and water yet may be difficult to work if compacted or wet. Loam balances particle fractions, but the word alone does not certify drainage, aeration or fertility. Keep local terms for sand, loam and clay distinct when translating them.\n\nMatch each crop's actual requirements with measured or observed site qualities. A group-level association is only a first clue. A carrot root needs a workable, unobstructed rooting zone, not one compulsory texture label. Some cereals tolerate wet conditions better than others; do not call all grains flood-tolerant. Soil structure, slope, water table and salinity may overturn a simple texture guess."), ('Soil pH measures acidity or alkalinity. The classroom range pH 6.0–7.0 is a useful example for many crops, but 6.0 is slightly acidic, 7.0 is neutral and no single range suits every crop. Blueberry is a deliberate exception: it requires a distinctly acidic, well-drained root zone; pH 6.2 should not be treated as a ready blueberry site. The crop variety, soil test and local guidance determine whether adjustment is feasible.\n\nRead nitrogen, phosphorus and potassium results as separate test findings rather than substituting soil colour or texture. A low-N report does not prove that nitrogen alone caused a yield decline, and adequate P/K in a teaching case is not permission to skip all later testing or management.', 'Soil P H measures acidity or alkalinity. The classroom range P H six point zero to seven point zero is a useful example for many crops, but six point zero is slightly acidic, seven point zero is neutral and no single range suits every crop. Blueberry is a deliberate exception: it requires a distinctly acidic, well-drained root zone; P H six point two should not be treated as a ready blueberry site. The crop variety, soil test and local guidance determine whether adjustment is feasible.\n\nRead nitrogen, phosphorus and potassium results as separate test findings rather than substituting soil colour or texture. A low-N report does not prove that nitrogen alone caused a yield decline, and adequate P, K in a teaching case is not permission to skip all later testing or management.'), ('The classroom farmer has a 10-hectare field with sandy loam, pH 6.2 (slightly acidic), low tested nitrogen and adequate tested phosphorus and potassium. Its stated climate is temperate with moderate rainfall, suitable in the exercise for warm- and cool-season candidates. Maize has been grown for three successive years and the reported yield has declined. The location is unfilled, so these climate statements cannot be presented as observations from an Egyptian site.\n\nThe activity has four linked parts: 10 minutes analysing candidates, 10 minutes choosing a year-one response, 15 minutes building and explaining a three-year sequence, and 10 minutes comparing plans with a group (45 minutes total). This step completes the site analysis and immediate recommendation; the next rotation step retains and assesses the full three-year plan and comparison. Group talk supports learning, while each student must submit their own reasoning.\n\nMr Evans · 10-hectare temperate teaching case. Supplied classroom facts, not your field measurements. The location is unspecified. Keep climate, soil and crop history unchanged; no Egyptian locality is verified. Groups of 3–4 use pens/paper or this worksheet. The four parts total 45 active minutes: 10 analysis + 10 first-year choice here; 15 three-year plan + 10 comparison in the next step. The separate 2-minute setup is preparation, not silently included in 45. Every learner submits their own reasoning. A fourth year, clover cover crop, market/equipment discussion, crop glossary and drawn plan remain extensions.', 'The classroom farmer has a ten-hectare field with sandy loam, P H six point two (slightly acidic), low tested nitrogen and adequate tested phosphorus and potassium. Its stated climate is temperate with moderate rainfall, suitable in the exercise for warm- and cool-season candidates. Maize has been grown for three successive years and the reported yield has declined. The location is unfilled, so these climate statements cannot be presented as observations from an Egyptian site.\n\nThe activity has four linked parts: ten minutes analysing candidates, ten minutes choosing a year-one response, fifteen minutes building and explaining a three-year sequence, and ten minutes comparing plans with a group (forty-five minutes total). This step completes the site analysis and immediate recommendation; the next rotation step retains and assesses the full three-year plan and comparison. Group talk supports learning, while each student must submit their own reasoning.\n\nMr Evans · ten-hectare temperate teaching case. Supplied classroom facts, not your field measurements. The location is unspecified. Keep climate, soil and crop history unchanged; no Egyptian locality is verified. Groups of three to four use pens, paper or this worksheet. The four parts total forty-five active minutes: ten analysis plus ten first-year choice here; fifteen three-year plan plus ten comparison in the next step. The separate two-minute setup is preparation, not silently included in forty-five. Every learner submits their own reasoning. A fourth year, clover cover crop, market, equipment discussion, crop glossary and drawn plan remain extensions.'), ('Write at least two candidates per group and explain each. The worked case proposes maize and barley (grains); soybean and clover or alfalfa (legumes); carrot or potato plus lettuce or spinach (vegetables); strawberry and melon (fruits). Retain these alternatives as possibilities, not proven fits. Check variety and season, soil test, drainage, water, pests, available equipment and market before advising planting. Soybean and forage/cover legumes may have different harvest and land-use purposes.\n\nStrawberry is not an orchard tree, and a clover or alfalfa stand, a perennial fruit planting or another continuing crop may occupy land beyond a one-year annual slot. Ask how long it establishes and remains, whether it is harvested or terminated, and what its pH and drainage requirements are. Do not force a perennial into a one-season rotation table without stating those consequences.', 'Write at least two candidates per group and explain each. The worked case proposes maize and barley (grains); soybean and clover or alfalfa (legumes); carrot or potato plus lettuce or spinach (vegetables); strawberry and melon (fruits). Retain these alternatives as possibilities, not proven fits. Check variety and season, soil test, drainage, water, pests, available equipment and market before advising planting. Soybean and forage, cover legumes may have different harvest and land-use purposes.\n\nStrawberry is not an orchard tree, and a clover or alfalfa stand, a perennial fruit planting or another continuing crop may occupy land beyond a one-year annual slot. Ask how long it establishes and remains, whether it is harvested or terminated, and what its P H and drainage requirements are. Do not force a perennial into a one-season rotation table without stating those consequences.')], 'it': [('Il coltivatore del caso ha 10 ettari franco-sabbiosi, pH 6,2 (lievemente acido), azoto basso nell’analisi e fosforo e potassio adeguati. Il clima dichiarato è temperato, con pioggia moderata; nell’esercizio consente candidati delle stagioni calde e fresche. Mais è stato coltivato per tre anni consecutivi e la resa dichiarata è diminuita. La località non è specificata: queste condizioni non sono osservazioni egiziane.\n\nL’attività comprende quattro parti: 10 minuti per analizzare i candidati, 10 per scegliere la risposta del primo anno, 15 per costruire e giustificare una sequenza triennale, 10 per confrontare i piani nel gruppo; totale 45 minuti. Qui si completano analisi del sito e raccomandazione immediata; la tappa seguente insegna e valuta rotazione triennale e confronto. La discussione aiuta, ma ogni studente consegna il proprio ragionamento.\n\nSignor Evans · caso temperato di 10 ettari. Dati didattici forniti, non tue misure. Località ignota; mantenere clima, suolo e storia senza dichiarare verificata una località egiziana. Gruppi di 3–4, carta e penne o questa scheda. Quattro parti: 45 minuti attivi, 10 analisi +10 primo anno qui;15 piano triennale +10 confronto nella tappa successiva. I2minuti di preparazione sono separati, senza nasconderli nel45. Ognuno consegna il proprio ragionamento. Quarto anno, trifoglio di copertura, mercato/attrezzi, glossario e disegno restano ampliamenti.', 'Il coltivatore del caso ha dieci ettari franco-sabbiosi, pi acca sei virgola due (lievemente acido), azoto basso nell’analisi e fosforo e potassio adeguati. Il clima dichiarato è temperato, con pioggia moderata; nell’esercizio consente candidati delle stagioni calde e fresche. Mais è stato coltivato per tre anni consecutivi e la resa dichiarata è diminuita. La località non è specificata: queste condizioni non sono osservazioni egiziane.\n\nL’attività comprende quattro parti: dieci minuti per analizzare i candidati, dieci per scegliere la risposta del primo anno, quindici per costruire e giustificare una sequenza triennale, dieci per confrontare i piani nel gruppo; totale quarantacinque minuti. Qui si completano analisi del sito e raccomandazione immediata; la tappa seguente insegna e valuta rotazione triennale e confronto. La discussione aiuta, ma ogni studente consegna il proprio ragionamento.\n\nSignor Evans, caso temperato di dieci ettari. Dati didattici forniti, non tue misure. Località ignota; mantenere clima, suolo e storia senza dichiarare verificata una località egiziana. Gruppi da tre a quattro persone, carta e penne o questa scheda. Quattro parti per quarantacinque minuti attivi: dieci minuti di analisi e dieci minuti per il primo anno qui; quindici minuti per il piano triennale e dieci minuti di confronto nella tappa successiva. I due minuti di preparazione sono separati, senza nasconderli nei quarantacinque minuti. Ognuno consegna il proprio ragionamento. Quarto anno, trifoglio di copertura, mercato e attrezzi, glossario e disegno restano ampliamenti.'), ('Il pH del suolo misura acidità o alcalinità. L’intervallo didattico 6,0–7,0 è utile per molte colture, ma 6,0 è lievemente acido, 7,0 neutro e nessun intervallo vale per tutte. Il mirtillo è l’eccezione intenzionale: richiede una zona radicale nettamente acida e ben drenata; pH 6,2 non è un sito già pronto. Varietà, analisi e consulenza locale determinano se correggere stabilmente il pH è fattibile.\n\nLeggere azoto, fosforo e potassio come risultati distinti, senza sostituire l’analisi con colore o tessitura. Un valore basso di N non prova che l’azoto sia l’unica causa del calo di resa; P e K adeguati nel caso non autorizzano a rinunciare a future verifiche o alla gestione.', 'Il pi acca del suolo misura acidità o alcalinità. L’intervallo didattico sei virgola zero a sette virgola zero è utile per molte colture, ma sei virgola zero è lievemente acido, sette virgola zero neutro e nessun intervallo vale per tutte. Il mirtillo è l’eccezione intenzionale: richiede una zona radicale nettamente acida e ben drenata; pi acca sei virgola due non è un sito già pronto. Varietà, analisi e consulenza locale determinano se correggere stabilmente il pi acca è fattibile.\n\nLeggere azoto, fosforo e potassio come risultati distinti, senza sostituire l’analisi con colore o tessitura. Un valore basso di enne non prova che l’azoto sia l’unica causa del calo di resa; pi e cappa adeguati nel caso non autorizzano a rinunciare a future verifiche o alla gestione.'), ('Registrare tessitura, struttura, drenaggio, pH, analisi dei nutrienti, irrigazione o pioggia, temperatura e stagione prima di restringere i candidati. La sabbia spesso drena facilmente ma può trattenere meno acqua e nutrienti solubili. Un terreno ricco di argilla può trattenere più acqua e cationi, ma essere difficile da lavorare se compattato o bagnato. Il franco ha frazioni granulometriche bilanciate, ma il nome non garantisce drenaggio, aerazione o fertilità. Tenere distinti sabbia, franco e argilla nella terminologia locale.\n\nConfrontare le esigenze reali di ogni coltura con qualità misurate o osservate. L’associazione generale tra un gruppo e un suolo è solo un indizio. La carota necessita di uno spazio radicale lavorabile e non ostruito, non di una sola tessitura obbligatoria. Alcuni cereali tollerano condizioni umide meglio di altri; non tutti tollerano l’allagamento. Struttura, pendenza, falda e salinità possono smentire una deduzione basata sulla sola tessitura.', 'Registrare tessitura, struttura, drenaggio, pi acca, analisi dei nutrienti, irrigazione o pioggia, temperatura e stagione prima di restringere i candidati. La sabbia spesso drena facilmente ma può trattenere meno acqua e nutrienti solubili. Un terreno ricco di argilla può trattenere più acqua e cationi, ma essere difficile da lavorare se compattato o bagnato. Il franco ha frazioni granulometriche bilanciate, ma il nome non garantisce drenaggio, aerazione o fertilità. Tenere distinti sabbia, franco e argilla nella terminologia locale.\n\nConfrontare le esigenze reali di ogni coltura con qualità misurate o osservate. L’associazione generale tra un gruppo e un suolo è solo un indizio. La carota necessita di uno spazio radicale lavorabile e non ostruito, non di una sola tessitura obbligatoria. Alcuni cereali tollerano condizioni umide meglio di altri; non tutti tollerano l’allagamento. Struttura, pendenza, falda e salinità possono smentire una deduzione basata sulla sola tessitura.'), ('Scrivere almeno due candidati per gruppo e motivarli. Il modello propone mais e orzo (cereali); soia e trifoglio o erba medica (leguminose); carota o patata più lattuga o spinacio (ortaggi); fragola e melone (frutti). Sono possibilità, non idoneità dimostrate. Prima di consigliare la semina controllare varietà, stagione, analisi, drenaggio, acqua, organismi nocivi, attrezzature e mercato. Soia e leguminose da foraggio o copertura possono avere scopi e destini della biomassa diversi.\n\nLa fragola non è un albero da frutto. Un prato di trifoglio o erba medica, un impianto da frutto o altra coltura continuativa può occupare il terreno oltre un anno. Chiedere tempo di avvio e permanenza, raccolta o terminazione, requisiti di pH e drenaggio. Non forzare una perenne in una sola casella annuale senza esplicitare le conseguenze.', 'Scrivere almeno due candidati per gruppo e motivarli. Il modello propone mais e orzo (cereali); soia e trifoglio o erba medica (leguminose); carota o patata più lattuga o spinacio (ortaggi); fragola e melone (frutti). Sono possibilità, non idoneità dimostrate. Prima di consigliare la semina controllare varietà, stagione, analisi, drenaggio, acqua, organismi nocivi, attrezzature e mercato. Soia e leguminose da foraggio o copertura possono avere scopi e destini della biomassa diversi.\n\nLa fragola non è un albero da frutto. Un prato di trifoglio o erba medica, un impianto da frutto o altra coltura continuativa può occupare il terreno oltre un anno. Chiedere tempo di avvio e permanenza, raccolta o terminazione, requisiti di pi acca e drenaggio. Non forzare una perenne in una sola casella annuale senza esplicitare le conseguenze.')], 'de': [('Bei gemessen wenig N nach drei Maisjahren ist eine geeignete Leguminose ein vernünftiger Kandidat für Jahr eins, abhängig von Standortpassung, wirksamer Knöllchenbildung, Saison, Wasser, Schaderregergeschichte und Nutzung als Ernte- oder Deckfrucht. Fixierung und Gutschrift für die Folgekultur sind bedingt und müssen ermittelt werden; sie ersetzen nicht automatisch den gesamten Dünger. Sinkender Ertrag kann auch an Wasser, Verdichtung, Schädlingen, Krankheiten, Salz oder anderem liegen: erst Belege sammeln.\n\nAls Erweiterung sind ein viertes Jahr, Klee als Deckfrucht, Markt und Geräte oder Glossar und Skizze möglich. Diese Fragen erweitern den Fall, heben aber Kulturbedarf oder Standdauer mehrjähriger Bestände nicht auf. Die Dreijahresfolge mit Begründung für jedes Jahr folgt im nächsten Schritt.', 'Bei gemessen wenig En nach drei Maisjahren ist eine geeignete Leguminose ein vernünftiger Kandidat für Jahr eins, abhängig von Standortpassung, wirksamer Knöllchenbildung, Saison, Wasser, Schaderregergeschichte und Nutzung als Ernte- oder Deckfrucht. Fixierung und Gutschrift für die Folgekultur sind bedingt und müssen ermittelt werden; sie ersetzen nicht automatisch den gesamten Dünger. Sinkender Ertrag kann auch an Wasser, Verdichtung, Schädlingen, Krankheiten, Salz oder anderem liegen: erst Belege sammeln.\n\nAls Erweiterung sind ein viertes Jahr, Klee als Deckfrucht, Markt und Geräte oder Glossar und Skizze möglich. Diese Fragen erweitern den Fall, heben aber Kulturbedarf oder Standdauer mehrjähriger Bestände nicht auf. Die Dreijahresfolge mit Begründung für jedes Jahr folgt im nächsten Schritt.'), ('Der Boden-pH beschreibt Säure beziehungsweise Alkalität. Der Lehrbereich pH 6,0–7,0 ist für viele Kulturen ein hilfreiches Beispiel, aber 6,0 ist leicht sauer, 7,0 neutral und kein Bereich passt für alle. Heidelbeeren sind die bewusste Ausnahme: Sie brauchen einen deutlich sauren, gut drainierten Wurzelraum; pH 6,2 ist kein sofort geeigneter Standort. Sorte, Analyse und örtliche Beratung entscheiden, ob eine dauerhafte Änderung machbar ist.\n\nStickstoff, Phosphor und Kalium als getrennte Analysen lesen, nicht Bodenfarbe oder Körnung dafür einsetzen. Ein niedriger N-Wert beweist nicht, dass nur N den Ertragsrückgang verursacht hat. Im Lehrfall ausreichendes P/K heißt nicht, dass künftige Untersuchungen und Bewirtschaftung entfallen.', 'Der Boden-Pe Ha beschreibt Säure beziehungsweise Alkalität. Der Lehrbereich Pe Ha sechs Komma null bis sieben Komma null ist für viele Kulturen ein hilfreiches Beispiel, aber sechs Komma null ist leicht sauer, sieben Komma null neutral und kein Bereich passt für alle. Heidelbeeren sind die bewusste Ausnahme: Sie brauchen einen deutlich sauren, gut drainierten Wurzelraum; Pe Ha sechs Komma zwei ist kein sofort geeigneter Standort. Sorte, Analyse und örtliche Beratung entscheiden, ob eine dauerhafte Änderung machbar ist.\n\nStickstoff, Phosphor und Kalium als getrennte Analysen lesen, nicht Bodenfarbe oder Körnung dafür einsetzen. Ein niedriger En-Wert beweist nicht, dass nur En den Ertragsrückgang verursacht hat. Im Lehrfall ausreichendes Pe, Ka heißt nicht, dass künftige Untersuchungen und Bewirtschaftung entfallen.'), ('Der Landwirt im Lehrfall hat 10 ha sandigen Lehm, pH 6,2 (leicht sauer), einen niedrigen Stickstoffbefund sowie ausreichende Phosphor- und Kaliumbefunde. Beschrieben sind gemäßigtes Klima und mäßiger Regen, sodass im Beispiel Kandidaten für warme und kühle Saison betrachtet werden. Drei Jahre nacheinander wurde Mais angebaut; der gemeldete Ertrag ist gesunken. Ein genauer Ort fehlt: Das sind keine Beobachtungen aus Ägypten.\n\nDie Aufgabe hat vier Teile: 10 Minuten Kandidatenanalyse, 10 Minuten Reaktion für Jahr eins, 15 Minuten Aufbau und Begründung einer Dreijahresfolge und 10 Minuten Vergleich in der Gruppe; insgesamt 45 Minuten. Dieser Schritt behandelt Standortanalyse und erste Empfehlung, der nächste vermittelt und bewertet die Dreijahresfolge und den Vergleich. Austausch hilft beim Lernen; jede Person reicht eine eigene Begründung ein.\n\nHerr Evans · gemäßigter Lehrfall mit 10 Hektar. Vorgegebene Lehrdaten, keine eigenen Messungen. Ort unbekannt; Klima, Boden und Vorgeschichte bleiben erhalten. Kein ägyptischer Standort bestätigt. Gruppen von3–4 mit Papier/Stift oder Arbeitsblatt. Vier Teile:45aktive Minuten,10Analyse+10Jahr-eins-Wahl hier;15Dreijahresplan+10Vergleich im nächsten Schritt. Die2Vorbereitungsminuten sind getrennt, nicht unbemerkt in45 enthalten. Jede Person reicht eigene Gründe ein. Viertes Jahr, Klee-Deckfrucht, Markt/Geräte, Glossar und Planskizze bleiben Erweiterungen.', 'Der Landwirt im Lehrfall hat zehn Hektar sandigen Lehm, Pe Ha sechs Komma zwei (leicht sauer), einen niedrigen Stickstoffbefund sowie ausreichende Phosphor- und Kaliumbefunde. Beschrieben sind gemäßigtes Klima und mäßiger Regen, sodass im Beispiel Kandidaten für warme und kühle Saison betrachtet werden. Drei Jahre nacheinander wurde Mais angebaut; der gemeldete Ertrag ist gesunken. Ein genauer Ort fehlt: Das sind keine Beobachtungen aus Ägypten.\n\nDie Aufgabe hat vier Teile: zehn Minuten Kandidatenanalyse, zehn Minuten Reaktion für Jahr eins, fünfzehn Minuten Aufbau und Begründung einer Dreijahresfolge und zehn Minuten Vergleich in der Gruppe; insgesamt fünfundvierzig Minuten. Dieser Schritt behandelt Standortanalyse und erste Empfehlung, der nächste vermittelt und bewertet die Dreijahresfolge und den Vergleich. Austausch hilft beim Lernen; jede Person reicht eine eigene Begründung ein.\n\nHerr Evans, gemäßigter Lehrfall mit zehn Hektar. Vorgegebene Lehrdaten, keine eigenen Messungen. Ort unbekannt; Klima, Boden und Vorgeschichte bleiben erhalten. Kein ägyptischer Standort bestätigt. Gruppen von drei bis vier Personen mit Papier und Stift oder Arbeitsblatt. Vier Teile für fünfundvierzig aktive Minuten: zehn Minuten Analyse und zehn Minuten für die Jahr-eins-Wahl hier; fünfzehn Minuten für den Dreijahresplan und zehn Minuten Vergleich im nächsten Schritt. Die zwei Vorbereitungsminuten sind getrennt, nicht unbemerkt in den fünfundvierzig Minuten enthalten. Jede Person reicht eigene Gründe ein. Viertes Jahr, Klee-Deckfrucht, Markt und Geräte, Glossar und Planskizze bleiben Erweiterungen.'), ('Je Gruppe mindestens zwei Kandidaten nennen und begründen. Die Musterlösung schlägt Mais und Gerste (Getreide), Soja und Klee oder Luzerne (Leguminosen), Karotte oder Kartoffel plus Salat oder Spinat (Gemüse), Erdbeere und Melone (Obst) vor. Das sind Möglichkeiten, keine erwiesenen Treffer. Vor einer Empfehlung Sorte, Saison, Analysen, Drainage, Wasser, Schaderreger, Geräte und Markt prüfen. Soja und Futter- oder Deckungsleguminosen können unterschiedliche Zwecke und Erntefolgen haben.\n\nErdbeeren sind keine Obstbäume. Klee- oder Luzernebestand, mehrjährige Obstanlage oder andere Dauerkultur können eine Fläche länger als ein Jahr belegen. Nach Anlagezeit und Standdauer, Ernte oder Beendigung sowie pH und Drainage fragen. Eine Dauerkultur nicht ohne diese Folgen in ein einzelnes Jahresfeld einer Rotation zwingen.', 'Je Gruppe mindestens zwei Kandidaten nennen und begründen. Die Musterlösung schlägt Mais und Gerste (Getreide), Soja und Klee oder Luzerne (Leguminosen), Karotte oder Kartoffel plus Salat oder Spinat (Gemüse), Erdbeere und Melone (Obst) vor. Das sind Möglichkeiten, keine erwiesenen Treffer. Vor einer Empfehlung Sorte, Saison, Analysen, Drainage, Wasser, Schaderreger, Geräte und Markt prüfen. Soja und Futter- oder Deckungsleguminosen können unterschiedliche Zwecke und Erntefolgen haben.\n\nErdbeeren sind keine Obstbäume. Klee- oder Luzernebestand, mehrjährige Obstanlage oder andere Dauerkultur können eine Fläche länger als ein Jahr belegen. Nach Anlagezeit und Standdauer, Ernte oder Beendigung sowie Pe Ha und Drainage fragen. Eine Dauerkultur nicht ohne diese Folgen in ein einzelnes Jahresfeld einer Rotation zwingen.'), ('Vor der Vorauswahl Bodenart und -struktur, Drainage, pH, Nährstoffanalyse, Bewässerung oder Niederschlag, Temperatur und Saison erfassen. Sand entwässert oft schnell, kann aber weniger Wasser und gelöste Nährstoffe halten. Tonreicher Boden kann mehr Wasser und Kationen halten, ist bei Nässe oder Verdichtung jedoch schwer zu bearbeiten. Lehm enthält ausgewogenere Korngrößen; sein Name garantiert weder Drainage noch Belüftung noch Fruchtbarkeit. Sand, sandigen Lehm, Lehm und Ton sprachlich sauber trennen.\n\nDie tatsächlichen Ansprüche jeder Kultur mit gemessenen oder beobachteten Standorteigenschaften vergleichen. Eine Verbindung zwischen Kulturgruppe und Boden ist nur ein erster Hinweis. Karotten brauchen einen bearbeitbaren, hindernisfreien Wurzelraum, nicht zwingend eine einzige Bodenart. Manche Getreide vertragen Nässe besser als andere; nicht alle sind überflutungstolerant. Struktur, Hangneigung, Grundwasser und Salz können eine reine Bodenart-Vermutung widerlegen.', 'Vor der Vorauswahl Bodenart und -struktur, Drainage, Pe Ha, Nährstoffanalyse, Bewässerung oder Niederschlag, Temperatur und Saison erfassen. Sand entwässert oft schnell, kann aber weniger Wasser und gelöste Nährstoffe halten. Tonreicher Boden kann mehr Wasser und Kationen halten, ist bei Nässe oder Verdichtung jedoch schwer zu bearbeiten. Lehm enthält ausgewogenere Korngrößen; sein Name garantiert weder Drainage noch Belüftung noch Fruchtbarkeit. Sand, sandigen Lehm, Lehm und Ton sprachlich sauber trennen.\n\nDie tatsächlichen Ansprüche jeder Kultur mit gemessenen oder beobachteten Standorteigenschaften vergleichen. Eine Verbindung zwischen Kulturgruppe und Boden ist nur ein erster Hinweis. Karotten brauchen einen bearbeitbaren, hindernisfreien Wurzelraum, nicht zwingend eine einzige Bodenart. Manche Getreide vertragen Nässe besser als andere; nicht alle sind überflutungstolerant. Struktur, Hangneigung, Grundwasser und Salz können eine reine Bodenart-Vermutung widerlegen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s302-readings-audio-20261023-r1'
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
