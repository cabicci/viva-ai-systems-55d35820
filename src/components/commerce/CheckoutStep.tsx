import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type CheckoutPresentation = {
  title: string;
  summary?: ReactNode;
  error?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/** Presentation only: financial state remains in the mounted PaymentMethods host. */
export function CheckoutStep({
  title,
  summary,
  error,
  open,
  onOpenChange,
  busy,
  disabled,
  locale,
  trigger,
  hideTrigger,
  returnFocusRef,
  children,
}: {
  title: string;
  summary?: ReactNode;
  error?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  disabled: boolean;
  locale: string;
  trigger: ReactNode;
  hideTrigger?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const english = locale === "en";
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button type="button" disabled={disabled}>
            {trigger}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        dir={english ? "ltr" : "rtl"}
        className="max-h-[85dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl text-start"
        closeLabel={english ? "Back to packages" : "العودة إلى الباقات"}
        closeDisabled={busy}
        closeButtonClassName={english ? undefined : "left-4 right-auto"}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          if (hideTrigger && returnFocusRef?.current?.isConnected) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader className="pe-6 text-start sm:text-start">
          <DialogTitle>
            {english ? "Complete checkout" : "إتمام الدفع"} — {title}
          </DialogTitle>
          <DialogDescription>
            {english
              ? "Review your selection, then choose a payment method."
              : "راجع اختيارك، ثم اختر وسيلة الدفع."}
          </DialogDescription>
        </DialogHeader>
        {summary && <div className="rounded-xl border bg-muted/30 p-3 text-sm">{summary}</div>}
        {children}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
