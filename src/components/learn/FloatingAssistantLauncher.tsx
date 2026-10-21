import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { cn } from "@/lib/utils";
import {
  clampAssistantLauncher,
  positionAssistantPanel,
  type AssistantPanelPosition,
  type AssistantViewport,
} from "./assistant-launcher-position";

export const LEARN_ASSISTANT_LAUNCHER_POSITION_KEY =
  "masaarat:learn-assistant-launcher-position";

const DRAG_THRESHOLD_PX = 8;
const DEFAULT_MARGIN_END_PX = 16;
const DEFAULT_MARGIN_END_SM_PX = 24;
const DEFAULT_MARGIN_BOTTOM_PX = 24;

interface StoredPosition {
  x: number;
  y: number;
}

export interface FloatingAssistantLauncherProps {
  panelId?: string;
  fabLabel: string;
  fabAriaLabel: string;
  panelTitle: string;
  children: ReactNode;
}

function readStoredPosition(): StoredPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPosition;
    if (
      typeof parsed.x === "number" &&
      Number.isFinite(parsed.x) &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function visibleViewport(): AssistantViewport {
  const viewport = window.visualViewport;
  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

function defaultLauncherPosition(
  width: number,
  height: number,
  viewport: AssistantViewport,
): StoredPosition {
  const marginEnd =
    viewport.width >= 640 ? DEFAULT_MARGIN_END_SM_PX : DEFAULT_MARGIN_END_PX;
  return {
    x: viewport.left + viewport.width - width - marginEnd,
    y: viewport.top + viewport.height - height - DEFAULT_MARGIN_BOTTOM_PX,
  };
}

function samePanelPosition(
  a: AssistantPanelPosition | null,
  b: AssistantPanelPosition,
) {
  return (
    a?.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight
  );
}

export function FloatingAssistantLauncher({
  panelId = "lesson-assistant",
  fabLabel,
  fabAriaLabel,
  panelTitle,
  children,
}: FloatingAssistantLauncherProps) {
  const { dir, locale } = useLocale();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressPointerClickRef = useRef(false);

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<StoredPosition | null>(null);
  const [panelPosition, setPanelPosition] = useState<AssistantPanelPosition | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const syncLauncherPosition = useCallback(() => {
    const el = launcherRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewport = visibleViewport();
    const stored = readStoredPosition();
    const initial = defaultLauncherPosition(rect.width, rect.height, viewport);
    const next = clampAssistantLauncher(
      stored?.x ?? initial.x,
      stored?.y ?? initial.y,
      rect.width,
      rect.height,
      viewport,
    );
    setPosition((current) =>
      current?.x === next.x && current.y === next.y ? current : next,
    );
    try {
      window.localStorage.setItem(
        LEARN_ASSISTANT_LAUNCHER_POSITION_KEY,
        JSON.stringify(next),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useLayoutEffect(() => {
    syncLauncherPosition();
  }, [portalRoot, fabLabel, syncLauncherPosition]);

  const syncPanelPosition = useCallback(() => {
    const launcher = launcherRef.current;
    const panel = panelRef.current;
    if (!launcher || !panel) return;
    const borderHeight = panel.offsetHeight - panel.clientHeight;
    const contentHeight = Math.max(
      panel.scrollHeight + borderHeight,
      panel.getBoundingClientRect().height,
    );
    const next = positionAssistantPanel(
      launcher.getBoundingClientRect(),
      contentHeight,
      visibleViewport(),
    );
    setPanelPosition((current) =>
      samePanelPosition(current, next) ? current : next,
    );
  }, []);

  useEffect(() => {
    const onResize = () => {
      syncLauncherPosition();
      syncPanelPosition();
    };
    const viewport = window.visualViewport;
    window.addEventListener("resize", onResize);
    viewport?.addEventListener("resize", onResize);
    viewport?.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      viewport?.removeEventListener("resize", onResize);
      viewport?.removeEventListener("scroll", onResize);
    };
  }, [syncLauncherPosition, syncPanelPosition]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null);
      return;
    }
    syncPanelPosition();
  }, [open, position, panelTitle, children, syncPanelPosition]);

  useEffect(() => {
    if (!open || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(syncPanelPosition);
    if (panelRef.current) observer.observe(panelRef.current);
    if (panelContentRef.current) observer.observe(panelContentRef.current);
    if (launcherRef.current) observer.observe(launcherRef.current);
    return () => observer.disconnect();
  }, [open, syncPanelPosition]);

  const closePanel = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closePanel]);

  const persistPosition = useCallback((next: StoredPosition) => {
    setPosition(next);
    try {
      window.localStorage.setItem(
        LEARN_ASSISTANT_LAUNCHER_POSITION_KEY,
        JSON.stringify(next),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const onLauncherPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (position == null || event.button !== 0 || event.isPrimary === false) return;
    suppressPointerClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    // Unsupported/lost pointer capture must not disable the button's normal click.
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* the pointer may already have ended */
    }
  };

  const onLauncherPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const el = launcherRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const rect = el.getBoundingClientRect();
    persistPosition(
      clampAssistantLauncher(
        drag.originX + dx,
        drag.originY + dy,
        rect.width,
        rect.height,
        visibleViewport(),
      ),
    );
  };

  const finishLauncherPointer = (
    event: React.PointerEvent<HTMLButtonElement>,
    cancelled = false,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    suppressPointerClickRef.current = cancelled || drag.moved;
    dragRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* capture may have been released by the browser */
    }
  };

  const onLauncherClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const suppress = suppressPointerClickRef.current;
    suppressPointerClickRef.current = false;
    // Keyboard and assistive-technology activation use detail=0, even after a drag.
    if (suppress && event.detail !== 0) return;
    if (open) closePanel();
    else setOpen(true);
  };

  const launcherStyle =
    position == null
      ? undefined
      : ({
          left: `${position.x}px`,
          top: `${position.y}px`,
        } as const);

  if (!portalRoot) return null;

  return createPortal(
    <>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          tabIndex={-1}
          dir={dir}
          className={cn(
            "fixed z-50 w-[min(calc(100vw-1rem),28rem)] max-h-[min(70vh,32rem)] overflow-y-auto",
            "rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-xl",
            panelPosition == null && "opacity-0 pointer-events-none",
          )}
          style={
            panelPosition != null
              ? {
                  left: `${panelPosition.left}px`,
                  top: `${panelPosition.top}px`,
                  width: `${panelPosition.width}px`,
                  maxHeight: `${panelPosition.maxHeight}px`,
                }
              : { left: 8, top: 8 }
          }
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md">
            <h2
              id={`${panelId}-title`}
              className="text-sm font-semibold text-foreground"
            >
              {panelTitle}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={getUiString(locale, "dashboard.hint.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={panelContentRef} className="p-4">{children}</div>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        aria-label={fabAriaLabel}
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        dir={dir}
        onClick={onLauncherClick}
        onPointerDown={onLauncherPointerDown}
        onPointerMove={onLauncherPointerMove}
        onPointerUp={(event) => finishLauncherPointer(event)}
        onPointerCancel={(event) => finishLauncherPointer(event, true)}
        onLostPointerCapture={(event) => finishLauncherPointer(event, true)}
        style={launcherStyle}
        className={cn(
          "fixed z-50 inline-flex min-h-[44px] max-w-[calc(100vw-2rem)] touch-none select-none",
          "items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-3",
          "text-sm font-medium text-foreground/90 shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.15)]",
          "backdrop-blur-md transition hover:border-primary/30 hover:bg-background/95 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "sm:max-w-none",
          position == null && "bottom-6 end-4 sm:end-6 opacity-0",
        )}
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
        <span>{fabLabel}</span>
      </button>
    </>,
    portalRoot,
  );
}
