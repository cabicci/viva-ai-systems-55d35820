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
IDS = ('S2-05-ar-EG-opening-r1', 'S2-05-ar-EG-E01-r1', 'S2-05-ar-EG-E02-r1', 'S2-05-ar-EG-E03-r1', 'S2-05-ar-EG-guided-practice-r1', 'S2-05-ar-EG-reflection-r1', 'S2-05-ar-EG-comparison-r1', 'S2-05-ar-EG-glossary-r1', 'S2-05-en-opening-r1', 'S2-05-en-E01-r1', 'S2-05-en-E02-r1', 'S2-05-en-E03-r1', 'S2-05-en-guided-practice-r1', 'S2-05-en-reflection-r1', 'S2-05-en-comparison-r1', 'S2-05-en-glossary-r1', 'S2-05-it-opening-r1', 'S2-05-it-E01-r1', 'S2-05-it-E02-r1', 'S2-05-it-E03-r1', 'S2-05-it-guided-practice-r1', 'S2-05-it-reflection-r1', 'S2-05-it-comparison-r1', 'S2-05-it-glossary-r1', 'S2-05-de-opening-r1', 'S2-05-de-E01-r1', 'S2-05-de-E02-r1', 'S2-05-de-E03-r1', 'S2-05-de-guided-practice-r1', 'S2-05-de-reflection-r1', 'S2-05-de-comparison-r1', 'S2-05-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S205_THIRTY_TWO_FULL_CORE_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES','S2-05')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_EIGHT_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s205-remainder-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening','E01','E02','E03','guided-practice','reflection','comparison','glossary']
        voice='Charon'if group in['E01','E03','reflection','glossary','knowledge-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'opening':('/intro','/goals/'),'E01':('/examples/0/',),'E02':('/examples/1/',),'E03':('/examples/2/',),'guided-practice':('/guidedPractice/prompt','/guidedPractice/learnerActions/','/guidedPractice/practicalBoundary'),'reflection':('/selfReflection/','/reflectionItems/'),'comparison':('/comparisonLabel','/comparison/'),'glossary':('/glossary/',),'model-and-workbook-guidance':('/phPractice/ui/','/studentDownloads/0/title'),'knowledge-completion':('/phPractice/passChecks/',)}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدامًا صحيحًا', 'استخدام صحيح'), ('التقييم النهائي في بطاقة التقييم بيطلب حوالي 500 g من تربة حقل رطبة فيها جذور وأغصان وحجارة.\n\nوثّق تجفيف الطالب نفسه، لو الطريقة طلبته، وتفكيك الكتل والنخل بلطف مع استمرار رمز الحقل.\n\nزِن من 450 إلى 550 g من التربة الدقيقة المجهزة في كيس مناسب للتقييم ده، اقفله واتأكد من عدم وجود شوائب أو تسريب.\n\nاكتب التاريخ ورمز الحقل وعمق السحب واسم جامع العينة بوضوح وطابقها مع سجل الحقل. المنتج ما يثبتش عملية الطالب إلا مع سجل ملاحظتها.\n\nسماحية 450–550 g تخص البطاقة دي، مش قاعدة شحن لكل معمل.', 'التقييم النهائي في بطاقة التقييم بيطلب حوالي خمسمية جرام من تربة حقل رطبة فيها جذور وأغصان وحجارة.\n\nوثّق تجفيف الطالب نفسه، لو الطريقة طلبته، وتفكيك الكتل والنخل بلطف مع استمرار رمز الحقل.\n\nزِن من أربعمية وخمسين إلى خمسمية وخمسين جرام من التربة الدقيقة المجهزة في كيس مناسب للتقييم ده، اقفله واتأكد من عدم وجود شوائب أو تسريب.\n\nاكتب التاريخ ورمز الحقل وعمق السحب واسم جامع العينة بوضوح وطابقها مع سجل الحقل. المنتج ما يثبتش عملية الطالب إلا مع سجل ملاحظتها.\n\nسماحية أربعمية وخمسين لخمسمية وخمسين جرام تخص البطاقة دي، مش قاعدة شحن لكل معمل.'), ('الطريقة طالبة 20 mL ماء مقطر. طالب عايز يقرأ الكمية من تدريج البيكر التقريبي.\n\nالبيكر مناسب للحفظ والخلط، لكن المخبار المدرّج هو أداة قياس الحجم المحددة هنا.\n\nاقرأ الحجم بالمليلتر قراءة صحيحة في المخبار، وبعدها انقل الماء للبيكر من غير تلويث أي عينة.\n\nالخطوة اللاحقة لقياس pH هتستخدم نسبة الطريقة؛ ما تغيّرهاش بتقدير من البيكر.\n\nدقة الأداة لازم تناسب الطريقة.', 'الطريقة طالبة عشرين مليلتر ماء مقطر. طالب عايز يقرأ الكمية من تدريج البيكر التقريبي.\n\nالبيكر مناسب للحفظ والخلط، لكن المخبار المدرّج هو أداة قياس الحجم المحددة هنا.\n\nاقرأ الحجم بالمليلتر قراءة صحيحة في المخبار، وبعدها انقل الماء للبيكر من غير تلويث أي عينة.\n\nالخطوة اللاحقة لقياس بي إتش هتستخدم نسبة الطريقة؛ ما تغيّرهاش بتقدير من البيكر.\n\nدقة الأداة لازم تناسب الطريقة.'), ('تجفيفًا هوائيًا', 'تجفيف هوائي'), ('تقرير التربة قيمته مرتبطة بجودة العينة والسجل اللي وراها. قبل ما تلمس عينة أو عدة اختبار، اعرف المخاطر، اختار الأداة المناسبة، وحافظ على هوية العينة من الحقل للمعمل.\n\nتحت إشراف المدرّب، تحدد أماكن الطوارئ والمخلفات في الموقع، وتقرأ بطاقة المادة ونشرة بيانات السلامة الخاصة بها، وتختار حماية مناسبة للعين والجسم واليد، وتستخدم أدوات الوزن وقياس الحجم والخلط والنخل استخدام صحيح.\n\nتجهّز بنفسك عينة تربة مكلّف بيها حسب طريقة المعمل المستقبِل: تسجّل هويتها، وتجففها لو الطريقة طلبت ده مع توثيق وقت الانتظار الفعلي، وتفكك الكتل برفق من غير طحن الحجارة، وتمرر الجزء المطلوب من منخل فتحاته 2 مم لو البروتوكول طلبه، وتمنع انتقال التلوث من عينة للتانية.\n\nفي مهمة المنتج النهائي الموجودة في بطاقة التقييم، تسلّم عينتك اللي جهزتها بنفسك ووزنها من 450 إلى 550 جم، في كيس محكم، وعليه بيانات الحقل والتاريخ والعمق واسم جامع العينة كاملة، وتشرح ليه التجفيف الهوائي مش مناسب لكل تحليل.', 'تقرير التربة قيمته مرتبطة بجودة العينة والسجل اللي وراها. قبل ما تلمس عينة أو عدة اختبار، اعرف المخاطر، اختار الأداة المناسبة، وحافظ على هوية العينة من الحقل للمعمل.\n\nتحت إشراف المدرّب، تحدد أماكن الطوارئ والمخلفات في الموقع، وتقرأ بطاقة المادة ونشرة بيانات السلامة الخاصة بها، وتختار حماية مناسبة للعين والجسم واليد، وتستخدم أدوات الوزن وقياس الحجم والخلط والنخل استخدام صحيح.\n\nتجهّز بنفسك عينة تربة مكلّف بيها حسب طريقة المعمل المستقبِل: تسجّل هويتها، وتجففها لو الطريقة طلبت ده مع توثيق وقت الانتظار الفعلي، وتفكك الكتل برفق من غير طحن الحجارة، وتمرر الجزء المطلوب من منخل فتحاته اتنين مليمتر لو البروتوكول طلبه، وتمنع انتقال التلوث من عينة للتانية.\n\nفي مهمة المنتج النهائي الموجودة في بطاقة التقييم، تسلّم عينتك اللي جهزتها بنفسك ووزنها من أربعمية وخمسين إلى خمسمية وخمسين جرام، في كيس محكم، وعليه بيانات الحقل والتاريخ والعمق واسم جامع العينة كاملة، وتشرح ليه التجفيف الهوائي مش مناسب لكل تحليل.'), ('نشرة بيانات السلامة (SDS)\n\nنشرة خاصة بالمادة الكيميائية فيها المخاطر والإسعاف والتداول والوقاية، وكانت بتتسمى MSDS.\n\nمعدات الوقاية الشخصية (PPE)\n\nمعدات حماية شخصية بتتحدد حسب المهمة والمادة، مش نوع قفاز أو نظارة ينفع في كل حالة.\n\nكتلة التربة\n\nكتلة من حبيبات التربة الطبيعية ينفع نفككها بلطف أثناء التجهيز.\n\nمنخل 2 مم\n\nشبكة فتحاتها 2 مم لفصل جزء التربة الدقيقة في بروتوكول التدريب ده.\n\nجزء التربة الدقيقة\n\nمادة التربة اللي بتعدّي من المنخل المحدد مع فصل الحجارة والشوائب الأكبر.\n\nتتبع هوية العينة\n\nالربط المستمر بين سجل الحقل والصواني والأجزاء المأخوذة ونتائج التحليل والكيس النهائي.', 'نشرة بيانات السلامة (إس دي إس)\n\nنشرة خاصة بالمادة الكيميائية فيها المخاطر والإسعاف والتداول والوقاية، وكانت بتتسمى إم إس دي إس.\n\nمعدات الوقاية الشخصية (بي بي إي)\n\nمعدات حماية شخصية بتتحدد حسب المهمة والمادة، مش نوع قفاز أو نظارة ينفع في كل حالة.\n\nكتلة التربة\n\nكتلة من حبيبات التربة الطبيعية ينفع نفككها بلطف أثناء التجهيز.\n\nمنخل اتنين مليمتر\n\nشبكة فتحاتها اتنين مليمتر لفصل جزء التربة الدقيقة في بروتوكول التدريب ده.\n\nجزء التربة الدقيقة\n\nمادة التربة اللي بتعدّي من المنخل المحدد مع فصل الحجارة والشوائب الأكبر.\n\nتتبع هوية العينة\n\nالربط المستمر بين سجل الحقل والصواني والأجزاء المأخوذة ونتائج التحليل والكيس النهائي.'), ('هل أقدر أحدد وظيفة ووحدة كل أداة معملية، وأماكن الطوارئ والمخلفات في موقع التدريب نفسه؟\n\nمراجعة ذاتية فقط؛ مش دليل مهارة عملية.\n\nهل أقدر أشرح التجفيف حسب الطريقة، وتفكيك الكتل، والنخل عند 2 mm، وسلسلة بطاقة العينة الكاملة؟ وأنهي مرحلة لسه لازم المدرّب يشوفني فيها؟\n\nمراجعة ذاتية فقط؛ مش دليل مهارة عملية.\n\nالأونلاين تدريب على اختيار الأداة والترتيب والسجل. تنفيذ التجهيز الحقيقي وملاحظته وتسجيله مع المدرّب.', 'هل أقدر أحدد وظيفة ووحدة كل أداة معملية، وأماكن الطوارئ والمخلفات في موقع التدريب نفسه؟\n\nمراجعة ذاتية فقط؛ مش دليل مهارة عملية.\n\nهل أقدر أشرح التجفيف حسب الطريقة، وتفكيك الكتل، والنخل عند اتنين مليمتر، وسلسلة بطاقة العينة الكاملة؟ وأنهي مرحلة لسه لازم المدرّب يشوفني فيها؟\n\nمراجعة ذاتية فقط؛ مش دليل مهارة عملية.\n\nالأونلاين تدريب على اختيار الأداة والترتيب والسجل. تنفيذ التجهيز الحقيقي وملاحظته وتسجيله مع المدرّب.'), ('وصّل كل أداة بوظيفتها\n\nمجموعة الأدوات\n\nوظيفتها هنا\n\nالوحدة أو الفحص\n\nبيكر أو دورق\n\nحفظ وخلط\n\nتدريجه مش بديل لقياس حجم دقيق\n\nمخبار مدرّج\n\nقياس حجم السائل\n\nmL عند السطح المنحني للسائل حسب الطريقة\n\nمنخل 2 مم\n\nفصل التربة الدقيقة عن المواد الأكبر\n\nفتحة 2 مم في البروتوكول ده\n\nهاون ومدقة\n\nتفكيك الكتل الجافة بلطف\n\nممنوع طحن الحجارة\n\nميزان إلكتروني\n\nقياس كتلة التربة\n\ng مع فحص الصفر والمعايرة\n\nجهاز pH أو شرائط\n\nقياس أو تقدير الحموضة\n\npH حسب تعليمات الجهاز\n\nكولوريميتر\n\nقراءة استجابة اللون في عِدة مناسبة\n\nقراءة خاصة بالطريقة، ومش لازم لكل اختبار', 'وصّل كل أداة بوظيفتها\n\nمجموعة الأدوات\n\nوظيفتها هنا\n\nالوحدة أو الفحص\n\nبيكر أو دورق\n\nحفظ وخلط\n\nتدريجه مش بديل لقياس حجم دقيق\n\nمخبار مدرّج\n\nقياس حجم السائل\n\nمليلتر عند السطح المنحني للسائل حسب الطريقة\n\nمنخل اتنين مليمتر\n\nفصل التربة الدقيقة عن المواد الأكبر\n\nفتحة اتنين مليمتر في البروتوكول ده\n\nهاون ومدقة\n\nتفكيك الكتل الجافة بلطف\n\nممنوع طحن الحجارة\n\nميزان إلكتروني\n\nقياس كتلة التربة\n\nجرام مع فحص الصفر والمعايرة\n\nجهاز بي إتش أو شرائط\n\nقياس أو تقدير الحموضة\n\nبي إتش حسب تعليمات الجهاز\n\nكولوريميتر\n\nقراءة استجابة اللون في عِدة مناسبة\n\nقراءة خاصة بالطريقة، ومش لازم لكل اختبار')], 'en': [('2 mm openings', 'two-millimetre openings'), ('2 mm sieve', 'two-millimetre sieve'), ('2 mm sieving', 'two-millimetre sieving'), ('450–550 g tolerance', '450–550-gram tolerance'), ('500 g sample', '500-gram sample'), ("A procedure calls for 20 mL of distilled water. A learner wants to read it from a beaker's rough scale.\n\nThe beaker is suitable for holding and mixing, but the graduated cylinder is the specified measured-volume tool.\n\nRead the cylinder correctly in mL, then transfer to the beaker without contaminating either sample.\n\nThe later pH step will use the method's ratio; do not change it by guessing from a beaker.\n\nMatch tool precision to the procedure.", "A procedure calls for twenty millilitres of distilled water. A learner wants to read it from a beaker's rough scale.\n\nThe beaker is suitable for holding and mixing, but the graduated cylinder is the specified measured-volume tool.\n\nRead the cylinder correctly in millilitres, then transfer to the beaker without contaminating either sample.\n\nThe later P H step will use the method's ratio; do not change it by guessing from a beaker.\n\nMatch tool precision to the procedure."), ("A soil report is only as useful as the sample and the record behind it. Before touching a sample or test kit, identify the hazards, choose the right tools and protect the sample's identity from field to laboratory.\n\nUnder trainer supervision, locate the site's emergency and waste facilities, read the relevant label and SDS, choose compatible eye, body and hand protection, and demonstrate the correct weighing, volume, mixing and sieving tools.\n\nPersonally prepare an assigned soil sample using the receiving laboratory's method: record its identity, dry it when required and document the real wait, gently break aggregates without grinding stones, pass the required fraction through a two-millimetre sieve when this protocol calls for it, and protect against cross-contamination.\n\nFor the final-product task, submit the learner's own prepared, sealed sample weighing 450–550 g with the full field/date/depth/collector label, and explain why air-drying is not suitable for every analysis.", "A soil report is only as useful as the sample and the record behind it. Before touching a sample or test kit, identify the hazards, choose the right tools and protect the sample's identity from field to laboratory.\n\nUnder trainer supervision, locate the site's emergency and waste facilities, read the relevant label and S D S, choose compatible eye, body and hand protection, and demonstrate the correct weighing, volume, mixing and sieving tools.\n\nPersonally prepare an assigned soil sample using the receiving laboratory's method: record its identity, dry it when required and document the real wait, gently break aggregates without grinding stones, pass the required fraction through a two-millimetre sieve when this protocol calls for it, and protect against cross-contamination.\n\nFor the final-product task, submit the learner's own prepared, sealed sample weighing four hundred and fifty to five hundred and fifty grams with the full field/date/depth/collector label, and explain why air-drying is not suitable for every analysis."), ('Match each tool to its role\n\nTool group\n\nPrimary role here\n\nUnit or check\n\nBeaker or flask\n\nHold and mix\n\nDo not substitute markings for accurate volume\n\nGraduated cylinder\n\nMeasure liquid volume\n\nmL at the meniscus per method\n\ntwo-millimetre sieve\n\nSeparate fine soil from larger material\n\nOpening size 2 mm for this protocol\n\nMortar and pestle\n\nBreak dry clods gently\n\nDo not grind stones\n\nElectronic balance\n\nMeasure soil mass\n\ng; check calibration/zero\n\npH meter or strips\n\nMeasure or estimate acidity\n\npH; follow device method\n\nColorimeter\n\nRead colour response in applicable test kit\n\nMethod-specific reading, not always needed', 'Match each tool to its role\n\nTool group\n\nPrimary role here\n\nUnit or check\n\nBeaker or flask\n\nHold and mix\n\nDo not substitute markings for accurate volume\n\nGraduated cylinder\n\nMeasure liquid volume\n\nmillilitres at the meniscus per method\n\ntwo-millimetre sieve\n\nSeparate fine soil from larger material\n\nOpening size two millimetres for this protocol\n\nMortar and pestle\n\nBreak dry clods gently\n\nDo not grind stones\n\nElectronic balance\n\nMeasure soil mass\n\ngrams; check calibration/zero\n\nP H meter or strips\n\nMeasure or estimate acidity\n\nP H; follow device method\n\nColorimeter\n\nRead colour response in applicable test kit\n\nMethod-specific reading, not always needed'), ('Safety Data Sheet (SDS)\n\nChemical-specific hazard, first-aid, handling and protection information; formerly called MSDS.\n\nPPE\n\nPersonal protective equipment selected for the task and material, not a universal glove or goggle type.\n\naggregate\n\nA clump of natural soil particles that can be gently separated during this preparation.\n\ntwo-millimetre sieve\n\nScreen with two-millimetre openings used for the fine-earth fraction in this teaching protocol.\n\nfine-earth fraction\n\nSoil material passing the specified sieve, while larger stones and debris are separated.\n\nsample traceability\n\nThe continuous link between the field record, trays, subsamples, test results and final bag.', 'Safety Data Sheet (S D S)\n\nChemical-specific hazard, first-aid, handling and protection information; formerly called M S D S.\n\nP P E\n\nPersonal protective equipment selected for the task and material, not a universal glove or goggle type.\n\naggregate\n\nA clump of natural soil particles that can be gently separated during this preparation.\n\ntwo-millimetre sieve\n\nScreen with two-millimetre openings used for the fine-earth fraction in this teaching protocol.\n\nfine-earth fraction\n\nSoil material passing the specified sieve, while larger stones and debris are separated.\n\nsample traceability\n\nThe continuous link between the field record, trays, subsamples, test results and final bag.'), ("The final preparation task asks for an approximately 500-gram sample made from moist field soil with roots, twigs and stones.\n\nDocument the learner's own method-approved drying and gentle crushing/sieving, maintaining the same field ID.\n\nWeigh 450–550 g of the prepared fine soil into a suitable bag for this assessment, seal it and confirm no debris or spill.\n\nWrite date, Field ID, sampling depth and collector's name legibly and match the field record. The product proves a correct bag only when the observed process is also recorded.\n\nThe 450–550-gram tolerance is this card's criterion, not a universal lab shipping rule.", "The final preparation task asks for an approximately five hundred-gram sample made from moist field soil with roots, twigs and stones.\n\nDocument the learner's own method-approved drying and gentle crushing/sieving, maintaining the same field ID.\n\nWeigh four hundred and fifty to five hundred and fifty grams of the prepared fine soil into a suitable bag for this assessment, seal it and confirm no debris or spill.\n\nWrite date, Field ID, sampling depth and collector's name legibly and match the field record. The product proves a correct bag only when the observed process is also recorded.\n\nThe four hundred and fifty to five hundred and fifty-gram tolerance is this card's criterion, not a universal lab shipping rule.")], 'it': [("Associa ogni strumento alla funzione\n\nStrumento\n\nFunzione qui\n\nUnità o controllo\n\nBecher o beuta\n\nContenere e mescolare\n\nLa scala non sostituisce una misura accurata del volume\n\nCilindro graduato\n\nMisurare il volume del liquido\n\nmL al menisco, secondo il metodo\n\nSetaccio da 2 mm\n\nSeparare terra fine e materiale grosso\n\nApertura 2 mm per questo protocollo\n\nMortaio e pestello\n\nDisgregare delicatamente gli aggregati asciutti\n\nNon macinare pietre\n\nBilancia elettronica\n\nMisurare la massa della terra\n\ng; controllare azzeramento e taratura\n\npH-metro o strisce\n\nMisurare o stimare l'acidità\n\npH; seguire il metodo dello strumento\n\nColorimetro\n\nLeggere la risposta cromatica in un kit adatto\n\nLettura dipendente dal metodo; non sempre necessario", "Associa ogni strumento alla funzione\n\nStrumento\n\nFunzione qui\n\nUnità o controllo\n\nBecher o beuta\n\nContenere e mescolare\n\nLa scala non sostituisce una misura accurata del volume\n\nCilindro graduato\n\nMisurare il volume del liquido\n\nmillilitri al menisco, secondo il metodo\n\nSetaccio da due millimetri\n\nSeparare terra fine e materiale grosso\n\nApertura due millimetri per questo protocollo\n\nMortaio e pestello\n\nDisgregare delicatamente gli aggregati asciutti\n\nNon macinare pietre\n\nBilancia elettronica\n\nMisurare la massa della terra\n\ngrammi; controllare azzeramento e taratura\n\nP H-metro o strisce\n\nMisurare o stimare l'acidità\n\nP H; seguire il metodo dello strumento\n\nColorimetro\n\nLeggere la risposta cromatica in un kit adatto\n\nLettura dipendente dal metodo; non sempre necessario"), ("La valutazione finale del materiale didattico richiede circa 500 g di terra di campo umida con radici, rametti e sassi.\n\nDocumenta essiccazione approvata dal metodo, disgregazione e setacciatura eseguite dall'allievo mantenendo l'ID del campo.\n\nPesa 450–550 g di terra fine preparata in un sacchetto adatto a questa prova, chiudilo e controlla residui e perdite.\n\nScrivi data, ID del campo, profondità e nome del raccoglitore in modo leggibile e confrontali col registro. Il prodotto prova il processo solo insieme all'osservazione registrata.\n\nLa tolleranza 450–550 g appartiene a questa scheda, non a tutte le spedizioni ai laboratori.", "La valutazione finale del materiale didattico richiede circa cinquecento grammi di terra di campo umida con radici, rametti e sassi.\n\nDocumenta essiccazione approvata dal metodo, disgregazione e setacciatura eseguite dall'allievo mantenendo l'I D del campo.\n\nPesa quattrocentocinquanta a cinquecentocinquanta grammi di terra fine preparata in un sacchetto adatto a questa prova, chiudilo e controlla residui e perdite.\n\nScrivi data, I D del campo, profondità e nome del raccoglitore in modo leggibile e confrontali col registro. Il prodotto prova il processo solo insieme all'osservazione registrata.\n\nLa tolleranza quattrocentocinquanta a cinquecentocinquanta grammi appartiene a questa scheda, non a tutte le spedizioni ai laboratori."), ('Scheda di dati di sicurezza (SDS)\n\nInformazioni specifiche della sostanza su pericoli, primo soccorso, manipolazione e protezione; un tempo MSDS.\n\nDispositivi di protezione individuale (DPI)\n\nProtezioni scelte per mansione e materiale, non un tipo universale di guanti o occhiali.\n\nAggregato\n\nGruppo naturale di particelle di terra che si può disgregare delicatamente durante la preparazione.\n\nSetaccio da 2 mm\n\nRete con aperture di 2 mm per separare terra fine nel presente protocollo didattico.\n\nFrazione di terra fine\n\nMateriale che passa nel setaccio indicato, separato da pietre e residui più grandi.\n\nTracciabilità del campione\n\nCollegamento continuo fra registro del campo, vassoi, sottocampioni, risultati e sacchetto finale.', 'Scheda di dati di sicurezza (S D S)\n\nInformazioni specifiche della sostanza su pericoli, primo soccorso, manipolazione e protezione; un tempo M S D S.\n\nDispositivi di protezione individuale (D P I)\n\nProtezioni scelte per mansione e materiale, non un tipo universale di guanti o occhiali.\n\nAggregato\n\nGruppo naturale di particelle di terra che si può disgregare delicatamente durante la preparazione.\n\nSetaccio da due millimetri\n\nRete con aperture di due millimetri per separare terra fine nel presente protocollo didattico.\n\nFrazione di terra fine\n\nMateriale che passa nel setaccio indicato, separato da pietre e residui più grandi.\n\nTracciabilità del campione\n\nCollegamento continuo fra registro del campo, vassoi, sottocampioni, risultati e sacchetto finale.'), ("So indicare funzione e unità di ogni strumento e la posizione dei presidi di emergenza e rifiuti del sito reale?\n\nSolo autoverifica, non prova pratica.\n\nSo spiegare essiccazione dipendente dal metodo, disgregazione, setaccio da 2 mm e catena dell'etichetta completa? Quale fase deve ancora osservare il formatore?\n\nSolo autoverifica, non prova pratica.\n\nOnline eserciti strumenti, ordine e registro. La competenza reale richiede osservazione e registrazione del formatore.", "So indicare funzione e unità di ogni strumento e la posizione dei presidi di emergenza e rifiuti del sito reale?\n\nSolo autoverifica, non prova pratica.\n\nSo spiegare essiccazione dipendente dal metodo, disgregazione, setaccio da due millimetri e catena dell'etichetta completa? Quale fase deve ancora osservare il formatore?\n\nSolo autoverifica, non prova pratica.\n\nOnline eserciti strumenti, ordine e registro. La competenza reale richiede osservazione e registrazione del formatore."), ("Un referto del suolo vale quanto il campione e la documentazione che lo accompagnano. Prima di toccare un campione o un kit, individua i rischi, scegli gli strumenti corretti e mantieni la sua identità dal campo al laboratorio.\n\nSotto la supervisione del formatore, individua i presidi di emergenza e i contenitori dei rifiuti del sito, consulta etichetta e scheda di dati di sicurezza pertinenti, scegli protezioni compatibili per occhi, corpo e mani e dimostra l'uso degli strumenti per pesare, misurare volumi, mescolare e setacciare.\n\nPrepara personalmente un campione assegnato secondo il metodo del laboratorio ricevente: registrane l'identità, asciugalo solo se richiesto documentando l'attesa reale, disgrega delicatamente gli aggregati senza macinare i sassi, usa il setaccio da 2 mm quando previsto ed evita contaminazioni tra campioni.\n\nPer il compito finale previsto dalla fonte, consegna il campione preparato da te in un sacchetto ben chiuso da 450–550 g, con data, identificativo del campo, profondità e nome di chi lo ha raccolto, e spiega perché l'essiccazione all'aria non è adatta a tutte le analisi.", "Un referto del suolo vale quanto il campione e la documentazione che lo accompagnano. Prima di toccare un campione o un kit, individua i rischi, scegli gli strumenti corretti e mantieni la sua identità dal campo al laboratorio.\n\nSotto la supervisione del formatore, individua i presidi di emergenza e i contenitori dei rifiuti del sito, consulta etichetta e scheda di dati di sicurezza pertinenti, scegli protezioni compatibili per occhi, corpo e mani e dimostra l'uso degli strumenti per pesare, misurare volumi, mescolare e setacciare.\n\nPrepara personalmente un campione assegnato secondo il metodo del laboratorio ricevente: registrane l'identità, asciugalo solo se richiesto documentando l'attesa reale, disgrega delicatamente gli aggregati senza macinare i sassi, usa il setaccio da due millimetri quando previsto ed evita contaminazioni tra campioni.\n\nPer il compito finale previsto dalla fonte, consegna il campione preparato da te in un sacchetto ben chiuso da quattrocentocinquanta a cinquecentocinquanta grammi, con data, identificativo del campo, profondità e nome di chi lo ha raccolto, e spiega perché l'essiccazione all'aria non è adatta a tutte le analisi."), ('Una procedura richiede 20 mL di acqua distillata. Un allievo vorrebbe leggerli sulla scala approssimativa del becher.\n\nIl becher va bene per contenere e mescolare, ma il cilindro graduato è lo strumento indicato per misurare il volume.\n\nLeggi correttamente i mL nel cilindro, poi trasferisci nel becher senza contaminare il campione.\n\nLa successiva tappa sul pH userà il rapporto previsto dal metodo; non cambiarlo stimando dal becher.\n\nLa precisione dello strumento deve corrispondere alla procedura.', 'Una procedura richiede venti millilitri di acqua distillata. Un allievo vorrebbe leggerli sulla scala approssimativa del becher.\n\nIl becher va bene per contenere e mescolare, ma il cilindro graduato è lo strumento indicato per misurare il volume.\n\nLeggi correttamente i millilitri nel cilindro, poi trasferisci nel becher senza contaminare il campione.\n\nLa successiva tappa sul P H userà il rapporto previsto dal metodo; non cambiarlo stimando dal becher.\n\nLa precisione dello strumento deve corrispondere alla procedura.'), ('a quattrocentocinquanta a cinquecentocinquanta grammi', 'tra quattrocentocinquanta e cinquecentocinquanta grammi')], 'de': [('2-mm-', 'Zwei-Millimeter-'), ('Die abschließende Vorbereitungsaufgabe verlangt eine Probe von etwa 500 g, die aus feuchter Felderde mit Wurzeln, Zweigen und Steinen hergestellt wird.\n\nDokumentiere die methodisch zulässige eigene Trocknung, das vorsichtige Lösen und Sieben bei durchgehender Feldkennung.\n\nWiege 450–550 g vorbereiteten Feinboden in einen für diese Aufgabe geeigneten Beutel, verschließe ihn und prüfe auf Fremdmaterial und Austritt.\n\nSchreibe Datum, Feldkennung, Tiefe und Namen der sammelnden Person lesbar und gleiche sie mit dem Feldprotokoll ab. Das Produkt belegt den Prozess nur zusammen mit seiner Beobachtung.\n\n450–550 g sind die Toleranz dieser Karte, keine allgemeine Versandregel für Labore.', 'Die abschließende Vorbereitungsaufgabe verlangt eine Probe von etwa fünfhundert Gramm, die aus feuchter Felderde mit Wurzeln, Zweigen und Steinen hergestellt wird.\n\nDokumentiere die methodisch zulässige eigene Trocknung, das vorsichtige Lösen und Sieben bei durchgehender Feldkennung.\n\nWiege vierhundertfünfzig bis fünfhundertfünfzig Gramm vorbereiteten Feinboden in einen für diese Aufgabe geeigneten Beutel, verschließe ihn und prüfe auf Fremdmaterial und Austritt.\n\nSchreibe Datum, Feldkennung, Tiefe und Namen der sammelnden Person lesbar und gleiche sie mit dem Feldprotokoll ab. Das Produkt belegt den Prozess nur zusammen mit seiner Beobachtung.\n\nvierhundertfünfzig bis fünfhundertfünfzig Gramm sind die Toleranz dieser Karte, keine allgemeine Versandregel für Labore.'), ('Ein Bodenbericht ist nur so brauchbar wie die Probe und ihre Dokumentation. Bevor du eine Probe oder ein Testset anfasst, kläre die Gefahren, wähle die passenden Geräte und sichere die Identität der Probe vom Feld bis ins Labor.\n\nUnter Aufsicht der Lehrkraft findest du die Notfall- und Abfallstellen am tatsächlichen Standort, liest Etikett und Sicherheitsdatenblatt, wählst passenden Augen-, Körper- und Handschutz und zeigst die richtige Verwendung von Geräten zum Wiegen, Volumenmessen, Mischen und Sieben.\n\nDu bereitest eine zugewiesene Bodenprobe selbst nach der Methode des annehmenden Labors vor: Identität festhalten, nur bei Bedarf trocknen und die tatsächliche Wartezeit dokumentieren, Klumpen vorsichtig ohne Zermahlen von Steinen lösen, bei vorgeschriebener Methode mit einem Zwei-Millimeter-Sieb arbeiten und Kreuzkontamination vermeiden.\n\nFür die Abschluss-Produktaufgabe des Lehrmaterials gibst du deine selbst vorbereitete, dicht verschlossene Probe mit 450–550 g sowie Datum, Feldkennung, Entnahmetiefe und Namen der sammelnden Person ab und erklärst, warum Lufttrocknung nicht zu jeder Analyse passt.', 'Ein Bodenbericht ist nur so brauchbar wie die Probe und ihre Dokumentation. Bevor du eine Probe oder ein Testset anfasst, kläre die Gefahren, wähle die passenden Geräte und sichere die Identität der Probe vom Feld bis ins Labor.\n\nUnter Aufsicht der Lehrkraft findest du die Notfall- und Abfallstellen am tatsächlichen Standort, liest Etikett und Sicherheitsdatenblatt, wählst passenden Augen-, Körper- und Handschutz und zeigst die richtige Verwendung von Geräten zum Wiegen, Volumenmessen, Mischen und Sieben.\n\nDu bereitest eine zugewiesene Bodenprobe selbst nach der Methode des annehmenden Labors vor: Identität festhalten, nur bei Bedarf trocknen und die tatsächliche Wartezeit dokumentieren, Klumpen vorsichtig ohne Zermahlen von Steinen lösen, bei vorgeschriebener Methode mit einem Zwei-Millimeter-Sieb arbeiten und Kreuzkontamination vermeiden.\n\nFür die Abschluss-Produktaufgabe des Lehrmaterials gibst du deine selbst vorbereitete, dicht verschlossene Probe mit vierhundertfünfzig bis fünfhundertfünfzig Gramm sowie Datum, Feldkennung, Entnahmetiefe und Namen der sammelnden Person ab und erklärst, warum Lufttrocknung nicht zu jeder Analyse passt.'), ('Ein Verfahren verlangt 20 mL destilliertes Wasser. Eine lernende Person will es an der groben Skala des Becherglases ablesen.\n\nDas Becherglas eignet sich zum Halten und Mischen; der Messzylinder ist hier das vorgeschriebene Gerät für das Volumen.\n\nLies den Zylinder richtig in mL ab und fülle danach ohne Kontamination ins Becherglas um.\n\nDer spätere pH-Schritt nutzt das Verhältnis der Methode; ändere es nicht durch Schätzen am Becherglas.\n\nDie Genauigkeit des Geräts muss zum Verfahren passen.', 'Ein Verfahren verlangt zwanzig Milliliter destilliertes Wasser. Eine lernende Person will es an der groben Skala des Becherglases ablesen.\n\nDas Becherglas eignet sich zum Halten und Mischen; der Messzylinder ist hier das vorgeschriebene Gerät für das Volumen.\n\nLies den Zylinder richtig in Milliliter ab und fülle danach ohne Kontamination ins Becherglas um.\n\nDer spätere P H-Schritt nutzt das Verhältnis der Methode; ändere es nicht durch Schätzen am Becherglas.\n\nDie Genauigkeit des Geräts muss zum Verfahren passen.'), ('Geräte den Aufgaben zuordnen\n\nGerätegruppe\n\nAufgabe hier\n\nEinheit oder Kontrolle\n\nBecherglas oder Kolben\n\nHalten und mischen\n\nSkala ersetzt kein genaues Volumenmessen\n\nMesszylinder\n\nFlüssigkeitsvolumen messen\n\nmL am Meniskus nach Methode\n\nZwei-Millimeter-Sieb\n\nFeinboden von größerem Material trennen\n\n2 mm Öffnung in diesem Verfahren\n\nMörser und Stößel\n\nTrockene Klumpen vorsichtig lösen\n\nKeine Steine zermahlen\n\nElektronische Waage\n\nBodenmasse messen\n\ng; Nullpunkt und Kalibrierung prüfen\n\npH-Meter oder Streifen\n\nSäurestufe messen oder schätzen\n\npH nach Geräteverfahren\n\nKolorimeter\n\nFarbreaktion im passenden Testset lesen\n\nVerfahrensabhängig; nicht immer nötig', 'Geräte den Aufgaben zuordnen\n\nGerätegruppe\n\nAufgabe hier\n\nEinheit oder Kontrolle\n\nBecherglas oder Kolben\n\nHalten und mischen\n\nSkala ersetzt kein genaues Volumenmessen\n\nMesszylinder\n\nFlüssigkeitsvolumen messen\n\nMilliliter am Meniskus nach Methode\n\nZwei-Millimeter-Sieb\n\nFeinboden von größerem Material trennen\n\nzwei Millimeter Öffnung in diesem Verfahren\n\nMörser und Stößel\n\nTrockene Klumpen vorsichtig lösen\n\nKeine Steine zermahlen\n\nElektronische Waage\n\nBodenmasse messen\n\nGramm; Nullpunkt und Kalibrierung prüfen\n\nP H-Meter oder Streifen\n\nSäurestufe messen oder schätzen\n\nP H nach Geräteverfahren\n\nKolorimeter\n\nFarbreaktion im passenden Testset lesen\n\nVerfahrensabhängig; nicht immer nötig'), ('Sicherheitsdatenblatt (SDS)\n\nStoffspezifische Angaben zu Gefahren, Erster Hilfe, Handhabung und Schutz; früher MSDS genannt.\n\nPersönliche Schutzausrüstung (PSA)\n\nSchutz passend zu Tätigkeit und Stoff, kein universeller Handschuh- oder Brillentyp.\n\nBodenaggregat\n\nNatürlicher Verband von Bodenteilchen, der bei der Vorbereitung vorsichtig gelöst werden kann.\n\nZwei-Millimeter-Sieb\n\nSieb mit 2 mm Öffnungen für die Feinbodenfraktion in diesem Lehrverfahren.\n\nFeinbodenfraktion\n\nMaterial, das durch das festgelegte Sieb geht, während gröbere Steine und Reste getrennt werden.\n\nRückverfolgbarkeit der Probe\n\nDurchgehende Verbindung zwischen Feldprotokoll, Tabletts, Teilproben, Testergebnissen und Endbeutel.', 'Sicherheitsdatenblatt (S D S)\n\nStoffspezifische Angaben zu Gefahren, Erster Hilfe, Handhabung und Schutz; früher M S D S genannt.\n\nPersönliche Schutzausrüstung (P S A)\n\nSchutz passend zu Tätigkeit und Stoff, kein universeller Handschuh- oder Brillentyp.\n\nBodenaggregat\n\nNatürlicher Verband von Bodenteilchen, der bei der Vorbereitung vorsichtig gelöst werden kann.\n\nZwei-Millimeter-Sieb\n\nSieb mit zwei Millimeter Öffnungen für die Feinbodenfraktion in diesem Lehrverfahren.\n\nFeinbodenfraktion\n\nMaterial, das durch das festgelegte Sieb geht, während gröbere Steine und Reste getrennt werden.\n\nRückverfolgbarkeit der Probe\n\nDurchgehende Verbindung zwischen Feldprotokoll, Tabletts, Teilproben, Testergebnissen und Endbeutel.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s205-remainder-audio-20261023-r1'
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
