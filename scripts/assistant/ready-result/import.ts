// Owner-operated ready-result transfer only. No new HTTP endpoint or provider implementation.
import{readFileSync,writeFileSync,renameSync,existsSync}from"node:fs";import{gunzipSync}from"node:zlib";
import{TARGET_PROJECT,TARGET_ORIGIN,sha}from"./core";import{serverClient}from"./client";import{validateEnvelope,readyImport,type Checkpoint}from"./import-core";
const args=new Map<string,string>();for(const arg of process.argv.slice(2)){const m=/^--(project|mode|input|expected-sha256|checkpoint|max-batches|expected-active)=(.+)$/.exec(arg);if(!m||args.has(m[1]))throw new Error("READY_IMPORT_ARGUMENT_INVALID");args.set(m[1],m[2]);}
const mode=args.get("mode")??"preflight",file=args.get("input"),expected=args.get("expected-sha256"),checkpointPath=args.get("checkpoint"),max=Number(args.get("max-batches")??"1");
if(args.get("project")!==TARGET_PROJECT||!file||!expected||!/^[a-f0-9]{64}$/.test(expected)||!["preflight","import","validate","activate","reconcile","prepare-recovery","readback-recovery"].includes(mode)||!Number.isSafeInteger(max)||max<1||max>61||(mode!=="preflight"&&!checkpointPath))throw new Error("READY_IMPORT_EXACT_SCOPE_REQUIRED");
try{
 const bytes=readFileSync(file);if(sha(bytes)!==expected)throw new Error("READY_TRANSFER_FILE_DIGEST_MISMATCH");
 const envelope=JSON.parse(gunzipSync(bytes,{maxOutputLength:256*1024*1024}).toString("utf8")),rows=validateEnvelope(envelope);
 const checkpointBytes=checkpointPath&&existsSync(checkpointPath)?readFileSync(checkpointPath):undefined;
 let checkpoint:Checkpoint|undefined=checkpointBytes?JSON.parse(checkpointBytes.toString('utf8')):undefined;
 const db=serverClient(TARGET_ORIGIN);
 await readyImport({db,rows,artifactSha256:expected,mode:mode as never,maxBatches:max,expectedActive:args.get("expected-active"),checkpoint,checkpointRawSha256:checkpointBytes?sha(checkpointBytes):undefined,
  save(value){if(!checkpointPath)throw new Error("READY_CHECKPOINT_PATH_REQUIRED");const temporary=checkpointPath+"."+crypto.randomUUID()+".tmp";writeFileSync(temporary,JSON.stringify(value,null,2)+"\n",{flag:"wx",mode:0o600});renameSync(temporary,checkpointPath);},
  log:value=>console.log(JSON.stringify(value)),
 });
}catch(error){console.error(error instanceof Error&&/^READY_[A-Z0-9_]{1,100}$/.test(error.message)?error.message:'READY_IMPORT_STOPPED_PRESERVE_CHECKPOINT');process.exitCode=1;}
