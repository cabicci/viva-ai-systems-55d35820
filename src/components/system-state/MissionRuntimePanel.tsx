import { Target as TargetIcon } from "lucide-react";
import { useMissionRuntime } from "@/lib/mission-runtime";
import { Section, StatusPill, Stat } from "./primitives";

export function MissionRuntimePanel() {
  const mr = useMissionRuntime();
  return (
    <Section
      no="00"
      icon={TargetIcon}
      label="MISSION RUNTIME FOUNDATION"
      title="Mission Runtime Foundation"
    >
      <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            مخرجات{" "}
            <code className="font-mono text-primary">useMissionRuntime()</code>{" "}
            — استخراج المهام من الدروس الحية ككيانات مستقلة، بدون أي تخزين أو
            تأثير على إكمال الدرس الحالي.
          </p>
          <StatusPill status="partial" />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Total Missions" value={String(mr.total)} />
          <Stat
            label="Connected to Live Lessons"
            value={String(mr.liveMissions.length)}
          />
          <Stat label="Persisted" value={mr.isPersisted ? "yes" : "no"} />
        </div>

        <div className="rounded-lg border border-border/40 p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-2">
            CURRENT LESSON MISSION
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
                <ul className="text-sm text-muted-foreground list-disc pr-5 space-y-1">
                  {mr.currentMission.missionSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              لا يوجد درس حالي مفتوح — افتح أي درس لاستعراض مهمته هنا.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border/40 p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3">
            ALL MISSIONS · {mr.missions.length}
          </p>
          <div className="space-y-2">
            {mr.missions.map((m) => (
              <div
                key={m.missionId}
                className="rounded-md border border-border/30 p-3 grid md:grid-cols-[1fr_auto] gap-2 items-start"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {m.missionTitle}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.lessonTitle} · {m.moduleTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[10px] text-muted-foreground">
                    {m.missionId}
                  </code>
                  <StatusPill status="placeholder" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-destructive/25 p-3 text-xs text-foreground/90 leading-loose bg-destructive/5">
          <span className="font-bold">Note: </span>
          Mission tracking is not persisted yet — كل المهام تظهر بحالة{" "}
          <code className="font-mono">not-started</code> ولا يتم حفظها في
          الـ Database.
        </div>
      </div>
    </Section>
  );
}