"""Fail-closed localized video scene integrity validator.

Runs before any localized TTS or Remotion render. No network.

Validates:
  * locale propagation (presence, uniformity, source/package match, renderer match)
  * learner-visible scene text (en Arabic Unicode; ar-MSA/ar-Gulf Egyptian markers)
  * resolved presentation chrome (en must not contain Arabic Unicode)

Legacy locale-undefined scenes (locale is None / omitted) skip content locale
checks and must not be stamped.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from typing import Any

from .integrity_locale_policy import (
    LOCALIZED_PRESENTATION_LOCALES,
    find_arabic_unicode,
    find_egyptian_marker_hits,
    resolve_presentation_chrome,
)

# Learner-visible visual field paths per card (SceneData + pipeline visual).
_VISUAL_STRING_PATHS: dict[str, tuple[str, ...]] = {
    "TitleCard": ("chip", "title", "highlight", "subtitle"),
    "ConceptCard": ("term", "definition", "tag"),
    "BigStatCard": ("intro", "big", "outro"),
    "BulletsCard": ("title",),
    "CompareCard": ("title",),
    "CTACard": ("eyebrow", "title", "highlight", "tagline"),
    "ScreenshotCard": ("eyebrow", "title", "caption"),
}


@dataclass(frozen=True)
class IntegrityIssue:
    lessonId: str
    sourcePackageLocale: str | None
    declaredSceneLocale: str | None
    sceneIndex: int
    cardType: str
    fieldPath: str
    ruleId: str
    offending: str
    message: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class IntegrityResult:
    ok: bool
    lessonId: str
    sourcePackageLocale: str | None
    resolvedPresentationLocale: str | None
    sceneCount: int
    issues: list[IntegrityIssue] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "lessonId": self.lessonId,
            "sourcePackageLocale": self.sourcePackageLocale,
            "resolvedPresentationLocale": self.resolvedPresentationLocale,
            "sceneCount": self.sceneCount,
            "issues": [i.to_dict() for i in self.issues],
        }


def _scene_card(scene: dict[str, Any]) -> str:
    return str(scene.get("card") or "")


def _scene_locale(scene: dict[str, Any]) -> str | None:
    loc = scene.get("locale")
    if loc is None:
        return None
    return str(loc) if loc else None


def _visual_blob(scene: dict[str, Any]) -> dict[str, Any]:
    visual = scene.get("visual")
    if isinstance(visual, dict):
        return visual
    # Flat SceneData shape
    return {k: v for k, v in scene.items() if k not in {
        "card", "accent", "locale", "spoken", "focus", "voice",
    }}


def _iter_learner_fields(
    scene: dict[str, Any],
) -> list[tuple[str, str]]:
    """Return (fieldPath, text) for learner-visible scene strings."""
    out: list[tuple[str, str]] = []
    card = _scene_card(scene)
    visual = _visual_blob(scene)

    for key in ("spoken", "focus"):
        val = scene.get(key)
        if isinstance(val, str) and val.strip():
            out.append((key, val))

    for path in _VISUAL_STRING_PATHS.get(card, ()):
        val = visual.get(path)
        if isinstance(val, str) and val.strip():
            prefix = "visual." if "visual" in scene else ""
            out.append((f"{prefix}{path}", val))

    if card == "BulletsCard":
        bullets = visual.get("bullets") or []
        if isinstance(bullets, list):
            for i, b in enumerate(bullets):
                if isinstance(b, str) and b.strip():
                    prefix = "visual." if "visual" in scene else ""
                    out.append((f"{prefix}bullets[{i}]", b))

    if card == "CompareCard":
        for side in ("left", "right"):
            side_obj = visual.get(side) or {}
            if isinstance(side_obj, dict):
                for sub in ("label", "body"):
                    val = side_obj.get(sub)
                    if isinstance(val, str) and val.strip():
                        prefix = "visual." if "visual" in scene else ""
                        out.append((f"{prefix}{side}.{sub}", val))

    return out


def resolve_scenes_presentation_locale(
    scenes: list[dict[str, Any]],
    renderer_locale: str | None = None,
) -> str | None:
    if renderer_locale:
        return renderer_locale
    for scene in scenes:
        loc = _scene_locale(scene)
        if loc:
            return loc
    return None


def validate_localized_scene_integrity(
    *,
    lesson_id: str,
    source_package_locale: str | None,
    scenes: list[dict[str, Any]],
    renderer_locale: str | None = None,
) -> IntegrityResult:
    """Validate localized (or legacy) scenes. Legacy skips content locale rules."""
    issues: list[IntegrityIssue] = []
    scene_count = len(scenes)
    resolved = resolve_scenes_presentation_locale(scenes, renderer_locale)

    is_localized = source_package_locale in LOCALIZED_PRESENTATION_LOCALES

    def add(
        *,
        scene_index: int,
        card: str,
        field_path: str,
        rule_id: str,
        offending: str,
        message: str,
        declared: str | None = None,
    ) -> None:
        issues.append(
            IntegrityIssue(
                lessonId=lesson_id,
                sourcePackageLocale=source_package_locale,
                declaredSceneLocale=declared,
                sceneIndex=scene_index,
                cardType=card,
                fieldPath=field_path,
                ruleId=rule_id,
                offending=offending,
                message=message,
            )
        )

    if is_localized:
        if not scenes:
            add(
                scene_index=-1,
                card="",
                field_path="scenes",
                rule_id="SCENES_EMPTY",
                offending="",
                message="Localized lesson produced zero integrity scenes",
            )

        declared_locales: list[str | None] = [_scene_locale(s) for s in scenes]

        for idx, scene in enumerate(scenes):
            card = _scene_card(scene)
            declared = declared_locales[idx]
            if not declared:
                add(
                    scene_index=idx,
                    card=card,
                    field_path="locale",
                    rule_id="LOCALE_MISSING",
                    offending="",
                    message="Localized scene is missing required locale stamp",
                    declared=declared,
                )
            elif declared != source_package_locale:
                add(
                    scene_index=idx,
                    card=card,
                    field_path="locale",
                    rule_id="LOCALE_SOURCE_MISMATCH",
                    offending=str(declared),
                    message=(
                        f"Scene locale {declared!r} differs from source package "
                        f"locale {source_package_locale!r}"
                    ),
                    declared=declared,
                )

        unique = {d for d in declared_locales if d}
        if len(unique) > 1:
            add(
                scene_index=-1,
                card="",
                field_path="locale",
                rule_id="LOCALE_MIXED",
                offending=",".join(sorted(unique)),
                message="Scenes within one localized lesson contain mixed locales",
            )

        if renderer_locale is not None:
            if renderer_locale != source_package_locale:
                add(
                    scene_index=-1,
                    card="",
                    field_path="renderer.locale",
                    rule_id="LOCALE_RENDERER_MISMATCH",
                    offending=str(renderer_locale),
                    message=(
                        f"Renderer locale {renderer_locale!r} differs from source "
                        f"package locale {source_package_locale!r}"
                    ),
                )
            for idx, scene in enumerate(scenes):
                declared = _scene_locale(scene)
                if declared and declared != renderer_locale:
                    add(
                        scene_index=idx,
                        card=_scene_card(scene),
                        field_path="locale",
                        rule_id="LOCALE_RENDERER_MISMATCH",
                        offending=str(declared),
                        message=(
                            f"Scene locale {declared!r} differs from renderer "
                            f"locale {renderer_locale!r}"
                        ),
                        declared=declared,
                    )

        # Content + chrome checks for localized locales only.
        for idx, scene in enumerate(scenes):
            card = _scene_card(scene)
            declared = _scene_locale(scene)
            effective = declared or source_package_locale

            for field_path, text in _iter_learner_fields(scene):
                if effective == "en":
                    hit = find_arabic_unicode(text)
                    if hit:
                        add(
                            scene_index=idx,
                            card=card,
                            field_path=field_path,
                            rule_id="EN_ARABIC_UNICODE",
                            offending=hit,
                            message="English learner-visible text contains Arabic Unicode",
                            declared=declared,
                        )
                elif effective in ("ar-MSA", "ar-Gulf"):
                    for marker in find_egyptian_marker_hits(text):
                        add(
                            scene_index=idx,
                            card=card,
                            field_path=field_path,
                            rule_id="AR_EGYPTIAN_MARKER",
                            offending=marker,
                            message=(
                                f"High-confidence Egyptian marker {marker!r} "
                                f"rejected for {effective}"
                            ),
                            declared=declared,
                        )

        # Resolved chrome integrity.
        chrome_locale = source_package_locale
        for key in ("conceptBadge", "brandTagline"):
            label = resolve_presentation_chrome(key, chrome_locale)
            if chrome_locale == "en":
                hit = find_arabic_unicode(label)
                if hit:
                    add(
                        scene_index=-1,
                        card="chrome",
                        field_path=f"chrome.{key}",
                        rule_id="EN_CHROME_ARABIC_UNICODE",
                        offending=hit,
                        message="English resolved chrome contains Arabic Unicode",
                    )

    return IntegrityResult(
        ok=len(issues) == 0,
        lessonId=lesson_id,
        sourcePackageLocale=source_package_locale,
        resolvedPresentationLocale=resolved,
        sceneCount=scene_count,
        issues=issues,
    )


def assert_localized_scene_integrity(
    *,
    lesson_id: str,
    source_package_locale: str | None,
    scenes: list[dict[str, Any]],
    renderer_locale: str | None = None,
) -> IntegrityResult:
    """Fail-closed wrapper used by the build pipeline before TTS/render."""
    result = validate_localized_scene_integrity(
        lesson_id=lesson_id,
        source_package_locale=source_package_locale,
        scenes=scenes,
        renderer_locale=renderer_locale,
    )
    if source_package_locale in LOCALIZED_PRESENTATION_LOCALES and not result.ok:
        first = result.issues[0]
        raise SystemExit(
            f"::error::localized-video-integrity [{first.ruleId}] "
            f"lesson={lesson_id} locale={source_package_locale} "
            f"scene={first.sceneIndex} field={first.fieldPath} "
            f"offending={first.offending!r} — {first.message}"
        )
    return result
