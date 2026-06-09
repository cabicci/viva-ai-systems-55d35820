import type { FC } from "react";

/**
 * Pastel diagrams used inside Creator lessons.
 * All text is real SVG <text> so Arabic renders perfectly at any size.
 * Palette: design tokens from styles.css (--pastel-* + semantic accents).
 */

const PALETTE = {
  blue: "var(--pastel-blue)",
  mint: "var(--pastel-mint)",
  blush: "var(--pastel-pink)",
  lavender: "var(--pastel-lavender)",
  peach: "var(--pastel-peach)",
  bg: "var(--pastel-cream)",
  ink: "var(--foreground)",
  inkSoft: "var(--muted-foreground)",
  stroke: "var(--border)",
};

const FONT = "'IBM Plex Sans Arabic','Tajawal','Cairo',system-ui,sans-serif";

type CardProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  title: string;
  sub?: string;
  icon?: string;
  titleSize?: number;
};

const Card: FC<CardProps> = ({ x, y, w, h, fill, title, sub, icon, titleSize = 18 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={16} fill={fill} stroke={PALETTE.stroke} strokeWidth={1} />
    {icon && (
      <text
        x={x + w / 2}
        y={y + 32}
        textAnchor="middle"
        fontSize={22}
        fill={PALETTE.ink}
      >
        {icon}
      </text>
    )}
    <text
      x={x + w / 2}
      y={y + (icon ? 60 : h / 2 - (sub ? 6 : -6))}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={titleSize}
      fontWeight={700}
      fill={PALETTE.ink}
    >
      {title}
    </text>
    {sub && (
      <text
        x={x + w / 2}
        y={y + (icon ? 84 : h / 2 + 18)}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={13}
        fill={PALETTE.inkSoft}
      >
        {sub}
      </text>
    )}
  </g>
);

/* ---------- 1. Audience Persona ---------- */
export const AudiencePersonaDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={PALETTE.bg} />
    {/* center persona */}
    <circle cx="400" cy="260" r="78" fill="var(--card)" stroke={PALETTE.lavender} strokeWidth="3" />
    <circle cx="400" cy="232" r="26" fill={PALETTE.lavender} />
    <path d="M348 300 Q400 252 452 300 L452 322 L348 322 Z" fill={PALETTE.lavender} />
    <text x="400" y="362" textAnchor="middle" fontFamily={FONT} fontSize="14" fontWeight="700" fill={PALETTE.ink}>Persona</text>
    <text x="400" y="380" textAnchor="middle" fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>شخص واحد بالظبط</text>

    {/* 4 cards */}
    <Card x={40}  y={60}  w={210} h={120} fill={PALETTE.blue}   icon="◷" title="السن" sub="٢٨ سنة" />
    <Card x={550} y={60}  w={210} h={120} fill={PALETTE.mint}   icon="✦" title="الاهتمام" sub="Product / AI" />
    <Card x={40}  y={340} w={210} h={120} fill={PALETTE.blush}  icon="!"  title="المشكلة" sub="خايف من الـ Code" />
    <Card x={550} y={340} w={210} h={120} fill={PALETTE.peach}  icon="★" title="الهدف" sub="يطلق SaaS بنفسه" />

    {/* connectors */}
    <g stroke={PALETTE.stroke} strokeWidth="1.5" strokeDasharray="4 4" fill="none">
      <line x1="250" y1="120" x2="335" y2="220" />
      <line x1="550" y1="120" x2="465" y2="220" />
      <line x1="250" y1="400" x2="335" y2="300" />
      <line x1="550" y1="400" x2="465" y2="300" />
    </g>
  </svg>
);

/* ---------- 2. Content Pillars ---------- */
export const ContentPillarsDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={PALETTE.bg} />
    <text x="400" y="50" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>٣ Pillars بس</text>
    <text x="400" y="74" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>كل فيديو لازم ينتمي لواحد منهم</text>

    <Card x={60}  y={120} w={210} h={340} fill={PALETTE.blue}  icon="💡" title="Educate" sub="تعليم" titleSize={22} />
    <Card x={295} y={120} w={210} h={340} fill={PALETTE.mint}  icon="☺"  title="Entertain" sub="ترفيه" titleSize={22} />
    <Card x={530} y={120} w={210} h={340} fill={PALETTE.blush} icon="★"  title="Inspire" sub="إلهام" titleSize={22} />

    {/* base line */}
    <rect x="40" y="470" width="720" height="6" rx="3" fill={PALETTE.lavender} />
  </svg>
);

/* ---------- 3. Platforms Grid 2×2 ---------- */
export const PlatformsGridDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={PALETTE.bg} />
    <text x="400" y="40" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>٤ فورمات — ٤ منصات</text>

    <Card x={80}  y={80}  w={300} h={180} fill={PALETTE.blue}     icon="▶" title="فيديو قصير" sub="TikTok · Reels" titleSize={20} />
    <Card x={420} y={80}  w={300} h={180} fill={PALETTE.mint}     icon="◧"  title="صورة" sub="Instagram" titleSize={20} />
    <Card x={80}  y={290} w={300} h={180} fill={PALETTE.blush}    icon="♪"  title="صوت" sub="Podcasts · Spaces" titleSize={20} />
    <Card x={420} y={290} w={300} h={180} fill={PALETTE.lavender} icon="¶"  title="نص" sub="LinkedIn · X" titleSize={20} />
  </svg>
);

/* ---------- 4. Weekly Scheduling Calendar ---------- */
export const SchedulingCalendarDiagram: FC = () => {
  const days = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
  const colW = 100;
  const startX = 50;
  const headerY = 100;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={PALETTE.bg} />
      <text x="400" y="44" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>أسبوع مستدام</text>
      <text x="400" y="68" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>يوم تصوير + ٣ أيام نشر</text>

      {days.map((d, i) => (
        <g key={d}>
          <rect x={startX + i * colW} y={headerY} width={colW - 8} height={36} rx={8} fill="var(--card)" stroke={PALETTE.stroke} />
          <text x={startX + i * colW + (colW - 8) / 2} y={headerY + 23} textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>{d}</text>
        </g>
      ))}

      {/* Sunday: filming day */}
      <Card x={startX + 1 * colW} y={170} w={colW - 8} h={170} fill={PALETTE.lavender} icon="📷" title="تصوير" sub="٣ فيديوهات" titleSize={15} />
      {/* Monday/Wednesday/Friday: publish */}
      <Card x={startX + 2 * colW} y={170} w={colW - 8} h={120} fill={PALETTE.blue}  icon="↑" title="نشر ١" titleSize={15} />
      <Card x={startX + 4 * colW} y={170} w={colW - 8} h={120} fill={PALETTE.mint}  icon="↑" title="نشر ٢" titleSize={15} />
      <Card x={startX + 6 * colW} y={170} w={colW - 8} h={120} fill={PALETTE.blush} icon="↑" title="نشر ٣" titleSize={15} />

      <text x="400" y="400" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>قرار واحد في الأسبوع — مفيش ضغط يومي</text>
    </svg>
  );
};

/* ---------- 5. Analytics Triangle ---------- */
export const AnalyticsTriangleDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={PALETTE.bg} />
    <text x="400" y="40" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>مثلث الأرقام</text>
    <text x="400" y="64" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>٣ أرقام بس — والباقي ضوضاء</text>

    {/* triangle connectors */}
    <g stroke={PALETTE.lavender} strokeWidth="2" fill="none">
      <line x1="400" y1="180" x2="200" y2="420" />
      <line x1="400" y1="180" x2="600" y2="420" />
      <line x1="200" y1="420" x2="600" y2="420" />
    </g>

    <Card x={285} y={100} w={230} h={130} fill={PALETTE.blue}  icon="⌛" title="Watch Time" sub="وقت المشاهدة" titleSize={18} />
    <Card x={50}  y={360} w={230} h={130} fill={PALETTE.mint}  icon="❤" title="Save Rate" sub="معدّل الحفظ" titleSize={18} />
    <Card x={520} y={360} w={230} h={130} fill={PALETTE.blush} icon="+" title="Follow Rate" sub="معدّل المتابعة" titleSize={18} />
  </svg>
);

/* ---------- 6. Leads Funnel ---------- */
export const LeadsFunnelDiagram: FC = () => {
  const layers = [
    { fill: PALETTE.blue,     title: "Views", sub: "المشاهدات", w: 720 },
    { fill: PALETTE.mint,     title: "Bio Link Click", sub: "كليك على الرابط", w: 560 },
    { fill: PALETTE.blush,    title: "Lead Magnet", sub: "تحميل الهدية المجانية", w: 400 },
    { fill: PALETTE.lavender, title: "Customer", sub: "عميل دافع", w: 240 },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={PALETTE.bg} />
      <text x="400" y="36" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>Funnel — من View لـ Customer</text>

      {layers.map((l, i) => {
        const y = 70 + i * 100;
        const x = (800 - l.w) / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={l.w} height={80} rx={14} fill={l.fill} stroke={PALETTE.stroke} />
            <text x={400} y={y + 36} textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>{l.title}</text>
            <text x={400} y={y + 58} textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>{l.sub}</text>
          </g>
        );
      })}

      {/* down arrows */}
      <g fill={PALETTE.inkSoft}>
        {[0, 1, 2].map((i) => (
          <text key={i} x="400" y={166 + i * 100} textAnchor="middle" fontSize="16">▼</text>
        ))}
      </g>
    </svg>
  );
};

/* Registry moved to the bottom of the file. */

/* ============================================================
 *  ANALYST · M3 · Pattern vs Outlier
 *  Weekly leads chart: 11 stable points (Pattern) + 1 spike (Outlier)
 *  with baseline band, mean line, and annotation callouts.
 * ============================================================ */
export const PatternVsOutlierDiagram: FC = () => {
  const data = [42, 45, 41, 47, 44, 46, 43, 89, 45, 48, 44, 46];
  const weeks = data.length;
  const baselineMean = 44;
  const baselineBand = 4; // ±4 around mean
  const chartX = 70;
  const chartY = 110;
  const chartW = 660;
  const chartH = 280;
  const yMin = 30;
  const yMax = 100;
  const xStep = chartW / (weeks - 1);
  const yScale = (v: number) => chartY + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const xAt = (i: number) => chartX + i * xStep;
  const points = data.map((v, i) => `${xAt(i)},${yScale(v)}`).join(" ");
  const outlierIdx = 7;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={PALETTE.bg} />
      <text x="400" y="40" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>Leads أسبوعيًا — ١٢ أسبوع</text>
      <text x="400" y="64" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>١١ نقطة Pattern مستقرّة + نقطة Outlier واحدة</text>

      {/* Y axis grid */}
      <g stroke={PALETTE.stroke} strokeWidth="1">
        {[30, 50, 70, 90].map((v) => (
          <line key={v} x1={chartX} y1={yScale(v)} x2={chartX + chartW} y2={yScale(v)} />
        ))}
      </g>
      <g fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>
        {[30, 50, 70, 90].map((v) => (
          <text key={v} x={chartX - 8} y={yScale(v) + 4} textAnchor="end">{v}</text>
        ))}
      </g>

      {/* Baseline band (mean ± variance) */}
      <rect
        x={chartX}
        y={yScale(baselineMean + baselineBand)}
        width={chartW}
        height={yScale(baselineMean - baselineBand) - yScale(baselineMean + baselineBand)}
        fill={PALETTE.mint}
        opacity="0.45"
      />
      <line
        x1={chartX}
        y1={yScale(baselineMean)}
        x2={chartX + chartW}
        y2={yScale(baselineMean)}
        stroke="var(--accent-success)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text x={chartX + chartW + 6} y={yScale(baselineMean) + 4} fontFamily={FONT} fontSize="11" fill="var(--accent-success-foreground)">متوسط 44</text>

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={PALETTE.ink}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Points */}
      {data.map((v, i) => {
        const isOutlier = i === outlierIdx;
        return (
          <g key={i}>
            <circle
              cx={xAt(i)}
              cy={yScale(v)}
              r={isOutlier ? 8 : 4}
              fill={isOutlier ? "var(--accent-danger)" : "var(--card)"}
              stroke={isOutlier ? "var(--accent-danger-foreground)" : PALETTE.ink}
              strokeWidth={isOutlier ? 3 : 1.5}
            />
            <text
              x={xAt(i)}
              y={chartY + chartH + 22}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="11"
              fill={PALETTE.inkSoft}
            >
              {`أ${i + 1}`}
            </text>
          </g>
        );
      })}

      {/* Outlier annotation */}
      <g>
        <line
          x1={xAt(outlierIdx)}
          y1={yScale(data[outlierIdx]) - 14}
          x2={xAt(outlierIdx) + 60}
          y2={yScale(data[outlierIdx]) - 50}
          stroke="var(--accent-danger-foreground)"
          strokeWidth="1.5"
        />
        <rect x={xAt(outlierIdx) + 50} y={yScale(data[outlierIdx]) - 86} width="190" height="42" rx="8" fill={PALETTE.blush} stroke="var(--accent-danger)" />
        <text x={xAt(outlierIdx) + 145} y={yScale(data[outlierIdx]) - 68} textAnchor="middle" fontFamily={FONT} fontSize="12" fontWeight="700" fill="var(--accent-danger-foreground)">Outlier — 89 lead</text>
        <text x={xAt(outlierIdx) + 145} y={yScale(data[outlierIdx]) - 52} textAnchor="middle" fontFamily={FONT} fontSize="11" fill="var(--accent-danger-foreground)">حملة إعلان مدفوعة مرّة واحدة</text>
      </g>

      {/* Pattern legend */}
      <g>
        <rect x={50} y={440} width="320" height="56" rx="10" fill={PALETTE.mint} opacity="0.55" />
        <text x={210} y={462} textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>Pattern: 44 ± 4 lead/أسبوع</text>
        <text x={210} y={482} textAnchor="middle" fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>اشتغل على رفع الـ baseline — مش على القفزات</text>

        <rect x={430} y={440} width="320" height="56" rx="10" fill={PALETTE.blush} opacity="0.55" />
        <text x={590} y={462} textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>Outlier: 89 lead — مرّة واحدة</text>
        <text x={590} y={482} textAnchor="middle" fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>افهم سببه قبل ما تبني عليه قرار</text>
      </g>
    </svg>
  );
};

/* ============================================================
 *  BUSINESS · M2 · Customer Lifecycle Funnel
 *  Real numbers funnel + conversion % + CAC/LTV sidebar.
 * ============================================================ */
export const CustomerLifecycleFunnelDiagram: FC = () => {
  const layers = [
    { title: "اكتشف", sub: "Discover", value: 1000, fill: PALETTE.blue, w: 460 },
    { title: "تواصل", sub: "Contact", value: 200, fill: PALETTE.mint, w: 360 },
    { title: "اشترى", sub: "Buy", value: 50, fill: PALETTE.peach, w: 260 },
    { title: "رجع", sub: "Return", value: 15, fill: PALETTE.lavender, w: 160 },
  ];
  const startY = 90;
  const rowH = 70;
  const gap = 16;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={PALETTE.bg} />
      <text x="400" y="40" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>دورة حياة العميل — بأرقام واقعية</text>
      <text x="400" y="62" textAnchor="middle" fontFamily={FONT} fontSize="13" fill={PALETTE.inkSoft}>من ١٠٠٠ شخص شافك — ١٥ بس بيرجعوا</text>

      {layers.map((l, i) => {
        const y = startY + i * (rowH + gap);
        const x = 70;
        const w = l.w;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={rowH} rx={12} fill={l.fill} stroke={PALETTE.stroke} />
            <text x={x + 24} y={y + 32} textAnchor="start" fontFamily={FONT} fontSize="17" fontWeight="700" fill={PALETTE.ink}>{l.title}</text>
            <text x={x + 24} y={y + 52} textAnchor="start" fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>{l.sub}</text>
            <text x={x + w - 20} y={y + 44} textAnchor="end" fontFamily={FONT} fontSize="22" fontWeight="700" fill={PALETTE.ink}>{l.value}</text>

            {/* conversion arrow between layers */}
            {i < layers.length - 1 && (
              <g>
                <text x={x + w - 70} y={y + rowH + gap / 2 + 4} textAnchor="end" fontFamily={FONT} fontSize="12" fontWeight="700" fill={PALETTE.inkSoft}>
                  {`↓ ${Math.round((layers[i + 1].value / l.value) * 100)}%`}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Side metrics */}
      <g>
        <rect x={560} y={90} width={200} height={140} rx={14} fill="var(--card)" stroke={PALETTE.stroke} />
        <text x={660} y={120} textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>اقتصاديات العميل</text>

        <text x={580} y={150} fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>CAC (تكلفة الجلب)</text>
        <text x={740} y={150} textAnchor="end" fontFamily={FONT} fontSize="13" fontWeight="700" fill="var(--accent-danger-foreground)">100ج</text>

        <text x={580} y={175} fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>LTV (مرة واحدة)</text>
        <text x={740} y={175} textAnchor="end" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>250ج</text>

        <text x={580} y={200} fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>LTV (مع رجوع)</text>
        <text x={740} y={200} textAnchor="end" fontFamily={FONT} fontSize="13" fontWeight="700" fill="var(--accent-success-foreground)">800ج</text>

        <line x1={580} y1={212} x2={740} y2={212} stroke={PALETTE.stroke} />
      </g>

      <g>
        <rect x={560} y={250} width={200} height={100} rx={14} fill={PALETTE.mint} opacity="0.5" />
        <text x={660} y={278} textAnchor="middle" fontFamily={FONT} fontSize="12" fontWeight="700" fill={PALETTE.ink}>قاعدة الـ 5x</text>
        <text x={660} y={298} textAnchor="middle" fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>عميل راجع = ٣.٢ أضعاف</text>
        <text x={660} y={314} textAnchor="middle" fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>الربح من عميل جديد</text>
        <text x={660} y={335} textAnchor="middle" fontFamily={FONT} fontSize="11" fontWeight="700" fill="var(--accent-success-foreground)">ركّز ٧٠٪ على الاحتفاظ</text>
      </g>

      {/* Bottom takeaway */}
      <g>
        <rect x={70} y={440} width={680} height={56} rx={12} fill={PALETTE.blush} opacity="0.5" />
        <text x={410} y={464} textAnchor="middle" fontFamily={FONT} fontSize="13" fontWeight="700" fill={PALETTE.ink}>كل مرحلة محتاجة نظام مختلف</text>
        <text x={410} y={484} textAnchor="middle" fontFamily={FONT} fontSize="11" fill={PALETTE.inkSoft}>اكتشف: Creator · تواصل: Automator · اشترى: Sales · رجع: Retention</text>
      </g>
    </svg>
  );
};

/* ============================================================
 *  ANALYST · M1 · Feeling → Question Table
 *  4-column comparison: شعور | سؤال | baseline | إجراء
 * ============================================================ */
export const FeelingToQuestionTableDiagram: FC = () => {
  const rows: { feel: string; q: string; base: string; act: string }[] = [
    {
      feel: "المبيعات وحشة",
      q: "كام % نزلت عن الشهر اللي فات؟",
      base: "85% من baseline 100k",
      act: "افحص: traffic ولا conversion؟",
    },
    {
      feel: "العملاء مش راضيين",
      q: "إيه أكتر ٣ شكاوى الشهر ده؟",
      base: "غلاف بطيء — ١٢ شكوى",
      act: "حلّ الشكوى رقم ١ الأول",
    },
    {
      feel: "الإعلان مش شغّال",
      q: "كام lead جه منه آخر ٣٠ يوم؟",
      base: "٣٢ lead بـ ١٥٠٠ج",
      act: "احسب CPL = ٤٧ج · قارن",
    },
    {
      feel: "الموظف بطيء",
      q: "كام مهمة خلّص الأسبوع ده؟",
      base: "٨/١٢ · متوسط الفريق ١٠",
      act: "1-on-1 وفهم العائق",
    },
  ];
  const cols = [
    { x: 30, w: 165, label: "الشعور (مبهم)", fill: PALETTE.blush },
    { x: 200, w: 215, label: "السؤال المحدّد", fill: PALETTE.mint },
    { x: 420, w: 175, label: "الـ Baseline", fill: PALETTE.blue },
    { x: 600, w: 170, label: "الإجراء", fill: PALETTE.lavender },
  ];
  const headerY = 80;
  const rowH = 86;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={PALETTE.bg} />
      <text x="400" y="36" textAnchor="middle" fontFamily={FONT} fontSize="18" fontWeight="700" fill={PALETTE.ink}>من شعور غامض → قرار قابل للتنفيذ</text>
      <text x="400" y="58" textAnchor="middle" fontFamily={FONT} fontSize="12" fill={PALETTE.inkSoft}>٤ أمثلة حقيقية من شغل اليوم</text>

      {/* Header */}
      {cols.map((c) => (
        <g key={c.label}>
          <rect x={c.x} y={headerY} width={c.w} height={36} rx={8} fill={c.fill} />
          <text x={c.x + c.w / 2} y={headerY + 23} textAnchor="middle" fontFamily={FONT} fontSize="12" fontWeight="700" fill={PALETTE.ink}>{c.label}</text>
        </g>
      ))}

      {/* Rows */}
      {rows.map((r, i) => {
        const y = headerY + 44 + i * (rowH + 6);
        return (
          <g key={i}>
            {cols.map((c, ci) => {
              const text = [r.feel, r.q, r.base, r.act][ci];
              return (
                <g key={ci}>
                  <rect x={c.x} y={y} width={c.w} height={rowH} rx={10} fill="var(--card)" stroke={PALETTE.stroke} />
                  <foreignObject x={c.x + 8} y={y + 8} width={c.w - 16} height={rowH - 16}>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: PALETTE.ink,
                        direction: "rtl",
                        textAlign: "right",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {text}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            {/* Arrow between feeling and question */}
            <text x={cols[0].x + cols[0].w + 3} y={y + rowH / 2 + 5} fontSize="14" fill={PALETTE.inkSoft}>←</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- Registry ---------- */
import { ANALYST_BUSINESS_DIAGRAMS } from "./AnalystBusinessDiagrams";

export const LESSON_DIAGRAMS = {
  "audience-persona": AudiencePersonaDiagram,
  "content-pillars": ContentPillarsDiagram,
  "platforms-grid": PlatformsGridDiagram,
  "scheduling-calendar": SchedulingCalendarDiagram,
  "analytics-triangle": AnalyticsTriangleDiagram,
  "leads-funnel": LeadsFunnelDiagram,
  "pattern-vs-outlier": PatternVsOutlierDiagram,
  "customer-lifecycle-funnel": CustomerLifecycleFunnelDiagram,
  "feeling-to-question-table": FeelingToQuestionTableDiagram,
  ...ANALYST_BUSINESS_DIAGRAMS,
} as const;

export type LessonDiagramId = keyof typeof LESSON_DIAGRAMS;