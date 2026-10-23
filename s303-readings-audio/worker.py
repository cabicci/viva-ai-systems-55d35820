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
IDS = ('S3-03-ar-EG-R01-r1', 'S3-03-ar-EG-R02a-r1', 'S3-03-ar-EG-R02b-r1', 'S3-03-ar-EG-R02c-r1', 'S3-03-ar-EG-R03-r1', 'S3-03-ar-EG-R04a-r1', 'S3-03-ar-EG-R04b-r1', 'S3-03-ar-EG-R05-r1', 'S3-03-ar-EG-R06-r1', 'S3-03-ar-EG-R07-r1', 'S3-03-en-R01-r1', 'S3-03-en-R02a-r1', 'S3-03-en-R02b-r1', 'S3-03-en-R02c-r1', 'S3-03-en-R03-r1', 'S3-03-en-R04a-r1', 'S3-03-en-R04b-r1', 'S3-03-en-R05-r1', 'S3-03-en-R06-r1', 'S3-03-en-R07-r1', 'S3-03-it-R01-r1', 'S3-03-it-R02a-r1', 'S3-03-it-R02b-r1', 'S3-03-it-R02c-r1', 'S3-03-it-R03-r1', 'S3-03-it-R04a-r1', 'S3-03-it-R04b-r1', 'S3-03-it-R05-r1', 'S3-03-it-R06-r1', 'S3-03-it-R07-r1', 'S3-03-de-R01-r1', 'S3-03-de-R02a-r1', 'S3-03-de-R02b-r1', 'S3-03-de-R02c-r1', 'S3-03-de-R03-r1', 'S3-03-de-R04a-r1', 'S3-03-de-R04b-r1', 'S3-03-de-R05-r1', 'S3-03-de-R06-r1', 'S3-03-de-R07-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==40
    assert(req['scope'],req['stepId'])==('S303_FORTY_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-03')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(40,40,40,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s303-readings-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==40
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(10))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02a': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R02b': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02c': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04a': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R04b': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R05': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R06': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R07': ('B', 'Kore', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02a': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R02b': ['/reading/1/paragraphs/2', '/reading/1/paragraphs/3'], 'R02c': ['/reading/1/paragraphs/4', '/reading/1/paragraphs/5'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04a': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R04b': ['/reading/3/paragraphs/2'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1'], 'R07': ['/reading/6/paragraphs/0']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('أولًا إدارة المغذيات: المحاصيل بتختلف في احتياجها واللي بيخرج مع الحصاد وقدرة بعض البقوليات على تثبيت النيتروجين. البقولي اللي عنده عقد فعالة ممكن يثبت نيتروجين، لكن الكمية المتاحة بعده بتعتمد على المحصول والحصاد وإدارة البقايا. محصول الحبوب اللي بعده ممكن تحتاج تسميد مبني على تحليل.\n\nثانيًا تغيير المحصول لمحصول مش عائل ممكن يقطع دورة بعض الآفات والأمراض المرتبطة بعائل محدد. مثال دودة جذور الذرة مع فول الصويا جاي من مناطق موجودة فيها الآفة؛ مش إثبات لوجودها في حقل مصري. بعض جماعات الآفة أو أطوار حياتها ممكن تتجاوز دورة سنة بسيطة؛ لازم تحديد النوع والضغط المحلي.', 'أول حاجة إدارة المغذيات: المحاصيل بتختلف في احتياجها واللي بيخرج مع الحصاد وقدرة بعض البقوليات على تثبيت النيتروجين. البقولي اللي عنده عُقَد فعالة ممكن يثبت نيتروجين، لكن الكمية المتاحة بعده بتعتمد على المحصول والحصاد وإدارة البقايا. محصول الحبوب اللي بعده ممكن يحتاج تسميد مبني على تحليل.\n\nتاني حاجة تغيير المحصول لمحصول مش عائل ممكن يقطع دورة بعض الآفات والأمراض المرتبطة بعائل محدد. مثال دودة جذور الذرة مع فول الصويا جاي من مناطق موجودة فيها الآفة؛ مش إثبات لوجودها في حقل مصري. بعض جماعات الآفة أو أطوار حياتها ممكن تتجاوز دورة سنة بسيطة؛ لازم تحديد النوع والضغط المحلي.'), ('احتفظ بنفس الحالة التعليمية المعتدلة من الخطوة السابقة: ١٠ هكتارات، لوم رملي، pH \u200f6.2، نيتروجين منخفض بالتحليل، فوسفور وبوتاسيوم كافيين، مطر متوسط، ذرة تلات سنين متتالية وغلة بتقل. الجزئين ١ و٢ حللوا محصولين على الأقل من كل مجموعة واختاروا السنة الأولى بشروط. هنا الجزء ٣ يملا السنوات ١–٣ بسبب لكل سنة، والجزء ٤ يقارن الخطط. النشاط كله ١٠ + ١٠ + ١٥ + ١٠ = ٤٥ دقيقة.\n\nمجموعة البقوليات ممكن تكون بداية مناسبة لو المحصول يلائم الموسم والمياه والعقد والغرض. لكنها مش الخيار الوحيد المقبول ولا علاج مضمون لنقص الغلة. دليل تاني ممكن يبرر محصول مختلف أو فحص المشكلة قبل النصيحة النهائية. المناخ المعتدل المذكور في الحالة ما يتحولش لمكان مصري بمجرد تغيير اسمه.', 'احتفظ بنفس الحالة التعليمية المعتدلة من الخطوة السابقة: عشرة هكتارات، لوم رملي، بي إتش ستة فاصلة اتنين، نيتروجين منخفض بالتحليل، فوسفور وبوتاسيوم كافيين، مطر متوسط، ذرة تلات سنين متتالية وغلة بتقل. الجزئين واحد واتنين حللوا محصولين على الأقل من كل مجموعة واختاروا السنة الأولى بشروط. هنا الجزء تلاتة يملا السنوات واحد إلى تلاتة بسبب لكل سنة، والجزء أربعة يقارن الخطط. النشاط كله عشرة زائد عشرة زائد خمستاشر زائد عشرة بتساوي خمسة وأربعين دقيقة.\n\nمجموعة البقوليات ممكن تكون بداية مناسبة لو المحصول يلائم الموسم والمياه والعُقَد والغرض. لكنها مش الخيار الوحيد المقبول ولا علاج مضمون لنقص الغلة. دليل تاني ممكن يبرر محصول مختلف أو فحص المشكلة قبل النصيحة النهائية. المناخ المعتدل المذكور في الحالة ما يتحولش لمكان مصري بمجرد تغيير اسمه.'), ('السيد إيفانز · حالة تعليمية بمناخ معتدل ومساحة 10 هكتارات. دي معطيات حالة تدريب، مش قياساتك من الحقل. الموقع مش محدد. حافظ على المناخ والتربة وتاريخ المحاصيل زي ما هم؛ مفيش مكان مصري متحقق منه. الحالة بتقول إن المناخ مناسب لمحاصيل مواسم دافية وباردة، لكن مواعيد الموسم المحلي مش معطاة. ابدأ السنة الأولى من توصيتك المشروطة في الخطوة اللي فاتت، ولو غيّرتها فسّر السبب. اشتغلوا في مجموعات من 3–4 بورقة التدريب وورق وقلم. الـ45 دقيقة نشاط متوزعين: 10+10 في الخطوة اللي فاتت، وهنا 15 دقيقة للخطة و10 للمقارنة؛ يعني 35 شغل و10 نقاش. ومع دقيقتين التجهيز لوحدهم يبقى الإجمالي 47 دقيقة شامل التحضير. كل مجموعة تشارك اختيار السنة الأولى، و2–3 مجموعات يشرحوا الخطة كاملة. كل طالب يسلّم تبريره وتعديله بنفسه. السنة الرابعة ومحصول الغطاء والسوق والمعدات والمعجم المصوّر ورسمة الخطة بيساعدوا التعلم. سؤال الختام من غير ملاحظات له 5 دقايق منفصلة.', 'السيد إيفانز · حالة تعليمية بمناخ معتدل ومساحة عشرة هكتارات. دي بيانات حالة تدريب، مش قياساتك من الحقل. الموقع مش محدد. حافظ على المناخ والتربة وتاريخ المحاصيل زي ما هم؛ مفيش مكان مصري متحقق منه. الحالة بتقول إن المناخ مناسب لمحاصيل مواسم دافية وباردة، لكن مواعيد الموسم المحلي مش معطاة. ابدأ السنة الأولى من توصيتك المشروطة في الخطوة اللي فاتت، ولو غيّرتها فسّر السبب. اشتغلوا في مجموعات من تلاتة إلى أربعة بورقة التدريب وورق وقلم. الخمسة وأربعين دقيقة نشاط متوزعين: عشرة زائد عشرة في الخطوة اللي فاتت، وهنا خمستاشر دقيقة للخطة وعشرة للمقارنة؛ يعني خمسة وتلاتين شغل وعشرة نقاش. ومع دقيقتين التجهيز لوحدهم يبقى الإجمالي سبعة وأربعين دقيقة شامل التحضير. كل مجموعة تشارك اختيار السنة الأولى، واتنين إلى تلاتة مجموعات يشرحوا الخطة كاملة. كل طالب يسلّم تبريره وتعديله بنفسه. السنة الرابعة ومحصول الغطاء والسوق والمعدات والمعجم المصوّر ورسمة الخطة بيساعدوا التعلم. سؤال الختام من غير ملاحظات له خمسة دقايق منفصلة.'), ('المثال الأول: سنة ١ ذرة ثم سنة ٢ فول صويا ثم سنة ٣ قمح ثم رجوع لسنة ١ ذرة. لازم الأسهم توافق الترتيب المكتوب. حصاد حبوب الذرة بيخرج عناصر، والسيقان والجذور اللي بتفضل ممكن تضيف مدخلات عضوية. فول الصويا ممكن يثبت نيتروجين مع ريزوبيوم فعال، لكن شحن التربة بالكامل مش مضمون. القمح بيضيف موسم وعائلًا ونمط جذور وبقايا مختلف لو مناخ ومواعيد المكان تسمح. في المثال التعليمي ده، القمح اختيار ممكن نضيفه كمحصول تالت. لو المحصول والموسم مناسبين، ممكن يوفّر غطاء للتربة في الشتا كمان؛ ده مش جدول زراعة يصلح لكل موقع.\n\nلكل سهم اكتب إيه اللي اتغير وليه: إمداد النيتروجين أو احتياجه، حالة العائل لآفة متحققة، الجذور والبقايا والموسم. التلات محاصيل مش صالحة تلقائيًا لكل حقل وسنة. افحص اتجاه كل سهم مع رقم السنة؛ لو الرسم خالف الأرقام اتبع الترتيب المرقم وصحح الرسم.', 'المثال الأول: السنة الأولى ذرة ثم السنة التانية فول صويا ثم السنة التالتة قمح ثم رجوع للسنة الأولى ذرة. لازم الأسهم توافق الترتيب المكتوب. حصاد حبوب الذرة بيخرج عناصر، والسيقان والجذور اللي بتفضل ممكن تضيف مدخلات عضوية. فول الصويا ممكن يثبت نيتروجين مع بكتيريا ريزوبيوم فعالة، لكن شحن التربة بالكامل مش مضمون. القمح بيضيف موسم وعائل ونمط جذور وبقايا مختلف لو مناخ ومواعيد المكان تسمح. في المثال التعليمي ده، القمح اختيار ممكن نضيفه كمحصول تالت. لو المحصول والموسم مناسبين، ممكن يوفّر غطاء للتربة في الشتا كمان؛ ده مش جدول زراعة يصلح لكل موقع.\n\nلكل سهم اكتب إيه اللي اتغير وليه: إمداد النيتروجين أو احتياجه، حالة العائل لآفة متحققة، الجذور والبقايا والموسم. التلات محاصيل مش صالحة تلقائيًا لكل حقل وسنة. افحص اتجاه كل سهم مع رقم السنة؛ لو الرسم خالف الأرقام اتبع الترتيب المرقم وصحح الرسم.'), ('ثالثًا المحاصيل بتختلف في الجذور والغطاء والبقايا الراجعة للتربة. جذور القمح أو الذرة الليفية ومحاصيل جذورها أعمق ممكن تساهم في المادة العضوية ومسارات مسام مختلفة، لكنها ما تكسرش أي طبقة منضغطة تلقائيًا. زيادة الذرة ممكن تزود البقايا، وفي إدارة معينة ممكن تزود كربون التربة؛ ده مش مبرر عام لتكرار الذرة كعلاج للكربون أو العناصر. قارن الجذور الليفية للقمح أو الذرة بالجذر الوتدي اللي بنلاقيه غالبًا في البرسيم الحجازي. البقوليات مش كلها ليها نفس شكل الجذور؛ النمو الفعلي وتأثير الجذور على الانضغاط لسه محتاجين تحقق.\n\nما تساويش كل النيتروجين اللي فول الصويا ثبّته بكمية السماد اللي الذرة بعده ممكن تستغنى عنها. الحبوب المحصودة بتخرج نيتروجين، وتركيب البقايا وإدارتها بيأثروا على المتاح للمحصول اللي بعده. تقدير الرصيد لازم بطريقة مناسبة للمكان، مش رقم ثابت من اسم المحصول.', 'تالت حاجة المحاصيل بتختلف في الجذور والغطاء والبقايا الراجعة للتربة. جذور القمح أو الذرة الليفية ومحاصيل جذورها أعمق ممكن تساهم في المادة العضوية ومسارات مسام مختلفة، لكنها ما تكسرش أي طبقة منضغطة تلقائيًا. زيادة الذرة ممكن تزود البقايا، ومع إدارة معينة ممكن تزود كربون التربة؛ ده مش مبرر عام لتكرار الذرة كعلاج للكربون أو العناصر. قارن الجذور الليفية للقمح أو الذرة بالجذر الوتدي اللي بنلاقيه غالبًا في البرسيم الحجازي. البقوليات مش كلها ليها نفس شكل الجذور؛ النمو الفعلي وتأثير الجذور على الانضغاط لسه محتاجين تحقق.\n\nما تساويش كل النيتروجين اللي فول الصويا ثبّته بكمية السماد اللي الذرة بعده ممكن تستغنى عنها. الحبوب المحصودة بتخرج نيتروجين، وتركيب البقايا وإدارتها بيأثروا على المتاح للمحصول اللي بعده. تقدير الرصيد لازم بطريقة مناسبة للمكان، مش رقم ثابت من اسم المحصول.'), ('خصص ٥ دقايق للختام وجاوب في جملة واحدة من غير ما تستخدم ملاحظاتك. في جملة واحدة اشرح ليه بقولي مناسب ممكن ييجي بعد محصول حبوب عالي الاحتياج. الإجابة القوية تذكر تثبيت النيتروجين الحيوي كفائدة ممكنة، وتضيف إن الرصيد الحقيقي للمحصول التالي محتاج دليل. ولو آفة عائل متحققة أو هدف بقايا كان سبب كمان، اشرحه لوحده.', 'خصص خمسة دقايق للختام وجاوب في جملة واحدة من غير ما تستخدم ملاحظاتك. في جملة واحدة اشرح ليه بقولي مناسب ممكن ييجي بعد محصول حبوب عالي الاحتياج. الإجابة القوية تذكر تثبيت النيتروجين الحيوي كفائدة ممكنة، وتضيف إن الرصيد الحقيقي للمحصول التالي محتاج دليل. ولو آفة عائل متحققة أو هدف بقايا كان سبب كمان، اشرحه لوحده.'), ('زود سنة رابعة بعد ما تفحص طول الموسم والمياه وتغير عوائل الآفات المحتمل والبقايا والسوق والمعدات. محصول غطاء زي البرسيم ممكن يحمي التربة ويثبت نيتروجين في ظروف مناسبة؛ وضح هل بين محصولين تجاريين ولا موسم كامل أو أطول، وإزاي هيتحصد أو هتنهيه.\n\nالبرسيم الحجازي وكتير من زراعات الفاكهة ممكن يفضلوا في الأرض كذا موسم. الخطة اللي تحط محصول معمّر في خانة سنة واحدة من غير توضيح التأسيس والإنهاء ناقصة. صورة المحصول أو بطاقة مساعدة بخمس أو ستة أمثلة بتساعد في الاختيار، لكنها ما تحلش محل تفسير الطالب.', 'زود سنة رابعة بعد ما تفحص طول الموسم والمياه وتغير عوائل الآفات المحتمل والبقايا والسوق والمعدات. محصول غطاء زي البرسيم ممكن يحمي التربة ويثبت نيتروجين في ظروف مناسبة؛ وضح هل بين محصولين تجاريين ولا موسم كامل أو أطول، وإزاي هيتحصد أو هتنهيه.\n\nالبرسيم الحجازي وكتير من زراعات الفاكهة ممكن يفضلوا في الأرض كذا موسم. الخطة اللي تحط محصول معمّر في خانة السنة الأولىة من غير توضيح التأسيس والإنهاء ناقصة. صورة المحصول أو بطاقة مساعدة بخمس أو ستة أمثلة بتساعد في الاختيار، لكنها ما تحلش محل تفسير الطالب.'), ('قارن كمان المنتج اللي بيتحصد: حبوب الذرة والقمح والأرز معروفة بالنشا والكربوهيدرات اللي بتدي طاقة؛ وفول الصويا والبسلة والفاصوليا بقوليات معروفة بالبروتين. الفرق في الاستخدام الغذائي مش حساب لنيتروجين الحقل. قارن لوحدها احتياجات المحصول والعقد الفعالة والعناصر اللي خرجت مع الحصاد والبقايا اللي رجعت.\n\nلو الدليل سمح بتقليل نيتروجين مشترى، ده ممكن يقلل تكلفة المدخلات، لكن المحصول المختلف بيغيّر كمان تكلفة التقاوي والشغل والمعدات والمياه ومخاطر السوق. قارن الخطة كلها، مش توفير السماد لوحده. الدورة مش بتمنع فقد النترات ومش ضمان لثبات الإنتاج أو الربح؛ سجّل إدارة العناصر وظروف المياه والنتايج الفعلية قبل ما تعتبر الفايدة البيئية أو القدرة على مواجهة الظروف اتحققت.', 'قارن كمان المنتج اللي بيتحصد: حبوب الذرة والقمح والأرز معروفة بالنشا والكربوهيدرات اللي بتدي طاقة؛ وفول الصويا والبسلة والفاصوليا بقوليات معروفة بالبروتين. الفرق في الاستخدام الغذائي مش حساب لنيتروجين الحقل. قارن لوحدها احتياجات المحصول والعُقَد الفعالة والعناصر اللي خرجت مع الحصاد والبقايا اللي رجعت.\n\nلو الدليل سمح بتقليل نيتروجين مشترى، ده ممكن يقلل تكلفة المدخلات، لكن المحصول المختلف بيغيّر كمان تكلفة التقاوي والشغل والمعدات والمياه ومخاطر السوق. قارن الخطة كلها، مش توفير السماد لوحده. الدورة مش بتمنع فقد النترات ومش ضمان لثبات الإنتاج أو الربح؛ سجّل إدارة العناصر وظروف المياه والنتايج الفعلية قبل ما تعتبر الفايدة البيئية أو القدرة على مواجهة الظروف اتحققت.'), ('نموذج الحل: سنة ١ فول صويا ثم سنة ٢ ذرة ثم سنة ٣ بطاطس. فول الصويا ممكن يثبت نيتروجين لو العقد سليمة، لكن بذوره المحصودة والبقايا اللي بتتشال تخرج عناصر. الذرة في السنة الثانية ما زالت محتاجة خطة عناصر حسب التحليل والمحصول. البطاطس في السنة الثالثة تغيّر حالة العائل للآفات ونمط الجذور مقارنة بالذرة، وتحتاج تقييم تربة وموسم ومياه ومعدات وسوق؛ مش بتحسّن البناء ولا بتقضي على كل الآفات تلقائيًا.\n\nاختيارات تانية ممكن تكون صحيحة. قائمة الفحص فيها الشعير والبرسيم أو الحجازي والجزر والخس والسبانخ والفراولة والشمام؛ استخدمهم بس لو شروط المحصول وغرض السنة مناسبة. القمح أو خضار تاني ممكن في السنة الثالثة مع تبرير. فسر موضع كل سنة بدل نسخ أسماء نموذج كأنها وصفة عامة.', 'نموذج الحل: السنة الأولى فول صويا ثم السنة التانية ذرة ثم السنة التالتة بطاطس. فول الصويا ممكن يثبت نيتروجين لو العُقَد سليمة، لكن بذوره المحصودة والبقايا اللي بتتشال تخرج عناصر. الذرة في السنة الثانية ما زالت محتاجة خطة عناصر حسب التحليل والمحصول. البطاطس في السنة الثالثة تغيّر حالة العائل للآفات ونمط الجذور مقارنة بالذرة، وتحتاج تقييم تربة وموسم ومياه ومعدات وسوق؛ مش بتحسّن البناء ولا بتقضي على كل الآفات تلقائيًا.\n\nاختيارات تانية ممكن تكون صحيحة. قائمة الفحص فيها الشعير والبرسيم أو الحجازي والجزر والخس والسبانخ والفراولة والشمام؛ استخدمهم بس لو شروط المحصول وغرض السنة مناسبة. القمح أو خضار تاني ممكن في السنة الثالثة مع تبرير. فسر موضع كل سنة بدل نسخ أسماء نموذج كأنها وصفة عامة.')], 'en': [("Allow five minutes for the wrap-up and answer in one sentence without using notes. In one sentence, explain why a suitable legume may be placed after a nutrient-demanding cereal. A strong response mentions biological N fixation as a potential nutrient-management benefit and adds that the next crop's actual credit requires evidence. If a verified host pest or residue goal also motivates the change, explain that separately.", "Allow five minutes for the wrap-up and answer in one sentence without using notes. In one sentence, explain why a suitable legume may be placed after a nutrient-demanding cereal. A strong response mentions biological nitrogen fixation as a potential nutrient-management benefit and adds that the next crop's actual credit requires evidence. If a verified host pest or residue goal also motivates the change, explain that separately."), ("Extend a defensible three-year sequence to four years only after checking season length, water, likely host-pest changes, residue, market access and equipment. A clover cover crop may protect soil and may fix N if conditions permit; explain whether it is grown between cash crops, for a full season or longer, and how it is terminated or harvested.\n\nAlfalfa and many fruit plantings can remain on land for multiple seasons. A plan that puts a perennial in just one annual slot without establishment and termination assumptions is incomplete. A crop picture or a five- to six-item help card supports selection, but it never substitutes for the student's explanation.", "Extend a defensible three-year sequence to four years only after checking season length, water, likely host-pest changes, residue, market access and equipment. A clover cover crop may protect soil and may fix nitrogen if conditions permit; explain whether it is grown between cash crops, for a full season or longer, and how it is terminated or harvested.\n\nAlfalfa and many fruit plantings can remain on land for multiple seasons. A plan that puts a perennial in just one annual slot without establishment and termination assumptions is incomplete. A crop picture or a five- to six-item help card supports selection, but it never substitutes for the student's explanation."), ('First, nutrient management can improve when crops differ in demand, harvest removal and biological nitrogen fixation. A well-nodulated legume can fix N; how much remains available later depends on the crop, its harvest and residue management. The next cereal may still need tested nutrient inputs.\n\nSecond, changing to a non-host crop can interrupt some host-specific pests and diseases. The corn-rootworm/soybean example comes from regions where that pest occurs; it is not proof of a pest on an Egyptian farm. Some rootworm populations or life cycles can survive a simple one-year rotation, so identify the organism and local pressure.', 'First, nutrient management can improve when crops differ in demand, harvest removal and biological nitrogen fixation. A well-nodulated legume can fix nitrogen; how much remains available later depends on the crop, its harvest and residue management. The next cereal may still need tested nutrient inputs.\n\nSecond, changing to a non-host crop can interrupt some host-specific pests and diseases. The corn-rootworm, soybean example comes from regions where that pest occurs; it is not proof of a pest on an Egyptian farm. Some rootworm populations or life cycles can survive a simple one-year rotation, so identify the organism and local pressure.'), ("Keep the same labelled temperate classroom case from the preceding step: 10 hectares, sandy loam, pH 6.2, tested N low, P and K adequate, moderate rainfall, three successive maize crops and declining yield. Parts 1 and 2 screened at least two crop candidates per practical group and justified a conditional year-one choice. Part 3 now fills Years 1–3 with a reason for each, and Part 4 compares plans. Across both steps the complete activity uses 10 + 10 + 15 + 10 minutes, or 45 minutes.\n\nA possible year-one group is a locally suitable legume, if its season, water, nodulation and purpose fit. It is not the only defensible action or a guaranteed cure for declining yield. Evidence may justify a different crop or a remedial investigation before final advice. The case's stated temperate climate cannot be relabelled as an Egyptian locality without new local data.", "Keep the same labelled temperate classroom case from the preceding step: ten hectares, sandy loam, P H six point two, tested nitrogen low, phosphorus and potassium adequate, moderate rainfall, three successive maize crops and declining yield. Parts one and two screened at least two crop candidates per practical group and justified a conditional year-one choice. Part three now fills Years one to three with a reason for each, and Part four compares plans. Across both steps the complete activity uses ten plus ten plus fifteen plus ten minutes, or forty-five minutes.\n\nA possible year-one group is a locally suitable legume, if its season, water, nodulation and purpose fit. It is not the only defensible action or a guaranteed cure for declining yield. Evidence may justify a different crop or a remedial investigation before final advice. The case's stated temperate climate cannot be relabelled as an Egyptian locality without new local data."), ('Mr Evans · 10-hectare temperate teaching case. Supplied classroom facts, not your field measurements. The location is unspecified. Keep climate, soil and crop history unchanged; no Egyptian locality is verified. The source case allows both warm- and cool-season crops; actual local season dates are not supplied. Begin Year1 from your preceding conditional recommendation and explain any revision. Groups of 3–4 use a worksheet, pens and paper. The 45 active minutes span 10+10 minutes in the preceding step, then 15 minutes planning and 10 minutes comparing here (35 work +10 discussion). The separately stated 2-minute setup makes 47 minutes including preparation. Each group shares its first-year choice; 2–3 groups explain their whole plan. Everyone submits individual reasoning and revision. The optional fourth year, cover crop, markets/equipment, visual glossary and a drawn plan support learning. The five-minute no-notes exit is separate.', 'Mr Evans · ten-hectare temperate teaching case. Supplied classroom facts, not your field measurements. The location is unspecified. Keep climate, soil and crop history unchanged; no Egyptian locality is verified. The source case allows both warm- and cool-season crops; actual local season dates are not supplied. Begin Year one from your preceding conditional recommendation and explain any revision. Groups of three to four use a worksheet, pens and paper. The forty-five active minutes span ten plus ten minutes in the preceding step, then fifteen minutes planning and ten minutes comparing here (thirty-five work plus ten discussion). The separately stated two-minute setup makes forty-seven minutes including preparation. Each group shares its first-year choice; two to three groups explain their whole plan. Everyone submits individual reasoning and revision. The optional fourth year, cover crop, markets, equipment, visual glossary and a drawn plan support learning. The five-minute no-notes exit is separate.'), ("The first teaching sequence is Year 1 maize (corn) → Year 2 soybean → Year 3 wheat → back to Year 1 maize. The arrows must follow that written order. Maize grain harvest removes nutrients, while returned stalks and roots may add organic inputs. Soybean may fix atmospheric N with effective rhizobia, but a full soil 'recharge' is not guaranteed. Wheat adds a different season, host and fibrous-root/residue pattern when the local climate and planting calendar allow it. Wheat is an optional third crop in this teaching example. Where the crop and season fit, it can also provide winter ground cover; this is not a planting calendar for every site.\n\nFor each arrow, write what changed and why: crop N supply or demand, host status for a verified pest, root/residue behaviour and season. Do not assume the three crops fit every site or year. Check that every displayed arrow follows the numbered year order; if an arrow contradicts the labels, use the year sequence and correct the drawing.", "The first teaching sequence is Year one maize (corn) then Year two soybean then Year three wheat then back to Year one maize. The arrows must follow that written order. Maize grain harvest removes nutrients, while returned stalks and roots may add organic inputs. Soybean may fix atmospheric nitrogen with effective rhizobia, but a full soil 'recharge' is not guaranteed. Wheat adds a different season, host and fibrous-root, residue pattern when the local climate and planting calendar allow it. Wheat is an optional third crop in this teaching example. Where the crop and season fit, it can also provide winter ground cover; this is not a planting calendar for every site.\n\nFor each arrow, write what changed and why: crop nitrogen supply or demand, host status for a verified pest, root, residue behaviour and season. Do not assume the three crops fit every site or year. Check that every displayed arrow follows the numbered year order; if an arrow contradicts the labels, use the year sequence and correct the drawing."), ("The worked case uses Year 1 soybean → Year 2 maize → Year 3 potato. Soybean may add biologically fixed N if properly nodulated, but its harvested grain and removed residues also carry nutrients away. Year 2 maize must still be checked against a soil and crop nutrient plan. Year 3 potato changes the host and rooting pattern relative to maize and requires its own soil, season, water, equipment and market assessment; it does not automatically improve tilth or suppress every pest.\n\nOther crop choices can be valid. The screening list also included barley, clover or alfalfa, carrot, lettuce, spinach, strawberry and melon; use them only if crop-specific conditions and the year's purpose match. Wheat or another vegetable can occupy Year 3 when justified. Explain why each year is in that position, rather than copying crop names as a universal recipe.", "The worked case uses Year one soybean then Year two maize then Year three potato. Soybean may add biologically fixed nitrogen if properly nodulated, but its harvested grain and removed residues also carry nutrients away. Year two maize must still be checked against a soil and crop nutrient plan. Year three potato changes the host and rooting pattern relative to maize and requires its own soil, season, water, equipment and market assessment; it does not automatically improve tilth or suppress every pest.\n\nOther crop choices can be valid. The screening list also included barley, clover or alfalfa, carrot, lettuce, spinach, strawberry and melon; use them only if crop-specific conditions and the year's purpose match. Wheat or another vegetable can occupy Year three when justified. Explain why each year is in that position, rather than copying crop names as a universal recipe."), ('Third, crops differ in roots, soil cover and returned residue. Fibrous wheat or maize roots and deeper-rooted crops can contribute organic material and different pore pathways, but roots do not automatically break every compacted layer. More maize can mean more residue and sometimes more soil carbon under specific management; it does not justify continuous maize as a universal carbon or nutrient recommendation. Compare fibrous-rooted wheat or maize with the taproot commonly found in alfalfa. Legumes do not all have the same root architecture; actual root growth and compaction effects still need checking.\n\nDo not equate total N fixed by soybean with the fertilizer credit for following maize. Soybean grain exports N, and residue composition and management affect the following crop’s available N. A credit must use an appropriate local method, not a fixed number inferred from the crop name.', 'Third, crops differ in roots, soil cover and returned residue. Fibrous wheat or maize roots and deeper-rooted crops can contribute organic material and different pore pathways, but roots do not automatically break every compacted layer. More maize can mean more residue and sometimes more soil carbon under specific management; it does not justify continuous maize as a universal carbon or nutrient recommendation. Compare fibrous-rooted wheat or maize with the taproot commonly found in alfalfa. Legumes do not all have the same root architecture; actual root growth and compaction effects still need checking.\n\nDo not equate total nitrogen fixed by soybean with the fertilizer credit for following maize. Soybean grain exports nitrogen, and residue composition and management affect the following crop’s available nitrogen. A credit must use an appropriate local method, not a fixed number inferred from the crop name.')], 'it': [('Confrontare anche i prodotti: mais, frumento e riso sono cereali apprezzati per amido ed energia da carboidrati; soia, pisello e fagiolo sono leguminose apprezzate per proteine. Queste differenze alimentari non stabiliscono il bilancio di N del campo. Confrontare separatamente domanda nutritiva, noduli efficaci, asportazione e residui restituiti.\n\nUna riduzione documentata dell’azoto acquistato può diminuire i costi, ma cambiano anche sementi, lavoro, macchine, acqua e rischi di mercato. Confrontare l’intero piano, non soltanto il risparmio di concime. La rotazione non elimina perdite di nitrati né garantisce resa e reddito stabili: documentare gestione nutritiva, acqua e risultati prima di attribuire benefici ambientali o resilienza.', 'Confrontare anche i prodotti: mais, frumento e riso sono cereali apprezzati per amido ed energia da carboidrati; soia, pisello e fagiolo sono leguminose apprezzate per proteine. Queste differenze alimentari non stabiliscono il bilancio di azoto del campo. Confrontare separatamente domanda nutritiva, noduli efficaci, asportazione e residui restituiti.\n\nUna riduzione documentata dell’azoto acquistato può diminuire i costi, ma cambiano anche sementi, lavoro, macchine, acqua e rischi di mercato. Confrontare l’intero piano, non soltanto il risparmio di concime. La rotazione non elimina perdite di nitrati né garantisce resa e reddito stabili: documentare gestione nutritiva, acqua e risultati prima di attribuire benefici ambientali o resilienza.'), ('Dedicare cinque minuti alla conclusione e rispondere in una frase senza consultare appunti. In una frase spiegare perché una leguminosa adatta possa seguire un cereale esigente. Una risposta forte menziona la possibile fissazione biologica di N e la necessità di prove per quantificare il credito reale della coltura seguente. Se motivano il cambio anche un parassita ospite accertato o i residui, spiegarli separatamente.', 'Dedicare cinque minuti alla conclusione e rispondere in una frase senza consultare appunti. In una frase spiegare perché una leguminosa adatta possa seguire un cereale esigente. Una risposta forte menziona la possibile fissazione biologica di azoto e la necessità di prove per quantificare il credito reale della coltura seguente. Se motivano il cambio anche un parassita ospite accertato o i residui, spiegarli separatamente.'), ('Estendere a quattro anni solo dopo verifica di stagioni, acqua, cambiamenti negli ospiti dei parassiti, residui, mercato e attrezzature. Un trifoglio di copertura può proteggere il suolo e fissare N se le condizioni lo consentono; chiarire se cresce tra colture commerciali, per una stagione intera o più, e come viene raccolto o terminato.\n\nErba medica e molti fruttiferi possono restare per più stagioni. Un piano che inserisce una perenne in una sola casella annuale senza avvio e terminazione è incompleto. Una figura o scheda con cinque-sei opzioni aiuta ma non sostituisce la spiegazione dello studente.', 'Estendere a quattro anni solo dopo verifica di stagioni, acqua, cambiamenti negli ospiti dei parassiti, residui, mercato e attrezzature. Un trifoglio di copertura può proteggere il suolo e fissare azoto se le condizioni lo consentono; chiarire se cresce tra colture commerciali, per una stagione intera o più, e come viene raccolto o terminato.\n\nErba medica e molti fruttiferi possono restare per più stagioni. Un piano che inserisce una perenne in una sola casella annuale senza avvio e terminazione è incompleto. Una figura o scheda con cinque-sei opzioni aiuta ma non sostituisce la spiegazione dello studente.'), ('Il modello usa anno 1 soia → anno 2 mais → anno 3 patata. La soia può fissare N se ben nodulata, ma semi raccolti e residui asportati esportano nutrienti. Il mais del secondo anno richiede comunque un piano nutritivo basato su terreno e coltura. La patata del terzo anno cambia famiglia e fabbisogno colturale rispetto al mais e richiede controlli su suolo, stagione, acqua, attrezzature e mercato; non migliora sempre la struttura né elimina ogni parassita.\n\nAltre scelte sono possibili. La lista iniziale comprende anche orzo, trifoglio o erba medica, carota, lattuga, spinacio, fragola e melone: usarli solo se condizioni specifiche e scopo dell’anno coincidono. Frumento o altro ortaggio possono occupare l’anno 3 con motivazione. Spiegare la posizione di ogni anno invece di copiare il modello come ricetta universale.', 'Il modello usa anno uno soia poi anno due mais poi anno tre patata. La soia può fissare azoto se ben nodulata, ma semi raccolti e residui asportati esportano nutrienti. Il mais del secondo anno richiede comunque un piano nutritivo basato su terreno e coltura. La patata del terzo anno cambia famiglia e fabbisogno colturale rispetto al mais e richiede controlli su suolo, stagione, acqua, attrezzature e mercato; non migliora sempre la struttura né elimina ogni parassita.\n\nAltre scelte sono possibili. La lista iniziale comprende anche orzo, trifoglio o erba medica, carota, lattuga, spinacio, fragola e melone: usarli solo se condizioni specifiche e scopo dell’anno coincidono. Frumento o altro ortaggio possono occupare l’anno tre con motivazione. Spiegare la posizione di ogni anno invece di copiare il modello come ricetta universale.'), ('La prima sequenza è anno 1 mais → anno 2 soia → anno 3 frumento → ritorno all’anno 1 mais. Le frecce devono seguire quest’ordine scritto. Il raccolto di granella di mais esporta nutrienti; fusti e radici restituiti possono aggiungere materiale organico. La soia può fissare N atmosferico con rizobi efficaci, ma una “ricarica” completa non è garantita. Il frumento aggiunge altra stagione, ospite e modello di radici e residui se calendario e clima locali lo consentono. In questo esempio didattico il frumento è una terza coltura facoltativa. Se coltura e stagione sono adatte, può offrire anche copertura invernale del suolo; non è un calendario valido per ogni sito.\n\nPer ogni freccia scrivere cosa cambia e perché: apporto o domanda N, ospite di un parassita accertato, radici, residui e stagione. Le tre colture non vanno bene ovunque. Confrontare ogni freccia con l’anno numerato: se il disegno contraddice il testo, seguire gli anni e correggere il disegno.', 'La prima sequenza è anno uno mais poi anno due soia poi anno tre frumento poi ritorno all’anno uno mais. Le frecce devono seguire quest’ordine scritto. Il raccolto di granella di mais esporta nutrienti; fusti e radici restituiti possono aggiungere materiale organico. La soia può fissare azoto atmosferico con rizobi efficaci, ma una “ricarica” completa non è garantita. Il frumento aggiunge altra stagione, ospite e modello di radici e residui se calendario e clima locali lo consentono. In questo esempio didattico il frumento è una terza coltura facoltativa. Se coltura e stagione sono adatte, può offrire anche copertura invernale del suolo; non è un calendario valido per ogni sito.\n\nPer ogni freccia scrivere cosa cambia e perché: apporto o domanda di azoto, ospite di un parassita accertato, radici, residui e stagione. Le tre colture non vanno bene ovunque. Confrontare ogni freccia con l’anno numerato: se il disegno contraddice il testo, seguire gli anni e correggere il disegno.'), ('Mantenere il caso didattico temperato precedente: 10 ha, franco-sabbioso, pH 6,2, N analizzato basso, P e K adeguati, pioggia moderata, tre anni consecutivi di mais e resa calante. Le parti 1 e 2 hanno vagliato almeno due colture per gruppo e una scelta condizionata per il primo anno. Ora la parte 3 compila gli anni 1–3 con motivazione e la parte 4 confronta i piani. L’attività completa è 10+10+15+10=45 minuti.\n\nUna leguminosa adatta può essere un gruppo da esplorare per l’anno uno se stagione, acqua, noduli e scopo coincidono. Non è l’unica azione valida né una cura certa del calo produttivo. Le prove possono giustificare un’altra coltura o indagini preliminari. Il clima temperato del modello non diventa egiziano cambiando il luogo scritto.', 'Mantenere il caso didattico temperato precedente: dieci ettari, franco-sabbioso, pi acca sei virgola due, azoto analizzato basso, fosforo e potassio adeguati, pioggia moderata, tre anni consecutivi di mais e resa calante. Le parti uno e due hanno vagliato almeno due colture per gruppo e una scelta condizionata per il primo anno. Ora la parte tre compila gli anni uno a tre con motivazione e la parte quattro confronta i piani. L’attività completa è dieci più dieci più quindici più dieci uguale a quarantacinque minuti.\n\nUna leguminosa adatta può essere un gruppo da esplorare per l’anno uno se stagione, acqua, noduli e scopo coincidono. Non è l’unica azione valida né una cura certa del calo produttivo. Le prove possono giustificare un’altra coltura o indagini preliminari. Il clima temperato del modello non diventa egiziano cambiando il luogo scritto.'), ('Primo: la gestione dei nutrienti può migliorare se le colture hanno domanda, esportazione con la raccolta e fissazione biologica differenti. Una leguminosa con noduli efficaci può fissare N; quanto resta disponibile dopo dipende da specie, prodotto raccolto e gestione dei residui. Il cereale seguente potrebbe richiedere comunque fertilizzante basato su analisi.\n\nSecondo: una coltura non ospite può interrompere alcuni parassiti o patogeni dipendenti dall’ospite. Mais/soia e diabrotica è un esempio proveniente da aree in cui l’insetto è presente, non una prova della sua presenza in Egitto. Alcune popolazioni o cicli biologici superano una rotazione annuale semplice: identificare organismo e pressione locale.', 'Primo: la gestione dei nutrienti può migliorare se le colture hanno domanda, esportazione con la raccolta e fissazione biologica differenti. Una leguminosa con noduli efficaci può fissare azoto; quanto resta disponibile dopo dipende da specie, prodotto raccolto e gestione dei residui. Il cereale seguente potrebbe richiedere comunque fertilizzante basato su analisi.\n\nSecondo: una coltura non ospite può interrompere alcuni parassiti o patogeni dipendenti dall’ospite. L’esempio di mais e soia con la diabrotica proviene da aree in cui l’insetto è presente, non una prova della sua presenza in Egitto. Alcune popolazioni o cicli biologici superano una rotazione annuale semplice: identificare organismo e pressione locale.'), ('Signor Evans · caso temperato di 10 ettari. Dati didattici forniti, non tue misure. Località ignota; mantenere clima, suolo e storia senza dichiarare verificata una località egiziana. Il caso ammette colture di stagione calda e fresca; mancano date stagionali locali. Iniziare l’anno1 dalla raccomandazione condizionata precedente, motivando eventuali modifiche. Gruppi di 3–4 usano scheda, carta e penne. I 45 minuti attivi comprendono 10+10 nel passo precedente e qui 15 per il piano e 10 per il confronto: 35 di lavoro e10 di discussione. Con i2 minuti di preparazione indicati separatamente, il totale è47. Ogni gruppo condivide la scelta iniziale;2–3 gruppi spiegano il piano completo. Consegna e revisione restano individuali. Quarto anno, copertura, mercato/attrezzature, glossario visivo e disegno sostengono l’apprendimento. La conclusione di5 minuti senza appunti è separata.', 'Signor Evans · caso temperato di dieci ettari. Dati didattici forniti, non tue misure. Località ignota; mantenere clima, suolo e storia senza dichiarare verificata una località egiziana. Il caso ammette colture di stagione calda e fresca; mancano date stagionali locali. Iniziare l’anno uno dalla raccomandazione condizionata precedente, motivando eventuali modifiche. Gruppi di tre a quattro usano scheda, carta e penne. I quarantacinque minuti attivi comprendono dieci più dieci nel passo precedente e qui quindici per il piano e dieci per il confronto: trentacinque di lavoro e dieci di discussione. Con i due minuti di preparazione indicati separatamente, il totale è quarantasette. Ogni gruppo condivide la scelta iniziale;due a tre gruppi spiegano il piano completo. Consegna e revisione restano individuali. Quarto anno, copertura, mercato, attrezzature, glossario visivo e disegno sostengono l’apprendimento. La conclusione di cinque minuti senza appunti è separata.'), ('Terzo: le colture differiscono per radici, copertura e residui restituiti. Radici fibrose di frumento o mais e radici più profonde possono contribuire a materiale organico e pori diversi, ma non rompono automaticamente ogni strato compattato. Più mais può produrre più residui e talvolta carbonio nel terreno con una gestione specifica; non è un consiglio universale di mais continuo. Confronta le radici fibrose del frumento o del mais con il fittone comune nell’erba medica. Non tutte le leguminose hanno la stessa architettura radicale; crescita effettiva ed effetti sulla compattazione vanno comunque verificati.\n\nNon equiparare tutto l’N fissato dalla soia al credito di fertilizzante per il mais seguente. La granella esporta N e composizione e gestione dei residui influenzano l’N disponibile dopo. Usare un metodo locale appropriato, non un numero fisso derivato dal nome.', 'Terzo: le colture differiscono per radici, copertura e residui restituiti. Radici fibrose di frumento o mais e radici più profonde possono contribuire a materiale organico e pori diversi, ma non rompono automaticamente ogni strato compattato. Più mais può produrre più residui e talvolta carbonio nel terreno con una gestione specifica; non è un consiglio universale di mais continuo. Confronta le radici fibrose del frumento o del mais con il fittone comune nell’erba medica. Non tutte le leguminose hanno la stessa architettura radicale; crescita effettiva ed effetti sulla compattazione vanno comunque verificati.\n\nNon equiparare tutto l’azoto fissato dalla soia al credito di fertilizzante per il mais seguente. La granella esporta azoto e composizione e gestione dei residui influenzano l’azoto disponibile dopo. Usare un metodo locale appropriato, non un numero fisso derivato dal nome.')], 'de': [('Auch Ernteprodukte vergleichen: Mais, Weizen und Reis sind Getreide mit Stärke und Kohlenhydratenergie; Soja, Erbse und Bohne sind proteinreiche Leguminosen. Diese Ernährungsunterschiede bestimmen nicht die N-Bilanz des Feldes. Nährstoffbedarf, wirksame Knöllchen, Ernteabfuhr und zurückgegebene Rückstände gesondert vergleichen.\n\nEine belegte Verringerung zugekauften Stickstoffs kann Kosten senken; andere Kulturen verändern aber auch Saatgut-, Arbeits-, Geräte-, Wasser- und Marktrisiken. Den ganzen Plan statt nur Düngerersparnisse vergleichen. Fruchtfolge beseitigt Nitratverluste nicht und garantiert weder stabile Erträge noch Gewinn. Nährstoffmanagement, Wasserbedingungen und tatsächliche Ergebnisse dokumentieren, bevor Umwelt- oder Resilienzvorteile behauptet werden.', 'Auch Ernteprodukte vergleichen: Mais, Weizen und Reis sind Getreide mit Stärke und Kohlenhydratenergie; Soja, Erbse und Bohne sind proteinreiche Leguminosen. Diese Ernährungsunterschiede bestimmen nicht die Stickstoff-Bilanz des Feldes. Nährstoffbedarf, wirksame Knöllchen, Ernteabfuhr und zurückgegebene Rückstände gesondert vergleichen.\n\nEine belegte Verringerung zugekauften Stickstoffs kann Kosten senken; andere Kulturen verändern aber auch Saatgut-, Arbeits-, Geräte-, Wasser- und Marktrisiken. Den ganzen Plan statt nur Düngerersparnisse vergleichen. Fruchtfolge beseitigt Nitratverluste nicht und garantiert weder stabile Erträge noch Gewinn. Nährstoffmanagement, Wasserbedingungen und tatsächliche Ergebnisse dokumentieren, bevor Umwelt- oder Resilienzvorteile behauptet werden.'), ('Das Modell verwendet Jahr 1 Soja → Jahr 2 Mais → Jahr 3 Kartoffel. Soja kann bei wirksamen Knöllchen N fixieren, doch geerntete Bohnen und entfernte Rückstände führen Nährstoffe ab. Für den Mais im zweiten Jahr ist weiterhin ein standort- und kulturbezogener Nährstoffplan nötig. Kartoffeln im dritten Jahr wechseln Familie und Bewirtschaftungsansprüche gegenüber Mais und brauchen Prüfung von Boden, Saison, Wasser, Geräten und Markt; sie verbessern die Struktur und unterdrücken Schädlinge nicht automatisch.\n\nAndere Kulturen können richtig sein. Die Vorauswahl enthielt auch Gerste, Klee oder Luzerne, Karotte, Salat, Spinat, Erdbeere und Melone; sie sind nur bei passender Kulturbedingung und Jahresfunktion sinnvoll. Weizen oder anderes Gemüse kann begründet in Jahr drei stehen. Die Position jedes Jahres erklären, statt die Namen als allgemeines Rezept zu kopieren.', 'Das Modell verwendet Jahr eins Soja danach Jahr zwei Mais danach Jahr drei Kartoffel. Soja kann bei wirksamen Knöllchen Stickstoff fixieren, doch geerntete Bohnen und entfernte Rückstände führen Nährstoffe ab. Für den Mais im zweiten Jahr ist weiterhin ein standort- und kulturbezogener Nährstoffplan nötig. Kartoffeln im dritten Jahr wechseln Familie und Bewirtschaftungsansprüche gegenüber Mais und brauchen Prüfung von Boden, Saison, Wasser, Geräten und Markt; sie verbessern die Struktur und unterdrücken Schädlinge nicht automatisch.\n\nAndere Kulturen können richtig sein. Die Vorauswahl enthielt auch Gerste, Klee oder Luzerne, Karotte, Salat, Spinat, Erdbeere und Melone; sie sind nur bei passender Kulturbedingung und Jahresfunktion sinnvoll. Weizen oder anderes Gemüse kann begründet in Jahr drei stehen. Die Position jedes Jahres erklären, statt die Namen als allgemeines Rezept zu kopieren.'), ('Derselbe gemäßigte Lehrfall aus dem vorigen Schritt gilt: 10 ha sandiger Lehm, pH 6,2, wenig gemessenes N, ausreichend P/K, mäßiger Regen, drei aufeinanderfolgende Maisjahre und sinkender Ertrag. In Teilen 1 und 2 wurden je mindestens zwei Kandidaten pro Gruppe und eine bedingte Wahl für Jahr eins geprüft. Teil 3 trägt nun Jahre 1–3 mit Gründen ein, Teil 4 vergleicht Pläne. Insgesamt 10+10+15+10=45 Minuten.\n\nEine geeignete Leguminose kann für Jahr eins untersucht werden, wenn Saison, Wasser, Knöllchen und Nutzungszweck passen. Sie ist weder die einzige vertretbare Antwort noch eine sichere Ertragsheilung. Belege können eine andere Kultur oder weitere Ursachenforschung begründen. Das gemäßigte Fallklima wird nicht durch einen ausgetauschten Ortsnamen zu Ägyptens Klima.', 'Derselbe gemäßigte Lehrfall aus dem vorigen Schritt gilt: zehn Hektar sandiger Lehm, Pe Ha sechs Komma zwei, wenig gemessener Stickstoff, ausreichend Phosphor und Kalium, mäßiger Regen, drei aufeinanderfolgende Maisjahre und sinkender Ertrag. In Teilen eins und zwei wurden je mindestens zwei Kandidaten pro Gruppe und eine bedingte Wahl für Jahr eins geprüft. Teil drei trägt nun Jahre eins bis drei mit Gründen ein, Teil vier vergleicht Pläne. Insgesamt zehn plus zehn plus fünfzehn plus zehn gleich fünfundvierzig Minuten.\n\nEine geeignete Leguminose kann für Jahr eins untersucht werden, wenn Saison, Wasser, Knöllchen und Nutzungszweck passen. Sie ist weder die einzige vertretbare Antwort noch eine sichere Ertragsheilung. Belege können eine andere Kultur oder weitere Ursachenforschung begründen. Das gemäßigte Fallklima wird nicht durch einen ausgetauschten Ortsnamen zu Ägyptens Klima.'), ('Die erste Lehrfolge lautet Jahr 1 Mais → Jahr 2 Soja → Jahr 3 Weizen → zurück zu Jahr 1 Mais. Die Pfeile müssen dieser schriftlichen Reihenfolge folgen. Maiskornernte entzieht Nährstoffe, während zurückgelassene Stängel und Wurzeln organische Stoffe liefern können. Soja kann mit wirksamen Rhizobien Luftstickstoff binden; eine vollständige „Aufladung“ des Bodens ist nicht garantiert. Weizen bringt andere Saison, Wirtseigenschaften und Wurzel-/Rückstandsmuster, wenn Klima und Kalender passen. In diesem Lehrbeispiel ist Weizen eine optionale dritte Kultur. Wenn Kultur und Jahreszeit passen, kann er auch im Winter den Boden bedecken; dies ist kein Pflanzkalender für jeden Standort.\n\nZu jedem Pfeil beschreiben, was sich ändert und warum: N-Angebot oder -Bedarf, Wirt für einen nachgewiesenen Schädling, Wurzeln, Rückstände und Saison. Die drei Kulturen passen nicht automatisch überall. Jeden Pfeil mit den Jahreszahlen vergleichen; widerspricht die Grafik den Zahlen, gelten die nummerierten Jahre und die Grafik wird korrigiert.', 'Die erste Lehrfolge lautet Jahr eins Mais danach Jahr zwei Soja danach Jahr drei Weizen danach zurück zu Jahr eins Mais. Die Pfeile müssen dieser schriftlichen Reihenfolge folgen. Maiskornernte entzieht Nährstoffe, während zurückgelassene Stängel und Wurzeln organische Stoffe liefern können. Soja kann mit wirksamen Rhizobien Luftstickstoff binden; eine vollständige „Aufladung“ des Bodens ist nicht garantiert. Weizen bringt andere Saison, Wirtseigenschaften und Wurzel-, Rückstandsmuster, wenn Klima und Kalender passen. In diesem Lehrbeispiel ist Weizen eine optionale dritte Kultur. Wenn Kultur und Jahreszeit passen, kann er auch im Winter den Boden bedecken; dies ist kein Pflanzkalender für jeden Standort.\n\nZu jedem Pfeil beschreiben, was sich ändert und warum: Stickstoff-Angebot oder -Bedarf, Wirt für einen nachgewiesenen Schädling, Wurzeln, Rückstände und Saison. Die drei Kulturen passen nicht automatisch überall. Jeden Pfeil mit den Jahreszahlen vergleichen; widerspricht die Grafik den Zahlen, gelten die nummerierten Jahre und die Grafik wird korrigiert.'), ('Drittens unterscheiden sich Wurzeln, Bodenbedeckung und zurückgegebene Rückstände. Faserige Weizen- oder Maiswurzeln und tiefere Wurzeln können organisches Material und andere Porenwege beitragen, beseitigen aber nicht jede Verdichtung automatisch. Mehr Mais kann mehr Rückstände und unter bestimmter Bewirtschaftung mehr Bodenkohlenstoff liefern; daraus folgt keine pauschale Empfehlung für Mais in Dauerkultur. Vergleiche die Faserwurzeln von Weizen oder Mais mit der bei Luzerne häufigen Pfahlwurzel. Nicht alle Leguminosen haben denselben Wurzelaufbau; tatsächliches Wurzelwachstum und Auswirkungen auf Verdichtung müssen weiterhin geprüft werden.\n\nDie gesamte N-Fixierung der Soja ist nicht mit der Düngergutschrift für folgenden Mais gleichzusetzen. Geerntete Körner führen N ab; Zusammensetzung und Bewirtschaftung der Rückstände beeinflussen später verfügbares N. Dafür ein geeignetes örtliches Verfahren statt eines pauschalen Werts nach Kulturnamen nutzen.', 'Drittens unterscheiden sich Wurzeln, Bodenbedeckung und zurückgegebene Rückstände. Faserige Weizen- oder Maiswurzeln und tiefere Wurzeln können organisches Material und andere Porenwege beitragen, beseitigen aber nicht jede Verdichtung automatisch. Mehr Mais kann mehr Rückstände und unter bestimmter Bewirtschaftung mehr Bodenkohlenstoff liefern; daraus folgt keine pauschale Empfehlung für Mais in Dauerkultur. Vergleiche die Faserwurzeln von Weizen oder Mais mit der bei Luzerne häufigen Pfahlwurzel. Nicht alle Leguminosen haben denselben Wurzelaufbau; tatsächliches Wurzelwachstum und Auswirkungen auf Verdichtung müssen weiterhin geprüft werden.\n\nDie gesamte Stickstoff-Fixierung der Soja ist nicht mit der Düngergutschrift für folgenden Mais gleichzusetzen. Geerntete Körner führen Stickstoff ab; Zusammensetzung und Bewirtschaftung der Rückstände beeinflussen später verfügbaren Stickstoff. Dafür ein geeignetes örtliches Verfahren statt eines pauschalen Werts nach Kulturnamen nutzen.'), ('Eine tragfähige Folge erst nach Prüfung von Saisonlänge, Wasser, möglichen Wirtswechseln, Rückständen, Markt und Geräten auf vier Jahre ausdehnen. Klee als Deckfrucht kann Boden schützen und unter passenden Bedingungen N fixieren; angeben, ob er zwischen Marktfrüchten, eine ganze Saison oder länger wächst und wie er geerntet oder beendet wird.\n\nLuzerne und viele Obstanlagen bleiben mehrere Saisons auf der Fläche. Ein Plan, der eine Dauerkultur ohne Anlage- und Beendigungsannahmen in nur ein Jahresfeld einsetzt, ist unvollständig. Bild oder Hilfskarte mit fünf bis sechs Kulturen stützt die Auswahl, ersetzt nicht die eigene Erklärung.', 'Eine tragfähige Folge erst nach Prüfung von Saisonlänge, Wasser, möglichen Wirtswechseln, Rückständen, Markt und Geräten auf vier Jahre ausdehnen. Klee als Deckfrucht kann Boden schützen und unter passenden Bedingungen Stickstoff fixieren; angeben, ob er zwischen Marktfrüchten, eine ganze Saison oder länger wächst und wie er geerntet oder beendet wird.\n\nLuzerne und viele Obstanlagen bleiben mehrere Saisons auf der Fläche. Ein Plan, der eine Dauerkultur ohne Anlage- und Beendigungsannahmen in nur ein Jahresfeld einsetzt, ist unvollständig. Bild oder Hilfskarte mit fünf bis sechs Kulturen stützt die Auswahl, ersetzt nicht die eigene Erklärung.'), ('Erstens kann sich Nährstoffmanagement verbessern, wenn Kulturen sich in Bedarf, Abfuhr mit der Ernte und biologischer N-Fixierung unterscheiden. Eine wirksam knöllchenbildende Leguminose kann N fixieren; wie viel später verfügbar ist, hängt von Kultur, Ernte und Rückständen ab. Das folgende Getreide kann dennoch analysengestützte Nährstoffzufuhr brauchen.\n\nZweitens kann eine Nichtwirt-Kultur manche wirtsgebundenen Schädlinge und Krankheiten unterbrechen. Maiswurzelbohrer und Soja sind ein Beispiel aus Regionen, in denen der Schädling vorkommt, kein Nachweis für ein ägyptisches Feld. Einige Populationen oder Lebenszyklen überstehen eine einfache Einjahresrotation; Organismus und örtlichen Befall feststellen.', 'Erstens kann sich Nährstoffmanagement verbessern, wenn Kulturen sich in Bedarf, Abfuhr mit der Ernte und biologischer Stickstoff-Fixierung unterscheiden. Eine wirksam knöllchenbildende Leguminose kann Stickstoff fixieren; wie viel später verfügbar ist, hängt von Kultur, Ernte und Rückständen ab. Das folgende Getreide kann dennoch analysengestützte Nährstoffzufuhr brauchen.\n\nZweitens kann eine Nichtwirt-Kultur manche wirtsgebundenen Schädlinge und Krankheiten unterbrechen. Maiswurzelbohrer und Soja sind ein Beispiel aus Regionen, in denen der Schädling vorkommt, kein Nachweis für ein ägyptisches Feld. Einige Populationen oder Lebenszyklen überstehen eine einfache Einjahresrotation; Organismus und örtlichen Befall feststellen.'), ('Fünf Minuten für den Abschluss vorsehen und ohne Notizen in einem Satz antworten. In einem Satz erklären, warum eine passende Leguminose nach anspruchsvollem Getreide stehen kann. Eine gute Antwort nennt mögliche biologische N-Fixierung und dass die tatsächliche Gutschrift für die Folgekultur Belege braucht. Ein nachgewiesener Wirtsschädling oder Rückstandsziel ist gegebenenfalls getrennt zu begründen.', 'Fünf Minuten für den Abschluss vorsehen und ohne Notizen in einem Satz antworten. In einem Satz erklären, warum eine passende Leguminose nach anspruchsvollem Getreide stehen kann. Eine gute Antwort nennt mögliche biologische Stickstoff-Fixierung und dass die tatsächliche Gutschrift für die Folgekultur Belege braucht. Ein nachgewiesener Wirtsschädling oder Rückstandsziel ist gegebenenfalls getrennt zu begründen.'), ('Herr Evans · gemäßigter Lehrfall mit 10 Hektar. Vorgegebene Lehrdaten, keine eigenen Messungen. Ort unbekannt; Klima, Boden und Vorgeschichte bleiben erhalten. Kein ägyptischer Standort bestätigt. Der Fall erlaubt Warm- und Kühlsaisonkulturen; örtliche Saisontermine fehlen. Jahr1 aus der vorigen bedingten Empfehlung beginnen und Änderungen begründen. Gruppen von3–4 arbeiten mit Arbeitsblatt, Papier und Stiften. Die45 aktiven Minuten umfassen10+10 im vorigen Schritt sowie hier15 für Planung und10 für Vergleich:35 Arbeit und10 Diskussion. Mit den separat genannten2 Minuten Vorbereitung insgesamt47. Jede Gruppe teilt die erste Kulturwahl;2–3 Gruppen erläutern den ganzen Plan. Begründung und Überarbeitung bleiben individuell. Viertes Jahr, Deckfrucht, Markt/Geräte, Bildglossar und Zeichnung unterstützen das Lernen. Der fünfminütige Abschluss ohne Notizen ist getrennt.', 'Herr Evans · gemäßigter Lehrfall mit zehn Hektar. Vorgegebene Lehrdaten, keine eigenen Messungen. Ort unbekannt; Klima, Boden und Vorgeschichte bleiben erhalten. Kein ägyptischer Standort bestätigt. Der Fall erlaubt Warm- und Kühlsaisonkulturen; örtliche Saisontermine fehlen. Jahr eins aus der vorigen bedingten Empfehlung beginnen und Änderungen begründen. Gruppen von drei bis vier arbeiten mit Arbeitsblatt, Papier und Stiften. Die fünfundvierzig aktiven Minuten umfassen zehn plus zehn im vorigen Schritt sowie hier fünfzehn für Planung und zehn für Vergleich: fünfunddreißig Arbeit und zehn Diskussion. Mit den separat genannten zwei Minuten Vorbereitung insgesamt siebenundvierzig. Jede Gruppe teilt die erste Kulturwahl; zwei bis drei Gruppen erläutern den ganzen Plan. Begründung und Überarbeitung bleiben individuell. Viertes Jahr, Deckfrucht, Markt, Geräte, Bildglossar und Zeichnung unterstützen das Lernen. Der fünfminütige Abschluss ohne Notizen ist getrennt.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s303-readings-audio-20261023-r1'
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
    assert count < 10, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 40,'maximumCallsForLane':10,
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
    assert all(v<=10 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_TEN_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':10,'maximumBlindReviewPerLane':10,'maximumASRPerLane':10,'maximumTTSAggregate':40,'maximumBlindAggregate':40,'maximumASRAggregate':40,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
