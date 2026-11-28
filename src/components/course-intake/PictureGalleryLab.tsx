import { useEffect, useRef, useState } from "react";
import type { ActivityValues } from "@/lib/course-system/intake/use-activity-draft";
import type { SupportedLocale } from "@/lib/locale/types";
import type { LessonContent } from "./CurriculumContent";
import { Button } from "@/components/ui/button";
import { encodeWave } from "./encode-wave";

const copy = {
  "ar-EG": [
    "جهّز الوصف واسمعه",
    "اختار جملتين مختلفتين لكل صورة واكتب الدليل اللي شفته.",
    "اسمع الأوصاف للتلات صور لحد الآخر، وبعدها نزّل معرضك.",
    "نزّل معرضي",
    "معرضي الصوتي",
    "التحميل اتعطّل. جرّب تاني.",
    "جاري تجهيز الأصوات…",
    "حلّل اللون",
    "الصورة كلها",
    "منطقة الكوباية",
    "اللون الغالب",
    "منطقة التحليل",
  ],
  "ar-MSA": [
    "حضّر الوصف واستمع إليه",
    "اختر جملتين مختلفتين لكل صورة واكتب الدليل الذي رأيته.",
    "استمع إلى الأوصاف الثلاثة كاملة ثم نزّل معرضك.",
    "نزّل معرضي",
    "معرضي الصوتي",
    "تعذر تحميل الملفات. أعد المحاولة.",
    "يجري تجهيز الصوت…",
    "حلّل اللون",
    "الصورة كاملة",
    "منطقة الكوب",
    "اللون الغالب",
    "منطقة التحليل",
  ],
  "ar-Gulf": [
    "جهّز الوصف واسمعه",
    "اختر جملتين مختلفتين لكل صورة واكتب الدليل اللي شفته.",
    "اسمع وصف كل صورة للآخر وبعدها نزّل معرضك.",
    "نزّل معرضي",
    "معرضي الصوتي",
    "ما تحمّلت الملفات. جرّب مرة ثانية.",
    "جاري تجهيز الصوت…",
    "حلّل اللون",
    "الصورة كاملة",
    "منطقة الكوب",
    "اللون الغالب",
    "منطقة التحليل",
  ],
  en: [
    "Prepare and listen",
    "Choose two different sentences per picture and write the evidence you saw.",
    "Listen to all three descriptions to the end, then download your gallery.",
    "Download my gallery",
    "My audio gallery",
    "Files could not be loaded. Try again.",
    "Preparing audio…",
    "Analyse colour",
    "Whole picture",
    "Mug area",
    "Dominant colour",
    "Analysis region",
  ],
};
type Props = {
  locale: SupportedLocale;
  lesson: LessonContent;
  values: ActivityValues;
  resolveAsset: (id: string) => Promise<string>;
};
type Card = { name: string; image: string; audio: string; text: string; evidence: string };
async function readAsset(id: string, resolve: Props["resolveAsset"], signal: AbortSignal) {
  const url = await resolve(id);
  const response = await fetch(url, { signal, credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error("Asset unavailable");
  return response.blob();
}
function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
function galleryFile(cards: Card[], title: string, locale: SupportedLocale) {
  const doc = document.implementation.createHTMLDocument(title);
  doc.documentElement.lang = locale === "en" ? "en" : "ar";
  doc.documentElement.dir = locale === "en" ? "ltr" : "rtl";
  const charset = doc.createElement("meta");
  charset.setAttribute("charset", "utf-8");
  doc.head.prepend(charset);
  const viewport = doc.createElement("meta");
  viewport.name = "viewport";
  viewport.content = "width=device-width, initial-scale=1";
  doc.head.append(viewport);
  const style = doc.createElement("style");
  style.textContent =
    "body{font:1.1rem/1.6 system-ui;max-width:48rem;margin:auto;padding:1rem}article{border-block-end:1px solid #ccc;padding-block:1rem}img,audio{display:block;width:min(100%,26rem);margin-block:1rem}p{white-space:pre-wrap;overflow-wrap:anywhere}";
  doc.head.append(style);
  const main = doc.createElement("main");
  doc.body.append(main);
  const heading = doc.createElement("h1");
  heading.textContent = title;
  main.append(heading);
  for (const card of cards) {
    const article = doc.createElement("article"),
      h = doc.createElement("h2"),
      image = doc.createElement("img"),
      audio = doc.createElement("audio"),
      text = doc.createElement("p"),
      note = doc.createElement("p");
    h.textContent = card.name;
    image.src = card.image;
    image.alt = card.text;
    audio.controls = true;
    audio.src = card.audio;
    audio.setAttribute("aria-label", card.name);
    text.textContent = card.text;
    note.textContent = card.evidence;
    article.append(h, image, audio, text, note);
    main.append(article);
  }
  return new Blob(["<!doctype html>", doc.documentElement.outerHTML], {
    type: "text/html;charset=utf-8",
  });
}

export function PictureGalleryLab({ locale, lesson, values, resolveAsset }: Props) {
  const words = copy[locale],
    final = lesson.id === "KAI-02-L05";
  const requested = final ? ["boat", "desk", "bag"] : ["desk"];
  const cards = requested.map((subject) => {
    const picture = lesson.assets.find(
      (a) =>
        a.type === "image" &&
        a.id === (subject === "boat" || !final ? "picture" : "figure-" + subject),
    );
    const lines = [1, 2].map((i) => {
      const choice = values[subject + "-line-" + i];
      return typeof choice === "string" && /^p[1-3]$/.test(choice)
        ? lesson.assets.find(
            (a) => a.id === subject + "-phrase-" + choice.slice(1) && a.type === "file",
          )
        : undefined;
    });
    return { picture, lines, evidence: String(values[subject + "-basis"] ?? "").trim() };
  });
  const selection = JSON.stringify(
    cards.map((c) => [c.picture?.id, c.lines.map((l) => l?.id), c.evidence]),
  );
  const [result, setResult] = useState<{ selection: string; cards: Card[] } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [heard, setHeard] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setResult(null);
    setBusy(false);
    setError("");
    setHeard([]);
    return () => controller.current?.abort();
  }, [selection]);
  async function prepare() {
    if (busy) return;
    if (
      cards.some(
        (c) =>
          !c.picture ||
          !c.lines[0] ||
          !c.lines[1] ||
          c.lines[0].id === c.lines[1].id ||
          !c.evidence,
      )
    ) {
      setError(words[1]);
      return;
    }
    const job = new AbortController();
    controller.current = job;
    setBusy(true);
    setError("");
    setHeard([]);
    setResult(null);
    try {
      const decoder = new OfflineAudioContext(1, 1, 24000);
      const outputs = await Promise.all(
        cards.map(async (c) => {
          const picture = c.picture!,
            lines = c.lines.map((l) => l!);
          const [image, ...clips] = await Promise.all(
            [picture, ...lines].map((a) => readAsset(a.id, resolveAsset, job.signal)),
          );
          const [first, second] = await Promise.all(
            clips.map(async (clip) => decoder.decodeAudioData(await clip.arrayBuffer())),
          );
          const gap = 4800,
            samples = new Float32Array(first.length + gap + second.length);
          samples.set(first.getChannelData(0));
          samples.set(second.getChannelData(0), first.length + gap);
          return {
            name: picture.label,
            image: await dataUrl(image),
            audio: await dataUrl(encodeWave(samples, 24000)),
            text: lines.map((l) => l.label).join(" "),
            evidence: c.evidence,
          };
        }),
      );
      if (!job.signal.aborted) setResult({ selection, cards: outputs });
    } catch {
      if (!job.signal.aborted) setError(words[5]);
    } finally {
      if (!job.signal.aborted) setBusy(false);
    }
  }
  const current = result?.selection === selection ? result.cards : [];
  function download() {
    const link = document.createElement("a"),
      url = URL.createObjectURL(galleryFile(current, words[4], locale));
    link.href = url;
    link.download = "KAI-02-" + locale + "-gallery.html";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" disabled={busy} onClick={prepare}>
        {busy ? words[6] : words[0]}
      </Button>
      {error && <p role="status">{error}</p>}
      {current.map((card) => (
        <figure key={card.name}>
          <figcaption>{card.text}</figcaption>
          <audio
            className="w-full max-w-md"
            controls
            preload="metadata"
            aria-label={card.name}
            src={card.audio}
            onEnded={() => setHeard((prev) => [...new Set([...prev, card.name])])}
          />
        </figure>
      ))}
      {final && current.length === 3 && (
        <>
          <p>{words[2]}</p>
          <Button type="button" onClick={download} disabled={heard.length !== 3}>
            {words[3]}
          </Button>
        </>
      )}
    </div>
  );
}
