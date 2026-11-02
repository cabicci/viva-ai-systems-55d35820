import { curriculumChunks, type TeachingSource } from "./corpus";
import { sha256, validVector, CARD_EMBEDDING_MODEL } from "@/lib/card-assistant/corpus";
import { intakeCanonical } from "./package";
import {
  automationRpc,
  checkAutomaticLease,
  leaseArguments,
  reserveAutomaticProvider,
  type AutomaticLease,
} from "@/lib/assistant-automation/store.server";
import type { AutomaticPlan, AutomaticManifest } from "@/lib/assistant-automation/manifest";
import { verifyPrivateCourseAssets, type PrivateCourseAsset } from "./assets.server";
type CurriculumManifest = AutomaticManifest & { adapter: "curriculum"; curriculumVersion: string };

export async function curriculumAutomaticPlans(build: string): Promise<AutomaticPlan[]> {
  const rows = await automationRpc<
    {
      area: AutomaticManifest["area"];
      id: string;
      version: string;
      sourceRevision: string;
      scopes: AutomaticManifest["scopes"];
    }[]
  >("curriculum_index_metadata", {});
  if (!Array.isArray(rows) || rows.length > 100) throw new Error("AUTOMATION_SCOPE_LIMIT");
  return Promise.all(
    rows.map(async (row) => {
      const manifest: CurriculumManifest = {
        schemaVersion: "assistant-auto-v1",
        adapter: "curriculum",
        build,
        area: row.area,
        cardId: row.id,
        curriculumVersion: row.version,
        sourceRevision: row.sourceRevision,
        scopes: row.scopes,
        scopeCount: row.scopes.length + 1,
        issue: null,
      };
      const material = intakeCanonical(manifest);
      return { key: await sha256(material), material, manifest };
    }),
  );
}
export async function courseEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (texts.length > 80 || !process.env.OPENAI_API_KEY)
    throw new Error("CURRICULUM_EMBEDDING_UNAVAILABLE");
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: CARD_EMBEDDING_MODEL, dimensions: 1536, input: texts }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("CURRICULUM_EMBEDDING_UNAVAILABLE");
  }
  const result = (await response.json()) as { data?: { index: number; embedding: number[] }[] };
  const rows = result.data?.slice().sort((a, b) => a.index - b.index);
  if (
    !rows ||
    rows.length !== texts.length ||
    rows.some((r, i) => r.index !== i || !validVector(r.embedding))
  )
    throw new Error("CURRICULUM_EMBEDDING_INVALID");
  return rows.map((r) => r.embedding);
}
export async function indexCurriculumScope(lease: AutomaticLease) {
  await checkAutomaticLease(lease);
  const p_data = leaseArguments(lease);
  if (lease.offset === lease.manifest.scopeCount - 1)
    return automationRpc<Record<string, unknown>>("curriculum_index_operation", {
      p_action: "publish",
      p_data,
    });
  const source = await automationRpc<{
    payload: TeachingSource & { assets: PrivateCourseAsset[] };
    sha256: string;
    existing: { content: string; contentSha: string; embedding: string }[];
  }>("curriculum_index_operation", { p_action: "source", p_data });
  const scope = lease.manifest.scopes[lease.offset];
  if (
    !scope ||
    source.sha256 !== scope.sourceSha ||
    (await sha256(intakeCanonical(source.payload))) !== source.sha256
  )
    throw new Error("AUTOMATION_SOURCE_CHANGED");
  const chunks = await curriculumChunks(source.payload);
  const assetProofs = await verifyPrivateCourseAssets(source.payload.assets);
  const reuse = chunks.map((chunk) =>
    source.existing.find((x) => x.contentSha === chunk.contentSha && x.content === chunk.content),
  );
  const fresh = chunks.filter((_, i) => !reuse[i]);
  if (fresh.length) await reserveAutomaticProvider(lease);
  const embeddings = await courseEmbeddings(fresh.map((x) => x.content));
  let at = 0;
  const rows = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: reuse[i]?.embedding ?? JSON.stringify(embeddings[at++]),
  }));
  await checkAutomaticLease(lease);
  const result = await automationRpc<{ committed: boolean; sourceSha: string }>(
    "curriculum_index_operation",
    { p_action: "commit", p_data: { ...p_data, rows, assetProofs } },
  );
  if (!result.committed || result.sourceSha !== scope.sourceSha)
    throw new Error("AUTOMATION_SOURCE_CHANGED");
  return {
    embedded: fresh.length,
    reused: chunks.length - fresh.length,
    proofs: [
      {
        stepId: scope.stepId,
        locale: scope.locale,
        sourceSha: source.sha256,
        chunks: chunks.map((x) => ({ id: x.id, contentSha: x.contentSha })),
      },
    ],
  };
}
