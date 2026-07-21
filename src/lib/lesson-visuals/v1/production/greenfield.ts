/**
 * Strong greenfield / no-legacy enforcement (path + URL + checksum denylist).
 */
import { decodeURIComponentSafe, normalizeRef } from "./pathNormalize";

const LEGACY_PATH_FRAGMENTS = [
  "/gallery/",
  "\\gallery\\",
  "/legacy-images/",
  "\\legacy-images\\",
  "/legacy/",
  "\\legacy\\",
  "/rollback/",
  "\\rollback\\",
  "docs/lesson-visuals/legacy",
  "artifacts/legacy",
  "historical-visual-candidate",
  "lesson-visuals-rollback",
  "legacy-mapping",
  "rollback-manifest",
] as const;

const LEGACY_URL_HOST_FRAGMENTS = [
  "b-cdn.net",
  "bunnycdn.com",
  "vz-", // bunny stream host prefix pattern
] as const;

const LEGACY_URL_PATH_FRAGMENTS = [
  "/legacy/",
  "/gallery/",
  "/rollback/",
  "legacy-asset",
  "legacy_visual",
] as const;

/** Known-legacy content checksum denylist (extensible from evidence ledgers). */
export const LEGACY_CHECKSUM_DENYLIST = new Set<string>([
  // Deterministic fixture checksum used by regression tests (not a production asset).
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
]);

export function isLegacyReference(raw: string): { legacy: boolean; reason: string | null } {
  if (!raw || !raw.trim()) return { legacy: false, reason: null };
  const decoded = decodeURIComponentSafe(raw.trim());
  const norm = normalizeRef(decoded);

  for (const frag of LEGACY_PATH_FRAGMENTS) {
    if (norm.includes(normalizeRef(frag))) {
      return { legacy: true, reason: `legacy path fragment: ${frag}` };
    }
  }

  const lower = decoded.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    for (const host of LEGACY_URL_HOST_FRAGMENTS) {
      if (lower.includes(host) && LEGACY_URL_PATH_FRAGMENTS.some((p) => lower.includes(p))) {
        return { legacy: true, reason: `bunny/legacy URL pattern: ${host}` };
      }
    }
    for (const p of LEGACY_URL_PATH_FRAGMENTS) {
      if (lower.includes(p)) {
        return { legacy: true, reason: `legacy URL path: ${p}` };
      }
    }
  }

  if (/^[a-f0-9]{64}$/i.test(raw.trim()) && LEGACY_CHECKSUM_DENYLIST.has(raw.trim().toLowerCase())) {
    return { legacy: true, reason: "known legacy checksum" };
  }

  return { legacy: false, reason: null };
}

export function assertGreenfieldReferences(
  refs: Iterable<string>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const ref of refs) {
    const r = isLegacyReference(ref);
    if (r.legacy) errors.push(`legacy reuse rejected (${r.reason}): ${ref}`);
  }
  return { ok: errors.length === 0, errors };
}
