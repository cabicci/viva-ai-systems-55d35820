"""S106 twentyfour full reading passages, thin diagnostic artifacts in four fixed lanes; no retries or integration. Production commands are GitHub Actions only."""
from __future__ import annotations
import argparse
import imported_audio_support as imported
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
FROZEN = ['.gitignore', 'README.en.txt', 'freeze_package.py', 'offline_check.py', 'owner-authority.json', 'cumulative-attempt-ledger.json', 'cache-live-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/worker-derivation.json', 'request.json', 'runtime.json', 'vendor/course/manifest.json', 'vendor/pipeline-engine.py', 'worker.py', 'provenance/narration-de.json', 'thin_artifacts.py', 'import-plan.json', 'original-request.json', 'original-worker.py', 'imported_audio_support.py', 'inputs/original-de-complete.zip', 'inputs/S3-12-de-R01-r1-audio.zip', 'inputs/S3-12-de-R02-r1-audio.zip', 'inputs/S3-12-de-R03-r1-audio.zip', 'inputs/S3-12-de-R04-r1-audio.zip', 'inputs/S3-12-de-R05-r1-audio.zip', 'inputs/S3-12-de-R06-r1-audio.zip', 'inputs/S3-12-de-R07-r1-audio.zip']
IDS = ('S3-12-de-R01-r1', 'S3-12-de-R02-r1', 'S3-12-de-R03-r1', 'S3-12-de-R04-r1', 'S3-12-de-R05-r1', 'S3-12-de-R06-r1', 'S3-12-de-R07-r1')
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
    assert set(freeze['sha256'])==set(FROZEN) and len(FROZEN)==len(set(FROZEN))==28
    for name,h in freeze['sha256'].items():
        p=(HERE/name).resolve();assert p.is_relative_to(HERE.resolve())and sha(p)==h,'Frozen preimage mismatch'
    assert tuple(u['id']for u in req['units'])==IDS and len(IDS)==7
    assert(req['scope'],req['stepId'])==('S312_SEVEN_EXACT_GERMAN_ORIGINALS_DIAGNOSTICS_ONLY_NO_TTS','S3-12')
    assert req['executionOrder']=='SEVEN_EXACT_ORIGINAL_IMPORTS_THEN_NEW_BOUNDED_DIAGNOSTICS_NO_TTS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(0,7,7,2,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s312-de-recovery-20261023-r1')
    assert req['model']=='gemini-3.8-flash-tts'and runtime['reviewModel']=='gemini-4-argon'
    cfg=runtime['asr'];assert cfg['packageVersion']=='1.2.1'and cfg['modelRevision']=='536b0662742c02347bc0e980a01041f333bce120'
    assert cfg['languageByLocale']=={'ar-EG':'ar','en':'en','it':'it','de':'de'}
    assert runtime['maximumReviewCallsForBatch']==cfg['maximumInvocationsForBatch']==7
    assert req['assemblyPerformed']is False and req['sourceAndAssessmentFilesChanged']is False and req['automaticAdoption']is False
    cache=read(HERE/'cache-live-audit.json');assert cache['boundedImportedAndProvenUncalledRecovery']and cache['newProviderCalls']==0
    assert cache['targetRequestFingerprints']==[u['requestFingerprintSha256']for u in req['units']]
    assert tuple(u['locale']for u in req['units'])==('de',)*7
    for u in req['units']:
        plans=read(HERE/u['sourcePlan']);assert sha(HERE/u['sourcePlan'])==u['sourcePlanSha256'];plan=next(x for x in plans['units']if x['id']==u['id'])
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06','R07']
        assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R07': ('A', 'Charon', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/3/paragraphs/2'], 'R06': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R07': ['/reading/5/paragraphs/0', '/reading/5/paragraphs/1']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'de': [('Der Kunde in der Quelle wünscht ein gut entwässertes, leicht saures und phosphorreiches Substrat. Das sind im Fall genannte Ziele, keine gemessenen Eigenschaften oder ein bestätigter Phosphorbedarf dieses Produkts. Die Abschlusskarte beschreibt einen Kunden mit schwerem Ton und ungefähr 5 kg Topfsubstrat oder Verbesserungsmischung aus bereitgestelltem gesiebtem Kompost, Perlit und Knochenmehl. Sechs Punkte: genehmigte Auswahl, begründete dokumentierte Anteile, gemessene Masse nahe 5 kg, gleichmäßige Mischung, passender sicher verschlossener Sack und klares Etikett „Tomato Potting Mix“ mit echten Zutaten. „Viel“, „mittel“ und „weniger“ in der Vorlage sind keine Zahlen; Rezept, Gewichtstoleranz, Analysen und ob Feldton in den Sack gehört fehlen. Diese Werte liefert nur die dokumentierte Lehrkraftvorgabe.\n\nDie Lehrkraft prüft Zweck, zulässige Zutaten, Anteilsbasis, Feuchtezustand, Toleranz, P-Bedarf und Sack/Etikett. Der Lernende berechnet und wiegt jeden Anteil, mischt gründlich und kontrolliert die Masse. Das Etikett nennt tatsächliche Zutaten und gemessenes Nettogewicht; „leicht sauer“ oder sichere Tomatenleistung sind ohne Messung nicht erlaubt. Produktname und Verwendung müssen gemäß dokumentierter Vorgabe zwischen vollständigem Topfsubstrat und Bodenverbesserungsmittel unterscheiden. Ton-Lehrgefäß und Tomatenprodukt bleiben zwei getrennte Bewertungen.', 'Der Kunde in der Quelle wünscht ein gut entwässertes, leicht saures und phosphorreiches Substrat. Das sind im Fall genannte Ziele, keine gemessenen Eigenschaften oder ein bestätigter Phosphorbedarf dieses Produkts. Die Abschlusskarte beschreibt einen Kunden mit schwerem Ton und ungefähr fünf Kilogramm Topfsubstrat oder Verbesserungsmischung aus bereitgestelltem gesiebtem Kompost, Perlit und Knochenmehl. Sechs Punkte: genehmigte Auswahl, begründete dokumentierte Anteile, gemessene Masse nahe fünf Kilogramm, gleichmäßige Mischung, passender sicher verschlossener Sack und klares Etikett „Tomato Potting Mix“ mit echten Zutaten. „Viel“, „mittel“ und „weniger“ in der Vorlage sind keine Zahlen; Rezept, Gewichtstoleranz, Analysen und ob Feldton in den Sack gehört fehlen. Diese Werte liefert nur die dokumentierte Lehrkraftvorgabe.\n\nDie Lehrkraft prüft Zweck, zulässige Zutaten, Anteilsbasis, Feuchtezustand, Toleranz, Pe-Bedarf und Sack, Etikett. Der Lernende berechnet und wiegt jeden Anteil, mischt gründlich und kontrolliert die Masse. Das Etikett nennt tatsächliche Zutaten und gemessenes Nettogewicht; „leicht sauer“ oder sichere Tomatenleistung sind ohne Messung nicht erlaubt. Produktname und Verwendung müssen gemäß dokumentierter Vorgabe zwischen vollständigem Topfsubstrat und Bodenverbesserungsmittel unterscheiden. Ton-Lehrgefäß und Tomatenprodukt bleiben zwei getrennte Bewertungen.'), ('Die Prozesskarte stellt drei echte unbeschriftete sandige, tonige und lehmige Proben sowie Etiketten, Wasser, Handkelle, Gefäß und Kompost bereit. Jeder Lernende befeuchtet passend, vermerkt Körnigkeit, Glätte, Klebrigkeit sowie Kugel und Band, bestimmt alle drei mit der Lehrkraft und wählt den wirklichen Ton. Zehn ursprüngliche Beobachtungsschritte gehen weiter über Messen des genehmigten Verhältnisses, gleichmäßiges Mischen, Prüfung auf lockeres krümeliges belüftetes Material und Säubern/Rückgabe. Die Lehrkraft notiert Ja/Nein, Beleg und Korrektur je Handlung.\n\nUngefähr ein Teil Kompost zu zwei Teilen Boden bleibt nur das Beispiel der Quelle: Massen-/Volumenbasis, Tonqualität, Kompostsalz, Wasserablauf und Sorte fehlen. Erzeugte Bilder, Proben mit bereits vorgegebener Bodenart oder Arbeit eines Gruppenmitglieds sind kein individueller Nachweis. Scheitert die physikalische Prüfung, halte Fehler und Korrektur fest; allein das Mischen gibt keine Punkte.', 'Die Prozesskarte stellt drei echte unbeschriftete sandige, tonige und lehmige Proben sowie Etiketten, Wasser, Handkelle, Gefäß und Kompost bereit. Jeder Lernende befeuchtet passend, vermerkt Körnigkeit, Glätte, Klebrigkeit sowie Kugel und Band, bestimmt alle drei mit der Lehrkraft und wählt den wirklichen Ton. Zehn ursprüngliche Beobachtungsschritte gehen weiter über Messen des genehmigten Verhältnisses, gleichmäßiges Mischen, Prüfung auf lockeres krümeliges belüftetes Material und Säubern, RücKilogrammabe. Die Lehrkraft notiert Ja, Nein, Beleg und Korrektur je Handlung.\n\nUngefähr ein Teil Kompost zu zwei Teilen Boden bleibt nur das Beispiel der Quelle: Massen-, Volumenbasis, Tonqualität, Kompostsalz, Wasserablauf und Sorte fehlen. Erzeugte Bilder, Proben mit bereits vorgegebener Bodenart oder Arbeit eines Gruppenmitglieds sind kein individueller Nachweis. Scheitert die physikalische Prüfung, halte Fehler und Korrektur fest; allein das Mischen gibt keine Punkte.'), ('Für die erste Praxis nennt die Quelle mineralischen Tonboden und Kompost. Die eigene Abschlusskarte nennt gesiebten Kompost, Perlit für physikalische Eigenschaften und Knochenmehl als mögliche Phosphorquelle für Tomaten. Kompost kann organische Substanz und Nährstoffe bringen, doch Reife, Salz und Inhalt schwanken. Perlit ist leicht und porös, kein P-Dünger. Knochenmehl bringt P nur bei nachgewiesenem Bedarf und analysiertem Produkt; „Tomaten bevorzugen P“ belegt keinen Mangel in diesem Substrat. Andere P-Quelle oder keine Zugabe nur nach genehmigter Vorgabe.\n\nVerlange Qualitätsbericht der Charge, Kulturbedarf, pH und Nährstoffbefunde von Boden/Substrat und sichere Handhabung. Zu viel Kompost oder unnötiger P-Eintrag kann Pflanze und Umwelt schädigen. Drei bereitgestellte Säcke zwingen nicht zur Verwendung aller in frei erfundenen Anteilen.', 'Für die erste Praxis nennt die Quelle mineralischen Tonboden und Kompost. Die eigene Abschlusskarte nennt gesiebten Kompost, Perlit für physikalische Eigenschaften und Knochenmehl als mögliche Phosphorquelle für Tomaten. Kompost kann organische Substanz und Nährstoffe bringen, doch Reife, Salz und Inhalt schwanken. Perlit ist leicht und porös, kein Pe-Dünger. Knochenmehl bringt Pe nur bei nachgewiesenem Bedarf und analysiertem Produkt; „Tomaten bevorzugen Pe“ belegt keinen Mangel in diesem Substrat. Andere Pe-Quelle oder keine Zugabe nur nach genehmigter Vorgabe.\n\nVerlange Qualitätsbericht der Charge, Kulturbedarf, Pe Ha und Nährstoffbefunde von Boden, Substrat und sichere Handhabung. Zu viel Kompost oder unnötiger Pe-Eintrag kann Pflanze und Umwelt schädigen. Drei bereitgestellte Säcke zwingen nicht zur Verwendung aller in frei erfundenen Anteilen.'), ('Lehm bezeichnet einen Bereich mineralischer Sand-, Schluff- und Tonanteile. Ein Sack Kompost und Perlit ist deshalb kein Lehm und dunkle Farbe beweist keine Fruchtbarkeit. Substrat wird im kleinen Volumen für Wurzelhalt, Wasser, Luft und Nährstoffversorgung ausgewählt. Schwerer Tonboden aus dem Feld kann im Gefäß die Belüftung begrenzen; ein Topfsubstrat kann ganz ohne mineralischen Boden auskommen. Die Freiland-Hochbeetvorlage mit 50% vorhandenem Tonboden und 50% Kompost ist keine Tomaten-Topfrezeptur.\n\nDas Freilandmodell für Möhren nennt eine 2–3 Zoll dicke Schicht voluminösen organischen Materials in den oberen 6–8 Zoll und ein 8–12 Zoll hohes Beet. Das sind ungeprüfte Quellenbeispiele, die örtliche Material- und Entwässerungsprüfung brauchen, nicht die Gefäßrezeptur hier. Prüfe Gefäß, Wasserablauf und Qualität. Perlit kann luftgefüllte Poren fördern, aber kein verschlossenes Gefäß ohne sicheren Ablauf retten. „Für Möhren geeignet“ belegt weder pH noch Nährstoffe noch Wurzeltiefe.', 'Lehm bezeichnet einen Bereich mineralischer Sand-, Schluff- und Tonanteile. Ein Sack Kompost und Perlit ist deshalb kein Lehm und dunkle Farbe beweist keine Fruchtbarkeit. Substrat wird im kleinen Volumen für Wurzelhalt, Wasser, Luft und Nährstoffversorgung ausgewählt. Schwerer Tonboden aus dem Feld kann im Gefäß die Belüftung begrenzen; ein Topfsubstrat kann ganz ohne mineralischen Boden auskommen. Die Freiland-Hochbeetvorlage mit fünfzig Prozent vorhandenem Tonboden und fünfzig Prozent Kompost ist keine Tomaten-Topfrezeptur.\n\nDas Freilandmodell für Möhren nennt eine zwei bis drei Zoll dicke Schicht voluminösen organischen Materials in den oberen sechs bis acht Zoll und ein acht bis zwölf Zoll hohes Beet. Das sind ungeprüfte Quellenbeispiele, die örtliche Material- und Entwässerungsprüfung brauchen, nicht die Gefäßrezeptur hier. Prüfe Gefäß, Wasserablauf und Qualität. Perlit kann luftgefüllte Poren fördern, aber kein verschlossenes Gefäß ohne sicheren Ablauf retten. „Für Möhren geeignet“ belegt weder Pe Ha noch Nährstoffe noch Wurzeltiefe.'), ('Prüfe Gleichmäßigkeit an mehreren Stellen, die verlangte Luft-/Wasserprobe, Nettogewicht gegen Toleranz, Sackfestigkeit und Etikett. Das Aussehen allein bescheinigt kein Substrat: Wurzelwachstum, pH, EC/Salze, Phosphor und Ablauf verlangen geeignete Messungen. Fehlen Materialdaten oder Gefäßgestaltung, dokumentiere die Lücke und setze die echte Eignungsaussage aus.\n\nNach Fehlern überprüft der Lernende die Ursache, berechnet eine Korrektur und wiederholt die betroffene Arbeit mit der Lehrkraft. Eine schriftliche Verhältnisantwort zeigt Verständnis, ersetzt aber nicht Messen, Mischen, Verpacken und Beschriften der beiden Praxiskriterien.', 'Prüfe Gleichmäßigkeit an mehreren Stellen, die verlangte Luft-, Wasserprobe, Nettogewicht gegen Toleranz, Sackfestigkeit und Etikett. Das Aussehen allein bescheinigt kein Substrat: Wurzelwachstum, Pe Ha, E Ce, Salze, Phosphor und Ablauf verlangen geeignete Messungen. Fehlen Materialdaten oder Gefäßgestaltung, dokumentiere die Lücke und setze die echte Eignungsaussage aus.\n\nNach Fehlern überprüft der Lernende die Ursache, berechnet eine Korrektur und wiederholt die betroffene Arbeit mit der Lehrkraft. Eine schriftliche Verhältnisantwort zeigt Verständnis, ersetzt aber nicht Messen, Mischen, Verpacken und Beschriften der beiden Praxiskriterien.'), ('„Ein Teil Kompost zu zwei Teilen Tonboden“ ist ohne Bezugsgröße unvollständig. Ein Liter Kompost und zwei Liter Boden sind 1:2 nach Volumen; unterschiedliche Schüttdichten bedeuten bei 1:2 nach Masse andere Volumina. Die Prozesskarte sagt ungefähr 1:2; die Lehrkraft muss Masse oder Volumen, Materialqualität und erlaubte Abweichung vor realem Mischen bestätigen. Übertrage nicht das gesonderte 50:50-Freilandbeispiel.\n\nFür ein dokumentiertes *massenbasiertes* Dreikomponentenprodukt mit 5 kg und Anteilen c, p und b gilt c+p+b=1: Kompost=5c kg, Perlit=5p kg und Knochenmehl=5b kg. Bei Volumenanteilen sind gemessene Schüttdichten oder validierte Umrechnung nötig, bevor 5 kg behauptet werden. Das ist Algebra und kein Rezept: c, p und b bleiben leer bis zur unterschriebenen Vorgabe. Kläre Wiegefeuchte und ob die 5 kg Nettoprodukt oder Produkt plus Sack meinen.', '„Ein Teil Kompost zu zwei Teilen Tonboden“ ist ohne Bezugsgröße unvollständig. Ein Liter Kompost und zwei Liter Boden sind eins zu zwei nach Volumen; unterschiedliche Schüttdichten bedeuten bei eins zu zwei nach Masse andere Volumina. Die Prozesskarte sagt ungefähr eins zu zwei; die Lehrkraft muss Masse oder Volumen, Materialqualität und erlaubte Abweichung vor realem Mischen bestätigen. Übertrage nicht das gesonderte fünfzig zu fünfzig-Freilandbeispiel.\n\nFür ein dokumentiertes massenbasiertes Dreikomponentenprodukt mit fünf Kilogramm und Anteilen Ce, Pe und Be gilt Ce plus Pe plus Be gleich eins: Kompost gleich fünf mal Ce Kilogramm, Perlit gleich fünf mal Pe Kilogramm und Knochenmehl gleich fünf mal Be Kilogramm. Bei Volumenanteilen sind gemessene Schüttdichten oder validierte Umrechnung nötig, bevor fünf Kilogramm behauptet werden. Das ist Algebra und kein Rezept: Ce, Pe und Be bleiben leer bis zur unterschriebenen Vorgabe. Kläre Wiegefeuchte und ob die fünf Kilogramm Nettoprodukt oder Produkt plus Sack meinen.')]}
        for change in u['spokenAdaptationChanges']:
            assert(change['written'],change['spoken'])in allowedByLocale[u['locale']]
            assert reconstructed.count(change['written'])==change['occurrences']
            reconstructed=reconstructed.replace(change['written'],change['spoken'])
        assert reconstructed==u['spokenText']
        assert u['spokenTextSha256']==plan['spokenTextSHA256']==hashlib.sha256(u['spokenText'].encode()).hexdigest()
        assert u['deliverySha256']==hashlib.sha256(u['delivery'].encode()).hexdigest()
        fp={'model':req['model'],'locale':u['locale'],'voice':u['voice'],'spokenText':u['spokenText'],'delivery':u['delivery'],'format':'pcm-s16le-24000-mono-v1'}
        assert hashlib.sha256(json.dumps(fp,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()==u['requestFingerprintSha256']==plan['requestFingerprintSHA256']
        assert(u['maximumProviderCalls'],u['maximumBlindAudioReviewCalls'],u['maximumASRInvocations'],u['automaticRetries'])==((0 if u['id']in imported.IMPORTED else 1),1,1,0)
        assert not u['assessmentSolutionsIncluded']and not u['quizOrWrittenKeysIncluded']
    if req.get('importedOriginalUnitIds'):imported.verify_imports(HERE,req)
    if os.environ.get('GITHUB_ACTIONS')=='true':require_actions()
    return req,runtime

def lane():
    loc=os.environ.get('LOCALE_LANE');assert loc in ['ar-EG','en','it','de'];assert os.environ.get('GITHUB_JOB')=={'ar-EG':'narrate_ar','en':'narrate_en','it':'narrate_it','de':'narrate_de'}[loc];return loc

def require_actions():
    lane()
    assert os.environ.get('GITHUB_ACTIONS')=='true','Actions only'
    assert os.environ.get('GITHUB_RUN_ATTEMPT')=='1' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('BRANCH_CREATED')=='true'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820' and os.environ.get('GITHUB_REPOSITORY_ID')=='1272666418' and os.environ.get('REPOSITORY_IS_PRIVATE')=='false'
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s312-de-recovery-20261023-r1'
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
    assert count < (0 if kind=='tts'else 7), 'Finite recovery operation budget exhausted'
    entry = {'atUTC': now(), 'state': 'RESERVED_BEFORE_INVOCATION_NO_RETRY', 'kind': kind,
             'unitId': unit_id, 'callsReserved': 1, 'maximumCallsForUnit': 1, 'maximumCallsForBatch': (0 if kind=='tts'else 7),'maximumCallsForLane':(0 if kind=='tts'else 7),
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
    imported.reject_imported_tts(unit_id)
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
    if unit_id in imported.IMPORTED:
        return imported.verified_imported_audio(HERE,OUT,read(HERE/'request.json'),unit_id,sha(HERE/'request.json'),sha(HERE/'worker.py'),os.environ['GITHUB_RUN_ID'])
    state = read(folder(unit_id) / 'tts-attempt.json')
    path = folder(unit_id) / 'voice.wav'
    assert state['state'] == 'GENERATED_CANDIDATE_AWAITING_ACTUAL_AUDIO_REVIEW'
    assert sha(path) == state['sha256'] and audio_info(path) == state['audio']
    upload = read(folder(unit_id) / 'audio-upload-receipt.json')
    assert upload['audioSha256'] == state['sha256'] and upload['artifactId'] and upload['artifactDigest']
    return path, state

def import_original(unit_id):
    require_actions();req,runtime,unit=selected(unit_id)
    require_preflight(req,runtime);require_shared_preconditions()
    imported.import_original(HERE,OUT,req,unit_id,sha(HERE/'request.json'),sha(HERE/'worker.py'),os.environ['GITHUB_RUN_ID'])


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
    assert actual['tts']==0 and actual['blind-review']<=7 and actual['asr']<=7
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_NINE_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':0,'maximumBlindReviewPerLane':7,'maximumASRPerLane':7,'maximumTTSAggregate':0,'maximumBlindAggregate':7,'maximumASRAggregate':7,'maximumMetadataGETAggregate':2,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
    if failed:raise RuntimeError('Partial or failed diagnostics preserved; no automatic repeat or adoption')


def stage_diagnostics(unit_id):
    require_actions();req,_,_=selected(unit_id)
    if unit_id in imported.IMPORTED:
        imported.stage_imported_diagnostics(HERE,OUT,HERE/'diagnostics-output'/unit_id,req,unit_id,sha(HERE/'request.json'),sha(HERE/'worker.py'),os.environ['GITHUB_RUN_ID'],os.environ['GITHUB_SHA'])
    else:
        from thin_artifacts import stage_unit
        stage_unit(folder(unit_id),HERE/'diagnostics-output'/unit_id,unit=unit_id,request_sha=sha(HERE/'request.json'),worker_sha=sha(HERE/'worker.py'),run_id=os.environ['GITHUB_RUN_ID'],commit=os.environ['GITHUB_SHA'])


def stage_complete_bundle():
    require_actions();req,_=validate()
    import shutil
    target=HERE/'complete-output';assert not target.exists();target.mkdir()
    for p in OUT.iterdir():
        assert not p.is_symlink()
        if p.is_file():shutil.copyfile(p,target/p.name)
    for uid in req['fixedLocaleLanes'][lane()]:
        if uid in imported.IMPORTED:
            if(folder(uid)/'import-receipt.json').exists():
                imported.stage_imported_diagnostics(HERE,OUT,target/uid,req,uid,sha(HERE/'request.json'),sha(HERE/'worker.py'),os.environ['GITHUB_RUN_ID'],os.environ['GITHUB_SHA'])
            elif folder(uid).exists():shutil.copytree(folder(uid),target/uid)
        else:
            from thin_artifacts import stage_unit
            if folder(uid).exists():stage_unit(folder(uid),target/uid,unit=uid,request_sha=sha(HERE/'request.json'),worker_sha=sha(HERE/'worker.py'),run_id=os.environ['GITHUB_RUN_ID'],commit=os.environ['GITHUB_SHA'])
    write(target/'mixed-bundle-completeness.json',{'schema':'s202-recovery-mixed-evidence-v1','importedOriginals':list(imported.IMPORTED),'newGeneration':list(imported.NEW),'currentRequestSHA256':sha(HERE/'request.json'),'currentWorkerSHA256':sha(HERE/'worker.py'),'currentRunId':os.environ['GITHUB_RUN_ID'],'currentCommit':os.environ['GITHUB_SHA'],'notSelfContainedOriginalAudio':True,'semanticQAAccepted':False,'R04Excluded':True})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['import-original', 'prepare-asr-runtime', 'summarize', 'validate', 'preflight', 'produce', 'uploaded', 'blind-review', 'verify-wheel', 'asr', 'compare', 'stage-diagnostics', 'stage-complete'])
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
            {'import-original': import_original, 'produce': produce, 'blind-review': blind_review, 'asr': asr, 'compare': compare}[args.command](args.unit)
    except Exception as error:
        failurepath=(folder(args.unit) if args.unit else OUT)/('failure-'+args.command+'.json')
        if not failurepath.exists():write(failurepath,{'atUTC':now(),'operation':args.command,'unitId':args.unit,'errorType':type(error).__name__,'noRetry':True,'secretPayloadLogged':False,'perUnitOperationIsolation':True})
        raise SystemExit('Bounded operation failed; inspect sanitized evidence. No automatic retry.') from None

if __name__ == '__main__':
    main()
