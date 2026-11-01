// @vitest-environment node
import { expect, it, vi } from "vitest";
import path from "node:path";
import fs from "node:fs";
import packageJson from "../locale-lessons/ar-EG/lessons/intro-m1-l1-what-is-ai.json";
import { WHAT_IS_AI_CONTENT } from "../../components/intro/lessons/intro-m1-l1-what-is-ai";
import { CURRENT_INTRO_MODEL_CONCEPT, CURRENT_INTRO_MODEL_CONCEPTS } from "../locale-lessons/current-intro-model-concept";
import { assertCurrentLessonPackageParity, currentLessonPackageRevision, projectCurrentIntroModelPackage } from "../rag/current-lesson-parity";
import { buildCurrentAiRelease, loadCurrentAiSources, type CurrentAiSource } from "../rag/current-source-release";
import { validateCurrentRelease } from "../rag/current-release/corpus";
import { executeCurrentRelease } from "../rag/current-release/executor.server";
import { confirmationFor, type CurrentExecutorDependencies } from "../rag/current-release/contracts";
import { sha256CanonicalHex } from "../rag/canonical-checksum";
import { matchesCurrentApprovedContent, isValidCurrentApproval } from "../../../supabase/functions/assistant-runtime/current-corpus-admission";
import { decodePackedCorpus } from "../../../supabase/functions/assistant-runtime/packed-corpus";
import packed from "../../../supabase/functions/assistant-runtime/current-corpus-approval.packed.json";
import type { RagLocalizedLessonPackage } from "../locale-lessons/types";
import type { RagChunkRecord } from "../rag/types";

const root = path.resolve(import.meta.dirname, "../../..");
const pkg = packageJson as RagLocalizedLessonPackage;
const sources = loadCurrentAiSources(root);
const release = buildCurrentAiRelease(sources);
const corpus = validateCurrentRelease(release.approval, release.chunks);
const target = sources.find(s => s.record.locale === "ar-EG" && s.record.lessonId === pkg.lessonId)!;
const glossary = corpus.chunks.filter(c => c.locale === "ar-EG" && c.lessonId === pkg.lessonId && c.sectionIndex === 3);
const OLD_RELEASE = "11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5";
const oldVersion = "rag-current-v1-" + OLD_RELEASE;
function replaceSource(payload: RagLocalizedLessonPackage): CurrentAiSource {
  const raw = JSON.stringify(payload);
  const owner = sources.find(s => s.record.locale === payload.locale && s.record.lessonId === payload.lessonId)!;
  return { payload, raw, record: { ...owner.record, canonicalVersion: payload.canonicalVersion, packageChecksum: sha256CanonicalHex(raw) } };
}
const vector = () => Array(1536).fill(0.25) as number[];
function candidate(c: RagChunkRecord) {
  return { sourceId: c.chunkId, locale: c.locale, lessonId: c.lessonId, pathId: c.trackId, moduleId: c.moduleId,
    packagePath: c.packagePath, packageChecksum: release.approval.packages[`${c.locale}|${c.lessonId}`].packageChecksum,
    chunkChecksum: c.textChecksum, content: c.displayText, sourceSha: release.approval.releaseId, indexVersion: release.approval.indexVersion,
    indexState: "active", sectionIndex: c.sectionIndex, sectionRole: c.sectionRole, chunkPosition: c.chunkIndex, contentType: c.contentType };
}

it("indexes the same Model definition that the current Egyptian lesson displays", () => {
  const block = WHAT_IS_AI_CONTENT[3].block;
  if (block.kind !== "concepts") throw new Error("Expected concepts");
  const model = block.items[1];
  expect(pkg.sections[3].tables[0].rows[1]).toEqual([model.term, model.meaning, model.example]);
});

it("uses the shared reviewed object without changing the displayed wording", () => {
  const block = WHAT_IS_AI_CONTENT[3].block;
  if (block.kind !== "concepts") throw new Error("Expected concepts");
  expect(block.items[1]).toBe(CURRENT_INTRO_MODEL_CONCEPT);
  expect(CURRENT_INTRO_MODEL_CONCEPT.meaning).toBe("نظام ذكاء اصطناعي اتدرّب على بيانات وأمثلة، وبيستخدم الأنماط اللي اتعلمها عشان يولّد رد على طلبك. ده غير تطبيق الدردشة اللي بتستخدمه.");
  expect(CURRENT_INTRO_MODEL_CONCEPT.example).toBe("ChatGPT تطبيق دردشة بيشغّل موديلات؛ الموديل هو اللي بيعالج طلبك ويولّد الرد. اسم التطبيق واسم الموديل مش نفس الحاجة.");
});

it("generates two bounded glossary chunks from the displayed concept and admits them at the Edge", () => {
  expect(glossary).toHaveLength(2);
  const text = glossary.map(c => c.displayText).join("\n");
  expect(text).toContain(CURRENT_INTRO_MODEL_CONCEPT.meaning);
  expect(text).toContain(CURRENT_INTRO_MODEL_CONCEPT.example);
  expect(text).not.toContain("اسم البرنامج الجاهز اللي بتتكلم معاه");
  for (const c of glossary) {
    expect(c.charCount).toBeLessThanOrEqual(1200);
    expect(sha256CanonicalHex(c.displayText)).toBe(c.textChecksum);
    expect(matchesCurrentApprovedContent(candidate(c), "ar-EG", release.approval)).toBe(true);
  }
});

it("generates the complete new content-hash release through the established source path", async () => {
  expect(release.approval.releaseId).toBe("0c0f31b61c596fd6b8687bb156911f8d28613581af0fcf5f7ac4063dce3c1b85");
  expect(release.packageManifest.packageCount).toBe(400);
  expect(release.chunks).toHaveLength(3851);
  expect(release.approval.releaseId).not.toBe(OLD_RELEASE);
  expect(isValidCurrentApproval(release.approval)).toBe(true);
  const decoded = await decodePackedCorpus(packed);
  expect(decoded).toEqual(release.approval);
  const stored = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/current/approval-snapshot.json"), "utf8"));
  expect(stored).toEqual(release.approval);
});

it("changes the package revision with its content, without relabeling it as the old freeze", () => {
  expect(pkg.canonicalVersion).toBe(currentLessonPackageRevision(pkg));
  expect(pkg.canonicalVersion).not.toBe("curriculum-freeze-ar-eg-ts-v1");
  const changed = structuredClone(pkg);
  changed.sections[0].contentMarkdown += " Fixture content change.";
  expect(currentLessonPackageRevision(changed)).not.toBe(pkg.canonicalVersion);
  expect(() => assertCurrentLessonPackageParity(changed)).toThrow("REVISION_MISMATCH");
});

it("rejects a stale package revision even if raw checksums and record metadata are internally valid", () => {
  const changed = structuredClone(pkg);
  changed.canonicalVersion = "curriculum-freeze-ar-eg-ts-v1";
  expect(() => buildCurrentAiRelease(sources.map(s => s === target ? replaceSource(changed) : s))).toThrow("REVISION_MISMATCH");
});

it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"].flatMap(locale => ["table", "bullets", "markdown"].map(field => [locale, field])))
("rejects stale %s / %s representation even after recalculating its revision", (locale, field) => {
  const source = sources.find(s => s.record.locale === locale && s.record.lessonId === pkg.lessonId)!;
  const changed = structuredClone(source.payload);
  if (field === "table") changed.sections[3].tables[0].rows[1][1] = "Old or altered definition";
  if (field === "bullets") changed.sections[3].bullets.push("Old or altered definition");
  if (field === "markdown") changed.sections[3].contentMarkdown = "Old or altered definition";
  changed.canonicalVersion = currentLessonPackageRevision(changed);
  expect(() => buildCurrentAiRelease(sources.map(s => s === source ? replaceSource(changed) : s))).toThrow("CURRENT_LESSON_");
});

it("rejects record/payload version disagreement without changing source identities", () => {
  expect(() => buildCurrentAiRelease(sources.map(s => s === target ? { ...s, record: { ...s.record, canonicalVersion: "old" } } : s)))
    .toThrow("RECORD_REVISION_MISMATCH");
});

it("keeps the projection deterministic and bounded to the commissioned locale/lesson", () => {
  expect(projectCurrentIntroModelPackage(pkg as RagLocalizedLessonPackage)).toEqual(pkg);
  expect(() => projectCurrentIntroModelPackage({ ...pkg, lessonId: "another-lesson" } as RagLocalizedLessonPackage)).toThrow("CORRECTION_SCOPE");
});

it("rejects a known previous glossary row under the new source approval", () => {
  const frozen = JSON.parse(fs.readFileSync(path.join(root, "artifacts/rag/chunks.json"), "utf8")) as RagChunkRecord[];
  const old = frozen.find(c => c.chunkId === "ar-EG/intro-m1-l1-what-is-ai/s3/c0")!;
  expect(old.textChecksum).toBe("efe2c0acb50b63e9220714e32c53f0d78bda91d731c66da258d696be4545899a");
  const row = candidate(old);
  row.sourceSha = OLD_RELEASE; row.indexVersion = oldVersion;
  expect(matchesCurrentApprovedContent(row, "ar-EG", release.approval)).toBe(false);
});

it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])("reuses unchanged inputs and embeds only the measured new inputs in %s's actual batch", async locale => {
  const changedIds = new Set(corpus.chunks.filter(c => c.lessonId === pkg.lessonId && c.sectionIndex === 3).map(c => c.chunkId));
  const first = corpus.chunks.findIndex(c => c.locale === locale && changedIds.has(c.chunkId));
  const ordinal = Math.floor(first / 64);
  const selected = corpus.chunks.slice(ordinal * 64, ordinal * 64 + 64);
  const missing = selected.filter(c => changedIds.has(c.chunkId));
  const unchanged = selected.filter(c => !changedIds.has(c.chunkId));
  const cached = unchanged.map(c => ({ chunkId: c.chunkId, pathId: c.trackId, lessonId: c.lessonId, content: c.displayText,
    chunkChecksum: c.textChecksum, locale: c.locale, embedding: vector(), model: "text-embedding-3-small", dimensions: 1536,
    sourceSha: OLD_RELEASE, registrySourceSha: OLD_RELEASE, indexState: "active", versionStatus: "active", indexingFailed: false }));
  const deps: CurrentExecutorDependencies = {
    authorized: vi.fn(async () => true), load: () => corpus,
    embed: vi.fn(async texts => ({ vectors: texts.map(vector) })),
    rpc: vi.fn(async (name, args) => {
      if (name === "rag_current_claim") return { leaseToken: "33333333-3333-4333-8333-333333333333", chunkIds: selected.map(c => c.chunkId) };
      if (name === "rag_reusable_embeddings") return cached;
      if (name === "rag_current_reserve_provider") return { reserved: true };
      if (name === "rag_current_commit") return { committed: true, count: (args.p_rows as unknown[]).length };
      throw new Error("Unexpected fixture RPC " + name);
    }),
  };
  const response = await executeCurrentRelease({ operation: "batch", releaseId: corpus.approval.releaseId,
    executionId: "22222222-2222-4222-8222-222222222222", requestId: "11111111-1111-4111-8111-111111111111",
    confirmation: confirmationFor("batch", corpus.approval.releaseId) }, deps);
  expect(missing).toHaveLength(locale === "ar-EG" || locale === "en" ? 2 : 1);
  expect(response).toMatchObject({ committed: true, providerCalls: 1, reusedChunks: unchanged.length });
  expect(deps.embed).toHaveBeenCalledExactlyOnceWith(missing.map(c => c.displayText));
  const calls = vi.mocked(deps.rpc).mock.calls;
  expect(calls.map(c => c[0])).toEqual(["rag_current_claim", "rag_reusable_embeddings", "rag_current_reserve_provider", "rag_current_commit"]);
  expect(calls.at(-1)![1].p_release_id).toBe(release.approval.releaseId);
  expect((calls.at(-1)![1].p_rows as { content: string }[]).map(r => r.content)).toEqual(selected.map(c => c.displayText));
});

it("does not accept the old release request against the new approved source", async () => {
  const deps: CurrentExecutorDependencies = { authorized: async () => true, load: () => corpus,
    rpc: vi.fn(), embed: vi.fn() };
  await expect(executeCurrentRelease({ operation: "status", releaseId: OLD_RELEASE,
    requestId: "11111111-1111-4111-8111-111111111111" }, deps)).rejects.toThrow("CURRENT_RELEASE_CHANGED");
  expect(deps.rpc).not.toHaveBeenCalled();
  expect(deps.embed).not.toHaveBeenCalled();
});

it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)("binds the %s candidate to its own Model concept, representations and current revision", locale => {
  const source = sources.find(s => s.record.locale === locale && s.record.lessonId === pkg.lessonId)!;
  const p = source.payload;
  const concept = CURRENT_INTRO_MODEL_CONCEPTS[locale];
  expect(p.sections[3].tables[0].rows[1].slice(1)).toEqual([concept.meaning, concept.example]);
  expect(projectCurrentIntroModelPackage(p)).toEqual(p);
  expect(p.canonicalVersion).toBe(currentLessonPackageRevision(p));
  const text = corpus.chunks.filter(c => c.locale === locale && c.lessonId === pkg.lessonId && c.sectionIndex === 3).map(c => c.displayText).join("\n");
  expect(text).toContain(concept.meaning);
  expect(text).toContain(concept.example);
  const stale = structuredClone(p);stale.canonicalVersion = "old-revision";
  expect(() => buildCurrentAiRelease(sources.map(s => s === source ? replaceSource(stale) : s))).toThrow("REVISION_MISMATCH");
  expect(() => assertCurrentLessonPackageParity(p, null)).toThrow("RECORD_REVISION_MISMATCH");
});

it("limits this source parity gate to the commissioned lesson and four locales", () => {
  const other = { ...pkg, lessonId: "uncommissioned-lesson", canonicalVersion: "unchanged-other-version" };
  expect(() => assertCurrentLessonPackageParity(other)).not.toThrow();
  expect(() => projectCurrentIntroModelPackage(other)).toThrow("CORRECTION_SCOPE");
});
