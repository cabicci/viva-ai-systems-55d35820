import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantUsage } from "./AssistantUsage";
const state = vi.hoisted(() => ({ balance: vi.fn() }));
vi.mock("@/lib/billing/question-balance.functions", () => ({ getAssistantQuestionBalance: state.balance }));
const scope = { area: "kids" as const, cardId: "level-1", profileId: "22222222-2222-4222-8222-222222222222", locale: "ar-EG" as const };
const rights = { monthly_remaining: 10, purchased_remaining: 90, access_allowed: true, session_key: "session-a" };
const view = (accountId = "owner") => <AssistantUsage scope={scope} cardTitle="رحلة الأطفال" accountId={accountId} busy={false} isCurrent={() => true} />;
const acknowledge = async () => { const dialog = await screen.findByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "فهمت، ابدأ" })); };
beforeEach(() => { window.sessionStorage.clear(); state.balance.mockReset().mockResolvedValue(rights); });

describe("assistant rights popup", () => {
  it("opens a real dialog with confirmed rights, current curriculum and family balance", async () => {
    render(view());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("المنهج الحالي: رحلة الأطفال")).toBeInTheDocument();
    expect(within(dialog).getByText("رصيد الحصص الحالية: 10 · رصيد مشترك للأسرة: 90")).toBeInTheDocument();
    expect(within(dialog).getByText(/تقدر تستخدم المساعد في المحتوى المتاح/)).toBeInTheDocument();
    expect(within(dialog).getByText(/أول محاولتين خارج المنهج/)).toBeInTheDocument();
    expect(within(dialog).getByText(/كل طفل بيستخدم حصته الأول/)).toBeInTheDocument();
    expect(state.balance).toHaveBeenCalledWith({ data: { expectedAccountId: "owner", area: "kids", course: "kids", childId: scope.profileId } });
    await acknowledge();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "شراء رصيد أسئلة إضافي" })).toHaveAttribute("href", "/kids/pricing?locale=ar-EG#question-topup");
  });
  it("does not reopen automatically after acknowledgement in the same account and sign-in session", async () => {
    const first = render(view());await acknowledge();first.unmount();
    render(view());await waitFor(() => expect(state.balance).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "صلاحياتي مع المساعد" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("closing without acknowledgement does not mark the popup seen", async () => {
    const first = render(view());const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "إغلاق" }));first.unmount();
    render(view());expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("shows again in a new browser tab session", async () => {
    const first = render(view());await acknowledge();first.unmount();window.sessionStorage.clear();
    render(view());expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("does not carry acknowledgement across different accounts", async () => {
    const first = render(view());await acknowledge();first.unmount();
    render(view("another-owner"));expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("shows again for a new sign-in by the same account", async () => {
    const first = render(view());await acknowledge();first.unmount();
    state.balance.mockResolvedValue({ ...rights, session_key: "session-b" });
    render(view());expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("does not repeat for another curriculum in the same sign-in session", async () => {
    const first = render(view());await acknowledge();first.unmount();
    render(<AssistantUsage scope={{ area: "ai", cardId: "intro", locale: "ar-EG" }} accountId="owner" busy={false} isCurrent={() => true} />);
    await waitFor(() => expect(state.balance).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("retries failed balance loading without inventing rights or recording acknowledgement", async () => {
    state.balance.mockRejectedValueOnce(Error("unavailable"));render(view());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/ماقدرناش نتأكد من صلاحياتك ورصيدك/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "فهمت، ابدأ" })).toBeDisabled();
    expect(within(dialog).queryByText(/رصيد الحصص الحالية:/)).not.toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "جرّب تاني" }));
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByRole("button", { name: "فهمت، ابدأ" })).toBeEnabled());
    expect(within(screen.getByRole("dialog")).getByText(/رصيد الحصص الحالية: 10/)).toBeInTheDocument();
  });
  it("shows denied access as denied rather than inventing a plan", async () => {
    state.balance.mockResolvedValue({ ...rights, access_allowed: false, monthly_remaining: 0, purchased_remaining: 0 });render(view());
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("المساعد مش متاح لحسابك في المنهج ده دلوقتي.")).toBeInTheDocument();
  });
  it("discards a delayed balance from a previous child", async () => {
    let accept!: (value: unknown) => void;state.balance.mockImplementationOnce(() => new Promise(resolve => { accept = resolve; }));
    const first = render(view());await waitFor(() => expect(state.balance).toHaveBeenCalledOnce());
    first.rerender(<AssistantUsage scope={{ ...scope, profileId: "33333333-3333-4333-8333-333333333333" }} accountId="owner" busy={false} isCurrent={() => true} />);
    await screen.findByRole("dialog");await act(async () => { accept({ ...rights, monthly_remaining: 999 }); });
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
  });
  it("makes no balance call or storage acknowledgement for a retired account", async () => {
    const current = vi.fn(() => false);
    const first = render(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={current} />);
    expect(state.balance).not.toHaveBeenCalled();
    current.mockReturnValue(true);first.rerender(<AssistantUsage scope={scope} accountId="owner" busy={true} isCurrent={current} />);
    first.rerender(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={current} />);
    const dialog = await screen.findByRole("dialog");current.mockReturnValue(false);
    fireEvent.click(within(dialog).getByRole("button", { name: "فهمت، ابدأ" }));expect(window.sessionStorage.length).toBe(0);
  });
});
it.each([
  ["en", "Your assistant access", "Administrator: unlimited questions across all curricula.", "Understood, start"],
  ["ar-EG", "صلاحياتك مع المساعد", "الأدمن: أسئلة من غير حد في كل المناهج.", "فهمت، ابدأ"],
  ["ar-MSA", "صلاحياتك في المساعد", "الأدمن: أسئلة غير محدودة في جميع المناهج.", "فهمت، ابدأ"],
  ["ar-Gulf", "صلاحياتك مع المساعد", "الأدمن: أسئلة بلا حد في كل المناهج.", "فهمت، ابدأ"],
] as const)("shows fully localized administrator popup in %s", async (locale, title, message, action) => {
  state.balance.mockResolvedValue({ ...rights, monthly_remaining: 0, purchased_remaining: 0, admin_review: true, unlimited: true });
  render(<AssistantUsage scope={{ ...scope, locale }} accountId="owner" busy={false} isCurrent={() => true} />);
  const dialog = await screen.findByRole("dialog", { name: title });
  expect(within(dialog).getByText(message)).toBeInTheDocument();
  expect(within(dialog).getByRole("button", { name: action })).toBeEnabled();
  expect(within(dialog).queryByText(/رصيد الحصص الحالية:|Current allowance:/)).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(within(dialog).queryByText(/أول محاولتين|first two out-of-course/)).not.toBeInTheDocument();
});
it.each([
  ["en", "You can use the assistant within the content available to your account in this curriculum."],
  ["ar-EG", "تقدر تستخدم المساعد في المحتوى المتاح لحسابك من المنهج ده."],
  ["ar-MSA", "يمكنك استخدام المساعد ضمن المحتوى المتاح لحسابك في هذا المنهج."],
  ["ar-Gulf", "تقدر تستخدم المساعد في المحتوى المتاح لحسابك من هالمنهج."],
] as const)("uses the learner's actual rights and native copy in %s", async (locale, message) => {
  render(<AssistantUsage scope={{ ...scope, locale }} accountId="owner" busy={false} isCurrent={() => true} />);
  expect(within(await screen.findByRole("dialog")).getByText(message)).toBeInTheDocument();
});
it("removes unlimited wording after the server no longer confirms administrator rights", async () => {
  state.balance.mockResolvedValueOnce({ ...rights, admin_review: true, unlimited: true }).mockResolvedValueOnce({ ...rights, monthly_remaining: 3, admin_review: false, unlimited: false });
  const first = render(view());await screen.findByRole("dialog");await acknowledge();
  first.rerender(<AssistantUsage scope={scope} accountId="owner" busy={true} isCurrent={() => true} />);
  first.rerender(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => true} />);
  expect(await screen.findByText(/رصيد الحصص الحالية: 3/)).toBeInTheDocument();
  expect(screen.queryByText("الأدمن: أسئلة من غير حد في كل المناهج.")).not.toBeInTheDocument();
});
