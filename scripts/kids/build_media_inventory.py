#!/usr/bin/env python3
"""Build a checksum-verified Kids media inventory; never upload media or credentials."""
import argparse
import hashlib
import json
from pathlib import Path

LOCALES = ("ar-EG", "ar-MSA", "ar-Gulf", "en")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True, help="Kids pilot experiments root")
    parser.add_argument("--media-root", type=Path, required=True, help="Reviewed media directory")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve()
    media_root = args.media_root.resolve()
    level_one = json.loads((source / "content/media-level1.json").read_text(encoding="utf-8"))
    advanced = json.loads((source / "content/media-advanced.json").read_text(encoding="utf-8"))
    pilot = json.loads((source / "content/media.json").read_text(encoding="utf-8"))
    entries = []

    def add(level: int, number: int, locale: str, media: dict, provenance: str) -> None:
        if locale not in LOCALES:
            raise ValueError(f"Unsupported locale: {locale}")
        relative = Path(media["url"])
        if relative.is_absolute() or ".." in relative.parts or relative.suffix != ".mp4":
            raise ValueError(f"Unsafe media path: {relative}")
        path = (media_root / relative).resolve()
        if not path.is_relative_to(media_root) or not path.is_file():
            raise ValueError(f"Missing media file: {relative}")
        with path.open("rb") as file:
            digest = hashlib.file_digest(file, "sha256").hexdigest()
        expected = media.get("sha256")
        if expected and digest != expected:
            raise ValueError(f"Checksum mismatch: {relative}")
        entries.append({
            "lessonId": f"kids-l{level}-{number:02d}",
            "locale": locale,
            "source": relative.as_posix(),
            "sha256": digest,
            "bytes": path.stat().st_size,
            "provenance": provenance,
        })

    for locale in LOCALES:
        add(1, 1, locale, pilot[locale], "pilot-local-file")
    for number, locales in level_one.items():
        for locale, media in locales.items():
            add(1, int(number), locale, media, media["provenance"])
    for level, lessons in advanced.items():
        for number, locales in lessons.items():
            for locale, media in locales.items():
                add(int(level), int(number), locale, media, media["provenance"])
    entries.sort(key=lambda entry: (entry["lessonId"], LOCALES.index(entry["locale"])))
    keys = {(entry["lessonId"], entry["locale"]) for entry in entries}
    expected_keys = {(f"kids-l{level}-{number:02d}", locale)
                     for level in (1, 2, 3) for number in range(1, 13) for locale in LOCALES}
    if keys != expected_keys or len(entries) != len(expected_keys):
        raise ValueError(f"Kids media grid incomplete: missing={len(expected_keys - keys)}, extra={len(keys - expected_keys)}")
    inventory = {
        "schemaVersion": 1,
        "libraryId": 761387,
        "reviewState": "editorial-and-parental-approval-pending",
        "entries": entries,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"entries": len(entries), "bytes": sum(e["bytes"] for e in entries)}))


if __name__ == "__main__":
    main()
