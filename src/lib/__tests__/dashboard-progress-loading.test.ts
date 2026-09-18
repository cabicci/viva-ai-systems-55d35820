import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard progress loading gate", () => {
  it("keeps the existing skeleton visible until lesson progress is loaded", () => {
    const source = readFileSync(resolve(process.cwd(), "src/routes/dashboard.tsx"), "utf8");

    expect(source).toContain(
      "const { store, getStatus, isLoaded: isProgressLoaded } = useLessonProgress();",
    );
    expect(source).toContain("if (!isProgressLoaded) return <DashboardSkeleton />;");
  });
});
