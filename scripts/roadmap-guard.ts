import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  captureLocalRoadmapState,
  inspectRoadmapBinding,
  ROADMAP_MARKER_PATH,
} from "./roadmap-state";

/** Allow the export exception only when the package sits outside a Git checkout. */
function isExportedBuild(): boolean {
  if (
    !process.argv.includes("--for-build") ||
    process.env.GIT_DIR ||
    process.env.GIT_WORK_TREE ||
    process.env.GIT_COMMON_DIR
  ) {
    return false;
  }
  const packageRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
  if (realpathSync(process.cwd()) !== packageRoot) {
    return false;
  }
  let directory = packageRoot;
  while (true) {
    try {
      lstatSync(join(directory, ".git"));
      return false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") return false;
    }
    const parent = dirname(directory);
    if (parent === directory) return true;
    directory = parent;
  }
}

try {
  const state = captureLocalRoadmapState();
  let marker: string | null = null;
  if (state.changedTrackedFiles.length && state.markerChanged) {
    try {
      if (
        !lstatSync(ROADMAP_MARKER_PATH).isFile() ||
        lstatSync(ROADMAP_MARKER_PATH).isSymbolicLink()
      )
        throw new Error("ROADMAP_MARKER_NOT_REGULAR_FILE");
      marker = readFileSync(ROADMAP_MARKER_PATH, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const result = inspectRoadmapBinding(state, marker);
  if (!result.ok) {
    console.error(`Roadmap guard blocked: ${result.reason}`);
    console.error(
      "Record the actual scoped changes through the approved roadmap path, then regenerate their local binding. Do not run database-writing tools without environment authorization.",
    );
    process.exitCode = 1;
  } else console.log(result.reason);
} catch {
  if (isExportedBuild()) {
    console.log("Roadmap binding skipped for exported source. Verify it in the Git checkout.");
  } else {
    console.error(
      "Roadmap guard unavailable: a valid repository-root Git state and readable regular files are required. No check passed; no database request was made.",
    );
    process.exitCode = 1;
  }
}
