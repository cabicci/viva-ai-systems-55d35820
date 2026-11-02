import { z } from "zod";
import { canonicalizeCourseJson } from "../admission/canonicalize";
import { COURSE_AREAS } from "../contract";

export const INTAKE_VERSION = "masaarat-intake-v1" as const;
export const intakeCanonical = (input: unknown) =>
  canonicalizeCourseJson(input, { maxDepth: 40, maxUtf8Bytes: 8_000_000, maxNodes: 200000 });
export const intakeLocales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
export const sectionKinds = [
  "explanation",
  "example",
  "video",
  "questions",
  "exam",
  "mission",
  "practice",
  "faq",
  "downloads",
] as const;
const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/);
const text = z.string().trim().min(1).max(20000);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const locale = z.enum(intakeLocales);
const localized = z.partialRecord(locale, text).refine((x) => Object.keys(x).length > 0);
const asset = z
  .object({
    id,
    sha256: digest,
    label: text,
    // Only reviewed, already hosted media. No arbitrary HTML/iframes, local paths,
    // bearer tokens, provider credentials or automatic uploads in course packages.
    url: z
      .string()
      .url()
      .max(2000)
      .refine((value) => {
        const u = new URL(value);
        return (
          u.protocol === "https:" &&
          !u.username &&
          !u.password &&
          !u.search &&
          !u.hash &&
          (u.hostname === "masaarat.ai" ||
            u.hostname.endsWith(".b-cdn.net") ||
            u.hostname === "iframe.mediadelivery.net")
        );
      })
      .optional(),
    storage: z
      .object({
        bucket: z.enum(["academic-downloads", "technical-downloads"]),
        path: z
          .string()
          .max(500)
          .regex(/^[A-Za-z0-9][A-Za-z0-9/_-]*\.pdf$/),
      })
      .strict()
      .optional(),
    type: z.enum(["video", "pdf", "worksheet", "file"]),
  })
  .strict()
  .superRefine((a, c) => {
    if (
      (a.type === "video" && (!a.url || a.storage)) ||
      (a.type !== "video" && (!a.storage || a.url))
    )
      c.addIssue({
        code: "custom",
        message: "Videos use reviewed hosting; downloadable files use private storage",
      });
  });
const question = z.object({ id, prompt: text, options: z.array(text).min(2).max(10) }).strict();
const section = z
  .object({
    id,
    kind: z.enum(sectionKinds),
    title: text,
    paragraphs: z.array(text).max(100).default([]),
    questions: z.array(question).max(100).default([]),
    assets: z.array(id).max(30).default([]),
    fields: z
      .array(z.object({ id, label: text }).strict())
      .max(30)
      .default([]),
    required: z.boolean(),
    completion: z.enum(["read", "view", "pass", "submit", "review"]),
    passPercent: z.number().int().min(1).max(100).optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
  })
  .strict()
  .superRefine((s, c) => {
    const check = (ok: boolean, message: string) => {
      if (!ok) c.addIssue({ code: "custom", message });
    };
    const assessment = s.kind === "questions" || s.kind === "exam";
    const quiz = assessment && s.completion === "pass";
    check(
      s.durationMinutes === undefined || assessment,
      "Only an authored assessment may define an examination duration",
    );
    check(quiz === s.questions.length > 0, "Scored questions require server grading");
    check(
      !assessment || ["pass", "submit", "review"].includes(s.completion),
      "Assessments require grading or a reviewed submission rule",
    );
    check(
      quiz === (s.passPercent !== undefined),
      "A reviewed pass threshold is required for automatic grading only",
    );
    check(
      !["submit", "review"].includes(s.completion) || s.fields.length > 0,
      "Written and practical submissions require fields",
    );
    check(
      !["mission", "practice"].includes(s.kind) || ["submit", "review"].includes(s.completion),
      "Practice requires submission or review; viewing is not competence",
    );
    check(
      !["explanation", "example", "faq"].includes(s.kind) || s.completion === "read",
      "Instruction uses explicit reading completion",
    );
    check(
      !["video", "downloads"].includes(s.kind) || (s.assets.length > 0 && s.completion === "view"),
      "Media requires reviewed assets",
    );
    check(
      !s.fields.length || (["mission", "practice", "questions", "exam"].includes(s.kind) && !quiz),
      "Submission fields require a written or practical activity",
    );
    check(
      s.paragraphs.length > 0 || s.questions.length > 0 || s.assets.length > 0,
      "Empty sections are not imported",
    );
  });
const lesson = z
  .object({
    id,
    title: localized,
    content: z.partialRecord(
      locale,
      z
        .object({ sections: z.array(section).min(1).max(30), assets: z.array(asset).max(60) })
        .strict(),
    ),
  })
  .strict();
const station = z.object({ id, title: localized, steps: z.array(lesson).min(1).max(100) }).strict();
const key = z.object({ questionId: id, correctIndex: z.number().int().min(0).max(9) }).strict();

export const intakePackageSchema = z
  .object({
    schemaVersion: z.literal(INTAKE_VERSION),
    area: z.enum(COURSE_AREAS),
    id,
    title: localized,
    locales: z.array(locale).min(1).max(4),
    source: z.object({ reference: text, sha256: digest }).strict(),
    stations: z.array(station).min(1).max(100),
    // No invented grading rules: protected keys must be supplied by the author.
    assessmentKeys: z
      .array(z.object({ lessonId: id, locale, keys: z.array(key).max(500) }).strict())
      .max(4000),
    notesEnabled: z.literal(true).default(true),
  })
  .strict();
export type IntakePackage = z.infer<typeof intakePackageSchema>;
export type IntakeSection = z.infer<typeof section>;
export type IntakeLesson = z.infer<typeof lesson>;
export type PublicIntake = Omit<IntakePackage, "assessmentKeys" | "source">;

function unique(values: string[], at: string) {
  if (new Set(values).size !== values.length) throw new Error(`INTAKE_DUPLICATE:${at}`);
}
/** Fixed instruction order; remaining activity order is the author's own order. */
export function orderedSections(sections: IntakeSection[]): IntakeSection[] {
  const rank = (s: IntakeSection) =>
    ["explanation", "example", "video"].includes(s.kind)
      ? ["explanation", "example", "video"].indexOf(s.kind)
      : 3;
  return sections
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    .map((x) => x.s);
}

export function validateIntake(input: unknown): IntakePackage {
  // Also rejects executable descriptors, class instances and malformed Unicode.
  intakeCanonical(input);
  const p = intakePackageSchema.parse(normalizeHierarchy(input));
  if (["ai", "kids", "furniture", "level-1", "level-2", "level-3", "AC-BUS"].includes(p.id))
    throw new Error("INTAKE_EXISTING_COURSE_USE_EXISTING_AUTHORITY");
  unique(p.locales, "locales");
  unique(
    p.stations.map((s) => s.id),
    "stations",
  );
  const steps = p.stations.flatMap((s) => s.steps);
  if (steps.length > 1000) throw new Error("INTAKE_SCOPE_LIMIT");
  unique(
    steps.map((s) => s.id),
    "steps",
  );
  const exactLocales = (x: object) => {
    if (Object.keys(x).sort().join() !== p.locales.slice().sort().join())
      throw new Error("INTAKE_LOCALE_INCOMPLETE");
  };
  exactLocales(p.title);
  p.stations.forEach((s) => exactLocales(s.title));
  unique(
    p.assessmentKeys.map((k) => `${k.lessonId}:${k.locale}`),
    "assessmentKeys",
  );
  const usedKeys = new Set<string>();
  for (const step of steps) {
    exactLocales(step.title);
    exactLocales(step.content);
    let shape: string | null = null;
    for (const lang of p.locales) {
      const content = step.content[lang]!;
      unique(
        content.sections.map((s) => s.id),
        `${step.id}.sections`,
      );
      unique(
        content.assets.map((a) => a.id),
        `${step.id}.assets`,
      );
      for (const a of content.assets)
        if (a.storage && !a.storage.path.startsWith(`${p.area}/${p.id}/`))
          throw new Error("INTAKE_ASSET_SCOPE_MISMATCH");
      const questions = content.sections.flatMap((s) => s.questions);
      unique(
        questions.map((q) => q.id),
        `${step.id}.questions`,
      );
      const keys =
        p.assessmentKeys.find((k) => k.lessonId === step.id && k.locale === lang)?.keys ?? [];
      if (keys.length) usedKeys.add(`${step.id}:${lang}`);
      unique(
        keys.map((k) => k.questionId),
        `${step.id}.keys`,
      );
      if (
        keys.length !== questions.length ||
        questions.some(
          (q) => !keys.some((k) => k.questionId === q.id && k.correctIndex < q.options.length),
        )
      )
        throw new Error("INTAKE_ASSESSMENT_KEYS_INCOMPLETE");
      for (const s of content.sections) {
        if (s.assets.some((a) => !content.assets.some((found) => found.id === a)))
          throw new Error("INTAKE_ASSET_MISSING");
        if (
          s.kind === "video" &&
          s.assets.some((a) => content.assets.find((found) => found.id === a)?.type !== "video")
        )
          throw new Error("INTAKE_ASSET_TYPE");
        unique(
          s.fields.map((f) => f.id),
          `${step.id}.${s.id}.fields`,
        );
      }
      // IDs, activities, completion and grading meaning cannot silently vary by language.
      const current = intakeCanonical(
        content.sections.map((s) => ({
          id: s.id,
          kind: s.kind,
          required: s.required,
          completion: s.completion,
          passPercent: s.passPercent ?? null,
          durationMinutes: s.durationMinutes ?? null,
          fields: s.fields.map((f) => f.id),
          questions: s.questions.map((q) => [
            q.id,
            q.options.length,
            keys.find((k) => k.questionId === q.id)?.correctIndex,
          ]),
        })),
      );
      if (shape !== null && current !== shape) throw new Error("INTAKE_LOCALE_MODEL_MISMATCH");
      shape = current;
      content.sections = orderedSections(content.sections);
    }
  }
  if (
    p.assessmentKeys.some((k) => k.keys.length === 0 || !usedKeys.has(`${k.lessonId}:${k.locale}`))
  )
    throw new Error("INTAKE_UNUSED_KEYS");
  return p;
}

/** Map only known structural names. Source arrays retain their exact order;
 * ambiguous aliases and unrecognized content remain errors, never guesses. */
function normalizeHierarchy(input: unknown): unknown {
  const row = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("INTAKE_STRUCTURE_INVALID");
    return { ...value };
  };
  const alias = (value: Record<string, unknown>, target: string, names: string[]) => {
    const present = [target, ...names].filter((k) => Object.hasOwn(value, k));
    if (present.length > 1) throw new Error(`INTAKE_AMBIGUOUS_STRUCTURE:${target}`);
    if (present.length && present[0] !== target) {
      value[target] = value[present[0]];
      delete value[present[0]];
    }
  };
  const p = row(input);
  alias(p, "stations", ["modules", "chapters"]);
  alias(p, "id", ["courseId", "cardId"]);
  if (Array.isArray(p.stations))
    p.stations = p.stations.map((value) => {
      const station = row(value);
      alias(station, "steps", ["lessons"]);
      return station;
    });
  return p;
}

export function publicIntake(p: IntakePackage): PublicIntake {
  // Revalidate then select explicitly. Do not recursively scrub secrets by name.
  const safe = validateIntake(p);
  return {
    schemaVersion: safe.schemaVersion,
    area: safe.area,
    id: safe.id,
    title: safe.title,
    locales: safe.locales,
    stations: safe.stations,
    notesEnabled: safe.notesEnabled,
  };
}
export function intakeModel(p: IntakePackage) {
  const kinds = new Set(
    p.stations.flatMap((s) =>
      s.steps.flatMap((step) => step.content[p.locales[0]]!.sections.map((x) => x.kind)),
    ),
  );
  return {
    activities: [
      "reading",
      ...(p.notesEnabled ? ["notes"] : []),
      ...(kinds.has("mission") ? ["mission"] : []),
      ...(kinds.has("questions") ? ["questions"] : []),
      ...(kinds.has("exam") ? ["exam"] : []),
      ...(kinds.has("practice") ? ["practice"] : []),
    ],
    completion: {
      authority: "curriculum_command",
      required: p.stations.flatMap((s) =>
        s.steps.flatMap((step) =>
          step.content[p.locales[0]]!.sections.filter((x) => x.required).map((x) => ({
            lesson: step.id,
            section: x.id,
            rule: x.completion,
          })),
        ),
      ),
      mastery_inferred: false,
    },
  };
}
