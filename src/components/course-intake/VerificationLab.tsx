import { useState } from "react";
import type { SupportedLocale } from "@/lib/locale/types";
import copy from "./verification-copy.json";

type Example = "photo" | "paper" | "film";

const exercises = {
  photo: { dates: ["2019-02-22", "1968-12-24"], expected: [1, 0, 0] },
  paper: { dates: ["03 / 06", "10 / 06"], expected: [0, 1, 1] },
  film: { dates: ["09 / 07", "04 / 07"], expected: [1, 2, 2] },
};

export function VerificationLab({ locale, example }: { locale: SupportedLocale; example: Example }) {
  const c = copy[locale];
  const [open, setOpen] = useState(false);
  const [second, setSecond] = useState(4);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [checked, setChecked] = useState(false);
  const fields = [c.date, c.context, c.limit];
  const hints = [c.dateHint, c.contextHint, c.limitHint];
  const exercise = exercises[example];
  const words = c[`${example}Options`];
  const options = [exercise.dates, words.slice(0, 3), words.slice(3)];
  const wrong = answers.findIndex((value, index) => Number(value) !== exercise.expected[index]);
  const feedback = answers.includes("") ? c.missing : wrong < 0 ? c.ok : hints[wrong];
  return <section className="space-y-4 rounded-2xl border bg-muted/30 p-4" aria-label={c.lab}>
    <h3 className="font-bold">{c.lab}</h3>
    <p><strong>{c.claim}</strong> · {c[`${example}Re`]}</p>
    <button type="button" aria-expanded={open} className="min-h-11 rounded-xl border bg-card px-4" onClick={() => setOpen(!open)}>{open ? c.repost : c.source}</button>
    {open && <div className="space-y-3 rounded-xl bg-card p-4">
      <strong>{c.original}</strong><p>{c[`${example}Src`]}</p>
      {example === "photo" && <a className="underline" href="https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/" target="_blank" rel="noreferrer">NASA · Apollo 8’s Iconic Earthrise</a>}
      {example === "film" && <label className="grid gap-2">{c.frame}
        <input type="range" min="0" max="11" value={second} onChange={e => setSecond(Number(e.target.value))} />
        <output className="rounded-lg bg-accent p-3"><bdi>{String(second).padStart(2,"0")} s</bdi> · {second < 3 ? c.slate : second < 8 ? c.curtain : c.reset}</output>
      </label>}
    </div>}
    {example === "paper" && <figure className="space-y-3 rounded-lg border-2 bg-accent p-4 text-center"><span aria-hidden="true">◆ • • •</span><figcaption>{open ? c.poster : c.posterCut}</figcaption></figure>}
    <div className="grid gap-3 md:grid-cols-3">{fields.map((field,i) => <label key={field} className="grid min-w-0 gap-1">{field}
      <select className="min-h-11 w-full rounded-lg border bg-background p-2" value={answers[i]} onChange={e => {setAnswers(answers.map((v,j) => i === j ? e.target.value : v));setChecked(false);}}>
        <option value="">{c.choose}</option>{options[i].map((item,k) => <option value={String(k)} key={item}>{item}</option>)}
      </select></label>)}</div>
    <button type="button" className="min-h-11 rounded-xl bg-primary px-4 text-primary-foreground" onClick={() => setChecked(true)}>{c.check}</button>
    {checked && <p role="status">{feedback}</p>}
  </section>;
}