import { Navbar } from "@/components/site/Navbar";

/** Shared top navigation for signed-in pages. Kept under this export for route compatibility. */
export function Sidebar() {
  return <Navbar variant="account" />;
}
