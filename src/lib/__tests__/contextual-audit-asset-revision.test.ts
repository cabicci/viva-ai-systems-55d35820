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
  expect(ledger.entries).toHaveLength(13);
  expect(
    ledger.entries.flatMap((entry) => entry.auditItems).sort((a, b) => a - b),
  ).toEqual([54, 54, 54, 54, 54, 54, 54, 60, 99, 100, 148, 148, 148]);
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

for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf"]) {
  it("binds audit 148 ordered filming cards for " + locale + " without changing the original", () => {
    const revision = ledger.entries.find((item) =>
      item.auditItems.includes(148) && item.locale === locale,
    )!;
    const original = getContextualV2BrowserManifestEntries().find(
      (entry) => entry.cellId === revision.cellId,
    )!;
    expect(revision.assetDate).toBe("2026-10-19");
    expect(hash(readFileSync("public" + original.publicPath))).toBe(original.assetSha256);
    const bytes = readFileSync("public" + revision.publicPath);
    expect(hash(bytes)).toBe(revision.assetSha256);
    expect(bytes.length).toBe(revision.assetBytes);
    expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    expect(bytes.readUInt32BE(16)).toBe(revision.width);
    expect(bytes.readUInt32BE(20)).toBe(revision.height);
    expect(hash(Buffer.from(readFileSync(revision.sourcePath, "utf8").replace(/\r\n/g, "\n"))))
      .toBe(revision.currentSourceSha256);
    expect(resolveContextualV2Visual({ lessonId: revision.lessonId, locale }))
      .toMatchObject({ ok: true, url: revision.publicPath, assetRevision: { id: revision.revisionId } });
    const date = revision.assetDate;
    try {
      revision.assetDate = "../outside";
      expect(resolveAuditedContextualRevision(original)).toEqual({ ok: false });
    } finally {
      revision.assetDate = date;
    }
  });
}
it("keeps the English filming image on its exact original mapping", () => {
  const original = getContextualV2BrowserManifestEntries().find(
    (entry) => entry.lessonId === "creator-m4-l2-mobile-shooting" && entry.locale === "en",
  )!;
  expect(resolveContextualV2Visual({ lessonId: original.lessonId, locale: "en" }))
    .toMatchObject({ ok: true, url: original.publicPath, assetSha256: original.assetSha256 });
});

for (const revision of ledger.entries.filter((entry) => entry.auditItems.includes(54))) {
  it("resolves the revised lesson title and image together for " + revision.cellId, () => {
    const original = getContextualV2BrowserManifestEntries().find((entry) => entry.cellId === revision.cellId)!;
    const source = Buffer.from(readFileSync(revision.sourcePath, "utf8").replace(/\r\n/g, "\n"));
    expect(JSON.parse(source.toString()).title).toBe(revision.title);
    expect(hash(source)).toBe(revision.currentSourceSha256);
    expect(hash(readFileSync("public" + original.publicPath))).toBe(original.assetSha256);
    const bytes = readFileSync("public" + revision.publicPath);
    expect(hash(bytes)).toBe(revision.assetSha256);
    expect(bytes.length).toBe(revision.assetBytes);
    expect(bytes.readUInt32BE(16)).toBe(revision.width);
    expect(bytes.readUInt32BE(20)).toBe(revision.height);
    expect(resolveContextualV2Visual({ lessonId: revision.lessonId, locale: revision.locale }))
      .toMatchObject({ ok: true, title: revision.title, url: revision.publicPath });
    expect(IMAGE_GALLERY.find((item) => item.lessonSlug === revision.lessonId)?.titles[original.locale])
      .toBe(revision.title);
  });
}
it("keeps the generic Gulf brand image on its original mapping", () => {
  const original = getContextualV2BrowserManifestEntries().find(
    (entry) => entry.lessonId === "creator-m7-l1-brand-basics" && entry.locale === "ar-Gulf",
  )!;
  expect(resolveContextualV2Visual({ lessonId: original.lessonId, locale: "ar-Gulf" }))
    .toMatchObject({ ok: true, url: original.publicPath, title: original.title });
});
