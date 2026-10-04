import type { SupportedLocale } from "@/lib/locale/types";
import type { TechnicalLesson } from "@/lib/technical-education/types";

const terms = {
  "ar-EG": [
    "المستخدم",
    "الاحتياج",
    "القيود",
    "دليل القبول",
    "مرجع القياس",
    "حركة الباب",
    "قائم",
    "مدمج",
    "موجز",
    "رسومات",
    "مراجعة",
    "تسليم",
  ],
  "ar-MSA": [
    "المستخدم",
    "المتطلبات",
    "القيود",
    "دليل القبول",
    "مرجع القياس",
    "مسار الباب",
    "قائم",
    "مدمج",
    "موجز",
    "رسومات",
    "مراجعة",
    "تسليم",
  ],
  "ar-Gulf": [
    "المستخدم",
    "الاحتياج",
    "القيود",
    "دليل القبول",
    "مرجع القياس",
    "حركة الباب",
    "قائم",
    "مدمج",
    "موجز",
    "رسومات",
    "مراجعة",
    "تسليم",
  ],
  en: [
    "User",
    "Requirements",
    "Constraints",
    "Evidence",
    "Reference",
    "Door swing",
    "Freestanding",
    "Built-in",
    "Brief",
    "Drawings",
    "Review",
    "Handover",
  ],
};
export function TechnicalDiagram({
  kind,
  locale,
  title,
}: {
  kind: TechnicalLesson["sections"][number]["diagram"];
  locale: SupportedLocale;
  title: string;
}) {
  const t = terms[locale];
  const label = (x: number, y: number, value: string) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize="16"
      fill="#203f45"
      direction={locale === "en" ? "ltr" : "rtl"}
    >
      {value}
    </text>
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 270"
      role="img"
      aria-label={title}
      className="w-full rounded-2xl bg-accent/20"
      style={{ fontFamily: "sans-serif", width: "100%", height: "auto" }}
    >
      <title>{title}</title>
      {kind === "brief" && (
        <>
          <path
            d="M105 70H290M105 70V195H290M290 70V195"
            fill="none"
            stroke="#3dbbbf"
            strokeWidth="3"
          />
          {[0, 1, 2, 3].map((i) => {
            const x = i % 2 ? 290 : 105,
              y = i < 2 ? 70 : 195;
            return (
              <g key={i}>
                <rect
                  x={x - 76}
                  y={y - 27}
                  width="152"
                  height="54"
                  rx="15"
                  fill={i === 3 ? "#9be3c4" : "#e7f1fa"}
                  stroke="#387b83"
                />
                {label(x, y + 6, t[i])}
              </g>
            );
          })}
        </>
      )}
      {kind === "survey" && (
        <>
          <path d="M60 55H330V205H150M105 205H60V55" fill="none" stroke="#203f45" strokeWidth="6" />
          <path
            d="M105 205V150M105 150A55 55 0 0 1 160 205"
            fill="none"
            stroke="#3dbbbf"
            strokeWidth="3"
          />
          <path d="M70 40H320M70 33V47M320 33V47" stroke="#876642" strokeWidth="2" />
          <circle cx="60" cy="55" r="8" fill="#c2acda" />
          <rect x="240" y="80" width="60" height="90" rx="4" fill="#9be3c4" stroke="#387b83" />
          {label(195, 27, t[4])}
          {label(145, 241, t[5])}
        </>
      )}
      {kind === "scope" && (
        <>
          <path d="M220 45H355V205H220" fill="none" stroke="#203f45" strokeWidth="7" />
          <rect
            x="40"
            y="65"
            width="110"
            height="135"
            rx="5"
            fill="#e7f1fa"
            stroke="#387b83"
            strokeWidth="3"
          />
          <path d="M55 200V215M135 200V215M95 65V200M45 140H145" stroke="#387b83" strokeWidth="3" />
          <rect
            x="225"
            y="50"
            width="125"
            height="150"
            fill="#9be3c4"
            stroke="#387b83"
            strokeWidth="3"
          />
          <path d="M285 50V200M230 125H345" stroke="#387b83" strokeWidth="2" />
          {label(95, 246, t[6])}
          {label(288, 246, t[7])}
        </>
      )}
      {kind === "workflow" && (
        <>
          <path
            d="M112 70H286V192H112V70"
            fill="none"
            stroke="#3dbbbf"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          {[8, 9, 10, 11].map((i) => {
            const x = i % 2 ? 286 : 112,
              y = i < 10 ? 70 : 192;
            return (
              <g key={i}>
                <rect
                  x={x - 65}
                  y={y - 25}
                  width="130"
                  height="50"
                  rx="12"
                  fill={i === 10 ? "#c2acda" : "#e7f1fa"}
                  stroke="#387b83"
                />
                {label(x, y + 6, t[i])}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}
