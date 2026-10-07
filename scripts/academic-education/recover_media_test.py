import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock
import wave

from recover_media import acceptable, generate_segment, join_pcm, matching_receipt, restore_audio


def wav(path, frames=2400):
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(24000)
        f.writeframes(b'\0\0' * frames)


class RecoveryTests(unittest.TestCase):
    def test_original_audio_gate_rejects_long_short_and_nonfinite(self):
        text = 'word ' * 30
        self.assertTrue(acceptable(text, 15))
        for seconds in [654.53, 1, 0, float('nan'), float('inf')]:
            self.assertFalse(acceptable(text, seconds))

    def test_restore_keeps_bytes_and_does_not_copy_unexpected_files(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            saved = root/'saved'
            saved.mkdir()
            (saved/'s0.wav').write_bytes(b'original audio')
            (saved/'other.wav').write_bytes(b'not requested')
            self.assertEqual(restore_audio(saved, root/'audio', ['s0.wav', 's1.wav']), 1)
            self.assertEqual((root/'audio/s0.wav').read_bytes(), b'original audio')
            self.assertFalse((root/'audio/s1.wav').exists())
            self.assertFalse((root/'audio/other.wav').exists())

    def test_empty_restore_refuses_full_regeneration(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):
                restore_audio(Path(d)/'empty', Path(d)/'audio', ['s0.wav'])

    def test_duplicate_segment_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for name in ['a','b']:
                (root/name).mkdir()
                (root/name/'s0.wav').write_bytes(b'voice')
            with self.assertRaises(ValueError):
                restore_audio(root, root/'audio', ['s0.wav'])

    def test_receipt_rejects_wrong_source_and_uploaded_video(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'receipt.json'
            row=dict(lessonId='L',locale='en',sourceSha256='source',fingerprint='fingerprint',uploaded=False)
            path.write_text(json.dumps(row))
            self.assertEqual(matching_receipt(Path(d),'L','en',{'sourceSha256':'source'},'fingerprint'),row)
            with self.assertRaises(ValueError):
                matching_receipt(Path(d),'L','en',{'sourceSha256':'different'},'fingerprint')
            row['uploaded']=True
            path.write_text(json.dumps(row))
            with self.assertRaises(ValueError):
                matching_receipt(Path(d),'L','en',{'sourceSha256':'source'},'fingerprint')

    def test_pcm_join_preserves_all_frames(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            wav(root/'a.wav',100)
            wav(root/'b.wav',200)
            join_pcm([root/'a.wav',root/'b.wav'],root/'joined.wav')
            with wave.open(str(root/'joined.wav'),'rb') as f:
                self.assertEqual(f.getnframes(),300)

    def test_editorial_rejection_never_split_or_retried(self):
        tts=SimpleNamespace(_tts=Mock(side_effect=RuntimeError('Academic narration rejected; source text retained for editorial review')))
        with tempfile.TemporaryDirectory() as d, self.assertRaises(RuntimeError):
            generate_segment(tts,'one two three four',Path(d)/'audio.wav',[],'en',None,Path(d)/'split')
        self.assertEqual(tts._tts.call_count,1)

    def test_other_recovery_preserves_exact_words_and_voice(self):
        calls=[]
        def synth(text,voice,focus,path,*args):
            calls.append((text,voice))
            if len(calls)==1:
                raise RuntimeError('[Charon] exhausted retries: None')
            wav(Path(path))
        tts=SimpleNamespace(_tts=synth,_duration_s=lambda p:2)
        with tempfile.TemporaryDirectory() as d:
            generate_segment(tts,'one two three four five six',Path(d)/'audio.wav',[],'en',None,Path(d)/'split')
        self.assertEqual(' '.join(c[0] for c in calls[1:]),calls[0][0])
        self.assertTrue(all(c[1]=='Charon' for c in calls))


if __name__ == '__main__':
    unittest.main()
