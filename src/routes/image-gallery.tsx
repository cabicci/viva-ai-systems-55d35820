import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/image-gallery")({
  component: ImageGalleryLayout,
});

function ImageGalleryLayout() {
  return <Outlet />;
}