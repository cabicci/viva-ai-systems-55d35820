/**
 * Decision policy only. The contact endpoint does not currently have a verified
 * submission receipt, durable dedupe queue, scheduler, or approved sender.
 * Never interpret this result as permission to send a message.
 */
export type ContactRequestKind = "routine" | "custom_price" | "contract" | "unresolved" | "unknown";

export type ContactAutomationDecision =
  | { status: "hold"; reason: "unverified" | "no_processing_consent" | "missing_id" }
  | {
      status: "ready";
      idempotencyKey: string;
      acknowledgement: "none" | "immediate";
      followup: "automatic" | "escalate_to_owner";
      followupTiming: "now" | "next_business_hours";
    };

const cairoClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Africa/Cairo",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Sunday through Thursday, 09:00 inclusive to 17:00 exclusive, Cairo time. */
export function isEgyptBusinessHours(at: Date): boolean {
  if (Number.isNaN(at.getTime())) throw new TypeError("Invalid receipt timestamp");
  const parts = Object.fromEntries(
    cairoClock.formatToParts(at).map(({ type, value }) => [type, value]),
  );
  const day = parts.weekday;
  const minuteOfDay = Number(parts.hour) * 60 + Number(parts.minute);
  return day !== "Fri" && day !== "Sat" && minuteOfDay >= 9 * 60 && minuteOfDay < 17 * 60;
}

export function decideContactAutomation(input: {
  verifiedSubmission: boolean;
  processingConsent: boolean;
  submissionId: string | null;
  receivedAt: Date;
  kind: ContactRequestKind;
}): ContactAutomationDecision {
  if (!input.verifiedSubmission) return { status: "hold", reason: "unverified" };
  if (!input.processingConsent) return { status: "hold", reason: "no_processing_consent" };
  // This key must be persisted atomically by a future queue before any send.
  const id = input.submissionId?.trim();
  if (!id) return { status: "hold", reason: "missing_id" };

  const duringHours = isEgyptBusinessHours(input.receivedAt);
  return {
    status: "ready",
    idempotencyKey: `contact:${id}`,
    acknowledgement: duringHours ? "none" : "immediate",
    followup: input.kind === "routine" ? "automatic" : "escalate_to_owner",
    followupTiming: duringHours ? "now" : "next_business_hours",
  };
}
