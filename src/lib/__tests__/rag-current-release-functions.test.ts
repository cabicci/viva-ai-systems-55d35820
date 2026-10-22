// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({role:true as unknown,error:null as unknown,loads:0,rpcs:vi.fn(),embed:vi.fn(),context:{userId:'admin',supabase:{rpc:vi.fn()}}}));
vi.mock('@tanstack/react-start',()=>({createServerFn:()=>({middleware(){return this},inputValidator(){return this},handler(fn:unknown){return fn}})}));
vi.mock('@/integrations/supabase/auth-middleware',()=>({requireSupabaseAuth:{}}));
vi.mock('@/integrations/supabase/client.server',()=>({supabaseAdmin:{rpc:state.rpcs}}));
vi.mock('@/lib/rag/current-release/corpus.server',()=>({loadCurrentRelease:()=>{state.loads++;return {approval:{releaseId:'a'.repeat(64),indexVersion:'version',packages:{one:{}}},chunks:[{}]}}}));
vi.mock('@/lib/rag/lovable-native/embedding-provider.server',()=>({createOpenAiEmbeddingFetcher:state.embed}));
import { currentRagRequestSchema, getCurrentRagRelease, runCurrentRagRelease } from '../rag-current-release.functions';
const invoke=(fn:unknown,data?:unknown)=>(fn as (args:unknown)=>Promise<unknown>)({context:state.context,data});
beforeEach(()=>{
 vi.clearAllMocks();state.role=true;state.error=null;state.loads=0;
 state.context.supabase.rpc.mockImplementation(async()=>({data:state.role,error:state.error}));
 state.rpcs.mockResolvedValue({data:{executionId:null,state:null},error:null});
});
describe('current release server boundary',()=>{
 it('identifies a lost database transport response without replay or private diagnostics',async()=>{
  state.rpcs.mockRejectedValue(new TypeError('private network details'));
  await expect(invoke(getCurrentRagRelease)).rejects.toThrow('CURRENT_DATABASE_TRANSPORT_UNAVAILABLE');
  expect(state.rpcs).toHaveBeenCalledTimes(1);expect(state.embed).not.toHaveBeenCalled();
 });
 it('keeps a database SQLSTATE while discarding sensitive row/message details',async()=>{
  state.rpcs.mockResolvedValue({data:null,error:{code:'23514',message:'private row and service-key details'}});
  await expect(invoke(getCurrentRagRelease)).rejects.toThrow('CURRENT_DATABASE_23514');
 });
 it.each([false,null,'true',1])('requires an exact trusted admin grant %j',async role=>{
  state.role=role;
  await expect(invoke(getCurrentRagRelease)).rejects.toThrow('FORBIDDEN');
  await expect(invoke(runCurrentRagRelease,{})).rejects.toThrow('FORBIDDEN');
  expect(state.loads).toBe(0);expect(state.rpcs).not.toHaveBeenCalled();expect(state.embed).not.toHaveBeenCalled();
 });
 it('returns only counts and sanitized status, never source text/vectors',async()=>{
  expect(await invoke(getCurrentRagRelease)).toEqual({releaseId:'a'.repeat(64),indexVersion:'version',packages:1,chunks:1,status:{executionId:null,state:null}});
  expect(state.context.supabase.rpc).toHaveBeenCalledWith('has_role',{_user_id:'admin',_role:'admin'});
  expect(state.rpcs).toHaveBeenCalledWith('rag_current_status',{p_release_id:'a'.repeat(64)});
  expect(state.embed).not.toHaveBeenCalled();
 });
 it('rejects all browser supplied provenance or corpus fields',()=>{
  const valid={operation:'initialize',requestId:'11111111-1111-4111-8111-111111111111',releaseId:'a'.repeat(64)};
  for(const field of ['material','chunks','embedding','sourceSha','model','packages','vectors'])
   expect(()=>currentRagRequestSchema.parse({...valid,[field]:'forged'})).toThrow();
 });
 it('sanitizes backend diagnostics without leaking payloads',async()=>{
  state.rpcs.mockResolvedValue({data:null,error:{message:'service-key secret detail'}});
  await expect(invoke(getCurrentRagRelease)).rejects.toThrow('CURRENT_DATABASE_UNAVAILABLE');
 });
});
