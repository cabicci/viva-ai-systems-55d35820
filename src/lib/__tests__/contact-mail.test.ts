import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { authorizedServiceJob } from "../../../supabase/functions/_shared/service-job-auth";
import { contactMailContent } from "../../../supabase/functions/_shared/contact-mail";
import { runContactMailJob } from "../../../supabase/functions/contact-mail-job/handler";

describe("contact acknowledgements", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "uses the chosen locale and shared brand for %s",
    (locale) => {
      for (const stream of ["support", "sales"] as const) {
        const c = contactMailContent(
          stream,
          locale,
          "<img src=x onerror=alert(1)>",
        );
        expect(c.html).toContain(
          `lang="${locale}" dir="${locale === "en" ? "ltr" : "rtl"}"`,
        );
        expect(c.html).toContain("masaarat-logo-lockup.png");
        for (const color of [
          "#ffffff",
          "#e8f1f6",
          "#243044",
          "#dce6ed",
          "#f3f8f8",
          "#356f9a",
        ])
          expect(c.html).toContain(color);
        expect(c.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(c.html).not.toContain("<img src=x");
        expect(c.from).toBe(
          stream === "sales"
            ? "sales@mail.masaarat.ai"
            : "info@mail.masaarat.ai",
        );
        expect(c.replyTo).toBe(
          stream === "sales" ? "sales@masaarat.ai" : "info@masaarat.ai",
        );
        expect(c.html).not.toContain("pricing");
      }
    },
  );
  it("does not guess an unsupported language", () =>
    expect(() =>
      contactMailContent("support", "fr" as never, "Name"),
    ).toThrow());
  const row = {
    id: "request-1",
    claim_token: "claim-1",
    recipient: "recipient@example.test",
    subject: "stored subject",
    text_body: "stored text",
    html_body: "stored html",
    sender: "sales@mail.masaarat.ai",
  };
  function database() {
    return {
      rpc: vi.fn(async (name: string) => ({
        data: name === "claim_contact_acknowledgements" ? [row] : true,
        error: null,
      })),
    };
  }
  it("sends only immutable server-claimed content and sender", async () => {
    const db = database(),
      send = vi.fn().mockResolvedValue({ ok: true, emailId: "email-1" });
    expect(await runContactMailJob(db, send)).toEqual({
      accepted: 1,
      deferred: 0,
    });
    expect(send).toHaveBeenCalledWith(
      {
        to: row.recipient,
        subject: row.subject,
        text: row.text_body,
        html: row.html_body,
        idempotencyKey: "contact-ack-v1/request-1",
      },
      { from: row.sender, replyTo: "sales@masaarat.ai" },
    );
    expect(db.rpc).toHaveBeenLastCalledWith(
      "complete_contact_acknowledgement",
      {
        p_id: row.id,
        p_claim: row.claim_token,
        p_email_id: "email-1",
        p_block: false,
      },
    );
  });
  it("defers unknown outcomes and blocks permanent rejections", async () => {
    const db = database();
    expect(
      await runContactMailJob(
        db,
        vi.fn().mockRejectedValue(new Error("network")),
      ),
    ).toEqual({ accepted: 0, deferred: 1 });
    expect(db.rpc).toHaveBeenLastCalledWith(
      "complete_contact_acknowledgement",
      expect.objectContaining({ p_email_id: null, p_block: false }),
    );
    await runContactMailJob(
      db,
      vi.fn().mockResolvedValue({ ok: false, retryable: false }),
    );
    expect(db.rpc).toHaveBeenLastCalledWith(
      "complete_contact_acknowledgement",
      expect.objectContaining({ p_block: true }),
    );
  });
  it("fails closed before sending on claim errors", async () => {
    const send = vi.fn(),
      db = { rpc: vi.fn().mockResolvedValue({ data: null, error: "denied" }) };
    await expect(runContactMailJob(db, send)).rejects.toThrow(
      "contact_mail_claim_failed",
    );
    expect(send).not.toHaveBeenCalled();
  });
  it("does not report success after completion fails", async () => {
    const db = database();
    db.rpc
      .mockResolvedValueOnce({ data: [row], error: null })
      .mockResolvedValueOnce({ data: false as never, error: null });
    await expect(
      runContactMailJob(
        db,
        vi.fn().mockResolvedValue({ ok: true, emailId: "id" }),
      ),
    ).rejects.toThrow("contact_mail_record_failed");
  });
});

describe("contact worker deployment boundary", () => {
  it("requires a dedicated token and rejects user JWTs or missing configuration", async () => {
    const request = (value: string) =>
      new Request("https://example.test", {
        headers: { authorization: value },
      });
    const secret = "x".repeat(64);
    expect(
      await authorizedServiceJob(request(`Bearer ${secret}`), secret),
    ).toBe(true);
    expect(await authorizedServiceJob(request("Bearer user-jwt"), secret)).toBe(
      false,
    );
    expect(await authorizedServiceJob(request("Bearer short"), "short")).toBe(
      false,
    );
    expect(
      await authorizedServiceJob(request(`Bearer ${secret}`), undefined),
    ).toBe(false);
  });
  it("bundles only its own files and shared helpers", () => {
    const source = readFileSync(
      "supabase/functions/contact-mail-job/index.ts",
      "utf8",
    );
    const relatives = [...source.matchAll(/from "(\.\.[^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(relatives.length).toBeGreaterThan(0);
    for (const path of relatives) expect(path).toMatch(/^\.\.\/_shared\//);
  });
});
