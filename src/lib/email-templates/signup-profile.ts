export type MailLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";

export type SignupProfile = { name: string | null; locale: MailLocale | null };

/** The signed webhook recipient is the only lookup key. Never query by a browser-supplied name. */
export async function resolveSignupProfile(
  recipient: string,
  lookup: (email: string) => Promise<Array<{ full_name: unknown; preferred_locale: unknown }>>,
  timeoutMs = 1500,
): Promise<SignupProfile> {
  if (typeof recipient !== "string" || recipient.length > 320 || !recipient.includes("@")) {
    return { name: null, locale: null };
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const rows = await Promise.race([
      lookup(recipient),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("profile lookup timeout")), timeoutMs);
      }),
    ]);
    if (rows.length !== 1) return { name: null, locale: null };
    const rawName = rows[0].full_name;
    const name =
      typeof rawName === "string" && !/[\p{Cc}\p{Cf}]/u.test(rawName)
        ? rawName.trim().replace(/\s+/g, " ")
        : "";
    const rawLocale = rows[0].preferred_locale;
    const locale: MailLocale | null =
      rawLocale === "en" ||
      rawLocale === "ar-EG" ||
      rawLocale === "ar-MSA" ||
      rawLocale === "ar-Gulf"
        ? rawLocale
        : null;
    return {
      name: name.length >= 2 && name.length <= 80 && !/[\p{Cc}\p{Cf}]/u.test(name) ? name : null,
      locale,
    };
  } catch {
    // Mail must still reach the recipient even if account creation or lookup is delayed.
    return { name: null, locale: null };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
