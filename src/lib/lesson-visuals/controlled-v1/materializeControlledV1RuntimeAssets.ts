/**
 * Deterministic offline materialization of exactly 400 accepted controlled-v1
 * runtime assets into build-visible src/assets/lesson-visuals/controlled-v1/.
 *
 * Verifies every source and target SHA-256 against RUNTIME_INVENTORY.json.
 * Never regenerates, recompresses, or converts accepted bytes.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  METHOD_C_REMAINING_SELECTION_JSON_SHA256,
} from "./constants";
import { ARTIFACTS_ROOT, DOCS_CONTROLLED_V1, REPO_ROOT } from "./paths";

export const RUNTIME_INVENTORY_PATH = join(DOCS_CONTROLLED_V1, "RUNTIME_INVENTORY.json");
export const RUNTIME_ASSETS_ROOT = join(
  REPO_ROOT,
  "src/assets/lesson-visuals/controlled-v1",
);
export const RUNTIME_MATERIALIZE_CACHE = join(ARTIFACTS_ROOT, ".runtime-materialize-cache");

const ACC = join(DOCS_CONTROLLED_V1, "acceptance");

type InventoryCell = {
  cellId: string;
  lessonId: string;
  locale: string;
  method: "A" | "C";
  acceptedSha256: string;
  realFormat: string;
  extension: string;
  sourcePackage: string;
  sourceRelativePath: string;
  assetKey: string;
};

type InventoryDoc = {
  counts: { cells: number };
  cells: InventoryCell[];
};

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function extractZip(zipPath: string, dest: string): void {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const tar = spawnSync("tar", ["-xf", zipPath, "-C", dest], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (tar.status === 0) return;
  const unzip = spawnSync("unzip", ["-o", "-q", zipPath, "-d", dest], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (unzip.status === 0) return;
  throw new Error(`BLOCKED_RUNTIME_MATERIALIZE_EXTRACT: ${zipPath}`);
}

function walkPngs(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkPngs(p, acc);
    else if (/\.png$/i.test(name)) acc.push(p);
  }
  return acc;
}

function indexBySha(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of walkPngs(root)) {
    map.set(sha256File(p), p);
  }
  return map;
}

function ensurePackageExtract(
  packageId: string,
  zipRelative: string,
  expectedZipSha: string,
): Map<string, string> {
  const zipPath = join(ACC, zipRelative);
  if (!existsSync(zipPath)) {
    throw new Error(`BLOCKED_RUNTIME_MATERIALIZE_MISSING_ZIP: ${zipPath}`);
  }
  const zipSha = sha256File(zipPath);
  if (zipSha !== expectedZipSha) {
    throw new Error(
      `BLOCKED_RUNTIME_MATERIALIZE_ZIP_HASH: ${packageId} got ${zipSha} expected ${expectedZipSha}`,
    );
  }
  const dest = join(RUNTIME_MATERIALIZE_CACHE, packageId);
  const marker = join(dest, ".ok");
  if (!(existsSync(marker) && readFileSync(marker, "utf8").trim() === zipSha)) {
    extractZip(zipPath, dest);
    writeFileSync(marker, zipSha + "\n");
  }
  return indexBySha(dest);
}

export type MaterializeRuntimeAssetsResult = {
  ok: boolean;
  errors: string[];
  materialized: number;
  assetRoot: string;
};

export function materializeControlledV1RuntimeAssets(): MaterializeRuntimeAssetsResult {
  const errors: string[] = [];
  if (!existsSync(RUNTIME_INVENTORY_PATH)) {
    return {
      ok: false,
      errors: [`missing runtime inventory: ${RUNTIME_INVENTORY_PATH}`],
      materialized: 0,
      assetRoot: RUNTIME_ASSETS_ROOT,
    };
  }

  const inventory = JSON.parse(readFileSync(RUNTIME_INVENTORY_PATH, "utf8")) as InventoryDoc;
  if (!Array.isArray(inventory.cells) || inventory.cells.length !== 400) {
    return {
      ok: false,
      errors: [`inventory must contain exactly 400 cells, got ${inventory.cells?.length}`],
      materialized: 0,
      assetRoot: RUNTIME_ASSETS_ROOT,
    };
  }

  // Verify historical selection + zip digests when used.
  const histSel = join(ACC, "method-c-canonical-historical-source/method-c-remaining-selection.json");
  const histZip = join(
    ACC,
    "method-c-canonical-historical-source/controlled-v1-method-c-remaining-30221875344.zip",
  );
  if (sha256File(histSel) !== METHOD_C_REMAINING_SELECTION_JSON_SHA256) {
    errors.push("historical selection JSON hash mismatch");
  }
  if (sha256File(histZip) !== METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST) {
    errors.push("historical SOURCE zip digest mismatch");
  }
  if (errors.length) {
    return { ok: false, errors, materialized: 0, assetRoot: RUNTIME_ASSETS_ROOT };
  }

  const aPilot = ensurePackageExtract(
    "method-a-four-locale-pilot",
    "method-a-four-locale-pilot/method-a-builder-m7-l1-four-locale-corrected-recapture-final-pngs.zip",
    "27F0D9FD7A833658F3DEBB54C3D9795532B4E8AA1C68831FCE5A4A9B35CAB95C",
  );
  const a24 = ensurePackageExtract(
    "method-a-remaining-24",
    "method-a-remaining-24/method-a-remaining-six-lessons-24-pending-pngs.zip",
    "9C9D8CD2F0D466F07DBAB5F72E662889CE36B764B52DBA77E810120AF9FF1DCA",
  );
  const b8 = ensurePackageExtract(
    "method-b-to-c-remaining-eight",
    "method-b-to-c-remaining-eight/method-b-to-c-remaining-eight-final-pngs.zip",
    "F8237EA0EF341806489EB0B6FB6CF65CC52190A33D983E98FEFB3438545E4536",
  );
  const hist = ensurePackageExtract(
    "method-c-canonical-historical-source",
    "method-c-canonical-historical-source/controlled-v1-method-c-remaining-30221875344.zip",
    METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  );

  if (existsSync(RUNTIME_ASSETS_ROOT)) {
    rmSync(RUNTIME_ASSETS_ROOT, { recursive: true, force: true });
  }
  mkdirSync(RUNTIME_ASSETS_ROOT, { recursive: true });

  let materialized = 0;
  const seenKeys = new Set<string>();

  for (const cell of inventory.cells) {
    let sourcePath: string | undefined;

    switch (cell.sourcePackage) {
      case "method-a-four-locale-pilot":
        sourcePath = aPilot.get(cell.acceptedSha256);
        break;
      case "method-a-remaining-24":
        sourcePath = a24.get(cell.acceptedSha256);
        break;
      case "method-b-to-c-remaining-eight":
        sourcePath = b8.get(cell.acceptedSha256);
        break;
      case "method-c-canonical-historical-source":
      case "method-c-historical-source-residue":
        sourcePath =
          hist.get(cell.acceptedSha256) ??
          join(
            RUNTIME_MATERIALIZE_CACHE,
            "method-c-canonical-historical-source",
            cell.sourceRelativePath,
          );
        break;
      case "method-b-to-c-four-cell-pilot":
        sourcePath = join(
          ACC,
          "method-b-to-c-four-cell-pilot",
          cell.sourceRelativePath,
        );
        break;
      case "method-c-preserved-pilot":
        sourcePath = join(ACC, "method-c-preserved-pilot", cell.sourceRelativePath);
        break;
      default:
        errors.push(`${cell.cellId}: unknown source package ${cell.sourcePackage}`);
        continue;
    }

    if (!sourcePath || !existsSync(sourcePath)) {
      errors.push(`${cell.cellId}: missing authentic source bytes`);
      continue;
    }

    const sourceSha = sha256File(sourcePath);
    if (sourceSha !== cell.acceptedSha256) {
      errors.push(
        `${cell.cellId}: source hash mismatch got ${sourceSha} expected ${cell.acceptedSha256}`,
      );
      continue;
    }

    const resolvedOut = join(REPO_ROOT, cell.assetKey);

    if (seenKeys.has(cell.assetKey)) {
      errors.push(`${cell.cellId}: duplicate asset key ${cell.assetKey}`);
      continue;
    }
    seenKeys.add(cell.assetKey);

    mkdirSync(dirname(resolvedOut), { recursive: true });
    copyFileSync(sourcePath, resolvedOut);
    const targetSha = sha256File(resolvedOut);
    if (targetSha !== cell.acceptedSha256) {
      errors.push(
        `${cell.cellId}: target hash mismatch got ${targetSha} expected ${cell.acceptedSha256}`,
      );
      continue;
    }
    materialized++;
  }

  if (materialized !== 400 && errors.length === 0) {
    errors.push(`materialized ${materialized}, expected 400`);
  }

  writeFileSync(
    join(RUNTIME_ASSETS_ROOT, ".materialize-ok.json"),
    JSON.stringify(
      {
        ok: errors.length === 0 && materialized === 400,
        materialized,
        at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );

  return {
    ok: errors.length === 0 && materialized === 400,
    errors,
    materialized,
    assetRoot: RUNTIME_ASSETS_ROOT,
  };
}
