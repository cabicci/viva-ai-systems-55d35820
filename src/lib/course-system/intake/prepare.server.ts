import { sha256 } from "@/lib/card-assistant/corpus";
import { intakeCanonical, intakeModel, publicIntake, validateIntake } from "./package";
import { parseIntakeJson } from "./raw-json";
import { curriculumChunks } from "./corpus";

/** Author package, private marking keys, public projection and source identity
 * are committed together. The browser never supplies a preapproved projection. */
export async function prepareIntake(raw: string) {
  const input = parseIntakeJson(raw);
  const p = validateIntake(input);
  const publicCourse = publicIntake(p);
  const material = intakeCanonical(p);
  const version = await sha256(material);
  const lessons = await Promise.all(
    publicCourse.stations.flatMap((station) =>
      station.steps.flatMap((step) =>
        p.locales.map(async (locale) => {
          const payload = { id: step.id, title: step.title[locale]!, ...step.content[locale]! };
          await curriculumChunks(payload);
          const canonical = intakeCanonical(payload);
          return {
            lesson: step.id,
            locale,
            title: step.title[locale],
            payload,
            material: canonical,
            sha256: await sha256(canonical),
          };
        }),
      ),
    ),
  );
  return {
    material,
    version,
    publicCourse,
    source: p.source,
    keys: p.assessmentKeys,
    model: intakeModel(p),
    lessons,
    rawSha256: await sha256(raw),
  };
}
