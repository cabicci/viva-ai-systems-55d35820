import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/** A test may repair this owned copy; reference bytes are never the write target. */
export async function withCopiedReferenceTree<T>(
  source: string,
  callback: (ownedRoot: string) => Promise<T>,
): Promise<T> {
  const tempRoot = await fs.realpath(os.tmpdir());
  const owner = await fs.mkdtemp(path.join(tempRoot, "masaarat-owned-reference-"));
  const root = path.join(owner, "reference");
  try {
    await fs.cp(source, root, {
      recursive: true,
      force: false,
      errorOnExist: true,
      filter: async (candidate) => {
        if ((await fs.lstat(candidate)).isSymbolicLink())
          throw new Error("Linked reference input refused");
        return true;
      },
    });
    return await callback(root);
  } finally {
    // Only the exact directory created above is owned by this helper.
    const ownedPath = await fs.realpath(owner).catch(() => undefined);
    if (ownedPath === owner && path.dirname(ownedPath) === tempRoot) {
      await fs.rm(ownedPath, { recursive: true, force: true });
    } else {
      process.emitWarning("Fixture cleanup skipped because ownership could not be verified");
    }
  }
}
