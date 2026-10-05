// In-memory review persona only; never imported by the production application.
import { createContext, useContext, useState, type ReactNode } from "react";
const Context = createContext({ user: null as { id: string } | null, signOut: async () => {} });
export function ReviewAccount({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>({ id: "isolated-review-persona" });
  return (
    <Context.Provider value={{ user, signOut: async () => setUser(null) }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
export const useEntitlement = () => ({ isAdmin: false });
