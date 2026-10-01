/** Dedicated service-job token; no client JWT grants authority. */
export async function authorizedServiceJob(
  request: Request,
  secret: string | undefined,
) {
  if (!secret || secret.length < 32) return false;
  const value = request.headers.get("authorization");
  if (!value || value.length > 1024) return false;
  const hash = async (input: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)),
    );
  const [expected, received] = await Promise.all([
    hash(`Bearer ${secret}`),
    hash(value),
  ]);
  return (
    expected.reduce(
      (difference, byte, i) => difference | (byte ^ received[i]),
      0,
    ) === 0
  );
}
