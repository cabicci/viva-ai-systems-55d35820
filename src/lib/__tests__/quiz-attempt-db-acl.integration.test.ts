import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { disposableDbReady, psql } from "../../../scripts/billing/disposable-db";

const ENABLED = process.env.BILLING_DISPOSABLE_DB === "1";

describe.skipIf(!ENABLED)("quiz attempts — trusted server DB writes", () => {
  beforeAll(() => {
    if (process.env.MIGRATIONS_PREAPPLIED !== "1") {
      throw new Error("Quiz ACL proof requires the pre-migrated disposable test database");
    }
    let host = process.env.PGHOST;
    let port = process.env.PGPORT;
    let database = process.env.PGDATABASE ?? "postgres";
    if (process.env.DATABASE_URL) {
      let connection: URL;
      try {
        connection = new URL(process.env.DATABASE_URL);
      } catch {
        throw new Error("Invalid disposable database connection settings");
      }
      if (!["postgres:", "postgresql:"].includes(connection.protocol)) {
        throw new Error("Quiz ACL proof requires a PostgreSQL disposable connection");
      }
      host = connection.hostname;
      port = connection.port;
      database = connection.pathname.slice(1);
    }
    if (
      !host ||
      !["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) ||
      port !== "54322" ||
      database !== "postgres"
    ) {
      throw new Error(
        "Quiz ACL proof requires the harness disposable database on loopback:54322/postgres",
      );
    }
    if (!disposableDbReady()) throw new Error("Disposable database is unavailable");
  });

  it("rejects forged learner writes while retaining service grading, owner reads and review scheduling", () => {
    const owner = randomUUID();
    const other = randomUUID();
    const attempt = randomUUID();
    const lesson = `b017-acl-${randomUUID()}`;
    let output: string;
    try {
      output = psql(`
        BEGIN;
        INSERT INTO auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
        VALUES
          ('${owner}', 'authenticated', 'authenticated', '${owner}@example.invalid', '{}', '{}'),
          ('${other}', 'authenticated', 'authenticated', '${other}@example.invalid', '{}', '{}');

        DO $proof$
        DECLARE role_name text; privilege_name text;
        BEGIN
          FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
            FOREACH privilege_name IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
              IF has_table_privilege(role_name, 'public.lesson_quiz_attempts', privilege_name) THEN
                RAISE EXCEPTION 'Unexpected learner write privilege: % %', role_name, privilege_name;
              END IF;
            END LOOP;
            IF has_function_privilege(role_name, 'public.apply_review_outcome(uuid,text,boolean)', 'EXECUTE')
              OR has_function_privilege(role_name, 'public.process_quiz_attempt_for_review()', 'EXECUTE') THEN
              RAISE EXCEPTION 'Review function exposed to %', role_name;
            END IF;
          END LOOP;
          IF has_table_privilege('anon', 'public.lesson_quiz_attempts', 'SELECT')
            OR NOT has_table_privilege('authenticated', 'public.lesson_quiz_attempts', 'SELECT') THEN
            RAISE EXCEPTION 'Owner-only read grant is not preserved';
          END IF;
          FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
            IF NOT has_table_privilege('service_role', 'public.lesson_quiz_attempts', privilege_name) THEN
              RAISE EXCEPTION 'Required trusted server privilege is missing: %', privilege_name;
            END IF;
          END LOOP;
          IF EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'lesson_quiz_attempts'
              AND policyname IN ('lqa_insert_own', 'lqa_update_own', 'lqa_delete_own')
          ) THEN RAISE EXCEPTION 'Obsolete learner write policy remains'; END IF;
        END;
        $proof$;

        SET LOCAL ROLE service_role;
        SET LOCAL request.jwt.claims = '{"role":"service_role"}';
        INSERT INTO public.lesson_quiz_attempts
          (id, user_id, lesson_id, question_id, selected_index, is_correct, bloom_level)
        VALUES ('${attempt}', '${owner}', '${lesson}', 'trusted-question', 1, true, 'apply');
        RESET ROLE;

        DO $proof$
        BEGIN
          IF (SELECT count(*) FROM public.lesson_review_schedule
              WHERE user_id = '${owner}' AND lesson_id = '${lesson}'
                AND reviews = 1 AND last_reviewed_at IS NOT NULL) <> 1 THEN
            RAISE EXCEPTION 'Trusted insert did not retain the review scheduling trigger';
          END IF;
        END;
        $proof$;

        SET LOCAL ROLE authenticated;
        SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"${owner}"}';
        DO $proof$
        BEGIN
          IF (SELECT count(*) FROM public.lesson_quiz_attempts WHERE id = '${attempt}') <> 1 THEN
            RAISE EXCEPTION 'Owner cannot read the trusted attempt';
          END IF;
          BEGIN
            INSERT INTO public.lesson_quiz_attempts
              (user_id, lesson_id, question_id, selected_index, is_correct, bloom_level)
            VALUES ('${owner}', '${lesson}', 'forged-question', 0, true, 'create');
            RAISE EXCEPTION 'Forged client correctness was accepted';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          BEGIN
            UPDATE public.lesson_quiz_attempts SET is_correct = false, bloom_level = 'create'
              WHERE id = '${attempt}';
            RAISE EXCEPTION 'Client update was accepted';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          BEGIN
            DELETE FROM public.lesson_quiz_attempts WHERE id = '${attempt}';
            RAISE EXCEPTION 'Client delete was accepted';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          BEGIN
            TRUNCATE TABLE public.lesson_quiz_attempts;
            RAISE EXCEPTION 'Client truncate was accepted';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
          BEGIN
            PERFORM public.apply_review_outcome('${owner}', '${lesson}', true);
            RAISE EXCEPTION 'Client called review outcome directly';
          EXCEPTION WHEN insufficient_privilege THEN NULL; END;
        END;
        $proof$;

        SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"${other}"}';
        DO $proof$
        BEGIN
          IF EXISTS (SELECT 1 FROM public.lesson_quiz_attempts WHERE id = '${attempt}') THEN
            RAISE EXCEPTION 'Another learner can read the attempt';
          END IF;
        END;
        $proof$;
        RESET ROLE;

        DO $proof$
        BEGIN
          IF (SELECT count(*) FROM public.lesson_quiz_attempts
              WHERE id = '${attempt}' AND is_correct AND bloom_level = 'apply') <> 1 THEN
            RAISE EXCEPTION 'Rejected client writes changed the trusted result';
          END IF;
        END;
        $proof$;
        SELECT 'B017_QUIZ_ACL_PASS';
        ROLLBACK;
      `);
    } finally {
      const remaining = psql(`SELECT
        (SELECT count(*) FROM auth.users WHERE id IN ('${owner}', '${other}')) +
        (SELECT count(*) FROM public.lesson_quiz_attempts WHERE lesson_id = '${lesson}') +
        (SELECT count(*) FROM public.lesson_review_schedule WHERE lesson_id = '${lesson}');`);
      expect(remaining.trim()).toBe("0");
    }
    expect(output).toContain("B017_QUIZ_ACL_PASS");
  }, 30_000);
});
