import type { ComponentType, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";

const state = vi.hoisted(() => ({
  page: null as ComponentType | null,
  locale: "en" as SupportedLocale,
  admin: true,
  accountId: "00000000-0000-4000-8000-000000000001",
  authError: false,
  reads: {} as Record<string, any>,
  rejected: new Set<string>(),
  userPages: [] as any[],
  rpc: vi.fn(),
  from: vi.fn(),
  list: vi.fn(),
  fetch: vi.fn(),
  limits: [] as Array<[string, number]>,
}));
vi.mock("@tanstack/react-start", () => ({
  useServerFn: (fn: unknown) => fn,
  createServerFn: () => {
    let validate: ((x: unknown) => unknown) | undefined;
    const chain = {
      middleware: () => chain,
      inputValidator: (fn: (x: unknown) => unknown) => {
        validate = fn;
        return chain;
      },
      handler:
        (fn: (x: any) => unknown) =>
        (args: any = {}) =>
          fn({
            data: validate ? validate(args.data) : args.data,
            context: {
              userId: "00000000-0000-4000-8000-000000000001",
              supabase: { rpc: state.rpc },
            },
          }),
    };
    return chain;
  },
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: ComponentType }) => {
    state.page = options.component;
    return options;
  },
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: state.from, auth: { admin: { listUsers: state.list } } }),
}));
vi.mock("@/lib/admin-route-guard", () => ({ requireAdminBeforeLoad: vi.fn() }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: state.accountId } }) }));
vi.mock("@/lib/entitlements", () => ({
  useEntitlement: () => ({ isLoaded: true, isAdmin: state.admin }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: state.locale }) }));
vi.mock("@/components/admin/PhaseRibbon", () => ({ PhaseRibbon: () => null }));
import {
  getAdminActivity,
  getAdminOverview,
  getAdminInsights,
  listUsers,
} from "@/lib/admin.functions";
import "@/routes/admin.index";

function outcome(name: string) {
  return state.rejected.has(name)
    ? Promise.reject(new Error("private backend failure"))
    : Promise.resolve(state.reads[name]);
}
function subscriptionResponse() {
  return Promise.resolve({
    data: {
      actorUserId: "00000000-0000-4000-8000-000000000001",
      serverTime: new Date().toISOString(),
      summary: {
        activePaidAccounts: 0,
        activePaidSources: 0,
        activeInvitationSources: 0,
        activeGrantSources: 0,
        activeLifetimeSources: 0,
        byArea: {},
        byKind: {},
      },
    },
    error: null,
  });
}
const clients: QueryClient[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  // Keep the server-only loader real, but replace the SDK and deny every fetch.
  vi.stubEnv("SUPABASE_URL", "https://synthetic.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-test-only");
  state.fetch.mockRejectedValue(new Error("Unexpected network call in isolated test"));
  vi.stubGlobal("fetch", state.fetch);
  state.admin = true;
  state.authError = false;
  state.locale = "en";
  state.accountId = "00000000-0000-4000-8000-000000000001";
  state.rejected.clear();
  state.limits = [];
  state.userPages = [];
  state.reads = {
    overview: { data: { total_users: 314159, new_users_7d: 2 }, error: null },
    insights: {
      data: {
        path_distribution: [{ path_id: "synthetic-path", completed_lessons: 5, active_users: 2 }],
        drop_off_lessons: [],
      },
      error: null,
    },
    users: {
      data: {
        users: [
          { id: "synthetic-user", email: "synthetic@example.test", created_at: "2026-01-01" },
        ],
        total: 1,
      },
      error: null,
    },
    user_lesson_status: {
      data: [
        {
          user_id: "synthetic-user",
          lesson_id: "synthetic-lesson",
          status: "completed",
          updated_at: "2026-01-01",
        },
      ],
      error: null,
    },
    mission_submissions: {
      data: [
        {
          user_id: "synthetic-user",
          mission_id: "synthetic-mission",
          lesson_id: null,
          status: "submitted",
          score: null,
          updated_at: "2026-01-01",
        },
      ],
      error: null,
    },
  };
  state.rpc.mockImplementation((name: string) =>
    name === "has_role"
      ? Promise.resolve({
          data: state.admin,
          error: state.authError ? { message: "denied" } : null,
        })
      : name === "commerce_command"
        ? subscriptionResponse()
        : outcome(name === "get_admin_overview" ? "overview" : "insights"),
  );
  state.list.mockImplementation(({ page }: { page: number }) =>
    state.userPages.length ? Promise.resolve(state.userPages[page - 1]) : outcome("users"),
  );
  state.from.mockImplementation((table: string) => {
    let counting = false;
    const q = {
      select: (_fields?: string, options?: { head?: boolean }) => {
        counting = options?.head === true;
        return q;
      },
      in: () => q,
      not: () => q,
      order: () => q,
      limit: (n: number) => {
        state.limits.push([table, n]);
        return q;
      },
      then: (resolve: any, reject: any) =>
        outcome(table)
          .then((value) =>
            counting
              ? { ...value, count: value.error ? null : "count" in value ? value.count : 0 }
              : value,
          )
          .then(resolve, reject),
    };
    return q;
  });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  expect(state.fetch).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const Page = state.page!;
  render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
  return client;
}
function panel(title: string) {
  return within(screen.getByRole("heading", { name: title }).parentElement!);
}

const cases = [
  {
    key: ["admin-overview", "00000000-0000-4000-8000-000000000001"],
    read: "overview",
    title: "نظرة عامة",
    stale: (314159).toLocaleString("ar-EG"),
  },
  {
    key: ["admin-activity", "00000000-0000-4000-8000-000000000001"],
    read: "user_lesson_status",
    title: "آخر الدروس",
    stale: "synthetic-lesson",
  },
  {
    key: ["admin-insights", "00000000-0000-4000-8000-000000000001"],
    read: "insights",
    title: "توزيع المستخدمين على المسارات",
    stale: "synthetic-path",
  },
  {
    key: ["admin-users", "00000000-0000-4000-8000-000000000001", 1, 25],
    read: "users",
    title: "كل المستخدمين",
    stale: "synthetic@example.test",
  },
] as const;
function section(c: (typeof cases)[number]) {
  return c.read === "users"
    ? within(screen.getByRole("heading", { name: /^كل المستخدمين/ }).parentElement!)
    : panel(c.title);
}

describe("actual admin queries and report UI", () => {
  it.each(cases)("shows initial failure and working retry for $read", async (c) => {
    state.reads[c.read] = { data: null, error: { message: "private backend failure" } };
    mount();
    await waitFor(() => expect(section(c).getByRole("alert")).toBeVisible());
    expect(section(c).getByRole("alert")).toHaveTextContent(
      getUiString("en", "admin.reporting.error"),
    );
    expect(section(c).queryByText(c.stale)).not.toBeInTheDocument();
    expect(section(c).queryByText(/مفيش/)).not.toBeInTheDocument();
    expect(screen.queryByText(/private backend failure/)).not.toBeInTheDocument();
    if (c.read === "overview") state.reads.overview = { data: { total_users: 12 }, error: null };
    else if (c.read === "insights") state.reads.insights = { data: {}, error: null };
    else if (c.read === "users") state.reads.users = { data: { users: [], total: 0 }, error: null };
    else state.reads[c.read] = { data: [], error: null };
    fireEvent.click(section(c).getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(section(c).queryByRole("alert")).not.toBeInTheDocument());
  });
  it.each(cases)("hides cached successful data on refetch failure for $read", async (c) => {
    const client = mount();
    await waitFor(() => {
      const q = client.getQueryState([...c.key]);
      expect(q?.status, String(q?.error)).toBe("success");
    });
    await waitFor(() => expect(section(c).getByText(c.stale)).toBeVisible());
    state.rejected.add(c.read);
    await act(async () => {
      await client.invalidateQueries({ queryKey: [...c.key], exact: true });
    });
    await waitFor(() =>
      expect(section(c).getByRole("alert")).toHaveTextContent(
        getUiString("en", "admin.reporting.refreshError"),
      ),
    );
    expect(section(c).queryByText(c.stale)).not.toBeInTheDocument();
    // Cached data still exists; the actual route hides it while the read is failed.
    expect(client.getQueryData([...c.key])).toBeDefined();
    if (c.read === "users") {
      expect(screen.getByRole("heading", { name: "كل المستخدمين" })).toBeVisible();
      expect(section(c).queryByText(/صفحة/)).not.toBeInTheDocument();
    }
    state.rejected.delete(c.read);
    fireEvent.click(section(c).getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(section(c).getByText(c.stale)).toBeVisible());
    expect(section(c).queryByRole("alert")).not.toBeInTheDocument();
  });
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
    "localizes the report failure and retry for %s",
    async (locale) => {
      state.locale = locale;
      state.rejected.add("overview");
      mount();
      await waitFor(() =>
        expect(panel("نظرة عامة").getByRole("alert")).toHaveTextContent(
          getUiString(locale, "admin.reporting.error"),
        ),
      );
      expect(
        panel("نظرة عامة").getByRole("button", {
          name: getUiString(locale, "admin.reporting.retry"),
        }),
      ).toBeVisible();
    },
  );
  it("renders genuine successful zero and empty states without errors", async () => {
    state.reads.overview = { data: {}, error: null };
    state.reads.insights = { data: {}, error: null };
    state.reads.users = { data: { users: [], total: 0 }, error: null };
    state.reads.user_lesson_status = state.reads.mission_submissions = { data: [], error: null };
    mount();
    await waitFor(() => expect(screen.getByText("مفيش مستخدمين على الصفحة دي.")).toBeVisible());
    expect(panel("نظرة عامة").getAllByText((0).toLocaleString("ar-EG"))).toHaveLength(6);
    expect(screen.getByText("مفيش تسجيلات لسه.")).toBeVisible();
    expect(screen.getByText("مفيش نشاط لسه.")).toBeVisible();
    expect(screen.getByText("مفيش submissions.")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("never shows a previous administrator's user page during an account change", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    clients.push(client);
    const Page = state.page!;
    const dashboard = () => (
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );
    const { rerender } = render(dashboard());
    const previousAddress = "synthetic@example.test";
    expect(await section(cases[3]).findByText(previousAddress)).toBeVisible();

    state.list.mockImplementation(() => new Promise(() => {}));
    state.accountId = "00000000-0000-4000-8000-000000000002";
    rerender(dashboard());
    expect(screen.queryByText(previousAddress)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كل المستخدمين" })).toBeVisible();
  });

  it("does not duplicate an in-flight retry", async () => {
    state.rejected.add("overview");
    const client = mount();
    await waitFor(() => expect(panel("نظرة عامة").getByRole("alert")).toBeVisible());
    let release!: (value: unknown) => void;
    state.rpc.mockImplementation((name: string) =>
      name === "has_role"
        ? Promise.resolve({ data: true, error: null })
        : name === "commerce_command"
          ? subscriptionResponse()
          : new Promise((resolve) => {
              release = resolve;
            }),
    );
    fireEvent.click(panel("نظرة عامة").getByRole("button", { name: "Retry" }));
    await waitFor(() =>
      expect(
        client.getQueryState(["admin-overview", "00000000-0000-4000-8000-000000000001"])
          ?.fetchStatus,
      ).toBe("fetching"),
    );
    const retry = panel("نظرة عامة").queryByRole("button", { name: "Retry" });
    if (retry) expect(retry).toBeDisabled();
    await act(async () => release({ data: {}, error: null }));
    await waitFor(() => expect(panel("نظرة عامة").queryByRole("alert")).not.toBeInTheDocument());
  });
});

describe("server read failures and preserved authorization/caps", () => {
  it.each(["users", "user_lesson_status", "mission_submissions"])(
    "rejects returned SDK failure in %s",
    async (name) => {
      state.reads[name] = { data: null, error: { message: "private detail" } };
      await expect((getAdminActivity as any)()).rejects.toThrow("Failed to load recent");
    },
  );
  it("does not silently keep earlier signups when a later page fails", async () => {
    state.userPages = [
      {
        data: {
          users: Array.from({ length: 100 }, (_, i) => ({
            id: String(i),
            created_at: "2026-01-01",
          })),
        },
        error: null,
      },
      { data: null, error: { message: "page 2 failed" } },
    ];
    await expect((getAdminActivity as any)()).rejects.toThrow("Failed to load recent signups");
    expect(state.list).toHaveBeenCalledTimes(2);
  });
  it("keeps the activity query limits and five-page user cap", async () => {
    state.reads.users = {
      data: {
        users: Array.from({ length: 100 }, (_, i) => ({ id: String(i), created_at: "2026-01-01" })),
      },
      error: null,
    };
    const result = await (getAdminActivity as any)();
    expect(state.list).toHaveBeenCalledTimes(5);
    expect(state.list).toHaveBeenLastCalledWith({ page: 5, perPage: 100 });
    expect(result.signups).toHaveLength(20);
    expect(state.limits).toEqual([
      ["user_lesson_status", 20],
      ["mission_submissions", 10],
    ]);
  });
  it.each([getAdminOverview, getAdminActivity, getAdminInsights, listUsers])(
    "blocks a non-admin before reading report data",
    async (fn) => {
      state.admin = false;
      await expect((fn as any)({ data: { page: 1, pageSize: 25 } })).rejects.toThrow("Forbidden");
      expect(state.from).not.toHaveBeenCalled();
      expect(state.list).not.toHaveBeenCalled();
      expect(state.rpc).toHaveBeenCalledTimes(1);
    },
  );
  it("fails closed when the admin role check returns an error", async () => {
    state.authError = true;
    await expect((getAdminActivity as any)()).rejects.toThrow("Authorization check failed");
    expect(state.from).not.toHaveBeenCalled();
    expect(state.list).not.toHaveBeenCalled();
  });
});

it("classifies legacy skip activity without returning a grade or full metadata", async () => {
  state.reads.mission_submissions = {
    data: [
      {
        user_id: "u",
        mission_id: "m",
        lesson_id: "l",
        status: "passed",
        score: 0,
        skipped: true,
        updated_at: "2026-01-01",
      },
    ],
    error: null,
  };
  const result = await (getAdminActivity as any)();
  expect(result.missions[0]).toMatchObject({ status: "skipped", score: null });
  expect(result.missions[0]).not.toHaveProperty("submission_metadata");
});
it("overview uses marker-excluding exact count and refuses missing count", async () => {
  state.reads.overview.data.missions_submitted = 999;
  state.reads.mission_submissions.count = 7;
  expect((await (getAdminOverview as any)()).missionsSubmitted).toBe(7);
  state.reads.mission_submissions = { data: null, count: null, error: null };
  await expect((getAdminOverview as any)()).rejects.toThrow();
});
