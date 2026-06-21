import { forwardRef, type SVGProps } from "react";

/**
 * Masaarat custom path icons — "Calm Line Journey" direction.
 *
 * Style rules (D1 brief):
 * - Outline only, no fills, currentColor.
 * - Default strokeWidth 1.75 to match lucide system; consumers can override.
 * - Rounded terminals and joins.
 * - 24×24 viewBox, symmetric / RTL-safe.
 *
 * Drop-in compatible with the lucide icon API (className, strokeWidth, size, …).
 */

export type PathIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

type IconBody = (props: { strokeWidth: number | string }) => React.ReactNode;

const makePathIcon = (displayName: string, body: IconBody) => {
  const Icon = forwardRef<SVGSVGElement, PathIconProps>(function PathIcon(
    { size = 24, strokeWidth = 1.75, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {body({ strokeWidth })}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
};

/** Intro — Compass: orientation, the start of the journey. Symmetric. */
export const IntroPathIcon = makePathIcon("IntroPathIcon", () => (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 5.5 L14.2 12 L12 18.5 L9.8 12 Z" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
  </>
));

/** Business — Storefront: building a practical offer, not a corporate briefcase. */
export const BusinessPathIcon = makePathIcon("BusinessPathIcon", () => (
  <>
    {/* awning */}
    <path d="M4 9 L20 9 L18.2 5.5 L5.8 5.5 Z" />
    {/* body */}
    <path d="M5 9 V20 H19 V9" />
    {/* door */}
    <path d="M10 20 V13.5 H14 V20" />
    {/* awning seam */}
    <path d="M12 5.5 V9" />
  </>
));

/** Creator — Broadcast node: publishing a signal to an audience. Symmetric. */
export const CreatorPathIcon = makePathIcon("CreatorPathIcon", () => (
  <>
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    {/* inner waves */}
    <path d="M8.4 8.4 A 5 5 0 0 0 8.4 15.6" />
    <path d="M15.6 8.4 A 5 5 0 0 1 15.6 15.6" />
    {/* outer waves */}
    <path d="M5.5 5.5 A 9 9 0 0 0 5.5 18.5" />
    <path d="M18.5 5.5 A 9 9 0 0 1 18.5 18.5" />
  </>
));

/** Analyst — Magnifier over connected data points: finding patterns. */
export const AnalystPathIcon = makePathIcon("AnalystPathIcon", () => (
  <>
    <circle cx="10" cy="10" r="6.5" />
    <path d="M14.8 14.8 L20 20" />
    {/* connected data points inside the lens */}
    <path d="M7.5 12 L10 8.5 L12.5 11 L13 8" />
    <circle cx="7.5" cy="12" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8.5" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="11" r="0.7" fill="currentColor" stroke="none" />
  </>
));

/** Automator — Connected workflow nodes on a route. Symmetric diamond. */
export const AutomatorPathIcon = makePathIcon("AutomatorPathIcon", () => (
  <>
    {/* connecting route */}
    <path d="M6 12 L12 6 L18 12 L12 18 Z" />
    {/* nodes */}
    <circle cx="12" cy="6" r="1.8" fill="var(--background, #fff)" />
    <circle cx="18" cy="12" r="1.8" fill="var(--background, #fff)" />
    <circle cx="12" cy="18" r="1.8" fill="var(--background, #fff)" />
    <circle cx="6" cy="12" r="1.8" fill="var(--background, #fff)" />
  </>
));

/** Builder — Stacked modular blocks: composing apps/systems, not carpentry. */
export const BuilderPathIcon = makePathIcon("BuilderPathIcon", () => (
  <>
    <rect x="3.75" y="3.75" width="7.5" height="7.5" rx="1.25" />
    <rect x="12.75" y="3.75" width="7.5" height="7.5" rx="1.25" />
    <rect x="3.75" y="12.75" width="7.5" height="7.5" rx="1.25" />
    <rect x="12.75" y="12.75" width="7.5" height="7.5" rx="1.25" />
  </>
));
