export const ASSISTANT_VIEWPORT_PADDING = 8;
const PANEL_GAP = 12;
const PANEL_MAX_WIDTH = 448;
const PANEL_MAX_HEIGHT = 512;

export interface AssistantViewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AssistantLauncherRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AssistantPanelPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function clampAssistantLauncher(
  x: number,
  y: number,
  width: number,
  height: number,
  viewport: AssistantViewport,
) {
  const pad = ASSISTANT_VIEWPORT_PADDING;
  return {
    x: clamp(x, viewport.left + pad, viewport.left + viewport.width - width - pad),
    y: clamp(y, viewport.top + pad, viewport.top + viewport.height - height - pad),
  };
}

/** Keep the closed launcher off visible lesson actions. Candidates lie just
 * outside each control, with the nearest free position winning deterministically.
 * A null result means the viewport has no room; the caller uses normal flow. */
export function avoidAssistantControls(
  desired: { x: number; y: number }, width: number, height: number,
  viewport: AssistantViewport, controls: AssistantLauncherRect[],
): { x: number; y: number } | null {
  const gap = ASSISTANT_VIEWPORT_PADDING;
  const overlaps = (p: { x: number; y: number }) => controls.some(r =>
    p.x < r.left + r.width + gap && p.x + width + gap > r.left &&
    p.y < r.top + r.height + gap && p.y + height + gap > r.top);
  const xs = [desired.x, viewport.left + gap, viewport.left + viewport.width - width - gap];
  const ys = [desired.y, viewport.top + gap, viewport.top + viewport.height - height - gap];
  for (const r of controls) { xs.push(r.left - width - gap, r.left + r.width + gap); ys.push(r.top - height - gap, r.top + r.height + gap); }
  const candidates = xs.flatMap(x => ys.map(y => clampAssistantLauncher(x, y, width, height, viewport)))
    .filter(p => !overlaps(p));
  candidates.sort((a, b) => Math.hypot(a.x - desired.x, a.y - desired.y) - Math.hypot(b.x - desired.x, b.y - desired.y));
  return candidates[0] ?? null;
}

/** Anchor once, then keep the complete dialog inside the visible viewport. */
export function positionAssistantPanel(
  launcher: AssistantLauncherRect,
  measuredHeight: number,
  viewport: AssistantViewport,
): AssistantPanelPosition {
  const pad = ASSISTANT_VIEWPORT_PADDING;
  const width = Math.max(1, Math.min(PANEL_MAX_WIDTH, viewport.width - pad * 2));
  const preferredMaxHeight = Math.max(
    1,
    Math.min(PANEL_MAX_HEIGHT, viewport.height * 0.7, viewport.height - pad * 2),
  );
  const preferredHeight = Math.min(Math.max(0, measuredHeight), preferredMaxHeight);
  const minTop = viewport.top + pad;
  const maxBottom = viewport.top + viewport.height - pad;
  const below = launcher.top + launcher.height + PANEL_GAP;
  const availableAbove = Math.max(0, launcher.top - PANEL_GAP - minTop);
  const availableBelow = Math.max(0, maxBottom - below);
  const placeAbove =
    availableAbove >= preferredHeight ||
    (availableBelow < preferredHeight && availableAbove >= availableBelow);
  // A launcher in the middle must not cover the form. Use the roomier side
  // and let long answers scroll instead of expanding through the launcher.
  const maxHeight = Math.max(
    1,
    Math.min(preferredMaxHeight, placeAbove ? availableAbove : availableBelow),
  );
  const height = Math.min(Math.max(0, measuredHeight), maxHeight);
  const preferredTop = placeAbove ? launcher.top - PANEL_GAP - height : below;

  return {
    left: clamp(
      launcher.left + launcher.width / 2 - width / 2,
      viewport.left + pad,
      viewport.left + viewport.width - width - pad,
    ),
    top: clamp(preferredTop, minTop, maxBottom - height),
    width,
    maxHeight,
  };
}
