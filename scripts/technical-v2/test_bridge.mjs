import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../../supabase/functions/technical-video-replacement/index.ts',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
const old='11111111-1111-4111-8111-111111111111',next='22222222-2222-4222-8222-222222222222';
const hash='a'.repeat(64),sha='b'.repeat(40),batch='technical-motion-v2-20261011';
const expected={lesson_id:'M01-L01',locale:'ar-EG',video_guid:old,source_sha256:hash};
const request={batchId:batch,lessonId:'M01-L01',locale:'ar-EG',oldGuid:old,newGuid:next,sourceHash:hash,videoSha256:hash,audioSha256:hash,backupSha256:hash,durationSeconds:30,newTts:true,backupRunId:'123',backupArtifactId:'456'};
async function scenario(options={}){
 let handler;const row={...expected,...options.row},receipts=[];const updates=[];
 const db={from(table){let action='select',fields=null,payload=null;const filters=[];
  const q={select(f){fields=f;return q},eq(k,v){filters.push([k,v]);return q},single(){return execute()},upsert(v){action='upsert';payload=v;return q},update(v){action='update';payload=v;return q},then(resolve,reject){return execute().then(resolve,reject)}};
  async function execute(){
   if(table==='technical_video_replacement_batches')return {data:{source_sha:sha,baseline:[expected],enabled:true,expires_at:new Date(Date.now()+60000).toISOString()},error:null};
   if(table==='technical_video_replacement_receipts'){
    if(action==='upsert'){if(!receipts.length)receipts.push(payload);return {error:null};}
    if(action==='update')return {error:null};
    return {data:receipts[0],error:null};
   }
   if(table==='technical_lesson_content'){
    if(action==='update'){
     updates.push(payload);if(filters.every(([k,v])=>row[k]===v)){Object.assign(row,payload);return {data:[{video_guid:row.video_guid}],error:null};}
     return {data:[],error:null};
    }
    return {data:row,error:null};
   }
   throw new Error('Unexpected table '+table);
  }return q;
 }};
 const context={Response,Request,AbortSignal,Date,JSON,Number,String,RegExp,Error,
  createClient:()=>db,Deno:{env:{get:()=> 'server-only'},serve(fn){handler=fn}},
  verifyGithub:async()=>{if(options.authReject)throw Error('bad');return {run_id:'123'}},
  fetch:async()=>new Response(JSON.stringify({isPlayable:!options.notReady,video:{guid:next,videoLibraryId:670679,status:4,width:1920,height:1080,title:batch+':M01-L01__ar-EG',length:30}}),{status:200})};
 vm.runInNewContext(stripTypeScriptTypes(source),context);
 const headers={'Content-Type':'application/json'};if(!options.noAuth)headers['x-github-oidc']='short-lived-test';
 const response=await handler(new Request('https://test.example/',{method:'POST',headers,body:JSON.stringify({...request,...options.body})}));
 return {status:response.status,body:await response.json(),updates,row};
}
for(const options of [{noAuth:true},{authReject:true}]){const r=await scenario(options);assert.equal(r.status,401);assert.equal(r.updates.length,0);}
for(const options of [{body:{locale:'en'}},{body:{lessonId:'M21-L99'}},{body:{oldGuid:next}},{body:{backupArtifactId:''}}]){const r=await scenario(options);assert.equal(r.status,400);assert.equal(r.updates.length,0);}
const unready=await scenario({notReady:true});assert.equal(unready.status,409);assert.equal(unready.updates.length,0);
const conflict=await scenario({row:{source_sha256:'c'.repeat(64)}});assert.equal(conflict.status,409);assert.equal(conflict.row.video_guid,old);
const good=await scenario();assert.equal(good.status,200);assert.equal(good.body.linked,true);assert.equal(good.row.video_guid,next);assert.equal(Object.keys(good.updates[0]).join(','),'video_guid');
console.log('Mapping bridge: 8 failure paths preserve mappings; success changes video_guid only.');
