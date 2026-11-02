// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- Assert heterogeneous SQL receipts and deliberately malformed commands in an isolated database. */
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { resolve, relative, isAbsolute, join } from "node:path";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { commercialPolicyBaseline } from "@/lib/billing/__tests__/commercial-policy-fixture";
import { prepareIntake } from "./prepare.server";
import { intakeFixture } from "./test-fixture";
import { curriculumChunks } from "./corpus";
import { intakeCanonical } from "./package";
import { sha256 } from "@/lib/card-assistant/corpus";

const user = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
const admin = "99999999-9999-4999-8999-999999999999";
const child = "33333333-3333-4333-8333-333333333333";
let db: PGlite;
let migrationDir = "";
const value = async <T = any>(sql: string, args: unknown[] = []) =>
  (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
const service = () => db.exec("RESET ROLE;SELECT set_config('fixture.service','yes',false)");
const actor = async (id: string) => {
  await db.exec("RESET ROLE");
  await db.query(
    "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('fixture.service','no',false)",
    [id],
  );
  await db.exec("SET ROLE authenticated");
};
const adminCommand = async (action: string, data: object = {}, who = admin) => {
  await service();
  return value("SELECT public.curriculum_admin($1,$2,$3) v", [who, action, JSON.stringify(data)]);
};
const scope = { area: "technical", course: "fixture-course", lesson: "step-one", locale: "en" };
const command = (action: string, data: object = {}) =>
  value("SELECT public.curriculum_command($1,$2) v", [
    action,
    JSON.stringify({ ...scope, ...data }),
  ]);
beforeAll(async () => {
  db = new PGlite({ extensions: { vector } });
  await db.exec(
    "CREATE SCHEMA extensions;CREATE EXTENSION vector WITH SCHEMA extensions;CREATE FUNCTION extensions.digest(bytea,text) RETURNS bytea LANGUAGE sql IMMUTABLE AS $$SELECT sha256($1)$$",
  );
  await db.exec(commercialPolicyBaseline);
  await db.exec(readFileSync("drizzle/migrations/0027_commercial_policy_20261102.sql", "utf8"));
  await db.exec(`GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
   ALTER TABLE public.academic_lesson_content ADD COLUMN source_sha256 text, ADD COLUMN payload jsonb;
   ALTER TABLE public.technical_lesson_content ADD COLUMN source_sha256 text, ADD COLUMN payload jsonb;
   UPDATE public.academic_lesson_content SET source_sha256=repeat('a',64),payload='{}';
   UPDATE public.technical_lesson_content SET source_sha256=repeat('a',64),payload='{}';
   ALTER TABLE public.kids_profiles ADD CONSTRAINT fixture_profile_parent FOREIGN KEY(parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   CREATE TABLE public.lesson_progress(user_id uuid,lesson_id text,status text);
   CREATE TABLE public.lesson_notes(user_id uuid,lesson_id text,content text);
   CREATE TABLE public.lesson_quiz_attempts(id uuid DEFAULT gen_random_uuid(),user_id uuid,lesson_id text,question_id text,selected_index int,is_correct bool,bloom_level text);
   CREATE TABLE public.mission_submissions(id uuid DEFAULT gen_random_uuid(),user_id uuid,lesson_id text,mission_id text,submission_text text,score int,status text);
   CREATE TABLE public.academic_progress(user_id uuid,course_id text,lesson_id text,read bool,quiz_passed bool,drafts jsonb);
   CREATE TABLE public.technical_progress(user_id uuid,lesson_id text,read bool,quiz_passed bool,drafts jsonb);
   CREATE TABLE public.kids_lesson_progress(profile_id uuid,level_id text,lesson_number int,locale text);
   CREATE TABLE public.journey_visits(user_id uuid,line text,course_id text,profile_id uuid,lesson_id text,locale text);
   CREATE TABLE public.user_mission_state(user_id uuid,mission_id text,state text);
   CREATE SCHEMA learning_private;
   CREATE FUNCTION learning_private.kids_journey(uuid,text) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
   CREATE FUNCTION public.academic_command(text,text DEFAULT NULL,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
   CREATE FUNCTION public.technical_command(text,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;`);
  const learning = readFileSync(
    "drizzle/migrations/0031_student_learning_records.sql",
    "utf8",
  ).replace("CREATE SCHEMA learning_private;", "");
  await db.exec(learning);
  await db.exec(
    readFileSync("drizzle/migrations/0033_commercial_family_lock_order.sql", "utf8").replaceAll(
      "\r\n",
      "\n",
    ),
  );
  await db.exec(
    `CREATE FUNCTION public.rag_require_service_role() RETURNS void LANGUAGE plpgsql AS $$BEGIN PERFORM billing.commercial_require_service();END$$;`,
  );
  await db.exec(
    "CREATE TABLE public.rag_current_batches(state text,lease_until timestamptz,provider_reserved boolean)",
  );
  // Install the actual existing durable job/lease/receipt authority.
  await db.exec(readFileSync("scripts/assistant/automatic-indexing-candidate.sql", "utf8"));
  await db.exec(`CREATE TABLE public.assistant_auto_source_events(event_id bigserial PRIMARY KEY,area text,source_key text,locale text,source_sha text,withdrawn bool,job_id text);
    UPDATE public.assistant_auto_policy SET enabled=true;`);
  const tempRoot = resolve(".unified-test-cache");
  mkdirSync(tempRoot, { recursive: true });
  migrationDir = mkdtempSync(join(tempRoot, "curriculum-native-"));
  mkdirSync(join(migrationDir, "meta"));
  const applied = readFileSync("drizzle/migrations/0034_course_intake.sql", "utf8").replaceAll(
    "\r\n",
    "\n",
  );
  expect(createHash("sha256").update(applied).digest("hex")).toBe(
    "7f236e5d7428a37e608f86eb144e3c0b47ab259c78e1256e6d77f748b060f60d",
  );
  writeFileSync(join(migrationDir, "0034_course_intake.sql"), applied);
  writeFileSync(
    join(migrationDir, "meta", "_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "postgresql",
      entries: [
        {
          idx: 0,
          version: "7",
          when: 1793658835471,
          tag: "0034_course_intake",
          breakpoints: true,
        },
      ],
    }),
  );
  await migrate(drizzle(db), { migrationsFolder: migrationDir });
  // The reviewed real correction runs against the exact applied foundation.
  await db.exec(readFileSync("scripts/course-intake/child-command-erasure.sql", "utf8"));
}, 60000);
afterAll(async () => {
  await db?.close();
  if (migrationDir) {
    const contained = relative(
      realpathSync(resolve(".unified-test-cache")),
      realpathSync(migrationDir),
    );
    if (!contained || contained.startsWith("..") || isAbsolute(contained))
      throw new Error("Unsafe fixture cleanup target");
    rmSync(migrationDir, { recursive: true });
  }
});

async function prepareCourse(
  pkg: ReturnType<typeof intakeFixture>,
  expectedActive: string | null = null,
) {
  const prepared = await prepareIntake(JSON.stringify(pkg));
  await adminCommand("stage", { prepared });
  await adminCommand("approve", {
    area: pkg.area,
    course: pkg.id,
    version: prepared.version,
    expectedActive,
    reviewed: true,
  });
  return prepared.version;
}
async function finishCourse(area: string, course: string) {
  await service();
  const metadata = (await value("SELECT public.curriculum_index_metadata() v")).find(
    (x: any) => x.area === area && x.id === course,
  );
  const manifest = {
    schemaVersion: "assistant-auto-v1",
    adapter: "curriculum",
    build: "b".repeat(64),
    area,
    cardId: course,
    curriculumVersion: metadata.version,
    scopes: metadata.scopes,
    sourceRevision: metadata.sourceRevision,
    scopeCount: metadata.scopes.length + 1,
    issue: null,
  };
  const material = intakeCanonical(manifest);
  const key = await sha256(material);
  await value("SELECT public.assistant_auto_register($1,'[]') v", [
    JSON.stringify([{ key, material }]),
  ]);
  for (let i = 0; i < manifest.scopeCount; i++) {
    const lease = await value("SELECT public.assistant_auto_claim($1,$2) v", [
      JSON.stringify([key]),
      crypto.randomUUID(),
    ]);
    expect(lease.claimed).toBe(true);
    const args = { p_job: lease.jobId, p_request: lease.requestId, p_lease: lease.leaseToken };
    if (i === manifest.scopeCount - 1)
      await value("SELECT public.curriculum_index_operation('publish',$1) v", [
        JSON.stringify(args),
      ]);
    else {
      const source = await value("SELECT public.curriculum_index_operation('source',$1) v", [
        JSON.stringify(args),
      ]);
      const rows = (await curriculumChunks(source.payload)).map((c) => ({
        ...c,
        embedding: JSON.stringify(Array(1536).fill(0.1)),
      }));
      await value("SELECT public.curriculum_index_operation('commit',$1) v", [
        JSON.stringify({ ...args, rows }),
      ]);
    }
    await value("SELECT public.assistant_auto_finish($1,$2,$3,$4,'{}') v", [
      lease.jobId,
      lease.requestId,
      lease.leaseToken,
      i === manifest.scopeCount - 1,
    ]);
  }
}

describe.sequential(
  "curriculum intake, actual billing, durable indexing and learner records in PostgreSQL",
  () => {
    let version: string;
    it("stages only through protected admin authority and keeps every course inactive", async () => {
      const prepared = await prepareIntake(JSON.stringify(intakeFixture()));
      version = prepared.version;
      await expect(adminCommand("stage", { prepared }, user)).rejects.toThrow(/ADMIN_REQUIRED/);
      expect(await adminCommand("stage", { prepared })).toMatchObject({ version, state: "draft" });
      expect(await adminCommand("stage", { prepared })).toMatchObject({ replay: true });
      expect(await value("SELECT public.curriculum_catalogue('technical','en') v")).toEqual([]);
      expect(await value("SELECT count(*)::int v FROM curriculum_private.lessons")).toBe(1);
    });
    it("does not allow authenticated/direct anonymous calls to the writer or private keys", async () => {
      await actor(user);
      await expect(value("SELECT private_keys v FROM curriculum_private.versions")).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        value("SELECT public.curriculum_admin($1,'list','{}') v", [admin]),
      ).rejects.toThrow(/permission denied/);
      await expect(command("lesson")).rejects.toThrow(/ACCESS_REQUIRED/);
    });
    it("requires exact review and only queues the candidate, without publishing content", async () => {
      await expect(
        adminCommand("approve", { ...scope, version, expectedActive: null }),
      ).rejects.toThrow(/REVIEW_REQUIRED/);
      expect(
        await adminCommand("approve", { ...scope, version, reviewed: true, expectedActive: null }),
      ).toMatchObject({ state: "indexing" });
      expect(await value("SELECT public.curriculum_index_metadata() v")).toHaveLength(1);
      expect(await value("SELECT public.curriculum_catalogue('technical','en') v")).toEqual([]);
    });
    it("uses the existing queue lease and refuses an incomplete index before activation", async () => {
      await service();
      const metadata = (await value("SELECT public.curriculum_index_metadata() v"))[0];
      const manifest = {
        schemaVersion: "assistant-auto-v1",
        adapter: "curriculum",
        build: "b".repeat(64),
        area: "technical",
        cardId: scope.course,
        curriculumVersion: version,
        scopes: metadata.scopes,
        sourceRevision: metadata.sourceRevision,
        scopeCount: 2,
        issue: null,
      };
      const material = intakeCanonical(manifest);
      const key = await sha256(material);
      await value("SELECT public.assistant_auto_register($1,'[]') v", [
        JSON.stringify([{ key, material }]),
      ]);
      let lease = await value("SELECT public.assistant_auto_claim($1,$2) v", [
        JSON.stringify([key]),
        crypto.randomUUID(),
      ]);
      let args = { p_job: lease.jobId, p_request: lease.requestId, p_lease: lease.leaseToken };
      await expect(
        value("SELECT public.curriculum_index_operation('publish',$1) v", [JSON.stringify(args)]),
      ).rejects.toThrow(/INCOMPLETE/);
      const source = await value("SELECT public.curriculum_index_operation('source',$1) v", [
        JSON.stringify(args),
      ]);
      const chunks = await curriculumChunks(source.payload);
      const rows = chunks.map((c) => ({ ...c, embedding: JSON.stringify(Array(1536).fill(0.1)) }));
      const fake = rows.map((r, i) =>
        i === 0 ? { ...r, content: "Unapproved invented teaching", contentSha: "a".repeat(64) } : r,
      );
      await expect(
        value("SELECT public.curriculum_index_operation('commit',$1) v", [
          JSON.stringify({ ...args, rows: fake }),
        ]),
      ).rejects.toThrow(/CHUNK_INVALID/);
      await expect(
        value("SELECT public.curriculum_index_operation('commit',$1) v", [
          JSON.stringify({ ...args, rows: [] }),
        ]),
      ).rejects.toThrow(/CHUNKS_INVALID/);
      expect(
        await value("SELECT public.curriculum_index_operation('commit',$1) v", [
          JSON.stringify({ ...args, rows }),
        ]),
      ).toMatchObject({ committed: true });
      expect(
        await value("SELECT public.assistant_auto_finish($1,$2,$3,false,'{}') v", [
          lease.jobId,
          lease.requestId,
          lease.leaseToken,
        ]),
      ).toBe(true);
      lease = await value("SELECT public.assistant_auto_claim($1,$2) v", [
        JSON.stringify([key]),
        crypto.randomUUID(),
      ]);
      args = { p_job: lease.jobId, p_request: lease.requestId, p_lease: lease.leaseToken };
      expect(
        await value("SELECT public.curriculum_index_operation('publish',$1) v", [
          JSON.stringify(args),
        ]),
      ).toMatchObject({ activated: true });
      expect(
        await value("SELECT public.assistant_auto_finish($1,$2,$3,true,'{}') v", [
          lease.jobId,
          lease.requestId,
          lease.leaseToken,
        ]),
      ).toBe(true);
      expect(await value("SELECT public.curriculum_catalogue('technical','en') v")).toHaveLength(1);
      expect(
        await value(
          "SELECT count(*)::int v FROM learning_private.course_models WHERE course='fixture-course' AND is_current AND 'notes'=ANY(activities)",
        ),
      ).toBe(1);
    });
    it("adds exact course choices to purchases/invitations but never creates free access", async () => {
      await service();
      expect(
        await value(
          "SELECT billing.commercial_selection_valid($1,'technical','fixture-course',NULL) v",
          [user],
        ),
      ).toBe(true);
      expect(await value("SELECT billing.email_access_catalogues() v")).toContainEqual(
        expect.objectContaining({ id: "technical:fixture-course" }),
      );
      expect(
        await value(
          "SELECT billing.assistant_content_allowed($1,'technical','fixture-course','step-one','en',NULL) v",
          [user],
        ),
      ).toBe(false);
      await db.query(
        "INSERT INTO billing.email_access_grants(id,recipient_email,scope_mode,catalogues,user_id,activated_at,grant_kind) VALUES($1,'one@example.invalid','selected',ARRAY['technical:fixture-course'],$2,now(),'single_curriculum')",
        [crypto.randomUUID(), user],
      );
      const sources = await db.query(
        "SELECT units FROM billing.assistant_source_specs($1,'technical','fixture-course',NULL,now())",
        [user],
      );
      expect(sources.rows).toEqual([{ units: 100 }]);
    });
    it("opens only the entitled account, records notes/progress, and grades on the server", async () => {
      await actor(other);
      await expect(command("lesson")).rejects.toThrow(/ACCESS_REQUIRED/);
      await actor(user);
      const lesson = await command("lesson");
      expect(JSON.stringify(lesson)).not.toMatch(/correctIndex|assessmentKeys/);
      const opened = await command("start", {
        version,
        section: "quiz",
        requestId: crypto.randomUUID(),
      });
      const requestId = crypto.randomUUID();
      const result = await command("submit", {
        section: "quiz",
        attemptId: opened.attemptId,
        submission: { "q-one": 1 },
        requestId,
      });
      expect(result).toMatchObject({ passed: true, score: 1, total: 1 });
      expect(
        await command("submit", {
          section: "quiz",
          attemptId: opened.attemptId,
          submission: { "q-one": 1 },
          requestId,
        }),
      ).toEqual(result);
      await expect(
        command("submit", {
          section: "quiz",
          attemptId: opened.attemptId,
          submission: { "q-one": 0 },
          requestId,
        }),
      ).rejects.toThrow(/CONFLICT/);
      const started = await command("start", {
        version,
        section: "task",
        requestId: crypto.randomUUID(),
      });
      expect(
        await command("submit", {
          section: "task",
          attemptId: started.attemptId,
          submission: { response: "Evidence" },
          requestId: crypto.randomUUID(),
        }),
      ).toMatchObject({ state: "awaiting_review", competenceVerified: false });
      expect((await command("lesson")).events).toContainEqual(
        expect.objectContaining({ section: "quiz", completed: true }),
      );
      expect((await command("lesson")).events).toContainEqual(
        expect.objectContaining({ section: "task", completed: false }),
      );
    });
    it("saves student notes through the existing conflict-safe authority", async () => {
      await actor(user);
      const lesson = await command("lesson");
      expect(
        (
          await value("SELECT public.learning_command('detail',$1) v", [
            JSON.stringify({ recordId: lesson.recordId }),
          ])
        ).events,
      ).toContainEqual(expect.objectContaining({ lessonTitle: "Step" }));
      expect(
        await value("SELECT public.learning_command('save_note',$1) v", [
          JSON.stringify({
            recordId: lesson.recordId,
            lesson: scope.lesson,
            locale: "en",
            content: "My private observation",
            revision: 0,
            requestId: crypto.randomUUID(),
          }),
        ]),
      ).toMatchObject({ content: "My private observation" });
      await actor(other);
      await expect(
        value("SELECT public.learning_command('detail',$1) v", [
          JSON.stringify({ recordId: lesson.recordId }),
        ]),
      ).rejects.toThrow(/RECORD_REQUIRED/);
    });
    it("preserves a pinned open exam across a newer active edition and keeps its historical model", async () => {
      await actor(user);
      const attempt = await command("start", {
        section: "quiz",
        version,
        requestId: crypto.randomUUID(),
      });
      const draftRequest = crypto.randomUUID();
      expect(
        await command("save_draft", {
          section: "quiz",
          attemptId: attempt.attemptId,
          revision: 0,
          submission: { "q-one": 1 },
          requestId: draftRequest,
        }),
      ).toMatchObject({ state: "draft_saved", revision: 1 });
      expect(
        await command("save_draft", {
          section: "quiz",
          attemptId: attempt.attemptId,
          revision: 0,
          submission: { "q-one": 1 },
          requestId: draftRequest,
        }),
      ).toMatchObject({ state: "draft_saved", revision: 1 });
      expect(
        await command("save_draft", {
          section: "quiz",
          attemptId: attempt.attemptId,
          revision: 0,
          submission: { "q-one": 0 },
          requestId: crypto.randomUUID(),
        }),
      ).toMatchObject({ state: "draft_conflict", revision: 1, draft: { "q-one": 1 } });
      const next = intakeFixture();
      next.assessmentKeys[0].keys[0].correctIndex = 0;
      next.stations[0].steps[0].content.en.sections[0].paragraphs = [
        "Updated reviewed explanation",
      ];
      const nextVersion = await prepareCourse(next, version);
      await finishCourse(scope.area, scope.course);
      await actor(user);
      expect(await command("lesson")).toMatchObject({
        version,
        attempts: [
          expect.objectContaining({ id: attempt.attemptId, draft: { "q-one": 1 }, revision: 1 }),
        ],
      });
      expect(
        await command("submit", {
          section: "quiz",
          attemptId: attempt.attemptId,
          submission: { "q-one": 1 },
          requestId: crypto.randomUUID(),
        }),
      ).toMatchObject({ passed: true });
      expect((await command("lesson")).version).toBe(nextVersion);
      await service();
      expect(
        await value(
          "SELECT model_version v FROM learning_private.events WHERE origin='curriculum_command' AND content_version=$1 AND kind='quiz' ORDER BY recorded_at DESC LIMIT 1",
          [version],
        ),
      ).toBe(version);
      expect(
        await value("SELECT count(*)::int v FROM learning_private.course_models WHERE course=$1", [
          scope.course,
        ]),
      ).toBe(2);
      version = nextVersion;
    });
    it.each(["ai", "academic", "technical", "kids"])(
      "admits %s curricula through the same system with separate entitlement and learner identities",
      async (area) => {
        const pkg = intakeFixture();
        pkg.area = area;
        pkg.id = `fixture-${area}`;
        pkg.stations[0].steps[0].id = `step-${area}`;
        pkg.assessmentKeys[0].lessonId = `step-${area}`;
        await prepareCourse(pkg);
        await finishCourse(area, pkg.id);
        await service();
        await db.query(
          "INSERT INTO billing.email_access_grants(id,recipient_email,scope_mode,catalogues,user_id,activated_at,grant_kind) VALUES($1,'one@example.invalid','selected',ARRAY[$2],$3,now(),'single_curriculum')",
          [crypto.randomUUID(), `${area}:${pkg.id}`, user],
        );
        const kid = area === "kids" ? child : null;
        const previousIdentity = await value("SELECT auth.uid() v");
        expect(
          await value("SELECT billing.assistant_content_allowed($1,$2,$3,$4,'en',$5) v", [
            user,
            area,
            pkg.id,
            `step-${area}`,
            kid,
          ]),
        ).toBe(true);
        // Verify service consent checks restored the previous caller identity.
        expect(await value("SELECT auth.uid() v")).toBe(previousIdentity);
        expect(
          await value("SELECT billing.assistant_content_allowed($1,$2,$3,$4,'en',$5) v", [
            other,
            area,
            pkg.id,
            `step-${area}`,
            kid,
          ]),
        ).toBe(false);
        await actor(user);
        const opened = await command("lesson", {
          area,
          course: pkg.id,
          lesson: `step-${area}`,
          ...(kid ? { profileId: kid } : {}),
        });
        expect(opened.recordId).toBeTruthy();
        if (area === "kids") {
          expect(
            await value("SELECT public.learning_command('save_note',$1) v", [
              JSON.stringify({
                recordId: opened.recordId,
                lesson: `step-${area}`,
                locale: "en",
                revision: 0,
                content: "Child's course note",
                requestId: crypto.randomUUID(),
              }),
            ]),
          ).toMatchObject({ revision: 1 });
        }
        expect(JSON.stringify(opened)).not.toMatch(/correctIndex|assessmentKeys/);
        await service();
        const retrieval = await value(
          "SELECT public.curriculum_assistant_source($1,$2,$3,$4,'en',$5,$6) v",
          [user, area, pkg.id, `step-${area}`, kid, JSON.stringify(Array(1536).fill(0.1))],
        );
        expect(retrieval.chunks.length).toBeGreaterThan(0);
        expect(retrieval.chunks.every((c: { lesson: string }) => c.lesson === `step-${area}`)).toBe(
          true,
        );
        expect(JSON.stringify(retrieval)).not.toMatch(/correctIndex|Question\?/);
        const question = crypto.randomUUID();
        const reserved = await value(
          "SELECT public.reserve_assistant_question($1,$2,$3,$4,'en',$5,$6,$7) v",
          [user, area, pkg.id, `step-${area}`, kid, question, "f".repeat(64)],
        );
        expect(reserved).toMatchObject({ allowed: true });
        expect(
          await value("SELECT public.settle_assistant_question($1,$2,$3,'answered',$4) v", [
            user,
            question,
            "f".repeat(64),
            JSON.stringify({
              status: 200,
              body: { answer: "Test evidence" },
              proof: [{ lessonId: `step-${area}` }],
            }),
          ]),
        ).toMatchObject({ charged_units: 1 });
      },
    );
    it("retains unlimited admin review without inventing a child or a learner result", async () => {
      await actor(admin);
      expect(
        await command("lesson", {
          area: "kids",
          course: "fixture-kids",
          lesson: "step-kids",
          profileId: admin,
        }),
      ).toMatchObject({ reviewOnly: true, recordId: null });
      await expect(
        command("start", {
          area: "kids",
          course: "fixture-kids",
          lesson: "step-kids",
          profileId: admin,
          version,
          requestId: crypto.randomUUID(),
          section: "quiz",
        }),
      ).rejects.toThrow(/REVIEW_READ_ONLY/);
      await service();
      expect(
        await value(
          "SELECT count(*)::int v FROM learning_private.courses WHERE account_id=$1 AND area='kids'",
          [admin],
        ),
      ).toBe(0);
      expect(
        await value("SELECT public.assistant_question_balance($1,'kids','fixture-kids',$1) v", [
          admin,
        ]),
      ).toMatchObject({ unlimited: true, admin_review: true });
    });
    it("respects live account holds and the original Technical release control", async () => {
      await service();
      await db.query("UPDATE auth.users SET blocked=true WHERE id=$1", [user]);
      expect(
        await value(
          "SELECT billing.assistant_content_allowed($1,'technical','fixture-course','step-one','en',NULL) v",
          [user],
        ),
      ).toBe(false);
      await db.query("UPDATE auth.users SET blocked=false WHERE id=$1", [user]);
      await db.exec("UPDATE public.technical_release_control SET enabled=false");
      expect(
        await value(
          "SELECT billing.assistant_content_allowed($1,'technical','fixture-course','step-one','en',NULL) v",
          [user],
        ),
      ).toBe(false);
      await db.exec("UPDATE public.technical_release_control SET enabled=true");
    });
    it("erases a removed child's command receipts and drafts with its learning record, preserving the parent's records", async () => {
      await actor(user);
      const kidScope = {
        area: "kids",
        course: "fixture-kids",
        lesson: "step-kids",
        profileId: child,
      };
      const opened = await command("lesson", kidScope);
      const start = await command("start", {
        ...kidScope,
        version: opened.version,
        section: "quiz",
        requestId: crypto.randomUUID(),
      });
      await command("save_draft", {
        ...kidScope,
        section: "quiz",
        attemptId: start.attemptId,
        revision: 0,
        submission: { "q-one": 1 },
        requestId: crypto.randomUUID(),
      });
      await service();
      const adult = await value(
        "SELECT count(*)::int v FROM curriculum_private.commands WHERE parameters->'data'->>'profileId' IS NULL",
      );
      expect(
        await value(
          "SELECT count(*)::int v FROM curriculum_private.commands WHERE parameters->'data'->>'profileId'=$1",
          [child],
        ),
      ).toBeGreaterThan(0);
      await db.query("DELETE FROM public.kids_profiles WHERE id=$1", [child]);
      expect(
        await value(
          "SELECT count(*)::int v FROM curriculum_private.commands WHERE parameters->'data'->>'profileId'=$1",
          [child],
        ),
      ).toBe(0);
      expect(
        await value("SELECT count(*)::int v FROM curriculum_private.attempts WHERE profile_id=$1", [
          child,
        ]),
      ).toBe(0);
      expect(
        await value(
          "SELECT count(*)::int v FROM curriculum_private.commands WHERE parameters->'data'->>'profileId' IS NULL",
        ),
      ).toBe(adult);
    });
    it("erases another removed account's receipts without affecting the remaining learner", async () => {
      await service();
      await db.query(
        "INSERT INTO billing.email_access_grants(id,recipient_email,scope_mode,catalogues,user_id,activated_at,grant_kind) VALUES($1,'two@example.invalid','selected',ARRAY['technical:fixture-technical'],$2,now(),'single_curriculum')",
        [crypto.randomUUID(), other],
      );
      await actor(other);
      const target = { area: "technical", course: "fixture-technical", lesson: "step-technical" };
      const lesson = await command("lesson", target);
      await command("complete", {
        ...target,
        version: lesson.version,
        section: "intro",
        requestId: crypto.randomUUID(),
      });
      await service();
      const ownerCount = await value(
        "SELECT count(*)::int v FROM curriculum_private.commands WHERE account_id=$1",
        [user],
      );
      expect(
        await value("SELECT count(*)::int v FROM curriculum_private.commands WHERE account_id=$1", [
          other,
        ]),
      ).toBeGreaterThan(0);
      await db.query("DELETE FROM auth.users WHERE id=$1", [other]);
      expect(
        await value("SELECT count(*)::int v FROM curriculum_private.commands WHERE account_id=$1", [
          other,
        ]),
      ).toBe(0);
      expect(
        await value("SELECT count(*)::int v FROM learning_private.courses WHERE account_id=$1", [
          other,
        ]),
      ).toBe(0);
      expect(
        await value("SELECT count(*)::int v FROM curriculum_private.commands WHERE account_id=$1", [
          user,
        ]),
      ).toBe(ownerCount);
    });
    it("keeps all new storage private, RLS protected and service-only operations inaccessible to learners", async () => {
      await service();
      expect(
        (
          await db.query(
            "SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='curriculum_private' AND c.relkind='r' AND NOT c.relrowsecurity",
          )
        ).rows,
      ).toEqual([]);
      await actor(user);
      await expect(value("SELECT public.curriculum_index_metadata() v")).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        value("SELECT public.curriculum_index_operation('publish','{}') v"),
      ).rejects.toThrow(/permission denied/);
    });
  },
);
