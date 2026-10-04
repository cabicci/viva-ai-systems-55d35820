import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadCommerceReceipt, readCommerceReceipt } from "@/lib/commerce/commerce.functions";
import { validateReceipt } from "@/lib/commerce/receipts";
import { useLocale } from "@/lib/locale/locale-context";
import { commerceCopy } from "@/lib/commerce/copy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false),
    [file, setFile] = useState<{ url: string; mime: string; name: string }>(),
    [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    let active = true;
    let url: string | undefined;
    setFile(undefined);
    setError("");
    void read({ data: { id } })
      .then((receipt) => {
        if (!active) return;
        if (!["image/png", "image/jpeg", "application/pdf"].includes(receipt.mime)) {
          throw new Error("Unsupported receipt format");
        }
        const bytes = Uint8Array.from(atob(receipt.base64), (c) => c.charCodeAt(0));
        url = URL.createObjectURL(new Blob([bytes], { type: receipt.mime }));
        setFile({
          url,
          mime: receipt.mime,
          name: `receipt-${id}.${receipt.mime === "application/pdf" ? "pdf" : receipt.mime === "image/png" ? "png" : "jpg"}`,
        });
      })
      .catch(() => {
        if (active) setError(w.error);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, id, read, w.error]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {w.viewReceipt}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto"
        dir={locale === "en" ? "ltr" : "rtl"}
        closeLabel={w.closeReceipt}
      >
        <DialogTitle className="px-6 text-start">{w.viewReceipt}</DialogTitle>
        <DialogDescription className="text-start">{w.receiptCloudNote}</DialogDescription>
        {error ? (
          <p role="alert">{error}</p>
        ) : !file ? (
          <p role="status">{w.receiptLoading}</p>
        ) : (
          <>
            {file.mime === "application/pdf" ? (
              <object
                data={file.url}
                type="application/pdf"
                aria-label={w.receipt}
                className="h-[60dvh] w-full rounded border"
              >
                <p>{w.receiptPreviewFallback}</p>
              </object>
            ) : (
              <img
                src={file.url}
                alt={w.receipt}
                className="max-h-[65dvh] w-full rounded object-contain"
              />
            )}
            {file.mime === "application/pdf" && <p>{w.receiptPreviewFallback}</p>}
            <Button asChild variant="outline" className="justify-self-start">
              <a href={file.url} download={file.name}>
                {w.downloadReceipt}
              </a>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
