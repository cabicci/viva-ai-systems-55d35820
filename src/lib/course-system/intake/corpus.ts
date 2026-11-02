import { sha256 } from "@/lib/card-assistant/corpus";
export type TeachingSource = {
  id: string;
  title: string;
  sections: { id: string; kind: string; title: string; paragraphs: string[] }[];
};
export async function curriculumChunks(source: TeachingSource) {
  const chunks: { id: string; content: string; contentSha: string }[] = [];
  for (const section of source.sections) {
    if (
      ["questions", "exam", "downloads", "video"].includes(section.kind) ||
      !section.paragraphs.length
    )
      continue;
    const characters = Array.from(
      [source.title, section.title, ...section.paragraphs].join("\n\n"),
    );
    for (let at = 0; at < characters.length; at += 2400) {
      const content = characters.slice(at, at + 2400).join("");
      chunks.push({
        id: `${section.id}-part-${at / 2400 + 1}`,
        content,
        contentSha: await sha256(content),
      });
    }
  }
  if (!chunks.length || chunks.length > 80) throw new Error("CURRICULUM_TEACHING_SCOPE_INVALID");
  return chunks;
}
