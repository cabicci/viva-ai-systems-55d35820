// Fixed public identities for the support webhooks. Never derived from a request.
export const SUPPORT_WHATSAPP_NUMBER = "+19376967661";
export const META_APP_ID = "4372803903032156";
export const FACEBOOK_PAGE_ID = "1298751943326788";
export const INSTAGRAM_ACCOUNT_ID = "17841430598943682";
export const GRAPH_BASE = "https://graph.facebook.com/v25.0";
export const SUPPORT_MODEL = "gpt-4o-mini";

export const OFFICIAL_ORIGIN = "https://masaarat.ai";
export const OFFICIAL_LINKS = {
  home: OFFICIAL_ORIGIN,
  pricing: `${OFFICIAL_ORIGIN}/pricing`,
  contact: `${OFFICIAL_ORIGIN}/contact`,
} as const;
export type OfficialLink = keyof typeof OFFICIAL_LINKS;

/** Secret names only; values are read inside handlers and never logged. */
export const SUPPORT_SECRET_NAMES = {
  whatsapp: ["TWILIO_AUTH_TOKEN", "OPENAI_API_KEY"],
  meta: ["META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN", "META_PAGE_ACCESS_TOKEN", "OPENAI_API_KEY"],
} as const;

export type SupportProvider =
  | "twilio_whatsapp"
  | "meta_messenger"
  | "meta_instagram_dm"
  | "meta_page_comment"
  | "meta_instagram_comment";
