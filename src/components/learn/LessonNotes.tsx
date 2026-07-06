import { useEffect, useRef, useState } from "react";
import { Loader2, NotebookPen, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<string | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  const [open, setOpen] = useState(false);
  const initial = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;
      if (cancelled) return;
      setAuth(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("lesson_notes")
        .select("content")
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (cancelled) return;
      const text = data?.content ?? "";
      initial.current = text;
      setContent(text);
      if (text.trim().length > 0) setOpen(true);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  useEffect(() => {
    if (loading || !auth) return;
    if (content === initial.current) return;
    if (timer.current) clearTimeout(timer.current);
    setState("saving");
    timer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("lesson_notes")
        .upsert(
          { user_id: auth, lesson_id: lessonId, content },
          { onConflict: "user_id,lesson_id" },
        );
      if (error) {
        setState("error");
      } else {
        initial.current = content;
        setState("saved");
        setTimeout(
          () => setState((s) => (s === "saved" ? "idle" : s)),
          1800,
        );
      }
    }, AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, lessonId, auth, loading]);

  if (!auth && !loading) return null;

  return (
    <section
      className="mt-8 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:p-5"
      aria-label={getUiString(locale, "learn.notes.ariaLabel")}
      dir={dir}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
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

      {open && (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            disabled={loading}
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

      {!open && content.trim().length === 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
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
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {getUiString(locale, "learn.notes.loading")}
      </span>
    );
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {getUiString(locale, "learn.notes.saving")}
      </span>
    );
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary">
        <Check className="h-3 w-3" />
        {getUiString(locale, "learn.notes.saved")}
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-destructive">
        <AlertCircle className="h-3 w-3" />
        {getUiString(locale, "learn.notes.error")}
      </span>
    );
  return null;
}
