export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} مسارات (masaarat.ai) — منظومة تعليمية حيّة.</p>
        <p className="font-mono text-xs opacity-70">v0.1 · early access</p>
      </div>
    </footer>
  );
}
