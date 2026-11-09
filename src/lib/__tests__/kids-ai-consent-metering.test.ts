import { describe, it, expect, vi } from 'vitest';
import { runMeteredQuestion, questionRpcFailure, type QuestionIdentity, type QuestionRpc } from '../../../supabase/functions/assistant-runtime/question-metering';

const identity: QuestionIdentity = { userId:'fa080000-0000-4000-8000-000000000001', area:'kids', course:'synthetic-course',
 lesson:'synthetic-lesson', childId:'fa080000-0000-4000-8000-000000000102', locale:'ar-EG',
 requestId:'fa080000-0000-4000-8000-000000000050', query:'Synthetic test question' };
const balance={monthly_remaining:2,purchased_remaining:0};
const stored={status:200,body:{answer:'Authoritative delivery',citations:[]}};
const denied=(error='ASSISTANT_AI_CONSENT_CHANGED')=>({ok:false as const,status:403,error});
type Options={consent?:boolean,reserveDenied?:boolean,replay?:boolean,sourceAllowed?:boolean,
 settlementDenied?:boolean,cleanupThrows?:boolean,deliveryDenied?:boolean,deliveryThrows?:boolean,deliveryMalformed?:boolean};
function setup(options:Options={}) {
 const calls:{name:string,args:Record<string,unknown>}[]=[];
 let settlements=0;
 const rpc:QuestionRpc=async(name,args)=>{
  calls.push({name,args});
  if(name==='kids_ai_consent_context')return {ok:true,data:{allowed:options.consent!==false}};
  if(name==='reserve_assistant_question')return options.reserveDenied?denied():{ok:true,data:options.replay?
   {allowed:false,replay:true,status:'replay',response:{status:200,body:{answer:'Stale replay'}},balance}:
   {allowed:true,replay:false,status:'reserved',balance}};
  if(name==='settle_assistant_question'){
   settlements++;
   if(options.settlementDenied&&settlements===1)return denied('ASSISTANT_AI_CONSENT_REQUIRED');
   if(options.cleanupThrows&&settlements>1)throw Error('Synthetic cleanup transport uncertainty');
   return {ok:true,data:{status:'settled',response:{status:200,body:{answer:'Producer response'}},charged_units:1,balance}};
  }
  if(name==='assistant_question_delivery'){
   if(options.deliveryThrows)throw Error('Synthetic delivery transport failure');
   if(options.deliveryDenied)return denied();
   return {ok:true,data:options.deliveryMalformed?{status:'settled',response:null,charged_units:1}:
    {status:'settled',response:stored,charged_units:1,balance}};
  }
  throw Error('Unexpected synthetic RPC: '+name);
 };
 const execute=vi.fn(async()=>({outcome:'answered' as const,status:200,body:{answer:'Untrusted generated answer'}}));
 const replayAllowed=vi.fn(async()=>options.sourceAllowed!==false);
 return {calls,rpc,execute,replayAllowed,run:(area:QuestionIdentity['area']='kids')=>runMeteredQuestion({...identity,area},rpc,execute,replayAllowed)};
}

describe('actual shared question meter: child purpose consent and final delivery',()=>{
 it('denies before reservation or execution when explicit consent is absent',async()=>{
  const s=setup({consent:false});expect(await s.run()).toMatchObject({status:403,body:{error:'ASSISTANT_AI_CONSENT_REQUIRED'}});
  expect(s.calls.map(x=>x.name)).toEqual(['kids_ai_consent_context']);expect(s.execute).not.toHaveBeenCalled();
 });
 it('keeps native reservation authoritative if consent changes after preflight',async()=>{
  const s=setup({reserveDenied:true});expect((await s.run()).status).toBe(403);
  expect(s.calls.map(x=>x.name)).toEqual(['kids_ai_consent_context','reserve_assistant_question']);expect(s.execute).not.toHaveBeenCalled();
 });
 it('delivers only the newly authorized persisted response after settlement',async()=>{
  const s=setup();const result=await s.run();expect(result).toEqual({status:200,body:{...stored.body,balance,chargedUnits:1}});
  expect(s.calls.map(x=>x.name)).toEqual(['kids_ai_consent_context','reserve_assistant_question','settle_assistant_question','assistant_question_delivery']);
  expect(s.calls[0].args).toEqual({p_user:identity.userId,p_profile:identity.childId});
  expect(s.calls[3].args).toMatchObject({p_user_id:identity.userId,p_request_id:identity.requestId,p_fingerprint:expect.stringMatching(/^[a-f0-9]{64}$/)});
 });
 it('retires a denied still-reserved result with the existing system-failure path',async()=>{
  const s=setup({settlementDenied:true});const result=await s.run();expect(result).toEqual({status:403,body:{ok:false,error:'ASSISTANT_AI_CONSENT_REQUIRED',citations:[]}});
  const settlements=s.calls.filter(x=>x.name==='settle_assistant_question');expect(settlements).toHaveLength(2);
  expect(settlements[0].args.p_outcome).toBe('answered');expect(settlements[1].args).toMatchObject({p_outcome:'system_failure',p_response:{status:403,body:{ok:false,citations:[]}}});
  expect(settlements[1].args.p_fingerprint).toBe(settlements[0].args.p_fingerprint);
  expect(s.calls.some(x=>x.name==='assistant_question_delivery')).toBe(false);
 });
 it('preserves denial on uncertain cleanup and never claims a refund or zero charge',async()=>{
  const s=setup({settlementDenied:true,cleanupThrows:true});const result=await s.run();expect(result.status).toBe(403);
  expect(result.body).not.toHaveProperty('chargedUnits');expect(result.body).not.toHaveProperty('answer');
  expect(s.calls.filter(x=>x.name==='settle_assistant_question')).toHaveLength(2);
 });
 it('suppresses a response if consent changes between settlement and delivery',async()=>{
  const s=setup({deliveryDenied:true});const result=await s.run();expect(result.status).toBe(403);expect(result.body).not.toHaveProperty('answer');
  expect(s.calls.filter(x=>x.name==='settle_assistant_question')).toHaveLength(1);
 });
 it('checks current delivery authority again for replay without generating or charging again',async()=>{
  const s=setup({replay:true});expect(await s.run()).toEqual({status:200,body:{...stored.body,balance,replay:true}});
  expect(s.execute).not.toHaveBeenCalled();expect(s.replayAllowed).toHaveBeenCalledTimes(1);
  expect(s.calls.map(x=>x.name)).toEqual(['kids_ai_consent_context','reserve_assistant_question','assistant_question_delivery']);
 });
 it('never replaces the existing source/access replay check with consent alone',async()=>{
  const s=setup({replay:true,sourceAllowed:false});const result=await s.run();expect(result.status).toBe(403);
  expect(s.calls.some(x=>x.name==='assistant_question_delivery')).toBe(false);expect(s.execute).not.toHaveBeenCalled();
 });
 it('does not revive an old replay if its bound grant changed',async()=>{
  const s=setup({replay:true,deliveryDenied:true});const result=await s.run();expect(result.status).toBe(403);
  expect(result.body).not.toHaveProperty('answer');expect(s.execute).not.toHaveBeenCalled();
 });
 it.each([{deliveryThrows:true},{deliveryMalformed:true}])('fails closed on unusable final-delivery evidence %j',async options=>{
  const s=setup(options);await expect(s.run()).resolves.toMatchObject({status:503,body:{ok:false,citations:[]}});
 });
 it('retains the non-child contract without requiring child consent or delivery RPC',async()=>{
  const s=setup({consent:false});expect(await s.run('technical')).toEqual({status:200,body:{answer:'Producer response',balance,chargedUnits:1}});
  expect(s.calls.map(x=>x.name)).toEqual(['reserve_assistant_question','settle_assistant_question']);
 });
 it('maps only known consent denials and hides unrelated database details',()=>{
  for(const message of ['ASSISTANT_AI_CONSENT_CHANGED','ASSISTANT_AI_CONSENT_REQUIRED','KIDS_AI_PROFILE_UNAVAILABLE'])
   expect(questionRpcFailure({message})).toMatchObject({ok:false,status:403});
  expect(questionRpcFailure({message:'private database detail'})).toEqual({ok:false,status:503,error:'ASSISTANT_BILLING_UNAVAILABLE'});
 });
});
