// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";
import { runContactAutomationJob } from "../../../supabase/functions/_shared/contact-automation-worker";
import { isEgyptBusinessHours } from "../contact-automation-policy";

let db: PGlite;
const owner = "owner@example.test";
const sourceEmail = "requester@example.test";
const draft = () =>
  readFileSync(
    process.env.CONTACT_AUTOMATION_SQL_PATH ?? "drizzle/migrations/0050_contact_automation.sql",
    "utf8",
  );
const queue = (id: string, consent: boolean | null = true, subject = "Original acknowledgement") =>
  db.query(
    "SELECT public.queue_contact_automation($1,$2,'en','sales',$3,'Ack text','<p>Ack</p>',$4,'Owner subject','Untrusted customer enquiry','<p>Quoted enquiry</p>') AS ok",
    [id, sourceEmail, subject, consent],
  );
const prepare = (email: string | null = owner, id: string | null = null) =>
  db.query<{ result: { scheduled: number; awaiting_owner: number } }>(
    "SELECT public.prepare_contact_automation($1,$2) AS result",
    [email, id],
  );
const childOf = async (id: string) =>
  (
    await db.query<{ id: string }>(
      "SELECT id FROM public.contact_acknowledgement_outbox WHERE automation_parent_id=$1",
      [id],
    )
  ).rows[0].id;
const claim = (id: string | null, email: string | null = owner) =>
  db.query<{ id: string; claim_token: string; recipient: string }>(
    "SELECT * FROM public.claim_contact_automation($1,$2)",
    [email, id],
  );
const makeDue = (id: string) =>
  db.query(
    "UPDATE public.contact_acknowledgement_outbox SET automation_due_at=now()-interval '1 second' WHERE automation_parent_id=$1",
    [id],
  );
// Only the business-hours predicate is overridden inside rolled-back test transactions
// for time-independent lease tests. The real predicate/due-date tests run separately below.
const openClock = (open: boolean) =>
  db.exec(`CREATE OR REPLACE FUNCTION billing.contact_automation_business_hours(p_at timestamptz)
  RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$ SELECT ${open} $$;`);
const rpc = async (name: string, args?: Record<string, unknown>) => {
  const values = Object.values(args ?? {});
  const result = await db.query(
    `SELECT * FROM public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")})`,
    values,
  );
  return {
    data: name.startsWith("claim_") ? result.rows : Object.values(result.rows[0] as object)[0],
    error: null,
  };
};

describe("contact automation on the existing outbox and LC09 lifecycle", () => {
  beforeAll(async () => {
    db = await accountDeletionTestDb(true);
    await db.exec(
      readFileSync("supabase/migrations/20261003070000_contact_immediate_claim.sql", "utf8"),
    );
    await db.exec(draft());
  }, 30_000);
  afterAll(async () => db?.close());
  beforeEach(async () => {
    await db.exec("BEGIN");
  });
  afterEach(async () => {
    await db.exec("ROLLBACK");
  });

  it("uses an unguessable capability to recover state without exposing the frozen request", async () => {
    const id = randomUUID();
    const hash = "e".repeat(64);
    await db.query(
      "SELECT public.reserve_contact_intake($1,$2,'en','support','ACK','private text','html',true,'Review','body','html',$3,$4)",
      [id, sourceEmail, "d".repeat(64), hash],
    );
    const read = async (token: string) =>
      (
        await db.query<{ state: string }>(
          "SELECT public.read_contact_intake_state($1,$2) AS state",
          [id, token],
        )
      ).rows[0].state;
    expect(await read("f".repeat(64))).toBe("unknown");
    expect(await read(hash)).toBe("pending");
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET intake_state='closed_manual' WHERE id=$1",
      [id],
    );
    expect(await read(hash)).toBe("closed_manual");
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET automation_withdrawn_at=clock_timestamp() WHERE id=$1",
      [id],
    );
    expect(await read(hash)).toBe("withdrawn");
  });
  it("separates reservation from POST start, rejects expired wall-clock leases and preserves withdrawal on late completion", async () => {
    const reserve = async (id: string) =>
      (
        await db.query<{ result: { claim: string } }>(
          "SELECT public.reserve_contact_intake($1,$2,'en','support','ACK','text','html',true,'Review','body','html',$3) AS result",
          [id, sourceEmail, "d".repeat(64)],
        )
      ).rows[0].result;
    const expired = randomUUID();
    const first = await reserve(expired);
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.complete_contact_intake($1,$2,true) AS ok", [
          expired,
          first.claim,
        ])
      ).rows[0].ok,
    ).toBe(false);
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET intake_lease_until=transaction_timestamp()+(clock_timestamp()-transaction_timestamp())/2 WHERE id=$1",
      [expired],
    );
    expect(
      (
        await db.query<{ old_clock_would_allow: boolean }>(
          "SELECT intake_lease_until>transaction_timestamp() AS old_clock_would_allow FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [expired],
        )
      ).rows[0].old_clock_would_allow,
    ).toBe(true);
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
          expired,
          first.claim,
        ])
      ).rows[0].ok,
    ).toBe(false);
    const active = randomUUID();
    const second = await reserve(active);
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
          active,
          second.claim,
        ])
      ).rows[0].ok,
    ).toBe(true);
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
          active,
          second.claim,
        ])
      ).rows[0].ok,
    ).toBe(false);
    await db.exec("SAVEPOINT crm_pending_delete");
    await expect(
      db.query("DELETE FROM public.contact_acknowledgement_outbox WHERE id=$1", [active]),
    ).rejects.toThrow("LC09_CONTACT_SEND_PENDING");
    await db.exec("ROLLBACK TO SAVEPOINT crm_pending_delete");
    await db.query("SELECT public.withdraw_contact_automation($1)", [active]);
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.complete_contact_intake($1,$2,true) AS ok", [
          active,
          second.claim,
        ])
      ).rows[0].ok,
    ).toBe(false);
    expect(
      (
        await db.query<{ blocked: boolean; intake_state: string }>(
          "SELECT blocked,intake_state FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [active],
        )
      ).rows[0],
    ).toEqual({ blocked: true, intake_state: "uncertain" });
    expect((await claim(active)).rows).toHaveLength(0);
  });
  it("blocks a reserved CRM attempt when lifecycle or consent changes before POST", async () => {
    const user = randomUUID(),
      id = randomUUID();
    await db.query("INSERT INTO auth.users(id,email) VALUES($1,$2)", [user, sourceEmail]);
    const token = (
      await db.query<{ result: { claim: string } }>(
        "SELECT public.reserve_contact_intake($1,$2,'en','support','ACK','text','html',true,'Review','body','html',$3) AS result",
        [id, sourceEmail, "e".repeat(64)],
      )
    ).rows[0].result.claim;
    await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
    await db.query(
      "INSERT INTO billing.account_deletion_lifecycle(user_id,contact_recipient,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES($1,$2,'blocked','synthetic','synthetic','synthetic')",
      [user, sourceEmail],
    );
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_intake($1,$2) AS ok", [
          id,
          token,
        ])
      ).rows[0].ok,
    ).toBe(false);
  });
  it("closes an uncertain intake for audited manual handling without declaring CRM acceptance or releasing automation", async () => {
    const id = randomUUID(),
      admin = randomUUID();
    await db.query("INSERT INTO auth.users(id,email) VALUES($1,'admin@example.test')", [admin]);
    await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [admin]);
    const reserve = () =>
      db.query<{ result: { state: string; claim: string } }>(
        "SELECT public.reserve_contact_intake($1,$2,'en','support','ACK','text','html',true,'Review','body','html',$3) AS result",
        [id, sourceEmail, "f".repeat(64)],
      );
    const token = (await reserve()).rows[0].result.claim;
    await db.query("SELECT public.begin_contact_intake($1,$2)", [id, token]);
    await db.exec("SAVEPOINT live_submission");
    await expect(
      db.query(
        "SELECT public.admin_contact_automation_command($1,'close_manual',$2,$3,'SUPPORT-123')",
        [admin, id, owner],
      ),
    ).rejects.toThrow("CONTACT_INTAKE_IN_FLIGHT");
    await db.exec("ROLLBACK TO SAVEPOINT live_submission");
    await db.query("SELECT public.complete_contact_intake($1,$2,false)", [id, token]);
    await db.exec("SAVEPOINT missing_reference");
    await expect(
      db.query("SELECT public.admin_contact_automation_command($1,'close_manual',$2,$3)", [
        admin,
        id,
        owner,
      ]),
    ).rejects.toThrow("CONTACT_REVIEW_REFERENCE_REQUIRED");
    await db.exec("ROLLBACK TO SAVEPOINT missing_reference");
    await db.query(
      "SELECT public.admin_contact_automation_command($1,'close_manual',$2,$3,'SUPPORT-123')",
      [admin, id, owner],
    );
    expect(
      (
        await db.query<{
          intake_state: string;
          intake_closed_by: string;
          intake_resolution_ref: string;
          blocked: boolean;
        }>(
          "SELECT intake_state,intake_closed_by,intake_resolution_ref,blocked FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [id],
        )
      ).rows[0],
    ).toEqual({
      intake_state: "closed_manual",
      intake_closed_by: admin,
      intake_resolution_ref: "SUPPORT-123",
      blocked: true,
    });
    expect((await reserve()).rows[0].result.state).toBe("closed_manual");
    expect((await prepare(owner, id)).rows[0].result.scheduled).toBe(0);
    expect((await claim(id)).rows).toHaveLength(0);
  });
  it("uses a fresh wall clock for mail send start and counts expired owner plans even after an accepted ACK", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    const held = (await claim(id)).rows[0];
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET lease_until=transaction_timestamp()+(clock_timestamp()-transaction_timestamp())/2 WHERE id=$1",
      [id],
    );
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_mail_send($1,$2,$3) AS ok", [
          id,
          held.claim_token,
          owner,
        ])
      ).rows[0].ok,
    ).toBe(false);
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET provider_email_id='ack-known',created_at=clock_timestamp()-interval '8 days' WHERE id=$1",
      [id],
    );
    const status = (
      await db.query<{ result: { awaitingOwner: number; messageWindowExpired: number } }>(
        "SELECT public.contact_automation_status($1,$2) AS result",
        [owner, id],
      )
    ).rows[0].result;
    expect(status.awaitingOwner).toBe(0);
    expect(status.messageWindowExpired).toBe(1);
    expect((await prepare(owner, id)).rows[0].result.scheduled).toBe(0);
  });

  it("binds one intake attempt to immutable input before the external POST and never redispatches ambiguity", async () => {
    const id = randomUUID(),
      hash = "a".repeat(64);
    const reserve = (digest = hash, email = sourceEmail) =>
      db.query<{ result: { state: string; claim: string } }>(
        "SELECT public.reserve_contact_intake($1,$2,'en','sales','ACK','text','html',true,'Review','body','html',$3) AS result",
        [id, email, digest],
      );
    const first = (await reserve()).rows[0].result;
    expect(first.state).toBe("dispatch");
    expect((await reserve()).rows[0].result.state).toBe("reconciliation_required");
    expect((await claim(id)).rows).toHaveLength(0);
    expect((await prepare(owner, id)).rows[0].result.scheduled).toBe(0);
    for (const [digest, email] of [
      ["b".repeat(64), sourceEmail],
      [hash, "changed@example.test"],
    ]) {
      await db.exec("SAVEPOINT mismatch");
      await expect(reserve(digest, email)).rejects.toThrow("CONTACT_ATTEMPT_PAYLOAD_CONFLICT");
      await db.exec("ROLLBACK TO SAVEPOINT mismatch");
    }
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.complete_contact_intake($1,$2,true) AS ok", [
          id,
          randomUUID(),
        ])
      ).rows[0].ok,
    ).toBe(false);
    await db.query("SELECT public.begin_contact_intake($1,$2)", [id, first.claim]);
    await db.query("SELECT public.complete_contact_intake($1,$2,false)", [id, first.claim]);
    expect((await reserve()).rows[0].result.state).toBe("reconciliation_required");
    expect(
      (
        await db.query<{ result: { intakeReconciliation: number } }>(
          "SELECT public.contact_automation_status($1,NULL) AS result",
          [owner],
        )
      ).rows[0].result.intakeReconciliation,
    ).toBe(1);
    expect(
      (await db.query("SELECT id FROM public.contact_acknowledgement_outbox")).rows,
    ).toHaveLength(1);
  });
  it("accepts an intake once and returns accepted on replay without creating another ACK", async () => {
    const id = randomUUID();
    const reserve = () =>
      db.query<{ result: { state: string; claim: string } }>(
        "SELECT public.reserve_contact_intake($1,$2,'en','support','ACK','text','html',true,'Review','body','html',$3) AS result",
        [id, sourceEmail, "c".repeat(64)],
      );
    const result = (await reserve()).rows[0].result;
    await db.query("SELECT public.begin_contact_intake($1,$2)", [id, result.claim]);
    await db.query("SELECT public.complete_contact_intake($1,$2,true)", [id, result.claim]);
    expect((await reserve()).rows[0].result.state).toBe("accepted");
    expect((await claim(id)).rows).toHaveLength(1);
    expect(
      (await db.query("SELECT id FROM public.contact_acknowledgement_outbox")).rows,
    ).toHaveLength(1);
  });
  it("surfaces an owner-address mismatch and an expired retry window without retargeting or resetting keys", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const status = () =>
      db.query<{ result: { ownerReconciliation: number; retryWindowExpired: number } }>(
        "SELECT public.contact_automation_status('changed@example.test',NULL) AS result",
      );
    expect((await status()).rows[0].result.ownerReconciliation).toBe(1);
    expect((await prepare("changed@example.test", id)).rows[0].result.scheduled).toBe(0);
    expect((await claim(child, "changed@example.test")).rows).toHaveLength(0);
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET first_attempt_at=now()-interval '24 hours' WHERE id=$1",
      [child],
    );
    await openClock(false);
    expect((await status()).rows[0].result.retryWindowExpired).toBe(1);
    await openClock(true);
    expect((await claim(child)).rows).toHaveLength(0);
    expect(
      (
        await db.query<{ recipient: string }>(
          "SELECT recipient FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [child],
        )
      ).rows[0].recipient,
    ).toBe(owner);
  });
  it("performs a fresh per-row check after a claim and connects source-account blocking to withdrawal", async () => {
    await openClock(true);
    const id = randomUUID(),
      user = randomUUID();
    await db.query("INSERT INTO auth.users(id,email) VALUES($1,$2)", [user, sourceEmail]);
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const held = (await claim(child)).rows[0];
    await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
    await db.query(
      "INSERT INTO billing.account_deletion_lifecycle(user_id,contact_recipient,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES($1,$2,'blocked','synthetic','synthetic','synthetic')",
      [user, sourceEmail],
    );
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_mail_send($1,$2,$3) AS ok", [
          child,
          held.claim_token,
          owner,
        ])
      ).rows[0].ok,
    ).toBe(false);
    expect(
      (
        await db.query<{ blocked: boolean; withdrawn: boolean }>(
          "SELECT blocked,automation_withdrawn_at IS NOT NULL AS withdrawn FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [id],
        )
      ).rows[0],
    ).toEqual({ blocked: true, withdrawn: true });
  });
  it("requires a live admin actor for the actual withdrawal command and reports in-flight limits", async () => {
    await openClock(true);
    const id = randomUUID(),
      admin = randomUUID(),
      nonAdmin = randomUUID();
    await db.query(
      "INSERT INTO auth.users(id,email) VALUES($1,'admin@example.test'),($2,'regular@example.test')",
      [admin, nonAdmin],
    );
    await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [admin]);
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const held = (await claim(child)).rows[0];
    expect(
      (
        await db.query<{ ok: boolean }>("SELECT public.begin_contact_mail_send($1,$2,$3) AS ok", [
          child,
          held.claim_token,
          owner,
        ])
      ).rows[0].ok,
    ).toBe(true);
    await db.exec("SAVEPOINT forbidden");
    await expect(
      db.query("SELECT public.admin_contact_automation_command($1,'withdraw',$2,$3)", [
        nonAdmin,
        id,
        owner,
      ]),
    ).rejects.toThrow("CONTACT_ADMIN_REQUIRED");
    await db.exec("ROLLBACK TO SAVEPOINT forbidden");
    const result = await db.query<{
      result: {
        recent: Array<{
          recipientMasked: string;
          inFlight: boolean;
          ackState: string;
          followupState: string;
        }>;
      };
    }>("SELECT public.admin_contact_automation_command($1,'withdraw',$2,$3) AS result", [
      admin,
      id,
      owner,
    ]);
    expect(result.rows[0].result.recent[0]).toMatchObject({
      recipientMasked: "***@example.test",
      inFlight: true,
      ackState: "withdrawn",
      followupState: "withdrawn",
    });
    expect(JSON.stringify(result.rows[0].result)).not.toContain("Untrusted customer enquiry");
    expect(JSON.stringify(result.rows[0].result)).not.toContain(sourceEmail);
    await db.query(
      "SELECT public.complete_contact_acknowledgement($1,$2,'in-flight-result',false)",
      [child, held.claim_token],
    );
    expect(
      (
        await db.query<{ blocked: boolean }>(
          "SELECT blocked FROM public.contact_acknowledgement_outbox WHERE id=$1",
          [child],
        )
      ).rows[0].blocked,
    ).toBe(true);
    expect((await claim(null)).rows).toHaveLength(0);
  });

  it.each([
    ["2026-01-04T06:59:00Z", "2026-01-04T07:00:00Z"],
    ["2026-01-04T07:00:00Z", "2026-01-04T07:00:00Z"],
    ["2026-01-01T14:59:00Z", "2026-01-01T14:59:00Z"],
    ["2026-01-01T15:00:00Z", "2026-01-04T07:00:00Z"],
    ["2026-01-02T07:00:00Z", "2026-01-04T07:00:00Z"],
    ["2026-01-03T17:00:00Z", "2026-01-04T07:00:00Z"],
    ["2026-07-05T05:59:00Z", "2026-07-05T06:00:00Z"],
    ["2026-07-09T14:00:00Z", "2026-07-12T06:00:00Z"],
    ["2026-10-29T14:00:00Z", "2026-11-01T07:00:00Z"],
  ])("schedules %s for %s using Cairo including DST/weekends", async (at, due) => {
    const result = await db.query<{ due: Date; open: boolean }>(
      "SELECT billing.contact_automation_due_at($1) AS due,billing.contact_automation_business_hours($1) AS open",
      [at],
    );
    expect(new Date(result.rows[0].due).toISOString()).toBe(new Date(due).toISOString());
    expect(result.rows[0].open).toBe(isEgyptBusinessHours(new Date(at)));
  });
  it("restricts queue/prepare/claim/withdraw and private helpers to service internals", async () => {
    const signatures = [
      "public.queue_contact_automation(uuid,text,text,text,text,text,text,boolean,text,text,text)",
      "public.prepare_contact_automation(text,uuid)",
      "public.claim_contact_automation(text,uuid)",
      "public.withdraw_contact_automation(uuid)",
    ];
    for (const signature of signatures)
      for (const role of ["anon", "authenticated", "service_role"]) {
        const result = await db.query<{ allowed: boolean }>(
          "SELECT has_function_privilege($1,$2,'EXECUTE') AS allowed",
          [role, signature],
        );
        expect(result.rows[0].allowed).toBe(role === "service_role");
      }
    const tables = await db.query<{ allowed: boolean; rls: boolean }>(
      "SELECT has_table_privilege('authenticated','public.contact_acknowledgement_outbox','SELECT') AS allowed,relrowsecurity AS rls FROM pg_class WHERE oid='public.contact_acknowledgement_outbox'::regclass",
    );
    expect(tables.rows[0]).toEqual({ allowed: false, rls: true });
    const helper = await db.query<{ allowed: boolean }>(
      "SELECT has_function_privilege('service_role','billing.contact_automation_eligible(uuid,text,timestamptz)','EXECUTE') AS allowed",
    );
    expect(helper.rows[0].allowed).toBe(false);
  });
  it("rejects absent/withdrawn consent without retaining either action", async () => {
    for (const consent of [false, null]) {
      await db.exec("SAVEPOINT invalid_intake");
      await expect(queue(randomUUID(), consent)).rejects.toThrow(
        "CONTACT_AUTOMATION_INTAKE_INVALID",
      );
      await db.exec("ROLLBACK TO SAVEPOINT invalid_intake");
    }
    expect(
      (await db.query("SELECT id FROM public.contact_acknowledgement_outbox")).rows,
    ).toHaveLength(0);
  });
  it("keeps ACK and the follow-up plan when the owner address is missing, then prepares exactly once", async () => {
    const id = randomUUID();
    await queue(id);
    expect((await prepare(null, id)).rows[0].result).toEqual({ scheduled: 0, awaiting_owner: 1 });
    expect((await claim(id, null)).rows).toHaveLength(1);
    expect((await prepare(owner, id)).rows[0].result.scheduled).toBe(1);
    expect((await prepare(owner, id)).rows[0].result.scheduled).toBe(0);
    await queue(id, true, "Changed text must not overwrite the original");
    const rows = await db.query<{
      subject: string;
      locale: string;
      stream: string;
      automation_request_kind: string;
    }>(
      "SELECT subject,locale,stream,automation_request_kind FROM public.contact_acknowledgement_outbox WHERE id=$1 OR automation_parent_id=$1 ORDER BY automation_action",
      [id],
    );
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows[0]).toMatchObject({
      subject: "Original acknowledgement",
      locale: "en",
      stream: "sales",
      automation_request_kind: "unknown",
    });
    expect(rows.rows[1]).toMatchObject({
      subject: "Owner subject",
      locale: "en",
      stream: "sales",
      automation_request_kind: "unknown",
    });
  });
  it("does not follow up outside working hours, before due time, or with missing/changed owner configuration", async () => {
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    const child = await childOf(id);
    await makeDue(id);
    await openClock(false);
    expect((await claim(child)).rows).toHaveLength(0);
    await openClock(true);
    expect((await claim(child, null)).rows).toHaveLength(0);
    expect((await claim(child, "other-owner@example.test")).rows).toHaveLength(0);
    expect(
      (await db.query("SELECT * FROM public.claim_contact_acknowledgement($1)", [child])).rows,
    ).toHaveLength(0);
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET automation_due_at=now()+interval '1 hour' WHERE id=$1",
      [child],
    );
    expect((await claim(child)).rows).toHaveLength(0);
    await makeDue(id);
    expect((await claim(child)).rows[0].recipient).toBe(owner);
    expect((await claim(child)).rows).toHaveLength(0);
  });
  it("retries the same frozen owner message/key after an ambiguous send and rejects stale completion", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("ambiguous timeout"))
      .mockResolvedValue({ ok: true, emailId: "owner-provider-id" });
    expect(await runContactAutomationJob({ rpc }, send, owner, child)).toMatchObject({
      accepted: 0,
      deferred: 1,
    });
    expect((await claim(child)).rows).toHaveLength(0);
    const stale = (
      await db.query<{ claim_token: string }>(
        "SELECT claim_token FROM public.contact_acknowledgement_outbox WHERE id=$1",
        [child],
      )
    ).rows[0].claim_token;
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET lease_until=now()-interval '1 second' WHERE id=$1",
      [child],
    );
    expect(await runContactAutomationJob({ rpc }, send, owner, child)).toMatchObject({
      accepted: 1,
      deferred: 0,
    });
    expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
    expect(send.mock.calls[0][0].idempotencyKey).toBe(`contact-ack-v1/${child}`);
    expect(
      (
        await db.query<{ ok: boolean }>(
          "SELECT public.complete_contact_acknowledgement($1,$2,'stale',false) AS ok",
          [child, stale],
        )
      ).rows[0].ok,
    ).toBe(false);
    expect((await claim(child)).rows).toHaveLength(0);
  });
  it.each(["expired", "old", "permanent"])(
    "retains existing retry boundaries for %s owner messages",
    async (kind) => {
      await openClock(true);
      const id = randomUUID();
      await queue(id);
      await prepare(owner, id);
      await makeDue(id);
      const child = await childOf(id);
      const expression = {
        expired: "first_attempt_at=now()-interval '24 hours'",
        old: "created_at=now()-interval '8 days'",
        permanent: "blocked=true",
      }[kind]!;
      await db.query(`UPDATE public.contact_acknowledgement_outbox SET ${expression} WHERE id=$1`, [
        child,
      ]);
      expect((await claim(child)).rows).toHaveLength(0);
    },
  );
  it("withdraws the whole submission and never revives consent on retry or late completion", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const lease = (await claim(child)).rows[0];
    await db.query("SELECT public.withdraw_contact_automation($1)", [id]);
    await db.query(
      "SELECT public.complete_contact_acknowledgement($1,$2,'already-in-flight',false)",
      [child, lease.claim_token],
    );
    await queue(id);
    await prepare(owner, id);
    const rows = await db.query<{ blocked: boolean; withdrawn: boolean }>(
      "SELECT blocked,automation_withdrawn_at IS NOT NULL AS withdrawn FROM public.contact_acknowledgement_outbox WHERE id=$1 OR automation_parent_id=$1",
      [id],
    );
    expect(rows.rows).toEqual([
      { blocked: true, withdrawn: true },
      { blocked: true, withdrawn: true },
    ]);
    expect((await claim(null)).rows).toHaveLength(0);
  });
  it("honors source-account lifecycle suppression even when the owner recipient is active", async () => {
    await openClock(true);
    const id = randomUUID(),
      user = randomUUID();
    await db.query("INSERT INTO auth.users(id,email) VALUES($1,$2)", [user, sourceEmail]);
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
    await db.query(
      "INSERT INTO billing.account_deletion_lifecycle(user_id,contact_recipient,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES($1,$2,'blocked','synthetic','synthetic','synthetic')",
      [user, sourceEmail],
    );
    expect((await claim(id)).rows).toHaveLength(0);
    expect((await claim(child)).rows).toHaveLength(0);
  });
  it("keeps verified receipt matching and stops an owner copy after the source bounces", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const ack = (await claim(id)).rows[0];
    await db.query("SELECT public.complete_contact_acknowledgement($1,$2,'ack-provider',false)", [
      id,
      ack.claim_token,
    ]);
    expect(
      (
        await db.query<{ result: string }>(
          "SELECT public.record_contact_mail_receipt('bounce-event','ack-provider',$1,'email.bounced',now()) AS result",
          [sourceEmail],
        )
      ).rows[0].result,
    ).toBe("recorded");
    expect((await claim(child)).rows).toHaveLength(0);
  });
  it("waits for an owner send lease, then cascades the source deletion to the owner copy and receipts", async () => {
    await openClock(true);
    const id = randomUUID();
    await queue(id);
    await prepare(owner, id);
    await makeDue(id);
    const child = await childOf(id);
    const lease = (await claim(child)).rows[0];
    await db.exec("SAVEPOINT pending_delete");
    await expect(
      db.query("DELETE FROM public.contact_acknowledgement_outbox WHERE id=$1", [id]),
    ).rejects.toThrow("LC09_CONTACT_SEND_PENDING");
    await db.exec("ROLLBACK TO SAVEPOINT pending_delete");
    await db.query(
      "SELECT public.complete_contact_acknowledgement($1,$2,'owner-delivered',false)",
      [child, lease.claim_token],
    );
    expect(
      (
        await db.query<{ result: string }>(
          "SELECT public.record_contact_mail_receipt('owner-delivered-event','owner-delivered',$1,'email.delivered',now()) AS result",
          [owner],
        )
      ).rows[0].result,
    ).toBe("recorded");
    await db.query("DELETE FROM public.contact_acknowledgement_outbox WHERE id=$1", [id]);
    expect(
      (await db.query("SELECT id FROM public.contact_acknowledgement_outbox")).rows,
    ).toHaveLength(0);
    expect((await db.query("SELECT event_id FROM public.contact_mail_receipts")).rows).toHaveLength(
      0,
    );
  });
});
