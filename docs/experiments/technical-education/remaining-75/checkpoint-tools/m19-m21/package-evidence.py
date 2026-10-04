from pathlib import Path
import json,hashlib,subprocess,shutil,re
from PIL import Image,ImageDraw
root=Path.cwd();out=root/'docs/experiments/technical-education/remaining-75/m19-m21-evidence';out.mkdir(exist_ok=True)
tmp=Path('/tmp/technical-m19-m21')
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def baseline(p):return json.loads(subprocess.check_output(['git','show','1595cfd9:'+p],text=True))
old=json.loads((tmp/'baseline-pdfs.json').read_text());assert len(old)==324
assert all(sha(root/p)==h for p,h in old.items())
preserved={}
for p in ['src/lib/technical-education/new-diagrams.json','docs/experiments/technical-education/pdf-revisions.json']:
 b=baseline(p);now=json.loads((root/p).read_text());assert all(now[k]==v for k,v in b.items());added=set(now)-set(b);assert all(re.search(r'M(19|20|21)-L',k) for k in added);preserved[p]={'baseline_entries':len(b),'added_entries':len(added),'all_baseline_entries_unchanged':True}
ids=[f'M19-L0{i}' for i in range(1,4)]+[f'M20-L0{i}' for i in range(1,5)]+[f'M21-L0{i}' for i in range(1,4)]
assets=[p for p in (root/'public/experiments/technical-education').rglob('*') if p.is_file() and re.search(r'M(19|20|21)-L',str(p))]
assert sum(p.suffix=='.pdf' for p in assets)==80;assert sum(p.suffix=='.svg' for p in assets)==120
dump(out/'asset-hashes.json',{str(p.relative_to(root)):sha(p) for p in sorted(assets)})
dump(out/'preservation.json',{'base':'1595cfd9','baseline_pdfs':324,'all_pdf_hashes_unchanged':True,'maps':preserved})
shutil.copy(tmp/'baseline-pdfs.json',out/'baseline-pdf-hashes.json')
for src,dst in [('ui-results.json','browser-results.json'),('ui-final-geometry-results.json','browser-final-geometry-results.json'),('svg/results.json','svg-bounds.json'),('pdf-pages/page-counts.json','pdf-page-counts.json'),('integrity.json','scoped-structural-integrity.json'),('tests.log','targeted-tests.txt'),('types.log','typescript.txt')]:
 shutil.copy(tmp/src,out/dst)
for group,pattern in [('pdf-pages','contact-*.jpg'),('svg','contact-*.jpg')]:
 d=out/group;d.mkdir(exist_ok=True)
 for p in (tmp/group).glob(pattern):shutil.copy(p,d/p.name)
# Browser sheets after final corrected screenshots, in compact desktop rows.
d=out/'browser';d.mkdir(exist_ok=True)
for locale in ['ar-EG','en']:
 for width in [390,1440]:
  files=sorted((tmp/'ui').glob(f'*-{locale}-{width}.png'))
  for start in range(0,len(files),5):
   tilew=400 if width==390 else 720
   ims=[]
   for f in files[start:start+5]:
    im=Image.open(f);im.thumbnail((tilew-4,2750));ims.append((f,im.copy()))
   h=max(im.height for f,im in ims)+35;sheet=Image.new('RGB',(tilew*len(ims),h),'white');draw=ImageDraw.Draw(sheet)
   for j,(f,im) in enumerate(ims):sheet.paste(im,(j*tilew,30));draw.text((j*tilew+2,5),f.stem,fill='black')
   sheet.save(d/f'contact-{locale}-{width}-{start//5}.jpg',quality=92)
# Source pages are reviewed source material, not learner assets. Keep metadata only.
cm=json.loads((root/'docs/experiments/technical-education/curriculum-map.json').read_text());lessons=cm['lessons']
selected=[{'id':l['id'],'pages':l['source_pdf_pages'],'supplemental_original_authoring':l.get('supplemental_authoring_required',False)} for l in lessons if l['id'] in ids]
dump(out/'source-anchors.json',{'review_date':'2026-10-04','pdf':{'name':'Metwood_Furniture_Design(1).pdf','sha256':'63ae6c7b933fe33cacddbb32210390d43926da632b72d9cbeb5643f10bc6a136','page_count':408,'review':'55 scoped source pages rasterized and visually inspected; conceptual anchors only, not normative requirements or copied learner pages'},'lesson_anchors':selected,'supplemental_primary_sources':[{'url':'https://www.access-board.gov/ada/','reviewed_sections':['902 Dining Surfaces and Work Surfaces','904 Check-Out Aisles and Sales and Service Counters'],'use':'Distinguish task, approach/clear space and surface height. This is a U.S. source, not a universal code; no numeric code values imported.'},{'url':'https://www.access-board.gov/ada/guides/chapter-4-accessible-routes/','use':'Accessible routes are coordinated movement conditions, not an empty chair-count diagram. Applicability remains with the actual project team.'},{'url':'https://www.hermanmiller.com/content/dam/hermanmiller/documents/materials/reference_info/Care_Finishes.pdf','use':'Tie care to the actual finish/product. No cleaning formula copied.'},{'url':'https://www.hermanmiller.com/content/dam/hermanmiller/documents/materials/reference_info/Care_Textiles.pdf','use':'Textile care differs by actual material; do not universally transfer instructions between surfaces.'}],'original_cases':['Hotel 12 rooms × 2 bedside units = 24 including reference units; service front replacement affects acceptance.','Restaurant 6 tables × 4 chairs = 24; relocating a table changes occupied service-route conflicts without changing count.','Reception guest/staff task, screen sightline and rear cable-cover access coordination.','Custom curved drawer collision; named sections and mirrored A/B geometry.','40 mm assembly depth minus 18, 6 and 2 leaves 14 mm geometric remainder, not approved fitting allowance.','Closed/open projection 350/950 mm yields 600 mm change; user envelope and concurrent storage access still need testing.','Capstone reception plus C-A/C-B storage units: 3 to 4 shelves each changes total 6 to 8, delta 2; dependent documents updated.','Final review has 5 issues with 3 closed, leaving 2 explicitly open.']})
print('Evidence packaged; 324 PDFs preserved; 120 SVG + 80 PDF hashes recorded')
