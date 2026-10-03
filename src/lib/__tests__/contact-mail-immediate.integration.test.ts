// @vitest-environment node
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { accountDeletionTestDb } from "./fixtures/account-deletion-db";
import { runContactMailJob } from "../../../supabase/functions/_shared/contact-mail-worker";

let db: PGlite;
const rpc = async (name: string, args?: Record<string, unknown>) => {
  const values = Object.values(args ?? {});
  const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
  const result = await db.query(`SELECT * FROM public.${name}(${placeholders})`, values);
  return {
    data: name.startsWith("complete_") ? Object.values(result.rows[0] as object)[0] : result.rows,
    error: null,
  };
};
const queue = async (id: string, email = "recipient@example.test") =>
  db.query(
    "SELECT public.queue_contact_acknowledgement($1,$2,'en','sales','Frozen subject','Frozen text','<p>Frozen HTML</p>')",
    [id, email],
  );
const claim = (id: string) =>
  db.query("SELECT * FROM public.claim_contact_acknowledgement($1)", [id]);

describe("immediate contact attempt with existing durable retry and deletion policy", () => {
  beforeAll(async () => {
    db = await accountDeletionTestDb(true);
    await db.exec(
      readFileSync("supabase/migrations/20261003070000_contact_immediate_claim.sql", "utf8"),
    );
  }, 30_000);
  afterAll(async () => db?.close());
  beforeEach(async () => {
    await db.exec("BEGIN");
  });
  afterEach(async () => {
    await db.exec("ROLLBACK");
  });

  it("exposes targeted claims only to the service role", async () => {
    for (const role of ["anon", "authenticated", "service_role"]) {
      const result = await db.query<{ allowed: boolean }>(
        "SELECT has_function_privilege($1,'public.claim_contact_acknowledgement(uuid)','EXECUTE') AS allowed",
        [role],
      );
      expect(result.rows[0].allowed).toBe(role === "service_role");
    }
  });
  it("claims only the requested message and serializes immediate/batch attempts", async () => {
    const first = randomUUID(),
      second = randomUUID();
    await queue(first);
    await queue(second);
    const send = vi.fn().mockResolvedValue({ ok: true, emailId: "provider-id" });
    expect(await runContactMailJob({ rpc }, send, second)).toEqual({ accepted: 1, deferred: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe(`contact-ack-v1/${second}`);
    expect((await claim(second)).rows).toHaveLength(0);
    expect(
      (
        await db.query<{ id: string }>("SELECT * FROM public.claim_contact_acknowledgements()")
      ).rows.map((r) => r.id),
    ).toEqual([first]);
    expect((await claim(first)).rows).toHaveLength(0);
  });
  it("retries an unknown immediate outcome with the same payload/key without another form submission", async () => {
    const id = randomUUID();
    await queue(id);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("ambiguous transport timeout"))
      .mockResolvedValue({ ok: true, emailId: "provider-retry" });
    expect(await runContactMailJob({ rpc }, send, id)).toEqual({ accepted: 0, deferred: 1 });
    expect((await claim(id)).rows).toHaveLength(0);
    await db.query(
      "UPDATE public.contact_acknowledgement_outbox SET lease_until=now()-interval '1 second' WHERE id=$1",
      [id],
    );
    expect(await runContactMailJob({ rpc }, send)).toEqual({ accepted: 1, deferred: 0 });
    expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
    expect(await runContactMailJob({ rpc }, send)).toEqual({ accepted: 0, deferred: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });
  it.each(["blocked", "expired", "old", "accepted"])("does not claim %s messages", async (kind) => {
    const id = randomUUID();
    await queue(id);
    const updates: Record<string, string> = {
      blocked: "blocked=true",
      expired: "first_attempt_at=now()-interval '24 hours'",
      old: "created_at=now()-interval '8 days'",
      accepted: "provider_email_id='already-sent'",
    };
    await db.query(
      `UPDATE public.contact_acknowledgement_outbox SET ${updates[kind]} WHERE id=$1`,
      [id],
    );
    expect((await claim(id)).rows).toHaveLength(0);
  });
  it("suppresses a deleting recipient without suppressing another family/account recipient", async () => {
    const user = randomUUID(),
      blocked = randomUUID(),
      other = randomUUID();
    await db.query("INSERT INTO auth.users(id,email) VALUES($1,'recipient@example.test')", [user]);
    await queue(blocked);
    await queue(other, "other@example.test");
    await db.query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
    await db.query(
      "INSERT INTO billing.account_deletion_lifecycle(user_id,contact_recipient,stage,financial_retention_reference,crm_retention_reference,release_reference) VALUES($1,'recipient@example.test','blocked','synthetic','synthetic','synthetic')",
      [user],
    );
    expect((await claim(blocked)).rows).toHaveLength(0);
    expect((await claim(other)).rows).toHaveLength(1);
  });
});
