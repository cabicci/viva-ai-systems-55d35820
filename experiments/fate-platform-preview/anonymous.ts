// This preview is always anonymous. No persona, session, subscription or credential.
export const useAuth = () => ({ user: null, session: null, loading: false, signOut: async () => {} });
export const useEntitlement = () => ({ isAdmin: false });
