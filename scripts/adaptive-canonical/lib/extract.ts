const MAX_CHARS = 12_000;

function clip(text: string, max = MAX_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[... truncated for API review ...]`;
}

/** Pull quoted / template strings from production TS (read-only text parse). */
export function extractProductionText(tsSource: string): {
  summary: string;
  quizMission: string;
} {
  const strings = [...tsSource.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)]
    .map((m) => m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'))
    .filter((s) => s.length > 8 && /[\u0600-\u06FFa-zA-Z]/.test(s));

  const quizBlock = tsSource.match(
    /kind:\s*"quiz"[\s\S]*?correctIndex:\s*(\d+)[\s\S]*?explanation:\s*"([^"]+)"/,
  );
  const missionBlock = tsSource.match(/kind:\s*"mission"[\s\S]*?rubric:\s*\[[\s\S]*?\]/);

  const rubricWeights = [
    ...tsSource.matchAll(/weight:\s*(\d+)/g),
  ].map((m) => m[1]);

  const quizMissionParts: string[] = [];
  if (quizBlock) {
    quizMissionParts.push(
      `QUIZ correctIndex: ${quizBlock[1]}\nQUIZ explanation: ${quizBlock[2]}`,
    );
  }
  if (missionBlock) {
    quizMissionParts.push(`MISSION BLOCK:\n${missionBlock[0].slice(0, 4000)}`);
  }
  if (rubricWeights.length) {
    quizMissionParts.push(`RUBRIC weights found: ${rubricWeights.join(", ")}`);
  }

  return {
    summary: clip(strings.join("\n\n")),
    quizMission: clip(quizMissionParts.join("\n\n---\n\n"), 6000),
  };
}

export function extractCanonicalSections(md: string): {
  metadata: string;
  yamlBlock: string;
  msaSection: string;
  summary: string;
  quizMission: string;
} {
  const metadataMatch = md.match(/## 1\. Metadata[\s\S]*?(?=## 2\.)/);
  const yamlMatch = md.match(/```yaml\n([\s\S]*?)```/);
  const msaMatch = md.match(/## 4\. Arabic MSA canonical lesson text([\s\S]*?)(?=## 5\.)/);

  const metadata = metadataMatch?.[0] ?? "";
  const yamlBlock = yamlMatch?.[1] ?? "";
  const msaSection = msaMatch?.[1]?.trim() ?? "";

  const quizMissionParts: string[] = [];
  if (yamlBlock) {
    const mission = yamlBlock.match(/mission:[\s\S]*?(?=\ntermsLocked:|$)/);
    const quiz = yamlBlock.match(/quizAnswer:[\s\S]*?(?=\n|$)/);
    if (mission) quizMissionParts.push(mission[0]);
    if (quiz) quizMissionParts.push(quiz[0]);
    const weights = [...yamlBlock.matchAll(/weight:\s*(\d+)/g)].map((m) => m[1]);
    if (weights.length) {
      quizMissionParts.push(`YAML rubric weights: ${weights.join(", ")}`);
    }
    const correct = yamlBlock.match(/correctIndex:\s*(\d+)/);
    if (correct) quizMissionParts.push(`YAML correctIndex: ${correct[1]}`);
  }

  return {
    metadata: clip(metadata, 3000),
    yamlBlock: clip(yamlBlock, 6000),
    msaSection,
    summary: clip(`${metadata}\n\n---\n\n${msaSection}`, MAX_CHARS),
    quizMission: clip(quizMissionParts.join("\n\n"), 6000),
  };
}

export function localCanonicalHeuristics(
  lessonId: string,
  md: string,
): { hardBlockers: string[]; softNotes: string[] } {
  const hardBlockers: string[] = [];
  const softNotes: string[] = [];

  if (!/reviewStatus.*draft\s*\/\s*not production-ready/i.test(md)) {
    if (/production-ready(?!\s*until)/i.test(md) && !/not production-ready/i.test(md)) {
      hardBlockers.push("reviewStatus may falsely imply production-ready");
    }
  }
  if (/humanReviewerSignOff.*approved/i.test(md) && !/pending/i.test(md)) {
    // approved sign-offs exist on some drafts — not a blocker if explicitly recorded
  }
  if (!/slugValidation:/i.test(md)) {
    hardBlockers.push("missing slugValidation block");
  }
  if (!/## 4\. Arabic MSA canonical lesson text/i.test(md)) {
    hardBlockers.push("missing §4 MSA canonical lesson text");
  }

  const msa = md.match(/## 4\. Arabic MSA canonical lesson text([\s\S]*?)(?=## 5\.)/)?.[1] ?? "";
  const msaChars = msa.replace(/\s+/g, " ").trim().length;
  if (msaChars < 400) {
    hardBlockers.push(
      `canonical §4 too thin for final lesson/video script (${msaChars} chars)`,
    );
  } else if (msaChars < 900) {
    softNotes.push(`§4 MSA text relatively short (${msaChars} chars) — read-aloud/video polish may be needed`);
  }

  if (!lessonId) {
    hardBlockers.push("empty lessonId");
  }

  return { hardBlockers, softNotes };
}
