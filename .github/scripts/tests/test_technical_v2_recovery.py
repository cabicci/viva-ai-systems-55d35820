import io
import json
import unittest
import zipfile
from unittest.mock import patch
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import technical_v2_recover_20261011 as r

class Response(io.BytesIO):
    status = 206
    def __init__(self, data, start, end, total):
        super().__init__(data)
        self.headers = {'Content-Range': f'bytes {start}-{end}/{total}'}

class RecoveryTests(unittest.TestCase):
    def test_reads_only_json_and_zip_directory(self):
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w') as archive:
            archive.writestr('technical-v2-audio/M21-L02/segment.wav', b'SECRET_MEDIA' * 1000)
            archive.writestr('technical-v2-output/M21-L02__ar-EG/receipt.json',
                             json.dumps({'newGuid': 'preserved'}), compress_type=zipfile.ZIP_DEFLATED)
        data = output.getvalue()
        media_start = data.index(b'SECRET_MEDIA')
        media_end = media_start + 12000
        def urlopen(req, timeout):
            start, end = map(int, req.headers['Range'][6:].split('-'))
            self.assertFalse(start < media_end and end >= media_start)
            return Response(data[start:end + 1], start, end, len(data))
        with patch.object(r.urllib.request, 'urlopen', side_effect=urlopen):
            self.assertEqual(r.read_receipt_only('https://example.test/archive', len(data),
                                               'M21-L02__ar-EG'), {'newGuid': 'preserved'})

    def test_no_full_download_fallback(self):
        response = Response(b'x' * 22, 78, 99, 100)
        response.status = 200
        with patch.object(r.urllib.request, 'urlopen', return_value=response):
            with self.assertRaisesRegex(RuntimeError, 'Range unsupported'):
                r.read_receipt_only('https://example.test/archive', 100, 'M21-L02__ar-EG')

    def test_ack_hash_conflict_rejected(self):
        receipt = {field: field for field in r.FIELDS}
        ack = dict(receipt, status='linked', cloudReadbackVerified=True)
        self.assertTrue(r.valid_ack(receipt, ack))
        ack['videoSha256'] = 'different'
        self.assertFalse(r.valid_ack(receipt, ack))

    def test_no_create_or_upload(self):
        for method in ['POST', 'PUT', 'PATCH']:
            with self.assertRaisesRegex(RuntimeError, 'cannot create or upload'):
                r.bunny('unused', method)

if __name__ == '__main__':
    unittest.main()
