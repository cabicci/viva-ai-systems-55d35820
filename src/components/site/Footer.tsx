import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} مسارات (masaarat.ai) — منظومة تعليمية حيّة.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <Link to="/pricing" className="hover:text-foreground transition">
            الباقات
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition">
            سياسة الخصوصية
          </Link>
          <Link to="/terms" className="hover:text-foreground transition">
            الشروط والأحكام
          </Link>
          <span className="font-mono opacity-70">v0.1 · early access</span>
        </nav>
      </div>
    </footer>
  );
}
