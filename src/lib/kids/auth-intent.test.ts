import { describe, expect, it } from "vitest";
import { isSafeAuthReturn, kidsSignupRedirect, parseAuthIntentSearch } from "./auth-intent";

const lesson = "/learn/builder/builder-m1-l1-what-is-llm";

describe("safe learner authentication destinations", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "returns an ordinary account to phone entry after signup in %s",
    (locale) => {
      const search = parseAuthIntentSearch({ locale, returnTo: "/verify-phone" });
      expect(search).toMatchObject({ locale, returnTo: "/verify-phone" });
      expect(kidsSignupRedirect("https://masaarat.ai", search)).toBe(
        `https://masaarat.ai/verify-phone?locale=${locale}`,
      );
    },
  );
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "retains a lesson through signup in %s",
    (locale) => {
      const search = parseAuthIntentSearch({ locale, returnTo: lesson });
      expect(search).toMatchObject({ locale, returnTo: lesson });
      expect(kidsSignupRedirect("https://masaarat.ai", search)).toBe(
        `https://masaarat.ai${lesson}?locale=${locale}`,
      );
    },
  );

  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/admin",
    "/verify-phone?phone=private",
    "/verify-phone/../admin",
    "/learn/builder/../admin",
    "/learn/builder/%2e%2e",
    "/learn/builder/%2f%2fevil.test",
    `${lesson}?next=https://evil.test`,
    `${lesson}#fragment`,
    `${lesson}\n`,
    "/learn/unknown/step",
    "/learn/builder/step/extra",
    null,
  ])("rejects an untrusted destination: %s", (returnTo) => {
    expect(isSafeAuthReturn(returnTo)).toBe(false);
    expect(parseAuthIntentSearch({ returnTo }).returnTo).toBeUndefined();
  });
});
