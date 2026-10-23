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
IDS = ('S2-12-ar-EG-R01-r1', 'S2-12-ar-EG-R02-r1', 'S2-12-ar-EG-R03-r1', 'S2-12-ar-EG-R04-r1', 'S2-12-ar-EG-R05-r1', 'S2-12-ar-EG-R06-r1', 'S2-12-en-R01-r1', 'S2-12-en-R02-r1', 'S2-12-en-R03-r1', 'S2-12-en-R04-r1', 'S2-12-en-R05-r1', 'S2-12-en-R06-r1', 'S2-12-it-R01-r1', 'S2-12-it-R02-r1', 'S2-12-it-R03-r1', 'S2-12-it-R04-r1', 'S2-12-it-R05-r1', 'S2-12-it-R06-r1', 'S2-12-de-R01-r1', 'S2-12-de-R02-r1', 'S2-12-de-R03-r1', 'S2-12-de-R04-r1', 'S2-12-de-R05-r1', 'S2-12-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S212_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-12')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s212-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06']
        ri=int(group[1:])-1;voice='Charon'if ri%2==0 else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]==[f'/reading/{ri}/paragraphs/{i}'for i in range(len(u['sourceBindings']))] and len(u['sourceBindings'])in[2,3]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم برطمان المثال المحلول اللي ارتفاعه الكلي 80 mm: الرمل 44 mm، والسلت 24 mm، والطين 12 mm. نسبة كل طبقة التقريبية في البرطمان = سُمك الطبقة ÷ 80 mm ×100. الناتج 55% رمل و30% سلت و15% طين. افحص الارتفاعات الأول: 44 + 24 + 12 = 80 mm. وبعدين افحص 55 + 30 + 15 = 100%.\n\nارتفاع الطبقات المعدنية الكلي هو المقام دائمًا في المثال ده. لو كل نسبة قربتها لأقرب عدد صحيح، مجموع زي 99% أو 101% قد يبقى من التقريب فقط؛ راجع القيم قبل التقريب ودقة العرض قبل تغيير أي قياس. فرق أكبر أو طبقة ناقصة أو طرح يطلع سالب يحتاج مراجعة العلامات والحساب. سجل القياسات الحقيقية، وما تجبرش المجموع يبقى 100 باختراع ارتفاع.', 'استخدم برطمان المثال المحلول اللي ارتفاعه الكلي تمانين ملليمتر: الرمل أربعة وأربعين ملليمتر، والسلت أربعة وعشرين ملليمتر، والطين اتناشر ملليمتر. نسبة كل طبقة التقريبية في البرطمان بتساوي سُمك الطبقة مقسوم على تمانين ملليمتر مضروب في مية. الناتج خمسة وخمسين في المية رمل وتلاتين في المية سلت وخمستاشر في المية طين. افحص الارتفاعات الأول: أربعة وأربعين زائد أربعة وعشرين زائد اتناشر بتساوي تمانين ملليمتر. وبعدين افحص خمسة وخمسين زائد تلاتين زائد خمستاشر بتساوي مية في المية.\n\nارتفاع الطبقات المعدنية الكلي هو المقام دايمًا في المثال ده. لو كل نسبة قربتها لأقرب عدد صحيح، مجموع زي تسعة وتسعين في المية أو مية وواحد في المية قد يبقى من التقريب فقط؛ راجع القيم قبل التقريب ودقة العرض قبل تغيير أي قياس. فرق أكبر أو طبقة ناقصة أو طرح يطلع سالب يحتاج مراجعة العلامات والحساب. سجل القياسات الحقيقية، وما تجبرش المجموع يبقى مية باختراع ارتفاع.'), ('تأكد الأول إن الرمل + السلت + الطين قريب من 100% حسب التقريب المعلن. على مثلث USDA المستخدم هنا، دور على رمل 55% في التدريج السفلي واتبع خطه المائل، وعلى طين 15% في التدريج اللي على الشمال واتبع خطه الأفقي. تحقق إن نقطة التقاطع توافق سلت 30% على التدريج اليمين. نقطة 55/30/15 في فئة التربة اللومية الرملية، مش اللومية الطينية الرملية. اتبع الأسهم والأرقام المطبوعة على الرسم الفعلي؛ بعض الرسوم تضع التسميات أو الأسهم بشكل مختلف.\n\nالشرح هيبقى «أعمل قدامك، نعمل سوا، تعمل بنفسك»: شاهد تتبع 55/30/15، وساعد في تتبع مثال 30% رمل و30% سلت و40% طين، وبعدها تتبع نتائج عيناتك التلاتة. في مثلث USDA القياسي نقطة التدريب عند حد 40% طين قرب منطقة الطين؛ راجع طريقة اعتبار الحد في الرسم المحدد بدل التخمين من الاسم. حاسبة USDA موثوقة ممكن تراجع التتبع بعد ما تشرحه؛ ما بتديكش بيانات عينتك ولا تثبت إنك عملت التجربة.', 'تأكد الأول إن الرمل زائد السلت زائد الطين قريب من مية في المية حسب التقريب المعلن. على مثلث يو إس دي إيه المستخدم هنا، دور على رمل خمسة وخمسين في المية في التدريج السفلي واتبع خطه المائل، وعلى طين خمستاشر في المية في التدريج اللي على الشمال واتبع خطه الأفقي. تحقق إن نقطة التقاطع توافق سلت تلاتين في المية على التدريج اليمين. نقطة خمسة وخمسين, تلاتين, خمستاشر في فئة التربة اللومية الرملية، مش اللومية الطينية الرملية. اتبع الأسهم والأرقام المطبوعة على الرسم الفعلي؛ بعض الرسوم تضع التسميات أو الأسهم بشكل مختلف.\n\nالشرح هيبقى «أعمل قدامك، نعمل سوا، تعمل بنفسك»: شاهد تتبع خمسة وخمسين, تلاتين, خمستاشر، وساعد في تتبع مثال تلاتين في المية رمل وتلاتين في المية سلت وأربعين في المية طين، وبعدها تتبع نتائج عيناتك التلاتة. في مثلث يو إس دي إيه القياسي نقطة التدريب عند حد أربعين في المية طين قرب منطقة الطين؛ راجع طريقة اعتبار الحد في الرسم المحدد بدل التخمين من الاسم. حاسبة يو إس دي إيه موثوقة ممكن تراجع التتبع بعد ما تشرحه؛ ما بتديكش بيانات عينتك ولا تثبت إنك عملت التجربة.'), ('جدول الأمثلة في الأصل فيه تلات حالات ارتفاع كل واحدة 100 mm: \u200fA فيها 65 mm رمل و25 mm سلت و10 mm طين، وفئتها لومية رملية؛ \u200fB فيها 40 و40 و20 mm، وفئتها لومية؛ \u200fC فيها 15 و30 و55 mm، وفئتها طينية. دي أرقام محلولة لتعلم الطريقة، مش ملاحظات لبرطماناتك. جدول جاهز الأرقام يساعد تتدرب على القسمة وتتبع الخطوط، لكنه ما ينجحكش في معيار القياس العملي.\n\nفي برطماناتك أنت A وB وC، اكتب ارتفاع الرمل والسلت والطين والكلي الحقيقي بالملليمتر، واحسب كل نسبة، وبيّن مكان التقاطع على المثلث نفسه، واذكر الفئة المبدئية. قارن اختلاف العينات، وبعدها انقل تفسير الميه أو إدارة المحاصيل للخطوة الجاية بدل افتراض إن القوام وحده يحدد خطة الحقل كاملة.', 'جدول الأمثلة في الأصل فيه تلات حالات ارتفاع كل واحدة مية ملليمتر: \u200fإيه فيها خمسة وستين ملليمتر رمل وخمسة وعشرين ملليمتر سلت وعشرة ملليمتر طين، وفئتها لومية رملية؛ \u200fبي فيها أربعين وأربعين وعشرين ملليمتر، وفئتها لومية؛ \u200fسي فيها خمستاشر وتلاتين وخمسة وخمسين ملليمتر، وفئتها طينية. دي أرقام محلولة لتعلم الطريقة، مش ملاحظات لبرطماناتك. جدول جاهز الأرقام يساعد تتدرب على القسمة وتتبع الخطوط، لكنه ما ينجحكش في معيار القياس العملي.\n\nفي برطماناتك أنت إيه وبي وسي، اكتب ارتفاع الرمل والسلت والطين والكلي الحقيقي بالملليمتر، واحسب كل نسبة، وبيّن مكان التقاطع على المثلث نفسه، واذكر الفئة المبدئية. قارن اختلاف العينات، وبعدها انقل تفسير الميه أو إدارة المحاصيل للخطوة الجاية بدل افتراض إن القوام وحده يحدد خطة الحقل كاملة.'), ('في برطمان تدريب اتفككت تكتلاته كويس، الطبقة المعدنية السفلى غالبًا رمل، والوسطى سلت، والطبقة العليا المعدنية بعد اكتمال الترسيب طين. اقرأ كل حد ظاهر من تحت لفوق، وحط أسماء الطبقات جنب أماكنها الصحيحة في الرسم.\n\nطريقة البرطمان دي صورة تقريبية. اختلاف كثافة الحبيبات أو عدم اكتمال تفكيك التكتلات أو جوانب برطمان مش مستقيمة أو حد غير واضح قد يغيّر ارتفاع الطبقات الظاهر. فئة قوام USDA تُعرّف بنسب وزن الحبيبات المعدنية في جزء التربة الناعم؛ نسبة الارتفاع في البرطمان التعليمي مش تلقائيًا نتيجة معملية مكافئة.', 'في برطمان تدريب اتفككت تكتلاته كويس، الطبقة المعدنية السفلى غالبًا رمل، والوسطى سلت، والطبقة العليا المعدنية بعد اكتمال الترسيب طين. اقرأ كل حد ظاهر من تحت لفوق، وحط أسماء الطبقات جنب أماكنها الصحيحة في الرسم.\n\nطريقة البرطمان دي صورة تقريبية. اختلاف كثافة الحبيبات أو عدم اكتمال تفكيك التكتلات أو جوانب برطمان مش مستقيمة أو حد غير واضح قد يغيّر ارتفاع الطبقات الظاهر. فئة قوام يو إس دي إيه تُعرّف بنسب وزن الحبيبات المعدنية في جزء التربة الناعم؛ نسبة الارتفاع في البرطمان التعليمي مش تلقائيًا نتيجة معملية مكافئة.'), ('هات أسماء العينات التلاتة وأوقات البداية والملاحظات النهائية الحقيقية من الخطوة السابقة. بعد وقت الترسيب اللي اختاره المدرّب، تأكد إن البرطمان ما اتحركش وإن القاع وحدود الرمل والسلت والطبقة المعدنية الأخيرة باينة. استبعد المادة العضوية الطافية. لو حد مش واضح اكتبه «غير واضح» بدل نقل خط من برطمان تاني.\n\nاستخدم مسطرة واحدة ووحدة الملليمتر طول الوقت. العلامة اللي بتقيسها لفوق من القاع اسمها ارتفاع تراكمي؛ سُمك الطبقة هو الفرق بين العلامتين اللي بيحددوها. لو أول علامة عند 44 mm والتانية 68 mm والأخيرة 80 mm، الرمل 44 mm، والسلت 68 − 44 = 24 mm، والطين 80 − 68 = 12 mm. الارتفاع الكلي 80 mm، مش 44 + 68 + 80 mm.', 'هات أسماء العينات التلاتة وأوقات البداية والملاحظات النهائية الحقيقية من الخطوة السابقة. بعد وقت الترسيب اللي اختاره المدرّب، تأكد إن البرطمان ما اتحركش وإن القاع وحدود الرمل والسلت والطبقة المعدنية الأخيرة باينة. استبعد المادة العضوية الطافية. لو حد مش واضح اكتبه «غير واضح» بدل نقل خط من برطمان تاني.\n\nاستخدم مسطرة واحدة ووحدة الملليمتر طول الوقت. العلامة اللي بتقيسها لفوق من القاع اسمها ارتفاع تراكمي؛ سُمك الطبقة هو الفرق بين العلامتين اللي بيحددوها. لو أول علامة عند أربعة وأربعين ملليمتر والتانية تمانية وستين ملليمتر والأخيرة تمانين ملليمتر، الرمل أربعة وأربعين ملليمتر، والسلت تمانية وستين ناقص أربعة وأربعين بتساوي أربعة وعشرين ملليمتر، والطين تمانين ناقص تمانية وستين بتساوي اتناشر ملليمتر. الارتفاع الكلي تمانين ملليمتر، مش أربعة وأربعين زائد تمانية وستين زائد تمانين ملليمتر.')], 'en': [("Bring forward the same three sample IDs, actual start times and final observations from the previous step. After the trainer's selected settling timetable, check that the jar is undisturbed and that the bottom, sand, silt and final mineral boundaries are visible. Exclude floating organic material. Record an unclear interface as unclear rather than copying another jar's line.\n\nUse one ruler and millimetres throughout. A mark measured upward from the bottom is a cumulative height; a layer thickness is the difference between its two bounding marks. If the first mark is 44 mm, the next is 68 mm and the final mark is 80 mm, sand is 44 mm, silt is 68 − 44 = 24 mm and clay is 80 − 68 = 12 mm. The total is 80 mm, not 44 + 68 + 80 mm.", "Bring forward the same three sample IDs, actual start times and final observations from the previous step. After the trainer's selected settling timetable, check that the jar is undisturbed and that the bottom, sand, silt and final mineral boundaries are visible. Exclude floating organic material. Record an unclear interface as unclear rather than copying another jar's line.\n\nUse one ruler and millimetres throughout. A mark measured upward from the bottom is a cumulative height; a layer thickness is the difference between its two bounding marks. If the first mark is forty-four millimetres, the next is sixty-eight millimetres and the final mark is eighty millimetres, sand is forty-four millimetres, silt is sixty-eight minus forty-four equals twenty-four millimetres and clay is eighty minus sixty-eight equals twelve millimetres. The total is eighty millimetres, not forty-four plus sixty-eight plus eighty millimetres."), ("First confirm that sand + silt + clay is about 100% with the declared rounding. On the USDA chart used here, find sand 55% on the bottom scale and follow its diagonal line; find clay 15% on the left scale and follow its horizontal line. Verify that the intersecting point also agrees with silt 30% on the right scale. The 55/30/15 point lies in sandy loam, not sandy clay loam. Follow the arrows and printed scales on the actual chart; different graphics can place labels or arrows differently.\n\nThe demonstration follows 'I do, we do, you do': watch the 55/30/15 trace, help trace the 30% sand, 30% silt, 40% clay practice point, then trace your own three results. On the standard USDA triangle, the practice point lies on the 40% clay boundary of the clay region; check exact boundary conventions on the chart rather than guessing from the name. A verified USDA calculator can check a completed trace. It does not supply sample data or prove a jar test was done.", "First confirm that sand plus silt plus clay is about one hundred percent with the declared rounding. On the U S D A chart used here, find sand fifty-five percent on the bottom scale and follow its diagonal line; find clay fifteen percent on the left scale and follow its horizontal line. Verify that the intersecting point also agrees with silt thirty percent on the right scale. The fifty-five, thirty, fifteen point lies in sandy loam, not sandy clay loam. Follow the arrows and printed scales on the actual chart; different graphics can place labels or arrows differently.\n\nThe demonstration follows 'I do, we do, you do': watch the fifty-five, thirty, fifteen trace, help trace the thirty percent sand, thirty percent silt, forty percent clay practice point, then trace your own three results. On the standard U S D A triangle, the practice point lies on the forty percent clay boundary of the clay region; check exact boundary conventions on the chart rather than guessing from the name. A verified U S D A calculator can check a completed trace. It does not supply sample data or prove a jar test was done."), ('In a well-dispersed classroom jar, the basal mineral layer is generally sand, the middle layer silt and the upper settled mineral layer clay. Read each visible boundary from the bottom upward, and show the three labels beside the matching layers on the diagram.\n\nThis jar method offers an approximate picture. Different particle density, incomplete dispersal, irregular jar walls or an unclear boundary can change the apparent layer heights. A USDA class is defined for the fine-earth mineral particle proportions by weight; a height fraction from this classroom jar is not automatically an equivalent laboratory result.', 'In a well-dispersed classroom jar, the basal mineral layer is generally sand, the middle layer silt and the upper settled mineral layer clay. Read each visible boundary from the bottom upward, and show the three labels beside the matching layers on the diagram.\n\nThis jar method offers an approximate picture. Different particle density, incomplete dispersal, irregular jar walls or an unclear boundary can change the apparent layer heights. A U S D A class is defined for the fine-earth mineral particle proportions by weight; a height fraction from this classroom jar is not automatically an equivalent laboratory result.'), ('The source model table supplies three 100 mm examples: A has 65 mm sand, 25 mm silt and 10 mm clay and is sandy loam; B has 40, 40 and 20 mm and is loam; C has 15, 30 and 55 mm and is clay. These are worked values for learning the method, not observations of your jars. A pre-filled table can help practise division and chart tracing, but it cannot pass the measurement criterion.\n\nFor your own A, B and C jars, enter the actual sand, silt, clay and total heights in mm, calculate each percentage, show the intersection on the same chart and state the provisional class. Compare differences between the samples, then carry any water or crop-management interpretation to the next step rather than assuming texture alone decides the whole farm plan.', 'The source model table supplies three examples with a total height of one hundred millimetres each: A has sixty-five millimetres sand, twenty-five millimetres silt and ten millimetres clay and is sandy loam; B has forty, forty and twenty millimetres and is loam; C has fifteen, thirty and fifty-five millimetres and is clay. These are worked values for learning the method, not observations of your jars. A pre-filled table can help practise division and chart tracing, but it cannot pass the measurement criterion.\n\nFor your own A, B and C jars, enter the actual sand, silt, clay and total heights in millimetres, calculate each percentage, show the intersection on the same chart and state the provisional class. Compare differences between the samples, then carry any water or crop-management interpretation to the next step rather than assuming texture alone decides the whole farm plan.'), ("Use the worked 80 mm jar: sand 44 mm, silt 24 mm, clay 12 mm. For each layer, estimated jar percentage = that layer's thickness ÷ 80 mm × 100. This gives 55% sand, 30% silt and 15% clay. Check the raw heights first: 44 + 24 + 12 = 80 mm. Then check 55 + 30 + 15 = 100%.\n\nThe total mineral-layer height is always the denominator for this example. If percentages are rounded separately to whole numbers, a sum such as 99% or 101% can be rounding alone; examine unrounded values and stated precision before changing a measurement. A larger mismatch, missing layer or negative difference calls for rechecking marks, subtraction and arithmetic. Record the measured values; do not force a result to 100 by inventing a height.", "Use the worked jar with a total height of eighty millimetres: sand forty-four millimetres, silt twenty-four millimetres, clay twelve millimetres. For each layer, estimated jar percentage equals that layer's thickness divided by eighty millimetres multiplied by one hundred. This gives fifty-five percent sand, thirty percent silt and fifteen percent clay. Check the raw heights first: forty-four plus twenty-four plus twelve equals eighty millimetres. Then check fifty-five plus thirty plus fifteen equals one hundred percent.\n\nThe total mineral-layer height is always the denominator for this example. If percentages are rounded separately to whole numbers, a sum such as ninety-nine percent or one hundred and one percent can be rounding alone; examine unrounded values and stated precision before changing a measurement. A larger mismatch, missing layer or negative difference calls for rechecking marks, subtraction and arithmetic. Record the measured values; do not force a result to one hundred by inventing a height.")], 'it': [("In un barattolo didattico ben disperso, lo strato minerale inferiore è generalmente sabbia, quello centrale limo e quello superiore dopo la sedimentazione argilla. Leggi ogni confine visibile dal basso verso l'alto e colloca le tre etichette accanto agli strati corrispondenti nel disegno.\n\nIl metodo del barattolo fornisce una rappresentazione approssimativa. Densità diverse, dispersione incompleta, pareti irregolari o limiti sfumati possono cambiare le altezze apparenti. Una classe USDA è definita dalle proporzioni in massa delle particelle minerali della terra fine; una frazione di altezza di questo barattolo scolastico non equivale automaticamente a un risultato di laboratorio.", "In un barattolo didattico ben disperso, lo strato minerale inferiore è generalmente sabbia, quello centrale limo e quello superiore dopo la sedimentazione argilla. Leggi ogni confine visibile dal basso verso l'alto e colloca le tre etichette accanto agli strati corrispondenti nel disegno.\n\nIl metodo del barattolo fornisce una rappresentazione approssimativa. Densità diverse, dispersione incompleta, pareti irregolari o limiti sfumati possono cambiare le altezze apparenti. Una classe u esse di a è definita dalle proporzioni in massa delle particelle minerali della terra fine; una frazione di altezza di questo barattolo scolastico non equivale automaticamente a un risultato di laboratorio."), ("La tabella del manuale offre tre esempi da 100 mm: A contiene 65 mm sabbia, 25 mm limo e 10 mm argilla ed è franco sabbioso; B contiene 40, 40 e 20 mm ed è franco; C contiene 15, 30 e 55 mm ed è argilloso. Sono valori risolti per imparare il metodo, non osservazioni dei tuoi barattoli. Una tabella precompilata aiuta a esercitarsi nella divisione e nel grafico, ma non supera il criterio di misurazione.\n\nPer i tuoi barattoli A, B e C, annota le altezze reali di sabbia, limo, argilla e totale in mm, calcola ciascuna percentuale, mostra l'incrocio sullo stesso grafico e nomina la classe provvisoria. Confronta i campioni e rimanda l'interpretazione su acqua o colture al passo successivo: la tessitura da sola non determina tutto il piano di gestione.", "La tabella del manuale offre tre esempi da cento millimetri: A contiene sessantacinque millimetri sabbia, venticinque millimetri limo e dieci millimetri argilla ed è franco sabbioso; B contiene quaranta, quaranta e venti millimetri ed è franco; C contiene quindici, trenta e cinquantacinque millimetri ed è argilloso. Sono valori risolti per imparare il metodo, non osservazioni dei tuoi barattoli. Una tabella precompilata aiuta a esercitarsi nella divisione e nel grafico, ma non supera il criterio di misurazione.\n\nPer i tuoi barattoli A, B e C, annota le altezze reali di sabbia, limo, argilla e totale in millimetri, calcola ciascuna percentuale, mostra l'incrocio sullo stesso grafico e nomina la classe provvisoria. Confronta i campioni e rimanda l'interpretazione su acqua o colture al passo successivo: la tessitura da sola non determina tutto il piano di gestione."), ("Riprendi gli stessi tre identificativi, gli orari di inizio reali e le osservazioni finali del passo precedente. Dopo il calendario di sedimentazione scelto dal formatore, verifica che il barattolo non sia stato mosso e che fondo, limiti della sabbia, del limo e del deposito minerale finale siano visibili. Escludi la sostanza organica galleggiante. Annota 'non chiaro' per un'interfaccia sfumata anziché copiare la linea di un altro barattolo.\n\nUsa lo stesso righello e i millimetri per tutte le misure. Un segno misurato dal fondo è un'altezza cumulativa; lo spessore di uno strato è la differenza fra i due segni che lo delimitano. Se i segni sono a 44 mm, 68 mm e 80 mm, la sabbia è 44 mm, il limo 68 − 44 = 24 mm e l'argilla 80 − 68 = 12 mm. Il totale è 80 mm, non 44 + 68 + 80 mm.", "Riprendi gli stessi tre identificativi, gli orari di inizio reali e le osservazioni finali del passo precedente. Dopo il calendario di sedimentazione scelto dal formatore, verifica che il barattolo non sia stato mosso e che fondo, limiti della sabbia, del limo e del deposito minerale finale siano visibili. Escludi la sostanza organica galleggiante. Annota 'non chiaro' per un'interfaccia sfumata anziché copiare la linea di un altro barattolo.\n\nUsa lo stesso righello e i millimetri per tutte le misure. Un segno misurato dal fondo è un'altezza cumulativa; lo spessore di uno strato è la differenza fra i due segni che lo delimitano. Se i segni sono a quarantaquattro millimetri, sessantotto millimetri e ottanta millimetri, la sabbia è quarantaquattro millimetri, il limo sessantotto meno quarantaquattro uguale a ventiquattro millimetri e l'argilla ottanta meno sessantotto uguale a dodici millimetri. Il totale è ottanta millimetri, non quarantaquattro più sessantotto più ottanta millimetri."), ("Usa l'esempio svolto di 80 mm: sabbia 44 mm, limo 24 mm, argilla 12 mm. Per ogni strato, percentuale stimata nel barattolo = spessore dello strato ÷ 80 mm ×100. Ottieni 55% sabbia, 30% limo e 15% argilla. Prima controlla 44 + 24 + 12 = 80 mm; poi controlla 55 + 30 + 15 = 100%.\n\nL'altezza minerale totale è sempre il denominatore di questo esempio. Se arrotondi ogni percentuale a un numero intero, un totale di 99% o 101% può dipendere solo dall'arrotondamento: guarda i valori non arrotondati e la precisione dichiarata prima di cambiare una misura. Uno scarto maggiore, uno strato mancante o una differenza negativa richiedono di ricontrollare segni, sottrazioni e calcoli. Registra i valori misurati e non forzare 100 inventando un'altezza.", "Usa l'esempio svolto di ottanta millimetri: sabbia quarantaquattro millimetri, limo ventiquattro millimetri, argilla dodici millimetri. Per ogni strato, percentuale stimata nel barattolo uguale a spessore dello strato diviso per ottanta millimetri moltiplicato per cento. Ottieni cinquantacinque per cento di sabbia, trenta per cento di limo e quindici per cento di argilla. Prima controlla quarantaquattro più ventiquattro più dodici uguale a ottanta millimetri; poi controlla cinquantacinque più trenta più quindici uguale a cento per cento.\n\nL'altezza minerale totale è sempre il denominatore di questo esempio. Se arrotondi ogni percentuale a un numero intero, un totale di novantanove per cento o centouno per cento può dipendere solo dall'arrotondamento: guarda i valori non arrotondati e la precisione dichiarata prima di cambiare una misura. Uno scarto maggiore, uno strato mancante o una differenza negativa richiedono di ricontrollare segni, sottrazioni e calcoli. Registra i valori misurati e non forzare cento inventando un'altezza."), ("Verifica prima che sabbia + limo + argilla sia circa 100% con l'arrotondamento dichiarato. Sul grafico USDA usato qui, trova 55% sabbia sulla scala inferiore e segui la diagonale; trova 15% argilla sulla scala sinistra e segui l'orizzontale. Controlla che l'incrocio sia coerente con 30% limo sulla scala destra. Il punto 55/30/15 è franco sabbioso, non franco argilloso sabbioso. Segui frecce e scale del grafico reale: immagini diverse possono disporre etichette o frecce in modo diverso.\n\nLa dimostrazione segue 'mostro, facciamo insieme, fai tu': osserva 55/30/15, aiuta a tracciare il punto 30% sabbia, 30% limo e 40% argilla, poi traccia i tre risultati tuoi. Nel triangolo USDA standard il punto di esercizio è sul limite del 40% di argilla vicino alla regione argillosa; verifica la convenzione del confine nel grafico scelto invece di indovinarla dal nome. Una calcolatrice USDA verificata può controllare una traccia completata; non fornisce dati del campione né prova l'esecuzione della prova.", "Verifica prima che sabbia più limo più argilla sia circa cento per cento con l'arrotondamento dichiarato. Sul grafico u esse di a usato qui, trova cinquantacinque per cento di sabbia sulla scala inferiore e segui la diagonale; trova quindici per cento di argilla sulla scala sinistra e segui l'orizzontale. Controlla che l'incrocio sia coerente con trenta per cento di limo sulla scala destra. Il punto cinquantacinque, trenta, quindici è franco sabbioso, non franco argilloso sabbioso. Segui frecce e scale del grafico reale: immagini diverse possono disporre etichette o frecce in modo diverso.\n\nLa dimostrazione segue 'mostro, facciamo insieme, fai tu': osserva cinquantacinque, trenta, quindici, aiuta a tracciare il punto trenta per cento di sabbia, trenta per cento di limo e quaranta per cento di argilla, poi traccia i tre risultati tuoi. Nel triangolo u esse di a standard il punto di esercizio è sul limite del quaranta per cento di argilla vicino alla regione argillosa; verifica la convenzione del confine nel grafico scelto invece di indovinarla dal nome. Una calcolatrice u esse di a verificata può controllare una traccia completata; non fornisce dati del campione né prova l'esecuzione della prova.")], 'de': [('Die Originaltabelle enthält drei Beispiele mit jeweils 100 mm: A hat 65 mm Sand, 25 mm Schluff und 10 mm Ton und ist sandiger Lehm; B hat 40, 40 und 20 mm und ist Lehm; C hat 15, 30 und 55 mm und ist Ton. Das sind Lernwerte, keine Beobachtungen deiner Gläser. Eine ausgefüllte Tabelle kann Division und Linienführung üben, erfüllt aber nicht das praktische Messkriterium.\n\nFür deine eigenen Gläser A, B und C notiere die tatsächlich gemessenen Sand-, Schluff-, Ton- und Gesamthöhen in mm, berechne jeden Anteil, zeige den Schnittpunkt auf derselben Grafik und nenne die vorläufige Klasse. Vergleiche die Proben. Übertrage Deutungen zu Wasser oder Anbau in den nächsten Schritt, statt aus der Textur allein einen vollständigen Feldplan abzuleiten.', 'Die Originaltabelle enthält drei Beispiele mit jeweils einhundert Millimetern: A hat fünfundsechzig Millimeter Sand, fünfundzwanzig Millimeter Schluff und zehn Millimeter Ton und ist sandiger Lehm; B hat vierzig, vierzig und zwanzig Millimeter und ist Lehm; C hat fünfzehn, dreißig und fünfundfünfzig Millimeter und ist Ton. Das sind Lernwerte, keine Beobachtungen deiner Gläser. Eine ausgefüllte Tabelle kann Division und Linienführung üben, erfüllt aber nicht das praktische Messkriterium.\n\nFür deine eigenen Gläser A, B und C notiere die tatsächlich gemessenen Sand-, Schluff-, Ton- und Gesamthöhen in Millimetern, berechne jeden Anteil, zeige den Schnittpunkt auf derselben Grafik und nenne die vorläufige Klasse. Vergleiche die Proben. Übertrage Deutungen zu Wasser oder Anbau in den nächsten Schritt, statt aus der Textur allein einen vollständigen Feldplan abzuleiten.'), ('In einem gut dispergierten Unterrichtsglas liegt unten gewöhnlich Sand, in der Mitte Schluff und oben die zuletzt abgesetzte mineralische Tonschicht. Lies jede sichtbare Grenze von unten nach oben und setze die drei Bezeichnungen im Bild neben die passenden Schichten.\n\nDer Glasversuch zeigt nur ein ungefähres Bild. Unterschiedliche Teilchendichten, unvollständige Dispersion, unregelmäßige Glaswände oder unklare Grenzen können sichtbare Schichthöhen beeinflussen. USDA-Klassen beziehen sich auf Massenanteile mineralischer Feinerde; eine Höhenschätzung aus diesem Unterrichtsglas ist nicht automatisch ein gleichwertiger Laborbefund.', 'In einem gut dispergierten Unterrichtsglas liegt unten gewöhnlich Sand, in der Mitte Schluff und oben die zuletzt abgesetzte mineralische Tonschicht. Lies jede sichtbare Grenze von unten nach oben und setze die drei Bezeichnungen im Bild neben die passenden Schichten.\n\nDer Glasversuch zeigt nur ein ungefähres Bild. Unterschiedliche Teilchendichten, unvollständige Dispersion, unregelmäßige Glaswände oder unklare Grenzen können sichtbare Schichthöhen beeinflussen. U Es De A-Klassen beziehen sich auf Massenanteile mineralischer Feinerde; eine Höhenschätzung aus diesem Unterrichtsglas ist nicht automatisch ein gleichwertiger Laborbefund.'), ('Nutze das Beispielglas mit insgesamt 80 mm: Sand 44 mm, Schluff 24 mm, Ton 12 mm. Für jede Schicht gilt: geschätzter Glasanteil = ihre Dicke ÷ 80 mm ×100. Das ergibt 55% Sand, 30% Schluff und 15% Ton. Prüfe zuerst die Höhen 44 + 24 + 12 = 80 mm und danach die Prozente 55 + 30 + 15 = 100%.\n\nDie gesamte Mineralschichthöhe ist in diesem Beispiel immer der Nenner. Rundet man jeden Prozentwert einzeln auf ganze Zahlen, können 99% oder 101% allein aus Rundung folgen. Prüfe ungerundete Werte und angegebene Genauigkeit, bevor du einen Messwert änderst. Eine größere Abweichung, fehlende Schicht oder negative Differenz erfordert die Prüfung von Marken, Subtraktion und Rechnung. Notiere echte Messwerte und erfinde keine Höhe, um 100 zu erzwingen.', 'Nutze das Beispielglas mit insgesamt achtzig Millimetern: Sand vierundvierzig Millimeter, Schluff vierundzwanzig Millimeter, Ton zwölf Millimeter. Für jede Schicht gilt: geschätzter Glasanteil gleich ihre Dicke geteilt durch achtzig Millimeter mal einhundert. Das ergibt fünfundfünfzig Prozent Sand, dreißig Prozent Schluff und fünfzehn Prozent Ton. Prüfe zuerst die Höhen vierundvierzig plus vierundzwanzig plus zwölf gleich achtzig Millimeter und danach die Prozente fünfundfünfzig plus dreißig plus fünfzehn gleich einhundert Prozent.\n\nDie gesamte Mineralschichthöhe ist in diesem Beispiel immer der Nenner. Rundet man jeden Prozentwert einzeln auf ganze Zahlen, können neunundneunzig Prozent oder einhunderteins Prozent allein aus Rundung folgen. Prüfe ungerundete Werte und angegebene Genauigkeit, bevor du einen Messwert änderst. Eine größere Abweichung, fehlende Schicht oder negative Differenz erfordert die Prüfung von Marken, Subtraktion und Rechnung. Notiere echte Messwerte und erfinde keine Höhe, um einhundert zu erzwingen.'), ("Prüfe zuerst, ob Sand + Schluff + Ton bei angegebener Rundung ungefähr 100% ergeben. Suche auf der hier genutzten USDA-Grafik 55% Sand an der unteren Skala und folge der schrägen Linie; suche 15% Ton links und folge der waagerechten Linie. Prüfe, ob ihr Schnittpunkt auch zu 30% Schluff rechts passt. Der Punkt 55/30/15 liegt in sandigem Lehm, nicht in sandigem Tonlehm. Folge Pfeilen und gedruckten Skalen der tatsächlichen Grafik, denn andere Darstellungen können Beschriftungen oder Pfeile anders anordnen.\n\nDie Demonstration lautet 'ich zeige, wir machen, du machst': Beobachte die Spur 55/30/15, hilf bei 30% Sand, 30% Schluff und 40% Ton und trage danach deine drei Ergebnisse ein. Im üblichen USDA-Dreieck liegt der Übungspunkt auf der 40%-Tongrenze des Tonbereichs; prüfe die Grenzkonvention in der gewählten offiziellen Grafik, statt aus dem Wort Ton zu raten. Ein geprüfter USDA-Rechner kann eine erklärte Spur kontrollieren, liefert aber keine Probendaten und beweist keinen eigenen Versuch.", "Prüfe zuerst, ob Sand plus Schluff plus Ton bei angegebener Rundung ungefähr einhundert Prozent ergeben. Suche auf der hier genutzten U Es De A-Grafik fünfundfünfzig Prozent Sand an der unteren Skala und folge der schrägen Linie; suche fünfzehn Prozent Ton links und folge der waagerechten Linie. Prüfe, ob ihr Schnittpunkt auch zu dreißig Prozent Schluff rechts passt. Der Punkt fünfundfünfzig, dreißig, fünfzehn liegt in sandigem Lehm, nicht in sandigem Tonlehm. Folge Pfeilen und gedruckten Skalen der tatsächlichen Grafik, denn andere Darstellungen können Beschriftungen oder Pfeile anders anordnen.\n\nDie Demonstration lautet 'ich zeige, wir machen, du machst': Beobachte die Spur fünfundfünfzig, dreißig, fünfzehn, hilf bei dreißig Prozent Sand, dreißig Prozent Schluff und vierzig Prozent Ton und trage danach deine drei Ergebnisse ein. Im üblichen U Es De A-Dreieck liegt der Übungspunkt auf der vierzig-Prozent-Tongrenze des Tonbereichs; prüfe die Grenzkonvention in der gewählten offiziellen Grafik, statt aus dem Wort Ton zu raten. Ein geprüfter U Es De A-Rechner kann eine erklärte Spur kontrollieren, liefert aber keine Probendaten und beweist keinen eigenen Versuch."), ('Übernimm dieselben drei Probenkennungen, echten Anfangszeiten und letzten Beobachtungen aus dem vorigen Schritt. Prüfe nach dem von der Lehrkraft gewählten Zeitplan, dass das Glas ungestört ist und Boden, Sand-, Schluff- sowie letzte mineralische Grenze sichtbar sind. Schwimmende organische Stoffe ausschließen. Einen undeutlichen Übergang als unklar notieren, statt eine Linie aus einem anderen Glas zu übernehmen.\n\nVerwende durchgehend ein Lineal und Millimeter. Eine Marke, die vom Boden des Glases gemessen wird, ist eine kumulative Höhe. Die Dicke einer Schicht ist der Abstand zwischen ihren beiden Grenzmarken. Liegen die Marken bei 44 mm, 68 mm und 80 mm, dann beträgt Sand 44 mm, Schluff 68 − 44 = 24 mm und Ton 80 − 68 = 12 mm. Die Gesamthöhe ist 80 mm und nicht 44 + 68 + 80 mm.', 'Übernimm dieselben drei Probenkennungen, echten Anfangszeiten und letzten Beobachtungen aus dem vorigen Schritt. Prüfe nach dem von der Lehrkraft gewählten Zeitplan, dass das Glas ungestört ist und Boden, Sand-, Schluff- sowie letzte mineralische Grenze sichtbar sind. Schwimmende organische Stoffe ausschließen. Einen undeutlichen Übergang als unklar notieren, statt eine Linie aus einem anderen Glas zu übernehmen.\n\nVerwende durchgehend ein Lineal und Millimeter. Eine Marke, die vom Boden des Glases gemessen wird, ist eine kumulative Höhe. Die Dicke einer Schicht ist der Abstand zwischen ihren beiden Grenzmarken. Liegen die Marken bei vierundvierzig Millimetern, achtundsechzig Millimetern und achtzig Millimetern, dann beträgt Sand vierundvierzig Millimeter, Schluff achtundsechzig minus vierundvierzig gleich vierundzwanzig Millimeter und Ton achtzig minus achtundsechzig gleich zwölf Millimeter. Die Gesamthöhe ist achtzig Millimeter und nicht vierundvierzig plus achtundsechzig plus achtzig Millimeter.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s212-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':6,'maximumBlindReviewPerLane':6,'maximumASRPerLane':6,'maximumTTSAggregate':24,'maximumBlindAggregate':24,'maximumASRAggregate':24,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
