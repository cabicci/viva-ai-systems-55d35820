const points = [
  { n: "01", t: "تطبيق قبل النظرية", d: "كل درس لازم يطلعك بحاجة نفذتها.", color: "var(--pastel-blue)" },
  { n: "02", t: "نظام مش فوضى", d: "كل مهارة جزء من منظومة كاملة.", color: "var(--pastel-pink)" },
  { n: "03", t: "AI شريك ليك مش مجرد أداة", d: "هتتعلم تبني مع الـ AI، مش تستخدمه بشكل عشوائي.", color: "var(--pastel-mint)" },
  { n: "04", t: "بساطة بصرية", d: "كروت، خطوات واضحة، ومسارات سهلة — من غير زحمة كلام.", color: "var(--pastel-yellow)" },
];

export function Philosophy() {
  return (
    <section id="philosophy" className="container mx-auto px-4 py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-primary text-sm font-semibold mb-3">الفلسفة</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            تجربة بسيطة، واضحة، <br />
            وقابلة <span className="text-gradient">للتوسع</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
            المنصة معمولة عشان تبدأ بسهولة، وتكبر خطوة بخطوة من غير تعقيد.
          </p>
        </div>

        <div className="space-y-4">
          {points.map((p) => (
            <div key={p.n} className="glass rounded-2xl p-6 flex gap-5 items-start hover:border-primary/30 transition">
              <span
                className="grid h-12 w-12 place-items-center rounded-xl text-xl font-black text-foreground/80 shrink-0"
                style={{ background: p.color }}
              >
                {p.n}
              </span>
              <div>
                <h3 className="font-bold text-xl mb-1">{p.t}</h3>
                <p className="text-muted-foreground">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
