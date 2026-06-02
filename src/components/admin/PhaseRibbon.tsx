import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ChevronLeft } from "lucide-react";
import { useEntitlement } from "@/lib/entitlements";
import { getRoadmapPhaseStats, type RoadmapPhase } from "@/lib/roadmap.functions";

const PHASE_LABELS: Record<RoadmapPhase, string> = {
  A: "Phase A — Mission System Core",
  B: "Phase B — ملء الـ Missions الباقية",
  C: "Phase C — Future / أفكار",
  D: "Phase D — مؤجل بعد الـ beta",
  inbox: "Inbox — بنود متصنفتش",
};

/**
 * Admin-only ribbon that surfaces the current active phase + done/total
 * counts above pages like /admin, /dashboard, /roadmap. Clicking it
 * takes you to /roadmap.
 *
 * The "current phase" is the first one with in_progress items,
 * else the first with todo items. Cached 5 minutes.
 */
export function PhaseRibbon() {
  const { isAdmin, isLoaded } = useEntitlement();
  const fetchStats = useServerFn(getRoadmapPhaseStats);
  const { data } = useQuery({
    queryKey: ["roadmap-phase-stats"],
    queryFn: () => fetchStats(),
    staleTime: 5 * 60 * 1000,
    enabled: isLoaded && isAdmin,
  });

  if (!isLoaded || !isAdmin || !data) return null;

  const stat = data.stats[data.currentPhase];
  const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;

  return (
    <Link
      to="/roadmap"
      dir="rtl"
      className="block w-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-b border-primary/20 hover:from-primary/15 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 text-xs md:text-sm">
        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-medium text-foreground truncate">
          {PHASE_LABELS[data.currentPhase]}
        </span>
        <span className="font-mono text-muted-foreground shrink-0">
          {stat.done}/{stat.total}
          {pct > 0 && <span className="ms-1 text-primary/70">({pct}%)</span>}
        </span>
        {stat.in_progress > 0 && (
          <span className="hidden md:inline px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium shrink-0">
            {stat.in_progress} شغّال
          </span>
        )}
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground ms-auto shrink-0" />
      </div>
    </Link>
  );
}