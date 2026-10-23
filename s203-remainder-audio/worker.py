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
IDS = ('S2-03-ar-EG-opening-r1', 'S2-03-ar-EG-E01-r1', 'S2-03-ar-EG-E02-r1', 'S2-03-ar-EG-guided-practice-r1', 'S2-03-ar-EG-reflection-r1', 'S2-03-ar-EG-comparison-r1', 'S2-03-ar-EG-glossary-r1', 'S2-03-ar-EG-station-workflow-r1', 'S2-03-ar-EG-knowledge-completion-r1', 'S2-03-en-opening-r1', 'S2-03-en-E01-r1', 'S2-03-en-E02-r1', 'S2-03-en-guided-practice-r1', 'S2-03-en-reflection-r1', 'S2-03-en-comparison-r1', 'S2-03-en-glossary-r1', 'S2-03-en-station-workflow-r1', 'S2-03-en-knowledge-completion-r1', 'S2-03-it-opening-r1', 'S2-03-it-E01-r1', 'S2-03-it-E02-r1', 'S2-03-it-guided-practice-r1', 'S2-03-it-reflection-r1', 'S2-03-it-comparison-r1', 'S2-03-it-glossary-r1', 'S2-03-it-station-workflow-r1', 'S2-03-it-knowledge-completion-r1', 'S2-03-de-opening-r1', 'S2-03-de-E01-r1', 'S2-03-de-E02-r1', 'S2-03-de-guided-practice-r1', 'S2-03-de-reflection-r1', 'S2-03-de-comparison-r1', 'S2-03-de-glossary-r1', 'S2-03-de-station-workflow-r1', 'S2-03-de-knowledge-completion-r1')
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
    assert(req['scope'],req['stepId'])==('S203_THIRTY_SIX_REMAINING_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-03')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(36,36,36,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s203-remainder-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening','E01','E02','guided-practice','reflection','comparison','glossary','station-workflow','knowledge-completion']
        voice='Charon'if group in['E01','reflection','glossary','knowledge-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        allowedPrefixes={'opening':('/intro','/goals/'),'E01':('/examples/0/',),'E02':('/examples/1/',),'E03':('/examples/2/',),'guided-practice':('/guidedPractice/prompt','/guidedPractice/learnerActions/','/guidedPractice/practicalBoundary','/symptomPractice/cardSort/groupSize'),'reflection':('/selfReflection/',),'comparison':('/comparisonLabel','/comparison/'),'glossary':('/glossary/',),'station-workflow':('/symptomPractice/stations/','/symptomPractice/debrief/','/symptomPractice/exitTicket','/studentDownloads/0/title'),'knowledge-completion':('/symptomPractice/passChecks/',)}
        assert u['sourceBindings']and len({b['pointer']for b in u['sourceBindings']})==len(u['sourceBindings'])
        assert all(b['pointer'].startswith(allowedPrefixes[group])and not b['pointer'].endswith('/feedback')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [(' V ', ' حرف ڤي اللاتيني '), ('2–3 في النقاش', 'اتنين لتلاتة في النقاش'), ('3–5 صور', 'من تلات لخمس صور'), ('3–5 صور متحقَّق منها للمحصول والعرض، على الأقل N وP وK\n\nرقم المحطة\n\nالمحصول ومرحلة النمو\n\nوصف ظاهر مباشر\n\nمكان العلامة وعمر الورقة\n\nفرضية النقص المرجحة\n\nالتبرير وسبب بديل\n\nفحص حقلي أو معملي\n\nانتقل بين كل المحطات المتاحة. سجّل اللي شايفه قبل الفرضية. مفتاح الإجابات يفضل مخفيًا في المحاولة الأولى.\n\nقارن تفسيرات المجموعة بكل صورة، وناقش الأسباب البديلة وصحّح الخلط بين الأنماط. بعد كده جاوب سؤال الخروج لوحدك من غير ملاحظات.\n\nالحواف الخارجية لورق الذرة السفلي القديم صفرا، والنص أخضر أكتر. إيه أقوى فرضية مبدئية؟ وليه العلامة في الورق القديم؟ وإيه الفحص اللي تعمله بعدها؟\n\nورقة ملاحظة العلامات ومطابقة الكروت', '3–5 صور متحقَّق منها للمحصول والعرض، على الأقل إن وبي وكيه\n\nرقم المحطة\n\nالمحصول ومرحلة النمو\n\nوصف ظاهر مباشر\n\nمكان العلامة وعمر الورقة\n\nفرضية النقص المرجحة\n\nالتبرير وسبب بديل\n\nفحص حقلي أو معملي\n\nانتقل بين كل المحطات المتاحة. سجّل اللي شايفه قبل الفرضية. مفتاح الإجابات يفضل مخفيًا في المحاولة الأولى.\n\nقارن تفسيرات المجموعة بكل صورة، وناقش الأسباب البديلة وصحّح الخلط بين الأنماط. بعد كده جاوب سؤال الخروج لوحدك من غير ملاحظات.\n\nالحواف الخارجية لورق الذرة السفلي القديم صفرا، والنص أخضر أكتر. إيه أقوى فرضية مبدئية؟ وليه العلامة في الورق القديم؟ وإيه الفحص اللي تعمله بعدها؟\n\nورقة ملاحظة العلامات ومطابقة الكروت'), ('3–5 صور متحقَّق منها للمحصول والعرض، على الأقل إن وبي وكيه\n\nرقم المحطة\n\nالمحصول ومرحلة النمو\n\nوصف ظاهر مباشر\n\nمكان العلامة وعمر الورقة\n\nفرضية النقص المرجحة\n\nالتبرير وسبب بديل\n\nفحص حقلي أو معملي\n\nانتقل بين كل المحطات المتاحة. سجّل اللي شايفه قبل الفرضية. مفتاح الإجابات يفضل مخفيًا في المحاولة الأولى.\n\nقارن تفسيرات المجموعة بكل صورة، وناقش الأسباب البديلة وصحّح الخلط بين الأنماط. بعد كده جاوب سؤال الخروج لوحدك من غير ملاحظات.\n\nالحواف الخارجية لورق الذرة السفلي القديم صفرا، والنص أخضر أكتر. إيه أقوى فرضية مبدئية؟ وليه العلامة في الورق القديم؟ وإيه الفحص اللي تعمله بعدها؟\n\nورقة ملاحظة العلامات ومطابقة الكروت', 'وقت المحطات خمسة وعشرين دقيقة، ووقت المناقشة الختامية عشر دقايق.\n\n3–5 صور متحقَّق منها للمحصول والعرض، على الأقل إن وبي وكيه\n\nرقم المحطة\n\nالمحصول ومرحلة النمو\n\nوصف ظاهر مباشر\n\nمكان العلامة وعمر الورقة\n\nفرضية النقص المرجحة\n\nالتبرير وسبب بديل\n\nفحص حقلي أو معملي\n\nانتقل بين كل المحطات المتاحة. سجّل اللي شايفه قبل الفرضية. مفتاح الإجابات يفضل مخفيًا في المحاولة الأولى.\n\nقارن تفسيرات المجموعة بكل صورة، وناقش الأسباب البديلة وصحّح الخلط بين الأنماط. بعد كده جاوب سؤال الخروج لوحدك من غير ملاحظات.\n\nالحواف الخارجية لورق الذرة السفلي القديم صفرا، والنص أخضر أكتر. إيه أقوى فرضية مبدئية؟ وليه العلامة في الورق القديم؟ وإيه الفحص اللي تعمله بعدها؟\n\nورقة ملاحظة العلامات ومطابقة الكروت'), ('V أصفر', 'حرف ڤي اللاتيني أصفر'), ('إذا كان مفيدًا', 'لو كان مفيد'), ('إن/بي/كيه', 'إن وبي وكيه'), ('تبريرًا باسمه', 'تبرير باسمه'), ('سبب بديلًا مرتبطًا', 'سبب بديل مرتبط'), ('سبب بديلًا ممكنًا', 'سبب بديل ممكن'), ('سببًا', 'سبب'), ('قراءة علامات نقص العناصر من غير قفز للتشخيص\n\nنقص محتمل\n\nأول مكان مفيد للفحص\n\nعلامة ممكنة في الذرة\n\nليه لسه فيه شك؟\n\nN\n\nورقة قديمة وسفلية\n\nV أصفر من الطرف على العرق الوسطي؛ ممكن شحوب وتقزم\n\nالشحوب وضعف النمو ليهم أسباب تانية\n\nP\n\nغالبًا نبات صغير؛ الورق السفلي ممكن يبقى بنفسجي\n\nتقزم ولون أخضر غامق أو بنفسجي\n\nالبرد أو البلل أو مشكلة الجذر تحد من الامتصاص\n\nK\n\nورقة قديمة وسفلية\n\nاصفرار من الطرف للحواف الخارجية، والنص أخضر أكتر\n\nضغوط تانية ممكن تحرق الحواف\n\nMg (للتوسّع)\n\nورقة قديمة وسفلية\n\nشرائط اصفرار طولية بين العروق والعروق نفسها خضرا\n\nإصابة أو مشكلة عناصر تانية ممكن تشبهه', 'قراءة علامات نقص العناصر من غير قفز للتشخيص\n\nنقص محتمل\n\nأول مكان مفيد للفحص\n\nعلامة ممكنة في الذرة\n\nليه لسه فيه شك؟\n\nإن\n\nورقة قديمة وسفلية\n\nV أصفر من الطرف على العرق الوسطي؛ ممكن شحوب وتقزم\n\nالشحوب وضعف النمو ليهم أسباب تانية\n\nبي\n\nغالبًا نبات صغير؛ الورق السفلي ممكن يبقى بنفسجي\n\nتقزم ولون أخضر غامق أو بنفسجي\n\nالبرد أو البلل أو مشكلة الجذر تحد من الامتصاص\n\nكيه\n\nورقة قديمة وسفلية\n\nاصفرار من الطرف للحواف الخارجية، والنص أخضر أكتر\n\nضغوط تانية ممكن تحرق الحواف\n\nإم جي (للتوسّع)\n\nورقة قديمة وسفلية\n\nشرائط اصفرار طولية بين العروق والعروق نفسها خضرا\n\nإصابة أو مشكلة عناصر تانية ممكن تشبهه'), ('كل طالب يرتب البطاقات التسع في تلات مجموعات N/P/K ويبرر كل مطابقة، ويفرق على صور المحطات اللي اتراجعت بين اصفرار V في نص الورقة مع N، واصفرار الحواف مع K، واللون البنفسجي في الذرة الصغيرة مع P. شرائط الاصفرار بين العروق المرتبطة باحتمال نقص المغنيسيوم إثراء اختياري، مش شرط إضافي لاجتياز الأساسيات.\n\nالاجتياز بعد صحة وتبرير المجموعات التلاتة وأنماط الورق؛ الخطأ يقابله تعليق محدد ومحاولة مفتوحة.\n\nفي صورة واحدة على الأقل لكل من N وP وK، يفصل وصف الظاهر عن التفسير المرجح، ويكتب هل الورق قديم ولا جديد، ويقترح سببًا بديلًا مرتبطًا بالظروف أو الامتصاص.\n\nالاجتياز لما السجلات التلاتة تستند لعلامات ظاهرة ومعاها بديل مُبرر؛ اللون وحده أو تشخيص جازم لا يكفي.\n\nفي مثال ذرة بنفسجية بعد برد ومثال اصفرار الحواف، يشرح ظروف الحقل اللي هيفحصها ومتى يفيد تحليل تربة أو نسيج مأخوذ بطريقة تناسب المحصول والمرحلة.\n\nالاجتياز لما يوضح حدود الصورة وما يحددش نوع سماد أو جرعة منها؛ وإلا مراجعة ثم محاولة تانية.', 'كل طالب يرتب البطاقات التسع في تلات مجموعات إن/بي/كيه ويبرر كل مطابقة، ويفرق على صور المحطات اللي اتراجعت بين اصفرار V في نص الورقة مع إن، واصفرار الحواف مع كيه، واللون البنفسجي في الذرة الصغيرة مع بي. شرائط الاصفرار بين العروق المرتبطة باحتمال نقص المغنيسيوم إثراء اختياري، مش شرط إضافي لاجتياز الأساسيات.\n\nالاجتياز بعد صحة وتبرير المجموعات التلاتة وأنماط الورق؛ الخطأ يقابله تعليق محدد ومحاولة مفتوحة.\n\nفي صورة واحدة على الأقل لكل من إن وبي وكيه، يفصل وصف الظاهر عن التفسير المرجح، ويكتب هل الورق قديم ولا جديد، ويقترح سببًا بديلًا مرتبطًا بالظروف أو الامتصاص.\n\nالاجتياز لما السجلات التلاتة تستند لعلامات ظاهرة ومعاها بديل مُبرر؛ اللون وحده أو تشخيص جازم لا يكفي.\n\nفي مثال ذرة بنفسجية بعد برد ومثال اصفرار الحواف، يشرح ظروف الحقل اللي هيفحصها ومتى يفيد تحليل تربة أو نسيج مأخوذ بطريقة تناسب المحصول والمرحلة.\n\nالاجتياز لما يوضح حدود الصورة وما يحددش نوع سماد أو جرعة منها؛ وإلا مراجعة ثم محاولة تانية.'), ('كوّن تلات مجموعات، كل واحدة اسم ووظيفة وعرض. اشرح ليه طابقتهم وسبب يخلي اللون وحده مضللًا. ألوان فئات البطاقات تساعد الفرز لكن ما تكشفش المجموعة الصحيحة.\n\n2–3 في النقاش؛ كل طالب يسلم مطابقة وتبريرًا باسمه\n\nدي تفسيرات مبدئية لصور تعليمية. التبرير والأدلة الداعمة محتاجين مراجعة؛ مفيش اعتماد تشخيص حقلي أو جرعة سماد.', 'وقت ترتيب البطاقات عشر دقايق.\n\nكوّن تلات مجموعات، كل واحدة اسم ووظيفة وعرض. اشرح ليه طابقتهم وسبب يخلي اللون وحده مضللًا. ألوان فئات البطاقات تساعد الفرز لكن ما تكشفش المجموعة الصحيحة.\n\n2–3 في النقاش؛ كل طالب يسلم مطابقة وتبريرًا باسمه\n\nدي تفسيرات مبدئية لصور تعليمية. التبرير والأدلة الداعمة محتاجين مراجعة؛ مفيش اعتماد تشخيص حقلي أو جرعة سماد.'), ('مخفيًا', 'مخفي'), ('مضللًا', 'مضلل'), ('نباتات ذرة صغيرة ومتقزمة ولونها بنفسجي بعد أسبوع بارد ومبلول؛ حالة P في التربة لسه مش معروفة.\n\nقلة إمداد P احتمال يفسر الشكل، لكنه مش مثبت.\n\nالبرد والبلل وضعف نشاط الجذور ممكن يحدوا من امتصاص P حتى لو الموجود في التربة كفاية.\n\nافحص الجذور والجو، وفسّر تحليل P في التربة وتحليل النسيج المناسب إذا كان مفيدًا قبل العلاج.\n\nأي فرضية من الصورة لازم تصمد أمام تفسيرات بديلة.', 'نباتات ذرة صغيرة ومتقزمة ولونها بنفسجي بعد أسبوع بارد ومبلول؛ حالة بي في التربة لسه مش معروفة.\n\nقلة إمداد بي احتمال يفسر الشكل، لكنه مش مثبت.\n\nالبرد والبلل وضعف نشاط الجذور ممكن يحدوا من امتصاص بي حتى لو الموجود في التربة كفاية.\n\nافحص الجذور والجو، وفسّر تحليل بي في التربة وتحليل النسيج المناسب إذا كان مفيدًا قبل العلاج.\n\nأي فرضية من الصورة لازم تصمد أمام تفسيرات بديلة.'), ('ورقة ذرة سفلية اصفرّت. الاصفرار في النص، ولا على الحواف، ولا بين العروق؟ اوصف اللي شايفه فعلًا قبل ما تحدد السبب المحتمل. الصورة قرينة، مش تعليمات لإضافة سماد.\n\nطابق بطاقات أسماء ووظائف وأعراض N وP وK التسع مع تبريرك، وميّز بين V الأصفر في منتصف ورقة الذرة لنقص N المحتمل، واصفرار حوافها المحتمل مع K، واصفرار ما بين عروق الأوراق القديمة المحتمل مع Mg.\n\nفي كل محطة سجّل المحصول والجزء المصاب وعمر الورق ومكانه وشكل العلامة الظاهر قبل فرضية النقص، واذكر سببًا بديلًا ممكنًا.\n\nاختار ملاحظات الحقل وتحليل تربة أو نسيج مناسب للمحصول ومرحلة نموه لاختبار الفرضية، من غير جرعة سماد أو وصفة من صورة.', 'ورقة ذرة سفلية اصفرّت. الاصفرار في النص، ولا على الحواف، ولا بين العروق؟ اوصف اللي شايفه فعلًا قبل ما تحدد السبب المحتمل. الصورة قرينة، مش تعليمات لإضافة سماد.\n\nطابق بطاقات أسماء ووظائف وأعراض إن وبي وكيه التسع مع تبريرك، وميّز بين V الأصفر في منتصف ورقة الذرة لنقص إن المحتمل، واصفرار حوافها المحتمل مع كيه، واصفرار ما بين عروق الأوراق القديمة المحتمل مع إم جي.\n\nفي كل محطة سجّل المحصول والجزء المصاب وعمر الورق ومكانه وشكل العلامة الظاهر قبل فرضية النقص، واذكر سببًا بديلًا ممكنًا.\n\nاختار ملاحظات الحقل وتحليل تربة أو نسيج مناسب للمحصول ومرحلة نموه لاختبار الفرضية، من غير جرعة سماد أو وصفة من صورة.'), ('ورقة ذرة سفلية فيها حواف خارجية صفرا والنص أخضر أكتر. ورقة سفلية تانية فيها V أصفر ماشي مع العرق الوسطي.\n\nاوصف مسار الاصفرار وعمر الورقة في كل واحدة قبل تسمية العنصر.\n\nK فرضية أقوى للأولى وN للتانية. مجرد إن الاتنين في ورق قديم ما يفرقش بينهم.\n\nافحص تكرار النمط في الحقل والجذور والميه، واستعن بفحوص مناسبة قبل قرار الإدارة.\n\nمكان الاصفرار دليل مفيد، لكن ولا صورة بمفردها تشخيص كامل.', 'ورقة ذرة سفلية فيها حواف خارجية صفرا والنص أخضر أكتر. ورقة سفلية تانية فيها V أصفر ماشي مع العرق الوسطي.\n\nاوصف مسار الاصفرار وعمر الورقة في كل واحدة قبل تسمية العنصر.\n\nكيه فرضية أقوى للأولى وإن للتانية. مجرد إن الاتنين في ورق قديم ما يفرقش بينهم.\n\nافحص تكرار النمط في الحقل والجذور والميه، واستعن بفحوص مناسبة قبل قرار الإدارة.\n\nمكان الاصفرار دليل مفيد، لكن ولا صورة بمفردها تشخيص كامل.')], 'en': [('2–3; each learner', 'Groups of two to three; each learner'), ('3–5 verified', 'Three to five verified'), ('3–5 verified crop- and symptom-matched visuals; at least N, P and K\n\nstation number\n\ncrop and growth stage\n\ndirect observation\n\naffected position and leaf age\n\nlikely nutrient hypothesis\n\nreasoning and alternative\n\nfield or laboratory check\n\nRotate through each available station. Record observations before the hypothesis. Do not reveal an answer key during the first attempt.\n\nCompare group explanations with each image, discuss alternative causes and check the patterns. Then answer the exit ticket independently without notes.\n\nOlder lower maize leaves have yellow outer margins while the centre stays greener. What is the strongest provisional hypothesis, why are older leaves affected, and what would you check next?\n\nSymptom observation and card worksheet', 'The stations take twenty-five minutes, followed by ten minutes for the debrief.\n\n3–5 verified crop- and symptom-matched visuals; at least N, P and K\n\nstation number\n\ncrop and growth stage\n\ndirect observation\n\naffected position and leaf age\n\nlikely nutrient hypothesis\n\nreasoning and alternative\n\nfield or laboratory check\n\nRotate through each available station. Record observations before the hypothesis. Do not reveal an answer key during the first attempt.\n\nCompare group explanations with each image, discuss alternative causes and check the patterns. Then answer the exit ticket independently without notes.\n\nOlder lower maize leaves have yellow outer margins while the centre stays greener. What is the strongest provisional hypothesis, why are older leaves affected, and what would you check next?\n\nSymptom observation and card worksheet'), ('Build three name–function–symptom triples. Explain each match and one reason colour alone could mislead. Category colours may help sorting but must not encode the correct triple.\n\n2–3; each learner submits an individual match and reason\n\nThese are provisional interpretations of teaching images. Written reasons and corroborating evidence require review; no field diagnosis or fertilizer rate is certified.', 'The card sort takes ten minutes.\n\nBuild three name–function–symptom triples. Explain each match and one reason colour alone could mislead. Category colours may help sorting but must not encode the correct triple.\n\n2–3; each learner submits an individual match and reason\n\nThese are provisional interpretations of teaching images. Written reasons and corroborating evidence require review; no field diagnosis or fertilizer rate is certified.'), ('N/P/K', 'N, P and K')], 'it': [('2–3 per discutere', 'Discutete in gruppi di due o tre'), ('3–5 immagini', 'Da tre a cinque immagini'), ("3–5 immagini verificate per coltura e segno; almeno N, P e K\n\nnumero della stazione\n\ncoltura e fase\n\nosservazione diretta\n\nposizione e età della foglia\n\nipotesi nutritiva probabile\n\nmotivo e alternativa\n\nverifica in campo o in laboratorio\n\nPassa per tutte le stazioni disponibili. Registra prima ciò che osservi e solo dopo l'ipotesi. Non mostrare la soluzione al primo tentativo.\n\nConfronta le spiegazioni con ogni immagine, discuti le alternative e chiarisci i disegni. Poi rispondi individualmente alla domanda finale senza appunti.\n\nLe vecchie foglie basse del mais hanno margini gialli e centro più verde. Qual è l’ipotesi provvisoria più forte, perché riguarda le foglie vecchie e cosa verificheresti dopo?\n\nScheda osservazioni e carte", "Le stazioni durano venticinque minuti, seguite da dieci minuti di discussione finale.\n\n3–5 immagini verificate per coltura e segno; almeno N, P e K\n\nnumero della stazione\n\ncoltura e fase\n\nosservazione diretta\n\nposizione e età della foglia\n\nipotesi nutritiva probabile\n\nmotivo e alternativa\n\nverifica in campo o in laboratorio\n\nPassa per tutte le stazioni disponibili. Registra prima ciò che osservi e solo dopo l'ipotesi. Non mostrare la soluzione al primo tentativo.\n\nConfronta le spiegazioni con ogni immagine, discuti le alternative e chiarisci i disegni. Poi rispondi individualmente alla domanda finale senza appunti.\n\nLe vecchie foglie basse del mais hanno margini gialli e centro più verde. Qual è l’ipotesi provvisoria più forte, perché riguarda le foglie vecchie e cosa verificheresti dopo?\n\nScheda osservazioni e carte"), ('Forma tre terne nome–funzione–segno, spiega ogni scelta e perché il solo colore può trarre in inganno. I colori delle categorie possono aiutare a ordinare ma non devono rivelare le terne corrette.\n\n2–3 per discutere; ogni studente consegna abbinamenti e motivi personali\n\nInterpretazioni provvisorie di immagini didattiche. Motivazioni e riscontri richiedono revisione; nessuna diagnosi in campo o dose di concime certificata.', 'L’ordinamento delle carte dura dieci minuti.\n\nForma tre terne nome–funzione–segno, spiega ogni scelta e perché il solo colore può trarre in inganno. I colori delle categorie possono aiutare a ordinare ma non devono rivelare le terne corrette.\n\n2–3 per discutere; ogni studente consegna abbinamenti e motivi personali\n\nInterpretazioni provvisorie di immagini didattiche. Motivazioni e riscontri richiedono revisione; nessuna diagnosi in campo o dose di concime certificata.'), ('N/P/K', 'N, P e K')], 'de': [('3–5 auf Kultur', 'Drei bis fünf auf Kultur'), ('3–5 auf Kultur und Zeichen geprüfte Bilder, mindestens N, P und K\n\nStationsnummer\n\nKultur und Wachstumsstadium\n\ndirekte Beobachtung\n\nLage und Alter des Blatts\n\nwahrscheinliche Nährstoffhypothese\n\nBegründung und Alternative\n\nFeld- oder Laborprüfung\n\nBesuche jede vorhandene Station. Notiere sichtbare Zeichen vor der Hypothese. Beim ersten Versuch bleibt die Lösung verborgen.\n\nGruppenerklärungen mit jedem Bild vergleichen, Alternativen besprechen und Muster klären. Danach die Abschlussfrage selbstständig ohne Notizen beantworten.\n\nAlte untere Maisblätter haben gelbe Außenränder und eine grünere Mitte. Welche vorläufige Hypothese liegt nahe, weshalb betrifft es alte Blätter und was würdest du als Nächstes prüfen?\n\nBeobachtungs- und Kartenarbeitsblatt', 'Die Stationen dauern fünfundzwanzig Minuten, danach folgen zehn Minuten für die Nachbesprechung.\n\n3–5 auf Kultur und Zeichen geprüfte Bilder, mindestens N, P und K\n\nStationsnummer\n\nKultur und Wachstumsstadium\n\ndirekte Beobachtung\n\nLage und Alter des Blatts\n\nwahrscheinliche Nährstoffhypothese\n\nBegründung und Alternative\n\nFeld- oder Laborprüfung\n\nBesuche jede vorhandene Station. Notiere sichtbare Zeichen vor der Hypothese. Beim ersten Versuch bleibt die Lösung verborgen.\n\nGruppenerklärungen mit jedem Bild vergleichen, Alternativen besprechen und Muster klären. Danach die Abschlussfrage selbstständig ohne Notizen beantworten.\n\nAlte untere Maisblätter haben gelbe Außenränder und eine grünere Mitte. Welche vorläufige Hypothese liegt nahe, weshalb betrifft es alte Blätter und was würdest du als Nächstes prüfen?\n\nBeobachtungs- und Kartenarbeitsblatt'), ('Bilde drei Dreiergruppen aus Name, Aufgabe und Zeichen. Begründe jede Verbindung und nenne einen Grund, weshalb Farbe allein irreführt. Kategorien dürfen farbig sein, aber die richtigen Gruppen nicht verraten.\n\nDiskussion zu 2–3; jede Person gibt eigene Zuordnung und Begründung ab\n\nVorläufige Deutung von Lernbildern. Begründungen und weitere Belege müssen geprüft werden; keine bestätigte Felddiagnose oder Düngermenge.', 'Die Kartenzuordnung dauert zehn Minuten.\n\nBilde drei Dreiergruppen aus Name, Aufgabe und Zeichen. Begründe jede Verbindung und nenne einen Grund, weshalb Farbe allein irreführt. Kategorien dürfen farbig sein, aber die richtigen Gruppen nicht verraten.\n\nDiskussion zu 2–3; jede Person gibt eigene Zuordnung und Begründung ab\n\nVorläufige Deutung von Lernbildern. Begründungen und weitere Belege müssen geprüft werden; keine bestätigte Felddiagnose oder Düngermenge.'), ('Diskussion zu 2–3', 'Diskussion in Gruppen von zwei bis drei Personen'), ('N/P/K', 'N, P und K')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s203-remainder-audio-20261023-r1'
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
