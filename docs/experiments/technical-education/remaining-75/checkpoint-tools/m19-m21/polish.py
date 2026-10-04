import json,re
from pathlib import Path
folder=Path('src/lib/technical-education/lessons')
math=re.compile(r'[0-9(][0-9.\s()−×÷=+]*[0-9)]')
def walk(v,locale):
 if isinstance(v,str):
  v=v.replace('\u2066','').replace('\u2069','').replace('\u00a0',' ')
  v=re.sub(r'([\u0621-\u065f\u0670])(?=[0-9])',r'\1 ',v)
  v=re.sub(r'([0-9])(?=[\u0621-\u064a])',r'\1 ',v)
  v=re.sub(r':(?=\d)',': ',v)
  def mfix(m):
   s=m[0]
   if not re.search('[−×÷=+]',s):return s
   s=s.replace(' ','\u00a0')
   return '\u2066'+s+'\u2069' if locale!='en' else s
  return math.sub(mfix,v)
 if isinstance(v,list):return [walk(x,locale) for x in v]
 if isinstance(v,dict):return {k:walk(x,locale) for k,x in v.items()}
 return v
for f in folder.glob('M*.json'):
 if not f.name.startswith(('M19','M20','M21')):continue
 d=json.loads(f.read_text());loc=d['locale']
 if d['id']=='M20-L03':
  s=d['sections'][2]
  if loc=='ar-EG':s['text']=s['text'].replace('فتحة إطارها40 مم','حيز تجميع عمقه40 مم')
  elif loc=='ar-MSA':s['text']=s['text'].replace('حيزاً40 مم','حيز تجميع بعمق40 مم')
  elif loc=='ar-Gulf':s['text']=s['text'].replace('حيز40 مم','حيز تجميع بعمق40 مم')
  else:s['text']=s['text'].replace('a 40 mm zone','a 40 mm-deep assembly zone')
 d=walk(d,loc);f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
