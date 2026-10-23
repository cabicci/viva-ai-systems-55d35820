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
IDS = ('S3-07-ar-EG-R01a-r1', 'S3-07-ar-EG-R01b-r1', 'S3-07-ar-EG-R02-r1', 'S3-07-ar-EG-R03a-r1', 'S3-07-ar-EG-R03b-r1', 'S3-07-ar-EG-R04-r1', 'S3-07-ar-EG-R05a-r1', 'S3-07-ar-EG-R05b-r1', 'S3-07-ar-EG-R06-r1', 'S3-07-ar-EG-R07-r1', 'S3-07-en-R01a-r1', 'S3-07-en-R01b-r1', 'S3-07-en-R02-r1', 'S3-07-en-R03a-r1', 'S3-07-en-R03b-r1', 'S3-07-en-R04-r1', 'S3-07-en-R05a-r1', 'S3-07-en-R05b-r1', 'S3-07-en-R06-r1', 'S3-07-en-R07-r1', 'S3-07-it-R01a-r1', 'S3-07-it-R01b-r1', 'S3-07-it-R02-r1', 'S3-07-it-R03a-r1', 'S3-07-it-R03b-r1', 'S3-07-it-R04-r1', 'S3-07-it-R05a-r1', 'S3-07-it-R05b-r1', 'S3-07-it-R06-r1', 'S3-07-it-R07-r1', 'S3-07-de-R01a-r1', 'S3-07-de-R01b-r1', 'S3-07-de-R02-r1', 'S3-07-de-R03a-r1', 'S3-07-de-R03b-r1', 'S3-07-de-R04-r1', 'S3-07-de-R05a-r1', 'S3-07-de-R05b-r1', 'S3-07-de-R06-r1', 'S3-07-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S307_FORTY_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_TEN_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(40,40,40,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s307-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01a': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R01b': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R02': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R03a': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03b': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05a': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R05b': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R06': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R07': ('B', 'Kore', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01a': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R01b': ['/reading/0/paragraphs/2'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03a': ['/reading/2/paragraphs/0'], 'R03b': ['/reading/2/paragraphs/1', '/reading/2/paragraphs/2'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05a': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R05b': ['/reading/4/paragraphs/2'], 'R06': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1'], 'R07': ['/reading/6/paragraphs/0', '/reading/6/paragraphs/1', '/reading/6/paragraphs/2']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('ابدأ بتمهيد نبات البيت لمدة٥دقايق: افتكر نبات تعبان، واتكلم مع زميلك دقيقة عن شكله وأسبابه المحتملة، وبعدها شاركوا. أدوات الموضوع: سبورة أو لوحة وورق، أقلام، بروجيكتور وبطاقات حالات جاهزة؛ برطمانات التربة والكرفس في مياه ملونة عروض اختيارية اتشرحت قبل كده.', 'ابدأ بتمهيد نبات البيت لمدة خمسة دقايق: افتكر نبات تعبان، واتكلم مع زميلك دقيقة عن شكله وأسبابه المحتملة، وبعدها شاركوا. أدوات الموضوع: سبورة أو لوحة وورق، أقلام، بروجيكتور وبطاقات حالات جاهزة؛ برطمانات التربة والكرفس في مياه ملونة عروض اختيارية اتشرحت قبل كده.'), ('العناصر الأساسية N وP وK اسمها أحيانًا الثلاثة الكبار؛ والكالسيوم Ca والمغنيسيوم Mg والكبريت S عناصر كبرى كمان. الحديد Fe والمنجنيز Mn والزنك Zn عناصر صغرى يحتاجها النبات بكميات أقل، مش أقل أهمية. رمز المغنيسيوم Mg، أبدًا مش K؛ حرف K للبوتاسيوم.', 'العناصر الأساسية إن وبي وكي اسمها أحيانًا الثلاثة الكبار؛ والكالسيوم سي إيه والمغنيسيوم إم جي والكبريت إس عناصر كبرى كمان. الحديد إف إي والمنجنيز إم إن والزنك زد إن عناصر صغرى يحتاجها النبات بكميات أقل، مش أقل أهمية. رمز المغنيسيوم إم جي، أبدًا مش كي؛ حرف كي للبوتاسيوم.'), ('المثال الأصلي يرجّح نقص الفوسفور ويقترح سماد بداية مثل فوسفات ثنائي الأمونيوم DAP، لكن لون بنفسجي مع تربة ثقيلة باردة مش إثبات إن النبات محتاج إضافة P. البرد أو البلل ممكن يحدّ الامتصاص حتى لو تحليل P في التربة كافٍ. افحص حرارة التربة والصرف والجذور ومرحلة النمو وتحليل P المناسب والإرشاد المحلي، وشوف هل النمو يتحسن مع الدفا.\n\nلو العجز اتثبت، خطط لمصدر P وكمية مناسبة محليًا، ووقت ومكان آمنين قرب الجذور الصغيرة. وضعه في شريط يتبع تعليمات المنتج والمسافة الآمنة عن البذرة؛ إضافة DAP فورًا أو لمسه المباشر للبذرة مش رد عام.', 'المثال الأصلي يرجّح نقص الفوسفور ويقترح سماد بداية مثل فوسفات ثنائي الأمونيوم دي إيه بي، لكن لون بنفسجي مع تربة ثقيلة باردة مش إثبات إن النبات محتاج إضافة فوسفور. البرد أو البلل ممكن يحدّ الامتصاص حتى لو تحليل الفوسفور في التربة كافٍ. افحص حرارة التربة والصرف والجذور ومرحلة النمو وتحليل الفوسفور المناسب والإرشاد المحلي، وشوف هل النمو يتحسن مع الدفا.\n\nلو العجز اتثبت، خطط لمصدر فوسفور وكمية مناسبة محليًا، ووقت ومكان آمنين قرب الجذور الصغيرة. وضعه في شريط يتبع تعليمات المنتج والمسافة الآمنة عن البذرة؛ إضافة دي إيه بي فورًا أو لمسه المباشر للبذرة مش رد عام.'), ('المدرّب يجهز ثلاث أو أربع بطاقات فيها محصول وتربة وجو وأعراض واضحة. في مجموعات من ثلاثة أو أربعة، خدوا حالتين مختلفتين. لكل حالة سجّلوا الملاحظة ومكان وعمر الورق المصاب والفرضيات المنافسة والأدلة المطلوبة وأولوية الماء وخطة 4R مشروطة. جهزوا حالة واحدة للعرض. قائمة بسيطة تسند المبتدئ؛ حالة متقدمة ممكن تجمع إجهادين أو ضرر آفات وتسأل عن الكلفة. الصور أو الرسم يساعدوا الشرح لكن ما يحدّدوش النتيجة.\n\nالوقت الأصلي: دقيقتان للتعليمات والتقسيم، ٢٥ دقيقة لتحليل حالتين، ١٥ دقيقة لعرض ثلاث مجموعات ومناقشتها (نحو ٥ دقائق لكل واحدة)، و٣ دقائق للخلاصة وبطاقة الخروج. سؤالا الخروج عن شكل حواف الورق مع K وطريقة ري معللة لتربة رملية جدًا. كل طالب يسلّم سجل تفكيره الفردي؛ عرض المجموعة وحده ما يثبتش اجتياز الفرد.\n\nملخص الأصل٢٥دقيقة شغل و٢٠دقيقة نقاش بيوصف نفس ورشة٤٥دقيقة بتقسيم٢+٢٥+١٥+٣، مش نشاط تاني. احتفظ بسجلين لحالتين مختلفتين وشرح واحد تدافع عنه. بيانات الحقل ومراجعة المدرّب ما بتتملاش من عندنا.', 'المدرّب يجهز تلات أو أربع بطاقات فيها محصول وتربة وجو وأعراض واضحة. في مجموعات من تلاتة أو أربعة، خدوا حالتين مختلفتين. لكل حالة سجّلوا الملاحظة ومكان وعمر الورق المصاب والفرضيات المنافسة والأدلة المطلوبة وأولوية الماء وخطة قواعد المصدر والكمية والوقت والمكان مشروطة. جهزوا حالة واحدة للعرض. قائمة بسيطة تسند المبتدئ؛ حالة متقدمة ممكن تجمع إجهادين أو ضرر آفات وتسأل عن الكلفة. الصور أو الرسم يساعدوا الشرح لكن ما يحدّدوش النتيجة.\n\nالوقت الأصلي: دقيقتين للتعليمات والتقسيم، خمسة وعشرين دقيقة لتحليل حالتين، خمستاشر دقيقة لعرض تلات مجموعات ومناقشتها (حوالي خمس دقايق لكل واحدة)، وتلات دقايق للخلاصة وبطاقة الخروج. سؤالا الخروج عن شكل حواف الورق مع كي وطريقة ري معللة لتربة رملية جدًا. كل طالب يسلّم سجل تفكيره الفردي؛ عرض المجموعة وحده ما يثبتش اجتياز الفرد.\n\nملخص الأصل خمسة وعشرين دقيقة شغل و عشرين دقيقة نقاش بيوصف نفس ورشة خمسة وأربعين دقيقة بتقسيم اتنين زائد خمسة وعشرين زائد خمستاشر زائد تلاتة، مش نشاط تاني. احتفظ بسجلين لحالتين مختلفتين وشرح واحد تدافع عنه. بيانات الحقل ومراجعة المدرّب ما بتتملاش من عندنا.'), ('المصدر المناسب: اختار العنصر المطلوب فعلًا ومنتجًا متوافقًا مع المحصول وتحليل التربة والظروف. اليوريا ونترات الأمونيوم مصدران للنيتروجين، أمثلة مش علاج تلقائي لأي ورقة صفراء. الكمية المناسبة: اعتمد على تحليل تربة أو نسيج مناسب واحتياج النبات والموجود أصلًا وإرشاد محلي متحقق منه. القليل ممكن لا يكفي والزيادة تضيع فلوسًا وتضر النبات أو الماء.\n\nالوقت المناسب: اربطه بامتصاص المحصول وتجنب ظروف الفقد العالي، زي تربة مغمورة أو أمطار غزيرة. بعض برامج N بتقسم الإضافة؛ «كله عند الزراعة» أو «كل أسبوع» مش قاعدة عامة. المكان المناسب: حط العنصر حيث تصل له الجذور من غير ضرر للبذرة أو الورق. وضع الفوسفور في شريط قريب ممكن يفيد لأنه قليل الحركة في ظروف مناسبة، لكن النثر وغيره ممكن يناسب ظروفًا تانية. راجع بطاقة المنتج وقواعد التداول المحلية وحدود أمان البذور. الأربع قواعد تدعم المحصول وتقلل الفقد والجريان غير اللازم.', 'المصدر المناسب: اختار العنصر المطلوب فعلًا ومنتجًا متوافقًا مع المحصول وتحليل التربة والظروف. اليوريا ونترات الأمونيوم مصدران للنيتروجين، أمثلة مش علاج تلقائي لأي ورقة صفراء. الكمية المناسبة: اعتمد على تحليل تربة أو نسيج مناسب واحتياج النبات والموجود أصلًا وإرشاد محلي متحقق منه. القليل ممكن ما يكفيش والزيادة تضيع فلوس وتضر النبات أو الماء.\n\nالوقت المناسب: اربطه بامتصاص المحصول وتجنب ظروف الفقد العالي، زي تربة مغمورة أو أمطار غزيرة. بعض برامج النيتروجين بتقسم الإضافة؛ «كله عند الزراعة» أو «كل أسبوع» مش قاعدة عامة. المكان المناسب: حط العنصر حيث تصل له الجذور من غير ضرر للبذرة أو الورق. وضع الفوسفور في شريط قريب ممكن يفيد لأنه قليل الحركة في ظروف مناسبة، لكن النثر وغيره ممكن يناسب ظروفًا تانية. راجع بطاقة المنتج وقواعد التداول المحلية وحدود أمان البذور. الأربع قواعد تدعم المحصول وتقلل الفقد والجريان غير اللازم.'), ('سؤال تفكير: ليه وضع الفوسفور في شريط ممكن يساعد امتصاصه؟ حركة P في التربة قليلة نسبيًا، فالمكان المناسب ممكن يقرّبه من الجذور الصغيرة. ده ما يخليش كل شريط أحسن من النثر، ولا يسمح بملامسة تضر البذرة. المنتج والتربة والمحصول والمكان الآمن هم اللي يحددوا الاختيار.', 'سؤال تفكير: ليه وضع الفوسفور في شريط ممكن يساعد امتصاصه؟ حركة الفوسفور في التربة قليلة نسبيًا، فالمكان المناسب ممكن يقرّبه من الجذور الصغيرة. ده ما يخليش كل شريط أحسن من النثر، ولا يسمح بملامسة تضر البذرة. المنتج والتربة والمحصول والمكان الآمن هم اللي يحددوا الاختيار.'), ('نبات زينة دابل في البيت أو ورقة صفرا في الحقل يفتحوا سؤال، مش يكمّلوا التشخيص. اوصف العرض ومكانه في الورق القديم أو الجديد ووقت ظهوره، وقوام التربة ورطوبتها، والجو والصرف وحالة الجذور. بعدين حط أكتر من احتمال واختار ملاحظات أو تحاليل تفرّق بينهم. راجع فرضيتك لما النتيجة تظهر.\n\nالموضوع الأصلي ٩٠ دقيقة: ٤٥ للشرح والنقاش و٤٥ لورشة تشخيص الحالات. أساسيات الماء والري اتقدمت في خطوات قبل دي؛ هنا بنطبقها مع التغذية. الورشة تمرين حالات منظم، مش إثبات إن الطالب شخّص حقل مزارع بنفسه.', 'نبات زينة دابل في البيت أو ورقة صفرا في الحقل يفتحوا سؤال، مش يكمّلوا التشخيص. اوصف العرض ومكانه في الورق القديم أو الجديد ووقت ظهوره، وقوام التربة ورطوبتها، والجو والصرف وحالة الجذور. بعدين حط أكتر من احتمال واختار ملاحظات أو تحاليل تفرّق بينهم. راجع فرضيتك لما النتيجة تظهر.\n\nالموضوع الأصلي تسعين دقيقة: خمسة وأربعين للشرح والنقاش و خمسة وأربعين لورشة تشخيص الحالات. أساسيات الماء والري اتقدمت في خطوات قبل دي؛ هنا بنطبقها مع التغذية. الورشة تمرين حالات منظم، مش إثبات إن الطالب شخّص حقل مزارع بنفسه.'), ('نقص النيتروجين المتحرك ممكن يبدأ باصفرار عام في الورق القديم السفلي. إجهاد الفوسفور ممكن يعمل تقزمًا ولونًا بنفسجيًا في الذرة الصغيرة، غالبًا على نسيج أقدم، خصوصًا لو التربة باردة وبتقلل الامتصاص. نقص البوتاسيوم ممكن يصفرّ أو يحرق حواف الورق القديم. انتقال N وP وK داخل النبات يخلي الورق القديم دليلًا مفيدًا، لكن الأعراض بتختلف بالمحصول ولها أسباب تانية. استخدم تذكير «N: القديم يفقد الأخضر، P: ممكن يظهر بنفسجي، K: حواف الورق القديم» كبداية فحص، مش تشخيص من اللون وحده. في شكل نقص K بحواف ورقة الذرة، وسط الورقة ممكن يفضل أخضر؛ الفرق ده برضه علامة للفحص، مش تشخيص مؤكد.\n\nالفوسفور له دور في نقل الطاقة ونمو الجذور، والبوتاسيوم بيساعد تنظيم المياه ووظايف النبات. ورق الذرة القديم ممكن يلفت نظرك لمشكلة N أوP أوK، لكن لازم تجمع عمر الورقة وشكل العلامة والجذور والظروف قبل التفسير.', 'نقص النيتروجين المتحرك ممكن يبدأ باصفرار عام في الورق القديم السفلي. إجهاد الفوسفور ممكن يعمل تقزمًا ولونًا بنفسجيًا في الذرة الصغيرة، غالبًا على نسيج أقدم، خصوصًا لو التربة باردة وبتقلل الامتصاص. نقص البوتاسيوم ممكن يصفرّ أو يحرق حواف الورق القديم. انتقال النيتروجين والفوسفور والبوتاسيوم داخل النبات يخلي الورق القديم دليلًا مفيدًا، لكن الأعراض بتختلف بالمحصول ولها أسباب تانية. استخدم تذكير «إن: القديم يفقد الأخضر، بي: ممكن يظهر بنفسجي، كي: حواف الورق القديم» كبداية فحص، مش تشخيص من اللون وحده. في شكل نقص كي بحواف ورقة الذرة، وسط الورقة ممكن يفضل أخضر؛ الفرق ده برضه علامة للفحص، مش تشخيص مؤكد.\n\nالفوسفور له دور في نقل الطاقة ونمو الجذور، والبوتاسيوم بيساعد تنظيم المياه ووظايف النبات. ورق الذرة القديم ممكن يلفت نظرك لمشكلة في النيتروجين أو الفوسفور أو البوتاسيوم، لكن لازم تجمع عمر الورقة وشكل العلامة والجذور والظروف قبل التفسير.')], 'en': [("A drooping houseplant or a yellow field leaf starts a question; it does not finish a diagnosis. Describe the symptom, its location on old or new tissue, when it appeared, the soil texture and moisture, weather, drainage and root condition. Then form competing hypotheses and choose observations or tests that distinguish them. Revisit the hypothesis when the evidence arrives.\n\nThe original topic is 90 minutes: 45 minutes of instruction/discussion and a 45-minute field-diagnosis workshop. Its water and irrigation foundations are introduced in earlier steps; this step applies them with the nutrient concepts. The workshop is a structured case exercise, not proof that a student has physically diagnosed a farmer's field.", "A drooping houseplant or a yellow field leaf starts a question; it does not finish a diagnosis. Describe the symptom, its location on old or new tissue, when it appeared, the soil texture and moisture, weather, drainage and root condition. Then form competing hypotheses and choose observations or tests that distinguish them. Revisit the hypothesis when the evidence arrives.\n\nThe original topic is ninety minutes: forty-five minutes of instruction, discussion and a forty-five-minute field-diagnosis workshop. Its water and irrigation foundations are introduced in earlier steps; this step applies them with the nutrient concepts. The workshop is a structured case exercise, not proof that a student has physically diagnosed a farmer's field."), ('Begin with the five-minute houseplant hook: think of an unhealthy plant, discuss its appearance and possible causes with a partner for one minute, then share. The parent topic uses a board/flipchart, markers, projector and prepared cards; soil jars and coloured-water celery are optional demonstrations already covered earlier.', 'Begin with the five-minute houseplant hook: think of an unhealthy plant, discuss its appearance and possible causes with a partner for one minute, then share. The parent topic uses a board, flipchart, markers, projector and prepared cards; soil jars and coloured-water celery are optional demonstrations already covered earlier.'), ("Right source: match the nutrient actually needed and a compatible product to the crop, soil test and circumstances. Urea and ammonium nitrate supply nitrogen; they are examples, not automatic cures for any yellow leaf. Right rate: use appropriate soil or tissue evidence, crop demand, existing nutrient supply and locally validated guidance. Too little may fail; too much wastes money and can harm plants or water quality.\n\nRight time: match crop uptake and avoid high loss conditions such as waterlogged or heavily raining periods. Some nitrogen programmes split applications; 'all at planting' and 'every week' are not universal. Right place: put nutrients where roots can access them without harming seed or foliage; a band can help relatively immobile phosphorus under suitable placement, but broadcast or other methods may be appropriate in different conditions. Check product label, local handling rules and seed-safety limits. The 4Rs support crop performance while reducing avoidable nutrient loss and runoff.", "Right source: match the nutrient actually needed and a compatible product to the crop, soil test and circumstances. Urea and ammonium nitrate supply nitrogen; they are examples, not automatic cures for any yellow leaf. Right rate: use appropriate soil or tissue evidence, crop demand, existing nutrient supply and locally validated guidance. Too little may fail; too much wastes money and can harm plants or water quality.\n\nRight time: match crop uptake and avoid high loss conditions such as waterlogged or heavily raining periods. Some nitrogen programmes split applications; 'all at planting' and 'every week' are not universal. Right place: put nutrients where roots can access them without harming seed or foliage; a band can help relatively immobile phosphorus under suitable placement, but broadcast or other methods may be appropriate in different conditions. Check product label, local handling rules and seed-safety limits. The four R principles support crop performance while reducing avoidable nutrient loss and runoff."), ('The major nutrients N, P and K are often called the big three; calcium (Ca), magnesium (Mg) and sulfur (S) are also macronutrients. Iron (Fe), manganese (Mn) and zinc (Zn) are micronutrients needed in smaller amounts, not less important. The symbol for magnesium is Mg, never K; K is potassium.', 'The major nutrients N, P and K are often called the big three; calcium (C A), magnesium (M G) and sulfur (S) are also macronutrients. Iron (F E), manganese (M N) and zinc (Z N) are micronutrients needed in smaller amounts, not less important. The symbol for magnesium is M G, never K; K is potassium.'), ('The source example suggests phosphorus shortage and a starter such as diammonium phosphate (DAP), but purple leaves plus cold, heavy soil are not proof that more P is needed. Cold or wet soil can restrict uptake even when soil P tests adequate. Check soil temperature, drainage, roots, growth stage, a suitable soil P test and local advice; observe whether growth improves as soil warms.\n\nIf a deficit is confirmed, a locally appropriate P source and rate can be planned, with timing and safe placement near the young root zone. A band must follow the product and seed-separation instructions; applying DAP immediately and in direct seed contact is not a universal response.', 'The source example suggests phosphorus shortage and a starter such as diammonium phosphate (D A P), but purple leaves plus cold, heavy soil are not proof that more P is needed. Cold or wet soil can restrict uptake even when soil P tests adequate. Check soil temperature, drainage, roots, growth stage, a suitable soil P test and local advice; observe whether growth improves as soil warms.\n\nIf a deficit is confirmed, a locally appropriate P source and rate can be planned, with timing and safe placement near the young root zone. A band must follow the product and seed-separation instructions; applying D A P immediately and in direct seed contact is not a universal response.'), ('The trainer prepares three or four cards with crop, soil, weather and visible symptoms. In groups of three or four, take two different cards. For each, list observations, location and age of affected leaves, competing hypotheses, evidence to collect, water priority and a conditional 4R plan. Prepare one case for presentation. A simple checklist helps novices; an advanced case can add two overlapping stresses or pest damage and ask about cost. Images or diagrams may support explanation without determining the answer.\n\nUse the source timing: 2 minutes to explain and group, 25 minutes for two-case analysis, 15 minutes for three group presentations and discussion (about 5 minutes each), and 3 minutes for wrap-up and an exit ticket. Exit prompts ask for the typical K margin pattern and a reasoned method for very sandy soil. Each student submits an individual reasoning record; group presentation alone does not certify the individual criterion.\n\nThe source summary25minutes work +20minutes discussion describes the same45-minute workshop as2+25+15+3, not another activity. Keep two distinct case records and one defended explanation. No real field data or trainer sign-off is prefilled.', 'The trainer prepares three or four cards with crop, soil, weather and visible symptoms. In groups of three or four, take two different cards. For each, list observations, location and age of affected leaves, competing hypotheses, evidence to collect, water priority and a conditional four R principles plan. Prepare one case for presentation. A simple checklist helps novices; an advanced case can add two overlapping stresses or pest damage and ask about cost. Images or diagrams may support explanation without determining the answer.\n\nUse the source timing: two minutes to explain and group, twenty-five minutes for two-case analysis, fifteen minutes for three group presentations and discussion (about five minutes each), and three minutes for wrap-up and an exit ticket. Exit prompts ask for the typical K margin pattern and a reasoned method for very sandy soil. Each student submits an individual reasoning record; group presentation alone does not certify the individual criterion.\n\nThe source summary twenty-five minutes work plus twenty minutes discussion describes the same forty-five-minute workshop as two plus twenty-five plus fifteen plus three, not another activity. Keep two distinct case records and one defended explanation. No real field data or trainer sign-off is prefilled.'), ('Wilting or drooping reflects lost turgor; some plants roll leaves in heat or wind. Dull blue-green or grey colour, later yellow/brown brittleness and reduced growth can occur with prolonged stress. A comparison with a turgid maize leaf helps locate the sign. The same signs can also arise from waterlogging, root damage, disease, heat or other causes; a picture alone cannot prove drought.\n\nAfternoon wilting followed by morning recovery can occur when transpiration temporarily exceeds root uptake on a hot day. It does not by itself show that soil has reached a drying threshold or needs immediate irrigation. Check root-zone moisture at relevant depths, recent rain, root health and the morning condition before making a recommendation.', 'Wilting or drooping reflects lost turgor; some plants roll leaves in heat or wind. Dull blue-green or grey colour, later yellow, brown brittleness and reduced growth can occur with prolonged stress. A comparison with a turgid maize leaf helps locate the sign. The same signs can also arise from waterlogging, root damage, disease, heat or other causes; a picture alone cannot prove drought.\n\nAfternoon wilting followed by morning recovery can occur when transpiration temporarily exceeds root uptake on a hot day. It does not by itself show that soil has reached a drying threshold or needs immediate irrigation. Check root-zone moisture at relevant depths, recent rain, root health and the morning condition before making a recommendation.')], 'it': [('Appassimento o cedimento derivano da perdita di turgore; alcune piante arrotolano le foglie con caldo o vento. Colore blu-verde spento o grigiastro, poi giallo/bruno e fragilità e crescita ridotta possono comparire con stress protratto. Il confronto con una foglia di mais turgida aiuta a individuare il segno. Anche ristagno, danno radicale, malattie o caldo possono imitare questi segni: una foto non prova la siccità.\n\nL’appassimento pomeridiano con recupero al mattino può apparire quando la traspirazione supera temporaneamente l’assorbimento in una giornata calda. Non dimostra da solo una soglia di secchezza né impone irrigazione immediata. Controlla umidità alle profondità radicali utili, pioggia recente, radici e condizione mattutina.', 'Appassimento o cedimento derivano da perdita di turgore; alcune piante arrotolano le foglie con caldo o vento. Colore blu-verde spento o grigiastro, poi giallo, bruno e fragilità e crescita ridotta possono comparire con stress protratto. Il confronto con una foglia di mais turgida aiuta a individuare il segno. Anche ristagno, danno radicale, malattie o caldo possono imitare questi segni: una foto non prova la siccità.\n\nL’appassimento pomeridiano con recupero al mattino può apparire quando la traspirazione supera temporaneamente l’assorbimento in una giornata calda. Non dimostra da solo una soglia di secchezza né impone irrigazione immediata. Controlla umidità alle profondità radicali utili, pioggia recente, radici e condizione mattutina.'), ('Avvio di5minuti: ricorda una pianta domestica sofferente, discuti per un minuto aspetto e cause possibili con un compagno e poi condividi. Servono lavagna/fogli, pennarelli, proiettore e schede; vasi di suolo e sedano in acqua colorata sono dimostrazioni facoltative già trattate.', 'Avvio di cinque minuti: ricorda una pianta domestica sofferente, discuti per un minuto aspetto e cause possibili con un compagno e poi condividi. Servono lavagna, fogli, pennarelli, proiettore e schede; vasi di suolo e sedano in acqua colorata sono dimostrazioni facoltative già trattate.'), ('Fonte giusta: abbina nutrienti effettivamente richiesti e prodotto compatibile a coltura, analisi del suolo e circostanze. Urea e nitrato ammonico apportano N: esempi, non rimedi automatici per ogni foglia gialla. Dose giusta: usa prove di suolo/tessuti, richiesta della coltura, apporto già presente e raccomandazioni locali validate. Poco può non bastare; troppo costa e danneggia piante o acqua.\n\nTempo giusto: segui l’assorbimento ed evita condizioni di forte perdita, come suolo allagato o piogge intense. Alcuni programmi dividono l’azoto; «tutto alla semina» o «ogni settimana» non sono universali. Posizione giusta: porta il nutriente alle radici senza lesionare seme o foglie. Una banda può favorire P relativamente poco mobile in condizioni adatte, ma distribuzione superficiale o altre forme possono essere appropriate altrove. Controlla etichetta, norme locali e distanza di sicurezza dal seme. Le 4R sostengono la coltura e riducono perdite e ruscellamento evitabili.', 'Fonte giusta: abbina nutrienti effettivamente richiesti e prodotto compatibile a coltura, analisi del suolo e circostanze. Urea e nitrato ammonico apportano enne: esempi, non rimedi automatici per ogni foglia gialla. Dose giusta: usa prove di suolo, tessuti, richiesta della coltura, apporto già presente e raccomandazioni locali validate. Poco può non bastare; troppo costa e danneggia piante o acqua.\n\nTempo giusto: segui l’assorbimento ed evita condizioni di forte perdita, come suolo allagato o piogge intense. Alcuni programmi dividono l’azoto; «tutto alla semina» o «ogni settimana» non sono universali. Posizione giusta: porta il nutriente alle radici senza lesionare seme o foglie. Una banda può favorire pi relativamente poco mobile in condizioni adatte, ma distribuzione superficiale o altre forme possono essere appropriate altrove. Controlla etichetta, norme locali e distanza di sicurezza dal seme. I quattro principi R sostengono la coltura e riducono perdite e ruscellamento evitabili.'), ('La carenza di azoto mobile può iniziare con ingiallimento generale delle foglie vecchie inferiori. Lo stress da fosforo può causare crescita lenta e viola nel mais giovane, spesso in tessuti più vecchi, specie se il suolo freddo ne limita l’assorbimento. La carenza di K può ingiallire o bruciare margini vecchi. La mobilità interna di N, P e K rende l’età fogliare un indizio, ma sintomi e cause variano. Promemoria: «N: il vecchio perde verde; P: può apparire viola; K: margini vecchi»; sono inviti a verificare, non diagnosi cromatiche. Nel tipico indizio di K sui margini del mais, il centro della foglia può restare verde; anche questo contrasto è un indizio, non una diagnosi.\n\nP partecipa a trasferimento energetico e sviluppo radicale; K regola acqua e funzioni vegetali. L’età di una foglia di mais è un indizio da integrare con schema, radici e condizioni.', 'La carenza di azoto mobile può iniziare con ingiallimento generale delle foglie vecchie inferiori. Lo stress da fosforo può causare crescita lenta e viola nel mais giovane, spesso in tessuti più vecchi, specie se il suolo freddo ne limita l’assorbimento. La carenza di cappa può ingiallire o bruciare margini vecchi. La mobilità interna di enne, pi e cappa rende l’età fogliare un indizio, ma sintomi e cause variano. Promemoria: «enne: il vecchio perde verde; pi: può apparire viola; cappa: margini vecchi»; sono inviti a verificare, non diagnosi cromatiche. Nel tipico indizio di cappa sui margini del mais, il centro della foglia può restare verde; anche questo contrasto è un indizio, non una diagnosi.\n\npi partecipa a trasferimento energetico e sviluppo radicale; cappa regola acqua e funzioni vegetali. L’età di una foglia di mais è un indizio da integrare con schema, radici e condizioni.'), ('L’esempio originale suggerisce carenza di P e un concime starter come fosfato biammonico (DAP), ma viola e terreno freddo pesante non provano la necessità di altro P. Freddo o ristagno possono limitarne l’assorbimento anche con analisi P adeguata. Verifica temperatura, drenaggio, radici, fase, test P e indicazioni locali; osserva se la crescita riprende col riscaldamento.\n\nSe una carenza è confermata, scegli fonte e dose locali adeguate, con momento e posizione sicuri vicino alle radici giovani. La banda segue etichetta e separazione dal seme; DAP immediato e a contatto col seme non è una risposta generale.', 'L’esempio originale suggerisce carenza di pi e un concime starter come fosfato biammonico (di a pi), ma viola e terreno freddo pesante non provano la necessità di altro pi. Freddo o ristagno possono limitarne l’assorbimento anche con analisi pi adeguata. Verifica temperatura, drenaggio, radici, fase, test pi e indicazioni locali; osserva se la crescita riprende col riscaldamento.\n\nSe una carenza è confermata, scegli fonte e dose locali adeguate, con momento e posizione sicuri vicino alle radici giovani. La banda segue etichetta e separazione dal seme; di a pi immediato e a contatto col seme non è una risposta generale.'), ('L’istruttore prepara tre o quattro schede con coltura, suolo, clima e segni visibili. In gruppi di tre o quattro prendete due casi diversi. Per ciascuno scrivete osservazioni, posizione ed età delle foglie colpite, ipotesi alternative, prove da raccogliere, priorità idrica e piano 4R condizionato. Preparate un caso da presentare. Una lista guida i principianti; un caso avanzato può includere due stress, insetti o costi. Foto e disegni aiutano a spiegare ma non stabiliscono la risposta.\n\nTempi originali: 2 minuti istruzioni/gruppi, 25 per due casi, 15 per tre presentazioni e discussione (circa 5 ciascuna), 3 per chiusura e biglietto d’uscita. Le domande finali chiedono schema dei margini con K e metodo ragionato per suolo molto sabbioso. Ciascuno consegna il proprio ragionamento; la presentazione collettiva non certifica l’individuo.\n\nIl riepilogo originale25minuti di lavoro e20di discussione descrive gli stessi45minuti2+25+15+3, non un’attività aggiuntiva. Conserva due casi diversi e una difesa individuale; dati reali e firme non sono precompilati.', 'L’istruttore prepara tre o quattro schede con coltura, suolo, clima e segni visibili. In gruppi di tre o quattro prendete due casi diversi. Per ciascuno scrivete osservazioni, posizione ed età delle foglie colpite, ipotesi alternative, prove da raccogliere, priorità idrica e piano condizionato basato sui quattro principi R. Preparate un caso da presentare. Una lista guida i principianti; un caso avanzato può includere due stress, insetti o costi. Foto e disegni aiutano a spiegare ma non stabiliscono la risposta.\n\nTempi originali: due minuti istruzioni, gruppi, venticinque per due casi, quindici per tre presentazioni e discussione (circa cinque ciascuna), tre per chiusura e biglietto d’uscita. Le domande finali chiedono schema dei margini con cappa e metodo ragionato per suolo molto sabbioso. Ciascuno consegna il proprio ragionamento; la presentazione collettiva non certifica l’individuo.\n\nIl riepilogo originale venticinque minuti di lavoro e venti di discussione descrive gli stessi quarantacinque minuti due più venticinque più quindici più tre, non un’attività aggiuntiva. Conserva due casi diversi e una difesa individuale; dati reali e firme non sono precompilati.'), ('N, P e K sono spesso i tre nutrienti maggiori; anche calcio (Ca), magnesio (Mg) e zolfo (S) sono macroelementi. Ferro (Fe), manganese (Mn) e zinco (Zn) sono microelementi richiesti in minori quantità, non meno essenziali. Il magnesio è Mg, mai K; K è potassio.', 'enne, pi e cappa sono spesso i tre nutrienti maggiori; anche calcio (ci a), magnesio (emme gi) e zolfo (esse) sono macroelementi. Ferro (effe e), manganese (emme enne) e zinco (zeta enne) sono microelementi richiesti in minori quantità, non meno essenziali. Il magnesio è emme gi, mai cappa; cappa è potassio.'), ('Sfida: perché una banda può aiutare P? La sua mobilità nel suolo è relativamente bassa; una posizione adatta favorisce contatto con giovani radici. Non ogni banda supera lo spandimento e non è ammesso contatto dannoso col seme: decidono prodotto, suolo, coltura e sicurezza.', 'Sfida: perché una banda può aiutare pi? La sua mobilità nel suolo è relativamente bassa; una posizione adatta favorisce contatto con giovani radici. Non ogni banda supera lo spandimento e non è ammesso contatto dannoso col seme: decidono prodotto, suolo, coltura e sicurezza.'), ('Una pianta domestica floscia o una foglia gialla in campo avviano una domanda, non concludono la diagnosi. Descrivi sintomo, posizione su tessuti vecchi o nuovi, momento, tessitura e umidità del suolo, clima, drenaggio e radici. Formula più ipotesi, scegli osservazioni o test discriminanti e rivedi l’ipotesi quando arrivano i risultati.\n\nIl tema originale dura 90 minuti: 45 di spiegazione/discussione e 45 di laboratorio diagnostico. Acqua e irrigazione sono introdotte in passi precedenti; qui si applicano insieme alla nutrizione. Un caso didattico non prova che lo studente abbia diagnosticato un vero campo.', 'Una pianta domestica floscia o una foglia gialla in campo avviano una domanda, non concludono la diagnosi. Descrivi sintomo, posizione su tessuti vecchi o nuovi, momento, tessitura e umidità del suolo, clima, drenaggio e radici. Formula più ipotesi, scegli osservazioni o test discriminanti e rivedi l’ipotesi quando arrivano i risultati.\n\nIl tema originale dura novanta minuti: quarantacinque di spiegazione, discussione e quarantacinque di laboratorio diagnostico. Acqua e irrigazione sono introdotte in passi precedenti; qui si applicano insieme alla nutrizione. Un caso didattico non prova che lo studente abbia diagnosticato un vero campo.')], 'de': [('Das Original vermutet P-Mangel und nennt Starterdünger wie Diammoniumphosphat (DAP). Purpur plus kalter schwerer Boden beweisen aber keinen zusätzlichen P-Bedarf. Kälte oder Nässe können Aufnahme trotz ausreichender Boden-P-Analyse hemmen. Prüfe Bodentemperatur, Entwässerung, Wurzeln, Phase, passenden P-Test und lokale Beratung; beobachte Besserung beim Erwärmen.\n\nIst ein Mangel belegt, plane standortgerechte P-Quelle und Menge sowie sicheren Zeitpunkt und Platz nahe jungen Wurzeln. Banddüngung muss Etikett und Abstand zum Saatgut einhalten; sofortiges DAP oder direkter Saatkontakt ist keine allgemeine Antwort.', 'Das Original vermutet Pe-Mangel und nennt Starterdünger wie Diammoniumphosphat (De A Pe). Purpur plus kalter schwerer Boden beweisen aber keinen zusätzlichen Pe-Bedarf. Kälte oder Nässe können Aufnahme trotz ausreichender Boden-Pe-Analyse hemmen. Prüfe Bodentemperatur, Entwässerung, Wurzeln, Phase, passenden Pe-Test und lokale Beratung; beobachte Besserung beim Erwärmen.\n\nIst ein Mangel belegt, plane standortgerechte Pe-Quelle und Menge sowie sicheren Zeitpunkt und Platz nahe jungen Wurzeln. Banddüngung muss Etikett und Abstand zum Saatgut einhalten; sofortiges De A Pe oder direkter Saatkontakt ist keine allgemeine Antwort.'), ('Denkfrage: warum kann ein P-Band helfen? P ist im Boden relativ wenig beweglich, passende Nähe verbessert Wurzelkontakt. Nicht jedes Band ist besser als Streuen; schädlicher Saatkontakt bleibt ausgeschlossen. Produkt, Boden, Kultur und sichere Platzierung entscheiden.', 'Denkfrage: warum kann ein Pe-Band helfen? Pe ist im Boden relativ wenig beweglich, passende Nähe verbessert Wurzelkontakt. Nicht jedes Band ist besser als Streuen; schädlicher Saatkontakt bleibt ausgeschlossen. Produkt, Boden, Kultur und sichere Platzierung entscheiden.'), ('Die Lehrkraft bereitet drei oder vier Karten mit Kultur, Boden, Wetter und sichtbaren Zeichen vor. In Gruppen von drei oder vier nehmt ihr zwei verschiedene Karten. Für jede erfasst ihr Beobachtungen, Lage/Alter betroffener Blätter, alternative Hypothesen, nötige Nachweise, Wasserpriorität und einen bedingten 4R-Plan. Eine Karte wird präsentiert. Eine einfache Checkliste hilft Einsteigern; Fortgeschrittene können zwei Stressursachen, Schädlingsschaden oder Wirtschaftlichkeit einbeziehen. Bilder erklären, entscheiden aber nicht.\n\nOriginalzeit: 2 Minuten Einführung/Gruppen, 25 für zwei Fälle, 15 für drei Gruppenpräsentationen und Diskussion (etwa 5 je Gruppe), 3 für Abschluss und Ausgangskarte. Letztere fragt nach K-Randmuster und begründeter Methode für sehr sandigen Boden. Jede Person legt eigenes Denken vor; die Gruppenpräsentation allein erfüllt das Einzelkriterium nicht.\n\nDie Originalübersicht25Minuten Arbeit und20Besprechung meint dieselben45Minuten2+25+15+3, keine zusätzliche Aktivität. Zwei verschiedene Fälle und eine individuelle Verteidigung dokumentieren; echte Daten und Unterschriften nicht vorausfüllen.', 'Die Lehrkraft bereitet drei oder vier Karten mit Kultur, Boden, Wetter und sichtbaren Zeichen vor. In Gruppen von drei oder vier nehmt ihr zwei verschiedene Karten. Für jede erfasst ihr Beobachtungen, Lage, Alter betroffener Blätter, alternative Hypothesen, nötige Nachweise, Wasserpriorität und einen bedingten Plan nach den vier R Prinzipien. Eine Karte wird präsentiert. Eine einfache Checkliste hilft Einsteigern; Fortgeschrittene können zwei Stressursachen, Schädlingsschaden oder Wirtschaftlichkeit einbeziehen. Bilder erklären, entscheiden aber nicht.\n\nOriginalzeit: zwei Minuten Einführung, Gruppen, fünfundzwanzig für zwei Fälle, fünfzehn für drei Gruppenpräsentationen und Diskussion (etwa fünf je Gruppe), drei für Abschluss und Ausgangskarte. Letztere fragt nach Ka-Randmuster und begründeter Methode für sehr sandigen Boden. Jede Person legt eigenes Denken vor; die Gruppenpräsentation allein erfüllt das Einzelkriterium nicht.\n\nDie Originalübersicht fünfundzwanzig Minuten Arbeit und zwanzig Besprechung meint dieselben fünfundvierzig Minuten zwei plus fünfundzwanzig plus fünfzehn plus drei, keine zusätzliche Aktivität. Zwei verschiedene Fälle und eine individuelle Verteidigung dokumentieren; echte Daten und Unterschriften nicht vorausfüllen.'), ('Eine schlaffe Zimmerpflanze oder ein gelbes Feldblatt eröffnet eine Frage, schließt die Diagnose aber nicht ab. Beschreibe Symptom, Lage an altem oder neuem Gewebe, Zeitpunkt, Bodentextur und -feuchte, Wetter, Abfluss und Wurzeln. Stelle mehrere Hypothesen auf, wähle unterscheidende Beobachtungen oder Tests und überprüfe sie anhand der Ergebnisse.\n\nDas Originalthema dauert 90 Minuten: 45 Erklärung/Diskussion und 45 Fallwerkstatt. Wasser- und Bewässerungsgrundlagen kommen in früheren Schritten; hier werden sie mit Nährstoffen angewandt. Eine geordnete Fallübung belegt keine reale Diagnose auf einem Bauernfeld.', 'Eine schlaffe Zimmerpflanze oder ein gelbes Feldblatt eröffnet eine Frage, schließt die Diagnose aber nicht ab. Beschreibe Symptom, Lage an altem oder neuem Gewebe, Zeitpunkt, Bodentextur und -feuchte, Wetter, Abfluss und Wurzeln. Stelle mehrere Hypothesen auf, wähle unterscheidende Beobachtungen oder Tests und überprüfe sie anhand der Ergebnisse.\n\nDas Originalthema dauert neunzig Minuten: fünfundvierzig Erklärung, Diskussion und fünfundvierzig Fallwerkstatt. Wasser- und Bewässerungsgrundlagen kommen in früheren Schritten; hier werden sie mit Nährstoffen angewandt. Eine geordnete Fallübung belegt keine reale Diagnose auf einem Bauernfeld.'), ('Fünfminütiger Einstieg: erinnere dich an eine kranke Zimmerpflanze, bespreche eine Minute lang Aussehen und mögliche Ursachen zu zweit, teile danach Ergebnisse. Tafel/Papier, Stifte, Projektor und Karten werden genutzt; Bodengläser und Stangensellerie im Farbwasser sind bereits behandelte optionale Demonstrationen.', 'Fünfminütiger Einstieg: erinnere dich an eine kranke Zimmerpflanze, bespreche eine Minute lang Aussehen und mögliche Ursachen zu zweit, teile danach Ergebnisse. Tafel, Papier, Stifte, Projektor und Karten werden genutzt; Bodengläser und Stangensellerie im Farbwasser sind bereits behandelte optionale Demonstrationen.'), ('Mangel an mobilem Stickstoff kann zuerst ältere untere Blätter allgemein vergilben lassen. P-Stress kann junge Maispflanzen hemmen und purpurn färben, oft an älterem Gewebe, besonders wenn kalter Boden die Aufnahme begrenzt. K-Mangel kann alte Blattränder gelb oder verbrannt wirken lassen. Die interne Beweglichkeit von N, P und K macht alte Blätter zu Hinweisen, doch Kultur und Ursachen variieren. Merke: „N: alte Blätter verlieren Grün; P: Purpur möglich; K: alte Ränder“ als Prüfhinweis, nicht als Farbdiagnose. Beim K-Randmuster an Mais kann die Blattmitte grün bleiben; auch dieser Kontrast ist ein Hinweis, keine gesicherte Diagnose.\n\nP wirkt an Energieübertragung und Wurzelentwicklung mit; K unterstützt Wasserregulation und Pflanzenfunktionen. Alter eines Maisblattes ist nur zusammen mit Muster, Wurzeln und Bedingungen aussagekräftig.', 'Mangel an mobilem Stickstoff kann zuerst ältere untere Blätter allgemein vergilben lassen. Pe-Stress kann junge Maispflanzen hemmen und purpurn färben, oft an älterem Gewebe, besonders wenn kalter Boden die Aufnahme begrenzt. Ka-Mangel kann alte Blattränder gelb oder verbrannt wirken lassen. Die interne Beweglichkeit von En, Pe und Ka macht alte Blätter zu Hinweisen, doch Kultur und Ursachen variieren. Merke: „En: alte Blätter verlieren Grün; Pe: Purpur möglich; Ka: alte Ränder“ als Prüfhinweis, nicht als Farbdiagnose. Beim Ka-Randmuster an Mais kann die Blattmitte grün bleiben; auch dieser Kontrast ist ein Hinweis, keine gesicherte Diagnose.\n\nPe wirkt an Energieübertragung und Wurzelentwicklung mit; Ka unterstützt Wasserregulation und Pflanzenfunktionen. Alter eines Maisblattes ist nur zusammen mit Muster, Wurzeln und Bedingungen aussagekräftig.'), ('N, P und K heißen häufig die drei Hauptnährstoffe; Calcium (Ca), Magnesium (Mg) und Schwefel (S) sind ebenfalls Makronährstoffe. Eisen (Fe), Mangan (Mn) und Zink (Zn) sind in kleineren Mengen nötige Mikronährstoffe, keineswegs unwichtig. Magnesium heißt Mg, nie K; K steht für Kalium.', 'En, Pe und Ka heißen häufig die drei Hauptnährstoffe; Calcium (Ce A), Magnesium (Em Ge) und Schwefel (Es) sind ebenfalls Makronährstoffe. Eisen (Ef E), Mangan (Em En) und Zink (Zet En) sind in kleineren Mengen nötige Mikronährstoffe, keineswegs unwichtig. Magnesium heißt Em Ge, nie Ka; Ka steht für Kalium.'), ('Richtige Quelle: Passe wirklich nötiges Element und geeignetes Produkt an Kultur, Bodenprobe und Umstände an. Harnstoff und Ammoniumnitrat liefern N; sie sind Beispiele, keine automatische Therapie für jedes gelbe Blatt. Richtige Menge: Nutze geeignete Boden-/Gewebeproben, Kulturbedarf, vorhandenen Vorrat und geprüfte lokale Empfehlungen. Zu wenig hilft möglicherweise nicht; zu viel kostet und schadet Pflanze oder Wasser.\n\nRichtige Zeit: Richte dich nach Aufnahme und vermeide hohe Verlustgefahr, etwa bei Überschwemmung oder starkem Regen. Manche N-Programme teilen Gaben; „alles zur Saat“ und „wöchentlich“ sind nicht allgemein. Richtiger Ort: Nährstoffe wurzelnah ohne Saat- oder Blattschaden. Ein Band kann für wenig bewegliches P unter passenden Bedingungen nützlich sein; breitflächige oder andere Verfahren können anderswo passen. Prüfe Produktetikett, örtliche Regeln und Saatabstand. Die 4R unterstützen Ertrag und mindern unnötige Verluste und Abschwemmung.', 'Richtige Quelle: Passe wirklich nötiges Element und geeignetes Produkt an Kultur, Bodenprobe und Umstände an. Harnstoff und Ammoniumnitrat liefern En; sie sind Beispiele, keine automatische Therapie für jedes gelbe Blatt. Richtige Menge: Nutze geeignete Boden-, Gewebeproben, Kulturbedarf, vorhandenen Vorrat und geprüfte lokale Empfehlungen. Zu wenig hilft möglicherweise nicht; zu viel kostet und schadet Pflanze oder Wasser.\n\nRichtige Zeit: Richte dich nach Aufnahme und vermeide hohe Verlustgefahr, etwa bei Überschwemmung oder starkem Regen. Manche En-Programme teilen Gaben; „alles zur Saat“ und „wöchentlich“ sind nicht allgemein. Richtiger Ort: Nährstoffe wurzelnah ohne Saat- oder Blattschaden. Ein Band kann für wenig bewegliches Pe unter passenden Bedingungen nützlich sein; breitflächige oder andere Verfahren können anderswo passen. Prüfe Produktetikett, örtliche Regeln und Saatabstand. Die vier R Prinzipien unterstützen Ertrag und mindern unnötige Verluste und Abschwemmung.'), ('Welken oder Hängen zeigt verlorenen Zelldruck; manche Pflanzen rollen bei Hitze oder Wind Blätter. Mattes blaugrün/grau, später gelb-braune Brüchigkeit und verlangsamtes Wachstum können auftreten. Der Vergleich mit einem prallen Maisblatt zeigt das Zeichen. Staunässe, Wurzelschaden, Krankheit und Hitze können Ähnliches bewirken: Ein Bild beweist keine Trockenheit.\n\nNachmittagswelke mit Erholung am Morgen kann entstehen, wenn Verdunstung vorübergehend die Aufnahme übersteigt. Allein damit sind weder Bodentrockenheit noch ein sofortiger Bewässerungsbedarf bewiesen. Prüfe Wurzelraumfeuchte in geeigneten Tiefen, kürzlichen Regen, Wurzeln und Morgenzustand.', 'Welken oder Hängen zeigt verlorenen Zelldruck; manche Pflanzen rollen bei Hitze oder Wind Blätter. Mattes blaugrün, grau, später gelb-braune Brüchigkeit und verlangsamtes Wachstum können auftreten. Der Vergleich mit einem prallen Maisblatt zeigt das Zeichen. Staunässe, Wurzelschaden, Krankheit und Hitze können Ähnliches bewirken: Ein Bild beweist keine Trockenheit.\n\nNachmittagswelke mit Erholung am Morgen kann entstehen, wenn Verdunstung vorübergehend die Aufnahme übersteigt. Allein damit sind weder Bodentrockenheit noch ein sofortiger Bewässerungsbedarf bewiesen. Prüfe Wurzelraumfeuchte in geeigneten Tiefen, kürzlichen Regen, Wurzeln und Morgenzustand.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s307-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_TEN_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':10,'maximumBlindReviewPerLane':10,'maximumASRPerLane':10,'maximumTTSAggregate':40,'maximumBlindAggregate':40,'maximumASRAggregate':40,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
