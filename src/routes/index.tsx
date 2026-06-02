import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Ecosystem } from "@/components/site/Ecosystem";
import { Journey } from "@/components/site/Journey";
import { Philosophy } from "@/components/site/Philosophy";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة عربية لتعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "description", content: "منصة عربية بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
      { property: "og:title", content: "منصة عربية لتعلّم الذكاء الاصطناعي بالتطبيق" },
      { property: "og:description", content: "منصة عربية بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
      { name: "twitter:title", content: "منصة عربية لتعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "twitter:description", content: "منصة عربية بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
    ],
    links: [
      { rel: "canonical", href: "https://ai-ecosystem-hub-72.lovable.app/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Ecosystem />
        <Journey />
        <Philosophy />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
