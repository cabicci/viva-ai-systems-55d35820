"""Regression checks for technical pronunciation and scope of audio-cache changes."""
from __future__ import annotations
import base64
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "lib"))
import gemini_tts as tts
from technical_egyptian import TECHNICAL_EGYPTIAN, technical_policy


class TechnicalVoiceTests(unittest.TestCase):
    def test_original_technical_terms_and_qaf_are_preserved(self):
        text = "طريقة القطع تتطلب دقة. راجع القاع وقائمة القطع: 600 ملّي ناقص 18 ملّي."
        rewritten, prefix = tts.prepare_narration(text, narration_policy=TECHNICAL_EGYPTIAN)
        self.assertEqual(rewritten, text)
        self.assertIn("حسب الكلمة والسياق", prefix)
        self.assertNotIn("ق=همزة", prefix)

    def test_other_locales_do_not_get_egyptian_policy(self):
        for locale in ["en", "ar-MSA", "ar-Gulf"]:
            self.assertIsNone(technical_policy(locale))
            with self.assertRaises(ValueError):
                tts.prepare_narration("قائمة", locale, TECHNICAL_EGYPTIAN)

    def test_legacy_egyptian_callers_keep_their_existing_behavior(self):
        actual, prefix = tts.prepare_narration("قبل طريقة القطع")
        self.assertEqual(actual, tts.egyptianize_with_diff("قبل طريقة القطع")[0])
        self.assertEqual(prefix, tts.EGYPTIAN_RULES_COMPACT)
        self.assertEqual(tts.segment_cache_name(2, "Charon", "قبل", ""), "s2_charon.wav")

    def test_only_affected_segment_identity_changes(self):
        original = tts.segment_cache_name(1, "Charon", "قائمة القطع", "", TECHNICAL_EGYPTIAN)
        self.assertEqual(original, tts.segment_cache_name(1, "Charon", "قائمة القطع", "", TECHNICAL_EGYPTIAN))
        for text, focus in [("قائمة القطع الجديدة", ""), ("قائمة القطع", "نطق مختلف")]:
            self.assertNotEqual(original, tts.segment_cache_name(1, "Charon", text, focus, TECHNICAL_EGYPTIAN))
        revised = tts.NarrationPolicy("revision-2", TECHNICAL_EGYPTIAN.prompt_prefix)
        self.assertNotEqual(original, tts.segment_cache_name(1, "Charon", "قائمة القطع", "", revised))

    def test_policy_is_applied_to_real_request_and_not_spoken_as_text(self):
        captured = []
        class Response:
            def __enter__(self): return self
            def __exit__(self, *_): pass
            def read(self):
                return json.dumps({"candidates": [{"content": {"parts": [{"inlineData": {
                    "data": base64.b64encode(b"\0" * 100).decode()}}]}}]}).encode()
        def respond(request, **_):
            captured.append(json.loads(request.data))
            return Response()
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"TTS_REQUEST_GAP_SECONDS": "0"}), patch.object(tts.urllib.request, "urlopen", respond):
            tts._tts("القاع له مقاس محدد.", "Charon", "احفظ معنى المصطلح", directory + "/a.wav", ["test-only"], narration_policy=TECHNICAL_EGYPTIAN)
        prompt = captured[0]["contents"][0]["parts"][0]["text"]
        self.assertTrue(prompt.startswith(TECHNICAL_EGYPTIAN.prompt_prefix))
        self.assertIn("القاع له مقاس محدد.", prompt)
        self.assertNotIn("الأرار", prompt)
        self.assertEqual(captured[0]["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"], "Charon")

    def test_source_is_not_softened_when_technical_request_is_rejected(self):
        class Response:
            def __enter__(self): return self
            def __exit__(self, *_): pass
            def read(self): return b'{"candidates":[{"finishReason":"PROHIBITED_CONTENT"}]}'
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"TTS_REQUEST_GAP_SECONDS": "0"}), patch.object(tts.urllib.request, "urlopen", return_value=Response()), patch.object(tts, "_soften_text") as soften:
            with self.assertRaisesRegex(RuntimeError, "source text was not rewritten"):
                tts._tts("خطر", "Charon", "", directory + "/a.wav", ["test-only"], narration_policy=TECHNICAL_EGYPTIAN)
            soften.assert_not_called()


if __name__ == "__main__":
    unittest.main()
