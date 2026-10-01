import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
let db: PGlite;
describe("service-only contact mail outbox", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;",
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/20261001120000_contact_acknowledgements.sql",
        "utf8",
      ),
    );
  });
  afterAll(async () => {
    await db?.close();
  });
  it("denies public access and exposes functions only to service role", async () => {
    for (const role of ["anon", "authenticated"]) {
      const r = await db.query<{
        table_access: boolean;
        queue_access: boolean;
        claim_access: boolean;
      }>(
        `SELECT has_table_privilege('${role}','public.contact_acknowledgement_outbox','SELECT') AS table_access,has_function_privilege('${role}','public.queue_contact_acknowledgement(uuid,text,text,text,text,text,text)','EXECUTE') AS queue_access,has_function_privilege('${role}','public.claim_contact_acknowledgements()','EXECUTE') AS claim_access`,
      );
      expect(r.rows[0]).toEqual({
        table_access: false,
        queue_access: false,
        claim_access: false,
      });
    }
  });
  it("deduplicates queue IDs, freezes contents, leases claims, rejects stale completion", async () => {
    const id = randomUUID();
    const queue = (subject: string) =>
      db.query(
        "SELECT public.queue_contact_acknowledgement($1,$2,$3,$4,$5,$6,$7)",
        [
          id,
          "adult@example.test",
          "en",
          "sales",
          subject,
          "Text",
          "<p>HTML</p>",
        ],
      );
    await queue("Original");
    await queue("Changed");
    const claims = await db.query<{
      id: string;
      claim_token: string;
      subject: string;
      sender: string;
    }>("SELECT * FROM public.claim_contact_acknowledgements()");
    expect(claims.rows).toHaveLength(1);
    expect(claims.rows[0].subject).toBe("Original");
    expect(claims.rows[0].sender).toBe("sales@mail.masaarat.ai");
    expect(
      (await db.query("SELECT * FROM public.claim_contact_acknowledgements()"))
        .rows,
    ).toHaveLength(0);
    const complete = async (token: string) =>
      db.query<{ ok: boolean }>(
        "SELECT public.complete_contact_acknowledgement($1,$2,$3,false) AS ok",
        [id, token, "provider-id"],
      );
    expect((await complete(randomUUID())).rows[0].ok).toBe(false);
    expect((await complete(claims.rows[0].claim_token)).rows[0].ok).toBe(true);
    expect((await complete(claims.rows[0].claim_token)).rows[0].ok).toBe(false);
    expect(
      (await db.query("SELECT * FROM public.claim_contact_acknowledgements()"))
        .rows,
    ).toHaveLength(0);
  });
  it("stops retries before provider idempotency expires and excludes old messages", async () => {
    for (const expired of [false, true]) {
      const id = randomUUID();
      await db.query(
        "SELECT public.queue_contact_acknowledgement($1,'adult@example.test','ar-EG','support','Subject','Text','HTML')",
        [id],
      );
      await db.query(
        expired
          ? "UPDATE public.contact_acknowledgement_outbox SET first_attempt_at=now()-interval '24 hours' WHERE id=$1"
          : "UPDATE public.contact_acknowledgement_outbox SET created_at=now()-interval '8 days' WHERE id=$1",
        [id],
      );
    }
    expect(
      (await db.query("SELECT * FROM public.claim_contact_acknowledgements()"))
        .rows,
    ).toHaveLength(0);
  });
});
