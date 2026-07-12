import { test, expect } from "bun:test";
import {
  brandTaglineLabel,
  conceptBadgeLabel,
  isLtrPresentationLocale,
  presentationChrome,
  presentationDirection,
  presentationTextAlign,
} from "./src/lesson-cards/presentationChrome";
import {
  resolvePresentationLocale,
  type SceneData,
} from "./src/lesson-cards/types";

const arabicMarkers = ["مصطلح", "رحلتك تبدأ من هنا"] as const;

test("en has English chrome labels and no Arabic template text", () => {
  expect(conceptBadgeLabel("en")).toBe("Term");
  expect(brandTaglineLabel("en")).toBe("Your journey starts here");
  expect(isLtrPresentationLocale("en")).toBe(true);
  expect(presentationDirection("en")).toBe("ltr");
  expect(presentationTextAlign("en")).toBe("left");

  const chrome = `${conceptBadgeLabel("en")} ${brandTaglineLabel("en")}`;
  for (const marker of arabicMarkers) {
    expect(chrome.includes(marker)).toBe(false);
  }
  expect(presentationChrome.conceptBadge.en).not.toMatch(/[\u0600-\u06FF]/);
  expect(presentationChrome.brandTagline.en).not.toMatch(/[\u0600-\u06FF]/);
});

test("undefined legacy locale preserves Arabic chrome and RTL", () => {
  expect(conceptBadgeLabel(undefined)).toBe("مصطلح");
  expect(brandTaglineLabel(undefined)).toBe("رحلتك تبدأ من هنا");
  expect(isLtrPresentationLocale(undefined)).toBe(false);
  expect(presentationDirection(undefined)).toBe("rtl");
  expect(presentationTextAlign(undefined)).toBe("right");
});

test("ar-MSA and ar-Gulf preserve Arabic chrome and RTL", () => {
  for (const locale of ["ar-MSA", "ar-Gulf"] as const) {
    expect(conceptBadgeLabel(locale)).toBe("مصطلح");
    expect(brandTaglineLabel(locale)).toBe("رحلتك تبدأ من هنا");
    expect(isLtrPresentationLocale(locale)).toBe(false);
    expect(presentationDirection(locale)).toBe("rtl");
    expect(presentationTextAlign(locale)).toBe("right");
  }
});

test("resolvePresentationLocale prefers prop then stamped scene locale", () => {
  const legacy: SceneData[] = [
    {
      card: "ConceptCard",
      accent: "lavender",
      term: "AI",
      definition: "def",
      tag: "t",
    },
  ];
  expect(resolvePresentationLocale(legacy)).toBeUndefined();

  const stamped: SceneData[] = [
    {
      card: "ConceptCard",
      accent: "lavender",
      term: "AI",
      definition: "def",
      tag: "t",
      locale: "en",
    },
  ];
  expect(resolvePresentationLocale(stamped)).toBe("en");
  expect(resolvePresentationLocale(stamped, "ar-MSA")).toBe("ar-MSA");
});
