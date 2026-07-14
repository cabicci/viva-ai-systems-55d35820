"""Narration orchestration: at most two Gemini attempts BEFORE any TTS,
render, Bunny, or git write.

Flow per cell:
  attempt 1:
    run `python3 remotion/scripts/build-lesson.py <lid> --locale <loc>
         --package-path <pkg> --preview-only`
    (Gemini script call; NO TTS, NO render, NO Bunny, NO git.)
    Load /tmp/<composite>/script.json, extract scenes, apply locale_gate.
    On pass: return the accepted scenes.
  attempt 2 (only if attempt 1's gate failed):
    delete /tmp/<composite>/script.json, rerun same command with
    --force-script (2nd Gemini call). Re-apply the gate.
  If attempt 2 also fails: raise NarrationGateFailure. The caller must
  NOT proceed to TTS, render, Bunny, or git.

Guarantees:
  - The exact same scenes[].spoken accepted here are what the subsequent
    full build reads from the on-disk cache — TTS and captions therefore
    consume the exact accepted text.
"""
from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

from video_standalone.locale_gate import LocaleGateError, gate_scenes


MAX_GEMINI_ATTEMPTS = 2


class NarrationGateFailure(RuntimeError):
    def __init__(self, attempts: list[dict]):
        super().__init__(f"locale gate failed after {len(attempts)} Gemini attempts")
        self.attempts = attempts


@dataclass
class NarrationResult:
    scenes: list[dict]
    script_cache: Path
    attempts_used: int
    composite: str


def _cache_path(tmp_root: Path, composite: str) -> Path:
    return tmp_root / composite / "script.json"


def _load_scenes(cache: Path) -> list[dict]:
    data = json.loads(cache.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise RuntimeError("script.json is not a scene list")
    return data


def run_narration_gate(
    *,
    lesson_id: str,
    locale: str,
    package_path: str,
    repo_root: Path,
    tmp_root: Path | None = None,
    subprocess_run=subprocess.run,
) -> NarrationResult:
    tmp = tmp_root or Path("/tmp")
    composite = f"{lesson_id}__{locale}"
    cache = _cache_path(tmp, composite)
    script = repo_root / "remotion" / "scripts" / "build-lesson.py"
    if not script.is_file():
        raise RuntimeError(f"missing build script: {script}")

    attempts: list[dict] = []
    for attempt in range(1, MAX_GEMINI_ATTEMPTS + 1):
        cmd = [
            "python3", str(script), lesson_id,
            "--locale", locale,
            "--package-path", str(repo_root / package_path),
            "--preview-only",
        ]
        if attempt > 1 and cache.exists():
            cache.unlink()
        if attempt > 1:
            cmd.append("--force-script")
        print(f"[narration] attempt {attempt}/{MAX_GEMINI_ATTEMPTS} $ {' '.join(cmd)}",
              flush=True)
        proc = subprocess_run(cmd, cwd=repo_root, check=False)
        if proc.returncode != 0:
            attempts.append({"attempt": attempt, "stage": "gemini-script",
                             "reason": f"build-lesson --preview-only rc={proc.returncode}"})
            continue
        if not cache.is_file():
            attempts.append({"attempt": attempt, "stage": "script-cache",
                             "reason": f"missing {cache}"})
            continue
        try:
            scenes = _load_scenes(cache)
            gate_scenes(locale, scenes)
        except LocaleGateError as e:
            attempts.append({"attempt": attempt, "stage": "locale-gate",
                             "evidence": e.evidence})
            continue
        except Exception as e:  # noqa: BLE001
            attempts.append({"attempt": attempt, "stage": "script-parse",
                             "reason": str(e)})
            continue
        return NarrationResult(scenes=scenes, script_cache=cache,
                               attempts_used=attempt, composite=composite)

    raise NarrationGateFailure(attempts)
