/** Read-only build/publication check. Never connects to a database or AI provider. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS } from "../../src/lib/curriculum-data";
import { CARD_REGISTRY, sourceIdentity } from "../../src/lib/card-assistant/registry";
import { KIDS_LEVELS } from "../../src/lib/kids/catalogue";
import technicalCatalogue from "../../src/lib/technical-education/catalog.json";
import { verifyCardIntegration, type IntegrationIssue, type AcademicRegistration, type CoverageRecord } from "../../src/lib/card-assistant/integration-contract";
import type { CardMembershipJson } from "../../src/lib/rag/card-membership";
import { buildCurrentAiRelease, loadCurrentAiSources } from "../../src/lib/rag/current-source-release";
import { sha256CanonicalHex, stableCanonicalStringify } from "../../src/lib/rag/canonical-checksum";
import type { PackageManifest, ChunkManifest } from "../../src/lib/rag/types";
import { approvedChunks, sha256 as academicHash, canonicalJson, type ApprovedLesson } from "../../src/lib/academic-education/assistant-corpus";
import { sourceChunks, sha256, technicalSourceJson, type SourceDocument } from "../../src/lib/card-assistant/corpus";
import { verifyAssistantWiring, verifySharedLessonRoutes } from "./integration-wiring";
import { parseAiCommerceRegistration, verifyAiCommerceRegistration, verifyAcademicPolicyRegistration, type AcademicPolicyCourse, type AcademicPolicyRow } from "./access-registration-contract";
import { unpackCorpusJson, verifyEdgeCorpusPackaging } from "./edge-corpus-packaging";

type PublicationSnapshot = {
  schemaVersion: "assistant-publication-v1";
  academicCourses: (AcademicRegistration & AcademicPolicyCourse)[];
  academicPolicies: AcademicPolicyRow[];
  academicLessons: ApprovedLesson[];
  sources: (SourceDocument & { rawJson?: string })[];
};
export async function verifyRepository(repoRoot: string, snapshotFile?: string) {
  const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");
  const packages = JSON.parse(read("artifacts/rag/current/package-manifest.json")) as PackageManifest;
  const chunks = JSON.parse(read("artifacts/rag/current/chunk-manifest.json")) as ChunkManifest;
  const membership = JSON.parse(read("supabase/functions/assistant-runtime/current-card-membership.json")) as CardMembershipJson;
  const issues: IntegrationIssue[] = [];
  try {
    verifyEdgeCorpusPackaging(repoRoot);
    const generated = buildCurrentAiRelease(loadCurrentAiSources(repoRoot));
    for (const [file, expected] of Object.entries({
      "artifacts/rag/current/approval-snapshot.json": generated.approval,
      "artifacts/rag/current/package-manifest.json": generated.packageManifest,
      "artifacts/rag/current/chunk-manifest.json": generated.chunkManifest,
      "artifacts/rag/current/chunks.json": generated.chunks,
    })) if (stableCanonicalStringify(JSON.parse(read(file))) !== stableCanonicalStringify(expected))
      issues.push({ code: "STALE_CURRENT_RELEASE", location: file, message: "Run rag:generate-current and review the changed-source report before publication." });
    if (stableCanonicalStringify(unpackCorpusJson(JSON.parse(read("supabase/functions/assistant-runtime/current-corpus-approval.packed.json")))) !== stableCanonicalStringify(generated.approval))
      issues.push({ code: "STALE_CURRENT_RELEASE", location: "supabase/functions/assistant-runtime/current-corpus-approval.packed.json", message: "Regenerate the reviewed current corpus pack." });
    if (stableCanonicalStringify(generated.membership) !== stableCanonicalStringify(membership))
      issues.push({ code: "STALE_MEMBERSHIP", location: "supabase/functions/assistant-runtime/current-card-membership.json", message: "Run rag:generate-current from approved current sources; do not manually expand station aliases." });
  } catch (cause) { issues.push({ code: "MANIFEST_CONTRACT", location: "artifacts/rag", message: String(cause) }); }
  for (const pkg of packages.packages) {
    try {
      const expectedPath = `src/lib/locale-lessons/${pkg.locale}/lessons/${pkg.lessonId}.json`;
      if (pkg.packagePath !== expectedPath) throw new Error("Source is outside its canonical locale/card path.");
      const raw = read(expectedPath), content = JSON.parse(raw);
      if (sha256CanonicalHex(raw) !== pkg.packageChecksum) throw new Error("Source changed since approval: regenerate and review its manifests.");
      if (content.lessonId !== pkg.lessonId || content.locale !== pkg.locale || content.pathId !== pkg.trackId || content.moduleId !== pkg.moduleId)
        throw new Error("Current payload identity differs from its approved card/station/step/locale.");
    } catch (cause) { issues.push({ code: "CURRENT_SOURCE", location: pkg.packagePath, message: String(cause) }); }
  }
  const actualSources = new Set(CARD_REGISTRY.flatMap(card => card.steps.map(step => sourceIdentity(step.source))));
  const catalogueSources = [
    ...KIDS_LEVELS.flatMap(level => Array.from({ length: level.lessonCount }, (_, i) => `kids:${level.id}:${i + 1}`)),
    ...technicalCatalogue.lessons.map(lesson => `technical:${lesson.id}`),
  ];
  for (const source of catalogueSources) if (!actualSources.has(source))
    issues.push({ code: "MISSING_CARD_REGISTRATION", location: source, message: "Register this live catalogue source with exactly one card and its shared access adapter." });
  for (const source of actualSources) if (!catalogueSources.includes(source))
    issues.push({ code: "ORPHAN_CARD_REGISTRATION", location: source, message: "Register the source in its authoritative catalogue before enabling this card." });

  let academic: AcademicRegistration[] | undefined, coverage: CoverageRecord[] | undefined;
  if (snapshotFile) {
    const snapshot = JSON.parse(fs.readFileSync(snapshotFile, "utf8")) as PublicationSnapshot;
    if (snapshot.schemaVersion !== "assistant-publication-v1" || !Array.isArray(snapshot.academicCourses) || !Array.isArray(snapshot.academicLessons) || !Array.isArray(snapshot.sources) || !Array.isArray(snapshot.academicPolicies))
      throw new Error("Invalid publication snapshot; use the documented assistant-publication-v1 export shape.");
    academic = snapshot.academicCourses; coverage = [];
    issues.push(...verifyAcademicPolicyRegistration(snapshot.academicCourses, snapshot.academicPolicies));
    for (const row of snapshot.academicLessons) {
      let count = 0;
      try { count = (await approvedChunks(row)).length; } catch { /* The coverage verifier reports the affected source below. */ }
      coverage.push({ area: "academic", cardId: row.course_id, stepId: row.lesson_id, locale: row.locale,
        approved: row.approved, sourceSha256: row.source_sha256, verifiedSha256: await academicHash(canonicalJson(row.payload)), chunks: count });
    }
    for (const source of snapshot.sources) {
      let count = 0, hash = "";
      try {
        if (source.area === "kids") {
          if (typeof source.rawJson !== "string" || stableCanonicalStringify(JSON.parse(source.rawJson)) !== stableCanonicalStringify(source.payload)) throw new Error("Original approved storage bytes required.");
          hash = await sha256(source.rawJson);
        } else hash = await sha256(technicalSourceJson(source.payload));
        count = (await sourceChunks(source)).length;
      } catch { /* Fail closed and produce a scoped diagnostic, without printing protected content. */ }
      coverage.push({ area: source.area, cardId: source.cardId, stepId: source.stepId, locale: source.locale,
        approved: true, sourceSha256: source.sourceSha256, verifiedSha256: hash, chunks: count });
    }
  }
  issues.push(...verifyCardIntegration({ paths: PATHS, cards: CARD_REGISTRY, packages: packages.packages, membership, academic, coverage }));
  issues.push(...verifyAiCommerceRegistration(PATHS, parseAiCommerceRegistration(read("supabase/migrations/20261004012000_commerce_access.sql"))));
  issues.push(...verifyAssistantWiring(read));
  const listRoutes = (directory: string): string[] => fs.readdirSync(path.join(repoRoot, directory), { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`COURSE_ROUTE_LINK_UNSUPPORTED: ${directory}/${entry.name}`);
    return entry.isDirectory() ? listRoutes(`${directory}/${entry.name}`) : /\.tsx?$/.test(entry.name) ? [`${directory}/${entry.name}`] : [];
  });
  const routeFiles = listRoutes("src/routes");
  issues.push(...verifySharedLessonRoutes(read, routeFiles));
  return { issues, aiSteps: PATHS.flatMap(card => card.modules.flatMap(station => station.lessons.filter(step => step.state === "available"))).length,
    protectedCards: CARD_REGISTRY.length + (academic?.length ?? 0), protectedCoverageChecked: coverage !== undefined };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const snapshotIndex = args.indexOf("--publication-snapshot");
    if (args.length !== 0 && !(args.length === 2 && snapshotIndex === 0 && args[1]))
      throw new Error("Usage: bun run scripts/assistant/verify-card-integration.ts [--publication-snapshot <file.json>]");
    const result = await verifyRepository(process.cwd(), snapshotIndex < 0 ? undefined : path.resolve(args[snapshotIndex + 1]));
    for (const issue of result.issues) console.error(`[${issue.code}] ${issue.location}: ${issue.message}`);
    if (result.issues.length) { console.error(`Assistant integration blocked: ${result.issues.length} issue(s).`); process.exitCode = 1; }
    else console.log(`Assistant integration passed: ${result.aiSteps} AI steps; ${result.protectedCards} protected card registrations; common template and access adapters checked.`);
    if (!result.protectedCoverageChecked) console.log("Protected source coverage was NOT checked against live DB/storage. Runtime approval/hash/access checks remain required; provide --publication-snapshot for protected content publication verification.");
  } catch (cause) { console.error(`Assistant integration blocked: ${String(cause)}`); process.exitCode = 1; }
}
