import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative grid-bg overflow-hidden p-16 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold relative z-10">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-gradient">AI Ecosystem</span>
        </Link>
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-20 -right-20 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[100px] animate-pulse-glow" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black leading-tight">
            منظومة <span className="text-gradient">حيّة</span> تتعلم وتبني معك.
          </h2>
          <p className="mt-4 text-muted-foreground">
            خمس مراحل، مهام تنفيذية، أدوات AI، ومنتج حقيقي في النهاية.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-gradient">AI Ecosystem</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-2 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
