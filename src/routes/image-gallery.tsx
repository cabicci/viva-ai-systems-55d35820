import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/image-gallery")({
  beforeLoad: requireAdminBeforeLoad,
  component: ImageGalleryLayout,
});

function ImageGalleryLayout() {
  return (
    <AdminGate>
      <Outlet />
    </AdminGate>
  );
}