import hashlib
import json
import unittest
from build_rag_corpus import make_chunks


class CorpusTests(unittest.TestCase):
    def test_allowlisted_sections_only_and_exact_course_hash(self):
        lesson={'id':'AC-BUS-M01-L01','locale':'en','version':'1',
                'sections':[{'id':'concept-1','title':'Cash flow','text':'Money in and out.'}],
                'quiz':[{'correct':2,'explanation':'private'}],
                'assignment':{'privateRubric':'secret'}}
        result=make_chunks(lesson,'en','AC-BUS')
        self.assertEqual(len(result),1)
        self.assertEqual(result[0]['text'],'Cash flow\nMoney in and out.')
        self.assertNotIn('private',json.dumps(result))
        canonical=json.dumps(lesson,ensure_ascii=False,sort_keys=True,separators=(',',':'))
        self.assertEqual(result[0]['sourceSha256'],hashlib.sha256(canonical.encode()).hexdigest())

    def test_course_mismatch_rejected(self):
        with self.assertRaises(ValueError):
            make_chunks({'id':'AC-OTHER-M01-L01','locale':'en','sections':[]},'en','AC-BUS')


if __name__=='__main__': unittest.main()
