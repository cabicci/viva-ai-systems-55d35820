import type { ReactNode } from "react";
export const Link = ({ children, ...props }: { children: ReactNode; to: string }) => (
  <a href={props.to}>{children}</a>
);
