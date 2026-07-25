import {
  EXPECTED_LOCALE_CHUNK_COUNTS,
  EXPECTED_LOCALE_PACKAGE_COUNTS,
  REPORT_SCHEMA_VERSION,
} from "./constants";
import type { ImporterReport, RowProgress } from "./types";

const SECRET_PATTERNS = [
  /postgresql:\/\/[^\s"']+/gi,
  /postgres:\/\/[^\s"']+/gi,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  /sk-[a-zA-Z0-9]{10,}/g,
  /Bearer\s+[a-zA-Z0-9._~+/=-]+/gi,
  /service_role[^\s"']{0,40}/gi,
  /password=[^\s&"']+/gi,
];

export function redactSecrets(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

export function emptyRowProgress(): RowProgress {
  return { inserted: 0, skippedExact: 0, conflicting: 0, failed: 0 };
}

export function buildReport(
  partial: Omit<
    ImporterReport,
    | "schemaVersion"
    | "localePackageCounts"
    | "localeChunkCounts"
    | "authorizationIdPresent"
    | "confirmationTokenPresent"
  > & {
    authorizationIdPresent?: boolean;
    confirmationTokenPresent?: boolean;
  },
): ImporterReport {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    localePackageCounts: { ...EXPECTED_LOCALE_PACKAGE_COUNTS },
    localeChunkCounts: { ...EXPECTED_LOCALE_CHUNK_COUNTS },
    authorizationIdPresent: partial.authorizationIdPresent ?? false,
    confirmationTokenPresent: partial.confirmationTokenPresent ?? false,
    ...partial,
    errorMessageRedacted: partial.errorMessageRedacted
      ? redactSecrets(partial.errorMessageRedacted)
      : null,
  };
}

export function assertReportRedacted(report: ImporterReport): string[] {
  const serialized = JSON.stringify(report);
  const leaks: string[] = [];
  if (/postgresql:\/\//i.test(serialized)) leaks.push("db_url");
  if (/sk-[a-zA-Z0-9]{10,}/.test(serialized)) leaks.push("api_key");
  if (/Bearer\s+[a-zA-Z0-9]/i.test(serialized)) leaks.push("bearer");
  if (/"embedding"\s*:\s*\[/.test(serialized)) leaks.push("embedding_vector");
  if (/displayText/.test(serialized) && /"displayText":\s*"[^"]{80,}"/.test(serialized)) {
    leaks.push("lesson_text");
  }
  return leaks;
}
