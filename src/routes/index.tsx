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
      { title: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "description", content: "مسارات بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
      { property: "og:title", content: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { property: "og:description", content: "مسارات بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
      { property: "og:url", content: "https://masaarat.ai" },
      { name: "twitter:title", content: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "twitter:description", content: "مسارات بتاخدك خطوة بخطوة من فهم أساسيات الـ AI لحد ما تبني أدوات، أنظمة، ومشاريع حقيقية بنفسك." },
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
