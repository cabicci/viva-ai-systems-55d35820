"""Bounded self-review, supported source-coverage repair and portable continuation state."""
from batch_common import *
from decimal import Decimal as D
from datetime import datetime,timezone
import re

now=datetime.now(timezone.utc).isoformat()
# These independent expected values are not imported from the producer or browser calculator.
calculations=[('S01',D('.12')*D('.250'),D('.030')),('S02', (D('.20')*D('.15')+D('.05')*D('.40'))/D('50'),D('.001')),
('S02-transfer',D('.08')*D('.25')/D('40'),D('.00050')),('S05-lower',(D('.03')+D('.02'))/4,D('.0125')),('S05-upper',(D('.03')+D('.02')+D('.01')+D('.01'))/4,D('.0175')),
('S06-first',D('.020')/D('.010'),D('2')),('S06-after',D('.020')/D('.020'),D('1')),('S07-BCF',D('20')/D('.10'),D('200')),('S07-Css',D('200')*D('.002'),D('.400')),
('S07-BSAF',(D('.20')/D('.05'))/(D('.40')/D('.02')),D('.2')),('S08-MATC',(D('.04')*D('.16')).sqrt(),D('.08')),('S08-ACR',D('.80')/D('.08'),D('10')),
('S09-log-ratio',D(10)**3/(D(10)**2),D(10)),('S09-pressure',D(5)*D('.001'),D('.005')),('S10',D('.80')/(D(2)**2),D('.20')),('S10-transfer',D('1.2')/(D(2)**3),D('.15'))]
assert all(actual==expected for _,actual,expected in calculations)

# Coverage review found that the first S03 draft compressed two required enumerations.
# Repair that located omission before treating routed source IDs as semantic coverage.
id='FATE2-S03'; p=R/f'lessons/{id}/lesson.public.json'; old=p.read_bytes(); lesson=json.loads(old)
assert not any(s['id']=='evidence-and-committee-scope' for s in lesson['ar']['sections'])
repair=R/'history/source-coverage-repair-v1';repair.mkdir(exist_ok=False,parents=True)
for rel in [f'lessons/{id}/lesson.public.json',f'lessons/{id}/lesson.ar.md',f'lessons/{id}/lesson.en.md','preview/index.html']:
    dest=repair/rel;dest.parent.mkdir(exist_ok=True,parents=True);dest.write_bytes((R/rel).read_bytes())
extra={
'ar':{'id':'evidence-and-committee-scope','title':'٥. نحافظ على أنواع الدليل واختصاص اللجنة','paragraphs':[
'صفحة ٨ بتسمي ست نواحٍ لدليل السمية: السمية الحادة، والمزمنة، واحتمال إحداث السرطان، والتغيرات الوراثية، والتأثيرات على نمو الجنين، والتكاثر أو الخصوبة. دي أسئلة مختلفة؛ نتيجة حادة ما تستبدلش دليلًا عن التكاثر أو النمو. قائمة الدراسة نفسها ما تعنيش إن كل اختبار مطلوب بلا استثناء لكل منتج؛ صفحة EPA عن البيانات توضح ارتباط المتطلبات بالحالة وإمكان وجود بدائل أو إعفاءات مبررة.',
'واختصاص CCPR المعلن يشمل ست نقاط: حدود المتبقيات في أغذية أو مجموعاتها؛ حدودًا في أعلاف معينة متداولة دوليًا عندما تبررها حماية صحة الإنسان؛ قوائم أولوية لتقييم JMPR؛ النظر في أخذ العينات والتحليل؛ مسائل أخرى تخص أمان الغذاء والعلف المحتويين على متبقيات؛ وحدود ملوثات بيئية وصناعية تشبه المبيدات كيميائيًا أو بصفات أخرى في أغذية محددة. ما نختزلش ده في كل الملوثات بلا قيد، وما نخلطش اختصاص اللجنة بمهمة التقييم العلمي أو سجل اعتماد CAC.']},
'en':{'id':'evidence-and-committee-scope','title':'5. Preserve evidence types and committee scope','paragraphs':[
'Page 8 names six toxicological questions: acute toxicity, chronic toxicity, carcinogenicity, mutagenicity, developmental effects, and reproduction or fertility. They are not interchangeable: an acute finding does not replace reproductive or developmental evidence. Nor does this list make every test mandatory without exception for every product; EPA describes case-dependent requirements and justified alternatives or waivers.',
'The published CCPR remit includes six areas: food or food-group residue limits; limits in certain internationally traded feeds where justified for human-health protection; JMPR evaluation priorities; sampling and analytical methods; other food/feed residue-safety matters; and limits for environmental or industrial contaminants chemically or otherwise similar to pesticides in specified foods. Do not expand that last category to every contaminant, or conflate committee remit with scientific assessment or CAC adoption.']}}
for l in ['ar','en']:
    lesson[l]['sections'].append(extra[l]); md=R/f'lessons/{id}/lesson.{l}.md'
    md.write_text(md.read_text(encoding='utf8')+'\n\n## '+extra[l]['title']+'\n\n'+'\n\n'.join(extra[l]['paragraphs'])+'\n',encoding='utf8')
lesson['references'] += [ref('EPA: pesticide registration data requirements','https://www.epa.gov/pesticide-registration/data-requirements-pesticide-registration','Actual official returned passage: relevant data requirements, alternatives and waivers; no specific product test schedule prescribed.'),ref('Codex CCPR terms of reference','https://www.fao.org/fao-who-codexalimentarius/committees/committee/related-standards/pl/?committee=ccpr','Actual six official terms returned and inspected; distinguish committee remit from adoption.')]
p.write_text(json.dumps(lesson,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
htmlpath=R/'preview/index.html'; page=htmlpath.read_text(encoding='utf8')
match=re.search(r'(<script id="public-data" type="application/json">)(.*?)(</script>)',page,re.S); payload=json.loads(match[2]);payload['lessons'][id]=lesson
page=page[:match.start(2)]+json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+page[match.end(2):]
htmlpath.write_text(page,encoding='utf8')

inventory=json.loads((R/'source-audit/items.en.json').read_text(encoding='utf8'))['items']
rows=[]
for item in inventory:
    dest=item.get('destination'); disposition=item['disposition']
    if item['kind']=='outline_heading': treatment='Concept developed with explicit reference additions where needed; source outline is not claimed as a full explanation.'
    elif 'TAB1-R' in item['id']: treatment='Critical-reading inventory retained; broad individual health claims NOT validated or taught as final facts. Formula corrections C01-C03 scoped separately.'
    elif 'historical_context' in disposition: treatment='Retained as provenance; historical demographic/code context not represented as a current statistic or core assessed outcome.'
    elif item['id'].endswith('REF01'): treatment='Bibliography provenance only, not claimed read or endorsed.'
    elif item['id'] in ['SRC01-P20-Q01','SRC01-P20-Q02']: treatment='Explicitly held numerical generalisation; S09 explains that it is not adopted as a rule.'
    elif 'IMG01' in item['id']: treatment='Historical arsenic image discussed as a non-diagnostic/non-pesticide-specific illustration; not reproduced as clinical evidence.'
    elif 'CHART01' in item['id']: treatment='Conceptual source graphic only; unscaled bars not converted to fabricated numbers.'
    else:treatment='Routed conceptual treatment and qualification; see actual lesson sections and correction notes. Route alone is not independent semantic certification.'
    rows.append({'sourceItem':item['id'],'meaning':item.get('meaning'),'destination':dest,'sourceDisposition':disposition,'currentTreatment':treatment,'lessonExists': bool(dest and (R/f'lessons/{dest}/lesson.public.json').exists())})
save('source-audit/written-coverage-review.en.json',{'utc':now,'reviewer':'Author assistant self-review','independence':'Not an external expert/native-language review','items':rows,'findings':[{'id':'COV01','scope':'S03 / source p8','before':'Six toxicology questions and six CCPR duties compressed beyond explicit preservation.','repair':'Added bilingual evidence-and-committee-scope section to actual reading and Markdown; updated embedded preview payload.','evidence':'Actual user-source page8, official EPA data-requirements and Codex six terms inspected.','recheck':'Both six-item sets present in both locales; public preview contains repaired section.','unaffected':'No questions/keys, accepted audio or old edition changed.'}],'limits':['Source table health/ecological claims remain unvalidated individually','Held MW/systemic numerical rules not adopted','Historical population figures intentionally not current facts','Bibliography references not falsely claimed fully read']})
hashes={};counts=[];allrefs={}
for spec in mapping['steps']:
    id=spec['id'];v=json.loads((R/f'lessons/{id}/lesson.public.json').read_text(encoding='utf8'))
    assert [s['id'] for s in v['ar']['sections']]==[s['id'] for s in v['en']['sections']]
    assert len(v['ar']['example']['steps'])==len(v['en']['example']['steps'])
    for l in ['ar','en']:assert v[l]['outcomes'] and v[l]['practice'] and v[l]['faq'] and v[l]['summary']
    nums=lambda x:re.findall(r'(?<![A-Za-z])\d+(?:\.\d+)?',x)
    assert [s['equation'] for s in v['ar']['example']['steps']]==[s['equation'] for s in v['en']['example']['steps']]
    counts.append({'id':id,'sectionsPerLocale':len(v['ar']['sections']),'assessmentItems':len(json.loads((R/f'lessons/{id}/assessment.public.json').read_text(encoding='utf8'))['items']),'wordCounts':{l:len(' '.join(p for s in v[l]['sections'] for p in s['paragraphs']).split()) for l in ['ar','en']}})
    for refentry in v.get('references',[]):allrefs[refentry['url']]=refentry
    for f in (R/f'lessons/{id}').iterdir():
        if f.is_file():hashes[f.relative_to(R).as_posix()]=hashlib.sha256(f.read_bytes()).hexdigest()
run=json.loads((R/'RUN.en.json').read_text(encoding='utf8')); oldcontrol=[]
for rel,sha in run['oldEdition']['protectedFilePreimages'].items():
    actual=hashlib.sha256((P/rel).read_bytes()).hexdigest();assert actual==sha,rel;oldcontrol.append({'path':rel,'sha256':actual,'unchanged':True})
save('batch-review.en.json',{'utc':now,'scope':'11 written bilingual steps, 71 distinct assessment items; no media-complete claim','reviewer':'Author assistant; separate calculation pass and consumer checks, not independent/native expert certification','arithmetic':[{'case':name,'expected':str(expected),'actual':str(actual),'pass':actual==expected} for name,actual,expected in calculations],'localeParity':['Aligned section IDs and worked-equation strings','Aligned question/distractor identities and private keys','Contextual translation rather than literal sentence matching'],'scientificChecks':['MRL food basis versus ADI body/time basis','No nondetect-as-zero assertion','BCF L/kg and BSAF normalisation bases retained','MATC geometric mean with no95-percent guarantee','Steady-state flux versus equilibrium distinguished','MW/systemic cutoffs held','Young six main stages, eleven branches and five influence groups retained','PHI not derived from invented decay'],'repairReceipt':'source-audit/written-coverage-review.en.json','lessons':counts,'actualInputHashes':hashes,'oldEditionControls':oldcontrol,'notTested':['External expert review','Native-language certification','Real observations/physical competence','Native browser pixels/print pagination','Actual audio/video']})
save('source-audit/batch-reference-receipt.en.json',{'utc':now,'scope':'Actual returned passages used in this batch; no full linked-book read inferred','references':list(allrefs.values()),'failedFetches':['IUPAC direct definition pages returned403; official search passages inspected','Regulations.gov definitions PDF direct fetch403; official search passage inspected']})
print('Checked 16 independent arithmetic expectations, bilingual structure and six protected old-edition hashes; repaired located S03 coverage omission.')
