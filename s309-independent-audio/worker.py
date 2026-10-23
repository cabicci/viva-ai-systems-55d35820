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
IDS = ('S3-09-ar-EG-opening-r1', 'S3-09-ar-EG-guided-practice-r1', 'S3-09-ar-EG-reflection-r1', 'S3-09-ar-EG-glossary-r1', 'S3-09-en-opening-r1', 'S3-09-en-guided-practice-r1', 'S3-09-en-reflection-r1', 'S3-09-en-glossary-r1', 'S3-09-it-opening-r1', 'S3-09-it-guided-practice-r1', 'S3-09-it-reflection-r1', 'S3-09-it-glossary-r1', 'S3-09-de-opening-r1', 'S3-09-de-guided-practice-r1', 'S3-09-de-reflection-r1', 'S3-09-de-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==16
    assert(req['scope'],req['stepId'])==('S309_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s309-independent-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==16
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allSixteenCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(4))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening','guided-practice','reflection','glossary']
        voice='Charon'if group in ['opening','reflection']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1', '/glossary/11/0', '/glossary/11/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم أدلة القطعة اللي قرأتها في الخطوة السابقة واعمل خطة من صفحة واحدة: المشكلة، والفحص المطلوب، والتدخل المشروط، وليه اخترته، وإزاي هتعرف نتيجته. هنحتفظ بأمثلة الأصل وأرقامه من غير ما نحولها لجرعات جاهزة لحقل حقيقي.\n\nشخّص ثلاث قضايا بناءً على بيانات قطعة ١٠×١٠ متر، ورتّب الفحوص وقرار الماء والصرف والمحسنات في خطة صفحة واحدة؛ الكمبوست وحده مش بديل لإدارة الملح.\n\nقارن الكمبوست والسماد البلدي المعتّق والفحم الحيوي والملش ومصدات الرياح ومحاصيل التغطية وإدارة الماء؛ اذكر الفايدة والكلفة والحدود من غير جرعة غير متحقَّق منها.\n\nاختار محصولين مرشحين، ووضح تحمل الجفاف وتحمل الملح كل واحد لوحده، وافحص طريقة ECe المناسبة والصنف ومرحلة تأسيس المحصول ومياه الري والجدوى قبل قرار زراعة فعلي.', 'استخدم أدلة القطعة اللي قرأتها في الخطوة السابقة واعمل خطة من صفحة واحدة: المشكلة، والفحص المطلوب، والتدخل المشروط، وليه اخترته، وإزاي هتعرف نتيجته. هنحتفظ بأمثلة الأصل وأرقامه من غير ما نحولها لجرعات جاهزة لحقل حقيقي.\n\nشخّص ثلاث قضايا بناءً على بيانات قطعة عشرة مضروب في عشرة متر، ورتّب الفحوص وقرار الماء والصرف والمحسنات في خطة صفحة واحدة؛ الكمبوست وحده مش بديل لإدارة الملح.\n\nقارن الكمبوست والسماد البلدي المعتّق والفحم الحيوي والملش ومصدات الرياح ومحاصيل التغطية وإدارة الماء؛ اذكر الفايدة والتكلفة والحدود من غير جرعة غير متحقَّق منها.\n\nاختار محصولين مرشحين، ووضح تحمل الجفاف وتحمل الملح كل واحد لوحده، وافحص طريقة إي سي إي المناسبة والصنف ومرحلة تأسيس المحصول ومياه الري والجدوى قبل قرار زراعة فعلي.'), ('خطة تحسين الأرض\n\nتسلسل يناسب الموقع ويربط الدليل بالتدخل والسبب والمتابعة.\n\nمحسن عضوي\n\nمادة مضافة مثل كمبوست مناسب أو سماد بلدي معتّق أو فحم حيوي؛ تركيبها وأملاحها ومعدلها يحتاجوا فحصًا.\n\nفحم حيوي\n\nمادة غنية بالكربون من تسخين كتلة حيوية بقليل من الأكسجين؛ أثرها يتغير بالمادة الخام والتصنيع والتربة والجرعة.\n\nملش\n\nغطاء للسطح مثل القش أو رقائق الخشب أو الحصى يؤثر في البخر والحرارة والحشائش أو التعرية.\n\nمصد رياح\n\nحاجز نباتي مخطط لتقليل سرعة الريح والتعرية، وقد ينافس النبات على الماء والضوء والمساحة.\n\nمحصول تغطية\n\nمحصول يُزرع أساسًا لحماية السطح وأثره على التربة، مش للحصاد الرئيسي؛ يحتاج ماء وملاءمة محلية.\n\nغسل الأملاح\n\nتحريك الملح الذائب أسفل منطقة الجذور بماء مناسب ومخرج صرف شغال.\n\nECe\n\nتوصيل مستخلص عجينة تربة مشبعة؛ قارنه فقط بجدول بنفس الطريقة والوحدة.\n\nECw\n\nتوصيل ماء الري، وهو مختلف عن ECe للتربة.\n\nنبات ملحي\n\nنبات متكيف طبيعيًا مع ملوحة قوية؛ المحصول التقليدي المتحمل نسبيًا مش بالضرورة نباتًا ملحيًا.\n\nصنف\n\nصنف مختار من المحصول وقد تختلف استجابته عن أصناف النبات نفسه.\n\nأصل جذري\n\nالنبات المجذّر اللي يركّب عليه طُعم شجرة فاكهة؛ ممكن يغيّر استجابة الفستق للملوحة وغيرها.', 'خطة تحسين الأرض\n\nتسلسل يناسب الموقع ويربط الدليل بالتدخل والسبب والمتابعة.\n\nمحسن عضوي\n\nمادة مضافة مثل كمبوست مناسب أو سماد بلدي معتّق أو فحم حيوي؛ تركيبها وأملاحها ومعدلها يحتاجوا فحصًا.\n\nفحم حيوي\n\nمادة غنية بالكربون من تسخين كتلة حيوية بقليل من الأكسجين؛ أثرها يتغير بالمادة الخام والتصنيع والتربة والجرعة.\n\nملش\n\nغطاء للسطح مثل القش أو رقائق الخشب أو الحصى يؤثر في البخر والحرارة والحشائش أو التعرية.\n\nمصد رياح\n\nحاجز نباتي مخطط لتقليل سرعة الريح والتعرية، وقد ينافس النبات على الماء والضوء والمساحة.\n\nمحصول تغطية\n\nمحصول يُزرع أساسًا لحماية السطح وأثره على التربة، مش للحصاد الرئيسي؛ يحتاج ماء وملاءمة محلية.\n\nغسل الأملاح\n\nتحريك الملح الذائب أسفل منطقة الجذور بماء مناسب ومخرج صرف شغال.\n\nإي سي إي\n\nتوصيل مستخلص عجينة تربة مشبعة؛ قارنه فقط بجدول بنفس الطريقة والوحدة.\n\nإي سي دبليو\n\nتوصيل ماء الري، وهو مختلف عن إي سي إي للتربة.\n\nنبات ملحي\n\nنبات متكيف طبيعيًا مع ملوحة قوية؛ المحصول التقليدي المتحمل نسبيًا مش بالضرورة نبات ملحي.\n\nصنف\n\nصنف مختار من المحصول وقد تختلف استجابته عن أصناف النبات نفسه.\n\nأصل جذري\n\nالنبات المجذّر اللي يركّب عليه طُعم شجرة فاكهة؛ ممكن يغيّر استجابة الفستق للملوحة وغيرها.'), ('في ٥ دقائق، اكتب ثلاث قضايا في القطعة؛ لكل واحدة الدليل المقاس أو الطريقة الناقصة وتأثيرًا على المحصول. احفظ ١٠ م × ١٠ م و٠٫٨٪ و٣٫٥ dS/m ووصف البئر.\n\nفي ١٠ دقائق رتّب الفحوص وقرار الماء/الصرف وفحص المحسن وإدارة السطح والمتابعة. قارن ثلاث تقنيات مختلفة على الأقل واشرح ليه أعماق طبقات نموذج المدرّس اقتراحات مش جرعة للموقع.\n\nفي ٥ دقائق اختار محصولين من قوائم الأصل. لكل محصول جملة لملاءمة الجفاف وجملة لتحمل الملح، واذكر معلومة موقع أو صنف أو مرحلة نمو ناقصة.\n\nفي آخر ٥ دقايق للمناقشة كلها، مجموعتين أو تلاتة بيعرضوا خطط الصفحة الواحدة. رد على سؤال نقدي من زميل عن الميه أو كمية المحسن أو اختيار المحصول. جاوب سؤال الخروج الأصلي عن المادة العضوية وفايدتين ليها، ووضح إيه اللي الإجابة دي ما تثبتوش.\n\nفرّق بين قيمة مقاسة وتفسيرها؛ ما تسمّيش ٣٫٥ «متوسطة الملوحة» من غير طريقة القياس.\n\nده تدريب أونلاين على التخطيط. لسه بيانات طريقة استخلاص التربة، وكيمياء الميه، والصرف، وتحليل المواد، وظروف المحاصيل ناقصة. حفظ الكلام أو ملء النموذج كله مش موافقة على معدل إضافة، ولا ضمان لإنتاجية المحصول، ولا اجتياز عملي.', 'في خمس دقايق، اكتب ثلاث قضايا في القطعة؛ لكل واحدة الدليل المقاس أو الطريقة الناقصة وتأثيرًا على المحصول. احفظ عشرة متر مضروب في عشرة متر وصفر فاصلة تمانية في المية وتلاتة فاصلة خمسة ديسي سيمنز لكل متر ووصف البئر.\n\nفي عشر دقايق رتّب الفحوص وقرار الماء، الصرف وفحص المحسن وإدارة السطح والمتابعة. قارن ثلاث تقنيات مختلفة على الأقل واشرح ليه أعماق طبقات نموذج المدرّس اقتراحات مش جرعة للموقع.\n\nفي خمس دقايق اختار محصولين من قوائم الأصل. لكل محصول جملة لملاءمة الجفاف وجملة لتحمل الملح، واذكر معلومة موقع أو صنف أو مرحلة نمو ناقصة.\n\nفي آخر خمسة دقايق للمناقشة كلها، مجموعتين أو تلاتة بيعرضوا خطط الصفحة الواحدة. رد على سؤال نقدي من زميل عن الميه أو كمية المحسن أو اختيار المحصول. جاوب سؤال الخروج الأصلي عن المادة العضوية وفايدتين ليها، ووضح إيه اللي الإجابة دي ما تثبتوش.\n\nفرّق بين قيمة مقاسة وتفسيرها؛ ما تسمّيش تلاتة فاصلة خمسة «متوسطة الملوحة» من غير طريقة القياس.\n\nده تدريب أونلاين على التخطيط. لسه بيانات طريقة استخلاص التربة، وكيمياء الميه، والصرف، وتحليل المواد، وظروف المحاصيل ناقصة. حفظ الكلام أو ملء النموذج كله مش موافقة على معدل إضافة، ولا ضمان لإنتاجية المحصول، ولا اجتياز عملي.')], 'en': [("In 5 minutes list three site concerns, their measured evidence or missing method, and one crop impact each. Keep 10 m × 10 m, 0.8%, 3.5 dS/m and borewell description intact.\n\nIn 10 minutes sequence tests, water/drainage decision, amendment-quality check, surface management and follow-up measurement. Compare at least three distinct techniques and explain why the teacher's layer depths are proposals rather than a site dose.\n\nIn 5 minutes choose two of the source crops and write one sentence for drought fit and one for salt fit for each, plus one missing site, cultivar or growth-stage datum.\n\nDuring the final five-minute discussion phase in total, two or three groups share the one-page plan. Answer a peer challenge about water, amendment amount or crop choice. Complete the original exit ticket on organic matter and two benefits, then state what that answer does not prove.\n\nSeparate measured values from interpretations; do not call 3.5 moderately saline before method is known.\n\nOnline planning practice. Soil extraction, water chemistry, drainage, material analysis and crop conditions remain incomplete. Saved words or a complete form do not approve an application rate, crop yield or practical pass.", "In five minutes list three site concerns, their measured evidence or missing method, and one crop impact each. Keep ten metres multiplied by ten metres, zero point eight percent, three point five decisiemens per metre and borewell description intact.\n\nIn ten minutes sequence tests, water, drainage decision, amendment-quality check, surface management and follow-up measurement. Compare at least three distinct techniques and explain why the teacher's layer depths are proposals rather than a site dose.\n\nIn five minutes choose two of the source crops and write one sentence for drought fit and one for salt fit for each, plus one missing site, cultivar or growth-stage datum.\n\nDuring the final five-minute discussion phase in total, two or three groups share the one-page plan. Answer a peer challenge about water, amendment amount or crop choice. Complete the original exit ticket on organic matter and two benefits, then state what that answer does not prove.\n\nSeparate measured values from interpretations; do not call three point five moderately saline before method is known.\n\nOnline planning practice. Soil extraction, water chemistry, drainage, material analysis and crop conditions remain incomplete. Saved words or a complete form do not approve an application rate, crop yield or practical pass."), ('Use the measured plot evidence from the previous step to write a one-page plan. A useful plan links each concern to a test, an intervention, a reason and a check of whether the intervention worked. It keeps the original class activity and crop lists while refusing to invent a site-specific dose.\n\nDiagnose three evidence-based concerns in the 10 m × 10 m plot and sequence tests, drainage/water decisions and amendments in a one-page plan rather than treating compost as a substitute for salt management.\n\nCompare compost, aged manure, biochar, mulch, windbreaks, cover crops and water-management options, explaining benefits, costs and site limits without prescribing an unverified rate.\n\nChoose two candidate crops, justify drought and salt tolerance separately, and check method-matched ECe, cultivar, establishment stage, irrigation water and economics before a real planting decision.', 'Use the measured plot evidence from the previous step to write a one-page plan. A useful plan links each concern to a test, an intervention, a reason and a check of whether the intervention worked. It keeps the original class activity and crop lists while refusing to invent a site-specific dose.\n\nDiagnose three evidence-based concerns in the ten metres multiplied by ten metres plot and sequence tests, drainage, water decisions and amendments in a one-page plan rather than treating compost as a substitute for salt management.\n\nCompare compost, aged manure, biochar, mulch, windbreaks, cover crops and water-management options, explaining benefits, costs and site limits without prescribing an unverified rate.\n\nChoose two candidate crops, justify drought and salt tolerance separately, and check method-matched E C e, cultivar, establishment stage, irrigation water and economics before a real planting decision.'), ('rehabilitation plan\n\nA site-specific sequence connecting evidence, action, reason and follow-up observation.\n\norganic amendment\n\nAn added material such as suitable compost, aged manure or biochar; composition, salts and rate need separate assessment.\n\nbiochar\n\nCarbon-rich material made by heating biomass with limited oxygen; effects depend on feedstock, processing, soil and rate.\n\nmulch\n\nSurface cover such as straw, wood chips or gravel used to influence evaporation, temperature, weeds or erosion.\n\nwindbreak\n\nA vegetation barrier planned to reduce wind speed and erosion, with possible water, light and land competition.\n\ncover crop\n\nA crop grown primarily for ground cover and soil effects rather than the main harvest; it still needs water and local suitability.\n\nleaching\n\nDissolved salt movement below the root zone with suitable water and a functioning drainage outlet.\n\nECe\n\nElectrical conductivity of a saturated soil-paste extract; compare only with a table using the same method and units.\n\nECw\n\nElectrical conductivity of irrigation water, different from soil ECe.\n\nhalophyte\n\nA plant naturally adapted to strongly saline environments; a conventional crop with some salt tolerance is not automatically one.\n\ncultivar\n\nA selected crop variety whose response may differ from other varieties of the same species.\n\nrootstock\n\nThe rooted plant onto which a fruit-tree scion is grafted; it can change pistachio responses to salinity and other conditions.', 'rehabilitation plan\n\nA site-specific sequence connecting evidence, action, reason and follow-up observation.\n\norganic amendment\n\nAn added material such as suitable compost, aged manure or biochar; composition, salts and rate need separate assessment.\n\nbiochar\n\nCarbon-rich material made by heating biomass with limited oxygen; effects depend on feedstock, processing, soil and rate.\n\nmulch\n\nSurface cover such as straw, wood chips or gravel used to influence evaporation, temperature, weeds or erosion.\n\nwindbreak\n\nA vegetation barrier planned to reduce wind speed and erosion, with possible water, light and land competition.\n\ncover crop\n\nA crop grown primarily for ground cover and soil effects rather than the main harvest; it still needs water and local suitability.\n\nleaching\n\nDissolved salt movement below the root zone with suitable water and a functioning drainage outlet.\n\nE C e\n\nElectrical conductivity of a saturated soil-paste extract; compare only with a table using the same method and units.\n\nE C w\n\nElectrical conductivity of irrigation water, different from soil E C e.\n\nhalophyte\n\nA plant naturally adapted to strongly saline environments; a conventional crop with some salt tolerance is not automatically one.\n\ncultivar\n\nA selected crop variety whose response may differ from other varieties of the same species.\n\nrootstock\n\nThe rooted plant onto which a fruit-tree scion is grafted; it can change pistachio responses to salinity and other conditions.')], 'it': [('In 5 minuti elenca tre problemi del sito, per ciascuno la misura o il metodo mancante e un effetto sulla coltura. Mantieni 10 m × 10 m, 0,8%, 3,5 dS/m e la descrizione del pozzo.\n\nIn 10 minuti ordina analisi, acqua/drenaggio, controllo dell’ammendante, gestione della superficie e nuova misura. Confronta almeno tre tecniche distinte e spiega perché gli spessori del docente sono proposte, non dosi locali.\n\nIn 5 minuti scegli due colture elencate nell’originale: per ciascuna scrivi una frase sulla siccità, una sul sale e un dato mancante su sito, cultivar o fase.\n\nNegli ultimi cinque minuti complessivi di discussione, due o tre gruppi presentano il piano di una pagina. Rispondi a un’obiezione su acqua, quantità dell’ammendante o colture. Completa la domanda finale originale sulla sostanza organica e due benefici, poi indica che cosa questa risposta non dimostra.\n\nDistingui valori misurati da interpretazioni; non chiamare 3,5 «moderatamente salino» senza il metodo.\n\nEsercitazione online di pianificazione. Mancano ancora dati sul metodo di estrazione del suolo, sulla chimica dell’acqua, sul drenaggio, sull’analisi dei materiali e sulle condizioni delle colture. Il testo salvato o un modulo completo non approvano una dose, non garantiscono una resa e non attestano il superamento di una prova pratica.', 'In cinque minuti elenca tre problemi del sito, per ciascuno la misura o il metodo mancante e un effetto sulla coltura. Mantieni dieci metri moltiplicato per dieci metri, zero virgola otto per cento, tre virgola cinque decisiemens per metro e la descrizione del pozzo.\n\nIn dieci minuti ordina analisi, acqua, drenaggio, controllo dell’ammendante, gestione della superficie e nuova misura. Confronta almeno tre tecniche distinte e spiega perché gli spessori del docente sono proposte, non dosi locali.\n\nIn cinque minuti scegli due colture elencate nell’originale: per ciascuna scrivi una frase sulla siccità, una sul sale e un dato mancante su sito, cultivar o fase.\n\nNegli ultimi cinque minuti complessivi di discussione, due o tre gruppi presentano il piano di una pagina. Rispondi a un’obiezione su acqua, quantità dell’ammendante o colture. Completa la domanda finale originale sulla sostanza organica e due benefici, poi indica che cosa questa risposta non dimostra.\n\nDistingui valori misurati da interpretazioni; non chiamare tre virgola cinque «moderatamente salino» senza il metodo.\n\nEsercitazione online di pianificazione. Mancano ancora dati sul metodo di estrazione del suolo, sulla chimica dell’acqua, sul drenaggio, sull’analisi dei materiali e sulle condizioni delle colture. Il testo salvato o un modulo completo non approvano una dose, non garantiscono una resa e non attestano il superamento di una prova pratica.'), ('Usa le misure dell’appezzamento esaminate nel passo precedente per redigere un piano di una pagina. Collega ogni problema a una verifica, a un intervento condizionato, alla motivazione e a una misura successiva. Conserva esempi e quantità originali senza trasformarli in dosi valide per qualsiasi campo.\n\nDiagnosticare tre problemi fondati sui dati dell’appezzamento di 10 m × 10 m e ordinare verifiche, decisioni su acqua e drenaggio e ammendanti in un piano di una pagina, senza usare il compost come sostituto della gestione del sale.\n\nConfrontare compost, letame ben maturo, biochar, pacciamatura, frangivento, colture di copertura e gestione idrica, motivando benefici, costi e limiti senza prescrivere una dose non verificata.\n\nScegliere due colture candidate, motivare separatamente tolleranza alla siccità e al sale e verificare ECe misurata con metodo adatto, cultivar, fase di attecchimento, acqua irrigua e sostenibilità economica prima di piantare davvero.', 'Usa le misure dell’appezzamento esaminate nel passo precedente per redigere un piano di una pagina. Collega ogni problema a una verifica, a un intervento condizionato, alla motivazione e a una misura successiva. Conserva esempi e quantità originali senza trasformarli in dosi valide per qualsiasi campo.\n\nDiagnosticare tre problemi fondati sui dati dell’appezzamento di dieci metri moltiplicato per dieci metri e ordinare verifiche, decisioni su acqua e drenaggio e ammendanti in un piano di una pagina, senza usare il compost come sostituto della gestione del sale.\n\nConfrontare compost, letame ben maturo, biochar, pacciamatura, frangivento, colture di copertura e gestione idrica, motivando benefici, costi e limiti senza prescrivere una dose non verificata.\n\nScegliere due colture candidate, motivare separatamente tolleranza alla siccità e al sale e verificare e ci e misurata con metodo adatto, cultivar, fase di attecchimento, acqua irrigua e sostenibilità economica prima di piantare davvero.'), ('piano di miglioramento\n\nSequenza specifica per un sito che collega prove, intervento, motivo e controllo.\n\nammendante organico\n\nMateriale aggiunto come compost idoneo, letame maturo o biochar; composizione, sali e dose vanno verificati.\n\nbiochar\n\nMateriale ricco di carbonio ottenuto riscaldando biomassa con poco ossigeno; effetti dipendono da biomassa, processo, suolo e dose.\n\npacciamatura\n\nCopertura superficiale, per esempio paglia, cippato o ghiaia, che può influire su evaporazione, temperatura, infestanti o erosione.\n\nfrangivento\n\nBarriera vegetale pianificata per ridurre vento ed erosione, con possibile competizione per acqua, luce e terreno.\n\ncoltura di copertura\n\nColtura coltivata soprattutto per coprire il suolo, non per il raccolto principale; richiede acqua e adattamento locale.\n\nlisciviazione dei sali\n\nMovimento dei sali disciolti sotto le radici con acqua idonea e un drenaggio funzionante.\n\nECe\n\nConducibilità dell’estratto di pasta satura del suolo; confrontare solo tabelle con stesso metodo e unità.\n\nECw\n\nConducibilità dell’acqua irrigua, diversa da ECe del suolo.\n\nalofita\n\nPianta naturalmente adattata a forte salinità; una coltura convenzionale relativamente tollerante non lo è necessariamente.\n\ncultivar\n\nVarietà selezionata di una coltura, che può reagire diversamente da altre della stessa specie.\n\nportinnesto\n\nPianta radicata su cui si innesta la marza di un fruttifero; può modificare la risposta del pistacchio alla salinità.', 'piano di miglioramento\n\nSequenza specifica per un sito che collega prove, intervento, motivo e controllo.\n\nammendante organico\n\nMateriale aggiunto come compost idoneo, letame maturo o biochar; composizione, sali e dose vanno verificati.\n\nbiochar\n\nMateriale ricco di carbonio ottenuto riscaldando biomassa con poco ossigeno; effetti dipendono da biomassa, processo, suolo e dose.\n\npacciamatura\n\nCopertura superficiale, per esempio paglia, cippato o ghiaia, che può influire su evaporazione, temperatura, infestanti o erosione.\n\nfrangivento\n\nBarriera vegetale pianificata per ridurre vento ed erosione, con possibile competizione per acqua, luce e terreno.\n\ncoltura di copertura\n\nColtura coltivata soprattutto per coprire il suolo, non per il raccolto principale; richiede acqua e adattamento locale.\n\nlisciviazione dei sali\n\nMovimento dei sali disciolti sotto le radici con acqua idonea e un drenaggio funzionante.\n\ne ci e\n\nConducibilità dell’estratto di pasta satura del suolo; confrontare solo tabelle con stesso metodo e unità.\n\ne ci doppia vu\n\nConducibilità dell’acqua irrigua, diversa da e ci e del suolo.\n\nalofita\n\nPianta naturalmente adattata a forte salinità; una coltura convenzionale relativamente tollerante non lo è necessariamente.\n\ncultivar\n\nVarietà selezionata di una coltura, che può reagire diversamente da altre della stessa specie.\n\nportinnesto\n\nPianta radicata su cui si innesta la marza di un fruttifero; può modificare la risposta del pistacchio alla salinità.')], 'de': [('Bodenverbesserungsplan\n\nStandortbezogene Abfolge aus Befund, Maßnahme, Grund und Erfolgskontrolle.\n\norganisches Bodenmaterial\n\nZugabe wie geeigneter Kompost, abgelagerter Mist oder Pflanzenkohle; Zusammensetzung, Salze und Menge separat prüfen.\n\nPflanzenkohle\n\nKohlenstoffreiches Material aus Biomasse, die bei wenig Sauerstoff erhitzt wurde; Wirkung hängt von Rohstoff, Verfahren, Boden und Menge ab.\n\nMulch\n\nBodenbedeckung wie Stroh, Holzhäcksel oder Kies, die Verdunstung, Temperatur, Unkraut oder Erosion beeinflusst.\n\nWindschutz\n\nGeplanter Pflanzenstreifen gegen Wind und Abtrag, der Wasser, Licht und Land beanspruchen kann.\n\nZwischenfrucht\n\nKultur vor allem zur Bodenbedeckung und Bodenwirkung statt zur Haupt-Ernte; braucht dennoch Wasser und örtliche Eignung.\n\nSalzauswaschung\n\nVerlagerung gelöster Salze unter die Wurzelzone mit geeignetem Wasser und funktionierender Entwässerung.\n\nECe\n\nLeitfähigkeit des Extrakts einer gesättigten Bodenpaste; nur mit derselben Messmethode und Einheit vergleichen.\n\nECw\n\nLeitfähigkeit des Bewässerungswassers, verschieden vom Boden-ECe.\n\nHalophyt\n\nNatürlich an hohe Salzgehalte angepasste Pflanze; relativ salztolerante Nutzpflanzen gehören nicht automatisch dazu.\n\nSorte\n\nAusgewählte Kulturvariante mit möglicherweise anderer Reaktion als andere Sorten derselben Art.\n\nUnterlage\n\nBewurzelte Pflanze, auf die das Edelreis eines Obstbaums gepfropft wird; kann die Salzreaktion der Pistazie ändern.', 'Bodenverbesserungsplan\n\nStandortbezogene Abfolge aus Befund, Maßnahme, Grund und Erfolgskontrolle.\n\norganisches Bodenmaterial\n\nZugabe wie geeigneter Kompost, abgelagerter Mist oder Pflanzenkohle; Zusammensetzung, Salze und Menge separat prüfen.\n\nPflanzenkohle\n\nKohlenstoffreiches Material aus Biomasse, die bei wenig Sauerstoff erhitzt wurde; Wirkung hängt von Rohstoff, Verfahren, Boden und Menge ab.\n\nMulch\n\nBodenbedeckung wie Stroh, Holzhäcksel oder Kies, die Verdunstung, Temperatur, Unkraut oder Erosion beeinflusst.\n\nWindschutz\n\nGeplanter Pflanzenstreifen gegen Wind und Abtrag, der Wasser, Licht und Land beanspruchen kann.\n\nZwischenfrucht\n\nKultur vor allem zur Bodenbedeckung und Bodenwirkung statt zur Haupt-Ernte; braucht dennoch Wasser und örtliche Eignung.\n\nSalzauswaschung\n\nVerlagerung gelöster Salze unter die Wurzelzone mit geeignetem Wasser und funktionierender Entwässerung.\n\nE Ce E\n\nLeitfähigkeit des Extrakts einer gesättigten Bodenpaste; nur mit derselben Messmethode und Einheit vergleichen.\n\nE Ce We\n\nLeitfähigkeit des Bewässerungswassers, verschieden vom Boden-E Ce E.\n\nHalophyt\n\nNatürlich an hohe Salzgehalte angepasste Pflanze; relativ salztolerante Nutzpflanzen gehören nicht automatisch dazu.\n\nSorte\n\nAusgewählte Kulturvariante mit möglicherweise anderer Reaktion als andere Sorten derselben Art.\n\nUnterlage\n\nBewurzelte Pflanze, auf die das Edelreis eines Obstbaums gepfropft wird; kann die Salzreaktion der Pistazie ändern.'), ('Nenne in 5 Minuten drei Standortprobleme, jeweils Messbefund oder fehlendes Verfahren und eine Auswirkung auf die Kultur. Bewahre 10 m × 10 m, 0,8 %, 3,5 dS/m und Brunnenbeschreibung.\n\nOrdne in 10 Minuten Analysen, Wasser/Entwässerung, Materialqualität, Oberflächenpflege und Nachmessung. Vergleiche mindestens drei Techniken und erkläre, warum Schichtdicken des Lehrermodells Vorschläge statt Standortmengen sind.\n\nWähle in 5 Minuten zwei Kulturen aus der Originalliste. Schreibe je einen Satz zu Trockenheit und Salz und einen fehlenden Wert zu Standort, Sorte oder Wachstumsphase.\n\nIn der insgesamt fünfminütigen letzten Diskussionsphase stellen zwei oder drei Gruppen ihren einseitigen Plan vor. Beantworte einen Einwand zu Wasser, Bodenverbesserermenge oder Kulturwahl. Bearbeite die ursprüngliche Abschlussfrage zu organischer Substanz und zwei Vorteilen und erläutere, was diese Antwort nicht belegt.\n\nTrenne Messwert und Deutung; 3,5 ohne Verfahren nicht „mäßig salzig“ nennen.\n\nOnlineübung zur Planung. Angaben zu Bodenextraktion, Wasserchemie, Entwässerung, Materialanalyse und Kulturbedingungen sind noch unvollständig. Gespeicherter Text oder ein vollständig ausgefülltes Formular genehmigen keine Aufwandmenge, garantieren keinen Ertrag und bestätigen kein praktisches Bestehen.', 'Nenne in fünf Minuten drei Standortprobleme, jeweils Messbefund oder fehlendes Verfahren und eine Auswirkung auf die Kultur. Bewahre zehn Meter mal zehn Meter, null Komma acht Prozent, drei Komma fünf Dezisiemens pro Meter und Brunnenbeschreibung.\n\nOrdne in zehn Minuten Analysen, Wasser, Entwässerung, Materialqualität, Oberflächenpflege und Nachmessung. Vergleiche mindestens drei Techniken und erkläre, warum Schichtdicken des Lehrermodells Vorschläge statt Standortmengen sind.\n\nWähle in fünf Minuten zwei Kulturen aus der Originalliste. Schreibe je einen Satz zu Trockenheit und Salz und einen fehlenden Wert zu Standort, Sorte oder Wachstumsphase.\n\nIn der insgesamt fünfminütigen letzten Diskussionsphase stellen zwei oder drei Gruppen ihren einseitigen Plan vor. Beantworte einen Einwand zu Wasser, Bodenverbesserermenge oder Kulturwahl. Bearbeite die ursprüngliche Abschlussfrage zu organischer Substanz und zwei Vorteilen und erläutere, was diese Antwort nicht belegt.\n\nTrenne Messwert und Deutung; drei Komma fünf ohne Verfahren nicht „mäßig salzig“ nennen.\n\nOnlineübung zur Planung. Angaben zu Bodenextraktion, Wasserchemie, Entwässerung, Materialanalyse und Kulturbedingungen sind noch unvollständig. Gespeicherter Text oder ein vollständig ausgefülltes Formular genehmigen keine Aufwandmenge, garantieren keinen Ertrag und bestätigen kein praktisches Bestehen.'), ('Nutze die Messdaten der Parzelle aus dem vorigen Schritt für einen einseitigen Plan. Ein brauchbarer Plan verknüpft jedes Problem mit einer Prüfung, einer Maßnahme, einer Begründung und einer Kontrolle ihrer Wirkung. Er behält die ursprüngliche Unterrichtsaktivität und die Kulturlisten bei, ohne eine standortspezifische Aufwandmenge zu erfinden.\n\nDrei durch Messdaten gestützte Probleme der 10 m × 10 m großen Parzelle feststellen und Prüfungen, Wasser- und Entwässerungsentscheidungen sowie Bodenverbesserung in einem einseitigen Plan ordnen, statt Kompost als Ersatz für Salzmanagement zu behandeln.\n\nKompost, abgelagerten Mist, Pflanzenkohle, Mulch, Windschutz, Zwischenfrüchte und Wassermanagement nach Nutzen, Aufwand und Standortgrenzen vergleichen, ohne eine ungeprüfte Aufwandmenge vorzuschreiben.\n\nZwei Kulturkandidaten wählen, Trockenheits- und Salzverträglichkeit getrennt begründen und methodisch passendes ECe, Sorte, Etablierungsphase, Bewässerungswasser und Wirtschaftlichkeit vor einer echten Anbauentscheidung prüfen.', 'Nutze die Messdaten der Parzelle aus dem vorigen Schritt für einen einseitigen Plan. Ein brauchbarer Plan verknüpft jedes Problem mit einer Prüfung, einer Maßnahme, einer Begründung und einer Kontrolle ihrer Wirkung. Er behält die ursprüngliche Unterrichtsaktivität und die Kulturlisten bei, ohne eine standortspezifische Aufwandmenge zu erfinden.\n\nDrei durch Messdaten gestützte Probleme der zehn Meter mal zehn Meter großen Parzelle feststellen und Prüfungen, Wasser- und Entwässerungsentscheidungen sowie Bodenverbesserung in einem einseitigen Plan ordnen, statt Kompost als Ersatz für Salzmanagement zu behandeln.\n\nKompost, abgelagerten Mist, Pflanzenkohle, Mulch, Windschutz, Zwischenfrüchte und Wassermanagement nach Nutzen, Aufwand und Standortgrenzen vergleichen, ohne eine ungeprüfte Aufwandmenge vorzuschreiben.\n\nZwei Kulturkandidaten wählen, Trockenheits- und Salzverträglichkeit getrennt begründen und methodisch passendes E Ce E, Sorte, Etablierungsphase, Bewässerungswasser und Wirtschaftlichkeit vor einer echten Anbauentscheidung prüfen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s309-independent-audio-20261023-r1'
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
    assert count < 4, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 16,'maximumCallsForLane':4,
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
    assert all(v<=4 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_FOUR_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':4,'maximumBlindReviewPerLane':4,'maximumASRPerLane':4,'maximumTTSAggregate':16,'maximumBlindAggregate':16,'maximumASRAggregate':16,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
