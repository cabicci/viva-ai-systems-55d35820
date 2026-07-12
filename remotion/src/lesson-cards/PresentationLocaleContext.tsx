import { createContext, useContext } from "react";
import type { PresentationLocale } from "./presentationChrome";

export const PresentationLocaleContext = createContext<
  PresentationLocale | undefined
>(undefined);

export const usePresentationLocale = (): PresentationLocale | undefined =>
  useContext(PresentationLocaleContext);
