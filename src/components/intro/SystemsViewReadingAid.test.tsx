import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SystemsViewReadingAid } from "./SystemsViewReadingAid";
const state = vi.hoisted(() => ({ locale: "en" }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: state.locale }) }));
beforeEach(() => {
  state.locale = "en";
});
afterEach(cleanup);
it.each([
  [
    "en",
    ["1. Trigger", "2. Process", "3. Output"],
    [
      "A WhatsApp inquiry arrives",
      "Understand the request and find the price",
      "Reply to the customer and log it",
    ],
    "ltr",
  ],
  [
    "ar-Gulf",
    ["1. المُشغّل", "2. العملية", "3. الناتج"],
    ["وصل استفسار واتساب", "افهم الطلب وطلّع السعر", "رد على العميل وسجّل الطلب"],
    "rtl",
  ],
] as const)(
  "provides all three reviewed %s card examples in their logical order",
  (locale, titles, examples, dir) => {
    state.locale = locale;
    const { container } = render(
      <SystemsViewReadingAid
        cellId={`automator-m2-l1-systems-view__${locale}`}
        url="/reviewed-original.webp"
      />,
    );
    expect(screen.getAllByRole("heading", { level: 4 }).map((node) => node.textContent)).toEqual([
      ...titles,
    ]);
    for (const text of examples) expect(screen.getByText(text)).toBeTruthy();
    expect(container.firstChild).toHaveAttribute("dir", dir);
    expect(screen.queryByRole("dialog")).toBeNull();
  },
);
it("opens the original with zoom, a keyboard-focusable scroll area and Escape focus return", async () => {
  render(
    <SystemsViewReadingAid
      cellId="automator-m2-l1-systems-view__en"
      url="/reviewed-original.webp"
    />,
  );
  const trigger = screen.getByRole("button", { name: "Expand Systems View diagram" });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Systems View — original diagram" });
  const image = screen.getByRole("img", { name: "Systems View — original diagram" });
  expect(image).toHaveAttribute("src", "/reviewed-original.webp");
  expect(image).toHaveStyle({ width: "1900px" });
  expect(screen.getByRole("region", { name: "Scrollable original diagram" })).toHaveAttribute(
    "tabindex",
    "0",
  );
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  expect(image).toHaveStyle({ width: "2375px" });
  fireEvent.click(screen.getByRole("button", { name: "Original size" }));
  expect(image).toHaveStyle({ width: "1900px" });
  fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("limits the aid to the exact reviewed lesson and locale", () => {
  const { container, rerender } = render(
    <SystemsViewReadingAid cellId="another-lesson__en" url="/other.webp" />,
  );
  expect(container).toBeEmptyDOMElement();
  state.locale = "ar-MSA";
  rerender(
    <SystemsViewReadingAid cellId="automator-m2-l1-systems-view__ar-MSA" url="/other.webp" />,
  );
  expect(container).toBeEmptyDOMElement();
});
