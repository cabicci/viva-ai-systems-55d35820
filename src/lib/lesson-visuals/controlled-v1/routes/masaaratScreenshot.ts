import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DOCS_CONTROLLED_V1_CAPTURE } from "../paths";
import type { CellStatus, Locale } from "../types";

export interface CaptureSessionConfig {
  schemaVersion: "controlled-v1-capture-config/1";
  lessonId: string;
  locale?: Locale;
  /** MUST be a non-Production environment/session identifier. */
  environment: "staging" | "qa-seeded" | "local-dev";
  authorizedBy: string;
  authorizedAt: string;
  sessionUrl: string;
  notes?: string;
}

export interface MasaaratScreenshotRouteResult {
  status: CellStatus;
  reason: string;
  configPath: string | null;
}

function candidateConfigPaths(lessonId: string, locale: Locale): string[] {
  return [
    resolve(DOCS_CONTROLLED_V1_CAPTURE, `${lessonId}__${locale}.capture.json`),
    resolve(DOCS_CONTROLLED_V1_CAPTURE, `${lessonId}.capture.json`),
  ];
}

function loadCaptureConfig(path: string): CaptureSessionConfig | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as CaptureSessionConfig;
    return parsed;
  } catch {
    return null;
  }
}

function isValidNonProdConfig(config: CaptureSessionConfig): boolean {
  if (config.schemaVersion !== "controlled-v1-capture-config/1") return false;
  if (!["staging", "qa-seeded", "local-dev"].includes(config.environment)) {
    return false;
  }
  if (!config.authorizedBy || !config.authorizedAt || !config.sessionUrl) {
    return false;
  }
  // Fail closed on anything that looks like a Production capture target.
  if (/production|\bprod\b|masaarat\.ai\/(?!system-state)/i.test(config.sessionUrl)) {
    if (!/staging|qa|local/i.test(config.sessionUrl)) return false;
  }
  return true;
}

/**
 * Method A route: MASAARAT_SCREENSHOT. Fails closed to BLOCKED_UNRESOLVED_SPEC
 * whenever there is no authorized, non-Production Masaarat capture session
 * config for this lesson/locale. Never captures against Production. Never
 * invents or synthesizes a screenshot in place of a real capture.
 */
export function runMasaaratScreenshotRoute(
  lessonId: string,
  locale: Locale,
): MasaaratScreenshotRouteResult {
  for (const configPath of candidateConfigPaths(lessonId, locale)) {
    const config = loadCaptureConfig(configPath);
    if (!config) continue;
    if (!isValidNonProdConfig(config)) {
      return {
        status: "BLOCKED_UNRESOLVED_SPEC",
        reason: "capture config found but failed non-Production / schema validation",
        configPath,
      };
    }
    // A valid, authorized non-Production session config exists. This controlled-v1
    // pipeline still does not perform live browser capture (out of scope here);
    // it reports the cell as authorized-but-not-yet-captured rather than BLOCKED.
    return {
      status: "BLOCKED_UNRESOLVED_SPEC",
      reason:
        "authorized non-Production capture session found, but live capture execution is not implemented in this pipeline revision — human/CI capture step required",
      configPath,
    };
  }

  return {
    status: "BLOCKED_UNRESOLVED_SPEC",
    reason:
      "no authorized non-Production Masaarat capture session config found under docs/lesson-visuals/controlled-v1/capture/ — see capture/ledger.json",
    configPath: null,
  };
}
