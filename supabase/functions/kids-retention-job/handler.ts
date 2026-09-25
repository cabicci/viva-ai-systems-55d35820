export type NoticeClaim = {
  notice_id: string;
  claim_token: string;
  recipient_email: string;
  expiry: string;
  first_attempt_at: string;
};
export type RpcResult = { data: unknown; error: unknown };
export type RetentionDb = {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<RpcResult>;
};
export type SendNotice = (message: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}) => Promise<{ ok: true; emailId: string } | { ok: false; retryable?: boolean }>;

export function retentionNotice(expiry: string, now = Date.now()) {
  const expiryMs = Date.parse(expiry);
  if (!Number.isFinite(expiryMs)) throw new Error("Invalid notice expiry");
  const earliest = new Date(Math.max(expiryMs + 90 * 86400000, now + 14 * 86400000))
    .toISOString()
    .slice(0, 10);
  return {
    subject: "مسارات كيدز: تنبيه بشأن حفظ ملفات التعلم | Kids data retention notice",
    text: `انتهى اشتراك كيدز المرتبط بحسابك. نحتفظ بملفات الأطفال وتقدمهم لمدة 90 يومًا بعد انتهاء الاشتراك، ثم نحذفها بعد تنبيهك.\nلن يبدأ الحذف قبل ${earliest}، ولن يحدث قبل مرور 14 يومًا كاملة على تسليم هذا التنبيه. إذا تجدد اشتراك كيدز قبل الحذف، يُلغى الحذف المرتبط بانتهائه السابق.\nراجع حسابك: https://masaarat.ai/kids\nللاستفسار أو طلب الوصول أو المحو: https://masaarat.ai/contact\nلا ترسل أسماء الأطفال أو بياناتهم في رسالتك. هذه رسالة خدمة وليست رسالة تسويقية.\n\nYour Kids subscription has expired. Child profiles and learning progress are retained for 90 days after expiry, then deleted after notice. Deletion will not start before ${earliest} or before 14 full days have passed since delivery of this notice, whichever is later. Renewing Kids before deletion cancels deletion associated with the previous expiry.\nAccount: https://masaarat.ai/kids\nAccess, erasure or support requests: https://masaarat.ai/contact\nDo not include child details in your reply. This is a service notice, not a marketing email.`,
  };
}

/** Bounded service worker. All authority, scope and deadlines are rechecked by SQL. */
export async function runKidsRetention(db: RetentionDb, send: SendNotice) {
  const stats = { submitted: 0, deferred: 0, deletedProfiles: 0 };
  const prepared = await db.rpc("kids_prepare_retention_notices", { p_limit: 25 });
  if (prepared.error) throw new Error("Retention preparation failed");
  const claims = await db.rpc("kids_claim_retention_notices", { p_limit: 5 });
  if (claims.error || !Array.isArray(claims.data)) throw new Error("Retention claim failed");
  for (const claim of claims.data as NoticeClaim[]) {
    // Keep the payload byte-identical across retries of the same provider key.
    const content = retentionNotice(claim.expiry, Date.parse(claim.first_attempt_at));
    let result: Awaited<ReturnType<SendNotice>>;
    try {
      result = await send({
        to: claim.recipient_email,
        ...content,
        idempotencyKey: `kids-retention/${claim.notice_id}`,
      });
    } catch {
      result = { ok: false };
    }
    if (!result.ok) {
      if (result.retryable === false) {
        await db.rpc("kids_block_retention_notice", {
          p_notice: claim.notice_id,
          p_claim: claim.claim_token,
        });
      }
      stats.deferred++;
      continue;
    }
    const stored = await db.rpc("kids_record_retention_submission", {
      p_notice: claim.notice_id,
      p_claim: claim.claim_token,
      p_email_id: result.emailId,
    });
    if (stored.error || stored.data !== true) stats.deferred++;
    else stats.submitted++;
  }
  const candidates = await db.rpc("kids_retention_deletion_candidates", { p_limit: 25 });
  if (candidates.error || !Array.isArray(candidates.data))
    throw new Error("Retention deletion scan failed");
  for (const { notice_id } of candidates.data as { notice_id: string }[]) {
    const result = await db.rpc("kids_delete_expired_profiles", { p_notice: notice_id });
    if (result.error || typeof result.data !== "number") stats.deferred++;
    else stats.deletedProfiles += result.data;
  }
  return stats;
}

export async function authorizedRetentionJob(request: Request, secret: string | undefined) {
  if (!secret || secret.length < 32) return false;
  const value = request.headers.get("authorization");
  if (!value || value.length > 1024) return false;
  const digest = async (text: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  const [expected, actual] = await Promise.all([digest(`Bearer ${secret}`), digest(value)]);
  return expected.reduce((difference, byte, index) => difference | (byte ^ actual[index]), 0) === 0;
}
