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
IDS = ('S2-08-ar-EG-R01-r1', 'S2-08-ar-EG-R02-r1', 'S2-08-ar-EG-R03-r1', 'S2-08-ar-EG-R04-r1', 'S2-08-ar-EG-R05-r1', 'S2-08-ar-EG-R06-r1', 'S2-08-ar-EG-R07-r1', 'S2-08-en-R01-r1', 'S2-08-en-R02-r1', 'S2-08-en-R03-r1', 'S2-08-en-R04-r1', 'S2-08-en-R05-r1', 'S2-08-en-R06-r1', 'S2-08-en-R07-r1', 'S2-08-it-R01-r1', 'S2-08-it-R02-r1', 'S2-08-it-R03-r1', 'S2-08-it-R04-r1', 'S2-08-it-R05-r1', 'S2-08-it-R06-r1', 'S2-08-it-R07-r1', 'S2-08-de-R01-r1', 'S2-08-de-R02-r1', 'S2-08-de-R03-r1', 'S2-08-de-R04-r1', 'S2-08-de-R05-r1', 'S2-08-de-R06-r1', 'S2-08-de-R07-r1')
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
    assert(req['scope'],req['stepId'])==('S208_TWENTYEIGHT_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-08')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(28,28,28,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s208-readings-audio-20261023-r1')
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
        allowedByLocale={'ar-EG': [('6 بوصات', 'ست بوصات'), ('A وB وC', 'إيه وبي وسي'), ('A/B/C', 'إيه وبي وسي'), ('Al/Mn', 'الألومنيوم والمنجنيز'), ('Fe/Mn/Zn', 'الحديد والمنجنيز والزنك'), ('P/Ca/Mg', 'الفوسفور والكالسيوم والمغنيسيوم'), ('pH بيعبّر عن الحموضة النشطة في محلول التربة. وفيه حموضة مخزونة على مواقع التبادل بتساعدنا نحدد احتياج الجير. الطين والمادة العضوية غالبًا بيزودوا مقاومة تغيّر pH مقارنة بالرملية، فممكن أرضين بنفس القراءة يستجيبوا لكميات مختلفة. لو باقي الظروف متشابهة، التربة الأغنى بالطين ممكن تحتاج جير أكتر من الرملية. دي مقارنة لها سبب، مش قاعدة نحسب بيها كمية بالأرقام.\n\nاطلب من المعمل اختبار احتياج الجير أو فحص التنظيم المناسب محليًا، مع هدف المحصول وأساس حساب الكمية. نعومة المادة وقوة تعادلها وعمق خلطها وموعده بيفرقوا برضه. ما تضربش فرق pH اللي في الكتاب في عدد شكاير من عندك.', 'بي إتش بيعبّر عن الحموضة النشطة في محلول التربة. وفيه حموضة مخزونة على مواقع التبادل بتساعدنا نحدد احتياج الجير. الطين والمادة العضوية غالبًا بيزودوا مقاومة تغيّر بي إتش مقارنة بالرملية، فممكن أرضين بنفس القراءة يستجيبوا لكميات مختلفة. لو باقي الظروف متشابهة، التربة الأغنى بالطين ممكن تحتاج جير أكتر من الرملية. دي مقارنة لها سبب، مش قاعدة نحسب بيها كمية بالأرقام.\n\nاطلب من المعمل اختبار احتياج الجير أو فحص التنظيم المناسب محليًا، مع هدف المحصول وأساس حساب الكمية. نعومة المادة وقوة تعادلها وعمق خلطها وموعده بيفرقوا برضه. ما تضربش فرق بي إتش اللي في الكتاب في عدد شكاير من عندك.'), ('الكائنات الدقيقة في التربة ممكن تأكسد الكبريت العنصري فتتكوّن حموضة. التفاعل محتاج رطوبة وحرارة وخلط ووقت مناسبين؛ عينة اتحط فيها كبريت قبل الحصة مباشرة مش مضمون توصل لرقم pH المستهدف. الكبريت الزيادة أو اللي مش مناسب للمحصول والموقع ممكن يضر النبات أو يهدر فلوس. لما نقول pH عالي ونفكّر في الكبريت، نقصد نفحص هل مناسب، مش نحط كمية واحدة لكل الحالات.\n\nمثال الشرح بيذكر كمان البيتموس الحمضي. استخدامه المحتمل في وسط زراعة معيّن ما يتحوّلش لتوصية لكل الحقول؛ راجع المحصول والمادة والإرشاد المحلي. الأرض الجيرية فيها كربونات بتقاوم تحميض الحقل كله بقوة. pH العالي لوحده ما يقولش هل الأرض جيرية أو مالحة أو صودية، ولا هل البطاطس مناسبة للموقع ده. راجع التحليل الكامل ومَيّه الموقع والمحصول والجدوى؛ تغيير المحصول أو الموقع أو طريقة الإدارة ممكن يبقى أنسب من وعد بتأثير سريع للكبريت.', 'الكائنات الدقيقة في التربة ممكن تأكسد الكبريت العنصري فتتكوّن حموضة. التفاعل محتاج رطوبة وحرارة وخلط ووقت مناسبين؛ عينة اتحط فيها كبريت قبل الحصة مباشرة مش مضمون توصل لرقم بي إتش المستهدف. الكبريت الزيادة أو اللي مش مناسب للمحصول والموقع ممكن يضر النبات أو يهدر فلوس. لما نقول بي إتش عالي ونفكّر في الكبريت، نقصد نفحص هل مناسب، مش نحط كمية واحدة لكل الحالات.\n\nمثال الشرح بيذكر كمان البيتموس الحمضي. استخدامه المحتمل في وسط زراعة معيّن ما يتحوّلش لتوصية لكل الحقول؛ راجع المحصول والمادة والإرشاد المحلي. الأرض الجيرية فيها كربونات بتقاوم تحميض الحقل كله بقوة. بي إتش العالي لوحده ما يقولش هل الأرض جيرية أو مالحة أو صودية، ولا هل البطاطس مناسبة للموقع ده. راجع التحليل الكامل ومَيّه الموقع والمحصول والجدوى؛ تغيير المحصول أو الموقع أو طريقة الإدارة ممكن يبقى أنسب من وعد بتأثير سريع للكبريت.'), ('جرّب قرارات حالات إيه وبي وسي النموذجية في التدريب قبل مقارنة مفتاح المثال الكامل. اختار اتجاه، وحدد الدليل اللي هتطلبه، واشرح سببك في كل حالة. المحاولة الإلكترونية دي مش محتاجة تختلق قياسات حقلية.\n\nاستخدم جدول توفر العناصر علشان تقترح، مش تثبت، احتمال قلة توفر الفوسفور والكالسيوم والمغنيسيوم أو خطر الألومنيوم والمنجنيز عند pH منخفض، واحتمال قلة توفر الحديد والمنجنيز والزنك عند pH عالي. لو محتاج مساعدة، استخدم بداية جملة وركّز على صفوف P والألومنيوم والحديد؛ وراجع معاني حمضي وقلوي ومتعادل ومحسّن وقلة التوفر والسمّية. كل طالب يشرح سبب رأيه، وبعدها قارنوا نتائج المجموعات وفسّروا اختلاف القياس بدل ما تجبروا الكل على أرقام مفتاح المثال.', 'جرّب قرارات حالات إيه وبي وسي النموذجية في التدريب قبل مقارنة مفتاح المثال الكامل. اختار اتجاه، وحدد الدليل اللي هتطلبه، واشرح سببك في كل حالة. المحاولة الإلكترونية دي مش محتاجة تختلق قياسات حقلية.\n\nاستخدم جدول توفر العناصر علشان تقترح، مش تثبت، احتمال قلة توفر الفوسفور والكالسيوم والمغنيسيوم أو خطر الألومنيوم والمنجنيز عند بي إتش منخفض، واحتمال قلة توفر الحديد والمنجنيز والزنك عند بي إتش عالي. لو محتاج مساعدة، استخدم بداية جملة وركّز على صفوف الفوسفور والألومنيوم والحديد؛ وراجع معاني حمضي وقلوي ومتعادل ومحسّن وقلة التوفر والسمّية. كل طالب يشرح سبب رأيه، وبعدها قارنوا نتائج المجموعات وفسّروا اختلاف القياس بدل ما تجبروا الكل على أرقام مفتاح المثال.'), ('في سؤال الخروج، أرض هتتزرع فول صويا وpH فيها5.2، ونبات السنة اللي فاتت كان أصفر ومتقزّم.5.2 حمضي. انخفاض pH ممكن يقلل توفر الفوسفور ويزوّد خطر الألومنيوم الذائب على الجذور؛ فالتجيير اتجاه محتمل لو احتياج المحصول وتوصية تحليل التربة الموثوق بيدعموه. الأعراض لوحدها ما تثبتش إن pH كان السبب الوحيد أو السبب الفعلي.\n\nاتأكد إن العينة ممثلة وإن طريقة pH موثوقة، وراجع تحليل المحصول والعناصر ونمط المشكلة في الحقل والضغوط التانية. توصية المعمل للتجيير، بما فيها الحموضة المخزونة وجودة المنتج، هي اللي تحدد الكمية. لو P منخفض فعلًا، توصية الفوسفور المحلية المبنية على اختبار معاير تبقى قرار منفصل. مسحوق العظام أو الفوسفات الصخري مش تلقائيًا أفضل أو أسرع منتج لمجرد إن اختيار في سؤال الفصل جمعه مع الجير.', 'في سؤال الخروج، أرض هتتزرع فول صويا وpH فيها 5.2، ونبات السنة اللي فاتت كان أصفر ومتقزّم.5.2 حمضي. انخفاض pH ممكن يقلل توفر الفوسفور ويزوّد خطر الألومنيوم الذائب على الجذور؛ فالتجيير اتجاه محتمل لو احتياج المحصول وتوصية تحليل التربة الموثوق بيدعموه. الأعراض لوحدها ما تثبتش إن pH كان السبب الوحيد أو السبب الفعلي.\n\nاتأكد إن العينة ممثلة وإن طريقة pH موثوقة، وراجع تحليل المحصول والعناصر ونمط المشكلة في الحقل والضغوط التانية. توصية المعمل للتجيير، بما فيها الحموضة المخزونة وجودة المنتج، هي اللي تحدد الكمية. لو P منخفض فعلًا، توصية الفوسفور المحلية المبنية على اختبار معاير تبقى قرار منفصل. مسحوق العظام أو الفوسفات الصخري مش تلقائيًا أفضل أو أسرع منتج لمجرد إن اختيار في سؤال الفصل جمعه مع الجير.'), ('في سؤال الخروج، أرض هتتزرع فول صويا وبي إتش فيها 5.2، ونبات السنة اللي فاتت كان أصفر ومتقزّم.5.2 حمضي. انخفاض pH ممكن يقلل توفر الفوسفور ويزوّد خطر الألومنيوم الذائب على الجذور؛ فالتجيير اتجاه محتمل لو احتياج المحصول وتوصية تحليل التربة الموثوق بيدعموه. الأعراض لوحدها ما تثبتش إن pH كان السبب الوحيد أو السبب الفعلي.\n\nاتأكد إن العينة ممثلة وإن طريقة pH موثوقة، وراجع تحليل المحصول والعناصر ونمط المشكلة في الحقل والضغوط التانية. توصية المعمل للتجيير، بما فيها الحموضة المخزونة وجودة المنتج، هي اللي تحدد الكمية. لو P منخفض فعلًا، توصية الفوسفور المحلية المبنية على اختبار معاير تبقى قرار منفصل. مسحوق العظام أو الفوسفات الصخري مش تلقائيًا أفضل أو أسرع منتج لمجرد إن اختيار في سؤال الفصل جمعه مع الجير.', 'في سؤال الخروج، أرض هتتزرع فول صويا وبي إتش فيها خمسة فاصلة اتنين، ونبات السنة اللي فاتت كان أصفر ومتقزّم.خمسة فاصلة اتنين حمضي. انخفاض بي إتش ممكن يقلل توفر الفوسفور ويزوّد خطر الألومنيوم الذائب على الجذور؛ فالتجيير اتجاه محتمل لو احتياج المحصول وتوصية تحليل التربة الموثوق بيدعموه. الأعراض لوحدها ما تثبتش إن بي إتش كان السبب الوحيد أو السبب الفعلي.\n\nاتأكد إن العينة ممثلة وإن طريقة بي إتش موثوقة، وراجع تحليل المحصول والعناصر ونمط المشكلة في الحقل والضغوط التانية. توصية المعمل للتجيير، بما فيها الحموضة المخزونة وجودة المنتج، هي اللي تحدد الكمية. لو الفوسفور منخفض فعلًا، توصية الفوسفور المحلية المبنية على اختبار معاير تبقى قرار منفصل. مسحوق العظام أو الفوسفات الصخري مش تلقائيًا أفضل أو أسرع منتج لمجرد إن اختيار في سؤال الفصل جمعه مع الجير.'), ('في نشاط إيه وبي وسي مع المدرّب، قيس وسجّل كل عينة فعلية قبل ما تفسّرها أو تقترح إضافة ليها. بدّلوا أدوار اللي بيقيس واللي بيسجّل واللي بيحلّل الجدول بين العينات، علشان الكل يتدرّب على مهارات القياس اللي فاتت. ورقة المجموعة فيها تلات أجزاء، كل جزء عشر دقايق: قياس وتفسير واقتراح. ده جوه تجهيز المدرّب والتعليمات والتنظيف والنقاش، مش أوقات نضيفها فوق بعض. الخطوة دي مركّزة على الاقتراح وسببه؛ إثبات مهارة القياس مكانه الخطوات اللي فاتت. افصل قراءات كل طالب الفعلية للعينات إيه وبي وسي عن أرقام المثال في الدرس.\n\nابدأ باسم المحصول والمدى المناسب له، وبعدها اتأكد من العينة وطريقة القياس وتقرير التربة. pH المنخفض ممكن يخلّينا نفكّر في رفعه، والمرتفع يخلّينا نفحص هل خفضه مناسب وممكن. جدول الاتجاهات بداية للتفكير، مش وصفة. افحص كمان الأعراض والمَيّه والجذور والعناصر التانية؛ رقم pH لوحده ما يثبتش سبب اصفرار ورق السنة اللي فاتت.', 'في نشاط إيه وبي وسي مع المدرّب، قيس وسجّل كل عينة فعلية قبل ما تفسّرها أو تقترح إضافة ليها. بدّلوا أدوار اللي بيقيس واللي بيسجّل واللي بيحلّل الجدول بين العينات، علشان الكل يتدرّب على مهارات القياس اللي فاتت. ورقة المجموعة فيها تلات أجزاء، كل جزء عشر دقايق: قياس وتفسير واقتراح. ده جوه تجهيز المدرّب والتعليمات والتنظيف والنقاش، مش أوقات نضيفها فوق بعض. الخطوة دي مركّزة على الاقتراح وسببه؛ إثبات مهارة القياس مكانه الخطوات اللي فاتت. افصل قراءات كل طالب الفعلية للعينات إيه وبي وسي عن أرقام المثال في الدرس.\n\nابدأ باسم المحصول والمدى المناسب له، وبعدها اتأكد من العينة وطريقة القياس وتقرير التربة. بي إتش المنخفض ممكن يخلّينا نفكّر في رفعه، والمرتفع يخلّينا نفحص هل خفضه مناسب وممكن. جدول الاتجاهات بداية للتفكير، مش وصفة. افحص كمان الأعراض والمَيّه والجذور والعناصر التانية؛ رقم بي إتش لوحده ما يثبتش سبب اصفرار ورق السنة اللي فاتت.'), ('لـA/B/C', 'للعينات إيه وبي وسي'), ('من اختيارات تحسين صحة التربة الكمبوست الناضج والسماد البلدي المتحلل ومحاصيل التغطية. ممكن يحسّنوا بناء التربة وحركة المَيّه ودورة العناصر، ويبقوا جزء مفيد من الخطة لو النوع مناسب وآمن للمحصول. بس هم مش نفس المادة كيميائيًا، ومش علاج مضمون لتعادل pH ولا جرعة ثابتة للتحميض.\n\nقبل استخدام الكمبوست أو السماد، راجع النضج والأملاح والعناصر وشروط مسببات المرض والملوثات والكمية والتوقيت. ومحاصيل التغطية محتاجة اختيار نوع وإدارة للموسم. المادة العضوية والطين بيساهموا في مقاومة تغيّر pH، بس أي شكارة كمبوست مش هتخفض pH أرض جيرية تلقائيًا ولا تعالج كل نقص.', 'من اختيارات تحسين صحة التربة الكمبوست الناضج والسماد البلدي المتحلل ومحاصيل التغطية. ممكن يحسّنوا بناء التربة وحركة المَيّه ودورة العناصر، ويبقوا جزء مفيد من الخطة لو النوع مناسب وآمن للمحصول. بس هم مش نفس المادة كيميائيًا، ومش علاج مضمون لتعادل بي إتش ولا جرعة ثابتة للتحميض.\n\nقبل استخدام الكمبوست أو السماد، راجع النضج والأملاح والعناصر وشروط مسببات المرض والملوثات والكمية والتوقيت. ومحاصيل التغطية محتاجة اختيار نوع وإدارة للموسم. المادة العضوية والطين بيساهموا في مقاومة تغيّر بي إتش، بس أي شكارة كمبوست مش هتخفض بي إتش أرض جيرية تلقائيًا ولا تعالج كل نقص.'), ('مواد التجيير الزراعي بتعادل الحموضة. الحجر الجيري الكلسيتي أساسه كربونات الكالسيوم وبيوفّر كالسيوم؛ والدولوميتي فيه كربونات كالسيوم ومغنيسيوم وممكن يوفّر مغنيسيوم. ما تقولش إن أي مادة نقية من كربونات الكالسيوم هتوفّر مغنيسيوم. لو تحليل موثوق بيّن احتياج Mg، الدولوميتي ممكن يناسب الحالة؛ غير كده اختار حسب الاحتياج المقاس وقوة التعادل وتوفر المادة وتكلفتها.\n\nكمثال عام، الجير بيتوزّع بانتظام، وممكن يتخلط بالتربة قبل الزراعة لو ده مناسب، مع وقت للاستجابة ممكن يوصل لشهور. ده مش عمق حرث ولا جرعة ثابتة لكل محصول وأرض. اختيار المادة وكميتها محتاج هدف المحصول والحموضة المقاسة والحموضة المخزونة أو اختبار احتياج جير مناسب، وعمق المعاملة وفعالية المنتج في التعادل. رقم pH واحد مش هيديك كل المعلومات دي. مثال الشرح بيذكر الخلط في أعلى ست بوصات لو مناسب؛ بنحتفظ بيه للمقارنة، مش كعمق ثابت لكل محصول وحقل ونظام حرث. العمق وطريقة الإضافة الفعليين حسب توصية الموقع الموثّقة.', 'مواد التجيير الزراعي بتعادل الحموضة. الحجر الجيري الكلسيتي أساسه كربونات الكالسيوم وبيوفّر كالسيوم؛ والدولوميتي فيه كربونات كالسيوم ومغنيسيوم وممكن يوفّر مغنيسيوم. ما تقولش إن أي مادة نقية من كربونات الكالسيوم هتوفّر مغنيسيوم. لو تحليل موثوق بيّن احتياج المغنيسيوم، الدولوميتي ممكن يناسب الحالة؛ غير كده اختار حسب الاحتياج المقاس وقوة التعادل وتوفر المادة وتكلفتها.\n\nكمثال عام، الجير بيتوزّع بانتظام، وممكن يتخلط بالتربة قبل الزراعة لو ده مناسب، مع وقت للاستجابة ممكن يوصل لشهور. ده مش عمق حرث ولا جرعة ثابتة لكل محصول وأرض. اختيار المادة وكميتها محتاج هدف المحصول والحموضة المقاسة والحموضة المخزونة أو اختبار احتياج جير مناسب، وعمق المعاملة وفعالية المنتج في التعادل. رقم بي إتش واحد مش هيديك كل المعلومات دي. مثال الشرح بيذكر الخلط في أعلى ست بوصات لو مناسب؛ بنحتفظ بيه للمقارنة، مش كعمق ثابت لكل محصول وحقل ونظام حرث. العمق وطريقة الإضافة الفعليين حسب توصية الموقع الموثّقة.'), ('وAl', 'والألومنيوم'), ('وFe', 'والحديد'), ('وpH', 'وبي إتش')], 'en': [("Agricultural liming materials neutralize acidity. Calcitic limestone is chiefly calcium carbonate and supplies calcium; dolomitic limestone contains calcium and magnesium carbonates and can supply magnesium. Do not say that every pure calcium-carbonate material supplies magnesium. If a valid soil test also shows a magnesium need, the dolomitic option may be useful; otherwise choose on the tested need, neutralizing quality, availability and cost.\n\nThe general procedure is to spread lime evenly, consider incorporation before planting and allow months for response. Use this as a general example rather than a fixed tillage depth or rate for every crop and soil. The correct material and amount require crop target, measured acidity and reserve acidity or a calibrated lime-requirement test, soil depth, and the product's effective neutralizing value. A single pH number cannot supply all of these. The teaching example specifies incorporation into the upper 6 inches if feasible; retain that example as a comparison, not a fixed depth for every crop, field or tillage system. The actual depth and placement must follow the documented site recommendation.", "Agricultural liming materials neutralize acidity. Calcitic limestone is chiefly calcium carbonate and supplies calcium; dolomitic limestone contains calcium and magnesium carbonates and can supply magnesium. Do not say that every pure calcium-carbonate material supplies magnesium. If a valid soil test also shows a magnesium need, the dolomitic option may be useful; otherwise choose on the tested need, neutralizing quality, availability and cost.\n\nThe general procedure is to spread lime evenly, consider incorporation before planting and allow months for response. Use this as a general example rather than a fixed tillage depth or rate for every crop and soil. The correct material and amount require crop target, measured acidity and reserve acidity or a calibrated lime-requirement test, soil depth, and the product's effective neutralizing value. A single P H number cannot supply all of these. The teaching example specifies incorporation into the upper six inches if feasible; retain that example as a comparison, not a fixed depth for every crop, field or tillage system. The actual depth and placement must follow the documented site recommendation."), ('Al/Mn', 'aluminum and manganese'), ("Common soil-health inputs include mature compost, well-rotted manure and cover crops as ways to improve soil structure, water behaviour and nutrient cycling. These can be valuable parts of a soil-health plan when the material is appropriate and safe for the crop. They are not chemically identical and cannot be treated as a guaranteed pH-neutralizing product or a fixed acidifying dose.\n\nCheck maturity, salt and nutrient content, pathogen or contaminant rules, rate and timing before using compost or manure; cover crops have their own species and seasonal management. Organic matter and clay contribute to buffering, meaning resistance to rapid pH change, but adding any bag of compost does not automatically lower a calcareous soil's pH or cure every deficiency.", "Common soil-health inputs include mature compost, well-rotted manure and cover crops as ways to improve soil structure, water behaviour and nutrient cycling. These can be valuable parts of a soil-health plan when the material is appropriate and safe for the crop. They are not chemically identical and cannot be treated as a guaranteed P H-neutralizing product or a fixed acidifying dose.\n\nCheck maturity, salt and nutrient content, pathogen or contaminant rules, rate and timing before using compost or manure; cover crops have their own species and seasonal management. Organic matter and clay contribute to buffering, meaning resistance to rapid P H change, but adding any bag of compost does not automatically lower a calcareous soil's P H or cure every deficiency."), ("Elemental sulfur can be oxidized by soil microbes to acidity. The reaction needs suitable moisture and temperature, mixing and time; a sample mixed with sulfur just before class is not guaranteed to meet its target pH. Too much sulfur or a poor fit to the crop and site can harm plants or waste money. The 'high pH to sulfur' table therefore means 'consider and assess sulfur', not 'apply a universal amount'.\n\nThe classroom answer also mentions acidic peat moss. Its possible use in a selected growing medium must not be turned into a universal field recommendation; check the crop system, material and local guidance first. A calcareous soil contains carbonate that strongly resists whole-field acidification. A high-pH result does not reveal whether the soil is calcareous, saline or sodic, or whether potato production on that field is feasible. Check the full analysis and site water, crop and economic context; changing crop, site or management can be more defensible than promising a quick sulfur fix.", "Elemental sulfur can be oxidized by soil microbes to acidity. The reaction needs suitable moisture and temperature, mixing and time; a sample mixed with sulfur just before class is not guaranteed to meet its target P H. Too much sulfur or a poor fit to the crop and site can harm plants or waste money. The 'high P H to sulfur' table therefore means 'consider and assess sulfur', not 'apply a universal amount'.\n\nThe classroom answer also mentions acidic peat moss. Its possible use in a selected growing medium must not be turned into a universal field recommendation; check the crop system, material and local guidance first. A calcareous soil contains carbonate that strongly resists whole-field acidification. A high-P H result does not reveal whether the soil is calcareous, saline or sodic, or whether potato production on that field is feasible. Check the full analysis and site water, crop and economic context; changing crop, site or management can be more defensible than promising a quick sulfur fix."), ('Fe/Mn/Zn', 'iron, manganese and zinc'), ("In a supervised A/B/C activity, measure and record each real sample before interpreting it or suggesting an amendment. Rotate the tester, recorder and chart analyst roles between samples so everyone practises the earlier measurement skills. The group worksheet has three ten-minute parts—measure, explain and suggest—within trainer-led setup, instructions, cleaning and discussion. This step focuses on the suggestion and its reasoning; measured skill evidence belongs to the earlier pH steps. Keep each student's real recorded A/B/C readings separate from the classroom model values.\n\nFirst name the crop and a suitable target range, then confirm the sample, measurement method and soil report. Low pH may call for raising pH; high pH may raise an acidification question. The direction table is a starting point, not a prescription. Also inspect symptoms, water, roots and other nutrients; pH alone cannot prove the cause of last year's yellow leaves.", "In a supervised A/B/C activity, measure and record each real sample before interpreting it or suggesting an amendment. Rotate the tester, recorder and chart analyst roles between samples so everyone practises the earlier measurement skills. The group worksheet has three ten-minute parts—measure, explain and suggest—within trainer-led setup, instructions, cleaning and discussion. This step focuses on the suggestion and its reasoning; measured skill evidence belongs to the earlier P H steps. Keep each student's real recorded A/B/C readings separate from the classroom model values.\n\nFirst name the crop and a suitable target range, then confirm the sample, measurement method and soil report. Low P H may call for raising P H; high P H may raise an acidification question. The direction table is a starting point, not a prescription. Also inspect symptoms, water, roots and other nutrients; P H alone cannot prove the cause of last year's yellow leaves."), ("In the exit case, a field intended for soybeans tests pH 5.2 and last year's plants were yellow and stunted. Classify 5.2 as acidic. Low pH can constrain phosphorus and raise the risk of soluble aluminum affecting roots, so liming is a plausible direction if the crop and validated soil-test recommendation support it. The symptoms alone do not prove pH was the only or actual cause.\n\nCheck representative sampling, a trustworthy pH method, crop and nutrient test, field pattern and other stresses. The laboratory's liming recommendation, including reserve acidity and product quality, determines a rate. If P is truly low, a locally calibrated phosphorus recommendation is a separate decision; bone meal or rock phosphate is not automatically the best or fastest product merely because one classroom option paired it with lime.", "In the exit case, a field intended for soybeans tests P H five point two and last year's plants were yellow and stunted. Classify five point two as acidic. Low P H can constrain phosphorus and raise the risk of soluble aluminum affecting roots, so liming is a plausible direction if the crop and validated soil-test recommendation support it. The symptoms alone do not prove P H was the only or actual cause.\n\nCheck representative sampling, a trustworthy P H method, crop and nutrient test, field pattern and other stresses. The laboratory's liming recommendation, including reserve acidity and product quality, determines a rate. If phosphorus is truly low, a locally calibrated phosphorus recommendation is a separate decision; bone meal or rock phosphate is not automatically the best or fastest product merely because one classroom option paired it with lime."), ('P/Ca/Mg', 'phosphorus, calcium and magnesium'), ('Soil pH describes active acidity in the soil solution; reserve acidity held on exchange sites helps determine how much lime is needed. Clay and organic matter often give greater buffering than a sandy soil, so two soils with the same measured pH may respond to different amounts. In a comparison under otherwise similar conditions, expect more lime for a high-clay soil than a sandy soil under otherwise comparable conditions, but that is a reasoned comparison, not a numerical rule.\n\nAsk the laboratory for its locally appropriate lime-requirement or buffer-pH method, crop target and rate basis. Material fineness and neutralizing power, intended incorporation depth and time also matter. Never multiply a textbook pH difference by a guessed number of bags.', 'Soil P H describes active acidity in the soil solution; reserve acidity held on exchange sites helps determine how much lime is needed. Clay and organic matter often give greater buffering than a sandy soil, so two soils with the same measured P H may respond to different amounts. In a comparison under otherwise similar conditions, expect more lime for a high-clay soil than a sandy soil under otherwise comparable conditions, but that is a reasoned comparison, not a numerical rule.\n\nAsk the laboratory for its locally appropriate lime-requirement or buffer-P H method, crop target and rate basis. Material fineness and neutralizing power, intended incorporation depth and time also matter. Never multiply a textbook P H difference by a guessed number of bags.'), ('Try the model A, B and C decisions in Training before comparing the complete teaching key. Choose a direction, select the evidence you would request and explain your reasoning for each. This online attempt does not require invented field measurements.\n\nUse the nutrient-availability chart to propose—not prove—possible phosphorus, calcium and magnesium constraints or aluminum and manganese risk at low pH, and possible iron, manganese and zinc constraints at high pH. Provide sentence starters and highlighted P, Al and Fe rows when needed; define acidic, alkaline, neutral, amendment, reduced availability and toxicity. Let each learner justify a conclusion, then compare group results and explain measurement differences rather than forcing every group onto the model key.', 'Try the model A, B and C decisions in Training before comparing the complete teaching key. Choose a direction, select the evidence you would request and explain your reasoning for each. This online attempt does not require invented field measurements.\n\nUse the nutrient-availability chart to propose—not prove—possible phosphorus, calcium and magnesium constraints or aluminum and manganese risk at low P H, and possible iron, manganese and zinc constraints at high P H. Provide sentence starters and highlighted phosphorus, aluminum and iron rows when needed; define acidic, alkaline, neutral, amendment, reduced availability and toxicity. Let each learner justify a conclusion, then compare group results and explain measurement differences rather than forcing every group onto the model key.'), ('→', 'to')], 'it': [('Al/Mn', 'alluminio e manganese'), ('Fe/Mn/Zn', 'ferro, manganese e zinco'), ("I materiali per correggere l’acidità del suolo neutralizzano l'acidità. Il calcare calcitico è soprattutto carbonato di calcio e fornisce calcio; quello dolomitico contiene carbonati di calcio e magnesio e può fornire magnesio. Non attribuire magnesio a ogni materiale di puro carbonato di calcio. Se un test valido indica anche carenza di Mg, il tipo dolomitico può essere utile; altrimenti scegli in base a necessità misurata, potere neutralizzante, disponibilità e costo.\n\nCome esempio generale, distribuisci la calce uniformemente, valuta l'incorporazione prima della semina e considera che la risposta può richiedere mesi. Non è una profondità di lavorazione o una dose fissa per tutti i terreni e le colture. Materiale e quantità richiedono obiettivo della coltura, acidità misurata e di riserva o un test calibrato del fabbisogno di calce, profondità del suolo e valore neutralizzante effettivo del prodotto. Un solo numero di pH non fornisce questi dati. L’esempio didattico indica incorporazione nei primi 6 pollici se possibile: resta un confronto, non una profondità fissa per ogni coltura, campo o lavorazione. Profondità e collocazione reali seguono la raccomandazione documentata del sito.", "I materiali per correggere l’acidità del suolo neutralizzano l'acidità. Il calcare calcitico è soprattutto carbonato di calcio e fornisce calcio; quello dolomitico contiene carbonati di calcio e magnesio e può fornire magnesio. Non attribuire magnesio a ogni materiale di puro carbonato di calcio. Se un test valido indica anche carenza di magnesio, il tipo dolomitico può essere utile; altrimenti scegli in base a necessità misurata, potere neutralizzante, disponibilità e costo.\n\nCome esempio generale, distribuisci la calce uniformemente, valuta l'incorporazione prima della semina e considera che la risposta può richiedere mesi. Non è una profondità di lavorazione o una dose fissa per tutti i terreni e le colture. Materiale e quantità richiedono obiettivo della coltura, acidità misurata e di riserva o un test calibrato del fabbisogno di calce, profondità del suolo e valore neutralizzante effettivo del prodotto. Un solo numero di P H non fornisce questi dati. L’esempio didattico indica incorporazione nei primi sei pollici se possibile: resta un confronto, non una profondità fissa per ogni coltura, campo o lavorazione. Profondità e collocazione reali seguono la raccomandazione documentata del sito."), ("I microrganismi del suolo possono ossidare lo zolfo elementare producendo acidità. La reazione richiede umidità, temperatura, mescolamento e tempo adatti; un campione mescolato allo zolfo appena prima della lezione non raggiunge necessariamente il pH obiettivo. Troppo zolfo o una scelta inadatta a coltura e sito può danneggiare le piante o sprecare denaro. La tabella «pH alto verso zolfo» significa quindi «valutare lo zolfo», non «applicare una quantità universale».\n\nLa soluzione modello cita anche torba acida. Un possibile impiego in un substrato scelto non diventa una raccomandazione universale per il campo: verifica sistema colturale, materiale e guida locale. Un suolo calcareo contiene carbonati che ostacolano fortemente l'acidificazione di tutto il campo. Un pH alto non dice se il suolo è calcareo, salino o sodico, né se la patata è fattibile lì. Valuta analisi completa, acqua, coltura ed economia del sito; cambiare coltura, sito o gestione può essere più giustificato di promettere una soluzione rapida con lo zolfo.", "I microrganismi del suolo possono ossidare lo zolfo elementare producendo acidità. La reazione richiede umidità, temperatura, mescolamento e tempo adatti; un campione mescolato allo zolfo appena prima della lezione non raggiunge necessariamente il P H obiettivo. Troppo zolfo o una scelta inadatta a coltura e sito può danneggiare le piante o sprecare denaro. La tabella «P H alto verso zolfo» significa quindi «valutare lo zolfo», non «applicare una quantità universale».\n\nLa soluzione modello cita anche torba acida. Un possibile impiego in un substrato scelto non diventa una raccomandazione universale per il campo: verifica sistema colturale, materiale e guida locale. Un suolo calcareo contiene carbonati che ostacolano fortemente l'acidificazione di tutto il campo. Un P H alto non dice se il suolo è calcareo, salino o sodico, né se la patata è fattibile lì. Valuta analisi completa, acqua, coltura ed economia del sito; cambiare coltura, sito o gestione può essere più giustificato di promettere una soluzione rapida con lo zolfo."), ("Il pH esprime l'acidità attiva nella soluzione del suolo; quella di riserva trattenuta sui siti di scambio aiuta a determinare la calce necessaria. Argilla e sostanza organica spesso aumentano il potere tampone rispetto alla sabbia, così due suoli con uguale pH possono rispondere a quantità diverse. A parità delle altre condizioni un suolo ricco di argilla può richiedere più calce di uno sabbioso, ma è un confronto ragionato, non una formula numerica.\n\nChiedi al laboratorio un metodo locale adatto per il fabbisogno di calce o il pH tampone, l'obiettivo della coltura e la base per la dose. Contano anche finezza e potere neutralizzante del materiale, profondità d'incorporazione e tempo. Non moltiplicare la differenza di pH del libro per un numero di sacchi inventato.", "Il P H esprime l'acidità attiva nella soluzione del suolo; quella di riserva trattenuta sui siti di scambio aiuta a determinare la calce necessaria. Argilla e sostanza organica spesso aumentano il potere tampone rispetto alla sabbia, così due suoli con uguale P H possono rispondere a quantità diverse. A parità delle altre condizioni un suolo ricco di argilla può richiedere più calce di uno sabbioso, ma è un confronto ragionato, non una formula numerica.\n\nChiedi al laboratorio un metodo locale adatto per il fabbisogno di calce o il P H tampone, l'obiettivo della coltura e la base per la dose. Contano anche finezza e potere neutralizzante del materiale, profondità d'incorporazione e tempo. Non moltiplicare la differenza di P H del libro per un numero di sacchi inventato."), ("In un'attività A/B/C supervisionata, misura e registra ogni campione reale prima di interpretarlo o proporre un ammendante. Alterna tra i campioni i ruoli di chi misura, registra e analizza il grafico, così tutti esercitano le competenze di misura già trattate. Il foglio di gruppo ha tre parti da dieci minuti — misura, spiegazione e proposta — all'interno di preparazione, istruzioni, pulizia e discussione guidate dal formatore. Questa fase valuta proposta e motivazione; le prove dell'abilità di misura spettano alle fasi pH precedenti. Tieni separate le letture A/B/C reali di ogni allievo dai valori modello.\n\nIndica prima coltura e intervallo obiettivo adatto; poi conferma campione, metodo di misura e rapporto del suolo. pH basso può far considerare un aumento; pH alto apre la questione dell'acidificazione. La tabella delle direzioni è un punto di partenza, non una ricetta. Esamina anche sintomi, acqua, radici e altri nutrienti: il solo pH non prova la causa delle foglie gialle dell'anno scorso.", "In un'attività A/B/C supervisionata, misura e registra ogni campione reale prima di interpretarlo o proporre un ammendante. Alterna tra i campioni i ruoli di chi misura, registra e analizza il grafico, così tutti esercitano le competenze di misura già trattate. Il foglio di gruppo ha tre parti da dieci minuti — misura, spiegazione e proposta — all'interno di preparazione, istruzioni, pulizia e discussione guidate dal formatore. Questa fase valuta proposta e motivazione; le prove dell'abilità di misura spettano alle fasi P H precedenti. Tieni separate le letture A/B/C reali di ogni allievo dai valori modello.\n\nIndica prima coltura e intervallo obiettivo adatto; poi conferma campione, metodo di misura e rapporto del suolo. P H basso può far considerare un aumento; P H alto apre la questione dell'acidificazione. La tabella delle direzioni è un punto di partenza, non una ricetta. Esamina anche sintomi, acqua, radici e altri nutrienti: il solo P H non prova la causa delle foglie gialle dell'anno scorso."), ("Nel caso finale, un campo destinato alla soia ha pH 5.2 e le piante dell'anno scorso erano gialle e stentate. Classifica 5.2 come acido. Un pH basso può limitare il fosforo e aumentare il rischio di alluminio solubile per le radici: l’apporto di calce è una possibile direzione se coltura e raccomandazione da analisi convalidata la sostengono. I sintomi da soli non provano che il pH fosse l'unica causa, né quella reale.\n\nControlla campionamento rappresentativo, metodo pH affidabile, analisi per coltura e nutrienti, distribuzione dei sintomi e altri stress. Una raccomandazione del laboratorio sulla calce, con acidità di riserva e qualità del prodotto, determina la dose. Se P è davvero basso, la raccomandazione locale sul fosforo da un test calibrato è una decisione separata; farina d'ossa o fosfato naturale non diventano automaticamente il prodotto migliore o più rapido perché un'opzione didattica li ha accoppiati alla calce.", "Nel caso finale, un campo destinato alla soia ha P H cinque virgola due e le piante dell'anno scorso erano gialle e stentate. Classifica cinque virgola due come acido. Un P H basso può limitare il fosforo e aumentare il rischio di alluminio solubile per le radici: l’apporto di calce è una possibile direzione se coltura e raccomandazione da analisi convalidata la sostengono. I sintomi da soli non provano che il P H fosse l'unica causa, né quella reale.\n\nControlla campionamento rappresentativo, metodo P H affidabile, analisi per coltura e nutrienti, distribuzione dei sintomi e altri stress. Una raccomandazione del laboratorio sulla calce, con acidità di riserva e qualità del prodotto, determina la dose. Se fosforo è davvero basso, la raccomandazione locale sul fosforo da un test calibrato è una decisione separata; farina d'ossa o fosfato naturale non diventano automaticamente il prodotto migliore o più rapido perché un'opzione didattica li ha accoppiati alla calce."), ('P/Ca/Mg', 'fosforo, calcio e magnesio'), ('Prova le decisioni sui casi modello A, B e C in Esercitazione prima di confrontare la chiave didattica completa. Scegli una direzione, seleziona le prove da richiedere e motiva ogni caso. Questo tentativo online non richiede misure di campo inventate.\n\nUsa il grafico di disponibilità dei nutrienti per proporre, non dimostrare, possibili limiti di fosforo, calcio e magnesio o rischio da alluminio e manganese a pH basso e limiti di ferro, manganese e zinco a pH alto. Offri frasi guida e metti in risalto P, Al e Fe se necessario; definisci acido, alcalino, neutro, ammendante, scarsa disponibilità e tossicità. Ogni allievo motiva una conclusione; poi confronta i gruppi e spiega differenze di misura senza forzare tutti sulla chiave modello.', 'Prova le decisioni sui casi modello A, B e C in Esercitazione prima di confrontare la chiave didattica completa. Scegli una direzione, seleziona le prove da richiedere e motiva ogni caso. Questo tentativo online non richiede misure di campo inventate.\n\nUsa il grafico di disponibilità dei nutrienti per proporre, non dimostrare, possibili limiti di fosforo, calcio e magnesio o rischio da alluminio e manganese a P H basso e limiti di ferro, manganese e zinco a P H alto. Offri frasi guida e metti in risalto fosforo, alluminio e ferro se necessario; definisci acido, alcalino, neutro, ammendante, scarsa disponibilità e tossicità. Ogni allievo motiva una conclusione; poi confronta i gruppi e spiega differenze di misura senza forzare tutti sulla chiave modello.'), ("Tra gli apporti per la salute del suolo ci sono compost maturo, letame ben decomposto e colture di copertura, che possono migliorare struttura, comportamento dell'acqua e ciclo dei nutrienti. Possono far parte di un piano utile quando il materiale è adatto e sicuro per la coltura. Non sono chimicamente identici né prodotti che neutralizzano sempre il pH o dosi fisse di acidificazione.\n\nControlla maturazione, sali, nutrienti, regole su patogeni e contaminanti, dose e tempi prima di usare compost o letame; le colture di copertura richiedono scelta di specie e gestione stagionale. Sostanza organica e argilla contribuiscono al potere tampone, cioè alla resistenza a rapidi cambiamenti di pH; un sacco qualsiasi di compost non abbassa automaticamente il pH di un terreno calcareo né cura ogni carenza.", "Tra gli apporti per la salute del suolo ci sono compost maturo, letame ben decomposto e colture di copertura, che possono migliorare struttura, comportamento dell'acqua e ciclo dei nutrienti. Possono far parte di un piano utile quando il materiale è adatto e sicuro per la coltura. Non sono chimicamente identici né prodotti che neutralizzano sempre il P H o dosi fisse di acidificazione.\n\nControlla maturazione, sali, nutrienti, regole su patogeni e contaminanti, dose e tempi prima di usare compost o letame; le colture di copertura richiedono scelta di specie e gestione stagionale. Sostanza organica e argilla contribuiscono al potere tampone, cioè alla resistenza a rapidi cambiamenti di P H; un sacco qualsiasi di compost non abbassa automaticamente il P H di un terreno calcareo né cura ogni carenza."), ('→', 'verso')], 'de': [('Al/Mn', 'Aluminium und Mangan'), ('Bearbeite die Modellfälle A, B und C im Training, bevor du den vollständigen Lehrschlüssel vergleichst. Wähle für jeden Fall eine Richtung und die Belege, die du anfordern würdest, und schreibe deine Begründung. Für diesen Online-Versuch müssen keine Feldmessungen erfunden werden.\n\nNutze die Nährstoffgrafik, um mögliche Einschränkungen bei Phosphor, Calcium und Magnesium oder Aluminium und Mangan-Risiken bei niedrigem pH sowie Eisen, Mangan und Zink-Einschränkungen bei hohem pH vorzuschlagen, nicht zu beweisen. Biete Satzanfänge und markiere bei Bedarf P-, Al- und Fe-Zeilen; erkläre sauer, alkalisch, neutral, Bodenverbesserung, verminderte Verfügbarkeit und Toxizität. Jede Person begründet ihr Urteil; danach werden Gruppenwerte und Messunterschiede verglichen, statt alle auf die Modelllösung zu zwingen.', 'Bearbeite die Modellfälle A, B und C im Training, bevor du den vollständigen Lehrschlüssel vergleichst. Wähle für jeden Fall eine Richtung und die Belege, die du anfordern würdest, und schreibe deine Begründung. Für diesen Online-Versuch müssen keine Feldmessungen erfunden werden.\n\nNutze die Nährstoffgrafik, um mögliche Einschränkungen bei Phosphor, Calcium und Magnesium oder Aluminium und Mangan-Risiken bei niedrigem P H sowie Eisen, Mangan und Zink-Einschränkungen bei hohem P H vorzuschlagen, nicht zu beweisen. Biete Satzanfänge und markiere bei Bedarf Phosphor-, Aluminium- und Eisen-Zeilen; erkläre sauer, alkalisch, neutral, Bodenverbesserung, verminderte Verfügbarkeit und Toxizität. Jede Person begründet ihr Urteil; danach werden Gruppenwerte und Messunterschiede verglichen, statt alle auf die Modelllösung zu zwingen.'), ('Bei der beaufsichtigten A/B/C-Übung wird jede echte Probe zuerst gemessen und erfasst, bevor sie gedeutet oder ein Bodenmaterial empfohlen wird. Wechsle Mess-, Schreib- und Analyseaufgaben zwischen den Proben, damit alle zuvor gelernte Messfertigkeiten üben. Das Gruppenblatt hat drei Teile von je zehn Minuten — messen, erklären, vorschlagen — innerhalb der von der Lehrkraft geleiteten Vorbereitung, Anleitung, Reinigung und Diskussion. Dieser Schritt bewertet Vorschlag und Begründung; Messfertigkeiten werden in den früheren pH-Schritten nachgewiesen. Die tatsächlichen A/B/C-Werte jeder Person bleiben getrennt von den Klassenmodellwerten.\n\nNenne zuerst die Kultur und einen geeigneten Zielbereich, dann bestätige Probe, Messverfahren und Bodenbericht. Niedriger pH kann eine Anhebung nahelegen; hoher pH wirft die Frage einer möglichen Ansäuerung auf. Die Richtungstabelle ist ein Ausgangspunkt, keine Verschreibung. Betrachte auch Symptome, Wasser, Wurzeln und andere Nährstoffe: pH allein beweist nicht die Ursache der letztjährigen gelben Blätter.', 'Bei der beaufsichtigten A/B/C-Übung wird jede echte Probe zuerst gemessen und erfasst, bevor sie gedeutet oder ein Bodenmaterial empfohlen wird. Wechsle Mess-, Schreib- und Analyseaufgaben zwischen den Proben, damit alle zuvor gelernte Messfertigkeiten üben. Das Gruppenblatt hat drei Teile von je zehn Minuten — messen, erklären, vorschlagen — innerhalb der von der Lehrkraft geleiteten Vorbereitung, Anleitung, Reinigung und Diskussion. Dieser Schritt bewertet Vorschlag und Begründung; Messfertigkeiten werden in den früheren P H-Schritten nachgewiesen. Die tatsächlichen A/B/C-Werte jeder Person bleiben getrennt von den Klassenmodellwerten.\n\nNenne zuerst die Kultur und einen geeigneten Zielbereich, dann bestätige Probe, Messverfahren und Bodenbericht. Niedriger P H kann eine Anhebung nahelegen; hoher P H wirft die Frage einer möglichen Ansäuerung auf. Die Richtungstabelle ist ein Ausgangspunkt, keine Verschreibung. Betrachte auch Symptome, Wasser, Wurzeln und andere Nährstoffe: P H allein beweist nicht die Ursache der letztjährigen gelben Blätter.'), ('Bodenmikroben können elementaren Schwefel zu Säure oxidieren. Die Reaktion benötigt geeignete Feuchte, Temperatur, Mischung und Zeit; eine unmittelbar vor dem Unterricht mit Schwefel gemischte Probe erreicht nicht garantiert einen Ziel-pH. Zu viel Schwefel oder eine unpassende Wahl für Kultur und Standort kann Pflanzen schaden oder Geld verschwenden. Die Tabelle „hoher pH zu Schwefel“ bedeutet deshalb „Schwefel prüfen“, nicht „allgemeine Menge ausbringen“.\n\nDie Klassenlösung erwähnt auch sauren Torf. Eine mögliche Nutzung in einem ausgewählten Kultursubstrat ist keine allgemeine Feldempfehlung: Prüfe Anbausystem, Material und lokale Beratung. Kalkhaltiger Boden enthält Carbonate, die einer Ansäuerung des ganzen Feldes stark entgegenwirken. Hoher pH verrät nicht, ob der Boden kalkhaltig, salzig oder sodisch ist oder ob Kartoffelanbau dort sinnvoll ist. Prüfe vollständigen Bericht, Wasser, Kultur und Wirtschaftlichkeit; Kultur-, Standort- oder Managementwechsel kann besser begründet sein als eine schnelle Schwefellösung zu versprechen.', 'Bodenmikroben können elementaren Schwefel zu Säure oxidieren. Die Reaktion benötigt geeignete Feuchte, Temperatur, Mischung und Zeit; eine unmittelbar vor dem Unterricht mit Schwefel gemischte Probe erreicht nicht garantiert einen Ziel-P H. Zu viel Schwefel oder eine unpassende Wahl für Kultur und Standort kann Pflanzen schaden oder Geld verschwenden. Die Tabelle „hoher P H zu Schwefel“ bedeutet deshalb „Schwefel prüfen“, nicht „allgemeine Menge ausbringen“.\n\nDie Klassenlösung erwähnt auch sauren Torf. Eine mögliche Nutzung in einem ausgewählten Kultursubstrat ist keine allgemeine Feldempfehlung: Prüfe Anbausystem, Material und lokale Beratung. Kalkhaltiger Boden enthält Carbonate, die einer Ansäuerung des ganzen Feldes stark entgegenwirken. Hoher P H verrät nicht, ob der Boden kalkhaltig, salzig oder sodisch ist oder ob Kartoffelanbau dort sinnvoll ist. Prüfe vollständigen Bericht, Wasser, Kultur und Wirtschaftlichkeit; Kultur-, Standort- oder Managementwechsel kann besser begründet sein als eine schnelle Schwefellösung zu versprechen.'), ('Fe/Mn/Zn', 'Eisen, Mangan und Zink'), ('Im Abschlussfall hat ein für Soja vorgesehenes Feld pH 5.2; die Pflanzen des Vorjahres waren gelb und verkümmert. Ordne 5.2 als sauer ein. Niedriger pH kann Phosphor begrenzen und die Gefahr löslichen Aluminiums für Wurzeln erhöhen; Kalkung ist deshalb eine mögliche Richtung, wenn Kultur und geprüfte Bodenempfehlung sie stützen. Symptome allein beweisen weder pH als einzige noch als tatsächliche Ursache.\n\nPrüfe repräsentative Beprobung, zuverlässige pH-Methode, Kultur- und Nährstofftests, Feldmuster und andere Belastungen. Die Kalkungsempfehlung des Labors mit Reserveazidität und Produktqualität bestimmt die Menge. Ist P tatsächlich niedrig, ist eine lokal kalibrierte Phosphorempfehlung eine getrennte Entscheidung; Knochenmehl oder Rohphosphat sind nicht automatisch das beste oder schnellste Produkt, bloß weil eine Klassenantwort es mit Kalk kombinierte.', 'Im Abschlussfall hat ein für Soja vorgesehenes Feld P H fünf Komma zwei; die Pflanzen des Vorjahres waren gelb und verkümmert. Ordne fünf Komma zwei als sauer ein. Niedriger P H kann Phosphor begrenzen und die Gefahr löslichen Aluminiums für Wurzeln erhöhen; Kalkung ist deshalb eine mögliche Richtung, wenn Kultur und geprüfte Bodenempfehlung sie stützen. Symptome allein beweisen weder P H als einzige noch als tatsächliche Ursache.\n\nPrüfe repräsentative Beprobung, zuverlässige P H-Methode, Kultur- und Nährstofftests, Feldmuster und andere Belastungen. Die Kalkungsempfehlung des Labors mit Reserveazidität und Produktqualität bestimmt die Menge. Ist Phosphor tatsächlich niedrig, ist eine lokal kalibrierte Phosphorempfehlung eine getrennte Entscheidung; Knochenmehl oder Rohphosphat sind nicht automatisch das beste oder schnellste Produkt, bloß weil eine Klassenantwort es mit Kalk kombinierte.'), ('Landwirtschaftliche Kalkungsmittel neutralisieren Säure. Calcitischer Kalkstein besteht vor allem aus Calciumcarbonat und liefert Calcium; dolomitischer Kalkstein enthält Calcium- und Magnesiumcarbonate und kann Magnesium liefern. Behaupte nicht, dass jedes reine Calciumcarbonat Magnesium liefert. Zeigt eine gültige Bodenuntersuchung auch Mg-Bedarf, kann Dolomit sinnvoll sein; sonst entscheide nach geprüftem Bedarf, Neutralisationswert, Verfügbarkeit und Kosten.\n\nAls allgemeines Beispiel wird Kalk gleichmäßig verteilt, gegebenenfalls vor dem Pflanzen eingearbeitet und es werden Monate für die Wirkung eingeplant. Dies ist keine feste Bearbeitungstiefe oder Menge für jede Kultur und jeden Boden. Material und Menge erfordern Kulturziel, gemessene und Reserveazidität oder geeignete Kalkbedarfsprüfung, Bodentiefe sowie wirksamen Neutralisationswert des Produkts. Eine pH-Zahl allein liefert das nicht. Das Lehrbeispiel nennt Einarbeitung in die oberen 6 Zoll, soweit möglich. Als Vergleich erhalten, nicht als feste Tiefe für jede Kultur, Fläche oder Bodenbearbeitung. Echte Tiefe und Platzierung folgen der dokumentierten Standortempfehlung.', 'Landwirtschaftliche Kalkungsmittel neutralisieren Säure. Calcitischer Kalkstein besteht vor allem aus Calciumcarbonat und liefert Calcium; dolomitischer Kalkstein enthält Calcium- und Magnesiumcarbonate und kann Magnesium liefern. Behaupte nicht, dass jedes reine Calciumcarbonat Magnesium liefert. Zeigt eine gültige Bodenuntersuchung auch Magnesium-Bedarf, kann Dolomit sinnvoll sein; sonst entscheide nach geprüftem Bedarf, Neutralisationswert, Verfügbarkeit und Kosten.\n\nAls allgemeines Beispiel wird Kalk gleichmäßig verteilt, gegebenenfalls vor dem Pflanzen eingearbeitet und es werden Monate für die Wirkung eingeplant. Dies ist keine feste Bearbeitungstiefe oder Menge für jede Kultur und jeden Boden. Material und Menge erfordern Kulturziel, gemessene und Reserveazidität oder geeignete Kalkbedarfsprüfung, Bodentiefe sowie wirksamen Neutralisationswert des Produkts. Eine P H-Zahl allein liefert das nicht. Das Lehrbeispiel nennt Einarbeitung in die oberen sechs Zoll, soweit möglich. Als Vergleich erhalten, nicht als feste Tiefe für jede Kultur, Fläche oder Bodenbearbeitung. Echte Tiefe und Platzierung folgen der dokumentierten Standortempfehlung.'), ('Mögliche Beiträge zur Bodengesundheit sind reifer Kompost, gut verrotteter Mist und Zwischenfrüchte; sie können Bodenstruktur, Wasserhaushalt und Nährstoffkreislauf verbessern. Sie können Teil eines sinnvollen Plans sein, wenn das Material für die Kultur geeignet und sicher ist. Chemisch sind sie nicht gleich, neutralisieren den pH nicht garantiert und sind keine feste Säuregabe.\n\nPrüfe Reife, Salz- und Nährstoffgehalt, Regeln zu Keimen und Schadstoffen, Menge und Zeitpunkt vor Kompost- oder Mistanwendung; Zwischenfrüchte benötigen passende Arten und Saisonführung. Organische Substanz und Ton tragen zur Pufferung bei, also zur Widerstandskraft gegen raschen pH-Wechsel. Ein beliebiger Kompostsack senkt den pH eines kalkhaltigen Bodens nicht automatisch und behebt nicht jeden Mangel.', 'Mögliche Beiträge zur Bodengesundheit sind reifer Kompost, gut verrotteter Mist und Zwischenfrüchte; sie können Bodenstruktur, Wasserhaushalt und Nährstoffkreislauf verbessern. Sie können Teil eines sinnvollen Plans sein, wenn das Material für die Kultur geeignet und sicher ist. Chemisch sind sie nicht gleich, neutralisieren den P H nicht garantiert und sind keine feste Säuregabe.\n\nPrüfe Reife, Salz- und Nährstoffgehalt, Regeln zu Keimen und Schadstoffen, Menge und Zeitpunkt vor Kompost- oder Mistanwendung; Zwischenfrüchte benötigen passende Arten und Saisonführung. Organische Substanz und Ton tragen zur Pufferung bei, also zur Widerstandskraft gegen raschen P H-Wechsel. Ein beliebiger Kompostsack senkt den P H eines kalkhaltigen Bodens nicht automatisch und behebt nicht jeden Mangel.'), ('P/Ca/Mg', 'Phosphor, Calcium und Magnesium'), ('pH beschreibt aktive Säure in der Bodenlösung; auf Austauscherplätzen gebundene Reserveazidität beeinflusst die Kalkmenge. Ton und organische Substanz erhöhen häufig die Pufferung gegenüber Sand, sodass Böden mit gleicher pH-Messung auf unterschiedliche Mengen reagieren. Unter sonst vergleichbaren Bedingungen kann tonreicher Boden mehr Kalk als sandiger benötigen, aber dies ist eine begründete Gegenüberstellung, keine Zahlenregel.\n\nBitte das Labor um ein lokal passendes Kalkbedarfs- oder Puffer-pH-Verfahren, Kulturziel und Mengenbasis. Feinheit und Neutralisationskraft des Materials, geplante Einarbeitungstiefe und Zeit zählen ebenfalls. Multipliziere eine pH-Differenz aus dem Lehrbuch nicht mit einer erfundenen Sackzahl.', 'P H beschreibt aktive Säure in der Bodenlösung; auf Austauscherplätzen gebundene Reserveazidität beeinflusst die Kalkmenge. Ton und organische Substanz erhöhen häufig die Pufferung gegenüber Sand, sodass Böden mit gleicher P H-Messung auf unterschiedliche Mengen reagieren. Unter sonst vergleichbaren Bedingungen kann tonreicher Boden mehr Kalk als sandiger benötigen, aber dies ist eine begründete Gegenüberstellung, keine Zahlenregel.\n\nBitte das Labor um ein lokal passendes Kalkbedarfs- oder Puffer-P H-Verfahren, Kulturziel und Mengenbasis. Feinheit und Neutralisationskraft des Materials, geplante Einarbeitungstiefe und Zeit zählen ebenfalls. Multipliziere eine P H-Differenz aus dem Lehrbuch nicht mit einer erfundenen Sackzahl.'), ('→', 'zu')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s208-readings-audio-20261023-r1'
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
