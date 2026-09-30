import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KidsParentStateProvider } from "@/lib/kids/KidsParentStateProvider";

export const Route = createFileRoute("/kids")({
  component: () => (
    <KidsParentStateProvider>
      <Outlet />
    </KidsParentStateProvider>
  ),
});
