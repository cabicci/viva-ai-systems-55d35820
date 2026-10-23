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
IDS = ('S3-08-ar-EG-E01-r1', 'S3-08-ar-EG-E02-r1', 'S3-08-ar-EG-E03-r1', 'S3-08-ar-EG-E04-r1', 'S3-08-en-E01-r1', 'S3-08-en-E02-r1', 'S3-08-en-E03-r1', 'S3-08-en-E04-r1', 'S3-08-it-E01-r1', 'S3-08-it-E02-r1', 'S3-08-it-E03-r1', 'S3-08-it-E04-r1', 'S3-08-de-E01-r1', 'S3-08-de-E02-r1', 'S3-08-de-E03-r1', 'S3-08-de-E04-r1')
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
    assert(req['scope'],req['stepId'])==('S308_SIXTEEN_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-08')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s308-gated-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['E01','E02','E03','E04']
        voice='Charon'if group in ['E01','E03']else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/examples/')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('إيه اللي تثبته طبقة صلبة؟\n\nالكوريك يقف عند طبقة صلبة أسفل قطعة أرض جافة.\n\nطبقة كربونات متماسكة كاليشي أحد الاحتمالات وقد تعوق الجذور أو الصرف.\n\nالدمك أو التماسك بالجبس أو آفاق أخرى قد تكون صلبة أيضًا.\n\nافحص القطاع والتركيب قبل ما تسمي الطبقة أو تكسرها.\n\nسجّل العائق وافحص أصله؛ المقاومة وحدها ما تثبتش إنه كاليشي.', 'إيه اللي تثبته طبقة صلبة؟\n\nالكوريك يقف عند طبقة صلبة أسفل قطعة أرض جافة.\n\nطبقة كربونات متماسكة كاليشي أحد الاحتمالات وممكن تعوق الجذور أو الصرف.\n\nالدمك أو التماسك بالجبس أو آفاق تانية ممكن تكون صلبة برضه.\n\nافحص القطاع والتركيب قبل ما تسمي الطبقة أو تكسرها.\n\nسجّل العائق وافحص أصله؛ المقاومة وحدها ما تثبتش إنه كاليشي.'), ('استخدم مثال رمل الشاطئ بحذر\n\nطالب يقول: «كل أرض صحراوية حارة ورمل خالص ومادتها العضوية أقل من ١٪ ومالحة».\n\nالمثال يفتح سؤال الاحتفاظ بالماء والعناصر فقط.\n\nرتبة Aridisol تتحدد بنظام الرطوبة وقطاع التربة؛ وفيه أنواع باردة.\n\nالقوام والمادة العضوية والأملاح لازم تتقاس في الموقع.\n\nارفض التعميم واقترح فحص القوام والقطاع وOM وEC.', 'استخدم مثال رمل الشاطئ بحذر\n\nطالب يقول: «كل أرض صحراوية حارة ورمل خالص ومادتها العضوية أقل من واحد في المية ومالحة».\n\nالمثال يفتح سؤال الاحتفاظ بالماء والعناصر فقط.\n\nرتبة أريديسولز تتحدد بنظام الرطوبة وقطاع التربة؛ وفيه أنواع باردة.\n\nالقوام والمادة العضوية والأملاح لازم تتقاس في الموقع.\n\nارفض التعميم واقترح فحص القوام والقطاع والمادة العضوية وإي سي.'), ('اقرأ تقرير قطعة التجربة\n\nقطعة لوم رملي ١٠ م × ١٠ م، المادة العضوية ٠٫٨٪ وEC\u200f ٣٫٥ dS/m وماء بئر «قليل الملوحة» من غير ذكر طرق القياس.\n\nالمساحة ١٠٠ م²؛ ٠٫٨٪ قيمة موقع مقاسة.\n\nاطلب طريقة EC للتربة وعمق/تاريخ العينة وECw للبئر والأيونات.\n\nلو ثبت فقط أنه ECe عند ٢٥°م ينفع تفسير جدول ٢–٤ dS/m الخاص به؛ حساسية المحصول تظل مختلفة.\n\nخلي تصنيف الملوحة واختيار المحصول مؤقتين؛ احفظ كل رقم ووحدة من غير تخمين الطريقة.', 'اقرأ تقرير قطعة التجربة\n\nقطعة لوم رملي عشرة متر مضروب في عشرة متر، المادة العضوية صفر فاصلة تمانية في المية وإي سي\u200f تلاتة فاصلة خمسة ديسي سيمنز لكل متر وماء بئر «قليل الملوحة» من غير ذكر طرق القياس.\n\nالمساحة مية متر مربع؛ صفر فاصلة تمانية في المية قيمة موقع مقاسة.\n\nاطلب طريقة إي سي للتربة وعمق، تاريخ العينة وإي سي دبليو للبئر والأيونات.\n\nلو ثبت فقط أنه إي سي إي عند خمسة وعشرين درجة مئوية ينفع تفسير جدول اتنين إلى أربعة ديسي سيمنز لكل متر الخاص به؛ حساسية المحصول تظل مختلفة.\n\nخلي تصنيف الملوحة واختيار المحصول مؤقتين؛ احفظ كل رقم ووحدة من غير تخمين الطريقة.'), ('الماء موجود لكن صعب الامتصاص\n\nعينة تربة من منطقة الجذور رطبة، لكن المحصول باين عليه إجهاد وتحليل تربة موثوق بيأكد زيادة الأملاح.\n\nالجفاف الفعلي أقل احتمالًا لو الماء متاح فعلًا، لكن الإجهاد الأسموزي من الأملاح ممكن.\n\nافحص نمط الأيونات لاحتمال تعارض Na/Ca/K أو سمّية الكلوريد كل على حدة.\n\nحلل ماء الري والصرف قبل زيادة الماء أو محاولة الغسيل.\n\nفرّق بين صعوبة الامتصاص الأسموزية وخزان ماء فارغ وبين سمية أيون مباشرة.', 'الماء موجود لكن صعب الامتصاص\n\nعينة تربة من منطقة الجذور رطبة، لكن المحصول باين عليه إجهاد وتحليل تربة موثوق بيأكد زيادة الأملاح.\n\nالجفاف الفعلي أقل احتمال لو الماء متاح فعلًا، لكن الإجهاد الأسموزي من الأملاح ممكن.\n\nافحص نمط الأيونات لاحتمال تعارض الصوديوم، الكالسيوم، البوتاسيوم أو سمّية الكلوريد كل على حدة.\n\nحلل ماء الري والصرف قبل زيادة الماء أو محاولة الغسيل.\n\nفرّق بين صعوبة الامتصاص الأسموزية وخزان ماء فارغ وبين سمية أيون مباشرة.')], 'en': [("Read the pilot-plot report\n\nThe 10 m × 10 m sandy-loam plot reports organic matter 0.8%, EC 3.5 dS/m and 'slightly saline' borewell water with no methods attached.\n\nThe area is 100 m²; 0.8% OM is a measured site value.\n\nRequest soil EC preparation, sampling depth/date and the borewell ECw plus ions.\n\nOnly if the soil value is verified as ECe at 25°C can an ECe-specific 2–4 dS/m interpretation be used; crop sensitivity still varies.\n\nMark salinity class and crop choice provisional; preserve all numbers and units without guessing the method.", "Read the pilot-plot report\n\nThe ten metres multiplied by ten metres sandy-loam plot reports organic matter zero point eight percent, E C three point five decisiemens per metre and 'slightly saline' borewell water with no methods attached.\n\nThe area is one hundred square metres; zero point eight percent organic matter is a measured site value.\n\nRequest soil E C preparation, sampling depth, date and the borewell E C w plus ions.\n\nOnly if the soil value is verified as E C e at twenty-five degrees Celsius can an E C e-specific two to four decisiemens per metre interpretation be used; crop sensitivity still varies.\n\nMark salinity class and crop choice provisional; preserve all numbers and units without guessing the method."), ("Use the beach-sand analogy carefully\n\nA student says: 'All desert soils are hot, pure sand, contain under 1% organic matter and are salty.'\n\nThe analogy only starts a question about water and nutrient retention.\n\nAridisol classification depends on moisture regime and profile features; cold Aridisols exist.\n\nTexture, organic matter and salts must be measured for the site.\n\nReject the universal claim; propose a texture/profile/OM/EC investigation.", "Use the beach-sand analogy carefully\n\nA student says: 'All desert soils are hot, pure sand, contain under one percent organic matter and are salty.'\n\nThe analogy only starts a question about water and nutrient retention.\n\nAridisol classification depends on moisture regime and profile features; cold Aridisols exist.\n\nTexture, organic matter and salts must be measured for the site.\n\nReject the universal claim; propose a texture, profile, organic matter, E C investigation."), ('Water can be present but difficult to use\n\nA root-zone sample is moist, yet a crop looks stressed and a reliable soil test confirms elevated salts.\n\nPhysical drought is less likely if water is truly available, but salt-induced osmotic stress remains plausible.\n\nCheck the specific ion pattern for possible Na/Ca/K imbalance or chloride injury separately.\n\nAnalyse irrigation water and drainage before adding more water or attempting leaching.\n\nDistinguish osmotic uptake difficulty from an empty reservoir and from direct ion toxicity.', 'Water can be present but difficult to use\n\nA root-zone sample is moist, yet a crop looks stressed and a reliable soil test confirms elevated salts.\n\nPhysical drought is less likely if water is truly available, but salt-induced osmotic stress remains plausible.\n\nCheck the specific ion pattern for possible sodium, calcium, K imbalance or chloride injury separately.\n\nAnalyse irrigation water and drainage before adding more water or attempting leaching.\n\nDistinguish osmotic uptake difficulty from an empty reservoir and from direct ion toxicity.')], 'it': [('Acqua presente ma difficile da assorbire\n\nUn campione di suolo della zona radicale è umido, ma la coltura appare stressata e un’analisi affidabile del suolo conferma sali elevati.\n\nSiccità fisica meno probabile se acqua davvero disponibile; stress osmotico da sali plausibile.\n\nControlla ioni per possibili squilibri Na/Ca/K o danno da cloruro distinti.\n\nAnalizza acqua irrigua e drenaggio prima di aggiungere acqua o lisciviare.\n\nDistingui ostacolo osmotico da riserva vuota e tossicità diretta.', 'Acqua presente ma difficile da assorbire\n\nUn campione di suolo della zona radicale è umido, ma la coltura appare stressata e un’analisi affidabile del suolo conferma sali elevati.\n\nSiccità fisica meno probabile se acqua davvero disponibile; stress osmotico da sali plausibile.\n\nControlla ioni per possibili squilibri sodio, calcio, cappa o danno da cloruro distinti.\n\nAnalizza acqua irrigua e drenaggio prima di aggiungere acqua o lisciviare.\n\nDistingui ostacolo osmotico da riserva vuota e tossicità diretta.'), ('Leggi il rapporto del lotto\n\nIl franco sabbioso 10 m × 10 m ha OM 0,8%, EC 3,5 dS/m e acqua di pozzo «leggermente salina» senza metodi indicati.\n\nL’area è 100 m² e 0,8% è valore misurato del sito.\n\nChiedi preparazione EC del suolo, profondità/data ed ECw e ioni del pozzo.\n\nSoltanto se ECe a 25°C si può usare l’interpretazione ECe 2–4 dS/m; le colture differiscono.\n\nClasse salina e coltura restano provvisorie; conserva numeri e unità senza indovinare il metodo.', 'Leggi il rapporto del lotto\n\nIl franco sabbioso dieci metri moltiplicato per dieci metri ha sostanza organica zero virgola otto per cento, e ci tre virgola cinque decisiemens per metro e acqua di pozzo «leggermente salina» senza metodi indicati.\n\nL’area è cento metri quadrati e zero virgola otto per cento è valore misurato del sito.\n\nChiedi preparazione e ci del suolo, profondità, data ed e ci doppia vu e ioni del pozzo.\n\nSoltanto se e ci e a venticinque gradi Celsius si può usare l’interpretazione e ci e due a quattro decisiemens per metro; le colture differiscono.\n\nClasse salina e coltura restano provvisorie; conserva numeri e unità senza indovinare il metodo.'), ('Usa con cautela l’analogia della sabbia di spiaggia\n\nUno studente afferma: «Ogni suolo desertico è caldo, sabbia pura, con meno dell’1% di organico e salino».\n\nL’analogia apre solo una domanda su acqua e nutrienti.\n\nLa classificazione Aridisol dipende da regime idrico e profilo; esistono Aridisol freddi.\n\nTessitura, organico e sali vanno misurati in sito.\n\nRifiuta la generalizzazione e proponi indagine di profilo, tessitura, OM ed EC.', 'Usa con cautela l’analogia della sabbia di spiaggia\n\nUno studente afferma: «Ogni suolo desertico è caldo, sabbia pura, con meno dell’uno per cento di organico e salino».\n\nL’analogia apre solo una domanda su acqua e nutrienti.\n\nLa classificazione Aridisol dipende da regime idrico e profilo; esistono Aridisol freddi.\n\nTessitura, organico e sali vanno misurati in sito.\n\nRifiuta la generalizzazione e proponi indagine di profilo, tessitura, sostanza organica ed e ci.')], 'de': [('Den Testparzellenbericht lesen\n\nDie 10 m × 10 m große sandig-lehmige Fläche meldet OM 0,8 %, EC 3,5 dS/m und „leicht salziges“ Brunnenwasser ohne Methodenangaben.\n\nFläche 100 m²; OM 0,8 % ist standortspezifisch gemessen.\n\nBoden-EC-Aufbereitung, Tiefe/Datum sowie Brunnen-ECw und Ionen erfragen.\n\nNur nach Nachweis ECe bei 25 °C ist die ECe-Auslegung von 2–4 dS/m nutzbar; Kulturen reagieren unterschiedlich.\n\nSalzklasse und Kulturwahl vorläufig lassen; alle Zahlen/Einheiten ohne Methodenerfindung erhalten.', 'Den Testparzellenbericht lesen\n\nDie zehn Meter mal zehn Meter große sandig-lehmige Fläche meldet organische Substanz null Komma acht Prozent, E Ce drei Komma fünf Dezisiemens pro Meter und „leicht salziges“ Brunnenwasser ohne Methodenangaben.\n\nFläche einhundert Quadratmeter; organische Substanz null Komma acht Prozent ist standortspezifisch gemessen.\n\nBoden-E Ce-Aufbereitung, Tiefe, Datum sowie Brunnen-E Ce We und Ionen erfragen.\n\nNur nach Nachweis E Ce E bei fünfundzwanzig Grad Celsius ist die E Ce E-Auslegung von zwei bis vier Dezisiemens pro Meter nutzbar; Kulturen reagieren unterschiedlich.\n\nSalzklasse und Kulturwahl vorläufig lassen; alle Zahlen, Einheiten ohne Methodenerfindung erhalten.'), ('Strandsand-Vergleich vorsichtig nutzen\n\nJemand sagt: „Jeder Wüstenboden ist heiß, reiner Sand, unter 1 % Humus und salzig.“\n\nDas Bild eröffnet nur die Frage nach Wasser und Nährstoffen.\n\nAridisol-Klassifikation verlangt Feuchteregime und Profil; kalte Aridisole gibt es.\n\nTextur, organische Substanz und Salze am Ort messen.\n\nPauschalbehauptung verwerfen; Profil, Textur, OM und EC untersuchen.', 'Strandsand-Vergleich vorsichtig nutzen\n\nJemand sagt: „Jeder Wüstenboden ist heiß, reiner Sand, unter einem Prozent Humus und salzig.“\n\nDas Bild eröffnet nur die Frage nach Wasser und Nährstoffen.\n\nAridisol-Klassifikation verlangt Feuchteregime und Profil; kalte Aridisole gibt es.\n\nTextur, organische Substanz und Salze am Ort messen.\n\nPauschalbehauptung verwerfen; Profil, Textur, organische Substanz und E Ce untersuchen.'), ('Was beweist eine harte Schicht?\n\nEin Spaten stößt unter einer Trockenfläche auf eine harte Schicht.\n\nKarbonatverfestigter Kaliche ist eine Möglichkeit und kann Wurzeln/Wasser hemmen.\n\nVerdichtung, gipszementierte oder andere Horizonte können ebenso hart sein.\n\nProfil und Zusammensetzung vor Benennung oder Aufbrechen prüfen.\n\nHindernis dokumentieren und Herkunft prüfen; Widerstand allein beweist Kaliche nicht.', 'Was beweist eine harte Schicht?\n\nEin Spaten stößt unter einer Trockenfläche auf eine harte Schicht.\n\nKarbonatverfestigter Kaliche ist eine Möglichkeit und kann Wurzeln, Wasser hemmen.\n\nVerdichtung, gipszementierte oder andere Horizonte können ebenso hart sein.\n\nProfil und Zusammensetzung vor Benennung oder Aufbrechen prüfen.\n\nHindernis dokumentieren und Herkunft prüfen; Widerstand allein beweist Kaliche nicht.'), ('Wasser da, aber schwer nutzbar\n\nEine Wurzelraumprobe ist feucht, die Kultur leidet, und ein zuverlässiger Test zeigt erhöhte Salze.\n\nEchte Trockenheit weniger wahrscheinlich, falls Wasser verfügbar ist; osmotischer Salzstress bleibt möglich.\n\nIonenmuster für Na/Ca/K-Ungleichgewicht oder Chloridschaden getrennt prüfen.\n\nBewässerungswasser und Abfluss analysieren, bevor mehr Wasser oder Auswaschung empfohlen werden.\n\nOsmotische Aufnahmeschwierigkeit von leerem Speicher und direkter Ionentoxizität trennen.', 'Wasser da, aber schwer nutzbar\n\nEine Wurzelraumprobe ist feucht, die Kultur leidet, und ein zuverlässiger Test zeigt erhöhte Salze.\n\nEchte Trockenheit weniger wahrscheinlich, falls Wasser verfügbar ist; osmotischer Salzstress bleibt möglich.\n\nIonenmuster für Natrium, Kalzium, Ka-Ungleichgewicht oder Chloridschaden getrennt prüfen.\n\nBewässerungswasser und Abfluss analysieren, bevor mehr Wasser oder Auswaschung empfohlen werden.\n\nOsmotische Aufnahmeschwierigkeit von leerem Speicher und direkter Ionentoxizität trennen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s308-gated-audio-20261023-r1'
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
            print('Frozen16 S308 protected full cases verified; zero provider calls.')
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
