/**
 * Disposable-only validation for Lovable-native resumable importer (PR #9).
 * Authorization: CR-RAG-PR9-DISPOSABLE-VALIDATION-20260727-01
 * Mocked vectors only. Never Production / never real OpenAI.
 */
import path from "node:path";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import {
  dockerReady,
  psql,
  resetLocalDatabase,
  startLocalSupabase,
  statusLocalSupabase,
  supabaseDbContainer,
} from "../../../scripts/rag/lib/disposable-db";
import { admitLockedCorpusFromRaw } from "@/lib/rag/lovable-native/admission";
import {
  LOCKED_ARTIFACT_DIGESTS,
  LOCKED_CHUNK_COUNT,
  LOCKED_PACKAGE_COUNT,
  LOCKED_SOURCE_SHA,
} from "@/lib/rag/lovable-native/contracts";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const dockerUp = dockerReady();

function psqlAsServiceRole(sql: string): string {
  return psql(`
    BEGIN;
    SET LOCAL ROLE service_role;
    DO $c$ BEGIN
      IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'service_role required';
      END IF;
    END $c$;
    ${sql}
    COMMIT;
  `);
}

function fakeVec(seed: string, dims = 1536): number[] {
  const out: number[] = [];
  for (let i = 0; i < dims; i++) {
    out.push(((seed.charCodeAt(i % seed.length) * 131 + i * 17) % 1000) / 1000);
  }
  return out;
}

function vecLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

function readArtifact(name: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, "artifacts/rag", name), "utf8");
}

function sha256File(name: string): string {
  return createHash("sha256")
    .update(fs.readFileSync(path.join(REPO_ROOT, "artifacts/rag", name)))
    .digest("hex");
}

describe.skipIf(!dockerUp)("RAG Lovable-native resumable importer (disposable)", () => {
  beforeAll(() => {
    const start = startLocalSupabase({ cwd: REPO_ROOT });
    expect(start.ok).toBe(true);
    const reset = resetLocalDatabase({ cwd: REPO_ROOT });
    expect(reset.ok).toBe(true);

    const status = statusLocalSupabase({ cwd: REPO_ROOT });
    expect(status.ok).toBe(true);
    expect(status.output).toMatch(/127\.0\.0\.1:54322|localhost:54322/);
    expect(status.output).not.toMatch(/masaarat\.ai/);
    // Connection host must be loopback (project ref may appear only in local container names).
    const hostMatch = status.output.match(/@([^:/]+):54322/);
    if (hostMatch) {
      expect(["127.0.0.1", "localhost", "::1"]).toContain(hostMatch[1]);
    }
    const container = supabaseDbContainer();
    expect(container).toMatch(/^supabase_db_/);
  }, 300_000);

  it("proves schema, RLS, grants, and RPC security surface", () => {
    const tables = psql(`
      SELECT relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND relname IN ('rag_import_sessions','rag_import_batches')
      ORDER BY 1;
    `);
    expect(tables).toContain("rag_import_batches");
    expect(tables).toContain("rag_import_sessions");

    const rls = psql(`
      SELECT c.relname || ':' || c.relrowsecurity::text
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('rag_import_sessions','rag_import_batches')
      ORDER BY 1;
    `);
    expect(rls).toMatch(/rag_import_batches:t/);
    expect(rls).toMatch(/rag_import_sessions:t/);

    const fns = [
      "rag_initialize_or_resume_import()",
      "rag_get_import_status()",
      "rag_claim_next_import_batch()",
      "rag_commit_import_batch(uuid,jsonb)",
      "rag_fail_import_batch(uuid,text)",
      "rag_validate_staging_import()",
      "rag_get_import_evidence()",
      "rag_deactivate_first_active_version(text)",
    ];
    for (const fn of fns) {
      const meta = psql(`
        SELECT p.prosecdef::text || '|' || coalesce(p.proconfig::text,'') || '|' ||
          has_function_privilege('anon', 'public.${fn}', 'EXECUTE')::text || '|' ||
          has_function_privilege('authenticated', 'public.${fn}', 'EXECUTE')::text || '|' ||
          has_function_privilege('service_role', 'public.${fn}', 'EXECUTE')::text
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname='public' AND p.oid = to_regprocedure('public.${fn}');
      `);
      expect(meta).toMatch(/^true\|/);
      expect(meta).toMatch(/search_path/);
      expect(meta).toMatch(/\|false\|false\|true/);
    }

    try {
      psql(`
        BEGIN;
        SET LOCAL ROLE anon;
        SELECT public.rag_initialize_or_resume_import();
        COMMIT;
      `);
      expect.unreachable("anon execute should fail");
    } catch (err) {
      expect(String(err).toLowerCase()).toMatch(/permission denied|forbidden|psql failed/);
    }

    try {
      psql(`
        BEGIN;
        SET LOCAL ROLE authenticated;
        SELECT public.rag_claim_next_import_batch();
        COMMIT;
      `);
      expect.unreachable("authenticated execute should fail");
    } catch (err) {
      expect(String(err).toLowerCase()).toMatch(/permission denied|forbidden|psql failed/);
    }
  });

  it("admits locked corpus digests and 400/3700 locale totals", async () => {
    expect(sha256File("package-manifest.json")).toBe(LOCKED_ARTIFACT_DIGESTS.packageManifestSha256);
    expect(sha256File("chunk-manifest.json")).toBe(LOCKED_ARTIFACT_DIGESTS.chunkManifestSha256);
    expect(sha256File("chunks.json")).toBe(LOCKED_ARTIFACT_DIGESTS.chunksSha256);
    expect(sha256File("authoritative-lookup.json")).toBe(
      LOCKED_ARTIFACT_DIGESTS.authoritativeLookupSha256,
    );
    const corpus = await admitLockedCorpusFromRaw({
      packageManifestRaw: readArtifact("package-manifest.json"),
      chunkManifestRaw: readArtifact("chunk-manifest.json"),
      chunksRaw: readArtifact("chunks.json"),
      authoritativeLookupRaw: readArtifact("authoritative-lookup.json"),
    });
    expect(corpus.packageManifest.packages.length).toBe(LOCKED_PACKAGE_COUNT);
    expect(corpus.chunks.length).toBe(LOCKED_CHUNK_COUNT);
    expect(corpus.packageManifest.sourceSha).toBe(LOCKED_SOURCE_SHA);
  });

  it("initializes one session with 58 batches and resumes without duplication", () => {
    const init = psqlAsServiceRole(`SELECT public.rag_initialize_or_resume_import()::text;`);
    expect(init).toContain('"resumed": false');
    expect(init).toContain("executionId");
    expect(init).toContain("versionKey");

    const counts = psql(`
      SELECT
        (SELECT count(*) FROM public.rag_import_sessions)::text || '|' ||
        (SELECT count(*) FROM public.rag_import_batches)::text || '|' ||
        (SELECT count(*) FROM public.rag_index_versions WHERE status='staging')::text || '|' ||
        (SELECT count(*) FROM public.rag_index_versions WHERE status='active')::text || '|' ||
        (SELECT count(*) FROM public.knowledge_chunks WHERE source_type='locale_lesson')::text;
    `);
    expect(counts.trim()).toBe("1|58|1|0|0");

    const sizes = psql(`
      SELECT batch_ordinal::text || ':' || chunk_count::text || ':' || chunk_offset::text
      FROM public.rag_import_batches
      WHERE batch_ordinal IN (0,56,57)
      ORDER BY batch_ordinal;
    `);
    expect(sizes).toContain("0:64:0");
    expect(sizes).toContain("56:64:3584");
    expect(sizes).toContain("57:52:3648");

    const resume = psqlAsServiceRole(`SELECT public.rag_initialize_or_resume_import()::text;`);
    expect(resume).toContain('"resumed": true');
    const after = psql(`
      SELECT count(*)::text FROM public.rag_import_sessions;
    `);
    expect(after.trim()).toBe("1");
  });

  it("enforces exclusive claim/lease and one-batch commit with mocked vectors", async () => {
    const corpus = await admitLockedCorpusFromRaw({
      packageManifestRaw: readArtifact("package-manifest.json"),
      chunkManifestRaw: readArtifact("chunk-manifest.json"),
      chunksRaw: readArtifact("chunks.json"),
      authoritativeLookupRaw: readArtifact("authoritative-lookup.json"),
    });

    const claimA = psqlAsServiceRole(`SELECT public.rag_claim_next_import_batch()::text;`);
    expect(claimA).toContain('"batchOrdinal": 0');
    expect(claimA).toContain("leaseToken");
    const lease = claimA.match(/"leaseToken":\s*"([^"]+)"/)?.[1];
    expect(lease).toBeTruthy();

    // Concurrent claim must not re-lease batch 0; it may take the next pending ordinal.
    const claimB = psqlAsServiceRole(`SELECT public.rag_claim_next_import_batch()::text;`);
    expect(claimB).not.toContain('"batchOrdinal": 0');
    const leaseB = claimB.match(/"leaseToken":\s*"([^"]+)"/)?.[1];
    expect(leaseB).toBeTruthy();
    expect(leaseB).not.toBe(lease);

    // Release concurrent lease so later retry exercises batch 1 cleanly.
    if (claimB.includes('"batchOrdinal": 1') && leaseB) {
      psqlAsServiceRole(`
        SELECT public.rag_fail_import_batch('${leaseB}'::uuid, 'PROVIDER_FAILED')::text;
      `);
    }

    // Wrong lease rejected
    try {
      psql(`
        BEGIN;
        SET LOCAL ROLE service_role;
        SELECT public.rag_commit_import_batch(
          '00000000-0000-0000-0000-000000000099'::uuid,
          '[]'::jsonb
        );
        COMMIT;
      `);
      expect.unreachable("wrong lease should fail");
    } catch (err) {
      expect(String(err).toLowerCase()).toMatch(/invalid_lease|psql failed|exception/);
    }

    const versionKeyMatch = claimA.match(/"versionKey":\s*"([^"]+)"/);
    expect(versionKeyMatch?.[1]).toBeTruthy();
    const versionKey = versionKeyMatch![1]!;
    const slice = corpus.chunks.slice(0, 64);
    const pkgByPath = new Map(
      corpus.packageManifest.packages.map((p) => [p.packagePath, p] as const),
    );
    const rows = slice.map((chunk, i) => {
      const pkg = pkgByPath.get(chunk.packagePath)!;
      return {
        sourceId: chunk.chunkId,
        sourceType: "locale_lesson",
        indexState: "staging",
        indexVersion: versionKey,
        sourceSha: LOCKED_SOURCE_SHA,
        pathId: chunk.trackId,
        moduleId: chunk.moduleId,
        lessonId: chunk.lessonId,
        title: chunk.sectionHeading.slice(0, 500),
        content: chunk.displayText,
        locale: chunk.locale,
        packagePath: chunk.packagePath,
        packageChecksum: pkg.packageChecksum,
        chunkChecksum: chunk.textChecksum,
        contentVersion: pkg.canonicalVersion,
        sectionIndex: chunk.sectionIndex,
        sectionRole: chunk.sectionRole,
        chunkPosition: chunk.chunkIndex,
        contentType: chunk.contentType,
        productionRoute: chunk.productionRoute,
        embedding: fakeVec(`${chunk.chunkId}:${i}`),
      };
    });

    const legacyBefore = psql(
      `SELECT count(*)::text FROM public.knowledge_chunks WHERE source_type='lesson';`,
    ).trim();

    const rowsJson = JSON.stringify(rows).replace(/'/g, "''");
    const commit = psqlAsServiceRole(`
      SELECT public.rag_commit_import_batch('${lease}'::uuid, '${rowsJson}'::jsonb)::text;
    `);
    expect(commit).toContain('"ok": true');
    expect(commit).toContain('"acceptedRowCount": 64');

    const stagingCount = psql(`
      SELECT count(*)::text FROM public.knowledge_chunks
      WHERE source_type='locale_lesson' AND index_state='staging';
    `).trim();
    expect(stagingCount).toBe("64");

    const legacyAfter = psql(
      `SELECT count(*)::text FROM public.knowledge_chunks WHERE source_type='lesson';`,
    ).trim();
    expect(legacyAfter).toBe(legacyBefore);

    // Claim batch 1 (or retry failed batch 1), fail provider, then retry with mocked vectors.
    const claim1 = psqlAsServiceRole(`SELECT public.rag_claim_next_import_batch()::text;`);
    expect(claim1).toContain('"batchOrdinal": 1');
    const lease1Match = claim1.match(/"leaseToken":\s*"([^"]+)"/);
    expect(lease1Match?.[1]).toBeTruthy();
    const lease1 = lease1Match![1]!;
    const fail = psqlAsServiceRole(`
      SELECT public.rag_fail_import_batch('${lease1}'::uuid, 'PROVIDER_FAILED')::text;
    `);
    expect(fail).toContain("PROVIDER_FAILED");
    const afterFail = psql(`
      SELECT count(*)::text FROM public.knowledge_chunks
      WHERE source_type='locale_lesson' AND index_state='staging';
    `).trim();
    expect(afterFail).toBe("64");

    const claimRetry = psqlAsServiceRole(`SELECT public.rag_claim_next_import_batch()::text;`);
    expect(claimRetry).toContain('"batchOrdinal": 1');
    const leaseRetryMatch = claimRetry.match(/"leaseToken":\s*"([^"]+)"/);
    expect(leaseRetryMatch?.[1]).toBeTruthy();
    const leaseRetry = leaseRetryMatch![1]!;
    const slice1 = corpus.chunks.slice(64, 128);
    const rows1 = slice1.map((chunk, i) => {
      const pkg = pkgByPath.get(chunk.packagePath)!;
      return {
        sourceId: chunk.chunkId,
        sourceType: "locale_lesson",
        indexState: "staging",
        indexVersion: versionKey,
        sourceSha: LOCKED_SOURCE_SHA,
        pathId: chunk.trackId,
        moduleId: chunk.moduleId,
        lessonId: chunk.lessonId,
        title: chunk.sectionHeading.slice(0, 500),
        content: chunk.displayText,
        locale: chunk.locale,
        packagePath: chunk.packagePath,
        packageChecksum: pkg.packageChecksum,
        chunkChecksum: chunk.textChecksum,
        contentVersion: pkg.canonicalVersion,
        sectionIndex: chunk.sectionIndex,
        sectionRole: chunk.sectionRole,
        chunkPosition: chunk.chunkIndex,
        contentType: chunk.contentType,
        productionRoute: chunk.productionRoute,
        embedding: fakeVec(`${chunk.chunkId}:r${i}`),
      };
    });
    const rows1Json = JSON.stringify(rows1).replace(/'/g, "''");
    const commitRetry = psqlAsServiceRole(`
      SELECT public.rag_commit_import_batch('${leaseRetry}'::uuid, '${rows1Json}'::jsonb)::text;
    `);
    expect(commitRetry).toContain('"ok": true');
    expect(
      psql(`
        SELECT count(*)::text FROM public.knowledge_chunks
        WHERE source_type='locale_lesson' AND index_state='staging';
      `).trim(),
    ).toBe("128");
  });

  it("refuses claim 68 via provider-attempt ceiling", () => {
    // Force session near ceiling
    psql(`
      UPDATE public.rag_import_sessions
      SET provider_attempt_total = 67
      WHERE status IN ('initialized','running');
    `);
    try {
      psql(`
        BEGIN;
        SET LOCAL ROLE service_role;
        SELECT public.rag_claim_next_import_batch();
        COMMIT;
      `);
      expect.unreachable("attempt 68 should fail");
    } catch (err) {
      expect(String(err)).toMatch(/PROVIDER_ATTEMPT_CEILING/);
    }
    // restore for later tests
    psql(`
      UPDATE public.rag_import_sessions
      SET provider_attempt_total = LEAST(provider_attempt_total, 10)
      WHERE status IN ('initialized','running','completed');
    `);
  });

  it("validation fails closed for incomplete staging and never activates", () => {
    const validation = psqlAsServiceRole(`SELECT public.rag_validate_staging_import()::text;`);
    expect(validation).toContain('"ok": false');
    expect(validation).toMatch(/INCOMPLETE_BATCHES|STAGING_COUNT_MISMATCH|ACCEPTED_COUNT/);
    const active = psql(
      `SELECT count(*)::text FROM public.rag_index_versions WHERE status='active';`,
    ).trim();
    expect(active).toBe("0");
  });

  it("preserves protected fixture rows across lifecycle operations", () => {
    // Seed protected fixtures
    psql(`
      INSERT INTO public.knowledge_chunks (
        source_type, source_id, path_id, module_id, lesson_id, title, content, embedding
      ) VALUES (
        'lesson', 'legacy-protect-1', 'analyst', 'm1', 'l1', 'legacy', 'legacy content',
        '${vecLiteral(fakeVec("legacy"))}'::extensions.vector
      );
    `);
    const fp = psql(`
      SELECT md5(string_agg(source_id || '|' || source_type || '|' || coalesce(index_state,''), ',' ORDER BY source_id))
      FROM public.knowledge_chunks
      WHERE source_id IN ('legacy-protect-1') OR source_type='lesson';
    `).trim();

    psqlAsServiceRole(`SELECT public.rag_get_import_status()::text;`);
    psqlAsServiceRole(`SELECT public.rag_get_import_evidence()::text;`);

    const fp2 = psql(`
      SELECT md5(string_agg(source_id || '|' || source_type || '|' || coalesce(index_state,''), ',' ORDER BY source_id))
      FROM public.knowledge_chunks
      WHERE source_id IN ('legacy-protect-1') OR source_type='lesson';
    `).trim();
    expect(fp2).toBe(fp);
  });

  it("activation boundary: product server actions wrap activate/deactivate with guards", () => {
    const lifecycle = fs.readFileSync(
      path.join(REPO_ROOT, "src/lib/rag-production-lifecycle.functions.ts"),
      "utf8",
    );
    const executor = fs.readFileSync(
      path.join(REPO_ROOT, "src/lib/rag/lovable-native/executor.server.ts"),
      "utf8",
    );
    const panel = fs.readFileSync(
      path.join(REPO_ROOT, "src/components/admin/RagLovableNativeImportPanel.tsx"),
      "utf8",
    );
    expect(executor).toContain("activate_rag_index_version");
    expect(executor).toContain("rag_deactivate_first_active_version");
    expect(lifecycle).toContain("activateAuthorizedRagIndexVersion");
    expect(lifecycle).toContain("rollbackAuthorizedRagIndexVersion");
    expect(lifecycle).not.toContain("rollback_rag_index_version");
    expect(lifecycle).toContain("await assertAdmin(context)");
    expect(panel).toContain("Activate");
    expect(panel).toContain("Rollback");
    expect(panel).toContain("activateEligible");
    expect(panel).not.toMatch(/activate_rag_index_version/);
  });

  it("optional first-activation reversal works only on disposable fixture", () => {
    // Isolated fixture: create staging then force-activate via direct update is not allowed.
    // Insert a synthetic active version with no superseded history.
    const key = "rag-index-v1-fixture-first-active";
    psql(`
      INSERT INTO public.rag_index_versions (
        version_key, source_sha, status, package_count, chunk_count,
        chunk_manifest_checksum, embedding_model
      ) VALUES (
        '${key}', '${LOCKED_SOURCE_SHA}', 'active', 1, 1, 'fixture', 'text-embedding-3-small'
      )
      ON CONFLICT (version_key) DO UPDATE SET status='active', superseded_at=NULL;
      DELETE FROM public.rag_index_versions WHERE status='superseded';
    `);
    const out = psqlAsServiceRole(`
      SELECT public.rag_deactivate_first_active_version('${key}')::text;
    `);
    expect(out).toContain('"ok": true');
    expect(
      psql(`SELECT count(*)::text FROM public.rag_index_versions WHERE status='active';`).trim(),
    ).toBe("0");
  });
});
