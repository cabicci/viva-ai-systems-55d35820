import type { SupportedLocale } from "@/lib/locale/types";
import type { TechnicalDiagramKind } from "@/lib/technical-education/types";

/** Each key depicts one explanation, shared by reading, zoom and workbook. */
export function TechnicalDiagram({
  kind,
  locale,
  title,
}: {
  kind: TechnicalDiagramKind;
  locale: SupportedLocale;
  title: string;
}) {
  const en = locale === "en";
  const t = (ar: string, english: string) => (en ? english : ar);
  const ink = "#203f45",
    teal = "#387b83",
    mint = "#9be3c4",
    pale = "#e7f1fa",
    purple = "#c2acda";
  const label = (x: number, y: number, value: string, size = 15) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      fill={ink}
      direction={/^[0-9A-Z(]/.test(value) ? "ltr" : en ? "ltr" : "rtl"}
    >
      {value}
    </text>
  );
  const box = (x: number, y: number, w: number, h: number, value: string, fill = pale) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={fill} stroke={teal} strokeWidth="2" />
      {label(x + w / 2, y + h / 2 + 5, value, Math.min(15, w / (value.length * 0.62)))}
    </g>
  );
  const line = (x1: number, y1: number, x2: number, y2: number, color = teal) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" />
  );
  const dim = (x1: number, y1: number, x2: number, y2: number, value: string) => (
    <g>
      {line(x1, y1, x2, y2)}
      {line(x1 - 4, y1 - 5, x1 + 4, y1 + 5)}
      {line(x2 - 4, y2 - 5, x2 + 4, y2 + 5)}
      {label((x1 + x2) / 2, (y1 + y2) / 2 - 10, value, 14)}
    </g>
  );
  const page = (x: number, y: number, w = 80, h = 95) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill="white" stroke={teal} strokeWidth="2" />
      {[18, 32, 46].map((v) => (
        <path key={v} d={`M${x + 12} ${y + v}h${w - 24}`} stroke={teal} strokeWidth="2" />
      ))}
    </g>
  );
  const room = (
    <path d="M55 50H345V215H160M100 215H55V50" fill="none" stroke={ink} strokeWidth="6" />
  );
  const aliases = {
    brief: "brief-use",
    survey: "survey-reference",
    scope: "scope-construction",
    workflow: "workflow-deliverables",
  } as const;
  const key = kind in aliases ? aliases[kind as keyof typeof aliases] : kind;
  const cabinet = (highlight: "width" | "openings" | "brief") => (
    <g>
      <rect x="105" y="50" width="190" height="170" fill="white" stroke={teal} strokeWidth="2" />
      <rect x="105" y="50" width="12" height="170" fill={purple} stroke={teal} />
      <rect x="283" y="50" width="12" height="170" fill={purple} stroke={teal} />
      {[50, 129, 208].map((y) => (
        <rect key={y} x="117" y={y} width="166" height="12" fill={mint} stroke={teal} />
      ))}
      {highlight === "brief" && (
        <>
          {dim(105, 32, 295, 32, "600 mm")}
          {label(333, 139, "600", 14)}
          {line(315, 50, 315, 220)}
          {label(200, 246, t("هيكل 18 · ظهر 6 mm", "Body 18 · back 6 mm"), 14)}
        </>
      )}
      {highlight === "width" && (
        <>
          {dim(117, 102, 283, 102, "564 mm")}
          {label(110, 242, "18", 13)}
          {label(290, 242, "18", 13)}
          {label(200, 30, "600 − 18 − 18 = 564", 16)}
        </>
      )}
      {highlight === "openings" && (
        <>
          {line(200, 62, 200, 129)}
          {line(200, 141, 200, 208)}
          {label(237, 101, "273 mm", 14)}
          {label(237, 181, "273 mm", 14)}
          {label(200, 30, "(600 − 3 × 18) ÷ 2", 16)}
          {label(200, 247, t("فتحتان صافيتان متساويتان", "Two equal clear openings"), 14)}
        </>
      )}
    </g>
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 270"
      role="img"
      aria-label={title}
      data-diagram={key}
      className="w-full rounded-2xl bg-accent/20"
      style={{ fontFamily: "sans-serif", width: "100%", height: "auto" }}
    >
      <title>{title}</title>
      <rect width="400" height="270" rx="16" fill="#f4faf8" />
      {key === "brief-use" && (
        <>
          <circle cx="65" cy="55" r="18" fill={purple} stroke={teal} />
          <path d="M35 112V96Q65 65 95 96V112" fill={purple} stroke={teal} strokeWidth="2" />
          {label(65, 140, t("المستخدم", "User"))}
          {line(105, 77, 142, 77)}
          {box(145, 49, 215, 56, t("النشاط والمحتويات", "Activity + contents"))}
          {line(250, 110, 250, 155)}
          {box(35, 164, 105, 58, t("ضروري", "Essential"), mint)}
          {box(148, 164, 105, 58, t("مهم", "Important"))}
          {box(261, 164, 105, 58, t("اختياري", "Optional"))}
          {line(87, 154, 314, 154)}
          {label(200, 248, t("رتّب المتطلبات حسب الأولوية", "Prioritize the requirements"), 14)}
        </>
      )}
      {key === "brief-constraints" && (
        <>
          {box(25, 30, 155, 45, t("مقاس غير مؤكد", "Unknown size"), purple)}
          {box(220, 30, 155, 45, t("ميزانية وموعد", "Budget + date"))}
          {line(102, 78, 102, 116)}
          {line(297, 78, 297, 116)}
          {box(50, 118, 300, 48, t("سؤال + مسؤول عن التأكيد", "Question + verification owner"))}
          {line(200, 167, 200, 190)}
          {box(65, 193, 270, 46, t("قرار ينتظر المعلومة", "Decision awaiting evidence"), mint)}
        </>
      )}
      {key === "brief-acceptance" && (
        <>
          <rect x="75" y="40" width="250" height="138" fill="white" stroke={teal} strokeWidth="4" />
          <rect x="85" y="167" width="230" height="11" fill={mint} />
          <rect
            x="135"
            y="88"
            width="125"
            height="70"
            rx="7"
            fill={purple}
            stroke={teal}
            strokeWidth="2"
          />
          <path d="M170 88V76h55v12" fill="none" stroke={teal} strokeWidth="3" />
          {dim(135, 66, 260, 66, t("مقاس مؤكد", "Verified size"))}
          <path d="M40 125h70l-12-9m12 9-12 9" fill="none" stroke={teal} strokeWidth="3" />
          {label(200, 205, t("راجع مسار إدخال الحقيبة", "Check the bag insertion path"), 14)}
          {box(55, 221, 290, 32, t("احتياج ← اختبار ← دليل قبول", "Need → check → evidence"), mint)}
        </>
      )}
      {key === "survey-reference" && (
        <>
          {room}
          <circle cx="55" cy="50" r="8" fill={purple} />
          <path
            d="M55 50h45m-10-7 10 7-10 7M55 50v45m-7-10 7 10 7-10"
            fill="none"
            stroke={teal}
            strokeWidth="3"
          />
          {label(30, 34, "A", 15)}
          {label(205, 77, t("حائط 1", "Wall 1"))}
          {label(296, 147, t("حائط 2", "Wall 2"))}
          {dim(65, 30, 335, 30, t("مرجع ثابت", "Fixed reference"))}
          {box(85, 229, 230, 30, t("سجّل الوحدة: mm", "Record the unit: mm"), mint)}
        </>
      )}
      {key === "survey-obstacles" && (
        <>
          {room}
          <path d="M100 215v-65m0 0a65 65 0 0 1 65 65" fill="none" stroke={teal} strokeWidth="3" />
          <path d="M345 110h-30v35h30" fill={purple} stroke={teal} />
          <rect x="267" y="50" width="23" height="13" fill={mint} stroke={teal} />
          <circle cx="280" cy="57" r="2" fill={ink} />
          <path d="M110 44h70" stroke={purple} strokeWidth="7" />
          {label(145, 30, t("شباك", "Window"))}
          {label(255, 87, t("مقبس", "Socket"), 14)}
          {label(262, 137, t("بروز", "Projection"), 14)}
          {label(198, 182, t("حركة الباب", "Door swing"), 14)}
          {label(200, 248, t("اربط الرموز بصور الموقع", "Link symbols to site photos"), 14)}
        </>
      )}
      {key === "survey-check" && (
        <>
          <path d="M70 45V215M325 45L335 215" fill="none" stroke={ink} strokeWidth="5" />
          {dim(70, 75, 327, 75, "1194 mm")}
          {dim(70, 193, 334, 193, "1200 mm")}
          {box(92, 111, 215, 47, "1200 − 1194 = 6 mm", purple)}
          {label(200, 246, t("فرق يحتاج تحقق", "Difference to investigate"), 16)}
        </>
      )}
      {key === "scope-construction" && (
        <>
          <rect
            x="35"
            y="65"
            width="130"
            height="142"
            rx="4"
            fill={pale}
            stroke={teal}
            strokeWidth="3"
          />
          <path d="M100 65V207M35 139H165M50 207v12m100-12v12" stroke={teal} strokeWidth="3" />
          <path d="M221 50H366V211H221" fill="none" stroke={ink} strokeWidth="6" />
          <rect x="227" y="56" width="133" height="149" fill={mint} stroke={teal} strokeWidth="2" />
          <path d="M291 56V205M227 131H360" stroke={teal} strokeWidth="2" />
          {label(100, 245, t("قائم", "Freestanding"))}
          {label(293, 245, t("مدمج", "Built-in"))}
        </>
      )}
      {key === "scope-customization" && (
        <>
          {[45, 160, 275].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y="75"
                width={i === 2 ? 87 : 75}
                height={i === 2 ? 116 : 95}
                fill={i === 2 ? mint : pale}
                stroke={teal}
                strokeWidth="3"
              />
              <path d={`M${x} 123h${i === 2 ? 87 : 75}`} stroke={teal} strokeWidth="2" />
              {i === 1 && (
                <path d={`M${x + 20} 59h35m-6-5 6 5-6 5m-23-5-6 5 6 5`} stroke={teal} fill="none" />
              )}
            </g>
          ))}
          {label(83, 217, t("قياسي", "Standard"), 14)}
          {label(197, 217, t("شبه مخصص", "Configurable"), 14)}
          {label(318, 217, t("مخصص", "Bespoke"), 14)}
          {label(200, 250, t("راجع حدود تعديل المورد", "Check supplier modification limits"), 13)}
        </>
      )}
      {key === "scope-responsibility" && (
        <>
          {[t("المخرج", "Output"), t("المسؤول", "Owner"), t("التسليم", "Handoff")].map((v, i) => (
            <g key={v}>{box(20 + i * 125, 28, 115, 35, v, mint)}</g>
          ))}
          {[
            [t("رسم", "Drawing"), t("مصمم", "Designer"), t("ورشة", "Workshop")],
            [t("تصنيع", "Fabrication"), t("ورشة", "Workshop"), t("تركيب", "Installation")],
            [t("خدمات", "Services"), t("مختص", "Specialist"), t("اعتماد", "Approval")],
          ].map((row, i) => (
            <g key={i}>
              {row.map((v, j) => (
                <g key={j}>{box(20 + j * 125, 80 + i * 54, 115, 42, v, i === 2 ? purple : pale)}</g>
              ))}
            </g>
          ))}
          {label(
            200,
            259,
            t("حدّد الداخل والخارج من النطاق", "Define inclusions and exclusions"),
            13,
          )}
        </>
      )}
      {key === "workflow-deliverables" && (
        <>
          {line(105, 84, 295, 84)}
          {line(295, 84, 295, 190)}
          {line(105, 190, 295, 190)}
          {page(64, 42)}
          {label(104, 157, t("موجز وموقع", "Brief + survey"), 14)}
          {page(255, 42)}
          {label(295, 157, t("رسومات وقائمة", "Drawings + list"), 14)}
          {box(240, 179, 118, 45, t("فحص وتسليم", "Inspect + deliver"), mint)}
          {box(40, 179, 147, 45, t("تصنيع وتركيب", "Build + install"), purple)}
          {label(200, 251, t("لكل مرحلة مخرج يُراجع", "Review each stage output"), 14)}
        </>
      )}
      {key === "workflow-approval" && (
        <>
          {page(35, 40, 80, 110)}
          {label(75, 173, t("مخرج للمراجعة", "Review output"), 13)}
          {line(116, 95, 152, 95)}
          <path d="M215 43l63 52-63 52-63-52Z" fill={purple} stroke={teal} strokeWidth="2" />
          {label(215, 92, t("ملاحظة", "Open"), 14)}
          {label(215, 112, t("مفتوحة؟", "comment?"), 14)}
          {line(278, 95, 311, 95)}
          {box(308, 66, 83, 58, t("اعتماد", "Approve"), mint)}
          {line(215, 148, 215, 187)}
          {box(142, 190, 150, 43, t("تصحيح وإعادة فحص", "Fix + recheck"))}
          <path d="M140 211H75V181" fill="none" stroke={teal} strokeWidth="2" />
          {label(298, 53, t("لا", "No"), 13)}
          {label(237, 176, t("نعم", "Yes"), 13)}
        </>
      )}
      {key === "workflow-revisions" && (
        <>
          {page(35, 37, 100, 102)}
          {label(85, 166, "R01", 17)}
          <path d="M40 43l89 88m0-88-89 88" stroke="#ad6554" strokeWidth="4" />
          {line(142, 91, 249, 91)}
          {label(200, 72, t("تغيير مقاس", "Size change"), 14)}
          {page(265, 37, 100, 102)}
          {label(315, 166, "R02", 17)}
          {box(35, 189, 148, 46, t("تحديث الرسم", "Update drawing"), mint)}
          {box(215, 189, 150, 46, t("تحديث القائمة", "Update cut list"), mint)}
          {label(
            200,
            257,
            t("اسحب الإصدار القديم من الاستخدام", "Withdraw the previous revision"),
            13,
          )}
        </>
      )}
      {key === "cabinet-brief" && cabinet("brief")}
      {key === "cabinet-width" && cabinet("width")}
      {key === "cabinet-openings" && cabinet("openings")}
      {key === "cabinet-depth" && (
        <>
          <rect x="60" y="70" width="267" height="130" fill={pale} stroke={teal} strokeWidth="3" />
          <rect
            x="327"
            y="70"
            width="10"
            height="130"
            fill={purple}
            stroke={teal}
            strokeWidth="2"
          />
          {dim(60, 42, 337, 42, "300 mm")}
          {dim(60, 229, 327, 229, "294 mm")}
          {label(200, 137, t("جانب الهيكل", "Body side"))}
          {line(332, 70, 365, 53)}
          {label(365, 38, "6 mm", 13)}
          {label(200, 259, "300 − 6 = 294 mm", 15)}
        </>
      )}
      {key === "cabinet-list" && (
        <>
          {box(
            22,
            28,
            356,
            36,
            t("رقم · كمية · طول × عرض × سمك", "ID · Qty · Length × Width × Thickness"),
            mint,
          )}
          {box(22, 80, 75, 40, "A / B")}
          {label(235, 106, "2 × 600 × 294 × 18", 17)}
          {box(22, 134, 75, 40, "C / D / E")}
          {label(235, 160, "3 × 564 × 294 × 18", 17)}
          {box(22, 188, 75, 40, "F", purple)}
          {label(235, 214, "1 × 600 × 600 × 6", 17)}
          {label(200, 255, t("6 قطع: 5 هيكل + 1 ظهر", "6 pieces: 5 body + 1 back"), 15)}
        </>
      )}
      {key === "cabinet-review" && (
        <>
          {page(28, 35, 92, 124)}
          {label(74, 184, t("الرسم", "Drawing"))}
          {page(280, 35, 92, 124)}
          {label(326, 184, t("القائمة", "Cut list"))}
          <path
            d="M127 89h145m-12-9 12 9-12 9m-121-9-12 9 12 9"
            stroke={teal}
            fill="none"
            strokeWidth="3"
          />
          {label(200, 127, "A … F", 17)}
          {box(
            35,
            203,
            330,
            41,
            t("الوحدة · العدد · السمك · طريقة الظهر", "Units · quantity · thickness · back"),
            mint,
          )}
        </>
      )}
    </svg>
  );
}
