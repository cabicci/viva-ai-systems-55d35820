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
IDS = ('S2-07-ar-EG-documented-method-r1', 'S2-07-ar-EG-supervised-stages-r1', 'S2-07-ar-EG-practical-completion-r1', 'S2-07-ar-EG-card-scope-r1', 'S2-07-ar-EG-record-and-method-guidance-r1', 'S2-07-en-documented-method-r1', 'S2-07-en-supervised-stages-r1', 'S2-07-en-practical-completion-r1', 'S2-07-en-card-scope-r1', 'S2-07-en-record-and-method-guidance-r1', 'S2-07-it-documented-method-r1', 'S2-07-it-supervised-stages-r1', 'S2-07-it-practical-completion-r1', 'S2-07-it-card-scope-r1', 'S2-07-it-record-and-method-guidance-r1', 'S2-07-de-documented-method-r1', 'S2-07-de-supervised-stages-r1', 'S2-07-de-practical-completion-r1', 'S2-07-de-card-scope-r1', 'S2-07-de-record-and-method-guidance-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==20
    assert(req['scope'],req['stepId'])==('S207_LAB_20_SOURCEBOUND_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(20,20,20,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s207-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==20
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(5))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['documented-method','supervised-stages','practical-completion','card-scope','record-and-method-guidance']
        voice='Charon'if group in['supervised-stages','card-scope']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'documented-method': ['/digitalPractice/method/role', '/digitalPractice/method/exampleMeter', '/digitalPractice/method/manufacturerSlurryExample', '/digitalPractice/method/laboratoryComparison', '/digitalPractice/method/siteGate'], 'supervised-stages': ['/digitalPractice/ui/steps/0', '/digitalPractice/ui/steps/1', '/digitalPractice/ui/steps/2', '/digitalPractice/ui/steps/3', '/digitalPractice/ui/steps/4', '/digitalPractice/ui/steps/5', '/digitalPractice/ui/steps/6', '/digitalPractice/ui/steps/7', '/digitalPractice/ui/steps/8', '/digitalPractice/ui/steps/9', '/digitalPractice/ui/steps/10', '/digitalPractice/guidedPhysical'], 'practical-completion': ['/digitalPractice/passChecks/0/evidence', '/digitalPractice/passChecks/0/decision', '/digitalPractice/passChecks/1/evidence', '/digitalPractice/passChecks/1/decision', '/digitalPractice/passChecks/2/evidence', '/digitalPractice/passChecks/2/decision'], 'card-scope': ['/digitalPractice/card/scope', '/digitalPractice/card/observationRows/0/action', '/digitalPractice/card/observationRows/1/action', '/digitalPractice/card/observationRows/2/action', '/digitalPractice/card/observationRows/3/action', '/digitalPractice/card/observationRows/4/action', '/digitalPractice/card/observationRows/5/action', '/digitalPractice/card/observationRows/6/action', '/digitalPractice/card/observationRows/7/action', '/digitalPractice/card/observationRows/8/action', '/digitalPractice/card/additionalSafetyAndQuality/0', '/digitalPractice/card/additionalSafetyAndQuality/1', '/digitalPractice/card/additionalSafetyAndQuality/2'], 'record-and-method-guidance': ['/digitalPractice/ui/modelHelp', '/digitalPractice/ui/recordHelp', '/digitalPractice/ui/fields/0', '/digitalPractice/ui/fields/1', '/digitalPractice/ui/fields/2', '/digitalPractice/ui/fields/3', '/digitalPractice/ui/fields/4', '/digitalPractice/ui/fields/5', '/digitalPractice/ui/fields/6', '/digitalPractice/ui/fields/7', '/digitalPractice/ui/fields/8', '/digitalPractice/ui/saved', '/studentDownloads/0/title']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or b['pointer'].endswith('/modelHelpAfter')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('1:1', 'واحد لواحد'), ('1:2', 'واحد لاتنين'), ('HI12923', 'إتش آي واحد اتنين تسعة اتنين تلاتة'), ('HI7051', 'إتش آي سبعة صفر خمسة واحد'), ('HI99121', 'إتش آي تسعة تسعة واحد اتنين واحد'), ('Hanna', 'هانا'), ('UC Davis', 'يو سي ديفيس'), ('g:mL', 'جرام لكل مليلتر'), ('الفحوص التسعة في البطاقة دي هي وقاية مناسبة، وتفكيك الكتل برفق من غير طحن الحجارة، ومنخل 2 mm، و20 g تربة، و20 mL ماء مقطر، وتقليب دقيقة وانتظار 15، ومعايرة بمحَاليل حسب الشركة، ووضع المسبار الصحيح، وتسجيل قيمة pH الثابتة. الأرقام دي بتحدد الحالة التعليمية الورقية. قبل التنفيذ العملي، المدرّب بيتحقق من الجهاز وطريقة الموقع الفعليين، وبيطابق الأفعال اللي هيلاحظها مع الطريقة دي من غير خلط إجراءات.\n\nوقاية مختارة للمهمة الحقيقية في الموقع\n\nتفكيك الكتل برفق من غير طحن الحجارة\n\nجمع التربة المنخولة عند 2 mm\n\nوزن 20 g في حالة بطاقة الأصل\n\nقياس 20 mL ماء مقطر في حالة بطاقة الأصل\n\nتقليب دقيقة وانتظار 15 دقيقة في حالة بطاقة الأصل\n\nمعايرة بمحاليل يقبلها الجهاز حسب تعليمات الشركة الفعلية\n\nوضع المسبار المناسب بطريقة صحيحة في الوسط المحدد\n\nتسجيل pH النهائي الثابت مع هوية العينة والطريقة\n\nسجّل هوية محاليل المعايرة وقبولها والطريقة خارج فحوص الأصل التسعة.\n\nاشطف بين العينات وسجّل التجارب غير المستقرة أو المرفوضة ونظّف واحفظ المسبار حسب دليله.\n\nالمدرّب يسجل أداء كل طالب وتصحيحه بنفسه؛ درجة المجموعة لا تنجح الفرد تلقائيًا.', 'الفحوص التسعة في البطاقة دي هي وقاية مناسبة، وتفكيك الكتل برفق من غير طحن الحجارة، ومنخل اتنين مليمتر، وعشرين جرام تربة، وعشرين مليلتر ماء مقطر، وتقليب دقيقة وانتظار خمستاشر، ومعايرة بمحَاليل حسب الشركة، ووضع المسبار الصحيح، وتسجيل قيمة بي إتش الثابتة. الأرقام دي بتحدد الحالة التعليمية الورقية. قبل التنفيذ العملي، المدرّب بيتحقق من الجهاز وطريقة الموقع الفعليين، وبيطابق الأفعال اللي هيلاحظها مع الطريقة دي من غير خلط إجراءات.\n\nوقاية مختارة للمهمة الحقيقية في الموقع\n\nتفكيك الكتل برفق من غير طحن الحجارة\n\nجمع التربة المنخولة عند اتنين مليمتر\n\nوزن عشرين جرام في حالة بطاقة الأصل\n\nقياس عشرين مليلتر ماء مقطر في حالة بطاقة الأصل\n\nتقليب دقيقة وانتظار خمستاشر دقيقة في حالة بطاقة الأصل\n\nمعايرة بمحاليل يقبلها الجهاز حسب تعليمات الشركة الفعلية\n\nوضع المسبار المناسب بطريقة صحيحة في الوسط المحدد\n\nتسجيل بي إتش النهائي الثابت مع هوية العينة والطريقة\n\nسجّل هوية محاليل المعايرة وقبولها والطريقة خارج فحوص الأصل التسعة.\n\nاشطف بين العينات وسجّل التجارب غير المستقرة أو المرفوضة ونظّف واحفظ المسبار حسب دليله.\n\nالمدرّب يسجل أداء كل طالب وتصحيحه بنفسه؛ درجة المجموعة لا تنجح الفرد تلقائيًا.'), ('المدرّب يشوف كل طالب وهو يتعامل مع عينة مجهزة ومعلّمة، ويفك الكتل برفق من غير طحن حجارة، وينخل 2 mm عند الحاجة، ويزن بميزان مفحوص ويقيس السائل بمخبار نظيف؛ ويسجل الكتلة والحجم والسائل وأساس النسبة ووقتي التقليب والانتظار الفعليين للطريقة المعلنة.\n\nالاجتياز بعد تنفيذ كل مرحلة لازمة حسب طريقة الموقع المختارة مع استمرار هوية العينة. التدريب على بطاقة الأصل 20 g:20 mL وحده ما ينجّحش طالب على طريقة فعلية مختلفة.\n\nسجّل الجهاز والمسبار ونقاط المعايرة المقبولة ورقم تشغيلة المحاليل وصلاحيتها وإشارة قبول الجهاز أو فحص مستقل، وشطف المسبار والعناية به حسب دليله، ووضعه الصحيح وحالة ثبات القراءة؛ والمدرّب يلاحظ كل طالب.\n\nالاجتياز يحتاج معايرة مقبولة خاصة بالطريقة وتعامل ما يلوثش الأدوات. رسالة رفض محلول معايرة أو مسبار جاف أو تالف أو رقم غير ثابت يوقف التقييم لحد الإصلاح.\n\nثلاثة صفوف منفصلة للعينات فيها pH الحقيقي ودقة الشاشة والطريقة والطالب والوقت وأي إعادة. الطالب يحدد القراءة غير الثابتة أو الخارجة عن فحص الجودة أو المختلفة عن طريقة تجهيز العينة، ويعيد المرحلة المتأثرة فقط بتوجيه المدرّب.\n\nالاجتياز بعد قياس A وB وC فرديًا وتسجيلها مع فحوص جودة يمكن الدفاع عنها. ورقة المجموعة أو مفتاح الإجابة أو ثلاث أرقام مستهدفة مخترعة ما تكفيش.', 'المدرّب يشوف كل طالب وهو يتعامل مع عينة مجهزة ومعلّمة، ويفك الكتل برفق من غير طحن حجارة، وينخل اتنين مليمتر عند الحاجة، ويزن بميزان مفحوص ويقيس السائل بمخبار نظيف؛ ويسجل الكتلة والحجم والسائل وأساس النسبة ووقتي التقليب والانتظار الفعليين للطريقة المعلنة.\n\nالاجتياز بعد تنفيذ كل مرحلة لازمة حسب طريقة الموقع المختارة مع استمرار هوية العينة. التدريب على بطاقة الأصل عشرين جرام:عشرين مليلتر وحده ما ينجّحش طالب على طريقة فعلية مختلفة.\n\nسجّل الجهاز والمسبار ونقاط المعايرة المقبولة ورقم تشغيلة المحاليل وصلاحيتها وإشارة قبول الجهاز أو فحص مستقل، وشطف المسبار والعناية به حسب دليله، ووضعه الصحيح وحالة ثبات القراءة؛ والمدرّب يلاحظ كل طالب.\n\nالاجتياز يحتاج معايرة مقبولة خاصة بالطريقة وتعامل ما يلوثش الأدوات. رسالة رفض محلول معايرة أو مسبار جاف أو تالف أو رقم غير ثابت يوقف التقييم لحد الإصلاح.\n\nثلاثة صفوف منفصلة للعينات فيها بي إتش الحقيقي ودقة الشاشة والطريقة والطالب والوقت وأي إعادة. الطالب يحدد القراءة غير الثابتة أو الخارجة عن فحص الجودة أو المختلفة عن طريقة تجهيز العينة، ويعيد المرحلة المتأثرة فقط بتوجيه المدرّب.\n\nالاجتياز بعد قياس إيه وB وC فرديًا وتسجيلها مع فحوص جودة يمكن الدفاع عنها. ورقة المجموعة أو مفتاح الإجابة أو ثلاث أرقام مستهدفة مخترعة ما تكفيش.'), ('تعاملًا لا يلوث', 'تعامل ما يلوثش'), ('خمسة دقائق', 'خمس دقايق'), ('ده نموذج عام للخطوات، مش نسخة دقيقة من إتش آي تسعة تسعة واحد اتنين واحد. الشاشة الفاضية مش قياس تربة. تغيير المرحلة مش معناه إنك جهّزت أو عايرت أو استنيت الوقت الحقيقي.\n\nاستخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nهوية العينة والحقل\n\nالتاريخ / الطالب اللي قاس\n\nالجهاز والمسبار والدليل\n\nكتلة التربة ونوع وحجم السائل وأساس جرام لكل مليلتر\n\nوقت الخلط والانتظار الفعلي\n\nمجموعة المحاليل وقيمها والتشغيلة والصلاحية وقبول المعايرة أو فحصها\n\npH اللي اتقاس فعلًا بالدقة اللي الجهاز يدعمها\n\nثبات القراءة / عدم التأكد / سبب الإعادة\n\nالفحص التالي حسب المحصول، من غير جرعة متخمنة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nورقة تدريب القياس الرقمي لبي إتش', 'ده نموذج عام للخطوات، مش نسخة دقيقة من إتش آي تسعة تسعة واحد اتنين واحد. الشاشة الفاضية مش قياس تربة. تغيير المرحلة مش معناه إنك جهّزت أو عايرت أو استنيت الوقت الحقيقي.\n\nاستخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nهوية العينة والحقل\n\nالتاريخ / الطالب اللي قاس\n\nالجهاز والمسبار والدليل\n\nكتلة التربة ونوع وحجم السائل وأساس جرام لكل مليلتر\n\nوقت الخلط والانتظار الفعلي\n\nمجموعة المحاليل وقيمها والتشغيلة والصلاحية وقبول المعايرة أو فحصها\n\nبي إتش اللي اتقاس فعلًا بالدقة اللي الجهاز يدعمها\n\nثبات القراءة / عدم التأكد / سبب الإعادة\n\nالفحص التالي حسب المحصول، من غير جرعة متخمنة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nورقة تدريب القياس الرقمي لبي إتش'), ('راجع هوية العينة والوقاية والمسبار والطريقة كاملة\n\nفك الكتل برفق واستخدم منخل 2 mm المطلوب\n\nاوزن 20 g من التربة المجهزة للبطاقة دي\n\nقيس 20 mL ماء مقطر للبطاقة دي\n\nقلّب لمدة دقيقة\n\nسيبها 15 دقيقة وسجّل الوقت الفعلي\n\nاتأكد إن معايرة المحاليل المطلوبة اتقبلت\n\nحط المسبار المناسب من غير احتكاك بالرمل أو الزجاج\n\nاستنى علامة الثبات المعتمدة\n\nسجّل القيمة الفعلية والهوية وفحوص الجودة\n\nاشطف بين العينات ونضّف واحفظ المسبار حسب دليله\n\nالمدرّب يسجل الجهاز والمسبار والدليل الحقيقي وطريقة الموقع المعتمدة. كل طالب يجهز العينة المطلوبة بنفسه ويعاير ويفحص ويقيس A/B/C ويسجل الجودة والنتيجة ويشطف ويحفظ المسبار تحت الملاحظة. لو طريقة الموقع مختلفة عن بطاقة الأصل، تبقى البطاقة مقارنة وتتعدل ورقة المهمة قبل التقييم.', 'راجع هوية العينة والوقاية والمسبار والطريقة كاملة\n\nفك الكتل برفق واستخدم منخل اتنين مليمتر المطلوب\n\nاوزن عشرين جرام من التربة المجهزة للبطاقة دي\n\nقيس عشرين مليلتر ماء مقطر للبطاقة دي\n\nقلّب لمدة دقيقة\n\nسيبها خمستاشر دقيقة وسجّل الوقت الفعلي\n\nاتأكد إن معايرة المحاليل المطلوبة اتقبلت\n\nحط المسبار المناسب من غير احتكاك بالرمل أو الزجاج\n\nاستنى علامة الثبات المعتمدة\n\nسجّل القيمة الفعلية والهوية وفحوص الجودة\n\nاشطف بين العينات ونضّف واحفظ المسبار حسب دليله\n\nالمدرّب يسجل الجهاز والمسبار والدليل الحقيقي وطريقة الموقع المعتمدة. كل طالب يجهز العينة المطلوبة بنفسه ويعاير ويفحص ويقيس إيه/بي/سي ويسجل الجودة والنتيجة ويشطف ويحفظ المسبار تحت الملاحظة. لو طريقة الموقع مختلفة عن بطاقة الأصل، تبقى البطاقة مقارنة وتتعدل ورقة المهمة قبل التقييم.'), ('طالبًا على', 'طالب على'), ('عشرة جرام', 'عشر جرام'), ('عمليًا', 'عملي'), ('فحصًا مستقلًا', 'فحص مستقل'), ('لـpH', 'لبي إتش'), ('مثال مقارنة موثّق، مش الجهاز المثبت في موقع التدريب\n\nHanna إتش آي تسعة تسعة واحد اتنين واحد مع قطب التربة إتش آي واحد اتنين تسعة اتنين تلاتة\n\nدليل Hanna إتش آي تسعة تسعة واحد اتنين واحد يصف عينة تربة جافة منخولة 2 mm وزنها 10 g مع 25 mL من محلول تجهيز التربة إتش آي سبعة صفر خمسة واحد، وخلط 30 ثانية وانتظار 5 دقائق قبل وضع المسبار. فيه طريقة أخرى منفصلة للقياس المباشر بمسباره المناسب. ولا واحدة منهم هي بطاقة الأصل: 20 g تربة مع 20 mL ماء مقطر.\n\nمعمل يو سي ديفيس يوثق طرق pH منفصلة بنسبة تربة إلى ماء منزوع الأيونات واحد لواحد أو واحد لاتنين؛ لازم تذكر الطريقة وأساس النسبة مع النتيجة. ده مش وصفة لوقت انتظار بطاقة الأصل أو لمحلول جهاز Hanna.\n\nالمدرّب يسجل الجهاز والمسبار الحقيقيين وإصدار الدليل وطريقة تحضير العينة والسائل ونسبة الكتلة إلى الحجم وأساسها ومجموعة محاليل المعايرة وقواعد قبول المعايرة وفحص الجودة والعناية بالمسبار ونشرة المادة إن وجدت ومسار المخلفات قبل تقييم أي طالب عملي. عند نقصها، نكتفي بالتدريب الإلكتروني والمهارة العملية غير مُقيّمة.', 'مثال مقارنة موثّق، مش الجهاز المثبت في موقع التدريب\n\nHanna إتش آي تسعة تسعة واحد اتنين واحد مع قطب التربة إتش آي واحد اتنين تسعة اتنين تلاتة\n\nدليل Hanna إتش آي تسعة تسعة واحد اتنين واحد يصف عينة تربة جافة منخولة اتنين مليمتر وزنها عشرة جرام مع خمسة وعشرين مليلتر من محلول تجهيز التربة إتش آي سبعة صفر خمسة واحد، وخلط تلاتين ثانية وانتظار خمسة دقائق قبل وضع المسبار. فيه طريقة أخرى منفصلة للقياس المباشر بمسباره المناسب. ولا واحدة منهم هي بطاقة الأصل: عشرين جرام تربة مع عشرين مليلتر ماء مقطر.\n\nمعمل يو سي ديفيس يوثق طرق بي إتش منفصلة بنسبة تربة إلى ماء منزوع الأيونات واحد لواحد أو واحد لاتنين؛ لازم تذكر الطريقة وأساس النسبة مع النتيجة. ده مش وصفة لوقت انتظار بطاقة الأصل أو لمحلول جهاز Hanna.\n\nالمدرّب يسجل الجهاز والمسبار الحقيقيين وإصدار الدليل وطريقة تحضير العينة والسائل ونسبة الكتلة إلى الحجم وأساسها ومجموعة محاليل المعايرة وقواعد قبول المعايرة وفحص الجودة والعناية بالمسبار ونشرة المادة إن وجدت ومسار المخلفات قبل تقييم أي طالب عملي. عند نقصها، نكتفي بالتدريب الإلكتروني والمهارة العملية غير مُقيّمة.'), ('وB', 'وبي'), ('وC', 'وسي')], 'en': [('1:1', 'one to one'), ('1:2', 'one to two'), ('A generic procedural model, not an exact H I nine nine one two one replica. The blank screen is not a soil measurement. Phase changes do not complete a real preparation, calibration or wait.\n\nUse only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field identity\n\nDate / tester\n\nMeter, probe and manual\n\nSoil mass, liquid identity/volume and grams per millilitre basis\n\nActual mixing and standing times\n\nBuffer set, points, lot/expiry and acceptance / check\n\nActual observed pH at supported resolution\n\nStability / uncertainty / repeat reason\n\nCrop-specific next check; no guessed amendment dose\n\nRow saved locally. No practical result or trainer signature has been created.\n\nDigital pH practice worksheet', 'A generic procedural model, not an exact H I nine nine one two one replica. The blank screen is not a soil measurement. Phase changes do not complete a real preparation, calibration or wait.\n\nUse only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nSample and field identity\n\nDate / tester\n\nMeter, probe and manual\n\nSoil mass, liquid identity/volume and grams per millilitre basis\n\nActual mixing and standing times\n\nBuffer set, points, lot/expiry and acceptance / check\n\nActual observed P H at supported resolution\n\nStability / uncertainty / repeat reason\n\nCrop-specific next check; no guessed amendment dose\n\nRow saved locally. No practical result or trainer signature has been created.\n\nDigital P H practice worksheet'), ('Check sample ID, PPE, actual probe and complete method\n\nGently break clods; use the specified 2 mm sieve\n\nWeigh 20 g prepared soil for this card\n\nMeasure 20 mL distilled water for this card\n\nStir for 1 minute\n\nStand for 15 minutes; record real elapsed time\n\nAccept the required buffer calibration\n\nPlace the suitable electrode without contact with grit or glass\n\nWait for an accepted stable display\n\nRecord actual value, identity and quality checks\n\nRinse between samples; clean and store by the probe manual\n\nTrainer records the real meter/probe/manual and approved site method. Each learner personally prepares the required sample, calibrates and checks the meter, measures A/B/C, records quality and result, rinses and stores the probe, and is observed against every applicable criterion. If the site method differs from the source card, keep the source card as a comparison and update the task sheet before scoring.', 'Check sample I D, P P E, actual probe and complete method\n\nGently break clods; use the specified two millimetres sieve\n\nWeigh twenty grams prepared soil for this card\n\nMeasure twenty millilitres distilled water for this card\n\nStir for one minute\n\nStand for fifteen minutes; record real elapsed time\n\nAccept the required buffer calibration\n\nPlace the suitable electrode without contact with grit or glass\n\nWait for an accepted stable display\n\nRecord actual value, identity and quality checks\n\nRinse between samples; clean and store by the probe manual\n\nTrainer records the real meter/probe/manual and approved site method. Each learner personally prepares the required sample, calibrates and checks the meter, measures A/B/C, records quality and result, rinses and stores the probe, and is observed against every applicable criterion. If the site method differs from the source card, keep the source card as a comparison and update the task sheet before scoring.'), ('Collect soil passed through a two-millimetre sieve soil', 'Collect soil passed through a two-millimetre sieve'), ('HI12923', 'H I one two nine two three'), ('HI7051', 'H I seven zero five one'), ('HI99121', 'H I nine nine one two one'), ("The nine checks on this card are correct PPE, gentle clod crushing, 2 mm sieving, 20 g soil, 20 mL distilled water, one-minute stirring and 15-minute settling, manufacturer-directed buffer calibration, correct electrode placement, and recording a stable pH value. These quantities define the paper teaching scenario. Before physical use, the trainer verifies the actual meter and site method and matches the observable actions to that method without mixing procedures.\n\nPPE selected for the actual site task\n\nCrush aggregates gently without grinding stones\n\nCollect 2 mm-sieved soil\n\nWeigh 20 g in the source scenario\n\nMeasure 20 mL distilled water in the source scenario\n\nStir 1 minute and stand 15 minutes in the source scenario\n\nCalibrate with accepted buffers per the actual manufacturer instructions\n\nPlace the correct probe correctly in the declared medium\n\nRecord final stable measured pH with sample and method identity\n\nRecord buffer identity, calibration acceptance and method separately from the original nine source rows.\n\nRinse between samples, record unstable or rejected runs and clean/store the electrode by its manual.\n\nTrainer records each learner's own observed evidence and any correction; no automatic pass from a group mark.", "The nine checks on this card are correct P P E, gentle clod crushing, two millimetres sieving, twenty grams soil, twenty millilitres distilled water, one-minute stirring and fifteen-minute settling, manufacturer-directed buffer calibration, correct electrode placement, and recording a stable P H value. These quantities define the paper teaching scenario. Before physical use, the trainer verifies the actual meter and site method and matches the observable actions to that method without mixing procedures.\n\nP P E selected for the actual site task\n\nCrush aggregates gently without grinding stones\n\nCollect two millimetres-sieved soil\n\nWeigh twenty grams in the source scenario\n\nMeasure twenty millilitres distilled water in the source scenario\n\nStir one minute and stand fifteen minutes in the source scenario\n\nCalibrate with accepted buffers per the actual manufacturer instructions\n\nPlace the correct probe correctly in the declared medium\n\nRecord final stable measured P H with sample and method identity\n\nRecord buffer identity, calibration acceptance and method separately from the original nine source rows.\n\nRinse between samples, record unstable or rejected runs and clean/store the electrode by its manual.\n\nTrainer records each learner's own observed evidence and any correction; no automatic pass from a group mark."), ("Trainer sees each learner handle the labelled prepared soil, gently break clods without milling stones, sieve through 2 mm where required, weigh with a checked balance and measure the specified liquid in a clean graduated vessel; log actual mass, volume, liquid, ratio basis, stir and rest times for the declared method.\n\nPass only when every applicable stage follows the declared site protocol and source identity is preserved. A 20 g:20 mL source-card rehearsal alone does not pass a different actual method.\n\nRecord actual meter and probe, accepted calibration points and buffer lot/expiry, the device's acceptance indication or independent check, rinse/blot or care as its manual states, correct immersion/contact, and stable-reading condition; trainer observes each learner.\n\nPass only with accepted method-specific calibration and non-contaminating handling. A 'WRONG' buffer message, damaged/dry electrode or unstable reading stops scoring until corrected.\n\nThree separate sample rows show actual pH, display resolution and method, operator, time and any recheck. Learner identifies when a reading is unstable, outside a check limit or inconsistent with sample preparation, then repeats only the affected stage under trainer direction.\n\nPass only when A, B and C are individually measured and recorded with defensible quality checks. Do not award a pass from a group sheet, a model key or three invented target numbers.", "Trainer sees each learner handle the labelled prepared soil, gently break clods without milling stones, sieve through two millimetres where required, weigh with a checked balance and measure the specified liquid in a clean graduated vessel; log actual mass, volume, liquid, ratio basis, stir and rest times for the declared method.\n\nPass only when every applicable stage follows the declared site protocol and source identity is preserved. A twenty grams:twenty millilitres source-card rehearsal alone does not pass a different actual method.\n\nRecord actual meter and probe, accepted calibration points and buffer lot/expiry, the device's acceptance indication or independent check, rinse/blot or care as its manual states, correct immersion/contact, and stable-reading condition; trainer observes each learner.\n\nPass only with accepted method-specific calibration and non-contaminating handling. A 'WRONG' buffer message, damaged/dry electrode or unstable reading stops scoring until corrected.\n\nThree separate sample rows show actual P H, display resolution and method, operator, time and any recheck. Learner identifies when a reading is unstable, outside a check limit or inconsistent with sample preparation, then repeats only the affected stage under trainer direction.\n\nPass only when A, B and C are individually measured and recorded with defensible quality checks. Do not award a pass from a group sheet, a model key or three invented target numbers."), ("documented comparison example, not the verified training-site instrument\n\nHanna H I nine nine one two one with H I one two nine two three soil electrode\n\nThis manual describes 10 g dry, 2 mm-sieved soil plus 25 mL H I seven zero five one soil preparation solution, mixed 30 seconds and rested 5 minutes before immersion. It also describes a separate direct-soil method with a suitable probe. Neither is the 20 g plus 20 mL distilled-water source process card.\n\nUC Davis documents separate one to one and one to two soil-to-deionized-water pH methods; method choice and liquid basis must accompany the result. This summary does not prescribe the source card's wait time or the H I nine nine one two one preparation solution.\n\nThe trainer records the actual meter, probe, manual revision, chosen preparation method, liquid, mass-to-volume ratio and basis, buffer set, calibration acceptance or check rules, electrode care, SDS where applicable, and waste route before a physical learner is scored. If unavailable, use online rehearsal only and mark practice unassessed.", "documented comparison example, not the verified training-site instrument\n\nHanna H I nine nine one two one with H I one two nine two three soil electrode\n\nThis manual describes ten grams dry, two millimetres-sieved soil plus twenty-five millilitres H I seven zero five one soil preparation solution, mixed thirty seconds and rested five minutes before immersion. It also describes a separate direct-soil method with a suitable probe. Neither is the twenty grams plus twenty millilitres distilled-water source process card.\n\nUC Davis documents separate one to one and one to two soil-to-deionized-water P H methods; method choice and liquid basis must accompany the result. This summary does not prescribe the source card's wait time or the H I nine nine one two one preparation solution.\n\nThe trainer records the actual meter, probe, manual revision, chosen preparation method, liquid, mass-to-volume ratio and basis, buffer set, calibration acceptance or check rules, electrode care, S D S where applicable, and waste route before a physical learner is scored. If unavailable, use online rehearsal only and mark practice unassessed."), ('g:mL', 'grams per millilitre'), ('ten grams dry, soil passed through a two-millimetre sieve soil', 'ten grams of dry soil passed through a two-millimetre sieve'), ('two millimetres sieve', 'two-millimetre sieve'), ('two millimetres-sieved', 'soil passed through a two-millimetre sieve')], 'it': [('1:1', 'uno a uno'), ('1:2', 'uno a due'), ('HI12923', 'acca i uno due nove due tre'), ('HI7051', 'acca i sette zero cinque uno'), ('HI99121', 'acca i nove nove uno due uno'), ("I nove controlli di questa scheda sono protezioni corrette, rottura delicata delle zolle, setaccio 2 mm, 20 g di suolo, 20 mL di acqua distillata, mescolamento di un minuto e riposo di 15 minuti, taratura con tamponi secondo il produttore, posizione corretta dell’elettrodo e registrazione di un pH stabile. Queste quantità definiscono lo scenario didattico cartaceo. Prima dell’uso pratico, il formatore verifica lo strumento e il metodo effettivi del sito e associa le azioni osservabili a quel metodo senza mescolare procedure.\n\nProtezioni scelte per il compito reale nella sede\n\nRompere delicatamente le zolle senza macinare sassi\n\nRaccogliere suolo setacciato a 2 mm\n\nPesare 20 g nello scenario originale\n\nMisurare 20 mL d'acqua distillata nello scenario originale\n\nMescolare 1 minuto e attendere 15 minuti nello scenario originale\n\nTarare con tamponi accettati secondo il produttore dello strumento effettivo\n\nCollocare correttamente la sonda idonea nel mezzo dichiarato\n\nRegistrare il pH finale stabile con identità di campione e metodo\n\nRegistrare identità dei tamponi, accettazione della taratura e metodo separatamente dai nove controlli originali.\n\nRisciacquare tra campioni, registrare prove instabili o respinte, pulire e conservare l'elettrodo secondo manuale.\n\nIl formatore registra prove e correzioni osservate per ogni allievo; il voto di gruppo non implica superamento individuale.", "I nove controlli di questa scheda sono protezioni corrette, rottura delicata delle zolle, setaccio due millimetri, venti grammi di suolo, venti millilitri di acqua distillata, mescolamento di un minuto e riposo di quindici minuti, taratura con tamponi secondo il produttore, posizione corretta dell’elettrodo e registrazione di un P H stabile. Queste quantità definiscono lo scenario didattico cartaceo. Prima dell’uso pratico, il formatore verifica lo strumento e il metodo effettivi del sito e associa le azioni osservabili a quel metodo senza mescolare procedure.\n\nProtezioni scelte per il compito reale nella sede\n\nRompere delicatamente le zolle senza macinare sassi\n\nRaccogliere suolo setacciato a due millimetri\n\nPesare venti grammi nello scenario originale\n\nMisurare venti millilitri d'acqua distillata nello scenario originale\n\nMescolare un minuto e attendere quindici minuti nello scenario originale\n\nTarare con tamponi accettati secondo il produttore dello strumento effettivo\n\nCollocare correttamente la sonda idonea nel mezzo dichiarato\n\nRegistrare il P H finale stabile con identità di campione e metodo\n\nRegistrare identità dei tamponi, accettazione della taratura e metodo separatamente dai nove controlli originali.\n\nRisciacquare tra campioni, registrare prove instabili o respinte, pulire e conservare l'elettrodo secondo manuale.\n\nIl formatore registra prove e correzioni osservate per ogni allievo; il voto di gruppo non implica superamento individuale."), ("Il formatore osserva ciascun allievo mentre manipola suolo preparato ed etichettato, rompe delicatamente le zolle senza macinare i sassi, setaccia a 2 mm ove richiesto, pesa con bilancia controllata e misura il liquido in un cilindro pulito; si registrano massa, volume, liquido, base del rapporto e tempi reali di mescolamento e riposo del metodo dichiarato.\n\nSuperato solo se ogni fase applicabile segue il protocollo scelto dalla sede e conserva l'identità del campione. La sola esercitazione 20 g:20 mL della scheda originale non supera un diverso metodo effettivo.\n\nRegistrare strumento e sonda effettivi, punti di taratura accettati e lotto/scadenza dei tamponi, indicazione di accettazione o controllo indipendente, risciacquo e cura previsti dal manuale, corretto contatto e condizione di stabilità; il formatore osserva ogni allievo.\n\nSuperato solo con taratura accettata per il metodo e manipolazione senza contaminazioni. Un messaggio di tampone errato, un elettrodo secco o danneggiato o una lettura instabile sospende la valutazione finché il problema non è risolto.\n\nTre righe separate riportano pH effettivo, risoluzione del display, metodo, operatore, ora ed eventuale ripetizione. L'allievo riconosce una lettura instabile, oltre i limiti di controllo o incoerente con la preparazione, e ripete solo la fase interessata con il formatore.\n\nSuperato solo se A, B e C sono misurati e registrati individualmente con controlli di qualità motivati. Non bastano la scheda di gruppo, una soluzione modello o tre valori inventati.", "Il formatore osserva ciascun allievo mentre manipola suolo preparato ed etichettato, rompe delicatamente le zolle senza macinare i sassi, setaccia a due millimetri ove richiesto, pesa con bilancia controllata e misura il liquido in un cilindro pulito; si registrano massa, volume, liquido, base del rapporto e tempi reali di mescolamento e riposo del metodo dichiarato.\n\nSuperato solo se ogni fase applicabile segue il protocollo scelto dalla sede e conserva l'identità del campione. La sola esercitazione venti grammi:venti millilitri della scheda originale non supera un diverso metodo effettivo.\n\nRegistrare strumento e sonda effettivi, punti di taratura accettati e lotto/scadenza dei tamponi, indicazione di accettazione o controllo indipendente, risciacquo e cura previsti dal manuale, corretto contatto e condizione di stabilità; il formatore osserva ogni allievo.\n\nSuperato solo con taratura accettata per il metodo e manipolazione senza contaminazioni. Un messaggio di tampone errato, un elettrodo secco o danneggiato o una lettura instabile sospende la valutazione finché il problema non è risolto.\n\nTre righe separate riportano P H effettivo, risoluzione del display, metodo, operatore, ora ed eventuale ripetizione. L'allievo riconosce una lettura instabile, oltre i limiti di controllo o incoerente con la preparazione, e ripete solo la fase interessata con il formatore.\n\nSuperato solo se A, B e C sono misurati e registrati individualmente con controlli di qualità motivati. Non bastano la scheda di gruppo, una soluzione modello o tre valori inventati."), ('Modello procedurale generico, non replica esatta acca i nove nove uno due uno. Lo schermo vuoto non è una misura. Cambiare fase non completa preparazione, calibrazione o attesa reali.\n\nSolo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nIdentità di campione e campo\n\nData / esecutore\n\nStrumento, sonda e manuale\n\nMassa, tipo/volume di liquido e base grammi per millilitro\n\nTempi reali di miscelazione e riposo\n\nSerie tamponi, valori, lotto/scadenza e accettazione/controllo\n\npH realmente osservato alla risoluzione supportata\n\nStabilità / incertezza / motivo della ripetizione\n\nIndagine successiva per la coltura, senza dosi inventate\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nScheda di esercitazione pH digitale', 'Modello procedurale generico, non replica esatta acca i nove nove uno due uno. Lo schermo vuoto non è una misura. Cambiare fase non completa preparazione, calibrazione o attesa reali.\n\nSolo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nIdentità di campione e campo\n\nData / esecutore\n\nStrumento, sonda e manuale\n\nMassa, tipo/volume di liquido e base grammi per millilitro\n\nTempi reali di miscelazione e riposo\n\nSerie tamponi, valori, lotto/scadenza e accettazione/controllo\n\nP H realmente osservato alla risoluzione supportata\n\nStabilità / incertezza / motivo della ripetizione\n\nIndagine successiva per la coltura, senza dosi inventate\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nScheda di esercitazione P H digitale'), ("Verifica identità, DPI, sonda e metodo completo\n\nDisgrega delicatamente; usa il setaccio da 2 mm previsto\n\nPesa 20 g di terreno preparato per questa scheda\n\nMisura 20 mL di acqua distillata per questa scheda\n\nMescola per 1 minuto\n\nLascia riposare 15 minuti; registra il tempo reale\n\nOttieni la calibrazione accettata richiesta\n\nImmergi la sonda idonea senza urtare granelli o vetro\n\nAttendi la stabilità accettata\n\nRegistra valore reale, identità e controlli\n\nRisciacqua tra campioni; pulisci e conserva secondo il manuale\n\nIl formatore registra strumento, sonda, manuale e metodo locale approvato. Ciascun allievo prepara personalmente il campione richiesto, tara e controlla lo strumento, misura A/B/C, registra qualità e risultato, risciacqua e conserva la sonda ed è osservato su tutti i criteri applicabili. Se il metodo locale differisce dalla scheda originale, quest'ultima resta un confronto e la scheda pratica si aggiorna prima di assegnare un esito.", "Verifica identità, D P I, sonda e metodo completo\n\nDisgrega delicatamente; usa il setaccio da due millimetri previsto\n\nPesa venti grammi di terreno preparato per questa scheda\n\nMisura venti millilitri di acqua distillata per questa scheda\n\nMescola per un minuto\n\nLascia riposare quindici minuti; registra il tempo reale\n\nOttieni la calibrazione accettata richiesta\n\nImmergi la sonda idonea senza urtare granelli o vetro\n\nAttendi la stabilità accettata\n\nRegistra valore reale, identità e controlli\n\nRisciacqua tra campioni; pulisci e conserva secondo il manuale\n\nIl formatore registra strumento, sonda, manuale e metodo locale approvato. Ciascun allievo prepara personalmente il campione richiesto, tara e controlla lo strumento, misura A/B/C, registra qualità e risultato, risciacqua e conserva la sonda ed è osservato su tutti i criteri applicabili. Se il metodo locale differisce dalla scheda originale, quest'ultima resta un confronto e la scheda pratica si aggiorna prima di assegnare un esito."), ("esempio documentato per il confronto, non strumento verificato della sede formativa\n\nHanna acca i nove nove uno due uno con elettrodo per suolo acca i uno due nove due tre\n\nIl manuale Hanna acca i nove nove uno due uno descrive 10 g di suolo asciutto setacciato a 2 mm più 25 mL di soluzione preparatoria acca i sette zero cinque uno: mescolare per 30 secondi, lasciare riposare per 5 minuti e poi immergere la sonda. Descrive anche un metodo separato di misura diretta nel suolo con sonda idonea. Nessuno dei due coincide con la scheda originale da 20 g più 20 mL d'acqua distillata.\n\nUC Davis documenta distinti metodi di pH con rapporto suolo:acqua deionizzata di uno a uno e uno a due. Insieme al risultato vanno indicati metodo e base del rapporto. Questa sintesi non prescrive il tempo d'attesa della scheda originale né la soluzione preparatoria acca i nove nove uno due uno.\n\nPrima di valutare la prova fisica, il formatore registra strumento e sonda effettivi, revisione del manuale, metodo scelto, liquido, rapporto massa:volume e sua base, tamponi, criteri di accettazione della taratura e dei controlli, cura dell'elettrodo, schede di sicurezza se pertinenti e smaltimento. Se mancano, si svolge solo l'esercitazione online e la prova pratica resta non valutata.", "esempio documentato per il confronto, non strumento verificato della sede formativa\n\nHanna acca i nove nove uno due uno con elettrodo per suolo acca i uno due nove due tre\n\nIl manuale Hanna acca i nove nove uno due uno descrive dieci grammi di suolo asciutto setacciato a due millimetri più venticinque millilitri di soluzione preparatoria acca i sette zero cinque uno: mescolare per trenta secondi, lasciare riposare per cinque minuti e poi immergere la sonda. Descrive anche un metodo separato di misura diretta nel suolo con sonda idonea. Nessuno dei due coincide con la scheda originale da venti grammi più venti millilitri d'acqua distillata.\n\nUC Davis documenta distinti metodi di P H con rapporto suolo:acqua deionizzata di uno a uno e uno a due. Insieme al risultato vanno indicati metodo e base del rapporto. Questa sintesi non prescrive il tempo d'attesa della scheda originale né la soluzione preparatoria acca i nove nove uno due uno.\n\nPrima di valutare la prova fisica, il formatore registra strumento e sonda effettivi, revisione del manuale, metodo scelto, liquido, rapporto massa:volume e sua base, tamponi, criteri di accettazione della taratura e dei controlli, cura dell'elettrodo, schede di sicurezza se pertinenti e smaltimento. Se mancano, si svolge solo l'esercitazione online e la prova pratica resta non valutata."), ('g:mL', 'grammi per millilitro')], 'de': [('1:1', 'eins zu eins'), ('1:2', 'eins zu zwei'), ('Allgemeines Verfahrensmodell, keine genaue Ha I neun neun eins zwei eins-Nachbildung. Leeres Display ist keine Bodenmessung. Phasenwechsel ersetzt keine echte Vorbereitung, Kalibrierung oder Wartezeit.\n\nNur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nDatum / messende Person\n\nMessgerät, Sonde und Anleitung\n\nBodenmasse, Flüssigkeit/-volumen und Gramm pro Milliliter-Basis\n\nEchte Misch- und Standzeiten\n\nPuffersatz, Punkte, Charge/Haltbarkeit und Annahme/Prüfung\n\nTatsächlich beobachteter pH mit unterstützter Auflösung\n\nStabilität / Unsicherheit / Wiederholungsgrund\n\nNächste kulturspezifische Prüfung; keine erfundene Dosis\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nArbeitsblatt digitale pH-Messung', 'Allgemeines Verfahrensmodell, keine genaue Ha I neun neun eins zwei eins-Nachbildung. Leeres Display ist keine Bodenmessung. Phasenwechsel ersetzt keine echte Vorbereitung, Kalibrierung oder Wartezeit.\n\nNur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nProben- und Feldkennung\n\nDatum / messende Person\n\nMessgerät, Sonde und Anleitung\n\nBodenmasse, Flüssigkeit/-volumen und Gramm pro Milliliter-Basis\n\nEchte Misch- und Standzeiten\n\nPuffersatz, Punkte, Charge/Haltbarkeit und Annahme/Prüfung\n\nTatsächlich beobachteter P H mit unterstützter Auflösung\n\nStabilität / Unsicherheit / Wiederholungsgrund\n\nNächste kulturspezifische Prüfung; keine erfundene Dosis\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nArbeitsblatt digitale P H-Messung'), ('Die Lehrkraft beobachtet jede lernende Person beim Umgang mit vorbereiteter, beschrifteter Erde, beim vorsichtigen Zerkleinern der Klumpen ohne Mahlen von Steinen, gegebenenfalls beim Sieben auf 2 mm, beim Wiegen mit geprüfter Waage und beim Abmessen der Flüssigkeit in einem sauberen Messzylinder. Tatsächliche Masse, Volumen, Flüssigkeit, Bezugsgrößen des Verhältnisses sowie Rühr- und Standzeiten des festgelegten Verfahrens werden erfasst.\n\nBestanden nur, wenn alle zutreffenden Phasen dem gewählten Standortprotokoll entsprechen und die Probenidentität erhalten bleibt. Die Übung mit 20 g:20 mL der Originalkarte allein genügt nicht zum Bestehen eines abweichenden tatsächlichen Verfahrens.\n\nTatsächliches Gerät und Sonde, akzeptierte Kalibrierpunkte, Charge und Haltbarkeit der Puffer, Akzeptanzanzeige oder unabhängiger Kontrollwert, Spülen und Pflege nach Handbuch, korrekter Kontakt und Stabilitätsbedingung werden erfasst; die Lehrkraft beobachtet jede Person.\n\nBestanden nur mit verfahrensgerechter, akzeptierter Kalibrierung und sauberer Handhabung. Meldet das Gerät einen falschen Puffer, ist die Elektrode trocken oder beschädigt oder bleibt der Wert instabil, wird die Bewertung bis zur Behebung unterbrochen.\n\nDrei getrennte Zeilen zeigen tatsächlichen pH-Wert, Anzeigeauflösung, Verfahren, ausführende Person, Zeitpunkt und gegebenenfalls Nachmessung. Die lernende Person erkennt instabile Werte, überschrittene Kontrollgrenzen oder Widersprüche zur Aufbereitung und wiederholt mit Anleitung nur die betroffene Phase.\n\nBestanden nur, wenn A, B und C jeweils selbst gemessen und mit nachvollziehbaren Qualitätskontrollen dokumentiert wurden. Ein Gruppenblatt, Musterlösung oder drei erfundene Zielwerte reichen nicht.', 'Die Lehrkraft beobachtet jede lernende Person beim Umgang mit vorbereiteter, beschrifteter Erde, beim vorsichtigen Zerkleinern der Klumpen ohne Mahlen von Steinen, gegebenenfalls beim Sieben auf zwei Millimeter, beim Wiegen mit geprüfter Waage und beim Abmessen der Flüssigkeit in einem sauberen Messzylinder. Tatsächliche Masse, Volumen, Flüssigkeit, Bezugsgrößen des Verhältnisses sowie Rühr- und Standzeiten des festgelegten Verfahrens werden erfasst.\n\nBestanden nur, wenn alle zutreffenden Phasen dem gewählten Standortprotokoll entsprechen und die Probenidentität erhalten bleibt. Die Übung mit zwanzig Gramm:zwanzig Milliliter der Originalkarte allein genügt nicht zum Bestehen eines abweichenden tatsächlichen Verfahrens.\n\nTatsächliches Gerät und Sonde, akzeptierte Kalibrierpunkte, Charge und Haltbarkeit der Puffer, Akzeptanzanzeige oder unabhängiger Kontrollwert, Spülen und Pflege nach Handbuch, korrekter Kontakt und Stabilitätsbedingung werden erfasst; die Lehrkraft beobachtet jede Person.\n\nBestanden nur mit verfahrensgerechter, akzeptierter Kalibrierung und sauberer Handhabung. Meldet das Gerät einen falschen Puffer, ist die Elektrode trocken oder beschädigt oder bleibt der Wert instabil, wird die Bewertung bis zur Behebung unterbrochen.\n\nDrei getrennte Zeilen zeigen tatsächlichen P H-Wert, Anzeigeauflösung, Verfahren, ausführende Person, Zeitpunkt und gegebenenfalls Nachmessung. Die lernende Person erkennt instabile Werte, überschrittene Kontrollgrenzen oder Widersprüche zur Aufbereitung und wiederholt mit Anleitung nur die betroffene Phase.\n\nBestanden nur, wenn A, B und C jeweils selbst gemessen und mit nachvollziehbaren Qualitätskontrollen dokumentiert wurden. Ein Gruppenblatt, Musterlösung oder drei erfundene Zielwerte reichen nicht.'), ('Die neun Prüfpunkte dieser Karte sind passende Schutzausrüstung, vorsichtiges Zerkleinern der Aggregate, 2-mm-Sieb, 20 g Boden, 20 mL destilliertes Wasser, eine Minute Rühren und 15 Minuten Stehen, Pufferkalibrierung nach Hersteller, korrekte Elektrodenplatzierung und Aufzeichnung eines stabilen pH-Wertes. Diese Mengen definieren das schriftliche Lernszenario. Vor der praktischen Nutzung prüft die Lehrkraft das tatsächliche Gerät und Standortverfahren und ordnet die beobachtbaren Handlungen diesem Verfahren zu, ohne Abläufe zu vermischen.\n\nSchutz für die wirkliche Standortaufgabe wählen\n\nBodenklumpen vorsichtig ohne Mahlen von Steinen zerkleinern\n\nAuf 2 mm gesiebten Boden entnehmen\n\nIm Originalszenario 20 g wiegen\n\nIm Originalszenario 20 mL destilliertes Wasser abmessen\n\nIm Originalszenario 1 Minute rühren und 15 Minuten stehen lassen\n\nMit akzeptierten Puffern nach Anleitung des tatsächlichen Geräts kalibrieren\n\nGeeignete Sonde richtig in das festgelegte Medium einsetzen\n\nStabilen endgültigen pH-Wert mit Probe und Verfahren erfassen\n\nPufferidentität, Annahme der Kalibrierung und Verfahren getrennt von den neun Originalpunkten erfassen.\n\nZwischen Proben spülen, instabile oder abgelehnte Läufe dokumentieren und die Elektrode nach Handbuch reinigen und lagern.\n\nDie Lehrkraft dokumentiert eigene beobachtete Leistung und Korrektur jeder Person; eine Gruppennote bewirkt kein individuelles Bestehen.', 'Die neun Prüfpunkte dieser Karte sind passende Schutzausrüstung, vorsichtiges Zerkleinern der Aggregate, zwei-Millimeter-Sieb, zwanzig Gramm Boden, zwanzig Milliliter destilliertes Wasser, eine Minute Rühren und fünfzehn Minuten Stehen, Pufferkalibrierung nach Hersteller, korrekte Elektrodenplatzierung und Aufzeichnung eines stabilen P H-Wertes. Diese Mengen definieren das schriftliche Lernszenario. Vor der praktischen Nutzung prüft die Lehrkraft das tatsächliche Gerät und Standortverfahren und ordnet die beobachtbaren Handlungen diesem Verfahren zu, ohne Abläufe zu vermischen.\n\nSchutz für die wirkliche Standortaufgabe wählen\n\nBodenklumpen vorsichtig ohne Mahlen von Steinen zerkleinern\n\nAuf zwei Millimeter gesiebten Boden entnehmen\n\nIm Originalszenario zwanzig Gramm wiegen\n\nIm Originalszenario zwanzig Milliliter destilliertes Wasser abmessen\n\nIm Originalszenario eine Minute rühren und fünfzehn Minuten stehen lassen\n\nMit akzeptierten Puffern nach Anleitung des tatsächlichen Geräts kalibrieren\n\nGeeignete Sonde richtig in das festgelegte Medium einsetzen\n\nStabilen endgültigen P H-Wert mit Probe und Verfahren erfassen\n\nPufferidentität, Annahme der Kalibrierung und Verfahren getrennt von den neun Originalpunkten erfassen.\n\nZwischen Proben spülen, instabile oder abgelehnte Läufe dokumentieren und die Elektrode nach Handbuch reinigen und lagern.\n\nDie Lehrkraft dokumentiert eigene beobachtete Leistung und Korrektur jeder Person; eine Gruppennote bewirkt kein individuelles Bestehen.'), ('HI12923', 'Ha I eins zwei neun zwei drei'), ('HI7051', 'Ha I sieben null fünf eins'), ('HI99121', 'Ha I neun neun eins zwei eins'), ('Kennung, Schutz, echte Sonde und vollständiges Verfahren prüfen\n\nKlumpen vorsichtig lösen; vorgeschriebenes 2-mm-Sieb nutzen\n\nFür diese Karte 20 g vorbereiteten Boden wiegen\n\nFür diese Karte 20 mL destilliertes Wasser abmessen\n\n1 Minute rühren\n\n15 Minuten stehen lassen; echte Zeit notieren\n\nErforderliche Pufferkalibrierung akzeptieren lassen\n\nGeeignete Sonde ohne Kontakt mit Körnern oder Glas eintauchen\n\nAkzeptierte Stabilität abwarten\n\nEchten Wert, Kennung und Qualitätskontrollen notieren\n\nZwischen Proben spülen; nach Anleitung reinigen/lagern\n\nDie Lehrkraft erfasst tatsächliches Gerät, Sonde, Handbuch und zugelassenes Standortverfahren. Jede Person bereitet die nötige Probe selbst vor, kalibriert und kontrolliert das Gerät, misst A/B/C, dokumentiert Qualität und Ergebnis, spült und lagert die Sonde und wird bei allen zutreffenden Kriterien beobachtet. Unterscheidet sich das Standortverfahren von der Originalkarte, bleibt diese ein Vergleich und der Praxisbogen wird vor der Bewertung angepasst.', 'Kennung, Schutz, echte Sonde und vollständiges Verfahren prüfen\n\nKlumpen vorsichtig lösen; vorgeschriebenes zwei-Millimeter-Sieb nutzen\n\nFür diese Karte zwanzig Gramm vorbereiteten Boden wiegen\n\nFür diese Karte zwanzig Milliliter destilliertes Wasser abmessen\n\neine Minute rühren\n\nfünfzehn Minuten stehen lassen; echte Zeit notieren\n\nErforderliche Pufferkalibrierung akzeptieren lassen\n\nGeeignete Sonde ohne Kontakt mit Körnern oder Glas eintauchen\n\nAkzeptierte Stabilität abwarten\n\nEchten Wert, Kennung und Qualitätskontrollen notieren\n\nZwischen Proben spülen; nach Anleitung reinigen/lagern\n\nDie Lehrkraft erfasst tatsächliches Gerät, Sonde, Handbuch und zugelassenes Standortverfahren. Jede Person bereitet die nötige Probe selbst vor, kalibriert und kontrolliert das Gerät, misst A/B/C, dokumentiert Qualität und Ergebnis, spült und lagert die Sonde und wird bei allen zutreffenden Kriterien beobachtet. Unterscheidet sich das Standortverfahren von der Originalkarte, bleibt diese ein Vergleich und der Praxisbogen wird vor der Bewertung angepasst.'), ('dokumentiertes Vergleichsbeispiel, kein nachgewiesenes Gerät des Ausbildungsorts\n\nHanna Ha I neun neun eins zwei eins mit Bodenelektrode Ha I eins zwei neun zwei drei\n\nDas Handbuch des Hanna Ha I neun neun eins zwei eins beschreibt 10 g trockenen, auf 2 mm gesiebten Boden plus 25 mL Ha I sieben null fünf eins-Bodenvorbereitungslösung: 30 Sekunden mischen, 5 Minuten stehen lassen und dann die Sonde eintauchen. Es beschreibt außerdem eine getrennte Direktmessung im Boden mit geeigneter Sonde. Beides ist nicht die ursprüngliche Arbeitskarte mit 20 g Boden und 20 mL destilliertem Wasser.\n\nUC Davis dokumentiert getrennte pH-Verfahren mit Boden und entionisiertem Wasser im Verhältnis eins zu eins oder eins zu zwei. Verfahren und Bezugsgrößen des Verhältnisses gehören zum Ergebnis. Diese Zusammenfassung schreibt weder die Wartezeit der ursprünglichen Karte noch die Ha I neun neun eins zwei eins-Vorbereitungslösung vor.\n\nVor der Bewertung einer praktischen Arbeit dokumentiert die Lehrkraft das tatsächliche Messgerät, die Sonde, die aktuelle Handbuchfassung, das gewählte Aufbereitungsverfahren, Flüssigkeit, Masse-Volumen-Verhältnis samt Einheiten, Puffer, Annahmeregeln für Kalibrierung und Qualitätskontrolle, Elektrodenpflege, gegebenenfalls Sicherheitsdatenblätter und Entsorgungsweg. Fehlen diese Angaben, findet nur die Online-Übung statt; die Praxis bleibt unbewertet.', 'dokumentiertes Vergleichsbeispiel, kein nachgewiesenes Gerät des Ausbildungsorts\n\nHanna Ha I neun neun eins zwei eins mit Bodenelektrode Ha I eins zwei neun zwei drei\n\nDas Handbuch des Hanna Ha I neun neun eins zwei eins beschreibt zehn Gramm trockenen, auf zwei Millimeter gesiebten Boden plus fünfundzwanzig Milliliter Ha I sieben null fünf eins-Bodenvorbereitungslösung: dreißig Sekunden mischen, fünf Minuten stehen lassen und dann die Sonde eintauchen. Es beschreibt außerdem eine getrennte Direktmessung im Boden mit geeigneter Sonde. Beides ist nicht die ursprüngliche Arbeitskarte mit zwanzig Gramm Boden und zwanzig Milliliter destilliertem Wasser.\n\nUC Davis dokumentiert getrennte P H-Verfahren mit Boden und entionisiertem Wasser im Verhältnis eins zu eins oder eins zu zwei. Verfahren und Bezugsgrößen des Verhältnisses gehören zum Ergebnis. Diese Zusammenfassung schreibt weder die Wartezeit der ursprünglichen Karte noch die Ha I neun neun eins zwei eins-Vorbereitungslösung vor.\n\nVor der Bewertung einer praktischen Arbeit dokumentiert die Lehrkraft das tatsächliche Messgerät, die Sonde, die aktuelle Handbuchfassung, das gewählte Aufbereitungsverfahren, Flüssigkeit, Masse-Volumen-Verhältnis samt Einheiten, Puffer, Annahmeregeln für Kalibrierung und Qualitätskontrolle, Elektrodenpflege, gegebenenfalls Sicherheitsdatenblätter und Entsorgungsweg. Fehlen diese Angaben, findet nur die Online-Übung statt; die Praxis bleibt unbewertet.'), ('g:mL', 'Gramm pro Milliliter')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s207-lab-audio-20261023-r1'
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
    assert count < 5, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 20,'maximumCallsForLane':5,
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
    assert all(v<=5 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':5,'maximumBlindReviewPerLane':5,'maximumASRPerLane':5,'maximumTTSAggregate':20,'maximumBlindAggregate':20,'maximumASRAggregate':20,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
