"""Isolated result-branch git operations (mockable). Never pushes to main."""
from __future__ import annotations

import subprocess
from dataclasses import dataclass, field
from pathlib import Path


class GitBranchError(RuntimeError):
    pass


@dataclass
class GitCallLog:
    commits: list[str] = field(default_factory=list)
    pushes: list[str] = field(default_factory=list)


@dataclass
class ResultBranchRepo:
    """Operate on a temporary or checkout repo restricted to one result branch."""

    repo_dir: Path
    log: GitCallLog = field(default_factory=GitCallLog)

    def _git(self, *args: str) -> str:
        proc = subprocess.run(
            ["git", *args],
            cwd=self.repo_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            raise GitBranchError(
                f"git {' '.join(args)} failed: {proc.stderr.strip() or proc.stdout}"
            )
        return proc.stdout

    def ensure_orphan_branch(self, branch: str) -> None:
        if branch == "main" or branch.endswith("/main"):
            raise GitBranchError("refusing to operate on main")
        if not branch.startswith("video-results/"):
            raise GitBranchError(f"branch must be under video-results/: {branch}")
        # Create orphan branch for first receipt; if exists check out.
        existing = subprocess.run(
            ["git", "rev-parse", "--verify", branch],
            cwd=self.repo_dir,
            capture_output=True,
            text=True,
        )
        if existing.returncode == 0:
            self._git("checkout", branch)
            return
        self._git("checkout", "--orphan", branch)
        # Clear index for orphan
        subprocess.run(
            ["git", "rm", "-rf", "--cached", "."],
            cwd=self.repo_dir,
            capture_output=True,
            text=True,
        )

    def commit_paths(self, paths: list[Path], message: str) -> str:
        if "main" in message.lower() and "video-results" not in message:
            pass  # message may mention context; branch guard is elsewhere
        for p in paths:
            rel = p.relative_to(self.repo_dir).as_posix()
            self._git("add", "--", rel)
        self._git("commit", "-m", message)
        sha = self._git("rev-parse", "HEAD").strip()
        self.log.commits.append(sha)
        return sha

    def push(self, branch: str, remote: str = "origin") -> None:
        if branch == "main":
            raise GitBranchError("refusing to push main")
        if not branch.startswith("video-results/"):
            raise GitBranchError(f"refusing push outside video-results/: {branch}")
        # Non-force only.
        self._git("push", remote, f"HEAD:refs/heads/{branch}")
        self.log.pushes.append(branch)

    def read_file(self, rel: str) -> bytes | None:
        path = self.repo_dir / rel
        if not path.is_file():
            return None
        return path.read_bytes()

    def list_receipt_candidates(self, receipt_rel: str) -> list[Path]:
        path = self.repo_dir / receipt_rel
        return [path] if path.is_file() else []
