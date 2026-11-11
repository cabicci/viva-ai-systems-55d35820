import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/locale/locale-context";
import { campaignRenewalStatus } from "@/lib/billing/checkout-client";

const copy = {
  "ar-EG": {
    stop: "إيقاف التجديد",
    description: "هتحتفظ بالمدة المتبقية، والاشتراك مش هيتجدد بعدها.",
    back: "رجوع",
    done: "التجديد متوقف.",
    error: "مقدرناش نأكد إيقاف التجديد. جرّب تاني.",
    loading: "جارٍ الإيقاف…",
  },
  "ar-MSA": {
    stop: "إيقاف التجديد",
    description: "ستحتفظ بالمدة المتبقية، ولن يتجدد الاشتراك بعدها.",
    back: "رجوع",
    done: "تم إيقاف التجديد.",
    error: "تعذر تأكيد إيقاف التجديد. حاول مرة أخرى.",
    loading: "جارٍ الإيقاف…",
  },
  "ar-Gulf": {
    stop: "إيقاف التجديد",
    description: "بتبقى لك المدة المتبقية، والاشتراك ما بيتجدد بعدها.",
    back: "رجوع",
    done: "تم إيقاف التجديد.",
    error: "ما قدرنا نأكد إيقاف التجديد. جرّب مرة ثانية.",
    loading: "جارٍ الإيقاف…",
  },
  en: {
    stop: "Turn off renewal",
    description:
      "You’ll keep your remaining access. The subscription will end when that time runs out.",
    back: "Back",
    done: "Renewal is turned off.",
    error: "We couldn’t confirm that renewal was turned off. Try again.",
    loading: "Turning off renewal…",
  },
};

export function CampaignRenewalControl({ sourceKey }: { sourceKey: string }) {
  const { locale } = useLocale();
  const label = copy[locale] ?? copy.en;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const status = useQuery({
    queryKey: ["campaign-renewal", sourceKey],
    queryFn: () => campaignRenewalStatus(sourceKey),
    retry: false,
    staleTime: 30_000,
  });
  if (!status.data?.available) return null;
  if (status.data.canceled) return <p role="status">{label.done}</p>;

  async function stopRenewal() {
    setBusy(true);
    setError(false);
    try {
      const result = await campaignRenewalStatus(sourceKey, true);
      if (!result.canceled) throw new Error("CAMPAIGN_RENEWAL_NOT_CANCELED");
      await status.refetch();
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" className="mt-3" onClick={() => setOpen(true)}>
        {label.stop}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label.stop}</DialogTitle>
            <DialogDescription>{label.description}</DialogDescription>
          </DialogHeader>
          {error && <p role="alert">{label.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              {label.back}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void stopRenewal()}>
              {busy ? label.loading : label.stop}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
