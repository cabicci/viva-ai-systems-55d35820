// @vitest-environment node
import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import stage from "../lesson-visuals/contextual-v2/scripts/current-model-source-revision-20261101.json";
import manifest from "../lesson-visuals/contextual-v2/runtime/contextualV2BrowserManifest.json";
import { restoreCurrentModelParentSource } from "../lesson-visuals/contextual-v2/scripts/audit-source-compatibility";
import { CURRENT_INTRO_MODEL_CONCEPTS } from "../locale-lessons/current-intro-model-concept";

const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const blob = (bytes: Buffer) => createHash("sha1").update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex");
for (const change of stage.entries) {
  const identity = { sourcePath: change.sourcePath, sourceSha256: change.generationSourceSha256, sourceBlob: change.generationSourceBlob };
  const current = Buffer.from(readFileSync(change.sourcePath, "utf8").replace(/\r\n/g, "\n"));
  it(`restores only the pinned editorial parent for ${change.sourcePath} without altering current Model content`, () => {
    expect(hash(current)).toBe(change.currentSha256);
    expect(blob(current)).toBe(change.currentBlob);
    const parent = restoreCurrentModelParentSource(identity, current);
    expect(hash(parent)).toBe(change.beforeSha256);
    expect(blob(parent)).toBe(change.beforeBlob);
    expect(parent.toString("utf8")).toBe(change.beforeSource);
    expect(restoreCurrentModelParentSource(identity, parent)).toBe(parent);
    expect(parent.equals(current)).toBe(false);
    const pkg = JSON.parse(current.toString("utf8"));
    const concept = CURRENT_INTRO_MODEL_CONCEPTS[pkg.locale as keyof typeof CURRENT_INTRO_MODEL_CONCEPTS];
    expect(pkg.sections[3].tables[0].rows[1].slice(1)).toEqual([concept.meaning, concept.example]);
    expect(hash(Buffer.from(readFileSync(change.sourcePath, "utf8").replace(/\r\n/g, "\n")))).toBe(change.currentSha256);
  });

  it(`rejects any additional byte or metadata identity drift for ${change.sourcePath}`, () => {
    for (const edited of [Buffer.concat([current, Buffer.from(" ")]), Buffer.concat([current, Buffer.from("\r")]),
      Buffer.from(current.toString("utf8").replace("2026-11-01", "2026-11-02"))]) {
      expect(edited.equals(current)).toBe(false);
      expect(restoreCurrentModelParentSource(identity, edited)).toBe(edited);
    }
    for (const changedIdentity of [
      { ...identity, sourcePath: "unreviewed.json" },
      { ...identity, sourceSha256: "0".repeat(64) },
      { ...identity, sourceBlob: "0".repeat(40) },
    ]) expect(restoreCurrentModelParentSource(changedIdentity, current)).toBe(current);
  });

  it(`keeps original image and generation-source identity exact for ${change.sourcePath}`, () => {
    const entry = manifest.entries.find(e => e.sourcePath === change.sourcePath)!;
    expect(entry.sourceSha256).toBe(change.generationSourceSha256);
    expect(entry.sourceBlob).toBe(change.generationSourceBlob);
    expect(entry.publicPath).toBe(change.publicPath);
    expect(hash(readFileSync("public" + entry.publicPath))).toBe(entry.assetSha256);
    expect(entry.assetSha256).toBe(change.assetSha256);
  });

  it(`fails closed for corrupt parent material or duplicate stages for ${change.sourcePath}`, () => {
    const before = change.beforeSource;
    try {
      change.beforeSource += " ";
      expect(restoreCurrentModelParentSource(identity, current)).toBe(current);
    } finally { change.beforeSource = before; }
    stage.entries.push({ ...change });
    try { expect(restoreCurrentModelParentSource(identity, current)).toBe(current); }
    finally { stage.entries.pop(); }
  });
}

it("limits the source stage to the four Model package changes and the independently recorded visual review", () => {
  expect(stage.entries).toHaveLength(4);
  expect(new Set(stage.entries.map(e => e.sourcePath)).size).toBe(4);
  expect(stage.entries.map(e => e.sourcePath).sort()).toEqual(["ar-EG", "ar-MSA", "ar-Gulf", "en"].map(locale =>
    `src/lib/locale-lessons/${locale}/lessons/intro-m1-l1-what-is-ai.json`).sort());
  expect(stage.currentSourceHead).toBe("9147b849c380ad1325e4b80ace8ff92c1817d997");
  expect(stage.parentSourceHead).toBe("efbc51c5b20977efb861586061211de2cd6c821f");
  expect(stage.visualReviewEvidenceSha256).toBe("16f55f6d3d79a288608c554d27f927e322c3ec9dbdd690be247694dd341f6875");
});
