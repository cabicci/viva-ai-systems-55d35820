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
IDS = ('S2-13-ar-EG-opening-r1', 'S2-13-ar-EG-E04-r1', 'S2-13-ar-EG-guided-practice-r1', 'S2-13-ar-EG-reflection-r1', 'S2-13-ar-EG-comparison-r1', 'S2-13-ar-EG-glossary-r1', 'S2-13-en-opening-r1', 'S2-13-en-E04-r1', 'S2-13-en-guided-practice-r1', 'S2-13-en-reflection-r1', 'S2-13-en-comparison-r1', 'S2-13-en-glossary-r1', 'S2-13-it-opening-r1', 'S2-13-it-E04-r1', 'S2-13-it-guided-practice-r1', 'S2-13-it-reflection-r1', 'S2-13-it-comparison-r1', 'S2-13-it-glossary-r1', 'S2-13-de-opening-r1', 'S2-13-de-E04-r1', 'S2-13-de-guided-practice-r1', 'S2-13-de-reflection-r1', 'S2-13-de-comparison-r1', 'S2-13-de-glossary-r1')
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
    assert(req['scope'],req['stepId'])==('S213_REMAINDER_24_FULL_CURRENT_SEDIMENTATION_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-13')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s213-remainder-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening', 'E04', 'guided-practice', 'reflection', 'comparison', 'glossary']
        voice='Charon'if group in['reflection', 'glossary']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'E04': ['/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/reasoning/3', '/examples/3/takeaway'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'comparison': ['/comparisonLabel', '/comparisonWarning', '/comparison/columns/0', '/comparison/columns/1', '/comparison/columns/2', '/comparison/columns/3', '/comparison/rows/0/0', '/comparison/rows/0/1', '/comparison/rows/0/2', '/comparison/rows/0/3', '/comparison/rows/1/0', '/comparison/rows/1/1', '/comparison/rows/1/2', '/comparison/rows/1/3', '/comparison/rows/2/0', '/comparison/rows/2/1', '/comparison/rows/2/2', '/comparison/rows/2/3', '/comparison/rows/3/0', '/comparison/rows/3/1', '/comparison/rows/3/2', '/comparison/rows/3/3', '/comparison/rows/4/0', '/comparison/rows/4/1', '/comparison/rows/4/2', '/comparison/rows/4/3'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/ui/steps/'in b['pointer']or '/ui/scenarios/'in b['pointer']or '/sourceModelAnswer/'in b['pointer']or b['pointer'].endswith('/accessibility')or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or b['pointer'].endswith('/drag')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert group not in ['E01','E02','E03']
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم نتائج عيناتك التلاتة الحقيقية من الخطوتين اللي فاتوا، أو أمثلة بأرقام واضحة للتدريب. فئة القوام تديك مؤشر عن الميه والعناصر وسهولة خدمة الأرض؛ وحدها ما تثبتش صرف الحقل أو ملوحته أو صلاحية محصول أو احتياجه لإضافة مادة معينة.\n\nقارن التربة الرملية والغنية بالطين في دخول الميه والاحتفاظ بها والعناصر والتهوية وسهولة الخدمة؛ اشرح دور الحبيبات والمسام وتأثير بناء التربة.\n\nفسّر أمثلة A/B/C المعطاة ونتائج عيناتك أنت كل واحدة باسمها، واذكر محاصيل أو اختيارات إدارة محتملة بشروطها وبيانات الموقع اللي لسه مطلوبة.\n\nاشرح تحديين محتملين وميزة واحدة لحقل غني بالطين، وارفض فكرة إن كل تربة طينية محتاجة جبس أو إن الكمبوست يغيّر فئة حبيباتها المعدنية.', 'استخدم نتائج عيناتك التلاتة الحقيقية من الخطوتين اللي فاتوا، أو أمثلة بأرقام واضحة للتدريب. فئة القوام تديك مؤشر عن الميه والعناصر وسهولة خدمة الأرض؛ وحدها ما تثبتش صرف الحقل أو ملوحته أو صلاحية محصول أو احتياجه لإضافة مادة معينة.\n\nقارن التربة الرملية والغنية بالطين في دخول الميه والاحتفاظ بها والعناصر والتهوية وسهولة الخدمة؛ اشرح دور الحبيبات والمسام وتأثير بناء التربة.\n\nفسّر أمثلة إيه، بي، وسي المعطاة ونتائج عيناتك أنت كل واحدة باسمها، واذكر محاصيل أو اختيارات إدارة محتملة بشروطها وبيانات الموقع اللي لسه مطلوبة.\n\nاشرح تحديين محتملين وميزة واحدة لحقل غني بالطين، وارفض فكرة إن كل تربة طينية محتاجة جبس أو إن الكمبوست يغيّر فئة حبيباتها المعدنية.'), ('دخول الميه للتربة\n\nدخول الميه من سطح الأرض إلى جوه التربة، ويتأثر بالقوام والبناء مع بعض.\n\nغسل العناصر\n\nانتقال مواد ذائبة لتحت مع حركة الميه، وقد تنزل تحت منطقة جذور المحصول.\n\nالميه المتاحة للنبات\n\nالجزء من الميه المخزنة اللي تقدر الجذور تستخدمه في ظروف التربة والنبات المعينة؛ مش كل الميه المحتجزة.\n\nالسعة التبادلية الكاتيونية CEC\n\nمقياس لقدرة التربة على حفظ أيونات موجبة قابلة للتبادل؛ يتأثر بمعادن الطين والمادة العضوية.\n\nبناء التربة\n\nطريقة تجمع الحبيبات في تكتلات ومسام؛ ويمكن للإدارة والضغط تغييره بخلاف نسب أحجام الحبيبات المعدنية.\n\nصودية التربة\n\nحالة كيميائية مرتبطة بصوديوم متبادل زائد وبناء ضعيف؛ تحتاج تشخيصًا، ولا تُستنتج من القوام الطيني وحده.', 'دخول الميه للتربة\n\nدخول الميه من سطح الأرض إلى جوه التربة، ويتأثر بالقوام والبناء مع بعض.\n\nغسل العناصر\n\nانتقال مواد ذائبة لتحت مع حركة الميه، وقد تنزل تحت منطقة جذور المحصول.\n\nالميه المتاحة للنبات\n\nالجزء من الميه المخزنة اللي تقدر الجذور تستخدمه في ظروف التربة والنبات المعينة؛ مش كل الميه المحتجزة.\n\nالسعة التبادلية الكاتيونية سي إي سي\n\nمقياس لقدرة التربة على حفظ أيونات موجبة قابلة للتبادل؛ يتأثر بمعادن الطين والمادة العضوية.\n\nبناء التربة\n\nطريقة تجمع الحبيبات في تكتلات ومسام؛ ويمكن للإدارة والضغط تغييره بخلاف نسب أحجام الحبيبات المعدنية.\n\nصودية التربة\n\nحالة كيميائية مرتبطة بصوديوم متبادل زائد وبناء ضعيف؛ محتاجة تشخيص، وما ينفعش نستنتجها من القوام الطيني وحده.'), ('رتب أبعاد المقارنة الخمسة واشرح إزاي بناء التربة ممكن يغير اتجاه المقارنة بين الرمل والطين.\n\nاستخدم سجلات برطمانات الطالب الحقيقية ومناقشة المدرّب من S2-11 وS2-12. الخطوة دي تقيّم التفسير أونلاين؛ ما تمنحش اجتياز مهارة عملية جديدة ولا تستبدل الملاحظات الفردية السابقة.', 'رتب أبعاد المقارنة الخمسة واشرح إزاي بناء التربة ممكن يغير اتجاه المقارنة بين الرمل والطين.\n\nاستخدم سجلات برطمانات الطالب الحقيقية ومناقشة المدرّب من خطوة المحطة التانية رقم حداشر وخطوة المحطة التانية رقم اتناشر. الخطوة دي تقيّم التفسير أونلاين؛ ما تمنحش اجتياز مهارة عملية جديدة ولا تستبدل الملاحظات الفردية السابقة.'), ('مزارع بيقول إن أرضه طينية وبيسأل يعمل إيه.\n\nتحدٍ محتمل أول: الأرض لزجة وصعب دخولها وهي مبلولة.\n\nتحدٍ محتمل ثانٍ: تهوية قليلة أو صرف بطيء لو بناء التربة وقطاعها في الحقل بيقيّدوا حركة الميه.\n\nميزة محتملة: أسطح الطين المشحونة تقدر تحتفظ بكاتيونات كالسيوم وبوتاسيوم.\n\nالخطوة التالية: افحص الصرف والبناء والتحاليل المعنية قبل أي إضافة.\n\nاذكر الدليل والشروط جنب كل نتيجة.', 'مزارع بيقول إن أرضه طينية وبيسأل يعمل إيه.\n\nتحدي محتمل أول: الأرض لزجة وصعب دخولها وهي مبلولة.\n\nتحدي محتمل تاني: تهوية قليلة أو صرف بطيء لو بناء التربة وقطاعها في الحقل بيقيّدوا حركة الميه.\n\nميزة محتملة: أسطح الطين المشحونة تقدر تحتفظ بكاتيونات كالسيوم وبوتاسيوم.\n\nالخطوة التالية: افحص الصرف والبناء والتحاليل المعنية قبل أي إضافة.\n\nاذكر الدليل والشروط جنب كل نتيجة.')], 'en': [('A farmer describes a field as clay and asks what to do.\n\nPossible challenge 1: sticky soil and poor field access when wet.\n\nPossible challenge 2: low aeration or slow drainage when the actual structure and profile restrict water movement.\n\nPossible advantage: charged clay surfaces can retain calcium and potassium cations.\n\nNext action: check the actual drainage, structure and relevant soil tests before choosing an amendment.\n\nState evidence and conditions beside every conclusion.', 'A farmer describes a field as clay and asks what to do.\n\nPossible challenge one: sticky soil and poor field access when wet.\n\nPossible challenge two: low aeration or slow drainage when the actual structure and profile restrict water movement.\n\nPossible advantage: charged clay surfaces can retain calcium and potassium cations.\n\nNext action: check the actual drainage, structure and relevant soil tests before choosing an amendment.\n\nState evidence and conditions beside every conclusion.'), ('Sort the five comparison dimensions and explain why the sandy-versus-clay tendency can change with structure.\n\nUse the real jar records and trainer discussion from S2-11 and S2-12. This step assesses interpretation online; it does not certify new physical performance or replace previous individual observations.', 'Sort the five comparison dimensions and explain why the sandy-versus-clay tendency can change with structure.\n\nUse the real jar records and trainer discussion from station two step eleven and station two step twelve. This step assesses interpretation online; it does not certify new physical performance or replace previous individual observations.'), ("Use the three real sample results from the previous steps, or clearly labelled model values for practice. A texture class offers a clue about water, nutrients and workability. It does not, by itself, prove a field's drainage, salinity, crop suitability or amendment requirement.\n\nCompare sandy and clay-rich soils for infiltration, water retention, nutrient retention, aeration and workability; explain the particle-and-pore reasoning and the influence of structure.\n\nInterpret the supplied A/B/C model and your own separately identified results, giving conditional crop and management options with site evidence still needed.\n\nExplain two likely challenges and one possible advantage of a clay-rich field, and reject automatic gypsum or a claim that compost changes the mineral texture class.", "Use the three real sample results from the previous steps, or clearly labelled model values for practice. A texture class offers a clue about water, nutrients and workability. It does not, by itself, prove a field's drainage, salinity, crop suitability or amendment requirement.\n\nCompare sandy and clay-rich soils for infiltration, water retention, nutrient retention, aeration and workability; explain the particle-and-pore reasoning and the influence of structure.\n\nInterpret the supplied A, B, and C model and your own separately identified results, giving conditional crop and management options with site evidence still needed.\n\nExplain two likely challenges and one possible advantage of a clay-rich field, and reject automatic gypsum or a claim that compost changes the mineral texture class."), ('infiltration\n\nEntry of water into soil at the surface; texture and structure both influence it.\n\nleaching\n\nDownward movement of dissolved substances with percolating water, potentially below crop roots.\n\nplant-available water\n\nThe portion of stored soil water roots can access under the stated soil and plant conditions; not the same as all retained water.\n\ncation exchange capacity (CEC)\n\nA measure of the capacity to retain exchangeable positively charged ions; affected by clay minerals and organic matter.\n\nsoil structure\n\nHow soil particles form aggregates and pore spaces; unlike mineral particle-size texture, it can change through management and compaction.\n\nsodicity\n\nA soil chemical condition associated with excessive exchangeable sodium and poor structure; it requires diagnosis rather than inference from clay texture alone.', 'infiltration\n\nEntry of water into soil at the surface; texture and structure both influence it.\n\nleaching\n\nDownward movement of dissolved substances with percolating water, potentially below crop roots.\n\nplant-available water\n\nThe portion of stored soil water roots can access under the stated soil and plant conditions; not the same as all retained water.\n\ncation exchange capacity (C E C)\n\nA measure of the capacity to retain exchangeable positively charged ions; affected by clay minerals and organic matter.\n\nsoil structure\n\nHow soil particles form aggregates and pore spaces; unlike mineral particle-size texture, it can change through management and compaction.\n\nsodicity\n\nA soil chemical condition associated with excessive exchangeable sodium and poor structure; it requires diagnosis rather than inference from clay texture alone.')], 'it': [("Ordina le cinque dimensioni di confronto e spiega perché la struttura può cambiare la tendenza sabbia-argilla.\n\nUsa i registri reali dei barattoli e la discussione con il formatore da S2-11 e S2-12. Questo passo valuta l'interpretazione online: non certifica una nuova prestazione pratica né sostituisce le osservazioni individuali precedenti.", "Ordina le cinque dimensioni di confronto e spiega perché la struttura può cambiare la tendenza sabbia-argilla.\n\nUsa i registri reali dei barattoli e la discussione con il formatore da fase undici della stazione due e fase dodici della stazione due. Questo passo valuta l'interpretazione online: non certifica una nuova prestazione pratica né sostituisce le osservazioni individuali precedenti."), ("Un agricoltore dice che il campo è argilloso e chiede cosa fare.\n\nPossibile difficoltà 1: terreno appiccicoso e accesso difficile da bagnato.\n\nPossibile difficoltà 2: poca aerazione o drenaggio lento se struttura e profilo reali frenano il movimento dell'acqua.\n\nPossibile vantaggio: superfici argillose cariche trattengono cationi di calcio e potassio.\n\nPasso successivo: verificare drenaggio, struttura e analisi pertinenti prima di scegliere un ammendante.\n\nAccosta prove e condizioni a ogni conclusione.", "Un agricoltore dice che il campo è argilloso e chiede cosa fare.\n\nPossibile difficoltà uno: terreno appiccicoso e accesso difficile da bagnato.\n\nPossibile difficoltà due: poca aerazione o drenaggio lento se struttura e profilo reali frenano il movimento dell'acqua.\n\nPossibile vantaggio: superfici argillose cariche trattengono cationi di calcio e potassio.\n\nPasso successivo: verificare drenaggio, struttura e analisi pertinenti prima di scegliere un ammendante.\n\nAccosta prove e condizioni a ogni conclusione."), ("Usa i tre risultati reali dei passi precedenti oppure modelli numerici chiaramente indicati come esercizio. Una classe tessiturale dà indizi su acqua, nutrienti e lavorabilità; da sola non prova il drenaggio, la salinità, l'idoneità colturale o il fabbisogno di ammendante di un campo.\n\nConfrontare suoli sabbiosi e ricchi d'argilla per infiltrazione, ritenzione idrica e dei nutrienti, aerazione e lavorabilità, spiegando particelle, pori e influenza della struttura.\n\nInterpretare i modelli forniti A/B/C e i propri risultati identificati separatamente, indicando opzioni colturali e gestionali condizionate ai dati del sito ancora necessari.\n\nSpiegare due possibili difficoltà e un vantaggio di un campo argilloso, respingendo l'uso automatico del gesso e l'idea che il compost cambi la classe delle particelle minerali.", "Usa i tre risultati reali dei passi precedenti oppure modelli numerici chiaramente indicati come esercizio. Una classe tessiturale dà indizi su acqua, nutrienti e lavorabilità; da sola non prova il drenaggio, la salinità, l'idoneità colturale o il fabbisogno di ammendante di un campo.\n\nConfrontare suoli sabbiosi e ricchi d'argilla per infiltrazione, ritenzione idrica e dei nutrienti, aerazione e lavorabilità, spiegando particelle, pori e influenza della struttura.\n\nInterpretare i modelli forniti A, B e C e i propri risultati identificati separatamente, indicando opzioni colturali e gestionali condizionate ai dati del sito ancora necessari.\n\nSpiegare due possibili difficoltà e un vantaggio di un campo argilloso, respingendo l'uso automatico del gesso e l'idea che il compost cambi la classe delle particelle minerali."), ("infiltrazione\n\nIngresso dell'acqua nel suolo dalla superficie; dipende da tessitura e struttura.\n\nlisciviazione\n\nMovimento verso il basso di sostanze disciolte nell'acqua, anche sotto le radici.\n\nacqua disponibile alle piante\n\nParte dell'acqua immagazzinata accessibile alle radici nelle condizioni date, non tutta quella trattenuta.\n\ncapacità di scambio cationico (CEC)\n\nMisura della capacità di trattenere ioni positivi scambiabili, influenzata da minerali argillosi e sostanza organica.\n\nstruttura del suolo\n\nModo in cui particelle formano aggregati e pori; a differenza della tessitura minerale può cambiare con gestione e compattazione.\n\nsodicità\n\nCondizione chimica associata a sodio scambiabile eccessivo e struttura deteriorata; richiede diagnosi e non si deduce dalla sola argilla.", "infiltrazione\n\nIngresso dell'acqua nel suolo dalla superficie; dipende da tessitura e struttura.\n\nlisciviazione\n\nMovimento verso il basso di sostanze disciolte nell'acqua, anche sotto le radici.\n\nacqua disponibile alle piante\n\nParte dell'acqua immagazzinata accessibile alle radici nelle condizioni date, non tutta quella trattenuta.\n\ncapacità di scambio cationico (ci e ci)\n\nMisura della capacità di trattenere ioni positivi scambiabili, influenzata da minerali argillosi e sostanza organica.\n\nstruttura del suolo\n\nModo in cui particelle formano aggregati e pori; a differenza della tessitura minerale può cambiare con gestione e compattazione.\n\nsodicità\n\nCondizione chimica associata a sodio scambiabile eccessivo e struttura deteriorata; richiede diagnosi e non si deduce dalla sola argilla.")], 'de': [('Ein Landwirt bezeichnet seinen Schlag als tonreich und fragt nach einer Maßnahme.\n\nMögliche Schwierigkeit 1: klebriger Boden und erschwerte Befahrung bei Nässe.\n\nMögliche Schwierigkeit 2: geringe Belüftung oder langsame Entwässerung, wenn Gefüge und Bodenprofil den Wasserweg tatsächlich behindern.\n\nMöglicher Vorteil: geladene Tonoberflächen können Calcium- und Kaliumkationen speichern.\n\nNächster Schritt: Entwässerung, Gefüge und passende Bodenuntersuchungen prüfen, bevor ein Bodenverbesserungsmittel gewählt wird.\n\nBegründe jede Schlussfolgerung mit Bedingungen und Befunden.', 'Ein Landwirt bezeichnet seinen Schlag als tonreich und fragt nach einer Maßnahme.\n\nMögliche Schwierigkeit eins: klebriger Boden und erschwerte Befahrung bei Nässe.\n\nMögliche Schwierigkeit zwei: geringe Belüftung oder langsame Entwässerung, wenn Gefüge und Bodenprofil den Wasserweg tatsächlich behindern.\n\nMöglicher Vorteil: geladene Tonoberflächen können Calcium- und Kaliumkationen speichern.\n\nNächster Schritt: Entwässerung, Gefüge und passende Bodenuntersuchungen prüfen, bevor ein Bodenverbesserungsmittel gewählt wird.\n\nBegründe jede Schlussfolgerung mit Bedingungen und Befunden.'), ('Infiltration\n\nEintritt von Wasser an der Bodenoberfläche; sowohl Textur als auch Gefüge wirken mit.\n\nAuswaschung\n\nAbwärtsbewegung gelöster Stoffe mit durchsickerndem Wasser, gegebenenfalls unter den Wurzelraum.\n\npflanzenverfügbares Wasser\n\nDer Anteil des gespeicherten Bodenwassers, den Wurzeln unter den angegebenen Boden- und Pflanzenbedingungen erreichen können; nicht jedes gespeicherte Wasser.\n\nKationenaustauschkapazität (CEC)\n\nMaß für die Fähigkeit, austauschbare positiv geladene Ionen zu speichern; beeinflusst durch Tonminerale und organische Substanz.\n\nBodengefüge\n\nAnordnung der Teilchen zu Aggregaten und Poren; anders als die mineralische Korngrößentextur kann es sich durch Bewirtschaftung und Verdichtung ändern.\n\nSodizität\n\nChemischer Bodenzustand mit übermäßigem austauschbarem Natrium und möglicher Gefügeschädigung; er muss untersucht werden und folgt nicht allein aus der Tontextur.', 'Infiltration\n\nEintritt von Wasser an der Bodenoberfläche; sowohl Textur als auch Gefüge wirken mit.\n\nAuswaschung\n\nAbwärtsbewegung gelöster Stoffe mit durchsickerndem Wasser, gegebenenfalls unter den Wurzelraum.\n\npflanzenverfügbares Wasser\n\nDer Anteil des gespeicherten Bodenwassers, den Wurzeln unter den angegebenen Boden- und Pflanzenbedingungen erreichen können; nicht jedes gespeicherte Wasser.\n\nKationenaustauschkapazität (Ce E Ce)\n\nMaß für die Fähigkeit, austauschbare positiv geladene Ionen zu speichern; beeinflusst durch Tonminerale und organische Substanz.\n\nBodengefüge\n\nAnordnung der Teilchen zu Aggregaten und Poren; anders als die mineralische Korngrößentextur kann es sich durch Bewirtschaftung und Verdichtung ändern.\n\nSodizität\n\nChemischer Bodenzustand mit übermäßigem austauschbarem Natrium und möglicher Gefügeschädigung; er muss untersucht werden und folgt nicht allein aus der Tontextur.'), ('Nutze die drei tatsächlichen Probenbefunde aus den vorigen Schritten oder klar als Übung gekennzeichnete Modellwerte. Eine Texturklasse gibt Hinweise zu Wasser, Nährstoffen und Bearbeitbarkeit. Allein belegt sie weder Entwässerung, Salzgehalt, Kulturpflanzeneignung noch Dünge- oder Verbesserungsbedarf eines Feldes.\n\nSandige und tonreiche Böden hinsichtlich Infiltration, Wasser- und Nährstoffspeicherung, Belüftung und Bearbeitbarkeit vergleichen und die Bedeutung von Teilchen, Poren und Gefüge erklären.\n\nDie vorgegebenen Modelle A/B/C und die getrennt bezeichneten eigenen Ergebnisse deuten, mit bedingten Anbau- und Bewirtschaftungsoptionen sowie noch erforderlichen Standortdaten.\n\nZwei mögliche Probleme und einen Vorteil eines tonreichen Feldes erklären und automatische Gipsanwendung oder die Behauptung zurückweisen, Kompost ändere die mineralische Texturklasse.', 'Nutze die drei tatsächlichen Probenbefunde aus den vorigen Schritten oder klar als Übung gekennzeichnete Modellwerte. Eine Texturklasse gibt Hinweise zu Wasser, Nährstoffen und Bearbeitbarkeit. Allein belegt sie weder Entwässerung, Salzgehalt, Kulturpflanzeneignung noch Dünge- oder Verbesserungsbedarf eines Feldes.\n\nSandige und tonreiche Böden hinsichtlich Infiltration, Wasser- und Nährstoffspeicherung, Belüftung und Bearbeitbarkeit vergleichen und die Bedeutung von Teilchen, Poren und Gefüge erklären.\n\nDie vorgegebenen Modelle A, B und C und die getrennt bezeichneten eigenen Ergebnisse deuten, mit bedingten Anbau- und Bewirtschaftungsoptionen sowie noch erforderlichen Standortdaten.\n\nZwei mögliche Probleme und einen Vorteil eines tonreichen Feldes erklären und automatische Gipsanwendung oder die Behauptung zurückweisen, Kompost ändere die mineralische Texturklasse.'), ('Ordne die fünf Vergleichsaspekte und erkläre, wie das Gefüge den typischen Unterschied zwischen Sand und Ton verändern kann.\n\nNutze die eigenen Glasaufzeichnungen und die betreute Besprechung aus S2-11 und S2-12. Diese Stufe prüft die Deutung online; sie bescheinigt keine neue praktische Ausführung und ersetzt keine früheren Einzelbeobachtungen.', 'Ordne die fünf Vergleichsaspekte und erkläre, wie das Gefüge den typischen Unterschied zwischen Sand und Ton verändern kann.\n\nNutze die eigenen Glasaufzeichnungen und die betreute Besprechung aus Schritt elf der Station zwei und Schritt zwölf der Station zwei. Diese Stufe prüft die Deutung online; sie bescheinigt keine neue praktische Ausführung und ersetzt keine früheren Einzelbeobachtungen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s213-remainder-audio-20261023-r1'
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
