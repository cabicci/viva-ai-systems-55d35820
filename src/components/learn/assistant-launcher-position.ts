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
