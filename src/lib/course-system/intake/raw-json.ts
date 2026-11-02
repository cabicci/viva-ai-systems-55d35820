/** Parse author JSON without losing duplicate keys. JSON.parse alone silently
 * replaces them, which would make the reviewed order/keys ambiguous. */
export function parseIntakeJson(raw: string): unknown {
  if (new TextEncoder().encode(raw).length > 8_000_000 || raw.charCodeAt(0) === 0xfeff)
    throw new Error("INTAKE_JSON_LIMIT");
  let at = 0,
    nodes = 0;
  const fail = (): never => {
    throw new Error(`INTAKE_JSON_INVALID:${at}`);
  };
  const ws = () => {
    while (/[\x20\t\r\n]/.test(raw[at] ?? "!") && at < raw.length) at++;
  };
  const str = (): string => {
    const start = at++;
    while (at < raw.length) {
      if (raw[at] === "\\") {
        at += 2;
        continue;
      }
      if (raw[at++] === '"') {
        try {
          return JSON.parse(raw.slice(start, at));
        } catch {
          fail();
        }
      }
    }
    return fail();
  };
  const value = (depth: number): unknown => {
    if (depth > 40 || ++nodes > 200000) return fail();
    ws();
    if (raw[at] === '"') return str();
    if (raw[at] === "{") {
      at++;
      ws();
      const obj = Object.create(null) as Record<string, unknown>;
      if (raw[at] === "}") {
        at++;
        return obj;
      }
      while (at < raw.length) {
        ws();
        if (raw[at] !== '"') return fail();
        const k = str();
        if (Object.hasOwn(obj, k) || ["__proto__", "prototype", "constructor"].includes(k))
          return fail();
        ws();
        if (raw[at++] !== ":") return fail();
        obj[k] = value(depth + 1);
        ws();
        if (raw[at] === "}") {
          at++;
          return obj;
        }
        if (raw[at++] !== ",") return fail();
      }
      return fail();
    }
    if (raw[at] === "[") {
      at++;
      ws();
      const list: unknown[] = [];
      if (raw[at] === "]") {
        at++;
        return list;
      }
      while (at < raw.length) {
        list.push(value(depth + 1));
        ws();
        if (raw[at] === "]") {
          at++;
          return list;
        }
        if (raw[at++] !== ",") return fail();
      }
      return fail();
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
      raw.slice(at),
    )?.[0];
    if (!token) return fail();
    at += token.length;
    const result: unknown = JSON.parse(token);
    if (typeof result === "number" && !Number.isFinite(result)) return fail();
    return result;
  };
  const result = value(0);
  ws();
  if (at !== raw.length) return fail();
  return result;
}
