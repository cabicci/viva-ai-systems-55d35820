import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import import_academic_rag as rag


def row(course='AC-BUS', lesson='AC-BUS-M01-L01'):
    text = 'Approved section text'
    return {'courseId':course,'lessonId':lesson,'locale':'en','version':'1',
            'sectionId':'concept-1','text':text,'sha256':hashlib.sha256(text.encode()).hexdigest(),
            'sourceSha256':'a'*64,'approval':'PENDING_EDITORIAL'}


class ImportTests(unittest.TestCase):
    def test_course_identity_and_hash_are_immutable(self):
        self.assertEqual(rag.validate(row())['courseId'],'AC-BUS')
        for bad in [{**row(), 'lessonId':'AC-OTHER-M01-L01'},
                    {**row(), 'sha256':'b'*64},
                    {**row(), 'quizAnswer':'hidden'}]:
            with self.assertRaises(ValueError): rag.validate(bad)

    def test_reject_duplicates(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'corpus.jsonl'
            path.write_text(json.dumps(row())+'\n'+json.dumps(row())+'\n')
            with self.assertRaises(ValueError): rag.load(path)

    def test_unapproved_db_source_blocks_all_embedding_and_writes(self):
        with patch.object(rag,'request',return_value=[{'source_sha256':'a'*64,'approved':False}]) as request:
            with patch.object(rag,'embed') as embed:
                with self.assertRaises(ValueError): rag.apply([row()],'https://db.example','service','openai')
                embed.assert_not_called()
                self.assertEqual(request.call_count,1)

    def test_changed_source_blocks_all_embedding_and_writes(self):
        with patch.object(rag,'request',return_value=[{'source_sha256':'b'*64,'approved':True}]):
            with patch.object(rag,'embed') as embed:
                with self.assertRaises(ValueError): rag.apply([row()],'https://db.example','service','openai')
                embed.assert_not_called()


if __name__=='__main__': unittest.main()
