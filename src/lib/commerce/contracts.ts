import { z } from "zod";

export const packageSchema = z.enum(["pro", "pro_plus", "kids"]);
export type PackageKey = z.infer<typeof packageSchema>;
export const localeSchema = z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);
export const currencySchema = z.enum(["EGP", "USD"]);
export const methodSchema = z.enum(["instapay", "wallet", "bank"]);
const uuid = z.string().uuid();
const key = z.string().min(8).max(100);
const amount = z.number().int().min(0).max(1_000_000_000);
const days = z.number().int().min(1).max(1095);
const date = z.string().datetime({ offset: true });
const reason = z.string().trim().min(1).max(2000);
export const recipientSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    name: z.string().trim().max(80).default(""),
    locale: localeSchema,
    package: packageSchema,
    access_kind: z.enum(["complimentary", "external"]),
    duration_days: days,
    start_rule: z.enum(["acceptance", "date", "after_expiry"]),
    requested_start: date.optional(),
    deadline: date,
    market: z.enum(["EG", "INTL"]),
    billing_interval: z.enum(["month", "year"]),
    currency: currencySchema,
    method: methodSchema,
    original_minor: amount.optional(),
    final_minor: amount.optional(),
    code: z.string().trim().max(64).optional(),
  })
  .superRefine((row, context) => {
    if (row.start_rule === "date" && !row.requested_start)
      context.addIssue({
        code: "custom",
        path: ["requested_start"],
        message: "Start date required",
      });
    if (row.currency !== (row.market === "EG" ? "EGP" : "USD"))
      context.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Currency and market differ",
      });
    if (row.code && row.final_minor !== undefined)
      context.addIssue({
        code: "custom",
        path: ["code"],
        message: "Choose a code or an agreed amount",
      });
  });
export type Recipient = z.infer<typeof recipientSchema>;
const selection = z.object({
  package: packageSchema,
  market: z.enum(["EG", "INTL"]),
  billing_interval: z.enum(["month", "year"]),
  code: z.string().max(64).optional(),
  renewal: z.boolean().optional(),
});
export const commandSchemas = {
  status: z.object({}),
  methods: z.object({}),
  quote: selection,
  create_order: selection.extend({ method: z.enum(["instapay", "wallet", "bank", "admin"]), key }),
  my_list: z.object({}),
  order: z.object({ id: uuid }),
  cancel_order: z.object({ id: uuid }),
  configure_method: z
    .object({
      code: methodSchema,
      enabled: z.boolean(),
      instructions: z.string().max(4000),
      instructions_localized: z.record(localeSchema, z.string().trim().min(1).max(4000)).optional(),
      destination: z.string().max(1000),
      qr_url: z.string().url().startsWith("https://").optional().or(z.literal("")),
      currencies: z.array(currencySchema).min(1).max(2),
    })
    .superRefine((method, context) => {
      if (
        (method.code === "instapay" || method.code === "wallet") &&
        (method.currencies.length !== 1 || method.currencies[0] !== "EGP")
      ) {
        context.addIssue({
          code: "custom",
          path: ["currencies"],
          message: "InstaPay and Wallet support EGP only",
        });
      }
    }),
  create_group: z.object({ name: z.string().trim().min(1).max(120) }),
  import: z.object({ group_id: uuid, rows: z.array(recipientSchema).min(1).max(1000) }),
  preview_import: z.object({ group_id: uuid, rows: z.array(recipientSchema).min(1).max(1000) }),
  revoke_invitation: z.object({ id: uuid, reason }),
  offer_state: z.object({ id: uuid, enabled: z.boolean() }),
  reconcile_mail: z.object({
    id: uuid,
    provider_id: z.string().regex(/^[A-Za-z0-9_-]{1,200}$/),
    reason,
  }),
  my_mail_preferences: z.object({ marketing_opt_out: z.boolean().optional() }),
  group_state: z.object({ id: uuid, state: z.enum(["ready", "paused"]) }),
  review: z.object({ id: uuid, status: z.enum(["rejected", "more_info"]), reason }),
  confirm: z.object({
    key,
    method: methodSchema,
    currency: currencySchema,
    amount_minor: amount.positive(),
    transaction_reference: z.string().trim().min(3).max(200),
    received_at: date,
    funds_verified: z.literal(true),
    reuse_review: z.string().max(2000).optional(),
    group_id: uuid.optional(),
    allocations: z
      .array(z.object({ order_id: uuid, amount_minor: amount.positive() }))
      .min(1)
      .max(1000),
  }),
  create_offer: z.object({
    code: z.string().regex(/^[A-Z0-9_-]{3,64}$/),
    campaign: z.string().min(1).max(120),
    package: packageSchema,
    kind: z.enum(["complimentary", "percent", "fixed"]),
    value_minor: amount,
    currency: currencySchema,
    email: z.string().email().optional().or(z.literal("")),
    duration_days: days,
    eligibility: z.enum(["all", "new_customer"]),
    renewals: z.boolean(),
    valid_from: date,
    valid_until: date,
    max_redemptions: z.number().int().min(1).max(100000),
    per_email_limit: z.number().int().min(1).max(100),
    enabled: z.boolean(),
  }),
  invitation: z.object({ id: uuid }),
  accept: z.object({ id: uuid }),
  grant: z.object({
    user_id: uuid,
    package: packageSchema,
    duration_days: days,
    starts_at: date.optional(),
    reason,
    key,
  }),
  manage_access: z.object({
    id: uuid,
    operation: z.enum(["extend", "revoke"]),
    duration_days: days.optional(),
    reason,
    key,
  }),
  allocate: z.object({
    payment_id: uuid,
    key,
    allocations: z
      .array(z.object({ order_id: uuid, amount_minor: amount.positive() }))
      .min(1)
      .max(1000),
    reuse_review: z.string().max(2000).optional(),
  }),
  refund: z.object({
    payment_id: uuid,
    order_id: uuid.optional(),
    amount_minor: amount.positive(),
    reference: z.string().min(3).max(200),
    reason,
    revoke_access: z.boolean(),
    funds_verified: z.literal(true),
    key,
  }),
  queue: z.object({ ids: z.array(uuid).min(1).max(1000) }),
  mail_preferences: z.object({
    email: z.string().email(),
    marketing_opt_out: z.boolean(),
    suppressed: z.boolean(),
  }),
  admin_list: z.object({}),
} as const;
export type CommerceAction = keyof typeof commandSchemas;
export function parseCommand(input: unknown) {
  const { action, data } = z
    .object({ action: z.string(), data: z.unknown().default({}) })
    .parse(input);
  if (!(action in commandSchemas)) throw new Error("Invalid commerce action");
  return {
    action: action as CommerceAction,
    data: commandSchemas[action as CommerceAction].parse(data),
  };
}
export interface PaymentMethod {
  code: string;
  enabled: boolean;
  instructions: string;
  instructions_localized?: Partial<Record<z.infer<typeof localeSchema>, string>>;
  destination: string;
  qr_url?: string;
  currencies: string[];
}
export interface Quote {
  original_minor: number;
  final_minor: number;
  currency: string;
  offer_kind?: string;
  offer_duration_days?: number;
}
export interface Order extends Quote {
  id: string;
  reference: string;
  user_id: string | null;
  recipient_email: string;
  package: PackageKey;
  billing_interval: string;
  review_status: string;
  review_reason?: string;
  method: string;
  expires_at: string;
  instructions_snapshot: PaymentMethod;
  group_id: string | null;
  entitlement?: Entitlement;
  receipts?: Receipt[];
}
export interface Entitlement {
  id: string;
  user_id: string;
  package: PackageKey;
  order_id: string | null;
  grant_id: string | null;
  starts_at: string;
  ends_at: string;
  revoked_at: string | null;
}
export interface Receipt {
  id: string;
  order_id: string;
  suspected_reuse: boolean;
  created_at: string;
}
export interface Invitation extends Recipient {
  id: string;
  group_id: string;
  order_id?: string;
  accepted_at?: string;
  accepted_by?: string;
  revoked_at?: string;
  delivery?: string;
  send_status?: string;
}
export interface Group {
  id: string;
  name: string;
  send_state: string;
}
export interface Payment {
  id: string;
  amount_minor: number;
  currency: string;
  method: string;
  transaction_reference: string;
  group_id?: string;
  user_id?: string;
}
export interface Offer {
  id: string;
  code: string;
  package: PackageKey;
  kind: string;
  renewals: boolean;
  valid_until: string;
  enabled: boolean;
}
export interface AdminData {
  groups: Group[];
  orders: Order[];
  invitations: Invitation[];
  payments: Payment[];
  entitlements: Entitlement[];
  offers: Offer[];
  grants: { id: string; user_id: string; package: PackageKey; invitation_id?: string }[];
  refunds: { id: string; amount_minor: number; payment_id: string; order_id: string | null }[];
  allocations: { payment_id: string; order_id: string; amount_minor: number }[];
  audit?: {
    id: string;
    actor: string | null;
    action: string;
    target_id: string | null;
    created_at: string;
    details: unknown;
  }[];
  methods: PaymentMethod[];
}

/** A future verified adapter owns ONLY the entitlement source it issued. */
export interface UnifiedPaymentProvider {
  code: string;
  createPayment(
    order: Readonly<Order>,
    idempotencyKey: string,
  ): Promise<{ reference: string; redirectUrl?: string }>;
  verifyNotification(request: Request): Promise<{
    eventId: string;
    paymentReference: string;
    state: "confirmed" | "failed" | "refunded" | "cancelled";
    amountMinor: number;
    currency: string;
  } | null>;
  reconcile(reference: string): Promise<{ state: string; amountMinor: number; currency: string }>;
  refund(
    reference: string,
    amountMinor: number,
    idempotencyKey: string,
  ): Promise<{ reference: string; state: string }>;
}
