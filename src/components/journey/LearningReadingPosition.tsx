import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { learningCommand } from "@/lib/learning/client";
import type { CourseRecord, LearningScope } from "@/lib/learning/contracts";
import { learningCopy } from "@/lib/learning/copy";
import { Button } from "@/components/ui/button";
export function LearningReadingPosition({ scope }: { scope: LearningScope }) {
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
