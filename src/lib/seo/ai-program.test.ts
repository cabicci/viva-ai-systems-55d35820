import { describe, expect, it } from "vitest";
import type { CurriculumSummary } from "@/lib/course-system/intake/client";
import { aiProgramSeo, aiProgramSitemap, programSearch } from "./ai-program";

const course: CurriculumSummary = {
  id: "ai-store-studio",
  area: "ai",
  version: "v1",
  title: "Build an online store",
  stations: [
    { id: "shopify", title: "Shopify", steps: [{ id: "brief", title: "Prepare the brief" }] },
  ],
};

describe("public programme identity", () => {
  it("uses the clean course URL for sharing even when a campaign enters with UTM", () => {
    const params = programSearch({
      locale: "en",
      utm_campaign: "store_launch",
      utm_source: "facebook",
      email: "x",
      lesson: "private",
    });
    expect(params).toEqual({ locale: "en", utm_campaign: "store_launch", utm_source: "facebook" });
    expect(aiProgramSeo(course, "en").url).toBe("https://masaarat.ai/programs/ai/ai-store-studio");
    expect(aiProgramSeo(course, "en").description).toContain("WooCommerce");
  });
  it("emits unique clean URLs for valid active AI catalogue entries", () => {
    const xml = aiProgramSitemap([
      course,
      course,
      { ...course, area: "kids" },
      { ...course, id: "x<&" },
    ]);
    expect(xml.match(/<loc>/g)).toHaveLength(1);
    expect(xml).not.toContain("lesson=");
    expect(xml).not.toContain("x<&");
    expect(aiProgramSitemap([])).not.toContain("<loc>");
  });
});
