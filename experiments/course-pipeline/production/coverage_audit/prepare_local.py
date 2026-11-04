"""Freeze actual learner text and verify the authoritative PDF; never edits lessons."""
import hashlib,json,sys
from pathlib import Path
from datetime import datetime,timezone
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
PRIVATE=ROOT/'private/coverage-audit'
def write(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
 plan=json.loads((ROOT.parent/'planning/curriculum-map.json').read_text(encoding='utf-8'))
 pdf=PRIVATE/'original-en.pdf';assert digest(pdf)==plan['source']['sha256'],'Wrong original source PDF'
 reader=PdfReader(pdf);assert len(reader.pages)==146
 pages=[{'page':i+1,'text':page.extract_text() or ''} for i,page in enumerate(reader.pages)]
 write(PRIVATE/'source-pages.json',{'sourceSha256':digest(pdf),'physicalPages':146,'pages':pages})
 records=[]
 for spec in plan['lessons']:
  lid=spec['id'];base=ROOT.parent/'course' if lid=='SOIL-U1-L03' else ROOT.parent/'public/curriculum'/lid
  for loc in ['en','ar-EG','it','de']:
   original=base/(loc+'.json');assert original.exists(),str(original)
   target=PRIVATE/'snapshot'/lid/(loc+'.json');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(original.read_bytes())
   records.append({'stepId':lid,'locale':loc,'sha256':digest(original),'sourcePath':str(original),'snapshotPath':str(target)})
 write(PRIVATE/'snapshot-manifest.json',{'capturedAt':datetime.now(timezone.utc).isoformat(),'source':plan['source'],'files':records})
 print(json.dumps({'sourcePages':146,'textCharacters':sum(len(p['text']) for p in pages),'snapshotFiles':len(records),'shortTextPages':[p['page'] for p in pages if len(p['text'].strip())<150]}))
if __name__=='__main__':main()
