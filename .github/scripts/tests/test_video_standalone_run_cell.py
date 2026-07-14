"""run_cell tests with mocked subprocess / Bunny HTTP / git branch repo.
Covers per-video receipt isolation and skip-success short-circuit."""
from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone import run_cell as rc  # type: ignore
from video_finalize.constants import BATCH_ID, receipt_relpath  # type: ignore
from video_finalize.receipt import load_receipt, identity_tuple  # type: ignore


def _stage(repo, lid, loc, mp4=b"\x00" * 200_000,
           vtt="WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n"):
    composite = f"{lid}__{loc}"
    (repo / "public" / "lessons" / "intro").mkdir(parents=True, exist_ok=True)
    (repo / "public" / "lessons" / "intro" / f"{composite}.mp4").write_bytes(mp4)
    (Path("/tmp") / composite).mkdir(parents=True, exist_ok=True)
    (Path("/tmp") / composite / "captions.vtt").write_text(vtt, encoding="utf-8")


@dataclass
class FakeGit:
    repo_dir: Path
    def __post_init__(self):
        self.commits = []; self.pushes = []; self.branch = None
    def ensure_orphan_branch(self, b): self.branch = b
    def commit_paths(self, paths, message):
        sha = hashlib.sha1(message.encode()).hexdigest()
        self.commits.append((sha, message, [str(p) for p in paths]))
        return sha
    def push(self, branch, remote="origin"):
        assert branch.startswith("video-results/") and branch != "main"
        self.pushes.append(branch)


def _http_fresh(expected):
    def http(m, url, body, headers):
        if m == "GET" and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if m == "POST":
            return 200, json.dumps({"guid": "G"}).encode()
        if m == "PUT":
            return 200, b"{}"
        if m == "GET":
            return 200, json.dumps({"guid": "G", "originalHash": expected}).encode()
        raise AssertionError(m)
    return http


def test_fresh_upload_writes_isolated_receipt_and_pushes_unique_branch(tmp_path):
    repo = tmp_path
    _stage(repo, "lid-a", "en")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    ck = validate_and_checksum(resolve_paths(repo, "lid-a", "en"))
    fakes = []
    def factory(root): g = FakeGit(root); fakes.append(g); return g
    out = rc.run_cell(
        lesson_id="lid-a", locale="en", package_path="unused",
        source_sha="deadbeef", workflow_run_id="42",
        artifact_id="art-1", artifact_digest="sha256:zz",
        bunny_library_id="lib", bunny_api_key="key",
        repo_root=repo, branch_repo_factory=factory,
        http_fn=_http_fresh(ck["videoChecksum"]), skip_build=True,
    )
    assert out["status"] == "finalized"
    assert out["branch"] == f"video-results/{BATCH_ID}/lid-a__en"
    r = load_receipt(repo / receipt_relpath(BATCH_ID, "lid-a__en"))
    assert identity_tuple(r) == (BATCH_ID, "lid-a__en", "deadbeef", ck["videoChecksum"])
    assert len(fakes) == 1 and fakes[0].pushes == [out["branch"]]


def test_skip_success_does_not_touch_bunny_or_git(tmp_path):
    repo = tmp_path
    _stage(repo, "lid-c", "ar-Gulf")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    from video_finalize.receipt import build_receipt, write_receipt
    ck = validate_and_checksum(resolve_paths(repo, "lid-c", "ar-Gulf"))
    r = build_receipt(
        batch_id=BATCH_ID, logical_key="lid-c__ar-Gulf",
        lesson_id="lid-c", locale="ar-Gulf",
        source_sha="src-x", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d",
        video_checksum=ck["videoChecksum"], captions_checksum=ck["captionsChecksum"],
        bunny_guid="G", bunny_upload_status="verified",
    )
    write_receipt(repo / receipt_relpath(BATCH_ID, "lid-c__ar-Gulf"), r)

    def forbid_http(*a, **k):
        raise AssertionError("bunny must not be called on skip")
    def forbid_git(root):
        raise AssertionError("git must not be called on skip")
    out = rc.run_cell(
        lesson_id="lid-c", locale="ar-Gulf", package_path="unused",
        source_sha="src-x", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d",
        bunny_library_id="l", bunny_api_key="k",
        repo_root=repo, branch_repo_factory=forbid_git,
        http_fn=forbid_http, skip_build=True,
    )
    assert out["status"] == "skipped-success"


def test_failed_cell_does_not_affect_other_receipts(tmp_path):
    """Two cells share a repo root. A failing cell must never touch the other's receipt."""
    repo = tmp_path
    # Cell 1 already finalized (existing receipt).
    _stage(repo, "keep", "en")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    from video_finalize.receipt import build_receipt, write_receipt
    ck1 = validate_and_checksum(resolve_paths(repo, "keep", "en"))
    r1 = build_receipt(
        batch_id=BATCH_ID, logical_key="keep__en",
        lesson_id="keep", locale="en",
        source_sha="s", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d",
        video_checksum=ck1["videoChecksum"], captions_checksum=ck1["captionsChecksum"],
        bunny_guid="G1", bunny_upload_status="verified",
    )
    receipt1_path = repo / receipt_relpath(BATCH_ID, "keep__en")
    write_receipt(receipt1_path, r1)
    prev_bytes = receipt1_path.read_bytes()

    # Cell 2: force Bunny to fail closed.
    _stage(repo, "fail", "en")
    def http_bad(m, url, body, headers):
        if m == "GET" and "search=" in url:
            return 200, json.dumps({"items": [
                {"guid": "X1", "title": "fail [en]", "originalHash": "z" * 64},
                {"guid": "X2", "title": "fail [en]", "originalHash": "z" * 64},
            ]}).encode()
        raise AssertionError("unexpected")
    try:
        rc.run_cell(
            lesson_id="fail", locale="en", package_path="unused",
            source_sha="s2", workflow_run_id="w", artifact_id="a",
            artifact_digest="sha256:d",
            bunny_library_id="l", bunny_api_key="k",
            repo_root=repo,
            branch_repo_factory=lambda r: FakeGit(r),
            http_fn=http_bad, skip_build=True,
        )
    except Exception:
        pass
    # The successful cell's receipt is byte-identical (never touched).
    assert receipt1_path.read_bytes() == prev_bytes
    # And the failed cell wrote NO receipt.
    assert not (repo / receipt_relpath(BATCH_ID, "fail__en")).is_file()


def test_build_command_shape_when_narration_gate_skipped(tmp_path):
    repo = tmp_path
    (repo / "remotion" / "scripts").mkdir(parents=True)
    (repo / "remotion" / "scripts" / "build-lesson.py").write_text("#\n")
    pkg = "src/lib/locale-lessons/en/lessons/xyz.json"
    (repo / pkg).parent.mkdir(parents=True, exist_ok=True)
    (repo / pkg).write_text("{}")
    seen: dict = {}
    def sr(cmd, cwd, check):
        seen["cmd"] = cmd
        _stage(repo, "xyz", "en")
        class R: returncode = 0
        return R()
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    def http(m, url, body, headers):
        if m == "GET" and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if m == "POST":
            return 200, json.dumps({"guid": "G"}).encode()
        if m == "PUT":
            return 200, b"{}"
        if m == "GET":
            ck = validate_and_checksum(resolve_paths(repo, "xyz", "en"))
            return 200, json.dumps({"guid": "G", "originalHash": ck["videoChecksum"]}).encode()
        raise AssertionError(m)
    out = rc.run_cell(
        lesson_id="xyz", locale="en", package_path=pkg,
        source_sha="s", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d", bunny_library_id="l", bunny_api_key="k",
        repo_root=repo, subprocess_run=sr,
        branch_repo_factory=lambda r: FakeGit(r), http_fn=http,
        skip_narration_gate=True,
    )
    assert out["status"] == "finalized"
    cmd = seen["cmd"]
    assert cmd[0] == "python3"
    assert cmd[1].endswith("remotion/scripts/build-lesson.py")
    assert cmd[2] == "xyz"
    assert cmd[3:5] == ["--locale", "en"]
    assert cmd[5] == "--package-path" and cmd[6].endswith(pkg)


if __name__ == "__main__":
    import tempfile
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            with tempfile.TemporaryDirectory() as td:
                fn(Path(td))
            print("ok", name)
