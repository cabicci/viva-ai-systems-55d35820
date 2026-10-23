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
_gated_spec=importlib.util.spec_from_file_location('gated_worked_validation',HERE/'gated_worked_validation.py')
_gated_module=importlib.util.module_from_spec(_gated_spec);_gated_spec.loader.exec_module(_gated_module)
validate_gated_worked_unit=_gated_module.validate_gated_worked_unit

FROZEN = ['.gitignore', 'README.en.txt', 'freeze_package.py', 'offline_check.py', 'owner-authority.json', 'cumulative-attempt-ledger.json', 'cache-live-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/worker-derivation.json', 'request.json', 'runtime.json', 'vendor/course/manifest.json', 'vendor/pipeline-engine.py', 'worker.py', 'provenance/narration-ar-EG.json', 'provenance/narration-en.json', 'provenance/narration-it.json', 'provenance/narration-de.json', 'thin_artifacts.py', 'gated_worked_validation.py', 'provenance/gated-source-slice-ar-EG.json', 'provenance/gated-source-slice-en.json', 'provenance/gated-source-slice-it.json', 'provenance/gated-source-slice-de.json']
IDS = ('S2-15-ar-EG-E01-r1', 'S2-15-ar-EG-E02-r1', 'S2-15-ar-EG-E03-r1', 'S2-15-ar-EG-E04-r1', 'S2-15-ar-EG-E05-r1', 'S2-15-ar-EG-E06-r1', 'S2-15-en-E01-r1', 'S2-15-en-E02-r1', 'S2-15-en-E03-r1', 'S2-15-en-E04-r1', 'S2-15-en-E05-r1', 'S2-15-en-E06-r1', 'S2-15-it-E01-r1', 'S2-15-it-E02-r1', 'S2-15-it-E03-r1', 'S2-15-it-E04-r1', 'S2-15-it-E05-r1', 'S2-15-it-E06-r1', 'S2-15-de-E01-r1', 'S2-15-de-E02-r1', 'S2-15-de-E03-r1', 'S2-15-de-E04-r1', 'S2-15-de-E05-r1', 'S2-15-de-E06-r1')
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
    assert set(freeze['sha256'])==set(FROZEN) and len(FROZEN)==len(set(FROZEN))==24
    for name,h in freeze['sha256'].items():
        p=(HERE/name).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozen preimage mismatch'
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==24
    assert(req['scope'],req['stepId'])==('S215_GATED_12_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-15')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s215-gated-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['E01', 'E02', 'E03', 'E04', 'E05', 'E06']
        voice='Charon'if group in['E01', 'E03', 'E05']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'E05': ['/examples/4/title', '/examples/4/situation', '/examples/4/reasoning/0', '/examples/4/reasoning/1', '/examples/4/reasoning/2', '/examples/4/takeaway'], 'E06': ['/examples/5/title', '/examples/5/situation', '/examples/5/reasoning/0', '/examples/5/reasoning/1', '/examples/5/reasoning/2', '/examples/5/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'E05': ['/examples/4/title', '/examples/4/situation', '/examples/4/reasoning/0', '/examples/4/reasoning/1', '/examples/4/reasoning/2', '/examples/4/takeaway'], 'E06': ['/examples/5/title', '/examples/5/situation', '/examples/5/reasoning/0', '/examples/5/reasoning/1', '/examples/5/reasoning/2', '/examples/5/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'E05': ['/examples/4/title', '/examples/4/situation', '/examples/4/reasoning/0', '/examples/4/reasoning/1', '/examples/4/reasoning/2', '/examples/4/takeaway'], 'E06': ['/examples/5/title', '/examples/5/situation', '/examples/5/reasoning/0', '/examples/5/reasoning/1', '/examples/5/reasoning/2', '/examples/5/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'E05': ['/examples/4/title', '/examples/4/situation', '/examples/4/reasoning/0', '/examples/4/reasoning/1', '/examples/4/reasoning/2', '/examples/4/takeaway'], 'E06': ['/examples/5/title', '/examples/5/situation', '/examples/5/reasoning/0', '/examples/5/reasoning/1', '/examples/5/reasoning/2', '/examples/5/takeaway']}}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('Farmer Jones: طماطم West Field\n\nالمعطى pH 5.5، مادة عضوية 1.5%، N منخفض، P 15 ppm، K 200 ppm، مع انضغاط وصرف بطيء؛ النطاقات تعليمية وغير معايرة معمليًا.\n\nاكتب الأقسام الخمسة وبيّن غياب التاريخ والمعمل والطريقة.\n\nاربط الحموضة وN/P بخطة حسب المحصول والمعمل، وسجّل K من غير تسميد متوازن تلقائي.\n\nافحص موضع الانضغاط والرطوبة ومخرج الصرف قبل تدخل ميكانيكي، وفسّر أولوية البداية.\n\nالقيمة في طريقة التقرير والاستدلال، مش جرعة أو حرث آلي.', 'المزارع جونز: طماطم حقل ويست فيلد\n\nالمعطى بي إتش خمسة فاصلة خمسة، مادة عضوية واحد فاصلة خمسة في المية، النيتروجين منخفض، الفوسفور خمستاشر جزء في المليون، البوتاسيوم ميتين جزء في المليون، مع انضغاط وصرف بطيء؛ النطاقات تعليمية وغير معايرة معمليًا.\n\nاكتب الأقسام الخمسة وبيّن غياب التاريخ والمعمل والطريقة.\n\nاربط الحموضة والنيتروجين والفوسفور بخطة حسب المحصول والمعمل، وسجّل البوتاسيوم من غير تسميد متوازن تلقائي.\n\nافحص موضع الانضغاط والرطوبة ومخرج الصرف قبل تدخل ميكانيكي، وفسّر أولوية البداية.\n\nالقيمة في طريقة التقرير والاستدلال، مش جرعة أو حرث آلي.'), ('Field B: خمس قراءات pH\n\nالقراءات الخمس 6.2 و6.4 و6.1 و6.3 و6.2؛ السؤال يطلب التاريخ لكنه غير معطى.\n\nاعرض كل قراءة في جدول مع هوية الحقل.\n\nالمجموع 31.2 والمتوسط الحسابي 31.2÷5 = 6.24.\n\nاكتب «متوسط خمس قراءات» لا «قياس عينة مخلوطة»؛ لا تضع تاريخًا غير معروف.\n\nالمتوسط يلخص قراءات، مش قياسًا جديدًا على مادة ممزوجة.', 'الحقل بي: خمس قراءات بي إتش\n\nالقراءات الخمس ستة فاصلة اتنين وستة فاصلة أربعة وستة فاصلة واحد وستة فاصلة تلاتة وستة فاصلة اتنين؛ السؤال يطلب التاريخ لكنه غير معطى.\n\nاعرض كل قراءة في جدول مع هوية الحقل.\n\nالمجموع واحد وتلاتين فاصلة اتنين والمتوسط الحسابي واحد وتلاتين فاصلة اتنين مقسوم على خمسة بتساوي ستة فاصلة اتنين أربعة.\n\nاكتب «متوسط خمس قراءات» لا «قياس عينة مخلوطة»؛ ما تحطش تاريخ مش معروف.\n\nالمتوسط يلخص قراءات، مش قياس جديد على مادة ممزوجة.'), ('جدول توضيحي، مش شهادة معمل\n\nمثال المصدر: pH 5.2؛ المادة العضوية 2.1%؛ N منخفض؛ P 25 ppm؛ K 180 ppm، مع نطاقات مثال خاصة به.\n\nاعرض الصفوف الخمسة والوحدات والنطاقات المطبوعة على أنها مثال.\n\nما تدمجش الأرقام بعينة West Field ولا تعتبر النطاقات قاعدة عامة للطماطم.\n\nاطلب طريقة التحليل ومرجع المعمل الملائم للمحصول قبل وصف الحالة أو الجرعة.\n\nجدول مرتب من غير أعمدة موثوقة مش كفاية.', 'جدول توضيحي، مش شهادة معمل\n\nمثال المصدر: بي إتش خمسة فاصلة اتنين؛ المادة العضوية اتنين فاصلة واحد في المية؛ النيتروجين منخفض؛ الفوسفور خمسة وعشرين جزء في المليون؛ البوتاسيوم مية وتمانين جزء في المليون، مع نطاقات مثال خاصة به.\n\nاعرض الصفوف الخمسة والوحدات والنطاقات المطبوعة على أنها مثال.\n\nما تدمجش الأرقام بعينة حقل ويست فيلد ولا تعتبر النطاقات قاعدة عامة للطماطم.\n\nاطلب طريقة التحليل ومرجع المعمل الملائم للمحصول قبل وصف الحالة أو الجرعة.\n\nجدول مرتب من غير أعمدة موثوقة مش كفاية.'), ('ما تخلطش مسائل التقييم اللاحقة\n\nحالة أ: pH 5.2 وN منخفض وP منخفض وK متوسط ومادة عضوية 1%، وتطلب أسلوبين تحسين وأمثلة محاصيل. حالة ب: pH 6.8 وN متوسط وP مرتفع وK منخفض، وتطلب خطة تسميد ومحصولين.\n\nاحتفظ بكل مجموعة أرقام والعدد المطلوب من الطرق والمحاصيل.\n\nفي الحالة أ، افحص احتياج الجير الخاص بالمحصول وخطة N/P والمادة العضوية المعايرة لطريقة التحليل كمسارين منفصلين. البروكلي والفاصوليا أمثلة ممكن تواجه خطر عند pH 5.2، لأن إرشادات زراعتها بتفضّل تقريبًا pH 6–7؛ ده احتمال خطر، مش ضمان للفشل. بعد تحسين متحقق منه، ممكن نفحص ملاءمة الطماطم والذرة الحلوة لو المناخ والصرف والملوحة وتوازن المغذيات واحتياجات الصنف المحلي مناسبين.\n\nفي ب، لا تضف P من غير حاجة؛ تحقق من نقص K المبلّغ عنه حسب الطريقة واحتياج المحصول، ووازن N من كل المصادر. الطماطم والذرة الحلوة مرشحان للفحص عند pH 6.8، لكن البيانات الناقصة لا تضمن نجاحهما ولا تحدد جرعة.\n\nنحافظ على سؤال المحاصيل مع ربط النجاح الفعلي بدليل الموقع.', 'ما تخلطش مسائل التقييم اللاحقة\n\nحالة أ: بي إتش خمسة فاصلة اتنين والنيتروجين منخفض والفوسفور منخفض والبوتاسيوم متوسط ومادة عضوية واحد في المية، وتطلب أسلوبين تحسين وأمثلة محاصيل. حالة ب: بي إتش ستة فاصلة تمانية والنيتروجين متوسط والفوسفور مرتفع والبوتاسيوم منخفض، وتطلب خطة تسميد ومحصولين.\n\nاحتفظ بكل مجموعة أرقام والعدد المطلوب من الطرق والمحاصيل.\n\nفي الحالة أ، افحص احتياج الجير الخاص بالمحصول وخطة النيتروجين والفوسفور والمادة العضوية المعايرة لطريقة التحليل كمسارين منفصلين. البروكلي والفاصوليا أمثلة ممكن تواجه خطر عند بي إتش خمسة فاصلة اتنين، لأن إرشادات زراعتها بتفضّل تقريبًا بي إتش ستة إلى سبعة؛ ده احتمال خطر، مش ضمان للفشل. بعد تحسين متحقق منه، ممكن نفحص ملاءمة الطماطم والذرة الحلوة لو المناخ والصرف والملوحة وتوازن المغذيات واحتياجات الصنف المحلي مناسبين.\n\nفي ب، لا تضف الفوسفور من غير حاجة؛ تحقق من نقص البوتاسيوم المبلّغ عنه حسب الطريقة واحتياج المحصول، ووازن النيتروجين من كل المصادر. الطماطم والذرة الحلوة مرشحان للفحص عند بي إتش ستة فاصلة تمانية، لكن البيانات الناقصة لا تضمن نجاحهما ولا تحدد جرعة.\n\nنحافظ على سؤال المحاصيل مع ربط النجاح الفعلي بدليل الموقع.'), ('مسألة منفصلة: الذرة\n\npH 5.4 والهدف المعطى 6.0–7.0؛ المادة العضوية 2.0% والهدف >3%؛ N وP منخفضين، K ملائم، والأرض منضغطة وظهرت أوراق صفراء سابقًا.\n\nاشرح تصنيفات المثال بلغة بسيطة وبيّن أنها معطاة.\n\nرتّب فحص احتياج الجير وتفسير المغذيات والانضغاط والصرف والمحصول بشروط واضحة.\n\nالاصفرار القديم مش تشخيص مستقل لنقص N؛ لا تخترع طريقة أو جرعة أو تاريخًا.\n\nمسألة الذرة مختلفة عن تقرير طماطم West Field.', 'مسألة منفصلة: الذرة\n\nبي إتش خمسة فاصلة أربعة والهدف المعطى ستة فاصلة صفر إلى سبعة فاصلة صفر؛ المادة العضوية اتنين فاصلة صفر في المية والهدف أكبر من تلاتة في المية؛ النيتروجين والفوسفور منخفضين، البوتاسيوم ملائم، والأرض منضغطة وظهرت أوراق صفراء سابقًا.\n\nاشرح تصنيفات المثال بلغة بسيطة وبيّن أنها معطاة.\n\nرتّب فحص احتياج الجير وتفسير المغذيات والانضغاط والصرف والمحصول بشروط واضحة.\n\nالاصفرار القديم مش تشخيص مستقل لنقص النيتروجين؛ لا تخترع طريقة أو جرعة أو تاريخ.\n\nمسألة الذرة مختلفة عن تقرير طماطم حقل ويست فيلد.'), ('منتج Paddock 3 في صفحة\n\npH 7.8 قلوي، مادة عضوية 1.5% منخفضة، N مرتفع، P منخفض جدًا، K منخفض؛ مطلوب إجراء عملي واحد على الأقل متعلق بـP/K.\n\nاكتب هوية Paddock 3 وكل النتائج الخمس بلغة المزارع.\n\nاقترح خطة P/K مشروطة بطريقة المعمل والمحصول؛ ذكر مسحوق العظم في قائمة المصدر مش وصفة أو جرعة إلزامية.\n\nالمدرّب يفحص خمس خانات: الهوية، النتائج، الوضوح، توصية نقص، وترتيب الصفحة؛ يسجل نعم/لا والدليل والإجراء التصحيحي.\n\nالمنتج الأنيق يحتاج مراجعة حقيقية من المدرّب وتوصية سليمة.', 'منتج بادوك تلاتة في صفحة\n\nبي إتش سبعة فاصلة تمانية قلوي، مادة عضوية واحد فاصلة خمسة في المية منخفضة، النيتروجين مرتفع، الفوسفور منخفض جدًا، البوتاسيوم منخفض؛ مطلوب إجراء عملي واحد على الأقل متعلق بالفوسفور والبوتاسيوم.\n\nاكتب هوية بادوك تلاتة وكل النتائج الخمس بلغة المزارع.\n\nاقترح خطة الفوسفور والبوتاسيوم مشروطة بطريقة المعمل والمحصول؛ ذكر مسحوق العظم في قائمة المصدر مش وصفة أو جرعة إلزامية.\n\nالمدرّب يفحص خمس خانات: الهوية، النتائج، الوضوح، توصية نقص، وترتيب الصفحة؛ يسجل نعم، لا والدليل والإجراء التصحيحي.\n\nالمنتج الأنيق يحتاج مراجعة حقيقية من المدرّب وتوصية سليمة.')], 'en': [("Farmer Jones: West Field tomatoes\n\nProvided pH 5.5, OM 1.5%, N Low, P 15 ppm, K 200 ppm, compaction and slow drainage; classroom target bands are supplied but not laboratory-calibrated.\n\nInclude all five sections and mark missing date, lab and test methods.\n\nTreat pH and N/P as questions for a crop/site/lab plan; record the supplied K value without automatic balanced fertilization.\n\nInspect the restrictive layer, moisture and outlet before mechanical intervention, and state a reasoned first priority with alternatives.\n\nA model's value is its report structure and reasoning, not an automatic dose or tillage instruction.", "Farmer Jones: West Field tomatoes\n\nProvided P H five point five, organic matter one point five percent, nitrogen Low, phosphorus fifteen parts per million, potassium two hundred parts per million, compaction and slow drainage; classroom target bands are supplied but not laboratory-calibrated.\n\nInclude all five sections and mark missing date, lab and test methods.\n\nTreat P H and nitrogen, phosphorus as questions for a crop, site, lab plan; record the supplied potassium value without automatic balanced fertilization.\n\nInspect the restrictive layer, moisture and outlet before mechanical intervention, and state a reasoned first priority with alternatives.\n\nA model's value is its report structure and reasoning, not an automatic dose or tillage instruction."), ("Field B: five pH readings\n\nField B's five reported pH readings are 6.2, 6.4, 6.1, 6.3 and 6.2; the date is requested but not supplied.\n\nShow all five readings in an identified table.\n\nThe sum is 31.2 and the arithmetic mean is 31.2/5 = 6.24.\n\nSay 'mean of five readings', not 'pH of a mixed sample'. Insert the actual test date only when known; otherwise mark it missing.\n\nAn average summarizes separate measurements; it does not manufacture a new physical measurement.", "Field B: five P H readings\n\nField B's five reported P H readings are six point two, six point four, six point one, six point three and six point two; the date is requested but not supplied.\n\nShow all five readings in an identified table.\n\nThe sum is thirty-one point two and the arithmetic mean is thirty-one point two divided by five equals six point two four.\n\nSay 'mean of five readings', not 'P H of a mixed sample'. Insert the actual test date only when known; otherwise mark it missing.\n\nAn average summarizes separate measurements; it does not manufacture a new physical measurement."), ('Illustrative table, not a laboratory certificate\n\nSupplied model: pH 5.2; OM 2.1%; N Low; P 25 ppm; K 180 ppm, with its own example reference bands.\n\nShow all five rows, reported units and printed bands as source examples.\n\nDo not merge these numbers with the West Field sample or use the bands as a universal tomato guideline.\n\nAsk for the actual analytical method and crop-calibrated lab reference before a final class or input rate.\n\nA clean table needs trustworthy columns, not just attractive formatting.', 'Illustrative table, not a laboratory certificate\n\nSupplied model: P H five point two; organic matter two point one percent; nitrogen Low; phosphorus twenty-five parts per million; potassium one hundred eighty parts per million, with its own example reference bands.\n\nShow all five rows, reported units and printed bands as source examples.\n\nDo not merge these numbers with the West Field sample or use the bands as a universal tomato guideline.\n\nAsk for the actual analytical method and crop-calibrated lab reference before a final class or input rate.\n\nA clean table needs trustworthy columns, not just attractive formatting.'), ('Keep later written cases distinct\n\nCase A: pH 5.2, N Low, P Low, K Medium, OM 1%, with two soil techniques and crop examples requested. Case B: pH 6.8, N Medium, P High, K Low, requesting a seasonal fertilizer strategy and two suitable crops.\n\nRetain each exact dataset and requested number of techniques or crops.\n\nFor case A, assess a crop-specific lime requirement and a method-calibrated N/P/OM plan as two distinct pathways. Broccoli and common beans are examples at risk under the starting pH 5.2 because extension growing guidance prefers about pH 6–7; this is a risk hypothesis, not a guaranteed failure. After verified improvement, tomatoes and sweet corn are two candidate crops if climate, drainage, salinity, nutrient balance and local variety requirements also fit.\n\nFor case B, avoid an unnecessary P input, investigate the reported K shortage by method and crop need, and balance N from all sources. Tomatoes and sweet corn could be investigated as candidates at pH 6.8, but the incomplete case does not prove their suitability or set a K rate.\n\nQuestion prompts and requested crop examples are preserved while crop success remains conditional on actual site evidence.', 'Keep later written cases distinct\n\nCase A: P H five point two, nitrogen Low, phosphorus Low, potassium Medium, organic matter one percent, with two soil techniques and crop examples requested. Case B: P H six point eight, nitrogen Medium, phosphorus High, potassium Low, requesting a seasonal fertilizer strategy and two suitable crops.\n\nRetain each exact dataset and requested number of techniques or crops.\n\nFor case A, assess a crop-specific lime requirement and a method-calibrated nitrogen, phosphorus, organic matter plan as two distinct pathways. Broccoli and common beans are examples at risk under the starting P H five point two because extension growing guidance prefers about P H six to seven; this is a risk hypothesis, not a guaranteed failure. After verified improvement, tomatoes and sweet corn are two candidate crops if climate, drainage, salinity, nutrient balance and local variety requirements also fit.\n\nFor case B, avoid an unnecessary phosphorus input, investigate the reported potassium shortage by method and crop need, and balance nitrogen from all sources. Tomatoes and sweet corn could be investigated as candidates at P H six point eight, but the incomplete case does not prove their suitability or set a potassium rate.\n\nQuestion prompts and requested crop examples are preserved while crop success remains conditional on actual site evidence.'), ('Paddock 3 one-page product\n\nSupplied pH 7.8 alkaline, OM 1.5% low, N High, P Very Low and K Low; the task asks for at least one practical P/K-related action.\n\nOne page includes Paddock 3 field ID and all five original results in plain language.\n\nOffer a conditional lab- and crop-calibrated P/K nutrient plan; a named bone-meal example in the checklist is not a required product or dose.\n\nThe trainer checks five rows: field ID, all results, simple explanation, a deficiency-related recommendation and clear legible organization, recording yes/no and evidence/corrective action for each.\n\nA polished product still needs a verified trainer review and sound recommendation.', 'Paddock three one-page product\n\nSupplied P H seven point eight alkaline, organic matter one point five percent low, nitrogen High, phosphorus Very Low and potassium Low; the task asks for at least one practical phosphorus, potassium-related action.\n\nOne page includes Paddock three field ID and all five original results in plain language.\n\nOffer a conditional lab- and crop-calibrated phosphorus, potassium nutrient plan; a named bone-meal example in the checklist is not a required product or dose.\n\nThe trainer checks five rows: field ID, all results, simple explanation, a deficiency-related recommendation and clear legible organization, recording yes, no and evidence, corrective action for each.\n\nA polished product still needs a verified trainer review and sound recommendation.'), ('Separate written case: corn\n\nCorn case: pH 5.4 (stated target 6.0–7.0), OM 2.0% (stated target >3%), N Low, P Low, K Optimum; compacted soil and prior yellow leaves.\n\nExplain the supplied categories simply and clearly identify them as provided.\n\nList conditional next actions for lime requirement, nutrient interpretation, compaction/drainage and crop check in defensible order.\n\nPrior yellow leaves do not independently prove N deficiency; no method, rate or date may be invented.\n\nThis corn exercise is separate from the West Field tomato report.', 'Separate written case: corn\n\nCorn case: P H five point four (stated target six point zero to seven point zero), organic matter two point zero percent (stated target greater than three percent ), nitrogen Low, phosphorus Low, potassium Optimum; compacted soil and prior yellow leaves.\n\nExplain the supplied categories simply and clearly identify them as provided.\n\nList conditional next actions for lime requirement, nutrient interpretation, compaction, drainage and crop check in defensible order.\n\nPrior yellow leaves do not independently prove nitrogen deficiency; no method, rate or date may be invented.\n\nThis corn exercise is separate from the West Field tomato report.')], 'it': [('Caso scritto distinto: mais\n\npH 5.4 (obiettivo dichiarato 6.0–7.0), sostanza organica 2.0% (>3%), N/P Bassi, K Ottimale, suolo compattato e foglie gialle precedenti.\n\nSpiega le categorie fornite con parole semplici.\n\nElenca controlli condizionati di calce, nutrienti, compattazione, drenaggio e coltura.\n\nIl giallo non prova carenza di N; non inventare metodo, dose o data.\n\nQuesto mais non è il rapporto pomodoro di West Field.', 'Caso scritto distinto: mais\n\npi acca cinque virgola quattro (obiettivo dichiarato sei virgola zero a sette virgola zero), sostanza organica due virgola zero per cento ( superiore a tre per cento ), azoto, fosforo Bassi, potassio Ottimale, suolo compattato e foglie gialle precedenti.\n\nSpiega le categorie fornite con parole semplici.\n\nElenca controlli condizionati di calce, nutrienti, compattazione, drenaggio e coltura.\n\nIl giallo non prova carenza di azoto; non inventare metodo, dose o data.\n\nQuesto mais non è il rapporto pomodoro di West Field.'), ('Farmer Jones: pomodori di West Field\n\npH 5.5, sostanza organica 1.5%, N Basso, P 15 ppm, K 200 ppm, compattazione e drenaggio lento; obiettivi del modello non calibrati in laboratorio.\n\nIncludi cinque sezioni e segnala data, laboratorio e metodo mancanti.\n\nAcidità e N/P richiedono piano colturale/laboratorio; registra K senza fertilizzazione bilanciata automatica.\n\nIndaga strato, umidità e sbocco prima di intervento meccanico e motiva la priorità.\n\nConta la logica del rapporto, non una dose o lavorazione automatica.', 'Farmer Jones: pomodori di West Field\n\npi acca cinque virgola cinque, sostanza organica uno virgola cinque per cento, azoto Basso, fosforo quindici parti per milione, potassio duecento parti per milione, compattazione e drenaggio lento; obiettivi del modello non calibrati in laboratorio.\n\nIncludi cinque sezioni e segnala data, laboratorio e metodo mancanti.\n\nAcidità e azoto, fosforo richiedono piano colturale, laboratorio; registra potassio senza fertilizzazione bilanciata automatica.\n\nIndaga strato, umidità e sbocco prima di intervento meccanico e motiva la priorità.\n\nConta la logica del rapporto, non una dose o lavorazione automatica.'), ('Field B: cinque letture pH\n\nLetture 6.2, 6.4, 6.1, 6.3, 6.2; la data è richiesta ma non fornita.\n\nMostra tutte e cinque le letture in una tabella identificata.\n\nSomma 31.2 e media 31.2/5 = 6.24.\n\nScrivi “media di cinque letture”, non misura di un campione misto; data reale o mancante.\n\nUna media non crea una nuova misura fisica.', 'Field B: cinque letture pi acca\n\nLetture sei virgola due, sei virgola quattro, sei virgola uno, sei virgola tre, sei virgola due; la data è richiesta ma non fornita.\n\nMostra tutte e cinque le letture in una tabella identificata.\n\nSomma trentuno virgola due e media trentuno virgola due diviso per cinque uguale a sei virgola due quattro.\n\nScrivi “media di cinque letture”, non misura di un campione misto; data reale o mancante.\n\nUna media non crea una nuova misura fisica.'), ("Prodotto Paddock 3 in una pagina\n\npH 7.8 alcalino, sostanza organica 1.5% bassa, N Alto, P Molto basso, K Basso; almeno un’azione condizionata per P/K.\n\nIncludi identità Paddock 3 e cinque risultati in lingua comune.\n\nProponi un piano nutritivo condizionato per P e K, calibrato dal laboratorio per la coltura; la farina d'ossa citata nella lista di controllo è un esempio, non un prodotto obbligatorio né una dose prescritta.\n\nIl formatore verifica cinque righe: ID, risultati, chiarezza, azione per carenza e impaginazione, registrando sì/no e prova/correzione.\n\nUn prodotto ordinato richiede comunque revisione reale.", "Prodotto Paddock tre in una pagina\n\npi acca sette virgola otto alcalino, sostanza organica uno virgola cinque per cento bassa, azoto Alto, fosforo Molto basso, potassio Basso; almeno un’azione condizionata per fosforo, potassio.\n\nIncludi identità Paddock tre e cinque risultati in lingua comune.\n\nProponi un piano nutritivo condizionato per fosforo e potassio, calibrato dal laboratorio per la coltura; la farina d'ossa citata nella lista di controllo è un esempio, non un prodotto obbligatorio né una dose prescritta.\n\nIl formatore verifica cinque righe: ID, risultati, chiarezza, azione per carenza e impaginazione, registrando sì, no e prova, correzione.\n\nUn prodotto ordinato richiede comunque revisione reale."), ('Tabella illustrativa, non certificato di laboratorio\n\nModello: pH 5.2; sostanza organica 2.1%; N Basso; P 25 ppm; K 180 ppm, con intervalli illustrativi propri.\n\nMostra cinque righe, unità e intervalli stampati come esempio.\n\nNon unirli a West Field né usare gli intervalli come regola universale per il pomodoro.\n\nRichiedi metodo e riferimento di laboratorio calibrato per la coltura prima di classe o dose.\n\nUna tabella elegante richiede colonne attendibili.', 'Tabella illustrativa, non certificato di laboratorio\n\nModello: pi acca cinque virgola due; sostanza organica due virgola uno per cento; azoto Basso; fosforo venticinque parti per milione; potassio centottanta parti per milione, con intervalli illustrativi propri.\n\nMostra cinque righe, unità e intervalli stampati come esempio.\n\nNon unirli a West Field né usare gli intervalli come regola universale per il pomodoro.\n\nRichiedi metodo e riferimento di laboratorio calibrato per la coltura prima di classe o dose.\n\nUna tabella elegante richiede colonne attendibili.'), ('Tieni distinti i casi scritti finali\n\nCaso A: pH 5.2, N Basso, P Basso, K Medio, sostanza organica 1%; due interventi e esempi di colture. Caso B: pH 6.8, N Medio, P Alto, K Basso; strategia e due colture.\n\nConserva esattamente dati e numero di tecniche/colture richieste.\n\nPer A valuta calce e piano N/P/sostanza organica. Broccoli e fagioli comuni sono a rischio a pH 5.2 secondo guide che preferiscono circa 6–7, non destinati certamente a fallire; dopo miglioramento verificato, pomodoro e mais dolce sono candidati se clima, drenaggio, salinità e varietà lo consentono.\n\nPer B evita P superfluo, verifica K e bilancia N. Pomodoro e mais dolce sono candidati da esaminare a pH 6.8, non promesse né base per una dose.\n\nLe colture richieste rimangono esempi condizionati dal sito.', 'Tieni distinti i casi scritti finali\n\nCaso A: pi acca cinque virgola due, azoto Basso, fosforo Basso, potassio Medio, sostanza organica uno per cento; due interventi e esempi di colture. Caso B: pi acca sei virgola otto, azoto Medio, fosforo Alto, potassio Basso; strategia e due colture.\n\nConserva esattamente dati e numero di tecniche, colture richieste.\n\nPer A valuta calce e piano azoto, fosforo, sostanza organica. Broccoli e fagioli comuni sono a rischio a pi acca cinque virgola due secondo guide che preferiscono circa sei a sette, non destinati certamente a fallire; dopo miglioramento verificato, pomodoro e mais dolce sono candidati se clima, drenaggio, salinità e varietà lo consentono.\n\nPer B evita fosforo superfluo, verifica potassio e bilancia azoto. Pomodoro e mais dolce sono candidati da esaminare a pi acca sei virgola otto, non promesse né base per una dose.\n\nLe colture richieste rimangono esempi condizionati dal sito.')], 'de': [('Einseitiges Produkt Paddock 3\n\npH 7.8 alkalisch, organische Substanz 1.5% niedrig, N Hoch, P Sehr niedrig, K Niedrig; mindestens eine bedingte P/K-Maßnahme.\n\nPaddock-3-Kennung und alle fünf Werte verständlich aufführen.\n\nP/K-Plan kultur- und methodenbezogen; Knochenmehl aus dem Beispiel ist keine Pflichtgabe oder Dosierung.\n\nLehrkraft prüft fünf Zeilen: Kennung, Werte, verständliche Erklärung, Maßnahme gegen Mangel und Lesbarkeit; Ja/Nein mit Beleg/Korrektur.\n\nEin ordentliches Produkt benötigt reale fachliche Bewertung.', 'Einseitiges Produkt Paddock drei\n\nPe Ha sieben Komma acht alkalisch, organische Substanz eins Komma fünf Prozent niedrig, Stickstoff Hoch, Phosphor Sehr niedrig, Kalium Niedrig; mindestens eine bedingte Phosphor, Kalium-Maßnahme.\n\nPaddock-drei-Kennung und alle fünf Werte verständlich aufführen.\n\nPhosphor, Kalium-Plan kultur- und methodenbezogen; Knochenmehl aus dem Beispiel ist keine Pflichtgabe oder Dosierung.\n\nLehrkraft prüft fünf Zeilen: Kennung, Werte, verständliche Erklärung, Maßnahme gegen Mangel und Lesbarkeit; Ja, Nein mit Beleg, Korrektur.\n\nEin ordentliches Produkt benötigt reale fachliche Bewertung.'), ('Farmer Jones: West-Field-Tomaten\n\npH 5.5, organische Substanz 1.5%, N Niedrig, P 15 ppm, K 200 ppm, Verdichtung und langsamer Abfluss; Modellbereiche ohne lokale Laborkalibrierung.\n\nFünf Abschnitte mit ausdrücklich fehlendem Datum, Labor und Verfahren.\n\nSäure und N/P verlangen Kultur-/Laborplan; K nicht mit automatischem Volldünger behandeln.\n\nSperrschicht, Feuchte und Abfluss vor mechanischer Maßnahme prüfen; Priorität begründen.\n\nDer Nutzen liegt im Aufbau und Denken, nicht in einer automatischen Dosis.', 'Farmer Jones: West-Field-Tomaten\n\nPe Ha fünf Komma fünf, organische Substanz eins Komma fünf Prozent, Stickstoff Niedrig, Phosphor fünfzehn Teile pro Million, Kalium zweihundert Teile pro Million, Verdichtung und langsamer Abfluss; Modellbereiche ohne lokale Laborkalibrierung.\n\nFünf Abschnitte mit ausdrücklich fehlendem Datum, Labor und Verfahren.\n\nSäure und Stickstoff, Phosphor verlangen Kultur-, Laborplan; Kalium nicht mit automatischem Volldünger behandeln.\n\nSperrschicht, Feuchte und Abfluss vor mechanischer Maßnahme prüfen; Priorität begründen.\n\nDer Nutzen liegt im Aufbau und Denken, nicht in einer automatischen Dosis.'), ('Field B: fünf pH-Werte\n\nEinzelwerte 6.2, 6.4, 6.1, 6.3, 6.2; das gefragte Datum wird nicht genannt.\n\nAlle fünf Werte in einer Tabelle mit Feldkennung darstellen.\n\nSumme 31.2 und arithmetisches Mittel 31.2/5 = 6.24.\n\n„Mittel aus fünf Werten“, nicht pH einer Mischprobe; echtes Datum oder Lücke.\n\nEin Mittelwert schafft keine neue physische Messung.', 'Field B: fünf Pe Ha-Werte\n\nEinzelwerte sechs Komma zwei, sechs Komma vier, sechs Komma eins, sechs Komma drei, sechs Komma zwei; das gefragte Datum wird nicht genannt.\n\nAlle fünf Werte in einer Tabelle mit Feldkennung darstellen.\n\nSumme einunddreißig Komma zwei und arithmetisches Mittel einunddreißig Komma zwei geteilt durch fünf gleich sechs Komma zwei vier.\n\n„Mittel aus fünf Werten“, nicht Pe Ha einer Mischprobe; echtes Datum oder Lücke.\n\nEin Mittelwert schafft keine neue physische Messung.'), ('Getrennter Schreibfall: Mais\n\npH 5.4 (angegebenes Ziel 6.0–7.0), organische Substanz 2.0% (Ziel >3%), N/P Niedrig, K Optimal, Verdichtung und früheres Vergilben.\n\nDie angegebenen Kategorien in einfacher Sprache erläutern.\n\nListe bedingte nächste Schritte zur Kalkbedarfsprüfung, Nährstoffdeutung, Verdichtungs- und Entwässerungsprüfung sowie Kulturprüfung in einer begründeten Reihenfolge auf.\n\nFrühere gelbe Blätter beweisen keinen N-Mangel; keine Methode, Dosis oder Datum erfinden.\n\nDer Maisfall ist nicht der Tomatenbericht.', 'Getrennter Schreibfall: Mais\n\nPe Ha fünf Komma vier (angegebenes Ziel sechs Komma null bis sieben Komma null), organische Substanz zwei Komma null Prozent (Ziel größer als drei Prozent ), Stickstoff, Phosphor Niedrig, Kalium Optimal, Verdichtung und früheres Vergilben.\n\nDie angegebenen Kategorien in einfacher Sprache erläutern.\n\nListe bedingte nächste Schritte zur Kalkbedarfsprüfung, Nährstoffdeutung, Verdichtungs- und Entwässerungsprüfung sowie Kulturprüfung in einer begründeten Reihenfolge auf.\n\nFrühere gelbe Blätter beweisen keinen Stickstoff-Mangel; keine Methode, Dosis oder Datum erfinden.\n\nDer Maisfall ist nicht der Tomatenbericht.'), ('Lehrtabelle, kein Laborzertifikat\n\nVorgabe: pH 5.2, organische Substanz 2.1%, N Niedrig, P 25 ppm, K 180 ppm samt Beispielbereichen.\n\nZeige fünf Zeilen, Einheiten und gedruckte Bereiche ausdrücklich als Beispiel.\n\nVermische die Werte nicht mit West Field und erkläre Bereiche nicht zu allgemeinen Tomatenwerten.\n\nFrage vor Einstufung oder Dosis nach Methode und kulturkalibrierter Laborreferenz.\n\nEine übersichtliche Tabelle braucht verlässliche Spalten.', 'Lehrtabelle, kein Laborzertifikat\n\nVorgabe: Pe Ha fünf Komma zwei, organische Substanz zwei Komma eins Prozent, Stickstoff Niedrig, Phosphor fünfundzwanzig Teile pro Million, Kalium einhundertachtzig Teile pro Million samt Beispielbereichen.\n\nZeige fünf Zeilen, Einheiten und gedruckte Bereiche ausdrücklich als Beispiel.\n\nVermische die Werte nicht mit West Field und erkläre Bereiche nicht zu allgemeinen Tomatenwerten.\n\nFrage vor Einstufung oder Dosis nach Methode und kulturkalibrierter Laborreferenz.\n\nEine übersichtliche Tabelle braucht verlässliche Spalten.'), ('Spätere schriftliche Fälle bleiben getrennt\n\nFall A: pH 5.2, N Niedrig, P Niedrig, K Mittel, organische Substanz 1%; zwei Verbesserungen und Kulturbeispiele. Fall B: pH 6.8, N Mittel, P Hoch, K Niedrig; Strategie und zwei Kulturen.\n\nJede Datengruppe und geforderte Zahl von Maßnahmen/Kulturen erhalten.\n\nBei A Kalkbedarf sowie N/P-/Humusplanung prüfen. Brokkoli und Gartenbohnen sind bei pH 5.2 gemäß Anbauhinweisen mit etwa pH 6–7 möglicherweise gefährdet, nicht sicher erfolglos. Nach belegter Verbesserung können Tomate und Zuckermais bei passendem Klima, Abfluss, Salzgehalt und Sorte geprüft werden.\n\nBei B unnötige P-Gabe vermeiden, K prüfen und N bilanzieren. Tomate und Zuckermais bei pH 6.8 nur als Kandidaten nennen; der knappe Fall belegt weder Eignung noch K-Dosis.\n\nGefragte Kulturbeispiele bleiben standortabhängig.', 'Spätere schriftliche Fälle bleiben getrennt\n\nFall A: Pe Ha fünf Komma zwei, Stickstoff Niedrig, Phosphor Niedrig, Kalium Mittel, organische Substanz eins Prozent; zwei Verbesserungen und Kulturbeispiele. Fall B: Pe Ha sechs Komma acht, Stickstoff Mittel, Phosphor Hoch, Kalium Niedrig; Strategie und zwei Kulturen.\n\nJede Datengruppe und geforderte Zahl von Maßnahmen, Kulturen erhalten.\n\nBei A Kalkbedarf sowie Stickstoff, Phosphor-, Humusplanung prüfen. Brokkoli und Gartenbohnen sind bei Pe Ha fünf Komma zwei gemäß Anbauhinweisen mit etwa Pe Ha sechs bis sieben möglicherweise gefährdet, nicht sicher erfolglos. Nach belegter Verbesserung können Tomate und Zuckermais bei passendem Klima, Abfluss, Salzgehalt und Sorte geprüft werden.\n\nBei B unnötige Phosphor-Gabe vermeiden, Kalium prüfen und Stickstoff bilanzieren. Tomate und Zuckermais bei Pe Ha sechs Komma acht nur als Kandidaten nennen; der knappe Fall belegt weder Eignung noch Kalium-Dosis.\n\nGefragte Kulturbeispiele bleiben standortabhängig.')]}
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
        projection=read(HERE/('provenance/gated-source-slice-'+u['locale']+'.json'))
        validate_gated_worked_unit(u,projection,projection['canonicalWholeSourceSHA256'])
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req,runtime

def lane():
    loc=os.environ.get('LOCALE_LANE');assert loc in ['ar-EG','en','it','de'];assert os.environ.get('GITHUB_JOB')=={'ar-EG':'narrate_ar','en':'narrate_en','it':'narrate_it','de':'narrate_de'}[loc];return loc

def require_actions():
    lane()
    assert os.environ.get('GITHUB_ACTIONS')=='true','Actions only'
    assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820' and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418' and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s215-gated-audio-20261023-r1'
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
