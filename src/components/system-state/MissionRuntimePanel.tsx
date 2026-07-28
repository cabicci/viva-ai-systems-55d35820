import { Target as TargetIcon } from "lucide-react";
import { useMissionRuntime } from "@/lib/mission-runtime";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { Section, StatusPill, Stat } from "./primitives";

export function MissionRuntimePanel() {
  const t = useUiString();
  const mr = useMissionRuntime();
  return (
    <Section
      no="00"
      icon={TargetIcon}
      label={t("systemState.missionRuntime.label")}
      title={t("systemState.missionRuntime.title")}
    >
      <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            {t("systemState.missionRuntime.bodyBefore")}{" "}
            <code className="font-mono text-primary">useMissionRuntime()</code>{" "}
            {t("systemState.missionRuntime.bodyAfter")}
          </p>
          <StatusPill status="partial" />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label={t("systemState.missionRuntime.total")} value={String(mr.total)} />
          <Stat
            label={t("systemState.missionRuntime.connected")}
            value={String(mr.liveMissions.length)}
          />
          <Stat
            label={t("systemState.missionRuntime.persisted")}
            value={mr.isPersisted ? t("systemState.yes") : t("systemState.no")}
          />
        </div>

        <div className="rounded-lg border border-border/40 p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
            {t("systemState.missionRuntime.currentLabel")}
          </p>
          {mr.currentMission ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">
                  {mr.currentMission.missionTitle}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  · {mr.currentMission.moduleTitle}
                </span>
                <code className="font-mono text-[10px] text-muted-foreground">
                  {mr.currentMission.missionId}
                </code>
              </div>
              {mr.currentMission.missionDescription && (
                <p className="text-sm text-muted-foreground leading-loose whitespace-pre-line">
                  {mr.currentMission.missionDescription}
                </p>
              )}
              {mr.currentMission.missionSteps.length > 0 && (
                <ul className="text-sm text-muted-foreground list-disc ps-5 space-y-1">
                  {mr.currentMission.missionSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("systemState.missionRuntime.empty")}</p>
          )}
        </div>

        <div className="rounded-lg border border-border/40 p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
            {t("systemState.missionRuntime.allLabel").replace(
              "{count}",
              String(mr.missions.length),
            )}
          </p>
          <div className="space-y-2">
            {mr.missions.map((m) => (
              <div
                key={m.missionId}
                className="rounded-md border border-border/30 p-3 grid md:grid-cols-[1fr_auto] gap-2 items-start"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{m.missionTitle}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.lessonTitle} · {m.moduleTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[10px] text-muted-foreground">{m.missionId}</code>
                  <StatusPill status="placeholder" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-destructive/25 p-3 text-xs text-foreground/90 leading-loose bg-destructive/5">
          <span className="font-bold">{t("systemState.missionRuntime.noteLabel")}</span>
          {t("systemState.missionRuntime.noteBody")}
        </div>
      </div>
    </Section>
  );
}
