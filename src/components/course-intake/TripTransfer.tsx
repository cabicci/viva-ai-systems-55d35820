import { useEffect, useState } from "react";
import { transferCopy } from "./trip-transfer-copy";
import type { SupportedLocale } from "@/lib/locale/types";

type FirstPlan = { route: string; budget: string; twist: number };
export function TripTransfer({ locale, storageKey }: { locale: SupportedLocale; storageKey: string }) {
  const c = transferCopy[locale];
  const [route, setRoute] = useState("");
  const [budget, setBudget] = useState("");
  const [first, setFirst] = useState<FirstPlan | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved && typeof saved.route === "string" && typeof saved.budget === "string" &&
        Number.isInteger(saved.twist) && saved.twist >= 0 && saved.twist < c.twists.length) setFirst(saved);
    } catch { /* The exercise also works when local storage is unavailable. */ }
  }, [storageKey, c.twists.length]);
  function reveal() {
    if (!route.trim() || !budget.trim()) { setMissing(true); return; }
    const plan = { route: route.trim(), budget: budget.trim(), twist: Math.floor(Math.random() * c.twists.length) };
    setFirst(plan);
    try { localStorage.setItem(storageKey, JSON.stringify(plan)); } catch { /* Keep the current session usable. */ }
  }
  return <section className="space-y-3 rounded-xl border p-4">
    <h3 className="font-bold">{c.title}</h3><p>{c.brief}</p>
    <label className="block">{c.route}<textarea className="block w-full rounded border p-2" value={first?.route ?? route} readOnly={!!first} onChange={e=>setRoute(e.target.value)}/></label>
    <label className="block">{c.budget}<textarea className="block w-full rounded border p-2" value={first?.budget ?? budget} readOnly={!!first} onChange={e=>setBudget(e.target.value)}/></label>
    {first ? <p role="status" className="rounded bg-accent p-3">{c.twists[first.twist]}</p> :
      <><button className="min-h-11 rounded bg-primary px-3 text-primary-foreground" type="button" onClick={reveal}>{c.draw}</button>{missing && <p role="status">{c.missing}</p>}</>}
  </section>;
}

