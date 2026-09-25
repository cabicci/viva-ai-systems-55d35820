export const welcomeContent = {
  subject: "مرحبًا بك في مسارات | Welcome to Masaarat",
  text: "تم تأكيد بريد حسابك في مسارات. يمكنك تسجيل الدخول من https://masaarat.ai/login ومراجعة حسابك. للمساعدة: https://masaarat.ai/contact\nهذه رسالة خدمة لتأكيد جاهزية حسابك وليست رسالة تسويقية. لا ترسل بيانات الأطفال عبر البريد.\n\nYour Masaarat account email is confirmed. Sign in at https://masaarat.ai/login to access your account. For help: https://masaarat.ai/contact\nThis is an account service message, not a marketing email. Do not send child details by email.",
};
type Db = {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};
type Send = (message: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}) => Promise<{ ok: true; emailId: string } | { ok: false; retryable?: boolean }>;
export async function authorizedWelcomeJob(request: Request, secret: string | undefined) {
  if (!secret || secret.length < 32) return false;
  const value = request.headers.get("authorization");
  if (!value || value.length > 1024) return false;
  const hash = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([hash(`Bearer ${secret}`), hash(value)]);
  return a.reduce((difference, byte, i) => difference | (byte ^ b[i]), 0) === 0;
}
export async function runWelcomeJob(db: Db, send: Send) {
  const claims = await db.rpc("claim_account_welcome_emails");
  if (claims.error || !Array.isArray(claims.data)) throw new Error("welcome_claim_failed");
  const stats = { accepted: 0, deferred: 0 };
  for (const claim of claims.data as {
    user_id: string;
    recipient: string;
    claim_token: string;
  }[]) {
    let result: Awaited<ReturnType<Send>>;
    try {
      result = await send({
        to: claim.recipient,
        ...welcomeContent,
        idempotencyKey: `account-welcome-v1/${claim.user_id}`,
      });
    } catch {
      result = { ok: false, retryable: true };
    }
    const saved = await db.rpc("complete_account_welcome_email", {
      p_user: claim.user_id,
      p_claim: claim.claim_token,
      p_email_id: result.ok ? result.emailId : null,
      p_block: !result.ok && result.retryable === false,
    });
    if (saved.error || saved.data !== true) throw new Error("welcome_record_failed");
    if (result.ok) stats.accepted++;
    else stats.deferred++;
  }
  return stats;
}
