import { describe, expect, it } from "vitest";
import { scopedSearch } from "./navigation";

const kid = "5b8f6a2e-1c3d-4e5f-8a9b-0c1d2e3f4a5b";
describe("scopedSearch", () => {
  it("keeps the selected child and locale on lesson links", () => {
    expect(scopedSearch("ar-EG", kid, { lesson: "S02" })).toEqual({
      locale: "ar-EG",
      profileId: kid,
      lesson: "S02",
    });
  });
  it("keeps the selected child on contents and introduction links", () => {
    expect(scopedSearch("en", kid, { view: "contents" }).profileId).toBe(kid);
    expect(scopedSearch("en", kid)).toEqual({ locale: "en", profileId: kid });
  });
  it("omits profile for areas without a child", () => {
    expect(scopedSearch("ar-MSA", undefined, { lesson: "S01" })).toEqual({
      locale: "ar-MSA",
      lesson: "S01",
    });
  });
});
