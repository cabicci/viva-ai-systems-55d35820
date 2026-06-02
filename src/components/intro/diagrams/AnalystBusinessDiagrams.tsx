import type { FC, ReactNode } from "react";

/**
 * Rich, information-dense SVG diagrams for the Analyst & Business paths.
 * Every diagram carries REAL data, baselines, or named examples — never
 * decorative shapes. Arabic via native <text> + <foreignObject>.
 */

const P = {
  blue: "#DCE7EE",
  mint: "#D4ECE0",
  blush: "#F0DDD8",
  lavender: "#E5DBEA",
  peach: "#F2DBC4",
  bg: "#FAFCFE",
  ink: "#2B3A55",
  inkSoft: "#6B7A93",
  stroke: "#E3E8F0",
  good: "#4E8C72",
  bad: "#C4543E",
};
const F = "'IBM Plex Sans Arabic','Tajawal','Cairo',system-ui,sans-serif";

const RtlText: FC<{ x: number; y: number; w: number; h: number; size?: number; weight?: number; color?: string; children: ReactNode }> = ({ x, y, w, h, size = 12, weight = 400, color = P.ink, children }) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div style={{ fontFamily: F, fontSize: size, fontWeight: weight, color, direction: "rtl", textAlign: "right", lineHeight: 1.45, height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
      {children}
    </div>
  </foreignObject>
);

const Title: FC<{ t: string; s?: string }> = ({ t, s }) => (
  <>
    <text x={400} y={36} textAnchor="middle" fontFamily={F} fontSize={18} fontWeight={700} fill={P.ink}>{t}</text>
    {s && <text x={400} y={60} textAnchor="middle" fontFamily={F} fontSize={12} fill={P.inkSoft}>{s}</text>}
  </>
);

/* ============================================================
 * ANALYST · M0 · Decision Loop (Automator → Analyst)
 * ============================================================ */
export const DecisionLoopDiagram: FC = () => {
  const nodes = [
    { x: 400, y: 130, label: "بيانات", sub: "Data جاهزة", fill: P.blue },
    { x: 620, y: 230, label: "سؤال", sub: "Specific", fill: P.mint },
    { x: 540, y: 380, label: "تفسير", sub: "Insight", fill: P.peach },
    { x: 260, y: 380, label: "قرار", sub: "Action", fill: P.lavender },
    { x: 180, y: 230, label: "تنفيذ", sub: "Execute", fill: P.blush },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Decision Loop — من بيانات لقرار" s="٥ مراحل · لو ناقص واحدة، الـ loop بيقف" />
      {/* center circle */}
      <circle cx={400} cy={280} r={70} fill="#fff" stroke={P.stroke} strokeWidth={2} strokeDasharray="4 4" />
      <text x={400} y={272} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>Analyst</text>
      <text x={400} y={292} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>عقلية مختلفة</text>
      {/* arcs */}
      {nodes.map((_, i) => {
        const a = nodes[i], b = nodes[(i + 1) % nodes.length];
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={P.stroke} strokeWidth={1.5} strokeDasharray="3 4" />;
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={42} fill={n.fill} stroke={P.stroke} />
          <text x={n.x} y={n.y - 2} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>{n.label}</text>
          <text x={n.x} y={n.y + 16} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>{n.sub}</text>
          <circle cx={n.x - 28} cy={n.y - 28} r={11} fill="#fff" stroke={P.stroke} />
          <text x={n.x - 28} y={n.y - 24} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{i + 1}</text>
        </g>
      ))}
      {/* failure vs right */}
      <rect x={50} y={460} width={340} height={44} rx={10} fill={P.blush} opacity={0.55} />
      <text x={220} y={478} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>Dashboard بدون سؤال = ديكور</text>
      <text x={220} y={495} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>٢٠ chart · مفيش قرار اتغيّر</text>
      <rect x={410} y={460} width={340} height={44} rx={10} fill={P.mint} opacity={0.55} />
      <text x={580} y={478} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>سؤال محدّد = قرار نفس اليوم</text>
      <text x={580} y={495} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>«ليه Conversion نزل ٥٪؟» → action</text>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M1 · Question Quality Scorecard
 * ============================================================ */
export const QuestionScorecardDiagram: FC = () => {
  const criteria = ["محدّد (مين/إيه)", "قابل للقياس", "مرتبط بقرار", "إطار زمني"];
  const bad = [false, false, false, false];
  const good = [true, true, true, true];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="فحص جودة السؤال — ٤ شروط" s="نفس الموضوع · صياغتين مختلفتين · نتيجتين مختلفتين" />
      {/* Bad question card */}
      <rect x={40} y={90} width={350} height={380} rx={16} fill={P.blush} opacity={0.35} stroke="#E5BAB1" />
      <text x={215} y={120} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.bad}>FAILURE</text>
      <RtlText x={56} y={130} w={318} h={50} size={15} weight={700}>«إيه أحوال البيع؟»</RtlText>
      <text x={215} y={200} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>سؤال عام · بدون قياس · بدون زمن</text>
      {criteria.map((c, i) => (
        <g key={i}>
          <rect x={56} y={220 + i * 50} width={318} height={40} rx={8} fill="#fff" stroke={P.stroke} />
          <circle cx={78} cy={240 + i * 50} r={9} fill={bad[i] ? P.good : "#fff"} stroke={P.bad} strokeWidth={1.5} />
          <text x={78} y={244 + i * 50} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.bad}>✗</text>
          <RtlText x={96} y={222 + i * 50} w={270} h={36} size={12}>{c}</RtlText>
        </g>
      ))}
      <text x={215} y={448} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>النتيجة: ١٠ ساعات · مفيش قرار</text>
      {/* Good question card */}
      <rect x={410} y={90} width={350} height={380} rx={16} fill={P.mint} opacity={0.35} stroke="#A8D5BD" />
      <text x={585} y={120} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.good}>RIGHT</text>
      <RtlText x={426} y={130} w={318} h={50} size={15} weight={700}>«كام عميل اشترى مرتين الشهر ده؟»</RtlText>
      <text x={585} y={200} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>محدّد · قابل للعدّ · زمن واضح</text>
      {criteria.map((c, i) => (
        <g key={i}>
          <rect x={426} y={220 + i * 50} width={318} height={40} rx={8} fill="#fff" stroke={P.stroke} />
          <circle cx={448} cy={240 + i * 50} r={9} fill={P.good} />
          <text x={448} y={244 + i * 50} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill="#fff">✓</text>
          <RtlText x={466} y={222 + i * 50} w={270} h={36} size={12}>{c}</RtlText>
        </g>
      ))}
      <text x={585} y={448} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>النتيجة: دقيقة · قرار جاهز</text>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M2 · AI Summarization Flow
 * ============================================================ */
export const AISummarizationFlowDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={P.bg} />
    <Title t="AI = أسرع محلّل عندك" s="٥٠ رسالة · ٣٠ ثانية · ٤ مخرجات قابلة للقرار" />
    {/* Input pile */}
    <g>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={60 + i * 4} y={120 + i * 4} width={160} height={100} rx={10} fill={P.blue} stroke={P.stroke} />
      ))}
      <text x={156} y={155} textAnchor="middle" fontFamily={F} fontSize={26} fontWeight={700} fill={P.ink}>50</text>
      <text x={156} y={178} textAnchor="middle" fontFamily={F} fontSize={12} fill={P.inkSoft}>رسالة عميل</text>
      <text x={156} y={198} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>WhatsApp + Email</text>
    </g>
    {/* Arrow */}
    <text x={250} y={180} fontFamily={F} fontSize={22} fill={P.inkSoft}>→</text>
    {/* Prompt box */}
    <rect x={280} y={110} width={240} height={150} rx={14} fill={P.lavender} stroke={P.stroke} />
    <text x={400} y={132} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>Prompt للتحليل</text>
    <RtlText x={296} y={140} w={208} h={120} size={11} color={P.inkSoft}>
      <span>«استخرج: كام طلب؟ أكتر ٣ أسئلة؟ شكوى متكرّرة؟ pattern غير عادي؟»</span>
    </RtlText>
    {/* Arrow */}
    <text x={540} y={180} fontFamily={F} fontSize={22} fill={P.inkSoft}>→</text>
    {/* AI brain */}
    <circle cx={650} cy={170} r={60} fill={P.mint} stroke={P.stroke} />
    <text x={650} y={170} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>AI</text>
    <text x={650} y={190} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>30 ثانية</text>
    {/* Outputs */}
    <text x={400} y={290} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>الإجابة — ٤ نقاط للقرار</text>
    {[
      { x: 50, fill: P.blue, h: "عدد الطلبات", v: "32 طلب" },
      { x: 240, fill: P.mint, h: "أكتر ٣ أسئلة", v: "السعر · الشحن · المقاسات" },
      { x: 430, fill: P.peach, h: "شكوى متكرّرة", v: "بطء الردّ (7 رسائل)" },
      { x: 620, fill: P.blush, h: "Pattern", v: "ذروة طلبات الخميس" },
    ].map((o, i) => (
      <g key={i}>
        <rect x={o.x} y={310} width={150} height={120} rx={12} fill={o.fill} stroke={P.stroke} />
        <text x={o.x + 75} y={336} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>{o.h}</text>
        <RtlText x={o.x + 12} y={350} w={126} h={70} size={13} weight={700}>{o.v}</RtlText>
      </g>
    ))}
    {/* Compare time */}
    <rect x={50} y={450} width={700} height={50} rx={10} fill="#fff" stroke={P.stroke} />
    <text x={210} y={472} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>قراءة يدوية: ١٢٠ دقيقة</text>
    <text x={400} y={485} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>vs</text>
    <text x={580} y={472} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>AI + Prompt: ١٠ دقايق</text>
  </svg>
);

/* ============================================================
 * ANALYST · M2 · Three Sources Merge
 * ============================================================ */
export const ThreeSourcesMergeDiagram: FC = () => {
  const rows = [
    { d: "12 أكت", s: "WhatsApp", c: "العميل سأل عن السعر", t: "تسعير" },
    { d: "12 أكت", s: "Sales", c: "فاتورة 850ج — منى", t: "بيع" },
    { d: "13 أكت", s: "Notes", c: "فكرة: عرض ٣ منتجات بسعر واحد", t: "أفكار" },
    { d: "14 أكت", s: "WhatsApp", c: "شكوى من بطء الشحن", t: "شكوى" },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="٣ مصادر → جدول واحد" s="Single Source of Truth — سؤال = ١٠ دقايق إجابة" />
      {/* 3 sources */}
      {[
        { x: 50, fill: P.blue, label: "WhatsApp", icon: "💬", n: "186 رسالة" },
        { x: 50, y: 240, fill: P.mint, label: "Sales", icon: "💰", n: "42 فاتورة" },
        { x: 50, y: 360, fill: P.peach, label: "Notes", icon: "📝", n: "18 ملاحظة" },
      ].map((s, i) => {
        const y = s.y ?? 120;
        return (
          <g key={i}>
            <rect x={50} y={y} width={150} height={100} rx={12} fill={s.fill} stroke={P.stroke} />
            <text x={125} y={y + 30} textAnchor="middle" fontSize={22}>{s.icon}</text>
            <text x={125} y={y + 60} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>{s.label}</text>
            <text x={125} y={y + 80} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>{s.n}</text>
            <line x1={205} y1={y + 50} x2={290} y2={260} stroke={P.stroke} strokeWidth={1.5} strokeDasharray="3 4" />
          </g>
        );
      })}
      {/* Sheet */}
      <rect x={300} y={110} width={460} height={380} rx={14} fill="#fff" stroke={P.stroke} strokeWidth={1.5} />
      <text x={530} y={134} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>Sheet/Notion — جدول التجميع الأسبوعي</text>
      {/* Header row */}
      {[
        { x: 310, w: 70, label: "التاريخ" },
        { x: 384, w: 100, label: "المصدر" },
        { x: 488, w: 180, label: "المحتوى" },
        { x: 672, w: 80, label: "الموضوع" },
      ].map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={150} width={c.w} height={32} fill={P.lavender} stroke={P.stroke} />
          <text x={c.x + c.w / 2} y={171} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{c.label}</text>
        </g>
      ))}
      {rows.map((r, i) => {
        const y = 186 + i * 50;
        const tagColor = r.s === "WhatsApp" ? P.blue : r.s === "Sales" ? P.mint : P.peach;
        return (
          <g key={i}>
            <rect x={310} y={y} width={442} height={48} fill={i % 2 ? "#fff" : "#FAFCFE"} stroke={P.stroke} />
            <RtlText x={314} y={y + 6} w={62} h={36} size={11}>{r.d}</RtlText>
            <rect x={392} y={y + 12} width={84} height={24} rx={6} fill={tagColor} />
            <text x={434} y={y + 28} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{r.s}</text>
            <RtlText x={492} y={y + 6} w={172} h={36} size={11}>{r.c}</RtlText>
            <text x={712} y={y + 28} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>{r.t}</text>
          </g>
        );
      })}
      <text x={530} y={478} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>كل أسبوع — ١٥ دقيقة نسخ · سؤال واحد = إجابة فورية</text>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M3 · Decision Chain (Insight→Action→Owner→Deadline)
 * ============================================================ */
export const DecisionChainDiagram: FC = () => {
  const cards = [
    { label: "Insight", title: "٧٠٪ بيسألوا عن السعر قبل المنتج", fill: P.blue, x: 40 },
    { label: "Action", title: "أضيف السعر في أول رسالة WhatsApp", fill: P.mint, x: 230 },
    { label: "Owner", title: "أنا (المؤسس)", fill: P.peach, x: 420 },
    { label: "Deadline", title: "الأربعاء ٢٢ أكت", fill: P.lavender, x: 610 },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Insight → Action → Owner → Deadline" s="من غير الـ ٤ عناصر = القرار مش هيتنفّذ" />
      {cards.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={130} width={150} height={200} rx={14} fill={c.fill} stroke={P.stroke} />
          <text x={c.x + 75} y={158} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>{c.label}</text>
          <circle cx={c.x + 75} cy={195} r={20} fill="#fff" stroke={P.stroke} />
          <text x={c.x + 75} y={201} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>{i + 1}</text>
          <RtlText x={c.x + 10} y={225} w={130} h={100} size={12} weight={700}>{c.title}</RtlText>
          {i < cards.length - 1 && <text x={c.x + 165} y={235} fontFamily={F} fontSize={22} fill={P.inkSoft}>→</text>}
        </g>
      ))}
      {/* Without vs with */}
      <rect x={40} y={370} width={350} height={120} rx={12} fill={P.blush} opacity={0.45} />
      <text x={215} y={395} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>بدون deadline + owner</text>
      <RtlText x={56} y={405} w={318} h={80} size={11}>«حلو الـ insight ده» → بعد شهر نفس الـ insight بيترجع · مفيش حد عمل حاجة</RtlText>
      <rect x={410} y={370} width={350} height={120} rx={12} fill={P.mint} opacity={0.45} />
      <text x={585} y={395} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>مع الـ ٤ عناصر</text>
      <RtlText x={426} y={405} w={318} h={80} size={11}>الأربعاء بتنفّذ · الأحد بتقيس الأثر على نفس الـ KPI · loop شغّال</RtlText>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M4 · Four KPI Dashboard (real numbers)
 * ============================================================ */
export const FourKpiDashboardDiagram: FC = () => {
  const kpis = [
    { label: "Leads", now: 42, prev: 38, unit: "", x: 40, fill: P.blue },
    { label: "Conversion", now: 12, prev: 14, unit: "%", x: 240, fill: P.mint, lowerIsBad: true },
    { label: "Revenue", now: 18.4, prev: 16.1, unit: "k ج", x: 440, fill: P.peach },
    { label: "Retention", now: 28, prev: 25, unit: "%", x: 640, fill: P.lavender },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="٤ أرقام بس — Dashboard أسبوع 42" s="هذا الأسبوع · الأسبوع اللي فات · السهم" />
      {kpis.map((k) => {
        const delta = k.now - k.prev;
        const pct = ((delta / k.prev) * 100).toFixed(0);
        const up = delta >= 0;
        const good = k.lowerIsBad ? !up : up;
        const color = good ? P.good : P.bad;
        return (
          <g key={k.label}>
            <rect x={k.x} y={100} width={140} height={200} rx={14} fill={k.fill} stroke={P.stroke} />
            <text x={k.x + 70} y={128} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.inkSoft}>{k.label}</text>
            <text x={k.x + 70} y={180} textAnchor="middle" fontFamily={F} fontSize={32} fontWeight={700} fill={P.ink}>{k.now}{k.unit && <tspan fontSize="14"> {k.unit}</tspan>}</text>
            <text x={k.x + 70} y={210} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>الأسبوع اللي فات: {k.prev}{k.unit}</text>
            <rect x={k.x + 25} y={235} width={90} height={32} rx={8} fill="#fff" stroke={color} />
            <text x={k.x + 70} y={256} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={color}>{up ? "↑" : "↓"} {Math.abs(Number(pct))}%</text>
          </g>
        );
      })}
      {/* Mini sparklines */}
      {kpis.map((k) => {
        const series = [k.prev - 2, k.prev - 1, k.prev + 1, k.prev, k.now];
        const minV = Math.min(...series), maxV = Math.max(...series);
        const points = series.map((v, i) => `${k.x + 15 + i * 28},${300 - ((v - minV) / Math.max(maxV - minV, 1)) * 20 - 5}`).join(" ");
        return <polyline key={k.label} points={points} fill="none" stroke={P.ink} strokeWidth={1.5} />;
      })}
      {/* Decision row */}
      <rect x={40} y={340} width={720} height={150} rx={14} fill="#fff" stroke={P.stroke} />
      <text x={400} y={365} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>القراءة الأسبوعية — ٢ دقيقة</text>
      <RtlText x={60} y={380} w={680} h={100} size={12}>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>Leads ↑ ١٠٪ — الـ Creator content شغّال · كرّر pattern الأسبوع ده</li>
          <li>Conversion ↓ ٢ نقطة — فيه fricion في checkout · افحص الـ funnel</li>
          <li>Revenue ↑ ١٤٪ — متوسط الفاتورة بيكبر · upsell بيشتغل</li>
          <li>Retention ↑ ٣ نقطة — Automator follow-up بدأ ياثر</li>
        </ul>
      </RtlText>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M4 · Weekly Review Timeline (Sunday 9:00)
 * ============================================================ */
export const WeeklyReviewTimelineDiagram: FC = () => {
  const steps = [
    { t: "09:00", title: "افتح الـ Dashboard", sub: "الـ ٤ أرقام", fill: P.blue },
    { t: "09:04", title: "اسأل سؤال واحد", sub: "«إيه اللي اتغيّر؟»", fill: P.mint },
    { t: "09:08", title: "حدّد قرار واحد", sub: "Action + Owner + Deadline", fill: P.peach },
    { t: "09:15", title: "أضفه في Backlog", sub: "تنفيذ الأسبوع الجاي", fill: P.lavender },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Analyst Review — كل أحد ١٥ دقيقة" s="نفس الساعة · نفس المكان · قرار واحد بس" />
      {/* Calendar block */}
      <rect x={50} y={100} width={200} height={380} rx={14} fill="#fff" stroke={P.stroke} />
      <rect x={50} y={100} width={200} height={48} rx={14} fill={P.lavender} />
      <text x={150} y={130} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>الأحد · أسبوعيًا</text>
      <text x={150} y={180} textAnchor="middle" fontFamily={F} fontSize={42} fontWeight={700} fill={P.ink}>15</text>
      <text x={150} y={205} textAnchor="middle" fontFamily={F} fontSize={12} fill={P.inkSoft}>دقيقة</text>
      <line x1={70} y1={230} x2={230} y2={230} stroke={P.stroke} />
      <text x={150} y={258} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>09:00 → 09:15</text>
      <text x={150} y={290} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>✓ Recurring</text>
      <rect x={70} y={330} width={160} height={130} rx={10} fill={P.mint} opacity={0.45} />
      <text x={150} y={360} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>القاعدة الذهبية</text>
      <RtlText x={80} y={370} w={140} h={80} size={11}>قرار واحد كل أسبوع · مش ١٠ · مفيش استثناءات</RtlText>
      {/* Steps timeline */}
      {steps.map((s, i) => {
        const y = 110 + i * 92;
        return (
          <g key={i}>
            <circle cx={300} cy={y + 30} r={14} fill={s.fill} stroke={P.stroke} />
            <text x={300} y={y + 35} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{i + 1}</text>
            {i < steps.length - 1 && <line x1={300} y1={y + 44} x2={300} y2={y + 90} stroke={P.stroke} strokeWidth={2} strokeDasharray="3 4" />}
            <rect x={325} y={y} width={425} height={75} rx={12} fill={s.fill} opacity={0.4} stroke={P.stroke} />
            <text x={345} y={y + 28} fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>{s.t}</text>
            <RtlText x={345} y={y + 32} w={385} h={20} size={14} weight={700}>{s.title}</RtlText>
            <RtlText x={345} y={y + 50} w={385} h={20} size={11} color={P.inkSoft}>{s.sub}</RtlText>
          </g>
        );
      })}
    </svg>
  );
};

/* ============================================================
 * ANALYST · M5 · Correlation vs Causation (ice cream / drowning)
 * ============================================================ */
export const CorrelationCausationDiagram: FC = () => {
  const months = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];
  const heat = [14, 15, 18, 22, 27, 31, 34, 34, 31, 26, 20, 15];
  const iceCream = heat.map((h) => Math.round(h * 8));
  const drowning = heat.map((h) => Math.max(0, Math.round((h - 18) * 1.3)));
  const chartX = 80, chartY = 130, chartW = 640, chartH = 200;
  const yMax = Math.max(...iceCream);
  const yScale = (v: number, max: number) => chartY + chartH - (v / max) * chartH;
  const xAt = (i: number) => chartX + i * (chartW / (months.length - 1));
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Correlation ≠ Causation" s="آيس كريم وغرق بيتحرّكوا مع بعض · السبب الحقيقي حاجة تالتة" />
      {/* axes */}
      <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke={P.stroke} />
      {/* Ice cream line */}
      <polyline points={iceCream.map((v, i) => `${xAt(i)},${yScale(v, yMax)}`).join(" ")} fill="none" stroke="#E47B6B" strokeWidth={2.5} />
      {/* Drowning line (scaled) */}
      <polyline points={drowning.map((v, i) => `${xAt(i)},${yScale(v, Math.max(...drowning))}`).join(" ")} fill="none" stroke="#4A89B4" strokeWidth={2.5} strokeDasharray="5 4" />
      {/* Heat band (hidden cause) */}
      <polyline points={heat.map((v, i) => `${xAt(i)},${yScale(v, 40)}`).join(" ")} fill="none" stroke={P.good} strokeWidth={1.5} opacity={0.5} />
      {/* x labels */}
      {months.map((m, i) => (
        <text key={m} x={xAt(i)} y={chartY + chartH + 20} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>{m}</text>
      ))}
      {/* Legend */}
      <g>
        <rect x={80} y={360} width={210} height={50} rx={10} fill={P.blush} opacity={0.5} />
        <line x1={94} y1={385} x2={120} y2={385} stroke="#E47B6B" strokeWidth={3} />
        <text x={130} y={389} fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>مبيعات الآيس كريم</text>
        <rect x={300} y={360} width={210} height={50} rx={10} fill={P.blue} opacity={0.5} />
        <line x1={314} y1={385} x2={340} y2={385} stroke="#4A89B4" strokeWidth={3} strokeDasharray="5 4" />
        <text x={350} y={389} fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>حوادث غرق</text>
        <rect x={520} y={360} width={210} height={50} rx={10} fill={P.mint} opacity={0.6} />
        <line x1={534} y1={385} x2={560} y2={385} stroke={P.good} strokeWidth={2} />
        <text x={570} y={389} fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>الحرارة (السبب الفعلي)</text>
      </g>
      {/* Takeaway */}
      <rect x={80} y={430} width={640} height={60} rx={12} fill={P.lavender} opacity={0.45} />
      <RtlText x={96} y={436} w={608} h={48} size={12}>قبل ما تقول «X سبب Y» اسأل: في حاجة تانية بتحرّك الاتنين؟ هنا الحرارة بترفع المبيعات والغرق · الآيس كريم برىء.</RtlText>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M5 · Question Rewrite (3 errors → 3 fixes)
 * ============================================================ */
export const QuestionRewriteDiagram: FC = () => {
  const rows = [
    { tag: "عام", bad: "«إيه أحوال الشغل؟»", fix: "«كام lead جه من إعلان X آخر ٧ أيام؟»", color: P.blush },
    { tag: "متحيّز", bad: "«ليه الإعلان فاشل؟»", fix: "«كام lead جاب · بكام · ومن أي مصدر؟»", color: P.peach },
    { tag: "بدون بيانات", bad: "«كام عميل سعيد؟»", fix: "«كام عميل اشترى مرتين خلال ٣٠ يوم؟»", color: P.lavender },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="٣ أخطاء قاتلة في السؤال — والعلاج" s="نوع الخطأ · السؤال الغلط · السؤال المصحّح" />
      {/* Header */}
      <rect x={40} y={90} width={120} height={36} rx={8} fill={P.lavender} />
      <text x={100} y={113} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>نوع الخطأ</text>
      <rect x={170} y={90} width={290} height={36} rx={8} fill={P.blush} />
      <text x={315} y={113} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>السؤال الغلط ✗</text>
      <rect x={470} y={90} width={290} height={36} rx={8} fill={P.mint} />
      <text x={615} y={113} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>السؤال المصحّح ✓</text>
      {rows.map((r, i) => {
        const y = 140 + i * 110;
        return (
          <g key={i}>
            <rect x={40} y={y} width={120} height={95} rx={10} fill={r.color} stroke={P.stroke} />
            <text x={100} y={y + 50} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>{r.tag}</text>
            <rect x={170} y={y} width={290} height={95} rx={10} fill="#fff" stroke={P.stroke} />
            <RtlText x={184} y={y + 8} w={262} h={80} size={13} weight={700} color={P.bad}>{r.bad}</RtlText>
            <text x={465} y={y + 52} fontFamily={F} fontSize={20} fill={P.inkSoft}>→</text>
            <rect x={470} y={y} width={290} height={95} rx={10} fill="#fff" stroke={P.good} strokeWidth={1.5} />
            <RtlText x={484} y={y + 8} w={262} h={80} size={13} weight={700} color={P.good}>{r.fix}</RtlText>
          </g>
        );
      })}
      <rect x={40} y={470} width={720} height={36} rx={10} fill={P.mint} opacity={0.4} />
      <text x={400} y={493} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>القاعدة: لو السؤال مكمّلش الـ ٤ شروط — صياغته غلط · مش الإجابة</text>
    </svg>
  );
};

/* ============================================================
 * ANALYST · M6 · Decision Backlog → Business
 * ============================================================ */
export const DecisionBacklogDiagram: FC = () => {
  const decisions = [
    "أضف السعر في أول رسالة WhatsApp",
    "اوقف إعلان X — CPL أعلى من الـ LTV",
    "اعمل follow-up بعد ٣ أيام تلقائي",
    "غيّر صورة الهيرو في الـ landing page",
    "ابعت survey لـ ٢٠ عميل قديم",
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Decision Backlog → Business System" s="القرارات من Analyst بتدخل نظام تنفيذ Business" />
      {/* Backlog */}
      <rect x={40} y={100} width={300} height={380} rx={14} fill="#fff" stroke={P.stroke} />
      <rect x={40} y={100} width={300} height={48} rx={14} fill={P.blue} />
      <text x={190} y={130} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>Analyst — Decision Backlog</text>
      {decisions.map((d, i) => (
        <g key={i}>
          <rect x={56} y={170 + i * 56} width={268} height={44} rx={8} fill={P.bg} stroke={P.stroke} />
          <circle cx={76} cy={192 + i * 56} r={10} fill={P.lavender} />
          <text x={76} y={196 + i * 56} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{i + 1}</text>
          <RtlText x={94} y={172 + i * 56} w={224} h={40} size={11}>{d}</RtlText>
        </g>
      ))}
      {/* Arrow */}
      <text x={360} y={290} fontFamily={F} fontSize={26} fill={P.inkSoft}>→</text>
      {/* Business kanban */}
      <rect x={400} y={100} width={360} height={380} rx={14} fill="#fff" stroke={P.stroke} />
      <rect x={400} y={100} width={360} height={48} rx={14} fill={P.mint} />
      <text x={580} y={130} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>Business — Operational System</text>
      {[
        { label: "To Do", x: 410, fill: P.blush, items: ["#4", "#5"] },
        { label: "Doing", x: 528, fill: P.peach, items: ["#3"] },
        { label: "Done", x: 646, fill: P.mint, items: ["#1", "#2"] },
      ].map((col, i) => (
        <g key={i}>
          <rect x={col.x} y={166} width={106} height={300} rx={10} fill={col.fill} opacity={0.3} stroke={P.stroke} />
          <text x={col.x + 53} y={186} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{col.label}</text>
          {col.items.map((it, j) => (
            <g key={j}>
              <rect x={col.x + 8} y={200 + j * 50} width={90} height={40} rx={6} fill="#fff" stroke={P.stroke} />
              <text x={col.x + 53} y={224 + j * 50} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>{it}</text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M0 · Operator vs Leader (time pie)
 * ============================================================ */
const Donut: FC<{ cx: number; cy: number; r: number; segments: { v: number; fill: string; label: string }[] }> = ({ cx, cy, r, segments }) => {
  const total = segments.reduce((a, b) => a + b.v, 0);
  let acc = -Math.PI / 2;
  return (
    <g>
      {segments.map((s, i) => {
        const ang = (s.v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(acc), y1 = cy + r * Math.sin(acc);
        const x2 = cx + r * Math.cos(acc + ang), y2 = cy + r * Math.sin(acc + ang);
        const large = ang > Math.PI ? 1 : 0;
        const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
        const mid = acc + ang / 2;
        const lx = cx + (r * 0.65) * Math.cos(mid);
        const ly = cy + (r * 0.65) * Math.sin(mid);
        acc += ang;
        return (
          <g key={i}>
            <path d={d} fill={s.fill} stroke="#fff" strokeWidth={2} />
            <text x={lx} y={ly + 4} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>{s.v}%</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.45} fill={P.bg} />
    </g>
  );
};

export const OperatorVsLeaderDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={P.bg} />
    <Title t="إنت Operator أم Leader؟" s="توزيع وقتك اليوم · والهدف" />
    {/* Now */}
    <text x={210} y={110} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.bad}>اليوم — Operator-heavy</text>
    <Donut cx={210} cy={250} r={110} segments={[
      { v: 80, fill: P.blush, label: "Operator" },
      { v: 20, fill: P.mint, label: "Leader" },
    ]} />
    <text x={210} y={252} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>اليوم</text>
    {/* Arrow */}
    <text x={400} y={260} textAnchor="middle" fontFamily={F} fontSize={40} fill={P.inkSoft}>→</text>
    {/* Target */}
    <text x={590} y={110} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.good}>الهدف — Leader-heavy</text>
    <Donut cx={590} cy={250} r={110} segments={[
      { v: 30, fill: P.blush, label: "Operator" },
      { v: 70, fill: P.mint, label: "Leader" },
    ]} />
    <text x={590} y={252} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>الهدف</text>
    {/* Legend */}
    <rect x={50} y={410} width={350} height={80} rx={12} fill={P.blush} opacity={0.4} />
    <text x={225} y={433} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>Operator</text>
    <RtlText x={66} y={440} w={318} h={50} size={11}>بتنفّذ بإيدك · بترد رسائل · بتدخل بيانات · Revenue مرتبط بساعاتك</RtlText>
    <rect x={410} y={410} width={350} height={80} rx={12} fill={P.mint} opacity={0.4} />
    <text x={585} y={433} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>Leader</text>
    <RtlText x={426} y={440} w={318} h={50} size={11}>بتصمّم systems · بتقرّر الاتجاه · النظام = leverage · النمو منفصل عن ساعاتك</RtlText>
  </svg>
);

/* ============================================================
 * BUSINESS · M1 · Reactive vs Proactive Day (timeline)
 * ============================================================ */
export const ReactiveVsProactiveDayDiagram: FC = () => {
  const hours = ["8", "9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
  const reactiveBlocks = [
    { x: 0, w: 2, label: "WhatsApp", fill: P.blush },
    { x: 2, w: 1, label: "رد", fill: P.blush },
    { x: 3, w: 2, label: "اجتماع طارئ", fill: P.peach },
    { x: 5, w: 1, label: "رسائل", fill: P.blush },
    { x: 6, w: 2, label: "حريق", fill: P.bad === "#C4543E" ? "#E5BAB1" : P.blush },
    { x: 8, w: 2, label: "إيميل", fill: P.blush },
  ];
  const proactiveBlocks = [
    { x: 0, w: 1, label: "Plan + AI", fill: P.lavender },
    { x: 1, w: 3, label: "Deep Work — أهم مهمة", fill: P.mint },
    { x: 4, w: 1, label: "WhatsApp", fill: P.blush },
    { x: 5, w: 2, label: "اجتماعات", fill: P.peach },
    { x: 7, w: 2, label: "تنفيذ", fill: P.mint },
    { x: 9, w: 1, label: "Review", fill: P.lavender },
  ];
  const drawTimeline = (y: number, blocks: typeof reactiveBlocks, label: string, badge: string, color: string) => {
    const startX = 100;
    const slotW = 60;
    return (
      <g>
        <text x={50} y={y - 20} fontFamily={F} fontSize={13} fontWeight={700} fill={color}>{label}</text>
        <text x={50} y={y - 4} fontFamily={F} fontSize={10} fill={P.inkSoft}>{badge}</text>
        {hours.map((h, i) => (
          <text key={h} x={startX + i * slotW + slotW / 2} y={y - 6} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>{h}</text>
        ))}
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={startX + b.x * slotW} y={y} width={b.w * slotW - 4} height={50} rx={6} fill={b.fill} stroke={P.stroke} />
            <text x={startX + b.x * slotW + (b.w * slotW - 4) / 2} y={y + 30} textAnchor="middle" fontFamily={F} fontSize={10} fontWeight={700} fill={P.ink}>{b.label}</text>
          </g>
        ))}
        <line x1={startX} y1={y + 60} x2={startX + hours.length * slotW} y2={y + 60} stroke={P.stroke} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="نفس اليوم — توزيعين مختلفين" s="مين بيختار: الرسائل أم إنت؟" />
      {drawTimeline(160, reactiveBlocks, "Reactive Day", "بدأ يومه بـ WhatsApp · أهم مهمة ما اتعملتش", P.bad)}
      {drawTimeline(320, proactiveBlocks, "Proactive Day", "بدأ بـ Plan + Deep Work · رسائل بعد أول مهمة", P.good)}
      <rect x={50} y={430} width={700} height={60} rx={12} fill={P.mint} opacity={0.4} />
      <RtlText x={66} y={440} w={668} h={50} size={12}>القاعدة: WhatsApp بيتفتح بعد ما تخلّص أول مهمة مهمة · الرسائل بتستنى · الفرصة لأ.</RtlText>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M1 · Weekly Theme Days
 * ============================================================ */
export const WeeklyThemeDaysDiagram: FC = () => {
  const days = [
    { name: "الاثنين", theme: "Builder", sub: "بناء المنتج", fill: P.blue },
    { name: "الثلاثاء", theme: "Builder", sub: "بناء المنتج", fill: P.blue },
    { name: "الأربعاء", theme: "Creator", sub: "محتوى الأسبوع", fill: P.peach },
    { name: "الخميس", theme: "Automator", sub: "Flows + إصلاح", fill: P.lavender },
    { name: "الجمعة", theme: "Analyst", sub: "Review + قرار", fill: P.mint },
    { name: "السبت", theme: "Buffer", sub: "طوارئ/راحة", fill: P.blush },
    { name: "الأحد", theme: "Review 15د", sub: "Analyst ritual", fill: P.mint },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="أسبوع · ٤ مسارات · يوم لكل تركيز" s="Theme Days — Context switching أقل · جودة أعلى" />
      {days.map((d, i) => {
        const x = 40 + i * 105;
        return (
          <g key={i}>
            <rect x={x} y={100} width={95} height={36} rx={8} fill="#fff" stroke={P.stroke} />
            <text x={x + 47} y={123} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{d.name}</text>
            <rect x={x} y={146} width={95} height={250} rx={12} fill={d.fill} stroke={P.stroke} />
            <text x={x + 47} y={250} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>{d.theme}</text>
            <RtlText x={x + 6} y={260} w={83} h={120} size={11} color={P.inkSoft}>
              <div style={{ textAlign: "center", width: "100%" }}>{d.sub}</div>
            </RtlText>
          </g>
        );
      })}
      <rect x={40} y={420} width={720} height={70} rx={12} fill="#fff" stroke={P.stroke} />
      <text x={400} y={445} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>Context switching بياكل ٤٠٪ من إنتاجيتك</text>
      <text x={400} y={467} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>كل يوم = تركيز واحد · بتدخل عمق المسار بدل ما تطفّ عليه</text>
      <text x={400} y={482} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>عدّل التوزيع حسب شغلك — احتفظ بالـ Theme Day Rule</text>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M2 · Follow-up Cadence (3-14-30)
 * ============================================================ */
export const FollowupCadenceDiagram: FC = () => {
  const msgs = [
    { day: "اليوم ٣", title: "هل وصلك اللي اتفقنا عليه؟", purpose: "تأكيد + فرصة للشكوى", fill: P.blue },
    { day: "اليوم ١٤", title: "إيه رأيك دلوقتي؟", purpose: "Feedback + تذكير", fill: P.mint },
    { day: "اليوم ٣٠", title: "هدية / منتج مكمّل", purpose: "Upsell طبيعي", fill: P.peach },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Follow-up Flow — ٣ رسائل بتضاعف الـ LTV" s="٣ أيام → ١٤ يوم → ٣٠ يوم · كله Automator M5" />
      {/* Timeline */}
      <line x1={80} y1={210} x2={720} y2={210} stroke={P.stroke} strokeWidth={2} />
      <circle cx={80} cy={210} r={12} fill={P.lavender} stroke={P.stroke} strokeWidth={2} />
      <text x={80} y={245} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>الشراء</text>
      {msgs.map((m, i) => {
        const x = 220 + i * 200;
        return (
          <g key={i}>
            <circle cx={x} cy={210} r={14} fill={m.fill} stroke={P.stroke} strokeWidth={2} />
            <text x={x} y={215} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{i + 1}</text>
            <text x={x} y={245} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>{m.day}</text>
            <rect x={x - 85} y={270} width={170} height={120} rx={12} fill={m.fill} opacity={0.4} stroke={P.stroke} />
            <RtlText x={x - 75} y={278} w={150} h={50} size={12} weight={700}>{m.title}</RtlText>
            <RtlText x={x - 75} y={335} w={150} h={50} size={10} color={P.inkSoft}>{m.purpose}</RtlText>
          </g>
        );
      })}
      {/* Compare */}
      <rect x={50} y={420} width={340} height={70} rx={12} fill={P.blush} opacity={0.45} />
      <text x={220} y={445} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>بدون متابعة</text>
      <text x={220} y={465} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>LTV: 250ج · العميل بينساك</text>
      <text x={220} y={482} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.bad}>معدل الرجوع: 4%</text>
      <rect x={410} y={420} width={340} height={70} rx={12} fill={P.mint} opacity={0.45} />
      <text x={580} y={445} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>مع الـ ٣ touchpoints</text>
      <text x={580} y={465} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>LTV: 800ج · العميل بيحس بالاهتمام</text>
      <text x={580} y={482} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.good}>معدل الرجوع: 22%</text>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M3 · Delegate vs Automate Matrix
 * ============================================================ */
export const DelegateAutomateMatrixDiagram: FC = () => (
  <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
    <rect width="800" height="520" fill={P.bg} />
    <Title t="تفوّض ولا تأتمت؟" s="٢×٢ matrix · تكرار × طبيعة المهمة" />
    {/* Axes labels */}
    <text x={400} y={95} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>متكرّرة ←</text>
    <text x={400} y={485} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>غير متكرّرة</text>
    <text x={50} y={285} fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>محتاجة حكم</text>
    <text x={750} y={285} textAnchor="end" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>قواعد ثابتة →</text>
    {/* Quadrants */}
    {[
      { x: 130, y: 110, fill: P.blush, label: "Delegate", title: "متكرّرة + حكم بشري", ex: "ردود شكاوى · تنسيق فريق", color: "#A8674E" },
      { x: 410, y: 110, fill: P.mint, label: "Automate", title: "متكرّرة + قواعد", ex: "تأكيد طلب · فاتورة · follow-up", color: P.good },
      { x: 130, y: 280, fill: P.peach, label: "إنت", title: "غير متكرّرة + استراتيجية", ex: "اتجاه شغلك · شراكات", color: "#A06A2C" },
      { x: 410, y: 280, fill: P.lavender, label: "SOP أولاً", title: "غير متكرّرة + غامضة", ex: "اكتب SOP · بعدها قرّر", color: "#7A5DA8" },
    ].map((q, i) => (
      <g key={i}>
        <rect x={q.x} y={q.y} width={260} height={160} rx={14} fill={q.fill} stroke={P.stroke} />
        <text x={q.x + 130} y={q.y + 32} textAnchor="middle" fontFamily={F} fontSize={16} fontWeight={700} fill={q.color}>{q.label}</text>
        <text x={q.x + 130} y={q.y + 56} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>{q.title}</text>
        <line x1={q.x + 30} y1={q.y + 72} x2={q.x + 230} y2={q.y + 72} stroke={P.stroke} />
        <RtlText x={q.x + 16} y={q.y + 80} w={228} h={70} size={11}>{q.ex}</RtlText>
      </g>
    ))}
    <rect x={130} y={455} width={540} height={40} rx={10} fill="#fff" stroke={P.stroke} />
    <text x={400} y={480} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.bad}>Bot بيرد على شكوى معقّدة = سمعتك بتأذى · كل مهمة في مكانها</text>
  </svg>
);

/* ============================================================
 * BUSINESS · M3 · Strategic / Operational / Admin (now vs target)
 * ============================================================ */
export const SOABarsDiagram: FC = () => {
  const items = [
    { label: "Administrative", now: 60, target: 10, fill: P.blush, sub: "أتمت بالكامل" },
    { label: "Operational", now: 30, target: 30, fill: P.peach, sub: "Workflows + ناس" },
    { label: "Strategic", now: 10, target: 60, fill: P.mint, sub: "إنت بس" },
  ];
  const chartX = 240;
  const maxW = 460;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="٣ أنواع شغل — اليوم vs الهدف" s="هدفك: Strategic > Operational > Administrative" />
      <text x={chartX - 10} y={108} textAnchor="end" fontFamily={F} fontSize={11} fontWeight={700} fill={P.inkSoft}>النوع</text>
      <text x={chartX + 10} y={108} fontFamily={F} fontSize={11} fontWeight={700} fill={P.bad}>اليوم</text>
      <text x={chartX + 10} y={252} fontFamily={F} fontSize={11} fontWeight={700} fill={P.good}>الهدف</text>
      {items.map((it, i) => {
        const y = 130 + i * 110;
        const nowW = (it.now / 100) * maxW;
        const tgtW = (it.target / 100) * maxW;
        return (
          <g key={i}>
            {/* Label column */}
            <text x={chartX - 10} y={y + 12} textAnchor="end" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>{it.label}</text>
            <text x={chartX - 10} y={y + 28} textAnchor="end" fontFamily={F} fontSize={10} fill={P.inkSoft}>{it.sub}</text>
            {/* Now bar */}
            <rect x={chartX} y={y} width={maxW} height={30} rx={6} fill="#fff" stroke={P.stroke} />
            <rect x={chartX} y={y} width={nowW} height={30} rx={6} fill={it.fill} opacity={0.7} />
            <text x={chartX + nowW + 8} y={y + 20} fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>{it.now}%</text>
            {/* Target bar */}
            <rect x={chartX} y={y + 40} width={maxW} height={30} rx={6} fill="#fff" stroke={P.stroke} />
            <rect x={chartX} y={y + 40} width={tgtW} height={30} rx={6} fill={it.fill} />
            <text x={chartX + tgtW + 8} y={y + 60} fontFamily={F} fontSize={12} fontWeight={700} fill={P.good}>{it.target}%</text>
          </g>
        );
      })}
      <rect x={40} y={440} width={720} height={50} rx={12} fill={P.mint} opacity={0.4} />
      <RtlText x={56} y={450} w={688} h={36} size={12}>المعادلة: Administrative → Automator · Operational → Workflows + ناس · Strategic → إنت فقط</RtlText>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M4 · Readiness Signals (4 gauges)
 * ============================================================ */
export const ReadinessSignalsDiagram: FC = () => {
  const signals = [
    { label: "System بيشتغل لوحده", score: 80, fill: P.mint, status: "✓" },
    { label: "نتائج ثابتة شهر بشهر", score: 65, fill: P.blue, status: "✓" },
    { label: "طلب أكتر من قدرتي", score: 40, fill: P.peach, status: "⚠" },
    { label: "وقت للتفكير الاستراتيجي", score: 25, fill: P.blush, status: "✗" },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="٤ علامات الجاهزية للتوسع" s="لو واحدة ناقصة — ثبّت الأول · بعدين كبّر" />
      {signals.map((s, i) => {
        const x = 40 + (i % 2) * 380;
        const y = 100 + Math.floor(i / 2) * 180;
        const filled = (s.score / 100) * 320;
        const color = s.score >= 60 ? P.good : s.score >= 40 ? "#C8941F" : P.bad;
        return (
          <g key={i}>
            <rect x={x} y={y} width={340} height={150} rx={14} fill="#fff" stroke={P.stroke} />
            <circle cx={x + 30} cy={y + 30} r={16} fill={s.fill} />
            <text x={x + 30} y={y + 36} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={color}>{s.status}</text>
            <RtlText x={x + 56} y={y + 18} w={260} h={28} size={13} weight={700}>{s.label}</RtlText>
            {/* Gauge */}
            <rect x={x + 16} y={y + 90} width={320} height={18} rx={9} fill={P.bg} stroke={P.stroke} />
            <rect x={x + 16} y={y + 90} width={filled} height={18} rx={9} fill={color} />
            <text x={x + 16 + filled - 4} y={y + 130} textAnchor="end" fontFamily={F} fontSize={12} fontWeight={700} fill={color}>{s.score}%</text>
            <text x={x + 320} y={y + 130} textAnchor="end" fontFamily={F} fontSize={11} fill={P.inkSoft}>الحد الأدنى ٦٠٪</text>
          </g>
        );
      })}
      <rect x={40} y={460} width={720} height={36} rx={10} fill={P.blush} opacity={0.4} />
      <text x={400} y={483} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.bad}>الحماس ≠ الجاهزية · توسّع قبل الوقت = تكبير المشاكل</text>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M4 · System then People (two onboarding timelines)
 * ============================================================ */
export const SystemThenPeopleDiagram: FC = () => {
  const days = [1, 7, 14, 30, 60];
  const noSystem = ["تيه", "أسئلة", "لسه بيتعلّم", "اختراع", "غادر"];
  const withSystem = ["تنفيذ SOP", "أوّل مهمة", "إتقان", "تحسين SOP", "بيدرّب التاني"];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="نظام قبل الناس — Onboarding أوّل شخص" s="نفس الشخص · ٦٠ يوم · نتيجتين مختلفتين" />
      {/* without system */}
      <text x={50} y={130} fontFamily={F} fontSize={13} fontWeight={700} fill={P.bad}>بدون نظام — جبت شخص ينقذني</text>
      <line x1={140} y1={170} x2={720} y2={170} stroke={P.stroke} />
      {days.map((d, i) => {
        const x = 140 + (i / (days.length - 1)) * 580;
        return (
          <g key={i}>
            <circle cx={x} cy={170} r={9} fill={P.blush} stroke={P.stroke} strokeWidth={1.5} />
            <text x={x} y={195} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>يوم {d}</text>
            <text x={x} y={215} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.bad}>{noSystem[i]}</text>
          </g>
        );
      })}
      {/* with system */}
      <text x={50} y={300} fontFamily={F} fontSize={13} fontWeight={700} fill={P.good}>مع نظام — SOP + Dashboard جاهزين</text>
      <line x1={140} y1={340} x2={720} y2={340} stroke={P.stroke} />
      {days.map((d, i) => {
        const x = 140 + (i / (days.length - 1)) * 580;
        return (
          <g key={i}>
            <circle cx={x} cy={340} r={9} fill={P.mint} stroke={P.stroke} strokeWidth={1.5} />
            <text x={x} y={365} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>يوم {d}</text>
            <text x={x} y={385} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>{withSystem[i]}</text>
          </g>
        );
      })}
      {/* takeaway */}
      <rect x={50} y={420} width={700} height={70} rx={12} fill="#fff" stroke={P.stroke} />
      <text x={400} y={445} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>الترتيب الصح: وثّق → أتمت → فوّض</text>
      <text x={400} y={466} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>أوّل أسبوع للشخص الجديد = اتباع SOP · مش اختراع</text>
      <text x={400} y={483} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>إنتاجيته ٥ أضعاف لمّا النظام موجود</text>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M5 · Premature Scaling Cliff (cost vs revenue)
 * ============================================================ */
export const PrematureScalingCliffDiagram: FC = () => {
  const months = ["م1", "م2", "م3", "م4", "م5", "م6"];
  const revenue = [40, 42, 44, 45, 46, 45];
  const cost = [35, 50, 75, 100, 125, 150];
  const chartX = 80, chartY = 110, chartW = 560, chartH = 230;
  const yMax = 160;
  const yScale = (v: number) => chartY + chartH - (v / yMax) * chartH;
  const xAt = (i: number) => chartX + i * (chartW / (months.length - 1));
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="Premature Scaling — Burn Cliff" s="٦ شهور · المصاريف ٤× · الـ Revenue ثابت" />
      {/* grid */}
      {[0, 50, 100, 150].map((v) => (
        <g key={v}>
          <line x1={chartX} y1={yScale(v)} x2={chartX + chartW} y2={yScale(v)} stroke={P.stroke} />
          <text x={chartX - 8} y={yScale(v) + 4} textAnchor="end" fontFamily={F} fontSize={10} fill={P.inkSoft}>{v}k</text>
        </g>
      ))}
      {/* Revenue line */}
      <polyline points={revenue.map((v, i) => `${xAt(i)},${yScale(v)}`).join(" ")} fill="none" stroke={P.good} strokeWidth={3} />
      {/* Cost line */}
      <polyline points={cost.map((v, i) => `${xAt(i)},${yScale(v)}`).join(" ")} fill="none" stroke={P.bad} strokeWidth={3} />
      {/* Burn area */}
      <polygon
        points={`${revenue.map((v, i) => `${xAt(i)},${yScale(v)}`).join(" ")} ${cost.slice().reverse().map((v, i) => `${xAt(cost.length - 1 - i)},${yScale(v)}`).join(" ")}`}
        fill={P.blush} opacity={0.4}
      />
      {/* labels */}
      {months.map((m, i) => (
        <text key={m} x={xAt(i)} y={chartY + chartH + 18} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.inkSoft}>{m}</text>
      ))}
      {/* annotations */}
      <text x={xAt(0) + 5} y={yScale(40) - 8} fontFamily={F} fontSize={11} fontWeight={700} fill={P.good}>Revenue (ثابت)</text>
      <text x={xAt(5) - 5} y={yScale(150) - 8} textAnchor="end" fontFamily={F} fontSize={11} fontWeight={700} fill={P.bad}>Cost (٤× في ٦ شهور)</text>
      <text x={xAt(3)} y={yScale(72)} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.bad}>Burn Zone</text>
      {/* signals legend */}
      <rect x={50} y={380} width={700} height={120} rx={12} fill="#fff" stroke={P.stroke} />
      <text x={400} y={405} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>علامات الخطر — أي علامة = توقّف فورًا</text>
      <RtlText x={70} y={410} w={660} h={90} size={11}>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>توظيف قبل ما الـ revenue يبرّره · 2) CAC أكبر من الـ LTV · 3) خدمات جديدة قبل ما الأساسية تثبت · 4) قروض عشان تكبّر مش لفرصة محسوبة</li>
        </ol>
      </RtlText>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M5 · Reactive Relapse Cycle
 * ============================================================ */
export const ReactiveRelapseCycleDiagram: FC = () => {
  const stages = [
    { x: 400, y: 130, label: "Trigger", sub: "أزمة / شخص محبط", fill: P.peach },
    { x: 580, y: 270, label: "Relapse", sub: "بتفتح WhatsApp الأول", fill: P.blush },
    { x: 400, y: 410, label: "Notice", sub: "بتلاحظ العلامة", fill: P.lavender },
    { x: 220, y: 270, label: "Reset", sub: "خطوات إصلاح", fill: P.mint },
  ];
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="دورة الانتكاسة لـ Reactive" s="الانتكاسة طبيعية · المهم تلاحظها وتعمل Reset نفس اليوم" />
      {/* Arrows in circle */}
      {stages.map((s, i) => {
        const next = stages[(i + 1) % stages.length];
        return <line key={i} x1={s.x} y1={s.y} x2={next.x} y2={next.y} stroke={P.stroke} strokeWidth={2} strokeDasharray="4 4" />;
      })}
      {stages.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={56} fill={s.fill} stroke={P.stroke} strokeWidth={2} />
          <text x={s.x} y={s.y - 6} textAnchor="middle" fontFamily={F} fontSize={14} fontWeight={700} fill={P.ink}>{s.label}</text>
          <text x={s.x} y={s.y + 14} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>{s.sub}</text>
        </g>
      ))}
      {/* Sample triggers/resets table */}
      <rect x={40} y={460} width={720} height={50} rx={10} fill="#fff" stroke={P.stroke} />
      <text x={400} y={480} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={P.ink}>أمثلة Reset: قفل WhatsApp بعد المساء · التليفون في غرفة تانية ساعة · الـ ١٥ دقيقة الأحد بدون استثناء</text>
      <text x={400} y={498} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>الانتكاسة بتاخد يوم — مش شهر · لمّا تلاحظها بسرعة</text>
    </svg>
  );
};

/* ============================================================
 * BUSINESS · M6 · Full Ecosystem Loop (5 paths)
 * ============================================================ */
export const EcosystemLoopDiagram: FC = () => {
  const paths = [
    { angle: -90, label: "Builder", sub: "المنتج / النظام", fill: P.blue },
    { angle: -18, label: "Creator", sub: "Reach + leads", fill: P.peach },
    { angle: 54, label: "Automator", sub: "تجميع + متابعة", fill: P.lavender },
    { angle: 126, label: "Analyst", sub: "أسئلة + قرارات", fill: P.mint },
    { angle: 198, label: "Business", sub: "قيادة + توسع", fill: P.blush },
  ];
  const cx = 400, cy = 280, r = 150;
  return (
    <svg viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg" role="img">
      <rect width="800" height="520" fill={P.bg} />
      <Title t="الـ ٥ مسارات — Ecosystem واحد" s="كل مسار بيغذّي اللي بعديه · Compounding على شهور" />
      {/* Arrows between */}
      {paths.map((p, i) => {
        const a = (p.angle * Math.PI) / 180;
        const b = (paths[(i + 1) % paths.length].angle * Math.PI) / 180;
        const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
        const x2 = cx + r * Math.cos(b), y2 = cy + r * Math.sin(b);
        return <path key={i} d={`M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`} fill="none" stroke={P.stroke} strokeWidth={2} strokeDasharray="6 5" />;
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r={56} fill="#fff" stroke={P.stroke} strokeWidth={2} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>إنت</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>+ AI + System</text>
      {/* Nodes */}
      {paths.map((p, i) => {
        const a = (p.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={48} fill={p.fill} stroke={P.stroke} strokeWidth={2} />
            <text x={x} y={y - 4} textAnchor="middle" fontFamily={F} fontSize={13} fontWeight={700} fill={P.ink}>{p.label}</text>
            <text x={x} y={y + 14} textAnchor="middle" fontFamily={F} fontSize={10} fill={P.inkSoft}>{p.sub}</text>
          </g>
        );
      })}
      {/* Outcomes */}
      <rect x={40} y={460} width={720} height={50} rx={12} fill={P.mint} opacity={0.4} />
      <text x={400} y={480} textAnchor="middle" fontFamily={F} fontSize={12} fontWeight={700} fill={P.ink}>النتيجة: شغل بينمو · ساعاتك بتقل · قراراتك بتكبر</text>
      <text x={400} y={498} textAnchor="middle" fontFamily={F} fontSize={11} fill={P.good}>كل قرار من Business بيرجع feedback يحسّن المسارات الـ ٤ — وتبدأ الدورة بمستوى أعلى</text>
    </svg>
  );
};

/* ---------- Registry export ---------- */
export const ANALYST_BUSINESS_DIAGRAMS = {
  "decision-loop": DecisionLoopDiagram,
  "question-scorecard": QuestionScorecardDiagram,
  "ai-summarization-flow": AISummarizationFlowDiagram,
  "three-sources-merge": ThreeSourcesMergeDiagram,
  "decision-chain": DecisionChainDiagram,
  "four-kpi-dashboard": FourKpiDashboardDiagram,
  "weekly-review-timeline": WeeklyReviewTimelineDiagram,
  "correlation-causation": CorrelationCausationDiagram,
  "question-rewrite": QuestionRewriteDiagram,
  "decision-backlog": DecisionBacklogDiagram,
  "operator-vs-leader": OperatorVsLeaderDiagram,
  "reactive-vs-proactive-day": ReactiveVsProactiveDayDiagram,
  "weekly-theme-days": WeeklyThemeDaysDiagram,
  "followup-cadence": FollowupCadenceDiagram,
  "delegate-automate-matrix": DelegateAutomateMatrixDiagram,
  "soa-bars": SOABarsDiagram,
  "readiness-signals": ReadinessSignalsDiagram,
  "system-then-people": SystemThenPeopleDiagram,
  "premature-scaling-cliff": PrematureScalingCliffDiagram,
  "reactive-relapse-cycle": ReactiveRelapseCycleDiagram,
  "ecosystem-loop": EcosystemLoopDiagram,
} as const;