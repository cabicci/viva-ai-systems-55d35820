"""Offline validation for academic lesson packages prepared for delivery."""

import json
import re

LOCALES=['ar-EG','ar-MSA','ar-Gulf','en']


def validate(d,lesson_id,locale):
 assert d['id']==lesson_id and d['locale']==locale
 def reject_embedded_schema(value):
  if isinstance(value,dict):
   for item in value.values():reject_embedded_schema(item)
  elif isinstance(value,list):
   for item in value:reject_embedded_schema(item)
  elif isinstance(value,str):
   assert not re.search(r'(?:reflection|readingVisuals|assignment|sections|videoVisualPlan)"\s*:',value), 'embedded_schema_in_text'
 reject_embedded_schema(d)
 def text(value):
  assert isinstance(value,str) and value.strip(), 'missing_text'
 for key in ['title','intro']:text(d[key])
 for group in ['goals','summary']:
  for value in d[group]:text(value)
 for section in d['sections']:
  for key in ['id','title','text','reflection']:text(section[key])
 for key in ['title','text','decision']:text(d['example'][key])
 for value in d['example']['steps']:text(value)
 text(d['assignment']['prompt'])
 for key in ['fields','criteria']:
  for value in d['assignment'][key]:text(value)
 for row in d['assignment']['rubric']:
  for key in ['criterion','excellent','adequate','needsRevision']:text(row[key])
 for row in d['faq']:
  text(row['question']);text(row['answer'])
 for q in d['quiz']:
  text(q['id']);text(q['question'])
  for choice in q['options']:text(choice)
 for visual in d['readingVisuals']:
  for key in ['id','title','caption']:text(visual[key])
  for value in visual['columns']:text(value)
  for row in visual['rows']:
   # Blank cells may encode continuation in a hierarchy; other types are invalid.
   for value in row:assert isinstance(value,str), 'invalid_visual_cell'
 assert len({v['id'] for v in d['readingVisuals']})==3
 for value in d['videoVisualPlan']:text(value)
 assert len(d['goals'])==4 and len(d['sections'])==6 and len(d['quiz'])==6
 assert len({s['id'] for s in d['sections']})==6
 assert sum(len(s['text'].split()) for s in d['sections'])>=650,'reading_depth'
 assert all(len(s['text'].split())>=80 for s in d['sections']),'section_depth'
 assert len(d['example']['steps'])>=5 and len(d['assignment']['rubric'])==5
 assert len(d['assignment']['fields'])==5 and len(d['assignment']['criteria'])==5
 assert len({q['id'] for q in d['quiz']})==6
 for q in d['quiz']:
  assert len(q['options'])==4 and len(set(q['options']))==4
  assert type(q['correct']) is int and 0<=q['correct']<4
  assert len(q['explanation'].split())>=15
 assert len({q['correct'] for q in d['quiz']})>=2
 assert len(d['faq'])==3 and len(d['summary'])==4
 assert len(d['readingVisuals'])==len(d['videoVisualPlan'])==3
 for v in d['readingVisuals']:
  assert v['kind'] in ['flow','comparison','table']
  assert 2<=len(v['columns'])<=3 and 2<=len(v['rows'])<=8
  assert all(len(row)==len(v['columns']) for row in v['rows'])
 text=json.dumps(d,ensure_ascii=False)
 assert not re.search(r'https?://|openstax|ocw\.mit|edu4arab|جامعة القاهرة',text,re.I)
 if locale=='en': assert not re.search(r'[\u0600-\u06ff]',text),'english_purity'
 for s in d['sections']:assert s['reflection'].strip()
 return d
