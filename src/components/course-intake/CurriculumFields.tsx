import { useState } from "react";
import type { IntakeSection } from "@/lib/course-system/intake/package";
import { checkTraining, type TrainingCheck } from "@/lib/course-system/intake/training";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";
import { CourseInlineText } from "./CourseInlineText";

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
      {section.fields.map((f) => (
        <label key={f.id} className="block">
          {f.label}
          {f.input === "choice" ? (
            <select
              disabled={disabled}
              className="mt-2 block min-h-11 w-full rounded-lg border bg-background p-3"
              value={String(values[f.id] ?? "")}
              onChange={(e) => onChange(f.id, e.target.value)}
            >
              <option value="">{c.selectAnswer}</option>
              {f.options?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.input === "number" ? (
            <input
              disabled={disabled}
              type="text"
              inputMode="decimal"
              dir="ltr"
              className="mt-2 block min-h-11 w-full rounded-lg border bg-background p-3"
              maxLength={200}
              value={values[f.id] ?? ""}
              onChange={(e) => onChange(f.id, e.target.value)}
            />
          ) : (
            <textarea
              disabled={disabled}
              className="mt-2 block min-h-28 w-full rounded-lg border bg-background p-3"
              value={values[f.id] ?? ""}
              maxLength={5000}
              onChange={(e) => onChange(f.id, e.target.value)}
            />
          )}
        </label>
      ))}
      {section.training && (
        <div className="space-y-3 rounded-xl border p-4">
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
