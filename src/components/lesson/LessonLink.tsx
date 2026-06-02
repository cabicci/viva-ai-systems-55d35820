import * as React from "react";
import { Link } from "@tanstack/react-router";
import { getLessonHref } from "@/lib/builder-runtime";

/**
 * Renders a TanStack Link to the unified lesson page
 * `/learn/{pathId}/{lessonId}` based on the curriculum lesson's `route`.
 */
export function LessonLink({
  lesson,
  className,
  children,
  from,
}: {
  lesson: { id: string; route?: string };
  className?: string;
  children: React.ReactNode;
  from?: "dashboard" | "curriculum";
}) {
  const href = getLessonHref(lesson);
  if (href.kind === "learn") {
    return (
      <Link
        to="/learn/$pathId/$lessonId"
        params={{ pathId: href.pathId, lessonId: href.lessonId }}
        search={from ? { from } : undefined}
        className={className}
      >
        {children}
      </Link>
    );
  }
  // Fallback: lesson not shipped yet → send to the curriculum map.
  return (
    <Link to="/curriculum" className={className}>
      {children}
    </Link>
  );
}
