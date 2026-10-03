import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("collection", Path(__file__).parents[1] / "ensure_bunny_collection.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CollectionTests(unittest.TestCase):
    def test_reuses_exact_match_on_later_page_without_creating(self):
        calls = []
        def request(method, suffix, payload=None):
            calls.append(method)
            return {"totalItems": 2, "itemsPerPage": 1, "items": [{"name": module.NAME + " archive", "guid": "other"}] if len(calls) == 1 else [{"name": module.NAME, "guid": "existing"}]}
        self.assertEqual(module.ensure_collection(request), "existing")
        self.assertEqual(calls, ["GET", "GET"])

    def test_creates_once_when_no_exact_match_exists(self):
        calls = []
        def request(method, suffix, payload=None):
            calls.append(method)
            return {"totalItems": 0, "items": []} if method == "GET" else {"name": module.NAME, "guid": "created"}
        self.assertEqual(module.ensure_collection(request), "created")
        self.assertEqual(calls, ["GET", "POST"])

    def test_refuses_a_duplicate_collection_name(self):
        def request(method, suffix, payload=None):
            self.assertEqual(method, "GET")
            return {"totalItems": 2, "items": [{"name": module.NAME, "guid": "one"}, {"name": module.NAME, "guid": "two"}]}
        with self.assertRaises(RuntimeError):
            module.ensure_collection(request)


if __name__ == "__main__":
    unittest.main()
