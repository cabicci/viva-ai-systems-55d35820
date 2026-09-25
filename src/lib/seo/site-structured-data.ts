export const SITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://masaarat.ai/#organization",
      name: "مسارات",
      alternateName: "masaarat.ai",
      url: "https://masaarat.ai",
      description:
        "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك.",
      inLanguage: "ar",
      areaServed: { "@type": "Place", name: "MENA" },
    },
    {
      "@type": "WebSite",
      "@id": "https://masaarat.ai/#website",
      url: "https://masaarat.ai",
      name: "مسارات",
      alternateName: "masaarat.ai",
      inLanguage: "ar",
      publisher: { "@id": "https://masaarat.ai/#organization" },
    },
    {
      "@type": "ItemList",
      "@id": "https://masaarat.ai/#paths",
      name: "مسارات التعلم بالذكاء الاصطناعي",
      itemListOrder: "https://schema.org/ItemListUnordered",
      numberOfItems: 5,
      itemListElement: [
        {
          "@type": "Course",
          position: 1,
          name: "البناء — بناء تطبيقات AI",
          description:
            "اتعلّم تبني تطبيقات وأنظمة AI من الصفر باستخدام LLMs، RAG، Agents، وقواعد بيانات.",
          provider: { "@id": "https://masaarat.ai/#organization" },
          inLanguage: "ar",
          educationalLevel: "Beginner to Advanced",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: "PT80H",
          },
          offers: {
            "@type": "Offer",
            category: "Pro Plus",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Course",
          position: 2,
          name: "المحتوى — صناعة المحتوى بـ AI",
          description: "اتعلّم صناعة محتوى يوصل ويبيع: هوك، سكريبت، CTA، تصوير موبايل، Analytics.",
          provider: { "@id": "https://masaarat.ai/#organization" },
          inLanguage: "ar",
          educationalLevel: "Beginner to Intermediate",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: "PT40H",
          },
          offers: {
            "@type": "Offer",
            category: "Pro",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Course",
          position: 3,
          name: "الأتمتة — أتمتة العمليات بـ n8n و AI",
          description: "اتعلّم تأتمت شغلك: Triggers/Actions، Webhooks، RAG في n8n، WhatsApp flows.",
          provider: { "@id": "https://masaarat.ai/#organization" },
          inLanguage: "ar",
          educationalLevel: "Beginner to Advanced",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: "PT50H",
          },
          offers: {
            "@type": "Offer",
            category: "Pro",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Course",
          position: 4,
          name: "التحليل — تحليل البيانات واتخاذ القرار",
          description:
            "من السؤال الصح للقرار: AI summarization، patterns vs outliers، dashboards أسبوعية.",
          provider: { "@id": "https://masaarat.ai/#organization" },
          inLanguage: "ar",
          educationalLevel: "Beginner to Intermediate",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: "PT35H",
          },
          offers: {
            "@type": "Offer",
            category: "Pro",
            availability: "https://schema.org/InStock",
          },
        },
        {
          "@type": "Course",
          position: 5,
          name: "الأعمال — قيادة المنظومة",
          description:
            "من القرارات للقيادة: weekly rhythm، customer lifecycle، delegate-or-automate، scaling.",
          provider: { "@id": "https://masaarat.ai/#organization" },
          inLanguage: "ar",
          educationalLevel: "Intermediate to Advanced",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            courseWorkload: "PT30H",
          },
          offers: {
            "@type": "Offer",
            category: "Pro",
            availability: "https://schema.org/InStock",
          },
        },
      ],
    },
  ],
};
