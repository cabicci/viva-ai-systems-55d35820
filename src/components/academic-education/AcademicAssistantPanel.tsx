import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLocale } from "@/lib/locale/types";

type Answer = { answer: string; sources: { lessonId: string; sectionId: string }[] };
export function AcademicAssistantPanel({ courseId, lessonId, locale }: {
  courseId: string; lessonId: string; locale: SupportedLocale;
}) {
  const en = locale === "en";
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [denied, setDenied] = useState(false);
  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || denied || question.trim().length < 2) return;
    setBusy(true);
    setError(false);
    setResponse(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<Answer>(
        "academic-assistant", { body: { courseId, lessonId, locale, query: question.trim() } },
      );
      if (invokeError || !data || typeof data.answer !== "string" || !Array.isArray(data.sources)) {
        // The server returns a fresh permission decision for each question.
        const status = (invokeError as { context?: Response } | null)?.context?.status;
        if (status === 403 || (data as { error?: string } | null)?.error === "ACADEMIC_ASSISTANT_ACCESS_REQUIRED")
          setDenied(true);
        throw new Error("ACADEMIC_ASSISTANT_UNAVAILABLE");
      }
      setResponse(data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p>{en ? "Ask about any lesson in this course." : "اسأل عن أي درس في هذا المنهج."}</p>
      {denied ? <p role="alert">{en ? "Assistant access has ended." : "انتهت صلاحية المساعد."}</p>
        : <form onSubmit={(event) => void ask(event)} className="space-y-3">
        <label htmlFor="academic-assistant-question" className="block font-semibold">
          {en ? "Your question" : "سؤالك"}
        </label>
        <textarea id="academic-assistant-question" value={question}
          onChange={(event) => setQuestion(event.target.value)} maxLength={1500}
          className="w-full rounded-lg border p-3" rows={3} disabled={busy} />
        <Button type="submit" disabled={busy || question.trim().length < 2}>
          {busy ? (en ? "Searching the course…" : "جارٍ البحث في المنهج…")
            : (en ? "Ask" : "اسأل")}
        </Button>
      </form>}
      {error && !denied && <p role="alert">{en ? "The assistant is unavailable right now. Try again later."
        : "المساعد غير متاح الآن. حاول لاحقًا."}</p>}
      {response && <div aria-live="polite" className="space-y-3 rounded-lg border p-4">
        <p className="whitespace-pre-wrap">{response.answer}</p>
        {response.sources.length > 0 && <div>
          <p className="font-semibold">{en ? "Course sections used:" : "الأقسام المستخدمة من المنهج:"}</p>
          <ul className="list-inside list-disc">
            {response.sources.map((source, index) => <li key={`${source.lessonId}:${source.sectionId}:${index}`}>
              {source.lessonId} — {source.sectionId}
            </li>)}
          </ul>
        </div>}
      </div>}
    </div>
  );
}
