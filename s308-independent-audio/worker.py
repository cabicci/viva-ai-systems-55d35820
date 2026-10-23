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
IDS = ('S3-08-ar-EG-opening-r1', 'S3-08-ar-EG-guided-practice-r1', 'S3-08-ar-EG-reflection-r1', 'S3-08-ar-EG-glossary-r1', 'S3-08-en-opening-r1', 'S3-08-en-guided-practice-r1', 'S3-08-en-reflection-r1', 'S3-08-en-glossary-r1', 'S3-08-it-opening-r1', 'S3-08-it-guided-practice-r1', 'S3-08-it-reflection-r1', 'S3-08-it-glossary-r1', 'S3-08-de-opening-r1', 'S3-08-de-guided-practice-r1', 'S3-08-de-reflection-r1', 'S3-08-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S308_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-08')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s308-independent-audio-20261023-r1')
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
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1', '/glossary/8/0', '/glossary/8/1', '/glossary/9/0', '/glossary/9/1', '/glossary/10/0', '/glossary/10/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('Aridisol\n\nرتبة تربة مرتبطة بنظام رطوبة جاف وصفات قطاع تشخيصية، مش مجرد موقع حار أو رملي.\n\nمادة التربة العضوية OM\n\nمادة أصلها كائنات وتحللت، وقد تؤثر في بناء التربة وخزن الماء ودورة العناصر.\n\nالملوحة\n\nتركيز الأملاح الذائبة في ماء التربة ويُفسر بطريقة أخذ عينة واختبار معلنة.\n\nالتوصيل الكهربائي EC\n\nقياس مرتبط بالأملاح الذائبة؛ قيم مستخلصات التربة أو الميه بطرق مختلفة ما ينفعش تتبدّل ببعض.\n\nECe\n\nتوصيل مستخلص عجينة تربة مشبعة للمقارنة بجدول ينص على الطريقة والحرارة نفسيهما.\n\nECw\n\nتوصيل ماء الري، وهو قياس مختلف عن ECe للتربة.\n\nجفاف فسيولوجي\n\nصعوبة امتصاص الماء لأن الملح يقلل الجهد المائي للمحلول، حتى لو الماء موجود.\n\nغسل الأملاح\n\nانتقال الأملاح الذائبة مع ماء مناسب لأسفل الجذور لما الصرف يسمح بخروجها.\n\nكاليشي\n\nتراكم كربونات كالسيوم قد يعمل طبقة متماسكة تعوق الجذور أو حركة الماء لو تأكدت.\n\nملش\n\nغطاء لسطح التربة يؤثر في البخر والحرارة والتعرية؛ نوعه وسمكه يتحددان حسب الموقع.\n\nنبات ملحي\n\nنبات متكيف مع ملوحة نسبية؛ الاسم وحده ما يختارش محصولًا لمزرعة معينة.', 'أريديسول\n\nرتبة من رتب التربة مرتبطة بنظام رطوبة جاف وصفات قطاع تشخيصية، مش مجرد موقع حار أو رملي.\n\nمادة التربة العضوية\n\nمادة أصلها كائنات وتحللت، وقد تؤثر في بناء التربة وخزن الماء ودورة العناصر.\n\nالملوحة\n\nتركيز الأملاح الذائبة في ماء التربة ويُفسر بطريقة أخذ عينة واختبار معلنة.\n\nالتوصيل الكهربائي إي سي\n\nقياس مرتبط بالأملاح الذائبة؛ قيم مستخلصات التربة أو الميه بطرق مختلفة ما ينفعش تتبدّل ببعض.\n\nإي سي إي\n\nتوصيل مستخلص عجينة تربة مشبعة للمقارنة بجدول ينص على الطريقة والحرارة نفسيهما.\n\nإي سي دبليو\n\nتوصيل ماء الري، وهو قياس مختلف عن إي سي إي للتربة.\n\nجفاف فسيولوجي\n\nصعوبة امتصاص الماء لأن الملح يقلل الجهد المائي للمحلول، حتى لو الماء موجود.\n\nغسل الأملاح\n\nانتقال الأملاح الذائبة مع ماء مناسب لأسفل الجذور لما الصرف يسمح بخروجها.\n\nكاليشي\n\nتراكم كربونات كالسيوم قد يعمل طبقة متماسكة تعوق الجذور أو حركة الماء لو تأكدت.\n\nملش\n\nغطاء لسطح التربة يؤثر في البخر والحرارة والتعرية؛ نوعه وسمكه يتحددان حسب الموقع.\n\nنبات ملحي\n\nنبات متكيف مع ملوحة نسبية؛ الاسم وحده ما يختارش محصولًا لمزرعة معينة.'), ('صنّف خمس عبارات عن الحر والرمل والمادة العضوية والملوحة والكاليشي: معطى في الحالة، أو تفسير محتمل، أو تعميم محتاج إثبات؛ واذكر ملاحظة ممكن تختبر بيها تفسيرك.\n\nحط على قطاع تربة أسهم للمطر القليل، ودخول الأملاح مع الري، وحركة الميه السائلة لأعلى جوه التربة، وبخر الميه من السطح مع بقاء الأملاح، وتراكم الأملاح في منطقة الجذور، والصرف وغسل الأملاح. بعدين فرّق بين الإجهاد الأسموزي وسمّية الأيونات.\n\nاقرأ أبعاد القطعة ١٠ م × ١٠ م، وقوام اللوم الرملي، والمادة العضوية OM بنسبة ٠٫٨٪، وEC التربة بقيمة ٣٫٥ dS/m، ووصف ميه البئر. حدّد البيانات المذكورة في التقرير، وطريقة قياس التربة الناقصة، وهل ينفع نستخدم جدول ECe.\n\nارجع أي حكم عام على الصحراء لدليل القطاع والقوام وpH والكربونات.\n\nاختيارات الأونلاين تدريب تفسير بس. طريقة EC وكيمياء المياه والصرف وبيانات المحصول لسه ناقصة؛ مفيش تصنيف حقل نهائي ولا جرعة غسل ولا اجتياز عملي ولا توقيع بيتعملوا هنا.', 'صنّف خمس عبارات عن الحر والرمل والمادة العضوية والملوحة والكاليشي: معطى في الحالة، أو تفسير محتمل، أو تعميم محتاج إثبات؛ واذكر ملاحظة ممكن تختبر بيها تفسيرك.\n\nحط على قطاع تربة أسهم للمطر القليل، ودخول الأملاح مع الري، وحركة الميه السائلة لأعلى جوه التربة، وبخر الميه من السطح مع بقاء الأملاح، وتراكم الأملاح في منطقة الجذور، والصرف وغسل الأملاح. بعدين فرّق بين الإجهاد الأسموزي وسمّية الأيونات.\n\nاقرأ أبعاد القطعة عشرة متر مضروب في عشرة متر، وقوام اللوم الرملي، والمادة العضوية بنسبة صفر فاصلة تمانية في المية، وإي سي التربة بقيمة تلاتة فاصلة خمسة ديسي سيمنز لكل متر، ووصف ميه البئر. حدّد البيانات المذكورة في التقرير، وطريقة قياس التربة الناقصة، وهل ينفع نستخدم جدول إي سي إي.\n\nارجع أي حكم عام على الصحراء لدليل القطاع والقوام وبي إتش والكربونات.\n\nاختيارات الأونلاين تدريب تفسير بس. طريقة إي سي وكيمياء المياه والصرف وبيانات المحصول لسه ناقصة؛ مفيش تصنيف حقل نهائي ولا جرعة غسل ولا اجتياز عملي ولا توقيع بيتعملوا هنا.'), ('مش كل مشكلات الزراعة في المناطق الجافة زي بعض. استخدم قوام القطعة الفعلي ومادتها العضوية وطريقة اختبار الأملاح وتحليل الميه وقطاع التربة، عشان تفرّق بين نقص الميه وصعوبة امتصاصها.\n\nاشرح تأثير قلة الماء والمدخلات العضوية والقوام وضعف البناء وارتفاع pH وطبقة كربونات متماسكة مؤكدة في أرض جافة حقيقية، من غير ما تفترض إن كل الصحارى حارة أو رملية أو مالحة أو فيها كاليشي.\n\nفرّق بين نقص ماء فعلي، وصعوبة الامتصاص الأسموزية بسبب الملح، واختلال العناصر، وسمّية أيونات محتملة؛ وتتبع دخول الأملاح والبخر والغسل والصرف في رسم لمنطقة الجذور.\n\nاقرأ حالة اللوم الرملي ١٠×١٠ متر، والمادة العضوية ٠٫٨٪، وEC\u200f ٣٫٥ dS/m؛ اسأل عن نوع قياس EC وتحليل ماء البئر، ولا تستخدم إلا جدولًا بنفس الطريقة والوحدة.', 'مش كل مشكلات الزراعة في المناطق الجافة زي بعض. استخدم قوام القطعة الفعلي ومادتها العضوية وطريقة اختبار الأملاح وتحليل الميه وقطاع التربة، عشان تفرّق بين نقص الميه وصعوبة امتصاصها.\n\nاشرح تأثير قلة الماء والمدخلات العضوية والقوام وضعف البناء وارتفاع بي إتش وطبقة كربونات متماسكة مؤكدة في أرض جافة حقيقية، من غير ما تفترض إن كل الصحارى حارة أو رملية أو مالحة أو فيها كاليشي.\n\nفرّق بين نقص ماء فعلي، وصعوبة الامتصاص الأسموزية بسبب الملح، واختلال العناصر، وسمّية أيونات محتملة؛ وتتبع دخول الأملاح والبخر والغسل والصرف في رسم لمنطقة الجذور.\n\nاقرأ حالة اللوم الرملي عشرة مضروب في عشرة متر، والمادة العضوية صفر فاصلة تمانية في المية، وإي سي\u200f تلاتة فاصلة خمسة ديسي سيمنز لكل متر؛ اسأل عن نوع قياس إي سي وتحليل ماء البئر، ولا تستخدم إلا جدول بنفس الطريقة والوحدة.')], 'en': [("Aridisol\n\nA soil order tied to an aridic moisture regime and diagnostic profile features, not merely a hot or sandy location.\n\nsoil organic matter (OM)\n\nDecomposed living-origin material that can affect soil structure, moisture storage and nutrient cycling.\n\nsalinity\n\nConcentration of dissolved salts in soil water, interpreted using an explicitly stated sampling and test method.\n\nelectrical conductivity (EC)\n\nA measure associated with dissolved salts; values from different soil-extract or water methods are not interchangeable.\n\nECe\n\nElectrical conductivity of a saturated soil-paste extract, reported for comparison with a table explicitly based on that method and temperature.\n\nECw\n\nElectrical conductivity of irrigation water, a different measurement from soil ECe.\n\nphysiological drought\n\nDifficulty taking up water because dissolved salts lower the soil solution's water potential even while water is present.\n\nleaching\n\nDownward transport of dissolved salts with water below the root zone when suitable water and drainage permit it.\n\ncaliche\n\nCalcium-carbonate accumulation that can form a cemented soil layer and restrict roots or water movement if confirmed.\n\nmulch\n\nA cover placed on soil surface to influence evaporation, temperature and erosion; its choice and depth need site assessment.\n\nhalophyte\n\nA plant adapted to relatively saline conditions; the label alone does not select a crop for a specific farm.", "Aridisol\n\nA soil order tied to an aridic moisture regime and diagnostic profile features, not merely a hot or sandy location.\n\nsoil organic matter (organic matter)\n\nDecomposed living-origin material that can affect soil structure, moisture storage and nutrient cycling.\n\nsalinity\n\nConcentration of dissolved salts in soil water, interpreted using an explicitly stated sampling and test method.\n\nelectrical conductivity (E C)\n\nA measure associated with dissolved salts; values from different soil-extract or water methods are not interchangeable.\n\nE C e\n\nElectrical conductivity of a saturated soil-paste extract, reported for comparison with a table explicitly based on that method and temperature.\n\nE C w\n\nElectrical conductivity of irrigation water, a different measurement from soil E C e.\n\nphysiological drought\n\nDifficulty taking up water because dissolved salts lower the soil solution's water potential even while water is present.\n\nleaching\n\nDownward transport of dissolved salts with water below the root zone when suitable water and drainage permit it.\n\ncaliche\n\nCalcium-carbonate accumulation that can form a cemented soil layer and restrict roots or water movement if confirmed.\n\nmulch\n\nA cover placed on soil surface to influence evaporation, temperature and erosion; its choice and depth need site assessment.\n\nhalophyte\n\nA plant adapted to relatively saline conditions; the label alone does not select a crop for a specific farm."), ("Dryland farming problems are not all the same. Use the plot's actual texture, organic matter, salt test method, water analysis and profile to distinguish lack of water from difficulty taking up water.\n\nExplain how limited moisture, low organic input, texture, weak structure, alkaline conditions and a verified carbonate-cemented layer can affect an actual dryland soil, without declaring every desert hot, sandy, saline or caliche-bearing.\n\nDifferentiate physical water shortage, salt-induced osmotic difficulty of uptake, nutrient imbalance and possible ion toxicity; trace salt input, evaporation, leaching and drainage in a root-zone diagram.\n\nRead the 10 m × 10 m sandy-loam scenario with 0.8% organic matter and EC 3.5 dS/m, ask which EC test and water analysis produced the data, and apply only a table with a matching method and units.", "Dryland farming problems are not all the same. Use the plot's actual texture, organic matter, salt test method, water analysis and profile to distinguish lack of water from difficulty taking up water.\n\nExplain how limited moisture, low organic input, texture, weak structure, alkaline conditions and a verified carbonate-cemented layer can affect an actual dryland soil, without declaring every desert hot, sandy, saline or caliche-bearing.\n\nDifferentiate physical water shortage, salt-induced osmotic difficulty of uptake, nutrient imbalance and possible ion toxicity; trace salt input, evaporation, leaching and drainage in a root-zone diagram.\n\nRead the ten metres multiplied by ten metres sandy-loam scenario with zero point eight percent organic matter and E C three point five decisiemens per metre, ask which E C test and water analysis produced the data, and apply only a table with a matching method and units."), ('Sort five statements about heat, sand, OM, salinity and caliche into given case evidence, a possible mechanism or an untested stereotype; name an observation that could test the interpretation.\n\nPlace low rainfall, irrigation salt input, upward evaporation, root-zone accumulation and drainage/leaching arrows in a soil cross-section, then distinguish osmotic stress and ion toxicity.\n\nRead 10 m × 10 m, sandy loam, OM 0.8%, EC 3.5 dS/m and borewell description; decide which data are measured, which method is missing, and whether a stated ECe table can be applied.\n\nSend blanket desert claims back to profile, texture, pH and carbonate evidence.\n\nOnline choices rehearse interpretation. Real EC methods, water chemistry, drainage and crop evidence remain unknown; no field classification, leaching dose, physical pass or signature is created.', 'Sort five statements about heat, sand, organic matter, salinity and caliche into given case evidence, a possible mechanism or an untested stereotype; name an observation that could test the interpretation.\n\nPlace low rainfall, irrigation salt input, upward evaporation, root-zone accumulation and drainage, leaching arrows in a soil cross-section, then distinguish osmotic stress and ion toxicity.\n\nRead ten metres multiplied by ten metres, sandy loam, organic matter zero point eight percent, E C three point five decisiemens per metre and borewell description; decide which data are measured, which method is missing, and whether a stated E C e table can be applied.\n\nSend blanket desert claims back to profile, texture, P H and carbonate evidence.\n\nOnline choices rehearse interpretation. Real E C methods, water chemistry, drainage and crop evidence remain unknown; no field classification, leaching dose, physical pass or signature is created.')], 'it': [('Aridisol\n\nOrdine con regime idrico aridico e caratteristiche diagnostiche, non soltanto luogo caldo o sabbioso.\n\nsostanza organica del suolo (OM)\n\nMateriale decomposto di origine vivente che può modificare struttura, riserva idrica e ciclo dei nutrienti.\n\nsalinità\n\nConcentrazione di sali disciolti nella soluzione del suolo, interpretata con metodo dichiarato.\n\nconducibilità elettrica (EC)\n\nMisura legata ai sali; valori da estratti di suolo o acqua diversi non sono intercambiabili.\n\nECe\n\nConducibilità dell’estratto di pasta di suolo satura, da confrontare con tabella dello stesso metodo e temperatura.\n\nECw\n\nConducibilità dell’acqua irrigua, diversa dall’ECe del suolo.\n\nsiccità fisiologica\n\nDifficoltà di assorbire acqua perché i sali abbassano il potenziale della soluzione anche quando acqua è presente.\n\nlisciviazione\n\nTrasporto dei sali disciolti sotto le radici con acqua idonea e drenaggio disponibile.\n\ncaliche\n\nAccumulo di carbonato di calcio che può cementare uno strato e limitare radici o acqua se confermato.\n\npacciame\n\nCopertura superficiale che influenza evaporazione, temperatura ed erosione; scelta e spessore richiedono valutazione.\n\nalofita\n\nPianta adattata a condizioni relativamente saline; il nome da solo non sceglie una coltura per il campo.', 'Aridisol\n\nOrdine con regime idrico aridico e caratteristiche diagnostiche, non soltanto luogo caldo o sabbioso.\n\nsostanza organica del suolo (sostanza organica)\n\nMateriale decomposto di origine vivente che può modificare struttura, riserva idrica e ciclo dei nutrienti.\n\nsalinità\n\nConcentrazione di sali disciolti nella soluzione del suolo, interpretata con metodo dichiarato.\n\nconducibilità elettrica (e ci)\n\nMisura legata ai sali; valori da estratti di suolo o acqua diversi non sono intercambiabili.\n\ne ci e\n\nConducibilità dell’estratto di pasta di suolo satura, da confrontare con tabella dello stesso metodo e temperatura.\n\ne ci doppia vu\n\nConducibilità dell’acqua irrigua, diversa dall’e ci e del suolo.\n\nsiccità fisiologica\n\nDifficoltà di assorbire acqua perché i sali abbassano il potenziale della soluzione anche quando acqua è presente.\n\nlisciviazione\n\nTrasporto dei sali disciolti sotto le radici con acqua idonea e drenaggio disponibile.\n\ncaliche\n\nAccumulo di carbonato di calcio che può cementare uno strato e limitare radici o acqua se confermato.\n\npacciame\n\nCopertura superficiale che influenza evaporazione, temperatura ed erosione; scelta e spessore richiedono valutazione.\n\nalofita\n\nPianta adattata a condizioni relativamente saline; il nome da solo non sceglie una coltura per il campo.'), ('Classifica cinque affermazioni su caldo, sabbia, OM, salinità e caliche come dato fornito nel caso, possibile meccanismo o stereotipo non verificato; indica un’osservazione che potrebbe verificare l’interpretazione.\n\nDisponi in una sezione del suolo le piogge scarse, i sali apportati dall’irrigazione, la risalita dell’acqua liquida nel suolo, l’evaporazione superficiale che lascia i sali, l’accumulo nella zona radicale e le frecce di drenaggio e lisciviazione. Distingui lo stress osmotico dalla tossicità ionica.\n\nLeggi i dati riportati: parcella di 10 m × 10 m, franco sabbioso, OM 0,8%, EC del suolo 3,5 dS/m e descrizione dell’acqua del pozzo. Individua i dati forniti e il metodo di estrazione mancante, poi decidi se si può applicare una tabella ECe.\n\nRimanda generalizzazioni desertiche a profilo, tessitura, pH e carbonati.\n\nLe scelte online esercitano l’interpretazione. Mancano ancora dati sui metodi EC, sulla chimica dell’acqua, sul drenaggio e sulla coltura. Non si determina una classificazione del sito o una quantità d’acqua per la lisciviazione, né si registra un superamento pratico o una firma.', 'Classifica cinque affermazioni su caldo, sabbia, sostanza organica, salinità e caliche come dato fornito nel caso, possibile meccanismo o stereotipo non verificato; indica un’osservazione che potrebbe verificare l’interpretazione.\n\nDisponi in una sezione del suolo le piogge scarse, i sali apportati dall’irrigazione, la risalita dell’acqua liquida nel suolo, l’evaporazione superficiale che lascia i sali, l’accumulo nella zona radicale e le frecce di drenaggio e lisciviazione. Distingui lo stress osmotico dalla tossicità ionica.\n\nLeggi i dati riportati: parcella di dieci metri moltiplicato per dieci metri, franco sabbioso, sostanza organica zero virgola otto per cento, e ci del suolo tre virgola cinque decisiemens per metro e descrizione dell’acqua del pozzo. Individua i dati forniti e il metodo di estrazione mancante, poi decidi se si può applicare una tabella e ci e.\n\nRimanda generalizzazioni desertiche a profilo, tessitura, pi acca e carbonati.\n\nLe scelte online esercitano l’interpretazione. Mancano ancora dati sui metodi e ci, sulla chimica dell’acqua, sul drenaggio e sulla coltura. Non si determina una classificazione del sito o una quantità d’acqua per la lisciviazione, né si registra un superamento pratico o una firma.'), ('I problemi agricoli nelle aree aride non sono tutti uguali. Usa tessitura reale, sostanza organica, metodo di analisi dei sali, analisi dell’acqua e profilo del terreno per distinguere mancanza d’acqua e difficoltà di assorbimento.\n\nSpiega come scarsa acqua, basso apporto organico, tessitura, struttura debole, alcalinità e un orizzonte carbonatico cementato verificato possono influire su un suolo arido reale, senza chiamare ogni deserto caldo, sabbioso, salino o con caliche.\n\nDistingui mancanza fisica d’acqua, difficoltà osmotica da sali, squilibri nutrizionali e possibili tossicità ioniche; traccia apporto di sali, evaporazione, lisciviazione e drenaggio in sezione radicale.\n\nLeggi il caso franco sabbioso 10 m × 10 m, sostanza organica 0,8% ed EC 3,5 dS/m; chiedi metodo EC e analisi dell’acqua del pozzo e applica soltanto tabelle con metodo e unità corrispondenti.', 'I problemi agricoli nelle aree aride non sono tutti uguali. Usa tessitura reale, sostanza organica, metodo di analisi dei sali, analisi dell’acqua e profilo del terreno per distinguere mancanza d’acqua e difficoltà di assorbimento.\n\nSpiega come scarsa acqua, basso apporto organico, tessitura, struttura debole, alcalinità e un orizzonte carbonatico cementato verificato possono influire su un suolo arido reale, senza chiamare ogni deserto caldo, sabbioso, salino o con caliche.\n\nDistingui mancanza fisica d’acqua, difficoltà osmotica da sali, squilibri nutrizionali e possibili tossicità ioniche; traccia apporto di sali, evaporazione, lisciviazione e drenaggio in sezione radicale.\n\nLeggi il caso franco sabbioso dieci metri moltiplicato per dieci metri, sostanza organica zero virgola otto per cento ed e ci tre virgola cinque decisiemens per metro; chiedi metodo e ci e analisi dell’acqua del pozzo e applica soltanto tabelle con metodo e unità corrispondenti.')], 'de': [('Aridisol\n\nOrdnung mit aridischem Feuchteregime und Profilmerkmalen, nicht nur ein heißer/sandiger Ort.\n\norganische Bodensubstanz (OM)\n\nZersetztes Material lebender Herkunft, das Gefüge, Wasserspeicher und Nährstoffkreislauf beeinflussen kann.\n\nSalinität\n\nKonzentration gelöster Salze im Bodenwasser, auszulegen mit benannter Probe- und Prüfmethode.\n\nelektrische Leitfähigkeit (EC)\n\nMit gelösten Salzen zusammenhängendes Maß; Werte verschiedener Bodenextrakte und Wasser sind nicht austauschbar.\n\nECe\n\nLeitfähigkeit des gesättigten Bodenpastenextrakts, verglichen nur mit einer Tabelle gleicher Methode/Temperatur.\n\nECw\n\nLeitfähigkeit des Bewässerungswassers, eine andere Größe als Boden-ECe.\n\nphysiologische Trockenheit\n\nErschwerte Wasseraufnahme, weil Salze das Wasserpotenzial senken, obwohl Wasser vorhanden ist.\n\nAuswaschung\n\nTransport gelöster Salze mit geeignetem Wasser unter Wurzeln, wenn Abfluss das erlaubt.\n\nKaliche\n\nCarbonatanreicherung, die bestätigt als verfestigte Schicht Wurzeln oder Wasser behindern kann.\n\nMulch\n\nBodenbedeckung, die Verdunstung, Temperatur und Erosion beeinflusst; Material/Dicke sind standortspezifisch.\n\nHalophyt\n\nAn relativ salzige Bedingungen angepasste Pflanze; die Bezeichnung wählt noch keine Feldkultur aus.', 'Aridisol\n\nOrdnung mit aridischem Feuchteregime und Profilmerkmalen, nicht nur ein heißer, sandiger Ort.\n\norganische Bodensubstanz (organische Substanz)\n\nZersetztes Material lebender Herkunft, das Gefüge, Wasserspeicher und Nährstoffkreislauf beeinflussen kann.\n\nSalinität\n\nKonzentration gelöster Salze im Bodenwasser, auszulegen mit benannter Probe- und Prüfmethode.\n\nelektrische Leitfähigkeit (E Ce)\n\nMit gelösten Salzen zusammenhängendes Maß; Werte verschiedener Bodenextrakte und Wasser sind nicht austauschbar.\n\nE Ce E\n\nLeitfähigkeit des gesättigten Bodenpastenextrakts, verglichen nur mit einer Tabelle gleicher Methode, Temperatur.\n\nE Ce We\n\nLeitfähigkeit des Bewässerungswassers, eine andere Größe als Boden-E Ce E.\n\nphysiologische Trockenheit\n\nErschwerte Wasseraufnahme, weil Salze das Wasserpotenzial senken, obwohl Wasser vorhanden ist.\n\nAuswaschung\n\nTransport gelöster Salze mit geeignetem Wasser unter Wurzeln, wenn Abfluss das erlaubt.\n\nKaliche\n\nCarbonatanreicherung, die bestätigt als verfestigte Schicht Wurzeln oder Wasser behindern kann.\n\nMulch\n\nBodenbedeckung, die Verdunstung, Temperatur und Erosion beeinflusst; Material, Dicke sind standortspezifisch.\n\nHalophyt\n\nAn relativ salzige Bedingungen angepasste Pflanze; die Bezeichnung wählt noch keine Feldkultur aus.'), ('Ordne fünf Aussagen zu Hitze, Sand, OM, Salz und Kaliche als Angabe im Lehrfall, möglichen Mechanismus oder ungeprüftes Klischee ein. Nenne eine Beobachtung, mit der sich die Auslegung prüfen ließe.\n\nTrage wenig Regen, Salzeintrag mit Bewässerungswasser, die Aufwärtsbewegung flüssigen Wassers im Boden, Oberflächenverdunstung mit zurückbleibenden Salzen, Salzanreicherung im Wurzelraum sowie Auswaschungs- und Entwässerungspfeile in den Bodenschnitt ein. Trenne osmotischen Stress von Ionentoxizität.\n\nLies die Angaben zur 10 m × 10 m großen Fläche: sandiger Lehm, OM 0,8%, Boden-EC 3,5 dS/m und die Beschreibung des Brunnenwassers. Welche Daten werden berichtet, welche Extraktionsmethode fehlt und darf eine ECe-Tabelle angewendet werden?\n\nAllgemeine Wüstenbehauptungen zu Profil, Textur, pH und Carbonatbelegen zurückführen.\n\nOnline übt Interpretation. EC-Methode, Wasserchemie, Drainage und Kulturdaten fehlen; keine reale Klassifikation, Spülmenge, Unterschrift oder praktische Kompetenz wird erzeugt.', 'Ordne fünf Aussagen zu Hitze, Sand, organische Substanz, Salz und Kaliche als Angabe im Lehrfall, möglichen Mechanismus oder ungeprüftes Klischee ein. Nenne eine Beobachtung, mit der sich die Auslegung prüfen ließe.\n\nTrage wenig Regen, Salzeintrag mit Bewässerungswasser, die Aufwärtsbewegung flüssigen Wassers im Boden, Oberflächenverdunstung mit zurückbleibenden Salzen, Salzanreicherung im Wurzelraum sowie Auswaschungs- und Entwässerungspfeile in den Bodenschnitt ein. Trenne osmotischen Stress von Ionentoxizität.\n\nLies die Angaben zur zehn Meter mal zehn Meter großen Fläche: sandiger Lehm, organische Substanz null Komma acht Prozent, Boden-E Ce drei Komma fünf Dezisiemens pro Meter und die Beschreibung des Brunnenwassers. Welche Daten werden berichtet, welche Extraktionsmethode fehlt und darf eine E Ce E-Tabelle angewendet werden?\n\nAllgemeine Wüstenbehauptungen zu Profil, Textur, Pe Ha und Carbonatbelegen zurückführen.\n\nOnline übt Interpretation. E Ce-Methode, Wasserchemie, Drainage und Kulturdaten fehlen; keine reale Klassifikation, Spülmenge, Unterschrift oder praktische Kompetenz wird erzeugt.'), ('Probleme der Trockenlandwirtschaft sind nicht alle gleich. Nutze die tatsächliche Textur, organische Substanz, Salztestmethode, Wasseranalyse und das Bodenprofil der Fläche, um Wassermangel von Schwierigkeiten bei der Wasseraufnahme zu unterscheiden.\n\nErkläre, wie knappe Feuchte, geringe organische Einträge, Textur, schwache Struktur, alkalische Verhältnisse und eine nachgewiesene karbonatverfestigte Schicht einen tatsächlichen Trockenboden beeinflussen können, ohne jede Wüste als heiß, sandig, salzig oder kalichehaltig zu bezeichnen.\n\nUnterscheide echten Wassermangel, salzbedingte osmotische Aufnahmehemmung, Nährstoffungleichgewicht und mögliche Ionentoxizität; zeichne Salzzufuhr, Verdunstung, Auswaschung und Entwässerung im Wurzelraum.\n\nLies den Fall eines 10 m × 10 m großen sandigen Lehms mit 0,8 % organischer Substanz und EC 3,5 dS/m. Frage nach EC-Test und Brunnenwasseranalyse und nutze nur Tabellen mit passender Methode und passenden Einheiten.', 'Probleme der Trockenlandwirtschaft sind nicht alle gleich. Nutze die tatsächliche Textur, organische Substanz, Salztestmethode, Wasseranalyse und das Bodenprofil der Fläche, um Wassermangel von Schwierigkeiten bei der Wasseraufnahme zu unterscheiden.\n\nErkläre, wie knappe Feuchte, geringe organische Einträge, Textur, schwache Struktur, alkalische Verhältnisse und eine nachgewiesene karbonatverfestigte Schicht einen tatsächlichen Trockenboden beeinflussen können, ohne jede Wüste als heiß, sandig, salzig oder kalichehaltig zu bezeichnen.\n\nUnterscheide echten Wassermangel, salzbedingte osmotische Aufnahmehemmung, Nährstoffungleichgewicht und mögliche Ionentoxizität; zeichne Salzzufuhr, Verdunstung, Auswaschung und Entwässerung im Wurzelraum.\n\nLies den Fall eines zehn Meter mal zehn Meter großen sandigen Lehms mit null Komma acht Prozent organischer Substanz und E Ce drei Komma fünf Dezisiemens pro Meter. Frage nach E Ce-Test und Brunnenwasseranalyse und nutze nur Tabellen mit passender Methode und passenden Einheiten.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s308-independent-audio-20261023-r1'
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
