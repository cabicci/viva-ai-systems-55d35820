import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NativeAssistantPreparationPanel } from "@/components/admin/NativeAssistantPreparationPanel";
const mocks = vi.hoisted(() => ({ list: vi.fn(), card: vi.fn(), academic: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/native-assistant-preparation.functions", () => ({ getNativePreparationCards: mocks.list }));
vi.mock("@/lib/card-assistant/assistant.functions", () => ({ indexCardAssistant: mocks.card }));
vi.mock("@/lib/academic-education/assistant.functions", () => ({ indexAcademicAssistant: mocks.academic }));
const key = "masaarat-native-preparation-v1:owner:kids:new-card";
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mocks.list.mockResolvedValue({ operatorId: "owner", cards: [
    { area: "kids", cardId: "new-card", scopes: 2 },
    { area: "academic", cardId: "AC-NEW", scopes: 1 },
  ] });
  mocks.card.mockImplementation(async ({ data }) => ({ nextOffset: data.offset === 0 ? 1 : null }));
  mocks.academic.mockResolvedValue({ nextOffset: null });
});
async function open() {
  const mounted = render(<NativeAssistantPreparationPanel />);
  fireEvent.click(screen.getByRole("button", { name: "عرض مسارات التجهيز" }));
  await screen.findByRole("option", { name: /new-card/ });
  return mounted;
}
async function agree() {
  const consent = screen.getByRole("checkbox", { name: "أوافق على تجهيز محتوى المسار المحدد وتكلفة فهرسته." });
  await waitFor(() => expect(consent).not.toBeDisabled());
  fireEvent.click(consent);
}
it("never reads private metadata or starts indexing on mount", () => {
  render(<NativeAssistantPreparationPanel />);
  expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.card).not.toHaveBeenCalled();
});
it("loads new registered cards and requires explicit preparation consent", async () => {
  await open();
  expect(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" })).toBeDisabled();
  expect(mocks.card).not.toHaveBeenCalled();
});
it("finishes each bounded scope before advancing and never activates runtime", async () => {
  await open(); await agree();
  fireEvent.click(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" }));
  await screen.findByText(/اكتمل تجهيز هذا المسار/);
  expect(mocks.card.mock.calls.map(([arg]) => arg.data.offset)).toEqual([0, 1]);
  expect(mocks.academic).not.toHaveBeenCalled();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ next: 1, pending: false, complete: true });
});
it("uses the academic native authorization transport for academic cards", async () => {
  await open();
  fireEvent.change(screen.getByRole("combobox", { name: "المسار" }), { target: { value: "academic:AC-NEW" } });
  await agree(); fireEvent.click(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" }));
  await waitFor(() => expect(mocks.academic).toHaveBeenCalledTimes(1));
  expect(mocks.academic).toHaveBeenCalledWith({ data: { courseId: "AC-NEW", offset: 0, batchSize: 1 } });
  expect(mocks.card).not.toHaveBeenCalled();
});
it("persists an uncertain request before calling and requires review after remount", async () => {
  mocks.card.mockImplementation(async () => {
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({ pending: true, next: 0 });
    throw new Error("response lost");
  });
  const mounted = await open(); await agree();
  fireEvent.click(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" }));
  await screen.findByText(/دون إعادة محاولة تلقائية/);
  expect(mocks.card).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await open();
  expect(screen.getByRole("checkbox", { name: /راجعت نتيجة الطلب السابق/ })).not.toBeChecked();
  await agree();
  expect(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" })).toBeDisabled();
});
it("rejects non-monotonic batch progress without another provider request", async () => {
  mocks.card.mockResolvedValue({ nextOffset: 0 });
  await open(); await agree();
  fireEvent.click(screen.getByRole("button", { name: "تجهيز المسار أو استكماله" }));
  await screen.findByText(/دون إعادة محاولة تلقائية/);
  expect(mocks.card).toHaveBeenCalledTimes(1);
});
it("rechecks from the beginning after a previously completed run", async () => {
  localStorage.setItem(key, JSON.stringify({ next: 1, pending: false, complete: true }));
  await open(); await agree();
  fireEvent.click(screen.getByRole("button", { name: "إعادة فحص وتجهيز المسار" }));
  await waitFor(() => expect(mocks.card).toHaveBeenCalledTimes(2));
  expect(mocks.card.mock.calls[0][0].data.offset).toBe(0);
});
it("keeps another administrator's unfinished request separate", async () => {
  localStorage.setItem(key, JSON.stringify({ next: 1, pending: true, complete: false }));
  mocks.list.mockResolvedValue({ operatorId: "other-owner", cards: [{ area: "kids", cardId: "new-card", scopes: 2 }] });
  await open();
  expect(screen.queryByRole("checkbox", { name: /راجعت نتيجة الطلب السابق/ })).not.toBeInTheDocument();
  expect(screen.getByText("المصادر: 2. الدفعة التالية: 1.")).toBeInTheDocument();
});
