import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({authorize:vi.fn(),rpc:vi.fn(),tick:vi.fn()}));
vi.mock('../assistant-automation/github-identity.server',()=>({verifyIndexerIdentity:mocks.authorize}));
vi.mock('../assistant-automation/store.server',()=>({automationRpc:mocks.rpc}));
vi.mock('../course-system/intake/automatic-worker.server',()=>({automaticTick:mocks.tick}));
import {handlePublicAutomaticIndexing} from '../assistant-automation/public-endpoint.server';
const build='a'.repeat(64),deployment='b'.repeat(64),id='10000000-0000-4000-8000-000000000001';
function request(body:unknown,headers:Record<string,string>={}){return new Request('https://masaarat.ai/api/public/assistant-indexing',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('SUPABASE_URL','https://abyqqeboyrkkwhjpwmtd.supabase.co');vi.stubGlobal('__ASSISTANT_INDEXER_BUILD__',build);vi.stubGlobal('__ASSISTANT_INDEXER_DEPLOYMENT__',deployment);mocks.authorize.mockResolvedValue({verified:true});mocks.rpc.mockResolvedValue({schemaVersion:'assistant-auto-v1',enabled:false});mocks.tick.mockResolvedValue({done:true});});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('only authorized read-only status exposes deployed identities',async()=>{const r=await handlePublicAutomaticIndexing(request({operation:'status'}));expect(r.status).toBe(200);expect(await r.json()).toEqual({schemaVersion:'assistant-auto-v1',enabled:false,indexerBuild:build,deploymentFingerprint:deployment});expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('assistant_auto_status',{});expect(mocks.tick).not.toHaveBeenCalled();});
it('rejects unauthorized requests before status or the worker',async()=>{mocks.authorize.mockRejectedValue(new Error('invalid'));const r=await handlePublicAutomaticIndexing(request({operation:'tick',requestId:id}));expect(r.status).toBe(401);expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.tick).not.toHaveBeenCalled();});
const rejectedHeaders:Record<string,string>[]=[{}, {'x-masaarat-indexer-build':build},{'x-masaarat-indexer-build':build,'x-masaarat-indexer-deployment':'c'.repeat(64)},{'x-masaarat-indexer-build':'c'.repeat(64),'x-masaarat-indexer-deployment':deployment}];
it.each(rejectedHeaders)('fences missing or changed deployment identities before any tick (%j)',async headers=>{const r=await handlePublicAutomaticIndexing(request({operation:'tick',requestId:id},headers));expect(r.status).toBe(503);expect(await r.json()).toEqual({code:'AUTOMATION_OPERATION_UNAVAILABLE'});expect(mocks.tick).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();});
it('matching authenticated tick reaches the existing worker once',async()=>{const r=await handlePublicAutomaticIndexing(request({operation:'tick',requestId:id},{'x-masaarat-indexer-build':build,'x-masaarat-indexer-deployment':deployment}));expect(r.status).toBe(200);expect(mocks.tick).toHaveBeenCalledExactlyOnceWith(id);});
it('keeps body validation and rejects a new maintenance operation',async()=>{const r=await handlePublicAutomaticIndexing(request({operation:'maintenance',requestId:id}));expect(r.status).toBe(400);expect(mocks.tick).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();});

it('forwards cache cleanup only inside the authenticated deployment-fenced tick',async()=>{
 const r=await handlePublicAutomaticIndexing(request({operation:'tick',requestId:id,pruneResponseCache:true},{'x-masaarat-indexer-build':build,'x-masaarat-indexer-deployment':deployment}));
 expect(r.status).toBe(200);expect(mocks.tick).toHaveBeenCalledExactlyOnceWith(id,undefined,true);
});
it.each([{operation:'status',pruneResponseCache:true},{operation:'tick',requestId:id,pruneResponseCache:'true'}])('rejects cache cleanup on read-only or malformed requests (%j)',async body=>{
 const r=await handlePublicAutomaticIndexing(request(body));expect(r.status).toBe(400);expect(mocks.tick).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('cannot use the cleanup flag to bypass deployed source validation',async()=>{
 const r=await handlePublicAutomaticIndexing(request({operation:'tick',requestId:id,pruneResponseCache:true}));expect(r.status).toBe(503);expect(mocks.tick).not.toHaveBeenCalled();
});
