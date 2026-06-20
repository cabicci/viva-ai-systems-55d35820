import { afterEach, describe, expect, it, vi } from "vitest";

describe("feature-flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("localeUiEnabled is false by default", async () => {
    const { localeUiEnabled } = await import("@/lib/locale/feature-flags");
    expect(localeUiEnabled).toBe(false);
  });

  it("localeUiEnabled is true only when VITE_LOCALE_UI_ENABLED is explicitly true", async () => {
    vi.stubEnv("VITE_LOCALE_UI_ENABLED", "true");
    vi.resetModules();

    const { localeUiEnabled } = await import("@/lib/locale/feature-flags");
    expect(localeUiEnabled).toBe(true);
  });

  it("keeps all other locale flags false", async () => {
    const flags = await import("@/lib/locale/feature-flags");

    expect(flags.localeRuntimeEnabled).toBe(false);
    expect(flags.localizedLessonsEnabled).toBe(false);
    expect(flags.localizedVideosEnabled).toBe(false);
    expect(flags.localizedRagEnabled).toBe(false);
  });
});
