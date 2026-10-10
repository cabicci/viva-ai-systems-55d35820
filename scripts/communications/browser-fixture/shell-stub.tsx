import type { ReactNode } from "react";
export const AuthShell = ({ children, title }: { children: ReactNode; title: string }) => (
  <section className="max-w-md mx-auto p-4 border rounded-xl">
    <h1>{title}</h1>
    {children}
  </section>
);
