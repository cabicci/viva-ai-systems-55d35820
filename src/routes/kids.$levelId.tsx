import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/kids/$levelId")({
  component: Outlet,
});
