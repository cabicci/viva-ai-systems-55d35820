import {beforeEach,it,expect,vi} from "vitest";
const f=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc:f.rpc}}));
vi.mock("@/lib/auth-context",()=>({useAuth:()=>({user:null})}));
import {technicalCommand,technicalQuizCommand,reconcileTechnicalQuiz,displayedQuizRevision} from "./client";
let seq=0;const actor=()=>"11111111-1111-4111-8111-"+String(++seq).padStart(12,"0");
beforeEach(()=>{f.rpc.mockReset();sessionStorage.clear();});
it("refuses unversioned quiz/reset before the SDK boundary",async()=>{for(const a of ["quiz","reset_quiz"])await expect(technicalCommand(a,"lesson","en",{})).rejects.toThrow("TECHNICAL_COMMAND_REQUIRED");expect(f.rpc).not.toHaveBeenCalled();});
it("unchanged read and practice actions keep existing RPC shape",async()=>{f.rpc.mockResolvedValue({data:{allowed:true},error:null});await technicalCommand("practice","l","en",{values:["draft"]});expect(f.rpc).toHaveBeenCalledWith("technical_command",{p_action:"practice",p_lesson:"l",p_locale:"en",p_data:{values:["draft"]}});});
it("successful absent status is revision zero and wire command matches the contract",async()=>{const who=actor();f.rpc.mockImplementation(async(_n,p)=>p.p_action==="status"?{data:{progress:{}},error:null}:{data:{allowed:true,command:{requestId:p.p_data._technicalCommand.requestId,appliedRevision:1,currentRevision:1,replayed:false}},error:null});await technicalQuizCommand(who,"lesson","en","reset_quiz",{},0,()=>true);expect(f.rpc.mock.calls[0][1].p_data._technicalCommand).toMatchObject({actorId:who,expectedRevision:0});});
it("existing malformed and unconfirmed progress cannot become zero",async()=>{
 for(const value of [displayedQuizRevision({quizPassed:true},true),displayedQuizRevision(undefined,false)]) {
  await expect(technicalQuizCommand(actor(),"lesson","en","reset_quiz",{},value,()=>true)).rejects.toThrow("TECHNICAL_COMMAND_STATUS_REQUIRED");
 } expect(f.rpc).not.toHaveBeenCalled();expect(displayedQuizRevision(undefined,true)).toBe(0);
});
it("explicit status failure prevents recovery and safe error codes remain distinguishable",async()=>{
 f.rpc.mockResolvedValue({data:null,error:{message:"private database error"}});await expect(reconcileTechnicalQuiz(actor(),"lesson",()=>true)).rejects.toThrow("TECHNICAL_UNAVAILABLE");expect(f.rpc).toHaveBeenCalledTimes(1);
 f.rpc.mockResolvedValue({data:null,error:{message:"TECHNICAL_COMMAND_CONFLICT"}});await expect(technicalCommand("read","lesson","en")).rejects.toMatchObject({code:"TECHNICAL_COMMAND_CONFLICT"});
});
it("reconciliation performs a status read and never invents a mutating command",async()=>{f.rpc.mockResolvedValue({data:{progress:{lesson:{quizRevision:7}}},error:null});await reconcileTechnicalQuiz(actor(),"lesson",()=>true);expect(f.rpc).toHaveBeenCalledTimes(1);expect(f.rpc.mock.calls[0][1].p_action).toBe("status");});
