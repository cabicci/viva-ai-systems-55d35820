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
IDS = ('S2-13-ar-EG-schematic-structure-guidance-r1', 'S2-13-ar-EG-source-attempt-guidance-r1', 'S2-13-ar-EG-diagnosis-guidance-r1', 'S2-13-ar-EG-knowledge-completion-r1', 'S2-13-ar-EG-record-guidance-r1', 'S2-13-ar-EG-extension-and-facilitation-r1', 'S2-13-en-schematic-structure-guidance-r1', 'S2-13-en-source-attempt-guidance-r1', 'S2-13-en-diagnosis-guidance-r1', 'S2-13-en-knowledge-completion-r1', 'S2-13-en-record-guidance-r1', 'S2-13-en-extension-and-facilitation-r1', 'S2-13-it-schematic-structure-guidance-r1', 'S2-13-it-source-attempt-guidance-r1', 'S2-13-it-diagnosis-guidance-r1', 'S2-13-it-knowledge-completion-r1', 'S2-13-it-record-guidance-r1', 'S2-13-it-extension-and-facilitation-r1', 'S2-13-de-schematic-structure-guidance-r1', 'S2-13-de-source-attempt-guidance-r1', 'S2-13-de-diagnosis-guidance-r1', 'S2-13-de-knowledge-completion-r1', 'S2-13-de-record-guidance-r1', 'S2-13-de-extension-and-facilitation-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==24
    assert(req['scope'],req['stepId'])==('S213_LAB_24_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-13')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s213-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==24
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(6))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['schematic-structure-guidance', 'source-attempt-guidance', 'diagnosis-guidance', 'knowledge-completion', 'record-guidance', 'extension-and-facilitation']
        voice='Charon'if group in['source-attempt-guidance', 'knowledge-completion', 'extension-and-facilitation']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'schematic-structure-guidance': ['/managementPractice/ui/modelHelp', '/managementPractice/ui/compacted', '/managementPractice/ui/structure/0', '/managementPractice/ui/structure/1'], 'source-attempt-guidance': ['/managementPractice/ui/sourceAttempt', '/managementPractice/ui/sourceNeed', '/managementPractice/ui/reasonBoundary'], 'diagnosis-guidance': ['/managementPractice/ui/diagnosisHelp', '/managementPractice/ui/diagnosisBad', '/managementPractice/ui/diagnosisGood'], 'knowledge-completion': ['/managementPractice/passChecks/0/evidence', '/managementPractice/passChecks/0/decision', '/managementPractice/passChecks/1/evidence', '/managementPractice/passChecks/1/decision', '/managementPractice/passChecks/2/evidence', '/managementPractice/passChecks/2/decision'], 'record-guidance': ['/managementPractice/ui/recordHelp', '/managementPractice/ui/fields/0', '/managementPractice/ui/fields/1', '/managementPractice/ui/fields/2', '/managementPractice/ui/fields/3', '/managementPractice/ui/fields/4', '/managementPractice/ui/fields/5', '/managementPractice/ui/fields/6', '/managementPractice/ui/saved', '/managementPractice/ui/notReady', '/managementPractice/ui/knowledgeOnly', '/studentDownloads/0/title'], 'extension-and-facilitation': ['/managementPractice/ui/extension', '/managementPractice/ui/extensionFields/0', '/managementPractice/ui/extensionFields/1', '/managementPractice/ui/extensionFields/2', '/managementPractice/ui/extensionFields/3', '/managementPractice/ui/extensionFields/4', '/managementPractice/ui/extensionFields/5', '/managementPractice/ui/facilitation']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or '/sourceModelAnswer/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert group not in ['E01','E02','E03']
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الحبيبات والمسام والمسارات هنا مكبّرة وتوضيحية. A/B/C أمثلة معطاة، مش عيناتك. مفيش محاكاة لسرعة مقاسة أو حجم ميه أو CEC أو نتيجة حقلية. تغيير بناء التربة في الرسم ما بيغيّرش نسب الحبيبات المعدنية التلاتة.\n\nقارن ببناء تربة مضغوط\n\nبناء مفتوح في الرسم\n\nبناء مضغوط في الرسم', 'الحبيبات والمسام والمسارات هنا مكبّرة وتوضيحية. إيه، بي، وسي أمثلة معطاة، مش عيناتك. مفيش محاكاة لسرعة مقاسة أو حجم ميه أو سي إي سي أو نتيجة حقلية. تغيير بناء التربة في الرسم ما بيغيّرش نسب الحبيبات المعدنية التلاتة.\n\nقارن ببناء تربة مضغوط\n\nبناء مفتوح في الرسم\n\nبناء مضغوط في الرسم'), ('الطالب يسمي أبعاد المقارنة الخمسة في المصدر، ويفسر أربع خواص مطلوبة على الأقل بين الرمل والطين بالحجم والمسامات والشحنة والبناء، ويميز الميه المحتجزة عن الميه المتاحة للجذر.\n\nيجتاز لما المقارنة وأسبابها متسقة؛ الكلام المطلق من فئة القوام وحدها يحتاج مراجعة موجهة وإعادة.\n\nيفصل أمثلة A/B/C المعطاة عن قياسات برطماناته؛ ويذكر فئة مبدئية وتحديًا محتملًا ومحصولًا أو إدارة مشروطة لكل مثال، مع الحاجة لفحص الصرف والمناخ وpH والملوحة واحتياجات المحصول.\n\nيجتاز لما الأرقام والتفسير والشروط تتفق؛ وصفة محصول بلا دليل أو قياس مخترع لا تجتاز.\n\nيقدم تحديين مبررين لحقل طيني وميزة في حفظ عناصر أو ميه، ويذكر إن مادة عضوية مناسبة ممكن تحسن البناء بعد فحص جودتها والموقع، وإن الجبس يحتاج تشخيص صودية وخطة صرف وغسل ممكنة.\n\nيجتاز لما الاقتراح يتبع التشخيص وما يساويش الإضافة بتغيير نسب الرمل والسلت والطين.', 'الطالب يسمي أبعاد المقارنة الخمسة في المصدر، ويفسر أربع خواص مطلوبة على الأقل بين الرمل والطين بالحجم والمسامات والشحنة والبناء، ويميز الميه المحتجزة عن الميه المتاحة للجذر.\n\nيجتاز لما المقارنة وأسبابها متسقة؛ الكلام المطلق من فئة القوام وحدها يحتاج مراجعة موجهة وإعادة.\n\nيفصل أمثلة إيه، بي، وسي المعطاة عن قياسات برطماناته؛ ويذكر فئة مبدئية وتحدي محتمل ومحصول أو إدارة مشروطة لكل مثال، مع الحاجة لفحص الصرف والمناخ وبي إتش والملوحة واحتياجات المحصول.\n\nيجتاز لما الأرقام والتفسير والشروط تتفق؛ وصفة محصول بلا دليل أو قياس مخترع لا تجتاز.\n\nيقدم تحديين مبررين لحقل طيني وميزة في حفظ عناصر أو ميه، ويذكر إن مادة عضوية مناسبة ممكن تحسن البناء بعد فحص جودتها والموقع، وإن الجبس يحتاج تشخيص صودية وخطة صرف وغسل ممكنة.\n\nيجتاز لما الاقتراح يتبع التشخيص وما يساويش الإضافة بتغيير نسب الرمل والسلت والطين.'), ('توسع اختياري عن CEC أو الميه المتاحة للنبات\n\nعنوان المصدر والناشر والرابط والتاريخ\n\nالكمية: CEC ولا ميه متاحة للنبات\n\nالقيمة أو المدى المنشور، أو سيبه فاضي لو مش متاح\n\nالوحدات وطريقة القياس أو الحساب\n\nالقوام والمعدن وطبقة التربة والعمق والمنطقة أو السياق\n\nليه ده مش قياس فعلي لحقلك\n\nناقشوا في مجموعات من 3–4 مع إجابة مستقلة لكل طالب. نشاط البرطمانات المتكامل ليه توزيع: 5 دقايق تجهيز، و15–20 تحضير، و10 قياس، و10 تفسير، و10 مشاركة. فيه ملخص بديل 35 دقيقة شغل و10 مناقشة. دي خطط تدريس بديلة، مش جدول ترسيب. الخطوة دي للتفسير والمشاركة بسجلات البرطمانات السابقة. الجدول الجاهز للتدريب بس.', 'توسع اختياري عن سي إي سي أو الميه المتاحة للنبات\n\nعنوان المصدر والناشر والرابط والتاريخ\n\nالكمية: سي إي سي ولا ميه متاحة للنبات\n\nالقيمة أو المدى المنشور، أو سيبه فاضي لو مش متاح\n\nالوحدات وطريقة القياس أو الحساب\n\nالقوام والمعدن وطبقة التربة والعمق والمنطقة أو السياق\n\nليه ده مش قياس فعلي لحقلك\n\nناقشوا في مجموعات من تلاتة إلى أربعة مع إجابة مستقلة لكل طالب. نشاط البرطمانات المتكامل ليه توزيع: خمسة دقايق تجهيز، وخمستاشر إلى عشرين تحضير، وعشرة قياس، وعشرة تفسير، وعشرة مشاركة. فيه ملخص بديل خمسة وتلاتين دقيقة شغل وعشرة مناقشة. دي خطط تدريس بديلة، مش جدول ترسيب. الخطوة دي للتفسير والمشاركة بسجلات البرطمانات السابقة. الجدول الجاهز للتدريب بس.'), ('لكل مثال من A/B/C، اكتب فئة القوام المبدئية وتفسيرك بسبب واضح وحاجة لسه محتاجة فحص في الموقع. بعدها قارن بالحل الكامل. أي محاولة بتسمح بالمقارنة حتى لو غلط؛ الخانات مش بتقيّم معنى الإجابة ولا بتثبت مهارة عملية.\n\nاكتب فئة مبدئية وتفسيرك للأمثلة التلاتة الأول. استخدم الأرقام المعطاة، وما تخترعش ملاحظات.\n\nالمقارنة بعد المحاولة مش تقييم لمعنى إجابتك ولا اعتماد مهارة متلاحظة.', 'لكل مثال من إيه، بي، وسي، اكتب فئة القوام المبدئية وتفسيرك بسبب واضح وحاجة لسه محتاجة فحص في الموقع. بعدها قارن بالحل الكامل. أي محاولة بتسمح بالمقارنة حتى لو غلط؛ الخانات مش بتقيّم معنى الإجابة ولا بتثبت مهارة عملية.\n\nاكتب فئة مبدئية وتفسيرك للأمثلة التلاتة الأول. استخدم الأرقام المعطاة، وما تخترعش ملاحظات.\n\nالمقارنة بعد المحاولة مش تقييم لمعنى إجابتك ولا اعتماد مهارة متلاحظة.')], 'en': [('For each supplied A/B/C profile, write a provisional class and your own interpretation with a reason and an outstanding site check. Then compare the complete model. Any attempt qualifies, including an incorrect answer; these fields do not grade meaning or certify practical skill.\n\nEnter a provisional class and your own reasoning for all three profiles first. Use the supplied inputs; do not invent observations.\n\nComparison after an attempt is not semantic grading or observed skill approval.', 'For each supplied A, B, and C profile, write a provisional class and your own interpretation with a reason and an outstanding site check. Then compare the complete model. Any attempt qualifies, including an incorrect answer; these fields do not grade meaning or certify practical skill.\n\nEnter a provisional class and your own reasoning for all three profiles first. Use the supplied inputs; do not invent observations.\n\nComparison after an attempt is not semantic grading or observed skill approval.'), ('Illustrative particles, pores and paths are enlarged and schematic. A/B/C are supplied models, not your samples. No rate, water volume, CEC or field outcome is simulated. Changing the illustrated structure leaves the three mineral percentages unchanged.\n\nCompare a compacted structure\n\nIllustrated open structure\n\nIllustrated compacted structure', 'Illustrative particles, pores and paths are enlarged and schematic. A, B, and C are supplied models, not your samples. No rate, water volume, C E C or field outcome is simulated. Changing the illustrated structure leaves the three mineral percentages unchanged.\n\nCompare a compacted structure\n\nIllustrated open structure\n\nIllustrated compacted structure'), ('Names all five source comparison dimensions and explains four requested sandy-versus-clay properties using particle size, pore arrangement, charge and the role of structure; distinguishes water held from water available to roots.\n\nPass only when the comparison and reasons are consistent; a texture-only absolute claim needs targeted review and retry.\n\nKeeps the supplied A/B/C model separate from personal jar data; for each profile gives a provisional class, a plausible challenge and a conditional crop or management choice, identifying drainage, climate, pH, salinity and crop needs before recommendation.\n\nPass when the numerical model, reasoning and stated conditions agree; an unsupported crop prescription or invented measurement does not pass.\n\nGives two reasoned clay-field challenges and one nutrient- or water-holding advantage; states that organic matter may improve structure after assessing material and site, while gypsum requires sodicity diagnosis and a feasible drainage/leaching plan.\n\nPass when the proposed action follows a diagnosis and the learner does not equate amendment with a changed sand/silt/clay ratio.', 'Names all five source comparison dimensions and explains four requested sandy-versus-clay properties using particle size, pore arrangement, charge and the role of structure; distinguishes water held from water available to roots.\n\nPass only when the comparison and reasons are consistent; a texture-only absolute claim needs targeted review and retry.\n\nKeeps the supplied A, B, and C model separate from personal jar data; for each profile gives a provisional class, a plausible challenge and a conditional crop or management choice, identifying drainage, climate, P H, salinity and crop needs before recommendation.\n\nPass when the numerical model, reasoning and stated conditions agree; an unsupported crop prescription or invented measurement does not pass.\n\nGives two reasoned clay-field challenges and one nutrient- or water-holding advantage; states that organic matter may improve structure after assessing material and site, while gypsum requires sodicity diagnosis and a feasible drainage and leaching plan.\n\nPass when the proposed action follows a diagnosis and the learner does not equate amendment with a changed sand, silt, clay ratio.'), ('Optional CEC or plant-available-water inquiry\n\nSource title, publisher, URL and date\n\nQuantity: CEC or plant-available water\n\nPublished value/range, or leave blank if unavailable\n\nUnits and measurement/calculation method\n\nTexture, mineralogy, horizon, depth and region/context\n\nWhy this is not a measured result for your field\n\nDiscuss in groups of 3–4 while keeping each learner’s answer separate. The combined activity offers a 5-minute setup, 15–20-minute preparation, 10-minute measurement, 10-minute interpretation and 10-minute share-out outline; a separate summary lists 35 minutes work plus 10 discussion. These are alternative teaching outlines, not a settling timetable. This step uses the interpretation/share-out and previously recorded jars. Prepared tables support practice only.', 'Optional C E C or plant-available-water inquiry\n\nSource title, publisher, URL and date\n\nQuantity: C E C or plant-available water\n\nPublished value or range, or leave blank if unavailable\n\nUnits and measurement or calculation method\n\nTexture, mineralogy, horizon, depth and region, context\n\nWhy this is not a measured result for your field\n\nDiscuss in groups of three to four while keeping each learner’s answer separate. The combined activity offers a five-minute setup, fifteen to twenty-minute preparation, ten-minute measurement, ten-minute interpretation and ten-minute share-out outline; a separate summary lists thirty-five minutes work plus ten discussion. These are alternative teaching outlines, not a settling timetable. This step uses the interpretation, share-out and previously recorded jars. Prepared tables support practice only.'), ('This is a supplied decision exercise. Reclamation with gypsum requires diagnosed sodicity and a feasible expert-reviewed leaching/drainage plan; the screen does not approve a field treatment.\n\nA clay label is not a sodicity diagnosis. Confirmed sodicity also needs feasible removal of displaced sodium; otherwise complete the evidence or drainage plan first.\n\nDecision fits the supplied evidence. Actual treatment still requires verified site data, material and expert instructions.', 'This is a supplied decision exercise. Reclamation with gypsum requires diagnosed sodicity and a feasible expert-reviewed leaching and drainage plan; the screen does not approve a field treatment.\n\nA clay label is not a sodicity diagnosis. Confirmed sodicity also needs feasible removal of displaced sodium; otherwise complete the evidence or drainage plan first.\n\nDecision fits the supplied evidence. Actual treatment still requires verified site data, material and expert instructions.'), ('Use existing measured records only. Unknown data remain blank with an explanation. Saving notes does not verify measurements, free-text reasoning, chronology or a practical pass.\n\nOwn sample ID and underlying measurement record\n\nActual sand/silt/clay percentages and method limits\n\nProvisional class and triangle reference\n\nExpected challenge, reason and confirming field observation\n\nConditional option and remaining crop/site checks\n\nUncertainty or missing evidence\n\nTrainer discussion or feedback (blank until observed)\n\nDraft saved locally; no field decision or practical approval created.\n\nComplete the identified practice rows first. Do not invent an observation to unlock an example.\n\nReasoning rehearsal; no new physical pass\n\nTexture interpretation worksheet', 'Use existing measured records only. Unknown data remain blank with an explanation. Saving notes does not verify measurements, free-text reasoning, chronology or a practical pass.\n\nOwn sample ID and underlying measurement record\n\nActual sand, silt, clay percentages and method limits\n\nProvisional class and triangle reference\n\nExpected challenge, reason and confirming field observation\n\nConditional option and remaining crop and site checks\n\nUncertainty or missing evidence\n\nTrainer discussion or feedback (blank until observed)\n\nDraft saved locally; no field decision or practical approval created.\n\nComplete the identified practice rows first. Do not invent an observation to unlock an example.\n\nReasoning rehearsal; no new physical pass\n\nTexture interpretation worksheet')], 'it': [('Esercizio con prove fornite. La bonifica con gesso richiede sodicità diagnosticata e un piano fattibile di lisciviazione/drenaggio verificato da esperti; nessuna approvazione di trattamento.\n\nArgilla non diagnostica sodicità. Anche la sodicità confermata richiede rimozione del sodio sostituito; completa prove o drenaggio prima.\n\nDecisione coerente con le prove fornite; interventi reali richiedono dati verificati e istruzioni esperte.', 'Esercizio con prove fornite. La bonifica con gesso richiede sodicità diagnosticata e un piano fattibile di lisciviazione e drenaggio verificato da esperti; nessuna approvazione di trattamento.\n\nArgilla non diagnostica sodicità. Anche la sodicità confermata richiede rimozione del sodio sostituito; completa prove o drenaggio prima.\n\nDecisione coerente con le prove fornite; interventi reali richiedono dati verificati e istruzioni esperte.'), ("Lo studente nomina tutte e cinque le dimensioni della tabella originale e spiega almeno quattro proprietà richieste nel confronto sabbia-argilla tramite dimensione, pori, carica e struttura, distinguendo l'acqua trattenuta da quella disponibile alle radici.\n\nSupera soltanto con confronto e motivazioni coerenti; una conclusione assoluta dalla sola tessitura richiede ripasso mirato e nuovo tentativo.\n\nTiene distinti i modelli forniti A/B/C dai propri dati; per ciascuno propone classe provvisoria, difficoltà plausibile e coltura o gestione condizionata a drenaggio, clima, pH, salinità e requisiti della coltura.\n\nSupera se numeri, motivazioni e condizioni concordano; una prescrizione colturale senza fondamento o una misura inventata non supera.\n\nFornisce due difficoltà motivate di un campo argilloso e un vantaggio di ritenzione di acqua o cationi; indica che materia organica idonea può migliorare la struttura dopo valutazione e che il gesso richiede diagnosi di sodicità e un piano fattibile di drenaggio e lisciviazione.\n\nSupera se la scelta segue la diagnosi e non attribuisce all'ammendante un cambiamento delle proporzioni di sabbia, limo e argilla.", "Lo studente nomina tutte e cinque le dimensioni della tabella originale e spiega almeno quattro proprietà richieste nel confronto sabbia-argilla tramite dimensione, pori, carica e struttura, distinguendo l'acqua trattenuta da quella disponibile alle radici.\n\nSupera soltanto con confronto e motivazioni coerenti; una conclusione assoluta dalla sola tessitura richiede ripasso mirato e nuovo tentativo.\n\nTiene distinti i modelli forniti A, B e C dai propri dati; per ciascuno propone classe provvisoria, difficoltà plausibile e coltura o gestione condizionata a drenaggio, clima, pi acca, salinità e requisiti della coltura.\n\nSupera se numeri, motivazioni e condizioni concordano; una prescrizione colturale senza fondamento o una misura inventata non supera.\n\nFornisce due difficoltà motivate di un campo argilloso e un vantaggio di ritenzione di acqua o cationi; indica che materia organica idonea può migliorare la struttura dopo valutazione e che il gesso richiede diagnosi di sodicità e un piano fattibile di drenaggio e lisciviazione.\n\nSupera se la scelta segue la diagnosi e non attribuisce all'ammendante un cambiamento delle proporzioni di sabbia, limo e argilla."), ('Particelle, pori e percorsi sono schematici e ingranditi. A/B/C sono modelli, non i tuoi campioni. Non si simulano velocità, volumi, CEC o esiti del campo. Cambiare la struttura illustrata non cambia le tre percentuali minerali.\n\nConfronta una struttura compattata\n\nStruttura aperta illustrata\n\nStruttura compattata illustrata', 'Particelle, pori e percorsi sono schematici e ingranditi. A, B e C sono modelli, non i tuoi campioni. Non si simulano velocità, volumi, ci e ci o esiti del campo. Cambiare la struttura illustrata non cambia le tre percentuali minerali.\n\nConfronta una struttura compattata\n\nStruttura aperta illustrata\n\nStruttura compattata illustrata'), ('Per ciascun profilo A/B/C scrivi classe provvisoria, interpretazione motivata e una verifica del sito ancora necessaria. Poi confronta il modello completo. Vale qualsiasi tentativo, anche errato; i campi non valutano il significato né certificano abilità pratiche.\n\nScrivi una classe provvisoria e il tuo ragionamento per tutti e tre i profili. Usa i dati forniti; non inventare osservazioni.\n\nConfronto dopo il tentativo: non valutazione semantica o certificazione pratica.', 'Per ciascun profilo A, B e C scrivi classe provvisoria, interpretazione motivata e una verifica del sito ancora necessaria. Poi confronta il modello completo. Vale qualsiasi tentativo, anche errato; i campi non valutano il significato né certificano abilità pratiche.\n\nScrivi una classe provvisoria e il tuo ragionamento per tutti e tre i profili. Usa i dati forniti; non inventare osservazioni.\n\nConfronto dopo il tentativo: non valutazione semantica o certificazione pratica.'), ('Ricerca facoltativa su CEC o acqua disponibile\n\nTitolo fonte, editore, URL e data\n\nQuantità: CEC o acqua disponibile\n\nValore/intervallo pubblicato, vuoto se ignoto\n\nUnità e metodo di misura/calcolo\n\nTessitura, minerali, orizzonte, profondità e contesto\n\nPerché non è un risultato misurato del tuo campo\n\nGruppi di 3–4, risposte individuali. L’attività integrata propone 5 minuti iniziali, 15–20 preparazione, 10 misurazione, 10 interpretazione e 10 condivisione; un riepilogo alternativo indica 35 lavoro più 10 discussione. Sono piani didattici alternativi, non tempi di sedimentazione. Qui si interpretano e discutono registri precedenti; tabelle pronte solo per esercizio.', 'Ricerca facoltativa su ci e ci o acqua disponibile\n\nTitolo fonte, editore, URL e data\n\nQuantità: ci e ci o acqua disponibile\n\nValore o intervallo pubblicato, vuoto se ignoto\n\nUnità e metodo di misura o calcolo\n\nTessitura, minerali, orizzonte, profondità e contesto\n\nPerché non è un risultato misurato del tuo campo\n\nGruppi da tre a quattro persone, risposte individuali. L’attività integrata propone cinque minuti iniziali, da quindici a venti minuti di preparazione, dieci minuti di misurazione, dieci minuti di interpretazione e dieci minuti di condivisione; un riepilogo alternativo indica trentacinque minuti di lavoro più dieci di discussione. Sono piani didattici alternativi, non tempi di sedimentazione. Qui si interpretano e discutono registri precedenti; tabelle pronte solo per esercizio.'), ('Usa registri misurati esistenti. Dati ignoti vuoti con spiegazione. Salvare note non verifica misure, significato, cronologia o abilità pratiche.\n\nID proprio campione e registro di misura\n\nPercentuali reali sabbia/limo/argilla e limiti del metodo\n\nClasse provvisoria e riferimento del triangolo\n\nProblema atteso, motivo e osservazione di conferma\n\nOpzione condizionata e verifiche di coltura/sito mancanti\n\nIncertezza o prova mancante\n\nDiscussione/riscontro del formatore (vuoto fino a osservazione)\n\nBozza locale salvata; nessuna decisione reale o approvazione pratica.\n\nCompleta prima le righe identificate. Non inventare osservazioni per aprire un esempio.\n\nEsercizio di ragionamento; nessuna nuova prova fisica\n\nScheda di interpretazione della tessitura', 'Usa registri misurati esistenti. Dati ignoti vuoti con spiegazione. Salvare note non verifica misure, significato, cronologia o abilità pratiche.\n\nID proprio campione e registro di misura\n\nPercentuali reali sabbia, limo, argilla e limiti del metodo\n\nClasse provvisoria e riferimento del triangolo\n\nProblema atteso, motivo e osservazione di conferma\n\nOpzione condizionata e verifiche di coltura e sito mancanti\n\nIncertezza o prova mancante\n\nDiscussione, riscontro del formatore (vuoto fino a osservazione)\n\nBozza locale salvata; nessuna decisione reale o approvazione pratica.\n\nCompleta prima le righe identificate. Non inventare osservazioni per aprire un esempio.\n\nEsercizio di ragionamento; nessuna nuova prova fisica\n\nScheda di interpretazione della tessitura')], 'de': [('Die lernende Person nennt alle fünf Vergleichsaspekte aus der Quelle und erklärt mindestens vier verlangte Sand-Ton-Unterschiede mit Teilchengröße, Poren, Ladung und Gefüge; sie trennt gespeichertes von pflanzenverfügbarem Wasser.\n\nBestanden nur bei stimmiger Gegenüberstellung mit Begründung; absolute Aussagen allein aus der Textur werden gezielt wiederholt.\n\nDie vorgegebenen Modelle A/B/C werden von eigenen Glasdaten getrennt. Für jedes Profil folgen vorläufige Klasse, plausible Herausforderung und eine bedingte Kultur- oder Bewirtschaftungsoption; Entwässerung, Klima, pH, Salzgehalt und Kulturansprüche bleiben zu prüfen.\n\nBestanden, wenn Modellzahlen, Begründung und Bedingungen übereinstimmen; unbegründete Anbauvorschrift oder erfundene Messung genügt nicht.\n\nZwei begründete Herausforderungen eines Tonfelds und ein Vorteil der Wasser- oder Kationenspeicherung werden genannt. Geeignete organische Substanz kann nach Prüfung von Material und Standort das Gefüge verbessern; Gips erfordert eine Natriumüberschussdiagnose und eine machbare Entwässerungs- und Auswaschplanung.\n\nBestanden, wenn Maßnahmen der Diagnose folgen und nicht mit einer Änderung der Sand-Schluff-Ton-Anteile verwechselt werden.', 'Die lernende Person nennt alle fünf Vergleichsaspekte aus der Quelle und erklärt mindestens vier verlangte Sand-Ton-Unterschiede mit Teilchengröße, Poren, Ladung und Gefüge; sie trennt gespeichertes von pflanzenverfügbarem Wasser.\n\nBestanden nur bei stimmiger Gegenüberstellung mit Begründung; absolute Aussagen allein aus der Textur werden gezielt wiederholt.\n\nDie vorgegebenen Modelle A, B und C werden von eigenen Glasdaten getrennt. Für jedes Profil folgen vorläufige Klasse, plausible Herausforderung und eine bedingte Kultur- oder Bewirtschaftungsoption; Entwässerung, Klima, Pe Ha, Salzgehalt und Kulturansprüche bleiben zu prüfen.\n\nBestanden, wenn Modellzahlen, Begründung und Bedingungen übereinstimmen; unbegründete Anbauvorschrift oder erfundene Messung genügt nicht.\n\nZwei begründete Herausforderungen eines Tonfelds und ein Vorteil der Wasser- oder Kationenspeicherung werden genannt. Geeignete organische Substanz kann nach Prüfung von Material und Standort das Gefüge verbessern; Gips erfordert eine Natriumüberschussdiagnose und eine machbare Entwässerungs- und Auswaschplanung.\n\nBestanden, wenn Maßnahmen der Diagnose folgen und nicht mit einer Änderung der Sand-Schluff-Ton-Anteile verwechselt werden.'), ('Freiwillige Recherche zu CEC oder verfügbarem Wasser\n\nQuellentitel, Herausgeber, URL und Datum\n\nGröße: CEC oder pflanzenverfügbares Wasser\n\nVeröffentlichter Wert/Bereich, falls unbekannt leer\n\nEinheit und Mess-/Rechenverfahren\n\nTextur, Minerale, Horizont, Tiefe und Kontext\n\nWarum kein gemessener Befund des eigenen Feldes\n\nGruppen von 3–4, individuelle Antworten. Die gesamte Glastätigkeit bietet 5 Minuten Aufbau, 15–20 Vorbereitung, 10 Messen, 10 Deuten und 10 Austausch; eine alternative Übersicht nennt 35 Arbeits- plus 10 Diskussionsminuten. Das sind alternative Unterrichtspläne, keine Absetzzeiten. Hier werden frühere Aufzeichnungen gedeutet und besprochen; ausgefüllte Tabellen dienen nur der Übung.', 'Freiwillige Recherche zu Ce E Ce oder verfügbarem Wasser\n\nQuellentitel, Herausgeber, URL und Datum\n\nGröße: Ce E Ce oder pflanzenverfügbares Wasser\n\nVeröffentlichter Wert oder Bereich, falls unbekannt leer\n\nEinheit und Mess- oder Rechenverfahren\n\nTextur, Minerale, Horizont, Tiefe und Kontext\n\nWarum kein gemessener Befund des eigenen Feldes\n\nGruppen von drei bis vier Personen, individuelle Antworten. Die gesamte Glastätigkeit bietet fünf Minuten Aufbau, fünfzehn bis zwanzig Minuten Vorbereitung, zehn Minuten Messen, zehn Minuten Deuten und zehn Minuten Austausch; eine alternative Übersicht nennt fünfunddreißig Arbeits- plus zehn Diskussionsminuten. Das sind alternative Unterrichtspläne, keine Absetzzeiten. Hier werden frühere Aufzeichnungen gedeutet und besprochen; ausgefüllte Tabellen dienen nur der Übung.'), ('Nur bestehende Messprotokolle verwenden. Unbekanntes mit Erklärung leer lassen. Gespeicherte Notizen prüfen weder Messung, Bedeutung, Chronologie noch Praxisleistung.\n\nEigene Probenkennung und Messprotokoll\n\nTatsächliche Sand-/Schluff-/Tonanteile und Verfahrensgrenzen\n\nVorläufige Klasse und Dreiecksreferenz\n\nErwartetes Problem, Grund und bestätigende Feldbeobachtung\n\nBedingte Option und fehlende Kultur-/Standortprüfung\n\nUnsicherheit oder fehlender Beleg\n\nRückmeldung der Lehrkraft (bis Beobachtung leer)\n\nLokal gespeichert; keine Feldentscheidung oder Praxisfreigabe.\n\nZuerst gekennzeichnete Übungszeilen vervollständigen. Keine Beobachtungen zum Freischalten erfinden.\n\nBegründungsübung; keine neue praktische Bestätigung\n\nArbeitsblatt Texturdeutung', 'Nur bestehende Messprotokolle verwenden. Unbekanntes mit Erklärung leer lassen. Gespeicherte Notizen prüfen weder Messung, Bedeutung, Chronologie noch Praxisleistung.\n\nEigene Probenkennung und Messprotokoll\n\nTatsächliche Sand-, Schluff-, Tonanteile und Verfahrensgrenzen\n\nVorläufige Klasse und Dreiecksreferenz\n\nErwartetes Problem, Grund und bestätigende Feldbeobachtung\n\nBedingte Option und fehlende Kultur- und Standortprüfung\n\nUnsicherheit oder fehlender Beleg\n\nRückmeldung der Lehrkraft (bis Beobachtung leer)\n\nLokal gespeichert; keine Feldentscheidung oder Praxisfreigabe.\n\nZuerst gekennzeichnete Übungszeilen vervollständigen. Keine Beobachtungen zum Freischalten erfinden.\n\nBegründungsübung; keine neue praktische Bestätigung\n\nArbeitsblatt Texturdeutung'), ('Schreibe für jedes Profil A/B/C eine vorläufige Klasse, deine begründete Deutung und eine noch offene Standortprüfung. Vergleiche danach das vollständige Modell. Jeder Versuch zählt, auch ein falscher; die Felder bewerten weder den Inhalt noch bescheinigen sie praktische Fähigkeiten.\n\nTrage zuerst für alle drei Profile eine vorläufige Klasse und eigene Begründung ein. Nutze die vorgegebenen Daten; erfinde keine Beobachtungen.\n\nVergleich nach Versuch ist weder semantische Bewertung noch beobachtete Praxisfreigabe.', 'Schreibe für jedes Profil A, B und C eine vorläufige Klasse, deine begründete Deutung und eine noch offene Standortprüfung. Vergleiche danach das vollständige Modell. Jeder Versuch zählt, auch ein falscher; die Felder bewerten weder den Inhalt noch bescheinigen sie praktische Fähigkeiten.\n\nTrage zuerst für alle drei Profile eine vorläufige Klasse und eigene Begründung ein. Nutze die vorgegebenen Daten; erfinde keine Beobachtungen.\n\nVergleich nach Versuch ist weder semantische Bewertung noch beobachtete Praxisfreigabe.'), ('Teilchen, Poren und Wege sind schematisch vergrößert. A/B/C sind Modelle, keine eigenen Proben. Keine Geschwindigkeit, Wassermenge, CEC oder Feldwirkung wird simuliert. Das dargestellte Gefüge verändert die drei Mineralanteile nicht.\n\nMit verdichtetem Gefüge vergleichen\n\nDargestelltes offenes Gefüge\n\nDargestelltes verdichtetes Gefüge', 'Teilchen, Poren und Wege sind schematisch vergrößert. A, B und C sind Modelle, keine eigenen Proben. Keine Geschwindigkeit, Wassermenge, Ce E Ce oder Feldwirkung wird simuliert. Das dargestellte Gefüge verändert die drei Mineralanteile nicht.\n\nMit verdichtetem Gefüge vergleichen\n\nDargestelltes offenes Gefüge\n\nDargestelltes verdichtetes Gefüge'), ('Übung mit vorgegebenen Befunden. Gips zur Sanierung setzt diagnostizierte Sodizität und einen fachlich geprüften, machbaren Auswaschungs-/Entwässerungsplan voraus; keine Freigabe einer Feldbehandlung.\n\nTon ist keine Sodizitätsdiagnose. Auch bestätigte Sodizität braucht die Abfuhr verdrängten Natriums; erst Befunde oder Entwässerung vervollständigen.\n\nEntscheidung passt zu Übungsbefunden; tatsächliche Maßnahmen brauchen geprüfte Standortdaten und fachliche Anweisungen.', 'Übung mit vorgegebenen Befunden. Gips zur Sanierung setzt diagnostizierte Sodizität und einen fachlich geprüften, machbaren Auswaschungs- und Entwässerungsplan voraus; keine Freigabe einer Feldbehandlung.\n\nTon ist keine Sodizitätsdiagnose. Auch bestätigte Sodizität braucht die Abfuhr verdrängten Natriums; erst Befunde oder Entwässerung vervollständigen.\n\nEntscheidung passt zu Übungsbefunden; tatsächliche Maßnahmen brauchen geprüfte Standortdaten und fachliche Anweisungen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s213-lab-audio-20261023-r1'
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
    assert count < 6, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 24,'maximumCallsForLane':6,
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
    assert all(v<=6 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':6,'maximumBlindReviewPerLane':6,'maximumASRPerLane':6,'maximumTTSAggregate':24,'maximumBlindAggregate':24,'maximumASRAggregate':24,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
