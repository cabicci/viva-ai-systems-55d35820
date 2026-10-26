import { createElement } from "react";
export async function askAcademicAssistant(): Promise<never> { throw new Error("PREVIEW_SERVICE_NOT_CONNECTED"); }
export function useRecordJourneyVisit() { throw new Error("PREVIEW_MUST_NOT_RECORD_VISITS"); }

// Disabled optional service; no react-start server/runtime graph in this public preview.
export function AcademicAssistantPanel() { return createElement("p", null, "This service is not connected in the public preview."); }

// There is no SSR request in this isolated client-only public preview.
export const readSsrCookieLocale = () => undefined;
export const readSsrRequestCountryCode = () => undefined;
export const readSsrLocaleRuntimeInputs = () => ({});
