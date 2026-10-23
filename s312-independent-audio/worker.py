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
IDS = ('S3-12-ar-EG-opening-r1', 'S3-12-ar-EG-guided-practice-r1', 'S3-12-ar-EG-specification-r1', 'S3-12-ar-EG-glossary-r1', 'S3-12-en-opening-r1', 'S3-12-en-guided-practice-r1', 'S3-12-en-specification-r1', 'S3-12-en-glossary-r1', 'S3-12-it-opening-r1', 'S3-12-it-guided-practice-r1', 'S3-12-it-specification-r1', 'S3-12-it-glossary-r1', 'S3-12-de-opening-r1', 'S3-12-de-guided-practice-r1', 'S3-12-de-specification-r1', 'S3-12-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S312_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-12')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s312-independent-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening','guided-practice','specification','glossary']
        voice='Charon'if group in ['opening','specification']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'specification': ['/growingMedium/ui/specTitle', '/growingMedium/ui/specHelp', '/growingMedium/ui/specFields/0', '/growingMedium/ui/specFields/1', '/growingMedium/ui/specFields/2', '/growingMedium/ui/specFields/3', '/growingMedium/ui/specFields/4', '/growingMedium/ui/specFields/5', '/growingMedium/ui/specFields/6', '/growingMedium/ui/specFields/7', '/growingMedium/ui/specFields/8', '/growingMedium/ui/specFields/9', '/growingMedium/ui/specFields/10', '/growingMedium/ui/specFields/11', '/growingMedium/ui/specFields/12', '/growingMedium/ui/specFields/13', '/growingMedium/ui/specFields/14'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'specification': ['/growingMedium/ui/specTitle', '/growingMedium/ui/specHelp', '/growingMedium/ui/specFields/0', '/growingMedium/ui/specFields/1', '/growingMedium/ui/specFields/2', '/growingMedium/ui/specFields/3', '/growingMedium/ui/specFields/4', '/growingMedium/ui/specFields/5', '/growingMedium/ui/specFields/6', '/growingMedium/ui/specFields/7', '/growingMedium/ui/specFields/8', '/growingMedium/ui/specFields/9', '/growingMedium/ui/specFields/10', '/growingMedium/ui/specFields/11', '/growingMedium/ui/specFields/12', '/growingMedium/ui/specFields/13', '/growingMedium/ui/specFields/14'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'specification': ['/growingMedium/ui/specTitle', '/growingMedium/ui/specHelp', '/growingMedium/ui/specFields/0', '/growingMedium/ui/specFields/1', '/growingMedium/ui/specFields/2', '/growingMedium/ui/specFields/3', '/growingMedium/ui/specFields/4', '/growingMedium/ui/specFields/5', '/growingMedium/ui/specFields/6', '/growingMedium/ui/specFields/7', '/growingMedium/ui/specFields/8', '/growingMedium/ui/specFields/9', '/growingMedium/ui/specFields/10', '/growingMedium/ui/specFields/11', '/growingMedium/ui/specFields/12', '/growingMedium/ui/specFields/13', '/growingMedium/ui/specFields/14'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'specification': ['/growingMedium/ui/specTitle', '/growingMedium/ui/specHelp', '/growingMedium/ui/specFields/0', '/growingMedium/ui/specFields/1', '/growingMedium/ui/specFields/2', '/growingMedium/ui/specFields/3', '/growingMedium/ui/specFields/4', '/growingMedium/ui/specFields/5', '/growingMedium/ui/specFields/6', '/growingMedium/ui/specFields/7', '/growingMedium/ui/specFields/8', '/growingMedium/ui/specFields/9', '/growingMedium/ui/specFields/10', '/growingMedium/ui/specFields/11', '/growingMedium/ui/specFields/12', '/growingMedium/ui/specFields/13', '/growingMedium/ui/specFields/14'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1', '/glossary/7/0', '/glossary/7/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('تربة لوم معدنية\n\nفئة قوام من رمل وسلت وطين، مش وصفة أصص أو ضمان عناصر.\n\nوسط زراعة\n\nمادة تسند جذور الوعاء ولها خواص هوا وماء وعناصر لازم تتدار.\n\nكمبوست\n\nمادة عضوية متحللة تختلف في النضج والعناصر والأملاح.\n\nبيرلايت\n\nمكوّن مسامي خفيف لتغيير سلوك الهوا والماء، مش سماد عناصر.\n\nمسحوق عظام\n\nمصدر فوسفور مُصنَّع من مادة من أصل حيواني، بيتضاف بس لما مواصفة مبنية على فحص تبرر استخدامه.\n\nنسبة بالحجم\n\nأجزاء مقاسة باللتر مثلًا؛ ما تتحولش لنفس الأرقام بالوزن بلا كثافة.\n\nنسبة بالوزن\n\nأجزاء مقاسة بالكتلة؛ مكوّن منتج ٥ كجم يساوي ٥ كجم في كسره الكتلي المعتمد.\n\nسماحية\n\nفرق الوزن الصافي المقبول المعلن من المدرّب، مش رقم بنخمنه.', 'تربة لوم معدنية\n\nفئة قوام من رمل وسلت وطين، مش وصفة أصص أو ضمان عناصر.\n\nوسط زراعة\n\nمادة تسند جذور الوعاء ولها خواص هوا وماء وعناصر لازم تتدار.\n\nكمبوست\n\nمادة عضوية متحللة تختلف في النضج والعناصر والأملاح.\n\nبيرلايت\n\nمكوّن مسامي خفيف لتغيير سلوك الهوا والماء، مش سماد عناصر.\n\nمسحوق عظام\n\nمصدر فوسفور مُصنَّع من مادة من أصل حيواني، بيتضاف بس لما مواصفة مبنية على فحص تبرر استخدامه.\n\nنسبة بالحجم\n\nأجزاء مقاسة باللتر مثلًا؛ ما تتحولش لنفس الأرقام بالوزن بلا كثافة.\n\nنسبة بالوزن\n\nأجزاء مقاسة بالكتلة؛ مكوّن منتج خمسة كيلوجرام يساوي خمسة كيلوجرام في كسره الكتلي المعتمد.\n\nسماحية\n\nفرق الوزن الصافي المقبول المعلن من المدرّب، مش رقم بنخمنه.'), ('صنف أرقام السياقات الثلاثة: حجم أو كتلة أو غير محدد أو وزن منتج نهائي. على بطاقة مدرّب فارغة احسب أوزانًا رمزية لمكونات ٥ كجم واشرح ليه ١:٢ بالحجم مش ١:٢ بالوزن.\n\nتحت إشراف مدرّب، نفّذ كل بنود بطاقة عملية العينات الثلاث وحوض الطين، وقس على أساس نسبة معتمدة واخلط ونظف المكان.\n\nتحت إشراف المدرّب، اقرأ مواصفة الـ٥ كجم الموقعة، واحسب كمية كل مكوّن معتمد وازنها، واخلط بالتساوي، وازن المنتج الصافي، وعبّيه واقفل الكيس واكتب ملصق بالمكونات الحقيقية.\n\nاقبل المعادلة السليمة وتحديد البيانات الناقصة؛ ارفض وصفة كمبوست/بيرلايت/عظام مخترعة.\n\nده تدريب على قراءة المواصفات وشرح القرارات. الشاشة دي ما بتوفرش دفعة فعلية أو قياس أو توقيع مدرّب أو اجتياز عملي. الشغل الحقيقي محتاج مواصفة المدرّب الموثقة وملاحظة كل طالب بشكل فردي.', 'صنف أرقام السياقات الثلاثة: حجم أو كتلة أو غير محدد أو وزن منتج نهائي. على بطاقة مدرّب فارغة احسب أوزانًا رمزية لمكونات خمسة كيلوجرام واشرح ليه واحد لاتنين بالحجم مش واحد لاتنين بالوزن.\n\nتحت إشراف مدرّب، نفّذ كل بنود بطاقة عملية العينات الثلاث وحوض الطين، وقس على أساس نسبة معتمدة واخلط ونظف المكان.\n\nتحت إشراف المدرّب، اقرأ مواصفة الـخمسة كيلوجرام الموقعة، واحسب كمية كل مكوّن معتمد وازنها، واخلط بالتساوي، وازن المنتج الصافي، وعبّيه واقفل الكيس واكتب ملصق بالمكونات الحقيقية.\n\nاقبل المعادلة السليمة وتحديد البيانات الناقصة؛ ارفض وصفة كمبوست، بيرلايت، عظام مخترعة.\n\nده تدريب على قراءة المواصفات وشرح القرارات. الشاشة دي ما بتوفرش دفعة فعلية أو قياس أو توقيع مدرّب أو اجتياز عملي. الشغل الحقيقي محتاج مواصفة المدرّب الموثقة وملاحظة كل طالب بشكل فردي.'), ('فئة قوام لتربة معدنية، وحوض تجريبي فيه طين، وخلطة أصص للطماطم: دول ثلاث حاجات مختلفة. قبل ما تحسب أو تخلط، اقرأ مواصفة المدرّب واعرف النسب بالوزن ولا بالحجم.\n\nفرّق بين قوام تربة لوم معدنية وبين وسط أصص، واشرح وظيفة وحدود الطين والكمبوست والبيرلايت ومصدر الفوسفور. حدد إذا النسبة بالوزن ولا بالحجم، واحسب فقط لما توصلك مواصفة موثقة.\n\nتحت إشراف المدرّب، صنّف ثلاث عينات تربة حقيقية باللمس، واختار الطينية المؤكدة، وقس واخلط وافحص وسط الحوض التجريبي حسب المواصفة المعلنة. نسبة الأصل التقريبية جزء كمبوست إلى جزأين تربة مثال غير متحقق منه، مش وصفة عامة.\n\nاحسب ونفذ بنفسك منتج أصص طماطم وزنه ٥ كجم حسب مواصفة المدرّب المكتوبة للمكونات والنسب وحالة الرطوبة وسماحية الوزن والجودة؛ افحص التجانس والوزن والتعبئة والملصق وسبب اختيار كل مكوّن.', 'فئة قوام لتربة معدنية، وحوض تجريبي فيه طين، وخلطة أصص للطماطم: دول ثلاث حاجات مختلفة. قبل ما تحسب أو تخلط، اقرأ مواصفة المدرّب واعرف النسب بالوزن ولا بالحجم.\n\nفرّق بين قوام تربة لوم معدنية وبين وسط أصص، واشرح وظيفة وحدود الطين والكمبوست والبيرلايت ومصدر الفوسفور. حدد إذا النسبة بالوزن ولا بالحجم، واحسب فقط لما توصلك مواصفة موثقة.\n\nتحت إشراف المدرّب، صنّف ثلاث عينات تربة حقيقية باللمس، واختار الطينية المؤكدة، وقس واخلط وافحص وسط الحوض التجريبي حسب المواصفة المعلنة. نسبة الأصل التقريبية جزء كمبوست إلى جزأين تربة مثال غير متحقق منه، مش وصفة عامة.\n\nاحسب ونفذ بنفسك منتج أصص طماطم وزنه خمسة كيلوجرام حسب مواصفة المدرّب المكتوبة للمكونات والنسب وحالة الرطوبة وسماحية الوزن والجودة؛ افحص التجانس والوزن والتعبئة والملصق وسبب اختيار كل مكوّن.'), ('مواصفة مدرّب فاضية — جهّز بطاقة منفصلة لكل مهمة حقيقية\n\nدي خانات تخطيط فاضية. ملؤها مش بيعمل موافقة مدرّب. ما تختلقش نسب ناقصة، أو كثافات، أو أهداف pH، أو كميات، أو سماحية. منتج الـ٥ كجم والوعاء التعليمي بتربته الطينية محتاجين مواصفتين منفصلتين.\n\nهوية المهمة\n\nالغرض والمحصول أو سياق الاستخدام، وهدف الحموضة اللي المدرّب بيحدده وطريقة اختباره\n\nاسم المدرّب\n\nتاريخ إصدار المواصفة\n\nدفعات المكونات وجودتها وتحاليلها\n\nأساس الخلط: كتلة ولا حجم\n\nالكسور المعتمدة أو كميات المكونات\n\nهل تربة طينية معدنية داخلة في الخلطة\n\nدليل احتياج الفوسفور والمصدر المسموح لو فيه احتياج\n\nحالة الرطوبة المستخدمة وقت الوزن\n\nالكتلة الصافية النهائية المطلوبة بالكجم، لو ده ينطبق\n\nفرق الكتلة المسموح بالكجم، لو ده ينطبق\n\nاختبار صرف الوعاء وحدود القبول، أو متطلبات الكيس\n\nمتطلبات الملصق\n\nموافقة المدرّب — سيبها فاضية لحد ما تتعطى فعلًا', 'مواصفة مدرّب فاضية — جهّز بطاقة منفصلة لكل مهمة حقيقية\n\nدي خانات تخطيط فاضية. ملؤها مش بيعمل موافقة مدرّب. ما تختلقش نسب ناقصة، أو كثافات، أو أهداف بي إتش، أو كميات، أو سماحية. منتج الـخمسة كيلوجرام والوعاء التعليمي بتربته الطينية محتاجين مواصفتين منفصلتين.\n\nهوية المهمة\n\nالغرض والمحصول أو سياق الاستخدام، وهدف الحموضة اللي المدرّب بيحدده وطريقة اختباره\n\nاسم المدرّب\n\nتاريخ إصدار المواصفة\n\nدفعات المكونات وجودتها وتحاليلها\n\nأساس الخلط: كتلة ولا حجم\n\nالكسور المعتمدة أو كميات المكونات\n\nهل تربة طينية معدنية داخلة في الخلطة\n\nدليل احتياج الفوسفور والمصدر المسموح لو فيه احتياج\n\nحالة الرطوبة المستخدمة وقت الوزن\n\nالكتلة الصافية النهائية المطلوبة بالكيلوجرام، لو ده ينطبق\n\nفرق الكتلة المسموح بالكيلوجرام، لو ده ينطبق\n\nاختبار صرف الوعاء وحدود القبول، أو متطلبات الكيس\n\nمتطلبات الملصق\n\nموافقة المدرّب — سيبها فاضية لحد ما تتعطى فعلًا')], 'en': [("A mineral soil texture class, a clay-amended teaching container and a tomato potting blend are different things. Read the trainer's material specification and its mass or volume basis before calculating or mixing.\n\nExplain the distinct functions and limits of clay mineral soil, compost, perlite and a phosphorus source; identify whether a recipe is by mass or volume and calculate amounts only from a supplied documented specification.\n\nUnder a trainer, identify three real soil samples by feel, select the confirmed clay sample, then measure, mix and assess its separate teaching-container amendment to an announced specification; treat the source's approximate 1 part compost to 2 parts soil as an unverified example, not a general recipe.\n\nIndividually calculate and make a 5 kg tomato potting product to the trainer's documented ingredient, proportion, moisture/weight-tolerance and quality specification; check uniformity, final mass, packaging, label and the agronomic reason for each authorized component.", "A mineral soil texture class, a clay-amended teaching container and a tomato potting blend are different things. Read the trainer's material specification and its mass or volume basis before calculating or mixing.\n\nExplain the distinct functions and limits of clay mineral soil, compost, perlite and a phosphorus source; identify whether a recipe is by mass or volume and calculate amounts only from a supplied documented specification.\n\nUnder a trainer, identify three real soil samples by feel, select the confirmed clay sample, then measure, mix and assess its separate teaching-container amendment to an announced specification; treat the source's approximate one part compost to two parts soil as an unverified example, not a general recipe.\n\nIndividually calculate and make a five kilograms tomato potting product to the trainer's documented ingredient, proportion, moisture, weight-tolerance and quality specification; check uniformity, final mass, packaging, label and the agronomic reason for each authorized component."), ('Blank trainer specification — prepare a separate card for each real task\n\nThese are blank planning fields. Filling them does not create trainer approval. Do not invent missing ratios, densities, pH targets, quantities or tolerance. The 5 kg product and the clay teaching container need separate specifications.\n\nTask identity\n\nPurpose, crop/context and trainer-defined acidity target and test method\n\nTrainer name\n\nIssue date\n\nIngredient batches, quality and analysis\n\nMixing basis: mass or volume\n\nAuthorized fractions or component amounts\n\nWhether mineral clay is included\n\nEvidence of phosphorus need and authorized source, if any\n\nMoisture condition used for weighing\n\nRequired finished net mass in kg, where applicable\n\nPermitted mass deviation in kg, where applicable\n\nContainer drainage test and acceptance limits, or bag requirements\n\nLabel requirements\n\nTrainer approval — leave blank until actually given', 'Blank trainer specification — prepare a separate card for each real task\n\nThese are blank planning fields. Filling them does not create trainer approval. Do not invent missing ratios, densities, P H targets, quantities or tolerance. The five kilograms product and the clay teaching container need separate specifications.\n\nTask identity\n\nPurpose, crop, context and trainer-defined acidity target and test method\n\nTrainer name\n\nIssue date\n\nIngredient batches, quality and analysis\n\nMixing basis: mass or volume\n\nAuthorized fractions or component amounts\n\nWhether mineral clay is included\n\nEvidence of phosphorus need and authorized source, if any\n\nMoisture condition used for weighing\n\nRequired finished net mass in kilograms, where applicable\n\nPermitted mass deviation in kilograms, where applicable\n\nContainer drainage test and acceptance limits, or bag requirements\n\nLabel requirements\n\nTrainer approval — leave blank until actually given'), ('Mark which figures in the three source contexts are volume, mass, unspecified or a finished-product mass. On a blank trainer card, calculate symbolic ingredient masses for 5 kg and explain why a 1:2 volume ratio is not 1:2 by weight.\n\nUnder a trainer, perform every item in the three-sample clay-container process card, measure according to an approved ratio basis, mix and clean the station.\n\nUnder a trainer, read the signed 5 kg specification, calculate and weigh each approved component, mix evenly, weigh the net product, bag/seal and label it with true ingredients.\n\nAccept correct algebra and explicitly missing data; reject an invented compost/perlite/bone-meal recipe.\n\nThis is practice in reading specifications and explaining decisions. No actual batch, measurement, trainer signature or practical pass is supplied by this screen. Real work requires the trainer’s documented specification and individual observation.', 'Mark which figures in the three source contexts are volume, mass, unspecified or a finished-product mass. On a blank trainer card, calculate symbolic ingredient masses for five kilograms and explain why a one to two volume ratio is not one to two by weight.\n\nUnder a trainer, perform every item in the three-sample clay-container process card, measure according to an approved ratio basis, mix and clean the station.\n\nUnder a trainer, read the signed five kilograms specification, calculate and weigh each approved component, mix evenly, weigh the net product, bag, seal and label it with true ingredients.\n\nAccept correct algebra and explicitly missing data; reject an invented compost, perlite, bone-meal recipe.\n\nThis is practice in reading specifications and explaining decisions. No actual batch, measurement, trainer signature or practical pass is supplied by this screen. Real work requires the trainer’s documented specification and individual observation.'), ('mineral loam\n\nA sand/silt/clay texture class, not a promised potting recipe or nutrient result.\n\ngrowing medium\n\nThe material supporting container roots, with physical air/water properties and managed nutrients.\n\ncompost\n\nDecomposed organic material with variable maturity, nutrients and soluble salts.\n\nperlite\n\nA light porous physical ingredient used to change air and water behaviour, not a nutrient fertilizer.\n\nbone meal\n\nA processed animal-derived phosphorus source, added only when a test-based specification justifies it.\n\nratio by volume\n\nParts measured as volume, such as litres; cannot be treated as the same numerical ratio by mass without density data.\n\nratio by mass\n\nParts measured by weight; for a 5 kg total, component mass equals 5 kg times its approved mass fraction.\n\ntolerance\n\nThe trainer-approved acceptable deviation from the specified finished net mass, not a guessed number.', 'mineral loam\n\nA sand, silt, clay texture class, not a promised potting recipe or nutrient result.\n\ngrowing medium\n\nThe material supporting container roots, with physical air, water properties and managed nutrients.\n\ncompost\n\nDecomposed organic material with variable maturity, nutrients and soluble salts.\n\nperlite\n\nA light porous physical ingredient used to change air and water behaviour, not a nutrient fertilizer.\n\nbone meal\n\nA processed animal-derived phosphorus source, added only when a test-based specification justifies it.\n\nratio by volume\n\nParts measured as volume, such as litres; cannot be treated as the same numerical ratio by mass without density data.\n\nratio by mass\n\nParts measured by weight; for a five kilograms total, component mass equals five kilograms times its approved mass fraction.\n\ntolerance\n\nThe trainer-approved acceptable deviation from the specified finished net mass, not a guessed number.')], 'it': [('Classifica le cifre dei tre casi in volume, massa, base non indicata o massa finale. Su scheda vuota calcola simbolicamente i componenti di 5 kg e spiega perché 1:2 in volume non è 1:2 in peso.\n\nCon il formatore completa ogni atto della scheda dei tre campioni e contenitore argilloso; misura sulla base approvata, mescola e pulisci.\n\nCon il formatore leggi la specifica firmata per 5 kg, calcola e pesa componenti ammessi, miscela, pesa il netto, insacca, chiudi ed etichetta gli ingredienti veri.\n\nAccetta algebra e dati mancanti espliciti; respingi una ricetta inventata.\n\nQuesta è un’esercitazione sulla lettura delle specifiche e sulla spiegazione delle decisioni. La schermata non fornisce un lotto reale, una misura, una firma del formatore o un superamento pratico. Il lavoro reale richiede la specifica documentata del formatore e l’osservazione individuale.', 'Classifica le cifre dei tre casi in volume, massa, base non indicata o massa finale. Su scheda vuota calcola simbolicamente i componenti di cinque chilogrammi e spiega perché uno a due in volume non è uno a due in peso.\n\nCon il formatore completa ogni atto della scheda dei tre campioni e contenitore argilloso; misura sulla base approvata, mescola e pulisci.\n\nCon il formatore leggi la specifica firmata per cinque chilogrammi, calcola e pesa componenti ammessi, miscela, pesa il netto, insacca, chiudi ed etichetta gli ingredienti veri.\n\nAccetta algebra e dati mancanti espliciti; respingi una ricetta inventata.\n\nQuesta è un’esercitazione sulla lettura delle specifiche e sulla spiegazione delle decisioni. La schermata non fornisce un lotto reale, una misura, una firma del formatore o un superamento pratico. Il lavoro reale richiede la specifica documentata del formatore e l’osservazione individuale.'), ('Specifica vuota del formatore — prepara una scheda distinta per ogni compito reale\n\nSono campi vuoti di pianificazione. Compilarli non crea un’approvazione del formatore. Non inventare rapporti, densità, obiettivi di pH, quantità o tolleranze mancanti. Il prodotto da 5 kg e il contenitore didattico con suolo argilloso richiedono specifiche separate.\n\nIdentità del compito\n\nScopo, coltura o contesto e obiettivo di acidità definito dal formatore con metodo di prova\n\nNome del formatore\n\nData di emissione\n\nLotti degli ingredienti, qualità e analisi\n\nBase di miscelazione: massa o volume\n\nFrazioni o quantità dei componenti autorizzate\n\nSe è incluso suolo minerale argilloso\n\nProva della necessità di fosforo e fonte autorizzata, se prevista\n\nCondizione di umidità usata per la pesata\n\nMassa netta finale richiesta in kg, se pertinente\n\nScostamento di massa ammesso in kg, se pertinente\n\nProva di drenaggio del contenitore e limiti di accettazione, oppure requisiti del sacco\n\nRequisiti dell’etichetta\n\nApprovazione del formatore — lasciare vuota fino a quando viene effettivamente concessa', 'Specifica vuota del formatore — prepara una scheda distinta per ogni compito reale\n\nSono campi vuoti di pianificazione. Compilarli non crea un’approvazione del formatore. Non inventare rapporti, densità, obiettivi di pi acca, quantità o tolleranze mancanti. Il prodotto da cinque chilogrammi e il contenitore didattico con suolo argilloso richiedono specifiche separate.\n\nIdentità del compito\n\nScopo, coltura o contesto e obiettivo di acidità definito dal formatore con metodo di prova\n\nNome del formatore\n\nData di emissione\n\nLotti degli ingredienti, qualità e analisi\n\nBase di miscelazione: massa o volume\n\nFrazioni o quantità dei componenti autorizzate\n\nSe è incluso suolo minerale argilloso\n\nProva della necessità di fosforo e fonte autorizzata, se prevista\n\nCondizione di umidità usata per la pesata\n\nMassa netta finale richiesta in chilogrammi, se pertinente\n\nScostamento di massa ammesso in chilogrammi, se pertinente\n\nProva di drenaggio del contenitore e limiti di accettazione, oppure requisiti del sacco\n\nRequisiti dell’etichetta\n\nApprovazione del formatore — lasciare vuota fino a quando viene effettivamente concessa'), ('Una tessitura minerale franca, un contenitore didattico con argilla e un substrato per pomodori sono tre cose diverse. Prima dei calcoli o della miscelazione leggi la specifica del formatore e verifica se le proporzioni sono in massa o in volume.\n\nDistingui il suolo minerale franco dal substrato per vasi e spiega ruoli e limiti di argilla, compost, perlite e fonte di fosforo. Identifica la base massa/volume e calcola solo da una specifica documentata.\n\nCon il formatore, identifica al tatto tre campioni reali, scegli quello argilloso confermato e misura, miscela e valuta un contenitore didattico con la proporzione autorizzata. Il circa 1 parte di compost a 2 di suolo è un esempio originale non verificato, non una ricetta generale.\n\nCalcola e realizza personalmente un prodotto per vasi di pomodoro da 5 kg secondo ingredienti, quote, umidità, tolleranza di peso e qualità scritti dal formatore; verifica uniformità, massa finale, confezione, etichetta e motivo di ogni componente.', 'Una tessitura minerale franca, un contenitore didattico con argilla e un substrato per pomodori sono tre cose diverse. Prima dei calcoli o della miscelazione leggi la specifica del formatore e verifica se le proporzioni sono in massa o in volume.\n\nDistingui il suolo minerale franco dal substrato per vasi e spiega ruoli e limiti di argilla, compost, perlite e fonte di fosforo. Identifica la base massa, volume e calcola solo da una specifica documentata.\n\nCon il formatore, identifica al tatto tre campioni reali, scegli quello argilloso confermato e misura, miscela e valuta un contenitore didattico con la proporzione autorizzata. Il circa una parte di compost a due di suolo è un esempio originale non verificato, non una ricetta generale.\n\nCalcola e realizza personalmente un prodotto per vasi di pomodoro da cinque chilogrammi secondo ingredienti, quote, umidità, tolleranza di peso e qualità scritti dal formatore; verifica uniformità, massa finale, confezione, etichetta e motivo di ogni componente.'), ('suolo minerale franco\n\nClasse di tessitura di sabbia/limo/argilla, non ricetta né promessa nutritiva.\n\nsubstrato di coltivazione\n\nMateriale che sostiene radici in vaso con aria, acqua e nutrienti da gestire.\n\ncompost\n\nMateria organica decomposta di maturità, nutrienti e sali variabili.\n\nperlite\n\nIngrediente fisico leggero e poroso per aria/acqua, non concime.\n\nfarina d’ossa\n\nFonte di fosforo ottenuta da materiale animale lavorato, da aggiungere soltanto quando una specifica basata su prove ne giustifica l’uso.\n\nrapporto in volume\n\nParti misurate in litri, non identiche frazioni in massa senza densità.\n\nrapporto in massa\n\nParti pesate; in 5 kg ogni massa è 5 kg per la frazione autorizzata.\n\ntolleranza\n\nDeviazione di peso netto accettabile dichiarata dal formatore, non indovinata.', 'suolo minerale franco\n\nClasse di tessitura di sabbia, limo, argilla, non ricetta né promessa nutritiva.\n\nsubstrato di coltivazione\n\nMateriale che sostiene radici in vaso con aria, acqua e nutrienti da gestire.\n\ncompost\n\nMateria organica decomposta di maturità, nutrienti e sali variabili.\n\nperlite\n\nIngrediente fisico leggero e poroso per aria, acqua, non concime.\n\nfarina d’ossa\n\nFonte di fosforo ottenuta da materiale animale lavorato, da aggiungere soltanto quando una specifica basata su prove ne giustifica l’uso.\n\nrapporto in volume\n\nParti misurate in litri, non identiche frazioni in massa senza densità.\n\nrapporto in massa\n\nParti pesate; in cinque chilogrammi ogni massa è cinque chilogrammi per la frazione autorizzata.\n\ntolleranza\n\nDeviazione di peso netto accettabile dichiarata dal formatore, non indovinata.')], 'de': [('Eine mineralische Lehmtextur, ein Lehrgefäß mit Ton und ein Tomaten-Topfsubstrat sind verschiedene Dinge. Lies vor Rechnen und Mischen die Vorgabe der Lehrkraft und kläre, ob Anteile nach Masse oder Volumen gemeint sind.\n\nUnterscheide mineralischen Lehmboden vom Topfsubstrat und erkläre Funktionen und Grenzen von Ton, Kompost, Perlit und Phosphorquelle. Erkenne Masse- oder Volumenbezug und berechne Mengen nur aus dokumentierter Vorgabe.\n\nBestimme unter Anleitung drei echte Bodenproben durch Fühlen, wähle die bestätigte Tonprobe und messe, mische und prüfe ein eigenes Lehrgefäß nach der vorgegebenen Rezeptur. Ungefähr ein Teil Kompost zu zwei Teilen Boden ist nur ein ungeprüftes Beispiel der Quelle.\n\nBerechne und fertige eigenhändig ein 5-kg-Tomatensubstrat nach schriftlich bestätigten Zutaten, Anteilen, Feuchte, Gewichtstoleranz und Qualitätsanforderungen; prüfe Gleichmäßigkeit, Endmasse, Beutel, Etikett und Begründung jedes Bestandteils.', 'Eine mineralische Lehmtextur, ein Lehrgefäß mit Ton und ein Tomaten-Topfsubstrat sind verschiedene Dinge. Lies vor Rechnen und Mischen die Vorgabe der Lehrkraft und kläre, ob Anteile nach Masse oder Volumen gemeint sind.\n\nUnterscheide mineralischen Lehmboden vom Topfsubstrat und erkläre Funktionen und Grenzen von Ton, Kompost, Perlit und Phosphorquelle. Erkenne Masse- oder Volumenbezug und berechne Mengen nur aus dokumentierter Vorgabe.\n\nBestimme unter Anleitung drei echte Bodenproben durch Fühlen, wähle die bestätigte Tonprobe und messe, mische und prüfe ein eigenes Lehrgefäß nach der vorgegebenen Rezeptur. Ungefähr ein Teil Kompost zu zwei Teilen Boden ist nur ein ungeprüftes Beispiel der Quelle.\n\nBerechne und fertige eigenhändig ein fünf-Kilogramm-Tomatensubstrat nach schriftlich bestätigten Zutaten, Anteilen, Feuchte, Gewichtstoleranz und Qualitätsanforderungen; prüfe Gleichmäßigkeit, Endmasse, Beutel, Etikett und Begründung jedes Bestandteils.'), ('Leere Vorgabe der Lehrkraft — für jede reale Aufgabe eine getrennte Karte vorbereiten\n\nDies sind leere Planungsfelder. Ausfüllen erzeugt keine Freigabe der Lehrkraft. Erfinde keine fehlenden Verhältnisse, Dichten, pH-Ziele, Mengen oder Toleranzen. Das 5-kg-Produkt und das Lehrgefäß mit Tonboden benötigen getrennte Vorgaben.\n\nAufgabenkennung\n\nZweck, Kultur oder Zusammenhang sowie von der Lehrkraft festgelegtes Säureziel und Prüfverfahren\n\nName der Lehrkraft\n\nAusstellungsdatum\n\nZutatenchargen, Qualität und Analysen\n\nMischungsbezug: Masse oder Volumen\n\nGenehmigte Anteile oder Komponentenmengen\n\nOb mineralischer Tonboden enthalten ist\n\nBeleg des Phosphorbedarfs und gegebenenfalls zugelassene Quelle\n\nFeuchtezustand beim Wiegen\n\nErforderliche fertige Nettomasse in kg, falls zutreffend\n\nErlaubte Massenabweichung in kg, falls zutreffend\n\nEntwässerungsprüfung des Gefäßes und Annahmegrenzen oder Beutelanforderungen\n\nEtikettanforderungen\n\nFreigabe der Lehrkraft — bis zur tatsächlichen Erteilung leer lassen', 'Leere Vorgabe der Lehrkraft — für jede reale Aufgabe eine getrennte Karte vorbereiten\n\nDies sind leere Planungsfelder. Ausfüllen erzeugt keine Freigabe der Lehrkraft. Erfinde keine fehlenden Verhältnisse, Dichten, Pe Ha-Ziele, Mengen oder Toleranzen. Das fünf-Kilogramm-Produkt und das Lehrgefäß mit Tonboden benötigen getrennte Vorgaben.\n\nAufgabenkennung\n\nZweck, Kultur oder Zusammenhang sowie von der Lehrkraft festgelegtes Säureziel und Prüfverfahren\n\nName der Lehrkraft\n\nAusstellungsdatum\n\nZutatenchargen, Qualität und Analysen\n\nMischungsbezug: Masse oder Volumen\n\nGenehmigte Anteile oder Komponentenmengen\n\nOb mineralischer Tonboden enthalten ist\n\nBeleg des Phosphorbedarfs und gegebenenfalls zugelassene Quelle\n\nFeuchtezustand beim Wiegen\n\nErforderliche fertige Nettomasse in Kilogramm, falls zutreffend\n\nErlaubte Massenabweichung in Kilogramm, falls zutreffend\n\nEntwässerungsprüfung des Gefäßes und Annahmegrenzen oder Beutelanforderungen\n\nEtikettanforderungen\n\nFreigabe der Lehrkraft — bis zur tatsächlichen Erteilung leer lassen'), ('Ordne Zahlen der drei Fälle zu: Volumen, Masse, nicht angegeben oder fertige Produktmasse. Rechne auf einer leeren Vorgabekarte symbolische Zutatenmassen für 5 kg und erkläre, warum 1:2 nach Volumen nicht 1:2 nach Gewicht ist.\n\nMit Lehrkraft jeden Schritt der Drei-Proben-Tonkarte selbst durchführen, nach genehmigter Bezugsgröße messen, mischen und aufräumen.\n\nMit Lehrkraft unterschriebene 5-kg-Vorgabe lesen, zugelassene Komponenten berechnen/abwiegen, homogen mischen, netto wiegen, verpacken, verschließen und wahrheitsgemäß etikettieren.\n\nKorrekte Algebra und ausdrücklich fehlende Angaben gelten; erfundene Kompost/Perlit/Knochenmehl-Rezeptur nicht.\n\nDies übt das Lesen von Vorgaben und das Begründen von Entscheidungen. Der Bildschirm liefert weder eine tatsächliche Charge noch einen Messwert, eine Unterschrift der Lehrkraft oder ein praktisches Bestehen. Reale Arbeit benötigt eine dokumentierte Vorgabe der Lehrkraft und individuelle Beobachtung.', 'Ordne Zahlen der drei Fälle zu: Volumen, Masse, nicht angegeben oder fertige Produktmasse. Rechne auf einer leeren Vorgabekarte symbolische Zutatenmassen für fünf Kilogramm und erkläre, warum eins zu zwei nach Volumen nicht eins zu zwei nach Gewicht ist.\n\nMit Lehrkraft jeden Schritt der Drei-Proben-Tonkarte selbst durchführen, nach genehmigter Bezugsgröße messen, mischen und aufräumen.\n\nMit Lehrkraft unterschriebene fünf-Kilogramm-Vorgabe lesen, zugelassene Komponenten berechnen, abwiegen, homogen mischen, netto wiegen, verpacken, verschließen und wahrheitsgemäß etikettieren.\n\nKorrekte Algebra und ausdrücklich fehlende Angaben gelten; erfundene Kompost, Perlit, Knochenmehl-Rezeptur nicht.\n\nDies übt das Lesen von Vorgaben und das Begründen von Entscheidungen. Der Bildschirm liefert weder eine tatsächliche Charge noch einen Messwert, eine Unterschrift der Lehrkraft oder ein praktisches Bestehen. Reale Arbeit benötigt eine dokumentierte Vorgabe der Lehrkraft und individuelle Beobachtung.'), ('mineralischer Lehmboden\n\nKörnung aus Sand, Schluff und Ton; keine versprochene Topfrezeptur oder Nährstoffbilanz.\n\nKultursubstrat\n\nMaterial für Gefäßwurzeln mit zu regelnden Luft-, Wasser- und Nährstoffeigenschaften.\n\nKompost\n\nAbgebaute organische Substanz mit wechselnder Reife, Nährstoffen und löslichen Salzen.\n\nPerlit\n\nLeichter poröser physikalischer Bestandteil für Luft und Wasser, kein Nährstoffdünger.\n\nKnochenmehl\n\nVerarbeitete tierische P-Quelle, nur bei belegtem Bedarf und genehmigter Vorgabe.\n\nVolumenverhältnis\n\nTeile in Litern; ohne Dichte nicht mit denselben Zahlen als Massenanteile zu nutzen.\n\nMassenverhältnis\n\nGewichtsteile; bei 5 kg entspricht die Komponentenmasse 5 kg mal bestätigtem Anteil.\n\nToleranz\n\nVon der Lehrkraft zugelassene Abweichung vom Nettogewicht, keine geratene Zahl.', 'mineralischer Lehmboden\n\nKörnung aus Sand, Schluff und Ton; keine versprochene Topfrezeptur oder Nährstoffbilanz.\n\nKultursubstrat\n\nMaterial für Gefäßwurzeln mit zu regelnden Luft-, Wasser- und Nährstoffeigenschaften.\n\nKompost\n\nAbgebaute organische Substanz mit wechselnder Reife, Nährstoffen und löslichen Salzen.\n\nPerlit\n\nLeichter poröser physikalischer Bestandteil für Luft und Wasser, kein Nährstoffdünger.\n\nKnochenmehl\n\nVerarbeitete tierische Phosphorquelle, nur bei belegtem Bedarf und genehmigter Vorgabe.\n\nVolumenverhältnis\n\nTeile in Litern; ohne Dichte nicht mit denselben Zahlen als Massenanteile zu nutzen.\n\nMassenverhältnis\n\nGewichtsteile; bei fünf Kilogramm entspricht die Komponentenmasse fünf Kilogramm mal bestätigtem Anteil.\n\nToleranz\n\nVon der Lehrkraft zugelassene Abweichung vom Nettogewicht, keine geratene Zahl.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s312-independent-audio-20261023-r1'
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
