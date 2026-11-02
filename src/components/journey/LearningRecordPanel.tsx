import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { useKidsParentStateSource } from "@/lib/kids/parent-state";
import { getLineCopy } from "@/lib/learning-lines";
import { getCurriculumLessonLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { learningCommand, learningReports } from "@/lib/learning/client";
import { createLearningReport } from "@/lib/learning/reports.functions";
import { learningCopy } from "@/lib/learning/copy";
import type { CourseRecord, RecordDetail, ReportList } from "@/lib/learning/contracts";
import { Button } from "@/components/ui/button";
export function LearningRecordPanel() {
  const auth = useAuth();
  const { locale } = useLocale();
  const c = learningCopy(locale);
  const parent = useKidsParentStateSource();
  const [selected, setSelected] = useState<string>("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef<{ key: string; id: string } | null>(null);
  const generate = useServerFn(createLearningReport);
  const activeOperation = useRef<object | null>(null);
  const records = useQuery({
    queryKey: ["learning-records", auth.user?.id, locale],
    enabled: !!auth.user && !auth.loading,
    queryFn: () => learningCommand<CourseRecord[]>("records", { locale }),
  });
  const record = records.data?.find((r) => r.id === selected) ?? records.data?.[0];
  const key = JSON.stringify([auth.user?.id, record?.subject_id, source, locale]);
  const currentKey = useRef(key);
  currentKey.current = key;
  useEffect(() => {
    activeOperation.current = null;
    setBusy(false);
    setError(false);
    request.current = null;
  }, [key, auth.authGeneration]);
  const detail = useQuery({
    queryKey: ["learning-detail", auth.user?.id, record?.id],
    enabled: !!record && !auth.loading,
    queryFn: () => learningCommand<RecordDetail>("detail", { recordId: record!.id }),
  });
  const reports = useQuery({
    queryKey: ["learning-reports", auth.user?.id, record?.subject_id],
    enabled: !!record && !auth.loading,
    queryFn: () => learningReports<ReportList>("list", { subjectId: record!.subject_id }),
    refetchInterval: (q) =>
      busy ||
      q.state.data?.reports.some(
        (r) => r.state === "generating" && r.lease_until && Date.parse(r.lease_until) > Date.now(),
      )
        ? 4000
        : false,
  });
  const chosen =
    reports.data?.sources.find((s) => s.sourceKey === source) ?? reports.data?.sources[0];
  if (!auth.user || auth.loading) return null;
  const name = (r: CourseRecord) =>
    `${r.profile_id ? (parent.profiles.find((p) => p.id === r.profile_id)?.display_name ?? getLineCopy(locale).kids) + " · " : ""}${r.title ?? getLineCopy(locale)[r.area]}`;
  async function makeReport() {
    if (!record || !chosen || busy || activeOperation.current) return;
    const opKey = currentKey.current;
    const generation = auth.authGeneration;
    const operation = {};
    activeOperation.current = operation;
    const owns = () =>
      activeOperation.current === operation &&
      currentKey.current === opKey &&
      auth.isAuthGenerationCurrent(generation);
    const retryKey = JSON.stringify([auth.user?.id, record.subject_id, chosen.sourceKey, locale]);
    const localRequestKey = `learning-report-request:v1:${retryKey}`;
    if (request.current?.key !== retryKey) {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(localRequestKey);
      } catch {
        /* Current page still retains the command identity. */
      }
      request.current = {
        key: retryKey,
        id: stored && /^[a-f0-9-]{36}$/i.test(stored) ? stored : crypto.randomUUID(),
      };
      try {
        localStorage.setItem(localRequestKey, request.current.id);
      } catch {
        /* No cross-account fallback. */
      }
    }
    setBusy(true);
    setError(false);
    try {
      const result = await generate({
        data: {
          requestId: request.current!.id,
          sourceKey: chosen.sourceKey,
          subjectId: record.subject_id,
          locale,
        },
      });
      if (!owns()) return;
      if (result.state === "ready") {
        request.current = null;
        try {
          localStorage.removeItem(localRequestKey);
        } catch {
          /* A stale retry returns the existing report. */
        }
      }
      if (result.state === "pending") setError(true);
      await reports.refetch();
    } catch {
      if (owns()) setError(true);
    } finally {
      if (owns()) {
        activeOperation.current = null;
        setBusy(false);
      }
    }
  }
  async function download() {
    if (!record) return;
    const generation = auth.authGeneration;
    try {
      const result = await learningCommand<RecordDetail>("export", { recordId: record.id });
      if (!auth.isAuthGenerationCurrent(generation)) return;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "masaarat-learning-record.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (result.hasMore) setError(true);
    } catch {
      setError(true);
    }
  }
  return (
    <section
      className="space-y-5 rounded-3xl border bg-card p-6"
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <h2 className="text-2xl font-bold">{c.title}</h2>
      {records.isPending ? (
        <p role="status">{c.saving}</p>
      ) : records.isError ? (
        <p role="alert">
          {c.load} <Button onClick={() => void records.refetch()}>{c.retry}</Button>
        </p>
      ) : !record ? (
        <p>{c.empty}</p>
      ) : (
        <>
          <select
            aria-label={c.title}
            className="max-w-full rounded border bg-background p-2"
            value={record.id}
            onChange={(e) => {
              setSelected(e.target.value);
              setSource("");
              setError(false);
            }}
          >
            {records.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {name(r)}
              </option>
            ))}
          </select>
          <Button className="ms-3" variant="outline" onClick={() => void download()}>
            {c.export}
          </Button>
          <h3 className="text-xl font-semibold">{c.history}</h3>
          {record.learning_model && (
            <div>
              <h4 className="font-semibold">{c.activities}</h4>
              <ul className="flex flex-wrap gap-3">
                {record.learning_model.activities.map((activity) => (
                  <li key={activity} className="rounded-full border px-3 py-1">
                    {c[activity]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!detail.data?.enrollments?.length && (
            <div>
              <h4 className="font-semibold">{c.enrollments}</h4>
              <ul>
                {detail.data.enrollments.map((e) => (
                  <li key={`${e.source_key}:${e.starts_at}`}>
                    <time>
                      {new Date(e.starts_at).toLocaleDateString(locale === "en" ? "en-GB" : "ar")}
                    </time>
                    {e.ends_at && (
                      <>
                        {" "}
                        —{" "}
                        <time>
                          {new Date(e.ends_at).toLocaleDateString(locale === "en" ? "en-GB" : "ar")}
                        </time>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {detail.isError && (
            <p role="alert">
              {c.load} <Button onClick={() => void detail.refetch()}>{c.retry}</Button>
            </p>
          )}
          <ol className="max-h-96 space-y-3 overflow-auto">
            {detail.data?.events.map((event) => (
              <li key={event.id} className="rounded border p-3">
                <p className="font-semibold">
                  {event.lessonTitle ??
                    (record.area === "ai"
                      ? getCurriculumLessonLabel(locale, event.lesson)
                      : null) ??
                    event.lesson}
                </p>
                <time dateTime={event.recorded_at}>
                  {new Date(event.recorded_at).toLocaleString(locale === "en" ? "en-GB" : "ar")}
                </time>
                <p>
                  {event.kind === "exam"
                    ? c.exam
                    : event.kind === "mission"
                      ? c.mission
                      : event.kind === "practice"
                        ? c.practice
                        : event.kind === "questions"
                          ? c.questions
                          : event.kind === "existing_fact"
                            ? c.existing
                            : event.kind === "note_saved"
                              ? c.notes
                              : event.kind === "visited"
                                ? locale === "en"
                                  ? "Lesson opened"
                                  : "فتح الدرس"
                                : event.kind === "quiz" || event.origin === "lesson_quiz_attempts"
                                  ? locale === "en"
                                    ? "Quiz attempt recorded"
                                    : "محاولة اختبار محفوظة"
                                  : locale === "en"
                                    ? "Learning activity recorded"
                                    : "نشاط تعلم محفوظ"}
                </p>
                {typeof event.evidence.is_correct === "boolean" && (
                  <p>
                    {locale === "en" ? "Correct answer" : "إجابة صحيحة"}:{" "}
                    {event.evidence.is_correct ? "✓" : "✗"}
                  </p>
                )}
                <AssessmentEvidence evidence={event.evidence} locale={locale} />
                {!event.content_version &&
                  [
                    "lesson_quiz_attempts",
                    "mission_submissions",
                    "academic_command",
                    "technical_command",
                    "kids_quiz",
                    "canonical_assessment",
                  ].includes(event.origin) && (
                    <p className="text-xs text-muted-foreground">{c.unknown}</p>
                  )}
              </li>
            ))}
          </ol>
          {detail.data?.hasMore && <p>{c.more}</p>}
          {!!detail.data?.notes.length && (
            <details>
              <summary className="cursor-pointer font-semibold">{c.notesHistory}</summary>
              {detail.data.notes.map((n) => (
                <article key={n.lesson} className="my-3 rounded border p-3">
                  <h4>{n.lesson}</h4>
                  <p className="whitespace-pre-wrap">{n.content}</p>
                </article>
              ))}
            </details>
          )}
          <h3 className="text-xl font-semibold">{c.reports}</h3>
          <p>{c.included}</p>
          <p className="text-sm text-muted-foreground">{c.notePrivate}</p>
          {reports.isError ? (
            <p role="alert">
              {c.load} <Button onClick={() => void reports.refetch()}>{c.retry}</Button>
            </p>
          ) : !chosen ? (
            <p>{c.noSources}</p>
          ) : (
            <>
              <select
                aria-label={c.reports}
                className="rounded border bg-background p-2"
                value={chosen.sourceKey}
                onChange={(e) => setSource(e.target.value)}
              >
                {reports.data?.sources.map((s, i) => (
                  <option key={s.sourceKey} value={s.sourceKey}>
                    {locale === "en" ? "Package" : "الباقة"} {i + 1} · {s.used}/{s.limit}
                  </option>
                ))}
              </select>
              <p>
                {c.used}: {chosen.used}/{chosen.limit} ·{" "}
                {new Date(chosen.endsAt).toLocaleDateString(locale === "en" ? "en-GB" : "ar")}
              </p>
              <Button
                disabled={busy || chosen.used >= chosen.limit}
                onClick={() => void makeReport()}
              >
                {busy ? c.generating : c.generate}
              </Button>
            </>
          )}
          {error && <p role="alert">{c.unavailable}</p>}
          {reports.data?.reports
            .filter((r) => r.state === "ready" && r.report)
            .map((r) => (
              <article key={r.id} className="space-y-3 rounded border p-4">
                <time>
                  {new Date(r.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "ar")}
                </time>
                <h4 className="font-bold">{c.summary}</h4>
                <p>{r.report!.summary}</p>
                {(["strengths", "review", "nextSteps", "limitations"] as const).map((field) => (
                  <div key={field}>
                    <h4 className="font-bold">{c[field]}</h4>
                    <ul>
                      {r.report![field].map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </article>
            ))}
        </>
      )}
    </section>
  );
}

function AssessmentEvidence({
  evidence,
  locale,
}: {
  evidence: Record<string, unknown>;
  locale: import("@/lib/locale/types").SupportedLocale;
}) {
  const c = learningCopy(locale);
  const outcome =
    evidence.outcome && typeof evidence.outcome === "object"
      ? (evidence.outcome as Record<string, unknown>)
      : evidence;
  const score = outcome.score;
  const submission = evidence.submission ?? evidence.submission_text;
  const texts = (value: unknown, depth = 0): string[] => {
    if (depth > 5) return [];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.flatMap((v) => texts(v, depth + 1));
    if (value && typeof value === "object")
      return Object.entries(value)
        .filter(([key]) => !["questionId", "requestId", "locale"].includes(key))
        .flatMap(([key, v]) =>
          key === "selectedIndex" && typeof v === "number" ? [String(v + 1)] : texts(v, depth + 1),
        );
    return typeof value === "number" ? [String(value)] : [];
  };
  return (
    <>
      {typeof score === "number" && (
        <p>
          {c.grade}: {score}
          {typeof outcome.total === "number" ? ` / ${outcome.total}` : ""}
        </p>
      )}
      {typeof outcome.correct === "boolean" && (
        <p>
          {c.grade}: {outcome.correct ? "✓" : "✗"}
        </p>
      )}
      {submission != null && (
        <details>
          <summary className="cursor-pointer">{c.submission}</summary>
          {texts(submission).map((text, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {text}
            </p>
          ))}
        </details>
      )}
    </>
  );
}
