/** Remove only a leading step label whose number matches this list position. */
export function withoutMatchingStepPrefix(text: string, step: number): string {
  const prefix =
    /^(\s*)(\*\*)?(?:(?:Step|الخطوة)\s+([0-9٠-٩]+)(?:\s*[:.)—–-]\s*|\s+)|([0-9٠-٩]+)[.)]\s+)/i;
  const match = prefix.exec(text);
  if (!match) return text;
  const digits = (match[3] ?? match[4]).replace(/[٠-٩]/g, (value) =>
    String("٠١٢٣٤٥٦٧٨٩".indexOf(value)),
  );
  if (Number(digits) !== step || !text.slice(match[0].length).trim()) return text;
  return match[1] + (match[2] ?? "") + text.slice(match[0].length);
}
