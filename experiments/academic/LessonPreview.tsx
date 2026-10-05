import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ReadingDiagram } from "./ReadingDiagram";
import { ReadingVisual, type ReadingVisualSpec } from "./ReadingVisual";
import eg from "./content/ar-EG.json";
import msa from "./content/ar-MSA.json";
import gulf from "./content/ar-Gulf.json";
import en from "./content/en.json";
import mediaManifest from "./media-manifest.json";
import "./style.css";

export const packages = { "ar-EG": eg, "ar-MSA": msa, "ar-Gulf": gulf, en };
type Locale = keyof typeof packages;
export type Lesson = Pick<
  typeof eg,
  | "id"
  | "locale"
  | "title"
  | "intro"
  | "goals"
  | "sections"
  | "example"
  | "quiz"
  | "assignment"
  | "faq"
  | "summary"
> & {
  readingVisuals?: ReadingVisualSpec[];
  example: typeof eg.example & { steps?: string[] };
  assignment: typeof eg.assignment & {
    rubric?: { criterion: string; excellent: string; adequate: string; needsRevision: string }[];
  };
};
const labels = {
  "ar-EG": [
    "الشرح",
    "مثال محلول",
    "الفيديو",
    "اختبر فهمك",
    "التطبيق",
    "أسئلة شائعة",
    "التحميل",
    "المساعد الذكي",
  ],
  "ar-MSA": [
    "الشرح",
    "مثال محلول",
    "الفيديو",
    "اختبر فهمك",
    "التطبيق",
    "أسئلة شائعة",
    "التحميل",
    "المساعد الذكي",
  ],
  "ar-Gulf": [
    "الشرح",
    "مثال محلول",
    "الفيديو",
    "اختبر فهمك",
    "التطبيق",
    "أسئلة شائعة",
    "التحميل",
    "المساعد الذكي",
  ],
  en: [
    "Reading",
    "Worked example",
    "Video",
    "Check understanding",
    "Practice",
    "FAQ",
    "Download",
    "AI assistant",
  ],
};
declare global {
  interface Window {
    __ACADEMIC_REVIEW_PDFS__?: Record<string, string>;
  }
}
const panel = "rounded-3xl border border-border bg-card p-5 md:p-8";
function PrintBook({ lesson }: { lesson: Lesson }) {
  const english = lesson.locale === "en";
  return (
    <div className="print-only" dir={english ? "ltr" : "rtl"}>
      <section className="print-page">
        <img src="/brand/masaarat-logo-lockup.png" width="170" />
        <p>{english ? "Masaarat Academic · Lesson workbook" : "مسارات أكاديمي · كراسة الدرس"}</p>
        <h1>{lesson.title}</h1>
        <p>{lesson.intro}</p>
        <h2>{english ? "Learning outcomes" : "أهداف التعلم"}</h2>
        <ul>
          {lesson.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        {lesson.id === "AC-BUS-M01-L01" && <ReadingDiagram kind="customer" english={english} />}
        <footer>{english ? "Produced by Masaarat" : "إنتاج مسارات"} · 1</footer>
      </section>
      {lesson.sections.map((s, i) => (
        <section className="print-page" key={s.id}>
          <p>{english ? "Masaarat Academic" : "مسارات أكاديمي"}</p>
          <h2>{s.title}</h2>
          <p>{s.text}</p>
          <ReadingDiagram kind={s.id} english={english} />
          <p>
            <strong>{english ? "Pause and apply" : "توقف وطبّق"}:</strong> {s.reflection}
          </p>
          <footer>
            {english ? "Produced by Masaarat" : "إنتاج مسارات"} · {i + 2}
          </footer>
        </section>
      ))}
      <section className="print-page">
        <h2>{lesson.example.title}</h2>
        <p>{lesson.example.text}</p>
        <p>{lesson.example.decision}</p>
        <ol>
          {lesson.example.steps?.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <h2>{english ? "Practice" : "التطبيق"}</h2>
        <p>{lesson.assignment.prompt}</p>
        {lesson.assignment.fields.map((f) => (
          <div key={f}>
            <p>{f}</p>
            <div style={{ borderBottom: "1px solid #aaa", height: "10mm" }} />
          </div>
        ))}
        <footer>
          {english ? "Produced by Masaarat" : "إنتاج مسارات"} · {lesson.sections.length + 2}
        </footer>
      </section>
      <section className="print-page">
        <h2>{english ? "Review and summary" : "المراجعة والملخص"}</h2>
        <ul>
          {lesson.assignment.criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <ul>
          {lesson.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {lesson.faq.map((f) => (
          <article key={f.question}>
            <h3>{f.question}</h3>
            <p>{f.answer}</p>
          </article>
        ))}
        <footer>
          {english ? "Produced by Masaarat" : "إنتاج مسارات"} · {lesson.sections.length + 3}
        </footer>
      </section>
    </div>
  );
}
export function LessonView({ lesson }: { lesson: Lesson }) {
  const locale = lesson.locale as Locale,
    english = locale === "en",
    t = labels[locale];
  const media = (
    lesson.id === "AC-BUS-M01-L01"
      ? mediaManifest[locale]
      : { embedUrl: null, durationSeconds: null, playbackReady: false }
  ) as {
    embedUrl: string | null;
    durationSeconds: number | null;
    playbackReady: boolean;
  };
  const videoUrl =
    media.playbackReady &&
    media.embedUrl &&
    /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+\?autoplay=false&preload=false$/.test(
      media.embedUrl,
    )
      ? media.embedUrl
      : null;
  const [tab, setTab] = useState(0),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [submitted, setSubmitted] = useState(false),
    [read, setRead] = useState(false),
    [fields, setFields] = useState<string[]>(lesson.assignment.fields.map(() => ""));
  const select = (n: number) => {
    setTab(n);
    document.getElementById("lesson-panel")?.scrollIntoView({ block: "start" });
  };
  return (
    <>
      <div className="screen-only mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className={`${panel} bg-gradient-to-br from-accent/20 to-card`}>
          <p className="text-sm font-bold text-primary">
            {english ? "Business foundations" : "أساسيات الأعمال"} · {lesson.id}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-snug md:text-4xl">{lesson.title}</h1>
          <p className="mt-4 max-w-4xl leading-8 text-muted-foreground">{lesson.intro}</p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24">
            <nav
              className={`${panel} !p-3`}
              aria-label={english ? "Lesson sections" : "أقسام الدرس"}
            >
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
                {t.map((label, i) =>
                  i === 2 && !videoUrl ? null : (
                    <button
                      key={label}
                      className={`min-h-11 rounded-xl px-3 py-3 text-start text-sm font-bold ${tab === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      aria-pressed={tab === i}
                      aria-controls="lesson-panel"
                      onClick={() => select(i)}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </nav>
            <section className={`${panel} !p-5`}>
              <h2 className="font-bold">{english ? "Your review" : "مراجعتك"}</h2>
              <Progress
                className="mt-3"
                value={
                  ((Number(read) + Number(submitted) + Number(fields.every(Boolean))) / 3) * 100
                }
              />
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {english
                  ? "This review session is not saved to an account."
                  : "هذه المراجعة لا تُحفظ في حسابك."}
              </p>
            </section>
          </aside>
          <section
            id="lesson-panel"
            className={`${panel} min-w-0 scroll-mt-24 space-y-6`}
            aria-label={t[tab]}
          >
            {tab === 0 && (
              <>
                <h2 className="text-xl font-bold">
                  {english ? "Learning outcomes" : "أهداف التعلم"}
                </h2>
                <ul className="list-inside list-disc space-y-2 leading-7">
                  {lesson.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                {lesson.sections.map((s) => (
                  <article
                    key={s.id}
                    className="grid items-start gap-5 border-t pt-6 md:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <div>
                      <h3 className="text-xl font-bold">{s.title}</h3>
                      <p className="academic-prose mt-3">{s.text}</p>
                      <p className="mt-4 rounded-xl bg-accent/20 p-4 leading-8">
                        <strong>{english ? "Think it through: " : "فكّر وطبّق: "}</strong>
                        {s.reflection}
                      </p>
                    </div>
                    <ReadingDiagram kind={s.id} english={english} />
                  </article>
                ))}
                {lesson.readingVisuals?.map((visual) => (
                  <ReadingVisual key={visual.id} visual={visual} />
                ))}
                <Button onClick={() => setRead(true)}>
                  {read
                    ? english
                      ? "Reading reviewed"
                      : "تمت مراجعة الشرح"
                    : english
                      ? "Mark reading reviewed"
                      : "أنهيت مراجعة الشرح"}
                </Button>
              </>
            )}
            {tab === 1 && (
              <>
                <h2 className="text-xl font-bold">{lesson.example.title}</h2>
                <p className="academic-prose">{lesson.example.text}</p>
                <ol className="list-inside list-decimal space-y-4 leading-8">
                  {lesson.example.steps?.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {lesson.id === "AC-BUS-M01-L01" && (
                  <ReadingDiagram kind="money" english={english} />
                )}
                <p className="rounded-xl bg-accent/30 p-4 leading-8 font-bold">
                  {lesson.example.decision}
                </p>
              </>
            )}
            {tab === 2 && (
              <>
                <h2 className="text-xl font-bold">{t[2]}</h2>
                {videoUrl ? (
                  <iframe
                    title={lesson.title}
                    src={videoUrl}
                    className="aspect-video w-full rounded-xl border-0"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <p className="leading-8">
                    {english
                      ? "The video is being prepared. Reading and practice are ready for review."
                      : "الفيديو قيد التجهيز. الشرح والتطبيق جاهزان للمراجعة."}
                  </p>
                )}
              </>
            )}
            {tab === 3 && (
              <>
                <h2 className="text-xl font-bold">{t[3]}</h2>
                {lesson.quiz.map((q) => (
                  <fieldset key={q.id} className="space-y-3 rounded-2xl border p-4">
                    <legend className="px-2 font-bold leading-8">{q.question}</legend>
                    {q.options.map((o, i) => (
                      <label
                        key={i}
                        className="flex min-h-11 items-start gap-3 rounded-xl bg-muted/40 p-3"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === i}
                          onChange={() => {
                            setAnswers({ ...answers, [q.id]: i });
                            setSubmitted(false);
                          }}
                          className="mt-1"
                        />
                        <span className="leading-7">{o}</span>
                      </label>
                    ))}
                    {submitted && (
                      <p className="leading-8">
                        <strong>
                          {answers[q.id] === q.correct
                            ? english
                              ? "Correct. "
                              : "صحيح. "
                            : english
                              ? "Review your answer. "
                              : "راجع إجابتك. "}
                        </strong>
                        {q.explanation}
                      </p>
                    )}
                  </fieldset>
                ))}
                <Button
                  disabled={!lesson.quiz.every((q) => q.id in answers)}
                  onClick={() => setSubmitted(true)}
                >
                  {english ? "Review answers" : "راجع الإجابات"}
                </Button>
                {submitted && (
                  <p role="status">
                    <bdi>
                      {lesson.quiz.filter((q) => answers[q.id] === q.correct).length} /{" "}
                      {lesson.quiz.length}
                    </bdi>
                  </p>
                )}
              </>
            )}
            {tab === 4 && (
              <>
                <h2 className="text-xl font-bold">{t[4]}</h2>
                <p className="leading-8">{lesson.assignment.prompt}</p>
                {lesson.assignment.fields.map((f, i) => (
                  <label key={f} className="block font-bold">
                    {f}
                    <textarea
                      className="mt-2 block w-full rounded-xl border bg-background p-3 font-normal leading-7"
                      rows={3}
                      maxLength={5000}
                      value={fields[i]}
                      onChange={(e) =>
                        setFields(fields.map((v, j) => (j === i ? e.target.value : v)))
                      }
                    />
                  </label>
                ))}
                {lesson.assignment.rubric?.map((row, i) => (
                  <details key={i} className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-bold">{row.criterion}</summary>
                    <dl className="mt-3 space-y-2 leading-7">
                      <dt className="font-bold">{english ? "Strong evidence" : "أداء متقن"}</dt>
                      <dd>{row.excellent}</dd>
                      <dt className="font-bold">
                        {english ? "Meets requirements" : "يستوفي المطلوب"}
                      </dt>
                      <dd>{row.adequate}</dd>
                      <dt className="font-bold">{english ? "Needs revision" : "يحتاج مراجعة"}</dt>
                      <dd>{row.needsRevision}</dd>
                    </dl>
                  </details>
                ))}
                <ul className="list-inside list-disc space-y-3 leading-7">
                  {lesson.assignment.criteria.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
            {tab === 5 && (
              <>
                <h2 className="text-xl font-bold">{t[5]}</h2>
                {lesson.faq.map((f) => (
                  <details key={f.question} className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-bold leading-7">{f.question}</summary>
                    <p className="mt-3 leading-8">{f.answer}</p>
                  </details>
                ))}
              </>
            )}
            {tab === 6 && (
              <>
                <h2 className="text-xl font-bold">{t[6]}</h2>
                {lesson.id === "AC-BUS-M01-L01" && window.__ACADEMIC_REVIEW_PDFS__?.[locale] ? (
                  <Button asChild>
                    <a
                      href={window.__ACADEMIC_REVIEW_PDFS__[locale]}
                      download={`Lesson_Workbook_${lesson.id}_${locale}.pdf`}
                    >
                      {english ? "Download lesson workbook (PDF)" : "تنزيل كراسة الدرس (PDF)"}
                    </a>
                  </Button>
                ) : (
                  <Button onClick={() => window.print()}>
                    {english ? "Print lesson workbook / save PDF" : "طباعة كراسة الدرس / حفظ PDF"}
                  </Button>
                )}
              </>
            )}
            {tab === 7 && (
              <>
                <h2 className="text-xl font-bold">{t[7]}</h2>
                <p className="leading-8">
                  {english
                    ? "The Academic assistant will be an optional separate subscription. It is not connected in this lesson review."
                    : "المساعد الأكاديمي إضافة اختيارية باشتراك منفصل. لم يتم توصيله في مراجعة هذا الدرس."}
                </p>
              </>
            )}
          </section>
        </div>
      </div>
      <PrintBook lesson={lesson} />
    </>
  );
}
