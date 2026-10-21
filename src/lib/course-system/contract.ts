/** Course authors supply data. Presentation, authorization and the assistant
 * belong to the platform and cannot be overridden by an imported course. */
export const COURSE_AREAS = ["ai", "kids", "technical", "academic"] as const;
export type CourseArea = typeof COURSE_AREAS[number];
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type CourseStep = { id: string; title?: Json; content?: Json; route: string };
export type CourseStation = { id: string; title?: Json; steps: CourseStep[] };
export type CourseContract = {
  schemaVersion: "masaarat-course-v1";
  area: CourseArea;
  id: string;
  title?: Json;
  stations: CourseStation[];
  platform: {
    template: "shared-area-lesson";
    accessAdapter: "assistant_card_content_access" | "card_assistant_access" | "academic_assistant_access";
    assistant: { enabled: true; scope: "whole-current-card"; examples: "within-card-concepts"; indexing: "incremental-current-source" };
  };
};

export function inheritedCoursePlatform(area: CourseArea): CourseContract["platform"] {
  if (!(COURSE_AREAS as readonly unknown[]).includes(area)) fail("COURSE_AREA_INVALID", "card.area");
  return { template: "shared-area-lesson", accessAdapter: area === "ai" ? "assistant_card_content_access" :
    area === "academic" ? "academic_assistant_access" : "card_assistant_access",
    assistant: { enabled: true, scope: "whole-current-card", examples: "within-card-concepts", indexing: "incremental-current-source" } };
}

export function assertPlatformOwnedCourse(value: unknown, at = "card"): void {
  const row = object(value, at);
  for (const key of ["renderer", "component", "accessAdapter", "platform", "stylesheet"])
    if (Object.hasOwn(row, key)) fail("COURSE_PLATFORM_OVERRIDE", `${at}.${key}`);
  if (row.assistant !== undefined && row.assistant !== true) fail("COURSE_PLATFORM_OVERRIDE", `${at}.assistant`);
}

export class CourseIntegrationError extends Error {
  constructor(public code: string, public location: string) {
    super(`${code}: ${location}`);
  }
}
function fail(code: string, at: string): never { throw new CourseIntegrationError(code, at); }
function object(value: unknown, at: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("COURSE_OBJECT_REQUIRED", at);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail("COURSE_DATA_ONLY", at);
  return value as Record<string, unknown>;
}
function field(row: Record<string, unknown>, aliases: string[], at: string, required = true): unknown {
  const present = aliases.filter(key => Object.hasOwn(row, key));
  if (present.length > 1) fail("COURSE_AMBIGUOUS_FIELD", `${at}.${present.join("/")}`);
  if (!present.length && required) fail("COURSE_MISSING_FIELD", `${at}.${aliases[0]}`);
  return present.length ? row[present[0]] : undefined;
}
function keys(row: Record<string, unknown>, allowed: string[], at: string) {
  for (const key of Object.keys(row)) if (!allowed.includes(key)) fail("COURSE_UNMAPPED_FIELD", `${at}.${key}`);
}
function id(value: unknown, at: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/.test(value)) fail("COURSE_ID_INVALID", at);
  return value;
}
function json(value: unknown, at: string, depth = 0): Json {
  if (depth > 40) fail("COURSE_CONTENT_TOO_DEEP", at);
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((child, index) => json(child, `${at}[${index}]`, depth + 1));
  const row = object(value, at);
  const result: { [key: string]: Json } = Object.create(null);
  for (const [key, child] of Object.entries(row)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) fail("COURSE_DATA_ONLY", `${at}.${key}`);
    result[key] = json(child, `${at}.${key}`, depth + 1);
  }
  return result;
}
function list(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1000) fail("COURSE_NONEMPTY_LIST_REQUIRED", at);
  return value;
}
export function courseStepRoute(area: CourseArea, cardId: string, stepId: string): string {
  id(cardId, "card.id"); id(stepId, "step.id");
  switch (area) {
    case "ai": return `/learn/${cardId}/${stepId}`;
    case "kids": return `/kids/${cardId}/${stepId}`;
    case "technical": return `/technical/learn/${stepId}`;
    case "academic": return `/academic/learn/${stepId}`;
    default: return fail("COURSE_AREA_INVALID", "card.area");
  }
}

/** Known hierarchy aliases are normalized. Unknown/ambiguous structure is
 * rejected with its exact location rather than guessed or silently discarded.
 * Lesson bodies remain data for the existing approved area source adapter;
 * normalization does not approve content, grant access, index or publish it. */
export function normalizeCourse(input: unknown): CourseContract {
  const root = object(input, "card");
  keys(root, ["schemaVersion", "area", "id", "cardId", "courseId", "title", "stations", "modules", "assistant"], "card");
  if (root.schemaVersion !== undefined && root.schemaVersion !== "masaarat-course-v1") fail("COURSE_VERSION_UNSUPPORTED", "card.schemaVersion");
  const area = root.area;
  if (!(COURSE_AREAS as readonly unknown[]).includes(area)) fail("COURSE_AREA_INVALID", "card.area");
  const cardId = id(field(root, ["id", "cardId", "courseId"], "card"), "card.id");
  if (root.assistant !== undefined && root.assistant !== true) fail("COURSE_PLATFORM_OVERRIDE", "card.assistant");
  const stationIds = new Set<string>(), stepIds = new Set<string>();
  const stations = list(field(root, ["stations", "modules"], "card"), "card.stations").map((raw, index) => {
    const at = `card.stations[${index}]`, station = object(raw, at);
    keys(station, ["id", "title", "steps", "lessons"], at);
    const stationId = id(station.id, `${at}.id`);
    if (stationIds.has(stationId)) fail("COURSE_DUPLICATE_STATION", `${at}.id`);
    stationIds.add(stationId);
    const steps = list(field(station, ["steps", "lessons"], at), `${at}.steps`).map((rawStep, stepIndex) => {
      const location = `${at}.steps[${stepIndex}]`, step = object(rawStep, location);
      keys(step, ["id", "title", "content", "route"], location);
      const stepId = id(step.id, `${location}.id`);
      if (stepIds.has(stepId)) fail("COURSE_DUPLICATE_STEP", `${location}.id`);
      stepIds.add(stepId);
      const route = courseStepRoute(area as CourseArea, cardId, stepId);
      if (step.route !== undefined && step.route !== route) fail("COURSE_CUSTOM_ROUTE", `${location}.route`);
      return { id: stepId, route, ...(step.title === undefined ? {} : { title: json(step.title, `${location}.title`) }),
        ...(step.content === undefined ? {} : { content: json(step.content, `${location}.content`) }) };
    });
    return { id: stationId, steps, ...(station.title === undefined ? {} : { title: json(station.title, `${at}.title`) }) };
  });
  return { schemaVersion: "masaarat-course-v1", area: area as CourseArea, id: cardId, stations,
    ...(root.title === undefined ? {} : { title: json(root.title, "card.title") }),
    platform: inheritedCoursePlatform(area as CourseArea) };
}
