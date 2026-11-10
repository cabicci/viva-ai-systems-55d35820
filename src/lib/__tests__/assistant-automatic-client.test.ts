// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const build='a'.repeat(64),deployment='b'.repeat(64);
vi.mock('../../../scripts/assistant/indexer-build.mjs',()=>({computeAssistantBuildIdentities:()=>({indexerBuild:'a'.repeat(64),deploymentFingerprint:'b'.repeat(64)})}));
let calls:{operation:string;headers:Headers;pruneResponseCache?: boolean}[];
let published:Record<string,unknown>,http:number,tickFails:boolean,tickResults:Record<string,unknown>[];
beforeEach(()=>{vi.resetModules();calls=[];published={schemaVersion:'assistant-auto-v1',enabled:true,indexerBuild:build,deploymentFingerprint:deployment};http=200;tickFails=false;tickResults=[];
 vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_URL','https://fixture.actions.githubusercontent.com/token');vi.stubEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN','synthetic-identity-request');
 vi.spyOn(console,'log').mockImplementation(()=>{});
 vi.stubGlobal('fetch',vi.fn(async(url:string|URL,init:RequestInit={})=>{if(new URL(url).hostname==='fixture.actions.githubusercontent.com'){expect(new URL(url).searchParams.get('audience')).toBe('https://masaarat.ai/api/public/assistant-indexing');return Response.json({value:'synthetic-signed-identity'});}
 expect(String(url)).toBe('https://masaarat.ai/api/public/assistant-indexing');const body=JSON.parse(String(init.body));calls.push({operation:body.operation,headers:new Headers(init.headers),pruneResponseCache:body.pruneResponseCache});expect(Object.keys(body).sort()).toEqual(body.operation==='status'?['operation']:calls.filter(c=>c.operation==='tick').length===1?['operation','pruneResponseCache','requestId']:['operation','requestId']);
 if(body.operation==='status')return Response.json(published,{status:http});if(tickFails)throw Error('ACK uncertain');return Response.json(tickResults.shift()??{done:true,held:0});}));
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
const run=async()=> (await import('../../../scripts/assistant/automatic-worker-client')).runTrustedAutomaticClient();
it.each([403,404])('waits for publication on HTTP %i without any tick',async status=>{http=status;expect(await run()).toBe('awaiting-publication');expect(calls.map(x=>x.operation)).toEqual(['status']);});
it.each(['missing','algorithm','source'])('waits for publication on %s identity mismatch without any tick',async mode=>{if(mode==='missing')delete published.deploymentFingerprint;else published[mode==='algorithm'?'indexerBuild':'deploymentFingerprint']='c'.repeat(64);expect(await run()).toBe('awaiting-publication');expect(calls).toHaveLength(1);});
it.each([401,503])('fails a real authentication/database HTTP %i immediately',async status=>{http=status;await expect(run()).rejects.toThrow('AUTOMATION_REQUEST_UNCONFIRMED');expect(calls.map(x=>x.operation)).toEqual(['status']);});
it('respects a disabled backend after successful readiness proof',async()=>{published.enabled=false;expect(await run()).toBe('disabled');expect(calls.map(x=>x.operation)).toEqual(['status']);});
it('sends both exact main identities on the first and only tick',async()=>{expect(await run()).toBe('complete');expect(calls.map(x=>x.operation)).toEqual(['status','tick']);expect(calls[1].headers.get('x-masaarat-indexer-build')).toBe(build);expect(calls[1].headers.get('x-masaarat-indexer-deployment')).toBe(deployment);});
it('never retries an uncertain state-changing request',async()=>{tickFails=true;await expect(run()).rejects.toThrow('ACK uncertain');expect(calls.map(x=>x.operation)).toEqual(['status','tick']);});

it('requests bounded cache cleanup only on the first tick of a scheduled run',async()=>{
 tickResults=[{progressed:true,area:'kids',cardId:'level-1',completedScopes:1,totalScopes:2},{done:true,held:0}];
 expect(await run()).toBe('complete');
 expect(calls.filter(c=>c.operation==='tick').map(c=>c.pruneResponseCache)).toEqual([true,undefined]);
});

const probe=async(respond:()=>Response)=>{const ops:string[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string|URL,init:RequestInit={})=>{if(new URL(url).hostname==='fixture.actions.githubusercontent.com')return Response.json({value:'synthetic-signed-identity'});
  const body=JSON.parse(String(init.body));expect(body).toEqual({operation:'probe'});ops.push(body.operation);return respond();}));
 const passed=await (await import('../../../scripts/assistant/automatic-worker-client')).runProbe();return {passed,ops};};
it('probe passes only with verified identity and exact deployed source, sending one probe and no tick',async()=>{
 const r=await probe(()=>Response.json({probe:true,identity:'verified',indexerBuild:build,deploymentFingerprint:deployment}));
 expect(r).toEqual({passed:true,ops:['probe']});process.exitCode=0;});
it.each([
 ['build mismatch',()=>Response.json({probe:true,identity:'verified',indexerBuild:'c'.repeat(64),deploymentFingerprint:deployment})],
 ['non-JSON 200',()=>new Response('<html>ok</html>',{status:200,headers:{'content-type':'text/html'}})],
 ['identity rejection',()=>Response.json({code:'AUTOMATION_FORBIDDEN',reason:'AUDIENCE'},{status:401})],
])('probe fails on %s',async(_,respond)=>{const r=await probe(respond);expect(r).toEqual({passed:false,ops:['probe']});expect(process.exitCode).toBe(1);process.exitCode=0;});
