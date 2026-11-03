import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getLessonAssistantAccess } from "@/lib/lesson-assistant-access.functions";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

const generationKeys = new WeakMap<object, number>();
let nextGenerationKey = 0;
function generationKey(generation: object): number {
  let key = generationKeys.get(generation);
  if (key === undefined) { key = ++nextGenerationKey; generationKeys.set(generation, key); }
  return key;
}

export function LessonAssistantAccess({ pathId, lessonId, locale, children }: {
  pathId: string; lessonId: string; locale: SupportedLocale; children: ReactNode;
}) {
  const auth = useAuth(), generation = auth.authGeneration;
  const live = () => !auth.loading && !!auth.user?.id && auth.isAuthGenerationCurrent(generation);
  const query = useQuery({
    queryKey: ["lesson-assistant-access", auth.user?.id, pathId, lessonId, locale, generationKey(generation)],
    enabled: live(), retry: false, staleTime: 0, gcTime: 0, structuralSharing: false,
    queryFn: async () => {
      if (!live()) throw new Error("retired access check");
      const decision = await getLessonAssistantAccess({ data: { pathId, lessonId } });
      if (!live()) throw new Error("retired access check");
      return { decision, owner: generation };
    },
  });
  const current = live() && query.data?.owner === generation;
  const decision = current ? query.data?.decision : undefined;
  if (decision?.state === "allowed") return <>{children}</>;
  if (query.isPending || (!current && !query.isError))
    return <p role="status">{getUiString(locale, "assistant.panel.context.loading")}</p>;
  const key = decision?.state === "unauthenticated" ? "assistant.panel.error.auth"
    : decision?.state === "denied" ? decision.reason === "quota" ? "assistant.panel.error.quota" : "assistant.panel.error.access"
    : "assistant.panel.error.connection";
  return <div className="space-y-3"><p role="alert">{getUiString(locale, key)}</p>
    <button type="button" className="underline" onClick={() => void query.refetch()}>
      {locale === "en" ? "Check again" : "إعادة التحقق"}
    </button></div>;
}
