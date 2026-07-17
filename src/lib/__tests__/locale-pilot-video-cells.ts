import type { SupportedLocale } from "@/lib/locale/types";

/** Historical pilot-era Bunny GUID captured at successful locale pilot completion. */
export type HistoricalPilotVideoCell = {
  lessonId: string;
  locale: SupportedLocale;
  /** Pilot-era GUID preserved for audit; not the active production registry mapping. */
  historicalPilotGuid: string;
};

/**
 * Six successful locale-aware pilot cells (lessonId | locale | historical pilot GUID).
 * Historical inventory only — active learner mappings are authoritative in bunny-videos.ts.
 */
export const PILOT_VIDEO_CELLS: readonly HistoricalPilotVideoCell[] = [
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "ar-MSA",
    historicalPilotGuid: "ec795bb3-018d-4642-908a-ec86a842175f",
  },
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "ar-Gulf",
    historicalPilotGuid: "5c44ca7d-814a-4eea-a03a-81692942458f",
  },
  {
    lessonId: "analyst-m3-l2-ai-summarization",
    locale: "en",
    historicalPilotGuid: "7a08de3d-6997-412e-834e-54906b65896f",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "ar-MSA",
    historicalPilotGuid: "1b6a5491-8e93-4ed6-b3a8-08744cd26546",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "ar-Gulf",
    historicalPilotGuid: "4eec6df1-cc3f-4d68-ab65-13361880bcfd",
  },
  {
    lessonId: "intro-m1-l4-ai-can-cannot",
    locale: "en",
    historicalPilotGuid: "0605d5f9-623f-4b90-9a43-307e1fcdd8e7",
  },
] as const;
