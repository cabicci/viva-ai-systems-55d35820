export const state = {
  sends: [] as unknown[],
  checks: [] as unknown[],
  signups: [] as unknown[],
  errors: [] as string[],
  phone: null as string | null,
};
(window as unknown as { phoneTest: typeof state }).phoneTest = state;
