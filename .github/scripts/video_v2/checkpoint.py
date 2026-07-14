"""Filesystem checkpoint store used by cli_run_cell for resume-on-retry."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

STAGES = ("narration", "artifact", "bunny", "receipt")


class CheckpointStore:
    def __init__(self, workdir: Path) -> None:
        self.dir = workdir / "checkpoints"
        self.dir.mkdir(parents=True, exist_ok=True)

    def _path(self, stage: str) -> Path:
        if stage not in STAGES:
            raise ValueError(f"unknown stage: {stage!r}")
        return self.dir / f"{stage}.json"

    def has(self, stage: str) -> bool:
        return self._path(stage).is_file()

    def load(self, stage: str) -> dict[str, Any] | None:
        p = self._path(stage)
        if not p.is_file():
            return None
        return json.loads(p.read_text(encoding="utf-8"))

    def save(self, stage: str, payload: dict[str, Any]) -> None:
        self._path(stage).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
