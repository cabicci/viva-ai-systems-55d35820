import{createRequire}from"node:module";import{join}from"node:path";import{backendOrigin}from"./core";
export function serverClient(origin:string){
 const url=backendOrigin(process.env.SUPABASE_URL,origin),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)throw new Error("READY_EXISTING_SERVER_CREDENTIAL_REQUIRED");
 const require=createRequire(join(process.cwd(),"package.json")),{createClient}=require("@supabase/supabase-js");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
class ReadyRpcFailure extends Error{constructor(readonly diagnostic:Record<string,unknown>){super('READY_RPC_UNCONFIRMED');}}
export function safeRpcDiagnostic(error:unknown):Record<string,unknown>{return error instanceof ReadyRpcFailure?error.diagnostic:{code:'UNCLASSIFIED',transport:true};}
export async function rpc(db:any,name:string,args:Record<string,unknown>){
 let r:any;try{r=await db.rpc(name,args);}catch{throw new ReadyRpcFailure({rpc:/^rag_current_[a-z_]+$/.test(name)?name:'redacted',transport:true});}
 if(r.error){const code=typeof r.error.code==='string'&&/^[A-Z0-9_]{3,40}$/.test(r.error.code)?r.error.code:'UNCLASSIFIED';
  const message=typeof r.error.message==='string'&&/^(?:CURRENT|READY)_[A-Z0-9_]{1,100}$/.test(r.error.message)&&!/[\r\n]/.test(r.error.message)?r.error.message:undefined;
  throw new ReadyRpcFailure({rpc:/^rag_current_[a-z_]+$/.test(name)?name:'redacted',code,...(message?{message}:{}),...(Number.isInteger(r.status)&&r.status>=100&&r.status<=599?{httpStatus:r.status}:{}),transport:false});}
 return r.data;
}
export async function exactOne(db:any,table:string,columns:string,field:string,value:string){const r=await db.from(table).select(columns).eq(field,value).maybeSingle();if(r.error)throw new Error("READY_READ_UNAVAILABLE");return r.data;}
