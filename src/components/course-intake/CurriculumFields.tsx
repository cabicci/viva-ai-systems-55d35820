import { useState } from "react";
import type { IntakeSection } from "@/lib/course-system/intake/package";
import { checkTraining, type TrainingCheck } from "@/lib/course-system/intake/training";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";
import { CourseInlineText } from "./CourseInlineText";

/** Same card/radio styling as the AC-BUS quiz and practice tabs. */
const CARD = "rounded-xl border p-4";
const CHOICE = "my-3 flex items-start gap-3 rounded-lg bg-muted/30 p-3 leading-7";
const INPUT = "mt-3 w-full rounded-xl border bg-background p-3 font-normal leading-7";

export function CurriculumFields({
  section,
  values,
  onChange,
  disabled,
  locale,
}: {
  section: IntakeSection;
  values: Record<string, string | number>;
  onChange: (id: string, value: string) => void;
  disabled: boolean;
  locale: SupportedLocale;
}) {
  const c = intakeCopy(locale);
  const [feedback, setFeedback] = useState<{ snapshot: string; state: TrainingCheck } | null>(null);
  const snapshot = JSON.stringify(values);
  return (
    <>
      {section.fields.map((f) =>
        f.input === "choice" ? (
          <fieldset key={f.id} className={CARD} disabled={disabled}>
            <legend className="px-2 font-bold leading-8">
              <CourseInlineText text={f.label} />
            </legend>
            {f.options?.map((o) => (
              <label key={o.id} className={CHOICE}>
                <input
                  type="radio"
                  className="mt-2 h-4 w-4 shrink-0"
                  name={`${section.id}-${f.id}`}
                  value={o.id}
                  checked={String(values[f.id] ?? "") === o.id}
                  onChange={() => onChange(f.id, o.id)}
                />
                <span className="min-w-0 flex-1">
                  <CourseInlineText text={o.label} />
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <label key={f.id} className="block font-bold">
            <CourseInlineText text={f.label} />
            {f.input === "number" ? (
              <input
                disabled={disabled}
                type="text"
                inputMode="decimal"
                dir="ltr"
                className={`${INPUT} min-h-11`}
                maxLength={200}
                value={values[f.id] ?? ""}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            ) : (
              <textarea
                disabled={disabled}
                rows={4}
                className={INPUT}
                value={values[f.id] ?? ""}
                maxLength={5000}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}
          </label>
        ),
      )}
      {section.training && (
        <div className={`space-y-3 ${CARD}`}>
          <p>{c.trainingReview}</p>
          <p className="whitespace-pre-wrap">
            <CourseInlineText text={section.training.support} />
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setFeedback({ snapshot, state: checkTraining(section, values) })}
          >
            {c.trainingCheck}
          </Button>
          {feedback?.snapshot === snapshot && (
            <p role="status">
              {feedback.state === "correct"
                ? c.trainingCorrect
                : feedback.state === "prerequisite"
                  ? c.trainingPrerequisite
                  : feedback.state === "mismatch"
                    ? c.trainingMismatch
                    : c.trainingInvalid}
            </p>
          )}
        </div>
      )}
    </>
  );
}

/** Scored questions (index answers) plus authored fields; shared by learner and
 * admin preview so both render identical inputs. Holds no answer keys. */
export function ActivityForm({
  section,
  values,
  onChange,
  disabled,
  locale,
}: {
  section: IntakeSection;
  values: Record<string, string | number>;
  onChange: (id: string, value: string | number) => void;
  disabled: boolean;
  locale: SupportedLocale;
}) {
  return (
    <div className="space-y-4">
      {section.questions.map((q) => (
        <fieldset key={q.id} className={CARD} disabled={disabled}>
          <legend className="px-2 font-bold leading-8">
            <CourseInlineText text={q.prompt} />
          </legend>
          {q.options.map((option, i) => (
            <label key={i} className={CHOICE}>
              <input
                type="radio"
                className="mt-2 h-4 w-4 shrink-0"
                name={`${section.id}-${q.id}`}
                checked={values[q.id] === i}
                onChange={() => onChange(q.id, i)}
              />
              <span className="min-w-0 flex-1">
                <CourseInlineText text={option} />
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <CurriculumFields
        section={section}
        values={values}
        disabled={disabled}
        locale={locale}
        onChange={onChange}
      />
    </div>
  );
}
