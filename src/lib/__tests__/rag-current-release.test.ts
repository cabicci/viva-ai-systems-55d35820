// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { buildCurrentAiRelease, loadCurrentAiSources } from "../rag/current-source-release";
import { validateCurrentRelease } from "../rag/current-release/corpus";
import { loadCurrentRelease } from "../rag/current-release/corpus.server";
import { confirmationFor, type CurrentOperation } from "../rag/current-release/contracts";
import { executeCurrentRelease } from "../rag/current-release/executor.server";
import { isValidCurrentApproval } from "../../../supabase/functions/assistant-runtime/current-corpus-admission";
import path from "node:path";
const sources = loadCurrentAiSources(path.resolve(import.meta.dirname,"../../.."));
const selected = sources.filter(s => s.record.lessonId === sources[0].record.lessonId);
const release = buildCurrentAiRelease(selected);
const corpus = validateCurrentRelease(release.approval, release.chunks);
const requestId = "11111111-1111-4111-8111-111111111111", executionId="22222222-2222-4222-8222-222222222222";
const leaseToken="33333333-3333-4333-8333-333333333333";
const request = (operation: CurrentOperation) => ({ operation, releaseId:corpus.approval.releaseId,
  requestId, executionId, confirmation: operation==='status'?undefined:confirmationFor(operation,corpus.approval.releaseId) });
const vector = () => Array.from({length:1536},()=>0.25);
const dependencies = () => ({ authorized:vi.fn(async()=>true), load:vi.fn(()=>corpus),
  embed:vi.fn(async(texts:string[])=>({vectors:texts.map(vector)})),
  rpc:vi.fn(async(name:string,_args:Record<string,unknown>):Promise<unknown> => {
    if(name==='rag_current_claim') return {leaseToken,chunkIds:corpus.chunks.slice(0,3).map(c=>c.chunkId)};
    if(name==='rag_reusable_embeddings') return [];
    if(name==='rag_current_reserve_provider') return {reserved:true};
    return {committed:true};
  }) });
describe('current source release and bounded executor',()=>{
  it('admits all current approved sources without changing historical snapshots',()=>{
    const full=loadCurrentRelease(); expect(full.chunks).toHaveLength(3849);
    expect(full.approval.releaseId).toBe('11930da0902e92e5ae6db0f4e3e7f4e23c2fe9a6bef974bb50f04feb946b39f5');
  });
  it('is independent of discovery order and the number of cards',()=>{
    expect(buildCurrentAiRelease([...selected].reverse())).toEqual(release);
    expect(corpus.chunks.length).toBeGreaterThan(0);
  });
  it('rejects missing locales, duplicate ownership and forged source bytes',()=>{
    expect(()=>buildCurrentAiRelease(selected.slice(1))).toThrow('MISSING_LOCALE');
    expect(()=>buildCurrentAiRelease([...selected,selected[0]])).toThrow('DUPLICATE_OR_CROSS_CARD');
    expect(()=>buildCurrentAiRelease(selected.map((s,i)=>i? s:{...s,raw:s.raw+' changed'}))).toThrow('SOURCE_IDENTITY');
  });
  it('rejects altered chunk text before any database or provider call',()=>{
    expect(()=>validateCurrentRelease(corpus.approval,corpus.chunks.map((c,i)=>i?c:{...c,displayText:c.displayText+'!'}))).toThrow('CHUNK_MISMATCH');
  });
  it.each([null,{},[],{...corpus.approval,embeddingDimensions:3}])('fails closed for malformed snapshot %j',a=>{
    expect(isValidCurrentApproval(a as never)).toBe(false);
  });
  it('authorizes before loading full corpus, and rejects changed release/confirmation',async()=>{
    const d=dependencies();d.authorized.mockResolvedValue(false);
    await expect(executeCurrentRelease(request('batch'),d)).rejects.toThrow('FORBIDDEN');expect(d.load).not.toHaveBeenCalled();
    d.authorized.mockResolvedValue(true);
    await expect(executeCurrentRelease({...request('batch'),releaseId:'a'.repeat(64)},d)).rejects.toThrow('RELEASE_CHANGED');
    await expect(executeCurrentRelease({...request('batch'),confirmation:'yes'},d)).rejects.toThrow('CONFIRMATION_REQUIRED');
    expect(d.rpc).not.toHaveBeenCalled();expect(d.embed).not.toHaveBeenCalled();
  });
  it('reserves before the sole provider call and commits only approved rows',async()=>{
    const d=dependencies();expect(await executeCurrentRelease(request('batch'),d)).toMatchObject({committed:true,providerCalls:1});
    expect(d.embed).toHaveBeenCalledExactlyOnceWith(corpus.chunks.slice(0,3).map(c=>c.displayText));
    expect(d.rpc.mock.calls.map(c=>c[0])).toEqual(['rag_current_claim','rag_reusable_embeddings','rag_current_reserve_provider','rag_current_commit']);
    expect((d.rpc.mock.calls.at(-1)![1].p_rows as unknown[])).toHaveLength(3);
  });
  it('does not retry a provider for a replayed or completed request',async()=>{
    const d=dependencies();d.rpc.mockResolvedValue({replayed:true});
    expect(await executeCurrentRelease(request('batch'),d)).toMatchObject({providerCalls:0});expect(d.embed).not.toHaveBeenCalled();
  });
  it('reuses only exact active inputs while storing new release metadata',async()=>{
    const d=dependencies(),c=corpus.chunks[0];
    const original=d.rpc.getMockImplementation()!;
    d.rpc.mockImplementation(async(name,args)=>name==='rag_reusable_embeddings'?[{chunkId:c.chunkId,pathId:c.trackId,lessonId:c.lessonId,
      content:c.displayText,chunkChecksum:c.textChecksum,locale:c.locale,embedding:vector(),model:'text-embedding-3-small',dimensions:1536,
      sourceSha:'a'.repeat(40),registrySourceSha:'a'.repeat(40),indexState:'active',versionStatus:'active',indexingFailed:false}]:original(name,args));
    expect(await executeCurrentRelease(request('batch'),d)).toMatchObject({reusedChunks:1,providerCalls:1});
    expect(d.embed.mock.calls[0][0]).toHaveLength(2);
  });
  it('fails closed on missing reuse migration, invalid vectors and uncertain commit',async()=>{
    for(const mode of ['cache','vector','commit']){
      const d=dependencies(),original=d.rpc.getMockImplementation()!;
      if(mode==='vector')d.embed.mockResolvedValue({vectors:[Array(1536).fill(0)]});
      d.rpc.mockImplementation(async(name,args)=>{
        if(name===(mode==='cache'?'rag_reusable_embeddings':mode==='commit'?'rag_current_commit':''))throw new Error('UNAVAILABLE');
        return original(name,args);
      });
      await expect(executeCurrentRelease(request('batch'),d)).rejects.toThrow();
      expect(d.rpc.mock.calls.at(-1)![0]).toBe('rag_current_fail');
      expect(d.embed).toHaveBeenCalledTimes(mode==='cache'?0:1);
    }
  });
  it('requires an explicit expected active version for activation and rollback',async()=>{
    const d=dependencies();
    for(const operation of ['activate','rollback'] as const)
      await expect(executeCurrentRelease(request(operation),d)).rejects.toThrow('EXPECTED_ACTIVE_REQUIRED');
    await executeCurrentRelease({...request('activate'),expectedActiveVersion:null},d);
    expect(d.rpc).toHaveBeenCalledWith('rag_current_activate',expect.objectContaining({p_expected_active:null}));
    expect(d.embed).not.toHaveBeenCalled();
  });
});
