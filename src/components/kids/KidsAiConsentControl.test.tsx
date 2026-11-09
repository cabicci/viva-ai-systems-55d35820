import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
import type {SupportedLocale} from '@/lib/locale/types';
import {getKidsAiConsentCopy} from '@/lib/kids/ai-consent-copy';
import {KidsAiConsentControl} from './KidsAiConsentControl';
const mock=vi.hoisted(()=>{
 const generation={value:1};return {rpc:vi.fn(),locale:'en' as SupportedLocale,
  auth:{user:{id:'fa080000-0000-4000-8000-000000000001'},loading:false,authGeneration:generation,isAuthGenerationCurrent:(g:unknown)=>g===generation}};
});
vi.mock('@/lib/auth-context',()=>({useAuth:()=>mock.auth}));
vi.mock('@/lib/locale/locale-context',()=>({useLocale:()=>({locale:mock.locale})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:(...args:unknown[])=>mock.rpc(...args)}}));
const p='fa080000-0000-4000-8000-000000000101',n='fa080000-0000-4000-8000-000000000020',oldNotice='fa080000-0000-4000-8000-000000000021';
const e='fa080000-0000-4000-8000-000000000201',w='fa080000-0000-4000-8000-000000000202';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const texts:Record<SupportedLocale,string>={'ar-EG':'SYNTHETIC current Egyptian notice','ar-MSA':'SYNTHETIC current MSA notice','ar-Gulf':'SYNTHETIC current Gulf notice',en:'SYNTHETIC current English notice'};
const historicalText='SYNTHETIC actual accepted English text';
function dto(action:'accept'|'withdraw'|null=null,eligible=true,current=true,recordedLocale:SupportedLocale='en'){
 const event=action?{id:action==='accept'?e:w,action,notice_id:n,locale:recordedLocale,text_hash:sha(texts[recordedLocale]),created_at:'2026-11-05T12:00:00Z'}:null;
 return {profile_id:p,current_event_id:event?.id??null,event,accepted_notice:event?{id:n,version:'SYNTHETIC CURRENT',text:texts[recordedLocale],text_hash:sha(texts[recordedLocale])}:null,
  notice:current?{id:n,version:'SYNTHETIC CURRENT',country_code:'EG',texts,text_hashes:Object.fromEntries(Object.entries(texts).map(([l,t])=>[l,sha(t)]))}:null,
  eligible,allowed:eligible&&current&&action==='accept'};
}
let state:ReturnType<typeof dto>,emptyProfiles:boolean,loseReply:boolean;let seen:Set<string>;
const reply=(data:unknown)=>Promise.resolve({data,error:null});
const writes=()=>mock.rpc.mock.calls.filter(([name])=>String(name).startsWith('kids_parent_'));
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);mock.rpc.mockReset();mock.locale='en';state=dto();emptyProfiles=false;loseReply=false;seen=new Set();
 mock.rpc.mockImplementation((name:string,args:Record<string,unknown>)=>{
  if(name==='kids_ai_consent_profiles')return reply({profiles:emptyProfiles?[]:[{id:p,display_name:'SYNTHETIC child'}],next_cursor:null});
  if(name==='kids_ai_consent_state')return reply(state);
  if(name==='kids_ai_consent_history')return reply({profile_id:p,items:[{id:e,sequence:'1',action:'accept',notice_id:oldNotice,locale:'en',text_hash:sha(historicalText),created_at:'2026-11-04T12:00:00Z',target_event_id:null,version:'SYNTHETIC HISTORICAL',text:historicalText}],next_cursor:null});
  if(name==='kids_parent_accept_ai_consent'){
   if(!seen.has(args.p_request_id as string)){seen.add(args.p_request_id as string);state=dto('accept',true,true,args.p_locale as SupportedLocale);}
   if(loseReply){loseReply=false;return Promise.reject(Error('SYNTHETIC committed reply lost'));}return reply(state);
  }
  if(name==='kids_parent_withdraw_ai_consent'){state=dto('withdraw',false,false);return reply(state);}
  throw Error('Unexpected synthetic RPC '+name);
 });
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('actual parent control/view/controller integration with synthetic SDK',()=>{
 it.each(['en','ar-EG','ar-MSA','ar-Gulf'] as const)('requires explicit opt-in and preserves historical text in %s',async locale=>{
  mock.locale=locale;const words=getKidsAiConsentCopy(locale);render(<KidsAiConsentControl/>);
  const checkbox=await screen.findByRole('checkbox',{name:words.optIn});expect((checkbox as HTMLInputElement).checked).toBe(false);
  const accept=screen.getByRole('button',{name:words.accept});expect((accept as HTMLButtonElement).disabled).toBe(true);expect(writes()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button',{name:words.showHistory}));expect(await screen.findByText(historicalText)).toBeTruthy();expect(writes()).toHaveLength(0);
  const historical=screen.getByText(historicalText);expect(historical.getAttribute('lang')).toBe('en');expect(historical.getAttribute('dir')).toBe('ltr');
  fireEvent.click(checkbox);fireEvent.click(accept);await screen.findByText(words.allowed);
  expect(writes()).toHaveLength(1);expect(writes()[0][1]).toMatchObject({p_profile:p,p_locale:locale,p_hash:sha(texts[locale]),p_accepted:true,p_expected_event_id:null});
 });
 it('offers withdrawal without current notice or general lesson eligibility',async()=>{
  state=dto('accept',false,false);const words=getKidsAiConsentCopy('en');render(<KidsAiConsentControl/>);
  const withdraw=await screen.findByRole('button',{name:words.withdraw});expect((withdraw as HTMLButtonElement).disabled).toBe(false);expect(screen.queryByRole('checkbox')).toBeNull();
  fireEvent.click(withdraw);await screen.findByText((content,element)=>element?.tagName==='P'&&content.startsWith(words.withdrawn+' ·'));
  expect(screen.queryByRole('button',{name:words.withdraw})).toBeNull();expect(writes()).toHaveLength(1);
  expect(writes()[0][1]).toMatchObject({p_profile:p,p_expected_event_id:e});
 });
 it('retains an uncertain choice and retries the same request without falsely claiming rollback',async()=>{
  loseReply=true;const words=getKidsAiConsentCopy('en');render(<KidsAiConsentControl/>);const checkbox=await screen.findByRole('checkbox',{name:words.optIn});
  fireEvent.click(checkbox);fireEvent.click(screen.getByRole('button',{name:words.accept}));await screen.findByText(words.uncertain);
  expect((checkbox as HTMLInputElement).checked).toBe(true);expect(screen.queryByText(words.allowed)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:words.accept}));await screen.findByText(words.allowed);
  expect(writes()).toHaveLength(2);expect(writes()[0][1]).toEqual(writes()[1][1]);expect(seen.size).toBe(1);
 });
 it('hides an empty account-only control after an authoritative empty profile read',async()=>{
  emptyProfiles=true;const rendered=render(<KidsAiConsentControl hideWhenEmpty/>);
  await waitFor(()=>expect(rendered.container.innerHTML).toBe(''));expect(writes()).toHaveLength(0);
 });
});
