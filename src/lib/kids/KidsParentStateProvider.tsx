import type { ReactNode } from "react";
import { KidsParentStateContext, useKidsParentStateSource } from "./parent-state";

export function KidsParentStateProvider({ children }: { children: ReactNode }) {
  const value = useKidsParentStateSource();
  return (
    <KidsParentStateContext.Provider value={value}>{children}</KidsParentStateContext.Provider>
  );
}
