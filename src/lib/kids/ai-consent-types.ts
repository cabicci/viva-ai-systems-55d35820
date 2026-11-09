import type { SupportedLocale } from '@/lib/locale/types';

export type AiConsentProfile = { id:string; displayName:string };
export type AiConsentNotice = { id:string; version:string; countryCode:string;
 texts:Record<SupportedLocale,string>; hashes:Record<SupportedLocale,string> };
export type AiConsentEvent = { id:string; action:'accept'|'withdraw'; noticeId:string;
 locale:SupportedLocale; textHash:string; createdAt:string };
export type AiAcceptedNotice = { id:string; version:string; text:string; textHash:string };
export type AiConsentState = { profileId:string; currentEventId:string|null; event:AiConsentEvent|null;
 acceptedNotice:AiAcceptedNotice|null; notice:AiConsentNotice|null; eligible:boolean; allowed:boolean };
export type AiConsentHistoryItem = AiConsentEvent & { sequence:string; version:string; text:string; targetEventId:string|null };
export type AiConsentHistoryPage = { items:AiConsentHistoryItem[]; next:string|null };
export type AiConsentProfilePage = { items:AiConsentProfile[]; next:string|null };

/** Presentation contract only. Every action is independently fenced by the controller/server. */
export type AiConsentController = {
 phase:'signed-out'|'loading'|'error'|'ready';
 profiles:readonly AiConsentProfile[]; profileId:string; moreProfiles:boolean;
 profilesLoadingMore:boolean; profilesPageError:boolean;
 selectProfile:(id:string)=>void; loadMoreProfiles:()=>void; refreshProfiles:()=>void;
 consentPhase:'idle'|'loading'|'error'|'ready'; consent:AiConsentState|null;
 checked:boolean; setChecked:(value:boolean)=>void; busy:boolean; mutationError:boolean;
 accept:()=>void; withdraw:()=>void; refreshConsent:()=>void;
 historyPhase:'idle'|'loading'|'error'|'ready'; history:readonly AiConsentHistoryItem[];
 moreHistory:boolean; loadHistory:()=>void;
};
