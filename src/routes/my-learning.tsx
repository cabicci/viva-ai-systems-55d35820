import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LearningLineCards } from "@/components/site/LearningLines";
import { getLineCopy } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
export const Route = createFileRoute("/my-learning")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: requireAuthBeforeLoad,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: MyLearning,
});
function MyLearning() {
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  return (
    <AuthSessionGate>
      <Navbar variant="account" />
      <main id="main-content" className="container mx-auto max-w-6xl px-4 py-14">
        <h1 className="text-4xl font-black">{c.learning}</h1>
        <p className="mb-8 mt-4 text-muted-foreground">{c.separate}</p>
        <LearningLineCards learning />
      </main>
      <Footer />
    </AuthSessionGate>
  );
}
