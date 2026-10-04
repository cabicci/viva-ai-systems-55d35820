from pathlib import Path
import fitz,json
from PIL import Image,ImageDraw
out=Path('/tmp/technical-m19-m21/pdf-pages');out.mkdir(exist_ok=True)
ids=[f'M19-L0{i}' for i in range(1,4)]+[f'M20-L0{i}' for i in range(1,5)]+[f'M21-L0{i}' for i in range(1,4)]
results=[]
for locale in ['ar-EG','ar-MSA','ar-Gulf','en']:
 pages=[]
 for id in ids:
  for kind in ['workbook','worksheet']:
   path=Path(f'public/experiments/technical-education/{locale}/{id}/{kind}.pdf');doc=fitz.open(path)
   for n,p in enumerate(doc):
    target=out/f'{id}-{locale}-{kind}-{n+1}.png';p.get_pixmap(matrix=fitz.Matrix(1.1,1.1)).save(target);pages.append((target,f'{id} {kind} p{n+1}'))
   results.append({'id':id,'locale':locale,'kind':kind,'pages':len(doc)})
 for start in range(0,len(pages),8):
  sh=Image.new('RGB',(1600,2320),'white');dr=ImageDraw.Draw(sh)
  for j,(p,label) in enumerate(pages[start:start+8]):
   im=Image.open(p);im.thumbnail((775,545));x=(j%2)*800;y=(j//2)*580;sh.paste(im,(x+(800-im.width)//2,y+28));dr.text((x+5,y+5),label,fill='black')
  sh.save(out/f'contact-{locale}-{start//8}.jpg',quality=95)
(out/'page-counts.json').write_text(json.dumps(results,indent=2)+'\n');print('Rendered',sum(r['pages'] for r in results),'pages in',len(results),'PDFs')
