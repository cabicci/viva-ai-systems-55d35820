import { afterEach, describe, expect, it, vi } from "vitest";
import { PlayCircle } from "lucide-react";
import { render } from "@testing-library/react";
import { IntroLessonRenderer } from "../../../src/components/intro/IntroLessonRenderer";
import type { IntroLessonContent } from "../../../src/components/intro/intro-lesson-types";
import {
  getControlledV1BrowserManifestEntries,
  setControlledV1AssetUrlMapForTests,
} from "../../../src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserResolver";
import { LocaleProvider } from "../../../src/lib/locale/locale-context";
import type { SupportedLocale } from "../../../src/lib/locale/types";

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
  setControlledV1AssetUrlMapForTests(null);
});

function injectAllUrls(): void {
  const map: Record<string, string> = {};
  for (const e of getControlledV1BrowserManifestEntries()) {
    map[e.assetKey] = `https://test.local/controlled-v1/${e.cellId}.png`;
  }
  setControlledV1AssetUrlMapForTests(map);
}

function screenshotContent(): IntroLessonContent {
  return [
    {
      icon: PlayCircle,
      eyebrow: "Capture",
      title: "Tables",
      block: {
        kind: "screenshot",
        src: "/legacy-should-not-win.jpg",
        label: "Capture",
        caption: "Accepted Method A visual",
        alt: "tables columns",
      },
    },
  ];
}

function diagramContent(): IntroLessonContent {
  return [
    {
      icon: PlayCircle,
      eyebrow: "Diagram",
      title: "Prompt",
      block: {
        kind: "diagram",
        id: "audience-persona",
        caption: "Accepted Method C visual",
        label: "Diagram",
      },
    },
  ];
}

describe("Product controlled-v1 screenshot/diagram wiring", () => {
  it("screenshot case mounts <img> for Method A representative in four locales", () => {
    injectAllUrls();
    const lessonId = "builder-m7-l1-tables-columns";
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[]) {
      const { container, unmount } = render(
        <LocaleProvider effectiveLocale={locale}>
          <IntroLessonRenderer
            content={screenshotContent()}
            lessonId={lessonId}
            videoLocale={locale}
          />
        </LocaleProvider>,
      );
      const img = container.querySelector("img[data-controlled-v1-img='1']");
      expect(img, locale).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        `https://test.local/controlled-v1/${lessonId}__${locale}.png`,
      );
      expect(container.querySelector('[data-locale-screenshot="placeholder"]')).toBeNull();
      expect(container.querySelector("[data-controlled-v1='screenshot']")).not.toBeNull();
      unmount();
    }
  });

  it("diagram case mounts <img> for Method C representative in four locales", () => {
    injectAllUrls();
    const lessonId = "builder-m6-l3-first-prompt-to-lovable";
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as SupportedLocale[]) {
      const { container, unmount } = render(
        <LocaleProvider effectiveLocale={locale}>
          <IntroLessonRenderer
            content={diagramContent()}
            lessonId={lessonId}
            videoLocale={locale}
          />
        </LocaleProvider>,
      );
      const img = container.querySelector("img[data-controlled-v1-img='1']");
      expect(img, locale).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        `https://test.local/controlled-v1/${lessonId}__${locale}.png`,
      );
      expect(container.querySelector('[data-locale-diagram="placeholder"]')).toBeNull();
      expect(container.querySelector("[data-controlled-v1='diagram']")).not.toBeNull();
      expect(container.querySelector("[data-controlled-v1-method='C']")).not.toBeNull();
      unmount();
    }
  });

  it("accepted cell does not render placeholder DOM when asset URL is present", () => {
    injectAllUrls();
    const { container } = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={screenshotContent()}
          lessonId="builder-m7-l1-tables-columns"
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(container.querySelector('[data-locale-screenshot="placeholder"]')).toBeNull();
    expect(container.querySelector('[data-locale-screenshot="fail-closed"]')).toBeNull();
    expect(container.querySelector("img[data-controlled-v1-img='1']")).not.toBeNull();
  });

  it("missing emitted asset fails closed without legacy screenshot src", () => {
    setControlledV1AssetUrlMapForTests({});
    const { container } = render(
      <LocaleProvider effectiveLocale="en">
        <IntroLessonRenderer
          content={screenshotContent()}
          lessonId="builder-m7-l1-tables-columns"
          videoLocale="en"
        />
      </LocaleProvider>,
    );
    expect(container.querySelector('[data-locale-screenshot="fail-closed"]')).not.toBeNull();
    expect(container.querySelector('img[src="/legacy-should-not-win.jpg"]')).toBeNull();
    expect(container.querySelector('[data-locale-screenshot="placeholder"]')).toBeNull();
  });
});
