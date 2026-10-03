import { useLocale } from "@/lib/locale/locale-context";

/** Temporary technical-education wordmark, following the existing KIDS brand. */
export function TechnicalBrand({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  const title = locale === "en" ? "Technical education" : "التعليم الفني";
  return (
    <span
      className={compact ? "inline-flex items-center gap-1.5" : "inline-flex flex-col items-center"}
      aria-label={title}
    >
      <img
        src="/brand/masaarat-logo-lockup.png"
        alt=""
        className={compact ? "h-5 w-auto" : "h-9 w-auto"}
        loading="lazy"
      />
      <span className="inline-flex flex-col items-center leading-none" aria-hidden="true">
        <span
          dir="ltr"
          className={
            compact ? "text-sm font-black tracking-wide" : "text-lg font-black tracking-wide"
          }
          style={{ WebkitTextStroke: "0.35px #173c4f" }}
        >
          <span style={{ color: "#9be3c4" }}>T</span>
          <span style={{ color: "#3dbbbf" }}>E</span>
          <span style={{ color: "#c2acda" }}>C</span>
          <span style={{ color: "#8db3e9" }}>H</span>
        </span>
        <span className="mt-1 text-[9px] font-semibold tracking-normal text-foreground">
          {title}
        </span>
      </span>
    </span>
  );
}
