import type { SceneAccent } from "../../../src/lesson-cards/types.ts";
import type { ExtractedScript, VideoLocale } from "./types.ts";
import { voiceProfileForLocale } from "./voice-map.ts";

export const ACCENTS: SceneAccent[] = [
  "mint",
  "lavender",
  "peach",
  "yellow",
  "pink",
  "mintDeep",
];

export interface PipelineScene {
  card: string;
  accent: SceneAccent;
  visual: Record<string, unknown>;
  spoken: string;
  voice: string;
  focus?: string;
}

function splitSentences(text: string, max = 3): string[] {
  const parts = text
    .split(/(?<=[.!?؟。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return [text.slice(0, 120)];
  return parts.slice(0, max).map((s) => (s.length > 160 ? `${s.slice(0, 157)}…` : s));
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function buildScenesFromScript(script: ExtractedScript): PipelineScene[] {
  const profile = voiceProfileForLocale(script.locale);
  const scenes: PipelineScene[] = [];
  let accentIdx = 0;
  const nextAccent = () => ACCENTS[accentIdx++ % ACCENTS.length]!;

  const opener = script.sections[0];
  scenes.push({
    card: "TitleCard",
    accent: nextAccent(),
    visual: {
      chip: script.locale,
      title: truncate(script.title, 60),
      highlight: truncate(opener?.text.split(/[.!?؟]/)[0] ?? script.title, 24),
      subtitle: truncate(opener?.text ?? script.title, 140),
    },
    spoken: truncate(opener?.text ?? script.title, 220),
    voice: profile.primaryVoice,
  });

  for (let i = 1; i < script.sections.length; i++) {
    const section = script.sections[i]!;
    const role = section.role.toLowerCase();
    const accent = nextAccent();
    const sentences = splitSentences(section.text, 4);
    const spoken = truncate(section.text, 260);
    const secondary = role.includes("tip") || role.includes("aside");

    if (role.includes("comparison") || section.text.includes("|")) {
      const left = sentences[0] ?? section.text;
      const right = sentences[1] ?? sentences[0] ?? section.text;
      scenes.push({
        card: "CompareCard",
        accent,
        visual: {
          title: truncate(section.heading.replace(/^[^—]+—\s*/, ""), 60),
          left: { label: script.locale === "en" ? "Before" : "قبل", body: truncate(left, 160) },
          right: { label: script.locale === "en" ? "After" : "بعد", body: truncate(right, 160) },
        },
        spoken,
        voice: secondary ? profile.secondaryVoice : profile.primaryVoice,
      });
      continue;
    }

    if (role.includes("glossary") || role.includes("concept")) {
      const term = sentences[0] ?? section.heading;
      const definition = sentences[1] ?? section.text;
      scenes.push({
        card: "ConceptCard",
        accent,
        visual: {
          term: truncate(term, 40),
          definition: truncate(definition, 160),
          tag: truncate(section.role, 20),
        },
        spoken,
        voice: profile.primaryVoice,
      });
      continue;
    }

    if (role.includes("quiz") || section.heading.toLowerCase().includes("quiz")) {
      scenes.push({
        card: "CTACard",
        accent,
        visual: {
          eyebrow: script.locale === "en" ? "Your turn" : "دورك الآن",
          title: truncate(section.heading, 60),
          highlight: truncate(sentences[0] ?? script.title, 24),
          tagline: truncate(sentences.slice(0, 2).join(" "), 140),
        },
        spoken,
        voice: profile.secondaryVoice,
      });
      continue;
    }

    if (role.includes("mission")) {
      scenes.push({
        card: "CTACard",
        accent,
        visual: {
          eyebrow: script.locale === "en" ? "Mission" : "المهمة",
          title: truncate(section.heading, 60),
          highlight: truncate(script.title, 24),
          tagline: truncate(sentences.slice(0, 2).join(" "), 140),
        },
        spoken,
        voice: profile.primaryVoice,
      });
      continue;
    }

    scenes.push({
      card: "BulletsCard",
      accent,
      visual: {
        title: truncate(section.heading.replace(/^[^—]+—\s*/, ""), 60),
        bullets: sentences.map((s) => truncate(s, 80)).slice(0, 5),
      },
      spoken,
      voice: secondary ? profile.secondaryVoice : profile.primaryVoice,
    });
  }

  const hasQuiz = script.sections.some((s) => s.role.toLowerCase().includes("quiz"));
  if (!hasQuiz) {
    scenes.push({
      card: "CTACard",
      accent: nextAccent(),
      visual: {
        eyebrow: script.locale === "en" ? "Next step" : "الخطوة التالية",
        title: script.locale === "en" ? "Keep going" : "تابع التعلم",
        highlight: truncate(script.title, 24),
        tagline:
          script.locale === "en"
            ? "Apply this lesson, then continue to the next one."
            : "طبّق ما تعلمته، ثم انتقل إلى الدرس التالي.",
      },
      spoken:
        script.locale === "en"
          ? "Apply what you learned in this lesson, then continue to the next one."
          : "طبّق ما تعلمته في هذا الدرس، ثم تابع إلى الدرس التالي.",
      voice: profile.primaryVoice,
    });
  }

  return scenes;
}

export function scenesToRemotionVisuals(scenes: PipelineScene[]) {
  return scenes.map((s) => ({
    card: s.card,
    accent: s.accent,
    ...s.visual,
  }));
}

export function ttsSegmentsFromScenes(scenes: PipelineScene[]) {
  return scenes.map((s, i) => ({
    idx: i + 1,
    voice: s.voice,
    text: s.spoken,
    focus: s.focus ?? "",
  }));
}

export function sceneFramesFromDurations(durationsSec: number[], fps: number, tailFrames: number): number[] {
  return durationsSec.map((d) => Math.ceil(d * fps) + tailFrames);
}
