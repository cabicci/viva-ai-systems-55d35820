import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useKidsCompletion } from "@/lib/journey/client";
import { journeyCopy } from "@/lib/journey/copy";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";
export function KidsStepCompletion({
  profile,
  level,
  lesson,
  locale,
}: {
  profile: string;
  level: string;
  lesson: number;
  locale: SupportedLocale;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const c = journeyCopy(locale);
  const query = useKidsCompletion(profile, level, locale);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (profile === user?.id) return <p className="text-sm text-muted-foreground">{c.previewNote}</p>;
  const complete = query.data?.some((row) => row.lesson_number === lesson) === true;
  async function save() {
    setBusy(true);
    setFailed(false);
    try {
      const { data, error } = await supabase.rpc(
        "complete_kids_step" as never,
        { p_profile: profile, p_level: level, p_lesson: lesson, p_locale: locale } as never,
      );
      if (error || data !== true) throw new Error("KIDS_COMPLETION_UNAVAILABLE");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["kids-completion", user?.id, profile] }),
        qc.invalidateQueries({ queryKey: ["kids-journey", user?.id, profile] }),
      ]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-3 text-sm text-muted-foreground">{c.markNote}</p>
      {query.isPending ? (
        <p role="status">{c.loading}</p>
      ) : query.isError ? (
        <p role="alert">
          {c.error}{" "}
          <button className="underline" onClick={() => void query.refetch()}>
            {c.retry}
          </button>
        </p>
      ) : (
        <Button disabled={busy || complete} onClick={() => void save()}>
          {complete ? c.marked : c.mark}
        </Button>
      )}
      {failed && (
        <p role="alert" className="mt-3">
          {c.saveError}
        </p>
      )}
    </section>
  );
}
