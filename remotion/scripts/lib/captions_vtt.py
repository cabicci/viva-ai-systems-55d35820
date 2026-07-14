"""Deterministic WebVTT captions from authoritative spoken scenes + TTS timings."""
from __future__ import annotations

import re
from pathlib import Path

# Must match gemini_tts.GAP_MS (500 ms silence between concatenated segments).
GAP_SECONDS = 0.5


def format_timestamp(seconds: float) -> str:
    if seconds < 0:
        seconds = 0.0
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    whole = int(secs)
    millis = int(round((secs - whole) * 1000))
    if millis >= 1000:
        whole += 1
        millis = 0
    return f"{hours:02d}:{minutes:02d}:{whole:02d}.{millis:03d}"


def normalize_cue_text(text: str) -> str:
    t = (text or "").strip()
    if not t:
        raise ValueError("empty spoken text for caption cue")
    return re.sub(r"\s+", " ", t)


def scenes_to_webvtt(scenes: list[dict], durations: list[float]) -> str:
    """Build WebVTT from scene spoken lines and per-segment TTS durations."""
    if len(scenes) != len(durations):
        raise ValueError(
            f"scene/duration count mismatch: {len(scenes)} vs {len(durations)}"
        )
    if not scenes:
        raise ValueError("no scenes for captions")

    lines = ["WEBVTT", ""]
    offset = 0.0
    for i, (scene, dur) in enumerate(zip(scenes, durations)):
        if dur <= 0:
            raise ValueError(f"non-positive duration for scene {i + 1}: {dur}")
        spoken = normalize_cue_text(scene.get("spoken", ""))
        start = offset
        end = offset + dur
        lines.append(f"{format_timestamp(start)} --> {format_timestamp(end)}")
        lines.append(spoken)
        lines.append("")
        if i < len(scenes) - 1:
            offset = end + GAP_SECONDS
        else:
            offset = end

    body = "\n".join(lines)
    if not body.endswith("\n"):
        body += "\n"
    return body


def default_captions_path(work_id: str) -> str:
    return f"/tmp/{work_id}/captions.vtt"


def write_captions_vtt(
    work_id: str,
    scenes: list[dict],
    durations: list[float],
    path: str | None = None,
) -> str:
    out = path or default_captions_path(work_id)
    content = scenes_to_webvtt(scenes, durations)
    target = Path(out)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return str(target)


def validate_webvtt_file(path: str | Path) -> None:
    target = Path(path)
    if not target.is_file():
        raise FileNotFoundError(f"missing captions file: {target}")
    data = target.read_text(encoding="utf-8")
    if not data.strip():
        raise ValueError("empty captions file")
    if not data.lstrip().startswith("WEBVTT"):
        raise ValueError("invalid WEBVTT header")
    if "-->" not in data:
        raise ValueError("no caption cues found")


def parse_webvtt_cues(path: str | Path) -> list[tuple[float, float, str]]:
    """Parse cue start/end seconds and text (for deterministic tests)."""
    data = Path(path).read_text(encoding="utf-8")
    validate_webvtt_file(path)

    def _parse_ts(raw: str) -> float:
        hh, mm, rest = raw.strip().split(":")
        ss, ms = rest.split(".")
        return int(hh) * 3600 + int(mm) * 60 + int(ss) + int(ms) / 1000.0

    cues: list[tuple[float, float, str]] = []
    block: list[str] = []
    for line in data.splitlines():
        if line.strip() == "":
            if block:
                timing = next((ln for ln in block if "-->" in ln), None)
                if timing:
                    start_raw, end_raw = [p.strip() for p in timing.split("-->")]
                    text_lines = [
                        ln for ln in block
                        if ln != timing and not ln.isdigit()
                    ]
                    text = " ".join(text_lines).strip()
                    cues.append((_parse_ts(start_raw), _parse_ts(end_raw), text))
                block = []
            continue
        if line.strip() == "WEBVTT":
            continue
        block.append(line)

    if block:
        timing = next((ln for ln in block if "-->" in ln), None)
        if timing:
            start_raw, end_raw = [p.strip() for p in timing.split("-->")]
            text_lines = [ln for ln in block if ln != timing and not ln.isdigit()]
            text = " ".join(text_lines).strip()
            cues.append((_parse_ts(start_raw), _parse_ts(end_raw), text))

    if not cues:
        raise ValueError("no parsed caption cues")
    return cues
