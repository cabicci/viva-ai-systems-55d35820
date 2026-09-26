import { Link } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { LanguageSelector } from "@/components/locale/LanguageSelector";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { KidsBrand } from "@/components/kids/KidsBrand";
import {
  AccountHeaderLinks,
  DashboardNavigation,
} from "@/components/dashboard/DashboardNavigation";
import { useEntitlement } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

export function Navbar({ variant = "public" }: { variant?: "public" | "account" }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useEntitlement();
  const t = useUiString();
  const { dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const accountView = variant === "account" && Boolean(user);

  const publicNavigation = (
    <>
      <a href="/#ecosystem" className="hover:text-foreground transition">
        {t("nav.paths")}
      </a>
      <a href="/#journey" className="hover:text-foreground transition">
        {t("nav.journey")}
      </a>
      <a href="/#philosophy" className="hover:text-foreground transition">
        {t("nav.philosophy")}
      </a>
      <Link to="/curriculum" search={localeSearch()} className="hover:text-foreground transition">
        {t("nav.curriculum")}
      </Link>
      <Link to="/pricing" search={localeSearch()} className="hover:text-foreground transition">
        {t("nav.pricing")}
      </Link>
      <Link to="/contact" search={localeSearch()} className="hover:text-foreground transition">
        {t("nav.contact")}
      </Link>
      <Link to="/kids" search={localeSearch()} className="hover:text-foreground transition">
        <KidsBrand compact />
      </Link>
    </>
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/60 bg-surface-overlay backdrop-blur-xl"
      data-print-hide
    >
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center" aria-label={t("nav.brand")}>
          <img
            src="/brand/masaarat-logo-lockup.png"
            alt={t("nav.brand")}
            className="h-8 w-auto select-none 2xl:h-10"
            draggable={false}
          />
        </Link>
        <nav
          aria-label={accountView ? t("nav.myDashboard") : t("nav.menu")}
          className="hidden min-w-0 flex-1 items-center justify-center gap-3 whitespace-nowrap text-xs text-muted-foreground min-[1180px]:flex 2xl:gap-5 2xl:text-sm"
        >
          {accountView ? <AccountHeaderLinks /> : publicNavigation}
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSelector />
          <div className="hidden items-center gap-2 min-[1180px]:flex">
            {accountView ? (
              <>
                {isAdmin && <DashboardNavigation />}
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  <LogOut className="me-1 h-4 w-4" />
                  {t("sidebar.signOut")}
                </Button>
              </>
            ) : user ? (
              <DashboardNavigation />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
                  <Link to="/signup">{t("nav.signup")}</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full min-[1180px]:hidden"
                aria-label={t("nav.menu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={dir === "rtl" ? "left" : "right"} className="w-[min(88vw,360px)]">
              <SheetHeader className="text-start">
                <SheetTitle>{t("nav.menu")}</SheetTitle>
              </SheetHeader>
              {accountView ? (
                <div className="mt-8">
                  <DashboardNavigation mobile />
                </div>
              ) : (
                <>
                  <nav className="mt-8 flex flex-col gap-5 text-base text-foreground/85">
                    <SheetClose asChild>
                      <a href="/#ecosystem">{t("nav.paths")}</a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="/#journey">{t("nav.journey")}</a>
                    </SheetClose>
                    <SheetClose asChild>
                      <a href="/#philosophy">{t("nav.philosophy")}</a>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/curriculum" search={localeSearch()}>
                        {t("nav.curriculum")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/pricing" search={localeSearch()}>
                        {t("nav.pricing")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/contact" search={localeSearch()}>
                        {t("nav.contact")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/kids" search={localeSearch()}>
                        <KidsBrand compact />
                      </Link>
                    </SheetClose>
                  </nav>
                  <div className="mt-8 grid gap-3 border-t border-border/60 pt-6">
                    {user ? (
                      <DashboardNavigation mobile />
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link
                            to="/login"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "lg" }),
                              "w-full",
                            )}
                          >
                            {t("nav.login")}
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            to="/signup"
                            className={cn(buttonVariants({ size: "lg" }), "w-full")}
                          >
                            {t("nav.signup")}
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
