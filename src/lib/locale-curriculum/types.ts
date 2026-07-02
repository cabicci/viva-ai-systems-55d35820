import type { PathId } from "@/lib/curriculum-data";

export type CurriculumPathLabelField = "title" | "tagline";

export type CurriculumModuleLabelField = "title" | "subtitle";

export type CurriculumPathLabels = {
  title: string;
  tagline: string;
};

export type CurriculumModuleLabels = {
  title: string;
  subtitle: string;
};

export type LocaleCurriculumLabelsFile = {
  paths: Partial<Record<PathId, CurriculumPathLabels>>;
  modules: Record<string, CurriculumModuleLabels>;
};
