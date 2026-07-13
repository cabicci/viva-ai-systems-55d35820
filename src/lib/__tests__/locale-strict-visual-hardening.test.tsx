import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayCircle } from "lucide-react";
import { render } from "@testing-library/react";
import { IntroLessonRenderer } from "@/components/intro/IntroLessonRenderer";
import { LESSON_DIAGRAMS } from "@/components/intro/diagrams/LessonDiagrams";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";
import {
  acceptStrictVisualPackageText,
  clearStrictVisualUiCatalogOverridesForTests,
  EGYPTIAN_ONLY_VISUAL_MARKERS,
  getStrictVisualUiString,
  isStrictVisualPackageTextAllowed,
  localizedLessonDiagramAssetPath,
  localizedLessonScreenshotAssetPath,
  resolveStrictLocalizedDiagramSrc,
  resolveStrictLocalizedScreenshotSrc,
  setStrictLocalizedAssetMapForTests,
  setStrictVisualUiCatalogOverrideForTests,
  STRICT_VISUAL_UI_KEYS,
} from "@/lib/locale-lessons/strict-localized-visual-policy";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import enUi from "@/locales/en/ui.json";
import arEgUi from "@/locales/ar-EG/ui.json";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  createLink: (component: unknown) => component,
}));

afterEach(() => {
  setStrictLocalizedAssetMapForTests(null);
  clearStrictVisualUiCatalogOverridesForTests();
});

function basePackage(
  locale: LessonPackageLocale,
  overrides: Partial<LocalizedLessonPackage> = {},
): LocalizedLessonPackage {
  return {
    locale,
    lessonId: "intro-m1-l1-what-is-ai",
    canonicalVersion: "test",
    title: "Test lesson",
    sections: [],
    sourceFile: "test.json",
    generatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("strict exact-locale UI accessor", () => {
  it("never returns ar-EG when the exact-locale visual key is missing", () => {
    const key = STRICT_VISUAL_UI_KEYS.diagramTitle;
    expect(arEgUi[key as keyof typeof arEgUi]).toBeUndefined();
    // Ensure en has the key normally, then blank it via override.
    expect(getStrictVisualUiString("en", key)).toBeTruthy();
    expect((enUi as Record<string, string>)[key]).toBeTruthy();

    setStrictVisualUiCatalogOverrideForTests("en", {
      ...(enUi as Record<string, string>),
      [key]: "",
    });

    expect(getStrictVisualUiString("en", key)).toBeUndefined();
    // Global helper still falls back to ar-EG for other missing keys —
    // pick a key present in ar-EG only via empty en override of a shared key.
    setStrictVisualUiCatalogOverrideForTests("en", {
      ...(enUi as Record<string, string>),
      "intro.block.comingSoon": "",
    });
    expect(getStrictVisualUiString("en", "intro.block.comingSoon")).toBeUndefined();
    expect(getUiString("en", "intro.block.comingSoon")).toBe(
      arEgUi["intro.block.comingSoon"],
    );
  });

  it("resolves only from the exact requested localized catalog", () => {
    expect(getStrictVisualUiString("en", STRICT_VISUAL_UI_KEYS.diagramTitle)).toBe(
      (enUi as Record<string, string>)[STRICT_VISUAL_UI_KEYS.diagramTitle],
    );
    expect(
      getStrictVisualUiString("ar-MSA", STRICT_VISUAL_UI_KEYS.diagramTitle),
    ).not.toBe(
      getStrictVisualUiString("ar-Gulf", STRICT_VISUAL_UI_KEYS.diagramTitle),
    );
  });

  it("keeps global non-strict UI fallback unchanged", () => {
    const key = "intro.block.comingSoon";
    const globalValue = getUiString("en", key);
    setStrictVisualUiCatalogOverrideForTests("en", {
      ...(enUi as Record<string, string>),
      [key]: "STRICT_ONLY_OVERRIDE",
    });
    expect(getStrictVisualUiString("en", key)).toBe("STRICT_ONLY_OVERRIDE");
    expect(getUiString("en", key)).toBe(globalValue);
  });
});

describe("future exact-locale asset resolution", () => {
  const lessonId = "intro-m1-l1-what-is-ai";

  it("resolves exact locale + lessonId JPG only", () => {
    setStrictLocalizedAssetMapForTests({
      [localizedLessonScreenshotAssetPath("en", lessonId)]:
        "https://cdn.test/en.jpg",
      [localizedLessonScreenshotAssetPath("ar-MSA", lessonId)]:
        "https://cdn.test/msa.jpg",
    });
    expect(resolveStrictLocalizedScreenshotSrc("en", lessonId)).toBe(
      "https://cdn.test/en.jpg",
    );
    expect(resolveStrictLocalizedScreenshotSrc("ar-MSA", lessonId)).toBe(
      "https://cdn.test/msa.jpg",
    );
  });

  it("resolves exact locale + lessonId SVG only", () => {
    setStrictLocalizedAssetMapForTests({
      [localizedLessonDiagramAssetPath("ar-Gulf", lessonId)]:
        "https://cdn.test/gulf.svg",
    });
    expect(resolveStrictLocalizedDiagramSrc("ar-Gulf", lessonId)).toBe(
      "https://cdn.test/gulf.svg",
    );
  });

  it("missing exact asset returns no asset", () => {
    setStrictLocalizedAssetMapForTests({});
    expect(resolveStrictLocalizedScreenshotSrc("en", lessonId)).toBeUndefined();
    expect(resolveStrictLocalizedDiagramSrc("en", lessonId)).toBeUndefined();
  });

  it("ar-EG / cross-locale / canonical assets cannot satisfy localized lookup", () => {
    setStrictLocalizedAssetMapForTests({
      [`src/assets/lessons/ar-EG/${lessonId}.jpg`]: "https://cdn.test/eg.jpg",
      [localizedLessonScreenshotAssetPath("ar-MSA", lessonId)]:
        "https://cdn.test/msa.jpg",
      [`src/assets/lessons/${lessonId}.jpg`]: "https://cdn.test/canonical.jpg",
      [`src/assets/lessons/diagrams/${lessonId}.svg`]:
        "https://cdn.test/diagrams.svg",
    });
    expect(resolveStrictLocalizedScreenshotSrc("en", lessonId)).toBeUndefined();
    expect(resolveStrictLocalizedScreenshotSrc("ar-Gulf", lessonId)).toBeUndefined();
    expect(resolveStrictLocalizedDiagramSrc("en", lessonId)).toBeUndefined();
    // MSA key must not leak to en
    expect(resolveStrictLocalizedScreenshotSrc("en", lessonId)).toBeUndefined();
  });

  it("renderer shows SVG asset without mounting LESSON_DIAGRAMS; missing stays placeholder", () => {
    const diagramId = Object.keys(
      LESSON_DIAGRAMS,
    )[0] as keyof typeof LESSON_DIAGRAMS;
    const content: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "Visual guide",
        title: "Visual guide",
        block: { kind: "diagram", id: diagramId, caption: "Localized caption" },
      },
    ];

    const missing = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={content}
          lessonId={lessonId}
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(
      missing.container.querySelector('[data-locale-diagram="placeholder"]'),
    ).not.toBeNull();
    expect(
      missing.container.querySelector('[data-locale-diagram="asset"]'),
    ).toBeNull();
    missing.unmount();

    setStrictLocalizedAssetMapForTests({
      [localizedLessonDiagramAssetPath("en", lessonId)]:
        "https://cdn.test/en-diagram.svg",
    });
    const withAsset = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={content}
          lessonId={lessonId}
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(
      withAsset.container.querySelector('[data-locale-diagram="asset"]'),
    ).not.toBeNull();
    expect(
      withAsset.container.querySelector('[data-locale-diagram="placeholder"]'),
    ).toBeNull();
    expect(
      withAsset.container.querySelector("img")?.getAttribute("src"),
    ).toBe("https://cdn.test/en-diagram.svg");
  });

  it("renderer shows JPG screenshot asset; missing stays placeholder", () => {
    const content: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "Inside the platform",
        title: "Inside the platform",
        block: { kind: "screenshot", caption: "Shot caption" },
      },
    ];

    const missing = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={content}
          lessonId={lessonId}
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(
      missing.container.querySelector('[data-locale-screenshot="placeholder"]'),
    ).not.toBeNull();
    missing.unmount();

    setStrictLocalizedAssetMapForTests({
      [localizedLessonScreenshotAssetPath("en", lessonId)]:
        "https://cdn.test/en-shot.jpg",
    });
    const withAsset = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={content}
          lessonId={lessonId}
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(
      withAsset.container.querySelector('[data-locale-screenshot="asset"]'),
    ).not.toBeNull();
    expect(
      withAsset.container.querySelector("img")?.getAttribute("src"),
    ).toBe("https://cdn.test/en-shot.jpg");
  });
});

describe("strict learner-visible text filtering", () => {
  const visibleFields = [
    "title",
    "eyebrow",
    "caption",
    "label",
    "alt",
    "durationLabel",
  ] as const;

  it("English rejects Arabic Unicode in every covered visible field", () => {
    for (const _field of visibleFields) {
      expect(isStrictVisualPackageTextAllowed("en", "Hello مرحبا")).toBe(false);
      expect(acceptStrictVisualPackageText("en", "Hello مرحبا")).toBeUndefined();
    }
    expect(isStrictVisualPackageTextAllowed("en", "Clean English chrome")).toBe(
      true,
    );
  });

  it("ar-MSA rejects each approved Egyptian-only marker", () => {
    for (const marker of EGYPTIAN_ONLY_VISUAL_MARKERS) {
      expect(
        isStrictVisualPackageTextAllowed("ar-MSA", `نص يحتوي ${marker} هنا`),
      ).toBe(false);
      expect(
        acceptStrictVisualPackageText("ar-MSA", `نص يحتوي ${marker} هنا`),
      ).toBeUndefined();
    }
  });

  it("ar-Gulf rejects each approved Egyptian-only marker", () => {
    for (const marker of EGYPTIAN_ONLY_VISUAL_MARKERS) {
      expect(
        isStrictVisualPackageTextAllowed("ar-Gulf", `جملة فيها ${marker} واضح`),
      ).toBe(false);
    }
  });

  it("accepts valid English, MSA, and Gulf Arabic", () => {
    expect(isStrictVisualPackageTextAllowed("en", "Lesson video")).toBe(true);
    expect(
      isStrictVisualPackageTextAllowed("ar-MSA", "فيديو الدرس للمبتدئين"),
    ).toBe(true);
    expect(
      isStrictVisualPackageTextAllowed("ar-Gulf", "فيديو الدرس للمبتدئين"),
    ).toBe(true);
  });

  it("rejected values never reappear through adapt fallback; package stays immutable", () => {
    const pkg = basePackage("en", {
      sections: [
        {
          role: "Video block",
          heading: "Video block — عنوان عربي",
          contentMarkdown: "تعليق عربي للدرس",
          bullets: ["تعليق عربي للدرس"],
          tables: [],
        },
        {
          role: "Screenshot block (intent)",
          heading: "Screenshot block (intent) — لقطة",
          contentMarkdown: "نص عربي",
          bullets: ["نص عربي"],
          tables: [],
        },
      ],
    });
    const before = JSON.stringify(pkg);
    const canonical: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "فيديو الدرس",
        title: "عنوان مصري للفيديو",
        block: {
          kind: "lessonVideo",
          url: "/eg.mp4",
          poster: "/eg.jpg",
          durationLabel: "1:00",
          caption: "تعليق مصري",
        },
      },
      {
        icon: PlayCircle,
        eyebrow: "من المنصة",
        title: "عنوان مصري للصورة",
        block: {
          kind: "screenshot",
          src: "/eg-shot.jpg",
          alt: "alt مصري",
          label: "label مصري",
          caption: "caption مصري",
        },
      },
    ];

    const adapted = adaptLocalizedPackageToIntroContent(pkg, canonical);
    expect(JSON.stringify(pkg)).toBe(before);

    const video = adapted.find((s) => s.block.kind === "lessonVideo");
    expect(video?.block.kind).toBe("lessonVideo");
    if (video?.block.kind === "lessonVideo") {
      expect(video.block.url).toBeUndefined();
      expect(video.block.poster).toBeUndefined();
      expect(video.block.durationLabel).toBeUndefined();
      expect(video.block.caption).toBeUndefined();
      expect(video.title).toBe("Lesson video");
      expect(video.eyebrow).toBe("Lesson video");
      expect(video.title).not.toContain("عنوان");
      expect(video.block.caption).not.toBe("تعليق مصري");
    }

    const shot = adapted.find((s) => s.block.kind === "screenshot");
    expect(shot?.block.kind).toBe("screenshot");
    if (shot?.block.kind === "screenshot") {
      expect(shot.block.src).toBeUndefined();
      expect(shot.block.alt).toBeUndefined();
      expect(shot.block.label).toBeUndefined();
      expect(shot.block.caption).toBeUndefined();
      expect(shot.title).toBe("Inside the platform");
    }
  });
});
