/** Keep arithmetic and mm values in reading order inside Arabic prose. */
export function splitTechnicalText(value: string) {
  const expression = /\d+(?:\.\d+)?(?:\s*[−×÷=]\s*\d+(?:\.\d+)?)+(?:\s*mm)?|\d+(?:\.\d+)?\s*mm/g;
  const parts: { text: string; ltr: boolean }[] = [];
  let start = 0;
  for (const match of value.matchAll(expression)) {
    const index = match.index!;
    if (index > start) parts.push({ text: value.slice(start, index), ltr: false });
    parts.push({ text: match[0], ltr: true });
    start = index + match[0].length;
  }
  if (start < value.length) parts.push({ text: value.slice(start), ltr: false });
  return parts;
}
