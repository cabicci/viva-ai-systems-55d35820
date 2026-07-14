"""Durable artifact recovery integration tests (mocked external boundaries)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone import run_cell as rc  # type: ignore
from video_standalone.artifact_bundle import (  # type: ignore
    REQUIRED_FILES, deterministic_name, validate_bundle,
    build_bundle_from_pipeline, ArtifactBundleError,
)


def _stage_pipeline_outputs(repo: Path, lid: str, loc: str,
                            mp4: bytes, mp3: bytes, vtt: str):
    composite = f"{lid}__{loc}"
    (repo / "public" / "lessons" / "intro").mkdir(parents=True, exist_ok=True)
    (repo / "public" / "lessons" / "intro" / f"{composite}.mp4").write_bytes(mp4)
    (Path("/tmp") / composite / "audio").mkdir(parents=True, exist_ok=True)
    (Path("/tmp") / composite / "audio" / "master.mp3").write_bytes(mp3)
    (Path("/tmp") / composite / "captions.vtt").write_text(vtt, encoding="utf-8")


class _FakeGit:
    def __init__(self, repo_dir):
        self.repo_dir = repo_dir; self.commits = []; self.pushes = []
    def ensure_orphan_branch(self, b): assert b.startswith("video-results/")
    def commit_paths(self, paths, message):
        sha = "x" * 40; self.commits.append((sha, message)); return sha
    def push(self, b, remote="origin"):
        assert b != "main"; self.pushes.append(b)


def _fake_http_new_upload(expected_hash):
    def http(method, url, body, headers):
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if method == "POST":
            return 200, json.dumps({"guid": "G-NEW"}).encode()
        if method == "PUT":
            return 200, b"{}"
        if method == "GET":
            return 200, json.dumps({"guid": "G-NEW", "originalHash": expected_hash}).encode()
        raise AssertionError(method)
    return http


def test_deterministic_name_shape():
    n = deterministic_name(
        source_sha="d0b8a1ea6073f7b7c244051083609611dcb90c7f",
        locale="ar-Gulf", lesson_id="analyst-m3-l2-ai-summarization",
    )
    assert n == "standalone-cell__d0b8a1ea6073__ar-Gulf__analyst-m3-l2-ai-summarization"


def test_valid_bundle_skips_generation(tmp_path):
    repo = tmp_path / "repo"; repo.mkdir()
    lid, loc = "lid-r", "en"
    # First: produce a bundle from a pretend successful build.
    _stage_pipeline_outputs(repo, lid, loc, b"\x00" * 200_000, b"\x00" * 20_000,
                            "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n")
    bundle = tmp_path / "bundle-in"
    build_bundle_from_pipeline(
        bundle_dir=bundle, repo_root=repo, lesson_id=lid, locale=loc,
        source_sha="src-abc", pipeline_log_text="run1",
    )
    for f in REQUIRED_FILES:
        assert (bundle / f).is_file()

    # Wipe pipeline outputs to prove recovery restores them.
    (repo / "public" / "lessons" / "intro" / f"{lid}__{loc}.mp4").unlink()
    (Path("/tmp") / f"{lid}__{loc}" / "audio" / "master.mp3").unlink()
    (Path("/tmp") / f"{lid}__{loc}" / "captions.vtt").unlink()

    # Bunny hash equals bundle's videoChecksum.
    v = json.loads((bundle / "validation.json").read_text(encoding="utf-8"))
    http = _fake_http_new_upload(v["videoChecksum"])

    called = {"build": False, "narration": False}
    def sr(cmd, cwd, check):
        called["build"] = True
        class R: returncode = 0
        return R()

    out = rc.run_cell(
        lesson_id=lid, locale=loc, package_path="unused",
        source_sha="src-abc", workflow_run_id="rr1", artifact_id="ART",
        artifact_digest="sha256:d",
        bunny_library_id="l", bunny_api_key="k",
        bundle_in_dir=bundle, repo_root=repo,
        subprocess_run=sr,
        branch_repo_factory=lambda r: _FakeGit(r),
        http_fn=http,
    )
    assert out["status"] == "finalized"
    assert out["recoveredFromBundle"] is True
    assert called["build"] is False  # no Gemini/TTS/render call
    # Files were restored:
    assert (repo / "public" / "lessons" / "intro" / f"{lid}__{loc}.mp4").is_file()


def test_invalid_bundle_forces_regeneration(tmp_path):
    repo = tmp_path / "repo"; repo.mkdir()
    lid, loc = "lid-x", "en"
    bundle = tmp_path / "bundle-in"; bundle.mkdir()
    # Missing 5 required files -> invalid.
    (bundle / "validation.json").write_text('{"composite":"lid-x__en"}', encoding="utf-8")

    build_called = {"n": 0}
    def sr(cmd, cwd, check):
        build_called["n"] += 1
        # simulate a successful build producing outputs
        _stage_pipeline_outputs(repo, lid, loc, b"\x00" * 200_000, b"\x00" * 20_000,
                                "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n")
        class R: returncode = 0
        return R()

    from video_standalone.artifact import resolve_paths, validate_and_checksum
    # Bunny http computed after stage
    class LateHttp:
        def __call__(self, method, url, body, headers):
            if method == "GET" and "search=" in url:
                return 200, json.dumps({"items": []}).encode()
            if method == "POST":
                return 200, json.dumps({"guid": "G-NEW2"}).encode()
            if method == "PUT":
                return 200, b"{}"
            if method == "GET":
                ck = validate_and_checksum(resolve_paths(repo, lid, loc))
                return 200, json.dumps(
                    {"guid": "G-NEW2", "originalHash": ck["videoChecksum"]}
                ).encode()
            raise AssertionError(method)
    out = rc.run_cell(
        lesson_id=lid, locale=loc, package_path="unused",
        source_sha="src", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d", bunny_library_id="l", bunny_api_key="k",
        bundle_in_dir=bundle, repo_root=repo,
        subprocess_run=sr, branch_repo_factory=lambda r: _FakeGit(r),
        http_fn=LateHttp(),
        skip_narration_gate=True,
    )
    assert out["status"] == "finalized"
    assert out["recoveredFromBundle"] is False
    assert build_called["n"] >= 1  # generation ran because bundle was invalid


def test_bundle_written_before_bunny(tmp_path):
    repo = tmp_path / "repo"; repo.mkdir()
    lid, loc = "lid-b", "ar-MSA"
    _stage_pipeline_outputs(repo, lid, loc, b"\x00" * 200_000, b"\x00" * 20_000,
                            "WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhello\n")
    from video_standalone.artifact import resolve_paths, validate_and_checksum
    ck = validate_and_checksum(resolve_paths(repo, lid, loc))
    bundle_out = tmp_path / "bundle-out"

    order = []
    def http(method, url, body, headers):
        order.append(("bunny", method))
        if method == "GET" and "search=" in url:
            return 200, json.dumps({"items": []}).encode()
        if method == "POST":
            return 200, json.dumps({"guid": "G"}).encode()
        if method == "PUT":
            # By the time Bunny upload starts, the bundle must already exist on disk.
            assert (bundle_out / "video.mp4").is_file(), "bundle not written before Bunny"
            return 200, b"{}"
        if method == "GET":
            return 200, json.dumps({"guid": "G", "originalHash": ck["videoChecksum"]}).encode()
        raise AssertionError(method)
    out = rc.run_cell(
        lesson_id=lid, locale=loc, package_path="unused",
        source_sha="src", workflow_run_id="w", artifact_id="a",
        artifact_digest="sha256:d", bunny_library_id="l", bunny_api_key="k",
        bundle_out_dir=bundle_out, repo_root=repo,
        branch_repo_factory=lambda r: _FakeGit(r),
        http_fn=http, skip_build=True,
    )
    assert out["status"] == "finalized"
    # Bundle exists post-run with all six files.
    for f in REQUIRED_FILES:
        assert (bundle_out / f).is_file(), f
    validate_bundle(bundle_dir=bundle_out, lesson_id=lid, locale=loc,
                    expected_source_sha="src")


if __name__ == "__main__":
    import tempfile
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            with tempfile.TemporaryDirectory() as td:
                try:
                    fn(Path(td))  # type: ignore[misc]
                except TypeError:
                    fn()
            print("ok", name)
