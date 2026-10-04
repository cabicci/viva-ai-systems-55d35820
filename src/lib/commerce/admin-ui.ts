export function download(
  name: string,
  content: string | Uint8Array,
  mime = "text/csv;charset=utf-8",
) {
  const bytes = typeof content === "string" ? content : new Uint8Array(content);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const packages = ["pro", "pro_plus", "kids"] as const;
/** Parse a displayed EGP/USD amount exactly; storage and RPCs keep minor units. */
export function moneyToMinor(value: string): number {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace("٫", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor <= 1_000_000_000 ? minor : NaN;
}
export const instant = (value: string) => new Date(value).toISOString();
export const localDateInput = (value: string | number) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const dayInput = (days: number) => localDateInput(Date.now() + days * 86400000);
