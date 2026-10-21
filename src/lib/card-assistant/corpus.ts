import { registeredStep } from "./registry";
import type { SupportedLocale } from "@/lib/locale/types";
export const CARD_EMBEDDING_MODEL = "text-embedding-3-small";
export const CARD_EMBEDDING_DIMENSIONS = 1536;
export type SourceDocument = {
  area: "kids" | "technical"; cardId: string; stepId: string; locale: SupportedLocale;
  sourceSha256: string; payload: Record<string, unknown>; kind: "kids" | "lesson" | "cabinet";
};
export type CardChunk = {
  area: "kids" | "technical"; cardId: string; stepId: string; locale: SupportedLocale;
  chunkId: string; title: string; sourceSha256: string; payloadSha256: string; contentSha256: string; content: string;
};
export type IndexedChunk = CardChunk & { embedding: unknown; embeddingModel: string; embeddingDimensions: number };
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map(key =>
    `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  const result = JSON.stringify(value);
  if (result === undefined) throw new Error("CARD_SOURCE_INVALID");
  return result;
}
export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))].map(x => x.toString(16).padStart(2, "0")).join("");
}
/** Matches scripts/technical-education/import.ts exactly; do not repin source hashes. */
export function technicalSourceJson(value: unknown): string {
  return JSON.stringify(value, (_key, child) => child && typeof child === "object" && !Array.isArray(child)
    ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a.localeCompare(b, "en"))) : child);
}
function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function string(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.map(string).filter(Boolean) : []; }
function array(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.map(record) : []; }

/** Whitelist learner-visible instruction. Never serialize quiz keys, educator notes or submissions. */
export async function sourceChunks(source: SourceDocument): Promise<CardChunk[]> {
  registeredStep(source.area, source.cardId, source.stepId);
  if (!/^[a-f0-9]{64}$/.test(source.sourceSha256) || (source.area === "kids") !== (source.kind === "kids")) throw new Error("CARD_SOURCE_INVALID");
  const p = source.payload;
  if (source.area === "technical" && await sha256(technicalSourceJson(p)) !== source.sourceSha256) throw new Error("CARD_SOURCE_APPROVAL_MISMATCH");
  if (source.kind !== "cabinet" && p.locale !== source.locale) throw new Error("CARD_SOURCE_LOCALE_MISMATCH");
  if (source.kind === "lesson" && p.id !== source.stepId) throw new Error("CARD_SOURCE_STEP_MISMATCH");
  if (p.locale !== undefined && p.locale !== source.locale) throw new Error("CARD_SOURCE_LOCALE_MISMATCH");
  const title = string(p.title);
  if (!title) throw new Error("CARD_SOURCE_INVALID");
  const sections: { id: string; title: string; parts: string[] }[] = [];
  const add = (id: string, heading: unknown, parts: string[]) => {
    const safe = parts.filter(Boolean);
    if (safe.length) sections.push({ id, title: string(heading) || title, parts: safe });
  };
  if (source.kind === "kids") {
    add("overview", title, [string(p.subtitle), ...strings(p.objectives)]);
    array(p.scenes).forEach((s, i) => add(`scene-${i + 1}`, s.title, [string(s.display), string(s.narration)]));
    array(p.reading).forEach((s, i) => add(`reading-${i + 1}`, s.title, [string(s.text)]));
    const activity = record(p.activity), mission = record(p.mission);
    add("activity", activity.title, [string(activity.instructions), string(activity.starter)]);
    add("mission", mission.title, [string(mission.instructions), ...strings(mission.rubric)]);
  } else {
    add("overview", title, [string(p.intro), string(p.scope), string(p.prerequisites), ...strings(p.goals)]);
    array(p.sections).forEach((s, i) => add(`section-${i + 1}`, s.title,
      [string(s.text), string(s.caption), string(s.body), string(s.note)]));
    const example = record(p.example), assignment = record(p.assignment);
    add("example", example.title, [string(example.text), string(example.decision)]);
    add("assignment", title, [string(assignment.prompt), ...strings(assignment.fields), ...strings(assignment.criteria)]);
    array(p.faq).forEach((s, i) => add(`faq-${i + 1}`, s.question, [string(s.answer)]));
  }
  const payloadSha256 = await sha256(canonicalJson(p));
  const chunks: CardChunk[] = [];
  for (const section of sections) {
    const text = [title, section.title, ...section.parts].join("\n\n");
    // Stable bounded passages keep retrieval and provider payloads predictable.
    for (let offset = 0, part = 1; offset < text.length; offset += 3500, part++) {
      const content = text.slice(offset, offset + 3500);
      chunks.push({ area: source.area, cardId: source.cardId, stepId: source.stepId, locale: source.locale,
        chunkId: `${section.id}-${part}`, title: section.title, sourceSha256: source.sourceSha256,
        payloadSha256, contentSha256: await sha256(content), content });
    }
  }
  if (!chunks.length || chunks.length > 80) throw new Error("CARD_SOURCE_INVALID");
  return chunks;
}
export function validVector(value: unknown): number[] | null {
  let parsed = value;
  if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch { return null; } }
  return Array.isArray(parsed) && parsed.length === CARD_EMBEDDING_DIMENSIONS && parsed.every(x => typeof x === "number" && Number.isFinite(x)) ? parsed : null;
}
/** Only exact text/model matches reuse vectors; changed provenance is written anew. */
export function planChunkUpdates(next: CardChunk[], previous: IndexedChunk[]) {
  const seen = new Set<string>();
  return next.map(chunk => {
    const key = JSON.stringify([chunk.area, chunk.cardId, chunk.stepId, chunk.locale, chunk.chunkId]);
    if (seen.has(key)) throw new Error("CARD_CHUNK_COLLISION");
    seen.add(key);
    const same = previous.filter(old => old.area === chunk.area && old.cardId === chunk.cardId && old.stepId === chunk.stepId &&
      old.locale === chunk.locale && old.chunkId === chunk.chunkId);
    if (same.length > 1) throw new Error("CARD_CHUNK_COLLISION");
    // A section inserted earlier may renumber chunks. Content identity, not the
    // old ordinal, determines whether the already-paid vector is reusable.
    const compatible = previous.filter(old => old.area === chunk.area && old.cardId === chunk.cardId && old.stepId === chunk.stepId &&
      old.locale === chunk.locale && old.content === chunk.content && old.contentSha256 === chunk.contentSha256 &&
      old.embeddingModel === CARD_EMBEDDING_MODEL && old.embeddingDimensions === CARD_EMBEDDING_DIMENSIONS);
    const embedding = compatible.map(old => validVector(old.embedding)).find(Boolean) ?? null;
    return { chunk, embedding };
  });
}
