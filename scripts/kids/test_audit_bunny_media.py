"""Contract tests for the read-only Kids library audit."""
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("audit_bunny_media",
    Path(__file__).with_name("audit_bunny_media.py"))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
GUID = "80e5155d-c966-4a0b-9703-ac2c9c7bd406"
SHA = "a" * 64
ENTRY = {"lessonId": "kids-l1-01", "locale": "en", "sha256": SHA}
TITLE = f"DRAFT kids-l1-01 en {SHA}"


class KidsAuditTest(unittest.TestCase):
    def digest_report(self, value=SHA, present=True):
        detail = {"title": TITLE, "videoLibraryId": 761387,
                  "status": 4, "storageSize": 123,
                  "captions": [{"srclang": "en", "label": "en"}]}
        if present:
            detail["originalHash"] = value
        return audit.summarize([ENTRY], [{"title": TITLE, "guid": GUID}], lambda _: detail)

    def test_absent_provider_digest_is_unverified_not_ready(self):
        for present, value in [(False, None), (True, None), (True, "")]:
            with self.subTest(present=present, value=value):
                report = self.digest_report(value, present)
                self.assertEqual(report["ready"], 0)
                self.assertEqual((report["digestUnverified"], report["digestVerified"], report["ready"]), (1, 0, 0))
                self.assertEqual(report["missing"], ["kids-l1-01/en"])

    def test_malformed_digest_is_invalid_not_match_or_missing(self):
        for value in [False, 0, [], {}, "not-a-digest", "a" * 32, " " + SHA]:
            with self.subTest(value=value):
                report = self.digest_report(value)
                self.assertEqual((report["digestInvalid"], report["digestUnverified"], report["ready"]), (1, 0, 0))

    def test_valid_mismatched_digest_is_separate_from_unverified(self):
        report = self.digest_report("b" * 64)
        self.assertEqual((report["digestMismatch"], report["digestUnverified"], report["ready"]), (1, 0, 0))

    def test_valid_case_insensitive_match_is_verified(self):
        report = self.digest_report(SHA.upper())
        self.assertEqual((report["digestVerified"], report["digestUnverified"], report["ready"]), (1, 0, 1))

    def test_complete_video_and_caption_with_no_guid_in_output(self):
        index = [{"title": TITLE, "guid": GUID}]
        detail = {"title": TITLE, "videoLibraryId": 761387, "originalHash": SHA,
                  "status": 4, "storageSize": 123, "captions": [{"srclang": "en", "label": "en"}]}
        report = audit.summarize([ENTRY], index, lambda _: detail)
        self.assertEqual((report["ready"], report["missing"]), (1, []))
        self.assertNotIn(GUID, json.dumps(report))

    def test_duplicate_or_wrong_sha_cannot_count_as_complete(self):
        index = [{"title": TITLE, "guid": GUID},
                 {"title": "DRAFT kids-l1-01 en " + ("b" * 64), "guid": GUID}]
        report = audit.summarize([ENTRY], index, lambda _: self.fail("Should not fetch detail"))
        self.assertEqual((report["ready"], report["missing"]), (0, ["kids-l1-01/en"]))
    def test_wrong_caption_or_original_hash_prevents_ready(self):
        detail = {"title": TITLE, "videoLibraryId": 761387, "originalHash": "b" * 64,
                  "status": 3, "storageSize": 123,
                  "captions": [{"srclang": "ar", "label": "ar-EG"}]}
        report = audit.summarize([ENTRY], [{"title": TITLE, "guid": GUID}], lambda _: detail)
        self.assertEqual(report["ready"], 0)
        self.assertEqual(report["missing"], ["kids-l1-01/en"])

    def test_pagination_reads_every_page_or_fails_closed(self):
        pages = iter([{"totalItems": 2, "currentPage": 1, "items": [{"title": TITLE}]},
                      {"totalItems": 2, "currentPage": 2, "items": [{"title": "other"}]}])
        with patch.object(audit, "get_json", side_effect=lambda _url, _key: next(pages)):
            self.assertEqual(len(audit.get_library_index("test-key")), 2)
        with patch.object(audit, "get_json", return_value={"items": [], "totalItems": 1}):
            with self.assertRaisesRegex(RuntimeError, "ended early"):
                audit.get_library_index("test-key")


if __name__ == "__main__":
    unittest.main()
