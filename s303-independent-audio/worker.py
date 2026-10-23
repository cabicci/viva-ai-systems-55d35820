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
IDS = ('S3-03-ar-EG-opening-r1', 'S3-03-ar-EG-guided-practice-r1', 'S3-03-ar-EG-reflection-r1', 'S3-03-ar-EG-glossary-r1', 'S3-03-en-opening-r1', 'S3-03-en-guided-practice-r1', 'S3-03-en-reflection-r1', 'S3-03-en-glossary-r1', 'S3-03-it-opening-r1', 'S3-03-it-guided-practice-r1', 'S3-03-it-reflection-r1', 'S3-03-it-glossary-r1', 'S3-03-de-opening-r1', 'S3-03-de-guided-practice-r1', 'S3-03-de-reflection-r1', 'S3-03-de-glossary-r1')
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
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==16
    assert(req['scope'],req['stepId'])==('S303_SIXTEEN_INDEPENDENT_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-03')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s303-independent-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['opening','guided-practice','reflection','glossary']
        voice='Charon'if group in ['opening','reflection']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'en': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'it': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}, 'de': {'opening': ['/intro', '/goals/0', '/goals/1', '/goals/2'], 'guided-practice': ['/guidedPractice/prompt', '/guidedPractice/learnerActions/1', '/guidedPractice/learnerActions/2', '/guidedPractice/learnerActions/3', '/guidedPractice/feedback', '/guidedPractice/practicalBoundary'], 'reflection': ['/selfReflection/question', '/selfReflection/note'], 'glossary': ['/glossary/0/0', '/glossary/0/1', '/glossary/1/0', '/glossary/1/1', '/glossary/2/0', '/glossary/2/1', '/glossary/3/0', '/glossary/3/1', '/glossary/4/0', '/glossary/4/1', '/glossary/5/0', '/glossary/5/1']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert not any(b['pointer'].startswith('/examples')or b['pointer'].startswith('/portfolio')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('رتّب الذرة وفول الصويا والقمح تحت السنين ١ و٢ و٣. ارسم سهمين للأمام 1→2 و2→3، وسهم رجوع 3→1؛ يعني تلات وصلات موجهة في المجموع. برّر كل انتقال.\n\nلكل فائدة: العناصر والآفات والجذور أو الغطاء، اكتب آلية محتملة ومثال محصول وشرط ممكن يحدّ منها.\n\nباستخدام حالة العشرة هكتارات المعتدلة كما هي وقائمة الثمانية مرشحين السابقة، كمّل جدول المحصول والسبب لتلات سنين. قارن بالنموذج وخطة زميل، ثم عدّل تبريرك أنت.\n\nممكن تضيف سنة رابعة بمحصول غطاء أو غيره. حدد الموسم والمدة وطريقة الإنهاء أو الحصاد وأثر السوق والمعدات واحتياج المياه.\n\nقارن كل سهم برقم السنة المطبوع؛ عكس الاتجاه أو وعد نيتروجين مضمون يرجع للتعديل.\n\nالمدرّب ييسّر جزء التخطيط لمدة 15 دقيقة وجزء النقاش لمدة 10 دقايق من حالة الـ45 دقيقة. كل طالب يسلّم خطة فردية وتعديل مبرر. الخطوة المعرفية دي ما بتعتمدش مهارة عملية في الحقل.', 'رتّب الذرة وفول الصويا والقمح تحت السنين واحد واتنين وتلاتة. ارسم سهمين للأمام من السنة الأولى للسنة التانية ومن السنة التانية للسنة التالتة، وسهم رجوع من السنة التالتة للسنة الأولى؛ يعني تلات وصلات موجهة في المجموع. برّر كل انتقال.\n\nلكل فائدة: العناصر والآفات والجذور أو الغطاء، اكتب آلية محتملة ومثال محصول وشرط ممكن يحدّ منها.\n\nباستخدام حالة العشرة هكتارات المعتدلة كما هي وقائمة الثمانية مرشحين السابقة، كمّل جدول المحصول والسبب لتلات سنين. قارن بالنموذج وخطة زميل، ثم عدّل تبريرك أنت.\n\nممكن تضيف سنة رابعة بمحصول غطاء أو غيره. حدد الموسم والمدة وطريقة الإنهاء أو الحصاد وأثر السوق والمعدات واحتياج المياه.\n\nقارن كل سهم برقم السنة المطبوع؛ عكس الاتجاه أو وعد نيتروجين مضمون يرجع للتعديل.\n\nالمدرّب ييسّر جزء التخطيط لمدة خمستاشر دقيقة وجزء النقاش لمدة عشرة دقايق من حالة الخمسة وأربعين دقيقة. كل طالب يسلّم خطة فردية وتعديل مبرر. الخطوة المعرفية دي ما بتعتمدش مهارة عملية في الحقل.')], 'en': [('Arrange maize, soybean and wheat under Years 1, 2 and 3. Draw two forward arrows, 1→2 and 2→3, and one return arrow, 3→1: three directed links in total. Justify every transition.\n\nFor nutrient, pest and soil-cover/root benefits, write one plausible mechanism, one crop example and one condition that could limit it.\n\nUsing the exact 10-ha temperate case and your prior eight-crop shortlist, complete a three-year crop/reason table. Compare it with the model and one peer plan, then revise your own justification.\n\nOptionally extend to Year 4 using a cover crop or another crop. State its season, duration, termination or harvest, market/equipment implications and water need.\n\nCompare every arrow with the printed year number; reversed direction or a guaranteed nitrogen claim triggers revision.\n\nThe trainer facilitates the 15-minute planning and 10-minute discussion portions of the 45-minute case. Each learner submits an individual plan and reasoned revision. This knowledge step does not certify a physical field skill.', 'Arrange maize, soybean and wheat under Years one, two and three. Draw two forward arrows, from year one to year two and from year two to year three, and one return arrow, from year three to year one: three directed links in total. Justify every transition.\n\nFor nutrient, pest and soil-cover, root benefits, write one plausible mechanism, one crop example and one condition that could limit it.\n\nUsing the exact ten-hectare temperate case and your prior eight-crop shortlist, complete a three-year crop, reason table. Compare it with the model and one peer plan, then revise your own justification.\n\nOptionally extend to Year four using a cover crop or another crop. State its season, duration, termination or harvest, market, equipment implications and water need.\n\nCompare every arrow with the printed year number; reversed direction or a guaranteed nitrogen claim triggers revision.\n\nThe trainer facilitates the fifteen-minute planning and ten-minute discussion portions of the forty-five-minute case. Each learner submits an individual plan and reasoned revision. This knowledge step does not certify a physical field skill.'), ('crop rotation\n\nA planned sequence of crops on the same area of land across seasons or years.\n\nhost crop\n\nA crop on which a particular pest can survive or reproduce; host status is pest-specific.\n\nnitrogen credit\n\nAn evidence-based estimate of nitrogen supplied to a later crop by a prior crop or its residues, not a guaranteed amount from a crop name.\n\ncrop residue\n\nPlant material remaining after harvest, whose return or removal changes soil cover and nutrient/carbon flows.\n\ncover crop\n\nA crop grown mainly to cover and manage soil; its benefit depends on species, season and management.\n\nmonocropping\n\nRepeated production of the same crop on the same field over successive seasons or years.', 'crop rotation\n\nA planned sequence of crops on the same area of land across seasons or years.\n\nhost crop\n\nA crop on which a particular pest can survive or reproduce; host status is pest-specific.\n\nnitrogen credit\n\nAn evidence-based estimate of nitrogen supplied to a later crop by a prior crop or its residues, not a guaranteed amount from a crop name.\n\ncrop residue\n\nPlant material remaining after harvest, whose return or removal changes soil cover and nutrient, carbon flows.\n\ncover crop\n\nA crop grown mainly to cover and manage soil; its benefit depends on species, season and management.\n\nmonocropping\n\nRepeated production of the same crop on the same field over successive seasons or years.')], 'it': [("Disporre mais, soia e frumento negli anni 1, 2 e 3. Disegnare due frecce in avanti, 1→2 e 2→3, e una di ritorno, 3→1: tre collegamenti diretti in totale. Motivare ogni passaggio.\n\nPer nutrienti, parassiti e radici/copertura scrivere un meccanismo plausibile, un esempio colturale e una condizione che potrebbe limitarlo.\n\nUsando il caso temperato esatto di 10 ha e la rosa precedente di otto colture, completare tabella triennale con coltura e ragione. Confrontarla con modello e pari, poi rivedere la propria motivazione.\n\nFacoltativamente aggiungere anno 4 con copertura o altra coltura. Indicare stagione, durata, terminazione o raccolta, mercato, attrezzature e acqua.\n\nConfrontare ogni freccia con l’anno stampato; direzione invertita o N garantito richiedono correzione.\n\nIl formatore guida i 15 minuti di progettazione e i 10 minuti di discussione previsti nel caso di 45 minuti. Ogni allievo consegna un piano individuale e una revisione motivata. Questa tappa di conoscenza non certifica un'abilità fisica in campo.", "Disporre mais, soia e frumento negli anni uno, due e tre. Disegnare due frecce in avanti, dall’anno uno all’anno due e dall’anno due all’anno tre, e una di ritorno, dall’anno tre all’anno uno: tre collegamenti diretti in totale. Motivare ogni passaggio.\n\nPer nutrienti, parassiti e radici, copertura scrivere un meccanismo plausibile, un esempio colturale e una condizione che potrebbe limitarlo.\n\nUsando il caso temperato esatto di dieci ettari e la rosa precedente di otto colture, completare tabella triennale con coltura e ragione. Confrontarla con modello e pari, poi rivedere la propria motivazione.\n\nFacoltativamente aggiungere anno quattro con copertura o altra coltura. Indicare stagione, durata, terminazione o raccolta, mercato, attrezzature e acqua.\n\nConfrontare ogni freccia con l’anno stampato; direzione invertita o azoto garantito richiedono correzione.\n\nIl formatore guida i quindici minuti di progettazione e i dieci minuti di discussione previsti nel caso di quarantacinque minuti. Ogni allievo consegna un piano individuale e una revisione motivata. Questa tappa di conoscenza non certifica un'abilità fisica in campo."), ('Una rotazione è una sequenza programmata di colture diverse sullo stesso terreno. Daremo una ragione a ogni anno e correggeremo le frecce del disegno originale, poi completeremo con prudenza il caso dei 10 ettari: senza promettere cure garantite né trasformare il suo clima temperato in quello egiziano.\n\nDisegnare una sequenza triennale con frecce coerenti con gli anni numerati e giustificare ogni anno per nutrienti, ospiti dei parassiti, radici e residui, non soltanto per i nomi delle colture.\n\nSpiegare almeno tre possibili vantaggi della rotazione con esempi e limiti, compreso perché né il controllo universale della diabrotica del mais né il pieno rimborso dell’azoto sono garantiti.\n\nDifendere un piano alternativo o quadriennale usando prove su sito e colture, durata di occupazione, mercato, attrezzature e acqua; ammettere una valida alternativa al modello.', 'Una rotazione è una sequenza programmata di colture diverse sullo stesso terreno. Daremo una ragione a ogni anno e correggeremo le frecce del disegno originale, poi completeremo con prudenza il caso dei dieci ettari: senza promettere cure garantite né trasformare il suo clima temperato in quello egiziano.\n\nDisegnare una sequenza triennale con frecce coerenti con gli anni numerati e giustificare ogni anno per nutrienti, ospiti dei parassiti, radici e residui, non soltanto per i nomi delle colture.\n\nSpiegare almeno tre possibili vantaggi della rotazione con esempi e limiti, compreso perché né il controllo universale della diabrotica del mais né il pieno rimborso dell’azoto sono garantiti.\n\nDifendere un piano alternativo o quadriennale usando prove su sito e colture, durata di occupazione, mercato, attrezzature e acqua; ammettere una valida alternativa al modello.')], 'de': [('Fruchtfolge\n\nGeplante Abfolge unterschiedlicher Kulturen auf derselben Fläche über Saisons oder Jahre.\n\nWirtspflanze\n\nKultur, auf der ein bestimmter Schädling überlebt oder sich vermehrt; Wirtsein hängt von der Art ab.\n\nStickstoffgutschrift\n\nAus Belegen geschätzter N-Beitrag einer vorherigen Kultur oder ihrer Rückstände für die folgende; keine garantierte Menge aus dem Namen.\n\nErnterückstände\n\nPflanzenmaterial nach Ernte; Rückgabe oder Abfuhr beeinflussen Bodenbedeckung und Nährstoff-/Kohlenstofffluss.\n\nDeckfrucht\n\nKultur vor allem zur Bodenbedeckung und -pflege; Nutzen hängt von Art, Saison und Bewirtschaftung ab.\n\nwiederholter Einzelanbau\n\nDieselbe Kultur wird in aufeinanderfolgenden Saisons oder Jahren auf demselben Feld angebaut.', 'Fruchtfolge\n\nGeplante Abfolge unterschiedlicher Kulturen auf derselben Fläche über Saisons oder Jahre.\n\nWirtspflanze\n\nKultur, auf der ein bestimmter Schädling überlebt oder sich vermehrt; Wirtsein hängt von der Art ab.\n\nStickstoffgutschrift\n\nAus Belegen geschätzter Stickstoff-Beitrag einer vorherigen Kultur oder ihrer Rückstände für die folgende; keine garantierte Menge aus dem Namen.\n\nErnterückstände\n\nPflanzenmaterial nach Ernte; Rückgabe oder Abfuhr beeinflussen Bodenbedeckung und Nährstoff-, Kohlenstofffluss.\n\nDeckfrucht\n\nKultur vor allem zur Bodenbedeckung und -pflege; Nutzen hängt von Art, Saison und Bewirtschaftung ab.\n\nwiederholter Einzelanbau\n\nDieselbe Kultur wird in aufeinanderfolgenden Saisons oder Jahren auf demselben Feld angebaut.'), ('Fruchtfolge ist eine geplante Abfolge verschiedener Kulturen auf demselben Feld. Wir begründen jedes Jahr und korrigieren die Pfeile der ursprünglichen Abbildung. Danach vervollständigen wir den 10-Hektar-Lehrfall unter Vorbehalt: ohne Heilversprechen und ohne sein gemäßigtes Klima als ägyptische Beobachtung auszugeben.\n\nEine dreijährige Kulturfolge mit Pfeilen zeichnen, die den Jahresnummern entsprechen, und jedes Jahr mit Nährstoffen, Wirtsbeziehungen von Schädlingen, Wurzeln und Rückständen statt bloßen Namen begründen.\n\nMindestens drei mögliche Vorteile einer Fruchtfolge mit Beispielen und Grenzen erklären; weder vollständige Bekämpfung aller Maiswurzelbohrer noch völliger Stickstoffersatz sind garantiert.\n\nEinen anderen oder vierjährigen Plan mit Standort- und Kulturbelegen, Flächenbelegungsdauer, Markt, Geräten und Wasser verteidigen und begründete Alternativen zum Modell zulassen.', 'Fruchtfolge ist eine geplante Abfolge verschiedener Kulturen auf demselben Feld. Wir begründen jedes Jahr und korrigieren die Pfeile der ursprünglichen Abbildung. Danach vervollständigen wir den zehn-Hektar-Lehrfall unter Vorbehalt: ohne Heilversprechen und ohne sein gemäßigtes Klima als ägyptische Beobachtung auszugeben.\n\nEine dreijährige Kulturfolge mit Pfeilen zeichnen, die den Jahresnummern entsprechen, und jedes Jahr mit Nährstoffen, Wirtsbeziehungen von Schädlingen, Wurzeln und Rückständen statt bloßen Namen begründen.\n\nMindestens drei mögliche Vorteile einer Fruchtfolge mit Beispielen und Grenzen erklären; weder vollständige Bekämpfung aller Maiswurzelbohrer noch völliger Stickstoffersatz sind garantiert.\n\nEinen anderen oder vierjährigen Plan mit Standort- und Kulturbelegen, Flächenbelegungsdauer, Markt, Geräten und Wasser verteidigen und begründete Alternativen zum Modell zulassen.'), ('Mais, Soja und Weizen den Jahren 1, 2 und 3 zuordnen. Zwei Vorwärtspfeile 1→2 und 2→3 sowie einen Rückkehrpfeil 3→1 zeichnen: insgesamt drei gerichtete Verbindungen. Jeden Übergang begründen.\n\nFür Nährstoffe, Schädlinge und Wurzeln/Bedeckung jeweils einen möglichen Mechanismus, eine Kultur und eine begrenzende Bedingung nennen.\n\nMit dem genauen gemäßigten 10-ha-Fall und der vorigen Achterliste eine Dreijahrestabelle mit Kulturen und Gründen erstellen. Mit Muster und anderem Plan vergleichen, dann die eigene Begründung überarbeiten.\n\nWahlweise Jahr vier mit Deckfrucht oder anderer Kultur ergänzen. Saison, Dauer, Beendigung/Ernte, Markt/Geräte und Wasser angeben.\n\nJeden Pfeil mit der Nummer vergleichen; umgekehrte Richtung oder garantierter N-Effekt erfordert Verbesserung.\n\nDie Lehrkraft begleitet die 15-minütige Planung und die 10-minütige Diskussion innerhalb des 45-minütigen Falls. Jede lernende Person gibt einen individuellen Plan und eine begründete Überarbeitung ab. Dieser Wissensschritt bescheinigt keine praktische Feldfertigkeit.', 'Mais, Soja und Weizen den Jahren eins, zwei und drei zuordnen. Zwei Vorwärtspfeile von Jahr eins zu Jahr zwei und von Jahr zwei zu Jahr drei sowie einen Rückkehrpfeil von Jahr drei zu Jahr eins zeichnen: insgesamt drei gerichtete Verbindungen. Jeden Übergang begründen.\n\nFür Nährstoffe, Schädlinge und Wurzeln, Bedeckung jeweils einen möglichen Mechanismus, eine Kultur und eine begrenzende Bedingung nennen.\n\nMit dem genauen gemäßigten zehn-Hektar-Fall und der vorigen Achterliste eine Dreijahrestabelle mit Kulturen und Gründen erstellen. Mit Muster und anderem Plan vergleichen, dann die eigene Begründung überarbeiten.\n\nWahlweise Jahr vier mit Deckfrucht oder anderer Kultur ergänzen. Saison, Dauer, Beendigung, Ernte, Markt, Geräte und Wasser angeben.\n\nJeden Pfeil mit der Nummer vergleichen; umgekehrte Richtung oder garantierter Stickstoff-Effekt erfordert Verbesserung.\n\nDie Lehrkraft begleitet die fünfzehn-minütige Planung und die zehn-minütige Diskussion innerhalb des fünfundvierzig-minütigen Falls. Jede lernende Person gibt einen individuellen Plan und eine begründete Überarbeitung ab. Dieser Wissensschritt bescheinigt keine praktische Feldfertigkeit.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s303-independent-audio-20261023-r1'
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
