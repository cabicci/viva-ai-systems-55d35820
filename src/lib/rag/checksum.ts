/**
 * Back-compat checksum surface — single implementation lives in canonical-checksum.ts.
 * Prefer importing from `./canonical-checksum` for new code.
 */

export {
  isValidSha256Digest,
  normalizeCanonicalText,
  sha256CanonicalHex,
  sha256CanonicalJson,
  stableCanonicalStringify,
  normalizeCanonicalText as normalizeText,
  sha256CanonicalHex as sha256Hex,
  sha256CanonicalJson as sha256Json,
} from "./canonical-checksum";
