import { useEffect, useRef, useState } from "react";
import type { LessonContent } from "./CurriculumContent";

type Entry = {
  photo: string;
  recording: string;
  start: number;
  end: number;
  claim: string;
  alias: string;
};
type Packet = {
  id: string;
  photo: string;
  recording: string;
  family: boolean;
  year: number | null;
};
type Work = {
  entries: Entry[];
  history: Entry[];
  withdrawn: string[];
  packets: Record<string, Packet>;
};
const empty = (): Work => ({ entries: [], history: [], withdrawn: [], packets: {} });

function readWork(key: string): Work {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      value &&
      Array.isArray(value.entries) &&
      Array.isArray(value.history) &&
      Array.isArray(value.withdrawn) &&
      value.packets
    )
      return value;
  } catch {
    /* The form remains usable in memory. */
  }
  return empty();
}

function asData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("FILE_READ"));
    reader.readAsDataURL(blob);
  });
}
async function fetchData(url: string) {
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) throw new Error("FILE_UNAVAILABLE");
  return asData(await response.blob());
}
function saveFile(name: string, body: Blob) {
  const url = URL.createObjectURL(body);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export function ArchiveWorkspace({
  lesson,
  locale,
  scope,
  resolveAsset,
}: {
  lesson: LessonContent;
  locale: string;
  scope: string;
  resolveAsset: (id: string) => Promise<string>;
}) {
  const t = (english: string, arabic: string) => (locale === "en" ? english : arabic);
  const objects = lesson.sections.flatMap((section) => {
    const match = /^archive-record-(family|keeper)-([0-9]+)$/.exec(section.id);
    if (!match) return [];
    const image = lesson.assets.find((asset) => asset.id === "photo-" + match[2]);
    const film = lesson.assets.find(
      (asset) => asset.id === section.assets[0] && asset.type === "video",
    );
    if (!image || !film?.url) return [];
    return [
      {
        number: match[2],
        photo: "P" + match[2],
        recording: "R" + match[2],
        consent: "C" + match[2],
        family: match[1] === "family",
        image,
        film,
        copy: lesson.assets.find((a) => a.id === "copy-" + match[2] && a.type === "video"),
        caption: section.paragraphs[0] || image.label,
        words: section.paragraphs[1] || "",
      },
    ];
  });
  const storageKey = "masaarat:archive:" + scope;
  const [work, setWork] = useState(() => readWork(storageKey));
  const activeLesson = lesson.id;
  const defaultPhoto = lesson.sections
    .find((s) => s.id === "source")
    ?.paragraphs[0]?.match(/^P\d+/)?.[0];
  const [photo, setPhoto] = useState(
    work.packets[activeLesson]?.photo || defaultPhoto || objects[0]?.photo,
  );
  const selected = objects.find((o) => o.photo === photo) || objects[0];
  const [recording, setRecording] = useState(
    work.entries.find((e) => e.photo === photo)?.recording || selected?.recording,
  );
  const witness = objects.find((o) => o.recording === recording) || selected;
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [claim, setClaim] = useState("");
  const [alias, setAlias] = useState("");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState(true);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [checksum, setChecksum] = useState("");
  const [imageRequest, setImageRequest] = useState(0);
  const packet = work.packets[activeLesson];
  const sourceVideo = useRef<HTMLVideoElement>(null);
  const stopTime = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    const old = work.entries.find((e) => e.photo === photo);
    setRecording(old?.recording || selected?.recording);
    setStart(old ? String(old.start) : "");
    setEnd(old ? String(old.end) : "");
    setClaim(old?.claim || "");
    setAlias(old?.alias || "");
  }, [photo, selected?.recording, work.entries]);
  useEffect(() => {
    let mounted = true;
    setImageUrl("");
    if (selected && imageRequest) {
      resolveAsset(selected.image.id)
        .then((url) => {
          if (mounted) setImageUrl(url);
        })
        .catch(() => {
          if (mounted)
            setMessage(
              t(
                "Reopen the protected picture to retry.",
                "أعد فتح الصورة المحمية للمحاولة مجددًا.",
              ),
            );
        });
    }
    return () => {
      mounted = false;
    };
  }, [selected?.image.id, imageRequest, resolveAsset]);
  if (!selected || !witness) return null;
  const commit = (next: Work) => {
    setWork(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setMessage(
        t(
          "Browser storage is unavailable. Export this session's evidence.",
          "تعذّر الحفظ في المتصفّح. صدّر أدلة الجلسة.",
        ),
      );
    }
  };
  const visible = (o: typeof selected) =>
    o.family && !(packet?.photo === o.photo && !packet.family);
  const familyRows = objects.filter(visible).map((o) => {
    const row = work.entries.find((e) => e.photo === o.photo);
    const audio = row ? objects.find((x) => x.recording === row.recording) : o;
    const usable = audio && visible(audio) && !work.withdrawn.includes(audio.recording);
    return {
      photo: o.photo,
      title: o.caption,
      consent: o.consent,
      ...(usable
        ? {
            recording: audio.recording,
            recordingConsent: audio.consent,
            transcript: audio.words,
            ...(row ? { start: row.start, end: row.end, claim: row.claim, alias: row.alias } : {}),
          }
        : {}),
    };
  });
  const keeperRows = objects.map((o) => {
    const row = work.entries.find((e) => e.photo === o.photo),
      audio = objects.find((x) => x.recording === row?.recording) || o;
    return {
      ...row,
      photo: o.photo,
      title: o.caption,
      recording: audio.recording,
      transcript: audio.words,
    };
  });
  const results = (family ? familyRows : keeperRows).filter((row) =>
    Object.values(row).join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  const form = "w-full rounded-lg border bg-background p-2";
  const button =
    "min-h-11 rounded-lg border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted";
  const saveRow = () => {
    const a = Number(start),
      b = Number(end);
    const limit = sourceVideo.current?.duration ?? NaN;
    if (
      !start.trim() ||
      !end.trim() ||
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      a < 0 ||
      b <= a ||
      (limit > 0 && b > limit) ||
      !claim.trim()
    ) {
      setMessage(
        t(
          "Enter a supported claim and a valid interval inside the recording.",
          "اكتب العبارة التي يسندها الصوت وفترة صحيحة داخل التسجيل.",
        ),
      );
      return;
    }
    const row = { photo, recording, start: a, end: b, claim: claim.trim(), alias: alias.trim() };
    const old = work.entries.find((e) => e.photo === photo);
    setMessage(
      t(
        "Relationship recorded. Replay the named interval to check your claim.",
        "سُجّل الرابط. أعد سماع الفترة المحددة للتحقق من العبارة.",
      ),
    );
    commit({
      ...work,
      entries: [...work.entries.filter((e) => e.photo !== photo), row],
      history: old ? [...work.history, old] : work.history,
    });
  };
  const exportFamily = async () => {
    setBusy(true);
    try {
      const doc = document.implementation.createHTMLDocument(
        t("Family listening copy", "نسخة الاستماع العائلية"),
      );
      doc.documentElement.lang = locale === "en" ? "en" : "ar";
      doc.documentElement.dir = locale === "en" ? "ltr" : "rtl";
      const meta = doc.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width,initial-scale=1";
      doc.head.append(meta);
      const style = doc.createElement("style");
      style.textContent =
        "body{max-width:45em;margin:auto;padding:1em;color:#244456;font:18px/1.6 system-ui}img,video{max-width:100%;max-height:18em;display:block}article{border-top:1px solid #b8c9ce;margin-top:1em;padding-top:1em}input{font:inherit}";
      doc.head.append(style);
      const title = doc.createElement("h1");
      title.textContent = doc.title;
      doc.body.append(title);
      const label = doc.createElement("label");
      label.textContent = t("Search by word or identifier ", "ابحث بكلمة أو معرّف ");
      const search = doc.createElement("input");
      search.type = "search";
      label.append(search);
      doc.body.append(label);
      for (const row of familyRows) {
        const object = objects.find((o) => o.photo === row.photo)!;
        const article = doc.createElement("article"),
          heading = doc.createElement("h2"),
          img = doc.createElement("img");
        heading.textContent = row.photo + " · " + row.title;
        img.alt = row.title;
        img.src = await fetchData(await resolveAsset(object.image.id));
        article.append(heading, img);
        if (row.recording) {
          const sound = objects.find((o) => o.recording === row.recording);
          if (!sound?.copy?.url) throw new Error("SOURCE_UNAVAILABLE");
          const media = doc.createElement("video");
          media.controls = true;
          media.preload = "metadata";
          media.src = await fetchData(sound.copy.url);
          if (row.start != null && row.end != null) media.src += "#t=" + row.start + "," + row.end;
          const details = doc.createElement("details"),
            summary = doc.createElement("summary"),
            words = doc.createElement("p");
          summary.textContent = row.recording + " · " + row.recordingConsent;
          words.textContent = row.transcript || "";
          words.dir = "auto";
          details.append(summary, words);
          const note = doc.createElement("p");
          note.textContent = [
            row.alias,
            row.claim,
            row.start == null ? "" : row.start + "–" + row.end + " s",
          ]
            .filter(Boolean)
            .join(" · ");
          article.append(note, media, details);
        }
        doc.body.append(article);
      }
      const script = doc.createElement("script");
      script.textContent =
        'document.querySelector("input").oninput=function(){for(const a of document.querySelectorAll("article"))a.hidden=!a.textContent.toLowerCase().includes(this.value.trim().toLowerCase())}';
      doc.body.append(script);
      if (active.current)
        saveFile(
          "family-listening-copy.html",
          new Blob(["<!doctype html>" + doc.documentElement.outerHTML], {
            type: "text/html;charset=utf-8",
          }),
        );
    } catch {
      if (active.current)
        setMessage(
          t(
            "A source could not be loaded. Open the protected file, then retry the export.",
            "تعذّر تحميل أحد الأصول. افتح الملف المحمي ثم أعد التصدير.",
          ),
        );
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const draw = () => {
    if (packet) return;
    const r = crypto.getRandomValues(new Uint32Array(3)),
      index = r[0] % objects.length,
      o = objects[index];
    const wrong = r[1] % 2 === 0 && objects.length > 1;
    const p = {
      id: crypto.randomUUID(),
      photo: o.photo,
      recording: wrong ? objects[(index + 1) % objects.length].recording : o.recording,
      family: o.family && r[2] % 2 === 0,
      year: wrong ? null : 1988,
    };
    commit({ ...work, packets: { ...work.packets, [activeLesson]: p } });
    setPhoto(o.photo);
  };
  return (
    <details
      onToggle={(e) => setOpened(e.currentTarget.open)}
      className="my-5 space-y-4 rounded-2xl border bg-muted/30 p-4"
    >
      <summary className="cursor-pointer font-bold">
        {t("Open archive workspace", "افتح مساحة عمل الأرشيف")}
      </summary>
      {lesson.sections.some((s) => s.id === "independent-packet") && (
        <div className="space-y-2">
          <button type="button" className={button} onClick={draw} disabled={!!packet}>
            {t("Draw an independent case", "اسحب حالة مستقلة")}
          </button>
          {packet && (
            <p>
              {t("Case", "الحالة")} <bdi>{packet.id}</bdi> ·{" "}
              <bdi>
                {packet.photo} ↔ {packet.recording}
              </bdi>{" "}
              · {packet.family ? t("Family", "العائلة") : t("Keeper only", "الأمين وحده")} ·{" "}
              {t("Proposed year", "السنة المقترحة")} {packet.year ?? t("unknown", "مجهولة")}
            </p>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {t("Photograph", "الصورة")}
          <select className={form} value={photo} onChange={(e) => setPhoto(e.target.value)}>
            {objects.map((o) => (
              <option key={o.photo}>{o.photo}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Recording", "التسجيل")}
          <select className={form} value={recording} onChange={(e) => setRecording(e.target.value)}>
            {objects.map((o) => (
              <option key={o.recording}>{o.recording}</option>
            ))}
          </select>
        </label>
      </div>
      <p>{selected.caption}</p>
      <button type="button" className={button} onClick={() => setImageRequest((x) => x + 1)}>
        {t("Open protected photograph", "افتح الصورة المحمية")}
      </button>
      {imageUrl && (
        <figure>
          <img
            src={imageUrl}
            alt={selected.image.label}
            className="max-h-64 max-w-full rounded-xl"
          />
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {t("Open image file to save a copy", "افتح ملف الصورة لحفظ نسخة")}
          </a>
        </figure>
      )}
      <p>
        <bdi>{witness.consent}</bdi> ·{" "}
        {witness.family
          ? t("Keeper and invited family", "الأمين والعائلة المدعوّة")
          : t("Keeper only", "الأمين وحده")}
      </p>
      {opened && witness.copy?.url && (
        <video
          ref={sourceVideo}
          key={witness.recording}
          className="aspect-video w-full rounded-xl"
          controls
          playsInline
          preload="metadata"
          aria-label={witness.film.label}
          src={witness.copy.url}
          onTimeUpdate={(e) => {
            if (stopTime.current !== null && e.currentTarget.currentTime >= stopTime.current) {
              e.currentTarget.pause();
              stopTime.current = null;
            }
          }}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          onClick={() => {
            if (sourceVideo.current) setStart(sourceVideo.current.currentTime.toFixed(2));
          }}
        >
          {t("Mark start", "حدّد البداية")}
        </button>
        <button
          type="button"
          className={button}
          onClick={() => {
            if (sourceVideo.current) setEnd(sourceVideo.current.currentTime.toFixed(2));
          }}
        >
          {t("Mark end", "حدّد النهاية")}
        </button>
        <button
          type="button"
          className={button}
          onClick={async () => {
            const v = sourceVideo.current,
              a = Number(start),
              b = Number(end);
            if (
              !v ||
              !start.trim() ||
              !end.trim() ||
              !Number.isFinite(a) ||
              !Number.isFinite(b) ||
              a < 0 ||
              b <= a ||
              b > v.duration
            ) {
              setMessage(
                t("Check the interval against the recording.", "راجع الفترة داخل زمن التسجيل."),
              );
              return;
            }
            v.currentTime = a;
            stopTime.current = b;
            try {
              await v.play();
            } catch {
              setMessage(
                t("Press play to replay the interval.", "اضغط التشغيل لإعادة سماع المقطع."),
              );
            }
          }}
        >
          {t("Replay interval", "أعد سماع المقطع")}
        </button>
      </div>
      <details>
        <summary>
          {t("Compare the source words after listening", "قارن بالكلمات الأصلية بعد الاستماع")}
        </summary>
        <p lang="ar" dir="rtl">
          {witness.words}
        </p>
      </details>
      <div className="grid grid-cols-2 gap-3">
        <label>
          {t("From, seconds", "من، بالثواني")}
          <input
            className={form}
            type="number"
            min="0"
            step="0.01"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          {t("To, seconds", "إلى، بالثواني")}
          <input
            className={form}
            type="number"
            min="0"
            step="0.01"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        {t("Claim and source of uncertainty", "العبارة ومصدر الشك")}
        <textarea
          className={form}
          value={claim}
          maxLength={3000}
          onChange={(e) => setClaim(e.target.value)}
        />
      </label>
      <label className="block">
        {t("Search alias", "اسم بديل للبحث")}
        <input
          className={form}
          value={alias}
          maxLength={200}
          onChange={(e) => setAlias(e.target.value)}
        />
      </label>
      <button type="button" className={button} onClick={saveRow}>
        {t("Save evidence link", "احفظ رابط الدليل")}
      </button>
      <details>
        <summary>{t("Compare local file fingerprints", "قارن بصمات ملفات محلية")}</summary>
        <input
          className={form}
          type="file"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            try {
              const lines = await Promise.all(
                files.map(
                  async (f) =>
                    f.name +
                    " " +
                    Array.from(
                      new Uint8Array(await crypto.subtle.digest("SHA-256", await f.arrayBuffer())),
                      (x) => x.toString(16).padStart(2, "0"),
                    ).join(""),
                ),
              );
              setChecksum(lines.join("\n"));
            } catch {
              setChecksum(t("Could not read file", "تعذّرت قراءة الملف"));
            }
          }}
        />
        <pre className="whitespace-pre-wrap break-all" dir="ltr">
          {checksum}
        </pre>
      </details>
      <label className="block">
        <input
          type="checkbox"
          checked={work.withdrawn.includes(witness.recording)}
          onChange={(e) =>
            commit({
              ...work,
              withdrawn: e.target.checked
                ? [...work.withdrawn, witness.recording]
                : work.withdrawn.filter((x) => x !== witness.recording),
            })
          }
        />{" "}
        {t(
          "Simulate withdrawing family access to this recording and transcript",
          "حاكِ سحب إذن العائلة لسماع هذا التسجيل وقراءة تفريغه",
        )}
      </label>
      <label className="block">
        {t("Search the catalogue", "ابحث في الفهرس")}
        <input
          type="search"
          className={form}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="block">
        {t("Preview audience", "جمهور المعاينة")}
        <select
          value={family ? "family" : "keeper"}
          className={form}
          onChange={(e) => setFamily(e.target.value === "family")}
        >
          <option value="family">{t("Family", "العائلة")}</option>
          <option value="keeper">{t("Keeper", "الأمين")}</option>
        </select>
      </label>
      <ul>
        {results.map((o) => (
          <li key={o.photo}>
            {o.photo} · {o.title}{" "}
            {o.recording && (
              <span>
                {" "}
                · {o.recording} · {o.transcript}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={button}
          onClick={() =>
            saveFile(
              "family-catalogue.json",
              new Blob([JSON.stringify(familyRows, null, 2)], { type: "application/json" }),
            )
          }
        >
          {t("Export permitted family catalogue", "صدّر فهرس العائلة المسموح به")}
        </button>
        <button
          type="button"
          className={button}
          onClick={() =>
            saveFile(
              "private-evidence.json",
              new Blob(
                [
                  JSON.stringify(
                    { lesson: activeLesson, entries: work.entries, history: work.history, packet },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              ),
            )
          }
        >
          {t("Download my private editable record", "نزّل سجلي الخاص القابل للتحرير")}
        </button>
      </div>
      <button type="button" className={button} disabled={busy} onClick={exportFamily}>
        {busy
          ? t("Preparing family copy…", "جارٍ إعداد نسخة العائلة…")
          : t("Download family listening copy", "نزّل نسخة الاستماع العائلية")}
      </button>
      <output aria-live="polite">{message}</output>
    </details>
  );
}
