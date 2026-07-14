"""run_cell tests with mocked subprocess / Bunny HTTP / git branch repo.
Exercises the real receipt schema + real recovery logic."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone import run_cell as rc  # type: ignore
from video_finalize.constants import BATCH_ID, receipt_relpath  # type: ignore
from video_finalize.receipt import load_receipt, identity_tuple  # type: ignore


def _stage_artifacts(repo_root: Path, lesson_id: str, locale: str,
                     mp4_bytes: bytes, vtt_text: str) -> str:
    composite = f"{lesson_id}__{locale}"
    mp4 = repo_root / "public" / "lessons" / "intro" / f"{composite}.mp4"
    mp4.parent.mkdir(parents=True, exist_ok=True)
    mp4.write_bytes(mp4_bytes)
    vtt_dir = Path("/tmp") / composite
    vtt_dir.mkdir(parents=True, exist_ok=True)
    (vtt_dir / "captions.vtt").write_text(vtt_text, encoding="utf-8")
    return composite


@dataclass
class FakeGit:
    repo_dir: Path
    commits: list = None
    pushes: list = None
    def __post_init__(self):
        self.commits = []; self.pushes = []
    def ensure_orphan_branch(self, branch): self._branch = branch
    def commit_paths(self, paths, message):
        sha = hashlib.sha1(message.encode()).hexdigest()
        self.commits.append((sha, message, [str(p) for p in paths]))
        return sha
    def push(self, branch, remote="origin"):
        assert branch.startswith("video-results/")
        assert branch != "main"
        self.pushes.append(branch)


def _fake_http(events):
    def http(method, url, body, headers):
        events.append((method, url))
        if method == "GET" and "?" in url and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if method == "POST":
            return 200, json.dumps({"guid": "GUID-NEW"}).encode()
        if method == "PUT":
            return 200, b"{}"
        if method == "GET":
            return 200, json.dumps(
                {"guid": "GUID-NEW", "originalHash": http.expected_hash}
            ).encode()
        raise AssertionError(method)
    http.expected_hash = ""
    return http


def test_fresh_upload_creates_receipt_and_commits(tmp_path):
    repo = tmp_path
    _stage_artifacts(repo, "lid-a", "en", b"\x00" * 200_000, "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhi\n")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    ck = validate_and_checksum(resolve_paths(repo, "lid-a", "en"))
    events = []
    http = _fake_http(events); http.expected_hash = ck["videoChecksum"]
    fakes = []
    def factory(root): g = FakeGit(root); fakes.append(g); return g

    out = rc.run_cell(
        lesson_id="lid-a", locale="en", package_path="unused",
        source_sha="deadbeef", workflow_run_id="42",
        artifact_id="art-1", artifact_digest="sha256:zz",
        bunny_library_id="lib", bunny_api_key="key",
        repo_root=repo, subprocess_run=None,
        branch_repo_factory=factory, http_fn=http, skip_build=True,
    )
    assert out["status"] == "finalized"
    assert out["branch"] == f"video-results/{BATCH_ID}/lid-a__en"
    assert out["bunny"]["status"] == "uploaded"
    receipt_path = repo / receipt_relpath(BATCH_ID, "lid-a__en")
    r = load_receipt(receipt_path)
    assert identity_tuple(r) == (BATCH_ID, "lid-a__en", "deadbeef", ck["videoChecksum"])
    assert len(fakes) == 1 and fakes[0].pushes == [out["branch"]]
    # ordering: LIST, POST(create), PUT(upload), GET(verify)
    methods = [m for m, _ in events]
    assert methods[0] == "GET" and "search=" in events[0][1]
    assert "POST" in methods and "PUT" in methods and methods[-1] == "GET"


def test_reuse_by_originalhash_no_upload(tmp_path):
    repo = tmp_path
    _stage_artifacts(repo, "lid-b", "ar-MSA", b"\x00" * 200_000, "WEBVTT\n\nhi\n")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    ck = validate_and_checksum(resolve_paths(repo, "lid-b", "ar-MSA"))
    title = f"lid-b [ar-MSA]"

    events = []
    def http(method, url, body, headers):
        events.append((method, url))
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": [
                {"guid": "GUID-EXIST", "title": title, "originalHash": ck["videoChecksum"]}
            ]}).encode()
        if method == "GET":
            return 200, json.dumps(
                {"guid": "GUID-EXIST", "originalHash": ck["videoChecksum"]}
            ).encode()
        raise AssertionError("unexpected " + method)

    fakes = []
    def factory(root): g = FakeGit(root); fakes.append(g); return g
    out = rc.run_cell(
        lesson_id="lid-b", locale="ar-MSA", package_path="unused",
        source_sha="src1", workflow_run_id="1", artifact_id="a",
        artifact_digest="sha256:d", bunny_library_id="l", bunny_api_key="k",
        repo_root=repo, branch_repo_factory=factory,
        http_fn=http, skip_build=True,
    )
    assert out["status"] == "finalized"
    assert out["bunny"]["status"] == "verified"
    assert out["bunny"]["guid"] == "GUID-EXIST"
    assert not any(m == "POST" or m == "PUT" for m, _ in events)


def test_idempotent_skip_when_receipt_matches(tmp_path):
    repo = tmp_path
    _stage_artifacts(repo, "lid-c", "ar-Gulf", b"\x00" * 200_000, "WEBVTT\n\nhi\n")
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

    def http_forbid(*a, **k):  # any bunny call would be a bug
        raise AssertionError("bunny must not be called on skip-success")
    def factory_forbid(root):  # any git op would be a bug
        raise AssertionError("git must not be called on skip-success")

    out = rc.run_cell(
        lesson_id="lid-c", locale="ar-Gulf", package_path="unused",
        source_sha="src-x", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d",
        bunny_library_id="l", bunny_api_key="k",
        repo_root=repo, branch_repo_factory=factory_forbid,
        http_fn=http_forbid, skip_build=True,
    )
    assert out["status"] == "skipped-success"


def test_ambiguous_bunny_fails_closed(tmp_path):
    repo = tmp_path
    _stage_artifacts(repo, "lid-d", "en", b"\x00" * 200_000, "WEBVTT\n\nhi\n")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    ck = validate_and_checksum(resolve_paths(repo, "lid-d", "en"))
    title = "lid-d [en]"

    def http(method, url, body, headers):
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": [
                {"guid": "G1", "title": title, "originalHash": ck["videoChecksum"]},
                {"guid": "G2", "title": title, "originalHash": ck["videoChecksum"]},
            ]}).encode()
        raise AssertionError(method)

    try:
        rc.run_cell(
            lesson_id="lid-d", locale="en", package_path="unused",
            source_sha="s", workflow_run_id="w", artifact_id="a",
            artifact_digest="sha256:d",
            bunny_library_id="l", bunny_api_key="k",
            repo_root=repo,
            branch_repo_factory=lambda r: (_ for _ in ()).throw(AssertionError("git must not run")),
            http_fn=http, skip_build=True,
        )
    except RuntimeError as e:
        assert "ambiguous" in str(e) or "multiple-bunny-identities" in str(e)
        return
    raise AssertionError("expected ambiguity failure")


def test_build_command_is_the_authorized_shape(tmp_path, monkeypatch):
    repo = tmp_path
    # Stage build.py so path check passes, and a package file.
    (repo / "remotion" / "scripts").mkdir(parents=True)
    (repo / "remotion" / "scripts" / "build-lesson.py").write_text("#!py\n", encoding="utf-8")
    pkg_rel = "src/lib/locale-lessons/en/lessons/xyz.json"
    (repo / pkg_rel).parent.mkdir(parents=True, exist_ok=True)
    (repo / pkg_rel).write_text("{}", encoding="utf-8")

    seen: dict = {}
    def fake_run(cmd, cwd, check):
        seen["cmd"] = cmd; seen["cwd"] = cwd
        # simulate a successful build by staging outputs
        _stage_artifacts(repo, "xyz", "en", b"\x00" * 200_000, "WEBVTT\n\nhi\n")
        class R: returncode = 0
        return R()

    # After build, use fake bunny + git.
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    def http(method, url, body, headers):
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if method == "POST":
            return 200, json.dumps({"guid": "G"}).encode()
        if method == "PUT":
            return 200, b"{}"
        if method == "GET":
            # first compute checksum on the fly
            ck = validate_and_checksum(resolve_paths(repo, "xyz", "en"))
            return 200, json.dumps({"guid": "G", "originalHash": ck["videoChecksum"]}).encode()
        raise AssertionError(method)

    out = rc.run_cell(
        lesson_id="xyz", locale="en", package_path=pkg_rel,
        source_sha="s", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d", bunny_library_id="l", bunny_api_key="k",
        repo_root=repo, subprocess_run=fake_run,
        branch_repo_factory=lambda r: FakeGit(r),
        http_fn=http,
    )
    assert out["status"] == "finalized"
    # Authorized command shape (order and flags):
    cmd = seen["cmd"]
    assert cmd[0] == "python3"
    assert cmd[1].endswith("remotion/scripts/build-lesson.py")
    assert cmd[2] == "xyz"
    assert cmd[3:5] == ["--locale", "en"]
    assert cmd[5] == "--package-path"
    assert cmd[6].endswith(pkg_rel)


if __name__ == "__main__":
    import tempfile
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            with tempfile.TemporaryDirectory() as td:
                try:
                    fn(Path(td))  # type: ignore[misc]
                except TypeError:
                    fn()  # no fixture
            print("ok", name)
