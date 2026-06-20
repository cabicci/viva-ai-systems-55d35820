import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  
  MessageCircle,
  Menu,
  Images,
  Wrench,
  Activity,
  Brain,
  Terminal,
  Map as MapIcon,
  ChevronDown,
  User,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { BrandMark } from "@/components/brand/BrandMark";
import { useEffect, useState } from "react";

const items = [
  { to: "/dashboard", label: "اللوحة", icon: LayoutDashboard },
  { to: "/ai-assistant", label: "مساعد المنصة", icon: MessageCircle },
  { to: "/analytics", label: "تحليلاتي", icon: BarChart3 },
  { to: "/account", label: "حسابي", icon: User },
];

const devItems = [
  { to: "/image-gallery", label: "معرض الصور", icon: Images },
  { to: "/roadmap", label: "Roadmap", icon: MapIcon },
  { to: "/assistant-runtime", label: "Assistant Runtime", icon: Brain },
  { to: "/system-state", label: "System State", icon: Activity },
  { to: "/build-logs", label: "Build Logs", icon: Terminal },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const { isAdmin } = useEntitlement();
  const [open, setOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(true);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {items.map((it, i) => {
        const active = path === it.to;
        return (
          <Link
            key={i}
            to={it.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
          >
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        );
      })}
      {isAdmin && (
      <div className="pt-3">
        <button
          type="button"
          onClick={() => setDevOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
        >
          <span className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5" /> أدوات النظام
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${devOpen ? "rotate-180" : ""}`}
          />
        </button>
        {devOpen && (
          <div className="mt-1 space-y-0.5">
            {devItems.map((it, i) => {
              const active = path === it.to;
              return (
                <Link
                  key={i}
                  to={it.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                >
                  <it.icon className="h-3.5 w-3.5" /> {it.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      )}
    </>
  );

  return (
    <>
    {/* Push main content down on mobile to clear the fixed top bar */}
    <style>{`
      @media (max-width: 1023px) {
        main { padding-top: 4rem; }
      }
      @media print {
        main { padding-top: 0 !important; }
      }
    `}</style>

    {/* Mobile top bar */}
    <header
      className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-4 py-3 glass border-b border-border/50"
      data-print-hide
      dir="rtl"
    >
      <Link to="/" className="flex items-center" aria-label="مسارات">
        <BrandMark className="h-8" />
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="فتح القائمة"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 hover:bg-foreground/5 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-5 flex flex-col" dir="rtl">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center mb-6" aria-label="مسارات">
            <BrandMark className="h-9" />
          </Link>
          <nav className="space-y-1 flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
            <NavItems onNavigate={() => setOpen(false)} />
          </nav>
          <div className="glass rounded-xl p-3 mb-3">
            <p className="text-xs text-muted-foreground">مرحبًا</p>
            <p className="text-sm font-semibold truncate">{user?.email ?? "ضيف"}</p>
          </div>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition"
          >
            <LogOut className="h-4 w-4" /> تسجيل خروج
          </button>
        </SheetContent>
      </Sheet>
    </header>

    {/* Desktop sidebar */}
    <aside className="hidden lg:flex w-64 flex-col glass border-l border-border/50 p-5 sticky top-0 h-screen">
      <Link to="/" className="flex items-center mb-8" aria-label="مسارات">
        <BrandMark className="h-9" />
      </Link>

      <nav className="space-y-1 flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
        <NavItems />
      </nav>

      <div className="glass rounded-xl p-3 mb-3">
        <p className="text-xs text-muted-foreground">مرحبًا</p>
        <p className="text-sm font-semibold truncate">{user?.email ?? "ضيف"}</p>
      </div>
      <button onClick={() => signOut()} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition">
        <LogOut className="h-4 w-4" /> تسجيل خروج
      </button>
    </aside>
    </>
  );
}
