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
IDS = ('S3-04-ar-EG-R01a-r1', 'S3-04-ar-EG-R01b-r1', 'S3-04-ar-EG-R01c-r1', 'S3-04-ar-EG-R02-r1', 'S3-04-ar-EG-R03-r1', 'S3-04-ar-EG-R04-r1', 'S3-04-ar-EG-R05-r1', 'S3-04-ar-EG-R06-r1', 'S3-04-en-R01a-r1', 'S3-04-en-R01b-r1', 'S3-04-en-R01c-r1', 'S3-04-en-R02-r1', 'S3-04-en-R03-r1', 'S3-04-en-R04-r1', 'S3-04-en-R05-r1', 'S3-04-en-R06-r1', 'S3-04-it-R01a-r1', 'S3-04-it-R01b-r1', 'S3-04-it-R01c-r1', 'S3-04-it-R02-r1', 'S3-04-it-R03-r1', 'S3-04-it-R04-r1', 'S3-04-it-R05-r1', 'S3-04-it-R06-r1', 'S3-04-de-R01a-r1', 'S3-04-de-R01b-r1', 'S3-04-de-R01c-r1', 'S3-04-de-R02-r1', 'S3-04-de-R03-r1', 'S3-04-de-R04-r1', 'S3-04-de-R05-r1', 'S3-04-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S304_THIRTYTWO_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-04')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SEVEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(32,32,32,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s304-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01a': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R01b': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R01c': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01a': ['/reading/0/paragraphs/0'], 'R01b': ['/reading/0/paragraphs/1', '/reading/0/paragraphs/2'], 'R01c': ['/reading/0/paragraphs/3', '/reading/0/paragraphs/4'], 'R02': ['/reading/1/paragraphs/0'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('أنسجة نباتية طرية ونامية كتير ممكن تحتوي نسبة مياه عالية. رقم تعليمي حوالي ٨٠–٩٥٪ ممكن يوصف بعض الأنسجة الطازة، لكنه مش نسبة ثابتة لكل جزء: السيقان الخشبية والبذور الجافة مختلفة جدًا. السؤال المفيد هنا المياه بتعمل إيه جوه الخلية والنبات، مش حفظ نسبة عامة.', 'أنسجة نباتية طرية ونامية كتير ممكن تحتوي نسبة مياه عالية. رقم تعليمي حوالي تمانين إلى خمسة وتسعين في المية ممكن يوصف بعض الأنسجة الطازة، لكنه مش نسبة ثابتة لكل جزء: السيقان الخشبية والبذور الجافة مختلفة جدا. السؤال المفيد هنا المياه بتعمل إيه جوه الخلية والنبات، مش حفظ نسبة عامة.'), ('التشبع يعني مسام التربة مليانة مياه. مع الجاذبية ومخرج صرف شغال، جزء من الزيادة يتحرك لأسفل؛ استمرار التشبع ممكن يقلل الأكسجين حوالين الجذور. السعة الحقلية FC هي المياه الباقية بعد خروج الجزء سهل الصرف وفق طريقة القياس، وهي حد علوي مرجعي للمياه المتاحة، مش رطوبة مثالية لكل محصول في كل وقت.\n\nعند نقطة الذبول الدائم PWP، التربة تحتفظ بمياه مش قادر النبات المرجعي يسحب منها كمية تكفي يرجع بيها تماسكه في الشروط المحددة. السعة المائية المتاحة AWC هي FC − PWP على نفس أساس القياس. المياه فوق FC تميل للصرف، وتحت PWP غير متاحة حسب التعريف. تشبيه الإسفنجة يساعدنا نفهم المنطقة الوسطى، لكنه مش قياس فعلي في الحقل للحدود دي.', 'التشبع يعني مسام التربة مليانة مياه. مع الجاذبية ومخرج صرف شغال، جزء من الزيادة يتحرك لأسفل؛ استمرار التشبع ممكن يقلل الأكسجين حوالين الجذور. السعة الحقلية هي المياه الباقية بعد خروج الجزء سهل الصرف وفق طريقة القياس، وهي حد علوي مرجعي للمياه المتاحة، مش رطوبة مثالية لكل محصول في كل وقت.\n\nعند نقطة الذبول الدائم، التربة تحتفظ بمياه مش قادر النبات المرجعي يسحب منها كمية تكفي يرجع بيها تماسكه في الشروط المحددة. السعة المائية المتاحة هي السعة الحقلية ناقص نقطة الذبول الدائم على نفس أساس القياس. المياه فوق السعة الحقلية تميل للصرف، وتحت نقطة الذبول الدائم غير متاحة حسب التعريف. تشبيه الإسفنجة يساعدنا نفهم المنطقة الوسطى، لكنه مش قياس فعلي في الحقل للحدود دي.'), ('الموضوع الأصلي ٩٠ دقيقة: ٤٥ للشرح والنقاش و٤٥ لورشة تشخيص الحقل. الخطوات اللي بعد كده تشرح احتياجات المحاصيل للمياه وطرق الري وعلامات الإجهاد والعناصر والتوصيات بالدليل. الخطوة دي بتأسس مفاهيم المياه في النبات والتربة، وما تمنحش اجتياز المهارات اللاحقة. المدرّب ممكن يستخدم برطمانات تربة وجزرة وكرفس في مياه ملوّنة كوسائل اختيارية.\n\nالافتتاح له ٥ دقايق: اتكلم مع زميلك حوالي دقيقة عن نبتة بيت مش سليمة، وبعدها اسمعوا أمثلة من كذا زوج. سجل العلامة وسبب محتمل، وارجع لفرضيتك لما يبقى فيه دليل.', 'الموضوع الأصلي تسعين دقيقة: خمسة وأربعين للشرح والنقاش وخمسة وأربعين لورشة تشخيص الحقل. الخطوات اللي بعد كده تشرح احتياجات المحاصيل للمياه وطرق الري وعلامات الإجهاد والعناصر والتوصيات بالدليل. الخطوة دي بتأسس مفاهيم المياه في النبات والتربة، وما تمنحش اجتياز المهارات اللاحقة. المدرّب ممكن يستخدم برطمانات تربة وجزرة وكرفس في مياه ملوّنة كوسائل اختيارية.\n\nالافتتاح له خمسة دقايق: اتكلم مع زميلك حوالي دقيقة عن نبتة بيت مش سليمة، وبعدها اسمعوا أمثلة من كذا زوج. سجل العلامة وسبب محتمل، وارجع لفرضيتك لما يبقى فيه دليل.'), ('المياه مادة داخلة في البناء الضوئي اللي بيستخدم الضوء لتكوين سكريات. الجذور بتمتص مياه وعناصر معدنية ذائبة، وبتتحرك داخل أوعية النقل. ضغط المياه داخل الخلايا الحية بيحافظ على الامتلاء والتماسك؛ لما يقل ممكن النبات يدبل.\n\nالمياه كمان بتتحرك من الجذور للأوراق وتخرج كبخار غالبًا من الثغور: ده النتح، وممكن يساعد في تبريد النبات. تبخر المياه من سطح التربة المكشوف عملية مختلفة. الاتنين بيساهموا في فقد مياه الحقل، لكن صعود مياه ملوّنة في عنق ورقة كرفس بيورّي مسار النقل، مش تبخر التربة ولا قياس كمية العناصر.', 'المياه مادة داخلة في البناء الضوئي اللي بيستخدم الضوء لتكوين سكريات. الجذور بتمتص مياه وعناصر معدنية ذائبة، وبتتحرك داخل أوعية النقل. ضغط المياه داخل الخلايا الحية بيحافظ على الامتلاء والتماسك؛ لما يقل ممكن النبات يدبل.\n\nالمياه كمان بتتحرك من الجذور للأوراق وتخرج كبخار غالبا من الثغور: ده النتح، وممكن يساعد في تبريد النبات. تبخر المياه من سطح التربة المكشوف عملية مختلفة. الاتنين بيساهموا في فقد مياه الحقل، لكن صعود مياه ملوّنة في عنق ورقة كرفس بيورّي مسار النقل، مش تبخر التربة ولا قياس كمية العناصر.'), ('لو مثال تدريبي قال FC = 30% وPWP = 12% على نفس الأساس الحجمي، الفرق 18 نقطة مئوية من حجم التربة. دي أرقام مثال مش قياس لحقل الطالب. عشان تتحول لكمية مياه في منطقة الجذور محتاج عمق جذور فعلي وبيانات طبقات التربة؛ ما تحولش الفرق مباشرة لجرعة ري.\n\nالتربة الرملية غالبًا تخزن مياه متاحة أقل لكل وحدة عمق من تربة متوسطة القوام، فالفترات الأقصر ممكن تبقى مناسبة لو طلب المحصول والجذور ونظام الري متشابهين. بعض الترب الطينية تحتفظ بمياه كلية أكتر لكن جزء منها صعب الاستعمال؛ اسم القوام ما يرتبش كل الحقول حسب المياه المفيدة. البناء والمادة العضوية والملوحة ونفاذ الجذور وعمر النبات والقياس يغيروا القرار. حدد التكرار والكمية من الموقع، مش من كلمة «رمل» أو «طين» بس.', 'لو مثال تدريبي قال السعة الحقلية بتساوي تلاتين في المية ونقطة الذبول الدائم بتساوي اتناشر في المية على نفس الأساس الحجمي، الفرق تمنتاشر نقطة مئوية من حجم التربة. دي أرقام مثال مش قياس لحقل الطالب. عشان تتحول لكمية مياه في منطقة الجذور محتاج عمق جذور فعلي وبيانات طبقات التربة؛ ما تحولش الفرق مباشرة لجرعة ري.\n\nالتربة الرملية غالبا تخزن مياه متاحة أقل لكل وحدة عمق من تربة متوسطة القوام، فالفترات الأقصر ممكن تبقى مناسبة لو طلب المحصول والجذور ونظام الري متشابهين. بعض الترب الطينية تحتفظ بمياه كلية أكتر لكن جزء منها صعب الاستعمال؛ اسم القوام ما يرتبش كل الحقول حسب المياه المفيدة. البناء والمادة العضوية والملوحة ونفاذ الجذور وعمر النبات والقياس يغيروا القرار. حدد التكرار والكمية من الموقع، مش من كلمة «رمل» أو «طين» بس.')], 'en': [('Across this 90-minute topic, the original teaching plan allocates 45 minutes to explanation/discussion and 45 minutes to a field-diagnosis workshop. Later steps address crop water requirements, irrigation methods, stress signs, nutrients and evidence-based management recommendations. This step establishes the plant and soil water concepts; it does not certify the later skills. The trainer may use soil jars, a carrot and colored-water celery as optional aids.\n\nThe opening takes five minutes: talk with a partner about an unhealthy houseplant for about one minute, then hear examples from several pairs. Record the sign and a possible cause; return to the hypothesis when evidence is available.', 'Across this ninety-minute topic, the original teaching plan allocates forty-five minutes to explanation, discussion and forty-five minutes to a field-diagnosis workshop. Later steps address crop water requirements, irrigation methods, stress signs, nutrients and evidence-based management recommendations. This step establishes the plant and soil water concepts; it does not certify the later skills. The trainer may use soil jars, a carrot and colored-water celery as optional aids.\n\nThe opening takes five minutes: talk with a partner about an unhealthy houseplant for about one minute, then hear examples from several pairs. Record the sign and a possible cause; return to the hypothesis when evidence is available.'), ("If a worked example gives FC = 30% and PWP = 12% by the same volume basis, the difference is 18 percentage points of soil volume. Those are labelled teaching values, not measured values for your field. A root-zone water amount also needs the relevant rooting depth and soil-layer data; do not turn the percentage-point result straight into an irrigation rate.\n\nSandy soils often store less plant-available water per unit depth than many medium-textured soils, so shorter intervals can be plausible when crop demand, roots and irrigation system are comparable. Some clay-rich soils hold more total water but much may be unavailable, and texture does not rank every field's usable root-zone water. Structure, organic matter, salinity, root penetration, crop growth stage and monitoring can change the decision. Judge frequency and volume from the site rather than the texture label alone.", "If a worked example gives a field capacity of thirty percent and a permanent wilting point of twelve percent by the same volume basis, the difference is eighteen percentage points of soil volume. Those are labelled teaching values, not measured values for your field. A root-zone water amount also needs the relevant rooting depth and soil-layer data; do not turn the percentage-point result straight into an irrigation rate.\n\nSandy soils often store less plant-available water per unit depth than many medium-textured soils, so shorter intervals can be plausible when crop demand, roots and irrigation system are comparable. Some clay-rich soils hold more total water but much may be unavailable, and texture does not rank every field's usable root-zone water. Structure, organic matter, salinity, root penetration, crop growth stage and monitoring can change the decision. Judge frequency and volume from the site rather than the texture label alone."), ('Many actively growing, soft plant tissues contain a high fraction of water. A teaching figure around 80–95% may describe some fresh tissues, but it is not a fixed percentage for every plant part: woody stems and dry seeds differ greatly. The useful question is what water does in living cells and the plant, not a universal tissue percentage.', 'Many actively growing, soft plant tissues contain a high fraction of water. A teaching figure around eighty to ninety-five percent may describe some fresh tissues, but it is not a fixed percentage for every plant part: woody stems and dry seeds differ greatly. The useful question is what water does in living cells and the plant, not a universal tissue percentage.'), ('Saturation means that soil pore space is filled with water. Under gravity and a functioning outlet, some excess water drains downward; prolonged saturation can limit oxygen to roots. Field capacity (FC) is the water remaining after readily drainable water has left under the stated method. It is an upper reference for plant-available storage, not a universal ideal moisture level for all crops at every moment.\n\nAt the permanent wilting point (PWP), the soil holds water too tightly for the reference plant to recover turgor under the defined conditions. Plant-available water capacity (AWC) is the difference FC − PWP on the same measurement basis. Water above FC tends to drain; water below PWP is not available by this definition. The sponge analogy helps identify the middle range, but squeezing a sponge is not a field measurement of FC, PWP or AWC.', 'Saturation means that soil pore space is filled with water. Under gravity and a functioning outlet, some excess water drains downward; prolonged saturation can limit oxygen to roots. Field capacity is the water remaining after readily drainable water has left under the stated method. It is an upper reference for plant-available storage, not a universal ideal moisture level for all crops at every moment.\n\nAt the permanent wilting point, the soil holds water too tightly for the reference plant to recover turgor under the defined conditions. Plant-available water capacity is the difference field capacity minus permanent wilting point on the same measurement basis. Water above field capacity tends to drain; water below permanent wilting point is not available by this definition. The sponge analogy helps identify the middle range, but squeezing a sponge is not a field measurement of field capacity, permanent wilting point or plant-available water capacity.'), ('The five wider-topic outcomes are: identify common crop water needs; describe irrigation methods and their suitability; recognise water-stress signs; identify key nutrients and possible deficiency signs; and recommend basic water/nutrient management after corroborating crop, soil and symptom evidence. Revisit these at the topic end. They are not all certified by this single step.\n\nClass materials are a whiteboard or flip chart, markers, projector and prepared diagnostic case cards. Optional aids are sand, loam and clay in clear jars, carrots and prepared coloured-water celery. A sponge is an analogy for the available interval, not a measuring instrument.', 'The five wider-topic outcomes are: identify common crop water needs; describe irrigation methods and their suitability; recognise water-stress signs; identify key nutrients and possible deficiency signs; and recommend basic water, nutrient management after corroborating crop, soil and symptom evidence. Revisit these at the topic end. They are not all certified by this single step.\n\nClass materials are a whiteboard or flip chart, markers, projector and prepared diagnostic case cards. Optional aids are sand, loam and clay in clear jars, carrots and prepared coloured-water celery. A sponge is an analogy for the available interval, not a measuring instrument.')], 'it': [('I cinque obiettivi del tema sono riconoscere fabbisogni idrici comuni, descrivere metodi irrigui e idoneità, riconoscere stress idrico, individuare nutrienti e possibili carenze e proporre gestione di acqua/nutrienti dopo riscontro con coltura, suolo e segni. Rivederli a fine tema: questo solo passo non li certifica tutti.\n\nMateriali: lavagna o fogli mobili, pennarelli, proiettore e schede diagnostiche preparate. Facoltativi: sabbia, franco e argilla in vasi trasparenti, carote e sedano preparato in acqua colorata. La spugna è analogia dell’intervallo disponibile, non strumento di misura.', 'I cinque obiettivi del tema sono riconoscere fabbisogni idrici comuni, descrivere metodi irrigui e idoneità, riconoscere stress idrico, individuare nutrienti e possibili carenze e proporre gestione di acqua, nutrienti dopo riscontro con coltura, suolo e segni. Rivederli a fine tema: questo solo passo non li certifica tutti.\n\nMateriali: lavagna o fogli mobili, pennarelli, proiettore e schede diagnostiche preparate. Facoltativi: sabbia, franco e argilla in vasi trasparenti, carote e sedano preparato in acqua colorata. La spugna è analogia dell’intervallo disponibile, non strumento di misura.'), ('Il tema originale dura 90 minuti: 45 di spiegazione/discussione e 45 di laboratorio di diagnosi sul campo. Le tappe successive trattano fabbisogni idrici, metodi irrigui, stress, nutrienti e raccomandazioni basate su prove. Qui si stabiliscono i concetti dell’acqua, senza certificare quelle abilità successive. Il formatore può usare facoltativamente vasetti di suolo, carota e sedano in acqua colorata.\n\nL’apertura dura cinque minuti: parlare circa un minuto con un compagno di una pianta domestica malata, poi ascoltare alcune coppie. Annotare segno e ipotesi e rivederli alla luce di prove.', 'Il tema originale dura novanta minuti: quarantacinque di spiegazione, discussione e quarantacinque di laboratorio di diagnosi sul campo. Le tappe successive trattano fabbisogni idrici, metodi irrigui, stress, nutrienti e raccomandazioni basate su prove. Qui si stabiliscono i concetti dell’acqua, senza certificare quelle abilità successive. Il formatore può usare facoltativamente vasetti di suolo, carota e sedano in acqua colorata.\n\nL’apertura dura cinque minuti: parlare circa un minuto con un compagno di una pianta domestica malata, poi ascoltare alcune coppie. Annotare segno e ipotesi e rivederli alla luce di prove.'), ('In un esempio dichiarato con FC = 30% e PWP = 12% sulla stessa base volumetrica, la differenza è 18 punti percentuali del volume del suolo. Sono valori didattici, non misure del proprio campo. Una quantità nella zona radicale richiede profondità e dati degli strati: non convertire direttamente il risultato in dose irrigua.\n\nLa sabbia spesso immagazzina meno acqua disponibile per unità di profondità di molti suoli medi, quindi intervalli più brevi possono essere plausibili a pari domanda, radici e impianto. Alcune argille trattengono più acqua totale ma una quota può essere inutilizzabile; la tessitura non classifica tutte le riserve accessibili. Struttura, organico, salinità, penetrazione radicale, stadio e monitoraggio cambiano la decisione. Stabilire frequenza e volume dal sito, non dal solo nome del suolo.', 'In un esempio dichiarato con capacità di campo uguale a trenta per cento e punto di appassimento permanente uguale a dodici per cento sulla stessa base volumetrica, la differenza è diciotto punti percentuali del volume del suolo. Sono valori didattici, non misure del proprio campo. Una quantità nella zona radicale richiede profondità e dati degli strati: non convertire direttamente il risultato in dose irrigua.\n\nLa sabbia spesso immagazzina meno acqua disponibile per unità di profondità di molti suoli medi, quindi intervalli più brevi possono essere plausibili a pari domanda, radici e impianto. Alcune argille trattengono più acqua totale ma una quota può essere inutilizzabile; la tessitura non classifica tutte le riserve accessibili. Struttura, organico, salinità, penetrazione radicale, stadio e monitoraggio cambiano la decisione. Stabilire frequenza e volume dal sito, non dal solo nome del suolo.'), ('Molti tessuti molli e in crescita contengono molta acqua. Una cifra didattica di circa 80–95% può descrivere alcuni tessuti freschi, ma non tutti gli organi: fusti legnosi e semi secchi differiscono nettamente. La domanda importante è quale funzione l’acqua svolge nelle cellule e nella pianta, non una percentuale universale.', 'Molti tessuti molli e in crescita contengono molta acqua. Una cifra didattica di circa ottanta a novantacinque per cento può descrivere alcuni tessuti freschi, ma non tutti gli organi: fusti legnosi e semi secchi differiscono nettamente. La domanda importante è quale funzione l’acqua svolge nelle cellule e nella pianta, non una percentuale universale.'), ('Saturazione: i pori del suolo sono pieni d’acqua. Se gravità e via di uscita lo permettono, l’eccesso drena verso il basso; saturazione prolungata limita l’ossigeno delle radici. Capacità di campo (FC): acqua rimasta dopo il drenaggio della frazione facilmente mobile secondo il metodo dichiarato. È un riferimento superiore per la riserva disponibile, non l’umidità ideale per ogni specie in ogni momento.\n\nAl punto di appassimento permanente (PWP) il suolo trattiene acqua troppo fortemente perché la pianta di riferimento recuperi il turgore nelle condizioni definite. Capacità d’acqua disponibile (AWC) = FC − PWP sulla stessa base di misura. Sopra FC l’acqua tende a drenare; sotto PWP non è disponibile per definizione. La spugna aiuta a comprendere la fascia centrale, ma strizzarla non misura i tre parametri in campo.', 'Saturazione: i pori del suolo sono pieni d’acqua. Se gravità e via di uscita lo permettono, l’eccesso drena verso il basso; saturazione prolungata limita l’ossigeno delle radici. Capacità di campo: acqua rimasta dopo il drenaggio della frazione facilmente mobile secondo il metodo dichiarato. È un riferimento superiore per la riserva disponibile, non l’umidità ideale per ogni specie in ogni momento.\n\nAl punto di appassimento permanente il suolo trattiene acqua troppo fortemente perché la pianta di riferimento recuperi il turgore nelle condizioni definite. Capacità d’acqua disponibile uguale a capacità di campo meno punto di appassimento permanente sulla stessa base di misura. Sopra la capacità di campo l’acqua tende a drenare; sotto il punto di appassimento permanente non è disponibile per definizione. La spugna aiuta a comprendere la fascia centrale, ma strizzarla non misura i tre parametri in campo.')], 'de': [('Das gesamte Originalthema umfasst 90 Minuten: 45 Erklärung und Diskussion, 45 Werkstatt zur Felddiagnose. Spätere Schritte behandeln Kulturwasserbedarf, Bewässerungsarten, Stresszeichen, Nährstoffe und belegte Maßnahmen. Hier werden Pflanzen- und Bodenwassergrundlagen gelegt; spätere Fertigkeiten gelten dadurch nicht als bestanden. Bodenproben im Glas, Karotte und Stangensellerie in gefärbtem Wasser sind optionale Lehrhilfen.\n\nDer Einstieg dauert fünf Minuten: etwa eine Minute zu zweit über eine kranke Zimmerpflanze sprechen, dann mehrere Paare hören. Zeichen und Hypothese notieren und später anhand von Belegen überprüfen.', 'Das gesamte Originalthema umfasst neunzig Minuten: fünfundvierzig Erklärung und Diskussion, fünfundvierzig Werkstatt zur Felddiagnose. Spätere Schritte behandeln Kulturwasserbedarf, Bewässerungsarten, Stresszeichen, Nährstoffe und belegte Maßnahmen. Hier werden Pflanzen- und Bodenwassergrundlagen gelegt; spätere Fertigkeiten gelten dadurch nicht als bestanden. Bodenproben im Glas, Karotte und Stangensellerie in gefärbtem Wasser sind optionale Lehrhilfen.\n\nDer Einstieg dauert fünf Minuten: etwa eine Minute zu zweit über eine kranke Zimmerpflanze sprechen, dann mehrere Paare hören. Zeichen und Hypothese notieren und später anhand von Belegen überprüfen.'), ('Die fünf Themenziele sind häufiger Kulturwasserbedarf, Bewässerungsarten und Eignung, Wasserstresszeichen, wichtige Nährstoffe und mögliche Mängel sowie belegte Wasser-/Nährstoffmaßnahmen nach Abgleich von Kultur, Boden und Symptomen. Am Themenende wieder aufgreifen; dieser einzelne Schritt zertifiziert nicht alle Ziele.\n\nMaterial: Tafel oder Flipchart, Stifte, Projektor und vorbereitete Diagnosekarten. Optional Sand, Lehm und Ton in klaren Gläsern, Karotten und vorbereiteter Stangensellerie in Farbwasser. Der Schwamm ist ein Vergleich für den verfügbaren Bereich, kein Messgerät.', 'Die fünf Themenziele sind häufiger Kulturwasserbedarf, Bewässerungsarten und Eignung, Wasserstresszeichen, wichtige Nährstoffe und mögliche Mängel sowie belegte Wasser-, Nährstoffmaßnahmen nach Abgleich von Kultur, Boden und Symptomen. Am Themenende wieder aufgreifen; dieser einzelne Schritt zertifiziert nicht alle Ziele.\n\nMaterial: Tafel oder Flipchart, Stifte, Projektor und vorbereitete Diagnosekarten. Optional Sand, Lehm und Ton in klaren Gläsern, Karotten und vorbereiteter Stangensellerie in Farbwasser. Der Schwamm ist ein Vergleich für den verfügbaren Bereich, kein Messgerät.'), ('Gibt ein gekennzeichnetes Rechenbeispiel FC = 30% und PWP = 12% auf gleicher Volumenbasis an, beträgt die Differenz 18 Prozentpunkte des Bodenvolumens. Diese Zahlen sind Lehrwerte, keine Feldmessung. Für eine Wassermenge im Wurzelraum braucht man tatsächliche Wurzeltiefe und Schichtdaten; das Ergebnis nicht direkt in Bewässerungsmenge umwandeln.\n\nSandböden speichern je Tiefe häufig weniger pflanzenverfügbares Wasser als viele mittlere Böden; kürzere Intervalle können bei vergleichbarem Pflanzenbedarf, Wurzeln und System plausibel sein. Manche tonreichen Böden halten insgesamt mehr Wasser, doch vieles kann unzugänglich sein, und die Textur ordnet nicht jedes Feld. Struktur, organische Substanz, Salz, Durchwurzelung, Stadium und Feuchtemessung beeinflussen die Entscheidung. Häufigkeit und Volumen aus dem Standort statt nur aus „Sand“ oder „Ton“ ableiten.', 'Gibt ein gekennzeichnetes Rechenbeispiel Feldkapazität gleich dreißig Prozent und permanenter Welkepunkt gleich zwölf Prozent auf gleicher Volumenbasis an, beträgt die Differenz achtzehn Prozentpunkte des Bodenvolumens. Diese Zahlen sind Lehrwerte, keine Feldmessung. Für eine Wassermenge im Wurzelraum braucht man tatsächliche Wurzeltiefe und Schichtdaten; das Ergebnis nicht direkt in Bewässerungsmenge umwandeln.\n\nSandböden speichern je Tiefe häufig weniger pflanzenverfügbares Wasser als viele mittlere Böden; kürzere Intervalle können bei vergleichbarem Pflanzenbedarf, Wurzeln und System plausibel sein. Manche tonreichen Böden halten insgesamt mehr Wasser, doch vieles kann unzugänglich sein, und die Textur ordnet nicht jedes Feld. Struktur, organische Substanz, Salz, Durchwurzelung, Stadium und Feuchtemessung beeinflussen die Entscheidung. Häufigkeit und Volumen aus dem Standort statt nur aus „Sand“ oder „Ton“ ableiten.'), ('Sättigung heißt, dass die Bodenporen mit Wasser gefüllt sind. Bei wirksamer Schwerkraft und Abfluss kann überschüssiges Wasser nach unten ablaufen; längere Sättigung kann Wurzelsauerstoff begrenzen. Feldkapazität (FC) ist das Wasser nach Abfluss leicht drainierbarer Anteile unter der angegebenen Methode. Sie ist eine obere Bezugsgröße für verfügbaren Speicher, nicht zu jedem Zeitpunkt die ideale Feuchte jeder Kultur.\n\nBeim permanenten Welkepunkt (PWP) hält der Boden Wasser für die definierte Pflanze zu fest, um unter definierten Bedingungen wieder Turgor zu erreichen. Nutzbare Wasserkapazität (AWC) ist FC − PWP auf gleicher Messbasis. Wasser oberhalb FC neigt zur Drainage, unterhalb PWP ist es nach dieser Definition nicht verfügbar. Ein Schwamm veranschaulicht die Mitte, ist aber keine Feldmessung der Grenzen.', 'Sättigung heißt, dass die Bodenporen mit Wasser gefüllt sind. Bei wirksamer Schwerkraft und Abfluss kann überschüssiges Wasser nach unten ablaufen; längere Sättigung kann Wurzelsauerstoff begrenzen. Feldkapazität ist das Wasser nach Abfluss leicht drainierbarer Anteile unter der angegebenen Methode. Sie ist eine obere Bezugsgröße für verfügbaren Speicher, nicht zu jedem Zeitpunkt die ideale Feuchte jeder Kultur.\n\nBeim permanenten Welkepunkt hält der Boden Wasser für die definierte Pflanze zu fest, um unter definierten Bedingungen wieder Turgor zu erreichen. Nutzbare Wasserkapazität ist Feldkapazität minus permanenter Welkepunkt auf gleicher Messbasis. Wasser oberhalb der Feldkapazität neigt zur Drainage, unterhalb des permanenten Welkepunkts ist es nach dieser Definition nicht verfügbar. Ein Schwamm veranschaulicht die Mitte, ist aber keine Feldmessung der Grenzen.'), ('Viele frische, weiche Wachstumsgewebe enthalten viel Wasser. Die Lehrzahl etwa 80–95% kann einige frische Gewebe beschreiben, ist aber kein fester Anteil in allen Pflanzenteilen: verholzte Stängel und trockene Samen unterscheiden sich stark. Wesentlich ist die Aufgabe des Wassers in Zellen und Pflanze, nicht ein allgemeiner Prozentsatz.', 'Viele frische, weiche Wachstumsgewebe enthalten viel Wasser. Die Lehrzahl etwa achtzig bis fünfundneunzig Prozent kann einige frische Gewebe beschreiben, ist aber kein fester Anteil in allen Pflanzenteilen: verholzte Stängel und trockene Samen unterscheiden sich stark. Wesentlich ist die Aufgabe des Wassers in Zellen und Pflanze, nicht ein allgemeiner Prozentsatz.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s304-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_EIGHT_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':8,'maximumBlindReviewPerLane':8,'maximumASRPerLane':8,'maximumTTSAggregate':32,'maximumBlindAggregate':32,'maximumASRAggregate':32,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
