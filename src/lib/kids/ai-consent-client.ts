import type { SupportedLocale } from '@/lib/locale/types';
import type { AiConsentEvent,AiConsentState,AiConsentProfilePage,AiConsentHistoryPage,AiConsentHistoryItem } from './ai-consent-types';

const locales:readonly SupportedLocale[]=['ar-EG','ar-MSA','ar-Gulf','en'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash=/^[a-f0-9]{64}$/;
const record=(v:unknown):Record<string,unknown>|null=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
const id=(v:unknown):v is string=>typeof v==='string'&&uuid.test(v);
const text=(v:unknown,max=80000):v is string=>typeof v==='string'&&v.trim().length>0&&Array.from(v).length<=max;
const locale=(v:unknown):v is SupportedLocale=>locales.includes(v as SupportedLocale);
const cursor=(v:unknown):v is string=>typeof v==='string'&&/^[1-9]\d{0,18}$/.test(v)&&BigInt(v)<=9223372036854775807n;
const fail=():never=>{throw Error('AI_CONSENT_RESPONSE_UNAVAILABLE');};
function event(v:unknown):AiConsentEvent {
 const e=record(v);
 if(!e||!id(e.id)||!['accept','withdraw'].includes(e.action as string)||!id(e.notice_id)||!locale(e.locale)||
  typeof e.text_hash!=='string'||!hash.test(e.text_hash)||!text(e.created_at,80)||!Number.isFinite(Date.parse(e.created_at)))return fail();
 return {id:e.id,action:e.action as 'accept'|'withdraw',noticeId:e.notice_id,locale:e.locale,textHash:e.text_hash,createdAt:e.created_at};
}
export function parseAiConsentState(value:unknown,profileId:string):AiConsentState {
 const r=record(value);
 if(!r||r.profile_id!==profileId||typeof r.eligible!=='boolean'||typeof r.allowed!=='boolean'||
  !(r.current_event_id===null||id(r.current_event_id)))return fail();
 const e=r.event===null?null:event(r.event);if((e?.id??null)!==r.current_event_id)return fail();
 let acceptedNotice:AiConsentState['acceptedNotice']=null;
 if(r.accepted_notice!==null){const n=record(r.accepted_notice);
  if(!e||!n||n.id!==e.noticeId||!text(n.version,80)||!text(n.text)||n.text_hash!==e.textHash)return fail();
  acceptedNotice={id:e.noticeId,version:n.version,text:n.text,textHash:e.textHash};
 }
 if(!!e!==!!acceptedNotice)return fail();
 let notice:AiConsentState['notice']=null;
 if(r.notice!==null){const n=record(r.notice),t=n&&record(n.texts),h=n&&record(n.text_hashes);
  if(!n||!id(n.id)||!text(n.version,80)||typeof n.country_code!=='string'||!/^[A-Z]{2}$/.test(n.country_code)||!t||!h)return fail();
  const texts={} as Record<SupportedLocale,string>,hashes={} as Record<SupportedLocale,string>;
  for(const l of locales){if(!text(t[l])||typeof h[l]!=='string'||!hash.test(h[l] as string))return fail();texts[l]=t[l] as string;hashes[l]=h[l] as string;}
  notice={id:n.id,version:n.version,countryCode:n.country_code,texts,hashes};
 }
 if(r.allowed&&(!r.eligible||e?.action!=='accept'||!notice||e.noticeId!==notice.id||e.textHash!==notice.hashes[e.locale]))return fail();
 return {profileId,currentEventId:r.current_event_id as string|null,event:e,acceptedNotice,notice,eligible:r.eligible,allowed:r.allowed};
}
export function parseAiConsentProfiles(value:unknown):AiConsentProfilePage {
 const r=record(value);
 if(!r||!Array.isArray(r.profiles)||r.profiles.length>50||!(r.next_cursor===null||id(r.next_cursor)))return fail();
 const items=r.profiles.map(v=>{const p=record(v);if(!p||!id(p.id)||!text(p.display_name,40))return fail();return {id:p.id,displayName:p.display_name};});
 if(new Set(items.map(x=>x.id)).size!==items.length||items.some((x,i)=>i>0&&x.id<=items[i-1].id)||
  (r.next_cursor!==null&&r.next_cursor!==items.at(-1)?.id))return fail();
 return {items,next:r.next_cursor as string|null};
}
export function parseAiConsentHistory(value:unknown,profileId:string):AiConsentHistoryPage {
 const r=record(value);if(!r||r.profile_id!==profileId||!Array.isArray(r.items)||r.items.length>10||!(r.next_cursor===null||cursor(r.next_cursor)))return fail();
 const items:AiConsentHistoryItem[]=r.items.map(v=>{const e=event(v),h=record(v)!;
  if(!cursor(h.sequence)||!text(h.version,80)||!text(h.text)||!(h.target_event_id===null||id(h.target_event_id))||
   ((e.action==='accept')!==(h.target_event_id===null)))return fail();
  return {...e,sequence:h.sequence,version:h.version,text:h.text,targetEventId:h.target_event_id as string|null};});
 if(new Set(items.map(x=>x.id)).size!==items.length||items.some((x,i)=>i>0&&BigInt(x.sequence)>=BigInt(items[i-1].sequence))||
  (r.next_cursor!==null&&r.next_cursor!==items.at(-1)?.sequence))return fail();
 return {items,next:r.next_cursor as string|null};
}
export async function verifyAiNoticeText(value:string,expected:string,current:()=>void):Promise<void>{
 current();const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));current();
 const actual=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)fail();
}

/** Box lazy SDK adoption; a retired thenable is never deliberately started. */
function awaitCurrent(pending:unknown,current:()=>void):Promise<{value:unknown}>{
 return new Promise((resolve,reject)=>{
  const stop=(error:unknown)=>{try{Reflect.apply(Promise.prototype.then,pending,[undefined,()=>{}]);}catch{}reject(error);};
  try{current();}catch(error){stop(error);return;}
  queueMicrotask(()=>{try{
   current();const then=pending!==null&&(typeof pending==='object'||typeof pending==='function')?(pending as PromiseLike<unknown>).then:undefined;current();
   if(typeof then!=='function'){resolve({value:pending});return;}
   Reflect.apply(then,pending,[(value:unknown)=>{try{current();resolve({value});}catch(error){stop(error);}},stop]);
  }catch(error){stop(error);}});
 });
}
export async function readAiConsentRpc(client:unknown,name:string,args:Record<string,unknown>,current:()=>void):Promise<{data:unknown}>{
 current();const fn=(client as {rpc?:unknown}).rpc;current();if(typeof fn!=='function')return fail();
 const pending=Reflect.apply(fn,client,[name,args]);const boxed=await awaitCurrent(pending,current);current();
 const result=record(boxed.value);if(!result)return fail();const error=result.error;current();const data=result.data;current();
 if(error!==null&&error!==undefined)return fail();return {data};
}
