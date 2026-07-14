"""End-to-end integration tests for video_v2 CLIs and cell orchestrator.

Uses REAL local production modules (locale gate, narration_validate, matrix
planner, bunny identity, receipt, collector, checkpoint, cli_run_cell,
cli_build_plan, cli_collect) with the external boundaries (Gemini, TTS,
Remotion render, Bunny, GitHub) replaced by in-process mocks.

Proves the full behavioural contract from the corrections list.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest

_SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_SCRIPTS))

from video_v2 import cli_build_plan, cli_collect  # noqa: E402
from video_v2.cli_run_cell import CellError, run_cell  # noqa: E402
from video_v2.constants import BATCH_ID, receipt_relpath  # noqa: E402
from video_v2.receipt import build as build_receipt, write as write_receipt  # noqa: E402
from video_v2.services import Services  # noqa: E402


# ---------- Mock service factory ---------------------------------------------

@dataclass
class Counters:
    gemini: int = 0
    render: int = 0
    validate: int = 0
    bunny_find: int = 0
    bunny_upload: int = 0
    bunny_verify: int = 0
    receipt_commit: int = 0


def _make_bundle(root: Path, tag: str) -> dict[str, Any]:
    root.mkdir(parents=True, exist_ok=True)
    (root / "video.mp4").write_bytes(b"MP4-" + tag.encode())
    (root / "audio.mp3").write_bytes(b"MP3-" + tag.encode())
    (root / "captions.vtt").write_text(f"WEBVTT\n\n00:00.000 --> 00:01.000\nhello {tag}\n",
                                       encoding="utf-8")
    (root / "status.json").write_text("{}", encoding="utf-8")
    (root / "validation.json").write_text("{}", encoding="utf-8")
    (root / "pipeline.log").write_text("ok\n", encoding="utf-8")
    vc = hashlib.sha256((root / "video.mp4").read_bytes()).hexdigest()
    cc = hashlib.sha256((root / "captions.vtt").read_bytes()).hexdigest()
    return {"root": root, "video_checksum": vc, "captions_checksum": cc,
            "artifact_id": f"artifact-{tag}", "artifact_digest": "sha256:" + "d" * 64}


def make_services(
    *,
    spoken: str = "This lesson explains AI summarization.",
    grounding_errors: list[str] | None = None,
    existing_receipt: dict | None = None,
    bunny_registry: dict | None = None,
    counters: Counters | None = None,
    commit_log: list[dict] | None = None,
    fail_gemini_attempts: int = 0,
    source_sha: str = "d0b8a1e",
    run_id: str = "9999",
) -> tuple[Services, Counters, dict, list[dict]]:
    counters = counters or Counters()
    bunny_registry = bunny_registry if bunny_registry is not None else {}
    commit_log = commit_log if commit_log is not None else []
    ge = list(grounding_errors or [])
    exist = existing_receipt

    def _load_package(lesson_id: str, locale: str) -> dict:
        return {"lessonId": lesson_id, "locale": locale, "sections": [
            {"contentMarkdown": "AI summarization overview."}
        ]}

    def _gemini(pkg, locale, attempt):
        counters.gemini += 1
        if attempt <= fail_gemini_attempts:
            return [{"spoken": "ezzay you doing yalla"}]  # will fail en gate
        return [{"spoken": spoken}]

    def _grounding(scenes, pkg):
        return list(ge)

    def _render(scenes, locale, workdir):
        counters.render += 1
        return _make_bundle(Path(workdir) / "production", tag=str(counters.render))

    def _validate(root):
        counters.validate += 1
        # Cheap contract check — mocked; not the real six-file validator.
        for name in ("video.mp4", "audio.mp3", "captions.vtt",
                     "status.json", "validation.json", "pipeline.log"):
            if not (root / name).is_file():
                raise ValueError(f"missing {name}")

    def _bunny_find(identity_hash):
        counters.bunny_find += 1
        return bunny_registry.get(identity_hash)

    def _bunny_upload(root, identity_meta):
        counters.bunny_upload += 1
        guid = f"guid-{identity_meta['v2Identity'][:12]}"
        bunny_registry[identity_meta["v2Identity"]] = {
            "guid": guid, "metaTags": dict(identity_meta),
            "video_checksum": identity_meta["videoChecksum"],
        }
        return {"guid": guid}

    def _bunny_verify(guid, expected):
        counters.bunny_verify += 1
        for _, v in bunny_registry.items():
            if v["guid"] == guid:
                if v["video_checksum"] != expected:
                    raise AssertionError("bunny checksum mismatch")
                return
        raise AssertionError(f"unknown guid: {guid}")

    def _fetch_existing(logical_key):
        return exist

    def _commit(receipt):
        counters.receipt_commit += 1
        commit_log.append(receipt)
        return "commit-" + hashlib.sha256(json.dumps(receipt, sort_keys=True).encode()).hexdigest()[:12]

    svc = Services(
        source_sha=lambda: source_sha,
        workflow_run_id=lambda: run_id,
        load_package=_load_package,
        gemini_script=_gemini,
        grounding=_grounding,
        render_bundle=_render,
        validate_six_file=_validate,
        bunny_find_by_identity=_bunny_find,
        bunny_upload=_bunny_upload,
        bunny_verify_checksum=_bunny_verify,
        fetch_existing_receipt=_fetch_existing,
        commit_receipt=_commit,
    )
    return svc, counters, bunny_registry, commit_log


# ---------- Cell-level scenarios --------------------------------------------

CELL_EN = {"logical_key": "x-l1__en", "lesson_id": "x-l1", "locale": "en"}


def test_successful_cell_uploads_and_commits_exactly_once(tmp_path):
    svc, c, reg, log = make_services()
    r = run_cell(CELL_EN, svc, tmp_path / "work")
    assert r["bunnyUploadStatus"] == "verified"
    assert c.gemini == 1
    assert c.render == 1
    assert c.validate == 1
    assert c.bunny_upload == 1
    assert c.bunny_verify == 1
    assert c.receipt_commit == 1
    assert len(log) == 1


def test_wrong_locale_narration_fails_before_tts(tmp_path):
    # Gemini always emits Arabic script into an English cell → gate fails,
    # 2 attempts, then hard fail. Render must never be called.
    svc, c, *_ = make_services(spoken="مرحبا this is not english")
    with pytest.raises(CellError):
        run_cell(CELL_EN, svc, tmp_path / "work")
    assert c.gemini == 2
    assert c.render == 0
    assert c.bunny_upload == 0
    assert c.receipt_commit == 0


def test_two_failed_narration_attempts_fail_only_that_cell(tmp_path):
    svc, c, *_ = make_services(fail_gemini_attempts=2)
    with pytest.raises(CellError):
        run_cell(CELL_EN, svc, tmp_path / "work")
    assert c.gemini == 2 and c.render == 0 and c.bunny_upload == 0


def test_receipt_recovery_skips_all_paid_work(tmp_path):
    existing = build_receipt(
        logical_key="x-l1__en", lesson_id="x-l1", locale="en", source_sha="d0b8a1e",
        workflow_run_id="9999", artifact_id="prior", artifact_digest="sha256:" + "e" * 64,
        video_checksum="a" * 64, captions_checksum="c" * 64,
        bunny_guid="guid-prior", bunny_identity_hash="h" * 64,
        bunny_upload_status="verified",
    )
    svc, c, *_ = make_services(existing_receipt=existing)
    r = run_cell(CELL_EN, svc, tmp_path / "work")
    assert r == existing
    assert c.gemini == 0 and c.render == 0 and c.bunny_upload == 0 and c.receipt_commit == 0


def test_artifact_recovery_skips_generation(tmp_path):
    workdir = tmp_path / "work"
    # First run to populate checkpoints.
    svc1, c1, reg, log = make_services()
    r1 = run_cell(CELL_EN, svc1, workdir)
    assert c1.render == 1 and c1.gemini == 1

    # Second run with FRESH services (no upstream memory), artifact checkpoint
    # on disk. Force fetch_existing to return None so the receipt lookup does
    # not short-circuit the test. The Bunny registry retains the prior upload,
    # so bunny_find_by_identity matches and no re-upload happens.
    svc2, c2, _, _ = make_services(bunny_registry=reg)
    r2 = run_cell(CELL_EN, svc2, workdir)
    assert c2.gemini == 0, "narration must not be re-authored"
    assert c2.render == 0, "artifact must not be re-rendered"
    assert c2.bunny_upload == 0, "bunny must not be re-uploaded"
    assert r2["bunnyGuid"] == r1["bunnyGuid"]


def test_bunny_recovery_skips_duplicate_upload(tmp_path):
    # Pre-seed Bunny with a matching identity → cell must reuse guid.
    svc0, _, reg, _ = make_services()
    r0 = run_cell(CELL_EN, svc0, tmp_path / "w0")

    svc, c, _, _ = make_services(bunny_registry=reg)
    r = run_cell(CELL_EN, svc, tmp_path / "w1")
    assert c.bunny_upload == 0
    assert r["bunnyUploadStatus"] == "reused"
    assert r["bunnyGuid"] == r0["bunnyGuid"]


def test_commit_recovery_does_not_regenerate(tmp_path):
    workdir = tmp_path / "work"
    svc1, c1, reg, log = make_services()
    run_cell(CELL_EN, svc1, workdir)
    # Simulate a rerun where the receipt checkpoint exists but the durable
    # remote commit is now discoverable via fetch_existing_receipt.
    prior = log[-1]
    svc2, c2, _, _ = make_services(existing_receipt=prior, bunny_registry=reg)
    r = run_cell(CELL_EN, svc2, workdir)
    assert r == prior
    assert c2.gemini == 0 and c2.render == 0 and c2.bunny_upload == 0
    assert c2.receipt_commit == 0


def test_one_failed_cell_does_not_affect_successful_receipts(tmp_path):
    # Successful cell writes a receipt to disk (simulating result-branch checkout).
    receipts_root = tmp_path / "results"
    svc, _, _, log = make_services()
    r = run_cell(CELL_EN, svc, tmp_path / "wsuccess")
    write_receipt(receipts_root, r)

    # A different cell fails on narration.
    other = {"logical_key": "y-l1__en", "lesson_id": "y-l1", "locale": "en"}
    svc_bad, _, _, _ = make_services(spoken="مرحبا wrong locale")
    with pytest.raises(CellError):
        run_cell(other, svc_bad, tmp_path / "wfail")

    # Collector still preserves the good receipt.
    from video_v2.collector import collect
    report = collect(
        expected_keys=["x-l1__en", "y-l1__en"],
        receipt_roots=[receipts_root],
        failed_keys=["y-l1__en"],
    )
    d = report.to_dict()
    assert d["successfulLogicalKeys"] == ["x-l1__en"]
    assert d["failedLogicalKeys"] == ["y-l1__en"]
    assert "x-l1__en" in d["mappingCandidate"]


def test_299_success_plus_1_failure_preserves_299(tmp_path):
    # Simulate the scale: write 299 valid receipts, mark 1 failed.
    receipts_root = tmp_path / "results"
    expected = []
    for i in range(299):
        key = f"less-{i:03d}__en"
        expected.append(key)
        r = build_receipt(
            logical_key=key, lesson_id=f"less-{i:03d}", locale="en",
            source_sha="d0b8a1e", workflow_run_id="1",
            artifact_id=f"a{i}", artifact_digest="sha256:" + "d" * 64,
            video_checksum=("%064x" % i), captions_checksum="c" * 64,
            bunny_guid=f"g{i}", bunny_identity_hash="h" * 64,
        )
        write_receipt(receipts_root, r)
    expected.append("boom__en")
    from video_v2.collector import collect
    report = collect(
        expected_keys=expected,
        receipt_roots=[receipts_root],
        failed_keys=["boom__en"],
    )
    d = report.to_dict()
    assert len(d["successfulLogicalKeys"]) == 299
    assert d["failedLogicalKeys"] == ["boom__en"]
    assert len(d["mappingCandidate"]) == 299


# ---------- CLI subprocess tests --------------------------------------------

PY = sys.executable


def _lessons_json(tmp_path: Path) -> Path:
    payload = {
        "en":     [f"en-l{i:03d}" for i in range(100)],
        "ar-MSA": [f"msa-l{i:03d}" for i in range(100)],
        "ar-Gulf":[f"gulf-l{i:03d}" for i in range(100)],
    }
    p = tmp_path / "lessons.json"
    p.write_text(json.dumps(payload), encoding="utf-8")
    return p


def test_cli_build_plan_emits_valid_300_matrix(tmp_path):
    lessons = _lessons_json(tmp_path)
    out = tmp_path / "plan.json"
    proc = subprocess.run(
        [PY, str(_SCRIPTS / "video_v2" / "cli_build_plan.py"),
         "--source-sha", "abc", "--out", str(out), "--lessons-json", str(lessons)],
        capture_output=True, text=True,
    )
    assert proc.returncode == 0, proc.stderr
    plan = json.loads(out.read_text())
    assert len(plan["matrix_a"]) == 149
    assert len(plan["matrix_b"]) == 150
    keys = ([plan["canary"]["logical_key"]]
            + [c["logical_key"] for c in plan["matrix_a"]]
            + [c["logical_key"] for c in plan["matrix_b"]])
    assert len(set(keys)) == 300
    assert plan["totals"]["ar-EG"] == 0
    # Compact GitHub matrix projection: matrix arrays must be JSON-serializable
    # objects with a "cell" field per row (the workflow wraps them).
    for c in plan["matrix_a"] + plan["matrix_b"]:
        assert set(c.keys()) == {"logical_key", "lesson_id", "locale"}


def test_cli_collect_partial_success_exits_nonzero(tmp_path):
    # Build plan + write only 2 of 300 receipts + mark 1 failed.
    lessons = _lessons_json(tmp_path)
    plan_path = tmp_path / "plan.json"
    subprocess.run(
        [PY, str(_SCRIPTS / "video_v2" / "cli_build_plan.py"),
         "--source-sha", "abc", "--out", str(plan_path), "--lessons-json", str(lessons)],
        check=True, capture_output=True,
    )
    plan = json.loads(plan_path.read_text())
    receipts_root = tmp_path / "results"
    # Use the canary + first matrix_a as our two success cases.
    success = [plan["canary"], plan["matrix_a"][0]]
    for cell in success:
        r = build_receipt(
            logical_key=cell["logical_key"], lesson_id=cell["lesson_id"],
            locale=cell["locale"], source_sha="abc", workflow_run_id="1",
            artifact_id="a", artifact_digest="sha256:" + "d" * 64,
            video_checksum="a" * 64, captions_checksum="c" * 64,
            bunny_guid="g-" + cell["logical_key"], bunny_identity_hash="h" * 64,
        )
        write_receipt(receipts_root, r)

    failed_file = tmp_path / "failed.txt"
    failed_file.write_text(plan["matrix_b"][0]["logical_key"] + "\n", encoding="utf-8")
    out = tmp_path / "report.json"

    proc = subprocess.run(
        [PY, str(_SCRIPTS / "video_v2" / "cli_collect.py"),
         "--plan", str(plan_path), "--receipt-root", str(receipts_root),
         "--failed-keys", str(failed_file), "--out", str(out)],
        capture_output=True, text=True,
    )
    # Unresolved cells exist → non-zero exit, but the good receipts are preserved.
    assert proc.returncode == 1, proc.stdout + proc.stderr
    report = json.loads(out.read_text())
    assert len(report["successfulLogicalKeys"]) == 2
    assert plan["matrix_b"][0]["logical_key"] in report["failedLogicalKeys"]
    assert len(report["mappingCandidate"]) == 2
    # Native re-run: the exact failed cell is retrievable from the report.
    assert report["failedLogicalKeys"] == [plan["matrix_b"][0]["logical_key"]]


def test_cli_run_cell_script_importable(tmp_path):
    # Sanity: the CLI file compiles and its help works without services.
    proc = subprocess.run(
        [PY, str(_SCRIPTS / "video_v2" / "cli_run_cell.py"), "--help"],
        capture_output=True, text=True,
    )
    assert proc.returncode == 0, proc.stderr
    assert "--cell" in proc.stdout


# ---------- Workflow-level contract checks (static) --------------------------

WORKFLOW = Path(__file__).resolve().parents[2] / "workflows" / "video-production-final-v2.yml"


def _workflow_text() -> str:
    return WORKFLOW.read_text(encoding="utf-8")


def test_workflow_main_only_dispatch_guard():
    txt = _workflow_text()
    assert 'github.ref' in txt
    assert '!= "refs/heads/main"' in txt
    assert "PROCEED" in txt


def test_workflow_canary_gates_matrices():
    txt = _workflow_text()
    # Both matrices must depend on canary AND require its success.
    assert "needs: [plan, canary]" in txt
    assert "needs.canary.result == 'success'" in txt


def test_workflow_collector_runs_always():
    txt = _workflow_text()
    assert "if: always()" in txt


def test_workflow_max_parallel_combined_is_four():
    txt = _workflow_text()
    # 2 per matrix × 2 matrices = 4.
    assert txt.count("max-parallel: 2") >= 2


def test_workflow_fail_fast_false():
    txt = _workflow_text()
    assert "fail-fast: false" in txt
