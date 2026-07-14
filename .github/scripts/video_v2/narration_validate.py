"""Pre-TTS narration validation for video-production-final-v2.

Owner-authorized flow:
- The existing Gemini script_writer authors scenes[].spoken from the approved
  localized package (dependency-injected as `script_fn`).
- Max 2 attempts. Each attempt runs through the locale gate + groundedness
  check (also dependency-injected as `grounding_fn` — normally the repo's
  existing package-integrity validator).
- If both attempts fail, this returns a hard failure; the workflow MUST fail
  the cell BEFORE any TTS, render, Bunny upload, or mapping.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Any

from .constants import MAX_GEMINI_SCRIPT_ATTEMPTS
from .locale_gate import validate_scenes, GateResult


@dataclass
class NarrationResult:
    ok: bool
    attempts: int
    scenes: list[dict] | None
    gate: GateResult | None
    grounding_errors: list[str] = field(default_factory=list)
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "attempts": self.attempts,
            "gate": self.gate.to_dict() if self.gate else None,
            "groundingErrors": list(self.grounding_errors),
            "error": self.error,
        }


ScriptFn = Callable[[dict, str, int], list[dict]]         # (package, locale, attempt) -> scenes
GroundingFn = Callable[[list[dict], dict], list[str]]     # (scenes, package) -> errors


def validate_narration(
    *,
    package: dict,
    locale: str,
    script_fn: ScriptFn,
    grounding_fn: GroundingFn,
    max_attempts: int = MAX_GEMINI_SCRIPT_ATTEMPTS,
) -> NarrationResult:
    last: NarrationResult | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            scenes = script_fn(package, locale, attempt)
        except Exception as e:  # noqa: BLE001
            last = NarrationResult(False, attempt, None, None, error=f"script_fn: {e!r}")
            continue
        gate = validate_scenes(locale, scenes)
        if not gate.ok:
            last = NarrationResult(False, attempt, scenes, gate)
            continue
        errors = list(grounding_fn(scenes, package) or [])
        if errors:
            last = NarrationResult(False, attempt, scenes, gate, errors)
            continue
        return NarrationResult(True, attempt, scenes, gate)
    assert last is not None
    return last
