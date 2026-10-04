import { unzipSync, strFromU8, zipSync, strToU8 } from "fflate";
import { recipientSchema, type Recipient } from "./contracts";
export const IMPORT_COLUMNS = [
  "email",
  "name",
  "locale",
  "package",
  "access_kind",
  "duration_days",
  "start_rule",
  "requested_start",
  "deadline",
  "market",
  "billing_interval",
  "currency",
  "method",
  "original_minor",
  "final_minor",
  "code",
] as const;
export type ImportColumn = (typeof IMPORT_COLUMNS)[number];
export type ImportTable = { headers: string[]; rows: string[][] };
const LIMIT = 1000;
export function parseCsv(text: string): ImportTable {
  if (text.length > 2_000_000) throw new Error("Import file too large");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) {
        quoted = false;
      } else if (cell === "") {
        quoted = true;
      } else throw new Error("Malformed CSV quotes");
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
    if (rows.length > LIMIT + 1 || row.length > 40 || cell.length > 4000)
      throw new Error("Import limit exceeded");
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  if (rows.length > LIMIT + 1) throw new Error("Import limit exceeded");
  return { headers: (rows.shift() ?? []).map((s) => s.replace(/^\uFEFF/, "").trim()), rows };
}
function xml(text: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("Unsupported XML declarations");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Malformed workbook XML");
  return doc;
}
/** Preflight central-directory sizes BEFORE decompression, including ZIP bombs. */
function boundedZip(bytes: Uint8Array) {
  if (bytes.length > 5_242_880 || bytes.length < 22) throw new Error("Workbook size invalid");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--)
    if (view.getUint32(p, true) === 0x06054b50) {
      end = p;
      break;
    }
  if (end < 0) throw new Error("Workbook ZIP directory missing");
  const count = view.getUint16(end + 10, true),
    offset = view.getUint32(end + 16, true);
  let p = offset,
    total = 0;
  if (count > 500 || count === 65535) throw new Error("Workbook ZIP entries invalid");
  for (let i = 0; i < count; i++) {
    if (p + 46 > end || view.getUint32(p, true) !== 0x02014b50)
      throw new Error("Malformed workbook ZIP");
    const size = view.getUint32(p + 24, true),
      nameLen = view.getUint16(p + 28, true),
      extra = view.getUint16(p + 30, true),
      comment = view.getUint16(p + 32, true);
    total += size;
    if (total > 20_000_000 || size > 8_000_000 || view.getUint16(p + 8, true) & 1)
      throw new Error("Unsafe workbook ZIP");
    const name = strFromU8(bytes.slice(p + 46, p + 46 + nameLen));
    if (name.includes("..") || /vbaProject|externalLinks/i.test(name))
      throw new Error("Unsupported workbook content");
    p += 46 + nameLen + extra + comment;
  }
  return unzipSync(bytes, {
    filter: (file) => /^(xl\/sharedStrings\.xml|xl\/worksheets\/sheet1\.xml)$/.test(file.name),
  });
}
export function parseXlsx(bytes: Uint8Array): ImportTable {
  const files = boundedZip(bytes);
  const sheet = files["xl/worksheets/sheet1.xml"];
  if (!sheet) throw new Error("First worksheet missing");
  const shared = files["xl/sharedStrings.xml"]
    ? Array.from(xml(strFromU8(files["xl/sharedStrings.xml"])).getElementsByTagName("si")).map(
        (s) =>
          Array.from(s.getElementsByTagName("t"))
            .map((t) => t.textContent ?? "")
            .join(""),
      )
    : [];
  const document = xml(strFromU8(sheet));
  const rows: string[][] = [];
  for (const row of Array.from(document.getElementsByTagName("row"))) {
    const cells: string[] = [];
    for (const cell of Array.from(row.getElementsByTagName("c"))) {
      if (cell.getElementsByTagName("f").length)
        throw new Error("Workbook formulas are not accepted");
      const reference = cell.getAttribute("r") ?? "";
      const letters = reference.match(/^([A-Z]+)[0-9]+$/)?.[1];
      if (!letters) throw new Error("Invalid cell reference");
      const col = Array.from(letters).reduce((v, c) => v * 26 + c.charCodeAt(0) - 64, 0) - 1;
      if (col > 39) throw new Error("Too many columns");
      const v = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      const value =
        cell.getAttribute("t") === "s"
          ? (shared[Number(v)] ?? "")
          : cell.getAttribute("t") === "inlineStr"
            ? Array.from(cell.getElementsByTagName("t"))
                .map((t) => t.textContent ?? "")
                .join("")
            : v;
      if (value.length > 4000) throw new Error("Cell too large");
      cells[col] = value;
    }
    if (cells.some(Boolean))
      rows.push(Array.from({ length: cells.length }, (_, i) => cells[i] ?? ""));
    if (rows.length > LIMIT + 1) throw new Error("Too many rows");
  }
  return { headers: rows.shift() ?? [], rows };
}
export type ImportPreviewRow = {
  index: number;
  raw: Record<string, string>;
  recipient?: Recipient;
  errors: string[];
  warnings: string[];
  excluded: boolean;
};
export function previewImport(
  table: ImportTable,
  mapping: Partial<Record<ImportColumn, number>>,
  defaults: Partial<Recipient>,
  existing: ReadonlySet<string> = new Set(),
): ImportPreviewRow[] {
  const seen = new Set<string>();
  return table.rows.map((cells, index) => {
    const raw: Record<string, string> = {};
    for (const [field, column] of Object.entries(mapping))
      if (column !== undefined && cells[column]?.trim()) raw[field] = cells[column].trim();
    const merged: Record<string, unknown> = { ...defaults, ...raw };
    for (const field of ["duration_days", "original_minor", "final_minor"])
      if (merged[field] !== undefined && merged[field] !== "")
        merged[field] = Number(merged[field]);
    for (const field of ["deadline", "requested_start"])
      if (typeof merged[field] === "string" && merged[field]) {
        const rawDate = merged[field] as string;
        const date = /^\d{5}(?:\.\d+)?$/.test(rawDate)
          ? new Date(Date.UTC(1899, 11, 30) + Number(rawDate) * 86400000)
          : new Date(rawDate);
        if (!isNaN(date.getTime())) merged[field] = date.toISOString();
      }
    const result = recipientSchema.safeParse(merged);
    const errors = result.success
      ? []
      : result.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`);
    const email = String(merged.email ?? "").toLowerCase();
    if (seen.has(email)) errors.push("Duplicate email in import");
    seen.add(email);
    if (result.success && new Date(result.data.deadline) <= new Date())
      errors.push("Invitation deadline has expired");
    return {
      index: index + 2,
      raw,
      recipient: result.success ? result.data : undefined,
      errors,
      warnings: existing.has(email)
        ? ["Existing confirmed order: review overlap before import"]
        : [],
      excluded: false,
    };
  });
}
/** Neutralize spreadsheet formula prefixes, including whitespace/control tricks. */
export function safeCsvCell(value: unknown) {
  const s = String(value ?? "");
  const safe = /^[\s\p{Cc}]*[=+@-]/u.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function exportCsv(headers: string[], rows: unknown[][]) {
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n");
}
const escapeXml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
export function importTemplateXlsx() {
  const sheet = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${IMPORT_COLUMNS.map((s, i) => `<c r="${String.fromCharCode(65 + i)}1" t="inlineStr"><is><t>${escapeXml(s)}</t></is></c>`).join("")}</row></sheetData></worksheet>`;
  return zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    "xl/workbook.xml": strToU8(
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Recipients" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
  });
}
