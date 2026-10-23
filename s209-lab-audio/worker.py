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
IDS = ('S2-09-ar-EG-demonstration-guidance-r1', 'S2-09-ar-EG-knowledge-completion-r1', 'S2-09-ar-EG-record-guidance-r1', 'S2-09-en-demonstration-guidance-r1', 'S2-09-en-knowledge-completion-r1', 'S2-09-en-record-guidance-r1', 'S2-09-it-demonstration-guidance-r1', 'S2-09-it-knowledge-completion-r1', 'S2-09-it-record-guidance-r1', 'S2-09-de-demonstration-guidance-r1', 'S2-09-de-knowledge-completion-r1', 'S2-09-de-record-guidance-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==12
    assert(req['scope'],req['stepId'])==('S209_LAB_12_SOURCEBOUND_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_NINE_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(12,12,12,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s209-lab-audio-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==12
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwentyFourCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(3))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['demonstration-guidance', 'knowledge-completion', 'record-guidance']
        voice='Charon'if group in['knowledge-completion']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointers={'demonstration-guidance': ['/npkPractice/ui/modelHelp', '/npkPractice/physical', '/npkPractice/ui/steps/0', '/npkPractice/ui/steps/1', '/npkPractice/ui/steps/2', '/npkPractice/ui/steps/3', '/npkPractice/ui/orderGood', '/npkPractice/accessibility'], 'knowledge-completion': ['/npkPractice/passChecks/0/evidence', '/npkPractice/passChecks/0/decision', '/npkPractice/passChecks/1/evidence', '/npkPractice/passChecks/1/decision', '/npkPractice/passChecks/2/evidence', '/npkPractice/passChecks/2/decision'], 'record-guidance': ['/npkPractice/ui/recordHelp', '/npkPractice/ui/fields/0', '/npkPractice/ui/fields/1', '/npkPractice/ui/fields/2', '/npkPractice/ui/fields/3', '/npkPractice/ui/fields/4', '/npkPractice/ui/fields/5', '/npkPractice/ui/saved', '/npkPractice/ui/unknown', '/npkPractice/ui/reasonBoundary', '/npkPractice/ui/tableWarning', '/studentDownloads/0/title']}
        assert [b['pointer']for b in u['sourceBindings']]==exactSourcePointers[group]
        assert not any('/scenarios/'in b['pointer']or '/cases/'in b['pointer']or b['pointer'].endswith('/model')or b['pointer'].endswith('/fallback')or 'After'in b['pointer']for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nالعدة الفعلية ودليلها أو طريقة المعمل\n\nهوية العينة وأساس تسجيل النتيجة\n\nمحلول الاستخلاص وكميات الطريقة المحددة (يوفرها المدرّب)\n\nعينة الشاهد (البلانك) أو المعايرة والقراءة أو الجدول المطابق\n\nالمحصول والمنطقة ودليل التفسير المناسب\n\nالمعلومات الناقصة لكمية الجير X والسماد Y، من غير تخمين جرعة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nX وY لسه مش محسومين؛ المجهول مش صفر\n\nدي مقارنة بإجابة نموذجية بعد محاولتك؛ مش حكم على معنى إجابتك ولا اعتماد لجرعة سماد.\n\nالتدريب هنا على جدول المثال القديم بس. المعمل الحقيقي ممكن يصنّف نفس الرقم بشكل مختلف.\n\nورقة تدريب تفسير اختبار NPK', 'استخدم بيانات تدريب متسمّية بوضوح أو ملاحظات وفرها المدرّب بس. المجهول سيبه فاضي؛ كتابة كلام ما تثبتش إن قياس حصل.\n\nالعدة الفعلية ودليلها أو طريقة المعمل\n\nهوية العينة وأساس تسجيل النتيجة\n\nمحلول الاستخلاص وكميات الطريقة المحددة (يوفرها المدرّب)\n\nعينة الشاهد (البلانك) أو المعايرة والقراءة أو الجدول المطابق\n\nالمحصول والمنطقة ودليل التفسير المناسب\n\nالمعلومات الناقصة لكمية الجير إكس والسماد واي، من غير تخمين جرعة\n\nالصف اتحفظ محليًا. ما اتعملش اعتماد نتيجة عملية ولا توقيع مدرّب.\n\nإكس وواي لسه مش محسومين؛ المجهول مش صفر\n\nدي مقارنة بإجابة نموذجية بعد محاولتك؛ مش حكم على معنى إجابتك ولا اعتماد لجرعة سماد.\n\nالتدريب هنا على جدول المثال القديم بس. المعمل الحقيقي ممكن يصنّف نفس الرقم بشكل مختلف.\n\nورقة تدريب تفسير اختبار إن بي كيه'), ('الطالب يرتب المراحل الأربع اللي شافها في عرض المدرّب، ويعرف إن كمية التربة ومحلول الاستخلاص والكاشف يحددهم الإجراء الفعلي، ويشرح إن الاستخلاص مؤشر خاص بالطريقة، مش كل العناصر الموجودة في الأرض ولا بالضبط اللي هتسحبه الجذور.\n\nالاجتياز بتسلسل كامل وفهم حدود الطريقة. مشاهدة العرض لا تعطي كفاءة تنفيذ تحليل كيميائي مستقل.\n\nالطالب يكتب وحدة كل نتيجة وطريقة المعمل ويستخدم مرجعًا مناسبًا للمحصول والمنطقة قبل التصنيف؛ ويفرق بين نسب N-P2O5-K2O على عبوة السماد وppm في تحليل التربة.\n\nالاجتياز بتحديد صحيح للوحدة والطريقة وحدود التفسير؛ نقل حد من جدول المثال كأنه معيار عام لا يجتاز.\n\nفي حالة pH 5.5 وP 12 ppm وفراغَي X/Y، يذكر الطالب أساس التحليل والمحصول والمنطقة واحتياج الجير وتوصية العنصر وتفاصيل المنتج اللي لسه ناقصة، ثم يقترح فحصًا تاليًا مشروطًا من غير اختراع جرعة.\n\nالاجتياز لما يوضح الدليل الناقص والاتجاه المشروط. جرعة حقل متخيلة أو توصية N تلقائية من رقم منخفض ترفض.', 'الطالب يرتب المراحل الأربع اللي شافها في عرض المدرّب، ويعرف إن كمية التربة ومحلول الاستخلاص والكاشف يحددهم الإجراء الفعلي، ويشرح إن الاستخلاص مؤشر خاص بالطريقة، مش كل العناصر الموجودة في الأرض ولا بالضبط اللي هتسحبه الجذور.\n\nالاجتياز بتسلسل كامل وفهم حدود الطريقة. مشاهدة العرض لا تعطي كفاءة تنفيذ تحليل كيميائي مستقل.\n\nالطالب يكتب وحدة كل نتيجة وطريقة المعمل ويستخدم مرجعًا مناسبًا للمحصول والمنطقة قبل التصنيف؛ ويفرق بين نسب النيتروجين-بي اتنين أو خمسة-كيه اتنين أو على عبوة السماد وppm في تحليل التربة.\n\nالاجتياز بتحديد صحيح للوحدة والطريقة وحدود التفسير؛ نقل حد من جدول المثال كأنه معيار عام لا يجتاز.\n\nفي حالة بي إتش خمسة فاصلة خمسة والفوسفور اتناشر جزء في المليون وفراغَي إكس وواي، يذكر الطالب أساس التحليل والمحصول والمنطقة واحتياج الجير وتوصية العنصر وتفاصيل المنتج اللي لسه ناقصة، ثم يقترح فحصًا تاليًا مشروطًا من غير اختراع جرعة.\n\nالاجتياز لما يوضح الدليل الناقص والاتجاه المشروط. جرعة حقل متخيلة أو توصية النيتروجين تلقائية من رقم منخفض ترفض.'), ('وppm', 'وجزء في المليون')], 'en': [("Learner orders four observed demonstration stages, names the known amount of soil, extractant and reagent as method-specific, and explains that the extraction is an operational index rather than all nutrients in the soil or exactly what roots take up.\n\nPass only with the full sequence and method limitation. Watching the trainer does not award independent chemical-analysis competence.\n\nLearner labels the units and the laboratory's method for each value and uses a crop- and region-appropriate guide before classifying; identifies fertilizer-label N-P2O5-K2O percentages as different from soil-test ppm.\n\nPass with correct unit, method and interpretation boundary; copying an example threshold as a universal standard does not pass.\n\nFor pH 5.5/P 12 ppm and report placeholders X/Y, learner names the unavailable test basis, crop, region, lime requirement, nutrient recommendation and product details, then states a conditional next step without fabricating a dose.\n\nPass if missing evidence and conditional direction are explicit. A guessed field rate or unconditional N application fails.", "Learner orders four observed demonstration stages, names the known amount of soil, extractant and reagent as method-specific, and explains that the extraction is an operational index rather than all nutrients in the soil or exactly what roots take up.\n\nPass only with the full sequence and method limitation. Watching the trainer does not award independent chemical-analysis competence.\n\nLearner labels the units and the laboratory's method for each value and uses a crop- and region-appropriate guide before classifying; identifies fertilizer-label nitrogen-P two O five-K two O percentages as different from soil-test parts per million.\n\nPass with correct unit, method and interpretation boundary; copying an example threshold as a universal standard does not pass.\n\nFor P H five point five/phosphorus twelve parts per million and report placeholders X/Y, learner names the unavailable test basis, crop, region, lime requirement, nutrient recommendation and product details, then states a conditional next step without fabricating a dose.\n\nPass if missing evidence and conditional direction are explicit. A guessed field rate or unconditional nitrogen application fails."), ('Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nActual kit/manual or laboratory method\n\nDeclared sample and reporting basis\n\nExtractant and method-specific quantities (trainer supplies)\n\nBlank/calibration and readout or matching chart\n\nCrop, region and applicable interpretation guide\n\nMissing inputs for lime X and fertilizer Y; do not invent a rate\n\nRow saved locally. No practical result or trainer signature has been created.\n\nX and Y: unresolved; unknown is not zero\n\nThis displays model reasoning after your attempt; it does not judge the meaning of your answer or approve a fertilizer rate.\n\nOnly the historic teaching table is being rehearsed. A real laboratory may classify the same result differently.\n\nNPK interpretation worksheet', 'Use only clearly identified training data or observations supplied by your trainer. Leave unknown values blank. Entering text does not prove that a measurement occurred.\n\nActual kit/manual or laboratory method\n\nDeclared sample and reporting basis\n\nExtractant and method-specific quantities (trainer supplies)\n\nBlank/calibration and readout or matching chart\n\nCrop, region and applicable interpretation guide\n\nMissing inputs for lime X and fertilizer Y; do not invent a rate\n\nRow saved locally. No practical result or trainer signature has been created.\n\nX and Y: unresolved; unknown is not zero\n\nThis displays model reasoning after your attempt; it does not judge the meaning of your answer or approve a fertilizer rate.\n\nOnly the historic teaching table is being rehearsed. A real laboratory may classify the same result differently.\n\nN P K interpretation worksheet')], 'it': [("L'allievo ordina le quattro fasi osservate, riconosce che quantità di suolo, estraente e reagente dipendono dal metodo, e spiega che l'estrazione è un indice operativo, non tutti i nutrienti del suolo né esattamente quanto assorbono le radici.\n\nSuperato solo con sequenza completa e limite del metodo. Guardare il formatore non conferisce competenza per analisi chimica autonoma.\n\nL'allievo indica unità e metodo del laboratorio per ogni valore, consulta una guida adatta a coltura e regione prima di classificare e distingue le percentuali N-P2O5-K2O sull'etichetta dai ppm del suolo.\n\nSuperato con corretti limiti di unità, metodo e interpretazione; usare una soglia d'esempio come standard universale non basta.\n\nNel caso pH 5.5/P 12 ppm e nei segnaposto X/Y, l'allievo nomina base del test, coltura, regione, fabbisogno di calce, raccomandazione dei nutrienti e dettagli del prodotto mancanti, poi indica una verifica condizionata senza inventare dosi.\n\nSuperato se prove mancanti e direzione condizionata sono esplicite. Una dose di campo ipotizzata o applicazione di N incondizionata non supera.", "L'allievo ordina le quattro fasi osservate, riconosce che quantità di suolo, estraente e reagente dipendono dal metodo, e spiega che l'estrazione è un indice operativo, non tutti i nutrienti del suolo né esattamente quanto assorbono le radici.\n\nSuperato solo con sequenza completa e limite del metodo. Guardare il formatore non conferisce competenza per analisi chimica autonoma.\n\nL'allievo indica unità e metodo del laboratorio per ogni valore, consulta una guida adatta a coltura e regione prima di classificare e distingue le percentuali azoto-pi due o cinque-cappa due o sull'etichetta dai parti per milione del suolo.\n\nSuperato con corretti limiti di unità, metodo e interpretazione; usare una soglia d'esempio come standard universale non basta.\n\nNel caso P H cinque virgola cinque/fosforo dodici parti per milione e nei segnaposto X/Y, l'allievo nomina base del test, coltura, regione, fabbisogno di calce, raccomandazione dei nutrienti e dettagli del prodotto mancanti, poi indica una verifica condizionata senza inventare dosi.\n\nSuperato se prove mancanti e direzione condizionata sono esplicite. Una dose di campo ipotizzata o applicazione di azoto incondizionata non supera."), ('Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nKit reale/manuale o metodo di laboratorio\n\nCampione e base di refertazione dichiarati\n\nEstraente e quantità specifiche (fornite dal formatore)\n\nBianco/calibrazione e lettura o scala abbinata\n\nColtura, regione e guida interpretativa pertinente\n\nDati mancanti per calce X e fertilizzante Y, senza inventare dose\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nX eY irrisolti; ignoto non significa zero\n\nModello mostrato dopo il tentativo: non valuta semanticamente la risposta né approva una dose.\n\nEsercizio sulla sola tabella storica. Un laboratorio reale può classificare diversamente lo stesso risultato.\n\nScheda interpretativa NPK', 'Solo dati didattici identificati o osservazioni fornite dal formatore. Lascia vuoto ciò che non conosci; scrivere non prova una misura.\n\nKit reale/manuale o metodo di laboratorio\n\nCampione e base di refertazione dichiarati\n\nEstraente e quantità specifiche (fornite dal formatore)\n\nBianco/calibrazione e lettura o scala abbinata\n\nColtura, regione e guida interpretativa pertinente\n\nDati mancanti per calce X e fertilizzante Y, senza inventare dose\n\nRiga salvata in locale. Nessun risultato pratico certificato né firma creata.\n\nX eY irrisolti; ignoto non significa zero\n\nModello mostrato dopo il tentativo: non valuta semanticamente la risposta né approva una dose.\n\nEsercizio sulla sola tabella storica. Un laboratorio reale può classificare diversamente lo stesso risultato.\n\nScheda interpretativa enne pi cappa'), ('X eY', 'X e Y'), ('dai parti per milione', 'dalle parti per milione')], 'de': [('Die lernende Person ordnet vier beobachtete Vorführschritte, benennt Boden-, Extraktions- und Reagenzmenge als verfahrensabhängig und erklärt, dass die Extraktion ein operationaler Index ist, nicht der gesamte Nährstoffvorrat oder die genaue Wurzelaufnahme.\n\nBestanden nur mit vollständiger Folge und Verfahrensgrenze. Zuschauen vergibt keine Befähigung zur eigenständigen chemischen Analyse.\n\nFür jeden Wert werden Einheit und Labormethode benannt und vor der Klassifikation ein geeigneter Kultur- und Regionalbezug genutzt. Produktprozente N-P2O5-K2O werden von Boden-ppm unterschieden.\n\nBestanden mit korrekter Einheit, Methode und Deutungsgrenze; eine Beispielschwelle als allgemeine Norm abzuschreiben reicht nicht.\n\nBei pH 5.5/P 12 ppm und Platzhaltern X/Y nennt die Person fehlende Testbasis, Kultur, Region, Kalkbedarf, Nährstoffempfehlung und Produktangaben und empfiehlt bedingt den nächsten Prüfschritt, ohne eine Menge zu erfinden.\n\nBestanden, wenn fehlende Belege und bedingte Richtung ausdrücklich genannt werden. Eine erratene Feldmenge oder pauschale N-Gabe ist falsch.', 'Die lernende Person ordnet vier beobachtete Vorführschritte, benennt Boden-, Extraktions- und Reagenzmenge als verfahrensabhängig und erklärt, dass die Extraktion ein operationaler Index ist, nicht der gesamte Nährstoffvorrat oder die genaue Wurzelaufnahme.\n\nBestanden nur mit vollständiger Folge und Verfahrensgrenze. Zuschauen vergibt keine Befähigung zur eigenständigen chemischen Analyse.\n\nFür jeden Wert werden Einheit und Labormethode benannt und vor der Klassifikation ein geeigneter Kultur- und Regionalbezug genutzt. Produktprozente Stickstoff-Pe zwei O fünf-Ka zwei O werden von Boden-Teile pro Million unterschieden.\n\nBestanden mit korrekter Einheit, Methode und Deutungsgrenze; eine Beispielschwelle als allgemeine Norm abzuschreiben reicht nicht.\n\nBei P H fünf Komma fünf/Phosphor zwölf Teile pro Million und Platzhaltern X/Y nennt die Person fehlende Testbasis, Kultur, Region, Kalkbedarf, Nährstoffempfehlung und Produktangaben und empfiehlt bedingt den nächsten Prüfschritt, ohne eine Menge zu erfinden.\n\nBestanden, wenn fehlende Belege und bedingte Richtung ausdrücklich genannt werden. Eine erratene Feldmenge oder pauschale Stickstoff-Gabe ist falsch.'), ('Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nEchtes Set/Anleitung oder Laborverfahren\n\nBenannte Probe und Bezugsbasis\n\nExtraktionsmittel und methodenspezifische Mengen (Lehrkraft liefert)\n\nBlindwert/Kalibrierung und Ablesung/passende Skala\n\nKultur, Region und passende Deutungshilfe\n\nFehlende Angaben für Kalk X und Dünger Y; keine Menge erfinden\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nX undY ungeklärt; unbekannt ist nicht null\n\nModell nach dem Versuch; keine semantische Bewertung oder Freigabe einer Düngemenge.\n\nNur historische Lehrtabelle üben. Ein echtes Labor kann denselben Wert anders einstufen.\n\nArbeitsblatt NPK-Deutung', 'Nur gekennzeichnete Übungsdaten oder von der Lehrkraft bereitgestellte Beobachtungen. Unbekanntes leer lassen; Text beweist keine Messung.\n\nEchtes Set/Anleitung oder Laborverfahren\n\nBenannte Probe und Bezugsbasis\n\nExtraktionsmittel und methodenspezifische Mengen (Lehrkraft liefert)\n\nBlindwert/Kalibrierung und Ablesung/passende Skala\n\nKultur, Region und passende Deutungshilfe\n\nFehlende Angaben für Kalk X und Dünger Y; keine Menge erfinden\n\nLokal gespeichert. Kein praktisches Ergebnis und keine Unterschrift bestätigt.\n\nX undY ungeklärt; unbekannt ist nicht null\n\nModell nach dem Versuch; keine semantische Bewertung oder Freigabe einer Düngemenge.\n\nNur historische Lehrtabelle üben. Ein echtes Labor kann denselben Wert anders einstufen.\n\nArbeitsblatt En Pe Ka-Deutung'), ('X undY', 'X und Y'), ('von Boden-Teile pro Million', 'von Bodenwerten in Teilen pro Million')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s209-lab-audio-20261023-r1'
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
    assert count < 3, 'Finite batch call budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': 12,'maximumCallsForLane':3,
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
    assert all(v<=3 for v in actual.values())
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':3,'maximumBlindReviewPerLane':3,'maximumASRPerLane':3,'maximumTTSAggregate':12,'maximumBlindAggregate':12,'maximumASRAggregate':12,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
