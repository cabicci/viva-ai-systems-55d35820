import { z } from "zod";

const submittedMemo = z.object({
  version: z.string(),
  lesson: z.object({ id: z.literal("AC-MGT-INV-L39") }),
  events: z.array(z.object({
    section: z.string().nullable(),
    result: z.object({ state: z.string() }).nullable(),
  })),
});

export function canReleaseInvestmentUpdate(delivery: unknown, requestedEdition?: string) {
  const result = submittedMemo.safeParse(delivery);
  return result.success && result.data.version === requestedEdition &&
    result.data.events.some((event) =>
      event.section === "apply" &&
      (event.result?.state === "awaiting_review" || event.result?.state === "submitted"),
    );
}
