import { useEffect, useRef, useState } from "react";

type Props = {
  scope: string;
  lesson: string;
  locale: string;
  resolveAsset: (id: string) => Promise<string>;
};
const clips = ["clip-1", "clip-2", "clip-3", "clip-4"];
const stems = ["mira", "hadi", "ambience", "foley"];
type Guess = { id: string; voice: string; place: string; cue: string };
type Attempt = { date: string; familiar: string; answers: Guess[] };
type Talk = (english: string, msa: string, egyptian?: string, gulf?: string) => string;
function download(name: string, blob: Blob) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 3000);
}
function readAttempts(key: string): Attempt[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter((x) => x && Array.isArray(x.answers) && x.answers.length === 4)
      : [];
  } catch {
    return [];
  }
}
const button = "rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold";
const control = "block mt-1 w-full min-w-0 rounded-md border border-border bg-background p-2";
function Listening({ scope, locale, resolveAsset, t }: Props & { t: Talk }) {
  const key = "audio-stories:blind:" + scope;
  const [history, setHistory] = useState<Attempt[]>(() => readAttempts(key));
  const [sealed, setSealed] = useState(history.length > 0);
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function open() {
    setBusy(true);
    setNotice("");
    try {
      const next = await Promise.all(["ref-a", "ref-b", ...clips].map(resolveAsset));
      if (mounted.current) setUrls(next);
    } catch {
      if (mounted.current)
        setNotice(t("Audio did not load. Try again.", "تعذّر تحميل الصوت. حاول مجددًا."));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function exportRecord(record: Attempt) {
    download(
      "first-listening-" + locale + ".json",
      new Blob(
        [
          JSON.stringify(
            { locale, edition: scope.split(":").slice(-2).join(":"), ...record },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
  }
  return (
    <section className="min-w-0 space-y-3" aria-label={t("Blind listening", "الاستماع المجهّل")}>
      <h3 className="font-bold">
        {t(
          "Blind listening",
          "الاستماع المجهّل",
          "اختبار السماع من غير تلميحات",
          "اختبار السماع من غير تلميحات",
        )}
      </h3>
      {sealed && history.length ? (
        <>
          <p>
            {t(
              "Your first responses are locked. Export them for the facilitator to compare with the private key.",
              "ثُبّتت إجابات الاستماع. صدّرها ليقارنها مدير الاختبار بالمفتاح الخاص.",
            )}
          </p>
          <button
            type="button"
            className={button}
            onClick={() => exportRecord(history[history.length - 1])}
          >
            {t("Export responses", "نزّل الإجابات")}
          </button>
          <button
            type="button"
            className={button}
            onClick={() => {
              setSealed(false);
              setUrls([]);
              setNotice("");
            }}
          >
            {t("Begin a separate trial", "ابدأ محاولة مستقلة")}
          </button>
        </>
      ) : (
        <>
          <p>
            {t(
              "Listen to references A and B, then the four numbered clips. For each, choose a voice and write a place and an audible clue. You may answer unsure. Keep other lesson materials closed during this trial.",
              "استمع إلى المرجعين A وB ثم إلى المقاطع الأربعة. حدّد الصوت واكتب المكان ودليلًا مسموعًا لكل مقطع. يُقبَل «غير متأكد». أبقِ مواد الدرس الأخرى مغلقة خلال المحاولة.",
              "اسمع المرجعين A وB وبعدهم الأربع مقاطع. اختار الصوت واكتب المكان ودليل سمعته. ينفع تقول مش متأكد. اقفل باقي مواد الدرس لحد ما تخلص.",
              "اسمع المرجعين A وB وعقب المقاطع الأربعة. حدّد الصوت واكتب المكان ودليل سمعته. تقدر تقول مب متأكّد. خلّ باقي مواد الدرس مسكّرة لين تخلّص.",
            )}
          </p>
          <button type="button" className={button} onClick={open} disabled={busy}>
            {t(
              urls.length ? "Refresh audio links" : "Load anonymous audio",
              urls.length ? "جدّد روابط الصوت" : "حمّل المقاطع المجهّلة",
            )}
          </button>
          {urls.length === 6 && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                const attempt: Attempt = {
                  date: new Date().toISOString(),
                  familiar: String(fields.get("familiar")),
                  answers: clips.map((id) => ({
                    id,
                    voice: String(fields.get(id + "voice")),
                    place: String(fields.get(id + "place")).trim(),
                    cue: String(fields.get(id + "cue")).trim(),
                  })),
                };
                if (attempt.answers.some((a) => !a.place || !a.cue)) {
                  setNotice(
                    t(
                      "Enter a place and a clue, or write unsure.",
                      "اكتب المكان والدليل أو اذكر أنك غير متأكد.",
                    ),
                  );
                  return;
                }
                const updated = [...history, attempt];
                setHistory(updated);
                setSealed(true);
                try {
                  sessionStorage.setItem(key, JSON.stringify(updated));
                  setNotice("");
                } catch {
                  setNotice(
                    t(
                      "Session storage is unavailable. Export your responses now.",
                      "تعذّر حفظ الجلسة. نزّل إجاباتك الآن.",
                    ),
                  );
                }
              }}
            >
              {["A", "B"].map((label, i) => (
                <label className="block" key={label}>
                  {t("Reference", "المرجع")} {label}
                  <audio className="block w-full" controls preload="none" src={urls[i]} />
                </label>
              ))}
              <label className="block">
                {t(
                  "Have you heard this edition or read its script?",
                  "هل سبق لك سماع هذه النسخة أو قراءة نصّها؟",
                )}
                <select name="familiar" required className={control} defaultValue="">
                  <option value="">{t("Choose", "اختر")}</option>
                  <option value="no">{t("No", "لا")}</option>
                  <option value="yes">{t("Yes", "نعم")}</option>
                </select>
              </label>
              {clips.map((id, i) => (
                <fieldset key={id} className="min-w-0 space-y-2 rounded-lg border p-3">
                  <legend>
                    {t("Clip", "المقطع")} {i + 1}
                  </legend>
                  <audio
                    aria-label={t("Clip", "المقطع") + " " + (i + 1)}
                    controls
                    preload="none"
                    className="w-full"
                    src={urls[i + 2]}
                  />
                  <label className="block">
                    {t("Voice", "الصوت")}
                    <select className={control} required defaultValue="" name={id + "voice"}>
                      <option value="">{t("Choose", "اختر")}</option>
                      <option>A</option>
                      <option>B</option>
                      <option value="unsure">{t("Unsure", "غير متأكد")}</option>
                    </select>
                  </label>
                  <label className="block">
                    {t("Where does the action take place?", "أين يدور المشهد؟")}
                    <input className={control} name={id + "place"} required maxLength={300} />
                  </label>
                  <label className="block">
                    {t("Which sound led you there?", "ما الصوت الذي دلّك على المكان؟")}
                    <input className={control} required maxLength={500} name={id + "cue"} />
                  </label>
                </fieldset>
              ))}
              <button type="submit" className={button}>
                {t("Lock my first responses", "ثبّت إجابات الاستماع")}
              </button>
            </form>
          )}
        </>
      )}
      <output aria-live="polite">{notice}</output>
    </section>
  );
}
function encodeWave(samples: Float32Array, rate: number) {
  const buf = new ArrayBuffer(44 + samples.length * 2),
    view = new DataView(buf);
  const tag = (at: number, s: string) =>
    Array.from(s).forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  tag(0, "RIFF");
  view.setUint32(4, buf.byteLength - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) =>
    view.setInt16(44 + 2 * i, Math.round(Math.max(-1, Math.min(1, x)) * 32767), true),
  );
  return new Blob([buf], { type: "audio/wav" });
}
function Mixer({ resolveAsset, t, locale, scope }: Props & { t: Talk }) {
  const [levels, setLevels] = useState([1, 1, 1, 1]),
    [ready, setReady] = useState(false),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const ctx = useRef<AudioContext | null>(null),
    buffers = useRef<AudioBuffer[]>([]),
    players = useRef<AudioBufferSourceNode[]>([]),
    gains = useRef<GainNode[]>([]),
    mounted = useRef(true);
  const names = [
    t("Mira", "ميرا"),
    t("Hadi", "هادي"),
    t("Ambience", "خلفية المكان"),
    t("Foley", "المؤثّرات"),
  ];
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      players.current.forEach((n) => {
        n.onended = null;
        n.stop();
      });
      if (ctx.current) void ctx.current.close();
    };
  }, []);
  function stop() {
    for (const n of players.current) {
      n.onended = null;
      n.stop();
      n.disconnect();
    }
    players.current = [];
    gains.current.forEach((g) => g.disconnect());
    gains.current = [];
    setPlaying(false);
  }
  async function load() {
    setBusy(true);
    setNotice("");
    try {
      const audio = ctx.current ?? new AudioContext();
      ctx.current = audio;
      await audio.resume();
      const decoded = await Promise.all(
        stems.map(async (id) => {
          const url = await resolveAsset("stem-" + id);
          const response = await fetch(url);
          if (!response.ok) throw Error("asset");
          return audio.decodeAudioData(await response.arrayBuffer());
        }),
      );
      if (!decoded.every((b) => b.numberOfChannels === 1 && b.length === decoded[0].length))
        throw Error("alignment");
      if (mounted.current) {
        buffers.current = decoded;
        setReady(true);
      }
    } catch {
      if (mounted.current)
        setNotice(
          t(
            "Could not load aligned tracks. Try again.",
            "تعذّر تحميل المسارات المتزامنة. حاول مجددًا.",
          ),
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function play() {
    const audio = ctx.current;
    if (!audio || !ready) return;
    stop();
    await audio.resume();
    if (!mounted.current) return;
    const when = audio.currentTime + 0.08;
    for (const [i, b] of buffers.current.entries()) {
      const player = audio.createBufferSource(),
        gain = audio.createGain();
      player.buffer = b;
      gain.gain.value = levels[i];
      player.connect(gain).connect(audio.destination);
      players.current.push(player);
      gains.current.push(gain);
      player.start(when);
    }
    players.current[0].onended = () => {
      if (mounted.current) stop();
    };
    setPlaying(true);
  }
  function volume(index: number, value: number) {
    setLevels((old) => old.map((x, i) => (i === index ? value : x)));
    const g = gains.current[index];
    if (g && ctx.current) g.gain.setTargetAtTime(value, ctx.current.currentTime, 0.02);
  }
  function exportMix() {
    if (!ready) return;
    const all = buffers.current;
    const sum = new Float32Array(all[0].length);
    for (const [i, buf] of all.entries()) {
      const track = buf.getChannelData(0);
      for (let n = 0; n < sum.length; n++) sum[n] += track[n] * levels[i];
    }
    let peak = 0;
    for (const v of sum) peak = Math.max(peak, Math.abs(v));
    if (peak > 1) {
      setNotice(
        t(
          "The summed mix clips. Lower a track and try again.",
          "تجاوز المزيج حدّ الإشارة. اخفض مستوى مسار وأعد التصدير.",
        ),
      );
      return;
    }
    download("my-mix-" + locale + ".wav", encodeWave(sum, all[0].sampleRate));
    setNotice(t("WAV mix exported.", "صُدّر المزيج بصيغة WAV."));
  }
  return (
    <section className="space-y-3">
      <h3 className="font-bold">{t("Mix project", "مشروع المزيج")}</h3>
      <p>
        {t(
          "Start with the aligned tracks. Lower the ambience during a listen, compare the words, then export your own mix. The original tracks stay available.",
          "ابدأ بالمسارات المتزامنة. اخفض خلفية المكان وأنت تستمع، وقارن وضوح الكلمات ثم صدّر مزيجك. يمكنك العودة إلى المسارات الأصلية.",
        )}
      </p>
      {!ready ? (
        <button type="button" className={button} disabled={busy} onClick={load}>
          {t("Load the four tracks", "حمّل المسارات الأربعة")}
        </button>
      ) : (
        <>
          {stems.map((id, i) => (
            <label key={id} className="block">
              {names[i]} · {Math.round(levels[i] * 100)}%
              <input
                type="range"
                className="block w-full"
                min={0}
                max={1}
                step=".01"
                value={levels[i]}
                onChange={(e) => volume(i, Number(e.target.value))}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              onClick={() => (playing ? stop() : void play())}
            >
              {playing ? t("Stop", "إيقاف") : t("Play mix", "شغّل المزيج")}
            </button>
            <button
              type="button"
              className={button}
              onClick={() => stems.forEach((_, i) => volume(i, 1))}
            >
              {t("Restore original levels", "استعد المستويات الأصلية")}
            </button>
            <button type="button" className={button} onClick={exportMix}>
              {t("Export WAV", "صدّر المزيج WAV")}
            </button>
            <button
              type="button"
              className={button}
              onClick={() =>
                download(
                  "mix-settings.json",
                  new Blob(
                    [
                      JSON.stringify(
                        { version: scope.split(":").slice(-2), stems, levels },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  ),
                )
              }
            >
              {t("Save level settings", "احفظ إعدادات المستوى")}
            </button>
          </div>
        </>
      )}
      <output aria-live="polite">{notice}</output>
    </section>
  );
}
function TransferDraw({ t, scope }: { t: Talk; scope: string }) {
  const key = "audio-stories:transfer:" + scope;
  const [draw, setDraw] = useState<number[] | null>(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(key) || "null");
      return Array.isArray(v) &&
        v.length === 2 &&
        v.every((n) => Number.isInteger(n) && n >= 0 && n < 4)
        ? v
        : null;
    } catch {
      return null;
    }
  });
  const places = [
    t("A greenhouse and a bicycle workshop", "بيت زجاجي للنباتات وورشة دراجات"),
    t("A swimming pool and a reading room", "مسبح وقاعة مطالعة"),
    t("A harbour and a laundry", "ميناء ومغسلة ملابس"),
    t("A playground and a lift", "ملعب أطفال ومصعد"),
  ];
  const objects = [
    t("a folded note", "ورقة مطويّة"),
    t("a loose button", "زرّ منفصل"),
    t("a paper cup", "كوب ورقي"),
    t("an empty frame", "إطار فارغ"),
  ];
  function reveal() {
    const bytes = crypto.getRandomValues(new Uint8Array(2));
    const v = Array.from(bytes, (n) => n % 4);
    setDraw(v);
    try {
      sessionStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* The prompt remains available on this screen. */
    }
  }
  return (
    <div className="rounded border p-3">
      {draw ? (
        <p>
          {places[draw[0]]} · {objects[draw[1]]}
        </p>
      ) : (
        <button type="button" className={button} onClick={reveal}>
          {t("Draw my unseen scene", "اسحب مشهدًا جديدًا")}
        </button>
      )}
    </div>
  );
}

export function AudioStoryWorkspace(props: Props) {
  const t: Talk = (en, msa, eg, gulf) =>
    props.locale === "en"
      ? en
      : props.locale === "ar-EG"
        ? (eg ?? msa)
        : props.locale === "ar-Gulf"
          ? (gulf ?? msa)
          : msa;
  const blind = ["story-01", "story-27", "story-28", "story-32"].includes(props.lesson);
  return (
    <div className="mb-4 min-w-0 space-y-4 rounded-xl border bg-card p-4">
      {props.lesson === "story-30" && <TransferDraw t={t} scope={props.scope} />}
      {blind ? <Listening {...props} t={t} /> : <Mixer {...props} t={t} />}
    </div>
  );
}
