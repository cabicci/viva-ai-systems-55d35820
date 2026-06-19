import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  isWowExperienceSeen,
  markWowExperienceSeen,
} from "@/lib/learner-events";

const FIRST_WEEK_DAYS = 7;

export function StartWowBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.created_at || isWowExperienceSeen()) {
      setVisible(false);
      return;
    }
    const ageDays =
      (Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000);
    setVisible(ageDays <= FIRST_WEEK_DAYS);
  }, [user?.created_at]);

  if (!visible) return null;

  function dismiss() {
    markWowExperienceSeen();
    setVisible(false);
  }

  return (
    <div className="glass rounded-2xl border border-primary/30 p-4 md:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-up">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-foreground text-sm mb-1">
            تجربة سريعة اختيارية (دقيقتان)
          </p>
          <p className="text-xs text-muted-foreground leading-loose">
            شاهد كيف تربط مساراتك الخمسة بفكرة مشروعك داخل منصة تضم 100 درس
            نشط — بدون التزام.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild variant="hero" size="sm">
          <Link to="/start">
            ابدأ التجربة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="إخفاء"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
