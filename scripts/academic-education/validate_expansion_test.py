import unittest
from expand_lessons import validate
class PackageValidation(unittest.TestCase):
 def package(self):
  return {'id':'AC-BUS-M01-L02','locale':'en','title':'A lesson','intro':'An introduction','goals':['a','b','c','d'],'sections':[{'id':str(i),'title':'A section','text':' '.join(['Explain']*110),'reflection':'Apply this reasoning.'} for i in range(6)],'example':{'title':'Case','text':'A fictional case','decision':'A justified choice','steps':['a']*5},'assignment':{'prompt':'Complete the artifact','rubric':[{'criterion':'Observable outcome','excellent':'Correct and justified','adequate':'Correct','needsRevision':'Missing reasoning'}]*5,'fields':['a']*5,'criteria':['a']*5},'quiz':[{'id':str(i),'question':'Which response follows the evidence?','options':['a','b','c','d'],'correct':i%4,'explanation':' '.join(['Reason']*16)} for i in range(6)],'faq':[{'question':'Why?','answer':'Because of the evidence.'}]*3,'summary':['a']*4,'readingVisuals':[{'id':str(i),'title':'A comparison','caption':'Read the evidence','kind':'table','columns':['a','b'],'rows':[['x','y'],['z','w']]} for i in range(3)],'videoVisualPlan':['a']*3}
 def test_accepts_required_structure(self):validate(self.package(),'AC-BUS-M01-L02','en')
 def test_rejects_short_reading(self):
  d=self.package();d['sections'][0]['text']='short'
  with self.assertRaises(AssertionError):validate(d,d['id'],d['locale'])
 def test_rejects_answer_outside_choices(self):
  d=self.package();d['quiz'][0]['correct']=4
  with self.assertRaises(AssertionError):validate(d,d['id'],d['locale'])
 def test_rejects_wrong_locale_and_source_names(self):
  d=self.package()
  with self.assertRaises(AssertionError):validate(d,d['id'],'ar-EG')
  d['note']='https://example.test'
  with self.assertRaises(AssertionError):validate(d,d['id'],d['locale'])
 def test_rag_excludes_private_fields_and_preserves_locale(self):
  from build_rag_corpus import make_chunks
  d=self.package();d['privateTeacherNotes']='PRIVATE_SENTINEL';d['quiz'][0]['explanation']='ANSWER_SENTINEL';d['provenance']={'secret':'PROVENANCE_SENTINEL'}
  import json
  chunks=make_chunks(d,'en');serialized=json.dumps(chunks)
  self.assertEqual(len(chunks),6)
  for private in ['PRIVATE_SENTINEL','ANSWER_SENTINEL','PROVENANCE_SENTINEL']:self.assertNotIn(private,serialized)
  self.assertTrue(all(chunk['locale']=='en' for chunk in chunks))
  with self.assertRaises(ValueError):make_chunks(d,'ar-EG')
if __name__=='__main__' :unittest.main()
