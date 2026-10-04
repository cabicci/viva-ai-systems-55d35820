import { useEffect, useState } from "react";
import { Search, ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SupportedLocale } from "@/lib/locale/types";
import {
  catalog,
  hasTechnicalLesson,
  loadTechnicalLesson,
  technicalLessonHref,
  technicalDownloadName,
} from "@/lib/technical-education/catalog";
import { getTechnicalCopy } from "@/lib/technical-education/copy";
import {
  previewCompleted,
  useTechnicalPreviewProgress,
} from "@/lib/technical-education/preview-progress";
import type { TechnicalLesson } from "@/lib/technical-education/types";
import { TechnicalDiagram } from "./TechnicalDiagram";
import { getBunnyEmbedUrlForLocale } from "@/lib/bunny-videos";

const panel = "rounded-3xl border border-border bg-card p-5 md:p-8";
export function TechnicalJourney({
  locale,
  lessonId,
}: {
  locale: SupportedLocale;
  lessonId?: string;
}) {
  const copy = getTechnicalCopy(locale);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [loaded, setLoaded] = useState<{ key: string; lesson: TechnicalLesson | null } | null>(
    null,
  );
  const { progress } = useTechnicalPreviewProgress();
  const key = `${lessonId}__${locale}`;
  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    loadTechnicalLesson(lessonId, locale)
      .then((lesson) => {
        if (active) setLoaded({ key, lesson });
      })
      .catch(() => {
        if (active) setLoaded({ key, lesson: null });
      });
    return () => {
      active = false;
    };
  }, [lessonId, locale, key]);
  const match = catalog.lessons.find((lesson) => lesson.id === lessonId);
  const completed = catalog.lessons.filter(
    (lesson) => previewCompleted(progress[lesson.id]) === 3,
  ).length;
  const lesson = loaded?.key === key ? loaded.lesson : null;
  return (
    <main
      id="main-content"
      dir={locale === "en" ? "ltr" : "rtl"}
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:py-12"
    >
      {lessonId ? (
        <>
          <a
            href={`/experiments/technical-education?locale=${locale}`}
            className="inline-flex items-center gap-2 font-bold text-primary"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {copy.back}
          </a>
          {lesson ? (
            <TechnicalLessonView key={key} lesson={lesson} />
          ) : (
            <div className={panel}>
              <h1 className="text-2xl font-bold">
                {match?.title[locale as keyof typeof match.title] ?? copy.noResults}
              </h1>
              <p className="mt-4 text-muted-foreground" role="status">
                {loaded?.key === key ? copy.planned : "…"}
              </p>
            </div>
          )}
          <div className="flex justify-between gap-4">
            {[-1, 1].map((delta) => {
              const index = catalog.lessons.findIndex((item) => item.id === lessonId);
              const adjacent = index < 0 ? undefined : catalog.lessons[index + delta];
              return adjacent ? (
                <a
                  key={delta}
                  href={technicalLessonHref(adjacent.id, locale)}
                  className="flex items-center gap-2 rounded-xl border p-3 text-sm font-bold"
                >
                  {delta < 0 ? (
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                  ) : (
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  )}
                  {delta < 0 ? copy.previous : copy.next}
                </a>
              ) : (
                <span key={delta} />
              );
            })}
          </div>
        </>
      ) : (
        <>
          <header className={`${panel} bg-gradient-to-br from-accent/30 via-card to-secondary/30`}>
            <p className="text-sm font-bold text-primary">TECH · {copy.preview}</p>
            <h1 className="mt-4 text-3xl font-black md:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
            <dl className="mt-6 flex flex-wrap gap-6">
              {[
                [7, copy.sections],
                [21, copy.modules],
                [80, copy.lessons],
              ].map(([count, label]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-black">{count}</dd>
                </div>
              ))}
            </dl>
            <a
              href={technicalLessonHref("M01-L01", locale)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
            >
              <BookOpen className="size-5" />
              {copy.start}
            </a>
          </header>
          <section className={panel} aria-label={copy.progress}>
            <div className="flex justify-between gap-4">
              <h2 className="font-bold">{copy.progress}</h2>
              <span>{completed} / 80</span>
            </div>
            <Progress className="mt-3" value={(completed / 80) * 100} />
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.local}</p>
          </section>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex min-h-12 items-center gap-3 rounded-xl border bg-card px-4">
              <Search className="size-5 shrink-0" />
              <input
                className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.search}
                aria-label={copy.search}
              />
            </label>
            <select
              className="min-h-12 w-full min-w-0 max-w-full rounded-xl border bg-card px-4 sm:w-auto"
              aria-label={copy.sections}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="">{copy.all}</option>
              {catalog.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title[locale]}
                </option>
              ))}
            </select>
          </div>
          {catalog.sections
            .filter((section) => !filter || section.id === filter)
            .map((section) => {
              const modules = catalog.modules
                .filter((module) => module.sectionId === section.id)
                .map((module) => ({
                  ...module,
                  visible: catalog.lessons.filter(
                    (lesson) =>
                      lesson.moduleId === module.id &&
                      `${lesson.id} ${lesson.title[locale]}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()),
                  ),
                }))
                .filter((module) => module.visible.length);
              return modules.length ? (
                <section key={section.id} className="space-y-4">
                  <h2 className="text-2xl font-black">
                    <bdi>{section.id}</bdi> · {section.title[locale]}
                  </h2>
                  <div className="grid items-start gap-4 md:grid-cols-2">
                    {modules.map((module) => (
                      <article key={module.id} className={panel}>
                        <h3 className="text-lg font-bold">
                          <bdi>{module.id}</bdi> · {module.title[locale]}
                        </h3>
                        {module.prerequisites.length > 0 && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {copy.prerequisites}: <bdi>{module.prerequisites.join(" · ")}</bdi>
                          </p>
                        )}
                        {module.requiresApplication && (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {copy.needsApplication}
                          </p>
                        )}
                        <ol className="mt-5 space-y-2">
                          {module.visible.map((lesson) => (
                            <li key={lesson.id}>
                              <a
                                href={technicalLessonHref(lesson.id, locale)}
                                className="flex min-h-16 items-center justify-between gap-3 rounded-xl border p-3 hover:border-primary"
                              >
                                <span className="min-w-0">
                                  <span className="block text-xs text-muted-foreground">
                                    <bdi>{lesson.id}</bdi>
                                  </span>
                                  <span className="mt-1 block text-sm font-bold leading-6">
                                    {lesson.title[locale]}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    {hasTechnicalLesson(lesson.id, locale)
                                      ? copy.ready
                                      : copy.planned}
                                  </span>
                                </span>
                                {previewCompleted(progress[lesson.id]) === 3 ? (
                                  <CheckCircle2 className="size-5 shrink-0 text-primary" />
                                ) : (
                                  <BookOpen className="size-5 shrink-0 text-muted-foreground" />
                                )}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null;
            })}
          {!catalog.lessons.some(
            (lesson) =>
              (!filter || lesson.sectionId === filter) &&
              `${lesson.id} ${lesson.title[locale]}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
          ) && <p role="status">{copy.noResults}</p>}
        </>
      )}
    </main>
  );
}

export function TechnicalLessonView({ lesson }: { lesson: TechnicalLesson }) {
  const { locale } = lesson;
  const copy = getTechnicalCopy(locale);
  const runtimeId = catalog.lessons.find((item) => item.id === lesson.id)!.runtimeId;
  const bunnyEmbed = getBunnyEmbedUrlForLocale(runtimeId, locale);
  const { progress, update } = useTechnicalPreviewProgress();
  const record = progress[lesson.id];
  const [tab, setTab] = useState("reading");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [editedDraft, setDraft] = useState<string[] | null>(null);
  const draft = editedDraft ?? record?.drafts?.[locale] ?? lesson.assignment.fields.map(() => "");
  const [criteria, setCriteria] = useState<boolean[]>(lesson.assignment.criteria.map(() => false));
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const completed = previewCompleted(record);
  const score = lesson.quiz.filter((question) => answers[question.id] === question.correct).length;
  const tabs = [
    "reading",
    "example",
    "video",
    "quiz",
    "assignment",
    "downloads",
    "assistant",
  ] as const;
  const submitQuiz = () => {
    setSubmitted(true);
    if (lesson.quiz.every((question) => question.id in answers))
      update(lesson.id, { quizPassed: score === lesson.quiz.length });
  };
  const savePractice = () => {
    const ok = update(lesson.id, {
      drafts: { ...record?.drafts, [locale]: draft },
      practiceReviewed:
        draft.length === lesson.assignment.fields.length &&
        draft.every((value) => value.trim().length > 0) &&
        criteria.every(Boolean),
    });
    setSaved(ok);
    setSaveFailed(!ok);
  };
  return (
    <>
      <header className={`${panel} bg-gradient-to-br from-accent/20 to-card`}>
        <p className="text-sm font-bold text-primary">
          <bdi>{lesson.id}</bdi> · {copy.preview}
        </p>
        <h1 className="mt-3 text-3xl font-black leading-snug md:text-4xl">{lesson.title}</h1>
        <p className="mt-4 max-w-4xl leading-8 text-muted-foreground">{lesson.intro}</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-20">
          <nav className={`${panel} !p-3`} aria-label={lesson.title}>
            <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
              {tabs.map((id) => (
                <button
                  key={id}
                  className={`min-h-11 rounded-xl px-3 py-3 text-start text-sm font-bold ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  aria-pressed={tab === id}
                  aria-controls="technical-section"
                  onClick={() => setTab(id)}
                >
                  {copy[id]}
                </button>
              ))}
            </div>
          </nav>
          <section className={`${panel} !p-5`}>
            <h2 className="font-bold">{copy.progress}</h2>
            <Progress className="mt-3" value={(completed / 3) * 100} />
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{copy.local}</p>
          </section>
        </aside>
        <section
          id="technical-section"
          className={`${panel} min-w-0 space-y-6`}
          aria-label={copy[tab as (typeof tabs)[number]]}
        >
          {tab === "reading" && (
            <>
              <section>
                <h2 className="text-xl font-bold">{copy.goals}</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 leading-7">
                  {lesson.goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </section>
              {lesson.sections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="grid items-start gap-5 border-t pt-6 md:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div>
                    <h3 className="text-xl font-bold">{section.title}</h3>
                    <p className="mt-3 leading-8">{section.text}</p>
                  </div>
                  <figure>
                    <a
                      href={`/experiments/technical-education/${locale}/${section.diagram}.svg`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${copy.zoom}: ${section.title}`}
                    >
                      <TechnicalDiagram
                        kind={section.diagram}
                        locale={locale}
                        title={section.title}
                      />
                    </a>
                    <figcaption className="mt-2 text-xs leading-6 text-muted-foreground">
                      {section.caption}
                    </figcaption>
                  </figure>
                </article>
              ))}
              <Button onClick={() => update(lesson.id, { read: true })}>
                {record?.read ? copy.correct : copy.markRead}
              </Button>
            </>
          )}
          {tab === "example" && (
            <>
              <h2 className="text-xl font-bold">{lesson.example.title}</h2>
              <p className="leading-8">{lesson.example.text}</p>
              <p className="rounded-xl bg-accent/30 p-4 leading-8 font-bold">
                {lesson.example.decision}
              </p>
            </>
          )}
          {tab === "video" && (
            <>
              <h2 className="text-xl font-bold">{copy.video}</h2>
              {bunnyEmbed ? (
                <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
                  <iframe
                    className="h-full w-full"
                    src={bunnyEmbed}
                    title={lesson.title}
                    allow="fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="leading-8 text-muted-foreground">{copy.videoPending}</p>
              )}
            </>
          )}
          {tab === "quiz" && (
            <>
              <h2 className="text-xl font-bold">{copy.quiz}</h2>
              {lesson.quiz.map((question) => (
                <fieldset key={question.id} className="space-y-3 rounded-2xl border p-4">
                  <legend className="px-2 font-bold">{question.question}</legend>
                  {question.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex min-h-11 items-start gap-3 rounded-xl bg-muted/40 p-3"
                    >
                      <input
                        type="radio"
                        className="mt-1"
                        name={`${lesson.id}-${question.id}`}
                        checked={answers[question.id] === index}
                        onChange={() => {
                          setAnswers({ ...answers, [question.id]: index });
                          setSubmitted(false);
                          update(lesson.id, { quizPassed: false });
                        }}
                      />
                      <span className="leading-7">{option}</span>
                    </label>
                  ))}
                  {submitted && (
                    <p className="text-sm leading-7">
                      <strong>
                        {answers[question.id] === question.correct ? copy.correct : copy.retry}
                        :{" "}
                      </strong>
                      {question.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
              <Button
                disabled={!lesson.quiz.every((question) => question.id in answers)}
                onClick={submitQuiz}
              >
                {copy.check}
              </Button>
              {submitted && (
                <p role="status">
                  {copy.result}: {score} / {lesson.quiz.length}
                </p>
              )}
            </>
          )}
          {tab === "assignment" && (
            <>
              <h2 className="text-xl font-bold">{copy.assignment}</h2>
              <p className="leading-8">{lesson.assignment.prompt}</p>
              {lesson.assignment.fields.map((field, index) => (
                <label key={field} className="block font-bold">
                  {field}
                  <textarea
                    value={draft[index] ?? ""}
                    onChange={(event) => {
                      setDraft(
                        lesson.assignment.fields.map((_, i) =>
                          i === index ? event.target.value : (draft[i] ?? ""),
                        ),
                      );
                      setSaved(false);
                    }}
                    rows={4}
                    maxLength={20000}
                    className="mt-2 block w-full rounded-xl border bg-background p-3 font-normal leading-7"
                  />
                </label>
              ))}
              <p className="text-sm leading-7 text-muted-foreground">{copy.taskReview}</p>
              {lesson.assignment.criteria.map((criterion, index) => (
                <label key={criterion} className="flex gap-3 leading-7">
                  <input
                    type="checkbox"
                    checked={criteria[index]}
                    onChange={(event) =>
                      setCriteria(
                        criteria.map((value, i) => (i === index ? event.target.checked : value)),
                      )
                    }
                  />
                  <span>{criterion}</span>
                </label>
              ))}
              <Button onClick={savePractice}>{copy.save}</Button>
              {saved && <p role="status">{copy.saved}</p>}
              {saveFailed && (
                <p role="status">
                  {locale === "en"
                    ? "Storage is unavailable. Copy your work before leaving this page."
                    : "تعذر الحفظ على الجهاز. انسخ تطبيقك قبل مغادرة الصفحة."}
                </p>
              )}
            </>
          )}
          {tab === "downloads" && (
            <>
              <h2 className="text-xl font-bold">{copy.downloaded}</h2>
              {["workbook", "worksheet"].map((type) => (
                <a
                  key={type}
                  className="block rounded-xl border p-4 font-bold hover:border-primary"
                  href={`/experiments/technical-education/${locale}/${lesson.id}/${type}.pdf`}
                  download={technicalDownloadName(
                    copy[type as "workbook" | "worksheet"],
                    lesson.title,
                  )}
                >
                  {copy[type as "workbook" | "worksheet"]}
                </a>
              ))}
            </>
          )}
          {tab === "assistant" && (
            <>
              <h2 className="text-xl font-bold">{copy.assistant}</h2>
              {lesson.faq.map((item) => (
                <details key={item.question} className="rounded-xl border p-4">
                  <summary className="cursor-pointer font-bold leading-7">{item.question}</summary>
                  <p className="mt-3 leading-8">{item.answer}</p>
                  <button className="mt-3 font-bold text-primary" onClick={() => setTab("reading")}>
                    {copy.reading}
                  </button>
                </details>
              ))}
            </>
          )}
        </section>
      </div>
    </>
  );
}
