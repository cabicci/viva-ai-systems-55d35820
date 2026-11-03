import type { IntakeSection } from "./package";

/** Presentation-only helpers for admitted curricula. Nothing here changes section
 * identities, completion rules or stored progress; it only decides how already
 * reviewed text is laid out. Every block keeps its exact source string. */

export const SECTION_GROUPS = [
  "explanation",
  "example",
  "video",
  "check",
  "practice",
  "faq",
  "downloads",
] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export function groupOf(kind: IntakeSection["kind"]): SectionGroup {
  if (kind === "questions" || kind === "exam") return "check";
  if (kind === "mission" || kind === "practice") return "practice";
  return kind;
}

/** Fixed seven-group order; author order is kept inside each group. Every input
 * section appears exactly once. */
export function groupSections(sections: IntakeSection[]) {
  return SECTION_GROUPS.map((group) => ({
    group,
    sections: sections.filter((s) => groupOf(s.kind) === group),
  })).filter((g) => g.sections.length > 0);
}

/** Accepts a group key or a section id (older links) and returns the group. */
export function resolveGroup(sections: IntakeSection[], selected: string): SectionGroup {
  const groups = groupSections(sections);
  const byGroup = groups.find((g) => g.group === selected);
  if (byGroup) return byGroup.group;
  const bySection = sections.find((s) => s.id === selected);
  if (bySection) return groupOf(bySection.kind);
  return groups[0]?.group ?? "explanation";
}

export type ListItem = { marker: string; text: string };
export type Block =
  | { type: "heading"; source: string; text: string }
  | {
      type: "list";
      source: string;
      lead: string | null;
      items: ListItem[];
      tone: "outcome" | "plain";
    }
  | { type: "formula"; source: string; text: string }
  | {
      type: "callout";
      source: string;
      label: string;
      sep: string;
      body: string;
      tone: "case" | "reflection";
    }
  | { type: "faq"; source: string; question: string; answer: string }
  | { type: "text"; source: string; text: string };

const HEADING = /^[0-9٠-٩]{1,2}[.)]\s+\S[^\n]{0,118}$/;
const FORMULA = /^`[^`\n]+`$/;
const BULLET = /^(\s*[•\-*]\s+)(.+)$/;
const CALLOUT = /^([^:،,\n`]{2,40})(:\s+)([\s\S]+)$/;
const OUTCOME = /^(الخلاصة|خلاصة|الخلاصه|Summary|Key takeaways|In summary)\s*:?\s*$/i;
const CASE = /^(مثال|حالة|Example|Case)/i;

function parseList(source: string): Block | null {
  const lines = source.split("\n");
  const first = BULLET.test(lines[0]) ? -1 : 0;
  const rest = lines.slice(first + 1);
  if (!rest.length || !rest.every((l) => BULLET.test(l))) return null;
  const lead = first === 0 ? lines[0] : null;
  return {
    type: "list",
    source,
    lead,
    items: rest.map((l) => {
      const m = l.match(BULLET)!;
      return { marker: m[1], text: m[2] };
    }),
    tone: lead && OUTCOME.test(lead) ? "outcome" : "plain",
  };
}

export function parseBlock(source: string, faq = false): Block {
  if (faq) {
    const at = source.indexOf("\n");
    if (at > 0) {
      const question = source.slice(0, at);
      const answer = source.slice(at + 1);
      if (/[?؟]\s*$/.test(question) && answer.trim())
        return { type: "faq", source, question, answer };
    }
  }
  if (HEADING.test(source)) return { type: "heading", source, text: source };
  if (FORMULA.test(source)) return { type: "formula", source, text: source.slice(1, -1) };
  const list = source.includes("\n") ? parseList(source) : null;
  if (list) return list;
  const callout = source.match(CALLOUT);
  if (callout && callout[1].trim().split(/\s+/).length <= 4)
    return {
      type: "callout",
      source,
      label: callout[1],
      sep: callout[2],
      body: callout[3],
      tone: CASE.test(callout[1]) ? "case" : "reflection",
    };
  return { type: "text", source, text: source };
}

export const parseBlocks = (paragraphs: string[], faq = false) =>
  paragraphs.map((p) => parseBlock(p, faq));

/** Rebuilds the authored string from a block; used to prove parsing is lossless. */
export function blockSource(b: Block): string {
  switch (b.type) {
    case "heading":
    case "text":
      return b.text;
    case "formula":
      return `\`${b.text}\``;
    case "callout":
      return b.label + b.sep + b.body;
    case "faq":
      return `${b.question}\n${b.answer}`;
    case "list":
      return [...(b.lead !== null ? [b.lead] : []), ...b.items.map((i) => i.marker + i.text)].join(
        "\n",
      );
  }
}

/** Worked example: opening case, steps (explanation + formulas), closing decision. */
export function exampleLayout(blocks: Block[]) {
  const lastFormula = blocks.map((b) => b.type).lastIndexOf("formula");
  if (lastFormula < 0 || blocks.length < 2) return null;
  const opening = blocks[0].type === "formula" ? null : blocks[0];
  const steps: { lead: Block | null; formulas: Block[] }[] = [];
  for (const b of blocks.slice(opening ? 1 : 0, lastFormula + 1)) {
    if (b.type === "formula") {
      if (!steps.length) steps.push({ lead: null, formulas: [] });
      steps[steps.length - 1].formulas.push(b);
    } else steps.push({ lead: b, formulas: [] });
  }
  return { opening, steps, closing: blocks.slice(lastFormula + 1) };
}

/** First explanation paragraph used as the lesson-hero introduction, only when
 * it is plain prose (not a heading, list or formula). */
export function lessonLead(sections: IntakeSection[]) {
  const explanation = sections.find((s) => s.kind === "explanation");
  const first = explanation?.paragraphs[0];
  if (!explanation || !first || first.length > 400) return null;
  return parseBlock(first).type === "text" ? { sectionId: explanation.id, text: first } : null;
}
