import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import {
  ACTIVATION_DISABLED,
  ROLLBACK_DISABLED,
  executeNextRagImportBatch,
  getRagImportEvidence,
  getRagImportStatus,
  initializeOrResumeRagImport,
  validateRagImportStaging,
} from "@/lib/rag-production-lifecycle.functions";
import { LOVABLE_NATIVE_AUTHORIZATION_ID } from "@/lib/rag/lovable-native/public-ids";

type StatusPayload = Awaited<ReturnType<typeof getRagImportStatus>>;

export function RagLovableNativeImportPanel() {
  const statusFn = useServerFn(getRagImportStatus);
  const initFn = useServerFn(initializeOrResumeRagImport);
  const batchFn = useServerFn(executeNextRagImportBatch);
  const validateFn = useServerFn(validateRagImportStaging);
  const evidenceFn = useServerFn(getRagImportEvidence);

  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [evidence, setEvidence] = useState<unknown>(null);
  const [validation, setValidation] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (label === "status" || label === "init" || label === "batch") {
        const refreshed = (await statusFn()) as StatusPayload;
        setStatus(refreshed);
      }
      if (label === "validate") setValidation(result);
      if (label === "evidence") setEvidence(result);
      if (label === "status") setStatus(result as StatusPayload);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 120) : "INTERNAL");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const locked = status?.lockedCorpus;

  return (
    <section className="glass rounded-2xl p-6 border border-border/40 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent shrink-0">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
            RAG LOVABLE-NATIVE IMPORT
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Admin-only resumable staging importer. One embedding batch per explicit action.
            Activation and rollback are disabled in this authorization.
          </p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground" dir="ltr">
            {LOVABLE_NATIVE_AUTHORIZATION_ID}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono mb-4" dir="ltr">
        <div>sourceSha: {locked ? `${locked.sourceSha.slice(0, 12)}…` : "(refresh status)"}</div>
        <div>index: {locked?.indexVersion ?? "(refresh status)"}</div>
        <div>
          packages/chunks:{" "}
          {locked ? `${locked.packageCount}/${locked.chunkCount}` : "(refresh status)"}
        </div>
        <div>
          batches/attempts:{" "}
          {status ? `${status.plannedBatchCount}/${status.maxProviderAttempts}` : "58/67"}
        </div>
        <div className="sm:col-span-2 break-all">
          pkg digest:{" "}
          {locked ? `${locked.digests.packageManifestSha256.slice(0, 16)}…` : "(refresh status)"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run("status", () => statusFn())}
        >
          Refresh status
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run("init", () => initFn({ data: {} }))}
        >
          Initialize or resume
        </Button>
        <Button
          size="sm"
          disabled={busy}
          onClick={() => void run("batch", () => batchFn({ data: {} }))}
        >
          Execute next batch
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run("validate", () => validateFn({ data: {} }))}
        >
          Validate staging
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void run("evidence", () => evidenceFn())}
        >
          View sanitized evidence
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          title="Requires separate Control Room authorization"
        >
          Activate (disabled)
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          title="Requires separate Control Room authorization"
        >
          Rollback (disabled)
        </Button>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-destructive/30 p-2 text-xs text-destructive font-mono">
          {error}
        </div>
      )}

      {status && (
        <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono mb-3" dir="ltr">
          <div>session: {status.sessionState ?? "none"}</div>
          <div>execution: {status.executionId ?? "—"}</div>
          <div>
            batches: {status.completedBatchCount}/{status.plannedBatchCount}
          </div>
          <div>
            chunks: {status.acceptedChunkCount}/{locked?.chunkCount ?? 3700}
          </div>
          <div>
            attempts: {status.providerAttemptCount}/{status.maxProviderAttempts}
          </div>
          <div>staging: {status.stagingVersionKey ?? "—"}</div>
          <div>active: {status.currentActiveVersionKey ?? "none"}</div>
          <div>lastError: {status.lastErrorCode ?? "—"}</div>
          <div>legacy lessons: {status.legacyLessonCount ?? "—"}</div>
          <div>locale rows: {status.localeLessonCount ?? "—"}</div>
          <div>activationEnabled: {String(status.activationEnabled ?? !ACTIVATION_DISABLED)}</div>
          <div>rollbackEnabled: {String(status.rollbackEnabled ?? !ROLLBACK_DISABLED)}</div>
        </div>
      )}

      {validation != null && (
        <pre
          className="mb-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap rounded border border-border/30 p-3 bg-background/60"
          dir="ltr"
        >
          {JSON.stringify(validation, null, 2)}
        </pre>
      )}

      {evidence != null && (
        <pre
          className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap rounded border border-border/30 p-3 bg-background/60"
          dir="ltr"
        >
          {JSON.stringify(evidence, null, 2)}
        </pre>
      )}
    </section>
  );
}
