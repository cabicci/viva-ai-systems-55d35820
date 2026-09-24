import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import type { KidsLesson } from "@/lib/kids/lesson-client";
import type { KidsLevelId } from "@/lib/kids/catalogue";
import type { SupportedLocale } from "@/lib/locale/types";

type Props = {
  lesson: KidsLesson;
  embedUrl: string;
  locale: SupportedLocale;
  levelId: KidsLevelId;
  lessonNumber: number;
  profileId: string;
};

export function KidsLessonBody({
  lesson,
  embedUrl,
  locale,
  levelId,
  lessonNumber,
  profileId,
}: Props) {
  const copy = getKidsJourneyCopy(locale);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<
    Record<string, { correct: boolean; explanation?: string }>
  >({});
  const [checkingKey, setCheckingKey] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [hint, setHint] = useState<{ id: string; answer: string } | null>(null);
  const [hintError, setHintError] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);

  async function showHint(index: number) {
    const hintId = `hint-${index + 1}`;
    const sourceId = lesson.hints?.[index]?.sourceScene ?? lesson.hints?.[index]?.source;
    setHint(null);
    setHintError(false);
    setLoadingHint(true);
    try {
      const { data, error } = await supabase.functions.invoke("kids-lesson-help", {
        body: { profileId, levelId, lessonNumber, locale, hintId },
      });
      const citation = data?.citation;
      if (
        error ||
        typeof data?.answer !== "string" ||
        !data.answer.trim() ||
        typeof sourceId !== "string" ||
        data.question !== lesson.hints?.[index]?.question ||
        citation?.product !== "kids" ||
        citation?.levelId !== levelId ||
        citation?.lessonNumber !== lessonNumber ||
        citation?.locale !== locale ||
        citation?.sourceId !== sourceId
      )
        throw new Error("Invalid protected hint");
      setHint({ id: hintId, answer: data.answer });
    } catch {
      setHintError(true);
    } finally {
      setLoadingHint(false);
    }
  }

  async function checkQuiz(questionId: string, selectedIndex: number) {
    setCheckingKey(questionId);
    setQuizError(null);
    try {
      const { data, error } = await supabase.functions.invoke("kids-lesson-content", {
        body: {
          profileId,
          levelId,
          lessonNumber,
          locale,
          action: "quiz-check",
          questionId,
          selectedIndex,
        },
      });
      const citation = data?.citation;
      if (
        error ||
        typeof data?.correct !== "boolean" ||
        citation?.product !== "kids" ||
        citation?.levelId !== levelId ||
        citation?.lessonNumber !== lessonNumber ||
        citation?.locale !== locale
      ) {
        throw new Error("Invalid protected quiz result");
      }
      setChecked((value) => ({
        ...value,
        [questionId]: {
          correct: data.correct,
          explanation: typeof data.explanation === "string" ? data.explanation : undefined,
        },
      }));
    } catch {
      setQuizError(questionId);
    } finally {
      setCheckingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-primary/20 bg-[var(--pastel-lavender)] p-6 md:p-9">
        <p className="text-sm font-bold text-primary">
          {copy.level} {Number(levelId.slice(-1))} · {copy.lesson} {lessonNumber}
        </p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="mt-3 text-base text-muted-foreground">{lesson.subtitle}</p>
        )}
      </header>
      <section
        aria-label={copy.watch}
        className="overflow-hidden rounded-3xl border border-border/60 bg-card"
      >
        <h2 className="p-5 text-xl font-bold">{copy.watch}</h2>
        <div className="aspect-video bg-black">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={`${copy.watch}: ${lesson.title}`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
      {Array.isArray(lesson.objectives) && lesson.objectives.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.objectives}</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed">
            {lesson.objectives.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(lesson.scenes) && lesson.scenes.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{copy.scenes}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lesson.scenes.map((scene, index) => (
              <article
                key={scene.id ?? index}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <h3 className="font-bold">{scene.title}</h3>
                {scene.display && <p className="mt-2 text-sm text-primary">{scene.display}</p>}
                {scene.narration && (
                  <p className="mt-3 text-sm leading-relaxed">{scene.narration}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(lesson.reading) && lesson.reading.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.reading}</h2>
          {lesson.reading.map((section, index) => (
            <article key={section.id ?? index} className="mt-5">
              {section.title && <h3 className="font-bold">{section.title}</h3>}
              {section.text && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{section.text}</p>
              )}
            </article>
          ))}
        </section>
      )}
      {lesson.activity && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-xl font-bold">{lesson.activity.title ?? copy.practice}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
            {lesson.activity.instructions}
          </p>
          <p className="mt-4 text-xs font-semibold text-muted-foreground">{copy.privacy}</p>
        </section>
      )}
      {Array.isArray(lesson.quiz) && lesson.quiz.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{copy.quiz}</h2>
          <div className="space-y-4">
            {lesson.quiz.map((question, index) => {
              const key = question.id ?? String(index);
              const selected = choices[key];
              return (
                <fieldset key={key} className="rounded-2xl border border-border/60 bg-card p-5">
                  <legend className="px-2 font-bold">
                    {index + 1}. {question.question}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <input
                          type="radio"
                          name={`kids-quiz-${key}`}
                          checked={selected === optionIndex}
                          disabled={checkingKey === key}
                          onChange={() => {
                            setQuizError(null);
                            setChoices((value) => ({ ...value, [key]: optionIndex }));
                            setChecked((value) => {
                              const next = { ...value };
                              delete next[key];
                              return next;
                            });
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={selected === undefined || checkingKey !== null}
                    onClick={() => {
                      if (selected !== undefined) void checkQuiz(key, selected);
                    }}
                    className="mt-4 min-h-11 rounded-full border border-primary px-5 text-sm font-bold text-primary disabled:opacity-50"
                  >
                    {copy.checkAnswer}
                  </button>
                  {quizError === key && (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                      {copy.unavailableLesson}
                    </p>
                  )}
                  {checked[key] && (
                    <p role="status" className="mt-3 text-sm">
                      {checked[key].correct ? copy.correct : copy.retry}
                      {checked[key].explanation && (
                        <span className="mt-1 block">{checked[key].explanation}</span>
                      )}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
        </section>
      )}
      {lesson.mission && (
        <section className="rounded-2xl border border-primary/20 bg-[var(--pastel-lavender)] p-6">
          <h2 className="text-xl font-bold">{lesson.mission.title ?? copy.mission}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
            {lesson.mission.instructions}
          </p>
          {Array.isArray(lesson.mission.rubric) && (
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm">
              {lesson.mission.rubric.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs font-semibold text-muted-foreground">{copy.privacy}</p>
        </section>
      )}
      {Array.isArray(lesson.hints) && lesson.hints.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.hint}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.hints.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled={loadingHint}
                onClick={() => showHint(index)}
                className="min-h-11 rounded-full border border-primary px-4 text-sm font-semibold text-primary disabled:opacity-50"
              >
                {item.question ?? `${copy.loadHint} ${index + 1}`}
              </button>
            ))}
          </div>
          {hint && (
            <p role="status" className="mt-4 rounded-xl bg-primary/5 p-4 text-sm">
              {hint.answer}
            </p>
          )}
          {hintError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {copy.unavailableLesson}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
