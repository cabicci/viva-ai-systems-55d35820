import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

const learner = "f0080000-0000-0000-0000-000000000001";
const administrator = "f0080000-0000-0000-0000-000000000002";
let db: PGlite;

// Rehearse the shipped policy against a minimal corpus, without embedding,
// indexing, model calls, production rows or mutable provider state.
describe("LC-08 direct corpus access under the shipped RLS policy", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      CREATE TYPE public.app_role AS ENUM ('admin', 'user');
      CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
      INSERT INTO public.user_roles VALUES ('${administrator}', 'admin');
      CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
        RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
        SET search_path = public AS $$
          SELECT EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = _user_id AND role = _role)
        $$;
      CREATE TABLE public.knowledge_chunks (id integer PRIMARY KEY, content text);
      INSERT INTO public.knowledge_chunks VALUES (1, 'disposable gated lesson fixture');
      ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON public.knowledge_chunks TO anon, authenticated, service_role;
      CREATE POLICY kc_select_authenticated ON public.knowledge_chunks
        FOR SELECT TO authenticated USING (true);
    `);
    const migration = readFileSync(
      "supabase/migrations/20260926180000_rag_corpus_admin_select_only.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
  });

  afterAll(async () => db?.close());

  async function readAs(role: "anon" | "authenticated" | "service_role", user: string) {
    try {
      await db.exec(`BEGIN; SET LOCAL ROLE ${role};
        SELECT set_config('request.jwt.claim.sub', '${user}', true);`);
      return (
        await db.query<{ count: number }>(
          "SELECT count(*)::int AS count FROM public.knowledge_chunks",
        )
      ).rows[0].count;
    } finally {
      await db.exec("ROLLBACK");
    }
  }

  it("denies direct corpus rows to anonymous and ordinary authenticated learners", async () => {
    expect(await readAs("anon", "")).toBe(0);
    expect(await readAs("authenticated", learner)).toBe(0);
  });

  it("does not trust a client-provided admin claim without the server role record", async () => {
    try {
      await db.exec(`BEGIN; SET LOCAL ROLE authenticated;
        SELECT set_config('request.jwt.claim.sub', '${learner}', true);
        SELECT set_config('request.jwt.claim.role', 'admin', true);`);
      const rows = await db.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM public.knowledge_chunks",
      );
      expect(rows.rows[0].count).toBe(0);
    } finally {
      await db.exec("ROLLBACK");
    }
  });

  it("keeps administrator and service retrieval available", async () => {
    expect(await readAs("authenticated", administrator)).toBe(1);
    expect(await readAs("service_role", "")).toBe(1);
  });

  it("denies learner mutation instead of weakening the corpus policy", async () => {
    for (const sql of [
      "INSERT INTO public.knowledge_chunks VALUES (2, 'forged')",
      "UPDATE public.knowledge_chunks SET content='forged' WHERE id=1",
      "DELETE FROM public.knowledge_chunks WHERE id=1",
    ]) {
      try {
        await db.exec(`BEGIN; SET LOCAL ROLE authenticated;
          SELECT set_config('request.jwt.claim.sub', '${learner}', true);`);
        await expect(db.exec(sql)).rejects.toThrow(/permission denied/i);
      } finally {
        await db.exec("ROLLBACK");
      }
    }
    expect(await readAs("service_role", "")).toBe(1);
  });
});
