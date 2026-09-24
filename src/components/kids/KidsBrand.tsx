import { getKidsCopy } from "@/lib/kids/copy";
import { useLocale } from "@/lib/locale/locale-context";

export function KidsBrand({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  return (
    <span
      className={compact ? "inline-flex items-center gap-1.5" : "inline-flex flex-col items-center"}
      aria-label={getKidsCopy(locale).title}
    >
      <img
        src="/brand/masaarat-logo-lockup.png"
        alt=""
        className={compact ? "h-5 w-auto" : "h-9 w-auto"}
        loading="lazy"
      />
      <span
        dir="ltr"
        aria-hidden="true"
        className={
          compact ? "text-sm font-black tracking-wide" : "text-lg font-black tracking-wide"
        }
        style={{ WebkitTextStroke: "0.35px #173c4f" }}
      >
        <span style={{ color: "#9be3c4" }}>K</span>
        <span style={{ color: "#3dbbbf" }}>I</span>
        <span style={{ color: "#c2acda" }}>D</span>
        <span style={{ color: "#8db3e9" }}>S</span>
      </span>
    </span>
  );
}
