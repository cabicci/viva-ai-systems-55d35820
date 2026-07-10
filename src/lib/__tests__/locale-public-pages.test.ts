import { describe, expect, it } from "vitest";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  PRICING_UI_KEYS,
  PRIVACY_UI_KEYS,
  PUBLIC_META_UI_KEYS,
  TERMS_UI_KEYS,
} from "@/lib/locale/public-ui-keys";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { validateLocaleLeakScan } from "../../../scripts/locale-lessons/lib/validate-locale-leak-scan-core.ts";

const ARABIC = /[\u0600-\u06FF]/;
const EGYPTIAN_MARKERS = /(أيوه|دلوقتي|مفيش|هيتفعّل|لسه|هنعلن|بتاخدك)/;

function metaTitle(meta: ReturnType<typeof buildLocalizedPublicMeta>["meta"]): string {
  return meta.find((tag) => "title" in tag)?.title ?? "";
}

function metaDescription(meta: ReturnType<typeof buildLocalizedPublicMeta>["meta"]): string {
  const tag = meta.find(
    (entry): entry is { name: string; content: string } =>
      "name" in entry && entry.name === "description",
  );
  return tag?.content ?? "";
}

describe("public page locale (pricing, terms, privacy, home, login, root)", () => {
  it("serves all public meta keys for four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of PUBLIC_META_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("serves pricing, terms, and privacy body keys for four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of [...PRICING_UI_KEYS, ...TERMS_UI_KEYS, ...PRIVACY_UI_KEYS]) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("returns English pricing meta without Arabic", () => {
    const { meta } = buildLocalizedPublicMeta("en", "pricing");
    const blob = JSON.stringify(meta);
    expect(blob).not.toMatch(ARABIC);
    expect(metaTitle(meta)).toContain("Plans");
  });

  it("returns English terms and privacy meta without Arabic", () => {
    for (const kind of ["terms", "privacy"] as const) {
      const { meta } = buildLocalizedPublicMeta("en", kind);
      expect(JSON.stringify(meta), kind).not.toMatch(ARABIC);
    }
    expect(metaTitle(buildLocalizedPublicMeta("en", "terms").meta)).toContain("Terms");
    expect(metaTitle(buildLocalizedPublicMeta("en", "privacy").meta)).toContain("Privacy");
  });

  it("returns English home and login meta without Arabic", () => {
    for (const kind of ["home", "login", "root"] as const) {
      const { meta } = buildLocalizedPublicMeta("en", kind);
      expect(JSON.stringify(meta), kind).not.toMatch(ARABIC);
    }
  });

  it("keeps ar-MSA pricing copy formal without Egyptian leakage markers", () => {
    for (const key of PRICING_UI_KEYS) {
      const value = getUiString("ar-MSA", key);
      expect(value, key).not.toMatch(EGYPTIAN_MARKERS);
    }
    const { meta } = buildLocalizedPublicMeta("ar-MSA", "pricing");
    expect(metaTitle(meta)).toMatch(ARABIC);
    expect(metaTitle(meta)).not.toMatch(EGYPTIAN_MARKERS);
  });

  it("keeps ar-MSA privacy copy formal without Egyptian leakage markers", () => {
    for (const key of PRIVACY_UI_KEYS) {
      const value = getUiString("ar-MSA", key);
      expect(value, key).not.toMatch(EGYPTIAN_MARKERS);
    }
  });

  it("keeps ar-Gulf pricing copy distinct from ar-MSA hero title", () => {
    const msaHero = getUiString("ar-MSA", "pricing.hero.title");
    const gulfHero = getUiString("ar-Gulf", "pricing.hero.title");
    expect(gulfHero).not.toBe(msaHero);
    expect(gulfHero).toMatch(ARABIC);
  });

  it("includes og and twitter tags for public routes", () => {
    for (const kind of ["pricing", "privacy"] as const) {
      const { meta } = buildLocalizedPublicMeta("en", kind);
      expect(meta.some((tag) => "property" in tag && tag.property === "og:title")).toBe(
        true,
      );
      expect(meta.some((tag) => "name" in tag && tag.name === "twitter:title")).toBe(
        true,
      );
      expect(metaDescription(meta).length).toBeGreaterThan(0);
    }
  });

  it("passes locale leak scan after public page wiring", () => {
    const result = validateLocaleLeakScan();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
