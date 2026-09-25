"""Verify 144 owner-reviewed Kids lesson JSON packages, then stage privately.
Dry-run: python scripts/kids/upload_private_content.py --source-dir PRIVATE_DIRECTORY
Apply:   python scripts/kids/upload_private_content.py --source-dir PRIVATE_DIRECTORY --apply
Requires applied Kids migrations and SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
in a trusted runtime. Never place either a source file or the service key in Git.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

BUCKET = "kids-lesson-content"
REVIEW = "owner-content-review-2026-09-24"
LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")
parser = argparse.ArgumentParser()
parser.add_argument("--source-dir", type=Path, required=True)
parser.add_argument("--apply", action="store_true")
args = parser.parse_args()
source = args.source_dir.resolve(strict=True)
repo = Path(__file__).resolve().parents[2]
if source == repo or repo in source.parents:
    raise SystemExit("Private content source must be outside Git repository")
manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
packages = manifest["packages"]
expected = {f"level-{level}/lesson-{lesson:02}/{locale}.json"
            for level in (1, 2, 3) for lesson in range(1, 13) for locale in LOCALES}
paths = [item["path"] for item in packages]
if len(paths) != 144 or set(paths) != expected or len(set(paths)) != 144:
    raise SystemExit("Expected exactly one package for each of 144 lessons/locales")
items = []
for item in packages:
    path = item["path"]
    file = (source / path).resolve(strict=True)
    if source not in file.parents or file.is_symlink() or file.stat().st_size > 262144:
        raise SystemExit(f"Invalid private content file: {path}")
    data = file.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    parsed = json.loads(data.decode("utf-8"))
    if digest != item["sha256"] or parsed.get("locale") != item["locale"]:
        raise SystemExit(f"Invalid content digest or locale: {path}")
    if path != f"level-{item['level']}/lesson-{item['lesson']:02}/{item['locale']}.json":
        raise SystemExit(f"Invalid path mapping: {path}")
    items.append((item, data, digest))
print(f"Verified {len(items)} private packages and SHA-256 source digests")
if not args.apply:
    raise SystemExit(0)
base = os.environ.get("SUPABASE_URL", "").rstrip("/")
service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not base.startswith("https://") or not service:
    raise SystemExit("Trusted Supabase URL and service-role credentials are required")
def call(method, route, payload=None, content_type="application/json"):
    headers = {"Authorization": f"Bearer {service}", "apikey": service,
               "Content-Type": content_type,
               "Prefer": "resolution=merge-duplicates,return=minimal"}
    request = Request(base + route, data=payload, headers=headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            return response.read()
    except HTTPError as exc:
        raise RuntimeError(f"Supabase {method} request failed with HTTP {exc.code}") from None
bucket = json.loads(call("GET", f"/storage/v1/bucket/{BUCKET}"))
if bucket.get("public") is not False:
    raise SystemExit("Missing private bucket: apply database migrations first")
call("GET", "/rest/v1/kids_content_approvals?select=approved_sha256&limit=0")
uploaded = reused = 0
for item, data, digest in items:
    route = f"/storage/v1/object/{BUCKET}/{quote(item['path'], safe='/')}"
    try:
        saved = call("GET", route)
    except RuntimeError as exc:
        if "HTTP 404" not in str(exc):
            raise
        call("POST", route, data)
        uploaded += 1
    else:
        if hashlib.sha256(saved).hexdigest() != digest:
            raise RuntimeError(f"Object mismatch: {item['path']}; refusing to replace")
        reused += 1
    if hashlib.sha256(call("GET", route)).hexdigest() != digest:
        raise RuntimeError(f"Object verification failed: {item['path']}")
print(f"Verified 144 private bucket objects ({uploaded} new, {reused} reused)")
at = datetime.datetime.now(datetime.timezone.utc).isoformat()
approvals = [{"level_id": f"level-{item['level']}",
              "lesson_number": item["lesson"], "locale": item["locale"],
              "approved_sha256": digest, "approved_at": at,
              "approval_reference": REVIEW} for item, _, digest in items]
call("POST", "/rest/v1/kids_content_approvals?on_conflict=level_id,lesson_number,locale",
     json.dumps(approvals).encode("utf-8"))
stored = json.loads(call("GET", "/rest/v1/kids_content_approvals"
     f"?select=level_id,lesson_number,locale,approved_sha256,approval_reference"
     f"&approval_reference=eq.{REVIEW}&limit=200"))
approved = {(row["level_id"], row["lesson_number"], row["locale"]): row["approved_sha256"]
            for row in stored if row["approval_reference"] == REVIEW}
for record in approvals:
    key = (record["level_id"], record["lesson_number"], record["locale"])
    if approved.get(key) != record["approved_sha256"]:
        raise RuntimeError(f"Approval digest verification failed: {key}")
print(f"Verified {len(approvals)} owner-reviewed approvals; release flags remain closed")
