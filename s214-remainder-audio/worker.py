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
IDS = ('S2-14-ar-EG-opening-r1', 'S2-14-ar-EG-E01-r1', 'S2-14-ar-EG-E02-r1', 'S2-14-ar-EG-E03-r1', 'S2-14-ar-EG-E04-r1', 'S2-14-ar-EG-guided-practice-r1', 'S2-14-ar-EG-reflection-r1', 'S2-14-ar-EG-comparison-r1', 'S2-14-ar-EG-glossary-r1', 'S2-14-en-opening-r1', 'S2-14-en-E01-r1', 'S2-14-en-E02-r1', 'S2-14-en-E03-r1', 'S2-14-en-E04-r1', 'S2-14-en-guided-practice-r1', 'S2-14-en-reflection-r1', 'S2-14-en-comparison-r1', 'S2-14-en-glossary-r1', 'S2-14-it-opening-r1', 'S2-14-it-E01-r1', 'S2-14-it-E02-r1', 'S2-14-it-E03-r1', 'S2-14-it-E04-r1', 'S2-14-it-guided-practice-r1', 'S2-14-it-reflection-r1', 'S2-14-it-comparison-r1', 'S2-14-it-glossary-r1', 'S2-14-de-opening-r1', 'S2-14-de-E01-r1', 'S2-14-de-E02-r1', 'S2-14-de-E03-r1', 'S2-14-de-E04-r1', 'S2-14-de-guided-practice-r1', 'S2-14-de-reflection-r1', 'S2-14-de-comparison-r1', 'S2-14-de-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==36
    assert(req['scope'],req['stepId'])==('S214_REMAINDER_36_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-14')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(36,36,36,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s214-remainder-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==36
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(9))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening','E01','E02','E03','E04','guided-practice','reflection','comparison','glossary']
        voice='Charon'if group in['E01','E03','reflection','glossary']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/columns/4', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/0/4', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/1/4', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/2/4', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/3/4', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3', '/comparison/rows/4/4'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/columns/4', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/0/4', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/1/4', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/2/4', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/3/4', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3', '/comparison/rows/4/4'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/columns/4', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/0/4', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/1/4', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/2/4', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/3/4', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3', '/comparison/rows/4/4'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/columns/4', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/0/4', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/1/4', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/2/4', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/3/4', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3', '/comparison/rows/4/4'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('اكتب نتايج تحليل التربة بلغة واضحة وبسيطة.\n\nاستخدم تقييمك لنفسك عشان تحدد التدريب اللي محتاجه؛ ده مش تحقق من التقرير أو طريقة الاختبار ولا اجتياز عملي.', 'اكتب نتايج تحليل التربة بلغة واضحة وبسيطة.\n\nاستخدم تقييمك لنفسك عشان تحدد التدريب اللي محتاجه؛ ده مش تحقق من التقرير أو طريقة الاختبار ولا اجتياز عملي.'), ('التقرير المفيد بيقول عينة مين اتفحصت، وإيه اللي الطالب قاسه بنفسه، وإيه اللي المدرّب سلّمهوله، وإزاي كل نتيجة اتقاست، وإيه اللي نقدر نستنتجه منها فعلًا. هنتدرّب على عينة «الحقل 3» وحالة طماطم منفصلة. أرقام نموذج الحل مش قياساتك الشخصية.\n\nتجهّز تقرير للحقل 3 فيه تعريف العينة ونتائج pH والقوام والمادة العضوية والفوسفور والبوتاسيوم، وتفصل بوضوح بين قياساتك ونتائج المدرّب، وتكتب الطريقة والوحدة.\n\nتفسّر كل قيمة بمرجع مناسب لطريقة المعمل والمحصول والمنطقة، وتحدد الفراغات أو الطرق الناقصة بدل ما تخترع تصنيف منخفض أو مناسب أو مرتفع.\n\nتقترح خطوتين مشروطتين ومبررتين للطماطم، وترتب أولوية واحدة، وتحدد الأدلة اللازمة قبل أي معدل إضافة أو توصية نهائية للحقل.', 'التقرير المفيد بيقول عينة مين اتفحصت، وإيه اللي الطالب قاسه بنفسه، وإيه اللي المدرّب سلّمهوله، وإزاي كل نتيجة اتقاست، وإيه اللي نقدر نستنتجه منها فعلًا. هنتدرّب على عينة «الحقل تلاتة» وحالة طماطم منفصلة. أرقام نموذج الحل مش قياساتك الشخصية.\n\nتجهّز تقرير للحقل تلاتة فيه تعريف العينة ونتائج بي إتش والقوام والمادة العضوية والفوسفور والبوتاسيوم، وتفصل بوضوح بين قياساتك ونتائج المدرّب، وتكتب الطريقة والوحدة.\n\nتفسّر كل قيمة بمرجع مناسب لطريقة المعمل والمحصول والمنطقة، وتحدد الفراغات أو الطرق الناقصة بدل ما تخترع تصنيف منخفض أو مناسب أو مرتفع.\n\nتقترح خطوتين مشروطتين ومبررتين للطماطم، وترتب أولوية واحدة، وتحدد الأدلة اللازمة قبل أي معدل إضافة أو توصية نهائية للحقل.'), ('تفسير تحليل التربة\n\nحكم على معنى رقم اتقاس للمحصول، بشرط معرفة الطريقة ومرجع تفسير معاير مناسب.\n\nppm\n\nجزء في المليون لعنصر محدد وطريقة معمل محددة؛ الرقم وحده مش جرعة سماد.\n\nاحتياج الجير\n\nتقدير من المعمل أو تقييم معاير محليًا يُستخدم مع هدف المحصول وظروف التربة لحساب الاحتياج؛ pH وحده ما يحددش الكمية.\n\nطريقة الاستخلاص\n\nالخطوات المعملية المستخدمة لقياس مؤشر زي فوسفور التربة؛ تفسير الرقم مرتبط بيها.\n\nالمادة العضوية\n\nمكونات التربة القادمة من كائنات حية أو بقاياها؛ نسبتها وتفسيرها مرتبطان بالعينة وطريقة التحليل.\n\nأصل البيانات\n\nتسجيل إذا كان الرقم مقاسًا بيد الطالب، أو مقدّمًا، أو معروضًا قدامه، أو رقم نموذج، أو مفقودًا.', 'تفسير تحليل التربة\n\nحكم على معنى رقم اتقاس للمحصول، بشرط معرفة الطريقة ومرجع تفسير معاير مناسب.\n\nجزء في المليون\n\nجزء في المليون لعنصر محدد وطريقة معمل محددة؛ الرقم وحده مش جرعة سماد.\n\nاحتياج الجير\n\nتقدير من المعمل أو تقييم معاير محليًا يُستخدم مع هدف المحصول وظروف التربة لحساب الاحتياج؛ بي إتش وحده ما يحددش الكمية.\n\nطريقة الاستخلاص\n\nالخطوات المعملية المستخدمة لقياس مؤشر زي فوسفور التربة؛ تفسير الرقم مرتبط بيها.\n\nالمادة العضوية\n\nمكونات التربة القادمة من كائنات حية أو بقاياها؛ نسبتها وتفسيرها مرتبطان بالعينة وطريقة التحليل.\n\nأصل البيانات\n\nتسجيل إذا كان الرقم مقاسًا بيد الطالب، أو مقدّمًا، أو معروضًا قدامه، أو رقم نموذج، أو مفقودًا.'), ('جدول التدريب: خلّي كل فراغ واضح\n\nده جدول توضيحي بس. التفسير النهائي أو توصية الحقل محتاجين طريقة المعمل الفعلية ومرجع معاير للمحصول والمنطقة وأدلة الموقع.\n\nالنتيجة\n\nمنخفض\n\nمناسب في المثال\n\nمرتفع\n\nفراغ أو تصنيف مش محدد\n\npH\n\n<6.0\n\n6.0–7.5\n\n>7.5\n\n—\n\nمادة عضوية (%)\n\n<2\n\n3–6\n\n>6\n\n2 ≤ OM < 3\n\nP (ppm)\n\n<15\n\n20–40\n\n>50\n\n15 ≤ P < 20; 40 < P ≤ 50\n\nK (ppm)\n\n<100\n\n120–200\n\n>250\n\n100 ≤ K < 120; 200 < K ≤ 250\n\nN (ppm)\n\n<10\n\nبيتغيّر\n\nبيتغيّر\n\nN ≥ 10: التصنيف مش معطى', 'جدول التدريب: خلّي كل فراغ واضح\n\nده جدول توضيحي بس. التفسير النهائي أو توصية الحقل محتاجين طريقة المعمل الفعلية ومرجع معاير للمحصول والمنطقة وأدلة الموقع.\n\nالنتيجة\n\nمنخفض\n\nمناسب في المثال\n\nمرتفع\n\nفراغ أو تصنيف مش محدد\n\nبي إتش\n\n أقل من ستة فاصلة صفر\n\nستة فاصلة صفر إلى سبعة فاصلة خمسة\n\n أكبر من سبعة فاصلة خمسة\n\nشرطة\n\nمادة عضوية ( في المية )\n\n أقل من اتنين\n\nتلاتة إلى ستة\n\n أكبر من ستة\n\nاتنين أقل من أو يساوي المادة العضوية أقل من تلاتة\n\nالفوسفور (جزء في المليون)\n\n أقل من خمستاشر\n\nعشرين إلى أربعين\n\n أكبر من خمسين\n\nخمستاشر أقل من أو يساوي الفوسفور أقل من عشرين; أربعين أقل من الفوسفور أقل من أو يساوي خمسين\n\nالبوتاسيوم (جزء في المليون)\n\n أقل من مية\n\nمية وعشرين إلى ميتين\n\n أكبر من ميتين وخمسين\n\nمية أقل من أو يساوي البوتاسيوم أقل من مية وعشرين; ميتين أقل من البوتاسيوم أقل من أو يساوي ميتين وخمسين\n\nالنيتروجين (جزء في المليون)\n\n أقل من عشرة\n\nبيتغيّر\n\nبيتغيّر\n\nالنيتروجين أكبر من أو يساوي عشرة: التصنيف مش معطى'), ('حالة نقاش: pH \u200f5.5 وP \u200f12 ppm\n\nفكّر دقيقة، ناقش مع زميل دقيقتين، وشاركوا دقيقتين. المثال فيه pH \u200f5.5 وفوسفور 12 ppm، لكن طريقة الاستخلاص والمحصول وظروف الحقل مش مذكورين.\n\nبحسب جدول الدرس وحده، pH أقل من 6.0 وP أقل من 15 ppm.\n\nاكتب التصنيفين على إنهم من الجدول التعليمي، مش قرار تسميد أو جير نهائي.\n\nاسأل عن هدف المحصول وطريقة قياس P وتوصية المعمل واحتياج الجير وظروف الموقع قبل أي كمية أو إجراء بالحقل.\n\nالرقم المنخفض في المثال يفتح سؤال؛ الاختبار المناسب وظروف المحصول هما اللي يحسموا التوصية.', 'حالة نقاش: بي إتش \u200fخمسة فاصلة خمسة والفوسفور \u200fاتناشر جزء في المليون\n\nفكّر دقيقة، ناقش مع زميل دقيقتين، وشاركوا دقيقتين. المثال فيه بي إتش \u200fخمسة فاصلة خمسة وفوسفور اتناشر جزء في المليون، لكن طريقة الاستخلاص والمحصول وظروف الحقل مش مذكورين.\n\nبحسب جدول الدرس وحده، بي إتش أقل من ستة فاصلة صفر والفوسفور أقل من خمستاشر جزء في المليون.\n\nاكتب التصنيفين على إنهم من الجدول التعليمي، مش قرار تسميد أو جير نهائي.\n\nاسأل عن هدف المحصول وطريقة قياس الفوسفور وتوصية المعمل واحتياج الجير وظروف الموقع قبل أي كمية أو إجراء بالحقل.\n\nالرقم المنخفض في المثال يفتح سؤال؛ الاختبار المناسب وظروف المحصول هما اللي يحسموا التوصية.'), ('سؤال طماطم منفصل: pH \u200f5.4\n\nتقرير مزارع تاني للطماطم فيه pH \u200f5.4، ومادة عضوية 2.1%، وP \u200f12 ppm، وK \u200f185 ppm، من غير طريقة استخلاص أو موقع.\n\nجدول الدرس بيصنّف pH \u200f5.4 منخفض، والمادة العضوية 2.1% في الفراغ، وP \u200f12 وK \u200f185 في صفوف منخفض ومناسب كمثال بس.\n\nما تقولش إن تصنيف P وK نهائي بغض النظر عن طريقة الاختبار، أو إن نقص المحصول اتقاس. اطلب طريقة المعمل وإرشادات طماطم مناسبة للمنطقة.\n\nخطوتين ممكنين وليهم تبرير: اطلب اختبار احتياج الجير وهدف مناسب للمحصول والحقل قبل الجرعة؛ واطلب تفسير فوسفور معاير للطريقة وخطة تغذية كاملة قبل اختيار مصدر P أو كميته. إدارة المادة العضوية تتراجع وفق جودة المادة وتاريخ الحقل.\n\nرتّب الإجراء اللي دليله وفائدته المتوقعة أقوى لهذا الحقل، وقل إيه اللي ممكن يغيّر ترتيبك.\n\nحالة البنك pH \u200f5.4 مختلفة عن نقاش pH \u200f5.5 ونموذج الحقل 3 \u200fpH \u200f6.4.', 'سؤال طماطم منفصل: بي إتش \u200fخمسة فاصلة أربعة\n\nتقرير مزارع تاني للطماطم فيه بي إتش \u200fخمسة فاصلة أربعة، ومادة عضوية اتنين فاصلة واحد في المية، والفوسفور \u200fاتناشر جزء في المليون، والبوتاسيوم \u200fمية وخمسة وتمانين جزء في المليون، من غير طريقة استخلاص أو موقع.\n\nجدول الدرس بيصنّف بي إتش \u200fخمسة فاصلة أربعة منخفض، والمادة العضوية اتنين فاصلة واحد في المية في الفراغ، والفوسفور \u200fاتناشر والبوتاسيوم \u200fمية وخمسة وتمانين في صفوف منخفض ومناسب كمثال بس.\n\nما تقولش إن تصنيف الفوسفور والبوتاسيوم نهائي بغض النظر عن طريقة الاختبار، أو إن نقص المحصول اتقاس. اطلب طريقة المعمل وإرشادات طماطم مناسبة للمنطقة.\n\nخطوتين ممكنين وليهم تبرير: اطلب اختبار احتياج الجير وهدف مناسب للمحصول والحقل قبل الجرعة؛ واطلب تفسير فوسفور معاير للطريقة وخطة تغذية كاملة قبل اختيار مصدر الفوسفور أو كميته. إدارة المادة العضوية تتراجع وفق جودة المادة وتاريخ الحقل.\n\nرتّب الإجراء اللي دليله وفائدته المتوقعة أقوى لهذا الحقل، وقل إيه اللي ممكن يغيّر ترتيبك.\n\nحالة البنك بي إتش \u200fخمسة فاصلة أربعة مختلفة عن نقاش بي إتش \u200fخمسة فاصلة خمسة ونموذج الحقل تلاتة \u200fبي إتش \u200fستة فاصلة أربعة.'), ('فرز كل رقم للحقل 3 حسب مصدره: قسته بنفسك، المدرّب قدّمه، اتعرض قدامك، أو ناقص. أضف الطرق والوحدات.\n\nاستخدم التطبيق العملي للحقل 3 على مراحل تحت إشراف المدرّب: توثيق فردي للوقاية وهوية العينة وقياس pH وخطوات القوام في دروسهم العملية. تحليل NPK والمادة العضوية شرح أو عرض من المدرّب. تفسير التقرير أونلاين ما يثبتش مهارة تنفيذ فعلية؛ وقت الترسيب والتجفيف الكامل وتعليمات الجهاز الحقيقي منفصلين.', 'افرز كل رقم للحقل تلاتة حسب مصدره: قسته بنفسك، المدرّب قدّمه، اتعرض قدامك، أو ناقص. أضف الطرق والوحدات.\n\nاستخدم التطبيق العملي للحقل تلاتة على مراحل تحت إشراف المدرّب: توثيق فردي للوقاية وهوية العينة وقياس بي إتش وخطوات القوام في دروسهم العملية. تحليل النيتروجين والفوسفور والبوتاسيوم والمادة العضوية شرح أو عرض من المدرّب. تفسير التقرير أونلاين ما يثبتش مهارة تنفيذ فعلية؛ وقت الترسيب والتجفيف الكامل وتعليمات الجهاز الحقيقي منفصلين.'), ('قالب تقرير ذرة منفصل: pH 5.8 وهدف 6.5\n\nمثال كتابة تقرير فيه pH 5.8 وهدف توضيحي للذرة 6.5 ، ومعاه [X amount] جير زراعي لكل acre و[Y amount] من MAP(11-52-0).\n\nده قالب تقرير منفصل، مش نموذج الحقل 3 ولا مثال الطماطم ولا قياس طالب.\n\nX وY أماكن لأرقام لسه ناقصة؛ 11-52-0 تحليل المنتج، مش جرعة التطبيق.\n\nقبل أي توصية للحقل، لازم هدف فعلي للمحصول والموقع، واحتياج الجير، وتفسير تحليل الفوسفور، وخطة العناصر كاملة.\n\nوضوح شكل التقرير ما يخلّيش الجرعة اللي من غير دليل صحيحة.', 'قالب تقرير ذرة منفصل: بي إتش خمسة فاصلة تمانية وهدف ستة فاصلة خمسة\n\nمثال كتابة تقرير فيه بي إتش خمسة فاصلة تمانية وهدف توضيحي للذرة ستة فاصلة خمسة، ومعاه كمية إكس جير زراعي لكل إيكر وكمية واي من إم إيه بي(حداشر, اتنين وخمسين, صفر).\n\nده قالب تقرير منفصل، مش نموذج الحقل تلاتة ولا مثال الطماطم ولا قياس طالب.\n\nإكس وواي أماكن لأرقام لسه ناقصة؛ حداشر, اتنين وخمسين, صفر تحليل المنتج، مش جرعة التطبيق.\n\nقبل أي توصية للحقل، لازم هدف فعلي للمحصول والموقع، واحتياج الجير، وتفسير تحليل الفوسفور، وخطة العناصر كاملة.\n\nوضوح شكل التقرير ما يخلّيش الجرعة اللي من غير دليل صحيحة.'), ('نموذج الحقل 3 المعطى، منفصل عن عينتك\n\nقوام النموذج 45/35/20 لومي وpH \u200f6.4؛ والمدرّب يسلّم المادة العضوية 2.1% وP \u200f12 ppm وK \u200f185 ppm.\n\nافصل قياسات النموذج الفيزيائية عن قياساتك أنت، وبيّن أي أرقام معملية اتقدمت لك جاهزة.\n\npH \u200f6.4 داخل نطاق المثال؛ المادة العضوية 2.1% بلا تصنيف في فراغ الجدول. P \u200f12 في صفه المنخفض وK \u200f185 في صفه المناسب كمثال فقط، والتفسير الفعلي مرتبط بالطريقة والمحصول.\n\nاحتفظ بسمك الكومبوست وعمق الخلط ومنتج الفوسفور في النموذج كاقتراحات من المصدر، وما تصدرهمش كجرعة بلا دليل.\n\nالنموذج يشرح شكل التقرير؛ مش نتيجة اختبارك.', 'نموذج الحقل تلاتة المعطى، منفصل عن عينتك\n\nقوام النموذج خمسة وأربعين، خمسة وتلاتين، عشرين لومي وبي إتش \u200fستة فاصلة أربعة؛ والمدرّب يسلّم المادة العضوية اتنين فاصلة واحد في المية والفوسفور \u200fاتناشر جزء في المليون والبوتاسيوم \u200fمية وخمسة وتمانين جزء في المليون.\n\nافصل قياسات النموذج الفيزيائية عن قياساتك أنت، وبيّن أي أرقام معملية اتقدمت لك جاهزة.\n\nبي إتش \u200fستة فاصلة أربعة داخل نطاق المثال؛ المادة العضوية اتنين فاصلة واحد في المية بلا تصنيف في فراغ الجدول. الفوسفور \u200fاتناشر في صفه المنخفض والبوتاسيوم \u200fمية وخمسة وتمانين في صفه المناسب كمثال فقط، والتفسير الفعلي مرتبط بالطريقة والمحصول.\n\nاحتفظ بسمك الكومبوست وعمق الخلط ومنتج الفوسفور في النموذج كاقتراحات من المصدر، وما تصدرهمش كجرعة بلا دليل.\n\nالنموذج يشرح شكل التقرير؛ مش نتيجة اختبارك.')], 'en': [('A useful report says whose sample was tested, which values the learner measured, which values the trainer supplied, how each result was obtained, and what can actually be inferred. Practise with Field 3 and a separate tomato case; never turn model figures into your own observations.\n\nBuild a Field 3 report with identification, pH, texture, OM, P and K, clearly distinguishing learner measurements from trainer-supplied or demonstrated results and recording methods and units.\n\nInterpret each value using a stated laboratory, crop and regional reference; identify gaps or missing methods instead of inventing a low/optimum/high class.\n\nGive two justified, conditional tomato recommendations, prioritize one, and name the evidence required before an application rate or final field prescription.', 'A useful report says whose sample was tested, which values the learner measured, which values the trainer supplied, how each result was obtained, and what can actually be inferred. Practise with Field three and a separate tomato case; never turn model figures into your own observations.\n\nBuild a Field three report with identification, P H, texture, organic matter, P and K, clearly distinguishing learner measurements from trainer-supplied or demonstrated results and recording methods and units.\n\nInterpret each value using a stated laboratory, crop and regional reference; identify gaps or missing methods instead of inventing a low, optimum, high class.\n\nGive two justified, conditional tomato recommendations, prioritize one, and name the evidence required before an application rate or final field prescription.'), ('Classroom chart: retain every gap\n\nIllustrative chart only. Obtain the actual laboratory method, calibrated crop/regional reference and site evidence before a final interpretation or prescription.\n\nParameter\n\nLow\n\nExample optimum\n\nHigh\n\nUnclassified / unspecified\n\npH\n\n<6.0\n\n6.0–7.5\n\n>7.5\n\n—\n\nOM (%)\n\n<2\n\n3–6\n\n>6\n\n2 ≤ OM < 3\n\nP (ppm)\n\n<15\n\n20–40\n\n>50\n\n15 ≤ P < 20; 40 < P ≤ 50\n\nK (ppm)\n\n<100\n\n120–200\n\n>250\n\n100 ≤ K < 120; 200 < K ≤ 250\n\nN (ppm)\n\n<10\n\nVaries\n\nVaries\n\nN ≥ 10: no class supplied', 'Classroom chart: retain every gap\n\nIllustrative chart only. Obtain the actual laboratory method, calibrated crop, regional reference and site evidence before a final interpretation or prescription.\n\nParameter\n\nLow\n\nExample optimum\n\nHigh\n\nUnclassified, unspecified\n\nP H\n\n less than six point zero\n\nsix point zero to seven point five\n\n greater than seven point five\n\ndash\n\norganic matter ( percent )\n\n less than two\n\nthree to six\n\n greater than six\n\ntwo less than or equal to organic matter less than three\n\nP (parts per million)\n\n less than fifteen\n\ntwenty to forty\n\n greater than fifty\n\nfifteen less than or equal to P less than twenty; forty less than P less than or equal to fifty\n\nK (parts per million)\n\n less than one hundred\n\none hundred twenty to two hundred\n\n greater than two hundred fifty\n\none hundred less than or equal to K less than one hundred twenty; two hundred less than K less than or equal to two hundred fifty\n\nN (parts per million)\n\n less than ten\n\nVaries\n\nVaries\n\nN greater than or equal to ten: no class supplied'), ('Discussion case: pH 5.5 and P 12 ppm\n\nOne minute think, two minutes pair, two minutes share. The example gives pH 5.5 and phosphorus 12 ppm; extraction method, crop and site are not given.\n\nOn the classroom chart alone, pH is below 6.0 and P below 15 ppm.\n\nRecord these as illustrative chart labels, not final fertilizer or lime advice.\n\nAsk for the crop target, laboratory P method and recommendation, lime requirement and site conditions before a rate or field action.\n\nA low example value raises a question; the supporting test and crop context determine the recommendation.', 'Discussion case: P H five point five and P twelve parts per million\n\nOne minute think, two minutes pair, two minutes share. The example gives P H five point five and phosphorus twelve parts per million; extraction method, crop and site are not given.\n\nOn the classroom chart alone, P H is below six point zero and P below fifteen parts per million.\n\nRecord these as illustrative chart labels, not final fertilizer or lime advice.\n\nAsk for the crop target, laboratory P method and recommendation, lime requirement and site conditions before a rate or field action.\n\nA low example value raises a question; the supporting test and crop context determine the recommendation.'), ("Field 3 supplied model, separate from your sample\n\nModel texture 45/35/20 loam and pH 6.4; trainer-supplied OM 2.1%, P 12 ppm and K 185 ppm.\n\nSeparate model physical values from learner measurements and identify supplied lab figures.\n\npH 6.4 is within the example pH band; OM 2.1% has no class in the chart's gap. P 12 falls in its example low row and K 185 in its example optimum row, but actual interpretation remains method/crop dependent.\n\nPreserve the example's compost depth/incorporation and high-P product as source proposals; do not issue them as a dose without evidence.\n\nA model illustrates report structure; it is not the learner's test result.", "Field three supplied model, separate from your sample\n\nModel texture forty-five, thirty-five, twenty loam and P H six point four; trainer-supplied organic matter two point one percent, P twelve parts per million and K one hundred eighty-five parts per million.\n\nSeparate model physical values from learner measurements and identify supplied lab figures.\n\nP H six point four is within the example P H band; organic matter two point one percent has no class in the chart's gap. P twelve falls in its example low row and K one hundred eighty-five in its example optimum row, but actual interpretation remains method, crop dependent.\n\nPreserve the example's compost depth, incorporation and high-P product as source proposals; do not issue them as a dose without evidence.\n\nA model illustrates report structure; it is not the learner's test result."), ('Separate maize report template: pH 5.8 and target 6.5\n\nA report-writing example has pH 5.8, an illustrative maize target 6.5, [X amount] of agricultural lime per acre and [Y amount] of MAP(11-52-0).\n\nThis is a separate report template, not the Field 3 model, tomato bank case or a learner measurement.\n\n[X] and [Y] are unresolved placeholders; 11-52-0 is a product analysis, not an application rate.\n\nBefore any field prescription, obtain the actual crop/site target, lime requirement, phosphorus test interpretation and complete nutrient plan.\n\nA specific report format does not make an unsupported rate valid.', 'Separate maize report template: P H five point eight and target six point five\n\nA report-writing example has P H five point eight, an illustrative maize target six point five, X amount of agricultural lime per acre and Y amount of M A P(eleven, fifty-two, zero).\n\nThis is a separate report template, not the Field three model, tomato bank case or a learner measurement.\n\nX and Y are unresolved placeholders; eleven, fifty-two, zero is a product analysis, not an application rate.\n\nBefore any field prescription, obtain the actual crop, site target, lime requirement, phosphorus test interpretation and complete nutrient plan.\n\nA specific report format does not make an unsupported rate valid.'), ("Separate tomato written case: pH 5.4\n\nA different farmer's tomato report states pH 5.4, OM 2.1%, P 12 ppm and K 185 ppm, without laboratory extraction methods or a location.\n\nThe classroom chart would call pH 5.4 low; OM 2.1% lies in its unclassified gap; P 12 and K 185 fall in its example low and optimum bands respectively.\n\nDo not claim method-independent P/K categories or a measured crop nutrient deficit. Request the lab's method and local tomato guidance.\n\nTwo justified next actions could be: obtain a crop-specific lime requirement and site target before any lime rate; and seek a method-calibrated phosphorus and whole-nutrient plan before choosing a P source or rate. OM management can be assessed using material quality and field history.\n\nPrioritize the action whose expected benefit and evidence are strongest for this field; state what could change that priority.\n\nThis pH 5.4 bank case is neither the pH 5.5 discussion example nor the pH 6.4 Field 3 model.", "Separate tomato written case: P H five point four\n\nA different farmer's tomato report states P H five point four, organic matter two point one percent, P twelve parts per million and K one hundred eighty-five parts per million, without laboratory extraction methods or a location.\n\nThe classroom chart would call P H five point four low; organic matter two point one percent lies in its unclassified gap; P twelve and K one hundred eighty-five fall in its example low and optimum bands respectively.\n\nDo not claim method-independent P, K categories or a measured crop nutrient deficit. Request the lab's method and local tomato guidance.\n\nTwo justified next actions could be: obtain a crop-specific lime requirement and site target before any lime rate; and seek a method-calibrated phosphorus and whole-nutrient plan before choosing a P source or rate. organic matter management can be assessed using material quality and field history.\n\nPrioritize the action whose expected benefit and evidence are strongest for this field; state what could change that priority.\n\nThis P H five point four bank case is neither the P H five point five discussion example nor the P H six point four Field three model."), ('Sort each Field 3 value by provenance: learner measured, trainer supplied, trainer demonstration, or missing; add methods and units.\n\nUse the staged supervised Field 3 practical: individually document PPE, identity, pH measurement and texture procedure in their respective practical steps. NPK/OM are conceptual or trainer-demonstrated. This online report interpretation does not certify physical performance; full settling/drying time and actual instrument SOP are separate.', 'Sort each Field three value by provenance: learner measured, trainer supplied, trainer demonstration, or missing; add methods and units.\n\nUse the staged supervised Field three practical: individually document PPE, identity, P H measurement and texture procedure in their respective practical steps. N P K, organic matter are conceptual or trainer-demonstrated. This online report interpretation does not certify physical performance; full settling, drying time and actual instrument SOP are separate.'), ('Write soil test results in clear, simple language.\n\nUse this self-report to plan practice; it does not verify a report, a test method or practical competence.', 'Write soil test results in clear, simple language.\n\nUse this self-report to plan practice; it does not verify a report, a test method or practical competence.'), ("soil test interpretation\n\nA judgement about what a measured value means for a crop under a stated method and calibrated reference.\n\nppm\n\nParts per million as reported for an identified soil-test analyte and method; not by itself a fertilizer dose.\n\nlime requirement\n\nA laboratory or locally calibrated assessment used with crop target and soil conditions to estimate liming need; soil pH alone does not specify a rate.\n\nextraction method\n\nThe laboratory procedure used to measure an index such as soil-test phosphorus; a result's interpretation depends on it.\n\norganic matter\n\nSoil material from living and formerly living sources; its reported percentage and interpretation depend on sampling and analytical method.\n\ndata provenance\n\nA record of which value was personally measured, supplied, demonstrated, modelled or missing.", "soil test interpretation\n\nA judgement about what a measured value means for a crop under a stated method and calibrated reference.\n\nparts per million\n\nParts per million as reported for an identified soil-test analyte and method; not by itself a fertilizer dose.\n\nlime requirement\n\nA laboratory or locally calibrated assessment used with crop target and soil conditions to estimate liming need; soil P H alone does not specify a rate.\n\nextraction method\n\nThe laboratory procedure used to measure an index such as soil-test phosphorus; a result's interpretation depends on it.\n\norganic matter\n\nSoil material from living and formerly living sources; its reported percentage and interpretation depend on sampling and analytical method.\n\ndata provenance\n\nA record of which value was personally measured, supplied, demonstrated, modelled or missing.")], 'it': [("Caso scritto distinto: pomodoro con pH 5.4\n\nIl rapporto di un altro agricoltore riporta pH 5.4, OM 2.1%, P 12 ppm e K 185 ppm, senza metodo d'estrazione o località.\n\nSecondo la tabella didattica pH 5.4 è basso, OM 2.1% è nella lacuna, P 12 e K 185 nelle righe illustrative bassa e ottimale.\n\nNon dichiarare le classi P/K indipendenti dal metodo o una carenza della coltura misurata. Chiedi analisi e guida locale per il pomodoro.\n\nDue passi possibili: ottenere obiettivo colturale e fabbisogno di calce prima di una dose; ottenere interpretazione P calibrata al metodo e piano nutritivo completo prima di scegliere fonte o quantità. Valutare OM alla luce della qualità del materiale e della storia del campo.\n\nDai priorità all'azione con prove e beneficio atteso più solidi per quel campo e indica cosa potrebbe cambiarla.\n\nIl pH 5.4 della banca non è né il 5.5 della discussione né il 6.4 del modello Campo 3.", "Caso scritto distinto: pomodoro con pi acca cinque virgola quattro\n\nIl rapporto di un altro agricoltore riporta pi acca cinque virgola quattro, sostanza organica due virgola uno per cento, pi dodici parti per milione e cappa centottantacinque parti per milione, senza metodo d'estrazione o località.\n\nSecondo la tabella didattica pi acca cinque virgola quattro è basso, sostanza organica due virgola uno per cento è nella lacuna, pi dodici e cappa centottantacinque nelle righe illustrative bassa e ottimale.\n\nNon dichiarare le classi pi, cappa indipendenti dal metodo o una carenza della coltura misurata. Chiedi analisi e guida locale per il pomodoro.\n\nDue passi possibili: ottenere obiettivo colturale e fabbisogno di calce prima di una dose; ottenere interpretazione pi calibrata al metodo e piano nutritivo completo prima di scegliere fonte o quantità. Valutare sostanza organica alla luce della qualità del materiale e della storia del campo.\n\nDai priorità all'azione con prove e beneficio atteso più solidi per quel campo e indica cosa potrebbe cambiarla.\n\nIl pi acca cinque virgola quattro della banca non è né il cinque virgola cinque della discussione né il sei virgola quattro del modello Campo tre."), ("Classifica ogni valore del Campo 3 per provenienza: misurato da te, fornito dal formatore, dimostrato o mancante; aggiungi metodi e unità.\n\nUsa l'attività del Campo 3 in fasi sorvegliate: documenta individualmente DPI, identità, misura del pH e procedimento per la tessitura nei rispettivi passi pratici. NPK/OM restano concettuali o dimostrati dal formatore. Questo rapporto online non certifica prestazione fisica; tempo completo di sedimentazione/essiccazione e SOP dello strumento reale sono separati.", "Classifica ogni valore del Campo tre per provenienza: misurato da te, fornito dal formatore, dimostrato o mancante; aggiungi metodi e unità.\n\nUsa l'attività del Campo tre in fasi sorvegliate: documenta individualmente DPI, identità, misura del pi acca e procedimento per la tessitura nei rispettivi passi pratici. enne pi cappa, sostanza organica restano concettuali o dimostrati dal formatore. Questo rapporto online non certifica prestazione fisica; tempo completo di sedimentazione, essiccazione e SOP dello strumento reale sono separati."), ("Discussione: pH 5.5 e P 12 ppm\n\nUn minuto per pensare, due in coppia e due per condividere. L'esempio dà pH 5.5 e P 12 ppm, senza metodo d'estrazione, coltura o sito.\n\nNella sola tabella didattica pH è sotto 6.0 e P sotto 15 ppm.\n\nRiporta etichette illustrative, non una dose finale di calce o concime.\n\nChiedi obiettivo della coltura, metodo P, indicazione del laboratorio, fabbisogno di calce e condizioni del sito prima di agire.\n\nUn valore basso nell'esempio apre una domanda; analisi e contesto decidono il consiglio.", "Discussione: pi acca cinque virgola cinque e pi dodici parti per milione\n\nUn minuto per pensare, due in coppia e due per condividere. L'esempio dà pi acca cinque virgola cinque e pi dodici parti per milione, senza metodo d'estrazione, coltura o sito.\n\nNella sola tabella didattica pi acca è sotto sei virgola zero e pi sotto quindici parti per milione.\n\nRiporta etichette illustrative, non una dose finale di calce o concime.\n\nChiedi obiettivo della coltura, metodo pi, indicazione del laboratorio, fabbisogno di calce e condizioni del sito prima di agire.\n\nUn valore basso nell'esempio apre una domanda; analisi e contesto decidono il consiglio."), ('Modello distinto per mais: pH 5.8 e obiettivo 6.5\n\nUn esempio di relazione contiene pH 5.8, obiettivo illustrativo 6.5 per mais, [X amount] di calce agricola per acro e [Y amount] di MAP(11-52-0).\n\nÈ un modello di scrittura distinto da Campo 3, dal caso pomodoro e da una misura dello studente.\n\n[X] e [Y] restano segnaposto; 11-52-0 indica l’analisi del prodotto, non la dose.\n\nPrima di prescrivere servono obiettivo reale di coltura/sito, fabbisogno di calce, interpretazione del fosforo e piano nutritivo completo.\n\nUna forma precisa non rende valida una dose priva di prove.', 'Modello distinto per mais: pi acca cinque virgola otto e obiettivo sei virgola cinque\n\nUn esempio di relazione contiene pi acca cinque virgola otto, obiettivo illustrativo sei virgola cinque per mais, quantità ics di calce agricola per acro e quantità ipsilon di emme a pi(undici, cinquantadue, zero).\n\nÈ un modello di scrittura distinto da Campo tre, dal caso pomodoro e da una misura dello studente.\n\nics e ipsilon restano segnaposto; undici, cinquantadue, zero indica l’analisi del prodotto, non la dose.\n\nPrima di prescrivere servono obiettivo reale di coltura, sito, fabbisogno di calce, interpretazione del fosforo e piano nutritivo completo.\n\nUna forma precisa non rende valida una dose priva di prove.'), ("Modello fornito del Campo 3, distinto dal tuo campione\n\nTessitura del modello 45/35/20 franco e pH 6.4; OM 2.1%, P 12 ppm e K 185 ppm forniti dal formatore.\n\nSepara valori fisici del modello dalle misure personali e individua i dati di laboratorio forniti.\n\npH 6.4 rientra nell'intervallo d'esempio; OM 2.1% non ha classe nella lacuna. P 12 è nella riga bassa e K 185 nell'ottimale solo come esempi; l'interpretazione reale dipende da metodo e coltura.\n\nMantieni spessore e incorporazione del compost e prodotto ad alto P come proposte della fonte, non dosi prescritte senza prova.\n\nIl modello mostra come costruire il rapporto, non i tuoi risultati.", "Modello fornito del Campo tre, distinto dal tuo campione\n\nTessitura del modello quarantacinque, trentacinque, venti franco e pi acca sei virgola quattro; sostanza organica due virgola uno per cento, pi dodici parti per milione e cappa centottantacinque parti per milione forniti dal formatore.\n\nSepara valori fisici del modello dalle misure personali e individua i dati di laboratorio forniti.\n\npi acca sei virgola quattro rientra nell'intervallo d'esempio; sostanza organica due virgola uno per cento non ha classe nella lacuna. pi dodici è nella riga bassa e cappa centottantacinque nell'ottimale solo come esempi; l'interpretazione reale dipende da metodo e coltura.\n\nMantieni spessore e incorporazione del compost e prodotto ad alto pi come proposte della fonte, non dosi prescritte senza prova.\n\nIl modello mostra come costruire il rapporto, non i tuoi risultati."), ('Scrivere i risultati delle analisi del suolo in un linguaggio chiaro e semplice.\n\nAutovalutazione per pianificare l’esercizio; non verifica relazione, metodo o abilità pratica.', 'Scrivere i risultati delle analisi del suolo in un linguaggio chiaro e semplice.\n\nAutovalutazione per pianificare l’esercizio; non verifica relazione, metodo o abilità pratica.'), ('Tabella didattica: conserva ogni lacuna\n\nSolo esempio didattico. Una classe definitiva o prescrizione richiede metodo reale, riferimento calibrato per coltura/regione e prove del sito.\n\nParametro\n\nBasso\n\nOttimale d’esempio\n\nAlto\n\nLacuna / non specificato\n\npH\n\n<6.0\n\n6.0–7.5\n\n>7.5\n\n—\n\nOM (%)\n\n<2\n\n3–6\n\n>6\n\n2 ≤ OM < 3\n\nP (ppm)\n\n<15\n\n20–40\n\n>50\n\n15 ≤ P < 20; 40 < P ≤ 50\n\nK (ppm)\n\n<100\n\n120–200\n\n>250\n\n100 ≤ K < 120; 200 < K ≤ 250\n\nN (ppm)\n\n<10\n\nVariabile\n\nVariabile\n\nN ≥ 10: classe non fornita', 'Tabella didattica: conserva ogni lacuna\n\nSolo esempio didattico. Una classe definitiva o prescrizione richiede metodo reale, riferimento calibrato per coltura, regione e prove del sito.\n\nParametro\n\nBasso\n\nOttimale d’esempio\n\nAlto\n\nLacuna, non specificato\n\npi acca\n\n inferiore a sei virgola zero\n\nsei virgola zero a sette virgola cinque\n\n superiore a sette virgola cinque\n\ntrattino\n\nsostanza organica ( per cento )\n\n inferiore a due\n\ntre a sei\n\n superiore a sei\n\ndue inferiore o uguale a sostanza organica inferiore a tre\n\npi (parti per milione)\n\n inferiore a quindici\n\nventi a quaranta\n\n superiore a cinquanta\n\nquindici inferiore o uguale a pi inferiore a venti; quaranta inferiore a pi inferiore o uguale a cinquanta\n\ncappa (parti per milione)\n\n inferiore a cento\n\ncentoventi a duecento\n\n superiore a duecentocinquanta\n\ncento inferiore o uguale a cappa inferiore a centoventi; duecento inferiore a cappa inferiore o uguale a duecentocinquanta\n\nenne (parti per milione)\n\n inferiore a dieci\n\nVariabile\n\nVariabile\n\nenne superiore o uguale a dieci: classe non fornita'), ('Un rapporto utile precisa a chi appartiene il campione, quali dati ha misurato lo studente, quali sono stati forniti dal formatore, con quali metodi sono stati ottenuti e che cosa si può davvero dedurre. Esercitati sul Campo 3 e su un caso distinto di pomodoro; non presentare i numeri del modello come tue osservazioni.\n\nRedigere un rapporto per il Campo 3 con identificazione, pH, tessitura, sostanza organica, P e K, distinguendo misure personali dai risultati forniti o dimostrati dal formatore e riportando metodi e unità.\n\nInterpretare ogni valore con un riferimento dichiarato del laboratorio, della coltura e della regione; segnalare lacune e metodi mancanti invece di inventare una classe basso/ottimale/alto.\n\nProporre due azioni motivate e condizionate per il pomodoro, dare priorità a una e indicare quali prove servono prima di una dose o prescrizione per il campo.', 'Un rapporto utile precisa a chi appartiene il campione, quali dati ha misurato lo studente, quali sono stati forniti dal formatore, con quali metodi sono stati ottenuti e che cosa si può davvero dedurre. Esercitati sul Campo tre e su un caso distinto di pomodoro; non presentare i numeri del modello come tue osservazioni.\n\nRedigere un rapporto per il Campo tre con identificazione, pi acca, tessitura, sostanza organica, pi e cappa, distinguendo misure personali dai risultati forniti o dimostrati dal formatore e riportando metodi e unità.\n\nInterpretare ogni valore con un riferimento dichiarato del laboratorio, della coltura e della regione; segnalare lacune e metodi mancanti invece di inventare una classe basso, ottimale, alto.\n\nProporre due azioni motivate e condizionate per il pomodoro, dare priorità a una e indicare quali prove servono prima di una dose o prescrizione per il campo.'), ("interpretazione del test del suolo\n\nGiudizio sul significato di una misura per una coltura, con metodo e riferimento calibrato dichiarati.\n\nppm\n\nParti per milione per un analita e metodo identificati; da sole non indicano una dose di concime.\n\nfabbisogno di calce\n\nValutazione di laboratorio o locale insieme a obiettivo colturale e suolo; il solo pH non definisce la dose.\n\nmetodo di estrazione\n\nProcedura di laboratorio per misurare un indice come P nel suolo; l'interpretazione del dato ne dipende.\n\nsostanza organica\n\nMateriale derivato da organismi e loro residui; percentuale e giudizio dipendono da campionamento e analisi.\n\nprovenienza dei dati\n\nTraccia di un valore misurato personalmente, fornito, dimostrato, modellato o mancante.", "interpretazione del test del suolo\n\nGiudizio sul significato di una misura per una coltura, con metodo e riferimento calibrato dichiarati.\n\nparti per milione\n\nParti per milione per un analita e metodo identificati; da sole non indicano una dose di concime.\n\nfabbisogno di calce\n\nValutazione di laboratorio o locale insieme a obiettivo colturale e suolo; il solo pi acca non definisce la dose.\n\nmetodo di estrazione\n\nProcedura di laboratorio per misurare un indice come pi nel suolo; l'interpretazione del dato ne dipende.\n\nsostanza organica\n\nMateriale derivato da organismi e loro residui; percentuale e giudizio dipendono da campionamento e analisi.\n\nprovenienza dei dati\n\nTraccia di un valore misurato personalmente, fornito, dimostrato, modellato o mancante.")], 'de': [('Bodentestergebnisse in klarer, einfacher Sprache aufschreiben.\n\nSelbsteinschätzung für weiteres Üben; keine Bestätigung von Bericht, Testmethode oder praktischer Leistung.', 'Bodentestergebnisse in klarer, einfacher Sprache aufschreiben.\n\nSelbsteinschätzung für weiteres Üben; keine Bestätigung von Bericht, Testmethode oder praktischer Leistung.'), ('Bodenuntersuchung deuten\n\nBeurteilen, was ein Messwert für eine Kultur unter angegebenem Verfahren und kalibrierter Referenz bedeutet.\n\nppm\n\nTeile pro Million für einen identifizierten Stoff und eine Methode; allein keine Düngemenge.\n\nKalkbedarf\n\nLabor- oder lokal kalibrierte Prüfung zusammen mit Kulturziel und Bodenbedingungen; pH allein gibt keine Menge vor.\n\nExtraktionsverfahren\n\nLaborverfahren zur Messung eines Index wie Boden-P; die Interpretation des Ergebnisses hängt davon ab.\n\norganische Bodensubstanz\n\nMaterial aus lebenden und ehemals lebenden Organismen; Anteil und Deutung hängen von Probenahme und Analytik ab.\n\nDatenherkunft\n\nAufzeichnung, ob ein Wert selbst gemessen, bereitgestellt, vorgeführt, modelliert oder fehlend ist.', 'Bodenuntersuchung deuten\n\nBeurteilen, was ein Messwert für eine Kultur unter angegebenem Verfahren und kalibrierter Referenz bedeutet.\n\nTeile pro Million\n\nTeile pro Million für einen identifizierten Stoff und eine Methode; allein keine Düngemenge.\n\nKalkbedarf\n\nLabor- oder lokal kalibrierte Prüfung zusammen mit Kulturziel und Bodenbedingungen; Pe Ha allein gibt keine Menge vor.\n\nExtraktionsverfahren\n\nLaborverfahren zur Messung eines Index wie Boden-Pe; die Interpretation des Ergebnisses hängt davon ab.\n\norganische Bodensubstanz\n\nMaterial aus lebenden und ehemals lebenden Organismen; Anteil und Deutung hängen von Probenahme und Analytik ab.\n\nDatenherkunft\n\nAufzeichnung, ob ein Wert selbst gemessen, bereitgestellt, vorgeführt, modelliert oder fehlend ist.'), ('Diskussionsfall: pH 5.5 und P 12 ppm\n\nEine Minute einzeln nachdenken, zwei Minuten zu zweit, zwei Minuten vorstellen. Vorgegeben sind pH 5.5 und P 12 ppm; Extraktionsverfahren, Kultur und Standort fehlen.\n\nNur in der Lehrtabelle liegt pH unter 6.0 und P unter 15 ppm.\n\nKennzeichne dies als beispielhafte Tabellenetiketten, nicht als endgültige Kalk- oder Düngeanweisung.\n\nFrage vor einer Menge nach Kulturziel, Labor-P-Methode, Empfehlung, Kalkbedarf und Standort.\n\nEin niedriger Beispielwert ist ein Anlass zur Prüfung; Test und Kulturkontext tragen die Empfehlung.', 'Diskussionsfall: Pe Ha fünf Komma fünf und Pe zwölf Teile pro Million\n\nEine Minute einzeln nachdenken, zwei Minuten zu zweit, zwei Minuten vorstellen. Vorgegeben sind Pe Ha fünf Komma fünf und Pe zwölf Teile pro Million; Extraktionsverfahren, Kultur und Standort fehlen.\n\nNur in der Lehrtabelle liegt Pe Ha unter sechs Komma null und Pe unter fünfzehn Teile pro Million.\n\nKennzeichne dies als beispielhafte Tabellenetiketten, nicht als endgültige Kalk- oder Düngeanweisung.\n\nFrage vor einer Menge nach Kulturziel, Labor-Pe-Methode, Empfehlung, Kalkbedarf und Standort.\n\nEin niedriger Beispielwert ist ein Anlass zur Prüfung; Test und Kulturkontext tragen die Empfehlung.'), ('Ein brauchbarer Bericht nennt die Herkunft der Probe, die vom Lernenden selbst gemessenen Werte, die vom Ausbilder bereitgestellten Ergebnisse, die jeweiligen Verfahren und die tatsächlich zulässigen Schlussfolgerungen. Übe mit Feld 3 und einem getrennten Tomatenfall. Zahlen der Musterlösung sind nicht deine eigenen Beobachtungen.\n\nFür Feld 3 einen Bericht mit Probenidentität, pH, Textur, organischer Substanz, P und K erstellen; eigene Messungen von bereitgestellten oder vorgeführten Ergebnissen trennen und Verfahren sowie Einheiten angeben.\n\nJeden Wert anhand einer angegebenen Labor-, Kultur- und Regionalreferenz deuten und Lücken oder fehlende Methoden benennen statt Klassen niedrig/optimal/hoch zu erfinden.\n\nZwei begründete, bedingte Schritte für Tomaten nennen, einen priorisieren und die erforderlichen Befunde vor einer Aufwandmenge oder endgültigen Feldempfehlung angeben.', 'Ein brauchbarer Bericht nennt die Herkunft der Probe, die vom Lernenden selbst gemessenen Werte, die vom Ausbilder bereitgestellten Ergebnisse, die jeweiligen Verfahren und die tatsächlich zulässigen Schlussfolgerungen. Übe mit Feld drei und einem getrennten Tomatenfall. Zahlen der Musterlösung sind nicht deine eigenen Beobachtungen.\n\nFür Feld drei einen Bericht mit Probenidentität, Pe Ha, Textur, organischer Substanz, Pe und Ka erstellen; eigene Messungen von bereitgestellten oder vorgeführten Ergebnissen trennen und Verfahren sowie Einheiten angeben.\n\nJeden Wert anhand einer angegebenen Labor-, Kultur- und Regionalreferenz deuten und Lücken oder fehlende Methoden benennen statt Klassen niedrig, optimal, hoch zu erfinden.\n\nZwei begründete, bedingte Schritte für Tomaten nennen, einen priorisieren und die erforderlichen Befunde vor einer Aufwandmenge oder endgültigen Feldempfehlung angeben.'), ('Getrennter schriftlicher Tomatenfall: pH 5.4\n\nEin anderer Landwirt hat pH 5.4, organische Substanz 2.1%, P 12 ppm und K 185 ppm im Bericht; Extraktionsverfahren und Standort fehlen.\n\nDie Lehrtabelle würde pH 5.4 niedrig nennen; organische Substanz 2.1% liegt in der Lücke; P 12 und K 185 stehen in den beispielhaften niedrigen und optimalen Bändern.\n\nBehaupte keine verfahrensunabhängigen P/K-Klassen und keinen gemessenen Pflanzennährstoffmangel. Frage nach Laborverfahren und örtlicher Tomatenberatung.\n\nZwei plausible nächste Schritte sind eine kulturgerechte Zielgröße samt Kalkbedarfsprüfung vor einer Kalkmenge sowie eine zur P-Methode kalibrierte Deutung und vollständige Nährstoffplanung vor Produktauswahl oder Menge. Organische Substanz kann anhand von Materialqualität und Feldgeschichte bewertet werden.\n\nPriorisiere den Schritt mit dem stärksten erwarteten Nutzen und Beleg für dieses Feld; sage, welche neuen Daten die Priorität verändern könnten.\n\nDer Bankfall pH 5.4 ist weder die Diskussion mit 5.5 noch das Feld-3-Muster mit 6.4.', 'Getrennter schriftlicher Tomatenfall: Pe Ha fünf Komma vier\n\nEin anderer Landwirt hat Pe Ha fünf Komma vier, organische Substanz zwei Komma eins Prozent, Pe zwölf Teile pro Million und Ka einhundertfünfundachtzig Teile pro Million im Bericht; Extraktionsverfahren und Standort fehlen.\n\nDie Lehrtabelle würde Pe Ha fünf Komma vier niedrig nennen; organische Substanz zwei Komma eins Prozent liegt in der Lücke; Pe zwölf und Ka einhundertfünfundachtzig stehen in den beispielhaften niedrigen und optimalen Bändern.\n\nBehaupte keine verfahrensunabhängigen Pe, Ka-Klassen und keinen gemessenen Pflanzennährstoffmangel. Frage nach Laborverfahren und örtlicher Tomatenberatung.\n\nZwei plausible nächste Schritte sind eine kulturgerechte Zielgröße samt Kalkbedarfsprüfung vor einer Kalkmenge sowie eine zur Pe-Methode kalibrierte Deutung und vollständige Nährstoffplanung vor Produktauswahl oder Menge. Organische Substanz kann anhand von Materialqualität und Feldgeschichte bewertet werden.\n\nPriorisiere den Schritt mit dem stärksten erwarteten Nutzen und Beleg für dieses Feld; sage, welche neuen Daten die Priorität verändern könnten.\n\nDer Bankfall Pe Ha fünf Komma vier ist weder die Diskussion mit fünf Komma fünf noch das Feld-drei-Muster mit sechs Komma vier.'), ('Getrenntes Mais-Berichtsmuster: pH 5.8 und Ziel 6.5\n\nEin Berichtsmuster nennt pH 5.8, beispielhaften Mais-Zielwert 6.5, [X amount] Agrarkalk je Acre und [Y amount] MAP(11-52-0).\n\nEin getrenntes Schreibmuster, weder Feld 3-Modell noch Tomatenfall oder Schülermessung.\n\n[X] und [Y] bleiben Platzhalter; 11-52-0 ist die Produktanalyse, keine Aufwandmenge.\n\nVor einer Feldverordnung sind echtes Kultur-/Standortziel, Kalkbedarf, Phosphor-Testdeutung und vollständiger Nährstoffplan nötig.\n\nEin genauer Berichtsaufbau macht eine unbelegte Menge nicht gültig.', 'Getrenntes Mais-Berichtsmuster: Pe Ha fünf Komma acht und Ziel sechs Komma fünf\n\nEin Berichtsmuster nennt Pe Ha fünf Komma acht, beispielhaften Mais-Zielwert sechs Komma fünf, Menge Iks Agrarkalk je Acre und Menge Ypsilon Em A Pe(elf, zweiundfünfzig, null).\n\nEin getrenntes Schreibmuster, weder Feld drei-Modell noch Tomatenfall oder Schülermessung.\n\nIks und Ypsilon bleiben Platzhalter; elf, zweiundfünfzig, null ist die Produktanalyse, keine Aufwandmenge.\n\nVor einer Feldverordnung sind echtes Kultur-, Standortziel, Kalkbedarf, Phosphor-Testdeutung und vollständiger Nährstoffplan nötig.\n\nEin genauer Berichtsaufbau macht eine unbelegte Menge nicht gültig.'), ('Lehrtabelle: jede Lücke sichtbar lassen\n\nNur Lehrbeispiel. Eine endgültige Deutung oder Feldempfehlung braucht reales Laborverfahren, passende Kultur-/Regionalkalibrierung und Standortbelege.\n\nParameter\n\nNiedrig\n\nBeispielhaft optimal\n\nHoch\n\nLücke / nicht angegeben\n\npH\n\n<6.0\n\n6.0–7.5\n\n>7.5\n\n—\n\nOM (%)\n\n<2\n\n3–6\n\n>6\n\n2 ≤ OM < 3\n\nP (ppm)\n\n<15\n\n20–40\n\n>50\n\n15 ≤ P < 20; 40 < P ≤ 50\n\nK (ppm)\n\n<100\n\n120–200\n\n>250\n\n100 ≤ K < 120; 200 < K ≤ 250\n\nN (ppm)\n\n<10\n\nVariabel\n\nVariabel\n\nN ≥ 10: keine Klasse angegeben', 'Lehrtabelle: jede Lücke sichtbar lassen\n\nNur Lehrbeispiel. Eine endgültige Deutung oder Feldempfehlung braucht reales Laborverfahren, passende Kultur-, Regionalkalibrierung und Standortbelege.\n\nParameter\n\nNiedrig\n\nBeispielhaft optimal\n\nHoch\n\nLücke, nicht angegeben\n\nPe Ha\n\n kleiner als sechs Komma null\n\nsechs Komma null bis sieben Komma fünf\n\n größer als sieben Komma fünf\n\nStrich\n\norganische Substanz ( Prozent )\n\n kleiner als zwei\n\ndrei bis sechs\n\n größer als sechs\n\nzwei kleiner oder gleich organische Substanz kleiner als drei\n\nPe (Teile pro Million)\n\n kleiner als fünfzehn\n\nzwanzig bis vierzig\n\n größer als fünfzig\n\nfünfzehn kleiner oder gleich Pe kleiner als zwanzig; vierzig kleiner als Pe kleiner oder gleich fünfzig\n\nKa (Teile pro Million)\n\n kleiner als einhundert\n\neinhundertzwanzig bis zweihundert\n\n größer als zweihundertfünfzig\n\neinhundert kleiner oder gleich Ka kleiner als einhundertzwanzig; zweihundert kleiner als Ka kleiner oder gleich zweihundertfünfzig\n\nEn (Teile pro Million)\n\n kleiner als zehn\n\nVariabel\n\nVariabel\n\nEn größer oder gleich zehn: keine Klasse angegeben'), ('Sortiere jeden Feld-3-Wert nach Herkunft: selbst gemessen, von der Fachkraft erhalten, vorgeführt oder fehlend; ergänze Verfahren und Einheiten.\n\nNutze die gestufte und betreute Feld-3-Praxis: Schutzausrüstung, Probenidentität, pH-Messung und Texturverfahren werden in den entsprechenden praktischen Schritten individuell dokumentiert. NPK/OM sind konzeptionell oder werden von der Fachkraft vorgeführt. Die Online-Berichtsdeutung bescheinigt keine physische Ausführung; reale Trocknungs-/Absetzzeiten und Geräteanweisungen sind getrennt.', 'Sortiere jeden Feld-drei-Wert nach Herkunft: selbst gemessen, von der Fachkraft erhalten, vorgeführt oder fehlend; ergänze Verfahren und Einheiten.\n\nNutze die gestufte und betreute Feld-drei-Praxis: Schutzausrüstung, Probenidentität, Pe Ha-Messung und Texturverfahren werden in den entsprechenden praktischen Schritten individuell dokumentiert. En Pe Ka, organische Substanz sind konzeptionell oder werden von der Fachkraft vorgeführt. Die Online-Berichtsdeutung bescheinigt keine physische Ausführung; reale Trocknungs-, Absetzzeiten und Geräteanweisungen sind getrennt.'), ('Vorgegebenes Muster Feld 3, getrennt von deiner Probe\n\nModelltextur 45/35/20 Lehm und pH 6.4; bereitgestellt sind organische Substanz 2.1%, P 12 ppm und K 185 ppm.\n\nTrenne physikalische Musterwerte von eigenen Messungen und markiere die bereitgestellten Laborzahlen.\n\npH 6.4 fällt in das Beispielband; organische Substanz 2.1% hat wegen der Lücke keine Klasse. P 12 liegt beispielhaft in der niedrigen und K 185 in der optimalen Zeile; die tatsächliche Deutung hängt von Methode und Kultur ab.\n\nBehalte Kompostdicke, Einarbeitungstiefe und phosphorreiches Produkt als Vorschläge der Quelle, nicht als unbelegte Aufwandmenge.\n\nEin Muster erklärt die Berichtsform, ist aber nicht dein Messergebnis.', 'Vorgegebenes Muster Feld drei, getrennt von deiner Probe\n\nModelltextur fünfundvierzig, fünfunddreißig, zwanzig Lehm und Pe Ha sechs Komma vier; bereitgestellt sind organische Substanz zwei Komma eins Prozent, Pe zwölf Teile pro Million und Ka einhundertfünfundachtzig Teile pro Million.\n\nTrenne physikalische Musterwerte von eigenen Messungen und markiere die bereitgestellten Laborzahlen.\n\nPe Ha sechs Komma vier fällt in das Beispielband; organische Substanz zwei Komma eins Prozent hat wegen der Lücke keine Klasse. Pe zwölf liegt beispielhaft in der niedrigen und Ka einhundertfünfundachtzig in der optimalen Zeile; die tatsächliche Deutung hängt von Methode und Kultur ab.\n\nBehalte Kompostdicke, Einarbeitungstiefe und phosphorreiches Produkt als Vorschläge der Quelle, nicht als unbelegte Aufwandmenge.\n\nEin Muster erklärt die Berichtsform, ist aber nicht dein Messergebnis.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s214-remainder-audio-20261023-r1'
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
    assert count < 9, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 36,'maximumCallsForLane':9,
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
    assert all(v<=9 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':9,'maximumBlindReviewPerLane':9,'maximumASRPerLane':9,'maximumTTSAggregate':36,'maximumBlindAggregate':36,'maximumASRAggregate':36,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
