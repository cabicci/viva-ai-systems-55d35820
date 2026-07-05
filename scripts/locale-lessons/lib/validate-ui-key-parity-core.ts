import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  UI_LOCALES,
  type ValidatorResult,
} from "./localization-contract-rules.ts";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export async function validateUiKeyParity(): Promise<ValidatorResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maps: Record<string, Record<string, string>> = {};

  for (const locale of UI_LOCALES) {
    const filePath = path.join(REPO_ROOT, "src/locales", locale, "ui.json");
    maps[locale] = JSON.parse(await fs.readFile(filePath, "utf8")) as Record<
      string,
      string
    >;
  }

  const referenceKeys = Object.keys(maps["ar-EG"]).sort();
  const referenceSet = new Set(referenceKeys);

  for (const locale of UI_LOCALES) {
    if (locale === "ar-EG") continue;
    const keys = Object.keys(maps[locale]).sort();
    const localeSet = new Set(keys);
    const missing = referenceKeys.filter((key) => !localeSet.has(key));
    const extra = keys.filter((key) => !referenceSet.has(key));

    if (missing.length) {
      errors.push(
        `${locale} ui.json missing ${missing.length} key(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}`,
      );
    }
    if (extra.length) {
      errors.push(
        `${locale} ui.json has ${extra.length} extra key(s): ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""}`,
      );
    }

    for (const [key, value] of Object.entries(maps[locale])) {
      if (value === key) {
        warnings.push(`${locale} ${key}: value equals key (possible missing translation)`);
      }
      if (locale === "en" && /[\u0600-\u06FF]/.test(value)) {
        errors.push(`${locale} ${key}: English ui.json value contains Arabic letters`);
      }
    }
  }

  return {
    name: "ui-key-parity",
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
