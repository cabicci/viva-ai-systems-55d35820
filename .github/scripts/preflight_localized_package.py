#!/usr/bin/env python3
"""Preflight for locale-aware Bunny pilot cells.

Runs BEFORE any paid Gemini / TTS / Veo call. Fails hard (non-zero exit) if the
localized lesson package cannot be resolved OR does not match (lesson_id, locale).
Emits /tmp/<composite>/evidence.json capturing the exact source of truth that
will feed the localized script + voice + captions.

Env:
  LID              Lesson id (e.g. intro-m1-l4-ai-can-cannot)
  LOCALE           ar-MSA | ar-Gulf | en
  COMPOSITE_KEY    ${LID}__${LOCALE}
"""
from __future__ import annotations
import hashlib
import json
import os
import sys
from pathlib import Path

LID = os.environ["LID"]
LOCALE = os.environ["LOCALE"]
COMPOSITE = os.environ.get("COMPOSITE_KEY", f"{LID}__{LOCALE}")

# Locale → prompt profile identifiers + actual TTS model/voices consumed by
# gemini_tts.py. We do NOT list Google Cloud Wavenet voices — nothing in the
# pipeline calls them. Actual voices per segment (Charon / Aoede) are picked
# by the script writer per scene.
PROFILE_TABLE = {
    "ar-MSA":  {
        "language": "ar",
        "script_prompt_profile": "ar-MSA-v1",
        "tts_prompt_profile":    "ar-MSA-tts-v1",
        "tts_model":             "gemini-2.5-flash-preview-tts",
        "actual_voice_policy":   "gemini-tts:Charon(primary),Aoede(secondary)",
        "egyptian_phonetic_rewrite": False,
    },
    "ar-Gulf": {
        "language": "ar",
        "script_prompt_profile": "ar-Gulf-v1",
        "tts_prompt_profile":    "ar-Gulf-tts-v1",
        "tts_model":             "gemini-2.5-flash-preview-tts",
        "actual_voice_policy":   "gemini-tts:Charon(primary),Aoede(secondary)",
        "egyptian_phonetic_rewrite": False,
    },
    "en": {
        "language": "en",
        "script_prompt_profile": "en-v1",
        "tts_prompt_profile":    "en-tts-v1",
        "tts_model":             "gemini-2.5-flash-preview-tts",
        "actual_voice_policy":   "gemini-tts:Charon(primary),Aoede(secondary)",
        "egyptian_phonetic_rewrite": False,
    },
}

if LOCALE not in PROFILE_TABLE:
    sys.stderr.write(f"::error::Unknown locale {LOCALE!r}; expected one of {sorted(PROFILE_TABLE)}\n")
    sys.exit(2)

package_path = Path("src/lib/locale-lessons") / LOCALE / "lessons" / f"{LID}.json"
if not package_path.is_file():
    sys.stderr.write(
        f"::error::Localized package NOT FOUND for ({LID}, {LOCALE}) at {package_path}. "
        "Refusing to proceed to paid generation.\n"
    )
    sys.exit(3)

raw = package_path.read_bytes()
sha256 = hashlib.sha256(raw).hexdigest()

try:
    data = json.loads(raw.decode("utf-8"))
except Exception as e:
    sys.stderr.write(f"::error::Package {package_path} is not valid JSON: {e}\n")
    sys.exit(4)

pkg_lesson = data.get("lessonId")
pkg_locale = data.get("locale")
if pkg_lesson != LID:
    sys.stderr.write(
        f"::error::Package lessonId mismatch: got {pkg_lesson!r}, expected {LID!r}\n"
    )
    sys.exit(5)
if pkg_locale != LOCALE:
    sys.stderr.write(
        f"::error::Package locale mismatch: got {pkg_locale!r}, expected {LOCALE!r}\n"
    )
    sys.exit(6)

sections = data.get("sections") or []
if not sections:
    sys.stderr.write(f"::error::Package {package_path} has no sections — nothing to narrate.\n")
    sys.exit(7)

# Content fingerprint (proves each locale carries distinct copy).
content_fp = hashlib.sha256(
    json.dumps(sections, ensure_ascii=False, sort_keys=True).encode("utf-8")
).hexdigest()

voice_row = VOICE_TABLE[LOCALE]
evidence = {
    "lesson_id": LID,
    "locale": LOCALE,
    "composite_key": COMPOSITE,
    "localized_package_path": str(package_path),
    "package_sha256": sha256,
    "content_fingerprint_sha256": content_fp,
    "section_count": len(sections),
    "title": data.get("title"),
    "title_en": data.get("titleEn"),
    "script_language": voice_row["language"],
    "selected_voice": voice_row["voice"],
    "voice_note": voice_row["voice_note"],
    "canonical_source": data.get("sourceFile"),
    "canonical_version": data.get("canonicalVersion"),
    "production_route": data.get("productionRoute"),
}

out_dir = Path(f"/tmp/{COMPOSITE}")
out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / "evidence.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2))
# Machine-readable summary line for the Actions log:
print(f"::notice::preflight ok lesson={LID} locale={LOCALE} package_sha256={sha256} content_fp={content_fp} voice={voice_row['voice']}")
print(json.dumps(evidence, ensure_ascii=False, indent=2))
