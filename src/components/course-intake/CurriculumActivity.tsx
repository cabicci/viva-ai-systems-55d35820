import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import {
  useActivityDraft,
  type ActivityValues,
} from "@/lib/course-system/intake/use-activity-draft";
import { curriculumCommand } from "@/lib/course-system/intake/client";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import type { COURSE_AREAS } from "@/lib/course-system/contract";
import type { IntakeSection } from "@/lib/course-system/intake/package";
import type { LessonContent } from "./CurriculumContent";
import { ActivityForm } from "./CurriculumFields";
import { Button } from "@/components/ui/button";

export type Delivery = {
  attempts?: {
    id: string;
    section: string;
    version: string;
    draft: ActivityValues;
    revision: number;
  }[];
  reviewOnly?: boolean;
  version: string;
  recordId: string | null;
  lesson: LessonContent;
  progress: { lesson: string; required: number; completed: number; done: boolean }[];
  events: { section: string; completed: boolean; result?: { state: string; passed?: boolean } }[];
};

/** Learner controls for one section. Server-authoritative attempts: an untimed
 * activity's attempt is created inside the submit handler, never on view. */
export function Activity({
  section,
  delivery,
  scope,
}: {
  section: IntakeSection;
  delivery: Delivery;
  scope: {
    area: (typeof COURSE_AREAS)[number];
    course: string;
    lesson: string;
    profileId?: string;
  };
}) {
  const auth = useAuth();
  const { locale } = useLocale();
  const c = intakeCopy(locale);
  const client = useQueryClient();
  const resumed = delivery.attempts?.find((x) => x.section === section.id);
  const [attempt, setAttempt] = useState<string | null>(resumed?.id ?? null);
  const [created, setCreated] = useState<{ draft: ActivityValues; revision: number } | null>(null);
  const closedAttempts = useRef(new Set<string>());
  const delivered = useRef(delivery);
  useEffect(() => {
    if (!attempt && resumed?.id && !closedAttempts.current.has(resumed.id)) setAttempt(resumed.id);
    if (
      delivered.current !== delivery &&
      attempt &&
      !delivery.attempts?.some((x) => x.id === attempt)
    ) {
      closedAttempts.current.add(attempt);
      setAttempt(null);
    }
    delivered.current = delivery;
  }, [delivery, attempt, resumed?.id]);
  const [result, setResult] = useState<{
    state: string;
    passed?: boolean;
    score?: number;
    total?: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const running = useRef(false);
  const requests = useRef<Partial<Record<string, { data: object; requestId: string }>>>({});
  const owner = useRef(true);
  useEffect(() => {
    owner.current = true;
    return () => {
      owner.current = false;
    };
  }, []);
  const generation = auth.authGeneration;
  const seed = created && (!resumed || created.revision > resumed.revision) ? created : resumed;
  const draft = useActivityDraft({
    storageKey: `curriculum-draft:v1:${JSON.stringify([auth.user?.id, scope.profileId ?? null, scope.area, scope.course, scope.lesson, locale, delivery.version, section.id])}`,
    attemptId: attempt,
    initial: seed?.draft ?? {},
    revision: seed?.revision ?? 0,
    current: () => owner.current && auth.isAuthGenerationCurrent(generation),
    save: (data) =>
      curriculumCommand("save_draft", {
        ...scope,
        locale,
        version: delivery.version,
        section: section.id,
        attemptId: attempt,
        ...data,
      }),
  });
  const submission = draft.values;
  const setSubmission = draft.setValues;
  const interactive = ["questions", "exam", "mission", "practice"].includes(section.kind);
  const completed = delivery.events.some((x) => x.section === section.id && x.completed);
  const pending = delivery.events.some(
    (x) => x.section === section.id && x.result?.state === "awaiting_review",
  );
  // Inputs are editable before an attempt exists. Untimed activities create their
  // attempt only inside the submit handler (start → submit), never on view.
  const timed = section.durationMinutes !== undefined;
  const restore = useRef<ActivityValues | null>(null);
  useEffect(() => {
    // Runs after the draft hook re-seeds for a new attempt: keep the learner's input
    // and mark it dirty so it syncs to the new attempt's cloud draft.
    if (attempt && restore.current) {
      const values = restore.current;
      restore.current = null;
      setSubmission(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setter identity changes each render; only a new attempt matters.
  }, [attempt]);
  type Reply = {
    attemptId?: string;
    state: string;
    score?: number;
    total?: number;
    draft?: ActivityValues;
    revision?: number;
  };
  async function send(action: "start" | "submit" | "complete", params: object) {
    const known = requests.current[action];
    if (!known || JSON.stringify(known.data) !== JSON.stringify(params))
      requests.current[action] = { data: params, requestId: crypto.randomUUID() };
    const r = await curriculumCommand<Reply>(action, {
      ...params,
      requestId: requests.current[action]!.requestId,
    });
    delete requests.current[action];
    return r;
  }
  async function perform(action: "start" | "submit" | "complete") {
    if (running.current) return;
    const generation = auth.authGeneration;
    const valid = () => owner.current && auth.isAuthGenerationCurrent(generation);
    running.current = true;
    setBusy(true);
    setError(false);
    const base = { ...scope, locale, version: delivery.version, section: section.id };
    const values = submission;
    try {
      let id = attempt;
      if (action === "submit" && !id) {
        const started = await send("start", base);
        if (!valid()) return;
        if (!started.attemptId) throw new Error("CURRICULUM_ATTEMPT_MISSING");
        id = started.attemptId;
        restore.current = values;
        setCreated({ draft: started.draft ?? {}, revision: started.revision ?? 0 });
        setAttempt(id);
      }
      const r = await send(
        action,
        action === "submit" ? { ...base, attemptId: id, submission: values } : base,
      );
      if (!valid()) return;
      if (action === "start" && r.attemptId) {
        setCreated({ draft: r.draft ?? {}, revision: r.revision ?? 0 });
        setAttempt(r.attemptId);
      }
      setResult(r);
      if (action !== "start") {
        restore.current = null;
        if (id) closedAttempts.current.add(id);
        draft.clear();
        setAttempt(null);
      }
      await client.invalidateQueries({ queryKey: ["curriculum-lesson"] });
      await client.invalidateQueries({ queryKey: ["learning-records"] });
    } catch {
      if (valid()) setError(true);
    } finally {
      running.current = false;
      if (valid()) setBusy(false);
    }
  }
  const a = getAcademicCopy(locale);
  const actionLabel = !interactive
    ? completed
      ? `✓ ${c.saved}`
      : section.kind === "explanation"
        ? a.markRead
        : c.complete
    : timed && !attempt
      ? c.start
      : section.kind === "questions" || section.kind === "exam"
        ? a.submit
        : a.save;
  const locked = busy || (timed && !attempt);
  // Optional reading/media sections carry no completion control (as in AC-BUS);
  // required ones keep their explicit completion so progress stays reachable.
  if (!interactive && !section.required) return null;
  return (
    <div className="space-y-4">
      {interactive && (
        <ActivityForm
          section={section}
          values={submission}
          disabled={locked}
          locale={locale}
          onChange={(id, value) => setSubmission((prev) => ({ ...prev, [id]: value }))}
        />
      )}
      {attempt && (
        <div role="status" className="text-sm text-muted-foreground">
          {draft.state === "saved"
            ? c.draftSaved
            : draft.state === "saving" || draft.state === "dirty"
              ? c.draftSaving
              : draft.state === "conflict"
                ? c.draftConflict
                : c.draftUnconfirmed}
          {draft.state === "conflict" && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={draft.useCloud}>
                {c.useCloud}
              </Button>
              <Button variant="outline" onClick={draft.saveMine}>
                {c.saveMine}
              </Button>
            </div>
          )}
          {draft.state === "unconfirmed" && (
            <Button variant="outline" onClick={() => void draft.retry()}>
              {c.retry}
            </Button>
          )}
        </div>
      )}
      <Button
        disabled={busy || draft.state === "conflict"}
        onClick={() => perform(!interactive ? "complete" : timed && !attempt ? "start" : "submit")}
      >
        {actionLabel}
      </Button>
      {(result?.state === "awaiting_review" || pending) && <p role="status">{c.pending}</p>}
      {result?.score !== undefined && (
        <p role="status">
          {c.result}: {result.score} / {result.total}
        </p>
      )}
      {completed && interactive && <p role="status">✓ {c.saved}</p>}
      {error && <p role="alert">{c.error}</p>}
    </div>
  );
}
