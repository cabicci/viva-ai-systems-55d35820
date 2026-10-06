export function AcademicDiagram({ kind, english = false }: { kind: string; english?: boolean }) {
  const words: Record<string, string[]> = english
    ? {
        customer: ["Customer", "Situation", "Need", "Alternative"],
        value: ["Feature", "Benefit", "Evidence"],
        system: ["Resources", "Activities", "Outputs"],
        money: ["Revenue 3000", "Direct cost 1800", "Other costs 900", "Result 300"],
        decision: ["Assumption", "Small test", "Observation", "Decision"],
        evidence: ["Observation", "Calculation", "Assumption"],
      }
    : {
        customer: ["العميل", "الموقف", "الاحتياج", "البديل"],
        value: ["ميزة", "فائدة للعميل", "دليل التحقق"],
        system: ["موارد", "أنشطة", "مخرجات"],
        money: ["إيراد 3000", "تكلفة مباشرة 1800", "مصاريف أخرى 900", "نتيجة 300"],
        decision: ["افتراض", "تجربة محدودة", "ملاحظة", "قرار"],
        evidence: ["ملاحظة", "حساب", "افتراض"],
      };
  const labels = words[kind] ?? words.customer;
  const colors = ["#e2eef5", "#dcefe3", "#e8e0f2", "#fbf1d6"];
  return (
    <svg
      className="academic-figure"
      viewBox="0 0 560 350"
      role="img"
      aria-label={labels.join("، ")}
    >
      <rect width="560" height="350" rx="26" fill="#f8fafb" />
      {labels.map((label, i) => {
        const x = labels.length === 3 ? 90 : i % 2 === 0 ? 25 : 290,
          y = labels.length === 3 ? 24 + i * 105 : 45 + Math.floor(i / 2) * 150,
          w = labels.length === 3 ? 380 : 245;
        return (
          <g key={label}>
            <rect x={x} y={y} width={w} height="86" rx="20" fill={colors[i]} />
            <text
              x={x + w / 2}
              y={y + 51}
              textAnchor="middle"
              direction={english ? "ltr" : "rtl"}
              fontFamily="Tajawal,Arial,sans-serif"
              fontSize="24"
              fontWeight="700"
              fill="#203f45"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
