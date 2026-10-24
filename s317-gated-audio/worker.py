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
IDS = ('S3-17-ar-EG-E01-r1', 'S3-17-ar-EG-E02-r1', 'S3-17-ar-EG-E03-r1', 'S3-17-en-E01-r1', 'S3-17-en-E02-r1', 'S3-17-en-E03-r1', 'S3-17-it-E01-r1', 'S3-17-it-E02-r1', 'S3-17-it-E03-r1', 'S3-17-de-E01-r1', 'S3-17-de-E02-r1', 'S3-17-de-E03-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==12
    assert type(req['fixedLocaleLanes']) is dict and req['fixedLocaleLanes']=={'ar-EG': ['S3-17-ar-EG-E01-r1', 'S3-17-ar-EG-E02-r1', 'S3-17-ar-EG-E03-r1'], 'en': ['S3-17-en-E01-r1', 'S3-17-en-E02-r1', 'S3-17-en-E03-r1'], 'it': ['S3-17-it-E01-r1', 'S3-17-it-E02-r1', 'S3-17-it-E03-r1'], 'de': ['S3-17-de-E01-r1', 'S3-17-de-E02-r1', 'S3-17-de-E03-r1']},'Exact locale-to-ordered-UID lane map required before any provider operation'
    assert(req['scope'],req['stepId'])==('S317_12_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-17')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_3_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(12,12,12,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s317-gated-audio-20261024-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==12
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['allTwelveCompleteIdentitiesWithoutReusableAcceptedRecording']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==tuple(l for l in ['ar-EG','en','it','de']for _ in range(3))
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['E01', 'E02', 'E03']
        voice='Charon'if group in ['E01','E03']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/examples/')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('الإعادة ممكن تحتاج تدريبًا كمان\n\nالعينة تحضرت صح لكن جهاز pH اتعاير غلط فالقراءة غير موثوقة.\n\nالمدرّب يسجل التحضير الملاحظ في معياره ويحدد المعايرة معيارًا غير محقق.\n\nالطالب يراجع دليل الجهاز ويعمل معايرة وقياسًا جديدين أمام المدرّب.\n\nالمدرّب يسجل ما شافه فعلًا، حتى لو الإعادة لسه غير مثبتة.\n\nمحاولة جديدة تنتج دليلًا جديدًا، مش نجاحًا تلقائيًا.', 'المحاولة التانية ممكن تحتاج تدريب كمان\n\nالعينة اتجهّزت صح، بس جهاز بي إتش اتعاير غلط، فالقراءة مش موثوقة.\n\nالمدرّب يسجّل التحضير اللي شافه في المعيار الخاص بيه، ويحدّد إن معيار المعايرة لسه ما اتحققش.\n\nالطالب يراجع دليل الجهاز، ويعمل معايرة وقياس جديدين قدّام المدرّب.\n\nالمدرّب يسجل اللي شافه فعلًا، حتى لو المحاولة الجديدة لسه ما أثبتتش المهارة.\n\nمحاولة جديدة بتطلع دليل جديد، مش نجاح تلقائي.'), ('النموذج المعطى: C، \u200fpH ٦٫٨، لومي\n\nنموذج الأصل التعليمي بيقول ٦٫٨ ولومي ويقترح طماطم وذرة.\n\nسمّهم «نموذج معطى» مش قياسات الطالب.\n\nوضح معنى pH القريب من المحايد والقوام واذكر ما لم يُقَس من شروط المحاصيل.\n\nالكمبوست السنوي ومتابعة pH كل ١–٢ سنة أمثلة تتراجع حسب الموقع، مش تعليمات واجبة.\n\nالنموذج يساعد كتابة التقرير لكنه لا يثبت كل أحوال التربة.', 'النموذج المعطى: القطعة سي، بي إتش ستة فاصلة تمانية، وقوام لومي\n\nنموذج الأصل التعليمي بيقول ستة فاصلة تمانية وقوام لومي، وبيقترح طماطم وذرة.\n\nسمّي القيم دي نموذج معطى، مش قياسات الطالب.\n\nوضّح معنى بي إتش القريب من المتعادل والقوام، واذكر شروط المحاصيل اللي لسه ما اتقاستش.\n\nالكمبوست كل سنة، ومتابعة بي إتش كل مدة من سنة لسنتين، دول أمثلة لازم تتراجع حسب الموقع، مش تعليمات واجبة.\n\nالنموذج بيساعد في كتابة التقرير، لكنه ما يثبتش كل أحوال التربة.'), ('حالة منفصلة: ٥٫٨ ولومي رملي\n\nحالة مختلفة فيها pH ٥٫٨، وتربة لوم رملي، وملمس خشن، وشريط طوله حوالي نصف بوصة.\n\nاذكر مرجع تصنيف الحموضة بدل صفة عامة.\n\nالبطاطس والفراولة مرشحان، والذرة حسب بقية شروط الموقع.\n\nمثال المصدر لرفع pH من ٥٫٨ إلى ٦٫٥ بيسمّي الذرة والبرسيم الحجازي في تبرير هدف الجير. راجع هدف المحصول الفعلي، وتحليل مناسب للاحتياج للجير، ومعلومات المادة والموقع قبل تحويل المثال أو الحجر الجيري الزراعي أو خطة الكمبوست لتوصية حقلية؛ pH لوحده ما يحددش جرعة.\n\nالأمثلة وقياس الطالب الحقيقي في سجلات مختلفة.', 'حالة منفصلة: خمسة فاصلة تمانية وقوام لومي رملي\n\nدي حالة تانية، فيها بي إتش خمسة فاصلة تمانية، وتربة لوم رملي، وملمس خشن، وشريط طوله حوالي نص بوصة.\n\nاذكر مرجع تصنيف الحموضة، بدل ما تكتفي بصفة عامة.\n\nالبطاطس والفراولة ترشيحين، والذرة حسب باقي شروط الموقع.\n\nمثال المصدر اللي بيرفع بي إتش من خمسة فاصلة تمانية لستة فاصلة خمسة، بيسمّي الذرة والبرسيم الحجازي وهو بيبرر هدف الجير. راجع هدف المحصول الحقيقي، وتحليل مناسب للاحتياج للجير، ومعلومات المادة والمكان، قبل ما تحوّل المثال، أو الحجر الجيري الزراعي، أو خطة الكمبوست، لتوصية في الحقل. بي إتش لوحده ما يحددش جرعة.\n\nالأمثلة وقياس الطالب الحقيقي، كل واحد في سجل مختلف.')], 'en': [("A retry can still need more practice\n\nThe sample was prepared well, but the pH meter was calibrated incorrectly and its reading is unreliable.\n\nThe trainer credits observed preparation only under its own criterion and identifies calibration as the unmet one.\n\nThe learner studies the actual meter procedure and demonstrates a fresh calibration and measurement.\n\nThe trainer records what was actually seen, including another 'not yet demonstrated' if a required check still fails.\n\nA new attempt creates new evidence, not automatic success.", "A retry can still need more practice\n\nThe sample was prepared well, but the P H meter was calibrated incorrectly and its reading is unreliable.\n\nThe trainer credits observed preparation only under its own criterion and identifies calibration as the unmet one.\n\nThe learner studies the actual meter procedure and demonstrates a fresh calibration and measurement.\n\nThe trainer records what was actually seen, including another 'not yet demonstrated' if a required check still fails.\n\nA new attempt creates new evidence, not automatic success."), ("Separate pH 5.8 sandy-loam case\n\nA different case uses pH 5.8, sandy loam, gritty feel and an approximately 0.5-inch ribbon.\n\nState the acidity classification source instead of relying on a vague adjective.\n\nDiscuss potatoes and strawberries as candidates; corn is conditional on crop/site requirements.\n\nThe source's illustrative pH 5.8→6.5 lime-target rationale names corn and alfalfa. Check the actual crop target, an appropriate lime-requirement test and material/site information before turning that example, agricultural limestone or a compost plan into a field recommendation; no dose is established by pH alone.\n\nDifferent source examples and the learner's real Plot C belong in separate report records.", "Separate P H five point eight sandy-loam case\n\nA different case uses P H five point eight, sandy loam, gritty feel and an approximately half-inch ribbon.\n\nState the acidity classification source instead of relying on a vague adjective.\n\nDiscuss potatoes and strawberries as candidates; corn is conditional on crop and site requirements.\n\nThe source's illustrative P H from five point eight to six point five lime-target rationale names corn and alfalfa. Check the actual crop target, an appropriate lime-requirement test and material and site information before turning that example, agricultural limestone or a compost plan into a field recommendation; no dose is established by P H alone.\n\nDifferent source examples and the learner's real Plot C belong in separate report records."), ("Supplied model: Plot C pH 6.8, loam\n\nThe source's teaching model reports pH 6.8 and loam, then names tomatoes and corn.\n\nKeep pH and texture labelled supplied model rather than personal measurements.\n\nExplain what near-neutral pH and loam texture tend to suggest, and list the unmeasured site/crop constraints.\n\nTreat annual compost and pH monitoring every 1–2 years as examples to check, not compulsory prescriptions.\n\nA model supports report writing; it cannot certify all soil conditions.", "Supplied model: Plot C P H six point eight, loam\n\nThe source's teaching model reports P H six point eight and loam, then names tomatoes and corn.\n\nKeep P H and texture labelled supplied model rather than personal measurements.\n\nExplain what near-neutral P H and loam texture tend to suggest, and list the unmeasured site and crop constraints.\n\nTreat annual compost and P H monitoring every one to two years as examples to check, not compulsory prescriptions.\n\nA model supports report writing; it cannot certify all soil conditions.")], 'it': [('Anche un ritentativo può restare carente\n\nCampione preparato bene, ma pHmetro calibrato male e valore inaffidabile.\n\nFormatore riconosce preparazione solo nel suo criterio e nomina la calibrazione mancante.\n\nAllievo studia istruzioni reali e ripete calibrazione/misura osservata.\n\nIl formatore registra ciò che vede, anche un altro non ancora dimostrato.\n\nNuova prova non equivale a promozione automatica.', 'Anche un ritentativo può restare carente\n\nCampione preparato bene, ma pi accametro calibrato male e valore inaffidabile.\n\nFormatore riconosce preparazione solo nel suo criterio e nomina la calibrazione mancante.\n\nAllievo studia istruzioni reali e ripete calibrazione e misura osservata.\n\nIl formatore registra ciò che vede, anche un altro non ancora dimostrato.\n\nNuova prova non equivale a promozione automatica.'), ("Caso separato: pH 5.8/franco sabbioso\n\nUn caso diverso riporta pH 5,8, tessitura franco-sabbiosa, sensazione granulosa e un nastro lungo circa mezzo pollice.\n\nIndicare la fonte della classificazione di acidità.\n\nPatate e fragole candidati; mais condizionato al sito.\n\nLa motivazione esemplificativa della fonte per pH 5,8→6,5 cita mais ed erba medica. Verifica obiettivo colturale effettivo, test appropriato del fabbisogno di correzione calcarea e informazioni su materiale/sito prima di trasformare quell'esempio, il calcare agricolo o un piano di compost in una raccomandazione di campo; il solo pH non stabilisce una dose.\n\nEsempi e vera misura C appartengono a registri separati.", "Caso separato: pi acca cinque virgola otto e tessitura franco-sabbiosa\n\nUn caso diverso riporta pi acca cinque virgola otto, tessitura franco-sabbiosa, sensazione granulosa e un nastro lungo circa mezzo pollice.\n\nIndicare la fonte della classificazione di acidità.\n\nPatate e fragole candidati; mais condizionato al sito.\n\nLa motivazione esemplificativa della fonte per pi acca da cinque virgola otto a sei virgola cinque cita mais ed erba medica. Verifica obiettivo colturale effettivo, test appropriato del fabbisogno di correzione calcarea e informazioni su materiale e sito prima di trasformare quell'esempio, il calcare agricolo o un piano di compost in una raccomandazione di campo; il solo pi acca non stabilisce una dose.\n\nEsempi e vera misura C appartengono a registri separati."), ('Modello fornito: C, pH 6.8, franco\n\nLa fonte dà un modello pH 6.8/franco e propone pomodori e mais.\n\nEtichettare pH e tessitura come modello, non misure personali.\n\nSpiegare pH quasi neutro/franco e condizioni sito/coltura non misurate.\n\nCompost annuale e pH ogni 1–2 anni sono esempi da verificare, non prescrizioni fisse.\n\nIl modello aiuta la scrittura, non certifica tutte le condizioni.', 'Modello fornito: C, pi acca sei virgola otto, franco\n\nLa fonte dà un modello con pi acca sei virgola otto e tessitura franca e propone pomodori e mais.\n\nEtichettare pi acca e tessitura come modello, non misure personali.\n\nSpiegare pi acca quasi neutro e tessitura franca e condizioni sito e coltura non misurate.\n\nCompost annuale e pi acca ogni uno o due anni sono esempi da verificare, non prescrizioni fisse.\n\nIl modello aiuta la scrittura, non certifica tutte le condizioni.')], 'de': [('Getrennter Fall pH 5.8/sandiger Lehm\n\nEin anderes Beispiel hat pH 5,8, sandigen Lehm, körniges Gefühl und ein Band von ungefähr einem halben Zoll Länge.\n\nQuelle der Säureklassifikation nennen statt unbestimmtes Adjektiv.\n\nKartoffeln/Erdbeeren Kandidaten, Mais abhängig vom Standort.\n\nDie beispielhafte Begründung der Quelle für pH 5,8→6,5 nennt Mais und Luzerne. Tatsächliches Kulturziel, geeigneten Kalkbedarfstest und Material-/Standortangaben prüfen, bevor das Beispiel, landwirtschaftlicher Kalkstein oder ein Kompostplan zur Feldempfehlung wird; pH allein legt keine Dosis fest.\n\nAndere Beispiele und echte C-Messung gehören in getrennte Belege.', 'Getrennter Fall mit Pe Ha fünf Komma acht und sandigem Lehm\n\nEin anderes Beispiel hat Pe Ha fünf Komma acht, sandigen Lehm, körniges Gefühl und ein Band von ungefähr einem halben Zoll Länge.\n\nQuelle der Säureklassifikation nennen statt unbestimmtes Adjektiv.\n\nKartoffeln und Erdbeeren Kandidaten, Mais abhängig vom Standort.\n\nDie beispielhafte Begründung der Quelle für Pe Ha von fünf Komma acht auf sechs Komma fünf nennt Mais und Luzerne. Tatsächliches Kulturziel, geeigneten Kalkbedarfstest und Material- und Standortangaben prüfen, bevor das Beispiel, landwirtschaftlicher Kalkstein oder ein Kompostplan zur Feldempfehlung wird; Pe Ha allein legt keine Dosis fest.\n\nAndere Beispiele und echte C-Messung gehören in getrennte Belege.'), ('Vorgegebenes Modell: C, pH 6.8, lehmig\n\nDie Quelle gibt Modell pH 6.8 und lehmigen Boden, nennt Tomaten und Mais.\n\nWerte als vorgegebenes Modell markieren, nicht als eigene Messung.\n\nNahezu neutralen pH/Lehm und ungemessene Standort-/Kulturbedingungen erklären.\n\nJährlicher Kompost und pH alle 1–2 Jahre sind zu prüfende Beispiele, keine Pflicht.\n\nModell hilft Bericht, bescheinigt aber keinen umfassenden Bodenzustand.', 'Vorgegebenes Modell: C, Pe Ha sechs Komma acht, lehmig\n\nDie Quelle gibt Modell Pe Ha sechs Komma acht und lehmigen Boden, nennt Tomaten und Mais.\n\nWerte als vorgegebenes Modell markieren, nicht als eigene Messung.\n\nNahezu neutralen Pe Ha und Lehm und ungemessene Standort- und Kulturbedingungen erklären.\n\nJährlicher Kompost und Pe Ha alle ein bis zwei Jahre sind zu prüfende Beispiele, keine Pflicht.\n\nModell hilft Bericht, bescheinigt aber keinen umfassenden Bodenzustand.'), ('Wiederholung kann noch Übung brauchen\n\nProbe gut vorbereitet, aber pH-Gerät falsch kalibriert, Messung unzuverlässig.\n\nTrainer würdigt Vorbereitung nur unter ihrem Kriterium und benennt fehlende Kalibrierung.\n\nPerson studiert echte Geräteanleitung und wiederholt Kalibrierung/Messung unter Beobachtung.\n\nTrainer notiert Wirkliches, auch erneut „noch nicht nachgewiesen“.\n\nNeuer Versuch schafft neuen Beleg, keinen automatischen Erfolg.', 'Wiederholung kann noch Übung brauchen\n\nProbe gut vorbereitet, aber Pe Ha-Gerät falsch kalibriert, Messung unzuverlässig.\n\nTrainer würdigt Vorbereitung nur unter ihrem Kriterium und benennt fehlende Kalibrierung.\n\nPerson studiert echte Geräteanleitung und wiederholt Kalibrierung und Messung unter Beobachtung.\n\nTrainer notiert Wirkliches, auch erneut „noch nicht nachgewiesen“.\n\nNeuer Versuch schafft neuen Beleg, keinen automatischen Erfolg.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s317-gated-audio-20261024-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_FOUR_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':3,'maximumBlindReviewPerLane':3,'maximumASRPerLane':3,'maximumTTSAggregate':12,'maximumBlindAggregate':12,'maximumASRAggregate':12,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
