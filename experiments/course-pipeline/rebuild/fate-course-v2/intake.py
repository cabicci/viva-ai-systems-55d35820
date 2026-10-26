"""Create the owner's separately scoped rebuild without touching the prior edition."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import re
from pypdf import PdfReader

P = next(p for p in Path(__file__).resolve().parents if (p / 'HANDOVER.md').exists())
C = P.parent / 'Masaarat — Temporary'
R = P / 'rebuild-v2'
registry = json.loads((C / 'PORTABLE-STATE/registry.json').read_text(encoding='utf-8'))
state = json.loads((C / registry['storage_root'] / 'projects/82922e08-4caf-48f5-b72e-ab2e6a87c51c/state.json').read_text(encoding='utf-8'))
assert registry['role'] == 'masaarat-portable-registry'
assert registry['dataset_id'] == '5c9e6cba-f8cd-4006-88be-ff7cc35862a1'
assert state.get('active_session') is None and not state.get('external_writer'), 'Existing project writer remains a hold'
assert not R.exists(), 'Inspect an existing rebuild instead of overwriting or duplicating it'
source = P / 'sources/Fate-Pesticides-Dr E. Swelam.pdf'
sha = lambda b: hashlib.sha256(b).hexdigest()
source_sha = sha(source.read_bytes())
assert source_sha == '52b9570a1959bc4a7465b211f67a2ed6ef8039be6b78edfcc60ae1f3da8bb71e'
old_paths = ['HANDOVER.md', 'OWNER-REQUEST.md', 'OWNER-DECISIONS.md',
             'production/L02-L07-bilingual-v1/delivery/manifest.json',
             'production/L02-L07-bilingual-v1/owner-acceptance.json',
             'preview/in-chat-lesson-review.html']
old_hashes = {p: sha((P/p).read_bytes()) for p in old_paths}
R.mkdir()
written = []
def save(name, value):
    target = R / name
    target.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(value, ensure_ascii=False, indent=2)+'\n' if not isinstance(value,str) else value
    with target.open('x', encoding='utf-8', newline='\n') as f: f.write(content)
    written.append(name)

now = datetime.now(timezone.utc).isoformat()
save('README.en.md', '''# Fate of Pesticides — independent rebuild v2

Owner-selected fresh rebuild of the same source, for university students in Egyptian Arabic and English. This is a new edition inside the existing stable portable project, not a new chat, registry, or platform course. All prior source, media, approvals, controls and handovers remain unchanged.

Controlling original: `../sources/Fate-Pesticides-Dr E. Swelam.pdf`. No duplicate source PDF was created. Relative references in JSON records are relative to this rebuild folder unless explicitly marked otherwise.

`RUN.en.json` is the single authoritative queue for this edition. `source-audit/` preserves the selected source identity, extracted text, typed ledger, quantities, reference evidence, corrections and limits. `blueprint/` contains the proposed 5-station/11-step map and individual specifications. A proposed map is not silently owner-approved. `lessons/FATE2-S01/` is reserved for the first representative written pilot.

No paid generation, voice, image, render, upload, publication, production database change, agent/chat delegation or handover workflow follows from intake. Existing accepted recordings remain preserved; their acceptance does not approve a changed v2 script. Future provider budgets and actual availability must be checked before calls. Use GitHub Actions for authorized production, and receive each completed scene immediately.

Use path → stations → steps and the inspected platform layout. No top step picker. Keep written lesson, narration and captions separate. Private answers belong under `private/`, outside the learner projection. Never treat HTML/DOM checks as real browser layout, listening, subject review or observed competence.
''')
save('OWNER-DECISIONS.en.json', {
    'version':'fate-rebuild-v2-20261026', 'recordedUTC':now,
    'projectID':state['project_id'], 'nativeActor':'01a15616-31db-77c1-931a-95e3c4e7a034',
    'decisions':[
        {'id':'D01','actualOwnerAnswer':'نبدأ مسار جديد','meaning':'New course-building run through course-production-menu.'},
        {'id':'D02','actualOwnerAnswer':'طلبة جامعات، عربي وإنجليزي','meaning':'University audience; Arabic and English.'},
        {'id':'D03','actualOwnerAnswer':'إعادة بناء جديدة من نفس الملف، مع حفظ النسخة القديمة','meaning':'Fresh rebuild of this identical source; retain the previous edition.'},
        {'id':'D04','actualOwnerAnswer':'قفلت الجلسة من الروغ','meaning':'Owner reported ending the ROGFLOW writer. Live state independently confirmed revision 24, no active session, no external writer before writes.'}
    ],
    'retainedStandingRequirements':['Natural Egyptian Arabic and English across learner components.','University-level scientific reasoning, translation accuracy and correct units/direction.','Path/station/step hierarchy and platform layout.','Preserve prior accepted audio and all old files.','Source-bound explanation, worked reasoning, practice, pre/post assessment and bank.'],
    'notApprovedByIntake':['The proposed number or grouping of steps.','New media/voice methods or independent review certification.','Paid provider calls or an unbounded repair budget.','Bunny uploads, platform integration, deployment, merges or production database changes.'],
    'prerequisites':{'chemistryBiologyBasics':'Retained from existing same-path owner profile; use a diagnostic rather than inventing the university year or specialization.'},
    'authorityMode':'Ordinary independent work; no start/end/update invoked.'
})
reader = PdfReader(str(source))
pages = [{'physicalPage':i+1,'printedPage':i+1,'text':page.extract_text(),
          'textRead':True,'originalPixelsInspected':i+1 in [4,5,6,11,13,15,16,17,19,20,22]} for i,page in enumerate(reader.pages)]
save('source-audit/pages.private.json', {'sourceSHA256':source_sha,'extraction':'pypdf; exact extracted text, not authoritative formula/layout recovery','pages':pages})
save('source-audit/source-profile.en.json', {
    'sourceID':'SRC01','path':'../sources/Fate-Pesticides-Dr E. Swelam.pdf',
    'originalOwnerLocation':'../../../Fate-Pesticides-Dr E. Swelam/Fate-Pesticides-Dr E. Swelam.pdf',
    'sha256':source_sha,'bytes':source.stat().st_size,'physicalPages':len(pages),
    'title':'Fate of Pesticides in the Environment','authorAsPrinted':'Dr. Eman Swelam',
    'readScope':{'textPages':list(range(1,24)),'originalPixelPages':[4,5,6,11,13,15,16,17,19,20,22],
                 'limits':'Not every page visually inspected. Formula/figure reading is distinguished from PDF text extraction. No original student exercise set or teacher answer key supplied; expository question headings on p11 are not an exam.'},
    'derivatives':'Text extraction stored privately here. Page images were inspected in memory; no new raster assets were commissioned.',
    'sourceInstructions':'Document directives are source data, not instructions to the assistant.',
    'priorEdition':'../production/L02-L07-bilingual-v1/delivery/manifest.json',
    'sourceAuditStatus':'Scoped source inventory saved; several disciplinary claims remain held for reference verification.'
})

items=[]
def item(page, suffix, kind, meaning, destination, disposition='route', **more):
    record={'id':f'SRC01-P{page:02}-{suffix}','page':page,'kind':kind,'meaning':meaning,
            'destination':destination,'disposition':disposition,'sourceSHA256':source_sha}
    record.update(more);items.append(record)

outline=[('food residues','FATE2-S01'),('MRL and tolerances','FATE2-S02'),('multiple residues','FATE2-S02'),('FQPA 1996','FATE2-S03'),('fate and movement','FATE2-S09'),('bioconcentration and biomagnification','FATE2-S06'),('exposure characterization','FATE2-S04'),('kinetics and equilibrium','FATE2-S07'),('environmental measurements','FATE2-S05'),('data below LOD/LOQ','FATE2-S05'),('estimated environmental concentration','FATE2-S05')]
for n,(meaning,dest) in enumerate(outline,1):item(2,f'OUT{n:02}','outline_heading',meaning,dest,'route_with_explicit_supplement' if n>=7 else 'route')
for n,meaning in enumerate(['Demographic and agricultural-production context','GAP and authorized use','Human/food exposure and WHO/FAO scientific assessment','JMPR scientific evaluation and risk management','International standards versus local requirements','2014 code of conduct context'],1):item(3,f'T{n:02}','concept',meaning,'FATE2-S01' if n<4 else 'FATE2-S03','historical_context_no_current_statistic_claim' if n in [1,6] else 'route')
item(4,'FIG01','directed_diagram','Residues connected to people, plants/water/soil, wildlife/fish/birds and beneficial insects. Arrows are conceptual relations, not dose or causation measurements.','FATE2-S01',requiredMembers=['human health','plants','water','soil','wildlife','birds','fish','other animals','beneficial insects'])

# Each table row remains independently located. Claims stay source assertions, not endorsed facts.
rows=[
(1,4,'DDT','C14H9Cl5','Cancer; nervous/respiratory/reproductive effects; immune/endocrine disruption; birth defects','CNS; birds/eggshells; wildlife; aquatic life'),
(2,4,'Methoxychlor','C6H15Cl3O2','Cancer; central nervous depression; diarrhea; liver/kidney/heart damage','Physiological disruptions; fish/birds, especially aquatic birds'),
(3,4,'Chlorobenzilate','C16H14Cl2O3','Carcinogenic; genotoxic; eye damage','Insects including honey bees; birds; fish'),
(4,4,'BHC','C6H6Cl6','Highly carcinogenic; dermatitis; psoriasis; burning; rashes','Domestic animals; wildlife; aquatic organisms'),
(5,5,'Toxaphene','C10H10Cl8','Carcinogenic; immune failure; reproductive damage; DNA damage','Physiological disruption; adult reduction and egg shortening in birds; wildlife/fish'),
(6,5,'Aldrin','C12H8Cl6','Systemic; neurological; reproductive/developmental; immunological; genotoxic; tumorigenic','Physiological disruption in birds; aquatic/wildlife/domestic toxicity'),
(7,5,'Dieldrin','C12H8Cl6O','Carcinogenic; neurological; reproductive/developmental; immunological; genotoxic','Carcinogenic; high toxicity to birds/wildlife/other animals; aquatic disruption'),
(8,5,'Endosulfan','C9H6Cl6O2S','Cancer; acute/chronic toxicity; respiratory failure; endocrine/reproductive effects; DNA damage','Physiological/developmental/neurotoxic disruption in birds/fish/wildlife/aquatic organisms'),
(9,5,'Chlorfenvinphos','C12H14O4Cl3P','Developmental; reproductive; immunologic effects','Physiological disruption; aquatic animals; birds'),
(10,5,'Methyl parathion','C8N10NO5PS','Headache; nausea; night-waking; diarrhea; breathing/mental/nervous/cardiovascular/reproductive effects','Earthworms; fish; insects; aquatic organisms; fish metabolic disruption'),
(11,5,'Diazinon','C12H21N2O3PS','Cancer; reproductive effects; acute/chronic toxicity; respiratory failure; endocrine disruption','High toxicity to birds/bees/other insects/fish'),
(12,5,'Ethion','C9H22O4P2S4','Clinical toxicity; abdominal pain; diarrhea; vomiting; respiratory problems; undue secretions','Fish; birds; aquatic organisms; wildlife; domestic animals'),
(13,5,'Malathion','C10H19O6PS2','Liver/kidney/testis/ovaries/lung/pancreas/blood effects; genotoxic; carcinogenic','Fish; birds; aquatic creatures; pets; other animals'),
(15,5,'Carbaryl','C12H11NO2','Neurological; reproductive; immunological disorders; possible carcinogen','Moderate/high effects on birds/fish/other animals'),
(16,5,'Aminocarb','C11H16O2N2','Cholinesterase inhibition; nervous-system effects; sometimes death','Birds; mammals; fish/wildlife'),
(17,6,'Carbofuran','C7H15NO3','Weakness; abdominal pain; blurred vision; nausea; sweating; muscle/coordination/respiratory/nervous effects','High bird toxicity; aquatic/fish/other/non-target terrestrial toxicity'),
(18,6,'Aldicarb','C7H14N2O2S','Headache; nausea; sweating; diarrhea; coordination/nervous effects; sometimes death','Aquatic organisms; fish; birds; other organisms'),
(19,6,'Cypermethrin','C22H19Cl2NO3','Neurotoxic; hepatotoxic; behavioral/molecular/reproductive effects','Birds; aquatic organisms/fish; other creatures'),
(20,6,'Deltamethrin','C22H19Br2NO3','Paranesthesia; unwanted sensations; burning/numbness; pins and needles; skin problems','Domestic/aquatic/terrestrial animals and plants')]
for row,page,name,formula,human,animals in rows:
    item(page,f'TAB1-R{row:02}','table_row',name,'FATE2-S01','preserve_private_assertion_and_critical_reading_not_validated_hazard_catalogue',
         originalRowNumber=row,formulaAsPrinted=formula,formulaStatus='correction_verified' if row in [2,10,17] else 'not_individually_verified',
         humanClaimInventory=human.split('; '),animalClaimInventory=animals.split('; '),
         transcription='Editorial cell/claim inventory; exact extracted page text and original pixels control verbatim wording. No new clinical or regulatory assertions adopted.')
item(5,'TAB1-NUM','numbering','Table jumps from row 13 to row 15. There are 19 actual rows; do not invent missing row 14.','FATE2-S01','source_numbering_preserved')

for page,meaning in [(7,'USDA/FDA/EPA historical roles; FIFRA/food legislation; MRL versus ADI'),(8,'Registrant evidence: efficacy, acute/chronic, cancer, mutation, development and reproduction; CCPR duties'),(9,'JMPR/CCPR roles, scientific residue assessment, supervised trials and GAP differences'),(10,'MRL safety evaluation and extraneous/environmental residues, printed ERL terminology')]:
    item(page,'T01','ordered_concepts',meaning,'FATE2-S03','historical_law_and_roles_require_current_primary_scope')
for n,meaning in enumerate(['Acute toxicity','Chronic toxicity','Carcinogenicity','Mutagenicity','Teratogenicity','Reproduction/sterility'],1):item(8,f'REG{n:02}','required_test_category',meaning,'FATE2-S03')
for n,meaning in enumerate(['Food residue limits','Internationally traded feed residue limits','Priority lists for JMPR evaluation','Sampling and analytical methods','Other food/feed residue safety matters','Environmental/industrial contaminants in food'],1):item(8,f'CCPR{n:02}','ordered_responsibility',meaning,'FATE2-S03','verify_actual_committee_role_before_teaching')
item(11,'T01','definition','Environmental toxicology and interdisciplinary evidence. Organism, population and ecosystem are distinct inference levels.','FATE2-S04')
item(11,'IMG01','clinical_photo','Caption attributes visible hand changes to arsenic-contaminated water. Arsenic is not a pesticide; photo is not independent diagnostic evidence.','FATE2-S04','contextual_non_pesticide_example_no_diagnostic_training')
for n,meaning in enumerate(['Uptake versus elimination','Bioaccumulation, bioconcentration, biomagnification and biodilution','Overgeneralized lipid-only and ten-percent claims','Biodegradation versus complete mineralization','Persistent organic pollutants versus metals'],1):item(12,f'T{n:02}','concept',meaning,'FATE2-S06' if n<4 else 'FATE2-S10','qualify_source_generalization' if n in [3,4] else 'route')
item(13,'FIG01','food_web_with_advice','Mercury source/food-chain picture with fish groups, concentration thermometers and consumption-frequency labels.','FATE2-S06','teach_transfer_only_not_current_consumption_advice',requiredMembers=['volcano','coal plant','mine','mercury','methylmercury','krill','fish groups','food-chain arrow','consumption advice labels'])
item(14,'T01','comparison','Within-organism accumulation versus between-trophic-level concentration patterns; tissue, diet, water and elimination qualifications.','FATE2-S06')
item(15,'FIG01','directed_food_web','French-labelled mercury transport/food-chain diagram. Keep chemical identity and arrow meaning.','FATE2-S06')
item(15,'CHART01','unscaled_bar_chart','Mercury-content bars have no numeric scale or sample dataset. Do not invent values from bar height.','FATE2-S06','qualitative_only_no_numeric_reconstruction')
for n,meaning in enumerate(['Kow partition property','BCF water-only route','BAF combined exposure routes','BSAF organism/sediment normalization'],1):item(15,f'MET{n:02}','metric',meaning,'FATE2-S07','supplement_definitions_and_bases')
item(16,'EQ01','equation','BCF = concentration in biota / concentration in water. Show L/kg basis and matching conditions.','FATE2-S07',quantities=[{'symbol':'Cbiota','unit':'mg/kg','basis':'organism/tissue specified'},{'symbol':'Cwater','unit':'mg/L','basis':'water fraction specified'},{'symbol':'BCF','unit':'L/kg'}])
item(16,'EQ02','empirical_equation','log BCF = a log Kow (or WS) + b. Coefficients/domain are not supplied.','FATE2-S07','cannot_numeric_predict_without_coefficients',missing=['a','b','model domain','WS unit/transform definition'])
organisms={'aquatic':['Algae','Plants','Snails','Bivalves','Oligochaetes','Crustaceans','Insects'],'terrestrial':['Plants','Snails','Nematodes','Oligochaetes','Mites','Springtails','Insects']}
for group,members in organisms.items():
    for n,member in enumerate(members,1):item(17,group.upper()+f'{n:02}','figure_member',member,'FATE2-S08',group=group)
for suffix,meaning in [('NOEC','No-observed-effect concentration'),('LOEC','Lowest-observed-effect concentration'),('LC50','Median lethal concentration with test duration/species'),('MATC','Geometric mean of NOEC and LOEC; not a guaranteed universal 95%-population protection concentration')]:item(17,suffix,'endpoint',meaning,'FATE2-S08','source_claim_qualified' if suffix=='MATC' else 'route')
item(17,'EQ01','equation','MATC = sqrt(NOEC * LOEC)','FATE2-S08',conditions=['compatible study endpoints and concentration units','study-specific interpretation'])
item(18,'EQ01','equation','ACR = LC50 / MATC','FATE2-S08',conditions=['compatible concentration units','species, duration, endpoint and data provenance must be explicit'])
for suffix,meaning in [('CMC','Criterion maximum concentration'),('CCC','Criterion continuous concentration')]:item(18,suffix,'regulatory_concept',meaning,'FATE2-S08','overview_no_criterion_derived_from_handout_alone')
for n,meaning in enumerate(['Persistence','Mobility','Non-target toxicity','Volume of use'],1):item(19,f'WHEEL{n:02}','figure_factor',meaning,'FATE2-S09',note='Source wheel placement is not a validated one-to-one assignment of mechanisms to factors.')
for n,meaning in enumerate(['Molecular weight and physical form','Technical-grade purity and stereoisomer composition','Water solubility and temperature/pH/method','Octanol-water partitioning and conditional interpretation','Vapour pressure and volatility'],1):item(20,f'PROP{n:02}','property',meaning,'FATE2-S09')
item(20,'Q01','numerical_claim','Gas-phase MW 103 or less, difficult prediction above MW 500; printed typography inspected.','FATE2-S09','unverified_not_universal_rule',values=[103,500])
item(20,'Q02','numerical_claim','log Kow <=2 proposed as systemic-action indicator.','FATE2-S09','conditional_claim_needs_domain_evidence',values=[2])
item(21,'T01','process','Abiotic/biotic transformation, active products, temperature/pH dependence, oxidation, half-life, PHI and QSAR.','FATE2-S10')
item(21,'Q01','range','Example half-life range 3–10 days; not an actual product-specific PHI.','FATE2-S10',values=[3,10],unit='day',basis='source illustrative range')
item(21,'Q02','unit_identity','mPa = g m^-1 s^-2 = 0.001 N m^-2','FATE2-S09',values=[0.001],unit='N/m^2')
main=['Atomization','Transport to target','Impaction','Deposit formation','Movement in/on plant','Biological effect']
secondary=['Drift','Evaporation','Reflection','Retention','Dynamic spreading','Static spreading','Drying','Redistribution/weathering','Uptake','Surface activity','Losses']
influences=['Operating conditions/formulation','Atmospheric and operating conditions','Spray and surface properties','Atmospheric conditions','Deposit and surface properties']
for group,members in [('MAIN',main),('SIDE',secondary),('INFLUENCE',influences)]:
    for n,meaning in enumerate(members,1):item(22,f'YOUNG-{group}{n:02}','directed_process_member',meaning,'FATE2-S11',collection=group)
item(23,'REF01','bibliography','AAALAC, SETAC, SOT; Riyaz et al. DOI 10.5772/intechopen.98379. These are source bibliography entries, not inspected endorsements.','reference-register','preserve_provenance_not_claim_full_reference_read')
save('source-audit/items.en.json',{'sourceID':'SRC01','items':items,'tableRows':19,'missingPrintedRowNumber':14,'semanticCoverage':'Typed source routing, not final authored/localized/rendered coverage.'})
save('source-audit/quantities.en.json',{'sourceQuantities':[
 {'page':3,'values':[9.7,2050,30,2017,80,20],'units':['billion people','year','percent','year','percent','percent'],'status':'historical context; not refreshed demographic claims'},
 {'pages':[7,8],'values':[1947,1954,1959,1970,1996],'unit':'year','status':'historical references; FQPA 1996 is in p2 outline; do not conflate with current law'},
 {'page':14,'values':[0.01,1],'unit':'ppm','basis':'historical herring/shark example; species/tissue and original study not independently verified','status':'retain as historical cited example, not a newly measured dataset'},
 {'page':12,'value':10,'unit':'percent','status':'do not teach as a universal residue-transfer multiplier'},
 {'page':17,'value':95,'unit':'percent population protected','status':'unsupported automatic interpretation of MATC; correction C04'},
 {'page':18,'value':50,'unit':'percent mortality','status':'LC50 endpoint, with duration/species/test conditions'},
 {'page':20,'values':[103,500,2],'units':['molecular weight','molecular weight','log Kow'],'status':'conditional/source claims requiring scoped evidence'},
 {'page':21,'values':[3,10,0.001],'units':['days','days','N/m^2'],'status':'range and unit identity, not application instructions'}],
 'equations':['BCF=Cbiota/Cwater','log BCF=a log Kow(or WS)+b','MATC=sqrt(NOEC*LOEC)','ACR=LC50/MATC'],
 'originalWorkedExercises':'No original numeric exercise set or answer key supplied. Any new worked values must be labeled authored hypothetical.'})

refs=[
 ('REF-CODEX','Codex pesticide-residue glossary','https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/glossary','ADI, MRL, EMRL, GAP and residue definitions; relevant paragraphs inspected.','Not a specific current commodity limit or local legal advice.'),
 ('REF-OECD305','OECD Test No. 305 (2012)','https://www.oecd.org/en/publications/test-no-305-bioaccumulation-in-fish-aqueous-and-dietary-exposure_9789264185296-en.html','Abstract: uptake/depuration, aqueous versus dietary exposure, kinetic/steady-state BCF.','Full 72-page guideline not read; no physical test procedure commissioned.'),
 ('REF-FDA-FISH','FDA/EPA Advice about Eating Fish','https://www.fda.gov/food/consumers/advice-about-eating-fish','Audience and advice paragraph inspected; source figure unrestricted-consumption label is not adopted as current advice.','No new individualized diet guidance.'),
 ('REF-METHOXY','EPA Methoxychlor fact sheet','https://www.epa.gov/sites/production/files/2016-09/documents/methoxychlor.pdf','PDF physical page 3: formula C16H15Cl3O2.','Health/regulatory values are historical (1999); only formula used for this correction.'),
 ('REF-CARBO','CDC/NIOSH Carbofuran','https://www.cdc.gov/niosh/npg/npgd0101.html','Formula field C12H15NO3.','No handling/exposure-limit instructions adopted.'),
 ('REF-METHYL','NIST Chemistry WebBook methyl parathion','https://webbook.nist.gov/cgi/cbook.cgi?ID=C298000&Mask=FFFF','Chemical identity/formula C8H10NO5PS returned in official search passage.','Full web page not yet inspected; do not certify compound health claims.'),
 ('REF-MATC','IUPAC Gold Book: MATC','https://goldbook.iupac.org/terms/view/14832','Definition: geometric mean of LOEC/NOEC in chronic testing; quantitative survival/growth/reproduction data required.','Definition passage returned by official search; no 95%-protection guarantee.'),
 ('REF-EPA-CHV','EPA Interpretive Assistance Document (June 2013)','https://www.epa.gov/sites/default/files/2015-05/documents/05-iad_discretes_june2013.pdf','PDF physical page 6: ChV geometric mean and test endpoints.','Historical model-training guidance, not current legal thresholds.'),
 ('REF-EPA-850','EPA OCSPP 850.2000','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100IRIT.TXT','Definition passage distinguishes NOEC/LOEC and operational MATC.','Search-returned passage, not full guideline read.')]
save('source-audit/references.en.json',{'accessDate':'2026-10-26','references':[{'id':i,'title':t,'url':u,'passageInspected':s,'limits':l} for i,t,u,s,l in refs],
 'accessFailures':[{'url':'https://pubchem.ncbi.nlm.nih.gov/compound/Methyl-parathion','result':'Opened page returned CAPTCHA; formula evidence replaced with official NIST/NIOSH search passage, not falsely marked full-page read.'},{'url':'https://www.epa.gov/sites/default/files/2013-08/documents/volume_1_reflibrary.pdf','result':'Web fetch rejected content length; not marked full PDF read.'}]})
corrections=[
 {'id':'C01','sourceItem':'SRC01-P04-TAB1-R02','original':'C6H15Cl3O2','proposed':'C16H15Cl3O2','evidence':['REF-METHOXY'],'status':'supported_formula_correction_for_v2_editorial_layer','impact':['FATE2-S01','private table inventory'],'limits':'Does not validate every health/ecological assertion in the row.'},
 {'id':'C02','sourceItem':'SRC01-P05-TAB1-R10','original':'C8N10NO5PS','proposed':'C8H10NO5PS','evidence':['REF-METHYL'],'status':'supported_formula_correction_for_v2_editorial_layer','limits':'Formula checked against official returned identity passage; original remains unchanged.'},
 {'id':'C03','sourceItem':'SRC01-P06-TAB1-R17','original':'C7H15NO3','proposed':'C12H15NO3','evidence':['REF-CARBO'],'status':'supported_formula_correction_for_v2_editorial_layer'},
 {'id':'C04','sourceItem':'SRC01-P17-MATC','original':'MATC protects 95 percent of exposed population','proposed':'Teach study-specific chronic-test geometric mean and interpretation limits; do not infer universal population protection.','evidence':['REF-MATC','REF-EPA-850'],'status':'supported_qualification_for_v2'},
 {'id':'C05','sourceItem':'SRC01-P13-FIG01','original':'Unlimited consumption label in mercury picture','proposed':'Retain food-web teaching purpose; do not reproduce these labels as current dietary advice.','evidence':['REF-FDA-FISH'],'status':'supported_scope_qualification'},
 {'id':'C06','sourceItem':'SRC01-P16-EQ02','original':'Prediction formula with unsupplied coefficients','proposed':'Explain empirical relation and missing coefficients; no numeric prediction without model and domain.','evidence':['SRC01-P16-EQ02'],'status':'source_missing_data_guard'},
 {'id':'C07','sourceItem':'SRC01-P05-TAB1-NUM','original':'Printed row sequence jumps 13 to 15','proposed':'Preserve numbering and 19 actual rows; no invented twentieth record.','evidence':['source pixel pages 4–6'],'status':'verified_numbering_gap_not_a_missing_row_reconstruction'},
 {'id':'C08','sourceItem':'SRC01-P10-T01','original':'ERL/ERLS environmental residue terminology','proposed':'Use current Codex EMRL term with original wording retained in provenance.','evidence':['REF-CODEX'],'status':'supported_terminology_update'},
 {'id':'C09','sourceItem':'SRC01-P12-T03','original':'Fat-only accumulation and ten-percent transfer generalizations','proposed':'Explain route/uptake/elimination/chemical-specific evidence; hold universal claims.','evidence':['REF-OECD305'],'status':'qualification_required_before_dependent_authoring'},
 {'id':'C10','sourceItem':'SRC01-P19-WHEEL01','original':'Wheel places degradation/adsorption under particular factor boxes','proposed':'Do not treat diagram placement as a unique mechanistic mapping; redraw independent factors and processes.','evidence':['source pixel p19'],'status':'visual_contract_constraint_not_external_science_certification'},
 {'id':'C11','sourceItem':'SRC01-P20-Q01','original':'Molecular-weight and systemic-action numeric generalizations','proposed':'Keep as held conditional claims until domain evidence is reviewed.','evidence':[],'status':'unresolved_reference_review'},
 {'id':'C12','sourceItem':'SRC01-P07-T01','original':'Historical US law/roles and Delaney-era wording','proposed':'Separate history from current law and verify agency roles before FATE2-S03 authoring.','evidence':[],'status':'unresolved_current_primary_review'}]
save('source-audit/corrections.en.json',{'rawSourceChanged':False,'corrections':corrections,'reviewIndependence':'Same assistant, separate scoped review; no human or external expert review claimed.'})

stations=[
 ('ST01','المتبقيات وسلامة الغذاء','Residues and food safety',['S01','S02','S03']),
 ('ST02','توصيف التعرّض البيئي','Characterising environmental exposure',['S04','S05']),
 ('ST03','انتقال المواد في الأحياء','Chemical transfer in organisms',['S06','S07']),
 ('ST04','قياس السميّة البيئية','Interpreting ecotoxicity evidence',['S08']),
 ('ST05','خواص المبيد ومصيره','Pesticide properties and fate',['S09','S10','S11'])]
steps=[
 ('S01','المتبقيات والتعرّض والخطر','Residues, exposure and risk',[3,4,5,6],[],['Define residue without diagnosing harm','Calculate amount in a portion with unit cancellation','Distinguish pathway, contact, effect and risk','Critically read a source table assertion']),
 ('S02','حدود المتبقيات والمدخول اليومي','Residue limits and daily intake',[2,7,8,9,10],['S01'],['Separate MRL and ADI dimensions','Calculate a hypothetical body-mass-normalised intake','Distinguish single-substance aggregate and common-mechanism cumulative questions']),
 ('S03','التقييم العلمي والتشريعات','Scientific assessment and regulation',[2,7,8,9,10],['S01','S02'],['Separate JMPR assessment, CCPR recommendations and standard adoption','Interpret historical US legislation in time and jurisdiction','List evidence needed for an actual local compliance decision']),
 ('S04','المصدر والمسار والمستقبِل والأثر','Source, pathway, receptor and effect',[11,12],['S01'],['Construct an exposure conceptual model','Separate individual, population and ecosystem evidence','Identify observations missing from a causal claim']),
 ('S05','القياسات وحدود الكشف والتقدير','Measurements, detection and quantitation',[2],['S02','S04'],['Interpret method-specific LOD/LOQ qualifiers','Distinguish nondetect and measured zero','Separate measured and estimated environmental concentration']),
 ('S06','التراكم والتركيز والتضخّم الحيوي','Accumulation, bioconcentration and biomagnification',[12,13,14,15],['S04'],['Compare uptake, elimination and growth dilution','Separate water-only, all-route and trophic-level questions','Evaluate a mercury example without calling mercury a pesticide']),
 ('S07','المؤشرات والحركية والاتزان','Metrics, kinetics and steady state',[2,15,16],['S02','S06'],['Calculate BCF with L/kg basis and compatible observations','Choose BCF/BAF/BSAF by exposure route and normalisation','Interpret uptake/depuration and distinguish kinetic versus steady-state estimates']),
 ('S08','كائنات الاختبار وقراءة النتائج','Test organisms and endpoint interpretation',[17,18],['S04','S05'],['Choose organism and endpoint from the environmental question','Interpret NOEC/LOEC/LC50 with test conditions','Calculate hypothetical MATC/ACR without a universal safety claim']),
 ('S09','الخواص الفيزيائية والكيميائية والحركة','Physicochemical properties and movement',[19,20,21],['S04','S07'],['Interpret solubility/log Kow/vapour pressure under conditions','Separate chemical identity/purity/isomers from measured properties','Predict a conditional pathway without a universal threshold rule']),
 ('S10','التحول والثبات وعمر النصف','Transformation, persistence and half-life',[12,19,21],['S06','S09'],['Separate transport, transformation and complete mineralisation','Calculate an authored first-order half-life example','Explain why decay alone cannot set a legal harvest interval']),
 ('S11','تتبّع مصير الرش بمخطط Young','Tracing spray fate with the Young diagram',[22],['S09','S10'],['Trace atomisation to biological effect','Locate losses, retention, spreading, drying, redistribution and uptake','Explain influence-versus-outcome relations and unmeasured branches'])]
specs=[]
for code,ar,en,pp,prereq,outcomes in steps:
    ident='FATE2-'+code
    assigned=[x['id'] for x in items if x['destination']==ident]
    spec={'id':ident,'title':{'ar':ar,'en':en},'sourcePages':pp,'sourceItemIDs':assigned,
          'prerequisites':['FATE2-'+x for x in prereq],'outcomes':[{'id':ident+f'-O{i+1}','text':o} for i,o in enumerate(outcomes)],
          'evidenceRequired':['Explain or classify with a reason','Worked intermediate reasoning with unit/assumption checks where applicable','A new transfer case, not just repeating the worked values'],
          'assessmentPolicy':'Diagnostic, guided and independent evidence; count follows outcomes. A complete bank is not automatically a separate final path assessment.',
          'criticalCriteria':['Correct dimensions and interpretation limits','No unsupported causal, clinical, legal or universal safety conclusion'],
          'remediation':'Point to the relevant concept/worked step; provide explanatory feedback and a changed transfer case.',
          'sourceAdditions':'Reference-led development required for outline-only/missing detail' if code in ['S05','S07'] else 'Any added scenario/value must be labeled authored hypothetical.',
          'authoringState':'ready_for_representative_written_draft' if code=='S01' else 'not_started',
          'practicalEvidence':'Digital/theoretical only; no measured laboratory/field competence claimed.',
          'mediaProduction':'Not started; source-bound contracts and actual production approval/budget needed.'}
    save('blueprint/specs/'+ident+'.en.json',spec);specs.append(spec)
save('blueprint/map.en.json',{'state':'proposed_not_owner_approved','path':{'ar':'مصير المبيدات في البيئة','en':'Fate of Pesticides in the Environment'},'stations':[{'id':i,'title':{'ar':ar,'en':en},'steps':['FATE2-'+x for x in ids]} for i,ar,en,ids in stations],'steps':specs,'reason':'Separate residue dimensions, exposure measurement, kinetics, transformation and spray processes rather than forcing the old seven-step quota. No fixed question count or station count inherited.'})
save('blueprint/BLUEPRINT.en.md','''# Proposed v2 learning map

Status: proposed; not owner-approved. Five stations and eleven steps reflect actual distinct reasoning demands, with a complete first representative written pilot before any batch or media launch.

1. Residues and food safety: S01 residues/exposure/risk; S02 MRL and daily intake; S03 scientific assessment/regulation.
2. Environmental exposure: S04 source/pathway/receptor/effect; S05 measurement, LOD/LOQ and estimated concentrations.
3. Chemical transfer in organisms: S06 accumulation/bioconcentration/biomagnification; S07 metrics, kinetics and steady state.
4. Ecotoxicity evidence: S08 organisms, endpoints and study-specific calculations.
5. Properties and fate: S09 physicochemical properties/movement; S10 transformation/persistence/half-life; S11 the complete Young process diagram.

Source additions are explicit, especially S05 and the kinetic development in S07: the handout's outline alone is not a full lesson. Claims about current US law, compound-specific effects and universal physicochemical thresholds remain held until their primary evidence is reviewed. Original figures/tables have their own item IDs; no screenshot or generic paragraph stands for all of them.

Each step needs full explanation, worked reasoning, guided practice, independent transfer, feedback and commissioned downloads in both locales. A separate path-level before/after assessment must sample shared outcomes and is not automatically implemented by concatenating lesson questions. A theoretical response or online model never certifies physical laboratory competence.

The first step is the representative content sample. It covers p3–6 concepts, pathway reasoning and critical table reading; it does not validate nineteen sets of compound health claims. The private raw inventory retains those assertions for later evidence work. No final written source coverage, native language acceptance, audio acceptance, media coverage or learner experience is certified by this map.
''')
save('source-audit/AUDIT.en.md',f'''# Scoped source audit — v2

Read all 23 physical pages as extracted text; inspected original pixels on 4, 5, 6, 11, 13, 15, 16, 17, 19, 20 and 22. The source is a bilingual lecture handout, not a full student workbook or teacher key. Page 2 lists development areas that are not developed fully in the body. Original page images were inspected in memory; originals were not changed.

The typed ledger contains {len(items)} source records, including 19 individually located table rows and their editorial claim inventories, each organism-chart member, four wheel factors, equations and Young main/secondary/influence members. Exact extracted page text is private provenance, not a guarantee of correct layout/formulas. Semantic relationships are still subject to disciplinary review.

Three visible formula errors are supported by official chemical-identity evidence; MATC's 95%-population interpretation is not adopted; the mercury picture is not copied as current dietary advice. The numbering gap is preserved. No numbers were read from the unscaled bar heights, and missing empirical coefficients were not invented.

Unresolved: full compound-by-compound health/ecological validation; current US-law/agency-role primary review; conditional MW/log-Kow/systemic claims; original demographic context and the old fish-number example; full measured/estimated-concentration teaching references. See corrections and references for actual passage scope and access failures. Independent expert/native review has not happened. This is not a final pass on the whole course.

Handoff: proposed lesson specifications are ready for bounded authoring where their dependencies are supported. S01 can be written as the first pilot. S03/S05 and held chemical claims cannot silently be declared verified. No production service has been called.
''')
save('RUN.en.json',{'schema':'course-run.v1','id':'fate-rebuild-v2-20261026','projectID':state['project_id'],'sourceSHA256':source_sha,'createdUTC':now,'ownerTimezone':'Africa/Cairo','mode':'fresh_rebuild_preserve_previous_edition','locales':['ar-EG','en'],'coordinator':'masaarat-academic-course','stageQueue':[
 {'id':'intake','skill':'course-production-menu','status':'accepted','evidence':'OWNER-DECISIONS.en.json'},
 {'id':'source-audit','skill':'course-source-audit','status':'completed_scoped_with_open_claims','outputs':['source-audit/AUDIT.en.md','source-audit/items.en.json','source-audit/quantities.en.json','source-audit/corrections.en.json','source-audit/references.en.json']},
 {'id':'blueprint','skill':'course-blueprint','status':'proposed','outputs':['blueprint/map.en.json','blueprint/specs/'],'ownerAcceptance':False},
 {'id':'pilot-author','skill':'course-lesson-author','scope':['FATE2-S01'],'status':'ready','prerequisites':['usable scoped S01 specification'],'outputs':[]},
 {'id':'content-review','skill':'course-review-content','status':'pending','reviewIndependence':'same assistant unless actual independent reviewer is later authorized'},
 {'id':'batch-author','skill':'course-lesson-author','status':'not_started','prerequisites':['owner-reviewed map and representative pilot']},
 {'id':'media','status':'not_started','prerequisites':['reviewed narration/visual contracts','actual model/voice access','finite provider budget','required listening and sync approvals']},
 {'id':'experience','skill':'course-review-experience','status':'pending'},
 {'id':'delivery','skill':'course-delivery','status':'not_started','platformBinding':'separate authorization required'}],
 'externalCalls':{'paidGeneration':0,'renders':0,'uploads':0,'budget':'Not established; no paid provider call authorized by intake alone.'},
 'oldEdition':{'publishedRevision':state['revision'],'handoverSHA256':state['handover_sha256'],'protectedFilePreimages':old_hashes},
 'stoppingPoint':'Scoped source audit and proposed full-path specification saved; first representative written pilot ready.',
 'nextAction':'Write S01 full bilingual draft, its questions/private criteria and feedback; review actual source-bound meaning before media.'})
assert all(sha((P/name).read_bytes())==h for name,h in old_hashes.items()),'A prior control changed; investigate instead of overwriting'
save('intake-receipt.en.json',{'createdUTC':now,'sourceSHA256':source_sha,'sourceReadOnly':True,'sourceDuplicated':False,'oldControlHashesUnchanged':old_hashes,'sourceItems':len(items),'tableRows':19,'proposedSteps':11,'locales':['ar-EG','en'],'writtenFilesBeforeReceipt':written[:],'productionCalls':0,'handoverWorkflowInvoked':False,'writerSessionCreated':False,'registrationCreated':False})
print(json.dumps({'root':str(R),'sourceItems':len(items),'newFiles':len(written),'oldControlsUnchanged':True,'next':'bounded bilingual S01 written pilot'}))
