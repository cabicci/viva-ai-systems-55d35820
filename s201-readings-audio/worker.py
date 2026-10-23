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
IDS = ('S2-01-ar-EG-R01-r1', 'S2-01-ar-EG-R02-r1', 'S2-01-ar-EG-R03-r1', 'S2-01-ar-EG-R04-r1', 'S2-01-ar-EG-R05-r1', 'S2-01-ar-EG-R06-r1', 'S2-01-ar-EG-R07-r1', 'S2-01-en-R01-r1', 'S2-01-en-R02-r1', 'S2-01-en-R03-r1', 'S2-01-en-R04-r1', 'S2-01-en-R05-r1', 'S2-01-en-R06-r1', 'S2-01-en-R07-r1', 'S2-01-it-R01-r1', 'S2-01-it-R02-r1', 'S2-01-it-R03-r1', 'S2-01-it-R04-r1', 'S2-01-it-R05-r1', 'S2-01-it-R06-r1', 'S2-01-it-R07-r1', 'S2-01-de-R01-r1', 'S2-01-de-R02-r1', 'S2-01-de-R03-r1', 'S2-01-de-R04-r1', 'S2-01-de-R05-r1', 'S2-01-de-R06-r1', 'S2-01-de-R07-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==28
    assert(req['scope'],req['stepId'])==('S201_THIRTYSIX_REMAINING_CURRENT_TEACHING_GROUPS_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-01')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s201-readings-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==28
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(7))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06','R07']
        ri=int(group[1:])-1;voice='Charon'if ri%2==0 else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]==[f'/reading/{ri}/paragraphs/{i}'for i in range(len(u['sourceBindings']))] and len(u['sourceBindings'])in[2,3]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('0.5 kg', 'نص كيلوجرام'), ('10%', 'عشرة في المية'), ('10–10–10', 'عشرة، عشرة، عشرة'), ('17 عنصرًا أساسيًا', 'سبعتاشر عنصر أساسي'), ('5 kg', 'خمسة كيلوجرام'), ('الأرقام التلاتة في مثال سماد 10–10–10 نسب وزن بترتيب ثابت: نيتروجين كلي N، وفوسفات متاح معبّر عنه بمكافئ P₂O₅، وبوتاس ذائب معبّر عنه بمكافئ K₂O. البطاقة بتستخدم مكافئات الأكاسيد للتعبير عن P وK. مش معناها إن السماد فيه 10% فوسفور عنصري و10% بوتاسيوم عنصري، ولا إن الكيس مكوّن من التلاتة دول بس.\n\nلو الكيس 5 kg وبطاقته 10–10–10، يبقى المكتوب 0.5 kg N، و0.5 kg مكافئ P₂O₅، و0.5 kg مكافئ K₂O. دي مسألة لفهم البطاقة والحساب، مش جرعة تسميد ولا توصية للحقل. الاستخدام الفعلي يحتاج احتياج المحصول ونتيجة التربة وتعليمات المنتج والتعليمات المحلية.', 'الأرقام التلاتة في مثال سماد 10–10–10 نسب وزن بترتيب ثابت: نيتروجين كلي إن، وفوسفات متاح معبّر عنه بمكافئ بي اتنين أو خمسة، وبوتاس ذائب معبّر عنه بمكافئ كيه اتنين أو. البطاقة بتستخدم مكافئات الأكاسيد للتعبير عن بي وكيه. مش معناها إن السماد فيه 10% فوسفور عنصري و10% بوتاسيوم عنصري، ولا إن الكيس مكوّن من التلاتة دول بس.\n\nلو الكيس 5 kg وبطاقته 10–10–10، يبقى المكتوب 0.5 kg إن، و0.5 kg مكافئ بي اتنين أو خمسة، و0.5 kg مكافئ كيه اتنين أو. دي مسألة لفهم البطاقة والحساب، مش جرعة تسميد ولا توصية للحقل. الاستخدام الفعلي يحتاج احتياج المحصول ونتيجة التربة وتعليمات المنتج والتعليمات المحلية.'), ('البوتاسيوم بيساعد ينظم علاقة النبات بالميه وعمل الثغور ويدعم قوة الساق. على خلاف N وP، K مش داخل بنفس الطريقة في تركيب المركبات العضوية البنائية؛ جزء كبير من دوره تنظيم العمليات. المنهج بيسميه «الحامي»، لكن توفره ما يخليش المحصول محصّن ضد الحشرات أو المرض أو الجفاف أو الريح.\n\nK موجود في التربة بمخازن مختلفة في سرعة تعويض محلول التربة. إجمالي K في التربة مش هو بالضرورة اللي الجذور تقدر تاخده فورًا. في مثال ذرة وقعت سيقانها بعد يوم عاصف، تغذية K تستحق الفحص كاحتمال. شدة الريح والصنف وعناصر تانية والمرض والإدارة ممكن تسبب الرقاد برضه؛ الملاحظة وحدها ما تثبتش نقص K.', 'البوتاسيوم بيساعد ينظم علاقة النبات بالميه وعمل الثغور ويدعم قوة الساق. على خلاف إن وبي، كيه مش داخل بنفس الطريقة في تركيب المركبات العضوية البنائية؛ جزء كبير من دوره تنظيم العمليات. المنهج بيسميه «الحامي»، لكن توفره ما يخليش المحصول محصّن ضد الحشرات أو المرض أو الجفاف أو الريح.\n\nكيه موجود في التربة بمخازن مختلفة في سرعة تعويض محلول التربة. إجمالي كيه في التربة مش هو بالضرورة اللي الجذور تقدر تاخده فورًا. في مثال ذرة وقعت سيقانها بعد يوم عاصف، تغذية كيه تستحق الفحص كاحتمال. شدة الريح والصنف وعناصر تانية والمرض والإدارة ممكن تسبب الرقاد برضه؛ الملاحظة وحدها ما تثبتش نقص كيه.'), ('التشبيهان يساعدونا', 'التشبيهين بيساعدونا'), ('الفوسفور بيساعد في نقل الطاقة جوه النبات. توفر P المناسب يدعم بداية نمو الجذور والعمليات المرتبطة بالزهور والثمار والبذور. تشبيه الأساس والكهربا يلفت النظر للأدوار دي، لكن P ما بيشتغلش لوحده ومش ضمان تلقائي لزهور أو ثمار.\n\nجزء من فوسفور التربة ممكن يرتبط بمكوناتها وما يبقاش متاحًا للجذور. درجة الحموضة pH كمان بتغيّر الإتاحة. يعني التربة ممكن يكون فيها P لكن ما توفرش كفاية للمحصول. وبالمقابل، إضافة P من غير دليل ممكن تهدر فلوس وتساهم في جريان العناصر للميه وزيادة نمو الطحالب. التشخيص يعتمد على تحليل التربة وعمر المحصول وظروف الحقل.', 'الفوسفور بيساعد في نقل الطاقة جوه النبات. توفر بي المناسب يدعم بداية نمو الجذور والعمليات المرتبطة بالزهور والثمار والبذور. تشبيه الأساس والكهربا يلفت النظر للأدوار دي، لكن بي ما بيشتغلش لوحده ومش ضمان تلقائي لزهور أو ثمار.\n\nجزء من فوسفور التربة ممكن يرتبط بمكوناتها وما يبقاش متاحًا للجذور. درجة الحموضة بي إتش كمان بتغيّر الإتاحة. يعني التربة ممكن يكون فيها بي لكن ما توفرش كفاية للمحصول. وبالمقابل، إضافة بي من غير دليل ممكن تهدر فلوس وتساهم في جريان العناصر للميه وزيادة نمو الطحالب. التشخيص يعتمد على تحليل التربة وعمر المحصول وظروف الحقل.'), ('النبات محتاج 17 عنصرًا أساسيًا عشان يكمل دورة حياته. الكربون C والهيدروجين H والأكسجين O بيكوّنوا جزءًا كبيرًا من كتلته، وبييجوا أساسًا من الهوا والميه. باقي العناصر الأساسية بياخدها غالبًا كعناصر معدنية من وسط النمو. ما ينفعش نستغنى عن عنصر أساسي لمجرد إن عنصرًا تاني متوفر بزيادة.\n\nالنيتروجين N والفوسفور P والبوتاسيوم K اسمهم العناصر المعدنية الكبرى الأولية. الكالسيوم Ca والمغنيسيوم Mg والكبريت S برضه عناصر معدنية كبرى، وغالبًا بنسميهم ثانوية. العناصر الصغرى الأساسية التمانية هي الحديد Fe، والمنجنيز Mn، والزنك Zn، والنحاس Cu، والبورون B، والموليبدينوم Mo، والكلور Cl، والنيكل Ni. ومع C وH وO يكتمل عدد السبعتاشر. اسم «التلاتة الكبار» يخص الاحتياج الشائع للتسميد المعدني؛ مش معناه إن كتلتهم في النبات أكبر من C وH وO، ولا إن كل حقل لازم نضيف له التلاتة.\n\nالتربة ممكن تحتوي عنصرًا، لكن الجذر ما يلاقيش منه كمية كافية في الوقت المطلوب. الجذور بتمتص غالبًا أيونات العناصر الذائبة في محلول التربة. الميه ودرجة الحموضة pH وارتباط العناصر بحبيبات التربة ونشاط الميكروبات وحالة الجذور كلها بتأثر في الإتاحة. تحليل التربة وظروف المحصول مهمين قبل اختيار السماد.', 'النبات محتاج 17 عنصرًا أساسيًا عشان يكمل دورة حياته. الكربون سي والهيدروجين إتش والأكسجين أو بيكوّنوا جزءًا كبيرًا من كتلته، وبييجوا أساسًا من الهوا والميه. باقي العناصر الأساسية بياخدها غالبًا كعناصر معدنية من وسط النمو. ما ينفعش نستغنى عن عنصر أساسي لمجرد إن عنصرًا تاني متوفر بزيادة.\n\nالنيتروجين إن والفوسفور بي والبوتاسيوم كيه اسمهم العناصر المعدنية الكبرى الأولية. الكالسيوم سي إيه والمغنيسيوم إم جي والكبريت إس برضه عناصر معدنية كبرى، وغالبًا بنسميهم ثانوية. العناصر الصغرى الأساسية التمانية هي الحديد إف إي، والمنجنيز إم إن، والزنك زد إن، والنحاس سي يو، والبورون بي، والموليبدينوم إم أو، والكلور سي إل، والنيكل إن آي. ومع سي وإتش وأو يكتمل عدد السبعتاشر. اسم «التلاتة الكبار» يخص الاحتياج الشائع للتسميد المعدني؛ مش معناه إن كتلتهم في النبات أكبر من سي وإتش وأو، ولا إن كل حقل لازم نضيف له التلاتة.\n\nالتربة ممكن تحتوي عنصرًا، لكن الجذر ما يلاقيش منه كمية كافية في الوقت المطلوب. الجذور بتمتص غالبًا أيونات العناصر الذائبة في محلول التربة. الميه ودرجة الحموضة بي إتش وارتباط العناصر بحبيبات التربة ونشاط الميكروبات وحالة الجذور كلها بتأثر في الإتاحة. تحليل التربة وظروف المحصول مهمين قبل اختيار السماد.'), ('النيتروجين داخل في الأحماض الأمينية والبروتينات والكلوروفيل، الصبغة اللي بتشارك في التقاط الضوء للبناء الضوئي. توفر N بالمقدار المناسب يدعم نمو الورق والساق واللون الأخضر الصحي. في مثال مرعى محتاج إنتاج ورقي أعلى، N أول عنصر نفكر نفحصه من التلاتة، مع بقاء أهمية العناصر التانية وتحليل التربة.\n\nالمادة العضوية في التربة فيها مخزون نيتروجين. الكائنات الدقيقة بتساعد تحوّل النيتروجين العضوي لأشكال معدنية ممكن النبات يستخدمها، وسرعة خروجها بتتغير حسب الظروف. ده جزء من دورة العناصر الغذائية، مش ضمان إن المادة العضوية هتوفر N كفاية فورًا.\n\nتشبيه دواسة البنزين بيساعد على التذكر، لكنه مش نصيحة تزود السماد للآخر. زيادة N ممكن تعمل نموًا طريًا مفرطًا وتهدر موارد وتسبب فقدًا بيئيًا. N وP وK ممكن ينتقلوا من أنسجة قديمة لنمو جديد، فالنقص غالبًا يظهر أولًا في الأوراق الأقدم. لكن أي علامة في ورقة قديمة مش تشخيص تلقائي؛ نوع المحصول وعمره وضغوط تانية مهمة. الورقة القديمة الشاحبة تخلينا نفحص احتمال نقص N، واللون وحده ما يثبتش السبب. تشخيص الأعراض بالتفصيل في خطوة «قراءة علامات نقص العناصر من غير قفز للتشخيص».', 'النيتروجين داخل في الأحماض الأمينية والبروتينات والكلوروفيل، الصبغة اللي بتشارك في التقاط الضوء للبناء الضوئي. توفر إن بالمقدار المناسب يدعم نمو الورق والساق واللون الأخضر الصحي. في مثال مرعى محتاج إنتاج ورقي أعلى، إن أول عنصر نفكر نفحصه من التلاتة، مع بقاء أهمية العناصر التانية وتحليل التربة.\n\nالمادة العضوية في التربة فيها مخزون نيتروجين. الكائنات الدقيقة بتساعد تحوّل النيتروجين العضوي لأشكال معدنية ممكن النبات يستخدمها، وسرعة خروجها بتتغير حسب الظروف. ده جزء من دورة العناصر الغذائية، مش ضمان إن المادة العضوية هتوفر إن كفاية فورًا.\n\nتشبيه دواسة البنزين بيساعد على التذكر، لكنه مش نصيحة تزود السماد للآخر. زيادة إن ممكن تعمل نموًا طريًا مفرطًا وتهدر موارد وتسبب فقدًا بيئيًا. إن وبي وكيه ممكن ينتقلوا من أنسجة قديمة لنمو جديد، فالنقص غالبًا يظهر أولًا في الأوراق الأقدم. لكن أي علامة في ورقة قديمة مش تشخيص تلقائي؛ نوع المحصول وعمره وضغوط تانية مهمة. الورقة القديمة الشاحبة تخلينا نفحص احتمال نقص إن، واللون وحده ما يثبتش السبب. تشخيص الأعراض بالتفصيل في خطوة «قراءة علامات نقص العناصر من غير قفز للتشخيص».'), ('النيتروجين رمزه N، والجذور بتمتصه عادة في صورة نترات NO₃⁻ أو أمونيوم NH₄⁺. الفوسفور رمزه P، وصورتا الفوسفات الرئيسيتان في محلول أغلب الترب الزراعية هما H₂PO₄⁻ وHPO₄²⁻، ونسبتهما بتتأثر بـpH. البوتاسيوم رمزه K ويُمتص في صورة K⁺. دي أيونات ذائبة في الميه، مش قطع صلبة من N أو P أو K داخلة الجذر.\n\nفي ظروف التربة الزراعية المعتادة، PO₄³⁻ مش من صور امتصاص الفوسفور الرئيسية. صور الفوسفات الشائعة اللي بنشرحها هنا هي H₂PO₄⁻ وHPO₄²⁻. تفاصيل انتقال العناصر للجذور في خطوة «رحلة العناصر الغذائية للجذر وحركتها جوه النبات».', 'النيتروجين رمزه إن، والجذور بتمتصه عادة في صورة نترات إن أو تلاتة، بشحنة سالبة واحدة أو أمونيوم إن إتش أربعة، بشحنة موجبة واحدة. الفوسفور رمزه بي، وصورتا الفوسفات الرئيسيتان في محلول أغلب الترب الزراعية هما إتش اتنين بي أو أربعة، بشحنة سالبة واحدة وإتش بي أو أربعة، بشحنتين سالبتين، ونسبتهما بتتأثر بـبي إتش. البوتاسيوم رمزه كيه ويُمتص في صورة كيه، بشحنة موجبة واحدة. دي أيونات ذائبة في الميه، مش قطع صلبة من إن أو بي أو كيه داخلة الجذر.\n\nفي ظروف التربة الزراعية المعتادة، بي أو أربعة، بتلات شحنات سالبة مش من صور امتصاص الفوسفور الرئيسية. صور الفوسفات الشائعة اللي بنشرحها هنا هي إتش اتنين بي أو أربعة، بشحنة سالبة واحدة وإتش بي أو أربعة، بشحنتين سالبتين. تفاصيل انتقال العناصر للجذور في خطوة «رحلة العناصر الغذائية للجذر وحركتها جوه النبات».'), ('تخيل بتبني بيت: طوب كتير من غير شبكة كهربا أو تنظيم للميه مش هيعمل بيت شغال. ومخزن أكل فيه مكوّن واحد بزيادة ما يعوّضش باقي المكونات. التشبيهان يساعدونا نفهم الاحتياج لتغذية متوازنة للنبات.\n\nالمنهج شبّه N بـ«محرك النمو»، وP بـ«مقوّي الجذور والإثمار»، وK بـ«المنظِّم والحامي». في تشبيه البيت، N زي الهيكل اللي بيكبر، وP زي الأساس والكهربا، وK زي السقف وشبكة الميه. احفظهم كتلميحات للأدوار اللي جاية، مش أوصاف حرفية واحد لواحد. التلاتة بيشاركوا في عمليات كتير، والنمو محتاج كمان باقي العناصر والضوء والميه وظروف تربة مناسبة.', 'تخيل بتبني بيت: طوب كتير من غير شبكة كهربا أو تنظيم للميه مش هيعمل بيت شغال. ومخزن أكل فيه مكوّن واحد بزيادة ما يعوّضش باقي المكونات. التشبيهان يساعدونا نفهم الاحتياج لتغذية متوازنة للنبات.\n\nالمنهج شبّه إن بـ«محرك النمو»، وبي بـ«مقوّي الجذور والإثمار»، وكيه بـ«المنظِّم والحامي». في تشبيه البيت، إن زي الهيكل اللي بيكبر، وبي زي الأساس والكهربا، وكيه زي السقف وشبكة الميه. احفظهم كتلميحات للأدوار اللي جاية، مش أوصاف حرفية واحد لواحد. التلاتة بيشاركوا في عمليات كتير، والنمو محتاج كمان باقي العناصر والضوء والميه وظروف تربة مناسبة.'), ('جزءًا كبيرًا', 'جزء كبير'), ('عنصرًا تاني', 'عنصر تاني'), ('عنصرًا،', 'عنصر،'), ('فقدًا بيئيًا', 'فقد بيئي'), ('متاحًا', 'متاح'), ('نموًا طريًا مفرطًا', 'نمو طري زيادة عن اللزوم'), ('وصورتا الفوسفات الرئيسيتان', 'وصور الفوسفات الأساسية الاتنين'), ('ونسبتهما بتتأثر', 'ونسبتهم بتتأثر')], 'en': [('0.5 kg', 'zero point five kilograms'), ('10–10–10', 'ten, ten, ten'), ('5 kg', 'five kilograms'), ("A plant needs 17 essential elements to complete its life cycle. Carbon (C), hydrogen (H) and oxygen (O) make up much of its mass and come chiefly from air and water. The other essential elements are obtained mainly as mineral nutrients through the growing medium. None of the essentials can simply be ignored because another is plentiful.\n\nNitrogen (N), phosphorus (P) and potassium (K) are called the three primary mineral macronutrients. Calcium (Ca), magnesium (Mg) and sulfur (S) are also mineral macronutrients, often called secondary macronutrients. The eight essential micronutrients are iron (Fe), manganese (Mn), zinc (Zn), copper (Cu), boron (B), molybdenum (Mo), chlorine (Cl) and nickel (Ni). Together with C, H and O, these make the 17 essentials. Calling N–P–K 'the big three' concerns common mineral fertilizer needs; it does not mean these three exceed C, H and O in total plant mass or that every field needs all three added.\n\nA soil can contain a nutrient yet supply too little of it to a root at a particular time. Roots mostly take up dissolved nutrient ions from the soil solution. Water, pH, the way nutrients bind to soil particles, microbial activity and root conditions affect availability. Soil analysis and the crop context matter before choosing a fertilizer.", "A plant needs 17 essential elements to complete its life cycle. Carbon (C), hydrogen (H) and oxygen (O) make up much of its mass and come chiefly from air and water. The other essential elements are obtained mainly as mineral nutrients through the growing medium. None of the essentials can simply be ignored because another is plentiful.\n\nNitrogen (N), phosphorus (P) and potassium (K) are called the three primary mineral macronutrients. Calcium (Ca), magnesium (Mg) and sulfur (S) are also mineral macronutrients, often called secondary macronutrients. The eight essential micronutrients are iron (Fe), manganese (Mn), zinc (Zn), copper (Cu), boron (B), molybdenum (Mo), chlorine (Cl) and nickel (Ni). Together with C, H and O, these make the 17 essentials. Calling N–P–K 'the big three' concerns common mineral fertilizer needs; it does not mean these three exceed C, H and O in total plant mass or that every field needs all three added.\n\nA soil can contain a nutrient yet supply too little of it to a root at a particular time. Roots mostly take up dissolved nutrient ions from the soil solution. Water, P H, the way nutrients bind to soil particles, microbial activity and root conditions affect availability. Soil analysis and the crop context matter before choosing a fertilizer."), ('Nitrogen is N. Roots commonly take it up as nitrate (NO₃⁻) or ammonium (NH₄⁺). Phosphorus is P. In ordinary agricultural soil solution, its principal phosphate uptake forms are H₂PO₄⁻ and HPO₄²⁻; their relative amounts depend on pH. Potassium is K and is taken up as K⁺. These are ions in solution, not loose pieces of solid N, P or K entering a root.\n\nPO₄³⁻ is not a principal uptake form under ordinary agricultural soil conditions. The common phosphate uptake forms discussed here are H₂PO₄⁻ and HPO₄²⁻. Detailed transport to roots follows in the step “Nutrient transport to roots and within plants”.', 'Nitrogen is N. Roots commonly take it up as nitrate (N O three, with one negative charge) or ammonium (N H four, with one positive charge). Phosphorus is P. In ordinary agricultural soil solution, its principal phosphate uptake forms are H two P O four, with one negative charge and H P O four, with two negative charges; their relative amounts depend on P H. Potassium is K and is taken up as K, with one positive charge. These are ions in solution, not loose pieces of solid N, P or K entering a root.\n\nP O four, with three negative charges is not a principal uptake form under ordinary agricultural soil conditions. The common phosphate uptake forms discussed here are H two P O four, with one negative charge and H P O four, with two negative charges. Detailed transport to roots follows in the step “Nutrient transport to roots and within plants”.'), ("Phosphorus is involved in energy transfer inside the plant. Adequate P supports early root establishment and the processes associated with flowering, fruit and seed development. The source's foundation and power-supply analogy highlights these roles; P does not act alone and does not guarantee flowers or fruit.\n\nSome soil P can be bound to soil constituents and unavailable to roots. Soil pH also changes availability. A soil may therefore contain P without supplying enough to the crop. Conversely, adding more P without evidence can waste money and contribute to nutrient runoff and water enrichment. A diagnosis should consider the soil test, crop stage and field conditions.", "Phosphorus is involved in energy transfer inside the plant. Adequate P supports early root establishment and the processes associated with flowering, fruit and seed development. The source's foundation and power-supply analogy highlights these roles; P does not act alone and does not guarantee flowers or fruit.\n\nSome soil P can be bound to soil constituents and unavailable to roots. Soil P H also changes availability. A soil may therefore contain P without supplying enough to the crop. Conversely, adding more P without evidence can waste money and contribute to nutrient runoff and water enrichment. A diagnosis should consider the soil test, crop stage and field conditions."), ("The three numbers on the source's 10–10–10 fertilizer example are weight percentages in a fixed order: total nitrogen (N), available phosphate expressed as P₂O₅, and soluble potash expressed as K₂O. The label convention reports P and K as oxide equivalents. It does not say that the material contains 10% elemental P and 10% elemental K, or that the bag consists of only those three ingredients.\n\nFor a 5 kg bag labelled 10–10–10, the label states 0.5 kg N, 0.5 kg P₂O₅ equivalent and 0.5 kg K₂O equivalent. These values are an arithmetic reading exercise, not a dose or a soil recommendation. A field application must use a crop requirement, soil result, product information and local instructions.", "The three numbers on the source's 10–10–10 fertilizer example are weight percentages in a fixed order: total nitrogen (N), available phosphate expressed as P two O five, and soluble potash expressed as K two O. The label convention reports P and K as oxide equivalents. It does not say that the material contains 10% elemental P and 10% elemental K, or that the bag consists of only those three ingredients.\n\nFor a 5 kg bag labelled 10–10–10, the label states 0.5 kg N, 0.5 kg P two O five equivalent and 0.5 kg K two O equivalent. These values are an arithmetic reading exercise, not a dose or a soil recommendation. A field application must use a crop requirement, soil result, product information and local instructions."), ('a five kilograms bag', 'a five-kilogram bag')], 'it': [('0.5 kg', 'zero virgola cinque chilogrammi'), ('10–10–10', 'dieci, dieci, dieci'), ('5 kg', 'cinque chilogrammi'), ("I tre numeri dell'esempio 10–10–10 sono percentuali in peso in ordine fisso: azoto totale N, fosfato disponibile espresso come P₂O₅ e potassa solubile espressa come K₂O. Per P e K l'etichetta usa equivalenti ossido. Non dice 10% di P elementare e 10% di K elementare né che il sacco contenga solo quei tre componenti.\n\nPer un sacco da 5 kg etichettato 10–10–10 si leggono 0.5 kg di N, 0.5 kg di equivalente P₂O₅ e 0.5 kg di equivalente K₂O. È un esercizio aritmetico, non una dose o una raccomandazione per il campo. Un impiego reale richiede bisogno della coltura, analisi del suolo, prodotto e indicazioni locali.", "I tre numeri dell'esempio 10–10–10 sono percentuali in peso in ordine fisso: azoto totale N, fosfato disponibile espresso come pi due o cinque e potassa solubile espressa come kappa due o. Per P e K l'etichetta usa equivalenti ossido. Non dice 10% di P elementare e 10% di K elementare né che il sacco contenga solo quei tre componenti.\n\nPer un sacco da 5 kg etichettato 10–10–10 si leggono 0.5 kg di N, 0.5 kg di equivalente pi due o cinque e 0.5 kg di equivalente kappa due o. È un esercizio aritmetico, non una dose o una raccomandazione per il campo. Un impiego reale richiede bisogno della coltura, analisi del suolo, prodotto e indicazioni locali."), ("Il fosforo interviene nel trasferimento di energia nella pianta. P adeguato sostiene le prime radici e i processi di fiori, frutti e semi. L'analogia delle fondamenta e dell'alimentazione elettrica evidenzia queste funzioni; P non agisce da solo e non garantisce la fruttificazione.\n\nParte del P nel suolo può legarsi ai suoi componenti e non essere disponibile. Anche il pH modifica la disponibilità. Si può quindi avere P presente ma insufficiente per la coltura. Aggiungerne senza prove può sprecare denaro e favorire perdite verso le acque ed eutrofizzazione. Considera analisi, fase colturale e condizioni di campo.", "Il fosforo interviene nel trasferimento di energia nella pianta. P adeguato sostiene le prime radici e i processi di fiori, frutti e semi. L'analogia delle fondamenta e dell'alimentazione elettrica evidenzia queste funzioni; P non agisce da solo e non garantisce la fruttificazione.\n\nParte del P nel suolo può legarsi ai suoi componenti e non essere disponibile. Anche il P H modifica la disponibilità. Si può quindi avere P presente ma insufficiente per la coltura. Aggiungerne senza prove può sprecare denaro e favorire perdite verso le acque ed eutrofizzazione. Considera analisi, fase colturale e condizioni di campo."), ("L'azoto è N e le radici lo assorbono spesso come nitrato NO₃⁻ o ammonio NH₄⁺. Il fosforo è P: nella soluzione di normali suoli agricoli le forme principali di assorbimento sono H₂PO₄⁻ e HPO₄²⁻, in proporzioni influenzate dal pH. Il potassio è K e si assorbe come K⁺. Sono ioni in soluzione, non frammenti solidi di N, P e K che entrano nella radice.\n\nPO₄³⁻ non è una principale forma assorbita nelle normali condizioni dei suoli agricoli. Le comuni forme di fosfato trattate qui sono H₂PO₄⁻ e HPO₄²⁻. Il trasporto dettagliato alle radici segue in «Il viaggio dei nutrienti verso la radice e dentro la pianta».", "L'azoto è N e le radici lo assorbono spesso come nitrato enne o tre, con una carica negativa o ammonio enne acca quattro, con una carica positiva. Il fosforo è P: nella soluzione di normali suoli agricoli le forme principali di assorbimento sono acca due pi o quattro, con una carica negativa e acca pi o quattro, con due cariche negative, in proporzioni influenzate dal P H. Il potassio è K e si assorbe come kappa, con una carica positiva. Sono ioni in soluzione, non frammenti solidi di N, P e K che entrano nella radice.\n\npi o quattro, con tre cariche negative non è una principale forma assorbita nelle normali condizioni dei suoli agricoli. Le comuni forme di fosfato trattate qui sono acca due pi o quattro, con una carica negativa e acca pi o quattro, con due cariche negative. Il trasporto dettagliato alle radici segue in «Il viaggio dei nutrienti verso la radice e dentro la pianta»."), ("Una pianta ha bisogno di 17 elementi essenziali per completare il ciclo vitale. Carbonio C, idrogeno H e ossigeno O formano gran parte della sua massa e arrivano soprattutto da aria e acqua. Gli altri elementi arrivano principalmente come nutrienti minerali dal mezzo di crescita. L'abbondanza di un elemento non permette di ignorarne un altro essenziale.\n\nAzoto N, fosforo P e potassio K sono i tre macronutrienti minerali primari. Anche calcio Ca, magnesio Mg e zolfo S sono macronutrienti minerali, detti secondari. Gli otto micronutrienti essenziali sono ferro Fe, manganese Mn, zinco Zn, rame Cu, boro B, molibdeno Mo, cloro Cl e nichel Ni. Con C, H e O si arriva a 17. 'I tre grandi' riguarda esigenze frequenti di concimazione minerale: non significa che NPK superi C/H/O per massa totale né che ogni campo debba ricevere tutti e tre.\n\nUn suolo può contenere un nutriente ma fornirne troppo poco alle radici nel momento utile. Le radici assorbono soprattutto ioni disciolti nella soluzione del suolo. Acqua, pH, legami con le particelle, microbi e condizioni radicali influenzano la disponibilità. Prima di scegliere un fertilizzante servono analisi e contesto della coltura.", "Una pianta ha bisogno di 17 elementi essenziali per completare il ciclo vitale. Carbonio C, idrogeno H e ossigeno O formano gran parte della sua massa e arrivano soprattutto da aria e acqua. Gli altri elementi arrivano principalmente come nutrienti minerali dal mezzo di crescita. L'abbondanza di un elemento non permette di ignorarne un altro essenziale.\n\nAzoto N, fosforo P e potassio K sono i tre macronutrienti minerali primari. Anche calcio Ca, magnesio Mg e zolfo S sono macronutrienti minerali, detti secondari. Gli otto micronutrienti essenziali sono ferro Fe, manganese Mn, zinco Zn, rame Cu, boro B, molibdeno Mo, cloro Cl e nichel Ni. Con C, H e O si arriva a 17. 'I tre grandi' riguarda esigenze frequenti di concimazione minerale: non significa che N P K superi C, H, O per massa totale né che ogni campo debba ricevere tutti e tre.\n\nUn suolo può contenere un nutriente ma fornirne troppo poco alle radici nel momento utile. Le radici assorbono soprattutto ioni disciolti nella soluzione del suolo. Acqua, P H, legami con le particelle, microbi e condizioni radicali influenzano la disponibilità. Prima di scegliere un fertilizzante servono analisi e contesto della coltura.")], 'de': [('0.5 kg', 'null Komma fünf Kilogramm'), ('10–10–10', 'zehn, zehn, zehn'), ('5 kg', 'fünf Kilogramm'), ('Die drei Zahlen im Beispiel 10–10–10 sind Massenprozente in fester Reihenfolge: Gesamtstickstoff N, verfügbares Phosphat ausgedrückt als P₂O₅ und lösliches Kali ausgedrückt als K₂O. Für P und K verwendet das Etikett Oxidäquivalente. Es behauptet weder 10 % elementares P und 10 % elementares K noch, dass der Sack nur diese drei Bestandteile enthält.\n\nBei einem Sack mit 5 kg und der Kennzeichnung 10–10–10 ergeben sich 0.5 kg N, 0.5 kg P₂O₅-Äquivalent und 0.5 kg K₂O-Äquivalent. Das ist eine Rechenübung, keine Düngeempfehlung oder Feldmenge. Für die Anwendung sind Kulturbedarf, Bodenanalyse, Produkt und örtliche Hinweise erforderlich.', 'Die drei Zahlen im Beispiel 10–10–10 sind Massenprozente in fester Reihenfolge: Gesamtstickstoff N, verfügbares Phosphat ausgedrückt als P zwei O fünf und lösliches Kali ausgedrückt als K zwei O. Für P und K verwendet das Etikett Oxidäquivalente. Es behauptet weder 10 % elementares P und 10 % elementares K noch, dass der Sack nur diese drei Bestandteile enthält.\n\nBei einem Sack mit 5 kg und der Kennzeichnung 10–10–10 ergeben sich 0.5 kg N, 0.5 kg P zwei O fünf-Äquivalent und 0.5 kg K zwei O-Äquivalent. Das ist eine Rechenübung, keine Düngeempfehlung oder Feldmenge. Für die Anwendung sind Kulturbedarf, Bodenanalyse, Produkt und örtliche Hinweise erforderlich.'), ("Eine Pflanze braucht 17 essenzielle Elemente, um ihren Lebenszyklus abzuschließen. Kohlenstoff C, Wasserstoff H und Sauerstoff O machen einen großen Teil ihrer Masse aus und stammen vor allem aus Luft und Wasser. Die anderen Elemente kommen überwiegend als mineralische Nährstoffe aus dem Wachstumsmedium. Viel von einem Element ersetzt kein anderes essenzielles Element.\n\nStickstoff N, Phosphor P und Kalium K sind die drei primären mineralischen Makronährstoffe. Calcium Ca, Magnesium Mg und Schwefel S sind ebenfalls mineralische Makronährstoffe, werden aber sekundär genannt. Die acht essenziellen Mikronährstoffe heißen Eisen Fe, Mangan Mn, Zink Zn, Kupfer Cu, Bor B, Molybdän Mo, Chlor Cl und Nickel Ni. Zusammen mit C, H und O ergibt das 17. Die 'großen Drei' beschreiben häufige mineralische Düngefragen: NPK bildet weder mehr Pflanzenmasse als C/H/O noch muss jedes Feld automatisch alle drei erhalten.\n\nEin Boden kann einen Nährstoff enthalten, aber ihn zur benötigten Zeit nicht ausreichend an Wurzeln abgeben. Wurzeln nehmen überwiegend gelöste Ionen aus der Bodenlösung auf. Wasser, pH-Wert, Bindung an Bodenbestandteile, Mikroorganismen und Wurzelzustand beeinflussen die Verfügbarkeit. Vor einer Düngeentscheidung sind Untersuchung und Kulturkontext nötig.", "Eine Pflanze braucht 17 essenzielle Elemente, um ihren Lebenszyklus abzuschließen. Kohlenstoff C, Wasserstoff H und Sauerstoff O machen einen großen Teil ihrer Masse aus und stammen vor allem aus Luft und Wasser. Die anderen Elemente kommen überwiegend als mineralische Nährstoffe aus dem Wachstumsmedium. Viel von einem Element ersetzt kein anderes essenzielles Element.\n\nStickstoff N, Phosphor P und Kalium K sind die drei primären mineralischen Makronährstoffe. Calcium Ca, Magnesium Mg und Schwefel S sind ebenfalls mineralische Makronährstoffe, werden aber sekundär genannt. Die acht essenziellen Mikronährstoffe heißen Eisen Fe, Mangan Mn, Zink Zn, Kupfer Cu, Bor B, Molybdän Mo, Chlor Cl und Nickel Ni. Zusammen mit C, H und O ergibt das 17. Die 'großen Drei' beschreiben häufige mineralische Düngefragen: N P K bildet weder mehr Pflanzenmasse als C, H, O noch muss jedes Feld automatisch alle drei erhalten.\n\nEin Boden kann einen Nährstoff enthalten, aber ihn zur benötigten Zeit nicht ausreichend an Wurzeln abgeben. Wurzeln nehmen überwiegend gelöste Ionen aus der Bodenlösung auf. Wasser, P H-Wert, Bindung an Bodenbestandteile, Mikroorganismen und Wurzelzustand beeinflussen die Verfügbarkeit. Vor einer Düngeentscheidung sind Untersuchung und Kulturkontext nötig."), ('Phosphor ist am Energietransfer in der Pflanze beteiligt. Ausreichend P unterstützt frühe Wurzelentwicklung und Vorgänge bei Blüten, Früchten und Samen. Der Vergleich mit Fundament und Stromversorgung hebt diese Funktionen hervor; P handelt nicht allein und garantiert keinen Fruchtansatz.\n\nEin Teil des Phosphors kann an Bodenbestandteile gebunden und damit nicht verfügbar sein. Auch der pH-Wert beeinflusst seine Verfügbarkeit. Deshalb kann P vorhanden und für die Kultur dennoch unzureichend sein. Ohne Belege zusätzliches P auszubringen kann Geld verschwenden und Einträge in Gewässer bis hin zur Eutrophierung fördern. Prüfe Bodenanalyse, Kulturstadium und Feldbedingungen.', 'Phosphor ist am Energietransfer in der Pflanze beteiligt. Ausreichend P unterstützt frühe Wurzelentwicklung und Vorgänge bei Blüten, Früchten und Samen. Der Vergleich mit Fundament und Stromversorgung hebt diese Funktionen hervor; P handelt nicht allein und garantiert keinen Fruchtansatz.\n\nEin Teil des Phosphors kann an Bodenbestandteile gebunden und damit nicht verfügbar sein. Auch der P H-Wert beeinflusst seine Verfügbarkeit. Deshalb kann P vorhanden und für die Kultur dennoch unzureichend sein. Ohne Belege zusätzliches P auszubringen kann Geld verschwenden und Einträge in Gewässer bis hin zur Eutrophierung fördern. Prüfe Bodenanalyse, Kulturstadium und Feldbedingungen.'), ('Stickstoff ist N; Wurzeln nehmen ihn häufig als Nitrat NO₃⁻ oder Ammonium NH₄⁺ auf. Phosphor ist P; in der Bodenlösung üblicher landwirtschaftlicher Böden sind H₂PO₄⁻ und HPO₄²⁻ die wichtigsten Aufnahmeformen, deren Verhältnis vom pH-Wert abhängt. Kalium ist K und wird als K⁺ aufgenommen. Das sind gelöste Ionen, keine festen Stücke von N, P oder K, die in die Wurzel wandern.\n\nPO₄³⁻ ist unter üblichen landwirtschaftlichen Bodenbedingungen keine hauptsächliche Aufnahmeform. Hier werden die üblichen Phosphatformen H₂PO₄⁻ und HPO₄²⁻ behandelt. Der genaue Transport zur Wurzel folgt in „Nährstoffwege zur Wurzel und in der Pflanze“.', 'Stickstoff ist N; Wurzeln nehmen ihn häufig als Nitrat N O drei, einfach negativ geladen oder Ammonium N H vier, einfach positiv geladen auf. Phosphor ist P; in der Bodenlösung üblicher landwirtschaftlicher Böden sind H zwei P O vier, einfach negativ geladen und H P O vier, zweifach negativ geladen die wichtigsten Aufnahmeformen, deren Verhältnis vom P H-Wert abhängt. Kalium ist K und wird als K, einfach positiv geladen aufgenommen. Das sind gelöste Ionen, keine festen Stücke von N, P oder K, die in die Wurzel wandern.\n\nP O vier, dreifach negativ geladen ist unter üblichen landwirtschaftlichen Bodenbedingungen keine hauptsächliche Aufnahmeform. Hier werden die üblichen Phosphatformen H zwei P O vier, einfach negativ geladen und H P O vier, zweifach negativ geladen behandelt. Der genaue Transport zur Wurzel folgt in „Nährstoffwege zur Wurzel und in der Pflanze“.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s201-readings-audio-20261023-r1'
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
    assert count < 7, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 28,'maximumCallsForLane':7,
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
    assert all(v<=7 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':7,'maximumBlindReviewPerLane':7,'maximumASRPerLane':7,'maximumTTSAggregate':28,'maximumBlindAggregate':28,'maximumASRAggregate':28,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
