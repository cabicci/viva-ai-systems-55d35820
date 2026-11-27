import { afterEach, expect, it, vi } from "vitest";
import { curriculumCatalogue } from "@/lib/course-system/intake/client";

vi.mock("@/lib/course-system/intake/client", () => ({ curriculumCatalogue: vi.fn() }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.resetAllMocks();
});

it("reuses only successful server results for the same locale for one minute", async () => {
  vi.stubEnv("SSR", true);
  vi.useFakeTimers();
  const fetch = vi.mocked(curriculumCatalogue);
  fetch.mockRejectedValueOnce(new Error("offline")).mockResolvedValue([]);
  const { publicAiCatalogue } = await import("./public-ai-catalogue");
  await expect(publicAiCatalogue("en")).rejects.toThrow("offline");
  await publicAiCatalogue("en");
  await publicAiCatalogue("en");
  await publicAiCatalogue("ar-EG");
  expect(fetch.mock.calls).toEqual([["ai", "en"], ["ai", "en"], ["ai", "ar-EG"]]);
  vi.advanceTimersByTime(60_001);
  await publicAiCatalogue("en");
  expect(fetch).toHaveBeenCalledTimes(4);
});
