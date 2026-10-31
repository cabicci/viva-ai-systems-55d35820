// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  COURSE_CANONICAL_JSON_VERSION,
  CourseCanonicalizationError,
  canonicalizeCourseJson,
  canonicalizeCourseJsonBytes,
  type CanonicalizationLimits,
} from "../course-system/admission/canonicalize";
import fixture from "./fixtures/curriculum-admission/canonical-json-v1.json";

const limits = fixture.testLimits;
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

function errorFor(value: unknown, ...budgets: CanonicalizationLimits[]) {
  const budget = budgets.length ? budgets[0] : limits;
  try {
    canonicalizeCourseJson(value, budget);
  } catch (error) {
    expect(error).toBeInstanceOf(CourseCanonicalizationError);
    return error as CourseCanonicalizationError;
  }
  throw new Error("Expected a typed canonicalization error");
}

describe("course canonical JSON version 1", () => {
  it("has a domain-specific version distinct from backend decimal commands", () => {
    expect(COURSE_CANONICAL_JSON_VERSION).toBe(fixture.profile);
  });

  it.each(fixture.vectors)("matches handwritten golden bytes: $id", (golden) => {
    const input = JSON.parse(golden.inputJson);
    expect(canonicalizeCourseJson(input, limits)).toBe(golden.canonical);
    const bytes = canonicalizeCourseJsonBytes(input, limits);
    expect(bytes).toEqual(new TextEncoder().encode(golden.canonical));
    if ("utf8Hex" in golden && golden.utf8Hex) expect(hex(bytes)).toBe(golden.utf8Hex);
    expect(canonicalizeCourseJson(JSON.parse(golden.canonical), limits)).toBe(golden.canonical);
    expect(bytes[0]).not.toBe(0xef);
    expect(bytes[bytes.length - 1]).not.toBe(0x0a);
  });

  it("preserves strings and pedagogical arrays without changing frozen inputs", () => {
    const input = Object.freeze({
      z: Object.freeze(["é", "e\u0301", "  مصر  ", "٠١", "01", "😀"]),
      a: Object.freeze({ second: 2, first: 1 }),
    });
    const before = JSON.stringify(input);
    expect(canonicalizeCourseJson(input, limits)).toBe(
      '{"a":{"first":1,"second":2},"z":["é","é","  مصر  ","٠١","01","😀"]}',
    );
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.getOwnPropertyNames(input)).toEqual(["z", "a"]);
  });

  it("allows null-prototype JSON data and safe own special-name keys", () => {
    const input = Object.assign(Object.create(null), JSON.parse('{"__proto__":1,"constructor":2}'));
    expect(canonicalizeCourseJson(input, limits)).toBe('{"__proto__":1,"constructor":2}');
  });

  it("allows repeated references that are not ancestor cycles and counts each occurrence", () => {
    const shared = { a: 1 };
    expect(canonicalizeCourseJson([shared, shared], { ...limits, maxNodes: 5 })).toBe(
      '[{"a":1},{"a":1}]',
    );
    expect(errorFor([shared, shared], { ...limits, maxNodes: 4 }).code).toBe("MAX_NODES_EXCEEDED");
  });

  it.each([undefined, NaN, Infinity, -Infinity, 1n, () => 1, Symbol("private")])(
    "rejects unsupported scalar data without logging it",
    (value) => {
      expect(errorFor(value).code).toBe("UNSUPPORTED_TYPE");
    },
  );

  it.each([new Date(), new Map(), new Set(), /x/, new Number(1), new String("x")])(
    "rejects non-data objects",
    (value) => {
      expect(errorFor(value).code).toBe("UNSUPPORTED_OBJECT");
    },
  );

  it("rejects class instances and array subclasses", () => {
    class Data {
      a = 1;
    }
    class List extends Array {}
    expect(errorFor(new Data()).code).toBe("UNSUPPORTED_OBJECT");
    expect(errorFor(new List()).code).toBe("UNSUPPORTED_OBJECT");
  });

  it("does not invoke object/array getters or toJSON", () => {
    let calls = 0;
    const object = Object.defineProperty({}, "private-payload-key", {
      enumerable: true,
      get() {
        calls++;
        throw new Error("secret");
      },
    });
    const array = Object.defineProperty([0], "0", {
      enumerable: true,
      get() {
        calls++;
        return 1;
      },
    });
    const toJSON = {
      toJSON() {
        calls++;
        return {};
      },
    };
    const toJSONGetter = Object.defineProperty({}, "toJSON", {
      enumerable: true,
      get() {
        calls++;
        return () => ({});
      },
    });
    expect(errorFor(object).code).toBe("ACCESSOR_PROPERTY");
    expect(errorFor(array).code).toBe("ACCESSOR_PROPERTY");
    expect(errorFor(toJSON).code).toBe("UNSUPPORTED_TYPE");
    expect(errorFor(toJSONGetter).code).toBe("ACCESSOR_PROPERTY");
    const arrayMethod = Object.assign([], {
      toJSON() {
        calls++;
        return [];
      },
    });
    expect(errorFor(arrayMethod).code).toBe("UNSUPPORTED_PROPERTY");
    expect(calls).toBe(0);
    const error = errorFor(object);
    expect(error.message).not.toContain("private-payload-key");
    expect(error.message).not.toContain("secret");
    expect(error.location.length).toBeLessThanOrEqual(128);
  });

  it("never reads a property through a proxy get trap; reflection errors are sanitized", () => {
    let calls = 0;
    const data = new Proxy(
      { a: 1 },
      {
        get() {
          calls++;
          throw new Error("secret");
        },
      },
    );
    expect(canonicalizeCourseJson(data, limits)).toBe('{"a":1}');
    expect(calls).toBe(0);
    const hostile = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error("private-value");
        },
      },
    );
    const error = errorFor(hostile);
    expect(error.code).toBe("REFLECTION_FAILED");
    expect(error.message).not.toContain("private-value");
  });

  it("rejects hidden/symbol properties and array extras instead of silently dropping them", () => {
    expect(errorFor(Object.defineProperty({}, "a", { value: 1 })).code).toBe(
      "UNSUPPORTED_PROPERTY",
    );
    expect(errorFor({ [Symbol("key")]: 1 }).code).toBe("UNSUPPORTED_PROPERTY");
    expect(errorFor(Object.assign([1], { extra: 2 })).code).toBe("UNSUPPORTED_PROPERTY");
  });

  it("rejects sparse arrays, including trailing holes", () => {
    expect(errorFor(new Array(2)).code).toBe("SPARSE_ARRAY");
    expect(errorFor([, 1]).code).toBe("SPARSE_ARRAY");
    expect(errorFor([1, ,]).code).toBe("SPARSE_ARRAY");
  });

  it("rejects object and array cycles without mutating them", () => {
    const object: Record<string, unknown> = {};
    object.self = object;
    const array: unknown[] = [];
    array.push(array);
    expect(errorFor(object).code).toBe("CYCLE");
    expect(errorFor(array).code).toBe("CYCLE");
    expect(object.self).toBe(object);
    expect(array[0]).toBe(array);
  });

  it.each(["\ud800", "\udfff", "x\ud800z", "\ud800\ud800"])(
    "rejects lone surrogates in values and keys",
    (value) => {
      expect(errorFor(value).code).toBe("INVALID_UNICODE");
      expect(errorFor({ [value]: 1 }).code).toBe("INVALID_UNICODE");
    },
  );

  it("preserves every valid scalar boundary and never Unicode-normalizes", () => {
    const input = "\u007f\u0080\u07ff\u0800\ud7ff\ue000\uffff\ud800\udc00\udbff\udfff";
    expect(canonicalizeCourseJson(input, limits)).toBe('"' + input + '"');
    expect(canonicalizeCourseJson("é", limits)).not.toBe(canonicalizeCourseJson("e\u0301", limits));
  });

  it("counts depth from root zero for both objects and arrays", () => {
    expect(canonicalizeCourseJson(null, { ...limits, maxDepth: 0 })).toBe("null");
    expect(canonicalizeCourseJson([], { ...limits, maxDepth: 0 })).toBe("[]");
    expect(canonicalizeCourseJson({}, { ...limits, maxDepth: 0 })).toBe("{}");
    expect(canonicalizeCourseJson({ a: [0] }, { ...limits, maxDepth: 2 })).toBe('{"a":[0]}');
    expect(errorFor({ a: [0] }, { ...limits, maxDepth: 1 }).code).toBe("MAX_DEPTH_EXCEEDED");
  });

  it("counts every value occurrence, but not keys, as a node", () => {
    expect(canonicalizeCourseJson({ a: [0] }, { ...limits, maxNodes: 3 })).toBe('{"a":[0]}');
    expect(errorFor({ a: [0] }, { ...limits, maxNodes: 2 }).code).toBe("MAX_NODES_EXCEEDED");
    expect(canonicalizeCourseJson({}, { ...limits, maxNodes: 1 })).toBe("{}");
  });

  it.each([
    { value: "م😀", bytes: 8, expected: '"م😀"' },
    { value: { م: "😀" }, bytes: 13, expected: '{"م":"😀"}' },
    { value: "\u0000", bytes: 8, expected: '"\\u0000"' },
    { value: { "\n": 0 }, bytes: 8, expected: '{"\\n":0}' },
    { value: null, bytes: 4, expected: "null" },
    { value: [], bytes: 2, expected: "[]" },
  ])("honors exact emitted UTF-8 byte boundary: $bytes", ({ value, bytes, expected }) => {
    const budget = { ...limits, maxUtf8Bytes: bytes };
    expect(canonicalizeCourseJson(value, budget)).toBe(expected);
    expect(canonicalizeCourseJsonBytes(value, budget).length).toBe(bytes);
    expect(errorFor(value, { ...budget, maxUtf8Bytes: bytes - 1 }).code).toBe(
      "MAX_UTF8_BYTES_EXCEEDED",
    );
    expect(() =>
      canonicalizeCourseJsonBytes(value, { ...budget, maxUtf8Bytes: bytes - 1 }),
    ).toThrow(CourseCanonicalizationError);
  });

  it.each([
    undefined,
    null,
    {},
    [],
    { ...limits, extra: 1 },
    { ...limits, maxDepth: -1 },
    { ...limits, maxDepth: 0.5 },
    { ...limits, maxDepth: Number.MAX_SAFE_INTEGER + 1 },
    { ...limits, maxNodes: 0 },
    { ...limits, maxNodes: Infinity },
    { ...limits, maxUtf8Bytes: 0 },
    { ...limits, maxUtf8Bytes: "100" },
  ])("requires explicit safe technical budgets", (budget) => {
    expect(errorFor(null, budget as CanonicalizationLimits).code).toBe("INVALID_LIMITS");
  });

  it("does not invoke limit accessors", () => {
    let calls = 0;
    const budget = Object.defineProperty({ maxNodes: 1, maxUtf8Bytes: 4 }, "maxDepth", {
      enumerable: true,
      get() {
        calls++;
        return 0;
      },
    });
    expect(errorFor(null, budget as CanonicalizationLimits).code).toBe("INVALID_LIMITS");
    expect(calls).toBe(0);
  });

  it("supports safe-integer budget ceilings without an implicit production default", () => {
    expect(
      canonicalizeCourseJson(0, {
        maxDepth: Number.MAX_SAFE_INTEGER,
        maxNodes: Number.MAX_SAFE_INTEGER,
        maxUtf8Bytes: Number.MAX_SAFE_INTEGER,
      }),
    ).toBe("0");
  });

  it("uses an iterative walk for deeply nested data and bounds error locations", () => {
    let value: unknown = 0;
    for (let i = 0; i < 12_000; i++) value = [value];
    const deepLimits = { maxDepth: 12_000, maxNodes: 12_001, maxUtf8Bytes: 24_001 };
    const output = canonicalizeCourseJson(value, deepLimits);
    expect(output.length).toBe(24_001);
    expect(output.startsWith("[[[")).toBe(true);
    const error = errorFor(value, { ...deepLimits, maxDepth: 11_999 });
    expect(error.code).toBe("MAX_DEPTH_EXCEEDED");
    expect(error.location.length).toBeLessThanOrEqual(128);
  });
});
