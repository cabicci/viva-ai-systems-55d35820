import {act,renderHook,waitFor,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
import type {SupportedLocale} from '@/lib/locale/types';
import {useKidsAiConsent} from './use-ai-consent';
const mock=vi.hoisted(()=>{
 let generation={value:1};let auth={user:{id:'fa080000-0000-4000-8000-000000000001'} as {id:string}|null,loading:false,authGeneration:generation,isAuthGenerationCurrent:(g:unknown)=>g===generation};
 return {rpc:vi.fn(),auth:()=>auth,setAuth:(id:string|null)=>{generation={value:generation.value+1};auth={...auth,user:id?{id}:null,authGeneration:generation};}};
});
vi.mock('@/lib/auth-context',()=>({useAuth:()=>mock.auth()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:(...args:unknown[])=>mock.rpc(...args)}}));
const a='fa080000-0000-4000-8000-000000000001',b='fa080000-0000-4000-8000-000000000002';
const p='fa080000-0000-4000-8000-000000000101',q='fa080000-0000-4000-8000-000000000102';
const n='fa080000-0000-4000-8000-000000000020',e='fa080000-0000-4000-8000-000000000201',w='fa080000-0000-4000-8000-000000000202';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const texts={'ar-EG':'Synthetic Egyptian notice','ar-MSA':'Synthetic MSA notice','ar-Gulf':'Synthetic Gulf notice',en:'Synthetic English notice'};
function dto(profile=p,action:'accept'|'withdraw'|null=null,eligible=true,withNotice=true){
 const event=action?{id:action==='accept'?e:w,action,notice_id:n,locale:'en',text_hash:sha(texts.en),created_at:'2026-11-05T12:00:00Z'}:null;
 return {profile_id:profile,current_event_id:event?.id??null,event,accepted_notice:event?{id:n,version:'Synthetic1',text:texts.en,text_hash:sha(texts.en)}:null,
  notice:withNotice?{id:n,version:'Synthetic1',country_code:'EG',texts,text_hashes:Object.fromEntries(Object.entries(texts).map(([l,t])=>[l,sha(t)]))}:null,
  eligible,allowed:eligible&&withNotice&&action==='accept'};
}
const reply=(data:unknown)=>({error:null,data});
const deferred=<T,>()=>{let resolve!:(v:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return {promise,resolve};};
function adoptedHistory(){
 let resolve!:(v:unknown)=>void,reject!:(reason:unknown)=>void,started=false;
 const promise=new Promise<unknown>((yes,no)=>{resolve=yes;reject=no;});
 const response={then(yes:(v:unknown)=>unknown,no:(reason:unknown)=>unknown){const result=promise.then(yes,no);started=true;return result;}};
 return {response,resolve,reject,started:()=>started};
}
const historyPage=(version='CURRENT-H2')=>reply({profile_id:p,items:[{id:e,sequence:'2',action:'accept',notice_id:n,locale:'en',text_hash:sha(texts.en),created_at:'2026-11-05T12:00:00Z',target_event_id:null,version,text:texts.en}],next_cursor:null});
async function finishRetiredHistory(request:ReturnType<typeof adoptedHistory>,mode:'resolve'|'reject'){
 await act(async()=>{if(mode==='resolve')request.resolve(reply({profile_id:p,items:[],next_cursor:null}));else request.reject(Error('SYNTHETIC retired history failure'));await Promise.resolve();});
}
let states:Map<string,ReturnType<typeof dto>>;
let special:((name:string,args:Record<string,unknown>)=>unknown)|null;
const writes=()=>mock.rpc.mock.calls.filter(([name])=>String(name).startsWith('kids_parent_'));
const mount=(locale:SupportedLocale='en')=>renderHook(({locale}:{locale:SupportedLocale})=>useKidsAiConsent(locale),{initialProps:{locale}});
beforeEach(()=>{
 vi.stubGlobal('crypto',webcrypto);mock.setAuth(a);mock.rpc.mockReset();states=new Map([[p,dto(p)],[q,dto(q)]]);special=null;
 mock.rpc.mockImplementation((name:string,args:Record<string,unknown>)=>{
  const override=special?.(name,args);if(override!==undefined)return override;
  if(name==='kids_ai_consent_profiles')return Promise.resolve(reply({profiles:[{id:p,display_name:'Synthetic one'},{id:q,display_name:'Synthetic two'}],next_cursor:null}));
  if(name==='kids_ai_consent_state')return Promise.resolve(reply(states.get(args.p_profile as string)));
  if(name==='kids_ai_consent_history')return Promise.resolve(reply({profile_id:args.p_profile,items:[],next_cursor:null}));
  if(name==='kids_parent_accept_ai_consent'){const data=dto(args.p_profile as string,'accept');states.set(args.p_profile as string,data);return Promise.resolve(reply(data));}
  if(name==='kids_parent_withdraw_ai_consent'){const data=dto(args.p_profile as string,'withdraw',false,false);states.set(args.p_profile as string,data);return Promise.resolve(reply(data));}
  throw Error('Unexpected synthetic RPC '+name);
 });
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('actual purpose consent controller and owner currentness',()=>{
 it('reads profiles/notice without accepting and starts unchecked',async()=>{
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  expect(h.result.current.profileId).toBe(p);expect(h.result.current.checked).toBe(false);expect(writes()).toHaveLength(0);
  act(()=>h.result.current.accept());expect(writes()).toHaveLength(0);
 });
 it('requires explicit choice and binds exact displayed locale/hash/expected event',async()=>{
  const h=mount('ar-EG');await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));
  expect(writes()[0]).toEqual(['kids_parent_accept_ai_consent',expect.objectContaining({p_profile:p,p_notice:n,p_locale:'ar-EG',p_hash:sha(texts['ar-EG']),p_accepted:true,p_expected_event_id:null,p_request_id:expect.any(String)})]);
  expect(h.result.current.checked).toBe(false);
 });
 it('refuses an ineligible acceptance but allows withdrawal of a retired notice',async()=>{
  states.set(p,dto(p,'accept',false,false));const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>{h.result.current.setChecked(true);h.result.current.accept();});expect(writes()).toHaveLength(0);
  act(()=>h.result.current.withdraw());await waitFor(()=>expect(h.result.current.consent?.event?.action).toBe('withdraw'));
  expect(writes()[0]).toEqual(['kids_parent_withdraw_ai_consent',expect.objectContaining({p_profile:p,p_expected_event_id:e})]);
 });
 it('ignores a delayed profile response after a different profile is selected',async()=>{
  const late=deferred<unknown>();special=(name,args)=>name==='kids_ai_consent_state'&&args.p_profile===p?late.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.profiles).toHaveLength(2));
  act(()=>h.result.current.selectProfile(q));await waitFor(()=>expect(h.result.current.consent?.profileId).toBe(q));
  await act(async()=>late.resolve(reply(dto(p,'accept'))));
  expect(h.result.current.consent?.profileId).toBe(q);expect(h.result.current.checked).toBe(false);
 });
 it('rejects saved action callbacks after profile selection or ABA auth replacement',async()=>{
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.setChecked(true));
  const savedAccept=h.result.current.accept;act(()=>h.result.current.selectProfile(q));act(()=>savedAccept());expect(writes()).toHaveLength(0);
  await waitFor(()=>expect(h.result.current.consent?.profileId).toBe(q));act(()=>h.result.current.setChecked(true));const second=h.result.current.accept;
  mock.setAuth(b);second();mock.setAuth(a);second();expect(writes()).toHaveLength(0);
  h.rerender({locale:'en'});await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));expect(h.result.current.checked).toBe(false);
 });
 it('reuses an uncertain request key and keeps input without claiming no server effect',async()=>{
  let attempts=0;special=(name)=>name==='kids_parent_accept_ai_consent'&&++attempts===1?Promise.reject(Error('Synthetic lost response')):undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.mutationError).toBe(true));expect(h.result.current.checked).toBe(true);
  act(()=>h.result.current.accept());await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));
  expect(writes()).toHaveLength(2);expect(writes()[0][1]).toEqual(writes()[1][1]);
 });
 it('prevents concurrent double mutation before React publishes busy state',async()=>{
  const pending=deferred<unknown>();special=name=>name==='kids_parent_accept_ai_consent'?pending.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.setChecked(true));
  act(()=>{h.result.current.accept();h.result.current.accept();});expect(writes()).toHaveLength(1);expect(h.result.current.busy).toBe(true);
  await act(async()=>pending.resolve(reply(dto(p,'accept'))));await waitFor(()=>expect(h.result.current.busy).toBe(false));
 });
 it('clears unchecked choice on locale change and ignores retired mutation acknowledgement',async()=>{
  const pending=deferred<unknown>();special=name=>name==='kids_parent_accept_ai_consent'?pending.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  h.rerender({locale:'ar-EG'});await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  await act(async()=>pending.resolve(reply(dto(p,'accept'))));expect(h.result.current.checked).toBe(false);expect(h.result.current.consent?.allowed).toBe(false);
 });
 it('rejects malformed or hash-mismatched notice before enabling a choice',async()=>{
  const bad=dto();bad.notice!.texts={...bad.notice!.texts,en:'Not the hashed text'};states.set(p,bad);
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('error'));act(()=>h.result.current.accept());expect(writes()).toHaveLength(0);
 });
 it('does not show stale history after switching profiles and never writes on history read',async()=>{
  const late=deferred<unknown>();special=(name,args)=>name==='kids_ai_consent_history'&&args.p_profile===p?late.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  act(()=>h.result.current.selectProfile(q));await waitFor(()=>expect(h.result.current.consent?.profileId).toBe(q));
  await act(async()=>late.resolve(reply({profile_id:p,items:[],next_cursor:null})));
  expect(h.result.current.history).toEqual([]);expect(h.result.current.historyPhase).toBe('idle');expect(writes()).toHaveLength(0);
 });
 it('can read actual accepted text while purpose/general eligibility is inactive',async()=>{
  states.set(p,dto(p,'withdraw',false,false));special=(name,args)=>name==='kids_ai_consent_history'?Promise.resolve(reply({profile_id:args.p_profile,
   items:[{id:e,sequence:'1',action:'accept',notice_id:n,locale:'en',text_hash:sha(texts.en),created_at:'2026-11-05T12:00:00Z',target_event_id:null,version:'Synthetic1',text:texts.en}],next_cursor:null})):undefined;
  const h=mount('ar-EG');await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(h.result.current.historyPhase).toBe('ready'));expect(h.result.current.history[0]).toMatchObject({text:texts.en,locale:'en'});expect(writes()).toHaveLength(0);
 });
 it('discards an older history response when a consent transition completes',async()=>{
  const late=deferred<unknown>();special=name=>name==='kids_ai_consent_history'?late.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));
  await act(async()=>late.resolve(reply({profile_id:p,items:[],next_cursor:null})));
  expect(h.result.current.historyPhase).toBe('idle');expect(h.result.current.history).toEqual([]);
 });
 it.each(['resolve','reject'] as const)('M08-PARENT-R1: adopted H1 %s cannot alter idle history after acceptance',async mode=>{
  const first=adoptedHistory();special=name=>name==='kids_ai_consent_history'?first.response:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(first.started()).toBe(true));act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));await finishRetiredHistory(first,mode);
  expect(h.result.current.historyPhase).toBe('idle');expect(h.result.current.history).toEqual([]);expect(h.result.current.consent?.allowed).toBe(true);
 });
 it.each(['resolve','reject'] as const)('M08-PARENT-R1: retired H1 %s cannot publish or clear a pending H2 in the same scope',async mode=>{
  const first=adoptedHistory(),second=adoptedHistory();let calls=0;
  special=name=>name==='kids_ai_consent_history'?(++calls===1?first.response:second.response):undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(first.started()).toBe(true));act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(second.started()).toBe(true));await finishRetiredHistory(first,mode);
  expect(h.result.current.historyPhase).toBe('loading');expect(h.result.current.history).toEqual([]);
  await act(async()=>second.resolve(historyPage()));await waitFor(()=>expect(h.result.current.historyPhase).toBe('ready'));
  expect(h.result.current.history.map(x=>x.version)).toEqual(['CURRENT-H2']);expect(h.result.current.moreHistory).toBe(false);
 });
 it.each(['resolve','reject'] as const)('M08-PARENT-R1: retired H1 %s cannot replace completed H2 rows cursor or phase',async mode=>{
  const first=adoptedHistory(),second=adoptedHistory();let calls=0;
  special=name=>name==='kids_ai_consent_history'?(++calls===1?first.response:second.response):undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(first.started()).toBe(true));act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));act(()=>h.result.current.loadHistory());
  await waitFor(()=>expect(second.started()).toBe(true));await act(async()=>second.resolve(historyPage()));
  await waitFor(()=>expect(h.result.current.historyPhase).toBe('ready'));await finishRetiredHistory(first,mode);
  expect(h.result.current.historyPhase).toBe('ready');expect(h.result.current.history.map(x=>x.version)).toEqual(['CURRENT-H2']);expect(h.result.current.moreHistory).toBe(false);
 });
 it('retirement on unmount prevents adoption of an unstarted SDK thenable',async()=>{
  let adopted=0;special=name=>name==='kids_ai_consent_profiles'?{then(){adopted++;}}:undefined;
  const h=mount();h.unmount();await act(async()=>{});expect(adopted).toBe(0);
 });

 it('M08-DEFERRED-REFRESH: reads fresh consent after a refresh hint received during acceptance',async()=>{
  const pending=deferred<unknown>();special=name=>name==='kids_parent_accept_ai_consent'?pending.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  expect(h.result.current.busy).toBe(true);
  states.set(p,dto(p,'withdraw',false,false));
  act(()=>{window.dispatchEvent(new Event('kids-consent-changed'));window.dispatchEvent(new Event('kids-ai-consent-changed'));});
  expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(1);
  await act(async()=>pending.resolve(reply(dto(p,'accept'))));
  await waitFor(()=>expect(h.result.current.consent?.event?.action).toBe('withdraw'));
  expect(h.result.current.consent?.allowed).toBe(false);
  expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(2);
  expect(writes()).toHaveLength(1);
 });

 it('M08-DEFERRED-REFRESH: refreshes once when a write response is lost after a hint',async()=>{
  const pending=adoptedHistory();special=name=>name==='kids_parent_accept_ai_consent'?pending.response:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(pending.started()).toBe(true));
  states.set(p,dto(p,'withdraw',false,false));
  act(()=>window.dispatchEvent(new Event('kids-consent-changed')));
  await act(async()=>pending.reject(Error('Synthetic lost response')));
  await waitFor(()=>expect(h.result.current.consent?.event?.action).toBe('withdraw'));
  expect(h.result.current.consent?.allowed).toBe(false);
  expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(2);
  expect(writes()).toHaveLength(1);
 });
 it('M08-DEFERRED-REFRESH: drops the queued refresh when another user replaces the actor',async()=>{
  const pending=deferred<unknown>();special=name=>name==='kids_parent_accept_ai_consent'?pending.promise:undefined;
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  act(()=>window.dispatchEvent(new Event('kids-ai-consent-changed')));
  act(()=>{mock.setAuth(b);h.rerender({locale:'en'});});
  await waitFor(()=>{
   expect(h.result.current.consentPhase).toBe('ready');
   expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(2);
  });
  await act(async()=>pending.resolve(reply(dto(p,'accept'))));
  expect(h.result.current.consent?.allowed).toBe(false);
  expect(h.result.current.consent?.event).toBeNull();
  expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(2);
  expect(writes()).toHaveLength(1);
 });
 it('M08-DEFERRED-REFRESH: own refresh hint does not cause another read',async()=>{
  const h=mount();await waitFor(()=>expect(h.result.current.consentPhase).toBe('ready'));
  act(()=>h.result.current.setChecked(true));act(()=>h.result.current.accept());
  await waitFor(()=>expect(h.result.current.consent?.allowed).toBe(true));
  expect(mock.rpc.mock.calls.filter(([name])=>name==='kids_ai_consent_state')).toHaveLength(1);
  expect(writes()).toHaveLength(1);
 });
});
