import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCardMembership, loadCardMembershipFromRepo } from "@/lib/rag/card-membership";
import type { ChunkManifest, PackageManifest } from "@/lib/rag/types";

const root = path.resolve(import.meta.dirname, "../../..");
function manifests() {
  return {
    packages: JSON.parse(readFileSync(path.join(root, "artifacts/rag/package-manifest.json"), "utf8")) as PackageManifest,
    chunks: JSON.parse(readFileSync(path.join(root, "artifacts/rag/chunk-manifest.json"), "utf8")) as ChunkManifest,
  };
}

describe("additive runtime card membership", () => {
  it("matches the deterministic checked-in map without rewriting frozen content lookup artifacts", () => {
    const before = readFileSync(path.join(root, "artifacts/rag/authoritative-lookup.json"));
    const expected = loadCardMembershipFromRepo(root);
    const actual = JSON.parse(readFileSync(path.join(root, "supabase/functions/assistant-runtime/card-membership.json"), "utf8"));
    expect(actual).toEqual(expected);
    expect(Object.keys(actual.records)).toHaveLength(manifests().packages.packages.length);
    expect(readFileSync(path.join(root, "artifacts/rag/authoritative-lookup.json")).equals(before)).toBe(true);
  });

  it.each(["trackId", "moduleId"] as const)("rejects package/chunk %s mismatch", (field) => {
    const { packages, chunks } = manifests();
    chunks.chunks[0][field] = "forged";
    expect(() => buildCardMembership(packages, chunks)).toThrow("Card/station metadata mismatch");
  });

  it("rejects a lesson assigned to another card in one locale", () => {
    const { packages, chunks } = manifests();
    const first = chunks.chunks[0];
    for (const pkg of packages.packages.filter((p) => p.lessonId === first.lessonId && p.locale === first.locale)) {
      pkg.trackId = "other-card";
      pkg.productionRoute = "/learn/other-card/step";
    }
    chunks.chunks.filter((c) => c.lessonId === first.lessonId && c.locale === first.locale).forEach((c) => { c.trackId = "other-card"; });
    expect(() => buildCardMembership(packages, chunks)).toThrow("Ambiguous card");
  });

  it("rejects citation routes pointing to another card", () => {
    const { packages, chunks } = manifests();
    packages.packages[0].productionRoute = "/learn/foreign-card/step";
    expect(() => buildCardMembership(packages, chunks)).toThrow("Cross-card production route");
  });

  it("registers a new card without editing a name whitelist", () => {
    const { packages, chunks } = manifests();
    const chunk = { ...chunks.chunks[0], trackId: "future-card", moduleId: "future-station" };
    const pkg = { ...packages.packages.find((p) => p.packagePath === chunk.packagePath)!, trackId: chunk.trackId, moduleId: chunk.moduleId, productionRoute: "/learn/future-card/step" };
    const map = buildCardMembership({ ...packages, packages: [pkg] }, { ...chunks, chunks: [chunk] });
    expect(Object.values(map.records)[0]).toMatchObject({ trackId: "future-card", moduleId: "future-station", contextModuleIds: ["future-station"] });
  });

  it("limits station aliases to the exact lesson with approved locale metadata drift", () => {
    const map = loadCardMembershipFromRepo(root);
    expect(map.records["en|analyst-m5-ab-testing"].contextModuleIds).toEqual(["analyst-m5", "analyst-m6"]);
    expect(map.records["en|analyst-m1-l1-from-automation-to-insight"].contextModuleIds).toEqual(["analyst-m1"]);
  });
});
