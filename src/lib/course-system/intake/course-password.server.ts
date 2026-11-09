import { createHash, timingSafeEqual } from "node:crypto";

// Courses that need an extra password, mapped to the server-only secret holding it.
const COURSE_PASSWORD_SECRETS: Record<string, string> = {
  "academic/AC-FATE": "PESTICIDES_COURSE_PASSWORD",
};

export function coursePasswordSecret(area: string, course: string): string | undefined {
  return COURSE_PASSWORD_SECRETS[`${area}/${course}`];
}

// Hash both sides to equal-length digests so the comparison is constant-time.
export function coursePasswordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
