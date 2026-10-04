import json,re
from pathlib import Path
ROOT=Path('/workspace/scratch/61b6becf6b09/technical-29-35')
LOCALES=['ar-EG','ar-MSA','ar-Gulf','en']
CAT=json.loads((ROOT/'src/lib/technical-education/catalog.json').read_text())
TITLES={l['id']:l['title'] for l in CAT['lessons']}
D={}
def localized(v,i):return v[i] if isinstance(v,(list,tuple)) else v

def lesson(id,intros,sections,example,quiz,assignment,faq,goals=None):
 for i,locale in enumerate(LOCALES):
  ss=[]
  for j,s in enumerate(sections):
   key=f'new-{id}-{s[0]}'
   ss.append({'id':s[0],'title':s[1][i],'text':s[2][i],'diagram':key,'caption':s[3][i]})
  data={'id':id,'locale':locale,'title':TITLES[id][locale],'intro':intros[i],
   'goals':([s[1][i] for s in sections] if goals is None else goals[i]),'sections':ss,
   'example':{'title':['مثال وقرار','حالة تطبيقية وقرار','مثال عملي وقرار','Worked case and decision'][i],'text':example[0][i],'decision':example[1][i]},
   'quiz':[{'id':q[0],'question':q[1][i],'options':q[2][i],'correct':q[3],'explanation':q[4][i]} for q in quiz],
   'assignment':{'prompt':assignment[0][i],'fields':assignment[1][i],'criteria':assignment[2][i]},
   'faq':[{'question':faq[0][i],'answer':faq[1][i],'sectionId':faq[2]}]}
  (ROOT/f'src/lib/technical-education/lessons/{id}__{locale}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def diagram(key,nodes):D[key]=nodes

def rect(x,y,w,h,fill='pale',stroke='teal',rx=4):return {'type':'rect','x':x,'y':y,'width':w,'height':h,'fill':fill,'stroke':stroke,'rx':rx}
def line(x1,y1,x2,y2,color='teal',width=2):return {'type':'line','x1':x1,'y1':y1,'x2':x2,'y2':y2,'stroke':color,'strokeWidth':width}
def circle(x,y,r,fill='mint'):return {'type':'circle','cx':x,'cy':y,'r':r,'fill':fill,'stroke':'teal'}
def path(d,fill='none',stroke='teal',width=2):return {'type':'path','d':d,'fill':fill,'stroke':stroke,'strokeWidth':width}
def text(x,y,ar,en,size=16):
 if re.search(r'[0-9]',ar) and not re.search(r'[\u0600-\u06ff]',ar) and not ar.startswith('\u2066'):ar='\u2066'+ar+'\u2069'
 return {'type':'text','x':x,'y':y,'value':{'ar':ar,'en':en},'fontSize':size}
def save_diagrams():
 f=ROOT/'src/lib/technical-education/new-diagrams.json'
 old=json.loads(f.read_text()) if f.exists() else {}
 old.update(D);f.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
