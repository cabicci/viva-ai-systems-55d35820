import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTechnicalCopy } from "@/lib/technical-education/copy";
import type { TechnicalLesson } from "@/lib/technical-education/types";
import { TechnicalDiagram } from "./TechnicalDiagram";
import {
  useTechnicalProgress,
  technicalCompleted,
  technicalCommand,
  technicalDownload,
  type QuizResult,
} from "@/lib/technical-education/client";
const panel = "rounded-3xl border border-border bg-card p-5 md:p-8";
function technicalDownloadName(type: string, title: string) {
  return `${type} — ${title}`.replace(/[:<>"/\\|?*]/g, " - ") + ".pdf";
}
export function TechnicalLessonView({
  lesson,
  video,
  files,
}: {
  lesson: TechnicalLesson;
  video: string;
  files: { kind: string; path: string }[];
}) {
  const { locale } = lesson;
  const copy = getTechnicalCopy(locale);
  const bunnyEmbed = video;
  const { progress, update } = useTechnicalProgress();
  const record = progress[lesson.id];
  const [tab, setTab] = useState("reading");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [editedDraft, setDraft] = useState<string[] | null>(null);
  const draft =
    editedDraft ??
    (Array.isArray(record?.drafts?.[locale])
      ? (record!.drafts![locale] as string[])
      : lesson.assignment.fields.map(() => ""));
  const [criteria, setCriteria] = useState<boolean[]>(lesson.assignment.criteria.map(() => false));
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const completed = technicalCompleted(record);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const score = quizResult?.score ?? 0;
  const tabs = [
    "reading",
    "example",
    "video",
    "quiz",
    "assignment",
    "downloads",
    "assistant",
  ] as const;
  const [error, setError] = useState(false);
  const submitQuiz = async () => {
    try {
      setError(false);
      const result = await technicalCommand<QuizResult>("quiz", lesson.id, locale, { answers });
      if (!result.allowed) throw new Error("Access required");
      setQuizResult(result);
      setSubmitted(true);
      await update({ id: lesson.id, locale, action: "refresh" });
    } catch {
      setError(true);
    }
  };
  const savePractice = async () => {
    try {
      await update({
        id: lesson.id,
        locale,
        action: "practice",
        data: { values: draft, criteria },
      });
      setSaved(true);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  };
  const persist = (action: string) => {
    void update({ id: lesson.id, locale, action }).catch(() => setError(true));
  };
  const download = (type: string) => {
    const file = files.find((f) => f.kind === type);
    if (file)
      void technicalDownload(
        file.path,
        technicalDownloadName(copy[type as "workbook" | "worksheet"], lesson.title),
      ).catch(() => setError(true));
  };
  return (
    <>
      {error && (
        <p role="alert">
          {locale === "en" ? "Could not save. Try again." : "تعذر الحفظ. حاول مجددًا."}
        </p>
      )}
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
                      href={`/technical-assets/technical-education/${locale}/${section.diagram}.svg`}
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
              <Button onClick={() => persist("read")}>
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
                          setQuizResult(null);
                          persist("reset_quiz");
                        }}
                      />
                      <span className="leading-7">{option}</span>
                    </label>
                  ))}
                  {submitted && (
                    <p className="text-sm leading-7">
                      <strong>
                        {quizResult?.feedback.find((f) => f.id === question.id)?.correct
                          ? copy.correct
                          : copy.retry}
                        :{" "}
                      </strong>
                      {quizResult?.feedback.find((f) => f.id === question.id)?.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
              <Button
                disabled={!lesson.quiz.every((question) => question.id in answers)}
                onClick={() => void submitQuiz()}
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
              <Button onClick={() => void savePractice()}>{copy.save}</Button>
              {saved && <p role="status">{copy.saved}</p>}
              {saveFailed && (
                <p role="status">
                  {locale === "en"
                    ? "Storage is unavailable. Copy your work before leaving this page."
                    : "تعذر الحفظ في حسابك. انسخ تطبيقك قبل مغادرة الصفحة."}
                </p>
              )}
            </>
          )}
          {tab === "downloads" && (
            <>
              <h2 className="text-xl font-bold">{copy.downloaded}</h2>
              {["workbook", "worksheet"].map((type) => (
                <button
                  type="button"
                  key={type}
                  className="block rounded-xl border p-4 font-bold hover:border-primary"
                  onClick={() => download(type)}
                >
                  {copy[type as "workbook" | "worksheet"]}
                </button>
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
