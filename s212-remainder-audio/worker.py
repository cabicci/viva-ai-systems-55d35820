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
IDS = ('S2-12-ar-EG-opening-r1', 'S2-12-ar-EG-E01-r1', 'S2-12-ar-EG-E02-r1', 'S2-12-ar-EG-E03-r1', 'S2-12-ar-EG-E04-r1', 'S2-12-ar-EG-guided-practice-r1', 'S2-12-ar-EG-reflection-r1', 'S2-12-ar-EG-glossary-r1', 'S2-12-en-opening-r1', 'S2-12-en-E01-r1', 'S2-12-en-E02-r1', 'S2-12-en-E03-r1', 'S2-12-en-E04-r1', 'S2-12-en-guided-practice-r1', 'S2-12-en-reflection-r1', 'S2-12-en-glossary-r1', 'S2-12-it-opening-r1', 'S2-12-it-E01-r1', 'S2-12-it-E02-r1', 'S2-12-it-E03-r1', 'S2-12-it-E04-r1', 'S2-12-it-guided-practice-r1', 'S2-12-it-reflection-r1', 'S2-12-it-glossary-r1', 'S2-12-de-opening-r1', 'S2-12-de-E01-r1', 'S2-12-de-E02-r1', 'S2-12-de-E03-r1', 'S2-12-de-E04-r1', 'S2-12-de-guided-practice-r1', 'S2-12-de-reflection-r1', 'S2-12-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S212_REMAINDER_32_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-12')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s212-remainder-audio-20261023-r1')
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
        exactSourcePointers={'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم البرطمانات التلاتة اللي جهزتهم في الخطوة السابقة بعد ما تتسجل ملاحظتهم النهائية فعلًا. قِس كل طبقة معدنية، واحسب تقديرًا تعليميًا واضح الاسم، وحدد مكان النسب التلاتة على مثلث قوام التربة. برطمان المثال المحلول أو الآلة الحاسبة يعلموك الطريقة، لكن ما يعوضوش قياساتك أنت.\n\nقِس سُمك طبقات الرمل والسلت والطين منفصلة والارتفاع الكلي للطبقات المعدنية بالملليمتر في تلات عينات لها هوية واضحة، وميّز العلامة المقاسة من القاع عن سُمك الطبقة بين علامتين.\n\nاحسب نسبة ارتفاع كل طبقة التقريبية في البرطمان باستخدام الارتفاع الكلي للطبقات المعدنية، واستنتج طبقة أو نسبة ناقصة من مجموع كامل، واشرح مراجعة التقريب.\n\nتتبّع خطوط الرمل والسلت والطين على مثلث USDA ذي التسميات الواضحة وفسر فئة الأمثلة المحلولة، ومنها 55/30/15 تربة لومية رملية؛ استخدم الحاسبة للمراجعة بعد شرح تتبع الخطوط.', 'استخدم البرطمانات التلاتة اللي جهزتهم في الخطوة السابقة بعد ما تتسجل ملاحظتهم النهائية فعلًا. قِس كل طبقة معدنية، واحسب تقدير تعليمي واضح الاسم، وحدد مكان النسب التلاتة على مثلث قوام التربة. برطمان المثال المحلول أو الآلة الحاسبة يعلموك الطريقة، لكن ما يعوضوش قياساتك أنت.\n\nقِس سُمك طبقات الرمل والسلت والطين منفصلة والارتفاع الكلي للطبقات المعدنية بالملليمتر في تلات عينات لها هوية واضحة، وميّز العلامة المقاسة من القاع عن سُمك الطبقة بين علامتين.\n\nاحسب نسبة ارتفاع كل طبقة التقريبية في البرطمان باستخدام الارتفاع الكلي للطبقات المعدنية، واستنتج طبقة أو نسبة ناقصة من مجموع كامل، واشرح مراجعة التقريب.\n\nتتبّع خطوط الرمل والسلت والطين على مثلث يو إس دي إيه ذي التسميات الواضحة وفسر فئة الأمثلة المحلولة، ومنها خمسة وخمسين, تلاتين, خمستاشر تربة لومية رملية؛ استخدم الحاسبة للمراجعة بعد شرح تتبع الخطوط.'), ('الارتفاع التراكمي\n\nالمسافة من مرجع القاع نفسه إلى علامة حد طبقة؛ مش تلقائيًا سُمك الطبقة اللي فوق العلامة السابقة.\n\nسُمك الطبقة\n\nالمسافة بين الحد السفلي والعلوي لطبقة معدنية واحدة بعد الترسيب.\n\nارتفاع الطبقات المعدنية الكلي\n\nالمسافة من القاع لآخر حد طين مترسب، من غير المادة العضوية الطافية.\n\nنسبة ارتفاع طبقة البرطمان\n\nسُمك طبقة معدنية ظاهرة ÷ الارتفاع المعدني الكلي الظاهر ×100؛ تقدير تعليمي تقريبي.\n\nمثلث قوام USDA\n\nرسم يحدد فئة القوام المعدني من نسب الرمل والسلت والطين في جزء التربة الناعم.\n\nلومية رملية\n\nمنطقة قوام USDA اللي فيها نقطة المثال 55% رمل و30% سلت و15% طين.', 'الارتفاع التراكمي\n\nالمسافة من مرجع القاع نفسه إلى علامة حد طبقة؛ مش تلقائيًا سُمك الطبقة اللي فوق العلامة السابقة.\n\nسُمك الطبقة\n\nالمسافة بين الحد السفلي والعلوي لطبقة معدنية واحدة بعد الترسيب.\n\nارتفاع الطبقات المعدنية الكلي\n\nالمسافة من القاع لآخر حد طين مترسب، من غير المادة العضوية الطافية.\n\nنسبة ارتفاع طبقة البرطمان\n\nسُمك طبقة معدنية ظاهرة مقسوم على الارتفاع المعدني الكلي الظاهر مضروب في مية؛ تقدير تعليمي تقريبي.\n\nمثلث قوام يو إس دي إيه\n\nرسم يحدد فئة القوام المعدني من نسب الرمل والسلت والطين في جزء التربة الناعم.\n\nلومية رملية\n\nمنطقة قوام يو إس دي إيه اللي فيها نقطة المثال خمسة وخمسين في المية رمل وتلاتين في المية سلت وخمستاشر في المية طين.'), ('العلامات التراكمية من القاع عند 44 و68 و80 mm.\n\nسُمك الطبقات المنفصلة 44 و24 و12 mm، مش 44 و68 و80 mm.\n\nاقسم كل سُمك على 80 mm: \u200f55% رمل و30% سلت و15% طين؛ مجموع الارتفاعات والنسب مضبوط.\n\nتتبع رمل 55 وطين 15 وتأكد من سلت 30: فئة USDA عند النقطة دي لومية رملية.\n\nقِس سُمك الطبقات واحسب النسب وبعدها تتبع الفئة.', 'العلامات التراكمية من القاع عند أربعة وأربعين وتمانية وستين وتمانين ملليمتر.\n\nسُمك الطبقات المنفصلة أربعة وأربعين وأربعة وعشرين واتناشر ملليمتر، مش أربعة وأربعين وتمانية وستين وتمانين ملليمتر.\n\nاقسم كل سُمك على تمانين ملليمتر: \u200fخمسة وخمسين في المية رمل وتلاتين في المية سلت وخمستاشر في المية طين؛ مجموع الارتفاعات والنسب مضبوط.\n\nتتبع رمل خمسة وخمسين وطين خمستاشر وتأكد من سلت تلاتين: فئة يو إس دي إيه عند النقطة دي لومية رملية.\n\nقِس سُمك الطبقات واحسب النسب وبعدها تتبع الفئة.'), ('الفصل يتتبع معًا 30% رمل و30% سلت و40% طين على مثلث USDA المطبوع.\n\nمجموع القيم 100%.\n\nدور على خط الطين 40% وخط الرمل 30%، واتأكد من السلت 30%.\n\nالرسم القياسي يضع النقطة عند حد منطقة الطين؛ علّمها على الرسم المستخدم وناقش الحد بدل تخمين اسم الفئة.\n\nنقطة الحد تحتاج تتبعًا دقيقًا ومعرفة قاعدة الرسم المحدد.', 'الفصل بيتتبع مع بعض تلاتين في المية رمل وتلاتين في المية سلت وأربعين في المية طين على مثلث يو إس دي إيه المطبوع.\n\nمجموع القيم مية في المية.\n\nدور على خط الطين أربعين في المية وخط الرمل تلاتين في المية، واتأكد من السلت تلاتين في المية.\n\nالرسم القياسي يضع النقطة عند حد منطقة الطين؛ علّمها على الرسم المستخدم وناقش الحد بدل تخمين اسم الفئة.\n\nنقطة الحد محتاجة تتبع دقيق ومعرفة قاعدة الرسم المحدد.'), ('بطاقة التدريب فيها A \u200f65/25/10 وB \u200f40/40/20 وC \u200f15/30/55 بترتيب الرمل والسلت والطين.\n\nلأن كلي كل مثال 100 mm، أرقام ارتفاعاته تساوي أرقام نسب البرطمان التقريبية.\n\nالتتبع يعطي A لومية رملية، وB لومية، وC طينية على مثلث USDA.\n\nدي أمثلة مقدمة للتدريب؛ الطالب لازم يقيس ويوثق برطماناته التلاتة بنفسه.\n\nبيانات التدريب تساعد الاستدلال، مش ادعاء أداء شخصي.', 'بطاقة التدريب فيها إيه \u200fخمسة وستين, خمسة وعشرين, عشرة وبي \u200fأربعين, أربعين, عشرين وسي \u200fخمستاشر, تلاتين, خمسة وخمسين بترتيب الرمل والسلت والطين.\n\nلأن الارتفاع الكلي لكل مثال مية ملليمتر، أرقام ارتفاعاته تساوي أرقام نسب البرطمان التقريبية.\n\nالتتبع يعطي إيه لومية رملية، وبي لومية، وسي طينية على مثلث يو إس دي إيه.\n\nدي أمثلة مقدمة للتدريب؛ الطالب لازم يقيس ويوثق برطماناته التلاتة بنفسه.\n\nبيانات التدريب تساعد الاستدلال، مش ادعاء أداء شخصي.'), ('على برطمان تدريب 3D متاح، حرّك حدود الطبقات الأفقية إلى 44 و68 و80 mm، واكتب السُمك المنفصل واحسب 55/30/15 مع تعقيب واضح. بعدها تتبع النسب على مثلث USDA قابل للتعديل، وصحح رسم التسميات المعكوسة، وتمرّن على حد 30/30/40 وفرز صفوف الأمثلة A/B/C. فيه سجل فاضي مستقل للقياسات الحقيقية تحت إشراف المدرّب.\n\nالمحاكاة أونلاين تدرب على الاستدلال؛ اجتياز C01 يحتاج مشاهدة المدرّب لكل طالب وهو يقيس برطماناته الحقيقية التلاتة.', 'على برطمان تدريب ثلاثي الأبعاد متاح، حرّك حدود الطبقات الأفقية إلى أربعة وأربعين وتمانية وستين وتمانين ملليمتر، واكتب السُمك المنفصل واحسب خمسة وخمسين, تلاتين, خمستاشر مع تعقيب واضح. بعدها تتبع النسب على مثلث يو إس دي إيه قابل للتعديل، وصحح رسم التسميات المعكوسة، وتمرّن على حد تلاتين, تلاتين, أربعين وفرز صفوف الأمثلة إيه، بي، وسي. فيه سجل فاضي مستقل للقياسات الحقيقية تحت إشراف المدرّب.\n\nالمحاكاة أونلاين تدرب على الاستدلال؛ اجتياز المعيار سي صفر واحد يحتاج مشاهدة المدرّب لكل طالب وهو يقيس برطماناته الحقيقية التلاتة.'), ('مثال كلي 100 mm فيه رمل 25 mm وسلت 45 mm، وسُمك الطين ناقص.\n\nسُمك الطبقات المعدنية التلاتة مجموعه 100 mm.\n\nالطين = 100 − 25 − 45 = 30 mm.\n\nنسبة الطين = 30 mm ÷ 100 mm ×100 = 30%.\n\nاحسب سُمك الطبقة الناقصة قبل اختيار النسبة.', 'مثال كلي مية ملليمتر فيه رمل خمسة وعشرين ملليمتر وسلت خمسة وأربعين ملليمتر، وسُمك الطين ناقص.\n\nسُمك الطبقات المعدنية التلاتة مجموعه مية ملليمتر.\n\nالطين بتساوي مية ناقص خمسة وعشرين ناقص خمسة وأربعين بتساوي تلاتين ملليمتر.\n\nنسبة الطين بتساوي تلاتين ملليمتر مقسوم على مية ملليمتر مضروب في مية بتساوي تلاتين في المية.\n\nاحسب سُمك الطبقة الناقصة قبل اختيار النسبة.')], 'en': [('A 100 mm example has 25 mm sand and 45 mm silt. The clay height is missing.\n\nThe three mineral layer thicknesses sum to the 100 mm total.\n\nClay = 100 − 25 − 45 = 30 mm.\n\nClay percentage = 30 mm ÷ 100 mm × 100 = 30%.\n\nFind the missing thickness before computing or choosing the percentage.', 'An example with a total height of one hundred millimetres has twenty-five millimetres sand and forty-five millimetres silt. The clay height is missing.\n\nThe three mineral layer thicknesses sum to the one hundred millimetres total.\n\nClay equals one hundred minus twenty-five minus forty-five equals thirty millimetres.\n\nClay percentage equals thirty millimetres divided by one hundred millimetres multiplied by one hundred equals thirty percent.\n\nFind the missing thickness before computing or choosing the percentage.'), ('Cumulative marks are at 44, 68 and 80 mm from the bottom.\n\nSeparate thicknesses are 44, 24 and 12 mm, not 44, 68 and 80 mm.\n\nDivide each thickness by 80 mm: 55% sand, 30% silt, 15% clay; both height and percent totals balance.\n\nTrace 55 sand and 15 clay, confirm 30 silt: the USDA texture class at this point is sandy loam.\n\nMeasure the thicknesses, calculate their percentages, then trace the class.', 'Cumulative marks are at forty-four, sixty-eight and eighty millimetres from the bottom.\n\nSeparate thicknesses are forty-four, twenty-four and twelve millimetres, not forty-four, sixty-eight and eighty millimetres.\n\nDivide each thickness by eighty millimetres: fifty-five percent sand, thirty percent silt, fifteen percent clay; both height and percent totals balance.\n\nTrace fifty-five sand and fifteen clay, confirm thirty silt: the U S D A texture class at this point is sandy loam.\n\nMeasure the thicknesses, calculate their percentages, then trace the class.'), ('On an accessible 3D teaching jar, drag three horizontal boundary markers to 44, 68 and 80 mm, enter separate thicknesses and calculate 55/30/15 with visible feedback. Then trace those percentages on an editable USDA triangle, correct the reversed-label distractor, practise the 30/30/40 boundary and sort the supplied A/B/C model rows. A distinct blank record is reserved for real supervised measurements.\n\nThe online simulation rehearses reasoning; only observation of each learner measuring three identified real jars can pass C01.', 'On an accessible three dimensional teaching jar, drag three horizontal boundary markers to forty-four, sixty-eight and eighty millimetres, enter separate thicknesses and calculate fifty-five, thirty, fifteen with visible feedback. Then trace those percentages on an editable U S D A triangle, correct the reversed-label distractor, practise the thirty, thirty, forty boundary and sort the supplied A, B, and C model rows. A distinct blank record is reserved for real supervised measurements.\n\nThe online simulation rehearses reasoning; only observation of each learner measuring three identified real jars can pass criterion C zero one.'), ("The class traces 30% sand, 30% silt and 40% clay together on the printed USDA triangle.\n\nThe values total 100%.\n\nFind the 40% clay line and 30% sand line; confirm 30% silt.\n\nThe standard chart places this point on the clay-region threshold. Mark it on the actual chart and discuss the boundary instead of guessing from the word 'clay'.\n\nA boundary point needs careful line tracing and an identified chart convention.", "The class traces thirty percent sand, thirty percent silt and forty percent clay together on the printed U S D A triangle.\n\nThe values total one hundred percent.\n\nFind the forty percent clay line and thirty percent sand line; confirm thirty percent silt.\n\nThe standard chart places this point on the clay-region threshold. Mark it on the actual chart and discuss the boundary instead of guessing from the word 'clay'.\n\nA boundary point needs careful line tracing and an identified chart convention."), ('The practice card lists A 65/25/10, B 40/40/20 and C 15/30/55 in sand/silt/clay order.\n\nBecause each total is 100 mm, the layer heights have the same numeric value as their approximate jar percentages.\n\nTracing gives A sandy loam, B loam and C clay on the USDA triangle.\n\nThese are provided model values; a learner still must measure and document their own three jars.\n\nPractice data support reasoning, not a claim of personal performance.', 'The practice card lists A sixty-five, twenty-five, ten, B forty, forty, twenty and C fifteen, thirty, fifty-five in sand, silt, clay order.\n\nBecause each total is one hundred millimetres, the layer heights have the same numeric value as their approximate jar percentages.\n\nTracing gives A sandy loam, B loam and C clay on the U S D A triangle.\n\nThese are provided model values; a learner still must measure and document their own three jars.\n\nPractice data support reasoning, not a claim of personal performance.'), ("Use the three jars you prepared in the previous step only after their final observation is recorded. Measure each mineral layer, calculate a labelled classroom estimate, and trace the three percentages on a soil texture triangle. A worked jar or a calculator can teach the method, but it cannot replace your own measurements.\n\nMeasure the separate sand, silt and clay layer thicknesses and total mineral-layer height in millimetres for three traceable samples, distinguishing a mark's cumulative height from the thickness between marks.\n\nCalculate each approximate jar-layer percentage using the total mineral-layer height, find a missing layer or percentage from a complete balance, and explain the rounding check.\n\nTrace sand, silt and clay lines on the labelled USDA texture triangle and justify the class of worked cases, including 55/30/15 as sandy loam; use a calculator as a check after explaining the trace.", "Use the three jars you prepared in the previous step only after their final observation is recorded. Measure each mineral layer, calculate a labelled classroom estimate, and trace the three percentages on a soil texture triangle. A worked jar or a calculator can teach the method, but it cannot replace your own measurements.\n\nMeasure the separate sand, silt and clay layer thicknesses and total mineral-layer height in millimetres for three traceable samples, distinguishing a mark's cumulative height from the thickness between marks.\n\nCalculate each approximate jar-layer percentage using the total mineral-layer height, find a missing layer or percentage from a complete balance, and explain the rounding check.\n\nTrace sand, silt and clay lines on the labelled U S D A texture triangle and justify the class of worked cases, including fifty-five, thirty, fifteen as sandy loam; use a calculator as a check after explaining the trace."), ('cumulative height\n\nDistance from the same bottom reference to a boundary mark; not automatically the thickness of the layer above an earlier mark.\n\nlayer thickness\n\nDistance between the lower and upper boundary of one settled mineral layer.\n\ntotal mineral-layer height\n\nDistance from the bottom to the final settled clay boundary, excluding floating organic material.\n\njar-height percentage\n\nOne observed mineral-layer thickness divided by total observed mineral-layer height ×100; an approximate classroom estimate.\n\nUSDA texture triangle\n\nA chart locating a mineral soil textural class from the relative sand, silt and clay percentages of the fine-earth fraction.\n\nsandy loam\n\nThe USDA texture region containing the 55% sand, 30% silt and 15% clay worked point.', 'cumulative height\n\nDistance from the same bottom reference to a boundary mark; not automatically the thickness of the layer above an earlier mark.\n\nlayer thickness\n\nDistance between the lower and upper boundary of one settled mineral layer.\n\ntotal mineral-layer height\n\nDistance from the bottom to the final settled clay boundary, excluding floating organic material.\n\njar-height percentage\n\nOne observed mineral-layer thickness divided by total observed mineral-layer height multiplied by one hundred; an approximate classroom estimate.\n\nU S D A texture triangle\n\nA chart locating a mineral soil textural class from the relative sand, silt and clay percentages of the fine-earth fraction.\n\nsandy loam\n\nThe U S D A texture region containing the fifty-five percent sand, thirty percent silt and fifteen percent clay worked point.')], 'it': [('I segni cumulativi dal fondo sono a 44, 68 e 80 mm.\n\nGli spessori separati sono 44, 24 e 12 mm, non 44, 68 e 80 mm.\n\nDividi ciascuno per 80 mm: 55% sabbia, 30% limo, 15% argilla; tornano sia le altezze sia le percentuali.\n\nTraccia 55 sabbia e 15 argilla, controlla 30 limo: qui la classe USDA è franco sabbioso.\n\nMisura gli spessori, calcola le percentuali e poi traccia la classe.', 'I segni cumulativi dal fondo sono a quarantaquattro, sessantotto e ottanta millimetri.\n\nGli spessori separati sono quarantaquattro, ventiquattro e dodici millimetri, non quarantaquattro, sessantotto e ottanta millimetri.\n\nDividi ciascuno per ottanta millimetri: cinquantacinque per cento sabbia, trenta per cento limo, quindici per cento argilla; tornano sia le altezze sia le percentuali.\n\nTraccia cinquantacinque sabbia e quindici argilla, controlla trenta limo: qui la classe u esse di a è franco sabbioso.\n\nMisura gli spessori, calcola le percentuali e poi traccia la classe.'), ("In un esempio da 100 mm ci sono 25 mm di sabbia e 45 mm di limo. Manca l'argilla.\n\nI tre spessori minerali sommano a 100 mm.\n\nArgilla = 100 − 25 − 45 = 30 mm.\n\nPercentuale di argilla = 30 mm ÷ 100 mm ×100 = 30%.\n\nTrova lo spessore mancante prima di scegliere la percentuale.", "In un esempio da cento millimetri ci sono venticinque millimetri di sabbia e quarantacinque millimetri di limo. Manca l'argilla.\n\nI tre spessori minerali sommano a cento millimetri.\n\nArgilla uguale a cento meno venticinque meno quarantacinque uguale a trenta millimetri.\n\nPercentuale di argilla uguale a trenta millimetri diviso per cento millimetri moltiplicato per cento uguale a trenta per cento.\n\nTrova lo spessore mancante prima di scegliere la percentuale."), ("La classe traccia insieme 30% sabbia, 30% limo e 40% argilla sul triangolo USDA stampato.\n\nI valori sommano a 100%.\n\nTrova la linea del 40% argilla e quella del 30% sabbia; verifica 30% limo.\n\nIl grafico standard pone il punto sulla soglia della regione argillosa. Segnalo sul grafico effettivo e discuti il confine anziché indovinare dal termine 'argilla'.\n\nUn punto di confine richiede tracciamento accurato e una convenzione dichiarata.", "La classe traccia insieme trenta per cento sabbia, trenta per cento limo e quaranta per cento argilla sul triangolo u esse di a stampato.\n\nI valori sommano a cento per cento.\n\nTrova la linea del quaranta per cento argilla e quella del trenta per cento sabbia; verifica trenta per cento limo.\n\nIl grafico standard pone il punto sulla soglia della regione argillosa. Segnalo sul grafico effettivo e discuti il confine anziché indovinare dal termine 'argilla'.\n\nUn punto di confine richiede tracciamento accurato e una convenzione dichiarata."), ("La scheda propone A 65/25/10, B 40/40/20 e C 15/30/55 nell'ordine sabbia/limo/argilla.\n\nCon totale 100 mm, gli spessori hanno lo stesso valore numerico delle percentuali approssimative del barattolo.\n\nIl tracciamento dà A franco sabbioso, B franco e C argilloso sul triangolo USDA.\n\nSono valori di esempio; lo studente deve ancora misurare e documentare i suoi tre barattoli.\n\nI dati di esercizio aiutano a ragionare, non attestano una prestazione personale.", "La scheda propone A sessantacinque, venticinque, dieci, B quaranta, quaranta, venti e C quindici, trenta, cinquantacinque nell'ordine sabbia, limo, argilla.\n\nCon totale cento millimetri, gli spessori hanno lo stesso valore numerico delle percentuali approssimative del barattolo.\n\nIl tracciamento dà A franco sabbioso, B franco e C argilloso sul triangolo u esse di a.\n\nSono valori di esempio; lo studente deve ancora misurare e documentare i suoi tre barattoli.\n\nI dati di esercizio aiutano a ragionare, non attestano una prestazione personale."), ('Su un barattolo didattico 3D accessibile, trascina i tre confini orizzontali a 44, 68 e 80 mm, inserisci gli spessori distinti e calcola 55/30/15 con feedback visibile. Poi traccia quelle percentuali su un triangolo USDA modificabile, correggi il disegno con etichette invertite, esercitati sul limite 30/30/40 e ordina i modelli A/B/C. Un registro vuoto distinto è riservato alle misure reali supervisionate.\n\nLa simulazione online esercita il ragionamento; per superare C01 il formatore deve osservare ciascuno studente mentre misura i propri tre barattoli reali.', 'Su un barattolo didattico tridimensionale accessibile, trascina i tre confini orizzontali a quarantaquattro, sessantotto e ottanta millimetri, inserisci gli spessori distinti e calcola cinquantacinque, trenta, quindici con feedback visibile. Poi traccia quelle percentuali su un triangolo u esse di a modificabile, correggi il disegno con etichette invertite, esercitati sul limite trenta, trenta, quaranta e ordina i modelli A, B e C. Un registro vuoto distinto è riservato alle misure reali supervisionate.\n\nLa simulazione online esercita il ragionamento; per superare criterio ci zero uno il formatore deve osservare ciascuno studente mentre misura i propri tre barattoli reali.'), ("Usa i tre barattoli preparati nel passo precedente soltanto dopo averne registrato l'osservazione finale. Misura ogni strato minerale, calcola una stima didattica dichiarata e colloca le tre percentuali sul triangolo tessiturale. Un esempio svolto o una calcolatrice insegnano il metodo, ma non sostituiscono le tue misure.\n\nMisurare in millimetri gli spessori distinti di sabbia, limo e argilla e l'altezza minerale totale di tre campioni rintracciabili, distinguendo una quota cumulativa dal fondo dallo spessore fra due segni.\n\nCalcolare la percentuale approssimativa di ciascuno strato nel barattolo usando l'altezza minerale totale, ricavare uno strato o una percentuale mancanti da un bilancio completo e spiegare il controllo degli arrotondamenti.\n\nSeguire le linee di sabbia, limo e argilla sul triangolo USDA etichettato e giustificare le classi degli esempi, fra cui 55/30/15 come franco sabbioso; usare una calcolatrice solo per verificare una traccia già spiegata.", "Usa i tre barattoli preparati nel passo precedente soltanto dopo averne registrato l'osservazione finale. Misura ogni strato minerale, calcola una stima didattica dichiarata e colloca le tre percentuali sul triangolo tessiturale. Un esempio svolto o una calcolatrice insegnano il metodo, ma non sostituiscono le tue misure.\n\nMisurare in millimetri gli spessori distinti di sabbia, limo e argilla e l'altezza minerale totale di tre campioni rintracciabili, distinguendo una quota cumulativa dal fondo dallo spessore fra due segni.\n\nCalcolare la percentuale approssimativa di ciascuno strato nel barattolo usando l'altezza minerale totale, ricavare uno strato o una percentuale mancanti da un bilancio completo e spiegare il controllo degli arrotondamenti.\n\nSeguire le linee di sabbia, limo e argilla sul triangolo u esse di a etichettato e giustificare le classi degli esempi, fra cui cinquantacinque, trenta, quindici come franco sabbioso; usare una calcolatrice solo per verificare una traccia già spiegata."), ("altezza cumulativa\n\nDistanza dal medesimo fondo a un segno di confine; non è automaticamente lo spessore sopra il segno precedente.\n\nspessore dello strato\n\nDistanza fra limite inferiore e superiore di uno strato minerale sedimentato.\n\naltezza minerale totale\n\nDistanza dal fondo al confine finale dell'argilla depositata, esclusa la sostanza organica galleggiante.\n\npercentuale di altezza nel barattolo\n\nSpessore minerale osservato diviso per altezza minerale totale osservata ×100; stima didattica approssimativa.\n\ntriangolo tessiturale USDA\n\nGrafico che individua la classe tessiturale minerale dalle proporzioni relative di sabbia, limo e argilla della terra fine.\n\nfranco sabbioso\n\nRegione tessiturale USDA contenente il punto svolto 55% sabbia, 30% limo e 15% argilla.", "altezza cumulativa\n\nDistanza dal medesimo fondo a un segno di confine; non è automaticamente lo spessore sopra il segno precedente.\n\nspessore dello strato\n\nDistanza fra limite inferiore e superiore di uno strato minerale sedimentato.\n\naltezza minerale totale\n\nDistanza dal fondo al confine finale dell'argilla depositata, esclusa la sostanza organica galleggiante.\n\npercentuale di altezza nel barattolo\n\nSpessore minerale osservato diviso per altezza minerale totale osservata moltiplicato per cento; stima didattica approssimativa.\n\ntriangolo tessiturale u esse di a\n\nGrafico che individua la classe tessiturale minerale dalle proporzioni relative di sabbia, limo e argilla della terra fine.\n\nfranco sabbioso\n\nRegione tessiturale u esse di a contenente il punto svolto cinquantacinque per cento sabbia, trenta per cento limo e quindici per cento argilla.")], 'de': [('Die Klasse verfolgt gemeinsam 30% Sand, 30% Schluff und 40% Ton im gedruckten USDA-Dreieck.\n\nDie Werte ergeben 100%.\n\nSuche die 40%-Tonlinie und 30%-Sandlinie und kontrolliere 30% Schluff.\n\nDie übliche Grafik platziert den Punkt an der Grenze des Tonbereichs. Zeichne ihn auf der tatsächlich verwendeten Grafik ein und besprich die Grenze, statt aus dem Wort Ton zu raten.\n\nEin Grenzpunkt braucht sorgfältige Linienführung und die festgelegte Grafikkonvention.', 'Die Klasse verfolgt gemeinsam dreißig Prozent Sand, dreißig Prozent Schluff und vierzig Prozent Ton im gedruckten U Es De A-Dreieck.\n\nDie Werte ergeben einhundert Prozent.\n\nSuche die vierzig Prozent-Tonlinie und dreißig Prozent-Sandlinie und kontrolliere dreißig Prozent Schluff.\n\nDie übliche Grafik platziert den Punkt an der Grenze des Tonbereichs. Zeichne ihn auf der tatsächlich verwendeten Grafik ein und besprich die Grenze, statt aus dem Wort Ton zu raten.\n\nEin Grenzpunkt braucht sorgfältige Linienführung und die festgelegte Grafikkonvention.'), ('Die Übungskarte nennt A 65/25/10, B 40/40/20 und C 15/30/55 in der Reihenfolge Sand/Schluff/Ton.\n\nBei je 100 mm Gesamthöhe entsprechen die numerischen Schichthöhen den ungefähren Glas-Prozenten.\n\nDas Dreieck ergibt A sandigen Lehm, B Lehm und C Ton.\n\nDiese Werte sind vorgegeben; Lernende müssen ihre eigenen drei Gläser weiterhin messen und dokumentieren.\n\nÜbungsdaten fördern das Denken, sind kein Nachweis eigener Praxis.', 'Die Übungskarte nennt A fünfundsechzig, fünfundzwanzig, zehn, B vierzig, vierzig, zwanzig und C fünfzehn, dreißig, fünfundfünfzig in der Reihenfolge Sand, Schluff, Ton.\n\nBei je einhundert Millimetern Gesamthöhe entsprechen die numerischen Schichthöhen den ungefähren Glas-Prozenten.\n\nDas Dreieck ergibt A sandigen Lehm, B Lehm und C Ton.\n\nDiese Werte sind vorgegeben; Lernende müssen ihre eigenen drei Gläser weiterhin messen und dokumentieren.\n\nÜbungsdaten fördern das Denken, sind kein Nachweis eigener Praxis.'), ('Ein Beispiel mit 100 mm Gesamthöhe enthält 25 mm Sand und 45 mm Schluff. Die Tonhöhe fehlt.\n\nDie drei mineralischen Schichtdicken ergeben zusammen 100 mm.\n\nTon = 100 − 25 − 45 = 30 mm.\n\nTonanteil = 30 mm ÷ 100 mm ×100 = 30%.\n\nErmittle die fehlende Dicke, bevor du einen Prozentwert wählst.', 'Ein Beispiel mit einhundert Millimetern Gesamthöhe enthält fünfundzwanzig Millimeter Sand und fünfundvierzig Millimeter Schluff. Die Tonhöhe fehlt.\n\nDie drei mineralischen Schichtdicken ergeben zusammen einhundert Millimeter.\n\nTon gleich einhundert minus fünfundzwanzig minus fünfundvierzig gleich dreißig Millimeter.\n\nTonanteil gleich dreißig Millimeter geteilt durch einhundert Millimeter mal einhundert gleich dreißig Prozent.\n\nErmittle die fehlende Dicke, bevor du einen Prozentwert wählst.'), ('Kumulative Marken liegen bei 44, 68 und 80 mm vom Boden.\n\nGetrennte Schichtdicken sind 44, 24 und 12 mm, nicht 44, 68 und 80 mm.\n\nTeile jede Dicke durch 80 mm: 55% Sand, 30% Schluff, 15% Ton; Höhen und Prozente summieren sich richtig.\n\nVerfolge 55 Sand und 15 Ton und kontrolliere 30 Schluff: Die USDA-Klasse hier ist sandiger Lehm.\n\nErst Dicken messen, dann Prozente berechnen und schließlich die Klasse verfolgen.', 'Kumulative Marken liegen bei vierundvierzig, achtundsechzig und achtzig Millimetern vom Boden.\n\nGetrennte Schichtdicken sind vierundvierzig, vierundzwanzig und zwölf Millimeter, nicht vierundvierzig, achtundsechzig und achtzig Millimeter.\n\nTeile jede Dicke durch achtzig Millimeter: fünfundfünfzig Prozent Sand, dreißig Prozent Schluff, fünfzehn Prozent Ton; Höhen und Prozente summieren sich richtig.\n\nVerfolge fünfundfünfzig Sand und fünfzehn Ton und kontrolliere dreißig Schluff: Die U Es De A-Klasse hier ist sandiger Lehm.\n\nErst Dicken messen, dann Prozente berechnen und schließlich die Klasse verfolgen.'), ('Nutze die drei Gläser aus dem vorigen Schritt erst, wenn ihre letzte tatsächliche Beobachtung dokumentiert ist. Miss jede Mineralschicht, berechne eine klar bezeichnete Unterrichtsschätzung und trage die drei Prozentwerte in ein Bodentexturdreieck ein. Ein durchgerechnetes Beispiel oder ein Rechner vermittelt das Verfahren, ersetzt aber keine eigenen Messungen.\n\nDie getrennten Dicken von Sand-, Schluff- und Tonschicht sowie die gesamte Mineralschichthöhe an drei nachvollziehbaren Proben in Millimetern messen; eine kumulative Markenhöhe von der Dicke zwischen Marken unterscheiden.\n\nDie ungefähren Glas-Schichtprozente aus der gesamten Mineralschichthöhe berechnen, fehlende Schicht oder fehlenden Prozentwert aus einer vollständigen Bilanz ableiten und die Rundungsprüfung erklären.\n\nSand-, Schluff- und Tonlinien im beschrifteten USDA-Texturdreieck verfolgen und die Klassen der Beispiele begründen, darunter 55/30/15 als sandiger Lehm; einen Rechner erst nach Erklärung der Linien zur Kontrolle verwenden.', 'Nutze die drei Gläser aus dem vorigen Schritt erst, wenn ihre letzte tatsächliche Beobachtung dokumentiert ist. Miss jede Mineralschicht, berechne eine klar bezeichnete Unterrichtsschätzung und trage die drei Prozentwerte in ein Bodentexturdreieck ein. Ein durchgerechnetes Beispiel oder ein Rechner vermittelt das Verfahren, ersetzt aber keine eigenen Messungen.\n\nDie getrennten Dicken von Sand-, Schluff- und Tonschicht sowie die gesamte Mineralschichthöhe an drei nachvollziehbaren Proben in Millimetern messen; eine kumulative Markenhöhe von der Dicke zwischen Marken unterscheiden.\n\nDie ungefähren Glas-Schichtprozente aus der gesamten Mineralschichthöhe berechnen, fehlende Schicht oder fehlenden Prozentwert aus einer vollständigen Bilanz ableiten und die Rundungsprüfung erklären.\n\nSand-, Schluff- und Tonlinien im beschrifteten U Es De A-Texturdreieck verfolgen und die Klassen der Beispiele begründen, darunter fünfundfünfzig, dreißig, fünfzehn als sandiger Lehm; einen Rechner erst nach Erklärung der Linien zur Kontrolle verwenden.'), ('Verschiebe an einem zugänglichen 3D-Unterrichtsglas drei waagerechte Grenzmarken auf 44, 68 und 80 mm, trage die einzelnen Dicken ein und berechne 55/30/15 mit sichtbarer Rückmeldung. Verfolge die Werte dann auf einem editierbaren USDA-Dreieck, korrigiere die vertauschten Schichtbezeichnungen, übe den Grenzpunkt 30/30/40 und sortiere die A/B/C-Modelle. Ein eigenes leeres Formular ist für echte beaufsichtigte Messungen vorgesehen.\n\nDie Online-Simulation übt das Denken; C01 verlangt Beobachtung jeder lernenden Person beim Messen ihrer drei echten Gläser durch die Lehrkraft.', 'Verschiebe an einem zugänglichen dreidimensionalen Unterrichtsglas drei waagerechte Grenzmarken auf vierundvierzig, achtundsechzig und achtzig Millimeter, trage die einzelnen Dicken ein und berechne fünfundfünfzig, dreißig, fünfzehn mit sichtbarer Rückmeldung. Verfolge die Werte dann auf einem editierbaren U Es De A-Dreieck, korrigiere die vertauschten Schichtbezeichnungen, übe den Grenzpunkt dreißig, dreißig, vierzig und sortiere die A, B und C-Modelle. Ein eigenes leeres Formular ist für echte beaufsichtigte Messungen vorgesehen.\n\nDie Online-Simulation übt das Denken; Kriterium Ce null eins verlangt Beobachtung jeder lernenden Person beim Messen ihrer drei echten Gläser durch die Lehrkraft.'), ('kumulative Höhe\n\nAbstand vom gleichen Bodenbezug zu einer Grenzmarke; nicht automatisch die Dicke einer Schicht oberhalb einer früheren Marke.\n\nSchichtdicke\n\nAbstand zwischen unterer und oberer Grenze einer abgesetzten Mineralschicht.\n\ngesamte Mineralschichthöhe\n\nAbstand vom Boden bis zur letzten abgesetzten Tongrenze ohne schwimmende organische Stoffe.\n\nGlas-Höhenprozent\n\nBeobachtete Dicke einer Mineralschicht geteilt durch die gesamte beobachtete Mineralhöhe ×100; ungefähre Unterrichtsschätzung.\n\nUSDA-Texturdreieck\n\nGrafik, die aus relativen Sand-, Schluff- und Tonanteilen der Feinerde eine mineralische Texturklasse bestimmt.\n\nsandiger Lehm\n\nUSDA-Texturregion mit dem Beispielpunkt 55% Sand, 30% Schluff und 15% Ton.', 'kumulative Höhe\n\nAbstand vom gleichen Bodenbezug zu einer Grenzmarke; nicht automatisch die Dicke einer Schicht oberhalb einer früheren Marke.\n\nSchichtdicke\n\nAbstand zwischen unterer und oberer Grenze einer abgesetzten Mineralschicht.\n\ngesamte Mineralschichthöhe\n\nAbstand vom Boden bis zur letzten abgesetzten Tongrenze ohne schwimmende organische Stoffe.\n\nGlas-Höhenprozent\n\nBeobachtete Dicke einer Mineralschicht geteilt durch die gesamte beobachtete Mineralhöhe mal einhundert; ungefähre Unterrichtsschätzung.\n\nU Es De A-Texturdreieck\n\nGrafik, die aus relativen Sand-, Schluff- und Tonanteilen der Feinerde eine mineralische Texturklasse bestimmt.\n\nsandiger Lehm\n\nU Es De A-Texturregion mit dem Beispielpunkt fünfundfünfzig Prozent Sand, dreißig Prozent Schluff und fünfzehn Prozent Ton.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s212-remainder-audio-20261023-r1'
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
