import { z } from "zod";
import { emailAccessInput, type EmailAccessInput } from "./email-access";

export type CanonicalInvitation = Extract<EmailAccessInput, { action: "create" }>["data"];
export type InvitationImportRow = {
  data: CanonicalInvitation;
  status: "pending" | "saved" | "uncertain";
  id?: string;
};
export class InvitationImportError extends Error {
  constructor(
    public readonly row: number,
    public readonly reason: "format" | "invalid" | "catalogue" | "key",
  ) {
    super(`Invitation import: ${reason} at row ${row}`);
  }
}
// JSON preserves explicit null (permanent), arrays, booleans and durable retry keys.
// No package defaults, email deduplication or allowance conversion is performed.
export function prepareInvitationImport(
  text: string,
  catalogues: readonly { id: string }[],
  newKey: () => string = () => crypto.randomUUID(),
): InvitationImportRow[] {
  if (text.length > 2_000_000) throw new InvitationImportError(0, "format");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new InvitationImportError(0, "format");
  }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 1000)
    throw new InvitationImportError(0, "format");
  const allowed = new Set(catalogues.map((c) => c.id)),
    keys = new Set<string>();
  return raw.map((value: unknown, index) => {
    const row = index + 1;
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new InvitationImportError(row, "invalid");
    const input = value as Record<string, unknown>;
    if (input.grant_kind !== "single_curriculum" && input.grant_kind !== "comprehensive")
      throw new InvitationImportError(row, "invalid");
    const parsed = emailAccessInput.safeParse({
      action: "create",
      data: {
        ...input,
        key: Object.hasOwn(input, "key") ? input.key : newKey(),
      },
    });
    if (!parsed.success || parsed.data.action !== "create")
      throw new InvitationImportError(row, "invalid");
    const data = parsed.data.data;
    if (
      data.catalogues.some((id) => !allowed.has(id)) ||
      new Set(data.catalogues).size !== data.catalogues.length
    )
      throw new InvitationImportError(row, "catalogue");
    const key = data.key.toLowerCase();
    if (keys.has(key)) throw new InvitationImportError(row, "key");
    keys.add(key);
    return {
      data: {
        ...data,
        key,
        email: data.email.toLowerCase(),
        catalogues: [...data.catalogues].sort(),
      },
      status: "pending",
    };
  });
}
export function exportInvitationImport(rows: readonly InvitationImportRow[]): string {
  // Export inputs only. A restored batch replays every key; it never trusts imported success claims.
  return JSON.stringify(
    rows.map((row) => row.data),
    null,
    2,
  );
}
export async function executeInvitationImport(
  rows: readonly InvitationImportRow[],
  catalogues: readonly { id: string }[],
  create: (input: Extract<EmailAccessInput, { action: "create" }>) => Promise<unknown>,
  update: (rows: InvitationImportRow[]) => void,
  isCurrent: () => boolean,
): Promise<InvitationImportRow[]> {
  let current: InvitationImportRow[] = rows.map((row) => ({ ...row }));
  if (!isCurrent()) return current;
  // Revalidate the complete batch before any write; no retired batch is adopted.
  const checked = prepareInvitationImport(exportInvitationImport(rows), catalogues);
  if (!isCurrent()) return current;
  current = checked.map((row, i) => ({ ...row, status: rows[i].status, id: rows[i].id }));
  for (let index = 0; index < current.length; index++) {
    if (!isCurrent()) return current;
    if (current[index].status === "saved") continue;
    try {
      const pending = create({ action: "create", data: current[index].data });
      // A request already handed to the server cannot be recalled on retirement.
      // Retain its key and uncertainty even if a late response cannot be adopted.
      current = current.map((row, i) => (i === index ? { ...row, status: "uncertain" } : row));
      if (isCurrent()) update(current);
      const response = await pending;
      if (!isCurrent()) return current;
      const result = z.object({ id: z.string().uuid() }).safeParse(response);
      if (!result.success) throw new Error("Uncertain create response");
      current = current.map((row, i) =>
        i === index ? { ...row, status: "saved", id: result.data.id } : row,
      );
    } catch {
      current = current.map((row, i) => (i === index ? { ...row, status: "uncertain" } : row));
      if (isCurrent()) update(current);
      return current;
    }
    if (!isCurrent()) return current;
    update(current);
  }
  return current;
}
