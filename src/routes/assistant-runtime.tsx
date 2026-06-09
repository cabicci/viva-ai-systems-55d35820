import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Activity,
  Brain,
  Search as SearchIcon,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronDown,
  ShieldAlert,
  Database,
} from "lucide-react";
import { useLearnerContext } from "@/lib/learner-context";
import {
  usePlatformRetrieval,
  RETRIEVAL_CORPUS_SIZE,
} from "@/lib/platform-retrieval";
import {
  callAssistantRuntime,
  type AssistantRuntimeResponsePayload,
} from "@/lib/assistant-runtime";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import {
  previewAssistantSeed,
  runAssistantSeed,
  SEED_CONFIRMATION_TEXT,
  type SeedReport,
} from "@/lib/assistant-seed.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/assistant-runtime")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "Assistant Runtime — AI Ecosystem" },
      {
        name: "description",
        content:
          "صفحة اختبار داخلية للـ AI Assistant Shell — Context + Retrieval فقط، بدون توليد إجابات.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <AssistantRuntimePage />
    </AdminGate>
  ),
});

/* ---------- Status pill ---------- */

type SysStatus = "connected" | "placeholder";

function StatusPill({ status, label }: { status: SysStatus; label: string }) {
  const cls =
    status === "connected"
      ? "bg-accent/15 text-accent border-accent/30"
      : "bg-muted/40 text-muted-foreground border-border/40";
  const Icon = status === "connected" ? CheckCircle2 : Circle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/* ---------- Section wrapper ---------- */

function Section({
  no,
  icon: Icon,
  label,
  title,
  children,
}: {
  no: string;
  icon: typeof Activity;
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

/* ---------- Field card ---------- */

function Field({ label, value }: { label: string; value: React.ReactNode }) {
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

/* ---------- Flow step ---------- */

function FlowStep({ label, last }: { label: string; last?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="glass rounded-xl px-5 py-3 border border-border/40 text-sm md:text-base font-medium text-foreground min-w-[260px] text-center">
        {label}
      </div>
      {!last && (
        <ChevronDown className="h-4 w-4 text-muted-foreground my-2" />
      )}
    </div>
  );
}

const FUTURE_FLOW = [
  "User Question",
  "Read Learner Context",
  "Search Platform Content",
  "Retrieve Relevant Lessons",
  "Send Context + Question to AI",
  "Generate Answer",
];

/* ---------- Page ---------- */

function AssistantRuntimePage() {
  const ctx = useLearnerContext();
  const [query, setQuery] = useState("");
  const results = usePlatformRetrieval(query, { limit: 6 });
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendResp, setBackendResp] =
    useState<AssistantRuntimeResponsePayload | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  async function handleTestBackend() {
    setBackendLoading(true);
    setBackendError(null);
    try {
      const resp = await callAssistantRuntime({
        query: query.trim() || "ping",
        learnerContext: {
          currentPath: ctx.currentPath?.title ?? null,
          currentModule: ctx.currentModule?.title ?? null,
          currentLesson: ctx.currentLesson
            ? `${ctx.currentLesson.title} · ${ctx.currentLesson.id}`
            : null,
        },
        retrievalResults: results,
      });
      setBackendResp(resp);
    } catch (e) {
      setBackendError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBackendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> العودة للوحة
        </Link>

        {/* Hero */}
        <header className="glass rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden border border-border/30">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-widest text-primary mb-4">
              INTERNAL · ASSISTANT SHELL
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] mb-5">
              Assistant Runtime
            </h1>
            <p className="text-muted-foreground leading-loose max-w-2xl text-[15px] md:text-base">
              صفحة اختبار داخلية لتحضير الـ AI Assistant: تربط بين Context
              Layer و Retrieval Layer قبل توصيل أي AI خارجي.
            </p>
          </div>
        </header>

        {/* 1 — Runtime Status */}
        <Section
          no="01"
          icon={Activity}
          label="ASSISTANT RUNTIME STATUS"
          title="حالة الـ Runtime"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <StatusRow
              icon={Sparkles}
              title="Assistant"
              status="placeholder"
              note="Placeholder — Not connected yet."
            />
            <StatusRow
              icon={Brain}
              title="Context Layer"
              status="connected"
              note="useLearnerContext() متصل ويعمل."
            />
            <StatusRow
              icon={SearchIcon}
              title="Retrieval Layer"
              status="connected"
              note={`searchPlatformContent — ${RETRIEVAL_CORPUS_SIZE} chunks.`}
            />
            <StatusRow
              icon={Sparkles}
              title="AI API"
              status="placeholder"
              note="Not connected — لا يوجد Gateway مفعّل."
            />
            <StatusRow
              icon={Database}
              title="Vector Store"
              status="placeholder"
              note="Not connected — لا يوجد embeddings store."
            />
          </div>
        </Section>

        {/* 2 — Current Learner Context */}
        <Section
          no="02"
          icon={Brain}
          label="CURRENT LEARNER CONTEXT"
          title="السياق الحالي للمتعلم"
        >
          <div className="glass rounded-2xl p-5 border border-primary/25">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field
                label="currentPath"
                value={ctx.currentPath?.title ?? null}
              />
              <Field
                label="currentModule"
                value={ctx.currentModule?.title ?? null}
              />
              <Field
                label="currentLesson"
                value={
                  ctx.currentLesson
                    ? `${ctx.currentLesson.title} · ${ctx.currentLesson.id}`
                    : null
                }
              />
              <Field
                label="currentLessonStatus"
                value={ctx.currentLessonStatus}
              />
              <Field
                label="completedLessonsCount"
                value={`${ctx.completedLessonsCount} / ${ctx.totalLessonsCount}`}
              />
              <Field
                label="nextLesson"
                value={
                  ctx.nextLesson
                    ? `${ctx.nextLesson.title} · ${ctx.nextLesson.id}`
                    : null
                }
              />
            </div>
          </div>
        </Section>

        {/* 3 — Retrieval Test */}
        <Section
          no="03"
          icon={SearchIcon}
          label="RETRIEVAL TEST"
          title="اختبار طبقة الاسترجاع"
        >
          <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اسأل سؤال من محتوى المنصة"
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>QUERY · {query.trim() || "—"}</span>
              <span>{results.length} results</span>
            </div>
            <div className="space-y-2">
              {query.trim() === "" ? (
                <div className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground text-center">
                  ابدأ بكتابة سؤال لاستعراض نتائج الاسترجاع.
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground text-center">
                  لا نتائج داخل محتوى المنصة لهذا الـ Query.
                </div>
              ) : (
                results.map((r, i) => (
                  <div
                    key={`${r.lessonId}-${r.matchType}-${i}`}
                    className="rounded-lg border border-border/40 p-4 bg-background/40 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] tracking-widest text-primary bg-primary/10 rounded px-2 py-0.5">
                          {r.matchType.toUpperCase()}
                        </span>
                        <p className="text-sm font-bold text-foreground">
                          {r.lessonTitle}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          · {r.moduleTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[10px] text-muted-foreground">
                          {r.lessonId}
                        </code>
                        <span className="font-mono text-[10px] text-accent bg-accent/10 rounded px-2 py-0.5">
                          score {r.relevanceScore.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-loose">
                      {r.matchedText}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Section>

        {/* 4 — Future Flow */}
        <Section
          no="04"
          icon={Sparkles}
          label="FUTURE ASSISTANT FLOW"
          title="رحلة الـ Assistant القادمة"
        >
          <div className="glass rounded-2xl p-6 md:p-10 border border-border/30">
            <div className="flex flex-col items-center">
              {FUTURE_FLOW.map((s, i) => (
                <FlowStep
                  key={s}
                  label={s}
                  last={i === FUTURE_FLOW.length - 1}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* 4b — Backend Runtime Connection */}
        <Section
          no="05"
          icon={Plug}
          label="BACKEND RUNTIME CONNECTION"
          title="Backend Runtime Connection"
        >
          <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
                نقطة الاتصال الآمنة الأولى مع الـ Backend Runtime
                (<code>assistant-runtime</code> Edge Function). يستقبل الـ Query
                + Learner Context + Retrieval Results ويُرجع payload منظّم
                مؤقت بدون أي استدعاء AI حقيقي بعد.
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${
                  backendError
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : backendResp?.runtime === "connected"
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-muted/40 text-muted-foreground border-border/40"
                }`}
              >
                Backend Runtime:{" "}
                {backendError
                  ? "Failed"
                  : backendResp?.runtime === "connected"
                    ? "Connected"
                    : "Not Tested"}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                onClick={handleTestBackend}
                disabled={backendLoading}
                className="font-mono"
              >
                {backendLoading ? "جارٍ الإرسال..." : "Test Backend Runtime"}
              </Button>
              <span className="text-[11px] font-mono text-muted-foreground">
                sends current learner context + {results.length} retrieval result(s)
              </span>
            </div>

            {backendError && (
              <div className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive bg-destructive/5">
                Assistant runtime connection failed.
                <p className="text-[11px] text-destructive/80 mt-1 font-mono" dir="ltr">
                  {backendError}
                </p>
              </div>
            )}

            {backendResp && (
              <div className="rounded-lg border border-border/40 p-4 bg-background/40 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    RUNTIME PAYLOAD
                  </p>
                  {(() => {
                    const v = validatePayload(backendResp);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-mono ${
                          v.valid
                            ? "bg-accent/15 text-accent border-accent/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }`}
                      >
                        Payload Schema: {v.valid ? "Valid" : "Invalid"}
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const v = validatePayload(backendResp);
                  if (v.valid) return null;
                  return (
                    <div className="rounded-md border border-destructive/30 p-2.5 bg-destructive/5 text-[11px] text-destructive font-mono" dir="ltr">
                      Invalid / missing: {v.issues.join(", ")}
                    </div>
                  );
                })()}
                <div className="grid sm:grid-cols-2 gap-2">
                  <PayloadField label="ok" value={fmtField(backendResp.ok)} />
                  <PayloadField
                    label="runtime"
                    value={fmtField(backendResp.runtime)}
                  />
                  <PayloadField
                    label="receivedQuery"
                    value={fmtField(backendResp.receivedQuery)}
                  />
                  <PayloadField
                    label="retrievalCount"
                    value={fmtField(backendResp.retrievalCount)}
                  />
                  <PayloadField
                    label="contextDetected"
                    value={fmtField(backendResp.contextDetected)}
                  />
                  <PayloadField
                    label="message"
                    value={fmtField(backendResp.message)}
                  />
                </div>
                <details className="group">
                  <summary className="cursor-pointer font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    RAW JSON
                  </summary>
                  <pre
                    className="mt-2 text-[12px] font-mono text-foreground/90 leading-relaxed overflow-x-auto whitespace-pre-wrap rounded border border-border/30 p-3 bg-background/60"
                    dir="ltr"
                  >
{JSON.stringify(backendResp, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <div className="rounded-lg border border-destructive/25 p-3 text-xs text-foreground/90 leading-loose bg-destructive/5">
              لا يتم إرسال أي مفاتيح API للواجهة الأمامية. كل الاتصال
              المستقبلي بالـ AI سيتم عبر Backend Runtime آمن.
            </div>
          </div>
        </Section>

        {/* 5 — Safety note */}
        <section className="glass rounded-2xl p-6 border border-destructive/30 mb-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-destructive mb-2">
                SAFETY NOTE
              </p>
              <p className="text-sm text-foreground/90 leading-loose">
                هذه الصفحة لا تولّد إجابات AI حقيقية بعد. هي فقط لاختبار أن
                المنصة أصبحت تفهم السياق وتسترجع المحتوى قبل تشغيل الـ AI.
              </p>
            </div>
          </div>
        </section>
        {/* 6 — Admin-only: Knowledge seed (P0) */}
        <AssistantSeedPanel />
      </main>
    </div>
  );
}

/* ---------- Admin-only seed panel ---------- */
function AssistantSeedPanel() {
  const preview = useServerFn(previewAssistantSeed);
  const runSeed = useServerFn(runAssistantSeed);
  const [report, setReport] = useState<SeedReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<"idle" | "preview" | "real">("idle");
  const [confirm, setConfirm] = useState("");

  async function doPreview() {
    setLoading("preview");
    setErr(null);
    try {
      const r = await preview();
      setReport(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading("idle");
    }
  }

  async function doRealSeed() {
    if (confirm !== SEED_CONFIRMATION_TEXT) return;
    setLoading("real");
    setErr(null);
    try {
      const r = await runSeed({ data: { dryRun: false, confirmationText: confirm } });
      setReport(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading("idle");
    }
  }

  const canRunReal = confirm === SEED_CONFIRMATION_TEXT && loading === "idle";

  return (
    <section className="glass rounded-2xl p-6 border border-primary/30 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-primary mb-1">
            ADMIN · KNOWLEDGE SEED (P0)
          </p>
          <h3 className="text-lg font-bold mb-1">Assistant Knowledge Seed</h3>
          <p className="text-xs text-muted-foreground leading-loose">
            Dry-run افتراضي — مفيش OpenAI ولا كتابة في DB. الـ Real seed محمي بـ
            admin role وكلمة تأكيد بالظبط:{" "}
            <code className="font-mono text-primary">{SEED_CONFIRMATION_TEXT}</code>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={doPreview} disabled={loading !== "idle"} variant="outline">
          {loading === "preview" ? "جاري…" : "Run Dry-Run Preview"}
        </Button>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={SEED_CONFIRMATION_TEXT}
          className="font-mono max-w-sm"
        />
        <Button
          onClick={doRealSeed}
          disabled={!canRunReal}
          variant="destructive"
        >
          {loading === "real" ? "جاري…" : "Run Real Seed"}
        </Button>
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs p-3 mb-3 font-mono">
          {err}
        </div>
      )}

      {report && (
        <pre className="rounded-lg border border-border/40 bg-background/60 text-[11px] p-3 overflow-auto max-h-96 font-mono">
{JSON.stringify(report, null, 2)}
        </pre>
      )}
    </section>
  );
}

function StatusRow({
  icon: Icon,
  title,
  status,
  note,
}: {
  icon: typeof Activity;
  title: string;
  status: SysStatus;
  note: string;
}) {
  const ring =
    status === "connected" ? "border-accent/25" : "border-border/40";
  const iconBg =
    status === "connected"
      ? "bg-accent/15 text-accent"
      : "bg-muted/40 text-muted-foreground";
  return (
    <div className={`glass rounded-xl p-5 border ${ring}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-9 w-9 place-items-center rounded-lg ${iconBg}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="font-bold text-foreground text-sm">{title}</p>
        </div>
        <StatusPill
          status={status}
          label={status === "connected" ? "CONNECTED" : "PLACEHOLDER"}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-loose">{note}</p>
    </div>
  );
}

function PayloadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/30 p-2.5 bg-background/60">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className="text-sm font-mono text-foreground mt-0.5 break-words"
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}

function fmtField(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v.trim() === "" ? "—" : v;
  return String(v);
}

const PAYLOAD_SCHEMA: Record<string, "boolean" | "string" | "number"> = {
  ok: "boolean",
  runtime: "string",
  receivedQuery: "string",
  retrievalCount: "number",
  contextDetected: "boolean",
  message: "string",
};

function validatePayload(p: unknown): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!p || typeof p !== "object") {
    return { valid: false, issues: ["payload"] };
  }
  const obj = p as Record<string, unknown>;
  for (const [field, expected] of Object.entries(PAYLOAD_SCHEMA)) {
    const v = obj[field];
    if (v === undefined || v === null) {
      issues.push(`${field} (missing)`);
      continue;
    }
    if (typeof v !== expected) {
      issues.push(`${field} (expected ${expected}, got ${typeof v})`);
    }
  }
  return { valid: issues.length === 0, issues };
}
