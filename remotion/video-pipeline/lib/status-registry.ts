import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type {
  VideoManifestEntry,
  VideoStatusRecord,
  VideoOutputStatus,
} from "./types.ts";
import { STATUS_REGISTRY_PATH } from "./paths.ts";

export type StatusRegistry = {
  version: 1;
  updatedAt: string;
  records: Record<string, VideoStatusRecord>;
};

export function loadStatusRegistry(): StatusRegistry {
  if (!existsSync(STATUS_REGISTRY_PATH)) {
    return { version: 1, updatedAt: new Date().toISOString(), records: {} };
  }
  return JSON.parse(readFileSync(STATUS_REGISTRY_PATH, "utf8")) as StatusRegistry;
}

export function saveStatusRegistry(registry: StatusRegistry): void {
  mkdirSync(path.dirname(STATUS_REGISTRY_PATH), { recursive: true });
  registry.updatedAt = new Date().toISOString();
  writeFileSync(STATUS_REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

export function entryToStatusRecord(
  entry: VideoManifestEntry,
  status: VideoOutputStatus = entry.outputStatus,
): VideoStatusRecord {
  return {
    cellId: entry.cellId,
    lessonId: entry.lessonId,
    locale: entry.locale,
    track: entry.track,
    module: entry.module,
    packagePath: entry.packagePath,
    sourceSha: entry.sourceSha,
    packageChecksum: entry.packageChecksum,
    voiceProfileId: entry.voiceProfileId,
    outputStatus: status,
    updatedAt: new Date().toISOString(),
  };
}

export function updateStatusRecord(
  cellId: string,
  patch: Partial<VideoStatusRecord>,
): VideoStatusRecord {
  const registry = loadStatusRegistry();
  const existing = registry.records[cellId];
  if (!existing) throw new Error(`No status record for ${cellId}`);
  const updated: VideoStatusRecord = {
    ...existing,
    ...patch,
    cellId,
    updatedAt: new Date().toISOString(),
  };
  registry.records[cellId] = updated;
  saveStatusRegistry(registry);
  return updated;
}

export function getFailedCellIds(): string[] {
  const registry = loadStatusRegistry();
  return Object.values(registry.records)
    .filter((r) => r.outputStatus === "failed")
    .map((r) => r.cellId)
    .sort();
}

export function getCommittedCellIds(): string[] {
  const registry = loadStatusRegistry();
  return Object.values(registry.records)
    .filter((r) => r.outputStatus === "committed")
    .map((r) => r.cellId)
    .sort();
}

export function initRegistryFromManifest(entries: VideoManifestEntry[]): void {
  const registry = loadStatusRegistry();
  for (const entry of entries) {
    if (!registry.records[entry.cellId]) {
      registry.records[entry.cellId] = entryToStatusRecord(entry);
    }
  }
  saveStatusRegistry(registry);
}

export function filterRetryOnlyFailed(
  cellIds: string[],
  retryFailedOnly: boolean,
): string[] {
  if (!retryFailedOnly) return cellIds;
  const failed = new Set(getFailedCellIds());
  return cellIds.filter((id) => failed.has(id));
}

export function preventCommittingFailed(record: VideoStatusRecord): {
  ok: boolean;
  error?: string;
} {
  if (record.outputStatus === "failed") {
    return { ok: false, error: `Refusing to commit failed output: ${record.cellId}` };
  }
  if (record.outputStatus !== "validated") {
    return {
      ok: false,
      error: `Refusing to commit non-validated output (${record.outputStatus}): ${record.cellId}`,
    };
  }
  if (!record.scriptChecksum || !record.videoChecksum || !record.captionsChecksum) {
    return { ok: false, error: `Incomplete metadata for ${record.cellId}` };
  }
  return { ok: true };
}
