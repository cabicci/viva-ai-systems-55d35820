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
IDS = ('S3-06-ar-EG-R01-r1', 'S3-06-ar-EG-R02-r1', 'S3-06-ar-EG-R03-r1', 'S3-06-ar-EG-R04-r1', 'S3-06-ar-EG-R05-r1', 'S3-06-ar-EG-R06-r1', 'S3-06-en-R01-r1', 'S3-06-en-R02-r1', 'S3-06-en-R03-r1', 'S3-06-en-R04-r1', 'S3-06-en-R05-r1', 'S3-06-en-R06-r1', 'S3-06-it-R01-r1', 'S3-06-it-R02-r1', 'S3-06-it-R03-r1', 'S3-06-it-R04-r1', 'S3-06-it-R05-r1', 'S3-06-it-R06-r1', 'S3-06-de-R01-r1', 'S3-06-de-R02-r1', 'S3-06-de-R03-r1', 'S3-06-de-R04-r1', 'S3-06-de-R05-r1', 'S3-06-de-R06-r1')
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
    assert(req['scope'],req['stepId'])==('S306_TWENTYFOUR_READING_CURRENT_SOURCE_FOUR_FIXED_LOCALE_LANES_THIN_DIAGNOSTICS','S3-06')
    assert req['executionOrder']=='FOUR_FIXED_INDEPENDENT_LOCALE_LANES_SIX_TTS_IMMEDIATE_UPLOADS_THEN_THIN_DIAGNOSTICS'
    assert(req['maximumTTSCalls'],req['maximumBlindAudioReviewCalls'],req['maximumASRInvocations'],req['maximumMetadataGETCalls'],req['automaticRetries'],req['automaticReruns'])==(24,24,24,8,0,0)
    assert(req['repository'],req['repositoryId'],req['branch'])==('cabicci/viva-ai-systems-55d35820',1272666418,'refs/heads/work/soil-s306-readings-audio-20261023-r1')
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
        group=u['semanticGroup'];assert(u['speakerId'],u['voice'],u['model'])=={'R01': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R02': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R03': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R04': ('B', 'Kore', 'gemini-3.8-flash-tts'), 'R05': ('A', 'Charon', 'gemini-3.8-flash-tts'), 'R06': ('B', 'Kore', 'gemini-3.8-flash-tts')}[group]
        for k in ['spokenText','displayText','captionText','sourceBindings','spokenAdaptationChanges','delivery','sourceWholeFileSHA256']:assert u[k]==plan[k]
        assert[b['pointer']for b in u['sourceBindings']]=={'R01': ['/reading/0/paragraphs/0', '/reading/0/paragraphs/1'], 'R02': ['/reading/1/paragraphs/0', '/reading/1/paragraphs/1'], 'R03': ['/reading/2/paragraphs/0', '/reading/2/paragraphs/1'], 'R04': ['/reading/3/paragraphs/0', '/reading/3/paragraphs/1'], 'R05': ['/reading/4/paragraphs/0', '/reading/4/paragraphs/1'], 'R06': ['/reading/5/paragraphs/0']}[group]
        assert all(hashlib.sha256(b['text'].encode()).hexdigest()==b['sha256']for b in u['sourceBindings'])
        assert u['displayText']==u['captionText']==u['scientificMeaning']=='\n\n'.join(b['text']for b in u['sourceBindings'])
        reconstructed=u['displayText']
        allowedByLocale={'ar-EG': [('اضغط حفنة ممثلة ضغط متماسك كذا مرة، ولاحظ هل الحبيبات منفصلة، أو اتكوّرت كرة ضعيفة أو متماسكة، أو عملت شريط، أو غمق لونها، أو سابت أثر على اليد، أو خرج منها ماء حر. العينة الموحلة اللي المياه بتقطّر منها رطبة جدًا، لكن تكوّر التربة يتغير حسب القوام. الرمل اللومي (loamy sand)، يعني رمل مع حبيبات أدق، ممكن يعمل كرة ضعيفة وهو رطب، والطين الناعم ممكن يفضل متماسك وهو ناشف نسبيًا. قاعدتا «كل كرة مناسبة» و«من غير كرة تبقى جافة» ما ينفعوش لكل تربة.\n\nقارن العينة بدليل شكل وملمس يناسب قوامها، وبعينات من أعماق تانية وحالة المحصول. لو التربة مبتلة جدًا، ما تزودش ماء علشان توصل لشكل كرة معين؛ سجّل حالتها واتبع طريقة المدرّب الآمنة لإعادة تجهيز عينة التدريب. وما تكتبش «جافة جدًا» لمجرد إن البطاقة المطبوعة متوقعة ده.', 'اضغط حفنة ممثلة ضغط متماسك كذا مرة، ولاحظ هل الحبيبات منفصلة، أو اتكوّرت كرة ضعيفة أو متماسكة، أو عملت شريط، أو غمق لونها، أو سابت أثر على اليد، أو خرج منها ماء حر. العينة الموحلة اللي المياه بتقطّر منها رطبة جدًا، لكن تكوّر التربة يتغير حسب القوام. الرمل اللومي، يعني رمل مع حبيبات أدق، ممكن يعمل كرة ضعيفة وهو رطب، والطين الناعم ممكن يفضل متماسك وهو ناشف نسبيًا. قاعدتا «كل كرة مناسبة» و«من غير كرة تبقى جافة» ما ينفعوش لكل تربة.\n\nقارن العينة بدليل شكل وملمس يناسب قوامها، وبعينات من أعماق تانية وحالة المحصول. لو التربة مبتلة جدًا، ما تزودش ماء علشان توصل لشكل كرة معين؛ سجّل حالتها واتبع طريقة المدرّب الآمنة لإعادة تجهيز عينة التدريب. وما تكتبش «جافة جدًا» لمجرد إن البطاقة المطبوعة متوقعة ده.'), ('بطاقة التقييم بتوفر متر من أنبوب بولي إيثيلين متوافق، وثلاث نقاطات، وأداة تخريم مناسبة، وسدادة نهاية ووصلة مصدر. الأنبوب بينقل الماء؛ كل نقاطة تطلّعه قرب النبات المقصود؛ الأداة بتعمل ثقب يناسب الطقم؛ السدادة تقفل آخر الخط؛ والوصلة تربطه بالتغذية.\n\nالتغذية الحقيقية محتاجة كمان للتحكم في جودة الماء. حدد الفلتر قبل الخط وأي أجزاء ضبط ضغط أو عداد يطلبها الطقم المختار، وراجع تعليمات المصنع مع المدرّب. مقاسات الثقوب والضغط والتدفق بتختلف حسب المنتج؛ الكورس ما بيخترعش رقم ثابتًا، ولا بيوصل الخط بمصدر شغال غير متحقق منه.', 'بطاقة التقييم بتوفر متر من أنبوب بولي إيثيلين متوافق، وتلات نقاطات، وأداة تخريم مناسبة، وسدادة نهاية ووصلة مصدر. الأنبوب بينقل الماء؛ كل نقاطة تطلّعه قرب النبات المقصود؛ الأداة بتعمل ثقب يناسب الطقم؛ السدادة تقفل آخر الخط؛ والوصلة تربطه بالتغذية.\n\nالتغذية الحقيقية محتاجة كمان للتحكم في جودة الماء. حدد الفلتر قبل الخط وأي أجزاء ضبط ضغط أو عداد يطلبها الطقم المختار، وراجع تعليمات المصنع مع المدرّب. مقاسات الثقوب والضغط والتدفق بتختلف حسب المنتج؛ الكورس ما بيخترعش رقم ثابت، ولا بيوصل الخط بمصدر شغال غير متحقق منه.'), ('تدريب 3D يساعدك ترتب الأجزاء وتتدرّب على القرار. مؤشر الجاهزية البصري أو الضغطات لإضافة ماء في المحاكاة أدوات تدريب، مش نسبة رطوبة حقل مقاسة. النشاط الأونلاين يجهزك تشرح العملية؛ شهادة مهارة أخذ العينة وتركيب الخط تحتاج ملاحظة فردية من المدرّب.', 'التدريب الأونلاين يساعدك ترتب الأجزاء وتتدرّب على القرار. مؤشر الجاهزية البصري أو الضغطات لإضافة ماء في المحاكاة أدوات تدريب، مش نسبة رطوبة حقل مقاسة. النشاط الأونلاين يجهزك تشرح العملية؛ شهادة مهارة أخذ العينة وتركيب الخط تحتاج ملاحظة فردية من المدرّب.'), ('على طاولة عمل من غير ضغط، رتب الأجزاء وسمّها. قِس الأنبوب المتوافق بطول متر. علّم ثلاثة مواضع على أساس تباعد النباتات وشكل بلل التربة حوالين النقاطات؛ ما تفترضش مسافات متساوية لو النباتات مش متساوية. بأداة التخريم المعتمدة من المدرّب، اعمل ثلاثة ثقوب نظيفة بعيد عن إيدك وثبّت النقاطات المطابقة جيدًا. ركّب السدادة والوصلة حسب دليل الطقم.\n\nالمدرّب يتحقق من الفلتر وتنظيم الضغط والتغذية الآمنة وحدود المنتج قبل اختبار ماء منضبط. لاحظ خروج الماء من الثلاث نقاطات والوصلات، ودور على تسريب أو انسداد. افصل التغذية قبل تعديل أي جزء، وأعد الاختبار بعد الإصلاح، ونظف الطاولة والمكان. شكل الخط المكتمل وحده مش دليل إنه شغال.', 'على طاولة عمل من غير ضغط، رتب الأجزاء وسمّها. قيس الأنبوب المتوافق بطول متر. علّم تلات مواضع على أساس تباعد النباتات وشكل بلل التربة حوالين النقاطات؛ ما تفترضش مسافات متساوية لو النباتات مش متساوية. بأداة التخريم المعتمدة من المدرّب، اعمل تلات ثقوب نظيفة بعيد عن إيدك وثبّت النقاطات المطابقة جيدًا. ركّب السدادة والوصلة حسب دليل الطقم.\n\nالمدرّب يتحقق من الفلتر وتنظيم الضغط والتغذية الآمنة وحدود المنتج قبل اختبار ماء منضبط. لاحظ خروج الماء من التلات نقاطات والوصلات، ودور على تسريب أو انسداد. افصل التغذية قبل تعديل أي جزء، وأعد الاختبار بعد الإصلاح، ونظف الطاولة والمكان. شكل الخط المكتمل وحده مش دليل إنه شغال.'), ('قرار الري بيعتمد على المحصول والتربة والجو. في تمرين صندوق الزراعة، ممكن المدرّب يحدد عمق عينة نحو ١٠–١٥ سم زي بطاقة الأداء. في الحقل الحقيقي، حدد عمق الجذور النشطة وخد عينات من أكتر من عمق ومكان مناسب لو بتقيّم المنطقة كلها. تراب السطح الجاف لوحده مش قياس لمنطقة الجذور.\n\nسجّل التاريخ والمكان والعمق والقوام التقريبي والمطر أو الري الأخير وحالة العينة الفعلية قبل التفسير. طريقة الملمس والشكل تقدير بيتحسن بالممارسة، مش نسبة رقمية ولا بديل عن قياس مُعايَر لما يكون مطلوب.', 'قرار الري بيعتمد على المحصول والتربة والجو. في تمرين صندوق الزراعة، ممكن المدرّب يحدد عمق عينة نحو عشرة لخمستاشر سنتيمتر زي بطاقة الأداء. في الحقل الحقيقي، حدد عمق الجذور النشطة وخد عينات من أكتر من عمق ومكان مناسب لو بتقيّم المنطقة كلها. تراب السطح الجاف لوحده مش قياس لمنطقة الجذور.\n\nسجّل التاريخ والمكان والعمق والقوام التقريبي والمطر أو الري الأخير وحالة العينة الفعلية قبل التفسير. طريقة الملمس والشكل تقدير بيتحسن بالممارسة، مش نسبة رقمية ولا بديل عن قياس مُعايَر لما يكون مطلوب.')], 'en': [("A 3D rehearsal can help you place components and practise decisions. A visual readiness meter or clicks to add water in that rehearsal are simulation controls, not a measured field-moisture percentage. The online activity can prepare you to explain the process; only the trainer's individual observation can certify sampling and assembly skills.", "An online rehearsal can help you place components and practise decisions. A visual readiness meter or clicks to add water in that rehearsal are simulation controls, not a measured field-moisture percentage. The online activity can prepare you to explain the process; only the trainer's individual observation can certify sampling and assembly skills."), ("An irrigation recommendation depends on crop, soil and weather. For the supervised planter-box exercise, a trainer may indicate a sampling depth of about 10–15 cm as the process card does. In a real field, identify the crop's active rooting depth and sample at more than one suitable depth and location when assessing the whole root zone. Surface dust alone is not a root-zone measurement.\n\nRecord date, position, depth, estimated texture, recent rain or watering and the actual sample condition before interpreting it. Moisture by feel and appearance is an estimate developed through practice, not a digital percentage or a substitute for a calibrated measurement when one is needed.", "An irrigation recommendation depends on crop, soil and weather. For the supervised planter-box exercise, a trainer may indicate a sampling depth of about ten to fifteen centimetres as the process card does. In a real field, identify the crop's active rooting depth and sample at more than one suitable depth and location when assessing the whole root zone. Surface dust alone is not a root-zone measurement.\n\nRecord date, position, depth, estimated texture, recent rain or watering and the actual sample condition before interpreting it. Moisture by feel and appearance is an estimate developed through practice, not a digital percentage or a substitute for a calibrated measurement when one is needed."), ("Squeeze a representative handful firmly several times and note whether grains stay separate, form a weak or firm ball, smear or ribbon, darken, stain the hand, or release free water. A muddy sample with water dripping is very wet, but the meaning of ball formation differs with texture. A loamy sand, a sand-dominant texture with some finer material, can form a weak ball while moist; a fine-textured clay can retain a ball even when relatively dry. 'Ball = ideal' and 'no ball = dry' are unsafe universal rules.\n\nCompare the sample with a texture-specific feel-and-appearance guide, other root-zone depths and the crop's condition. If the soil is very wet, do not keep adding water to force a desired ball; record the condition and follow the trainer's safe method for resetting a teaching sample. Never claim that the sample is 'too dry' merely because a printed process card predicts it.", "Squeeze a representative handful firmly several times and note whether grains stay separate, form a weak or firm ball, smear or ribbon, darken, stain the hand, or release free water. A muddy sample with water dripping is very wet, but the meaning of ball formation differs with texture. A loamy sand, a sand-dominant texture with some finer material, can form a weak ball while moist; a fine-textured clay can retain a ball even when relatively dry. 'Ball equals ideal' and 'no ball equals dry' are unsafe universal rules.\n\nCompare the sample with a texture-specific feel-and-appearance guide, other root-zone depths and the crop's condition. If the soil is very wet, do not keep adding water to force a desired ball; record the condition and follow the trainer's safe method for resetting a teaching sample. Never claim that the sample is 'too dry' merely because a printed process card predicts it.")], 'it': [('Comprimi saldamente più volte una manciata rappresentativa. Osserva se i granuli restano separati, si forma una palla debole o salda, compare un nastro, il colore scurisce, la mano si macchia o esce acqua libera. Un campione fangoso che gocciola è molto bagnato, ma il significato della palla cambia con la tessitura. Una sabbia franca (loamy sand), sabbia con una quota di particelle fini, può formare una palla debole da umida; un’argilla fine può mantenere una palla anche da relativamente asciutta. «Palla = ideale» e «nessuna palla = secco» non sono regole universali.\n\nConfronta il campione con una guida tattile e visiva specifica per tessitura, con altri livelli della zona radicale e con lo stato della coltura. Se è molto bagnato, non aggiungere acqua per ottenere una palla desiderata: registra la condizione e segui il metodo sicuro dell’istruttore per ripristinare un campione didattico. Non dichiarare «troppo secco» solo perché lo prevede una scheda stampata.', 'Comprimi saldamente più volte una manciata rappresentativa. Osserva se i granuli restano separati, si forma una palla debole o salda, compare un nastro, il colore scurisce, la mano si macchia o esce acqua libera. Un campione fangoso che gocciola è molto bagnato, ma il significato della palla cambia con la tessitura. Una sabbia franca (loamy sand), sabbia con una quota di particelle fini, può formare una palla debole da umida; un’argilla fine può mantenere una palla anche da relativamente asciutta. «Palla uguale a ideale» e «nessuna palla uguale a secco» non sono regole universali.\n\nConfronta il campione con una guida tattile e visiva specifica per tessitura, con altri livelli della zona radicale e con lo stato della coltura. Se è molto bagnato, non aggiungere acqua per ottenere una palla desiderata: registra la condizione e segui il metodo sicuro dell’istruttore per ripristinare un campione didattico. Non dichiarare «troppo secco» solo perché lo prevede una scheda stampata.'), ('La scelta irrigua dipende da coltura, terreno e clima. Nell’esercizio con la fioriera, l’istruttore può indicare circa 10–15 cm come nella scheda pratica. In pieno campo identifica la profondità radicale attiva e campiona più profondità e punti opportuni se valuti l’intera zona. La sola polvere superficiale non misura la zona radicale.\n\nPrima di interpretare annota data, punto, profondità, tessitura stimata, pioggia o irrigazione recente e condizione reale del campione. Il metodo tattile e visivo è una stima che migliora con la pratica, non una percentuale digitale né un sostituto di una misura calibrata quando necessaria.', 'La scelta irrigua dipende da coltura, terreno e clima. Nell’esercizio con la fioriera, l’istruttore può indicare da dieci a quindici centimetri circa come nella scheda pratica. In pieno campo identifica la profondità radicale attiva e campiona più profondità e punti opportuni se valuti l’intera zona. La sola polvere superficiale non misura la zona radicale.\n\nPrima di interpretare annota data, punto, profondità, tessitura stimata, pioggia o irrigazione recente e condizione reale del campione. Il metodo tattile e visivo è una stima che migliora con la pratica, non una percentuale digitale né un sostituto di una misura calibrata quando necessaria.'), ('Un esercizio 3D aiuta a collocare i componenti e a provare le decisioni. Indicatore visivo di prontezza e clic per aggiungere acqua nella simulazione sono comandi didattici, non percentuali misurate di umidità in campo. L’attività online prepara la spiegazione; solo l’osservazione individuale dell’istruttore certifica prelievo e montaggio.', 'Un esercizio online aiuta a collocare i componenti e a provare le decisioni. Indicatore visivo di prontezza e clic per aggiungere acqua nella simulazione sono comandi didattici, non percentuali misurate di umidità in campo. L’attività online prepara la spiegazione; solo l’osservazione individuale dell’istruttore certifica prelievo e montaggio.')], 'de': [('Drücke eine repräsentative Handvoll mehrmals fest zusammen. Bleiben Körner getrennt, entsteht eine schwache oder feste Kugel, ein Band, dunklere Farbe, ein Fleck an der Hand oder freies Wasser? Schlamm mit austretendem Wasser ist sehr nass; die Aussagekraft der Kugel hängt aber von der Textur ab. Lehmiger Sand (loamy sand), überwiegend Sand mit feineren Bestandteilen, kann feucht eine schwache Kugel bilden; feiner Ton kann sogar relativ trocken eine Kugel behalten. „Kugel = ideal“ und „keine Kugel = trocken“ gelten nicht überall.\n\nVergleiche mit einer texturspezifischen Tast- und Bildanleitung, anderen Wurzeltiefen und dem Zustand der Kultur. Ist die Probe sehr nass, gieße nicht weiter, nur um eine gewünschte Kugel zu erzeugen. Dokumentiere den Zustand und folge der sicheren Anleitung der Lehrkraft zum Zurücksetzen einer Übungsprobe. Behaupte nicht „zu trocken“, nur weil die gedruckte Karte es vorwegnimmt.', 'Drücke eine repräsentative Handvoll mehrmals fest zusammen. Bleiben Körner getrennt, entsteht eine schwache oder feste Kugel, ein Band, dunklere Farbe, ein Fleck an der Hand oder freies Wasser? Schlamm mit austretendem Wasser ist sehr nass; die Aussagekraft der Kugel hängt aber von der Textur ab. Lehmiger Sand (loamy sand), überwiegend Sand mit feineren Bestandteilen, kann feucht eine schwache Kugel bilden; feiner Ton kann sogar relativ trocken eine Kugel behalten. „Kugel gleich ideal“ und „keine Kugel gleich trocken“ gelten nicht überall.\n\nVergleiche mit einer texturspezifischen Tast- und Bildanleitung, anderen Wurzeltiefen und dem Zustand der Kultur. Ist die Probe sehr nass, gieße nicht weiter, nur um eine gewünschte Kugel zu erzeugen. Dokumentiere den Zustand und folge der sicheren Anleitung der Lehrkraft zum Zurücksetzen einer Übungsprobe. Behaupte nicht „zu trocken“, nur weil die gedruckte Karte es vorwegnimmt.'), ('Eine 3D-Übung hilft beim Platzieren von Bauteilen und beim Entscheiden. Ein visueller Bereitschaftsbalken oder Klicks zum Wasserhinzufügen sind Simulationssteuerungen, keine gemessenen Feldfeuchte-Prozentwerte. Online kannst du den Vorgang erklären üben; nur die Einzelbeobachtung der Lehrkraft bestätigt Entnahme- und Montagefertigkeiten.', 'Eine Online-Übung hilft beim Platzieren von Bauteilen und beim Entscheiden. Ein visueller Bereitschaftsbalken oder Klicks zum Wasserhinzufügen sind Simulationssteuerungen, keine gemessenen Feldfeuchte-Prozentwerte. Online kannst du den Vorgang erklären üben; nur die Einzelbeobachtung der Lehrkraft bestätigt Entnahme- und Montagefertigkeiten.'), ('Eine Bewässerungsentscheidung hängt von Kultur, Boden und Wetter ab. Beim betreuten Pflanzkasten darf die Lehrkraft etwa 10–15 cm Probentiefe vorgeben, wie es die Arbeitskarte tut. Im Feld bestimme die aktive Durchwurzelungstiefe und untersuche geeignete weitere Tiefen und Stellen, wenn du den gesamten Wurzelraum beurteilst. Oberflächlicher Staub ist kein Messwert für die Wurzelzone.\n\nNotiere vor der Deutung Datum, Ort, Tiefe, geschätzte Textur, kürzlichen Regen oder Gießen und den tatsächlichen Zustand der Probe. Fühlen und Betrachten ist eine mit Übung verbesserte Schätzung, kein digitaler Prozentwert und bei Bedarf kein Ersatz für eine kalibrierte Messung.', 'Eine Bewässerungsentscheidung hängt von Kultur, Boden und Wetter ab. Beim betreuten Pflanzkasten darf die Lehrkraft etwa zehn bis fünfzehn Zentimeter Probentiefe vorgeben, wie es die Arbeitskarte tut. Im Feld bestimme die aktive Durchwurzelungstiefe und untersuche geeignete weitere Tiefen und Stellen, wenn du den gesamten Wurzelraum beurteilst. Oberflächlicher Staub ist kein Messwert für die Wurzelzone.\n\nNotiere vor der Deutung Datum, Ort, Tiefe, geschätzte Textur, kürzlichen Regen oder Gießen und den tatsächlichen Zustand der Probe. Fühlen und Betrachten ist eine mit Übung verbesserte Schätzung, kein digitaler Prozentwert und bei Bedarf kein Ersatz für eine kalibrierte Messung.')]}
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
    assert os.environ.get('GITHUB_REF')=='refs/heads/work/soil-s306-readings-audio-20261023-r1'
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
    write(OUT/'summary.json',{'actualInvocationsStarted':actual,'status':'FAILED_OR_PARTIAL_DIAGNOSTICS_PRESERVED_NO_RETRY' if failed else 'ALL_SIX_LANE_DIAGNOSTIC_OUTCOMES_COMPLETE_NOT_ADOPTED','units':rows,'localeLane':lane(),'maximumTTSPerLane':6,'maximumBlindReviewPerLane':6,'maximumASRPerLane':6,'maximumTTSAggregate':24,'maximumBlindAggregate':24,'maximumASRAggregate':24,'maximumMetadataGETAggregate':8,'automaticRetries':0,'sourceAudioModified':False,'assemblyPerformed':False,'humanListeningApproved':False,'perUnitDiagnosticFailureIsolation':True,'actualJoinsAndTimbreRootReviewRequiredBeforeIntegration':True})
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
