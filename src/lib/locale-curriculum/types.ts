import type { PathId } from "@/lib/curriculum-data";

export type CurriculumPathLabelField = "title" | "tagline";

export type CurriculumPathLabels = {
  title: string;
  tagline: string;
};

export type LocaleCurriculumLabelsFile = {
  paths: Partial<Record<PathId, CurriculumPathLabels>>;
};
