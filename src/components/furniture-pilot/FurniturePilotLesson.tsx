import { useMemo, useState } from "react";
import { Download, FileCheck2, Ruler, BookOpen, PlayCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SupportedLocale } from "@/lib/locale/types";
import { getPilotCopy, resolvePilotLocale } from "@/lib/furniture-pilot/content";
import { getBunnyEmbedUrlForLocale } from "@/lib/bunny-videos";
import { splitTechnicalText } from "@/lib/furniture-pilot/technical-text";
import {
  SAMPLE,
  PILOT_ID,
  calculateCabinet,
  gradeQuiz,
  checkAssignment,
  type CabinetInput,
  type QuizAnswer,
} from "@/lib/furniture-pilot/model";

const ASSET_ROOT = "/experiments/furniture-pilot";
const technicalText = (value: string) =>
  splitTechnicalText(value).map((part, index) =>
    part.ltr ? (
      <bdi dir="ltr" key={index}>
        {part.text}
      </bdi>
    ) : (
      part.text
    ),
  );
type SectionId =
  | "reading"
  | "drawings"
  | "video"
  | "calculator"
  | "quiz"
  | "assignment"
  | "downloads"
  | "assistant";
const sections: SectionId[] = [
  "reading",
  "drawings",
  "video",
  "calculator",
  "quiz",
  "assignment",
  "downloads",
  "assistant",
];

export function FurniturePilotLesson({ locale: requestedLocale }: { locale: SupportedLocale }) {
  const locale = resolvePilotLocale(requestedLocale);
  const bunnyEmbed = getBunnyEmbedUrlForLocale(PILOT_ID, locale);
  const copy = getPilotCopy(locale);
  const c = copy.labels;
  const [tab, setTab] = useState<SectionId>("reading");
  const [read, setRead] = useState(false);
  const [dimensions, setDimensions] = useState<Record<keyof CabinetInput, string>>({
    width: "600",
    height: "600",
    depth: "300",
    thickness: "18",
    backThickness: "6",
  });
  const [answers, setAnswers] = useState<QuizAnswer>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [task, setTask] = useState({ innerWidth: "", bodyDepth: "", opening: "" });
  const [taskSubmitted, setTaskSubmitted] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const geometry = useMemo(() => {
    const numeric = Object.fromEntries(
      Object.entries(dimensions).map(([key, value]) => [key, Number(value)]),
    ) as CabinetInput;
    try {
      return calculateCabinet(numeric);
    } catch {
      return null;
    }
  }, [dimensions]);
  const quiz = gradeQuiz(answers);
  const taskResults = checkAssignment(task);
  const taskPassed = taskSubmitted && taskResults.every((result) => result.correct);
  const quizPassed = quizSubmitted && quiz.passed;
  const completed = Number(read) + Number(quizPassed) + Number(taskPassed);
  const panelClass = "rounded-3xl border border-border bg-card p-5 md:p-8";
  const inputClass =
    "mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-start focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <main
      id="main-content"
      dir={locale === "en" ? "ltr" : "rtl"}
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:py-12"
    >
      <header className={`${panelClass} bg-gradient-to-br from-accent/30 via-card to-secondary/30`}>
        <span className="inline-flex rounded-full border border-primary/30 bg-card px-3 py-1 text-xs font-bold text-primary">
          {copy.draft}
        </span>
        <p className="mt-5 text-sm font-bold text-primary">{copy.eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-3xl leading-snug font-black md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{copy.intro}</p>
        <p className="mt-4 max-w-3xl rounded-2xl bg-card/80 p-4 text-sm leading-7">{copy.scope}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-20">
          <nav aria-label={copy.eyebrow} className={`${panelClass} !p-3`}>
            <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
              {sections.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={tab === id}
                  aria-controls="pilot-section"
                  onClick={() => setTab(id)}
                  className={`min-h-11 rounded-xl px-4 py-3 text-start text-sm font-bold transition ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {c[id]}
                </button>
              ))}
            </div>
          </nav>
          <div className={`${panelClass} !p-5`}>
            <h2 className="text-sm font-bold">{c.progress}</h2>
            <Progress
              value={Math.round((completed / 3) * 100)}
              aria-valuenow={Math.round((completed / 3) * 100)}
              aria-valuetext={`${completed}/3`}
              className="mt-3"
              aria-label={c.progress}
            />
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                {read ? "✓" : "○"} {c.reading}
              </li>
              <li>
                {quizPassed ? "✓" : "○"} {c.quiz}
              </li>
              <li>
                {taskPassed ? "✓" : "○"} {c.assignment}
              </li>
            </ul>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">{c.progressNote}</p>
          </div>
        </aside>

        <section
          id="pilot-section"
          className={`${panelClass} min-w-0`}
          aria-labelledby="pilot-section-title"
        >
          <h2 id="pilot-section-title" className="mb-6 flex items-center gap-3 text-2xl font-black">
            {tab === "video" ? (
              <PlayCircle className="h-6 w-6 shrink-0 text-primary" />
            ) : tab === "assistant" ? (
              <MessageCircle className="h-6 w-6 shrink-0 text-primary" />
            ) : tab === "drawings" || tab === "calculator" ? (
              <Ruler className="h-6 w-6 shrink-0 text-primary" />
            ) : tab === "downloads" ? (
              <Download className="h-6 w-6 shrink-0 text-primary" />
            ) : tab === "assignment" || tab === "quiz" ? (
              <FileCheck2 className="h-6 w-6 shrink-0 text-primary" />
            ) : (
              <BookOpen className="h-6 w-6 shrink-0 text-primary" />
            )}
            {c[tab]}
          </h2>

          {tab === "reading" && (
            <div className="space-y-8">
              <section className="rounded-2xl bg-accent/20 p-5">
                <h3 className="font-bold">{copy.goalsTitle}</h3>
                <ul className="mt-3 list-disc space-y-2 ps-5 leading-7">
                  {copy.goals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-7">{copy.prerequisites}</p>
              </section>
              {copy.sections.map((section, index) => (
                <article id={`pilot-${section.id}`} key={section.id}>
                  <p className="text-xs font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">{section.title}</h3>
                  <p className="mt-3 leading-8">{technicalText(section.body)}</p>
                  <p
                    className="mt-3 rounded-xl bg-muted p-4 text-sm leading-7"
                    dir={section.note.includes(" = ") ? "ltr" : undefined}
                  >
                    {section.note}
                  </p>
                </article>
              ))}
              <Button onClick={() => setRead(true)}>{read ? c.readDone : c.markRead}</Button>
            </div>
          )}

          {tab === "drawings" && (
            <div className="space-y-6">
              {(["front", "side", "exploded"] as const).map((id) => (
                <figure key={id} className="overflow-hidden rounded-2xl border border-border">
                  <a
                    href={`${ASSET_ROOT}/${locale}/${id}.svg`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${c.zoom}: ${c[id]}`}
                  >
                    <img
                      src={`${ASSET_ROOT}/${locale}/${id}.svg`}
                      alt={c[id]}
                      className="w-full bg-white"
                    />
                  </a>
                  <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
                    <span>{c[id]}</span>
                    <a
                      className="font-bold text-primary underline"
                      href={`${ASSET_ROOT}/${locale}/${id}.svg`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {c.zoom}
                    </a>
                  </figcaption>
                </figure>
              ))}
              <p className="text-sm leading-7">{copy.scope}</p>
            </div>
          )}

          {tab === "video" && (
            <div className="space-y-5">
              {bunnyEmbed && (
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
                  <iframe
                    src={bunnyEmbed}
                    title={c.video}
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              )}
              <div className="rounded-2xl border border-primary/20 bg-accent/20 p-6">
                <h3 className="text-xl font-bold">{bunnyEmbed ? c.videoReady : c.videoPending}</h3>
                <p className="mt-3 leading-8">{c.videoNote}</p>
              </div>
              <ol className="list-decimal space-y-4 ps-6">
                {copy.sections.map((section) => (
                  <li key={section.id}>
                    <strong>{section.title}</strong>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {technicalText(section.body)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tab === "calculator" && (
            <div className="space-y-6">
              <p className="text-sm leading-7">{copy.sections[0].note}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(Object.keys(SAMPLE) as (keyof CabinetInput)[]).map((key) => (
                  <label key={key} className="text-sm font-bold">
                    {c[key]} ({c.mm})
                    <input
                      className={inputClass}
                      aria-label={`${c[key]} (${c.mm})`}
                      type="number"
                      min="0.01"
                      max="100000"
                      step="any"
                      inputMode="decimal"
                      value={dimensions[key]}
                      onChange={(event) =>
                        setDimensions((previous) => ({ ...previous, [key]: event.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  setDimensions({
                    width: "600",
                    height: "600",
                    depth: "300",
                    thickness: "18",
                    backThickness: "6",
                  })
                }
              >
                {c.reset}
              </Button>
              {!geometry ? (
                <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm">
                  {c.invalid}
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["innerWidth", "bodyDepth", "clearOpeningHeight"] as const).map(
                      (key, index) => (
                        <div key={key} className="rounded-xl bg-muted p-4">
                          <p className="text-xs">{[c.innerWidth, c.bodyDepth, c.opening][index]}</p>
                          <p className="mt-2 text-xl font-bold" dir="ltr">
                            {Number(geometry[key].toFixed(2))} mm
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[540px] text-start text-sm">
                      <caption className="mb-3 text-start font-bold">
                        {copy.sections[4].title}
                      </caption>
                      <thead>
                        <tr>
                          {[c.part, c.ids, c.quantity, c.length, c.panelWidth, c.thickness].map(
                            (label) => (
                              <th key={label} className="border-b p-3 text-start">
                                {label}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {geometry.panels.map((panel) => (
                          <tr key={panel.key}>
                            <th className="border-b p-3 text-start font-normal">{c[panel.key]}</th>
                            <td className="border-b p-3" dir="ltr">
                              {panel.ids.join(" / ")}
                            </td>
                            {[panel.quantity, panel.length, panel.width, panel.thickness].map(
                              (value, index) => (
                                <td key={index} className="border-b p-3" dir="ltr">
                                  {Number(value.toFixed(2))}
                                </td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{copy.sections[4].note}</p>
                </>
              )}
            </div>
          )}

          {tab === "quiz" && (
            <form
              className="space-y-7"
              onSubmit={(event) => {
                event.preventDefault();
                setQuizSubmitted(true);
              }}
            >
              {copy.quiz.map((question, index) => (
                <fieldset key={question.id} className="rounded-2xl border border-border p-5">
                  <legend className="px-2 font-bold">
                    {index + 1}. {question.question}
                  </legend>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={optionIndex}
                          checked={answers[question.id] === optionIndex}
                          onChange={() => {
                            setAnswers((previous) => ({ ...previous, [question.id]: optionIndex }));
                            setQuizSubmitted(false);
                          }}
                        />
                        <span>{technicalText(option)}</span>
                      </label>
                    ))}
                  </div>
                  {quizSubmitted && quiz.answered && (
                    <p className="mt-4 text-sm leading-7">{question.explanation}</p>
                  )}
                </fieldset>
              ))}
              <Button type="submit">{c.check}</Button>
              {quizSubmitted && (
                <p role="status" className="rounded-xl bg-accent/20 p-4">
                  {!quiz.answered
                    ? c.quizMissing
                    : quiz.passed
                      ? c.quizPassed
                      : `${quiz.correct}/${quiz.total} — ${c.quizReview}`}
                </p>
              )}
            </form>
          )}

          {tab === "assignment" && (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                setTaskSubmitted(true);
              }}
            >
              <p className="rounded-2xl bg-accent/20 p-5 leading-8">{c.worksheet}</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["innerWidth", "bodyDepth", "opening"] as const).map((key) => (
                  <label key={key} className="text-sm font-bold">
                    {c[key]} ({c.mm})
                    <input
                      className={inputClass}
                      aria-label={`${c[key]} (${c.mm})`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={task[key]}
                      onChange={(event) => {
                        setTask((previous) => ({ ...previous, [key]: event.target.value }));
                        setTaskSubmitted(false);
                      }}
                    />
                    {taskSubmitted && (
                      <span className="mt-2 block text-sm">
                        {taskResults.find((result) => result.id === key)?.correct
                          ? `✓ ${c.correct}`
                          : c.revise}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <Button type="submit">{c.check}</Button>
              {taskPassed && (
                <p role="status" className="rounded-xl bg-accent/20 p-4">
                  {c.practicalDone}
                </p>
              )}
              <p className="text-sm leading-7">{c.assignmentNote}</p>
              <p className="rounded-xl bg-muted p-5 text-sm leading-7">{c.rubric}</p>
              <h3 className="text-lg font-bold">{c.cost}</h3>
              <p className="text-sm leading-7">{c.costNote}</p>
              <a
                download
                href={`${ASSET_ROOT}/${locale}/workbook.pdf`}
                className="inline-flex min-h-11 items-center gap-2 font-bold text-primary underline"
              >
                <Download className="h-4 w-4" />
                {c.downloadPack}
              </a>
            </form>
          )}

          {tab === "downloads" && (
            <div className="space-y-4">
              {[
                { label: c.downloadPack, file: `${locale}/workbook.pdf` },
                { label: c.downloadParts, file: `${locale}/cut-list.json` },
                { label: c.downloadDrawing, file: `${locale}/front.svg` },
              ].map((file) => (
                <a
                  key={file.file}
                  download
                  href={`${ASSET_ROOT}/${file.file}`}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-border p-4 font-bold hover:bg-muted"
                >
                  <Download className="h-5 w-5 shrink-0 text-primary" />
                  {file.label}
                </a>
              ))}
              <p className="text-sm leading-7">{copy.scope}</p>
            </div>
          )}

          {tab === "assistant" && (
            <div className="space-y-5">
              <p className="rounded-xl bg-muted p-4 text-sm leading-7">{c.guideNote}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {copy.faq.map((item, index) => (
                  <button
                    type="button"
                    key={item.source}
                    onClick={() => setFaq(index)}
                    className="min-h-14 rounded-xl border border-border p-4 text-start text-sm font-bold hover:bg-accent/20"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
              {faq !== null && (
                <div
                  role="status"
                  className="rounded-2xl border border-primary/20 bg-accent/20 p-5"
                >
                  <p className="leading-8">{copy.faq[faq].answer}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("reading");
                    }}
                    className="mt-3 min-h-11 font-bold text-primary underline"
                  >
                    {copy.sections.find((section) => section.id === copy.faq[faq].source)?.title}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section className={`${panelClass} text-sm leading-7`}>
        <h2 className="font-bold">{c.sources}</h2>
        <p className="mt-3">{c.sourceNote}</p>
        <a
          className="mt-2 inline-block font-semibold text-primary underline"
          href="https://www.hse.gov.uk/woodworking/training.htm"
          target="_blank"
          rel="noreferrer"
        >
          HSE — Training and supervision
        </a>
      </section>
    </main>
  );
}
