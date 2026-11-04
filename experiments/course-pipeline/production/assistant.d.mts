export type AssistantServices={
 enabled:boolean;
 authenticate:(request:Request)=>Promise<{id:string}|null>;
 authorize:(actor:{id:string},scope:unknown)=>Promise<boolean>;
 takeQuota:(actor:{id:string},requestId:string)=>Promise<boolean>;
 history:(scope:unknown)=>Promise<{role:string;content:string}[]>;
 retrieve:(scope:unknown)=>Promise<unknown[]>;
 save:(scope:unknown,messages:unknown[],requestId:string)=>Promise<void>;
 complete:(input:{system:string;history:{role:'user'|'assistant';content:string}[];question:string;evidence:unknown[]})=>Promise<unknown>;
};
export function makeSoilAssistant(services:AssistantServices):(request:Request)=>Promise<Response>;
