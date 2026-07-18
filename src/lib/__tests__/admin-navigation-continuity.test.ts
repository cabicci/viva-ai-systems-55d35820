import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import arEGUi from "@/locales/ar-EG/ui.json";
import arMSAUi from "@/locales/ar-MSA/ui.json";
import arGulfUi from "@/locales/ar-Gulf/ui.json";
import enUi from "@/locales/en/ui.json";
import { getUiString } from "@/lib/locale/ui-strings";

const REPO_ROOT = process.cwd();

function readSrc(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const PRIMARY_ADMIN_ROUTES = ["/admin", "/system-state"] as const;
const HIDDEN_ADMIN_ROUTES = [
  "/image-gallery",
  "/roadmap",
  "/assistant-runtime",
  "/build-logs",
] as const;
const HIDDEN_ROUTE_FILES = [
  "src/routes/image-gallery.tsx",
  "src/routes/image-gallery.index.tsx",
  "src/routes/roadmap.index.tsx",
  "src/routes/assistant-runtime.tsx",
  "src/routes/build-logs.tsx",
] as const;

function extractDevItemRoutes(sidebarSource: string): string[] {
  const block = sidebarSource.match(
    /const devItems[\s\S]*?=\s*\[([\s\S]*?)\];/,
  )?.[1];
  expect(block, "Sidebar.devItems block").toBeTruthy();
  return [...block!.matchAll(/to:\s*"([^"]+)"/g)].map((m) => m[1]);
}

describe("Admin navigation continuity (Phase 1)", () => {
  it("primary System Tools navigation contains only Admin Dashboard and Project Continuity", () => {
    const routes = extractDevItemRoutes(readSrc("src/components/dashboard/Sidebar.tsx"));
    expect(routes).toEqual([...PRIMARY_ADMIN_ROUTES]);
  });

  it("hides maintenance/QA routes from primary Admin navigation", () => {
    const sidebar = readSrc("src/components/dashboard/Sidebar.tsx");
    const routes = extractDevItemRoutes(sidebar);
    for (const hidden of HIDDEN_ADMIN_ROUTES) {
      expect(routes).not.toContain(hidden);
      expect(sidebar).not.toContain(`to: "${hidden}"`);
    }
  });

  it("preserves hidden Admin route files for direct access", () => {
    for (const rel of HIDDEN_ROUTE_FILES) {
      expect(existsSync(path.join(REPO_ROOT, rel)), rel).toBe(true);
    }
  });

  it("Admin Dashboard links to Project Continuity without rendering PhaseRibbon", () => {
    const admin = readSrc("src/routes/admin.index.tsx");
    expect(admin).toContain('to="/system-state"');
    expect(admin).not.toMatch(/PhaseRibbon/);
    expect(admin).not.toContain('@/components/admin/PhaseRibbon');
  });

  it("Dashboard no longer renders PhaseRibbon while Roadmap keeps it", () => {
    const dashboard = readSrc("src/routes/dashboard.tsx");
    expect(dashboard).not.toMatch(/PhaseRibbon/);
    expect(dashboard).not.toContain('@/components/admin/PhaseRibbon');

    expect(existsSync(path.join(REPO_ROOT, "src/components/admin/PhaseRibbon.tsx"))).toBe(
      true,
    );
    expect(readSrc("src/routes/roadmap.index.tsx")).toContain("PhaseRibbon");
    expect(readSrc("src/routes/roadmap.$id.tsx")).toContain("PhaseRibbon");
  });

  it("localizes Project Continuity label in all four UI locale bundles", () => {
    expect(enUi["sidebar.systemState"]).toBe("Project Continuity");
    expect(arEGUi["sidebar.systemState"]).toBe("استمرارية المشروع");
    expect(arMSAUi["sidebar.systemState"]).toBe("استمرارية المشروع");
    expect(arGulfUi["sidebar.systemState"]).toBe("استمرارية المشروع");

    expect(getUiString("en", "sidebar.systemState")).toBe("Project Continuity");
    expect(getUiString("ar-EG", "sidebar.systemState")).toBe("استمرارية المشروع");
    expect(getUiString("ar-MSA", "sidebar.systemState")).toBe("استمرارية المشروع");
    expect(getUiString("ar-Gulf", "sidebar.systemState")).toBe("استمرارية المشروع");
  });

  it("does not alter learner-facing Sidebar destinations", () => {
    const sidebar = readSrc("src/components/dashboard/Sidebar.tsx");
    const learnerBlock = sidebar.match(
      /const items[\s\S]*?=\s*\[([\s\S]*?)\];/,
    )?.[1];
    expect(learnerBlock).toBeTruthy();
    const learnerRoutes = [...learnerBlock!.matchAll(/to:\s*"([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(learnerRoutes).toEqual([
      "/dashboard",
      "/ai-assistant",
      "/analytics",
      "/account",
    ]);
  });
});
