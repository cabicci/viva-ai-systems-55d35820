import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MessageCircle, X } from "lucide-react";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { cn } from "@/lib/utils";

export const LEARN_ASSISTANT_LAUNCHER_POSITION_KEY =
  "masaarat:learn-assistant-launcher-position";

const DRAG_THRESHOLD_PX = 8;
const VIEWPORT_PAD_PX = 8;
const PANEL_GAP_PX = 12;
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

function defaultLauncherPosition(width: number, height: number): StoredPosition {
  const marginEnd =
    window.innerWidth >= 640 ? DEFAULT_MARGIN_END_SM_PX : DEFAULT_MARGIN_END_PX;
  return {
    x: window.innerWidth - width - marginEnd,
    y: window.innerHeight - height - DEFAULT_MARGIN_BOTTOM_PX,
  };
}

function clampLauncherPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): StoredPosition {
  const maxX = Math.max(VIEWPORT_PAD_PX, window.innerWidth - width - VIEWPORT_PAD_PX);
  const maxY = Math.max(VIEWPORT_PAD_PX, window.innerHeight - height - VIEWPORT_PAD_PX);
  return {
    x: Math.min(Math.max(VIEWPORT_PAD_PX, x), maxX),
    y: Math.min(Math.max(VIEWPORT_PAD_PX, y), maxY),
  };
}

function clampPanelLeft(
  launcherX: number,
  launcherWidth: number,
  panelWidth: number,
): number {
  const centeredX = launcherX + launcherWidth / 2 - panelWidth / 2;
  const maxPanelWidth = Math.min(window.innerWidth - VIEWPORT_PAD_PX * 2, 448);
  const width = panelWidth || maxPanelWidth;
  return Math.min(
    Math.max(VIEWPORT_PAD_PX, centeredX),
    Math.max(VIEWPORT_PAD_PX, window.innerWidth - width - VIEWPORT_PAD_PX),
  );
}

function panelBottomOffset(launcherY: number): number {
  return window.innerHeight - launcherY + PANEL_GAP_PX;
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
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<StoredPosition | null>(null);
  const [panelLeft, setPanelLeft] = useState<number | null>(null);
  const [panelBottom, setPanelBottom] = useState<number | null>(null);

  const syncLauncherPosition = useCallback(() => {
    const el = launcherRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const stored = readStoredPosition();
    const next = clampLauncherPosition(
      stored?.x ?? defaultLauncherPosition(rect.width, rect.height).x,
      stored?.y ?? defaultLauncherPosition(rect.width, rect.height).y,
      rect.width,
      rect.height,
    );
    setPosition(next);
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
  }, [syncLauncherPosition]);

  useEffect(() => {
    const onResize = () => syncLauncherPosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncLauncherPosition]);

  useLayoutEffect(() => {
    if (!open) {
      setPanelLeft(null);
      setPanelBottom(null);
      return;
    }
    const launcher = launcherRef.current;
    const panel = panelRef.current;
    if (!launcher || !panel || position == null) return;
    const launcherRect = launcher.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    setPanelLeft(
      clampPanelLeft(launcherRect.x, launcherRect.width, panelRect.width),
    );
    setPanelBottom(panelBottomOffset(launcherRect.y));
  }, [open, position, panelTitle]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

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
    if (position == null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
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

    const rect = el.getBoundingClientRect();
    persistPosition(
      clampLauncherPosition(drag.originX + dx, drag.originY + dy, rect.width, rect.height),
    );
  };

  const finishLauncherPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.moved) {
      setOpen((current) => !current);
    }

    dragRef.current = null;
  };

  const launcherStyle =
    position == null
      ? undefined
      : ({
          left: `${position.x}px`,
          top: `${position.y}px`,
        } as const);

  return (
    <>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          dir={dir}
          className={cn(
            "fixed z-40 w-[min(calc(100vw-2rem),28rem)] max-h-[min(70vh,32rem)] overflow-y-auto",
            "rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-xl",
            panelLeft == null && "opacity-0 pointer-events-none",
          )}
          style={
            panelLeft != null && panelBottom != null
              ? {
                  left: `${panelLeft}px`,
                  bottom: `${panelBottom}px`,
                  transform: "translateY(-100%)",
                }
              : { left: `${position?.x ?? VIEWPORT_PAD_PX}px`, bottom: "6rem" }
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
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={getUiString(locale, "dashboard.hint.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      ) : null}

      <button
        ref={launcherRef}
        type="button"
        aria-label={fabAriaLabel}
        aria-controls={panelId}
        aria-expanded={open}
        onPointerDown={onLauncherPointerDown}
        onPointerMove={onLauncherPointerMove}
        onPointerUp={finishLauncherPointer}
        onPointerCancel={finishLauncherPointer}
        style={launcherStyle}
        className={cn(
          "fixed z-40 inline-flex min-h-[44px] max-w-[calc(100vw-2rem)] touch-none select-none",
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
    </>
  );
}
