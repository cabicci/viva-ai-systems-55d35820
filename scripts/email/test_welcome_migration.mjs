import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const pg = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rows = async (sql, args = []) => (await pg.query(sql, args)).rows;
try {
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
    INSERT INTO auth.users VALUES('${id(99)}','existing@example.test',now());`);
  await pg.exec(
    readFileSync("supabase/migrations/20260925220000_account_welcome_email.sql", "utf8"),
  );
  assert.equal((await rows("SELECT * FROM public.account_welcome_outbox")).length, 0);
  await pg.query("INSERT INTO auth.users VALUES($1,'confirmed@example.test',null)", [id(1)]);
  assert.equal((await rows("SELECT * FROM public.account_welcome_outbox")).length, 0);
  await pg.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [id(1)]);
  await pg.query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [id(1)]);
  assert.equal((await rows("SELECT * FROM public.account_welcome_outbox")).length, 1);
  for (const role of ["anon", "authenticated"]) {
    await pg.exec(`SET ROLE ${role}`);
    await assert.rejects(pg.query("SELECT * FROM public.account_welcome_outbox"));
    await assert.rejects(pg.query("SELECT * FROM public.claim_account_welcome_emails()"));
    await assert.rejects(
      pg.query("SELECT public.complete_account_welcome_email($1,$2,null,false)", [id(1), id(2)]),
    );
    await pg.exec("RESET ROLE");
  }
  await pg.exec("SET ROLE service_role");
  const [claim] = await rows("SELECT * FROM public.claim_account_welcome_emails()");
  assert.equal(claim.recipient, "confirmed@example.test");
  assert.equal((await rows("SELECT * FROM public.claim_account_welcome_emails()")).length, 0);
  assert.equal(
    (
      await rows("SELECT public.complete_account_welcome_email($1,$2,'provider-1',false) AS ok", [
        id(1),
        id(2),
      ])
    )[0].ok,
    false,
  );
  assert.equal(
    (
      await rows("SELECT public.complete_account_welcome_email($1,$2,'provider-1',false) AS ok", [
        id(1),
        claim.claim_token,
      ])
    )[0].ok,
    true,
  );
  await pg.exec("RESET ROLE");
  await pg.exec("UPDATE public.account_welcome_outbox SET lease_until=now()-interval '1 hour'");
  assert.equal((await rows("SELECT * FROM public.claim_account_welcome_emails()")).length, 0);
  for (let n = 2; n <= 9; n++)
    await pg.query("INSERT INTO auth.users VALUES($1,$2,now())", [
      id(n),
      `account${n}@example.test`,
    ]);
  await pg.query("UPDATE auth.users SET email='changed@example.test' WHERE id=$1", [id(2)]);
  await pg.query(
    "UPDATE public.account_welcome_outbox SET first_attempt_at=now()-interval '24 hours' WHERE user_id=$1",
    [id(3)],
  );
  await pg.query(
    "UPDATE public.account_welcome_outbox SET created_at=now()-interval '8 days' WHERE user_id=$1",
    [id(4)],
  );
  const batch = await rows("SELECT * FROM public.claim_account_welcome_emails()");
  assert.equal(batch.length, 5);
  assert.ok(batch.every((r) => ![id(2), id(3), id(4)].includes(r.user_id)));
  await pg.query("DELETE FROM auth.users WHERE id=$1", [id(1)]);
  assert.equal(
    (await rows("SELECT * FROM public.account_welcome_outbox WHERE user_id=$1", [id(1)])).length,
    0,
  );
  console.log(
    "PASS: no backfill, confirmation-only, dedup, role denial, lease exclusion, stale-token rejection, accepted-once, bounded batch, changed-email exclusion, 23h retry ceiling, queue age, deletion cascade",
  );
} finally {
  await pg.close();
}
