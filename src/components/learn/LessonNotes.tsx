import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth, type AuthGeneration, type AuthContinuity } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";
import { Loader2, NotebookPen, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

type SaveState = "idle" | "saving" | "saved" | "error" | "unconfirmed";
type NoteOwner = { userId: string; lessonId: string; generation: AuthGeneration; continuity: AuthContinuity };
type NoteDocument = { owner: NoteOwner; content: string; persisted: string; revision: number; open: boolean; readError: boolean; state: SaveState; writePending: boolean; persistedKnown: boolean };
function sameOwner(a: NoteOwner | null, b: NoteOwner | null): boolean {
  return a !== null && b !== null && a.userId === b.userId && a.lessonId === b.lessonId && a.generation === b.generation;
}
function sameContext(a: NoteOwner, b: NoteOwner): boolean {
  return a.userId === b.userId && a.lessonId === b.lessonId && a.continuity === b.continuity;
}
// Equality to a cached base cannot confirm the outcome of a retired issued write.
function isDirty(doc: NoteDocument): boolean {
  return !doc.persistedKnown || doc.content !== doc.persisted;
}
const UNCONFIRMED_COPY: Record<SupportedLocale, string> = {
  "ar-EG": "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0641\u0638 \u0645\u0634 \u0645\u062a\u0627\u062d. \u0645\u0645\u0643\u0646 \u062a\u062d\u0627\u0648\u0644 \u062a\u0627\u0646\u064a.",
  "ar-MSA": "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0641\u0638 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d. \u064a\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
  "ar-Gulf": "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0641\u0638 \u0645\u0648 \u0645\u062a\u0627\u062d. \u062a\u0642\u062f\u0631 \u062a\u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u062b\u0627\u0646\u064a\u0629.",
  en: "Save confirmation is unavailable. You can retry saving.",
};
const READ_COPY: Record<SupportedLocale, { error: string; retry: string; retrySave: string }> = {
  "ar-EG": { error: "ما قدرناش نحمّل ملاحظاتك. جرّب تاني قبل الكتابة.", retry: "حاول تحميل الملاحظات تاني", retrySave: "حاول حفظ الملاحظات تاني" },
  "ar-MSA": { error: "تعذر تحميل ملاحظاتك. أعد المحاولة قبل الكتابة.", retry: "إعادة تحميل الملاحظات", retrySave: "إعادة حفظ الملاحظات" },
  "ar-Gulf": { error: "ما قدرنا نحمّل ملاحظاتك. حاول مرة ثانية قبل الكتابة.", retry: "أعد تحميل الملاحظات", retrySave: "أعد حفظ الملاحظات" },
  en: { error: "Your notes could not be loaded. Retry before editing.", retry: "Reload notes", retrySave: "Retry saving notes" },
};

const MAX_LEN = 5000;
const AUTOSAVE_MS = 1200;

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

interface LessonNotesProps {
  lessonId: string;
}

/**
 * Personal lesson notes — auto-saved per (user, lesson).
 * Uses RLS-protected `lesson_notes` table via the browser Supabase client.
 */
export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { locale, dir } = useLocale();
  const { user, loading: authLoading, authGeneration, authContinuity, isAuthGenerationCurrent } = useAuth();
  const userId = user?.id ?? null;
  const [document, setDocument] = useState<NoteDocument | null>(null);
  const [readAttempt, setReadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const currentOwner = useRef<NoteOwner | null>(null);
  const latestDocument = useRef(document);
  useLayoutEffect(() => { latestDocument.current = document; }, [document]);
  useLayoutEffect(() => {
    const owner = userId && !authLoading ? { userId, lessonId, generation: authGeneration, continuity: authContinuity } : null;
    currentOwner.current = owner;
    // Retain local dirty text only across an observed uninterrupted context.
    // Old async work still carries its retired generation and cannot settle this document.
    setDocument((prev) => prev && owner && !sameOwner(prev.owner, owner) && sameContext(prev.owner, owner)
      && !prev.readError && isDirty(prev)
      ? { ...prev, owner, writePending: false, persistedKnown: prev.writePending ? false : prev.persistedKnown, state: prev.writePending ? "unconfirmed" : prev.state === "error" || prev.state === "unconfirmed" ? prev.state : "idle" }
      : prev);
    return () => { currentOwner.current = null; };
  }, [userId, lessonId, authGeneration, authContinuity, authLoading]);
  const isCurrent = useCallback((owner: NoteOwner) =>
    sameOwner(currentOwner.current, owner) && isAuthGenerationCurrent(owner.generation),
  [isAuthGenerationCurrent]);
  const renderOwner = userId && !authLoading ? { userId, lessonId, generation: authGeneration, continuity: authContinuity } : null;
  const owned = document && sameOwner(document.owner, renderOwner) ? document : null;
  const loading = authLoading || (userId !== null && owned === null);
  const readError = owned?.readError ?? false;
  const content = !loading && !readError ? owned?.content ?? "" : "";
  const open = !loading && !readError && (owned?.open ?? false);
  const state = owned?.state ?? "idle";
  const readCopy = READ_COPY[locale];
  const updateOwned = (change: (doc: NoteDocument) => NoteDocument) => {
    setDocument((prev) => prev && isCurrent(prev.owner) && !prev.readError ? change(prev) : prev);
  };

  useEffect(() => {
    if (!userId || authLoading) { setDocument(null); return; }
    const owner: NoteOwner = { userId, lessonId, generation: authGeneration, continuity: authContinuity };
    const local = latestDocument.current;
    // Do not replace a retained dirty document with a newly fetched old value.
    if (local && sameContext(local.owner, owner) && !local.readError && isDirty(local)) return;
    let cancelled = false;
    setDocument(null);
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("lesson_notes")
          .select("content")
          .eq("user_id", owner.userId)
          .eq("lesson_id", owner.lessonId)
          .maybeSingle();
        if (error) throw error;
        if (cancelled || !isCurrent(owner)) return;
        const text = data?.content ?? "";
        setDocument({ owner, content: text, persisted: text, revision: 0, open: text.trim().length > 0, readError: false, state: "idle", writePending: false, persistedKnown: true });
      } catch {
        if (cancelled || !isCurrent(owner)) return;
        setDocument({ owner, content: "", persisted: "", revision: 0, open: false, readError: true, state: "idle", writePending: false, persistedKnown: false });
      }
    })();
    return () => { cancelled = true; };
  }, [userId, lessonId, authGeneration, authContinuity, authLoading, readAttempt, isCurrent]);

  useEffect(() => {
    if (!owned || loading || readError || !isDirty(owned) || owned.state === "error" || owned.state === "unconfirmed") return;
    const owner = owned.owner;
    const revision = owned.revision;
    const sentContent = owned.content;
    let active = true;
    setDocument((prev) => prev && sameOwner(prev.owner, owner) && prev.revision === revision ? { ...prev, state: "saving" } : prev);
    const handle = setTimeout(() => {
      if (!active || !isCurrent(owner)) return;
      setDocument((prev) => prev && sameOwner(prev.owner, owner) && prev.revision === revision ? { ...prev, writePending: true } : prev);
      void (async () => {
        try {
          const { error } = await supabase.from("lesson_notes").upsert(
            { user_id: owner.userId, lesson_id: owner.lessonId, content: sentContent },
            { onConflict: "user_id,lesson_id" },
          );
          if (error) throw error;
          if (!active || !isCurrent(owner)) return;
          setDocument((prev) => prev && sameOwner(prev.owner, owner) && prev.revision === revision
            ? { ...prev, persisted: sentContent, state: "saved", writePending: false, persistedKnown: true } : prev);
        } catch {
          if (!active || !isCurrent(owner)) return;
          setDocument((prev) => prev && sameOwner(prev.owner, owner) && prev.revision === revision ? { ...prev, state: "error", writePending: false } : prev);
        }
      })();
    }, AUTOSAVE_MS);
    return () => { active = false; clearTimeout(handle); };
  }, [owned?.owner, owned?.content, owned?.persisted, owned?.revision, loading, readError, saveAttempt, isCurrent]);

  useEffect(() => {
    if (!owned || state !== "saved") return;
    const owner = owned.owner;
    const revision = owned.revision;
    const handle = setTimeout(() => {
      if (!isCurrent(owner)) return;
      setDocument((prev) => prev && sameOwner(prev.owner, owner) && prev.revision === revision && prev.state === "saved" ? { ...prev, state: "idle" } : prev);
    }, 1800);
    return () => clearTimeout(handle);
  }, [owned?.owner, owned?.revision, state, isCurrent]);

  if (!userId && !authLoading) return null;

  return (
    <section
      className="mt-8 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5"
      aria-label={getUiString(locale, "learn.notes.ariaLabel")}
      dir={dir}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => updateOwned((doc) => ({ ...doc, open: !doc.open }))}
          disabled={loading || readError}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90 hover:text-foreground transition"
          aria-expanded={open}
        >
          <NotebookPen className="h-4 w-4 text-primary" />
          {getUiString(locale, "learn.notes.title")}
          {content.trim().length > 0 && !open && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {interpolate(getUiString(locale, "learn.notes.charCount"), {
                count: String(content.trim().length),
              })}
            </span>
          )}
        </button>
        <SaveBadge state={state} loading={loading} />
      </header>

      {readError && (
        <div role="alert" className="mb-3 text-sm text-destructive">
          <p>{readCopy.error}</p>
          <button type="button" className="mt-2 underline" onClick={() => setReadAttempt((n) => n + 1)}>{readCopy.retry}</button>
        </div>
      )}
      {!loading && !readError && (state === "error" || state === "unconfirmed") && (
        <button type="button" className="mb-3 text-sm underline" onClick={() => { updateOwned((doc) => ({ ...doc, state: "idle" })); setSaveAttempt((n) => n + 1); }}>{readCopy.retrySave}</button>
      )}
      {open && (
        <>
          <textarea
            value={content}
            onChange={(e) => {
              const value = e.target.value.slice(0, MAX_LEN);
              updateOwned((doc) => {
                // An issued write can still replace this cached base after this edit retires its callback.
                const persistedKnown = doc.persistedKnown && (!doc.writePending || value !== doc.persisted);
                return { ...doc, content: value, revision: doc.revision + 1, persistedKnown, state: persistedKnown ? "idle" : "unconfirmed" };
              });
            }}
            disabled={loading || readError}
            aria-label={getUiString(locale, "learn.notes.ariaLabel")}
            placeholder={getUiString(locale, "learn.notes.placeholder")}
            className="w-full min-h-[140px] rounded-xl bg-background/60 border border-border/60 px-3 py-2.5 text-[14px] leading-[1.9] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y font-sans"
            dir={dir}
          />
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>{content.length}/{MAX_LEN}</span>
            <span>{getUiString(locale, "learn.notes.footerPrivate")}</span>
          </div>
        </>
      )}

      {!loading && !readError && !open && content.trim().length === 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => updateOwned((doc) => ({ ...doc, open: true }))}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {getUiString(locale, "learn.notes.addButton")}
        </Button>
      )}
    </section>
  );
}

function SaveBadge({ state, loading }: { state: SaveState; loading: boolean }) {
  const { locale } = useLocale();

  if (loading)
    return (
      <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {getUiString(locale, "learn.notes.loading")}
      </span>
    );
  if (state === "saving")
    return (
      <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {getUiString(locale, "learn.notes.saving")}
      </span>
    );
  if (state === "saved")
    return (
      <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[11px] font-mono text-primary">
        <Check className="h-3 w-3" />
        {getUiString(locale, "learn.notes.saved")}
      </span>
    );
  if (state === "unconfirmed") return <span role="status" aria-live="polite">{UNCONFIRMED_COPY[locale]}</span>;
  if (state === "error")
    return (
      <span role="alert" className="inline-flex items-center gap-1 text-[11px] font-mono text-destructive">
        <AlertCircle className="h-3 w-3" />
        {getUiString(locale, "learn.notes.error")}
      </span>
    );
  return null;
}
