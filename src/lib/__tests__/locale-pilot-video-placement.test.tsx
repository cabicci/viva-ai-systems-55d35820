import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderLocalizedLesson } from "@/lib/__tests__/locale-test-utils";
import {
  BUNNY_LIBRARY_ID,
  getBunnyEmbedUrl,
  getBunnyEmbedUrlForLocale,
  getBunnyGuidForLocale,
  getLocalizedBunnyEmbedUrl,
  getLocalizedBunnyGuid,
} from "@/lib/bunny-videos";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

import { PILOT_VIDEO_CELLS } from "@/lib/__tests__/locale-pilot-video-cells";

function readLocalizedPackage(
  locale: SupportedLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function compositeKey(lessonId: string, locale: SupportedLocale): string {
  return `${lessonId}__${locale}`;
}

function expectActiveRegistryMapping(lessonId: string, locale: SupportedLocale) {
  const activeGuid = getLocalizedBunnyGuid(lessonId, locale);
  expect(activeGuid, compositeKey(lessonId, locale)).toBeDefined();
  expect(activeGuid).toMatch(UUID_RE);

  const embed = getLocalizedBunnyEmbedUrl(lessonId, locale);
  expect(embed).toBe(
    `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${activeGuid}?autoplay=false&preload=true`,
  );
  expect(getBunnyGuidForLocale(lessonId, locale)).toBe(activeGuid);
}

describe("PILOT_VIDEO_CELLS historical inventory", () => {
  it("preserves exactly six historical pilot GUID entries for audit", () => {
    expect(PILOT_VIDEO_CELLS).toHaveLength(6);
    for (const cell of PILOT_VIDEO_CELLS) {
      expect(cell.historicalPilotGuid).toMatch(UUID_RE);
    }
    expect(PILOT_VIDEO_CELLS.map((cell) => cell.historicalPilotGuid)).toEqual([
      "ec795bb3-018d-4642-908a-ec86a842175f",
      "5c44ca7d-814a-4eea-a03a-81692942458f",
      "7a08de3d-6997-412e-834e-54906b65896f",
      "1b6a5491-8e93-4ed6-b3a8-08744cd26546",
      "4eec6df1-cc3f-4d68-ab65-13361880bcfd",
      "0605d5f9-623f-4b90-9a43-307e1fcdd8e7",
    ]);
  });

  it("is not imported by production runtime video resolution components", () => {
    const runtimeFiles = [
      "src/components/locale/LocaleLessonVideo.tsx",
      "src/components/locale/LocaleLiveSafetyMarkers.tsx",
      "src/components/intro/IntroLessonRenderer.tsx",
    ];
    for (const rel of runtimeFiles) {
      const source = readFileSync(path.join(REPO_ROOT, rel), "utf8");
      expect(source).not.toContain("locale-pilot-video-cells");
      expect(source).not.toContain("PILOT_VIDEO_CELLS");
    }
  });
});

describe("locale pilot video placement matrix", () => {
  for (const cell of PILOT_VIDEO_CELLS) {
    describe(`${cell.lessonId} | ${cell.locale}`, () => {
      it("resolves active composite registry mapping independently of historical pilot GUID", () => {
        expectActiveRegistryMapping(cell.lessonId, cell.locale);
      });

      it("renders Bunny player instead of coming-soon placeholder", async () => {
        const pkg = readLocalizedPackage(cell.locale, cell.lessonId);
        const { container } = await renderLocalizedLesson(pkg);

        expect(container.querySelector('[data-locale-video="player"]')).not.toBeNull();
        expect(container.querySelector('[data-locale-video="placeholder"]')).toBeNull();
        expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
          getLocalizedBunnyEmbedUrl(cell.lessonId, cell.locale),
        );
      });
    });
  }

  it("legacy Egyptian fallback uses plain lessonId when locale is omitted", () => {
    const lessonId = "intro-m1-l4-ai-can-cannot";
    const legacyGuid = "b139cfa2-e80e-4dd6-ab6d-e79ed8d34522";

    expect(getBunnyGuidForLocale(lessonId, undefined)).toBe(legacyGuid);
    expect(getBunnyEmbedUrlForLocale(lessonId, undefined)).toBe(
      getBunnyEmbedUrl(lessonId),
    );
    expect(getBunnyGuidForLocale(lessonId, "ar-EG")).toBe(legacyGuid);
  });

  it("resolves the finalized intro-m1-l1-what-is-ai English composite mapping", async () => {
    const lessonId = "intro-m1-l1-what-is-ai";
    const exactGuid = "de6aa7f5-a863-46e3-86ca-3da9489ae601";

    expect(compositeKey(lessonId, "en")).toBe("intro-m1-l1-what-is-ai__en");
    expect(getLocalizedBunnyGuid(lessonId, "en")).toBe(exactGuid);
    expect(getBunnyGuidForLocale(lessonId, "en")).toBe(exactGuid);
    expect(getLocalizedBunnyEmbedUrl(lessonId, "en")).toBe(
      `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${exactGuid}?autoplay=false&preload=true`,
    );

    const pkg = readLocalizedPackage("en", lessonId);
    const { container } = await renderLocalizedLesson(pkg);

    expect(container.querySelector('[data-locale-video="player"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-video="placeholder"]')).toBeNull();
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      getLocalizedBunnyEmbedUrl(lessonId, "en"),
    );
  });
});
