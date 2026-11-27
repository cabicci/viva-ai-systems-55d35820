import { useState } from "react";
import type { FormEvent } from "react";
import type { SupportedLocale } from "@/lib/locale/types";
import { tableCopy } from "./lantern-market-copy";

type Round = { a: number; b: number; gainA: number; gainB: number };
const bids = [1, 2, 3, 4];
const action =
  "min-h-11 rounded-xl border border-border bg-card px-4 py-2 font-bold hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

export function LanternMarketTable({ locale }: { locale: SupportedLocale }) {
  const t = tableCopy[locale];
  const [history, setHistory] = useState<Round[]>([]);
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState("");
  const round = history.length + 1;
  const finished = history.length === 4;
  const totalA = history.reduce((sum, row) => sum + row.gainA, 0);
  const totalB = history.reduce((sum, row) => sum + row.gainB, 0);
  const player = passed ? "B" : "A";
  const choose = !finished && (a === null || (passed && b === null));
  const available = bids.filter((bid) => !history.some((row) => (passed ? row.b : row.a) === bid));

  function clearRound() {
    setA(null);
    setB(null);
    setPassed(false);
    setError("");
  }
  function score(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (a === null || b === null || finished) return;
    const gainA = a > b ? round : 0;
    const gainB = b > a ? round : 0;
    const form = event.currentTarget;
    const first = (form.elements.namedItem("gainA") as HTMLInputElement).valueAsNumber;
    const second = (form.elements.namedItem("gainB") as HTMLInputElement).valueAsNumber;
    if (first !== gainA || second !== gainB) {
      setError(a === b ? t.tie : t.tryAgain);
      return;
    }
    setHistory([...history, { a, b, gainA, gainB }]);
    clearRound();
  }

  return (
    <details
      className="rounded-2xl border border-border bg-card p-4 sm:p-6"
      data-testid="lantern-market-table"
    >
      <summary className="min-h-11 cursor-pointer text-lg font-bold text-foreground">
        {t.title}
      </summary>
      <p className="my-3 text-muted-foreground">{t.how}</p>
      <div className="space-y-4 rounded-xl bg-muted p-4">
        {!finished && (
          <h3 className="font-bold">
            {t.stall} · {round}
          </h3>
        )}
        <p aria-live="polite" data-testid="market-status">
          {finished ? (
            totalA === totalB ? (
              t.shared
            ) : (
              t.winner + " " + (totalA > totalB ? "A" : "B")
            )
          ) : choose ? (
            t.turn + " " + player
          ) : !passed ? (
            t.pass
          ) : (
            <bdi>
              A {a} · B {b}
            </bdi>
          )}
        </p>
        {choose && (
          <div className="flex flex-wrap gap-2">
            {available.map((bid) => (
              <button
                key={bid}
                type="button"
                className={action}
                onClick={() => (passed ? setB(bid) : setA(bid))}
              >
                {bid}
              </button>
            ))}
          </div>
        )}
        {!finished && a !== null && !passed && (
          <button type="button" className={action} onClick={() => setPassed(true)}>
            {t.ready}
          </button>
        )}
        {a !== null && b !== null && (
          <form onSubmit={score} className="space-y-3">
            <fieldset className="flex flex-wrap gap-3">
              <legend className="mb-2 font-semibold">{t.earned}</legend>
              {["A", "B"].map((seat) => (
                <label key={seat} className="flex items-center gap-2">
                  {seat}
                  <input
                    type="number"
                    name={"gain" + seat}
                    required
                    min={0}
                    max={4}
                    step={1}
                    className="min-h-11 w-16 rounded-lg border border-border bg-card px-2"
                  />
                </label>
              ))}
            </fieldset>
            <button type="submit" className={action}>
              {t.submit}
            </button>
            {error && (
              <p role="alert" className="font-semibold">
                {error}
              </p>
            )}
          </form>
        )}
        {history.length > 0 && (
          <>
            <p aria-live="polite">
              {t.logged}{" "}
              <bdi>
                A {totalA} · B {totalB}
              </bdi>
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr>
                    {t.columns.map((column) => (
                      <th key={column} scope="col" className="p-1">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {[i + 1, row.a, row.b, row.gainA, row.gainB].map((value, j) => (
                        <td key={j} className="p-1">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {finished && (
          <button
            type="button"
            className={action}
            onClick={() => {
              setHistory([]);
              clearRound();
            }}
          >
            {t.reset}
          </button>
        )}
      </div>
    </details>
  );
}
