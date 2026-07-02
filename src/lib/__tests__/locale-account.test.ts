import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCOUNT_UI_KEYS } from "@/lib/locale/account-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

const ACCOUNT_SOURCE = readFileSync(
  resolve(process.cwd(), "src/routes/account.tsx"),
  "utf8",
);

describe("locale account page (Phase 12.4D)", () => {
  it("serves account strings for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of ACCOUNT_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("renders English account copy for locale=en", () => {
    expect(getUiString("en", "account.title")).toBe("Account");
    expect(getUiString("en", "account.manage.deleteAccount").toLowerCase()).toContain(
      "delete",
    );
  });

  it("wires account page through useUiString and useLocale", () => {
    expect(ACCOUNT_SOURCE).toContain("useUiString");
    expect(ACCOUNT_SOURCE).toContain("useLocale");
  });
});
