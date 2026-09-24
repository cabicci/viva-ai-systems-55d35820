import { describe, expect, it } from "vitest";
import { decideContactAutomation, isEgyptBusinessHours } from "../contact-automation-policy";

const verified = {
  verifiedSubmission: true,
  processingConsent: true,
  submissionId: "verified-receipt",
  receivedAt: new Date("2026-01-04T07:00:00Z"), // Sunday, 09:00 Cairo
  kind: "routine" as const,
};

describe("Masaarat contact response policy (preparation only)", () => {
  it("opens Sunday 09:00 and closes Thursday 17:00 in Cairo", () => {
    expect(isEgyptBusinessHours(new Date("2026-01-04T06:59:00Z"))).toBe(false);
    expect(isEgyptBusinessHours(verified.receivedAt)).toBe(true);
    expect(isEgyptBusinessHours(new Date("2026-01-01T14:59:00Z"))).toBe(true);
    expect(isEgyptBusinessHours(new Date("2026-01-01T15:00:00Z"))).toBe(false);
    expect(isEgyptBusinessHours(new Date("2026-01-02T09:00:00Z"))).toBe(false);
  });

  it("proposes an immediate receipt outside hours and defers the detailed response", () => {
    expect(
      decideContactAutomation({ ...verified, receivedAt: new Date("2026-01-03T15:00:00Z") }),
    ).toEqual({
      status: "ready",
      idempotencyKey: "contact:verified-receipt",
      acknowledgement: "immediate",
      followup: "automatic",
      followupTiming: "next_business_hours",
    });
  });

  it.each(["custom_price", "contract", "unresolved", "unknown"] as const)(
    "routes %s to Khalil rather than producing an unapproved answer",
    (kind) => {
      expect(decideContactAutomation({ ...verified, kind })).toMatchObject({
        status: "ready",
        followup: "escalate_to_owner",
        followupTiming: "now",
      });
    },
  );

  it("fails closed without a verified submission, consent or durable receipt ID", () => {
    expect(decideContactAutomation({ ...verified, verifiedSubmission: false })).toEqual({
      status: "hold",
      reason: "unverified",
    });
    expect(decideContactAutomation({ ...verified, processingConsent: false })).toEqual({
      status: "hold",
      reason: "no_processing_consent",
    });
    expect(decideContactAutomation({ ...verified, submissionId: " " })).toEqual({
      status: "hold",
      reason: "missing_id",
    });
  });
});
