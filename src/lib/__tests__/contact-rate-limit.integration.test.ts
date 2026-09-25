import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

let db: PGlite;

describe("contact rate limit contract", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
        SELECT jsonb_build_object('role', current_setting('request.jwt.claim.role', true))
      $$;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      CREATE TABLE public.rate_limit_buckets (
        user_id uuid NOT NULL,
        bucket_key text NOT NULL,
        window_started_at timestamptz NOT NULL DEFAULT now(),
        count integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, bucket_key)
      );
    `);
    await db.exec(
      readFileSync(
        "supabase/migrations/20260616125758_6124cf02-2780-46be-b60a-2d919ecbcdb6.sql",
        "utf8",
      ),
    );
    await db.exec("SELECT set_config('request.jwt.claim.role', 'service_role', false)");
  });

  afterAll(async () => {
    await db?.close();
  });

  it("allows the first call, denies the next, and never increments the denied call", async () => {
    const userId = randomUUID();
    const bucket = "test:contact-rate-limit";
    const consume = async () => {
      const result = await db.exec(
        `SELECT allowed, remaining FROM public.consume_rate_limit('${userId}'::uuid, '${bucket}', 1, 3600)`,
      );
      return result.at(-1)?.rows[0] as { allowed: boolean; remaining: number };
    };

    expect(await consume()).toEqual({ allowed: true, remaining: 0 });
    expect(await consume()).toEqual({ allowed: false, remaining: 0 });

    const count = await db.exec(
      `SELECT count FROM public.rate_limit_buckets WHERE user_id = '${userId}'::uuid AND bucket_key = '${bucket}'`,
    );
    expect(count.at(-1)?.rows[0]).toEqual({ count: 1 });
  });
});
