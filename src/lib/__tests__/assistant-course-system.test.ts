// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeCourse, COURSE_AREAS, CourseIntegrationError } from "../course-system/contract";
import { verifySharedLessonRoutes } from "../../../scripts/assistant/integration-wiring";

const source = () => ({ area: "ai", id: "new-card", title: "New card", stations: [
  { id: "station-one", steps: [{ id: "step-one", content: { title: "Lesson", sections: [{ title: "Idea", text: "Original teaching text" }] } }] },
] });

describe("platform-owned course integration", () => {
  it.each(COURSE_AREAS)("inherits the assistant and shared template for a new %s card without any authored assistant", area => {
    const card = normalizeCourse({ ...source(), area });
    expect(card.platform).toEqual({ template: "shared-area-lesson",
      accessAdapter: area === "ai" ? "assistant_card_content_access" : area === "academic" ? "academic_assistant_access" : "card_assistant_access",
      assistant: { enabled: true, scope: "whole-current-card", examples: "within-card-concepts", indexing: "incremental-current-source" } });
    expect(card.stations[0].steps[0].content).toEqual(source().stations[0].steps[0].content);
  });
  it("normalizes the two supported hierarchy layouts without losing or rewriting lesson data", () => {
    const first = source();
    const alternate = { area: first.area, cardId: first.id, title: first.title,
      modules: first.stations.map(({ id, steps }) => ({ id, lessons: steps })) };
    expect(normalizeCourse(alternate)).toEqual(normalizeCourse(first));
  });
  it.each([false, { enabled: false }, { scope: "all-cards" }, "custom"])("rejects an imported assistant override %j", assistant => {
    expect(() => normalizeCourse({ ...source(), assistant })).toThrow("COURSE_PLATFORM_OVERRIDE: card.assistant");
  });
  it.each(["renderer", "component", "accessAdapter", "platform", "stylesheet"])("rejects per-course %s overrides", key => {
    expect(() => normalizeCourse({ ...source(), [key]: "custom" })).toThrow(`COURSE_UNMAPPED_FIELD: card.${key}`);
  });
  it("reports ambiguous hierarchy rather than selecting one silently", () => {
    expect(() => normalizeCourse({ ...source(), modules: [] })).toThrow("COURSE_AMBIGUOUS_FIELD");
  });
  it("reports an unknown teaching wrapper instead of dropping it", () => {
    expect(() => normalizeCourse({ ...source(), introduction: "Keep this teaching copy" })).toThrow("COURSE_UNMAPPED_FIELD: card.introduction");
  });
  it("rejects routes that bypass the shared lesson engine", () => {
    const next = source();
    Object.assign(next.stations[0].steps[0], { route: "/special-course/step-one" });
    expect(() => normalizeCourse(next)).toThrow("COURSE_CUSTOM_ROUTE");
  });
  it("rejects duplicate steps even when they occur in different stations", () => {
    const next = source(); next.stations.push({ id: "station-two", steps: next.stations[0].steps });
    expect(() => normalizeCourse(next)).toThrow("COURSE_DUPLICATE_STEP");
  });
  it("rejects executable lesson content and unsafe identifiers", () => {
    const next = source(); Object.assign(next.stations[0].steps[0], { content: { render: () => "custom" } });
    expect(() => normalizeCourse(next)).toThrow(CourseIntegrationError);
    expect(() => normalizeCourse({ ...source(), id: "../other-card" })).toThrow("COURSE_ID_INVALID");
  });
  it.each(["/learn/new-card/first", "/kids/new-card/first", "/technical/learn/new-step", "/academic/learn/AC-NEW-M01-L01"])("blocks an independently added %s page even without an intake command", route => {
    const file = "src/routes/nested/new-course.tsx";
    expect(verifySharedLessonRoutes(() => `import { createFileRoute as create } from '@tanstack/react-router'; export const Route=create('${route}')({component:()=>null})`, [file]))
      .toContainEqual(expect.objectContaining({ code: "COURSE_CUSTOM_ROUTE", location: file }));
  });
  it("keeps the generic lesson routes and non-teaching course overview pages", () => {
    for (const route of ["/learn/$pathId/$lessonId", "/kids/$levelId/$lessonNumber", "/technical/learn/$lessonId", "/academic/learn/$lessonId", "/kids/$levelId/contents", "/technical/courses/$cardId"])
      expect(verifySharedLessonRoutes(() => `createFileRoute('${route}')({})`, ["route.tsx"])).toEqual([]);
  });
});
