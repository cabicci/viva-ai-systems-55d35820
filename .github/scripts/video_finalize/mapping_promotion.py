"""Promote validated finalized receipts into src/lib/bunny-videos.ts (registry-only)."""
from __future__ import annotations

import json
import re
import subprocess
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from .constants import (
    ACCEPTED_CARRY_FORWARD_CELL,
    ACCEPTED_CARRY_FORWARD_LOGICAL_KEY,
    BATCH_ID,
    receipt_relpath,
    result_branch_name,
)
from .receipt import ReceiptError, validate_receipt
from .source_policy import validate_promotion_source_sha

LOCALIZED_LOCALES = frozenset({"en", "ar-MSA", "ar-Gulf"})
REGISTRY_REL_PATH = "src/lib/bunny-videos.ts"
LIBRARY_ID_RE = re.compile(r'^export const BUNNY_LIBRARY_ID = "(\d+)";\s*$', re.MULTILINE)
GUIDS_BLOCK_RE = re.compile(
    r"(export const BUNNY_VIDEO_GUIDS:\s*Record<string,\s*string>\s*=\s*\{)"
    r"([\s\S]*?)"
    r"(\n\};)",
    re.MULTILINE,
)
ENTRY_RE = re.compile(r'^(\s*)"([^"]+)":\s*"([^"]+)",\s*$')
MAX_PUSH_RETRIES = 3


class MappingPromotionError(RuntimeError):
    pass


@dataclass
class PromotionPlan:
    promotable: dict[str, str] = field(default_factory=dict)
    rejected: dict[str, str] = field(default_factory=dict)
    ambiguous: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)

    @property
    def promotable_count(self) -> int:
        return len(self.promotable)

    def unresolved_keys(self, expected_logical_keys: list[str]) -> list[str]:
        unresolved = set(expected_logical_keys) - set(self.promotable)
        return sorted(unresolved)

    def as_dict(self) -> dict[str, Any]:
        return {
            "promotableLogicalKeys": sorted(self.promotable),
            "promotableCount": len(self.promotable),
            "rejected": dict(sorted(self.rejected.items())),
            "ambiguousLogicalKeys": sorted(self.ambiguous),
            "missingLogicalKeys": sorted(self.missing),
        }


@dataclass
class RegistryApplyResult:
    changed: bool
    updated_keys: list[str]
    text: str


@dataclass
class PushRegistryResult:
    pushed: bool
    commit_sha: str | None
    retries: int
    message: str


def is_valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False


def is_localized_composite_key(key: str) -> bool:
    if "__" not in key:
        return False
    _, locale = key.rsplit("__", 1)
    return locale in LOCALIZED_LOCALES


def _receipt_matches_carry_forward(receipt: dict[str, Any]) -> bool:
    return all(receipt.get(field) == expected for field, expected in ACCEPTED_CARRY_FORWARD_CELL.items())


def validate_receipt_for_promotion(
    receipt: dict[str, Any],
    *,
    logical_key: str,
    expected_logical_keys: set[str],
    branch_logical_key: str | None = None,
) -> tuple[str | None, str | None]:
    try:
        validate_receipt(receipt)
    except ReceiptError as e:
        return None, str(e)

    if logical_key not in expected_logical_keys:
        return None, "logical key not in expected manifest"
    if receipt.get("logicalKey") != logical_key:
        return None, "receipt logicalKey mismatch"
    if branch_logical_key is not None and branch_logical_key != logical_key:
        return None, "receipt branch identity mismatch"
    if receipt.get("batchId") != BATCH_ID:
        return None, "batchId mismatch"
    if receipt.get("validationStatus") != "finalized":
        return None, "validationStatus must be finalized"

    locale = str(receipt.get("locale") or "")
    lesson_id = str(receipt.get("lessonId") or "")
    if locale not in LOCALIZED_LOCALES:
        return None, f"locale {locale!r} not promotable"
    if locale == "ar-EG":
        return None, "ar-EG receipt not promotable"
    if f"{lesson_id}__{locale}" != logical_key:
        return None, "lessonId/locale disagree with logical key"

    guid = str(receipt.get("bunnyGuid") or "")
    if not is_valid_uuid(guid):
        return None, "bunnyGuid is not a valid UUID"

    if logical_key == ACCEPTED_CARRY_FORWARD_LOGICAL_KEY:
        if not _receipt_matches_carry_forward(receipt):
            return None, "accepted carry-forward identity mismatch"
    else:
        source_err = validate_promotion_source_sha(
            logical_key, receipt.get("sourceSha")
        )
        if source_err:
            return None, source_err

    return guid, None


def _load_receipt(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_promotion_plan(
    *,
    expected_logical_keys: list[str],
    receipt_roots: list[Path],
    batch_id: str = BATCH_ID,
) -> PromotionPlan:
    expected_set = set(expected_logical_keys)
    plan = PromotionPlan()
    seen: dict[str, list[tuple[dict[str, Any], str | None]]] = {}

    for root in receipt_roots:
        branch_key = root.name if root.name else None
        for logical_key in expected_logical_keys:
            path = root / receipt_relpath(batch_id, logical_key)
            if not path.is_file():
                continue
            try:
                receipt = _load_receipt(path)
            except json.JSONDecodeError as e:
                plan.rejected.setdefault(logical_key, f"invalid json: {e}")
                continue
            seen.setdefault(logical_key, []).append((receipt, branch_key))

    for logical_key in expected_logical_keys:
        entries = seen.get(logical_key) or []
        if not entries:
            plan.missing.append(logical_key)
            continue
        guids: set[str] = set()
        valid_guid: str | None = None
        errors: list[str] = []
        for receipt, branch_key in entries:
            guid, err = validate_receipt_for_promotion(
                receipt,
                logical_key=logical_key,
                expected_logical_keys=expected_set,
                branch_logical_key=branch_key,
            )
            if err:
                errors.append(err)
                continue
            assert guid is not None
            guids.add(guid)
            valid_guid = guid
        if len(guids) > 1:
            plan.ambiguous.append(logical_key)
            plan.rejected[logical_key] = "conflicting receipts"
            continue
        if valid_guid is None:
            plan.rejected[logical_key] = errors[0] if errors else "invalid receipt"
            continue
        plan.promotable[logical_key] = valid_guid

    plan.missing = sorted(set(plan.missing) - set(plan.promotable) - set(plan.ambiguous))
    plan.ambiguous = sorted(set(plan.ambiguous))
    return plan


def _parse_registry_entries(body: str) -> list[tuple[str, str, str]]:
    entries: list[tuple[str, str, str]] = []
    for line in body.splitlines():
        match = ENTRY_RE.match(line)
        if match:
            entries.append((match.group(1), match.group(2), match.group(3)))
    return entries


def apply_promotions_to_registry(text: str, promotions: dict[str, str]) -> RegistryApplyResult:
    if not promotions:
        return RegistryApplyResult(changed=False, updated_keys=[], text=text)

    block_match = GUIDS_BLOCK_RE.search(text)
    if not block_match:
        raise MappingPromotionError("could not parse bunny registry structure")

    head, body, tail = block_match.group(1), block_match.group(2), block_match.group(3)
    entries: list[tuple[str, str, str]] = []
    for line in body.splitlines():
        match = ENTRY_RE.match(line)
        if match:
            entries.append((match.group(1), match.group(2), match.group(3)))

    if not entries:
        raise MappingPromotionError("registry contains no GUID entries")

    indent = entries[0][0]
    by_key = {key: (ind, guid) for ind, key, guid in entries}
    updated_keys: list[str] = []
    new_lines: list[str] = []

    for ind, key, guid in entries:
        if key in promotions:
            new_guid = promotions[key]
            if guid != new_guid:
                updated_keys.append(key)
            new_lines.append(f'{ind}"{key}": "{new_guid}",')
        else:
            new_lines.append(f'{ind}"{key}": "{guid}",')

    for key in sorted(promotions):
        if key not in by_key:
            if not is_localized_composite_key(key):
                raise MappingPromotionError(f"refusing non-localized composite promotion: {key}")
            new_lines.append(f'{indent}"{key}": "{promotions[key]}",')
            updated_keys.append(key)

    if not updated_keys:
        return RegistryApplyResult(changed=False, updated_keys=[], text=text)

    new_body = "\n".join(new_lines)
    if body.startswith("\n"):
        new_body = "\n" + new_body
    if body.endswith("\n") and not new_body.endswith("\n"):
        new_body += "\n"

    new_text = text[: block_match.start()] + head + new_body + tail + text[block_match.end() :]
    return RegistryApplyResult(changed=True, updated_keys=sorted(updated_keys), text=new_text)


def _run_git(args: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> None:
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True, env=env)


def _verify_single_staged_file(repo_dir: Path, rel_path: str) -> None:
    staged = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        cwd=repo_dir,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    if staged != rel_path:
        raise MappingPromotionError(f"staged file scope violation: {staged!r}")


def push_registry_updates(
    *,
    repo_dir: Path,
    promotions: dict[str, str],
    registry_rel_path: str = REGISTRY_REL_PATH,
    remote_url: str,
    dispatched_sha: str,
    commit_message: str,
    max_retries: int = MAX_PUSH_RETRIES,
    run_git: Callable[..., None] | None = None,
) -> PushRegistryResult:
    git = run_git or _run_git

    retries = 0
    while retries <= max_retries:
        if not (repo_dir / ".git").exists():
            git(["init"], cwd=repo_dir)
            git(["config", "user.email", "video-mapping@github-actions"], cwd=repo_dir)
            git(["config", "user.name", "video-mapping-promotion"], cwd=repo_dir)
        try:
            git(["remote", "remove", "origin"], cwd=repo_dir)
        except subprocess.CalledProcessError:
            pass
        git(["remote", "add", "origin", remote_url], cwd=repo_dir)
        git(["fetch", "origin", "main"], cwd=repo_dir)
        main_sha = subprocess.run(
            ["git", "rev-parse", "origin/main"],
            cwd=repo_dir,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        ancestor = subprocess.run(
            ["git", "merge-base", "--is-ancestor", dispatched_sha, main_sha],
            cwd=repo_dir,
            capture_output=True,
            text=True,
        )
        if ancestor.returncode != 0:
            raise MappingPromotionError(
                f"dispatched sha {dispatched_sha} is not ancestor of origin/main {main_sha}"
            )
        git(["checkout", "-B", "main", "origin/main"], cwd=repo_dir)

        registry_path = repo_dir / registry_rel_path
        if not registry_path.is_file():
            raise MappingPromotionError(f"missing registry file: {registry_rel_path}")

        original = registry_path.read_text(encoding="utf-8")
        apply_result = apply_promotions_to_registry(original, promotions)
        if not apply_result.changed:
            return PushRegistryResult(
                pushed=False,
                commit_sha=None,
                retries=retries,
                message="registry already up to date",
            )

        registry_path.write_text(apply_result.text, encoding="utf-8")
        git(["add", registry_rel_path], cwd=repo_dir)
        _verify_single_staged_file(repo_dir, registry_rel_path)
        git(["commit", "-m", commit_message], cwd=repo_dir)
        commit_sha = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_dir,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        try:
            git(["push", "origin", "main"], cwd=repo_dir)
            return PushRegistryResult(
                pushed=True,
                commit_sha=commit_sha,
                retries=retries,
                message="registry promotion pushed",
            )
        except subprocess.CalledProcessError as exc:
            retries += 1
            if retries > max_retries:
                raise MappingPromotionError(
                    f"registry push failed after {max_retries} retries: {exc.stderr}"
                ) from exc
    raise MappingPromotionError("unreachable push retry state")


def expected_branch_for_key(logical_key: str, batch_id: str = BATCH_ID) -> str:
    return result_branch_name(batch_id, logical_key)
