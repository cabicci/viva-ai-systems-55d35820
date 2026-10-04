import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadCommerceReceipt, readCommerceReceipt } from "@/lib/commerce/commerce.functions";
import { validateReceipt } from "@/lib/commerce/receipts";
import { useLocale } from "@/lib/locale/locale-context";
import { commerceCopy } from "@/lib/commerce/copy";
import { Button } from "@/components/ui/button";
export function ReceiptUpload({
  orderId,
  onUploaded,
}: {
  orderId: string;
  onUploaded?: () => void;
}) {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    upload = useServerFn(uploadCommerceReceipt);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function submit(file: File) {
    setBusy(true);
    setStatus("");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      validateReceipt(bytes, file.type);
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      await upload({ data: { orderId, mime: file.type as "image/png", base64: btoa(binary) } });
      setStatus(w.pending);
      onUploaded?.();
    } catch {
      setStatus(w.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <label className="block text-sm font-semibold">
        {w.receipt}
        <input
          className="mt-2 block min-h-11 w-full text-sm"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void submit(file);
            e.target.value = "";
          }}
        />
      </label>
      <p role="status" className="text-sm">
        {status}
      </p>
    </div>
  );
}
export function ReceiptView({ id }: { id: string }) {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    read = useServerFn(readCommerceReceipt);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function open() {
    setBusy(true);
    try {
      const file = await read({ data: { id } });
      const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: file.mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${id}.${file.mime === "application/pdf" ? "pdf" : file.mime === "image/png" ? "png" : "jpg"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      setError(w.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void open()}>
        {w.viewReceipt}
      </Button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
