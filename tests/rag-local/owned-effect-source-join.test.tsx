// @vitest-environment jsdom
import React from "react";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
const sdk=vi.hoisted(()=>({actor:"A",listener:null as null|((event:string,session:unknown)=>void),getSession:vi.fn(),insert:vi.fn(),rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{
 auth:{getSession:(...args:unknown[])=>sdk.getSession(...args),onAuthStateChange:(cb:typeof sdk.listener)=>{sdk.listener=cb;return {data:{subscription:{unsubscribe(){}}}};}},
 from:()=>({insert:(row:unknown)=>sdk.insert(row),select:()=>({eq:()=>({maybeSingle:async()=>({data:{current_streak:0,longest_streak:0,last_activity_date:null}})})})}),
 rpc:(...args:unknown[])=>sdk.rpc(...args),
}}));
vi.mock("@/lib/auth-context",()=>({useAuth:()=>({user:{id:sdk.actor}})}));
afterEach(()=>{cleanup();vi.resetModules();vi.clearAllMocks();sdk.listener=null;});
const session=(id:string)=>({data:{session:{user:{id}}}});

it("runs the FULL event module and rejects a late old-session initialization rather than assigning an owned effect to another account",async()=>{
 let resolveInitial!:(v:ReturnType<typeof session>)=>void;
 const initial=new Promise<ReturnType<typeof session>>(resolve=>{resolveInitial=resolve;});
 sdk.getSession.mockReturnValue(initial);sdk.insert.mockResolvedValue({error:null});
 const {logLearnerEvent}=await import("../../src/lib/learner-events");
 const pending=logLearnerEvent({type:"lesson_completed",lessonId:"local-lesson"},{userId:"A",isCurrent:()=>true});
 sdk.listener!("SIGNED_IN",{user:{id:"B"}});resolveInitial(session("A"));await pending;
 expect(sdk.insert).not.toHaveBeenCalled();
 await logLearnerEvent({type:"lesson_completed",lessonId:"local-lesson"},{userId:"B",isCurrent:()=>true});
 expect(sdk.insert).toHaveBeenCalledTimes(1);expect(sdk.insert.mock.calls[0][0].user_id).toBe("B");
});

it("runs the FULL streak hook and suppresses its actual legacy RPC call when the actor changes during its session await",async()=>{
 sdk.actor="A";let resolveSession!:(v:ReturnType<typeof session>)=>void;
 sdk.getSession.mockReturnValue(new Promise(resolve=>{resolveSession=resolve;}));sdk.rpc.mockResolvedValue({data:{},error:null});
 const {useStreak}=await import("../../src/lib/entitlements");
 const query=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false,gcTime:0}}});
 const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={query}>{children}</QueryClientProvider>;
 const hook=renderHook(()=>useStreak(),{wrapper});
 act(()=>hook.result.current.recordActivity({userId:"A",isCurrent:()=>sdk.actor==="A"}));
 await waitFor(()=>expect(sdk.getSession).toHaveBeenCalled());sdk.actor="B";hook.rerender();
 await act(async()=>{resolveSession(session("A"));});expect(sdk.rpc).not.toHaveBeenCalled();
 sdk.getSession.mockResolvedValue(session("B"));
 act(()=>hook.result.current.recordActivity({userId:"B",isCurrent:()=>sdk.actor==="B"}));
 await waitFor(()=>expect(sdk.rpc).toHaveBeenCalledTimes(1));expect(sdk.rpc.mock.calls[0]).toEqual(["record_user_activity"]);
 // This verifies client dispatch/currentness only. The server actor contract
 // and the check-to-call race remain separate, unproven boundaries.
});
