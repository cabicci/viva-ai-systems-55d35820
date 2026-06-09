type Props = { className?: string; size?: number };

/**
 * Masaarat brand mark.
 * Three converging upward paths (mint, teal, lavender) flowing into
 * a soft blue bowl — visual reference: approved masaarat.ai logo.
 */
export function MasaaratMark({ className, size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Three upward strokes — center tall, left teal, right lavender */}
      <rect x="30" y="6" width="4" height="26" rx="2" fill="#5BC9A4" />
      <rect
        x="18"
        y="14"
        width="4"
        height="18"
        rx="2"
        fill="#2FB8B0"
        transform="rotate(-8 20 23)"
      />
      <rect
        x="42"
        y="14"
        width="4"
        height="18"
        rx="2"
        fill="#B9A7E0"
        transform="rotate(8 44 23)"
      />
      {/* Bowl / converging V — soft blue */}
      <path
        d="M10 30 Q 32 60 54 30 L 48 30 Q 32 50 16 30 Z"
        fill="#9CB8E6"
      />
    </svg>
  );
}
