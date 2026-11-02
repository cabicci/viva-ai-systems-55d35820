import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { learningCommand } from "@/lib/learning/client";
import { learningCopy } from "@/lib/learning/copy";
import { noteDraftKey, readNoteDraft, storeNoteDraft } from "@/lib/learning/drafts";
import type { CourseRecord, LearningScope } from "@/lib/learning/contracts";
import { Button } from "@/components/ui/button";
type Note = { content: string; revision: number };
type Document = Note & {
  key: string;
  cloud: Note;
  state: "clean" | "dirty" | "saving" | "unconfirmed" | "conflict";
  requestId?: string;
};
export function LearningLessonNotes({ scope }: { scope: LearningScope }) {
  const auth = useAuth();
  const { locale } = useLocale();
  const c = learningCopy(locale);
  const subject = scope.profileId ?? auth.user?.id;
  const key =
    auth.user && subject
      ? noteDraftKey(auth.user.id, subject, scope.area, scope.course, scope.lesson)
      : null;
  const [doc, setDoc] = useState<Document | null>(null);
  const [retry, setRetry] = useState(0);
  const [localUnavailable, setLocalUnavailable] = useState(false);
  const current = useRef({ key, generation: auth.authGeneration });
  current.current = { key, generation: auth.authGeneration };
  const previousGeneration = useRef(auth.authGeneration);
  useEffect(() => {
    if (previousGeneration.current !== auth.authGeneration) {
      previousGeneration.current = auth.authGeneration;
      setDoc((d) => (d?.key === key && d.state === "saving" ? { ...d, state: "unconfirmed" } : d));
      setRetry((n) => n + 1);
    }
  }, [auth.authGeneration, key]);
  const records = useQuery({
    queryKey: ["learning-records", auth.user?.id, locale],
    enabled: !!auth.user && !auth.loading,
    queryFn: () => learningCommand<CourseRecord[]>("records", { locale }),
    staleTime: 0,
    refetchInterval: (q) =>
      q.state.data?.some(
        (r) => r.subject_id === subject && r.area === scope.area && r.course === scope.course,
      ) || q.state.errorUpdateCount > 0
        ? false
        : 3000,
  });
  const record = records.data?.find(
    (r) => r.subject_id === subject && r.area === scope.area && r.course === scope.course,
  );
  const notesEnabled = record?.learning_model?.activities.includes("notes") ?? scope.area === "ai";
  const note = useQuery({
    queryKey: ["learning-note", auth.user?.id, record?.id, scope.lesson],
    enabled: !!record && !auth.loading,
    queryFn: () => learningCommand<Note>("note", { recordId: record!.id, lesson: scope.lesson }),
    staleTime: 0,
  });
  useEffect(() => {
    setDoc((previous) => {
      if (!key) return null;
      // The live editor may be the only remaining copy when browser storage
      // is unavailable. A cloud refresh must not replace unsaved local text.
      const inMemory = previous?.key === key && previous.state !== "clean" ? previous : null;
      if (!note.data) {
        if (inMemory) return inMemory;
        const draft = readNoteDraft(key);
        return draft
          ? {
              ...draft,
              key,
              cloud: { content: "", revision: draft.revision },
              state: "unconfirmed",
            }
          : null;
      }
      const saved = note.data;
      const draft = inMemory ?? readNoteDraft(key);
      if (!draft || draft.content === saved.content) {
        storeNoteDraft(key, null);
        return { ...saved, key, cloud: saved, state: "clean" };
      }
      return {
        ...draft,
        key,
        cloud: saved,
        state: draft.revision !== saved.revision ? "conflict" : (inMemory?.state ?? "dirty"),
      };
    });
  }, [key, note.data]);
  useEffect(() => {
    const online = () => setRetry((n) => n + 1);
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []);
  useEffect(() => {
    if (
      !doc ||
      doc.key !== key ||
      !record ||
      !notesEnabled ||
      !key ||
      !note.data ||
      !["dirty", "unconfirmed"].includes(doc.state)
    )
      return;
    const operation = { key, generation: auth.authGeneration };
    const content = doc.content;
    const revision = doc.revision;
    const requestId = doc.requestId ?? crypto.randomUUID();
    const owns = () =>
      current.current.key === operation.key &&
      current.current.generation === operation.generation &&
      auth.isAuthGenerationCurrent(operation.generation);
    const timer = setTimeout(() => {
      if (!owns()) return;
      const stored = storeNoteDraft(key, { content, revision, requestId });
      setLocalUnavailable(!stored);
      setDoc((d) => (d?.key === key ? { ...d, requestId, state: "saving" } : d));
      void learningCommand<Note>("save_note", {
        recordId: record.id,
        lesson: scope.lesson,
        locale,
        content,
        revision,
        requestId,
      })
        .then((saved) => {
          if (!owns()) return;
          setDoc((d) => {
            if (!d || d.key !== key) return d;
            const changed = d.content !== content;
            if (changed) storeNoteDraft(key, { content: d.content, revision: saved.revision });
            else storeNoteDraft(key, null);
            return {
              ...d,
              revision: saved.revision,
              cloud: saved,
              requestId: undefined,
              state: changed ? "dirty" : "clean",
            };
          });
        })
        .catch(async (error) => {
          if (!owns()) return;
          const conflict =
            error instanceof Error && error.message.includes("LEARNING_NOTE_CONFLICT");
          const remote = conflict
            ? await learningCommand<Note>("note", {
                recordId: record.id,
                lesson: scope.lesson,
              }).catch(() => null)
            : null;
          if (!owns()) return;
          setDoc((d) =>
            d?.key === key
              ? {
                  ...d,
                  requestId: d.content === content ? requestId : undefined,
                  cloud: remote ?? d.cloud,
                  state: conflict ? "conflict" : "unconfirmed",
                }
              : d,
          );
        });
      // Storage failure does not turn an unconfirmed cloud write into success.
      if (!stored) setDoc((d) => (d?.key === key ? { ...d, state: "saving" } : d));
    }, 1200);
    return () => clearTimeout(timer);
    // Retry is explicit for an unconfirmed operation; editing creates a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    doc?.key,
    doc?.content,
    doc?.revision,
    retry,
    record?.id,
    notesEnabled,
    key,
    auth.authGeneration,
    locale,
  ]);
  if (!auth.user || auth.loading) return null;
  if (record && !notesEnabled) return null;
  if ((records.isError || note.isError) && (!doc || doc.key !== key))
    return (
      <div role="alert">
        {c.load}{" "}
        <Button
          onClick={() => {
            void records.refetch();
            void note.refetch();
          }}
        >
          {c.retry}
        </Button>
      </div>
    );
  if (!doc || doc.key !== key) return <p role="status">{c.saving}</p>;
  return (
    <section className="my-5 rounded-2xl border p-4" dir={locale === "en" ? "ltr" : "rtl"}>
      <label className="block font-semibold" htmlFor="learning-private-note">
        {c.notes}
      </label>
      <p className="my-2 text-xs text-muted-foreground">{c.notePrivate}</p>
      {(!note.data || records.isError || note.isError) && (
        <p role="status">
          {c.offlineDraft}{" "}
          <Button
            onClick={() => {
              void records.refetch();
              void note.refetch();
            }}
          >
            {c.retry}
          </Button>
        </p>
      )}
      {localUnavailable && <p role="alert">{c.localUnavailable}</p>}
      <textarea
        id="learning-private-note"
        className="min-h-32 w-full rounded border bg-background p-3"
        maxLength={5000}
        value={doc.content}
        onChange={(e) => {
          const content = e.target.value;
          setLocalUnavailable(!storeNoteDraft(doc.key, { content, revision: doc.revision }));
          setDoc((d) =>
            d
              ? {
                  ...d,
                  content,
                  requestId: undefined,
                  state: d.state === "conflict" ? "conflict" : "dirty",
                }
              : d,
          );
        }}
      />
      <p role="status" aria-live="polite">
        {doc.state === "clean"
          ? c.saved
          : doc.state === "saving"
            ? c.saving
            : doc.state === "conflict"
              ? c.conflict
              : localUnavailable
                ? c.localUnavailable
                : c.pending}
      </p>
      {doc.state === "unconfirmed" && (
        <Button onClick={() => setRetry((n) => n + 1)}>{c.retry}</Button>
      )}
      {doc.state === "conflict" && (
        <div className="space-y-2">
          <p>{c.cloud}</p>
          <blockquote className="whitespace-pre-wrap rounded border p-3">
            {doc.cloud.content}
          </blockquote>
          <Button
            onClick={() => {
              storeNoteDraft(doc.key, { content: doc.content, revision: doc.cloud.revision });
              setDoc({
                ...doc,
                revision: doc.cloud.revision,
                requestId: undefined,
                state: "dirty",
              });
              setRetry((n) => n + 1);
            }}
          >
            {c.useLocal}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              storeNoteDraft(doc.key, null);
              setDoc({ ...doc, ...doc.cloud, requestId: undefined, state: "clean" });
            }}
          >
            {c.useCloud}
          </Button>
        </div>
      )}
    </section>
  );
}
