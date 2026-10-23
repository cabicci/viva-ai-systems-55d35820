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
IDS = ('S3-17-ar-EG-R01-r1', 'S3-17-ar-EG-R02-r1', 'S3-17-ar-EG-R03-r1', 'S3-17-ar-EG-R04-r1', 'S3-17-ar-EG-R05-r1', 'S3-17-ar-EG-R06-r1', 'S3-17-en-R01-r1', 'S3-17-en-R02-r1', 'S3-17-en-R03-r1', 'S3-17-en-R04-r1', 'S3-17-en-R05-r1', 'S3-17-en-R06-r1', 'S3-17-it-R01-r1', 'S3-17-it-R02-r1', 'S3-17-it-R03-r1', 'S3-17-it-R04-r1', 'S3-17-it-R05-r1', 'S3-17-it-R06-r1', 'S3-17-de-R01-r1', 'S3-17-de-R02-r1', 'S3-17-de-R03-r1', 'S3-17-de-R04-r1', 'S3-17-de-R05-r1', 'S3-17-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S317_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-17')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s317-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1', '/reading/0/paragraphs/2'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الأربع مجموعات في المراجعة النهائية بتجمع أسئلة اختيار من متعدد، وإجابات مكتوبة، ومنتجات نهائية وخطوات عملية. المجموعة ١ فيها عينة تربة ٥٠٠ جم ببطاقة واختبار pH سريع بكيت ألوان. المجموعة ٢ فيها خمس قراءات pH لـField B وتقرير منفصل لـPaddock 3. المجموعة ٣ فيها خلطة طماطم ٥ كجم وتقدير قوام بالشريط والملمس. المجموعة ٤ فيها جدول محاصيل لثلاث ترب ومحاكاة انسكاب كاشف. خلي بيانات كل حالة وطرقها وتعليماتها ودليلها منفصلين. إنك اتدربت على الموضوع قبل كده أو قريت إجابة نموذج ما يثبتش إنك أنجزت المنتج أو العملية.\n\nاختبار الكيت السريع بالألوان غير القطب الرقمي للقطعة C؛ اتبع كارت الكيت الفعلي وتعليماته وإجراءات أمانه في مهمته. الإجابة المكتوبة محتاجة مراجعة التفكير والشروط؛ تعبية الخانات مش دليل إن الإجابة صحيحة. كل منتج أو عملية مطلوبين يتقيّموا على بطاقتهم، بدليل فعلي خاص بكل متدرب. التفكير أونلاين، وإجابة النموذج، ومشاهدة العرض ما يعوّضوش الدليل ده.', 'الأربع مجموعات في المراجعة النهائية بتجمع أسئلة اختيار من متعدد، وإجابات مكتوبة، ومنتجات نهائية وخطوات عملية. المجموعة واحد فيها عينة تربة خمسمية جرام ببطاقة واختبار بي إتش سريع بكيت ألوان. المجموعة اتنين فيها خمس قراءات بي إتش لـفيلد بي وتقرير منفصل لـبادوك تلاتة. المجموعة تلاتة فيها خلطة طماطم خمسة كيلوجرام وتقدير قوام بالشريط والملمس. المجموعة أربعة فيها جدول محاصيل لثلاث ترب ومحاكاة انسكاب كاشف. خلي بيانات كل حالة وطرقها وتعليماتها ودليلها منفصلين. إنك اتدربت على الموضوع قبل كده أو قريت إجابة نموذج ما يثبتش إنك أنجزت المنتج أو العملية.\n\nاختبار الكيت السريع بالألوان غير القطب الرقمي للقطعة سي؛ اتبع كارت الكيت الفعلي وتعليماته وإجراءات أمانه في مهمته. الإجابة المكتوبة محتاجة مراجعة التفكير والشروط؛ تعبية الخانات مش دليل إن الإجابة صحيحة. كل منتج أو عملية مطلوبين يتقيّموا على بطاقتهم، بدليل فعلي خاص بكل متدرب. التفكير أونلاين، وإجابة النموذج، ومشاهدة العرض ما يعوّضوش الدليل ده.'), ('المقيّم يكتب «كفء» فقط لو المهارة اتعملت بأمان ودقة للمعيار المحدد وشافها. غير كده يسجل «لسه غير مثبت» والسبب. مثلًا تحضير العينة الصح ما يجعلش pH صحيح لو معايرة الجهاز غلط. الطالب يراجع خطوة المعايرة، يتدرب عليها، وبعدها ينفذ محاولة جديدة يراها المدرّب.\n\nاكتب قرار المحاولة التانية الحقيقي بتاريخ ودليل وهوية المقيّم؛ ممكن تفضل لسه غير مثبت، فيتحدد تدريب ومحاولة تانية. محاولات الفهم الأونلاين مفتوحة مع مراجعة موجهة، والمعيار العملي يحتاج فعلًا حقيقيًا. بند التقييم الذاتي ٥٫٢ عن التقرير يفيد المراجعة الشخصية؛ جدول الأصل مفيهوش تشغيل وصيانة العزّاقة، فضيف سؤال تقييم ذاتي واضح عنهم من غير نتيجة عملية افتراضية.', 'المقيّم يكتب «كفء» فقط لو المهارة اتعملت بأمان ودقة للمعيار المحدد وشافها. غير كده يسجل «لسه غير مثبت» والسبب. مثلًا تحضير العينة الصح ما يجعلش بي إتش صحيح لو معايرة الجهاز غلط. الطالب يراجع خطوة المعايرة، يتدرب عليها، وبعدها ينفذ محاولة جديدة يراها المدرّب.\n\nاكتب قرار المحاولة التانية الحقيقي بتاريخ ودليل وهوية المقيّم؛ ممكن تفضل لسه غير مثبت، فيتحدد تدريب ومحاولة تانية. محاولات الفهم الأونلاين مفتوحة مع مراجعة موجهة، والمعيار العملي يحتاج فعلًا حقيقيًا. بند التقييم الذاتي خمسة فاصلة اتنين عن التقرير يفيد المراجعة الشخصية؛ جدول الأصل مفيهوش تشغيل وصيانة العزّاقة، فضيف سؤال تقييم ذاتي واضح عنهم من غير نتيجة عملية افتراضية.'), ('خلي تقرير القطعة C في صفحة واحدة فيها خمس أجزاء واضحة: (١) عنوان وبيانات الهوية: اسم المتدرب، والتاريخ الفعلي، والقطعة ومكانها؛ (٢) مقدمة بتوضح غرض الاختبار؛ (٣) نتائج فيها هوية العينة والطرق وقراءة pH الخام الفعلية ودليل القوام؛ (٤) تفسير ومناقشة للي النتائج بتدعمه وحدودها؛ (٥) توصيات بمحصولين محتملين بشروطهم وخطوة إدارة مبررة واحدة على الأقل. العنوان في نفس الصفحة، مش غلاف في صفحة زيادة. حوالي ٢٠ دقيقة كتابة فعلية في المصدر بييجوا بعد التطبيق على مراحل؛ التجفيف وتجهيز الجهاز وانتظار اتزان pH ليهم أوقات فعلية منفصلة تتسجل. اكتب البيانات اللي مش متاحة بصدق في مسودة معلّقة، من غير نسخ رقم نموذج أو ادعاء إكمال تقرير النتائج الفعلية.\n\nاستخدم اسم القطعة C باستمرار في المهمة دي وتقريرها. اشرح القوام من الشريط والملمس المرصودين أو طريقة نسبة حبيبات موثقة. جنب اقتراح المحاصيل والتعديل اذكر حدود المطر والحرارة والمياه والصرف والملوحة والعناصر الغذائية اللي ما اتقاستش.', 'خلي تقرير القطعة سي في صفحة واحدة فيها خمس أجزاء واضحة: (واحد) عنوان وبيانات الهوية: اسم المتدرب، والتاريخ الفعلي، والقطعة ومكانها؛ (اتنين) مقدمة بتوضح غرض الاختبار؛ (تلاتة) نتائج فيها هوية العينة والطرق وقراءة بي إتش الخام الفعلية ودليل القوام؛ (أربعة) تفسير ومناقشة للي النتائج بتدعمه وحدودها؛ (خمسة) توصيات بمحصولين محتملين بشروطهم وخطوة إدارة مبررة واحدة على الأقل. العنوان في نفس الصفحة، مش غلاف في صفحة زيادة. حوالي عشرين دقيقة كتابة فعلية في المصدر بييجوا بعد التطبيق على مراحل؛ التجفيف وتجهيز الجهاز وانتظار اتزان بي إتش ليهم أوقات فعلية منفصلة تتسجل. اكتب البيانات اللي مش متاحة بصدق في مسودة معلّقة، من غير نسخ رقم نموذج أو ادعاء إكمال تقرير النتائج الفعلية.\n\nاستخدم اسم القطعة سي باستمرار في المهمة دي وتقريرها. اشرح القوام من الشريط والملمس المرصودين أو طريقة نسبة حبيبات موثقة. جنب اقتراح المحاصيل والتعديل اذكر حدود المطر والحرارة والمياه والصرف والملوحة والعناصر الغذائية اللي ما اتقاستش.'), ('فني التربة بيشتغل زي المحقق: يحدد منطقة أخذ العينة، ويجمعها تحت إشراف، ويستخدم إجراءات pH والقوام المعتمدة فعلًا، ويفهم معنى كل نتيجة، وبعدها يكتب توصية مبررة. موسم المزارع بيعتمد على أكتر من اختبارين؛ pH والقوام المعدني لوحدهم ما يبيّنوش كل الخصوبة والملوحة والصرف والجو وقيود المحصول.\n\nالمهمة الختامية تختبر الدقة والسلامة والتفسير والتواصل والاستعداد لتدريب مهارة ناقصة. التقرير المرتب دليل كتابة وتفسير، لكن كل مهارة عملية محتاجة سجل فردي يشوفه المدرّب. شغل المجموعة أو نموذج محفوظ أو تقييم الطالب لنفسه ما يتحولش لقياس مهارة.\n\nاعتبر نفسك فني زراعي مبتدئ بتنصح مزارع محلي عن القطعة C وموسم زراعة جاي. حافظ على خمس أجزاء التقرير في صفحة واحدة. فترة الكتابة اللي مدتها ٢٠ دقيقة في المصدر وقت كتابة فعلي بعد التطبيق على مراحل؛ التجفيف وانتظار اتزان pH الحقيقيين منفصلين. ما تبدلش بيانات القطعة C بسجلات Field B أو Paddock 3 في البنك.', 'فني التربة بيشتغل زي المحقق: يحدد منطقة أخذ العينة، ويجمعها تحت إشراف، ويستخدم إجراءات بي إتش والقوام المعتمدة فعلًا، ويفهم معنى كل نتيجة، وبعدها يكتب توصية مبررة. موسم المزارع بيعتمد على أكتر من اختبارين؛ بي إتش والقوام المعدني لوحدهم ما يبيّنوش كل الخصوبة والملوحة والصرف والجو وقيود المحصول.\n\nالمهمة الختامية تختبر الدقة والسلامة والتفسير والتواصل والاستعداد لتدريب مهارة ناقصة. التقرير المرتب دليل كتابة وتفسير، لكن كل مهارة عملية محتاجة سجل فردي يشوفه المدرّب. شغل المجموعة أو نموذج محفوظ أو تقييم الطالب لنفسه ما يتحولش لقياس مهارة.\n\nاعتبر نفسك فني زراعي مبتدئ بتنصح مزارع محلي عن القطعة سي وموسم زراعة جاي. حافظ على خمس أجزاء التقرير في صفحة واحدة. فترة الكتابة اللي مدتها عشرين دقيقة في المصدر وقت كتابة فعلي بعد التطبيق على مراحل؛ التجفيف وانتظار اتزان بي إتش الحقيقيين منفصلين. ما تبدلش بيانات القطعة سي بسجلات فيلد بي أو بادوك تلاتة في البنك.'), ('مثال آخر في الأصل pH ٥٫٨ وقوام لومي رملي وشريط نصف بوصة وملمس خشن. USDA-NRCS وOregon State يصنفان ٥٫٨ حمضيًا متوسطًا، فعبارة الأصل «حمضي قليلًا» لا تطابق المقياس المذكور. الحموضة قد تؤثر في تيسر العناصر، والتربة اللومية الرملية قد تصرف الماء أسرع وتحفظ أقل حسب بنائها. دي أسئلة للتحقق، مش تشخيص كامل.\n\nالبطاطس والفراولة هما زوج المحاصيل في المثال، والذرة مذكورة كمان لو باقي الظروف مناسبة. خليهم مرشحين، مش خطة زراعة مضمونة. في مثال منفصل لرفع pH من ٥٫٨ باتجاه ٦٫٥، المصدر بيسمّي الذرة والبرسيم الحجازي كأمثلة لتوسيع اختيارات المحاصيل، وبيقترح حجر جيري زراعي. ده تبرير مشروط لهدف المحصول، مش جرعة جير ولا هدف pH عام. المصدر بيقترح كمان مادة عضوية أو محاصيل غطاء. لازم تتراجع احتياجات المحصول الفعلية، وتحليل الاحتياج للجير، وتحليل المادة، والصرف والملاءمة المحلية قبل أي جرعة أو علاج ثابت؛ المادة العضوية ممكن تحسن البناء من غير تغيير فئة القوام المعدني.', 'مثال آخر في الأصل بي إتش خمسة فاصلة تمانية وقوام لومي رملي وشريط نصف بوصة وملمس خشن. يو إس دي إيه-إن آر سي إس وأوريجون ستيت بيصنفوا خمسة فاصلة تمانية حمضيًا متوسطًا، فعبارة الأصل «حمضي قليلًا» لا تطابق المقياس المذكور. الحموضة ممكن تأثر في تيسر العناصر، والتربة اللومية الرملية قد تصرف الماء أسرع وتحفظ أقل حسب بنائها. دي أسئلة للتحقق، مش تشخيص كامل.\n\nالبطاطس والفراولة هما زوج المحاصيل في المثال، والذرة مذكورة كمان لو باقي الظروف مناسبة. خليهم مرشحين، مش خطة زراعة مضمونة. في مثال منفصل لرفع بي إتش من خمسة فاصلة تمانية باتجاه ستة فاصلة خمسة، المصدر بيسمّي الذرة والبرسيم الحجازي كأمثلة لتوسيع اختيارات المحاصيل، وبيقترح حجر جيري زراعي. ده تبرير مشروط لهدف المحصول، مش جرعة جير ولا هدف بي إتش عام. المصدر بيقترح كمان مادة عضوية أو محاصيل غطاء. لازم تتراجع احتياجات المحصول الفعلية، وتحليل الاحتياج للجير، وتحليل المادة، والصرف والملاءمة المحلية قبل أي جرعة أو علاج ثابت؛ المادة العضوية ممكن تحسن البناء من غير تغيير فئة القوام المعدني.'), ('نموذج التعليم للقطعة C في الأصل pH ٦٫٨ وقوام لومي، وبيقترح طماطم وذرة وكمبوست سنوي ومتابعة pH كل ١–٢ سنة. حافظ على الأرقام والأسماء والمواعيد كأمثلة الأصل، مش قياس الطالب أو جدول إلزامي. ملاءمة الطماطم والذرة مرتبطة كمان بالمناخ والمياه والموسم والملوحة والعناصر وبنية الحقل الفعلية.\n\nاللومي غالبًا توازن مفيد في حجم الحبيبات، وpH ٦٫٨ محايد حسب تصنيف USDA-NRCS وOregon State University Extension المستخدم في المراجعة. ده لا يثبت إن «التربة ممتازة» في كل شيء زي ما قال الأصل. ارجع لتحليل معمل وملاحظات الموقع والمحصول قبل إعلان صحة كاملة أو تحديد نوع/كمية/تكرار كمبوست. هنا «محايد» اسم فئة في مقياس تفاعل التربة؛ ٦٫٨ لسه أقل من ٧ وقريب كيميائيًا من التعادل. وضّح التصنيف المستخدم.', 'نموذج التعليم للقطعة سي في الأصل بي إتش ستة فاصلة تمانية وقوام لومي، وبيقترح طماطم وذرة وكمبوست سنوي ومتابعة بي إتش كل واحد إلى اتنين سنة. حافظ على الأرقام والأسماء والمواعيد كأمثلة الأصل، مش قياس الطالب أو جدول إلزامي. ملاءمة الطماطم والذرة مرتبطة كمان بالمناخ والمياه والموسم والملوحة والعناصر وبنية الحقل الفعلية.\n\nاللومي غالبًا توازن مفيد في حجم الحبيبات، وبي إتش ستة فاصلة تمانية محايد حسب تصنيف يو إس دي إيه-إن آر سي إس وإرشاد جامعة أوريجون ستيت المستخدم في المراجعة. ده لا يثبت إن «التربة ممتازة» في كل شيء زي ما قال الأصل. ارجع لتحليل معمل وملاحظات الموقع والمحصول قبل إعلان صحة كاملة أو تحديد نوع، كمية، تكرار كمبوست. هنا «محايد» اسم فئة في مقياس تفاعل التربة؛ ستة فاصلة تمانية لسه أقل من سبعة وقريب كيميائيًا من التعادل. وضّح التصنيف المستخدم.')], 'en': [("A soil technician acts like an investigator: identify the sampling area, collect the sample under supervision, use the actual approved pH and texture procedures, inspect what each result says and report a reasoned recommendation. The grower's season depends on more than two tests; pH and mineral texture do not by themselves reveal all fertility, salinity, drainage, climate or crop constraints.\n\nThe final task checks safe precise procedure, interpretation, communication and willingness to practise a missing skill. A polished report is evidence for reporting and reasoning; each physical technique needs a separate individual trainer record. Do not turn a group result, a remembered model or a self-rating into a measured skill.\n\nAct as a junior agricultural technician advising a local grower about Plot C and a coming crop season. Preserve the five report sections within one page. The source's 20-minute writing period is active writing after staged practical work; genuine drying and pH equilibration are separate. Do not substitute the bank's Field B or Paddock 3 records for Plot C.", "A soil technician acts like an investigator: identify the sampling area, collect the sample under supervision, use the actual approved P H and texture procedures, inspect what each result says and report a reasoned recommendation. The grower's season depends on more than two tests; P H and mineral texture do not by themselves reveal all fertility, salinity, drainage, climate or crop constraints.\n\nThe final task checks safe precise procedure, interpretation, communication and willingness to practise a missing skill. A polished report is evidence for reporting and reasoning; each physical technique needs a separate individual trainer record. Do not turn a group result, a remembered model or a self-rating into a measured skill.\n\nAct as a junior agricultural technician advising a local grower about Plot C and a coming crop season. Preserve the five report sections within one page. The source's twenty-minute writing period is active writing after staged practical work; genuine drying and P H equilibration are separate. Do not substitute the bank's Field B or Paddock three records for Plot C."), ("Another source example uses pH 5.8 and sandy loam, with a 0.5-inch ribbon and gritty feel. USDA-NRCS and Oregon State University Extension classify pH 5.8 as moderately acidic; the source's 'slightly acidic' label is inconsistent with those cited scales. Low pH may affect nutrient availability, while sandy loam can have relatively rapid drainage and lower retention under some structures. Those are questions to check, not a complete diagnosis.\n\nPotatoes and strawberries are the example crop pair, with corn also mentioned if further conditions fit. Retain them as candidates, not a guaranteed field plan. In the separate illustrative move from pH 5.8 toward 6.5, the source names corn and alfalfa as examples of broader crop options and suggests agricultural limestone. That is a conditional crop-target rationale, not a lime dose or a universal pH target. Organic matter or cover cropping is also suggested. Actual crop requirements, lime-requirement testing, material analysis, drainage and local suitability must be checked before a rate or fixed treatment; organic matter may improve structure without changing mineral texture class.", "Another source example uses P H five point eight and sandy loam, with a zero point five-inch ribbon and gritty feel. U S D A-N R C S and Oregon State University Extension classify P H five point eight as moderately acidic; the source's 'slightly acidic' label is inconsistent with those cited scales. Low P H may affect nutrient availability, while sandy loam can have relatively rapid drainage and lower retention under some structures. Those are questions to check, not a complete diagnosis.\n\nPotatoes and strawberries are the example crop pair, with corn also mentioned if further conditions fit. Retain them as candidates, not a guaranteed field plan. In the separate illustrative move from P H five point eight toward six point five, the source names corn and alfalfa as examples of broader crop options and suggests agricultural limestone. That is a conditional crop-target rationale, not a lime dose or a universal P H target. Organic matter or cover cropping is also suggested. Actual crop requirements, lime-requirement testing, material analysis, drainage and local suitability must be checked before a rate or fixed treatment; organic matter may improve structure without changing mineral texture class."), ("Keep five clear sections within the one-page Plot C report: (1) title/identity heading with learner name, actual date and field/location; (2) introduction stating the test purpose; (3) results identifying the sample, methods, actual raw pH and texture evidence; (4) interpretation and discussion of what those results support and their limits; (5) recommendations with two conditional crop candidates and at least one justified management action. The title is a heading on that page, not an extra cover sheet. The source's approximately 20-minute active writing block follows the staged practical work; actual drying, instrument preparation and pH equilibration take their own recorded time. Mark unavailable data honestly in a pending draft, without copying a model value or claiming the completed actual-results report.\n\nUse Plot C consistently for this ongoing task and its report. Explain the texture from observed ribbon/feel or documented percentage method. Put limitations beside crop and amendment choices, including climate, water, drainage, salinity and lab nutrient data not measured here.", "Keep five clear sections within the one-page Plot C report: (one) title, identity heading with learner name, actual date and field, location; (two) introduction stating the test purpose; (three) results identifying the sample, methods, actual raw P H and texture evidence; (four) interpretation and discussion of what those results support and their limits; (five) recommendations with two conditional crop candidates and at least one justified management action. The title is a heading on that page, not an extra cover sheet. The source's approximately twenty-minute active writing block follows the staged practical work; actual drying, instrument preparation and P H equilibration take their own recorded time. Mark unavailable data honestly in a pending draft, without copying a model value or claiming the completed actual-results report.\n\nUse Plot C consistently for this ongoing task and its report. Explain the texture from observed ribbon, feel or documented percentage method. Put limitations beside crop and amendment choices, including climate, water, drainage, salinity and lab nutrient data not measured here."), ("The assessor records 'competent' only when a particular skill has been safely and accurately demonstrated to its defined standard. Otherwise the record says 'not yet demonstrated' and names the gap. For example, correct sample preparation does not make a pH result valid if the meter calibration was wrong. The learner reviews that calibration step, practises it, then performs a new observed attempt.\n\nRecord the actual second decision with date, evidence and trainer identity. It may still be 'not yet demonstrated'; offer another targeted practice and attempt as appropriate. Online knowledge attempts are open with directed review, while a practical criterion requires a real observed action. Self-assessment item 5.2 about submitting a report supports reflection; the original self-check table omits cultivator operation/maintenance, so add an honest reflection prompt for those skills without filling a trainer result.", "The assessor records 'competent' only when a particular skill has been safely and accurately demonstrated to its defined standard. Otherwise the record says 'not yet demonstrated' and names the gap. For example, correct sample preparation does not make a P H result valid if the meter calibration was wrong. The learner reviews that calibration step, practises it, then performs a new observed attempt.\n\nRecord the actual second decision with date, evidence and trainer identity. It may still be 'not yet demonstrated'; offer another targeted practice and attempt as appropriate. Online knowledge attempts are open with directed review, while a practical criterion requires a real observed action. Self-assessment item five point two about submitting a report supports reflection; the original self-check table omits cultivator operation, maintenance, so add an honest reflection prompt for those skills without filling a trainer result."), ("The four final-review sets bring together multiple-choice questions, written answers, finished products and practical processes. Set 1 includes a labelled 500 g soil sample and a rapid colour-kit pH test. Set 2 includes five Field B pH readings and a separate Paddock 3 report. Set 3 includes a 5 kg tomato-mix product and texture by the ribbon/feel method. Set 4 includes a crop chart for three soils and a simulated reagent spill. Keep each case's data, methods, instructions and evidence separate. Practising a topic earlier or reading a model answer does not prove completion of its product or process.\n\nThe colorimetric rapid-kit task is distinct from Plot C's digital electrode; use the actual kit's chart, instructions and safety procedure for that task. A written response needs review of its reasoning and conditions; filled fields do not prove a correct answer. Each required product or process must be assessed against its own checklist with individual actual evidence. Online reasoning, a model answer and watching a demonstration do not substitute for that evidence.", "The four final-review sets bring together multiple-choice questions, written answers, finished products and practical processes. Set one includes a labelled five hundred grams soil sample and a rapid colour-kit P H test. Set two includes five Field B P H readings and a separate Paddock three report. Set three includes a five kilograms tomato-mix product and texture by the ribbon, feel method. Set four includes a crop chart for three soils and a simulated reagent spill. Keep each case's data, methods, instructions and evidence separate. Practising a topic earlier or reading a model answer does not prove completion of its product or process.\n\nThe colorimetric rapid-kit task is distinct from Plot C's digital electrode; use the actual kit's chart, instructions and safety procedure for that task. A written response needs review of its reasoning and conditions; filled fields do not prove a correct answer. Each required product or process must be assessed against its own checklist with individual actual evidence. Online reasoning, a model answer and watching a demonstration do not substitute for that evidence."), ("The supplied Plot C teaching model has pH 6.8 and loam texture. It suggests tomatoes and corn, annual compost and pH monitoring every 1–2 years. Keep those exact figures, crops and intervals as the source example, never as the learner's observation or a mandatory management schedule. Tomatoes and corn also depend on climate, water, season, salinity, nutrients and actual field structure.\n\nA loam label often signals a useful particle-size balance, and pH 6.8 is neutral under the cited USDA-NRCS and Oregon State University Extension reaction classes. These facts do not prove that the entire soil is in 'excellent condition'. Check a site- and crop-specific lab report and field observations before asserting health or prescribing compost quality, rate or frequency. Here 'neutral' names a soil-reaction class; 6.8 remains below 7 and chemically near neutral. State the classification used.", "The supplied Plot C teaching model has P H six point eight and loam texture. It suggests tomatoes and corn, annual compost and P H monitoring every one to two years. Keep those exact figures, crops and intervals as the source example, never as the learner's observation or a mandatory management schedule. Tomatoes and corn also depend on climate, water, season, salinity, nutrients and actual field structure.\n\nA loam label often signals a useful particle-size balance, and P H six point eight is neutral under the cited U S D A-N R C S and Oregon State University Extension reaction classes. These facts do not prove that the entire soil is in 'excellent condition'. Check a site- and crop-specific lab report and field observations before asserting health or prescribing compost quality, rate or frequency. Here 'neutral' names a soil-reaction class; six point eight remains below seven and chemically near neutral. State the classification used.")], 'it': [('Il modello didattico fornito per C ha pH 6.8 e tessitura franca; suggerisce pomodoro e mais, compost ogni anno e controllo pH ogni 1–2 anni. Conservare esattamente numeri, colture e tempi come esempi della fonte, non misure personali né programma obbligatorio. Pomodoro e mais dipendono anche da clima, acqua, stagione, salinità, nutrienti e struttura effettiva.\n\nIl franco indica spesso equilibrio utile delle particelle e pH 6.8 è neutro secondo classi USDA-NRCS e Oregon State University Extension citate nella revisione. Non basta per dire che tutto il terreno sia in «condizioni eccellenti». Servono laboratorio adatto alla coltura e osservazioni del campo prima di giudicare salute o prescrivere qualità, dose e frequenza del compost. Qui «neutro» indica una classe di reazione del suolo; 6,8 resta sotto 7 e chimicamente vicino alla neutralità. Dichiara la classificazione usata.', 'Il modello didattico fornito per C ha pi acca sei virgola otto e tessitura franca; suggerisce pomodoro e mais, compost ogni anno e controllo pi acca ogni uno a due anni. Conservare esattamente numeri, colture e tempi come esempi della fonte, non misure personali né programma obbligatorio. Pomodoro e mais dipendono anche da clima, acqua, stagione, salinità, nutrienti e struttura effettiva.\n\nIl franco indica spesso equilibrio utile delle particelle e pi acca sei virgola otto è neutro secondo classi u esse di a-enne erre ci esse e Oregon State University Extension citate nella revisione. Non basta per dire che tutto il terreno sia in «condizioni eccellenti». Servono laboratorio adatto alla coltura e osservazioni del campo prima di giudicare salute o prescrivere qualità, dose e frequenza del compost. Qui «neutro» indica una classe di reazione del suolo; sei virgola otto resta sotto sette e chimicamente vicino alla neutralità. Dichiara la classificazione usata.'), ("Il tecnico del suolo lavora come investigatore: definisce l’area, raccoglie campione sotto supervisione, usa metodi pH/tessitura approvati, interpreta ogni dato e propone una raccomandazione motivata. La stagione agricola dipende da più di due test; pH e tessitura minerale da soli non rivelano tutta la fertilità, salinità, drenaggio, clima e vincoli colturali.\n\nIl compito finale verifica procedimento accurato e sicuro, interpretazione, comunicazione e recupero della capacità mancante. Una bella relazione prova scrittura/ragionamento, mentre ogni tecnica fisica richiede registro individuale del formatore. Risultato del gruppo, memoria del modello e autovalutazione non sono abilità misurate.\n\nAgisci da tecnico agricolo principiante che consiglia un coltivatore locale sull'Appezzamento C e sulla prossima stagione. Mantieni le cinque sezioni in una pagina. I 20 minuti della fonte sono scrittura attiva dopo la pratica per fasi; essiccazione ed equilibrazione pH autentiche sono separate. Non sostituire C con i registri di Field B o Paddock 3 della banca.", "Il tecnico del suolo lavora come investigatore: definisce l’area, raccoglie campione sotto supervisione, usa metodi pi acca, tessitura approvati, interpreta ogni dato e propone una raccomandazione motivata. La stagione agricola dipende da più di due test; pi acca e tessitura minerale da soli non rivelano tutta la fertilità, salinità, drenaggio, clima e vincoli colturali.\n\nIl compito finale verifica procedimento accurato e sicuro, interpretazione, comunicazione e recupero della capacità mancante. Una bella relazione prova scrittura, ragionamento, mentre ogni tecnica fisica richiede registro individuale del formatore. Risultato del gruppo, memoria del modello e autovalutazione non sono abilità misurate.\n\nAgisci da tecnico agricolo principiante che consiglia un coltivatore locale sull'Appezzamento C e sulla prossima stagione. Mantieni le cinque sezioni in una pagina. I venti minuti della fonte sono scrittura attiva dopo la pratica per fasi; essiccazione ed equilibrazione pi acca autentiche sono separate. Non sostituire C con i registri di Field B o Paddock tre della banca."), ('Il valutatore segna «competente» solo quando la singola abilità è dimostrata in modo sicuro e accurato. Altrimenti «non ancora dimostrata» con motivo. Una preparazione corretta del campione non sana una calibrazione pH errata. L’allievo ripassa quella calibrazione, si esercita e fa una nuova prova osservata.\n\nLa seconda decisione va datata con prova e identità del formatore. Può ancora essere non dimostrata, con ulteriore pratica mirata. Le prove teoriche online hanno ritentativi liberi con ripasso; quella pratica richiede azione vera. Autovalutazione 5.2 sulla relazione aiuta riflessione; la tabella originale omette uso e manutenzione della motozappa, quindi aggiungere una domanda esplicita di autovalutazione su tali abilità senza inventare un esito firmato.', 'Il valutatore segna «competente» solo quando la singola abilità è dimostrata in modo sicuro e accurato. Altrimenti «non ancora dimostrata» con motivo. Una preparazione corretta del campione non sana una calibrazione pi acca errata. L’allievo ripassa quella calibrazione, si esercita e fa una nuova prova osservata.\n\nLa seconda decisione va datata con prova e identità del formatore. Può ancora essere non dimostrata, con ulteriore pratica mirata. Le prove teoriche online hanno ritentativi liberi con ripasso; quella pratica richiede azione vera. Autovalutazione cinque virgola due sulla relazione aiuta riflessione; la tabella originale omette uso e manutenzione della motozappa, quindi aggiungere una domanda esplicita di autovalutazione su tali abilità senza inventare un esito firmato.'), ("Le quattro serie finali riuniscono domande a scelta multipla, risposte scritte, prodotti finiti e procedure pratiche. La serie 1 comprende un campione di terreno etichettato da 500 g e un test pH rapido colorimetrico. La serie 2 comprende cinque letture pH di Field B e una relazione separata su Paddock 3. La serie 3 comprende una miscela per pomodori da 5 kg e la tessitura con nastro/tatto. La serie 4 comprende una tabella colturale per tre terreni e uno sversamento simulato di reagente. Mantieni separati dati, metodi, istruzioni ed evidenze di ogni caso. Aver praticato prima l'argomento o letto una risposta modello non prova il completamento del prodotto o della procedura.\n\nIl test rapido colorimetrico è distinto dall'elettrodo digitale di C: per quel compito usare scala, istruzioni e sicurezza del kit effettivo. Una risposta scritta richiede revisione del ragionamento e delle condizioni; campi compilati non provano una risposta corretta. Ogni prodotto o processo richiesto va valutato secondo la propria scheda con evidenze individuali effettive. Ragionamento online, risposta modello e visione di una dimostrazione non sostituiscono tali evidenze.", "Le quattro serie finali riuniscono domande a scelta multipla, risposte scritte, prodotti finiti e procedure pratiche. La serie uno comprende un campione di terreno etichettato da cinquecento grammi e un test pi acca rapido colorimetrico. La serie due comprende cinque letture pi acca di Field B e una relazione separata su Paddock tre. La serie tre comprende una miscela per pomodori da cinque chilogrammi e la tessitura con nastro, tatto. La serie quattro comprende una tabella colturale per tre terreni e uno sversamento simulato di reagente. Mantieni separati dati, metodi, istruzioni ed evidenze di ogni caso. Aver praticato prima l'argomento o letto una risposta modello non prova il completamento del prodotto o della procedura.\n\nIl test rapido colorimetrico è distinto dall'elettrodo digitale di C: per quel compito usare scala, istruzioni e sicurezza del kit effettivo. Una risposta scritta richiede revisione del ragionamento e delle condizioni; campi compilati non provano una risposta corretta. Ogni prodotto o processo richiesto va valutato secondo la propria scheda con evidenze individuali effettive. Ragionamento online, risposta modello e visione di una dimostrazione non sostituiscono tali evidenze."), ("Mantieni cinque sezioni chiare nella relazione di una pagina sull'Appezzamento C: (1) titolo/intestazione con nome dell'allievo, data effettiva e campo/località; (2) introduzione con lo scopo dell'analisi; (3) risultati con identità del campione, metodi, pH grezzo effettivo ed evidenze della tessitura; (4) interpretazione e discussione di ciò che i risultati sostengono e dei limiti; (5) raccomandazioni con due colture candidate condizionate e almeno un'azione di gestione motivata. Il titolo è un'intestazione nella stessa pagina, non una copertina aggiuntiva. I circa 20 minuti di scrittura attiva della fonte seguono la pratica per fasi; essiccazione, preparazione dello strumento ed equilibrazione pH hanno tempi effettivi separati da registrare. Dichiara onestamente i dati mancanti in una bozza in sospeso, senza copiare valori del modello o dichiarare completata la relazione sui risultati effettivi.\n\nUsa sempre l’identificativo dell’Appezzamento C per questa attività e la sua relazione. Motivare la tessitura da nastro/tatto osservati o da un’analisi granulometrica documentata. Accanto a colture e ammendanti dichiarare clima, acqua, drenaggio, salinità e nutrienti di laboratorio che qui non sono stati misurati.", "Mantieni cinque sezioni chiare nella relazione di una pagina sull'Appezzamento C: (uno) titolo, intestazione con nome dell'allievo, data effettiva e campo, località; (due) introduzione con lo scopo dell'analisi; (tre) risultati con identità del campione, metodi, pi acca grezzo effettivo ed evidenze della tessitura; (quattro) interpretazione e discussione di ciò che i risultati sostengono e dei limiti; (cinque) raccomandazioni con due colture candidate condizionate e almeno un'azione di gestione motivata. Il titolo è un'intestazione nella stessa pagina, non una copertina aggiuntiva. I circa venti minuti di scrittura attiva della fonte seguono la pratica per fasi; essiccazione, preparazione dello strumento ed equilibrazione pi acca hanno tempi effettivi separati da registrare. Dichiara onestamente i dati mancanti in una bozza in sospeso, senza copiare valori del modello o dichiarare completata la relazione sui risultati effettivi.\n\nUsa sempre l’identificativo dell’Appezzamento C per questa attività e la sua relazione. Motivare la tessitura da nastro, tatto osservati o da un’analisi granulometrica documentata. Accanto a colture e ammendanti dichiarare clima, acqua, drenaggio, salinità e nutrienti di laboratorio che qui non sono stati misurati."), ("Un altro esempio della fonte usa pH 5.8 e franco sabbioso, nastro di mezzo pollice e sensazione granulosa. USDA-NRCS e Oregon State classificano pH 5.8 moderatamente acido: l’etichetta originale «leggermente acido» non concorda con tali scale. pH basso può influire sulla disponibilità; franco sabbioso può drenare più rapidamente e trattenere meno secondo struttura. Sono ipotesi da verificare, non diagnosi completa.\n\nPatate e fragole sono la coppia di colture dell'esempio; anche il mais è menzionato se le altre condizioni sono adatte. Restano candidati, non un piano garantito. Nel distinto esempio di passaggio da pH 5,8 verso 6,5, la fonte cita mais ed erba medica per illustrare una scelta colturale più ampia e propone calcare agricolo. È una motivazione condizionata dell'obiettivo colturale, non una dose né un obiettivo pH universale. Propone anche materia organica o colture di copertura. Prima di una dose o trattamento fisso vanno verificati requisiti effettivi della coltura, fabbisogno di correzione calcarea, analisi del materiale, drenaggio e idoneità locale; la materia organica può migliorare la struttura senza cambiare la classe minerale.", "Un altro esempio della fonte usa pi acca cinque virgola otto e franco sabbioso, nastro di mezzo pollice e sensazione granulosa. u esse di a-enne erre ci esse e Oregon State classificano pi acca cinque virgola otto moderatamente acido: l’etichetta originale «leggermente acido» non concorda con tali scale. pi acca basso può influire sulla disponibilità; franco sabbioso può drenare più rapidamente e trattenere meno secondo struttura. Sono ipotesi da verificare, non diagnosi completa.\n\nPatate e fragole sono la coppia di colture dell'esempio; anche il mais è menzionato se le altre condizioni sono adatte. Restano candidati, non un piano garantito. Nel distinto esempio di passaggio da pi acca cinque virgola otto verso sei virgola cinque, la fonte cita mais ed erba medica per illustrare una scelta colturale più ampia e propone calcare agricolo. È una motivazione condizionata dell'obiettivo colturale, non una dose né un obiettivo pi acca universale. Propone anche materia organica o colture di copertura. Prima di una dose o trattamento fisso vanno verificati requisiti effettivi della coltura, fabbisogno di correzione calcarea, analisi del materiale, drenaggio e idoneità locale; la materia organica può migliorare la struttura senza cambiare la classe minerale.")], 'de': [('Das bereitgestellte C-Lehrmodell hat pH 6.8 und lehmige Bodenart. Es nennt Tomaten und Mais, jährlichen Kompost sowie pH-Kontrolle alle 1–2 Jahre. Diese Zahlen, Arten und Abstände exakt als Quellbeispiel behalten, nicht als Eigenmessung oder Pflichtplan. Tomate und Mais brauchen auch geeignetes Klima, Wasser, Saison, Salzgehalt, Nährstoffe und wirkliche Feldstruktur.\n\nLehmige Bodenart deutet häufig auf hilfreiche Partikelmischung, pH 6.8 ist neutral nach den herangezogenen USDA-NRCS- und Oregon-State-Klassen. Das beweist nicht „ausgezeichneten“ Gesamtzustand. Standort- und kulturspezifisches Labor sowie Feldbeobachtung prüfen, bevor Kompostart, Menge und Häufigkeit oder Gesundheit behauptet werden. Hier bezeichnet «neutral» eine Bodenreaktionsklasse; 6,8 liegt weiterhin unter 7 und chemisch nahe am Neutralpunkt. Die verwendete Einteilung nennen.', 'Das bereitgestellte C-Lehrmodell hat Pe Ha sechs Komma acht und lehmige Bodenart. Es nennt Tomaten und Mais, jährlichen Kompost sowie Pe Ha-Kontrolle alle eins bis zwei Jahre. Diese Zahlen, Arten und Abstände exakt als Quellbeispiel behalten, nicht als Eigenmessung oder Pflichtplan. Tomate und Mais brauchen auch geeignetes Klima, Wasser, Saison, Salzgehalt, Nährstoffe und wirkliche Feldstruktur.\n\nLehmige Bodenart deutet häufig auf hilfreiche Partikelmischung, Pe Ha sechs Komma acht ist neutral nach den herangezogenen U Es De A-En Er Ce Es- und Oregon-State-Klassen. Das beweist nicht „ausgezeichneten“ Gesamtzustand. Standort- und kulturspezifisches Labor sowie Feldbeobachtung prüfen, bevor Kompostart, Menge und Häufigkeit oder Gesundheit behauptet werden. Hier bezeichnet «neutral» eine Bodenreaktionsklasse; sechs Komma acht liegt weiterhin unter sieben und chemisch nahe am Neutralpunkt. Die verwendete Einteilung nennen.'), ('Die vier Abschlussserien verbinden Auswahlfragen, schriftliche Antworten, fertige Produkte und praktische Verfahren. Serie 1 enthält eine gekennzeichnete 500-g-Bodenprobe und einen kolorimetrischen pH-Schnelltest. Serie 2 enthält fünf pH-Messwerte zu Field B und einen getrennten Bericht zu Paddock 3. Serie 3 enthält eine 5-kg-Tomatenmischung und die Bodenartbestimmung mit Band/Fühlen. Serie 4 enthält eine Kulturtafel für drei Böden und simuliertes Reagenzverschütten. Daten, Methoden, Anweisungen und Nachweise jedes Falls getrennt halten. Ein früher geübtes Thema oder eine gelesene Musterantwort beweist keinen fertiggestellten Gegenstand oder ausgeführten Prozess.\n\nDas kolorimetrische Schnellset ist von der digitalen Elektrode der Fläche C verschieden; für diese Aufgabe gelten Farbskala, Anleitung und Sicherheitsverfahren des tatsächlichen Sets. Schriftliche Antworten erfordern eine Prüfung von Begründung und Bedingungen; ausgefüllte Felder beweisen keine richtige Antwort. Jedes geforderte Produkt oder Verfahren nach eigener Checkliste mit tatsächlichen individuellen Nachweisen beurteilen. Online-Begründung, Musterantwort und Zuschauen bei einer Demonstration ersetzen diese Nachweise nicht.', 'Die vier Abschlussserien verbinden Auswahlfragen, schriftliche Antworten, fertige Produkte und praktische Verfahren. Serie eins enthält eine gekennzeichnete fünfhundert-Gramm-Bodenprobe und einen kolorimetrischen Pe Ha-Schnelltest. Serie zwei enthält fünf Pe Ha-Messwerte zu Field B und einen getrennten Bericht zu Paddock drei. Serie drei enthält eine fünf-Kilogramm-Tomatenmischung und die Bodenartbestimmung mit Band, Fühlen. Serie vier enthält eine Kulturtafel für drei Böden und simuliertes Reagenzverschütten. Daten, Methoden, Anweisungen und Nachweise jedes Falls getrennt halten. Ein früher geübtes Thema oder eine gelesene Musterantwort beweist keinen fertiggestellten Gegenstand oder ausgeführten Prozess.\n\nDas kolorimetrische Schnellset ist von der digitalen Elektrode der Fläche C verschieden; für diese Aufgabe gelten Farbskala, Anleitung und Sicherheitsverfahren des tatsächlichen Sets. Schriftliche Antworten erfordern eine Prüfung von Begründung und Bedingungen; ausgefüllte Felder beweisen keine richtige Antwort. Jedes geforderte Produkt oder Verfahren nach eigener Checkliste mit tatsächlichen individuellen Nachweisen beurteilen. Online-Begründung, Musterantwort und Zuschauen bei einer Demonstration ersetzen diese Nachweise nicht.'), ('Ein separates Quellbeispiel hat pH 5.8, sandigen Lehm, Band von einem halben Zoll und körniges Gefühl. USDA-NRCS und Oregon State nennen pH 5.8 mäßig sauer; das Quellwort „leicht sauer“ passt nicht zu diesen Skalen. Niedriger pH kann Nährstoffverfügbarkeit ändern; sandiger Lehm kann je nach Struktur schneller entwässern und weniger speichern. Das sind Prüffragen, keine komplette Diagnose.\n\nKartoffeln und Erdbeeren bilden das Beispielpaar; Mais wird bei weiteren passenden Bedingungen ebenfalls genannt. Sie bleiben Kandidaten, kein garantierter Anbauplan. Im getrennten Beispiel einer Anhebung von pH 5,8 in Richtung 6,5 nennt die Quelle Mais und Luzerne als Beispiele für eine breitere Kulturwahl und schlägt landwirtschaftlichen Kalkstein vor. Das ist eine bedingte Begründung des Kulturziels, keine Kalkdosis oder allgemeine pH-Vorgabe. Organische Substanz oder Zwischenfrüchte werden ebenfalls vorgeschlagen. Vor einer Dosis oder festen Maßnahme tatsächliche Kulturanforderungen, Kalkbedarfstest, Materialanalyse, Drainage und örtliche Eignung prüfen; organische Substanz kann die Struktur verbessern, ohne die mineralische Bodenart zu ändern.', 'Ein separates Quellbeispiel hat Pe Ha fünf Komma acht, sandigen Lehm, Band von einem halben Zoll und körniges Gefühl. U Es De A-En Er Ce Es und Oregon State nennen Pe Ha fünf Komma acht mäßig sauer; das Quellwort „leicht sauer“ passt nicht zu diesen Skalen. Niedriger Pe Ha kann Nährstoffverfügbarkeit ändern; sandiger Lehm kann je nach Struktur schneller entwässern und weniger speichern. Das sind Prüffragen, keine komplette Diagnose.\n\nKartoffeln und Erdbeeren bilden das Beispielpaar; Mais wird bei weiteren passenden Bedingungen ebenfalls genannt. Sie bleiben Kandidaten, kein garantierter Anbauplan. Im getrennten Beispiel einer Anhebung von Pe Ha fünf Komma acht in Richtung sechs Komma fünf nennt die Quelle Mais und Luzerne als Beispiele für eine breitere Kulturwahl und schlägt landwirtschaftlichen Kalkstein vor. Das ist eine bedingte Begründung des Kulturziels, keine Kalkdosis oder allgemeine Pe Ha-Vorgabe. Organische Substanz oder Zwischenfrüchte werden ebenfalls vorgeschlagen. Vor einer Dosis oder festen Maßnahme tatsächliche Kulturanforderungen, Kalkbedarfstest, Materialanalyse, Drainage und örtliche Eignung prüfen; organische Substanz kann die Struktur verbessern, ohne die mineralische Bodenart zu ändern.'), ('Eine Bodentechnikerin oder ein Bodentechniker handelt wie beim Ermitteln: Fläche bestimmen, unter Aufsicht Probe entnehmen, zugelassene echte pH- und Bodenartverfahren nutzen, Bedeutung prüfen und begründeten Rat geben. Eine Vegetationsperiode hängt von mehr als zwei Tests ab; pH und mineralische Bodenart verraten allein nicht gesamte Fruchtbarkeit, Salz, Entwässerung, Klima und Kulturanforderungen.\n\nDer Abschluss prüft präzise sichere Methode, Deutung, Kommunikation und gezieltes Nachholen. Ein sauberer Bericht belegt Schreiben/Denken, während jede körperliche Technik eigenes Trainerprotokoll braucht. Gruppenergebnis, auswendig gelerntes Modell oder Selbsteinschätzung dürfen keine gemessene praktische Fertigkeit ersetzen.\n\nAls angehende landwirtschaftliche Fachkraft einen örtlichen Betrieb zu Fläche C und der kommenden Anbausaison beraten. Fünf Berichtsabschnitte auf einer Seite erhalten. Die 20 Minuten der Quelle sind aktive Schreibzeit nach gestufter Praxis; echte Trocknung und pH-Gleichgewichtszeit sind gesondert. Field-B- oder Paddock-3-Aufzeichnungen der Aufgabenbank nicht für Fläche C übernehmen.', 'Eine Bodentechnikerin oder ein Bodentechniker handelt wie beim Ermitteln: Fläche bestimmen, unter Aufsicht Probe entnehmen, zugelassene echte Pe Ha- und Bodenartverfahren nutzen, Bedeutung prüfen und begründeten Rat geben. Eine Vegetationsperiode hängt von mehr als zwei Tests ab; Pe Ha und mineralische Bodenart verraten allein nicht gesamte Fruchtbarkeit, Salz, Entwässerung, Klima und Kulturanforderungen.\n\nDer Abschluss prüft präzise sichere Methode, Deutung, Kommunikation und gezieltes Nachholen. Ein sauberer Bericht belegt Schreiben, Denken, während jede körperliche Technik eigenes Trainerprotokoll braucht. Gruppenergebnis, auswendig gelerntes Modell oder Selbsteinschätzung dürfen keine gemessene praktische Fertigkeit ersetzen.\n\nAls angehende landwirtschaftliche Fachkraft einen örtlichen Betrieb zu Fläche C und der kommenden Anbausaison beraten. Fünf Berichtsabschnitte auf einer Seite erhalten. Die zwanzig Minuten der Quelle sind aktive Schreibzeit nach gestufter Praxis; echte Trocknung und Pe Ha-Gleichgewichtszeit sind gesondert. Field-B- oder Paddock-drei-Aufzeichnungen der Aufgabenbank nicht für Fläche C übernehmen.'), ('Fünf klare Abschnitte im einseitigen Bericht zu Fläche C erhalten: (1) Titel/Identitätskopf mit Name, tatsächlichem Datum und Fläche/Ort; (2) Einleitung mit Untersuchungszweck; (3) Ergebnisse mit Probenidentität, Verfahren, tatsächlichem Roh-pH und Bodenartnachweisen; (4) Deutung und Diskussion dessen, was die Ergebnisse stützen, samt Grenzen; (5) Empfehlungen mit zwei bedingten Kulturvorschlägen und mindestens einer begründeten Bewirtschaftungsmaßnahme. Der Titel steht auf derselben Seite und ist kein zusätzliches Deckblatt. Die etwa 20 Minuten aktive Berichtszeit der Quelle folgen auf die gestufte Praxis; tatsächliche Trocknung, Gerätevorbereitung und pH-Gleichgewichtszeit werden gesondert erfasst. Fehlende Daten im offenen Entwurf ehrlich benennen, ohne Musterwerte zu kopieren oder den Bericht mit tatsächlichen Ergebnissen als abgeschlossen auszugeben.\n\nDie Fläche C in dieser fortgesetzten Aufgabe und im Bericht durchgehend gleich benennen. Bodenart aus beobachtetem Band/Fühlen oder dokumentierter Korngrößenmessung erläutern. Bei Kultur- und Mittelwahl Grenzen von Klima, Wasser, Drainage, Salinität und hier fehlenden Nährstoffdaten nennen.', 'Fünf klare Abschnitte im einseitigen Bericht zu Fläche C erhalten: (eins) Titel, Identitätskopf mit Name, tatsächlichem Datum und Fläche, Ort; (zwei) Einleitung mit Untersuchungszweck; (drei) Ergebnisse mit Probenidentität, Verfahren, tatsächlichem Roh-Pe Ha und Bodenartnachweisen; (vier) Deutung und Diskussion dessen, was die Ergebnisse stützen, samt Grenzen; (fünf) Empfehlungen mit zwei bedingten Kulturvorschlägen und mindestens einer begründeten Bewirtschaftungsmaßnahme. Der Titel steht auf derselben Seite und ist kein zusätzliches Deckblatt. Die etwa zwanzig Minuten aktive Berichtszeit der Quelle folgen auf die gestufte Praxis; tatsächliche Trocknung, Gerätevorbereitung und Pe Ha-Gleichgewichtszeit werden gesondert erfasst. Fehlende Daten im offenen Entwurf ehrlich benennen, ohne Musterwerte zu kopieren oder den Bericht mit tatsächlichen Ergebnissen als abgeschlossen auszugeben.\n\nDie Fläche C in dieser fortgesetzten Aufgabe und im Bericht durchgehend gleich benennen. Bodenart aus beobachtetem Band, Fühlen oder dokumentierter Korngrößenmessung erläutern. Bei Kultur- und Mittelwahl Grenzen von Klima, Wasser, Drainage, Salinität und hier fehlenden Nährstoffdaten nennen.'), ('Prüfende schreiben „kompetent“ nur nach sicherer genauer Einzelhandlung zum definierten Standard. Sonst „noch nicht nachgewiesen“ mit genauer Lücke. Gute Probenvorbereitung macht pH nicht gültig, wenn Gerätekalibrierung falsch war. Person übt genau diese Kalibrierung und führt einen neuen beobachteten Versuch aus.\n\nZweite Entscheidung mit Datum, Beleg und Traineridentität eintragen. Sie kann erneut „noch nicht nachgewiesen“ sein, dann gezielt weiter üben. Wissensversuche online sind offen mit gezieltem Rücksprung; Praxis erfordert wirkliche Beobachtung. Selbsteinschätzung 5.2 zum Bericht hilft Reflexion. Die ursprüngliche Tabelle enthält Betrieb und Wartung der Motorhacke nicht: eine ausdrückliche Selbsteinschätzung zu diesen Fertigkeiten ergänzen, aber keinen praktischen Pass ausfüllen.', 'Prüfende schreiben „kompetent“ nur nach sicherer genauer Einzelhandlung zum definierten Standard. Sonst „noch nicht nachgewiesen“ mit genauer Lücke. Gute Probenvorbereitung macht Pe Ha nicht gültig, wenn Gerätekalibrierung falsch war. Person übt genau diese Kalibrierung und führt einen neuen beobachteten Versuch aus.\n\nZweite Entscheidung mit Datum, Beleg und Traineridentität eintragen. Sie kann erneut „noch nicht nachgewiesen“ sein, dann gezielt weiter üben. Wissensversuche online sind offen mit gezieltem Rücksprung; Praxis erfordert wirkliche Beobachtung. Selbsteinschätzung fünf Komma zwei zum Bericht hilft Reflexion. Die ursprüngliche Tabelle enthält Betrieb und Wartung der Motorhacke nicht: eine ausdrückliche Selbsteinschätzung zu diesen Fertigkeiten ergänzen, aber keinen praktischen Pass ausfüllen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s317-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_SIX_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':6,'maximumBlindReviewPerLane':6,'maximumASRPerLane':6,'maximumTTSAggregate':24,'maximumBlindAggregate':24,'maximumASRAggregate':24,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
