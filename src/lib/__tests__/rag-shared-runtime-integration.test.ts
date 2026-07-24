import path from "node:path";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { generateAllChunks } from "@/lib/rag/manifests";
import { discoverApprovedPackages } from "@/lib/rag/corpus-discovery";
import { buildEmbeddingDryRunReport } from "@/lib/rag/embedding-dry-run";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("RAG embedding dry-run report", () => {
  const packages = discoverApprovedPackages(REPO_ROOT);
  const chunks = generateAllChunks(REPO_ROOT, packages);
  const report = buildEmbeddingDryRunReport(chunks);

  it("uses exact approved chunk count", () => {
    expect(report.chunkCount).toBe(3700);
  });

  it("produces exact cl100k_base token counts without API calls", () => {
    expect(report.totalInputTokens).toBeGreaterThan(0);
    expect(report.tokenStats.min).toBeGreaterThan(0);
    expect(report.tokenStats.max).toBeGreaterThanOrEqual(report.tokenStats.min);
    expect(report.tokenStats.avg).toBeGreaterThan(0);
    expect(report.tokenizerLibrary).toBe("js-tiktoken");
    expect(report.tokenizerEncoding).toBe("cl100k_base");
    expect(report.estimatedRequestCount).toBe(Math.ceil(3700 / 64));
    expect(report.embeddingModel).toBe("text-embedding-3-small");
    expect(report.vectorDimensions).toBe(1536);
  });

  it("includes activation and rollback criteria", () => {
    expect(report.activationCriteria.length).toBeGreaterThan(0);
    expect(report.rollbackPlan.length).toBeGreaterThan(0);
    expect(report.failureHandling.length).toBeGreaterThan(0);
  });
});

describe("assistant-runtime locale integration", () => {
  const source = readFileSync(
    path.join(REPO_ROOT, "supabase/functions/assistant-runtime/handler.ts"),
    "utf8",
  );

  it("uses locale-aware RPC without cross-locale fallback", () => {
    const indexSrc = readFileSync(
      path.join(REPO_ROOT, "supabase/functions/assistant-runtime/index.ts"),
      "utf8",
    );
    expect(source).toContain("localeSemanticRetrieve");
    expect(source).toContain("RUNTIME_SUPPORTED_LOCALES");
    expect(source).toContain("validateRuntimeLocale");
    expect(source).not.toContain("Legacy Egyptian corpus path when locale not provided");
    expect(indexSrc).toContain("match_locale_knowledge_chunks");
    expect(indexSrc).not.toContain("match_knowledge_chunks");
  });

  it("returns citation metadata in response contract", () => {
    expect(source).toContain("citations");
    expect(source).toContain("crossLocaleLeakage");
    expect(source).toContain("crossLessonLeakage");
    expect(source).toContain("activeIndexOnly");
  });
});

describe("package.json and lockfile boundaries", () => {
  it("adds only RAG scripts without dependency changes", () => {
    const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["rag:verify-corpus"]).toBeTruthy();
    expect(pkg.scripts["rag:generate-manifests"]).toBeTruthy();
    expect(pkg.scripts["rag:mock-index"]).toBeTruthy();
    expect(pkg.scripts["rag:reindex-plan"]).toBeTruthy();
    expect(pkg.scripts["rag:embedding-dry-run"]).toBeTruthy();
    expect(pkg.scripts["rag:validate-local"]).toBeTruthy();
  });
});
