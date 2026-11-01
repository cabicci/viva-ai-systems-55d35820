import { JourneyVisitRecorder } from "@/components/journey/JourneyVisitRecorder";
import { stampFreeDelivery, useFreeDeliveryDeadline } from "@/lib/commerce/free-access-client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import {
  academicCommand,
  academicDownload,
  academicQueryKey,
  type AcademicProgress,
} from "@/lib/academic-education/client";
import type { AcademicDelivery, AcademicQuizResult } from "@/lib/academic-education/types";
import { ReadingVisual } from "./ReadingVisual";
import { CourseLessonAssistant } from "@/components/assistant/CourseLessonAssistant";
import { LessonText, LessonInlineText } from "./LessonText";
import { withoutMatchingStepPrefix } from "./example-step";
import { AcademicAdjacentNavigation } from "./AcademicAdjacentNavigation";
import { normalizeAcademicPracticeValues } from "./practice-fields";
import type { SupportedLocale } from "@/lib/locale/types";

/** Production delivery: no static lesson bodies, answer keys or review persona imports. */
export function AcademicLessonPage({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const en = locale === "en";
  const query = useQuery({
    queryKey: academicQueryKey(user?.id, courseId, lessonId, locale),
    enabled: !!user?.id,
    queryFn: async () => {
      const requestedAt = performance.now();
      return stampFreeDelivery(
        await academicCommand<AcademicDelivery>("lesson", courseId, lessonId, locale),
        requestedAt,
      );
    },
    staleTime: 0,
    structuralSharing: false,
  });
  const deliveryCurrent = useFreeDeliveryDeadline(query.data, query.refetch);
  return (
    <div className="min-h-dvh">
      <Navbar variant="account" />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8" dir={en ? "ltr" : "rtl"}>
        {loading || (!!user && query.isPending) ? (
          <p role="status">{en ? "Loading lesson…" : "جارٍ تحميل الدرس…"}</p>
        ) : !user ? (
          <a href={`/login?locale=${encodeURIComponent(locale)}&returnTo=${encodeURIComponent(`/academic/learn/${lessonId}`)}`} className="underline">
            {en ? "Sign in to continue" : "سجّل الدخول للمتابعة"}
          </a>
        ) : query.isError ? (
          <div role="alert">
            <p>{en ? "The lesson could not be loaded." : "تعذر تحميل الدرس."}</p>
            <Button onClick={() => void query.refetch()}>{en ? "Retry" : "أعد المحاولة"}</Button>
          </div>
        ) : !deliveryCurrent || !query.data?.allowed ? (
          <p>
            {en
              ? "This lesson requires an active Academic subscription."
              : "يتطلب هذا الدرس اشتراكًا ساريًا في مسارات أكاديمي."}
          </p>
        ) : (
          <>
            <JourneyVisitRecorder
              line="academic"
              course={courseId}
              lesson={lessonId}
              locale={locale}
            />
            <AuthorizedLesson
              key={`${user.id}:${courseId}:${lessonId}:${locale}`}
              delivery={query.data}
              locale={locale}
              courseId={courseId}
              revoke={() => {
                queryClient.setQueryData(academicQueryKey(user?.id, courseId, lessonId, locale), {
                  allowed: false,
                });
                void query.refetch();
              }}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
function AuthorizedLesson({
  delivery,
  locale,
  courseId,
  revoke,
}: {
  delivery: Extract<AcademicDelivery, { allowed: true }>;
  locale: SupportedLocale;
  courseId: string;
  revoke: () => void;
}) {
  const { lesson } = delivery,
    en = locale === "en";
  const c = getAcademicCopy(locale);
  const { user } = useAuth();
  const [tab, setTab] = useState("reading"),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [result, setResult] = useState<AcademicQuizResult | null>(null),
    [fields, setFields] = useState(lesson.assignment.fields.map(() => "")),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [saved, setSaved] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current === tab) return;
    previousTab.current = tab;
    const section = sectionRef.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top;
    // Leave an already visible panel in place; long-reading transitions may
    // otherwise keep its new instructions above the sticky site header.
    if (top < 96 || top > window.innerHeight - 80) {
      section.scrollIntoView?.({ block: "start", behavior: "auto" });
    }
  }, [tab]);
  const progress = useQuery({
    queryKey: ["academic-progress", user?.id, courseId, lesson.id, locale],
    queryFn: () =>
      academicCommand<{ progress: Record<string, AcademicProgress> }>(
        "status",
        courseId,
        null,
        locale,
      ),
    staleTime: 0,
  });
  const labels: Record<string, string> = Object.fromEntries(
    (
      ["reading", "example", "video", "quiz", "practice", "faq", "downloads", "assistant"] as const
    ).filter((key) => key !== "assistant" || !delivery.assistantAllowed).map((key) => [key, c[key]]),
  );
  const practiceFields =
    normalizeAcademicPracticeValues(lesson.id, locale, lesson.assignment.fields.length, fields) ??
    fields;
  const record = progress.data?.progress[lesson.id];
  const completed = [record?.read, record?.quizPassed, record?.practiceSubmitted].filter(
    Boolean,
  ).length;
  const validVideo =
    delivery.video &&
    /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+\?autoplay=false&preload=false$/.test(
      delivery.video,
    )
      ? delivery.video
      : null;
  async function save(action: "read" | "practice" | "quiz") {
    setBusy(true);
    setError(false);
    setSaved(false);
    setResult(null);
    try {
      const data =
        action === "quiz" ? { answers } : action === "practice" ? { values: practiceFields } : {};
      const response = await academicCommand<AcademicQuizResult>(
        action,
        courseId,
        lesson.id,
        locale,
        data,
      );
      if (!response.allowed) {
        revoke();
        return;
      }
      if (action === "quiz") setResult(response);
      setSaved(true);
      await progress.refetch();
    } catch {
      setError(true);
      revoke();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a
        className="font-bold text-primary"
        href={`/academic/courses/${courseId}/contents?locale=${locale}`}
      >
        {c.backToCurriculum}
      </a>
      {delivery.reviewOnly && (
        <p role="status" className="mt-4 rounded-xl border p-4">
          {c.reviewOnly}
        </p>
      )}
      <header className="my-6 rounded-3xl border bg-accent/20 p-6">
        <p className="text-sm font-bold text-primary">
          {en ? "Masaarat Academic" : "مسارات أكاديمي"}
        </p>
        <h1 className="my-4 text-3xl font-black">{lesson.title}</h1>
        <p className="leading-8">{lesson.intro}</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-3xl border bg-card p-4 lg:sticky lg:top-24">
          <nav aria-label={c.sections} className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {Object.entries(labels)
              .filter(([key]) => key !== "video" || validVideo)
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setSaved(false);
                    setError(false);
                  }}
                  aria-pressed={key === tab}
                  aria-controls="academic-lesson-section"
                  className={`rounded-xl p-3 text-start font-bold ${key === tab ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {label}
                </button>
              ))}
          </nav>
          <section className="mt-6 space-y-3 border-t pt-5">
            <h2 className="font-bold">{c.progress}</h2>
            <Progress value={(completed / 3) * 100} aria-label={c.progress} />
            <p className="text-sm leading-7 text-muted-foreground">{c.progressNote}</p>
          </section>
        </aside>
        <section
          ref={sectionRef}
          id="academic-lesson-section"
          className="min-w-0 scroll-mt-24 space-y-6 rounded-3xl border bg-card p-5 md:p-8"
          aria-label={labels[tab]}
        >
          {error && (
            <p role="alert">
              {en
                ? "Could not save. Please reload and retry."
                : "تعذر الحفظ. أعد تحميل الدرس وحاول مجددًا."}
            </p>
          )}
          {saved && <p role="status">{c.saved}</p>}
          {tab === "reading" && (
            <>
              <ul className="list-inside list-disc space-y-3 leading-8">
                {lesson.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              {lesson.sections.map((s) => (
                <article key={s.id} className="space-y-4 border-t pt-5">
                  <h2 className="text-xl font-bold">{s.title}</h2>
                  <LessonText text={s.text} />
                  <p className="rounded-xl bg-accent/20 p-4 leading-8">{s.reflection}</p>
                </article>
              ))}
              {lesson.readingVisuals?.map((v) => (
                <ReadingVisual key={v.id} visual={v} />
              ))}
              <Button disabled={busy} onClick={() => void save("read")}>
                {c.markRead}
              </Button>
            </>
          )}
          {tab === "example" && (
            <>
              <h2 className="text-xl font-bold">{lesson.example.title}</h2>
              <LessonText text={lesson.example.text} />
              <ol className="list-none space-y-4 leading-8" role="list">
                {lesson.example.steps?.map((s, i) => (
                  <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-bold"
                    >
                      {i + 1}
                    </span>
                    <LessonText text={withoutMatchingStepPrefix(s, i + 1)} />
                  </li>
                ))}
              </ol>
              <p className="rounded-xl bg-accent/20 p-4 leading-8">{lesson.example.decision}</p>
            </>
          )}
          {tab === "video" && validVideo && (
            <iframe
              title={lesson.title}
              src={validVideo}
              className="aspect-video w-full rounded-xl border-0"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          )}
          {tab === "quiz" && (
            <>
              {lesson.quiz.map((q) => (
                <fieldset key={q.id} className="rounded-xl border p-4">
                  <legend className="px-2 font-bold leading-8">
                    <LessonInlineText text={q.question} />
                  </legend>
                  {q.options.map((option, i) => (
                    <label
                      key={i}
                      className="my-3 flex items-start gap-3 rounded-lg bg-muted/30 p-3 leading-7"
                    >
                      <input
                        type="radio"
                        className="mt-2 h-4 w-4 shrink-0"
                        name={q.id}
                        disabled={busy}
                        checked={answers[q.id] === i}
                        onChange={() => {
                          setAnswers({ ...answers, [q.id]: i });
                          setResult(null);
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <LessonInlineText text={option} />
                      </span>
                    </label>
                  ))}
                  {result?.feedback.find((f) => f.id === q.id) && (
                    <p className="leading-8">
                      <LessonInlineText
                        text={result.feedback.find((f) => f.id === q.id)?.explanation ?? ""}
                      />
                    </p>
                  )}
                </fieldset>
              ))}
              <Button
                disabled={busy || !lesson.quiz.every((q) => q.id in answers)}
                onClick={() => void save("quiz")}
              >
                {c.submit}
              </Button>
              {result && (
                <p role="status">
                  <bdi>
                    {result.score} / {result.total}
                  </bdi>
                </p>
              )}
            </>
          )}
          {tab === "practice" && (
            <>
              <LessonText text={lesson.assignment.prompt} />
              {lesson.assignment.fields.map((label, i) => (
                <label className="block font-bold" key={label}>
                  {label}
                  <textarea
                    rows={4}
                    maxLength={5000}
                    value={practiceFields[i] ?? ""}
                    onChange={(event) =>
                      setFields(
                        practiceFields.map((value, j) => (i === j ? event.target.value : value)),
                      )
                    }
                    className="mt-3 w-full rounded-xl border bg-background p-3 font-normal leading-7"
                  />
                </label>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const draft = progress.data?.progress[lesson.id]?.drafts[locale];
                  const restored = normalizeAcademicPracticeValues(
                    lesson.id,
                    locale,
                    lesson.assignment.fields.length,
                    draft,
                  );
                  if (restored) setFields(restored);
                }}
              >
                {c.restore}
              </Button>
              {lesson.assignment.rubric?.map((r) => (
                <details key={r.criterion} className="rounded-xl border p-4">
                  <summary className="font-bold">{r.criterion}</summary>
                  <p className="mt-3 leading-8">{r.excellent}</p>
                  <p className="leading-8">{r.adequate}</p>
                  <p className="leading-8">{r.needsRevision}</p>
                </details>
              ))}
              <Button
                disabled={
                  busy ||
                  practiceFields.length !== lesson.assignment.fields.length ||
                  practiceFields.some((f) => !f.trim())
                }
                onClick={() => void save("practice")}
              >
                {c.save}
              </Button>
              <p className="text-sm leading-7 text-muted-foreground">
                {en
                  ? "Saving records your submission; it is not an academic grade."
                  : "الحفظ يسجل تسليم التطبيق، ولا يمنحه درجة أكاديمية تلقائية."}
              </p>
            </>
          )}
          {tab === "faq" &&
            lesson.faq.map((f) => (
              <details key={f.question} className="rounded-xl border p-4">
                <summary className="font-bold">{f.question}</summary>
                <p className="mt-4 leading-8">{f.answer}</p>
              </details>
            ))}
          {tab === "downloads" && (
            <>
              {delivery.files.map((file) => (
                <Button
                  key={file.path}
                  onClick={() =>
                    void academicDownload(file.path, `${lesson.id}-${locale}.pdf`).catch(() =>
                      setError(true),
                    )
                  }
                >
                  {en ? "Download workbook (PDF)" : "تنزيل كراسة الدرس (PDF)"}
                </Button>
              ))}
              {!delivery.files.length && (
                <p>{en ? "The workbook is not available yet." : "كراسة الدرس غير متاحة بعد."}</p>
              )}
            </>
          )}
          {tab === "assistant" && !delivery.assistantAllowed && (
              <p className="leading-8">
                {en
                  ? "The assistant for this course requires separate access and activation."
                  : "مساعد هذا المسار يحتاج صلاحية مستقلة وتفعيل الخدمة."}
              </p>
            )}
        </section>
      </div>
      {delivery.assistantAllowed && (
        <CourseLessonAssistant
          area="academic"
          key={`${courseId}:${lesson.id}:${locale}`}
          cardId={courseId}
          stepId={lesson.id}
          locale={locale}
        />
      )}
      <AcademicAdjacentNavigation
        userId={user?.id}
        courseId={courseId}
        lessonId={lesson.id}
        locale={locale}
      />
    </>
  );
}
