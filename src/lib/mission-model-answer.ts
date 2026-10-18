/** Format provider/cache data as readable text without changing stored originals. */
export function normalizeMissionModelAnswer(value: unknown): string | null {
  let remaining = 200;
  const seen = new Set<object>();
  function format(input: unknown, depth: number): string {
    if (--remaining < 0 || depth > 8 || input == null) return "";
    if (typeof input === "string") {
      const text = input.trim();
      if (!text || /^(?:\[object Object\](?:\s*,\s*)?)+$/i.test(text)) return "";
      // Older providers sometimes returned JSON inside the text field.
      if (/^[\[{]/.test(text)) {
        try {
          const parsed: unknown = JSON.parse(text);
          if (parsed && typeof parsed === "object") return format(parsed, depth + 1);
        } catch {
          // A literal answer may begin with a bracket; keep that original text.
        }
      }
      return text;
    }
    if (typeof input === "number") return Number.isFinite(input) ? String(input) : "";
    if (typeof input === "boolean") return String(input);
    if (typeof input !== "object" || seen.has(input)) return "";
    seen.add(input);
    if (Array.isArray(input)) {
      return input.map((part) => format(part, depth + 1)).filter(Boolean)
        .map((part, index) => `${index + 1}. ${part}`).join("\n");
    }
    return Object.entries(input).map(([label, part]) => {
      const text = format(part, depth + 1);
      return text ? `${label}: ${text}` : "";
    }).filter(Boolean).join("\n\n");
  }
  // A primitive number/flag alone is not a useful model answer.
  if (typeof value !== "string" && (value == null || typeof value !== "object")) return null;
  return format(value, 0).slice(0, 4000).trim() || null;
}
