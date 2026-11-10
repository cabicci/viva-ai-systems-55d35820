"""Offline tests of the actual call boundary, without executing the runner bootstrap."""
import ast
import json
from pathlib import Path
import re
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

SYNTHETIC_KEY = "synthetic-test-credential-not-a-real-key"


class ProviderDiagnosticsTest(unittest.TestCase):
    def setUp(self):
        path = Path(__file__).with_name("run_v18_10p_5paths_pro.py")
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        endpoint = next(ast.literal_eval(node.value) for node in tree.body
                        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "ENDPOINT_TPL" for t in node.targets))
        boundary = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "call_gemini")
        self.post, self.sleep = Mock(), Mock()
        # Compile only the actual request function. Never execute top-level key
        # reads, lesson loading, output-directory creation or persona templates.
        env = {"requests": SimpleNamespace(post=self.post), "time": SimpleNamespace(sleep=self.sleep),
               "json": json, "re": re, "next_key": lambda: SYNTHETIC_KEY,
               "ENDPOINT_TPL": endpoint, "MODEL": "synthetic-model", "LESSONS": [None],
               "USER_TPL": "Synthetic test input", "SYSTEM": "Synthetic instruction",
               "MISSION_BLOCK_TPL": "Synthetic exercise {mission}"}
        exec(compile(ast.Module(body=[boundary], type_ignores=[]), str(path), "exec"), env)
        self.call = lambda retries=1: env["call_gemini"](
            {"id": "P-test", "arch": "synthetic", "bio": "synthetic", "flag": "test", "behavior": "test"}, 0,
            {"mission_prompt": "", "path": "synthetic", "id": "synthetic-lesson", "title": "Synthetic", "section_titles": [], "body_excerpt": "Synthetic"}, retries)

    def response(self, status=200, body=None, error=None):
        return SimpleNamespace(status_code=status, text="", raise_for_status=Mock(side_effect=error),
                               json=Mock(return_value=body if body is not None else {"candidates": [{"content": {"parts": [{"text": '{"comment":"Synthetic result"}'}]}}]}))

    def test_key_is_header_only_not_in_url_and_success_payload_is_preserved(self):
        self.post.return_value = self.response()
        result = self.call()
        url = self.post.call_args.args[0]
        self.assertNotIn(SYNTHETIC_KEY, url)
        self.assertNotIn("?key=", url)
        self.assertEqual(self.post.call_args.kwargs["headers"], {"x-goog-api-key": SYNTHETIC_KEY})
        self.assertEqual(self.post.call_args.kwargs["timeout"], 180)
        self.assertIs(self.post.call_args.kwargs["allow_redirects"], False)
        self.assertEqual(result["comment"], "Synthetic result")
        self.assertEqual((result["persona_id"], result["lesson_id"]), ("P-test", "synthetic-lesson"))

    def test_http_error_does_not_persist_key_url_headers_or_body(self):
        error = RuntimeError("HTTP error ?key=" + SYNTHETIC_KEY + " headers=" + SYNTHETIC_KEY + " private-response")
        error.response = SimpleNamespace(status_code=403)
        self.post.return_value = self.response(403, error=error)
        result = self.call()
        self.assertEqual(result["error"], "HTTP_403")
        self.assertNotIn(SYNTHETIC_KEY, json.dumps(result))
        self.assertNotIn("private-response", json.dumps(result))

    def test_transport_exception_text_is_not_persisted(self):
        self.post.side_effect = RuntimeError("Connection failed " + SYNTHETIC_KEY)
        self.assertEqual(self.call()["error"], "PROVIDER_RESPONSE_FAILED")

    def test_empty_provider_response_is_not_echoed(self):
        self.post.return_value = self.response(body={"private": SYNTHETIC_KEY})
        self.assertEqual(self.call()["error"], "PROVIDER_RESPONSE_FAILED")

    def test_untrusted_status_string_is_not_persisted(self):
        error = RuntimeError(SYNTHETIC_KEY)
        error.response = SimpleNamespace(status_code=SYNTHETIC_KEY)
        self.post.side_effect = error
        self.assertEqual(self.call()["error"], "PROVIDER_RESPONSE_FAILED")

    def test_out_of_range_and_boolean_status_are_not_diagnostics(self):
        for status in [True, 999, 200, None]:
            with self.subTest(status=status):
                error = RuntimeError(SYNTHETIC_KEY)
                error.response = SimpleNamespace(status_code=status)
                self.post.side_effect = error
                self.assertEqual(self.call()["error"], "PROVIDER_RESPONSE_FAILED")

    def test_retries_keep_bounded_behavior_and_safe_terminal_status(self):
        error = RuntimeError(SYNTHETIC_KEY)
        error.response = SimpleNamespace(status_code=502)
        self.post.return_value = self.response(502, error=error)
        self.assertEqual(self.call(retries=4)["error"], "HTTP_502")
        self.assertEqual(self.post.call_count, 4)
        self.assertEqual([c.args[0] for c in self.sleep.call_args_list], [3, 6, 9])

    def test_exhausted_retryable_responses_preserve_a_safe_result(self):
        for status, delays in ((429, [8, 16, 24]), (503, [8, 16, 24]), (400, [2, 2, 2])):
            with self.subTest(status=status):
                self.post.reset_mock()
                self.sleep.reset_mock()
                error = RuntimeError(SYNTHETIC_KEY)
                response = self.response(status, error=error)
                response.text = "API key " + SYNTHETIC_KEY
                error.response = response
                self.post.return_value = response

                result = self.call(retries=4)

                self.assertEqual(result["error"], f"HTTP_{status}")
                self.assertEqual((result["persona_id"], result["lesson_id"]), ("P-test", "synthetic-lesson"))
                self.assertNotIn(SYNTHETIC_KEY, json.dumps(result))
                self.assertEqual(self.post.call_count, 4)
                self.assertEqual([call.args[0] for call in self.sleep.call_args_list], delays)

    def test_redirect_is_rejected_without_following_or_reading_its_body(self):
        response = self.response(307, body={"private": SYNTHETIC_KEY})
        self.post.return_value = response

        result = self.call(retries=4)

        self.assertEqual(result["error"], "PROVIDER_REDIRECT")
        self.assertNotIn(SYNTHETIC_KEY, json.dumps(result))
        self.assertIs(self.post.call_args.kwargs["allow_redirects"], False)
        self.assertEqual(self.post.call_count, 1)
        response.json.assert_not_called()

    def test_json_parser_failure_does_not_persist_raw_provider_text(self):
        response = self.response()
        response.json.side_effect = ValueError(SYNTHETIC_KEY)
        self.post.return_value = response
        self.assertEqual(self.call()["error"], "PROVIDER_RESPONSE_FAILED")


if __name__ == "__main__":
    unittest.main()
