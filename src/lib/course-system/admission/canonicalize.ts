/** Parsed course JSON only; this profile confers no admission or release authority. */
export const COURSE_CANONICAL_JSON_VERSION = "masaarat-course-canonical-json/1" as const;

export interface CanonicalizationLimits {
  maxDepth: number;
  maxNodes: number;
  maxUtf8Bytes: number;
}

type ErrorCode =
  | "INVALID_LIMITS"
  | "MAX_DEPTH_EXCEEDED"
  | "MAX_NODES_EXCEEDED"
  | "MAX_UTF8_BYTES_EXCEEDED"
  | "UNSUPPORTED_TYPE"
  | "UNSUPPORTED_OBJECT"
  | "UNSUPPORTED_PROPERTY"
  | "ACCESSOR_PROPERTY"
  | "SPARSE_ARRAY"
  | "CYCLE"
  | "INVALID_UNICODE"
  | "REFLECTION_FAILED";

export class CourseCanonicalizationError extends Error {
  readonly code: ErrorCode;
  readonly location: string;

  constructor(code: ErrorCode, location: string) {
    // Structural indexes only: never include source keys, values or caught errors.
    const bounded = location.slice(0, 128);
    super(`${code} at ${bounded}`);
    this.name = "CourseCanonicalizationError";
    this.code = code;
    this.location = bounded;
  }
}

function fail(code: ErrorCode, location: string): never {
  throw new CourseCanonicalizationError(code, location);
}

function reflect<T>(read: () => T, location: string): T {
  try {
    return read();
  } catch {
    return fail("REFLECTION_FAILED", location);
  }
}

function readLimits(input: CanonicalizationLimits): CanonicalizationLimits {
  if (!input || typeof input !== "object") fail("INVALID_LIMITS", "$limits");
  const prototype = reflect(() => Object.getPrototypeOf(input), "$limits");
  if (prototype !== Object.prototype && prototype !== null) fail("INVALID_LIMITS", "$limits");
  const keys = reflect(() => Reflect.ownKeys(input), "$limits");
  if (keys.length !== 3) fail("INVALID_LIMITS", "$limits");
  const values: number[] = [];
  for (const [index, key] of ["maxDepth", "maxNodes", "maxUtf8Bytes"].entries()) {
    const d = reflect(() => Object.getOwnPropertyDescriptor(input, key), "$limits");
    if (!d || !("value" in d) || !Number.isSafeInteger(d.value) || d.value < (index ? 1 : 0)) {
      fail("INVALID_LIMITS", "$limits");
    }
    values.push(d.value);
  }
  return { maxDepth: values[0], maxNodes: values[1], maxUtf8Bytes: values[2] };
}

type Token = { text: string; bytes: number };

/** Validate scalars before UTF-8 encoding; TextEncoder alone replaces lone surrogates. */
function stringToken(value: string, maxBytes: number, location: string): Token {
  let bytes = 2;
  if (bytes > maxBytes) fail("MAX_UTF8_BYTES_EXCEEDED", location);
  const chunks = ['"'];
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    let text: string;
    let size: number;
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail("INVALID_UNICODE", location);
      text = value.slice(i, i + 2);
      size = 4;
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return fail("INVALID_UNICODE", location);
    } else if (c === 0x22 || c === 0x5c) {
      text = "\\" + value[i];
      size = 2;
    } else if (c < 0x20) {
      const short: Record<number, string> = {
        8: "\\b",
        9: "\\t",
        10: "\\n",
        12: "\\f",
        13: "\\r",
      };
      text = short[c] ?? "\\u" + c.toString(16).padStart(4, "0");
      size = text.length;
    } else {
      text = value[i];
      size = c < 0x80 ? 1 : c < 0x800 ? 2 : 3;
    }
    if (size > maxBytes - bytes) fail("MAX_UTF8_BYTES_EXCEEDED", location);
    bytes += size;
    chunks.push(text);
  }
  chunks.push('"');
  return { text: chunks.join(""), bytes };
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

type Frame =
  | { kind: "value"; value: unknown; depth: number; location: string }
  | { kind: "emit"; token: Token; location: string }
  | { kind: "exit"; value: object };

/**
 * Canonicalize parsed JSON using the course binary64 profile, not C1 exact-decimal commands.
 * Raw duplicate keys, BOM, source provenance and approval require a separate admission parser.
 */
export function canonicalizeCourseJson(value: unknown, limits: CanonicalizationLimits): string {
  const budget = readLimits(limits);
  const encoder = new TextEncoder();
  const output: string[] = [];
  const ancestors = new Set<object>();
  const stack: Frame[] = [{ kind: "value", value, depth: 0, location: "$" }];
  let nodes = 0;
  let bytes = 0;

  function emit(token: Token, location: string) {
    if (token.bytes > budget.maxUtf8Bytes - bytes) fail("MAX_UTF8_BYTES_EXCEEDED", location);
    bytes += token.bytes;
    output.push(token.text);
  }

  function punctuation(text: string, location: string): Frame {
    return { kind: "emit", token: { text, bytes: text.length }, location };
  }

  while (stack.length) {
    const frame = stack.pop()!;
    if (frame.kind === "emit") {
      emit(frame.token, frame.location);
      continue;
    }
    if (frame.kind === "exit") {
      ancestors.delete(frame.value);
      continue;
    }
    const { value: current, depth, location } = frame;
    if (depth > budget.maxDepth) fail("MAX_DEPTH_EXCEEDED", location);
    if (nodes >= budget.maxNodes) fail("MAX_NODES_EXCEEDED", location);
    nodes++;
    if (current === null) {
      emit({ text: "null", bytes: 4 }, location);
      continue;
    }
    if (typeof current === "boolean") {
      const text = current ? "true" : "false";
      emit({ text, bytes: text.length }, location);
      continue;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) fail("UNSUPPORTED_TYPE", location);
      const text = JSON.stringify(current); // Primitive only: no toJSON dispatch.
      emit({ text, bytes: text.length }, location);
      continue;
    }
    if (typeof current === "string") {
      emit(stringToken(current, budget.maxUtf8Bytes - bytes, location), location);
      continue;
    }
    if (typeof current !== "object") fail("UNSUPPORTED_TYPE", location);
    if (ancestors.has(current)) fail("CYCLE", location);
    const isArray = reflect(() => Array.isArray(current), location);
    const prototype = reflect(() => Object.getPrototypeOf(current), location);
    if (
      isArray ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null
    ) {
      fail("UNSUPPORTED_OBJECT", location);
    }
    const keys = reflect(() => Reflect.ownKeys(current), location);
    const children: { value: unknown; key?: Token; sort?: Uint8Array }[] = [];
    if (isArray) {
      const length = reflect(() => Object.getOwnPropertyDescriptor(current, "length"), location);
      if (
        !length ||
        !("value" in length) ||
        !Number.isSafeInteger(length.value) ||
        length.value < 0
      ) {
        fail("UNSUPPORTED_OBJECT", location);
      }
      if (length.value > budget.maxNodes - nodes) fail("MAX_NODES_EXCEEDED", location);
      for (const key of keys) {
        if (key === "length") continue;
        if (
          typeof key !== "string" ||
          !/^(0|[1-9][0-9]*)$/.test(key) ||
          Number(key) >= length.value
        ) {
          fail("UNSUPPORTED_PROPERTY", location);
        }
      }
      if (keys.length !== length.value + 1) fail("SPARSE_ARRAY", location);
      for (let i = 0; i < length.value; i++) {
        const childLocation = (location + "[" + i + "]").slice(0, 128);
        const d = reflect(() => Object.getOwnPropertyDescriptor(current, String(i)), childLocation);
        if (!d) fail("SPARSE_ARRAY", childLocation);
        if (!("value" in d)) fail("ACCESSOR_PROPERTY", childLocation);
        if (!d.enumerable) fail("UNSUPPORTED_PROPERTY", childLocation);
        children.push({ value: d.value });
      }
    } else {
      if (keys.length > budget.maxNodes - nodes) fail("MAX_NODES_EXCEEDED", location);
      for (const [index, key] of keys.entries()) {
        const memberLocation = (location + "{" + index + "}").slice(0, 128);
        if (typeof key !== "string") fail("UNSUPPORTED_PROPERTY", memberLocation);
        const d = reflect(() => Object.getOwnPropertyDescriptor(current, key), memberLocation);
        if (!d) fail("REFLECTION_FAILED", memberLocation);
        if (!("value" in d)) fail("ACCESSOR_PROPERTY", memberLocation);
        if (!d.enumerable) fail("UNSUPPORTED_PROPERTY", memberLocation);
        const token = stringToken(key, budget.maxUtf8Bytes - bytes, memberLocation);
        children.push({ value: d.value, key: token, sort: encoder.encode(key) });
      }
      children.sort((a, b) => compareBytes(a.sort!, b.sort!));
    }
    ancestors.add(current);
    emit({ text: isArray ? "[" : "{", bytes: 1 }, location);
    stack.push({ kind: "exit", value: current });
    stack.push(punctuation(isArray ? "]" : "}", location));
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const childLocation = (location + (isArray ? "[" + i + "]" : "{" + i + "}")).slice(0, 128);
      stack.push({ kind: "value", value: child.value, depth: depth + 1, location: childLocation });
      if (!isArray) {
        stack.push(punctuation(":", childLocation));
        stack.push({ kind: "emit", token: child.key!, location: childLocation });
      }
      if (i > 0) stack.push(punctuation(",", location));
    }
  }
  return output.join("");
}

/** Clean UTF-8, without BOM or final newline; no hashing or service calls. */
export function canonicalizeCourseJsonBytes(
  value: unknown,
  limits: CanonicalizationLimits,
): Uint8Array {
  return new TextEncoder().encode(canonicalizeCourseJson(value, limits));
}
