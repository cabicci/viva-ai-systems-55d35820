import { createHash } from "node:crypto";
import specification from "./audit-source-compatibility.json";

type SourceIdentity = { sourcePath: string; sourceSha256: string; sourceBlob: string };
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const blob = (bytes: Buffer) =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");

/**
 * Reconstruct only the exact original generation-source bytes for three
 * reviewed editorial edits. This never changes a lesson, image or manifest.
 * Every current hash, unique replacement and reconstructed hash must match;
 * any further source edit remains subject to the normal failing verifier.
 */
export function restoreExactEditorialGenerationSource(
  entry: SourceIdentity,
  bytes: Buffer,
): Buffer {
  const change = specification.entries.find((item) => item.sourcePath === entry.sourcePath);
  if (
    !change ||
    entry.sourceSha256 !== change.generationSourceSha256 ||
    entry.sourceBlob !== change.generationSourceBlob ||
    sha256(bytes) !== change.currentSha256 ||
    blob(bytes) !== change.currentBlob
  )
    return bytes;
  let text = bytes.toString("utf8");
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
