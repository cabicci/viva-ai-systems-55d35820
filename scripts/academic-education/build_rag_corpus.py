"""Local RAG staging only. No upload, embeddings, provider calls or answer keys."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
LOCALES=['ar-EG','ar-MSA','ar-Gulf','en']
def make_chunks(lesson,locale):
 if lesson['locale']!=locale or locale not in LOCALES:raise ValueError('Locale mismatch')
 records=[]
 # Explicit field allowlist: do not serialize lesson or arbitrary nested objects.
 for section in lesson['sections']:
  text=section['title']+'\n'+section['text']
  records.append({'courseId':'AC-BUS','lessonId':lesson['id'],'locale':locale,'version':lesson.get('version','1.0.0-pilot'),'sectionId':section['id'],'text':text,'sha256':hashlib.sha256(text.encode()).hexdigest(),'approval':'PENDING_EDITORIAL'})
 return records

def main():
 records=[]
 for locale in LOCALES:
  source=ROOT/f'experiments/academic/course/expanded/{locale}.json'
  if not source.exists():raise SystemExit('Expanded content missing: '+locale)
  lessons=[json.loads((ROOT/f'experiments/academic/content/{locale}.json').read_text()),*json.loads(source.read_text())]
  for lesson in lessons:records.extend(make_chunks(lesson,locale))
 out=ROOT/'tmp/academic-rag';out.mkdir(parents=True,exist_ok=True)
 (out/'corpus.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
 print(json.dumps({'chunks':len(records),'uploaded':False,'answersIncluded':False,'approval':'PENDING_EDITORIAL'}))
if __name__=='__main__':main()
