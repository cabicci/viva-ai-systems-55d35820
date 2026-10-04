export const RECEIPT_LIMIT = 5 * 1024 * 1024;
export function validateReceipt(bytes: Uint8Array, mime: string) {
  if (bytes.length < 8 || bytes.length > RECEIPT_LIMIT) throw new Error("Invalid receipt size");
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const pdf = new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (
    !(
      (mime === "image/png" && png) ||
      (mime === "image/jpeg" && jpeg) ||
      (mime === "application/pdf" && pdf)
    )
  )
    throw new Error("Unsupported receipt type");
}
