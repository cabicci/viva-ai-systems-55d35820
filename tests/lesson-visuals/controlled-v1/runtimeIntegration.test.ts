import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  REPO_ROOT,
  DOCS_CONTROLLED_V1,
} from "../../../src/lib/lesson-visuals/controlled-v1/paths";
import {
  materializeControlledV1RuntimeAssets,
  RUNTIME_ASSETS_ROOT,
  RUNTIME_INVENTORY_PATH,
} from "../../../src/lib/lesson-visuals/controlled-v1/materializeControlledV1RuntimeAssets";
import {
  auditControlledV1BrowserResolver,
  getControlledV1BrowserManifestEntries,
  resolveControlledV1Visual,
  setControlledV1AssetUrlMapForTests,
} from "../../../src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserResolver";

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

describe("controlled-v1 runtime integration", () => {
  beforeAll(() => {
    // Script preconditions already materialize; re-verify quickly with long timeout.
    const result = materializeControlledV1RuntimeAssets();
    expect(result.ok, result.errors.join("\n")).toBe(true);
    expect(result.materialized).toBe(400);
  }, 180_000);

  afterEach(() => {
    setControlledV1AssetUrlMapForTests(null);
  });

  it("inventory has exactly 400 unique cells with Method A 28 / Method C 372 / 100 per locale", () => {
    const inv = JSON.parse(readFileSync(RUNTIME_INVENTORY_PATH, "utf8"));
    expect(inv.cells).toHaveLength(400);
    expect(new Set(inv.cells.map((c: { cellId: string }) => c.cellId)).size).toBe(400);
    expect(inv.counts.methodA).toBe(28);
    expect(inv.counts.methodC).toBe(372);
    expect(inv.counts.locales["ar-EG"]).toBe(100);
    expect(inv.counts.locales["ar-MSA"]).toBe(100);
    expect(inv.counts.locales["ar-Gulf"]).toBe(100);
    expect(inv.counts.locales.en).toBe(100);
  });

  it("every inventory accepted hash equals authentic materialized target bytes", () => {
    const inv = JSON.parse(readFileSync(RUNTIME_INVENTORY_PATH, "utf8"));
    let mismatches = 0;
    for (const cell of inv.cells) {
      const out = join(REPO_ROOT, cell.assetKey);
      expect(existsSync(out), cell.cellId).toBe(true);
      if (sha256File(out) !== cell.acceptedSha256) mismatches++;
      expect(cell.realFormat).toBe("png");
      expect(cell.extension).toBe("png");
      const buf = readFileSync(out);
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);
    }
    expect(mismatches).toBe(0);
  });

  it("materialization emits exactly 400 assets under src/assets/lesson-visuals/controlled-v1", () => {
    const files = walkFiles(RUNTIME_ASSETS_ROOT).filter((p) => /\.png$/i.test(p));
    expect(files).toHaveLength(400);
  });

  it("browser manifest covers 400 unique lesson-locale keys", () => {
    const entries = getControlledV1BrowserManifestEntries();
    expect(entries).toHaveLength(400);
    const keys = entries.map((e) => `${e.lessonId}::${e.locale}`);
    expect(new Set(keys).size).toBe(400);
  });

  it("browser resolver returns correct asset for every cell when URLs are injected", () => {
    const entries = getControlledV1BrowserManifestEntries();
    const map: Record<string, string> = {};
    for (const e of entries) {
      map[e.assetKey] = `test-url://${e.cellId}`;
    }
    setControlledV1AssetUrlMapForTests(map);

    for (const e of entries) {
      const r = resolveControlledV1Visual({
        lessonId: e.lessonId,
        locale: e.locale,
        expectedMethod: e.method,
      });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.cellId).toBe(e.cellId);
      expect(r.url).toBe(`test-url://${e.cellId}`);
      expect(r.acceptedSha256).toBe(e.acceptedSha256);
    }

    const audit = auditControlledV1BrowserResolver();
    expect(audit.manifestEntries).toBe(400);
    expect(audit.uniqueLessonLocaleKeys).toBe(400);
    expect(audit.methodA).toBe(28);
    expect(audit.methodC).toBe(372);
    expect(audit.locales["ar-EG"]).toBe(100);
    expect(audit.locales["ar-MSA"]).toBe(100);
    expect(audit.locales["ar-Gulf"]).toBe(100);
    expect(audit.locales.en).toBe(100);
    expect(audit.missingAssets).toBe(0);
    expect(audit.duplicateMappings).toBe(0);
  });

  it("explicitly resolves ar-EG, ar-MSA, ar-Gulf, and en without cross-locale fallback", () => {
    const lessonA = "builder-m7-l1-tables-columns";
    const lessonC = "builder-m6-l3-first-prompt-to-lovable";
    const entries = getControlledV1BrowserManifestEntries();
    const map: Record<string, string> = {};
    for (const e of entries) map[e.assetKey] = `u://${e.cellId}`;
    setControlledV1AssetUrlMapForTests(map);

    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
      const a = resolveControlledV1Visual({ lessonId: lessonA, locale, expectedMethod: "A" });
      const c = resolveControlledV1Visual({ lessonId: lessonC, locale, expectedMethod: "C" });
      expect(a.ok).toBe(true);
      expect(c.ok).toBe(true);
      if (a.ok && c.ok) {
        expect(a.locale).toBe(locale);
        expect(c.locale).toBe(locale);
        expect(a.cellId).toBe(`${lessonA}__${locale}`);
        expect(c.cellId).toBe(`${lessonC}__${locale}`);
        expect(a.url).not.toBe(c.url);
      }
    }

    const wrong = resolveControlledV1Visual({
      lessonId: lessonA,
      locale: "ar-EG",
      expectedMethod: "C",
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.reason).toBe("method_mismatch");
  });

  it("missing locale / unsupported locale / missing lesson fail closed with no fallback", () => {
    const entries = getControlledV1BrowserManifestEntries();
    const map: Record<string, string> = {};
    for (const e of entries) map[e.assetKey] = `u://${e.cellId}`;
    setControlledV1AssetUrlMapForTests(map);

    const missingLesson = resolveControlledV1Visual({
      lessonId: "not-a-real-lesson",
      locale: "ar-EG",
    });
    expect(missingLesson.ok).toBe(false);
    if (!missingLesson.ok) expect(missingLesson.reason).toBe("missing_lesson");

    const unsupported = resolveControlledV1Visual({
      lessonId: "builder-m7-l1-tables-columns",
      locale: "fr-FR",
    });
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok) expect(unsupported.reason).toBe("unsupported_locale");
  });

  it("browser resolver fails on missing emitted asset", () => {
    setControlledV1AssetUrlMapForTests({});
    const r = resolveControlledV1Visual({
      lessonId: "builder-m7-l1-tables-columns",
      locale: "ar-EG",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("missing_emitted_asset");
  });

  it(
    "materializer fails closed on hash mismatch",
    () => {
      const invPath = join(DOCS_CONTROLLED_V1, "RUNTIME_INVENTORY.json");
      const original = readFileSync(invPath, "utf8");
      const doc = JSON.parse(original);
      doc.cells[0].acceptedSha256 = "0".repeat(64);
      writeFileSync(invPath, JSON.stringify(doc));
      try {
        const result = materializeControlledV1RuntimeAssets();
        expect(result.ok).toBe(false);
        expect(result.errors.some((e) => e.includes("hash mismatch"))).toBe(true);
      } finally {
        writeFileSync(invPath, original);
        const restore = materializeControlledV1RuntimeAssets();
        expect(restore.ok).toBe(true);
      }
    },
    180_000,
  );

  it("browser resolver source has no Node-only imports", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserResolver.ts",
      ),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']node:/);
    expect(src).not.toMatch(/require\(["']fs["']\)/);
    expect(src).not.toMatch(/from ["']jszip["']/i);
  });
});
