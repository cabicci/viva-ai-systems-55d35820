import { describe, expect, it, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runMasaaratScreenshotRoute } from "../../../src/lib/lesson-visuals/controlled-v1/routes/masaaratScreenshot";
import { runAuthorizedExternalRoute } from "../../../src/lib/lesson-visuals/controlled-v1/routes/authorizedExternal";
import {
  DOCS_CONTROLLED_V1_CAPTURE,
  DOCS_CONTROLLED_V1_RIGHTS,
} from "../../../src/lib/lesson-visuals/controlled-v1/paths";

const tempFiles: string[] = [];
afterEach(() => {
  for (const f of tempFiles) rmSync(f, { force: true });
  tempFiles.length = 0;
});

describe("controlled-v1 routes/masaaratScreenshot (fail-closed)", () => {
  it("blocks with BLOCKED_UNRESOLVED_SPEC when no capture config exists", () => {
    // Use a Method A lesson outside the authorized four-locale pilot.
    const result = runMasaaratScreenshotRoute("builder-m2-l1-prompt-layer", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.configPath).toBeNull();
  });

  it("pilot lesson has authorized local-dev capture config but default route still fails closed (live capture is pilot-mode only)", () => {
    const result = runMasaaratScreenshotRoute("builder-m7-l1-tables-columns", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.configPath).toContain("builder-m7-l1-tables-columns");
    expect(result.reason).toMatch(/live capture|not implemented/i);
  });

  it("still blocks (capture-not-implemented) even with a valid non-Production capture config present", () => {
    mkdirSync(DOCS_CONTROLLED_V1_CAPTURE, { recursive: true });
    const path = resolve(DOCS_CONTROLLED_V1_CAPTURE, "__test-lesson__ar-EG.capture.json");
    tempFiles.push(path);
    writeFileSync(
      path,
      JSON.stringify({
        schemaVersion: "controlled-v1-capture-config/1",
        lessonId: "__test-lesson",
        locale: "ar-EG",
        environment: "staging",
        authorizedBy: "test-suite",
        authorizedAt: new Date().toISOString(),
        sessionUrl: "https://staging.masaarat.ai/system-state",
      }),
    );
    const result = runMasaaratScreenshotRoute("__test-lesson", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.configPath).toBe(path);
  });

  it("blocks with a validation-failure reason for a malformed config", () => {
    mkdirSync(DOCS_CONTROLLED_V1_CAPTURE, { recursive: true });
    const path = resolve(DOCS_CONTROLLED_V1_CAPTURE, "__test-lesson2__ar-EG.capture.json");
    tempFiles.push(path);
    writeFileSync(path, JSON.stringify({ schemaVersion: "wrong", environment: "production" }));
    const result = runMasaaratScreenshotRoute("__test-lesson2", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.reason).toContain("schema");
  });
});

describe("controlled-v1 routes/authorizedExternal (fail-closed)", () => {
  it("blocks with BLOCKED_UNRESOLVED_SPEC when no rights evidence exists", () => {
    const result = runAuthorizedExternalRoute("builder-m6-l3-first-prompt-to-lovable", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.rightsPath).toBeNull();
  });

  it("still blocks (capture-not-implemented) even with a valid production rights grant present", () => {
    mkdirSync(DOCS_CONTROLLED_V1_RIGHTS, { recursive: true });
    const path = resolve(DOCS_CONTROLLED_V1_RIGHTS, "__test-lesson__ar-EG.rights.json");
    tempFiles.push(path);
    writeFileSync(
      path,
      JSON.stringify({
        schemaVersion: "controlled-v1-rights-evidence/1",
        lessonId: "__test-lesson",
        locale: "ar-EG",
        externalSurface: "example.com",
        rightsBasis: "licensed",
        grantedBy: "test-suite",
        grantedAt: new Date().toISOString(),
        evidenceReferences: ["docs/example-evidence.md"],
        isProductionRightsGrant: true,
      }),
    );
    const result = runAuthorizedExternalRoute("__test-lesson", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.rightsPath).toBe(path);
  });

  it("rejects a rights file that is not an explicit production-rights grant", () => {
    mkdirSync(DOCS_CONTROLLED_V1_RIGHTS, { recursive: true });
    const path = resolve(DOCS_CONTROLLED_V1_RIGHTS, "__test-lesson3__ar-EG.rights.json");
    tempFiles.push(path);
    writeFileSync(
      path,
      JSON.stringify({
        schemaVersion: "controlled-v1-rights-evidence/1",
        lessonId: "__test-lesson3",
        externalSurface: "example.com",
        rightsBasis: "licensed",
        grantedBy: "nobody",
        grantedAt: new Date().toISOString(),
        evidenceReferences: ["x"],
        isProductionRightsGrant: false,
      }),
    );
    const result = runAuthorizedExternalRoute("__test-lesson3", "ar-EG");
    expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    expect(result.reason).toContain("schema");
  });

  it("the real builder-m6-l3-first-prompt-to-lovable lesson has no rights grant on disk (methodology sample is not sufficient)", () => {
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const result = runAuthorizedExternalRoute("builder-m6-l3-first-prompt-to-lovable", locale);
      expect(result.status).toBe("BLOCKED_UNRESOLVED_SPEC");
    }
  });
});
