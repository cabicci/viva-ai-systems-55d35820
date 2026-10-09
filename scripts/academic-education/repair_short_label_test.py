import hashlib
import base64
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import repair_short_label as repair


class FakeTts:
    def __init__(self,durations):self.durations=iter(durations);self.calls=[]
    def _tts(self,*args):
        self.calls.append(args);Path(args[3]).write_bytes(b'new'+str(len(self.calls)).encode())
    def _duration_s(self,path):return next(self.durations)


class HeadingRepairTests(unittest.TestCase):
    def run_repair(self,durations,recognize):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        work=Path(temp.name);target=work/'retained.wav';target.write_bytes(b'original')
        tts=FakeTts(durations);audit={'attempts':[]}
        def generate(tts,policy,target,keys,attempt):
            tts._tts(repair.TTS_INPUT,'Charon','',str(target),keys,None,policy)
            return {'audioParts':1}
        repair.repair_label(tts,'policy',target,['private-key'],'asr',audit,work,recognize,generate)
        return tts,audit,target,work
    def test_exact_first_success_and_original_preserved(self):
        t,a,p,w=self.run_repair([2],lambda *args:'تعديل النموذج')
        self.assertEqual((w/'preserved-invalid-label.wav').read_bytes(),b'original')
        self.assertEqual(p.read_bytes(),b'new1');self.assertEqual(len(t.calls),1)
        self.assertEqual(t.calls[0][:3],(repair.TTS_INPUT,'Charon',''))
    def test_long_candidate_does_not_reach_asr(self):
        calls=[]
        t,a,p,w=self.run_repair([9,2],lambda *args:calls.append(args) or 'تعديل النموذج')
        self.assertEqual(len(calls),1);self.assertEqual(len(t.calls),2)
    def test_repetition_rejected_then_exact_accepted(self):
        results=iter(['تعديل النموذج تعديل النموذج','تعديل النموذج'])
        t,a,p,w=self.run_repair([2,2],lambda *args:next(results))
        self.assertFalse(a['attempts'][0]['wordsMatch']);self.assertEqual(len(t.calls),2)
    def test_original_gate_not_relaxed(self):
        self.assertFalse(repair.acceptable(repair.LABEL,6.49));self.assertTrue(repair.acceptable(repair.LABEL,3))
    def test_extra_words_not_normalized_away(self):
        self.assertNotEqual(repair.words('العنوان هو تعديل النموذج'),repair.words(repair.LABEL))
        self.assertNotEqual(repair.words('تعديل النموذج English note'),repair.words(repair.LABEL))
        self.assertEqual(repair.words('تَعْدِيل النَّمُوذَج.'),repair.words(repair.LABEL))
    def test_bounded_all_invalid(self):
        with self.assertRaisesRegex(ValueError,'Bounded'):
            self.run_repair([9]*repair.MAX_ATTEMPTS,lambda *args:self.fail('ASR should not run'))
    def test_provider_rejection_propagates(self):
        with patch.object(FakeTts,'_tts',side_effect=RuntimeError('editorial rejection')):
            with self.assertRaisesRegex(RuntimeError,'editorial'):
                self.run_repair([2],lambda *args:'تعديل النموذج')
    def test_verifier_failure_does_not_promote(self):
        def fail(*args):raise RuntimeError('ASR unavailable')
        with self.assertRaisesRegex(RuntimeError,'ASR unavailable'):self.run_repair([2],fail)
    def test_punctuation_keeps_all_words(self):
        self.assertEqual(repair.words(repair.TTS_INPUT),repair.words(repair.LABEL))
    def test_all_audio_parts_retained_in_order(self):
        parts=[{'inlineData':{'mimeType':'audio/pcm;rate=24000','data':base64.b64encode(b).decode()}} for b in [b'ab',b'cd']]
        pcm,stats=repair.pcm_parts({'candidates':[{'finishReason':'STOP','content':{'parts':parts}}]})
        self.assertEqual(pcm,b'abcd');self.assertEqual(stats['audioParts'],2)
    def test_incomplete_or_rejected_audio_refused(self):
        for finish in ['PROHIBITED_CONTENT','MAX_TOKENS','OTHER']:
            with self.assertRaisesRegex(RuntimeError,'incomplete/rejected'):
                repair.pcm_parts({'candidates':[{'finishReason':finish}]})
    def test_wrong_sample_rate_refused(self):
        with self.assertRaisesRegex(ValueError,'format'):
            repair.pcm_parts({'candidates':[{'finishReason':'STOP','content':{'parts':[{'inlineData':{'mimeType':'audio/pcm;rate=16000','data':'YWI='}}]}}]})
    def test_standard_google_l16_mime(self):
        pcm,_=repair.pcm_parts({'candidates':[{'finishReason':'STOP','content':{'parts':[{'inlineData':{'mimeType':'audio/L16;codec=pcm;rate=24000','data':'YWI='}}]}}]})
        self.assertEqual(pcm,b'ab')


class SplitHeadingTests(unittest.TestCase):
    def run_split(self,durations,transcripts):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        work=Path(temp.name);target=work/'retained.wav';target.write_bytes(b'original')
        tts=FakeTts(durations);audit={'attempts':[]};values=iter(transcripts);calls=[]
        def generate(tts,policy,text,path,keys,attempt):
            calls.append(text);path.write_bytes(text.encode());return {'audioParts':1}
        def join(parts,path):path.write_bytes(b''.join(p.read_bytes() for p in parts))
        repair.repair_split_label(tts,'policy',target,['private'],'asr',audit,work,
            lambda *args:next(values),generate,join)
        return target,work,audit,calls
    def test_each_word_and_combined_must_match(self):
        p,w,a,c=self.run_split([1.4,1.4,2.8],['تعديل','النموذج','تعديل النموذج'])
        self.assertEqual(c,['تعديل.','النموذج.'])
        self.assertEqual(p.read_bytes(),'تعديل.النموذج.'.encode())
        self.assertEqual((w/'preserved-invalid-label.wav').read_bytes(),b'original')
        self.assertTrue(a['combined']['wordsMatch'])
    def test_extra_single_word_rejected_and_retried(self):
        p,w,a,c=self.run_split([1.4,1.4,1.4,2.8],['تعديل تعديل','تعديل','النموذج','تعديل النموذج'])
        self.assertFalse(a['attempts'][0]['wordsMatch']);self.assertEqual(len(c),3)
    def test_combined_missing_word_refused(self):
        with self.assertRaisesRegex(ValueError,'Combined'):
            self.run_split([1.4,1.4,2.8],['تعديل','النموذج','تعديل'])
    def test_per_word_duration_gate_enforced_without_asr(self):
        with self.assertRaisesRegex(ValueError,'Bounded'):
            self.run_split([2]*repair.MAX_ATTEMPTS,[])
    def test_combined_duration_gate_preserved(self):
        with self.assertRaisesRegex(ValueError,'Combined'):
            self.run_split([1.4,1.4,4],['تعديل','النموذج'])
    def test_pcm_join_preserves_all_frames_in_order(self):
        import wave
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup);work=Path(temp.name)
        parts=[]
        for i,data in enumerate([b'\x01\x00'*24,b'\x02\x00'*48]):
            p=work/f'{i}.wav';parts.append(p)
            with wave.open(str(p),'wb') as out:
                out.setnchannels(1);out.setsampwidth(2);out.setframerate(24000);out.writeframes(data)
        repair.join_pcm(parts,work/'joined.wav')
        with wave.open(str(work/'joined.wav'),'rb') as joined:
            self.assertEqual(joined.readframes(joined.getnframes()),b'\x01\x00'*24+b'\x02\x00'*48)


if __name__=='__main__':unittest.main()
