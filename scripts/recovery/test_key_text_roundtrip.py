import contextlib
import io
import os
import stat
import tempfile
import unittest
from pathlib import Path

from key_text_roundtrip import encode_key, write_private_text


class KeyTextRoundTripTests(unittest.TestCase):
    def test_roundtrip_preserves_all_bytes_and_leading_zeroes(self):
        key = bytes(range(32))
        self.assertEqual(bytes.fromhex(encode_key(key)), key)
        self.assertEqual(len(encode_key(key)), 64)

    def test_rejects_truncated_and_oversized_keys(self):
        for size in (0, 31, 33, 64):
            with self.assertRaisesRegex(ValueError, "32 bytes"):
                encode_key(bytes(size))

    def test_private_output_without_stdout_or_source_mutation(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "synthetic.key"
            output = Path(folder) / "synthetic.txt"
            key = bytes(range(32))
            source.write_bytes(key)
            printed = io.StringIO()
            with contextlib.redirect_stdout(printed):
                write_private_text(source, output)
            self.assertEqual(printed.getvalue(), "")
            self.assertEqual(bytes.fromhex(output.read_text().strip()), key)
            self.assertEqual(source.read_bytes(), key)
            if os.name == "posix":
                self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o600)

    def test_refuses_overwriting_an_existing_output(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "synthetic.key"
            output = Path(folder) / "existing.txt"
            source.write_bytes(bytes(range(32)))
            output.write_text("existing custody record")
            with self.assertRaises(FileExistsError):
                write_private_text(source, output)
            self.assertEqual(output.read_text(), "existing custody record")


if __name__ == "__main__":
    unittest.main()
