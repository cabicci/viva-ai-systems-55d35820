import { createHash } from "node:crypto";
import specification from "./audit-source-compatibility.json";
import revision42 from "./audit-source-revision-42-20261019.json";
import revisionCopy from "./audit-source-revision-43-54-141-142-20261019.json";

type SourceIdentity = { sourcePath: string; sourceSha256: string; sourceBlob: string };
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const blob = (bytes: Buffer) =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");


/** Reverse later reviewed stages while preserving the original generation identity. */
export function restoreReviewedEditorialParentSource(
  entry: SourceIdentity,
  bytes: Buffer,
): Buffer {
  let current = bytes;
  const stages = [revision42, revisionCopy];
  const seen = new Set<string>();
  for (let depth = 0; depth < stages.length; depth += 1) {
    const matches = stages.flatMap((stage) =>
      stage.entries.filter((item) =>
        item.sourcePath === entry.sourcePath &&
        item.generationSourceSha256 === entry.sourceSha256 &&
        item.generationSourceBlob === entry.sourceBlob &&
        item.currentSha256 === sha256(current) &&
        item.currentBlob === blob(current),
      ),
    );
    if (matches.length === 0) break;
    if (matches.length !== 1 || seen.has(matches[0].currentSha256)) return bytes;
    const change = matches[0];
    const parent = Buffer.from(change.beforeSource, "utf8");
    if (sha256(parent) !== change.beforeSha256 || blob(parent) !== change.beforeBlob)
      return bytes;
    seen.add(change.currentSha256);
    current = parent;
  }
  return current;
}

/**
 * Reconstruct only the exact original generation-source bytes for the
 * explicitly recorded reviewed edits. This never changes a lesson, image or manifest.
 * Every current hash, unique replacement and reconstructed hash must match;
 * any further source edit remains subject to the normal failing verifier.
 */
export function restoreExactEditorialGenerationSource(
  entry: SourceIdentity,
  bytes: Buffer,
): Buffer {
  const parent = restoreReviewedEditorialParentSource(entry, bytes);
  if (sha256(parent) === entry.sourceSha256 && blob(parent) === entry.sourceBlob) return parent;
  const change = specification.entries.find((item) => item.sourcePath === entry.sourcePath);
  if (
    !change ||
    entry.sourceSha256 !== change.generationSourceSha256 ||
    entry.sourceBlob !== change.generationSourceBlob ||
    sha256(parent) !== change.currentSha256 ||
    blob(parent) !== change.currentBlob
  )
    return bytes;
  let text = parent.toString("utf8");
  for (const replacement of change.replacements) {
    const offset = text.indexOf(replacement.after);
    if (!replacement.after || offset < 0 || text.indexOf(replacement.after, offset + 1) !== -1)
      return bytes;
    text =
      text.slice(0, offset) + replacement.before + text.slice(offset + replacement.after.length);
  }
  const original = Buffer.from(text, "utf8");
  return sha256(original) === entry.sourceSha256 && blob(original) === entry.sourceBlob
    ? original
    : bytes;
}
