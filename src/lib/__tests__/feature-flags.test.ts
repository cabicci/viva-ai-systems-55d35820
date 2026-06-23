import { afterEach, describe, expect, it, vi } from "vitest";

describe("feature-flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("localeUiEnabled defaults true in Phase 9", async () => {
    const { localeUiEnabled } = await import("@/lib/locale/feature-flags");
    expect(localeUiEnabled).toBe(true);
  });

  it("localeUiEnabled is false when VITE_LOCALE_UI_ENABLED=false", async () => {
    vi.stubEnv("VITE_LOCALE_UI_ENABLED", "false");
    vi.resetModules();

    const { localeUiEnabled } = await import("@/lib/locale/feature-flags");
    expect(localeUiEnabled).toBe(false);
  });

  it("localizedLessonsEnabled defaults true in Phase 9", async () => {
    const flags = await import("@/lib/locale/feature-flags");

    expect(flags.localizedLessonsEnabled).toBe(true);
    expect(flags.localeRuntimeEnabled).toBe(true);
    expect(flags.localizedVideosEnabled).toBe(false);
    expect(flags.localizedRagEnabled).toBe(false);
  });

  it("localizedLessonsEnabled is false when VITE_LOCALIZED_LESSONS_ENABLED=false", async () => {
    vi.stubEnv("VITE_LOCALIZED_LESSONS_ENABLED", "false");
    vi.resetModules();

    const { localizedLessonsEnabled } = await import("@/lib/locale/feature-flags");
    expect(localizedLessonsEnabled).toBe(false);
  });
});
