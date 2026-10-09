from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest import TestCase, main
from unittest.mock import Mock

from recover_remaining import LABEL, MAX_ATTEMPTS, retry_label


class RemainingTests(TestCase):
    def test_retries_only_invalid_label_and_keeps_text(self):
        with TemporaryDirectory() as d:
            root = Path(d)
            target = root / 'label.wav'
            gen = Mock(side_effect=lambda *args: target.write_bytes(b'voice'))
            tts = SimpleNamespace(_duration_s=Mock(side_effect=[8.97, 2.1]))
            retry_label(gen, tts, LABEL, target, ['private'], None, None, root/'audit')
            self.assertEqual(gen.call_count, 2)
            self.assertTrue(all(c.args[1] == LABEL for c in gen.call_args_list))
            self.assertTrue((root/'audit/rejected-label-2.wav').exists())

    def test_valid_first_attempt_not_regenerated(self):
        with TemporaryDirectory() as d:
            root = Path(d); target = root/'label.wav'
            gen = Mock(side_effect=lambda *args: target.write_bytes(b'voice'))
            retry_label(gen, SimpleNamespace(_duration_s=lambda _:2), LABEL,
                        target, [], None, None, root/'audit')
            self.assertEqual(gen.call_count, 1)

    def test_bound_does_not_relax_gate(self):
        with TemporaryDirectory() as d:
            root=Path(d); target=root/'label.wav'
            gen=Mock(side_effect=lambda *args: target.write_bytes(b'voice'))
            with self.assertRaisesRegex(ValueError,'original duration gate'):
                retry_label(gen,SimpleNamespace(_duration_s=lambda _:9),LABEL,
                            target,[],None,None,root/'audit')
            self.assertEqual(gen.call_count,MAX_ATTEMPTS)

    def test_editorial_rejection_propagates_without_retry(self):
        with TemporaryDirectory() as d:
            gen=Mock(side_effect=RuntimeError('Academic narration rejected'))
            with self.assertRaisesRegex(RuntimeError,'rejected'):
                retry_label(gen,None,LABEL,Path(d)/'label.wav',[],None,None,Path(d)/'audit')
            self.assertEqual(gen.call_count,1)

    def test_other_scene_uses_existing_recovery_once(self):
        gen=Mock()
        retry_label(gen,None,'Original longer teaching text',Path('output.wav'),[],None,None,Path('audit'))
        self.assertEqual(gen.call_count,1)


if __name__ == '__main__':
    main()
