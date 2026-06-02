import { useEffect, useState } from "react";
import { X, ArrowDown } from "lucide-react";

const KEY = "dashboard-welcome-hint-seen";

export function WelcomeHint({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [show]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up"
      role="dialog"
      aria-live="polite"
    >
      <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl border border-primary/40 animate-glow-pulse max-w-sm">
        <ArrowDown className="h-5 w-5 text-primary animate-bounce shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-bold">ابدأ من هنا 👇</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            افتح كرت Introduction واختار أول درس عشان نمشي خطوة بخطوة.
          </p>
        </div>
        <button
          onClick={close}
          className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10 transition shrink-0"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}