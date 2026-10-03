/** A failed stream must not prevent another stream's durable retries. */
export async function runMailStreams(streams: Record<string, (() => Promise<unknown>) | null>) {
  const entries = Object.entries(streams);
  const results = await Promise.allSettled(
    entries.map(([, run]) => Promise.resolve().then(() => (run ? run() : null))),
  );
  const body = Object.fromEntries(
    results.map((result, index) => [
      entries[index][0],
      result.status === "fulfilled" ? result.value : { error: "mail_stream_failed" },
    ]),
  );
  return { body, status: results.some((result) => result.status === "rejected") ? 503 : 200 };
}
