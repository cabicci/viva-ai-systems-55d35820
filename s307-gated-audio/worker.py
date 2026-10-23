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
IDS = ('S3-07-ar-EG-E01-r1', 'S3-07-ar-EG-E02-r1', 'S3-07-ar-EG-E03-r1', 'S3-07-ar-EG-E04-r1', 'S3-07-en-E01-r1', 'S3-07-en-E02-r1', 'S3-07-en-E03-r1', 'S3-07-en-E04-r1', 'S3-07-it-E01-r1', 'S3-07-it-E02-r1', 'S3-07-it-E03-r1', 'S3-07-it-E04-r1', 'S3-07-de-E01-r1', 'S3-07-de-E02-r1', 'S3-07-de-E03-r1', 'S3-07-de-E04-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==16
    assert(req['scope'],req['stepId'])==('S307_SIXTEEN_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s307-gated-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['E01','E02','E03','E04']
        voice='Charon'if group in ['E01','E03']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/reasoning/4', '/examples/0/reasoning/5', '/examples/0/reasoning/6', '/examples/0/reasoning/7', '/examples/0/reasoning/8', '/examples/0/reasoning/9', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/reasoning/3', '/examples/1/reasoning/4', '/examples/1/reasoning/5', '/examples/1/reasoning/6', '/examples/1/reasoning/7', '/examples/1/reasoning/8', '/examples/1/reasoning/9', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/reasoning/4', '/examples/2/reasoning/5', '/examples/2/reasoning/6', '/examples/2/reasoning/7', '/examples/2/reasoning/8', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/reasoning/3', '/examples/3/reasoning/4', '/examples/3/reasoning/5', '/examples/3/reasoning/6', '/examples/3/reasoning/7', '/examples/3/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/reasoning/4', '/examples/0/reasoning/5', '/examples/0/reasoning/6', '/examples/0/reasoning/7', '/examples/0/reasoning/8', '/examples/0/reasoning/9', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/reasoning/3', '/examples/1/reasoning/4', '/examples/1/reasoning/5', '/examples/1/reasoning/6', '/examples/1/reasoning/7', '/examples/1/reasoning/8', '/examples/1/reasoning/9', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/reasoning/4', '/examples/2/reasoning/5', '/examples/2/reasoning/6', '/examples/2/reasoning/7', '/examples/2/reasoning/8', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/reasoning/3', '/examples/3/reasoning/4', '/examples/3/reasoning/5', '/examples/3/reasoning/6', '/examples/3/reasoning/7', '/examples/3/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/reasoning/4', '/examples/0/reasoning/5', '/examples/0/reasoning/6', '/examples/0/reasoning/7', '/examples/0/reasoning/8', '/examples/0/reasoning/9', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/reasoning/3', '/examples/1/reasoning/4', '/examples/1/reasoning/5', '/examples/1/reasoning/6', '/examples/1/reasoning/7', '/examples/1/reasoning/8', '/examples/1/reasoning/9', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/reasoning/4', '/examples/2/reasoning/5', '/examples/2/reasoning/6', '/examples/2/reasoning/7', '/examples/2/reasoning/8', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/reasoning/3', '/examples/3/reasoning/4', '/examples/3/reasoning/5', '/examples/3/reasoning/6', '/examples/3/reasoning/7', '/examples/3/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/reasoning/4', '/examples/0/reasoning/5', '/examples/0/reasoning/6', '/examples/0/reasoning/7', '/examples/0/reasoning/8', '/examples/0/reasoning/9', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/reasoning/3', '/examples/1/reasoning/4', '/examples/1/reasoning/5', '/examples/1/reasoning/6', '/examples/1/reasoning/7', '/examples/1/reasoning/8', '/examples/1/reasoning/9', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/reasoning/3', '/examples/2/reasoning/4', '/examples/2/reasoning/5', '/examples/2/reasoning/6', '/examples/2/reasoning/7', '/examples/2/reasoning/8', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/reasoning/3', '/examples/3/reasoning/4', '/examples/3/reasoning/5', '/examples/3/reasoning/6', '/examples/3/reasoning/7', '/examples/3/takeaway']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/examples/')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الحالة ١: قطعة طماطم في أرض رملية\n\nأرض رملية في جو حار وفيه رياح، والري فيها سطحي أو بالغمر؛ الطماطم شكلها كويس الصبح وبتدبل بعد الظهر، وفي ورق قديم لونه باهت أو أصفر.\n\nطلب الماء وقت النهار ممكن يزيد على امتصاص الجذور مؤقتًا؛ خزن الماء القليل قرب الجذور أو الغمر غير المضبوط ممكن يساهم.\n\nاصفرار الورق القديم يفتح احتمال نقص N أو K المتحركين، أو غسل العناصر، أو مشكلة جذور، أو سبب آخر.\n\nافحص رطوبة منطقة الجذور صباحًا وبعد الظهر، والجذور والصرف ووقت آخر ري والجو وإمكانية التنقيط.\n\nهات دليل تحليل تربة/نسيج وسجّل مرحلة المحصول قبل اختيار سماد.\n\nفكّر في نظام تنقيط مفلتر قابل للصيانة بدل غمر غير مضبوط للموقع ده، مع قياس أدائه؛ ما تفرضش ريًا يوميًا من الشكل وحده. توصيل المياه قرب الجذور بيتجنب انجراف الرذاذ في الهواء، وممكن يقلل تبخر سطح التربة وبلل الحشائش بين الصفوف، ويخلي الورق أنشف فيقل خطر بعض الأمراض. دفعات صغيرة مع القياس ممكن تناسب مخزون الرمل المحدود، لكن الزيادة تقدر تنزل تحت الجذور؛ الفوايد مرتبطة بالتصميم والتشغيل والظروف.\n\nاختار مصدر عناصر مناسبًا للطماطم بعد دليل؛ المنتج الذائب المتوازن فئة ممكنة مش تشخيص.\n\nاعتمد على التحاليل واحتياج النبات والموجود والإرشاد المحلي؛ لون الورقة ما يطلعش جرعة.\n\nاربط الإضافة باحتياج متأكد منه وخطر الفقد؛ التسميد مع كل رية أو رية والتانية مش جدول تلقائي.\n\nلو التسميد مع التنقيط مبرر، وصّل لمنطقة الجذور حسب المنتج وراقب الغسل وانتظام التوزيع.\n\nنموذج الحالة بيتكلم عن فئة سماد لطماطم في مرحلة الإثمار. اتأكد من مرحلة المحصول الفعلية قبل استخدام المثال؛ سؤال البنك لوحده ما بيحددش تركيب سماد.\n\nافصل احتمالات الحر والماء والعناصر، واختبرها، ثم اختر ريًا وخطة 4R مشروطين.', 'الحالة واحد: قطعة طماطم في أرض رملية\n\nأرض رملية في جو حار وفيه رياح، والري فيها سطحي أو بالغمر؛ الطماطم شكلها كويس الصبح وبتدبل بعد الظهر، وفي ورق قديم لونه باهت أو أصفر.\n\nطلب الماء وقت النهار ممكن يزيد على امتصاص الجذور بشكل مؤقت؛ خزن الماء القليل قرب الجذور أو الغمر غير المضبوط ممكن يساهم.\n\nاصفرار الورق القديم يفتح احتمال نقص إن أو كي المتحركين، أو غسل العناصر، أو مشكلة جذور، أو سبب آخر.\n\nافحص رطوبة منطقة الجذور الصبح وبعد الظهر، والجذور والصرف ووقت آخر ري والجو وإمكانية التنقيط.\n\nهات دليل تحليل تربة، نسيج وسجّل مرحلة المحصول قبل اختيار سماد.\n\nفكّر في نظام تنقيط مفلتر قابل للصيانة بدل غمر غير مضبوط للموقع ده، مع قياس أدائه؛ ما تفرضش ري كل يوم من الشكل وحده. توصيل المياه قرب الجذور بيتجنب انجراف الرذاذ في الهواء، وممكن يقلل تبخر سطح التربة وبلل الحشائش بين الصفوف، ويخلي الورق أنشف فيقل خطر بعض الأمراض. دفعات صغيرة مع القياس ممكن تناسب مخزون الرمل المحدود، لكن الزيادة تقدر تنزل تحت الجذور؛ الفوايد مرتبطة بالتصميم والتشغيل والظروف.\n\nاختار مصدر عناصر مناسب للطماطم بعد دليل؛ المنتج الذائب المتوازن فئة ممكنة مش تشخيص.\n\nاعتمد على التحاليل واحتياج النبات والموجود والإرشاد المحلي؛ لون الورقة ما يطلعش جرعة.\n\nاربط الإضافة باحتياج متأكد منه وخطر الفقد؛ التسميد مع كل رية أو رية والتانية مش جدول تلقائي.\n\nلو التسميد مع التنقيط مبرر، وصّل لمنطقة الجذور حسب المنتج وراقب الغسل وانتظام التوزيع.\n\nنموذج الحالة بيتكلم عن فئة سماد لطماطم في مرحلة الإثمار. اتأكد من مرحلة المحصول الفعلية قبل استخدام المثال؛ سؤال البنك لوحده ما بيحددش تركيب سماد.\n\nافصل احتمالات الحر والماء والعناصر، واختبرها، وبعدها اختار ري وخطة بقواعد المصدر والكمية والوقت والمكان، حسب الشروط.'), ('الحالة ٢: قمح متقزم في طين مبلول\n\nبعد مطر غزير، ماء واقف في أرض طينية؛ القمح متقزم وبعض حواف الورق القديم مصفرة.\n\nالركود المائي ممكن يمنع الأكسجين عن الجذور ويضعف امتصاص الماء والعناصر.\n\nنقص K احتمال من الحواف، لكن إجهاد الجذور أو اختلال عنصر آخر أو تلف ممكن يشبهه.\n\nحدد أماكن الماء والصرف، وافحص الجذور بأمان وأعد التقييم بعد الصرف؛ لو استمرت العلامات اطلب تحليل K مناسبًا.\n\nاتأكد هل صرف سطحي مؤقت آمن ومسموح في الموقع؛ الصرف طويل الأجل يحتاج تقييمًا للموقع.\n\nوقف إضافة الري ما دامت التربة مشبعة وابدأ تقييم الصرف؛ ده مش معناه إن أي أرض طينية لا تتروي أبدًا.\n\nما تختارش مصدر K زي كبريتات البوتاسيوم إلا بعد ما تتأكد من الاحتياج؛ رش K على الورق مش حل سريع لازم تستخدمه.\n\nاعتمد على تحليل مناسب والمحصول وتوصية محلية بعد تحسن الظروف؛ ما فيش جرعة قليلة ثابتة.\n\nما تضيفش سمادًا في الماء الراكد؛ راجع تعافي الجذور والنبات الأول.\n\nلاحتياج متأكد منه، اختار إضافة للتربة أو للورق إذا بطاقة المنتج تسمح، مع مراعاة الامتصاص والجريان وأمان المحصول.\n\nالحالة التعليمية بتذكر المادة العضوية لتحسين البناء والصرف تحت السطحي بالمواسير كأمثلة طويلة الأجل. كل اختيار محتاج تقييم وتصميم مناسب للموقع، مش علاج تلقائي ولا تصريح حفر.\n\nالصرف وأكسجين الجذور أول مشكلة تتفحص؛ K فرضية ثانية محتاجة اختبارًا.', 'الحالة اتنين: قمح متقزم في طين مبلول\n\nبعد مطر غزير، ماء واقف في أرض طينية؛ القمح متقزم وبعض حواف الورق القديم مصفرة.\n\nالركود المائي ممكن يمنع الأكسجين عن الجذور ويضعف امتصاص الماء والعناصر.\n\nنقص كي احتمال من الحواف، لكن إجهاد الجذور أو اختلال عنصر آخر أو تلف ممكن يشبهه.\n\nحدد أماكن الماء والصرف، وافحص الجذور بأمان وأعد التقييم بعد الصرف؛ لو استمرت العلامات اطلب تحليل كي مناسب.\n\nاتأكد هل صرف سطحي مؤقت آمن ومسموح في الموقع؛ الصرف طويل الأجل يحتاج تقييم للموقع.\n\nوقف إضافة الري ما دامت التربة مشبعة وابدأ تقييم الصرف؛ ده مش معناه إن أي أرض طينية لا تتروي أبدًا.\n\nما تختارش مصدر كي زي كبريتات البوتاسيوم إلا بعد ما تتأكد من الاحتياج؛ رش كي على الورق مش حل سريع لازم تستخدمه.\n\nاعتمد على تحليل مناسب والمحصول وتوصية محلية بعد تحسن الظروف؛ ما فيش جرعة قليلة ثابتة.\n\nما تضيفش سماد في الماء الراكد؛ راجع تعافي الجذور والنبات الأول.\n\nلاحتياج متأكد منه، اختار إضافة للتربة أو للورق إذا بطاقة المنتج تسمح، مع مراعاة الامتصاص والجريان وأمان المحصول.\n\nالحالة التعليمية بتذكر المادة العضوية لتحسين البناء والصرف تحت السطحي بالمواسير كأمثلة طويلة الأجل. كل اختيار محتاج تقييم وتصميم مناسب للموقع، مش علاج تلقائي ولا تصريح حفر.\n\nالصرف وأكسجين الجذور أول مشكلة تتفحص؛ كي فرضية ثانية محتاجة اختبار.'), ('الحالة ٣: تخطيط ورقيات في لوم\n\nفي محصول ورقي مخطط له في تربة لوم ومياه محدودة؛ البطاقة تخطيط وليست أعراض نقص ظهرت بالفعل.\n\nالتنقيط ممكن يوزع الماء المحدود قرب الصفوف لو المعدات والصيانة مناسبين.\n\nاحتياج النيتروجين ممكن يكون مهمًا، لكن مفيش نقص أو كمية اتثبتت.\n\nحدد المحصول ومرحلة النمو، والبخر-نتح المحلي ET، والمطر الفعّال، ومخزون الميه في منطقة الجذور، وملاءمة النظام، وجودة الميه، وتحليل مناسب للعناصر.\n\nقارن التكاليف والصيانة واقرأ تركيب السماد المكتوب.\n\nفكّر في تنقيط مصمم ومراقَب؛ مفيش دورة ري أسبوعية أو مرتين في الأسبوع تصلح للجميع.\n\nاختار منتج NPK كاملًا فقط لو الخطة محتاجة N وP وK. نترات الكالسيوم فيها N وCa وليست NPK متوازنًا.\n\nاستخرج الكمية من احتياج المحصول والتحليل والإرشاد المحلي، مش من عبارة «قليل ومتكرر» فقط.\n\nاربط الإضافة بالنمو والاحتياج المقاس؛ التسميد كل أسبوع أو كل أسبوعين مش قاعدة عامة.\n\nلو منتج ذائب معتمد والمعدات مناسبة، أوصله مع تنقيط مفحوص لمنطقة الجذور؛ وإلا اختار بديلًا صالحًا.\n\nده تخطيط وقائي؛ ما تخترعش نقصًا مشخصًا أو جدول ماء/سماد ثابتًا.', 'الحالة تلاتة: تخطيط ورقيات في لوم\n\nفي محصول ورقي مخطط له في تربة لوم ومياه محدودة؛ البطاقة تخطيط وليست أعراض نقص ظهرت بالفعل.\n\nالتنقيط ممكن يوزع الماء المحدود قرب الصفوف لو المعدات والصيانة مناسبين.\n\nاحتياج النيتروجين ممكن يكون مهمًا، لكن مفيش نقص أو كمية اتثبتت.\n\nحدد المحصول ومرحلة النمو، والبخر والنتح المحلي، والمطر الفعّال، ومخزون الميه في منطقة الجذور، وملاءمة النظام، وجودة الميه، وتحليل مناسب للعناصر.\n\nقارن التكاليف والصيانة واقرأ تركيب السماد المكتوب.\n\nفكّر في تنقيط مصمم ومراقَب؛ مفيش دورة ري أسبوعية أو مرتين في الأسبوع تصلح للجميع.\n\nاختار منتج النيتروجين والفوسفور والبوتاسيوم كامل فقط لو الخطة محتاجة إن وبي وكي. نترات الكالسيوم فيها نيتروجين وكالسيوم، لكنها مش سماد متوازن فيه النيتروجين والفوسفور والبوتاسيوم.\n\nاستخرج الكمية من احتياج المحصول والتحليل والإرشاد المحلي، مش من عبارة «قليل ومتكرر» فقط.\n\nاربط الإضافة بالنمو والاحتياج المقاس؛ التسميد كل أسبوع أو كل أسبوعين مش قاعدة عامة.\n\nلو منتج ذائب معتمد والمعدات مناسبة، أوصله مع تنقيط مفحوص لمنطقة الجذور؛ وإلا اختار بديل صالح.\n\nده تخطيط وقائي؛ ما تخترعش نقص مشخص أو جدول ماء وسماد ثابت.'), ('الحالة ٤: ذرة صغيرة بنفسجية في طين بارد\n\nذرة صغيرة ورقها بنفسجي ونموها بطيء في ربيع بارد على تربة طينية ثقيلة.\n\nالبرودة أو البلل أو ضعف التجذير ممكن يحد امتصاص P حتى لو P كافي في التربة.\n\nنقص P حقيقي أو سبب آخر يفضل احتمالًا.\n\nافحص الحرارة والصرف ونمو الجذور وتحليل P مناسبًا، وهل تتحسن الذرة لما التربة تدفى.\n\nما تزودش ماء تلقائيًا لتربة طينية باردة ومبلولة؛ افحص الرطوبة والصرف الأول.\n\nDAP أو فوسفات أحادي الأمونيوم MAP أمثلة محتملة لمصدر P، بس بعد التأكد من الاحتياج الزراعي وملاءمة المنتج.\n\nاستند للتحليل وإرشاد محلي للمحصول، مش «كمية بسيطة» مبهمة.\n\nخطط للوقت المناسب لاحتياج P وظروف آمنة؛ بلاش علاج فوري من غير فحص.\n\nالشريط قرب الجذور الصغيرة ممكن يناسب مع بعد آمن عن البذرة حسب المنتج، ومش متفوق في كل ظرف على البدائل. المثال التعليمي ده بيوضح شريط سماد بادئ وقت الزراعة على بُعد 2 بوصة جنب صف البذور و2 بوصة تحته. ده مثال لطريقة الوضع، مش ضبط ثابت لكل الحالات ولا تعليمات نحفر جنب شتلات قائمة. الوضع الفعلي يتحدد بتعليمات المنتج والمحصول والمعدات وإرشاد محلي يحافظ على سلامة البذور.\n\nاختبر فرضية P وظروف التربة قبل توصية تسميد بأربع قرارات.', 'الحالة أربعة: ذرة صغيرة بنفسجية في طين بارد\n\nذرة صغيرة ورقها بنفسجي ونموها بطيء في ربيع بارد على تربة طينية ثقيلة.\n\nالبرودة أو البلل أو ضعف التجذير ممكن يحد امتصاص بي حتى لو بي كافي في التربة.\n\nنقص بي حقيقي أو سبب آخر يفضل احتمال.\n\nافحص الحرارة والصرف ونمو الجذور وتحليل بي مناسب، وهل تتحسن الذرة لما التربة تدفى.\n\nما تزودش ماء تلقائي لتربة طينية باردة ومبلولة؛ افحص الرطوبة والصرف الأول.\n\nدي إيه بي أو فوسفات أحادي الأمونيوم إم إيه بي أمثلة محتملة لمصدر بي، بس بعد التأكد من الاحتياج الزراعي وملاءمة المنتج.\n\nاستند للتحليل وإرشاد محلي للمحصول، مش «كمية بسيطة» مبهمة.\n\nخطط للوقت المناسب لاحتياج بي وظروف آمنة؛ بلاش علاج فوري من غير فحص.\n\nالشريط قرب الجذور الصغيرة ممكن يناسب مع بعد آمن عن البذرة حسب المنتج، ومش متفوق في كل ظرف على البدائل. المثال التعليمي ده بيوضح شريط سماد بادئ وقت الزراعة على بُعد اتنين بوصة جنب صف البذور و اتنين بوصة تحته. ده مثال لطريقة الوضع، مش ضبط ثابت لكل الحالات ولا تعليمات نحفر جنب شتلات قائمة. الوضع الفعلي يتحدد بتعليمات المنتج والمحصول والمعدات وإرشاد محلي يحافظ على سلامة البذور.\n\nاختبر فرضية بي وظروف التربة قبل توصية تسميد بأربع قرارات.')], 'en': [('Case 1: sandy tomato patch\n\nHot, windy sandy plot with flood/surface watering; tomatoes look well in the morning but wilt in the afternoon and older leaves are pale or yellow.\n\nHigh daytime demand may exceed short-term root uptake; limited root-zone storage or poorly controlled flood application may contribute.\n\nOlder-leaf yellowing raises mobile N or K shortage, leaching, root problems or another cause.\n\nSample moisture through the root zone in morning and afternoon; inspect roots, drainage, timing of previous watering, weather and emitter feasibility.\n\nObtain soil/tissue nutrient evidence and a crop-stage record before selecting a fertilizer.\n\nConsider a filtered, maintainable drip system over uncontrolled flood delivery for the stated site, while measuring its operation; do not prescribe daily watering from appearance alone. Near-root delivery avoids overhead spray drift, can reduce soil-surface evaporation and inter-row weed wetting, and can keep foliage drier to reduce some disease risk. Small monitored applications can suit limited sandy storage, but excess can still pass below roots; these benefits depend on design, operation and conditions.\n\nChoose a tomato-appropriate nutrient source only after evidence; a balanced soluble product is one possible product class, not a diagnosis.\n\nUse test results, plant demand, current supply and local guidance; no number follows from the leaf colour.\n\nMatch confirmed demand and loss risk; fertigation every watering or every other watering is not an automatic schedule.\n\nUse product-approved root-zone delivery if fertigation is justified; monitor leaching and uniformity.\n\nThe teaching model discusses a fruiting-stage tomato fertilizer class. Confirm the actual stage before using that example; the bank question alone does not supply a fertilizer analysis.\n\nSeparate heat/water and nutrient hypotheses, verify both, then choose a conditional water and 4R plan.', 'Case one: sandy tomato patch\n\nHot, windy sandy plot with flood, surface watering; tomatoes look well in the morning but wilt in the afternoon and older leaves are pale or yellow.\n\nHigh daytime demand may exceed short-term root uptake; limited root-zone storage or poorly controlled flood application may contribute.\n\nOlder-leaf yellowing raises mobile N or K shortage, leaching, root problems or another cause.\n\nSample moisture through the root zone in morning and afternoon; inspect roots, drainage, timing of previous watering, weather and emitter feasibility.\n\nObtain soil, tissue nutrient evidence and a crop-stage record before selecting a fertilizer.\n\nConsider a filtered, maintainable drip system over uncontrolled flood delivery for the stated site, while measuring its operation; do not prescribe daily watering from appearance alone. Near-root delivery avoids overhead spray drift, can reduce soil-surface evaporation and inter-row weed wetting, and can keep foliage drier to reduce some disease risk. Small monitored applications can suit limited sandy storage, but excess can still pass below roots; these benefits depend on design, operation and conditions.\n\nChoose a tomato-appropriate nutrient source only after evidence; a balanced soluble product is one possible product class, not a diagnosis.\n\nUse test results, plant demand, current supply and local guidance; no number follows from the leaf colour.\n\nMatch confirmed demand and loss risk; fertigation every watering or every other watering is not an automatic schedule.\n\nUse product-approved root-zone delivery if fertigation is justified; monitor leaching and uniformity.\n\nThe teaching model discusses a fruiting-stage tomato fertilizer class. Confirm the actual stage before using that example; the bank question alone does not supply a fertilizer analysis.\n\nSeparate heat, water and nutrient hypotheses, verify both, then choose a conditional plan for water and the four R principles.'), ('Case 2: stunted wheat in wet clay\n\nAfter heavy rain the clay field has standing water; wheat is stunted and some older leaf margins yellow.\n\nWaterlogging can deprive roots of oxygen and reduce water or nutrient uptake.\n\nK shortage is possible from marginal symptoms, but root stress, other nutrient disorders or damage can mimic it.\n\nMap standing water and drainage, examine roots when safe and reassess after drainage; obtain soil/tissue K evidence if symptoms persist.\n\nCheck whether feasible temporary surface drainage is safe and permitted at this site; plan longer-term drainage only after site evaluation.\n\nStop added irrigation while the soil is saturated and prioritise drainage assessment; do not claim that every clay field should avoid all irrigation forever.\n\nOnly select a K source such as potassium sulfate if a need is established; foliar K is not a mandatory quick fix.\n\nUse appropriate test, crop and local recommendation after conditions improve; no fixed low rate.\n\nAvoid fertiliser application into standing water; reassess roots and plant recovery first.\n\nChoose soil or labelled foliar placement for a verified need, considering uptake, runoff and crop safety.\n\nThe teaching case names organic matter for structure and subsurface tile drainage as long-term examples. They require site-specific assessment and design, not an automatic cure or permission to excavate.\n\nDrainage/root oxygen is the first problem to investigate; K is a testable secondary hypothesis.', 'Case two: stunted wheat in wet clay\n\nAfter heavy rain the clay field has standing water; wheat is stunted and some older leaf margins yellow.\n\nWaterlogging can deprive roots of oxygen and reduce water or nutrient uptake.\n\nK shortage is possible from marginal symptoms, but root stress, other nutrient disorders or damage can mimic it.\n\nMap standing water and drainage, examine roots when safe and reassess after drainage; obtain soil, tissue K evidence if symptoms persist.\n\nCheck whether feasible temporary surface drainage is safe and permitted at this site; plan longer-term drainage only after site evaluation.\n\nStop added irrigation while the soil is saturated and prioritise drainage assessment; do not claim that every clay field should avoid all irrigation forever.\n\nOnly select a K source such as potassium sulfate if a need is established; foliar K is not a mandatory quick fix.\n\nUse appropriate test, crop and local recommendation after conditions improve; no fixed low rate.\n\nAvoid fertiliser application into standing water; reassess roots and plant recovery first.\n\nChoose soil or labelled foliar placement for a verified need, considering uptake, runoff and crop safety.\n\nThe teaching case names organic matter for structure and subsurface tile drainage as long-term examples. They require site-specific assessment and design, not an automatic cure or permission to excavate.\n\nDrainage, root oxygen is the first problem to investigate; K is a testable secondary hypothesis.'), ("Case 3: leafy crop planning on loam\n\nA leafy crop is planned in loam with limited water; the card describes planning, not an existing deficiency symptom.\n\nDrip may distribute limited water near rows if equipment and maintenance are feasible.\n\nNitrogen demand may be substantial, but no deficiency or rate is established.\n\nIdentify crop and stage, local ET and effective rainfall, root-zone storage, system suitability, water quality and a valid nutrient test.\n\nCompare costs and maintenance; check fertilizer product analysis.\n\nConsider a designed, monitored drip system; no blanket weekly or twice-weekly irrigation cycle.\n\nChoose a complete NPK formulation only if the nutrient plan requires N, P and K. Calcium nitrate supplies N and Ca; it is not a balanced NPK product.\n\nDerive from crop need, test and local guidance, not 'a little and often' alone.\n\nFit applications to growth and measured demand; neither weekly nor fortnightly fertigation is universal.\n\nIf an approved soluble product and equipment permit fertigation, deliver through a checked drip system to the root zone; otherwise choose a suitable alternative.\n\nThis is preventive planning; do not invent a diagnosed deficiency or fixed water/fertilizer schedule.", "Case three: leafy crop planning on loam\n\nA leafy crop is planned in loam with limited water; the card describes planning, not an existing deficiency symptom.\n\nDrip may distribute limited water near rows if equipment and maintenance are feasible.\n\nNitrogen demand may be substantial, but no deficiency or rate is established.\n\nIdentify crop and stage, local evapotranspiration and effective rainfall, root-zone storage, system suitability, water quality and a valid nutrient test.\n\nCompare costs and maintenance; check fertilizer product analysis.\n\nConsider a designed, monitored drip system; no blanket weekly or twice-weekly irrigation cycle.\n\nChoose a complete N P K formulation only if the nutrient plan requires N, P and K. Calcium nitrate supplies N and C A; it is not a balanced N P K product.\n\nDerive from crop need, test and local guidance, not 'a little and often' alone.\n\nFit applications to growth and measured demand; neither weekly nor fortnightly fertigation is universal.\n\nIf an approved soluble product and equipment permit fertigation, deliver through a checked drip system to the root zone; otherwise choose a suitable alternative.\n\nThis is preventive planning; do not invent a diagnosed deficiency or fixed water, fertilizer schedule."), ("Case 4: purple young maize in cold clay\n\nYoung maize shows purple leaves and slow growth during a cold spring on heavy clay.\n\nRestricted P uptake from cold/wet soil or limited rooting may cause the sign even if soil P is adequate.\n\nA true soil P deficiency or another cause remains possible.\n\nAssess temperature, drainage, root growth, relevant soil P test and whether the crop improves as the soil warms.\n\nDo not add water automatically to a cold wet clay soil; check moisture and drainage first.\n\nDAP or monoammonium phosphate (MAP) are possible P-source examples only if agronomic need and product suitability are confirmed.\n\nUse test and local crop guidance, not a vague 'modest' dose.\n\nPlan when P is needed and field conditions permit safe application; avoid an unexamined immediate remedy.\n\nA safe band near young roots can be appropriate, with product-specific separation from the seed and no universal superiority over every alternative. This teaching example illustrates an at-planting starter band 2 inches to the side and 2 inches below the seed row. This is a placement example, not a universal setting or an instruction to dig beside established seedlings. Actual placement must follow the product, crop, equipment and local seed-safety guidance.\n\nTest the P hypothesis and soil conditions before a four-part fertilizer recommendation.", "Case four: purple young maize in cold clay\n\nYoung maize shows purple leaves and slow growth during a cold spring on heavy clay.\n\nRestricted P uptake from cold, wet soil or limited rooting may cause the sign even if soil P is adequate.\n\nA true soil P deficiency or another cause remains possible.\n\nAssess temperature, drainage, root growth, relevant soil P test and whether the crop improves as the soil warms.\n\nDo not add water automatically to a cold wet clay soil; check moisture and drainage first.\n\nD A P or monoammonium phosphate (M A P) are possible P-source examples only if agronomic need and product suitability are confirmed.\n\nUse test and local crop guidance, not a vague 'modest' dose.\n\nPlan when P is needed and field conditions permit safe application; avoid an unexamined immediate remedy.\n\nA safe band near young roots can be appropriate, with product-specific separation from the seed and no universal superiority over every alternative. This teaching example illustrates an at-planting starter band two inches to the side and two inches below the seed row. This is a placement example, not a universal setting or an instruction to dig beside established seedlings. Actual placement must follow the product, crop, equipment and local seed-safety guidance.\n\nTest the P hypothesis and soil conditions before a four-part fertilizer recommendation.")], 'it': [('Caso 1: pomodori su sabbia\n\nTerreno sabbioso caldo e ventoso con irrigazione superficiale; pomodori sani al mattino ma appassiti al pomeriggio, foglie vecchie pallide o gialle.\n\nLa domanda diurna può superare temporaneamente l’assorbimento; poca riserva radicale o irrigazione a scorrimento non controllata possono contribuire.\n\nIl giallo sulle foglie vecchie suggerisce carenza mobile di N o K, lisciviazione, problemi radicali o altro.\n\nControlla umidità radicale mattina/pomeriggio, radici, drenaggio, ultimo turno irriguo, meteo e fattibilità del goccia.\n\nOttieni analisi del suolo/tessuti e fase colturale prima di scegliere concime.\n\nValuta un impianto a goccia filtrato e mantenibile al posto di apporti superficiali incontrollati, misurandone il funzionamento; non prescrivere acqua ogni giorno dal solo aspetto. La distribuzione vicino alle radici evita la deriva del getto in aria, può ridurre evaporazione dal suolo e bagnatura delle infestanti tra le file e mantenere più asciutte le foglie, riducendo alcuni rischi di malattia. Piccoli apporti monitorati possono adattarsi alla limitata riserva della sabbia, ma l’eccesso può ancora scendere sotto le radici; i vantaggi dipendono da progetto, gestione e condizioni.\n\nScegli la fonte adatta al pomodoro solo dopo prove; un prodotto solubile bilanciato è una classe possibile, non una diagnosi.\n\nUsa risultati, domanda colturale, disponibilità esistente e guida locale; il colore non fornisce dose.\n\nConferma domanda e rischio di perdite; fertirrigare ogni turno o a turni alterni non è automatico.\n\nSe la fertirrigazione è giustificata, usa erogazione radicale autorizzata e controlla lisciviazione e uniformità.\n\nIl modello parla di una classe di concime per pomodori in fruttificazione. Conferma la fase reale; la domanda del banco da sola non determina l’analisi del prodotto.\n\nDistingui ipotesi su caldo/acqua e nutrienti, verifica entrambe e poi scegli acqua e 4R condizionate.', 'Caso uno: pomodori su sabbia\n\nTerreno sabbioso caldo e ventoso con irrigazione superficiale; pomodori sani al mattino ma appassiti al pomeriggio, foglie vecchie pallide o gialle.\n\nLa domanda diurna può superare temporaneamente l’assorbimento; poca riserva radicale o irrigazione a scorrimento non controllata possono contribuire.\n\nIl giallo sulle foglie vecchie suggerisce carenza mobile di enne o cappa, lisciviazione, problemi radicali o altro.\n\nControlla umidità radicale mattina, pomeriggio, radici, drenaggio, ultimo turno irriguo, meteo e fattibilità del goccia.\n\nOttieni analisi del suolo, tessuti e fase colturale prima di scegliere concime.\n\nValuta un impianto a goccia filtrato e mantenibile al posto di apporti superficiali incontrollati, misurandone il funzionamento; non prescrivere acqua ogni giorno dal solo aspetto. La distribuzione vicino alle radici evita la deriva del getto in aria, può ridurre evaporazione dal suolo e bagnatura delle infestanti tra le file e mantenere più asciutte le foglie, riducendo alcuni rischi di malattia. Piccoli apporti monitorati possono adattarsi alla limitata riserva della sabbia, ma l’eccesso può ancora scendere sotto le radici; i vantaggi dipendono da progetto, gestione e condizioni.\n\nScegli la fonte adatta al pomodoro solo dopo prove; un prodotto solubile bilanciato è una classe possibile, non una diagnosi.\n\nUsa risultati, domanda colturale, disponibilità esistente e guida locale; il colore non fornisce dose.\n\nConferma domanda e rischio di perdite; fertirrigare ogni turno o a turni alterni non è automatico.\n\nSe la fertirrigazione è giustificata, usa erogazione radicale autorizzata e controlla lisciviazione e uniformità.\n\nIl modello parla di una classe di concime per pomodori in fruttificazione. Conferma la fase reale; la domanda del banco da sola non determina l’analisi del prodotto.\n\nDistingui ipotesi su caldo, acqua e nutrienti, verifica entrambe e poi scegli un piano condizionato per l’acqua e per i quattro principi R.'), ('Caso 2: frumento basso in argilla bagnata\n\nDopo forti piogge, ristagno nel campo argilloso; frumento stentato e margini di alcune foglie vecchie ingialliti.\n\nIl ristagno può privare le radici di ossigeno e ridurre il loro assorbimento di acqua o nutrienti.\n\nLa carenza di K è possibile per i margini, ma stress radicale, altri disturbi o danni possono imitarla.\n\nMappa ristagno e drenaggio, esamina radici in sicurezza e rivaluta dopo il deflusso; testa K se il segno persiste.\n\nVerifica se un drenaggio superficiale provvisorio è sicuro e consentito; opere permanenti richiedono studio del sito.\n\nSospendi l’irrigazione aggiunta durante la saturazione e valuta il drenaggio; non dire che ogni argilla non va mai irrigata.\n\nScegli un K come solfato di potassio solo con necessità confermata; K fogliare non è una cura obbligata.\n\nAnalisi, coltura e guida locale dopo il miglioramento; nessuna dose bassa fissa.\n\nEvita concime in acqua stagnante; valuta prima ripresa delle radici e coltura.\n\nPer necessità verificata scegli suolo o foglia secondo etichetta, assorbimento, ruscellamento e sicurezza.\n\nIl caso cita sostanza organica per la struttura e drenaggio tubolare sottosuperficiale come esempi a lungo termine. Richiedono valutazione e progetto del sito, non rimedio automatico o permesso di scavo.\n\nDrenaggio e ossigeno radicale sono la prima indagine; K è ipotesi secondaria verificabile.', 'Caso due: frumento basso in argilla bagnata\n\nDopo forti piogge, ristagno nel campo argilloso; frumento stentato e margini di alcune foglie vecchie ingialliti.\n\nIl ristagno può privare le radici di ossigeno e ridurre il loro assorbimento di acqua o nutrienti.\n\nLa carenza di cappa è possibile per i margini, ma stress radicale, altri disturbi o danni possono imitarla.\n\nMappa ristagno e drenaggio, esamina radici in sicurezza e rivaluta dopo il deflusso; testa cappa se il segno persiste.\n\nVerifica se un drenaggio superficiale provvisorio è sicuro e consentito; opere permanenti richiedono studio del sito.\n\nSospendi l’irrigazione aggiunta durante la saturazione e valuta il drenaggio; non dire che ogni argilla non va mai irrigata.\n\nScegli un cappa come solfato di potassio solo con necessità confermata; cappa fogliare non è una cura obbligata.\n\nAnalisi, coltura e guida locale dopo il miglioramento; nessuna dose bassa fissa.\n\nEvita concime in acqua stagnante; valuta prima ripresa delle radici e coltura.\n\nPer necessità verificata scegli suolo o foglia secondo etichetta, assorbimento, ruscellamento e sicurezza.\n\nIl caso cita sostanza organica per la struttura e drenaggio tubolare sottosuperficiale come esempi a lungo termine. Richiedono valutazione e progetto del sito, non rimedio automatico o permesso di scavo.\n\nDrenaggio e ossigeno radicale sono la prima indagine; cappa è ipotesi secondaria verificabile.'), ("Caso 3: verdura a foglia su franco\n\nSi pianifica una coltura a foglia su franco con poca acqua; la scheda riguarda la pianificazione, non sintomi di carenza già osservati.\n\nIl goccia può distribuire acqua vicino alle file se kit e manutenzione sono fattibili.\n\nLa domanda di N può essere rilevante, ma nessuna carenza o dose è dimostrata.\n\nIdentifica coltura e fase, evapotraspirazione locale e pioggia efficace, riserva idrica nella zona radicale, idoneità del sistema, qualità dell'acqua e un'analisi valida dei nutrienti.\n\nConfronta costo/manutenzione e analisi del prodotto.\n\nValuta un impianto a goccia progettato e controllato; nessun ciclo irriguo settimanale o due volte alla settimana valido per tutti.\n\nUna formula NPK completa solo se il piano richiede N, P e K. Il nitrato di calcio dà N e Ca, non è NPK bilanciato.\n\nDeriva da coltura, analisi e guida locale, non solo da «poco e spesso».\n\nAdegua alle fasi e domanda misurata; fertirrigare ogni settimana o due non è universale.\n\nSe prodotto solubile approvato e impianto lo consentono, distribuisci alle radici con goccia verificato; altrimenti usa alternativa idonea.\n\nPianificazione preventiva: non inventare carenza diagnosticata né calendario fisso.", "Caso tre: verdura a foglia su franco\n\nSi pianifica una coltura a foglia su franco con poca acqua; la scheda riguarda la pianificazione, non sintomi di carenza già osservati.\n\nIl goccia può distribuire acqua vicino alle file se kit e manutenzione sono fattibili.\n\nLa domanda di enne può essere rilevante, ma nessuna carenza o dose è dimostrata.\n\nIdentifica coltura e fase, evapotraspirazione locale e pioggia efficace, riserva idrica nella zona radicale, idoneità del sistema, qualità dell'acqua e un'analisi valida dei nutrienti.\n\nConfronta costo, manutenzione e analisi del prodotto.\n\nValuta un impianto a goccia progettato e controllato; nessun ciclo irriguo settimanale o due volte alla settimana valido per tutti.\n\nUna formula enne pi cappa completa solo se il piano richiede enne, pi e cappa. Il nitrato di calcio dà enne e ci a, non è enne pi cappa bilanciato.\n\nDeriva da coltura, analisi e guida locale, non solo da «poco e spesso».\n\nAdegua alle fasi e domanda misurata; fertirrigare ogni settimana o due non è universale.\n\nSe prodotto solubile approvato e impianto lo consentono, distribuisci alle radici con goccia verificato; altrimenti usa alternativa idonea.\n\nPianificazione preventiva: non inventare carenza diagnosticata né calendario fisso."), ('Caso 4: mais giovane viola su argilla fredda\n\nMais giovane viola e lento in una primavera fredda su terreno argilloso pesante.\n\nFreddo/ristagno o poche radici possono frenare P anche se l’analisi del suolo è adeguata.\n\nVera carenza di P o altra causa resta possibile.\n\nControlla temperatura, drenaggio, radici, analisi P pertinente e miglioramento con il riscaldamento.\n\nNon aggiungere acqua automaticamente a un’argilla fredda e bagnata; controlla umidità e drenaggio.\n\nDAP o fosfato monoammonico (MAP) sono esempi possibili di fonte P solo con bisogno agronomico e compatibilità del prodotto confermati.\n\nDose da analisi e guida locale, non da «modesta» indefinita.\n\nIntervieni quando serve e il campo consente sicurezza, non subito senza indagine.\n\nBanda vicino alle giovani radici possibile con separazione dal seme prevista dall’etichetta, non superiore sempre alle alternative. Questo esempio didattico illustra alla semina una banda starter a 2 pollici di lato e 2 pollici sotto la fila dei semi. È un esempio di posizionamento, non un’impostazione universale né un invito a scavare accanto a piantine già insediate. Il posizionamento reale segue prodotto, coltura, attrezzatura e indicazioni locali per la sicurezza del seme.\n\nVerifica ipotesi P e condizioni prima di proporre le quattro decisioni.', 'Caso quattro: mais giovane viola su argilla fredda\n\nMais giovane viola e lento in una primavera fredda su terreno argilloso pesante.\n\nFreddo, ristagno o poche radici possono frenare pi anche se l’analisi del suolo è adeguata.\n\nVera carenza di pi o altra causa resta possibile.\n\nControlla temperatura, drenaggio, radici, analisi pi pertinente e miglioramento con il riscaldamento.\n\nNon aggiungere acqua automaticamente a un’argilla fredda e bagnata; controlla umidità e drenaggio.\n\ndi a pi o fosfato monoammonico (emme a pi) sono esempi possibili di fonte pi solo con bisogno agronomico e compatibilità del prodotto confermati.\n\nDose da analisi e guida locale, non da «modesta» indefinita.\n\nIntervieni quando serve e il campo consente sicurezza, non subito senza indagine.\n\nBanda vicino alle giovani radici possibile con separazione dal seme prevista dall’etichetta, non superiore sempre alle alternative. Questo esempio didattico illustra alla semina una banda starter a due pollici di lato e due pollici sotto la fila dei semi. È un esempio di posizionamento, non un’impostazione universale né un invito a scavare accanto a piantine già insediate. Il posizionamento reale segue prodotto, coltura, attrezzatura e indicazioni locali per la sicurezza del seme.\n\nVerifica ipotesi pi e condizioni prima di proporre le quattro decisioni.')], 'de': [('Fall 1: Tomaten auf Sand\n\nHeißer windiger Sandstandort mit Oberflächen-/Überstau-Bewässerung: Tomaten morgens gesund, nachmittags welk, alte Blätter blass oder gelb.\n\nHoher Tagesbedarf kann die kurzfristige Wurzelaufnahme übersteigen; geringe Speicherung oder ungeregeltes Überstauen kann beitragen.\n\nGelb an alten Blättern spricht für mögliches mobiles N/K-Defizit, Auswaschung, Wurzelproblem oder anderes.\n\nFeuchte im Wurzelraum morgens und nachmittags, Wurzeln, Abfluss, letzte Bewässerung, Wetter und Tropf-Eignung prüfen.\n\nBoden-/Gewebeanalysen und Kulturphase vor der Düngerwahl erheben.\n\nFür diesen Ort gefilterte wartbare Tropfbewässerung statt ungeregelter Überstauung erwägen und Leistung messen; aus dem Aussehen kein tägliches Gießen festlegen. Wasser nahe den Wurzeln vermeidet Sprühverwehung, kann Bodenverdunstung und die Benetzung von Unkraut zwischen den Reihen mindern und das Laub trockener halten, wodurch manche Krankheitsrisiken sinken können. Kleine überwachte Gaben können zum geringen Sandspeicher passen; Überschüsse können dennoch unter die Wurzeln gelangen. Die Vorteile hängen von Auslegung, Betrieb und Bedingungen ab.\n\nTomatengeeignete Quelle erst nach Belegen; löslicher Mehrnährstoffdünger ist eine mögliche Produktart, keine Diagnose.\n\nTests, Kulturbedarf, Vorrat und lokale Beratung nutzen; Blattfarbe liefert keine Menge.\n\nBestätigten Bedarf und Verlustrisiko berücksichtigen; Fertigation bei jedem oder jedem zweiten Gießen ist kein Automatismus.\n\nFalls Fertigation begründet ist, wurzelnah nach Produktfreigabe ausbringen und Auswaschung/Verteilung überwachen.\n\nDas Lehrmodell beschreibt eine Düngerklasse für fruchtende Tomaten. Tatsächliche Phase zuerst bestätigen; die Bankfrage allein liefert keine Produktanalyse.\n\nHitze/Wasser und Nährstoffe als getrennte Hypothesen prüfen und bedingten Wasser- und 4R-Plan wählen.', 'Fall eins: Tomaten auf Sand\n\nHeißer windiger Sandstandort mit Oberflächen-, Überstau-Bewässerung: Tomaten morgens gesund, nachmittags welk, alte Blätter blass oder gelb.\n\nHoher Tagesbedarf kann die kurzfristige Wurzelaufnahme übersteigen; geringe Speicherung oder ungeregeltes Überstauen kann beitragen.\n\nGelb an alten Blättern spricht für mögliches mobiles En, Ka-Defizit, Auswaschung, Wurzelproblem oder anderes.\n\nFeuchte im Wurzelraum morgens und nachmittags, Wurzeln, Abfluss, letzte Bewässerung, Wetter und Tropf-Eignung prüfen.\n\nBoden-, Gewebeanalysen und Kulturphase vor der Düngerwahl erheben.\n\nFür diesen Ort gefilterte wartbare Tropfbewässerung statt ungeregelter Überstauung erwägen und Leistung messen; aus dem Aussehen kein tägliches Gießen festlegen. Wasser nahe den Wurzeln vermeidet Sprühverwehung, kann Bodenverdunstung und die Benetzung von Unkraut zwischen den Reihen mindern und das Laub trockener halten, wodurch manche Krankheitsrisiken sinken können. Kleine überwachte Gaben können zum geringen Sandspeicher passen; Überschüsse können dennoch unter die Wurzeln gelangen. Die Vorteile hängen von Auslegung, Betrieb und Bedingungen ab.\n\nTomatengeeignete Quelle erst nach Belegen; löslicher Mehrnährstoffdünger ist eine mögliche Produktart, keine Diagnose.\n\nTests, Kulturbedarf, Vorrat und lokale Beratung nutzen; Blattfarbe liefert keine Menge.\n\nBestätigten Bedarf und Verlustrisiko berücksichtigen; Fertigation bei jedem oder jedem zweiten Gießen ist kein Automatismus.\n\nFalls Fertigation begründet ist, wurzelnah nach Produktfreigabe ausbringen und Auswaschung, Verteilung überwachen.\n\nDas Lehrmodell beschreibt eine Düngerklasse für fruchtende Tomaten. Tatsächliche Phase zuerst bestätigen; die Bankfrage allein liefert keine Produktanalyse.\n\nHitze, Wasser und Nährstoffe als getrennte Hypothesen prüfen und bedingten Wasser- und vier R Prinzipien-Plan wählen.'), ('Fall 2: kümmernder Weizen auf nassem Ton\n\nNach starkem Regen steht Wasser auf Ton; Weizen ist klein, einige ältere Blattränder vergilben.\n\nStaunässe begrenzt Sauerstoff an Wurzeln und damit Wasser- und Nährstoffaufnahme.\n\nK-Mangel bleibt wegen der Ränder möglich, doch Wurzelstress, andere Störungen oder Schäden können ähnlich aussehen.\n\nStehendes Wasser und Abfluss kartieren, Wurzeln sicher prüfen und nach Entwässerung erneut sehen; K-Test bei anhaltenden Zeichen.\n\nMögliche vorläufige Oberflächenentwässerung nur sicher und erlaubt; dauerhafte Anlage erst nach Standortprüfung.\n\nBei Sättigung keine weitere Bewässerung; Abfluss prüfen. Das heißt nicht, Tonboden dürfe nie bewässert werden.\n\nK-Quelle wie Kaliumsulfat nur bei belegtem Bedarf; Blatt-K ist keine zwingende Schnelllösung.\n\nGeeignete Analyse, Kultur und lokale Vorgabe nach Besserung; keine feste „niedrige“ Menge.\n\nKein Dünger in stehendem Wasser; zuerst Wurzeln und Erholung beurteilen.\n\nFür bestätigten Bedarf Boden- oder etikettgerechte Blattgabe nach Aufnahme, Abschwemmung und Pflanzensicherheit wählen.\n\nDer Lehrfall nennt organische Substanz für die Struktur und unterirdische Dränrohre als langfristige Beispiele. Standortprüfung und Planung bleiben erforderlich, keine automatische Heilung oder Grabungserlaubnis.\n\nEntwässerung und Wurzelsauerstoff zuerst untersuchen; K ist eine prüfbare Zweithypothese.', 'Fall zwei: kümmernder Weizen auf nassem Ton\n\nNach starkem Regen steht Wasser auf Ton; Weizen ist klein, einige ältere Blattränder vergilben.\n\nStaunässe begrenzt Sauerstoff an Wurzeln und damit Wasser- und Nährstoffaufnahme.\n\nKa-Mangel bleibt wegen der Ränder möglich, doch Wurzelstress, andere Störungen oder Schäden können ähnlich aussehen.\n\nStehendes Wasser und Abfluss kartieren, Wurzeln sicher prüfen und nach Entwässerung erneut sehen; Ka-Test bei anhaltenden Zeichen.\n\nMögliche vorläufige Oberflächenentwässerung nur sicher und erlaubt; dauerhafte Anlage erst nach Standortprüfung.\n\nBei Sättigung keine weitere Bewässerung; Abfluss prüfen. Das heißt nicht, Tonboden dürfe nie bewässert werden.\n\nKa-Quelle wie Kaliumsulfat nur bei belegtem Bedarf; Blatt-Ka ist keine zwingende Schnelllösung.\n\nGeeignete Analyse, Kultur und lokale Vorgabe nach Besserung; keine feste „niedrige“ Menge.\n\nKein Dünger in stehendem Wasser; zuerst Wurzeln und Erholung beurteilen.\n\nFür bestätigten Bedarf Boden- oder etikettgerechte Blattgabe nach Aufnahme, Abschwemmung und Pflanzensicherheit wählen.\n\nDer Lehrfall nennt organische Substanz für die Struktur und unterirdische Dränrohre als langfristige Beispiele. Standortprüfung und Planung bleiben erforderlich, keine automatische Heilung oder Grabungserlaubnis.\n\nEntwässerung und Wurzelsauerstoff zuerst untersuchen; Ka ist eine prüfbare Zweithypothese.'), ('Fall 3: Blattgemüse-Planung auf Lehm\n\nEine Blattkultur wird auf Lehm mit begrenztem Wasser geplant; die Karte schildert Planung, keine bestehenden Mangelzeichen.\n\nTropfbewässerung kann wenig Wasser in Reihen verteilen, wenn Technik und Wartung passen.\n\nN-Bedarf kann hoch sein, doch weder Mangel noch Menge sind festgestellt.\n\nKultur/Phase, lokale ET, wirksamen Regen, Wurzelspeicher, System/Wasserqualität und gültigen Nährstofftest ermitteln.\n\nKosten/Wartung und Produktanalyse vergleichen.\n\nEine geplante und überwachte Tropfanlage erwägen; keinen pauschalen wöchentlichen oder zweimal wöchentlichen Bewässerungszyklus festlegen.\n\nVollständiges NPK nur, wenn der Plan N, P und K fordert. Calciumnitrat enthält N und Ca, ist kein ausgewogenes NPK.\n\nAus Kultur, Analyse und lokaler Vorgabe statt bloß „wenig und oft“ ableiten.\n\nNach Wachstum und gemessenem Bedarf; wöchentliche/zweiwöchentliche Fertigation nicht allgemein.\n\nBei freigegebenem löslichem Produkt und passender Anlage über geprüfte Tropfer zur Wurzelzone; sonst geeignete Alternative.\n\nVorausschauende Planung, ohne Mangel oder festen Wasser-/Düngeplan zu erfinden.', 'Fall drei: Blattgemüse-Planung auf Lehm\n\nEine Blattkultur wird auf Lehm mit begrenztem Wasser geplant; die Karte schildert Planung, keine bestehenden Mangelzeichen.\n\nTropfbewässerung kann wenig Wasser in Reihen verteilen, wenn Technik und Wartung passen.\n\nEn-Bedarf kann hoch sein, doch weder Mangel noch Menge sind festgestellt.\n\nKultur, Phase, lokale Evapotranspiration, wirksamen Regen, Wurzelspeicher, System, Wasserqualität und gültigen Nährstofftest ermitteln.\n\nKosten, Wartung und Produktanalyse vergleichen.\n\nEine geplante und überwachte Tropfanlage erwägen; keinen pauschalen wöchentlichen oder zweimal wöchentlichen Bewässerungszyklus festlegen.\n\nVollständiges En Pe Ka nur, wenn der Plan En, Pe und Ka fordert. Calciumnitrat enthält En und Ce A, ist kein ausgewogenes En Pe Ka.\n\nAus Kultur, Analyse und lokaler Vorgabe statt bloß „wenig und oft“ ableiten.\n\nNach Wachstum und gemessenem Bedarf; wöchentliche, zweiwöchentliche Fertigation nicht allgemein.\n\nBei freigegebenem löslichem Produkt und passender Anlage über geprüfte Tropfer zur Wurzelzone; sonst geeignete Alternative.\n\nVorausschauende Planung, ohne Mangel oder festen Wasser-, Düngeplan zu erfinden.'), ('Fall 4: purpurner Jungmais auf kaltem Ton\n\nJungmais mit Purpurblättern und langsamem Wachstum im kalten Frühjahr auf schwerem Ton.\n\nKälte, Nässe oder schwache Wurzeln können P-Aufnahme trotz ausreichendem Bodengehalt hemmen.\n\nEchter P-Mangel oder eine andere Ursache bleibt möglich.\n\nTemperatur, Entwässerung, Wurzelwachstum, passenden P-Test und Besserung beim Erwärmen prüfen.\n\nKalten nassen Ton nicht automatisch weiter gießen; Feuchte und Abfluss zuerst prüfen.\n\nDAP oder Monoammoniumphosphat (MAP) sind mögliche Beispiele für P-Quellen, sofern Bedarf und Produkteignung bestätigt sind.\n\nNach Analyse und lokaler Kulturberatung, nicht pauschal „mäßig“.\n\nBei Bedarf und sicheren Feldbedingungen, nicht ungeprüft sofort.\n\nSicheres Band neben jungen Wurzeln nach etikettgerechtem Saatabstand möglich, nicht immer allen Alternativen überlegen. Dieses Lehrbeispiel zeigt ein Starterband bei der Aussaat 2 Zoll seitlich und 2 Zoll unterhalb der Saatreihe. Das ist ein Platzierungsbeispiel, keine allgemeine Einstellung und keine Anweisung, neben bereits etablierten Jungpflanzen zu graben. Die tatsächliche Platzierung richtet sich nach Produkt, Kultur, Gerät und örtlichen Vorgaben zum Schutz des Saatguts.\n\nP-Hypothese und Bodenverhältnisse vor der vierteiligen Empfehlung prüfen.', 'Fall vier: purpurner Jungmais auf kaltem Ton\n\nJungmais mit Purpurblättern und langsamem Wachstum im kalten Frühjahr auf schwerem Ton.\n\nKälte, Nässe oder schwache Wurzeln können Pe-Aufnahme trotz ausreichendem Bodengehalt hemmen.\n\nEchter Pe-Mangel oder eine andere Ursache bleibt möglich.\n\nTemperatur, Entwässerung, Wurzelwachstum, passenden Pe-Test und Besserung beim Erwärmen prüfen.\n\nKalten nassen Ton nicht automatisch weiter gießen; Feuchte und Abfluss zuerst prüfen.\n\nDe A Pe oder Monoammoniumphosphat (Em A Pe) sind mögliche Beispiele für Pe-Quellen, sofern Bedarf und Produkteignung bestätigt sind.\n\nNach Analyse und lokaler Kulturberatung, nicht pauschal „mäßig“.\n\nBei Bedarf und sicheren Feldbedingungen, nicht ungeprüft sofort.\n\nSicheres Band neben jungen Wurzeln nach etikettgerechtem Saatabstand möglich, nicht immer allen Alternativen überlegen. Dieses Lehrbeispiel zeigt ein Starterband bei der Aussaat zwei Zoll seitlich und zwei Zoll unterhalb der Saatreihe. Das ist ein Platzierungsbeispiel, keine allgemeine Einstellung und keine Anweisung, neben bereits etablierten Jungpflanzen zu graben. Die tatsächliche Platzierung richtet sich nach Produkt, Kultur, Gerät und örtlichen Vorgaben zum Schutz des Saatguts.\n\nPe-Hypothese und Bodenverhältnisse vor der vierteiligen Empfehlung prüfen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s307-gated-audio-20261023-r1'
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
            print('Frozen16 S307 protected full cases verified; zero provider calls.')
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
