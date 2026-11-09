import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { learningCommand } from "@/lib/learning/client";
import type { CourseRecord, LearningScope } from "@/lib/learning/contracts";
import { learningCopy } from "@/lib/learning/copy";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { curriculumPosition } from "@/lib/course-system/intake/functions";
import { useOwnedIntakeRead } from "@/lib/course-system/intake/use-journey";
import type { SupportedLocale } from "@/lib/locale/types";

type AdmittedPosition = { recordId: string; contentVersion: string; locale: SupportedLocale };
export function LearningReadingPosition({
  scope,
  admitted,
  onContentChanged,
}: {
  scope: LearningScope;
  admitted?: AdmittedPosition;
  onContentChanged?: () => void;
}) {
  return admitted ? (
    <AdmittedReadingPosition
      scope={scope}
      delivery={admitted}
      onContentChanged={onContentChanged}
    />
  ) : (
    <LegacyReadingPosition scope={scope} />
  );
}

function AdmittedReadingPosition({
  scope,
  delivery,
  onContentChanged,
}: {
  scope: LearningScope;
  delivery: AdmittedPosition;
  onContentChanged?: () => void;
}) {
  const auth = useAuth();
  const client = useQueryClient();
  const command = useServerFn(curriculumPosition);
  const c = learningCopy(delivery.locale);
  const key = JSON.stringify([
    auth.user?.id,
    scope.area,
    scope.course,
    scope.profileId ?? null,
    delivery.recordId,
    scope.lesson,
    delivery.locale,
    delivery.contentVersion,
  ]);
  const localKey = `learning-position:curriculum:v2:${key}`;
  const selected = useRef<{
    key: string;
    actor: string | undefined;
    client: typeof client;
    generation: typeof auth.authGeneration;
    loading: boolean;
  } | null>(null);
  if (
    !selected.current ||
    selected.current.key !== key ||
    selected.current.generation !== auth.authGeneration ||
    selected.current.loading !== auth.loading ||
    selected.current.client !== client
  ) {
    selected.current = {
      key,
      actor: auth.user?.id,
      client,
      generation: auth.authGeneration,
      loading: auth.loading,
    };
  }
  const frame = selected.current;
  const latest = useRef({ auth, frame, onContentChanged });
  latest.current = { auth, frame, onContentChanged };
  const [hidden, setHidden] = useState<object | null>(null);
  const [failure, setFailure] = useState<object | null>(null);
  const disabled = useRef<object | null>(null);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = () =>
    mounted.current &&
    latest.current.frame === frame &&
    !latest.current.auth.loading &&
    !!frame.actor &&
    latest.current.auth.user?.id === frame.actor &&
    latest.current.auth.authGeneration === frame.generation &&
    latest.current.auth.isAuthGenerationCurrent(frame.generation);
  const args = {
    recordId: delivery.recordId,
    lesson: scope.lesson,
    locale: delivery.locale,
    contentVersion: delivery.contentVersion,
  };
  const position = useOwnedIntakeRead(key, (actor) =>
    command({ data: { ...args, action: "position", expectedAccountId: actor } }),
  );
  useEffect(() => {
    if (!position.error || !current()) return;
    if (
      position.error instanceof Error &&
      position.error.message.includes("CURRICULUM_CONTENT_CHANGED")
    ) {
      disabled.current = frame;
      latest.current.onContentChanged?.();
    }
  }, [position.error, frame]);
  useEffect(() => {
    let active = true,
      inFlight = false;
    let pending: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const owns = () => active && current() && disabled.current !== frame;
    const flush = async () => {
      if (!owns() || inFlight || pending === null) return;
      const ratio = pending;
      pending = null;
      inFlight = true;
      let confirmed = false;
      try {
        const expectedAccountId = latest.current.auth.user!.id;
        if (!owns()) return;
        await command({ data: { ...args, action: "save_position", expectedAccountId, ratio } });
        if (!owns()) return;
        confirmed = true;
        setFailure((previous) => (owns() ? null : previous));
        if (pending === null) {
          try {
            localStorage.removeItem(localKey);
          } catch {
            /* optional cache */
          }
        }
      } catch (error) {
        if (!owns()) return;
        if (error instanceof Error && error.message.includes("CURRICULUM_CONTENT_CHANGED")) {
          pending = null;
          disabled.current = frame;
          // Keep the original version key; never relabel an unsent ratio.
          latest.current.onContentChanged?.();
        } else {
          if (pending === null) pending = ratio;
          setFailure((previous) => (owns() ? frame : previous));
        }
      } finally {
        inFlight = false;
        if (confirmed && owns() && pending !== null) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            void flush();
          }, 1200);
        }
      }
    };
    const scroll = () => {
      if (!owns()) return;
      pending = Math.max(
        0,
        Math.min(
          1,
          window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
        ),
      );
      try {
        localStorage.setItem(localKey, String(pending));
      } catch {
        /* optional cache */
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        void flush();
      }, 1200);
    };
    const online = () => {
      if (owns()) void flush();
    };
    try {
      const raw = localStorage.getItem(localKey);
      if (
        raw !== null &&
        raw.trim() !== "" &&
        Number.isFinite(Number(raw)) &&
        Number(raw) >= 0 &&
        Number(raw) <= 1
      )
        pending = Number(raw);
    } catch {
      /* optional cache */
    }
    queueMicrotask(() => {
      if (owns()) void flush();
    });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("online", online);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("online", online);
    };
  }, [frame]);
  const saved = position.data;
  const ratio =
    saved && "ratio" in saved && saved.contentVersion === delivery.contentVersion
      ? saved.ratio
      : undefined;
  if (!current()) return null;
  return (
    <>
      {(position.isError || failure === frame) && <p role="alert">{c.load}</p>}
      {hidden !== frame &&
        typeof ratio === "number" &&
        ratio > 0.02 &&
        disabled.current !== frame && (
          <div className="my-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!current() || disabled.current === frame) return;
                window.scrollTo({
                  top:
                    ratio * Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
                  behavior: "smooth",
                });
                setHidden(frame);
              }}
            >
              {c.restore}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (current()) setHidden(frame);
              }}
            >
              {c.reset}
            </Button>
          </div>
        )}
    </>
  );
}

function LegacyReadingPosition({ scope }: { scope: LearningScope }) {
  const auth = useAuth();
  const { locale } = useLocale();
  const c = learningCopy(locale);
  const subject = scope.profileId ?? auth.user?.id;
  const records = useQuery({
    queryKey: ["learning-records", auth.user?.id, locale],
    enabled: !!auth.user && !auth.loading,
    queryFn: () => learningCommand<CourseRecord[]>("records", { locale }),
  });
  const record = records.data?.find(
    (r) => r.subject_id === subject && r.area === scope.area && r.course === scope.course,
  );
  const key = JSON.stringify([auth.user?.id, record?.id, scope.lesson, locale]);
  const localKey = `learning-position:v1:${key}`;
  const generation = auth.authGeneration;
  const recordId = record?.id;
  const loading = auth.loading;
  const isCurrentGeneration = auth.isAuthGenerationCurrent;
  const current = useRef({ key, generation });
  current.current = { key, generation };
  const [hidden, setHidden] = useState<string | null>(null);
  const position = useQuery({
    queryKey: ["learning-position", key],
    enabled: !!record && !auth.loading,
    queryFn: () =>
      learningCommand<{ ratio?: number }>("position", {
        recordId: record!.id,
        lesson: scope.lesson,
        locale,
      }),
  });
  useEffect(() => {
    if (!recordId || loading) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: number | null = null;
    let inFlight = false;
    const owns = () =>
      current.current.key === key &&
      current.current.generation === generation &&
      isCurrentGeneration(generation);
    const flush = async () => {
      if (!owns() || inFlight || pending === null) return;
      const ratio = pending;
      pending = null;
      inFlight = true;
      try {
        await learningCommand("save_position", {
          recordId,
          lesson: scope.lesson,
          locale,
          ratio,
        });
        if (owns() && pending === null) localStorage.removeItem(localKey);
      } catch {
        if (owns() && pending === null) pending = ratio;
      } finally {
        inFlight = false;
      }
    };
    const scroll = () => {
      if (!owns()) return;
      pending = Math.max(
        0,
        Math.min(
          1,
          window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
        ),
      );
      try {
        localStorage.setItem(localKey, String(pending));
      } catch {
        /* Cloud confirmation remains authoritative. */
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        void flush();
      }, 1200);
    };
    const online = () => {
      void flush();
    };
    try {
      const raw = localStorage.getItem(localKey);
      if (raw !== null) {
        const ratio = Number(raw);
        if (Number.isFinite(ratio) && ratio >= 0 && ratio <= 1) pending = ratio;
      }
    } catch {
      /* Optional local continuity. */
    }
    void flush();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("online", online);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("online", online);
    };
  }, [recordId, key, generation, loading, isCurrentGeneration, locale, scope.lesson, localKey]);
  const ratio = position.data?.ratio;
  if (!auth.user || auth.loading || hidden === key || typeof ratio !== "number" || ratio <= 0.02)
    return null;
  return (
    <div className="my-3 flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          window.scrollTo({
            top: ratio * Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
            behavior: "smooth",
          });
          setHidden(key);
        }}
      >
        {c.restore}
      </Button>
      <Button variant="ghost" onClick={() => setHidden(key)}>
        {c.reset}
      </Button>
    </div>
  );
}
