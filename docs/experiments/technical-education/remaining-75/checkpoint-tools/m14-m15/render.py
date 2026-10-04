from pathlib import Path
import fitz
from PIL import Image,ImageDraw
out=Path('/tmp/technical-51-58/pdf');out.mkdir(exist_ok=True)
count=0
for locale in ['ar-EG','ar-MSA','ar-Gulf','en']:
 pages=[]
 for id in ['M14-L01','M14-L02','M14-L03','M14-L04','M15-L01','M15-L02','M15-L03','M15-L04']:
  for kind in ['workbook','worksheet']:
   pdf=fitz.open(f'public/experiments/technical-education/{locale}/{id}/{kind}.pdf')
   for n,p in enumerate(pdf):
    target=out/f'{id}-{locale}-{kind}-{n+1}.png';p.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(target);pages.append((target,f'{id} {kind} p{n+1}'));count+=1
 for start in range(0,len(pages),8):
  sheet=Image.new('RGB',(1600,2320),'white');draw=ImageDraw.Draw(sheet)
  for j,(p,label) in enumerate(pages[start:start+8]):
   im=Image.open(p);im.thumbnail((775,1100));x=(j%2)*800;y=(j//2)*580
   im.thumbnail((775,545));sheet.paste(im,(x+(800-im.width)//2,y+28));draw.text((x+5,y+5),label,fill='black')
  sheet.save(out/f'contact-{locale}-{start//8}.jpg',quality=95)
print('Rendered',count,'PDF pages')
