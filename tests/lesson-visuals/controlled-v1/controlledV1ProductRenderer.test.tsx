import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayCircle } from "lucide-react";
import { fireEvent, render } from "@testing-library/react";
import { GalleryGrid } from "../../../src/components/image-gallery/GalleryGrid";
import { IntroLessonRenderer } from "../../../src/components/intro/IntroLessonRenderer";
import type { IntroLessonContent } from "../../../src/components/intro/intro-lesson-types";
import {
  getControlledV1BrowserManifestEntries,
  resolveControlledV1Visual,
  setControlledV1AssetUrlMapForTests,
} from "../../../src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserResolver";
import { getContextualV2BrowserManifestEntries } from "../../../src/lib/lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver";
import { LocaleProvider } from "../../../src/lib/locale/locale-context";
import type { SupportedLocale } from "../../../src/lib/locale/types";
import { IMAGE_GALLERY } from "../../../src/lib/image-gallery-registry";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to?: string }) => (
    <a href={typeof to === "string" ? to : "#"} {...props}>
      {children}
    </a>
  ),
  createLink: (component: unknown) => component,
}));

afterEach(() => setControlledV1AssetUrlMapForTests(null));

const lessonId = "creator-m2-l1-know-audience";
const contentWithLegacyVisual: IntroLessonContent = [
  {
    icon: PlayCircle,
    eyebrow: "Diagram",
    title: "Audience",
    block: {
      kind: "diagram",
      id: "audience-persona",
      caption: "Audience flow",
      label: "Diagram",
    },
  },
];

const contentWithoutLegacyVisual: IntroLessonContent = [
  {
    icon: PlayCircle,
    eyebrow: "Core idea",
    title: "A complete lesson without a legacy visual block",
    block: { kind: "paragraphs", paragraphs: ["Preserved lesson copy."] },
  },
];

describe("contextual-v2 product wiring with controlled-v1 archive preserved", () => {
  it("mounts exactly one contextual image for all 100 lessons in all four locales", () => {
    const entries = getContextualV2BrowserManifestEntries();
    expect(entries).toHaveLength(400);
    expect(
      new Set(entries.map((entry) => entry.lessonId)).has(
        "builder-m5-l5-mini-win",
      ),
    ).toBe(true);
    expect(
      new Set(entries.map((entry) => entry.lessonId)).has(
        "creator-m4-repurposing",
      ),
    ).toBe(true);

    for (const entry of entries) {
      const { container, unmount } = render(
        <LocaleProvider effectiveLocale={entry.locale}>
          <IntroLessonRenderer
            content={contentWithoutLegacyVisual}
            lessonId={entry.lessonId}
            videoLocale={entry.locale}
          />
        </LocaleProvider>,
      );
      const images = container.querySelectorAll("img[data-contextual-v2-img='1']");
      expect(images, entry.cellId).toHaveLength(1);
      expect(images[0].getAttribute("src"), entry.cellId).toBe(entry.publicPath);
      expect(images[0].getAttribute("loading")).toBe("lazy");
      expect(images[0].getAttribute("decoding")).toBe("async");
      expect(
        images[0]
          .closest("figure")
          ?.getAttribute("data-contextual-v2-source-type"),
        entry.cellId,
      ).toBe(entry.sourceType);
      expect(images[0].closest("section"), entry.cellId).not.toBeNull();
      expect(
        container.querySelector("[data-contextual-v2-manifest-title]"),
        entry.cellId,
      ).toBeNull();
      expect(container.textContent?.split(entry.title)).toHaveLength(2);
      expect(container.querySelector("[data-controlled-v1]")).toBeNull();
      expect(container.querySelector('[data-locale-diagram="placeholder"]')).toBeNull();
      expect(container.innerHTML).not.toContain("/assets/lessons/");
      expect(container.innerHTML).not.toContain("controlled-v1");
      unmount();
    }
  });

  it("replaces one legacy visual slot without losing its localized section copy", () => {
    const { container, getByText } = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={contentWithLegacyVisual}
          lessonId={lessonId}
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(container.querySelectorAll("img[data-contextual-v2-img='1']")).toHaveLength(1);
    expect(getByText("Diagram")).toBeTruthy();
    expect(getByText("Audience")).toBeTruthy();
    expect(getByText("Audience flow")).toBeTruthy();
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(container.querySelector("[data-contextual-v2-type-label]"))
      .toHaveTextContent("Lesson visual");
    expect(container.querySelector("[data-contextual-v2-manifest-title]"))
      .toHaveTextContent("Know Your Audience");
  });

  it("keeps optional-ID direct screenshot content usable without activating a legacy resolver", () => {
    const directContent: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "Reference",
        title: "Direct component visual",
        block: {
          kind: "screenshot",
          src: "/component-owned-reference.png",
          alt: "Component reference",
          caption: "Reference caption",
        },
      },
    ];
    const { container, getByText } = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer content={directContent} />
      </LocaleProvider>,
    );
    expect(container.querySelector("[data-contextual-v2-img]")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/component-owned-reference.png",
    );
    expect(getByText("Reference caption")).toBeTruthy();
  });

  it("fails closed for an unknown provided lesson ID and does not mount the old src", () => {
    const directContent: IntroLessonContent = [
      {
        icon: PlayCircle,
        eyebrow: "Reference",
        title: "Unknown lesson visual",
        block: {
          kind: "screenshot",
          src: "/assets/lessons/legacy-should-not-load.jpg",
          caption: "Preserved supporting caption",
        },
      },
    ];
    const { container, getByText } = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={directContent}
          lessonId="not-in-contextual-manifest"
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-contextual-v2-error]")).toHaveAttribute(
      "data-contextual-v2-error",
      "missing_lesson",
    );
    expect(container.innerHTML).not.toContain("legacy-should-not-load");
    expect(getByText("Preserved supporting caption")).toBeTruthy();
  });

  it("localizes gallery controls in every supported locale", () => {
    const expected = {
      "ar-EG": { enlarge: "كبّر الصورة", close: "إغلاق", cta: "افتح الدرس ←" },
      "ar-MSA": { enlarge: "تكبير الصورة", close: "إغلاق", cta: "افتح الدرس ←" },
      "ar-Gulf": { enlarge: "كبّر الصورة", close: "إغلاق", cta: "افتح الدرس ←" },
      en: { enlarge: "Enlarge image", close: "Close", cta: "Open lesson →" },
    } as const;
    const item = IMAGE_GALLERY[0];
    expect(item).toBeDefined();
    if (!item) return;

    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const { getByLabelText, getByText, unmount } = render(
        <LocaleProvider effectiveLocale={locale}>
          <GalleryGrid items={[item]} />
        </LocaleProvider>,
      );
      expect(getByLabelText(expected[locale].enlarge)).toBeTruthy();
      expect(getByText(expected[locale].cta)).toBeTruthy();
      expect(
        getByLabelText(
          `${locale === "en" ? "Open lesson" : "افتح درس"} ${item.titles[locale]}`,
        ),
      ).toBeTruthy();
      fireEvent.click(getByLabelText(expected[locale].enlarge));
      expect(getByText(`${expected[locale].close} ✕`)).toBeTruthy();
      unmount();
    }
  });

  it("keeps the frozen controlled-v1 resolver independently available", () => {
    const entry = getControlledV1BrowserManifestEntries().find(
      (candidate) =>
        candidate.lessonId === "builder-m7-l1-tables-columns" &&
        candidate.locale === "ar-EG",
    );
    expect(entry).toBeDefined();
    if (!entry) return;
    setControlledV1AssetUrlMapForTests({ [entry.assetKey]: "archive://accepted" });
    const archived = resolveControlledV1Visual({
      lessonId: "builder-m7-l1-tables-columns",
      locale: "ar-EG",
      expectedMethod: "A",
    });
    expect(archived).toMatchObject({
      ok: true,
      lessonId: "builder-m7-l1-tables-columns",
      locale: "ar-EG",
      method: "A",
      url: "archive://accepted",
    });
  });
});
