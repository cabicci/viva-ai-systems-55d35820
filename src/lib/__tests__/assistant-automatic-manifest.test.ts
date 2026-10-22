// @vitest-environment node
import { describe, expect, it } from "vitest";
import { automaticPlans, type SourceMetadata } from "../assistant-automation/manifest";
import type { RegisteredCard } from "../card-assistant/registry";
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const cards: RegisteredCard[] = [{ area: "kids", id: "level-1", steps: [{ id: "1", stationId: "level-1", preview: false, source: { adapter: "kids", levelId: "level-1", lessonNumber: 1 } }] }];
const metadata = (): SourceMetadata => ({ kids: locales.map(locale => ({ level_id: "level-1", lesson_number: 1, locale, approved_sha256: "a".repeat(64) })),
  technical: [], academicCourses: [{ id: "AC-NEW", enabled: true, assistant_enabled: true, assistant_review_enabled: false }],
  academic: locales.map(locale => ({ course_id: "AC-NEW", lesson_id: "AC-NEW-M01-L01", locale, approved: true, source_sha256: "b".repeat(64) })) });
const plans = (source = metadata(), build = "c".repeat(64)) => automaticPlans(build, { releaseId: "d".repeat(64), chunks: 100 }, cards, source);
describe("automatic incremental source admission", () => {
  it("discovers newly registered academic cards without assistant code and pins whole-card approved sources", async () => {
    const result = await plans();
    expect(result.map(row => [row.manifest.area, row.manifest.cardId, row.manifest.scopeCount])).toEqual([["ai", "current", 4], ["kids", "level-1", 5], ["academic", "AC-NEW", 5]]);
    expect(result.every(row => row.manifest.issue === null)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("payload");
  });
  it("reuses the immutable job for unchanged inputs and invalidates only changed card/build fingerprints", async () => {
    const old = await plans(); expect((await plans()).map(row => row.key)).toEqual(old.map(row => row.key));
    const revised = metadata(); revised.kids[0].approved_sha256 = "e".repeat(64);
    const changed = await plans(revised); expect(changed[0].key).toBe(old[0].key); expect(changed[1].key).not.toBe(old[1].key); expect(changed[2].key).toBe(old[2].key);
    expect((await plans(metadata(), "f".repeat(64))).every((row, i) => row.key !== old[i].key)).toBe(true);
  });
  it("holds missing, revoked or duplicate approvals before any paid indexing", async () => {
    const missing = metadata(); missing.kids.pop();
    expect((await plans(missing))[1].manifest.issue).toBe("AUTOMATION_SOURCE_UNAPPROVED");
    const revoked = metadata(); revoked.academic[0].approved = false;
    expect((await plans(revoked))[2].manifest.issue).toBe("AUTOMATION_SOURCE_UNAPPROVED");
    const duplicate = metadata(); duplicate.academic.push({ ...duplicate.academic[0] });
    expect((await plans(duplicate))[2].manifest.issue).toBe("AUTOMATION_SOURCE_UNAPPROVED");
  });
});
