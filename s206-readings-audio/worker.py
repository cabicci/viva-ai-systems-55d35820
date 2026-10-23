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
IDS = ('S2-06-ar-EG-R01-r1', 'S2-06-ar-EG-R02-r1', 'S2-06-ar-EG-R03-r1', 'S2-06-ar-EG-R04-r1', 'S2-06-ar-EG-R05-r1', 'S2-06-ar-EG-R06-r1', 'S2-06-en-R01-r1', 'S2-06-en-R02-r1', 'S2-06-en-R03-r1', 'S2-06-en-R04-r1', 'S2-06-en-R05-r1', 'S2-06-en-R06-r1', 'S2-06-it-R01-r1', 'S2-06-it-R02-r1', 'S2-06-it-R03-r1', 'S2-06-it-R04-r1', 'S2-06-it-R05-r1', 'S2-06-it-R06-r1', 'S2-06-de-R01-r1', 'S2-06-de-R02-r1', 'S2-06-de-R03-r1', 'S2-06-de-R04-r1', 'S2-06-de-R05-r1', 'S2-06-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S206_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S2-06')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s206-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert group in ['R01','R02','R03','R04','R05','R06']
        ri=int(group[1:])-1;voice='Charon'if ri%2==0 else'Kore';assert(u['speakerId'],u['voice'],u['model'])==(('A'if voice=='Charon'else'B'),voice,'gemini-3.8-flash-tts')
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert [b['pointer']for b in u['sourceBindings']]==[f'/reading/{ri}/paragraphs/{i}'for i in range(len(u['sourceBindings']))] and len(u['sourceBindings'])in[2,3]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('15–20 cm', 'خمستاشر لعشرين سنتيمتر'), ('6–8 inches', 'ستة لتمانية بوصة'), ('A وB وC', 'إيه وبي وسي'), ('Al/Mn', 'الألومنيوم والمنجنيز'), ('Fe/Mn/Zn', 'الحديد والمنجنيز والزنك'), ('NPK', 'إن وبي وكيه'), ('P/Ca/Mg', 'الفوسفور والكالسيوم والمغنيسيوم'), ('SDS', 'إس دي إس'), ('pH', 'بي إتش'), ('أثرًا محتملًا', 'أثر محتمل'), ('استخدم تلات عينات منفصلين إيه وبي وسي. المدرّب يجهزهم ويفحصهم من قبل ويحتفظ بمفتاح القياسات مستقل. اكتب نتيجة كل عينة اللي العدة تدعمها قبل المقارنة بأي مثال تعليمي. أرقام المثال مش ضمان إن العدة تدي كسور عشرية؛ وقراءة قريبة من 6.8 لسه حمضية بسيطة، مش متعادلة بالظبط.\n\nنشاط الأصل فيه ثلاث مراحل محتوى كل واحدة 10 دقائق: قِس، ثم اشرح أثر محتمل على تيسر العناصر، ثم اقترح خطوة تالية مناسبة للمحصول؛ وفي الخطة الأوسع وقت للتجهيز والمجموعات والتنظيف والمناقشة. الشرح والتوصية يعتمدان على القياسات الحقيقية وأدلة تانية. مع بي إتش أقل ممكن نفكر في قيود الفوسفور والكالسيوم والمغنيسيوم ومخاطر الألومنيوم والمنجنيز، ومع بي إتش أعلى ممكن نفكر في قيود الحديد والمنجنيز والزنك. اختيار الجير أو الكبريت أو غيرهما وكمياته يحتاج بيانات تربة ومحصول لاحقًا. جدول تقريبي ما يحولش إجابة الأصل النموذجية لوصفة علاج.', 'استخدم تلات عينات منفصلين إيه وبي وسي. المدرّب يجهزهم ويفحصهم من قبل ويحتفظ بمفتاح القياسات مستقل. اكتب نتيجة كل عينة اللي العدة تدعمها قبل المقارنة بأي مثال تعليمي. أرقام المثال مش ضمان إن العدة تدي كسور عشرية؛ وقراءة قريبة من ستة فاصلة تمانية لسه حمضية بسيطة، مش متعادلة بالظبط.\n\nنشاط الأصل فيه ثلاث مراحل محتوى كل واحدة عشرة دقائق: قِس، ثم اشرح أثر محتمل على تيسر العناصر، ثم اقترح خطوة تالية مناسبة للمحصول؛ وفي الخطة الأوسع وقت للتجهيز والمجموعات والتنظيف والمناقشة. الشرح والتوصية يعتمدان على القياسات الحقيقية وأدلة تانية. مع بي إتش أقل ممكن نفكر في قيود الفوسفور والكالسيوم والمغنيسيوم ومخاطر الألومنيوم والمنجنيز، ومع بي إتش أعلى ممكن نفكر في قيود الحديد والمنجنيز والزنك. اختيار الجير أو الكبريت أو غيرهما وكمياته يحتاج بيانات تربة ومحصول لاحقًا. جدول تقريبي ما يحولش إجابة الأصل النموذجية لوصفة علاج.'), ('الخاص بـبي إتش', 'الخاص بقياس بي إتش'), ('بعيدًا عن الشمس', 'بعيد عن الشمس'), ('ثلاث مراحل محتوى كل واحدة عشرة دقائق: قِس، ثم اشرح أثر محتمل', 'تلات مراحل محتوى كل واحدة عشر دقايق: قيس، وبعد كده اشرح أثر محتمل'), ('ثم اقترح خطوة تالية', 'وبعد كده اقترح خطوة تالية'), ('جهازًا أو معملًا مناسبًا', 'جهاز أو معمل مناسب'), ('رقمًا', 'رقم'), ('سطرًا مختلفًا', 'سطر مختلف'), ('طرقًا مضبوطة', 'طرق مضبوطة'), ('في طريقة بي إتش الموثّقة لعدة Luster Leaf Rapitest 1601، تأكد إن المقارن الأخضر فيه جدول ألوانه الخاص. املأ حجرة الاختبار تربة لحد علامة التربة؛ افتح بحرص كبسولة بي إتش خضراء واحدة مطابقة فوق حجرة الاختبار، وصبّ البودرة فيها؛ وبالقطّارة أضف مية، ويفضل تكون مقطرة لحد علامة الماء؛ اقفل بإحكام ورجّ كويس. سيب التربة تترسب واللون يظهر نحو دقيقة، وبعدين قارن السائل اللي فوق التربة بجدول بي إتش لنفس المقارن في ضوء النهار بعيد عن الشمس المباشرة. سجّل أقرب لون ورمز العينة. تعليمات إن وبي وكيه المنفصلة في نفس العلبة مش هي تعليمات بي إتش دي.\n\nبطاقة التقييم الأصلية تصف أنبوبة عامة وكاشف بودرة أو سائل وعلامة ملء ورجّ للوقت المطلوب؛ الدقيقة الواحدة فيها مثال، وبعدها ترسيب ومقارنة وتسجيل وتنظيف. طريقة الشركة اللي فوق تطبيق موثّق للتسلسل ده، مش إذن تنقل كمياتها أو وقتها أو جدولها لعدة مختلفة. لو عدة موقع التدريب مختلفة، دليل الشركة الحالي هو اللي يحكم، والمدرّب يطابق عليه أفعال التقييم نفسها.', 'في طريقة بي إتش الموثّقة لعدة Luster Leaf Rapitest واحد ستة صفر واحد، تأكد إن المقارن الأخضر فيه جدول ألوانه الخاص. املأ حجرة الاختبار تربة لحد علامة التربة؛ افتح بحرص كبسولة بي إتش خضراء واحدة مطابقة فوق حجرة الاختبار، وصبّ البودرة فيها؛ وبالقطّارة أضف مية، ويفضل تكون مقطرة لحد علامة الماء؛ اقفل بإحكام ورجّ كويس. سيب التربة تترسب واللون يظهر نحو دقيقة، وبعدين قارن السائل اللي فوق التربة بجدول بي إتش لنفس المقارن في ضوء النهار بعيد عن الشمس المباشرة. سجّل أقرب لون ورمز العينة. تعليمات إن وبي وكيه المنفصلة في نفس العلبة مش هي تعليمات بي إتش دي.\n\nبطاقة التقييم الأصلية تصف أنبوبة عامة وكاشف بودرة أو سائل وعلامة ملء ورجّ للوقت المطلوب؛ الدقيقة الواحدة فيها مثال، وبعدها ترسيب ومقارنة وتسجيل وتنظيف. طريقة الشركة اللي فوق تطبيق موثّق للتسلسل ده، مش إذن تنقل كمياتها أو وقتها أو جدولها لعدة مختلفة. لو عدة موقع التدريب مختلفة، دليل الشركة الحالي هو اللي يحكم، والمدرّب يطابق عليه أفعال التقييم نفسها.'), ('ماءً ويفضل مقطرًا', 'مية، ويفضل تكون مقطرة'), ('مسبقًا', 'من قبل'), ('من6.8', 'من 6.8'), ('وتسليمًا صحيحين ووقتًا', 'وتسليم صحيحين ووقت'), ('وتفسيرًا للمحصول', 'وتفسير للمحصول'), ('ورجًّا للوقت', 'ورجّ للوقت'), ('ورُجّ جيدًا', 'ورجّ كويس'), ('وكاشفًا بودرة أو سائلًا', 'وكاشف بودرة أو سائل')], 'en': [('15–20 cm', 'fifteen to twenty centimetres'), ('6–8 inches', 'six to eight inches'), ('Al/Mn', 'aluminum and manganese'), ('Fe/Mn/Zn', 'iron, manganese and zinc'), ("In the documented Luster Leaf Rapitest 1601 P H method, confirm that the green P H comparator contains its own colour chart. Fill its test chamber to the soil line; carefully open one matching green P H capsule over the test chamber and pour in its powder; use its dropper to add preferably distilled water to the water line; fasten the cap and shake thoroughly. Allow soil to settle and colour to develop for about one minute, then compare the liquid above the soil with that comparator's P H chart in daylight, away from direct sun. Record the nearest chart colour and the sample ID. Do not follow its separate N P K instructions for this P H test.\n\nThe source assessment card describes a generic tube, reagent powder or liquid, a fill line, shaking for the required time (one minute is only an example), settling, chart comparison, record and cleaning. The manufacturer's procedure above is one valid implementation of that sequence, not a licence to use its quantities, time or chart with a different kit. If the site's kit differs, the current manufacturer manual governs and the trainer maps the same assessed actions to it.", "In the documented Luster Leaf Rapitest one six zero one P H method, confirm that the green P H comparator contains its own colour chart. Fill its test chamber to the soil line; carefully open one matching green P H capsule over the test chamber and pour in its powder; use its dropper to add preferably distilled water to the water line; fasten the cap and shake thoroughly. Allow soil to settle and colour to develop for about one minute, then compare the liquid above the soil with that comparator's P H chart in daylight, away from direct sun. Record the nearest chart colour and the sample ID. Do not follow its separate N P K instructions for this P H test.\n\nThe source assessment card describes a generic tube, reagent powder or liquid, a fill line, shaking for the required time (one minute is only an example), settling, chart comparison, record and cleaning. The manufacturer's procedure above is one valid implementation of that sequence, not a licence to use its quantities, time or chart with a different kit. If the site's kit differs, the current manufacturer manual governs and the trainer maps the same assessed actions to it."), ('NPK', 'N P K'), ('P/Ca/Mg', 'phosphorus, calcium and magnesium'), ('SDS', 'S D S'), ('Use three separately identified samples A, B and C. The trainer prepares and prechecks them and retains a separate measured key. Write each actual kit-supported result before comparison with any teaching example. Model numbers do not guarantee the colour kit can show decimals; a reading near 6.8 remains slightly acidic, not exactly neutral.\n\nThe original activity has three 10-minute parts: measure, explain possible nutrient-availability implications, and suggest a crop-specific next step; instruction, grouping and cleanup are also timed in the fuller plan. The explanation and recommendation depend on the true results and other evidence. At lower P H, possible phosphorus, calcium and magnesium constraints and aluminum and manganese risk can be considered; at high P H, iron, manganese and zinc constraints can be considered. Exact lime, sulfur or other amendment choices and rates need later soil and crop evidence. An approximate chart does not turn the source model answer into a prescription.', 'Use three separately identified samples A, B and C. The trainer prepares and prechecks them and retains a separate measured key. Write each actual kit-supported result before comparison with any teaching example. Model numbers do not guarantee the colour kit can show decimals; a reading near six point eight remains slightly acidic, not exactly neutral.\n\nThe original activity has three ten-minute parts: measure, explain possible nutrient-availability implications, and suggest a crop-specific next step; instruction, grouping and cleanup are also timed in the fuller plan. The explanation and recommendation depend on the true results and other evidence. At lower P H, possible phosphorus, calcium and magnesium constraints and aluminum and manganese risk can be considered; at high P H, iron, manganese and zinc constraints can be considered. Exact lime, sulfur or other amendment choices and rates need later soil and crop evidence. An approximate chart does not turn the source model answer into a prescription.'), ('meter/lab method', 'meter or laboratory method'), ('near6.8', 'near 6.8'), ('pH', 'P H'), ('sample/field ID', 'sample or field ID')], 'it': [('15–20 cm', 'quindici a venti centimetri'), ('6–8 inches', 'sei a otto pollici'), ('Al/Mn', 'alluminio e manganese'), ('Fe/Mn/Zn', 'ferro, manganese e zinco'), ('ID', 'I D'), ('NPK', 'N P K'), ("Nel metodo P H documentato Luster Leaf Rapitest 1601, verifica che il comparatore verde contenga la propria scala. Riempi la camera fino alla tacca della terra; aggiungi il contenuto di una capsula P H verde corrispondente; col contagocce versa acqua, preferibilmente distillata, fino alla tacca; chiudi bene e agita. Lascia sedimentare e sviluppare il colore per circa un minuto, poi confronta il liquido sopra la terra con la scala P H del medesimo comparatore alla luce del giorno senza sole diretto. Registra colore più vicino e I D del campione. Non seguire le istruzioni N P K separate della stessa confezione per questa prova P H.\n\nLa scheda di valutazione originale descrive provetta generica, reagente in polvere o liquido, tacca, agitazione per il tempo richiesto (un minuto è solo un esempio), sedimentazione, confronto, registrazione e pulizia. La procedura del produttore è un'applicazione documentata di questa sequenza, non il permesso di trasferire quantità, tempo o scala a un altro kit. Se il kit del sito è diverso, prevale il manuale aggiornato e il formatore mappa su di esso le azioni da valutare.", "Nel metodo P H documentato Luster Leaf Rapitest uno sei zero uno, verifica che il comparatore verde contenga la propria scala. Riempi la camera fino alla tacca della terra; aggiungi il contenuto di una capsula P H verde corrispondente; col contagocce versa acqua, preferibilmente distillata, fino alla tacca; chiudi bene e agita. Lascia sedimentare e sviluppare il colore per circa un minuto, poi confronta il liquido sopra la terra con la scala P H del medesimo comparatore alla luce del giorno senza sole diretto. Registra colore più vicino e I D del campione. Non seguire le istruzioni N P K separate della stessa confezione per questa prova P H.\n\nLa scheda di valutazione originale descrive provetta generica, reagente in polvere o liquido, tacca, agitazione per il tempo richiesto (un minuto è solo un esempio), sedimentazione, confronto, registrazione e pulizia. La procedura del produttore è un'applicazione documentata di questa sequenza, non il permesso di trasferire quantità, tempo o scala a un altro kit. Se il kit del sito è diverso, prevale il manuale aggiornato e il formatore mappa su di esso le azioni da valutare."), ('P/Ca/Mg', 'fosforo, calcio e magnesio'), ('SDS', 'S D S'), ('Usa tre campioni distinti A, B e C. Il formatore li prepara, li verifica prima e conserva una chiave misurata separata. Registra ogni risultato supportato dal kit prima del confronto didattico. I numeri di esempio non garantiscono decimali; un valore vicino a 6.8 resta leggermente acido, non esattamente neutro.\n\nIl foglio originale ha tre parti di 10 minuti: misurare, spiegare possibili effetti sulla disponibilità dei nutrienti e proporre il passo successivo per la coltura; il piano completo include anche preparazione, gruppi, pulizia e discussione. Spiegazione e proposta dipendono da risultati veri e altre prove. Con P H basso si considerano possibili limiti fosforo, calcio e magnesio e rischi alluminio e manganese; con P H alto possibili limiti ferro, manganese e zinco. Scelta e dose di calce, zolfo o altro richiedono ulteriori dati su suolo e coltura. Una scala approssimativa non trasforma la risposta modello in ricetta.', 'Usa tre campioni distinti A, B e C. Il formatore li prepara, li verifica prima e conserva una chiave misurata separata. Registra ogni risultato supportato dal kit prima del confronto didattico. I numeri di esempio non garantiscono decimali; un valore vicino a sei virgola otto resta leggermente acido, non esattamente neutro.\n\nIl foglio originale ha tre parti di dieci minuti: misurare, spiegare possibili effetti sulla disponibilità dei nutrienti e proporre il passo successivo per la coltura; il piano completo include anche preparazione, gruppi, pulizia e discussione. Spiegazione e proposta dipendono da risultati veri e altre prove. Con P H basso si considerano possibili limiti fosforo, calcio e magnesio e rischi alluminio e manganese; con P H alto possibili limiti ferro, manganese e zinco. Scelta e dose di calce, zolfo o altro richiedono ulteriori dati su suolo e coltura. Una scala approssimativa non trasforma la risposta modello in ricetta.'), ('a6.8', 'a 6.8'), ('pH', 'P H'), ('possibili limiti ferro, manganese e zinco', 'possibili limitazioni di ferro, manganese e zinco'), ('possibili limiti fosforo, calcio e magnesio', 'possibili limitazioni di fosforo, calcio e magnesio'), ('rischi alluminio e manganese', 'rischi legati ad alluminio e manganese')], 'de': [('15–20 cm', 'fünfzehn bis zwanzig Zentimeter'), ('6–8 inches', 'sechs bis acht Zoll'), ('Al/Mn', 'Aluminium und Mangan'), ('Beim dokumentierten P H-Verfahren Luster Leaf Rapitest 1601 muss im grünen Komparator seine eigene Skala sitzen. Fülle den Prüfraum bis zur Bodenlinie mit Erde, gib den Inhalt einer passenden grünen P H-Kapsel dazu und füge mit der Pipette möglichst destilliertes Wasser bis zur Wasserlinie hinzu. Deckel dicht schließen und gründlich schütteln. Lasse Boden und Farbe etwa eine Minute absetzen und sich entwickeln. Vergleiche dann die Flüssigkeit über dem Boden bei Tageslicht ohne direkte Sonne mit der P H-Skala dieses Komparators. Notiere nächstliegenden Skalenblock und Probenkennung. Die gesonderte N P K-Anleitung derselben Packung gilt hier nicht.\n\nDie ursprüngliche Bewertungskarte beschreibt allgemeines Röhrchen, Pulver oder flüssiges Reagenz, Fülllinie und Schütteln für die verlangte Zeit (eine Minute nur als Beispiel), Absetzen, Skalenvergleich, Notiz und Reinigung. Das Herstellerverfahren ist eine dokumentierte Umsetzung, keine Erlaubnis, Menge, Zeit oder Skala auf ein anderes Set zu übertragen. Hat der Standort ein anderes Set, gilt dessen aktuelles Handbuch; die Lehrkraft ordnet die gleichen Bewertungshandlungen diesem Verfahren zu.', 'Beim dokumentierten P H-Verfahren Luster Leaf Rapitest eins sechs null eins muss im grünen Komparator seine eigene Skala sitzen. Fülle den Prüfraum bis zur Bodenlinie mit Erde, gib den Inhalt einer passenden grünen P H-Kapsel dazu und füge mit der Pipette möglichst destilliertes Wasser bis zur Wasserlinie hinzu. Deckel dicht schließen und gründlich schütteln. Lasse Boden und Farbe etwa eine Minute absetzen und sich entwickeln. Vergleiche dann die Flüssigkeit über dem Boden bei Tageslicht ohne direkte Sonne mit der P H-Skala dieses Komparators. Notiere nächstliegenden Skalenblock und Probenkennung. Die gesonderte N P K-Anleitung derselben Packung gilt hier nicht.\n\nDie ursprüngliche Bewertungskarte beschreibt allgemeines Röhrchen, Pulver oder flüssiges Reagenz, Fülllinie und Schütteln für die verlangte Zeit (eine Minute nur als Beispiel), Absetzen, Skalenvergleich, Notiz und Reinigung. Das Herstellerverfahren ist eine dokumentierte Umsetzung, keine Erlaubnis, Menge, Zeit oder Skala auf ein anderes Set zu übertragen. Hat der Standort ein anderes Set, gilt dessen aktuelles Handbuch; die Lehrkraft ordnet die gleichen Bewertungshandlungen diesem Verfahren zu.'), ('Drei getrennte Proben A, B und C verwenden. Die Lehrkraft bereitet sie vor, prüft sie und behält einen getrennten Messschlüssel. Zuerst jeden vom Set unterstützten Wert notieren. Beispielzahlen garantieren keine Dezimalauflösung; nahe 6.8 bleibt leicht sauer und ist nicht genau neutral.\n\nDie Vorlage hat drei Inhaltsphasen von je 10 Minuten: messen, mögliche Folgen für die Nährstoffverfügbarkeit erklären, und eine kulturspezifische nächste Prüfung vorschlagen; der Gesamtplan enthält auch Aufbau, Gruppen, Reinigung und Besprechung. Erklärung und Empfehlung hängen von echten Messwerten und weiteren Daten ab. Bei niedrigem P H sind mögliche Phosphor, Calcium und Magnesium-Einschränkungen und Aluminium und Mangan-Risiken denkbar, bei hohem P H Eisen, Mangan und Zink-Einschränkungen. Kalk, Schwefel oder andere Mittel samt Mengen brauchen spätere Boden- und Kulturprüfung. Eine grobe Farbskala macht aus der Modellantwort kein Rezept.', 'Drei getrennte Proben A, B und C verwenden. Die Lehrkraft bereitet sie vor, prüft sie und behält einen getrennten Messschlüssel. Zuerst jeden vom Set unterstützten Wert notieren. Beispielzahlen garantieren keine Dezimalauflösung; nahe sechs Komma acht bleibt leicht sauer und ist nicht genau neutral.\n\nDie Vorlage hat drei Inhaltsphasen von je zehn Minuten: messen, mögliche Folgen für die Nährstoffverfügbarkeit erklären, und eine kulturspezifische nächste Prüfung vorschlagen; der Gesamtplan enthält auch Aufbau, Gruppen, Reinigung und Besprechung. Erklärung und Empfehlung hängen von echten Messwerten und weiteren Daten ab. Bei niedrigem P H sind mögliche Phosphor, Calcium und Magnesium-Einschränkungen und Aluminium und Mangan-Risiken denkbar, bei hohem P H Eisen, Mangan und Zink-Einschränkungen. Kalk, Schwefel oder andere Mittel samt Mengen brauchen spätere Boden- und Kulturprüfung. Eine grobe Farbskala macht aus der Modellantwort kein Rezept.'), ('Fe/Mn/Zn', 'Eisen, Mangan und Zink'), ('NPK', 'N P K'), ('P/Ca/Mg', 'Phosphor, Calcium und Magnesium'), ('SDS', 'S D S'), ('mögliche Phosphor, Calcium und Magnesium-Einschränkungen und Aluminium und Mangan-Risiken denkbar, bei hohem P H Eisen, Mangan und Zink-Einschränkungen', 'mögliche Einschränkungen bei Phosphor, Calcium und Magnesium sowie Risiken durch Aluminium und Mangan denkbar, bei hohem P H Einschränkungen bei Eisen, Mangan und Zink'), ('nahe6.8', 'nahe 6.8'), ('pH', 'P H')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s206-readings-audio-20261023-r1'
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
