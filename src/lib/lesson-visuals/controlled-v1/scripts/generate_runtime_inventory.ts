/**
 * One-shot generator: builds committed controlled-v1 runtime inventory + browser manifest
 * from authenticated evidence already in the repository. Run offline only.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { DOCS_CONTROLLED_V1, REPO_ROOT, ARTIFACTS_ROOT } from "../paths";

const REPO = REPO_ROOT;
const DOCS = DOCS_CONTROLLED_V1;
const ACC = join(DOCS, "acceptance");
const TMP = join(ARTIFACTS_ROOT, ".runtime-inventory-gen");

function sha256(buf: Buffer | string): string {
  return createHash("sha256")
    .update(typeof buf === "string" ? readFileSync(buf) : buf)
    .digest("hex")
    .toUpperCase();
}

function magic(buf: Buffer): "png" | "jpeg" | "webp" | "svg" | "unknown" {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  const head = buf.slice(0, 256).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return "svg";
  return "unknown";
}

function extractZip(zipPath: string, dest: string): void {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const tar = spawnSync("tar", ["-xf", zipPath, "-C", dest], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (tar.status !== 0) {
    throw new Error(`extract failed ${zipPath}: ${tar.stderr}`);
  }
}

function walkPngs(dir: string, acc: string[] = []): string[] {
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
    map.set(sha256(p), p);
  }
  return map;
}

type AccCell = {
  cellId: string;
  lessonId: string;
  locale: string;
  pngSha256: string;
  width?: number;
  height?: number;
};

type InventoryRow = {
  cellId: string;
  lessonId: string;
  locale: string;
  method: "A" | "C";
  acceptedDecision: "ACCEPT";
  acceptedSha256: string;
  acceptedWidth: number | null;
  acceptedHeight: number | null;
  realFormat: string;
  extension: string;
  sourcePackage: string;
  sourceRelativePath: string;
  assetKey: string;
};

const manifest = JSON.parse(
  readFileSync(join(DOCS, "PRODUCTION_MANIFEST.json"), "utf8"),
) as {
  cells: Array<{
    cellId: string;
    lessonId: string;
    locale: string;
    category: string;
  }>;
};

const methodAPilot = JSON.parse(
  readFileSync(join(ACC, "method-a-four-locale-pilot-acceptance.json"), "utf8"),
) as { acceptedCells: AccCell[]; authorizationId: string };
const methodA24 = JSON.parse(
  readFileSync(join(ACC, "method-a-remaining-24-acceptance.json"), "utf8"),
) as { acceptedCells: AccCell[]; authorizationId: string };
const b2c4 = JSON.parse(
  readFileSync(join(ACC, "method-b-to-c-four-cell-pilot-acceptance.json"), "utf8"),
) as { acceptedCells: AccCell[]; authorizationId: string };
const b2c8 = JSON.parse(
  readFileSync(join(ACC, "method-b-to-c-remaining-eight-acceptance.json"), "utf8"),
) as { acceptedCells: AccCell[]; authorizationId: string };
const selection = JSON.parse(
  readFileSync(
    join(ACC, "method-c-canonical-historical-source/method-c-remaining-selection.json"),
    "utf8",
  ),
) as { cellIds: string[] };
const preservedEv = JSON.parse(
  readFileSync(join(ACC, "method-c-preserved-pilot/EVIDENCE_MANIFEST.json"), "utf8"),
) as {
  cells: Array<{ cellId: string; relativePath: string; pngSha256: string }>;
  relatedResidueInHistoricalSourceZip: Array<{ cellId: string; pngSha256: string }>;
};

mkdirSync(TMP, { recursive: true });

const aPilotZip = join(
  ACC,
  "method-a-four-locale-pilot/method-a-builder-m7-l1-four-locale-corrected-recapture-final-pngs.zip",
);
const a24Zip = join(
  ACC,
  "method-a-remaining-24/method-a-remaining-six-lessons-24-pending-pngs.zip",
);
const b8Zip = join(
  ACC,
  "method-b-to-c-remaining-eight/method-b-to-c-remaining-eight-final-pngs.zip",
);
const histZip = join(
  ACC,
  "method-c-canonical-historical-source/controlled-v1-method-c-remaining-30221875344.zip",
);

extractZip(aPilotZip, join(TMP, "a-pilot"));
extractZip(a24Zip, join(TMP, "a-24"));
extractZip(b8Zip, join(TMP, "b8"));
extractZip(histZip, join(TMP, "hist"));

const aPilotBySha = indexBySha(join(TMP, "a-pilot"));
const a24BySha = indexBySha(join(TMP, "a-24"));
const b8BySha = indexBySha(join(TMP, "b8"));
const histBySha = indexBySha(join(TMP, "hist"));

const expected = new Map<string, { sha: string; method: "A" | "C"; package: string }>();
for (const c of methodAPilot.acceptedCells) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "A",
    package: "method-a-four-locale-pilot",
  });
}
for (const c of methodA24.acceptedCells) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "A",
    package: "method-a-remaining-24",
  });
}
for (const c of b2c4.acceptedCells) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "C",
    package: "method-b-to-c-four-cell-pilot",
  });
}
for (const c of b2c8.acceptedCells) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "C",
    package: "method-b-to-c-remaining-eight",
  });
}
for (const id of selection.cellIds) {
  const p = join(TMP, "hist/artifacts/controlled-v1/cells", id, "final.png");
  if (!existsSync(p)) throw new Error(`missing hist cell ${id}`);
  expected.set(id, {
    sha: sha256(p),
    method: "C",
    package: "method-c-canonical-historical-source",
  });
}
for (const c of preservedEv.cells) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "C",
    package: "method-c-preserved-pilot",
  });
}
for (const c of preservedEv.relatedResidueInHistoricalSourceZip) {
  expected.set(c.cellId, {
    sha: c.pngSha256.toUpperCase(),
    method: "C",
    package: "method-c-historical-source-residue",
  });
}

const dimByCell = new Map<string, { w?: number; h?: number }>();
for (const doc of [methodAPilot, methodA24, b2c4, b2c8]) {
  for (const c of doc.acceptedCells) {
    dimByCell.set(c.cellId, { w: c.width, h: c.height });
  }
}

const rows: InventoryRow[] = [];
const browserEntries: Array<{
  cellId: string;
  lessonId: string;
  locale: string;
  method: "A" | "C";
  acceptedSha256: string;
  realFormat: string;
  assetKey: string;
}> = [];

for (const cell of manifest.cells) {
  const meta = expected.get(cell.cellId);
  if (!meta) throw new Error(`no expected hash for ${cell.cellId}`);

  let sourceRelativePath = "";
  let abs: string | null = null;

  if (meta.package === "method-a-four-locale-pilot") {
    abs = aPilotBySha.get(meta.sha) ?? null;
    sourceRelativePath = abs
      ? abs.slice(join(TMP, "a-pilot").length + 1).replace(/\\/g, "/")
      : "";
  } else if (meta.package === "method-a-remaining-24") {
    abs = a24BySha.get(meta.sha) ?? null;
    sourceRelativePath = abs
      ? abs.slice(join(TMP, "a-24").length + 1).replace(/\\/g, "/")
      : "";
  } else if (meta.package === "method-b-to-c-remaining-eight") {
    abs = b8BySha.get(meta.sha) ?? null;
    sourceRelativePath = abs
      ? abs.slice(join(TMP, "b8").length + 1).replace(/\\/g, "/")
      : "";
  } else if (meta.package === "method-b-to-c-four-cell-pilot") {
    abs = join(
      ACC,
      "method-b-to-c-four-cell-pilot/cells",
      cell.cellId,
      "final.png",
    );
    sourceRelativePath = `cells/${cell.cellId}/final.png`;
  } else if (meta.package === "method-c-preserved-pilot") {
    const pe = preservedEv.cells.find((c) => c.cellId === cell.cellId)!;
    abs = join(ACC, "method-c-preserved-pilot", pe.relativePath);
    sourceRelativePath = pe.relativePath;
  } else if (
    meta.package === "method-c-canonical-historical-source" ||
    meta.package === "method-c-historical-source-residue"
  ) {
    abs = join(TMP, "hist/artifacts/controlled-v1/cells", cell.cellId, "final.png");
    sourceRelativePath = `artifacts/controlled-v1/cells/${cell.cellId}/final.png`;
  }

  if (!abs || !existsSync(abs)) {
    // hash fallback across hist
    abs = histBySha.get(meta.sha) ?? abs;
  }
  if (!abs || !existsSync(abs)) throw new Error(`missing bytes for ${cell.cellId}`);

  const buf = readFileSync(abs);
  const actual = sha256(buf);
  if (actual !== meta.sha) {
    throw new Error(`hash mismatch ${cell.cellId}: ${actual} != ${meta.sha}`);
  }
  const fmt = magic(buf);
  if (fmt === "unknown") throw new Error(`unsupported format ${cell.cellId}`);
  const ext = fmt === "jpeg" ? "jpg" : fmt;
  const assetKey = `src/assets/lesson-visuals/controlled-v1/${cell.locale}/${cell.lessonId}.${ext}`;
  const dims = dimByCell.get(cell.cellId) ?? {};

  rows.push({
    cellId: cell.cellId,
    lessonId: cell.lessonId,
    locale: cell.locale,
    method: meta.method,
    acceptedDecision: "ACCEPT",
    acceptedSha256: meta.sha,
    acceptedWidth: dims.w ?? null,
    acceptedHeight: dims.h ?? null,
    realFormat: fmt,
    extension: ext,
    sourcePackage: meta.package,
    sourceRelativePath,
    assetKey,
  });

  browserEntries.push({
    cellId: cell.cellId,
    lessonId: cell.lessonId,
    locale: cell.locale,
    method: meta.method,
    acceptedSha256: meta.sha,
    realFormat: fmt,
    assetKey,
  });
}

const byMethod = { A: rows.filter((r) => r.method === "A").length, C: rows.filter((r) => r.method === "C").length };
const byLocale: Record<string, number> = {};
for (const r of rows) byLocale[r.locale] = (byLocale[r.locale] ?? 0) + 1;
const byPkg: Record<string, number> = {};
for (const r of rows) byPkg[r.sourcePackage] = (byPkg[r.sourcePackage] ?? 0) + 1;

if (rows.length !== 400) throw new Error(`expected 400 rows, got ${rows.length}`);
if (byMethod.A !== 28 || byMethod.C !== 372) throw new Error(`method totals ${JSON.stringify(byMethod)}`);
for (const loc of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
  if (byLocale[loc] !== 100) throw new Error(`locale ${loc}=${byLocale[loc]}`);
}

const inventory = {
  schemaVersion: "controlled-v1-runtime-inventory/1",
  authorizationId: "CR-LV-RUNTIME-INTEGRATION-CORRECTION-20260801-11",
  generatedFrom: "authenticated acceptance evidence (offline)",
  counts: {
    cells: 400,
    methodA: 28,
    methodC: 372,
    locales: byLocale,
    sourcePackages: byPkg,
    realFormats: { png: rows.filter((r) => r.realFormat === "png").length },
  },
  cells: rows,
};

const browserManifest = {
  schemaVersion: "controlled-v1-browser-runtime-manifest/1",
  authorizationId: "CR-LV-RUNTIME-INTEGRATION-CORRECTION-20260801-11",
  counts: {
    cells: 400,
    methodA: 28,
    methodC: 372,
    locales: byLocale,
  },
  entries: browserEntries,
};

const invOut = join(DOCS, "RUNTIME_INVENTORY.json");
const browserOut = join(
  REPO,
  "src/lib/lesson-visuals/controlled-v1/runtime/controlledV1BrowserManifest.json",
);
mkdirSync(join(REPO, "src/lib/lesson-visuals/controlled-v1/runtime"), { recursive: true });
writeFileSync(invOut, JSON.stringify(inventory, null, 2) + "\n");
writeFileSync(browserOut, JSON.stringify(browserManifest, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      inventoryPath: invOut,
      browserManifestPath: browserOut,
      counts: inventory.counts,
    },
    null,
    2,
  ),
);
