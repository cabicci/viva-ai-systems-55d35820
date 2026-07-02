import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_UI_KEYS } from "@/lib/locale/auth-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

const AUTH_SOURCES = [
  "src/routes/login.tsx",
  "src/routes/signup.tsx",
  "src/routes/forgot-password.tsx",
  "src/routes/reset-password.tsx",
  "src/components/auth/AuthShell.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

describe("locale auth flows (Phase 12.4C)", () => {
  it("serves auth strings for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of AUTH_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("renders English auth copy for locale=en", () => {
    expect(getUiString("en", "auth.login.title")).toBe("Welcome back");
    expect(getUiString("en", "auth.signup.toast.success").toLowerCase()).toContain("email");
  });

  it("wires auth flows through useUiString", () => {
    for (const source of AUTH_SOURCES) {
      expect(source).toContain("useUiString");
    }
  });
});
