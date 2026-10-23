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
IDS = ('S3-07-ar-EG-case-records-r1', 'S3-07-ar-EG-criteria-r1', 'S3-07-en-case-records-r1', 'S3-07-en-criteria-r1', 'S3-07-it-case-records-r1', 'S3-07-it-criteria-r1', 'S3-07-de-case-records-r1', 'S3-07-de-criteria-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==8
    assert(req['scope'],req['stepId'])==('S307_EIGHT_PRACTICE_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-07')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_TWO_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(8,8,8,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s307-practice-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==8
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allSixteenCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(2))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['case-records','criteria']
        voice='Charon'if group in ['case-records']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'case-records': ['/stressPractice/ui/caseSheets', '/stressPractice/ui/caseFields/0', '/stressPractice/ui/caseFields/1', '/stressPractice/ui/caseFields/2', '/stressPractice/ui/caseFields/3', '/stressPractice/ui/caseFields/4', '/stressPractice/ui/caseFields/5', '/stressPractice/ui/caseFields/6', '/stressPractice/ui/caseFields/7', '/stressPractice/ui/caseFields/8', '/stressPractice/ui/caseFields/9', '/stressPractice/ui/defence', '/stressPractice/ui/defenceFields/0', '/stressPractice/ui/defenceFields/1', '/stressPractice/ui/defenceFields/2', '/stressPractice/ui/reasonBoundary', '/stressPractice/ui/boundary'], 'criteria': ['/stressPractice/passChecks/0/evidence', '/stressPractice/passChecks/0/decision', '/stressPractice/passChecks/1/evidence', '/stressPractice/passChecks/1/decision', '/stressPractice/passChecks/2/evidence', '/stressPractice/passChecks/2/decision', '/stressPractice/practicalInstruction', '/stressPractice/addedReflection', '/stressPractice/ui/notes']}, 'en': {'case-records': ['/stressPractice/ui/caseSheets', '/stressPractice/ui/caseFields/0', '/stressPractice/ui/caseFields/1', '/stressPractice/ui/caseFields/2', '/stressPractice/ui/caseFields/3', '/stressPractice/ui/caseFields/4', '/stressPractice/ui/caseFields/5', '/stressPractice/ui/caseFields/6', '/stressPractice/ui/caseFields/7', '/stressPractice/ui/caseFields/8', '/stressPractice/ui/caseFields/9', '/stressPractice/ui/defence', '/stressPractice/ui/defenceFields/0', '/stressPractice/ui/defenceFields/1', '/stressPractice/ui/defenceFields/2', '/stressPractice/ui/reasonBoundary', '/stressPractice/ui/boundary'], 'criteria': ['/stressPractice/passChecks/0/evidence', '/stressPractice/passChecks/0/decision', '/stressPractice/passChecks/1/evidence', '/stressPractice/passChecks/1/decision', '/stressPractice/passChecks/2/evidence', '/stressPractice/passChecks/2/decision', '/stressPractice/practicalInstruction', '/stressPractice/addedReflection', '/stressPractice/ui/notes']}, 'it': {'case-records': ['/stressPractice/ui/caseSheets', '/stressPractice/ui/caseFields/0', '/stressPractice/ui/caseFields/1', '/stressPractice/ui/caseFields/2', '/stressPractice/ui/caseFields/3', '/stressPractice/ui/caseFields/4', '/stressPractice/ui/caseFields/5', '/stressPractice/ui/caseFields/6', '/stressPractice/ui/caseFields/7', '/stressPractice/ui/caseFields/8', '/stressPractice/ui/caseFields/9', '/stressPractice/ui/defence', '/stressPractice/ui/defenceFields/0', '/stressPractice/ui/defenceFields/1', '/stressPractice/ui/defenceFields/2', '/stressPractice/ui/reasonBoundary', '/stressPractice/ui/boundary'], 'criteria': ['/stressPractice/passChecks/0/evidence', '/stressPractice/passChecks/0/decision', '/stressPractice/passChecks/1/evidence', '/stressPractice/passChecks/1/decision', '/stressPractice/passChecks/2/evidence', '/stressPractice/passChecks/2/decision', '/stressPractice/practicalInstruction', '/stressPractice/addedReflection', '/stressPractice/ui/notes']}, 'de': {'case-records': ['/stressPractice/ui/caseSheets', '/stressPractice/ui/caseFields/0', '/stressPractice/ui/caseFields/1', '/stressPractice/ui/caseFields/2', '/stressPractice/ui/caseFields/3', '/stressPractice/ui/caseFields/4', '/stressPractice/ui/caseFields/5', '/stressPractice/ui/caseFields/6', '/stressPractice/ui/caseFields/7', '/stressPractice/ui/caseFields/8', '/stressPractice/ui/caseFields/9', '/stressPractice/ui/defence', '/stressPractice/ui/defenceFields/0', '/stressPractice/ui/defenceFields/1', '/stressPractice/ui/defenceFields/2', '/stressPractice/ui/reasonBoundary', '/stressPractice/ui/boundary'], 'criteria': ['/stressPractice/passChecks/0/evidence', '/stressPractice/passChecks/0/decision', '/stressPractice/passChecks/1/evidence', '/stressPractice/passChecks/1/decision', '/stressPractice/passChecks/2/evidence', '/stressPractice/passChecks/2/decision', '/stressPractice/practicalInstruction', '/stressPractice/addedReflection', '/stressPractice/ui/notes']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('جهّز سجلين لحالتين مختلفتين\n\nالملاحظة وعمر الورق المصاب ومكانه\n\nتفسيرين محتملين على الأقل\n\nأدلة التربة والجذور والجو واللي لسه مش معروف\n\nتحليل أو ملاحظة ممكن تغيّر فرضيتك\n\nأولوية المياه وطريقة مشروطة ودليل مواعيد الري\n\nالمصدر المناسب وليه مناسب\n\nالكمية: دليلها أو بيانات ناقصة، مش رقم متخيل\n\nالوقت المناسب وظروف فقد العناصر\n\nالمكان وأمان المنتج والبذرة وإمكانية التنفيذ\n\nمسار الفقد المحتمل والتكلفة والبديل\n\nشرح الفرد وبطاقة الخروج\n\nهتدافع عن أنهي حالة وليه؟\n\nإيه الاعتراض أو الدليل الجديد اللي ممكن يغيّر توصيتك؟\n\nبطاقة الخروج: علامة حواف الورق مع K وطريقة معللة لتربة رملية جدًا\n\nوجود كلام بيفتح المقارنة بس؛ مش بيثبت صحة السبب العلمي.\n\nالتدريبات دي بتجهّز التفكير بس. كتابة كل الخانات أو صحة الاختيارات ما تثبتش تشخيص حقل أو علاج فعلي أو اجتياز المعايير؛ المدرّب لازم يراجع تفسير الحالتين.', 'جهّز سجلين لحالتين مختلفتين\n\nالملاحظة وعمر الورق المصاب ومكانه\n\nتفسيرين محتملين على الأقل\n\nأدلة التربة والجذور والجو واللي لسه مش معروف\n\nتحليل أو ملاحظة ممكن تغيّر فرضيتك\n\nأولوية المياه وطريقة مشروطة ودليل مواعيد الري\n\nالمصدر المناسب وليه مناسب\n\nالكمية: دليلها أو بيانات ناقصة، مش رقم متخيل\n\nالوقت المناسب وظروف فقد العناصر\n\nالمكان وأمان المنتج والبذرة وإمكانية التنفيذ\n\nمسار الفقد المحتمل والتكلفة والبديل\n\nشرح الفرد وبطاقة الخروج\n\nهتدافع عن أنهي حالة وليه؟\n\nإيه الاعتراض أو الدليل الجديد اللي ممكن يغيّر توصيتك؟\n\nبطاقة الخروج: علامة حواف الورق مع كي وطريقة معللة لتربة رملية جدًا\n\nوجود كلام بيفتح المقارنة بس؛ مش بيثبت صحة السبب العلمي.\n\nالتدريبات دي بتجهّز التفكير بس. كتابة كل الخانات أو صحة الاختيارات ما تثبتش تشخيص حقل أو علاج فعلي أو اجتياز المعايير؛ المدرّب لازم يراجع تفسير الحالتين.'), ('في الطماطم والقمح وتخطيط الورقيات والذرة في البرد، بيفصل الحقائق عن الفرضيات، ويقدم أسبابًا بديلة وفحصًا تاليًا، ويقدّم علاج الركود المائي/إجهاد الجذور الحقيقي على نصيحة السماد.\n\nالاجتياز محتاج أدلة وتفسيرات منافسة؛ تسمية نقص عنصر من صورة ورقة أو ذبول الظهر وحده محتاج مراجعة تساعدك تصلّح السبب.\n\nلكل اقتراح تسميد يحدد مصدر العنصر ودليل الكمية ووقت الإضافة ومكانها؛ الكمية محتاجة بيانات تربة ومحصول وإرشاد محلي مناسب. يوضح إن نترات الكالسيوم N وCa وليست NPK، ويتجنب اليوريا أو DAP أو رش البوتاسيوم تلقائيًا بسبب الأعراض.\n\nينجح لما الأربع قرارات وأولوية الماء تناسب الحالة، من غير جرعة أو موعد غير مسنود.\n\nيسلّم ورقتين كاملتين لحالتين مختلفتين، ويدافع عن واحدة شفهيًا أو بتفسير مكتوب مكافئ، ويناقش بدائل الحالات الأخرى. في ورشة المدرّب ذات ٤٥ دقيقة بتتسجل مساهمة وتفكير كل فرد حتى لو النقاش جماعي.\n\nينجح بحالتين كاملتين مبنيتين على الدليل وشرح واحد مدافع عنه؛ مجرد حضور أو إجابة المجموعة ما يثبتش تفكير الفرد.\n\nالمدرّب ممكن يدير نقاش حالات ٤٥ دقيقة ويلاحظ التفكير. ده مش إثبات موقّع لمهارة تشخيص حقل أو إضافة سماد. أي نصيحة حقيقية للحقل محتاجة تحاليل محلية وإشرافًا مؤهلًا.\n\nأنهي عرض فسّرته بسرعة زيادة؟ أنهي فحص ممكن يغيّر رأيك؟ وأنهي قرار من الأربع قواعد لسه ناقصه دليل؟\n\nلسه مفيش ملاحظة أو قرار مدرّب أو توقيع متسجل. يتكتبوا بعد شغل فعلي تحت الإشراف.', 'في الطماطم والقمح وتخطيط الورقيات والذرة في البرد، بيفصل الحقائق عن الفرضيات، ويقدم أسبابًا بديلة وفحصًا تاليًا، ويقدّم علاج الركود المائي أو إجهاد الجذور الحقيقي على نصيحة السماد.\n\nالاجتياز محتاج أدلة وتفسيرات منافسة؛ تسمية نقص عنصر من صورة ورقة أو ذبول الظهر وحده محتاج مراجعة تساعدك تصلّح السبب.\n\nلكل اقتراح تسميد يحدد مصدر العنصر ودليل الكمية ووقت الإضافة ومكانها؛ الكمية محتاجة بيانات تربة ومحصول وإرشاد محلي مناسب. يوضح إن نترات الكالسيوم إن وسي إيه وليست إن وبي وكي، ويتجنب اليوريا أو دي إيه بي أو رش البوتاسيوم تلقائيًا بسبب الأعراض.\n\nينجح لما الأربع قرارات وأولوية الماء تناسب الحالة، من غير جرعة أو موعد غير مسنود.\n\nيسلّم ورقتين كاملتين لحالتين مختلفتين، ويدافع عن واحدة شفهيًا أو بتفسير مكتوب مكافئ، ويناقش بدائل الحالات الأخرى. في ورشة المدرّب ذات خمسة وأربعين دقيقة بتتسجل مساهمة وتفكير كل فرد حتى لو النقاش جماعي.\n\nينجح بحالتين كاملتين مبنيتين على الدليل وشرح واحد مدافع عنه؛ مجرد حضور أو إجابة المجموعة ما يثبتش تفكير الفرد.\n\nالمدرّب ممكن يدير نقاش حالات خمسة وأربعين دقيقة ويلاحظ التفكير. ده مش إثبات موقّع لمهارة تشخيص حقل أو إضافة سماد. أي نصيحة حقيقية للحقل محتاجة تحاليل محلية وإشرافًا مؤهلًا.\n\nأنهي عرض فسّرته بسرعة زيادة؟ أنهي فحص ممكن يغيّر رأيك؟ وأنهي قرار من الأربع قواعد لسه ناقصه دليل؟\n\nلسه مفيش ملاحظة أو قرار مدرّب أو توقيع متسجل. يتكتبوا بعد شغل فعلي تحت الإشراف.')], 'en': [("For tomato, wheat, leafy planning and cold maize, labels facts separately from hypotheses, gives plausible alternatives, identifies a next observation/test, and places correction of actual standing-water/root stress before fertilizer advice.\n\nPass only with evidence and competing explanations; naming a deficiency from one leaf image or afternoon wilt alone needs guided retry.\n\nFor each proposed nutrient action identifies source, rate evidence, timing and placement; rate requires soil/crop data and suitable local guidance. Describes calcium nitrate as N plus Ca, not NPK; avoids automatic urea, DAP or foliar K from symptoms.\n\nPass when all four R's and water priority fit the scenario and do not include an unsupported dose or calendar.\n\nSubmits two complete case sheets, gives one defended presentation or equivalent oral/written explanation and critiques alternatives for the remaining cases. For the 45-minute trainer workshop, contribution and reasoning are captured individually even if groups discuss together.\n\nPass on two complete, evidence-based cases plus one defended explanation; participation or a group answer alone does not establish the individual's reasoning.\n\nThe trainer may facilitate a 45-minute case discussion using prepared cards and observe reasoning. This is not a signed field-diagnosis or fertilizer-application skill. Any real field advice requires local testing and qualified supervision.\n\nWhich symptom did you initially overinterpret, what test would change your mind, and which of the four R decisions still lacks evidence?\n\nNo observation, trainer decision or signature has been recorded. Complete them only after actual supervised work.", "For tomato, wheat, leafy planning and cold maize, labels facts separately from hypotheses, gives plausible alternatives, identifies a next observation or test, and places correction of actual standing water or root stress before fertilizer advice.\n\nPass only with evidence and competing explanations; naming a deficiency from one leaf image or afternoon wilt alone needs guided retry.\n\nFor each proposed nutrient action identifies source, rate evidence, timing and placement; rate requires soil, crop data and suitable local guidance. Describes calcium nitrate as N plus C A, not N P K; avoids automatic urea, D A P or foliar K from symptoms.\n\nPass when all four R's and water priority fit the scenario and do not include an unsupported dose or calendar.\n\nSubmits two complete case sheets, gives one defended presentation or equivalent oral or written explanation and critiques alternatives for the remaining cases. For the forty-five-minute trainer workshop, contribution and reasoning are captured individually even if groups discuss together.\n\nPass on two complete, evidence-based cases plus one defended explanation; participation or a group answer alone does not establish the individual's reasoning.\n\nThe trainer may facilitate a forty-five-minute case discussion using prepared cards and observe reasoning. This is not a signed field-diagnosis or fertilizer-application skill. Any real field advice requires local testing and qualified supervision.\n\nWhich symptom did you initially overinterpret, what test would change your mind, and which of the four R decisions still lacks evidence?\n\nNo observation, trainer decision or signature has been recorded. Complete them only after actual supervised work."), ('Prepare two different case records\n\nObservation and affected leaf age/location\n\nAt least two competing explanations\n\nSoil/root/weather evidence and uncertainty\n\nTest or observation that could change the hypothesis\n\nWater priority, conditional method and scheduling evidence\n\nRight source and why it is appropriate\n\nRight rate: evidence or missing data, not a made-up number\n\nRight time and loss-risk condition\n\nRight place, product/seed safety and feasibility\n\nPotential loss pathway, costs and alternative\n\nIndividual explanation and exit record\n\nWhich one case will you defend and why?\n\nWhat criticism or new evidence would change your recommendation?\n\nExit: K leaf-margin clue and a reasoned method for very sandy soil\n\nText presence opens comparison only; it does not validate causal reasoning.\n\nThese online tasks rehearse reasoning only. Typed completeness and correct choices do not establish a diagnosis, a real field treatment or criterion mastery; the case explanations need trainer review.', 'Prepare two different case records\n\nObservation and affected leaf age, location\n\nAt least two competing explanations\n\nSoil, root, weather evidence and uncertainty\n\nTest or observation that could change the hypothesis\n\nWater priority, conditional method and scheduling evidence\n\nRight source and why it is appropriate\n\nRight rate: evidence or missing data, not a made-up number\n\nRight time and loss-risk condition\n\nRight place, product, seed safety and feasibility\n\nPotential loss pathway, costs and alternative\n\nIndividual explanation and exit record\n\nWhich one case will you defend and why?\n\nWhat criticism or new evidence would change your recommendation?\n\nExit: K leaf-margin clue and a reasoned method for very sandy soil\n\nText presence opens comparison only; it does not validate causal reasoning.\n\nThese online tasks rehearse reasoning only. Typed completeness and correct choices do not establish a diagnosis, a real field treatment or criterion mastery; the case explanations need trainer review.')], 'it': [('Per pomodoro, frumento, pianificazione delle verdure a foglia e mais freddo distingue fatti e ipotesi, indica alternative e una verifica successiva, e antepone il ristagno/stress radicale effettivo al concime.\n\nSi supera con prove e spiegazioni concorrenti; una carenza dedotta da una sola foglia o dall’appassimento pomeridiano richiede ripasso mirato.\n\nPer ogni azione proposta specifica fonte, prove per la dose, momento e posizione; la dose esige dati su suolo/coltura e guida locale adeguata. Il nitrato di calcio è N+Ca, non NPK; niente urea, DAP o K fogliare automatici.\n\nSi supera quando le quattro R e la priorità idrica sono adeguate, senza dose o calendario ingiustificati.\n\nConsegna due schede complete su casi distinti, difende uno oralmente o per iscritto in forma accessibile e valuta alternative negli altri. Nel laboratorio di 45 minuti si registra il contributo individuale anche durante il gruppo.\n\nDue casi completi fondati su prove più una difesa ragionata; presenza o risposta collettiva non dimostra il ragionamento individuale.\n\nL’istruttore può guidare 45 minuti di discussione su schede e osservare il ragionamento. Non è certificazione di diagnosi sul campo o applicazione di concime. Consigli reali richiedono analisi locali e supervisione qualificata.\n\nQuale sintomo hai interpretato troppo presto? Quale test ti farebbe cambiare idea? Per quale delle quattro R mancano ancora prove?\n\nNessuna osservazione, decisione del formatore o firma registrata. Compilare solo dopo lavoro reale supervisionato.', 'Per pomodoro, frumento, pianificazione delle verdure a foglia e mais freddo distingue fatti e ipotesi, indica alternative e una verifica successiva, e antepone il ristagno o lo stress radicale effettivo al concime.\n\nSi supera con prove e spiegazioni concorrenti; una carenza dedotta da una sola foglia o dall’appassimento pomeridiano richiede ripasso mirato.\n\nPer ogni azione proposta specifica fonte, prove per la dose, momento e posizione; la dose esige dati su suolo, coltura e guida locale adeguata. Il nitrato di calcio è enne più ci a, non enne pi cappa; niente urea, di a pi o cappa fogliare automatici.\n\nSi supera quando le quattro R e la priorità idrica sono adeguate, senza dose o calendario ingiustificati.\n\nConsegna due schede complete su casi distinti, difende uno oralmente o per iscritto in forma accessibile e valuta alternative negli altri. Nel laboratorio di quarantacinque minuti si registra il contributo individuale anche durante il gruppo.\n\nDue casi completi fondati su prove più una difesa ragionata; presenza o risposta collettiva non dimostra il ragionamento individuale.\n\nL’istruttore può guidare quarantacinque minuti di discussione su schede e osservare il ragionamento. Non è certificazione di diagnosi sul campo o applicazione di concime. Consigli reali richiedono analisi locali e supervisione qualificata.\n\nQuale sintomo hai interpretato troppo presto? Quale test ti farebbe cambiare idea? Per quale delle quattro R mancano ancora prove?\n\nNessuna osservazione, decisione del formatore o firma registrata. Compilare solo dopo lavoro reale supervisionato.'), ('Prepara due schede di casi diversi\n\nOsservazione, età e posizione fogliare\n\nAlmeno due spiegazioni concorrenti\n\nProve suolo/radici/clima e incertezze\n\nTest che potrebbe cambiare l’ipotesi\n\nPriorità idrica, metodo e prove per calendario\n\nFonte e motivazione\n\nDose: prove o dati mancanti, nessun numero inventato\n\nTempo e rischio di perdita\n\nPosizione, sicurezza seme/prodotto e fattibilità\n\nVia di perdita, costi e alternativa\n\nDifesa individuale e uscita\n\nQuale caso difendi e perché?\n\nQuale critica o nuova prova cambierebbe la scelta?\n\nUscita: indizio K ai margini e metodo motivato per sabbia\n\nIl testo apre soltanto il confronto; non convalida la causalità.\n\nLe attività online preparano il ragionamento. Completezza del testo e scelte corrette non dimostrano diagnosi, intervento reale o padronanza dei criteri: le spiegazioni richiedono revisione del formatore.', 'Prepara due schede di casi diversi\n\nOsservazione, età e posizione fogliare\n\nAlmeno due spiegazioni concorrenti\n\nProve suolo, radici, clima e incertezze\n\nTest che potrebbe cambiare l’ipotesi\n\nPriorità idrica, metodo e prove per calendario\n\nFonte e motivazione\n\nDose: prove o dati mancanti, nessun numero inventato\n\nTempo e rischio di perdita\n\nPosizione, sicurezza seme, prodotto e fattibilità\n\nVia di perdita, costi e alternativa\n\nDifesa individuale e uscita\n\nQuale caso difendi e perché?\n\nQuale critica o nuova prova cambierebbe la scelta?\n\nUscita: indizio cappa ai margini e metodo motivato per sabbia\n\nIl testo apre soltanto il confronto; non convalida la causalità.\n\nLe attività online preparano il ragionamento. Completezza del testo e scelte corrette non dimostrano diagnosi, intervento reale o padronanza dei criteri: le spiegazioni richiedono revisione del formatore.')], 'de': [('Bei Tomate, Weizen, Blattgemüse-Planung und kaltem Mais trennt die Person Fakten und Vermutungen, nennt Alternativen und passende Prüfungen und behandelt tatsächliche Staunässe/Wurzelstress vor Düngerfragen.\n\nBestanden nur mit Belegen und konkurrierenden Erklärungen; Mangel aus einem Blattbild oder Nachmittagswelke allein verlangt gezielte Wiederholung.\n\nFür jeden Nährstoffvorschlag nennt sie Quelle, Belege für die Menge, Zeitpunkt und Platzierung; Menge braucht Boden-/Pflanzendaten und geeignete lokale Empfehlungen. Calciumnitrat ist N+Ca, kein NPK. Keine automatische Harnstoff-, DAP- oder Blatt-K-Gabe.\n\nBestanden, wenn alle vier R und die Wasserpriorität passen, ohne unbelegte Menge oder Kalender.\n\nZwei vollständige Fallbögen für verschiedene Fälle, eine verteidigte mündliche oder zugängliche schriftliche Erklärung und Kritik der übrigen Alternativen. In der 45-minütigen Werkstatt wird trotz Gruppengespräch individuelles Denken dokumentiert.\n\nZwei belegte Fälle plus eine verteidigte Erklärung; Anwesenheit oder Gruppenlösung allein beweist keine individuelle Leistung.\n\nDie Lehrkraft kann eine 45-minütige Fallbesprechung moderieren und Begründungen beobachten. Das ist kein unterschriebener Nachweis für Felddiagnose oder Düngerausbringung. Echter Feldrat braucht lokale Tests und qualifizierte Aufsicht.\n\nWelches Symptom hast du zuerst überdeutet? Welche Prüfung würde deine Meinung ändern? Für welche der vier R fehlen noch Belege?\n\nNoch keine Beobachtung, Lehrkraftentscheidung oder Unterschrift dokumentiert. Erst nach echter betreuter Arbeit ausfüllen.', 'Bei Tomate, Weizen, Blattgemüse-Planung und kaltem Mais trennt die Person Fakten und Vermutungen, nennt Alternativen und passende Prüfungen und behandelt tatsächliche Staunässe oder Wurzelstress vor Düngerfragen.\n\nBestanden nur mit Belegen und konkurrierenden Erklärungen; Mangel aus einem Blattbild oder Nachmittagswelke allein verlangt gezielte Wiederholung.\n\nFür jeden Nährstoffvorschlag nennt sie Quelle, Belege für die Menge, Zeitpunkt und Platzierung; Menge braucht Boden-, Pflanzendaten und geeignete lokale Empfehlungen. Calciumnitrat ist En plus Ce A, kein En Pe Ka. Keine automatische Harnstoff-, De A Pe- oder Blatt-Ka-Gabe.\n\nBestanden, wenn alle vier R und die Wasserpriorität passen, ohne unbelegte Menge oder Kalender.\n\nZwei vollständige Fallbögen für verschiedene Fälle, eine verteidigte mündliche oder zugängliche schriftliche Erklärung und Kritik der übrigen Alternativen. In der fünfundvierzig-minütigen Werkstatt wird trotz Gruppengespräch individuelles Denken dokumentiert.\n\nZwei belegte Fälle plus eine verteidigte Erklärung; Anwesenheit oder Gruppenlösung allein beweist keine individuelle Leistung.\n\nDie Lehrkraft kann eine fünfundvierzig-minütige Fallbesprechung moderieren und Begründungen beobachten. Das ist kein unterschriebener Nachweis für Felddiagnose oder Düngerausbringung. Echter Feldrat braucht lokale Tests und qualifizierte Aufsicht.\n\nWelches Symptom hast du zuerst überdeutet? Welche Prüfung würde deine Meinung ändern? Für welche der vier R fehlen noch Belege?\n\nNoch keine Beobachtung, Lehrkraftentscheidung oder Unterschrift dokumentiert. Erst nach echter betreuter Arbeit ausfüllen.'), ('Zwei unterschiedliche Fallbögen erstellen\n\nBeobachtung, Blattalter und Lage\n\nMindestens zwei konkurrierende Erklärungen\n\nBoden/Wurzel/Wetterbelege und Unsicherheit\n\nTest, der die Hypothese ändern könnte\n\nWasserpriorität, Methode und Terminbelege\n\nQuelle und Begründung\n\nMenge: Beleg oder fehlende Daten, keine erfundene Zahl\n\nZeit und Verlustrisiko\n\nOrt, Saat/Produktsicherheit und Machbarkeit\n\nVerlustweg, Kosten und Alternative\n\nIndividuelle Verteidigung und Ausgangskarte\n\nWelchen Fall verteidigst du und warum?\n\nWelche Kritik oder neue Evidenz ändert die Empfehlung?\n\nAusgang: K-Randhinweis und begründete Methode für Sand\n\nVorhandener Text öffnet nur den Vergleich, keine Bestätigung der Ursache.\n\nOnlineaufgaben üben Begründungen. Vollständiger Text und richtige Auswahl belegen keine Diagnose, reale Behandlung oder Kriterienbeherrschung. Die Lehrkraft muss die Fallbegründungen prüfen.', 'Zwei unterschiedliche Fallbögen erstellen\n\nBeobachtung, Blattalter und Lage\n\nMindestens zwei konkurrierende Erklärungen\n\nBoden, Wurzel, Wetterbelege und Unsicherheit\n\nTest, der die Hypothese ändern könnte\n\nWasserpriorität, Methode und Terminbelege\n\nQuelle und Begründung\n\nMenge: Beleg oder fehlende Daten, keine erfundene Zahl\n\nZeit und Verlustrisiko\n\nOrt, Saat, Produktsicherheit und Machbarkeit\n\nVerlustweg, Kosten und Alternative\n\nIndividuelle Verteidigung und Ausgangskarte\n\nWelchen Fall verteidigst du und warum?\n\nWelche Kritik oder neue Evidenz ändert die Empfehlung?\n\nAusgang: Ka-Randhinweis und begründete Methode für Sand\n\nVorhandener Text öffnet nur den Vergleich, keine Bestätigung der Ursache.\n\nOnlineaufgaben üben Begründungen. Vollständiger Text und richtige Auswahl belegen keine Diagnose, reale Behandlung oder Kriterienbeherrschung. Die Lehrkraft muss die Fallbegründungen prüfen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s307-practice-audio-20261023-r1'
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
    assert count < 2, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 8,'maximumCallsForLane':2,
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
    assert all(v<=2 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_TWO_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':2,'maximumBlindReviewPerLane':2,'maximumASRPerLane':2,'maximumTTSAggregate':8,'maximumBlindAggregate':8,'maximumASRAggregate':8,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
