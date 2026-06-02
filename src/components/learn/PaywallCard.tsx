import { Lock, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/* Inline paywall used inside the lesson page when a free user
 * tries to open a Pro-only lesson. */
export function PaywallCard({
  pathTitle,
  pathId,
}: {
  pathTitle: string;
  pathId: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 text-center space-y-5">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-primary)]">
        <Lock className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
          <Sparkles className="h-3 w-3" /> Pro
        </span>
        <h2 className="text-2xl font-black">الدرس ده ضمن اشتراك Pro</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          أول درس في {pathTitle} مجاني — وعشان تكمّل باقي المسار وكل المسارات
          التانية، فعّل اشتراك Pro. الدفع هيتفعّل قريبًا.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
        <Button asChild variant="violet" size="lg">
          <Link to="/account">
            <Sparkles className="h-4 w-4" /> فعّل Pro
          </Link>
        </Button>
        <Button asChild variant="glass" size="lg">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 rotate-180" /> رجوع للوحة
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        مسار: {pathTitle} ({pathId})
      </p>
    </div>
  );
}

/* Inline "complete intro first" gate */
export function IntroGateCard({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-8 text-center space-y-5">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-accent)]">
        <Sparkles className="h-6 w-6 text-accent-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black">اكمل المقدمة الأول</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          عشان تفتح أي مسار، لازم تخلّص الـ {total} دروس بتوع المقدمة. لسه
          متبقّي {Math.max(total - done, 0)} درس.
        </p>
      </div>
      <Button asChild variant="hero" size="lg">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4 rotate-180" /> ابدأ المقدمة
        </Link>
      </Button>
    </div>
  );
}