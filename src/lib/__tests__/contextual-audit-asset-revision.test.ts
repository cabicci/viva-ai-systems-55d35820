import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import ledger from "../lesson-visuals/contextual-v2/runtime/contextualV2AuditRevisions.json";
import {
  getContextualV2BrowserManifestEntries,
  resolveContextualV2Visual,
} from "../lesson-visuals/contextual-v2/runtime/contextualV2BrowserResolver";
import { resolveAuditedContextualRevision } from "../lesson-visuals/contextual-v2/runtime/contextualV2AuditRevisionResolver";
import { IMAGE_GALLERY } from "../image-gallery-registry";
const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
it("binds the separately versioned 30-minute image to original and current source without changing original bytes", () => {
  const revision = ledger.entries[0];
  expect(ledger.entries).toHaveLength(3);
  expect(
    ledger.entries.flatMap((entry) => entry.auditItems).sort((a, b) => a - b),
  ).toEqual([60, 99, 100]);
  expect(revision.auditItems).toEqual([60]);
  const original = getContextualV2BrowserManifestEntries().find(
    (entry) => entry.cellId === revision.cellId,
  )!;
  expect(hash(readFileSync("public" + original.publicPath))).toBe(
    original.assetSha256,
  );
  expect(original.title).toContain("١٥");
  const bytes = readFileSync("public" + revision.publicPath);
  expect(hash(bytes)).toBe(revision.assetSha256);
  expect(bytes.length).toBe(revision.assetBytes);
  expect(bytes.readUInt32BE(16)).toBe(revision.width);
  expect(bytes.readUInt32BE(20)).toBe(revision.height);
  const source = Buffer.from(
    readFileSync(revision.sourcePath, "utf8").replace(/\r\n/g, "\n"),
  );
  expect(hash(source)).toBe(revision.currentSourceSha256);
  const result = resolveContextualV2Visual({
    lessonId: revision.lessonId,
    locale: revision.locale,
  });
  expect(result).toMatchObject({
    ok: true,
    url: revision.publicPath,
    title: "Review أسبوعي = ٣٠ دقيقة",
    assetRevision: {
      id: revision.revisionId,
      baseAssetSha256: original.assetSha256,
      currentSourceSha256: revision.currentSourceSha256,
    },
  });
  expect(
    IMAGE_GALLERY.find((item) => item.lessonSlug === revision.lessonId)?.titles[
      "ar-EG"
    ],
  ).toBe(revision.title);
});
it("rejects a revision against mismatched original asset/source identity and leaves other locale mappings exact", () => {
  const revision = ledger.entries[0],
    original = getContextualV2BrowserManifestEntries().find(
      (entry) => entry.cellId === revision.cellId,
    )!;
  expect(
    resolveAuditedContextualRevision({
      ...original,
      assetSha256: "0".repeat(64),
    }),
  ).toEqual({
    ok: false,
  });
  expect(
    resolveAuditedContextualRevision({
      ...original,
      sourceSha256: "0".repeat(64),
    }),
  ).toEqual({
    ok: false,
  });
  for (const locale of ["en", "ar-MSA", "ar-Gulf"]) {
    const entry = getContextualV2BrowserManifestEntries().find(
      (item) => item.lessonId === revision.lessonId && item.locale === locale,
    )!;
    expect(
      resolveContextualV2Visual({ lessonId: revision.lessonId, locale }),
    ).toMatchObject({
      ok: true,
      url: entry.publicPath,
      title: entry.title,
    });
  }
});

for (const item of [99, 100]) {
  it(
    "verifies the separately versioned audit " +
      item +
      " asset and preserves other locales",
    () => {
      const revision = ledger.entries.find((entry) =>
        entry.auditItems.includes(item),
      )!;
      expect(revision).toBeTruthy();
      const original = getContextualV2BrowserManifestEntries().find(
        (entry) => entry.cellId === revision.cellId,
      )!;
      expect(hash(readFileSync("public" + original.publicPath))).toBe(
        original.assetSha256,
      );
      expect(revision.publicPath).not.toBe(original.publicPath);
      const bytes = readFileSync("public" + revision.publicPath);
      expect(hash(bytes)).toBe(revision.assetSha256);
      expect(bytes.length).toBe(revision.assetBytes);
      expect(
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      ).toBe(true);
      expect(bytes.readUInt32BE(16)).toBe(revision.width);
      expect(bytes.readUInt32BE(20)).toBe(revision.height);
      const source = Buffer.from(
        readFileSync(revision.sourcePath, "utf8").replace(/\r\n/g, "\n"),
      );
      expect(hash(source)).toBe(revision.currentSourceSha256);
      expect(
        resolveContextualV2Visual({
          lessonId: revision.lessonId,
          locale: revision.locale,
        }),
      ).toMatchObject({
        ok: true,
        url: revision.publicPath,
        assetRevision: {
          id: revision.revisionId,
          baseAssetSha256: original.assetSha256,
          currentSourceSha256: revision.currentSourceSha256,
        },
      });
      expect(
        resolveAuditedContextualRevision({
          ...original,
          assetSha256: "0".repeat(64),
        }),
      ).toEqual({ ok: false });
      for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf"]) {
        const entry = getContextualV2BrowserManifestEntries().find(
          (candidate) =>
            candidate.lessonId === revision.lessonId &&
            candidate.locale === locale,
        )!;
        expect(
          resolveContextualV2Visual({ lessonId: revision.lessonId, locale }),
        ).toMatchObject({
          ok: true,
          url: entry.publicPath,
          title: entry.title,
        });
      }
    },
  );
}
