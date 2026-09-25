# Auth email personalization: technical answer (read-only, nothing to build yet)

**الخلاصة:** الاسم واللغة غير موجودين في بيانات الرسالة الموقّعة. الطريق المدعوم الوحيد هو البحث على السيرفر، ويكون آمنًا فقط عندما يوجد حساب واحد مطابق وبريده مؤكَّد أو ينتظر التأكيد لنفس الحدث. في أي حالة غير مؤكدة، تُرسل نسخة عربية عامة بدون اسم.

## 1. Async render / resolver: verified (installed `@lovable.dev/email-js` 0.1.0, `dist/index.d.ts` lines 119-137)
```text
type AuthEmailDefinition =
  | { subject: string; render: (data: AuthEmailHookData) => ReactElement | Promise<ReactElement> }
  | ((data: AuthEmailHookData) => AuthEmailContent | Promise<AuthEmailContent>);
interface AuthEmailContent { subject: string; element: ReactElement }
createAuthEmailHandler(options: AuthEmailHandlerOptions): (req: Request) => Promise<Response>
```
- `dist/index.js` line 225 awaits both forms. So an async lookup is supported.
- The function form also lets the **subject** change with the locale. The object form keeps the subject fixed.
- There is no separate data-resolver hook.

## 2. Verified user ID or metadata in the signed request: not available
- Verified: `WebhookEnvelope` holds only `event_id`, `run_id`, `type`, `project_id`, `environment`, `data`, `timestamp`, `version` and `replay_id`.
- Verified: `AuthEmailHookData` has the 9 fields you listed. It has no `user`, `user_id` or `user_metadata`.
- Verified: the parser (line 178-183) checks only `version`, `type`, `action_type` and `email`. It passes the parsed JSON through without stripping fields.
  - So extra fields in the raw payload would survive, but only outside the type.
- Not verified: whether Lovable's backend actually sends extra fields. Confirming this needs one captured real request.
  - Even if such fields exist, they are undocumented and could change, so we should not depend on them.
- Verified: the handler always sends to `event.data.email` (line 229). One webhook call produces exactly one email.

## 3. Native Send Email Hook or SMTP (with Resend): not available here
- Verified in earlier turns: the auth settings tool only controls signup, auto-confirm, anonymous sign-in, leaked-password checks, the current-password requirement and the email rate limit.
  - It has no SMTP fields and no hook fields.
  - There is no dashboard access on Lovable Cloud.
- Platform guidance: auth emails route through Lovable's email service by design, and changing `hook_send_email_enabled` is not supported.
  - This is documented, not a setting I tested by toggling it (that would be a change).
- Conclusion: no supported way to get `user.id` or `user_metadata` through a native hook, and no Resend path for auth emails.

## 4. Looking up the account by email (with the service key)
The lookup finds the account in the user table, `auth.users`, where the email matches `data.email`, ignoring upper/lower case.

| Event | Account exists when the email is sent? | Reliability |
|---|---|---|
| signup | Assumed yes: the account is normally created before the confirmation email, with `full_name` and `preferred_locale` already saved (the signup page saves them) | Good. Not verified on a live request |
| recovery, magiclink, reauthentication | Yes, an existing account with this email | Good |
| invite | The invited account is created with empty metadata | Name and language not available, so use the generic version |
| email_change (to old address) | `email` = old address, which is still the account's current email | Good |
| email_change (to new address) | The new address sits in the account's pending-change field (`email_change`), not in `email` | Needs a second lookup on that field. Assumed: each address gets its own webhook call, with `data.email` = that recipient |

Failure modes:
- **Wrong person.** Emails are unique among confirmed accounts. An unconfirmed signup or a pending change could collide with another account's address.
  - Rule: use the lookup result only when **exactly one** account matches for this action. Otherwise use the generic version.
- **Timing.** A race between signup and email, or metadata edited later, could give a missing or stale name.
  - This is harmless when there is a fallback.
- **Privacy.** The name only ever goes to the address that owns the account, or the pending address of that same account. Links and codes stay untouched.
- **Failure or slowness.** A database error must never block the email. Wrap the lookup in try/catch with a short timeout and fall back.
- **Unsafe metadata.** The name is user-supplied, so React escaping must stay. Also cap its length and strip control characters.
- **Unknown locale.** Any value outside ar-EG/ar-MSA/ar-Gulf/en falls back to ar-EG (the same rule as the welcome emails).

## 5. Recommendation (not implemented)
Use a server-only lookup inside the function form of each auth email, so the subject and body both follow the locale.
1. Add a `SECURITY DEFINER` database function `auth_email_profile(p_email text, p_action text)` that returns only `full_name` and `preferred_locale`.
   - It returns them only when exactly one account matches: on `email`, or, for `email_change`, on the pending new email.
   - It can be run only by `service_role`, never by `anon` or `authenticated`.
2. The webhook route calls it with the admin client, which is loaded inside the handler, with a timeout of about 1.5s and a generic Arabic fallback.
3. Templates get `locale` and `name` props. They set `dir`/`lang`, localized copy per event and a localized subject.
   - Confirmation links and codes stay exactly as they are.
4. Invite always uses the generic version.
5. Tests: unit tests for the resolver (0, 1 or 2 matches, bad locale, error or timeout) and render snapshots for 4 locales x 6 events.
   - Then one controlled test email to an approved account, and only after your review.

Keep the site unpublished until this ships. Publishing now would activate the current fixed-Arabic templates.

## Verified vs assumed
- **Verified:** the SDK types and implementation above, the envelope fields, the one-email-per-call behavior, and that my auth tools have no SMTP or hook setting.
- **Assumed:**
  - the account row exists before the signup email is sent
  - email change sends one webhook per recipient
  - the raw payload has no extra fields
