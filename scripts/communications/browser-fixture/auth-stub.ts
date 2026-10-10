import { state } from "./state";
export const useAuth = () => ({ user: { id: "synthetic-actor" } });
export const supabase = {
  auth: {
    signUp: async (request: unknown) => {
      state.signups.push(request);
      return { error: null };
    },
  },
};
export const toast = { error: (message: string) => state.errors.push(message), success: () => {} };
