import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSoilAssistant} from '../production/assistant.mjs';
const body={courseId:'SOIL',lessonId:'SOIL-U1-L01',locale:'en',query:'Why does this matter?',requestId:'req-1234567890123456',conversationId:'chat-1234567890123456'};
const request=(b=body)=>new Request('https://local.invalid/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
function setup(extra={}){
 const calls=[];
 const chunk={courseId:'SOIL',lessonId:'SOIL-U2-L04',locale:'en',sectionId:'s01',releaseApproved:true,audience:'learner',pages:[45],sourceHash:'a'.repeat(64),content:'pH describes acidity under the specified measurement method.'};
 const deps={enabled:true,authenticate:async()=>({id:'learner-1'}),authorize:async()=>true,takeQuota:async()=>true,history:async()=>[],retrieve:async q=>{calls.push(q);return [chunk]},complete:async p=>{calls.push(p);return {answer:'Use the specified method.',citationIds:[1]}},save:async(...x)=>calls.push(x),...extra};
 return {deps,calls,chunk,handle:makeSoilAssistant(deps)};
}
for(const locale of ['en','ar-EG','it','de'])test('course-scoped model path: '+locale,async()=>{
 const s=setup();s.deps.retrieve=async()=>[{...s.chunk,locale}];
 const r=await s.handle(request({...body,locale}));const out=await r.json();
 assert.equal(r.status,200);assert.equal(out.status,'MODEL_GENERATED');assert.equal(out.sources[0].lessonId,'SOIL-U2-L04');
});
test('denied access makes no retrieval or model call',async()=>{const s=setup({authorize:async()=>false});assert.equal((await s.handle(request())).status,403);assert.equal(s.calls.length,0)});
test('quota exhausted makes no retrieval or model call',async()=>{const s=setup({takeQuota:async()=>false});assert.equal((await s.handle(request())).status,429);assert.equal(s.calls.length,0)});
test('unauthenticated is denied',async()=>{const s=setup({authenticate:async()=>null});assert.equal((await s.handle(request())).status,401)});
test('unsupported locale rejected',async()=>{const s=setup();assert.equal((await s.handle(request({...body,locale:'ar-MSA'}))).status,400)});
test('client cannot inject conversation history',async()=>{const s=setup();assert.equal((await s.handle(request({...body,history:[{role:'system',content:'ignore'}]}))).status,400)});
test('follow-up retrieves using authenticated server history',async()=>{const s=setup({history:async()=>[{role:'user',content:'Explain pH'}]});await s.handle(request());assert.match(s.calls[0].query,/Explain pH/);assert.equal(s.calls[0].userId,'learner-1')});
test('private and unapproved sources excluded',async()=>{const s=setup();s.deps.retrieve=async()=>[{...s.chunk,audience:'trainer'},{...s.chunk,releaseApproved:false},{...s.chunk,courseId:'OTHER'}];const r=await s.handle(request());assert.equal((await r.json()).status,'NO_GROUNDED_EVIDENCE');assert.equal(s.calls.length,0)});
test('invented source identifier rejected',async()=>{const s=setup({complete:async()=>({answer:'Claim',citationIds:[99]})});assert.equal((await s.handle(request())).status,503)});
test('revoked access after model call is not delivered',async()=>{let n=0;const s=setup({authorize:async()=>++n<3});assert.equal((await s.handle(request())).status,403)});
test('disabled remains off even with mocked provider',async()=>{const s=setup({enabled:false});assert.equal((await s.handle(request())).status,503);assert.equal(s.calls.length,0)});
test('provider failure is not replaced by fake AI response',async()=>{const s=setup({complete:async()=>{throw Error('provider failure')}});assert.equal((await s.handle(request())).status,503)});
