/**
 * In-memory SQL stub for unit tests — not a Production driver.
 * Supports the subset of statements used by the inactive importer.
 */

import type { SqlExecutor } from "./types";
import {
  EXPECTED_EMBEDDING_DIMENSIONS,
  INDEX_STATE_STAGING,
  SOURCE_TYPE_LOCALE_LESSON,
} from "./constants";

type RegistryRow = {
  version_key: string;
  source_sha: string;
  status: string;
  package_count: number;
  chunk_count: number;
  chunk_manifest_checksum: string;
  embedding_model: string;
};

type ChunkRow = {
  id: string;
  source_type: string;
  source_id: string;
  path_id: string;
  module_id: string;
  lesson_id: string;
  title: string;
  content: string;
  embedding: number[];
  locale: string;
  package_path: string;
  source_sha: string;
  package_checksum: string;
  chunk_checksum: string;
  content_version: string | null;
  index_version: string;
  index_state: string;
  section_index: number;
  section_role: string;
  chunk_position: number;
  content_type: string;
  production_route: string | null;
  indexing_failed: boolean;
};

function parseVector(raw: string): number[] {
  const inner = raw.replace(/^'|'::extensions\.vector$/g, "").replace(/^\[|\]$/g, "");
  // raw may be like '[1,2]'::extensions.vector inside SQL
  const m = raw.match(/\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]!
    .split(",")
    .filter(Boolean)
    .map((n) => Number(n.trim()));
}

function unquote(v: string): string | null {
  const t = v.trim();
  if (t.toUpperCase() === "NULL") return null;
  if (t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

export class MemorySqlExecutor implements SqlExecutor {
  readonly redactedTargetId = "memory://disposable-test";
  registry = new Map<string, RegistryRow>();
  chunks: ChunkRow[] = [];
  activeFingerprintSeed = "seed-active|0|";
  private idSeq = 0;
  private txn: ChunkRow[] | null = null;

  begin(): void {
    this.txn = [];
  }

  commit(): void {
    if (this.txn) {
      this.chunks.push(...this.txn);
      this.txn = null;
    }
  }

  rollback(): void {
    this.txn = null;
  }

  insertStagingChunk(row: import("./types").StagingChunkInsert): void {
    const chunk: ChunkRow = {
      id: `id-${++this.idSeq}`,
      source_type: SOURCE_TYPE_LOCALE_LESSON,
      source_id: row.sourceId,
      path_id: row.pathId,
      module_id: row.moduleId,
      lesson_id: row.lessonId,
      title: row.title,
      content: row.content,
      embedding: row.embedding,
      locale: row.locale,
      package_path: row.packagePath,
      source_sha: row.sourceSha,
      package_checksum: row.packageChecksum,
      chunk_checksum: row.chunkChecksum,
      content_version: row.contentVersion,
      index_version: row.indexVersion,
      index_state: row.indexState,
      section_index: row.sectionIndex,
      section_role: row.sectionRole,
      chunk_position: row.chunkPosition,
      content_type: row.contentType,
      production_route: row.productionRoute,
      indexing_failed: row.indexingFailed,
    };
    if (this.txn) this.txn.push(chunk);
    else this.chunks.push(chunk);
  }

  query(sql: string): string {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    let last = "";
    for (const stmt of statements) {
      last = this.execOne(stmt);
    }
    return last;
  }

  private execOne(sql: string): string {
    const s = sql.replace(/\s+/g, " ").trim();
    if (/^BEGIN$/i.test(s)) {
      this.txn = [];
      return "";
    }
    if (/^COMMIT$/i.test(s)) {
      if (this.txn) {
        this.chunks.push(...this.txn);
        this.txn = null;
      }
      return "";
    }
    if (/^ROLLBACK$/i.test(s)) {
      this.txn = null;
      return "";
    }

    if (/^INSERT INTO public\.rag_index_versions/i.test(s)) {
      const m = s.match(
        /VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i,
      );
      if (!m) throw new Error("parse registry insert failed");
      this.registry.set(m[1]!, {
        version_key: m[1]!,
        source_sha: m[2]!,
        status: m[3]!,
        package_count: Number(m[4]),
        chunk_count: Number(m[5]),
        chunk_manifest_checksum: m[6]!,
        embedding_model: m[7]!,
      });
      return "";
    }

    if (/^INSERT INTO public\.knowledge_chunks/i.test(s)) {
      const valuesIdx = s.toUpperCase().indexOf("VALUES");
      const valuesPart = s.slice(valuesIdx + 6).trim();
      const inner = valuesPart.replace(/^\(/, "").replace(/\)$/, "");
      // Split respecting quotes — simplified for test SQL builder output
      const parts: string[] = [];
      let cur = "";
      let inQuote = false;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i]!;
        if (ch === "'" && inner[i + 1] === "'") {
          cur += "''";
          i++;
          continue;
        }
        if (ch === "'") {
          inQuote = !inQuote;
          cur += ch;
          continue;
        }
        if (ch === "," && !inQuote) {
          parts.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      if (cur.trim()) parts.push(cur.trim());

      const embeddingRaw = parts[7] ?? "";
      const embedding = parseVector(embeddingRaw);
      const row: ChunkRow = {
        id: `id-${++this.idSeq}`,
        source_type: unquote(parts[0]!)!,
        source_id: unquote(parts[1]!)!,
        path_id: unquote(parts[2]!)!,
        module_id: unquote(parts[3]!)!,
        lesson_id: unquote(parts[4]!)!,
        title: unquote(parts[5]!)!,
        content: unquote(parts[6]!)!,
        embedding,
        locale: unquote(parts[8]!)!,
        package_path: unquote(parts[9]!)!,
        source_sha: unquote(parts[10]!)!,
        package_checksum: unquote(parts[11]!)!,
        chunk_checksum: unquote(parts[12]!)!,
        content_version: unquote(parts[13]!),
        index_version: unquote(parts[14]!)!,
        index_state: unquote(parts[15]!)!,
        section_index: Number(unquote(parts[16]!)!),
        section_role: unquote(parts[17]!)!,
        chunk_position: Number(unquote(parts[18]!)!),
        content_type: unquote(parts[19]!)!,
        production_route: unquote(parts[20]!),
        indexing_failed: (unquote(parts[21]!) ?? "false") === "true",
      };
      if (this.txn) this.txn.push(row);
      else this.chunks.push(row);
      return "";
    }

    if (/FROM public\.rag_index_versions/i.test(s)) {
      const keyMatch = s.match(/version_key = '([^']+)'/);
      const key = keyMatch?.[1];
      const row = key ? this.registry.get(key) : undefined;
      if (!row) return "";
      if (/version_key \|\|/i.test(s) || /version_key \|\|/.test(s)) {
        return `${row.version_key}|${row.source_sha}|${row.status}|${row.package_count}|${row.chunk_count}|${row.chunk_manifest_checksum}|${row.embedding_model}`;
      }
      return `${row.version_key}|${row.source_sha}|${row.status}|${row.package_count}|${row.chunk_count}|${row.embedding_model}|${row.chunk_manifest_checksum}`;
    }

    if (/FROM public\.knowledge_chunks/i.test(s)) {
      if (/source_id \|\|/i.test(s) && !/LIMIT 1/i.test(s)) {
        const version = s.match(/index_version = '([^']+)'/)?.[1];
        return this.chunks
          .filter((c) => c.index_version === version && c.source_type === SOURCE_TYPE_LOCALE_LESSON)
          .map(
            (row) =>
              `${row.source_id}|${row.chunk_checksum}|${row.package_checksum}|${row.source_sha}|${row.index_state}|${row.embedding.length}|${row.indexing_failed}`,
          )
          .join("\n");
      }
      if (/source_id =/i.test(s) && /LIMIT 1/i.test(s)) {
        const version = s.match(/index_version = '([^']+)'/)?.[1];
        const sourceId = s.match(/source_id = '([^']+)'/)?.[1];
        const row = this.chunks.find(
          (c) => c.index_version === version && c.source_id === sourceId,
        );
        if (!row) return "";
        return `${row.source_id}|${row.chunk_checksum}|${row.package_checksum}|${row.source_sha}|${row.index_state}|${row.embedding.length}|${row.indexing_failed}`;
      }
      if (/count\(\*\)/i.test(s)) {
        let filtered = [...this.chunks];
        const version = s.match(/index_version = '([^']+)'/)?.[1];
        if (version) filtered = filtered.filter((c) => c.index_version === version);
        if (/source_type = 'locale_lesson'/i.test(s)) {
          filtered = filtered.filter((c) => c.source_type === SOURCE_TYPE_LOCALE_LESSON);
        }
        if (/index_state = 'staging'/i.test(s)) {
          filtered = filtered.filter((c) => c.index_state === INDEX_STATE_STAGING);
        }
        if (/index_state = 'active'/i.test(s)) {
          filtered = filtered.filter((c) => c.index_state === "active");
        }
        if (/indexing_failed = false/i.test(s)) {
          filtered = filtered.filter((c) => !c.indexing_failed);
        }
        if (/vector_dims|embedding IS NULL/i.test(s)) {
          filtered = filtered.filter(
            (c) =>
              c.embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS ||
              c.embedding.some((n) => !Number.isFinite(n)),
          );
        }
        return String(filtered.length);
      }
      if (/GROUP BY locale/i.test(s)) {
        const version = s.match(/index_version = '([^']+)'/)?.[1];
        const counts = new Map<string, number>();
        for (const c of this.chunks) {
          if (version && c.index_version !== version) continue;
          if (c.source_type !== SOURCE_TYPE_LOCALE_LESSON) continue;
          if (c.index_state !== INDEX_STATE_STAGING) continue;
          counts.set(c.locale, (counts.get(c.locale) ?? 0) + 1);
        }
        return [...counts.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([locale, n]) => `${locale}=${n}`)
          .join("\n");
      }
      if (/string_agg|md5/i.test(s)) {
        return this.activeFingerprintSeed;
      }
    }

    throw new Error(`Unsupported SQL in MemorySqlExecutor: ${s.slice(0, 120)}`);
  }

  seedActiveCorpus(marker: string): void {
    this.activeFingerprintSeed = marker;
    this.chunks.push({
      id: `active-${++this.idSeq}`,
      source_type: "lesson",
      source_id: "legacy-active-1",
      path_id: "intro",
      module_id: "m1",
      lesson_id: "legacy",
      title: "legacy",
      content: "legacy",
      embedding: Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, () => 0.1),
      locale: "en",
      package_path: "legacy",
      source_sha: "legacy",
      package_checksum: "x",
      chunk_checksum: "y",
      content_version: null,
      index_version: "legacy-v0",
      index_state: "active",
      section_index: 0,
      section_role: "body",
      chunk_position: 0,
      content_type: "explanation",
      production_route: null,
      indexing_failed: false,
    });
  }
}
