import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, ShieldCheck, Users } from "lucide-react";
import { KidsBrand } from "@/components/kids/KidsBrand";
import { Button } from "@/components/ui/button";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";

const copy = {
  "ar-EG": {
    eyebrow: "للأطفال والعيلة",
    title: "مسارات كيدز: رحلة مناسبة لكل مرحلة عمرية",
    intro:
      "ثلاث مستويات لتعلّم الذكاء الاصطناعي، في كل مستوى ١٢ درسًا. يتابع وليّ الأمر رحلة الطفل من حسابه، ويختار المستوى المناسب له.",
    levels: "ثلاث مراحل عمرية",
    lessons: "١٢ درسًا في كل مستوى",
    parent: "وليّ الأمر يدير ملفات الأطفال والتعلّم",
    free: "أول درسين في كل مستوى مجانًا بعد إنشاء حساب وليّ الأمر وتأكيد البريد والموافقة على سياسة الأطفال.",
    action: "اكتشف مسارات كيدز",
  },
  "ar-MSA": {
    eyebrow: "للأطفال والأسرة",
    title: "مسارات كيدز: رحلة مناسبة لكل مرحلة عمرية",
    intro:
      "ثلاثة مستويات لتعلّم الذكاء الاصطناعي، في كل مستوى 12 درسًا. يتابع وليّ الأمر رحلة الطفل من حسابه ويختار المستوى المناسب له.",
    levels: "ثلاث مراحل عمرية",
    lessons: "12 درسًا في كل مستوى",
    parent: "يدير وليّ الأمر ملفات الأطفال والتعلّم",
    free: "أول درسين في كل مستوى مجانيان بعد إنشاء حساب وليّ الأمر وتأكيد البريد والموافقة على سياسة الأطفال.",
    action: "اكتشف مسارات كيدز",
  },
  "ar-Gulf": {
    eyebrow: "للأطفال والعائلة",
    title: "مسارات كيدز: رحلة تناسب كل مرحلة عمرية",
    intro:
      "ثلاثة مستويات لتعلّم الذكاء الاصطناعي، في كل مستوى 12 درسًا. يتابع وليّ الأمر رحلة الطفل من حسابه ويختار المستوى المناسب له.",
    levels: "ثلاث مراحل عمرية",
    lessons: "12 درسًا في كل مستوى",
    parent: "وليّ الأمر يدير ملفات الأطفال والتعلّم",
    free: "أول درسين في كل مستوى مجانًا بعد إنشاء حساب وليّ الأمر وتأكيد البريد والموافقة على سياسة الأطفال.",
    action: "اكتشف مسارات كيدز",
  },
  en: {
    eyebrow: "For children and families",
    title: "Masaarat Kids: learning for every age level",
    intro:
      "Three age levels for learning about AI, with 12 lessons in each. A parent chooses the right level and manages each child's learning from their account.",
    levels: "Three age levels",
    lessons: "12 lessons in each level",
    parent: "Parents manage child profiles and learning",
    free: "The first two lessons in each level are free after parent signup, email confirmation and acceptance of the children's privacy policy.",
    action: "Explore Masaarat Kids",
  },
} as const;

export function KidsHomeIntroduction() {
  const { locale } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const t = copy[locale];
  const highlights = [
    { icon: Users, label: t.levels },
    { icon: BookOpen, label: t.lessons },
    { icon: ShieldCheck, label: t.parent },
  ];

  return (
    <section id="kids-introduction" className="container mx-auto px-4 py-24">
      <div className="rounded-3xl border border-border/60 bg-[var(--pastel-lavender)] p-6 md:p-12">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <span className="rounded-2xl bg-background/80 px-4 py-3">
            <KidsBrand />
          </span>
          <p className="text-sm font-semibold text-primary">{t.eyebrow}</p>
        </div>
        <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{t.title}</h2>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-foreground/80">{t.intro}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card p-5">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <p className="mt-3 font-bold">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-7 text-sm leading-relaxed text-muted-foreground">{t.free}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button asChild variant="hero" size="lg">
            <Link to="/kids" search={localeSearch()}>
              {t.action} <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {KIDS_LEVELS.map((level) => level.ages).join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
