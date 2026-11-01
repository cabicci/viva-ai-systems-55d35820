import{createRequire}from"node:module";import{join}from"node:path";import{backendOrigin}from"./core";
export function serverClient(origin:string){
 const url=backendOrigin(process.env.SUPABASE_URL,origin),key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key)throw new Error("READY_EXISTING_SERVER_CREDENTIAL_REQUIRED");
 const require=createRequire(join(process.cwd(),"package.json")),{createClient}=require("@supabase/supabase-js");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function rpc(db:any,name:string,args:Record<string,unknown>){const r=await db.rpc(name,args);if(r.error)throw new Error("READY_RPC_UNCONFIRMED");return r.data;}
export async function exactOne(db:any,table:string,columns:string,field:string,value:string){const r=await db.from(table).select(columns).eq(field,value).maybeSingle();if(r.error)throw new Error("READY_READ_UNAVAILABLE");return r.data;}
