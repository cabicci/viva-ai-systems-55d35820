import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("responsive collision guards", () => {
  it("keeps the global dashboard shortcut away from the top navigation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/site/BackToDashboard.tsx"),
      "utf8",
    );

    expect(source).toContain("fixed bottom-4 end-4");
    expect(source).not.toContain("fixed top-4 left-4");
  });

  it("places lesson back actions opposite the sidebar", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/routes/learn.$pathId.$lessonId.tsx"),
      "utf8",
    );

    expect(source.match(/fixed top-4 end-4/g)?.length).toBe(2);
    expect(source).not.toContain("lg:start-4");
  });
});
