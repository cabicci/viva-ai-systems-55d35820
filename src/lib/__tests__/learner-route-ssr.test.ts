import { createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { beforeEach, expect, it, vi } from "vitest";
const verify = vi.hoisted(() => vi.fn());
vi.mock("@/lib/learner-auth.functions", () => ({ assertLearnerSession: verify }));
import { learnerLessonAccess } from "@/lib/learner-route-guard";

const pathname = "/learn/intro/intro-m1-l1-what-is-ai";
beforeEach(() => verify.mockReset().mockResolvedValue(null));
function setup(isServer: boolean) {
  const loader = vi.fn(() => ({ authoredContent: "private lesson payload" }));
  const root = createRootRoute();
  const lesson = createRoute({ getParentRoute: () => root, path: pathname, ...learnerLessonAccess,
    validateSearch: (s: Record<string, unknown>) => ({ locale: String(s.locale ?? "ar-EG") }), loader,
  });
  const login = createRoute({ getParentRoute: () => root, path: "/login", validateSearch: (s: Record<string, unknown>) => s });
  const router = createRouter({ routeTree: root.addChildren([lesson, login]), isServer,
    history: createMemoryHistory({ initialEntries: [`${pathname}?locale=ar-EG`] }),
  });
  return { router, loader };
}
it("returns only a pending lesson shell on a document request; no premature login or authored loader payload", async () => {
  const { router, loader } = setup(true);
  await router.load();
  expect(verify).not.toHaveBeenCalled();
  expect(loader).not.toHaveBeenCalled();
  expect(router.state.location.pathname).toBe(pathname);
  expect(router.state.matches.every((m) => m.loaderData === undefined)).toBe(true);
});
it("verifies the hydrated browser request before running the authored loader", async () => {
  verify.mockResolvedValue({ userId: "verified-fixture" });
  const { router, loader } = setup(false);
  await router.load();
  expect(verify).toHaveBeenCalledTimes(1);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(verify.mock.invocationCallOrder[0]).toBeLessThan(loader.mock.invocationCallOrder[0]);
});
it("keeps the loader closed after hydration if the session is absent", async () => {
  const { router, loader } = setup(false);
  await router.load();
  expect(verify).toHaveBeenCalledTimes(1);
  expect(loader).not.toHaveBeenCalled();
  expect(router.state.location).toMatchObject({ pathname: "/login", search: { locale: "ar-EG", returnTo: pathname } });
});
