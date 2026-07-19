import { sha256Bytes } from "./identity";
import type { ExistingCorpusRecord, PortableVectorRecord } from "./types";

/** Synthetic existing corpus — stands in for Production ar-EG without touching real data. */
export function makeExistingCorpus(count: number): ExistingCorpusRecord[] {
  const records: ExistingCorpusRecord[] = [];
  for (let i = 1; i <= count; i++) {
    const lessonId = `legacy-l${i}`;
    const chunkId = `legacy/${lessonId}/c0`;
    records.push({
      recordKey: `ar-EG::${lessonId}::${chunkId}`,
      locale: "ar-EG",
      lessonId,
      chunkId,
      chunkChecksum: sha256Bytes(`legacy-content-${i}`),
      sourceType: "lesson",
    });
  }
  return records;
}

export function makeSyntheticVector(
  locale: string,
  lessonId: string,
  chunkIndex: number,
  dims: number,
  model: string,
): PortableVectorRecord {
  const chunkId = `${locale}/${lessonId}/s0/c${chunkIndex}`;
  const text = `${locale}:${lessonId}:chunk:${chunkIndex}`;
  const checksum = sha256Bytes(text);
  const embedding = new Array<number>(dims);
  for (let i = 0; i < dims; i++) {
    embedding[i] = ((parseInt(checksum.slice(i % 32, (i % 32) + 2) || "0", 16) % 1000) / 1000);
  }
  return {
    chunkId,
    lessonId,
    locale,
    trackId: "track-a",
    moduleId: "module-a",
    packagePath: `fixtures/${locale}/${lessonId}.json`,
    sourceSha: "synthetic-source-sha",
    packageChecksum: sha256Bytes(`${locale}:${lessonId}`),
    chunkChecksum: checksum,
    contentVersion: "v1",
    sectionIndex: 0,
    sectionRole: "explanation",
    chunkIndex,
    contentType: "explanation",
    productionRoute: `/${locale}/${lessonId}`,
    model,
    vectorDimensions: dims,
    embedding,
  };
}

/** Build N synthetic localized records across locales — size is a parameter, not a constant. */
export function makeSyntheticLocalizedCorpus(options: {
  perLocale: number;
  locales?: string[];
  dims?: number;
  model?: string;
}): PortableVectorRecord[] {
  const locales = options.locales ?? ["en", "ar-MSA", "ar-Gulf"];
  const dims = options.dims ?? 8;
  const model = options.model ?? "text-embedding-3-small";
  const records: PortableVectorRecord[] = [];
  for (const locale of locales) {
    for (let i = 1; i <= options.perLocale; i++) {
      records.push(makeSyntheticVector(locale, `lesson-${i}`, 0, dims, model));
    }
  }
  return records.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
}
