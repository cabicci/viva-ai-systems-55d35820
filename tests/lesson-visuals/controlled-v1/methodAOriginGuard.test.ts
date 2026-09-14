import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
  METHOD_A_REMAINING_SIX_LESSON_IDS,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import {
  captureMethodAPilotCell,
  type MethodACaptureEvidence,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/methodALiveCapture";
import {
  captureMethodARemainingSixCell,
  type MethodARemainingSixCaptureConfig,
  type MethodARemainingSixCaptureEvidence,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/methodARemainingSixCapture";
import type { Locale } from "../../../src/lib/lesson-visuals/controlled-v1/types";

const MALICIOUS_APP_ORIGINS = [
  "https://127.0.0.1:55440",
  "http://[::1]:55440",
  "http://127.0.0.1:55440@evil.example",
  "http://localhost.evil.example:55440",
  "http://2130706433:55440",
  "http://0x7f000001:55440",
  "http://0177.0.0.1:55440",
  "http://127.1:55440",
  "http://127.0.0.1:65536",
  "http://evil.example/localhost",
  "http://evil.example/?next=http://127.0.0.1:55440",
  "http://user:password@127.0.0.1:55440",
  "http://127.0.0.1:55440/login",
  "http://127.0.0.1:55440?next=http://evil.example",
  "http://127.0.0.1:55440#localhost",
] as const;

function pilotEvidence(locale: Locale, origin: string): MethodACaptureEvidence {
  return {
    requestedLocale: locale,
    resolvedLocale: locale,
    direction: locale === "en" ? "ltr" : "rtl",
    route: "/system-state",
    finalUrl: origin,
    readiness: {},
    redaction: {},
    networkAudit: {
      total: 0,
      allowed: 0,
      blockedNonLocal: 0,
      forbidden: 0,
      samples: [],
    },
    assertions: ["fake capture stop"],
  };
}

function remainingEvidence(
  lessonId: string,
  locale: Locale,
  origin: string,
): MethodARemainingSixCaptureEvidence {
  return {
    lessonId,
    concept: null,
    requestedLocale: locale,
    resolvedLocale: locale,
    direction: locale === "en" ? "ltr" : "rtl",
    route: "/dashboard",
    finalUrl: origin,
    readiness: {},
    redaction: {},
    networkAudit: {
      total: 0,
      allowed: 0,
      blockedNonLocal: 0,
      forbidden: 0,
      samples: [],
    },
    assertions: ["fake capture stop"],
  };
}

const remainingLessonId = METHOD_A_REMAINING_SIX_LESSON_IDS[0]!;
const remainingCellId = `${remainingLessonId}__en`;

describe("Method A credential-bearing app-origin gate", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROLLED_V1_ZERO_CAPTURE", "0");
    vi.stubEnv("CONTROLLED_V1_ZERO_RENDER", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(MALICIOUS_APP_ORIGINS)(
    "blocks %s before either capture function",
    async (appOrigin) => {
      const pilotCapture = vi.fn(async () => {
        throw new Error("pilot capture must not run");
      });
      const remainingCapture = vi.fn(async () => {
        throw new Error("remaining-six capture must not run");
      });

      const pilot = await captureMethodAPilotCell({
        lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
        locale: "en",
        cellId: "builder-m7-l1-tables-columns__en",
        outputDir: "unused",
        appOrigin,
        captureFn: pilotCapture,
      });
      const remaining = await captureMethodARemainingSixCell({
        lessonId: remainingLessonId,
        locale: "en",
        cellId: remainingCellId,
        outputDir: "unused",
        appOrigin,
        captureFn: remainingCapture,
      });

      expect(pilot.ok).toBe(false);
      expect(remaining.ok).toBe(false);
      expect(pilotCapture).not.toHaveBeenCalled();
      expect(remainingCapture).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["http://127.0.0.1:55440", "http://127.0.0.1:55440"],
    ["HTTP://LOCALHOST:55440/", "http://localhost:55440"],
    ["http://localhost", "http://localhost"],
  ])("accepts %s and passes normalized %s to both capture functions", async (raw, normalized) => {
    const pilotCapture = vi.fn(
      async ({ locale, appOrigin }: { locale: Locale; appOrigin: string }) => ({
        png: Buffer.alloc(0),
        finalUrl: appOrigin,
        evidence: pilotEvidence(locale, appOrigin),
      }),
    );
    const remainingCapture = vi.fn(
      async ({
        lessonId,
        locale,
        appOrigin,
      }: {
        lessonId: string;
        locale: Locale;
        appOrigin: string;
        config: MethodARemainingSixCaptureConfig;
        readinessOnly?: boolean;
      }) => ({
        png: Buffer.alloc(0),
        finalUrl: appOrigin,
        evidence: remainingEvidence(lessonId, locale, appOrigin),
      }),
    );

    await captureMethodAPilotCell({
      lessonId: METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
      locale: "en",
      cellId: "builder-m7-l1-tables-columns__en",
      outputDir: "unused",
      appOrigin: raw,
      captureFn: pilotCapture,
    });
    await captureMethodARemainingSixCell({
      lessonId: remainingLessonId,
      locale: "en",
      cellId: remainingCellId,
      outputDir: "unused",
      appOrigin: raw,
      captureFn: remainingCapture,
    });

    expect(pilotCapture).toHaveBeenCalledOnce();
    expect(pilotCapture.mock.calls[0]?.[0].appOrigin).toBe(normalized);
    expect(remainingCapture).toHaveBeenCalledOnce();
    expect(remainingCapture.mock.calls[0]?.[0].appOrigin).toBe(normalized);
  });
});
