import { cn } from "@/lib/utils";

const LOCKUP_SRC = "/brand/masaarat-logo-lockup.png";

type BrandMarkProps = {
  className?: string;
  alt?: string;
};

/** Approved lockup — PNG only; no SVG redraw. */
export function BrandMark({ className, alt = "مسارات" }: BrandMarkProps) {
  return (
    <img
      src={LOCKUP_SRC}
      alt={alt}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
