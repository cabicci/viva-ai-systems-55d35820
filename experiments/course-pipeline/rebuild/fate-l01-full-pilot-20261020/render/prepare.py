from pathlib import Path
import json,re,hashlib,shutil,sys,math,difflib,wave
R=Path(__file__).parent;lang=sys.argv[1];index=int(sys.argv[2])-1;D=R/'downloads'/lang;I=R/'downloads'/'images';O=R/'public';O.mkdir(exist_ok=True)
M=json.loads((R/'manifest.json').read_text(encoding='utf-8-sig'));spec=json.loads((R/'scene-spec.json').read_text(encoding='utf-8-sig'));row=M['locales'][lang][index];sid=row['id'];meta=json.loads((D/(sid+'.audio.json')).read_text());timing=json.loads((D/(sid+'.timing.json')).read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((D/(sid+'.wav')).read_bytes())==meta['wavSHA256']==timing['provenance']['actualAudioSHA256']
assert meta['textSHA256']==row['textSHA256'];assert not timing['provenance']['structuralIssues'],timing['provenance']['structuralIssues']
for name in ['sample-analysis.jpg','field-pathways.jpg','Cairo.ttf','masaarat-logo-lockup.png']:shutil.copyfile(R/'inputs'/name,O/name)
asset=spec['assets'][index];candidates=list(I.glob(asset+'.jpg'))+list(I.glob(asset+'.png'))+list(I.glob(asset+'.webp'))
if candidates:shutil.copyfile(candidates[0],O/candidates[0].name);image=candidates[0].name
else:image=asset+'.jpg';assert (O/image).exists()
shutil.copyfile(D/(sid+'.wav'),O/(lang+'-'+sid+'.wav'))
def norm(s):
 s=re.sub('[\u064b-\u065f\u0670\u0640]','',str(s)).lower();s=s.translate(str.maketrans('أإآى','اااي'));return re.sub(r'[^\w\s.]',' ',s).strip()
# These are exact spoken semantic cues; alternatives cover transcript spelling and numeric notation only.
alts={
 ('en',4,4):['apple limit'],('en',5,4):['diagnose poisoning'],('en',7,1):['whenever'],('en',8,0):['scientific experts'],('en',8,1):['evaluating studies'],('en',9,0):['bean sample'],
 ('en',4,0):['zero point zero eight','0.08'],('en',6,0):['two hundred','200 grams'],('en',6,4):['zero point zero one six','0.016'],('en',9,1):['zero point zero six','0.06'],('en',9,2):['zero point zero five','0.05'],('en',9,3):['hundred and fifty','150 grams'],
 ('ar',9,1):['صفر فاصلة صفر ستة','0.06','٠٫٠٦'],('ar',9,2):['صفر فاصلة صفر خمسة','0.05','٠٫٠٥'],('ar',6,4):['ستاشر','ستاشر من الف','0.016','٠٫٠١٦'],('ar',0,0):['مادة محددة'],('ar',3,0):['إحداث الضرر'],('ar',4,0):['التركيز المقاس','التركيز المئاس']}
words=timing['words'];anchors=[]
for k,cue in enumerate(spec['cues'][lang][index]):
 options=alts.get((lang,index,k),[cue]);best=None
 for option in options:
  target=norm(option);count=len(target.split())
  for j,w in enumerate(words):
   for span in range(max(1,count-1),count+2):
    seq=words[j:j+span]
    if len(seq)!=span:continue
    text=norm(' '.join(x['word'] for x in seq));score=1 if text==target else difflib.SequenceMatcher(None,text,target).ratio()
    if score>=.83 and (best is None or score>best['matchScore']):best={'cue':cue,'matchedText':text,'time':w['start'],'end':seq[-1]['end'],'matchScore':round(score,4),'method':'Actual-recording word timestamp match'}
 if best is None:
  for c in timing['captions']:
   if any(norm(x) in norm(c['text']) for x in options):best={'cue':cue,'matchedText':c['text'],'time':c['start'],'end':c['end'],'matchScore':None,'method':'Actual-recording caption span; coarse estimate'};break
 assert best is not None,f'{lang} {sid} missing cue {k}: {options}'
 anchors.append(best)
scene={'id':lang+'-'+sid,'locale':lang,'index':index,'title':row['title'],'audio':lang+'-'+sid+'.wav','image':image,'frames':math.ceil(meta['durationSeconds']*30)+18,'durationSeconds':meta['durationSeconds'],'anchors':anchors,'captions':timing['captions'],'wordTimings':words,'audioSHA256':meta['wavSHA256'],'speechReview':'Generated full passage; no human accent certification','timingMethod':timing['provenance']}
(R/'render-data.json').write_text(json.dumps({'scenes':[scene]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8');out=R/'output';out.mkdir(exist_ok=True);(out/'timing-and-inputs.json').write_text(json.dumps(scene,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Verified inputs and actual-audio anchors for '+scene['id'])
