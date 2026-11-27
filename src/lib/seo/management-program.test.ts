import { expect, it } from "vitest";
import type { CurriculumSummary } from "@/lib/course-system/intake/client";
import { managementSitemap } from "./management-program";

it("only lists distinct public management course outlines", () => {
  const course: CurriculumSummary = {
    id: "AC-MGT-TEST",
    title: "Decisions",
    area: "academic",
    stations: [],
    version: "123",
  };
  const xml = managementSitemap([
    course,
    course,
    { ...course, area: "ai" },
    { ...course, id: "AC-BUS" },
    { ...course, id: "AC-MGT-<&" },
  ]);
  expect(xml.match(/<loc>/g)).toHaveLength(1);
  expect(xml).toContain("<loc>https://masaarat.ai/programs/management/AC-MGT-TEST</loc>");
  expect(managementSitemap([])).not.toContain("<loc>");
});
