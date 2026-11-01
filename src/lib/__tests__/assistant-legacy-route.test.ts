import { expect, it } from "vitest";
import { Route } from "@/routes/ai-assistant";

it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])("returns the old external assistant URL to the journey in %s", async (locale) => {
  const beforeLoad = Route.options.beforeLoad!;
  await expect(Promise.resolve().then(() => beforeLoad({ search: { locale } } as Parameters<typeof beforeLoad>[0])))
    .rejects.toMatchObject({ options: { to: "/my-learning", search: { locale }, replace: true } });
});
