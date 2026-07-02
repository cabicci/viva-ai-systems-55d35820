/** Prefer localized package title for H1; fall back to curriculum lesson title. */
export function resolveLearnDisplayTitle(
  lessonTitle: string,
  localizedPackage: { title?: string } | null | undefined,
): string {
  const pkgTitle = localizedPackage?.title?.trim();
  if (pkgTitle && pkgTitle.length > 0) return pkgTitle;
  return lessonTitle;
}
