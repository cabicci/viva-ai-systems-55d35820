import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import {
  useActivityDraft,
  type ActivityValues,
} from "@/lib/course-system/intake/use-activity-draft";
import { useLocale } from "@/lib/locale/locale-context";
import { COURSE_AREAS } from "@/lib/course-system/contract";
import { curriculumCatalogue, curriculumCommand } from "@/lib/course-system/intake/client";
import { askCurriculumAssistant, curriculumAsset } from "@/lib/course-system/intake/functions";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { useKidsParentStateSource } from "@/lib/kids/parent-state";
import {
  CurriculumContent,
  type LessonContent,
} from "@/components/course-intake/CurriculumContent";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { LearningLessonNotes } from "@/components/journey/LearningLessonNotes";
import { LearningReadingPosition } from "@/components/journey/LearningReadingPosition";
import { AssistantConversationPanel } from "@/components/assistant/AssistantConversationPanel";
import { FloatingAssistantLauncher } from "@/components/learn/FloatingAssistantLauncher";
import { getUiString } from "@/lib/locale/ui-strings";
import { Button } from "@/components/ui/button";
import type { IntakeSection } from "@/lib/course-system/intake/package";

export const Route = createFileRoute("/courses/$area/$courseId")({
  params: {
    parse: (p) => ({
      area: z.enum(COURSE_AREAS).parse(p.area),
      courseId: z
        .string()
        .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/)
        .parse(p.courseId),
    }),
  },
  validateSearch: z.object({
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]).optional(),
    lesson: z.string().max(80).optional(),
    profileId: z.string().uuid().optional(),
  }),
  head: () => ({ meta: [{ title: "Masaarat — Learning" }] }),
  component: NewCurriculumPage,
});
type Delivery = {
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
function NewCurriculumPage() {
  const { area, courseId } = Route.useParams();
  const search = Route.useSearch();
  const auth = useAuth();
  const entitlement = useEntitlement();
  const { locale } = useLocale();
  const c = intakeCopy(locale);
  const parent = useKidsParentStateSource();
  const [chosen, choose] = useState(search.lesson ?? "");
  const [sectionId, selectSection] = useState("");
  const [child, setChild] = useState(search.profileId ?? "");
  const catalogue = useQuery({
    queryKey: ["added-curricula", area, locale],
    queryFn: () => curriculumCatalogue(area, locale),
  });
  const course = catalogue.data?.find((x) => x.id === courseId);
  const step =
    course?.stations.flatMap((s) => s.steps).find((s) => s.id === chosen) ??
    course?.stations[0].steps[0];
  const profileId =
    area === "kids" &&
    entitlement.isAdmin &&
    auth.user &&
    (child === auth.user.id || (!child && parent.profiles.length === 0))
      ? auth.user.id
      : area === "kids"
        ? (parent.profiles.find((p) => p.id === child)?.id ?? parent.profiles[0]?.id)
        : undefined;
  const scope = {
    area,
    course: courseId,
    lesson: step?.id ?? "",
    ...(profileId ? { profileId } : {}),
  };
  const key = JSON.stringify([
    auth.user?.id,
    auth.authGeneration.value,
    area,
    courseId,
    scope.lesson,
    locale,
    profileId,
  ]);
  const delivery = useQuery({
    queryKey: ["curriculum-lesson", key],
    enabled: !!auth.user && !auth.loading && !!step && (area !== "kids" || !!profileId),
    queryFn: () => curriculumCommand<Delivery>("lesson", { ...scope, locale }),
    retry: false,
    refetchInterval: 30000,
    staleTime: 0,
  });
  const visible = !!auth.user && !auth.loading && !delivery.isError ? delivery.data : undefined;
  useEffect(() => {
    selectSection("");
  }, [key]);
  return (
    <CurriculumLayout line={area} title={course?.title} subtitle={c.stations}>
      {catalogue.isPending && <p>{c.loading}</p>}
      {catalogue.isError && <p role="alert">{c.error}</p>}
      {area === "kids" && (
        <label>
          {c.child}
          <select value={profileId ?? ""} onChange={(e) => setChild(e.target.value)}>
            {entitlement.isAdmin && auth.user && (
              <option value={auth.user.id}>{c.adminReview}</option>
            )}
            {parent.profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </label>
      )}
      <nav aria-label={c.stations} className="mb-8 space-y-4">
        {course?.stations.map((station) => (
          <div key={station.id}>
            <h2 className="mb-2 text-lg font-bold">{station.title}</h2>
            <div className="flex flex-wrap gap-2">
              {station.steps.map((s) => (
                <Button
                  key={s.id}
                  variant={step?.id === s.id ? "default" : "outline"}
                  onClick={() => {
                    choose(s.id);
                    selectSection("");
                  }}
                >
                  {visible?.progress.find((p) => p.lesson === s.id)?.done ? "✓ " : ""}
                  {s.title}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {course && !visible && !delivery.isFetching && (
        <p>
          {c.locked}{" "}
          <a className="text-primary underline" href={`/pricing?locale=${locale}`}>
            {c.packages}
          </a>
        </p>
      )}
      {!course && catalogue.isSuccess && <p>{c.courseUnavailable}</p>}
      {delivery.isPending && delivery.isFetching && <p role="status">{c.loading}</p>}
      {visible && step && (
        <LearnerStep
          key={`${key}:${visible.version}`}
          delivery={visible}
          scope={scope}
          sectionId={sectionId}
          selectSection={selectSection}
        />
      )}
    </CurriculumLayout>
  );
}
function LearnerStep({
  delivery,
  scope,
  sectionId,
  selectSection,
}: {
  delivery: Delivery;
  scope: {
    area: (typeof COURSE_AREAS)[number];
    course: string;
    lesson: string;
    profileId?: string;
  };
  sectionId: string;
  selectSection(id: string): void;
}) {
  const { locale } = useLocale();
  const c = intakeCopy(locale);
  const auth = useAuth();
  const ask = useServerFn(askCurriculumAssistant);
  const assetLink = useServerFn(curriculumAsset);
  const section =
    delivery.lesson.sections.find((x) => x.id === sectionId) ?? delivery.lesson.sections[0];
  const assistantScope = {
    admitted: true as const,
    area: scope.area,
    cardId: scope.course,
    stepId: scope.lesson,
    locale,
    ...(scope.profileId ? { profileId: scope.profileId } : {}),
  };
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{delivery.lesson.title}</h1>
      {!delivery.reviewOnly && <LearningReadingPosition scope={scope} />}
      <CurriculumContent
        lesson={delivery.lesson}
        resolveAsset={async (asset) => {
          if (!auth.user) throw new Error("CURRICULUM_ACCOUNT_REQUIRED");
          const generation = auth.authGeneration;
          const result = await assetLink({
            data: {
              ...scope,
              locale,
              asset,
              version: delivery.version,
              expectedAccountId: auth.user.id,
            },
          });
          if (!auth.isAuthGenerationCurrent(generation))
            throw new Error("CURRICULUM_ACCOUNT_CHANGED");
          return result.url;
        }}
        selected={section.id}
        onSelect={selectSection}
        locale={locale}
      >
        {!delivery.reviewOnly && (
          <Activity key={section.id} section={section} delivery={delivery} scope={scope} />
        )}
      </CurriculumContent>
      {!delivery.reviewOnly && <LearningLessonNotes scope={scope} />}
      <FloatingAssistantLauncher
        fabLabel={getUiString(locale, "learn.assistant.fab")}
        fabAriaLabel={getUiString(locale, "learn.assistant.fabAria")}
        panelTitle={getUiString(locale, "sidebar.assistant")}
      >
        <AssistantConversationPanel
          accountId={auth.user?.id}
          scope={assistantScope}
          compact
          ask={async ({ query, requestId, history }) => {
            if (!auth.user?.id) return { status: 401 };
            const result = await ask({
              data: {
                ...scope,
                locale,
                query,
                requestId,
                history,
                expectedAccountId: auth.user.id,
              },
            });
            return result;
          }}
        />
      </FloatingAssistantLauncher>
      <a href={`/my-learning?locale=${locale}`} className="text-primary underline">
        {c.record}
      </a>
    </div>
  );
}
function Activity({
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
  const request = useRef<{ action: string; data: object; requestId: string } | null>(null);
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
  async function perform(action: "start" | "submit" | "complete") {
    if (running.current) return;
    const generation = auth.authGeneration;
    const valid = () => owner.current && auth.isAuthGenerationCurrent(generation);
    running.current = true;
    setBusy(true);
    setError(false);
    const params = {
      ...scope,
      locale,
      version: delivery.version,
      section: section.id,
      ...(action === "submit" ? { attemptId: attempt, submission } : {}),
    };
    if (
      !request.current ||
      request.current.action !== action ||
      JSON.stringify(request.current.data) !== JSON.stringify(params)
    )
      request.current = { action, data: params, requestId: crypto.randomUUID() };
    try {
      const r = await curriculumCommand<{
        attemptId?: string;
        state: string;
        score?: number;
        total?: number;
        draft?: ActivityValues;
        revision?: number;
      }>(action, { ...params, requestId: request.current.requestId });
      if (!valid()) return;
      if (r.attemptId) {
        setCreated({ draft: r.draft ?? {}, revision: r.revision ?? 0 });
        setAttempt(r.attemptId);
      }
      setResult(r);
      request.current = null;
      if (action !== "start") {
        if (attempt) closedAttempts.current.add(attempt);
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
  return (
    <div className="space-y-4">
      {section.questions.map((q) => (
        <fieldset key={q.id} className="space-y-3" disabled={!attempt || busy}>
          <legend className="font-bold">{q.prompt}</legend>
          {q.options.map((option, i) => (
            <label key={i} className="flex min-h-11 gap-3">
              <input
                type="radio"
                name={`${section.id}-${q.id}`}
                checked={submission[q.id] === i}
                onChange={() => setSubmission((prev) => ({ ...prev, [q.id]: i }))}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ))}
      {section.fields.map((f) => (
        <label key={f.id} className="block">
          {f.label}
          <textarea
            disabled={!attempt || busy}
            className="mt-2 block min-h-28 w-full rounded-lg border bg-background p-3"
            value={submission[f.id] ?? ""}
            maxLength={5000}
            onChange={(e) => setSubmission((prev) => ({ ...prev, [f.id]: e.target.value }))}
          />
        </label>
      ))}
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
        onClick={() => perform(!interactive ? "complete" : attempt ? "submit" : "start")}
      >
        {!interactive ? (completed ? `✓ ${c.saved}` : c.complete) : attempt ? c.submit : c.start}
      </Button>
      {(result?.state === "awaiting_review" || pending) && <p role="status">{c.pending}</p>}
      {result?.score !== undefined && (
        <p role="status">
          {c.result}: {result.score} / {result.total}
        </p>
      )}
      {completed && <p role="status">✓ {c.saved}</p>}
      {error && <p role="alert">{c.error}</p>}
    </div>
  );
}
