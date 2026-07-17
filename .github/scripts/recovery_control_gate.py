"""Construct-aware recovery reachability gate for Python entrypoints."""
from __future__ import annotations

import ast
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

FORBIDDEN_ATTRS = frozenset(
    {
        "create_video",
        "upload_mp4",
        "wait_for_post_upload_original_hash",
    }
)
FORBIDDEN_NAMES = frozenset(
    {
        "create_video",
        "upload_mp4",
        "promote_finalized_mappings",
        "wait_for_post_upload_original_hash",
    }
)
LEXICAL_MARKERS = frozenset(
    {
        "build-lesson.py",
        "GEMINI_API_KEY",
    }
)
DYNAMIC_IMPORT_FUNCS = frozenset({"__import__", "import_module"})
DYNAMIC_ATTR_FUNCS = frozenset({"getattr"})

RECOVERY_ENTRYPOINT = Path(".github/scripts/recover_uploaded_receipt_cli.py")


@dataclass(frozen=True)
class Violation:
    path: str
    line: int
    reason: str


def _const_str(node: ast.AST) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    return None


def _is_none(node: ast.AST) -> bool:
    return isinstance(node, ast.Constant) and node.value is None


def _slice_const(node: ast.AST) -> str | None:
    if isinstance(node, ast.Subscript):
        return _const_str(node.slice)
    return None


def _strings_in_tree(node: ast.AST) -> list[str]:
    return [
        n.value
        for n in ast.walk(node)
        if isinstance(n, ast.Constant) and isinstance(n.value, str)
    ]


class RecoveryGateVisitor(ast.NodeVisitor):
    def __init__(self, path: str) -> None:
        self.path = path
        self.violations: list[Violation] = []

    def _add(self, node: ast.AST, reason: str) -> None:
        self.violations.append(Violation(self.path, getattr(node, "lineno", 0), reason))

    def _check_lexical_string(self, node: ast.AST, value: str, *, context: str) -> None:
        if value in LEXICAL_MARKERS:
            self._add(node, f"forbidden lexical {context}: {value!r}")
        if "build-lesson.py" in value:
            self._add(node, f"forbidden lexical {context}: build-lesson.py")

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            base = alias.name.split(".")[-1]
            if base in FORBIDDEN_NAMES:
                self._add(node, f"forbidden import: {alias.name}")
            if alias.asname and alias.asname in FORBIDDEN_NAMES:
                self._add(node, f"forbidden import alias: {alias.asname}")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        for alias in node.names:
            if alias.name in FORBIDDEN_NAMES:
                self._add(node, f"forbidden import-from: {alias.name}")
            if alias.asname and alias.asname in FORBIDDEN_NAMES:
                self._add(node, f"forbidden import-from alias: {alias.asname}")
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> None:
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Attribute):
            attr = node.targets[0].attr
            if attr in FORBIDDEN_ATTRS:
                if _is_none(node.value):
                    return self.generic_visit(node)
                self._add(node, f"forbidden attribute assignment to non-None: {attr}")
                return self.generic_visit(node)

        if isinstance(node.value, ast.Attribute) and node.value.attr in FORBIDDEN_ATTRS:
            self._add(node, "forbidden executable attribute reference assignment")
        elif isinstance(node.value, ast.Name) and node.value.id in FORBIDDEN_NAMES:
            self._add(node, "forbidden name reference assignment")
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        if isinstance(node.target, ast.Attribute) and node.target.attr in FORBIDDEN_ATTRS:
            if node.value is None or _is_none(node.value):
                return self.generic_visit(node)
            self._add(node, "forbidden annotated attribute assignment")
        self.generic_visit(node)

    def visit_Subscript(self, node: ast.Subscript) -> None:
        marker = _slice_const(node)
        if marker is not None:
            self._check_lexical_string(node, marker, context="subscript")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        if isinstance(func, ast.Name):
            if func.id in FORBIDDEN_NAMES:
                self._add(node, f"forbidden direct call: {func.id}")
            elif func.id in DYNAMIC_IMPORT_FUNCS or func.id in DYNAMIC_ATTR_FUNCS:
                self._check_dynamic_access(node, func.id)
        elif isinstance(func, ast.Attribute):
            if func.attr in FORBIDDEN_ATTRS:
                self._add(node, f"forbidden attribute call: {func.attr}")
            elif func.attr in DYNAMIC_IMPORT_FUNCS or func.attr in DYNAMIC_ATTR_FUNCS:
                self._check_dynamic_access(node, func.attr)

        for arg in node.args:
            for marker in _strings_in_tree(arg):
                self._check_lexical_string(node, marker, context="call-argument")
        self.generic_visit(node)

    def _check_dynamic_access(self, node: ast.Call, kind: str) -> None:
        if not node.args:
            self._add(node, f"ambiguous dynamic access via {kind}")
            return
        marker = _const_str(node.args[0])
        if marker is None and len(node.args) > 1:
            marker = _const_str(node.args[1])
        if marker is None:
            self._add(node, f"ambiguous dynamic access via {kind}")
            return
        if marker in FORBIDDEN_NAMES or marker in FORBIDDEN_ATTRS:
            self._add(node, f"forbidden dynamic access: {marker!r}")
        self._check_lexical_string(node, marker, context="dynamic-access")

    def visit_Attribute(self, node: ast.Attribute) -> None:
        if isinstance(node.ctx, ast.Load) and node.attr in FORBIDDEN_ATTRS:
            self._add(node, f"forbidden attribute load: {node.attr}")
        self.generic_visit(node)

    def visit_Name(self, node: ast.Name) -> None:
        if isinstance(node.ctx, ast.Load) and node.id in FORBIDDEN_NAMES:
            self._add(node, f"forbidden name load: {node.id}")
        if isinstance(node.ctx, ast.Load) and node.id in LEXICAL_MARKERS:
            self._add(node, f"forbidden lexical name load: {node.id}")
        self.generic_visit(node)


def inspect_python_source(path: Path, source: str) -> list[Violation]:
    rel = path.as_posix()
    try:
        tree = ast.parse(source, filename=rel)
    except SyntaxError as e:
        return [Violation(rel, e.lineno or 0, f"python parse error: {e.msg}")]

    visitor = RecoveryGateVisitor(rel)
    visitor.visit(tree)
    return visitor.violations


def inspect_python_file(path: Path) -> list[Violation]:
    return inspect_python_source(path, path.read_text(encoding="utf-8"))


def inspect_recovery_entrypoint(repo_root: Path) -> list[Violation]:
    path = (repo_root / RECOVERY_ENTRYPOINT).resolve()
    if not path.is_file():
        return [Violation(RECOVERY_ENTRYPOINT.as_posix(), 0, "missing recovery entrypoint")]
    return inspect_python_file(path)


def main(argv: Iterable[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    root = Path(args[0] if args else ".").resolve()
    violations = inspect_recovery_entrypoint(root)
    if violations:
        for v in violations:
            print(f"forbidden reachability {v.path}:{v.line}: {v.reason}", file=sys.stderr)
        return 1
    print("recovery reachability gate passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
