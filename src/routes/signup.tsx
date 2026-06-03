import { createFileRoute, redirect } from "@tanstack/react-router";

// Maintenance lock: new signups are paused until the platform is fully ready.
// Redirect happens server-side in beforeLoad — no flash of empty page.
export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب — AI Ecosystem" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  component: () => null,
});
