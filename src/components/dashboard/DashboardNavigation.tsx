import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SheetClose } from "@/components/ui/sheet";
import { getLineCopy } from "@/lib/learning-lines";

const accountLinks: { to: string; key: UiStringKey }[] = [
  { to: "/account", key: "sidebar.account" },
  { to: "/payments", key: "sidebar.payments" },
];

const adminLinks: { to: string; key: UiStringKey }[] = [
  { to: "/admin", key: "sidebar.admin" },
  { to: "/admin/commerce", key: "sidebar.commerce" },
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
  const { locale } = useLocale();
  const copy = getLineCopy(locale);
  const [open, setOpen] = useState(false);

  const renderLink = ({ to, key }: { to: string; key: UiStringKey }) => {
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
  };

  const links = (
    <>
      {accountLinks.map(renderLink)}
      {isAdmin && (
        <div className="mt-3 border-t border-border pt-3">
          {adminLinks.slice(0, 2).map(renderLink)}
          <details className="mt-1">
            <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold">
              {copy.adminTools}
            </summary>
            {adminLinks.slice(2).map(renderLink)}
          </details>
        </div>
      )}
    </>
  );
  if (mobile)
    return (
      <section className="space-y-1" aria-label={t("sidebar.account")}>
        <p className="px-3 text-sm font-bold">{t("sidebar.account")}</p>
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
      </section>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="rounded-full px-5"
          aria-label={t("sidebar.account")}
        >
          {t("sidebar.account")} <ChevronDown className="ms-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
        <nav aria-label={t("sidebar.account")} className="space-y-1">
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
