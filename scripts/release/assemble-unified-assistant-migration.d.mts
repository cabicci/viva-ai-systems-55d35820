export const files: string[];
export const destination: string;
export interface OperationalManifest {
  schema_version: string;
  postgres_major: number;
  target_project: string;
  target_database_ref: string;
  objects: Record<string, string>;
  [key: string]: unknown;
}
export function withStatementBreakpoints(sql: string): string;
export function assembleMigration(
  sources: { file: string; original: string }[],
  operational: OperationalManifest,
  catalog: string,
  options?: { fixturePins?: boolean },
): { output: string; proof: Record<string, unknown> };
