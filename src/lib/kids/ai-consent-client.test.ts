import {describe,it,expect} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
import {parseAiConsentProfiles,parseAiConsentState,parseAiConsentHistory,readAiConsentRpc,verifyAiNoticeText} from './ai-consent-client';
const p='fa080000-0000-4000-8000-000000000101',e='fa080000-0000-4000-8000-000000000201',n='fa080000-0000-4000-8000-000000000020';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const texts={'ar-EG':'Egyptian text','ar-MSA':'MSA text','ar-Gulf':'Gulf text',en:'English text'};
const notice={id:n,version:'Synthetic1',country_code:'EG',texts,text_hashes:Object.fromEntries(Object.entries(texts).map(([l,t])=>[l,sha(t)]))};
const state=()=>({profile_id:p,current_event_id:null,event:null,accepted_notice:null,notice,eligible:true,allowed:false});
describe('purpose consent transport and actual notice evidence',()=>{
 it('rejects wrong profile, missing locale and a false allowed claim',()=>{
  expect(()=>parseAiConsentState(state(),e)).toThrow();
  expect(()=>parseAiConsentState({...state(),notice:{...notice,texts:{en:'only'}}},p)).toThrow();
  expect(()=>parseAiConsentState({...state(),allowed:true},p)).toThrow();
  expect(parseAiConsentState(state(),p)).toMatchObject({profileId:p,allowed:false});
 });
 it('rejects cyclic/duplicate profile pages and mismatched last cursors',()=>{
  expect(()=>parseAiConsentProfiles({profiles:[{id:p,display_name:'one'},{id:p,display_name:'two'}],next_cursor:null})).toThrow();
  expect(()=>parseAiConsentProfiles({profiles:[{id:p,display_name:'one'}],next_cursor:e})).toThrow();
 });
 it('preserves the native forty-character limit for supplementary Unicode profile names',()=>{
  const displayName='🌟'.repeat(40);
  expect(parseAiConsentProfiles({profiles:[{id:p,display_name:displayName}],next_cursor:null}).items[0].displayName).toBe(displayName);
 });
 it('keeps exact accepted language/text and validates history identity/order',()=>{
  const row={id:e,sequence:'12',action:'accept',notice_id:n,locale:'en',text_hash:sha(texts.en),created_at:'2026-11-05T12:00:00Z',target_event_id:null,version:'Synthetic1',text:texts.en};
  expect(parseAiConsentHistory({profile_id:p,items:[row],next_cursor:null},p).items[0].text).toBe(texts.en);
  expect(()=>parseAiConsentHistory({profile_id:e,items:[row],next_cursor:null},p)).toThrow();
  expect(()=>parseAiConsentHistory({profile_id:p,items:[row,row],next_cursor:'12'},p)).toThrow();
 });
 it('does not adopt a lazy SDK builder after retirement',async()=>{
  let active=true,started=0;
  const pending={then(){started++;}};const promise=readAiConsentRpc({rpc:()=>pending},'read',{},()=>{if(!active)throw Error('retired');});
  active=false;await expect(promise).rejects.toThrow();expect(started).toBe(0);
 });
 it('rechecks authority after a hostile then getter before invoking it',async()=>{
  let active=true,started=0;const pending={get then(){active=false;return()=>{started++;};}};
  await expect(readAiConsentRpc({rpc:()=>pending},'read',{},()=>{if(!active)throw Error('retired');})).rejects.toThrow();
  expect(started).toBe(0);
 });
 it('rechecks authority after the SDK rpc getter and before calling it',async()=>{
  let active=true,called=0;const sdk={get rpc(){active=false;return()=>{called++;};}};
  await expect(readAiConsentRpc(sdk,'read',{},()=>{if(!active)throw Error('retired');})).rejects.toThrow();expect(called).toBe(0);
 });
 it('does not read response data after authority changes in the error getter',async()=>{
  let active=true,dataRead=0;const response={get error(){active=false;return null;},get data(){dataRead++;return {};}};
  await expect(readAiConsentRpc({rpc:()=>Promise.resolve(response)},'read',{},()=>{if(!active)throw Error('retired');})).rejects.toThrow();expect(dataRead).toBe(0);
 });
 it('rejects text whose actual UTF8 hash differs from its displayed consent evidence',async()=>{
  const previous=globalThis.crypto;Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
  try{await expect(verifyAiNoticeText('Different',sha(texts.en),()=>{})).rejects.toThrow();
   await expect(verifyAiNoticeText(texts.en,sha(texts.en),()=>{})).resolves.toBeUndefined();}
  finally{Object.defineProperty(globalThis,'crypto',{value:previous,configurable:true});}
 });
});
