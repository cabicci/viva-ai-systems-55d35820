export type ImmediateMailTarget = {
  stream: "welcome" | "contact" | "commerce" | "commerce_receipt";
  id: string;
};

export function isImmediateMailTarget(value: unknown): value is ImmediateMailTarget {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const target = value as Record<string, unknown>;
  return (
    Object.keys(target).length === 2 &&
    (target.stream === "welcome" ||
      target.stream === "contact" ||
      target.stream === "commerce" ||
      target.stream === "commerce_receipt") &&
    typeof target.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id)
  );
}

/** Called only after existing scheduler authorization; empty/legacy bodies stay batch. */
export async function readImmediateMailTarget(
  request: Request,
): Promise<ImmediateMailTarget | null> {
  const raw = await request.text();
  if (raw.length > 4096) throw new Error("invalid_mail_target");
  if (!raw.trim()) return null;
  const body: unknown = JSON.parse(raw);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("invalid_mail_target");
  if (!("immediate" in body)) return null;
  if (!isImmediateMailTarget(body.immediate)) throw new Error("invalid_mail_target");
  return body.immediate;
}
