import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SheetClose } from "@/components/ui/sheet";

const accountLinks: { to: string; key: UiStringKey }[] = [
  { to: "/dashboard", key: "sidebar.dashboard" },
  { to: "/ai-assistant", key: "sidebar.assistant" },
  { to: "/analytics", key: "sidebar.analytics" },
  { to: "/account", key: "sidebar.account" },
];

const adminLinks: { to: string; key: UiStringKey }[] = [
  { to: "/admin", key: "sidebar.admin" },
  { to: "/image-gallery", key: "sidebar.imageGallery" },
  { to: "/roadmap", key: "sidebar.roadmap" },
  { to: "/assistant-runtime", key: "sidebar.assistantRuntime" },
  { to: "/system-state", key: "sidebar.systemState" },
  { to: "/build-logs", key: "sidebar.buildLogs" },
];

export function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const t = useUiString();
  const { signOut } = useAuth();
  const { isAdmin } = useEntitlement();
  const localeSearch = useLocaleLinkSearch();
  const [open, setOpen] = useState(false);

  const links = (isAdmin ? [...accountLinks, ...adminLinks] : accountLinks).map(({ to, key }) => {
    const link = (
      <Link
        to={to}
        search={localeSearch()}
        onClick={() => setOpen(false)}
        className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/10 focus-visible:bg-primary/10"
      >
        {t(key)}
      </Link>
    );
    return mobile ? (
      <SheetClose asChild key={to}>
        {link}
      </SheetClose>
    ) : (
      <div key={to}>{link}</div>
    );
  });

  if (mobile)
    return (
      <div className="space-y-1" aria-label={t("nav.myDashboard")}>
        <p className="px-3 text-sm font-bold">{t("nav.myDashboard")}</p>
        {links}
        <SheetClose asChild>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-primary/10"
          >
            <LogOut className="me-2 inline h-4 w-4" />
            {t("sidebar.signOut")}
          </button>
        </SheetClose>
      </div>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="rounded-full px-5"
          aria-label={t("nav.myDashboard")}
        >
          {t("nav.myDashboard")} <ChevronDown className="ms-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
        <nav aria-label={t("nav.myDashboard")} className="space-y-1">
          {links}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-primary/10"
          >
            <LogOut className="me-2 inline h-4 w-4" />
            {t("sidebar.signOut")}
          </button>
        </nav>
      </PopoverContent>
    </Popover>
  );
}
