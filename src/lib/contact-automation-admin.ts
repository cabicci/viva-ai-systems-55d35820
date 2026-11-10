import { z } from "zod";

export const contactAdministrationFilter = z
  .object({ requestId: z.string().uuid().optional() })
  .strict();
export const contactWithdrawalInput = z.object({ requestId: z.string().uuid() }).strict();
export const contactManualClosureInput = z
  .object({
    requestId: z.string().uuid(),
    reference: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9:/_.-]{3,200}$/),
  })
  .strict();
export const contactAdministrationState = z.enum([
  "withdrawn",
  "intake_reconciliation_required",
  "intake_in_flight",
  "intake_reserved",
  "closed_manual",
  "accepted",
  "blocked",
  "retry_window_expired",
  "message_window_expired",
  "owner_reconciliation_required",
  "send_in_flight",
  "pending",
  "owner_configuration_required",
  "awaiting_preparation",
]);
const count = z.number().int().nonnegative();
const timestamp = z.iso
  .datetime({ offset: true })
  .refine((value) => Number.isFinite(Date.parse(value)), "Invalid timestamp");
export const contactAdministrationSnapshot = z.object({
  ownerConfigured: z.boolean(),
  total: count,
  counts: z.object({
    awaitingOwner: count,
    ownerReconciliation: count,
    retryWindowExpired: count,
    messageWindowExpired: count,
    intakeReconciliation: count,
    inFlight: count,
    withdrawn: count,
  }),
  recent: z
    .array(
      z.object({
        id: z.string().uuid(),
        recipientMasked: z.string().regex(/^\*\*\*@[^\s@]+$/),
        locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
        stream: z.enum(["support", "sales"]),
        createdAt: timestamp,
        dueAt: timestamp.nullable(),
        withdrawnAt: timestamp.nullable(),
        closedAt: timestamp.nullable().default(null),
        resolutionReference: z
          .string()
          .regex(/^[A-Za-z0-9:/_.-]{3,200}$/)
          .nullable()
          .default(null),
        ackState: contactAdministrationState,
        followupState: contactAdministrationState,
        inFlight: z.boolean(),
      }),
    )
    .max(100),
});
export type ContactAdministrationSnapshot = z.infer<typeof contactAdministrationSnapshot>;
export type ContactAdministrationState = z.infer<typeof contactAdministrationState>;
