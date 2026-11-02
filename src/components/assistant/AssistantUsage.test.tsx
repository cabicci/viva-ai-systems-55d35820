import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantUsage } from "./AssistantUsage";
const state = vi.hoisted(() => ({ balance: vi.fn() }));
vi.mock("@/lib/billing/question-balance.functions", () => ({ getAssistantQuestionBalance: state.balance }));
const scope = { area: "kids" as const, cardId: "level-1", profileId: "22222222-2222-4222-8222-222222222222", locale: "ar-EG" as const };
beforeEach(() => { state.balance.mockReset().mockResolvedValue({ monthly_remaining: 10, purchased_remaining: 90 }); });
describe("assistant allowance guidance", () => {
  it("shows the confirmed balance, family policy and requested acknowledgement", async () => {
    render(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => true} />);
    await screen.findByText(/المتبقي: 10 سؤال/);
    expect(screen.getByText(/أول محاولتين خارج المنهج يوميًا بتوقيت القاهرة/)).toBeInTheDocument();
    expect(screen.getByText(/كل طفل يستخدم حصته الخاصة أولًا/)).toBeInTheDocument();
    expect(state.balance).toHaveBeenCalledWith({ data: { expectedAccountId: "owner", area: "kids", course: "kids", childId: scope.profileId } });
    fireEvent.click(screen.getByRole("button", { name: "فهمت، ابدأ" }));
    expect(screen.getByRole("button", { name: "طريقة احتساب الأسئلة" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "شراء رصيد أسئلة إضافي" })).toHaveAttribute("href", "/kids/pricing?locale=ar-EG#question-topup");
  });
  it("does not display the previous child's balance after a delayed response", async () => {
    let accept!: (value: unknown) => void;
    state.balance.mockImplementationOnce(() => new Promise(resolve => { accept = resolve; }));
    const view = render(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => true} />);
    await waitFor(() => expect(state.balance).toHaveBeenCalledOnce());
    view.rerender(<AssistantUsage scope={{ ...scope, profileId: "33333333-3333-4333-8333-333333333333" }} accountId="owner" busy={false} isCurrent={() => true} />);
    await screen.findByText(/المتبقي: 10 سؤال/);
    await act(async () => { accept({ monthly_remaining: 999, purchased_remaining: 999 }); });
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
  });
  it("makes no balance call for a retired account and refreshes after a question", async () => {
    const view = render(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => false} />);
    expect(state.balance).not.toHaveBeenCalled();
    view.rerender(<AssistantUsage scope={scope} accountId="owner" busy={true} isCurrent={() => true} />);
    expect(state.balance).not.toHaveBeenCalled();
    view.rerender(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => true} />);
    await waitFor(() => expect(state.balance).toHaveBeenCalledOnce());
  });
});

it("describes administrator review without inventing a learner balance", async () => {
  state.balance.mockResolvedValue({ monthly_remaining: 0, purchased_remaining: 0, admin_review: true });
  render(<AssistantUsage scope={scope} accountId="owner" busy={false} isCurrent={() => true} />);
  expect(await screen.findByText("مراجعة الأدمن: لا تُستهلك أسئلة من رصيد الطلاب.")).toBeInTheDocument();
  expect(screen.queryByText(/المتبقي:/)).not.toBeInTheDocument();
});
