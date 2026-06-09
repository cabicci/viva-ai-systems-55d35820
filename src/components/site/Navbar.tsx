import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface-overlay backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-bold">
          <span
            className="grid h-9 w-9 place-items-center rounded-2xl"
            style={{ background: "var(--pastel-mint)" }}
          >
            <GraduationCap className="h-5 w-5 text-foreground animate-float" />
          </span>
          <span className="text-foreground tracking-tight">AI Ecosystem</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#ecosystem" className="hover:text-foreground transition">المسارات</a>
          <a href="#journey" className="hover:text-foreground transition">الرحلة</a>
          <a href="#philosophy" className="hover:text-foreground transition">الفلسفة</a>
          <Link to="/curriculum" className="hover:text-foreground transition">المنهج</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="rounded-full px-5"><Link to="/dashboard">لوحتي</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full"><Link to="/login">دخول</Link></Button>
              <Button asChild size="sm" className="rounded-full px-5 shadow-sm"><Link to="/signup">ابدأ مجاناً</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
