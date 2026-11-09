import { useId } from 'react';
import type { AiConsentController } from '@/lib/kids/ai-consent-types';
import { getKidsAiConsentCopy } from '@/lib/kids/ai-consent-copy';
import type { SupportedLocale } from '@/lib/locale/types';

const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const languageNames: Record<SupportedLocale, string> = { en: 'English', 'ar-EG': 'العربية المصرية', 'ar-MSA': 'العربية الفصحى', 'ar-Gulf': 'العربية الخليجية' };
const languageTag = (locale: SupportedLocale) => locale === 'en' ? 'en' : locale === 'ar-EG' ? 'ar-EG' : 'ar';
const direction = (locale: SupportedLocale) => locale === 'en' ? 'ltr' : 'rtl';
function timestamp(value: string, locale: SupportedLocale) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(languageTag(locale), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(date);
}

export function KidsAiConsentView({ controller: c, locale }: { controller: AiConsentController; locale: SupportedLocale }) {
  const p = getKidsAiConsentCopy(locale), id = useId();
  const state = c.phase === 'ready' && c.consentPhase === 'ready' && c.consent?.profileId === c.profileId ? c.consent : null;
  const notice = state?.notice, currentText = notice?.texts[locale];
  const canAccept = !!(state && notice && currentText?.trim() && state.eligible && !state.allowed && c.checked && !c.busy);
  const canWithdraw = state?.event?.action === 'accept';
  return (
    <section id="kids-ai-consent" aria-labelledby={`${id}-title`} dir={direction(locale)} lang={languageTag(locale)} className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-4 text-card-foreground sm:p-6">
      <header className="space-y-2">
        <h2 id={`${id}-title`} className="text-xl font-bold">{p.title}</h2>
        <p className="text-sm leading-relaxed">{p.purpose}</p>
      </header>
      {c.phase === 'signed-out' ? <p role="status">{p.signedOut}</p> :
        c.phase === 'loading' ? <p role="status">{p.loadingProfiles}</p> :
        c.phase === 'error' ? <div className="space-y-3"><p role="alert">{p.profilesError}</p><button type="button" className={button} onClick={c.refreshProfiles} disabled={c.busy}>{p.retry}</button></div> : <>
          <div className="space-y-3">
            {c.profiles.length === 0 ? <p role="status">{p.noProfiles}</p> : <>
              <label htmlFor={`${id}-profile`} className="block text-sm font-bold">{p.profile}</label>
              <select id={`${id}-profile`} value={c.profileId} disabled={c.busy} onChange={e => c.selectProfile(e.target.value)} className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-foreground">
                <option value="">{p.chooseProfile}</option>
                {c.profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.displayName}</option>)}
              </select>
            </>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={c.busy || c.profilesLoadingMore} onClick={c.refreshProfiles}>{p.refreshProfiles}</button>
              {c.moreProfiles && <button type="button" className={button} disabled={c.busy || c.profilesLoadingMore} onClick={c.loadMoreProfiles}>{p.moreProfiles}</button>}
            </div>
            {c.profilesLoadingMore && <p role="status">{p.loadingMoreProfiles}</p>}
            {c.profilesPageError && <div className="space-y-2"><p role="alert">{p.profilesPageError}</p><button type="button" className={button} disabled={c.busy || c.profilesLoadingMore} onClick={c.loadMoreProfiles}>{p.retry}</button></div>}
          </div>
          {c.profileId && <div className="space-y-5" aria-busy={c.busy || c.consentPhase === 'loading'}>
            {c.consentPhase === 'loading' ? <p role="status">{p.loadingConsent}</p> : !state ? <div className="space-y-3">
              <p role={c.consentPhase === 'error' ? 'alert' : 'status'}>{c.consentPhase === 'error' ? p.consentError : p.consentIdle}</p>
              <button type="button" className={button} onClick={c.refreshConsent} disabled={c.busy}>{p.refreshConsent}</button>
            </div> : <>
              <p role="status" className="font-bold">{state.allowed ? p.allowed : p.notAllowed}</p>
              {c.busy && <p role="status">{p.saving}</p>}
              {c.mutationError && <p role="alert" className="rounded-xl border border-border p-3 text-sm leading-relaxed">{p.uncertain}</p>}
              {notice && currentText?.trim() ? <section aria-labelledby={`${id}-notice`} className="space-y-3">
                <h3 id={`${id}-notice`} className="font-bold">{p.currentNotice}</h3>
                <dl className="flex flex-wrap gap-4 text-sm">
                  <div className="min-w-0 max-w-full"><dt className="font-bold">{p.version}</dt><dd className="break-words"><bdi>{notice.version}</bdi></dd></div>
                  <div className="min-w-0 max-w-full"><dt className="font-bold">{p.country}</dt><dd><bdi>{notice.countryCode}</bdi></dd></div>
                </dl>
                <p className="whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">{currentText}</p>
              </section> : <p role="status">{p.noNotice}</p>}
              {!state.eligible && <p className="text-sm leading-relaxed">{p.ineligible}</p>}
              {notice && currentText?.trim() && state.eligible && !state.allowed && <label htmlFor={`${id}-accept`} className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm leading-relaxed">
                <input id={`${id}-accept`} type="checkbox" checked={c.checked} disabled={c.busy} onChange={e => c.setChecked(e.target.checked)} aria-describedby={`${id}-notice`} className="mt-1 h-5 w-5 shrink-0" />
                <span>{p.optIn}</span>
              </label>}
              <div className="flex flex-wrap gap-2">
                {!state.allowed && <button type="button" className={button} disabled={!canAccept} onClick={c.accept}>{p.accept}</button>}
                {canWithdraw && <button type="button" className={button} disabled={c.busy} onClick={c.withdraw}>{p.withdraw}</button>}
                <button type="button" className={button} disabled={c.busy} onClick={c.refreshConsent}>{p.refreshConsent}</button>
              </div>
              <p className="text-sm leading-relaxed">{p.withdrawal}</p>
              <section aria-labelledby={`${id}-latest`} className="space-y-3 border-t border-border pt-4">
                <h3 id={`${id}-latest`} className="font-bold">{p.latest}</h3>
                {state.event ? <>
                  <p className="text-sm">{state.event.action === 'accept' ? p.accepted : p.withdrawn}{' · '}<time dateTime={state.event.createdAt}>{timestamp(state.event.createdAt, locale)}</time></p>
                  {state.acceptedNotice && <>
                    <p className="text-sm font-bold">{p.acceptedText}{' · '}{p.version}: <bdi>{state.acceptedNotice.version}</bdi>{' · '}{p.recordedLanguage}: <bdi>{languageNames[state.event.locale]}</bdi></p>
                    <p dir={direction(state.event.locale)} lang={languageTag(state.event.locale)} className="whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">{state.acceptedNotice.text}</p>
                  </>}
                </> : <p className="text-sm">{p.noEvent}</p>}
              </section>
              <section aria-labelledby={`${id}-history`} className="space-y-3 border-t border-border pt-4">
                <h3 id={`${id}-history`} className="font-bold">{p.history}</h3>
                <p className="text-sm leading-relaxed">{p.historyReadOnly}</p>
                {c.historyPhase === 'loading' && <p role="status">{p.loadingHistory}</p>}
                {c.historyPhase === 'error' && <p role="alert">{p.historyError}</p>}
                {c.historyPhase === 'ready' && c.history.length === 0 && <p role="status">{p.noHistory}</p>}
                {c.history.length > 0 && <ol className="space-y-3">
                  {c.history.map(item => <li key={item.id} className="min-w-0 rounded-xl border border-border p-3">
                    <p className="text-sm font-bold">{item.action === 'accept' ? p.accepted : p.withdrawn}{' · '}{p.version}: <bdi className="break-words">{item.version}</bdi></p>
                    <p className="text-sm"><time dateTime={item.createdAt}>{timestamp(item.createdAt, locale)}</time>{' · '}{p.recordedLanguage}: <bdi>{languageNames[item.locale]}</bdi></p>
                    <details className="mt-2">
                      <summary className="cursor-pointer rounded py-2 text-sm font-bold">{p.showText}</summary>
                      <p dir={direction(item.locale)} lang={languageTag(item.locale)} className="whitespace-pre-wrap break-words py-3 text-sm leading-relaxed">{item.text}</p>
                    </details>
                  </li>)}
                </ol>}
                {(c.historyPhase === 'idle' || c.historyPhase === 'error' || c.moreHistory) && <button type="button" className={button} disabled={c.busy || c.historyPhase === 'loading'} onClick={c.loadHistory}>
                  {c.historyPhase === 'error' ? p.retry : c.historyPhase === 'idle' ? p.showHistory : p.moreHistory}
                </button>}
              </section>
            </>}
          </div>}
        </>}
    </section>
  );
}
