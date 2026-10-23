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
IDS = ('S3-09-ar-EG-E01-r1', 'S3-09-ar-EG-E02-r1', 'S3-09-ar-EG-E03-r1', 'S3-09-ar-EG-E04-r1', 'S3-09-en-E01-r1', 'S3-09-en-E02-r1', 'S3-09-en-E03-r1', 'S3-09-en-E04-r1', 'S3-09-it-E01-r1', 'S3-09-it-E02-r1', 'S3-09-it-E03-r1', 'S3-09-it-E04-r1', 'S3-09-de-E01-r1', 'S3-09-de-E02-r1', 'S3-09-de-E03-r1', 'S3-09-de-E04-r1')
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
    assert(req['scope'],req['stepId'])==('S309_SIXTEEN_SOURCE_GATED_COMPLETE_WORKED_CASES_FOUR_FIXED_LOCALE_LANES','S3-09')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_FOUR_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(16,16,16,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s309-gated-audio-20261023-r1')
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
        exactSourcePointersByLocale={'ar-EG': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'en': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'it': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}, 'de': {'E01': ['/examples/0/title', '/examples/0/situation', '/examples/0/reasoning/0', '/examples/0/reasoning/1', '/examples/0/reasoning/2', '/examples/0/reasoning/3', '/examples/0/takeaway'], 'E02': ['/examples/1/title', '/examples/1/situation', '/examples/1/reasoning/0', '/examples/1/reasoning/1', '/examples/1/reasoning/2', '/examples/1/takeaway'], 'E03': ['/examples/2/title', '/examples/2/situation', '/examples/2/reasoning/0', '/examples/2/reasoning/1', '/examples/2/reasoning/2', '/examples/2/takeaway'], 'E04': ['/examples/3/title', '/examples/3/situation', '/examples/3/reasoning/0', '/examples/3/reasoning/1', '/examples/3/reasoning/2', '/examples/3/takeaway']}}
        assert[b['pointer']for b in u['sourceBindings']]==exactSourcePointersByLocale[u['locale']][group]
        assert all(b['pointer'].startswith('/examples/')for b in u['sourceBindings'])
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('احتفظ بأرقام الأصل من غير تطبيق أعمى\n\nنموذج المدرّس: ٥–١٠ سم كمبوست/سماد معتّق في أعلى ١٥ سم، وبعد الزراعة ٧–١٠ سم ملش قش/خشب. نموذج بنك مختلف: خلط بأعلى ١٥–٢٠ سم وملش ٥–١٠ سم لحالة أخرى رملية قلوية.\n\nالأرقام أمثلة في حالتين مختلفتين، مش وصفة متحقَّق منها للقطعة.\n\nعلى ١٠٠ م²، طبقة ٥ سم حجمها ٥ م³ و١٠ سم حجمها ١٠ م³ قبل كثافة المادة وانكماشها وخلطها؛ فافحص توفرها وتركيبها.\n\nاطلب EC والعناصر ونضج المادة والمحصول وتحليل الأرض والميزانية وعمق خلط آمن.\n\nاحتفظ بالنطاقين في سجل التعلم، وخد مواصفة موقع موثقة قبل التطبيق.', 'احتفظ بأرقام الأصل من غير تطبيق أعمى\n\nنموذج المدرّس: خمسة إلى عشرة سنتيمتر كمبوست، سماد معتّق في أعلى خمستاشر سنتيمتر، وبعد الزراعة سبعة إلى عشرة سنتيمتر ملش قش، خشب. نموذج بنك مختلف: خلط بأعلى خمستاشر إلى عشرين سنتيمتر وملش خمسة إلى عشرة سنتيمتر لحالة أخرى رملية قلوية.\n\nالأرقام أمثلة في حالتين مختلفتين، مش وصفة متحقَّق منها للقطعة.\n\nعلى مية متر مربع، طبقة خمسة سنتيمتر حجمها خمسة متر مكعب وعشرة سنتيمتر حجمها عشرة متر مكعب قبل كثافة المادة وانكماشها وخلطها؛ فافحص توفرها وتركيبها.\n\nاطلب إي سي والعناصر ونضج المادة والمحصول وتحليل الأرض والميزانية وعمق خلط آمن.\n\nاحتفظ بالنطاقين في سجل التعلم، وخد مواصفة موقع موثقة قبل التطبيق.'), ('التقنية الثالثة حسب الموقع\n\nفي حالة رملية قلوية، طالب يقترح كمبوست وقش تغطية ومحصول بيقية ومصد أشجار.\n\nافحص جودة الكمبوست وملوحته قبل الجرعة؛ ما تفترضش إنه يصحح pH أو يزيل الملح.\n\nالملش ممكن يقلل البخر، لكن نوعه وسمكه مرتبطان بالمحصول والري.\n\nالبيقية والمصد يحتاجوا ماء ومساحة؛ في قطعة ١٠٠ م² شديدة الجفاف قد توجد بدائل أفضل.\n\nاعرض ثلاث تقنيات مختلفة بأسباب مشروطة، واشرح ليه ممكن تأجل واحدة.', 'التقنية الثالثة حسب الموقع\n\nفي حالة رملية قلوية، طالب يقترح كمبوست وقش تغطية ومحصول بيقية ومصد أشجار.\n\nافحص جودة الكمبوست وملوحته قبل الجرعة؛ ما تفترضش إنه يصحح بي إتش أو يزيل الملح.\n\nالملش ممكن يقلل البخر، لكن نوعه وسمكه مرتبطان بالمحصول والري.\n\nالبيقية والمصد يحتاجوا ماء ومساحة؛ في قطعة مية متر مربع شديدة الجفاف قد توجد بدائل أفضل.\n\nاعرض ثلاث تقنيات مختلفة بأسباب مشروطة، واشرح ليه ممكن تأجل واحدة.'), ('الشعير والسورجم مرشحان بشروط\n\nطالب يقترح الشعير لتحمل نسبي للملح، والسورجم للتأقلم مع الجفاف في القطعة الصغيرة.\n\nالشعير له تحمل ملح نسبي مرتفع للحبوب في مرجع FAO، لكن البادرات قد تكون أقل تحملًا.\n\nالسورجم ممكن يتأقلم مع الجفاف، وتحمله للملح متوسط نسبيًا في المقارنة نفسها؛ دول سببين مختلفين، مش تقييم واحد.\n\nقبل القرار افحص ECe وECw والصنف والموسم والبذور وماء الإنبات والاستخدام المتوقع.\n\nزوج أولي مبرر، مش وعد بإنتاج؛ اللوبيا والكينوا وبنجر السكر وبقية مرشحي الأصل يحتاجوا فحصهم الخاص.', 'الشعير والسورجم مرشحان بشروط\n\nطالب يقترح الشعير لتحمل نسبي للملح، والسورجم للتأقلم مع الجفاف في القطعة الصغيرة.\n\nالشعير له تحمل ملح نسبي مرتفع للحبوب في مرجع الفاو، لكن البادرات قد تكون أقل تحملًا.\n\nالسورجم ممكن يتأقلم مع الجفاف، وتحمله للملح متوسط نسبيًا في المقارنة نفسها؛ دول سببين مختلفين، مش تقييم واحد.\n\nقبل القرار افحص إي سي إي وإي سي دبليو والصنف والموسم والبذور وماء الإنبات والاستخدام المتوقع.\n\nزوج أولي مبرر، مش وعد بإنتاج؛ اللوبيا والكينوا وبنجر السكر وبقية مرشحي الأصل يحتاجوا فحصهم الخاص.'), ('شكل مبرر لخطة صفحة واحدة\n\nقطعة لوم رملي ١٠٠ م² فيها OM\u200f ٠٫٨٪ وEC\u200f ٣٫٥ dS/m من غير طريقة استخراج، وماء بئر موصوف بأنه قليل الملوحة.\n\nالقضية ١: OM قليلة مقاسة قد تحدّ من الخزن؛ اختبر التربة وجودة المحسن قبل الجرعة.\n\nالقضية ٢: إجهاد ملحي محتمل يحتاج ECe مطابقًا للطريقة وعمقًا وصرفًا موثقين.\n\nالقضية ٣: ماء البئر يحتاج ECw وتحليل أيونات قبل الري أو الغسل.\n\nاجمع الفحوص والتدخلات المشروطة والمحاصيل المرشحة والمتابعة في صفحة واحدة.\n\nما تعلنش محصولًا نهائيًا ولا جرعة كمبوست أو غسل من التقرير الناقص.', 'شكل مبرر لخطة صفحة واحدة\n\nقطعة لوم رملي مية متر مربع فيها المادة العضوية\u200f صفر فاصلة تمانية في المية وإي سي\u200f تلاتة فاصلة خمسة ديسي سيمنز لكل متر من غير طريقة استخراج، وماء بئر موصوف بأنه قليل الملوحة.\n\nالقضية واحد: المادة العضوية قليلة مقاسة قد تحدّ من الخزن؛ اختبر التربة وجودة المحسن قبل الجرعة.\n\nالقضية اتنين: إجهاد ملحي محتمل يحتاج إي سي إي مطابقًا للطريقة وعمقًا وصرفًا موثقين.\n\nالقضية تلاتة: ماء البئر يحتاج إي سي دبليو وتحليل أيونات قبل الري أو الغسل.\n\nاجمع الفحوص والتدخلات المشروطة والمحاصيل المرشحة والمتابعة في صفحة واحدة.\n\nما تعلنش محصول نهائي ولا جرعة كمبوست أو غسل من التقرير الناقص.')], 'en': [('A defensible one-page outline\n\nA 100 m² sandy-loam plot has OM 0.8%, EC 3.5 dS/m without an extraction method and slightly saline borewell water.\n\nConcern 1: low measured OM may limit storage; test soil and amendment quality before a rate.\n\nConcern 2: possible salt stress needs method-matched ECe, depth and drainage evidence.\n\nConcern 3: borewell water needs ECw and ion analysis before an irrigation/leaching plan.\n\nPut tests, conditional interventions, crop candidates and monitoring on one page.\n\nDo not declare a final crop or compost/leaching dose from the incomplete report.', 'A defensible one-page outline\n\nA one hundred square metres sandy-loam plot has organic matter zero point eight percent, E C three point five decisiemens per metre without an extraction method and slightly saline borewell water.\n\nConcern one: low measured organic matter may limit storage; test soil and amendment quality before a rate.\n\nConcern two: possible salt stress needs method-matched E C e, depth and drainage evidence.\n\nConcern three: borewell water needs E C w and ion analysis before an irrigation, leaching plan.\n\nPut tests, conditional interventions, crop candidates and monitoring on one page.\n\nDo not declare a final crop or compost, leaching dose from the incomplete report.'), ('A third technique depends on the site\n\nFor a sandy, alkaline case, a student proposes compost, straw mulch and a vetch cover crop plus a tree windbreak.\n\nCompost quality and salinity must be checked before a rate; it cannot be assumed to correct pH or salt.\n\nMulch may reduce evaporation, but the material and depth depend on crop and irrigation.\n\nVetch and windbreaks need water and space; a very dry 100 m² pilot may have better alternatives.\n\nGive three distinct techniques with conditional reasons and explain why one option may be deferred.', 'A third technique depends on the site\n\nFor a sandy, alkaline case, a student proposes compost, straw mulch and a vetch cover crop plus a tree windbreak.\n\nCompost quality and salinity must be checked before a rate; it cannot be assumed to correct p H or salt.\n\nMulch may reduce evaporation, but the material and depth depend on crop and irrigation.\n\nVetch and windbreaks need water and space; a very dry pilot covering one hundred square metres may have better alternatives.\n\nGive three distinct techniques with conditional reasons and explain why one option may be deferred.'), ('Barley plus sorghum as conditional candidates\n\nA student proposes barley for possible salinity tolerance and sorghum for drought adaptation on the small plot.\n\nBarley has a relatively high salt-tolerance rating for grain in an FAO reference, but seedling establishment can be less tolerant.\n\nSorghum can be drought adapted and is only moderately salt tolerant in the same comparison; these are different reasons, not interchangeable ratings.\n\nBefore a decision, confirm ECe/ECw, cultivar, season, seed supply, establishment water and expected use.\n\nA justified preliminary pair, not a promise of successful yield; cowpea, quinoa, sugar beet and other source candidates need their own checks.', 'Barley plus sorghum as conditional candidates\n\nA student proposes barley for possible salinity tolerance and sorghum for drought adaptation on the small plot.\n\nBarley has a relatively high salt-tolerance rating for grain in an FAO reference, but seedling establishment can be less tolerant.\n\nSorghum can be drought adapted and is only moderately salt tolerant in the same comparison; these are different reasons, not interchangeable ratings.\n\nBefore a decision, confirm E C e, E C w, cultivar, season, seed supply, establishment water and expected use.\n\nA justified preliminary pair, not a promise of successful yield; cowpea, quinoa, sugar beet and other source candidates need their own checks.'), ("Preserve the model's quantities without adopting them blindly\n\nThe teacher model says 5–10 cm compost/manure, mixed through 15 cm of soil, and 7–10 cm straw/wood-chip mulch. The bank model says 15–20 cm incorporation and 5–10 cm mulch for a different sandy, alkaline scenario.\n\nThese are different source examples, not a validated prescription for the pilot plot.\n\nAt 100 m², a 5 cm surface layer alone occupies 5 m³; a 10 cm layer occupies 10 m³ before shrinkage, density and mixing, demonstrating why material supply and analysis matter.\n\nAsk for product EC, nutrients, maturity, target crop, soil results, budget and safe incorporation depth.\n\nRetain both original example ranges in the learning record; obtain a documented site specification before field application.", "Preserve the model's quantities without adopting them blindly\n\nThe teacher model says five to ten centimetres compost, manure, mixed through fifteen centimetres of soil, and seven to ten centimetres straw, wood-chip mulch. The bank model says fifteen to twenty centimetres incorporation and five to ten centimetres mulch for a different sandy, alkaline scenario.\n\nThese are different source examples, not a validated prescription for the pilot plot.\n\nAt one hundred square metres, a surface layer five centimetres thick alone occupies five cubic metres; a layer ten centimetres thick occupies ten cubic metres before shrinkage, density and mixing, demonstrating why material supply and analysis matter.\n\nAsk for product E C, nutrients, maturity, target crop, soil results, budget and safe incorporation depth.\n\nRetain both original example ranges in the learning record; obtain a documented site specification before field application.")], 'it': [('Conserva le quantità senza applicarle alla cieca\n\nModello del docente: 5–10 cm di compost/letame miscelati nei primi 15 cm e, dopo la semina, 7–10 cm di paglia/cippato. Modello diverso della banca: primi 15–20 cm e pacciamatura 5–10 cm per un altro suolo sabbioso e alcalino.\n\nSono esempi diversi, non una prescrizione verificata per il terreno pilota.\n\nSu 100 m² lo strato di 5 cm occupa 5 m³ e quello di 10 cm 10 m³, prima di densità, assestamento e miscelazione: servono dati su prodotto e disponibilità.\n\nChiedi EC del prodotto, nutrienti, maturità, coltura, analisi del suolo, budget e profondità sicura.\n\nMantieni entrambi gli intervalli negli esempi e ottieni una specifica locale documentata prima dell’applicazione.', 'Conserva le quantità senza applicarle alla cieca\n\nModello del docente: cinque a dieci centimetri di compost, letame miscelati nei primi quindici centimetri e, dopo la semina, sette a dieci centimetri di paglia, cippato. Modello diverso della banca: primi quindici a venti centimetri e pacciamatura cinque a dieci centimetri per un altro suolo sabbioso e alcalino.\n\nSono esempi diversi, non una prescrizione verificata per il terreno pilota.\n\nSu cento metri quadrati lo strato di cinque centimetri occupa cinque metri cubi e quello di dieci centimetri dieci metri cubi, prima di densità, assestamento e miscelazione: servono dati su prodotto e disponibilità.\n\nChiedi e ci del prodotto, nutrienti, maturità, coltura, analisi del suolo, budget e profondità sicura.\n\nMantieni entrambi gli intervalli negli esempi e ottieni una specifica locale documentata prima dell’applicazione.'), ('La terza tecnica dipende dal luogo\n\nPer un caso sabbioso e alcalino uno studente propone compost, paglia, una copertura di veccia e alberi frangivento.\n\nVerifica qualità e salinità del compost prima della dose: non presumere correzione di pH o sali.\n\nLa copertura può ridurre evaporazione, ma materiale e spessore dipendono da coltura e irrigazione.\n\nVeccia e frangivento richiedono acqua e spazio; in un pilota di 100 m² molto arido potrebbero esserci alternative migliori.\n\nDescrivi tre tecniche diverse con ragioni condizionate e spiega perché una potrebbe essere rinviata.', 'La terza tecnica dipende dal luogo\n\nPer un caso sabbioso e alcalino uno studente propone compost, paglia, una copertura di veccia e alberi frangivento.\n\nVerifica qualità e salinità del compost prima della dose: non presumere correzione di pi acca o sali.\n\nLa copertura può ridurre evaporazione, ma materiale e spessore dipendono da coltura e irrigazione.\n\nVeccia e frangivento richiedono acqua e spazio; in un pilota di cento metri quadrati molto arido potrebbero esserci alternative migliori.\n\nDescrivi tre tecniche diverse con ragioni condizionate e spiega perché una potrebbe essere rinviata.'), ('Orzo e sorgo come candidate condizionate\n\nUno studente propone orzo per relativa tolleranza salina e sorgo per adattamento alla siccità nel piccolo appezzamento.\n\nIn una fonte FAO l’orzo ha tolleranza relativamente alta come cereale, ma le piantine possono essere meno tolleranti.\n\nIl sorgo può adattarsi alla siccità ed è solo moderatamente tollerante al sale nella stessa comparazione: sono motivazioni differenti.\n\nPrima della scelta verifica ECe, ECw, cultivar, stagione, sementi, acqua iniziale e destinazione del raccolto.\n\nCoppia preliminare motivata, non promessa di resa; fagiolo dall’occhio, quinoa, barbabietola e altre candidate richiedono verifiche proprie.', 'Orzo e sorgo come candidate condizionate\n\nUno studente propone orzo per relativa tolleranza salina e sorgo per adattamento alla siccità nel piccolo appezzamento.\n\nIn una fonte FAO l’orzo ha tolleranza relativamente alta come cereale, ma le piantine possono essere meno tolleranti.\n\nIl sorgo può adattarsi alla siccità ed è solo moderatamente tollerante al sale nella stessa comparazione: sono motivazioni differenti.\n\nPrima della scelta verifica e ci e, e ci doppia vu, cultivar, stagione, sementi, acqua iniziale e destinazione del raccolto.\n\nCoppia preliminare motivata, non promessa di resa; fagiolo dall’occhio, quinoa, barbabietola e altre candidate richiedono verifiche proprie.'), ('Uno schema difendibile di una pagina\n\nAppezzamento franco-sabbioso di 100 m²: sostanza organica 0,8%, EC 3,5 dS/m senza metodo e pozzo descritto come leggermente salino.\n\nProblema 1: la bassa sostanza organica misurata può limitare la riserva; analizza suolo e prodotto prima della dose.\n\nProblema 2: possibile stress salino da valutare con ECe coerente, profondità e drenaggio.\n\nProblema 3: il pozzo richiede ECw e analisi ionica prima del piano irriguo o di lavaggio.\n\nDisponi in una pagina analisi, azioni condizionate, colture candidate e monitoraggio.\n\nNon stabilire una coltura o una dose definitiva di compost/lisciviazione dal referto incompleto.', 'Uno schema difendibile di una pagina\n\nAppezzamento franco-sabbioso di cento metri quadrati: sostanza organica zero virgola otto per cento, e ci tre virgola cinque decisiemens per metro senza metodo e pozzo descritto come leggermente salino.\n\nProblema uno: la bassa sostanza organica misurata può limitare la riserva; analizza suolo e prodotto prima della dose.\n\nProblema due: possibile stress salino da valutare con e ci e coerente, profondità e drenaggio.\n\nProblema tre: il pozzo richiede e ci doppia vu e analisi ionica prima del piano irriguo o di lavaggio.\n\nDisponi in una pagina analisi, azioni condizionate, colture candidate e monitoraggio.\n\nNon stabilire una coltura o una dose definitiva di compost, lisciviazione dal referto incompleto.')], 'de': [('Dritte Technik nach Standort wählen\n\nFür einen sandig-alkalischen Fall werden Kompost, Stroh, Wicken-Zwischenfrucht und Baum-Windschutz vorgeschlagen.\n\nKompostqualität und Salz vor der Menge prüfen; keine automatische pH- oder Salzkorrektur annehmen.\n\nMulch kann Verdunstung senken, doch Material und Stärke hängen von Kultur und Bewässerung ab.\n\nWicke und Bäume brauchen Wasser und Raum; auf sehr trockenen 100 m² können andere Optionen besser sein.\n\nDrei verschiedene Techniken bedingt begründen und erklären, warum eine verschoben werden kann.', 'Dritte Technik nach Standort wählen\n\nFür einen sandig-alkalischen Fall werden Kompost, Stroh, Wicken-Zwischenfrucht und Baum-Windschutz vorgeschlagen.\n\nKompostqualität und Salz vor der Menge prüfen; keine automatische Pe Ha- oder Salzkorrektur annehmen.\n\nMulch kann Verdunstung senken, doch Material und Stärke hängen von Kultur und Bewässerung ab.\n\nWicke und Bäume brauchen Wasser und Raum; auf sehr trockenen einhundert Quadratmetern können andere Optionen besser sein.\n\nDrei verschiedene Techniken bedingt begründen und erklären, warum eine verschoben werden kann.'), ('Ein vertretbarer Einseiter\n\n100 m² sandiger Lehm mit 0,8 % organischer Substanz, EC 3,5 dS/m ohne Methode und als leicht salzhaltig beschriebenem Brunnenwasser.\n\nProblem 1: Gemessen geringer Humus kann die Speicherung begrenzen; Boden und Material vor der Menge prüfen.\n\nProblem 2: Möglicher Salzstress braucht methodisch passendes ECe, Probentiefe und Entwässerungsbefund.\n\nProblem 3: Brunnenwasser braucht ECw und Ionenanalyse vor Bewässerung oder Auswaschung.\n\nPrüfungen, bedingte Maßnahmen, Kulturkandidaten und Kontrolle auf einer Seite anordnen.\n\nAus dem lückenhaften Bericht weder Kultur noch Kompost- oder Auswaschungsmenge endgültig festlegen.', 'Ein vertretbarer Einseiter\n\neinhundert Quadratmeter sandiger Lehm mit null Komma acht Prozent organischer Substanz, E Ce drei Komma fünf Dezisiemens pro Meter ohne Methode und als leicht salzhaltig beschriebenem Brunnenwasser.\n\nProblem eins: Gemessen geringer Humus kann die Speicherung begrenzen; Boden und Material vor der Menge prüfen.\n\nProblem zwei: Möglicher Salzstress braucht methodisch passendes E Ce E, Probentiefe und Entwässerungsbefund.\n\nProblem drei: Brunnenwasser braucht E Ce We und Ionenanalyse vor Bewässerung oder Auswaschung.\n\nPrüfungen, bedingte Maßnahmen, Kulturkandidaten und Kontrolle auf einer Seite anordnen.\n\nAus dem lückenhaften Bericht weder Kultur noch Kompost- oder Auswaschungsmenge endgültig festlegen.'), ('Gerste und Sorghum nur bedingt\n\nEin Lernender schlägt Gerste wegen relativer Salzverträglichkeit und Sorghum wegen Trockenheitsanpassung auf der kleinen Fläche vor.\n\nGerste ist in einer FAO-Quelle als Getreide relativ salztolerant; Keimlinge können empfindlicher sein.\n\nSorghum kann trockenheitsangepasst sein, ist im selben Vergleich aber nur mäßig salztolerant; das sind unterschiedliche Gründe.\n\nVor der Entscheidung ECe/ECw, Sorte, Saison, Saatgut, Etablierungswasser und Nutzung prüfen.\n\nBegründetes vorläufiges Paar, keine Ertragsgarantie; Augenbohne, Quinoa, Zuckerrübe und andere Kandidaten brauchen eigene Prüfungen.', 'Gerste und Sorghum nur bedingt\n\nEin Lernender schlägt Gerste wegen relativer Salzverträglichkeit und Sorghum wegen Trockenheitsanpassung auf der kleinen Fläche vor.\n\nGerste ist in einer FAO-Quelle als Getreide relativ salztolerant; Keimlinge können empfindlicher sein.\n\nSorghum kann trockenheitsangepasst sein, ist im selben Vergleich aber nur mäßig salztolerant; das sind unterschiedliche Gründe.\n\nVor der Entscheidung E Ce E, E Ce We, Sorte, Saison, Saatgut, Etablierungswasser und Nutzung prüfen.\n\nBegründetes vorläufiges Paar, keine Ertragsgarantie; Augenbohne, Quinoa, Zuckerrübe und andere Kandidaten brauchen eigene Prüfungen.'), ('Originalzahlen behalten, nicht blind anwenden\n\nLehrermodell: 5–10 cm Kompost/Mist in den oberen 15 cm, nach Pflanzung 7–10 cm Stroh/Holzmulch. Anderes Modell: Einarbeitung in obere 15–20 cm und 5–10 cm Mulch für einen anderen sandig-alkalischen Fall.\n\nVerschiedene Quellenbeispiele, keine validierte Verordnung für die Parzelle.\n\nAuf 100 m² belegen 5 cm bereits 5 m³ und 10 cm 10 m³, vor Dichte, Setzung und Mischung; deshalb Produktanalyse und Lieferbarkeit prüfen.\n\nProdukt-EC, Nährstoffe, Reife, Kultur, Bodenbefund, Kosten und sichere Einarbeitungstiefe erfragen.\n\nBeide Originalbereiche als Lernbeispiele behalten; vor Feldanwendung eine dokumentierte lokale Vorgabe einholen.', 'Originalzahlen behalten, nicht blind anwenden\n\nLehrermodell: fünf bis zehn Zentimeter Kompost, Mist in den oberen fünfzehn Zentimetern, nach Pflanzung sieben bis zehn Zentimeter Stroh, Holzmulch. Anderes Modell: Einarbeitung in obere fünfzehn bis zwanzig Zentimeter und fünf bis zehn Zentimeter Mulch für einen anderen sandig-alkalischen Fall.\n\nVerschiedene Quellenbeispiele, keine validierte Verordnung für die Parzelle.\n\nAuf einhundert Quadratmetern belegen fünf Zentimeter bereits fünf Kubikmeter und zehn Zentimeter zehn Kubikmeter, vor Dichte, Setzung und Mischung; deshalb Produktanalyse und Lieferbarkeit prüfen.\n\nProdukt-E Ce, Nährstoffe, Reife, Kultur, Bodenbefund, Kosten und sichere Einarbeitungstiefe erfragen.\n\nBeide Originalbereiche als Lernbeispiele behalten; vor Feldanwendung eine dokumentierte lokale Vorgabe einholen.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s309-gated-audio-20261023-r1'
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
            print('Frozen16 S309 protected full cases verified; zero provider calls.')
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
