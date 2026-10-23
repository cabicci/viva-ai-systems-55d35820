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
IDS = ('S2-07-ar-EG-R01-r1', 'S2-07-ar-EG-R02-r1', 'S2-07-ar-EG-R03-r1', 'S2-07-ar-EG-R04-r1', 'S2-07-ar-EG-R05-r1', 'S2-07-ar-EG-R06-r1', 'S2-07-ar-EG-R07-r1', 'S2-07-en-R01-r1', 'S2-07-en-R02-r1', 'S2-07-en-R03-r1', 'S2-07-en-R04-r1', 'S2-07-en-R05-r1', 'S2-07-en-R06-r1', 'S2-07-en-R07-r1', 'S2-07-it-R01-r1', 'S2-07-it-R02-r1', 'S2-07-it-R03-r1', 'S2-07-it-R04-r1', 'S2-07-it-R05-r1', 'S2-07-it-R06-r1', 'S2-07-it-R07-r1', 'S2-07-de-R01-r1', 'S2-07-de-R02-r1', 'S2-07-de-R03-r1', 'S2-07-de-R04-r1', 'S2-07-de-R05-r1', 'S2-07-de-R06-r1', 'S2-07-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S207_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s207-readings-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('1:1', 'واحد لواحد'), ('1:1 g:g', 'واحد لواحد، جرام لجرام'), ('1:1 g:mL', 'واحد لواحد، جرام تربة لكل مليلتر ماء'), ('1:2', 'واحد لاتنين'), ('HI7051', 'إتش آي سبعة صفر خمسة واحد'), ('HI99121', 'إتش آي تسعة تسعة واحد اتنين واحد'), ('NIST', 'إن آي إس تي'), ('أثرًا محتملًا', 'أثر محتمل'), ('أرقامًا', 'أرقام'), ('إجراءً واحدًا', 'إجراء واحد'), ('إيه وB وC', 'إيه وبي وسي'), ('استخدم عينات منفصلة A وB وC. المدرّب يقيسهم من قبل ويحتفظ بالمفتاح الحقيقي. بدّلوا أدوار اللي بيقيس واللي بيسجّل واللي بيحلل، بس كل طالب لازم يقيس بنفسه والمدرّب يشوفه. سجّل الطريقة والقراءة الفعلية قبل مقارنة أهداف المثال التعليمي.\n\nفي ثلاث مراحل محتوى كل واحدة 10 دقائق، الطلاب يقيسوا ويناقشوا أثر محتمل على العناصر ثم يقترحوا فحصًا تاليًا منطقيًا أو استجابة مناسبة للمحصول. pH وحده ما يحددش محسن أو جرعة. قيمة 6.8 النموذجية حمضية بسيطة وقريبة من التعادل؛ لو العينة الحقيقية اختلفت عن الرقم المستهدف، سجّل اللي الجهاز قاسه فعلًا وابحث سبب الفرق.', 'استخدم عينات منفصلة إيه وB وC. المدرّب يقيسهم من قبل ويحتفظ بالمفتاح الحقيقي. بدّلوا أدوار اللي بيقيس واللي بيسجّل واللي بيحلل، بس كل طالب لازم يقيس بنفسه والمدرّب يشوفه. سجّل الطريقة والقراءة الفعلية قبل مقارنة أهداف المثال التعليمي.\n\nفي ثلاث مراحل محتوى كل واحدة عشرة دقائق، الطلاب يقيسوا ويناقشوا أثر محتمل على العناصر ثم يقترحوا فحصًا تاليًا منطقيًا أو استجابة مناسبة للمحصول. بي إتش وحده ما يحددش محسن أو جرعة. قيمة ستة فاصلة تمانية النموذجية حمضية بسيطة وقريبة من التعادل؛ لو العينة الحقيقية اختلفت عن الرقم المستهدف، سجّل اللي الجهاز قاسه فعلًا وابحث سبب الفرق.'), ('المعايرة تستخدم محاليل منظمة نظيفة وسارية تناسب مدى العينة المتوقعة وحسب تعليمات الجهاز الفعلي. في دليل إتش آي تسعة تسعة واحد اتنين واحد تسلسل النقطتين المعتاد يبدأ pH 7.01 ثم 4.01 أو 10.01؛ ومجموعة إن آي إس تي تبدأ 6.86 ثم 4.01 أو 9.18. مثال المدرّس الأصلي 4 و7 بيوضح الفكرة لكنه ما يلغيش المجموعة اللي جهازك بيعترف بيها أو رسائل شاشته.\n\nحط جزء من كل محلول في وعاء نظيف منفصل عند لزومه، وما ترجّعش السائل المستعمل للزجاجة الأصلية. اشطف المسبار بين المحاليل حسب دليل العناية، وما تمسحش أو تخدش الزجاج الحساس، وانتظر قبول الجهاز لكل نقطة وسجّل المجموعة والقبول. لو الشاشة رفضت محلول، ما تعتبرش المعايرة نجحت؛ افحص اسم المحلول وصلاحيته والمسبار، ثم أعد المرحلة الفاشلة بتوجيه المدرّب.', 'المعايرة تستخدم محاليل منظمة نظيفة وسارية تناسب مدى العينة المتوقعة وحسب تعليمات الجهاز الفعلي. في دليل إتش آي تسعة تسعة واحد اتنين واحد تسلسل النقطتين المعتاد يبدأ بي إتش سبعة فاصلة صفر واحد ثم أربعة فاصلة صفر واحد أو عشرة فاصلة صفر واحد؛ ومجموعة إن آي إس تي تبدأ ستة فاصلة تمانية ستة ثم أربعة فاصلة صفر واحد أو تسعة فاصلة واحد تمانية. مثال المدرّس الأصلي أربعة وسبعة بيوضح الفكرة لكنه ما يلغيش المجموعة اللي جهازك بيعترف بيها أو رسائل شاشته.\n\nحط جزء من كل محلول في وعاء نظيف منفصل عند لزومه، وما ترجّعش السائل المستعمل للزجاجة الأصلية. اشطف المسبار بين المحاليل حسب دليل العناية، وما تمسحش أو تخدش الزجاج الحساس، وانتظر قبول الجهاز لكل نقطة وسجّل المجموعة والقبول. لو الشاشة رفضت محلول، ما تعتبرش المعايرة نجحت؛ افحص اسم المحلول وصلاحيته والمسبار، ثم أعد المرحلة الفاشلة بتوجيه المدرّب.'), ('بديلًا توضيحيًا', 'بديل توضيحي'), ('تحريكًا خفيفًا', 'تحريك خفيف'), ('تحليلًا مضبوطًا وتفسيرًا', 'تحليل مضبوط وتفسير'), ('ثم يقترحوا فحصًا تاليًا منطقيًا', 'وبعد كده يقترحوا فحص تالي منطقي'), ('جزءًا من كل محلول', 'جزء من كل محلول'), ('جهاز pH الرقمي بيقدّر حموضة الوسط اللي بيلمس المسبار. وجود خانتين عشريتين على الشاشة ما يثبتش إن سحب العينة أو المعايرة أو التحضير كانوا صح. علّم العينة الممثلة أولًا، وبعدها حدد هل الجهاز المعتمد مخصص يلمس التربة مباشرة ولا يشتغل على معلق تربة. ما تدفعش قطب زجاجي عادي في الأرض لمجرد إنه بيعرض أرقام.\n\nالمعمل المتخصص ممكن يستخدم طرق مضبوطة وفحوص جودة ويعطي نتائج عناصر أو مادة عضوية، لكن كلمة «معمل» وحدها ما تضمنش دقة كل نتيجة. سجّل الطريقة الفعلية واسأل النتيجة هتجاوب أنهي سؤال. الخطوة دي عن قياس pH؛ تفسير العناصر وجرعات المحسنات تحتاج أدلة أخرى عن التربة والمحصول.', 'جهاز بي إتش الرقمي بيقدّر حموضة الوسط اللي بيلمس المسبار. وجود خانتين عشريتين على الشاشة ما يثبتش إن سحب العينة أو المعايرة أو التحضير كانوا صح. علّم العينة الممثلة أولًا، وبعدها حدد هل الجهاز المعتمد مخصص يلمس التربة مباشرة ولا يشتغل على معلق تربة. ما تدفعش قطب زجاجي عادي في الأرض لمجرد إنه بيعرض أرقام.\n\nالمعمل المتخصص ممكن يستخدم طرق مضبوطة وفحوص جودة ويعطي نتائج عناصر أو مادة عضوية، لكن كلمة «معمل» وحدها ما تضمنش دقة كل نتيجة. سجّل الطريقة الفعلية واسأل النتيجة هتجاوب أنهي سؤال. الخطوة دي عن قياس بي إتش؛ تفسير العناصر وجرعات المحسنات تحتاج أدلة أخرى عن التربة والمحصول.'), ('جهاز ومسبار مختلفان', 'جهاز ومسبار مختلفين'), ('حالة التقييم في الأصل بتبدأ بعينة خام مجففة هوائيًا. البس حماية العين والجسم واليدين حسب موقع التدريب؛ فك كتل التربة برفق في هاون نظيف من غير طحن الحجارة؛ انخل عند 2 mm؛ زِن 20 g من التربة المنخولة وقِس 20 mL ماء مقطر في بيكر نظيف. في البطاقة دي قلّب دقيقة واحدة ثم سيب المعلق 15 دقيقة. الأرقام دي مرتبطة ببعض كتحضير كتلة إلى حجم: 20 g تربة إلى 20 mL ماء، وتُكتب واحد لواحد، جرام تربة لكل مليلتر ماء، مش واحد لواحد، جرام لجرام ولا نسبة حجم مبهمة.\n\nحافظ على بطاقة العينة وقراءات الميزان والمخبار وأوقات الانتظار الحقيقية. شرح المدرّس بيذكر واحد لواحد أو واحد لاتنين وانتظار 15–30 دقيقة كبدائل، مش سماح تختار نسبة من طريقة ووقت من طريقة تانية. قبل أي تطبيق له درجة، طريقة الجهاز الرقمي الموجودة في الموقع لازم تتحدد كاملة وتتراجع مع الجهاز ودليله وإجراءات الموقع.', 'حالة التقييم في الأصل بتبدأ بعينة خام مجففة هوائيًا. البس حماية العين والجسم واليدين حسب موقع التدريب؛ فك كتل التربة برفق في هاون نظيف من غير طحن الحجارة؛ انخل عند اتنين مليمتر؛ زِن عشرين جرام من التربة المنخولة وقِس عشرين مليلتر ماء مقطر في بيكر نظيف. في البطاقة دي قلّب دقيقة واحدة ثم سيب المعلق خمستاشر دقيقة. الأرقام دي مرتبطة ببعض كتحضير كتلة إلى حجم: عشرين جرام تربة إلى عشرين مليلتر ماء، وتُكتب واحد لواحد، جرام تربة لكل مليلتر ماء، مش واحد لواحد، جرام لجرام ولا نسبة حجم مبهمة.\n\nحافظ على بطاقة العينة وقراءات الميزان والمخبار وأوقات الانتظار الحقيقية. شرح المدرّس بيذكر واحد لواحد أو واحد لاتنين وانتظار خمستاشر لتلاتين دقيقة كبدائل، مش سماح تختار نسبة من طريقة ووقت من طريقة تانية. قبل أي تطبيق له درجة، طريقة الجهاز الرقمي الموجودة في الموقع لازم تتحدد كاملة وتتراجع مع الجهاز ودليله وإجراءات الموقع.'), ('حمضية قليلًا', 'حمضية بسيطة'), ('خمسة دقائق', 'خمس دقايق'), ('رفض محلول معايرة، أو محلول منتهي أو متبدّل، أو مسبار جاف أو تالف، أو شاشة غير مستقرة، أو بيكر من غير بطاقة، أو نسبة غير موثقة: كلها تخلي النتيجة غير موثوقة. وقف واحمِ العينة والجهاز وبلّغ المدرّب وحدد المرحلة المتأثرة وأعدها بنفس الطريقة المعلنة. ما تفضلش تضغط زرار لحد ما يظهر الرقم اللي عاجبك، ولا تمسح تجربة فاشلة من غير ملاحظة.\n\nقارن عدة اللون وجهاز pH المُعاير والمعمل حسب الهدف والطريقة والوقت وتدريج القراءة وفحوص الجودة. الجهاز الرقمي ممكن يكون عملي ويدي رقم؛ والمعمل ممكن يضيف تحليل مضبوط وتفسير؛ ولا واحد منهم يلغي الحاجة لعينة ممثلة وإجراء مُسجّل.', 'رفض محلول معايرة، أو محلول منتهي أو متبدّل، أو مسبار جاف أو تالف، أو شاشة غير مستقرة، أو بيكر من غير بطاقة، أو نسبة غير موثقة: كلها تخلي النتيجة غير موثوقة. وقف واحمِ العينة والجهاز وبلّغ المدرّب وحدد المرحلة المتأثرة وأعدها بنفس الطريقة المعلنة. ما تفضلش تضغط زرار لحد ما يظهر الرقم اللي عاجبك، ولا تمسح تجربة فاشلة من غير ملاحظة.\n\nقارن عدة اللون وجهاز بي إتش المُعاير والمعمل حسب الهدف والطريقة والوقت وتدريج القراءة وفحوص الجودة. الجهاز الرقمي ممكن يكون عملي ويدي رقم؛ والمعمل ممكن يضيف تحليل مضبوط وتفسير؛ ولا واحد منهم يلغي الحاجة لعينة ممثلة وإجراء مُسجّل.'), ('طرقًا مضبوطة', 'طرق مضبوطة'), ('عشرة جرام', 'عشر جرام'), ('عمليًا ويعطي رقمًا', 'عملي ويدي رقم'), ('في ثلاث مراحل محتوى كل واحدة عشرة دقائق', 'في تلات مراحل محتوى كل واحدة عشر دقايق'), ('قطبًا رقميًا', 'قطب رقمي'), ('قطبًا زجاجيًا عاديًا', 'قطب زجاجي عادي'), ('قِس من المكان اللي بتحدده الطريقة الفعلية في العينة المجهزة. في بطاقة الأصل، حط المسبار المُعاير في الجزء السائل من المعلق بعد الترسيب، مع غمر طرف الاستشعار والوصلة كما يتطلب دليل المسبار، ومن غير احتكاك الزجاج بالرواسب أو قاع البيكر. طرق موثّقة أخرى ممكن تطلب تحريك خفيف أو القياس داخل المعلق نفسه؛ ما تبدلش التعليمات بصمت.\n\nسيب القراءة تثبت حسب مؤشر الجهاز أو قاعدة قبول الموقع. سجّل الرقم في حدود دقته المدعومة ورمز العينة وطريقة التحضير والسائل والمعايرة والوقت وأي سلوك غير عادي. اشطف بين العينات حسب دليل المسبار لتجنب انتقال الأثر. وفي النهاية نظّفه واحفظه بالضبط كما يطلب الدليل؛ ترك كل مسبار في ماء مقطر كقاعدة عامة ممكن يضر بعض الأقطاب.\n\nالمدرّس بيذكر شرائط pH كطريقة مختلفة: اغمس الطرف التفاعلي بس في السائل الصافي المناسب وقارنه بجدول نفس الشركة في وقتها المحدد. لون الشريط ما يعايرش قطبًا رقميًا، وقراءة الجهاز ما تتستنتجش من لون شريط من غير طريقته. خلي الشرائط بديل توضيحي، مش كاشف أو مرحلة معايرة زيادة في بطاقة الجهاز الرقمي.', 'قِس من المكان اللي بتحدده الطريقة الفعلية في العينة المجهزة. في بطاقة الأصل، حط المسبار المُعاير في الجزء السائل من المعلق بعد الترسيب، مع غمر طرف الاستشعار والوصلة كما يتطلب دليل المسبار، ومن غير احتكاك الزجاج بالرواسب أو قاع البيكر. طرق موثّقة أخرى ممكن تطلب تحريك خفيف أو القياس داخل المعلق نفسه؛ ما تبدلش التعليمات بصمت.\n\nسيب القراءة تثبت حسب مؤشر الجهاز أو قاعدة قبول الموقع. سجّل الرقم في حدود دقته المدعومة ورمز العينة وطريقة التحضير والسائل والمعايرة والوقت وأي سلوك غير عادي. اشطف بين العينات حسب دليل المسبار لتجنب انتقال الأثر. وفي النهاية نظّفه واحفظه بالضبط كما يطلب الدليل؛ ترك كل مسبار في ماء مقطر كقاعدة عامة ممكن يضر بعض الأقطاب.\n\nالمدرّس بيذكر شرائط بي إتش كطريقة مختلفة: اغمس الطرف التفاعلي بس في السائل الصافي المناسب وقارنه بجدول نفس الشركة في وقتها المحدد. لون الشريط ما يعايرش قطبًا رقميًا، وقراءة الجهاز ما تتستنتجش من لون شريط من غير طريقته. خلي الشرائط بديل توضيحي، مش كاشف أو مرحلة معايرة زيادة في بطاقة الجهاز الرقمي.'), ('لو الشاشة رفضت محلولًا', 'لو الشاشة رفضت محلول'), ('مثال موثّق: جهاز Hanna إتش آي تسعة تسعة واحد اتنين واحد مع مسبار التربة المخصص له. دليله يصف معلق مختلف: 10 g تربة جافة منخولة 2 mm مع 25 mL من محلول الشركة إتش آي سبعة صفر خمسة واحد، وخلط 30 ثانية وانتظار 5 دقائق. وبيصف طريقة أخرى منفصلة للمسبار في الأرض مباشرة. دي أمثلة لتعليمات خاصة بالطريقة، مش إضافات لبطاقة الأصل. ما تخلطش محلول الشركة أو أوقاتها مع نسبة الماء المقطر في البطاقة.\n\nممكن موقع التدريب يكون عنده جهاز ومسبار مختلفين. المدرّب لازم يحددهم ويختار إجراء واحد يشمل السائل وكتلة العينة وحجم السائل وأساس النسبة والخلط والانتظار ومكان المسبار وتنظيفه. لو الدليل أو قواعد فحص الجودة المحلية مش متاحين، تقدر تتعلم المقارنة إلكترونيًا لكن القياس العملي يظل غير مُقيّم.', 'مثال موثّق: جهاز Hanna إتش آي تسعة تسعة واحد اتنين واحد مع مسبار التربة المخصص له. دليله يصف معلق مختلف: عشرة جرام تربة جافة منخولة اتنين مليمتر مع خمسة وعشرين مليلتر من محلول الشركة إتش آي سبعة صفر خمسة واحد، وخلط تلاتين ثانية وانتظار خمسة دقائق. وبيصف طريقة أخرى منفصلة للمسبار في الأرض مباشرة. دي أمثلة لتعليمات خاصة بالطريقة، مش إضافات لبطاقة الأصل. ما تخلطش محلول الشركة أو أوقاتها مع نسبة الماء المقطر في البطاقة.\n\nممكن موقع التدريب يكون عنده جهاز ومسبار مختلفين. المدرّب لازم يحددهم ويختار إجراء واحد يشمل السائل وكتلة العينة وحجم السائل وأساس النسبة والخلط والانتظار ومكان المسبار وتنظيفه. لو الدليل أو قواعد فحص الجودة المحلية مش متاحين، تقدر تتعلم المقارنة إلكترونيًا لكن القياس العملي يظل غير مُقيّم.'), ('محسنًا أو جرعة', 'محسن أو جرعة'), ('مسبقًا', 'من قبل'), ('مش كاشفًا', 'مش كاشف'), ('معلقًا مختلفًا', 'معلق مختلف'), ('هوائيًا', 'هوائي'), ('وقتًا من أخرى', 'وقت من طريقة تانية')], 'en': [('1:1', 'one to one'), ('1:1 g:g', 'one to one on a gram to gram basis'), ('1:1 g:mL', 'one to one on a gram to millilitre basis'), ('1:2', 'one to two'), ("A digital pH meter estimates acidity in the medium touching its electrode. A display with two decimal places does not prove that sampling, calibration or preparation was accurate. Label the representative sample first and decide whether the approved meter is intended for direct soil contact or a suspension; an ordinary glass electrode must not be pushed into soil merely because it shows digits.\n\nA professional laboratory may provide controlled methods, quality checks and additional nutrient or organic-matter results, but accuracy is not guaranteed by the word 'laboratory' alone. Record the actual method and ask what question the result is intended to answer. This step measures pH; nutrient interpretation and amendment rates need further soil and crop evidence.", "A digital P H meter estimates acidity in the medium touching its electrode. A display with two decimal places does not prove that sampling, calibration or preparation was accurate. Label the representative sample first and decide whether the approved meter is intended for direct soil contact or a suspension; an ordinary glass electrode must not be pushed into soil merely because it shows digits.\n\nA professional laboratory may provide controlled methods, quality checks and additional nutrient or organic-matter results, but accuracy is not guaranteed by the word 'laboratory' alone. Record the actual method and ask what question the result is intended to answer. This step measures P H; nutrient interpretation and amendment rates need further soil and crop evidence."), ("A documented example is the Hanna H I nine nine one two one with its dedicated soil electrode. Its manual gives a separate slurry using 10 g of dried soil passed through a two-millimetre sieve and 25 mL of the maker's H I seven zero five one preparation solution, mixed for 30 seconds and left for 5 minutes. It also describes a different direct-ground measurement method for that probe. These are examples of method-specific instructions, not additions to the source card. Do not combine the manufacturer's solution or timing with the card's distilled-water ratio.\n\nThe physical training site may own a different meter and probe. The trainer must identify them and choose one procedure, including the liquid, sample ratio and basis, mixing, equilibration, electrode placement and cleaning. If the manual or local quality-control rules cannot be checked, the online comparison can be learned now but the practical measurement is unassessed.", "A documented example is the Hanna H I nine nine one two one with its dedicated soil electrode. Its manual gives a separate slurry using ten grams of dried soil passed through a two-millimetre sieve and twenty-five millilitres of the maker's H I seven zero five one preparation solution, mixed for thirty seconds and left for five minutes. It also describes a different direct-ground measurement method for that probe. These are examples of method-specific instructions, not additions to the source card. Do not combine the manufacturer's solution or timing with the card's distilled-water ratio.\n\nThe physical training site may own a different meter and probe. The trainer must identify them and choose one procedure, including the liquid, sample ratio and basis, mixing, equilibration, electrode placement and cleaning. If the manual or local quality-control rules cannot be checked, the online comparison can be learned now but the practical measurement is unassessed."), ('A rejected buffer, expired or mixed-up solution, dry/damaged electrode, unstable display, unlabeled beaker or undocumented ratio means the result cannot be trusted. Stop, protect the sample and instrument, tell the trainer, identify the affected stage, and repeat it under the same declared method. Do not keep pressing a button until a preferred pH appears or overwrite a failed run without a note.\n\nCompare a field colour kit, a calibrated meter and a laboratory by purpose, method, time, resolution and quality controls. A digital meter can be convenient and give a numerical reading; a laboratory may add controlled analysis and interpretation; neither one removes the need for a representative sample or a recorded procedure.', 'A rejected buffer, expired or mixed-up solution, dry/damaged electrode, unstable display, unlabeled beaker or undocumented ratio means the result cannot be trusted. Stop, protect the sample and instrument, tell the trainer, identify the affected stage, and repeat it under the same declared method. Do not keep pressing a button until a preferred P H appears or overwrite a failed run without a note.\n\nCompare a field colour kit, a calibrated meter and a laboratory by purpose, method, time, resolution and quality controls. A digital meter can be convenient and give a numerical reading; a laboratory may add controlled analysis and interpretation; neither one removes the need for a representative sample or a recorded procedure.'), ("Calibration uses clean, in-date buffer solutions whose values span or suit the expected sample range as the actual meter instructs. In the H I nine nine one two one manual, the standard two-point sequence begins at pH 7.01 and then uses pH 4.01 or 10.01; its N I S T set has 6.86 with 4.01 or 9.18. The original teacher example says pH 4 and 7, which illustrates the idea but does not override a meter's recognized set or screen prompts.\n\nPut buffer portions in separate clean vessels when required; never pour used liquid back into the original bottle. Rinse the electrode between solutions using the actual manual's care instructions, avoid wiping or scraping delicate glass, wait for the meter to accept each calibration point, and record the set and acceptance. If the display rejects a buffer, do not claim calibration succeeded; check buffer identity, condition and electrode care, then repeat only the failed calibration stage with the trainer.", "Calibration uses clean, in-date buffer solutions whose values span or suit the expected sample range as the actual meter instructs. In the H I nine nine one two one manual, the standard two-point sequence begins at P H seven point zero one and then uses P H four point zero one or ten point zero one; its N I S T set has six point eight six with four point zero one or nine point one eight. The original teacher example says P H four and seven, which illustrates the idea but does not override a meter's recognized set or screen prompts.\n\nPut buffer portions in separate clean vessels when required; never pour used liquid back into the original bottle. Rinse the electrode between solutions using the actual manual's care instructions, avoid wiping or scraping delicate glass, wait for the meter to accept each calibration point, and record the set and acceptance. If the display rejects a buffer, do not claim calibration succeeded; check buffer identity, condition and electrode care, then repeat only the failed calibration stage with the trainer."), ('HI7051', 'H I seven zero five one'), ('HI99121', 'H I nine nine one two one'), ('NIST', 'N I S T'), ("The source's assessed scenario starts with a raw, air-dried sample. Wear the site's specified eye, clothing and hand protection; gently break soil clods in a clean mortar without grinding stones; sieve at 2 mm; weigh 20 g of the sieved soil and measure 20 mL of distilled water into a clean beaker. In that card, stir for one minute and allow the suspension to stand for 15 minutes. These numbers belong together as that card's mass-to-volume preparation: 20 g soil to 20 mL water, stated as one to one on a gram to millilitre basis, not one to one on a gram to gram basis or an unqualified volume ratio.\n\nKeep the label, balance and cylinder readings and actual elapsed times in the record. The teacher explanation also mentions one to one or one to two and a 15-30 minute wait; those are alternatives, not permission to choose a ratio from one procedure and a time from another. The digital-metre procedure used for real training must be declared in full and checked against the actual device and site method before anyone touches a sample for credit.", "The source's assessed scenario starts with a raw, air-dried sample. Wear the site's specified eye, clothing and hand protection; gently break soil clods in a clean mortar without grinding stones; sieve at two millimetres; weigh twenty grams of the sieved soil and measure twenty millilitres of distilled water into a clean beaker. In that card, stir for one minute and allow the suspension to stand for fifteen minutes. These numbers belong together as that card's mass-to-volume preparation: twenty grams soil to twenty millilitres water, stated as one to one on a gram to millilitre basis, not one to one on a gram to gram basis or an unqualified volume ratio.\n\nKeep the label, balance and cylinder readings and actual elapsed times in the record. The teacher explanation also mentions one to one or one to two and a fifteen to thirty minute wait; those are alternatives, not permission to choose a ratio from one procedure and a time from another. The digital-metre procedure used for real training must be declared in full and checked against the actual device and site method before anyone touches a sample for credit."), ("Use separate samples A, B and C. The trainer pretests them and keeps the actual key private. Rotate tester, recorder and analyst, but each learner must personally measure and be observed. Record the actual method and reading before comparing with qualified teaching targets.\n\nIn the source's three ten-minute content parts, learners measure, discuss possible nutrient effects and then suggest a reasoned next check or crop-specific response. pH alone does not determine an amendment or dose. A 6.8 model value is slightly acidic, near neutral; if a real sample differs from its model target, record what the instrument actually measured and investigate the difference.", "Use separate samples A, B and C. The trainer pretests them and keeps the actual key private. Rotate tester, recorder and analyst, but each learner must personally measure and be observed. Record the actual method and reading before comparing with qualified teaching targets.\n\nIn the source's three ten-minute content parts, learners measure, discuss possible nutrient effects and then suggest a reasoned next check or crop-specific response. P H alone does not determine an amendment or dose. A six point eight model value is slightly acidic, near neutral; if a real sample differs from its model target, record what the instrument actually measured and investigate the difference."), ("Use the actual method's specified measurement point in the prepared sample. For the source process card, place the calibrated electrode in the liquid phase of the settled slurry, with sensing tip and junction correctly immersed as the probe manual requires, without grinding the glass against settled grit or the beaker bottom. Other validated methods may call for gentle swirling or measurement in the suspension; do not silently swap their directions.\n\nLet the reading settle by the device's stability indication or the site's documented acceptance rule. Record the displayed value at its supported resolution, sample ID, preparation and liquid, calibration, time and any unusual behaviour. Rinse between samples according to the electrode manual to prevent carryover. At the end, clean and store the probe exactly as instructed; a generic order to leave every probe in distilled water would damage some electrodes.\n\nThe teacher also offers pH indicator strips as a separate method: dip only the reactive end into the appropriate clear liquid and compare with that strip maker's chart at its specified time. A strip colour cannot calibrate a digital electrode, and a meter reading cannot be inferred from a strip without its method. Keep the strip route as an alternative demonstration, not an extra reagent or calibration step inside the digital-meter process card.", "Use the actual method's specified measurement point in the prepared sample. For the source process card, place the calibrated electrode in the liquid phase of the settled slurry, with sensing tip and junction correctly immersed as the probe manual requires, without grinding the glass against settled grit or the beaker bottom. Other validated methods may call for gentle swirling or measurement in the suspension; do not silently swap their directions.\n\nLet the reading settle by the device's stability indication or the site's documented acceptance rule. Record the displayed value at its supported resolution, sample ID, preparation and liquid, calibration, time and any unusual behaviour. Rinse between samples according to the electrode manual to prevent carryover. At the end, clean and store the probe exactly as instructed; a generic order to leave every probe in distilled water would damage some electrodes.\n\nThe teacher also offers P H indicator strips as a separate method: dip only the reactive end into the appropriate clear liquid and compare with that strip maker's chart at its specified time. A strip colour cannot calibrate a digital electrode, and a meter reading cannot be inferred from a strip without its method. Keep the strip route as an alternative demonstration, not an extra reagent or calibration step inside the digital-meter process card."), ('digital-metre procedure', 'digital meter procedure'), ('dried, 2 mm-sieved soil', 'dried soil passed through a two-millimetre sieve')], 'it': [('1:1', 'uno a uno'), ('1:1 g:g', 'uno a uno, grammi per grammo'), ('1:1 g:mL', 'uno a uno, grammi per millilitro'), ('1:2', 'uno a due'), ('HI7051', 'acca i sette zero cinque uno'), ('HI99121', 'acca i nove nove uno due uno'), ("Il caso valutato nella scheda originale parte da un campione grezzo già essiccato all'aria. Indossa protezioni per occhi, corpo e mani previste dalla sede; rompi delicatamente le zolle in un mortaio pulito senza macinare i sassi; setaccia a 2 mm; pesa 20 g di suolo setacciato e misura 20 mL d'acqua distillata in un becher pulito. In quella scheda mescola per un minuto e lascia riposare la sospensione per 15 minuti. Questi numeri formano un'unica preparazione massa:volume: 20 g di suolo per 20 mL d'acqua, indicati come uno a uno, grammi per millilitro, non uno a uno, grammi per grammo né come rapporto tra volumi senza unità.\n\nConserva etichetta del campione, letture della bilancia e del cilindro e tempi effettivi. La spiegazione del docente menziona anche uno a uno oppure uno a due e un'attesa di 15–30 minuti: sono alternative, non il permesso di prendere il rapporto da un metodo e il tempo da un altro. La procedura digitale usata nella sede va dichiarata per intero e confrontata con dispositivo e metodo locale prima di una prova valutata.", "Il caso valutato nella scheda originale parte da un campione grezzo già essiccato all'aria. Indossa protezioni per occhi, corpo e mani previste dalla sede; rompi delicatamente le zolle in un mortaio pulito senza macinare i sassi; setaccia a due millimetri; pesa venti grammi di suolo setacciato e misura venti millilitri d'acqua distillata in un becher pulito. In quella scheda mescola per un minuto e lascia riposare la sospensione per quindici minuti. Questi numeri formano un'unica preparazione massa:volume: venti grammi di suolo per venti millilitri d'acqua, indicati come uno a uno, grammi per millilitro, non uno a uno, grammi per grammo né come rapporto tra volumi senza unità.\n\nConserva etichetta del campione, letture della bilancia e del cilindro e tempi effettivi. La spiegazione del docente menziona anche uno a uno oppure uno a due e un'attesa di quindici a trenta minuti: sono alternative, non il permesso di prendere il rapporto da un metodo e il tempo da un altro. La procedura digitale usata nella sede va dichiarata per intero e confrontata con dispositivo e metodo locale prima di una prova valutata."), ("La taratura usa soluzioni tampone pulite e non scadute, con valori che coprono o si adattano all'intervallo atteso secondo le istruzioni dello strumento effettivo. Nel manuale acca i nove nove uno due uno, la sequenza standard a due punti parte da pH 7.01 e poi usa pH 4.01 oppure 10.01; la serie enne i esse ti usa 6.86 con 4.01 oppure 9.18. L'esempio del docente cita pH 4 e 7 per illustrare il principio, ma non sostituisce la serie riconosciuta dallo strumento o i messaggi sul display.\n\nQuando richiesto, versa porzioni di tampone in recipienti separati e puliti; non rimettere mai il liquido usato nella bottiglia. Risciacqua l'elettrodo tra le soluzioni secondo il suo manuale, senza strofinare né graffiare il vetro delicato; aspetta l'accettazione di ciascun punto e registra serie ed esito. Se lo strumento rifiuta un tampone, non dichiarare riuscita la taratura: verifica identità e stato del tampone e cura dell'elettrodo, poi ripeti con il formatore solo la fase fallita.", "La taratura usa soluzioni tampone pulite e non scadute, con valori che coprono o si adattano all'intervallo atteso secondo le istruzioni dello strumento effettivo. Nel manuale acca i nove nove uno due uno, la sequenza standard a due punti parte da P H sette virgola zero uno e poi usa P H quattro virgola zero uno oppure dieci virgola zero uno; la serie enne i esse ti usa sei virgola otto sei con quattro virgola zero uno oppure nove virgola uno otto. L'esempio del docente cita P H quattro e sette per illustrare il principio, ma non sostituisce la serie riconosciuta dallo strumento o i messaggi sul display.\n\nQuando richiesto, versa porzioni di tampone in recipienti separati e puliti; non rimettere mai il liquido usato nella bottiglia. Risciacqua l'elettrodo tra le soluzioni secondo il suo manuale, senza strofinare né graffiare il vetro delicato; aspetta l'accettazione di ciascun punto e registra serie ed esito. Se lo strumento rifiuta un tampone, non dichiarare riuscita la taratura: verifica identità e stato del tampone e cura dell'elettrodo, poi ripeti con il formatore solo la fase fallita."), ('NIST', 'enne i esse ti'), ('Tampone rifiutato, soluzione scaduta o scambiata, elettrodo secco o danneggiato, display instabile, becher senza etichetta o rapporto non documentato rendono il risultato inattendibile. Fermati, proteggi campione e strumento, avvisa il formatore, individua la fase interessata e ripetila con lo stesso metodo dichiarato. Non premere ripetutamente un tasto fino a ottenere il pH desiderato e non sovrascrivere una prova fallita senza annotarla.\n\nConfronta kit colorimetrico da campo, strumento tarato e laboratorio per scopo, metodo, tempo, risoluzione e controlli di qualità. Lo strumento digitale può essere pratico e fornire un numero; il laboratorio può offrire analisi e interpretazioni controllate; entrambi richiedono comunque un campione rappresentativo e una procedura registrata.', 'Tampone rifiutato, soluzione scaduta o scambiata, elettrodo secco o danneggiato, display instabile, becher senza etichetta o rapporto non documentato rendono il risultato inattendibile. Fermati, proteggi campione e strumento, avvisa il formatore, individua la fase interessata e ripetila con lo stesso metodo dichiarato. Non premere ripetutamente un tasto fino a ottenere il P H desiderato e non sovrascrivere una prova fallita senza annotarla.\n\nConfronta kit colorimetrico da campo, strumento tarato e laboratorio per scopo, metodo, tempo, risoluzione e controlli di qualità. Lo strumento digitale può essere pratico e fornire un numero; il laboratorio può offrire analisi e interpretazioni controllate; entrambi richiedono comunque un campione rappresentativo e una procedura registrata.'), ("Un esempio documentato è Hanna acca i nove nove uno due uno con il suo elettrodo dedicato al suolo. Il manuale propone una sospensione separata con 10 g di suolo secco setacciato a 2 mm e 25 mL di soluzione preparatoria acca i sette zero cinque uno, mescolati per 30 secondi e lasciati riposare 5 minuti. Descrive anche una distinta misura direttamente nel terreno con quella sonda. Sono istruzioni specifiche del metodo, non aggiunte alla scheda originale. Non combinare soluzione o tempi del produttore con il rapporto in acqua distillata della scheda.\n\nLa sede potrebbe avere strumento e sonda diversi. Il formatore deve identificarli e scegliere una sola procedura che specifichi liquido, rapporto campione:liquido e sua base, mescolamento, equilibratura, posizione dell'elettrodo e pulizia. Se il manuale o i controlli locali non si possono verificare, si studia il confronto online, ma la misura pratica non viene valutata.", "Un esempio documentato è Hanna acca i nove nove uno due uno con il suo elettrodo dedicato al suolo. Il manuale propone una sospensione separata con dieci grammi di suolo secco setacciato a due millimetri e venticinque millilitri di soluzione preparatoria acca i sette zero cinque uno, mescolati per trenta secondi e lasciati riposare cinque minuti. Descrive anche una distinta misura direttamente nel terreno con quella sonda. Sono istruzioni specifiche del metodo, non aggiunte alla scheda originale. Non combinare soluzione o tempi del produttore con il rapporto in acqua distillata della scheda.\n\nLa sede potrebbe avere strumento e sonda diversi. Il formatore deve identificarli e scegliere una sola procedura che specifichi liquido, rapporto campione:liquido e sua base, mescolamento, equilibratura, posizione dell'elettrodo e pulizia. Se il manuale o i controlli locali non si possono verificare, si studia il confronto online, ma la misura pratica non viene valutata."), ("Un pH-metro digitale stima l'acidità del mezzo a contatto con l'elettrodo. Due cifre decimali sul display non dimostrano che campionamento, taratura o preparazione siano corretti. Prima identifica il campione rappresentativo e verifica se lo strumento approvato è destinato al contatto diretto col suolo o a una sospensione: un normale elettrodo di vetro non va spinto nel terreno solo perché mostra dei numeri.\n\nUn laboratorio professionale può usare metodi controllati, verifiche di qualità e analisi aggiuntive dei nutrienti o della sostanza organica; la parola «laboratorio» da sola non garantisce l'accuratezza. Registra il metodo reale e la domanda a cui il risultato deve rispondere. Qui misuriamo il pH; interpretare i nutrienti o scegliere dosi di correttivi richiede altre prove sul suolo e sulla coltura.", "Un P H-metro digitale stima l'acidità del mezzo a contatto con l'elettrodo. Due cifre decimali sul display non dimostrano che campionamento, taratura o preparazione siano corretti. Prima identifica il campione rappresentativo e verifica se lo strumento approvato è destinato al contatto diretto col suolo o a una sospensione: un normale elettrodo di vetro non va spinto nel terreno solo perché mostra dei numeri.\n\nUn laboratorio professionale può usare metodi controllati, verifiche di qualità e analisi aggiuntive dei nutrienti o della sostanza organica; la parola «laboratorio» da sola non garantisce l'accuratezza. Registra il metodo reale e la domanda a cui il risultato deve rispondere. Qui misuriamo il P H; interpretare i nutrienti o scegliere dosi di correttivi richiede altre prove sul suolo e sulla coltura."), ('Usa campioni separati A, B e C. Il formatore li verifica prima e conserva la chiave reale. Ruotate esecutore, verbalizzante e analista, ma ciascuno deve misurare personalmente sotto osservazione. Registra metodo e lettura reali prima degli obiettivi didattici.\n\nNelle tre parti originali da dieci minuti, gli allievi misurano, discutono possibili effetti sui nutrienti e propongono una verifica successiva o risposta specifica per la coltura. Il pH da solo non determina correttivo o dose. Il valore modello 6.8 è lievemente acido, vicino alla neutralità; se il campione reale differisce, registra la misura e indaga il motivo.', 'Usa campioni separati A, B e C. Il formatore li verifica prima e conserva la chiave reale. Ruotate esecutore, verbalizzante e analista, ma ciascuno deve misurare personalmente sotto osservazione. Registra metodo e lettura reali prima degli obiettivi didattici.\n\nNelle tre parti originali da dieci minuti, gli allievi misurano, discutono possibili effetti sui nutrienti e propongono una verifica successiva o risposta specifica per la coltura. Il P H da solo non determina correttivo o dose. Il valore modello sei virgola otto è lievemente acido, vicino alla neutralità; se il campione reale differisce, registra la misura e indaga il motivo.'), ("Usa il punto di misura previsto dal metodo scelto. Nella scheda originale, immergi l'elettrodo tarato nella fase liquida della sospensione decantata, con punta sensibile e giunzione immerse secondo il manuale della sonda, senza sfregare il vetro contro sedimento o fondo del becher. Altri metodi convalidati possono richiedere una leggera agitazione o la misura nella sospensione: non scambiarne tacitamente le istruzioni.\n\nAttendi l'indicatore di stabilità dello strumento o il criterio documentato della sede. Registra il valore con la risoluzione supportata dal display, ID del campione, preparazione e liquido, taratura, ora e anomalie. Risciacqua tra i campioni secondo il manuale per evitare trascinamenti. Alla fine pulisci e conserva la sonda come prescritto: lasciare genericamente ogni sonda in acqua distillata può danneggiarne alcune.\n\nIl docente presenta anche le strisce indicatrici come metodo distinto: immergi solo l'estremità reattiva nel liquido adatto e confronta il colore con la scala del produttore al tempo indicato. La striscia non tara un elettrodo digitale e non permette di attribuire una lettura strumentale senza il suo metodo. Tienila come dimostrazione alternativa, non come reagente o fase di taratura della scheda digitale.", "Usa il punto di misura previsto dal metodo scelto. Nella scheda originale, immergi l'elettrodo tarato nella fase liquida della sospensione decantata, con punta sensibile e giunzione immerse secondo il manuale della sonda, senza sfregare il vetro contro sedimento o fondo del becher. Altri metodi convalidati possono richiedere una leggera agitazione o la misura nella sospensione: non scambiarne tacitamente le istruzioni.\n\nAttendi l'indicatore di stabilità dello strumento o il criterio documentato della sede. Registra il valore con la risoluzione supportata dal display, I D del campione, preparazione e liquido, taratura, ora e anomalie. Risciacqua tra i campioni secondo il manuale per evitare trascinamenti. Alla fine pulisci e conserva la sonda come prescritto: lasciare genericamente ogni sonda in acqua distillata può danneggiarne alcune.\n\nIl docente presenta anche le strisce indicatrici come metodo distinto: immergi solo l'estremità reattiva nel liquido adatto e confronta il colore con la scala del produttore al tempo indicato. La striscia non tara un elettrodo digitale e non permette di attribuire una lettura strumentale senza il suo metodo. Tienila come dimostrazione alternativa, non come reagente o fase di taratura della scheda digitale."), ("un'attesa di quindici a trenta minuti", "un'attesa da quindici a trenta minuti")], 'de': [('1:1', 'eins zu eins'), ('1:1 g:g', 'eins zu eins, Gramm zu Gramm'), ('1:1 g:mL', 'eins zu eins, Gramm zu Milliliter'), ('1:2', 'eins zu zwei'), ('Abgelehnter Puffer, abgelaufene oder verwechselte Lösung, trockene oder beschädigte Elektrode, instabile Anzeige, unbeschriftetes Becherglas oder undokumentiertes Verhältnis machen das Ergebnis unzuverlässig. Halte an, schütze Probe und Gerät, informiere die Lehrkraft, ermittle die betroffene Phase und wiederhole sie im selben festgelegten Verfahren. Drücke nicht so oft auf eine Taste, bis ein gewünschter pH erscheint, und überschreibe keinen fehlgeschlagenen Lauf ohne Vermerk.\n\nVergleiche Feld-Farbtest, kalibriertes Messgerät und Labor nach Zweck, Verfahren, Zeit, Auflösung und Qualitätskontrollen. Das digitale Gerät kann bequem einen Zahlenwert liefern; das Labor kann kontrollierte Analysen und Deutung ergänzen. Keines ersetzt eine repräsentative Probe und ein dokumentiertes Verfahren.', 'Abgelehnter Puffer, abgelaufene oder verwechselte Lösung, trockene oder beschädigte Elektrode, instabile Anzeige, unbeschriftetes Becherglas oder undokumentiertes Verhältnis machen das Ergebnis unzuverlässig. Halte an, schütze Probe und Gerät, informiere die Lehrkraft, ermittle die betroffene Phase und wiederhole sie im selben festgelegten Verfahren. Drücke nicht so oft auf eine Taste, bis ein gewünschter P H erscheint, und überschreibe keinen fehlgeschlagenen Lauf ohne Vermerk.\n\nVergleiche Feld-Farbtest, kalibriertes Messgerät und Labor nach Zweck, Verfahren, Zeit, Auflösung und Qualitätskontrollen. Das digitale Gerät kann bequem einen Zahlenwert liefern; das Labor kann kontrollierte Analysen und Deutung ergänzen. Keines ersetzt eine repräsentative Probe und ein dokumentiertes Verfahren.'), ('Die bewertete Originalsituation beginnt mit einer bereits luftgetrockneten Rohprobe. Trage den am Standort vorgeschriebenen Augen-, Körper- und Handschutz; zerkleinere Bodenklumpen vorsichtig in einem sauberen Mörser, ohne Steine zu mahlen; siebe auf 2 mm; wiege 20 g gesiebten Boden und miss 20 mL destilliertes Wasser in einem sauberen Becherglas ab. Auf dieser Karte eine Minute rühren und die Suspension 15 Minuten stehen lassen. Diese Zahlen gehören zu einer einzigen Masse-Volumen-Aufbereitung: 20 g Boden auf 20 mL Wasser, angegeben als eins zu eins, Gramm zu Milliliter, nicht eins zu eins, Gramm zu Gramm oder als einheitenloses Volumenverhältnis.\n\nBewahre Probenetikett, Waagen- und Messzylinderwerte sowie tatsächliche Zeiten auf. Die Lehrerklärung nennt auch eins zu eins oder eins zu zwei und 15–30 Minuten Wartezeit; das sind Alternativen, keine Erlaubnis, das Verhältnis aus einem und die Zeit aus einem anderen Verfahren zu wählen. Das am Ausbildungsort verwendete digitale Verfahren muss vor einer bewerteten Arbeit vollständig festgelegt und mit Gerät und Standortmethode abgeglichen sein.', 'Die bewertete Originalsituation beginnt mit einer bereits luftgetrockneten Rohprobe. Trage den am Standort vorgeschriebenen Augen-, Körper- und Handschutz; zerkleinere Bodenklumpen vorsichtig in einem sauberen Mörser, ohne Steine zu mahlen; siebe auf zwei Millimeter; wiege zwanzig Gramm gesiebten Boden und miss zwanzig Milliliter destilliertes Wasser in einem sauberen Becherglas ab. Auf dieser Karte eine Minute rühren und die Suspension fünfzehn Minuten stehen lassen. Diese Zahlen gehören zu einer einzigen Masse-Volumen-Aufbereitung: zwanzig Gramm Boden auf zwanzig Milliliter Wasser, angegeben als eins zu eins, Gramm zu Milliliter, nicht eins zu eins, Gramm zu Gramm oder als einheitenloses Volumenverhältnis.\n\nBewahre Probenetikett, Waagen- und Messzylinderwerte sowie tatsächliche Zeiten auf. Die Lehrerklärung nennt auch eins zu eins oder eins zu zwei und fünfzehn bis dreißig Minuten Wartezeit; das sind Alternativen, keine Erlaubnis, das Verhältnis aus einem und die Zeit aus einem anderen Verfahren zu wählen. Das am Ausbildungsort verwendete digitale Verfahren muss vor einer bewerteten Arbeit vollständig festgelegt und mit Gerät und Standortmethode abgeglichen sein.'), ('Ein digitales pH-Messgerät schätzt den Säuregrad des Mediums an seiner Elektrode. Zwei Nachkommastellen beweisen weder eine richtige Probenahme noch Kalibrierung oder Aufbereitung. Kennzeichne zuerst eine repräsentative Probe und prüfe, ob das zugelassene Gerät für direkten Bodenkontakt oder eine Suspension bestimmt ist. Eine gewöhnliche Glaselektrode darf nicht bloß wegen ihrer Digitalanzeige in den Boden gedrückt werden.\n\nEin Fachlabor kann kontrollierte Verfahren, Qualitätsprüfungen und zusätzliche Nährstoff- oder Humusergebnisse liefern; das Wort „Labor“ allein garantiert jedoch keine Genauigkeit. Notiere das tatsächliche Verfahren und die Frage, die das Ergebnis beantworten soll. In diesem Schritt wird pH gemessen; Nährstoffdeutung und Dosierung von Bodenverbesserungen benötigen weitere Boden- und Pflanzeninformationen.', 'Ein digitales P H-Messgerät schätzt den Säuregrad des Mediums an seiner Elektrode. Zwei Nachkommastellen beweisen weder eine richtige Probenahme noch Kalibrierung oder Aufbereitung. Kennzeichne zuerst eine repräsentative Probe und prüfe, ob das zugelassene Gerät für direkten Bodenkontakt oder eine Suspension bestimmt ist. Eine gewöhnliche Glaselektrode darf nicht bloß wegen ihrer Digitalanzeige in den Boden gedrückt werden.\n\nEin Fachlabor kann kontrollierte Verfahren, Qualitätsprüfungen und zusätzliche Nährstoff- oder Humusergebnisse liefern; das Wort „Labor“ allein garantiert jedoch keine Genauigkeit. Notiere das tatsächliche Verfahren und die Frage, die das Ergebnis beantworten soll. In diesem Schritt wird P H gemessen; Nährstoffdeutung und Dosierung von Bodenverbesserungen benötigen weitere Boden- und Pflanzeninformationen.'), ('Ein dokumentiertes Beispiel ist das Hanna Ha I neun neun eins zwei eins mit eigener Bodenelektrode. Das Handbuch gibt ein getrenntes Suspensionsverfahren vor: 10 g trockener, auf 2 mm gesiebter Boden und 25 mL Ha I sieben null fünf eins-Vorbereitungslösung, 30 Sekunden mischen und 5 Minuten stehen lassen. Außerdem beschreibt es eine eigene Direktmessung im Boden mit dieser Sonde. Dies sind verfahrensspezifische Angaben, keine Ergänzungen zur Originalkarte. Herstellerlösung oder -zeiten dürfen nicht mit deren Verhältnis in destilliertem Wasser kombiniert werden.\n\nDer Ausbildungsort kann ein anderes Gerät und eine andere Sonde haben. Die Lehrkraft muss beide bestimmen und ein einziges Verfahren mit Flüssigkeit, Boden-Flüssigkeit-Verhältnis samt Einheiten, Mischen, Gleichgewichtszeit, Elektrodenplatzierung und Reinigung wählen. Sind Handbuch oder lokale Qualitätsregeln nicht überprüfbar, kann der Vergleich online gelernt werden, die praktische Messung bleibt aber unbewertet.', 'Ein dokumentiertes Beispiel ist das Hanna Ha I neun neun eins zwei eins mit eigener Bodenelektrode. Das Handbuch gibt ein getrenntes Suspensionsverfahren vor: zehn Gramm trockener, auf zwei Millimeter gesiebter Boden und fünfundzwanzig Milliliter Ha I sieben null fünf eins-Vorbereitungslösung, dreißig Sekunden mischen und fünf Minuten stehen lassen. Außerdem beschreibt es eine eigene Direktmessung im Boden mit dieser Sonde. Dies sind verfahrensspezifische Angaben, keine Ergänzungen zur Originalkarte. Herstellerlösung oder -zeiten dürfen nicht mit deren Verhältnis in destilliertem Wasser kombiniert werden.\n\nDer Ausbildungsort kann ein anderes Gerät und eine andere Sonde haben. Die Lehrkraft muss beide bestimmen und ein einziges Verfahren mit Flüssigkeit, Boden-Flüssigkeit-Verhältnis samt Einheiten, Mischen, Gleichgewichtszeit, Elektrodenplatzierung und Reinigung wählen. Sind Handbuch oder lokale Qualitätsregeln nicht überprüfbar, kann der Vergleich online gelernt werden, die praktische Messung bleibt aber unbewertet.'), ('Getrennte Proben A, B und C nutzen. Lehrkraft misst vorab und behält den echten Schlüssel. Messen, Protokollieren und Analysieren abwechseln, doch jede Person muss selbst beobachtet messen. Methode und echten Wert vor Lehrzielvergleich notieren.\n\nIn den drei zehnminütigen Inhaltsteilen messen die Lernenden, besprechen mögliche Nährstofffolgen und schlagen eine begründete Nachprüfung oder kulturbezogene Maßnahme vor. pH allein bestimmt weder Bodenverbesserung noch Dosis. Der Modellwert 6.8 ist leicht sauer und nahe neutral; weicht eine reale Probe vom Ziel ab, dokumentiere den tatsächlichen Wert und untersuche die Ursache.', 'Getrennte Proben A, B und C nutzen. Lehrkraft misst vorab und behält den echten Schlüssel. Messen, Protokollieren und Analysieren abwechseln, doch jede Person muss selbst beobachtet messen. Methode und echten Wert vor Lehrzielvergleich notieren.\n\nIn den drei zehnminütigen Inhaltsteilen messen die Lernenden, besprechen mögliche Nährstofffolgen und schlagen eine begründete Nachprüfung oder kulturbezogene Maßnahme vor. P H allein bestimmt weder Bodenverbesserung noch Dosis. Der Modellwert sechs Komma acht ist leicht sauer und nahe neutral; weicht eine reale Probe vom Ziel ab, dokumentiere den tatsächlichen Wert und untersuche die Ursache.'), ('HI7051', 'Ha I sieben null fünf eins'), ('HI99121', 'Ha I neun neun eins zwei eins'), ('Miss an der im gewählten Verfahren vorgeschriebenen Stelle. Bei der Originalkarte wird die kalibrierte Elektrode in die flüssige Phase der abgesetzten Suspension gehalten. Messspitze und Diaphragma müssen nach Sondenhandbuch richtig eingetaucht sein; Glas darf nicht gegen Bodensatz oder Becherboden schaben. Andere validierte Methoden können sanftes Schwenken oder Messung in der Suspension verlangen: tausche ihre Anweisungen nicht stillschweigend aus.\n\nWarte auf die Stabilitätsanzeige des Geräts oder die dokumentierte Standortregel. Erfasse den angezeigten Wert mit der unterstützten Auflösung, Proben-ID, Aufbereitung und Flüssigkeit, Kalibrierung, Uhrzeit und Auffälligkeiten. Spüle zwischen Proben nach Elektrodenhandbuch, damit nichts verschleppt wird. Reinige und lagere die Sonde danach exakt nach Anleitung; die pauschale Anweisung, jede Sonde in destilliertem Wasser zu lagern, kann Elektroden beschädigen.\n\nDie Lehrerunterlagen nennen pH-Indikatorstreifen als anderes Verfahren: Tauche nur das reaktive Ende in passende klare Flüssigkeit und vergleiche zur vorgegebenen Zeit mit der Skala dieses Streifenherstellers. Eine Streifenfarbe kalibriert keine digitale Elektrode, und daraus folgt ohne Verfahren kein digitaler Messwert. Der Streifen bleibt eine alternative Demonstration, kein Zusatzreagenz oder Kalibrierschritt der digitalen Arbeitskarte.', 'Miss an der im gewählten Verfahren vorgeschriebenen Stelle. Bei der Originalkarte wird die kalibrierte Elektrode in die flüssige Phase der abgesetzten Suspension gehalten. Messspitze und Diaphragma müssen nach Sondenhandbuch richtig eingetaucht sein; Glas darf nicht gegen Bodensatz oder Becherboden schaben. Andere validierte Methoden können sanftes Schwenken oder Messung in der Suspension verlangen: tausche ihre Anweisungen nicht stillschweigend aus.\n\nWarte auf die Stabilitätsanzeige des Geräts oder die dokumentierte Standortregel. Erfasse den angezeigten Wert mit der unterstützten Auflösung, Proben-I D, Aufbereitung und Flüssigkeit, Kalibrierung, Uhrzeit und Auffälligkeiten. Spüle zwischen Proben nach Elektrodenhandbuch, damit nichts verschleppt wird. Reinige und lagere die Sonde danach exakt nach Anleitung; die pauschale Anweisung, jede Sonde in destilliertem Wasser zu lagern, kann Elektroden beschädigen.\n\nDie Lehrerunterlagen nennen P H-Indikatorstreifen als anderes Verfahren: Tauche nur das reaktive Ende in passende klare Flüssigkeit und vergleiche zur vorgegebenen Zeit mit der Skala dieses Streifenherstellers. Eine Streifenfarbe kalibriert keine digitale Elektrode, und daraus folgt ohne Verfahren kein digitaler Messwert. Der Streifen bleibt eine alternative Demonstration, kein Zusatzreagenz oder Kalibrierschritt der digitalen Arbeitskarte.'), ('NIST', 'N I S T'), ('Zur Kalibrierung dienen saubere, nicht abgelaufene Pufferlösungen mit Werten, die nach Vorgabe des tatsächlichen Geräts zum erwarteten Probenbereich passen. Laut Ha I neun neun eins zwei eins-Handbuch beginnt die übliche Zweipunktfolge mit pH 7.01 und nutzt danach pH 4.01 oder 10.01; der N I S T-Satz nutzt 6.86 mit 4.01 oder 9.18. Das ursprüngliche Lehrerbeispiel pH 4 und 7 erklärt das Prinzip, ersetzt aber weder den vom Gerät erkannten Satz noch seine Anzeigen.\n\nGib benötigte Pufferportionen in getrennte saubere Gefäße; gebrauchte Flüssigkeit niemals in die Vorratsflasche zurückgießen. Spüle die Elektrode zwischen Lösungen nach ihrem Handbuch und reibe oder zerkratze empfindliches Glas nicht. Warte auf die Annahme jedes Kalibrierpunkts und notiere Satz und Ergebnis. Lehnt das Gerät einen Puffer ab, ist die Kalibrierung nicht erfolgreich: Prüfe Kennzeichnung, Zustand und Elektrode und wiederhole mit der Lehrkraft nur die fehlgeschlagene Phase.', 'Zur Kalibrierung dienen saubere, nicht abgelaufene Pufferlösungen mit Werten, die nach Vorgabe des tatsächlichen Geräts zum erwarteten Probenbereich passen. Laut Ha I neun neun eins zwei eins-Handbuch beginnt die übliche Zweipunktfolge mit P H sieben Komma null eins und nutzt danach P H vier Komma null eins oder zehn Komma null eins; der N I S T-Satz nutzt sechs Komma acht sechs mit vier Komma null eins oder neun Komma eins acht. Das ursprüngliche Lehrerbeispiel P H vier und sieben erklärt das Prinzip, ersetzt aber weder den vom Gerät erkannten Satz noch seine Anzeigen.\n\nGib benötigte Pufferportionen in getrennte saubere Gefäße; gebrauchte Flüssigkeit niemals in die Vorratsflasche zurückgießen. Spüle die Elektrode zwischen Lösungen nach ihrem Handbuch und reibe oder zerkratze empfindliches Glas nicht. Warte auf die Annahme jedes Kalibrierpunkts und notiere Satz und Ergebnis. Lehnt das Gerät einen Puffer ab, ist die Kalibrierung nicht erfolgreich: Prüfe Kennzeichnung, Zustand und Elektrode und wiederhole mit der Lehrkraft nur die fehlgeschlagene Phase.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s207-readings-audio-20261023-r1'
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
