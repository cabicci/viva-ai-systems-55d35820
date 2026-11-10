// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout, withRetry, ReviewTimeoutError, ReviewUncertainError, ReviewRejectedError, reviewHttpError } from "../../scripts/adaptive-canonical/lib/retry.ts";
import { inputFingerprint, assertRequestIdentity } from "../../scripts/adaptive-canonical/lib/input-identity.ts";
afterEach(()=>vi.restoreAllMocks());
function deferred<T>(){let resolve!:(v:T)=>void;let reject!:(e:unknown)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function reviewer(provider:string,fetch_:any,prompt=()=>"synthetic user"){
 const names:any={openai:"createOpenAiReviewer",anthropic:"createAnthropicReviewer",gemini:"createGeminiReviewer"};
 const file="scripts/adaptive-canonical/reviewers/"+provider+".ts";
 const src=readFileSync(file,"utf8"),ast=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true);
 const code=ast.statements.filter(n=>ts.isFunctionDeclaration(n)).map(n=>n.getText(ast)).join("\n");
 const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const globals:any={process:{env:{OPENAI_API_KEY:"synthetic-key",ANTHROPIC_API_KEY:"synthetic-key",GEMINI_API_KEY:"synthetic-key"}},fetch:fetch_,SYSTEM_PROMPT:"synthetic system",buildUserPrompt:prompt,parseReviewJson:()=>({result:"PASS"}),inputFingerprint,assertRequestIdentity,ReviewUncertainError,ReviewRejectedError,reviewHttpError};
 return new Function("exports",...Object.keys(globals),js+`;return ${names[provider]}();`)({},...Object.values(globals));
}
const input={lessonId:"synthetic",productionSummary:"p",canonicalSummary:"c",productionQuizMission:"q",canonicalQuizMission:"m",metadataBlock:"meta"};
const response={ok:true,json:async()=>({choices:[{message:{content:"{}"}}],content:[{type:"text",text:"{}"}],candidates:[{content:{parts:[{text:"{}"}]}}]})};
describe("R09 cancellation and exact reviewer boundaries",()=>{
 it("deadline aborts and never overlaps a deferred task ignoring cancellation or accepts its late result",async()=>{
  const late=deferred<string>();let signal:AbortSignal|undefined;const call=vi.fn((s:AbortSignal)=>{signal=s;return late.promise;});
  await expect(withRetry(()=>withTimeout(call,5),{attempts:3,backoffMs:[1]})).rejects.toBeInstanceOf(ReviewTimeoutError);
  expect(call).toHaveBeenCalledTimes(1);expect(signal?.aborted).toBe(true);late.resolve("late success");await Promise.resolve();expect(call).toHaveBeenCalledTimes(1);
 });
 it("abort-aware request also fails closed instead of automatic paid retry",async()=>{
  const call=vi.fn((signal:AbortSignal)=>new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(new Error("aborted")),{once:true})));
  await expect(withRetry(()=>withTimeout(call,5),{attempts:3,backoffMs:[1]})).rejects.toBeInstanceOf(ReviewTimeoutError);expect(call).toHaveBeenCalledTimes(1);
 });
 it("ambiguous network, server and parser failures are not automatically retried",async()=>{
  for(const error of [new ReviewUncertainError(),reviewHttpError(503),new Error("network timeout"),new Error("reviewer returned no JSON")]){const call=vi.fn(async()=>{throw error;});await expect(withRetry(call,{attempts:3,backoffMs:[1]})).rejects.toBe(error);expect(call).toHaveBeenCalledTimes(1);}
 });
 it("explicit rate-limit rejection retries only after prior attempt settles",async()=>{
  vi.spyOn(console,"warn").mockImplementation(()=>{});let active=0,max=0;const call=vi.fn(async()=>{active++;max=Math.max(max,active);active--;if(call.mock.calls.length===1)throw new ReviewRejectedError(429);return "ok";});
  expect(await withRetry(call,{attempts:2,backoffMs:[1]})).toBe("ok");expect(max).toBe(1);expect(call).toHaveBeenCalledTimes(2);
 });
 const requestContracts = {
  openai: {
   url: "https://api.openai.com/v1/chat/completions",
   headers: { Authorization: "Bearer synthetic-key", "Content-Type": "application/json" },
   body: {
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
     { role: "system", content: "synthetic system" },
     { role: "user", content: "synthetic user" },
    ],
   },
  },
  anthropic: {
   url: "https://api.anthropic.com/v1/messages",
   headers: { "x-api-key": "synthetic-key", "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
   body: {
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    temperature: 0.1,
    system: "synthetic system",
    messages: [{ role: "user", content: "synthetic user" }],
   },
  },
  gemini: {
   url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=synthetic-key",
   headers: { "Content-Type": "application/json" },
   body: {
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    contents: [{ role: "user", parts: [{ text: "synthetic system\n\nsynthetic user" }] }],
   },
  },
 };
 it.each(["openai", "anthropic", "gemini"] as const)("%s preserves the request contract and carries caller cancellation", async (provider) => {
  const fetch_ = vi.fn(async (_url: string, _options: RequestInit) => response);
  const current = reviewer(provider, fetch_);
  const controller = new AbortController();
  await current.reviewLesson(input, controller.signal, current.requestIdentity(input));
  const expected = requestContracts[provider];
  expect(fetch_).toHaveBeenCalledExactlyOnceWith(expected.url, {
   method: "POST",
   headers: expected.headers,
   body: JSON.stringify(expected.body),
   signal: controller.signal,
  });
 });
 it.each(["openai","anthropic","gemini"])("%s rejects changed actual prompt identity before fetch",async provider=>{
  let prompt="synthetic v1";const fetch_=vi.fn(async()=>response),current=reviewer(provider,fetch_,()=>prompt);const identity=current.requestIdentity(input);prompt="synthetic v2";expect(current.requestIdentity(input)).not.toBe(identity);await expect(current.reviewLesson(input,undefined,identity)).rejects.toThrow("changed");expect(fetch_).not.toHaveBeenCalled();expect(identity).toMatch(/^[a-f0-9]{64}$/);
 });
 it.each(["openai","anthropic","gemini"])("%s fetch observes actual timeout abort; remote billing remains uncertain",async provider=>{
  let observed=false;const fetch_=vi.fn((_url:any,options:any)=>new Promise((_,reject)=>options.signal.addEventListener("abort",()=>{observed=true;reject(new Error("aborted"));})));const current=reviewer(provider,fetch_);
  await expect(withRetry(()=>withTimeout(signal=>current.reviewLesson(input,signal,current.requestIdentity(input)),5),{attempts:2,backoffMs:[1]})).rejects.toBeInstanceOf(ReviewTimeoutError);expect(observed).toBe(true);expect(fetch_).toHaveBeenCalledTimes(1);
 });
});
