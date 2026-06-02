import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Hero() {
  const { user, loading } = useAuth();
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Soft pastel blobs — accents only, very airy */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-70"
        style={{ background: "var(--pastel-mint)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -left-20 h-[360px] w-[360px] rounded-full blur-3xl opacity-60"
        style={{ background: "var(--pastel-pink)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-[300px] w-[300px] rounded-full blur-3xl opacity-60"
        style={{ background: "var(--pastel-yellow)" }}
      />

      <div className="container relative mx-auto px-4 py-24 md:py-32 text-center">
        <div
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 animate-twinkle" style={{ color: "oklch(0.55 0.10 235)" }} />
          <span>منصة عربية لتعلّم الذكاء الاصطناعي بالتطبيق</span>
        </div>

        <h1 className="mt-8 font-black text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-foreground">
          اتعلم الذكاء الاصطناعي
          <br />
          <span className="relative inline-block">
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-3 md:h-4 rounded-full -z-0"
              style={{ background: "var(--pastel-yellow)" }}
            />
            <span className="relative">بالتطبيق</span>
          </span>{" "}
          <span className="text-foreground/80">مش بالكلام</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          منصة عربية بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {loading ? null : user ? (
            <Button asChild size="xl" className="rounded-full px-7 shadow-md">
              <Link to="/dashboard">
                افتح لوحتي <ArrowLeft className="h-4 w-4 animate-arrow-nudge-always" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="xl" className="rounded-full px-7 shadow-md">
              <Link to="/signup">
                ابدأ مجاناً <ArrowLeft className="h-4 w-4 animate-arrow-nudge-always" />
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            size="xl"
            className="rounded-full border-border bg-white px-7 hover:bg-muted"
          >
            <a href="#ecosystem">شوف المسارات</a>
          </Button>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-2.5 text-xs">
          {[
            { label: "طبّق من أول خطوة", c: "var(--pastel-blue)" },
            { label: "افهم الصورة كاملة", c: "var(--pastel-mint)" },
            { label: " تعلم بعقلية الـ AI", c: "var(--pastel-pink)" },
            { label: "ابني حاجة حقيقية", c: "var(--pastel-yellow)" },
          ].map((t) => (
            <span
              key={t.label}
              className="rounded-full border border-border/60 bg-white px-3.5 py-1.5 text-foreground/80 shadow-sm"
            >
              <span
                className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: t.c }}
              />
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
