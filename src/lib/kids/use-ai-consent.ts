import { useCallback,useEffect,useRef,useState } from 'react';
import { useAuth,type AuthGeneration } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import type { SupportedLocale } from '@/lib/locale/types';
import type { AiConsentController,AiConsentProfile,AiConsentState,AiConsentHistoryItem } from './ai-consent-types';
import { parseAiConsentProfiles,parseAiConsentState,parseAiConsentHistory,readAiConsentRpc,verifyAiNoticeText } from './ai-consent-client';

type Actor={generation:AuthGeneration;userId:string;active:boolean};
type Scope={actor:Actor;profileId:string;locale:SupportedLocale;active:boolean};
type Profiles={owner:Actor|null;phase:'loading'|'error'|'ready';items:AiConsentProfile[];next:string|null;loadingMore:boolean;pageError:boolean};
type Snapshot={owner:Scope|null;phase:'idle'|'loading'|'error'|'ready';consent:AiConsentState|null;checked:boolean;busy:boolean;mutationError:boolean;
 historyPhase:'idle'|'loading'|'error'|'ready';history:AiConsentHistoryItem[];historyNext:string|null};
const emptyScope=(owner:Scope|null=null,phase:Snapshot['phase']='idle'):Snapshot=>({owner,phase,consent:null,checked:false,busy:false,mutationError:false,historyPhase:'idle',history:[],historyNext:null});

/** Local currentness fences never replace the native owner/consent authority. */
export function useKidsAiConsent(locale:SupportedLocale):AiConsentController {
 const {user,loading,authGeneration,isAuthGenerationCurrent}=useAuth(),userId=user?.id;
 const environment=useRef({userId,loading,generation:authGeneration,locale});
 environment.current={userId,loading,generation:authGeneration,locale};
 const actorRef=useRef<Actor|null>(null),scopeRef=useRef<Scope|null>(null),selectedRef=useRef('');
 const [profiles,setProfiles]=useState<Profiles>({owner:null,phase:'loading',items:[],next:null,loadingMore:false,pageError:false});
 const [profileId,setProfileId]=useState(''),[profileRevision,setProfileRevision]=useState(0),[consentRevision,setConsentRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<Snapshot>(()=>emptyScope());
 const snapshotRef=useRef(snapshot);snapshotRef.current=snapshot;
 const profileLoad=useRef<{owner:Actor;cursor:string|null}|null>(null);
 const action=useRef<{owner:Scope;refreshPending:boolean;sentHint:Event|null}|null>(null),historyLoad=useRef<{owner:Scope;cursor:string|null}|null>(null);
 const requestIds=useRef<{generation:AuthGeneration;userId:string|undefined;keys:Map<string,string>}>({generation:authGeneration,userId,keys:new Map()});
 if(requestIds.current.generation!==authGeneration||requestIds.current.userId!==userId)
  requestIds.current={generation:authGeneration,userId,keys:new Map()};
 const actorCurrent=useCallback((a:Actor)=>a.active&&actorRef.current===a&&isAuthGenerationCurrent(a.generation)&&
  environment.current.generation===a.generation&&environment.current.userId===a.userId&&!environment.current.loading,[isAuthGenerationCurrent]);
 const scopeCurrent=useCallback((s:Scope)=>s.active&&scopeRef.current===s&&actorCurrent(s.actor)&&
  selectedRef.current===s.profileId&&environment.current.locale===s.locale,[actorCurrent]);
 const invalidateScope=useCallback(()=>{if(scopeRef.current)scopeRef.current.active=false;scopeRef.current=null;},[]);
 const refreshScope=useCallback((s:Scope)=>{
  if(!scopeCurrent(s))return;invalidateScope();setSnapshot(emptyScope(null,'loading'));setConsentRevision(n=>n+1);
 },[invalidateScope,scopeCurrent]);
 const fetchProfiles=useCallback(async(a:Actor,cursor:string|null)=>{
  if(!actorCurrent(a)||profileLoad.current?.owner===a)return;
  const lock={owner:a,cursor};profileLoad.current=lock;
  const current=()=>{if(!actorCurrent(a)||profileLoad.current!==lock)throw Error('RETIRED_AI_CONSENT_ACTOR');};
  if(cursor)setProfiles(p=>p.owner===a?{...p,loadingMore:true,pageError:false}:p);
  try{
   const reply=await readAiConsentRpc(supabase,'kids_ai_consent_profiles',{p_after:cursor},current);
   const page=parseAiConsentProfiles(reply.data);current();
   if(cursor&&(page.next===cursor||page.items.some(x=>x.id<=cursor)))throw Error('INVALID_PROFILE_CURSOR');
   setProfiles(p=>{if(!actorCurrent(a))return p;
    const items=cursor&&p.owner===a?[...p.items,...page.items]:page.items;
    if(new Set(items.map(x=>x.id)).size!==items.length)return {...p,loadingMore:false,pageError:true};
    return {owner:a,phase:'ready',items,next:page.next,loadingMore:false,pageError:false};});
   if(!cursor){const selected=page.items.some(x=>x.id===selectedRef.current)?selectedRef.current:page.items[0]?.id??'';
    selectedRef.current=selected;setProfileId(selected);}
  }catch{if(actorCurrent(a))setProfiles(p=>cursor&&p.owner===a?{...p,loadingMore:false,pageError:true}:
   {owner:a,phase:'error',items:[],next:null,loadingMore:false,pageError:false});}
  finally{if(profileLoad.current===lock)profileLoad.current=null;}
 },[actorCurrent]);

 useEffect(()=>{
  const previous=actorRef.current;
  if(previous)previous.active=false;invalidateScope();
  if(previous?.generation!==authGeneration||previous.userId!==userId){selectedRef.current='';setProfileId('');}
  setSnapshot(emptyScope());
  if(!userId||loading){actorRef.current=null;setProfiles({owner:null,phase:'loading',items:[],next:null,loadingMore:false,pageError:false});return;}
  const owner:Actor={generation:authGeneration,userId,active:true};actorRef.current=owner;
  setProfiles({owner,phase:'loading',items:[],next:null,loadingMore:false,pageError:false});void fetchProfiles(owner,null);
  return()=>{owner.active=false;if(actorRef.current===owner)actorRef.current=null;invalidateScope();};
 },[authGeneration,userId,loading,profileRevision,fetchProfiles,invalidateScope]);

 const verifyState=useCallback(async(value:unknown,s:Scope)=>{
  const current=()=>{if(!scopeCurrent(s))throw Error('RETIRED_AI_CONSENT_SCOPE');};current();
  const state=parseAiConsentState(value,s.profileId);
  if(state.notice)await verifyAiNoticeText(state.notice.texts[s.locale],state.notice.hashes[s.locale],current);
  if(state.acceptedNotice)await verifyAiNoticeText(state.acceptedNotice.text,state.acceptedNotice.textHash,current);
  current();return state;
 },[scopeCurrent]);
 useEffect(()=>{
  invalidateScope();
  const actor=profiles.owner;
  if(!actor||!actorCurrent(actor)||profiles.phase!=='ready'||!profileId||!profiles.items.some(x=>x.id===profileId)){
   setSnapshot(emptyScope());return;
  }
  const owner:Scope={actor,profileId,locale,active:true};scopeRef.current=owner;
  setSnapshot(emptyScope(owner,'loading'));
  const current=()=>{if(!scopeCurrent(owner))throw Error('RETIRED_AI_CONSENT_SCOPE');};
  void(async()=>{try{
   const reply=await readAiConsentRpc(supabase,'kids_ai_consent_state',{p_profile:profileId},current);
   const consent=await verifyState(reply.data,owner);current();setSnapshot({...emptyScope(owner,'ready'),consent});
  }catch{if(scopeCurrent(owner))setSnapshot(emptyScope(owner,'error'));}})();
  let lastFocus=0;
  const refresh=(event?:Event)=>{
   if(!scopeCurrent(owner))return;
   const pending=action.current;
   if(pending?.owner===owner){
    if(event!==pending.sentHint)pending.refreshPending=true;
    return;
   }
   refreshScope(owner);
  };
  const focus=()=>{if(document.visibilityState!=='visible'||Date.now()-lastFocus<250)return;lastFocus=Date.now();refresh();};
  window.addEventListener('kids-ai-consent-changed',refresh);window.addEventListener('kids-consent-changed',refresh);
  window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{owner.active=false;if(scopeRef.current===owner)scopeRef.current=null;
   window.removeEventListener('kids-ai-consent-changed',refresh);window.removeEventListener('kids-consent-changed',refresh);
   window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[profiles.owner,profiles.phase,profileId,locale,consentRevision,actorCurrent,scopeCurrent,invalidateScope,refreshScope,verifyState]);

 const ownsProfiles=!!profiles.owner&&actorCurrent(profiles.owner);
 const owner=snapshot.owner,ownsScope=!!owner&&scopeCurrent(owner);
 const mutate=async(s:Scope,operation:'accept'|'withdraw')=>{
  if(!scopeCurrent(s)||action.current?.owner===s)return;
  const view=snapshotRef.current,state=view.consent;
  if(view.owner!==s||view.phase!=='ready'||!state)return;
  if(operation==='accept'&&(!view.checked||!state.eligible||!state.notice||state.allowed))return;
  if(operation==='withdraw'&&state.event?.action!=='accept')return;
  const key=JSON.stringify([operation,s.profileId,operation==='accept'?state.notice?.id:null,
   operation==='accept'?s.locale:null,operation==='accept'?state.notice?.hashes[s.locale]:null,state.currentEventId]);
  const keys=requestIds.current.keys;let requestId=keys.get(key);
  if(!requestId){try{requestId=crypto.randomUUID();keys.set(key,requestId);}
   catch{if(scopeCurrent(s))setSnapshot(v=>v.owner===s?{...v,mutationError:true}:v);return;}}
  if(!scopeCurrent(s))return;
  const lock={owner:s,refreshPending:false,sentHint:null as Event|null};action.current=lock;
  if(historyLoad.current?.owner===s)historyLoad.current=null;
  setSnapshot(v=>v.owner===s?{...v,busy:true,mutationError:false,historyPhase:'idle',history:[],historyNext:null}:v);
  const current=()=>{if(!scopeCurrent(s)||action.current!==lock)throw Error('RETIRED_AI_CONSENT_SCOPE');};
  try{
   const name=operation==='accept'?'kids_parent_accept_ai_consent':'kids_parent_withdraw_ai_consent';
   const args:Record<string,unknown>={p_profile:s.profileId,p_expected_event_id:state.currentEventId,p_request_id:requestId,
    ...(operation==='accept'?{p_notice:state.notice!.id,p_locale:s.locale,p_hash:state.notice!.hashes[s.locale],p_accepted:true}:{})};
   const reply=await readAiConsentRpc(supabase,name,args,current),consent=await verifyState(reply.data,s);current();
   setSnapshot({...emptyScope(s,'ready'),consent});
   // Payload-free refresh hint, never evidence of revocation/acceptance.
   const hint=new Event('kids-ai-consent-changed');
   lock.sentHint=hint;
   window.dispatchEvent(hint);
  }catch{if(scopeCurrent(s))setSnapshot(v=>v.owner===s?{...v,mutationError:true}:v);}
  finally{
   if(action.current===lock){
    action.current=null;
    if(scopeCurrent(s)){
     if(lock.refreshPending)refreshScope(s);
     else setSnapshot(v=>v.owner===s?{...v,busy:false}:v);
    }
   }
  }
 };
 const loadHistory=async(s:Scope)=>{
  if(!scopeCurrent(s)||historyLoad.current?.owner===s||action.current?.owner===s)return;
  const view=snapshotRef.current;if(view.owner!==s||view.phase!=='ready'||(view.historyPhase==='ready'&&!view.historyNext))return;
  const cursor=view.history.length?view.historyNext:null;if(view.history.length&&!cursor)return;
  const lock={owner:s,cursor};historyLoad.current=lock;setSnapshot(v=>v.owner===s?{...v,historyPhase:'loading'}:v);
  const current=()=>{if(!scopeCurrent(s)||historyLoad.current!==lock)throw Error('RETIRED_AI_CONSENT_HISTORY');};
  try{
   const reply=await readAiConsentRpc(supabase,'kids_ai_consent_history',{p_profile:s.profileId,p_before:cursor},current);
   const page=parseAiConsentHistory(reply.data,s.profileId);current();
   if(cursor&&(page.next===cursor||page.items.some(x=>BigInt(x.sequence)>=BigInt(cursor))))throw Error('INVALID_HISTORY_CURSOR');
   await Promise.all(page.items.map(x=>verifyAiNoticeText(x.text,x.textHash,current)));current();
   const items=[...view.history,...page.items];if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('DUPLICATE_HISTORY_RESPONSE');
   setSnapshot(v=>v.owner===s?{...v,historyPhase:'ready',history:items,historyNext:page.next}:v);
  }catch{if(scopeCurrent(s)&&historyLoad.current===lock)setSnapshot(v=>v.owner===s?{...v,historyPhase:'error'}:v);}
  finally{if(historyLoad.current===lock)historyLoad.current=null;}
 };
 const profileOwner=ownsProfiles?profiles.owner:null;
 return {
  phase:loading?'loading':!userId?'signed-out':!ownsProfiles?'loading':profiles.phase,
  profiles:ownsProfiles?profiles.items:[],profileId:ownsProfiles?profileId:'',moreProfiles:ownsProfiles&&!!profiles.next,
  profilesLoadingMore:ownsProfiles&&profiles.loadingMore,profilesPageError:ownsProfiles&&profiles.pageError,
  selectProfile:id=>{if(!profileOwner||!actorCurrent(profileOwner)||!profiles.items.some(x=>x.id===id)||selectedRef.current===id)return;
   invalidateScope();selectedRef.current=id;setProfileId(id);setSnapshot(emptyScope(null,'loading'));},
  loadMoreProfiles:()=>{if(profileOwner&&profiles.next)void fetchProfiles(profileOwner,profiles.next);},
  refreshProfiles:()=>{if(!profileOwner||!actorCurrent(profileOwner))return;profileOwner.active=false;invalidateScope();setProfileRevision(n=>n+1);},
  consentPhase:ownsScope?snapshot.phase:profileId?'loading':'idle',consent:ownsScope?snapshot.consent:null,
  checked:ownsScope&&snapshot.checked,busy:ownsScope&&snapshot.busy,mutationError:ownsScope&&snapshot.mutationError,
  setChecked:value=>{if(!owner||!scopeCurrent(owner)||action.current?.owner===owner)return;
   setSnapshot(v=>v.owner===owner&&v.phase==='ready'?{...v,checked:value}:v);},
  accept:()=>{if(owner)void mutate(owner,'accept');},withdraw:()=>{if(owner)void mutate(owner,'withdraw');},
  refreshConsent:()=>{if(owner&&action.current?.owner!==owner)refreshScope(owner);},
  historyPhase:ownsScope?snapshot.historyPhase:'idle',history:ownsScope?snapshot.history:[],
  moreHistory:ownsScope&&!!snapshot.historyNext,loadHistory:()=>{if(owner)void loadHistory(owner);},
 };
}
