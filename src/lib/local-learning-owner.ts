import { supabase } from "@/integrations/supabase/client";

/** An observed session lifetime, including sign-out/sign-in to the same account. */
export type LocalLearningOwner = Readonly<{ userId: string | null; generation: object }>;
let owner: LocalLearningOwner = { userId: null, generation: {} };
let initialized = false;
const listeners = new Set<() => void>();

function replaceOwner(userId: string | null) {
  owner = { userId, generation: {} };
  for (const listener of listeners) listener();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("build-logs:changed"));
    window.dispatchEvent(new Event("mission-runtime:changed"));
  }
}

export function localLearningOwner(): LocalLearningOwner {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    const initial = owner;
    supabase.auth.onAuthStateChange((_event, session) => replaceOwner(session?.user?.id ?? null));
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        // A delayed bootstrap read must never replace a newer observed session.
        if (owner === initial) replaceOwner(data.session?.user?.id ?? null);
      })
      .catch(() => {
        /* Unavailable identity keeps anonymous storage isolated. */
      });
  }
  return owner;
}

export function localLearningOwnerCurrent(expected: LocalLearningOwner): boolean {
  return localLearningOwner() === expected;
}

export function subscribeLocalLearningOwner(listener: () => void): () => void {
  listeners.add(listener);
  localLearningOwner();
  return () => {
    listeners.delete(listener);
  };
}

export const buildLogStorageKey = (userId: string | null) => `build-logs:v2:${userId ?? "anon"}`;
export const missionStorageKey = (userId: string | null) =>
  `mission-runtime:v1:${userId ?? "anon"}`;
