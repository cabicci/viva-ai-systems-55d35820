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
IDS = ('S3-15-ar-EG-E01-r1', 'S3-15-ar-EG-E02-r1', 'S3-15-ar-EG-E03-r1', 'S3-15-ar-EG-E04-r1', 'S3-15-en-E01-r1', 'S3-15-en-E02-r1', 'S3-15-en-E03-r1', 'S3-15-en-E04-r1', 'S3-15-it-E01-r1', 'S3-15-it-E02-r1', 'S3-15-it-E03-r1', 'S3-15-it-E04-r1', 'S3-15-de-E01-r1', 'S3-15-de-E02-r1', 'S3-15-de-E03-r1', 'S3-15-de-E04-r1')
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
    assert type(req['fixedLocaleLanes']) is dict and req['fixedLocaleLanes']=={'ar-EG': ['S3-15-ar-EG-E01-r1', 'S3-15-ar-EG-E02-r1', 'S3-15-ar-EG-E03-r1', 'S3-15-ar-EG-E04-r1'], 'en': ['S3-15-en-E01-r1', 'S3-15-en-E02-r1', 'S3-15-en-E03-r1', 'S3-15-en-E04-r1'], 'it': ['S3-15-it-E01-r1', 'S3-15-it-E02-r1', 'S3-15-it-E03-r1', 'S3-15-it-E04-r1'], 'de': ['S3-15-de-E01-r1', 'S3-15-de-E02-r1', 'S3-15-de-E03-r1', 'S3-15-de-E04-r1']},'Exact locale-to-ordered-UID lane map required before any provider operation'
    assert(req['scope'],req['stepId'])==('S315_16_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-15')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_4_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s315-gated-audio-20261024-r1')
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
        allowedByLocale={'ar-EG': [('الاهتزاز زاد فجأة\n\nأثناء المرور الاهتزاز أعلى من المعتاد؛ الأصل يذكر مسامير مفكوكة أو أسنان تالفة.\n\nأوقف فورًا وخلي الناس بعيدة؛ ما تلمسش الجزء الدوار ولا تكمل.\n\nبعد العزل والتبريد، الشخص المؤهل يفحص فقط ما يُسمح به؛ مشاكل المحرك ونقل الحركة لفنّي.\n\nما تصنعش عطلًا بمسمار مفكوك في آلة هتشتغل.\n\nبلّغ عن توقف بسبب خطر، وأجّل إعادة التشغيل لحد ما سبب العطل وإصلاحه يتأكدوا.', 'الاهتزاز زاد فجأة\n\nأثناء المرور الاهتزاز أعلى من المعتاد؛ الأصل يذكر مسامير مفكوكة أو أسنان تالفة.\n\nأوقف فورًا وخلي الناس بعيدة؛ ما تلمسش الجزء الدوار ولا تكمل.\n\nبعد العزل والتبريد، الشخص المؤهل يفحص بس اللي مسموح له يفحصه. مشاكل المحرك ونقل الحركة لفنّي.\n\nما تعملش عطل بمسمار مفكوك في آلة هتشتغل.\n\nبلّغ عن توقف بسبب خطر، وأجّل إعادة التشغيل لحد ما سبب العطل وإصلاحه يتأكدوا.'), ('الحشائش باقية والمحرك سليم\n\nبعد مرور مسموح به الحشائش لسه بجذورها والتربة مبلولة، وحالة الأسنان مجهولة.\n\nضعف النتيجة مش دليل عطل محرك.\n\nأوقف وراجع توقيت رطوبة التربة والسرعة والضبط وحالة الأسنان الظاهرة من غير لمس متحرك.\n\nوثّق حالة النبات والنتيجة وقرار المدرّب قبل أي مرور جديد.\n\nفيه أسباب محتملة متعددة؛ التعديل حسب المدرّب والدليل، والأسنان التالفة للمختص.', 'الحشائش باقية والمحرك سليم\n\nبعد مرور مسموح الحشائش لسه بجذورها والتربة مبلولة، وحالة الأسنان مجهولة.\n\nضعف النتيجة مش دليل عطل محرك.\n\nأوقف وراجع توقيت رطوبة التربة والسرعة والضبط وحالة الأسنان الظاهرة من غير لمس متحرك.\n\nوثّق حالة النبات والنتيجة وقرار المدرّب قبل أي مرور جديد.\n\nفيه أسباب محتملة متعددة؛ التعديل حسب المدرّب والدليل، والأسنان التالفة للمختص.'), ('سجل الخدمة مش كلام من الذاكرة\n\nالسجل كاتب «شحّمت الأسبوع ده، غسلت الفلتر، الجهاز كويس» بلا موديل أو ساعات أو نوع العنصر.\n\nحدّد الموديل والدليل وسجل ساعات التشغيل وطريقة حسابه والتاريخ ومين شاف الفحص ونوع العنصر. قراءة عداد الساعات بس لو الجهاز الفعلي فيه عداد.\n\nما تنسبش موعد تشحيم أسبوعي لـSER ولا تغسل ورق الفلتر؛ أحِل خدمة المصنع المجدولة للمختص.\n\nسجّل العيوب وهل الأداء العملي اتشاف فعلاً.\n\nسجل قابل للمراجعة فيه أعمال مؤجلة وحالة صادقة، مش كلمة «كويس» عامة.', 'سجل الخدمة مش كلام من الذاكرة\n\nالسجل كاتب «شحّمت الأسبوع ده، غسلت الفلتر، الجهاز كويس» بلا موديل أو ساعات أو نوع العنصر.\n\nحدّد الموديل والدليل وسجل ساعات التشغيل وطريقة حسابه والتاريخ ومين شاف الفحص ونوع العنصر. قراءة عداد الساعات بس لو الجهاز الفعلي فيه عداد.\n\nما تنسبش موعد تشحيم أسبوعي لـإس إي آر ولا تغسل ورق الفلتر؛ حوّل خدمة المصنع اللي ليها مواعيد محددة للمختص.\n\nسجّل العيوب وهل الأداء العملي اتشاف فعلاً.\n\nسجل تقدر تراجعه، فيه شغل مؤجل وحالة صادقة، مش كلمة «كويس» عامة.')], 'en': [("A full tank, then a stall\n\nA cultivator sputters and dies; its fuel tank is full. The source answer says 'check air filter next.'\n\nStop and make the machine safe. A full tank does not verify the fuel valve, switch, fuel feed or ignition.\n\nA dirty/poorly seated air cleaner is one plausible cause and may be checked safely under the matched procedure; it is not an invariant first action.\n\nUse the actual manual's chart, record findings and refer unsafe or unresolved work.\n\nInvestigate conditionally, with air-cleaner condition included; do not replace the plug or run the machine as a guess.", "A full tank, then a stall\n\nA cultivator sputters and dies; its fuel tank is full. The source answer says 'check air filter next.'\n\nStop and make the machine safe. A full tank does not verify the fuel valve, switch, fuel feed or ignition.\n\nA dirty or poorly seated air cleaner is one plausible cause and may be checked safely under the matched procedure; it is not an invariant first action.\n\nUse the actual manual's chart, record findings and refer unsafe or unresolved work.\n\nInvestigate conditionally, with air-cleaner condition included; do not replace the plug or run the machine as a guess."), ("Service log versus memory\n\nA record says 'greased this week, filter washed, machine good' but gives no model, hour reading or element type.\n\nIdentify actual model/manual, operating-hours record and its method, task date, observer and element type. Use a meter reading only if the actual machine has a meter.\n\nDo not claim weekly grease for the SER or wash its paper element; assign the maker's scheduled/dealer work.\n\nRecord abnormal findings and whether practical actions were actually observed.\n\nAn auditable log with due work and honest status, not a blanket 'good' rating.", "Service log versus memory\n\nA record says 'greased this week, filter washed, machine good' but gives no model, hour reading or element type.\n\nIdentify actual model and manual, operating-hours record and its method, task date, observer and element type. Use a meter reading only if the actual machine has a meter.\n\nDo not claim weekly grease for the S E R or wash its paper element; assign the maker's scheduled or dealer work.\n\nRecord abnormal findings and whether practical actions were actually observed.\n\nAn auditable log with due work and honest status, not a blanket 'good' rating."), ("Vibration rises suddenly\n\nDuring a pass, vibration is much stronger than normal. The source offers loose bolts or damaged blades as possibilities.\n\nStop immediately and keep people clear; do not feel the machine's live rotary or keep driving.\n\nOnce isolated/cooled, a qualified person checks permissible external fasteners and tines; engine/drive issues go to the technician.\n\nNever create a loose-bolt fault on a machine to make this exercise realistic.\n\nReport a hazardous stop and defer restart until the cause and repair are verified.", "Vibration rises suddenly\n\nDuring a pass, vibration is much stronger than normal. The source offers loose bolts or damaged blades as possibilities.\n\nStop immediately and keep people clear; do not feel the machine's live rotary or keep driving.\n\nOnce isolated and cooled, a qualified person checks permissible external fasteners and tines; engine and drive issues go to the technician.\n\nNever create a loose-bolt fault on a machine to make this exercise realistic.\n\nReport a hazardous stop and defer restart until the cause and repair are verified."), ('Weeds remain but the engine is normal\n\nAfter a permitted pass, weeds remain rooted and soil is wet; tine wear is unknown.\n\nDo not treat a poor result as proof of an engine fault.\n\nStop and assess soil timing, pass pace/setting and visible tine condition without touching moving parts.\n\nDocument crop condition, photo/observation and trainer decision before repeating any pass.\n\nSeveral causes remain possible; adjust only under the trainer and manual, and refer damaged tines.', 'Weeds remain but the engine is normal\n\nAfter a permitted pass, weeds remain rooted and soil is wet; tine wear is unknown.\n\nDo not treat a poor result as proof of an engine fault.\n\nStop and assess soil timing, pass pace and setting and visible tine condition without touching moving parts.\n\nDocument crop condition, photo or observation and trainer decision before repeating any pass.\n\nSeveral causes remain possible; adjust only under the trainer and manual, and refer damaged tines.')], 'it': [('Registro invece di memoria\n\nUna nota dice «ingrassata questa settimana, filtro lavato, tutto bene», senza modello, ore o tipo di elemento.\n\nIdentificare modello/manuale, registro delle ore e metodo di rilevazione, data, osservatore e tipo di elemento. Usare una lettura del contaore soltanto se la macchina effettiva ne dispone.\n\nNon attribuire grasso settimanale a SER né lavare carta; assegnare servizio previsto dal costruttore.\n\nRegistrare difetti e se attività pratica fu davvero osservata.\n\nRegistro verificabile con scadenze e stato onesto, non giudizio vago.', 'Registro invece di memoria\n\nUna nota dice «ingrassata questa settimana, filtro lavato, tutto bene», senza modello, ore o tipo di elemento.\n\nIdentificare modello e manuale, registro delle ore e metodo di rilevazione, data, osservatore e tipo di elemento. Usare una lettura del contaore soltanto se la macchina effettiva ne dispone.\n\nNon attribuire grasso settimanale a esse e erre né lavare carta; assegnare servizio previsto dal costruttore.\n\nRegistrare difetti e se attività pratica fu davvero osservata.\n\nRegistro verificabile con scadenze e stato onesto, non giudizio vago.'), ('Restano erbe ma motore normale\n\nDopo passaggio consentito, erbe radicate restano, suolo è bagnato e usura zappe ignota.\n\nRisultato scarso non dimostra guasto del motore.\n\nFermare, valutare umidità, velocità/regolazione e zappe visibili senza toccare parti in moto.\n\nDocumentare coltura e decisione del formatore prima di ripetere.\n\nPiù cause possibili; adattare con formatore/manuale e inviare zappe danneggiate.', 'Restano erbe ma motore normale\n\nDopo passaggio consentito, erbe radicate restano, suolo è bagnato e usura zappe ignota.\n\nRisultato scarso non dimostra guasto del motore.\n\nFermare, valutare umidità, velocità e regolazione e zappe visibili senza toccare parti in moto.\n\nDocumentare coltura e decisione del formatore prima di ripetere.\n\nPiù cause possibili; adattare con formatore e manuale e inviare zappe danneggiate.'), ('Serbatoio pieno, poi si ferma\n\nIl motore tossisce e si spegne benché il serbatoio sia pieno; la fonte dice di controllare «subito il filtro».\n\nArrestare e mettere in sicurezza: pieno non verifica rubinetto, interruttore, flusso o accensione.\n\nFiltro sporco o mal montato è possibile e verificabile secondo manuale, ma non sempre prima di tutto.\n\nUsare lo schema del dispositivo reale, registrare e affidare lavori pericolosi/irrisolti al tecnico.\n\nDiagnosi condizionale con filtro incluso; non sostituire la candela o far girare per tentativi.', 'Serbatoio pieno, poi si ferma\n\nIl motore tossisce e si spegne benché il serbatoio sia pieno; la fonte dice di controllare «subito il filtro».\n\nArrestare e mettere in sicurezza: pieno non verifica rubinetto, interruttore, flusso o accensione.\n\nFiltro sporco o mal montato è possibile e verificabile secondo manuale, ma non sempre prima di tutto.\n\nUsare lo schema del dispositivo reale, registrare e affidare lavori pericolosi o irrisolti al tecnico.\n\nDiagnosi condizionale con filtro incluso; non sostituire la candela o far girare per tentativi.'), ('Vibrazioni improvvise\n\nDurante passaggio la vibrazione cresce; fonte suggerisce viti allentate o zappe danneggiate.\n\nFermare subito e tenere lontani; non toccare rotore attivo né proseguire.\n\nIsolato e freddo, persona qualificata verifica solo parti esterne ammesse; motore/trasmissione a tecnico.\n\nNon creare un bullone allentato su macchina per rendere realistico il caso.\n\nSegnalare stop pericoloso e rinviare riavvio finché causa e riparazione non siano verificate.', 'Vibrazioni improvvise\n\nDurante passaggio la vibrazione cresce; fonte suggerisce viti allentate o zappe danneggiate.\n\nFermare subito e tenere lontani; non toccare rotore attivo né proseguire.\n\nIsolato e freddo, persona qualificata verifica solo parti esterne ammesse; motore e trasmissione a tecnico.\n\nNon creare un bullone allentato su macchina per rendere realistico il caso.\n\nSegnalare stop pericoloso e rinviare riavvio finché causa e riparazione non siano verificate.')], 'de': [('Serviceprotokoll statt Erinnerung\n\nEin Zettel sagt „diese Woche gefettet, Filter gewaschen, alles gut“, aber ohne Modell, Stunden oder Elementtyp.\n\nTatsächliches Modell/Anleitung, Betriebsstundenprotokoll und Erfassungsmethode, Datum, beobachtende Person und Elementtyp nennen. Einen Zählerstand nur angeben, wenn das tatsächliche Gerät einen Zähler besitzt.\n\nKein Wochenfett für SER behaupten oder Papierelement waschen; planmäßige Händlerarbeit übergeben.\n\nMängel und tatsächlich beobachtete praktische Arbeit getrennt festhalten.\n\nPrüfbares Protokoll mit fälligen Aufgaben und ehrlichem Status statt pauschalem „gut“.', 'Serviceprotokoll statt Erinnerung\n\nEin Zettel sagt „diese Woche gefettet, Filter gewaschen, alles gut“, aber ohne Modell, Stunden oder Elementtyp.\n\nTatsächliches Modell und Anleitung, Betriebsstundenprotokoll und Erfassungsmethode, Datum, beobachtende Person und Elementtyp nennen. Einen Zählerstand nur angeben, wenn das tatsächliche Gerät einen Zähler besitzt.\n\nKein Wochenfett für Es E Er behaupten oder Papierelement waschen; planmäßige Händlerarbeit übergeben.\n\nMängel und tatsächlich beobachtete praktische Arbeit getrennt festhalten.\n\nPrüfbares Protokoll mit fälligen Aufgaben und ehrlichem Status statt pauschalem „gut“.'), ('Tank voll, Motor geht aus\n\nDer Motor stottert und stirbt trotz vollem Tank; die Quellantwort lautet „als Nächstes Luftfilter“.\n\nStoppen und sichern: voller Tank bestätigt Ventil, Schalter, Durchfluss oder Zündung nicht.\n\nVerschmutzter/falsch sitzender Filter ist möglich und nach Handbuch sicher prüfbar, aber nicht immer der erste Schritt.\n\nHandbuchdiagramm des wirklichen Geräts nutzen, Ergebnisse notieren und gefährliche/offene Aufgaben zur Fachkraft geben.\n\nBedingte Diagnose mit Luftfilter als Möglichkeit; keine Kerze auf Verdacht tauschen oder Probelauf.', 'Tank voll, Motor geht aus\n\nDer Motor stottert und stirbt trotz vollem Tank; die Quellantwort lautet „als Nächstes Luftfilter“.\n\nStoppen und sichern: voller Tank bestätigt Ventil, Schalter, Durchfluss oder Zündung nicht.\n\nVerschmutzter oder falsch sitzender Filter ist möglich und nach Handbuch sicher prüfbar, aber nicht immer der erste Schritt.\n\nHandbuchdiagramm des wirklichen Geräts nutzen, Ergebnisse notieren und gefährliche oder offene Aufgaben zur Fachkraft geben.\n\nBedingte Diagnose mit Luftfilter als Möglichkeit; keine Kerze auf Verdacht tauschen oder Probelauf.'), ('Unkraut bleibt, Motor läuft normal\n\nNach einer erlaubten Fahrt bleibt das Unkraut verwurzelt stehen; der Boden ist nass und der Verschleiß der Hackmesser unbekannt.\n\nSchwaches Ergebnis beweist keinen Motorfehler.\n\nStoppen, Feuchte, Tempo/Einstellung und sichtbare Messer prüfen ohne bewegte Teile anzufassen.\n\nKulturzustand, Foto oder Beobachtung und Entscheidung der Lehrkraft vor jeder erneuten Fahrt dokumentieren.\n\nMehrere Ursachen möglich; Anpassung nur mit Lehrkraft und Handbuch, beschädigte Messer zur Fachkraft.', 'Unkraut bleibt, Motor läuft normal\n\nNach einer erlaubten Fahrt bleibt das Unkraut verwurzelt stehen; der Boden ist nass und der Verschleiß der Hackmesser unbekannt.\n\nSchwaches Ergebnis beweist keinen Motorfehler.\n\nStoppen, Feuchte, Tempo und Einstellung und sichtbare Messer prüfen ohne bewegte Teile anzufassen.\n\nKulturzustand, Foto oder Beobachtung und Entscheidung der Lehrkraft vor jeder erneuten Fahrt dokumentieren.\n\nMehrere Ursachen möglich; Anpassung nur mit Lehrkraft und Handbuch, beschädigte Messer zur Fachkraft.'), ('Vibration steigt plötzlich\n\nBei Fahrt wird die Vibration viel stärker; die Vorlage nennt lockere Schrauben oder beschädigte Messer.\n\nSofort stoppen und andere fernhalten; weder den laufenden Rotor berühren noch weiterfahren.\n\nGesichert/abgekühlt prüft geeignete Person nur erlaubte äußere Teile; Motor/Antrieb zur Fachkraft.\n\nKeine lockere Schraube an betriebsfähiger Maschine als Demo erzeugen.\n\nGefährlichen Stopp melden und Neustart bis bestätigter Behebung verschieben.', 'Vibration steigt plötzlich\n\nBei Fahrt wird die Vibration viel stärker; die Vorlage nennt lockere Schrauben oder beschädigte Messer.\n\nSofort stoppen und andere fernhalten; weder den laufenden Rotor berühren noch weiterfahren.\n\nGesichert und abgekühlt prüft geeignete Person nur erlaubte äußere Teile; Motor und Antrieb zur Fachkraft.\n\nKeine lockere Schraube an betriebsfähiger Maschine als Demo erzeugen.\n\nGefährlichen Stopp melden und Neustart bis bestätigter Behebung verschieben.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s315-gated-audio-20261024-r1'
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
