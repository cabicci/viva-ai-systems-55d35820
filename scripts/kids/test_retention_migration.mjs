import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const pg = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function value(sql, args = []) {
  return (await pg.query(sql, args)).rows[0]?.value;
}
async function denied(sql) {
  let failed = false;
  try {
    await pg.exec(sql);
  } catch {
    failed = true;
  }
  assert.ok(failed, `Must deny: ${sql}`);
}
async function rpc(sql, args = []) {
  await pg.exec("SET ROLE service_role");
  try {
    return await pg.query(sql, args);
  } finally {
    await pg.exec("RESET ROLE");
  }
}
try {
  await pg.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT NULL::uuid$$;
    GRANT USAGE ON SCHEMA public TO authenticated,service_role;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
  for (const name of [
    "20260924190000_kids_parent_content_access_foundation.sql",
    "20260925160000_kids_family_profile_limit.sql",
    "20260925190000_kids_retention_email.sql",
  ])
    await pg.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
  for (let n = 1; n <= 4; n++) {
    await pg.query("INSERT INTO auth.users VALUES($1,$2,now())", [
      id(n),
      `parent${n}@example.test`,
    ]);
    await pg.query(
      "INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id) VALUES($1,$2,'Explorer','level-1')",
      [id(10 + n), id(n)],
    );
  }
  await pg.exec(`INSERT INTO public.kids_family_entitlements VALUES
    ('${id(1)}',now()-interval '200 days',now()-interval '110 days','test-expiry-1'),
    ('${id(2)}',now()-interval '200 days',now()-interval '105 days','test-expiry-2'),
    ('${id(4)}',now()-interval '200 days',now()-interval '89 days','test-expiry-4');`);
  assert.equal(await value("SELECT public.kids_prepare_retention_notices() AS value"), 0);
  await pg.exec("SET ROLE authenticated");
  for (const sql of [
    "SELECT * FROM public.kids_retention_notices",
    "SELECT public.kids_prepare_retention_notices()",
    "SELECT public.kids_claim_retention_notices()",
    `SELECT public.kids_delete_expired_profiles('${id(1)}')`,
    `SELECT public.kids_record_retention_delivery('fake','fake','fake','email.delivered',now())`,
  ])
    await denied(sql);
  await pg.exec("RESET ROLE");
  await denied("UPDATE public.kids_retention_control SET notices_enabled=true");
  await pg.exec(
    "UPDATE public.kids_retention_control SET notices_enabled=true,release_reference='synthetic-test' ",
  );
  for (let n = 0; n < 3; n++)
    assert.equal((await rpc("SELECT public.kids_prepare_retention_notices(1) AS n")).rows[0].n, 1);
  assert.equal((await rpc("SELECT public.kids_prepare_retention_notices() AS n")).rows[0].n, 0);
  assert.equal(await value("SELECT count(*)::int AS value FROM public.kids_retention_notices"), 3);
  assert.equal(
    await value(
      `SELECT count(*)::int AS value FROM public.kids_retention_notices WHERE parent_id='${id(3)}'`,
    ),
    0,
  );
  const claims = (await rpc("SELECT * FROM public.kids_claim_retention_notices()")).rows;
  assert.equal(claims.length, 3);
  assert.equal((await rpc("SELECT * FROM public.kids_claim_retention_notices()")).rows.length, 0);
  const first = claims.find((c) => c.recipient_email === "parent1@example.test");
  const second = claims.find((c) => c.recipient_email === "parent2@example.test");
  const fourth = claims.find((c) => c.recipient_email === "parent4@example.test");
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('early','unknown',$1,'email.delivered',now()) AS value",
      [first.recipient_email],
    ),
    false,
  );
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('other','unknown','unrelated@example.test','email.delivered',now()) AS value",
    ),
    true,
  );
  assert.equal(
    await value("SELECT public.kids_record_retention_submission($1,$2,'wrong') AS value", [
      first.notice_id,
      id(99),
    ]),
    false,
  );
  for (const claim of claims) {
    assert.equal(
      (
        await rpc("SELECT public.kids_record_retention_submission($1,$2,$3) AS ok", [
          claim.notice_id,
          claim.claim_token,
          `email-${claim.notice_id}`,
        ])
      ).rows[0].ok,
      true,
    );
  }
  const provider = `email-${first.notice_id}`;
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('wrong-recipient',$1,'another@example.test','email.delivered',now()) AS value",
      [provider],
    ),
    false,
  );
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('future',$1,$2,'email.delivered',now()+interval '1 day') AS value",
      [provider, first.recipient_email],
    ),
    false,
  );
  const eventTime = (await pg.query("SELECT now()::text AS t")).rows[0].t;
  for (let n = 0; n < 2; n++)
    assert.equal(
      (
        await rpc(
          "SELECT public.kids_record_retention_delivery('event-1',$1,$2,'email.delivered',$3) AS ok",
          [provider, first.recipient_email, eventTime],
        )
      ).rows[0].ok,
      true,
    );
  assert.equal(
    await value(
      "SELECT count(*)::int AS value FROM public.kids_retention_delivery_events WHERE event_id='event-1'",
    ),
    1,
  );
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [first.notice_id]),
    0,
  );
  await pg.exec("UPDATE public.kids_retention_control SET deletion_enabled=true");
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [first.notice_id]),
    0,
  );
  await pg.query(
    "UPDATE public.kids_retention_notices SET delivered_at=now()-interval '13 days' WHERE id=$1",
    [first.notice_id],
  );
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [first.notice_id]),
    0,
  );
  // Synthetic clock advance: no provider call or real child data.
  await pg.query(
    "UPDATE public.kids_retention_notices SET delivered_at=now()-interval '14 days 1 second' WHERE id=$1",
    [first.notice_id],
  );
  await pg.exec(`INSERT INTO public.kids_lesson_progress VALUES('${id(11)}','level-1',1,'en',now());
    INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id,created_at) VALUES('${id(21)}','${id(1)}','New free profile','level-1',now()+interval '1 hour');`);
  assert.equal(
    (await rpc("SELECT public.kids_delete_expired_profiles($1) AS n", [first.notice_id])).rows[0].n,
    1,
  );
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [first.notice_id]),
    0,
  );
  assert.equal(
    await value(`SELECT count(*)::int AS value FROM public.kids_profiles WHERE id='${id(21)}'`),
    1,
  );
  assert.equal(await value("SELECT count(*)::int AS value FROM public.kids_lesson_progress"), 0);
  assert.equal(
    await value(
      `SELECT count(*)::int AS value FROM public.kids_profiles WHERE parent_id='${id(3)}'`,
    ),
    1,
  );
  // Both the 90-day and delivered+14-day cutoffs must pass.
  await pg.query(
    "UPDATE public.kids_retention_notices SET state='delivered',delivered_at=now()-interval '20 days' WHERE id=$1",
    [fourth.notice_id],
  );
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [fourth.notice_id]),
    0,
  );
  // Failure wins even when delivery events arrive out of order.
  const secondProvider = `email-${second.notice_id}`;
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('bounce',$1,$2,'email.bounced',now()) AS value",
      [secondProvider, second.recipient_email],
    ),
    true,
  );
  assert.equal(
    await value(
      "SELECT public.kids_record_retention_delivery('late-delivery',$1,$2,'email.delivered',now()) AS value",
      [secondProvider, second.recipient_email],
    ),
    true,
  );
  assert.equal(
    await value("SELECT state AS value FROM public.kids_retention_notices WHERE id=$1", [
      second.notice_id,
    ]),
    "blocked",
  );
  await pg.query(
    "UPDATE public.kids_retention_notices SET state='delivered',failure_at=NULL,delivered_at=now()-interval '20 days' WHERE id=$1",
    [second.notice_id],
  );
  await pg.exec(
    `UPDATE public.kids_family_entitlements SET active_until=now()+interval '30 days' WHERE parent_id='${id(2)}'`,
  );
  assert.equal(
    await value("SELECT public.kids_delete_expired_profiles($1) AS value", [second.notice_id]),
    0,
  );
  assert.equal(
    await value("SELECT state AS value FROM public.kids_retention_notices WHERE id=$1", [
      second.notice_id,
    ]),
    "cancelled",
  );
  // Unknown send outcomes beyond provider idempotency TTL require reconciliation.
  await pg.query(
    "UPDATE public.kids_retention_notices SET state='sending',first_attempt_at=now()-interval '24 hours',lease_until=now()-interval '1 minute',provider_email_id=NULL WHERE id=$1",
    [fourth.notice_id],
  );
  assert.equal((await rpc("SELECT * FROM public.kids_claim_retention_notices()")).rows.length, 0);
  // Changing a verified parent email invalidates the old notice and creates a new one.
  await pg.exec(`UPDATE auth.users SET email='updated@example.test' WHERE id='${id(4)}'`);
  assert.equal((await rpc("SELECT public.kids_prepare_retention_notices() AS n")).rows[0].n, 1);
  assert.equal(
    await value("SELECT state AS value FROM public.kids_retention_notices WHERE id=$1", [
      fourth.notice_id,
    ]),
    "cancelled",
  );
  assert.equal(
    await value(
      `SELECT count(*)::int AS value FROM public.kids_profiles WHERE parent_id='${id(2)}'`,
    ),
    1,
  );
  console.log(
    "Kids retention SQL: PASS (disabled gates, role isolation, queue pagination, claims, idempotency window, signed-receipt binding, 90/14-day limits, renewal/email-change cancellation, failure ordering, scoped cascade and deletion receipt)",
  );
} finally {
  await pg.close();
}
