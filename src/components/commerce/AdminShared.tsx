import type { ReactNode } from "react";
import type { CommerceCopy } from "@/lib/commerce/copy";
import { Button } from "@/components/ui/button";
export type RunCommand = (action: string, data: unknown) => Promise<unknown>;
export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="min-h-11 w-full rounded-md border bg-background px-3"
        type={type}
        value={value}
        required={required}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (string | readonly [string, string])[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select
        className="min-h-11 rounded-md border bg-background px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((x) => {
          const [v, text] = typeof x === "string" ? [x, x] : x;
          return (
            <option key={v} value={v}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
}
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
export function Save({ w, busy }: { w: CommerceCopy; busy: boolean }) {
  return (
    <Button type="submit" disabled={busy}>
      {w.save}
    </Button>
  );
}
