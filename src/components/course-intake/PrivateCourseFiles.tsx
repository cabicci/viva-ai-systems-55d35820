import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sha256 } from "@/lib/card-assistant/corpus";
import { uploadCurriculumAsset } from "@/lib/course-system/intake/functions";
import type { PublicIntake } from "@/lib/course-system/intake/package";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { useLocale } from "@/lib/locale/locale-context";

export function PrivateCourseFiles({
  course,
  version,
  account,
}: {
  course: PublicIntake;
  version: string;
  account: string;
}) {
  const { locale } = useLocale();
  const c = intakeCopy(locale);
  const upload = useServerFn(uploadCurriculumAsset);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const targets = course.stations.flatMap((station) =>
    station.steps.flatMap((step) =>
      course.locales.flatMap((lang) =>
        (step.content[lang]?.assets ?? []).flatMap((asset) =>
          asset.storage
            ? [
                {
                  lesson: step.id,
                  locale: lang,
                  asset: asset.id,
                  hash: asset.sha256,
                  path: asset.storage.bucket + "/" + asset.storage.path,
                },
              ]
            : [],
        ),
      ),
    ),
  );
  if (!targets.length) return null;

  async function storeFiles(files: File[]) {
    const stored = new Set<string>();
    let unmatched = false;
    setBusy(true);
    setStatus("");
    try {
      for (const file of files) {
        if (!file.size || file.size > 10_485_760) {
          unmatched = true;
          continue;
        }
        const hash = await sha256(new Uint8Array(await file.arrayBuffer()));
        const matches = targets.filter((t) => t.hash === hash);
        if (!matches.length) unmatched = true;
        for (const match of matches) {
          if (stored.has(match.path)) continue;
          const form = new FormData();
          for (const [key, value] of Object.entries({
            account,
            area: course.area,
            course: course.id,
            version,
            lesson: match.lesson,
            locale: match.locale,
            asset: match.asset,
          }))
            form.set(key, value);
          form.set("file", file);
          const result = await upload({ data: form });
          if (result.sha256 !== hash) throw new Error();
          stored.add(match.path);
          setStatus(c.filesStored + " " + stored.size);
        }
      }
      if (unmatched) setStatus(c.filesStored + " " + stored.size + ". " + c.fileNotInEdition);
    } catch {
      setStatus(c.filesStored + " " + stored.size + ". " + c.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <label className="block font-semibold">
        {c.privateFiles}
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.wav"
          disabled={busy}
          className="mt-2 block w-full text-sm"
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            e.currentTarget.value = "";
            if (files.length) void storeFiles(files);
          }}
        />
      </label>
      <p aria-live="polite" aria-busy={busy} className="text-sm text-muted-foreground">
        {status}
      </p>
    </div>
  );
}
