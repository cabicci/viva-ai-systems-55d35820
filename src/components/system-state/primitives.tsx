import { CheckCircle2, Circle, type LucideIcon } from "lucide-react";
import type { Status } from "./types";

export function StatusPill({ status }: { status: Status }) {
  const map = {
    live: { label: "LIVE", cls: "bg-accent/15 text-accent border-accent/30" },
    partial: {
      label: "PARTIAL",
      cls: "bg-primary/15 text-primary border-primary/30",
    },
    placeholder: {
      label: "PLACEHOLDER",
      cls: "bg-muted/40 text-muted-foreground border-border/40",
    },
  } as const;
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${m.cls}`}
    >
      {status === "live" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      {m.label}
    </span>
  );
}

export function Section({
  no,
  icon: Icon,
  label,
  title,
  children,
}: {
  no: string;
  icon: LucideIcon;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[11px] tracking-widest text-primary">
          {no}
        </span>
        <span className="h-px flex-1 bg-border/40" />
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </span>
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 border border-border/40">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-black text-foreground mt-1">{value}</p>
    </div>
  );
}

export function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-xl p-5 border border-border/40">
      <p className="font-bold text-foreground text-sm mb-2">{title}</p>
      <p className="text-xs text-muted-foreground leading-loose">{body}</p>
    </div>
  );
}

export function AIRow({
  title,
  body,
  status,
}: {
  title: string;
  body: string;
  status: Status;
}) {
  return (
    <div className="glass rounded-xl p-5 border border-border/40">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-bold text-foreground text-sm">{title}</p>
        <StatusPill status={status} />
      </div>
      <p className="text-xs text-muted-foreground leading-loose">{body}</p>
    </div>
  );
}

export function CompRow({
  area,
  files,
  items,
}: {
  area: string;
  files: string;
  items: string;
}) {
  return (
    <div className="glass rounded-xl p-5 border border-border/40">
      <p className="font-bold text-foreground text-sm mb-1">{area}</p>
      <code className="font-mono text-[11px] text-primary block mb-2">
        {files}
      </code>
      <p className="text-xs text-muted-foreground leading-loose">{items}</p>
    </div>
  );
}

export function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/40 p-3 bg-background/40">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground/90 break-words font-mono">
        {value ?? <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}