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
_gated_spec=importlib.util.spec_from_file_location('gated_worked_validation',HERE/'gated_worked_validation.py')
_gated_module=importlib.util.module_from_spec(_gated_spec);_gated_spec.loader.exec_module(_gated_module)
validate_gated_worked_unit=_gated_module.validate_gated_worked_unit

FROZEN = ['.gitignore', 'README.en.txt', 'freeze_package.py', 'offline_check.py', 'owner-authority.json', 'cumulative-attempt-ledger.json', 'cache-live-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/worker-derivation.json', 'request.json', 'runtime.json', 'vendor/course/manifest.json', 'vendor/pipeline-engine.py', 'worker.py', 'provenance/narration-ar-EG.json', 'provenance/narration-en.json', 'provenance/narration-it.json', 'provenance/narration-de.json', 'thin_artifacts.py', 'gated_worked_validation.py', 'provenance/gated-source-slice-ar-EG.json', 'provenance/gated-source-slice-en.json', 'provenance/gated-source-slice-it.json', 'provenance/gated-source-slice-de.json']
IDS = ('S3-16-ar-EG-E01-r1', 'S3-16-ar-EG-E02-r1', 'S3-16-ar-EG-E03-r1', 'S3-16-ar-EG-E04-r1', 'S3-16-en-E01-r1', 'S3-16-en-E02-r1', 'S3-16-en-E03-r1', 'S3-16-en-E04-r1', 'S3-16-it-E01-r1', 'S3-16-it-E02-r1', 'S3-16-it-E03-r1', 'S3-16-it-E04-r1', 'S3-16-de-E01-r1', 'S3-16-de-E02-r1', 'S3-16-de-E03-r1', 'S3-16-de-E04-r1')
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
    assert set(freeze['sha256'])==set(FROZEN) and len(FROZEN)==len(set(FROZEN))==24
    for name,h in freeze['sha256'].items():
        p=(HERE/name).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozen preimage mismatch'
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==16
    assert type(req['fixedLocaleLanes']) is dict and req['fixedLocaleLanes']=={'ar-EG': ['S3-16-ar-EG-E01-r1', 'S3-16-ar-EG-E02-r1', 'S3-16-ar-EG-E03-r1', 'S3-16-ar-EG-E04-r1'], 'en': ['S3-16-en-E01-r1', 'S3-16-en-E02-r1', 'S3-16-en-E03-r1', 'S3-16-en-E04-r1'], 'it': ['S3-16-it-E01-r1', 'S3-16-it-E02-r1', 'S3-16-it-E03-r1', 'S3-16-it-E04-r1'], 'de': ['S3-16-de-E01-r1', 'S3-16-de-E02-r1', 'S3-16-de-E03-r1', 'S3-16-de-E04-r1']},'Exact locale-to-ordered-UID lane map required before any provider operation'
    assert(req['scope'],req['stepId'])==('S316_16_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-16')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_4_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s316-gated-audio-20261024-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==16
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allSixteenCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(4))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['E01', 'E02', 'E03', 'E04']
        voice='Charon'if group in ['E01','E03']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/examples/')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('النسبة لازم تقول أساسها\n\nمثال الشرح بيستخدم ٢٠ جم تربة جافة و٢٠ مل مياه مقطرة: كتلة:حجم. طريقة معملية منفصلة بتستخدم ١:١ حجم:حجم، بمكيال تربة اسمه «10 gram NCR-13 volumetric scoop» ومعاه ١٠ مل مياه منزوعة الأيونات. ده اسم مكيال حجمي، مش تعليمات إنك توزن ١٠ جم بالضبط من التربة دي.\n\nالمثال التعليمي كتلة:حجم، والمعمل الآخر حجم:حجم.\n\nاختر إجراء الجهاز والمعمل الحقيقي وسجل الكمية والانتظار والمعايرة؛ ما تستعيرش رقمًا من طريقة مختلفة.\n\nالقياس بالقطب الرقمي والمقارنة بكاشف ألوان ليهم أدوات وإجراءات مختلفة؛ تنفيذ واحدة ما يثبتش إنك نفذت التانية.\n\nقياس قابل للتكرار بجهاز وطريقة مطابقين.', 'النسبة لازم توضّح أساسها\n\nمثال الشرح بيستخدم عشرين جرام تربة جافة وعشرين ملليلتر مَيّه مقطّرة. ده أساس كتلة لحجم. فيه طريقة معملية تانية منفصلة، أساسها واحد لواحد، حجم لحجم. التربة فيها بتتاخد بمكيال اسمه «عشرة جرام إن سي آر تلتاشر فوليومتريك سكوب»، ومعاه عشرة ملليلتر مَيّه منزوعة الأيونات. ده اسم مكيال حجمي، مش تعليمات إنك توزن بالظبط عشرة جرام من التربة دي.\n\nالمثال التعليمي كتلة لحجم، والطريقة المعملية التانية حجم لحجم.\n\nاختار الإجراء الحقيقي للجهاز والمعمل، وسجّل الكمية والانتظار والمعايرة. ما تاخدش رقم من طريقة تانية.\n\nالقياس بالقطب الرقمي والمقارنة بكاشف ألوان، لكل واحدة فيهم أدوات وإجراءات مختلفة. لو عملت واحدة، ده ما يثبتش إنك عملت التانية.\n\nالمطلوب قياس تقدر تكرره، بجهاز وطريقة مطابقين.'), ('شريطان قصيران وممكن فئتين\n\nعينتان كل واحدة عملت شريطًا ٢ سم؛ واحدة خشنة عند الفرك والأخرى ناعمة جدًا.\n\nاضبط الرطوبة ونتيجة الكرة والشريط الأول.\n\nاتبع فرع الشريط الضعيف في دليل USDA ثم فرق ملمس الخشن والناعم.\n\nلو العينة ذات الشريط الضعيف ملمسها خشن جدًا، الدليل بيدعم لوم رملي؛ ولو ناعمة جدًا، بيدعم لوم سلتي. ولو مفيش إحساس منهم غالب، اتبع فرع اللوم. دي تفضل تقديرات حقلية مشروطة.\n\nصنّف بالطول والإحساس مع بيان حدود التقدير الحقلي.', 'شريطين قصيرين، وممكن فئتين مختلفتين\n\nعينتين، كل واحدة عملت شريط طوله اتنين سنتيمتر. واحدة ملمسها خشن عند الفرك المبلول، والتانية ناعمة جدًا.\n\nاتأكد الأول من الرطوبة ونتيجة الكورة والشريط.\n\nامشِ على فرع الشريط الضعيف في دليل يو إس دي إيه، وبعدين فرّق بين الإحساس الخشن والناعم.\n\nلو العينة اللي شريطها ضعيف ملمسها خشن جدًا، الدليل بيدعم لوم رملي. ولو ناعمة جدًا، بيدعم لوم سلتي. ولو ولا إحساس فيهم هو الغالب، امشِ على فرع اللوم. دي تقديرات حقلية بشروطها.\n\nصنّف بالطول والإحساس مع بعض، ووضّح حدود التقدير الحقلي.'), ('كوبان مش قراءة ميزان\n\nالمثال بيقول «حوالي كوبين أو ٥٠٠ جرام» من العينة المركّبة.\n\nاسأل المعمل المستلم مطلوب أي كمية وأي وحدة.\n\nلو ٥٠٠ جرام زِن؛ لو كوبين قِس الحجم واكتب الوحدة.\n\nاربط المقدار برقم العينة والعمق والعدد بدل تحويل الحجم لكتلة.\n\nمقدار واضح مقاس وهوية عينة سليمة.', 'كوبين مش قراءة ميزان\n\nالمثال بيقول حوالي كوبين أو خمسمية جرام من العينة المركّبة.\n\nاسأل المعمل المستلم عن الكمية والوحدة المطلوبين فعلًا.\n\nلو المطلوب خمسمية جرام، اوزن المقدار ده. ولو المطلوب كوبين، قيس الحجم واكتب الوحدة.\n\nاربط المقدار برقم العينة والعمق والعدد، بدل ما تساوي بين الحجم والكتلة.\n\nمقدار واضح ومقاس، وهوية عينة سليمة.'), ('٢٥ دقيقة ما تشملش الانتظار\n\nالطالب جمع تربة القطعة C الساعة ١٠:٠٠، وبدأ يجففها بالهوا، وبعدها بدأ انتظار اتزان معلّق pH اللي مدته في المثال التعليمي ٣٠–٦٠ دقيقة.\n\nالـ٢٥ دقيقة المخططة تقدير عمل نشط، مش إجمالي التجفيف والانتظار.\n\nسجل هوية عينة واحدة عبر الجمع والتجفيف وpH والملمس والتقرير، مع وقت كل فعل.\n\nالطالب ينفذ كل مرحلة؛ أنبوبة المدرّب الجاهزة للعرض فقط.\n\nشغل على مراحل وملاحظة ووقت عمل وانتظار منفصل، بلا اجتياز مختصر.', 'خمسة وعشرين دقيقة ما تشملش الانتظار\n\nالطالب جمع تربة القطعة سي الساعة عشرة بالظبط، وبدأ يجففها بالهوا. وبعد كده بدأ انتظار اتزان معلّق بي إتش، ومدته في المثال التعليمي من تلاتين لستين دقيقة.\n\nالخمسة وعشرين دقيقة المخططة، تقدير للشغل النشط، مش إجمالي التجفيف والانتظار.\n\nسجّل هوية عينة واحدة تربط الجمع والتجفيف وبي إتش والملمس والتقرير، مع وقت كل فعل.\n\nالطالب ينفّذ كل مرحلة بنفسه. أنبوبة المدرّب الجاهزة للعرض بس.\n\nشغل على مراحل، وملاحظة للأداء، ووقت شغل ووقت انتظار كل واحد لوحده. من غير اختصار يدي اجتياز.')], 'en': [("25 practical minutes do not contain the wait\n\nA student collects Plot C soil at 10:00, starts air drying, and later begins the example’s 30–60-minute pH equilibration.\n\nThe planned 25-minute practical block is an active-work planning figure; it cannot include every necessary dry/equilibrate interval.\n\nRecord one sample ID across collection, drying, pH, feel and later reporting, with actual date/time for each action.\n\nThe student carries out each task; a trainer's earlier example tube is demonstration only.\n\nStaged observed work with active and waiting times logged separately; no shortcut pass.", "twenty-five practical minutes do not contain the wait\n\nA student collects Plot C soil at ten o'clock, starts air drying, and later begins the example’s thirty to sixty-minute P H equilibration.\n\nThe planned twenty-five-minute practical block is an active-work planning figure; it cannot include every necessary drying or equilibration interval.\n\nRecord one sample ID across collection, drying, P H, feel and later reporting, with actual date and time for each action.\n\nThe student carries out each task; a trainer's earlier example tube is demonstration only.\n\nStaged observed work with active and waiting times logged separately; no shortcut pass."), ("A ratio must name its basis\n\nThe teaching example uses 20 g dry soil plus 20 mL distilled water: mass:volume. A separate laboratory method uses 1:1 volume:volume, taking soil with the scoop named ‘10 gram NCR-13 volumetric scoop’ and adding 10 mL deionized water. That is a volumetric scoop's name, not an instruction to weigh exactly 10 g of this soil.\n\nThe worked example is mass:volume; the lab example is volume:volume.\n\nChoose the actual training SOP and meter, then log its aliquot, wait and calibration; do not borrow an attractive number from the other procedure.\n\nA digital-electrode measurement and a colour-reagent comparison use different equipment and procedures; one does not demonstrate the other.\n\nA reproducible, device-matched measurement rather than a mixed-method number.", "A ratio must name its basis\n\nThe teaching example uses twenty grams dry soil plus twenty millilitres distilled water: mass to volume. A separate laboratory method uses one to one volume to volume, taking soil with the scoop named ‘ten gram N C R thirteen volumetric scoop’ and adding ten millilitres deionized water. That is a volumetric scoop's name, not an instruction to weigh exactly ten grams of this soil.\n\nThe worked example is mass to volume; the lab example is volume to volume.\n\nChoose the actual training S O P and meter, then log its aliquot, wait and calibration; do not borrow an attractive number from the other procedure.\n\nA digital-electrode measurement and a colour-reagent comparison use different equipment and procedures; one does not demonstrate the other.\n\nA reproducible, device-matched measurement rather than a mixed-method number."), ('The same short ribbon may mean different classes\n\nTwo samples both produce a 2 cm ribbon, but one feels gritty and the other feels very smooth when wet rubbed.\n\nConfirm proper moisture and ball/ribbon conditions first.\n\nFollow the USDA weak-ribbon branch, then distinguish gritty from smooth wet-rub feel.\n\nIf the weak-ribbon sample feels very gritty, the guide supports sandy loam; if it feels very smooth, it supports silt loam. If neither feel predominates, use the loam branch. These remain conditional field estimates.\n\nClassify with both ribbon length and feel; note field-estimate uncertainty.', 'The same short ribbon may mean different classes\n\nTwo samples both produce a two-centimetre ribbon, but one feels gritty and the other feels very smooth when wet rubbed.\n\nConfirm proper moisture and ball and ribbon conditions first.\n\nFollow the U S D A weak-ribbon branch, then distinguish gritty from smooth wet-rub feel.\n\nIf the weak-ribbon sample feels very gritty, the guide supports sandy loam; if it feels very smooth, it supports silt loam. If neither feel predominates, use the loam branch. These remain conditional field estimates.\n\nClassify with both ribbon length and feel; note field-estimate uncertainty.'), ("Two cups are not a mass reading\n\nThe example says submit 'about 2 cups or 500 grams' of the composite.\n\nAsk what amount and unit the receiving lab actually requests.\n\nIf it requires 500 g, weigh that amount; if it requests two cups, measure volume and label it as such.\n\nRecord the sample ID and required sampling depth/count rather than equating volume with mass.\n\nOne unambiguous measured submission amount and an intact identity chain.", "Two cups are not a mass reading\n\nThe example says submit 'about two cups or five hundred grams' of the composite.\n\nAsk what amount and unit the receiving lab actually requests.\n\nIf it requires five hundred grams, weigh that amount; if it requests two cups, measure volume and label it as such.\n\nRecord the sample ID and required sampling depth and count rather than equating volume with mass.\n\nOne unambiguous measured submission amount and an intact identity chain.")], 'it': [('25 minuti non includono l’attesa\n\nStudente preleva C alle 10:00, inizia essiccazione, poi l’equilibrio pH richiede 30–60 minuti.\n\nI 25 minuti pianificati stimano lavoro attivo, non tutti i tempi necessari.\n\nUn ID collega raccolta, essiccazione, pH, tatto e relazione con tempo di ciascuno.\n\nLo studente esegue ogni fase; provetta preparata dal formatore serve solo a mostrare.\n\nLavoro per fasi osservate, tempi attivi e d’attesa distinti, nessun passaggio fittizio.', 'venticinque minuti non includono l’attesa\n\nStudente preleva C alle dieci in punto, inizia essiccazione, poi l’equilibrio pi acca richiede trenta a sessanta minuti.\n\nI venticinque minuti pianificati stimano lavoro attivo, non tutti i tempi necessari.\n\nUn ID collega raccolta, essiccazione, pi acca, tatto e relazione con tempo di ciascuno.\n\nLo studente esegue ogni fase; provetta preparata dal formatore serve solo a mostrare.\n\nLavoro per fasi osservate, tempi attivi e d’attesa distinti, nessun passaggio fittizio.'), ('Due tazze non sono una pesata\n\nL’esempio richiede «circa due tazze o 500 grammi» del composito.\n\nChiedere unità e quantità al laboratorio ricevente.\n\nSe 500 g, pesare; se due tazze, misurare il volume e dichiararlo.\n\nRegistrare l’ID del campione, la profondità e il numero di prelievi richiesti, senza equiparare massa e volume.\n\nQuantità univoca misurata e identità integra.', 'Due tazze non sono una pesata\n\nL’esempio richiede «circa due tazze o cinquecento grammi» del composito.\n\nChiedere unità e quantità al laboratorio ricevente.\n\nSe cinquecento grammi, pesare; se due tazze, misurare il volume e dichiararlo.\n\nRegistrare l’ID del campione, la profondità e il numero di prelievi richiesti, senza equiparare massa e volume.\n\nQuantità univoca misurata e identità integra.'), ('Nastri corti, classi differenti\n\nDue campioni fanno nastro 2 cm; uno è granuloso, altro molto liscio allo sfregamento umido.\n\nPrima confermare umidità, sfera e nastro.\n\nSeguire ramo USDA del nastro debole e distinguere granuloso/liscio.\n\nSe il campione con nastro debole è molto granuloso, la guida sostiene franco sabbioso; se è molto liscio, franco limoso. Se nessuna sensazione predomina, seguire il ramo franco. Sono stime sul campo condizionate alle osservazioni.\n\nUsare lunghezza e sensazione, annotando l’incertezza della stima sul campo.', 'Nastri corti, classi differenti\n\nDue campioni fanno nastro due centimetri; uno è granuloso, altro molto liscio allo sfregamento umido.\n\nPrima confermare umidità, sfera e nastro.\n\nSeguire ramo u esse di a del nastro debole e distinguere granuloso da liscio.\n\nSe il campione con nastro debole è molto granuloso, la guida sostiene franco sabbioso; se è molto liscio, franco limoso. Se nessuna sensazione predomina, seguire il ramo franco. Sono stime sul campo condizionate alle osservazioni.\n\nUsare lunghezza e sensazione, annotando l’incertezza della stima sul campo.'), ("Un rapporto deve dire quale grandezza\n\nL'esempio didattico usa 20 g di suolo secco e 20 mL di acqua distillata: massa:volume. Un metodo di laboratorio separato usa 1:1 volume:volume, prelevando il suolo con il misurino denominato «10 gram NCR-13 volumetric scoop» e aggiungendo 10 mL di acqua deionizzata. È il nome di un misurino volumetrico, non un'istruzione a pesare esattamente 10 g di questo terreno.\n\nPrimo esempio massa:volume, secondo volume:volume.\n\nScegliere SOP e pHmetro veri e registrare aliquota, attesa e calibrazione; non mescolare cifre delle due procedure.\n\nLa misura con elettrodo digitale e il confronto con reagente colorimetrico usano strumenti e procedure diversi; eseguire l'uno non dimostra di aver eseguito l'altro.\n\nMisura riproducibile con metodo dichiarato.", "Un rapporto deve dire quale grandezza\n\nL'esempio didattico usa venti grammi di suolo secco e venti millilitri di acqua distillata: rapporto fra massa e volume. Un metodo di laboratorio separato usa uno a uno rapporto fra due volumi, prelevando il suolo con il misurino denominato «dieci gram enne ci erre tredici volumetric scoop» e aggiungendo dieci millilitri di acqua deionizzata. È il nome di un misurino volumetrico, non un'istruzione a pesare esattamente dieci grammi di questo terreno.\n\nPrimo esempio rapporto fra massa e volume, secondo rapporto fra due volumi.\n\nScegliere esse o pi e pi accametro veri e registrare aliquota, attesa e calibrazione; non mescolare cifre delle due procedure.\n\nLa misura con elettrodo digitale e il confronto con reagente colorimetrico usano strumenti e procedure diversi; eseguire l'uno non dimostra di aver eseguito l'altro.\n\nMisura riproducibile con metodo dichiarato.")], 'de': [('25 Minuten enthalten keine Wartezeit\n\nPerson entnimmt um 10:00 Boden von C, beginnt Lufttrocknung und wartet später 30–60 Minuten auf pH-Ausgleich.\n\nDie geplanten 25 Minuten gelten für aktive Arbeit, nicht alle Trocknungs- und Warteabschnitte.\n\nEine ID verbindet Entnahme, Trocknung, pH, Fühlen und Bericht mit realen Zeiten.\n\nJede Aufgabe führt die lernende Person selbst aus; das früher vorbereitete Lehrgefäß der Lehrkraft dient nur der Demonstration.\n\nGestufte Beobachtung mit getrennten aktiven und Wartezeiten, kein Abkürzungspass.', 'fünfundzwanzig Minuten enthalten keine Wartezeit\n\nPerson entnimmt um zehn Uhr Boden von C, beginnt Lufttrocknung und wartet später dreißig bis sechzig Minuten auf Pe Ha-Ausgleich.\n\nDie geplanten fünfundzwanzig Minuten gelten für aktive Arbeit, nicht alle Trocknungs- und Warteabschnitte.\n\nEine ID verbindet Entnahme, Trocknung, Pe Ha, Fühlen und Bericht mit realen Zeiten.\n\nJede Aufgabe führt die lernende Person selbst aus; das früher vorbereitete Lehrgefäß der Lehrkraft dient nur der Demonstration.\n\nGestufte Beobachtung mit getrennten aktiven und Wartezeiten, kein Abkürzungspass.'), ('Gleich kurzes Band, verschiedene Klassen\n\nZwei Proben bilden 2-cm-Band, eine fühlt körnig, die andere sehr glatt beim Nassreiben.\n\nZuerst Feuchte, Kugel und Band prüfen.\n\nUSDA-Schwachbandzweig nutzen, dann Körnigkeit/Glätte unterscheiden.\n\nFühlt sich die Probe mit schwachem Band sehr körnig an, stützt die Anleitung sandigen Lehm; bei sehr glattem Gefühl Schlufflehm. Überwiegt keine Empfindung, den Lehmzweig verwenden. Es bleiben bedingte Feldschätzungen.\n\nLänge und Gefühl zusammen verwenden, Feldunsicherheit nennen.', 'Gleich kurzes Band, verschiedene Klassen\n\nZwei Proben bilden zwei-Zentimeter-Band, eine fühlt körnig, die andere sehr glatt beim Nassreiben.\n\nZuerst Feuchte, Kugel und Band prüfen.\n\nU Es De A-Schwachbandzweig nutzen, dann Körnigkeit und Glätte unterscheiden.\n\nFühlt sich die Probe mit schwachem Band sehr körnig an, stützt die Anleitung sandigen Lehm; bei sehr glattem Gefühl Schlufflehm. Überwiegt keine Empfindung, den Lehmzweig verwenden. Es bleiben bedingte Feldschätzungen.\n\nLänge und Gefühl zusammen verwenden, Feldunsicherheit nennen.'), ('Verhältnis braucht seine Bezugsgrößen\n\nDas Lehrbeispiel nutzt 20 g trockenen Boden plus 20 mL destilliertes Wasser: Masse:Volumen. Ein anderes Laborverfahren nutzt 1:1 Volumen:Volumen, entnimmt Boden mit dem als «10 gram NCR-13 volumetric scoop» bezeichneten Messlöffel und ergänzt 10 mL deionisiertes Wasser. Dies ist der Name eines Volumenmesslöffels, keine Anweisung, genau 10 g dieses Bodens abzuwiegen.\n\nLehrbeispiel Masse:Volumen, Laborbeispiel Volumen:Volumen.\n\nReales SOP/Gerät auswählen und Portion, Warten/Kalibrierung dokumentieren; Zahlen nicht mischen.\n\nEine Messung mit digitaler Elektrode und ein Farbreagenzvergleich nutzen unterschiedliche Geräte und Verfahren. Das eine belegt nicht die Durchführung des anderen.\n\nWiederholbare gerätegebundene Messung.', 'Verhältnis braucht seine Bezugsgrößen\n\nDas Lehrbeispiel nutzt zwanzig Gramm trockenen Boden plus zwanzig Milliliter destilliertes Wasser: Masse zu Volumen. Ein anderes Laborverfahren nutzt eins zu eins Volumen zu Volumen, entnimmt Boden mit dem als «zehn gram En Ce Er dreizehn volumetric scoop» bezeichneten Messlöffel und ergänzt zehn Milliliter deionisiertes Wasser. Dies ist der Name eines Volumenmesslöffels, keine Anweisung, genau zehn Gramm dieses Bodens abzuwiegen.\n\nLehrbeispiel Masse zu Volumen, Laborbeispiel Volumen zu Volumen.\n\nReales Es O Pe und Gerät auswählen und Portion, Warten und Kalibrierung dokumentieren; Zahlen nicht mischen.\n\nEine Messung mit digitaler Elektrode und ein Farbreagenzvergleich nutzen unterschiedliche Geräte und Verfahren. Das eine belegt nicht die Durchführung des anderen.\n\nWiederholbare gerätegebundene Messung.'), ('Zwei Tassen sind keine Waagenanzeige\n\nDas Beispiel bietet „etwa 2 Tassen oder 500 Gramm“ Mischprobe.\n\nEmpfangslabor nach Menge und Einheit fragen.\n\nBei 500 g wiegen, bei Tassen Volumen messen und so benennen.\n\nProben-ID, erforderliche Tiefe und Zahl der Teilproben notieren, statt Volumen mit Masse gleichzusetzen.\n\nEine eindeutige gemessene Abgabemenge und intakte Identitätskette.', 'Zwei Tassen sind keine Waagenanzeige\n\nDas Beispiel bietet „etwa zwei Tassen oder fünfhundert Gramm“ Mischprobe.\n\nEmpfangslabor nach Menge und Einheit fragen.\n\nBei fünfhundert Gramm wiegen, bei Tassen Volumen messen und so benennen.\n\nProben-ID, erforderliche Tiefe und Zahl der Teilproben notieren, statt Volumen mit Masse gleichzusetzen.\n\nEine eindeutige gemessene Abgabemenge und intakte Identitätskette.')]}
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
        projection=read(HERE/('provenance/gated-source-slice-'+u['locale']+'.json'))
        validate_gated_worked_unit(u,projection,projection['canonicalWholeSourceSHA256'])
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req,runtime

def lane():
    loc=os.environ.get('LOCALE_LANE');assert loc in ['ar-EG','en','it','de'];assert os.environ.get('GITHUB_JOB')=={'ar-EG':'narrate_ar','en':'narrate_en','it':'narrate_it','de':'narrate_de'}[loc];return loc

def require_actions():
    lane()
    assert os.environ.get('GITHUB_ACTIONS')=='true','Actions only'
    assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820' and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418' and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s316-gated-audio-20261024-r1'
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
    assert count < 4, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 16,'maximumCallsForLane':4,
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
    assert all(v<=4 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_FOUR_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':4,'maximumBlindReviewPerLane':4,'maximumASRPerLane':4,'maximumTTSAggregate':16,'maximumBlindAggregate':16,'maximumASRAggregate':16,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
            print('Frozen16 S307 protected full cases verified; zero provider calls.')
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
