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
IDS = ('S2-11-ar-EG-opening-r1', 'S2-11-ar-EG-E01-r1', 'S2-11-ar-EG-E02-r1', 'S2-11-ar-EG-E03-r1', 'S2-11-ar-EG-E04-r1', 'S2-11-ar-EG-guided-practice-r1', 'S2-11-ar-EG-reflection-r1', 'S2-11-ar-EG-comparison-r1', 'S2-11-ar-EG-glossary-r1', 'S2-11-en-opening-r1', 'S2-11-en-E01-r1', 'S2-11-en-E02-r1', 'S2-11-en-E03-r1', 'S2-11-en-E04-r1', 'S2-11-en-guided-practice-r1', 'S2-11-en-reflection-r1', 'S2-11-en-comparison-r1', 'S2-11-en-glossary-r1', 'S2-11-it-opening-r1', 'S2-11-it-E01-r1', 'S2-11-it-E02-r1', 'S2-11-it-E03-r1', 'S2-11-it-E04-r1', 'S2-11-it-guided-practice-r1', 'S2-11-it-reflection-r1', 'S2-11-it-comparison-r1', 'S2-11-it-glossary-r1', 'S2-11-de-opening-r1', 'S2-11-de-E01-r1', 'S2-11-de-E02-r1', 'S2-11-de-E03-r1', 'S2-11-de-E04-r1', 'S2-11-de-guided-practice-r1', 'S2-11-de-reflection-r1', 'S2-11-de-comparison-r1', 'S2-11-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S211_REMAINDER_36_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-11')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(36,36,36,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s211-remainder-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening', 'E01', 'E02', 'E03', 'E04', 'guided-practice', 'reflection', 'comparison', 'glossary']
        voice='Charon'if group in['E01', 'E03', 'reflection', 'glossary']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E01': ['/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1', '/glossary/6/0', '/glossary/6/1']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('برطمان تدريب اتفككت تكتلاته كويس اتحط على سطح مستوٍ. طالب كتب إن أول طبقة تحت هي الطين لأنه «تقيل».\n\nفي تقسيم الأحجام المعلن، حبيبات الرمل أكبر وغالبًا بتنزل أسرع في السائل ده، فتظهر أول طبقة معدنية عند القاع.\n\nالسلت عادة ييجي بعده والطين الناعم يفضل معلق مدة أطول؛ التكتلات واختلاف الكثافة قد يغيّروا الترتيب البسيط.\n\nسجل حد الرمل الظاهر فعلًا في الموعد المحدد بدل افتراض خط مثالي.\n\nفي برطمان التدريب، المتوقع الرمل أولًا مع مراعاة الطريقة والمشاهدة الحقيقية.', 'برطمان تدريب اتفككت تكتلاته كويس اتحط على سطح مستوي. طالب كتب إن أول طبقة تحت هي الطين لأنه «تقيل».\n\nفي تقسيم الأحجام المعلن، حبيبات الرمل أكبر وغالبًا بتنزل أسرع في السائل ده، فتظهر أول طبقة معدنية عند القاع.\n\nالسلت عادة ييجي بعده والطين الناعم يفضل معلق مدة أطول؛ التكتلات واختلاف الكثافة قد يغيّروا الترتيب البسيط.\n\nسجل حد الرمل الظاهر فعلًا في الموعد المحدد بدل افتراض خط مثالي.\n\nفي برطمان التدريب، المتوقع الرمل أولًا مع مراعاة الطريقة والمشاهدة الحقيقية.'), ('بعد وقت الانتظار المعلن، برطمان لسه عكر، وطالب عايز يخمن خط الطين من برطمان جنبه.\n\nراجع اسم العينة وسجل الرجّ ومادة التفكيك، واستعمل إضاءة جانبية آمنة من غير تحريك البرطمان.\n\nاكتب إن الحد غير واضح، وسجل الوقت والحالة؛ ما تنسخش خطًا أو رقمًا من عينة تانية.\n\nاسأل المدرّب هل الطريقة المختارة تتطلب ملاحظة لاحقة أو إعادة، ووثق القرار.\n\nعدم اليقين معلومة تسجلها، مش فراغ تخفيه.', 'بعد وقت الانتظار المعلن، برطمان لسه عكر، وطالب عايز يخمن خط الطين من برطمان جنبه.\n\nراجع اسم العينة وسجل الرجّ ومادة التفكيك، واستعمل إضاءة جانبية آمنة من غير تحريك البرطمان.\n\nاكتب إن الحد غير واضح، وسجل الوقت والحالة؛ ما تنسخش خط أو رقم من عينة تانية.\n\nاسأل المدرّب هل الطريقة المختارة تتطلب ملاحظة لاحقة أو إعادة، ووثق القرار.\n\nعدم اليقين معلومة تسجلها، مش فراغ تخفيه.'), ('خلي طريقتي المثال منفصلتين\n\nالعمودان مثالان تعليميان، مش إجرائين معمليين قابلين للتبديل ولا اختبارًا قياسيًا عامًا لقوام التربة.\n\nالعنصر\n\nمثال التمهيد\n\nسيناريو بطاقة الأداء المفصل\n\nقاعدة تقييم التطبيق\n\nكمية التربة\n\nنحو ثلث برطمان شفاف\n\nنحو نصف برطمان زجاج سعة 1 لتر\n\nالمدرّب يحدد طريقة قياس واحدة؛ ما تخلطش الكميتين\n\nالميه\n\nاملأ البرطمان مع ترك فراغ هواء\n\nلحد نحو تلاتة أرباع ارتفاع البرطمان\n\nسجل الحجم الفعلي أو العلامة المحددة\n\nمادة التفكيك\n\nمش محددة\n\nنحو معلقة شاي من سائل غسيل الأطباق\n\nسجل المنتج المسموح وكميته وطريقة استخدامه الآمنة\n\nالرجّ\n\nبضع دقائق\n\nرجّ قوي لمدة 10–15 دقيقة\n\nاتبع الطريقة الآمنة المختارة وسجل البداية والنهاية والأداء الفعلي\n\nتوقيت العلامات\n\nالرمل نحو دقيقة؛ السلت نحو ساعتين؛ الطين حتى 24–48 ساعة\n\nالرمل 1–2 دقيقة؛ السلت 2–4 ساعات؛ الطين 24–48 ساعة\n\nاتبع جدولًا واحدًا معلنًا وسجل أوقات الملاحظة الحقيقية', 'خلي طريقتي المثال منفصلتين\n\nالعمودان مثالان تعليميان، مش إجرائين معمليين قابلين للتبديل ولا اختبارًا قياسيًا عامًا لقوام التربة.\n\nالعنصر\n\nمثال التمهيد\n\nسيناريو بطاقة الأداء المفصل\n\nقاعدة تقييم التطبيق\n\nكمية التربة\n\nنحو ثلث برطمان شفاف\n\nنحو نصف برطمان زجاج سعة لتر واحد\n\nالمدرّب يحدد طريقة قياس واحدة؛ ما تخلطش الكميتين\n\nالميه\n\nاملأ البرطمان مع ترك فراغ هواء\n\nلحد نحو تلاتة أرباع ارتفاع البرطمان\n\nسجل الحجم الفعلي أو العلامة المحددة\n\nمادة التفكيك\n\nمش محددة\n\nنحو معلقة شاي من سائل غسيل الأطباق\n\nسجل المنتج المسموح وكميته وطريقة استخدامه الآمنة\n\nالرجّ\n\nبضع دقائق\n\nرجّ قوي لمدة عشر لخمستاشر دقيقة\n\nاتبع الطريقة الآمنة المختارة وسجل البداية والنهاية والأداء الفعلي\n\nتوقيت العلامات\n\nالرمل نحو دقيقة؛ السلت نحو ساعتين؛ الطين حتى أربعة وعشرين إلى تمانية وأربعين ساعة\n\nالرمل دقيقة لدقيقتين؛ السلت ساعتين لأربع ساعات؛ الطين أربعة وعشرين إلى تمانية وأربعين ساعة\n\nاتبع جدول واحد معلن وسجل أوقات الملاحظة الحقيقية'), ('على تلات بطاقات لعينات بأسماء، اختار كميات بطاقة الأداء المختارة، وتسلسل الغطاء والرجّ الآمن، وبطاقات ملاحظة الرمل والسلت والطين بأوقاتها. علم على ادعاء نتيجة نهائية بعد 20 دقيقة، وجزء عضوي طافٍ، وحد طبقة غير واضح. بيّن أي القياسات تخص برطمان المدرّب الجاهز وأيها تخص برطماناتك عبر المراحل.\n\nيتدرب على بطاقة المصدر من غير إسقاط بنودها، لكن معيار التطبيق يحتاج إشرافًا فرديًا وملاحظة متأخرة حقيقية.', 'على تلات بطاقات لعينات بأسماء، اختار كميات بطاقة الأداء المختارة، وتسلسل الغطاء والرجّ الآمن، وبطاقات ملاحظة الرمل والسلت والطين بأوقاتها. علم على ادعاء نتيجة نهائية بعد عشرين دقيقة، وجزء عضوي طافٍ، وحد طبقة غير واضح. بيّن أي القياسات تخص برطمان المدرّب الجاهز وأيها تخص برطماناتك عبر المراحل.\n\nيتدرب على بطاقة المصدر من غير إسقاط بنودها، لكن معيار التطبيق يحتاج إشراف فردي وملاحظة متأخرة حقيقية.'), ('قوام التربة\n\nنسب أحجام الحبيبات المعدنية من الرمل والسلت والطين بالوزن في جزء التربة الناعم الأقل من 2 mm، أو تقدير حقلي مؤهل للفئة المقابلة.\n\nالترسيب\n\nهبوط حبيبات معلقة في سائل تحت ظروف الطريقة المختارة.\n\nمادة تفكيك التكتلات\n\nمادة تحددها الطريقة لتفصل تكتلات التربة، فتترسب الحبيبات الدقيقة المفردة بشكل أنسب للمقارنة.\n\nالرمل\n\nحبيبات معدنية في تقسيم USDA بحجم نحو 0.05–2 mm.\n\nالسلت\n\nحبيبات معدنية في تقسيم USDA بحجم نحو 0.002–0.05 mm.\n\nالطين\n\nحبيبات معدنية في تقسيم USDA أصغر من 0.002 mm.\n\nالتربة اللومية\n\nفئة قوام حسب USDA تشمل نطاقًا من نسب الرمل والسلت والطين؛ مش حبيبة رابعة ولا خلطة أصص تجارية.', 'قوام التربة\n\nنسب أحجام الحبيبات المعدنية من الرمل والسلت والطين بالوزن في جزء التربة الناعم الأقل من اتنين ملليمتر، أو تقدير حقلي مؤهل للفئة المقابلة.\n\nالترسيب\n\nهبوط حبيبات معلقة في سائل تحت ظروف الطريقة المختارة.\n\nمادة تفكيك التكتلات\n\nمادة تحددها الطريقة لتفصل تكتلات التربة، فتترسب الحبيبات الدقيقة المفردة بشكل أنسب للمقارنة.\n\nالرمل\n\nحبيبات معدنية في تقسيم يو إس دي إيه بحجم نحو صفر فاصلة صفر خمسة إلى اتنين ملليمتر.\n\nالسلت\n\nحبيبات معدنية في تقسيم يو إس دي إيه بحجم نحو صفر فاصلة صفر صفر اتنين إلى صفر فاصلة صفر خمسة ملليمتر.\n\nالطين\n\nحبيبات معدنية في تقسيم يو إس دي إيه أصغر من صفر فاصلة صفر صفر اتنين ملليمتر.\n\nالتربة اللومية\n\nفئة قوام حسب يو إس دي إيه تشمل نطاقًا من نسب الرمل والسلت والطين؛ مش حبيبة رابعة ولا خلطة أصص تجارية.'), ('متدرب لمس دقيقًا ناعمًا واقترح يحطه في البرطمان كعينة سلت.\n\nالدقيق يقرب لك الإحساس الناعم، والسلت قد يشبه الدقيق وهو جاف ويبقى حريريًا وهو مبلول.\n\nلكن الدقيق مش سلتًا معدنيًا وقد يتصرف بشكل مختلف في الميه؛ استخدم عينة تربة عليها اسمها في التطبيق.\n\nتقدير القوام الحقلي يعتمد على ملمس حبيبات التربة وتصرفها وهي مبلولة وجدول مناسب.\n\nالتشبيه باللمس مش بديلًا عن العينة للتحليل.', 'متدرب لمس دقيق ناعم واقترح يحطه في البرطمان كعينة سلت.\n\nالدقيق يقرب لك الإحساس الناعم، والسلت قد يشبه الدقيق وهو جاف ويبقى حريري وهو مبلول.\n\nلكن الدقيق مش سلت معدني وقد يتصرف بشكل مختلف في الميه؛ استخدم عينة تربة عليها اسمها في التطبيق.\n\nتقدير القوام الحقلي يعتمد على ملمس حبيبات التربة وتصرفها وهي مبلولة وجدول مناسب.\n\nالتشبيه باللمس مش بديل عن العينة للتحليل.'), ('مجموعة رجّت برطمانها، استنت عشرين دقيقة، وبلغت بنسب دقيقة للرمل والسلت والطين في عينتها الجديدة.\n\nحد الطين الأخير قد يحتاج 24–48 ساعة في مثال التدريب المختار؛ الانتظار القصير ما يحددش الارتفاع الكلي للطبقات المعدنية.\n\nالمجموعة تسجل ملاحظة الرمل المبكرة، وتستخدم برطمان المدرّب المعرّف للتدرب على وضع المسطرة.\n\nيرجع كل طالب لبرطمانه المستقر بعدين ويكمل سجله فقط لما الحد المجدول يبان أو يكتب سبب عدم ظهوره.\n\nالبرطمان الجاهز يعلم المهارة، لكنه ما يعوضش دليل الطالب اللي يتسجل لاحقًا من عينته.', 'مجموعة رجّت برطمانها، استنت عشرين دقيقة، وبلغت بنسب دقيقة للرمل والسلت والطين في عينتها الجديدة.\n\nحد الطين الأخير قد يحتاج أربعة وعشرين إلى تمانية وأربعين ساعة في مثال التدريب المختار؛ الانتظار القصير ما يحددش الارتفاع الكلي للطبقات المعدنية.\n\nالمجموعة تسجل ملاحظة الرمل المبكرة، وتستخدم برطمان المدرّب المعرّف للتدرب على وضع المسطرة.\n\nيرجع كل طالب لبرطمانه المستقر بعدين ويكمل سجله فقط لما الحد المجدول يبان أو يكتب سبب عدم ظهوره.\n\nالبرطمان الجاهز يعلم المهارة، لكنه ما يعوضش دليل الطالب اللي يتسجل لاحقًا من عينته.')], 'en': [("A group shakes its jar, waits twenty minutes and reports exact sand, silt and clay percentages from its new sample.\n\nThe final clay boundary may need 24–48 hours in the selected classroom example; the short wait cannot establish the total mineral-layer height.\n\nThe group may record the early sand observation and use a labelled trainer-prepared jar to rehearse measurement.\n\nThey return to their own undisturbed jar later and complete its record only when the scheduled boundary is visible or state why it is not.\n\nA prepared example teaches the skill but cannot replace each learner's later evidence.", "A group shakes its jar, waits twenty minutes and reports exact sand, silt and clay percentages from its new sample.\n\nThe final clay boundary may need twenty-four to forty-eight hours in the selected classroom example; the short wait cannot establish the total mineral-layer height.\n\nThe group may record the early sand observation and use a labelled trainer-prepared jar to rehearse measurement.\n\nThey return to their own undisturbed jar later and complete its record only when the scheduled boundary is visible or state why it is not.\n\nA prepared example teaches the skill but cannot replace each learner's later evidence."), ('After the posted wait, one jar remains cloudy and a learner wants to guess the clay line from a neighbouring jar.\n\nCheck the ID, actual shaking and dispersant record, then use safe side lighting without moving the jar.\n\nWrite that the interface is unclear and note the time and condition; do not copy a line or value from another sample.\n\nAsk the trainer whether the selected procedure calls for a later observation or repeat, and document that decision.\n\nUncertainty is evidence to report, not a gap to hide.', 'After the posted wait, one jar remains cloudy and a learner wants to guess the clay line from a neighbouring jar.\n\nCheck the I D, actual shaking and dispersant record, then use safe side lighting without moving the jar.\n\nWrite that the interface is unclear and note the time and condition; do not copy a line or value from another sample.\n\nAsk the trainer whether the selected procedure calls for a later observation or repeat, and document that decision.\n\nUncertainty is evidence to report, not a gap to hide.'), ("For three labelled sample cards, choose the selected process-card quantities, safe lid/shaking sequence and the time-stamped sand, silt and clay observation cards. Flag one 20-minute 'final result', one floating organic fragment and one blurred interface. Explain which measurements belong to the trainer's pre-settled example versus your own staged jars.\n\nUses a source-preserving process-card rehearsal but requires individual supervision and real later observation for the practical criteria.", "For three labelled sample cards, choose the selected process-card quantities, safe lid/shaking sequence and the time-stamped sand, silt and clay observation cards. Flag one twenty-minute 'final result', one floating organic fragment and one blurred interface. Explain which measurements belong to the trainer's pre-settled example versus your own staged jars.\n\nUses a source-preserving process-card rehearsal but requires individual supervision and real later observation for the practical criteria."), ('Keep the two classroom protocols separate\n\nBoth columns describe teaching examples, not interchangeable laboratory SOPs or a universally valid quantitative texture test.\n\nComponent\n\nIntroductory example\n\nDetailed process-card scenario\n\nPhysical assessment rule\n\nSoil fill\n\nAbout one-third of a clear jar\n\nAbout half of a 1-litre glass jar\n\nTrainer declares one measured protocol; do not mix fills\n\nWater\n\nFill, leaving airspace\n\nFill to approximately three-quarters jar height\n\nRecord actual volume or declared mark\n\nDispersant\n\nNot specified\n\nAbout one teaspoon dishwashing liquid\n\nRecord approved actual product, amount and safe method\n\nShaking\n\nSeveral minutes\n\nVigorous 10–15 minutes\n\nUse selected safe method; record start/end and actual performance\n\nMarkers\n\nSand ~1 minute; silt ~2 hours; clay up to 24–48 hours\n\nSand 1–2 minutes; silt 2–4 hours; clay 24–48 hours\n\nFollow one posted timetable and log actual observation times', 'Keep the two classroom protocols separate\n\nBoth columns describe teaching examples, not interchangeable laboratory SOPs or a universally valid quantitative texture test.\n\nComponent\n\nIntroductory example\n\nDetailed process-card scenario\n\nPhysical assessment rule\n\nSoil fill\n\nAbout one-third of a clear jar\n\nAbout half of a one-litre glass jar\n\nTrainer declares one measured protocol; do not mix fills\n\nWater\n\nFill, leaving airspace\n\nFill to approximately three-quarters jar height\n\nRecord actual volume or declared mark\n\nDispersant\n\nNot specified\n\nAbout one teaspoon dishwashing liquid\n\nRecord approved actual product, amount and safe method\n\nShaking\n\nSeveral minutes\n\nVigorous ten to fifteen minutes\n\nUse selected safe method; record start/end and actual performance\n\nMarkers\n\nSand about one minute; silt about two hours; clay up to twenty-four to forty-eight hours\n\nSand one to two minutes; silt two to four hours; clay twenty-four to forty-eight hours\n\nFollow one posted timetable and log actual observation times'), ('soil texture\n\nThe proportions by weight of sand-, silt- and clay-sized mineral particles in the <2 mm fine-earth fraction, or a qualified field estimate of the corresponding class.\n\nsedimentation\n\nSettling of suspended particles in a liquid under the selected conditions.\n\ndispersant\n\nA method-specified material used to separate soil aggregates so individual fine particles can settle more consistently.\n\nsand\n\nUSDA mineral particle size about 0.05–2 mm.\n\nsilt\n\nUSDA mineral particle size about 0.002–0.05 mm.\n\nclay\n\nUSDA mineral particle size below 0.002 mm.\n\nloam\n\nA USDA texture class covering a range of sand, silt and clay proportions, not a fourth particle or commercial potting medium.', 'soil texture\n\nThe proportions by weight of sand-, silt- and clay-sized mineral particles in the less than two millimetres fine-earth fraction, or a qualified field estimate of the corresponding class.\n\nsedimentation\n\nSettling of suspended particles in a liquid under the selected conditions.\n\ndispersant\n\nA method-specified material used to separate soil aggregates so individual fine particles can settle more consistently.\n\nsand\n\nU S D A mineral particle size about zero point zero five to two millimetres.\n\nsilt\n\nU S D A mineral particle size about zero point zero zero two to zero point zero five millimetres.\n\nclay\n\nU S D A mineral particle size below zero point zero zero two millimetres.\n\nloam\n\nA U S D A texture class covering a range of sand, silt and clay proportions, not a fourth particle or commercial potting medium.')], 'it': [("Mantieni separati i due protocolli didattici\n\nEntrambe le colonne sono esempi didattici, non procedure standard di laboratorio intercambiabili né una prova tessiturale quantitativa universalmente valida.\n\nElemento\n\nEsempio introduttivo\n\nScenario dettagliato della scheda pratica\n\nRegola della valutazione pratica\n\nRiempimento con suolo\n\nCirca un terzo di un barattolo trasparente\n\nCirca metà di un barattolo di vetro da 1 litro\n\nIl formatore dichiara un unico procedimento misurato; non mescolare i riempimenti\n\nAcqua\n\nRiempire lasciando spazio d'aria\n\nFino a circa tre quarti dell'altezza del barattolo\n\nRegistrare volume effettivo o segno dichiarato\n\nDisperdente\n\nNon specificato\n\nCirca un cucchiaino di detersivo per piatti\n\nRegistrare prodotto approvato, quantità e uso sicuro\n\nAgitazione\n\nDiversi minuti\n\nVigorosa per 10–15 minuti\n\nUsare il metodo sicuro scelto e registrare inizio, fine ed esecuzione reale\n\nSegni\n\nSabbia ~1 minuto; limo ~2 ore; argilla fino a 24–48 ore\n\nSabbia 1–2 minuti; limo 2–4 ore; argilla 24–48 ore\n\nSeguire un calendario dichiarato e registrare gli orari reali", "Mantieni separati i due protocolli didattici\n\nEntrambe le colonne sono esempi didattici, non procedure standard di laboratorio intercambiabili né una prova tessiturale quantitativa universalmente valida.\n\nElemento\n\nEsempio introduttivo\n\nScenario dettagliato della scheda pratica\n\nRegola della valutazione pratica\n\nRiempimento con suolo\n\nCirca un terzo di un barattolo trasparente\n\nCirca metà di un barattolo di vetro da un litro\n\nIl formatore dichiara un unico procedimento misurato; non mescolare i riempimenti\n\nAcqua\n\nRiempire lasciando spazio d'aria\n\nFino a circa tre quarti dell'altezza del barattolo\n\nRegistrare volume effettivo o segno dichiarato\n\nDisperdente\n\nNon specificato\n\nCirca un cucchiaino di detersivo per piatti\n\nRegistrare prodotto approvato, quantità e uso sicuro\n\nAgitazione\n\nDiversi minuti\n\nVigorosa per un tempo compreso tra dieci e quindici minuti\n\nUsare il metodo sicuro scelto e registrare inizio, fine ed esecuzione reale\n\nSegni\n\nSabbia circa un minuto; limo circa due ore; argilla fino a un tempo compreso tra ventiquattro e quarantotto ore\n\nSabbia da uno a due minuti; limo da due a quattro ore; argilla da ventiquattro a quarantotto ore\n\nSeguire un calendario dichiarato e registrare gli orari reali"), ("Su tre schede di campioni identificati, scegli le quantità della scheda pratica selezionata, la sequenza sicura coperchio-agitazione e le schede di osservazione datate per sabbia, limo e argilla. Segnala un 'risultato finale' dopo 20 minuti, un frammento organico galleggiante e un'interfaccia sfumata. Spiega quali misure appartengono al barattolo dimostrativo già sedimentato e quali ai tuoi barattoli osservati in fasi.\n\nRiprende la scheda originale senza ometterne le righe, ma i criteri pratici richiedono supervisione individuale e vere osservazioni successive.", "Su tre schede di campioni identificati, scegli le quantità della scheda pratica selezionata, la sequenza sicura coperchio-agitazione e le schede di osservazione datate per sabbia, limo e argilla. Segnala un 'risultato finale' dopo venti minuti, un frammento organico galleggiante e un'interfaccia sfumata. Spiega quali misure appartengono al barattolo dimostrativo già sedimentato e quali ai tuoi barattoli osservati in fasi.\n\nRiprende la scheda originale senza ometterne le righe, ma i criteri pratici richiedono supervisione individuale e vere osservazioni successive."), ("Un gruppo agita il barattolo, attende venti minuti e comunica percentuali esatte di sabbia, limo e argilla del nuovo campione.\n\nIl confine finale dell'argilla può richiedere 24–48 ore nell'esempio scelto; la breve attesa non definisce l'altezza minerale totale.\n\nIl gruppo può registrare la prima osservazione della sabbia e usare un barattolo dimostrativo identificato per esercitarsi a misurare.\n\nPoi torna al proprio barattolo indisturbato e completa il registro solo quando il limite programmato è visibile oppure ne dichiara l'assenza.\n\nUn esempio preparato insegna la tecnica, ma non sostituisce la prova successiva di ogni studente.", "Un gruppo agita il barattolo, attende venti minuti e comunica percentuali esatte di sabbia, limo e argilla del nuovo campione.\n\nIl confine finale dell'argilla può richiedere da ventiquattro a quarantotto ore nell'esempio scelto; la breve attesa non definisce l'altezza minerale totale.\n\nIl gruppo può registrare la prima osservazione della sabbia e usare un barattolo dimostrativo identificato per esercitarsi a misurare.\n\nPoi torna al proprio barattolo indisturbato e completa il registro solo quando il limite programmato è visibile oppure ne dichiara l'assenza.\n\nUn esempio preparato insegna la tecnica, ma non sostituisce la prova successiva di ogni studente."), ('tessitura del suolo\n\nProporzioni in massa delle frazioni minerali sabbia, limo e argilla nella terra fine <2 mm, oppure stima di campo qualificata della classe corrispondente.\n\nsedimentazione\n\nDeposizione di particelle sospese in un liquido alle condizioni scelte.\n\ndisperdente\n\nMateriale previsto dal metodo per separare gli aggregati, così le particelle fini possono sedimentare con maggior coerenza.\n\nsabbia\n\nParticelle minerali USDA di circa 0.05–2 mm.\n\nlimo\n\nParticelle minerali USDA di circa 0.002–0.05 mm.\n\nargilla\n\nParticelle minerali USDA sotto 0.002 mm.\n\nsuolo franco\n\nClasse tessiturale USDA con un intervallo di proporzioni di sabbia, limo e argilla, non una quarta particella o un terriccio commerciale.', 'tessitura del suolo\n\nProporzioni in massa delle frazioni minerali sabbia, limo e argilla nella terra fine meno di due millimetri, oppure stima di campo qualificata della classe corrispondente.\n\nsedimentazione\n\nDeposizione di particelle sospese in un liquido alle condizioni scelte.\n\ndisperdente\n\nMateriale previsto dal metodo per separare gli aggregati, così le particelle fini possono sedimentare con maggior coerenza.\n\nsabbia\n\nParticelle minerali u esse di a con dimensioni circa da zero virgola zero cinque a due millimetri.\n\nlimo\n\nParticelle minerali u esse di a con dimensioni circa da zero virgola zero zero due a zero virgola zero cinque millimetri.\n\nargilla\n\nParticelle minerali u esse di a sotto zero virgola zero zero due millimetri.\n\nsuolo franco\n\nClasse tessiturale u esse di a con un intervallo di proporzioni di sabbia, limo e argilla, non una quarta particella o un terriccio commerciale.')], 'de': [('Bodentextur\n\nMassenanteile der mineralischen Sand-, Schluff- und Tongrößen in der <2-mm-Feinerde oder eine qualifizierte Feldschätzung der zugehörigen Klasse.\n\nSedimentation\n\nAbsetzen von in einer Flüssigkeit schwebenden Teilchen unter gewählten Bedingungen.\n\nDispergiermittel\n\nIm Verfahren festgelegter Stoff zur Trennung von Bodenaggregaten, damit feine Einzelteilchen gleichmäßiger sedimentieren können.\n\nSand\n\nUSDA-Mineralfraktion mit etwa 0.05–2 mm Größe.\n\nSchluff\n\nUSDA-Mineralfraktion mit etwa 0.002–0.05 mm Größe.\n\nTon\n\nUSDA-Mineralfraktion unter 0.002 mm Größe.\n\nLehm\n\nUSDA-Texturklasse mit einem Bereich von Sand-, Schluff- und Tonanteilen, keine vierte Teilchenart oder Blumenerde.', 'Bodentextur\n\nMassenanteile der mineralischen Sand-, Schluff- und Tongrößen in der Feinerdefraktion mit Teilchengrößen unter zwei Millimetern oder eine qualifizierte Feldschätzung der zugehörigen Klasse.\n\nSedimentation\n\nAbsetzen von in einer Flüssigkeit schwebenden Teilchen unter gewählten Bedingungen.\n\nDispergiermittel\n\nIm Verfahren festgelegter Stoff zur Trennung von Bodenaggregaten, damit feine Einzelteilchen gleichmäßiger sedimentieren können.\n\nSand\n\nU Es De A-Mineralfraktion mit etwa null Komma null fünf bis zwei Millimeter Größe.\n\nSchluff\n\nU Es De A-Mineralfraktion mit etwa null Komma null null zwei bis null Komma null fünf Millimeter Größe.\n\nTon\n\nU Es De A-Mineralfraktion unter null Komma null null zwei Millimeter Größe.\n\nLehm\n\nU Es De A-Texturklasse mit einem Bereich von Sand-, Schluff- und Tonanteilen, keine vierte Teilchenart oder Blumenerde.'), ('Eine Gruppe schüttelt ihr Glas, wartet zwanzig Minuten und meldet exakte Sand-, Schluff- und Tonprozente für die neue Probe.\n\nDie letzte Tongrenze kann im gewählten Unterrichtsbeispiel 24–48 Stunden benötigen; die kurze Wartezeit legt die gesamte Mineralhöhe nicht fest.\n\nDie Gruppe kann die frühe Sandbeobachtung notieren und an einem bezeichneten vorbereiteten Glas der Lehrkraft das Messen üben.\n\nSpäter kehren die Lernenden zu ihren ungestörten eigenen Gläsern zurück und schließen die Dokumentation erst mit sichtbarer geplanter Grenze ab oder benennen deren Fehlen.\n\nEin vorbereitetes Beispiel vermittelt die Technik, ersetzt aber keinen späteren eigenen Nachweis.', 'Eine Gruppe schüttelt ihr Glas, wartet zwanzig Minuten und meldet exakte Sand-, Schluff- und Tonprozente für die neue Probe.\n\nDie letzte Tongrenze kann im gewählten Unterrichtsbeispiel vierundzwanzig bis achtundvierzig Stunden benötigen; die kurze Wartezeit legt die gesamte Mineralhöhe nicht fest.\n\nDie Gruppe kann die frühe Sandbeobachtung notieren und an einem bezeichneten vorbereiteten Glas der Lehrkraft das Messen üben.\n\nSpäter kehren die Lernenden zu ihren ungestörten eigenen Gläsern zurück und schließen die Dokumentation erst mit sichtbarer geplanter Grenze ab oder benennen deren Fehlen.\n\nEin vorbereitetes Beispiel vermittelt die Technik, ersetzt aber keinen späteren eigenen Nachweis.'), ("Ordne für drei bezeichnete Probenkarten die Mengen der ausgewählten Prozesskarte, sichere Deckel- und Schüttelfolge sowie zeitgestempelte Sand-, Schluff- und Tonbeobachtungen zu. Markiere ein angeblich 'endgültiges Ergebnis' nach 20 Minuten, schwimmende organische Reste und einen verschwommenen Übergang. Erkläre, welche Messungen zum vorbereiteten Glas der Lehrkraft und welche zu deinen eigenen Gläsern gehören.\n\nÜbt mit der Quellkarte ohne ausgelassene Schritte; die praktische Bewertung erfordert individuelle Aufsicht und echte spätere Beobachtung.", "Ordne für drei bezeichnete Probenkarten die Mengen der ausgewählten Prozesskarte, sichere Deckel- und Schüttelfolge sowie zeitgestempelte Sand-, Schluff- und Tonbeobachtungen zu. Markiere ein angeblich 'endgültiges Ergebnis' nach zwanzig Minuten, schwimmende organische Reste und einen verschwommenen Übergang. Erkläre, welche Messungen zum vorbereiteten Glas der Lehrkraft und welche zu deinen eigenen Gläsern gehören.\n\nÜbt mit der Quellkarte ohne ausgelassene Schritte; die praktische Bewertung erfordert individuelle Aufsicht und echte spätere Beobachtung."), ('Zwei Lehrprotokolle getrennt halten\n\nBeide Spalten sind Lehrbeispiele, keine austauschbaren Laboranweisungen oder allgemein gültigen quantitativen Texturtests.\n\nElement\n\nEinführungsbeispiel\n\nAusführliches Prozesskarten-Szenario\n\nRegel für praktische Bewertung\n\nBodenfüllung\n\nEtwa ein Drittel eines durchsichtigen Glases\n\nEtwa die Hälfte eines 1-Liter-Glases\n\nLehrkraft legt ein Messverfahren fest; Füllmengen nicht mischen\n\nWasser\n\nAuffüllen und Luftraum lassen\n\nBis ungefähr drei Viertel der Glashöhe\n\nTatsächliches Volumen oder festgelegte Markierung erfassen\n\nDispergiermittel\n\nNicht angegeben\n\nUngefähr ein Teelöffel Geschirrspülmittel\n\nZugelassenes tatsächliches Produkt, Menge und sichere Anwendung erfassen\n\nSchütteln\n\nMehrere Minuten\n\nKräftig 10–15 Minuten\n\nAusgewählte sichere Methode nutzen; Anfang, Ende und tatsächliche Ausführung erfassen\n\nMarkierungen\n\nSand ~1 Minute; Schluff ~2 Stunden; Ton bis 24–48 Stunden\n\nSand 1–2 Minuten; Schluff 2–4 Stunden; Ton 24–48 Stunden\n\nEinen veröffentlichten Zeitplan befolgen und tatsächliche Beobachtungszeiten notieren', 'Zwei Lehrprotokolle getrennt halten\n\nBeide Spalten sind Lehrbeispiele, keine austauschbaren Laboranweisungen oder allgemein gültigen quantitativen Texturtests.\n\nElement\n\nEinführungsbeispiel\n\nAusführliches Prozesskarten-Szenario\n\nRegel für praktische Bewertung\n\nBodenfüllung\n\nEtwa ein Drittel eines durchsichtigen Glases\n\nEtwa die Hälfte eines Ein-Liter-Glases\n\nLehrkraft legt ein Messverfahren fest; Füllmengen nicht mischen\n\nWasser\n\nAuffüllen und Luftraum lassen\n\nBis ungefähr drei Viertel der Glashöhe\n\nTatsächliches Volumen oder festgelegte Markierung erfassen\n\nDispergiermittel\n\nNicht angegeben\n\nUngefähr ein Teelöffel Geschirrspülmittel\n\nZugelassenes tatsächliches Produkt, Menge und sichere Anwendung erfassen\n\nSchütteln\n\nMehrere Minuten\n\nKräftig zehn bis fünfzehn Minuten\n\nAusgewählte sichere Methode nutzen; Anfang, Ende und tatsächliche Ausführung erfassen\n\nMarkierungen\n\nSand etwa eine Minute; Schluff etwa zwei Stunden; Ton bis vierundzwanzig bis achtundvierzig Stunden\n\nSand eine bis zwei Minuten; Schluff zwei bis vier Stunden; Ton vierundzwanzig bis achtundvierzig Stunden\n\nEinen veröffentlichten Zeitplan befolgen und tatsächliche Beobachtungszeiten notieren')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s211-remainder-audio-20261023-r1'
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
