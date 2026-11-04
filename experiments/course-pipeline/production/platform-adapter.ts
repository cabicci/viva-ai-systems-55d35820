import {callAI} from '../../../src/lib/ai-providers.server';
import {makeSoilAssistant} from './assistant.mjs';
/** Host services MUST use existing authenticated access, billing and server-owned history.
 * This factory is intentionally not registered in the public app while live activation is deferred.
 */
export function createPlatformSoilAssistant(services:{
 enabled:boolean;
 authenticate:(request:Request)=>Promise<{id:string}|null>;
 authorize:(actor:{id:string},scope:unknown)=>Promise<boolean>;
 takeQuota:(actor:{id:string},requestId:string)=>Promise<boolean>;
 history:(scope:unknown)=>Promise<{role:string;content:string}[]>;
 retrieve:(scope:unknown)=>Promise<unknown[]>;
 save:(scope:unknown,messages:unknown[],requestId:string)=>Promise<void>;
}){
 return makeSoilAssistant({...services,complete:async(input:{system:string;history:{role:'user'|'assistant';content:string}[];question:string;evidence:unknown[]})=>{
  const result=await callAI({model:'openai/gpt-4.1-mini-2025-04-14',temperature:0.2,maxTokens:1800,
   responseFormat:{type:'json_object'},messages:[
    {role:'system',content:input.system},...input.history,
    {role:'user',content:JSON.stringify({question:input.question,evidence:input.evidence})}
   ]});
  return result.content;
 }});
}
