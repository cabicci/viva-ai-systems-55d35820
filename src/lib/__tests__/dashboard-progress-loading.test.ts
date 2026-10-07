import { describe, it, expect, vi } from "vitest";
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  redirect: (options: unknown) => options,
}));
import { Route } from "@/routes/dashboard";
describe("legacy dashboard entry", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "redirects to the single journey with %s",
    (locale) => {
      const route = Route as unknown as {
        beforeLoad: (input: { search: { locale: string } }) => void;
      };
      expect(() => route.beforeLoad({ search: { locale } })).toThrow(
        expect.objectContaining({ to: "/my-learning", search: { locale }, replace: true }),
      );
    },
  );
});
