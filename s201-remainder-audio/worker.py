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
IDS = ('S2-01-ar-EG-opening-r1', 'S2-01-ar-EG-E01-r1', 'S2-01-ar-EG-E02-r1', 'S2-01-ar-EG-E03-r1', 'S2-01-ar-EG-guided-practice-r1', 'S2-01-ar-EG-reflection-r1', 'S2-01-ar-EG-comparison-r1', 'S2-01-ar-EG-glossary-r1', 'S2-01-ar-EG-model-and-workbook-guidance-r1', 'S2-01-ar-EG-knowledge-completion-r1', 'S2-01-en-opening-r1', 'S2-01-en-E01-r1', 'S2-01-en-E02-r1', 'S2-01-en-E03-r1', 'S2-01-en-guided-practice-r1', 'S2-01-en-reflection-r1', 'S2-01-en-comparison-r1', 'S2-01-en-glossary-r1', 'S2-01-en-model-and-workbook-guidance-r1', 'S2-01-en-knowledge-completion-r1', 'S2-01-it-opening-r1', 'S2-01-it-E01-r1', 'S2-01-it-E02-r1', 'S2-01-it-E03-r1', 'S2-01-it-guided-practice-r1', 'S2-01-it-reflection-r1', 'S2-01-it-comparison-r1', 'S2-01-it-glossary-r1', 'S2-01-it-model-and-workbook-guidance-r1', 'S2-01-it-knowledge-completion-r1', 'S2-01-de-opening-r1', 'S2-01-de-E01-r1', 'S2-01-de-E02-r1', 'S2-01-de-E03-r1', 'S2-01-de-guided-practice-r1', 'S2-01-de-reflection-r1', 'S2-01-de-comparison-r1', 'S2-01-de-glossary-r1', 'S2-01-de-model-and-workbook-guidance-r1', 'S2-01-de-knowledge-completion-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==40
    assert(req['scope'],req['stepId'])==('S201_FORTY_REMAINING_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-01')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(40,40,40,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s201-remainder-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==40
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(10))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['opening','E01','E02','E03','guided-practice','reflection','comparison','glossary','model-and-workbook-guidance','knowledge-completion']
        voice='Charon'if group in['E01','E03','reflection','glossary','knowledge-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'opening':('/intro','/goals/'),'E01':('/examples/0/',),'E02':('/examples/1/',),'E03':('/examples/2/',),'guided-practice':('/guidedPractice/prompt','/guidedPractice/learnerActions/','/guidedPractice/practicalBoundary'),'reflection':('/selfReflection/',),'comparison':('/comparisonLabel','/comparison/'),'glossary':('/glossary/',),'model-and-workbook-guidance':('/nutrientPractice/ui/','/studentDownloads/0/title'),'knowledge-completion':('/nutrientPractice/passChecks/',)}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [(' V ', ' حرف في '), ('0.10', 'عُشر'), ('0.5 kg', 'نص كيلوجرام'), ('10 دقايق', 'عشر دقايق'), ('10–10–10', 'عشرة، عشرة، عشرة'), ('3D', 'تلاتي الأبعاد'), ('45 دقيقة', 'خمسة وأربعين دقيقة'), ('5 kg', 'خمسة كيلوجرام'), ('أقدر أشرح وظيفة واحدة لكل من N وP وK، والأيونات الشائعة اللي بتمتصها الجذور، وسببًا يخلي عنصرًا موجودًا في التربة مش متاح؟ علّم اللي محتاج تراجعه قبل الخطوة الجاية.\n\nده تدريب فهم. انتقال العناصر بالتفصيل في الخطوة الجاية، وتشخيص العلامات في الخطوة التالتة من المحطة دي. مفيش اعتماد تشخيص حقلي أو تطبيق سماد هنا.', 'أقدر أشرح وظيفة واحدة لكل من إن وبي وكيه، والأيونات الشائعة اللي بتمتصها الجذور، وسببًا يخلي عنصرًا موجودًا في التربة مش متاح؟ علّم اللي محتاج تراجعه قبل الخطوة الجاية.\n\nده تدريب فهم. انتقال العناصر بالتفصيل في الخطوة الجاية، وتشخيص العلامات في الخطوة التالتة من المحطة دي. مفيش اعتماد تشخيص حقلي أو تطبيق سماد هنا.'), ('افهم دور النيتروجين والفوسفور والبوتاسيوم، إزاي يبقوا متاحين للجذور، وإزاي تقرأ أرقام بطاقة السماد من غير ما تغيّر معناها أو تعتبرها وصفة تسميد.\n\nتحدد N وP وK كعناصر معدنية كبرى أولية، وتطابق كل رمز باسمه وصور امتصاصه الشائعة، وتفرقهم عن باقي العناصر الأساسية.\n\nتشرح دورًا مفيدًا لكل من N وP وK بمثال، وحدود التشبيه، والفرق بين وجود العنصر في التربة وإتاحته للجذر.\n\nتقرأ 10–10–10 كنسب وزن N وP₂O₅ وK₂O وتحسب الكميات في كيس 5 kg من غير خلطها بجرعة أو كتلة P وK العنصريين.', 'افهم دور النيتروجين والفوسفور والبوتاسيوم، إزاي يبقوا متاحين للجذور، وإزاي تقرأ أرقام بطاقة السماد من غير ما تغيّر معناها أو تعتبرها وصفة تسميد.\n\nتحدد إن وبي وكيه كعناصر معدنية كبرى أولية، وتطابق كل رمز باسمه وصور امتصاصه الشائعة، وتفرقهم عن باقي العناصر الأساسية.\n\nتشرح دورًا مفيدًا لكل من إن وبي وكيه بمثال، وحدود التشبيه، والفرق بين وجود العنصر في التربة وإتاحته للجذر.\n\nتقرأ 10–10–10 كنسب وزن إن وبي اتنين أو خمسة وكيه اتنين أو وتحسب الكميات في كيس 5 kg من غير خلطها بجرعة أو كتلة بي وكيه العنصريين.'), ('الطالب يسمّي N وP وK ويطابق كل رمز وصورته الشائعة للامتصاص، ويميّز المجموعة الأولية عن C/H/O والعناصر المعدنية الكبرى الثانوية والصغرى.\n\nالاجتياز لما التصنيف والمطابقات كلها صح. عند الخطأ يراجع التفسير المناسب ثم يعيد المحاولة.\n\nيشرح دورًا مفيدًا لكل عنصر بمثال المرعى أو الذرة، ويذكر حدًا واحدًا على الأقل لتشبيه البيت أو الحامي، ويفرق بين وجود العنصر وإتاحته.\n\nالاجتياز بعد تبرير الأدوار التلاتة والمثال وحد التشبيه والفرق في الإتاحة. غير كده مراجعة موجهة ومحاولة جديدة.\n\nيفهم 10–10–10 كنسب وزن N وP₂O₅ وK₂O، ويحسب قيم كيس 5 kg، ويقول إن آخر قيمتين مش كتلتي P وK العنصريين ولا جرعة للحقل.\n\nالاجتياز بعد صحة الترتيب وأساس التعبير والحساب وتوضيح إنها مش جرعة، وإلا مراجعة موجهة ومحاولة جديدة.', 'الطالب يسمّي إن وبي وكيه ويطابق كل رمز وصورته الشائعة للامتصاص، ويميّز المجموعة الأولية عن سي/إتش/أو والعناصر المعدنية الكبرى الثانوية والصغرى.\n\nالاجتياز لما التصنيف والمطابقات كلها صح. عند الخطأ يراجع التفسير المناسب ثم يعيد المحاولة.\n\nيشرح دورًا مفيدًا لكل عنصر بمثال المرعى أو الذرة، ويذكر حدًا واحدًا على الأقل لتشبيه البيت أو الحامي، ويفرق بين وجود العنصر وإتاحته.\n\nالاجتياز بعد تبرير الأدوار التلاتة والمثال وحد التشبيه والفرق في الإتاحة. غير كده مراجعة موجهة ومحاولة جديدة.\n\nيفهم 10–10–10 كنسب وزن إن وبي اتنين أو خمسة وكيه اتنين أو، ويحسب قيم كيس 5 kg، ويقول إن آخر قيمتين مش كتلتي بي وكيه العنصريين ولا جرعة للحقل.\n\nالاجتياز بعد صحة الترتيب وأساس التعبير والحساب وتوضيح إنها مش جرعة، وإلا مراجعة موجهة ومحاولة جديدة.'), ('العناصر الغذائية الأساسية وقراءة بطاقة السماد\n\nالعنصر\n\nتسمية تساعدك تفتكر\n\nالأدوار الأساسية هنا\n\nصورة ذائبة شائعة يمتصها الجذر\n\nنيتروجين (N)\n\nمحرك النمو / دواسة البنزين\n\nنمو الورق والساق؛ بروتينات؛ كلوروفيل\n\nNO₃⁻ أو NH₄⁺\n\nفوسفور (P)\n\nمقوّي الجذور والإثمار؛ تشبيه الأساس والكهربا\n\nنقل الطاقة؛ نمو الجذور في المراحل الأولى؛ عمليات التزهير وتكوّن الثمار والبذور\n\nH₂PO₄⁻ أو HPO₄²⁻\n\nبوتاسيوم (K)\n\nالحامي أو المنظّم\n\nتنظيم مية النبات وعمل الثغور؛ قوة الساق\n\nK⁺', 'العناصر الغذائية الأساسية وقراءة بطاقة السماد\n\nالعنصر\n\nتسمية تساعدك تفتكر\n\nالأدوار الأساسية هنا\n\nصورة ذائبة شائعة يمتصها الجذر\n\nنيتروجين (إن)\n\nمحرك النمو / دواسة البنزين\n\nنمو الورق والساق؛ بروتينات؛ كلوروفيل\n\nإن أو تلاتة، بشحنة سالبة واحدة أو إن إتش أربعة، بشحنة موجبة واحدة\n\nفوسفور (بي)\n\nمقوّي الجذور والإثمار؛ تشبيه الأساس والكهربا\n\nنقل الطاقة؛ نمو الجذور في المراحل الأولى؛ عمليات التزهير وتكوّن الثمار والبذور\n\nإتش اتنين بي أو أربعة، بشحنة سالبة واحدة أو إتش بي أو أربعة، بشحنتين سالبتين\n\nبوتاسيوم (كيه)\n\nالحامي أو المنظّم\n\nتنظيم مية النبات وعمل الثغور؛ قوة الساق\n\nكيه، بشحنة موجبة واحدة'), ('تسع بطاقات في تلات مجموعات: أسماء العناصر، ووظائفها الرئيسية، وأمثلة لعلامات محتملة. طابقهم من غير مفتاح إجابة، وبرر اختياراتك، وبعدها راجع التعليق. خصص نحو 10 دقايق للمطابقة جوّه النشاط الأوسع 45 دقيقة؛ ومحطات التشخيص بتكمل في خطوة «قراءة علامات نقص العناصر من غير قفز للتشخيص».\n\nنيتروجين (N)\n\nفوسفور (P)\n\nبوتاسيوم (K)\n\nنمو الورق\n\nنمو الجذور المبكر\n\nدعم دفاعات النبات الطبيعية (المصدر قال مقاومة المرض؛ مش مناعة)\n\nاصفرار على شكل V في أوراق الذرة السفلية\n\nلون أرجواني في نبات صغير\n\nاصفرار حواف الأوراق القديمة\n\nده تدريب فهم. انتقال العناصر بالتفصيل في الخطوة الجاية، وتشخيص العلامات في الخطوة التالتة من المحطة دي. مفيش اعتماد تشخيص حقلي أو تطبيق سماد هنا.', 'تسع بطاقات في تلات مجموعات: أسماء العناصر، ووظائفها الرئيسية، وأمثلة لعلامات محتملة. طابقهم من غير مفتاح إجابة، وبرر اختياراتك، وبعدها راجع التعليق. خصص نحو 10 دقايق للمطابقة جوّه النشاط الأوسع 45 دقيقة؛ ومحطات التشخيص بتكمل في خطوة «قراءة علامات نقص العناصر من غير قفز للتشخيص».\n\nنيتروجين (إن)\n\nفوسفور (بي)\n\nبوتاسيوم (كيه)\n\nنمو الورق\n\nنمو الجذور المبكر\n\nدعم دفاعات النبات الطبيعية (المصدر قال مقاومة المرض؛ مش مناعة)\n\nاصفرار على شكل V في أوراق الذرة السفلية\n\nلون أرجواني في نبات صغير\n\nاصفرار حواف الأوراق القديمة\n\nده تدريب فهم. انتقال العناصر بالتفصيل في الخطوة الجاية، وتشخيص العلامات في الخطوة التالتة من المحطة دي. مفيش اعتماد تشخيص حقلي أو تطبيق سماد هنا.'), ('جزء من حقل ذرة حصل فيه رقاد بعد يوم عاصف. المزارع بيسأل هل لازم السبب نقص K؟\n\nوضح إن K يدعم تنظيم الميه وقوة الساق، فإتاحته احتمال يستحق الفحص.\n\nافحص شدة الرياح والصنف والمرض وباقي العناصر والإدارة، واستعن بالملاحظات وتحليل التربة قبل الحكم.\n\nعرض واحد ما يثبتش نقص عنصر واحد.', 'جزء من حقل ذرة حصل فيه رقاد بعد يوم عاصف. المزارع بيسأل هل لازم السبب نقص كيه؟\n\nوضح إن كيه يدعم تنظيم الميه وقوة الساق، فإتاحته احتمال يستحق الفحص.\n\nافحص شدة الرياح والصنف والمرض وباقي العناصر والإدارة، واستعن بالملاحظات وتحليل التربة قبل الحكم.\n\nعرض واحد ما يثبتش نقص عنصر واحد.'), ('حدًا واحدًا', 'حد واحد'), ('دورًا مفيدًا', 'دور مفيد'), ('سي/إتش/أو', 'سي، وإتش، وأو'), ('عرض تلاتي الأبعاد مش متاح؛ استخدم', 'لو عرض النموذج التلاتي الأبعاد مش متاح، استخدم'), ('على شكل حرف في في أوراق', 'على شكل حرف ڤي اللاتيني في أوراق'), ('عنصر غذائي أساسي\n\nعنصر النبات محتاجه عشان يكمل دورة حياته الطبيعية.\n\nعنصر معدني كبير\n\nعنصر معدني أساسي يحتاجه النبات بمقادير كبيرة نسبيًا؛ N وP وK أولية وCa وMg وS ثانوية.\n\nالإتاحة\n\nقدرة التربة على تزويد الجذر بعنصر في صورة قابلة للاستخدام وفي الوقت المطلوب.\n\nمحلول التربة\n\nميه في مسام التربة فيها مواد ذائبة، منها أيونات العناصر الغذائية.\n\nمكافئ أكسيد\n\nأساس متعارف عليه لكتابة P كمكافئ P₂O₅ وK كمكافئ K₂O على بطاقة السماد؛ مش معناه إن الجذر بيمتص الجزيئين دول بنفس الصورة.', 'عنصر غذائي أساسي\n\nعنصر النبات محتاجه عشان يكمل دورة حياته الطبيعية.\n\nعنصر معدني كبير\n\nعنصر معدني أساسي يحتاجه النبات بمقادير كبيرة نسبيًا؛ إن وبي وكيه أولية وسي إيه وإم جي وإس ثانوية.\n\nالإتاحة\n\nقدرة التربة على تزويد الجذر بعنصر في صورة قابلة للاستخدام وفي الوقت المطلوب.\n\nمحلول التربة\n\nميه في مسام التربة فيها مواد ذائبة، منها أيونات العناصر الغذائية.\n\nمكافئ أكسيد\n\nأساس متعارف عليه لكتابة بي كمكافئ بي اتنين أو خمسة وكيه كمكافئ كيه اتنين أو على بطاقة السماد؛ مش معناه إن الجذر بيمتص الجزيئين دول بنفس الصورة.'), ('كيس 5 kg مكتوب عليه 10–10–10.\n\nاحتفظ بالترتيب N–P₂O₅–K₂O.\n\nاضرب 5 kg في 0.10 لكل رقم: 0.5 kg N، و0.5 kg مكافئ P₂O₅، و0.5 kg مكافئ K₂O.\n\nما تسميش آخر كميتين 0.5 kg فوسفور وبوتاسيوم عنصريين.\n\nنفس الرقم ممكن يعبّر عن كميات محسوبة على أسس كيميائية مختلفة.', 'كيس 5 kg مكتوب عليه 10–10–10.\n\nاحتفظ بالترتيب إن–بي اتنين أو خمسة–كيه اتنين أو.\n\nاضرب 5 kg في 0.10 لكل رقم: 0.5 kg إن، و0.5 kg مكافئ بي اتنين أو خمسة، و0.5 kg مكافئ كيه اتنين أو.\n\nما تسميش آخر كميتين 0.5 kg فوسفور وبوتاسيوم عنصريين.\n\nنفس الرقم ممكن يعبّر عن كميات محسوبة على أسس كيميائية مختلفة.'), ('مسؤول مرعى عايز نموًا ورقيًا أخضر أكتر، وبيسأل أنهي عنصر من N وP وK مرتبط بيه مباشرة.\n\nاختار N واربطه بالكلوروفيل والبروتينات ونمو الورق.\n\nراجع تحليل التربة وبقية العوامل المحددة قبل اقتراح كمية. اللون الأخضر وحده مش تشخيص كامل.\n\nدور العنصر يوجه الفحص، مش يدي وصفة سماد تلقائية.', 'مسؤول مرعى عايز نموًا ورقيًا أخضر أكتر، وبيسأل أنهي عنصر من إن وبي وكيه مرتبط بيه مباشرة.\n\nاختار إن واربطه بالكلوروفيل والبروتينات ونمو الورق.\n\nراجع تحليل التربة وبقية العوامل المحددة قبل اقتراح كمية. اللون الأخضر وحده مش تشخيص كامل.\n\nدور العنصر يوجه الفحص، مش يدي وصفة سماد تلقائية.'), ('نموًا ورقيًا أخضر', 'نمو ورقي أخضر'), ('وسببًا يخلي عنصرًا موجودًا', 'وسبب يخلي عنصر موجود')], 'en': [('0.10', 'zero point one'), ('0.5 kg', 'zero point five kilograms'), ('10–10–10', 'ten, ten, ten'), ('3D', 'three dimensional'), ('5 kg', 'five kilograms'), ('A 5 kg bag carries a 10–10–10 label.\n\nKeep the sequence N–P₂O₅–K₂O.\n\nMultiply 5 kg by 0.10 for each listed measure: 0.5 kg N, 0.5 kg P₂O₅ equivalent and 0.5 kg K₂O equivalent.\n\nDo not call the latter two quantities 0.5 kg of elemental P and K.\n\nThe same numeral can refer to different chemical reporting bases.', 'A 5 kg bag carries a 10–10–10 label.\n\nKeep the sequence N–P two O five–K two O.\n\nMultiply 5 kg by 0.10 for each listed measure: 0.5 kg N, 0.5 kg P two O five equivalent and 0.5 kg K two O equivalent.\n\nDo not call the latter two quantities 0.5 kg of elemental P and K.\n\nThe same numeral can refer to different chemical reporting bases.'), ("A crop needs more than a bag marked N–P–K. Learn what these three letters stand for, what the nutrients do, how roots take them up, and what the numbers on a fertilizer label actually mean before making a field decision.\n\nDistinguish the three primary mineral macronutrients from other essential nutrients and match N, P and K with their names and common uptake forms.\n\nExplain the roles of N, P and K with an example, state where the simple analogies stop working, and distinguish a nutrient's presence in soil from its availability to roots.\n\nRead the weight percentages on an N–P₂O₅–K₂O label without treating the P₂O₅ and K₂O figures as percentages of elemental P and K.", "A crop needs more than a bag marked N–P–K. Learn what these three letters stand for, what the nutrients do, how roots take them up, and what the numbers on a fertilizer label actually mean before making a field decision.\n\nDistinguish the three primary mineral macronutrients from other essential nutrients and match N, P and K with their names and common uptake forms.\n\nExplain the roles of N, P and K with an example, state where the simple analogies stop working, and distinguish a nutrient's presence in soil from its availability to roots.\n\nRead the weight percentages on an N–P two O five–K two O label without treating the P two O five and K two O figures as percentages of elemental P and K."), ('A five kilograms bag', 'A five-kilogram bag'), ('Essential nutrients and fertilizer labels\n\nElement\n\nMemory aid\n\nMain roles taught here\n\nCommon dissolved uptake form\n\nNitrogen (N)\n\nGrower / accelerator\n\nLeaf and stem growth; proteins; chlorophyll\n\nNO₃⁻ or NH₄⁺\n\nPhosphorus (P)\n\nRooter & Fruiter; foundation / wiring analogy\n\nEnergy transfer; early root development; flowering, fruit and seed processes\n\nH₂PO₄⁻ or HPO₄²⁻\n\nPotassium (K)\n\nProtector / regulator\n\nWater and stomatal regulation; stem strength\n\nK⁺', 'Essential nutrients and fertilizer labels\n\nElement\n\nMemory aid\n\nMain roles taught here\n\nCommon dissolved uptake form\n\nNitrogen (N)\n\nGrower / accelerator\n\nLeaf and stem growth; proteins; chlorophyll\n\nN O three, with one negative charge or N H four, with one positive charge\n\nPhosphorus (P)\n\nRooter & Fruiter; foundation / wiring analogy\n\nEnergy transfer; early root development; flowering, fruit and seed processes\n\nH two P O four, with one negative charge or H P O four, with two negative charges\n\nPotassium (K)\n\nProtector / regulator\n\nWater and stomatal regulation; stem strength\n\nK, with one positive charge'), ('Learner names N, P and K and correctly matches each symbol and common uptake form; distinguishes this primary mineral group from C/H/O, secondary mineral macronutrients and micronutrients.\n\nPass only when every grouping and match is accurate; direct the learner to the relevant explanation for each error, then allow another attempt.\n\nLearner explains a useful role for each of N, P and K with the pasture or maize example; states at least one limit of the house/protector analogy and explains why nutrient presence in soil does not prove root availability.\n\nPass when all three roles, an example, an analogy limit and the availability distinction are justified accurately; otherwise targeted review and open retry.\n\nLearner interprets 10–10–10 as N–P₂O₅–K₂O weight percentages, calculates the three labelled measures for a 5 kg bag and states that the latter two are not elemental P/K masses or an application rate.\n\nPass only when order, reporting bases, arithmetic and non-dose interpretation are all correct; otherwise targeted review and open retry.', 'Learner names N, P and K and correctly matches each symbol and common uptake form; distinguishes this primary mineral group from C, H, O, secondary mineral macronutrients and micronutrients.\n\nPass only when every grouping and match is accurate; direct the learner to the relevant explanation for each error, then allow another attempt.\n\nLearner explains a useful role for each of N, P and K with the pasture or maize example; states at least one limit of the house/protector analogy and explains why nutrient presence in soil does not prove root availability.\n\nPass when all three roles, an example, an analogy limit and the availability distinction are justified accurately; otherwise targeted review and open retry.\n\nLearner interprets 10–10–10 as N–P two O five–K two O weight percentages, calculates the three labelled measures for a 5 kg bag and states that the latter two are not elemental P/K masses or an application rate.\n\nPass only when order, reporting bases, arithmetic and non-dose interpretation are all correct; otherwise targeted review and open retry.'), ('a five kilograms bag', 'a five-kilogram bag'), ('essential nutrient\n\nAn element a plant requires to complete its normal life cycle.\n\nmineral macronutrient\n\nAn essential mineral element required in comparatively large amounts; primary N/P/K and secondary Ca/Mg/S are distinct groups.\n\navailability\n\nThe extent to which a nutrient can be supplied to roots in a usable form at the needed time.\n\nsoil solution\n\nWater in soil pores containing dissolved substances, including nutrient ions.\n\noxide equivalent\n\nA standard fertilizer-label reporting basis for P as P₂O₅ and K as K₂O; not a claim that these are the exact molecules roots absorb.', 'essential nutrient\n\nAn element a plant requires to complete its normal life cycle.\n\nmineral macronutrient\n\nAn essential mineral element required in comparatively large amounts; primary N/P/K and secondary Ca/Mg/S are distinct groups.\n\navailability\n\nThe extent to which a nutrient can be supplied to roots in a usable form at the needed time.\n\nsoil solution\n\nWater in soil pores containing dissolved substances, including nutrient ions.\n\noxide equivalent\n\nA standard fertilizer-label reporting basis for P as P two O five and K as K two O; not a claim that these are the exact molecules roots absorb.'), ('three dimensional unavailable; use', 'If the three-dimensional view is unavailable, use')], 'it': [('0.10', 'zero virgola uno'), ('0.5 kg', 'zero virgola cinque chilogrammi'), ('10–10–10', 'dieci, dieci, dieci'), ('3D', 'tridimensionale'), ('5 kg', 'cinque chilogrammi'), ("Lo studente nomina N, P e K, associa simboli e comuni forme assorbite e distingue questo gruppo primario da C/H/O, macronutrienti minerali secondari e micronutrienti.\n\nSuperato solo con classificazione e associazioni corrette; per ogni errore, rileggere la spiegazione pertinente e riprovare.\n\nSpiega un ruolo utile per ciascuno dei tre elementi con l'esempio del pascolo o del mais; indica almeno un limite dell'analogia della casa o del protettore e distingue presenza nel suolo da disponibilità radicale.\n\nSuperato quando tutti e tre i ruoli, un esempio, un limite dell'analogia e la distinzione sulla disponibilità sono motivati correttamente; altrimenti revisione mirata e nuovo tentativo.\n\nInterpreta 10–10–10 come percentuali in peso di N, P₂O₅ e K₂O; calcola le tre quantità per 5 kg e precisa che le ultime due non sono masse di P/K elementari né dosi di campo.\n\nSuperato solo se ordine, basi di espressione, calcolo e distinzione dalla dose sono corretti; altrimenti revisione mirata e nuovo tentativo.", "Lo studente nomina N, P e K, associa simboli e comuni forme assorbite e distingue questo gruppo primario da C, H, O, macronutrienti minerali secondari e micronutrienti.\n\nSuperato solo con classificazione e associazioni corrette; per ogni errore, rileggere la spiegazione pertinente e riprovare.\n\nSpiega un ruolo utile per ciascuno dei tre elementi con l'esempio del pascolo o del mais; indica almeno un limite dell'analogia della casa o del protettore e distingue presenza nel suolo da disponibilità radicale.\n\nSuperato quando tutti e tre i ruoli, un esempio, un limite dell'analogia e la distinzione sulla disponibilità sono motivati correttamente; altrimenti revisione mirata e nuovo tentativo.\n\nInterpreta 10–10–10 come percentuali in peso di N, pi due o cinque e kappa due o; calcola le tre quantità per 5 kg e precisa che le ultime due non sono masse di P/K elementari né dosi di campo.\n\nSuperato solo se ordine, basi di espressione, calcolo e distinzione dalla dose sono corretti; altrimenti revisione mirata e nuovo tentativo."), ("Nutrienti essenziali e lettura dell'etichetta del fertilizzante\n\nElemento\n\nAiuto per ricordare\n\nRuoli principali qui\n\nComune forma disciolta assorbita\n\nAzoto (N)\n\nPromotore della crescita / acceleratore\n\nCrescita di foglie e fusti; proteine; clorofilla\n\nNO₃⁻ oppure NH₄⁺\n\nFosforo (P)\n\nRadici e frutti; analogia delle fondamenta e del cablaggio\n\nTrasferimento di energia; sviluppo iniziale delle radici; processi di fioritura e sviluppo di frutti e semi\n\nH₂PO₄⁻ oppure HPO₄²⁻\n\nPotassio (K)\n\nProtettore / regolatore\n\nRegolazione idrica e degli stomi; robustezza dei fusti\n\nK⁺", "Nutrienti essenziali e lettura dell'etichetta del fertilizzante\n\nElemento\n\nAiuto per ricordare\n\nRuoli principali qui\n\nComune forma disciolta assorbita\n\nAzoto (N)\n\nPromotore della crescita / acceleratore\n\nCrescita di foglie e fusti; proteine; clorofilla\n\nenne o tre, con una carica negativa oppure enne acca quattro, con una carica positiva\n\nFosforo (P)\n\nRadici e frutti; analogia delle fondamenta e del cablaggio\n\nTrasferimento di energia; sviluppo iniziale delle radici; processi di fioritura e sviluppo di frutti e semi\n\nacca due pi o quattro, con una carica negativa oppure acca pi o quattro, con due cariche negative\n\nPotassio (K)\n\nProtettore / regolatore\n\nRegolazione idrica e degli stomi; robustezza dei fusti\n\nkappa, con una carica positiva"), ('Scopri le funzioni di azoto, fosforo e potassio, quando sono disponibili alle radici e come leggere la sigla del fertilizzante senza trasformarla in una dose.\n\nRiconoscere N, P e K come macronutrienti minerali primari, abbinarli ai comuni ioni assorbiti e distinguerli dagli altri gruppi essenziali.\n\nSpiegare una funzione utile di ciascuno con un esempio, il limite delle analogie e la differenza fra presenza nel suolo e disponibilità per le radici.\n\nLeggere 10–10–10 come percentuali in peso di N, P₂O₅ e K₂O, calcolare i valori per 5 kg senza scambiarli per dose o masse di P/K elementari.', 'Scopri le funzioni di azoto, fosforo e potassio, quando sono disponibili alle radici e come leggere la sigla del fertilizzante senza trasformarla in una dose.\n\nRiconoscere N, P e K come macronutrienti minerali primari, abbinarli ai comuni ioni assorbiti e distinguerli dagli altri gruppi essenziali.\n\nSpiegare una funzione utile di ciascuno con un esempio, il limite delle analogie e la differenza fra presenza nel suolo e disponibilità per le radici.\n\nLeggere 10–10–10 come percentuali in peso di N, pi due o cinque e kappa due o, calcolare i valori per 5 kg senza scambiarli per dose o masse di P/K elementari.'), ("Un sacco da 5 kg riporta 10–10–10.\n\nMantieni l'ordine N–P₂O₅–K₂O.\n\nCalcola 5 kg × 0.10 per ciascun valore: 0.5 kg N, 0.5 kg equivalente P₂O₅ e 0.5 kg equivalente K₂O.\n\nNon chiamare le ultime due quantità 0.5 kg di P e K elementari.\n\nNumeri identici possono riferirsi a basi chimiche di espressione diverse.", "Un sacco da 5 kg riporta 10–10–10.\n\nMantieni l'ordine N–pi due o cinque–kappa due o.\n\nCalcola 5 kg × 0.10 per ciascun valore: 0.5 kg N, 0.5 kg equivalente pi due o cinque e 0.5 kg equivalente kappa due o.\n\nNon chiamare le ultime due quantità 0.5 kg di P e K elementari.\n\nNumeri identici possono riferirsi a basi chimiche di espressione diverse."), ("nutriente essenziale\n\nElemento necessario alla pianta per completare il normale ciclo vitale.\n\nmacronutriente minerale\n\nElemento minerale essenziale richiesto in quantità relativamente grandi; N/P/K primari e Ca/Mg/S secondari sono gruppi diversi.\n\ndisponibilità\n\nPossibilità che il nutriente raggiunga la radice in una forma utilizzabile al momento necessario.\n\nsoluzione del suolo\n\nAcqua dei pori del suolo che contiene sostanze disciolte, compresi ioni nutritivi.\n\nequivalente ossido\n\nBase convenzionale dell'etichetta che esprime P come P₂O₅ e K come K₂O; non indica le precise molecole assorbite dalla radice.", "nutriente essenziale\n\nElemento necessario alla pianta per completare il normale ciclo vitale.\n\nmacronutriente minerale\n\nElemento minerale essenziale richiesto in quantità relativamente grandi; N/P/K primari e Ca/Mg/S secondari sono gruppi diversi.\n\ndisponibilità\n\nPossibilità che il nutriente raggiunga la radice in una forma utilizzabile al momento necessario.\n\nsoluzione del suolo\n\nAcqua dei pori del suolo che contiene sostanze disciolte, compresi ioni nutritivi.\n\nequivalente ossido\n\nBase convenzionale dell'etichetta che esprime P come pi due o cinque e K come kappa due o; non indica le precise molecole assorbite dalla radice."), ('tridimensionale non disponibile; usa', 'Se la vista tridimensionale non è disponibile, usa'), ('×', 'per')], 'de': [('0.10', 'null Komma eins'), ('0.5 kg', 'null Komma fünf Kilogramm'), ('10–10–10', 'zehn, zehn, zehn'), ('3D', 'dreidimensionales'), ('5 kg', 'fünf Kilogramm'), ('Die lernende Person benennt N, P und K und ordnet Symbole sowie häufige Aufnahmeformen richtig zu; sie unterscheidet die primäre Gruppe von C/H/O, sekundären mineralischen Makronährstoffen und Mikronährstoffen.\n\nNur bei vollständig richtiger Einteilung und Zuordnung bestanden; bei Fehlern den jeweiligen Abschnitt gezielt wiederholen und erneut versuchen.\n\nSie erläutert für jedes Element eine sinnvolle Aufgabe am Beispiel von Weide oder Mais, nennt mindestens eine Grenze des Haus- oder Beschützervergleichs und trennt Bodenvorkommen von Wurzelverfügbarkeit.\n\nBestanden, wenn alle drei Aufgaben, ein Beispiel, eine Vergleichsgrenze und der Unterschied der Verfügbarkeit richtig begründet werden; sonst gezieltes Nacharbeiten und offener Wiederholungsversuch.\n\nSie versteht 10–10–10 als Massenprozente von N, P₂O₅ und K₂O, berechnet die deklarierten Werte für 5 kg und erklärt, dass die letzten zwei weder elementare P/K-Massen noch eine Feldmenge sind.\n\nNur bei richtiger Reihenfolge, Bezugsbasis, Rechnung und Abgrenzung von der Düngegabe bestanden; sonst gezielte Wiederholung und erneuter Versuch.', 'Die lernende Person benennt N, P und K und ordnet Symbole sowie häufige Aufnahmeformen richtig zu; sie unterscheidet die primäre Gruppe von C, H, O, sekundären mineralischen Makronährstoffen und Mikronährstoffen.\n\nNur bei vollständig richtiger Einteilung und Zuordnung bestanden; bei Fehlern den jeweiligen Abschnitt gezielt wiederholen und erneut versuchen.\n\nSie erläutert für jedes Element eine sinnvolle Aufgabe am Beispiel von Weide oder Mais, nennt mindestens eine Grenze des Haus- oder Beschützervergleichs und trennt Bodenvorkommen von Wurzelverfügbarkeit.\n\nBestanden, wenn alle drei Aufgaben, ein Beispiel, eine Vergleichsgrenze und der Unterschied der Verfügbarkeit richtig begründet werden; sonst gezieltes Nacharbeiten und offener Wiederholungsversuch.\n\nSie versteht 10–10–10 als Massenprozente von N, P zwei O fünf und K zwei O, berechnet die deklarierten Werte für 5 kg und erklärt, dass die letzten zwei weder elementare P/K-Massen noch eine Feldmenge sind.\n\nNur bei richtiger Reihenfolge, Bezugsbasis, Rechnung und Abgrenzung von der Düngegabe bestanden; sonst gezielte Wiederholung und erneuter Versuch.'), ('Ein Sack mit 5 kg trägt die Aufschrift 10–10–10.\n\nBehalte die Reihenfolge N–P₂O₅–K₂O bei.\n\nBerechne für jede Angabe 5 kg × 0.10: 0.5 kg N, 0.5 kg P₂O₅-Äquivalent und 0.5 kg K₂O-Äquivalent.\n\nBezeichne die letzten beiden Werte nicht als je 0.5 kg elementares P und K.\n\nGleiche Zahlen können sich auf unterschiedliche chemische Bezugsgrößen beziehen.', 'Ein Sack mit 5 kg trägt die Aufschrift 10–10–10.\n\nBehalte die Reihenfolge N–P zwei O fünf–K zwei O bei.\n\nBerechne für jede Angabe 5 kg × 0.10: 0.5 kg N, 0.5 kg P zwei O fünf-Äquivalent und 0.5 kg K zwei O-Äquivalent.\n\nBezeichne die letzten beiden Werte nicht als je 0.5 kg elementares P und K.\n\nGleiche Zahlen können sich auf unterschiedliche chemische Bezugsgrößen beziehen.'), ('Erkunde die Aufgaben von Stickstoff, Phosphor und Kalium, ihre Verfügbarkeit für Wurzeln und die Bedeutung einer NPK-Angabe, bevor du über eine Anwendung nachdenkst.\n\nN, P und K als primäre mineralische Makronährstoffe erkennen, ihre üblichen Aufnahmeformen zuordnen und sie von anderen essenziellen Elementgruppen abgrenzen.\n\nFür jedes Element eine Funktion mit Beispiel erläutern, Grenzen einfacher Vergleiche nennen und zwischen Vorkommen im Boden und Verfügbarkeit für die Wurzel unterscheiden.\n\n10–10–10 als Massenanteile von N, P₂O₅ und K₂O lesen, die deklarierten Mengen für 5 kg berechnen und weder elementare P/K-Massen noch eine Ausbringungsmenge daraus ableiten.', 'Erkunde die Aufgaben von Stickstoff, Phosphor und Kalium, ihre Verfügbarkeit für Wurzeln und die Bedeutung einer N P K-Angabe, bevor du über eine Anwendung nachdenkst.\n\nN, P und K als primäre mineralische Makronährstoffe erkennen, ihre üblichen Aufnahmeformen zuordnen und sie von anderen essenziellen Elementgruppen abgrenzen.\n\nFür jedes Element eine Funktion mit Beispiel erläutern, Grenzen einfacher Vergleiche nennen und zwischen Vorkommen im Boden und Verfügbarkeit für die Wurzel unterscheiden.\n\n10–10–10 als Massenanteile von N, P zwei O fünf und K zwei O lesen, die deklarierten Mengen für 5 kg berechnen und weder elementare P/K-Massen noch eine Ausbringungsmenge daraus ableiten.'), ('Essenzielle Nährstoffe und Düngemitteletiketten\n\nElement\n\nMerkhilfe\n\nHier vermittelte Hauptaufgaben\n\nHäufige gelöste Aufnahmeform\n\nStickstoff (N)\n\nWachstumstreiber / Gaspedal\n\nBlatt- und Sprosswachstum; Proteine; Chlorophyll\n\nNO₃⁻ oder NH₄⁺\n\nPhosphor (P)\n\nWurzeln und Früchte; Fundament-/Leitungsvergleich\n\nEnergietransfer; frühe Wurzelentwicklung; Vorgänge bei Blüten-, Frucht- und Samenbildung\n\nH₂PO₄⁻ oder HPO₄²⁻\n\nKalium (K)\n\nBeschützer / Regler\n\nWasser- und Spaltöffnungsregelung; Stängelfestigkeit\n\nK⁺', 'Essenzielle Nährstoffe und Düngemitteletiketten\n\nElement\n\nMerkhilfe\n\nHier vermittelte Hauptaufgaben\n\nHäufige gelöste Aufnahmeform\n\nStickstoff (N)\n\nWachstumstreiber / Gaspedal\n\nBlatt- und Sprosswachstum; Proteine; Chlorophyll\n\nN O drei, einfach negativ geladen oder N H vier, einfach positiv geladen\n\nPhosphor (P)\n\nWurzeln und Früchte; Fundament-/Leitungsvergleich\n\nEnergietransfer; frühe Wurzelentwicklung; Vorgänge bei Blüten-, Frucht- und Samenbildung\n\nH zwei P O vier, einfach negativ geladen oder H P O vier, zweifach negativ geladen\n\nKalium (K)\n\nBeschützer / Regler\n\nWasser- und Spaltöffnungsregelung; Stängelfestigkeit\n\nK, einfach positiv geladen'), ('Schritt3', 'Schritt drei'), ('dreidimensionales nicht verfügbar; gleichwertige Formel- und Auswahlfelder nutzen.', 'Wenn die dreidimensionale Ansicht nicht verfügbar ist, nutze gleichwertige Formel- und Auswahlfelder.'), ('dreidimensionales-Schema', 'dreidimensionales Schema'), ('essenzieller Nährstoff\n\nEin Element, das die Pflanze für ihren normalen Lebenszyklus benötigt.\n\nmineralischer Makronährstoff\n\nEssenzielles Mineral in vergleichsweise größerer Menge; primäre N/P/K und sekundäre Ca/Mg/S bilden verschiedene Gruppen.\n\nVerfügbarkeit\n\nWie gut ein Nährstoff die Wurzel zur richtigen Zeit in nutzbarer Form erreichen kann.\n\nBodenlösung\n\nWasser in den Bodenporen mit gelösten Stoffen, darunter Nährstoffionen.\n\nOxidäquivalent\n\nÜbliche Etikett-Basis: P als P₂O₅ und K als K₂O; keine Aussage, dass Wurzeln genau diese Moleküle aufnehmen.', 'essenzieller Nährstoff\n\nEin Element, das die Pflanze für ihren normalen Lebenszyklus benötigt.\n\nmineralischer Makronährstoff\n\nEssenzielles Mineral in vergleichsweise größerer Menge; primäre N/P/K und sekundäre Ca/Mg/S bilden verschiedene Gruppen.\n\nVerfügbarkeit\n\nWie gut ein Nährstoff die Wurzel zur richtigen Zeit in nutzbarer Form erreichen kann.\n\nBodenlösung\n\nWasser in den Bodenporen mit gelösten Stoffen, darunter Nährstoffionen.\n\nOxidäquivalent\n\nÜbliche Etikett-Basis: P als P zwei O fünf und K als K zwei O; keine Aussage, dass Wurzeln genau diese Moleküle aufnehmen.'), ('umfassenderen45-minütigen', 'umfassenderen fünfundvierzigminütigen'), ('×', 'mal')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s201-remainder-audio-20261023-r1'
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
    assert count < 10, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 40,'maximumCallsForLane':10,
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
    assert all(v<=10 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':10,'maximumBlindReviewPerLane':10,'maximumASRPerLane':10,'maximumTTSAggregate':40,'maximumBlindAggregate':40,'maximumASRAggregate':40,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
