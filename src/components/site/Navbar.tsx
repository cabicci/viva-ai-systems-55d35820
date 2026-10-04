import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth-context";
import { LanguageSelector } from "@/components/locale/LanguageSelector";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { SAFE_LINE_RETURNS } from "@/lib/kids/auth-intent";
import {
  getLineCopy,
  learningLineForPath,
  LEARNING_LINES,
  LINE_ROUTES,
  LINE_PRICING,
  LINE_CURRICULUM,
} from "@/lib/learning-lines";

export function Navbar({ variant = "public" }: { variant?: "public" | "account" }) {
  const { user } = useAuth();
  const t = useUiString();
  const { dir, locale } = useLocale();
  const c = getLineCopy(locale);
  const search = useLocaleLinkSearch();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const line = learningLineForPath(path);
  const switchableLines = LEARNING_LINES.filter((item) => item !== line);
  const returnTo =
    SAFE_LINE_RETURNS.find((entry) => entry === path) ??
    (line ? LINE_ROUTES[line] : "/my-learning");
  const authSearch = search({ returnTo });
  const links = line
    ? [
        { to: LINE_ROUTES[line], label: c.overview },
        {
          to: LINE_CURRICULUM[line],
          label: c.paths,
        },
        { to: LINE_PRICING[line], label: c.plans },
        ...(user
          ? [
              {
                to:
                  line === "ai" ? "/dashboard" : line === "kids" ? "/kids/family" : "/my-learning",
                label: c.learning,
              },
            ]
          : []),
      ]
    : [
        { to: "/about", label: c.about },
        { to: "/contact", label: t("nav.contact") },
      ];
  return (
    <header
      className="sticky top-0 z-50 border-b border-border/60 bg-surface-overlay backdrop-blur-xl"
      data-print-hide
      data-learning-line={line ?? "platform"}
      data-account-view={variant}
    >
      <div className="container mx-auto flex h-20 items-center gap-3 px-4">
        <Link to="/" search={search()} className="flex shrink-0 items-center" aria-label={c.home}>
          <img
            src="/brand/masaarat-logo-lockup.png"
            alt={t("nav.brand")}
            className="h-9 w-auto max-w-[132px] select-none sm:h-11 sm:max-w-none"
            draggable={false}
          />
        </Link>
        {line && (
          <Link
            to={LINE_ROUTES[line]}
            search={search()}
            className="hidden border-s border-border ps-3 text-sm font-bold text-primary sm:inline-flex"
          >
            {c[line]}
          </Link>
        )}
        <nav
          aria-label={t("nav.menu")}
          className="hidden min-w-0 flex-1 items-center justify-center gap-5 whitespace-nowrap text-sm text-muted-foreground min-[1180px]:flex"
        >
          {links.map(({ to, label }, index) => (
            <Link
              key={`${to}-${index}`}
              to={to}
              search={search()}
              className="hover:text-foreground transition"
            >
              {label}
            </Link>
          ))}
          {line && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  {c.switch}
                  <ChevronDown className="ms-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-2">
                <nav aria-label={c.switch}>
                  {switchableLines.map((item) => (
                    <Link
                      key={item}
                      to={LINE_ROUTES[item]}
                      search={search()}
                      className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-primary/10"
                    >
                      {c[item]}
                    </Link>
                  ))}
                </nav>
              </PopoverContent>
            </Popover>
          )}
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSelector />
          <div className="hidden items-center gap-2 min-[1180px]:flex">
            {user ? (
              <DashboardNavigation />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login" search={authSearch}>
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/signup" search={authSearch}>
                    {t("nav.signup")}
                  </Link>
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
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              className="w-[min(88vw,360px)] overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>{line ? c[line] : c.home}</SheetTitle>
              </SheetHeader>
              <nav aria-label={t("nav.menu")} className="mt-6 space-y-1">
                {links.map(({ to, label }, index) => (
                  <SheetClose asChild key={`${to}-${index}`}>
                    <Link
                      to={to}
                      search={search()}
                      className="block rounded-lg px-3 py-3 text-sm font-semibold"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <section aria-label={c.switch}>
                  <p className="mt-5 border-t border-border px-3 pt-5 text-xs font-bold text-muted-foreground">
                    {c.switch}
                  </p>
                  {switchableLines.map((item) => (
                    <SheetClose asChild key={item}>
                      <Link
                        to={LINE_ROUTES[item]}
                        search={search()}
                        className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-primary/10"
                      >
                        {c[item]}
                      </Link>
                    </SheetClose>
                  ))}
                </section>
              </nav>
              <div className="mt-6 border-t border-border pt-5">
                {user ? (
                  <DashboardNavigation mobile />
                ) : (
                  <div className="grid gap-3">
                    <SheetClose asChild>
                      <Link
                        to="/login"
                        search={authSearch}
                        className="rounded-full border border-primary px-5 py-3 text-center font-bold"
                      >
                        {t("nav.login")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/signup"
                        search={authSearch}
                        className="rounded-full bg-primary px-5 py-3 text-center font-bold text-primary-foreground"
                      >
                        {t("nav.signup")}
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
