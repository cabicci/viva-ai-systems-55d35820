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
IDS = ('S2-07-ar-EG-opening-r1', 'S2-07-ar-EG-E01-r1', 'S2-07-ar-EG-E02-r1', 'S2-07-ar-EG-E03-r1', 'S2-07-ar-EG-guided-practice-r1', 'S2-07-ar-EG-reflection-r1', 'S2-07-ar-EG-comparison-r1', 'S2-07-ar-EG-glossary-r1', 'S2-07-en-opening-r1', 'S2-07-en-E01-r1', 'S2-07-en-E02-r1', 'S2-07-en-E03-r1', 'S2-07-en-guided-practice-r1', 'S2-07-en-reflection-r1', 'S2-07-en-comparison-r1', 'S2-07-en-glossary-r1', 'S2-07-it-opening-r1', 'S2-07-it-E01-r1', 'S2-07-it-E02-r1', 'S2-07-it-E03-r1', 'S2-07-it-guided-practice-r1', 'S2-07-it-reflection-r1', 'S2-07-it-comparison-r1', 'S2-07-it-glossary-r1', 'S2-07-de-opening-r1', 'S2-07-de-E01-r1', 'S2-07-de-E02-r1', 'S2-07-de-E03-r1', 'S2-07-de-guided-practice-r1', 'S2-07-de-reflection-r1', 'S2-07-de-comparison-r1', 'S2-07-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S207_REMAINDER_32_SOURCEBOUND_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s207-remainder-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('+', 'مع'), ('1 min', 'دقيقة واحدة'), ('1:1', 'واحد لواحد'), ('1:1 g:mL', 'واحد لواحد، جرام تربة لكل مليلتر ماء'), ('1:2', 'واحد لاتنين'), ('30 s', 'تلاتين ثانية'), ('HI7051', 'إتش آي سبعة صفر خمسة واحد'), ('HI99121', 'إتش آي تسعة تسعة واحد اتنين واحد'), ('اجتيازًا عملي', 'اجتياز عملي'), ('الجهاز قبل المحلول الأول، لكن نقطة المعايرة الثانية طلعت خطأ والطالب عايز يقيس A على أي حال.\n\nما تعتبرش معايرة نقطتين نجحت لو الطريقة طالبة النقطتين.\n\nراجع مجموعة المحاليل والبطاقة والصلاحية واحتمال التلوث، وافحص المسبار حسب دليله.\n\nأعِد نقطة المعايرة المتأثرة وأي فحص مطلوب. لو الجهاز لسه بيرفض، وقف واطلب جهاز صالح من المدرّب.\n\nرقم بعد فشل فحص الجودة مش نتيجة عملية صالحة.', 'الجهاز قبل المحلول الأول، لكن نقطة المعايرة الثانية طلعت خطأ والطالب عايز يقيس إيه على أي حال.\n\nما تعتبرش معايرة نقطتين نجحت لو الطريقة طالبة النقطتين.\n\nراجع مجموعة المحاليل والبطاقة والصلاحية واحتمال التلوث، وافحص المسبار حسب دليله.\n\nأعِد نقطة المعايرة المتأثرة وأي فحص مطلوب. لو الجهاز لسه بيرفض، وقف واطلب جهاز صالح من المدرّب.\n\nرقم بعد فشل فحص الجودة مش نتيجة عملية صالحة.'), ('الرقم اللي بيظهر على الشاشة ما يبقاش مفيد إلا لما نعرف العينة وطريقة تجهيزها والمعايرة وثبات القراءة. هتتدرّب على بطاقة الأصل: 20 g تربة مع 20 mL ماء، وتقارنها بطريقة شركة مختلفة من غير خلط بينهم، والتطبيق الحقيقي يبقى على جهاز الموقع تحت إشراف المدرّب.\n\nتحت ملاحظة المدرّب، تحضّر معلق تربة معلوم الهوية بكتلة التربة وحجم السائل وأساس النسبة وأوقات طريقة واحدة معلنة؛ وتفصل مثال بطاقة الأصل 20 g + 20 mL عن طريقة الشركة المختلفة.\n\nتعاير الجهاز الحقيقي بمحاليل منظمة مناسبة حسب دليله، وتحمي المسبار والمحاليل من التلوث، وتضع جزء الاستشعار في المكان الصحيح وتنتظر قراءة ثابتة معتمدة.\n\nتقيس وتسجل pH الحقيقي للعينات A وB وC مع هوية كل عينة والطريقة، وتتعرف على فشل المعايرة أو رقم غير مستقر أو نتيجة غير منطقية تحتاج فحصًا أو إعادة المرحلة المتأثرة.', 'الرقم اللي بيظهر على الشاشة ما يبقاش مفيد إلا لما نعرف العينة وطريقة تجهيزها والمعايرة وثبات القراءة. هتتدرّب على بطاقة الأصل: عشرين جرام تربة مع عشرين مليلتر ماء، وتقارنها بطريقة شركة مختلفة من غير خلط بينهم، والتطبيق الحقيقي يبقى على جهاز الموقع تحت إشراف المدرّب.\n\nتحت ملاحظة المدرّب، تحضّر معلق تربة معلوم الهوية بكتلة التربة وحجم السائل وأساس النسبة وأوقات طريقة واحدة معلنة؛ وتفصل مثال بطاقة الأصل عشرين جرام + عشرين مليلتر عن طريقة الشركة المختلفة.\n\nتعاير الجهاز الحقيقي بمحاليل منظمة مناسبة حسب دليله، وتحمي المسبار والمحاليل من التلوث، وتضع جزء الاستشعار في المكان الصحيح وتنتظر قراءة ثابتة معتمدة.\n\nتقيس وتسجل بي إتش الحقيقي للعينات إيه وB وC مع هوية كل عينة والطريقة، وتتعرف على فشل المعايرة أو رقم غير مستقر أو نتيجة غير منطقية تحتاج فحصًا أو إعادة المرحلة المتأثرة.'), ('بروتوكولًا واحدًا', 'بروتوكول واحد'), ('جهازًا صالحًا', 'جهاز صالح'), ('خمسة دقيقة', 'خمس دقايق'), ('صنّف أولًا ثلاث بطاقات طرق كاملة من غير خلط أرقامها. لبطاقة الأصل، رتّب الوقاية ورمز العينة، تفكيك الكتل برفق، منخل 2 mm، 20 g تربة، 20 mL ماء مقطر، تقليب دقيقة، انتظار 15 دقيقة، معايرة حسب الشركة، وضع المسبار بحذر، قراءة ثابتة وتسجيلها. عند شاشة خطأ اختار الوقوف والتشخيص. خانات A/B/C فاضية لقياس الطالب مش مفتاح الأصل.\n\nالمدرّب يسجل الجهاز والمسبار والدليل الحقيقي وطريقة الموقع المعتمدة. كل طالب يجهز العينة المطلوبة بنفسه ويعاير ويفحص ويقيس A/B/C ويسجل الجودة والنتيجة ويشطف ويحفظ المسبار تحت الملاحظة. لو طريقة الموقع مختلفة عن بطاقة الأصل، تبقى البطاقة مقارنة وتتعدل ورقة المهمة قبل التقييم.', 'صنّف أولًا ثلاث بطاقات طرق كاملة من غير خلط أرقامها. لبطاقة الأصل، رتّب الوقاية ورمز العينة، تفكيك الكتل برفق، منخل اتنين مليمتر، عشرين جرام تربة، عشرين مليلتر ماء مقطر، تقليب دقيقة، انتظار خمستاشر دقيقة، معايرة حسب الشركة، وضع المسبار بحذر، قراءة ثابتة وتسجيلها. عند شاشة خطأ اختار الوقوف والتشخيص. خانات إيه/بي/سي فاضية لقياس الطالب مش مفتاح الأصل.\n\nالمدرّب يسجل الجهاز والمسبار والدليل الحقيقي وطريقة الموقع المعتمدة. كل طالب يجهز العينة المطلوبة بنفسه ويعاير ويفحص ويقيس إيه/بي/سي ويسجل الجودة والنتيجة ويشطف ويحفظ المسبار تحت الملاحظة. لو طريقة الموقع مختلفة عن بطاقة الأصل، تبقى البطاقة مقارنة وتتعدل ورقة المهمة قبل التقييم.'), ('طالب وزَن 20 g من بطاقة الأصل، ثم أضاف 25 mL من سائل مثال إتش آي تسعة تسعة واحد اتنين واحد وانتظر 15 دقيقة لأن الورقتين قدامه.\n\nوقف: 20 g:25 mL مش بطاقة الأصل 20 g:20 mL ماء مقطر، ومش طريقة الشركة 10 g:25 mL إتش آي سبعة صفر خمسة واحد.\n\nاختار واكتب بروتوكول واحد مع سائله وأساس نسبته وكل أوقاته قبل التحضير.\n\nلو الخليط الغلط اتجهز فعلًا، علّمه إنه غير صالح للمقارنة المطلوبة وجهز عينة جديدة بتوجيه المدرّب.\n\nكل نتيجة مسجلة لازم تنتمي لطريقة واحدة كاملة.', 'طالب وزَن عشرين جرام من بطاقة الأصل، ثم أضاف خمسة وعشرين مليلتر من سائل مثال إتش آي تسعة تسعة واحد اتنين واحد وانتظر خمستاشر دقيقة لأن الورقتين قدامه.\n\nوقف: عشرين جرام:خمسة وعشرين مليلتر مش بطاقة الأصل عشرين جرام:عشرين مليلتر ماء مقطر، ومش طريقة الشركة عشرة جرام:خمسة وعشرين مليلتر إتش آي سبعة صفر خمسة واحد.\n\nاختار واكتب بروتوكول واحد مع سائله وأساس نسبته وكل أوقاته قبل التحضير.\n\nلو الخليط الغلط اتجهز فعلًا، علّمه إنه غير صالح للمقارنة المطلوبة وجهز عينة جديدة بتوجيه المدرّب.\n\nكل نتيجة مسجلة لازم تنتمي لطريقة واحدة كاملة.'), ('عشرة جرام', 'عشر جرام'), ('عمليًا', 'عملي'), ('فحصًا', 'فحص'), ('معلق التربة\n\nتربة مخلوطة بسائل محدد بنسبة كتلة إلى حجم معلنة بغرض القياس.\n\nواحد لواحد، جرام تربة لكل مليلتر ماء\n\nفي بطاقة الأصل: 20 g تربة مع 20 mL ماء؛ الوحدات لازم تفضل مكتوبة مع النسبة.\n\nمحلول منظم للمعايرة\n\nسائل pH معروف لمعايرة الجهاز أو فحصه حسب مجموعة المحاليل اللي الجهاز بيقبلها.\n\nوصلة المسبار\n\nجزء مرجعي لازم يوضع ويُعتنى به حسب دليل المسبار علشان القراءة تبقى موثوقة.\n\nمؤشر الثبات\n\nإشارة الجهاز أو قاعدة الموقع إن الرقم استقر بدرجة مناسبة للتسجيل.\n\nفحص جودة\n\nفحص مُسجّل يؤكد صلاحية المعايرة وتجهيز العينة والقراءة للسؤال المطلوب.', 'معلق التربة\n\nتربة مخلوطة بسائل محدد بنسبة كتلة إلى حجم معلنة بغرض القياس.\n\nواحد لواحد، جرام تربة لكل مليلتر ماء\n\nفي بطاقة الأصل: عشرين جرام تربة مع عشرين مليلتر ماء؛ الوحدات لازم تفضل مكتوبة مع النسبة.\n\nمحلول منظم للمعايرة\n\nسائل بي إتش معروف لمعايرة الجهاز أو فحصه حسب مجموعة المحاليل اللي الجهاز بيقبلها.\n\nوصلة المسبار\n\nجزء مرجعي لازم يوضع ويُعتنى به حسب دليل المسبار علشان القراءة تبقى موثوقة.\n\nمؤشر الثبات\n\nإشارة الجهاز أو قاعدة الموقع إن الرقم استقر بدرجة مناسبة للتسجيل.\n\nفحص جودة\n\nفحص مُسجّل يؤكد صلاحية المعايرة وتجهيز العينة والقراءة للسؤال المطلوب.'), ('مفتاح الأصل بيقول B نحو pH 6.8، لكن الجهاز بعد الفحص والثبات قاس العينة الحقيقية 6.5.\n\nاكتب 6.5 مع رمز العينة والطريقة والمعايرة ودقة الشاشة؛ ما تبدلهاش بالرقم النموذجي.\n\nاطلب من المدرّب مراجعة تجهيز العينة وهويتها وإعادة القياس أو طريقة مستقلة عند الحاجة.\n\nفسّر النتيجة الحقيقية المؤكدة للمحصول لاحقًا؛ الهدف مش ملاحظة.\n\nالقياسات ممكن تختلف عن الأهداف؛ سجّل الدليل قبل التفسير.', 'مفتاح الأصل بيقول بي نحو بي إتش ستة فاصلة تمانية، لكن الجهاز بعد الفحص والثبات قاس العينة الحقيقية ستة فاصلة خمسة.\n\nاكتب ستة فاصلة خمسة مع رمز العينة والطريقة والمعايرة ودقة الشاشة؛ ما تبدلهاش بالرقم النموذجي.\n\nاطلب من المدرّب مراجعة تجهيز العينة وهويتها وإعادة القياس أو طريقة مستقلة عند الحاجة.\n\nفسّر النتيجة الحقيقية المؤكدة للمحصول لاحقًا؛ الهدف مش ملاحظة.\n\nالقياسات ممكن تختلف عن الأهداف؛ سجّل الدليل قبل التفسير.'), ('وB', 'وبي'), ('وC', 'وسي'), ('يلاحظها عملي', 'يلاحظها في التطبيق العملي'), ('٣. مثال الشركة مختلف عمدًا\n\nطريق التدريب الموثق\n\nالتربة والسائل\n\nالخلط والانتظار\n\nاستخدامه في الخطوة\n\nبطاقة العملية الأصلية\n\n20 g تربة منخولة + 20 mL ماء مقطر؛ واحد لواحد، جرام تربة لكل مليلتر ماء\n\nتقليب دقيقة واحدة؛ انتظار 15 min\n\nالاحتفاظ بالفحوص التسعة كحالة؛ التطبيق الحقيقي يحتاج تحقق المدرّب من الجهاز والطريقة\n\nشرح المدرّس العام\n\nواحد لواحد أو واحد لاتنين تربة:ماء، ومثال 20 g:20 mL؛ لازم تحديد أساس النسبة\n\nتقليب دقيقة واحدة؛ انتظار 15–30 min\n\nبدائل في الشرح، مش أوامر ثانية تخلطها ببطاقة العملية\n\nمثال دليل إتش آي تسعة تسعة واحد اتنين واحد\n\n10 g تربة جافة منخولة 2 mm + 25 mL محلول إتش آي سبعة صفر خمسة واحد\n\nخلط تلاتين ثانية؛ انتظار 5 min\n\nمثال شركة منفصل، مش بديل صامت لبطاقة الأصل', 'تلاتة. مثال الشركة مختلف عمدًا\n\nطريق التدريب الموثق\n\nالتربة والسائل\n\nالخلط والانتظار\n\nاستخدامه في الخطوة\n\nبطاقة العملية الأصلية\n\nعشرين جرام تربة منخولة + عشرين مليلتر ماء مقطر؛ واحد لواحد، جرام تربة لكل مليلتر ماء\n\nتقليب دقيقة واحدة؛ انتظار خمستاشر دقيقة\n\nالاحتفاظ بالفحوص التسعة كحالة؛ التطبيق الحقيقي يحتاج تحقق المدرّب من الجهاز والطريقة\n\nشرح المدرّس العام\n\nواحد لواحد أو واحد لاتنين تربة:ماء، ومثال عشرين جرام:عشرين مليلتر؛ لازم تحديد أساس النسبة\n\nتقليب دقيقة واحدة؛ انتظار خمستاشر لتلاتين دقيقة\n\nبدائل في الشرح، مش أوامر ثانية تخلطها ببطاقة العملية\n\nمثال دليل إتش آي تسعة تسعة واحد اتنين واحد\n\nعشرة جرام تربة جافة منخولة اتنين مليمتر + خمسة وعشرين مليلتر محلول إتش آي سبعة صفر خمسة واحد\n\nخلط تلاتين ثانية؛ انتظار خمسة دقيقة\n\nمثال شركة منفصل، مش بديل صامت لبطاقة الأصل')], 'en': [('+', 'plus'), ('1 min', 'one minute'), ('1:1', 'one to one'), ('1:1 g:mL', 'one to one on a gram to millilitre basis'), ('1:2', 'one to two'), ('3. A manufacturer example is deliberately different\n\nDocumented teaching route\n\nSoil and liquid\n\nMix / wait\n\nUse in this step\n\nSource process card\n\n20 g sieved soil + 20 mL distilled water; one to one on a gram to millilitre basis\n\nStir one minute; stand 15 min\n\nPreserve all nine source checks as a scenario; physical use requires trainer and actual-meter validation\n\nTeacher overview\n\none to one or one to two soil:water, example 20 g:20 mL; specify basis\n\nStir one minute; stand 15-30 min\n\nAlternative overview, not a second independent command to mix with the card\n\nH I nine nine one two one manual example\n\n10 g dry 2 mm-sieved soil + 25 mL H I seven zero five one preparation solution\n\nMix thirty seconds; stand 5 min\n\nSeparate manufacturer example, never silently substituted for the source card', 'three. A manufacturer example is deliberately different\n\nDocumented teaching route\n\nSoil and liquid\n\nMix / wait\n\nUse in this step\n\nSource process card\n\ntwenty grams sieved soil + twenty millilitres distilled water; one to one on a gram to millilitre basis\n\nStir one minute; stand fifteen minutes\n\nPreserve all nine source checks as a scenario; physical use requires trainer and actual-meter validation\n\nTeacher overview\n\none to one or one to two soil:water, example twenty grams:twenty millilitres; specify basis\n\nStir one minute; stand fifteen to thirty minutes\n\nAlternative overview, not a second independent command to mix with the card\n\nH I nine nine one two one manual example\n\nten grams dry two millimetres-sieved soil + twenty-five millilitres H I seven zero five one preparation solution\n\nMix thirty seconds; stand five minutes\n\nSeparate manufacturer example, never silently substituted for the source card'), ('30 s', 'thirty seconds'), ("A digital number is useful only when the sample, preparation method, calibration and stable reading are known. You will rehearse the source's 20 g to 20 mL process card, compare it with a separate manufacturer's method, and measure real samples only under a trainer using the actual meter's documented procedure.\n\nUnder trainer observation, prepare an identified soil suspension with the mass, liquid volume, ratio basis and timing of one declared method; keep the source card's 20 g + 20 mL worked example separate from a different manufacturer's protocol.\n\nCalibrate the actual meter with suitable buffers according to its manual, protect the electrode and buffers from contamination, place the sensing area correctly and wait for an accepted stable reading.\n\nMeasure and record the actual pH of samples A, B and C with sample and method identities, and recognize a failed calibration, unstable display or implausible result that requires a check or targeted repeat.", "A digital number is useful only when the sample, preparation method, calibration and stable reading are known. You will rehearse the source's twenty grams to twenty millilitres process card, compare it with a separate manufacturer's method, and measure real samples only under a trainer using the actual meter's documented procedure.\n\nUnder trainer observation, prepare an identified soil suspension with the mass, liquid volume, ratio basis and timing of one declared method; keep the source card's twenty grams + twenty millilitres worked example separate from a different manufacturer's protocol.\n\nCalibrate the actual meter with suitable buffers according to its manual, protect the electrode and buffers from contamination, place the sensing area correctly and wait for an accepted stable reading.\n\nMeasure and record the actual P H of samples A, B and C with sample and method identities, and recognize a failed calibration, unstable display or implausible result that requires a check or targeted repeat."), ("A student weighs 20 g soil from the source card, then adds 25 mL of the H I nine nine one two one example liquid and waits 15 minutes because both directions are visible.\n\nStop: 20 g:25 mL is neither the source card's 20 g:20 mL distilled-water preparation nor the maker's 10 g:25 mL H I seven zero five one method.\n\nSelect and write one approved protocol with its liquid, ratio basis and complete timing before preparation.\n\nIf the wrong mixture is already made, label it invalid for the intended comparison and prepare a fresh sample under trainer guidance.\n\nOne recorded result belongs to one complete method.", "A student weighs twenty grams soil from the source card, then adds twenty-five millilitres of the H I nine nine one two one example liquid and waits fifteen minutes because both directions are visible.\n\nStop: twenty grams:twenty-five millilitres is neither the source card's twenty grams:twenty millilitres distilled-water preparation nor the maker's ten grams:twenty-five millilitres H I seven zero five one method.\n\nSelect and write one approved protocol with its liquid, ratio basis and complete timing before preparation.\n\nIf the wrong mixture is already made, label it invalid for the intended comparison and prepare a fresh sample under trainer guidance.\n\nOne recorded result belongs to one complete method."), ('First sort three complete preparation cards without mixing values. For the source card, sequence PPE and sample ID, gentle crush, 2 mm sieve, 20 g soil, 20 mL distilled water, one-minute stir, 15-minute stand, manufacturer-directed buffer calibration, careful electrode placement, stable reading and recorded result. At an error screen, choose to stop and troubleshoot. Three blank A/B/C records require learner observations rather than the model key.\n\nTrainer records the real meter/probe/manual and approved site method. Each learner personally prepares the required sample, calibrates and checks the meter, measures A/B/C, records quality and result, rinses and stores the probe, and is observed against every applicable criterion. If the site method differs from the source card, keep the source card as a comparison and update the task sheet before scoring.', 'First sort three complete preparation cards without mixing values. For the source card, sequence P P E and sample I D, gentle crush, two millimetres sieve, twenty grams soil, twenty millilitres distilled water, one-minute stir, fifteen-minute stand, manufacturer-directed buffer calibration, careful electrode placement, stable reading and recorded result. At an error screen, choose to stop and troubleshoot. Three blank A/B/C records require learner observations rather than the model key.\n\nTrainer records the real meter/probe/manual and approved site method. Each learner personally prepares the required sample, calibrates and checks the meter, measures A/B/C, records quality and result, rinses and stores the probe, and is observed against every applicable criterion. If the site method differs from the source card, keep the source card as a comparison and update the task sheet before scoring.'), ('HI7051', 'H I seven zero five one'), ('HI99121', 'H I nine nine one two one'), ('The source key lists B near pH 6.8; a stable, checked meter reads the actual prepared B sample at 6.5.\n\nWrite 6.5 with sample ID, method, calibration and display resolution; do not replace it with the model key.\n\nAsk the trainer to check sample preparation, identity and a repeat or independent method if needed.\n\nInterpret the confirmed actual result for the chosen crop later; the target pH is not observation.\n\nMeasurements can differ from prepared targets; record evidence before interpretation.', 'The source key lists B near P H six point eight; a stable, checked meter reads the actual prepared B sample at six point five.\n\nWrite six point five with sample I D, method, calibration and display resolution; do not replace it with the model key.\n\nAsk the trainer to check sample preparation, identity and a repeat or independent method if needed.\n\nInterpret the confirmed actual result for the chosen crop later; the target P H is not observation.\n\nMeasurements can differ from prepared targets; record evidence before interpretation.'), ("soil suspension or slurry\n\nSoil mixed with a declared liquid by a declared mass-to-volume method for measurement.\n\none to one on a gram to millilitre basis\n\nIn the source card, 20 g soil mixed with 20 mL water; the units must stay with the ratio.\n\nbuffer\n\nA solution of known pH used to calibrate or check the meter, following the meter's accepted buffer set.\n\nelectrode junction\n\nThe reference contact that must be positioned and maintained according to the probe manual for a reliable reading.\n\nstability indicator\n\nThe meter's sign or site rule that a displayed value has settled sufficiently to record.\n\nquality check\n\nA documented test of whether the calibration, sample preparation and reading are fit for the intended purpose.", "soil suspension or slurry\n\nSoil mixed with a declared liquid by a declared mass-to-volume method for measurement.\n\none to one on a gram to millilitre basis\n\nIn the source card, twenty grams soil mixed with twenty millilitres water; the units must stay with the ratio.\n\nbuffer\n\nA solution of known P H used to calibrate or check the meter, following the meter's accepted buffer set.\n\nelectrode junction\n\nThe reference contact that must be positioned and maintained according to the probe manual for a reliable reading.\n\nstability indicator\n\nThe meter's sign or site rule that a displayed value has settled sufficiently to record.\n\nquality check\n\nA documented test of whether the calibration, sample preparation and reading are fit for the intended purpose."), ('ten grams dry soil passed through a two-millimetre sieve soil', 'ten grams of dry soil passed through a two-millimetre sieve'), ('two millimetres sieve', 'two-millimetre sieve'), ('two millimetres-sieved', 'soil passed through a two-millimetre sieve')], 'it': [('+', 'più'), ('1 min', 'un minuto'), ('1:1', 'uno a uno'), ('1:1 g:mL', 'uno a uno, grammi per millilitro'), ('1:2', 'uno a due'), ("3. L'esempio del produttore è volutamente diverso\n\nPercorso didattico documentato\n\nSuolo e liquido\n\nMescola / attendi\n\nUso in questa fase\n\nScheda originale\n\n20 g di suolo setacciato + 20 mL d'acqua distillata; uno a uno, grammi per millilitro\n\nMescola un minuto; attendi 15 min\n\nConserva tutti e nove i controlli originali come scenario; uso fisico solo dopo verifica del formatore e dello strumento reale\n\nQuadro generale del docente\n\nuno a uno oppure uno a due suolo:acqua, esempio 20 g:20 mL; specificare la base\n\nMescola un minuto; attendi 15–30 min\n\nPanoramica alternativa, non un comando da combinare con la scheda\n\nEsempio del manuale acca i nove nove uno due uno\n\n10 g di suolo secco setacciato a 2 mm + 25 mL di soluzione preparatoria acca i sette zero cinque uno\n\nMescola trenta secondi; attendi 5 min\n\nEsempio separato del produttore, mai sostituzione implicita della scheda originale", "tre. L'esempio del produttore è volutamente diverso\n\nPercorso didattico documentato\n\nSuolo e liquido\n\nMescola / attendi\n\nUso in questa fase\n\nScheda originale\n\nventi grammi di suolo setacciato + venti millilitri d'acqua distillata; uno a uno, grammi per millilitro\n\nMescola un minuto; attendi quindici minuti\n\nConserva tutti e nove i controlli originali come scenario; uso fisico solo dopo verifica del formatore e dello strumento reale\n\nQuadro generale del docente\n\nuno a uno oppure uno a due suolo:acqua, esempio venti grammi:venti millilitri; specificare la base\n\nMescola un minuto; attendi quindici a trenta minuti\n\nPanoramica alternativa, non un comando da combinare con la scheda\n\nEsempio del manuale acca i nove nove uno due uno\n\ndieci grammi di suolo secco setacciato a due millimetri + venticinque millilitri di soluzione preparatoria acca i sette zero cinque uno\n\nMescola trenta secondi; attendi cinque minuti\n\nEsempio separato del produttore, mai sostituzione implicita della scheda originale"), ('30 s', 'trenta secondi'), ('HI7051', 'acca i sette zero cinque uno'), ('HI99121', 'acca i nove nove uno due uno'), ("La chiave originale indica B intorno a pH 6.8; lo strumento controllato e stabile legge 6.5 nel campione B effettivamente preparato.\n\nScrivi 6.5 con ID campione, metodo, taratura e risoluzione del display; non sostituirlo con la chiave modello.\n\nChiedi al formatore di verificare preparazione, identità e, se serve, ripetizione o metodo indipendente.\n\nInterpreta poi il risultato effettivo confermato per la coltura scelta; il pH obiettivo non è un'osservazione.\n\nLe misure possono differire dai valori modello: registra le prove prima di interpretarle.", "La chiave originale indica B intorno a P H sei virgola otto; lo strumento controllato e stabile legge sei virgola cinque nel campione B effettivamente preparato.\n\nScrivi sei virgola cinque con I D campione, metodo, taratura e risoluzione del display; non sostituirlo con la chiave modello.\n\nChiedi al formatore di verificare preparazione, identità e, se serve, ripetizione o metodo indipendente.\n\nInterpreta poi il risultato effettivo confermato per la coltura scelta; il P H obiettivo non è un'osservazione.\n\nLe misure possono differire dai valori modello: registra le prove prima di interpretarle."), ("Prima separa tre schede di preparazione complete senza mescolare valori. Per la scheda originale, ordina protezioni e ID, rottura delicata, setaccio 2 mm, 20 g di suolo, 20 mL d'acqua distillata, mescolamento di un minuto, riposo di 15 minuti, taratura con tamponi secondo il produttore, collocazione accurata dell'elettrodo, lettura stabile e registrazione. Davanti a un errore, scegli di fermarti e cercarne la causa. Tre righe vuote A/B/C richiedono osservazioni dell'allievo, non la chiave modello.\n\nIl formatore registra strumento, sonda, manuale e metodo locale approvato. Ciascun allievo prepara personalmente il campione richiesto, tara e controlla lo strumento, misura A/B/C, registra qualità e risultato, risciacqua e conserva la sonda ed è osservato su tutti i criteri applicabili. Se il metodo locale differisce dalla scheda originale, quest'ultima resta un confronto e la scheda pratica si aggiorna prima di assegnare un esito.", "Prima separa tre schede di preparazione complete senza mescolare valori. Per la scheda originale, ordina protezioni e I D, rottura delicata, setaccio due millimetri, venti grammi di suolo, venti millilitri d'acqua distillata, mescolamento di un minuto, riposo di quindici minuti, taratura con tamponi secondo il produttore, collocazione accurata dell'elettrodo, lettura stabile e registrazione. Davanti a un errore, scegli di fermarti e cercarne la causa. Tre righe vuote A/B/C richiedono osservazioni dell'allievo, non la chiave modello.\n\nIl formatore registra strumento, sonda, manuale e metodo locale approvato. Ciascun allievo prepara personalmente il campione richiesto, tara e controlla lo strumento, misura A/B/C, registra qualità e risultato, risciacqua e conserva la sonda ed è osservato su tutti i criteri applicabili. Se il metodo locale differisce dalla scheda originale, quest'ultima resta un confronto e la scheda pratica si aggiorna prima di assegnare un esito."), ("Un numero sul display è utile solo se si conoscono campione, preparazione, taratura e stabilità della lettura. Eserciterai la scheda originale da 20 g di suolo e 20 mL d'acqua, la confronterai con un metodo diverso del produttore e misurerai campioni reali soltanto con il formatore, secondo la procedura documentata dello strumento effettivo.\n\nSotto osservazione del formatore, preparare una sospensione di suolo identificata, rispettando massa, volume del liquido, base del rapporto e tempi di un unico metodo dichiarato; tenere distinto l'esempio originale 20 g + 20 mL dal diverso protocollo del produttore.\n\nTarare lo strumento effettivo con tamponi adatti secondo il suo manuale, evitare contaminazioni di elettrodo e tamponi, collocare correttamente la parte sensibile e attendere una lettura stabile accettata.\n\nMisurare e registrare il pH effettivo dei campioni A, B e C con identità del campione e del metodo; riconoscere una taratura fallita, un display instabile o un risultato implausibile che richiede controllo o ripetizione mirata.", "Un numero sul display è utile solo se si conoscono campione, preparazione, taratura e stabilità della lettura. Eserciterai la scheda originale da venti grammi di suolo e venti millilitri d'acqua, la confronterai con un metodo diverso del produttore e misurerai campioni reali soltanto con il formatore, secondo la procedura documentata dello strumento effettivo.\n\nSotto osservazione del formatore, preparare una sospensione di suolo identificata, rispettando massa, volume del liquido, base del rapporto e tempi di un unico metodo dichiarato; tenere distinto l'esempio originale venti grammi + venti millilitri dal diverso protocollo del produttore.\n\nTarare lo strumento effettivo con tamponi adatti secondo il suo manuale, evitare contaminazioni di elettrodo e tamponi, collocare correttamente la parte sensibile e attendere una lettura stabile accettata.\n\nMisurare e registrare il P H effettivo dei campioni A, B e C con identità del campione e del metodo; riconoscere una taratura fallita, un display instabile o un risultato implausibile che richiede controllo o ripetizione mirata."), ("Uno studente pesa 20 g di suolo dalla scheda originale, aggiunge 25 mL del liquido dell'esempio acca i nove nove uno due uno e attende 15 minuti perché vede entrambe le istruzioni.\n\nFermati: 20 g:25 mL non sono né i 20 g:20 mL in acqua distillata della scheda né i 10 g:25 mL in acca i sette zero cinque uno del produttore.\n\nScegli e scrivi un solo protocollo approvato con liquido, base del rapporto e tempi completi prima di preparare.\n\nSe hai già ottenuto la miscela sbagliata, segnala che non è valida per il confronto previsto e prepara un campione nuovo con il formatore.\n\nOgni risultato registrato appartiene a un metodo completo.", "Uno studente pesa venti grammi di suolo dalla scheda originale, aggiunge venticinque millilitri del liquido dell'esempio acca i nove nove uno due uno e attende quindici minuti perché vede entrambe le istruzioni.\n\nFermati: venti grammi:venticinque millilitri non sono né i venti grammi:venti millilitri in acqua distillata della scheda né i dieci grammi:venticinque millilitri in acca i sette zero cinque uno del produttore.\n\nScegli e scrivi un solo protocollo approvato con liquido, base del rapporto e tempi completi prima di preparare.\n\nSe hai già ottenuto la miscela sbagliata, segnala che non è valida per il confronto previsto e prepara un campione nuovo con il formatore.\n\nOgni risultato registrato appartiene a un metodo completo."), ('attendi quindici a trenta minuti', 'attendi da quindici a trenta minuti'), ("sospensione o miscela di suolo\n\nSuolo mescolato con un liquido dichiarato in un rapporto massa:volume dichiarato per la misura.\n\nuno a uno, grammi per millilitro\n\nNella scheda originale, 20 g suolo con 20 mL acqua; le unità restano accanto al rapporto.\n\ntampone\n\nSoluzione a pH noto usata per tarare o verificare lo strumento secondo la serie accettata dal dispositivo.\n\ngiunzione dell'elettrodo\n\nContatto di riferimento da posizionare e mantenere secondo il manuale della sonda per una lettura affidabile.\n\nindicatore di stabilità\n\nSegnale dello strumento o regola della sede che indica un valore sufficientemente stabilizzato per registrarlo.\n\ncontrollo di qualità\n\nVerifica documentata che taratura, preparazione e lettura siano idonee allo scopo previsto.", "sospensione o miscela di suolo\n\nSuolo mescolato con un liquido dichiarato in un rapporto massa:volume dichiarato per la misura.\n\nuno a uno, grammi per millilitro\n\nNella scheda originale, venti grammi suolo con venti millilitri acqua; le unità restano accanto al rapporto.\n\ntampone\n\nSoluzione a P H noto usata per tarare o verificare lo strumento secondo la serie accettata dal dispositivo.\n\ngiunzione dell'elettrodo\n\nContatto di riferimento da posizionare e mantenere secondo il manuale della sonda per una lettura affidabile.\n\nindicatore di stabilità\n\nSegnale dello strumento o regola della sede che indica un valore sufficientemente stabilizzato per registrarlo.\n\ncontrollo di qualità\n\nVerifica documentata che taratura, preparazione e lettura siano idonee allo scopo previsto.")], 'de': [('+', 'plus'), ('1 min', 'eine Minute'), ('1:1', 'eins zu eins'), ('1:1 g:mL', 'eins zu eins, Gramm zu Milliliter'), ('1:2', 'eins zu zwei'), ('3. Das Herstellerbeispiel ist absichtlich anders\n\nDokumentierter Lernweg\n\nBoden und Flüssigkeit\n\nMischen / warten\n\nEinsatz in diesem Schritt\n\nUrsprüngliche Arbeitskarte\n\n20 g gesiebter Boden + 20 mL destilliertes Wasser; eins zu eins, Gramm zu Milliliter\n\neine Minute rühren; 15 min stehen lassen\n\nAlle neun Originalprüfpunkte als Szenario erhalten; praktische Nutzung erst nach Prüfung mit Lehrkraft und tatsächlichem Gerät\n\nLehrerüberblick\n\neins zu eins oder eins zu zwei Boden:Wasser, Beispiel 20 g:20 mL; Bezugsgrößen angeben\n\neine Minute rühren; 15–30 min stehen lassen\n\nAlternativer Überblick, kein zweiter Befehl zum Kombinieren mit der Karte\n\nBeispiel Ha I neun neun eins zwei eins-Handbuch\n\n10 g trockener, auf 2 mm gesiebter Boden + 25 mL Ha I sieben null fünf eins-Vorbereitungslösung\n\ndreißig Sekunden mischen; 5 min stehen lassen\n\nGetrenntes Herstellerbeispiel, nie stillschweigender Ersatz für die Originalkarte', 'drei. Das Herstellerbeispiel ist absichtlich anders\n\nDokumentierter Lernweg\n\nBoden und Flüssigkeit\n\nMischen / warten\n\nEinsatz in diesem Schritt\n\nUrsprüngliche Arbeitskarte\n\nzwanzig Gramm gesiebter Boden + zwanzig Milliliter destilliertes Wasser; eins zu eins, Gramm zu Milliliter\n\neine Minute rühren; fünfzehn Minuten stehen lassen\n\nAlle neun Originalprüfpunkte als Szenario erhalten; praktische Nutzung erst nach Prüfung mit Lehrkraft und tatsächlichem Gerät\n\nLehrerüberblick\n\neins zu eins oder eins zu zwei Boden:Wasser, Beispiel zwanzig Gramm:zwanzig Milliliter; Bezugsgrößen angeben\n\neine Minute rühren; fünfzehn bis dreißig Minuten stehen lassen\n\nAlternativer Überblick, kein zweiter Befehl zum Kombinieren mit der Karte\n\nBeispiel Ha I neun neun eins zwei eins-Handbuch\n\nzehn Gramm trockener, auf zwei Millimeter gesiebter Boden + fünfundzwanzig Milliliter Ha I sieben null fünf eins-Vorbereitungslösung\n\ndreißig Sekunden mischen; fünf Minuten stehen lassen\n\nGetrenntes Herstellerbeispiel, nie stillschweigender Ersatz für die Originalkarte'), ('30 s', 'dreißig Sekunden'), ('Bodensuspension oder Bodenschlämme\n\nBoden, der für eine Messung nach einem angegebenen Masse-Volumen-Verfahren mit einer angegebenen Flüssigkeit gemischt ist.\n\neins zu eins, Gramm zu Milliliter\n\nAuf der Originalkarte 20 g Boden mit 20 mL Wasser; Einheiten müssen beim Verhältnis stehen.\n\nPufferlösung\n\nLösung bekannten pH-Werts zur Kalibrierung oder Prüfung nach dem vom Gerät akzeptierten Puffersatz.\n\nElektroden-Diaphragma\n\nReferenzkontakt, der nach Sondenhandbuch platziert und gepflegt werden muss, um zuverlässig zu messen.\n\nStabilitätsanzeige\n\nZeichen des Geräts oder Standortregel dafür, dass sich der Wert ausreichend zum Notieren stabilisiert hat.\n\nQualitätskontrolle\n\nDokumentierte Prüfung, ob Kalibrierung, Probenaufbereitung und Anzeige für den vorgesehenen Zweck geeignet sind.', 'Bodensuspension oder Bodenschlämme\n\nBoden, der für eine Messung nach einem angegebenen Masse-Volumen-Verfahren mit einer angegebenen Flüssigkeit gemischt ist.\n\neins zu eins, Gramm zu Milliliter\n\nAuf der Originalkarte zwanzig Gramm Boden mit zwanzig Milliliter Wasser; Einheiten müssen beim Verhältnis stehen.\n\nPufferlösung\n\nLösung bekannten P H-Werts zur Kalibrierung oder Prüfung nach dem vom Gerät akzeptierten Puffersatz.\n\nElektroden-Diaphragma\n\nReferenzkontakt, der nach Sondenhandbuch platziert und gepflegt werden muss, um zuverlässig zu messen.\n\nStabilitätsanzeige\n\nZeichen des Geräts oder Standortregel dafür, dass sich der Wert ausreichend zum Notieren stabilisiert hat.\n\nQualitätskontrolle\n\nDokumentierte Prüfung, ob Kalibrierung, Probenaufbereitung und Anzeige für den vorgesehenen Zweck geeignet sind.'), ('Der ursprüngliche Schlüssel nennt für B ungefähr pH 6.8; eine stabile, überprüfte Messung der tatsächlich vorbereiteten Probe B ergibt 6.5.\n\nTrage 6.5 mit Proben-ID, Verfahren, Kalibrierung und Anzeigeauflösung ein; ersetze es nicht durch die Modelllösung.\n\nBitte die Lehrkraft, Aufbereitung und Identität und gegebenenfalls eine Wiederholung oder unabhängige Methode zu prüfen.\n\nDeute später den bestätigten tatsächlichen Wert für die gewählte Kultur; ein Ziel-pH ist keine Beobachtung.\n\nMesswerte können von vorbereiteten Zielwerten abweichen: zuerst Belege erfassen, dann deuten.', 'Der ursprüngliche Schlüssel nennt für B ungefähr P H sechs Komma acht; eine stabile, überprüfte Messung der tatsächlich vorbereiteten Probe B ergibt sechs Komma fünf.\n\nTrage sechs Komma fünf mit Proben-I D, Verfahren, Kalibrierung und Anzeigeauflösung ein; ersetze es nicht durch die Modelllösung.\n\nBitte die Lehrkraft, Aufbereitung und Identität und gegebenenfalls eine Wiederholung oder unabhängige Methode zu prüfen.\n\nDeute später den bestätigten tatsächlichen Wert für die gewählte Kultur; ein Ziel-P H ist keine Beobachtung.\n\nMesswerte können von vorbereiteten Zielwerten abweichen: zuerst Belege erfassen, dann deuten.'), ('Eine Person wiegt 20 g Boden nach der Originalkarte ab, fügt aber 25 mL Flüssigkeit aus dem Ha I neun neun eins zwei eins-Beispiel hinzu und wartet 15 Minuten, weil beide Anweisungen sichtbar sind.\n\nStopp: 20 g:25 mL ist weder die Originalaufbereitung 20 g:20 mL mit destilliertem Wasser noch das Herstellerverfahren 10 g:25 mL mit Ha I sieben null fünf eins.\n\nWähle und dokumentiere vor der Aufbereitung ein einziges zugelassenes Protokoll mit Flüssigkeit, Verhältnis samt Einheiten und vollständigen Zeiten.\n\nIst die falsche Mischung schon hergestellt, kennzeichne sie als ungeeignet für den geplanten Vergleich und bereite mit der Lehrkraft eine neue Probe vor.\n\nEin erfasster Wert gehört zu genau einem vollständigen Verfahren.', 'Eine Person wiegt zwanzig Gramm Boden nach der Originalkarte ab, fügt aber fünfundzwanzig Milliliter Flüssigkeit aus dem Ha I neun neun eins zwei eins-Beispiel hinzu und wartet fünfzehn Minuten, weil beide Anweisungen sichtbar sind.\n\nStopp: zwanzig Gramm:fünfundzwanzig Milliliter ist weder die Originalaufbereitung zwanzig Gramm:zwanzig Milliliter mit destilliertem Wasser noch das Herstellerverfahren zehn Gramm:fünfundzwanzig Milliliter mit Ha I sieben null fünf eins.\n\nWähle und dokumentiere vor der Aufbereitung ein einziges zugelassenes Protokoll mit Flüssigkeit, Verhältnis samt Einheiten und vollständigen Zeiten.\n\nIst die falsche Mischung schon hergestellt, kennzeichne sie als ungeeignet für den geplanten Vergleich und bereite mit der Lehrkraft eine neue Probe vor.\n\nEin erfasster Wert gehört zu genau einem vollständigen Verfahren.'), ('Eine Zahl auf dem Display ist nur dann brauchbar, wenn Probe, Aufbereitung, Kalibrierung und stabiler Messwert bekannt sind. Du übst die ursprüngliche Arbeitskarte mit 20 g Boden und 20 mL Wasser, vergleichst sie mit einer getrennten Herstellermethode und misst echte Proben nur unter Anleitung mit dem dokumentierten Verfahren des tatsächlich verwendeten Geräts.\n\nUnter Beobachtung der Lehrkraft eine gekennzeichnete Bodensuspension mit Bodenmasse, Flüssigkeitsvolumen, Bezugsgrößen des Verhältnisses und Zeiten eines einzigen festgelegten Verfahrens herstellen; das Originalbeispiel 20 g + 20 mL vom abweichenden Herstellerprotokoll trennen.\n\nDas tatsächlich verwendete Gerät nach seinem Handbuch mit geeigneten Puffern kalibrieren, Elektrode und Puffer vor Verunreinigung schützen, den empfindlichen Teil korrekt platzieren und einen akzeptierten stabilen Wert abwarten.\n\nDen tatsächlichen pH-Wert der Proben A, B und C mit Proben- und Verfahrenskennung messen und dokumentieren; fehlgeschlagene Kalibrierung, instabile Anzeige oder unplausible Ergebnisse erkennen und gezielt prüfen oder wiederholen.', 'Eine Zahl auf dem Display ist nur dann brauchbar, wenn Probe, Aufbereitung, Kalibrierung und stabiler Messwert bekannt sind. Du übst die ursprüngliche Arbeitskarte mit zwanzig Gramm Boden und zwanzig Milliliter Wasser, vergleichst sie mit einer getrennten Herstellermethode und misst echte Proben nur unter Anleitung mit dem dokumentierten Verfahren des tatsächlich verwendeten Geräts.\n\nUnter Beobachtung der Lehrkraft eine gekennzeichnete Bodensuspension mit Bodenmasse, Flüssigkeitsvolumen, Bezugsgrößen des Verhältnisses und Zeiten eines einzigen festgelegten Verfahrens herstellen; das Originalbeispiel zwanzig Gramm + zwanzig Milliliter vom abweichenden Herstellerprotokoll trennen.\n\nDas tatsächlich verwendete Gerät nach seinem Handbuch mit geeigneten Puffern kalibrieren, Elektrode und Puffer vor Verunreinigung schützen, den empfindlichen Teil korrekt platzieren und einen akzeptierten stabilen Wert abwarten.\n\nDen tatsächlichen P H-Wert der Proben A, B und C mit Proben- und Verfahrenskennung messen und dokumentieren; fehlgeschlagene Kalibrierung, instabile Anzeige oder unplausible Ergebnisse erkennen und gezielt prüfen oder wiederholen.'), ('HI7051', 'Ha I sieben null fünf eins'), ('HI99121', 'Ha I neun neun eins zwei eins'), ('Sortiere zuerst drei vollständige Aufbereitungskarten, ohne Werte zu mischen. Ordne für die Originalkarte Schutz und Proben-ID, vorsichtiges Zerkleinern, 2-mm-Sieb, 20 g Boden, 20 mL destilliertes Wasser, eine Minute Rühren, 15 Minuten Stehen, herstellerkonforme Pufferkalibrierung, vorsichtiges Platzieren der Elektrode, stabile Anzeige und Ergebnisdokumentation. Wähle bei einem Fehlerbildschirm Anhalten und Fehlersuche. Drei leere A/B/C-Zeilen verlangen eigene Beobachtungen statt Modellschlüssel.\n\nDie Lehrkraft erfasst tatsächliches Gerät, Sonde, Handbuch und zugelassenes Standortverfahren. Jede Person bereitet die nötige Probe selbst vor, kalibriert und kontrolliert das Gerät, misst A/B/C, dokumentiert Qualität und Ergebnis, spült und lagert die Sonde und wird bei allen zutreffenden Kriterien beobachtet. Unterscheidet sich das Standortverfahren von der Originalkarte, bleibt diese ein Vergleich und der Praxisbogen wird vor der Bewertung angepasst.', 'Sortiere zuerst drei vollständige Aufbereitungskarten, ohne Werte zu mischen. Ordne für die Originalkarte Schutz und Proben-I D, vorsichtiges Zerkleinern, zwei-Millimeter-Sieb, zwanzig Gramm Boden, zwanzig Milliliter destilliertes Wasser, eine Minute Rühren, fünfzehn Minuten Stehen, herstellerkonforme Pufferkalibrierung, vorsichtiges Platzieren der Elektrode, stabile Anzeige und Ergebnisdokumentation. Wähle bei einem Fehlerbildschirm Anhalten und Fehlersuche. Drei leere A/B/C-Zeilen verlangen eigene Beobachtungen statt Modellschlüssel.\n\nDie Lehrkraft erfasst tatsächliches Gerät, Sonde, Handbuch und zugelassenes Standortverfahren. Jede Person bereitet die nötige Probe selbst vor, kalibriert und kontrolliert das Gerät, misst A/B/C, dokumentiert Qualität und Ergebnis, spült und lagert die Sonde und wird bei allen zutreffenden Kriterien beobachtet. Unterscheidet sich das Standortverfahren von der Originalkarte, bleibt diese ein Vergleich und der Praxisbogen wird vor der Bewertung angepasst.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s207-remainder-audio-20261023-r1'
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
