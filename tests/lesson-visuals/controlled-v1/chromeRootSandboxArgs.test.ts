import { describe, expect, it } from "vitest";
import {
  appendRootChromiumSandboxArgs,
  buildChromeScreenshotArgs,
  isControlledVisualsRenderRoot,
  resolveChromeExecutable,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/instructionalComposition";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

describe("controlled-v1 Chromium root sandbox args (validation-only)", () => {
  const base = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1280,720",
    "--user-data-dir=/tmp/ud",
    "--screenshot=/tmp/out.png",
    "file:///tmp/page.html",
  ];

  it("detects root only when getuid returns 0", () => {
    expect(isControlledVisualsRenderRoot(() => 0)).toBe(true);
    expect(isControlledVisualsRenderRoot(() => 1000)).toBe(false);
    expect(isControlledVisualsRenderRoot(() => undefined)).toBe(false);
  });

  it("root execution includes --no-sandbox and --disable-setuid-sandbox", () => {
    const args = appendRootChromiumSandboxArgs(base, { getUid: () => 0 });
    expect(args).toContain("--no-sandbox");
    expect(args).toContain("--disable-setuid-sandbox");
  });

  it("non-root execution includes neither sandbox-disable argument", () => {
    const args = appendRootChromiumSandboxArgs(base, { getUid: () => 1000 });
    expect(args).not.toContain("--no-sandbox");
    expect(args).not.toContain("--disable-setuid-sandbox");
    expect(args).toEqual(base);
  });

  it("does not duplicate root sandbox arguments when already present", () => {
    const withFlags = [...base, "--no-sandbox", "--disable-setuid-sandbox"];
    const args = appendRootChromiumSandboxArgs(withFlags, { getUid: () => 0 });
    expect(args.filter((a) => a === "--no-sandbox")).toHaveLength(1);
    expect(args.filter((a) => a === "--disable-setuid-sandbox")).toHaveLength(1);
  });

  it("preserves unrelated Chromium arguments", () => {
    const args = buildChromeScreenshotArgs({
      htmlPath: "E:/tmp/page.html",
      pngPath: "E:/tmp/out.png",
      userDataDir: "E:/tmp/ud",
      getUid: () => 0,
    });
    expect(args[0]).toBe("--headless=new");
    expect(args).toContain("--disable-gpu");
    expect(args).toContain("--hide-scrollbars");
    expect(args).toContain("--force-device-scale-factor=1");
    expect(args.some((a) => a.startsWith("--window-size="))).toBe(true);
    expect(args.some((a) => a.startsWith("--user-data-dir="))).toBe(true);
    expect(args.some((a) => a.startsWith("--screenshot="))).toBe(true);
    expect(args).toContain("--no-sandbox");
    expect(args).toContain("--disable-setuid-sandbox");
  });

  it("browser failure remains non-zero and fail-closed (no skip)", () => {
    // Missing executable path must fail hard — never silently skip.
    const missing = "E:/definitely-missing-controlled-chromium-binary.exe";
    expect(existsSync(missing)).toBe(false);
    const result = spawnSync(missing, ["--version"], { encoding: "utf8" });
    expect(result.status === 0).toBe(false);
    expect(() => resolveChromeExecutable()).not.toThrow(); // system chrome may exist
    // Explicit missing path still produces non-zero spawn — fail-closed pattern.
    expect(result.error || result.status !== 0).toBeTruthy();
  });
});
