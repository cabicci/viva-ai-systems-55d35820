import path from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import {
  dockerReady,
  psql,
  resetLocalDatabase,
  startLocalSupabase,
} from "../../../scripts/rag/lib/disposable-db";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const dockerUp = dockerReady();

function psqlAsServiceRole(sql: string): string {
  return psql(`
    BEGIN;
    SET LOCAL ROLE service_role;
    ${sql}
    COMMIT;
  `);
}

describe.skipIf(!dockerUp)("RAG Lovable-native resumable importer (disposable)", () => {
  beforeAll(() => {
    const start = startLocalSupabase({ cwd: REPO_ROOT });
    expect(start.ok).toBe(true);
    const reset = resetLocalDatabase({ cwd: REPO_ROOT });
    expect(reset.ok).toBe(true);
  }, 180_000);

  it("applies migration tables, revokes browser execute, initializes 58 batches", () => {
    const tables = psql(`
      SELECT relname FROM pg_class
      WHERE relname IN ('rag_import_sessions', 'rag_import_batches')
      ORDER BY 1;
    `);
    expect(tables).toContain("rag_import_batches");
    expect(tables).toContain("rag_import_sessions");

    const rls = psql(`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('rag_import_sessions', 'rag_import_batches');
    `);
    expect(rls).toMatch(/t/);

    const anonExec = psql(`
      SELECT has_function_privilege('anon', 'public.rag_initialize_or_resume_import()', 'EXECUTE')::text;
    `);
    expect(anonExec.trim()).toBe("false");

    const authExec = psql(`
      SELECT has_function_privilege('authenticated', 'public.rag_claim_next_import_batch()', 'EXECUTE')::text;
    `);
    expect(authExec.trim()).toBe("false");

    const init = psqlAsServiceRole(`
      SELECT public.rag_initialize_or_resume_import()::text;
    `);
    expect(init).toContain("executionId");
    expect(init).toContain("versionKey");

    const resume = psqlAsServiceRole(`
      SELECT public.rag_initialize_or_resume_import()::text;
    `);
    expect(resume).toContain('"resumed": true');

    const batchCount = psql(`
      SELECT count(*)::text FROM public.rag_import_batches;
    `);
    expect(batchCount.trim()).toBe("58");

    const sizes = psql(`
      SELECT chunk_count::text FROM public.rag_import_batches
      WHERE batch_ordinal IN (0, 57) ORDER BY batch_ordinal;
    `);
    expect(sizes).toMatch(/64/);
    expect(sizes).toMatch(/52/);

    const claim = psqlAsServiceRole(`
      SELECT public.rag_claim_next_import_batch()::text;
    `);
    expect(claim).toContain("leaseToken");
    expect(claim).toContain('"batchOrdinal": 0');

    const status = psqlAsServiceRole(`
      SELECT public.rag_get_import_status()::text;
    `);
    expect(status).toContain("providerAttemptCount");
    expect(status).not.toContain("embedding");
  });

  it("rejects anon direct execute of commit RPC", () => {
    const out = psql(`
      BEGIN;
      SET LOCAL ROLE anon;
      SELECT public.rag_commit_import_batch(
        '00000000-0000-0000-0000-000000000099'::uuid,
        '[]'::jsonb
      );
      COMMIT;
    `);
    expect(out.toLowerCase()).toMatch(/permission denied|forbidden|must be/);
  });
});
