import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveAssistantPackageLocale } from "@/lib/rag/resolve-assistant-locale";
import { readFileSync } from "node:fs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

describe("AssistantPanel locale wiring", () => {
  it("maps package locales for RAG retrieval", () => {
    expect(resolveAssistantPackageLocale("en")).toBe("en");
    expect(resolveAssistantPackageLocale("ar-MSA")).toBe("ar-MSA");
    expect(resolveAssistantPackageLocale("ar-Gulf")).toBe("ar-Gulf");
    expect(resolveAssistantPackageLocale("ar-EG")).toBeNull();
  });

  it("resolves localized runtime context via resolveAssistantLearnerContext", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/components/assistant/AssistantPanel.tsx"),
      "utf8",
    );
    expect(source).toContain("resolveAssistantLearnerContext");
    expect(source).toContain("buildAssistantRuntimePayload");
    expect(source).toContain("contextOverride");
  });

  it("declares locale on assistant runtime client payload", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/lib/assistant-runtime.ts"),
      "utf8",
    );
    expect(source).toContain("locale?: string | null");
  });
});
