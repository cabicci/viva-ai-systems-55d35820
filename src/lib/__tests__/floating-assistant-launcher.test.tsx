import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FloatingAssistantLauncher,
  LEARN_ASSISTANT_LAUNCHER_POSITION_KEY,
  LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY,
} from "@/components/learn/FloatingAssistantLauncher";
import {
  clampAssistantLauncher,
  positionAssistantPanel,
} from "@/components/learn/assistant-launcher-position";

const testLocale = vi.hoisted(() => ({ locale: "ar-EG", dir: "rtl" as "rtl" | "ltr" }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => testLocale }));
vi.mock("@/lib/locale/ui-strings", () => ({ getUiString: () => "إغلاق" }));
vi.mock("@/lib/utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));

const nativeWidth = Object.getOwnPropertyDescriptor(window, "innerWidth");
const nativeHeight = Object.getOwnPropertyDescriptor(window, "innerHeight");
const nativeVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport");
let panelHeight: number;
const resizeCallbacks = new Set<() => void>();

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
}

function launcherTree(panelId = "lesson-assistant") {
  return (
    <div style={{ transform: "translateY(20px)", overflow: "hidden" }}>
      <FloatingAssistantLauncher
        panelId={panelId}
        fabLabel={testLocale.locale === "en" ? "Ask AI" : "اسأل AI"}
        fabAriaLabel={testLocale.locale === "en" ? "Ask AI" : "اسأل AI"}
        panelTitle="مساعد المسار"
      >
        <label htmlFor="test-question">سؤالك</label>
        <textarea id="test-question" />
      </FloatingAssistantLauncher>
    </div>
  );
}

function renderLauncher(panelId?: string) { return render(launcherTree(panelId)); }

function launcher() {
  return screen.getByRole("button", { name: testLocale.locale === "en" ? "Ask AI" : "اسأل AI" });
}

function pointer(type: "down" | "move" | "up" | "cancel", x: number, y: number) {
  const event = { pointerId: 1, button: 0, clientX: x, clientY: y, isPrimary: true };
  if (type === "down") fireEvent.pointerDown(launcher(), event);
  if (type === "move") fireEvent.pointerMove(launcher(), event);
  if (type === "up") fireEvent.pointerUp(launcher(), event);
  if (type === "cancel") fireEvent.pointerCancel(launcher(), event);
}

beforeEach(() => {
  localStorage.clear();
  testLocale.locale = "ar-EG"; testLocale.dir = "rtl";
  setViewport(1024, 768);
  Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined });
  panelHeight = 420;
  resizeCallbacks.clear();
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.isPrimary = init.isPrimary ?? true;
    }
  });
  vi.stubGlobal("ResizeObserver", class {
    callback: () => void;
    constructor(callback: ResizeObserverCallback) {
      this.callback = () => callback([], this as unknown as ResizeObserver);
      resizeCallbacks.add(this.callback);
    }
    observe() {}
    unobserve() {}
    disconnect() { resizeCallbacks.delete(this.callback); }
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const left = Number.parseFloat(this.style.left) || 0;
    const top = Number.parseFloat(this.style.top) || 0;
    if (this.getAttribute("role") === "dialog") {
      const height = Math.min(panelHeight, Number.parseFloat(this.style.maxHeight) || 512);
      return new DOMRect(left, top, Number.parseFloat(this.style.width) || 448, height);
    }
    return new DOMRect(left, top, 160, 48);
  });
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.getAttribute("role") === "dialog" ? panelHeight : 0;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (nativeWidth) Object.defineProperty(window, "innerWidth", nativeWidth);
  if (nativeHeight) Object.defineProperty(window, "innerHeight", nativeHeight);
  if (nativeVisualViewport) Object.defineProperty(window, "visualViewport", nativeVisualViewport);
  else Reflect.deleteProperty(window, "visualViewport");
});

describe("floating assistant activation", () => {
  it("opens exactly once after a mouse press and keeps the full dialog above the launcher", () => {
    const { container } = renderLauncher();
    pointer("down", 860, 716);
    pointer("up", 860, 716);
    fireEvent.click(launcher(), { detail: 1 });
    const dialog = screen.getByRole("dialog", { name: "مساعد المسار" });
    expect(launcher().getAttribute("aria-expanded")).toBe("true");
    expect(dialog.style.top).toBe("8px");
    expect(dialog.style.transform).toBe("");
    expect(dialog.getBoundingClientRect().bottom).toBeLessThan(launcher().getBoundingClientRect().top);
    expect(dialog.parentElement).toBe(document.body);
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.getAttribute("dir")).toBe("rtl");
    expect(document.activeElement).toBe(dialog);

    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(launcher());
  });

  it("opens for native keyboard/assistive clicks and restores focus after Escape or Close", () => {
    renderLauncher();
    launcher().focus();
    // Browsers generate detail=0 clicks from Enter/Space and assistive activation.
    fireEvent.click(launcher(), { detail: 0 });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(launcher());
    fireEvent.click(launcher(), { detail: 0 });
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(launcher());
  });

  it("keeps dragging separate from activation without suppressing the next click", () => {
    renderLauncher();
    // Start inside the actual RTL launcher, not the old hardcoded LTR end.
    const start = launcher().getBoundingClientRect();
    pointer("down", start.left + 20, start.top + 20);
    pointer("move", 100, 40);
    pointer("up", 100, 40);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(Number.parseFloat(launcher().style.top)).toBeLessThan(100);
    expect(JSON.parse(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)!)).toEqual({ version: 2, kind: "user-drag", x: 80, y: 20 });
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY)).toBeNull();
    pointer("down", 100, 40);
    pointer("up", 100, 40);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.getByRole("dialog").style.top).toBe("80px");
  });

  it("does not open on cancellation and still permits keyboard activation afterwards", () => {
    renderLauncher();
    pointer("down", 860, 716);
    pointer("cancel", 860, 716);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(launcher(), { detail: 0 });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("does not toggle from a lost pointer capture or a secondary mouse button", () => {
    renderLauncher();
    pointer("down", 860, 716);
    fireEvent.lostPointerCapture(launcher(), { pointerId: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.pointerDown(launcher(), { pointerId: 2, button: 2, clientX: 860, clientY: 716 });
    fireEvent.pointerUp(launcher(), { pointerId: 2, button: 2, clientX: 860, clientY: 716 });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("remains usable when pointer capture is unsupported", () => {
    renderLauncher();
    Object.defineProperty(launcher(), "setPointerCapture", {
      value: () => { throw new DOMException("Pointer ended", "NotFoundError"); },
    });
    pointer("down", 860, 716);
    pointer("up", 860, 716);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("repositions growing answers and keeps the dialog in a resized viewport", () => {
    panelHeight = 160;
    renderLauncher();
    fireEvent.click(launcher());
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.top).toBe("188px");
    panelHeight = 500;
    act(() => resizeCallbacks.forEach((callback) => callback()));
    expect(dialog.style.top).toBe("8px");
    setViewport(480, 320);
    fireEvent(window, new Event("resize"));
    expect(dialog.getBoundingClientRect().top).toBeGreaterThanOrEqual(8);
    expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(312);
    expect(dialog.getBoundingClientRect().right).toBeLessThanOrEqual(472);
  });

  it("responds to the visible viewport shrinking when a mobile keyboard opens", () => {
    const viewport = Object.assign(new EventTarget(), {
      width: 375, height: 700, offsetLeft: 0, offsetTop: 0,
    });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
    renderLauncher();
    fireEvent.click(launcher());
    viewport.height = 260;
    viewport.offsetTop = 100;
    act(() => viewport.dispatchEvent(new Event("resize")));
    const rect = screen.getByRole("dialog").getBoundingClientRect();
    expect(rect.top).toBeGreaterThanOrEqual(108);
    expect(rect.bottom).toBeLessThanOrEqual(352);
    expect(rect.right).toBeLessThanOrEqual(367);
  });

  it("keeps a centered launcher clear of the form and restores room when it is dragged down", () => {
    setViewport(320, 360);
    localStorage.setItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY, JSON.stringify({ version: 2, kind: "user-drag", x: 80, y: 156 }));
    renderLauncher();
    fireEvent.click(launcher());
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.maxHeight).toBe("136px");
    expect(dialog.getBoundingClientRect().bottom + 12).toBe(launcher().getBoundingClientRect().top);

    pointer("down", 100, 176);
    pointer("move", 100, 324);
    pointer("up", 100, 324);
    fireEvent.click(launcher(), { detail: 1 });
    // Intrinsic content height lets a previously clipped answer use the new room.
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(Number.parseFloat(dialog.style.maxHeight)).toBeCloseTo(252);
    expect(dialog.getBoundingClientRect().bottom + 12).toBe(launcher().getBoundingClientRect().top);
  });
});

describe("assistant panel viewport placement", () => {
  it.each([
    { left: 8, top: 8 }, { left: 152, top: 8 },
    { left: 8, top: 304 }, { left: 152, top: 304 },
  ])("keeps a long dialog visible for a launcher at $left, $top", (point) => {
    const result = positionAssistantPanel(
      { ...point, width: 160, height: 48 }, 900,
      { left: 0, top: 0, width: 320, height: 360 },
    );
    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.left + result.width).toBeLessThanOrEqual(312);
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + result.maxHeight).toBeLessThanOrEqual(352);
  });

  it("clamps saved launcher coordinates after orientation or viewport changes", () => {
    expect(clampAssistantLauncher(2000, -50, 160, 48, {
      left: 0, top: 80, width: 360, height: 280,
    })).toEqual({ x: 192, y: 88 });
  });

  it.each([
    { viewport: { left: 0, top: 0, width: 320, height: 360 }, top: 156 },
    { viewport: { left: 0, top: 100, width: 375, height: 260 }, top: 206 },
    { viewport: { left: 0, top: 0, width: 1024, height: 768 }, top: 360 },
  ])("does not overlap a centered launcher, including a raised mobile viewport", ({ viewport, top }) => {
    const launcherRect = { left: 80, top, width: 160, height: 48 };
    const result = positionAssistantPanel(launcherRect, 900, viewport);
    const above = result.top + result.maxHeight <= top - 12;
    const below = result.top >= top + launcherRect.height + 12;
    expect(above || below).toBe(true);
    expect(result.top).toBeGreaterThanOrEqual(viewport.top + 8);
    expect(result.top + result.maxHeight).toBeLessThanOrEqual(viewport.top + viewport.height - 8);
  });
});


describe("manual-only midpoint placement", () => {
  it("stays at the RTL midpoint despite crowded controls and scrolling, without writing automatic coordinates", () => {
    const legacy = JSON.stringify({ x: 850, y: 690 });
    localStorage.setItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY, legacy);
    localStorage.setItem("unrelated-owner-data", "keep");
    const write = vi.spyOn(Storage.prototype, "setItem");
    renderLauncher();
    const control = document.createElement("button");
    control.style.left = "24px"; control.style.top = "360px";
    control.setAttribute("data-assistant-avoid", "");
    Object.defineProperty(control, "getClientRects", { value: () => [control.getBoundingClientRect()] });
    document.body.appendChild(control);
    fireEvent(window, new Event("scroll"));
    expect(launcher().style.position).toBe(""); // Fixed positioning is provided by its class.
    expect(launcher().className).toContain("fixed");
    expect(launcher().parentElement).toBe(document.body);
    expect(launcher().textContent).toBe("اسأل AI");
    expect(launcher().getAttribute("aria-label")).toBe(launcher().textContent);
    expect(launcher().getBoundingClientRect().left).toBe(24);
    expect(launcher().getBoundingClientRect().top + 24).toBe(768 / 2);
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY)).toBe(legacy);
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated-owner-data")).toBe("keep");
    control.remove();
  });

  it("changes side with language before a drag and recomputes the visible midpoint on resize", () => {
    const view = renderLauncher();
    expect(launcher().style.left).toBe("24px");
    testLocale.locale = "en"; testLocale.dir = "ltr";
    view.rerender(launcherTree());
    expect(launcher().style.left).toBe("840px");
    expect(launcher().style.top).toBe("360px");
    expect(launcher().textContent).toBe("Ask AI");
    expect(launcher().getAttribute("aria-label")).toBe("Ask AI");
    setViewport(375, 700); fireEvent(window, new Event("resize"));
    expect(launcher().style.left).toBe("199px");
    expect(launcher().style.top).toBe("326px");
    testLocale.locale = "ar-Gulf"; testLocale.dir = "rtl";
    view.rerender(launcherTree());
    expect(launcher().style.left).toBe("16px");
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBeNull();
  });

  it("retains a real drag across reload, lesson remount and language changes without touching the legacy key", () => {
    const legacy = JSON.stringify({ x: 9, y: 99 });
    localStorage.setItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY, legacy);
    const view = renderLauncher();
    const start = launcher().getBoundingClientRect();
    pointer("down", start.left + 20, start.top + 20);
    pointer("move", 220, 220); pointer("up", 220, 220);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.queryByRole("dialog")).toBeNull();
    const manual = localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY);
    expect(JSON.parse(manual!)).toEqual({ version: 2, kind: "user-drag", x: 200, y: 200 });
    view.unmount();
    testLocale.locale = "en"; testLocale.dir = "ltr";
    renderLauncher("next-lesson-assistant");
    expect(launcher().style.left).toBe("200px"); expect(launcher().style.top).toBe("200px");
    expect(launcher().getAttribute("aria-controls")).toBe("next-lesson-assistant");
    fireEvent(window, new Event("scroll"));
    expect(launcher().style.top).toBe("200px");
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBe(manual);
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_POSITION_KEY)).toBe(legacy);
    fireEvent.click(launcher(), { detail: 0 });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("clamps a manual choice on resize without overwriting that choice with automatic bounds", () => {
    const manual = JSON.stringify({ version: 2, kind: "user-drag", x: 800, y: 600 });
    localStorage.setItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY, manual);
    const write = vi.spyOn(Storage.prototype, "setItem");
    renderLauncher();
    setViewport(320, 360); fireEvent(window, new Event("resize"));
    expect(launcher().style.left).toBe("152px"); expect(launcher().style.top).toBe("304px");
    fireEvent.click(launcher());
    const rect = screen.getByRole("dialog").getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(8); expect(rect.right).toBeLessThanOrEqual(312);
    expect(rect.top).toBeGreaterThanOrEqual(8); expect(rect.bottom).toBeLessThanOrEqual(352);
    setViewport(1024, 768); fireEvent(window, new Event("resize"));
    expect(launcher().style.left).toBe("800px"); expect(launcher().style.top).toBe("600px");
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBe(manual);
  });

  it("does not mark a click or sub-threshold movement as a saved manual choice", () => {
    renderLauncher(); const r = launcher().getBoundingClientRect();
    pointer("down", r.left + 10, r.top + 10);
    pointer("move", r.left + 13, r.top + 12); pointer("up", r.left + 13, r.top + 12);
    fireEvent.click(launcher(), { detail: 1 });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBeNull();
  });

  it.each(["{invalid", JSON.stringify({ x: 80, y: 20 }), JSON.stringify({ version: 2, kind: "user-drag", x: "80", y: 20 })])(
    "ignores an invalid manual record without deleting or rewriting it: %s", raw => {
      localStorage.setItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY, raw);
      renderLauncher();
      expect(launcher().style.top).toBe("360px");
      expect(localStorage.getItem(LEARN_ASSISTANT_LAUNCHER_MANUAL_POSITION_KEY)).toBe(raw);
    });
});
