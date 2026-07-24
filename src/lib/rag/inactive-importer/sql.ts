export function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlNullableText(value: string | null | undefined): string {
  if (value == null) return "NULL";
  return sqlLiteral(value);
}

export function sqlVector(values: number[]): string {
  if (values.some((n) => !Number.isFinite(n))) {
    throw new Error("Non-finite vector component");
  }
  return `'[${values.join(",")}]'::extensions.vector`;
}

export function formatVectorLiteral(values: number[]): string {
  if (values.some((n) => !Number.isFinite(n))) {
    throw new Error("Non-finite vector component");
  }
  return `[${values.join(",")}]`;
}
