import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SupportedLocale } from "@/lib/locale/types";

const words = {
  en: [
    "Analysis region",
    "Whole picture",
    "Mug area",
    "Analyse colour",
    "Dominant colour",
    "Try loading the picture again.",
    "red|blue|yellow|green|orange|grey|off-white|dark grey",
  ],
  "ar-MSA": [
    "منطقة التحليل",
    "الصورة كاملة",
    "منطقة الكوب",
    "حلّل اللون",
    "اللون الغالب",
    "جرّب تحميل الصورة مجددًا.",
    "أحمر|أزرق|أصفر|أخضر|برتقالي|رمادي|أبيض مائل للرمادي|رمادي داكن",
  ],
  "ar-EG": [
    "منطقة التحليل",
    "الصورة كلها",
    "منطقة الكوباية",
    "حلّل اللون",
    "اللون الغالب",
    "جرّب تحمّل الصورة تاني.",
    "أحمر|أزرق|أصفر|أخضر|برتقاني|رمادي|أبيض مائل للرمادي|رمادي غامق",
  ],
  "ar-Gulf": [
    "منطقة التحليل",
    "الصورة كاملة",
    "منطقة الكوب",
    "حلّل اللون",
    "اللون الغالب",
    "جرّب تحمّل الصورة مرة ثانية.",
    "أحمر|أزرق|أصفر|أخضر|برتقالي|رمادي|أبيض مائل للرمادي|رمادي غامق",
  ],
};
const palette = [
  [157, 37, 38],
  [64, 145, 186],
  [222, 188, 57],
  [55, 107, 69],
  [230, 117, 38],
  [148, 147, 142],
  [222, 221, 213],
  [49, 48, 48],
];
const distance = (a: number[], b: number[]) =>
  a.reduce((total, v, i) => total + (v - b[i]) ** 2, 0);
function nearest(colour: number[], candidates: number[][]) {
  const d = candidates.map((point) => distance(colour, point));
  return d.indexOf(Math.min(...d));
}
function dominant(pixels: Uint8ClampedArray) {
  const samples: number[][] = [];
  for (let i = 0; i < pixels.length; i += 28)
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  let centres = [samples[0], samples[Math.floor(samples.length / 2)], samples[samples.length - 1]],
    counts = [0, 0, 0];
  for (let pass = 0; pass < 7; pass++) {
    counts = [0, 0, 0];
    const sums = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (const sample of samples) {
      const j = nearest(sample, centres);
      counts[j]++;
      sample.forEach((v, k) => (sums[j][k] += v));
    }
    centres = sums.map((sum, i) => (counts[i] ? sum.map((v) => v / counts[i]) : centres[i]));
  }
  return centres[counts.indexOf(Math.max(...counts))].map(Math.round);
}
export function PictureColourLab({
  locale,
  resolveAsset,
}: {
  locale: SupportedLocale;
  resolveAsset: (id: string) => Promise<string>;
}) {
  const c = words[locale],
    canvas = useRef<HTMLCanvasElement>(null),
    request = useRef<AbortController | null>(null);
  const [region, setRegion] = useState("all"),
    [value, setValue] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => () => request.current?.abort(), []);
  async function analyse() {
    const work = new AbortController();
    request.current = work;
    setBusy(true);
    setValue("");
    try {
      const url = await resolveAsset("picture");
      const response = await fetch(url, {
        signal: work.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new Error();
      const image = await createImageBitmap(await response.blob());
      try {
        if (work.signal.aborted) return;
        const ctx = canvas.current?.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error();
        ctx.drawImage(image, 0, 0, 220, 220);
        const box: [number, number, number, number] =
          region === "all" ? [0, 0, 220, 220] : [47, 125, 35, 37];
        const rgb = dominant(ctx.getImageData(...box).data);
        if (region !== "all") {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "white";
          ctx.strokeRect(...box);
        }
        setValue(c[4] + " · " + c[6].split("|")[nearest(rgb, palette)]);
      } finally {
        image.close();
      }
    } catch {
      if (!work.signal.aborted) setValue(c[5]);
    } finally {
      if (!work.signal.aborted) setBusy(false);
    }
  }
  return (
    <div className="space-y-3">
      <label className="block">
        {c[0]}{" "}
        <select
          value={region}
          disabled={busy}
          onChange={(e) => {
            setRegion(e.target.value);
            setValue("");
            canvas.current?.getContext("2d")?.clearRect(0, 0, 220, 220);
          }}
        >
          <option value="all">{c[1]}</option>
          <option value="mug">{c[2]}</option>
        </select>
      </label>
      <Button type="button" variant="outline" disabled={busy} onClick={analyse}>
        {c[3]}
      </Button>
      <canvas
        className={value ? "block max-w-full" : "hidden"}
        ref={canvas}
        width={220}
        height={220}
        aria-label={c[0]}
      />
      <output aria-live="polite">{value}</output>
    </div>
  );
}
