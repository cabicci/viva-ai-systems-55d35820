import React from "react";
import {renderHook,waitFor,cleanup} from "@testing-library/react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {afterEach,beforeEach,it,expect,vi} from "vitest";
const state=vi.hoisted(()=>({rows:[] as Array<Record<string,any>>,error:null as Error|null,from:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:state.from}}));
vi.mock("@/lib/auth-context",()=>({useAuth:()=>({user:{id:"actor"}})}));
vi.mock("@/lib/entitlements",()=>({useEntitlement:()=>({isAdmin:false})}));
vi.mock("@/components/intro/lessons",()=>({hasIntroLessonContent:()=>true,loadIntroLessonContent:async()=>[{block:{kind:"mission",missionId:"mission",rubric:[{}]}}]}));
import {useMissionGate,isLessonNavigationMissionLocked,emitMissionPassed} from "@/lib/mission-gate";
beforeEach(()=>{state.rows=[];state.error=null;state.from.mockImplementation(()=>{
 const filters:Array<(r:Record<string,any>)=>boolean>=[];const q:any={select:()=>q,order:()=>q,limit:()=>q};
 q.eq=(k:string,v:unknown)=>{filters.push(r=>r[k]===v);return q;};
 q.not=(k:string,op:string,v:string)=>{expect([k,op,v]).toEqual(["submission_metadata","cs",'{"skipped":true}']);filters.push(r=>r.submission_metadata?.skipped!==true);return q;};
 q.contains=(k:string,v:{skipped:boolean})=>{filters.push(r=>r[k]?.skipped===v.skipped);return q;};
 q.maybeSingle=async()=>({data:state.rows.find(r=>filters.every(f=>f(r)))??null,error:state.error});return q;
});});afterEach(cleanup);
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return renderHook(()=>useMissionGate("lesson"),{wrapper:({children})=>React.createElement(QueryClientProvider,{client},children)});}
const marker=(extra:Record<string,unknown>={})=>({id:"marker",user_id:"actor",mission_id:"mission",lesson_id:"lesson",status:"draft",submission_metadata:{skipped:true},...extra});
it.each(["draft","passed","needs_revision"])("restores %s marker as skipped without a score or pass",async(status)=>{state.rows=[marker({status})];const h=mount();await waitFor(()=>expect(h.result.current.kind).toBe("skipped"));expect(isLessonNavigationMissionLocked(h.result.current)).toBe(false);expect(h.result.current).not.toHaveProperty("score");});
it("actual pass takes precedence over newer legacy skipped row",async()=>{state.rows=[marker({status:"passed",score:0}),marker({id:"real",status:"passed",score:73,submission_metadata:{}})];const h=mount();await waitFor(()=>expect(h.result.current).toMatchObject({kind:"passed",score:73}));});
it.each([{user_id:"other"},{lesson_id:"other"},{mission_id:"other"},{submission_metadata:{skipped:"true"}}])("refuses cross-scope/nonboolean marker %j",async(extra)=>{state.rows=[marker(extra)];const h=mount();await waitFor(()=>expect(h.result.current.kind).toBe("needs-mission"));});
it("RPC success invalidation reads durable marker and refresh restores it",async()=>{const h=mount();await waitFor(()=>expect(h.result.current.kind).toBe("needs-mission"));state.rows=[marker()];emitMissionPassed("mission");await waitFor(()=>expect(h.result.current.kind).toBe("skipped"));h.unmount();const re=mount();await waitFor(()=>expect(re.result.current.kind).toBe("skipped"));});
it("query failure never grants continuation",async()=>{state.error=new Error("unavailable");const h=mount();await waitFor(()=>expect(state.from).toHaveBeenCalled());await waitFor(()=>expect(h.result.current.kind).toBe("needs-mission"));expect(isLessonNavigationMissionLocked(h.result.current)).toBe(true);});
