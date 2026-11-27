import { useState } from "react";
import type { SupportedLocale } from "@/lib/locale/types";
import { tripCopy } from "./trip-planner-copy";

const sources = {
  fare: "https://tfl.gov.uk/how-to-pay/check-travel-costs/bus-and-tram-fares",
  capping: "https://tfl.gov.uk/how-to-pay/pay-as-you-go/fare-capping",
  ng: "https://www.nationalgallery.org.uk/visiting/plan-your-visit",
  access: "https://www.nationalgallery.org.uk/visiting/access",
  npg: "https://www.npg.org.uk/visit/",
} as const;

const changes = ["cut", "queue", "both"] as const;
type Change = (typeof changes)[number];

export function TripPlannerLab({ locale }: { locale: SupportedLocale }) {
  const c = tripCopy[locale];
  const [food, setFood] = useState("14");
  const [gift, setGift] = useState("9");
  const [view, setView] = useState("50");
  const [change, setChange] = useState<Change>();
  const [checked, setChecked] = useState(false);
  const [baseline, setBaseline] = useState(false);
  const cap = change === "cut" ? 32 : change === "both" ? 34 : 40;
  const delay = change === "queue" ? 35 : change === "both" ? 25 : 0;
  const dollars = [food, gift].map(Number);
  const minutes = Number(view);
  const valid = [food, gift].every(v => /^\d+(?:\.\d{1,2})?$/.test(v))
    && dollars.every(Number.isFinite) && dollars[0] >= 10
    && Number.isInteger(minutes) && minutes >= 5 && minutes <= 90;
  const allocated = 1355 + Math.round(dollars[0] * 100) + Math.round(dollars[1] * 100);
  const balance = cap * 100 - allocated;
  const end = 12 * 60 + 55 + delay + minutes + 40;
  const late = end > 14 * 60 + 45;
  const fits = valid && balance >= 0 && !late;
  const money = (pence: number) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "ar", { style: "currency", currency: "GBP" }).format(pence / 100);
  function update(set: (s: string) => void, value: string) {
    set(value);
    setChecked(false);
  }
  return <section className="space-y-4 rounded-2xl border bg-muted/30 p-4" aria-label={c.lab}>
    <h3 className="font-bold">{c.lab}</h3>
    <p>{c.labIntro}</p><p>{c.fixed}</p><p>{c.route}</p>
    {change && <p role="status" className="rounded-xl bg-accent p-3">{c[change]}</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      {([{ label: c.food, value: food, set: setFood, min: 10, step: 0.01 }, { label: c.gift, value: gift, set: setGift, min: 0, step: 0.01 }, { label: c.view, value: view, set: setView, min: 5, step: 1 }]).map((f) =>
        <label key={f.label} className="grid gap-1">{f.label}
          <input className="min-h-11 w-full rounded-lg border bg-background p-2" type="number" min={f.min} step={f.step} value={f.value} onChange={e => update(f.set, e.target.value)} />
        </label>)}
    </div>
    <dl className="grid grid-cols-2 gap-2">
      {[[c.budget, money(cap * 100)], [c.total, valid ? money(allocated) : "—"], [c.headroom, valid ? money(balance) : "—"], [c.arrive, valid ? String(Math.floor(end / 60)).padStart(2, "0") + ":" + String(end % 60).padStart(2, "0") : "—"]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd><bdi>{v}</bdi></dd></div>)}
    </dl>
    <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground" onClick={() => {setChecked(true); if (fits && !change) setBaseline(true);}}>{c.check}</button>
    {baseline && !change && <button type="button" className="min-h-11 rounded-xl border px-4" onClick={() => {setChange(changes[Math.floor(Math.random() * changes.length)]);setChecked(false);}}>{c.challenge}</button>}
    {checked && <p role="status">{!valid ? c.invalid : fits ? c.ok : [balance < 0 ? c.over : "", late ? c.late : ""].filter(Boolean).join(" ")}</p>}
    <details><summary>{c.sources}</summary><p>{c.ref}</p><ul>{(Object.keys(sources) as (keyof typeof sources)[]).map(k => <li key={k}><a className="underline" href={sources[k]} target="_blank" rel="noreferrer">{c[k]}</a></li>)}</ul></details>
  </section>;
}

