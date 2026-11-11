import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { AdminEmailAccess } from "./AdminEmailAccess";
const mock = vi.hoisted(() => ({
  command: vi.fn(),
  download: vi.fn(),
  auth: {
    user: { id: "00000000-0000-4000-8000-000000000001" } as { id: string } | null,
    loading: false,
    authGeneration: { value: 1 },
  },
}));
vi.mock("@/lib/commerce/admin-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/commerce/admin-ui")>()),
  download: mock.download,
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    ...mock.auth,
    isAuthGenerationCurrent: (generation: object) =>
      generation === mock.auth.authGeneration && !!mock.auth.user,
  }),
}));
vi.mock("@/lib/admin.functions", () => ({
  listUsers: async () => ({
    users: [{ id: "registered", email: "registered@example.test" }],
    page: 1,
    hasMore: false,
  }),
}));
vi.mock("@/lib/commerce/email-access.functions", () => ({ emailAccessCommand: mock.command }));
vi.mock("@/lib/commerce/access-notice.functions", () => ({ accessNoticeCommand: vi.fn() }));
const data = {
  catalogues: [
    { id: "academic:AC-BUS", title: "Academic business" },
    { id: "ai:pro", title: "AI partial package" },
    { id: "ai:pro_plus", title: "AI full package" },
    { id: "kids", title: "Kids curriculum" },
    { id: "technical:furniture", title: "Furniture curriculum" },
  ],
  grants: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.auth = {
    user: { id: "00000000-0000-4000-8000-000000000001" },
    loading: false,
    authGeneration: { value: 1 },
  };
  mock.command.mockImplementation(async ({ data: input }) =>
    input.action === "list" ? data : { id: "synthetic" },
  );
});
afterEach(cleanup);
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale="en">
        <AdminEmailAccess />
      </LocaleProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  return { ...view, client, refresh: () => view.rerender(tree()) };
};
describe("administrator pre-registration email grants", () => {
  it("sends separate single-curriculum invitations to the same email with derived allowance", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Invitation type"), {
      target: { value: "single_curriculum" },
    });
    expect(screen.getByRole("button", { name: "Grant access" })).toBeDisabled();
    expect(screen.queryByRole("option", { name: "AI partial package" })).toBeNull();
    expect(screen.getByText(/100 questions each month/).closest("li")).not.toBeNull();
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "ai:pro_plus" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await screen.findByRole("status");
    fireEvent.change(screen.getByLabelText("Choose one curriculum"), {
      target: { value: "academic:AC-BUS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() =>
      expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(2),
    );
    const calls = mock.command.mock.calls
      .filter((c) => c[0].data.action === "create")
      .map((c) => c[0].data.data);
    expect(calls[0]).toMatchObject({
      email: "learner@example.test",
      grant_kind: "single_curriculum",
      scope_mode: "selected",
      catalogues: ["ai:pro_plus"],
      duration_days: 30,
    });
    expect(calls[1]).toMatchObject({
      email: "learner@example.test",
      grant_kind: "single_curriculum",
      catalogues: ["academic:AC-BUS"],
    });
    expect(calls[0].key).not.toBe(calls[1].key);
    expect(calls[0]).not.toHaveProperty("monthly_questions");
    expect(calls[0]).not.toHaveProperty("user_id");
  });
  it("fills the grant recipient from the registered-user picker", async () => {
    setup();
    fireEvent.click(await screen.findByRole("button", { name: "registered@example.test" }));
    expect(screen.getByLabelText("Recipient email")).toHaveValue("registered@example.test");
  });
  it("sends the independently selected invitation language", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "future@example.test" },
    });
    fireEvent.click(screen.getByLabelText("Send invitation email"));
    fireEvent.change(screen.getByLabelText("Invitation language"), {
      target: { value: "ar-Gulf" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          expectedAccountId: "00000000-0000-4000-8000-000000000001",
          action: "create",
          data: expect.objectContaining({
            invitation: true,
            locale: "ar-Gulf",
          }),
        },
      }),
    );
  });
  it("defaults invitation off and submits permanent selected access without a user account", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "future@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Access scope"), { target: { value: "selected" } });
    expect(screen.getByRole("button", { name: "Grant access" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Academic business"));
    fireEvent.click(screen.getByLabelText("Permanent"));
    expect(screen.getByLabelText("Send invitation email")).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          expectedAccountId: "00000000-0000-4000-8000-000000000001",
          action: "create",
          data: expect.objectContaining({
            email: "future@example.test",
            scope_mode: "selected",
            catalogues: ["academic:AC-BUS"],
            duration_days: null,
            invitation: false,
          }),
        },
      }),
    );
    const call = mock.command.mock.calls.find((c) => c[0].data.action === "create")![0];
    expect(call.data.data).not.toHaveProperty("user_id");
    expect(call.data.data).not.toHaveProperty("role");
  });
  it("retains an idempotency key when create response is uncertain", async () => {
    mock.command.mockImplementation(async ({ data: input }) => {
      if (input.action === "list") return data;
      throw Error("uncertain");
    });
    setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Grant access" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "future@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Grant access" }));
    await waitFor(() =>
      expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(2),
    );
    const calls = mock.command.mock.calls.filter((c) => c[0].data.action === "create");
    expect(calls[0][0].data.data.key).toBe(calls[1][0].data.data.key);
  });
  it("shows pending, active, expired and revoked audit history, revokes pending and extends active access", async () => {
    const base = {
      scope_mode: "all_published",
      catalogues: [],
      duration_days: 30,
      activated_at: null,
      ends_at: null,
      revoked_at: null,
      user_id: null,
      created_at: "2026-10-13",
      invitation_status: null,
      audit: [
        {
          id: "audit",
          actor: "synthetic-admin",
          action: "created",
          created_at: "2026-10-13",
          details: {},
        },
      ],
    };
    const grants = [
      {
        ...base,
        id: "pending",
        recipient_email: "pending@example.test",
        status: "pending_registration",
      },
      {
        ...base,
        id: "active",
        recipient_email: "active@example.test",
        status: "active",
        user_id: "synthetic-user",
        activated_at: "2026-10-13",
        ends_at: "2027-01-01",
      },
      { ...base, id: "expired", recipient_email: "expired@example.test", status: "expired" },
      { ...base, id: "revoked", recipient_email: "revoked@example.test", status: "revoked" },
    ];
    mock.command.mockImplementation(async ({ data: input }) =>
      input.action === "list" ? { ...data, grants } : { id: "synthetic" },
    );
    setup();
    await screen.findByText("pending@example.test");
    expect(
      screen.getByRole("heading", {
        name: /pending@example.test.*Pending acceptance or registration/,
      }),
    ).toBeTruthy();
    expect(screen.getAllByText(/^Created/)).toHaveLength(4);
    fireEvent.click(screen.getAllByRole("button", { name: "Revoke" })[0]);
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          expectedAccountId: "00000000-0000-4000-8000-000000000001",
          action: "revoke",
          data: expect.objectContaining({ id: "pending" }),
        },
      }),
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Extend" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Extend" }));
    await waitFor(() =>
      expect(mock.command).toHaveBeenCalledWith({
        data: {
          expectedAccountId: "00000000-0000-4000-8000-000000000001",
          action: "extend",
          data: expect.objectContaining({ id: "active", duration_days: 30 }),
        },
      }),
    );
  });
});

describe("M01 bulk invitation UI", () => {
  const batch = [
    {
      email: "learner@example.test",
      grant_kind: "single_curriculum",
      scope_mode: "selected",
      catalogues: ["ai:pro_plus"],
      duration_days: 30,
      invitation: true,
      locale: "en",
    },
    {
      email: "learner@example.test",
      grant_kind: "single_curriculum",
      scope_mode: "selected",
      catalogues: ["kids"],
      duration_days: null,
      invitation: false,
      locale: "ar-Gulf",
    },
  ];
  it("rejects an invalid later row before writes and requires a resume file", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Invitation data (JSON)"), {
      target: { value: JSON.stringify([batch[0], { ...batch[1], catalogues: ["missing"] }]) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review all invitations" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Row 2");
    expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(0);
    fireEvent.change(screen.getByLabelText("Invitation data (JSON)"), {
      target: { value: JSON.stringify(batch) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review all invitations" }));
    expect(
      screen.getByRole("button", { name: "Save invitations / retry remaining" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Download resume file" }));
    expect(mock.download).toHaveBeenCalledWith(
      "invitation-resume.json",
      expect.any(String),
      "application/json",
    );
    expect(
      screen.getByRole("button", { name: "Save invitations / retry remaining" }),
    ).toBeEnabled();
  });
  it("shows independent uncertain results and retries stable keys without resending saved rows", async () => {
    let calls = 0;
    mock.command.mockImplementation(async ({ data: input }) => {
      if (input.action === "list") return data;
      if (++calls === 2) throw Error("lost acknowledgement");
      return { id: "00000000-0000-4000-8000-000000000099" };
    });
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Invitation data (JSON)"), {
      target: { value: JSON.stringify(batch) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review all invitations" }));
    fireEvent.click(screen.getByRole("button", { name: "Download resume file" }));
    fireEvent.click(screen.getByRole("button", { name: "Save invitations / retry remaining" }));
    await screen.findByText("Result uncertain — retry with the same file");
    expect(screen.getAllByText("Invitation saved")).toHaveLength(1);
    expect(screen.getByLabelText("Invitation data (JSON)")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Start another batch" })).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save invitations / retry remaining" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save invitations / retry remaining" }));
    await screen.findByRole("button", { name: "Start another batch" });
    const inputs = mock.command.mock.calls
      .filter((c) => c[0].data.action === "create")
      .map((c) => c[0].data.data);
    expect(inputs).toHaveLength(3);
    expect(inputs[1]).toEqual(inputs[2]);
    expect(inputs[0].key).not.toBe(inputs[1].key);
    expect(screen.getByText(/Saved does not confirm email delivery/)).toBeVisible();
  });
});

describe("M01-F1 bulk owner continuity", () => {
  const owner = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  const rows = ["ai:pro_plus", "kids"].map((catalogue) => ({
    email: "learner@example.test",
    grant_kind: "single_curriculum",
    scope_mode: "selected",
    catalogues: [catalogue],
    duration_days: 30,
    invitation: true,
    locale: "en",
  }));
  async function start() {
    let resolve!: (value: unknown) => void, reject!: (error: Error) => void;
    const pending = new Promise((yes, no) => {
      resolve = yes;
      reject = no;
    });
    mock.command.mockImplementation(({ data: input }) =>
      input.action === "list" ? Promise.resolve(data) : pending,
    );
    const view = setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Invitation data (JSON)"), {
      target: { value: JSON.stringify(rows) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review all invitations" }));
    fireEvent.click(screen.getByRole("button", { name: "Download resume file" }));
    const resume = JSON.parse(mock.download.mock.calls[0][1]);
    fireEvent.click(screen.getByRole("button", { name: "Save invitations / retry remaining" }));
    await waitFor(() =>
      expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(1),
    );
    return { ...view, resolve, reject, resume };
  }
  it.each(["switch", "signout", "same-owner-new-generation"])(
    "stops the next row on deferred %s even before React rerenders",
    async (transition) => {
      const view = await start();
      const invalidate = vi.spyOn(view.client, "invalidateQueries");
      mock.auth = {
        ...mock.auth,
        user: transition === "signout" ? null : { id: transition === "switch" ? other : owner },
        authGeneration: { value: 2 },
      };
      await act(async () => {
        view.resolve({ id: "00000000-0000-4000-8000-000000000010" });
      });
      const calls = mock.command.mock.calls.filter((c) => c[0].data.action === "create");
      expect(calls).toHaveLength(1);
      expect(calls[0][0].data.expectedAccountId).toBe(owner);
      expect(calls[0][0].data.data.key).toBe(view.resume[0].key);
      expect(invalidate).not.toHaveBeenCalled();
      expect(screen.queryByText("Invitation saved")).toBeNull();
      view.refresh();
      if (transition === "signout")
        expect(screen.queryByLabelText("Invitation data (JSON)")).toBeNull();
      else {
        await waitFor(() =>
          expect(screen.getByLabelText("Invitation data (JSON)")).toHaveValue(""),
        );
        expect(
          mock.command.mock.calls.filter((c) => c[0].data.action === "list").at(-1)?.[0].data
            .expectedAccountId,
        ).toBe(transition === "switch" ? other : owner);
      }
    },
  );
  it.each(["resolve", "reject"])(
    "retires an unmounted batch before late %s without another call or invalidation",
    async (outcome) => {
      const view = await start();
      const invalidate = vi.spyOn(view.client, "invalidateQueries");
      view.unmount();
      await act(async () => {
        if (outcome === "resolve") view.resolve({ id: "00000000-0000-4000-8000-000000000010" });
        else view.reject(Error("late failure"));
      });
      expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(1);
      expect(invalidate).not.toHaveBeenCalled();
    },
  );
  it("does not invoke a prepared batch after its initiating generation retires", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    fireEvent.change(screen.getByLabelText("Invitation data (JSON)"), {
      target: { value: JSON.stringify(rows) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review all invitations" }));
    fireEvent.click(screen.getByRole("button", { name: "Download resume file" }));
    mock.auth = { ...mock.auth, authGeneration: { value: 2 } };
    fireEvent.click(screen.getByRole("button", { name: "Save invitations / retry remaining" }));
    expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(0);
  });
  it("does not adopt a deferred old-owner list into the replacement owner view", async () => {
    let complete!: (value: unknown) => void;
    mock.command.mockImplementation(({ data: input }) =>
      input.expectedAccountId === owner
        ? new Promise((resolve) => {
            complete = resolve;
          })
        : Promise.resolve(data),
    );
    const view = setup();
    await waitFor(() => expect(mock.command).toHaveBeenCalledOnce());
    mock.auth = { ...mock.auth, user: { id: other }, authGeneration: { value: 2 } };
    view.refresh();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    await act(async () => {
      complete({ ...data, catalogues: [{ id: "kids", title: "retired owner private selection" }] });
    });
    expect(screen.queryByText(/retired owner private selection/)).toBeNull();
    expect(screen.getByLabelText("Invitation data (JSON)")).toHaveValue("");
  });
  it("does not retire a newer file read when a superseded read settles", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    let first!: (value: string) => void, second!: (value: string) => void;
    const input = screen.getByLabelText("Upload invitation file");
    fireEvent.change(input, {
      target: {
        files: [
          {
            size: 100,
            text: () =>
              new Promise<string>((resolve) => {
                first = resolve;
              }),
          },
        ],
      },
    });
    fireEvent.change(input, {
      target: {
        files: [
          {
            size: 100,
            text: () =>
              new Promise<string>((resolve) => {
                second = resolve;
              }),
          },
        ],
      },
    });
    await act(async () => {
      first(JSON.stringify(rows));
    });
    expect(screen.getByLabelText("Invitation data (JSON)")).toBeDisabled();
    expect(screen.getByLabelText("Invitation data (JSON)")).toHaveValue("");
    await act(async () => {
      second(JSON.stringify([rows[1]]));
    });
    expect(screen.getByLabelText("Invitation data (JSON)")).toBeEnabled();
    expect(screen.getByLabelText("Invitation data (JSON)")).toHaveValue(JSON.stringify([rows[1]]));
  });
  it("does not adopt a file read from a retired owner", async () => {
    const view = setup();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download template" })).toBeEnabled(),
    );
    let complete!: (text: string) => void;
    const file = {
      size: 100,
      text: () =>
        new Promise<string>((resolve) => {
          complete = resolve;
        }),
    };
    fireEvent.change(screen.getByLabelText("Upload invitation file"), {
      target: { files: [file] },
    });
    mock.auth = { ...mock.auth, user: { id: other }, authGeneration: { value: 2 } };
    view.refresh();
    await act(async () => {
      complete(JSON.stringify(rows));
    });
    expect(screen.getByLabelText("Invitation data (JSON)")).toHaveValue("");
    expect(mock.command.mock.calls.filter((c) => c[0].data.action === "create")).toHaveLength(0);
  });
});
