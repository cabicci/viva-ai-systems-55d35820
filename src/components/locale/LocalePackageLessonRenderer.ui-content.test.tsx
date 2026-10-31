// NEW focused r61 functional cases; actual renderer is a qualified presentation boundary.
import type * as ReactTypes from "react";
import type { SupportedLocale } from "@/lib/locale/types";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RendererProps = ReactTypes.ComponentProps<
  typeof import("@/components/intro/IntroLessonRenderer").IntroLessonRenderer
>;

const sourceBoundary = vi.hoisted(() => {
  const available = new Set<string>();
  const pending = new Map<string, Promise<IntroLessonContent | null>>();
  const canonicalCalls: string[] = [];
  const renders: Array<{ props: RendererProps; ui: SupportedLocale }> = [];
  return {
    available,
    pending,
    canonicalCalls,
    renders,
    observerEffects: [] as Array<{ phase: string; ui: SupportedLocale }>,
    samples: [] as Array<{ phase: string; domText: string; rendererCalls: number; canonicalCalls: number }>,
    cookieCalls: 0,
    unexpectedResolverCalls: 0,
  };
});

// Whole canonical content boundary: NEW synthetic values only, before imports.
vi.mock("@/components/intro/lessons", () => ({
  hasIntroLessonContent(lessonId: string) {
    return sourceBoundary.available.has(lessonId);
  },
  loadIntroLessonContent(lessonId: string) {
    sourceBoundary.canonicalCalls.push(lessonId);
    const pending = sourceBoundary.pending.get(lessonId);
    if (!pending) throw new Error("Missing NEW synthetic canonical input");
    return pending;
  },
}));

// Real public provider/useLocale are retained. These private APIs must not enter.
vi.mock("@/lib/locale/locale-search", () => ({
  persistValidLocaleCookie() {
    sourceBoundary.cookieCalls += 1;
    throw new Error("Forbidden public setter/cookie persistence in this test");
  },
}));
vi.mock("@/lib/locale/resolve-public-locale", () => ({
  resolvePublicLocale() {
    sourceBoundary.unexpectedResolverCalls += 1;
    throw new Error("Explicit effective/initial UI must not enter private resolver");
  },
}));

// Unchanged presentation seam only. It exposes the REAL adapter's returned
// text/labels and genuine child UI context; it does not implement locale logic.
// No full IntroLessonRenderer/asset/framework behavior is certified by this seam.
vi.mock("@/components/intro/IntroLessonRenderer", async () => {
  const React = await import("react");
  const { useLocale } = await import("@/lib/locale/locale-context");
  const { getUiString } = await import("@/lib/locale/ui-strings");
  return {
    IntroLessonRenderer(props: RendererProps) {
      const ui = useLocale();
      sourceBoundary.renders.push({ props, ui: ui.locale });
      React.useEffect(() => {
        sourceBoundary.observerEffects.push({ phase: "presentation-observer-commit", ui: ui.locale });
        return () => { sourceBoundary.observerEffects.push({ phase: "presentation-observer-cleanup", ui: ui.locale }); };
      }, [props.content, ui.locale]);
      return (
        <section aria-label="unchanged renderer presentation seam">
          <p>{`Observed child UI: ${ui.locale}`}</p>
          <p>{`Observed child direction: ${ui.dir}`}</p>
          <h1>{props.lessonTitle}</h1>
          <a href="#synthetic-mission">{getUiString(ui.locale, "intro.mission.jumpCta")}</a>
          {props.content.map((section, index) => (
            <div key={index}>
              <h2>{section.title}</h2>
              {section.block.kind === "paragraphs" ? (
                <p>{section.block.paragraphs.join("\n")}</p>
              ) : section.block.kind === "mission" ? (
                <>
                  <p>{section.block.intro}</p>
                  <pre>{section.block.prompt}</pre>
                  <button>{section.block.buttonLabel}</button>
                  <p>{section.block.copiedLabel}</p>
                </>
              ) : null}
            </div>
          ))}
        </section>
      );
    },
  };
});

import * as React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { LOCALE_META } from "@/lib/locale/types";
import { LocalePackageLessonRenderer } from "@/components/locale/LocalePackageLessonRenderer";
import { adaptLocalizedPackageToIntroContent } from "@/lib/locale-lessons/adapt-localized-package-to-intro-content";

// These are NEW synthetic shape inputs, not real educational/answer material.
// Shape follows the approved pure mission source; all algorithms remain genuine.
// These fixtures carry no educational policy or release authority.
function syntheticPackage(
  locale: LessonPackageLocale,
  lessonId = "phase0-new-synthetic-lesson-a",
): LocalizedLessonPackage {
  return {
    locale,
    lessonId,
    canonicalVersion: "synthetic-version-not-released",
    title: "SYNTHETIC ORIGINAL PACKAGE TITLE",
    sourceFile: "synthetic-only-not-a-real-source-file",
    generatedAt: "synthetic-only-not-release-evidence",
    sections: [
      {
        role: "orientation",
        heading: "SYNTHETIC PACKAGE MATERIAL HEADING",
        contentMarkdown: "SYNTHETIC material e\u0301 العِلْم 漢字 👩‍💻",
        bullets: ["SYNTHETIC material e\u0301 العِلْم 漢字 👩‍💻"],
        tables: [],
      },
      {
        role: "mission",
        heading: "SYNTHETIC PACKAGE MISSION HEADING",
        contentMarkdown: "SYNTHETIC package mission body",
        bullets: [],
        tables: [],
        mission: {
          intro: "SYNTHETIC ORIGINAL MISSION INTRO",
          delivery: ["SYNTHETIC ORIGINAL DELIVERY A", "SYNTHETIC ORIGINAL DELIVERY B"],
          rubric: [
            {
              dimension: "SYNTHETIC CRITERION",
              weight: 100,
              criteria: "SYNTHETIC ORIGINAL CRITERIA — NOT EDUCATIONAL POLICY",
            },
          ],
        },
      },
    ],
  };
}

function missionBlock(content: IntroLessonContent) {
  const section = content.find((section) => section.block.kind === "mission");
  if (!section || section.block.kind !== "mission") {
    throw new Error("Genuine helper did not produce this NEW synthetic mission");
  }
  return section.block;
}

function materialWithoutTwoChromeFields(content: IntroLessonContent) {
  return content.map((section) => {
    if (section.block.kind !== "mission") return section;
    const { buttonLabel: _button, copiedLabel: _copied, ...material } = section.block;
    return { ...section, block: material };
  });
}

function deferredCanonical() {
  let resolve: (value: IntroLessonContent | null) => void = () => {
    throw new Error("Deferred fixture not initialized");
  };
  const promise = new Promise<IntroLessonContent | null>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

function page(pkg: LocalizedLessonPackage, uiLocale: SupportedLocale) {
  const initialLocale: SupportedLocale = uiLocale === "en" ? "ar-EG" : "en";
  return (
    <LocaleProvider initialLocale={initialLocale} effectiveLocale={uiLocale}>
      <LocalePackageLessonRenderer pkg={pkg} />
    </LocaleProvider>
  );
}

function lastRendered() {
  const rendered = sourceBoundary.renders.at(-1);
  if (!rendered) throw new Error("Actual changed wrapper did not reach renderer seam");
  return rendered;
}

function expectOriginalMaterial(pkg: LocalizedLessonPackage, content: IntroLessonContent) {
  const actual = missionBlock(content);
  expect(actual.lessonId).toBe(pkg.lessonId);
  expect(actual.missionId).toBe(`${pkg.lessonId}::mission`);
  expect(actual.intro).toBe("SYNTHETIC ORIGINAL MISSION INTRO");
  expect(actual.prompt).toBe("SYNTHETIC ORIGINAL DELIVERY A\n\nSYNTHETIC ORIGINAL DELIVERY B");
  expect(actual.rubric).toEqual([
    {
      label: "SYNTHETIC CRITERION",
      weight: 100,
      criteria: ["SYNTHETIC ORIGINAL CRITERIA — NOT EDUCATIONAL POLICY"],
    },
  ]);
  expect(lastRendered().props.lessonId).toBe(pkg.lessonId);
  expect(lastRendered().props.lessonTitle).toBe(pkg.title);
  expect(lastRendered().props.videoLocale).toBe(pkg.locale);
}

const ownUnhandled: Array<{ source: string; detail: string }> = [];
const ownRejection: NodeJS.UnhandledRejectionListener = (reason) => {
  ownUnhandled.push({ source: "process.unhandledRejection", detail: String(reason) });
};
const ownWindowError = (event: ErrorEvent) => {
  ownUnhandled.push({ source: "window.error", detail: event.message });
};
const ownWindowRejection = (event: PromiseRejectionEvent) => {
  ownUnhandled.push({ source: "window.unhandledrejection", detail: String(event.reason) });
};
let processListenersBefore = 0;
function sample(phase: string) {
  sourceBoundary.samples.push({ phase, domText: document.body.textContent ?? "",
    rendererCalls: sourceBoundary.renders.length, canonicalCalls: sourceBoundary.canonicalCalls.length });
}
beforeEach(() => {
  sourceBoundary.available.clear();
  sourceBoundary.pending.clear();
  sourceBoundary.canonicalCalls.length = 0;
  sourceBoundary.renders.length = 0;
  sourceBoundary.observerEffects.length = 0;
  sourceBoundary.samples.length = 0;
  sourceBoundary.cookieCalls = 0;
  sourceBoundary.unexpectedResolverCalls = 0;
  ownUnhandled.length = 0;
  processListenersBefore = process.listenerCount("unhandledRejection");
  process.on("unhandledRejection", ownRejection);
  window.addEventListener("error", ownWindowError);
  window.addEventListener("unhandledrejection", ownWindowRejection);
});

afterEach((context) => {
  try {
    sample("before-own-cleanup");
    cleanup();
    sample("after-own-cleanup");
    expect(sourceBoundary.cookieCalls).toBe(0);
    expect(sourceBoundary.unexpectedResolverCalls).toBe(0);
    expect(ownUnhandled).toEqual([]);
  } finally {
    process.removeListener("unhandledRejection", ownRejection);
    window.removeEventListener("error", ownWindowError);
    window.removeEventListener("unhandledrejection", ownWindowRejection);
    console.log("R61_ACTUAL_CASE_OBSERVATIONS " + JSON.stringify({
      caseName: context.task.name,
      node: { execPath: process.execPath, version: process.version, versions: process.versions },
      rendered: sourceBoundary.renders,
      observerEffects: sourceBoundary.observerEffects,
      effectScope: "Only real React presentation-observer commits/cleanups; wrapper/provider internal effects are not counted",
      samples: sourceBoundary.samples, canonicalCalls: sourceBoundary.canonicalCalls,
      cookieCalls: sourceBoundary.cookieCalls, privateResolverCalls: sourceBoundary.unexpectedResolverCalls,
      unhandled: ownUnhandled, processListenersBefore,
      processListenersAfter: process.listenerCount("unhandledRejection"),
      listenerScope: "Only own listeners added/removed; no suppression, preventDefault, reset or pre-existing listener removal"
    }));
  }
});

// Exact C0-approved scalar values, independently fixed expected text; no fake lookup.
type UiChromeKey =
  | "learn.loading.access"
  | "mission.copy.cta"
  | "mission.copy.done"
  | "intro.mission.jumpCta";
const EXPECTED_UI = {
  "ar-EG": {
    "learn.loading.access": "جاري تحميل حالة الوصول للخطوة...",
    "mission.copy.cta": "انسخ خطوات المهمة",
    "mission.copy.done": "اتنسخت ✓",
    "intro.mission.jumpCta": "روح للمهمة ↓"
  },
  "ar-MSA": {
    "learn.loading.access": "جارٍ تحميل حالة الوصول إلى الخطوة...",
    "mission.copy.cta": "انسخ خطوات المهمة",
    "mission.copy.done": "تم النسخ ✓",
    "intro.mission.jumpCta": "انتقل إلى المهمة ↓"
  },
  "ar-Gulf": {
    "learn.loading.access": "جاري تحميل حالة الوصول للخطوة...",
    "mission.copy.cta": "انسخ خطوات المهمة",
    "mission.copy.done": "اننسخ ✓",
    "intro.mission.jumpCta": "روح للمهمة ↓"
  },
  "en": {
    "learn.loading.access": "Loading step access…",
    "mission.copy.cta": "Copy mission steps",
    "mission.copy.done": "Copied ✓",
    "intro.mission.jumpCta": "Go to mission ↓"
  }
} satisfies Readonly<Record<SupportedLocale, Readonly<Record<UiChromeKey, string>>>>;

const UI_MATERIAL_PAIRS: ReadonlyArray<{
  ui: SupportedLocale;
  material: LessonPackageLocale;
}> = [
  { ui: "ar-EG", material: "en" },
  { ui: "ar-MSA", material: "ar-Gulf" },
  { ui: "ar-Gulf", material: "en" },
  { ui: "en", material: "ar-MSA" },
];

describe("NEW functional outer UI / package material separation", () => {
  it.each(UI_MATERIAL_PAIRS)(
    "loading uses genuine UI $ui while selected material remains $material",
    ({ ui, material }) => {
      const pkg = syntheticPackage(material);
      const pending = deferredCanonical();
      sourceBoundary.available.add(pkg.lessonId);
      sourceBoundary.pending.set(pkg.lessonId, pending.promise);
      render(page(pkg, ui));
      // Actual selected public dictionary values are independently fixed above.
      expect(screen.getByText(EXPECTED_UI[ui]["learn.loading.access"])).toBeTruthy();
      expect(sourceBoundary.canonicalCalls).toEqual([pkg.lessonId]);
      expect(sourceBoundary.renders).toHaveLength(0);
      sample("loading-observed");
    },
  );

  it.each(UI_MATERIAL_PAIRS)(
    "package-only returned mission chrome follows UI $ui, not material $material",
    async ({ ui, material }) => {
      const pkg = syntheticPackage(material);
      render(page(pkg, ui));
      await screen.findByText(`Observed child UI: ${ui}`);
      expect(screen.getByText(`Observed child direction: ${LOCALE_META[ui].dir}`)).toBeTruthy();
      expect(screen.getByRole("button", { name: EXPECTED_UI[ui]["mission.copy.cta"] })).toBeTruthy();
      expect(screen.getByText(EXPECTED_UI[ui]["mission.copy.done"])).toBeTruthy();
      expect(screen.getByRole("link", { name: EXPECTED_UI[ui]["intro.mission.jumpCta"] })).toBeTruthy();
      sample("package-only-observed");
      expect(sourceBoundary.canonicalCalls).toHaveLength(0);
      const actual = lastRendered().props.content;
      expectOriginalMaterial(pkg, actual);
      const legacyDefault = adaptLocalizedPackageToIntroContent(pkg, null);
      expect(materialWithoutTwoChromeFields(actual)).toEqual(
        materialWithoutTwoChromeFields(legacyDefault),
      );
      expect(missionBlock(actual).buttonLabel).toBe(EXPECTED_UI[ui]["mission.copy.cta"]);
      expect(missionBlock(actual).copiedLabel).toBe(EXPECTED_UI[ui]["mission.copy.done"]);
    },
  );

  it("canonical overlay uses the real adapter and retains package IDs/material", async () => {
    const pkg = syntheticPackage("en");
    const pending = deferredCanonical();
    sourceBoundary.available.add(pkg.lessonId);
    sourceBoundary.pending.set(pkg.lessonId, pending.promise);
    render(page(pkg, "ar-MSA"));
    expect(screen.getByText(EXPECTED_UI["ar-MSA"]["learn.loading.access"])).toBeTruthy();
    sample("before-canonical-resolution");
    const canonical = adaptLocalizedPackageToIntroContent(pkg, null);
    await act(async () => { pending.resolve(canonical); });
    await screen.findByText("Observed child UI: ar-MSA");
    sample("ar-MSA-rendered");
    expect(sourceBoundary.canonicalCalls).toEqual([pkg.lessonId]);
    const actual = lastRendered().props.content;
    const expectedMaterial = adaptLocalizedPackageToIntroContent(pkg, canonical);
    expect(materialWithoutTwoChromeFields(actual)).toEqual(
      materialWithoutTwoChromeFields(expectedMaterial),
    );
    expectOriginalMaterial(pkg, actual);
    expect(screen.getByRole("button", { name: EXPECTED_UI["ar-MSA"]["mission.copy.cta"] })).toBeTruthy();
  });

  it("resolved null canonical is package-only, not a new language fallback", async () => {
    const pkg = syntheticPackage("ar-MSA");
    const pending = deferredCanonical();
    sourceBoundary.available.add(pkg.lessonId);
    sourceBoundary.pending.set(pkg.lessonId, pending.promise);
    render(page(pkg, "en"));
    await act(async () => { pending.resolve(null); });
    await screen.findByText("Observed child UI: en");
    expectOriginalMaterial(pkg, lastRendered().props.content);
    expect(screen.getByRole("button", { name: EXPECTED_UI["en"]["mission.copy.cta"] })).toBeTruthy();
  });

  it("same package UI switch updates both mission labels without reloading canonical", async () => {
    const pkg = syntheticPackage("en");
    const pending = deferredCanonical();
    sourceBoundary.available.add(pkg.lessonId);
    sourceBoundary.pending.set(pkg.lessonId, pending.promise);
    const view = render(page(pkg, "ar-EG"));
    sample("before-canonical-resolution");
    const canonical = adaptLocalizedPackageToIntroContent(pkg, null);
    await act(async () => { pending.resolve(canonical); });
    await screen.findByText("Observed child UI: ar-EG");
    sample("before-same-package-UI-switch");
    const originalMaterial = materialWithoutTwoChromeFields(lastRendered().props.content);
    view.rerender(page(pkg, "en"));
    sample("after-UI-rerender");
    await screen.findByText("Observed child UI: en");
    expect(screen.getByRole("button", { name: EXPECTED_UI["en"]["mission.copy.cta"] })).toBeTruthy();
    expect(screen.getByText(EXPECTED_UI["en"]["mission.copy.done"])).toBeTruthy();
    expect(screen.getByRole("link", { name: EXPECTED_UI["en"]["intro.mission.jumpCta"] })).toBeTruthy();
    sample("after-same-package-UI-switch");
    expect(materialWithoutTwoChromeFields(lastRendered().props.content)).toEqual(originalMaterial);
    expectOriginalMaterial(pkg, lastRendered().props.content);
    expect(sourceBoundary.canonicalCalls).toEqual([pkg.lessonId]);
  });

  it("same package pending UI switch changes loading copy without a second canonical request", () => {
    const pkg = syntheticPackage("en");
    const pending = deferredCanonical();
    sourceBoundary.available.add(pkg.lessonId);
    sourceBoundary.pending.set(pkg.lessonId, pending.promise);
    const view = render(page(pkg, "ar-MSA"));
    view.rerender(page(pkg, "en"));
    sample("after-UI-rerender");
    expect(screen.getByText(EXPECTED_UI["en"]["learn.loading.access"])).toBeTruthy();
    expect(sourceBoundary.canonicalCalls).toEqual([pkg.lessonId]);
    expect(sourceBoundary.renders).toHaveLength(0);
  });

  it("omitted or explicit undefined adapter UI keeps original package UI behavior", () => {
    const pkg = syntheticPackage("ar-MSA");
    const omitted = adaptLocalizedPackageToIntroContent(pkg, null);
    const explicitUndefined = adaptLocalizedPackageToIntroContent(pkg, null, undefined);
    expect(explicitUndefined).toEqual(omitted);
    expect(missionBlock(omitted).buttonLabel).toBe(EXPECTED_UI[pkg.locale]["mission.copy.cta"]);
    expect(missionBlock(omitted).copiedLabel).toBe(EXPECTED_UI[pkg.locale]["mission.copy.done"]);
  });

  it("real public provider effective/initial transition reaches child without setter/cookie calls", async () => {
    const pkg = syntheticPackage("en");
    const view = render(
      <LocaleProvider initialLocale="ar-Gulf" effectiveLocale="ar-MSA">
        <LocalePackageLessonRenderer pkg={pkg} />
      </LocaleProvider>,
    );
    await screen.findByText("Observed child UI: ar-MSA");
    sample("ar-MSA-rendered");
    view.rerender(
      <LocaleProvider initialLocale="ar-Gulf">
        <LocalePackageLessonRenderer pkg={pkg} />
      </LocaleProvider>,
    );
    await screen.findByText("Observed child UI: ar-Gulf");
    expect(screen.getByRole("button", { name: EXPECTED_UI["ar-Gulf"]["mission.copy.cta"] })).toBeTruthy();
    expect(screen.getByText(EXPECTED_UI["ar-Gulf"]["mission.copy.done"])).toBeTruthy();
    expectOriginalMaterial(pkg, lastRendered().props.content);
    // Manual non-null state is NOT seeded; public setter is deliberately uncalled.
  });

  it("unmount cancels an already requested canonical continuation", async () => {
    const pkg = syntheticPackage("en");
    const pending = deferredCanonical();
    sourceBoundary.available.add(pkg.lessonId);
    sourceBoundary.pending.set(pkg.lessonId, pending.promise);
    const view = render(page(pkg, "ar-EG"));
    const before = sourceBoundary.renders.length;
    sample("before-explicit-unmount");
    view.unmount();
    sample("after-explicit-unmount-before-resolution");
    await act(async () => { pending.resolve(adaptLocalizedPackageToIntroContent(pkg, null)); });
    sample("after-unmounted-canonical-resolution");
    expect(sourceBoundary.renders).toHaveLength(before);
    expect(sourceBoundary.canonicalCalls).toEqual([pkg.lessonId]);
  });
});
