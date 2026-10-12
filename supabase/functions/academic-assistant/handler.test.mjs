import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAcademicAssistant } from './handler.ts';

const vector = Array(1536).fill(0.1);
const chunk = (course='AC-BUS',locale='en',lesson='AC-BUS-M02-L03') => ({
  course_id:course,locale,lesson_id:lesson,section_id:'section-1',content:'Approved lesson text.',similarity:.8,
});
function setup(overrides={}) {
  const calls=[];
  const deps={
    enabled:true,
    verifyUser:async()=>{calls.push('auth');return 'user-1'},
    allowed:async()=>{calls.push('allowed');return true},
    consumeLimit:async()=>{calls.push('limit');return true},
    embed:async()=>{calls.push('embed');return vector},
    retrieve:async()=>{calls.push('retrieve');return [chunk()]},
    answer:async()=>{calls.push('answer');return 'From section one.'},
    ...overrides,
  };
  const req=(body={query:'Explain cash flow',courseId:'AC-BUS',lessonId:'AC-BUS-M01-L01',locale:'en'}) =>
    new Request('https://example.test/academic-assistant',{method:'POST',
      headers:{Authorization:'Bearer valid'},body:JSON.stringify(body)});
  return {calls,deps,req};
}

test('disabled service spends nothing',async()=>{
  const x=setup({enabled:false});const r=await handleAcademicAssistant(x.req(),x.deps);
  assert.equal(r.status,503);assert.deepEqual(x.calls,[]);
});
test('browser supplied retrieval evidence and wrong course identity are rejected',async()=>{
  const x=setup();
  for(const body of [
    {query:'hello',courseId:'AC-BUS',lessonId:'AC-BUS-M01-L01',locale:'en',retrievalResults:[chunk()]},
    {query:'hello',courseId:'AC-OTHER',lessonId:'AC-BUS-M01-L01',locale:'en'},
  ]) assert.equal((await handleAcademicAssistant(x.req(body),x.deps)).status,400);
  assert.deepEqual(x.calls,[]);
});
test('denial happens before rate limit and providers',async()=>{
  const x=setup({allowed:async()=>{x.calls.push('allowed');return false}});
  assert.equal((await handleAcademicAssistant(x.req(),x.deps)).status,403);
  assert.deepEqual(x.calls,['auth','allowed']);
});
test('rate limit denial happens before embedding and retrieval',async()=>{
  const x=setup({consumeLimit:async()=>{x.calls.push('limit');return false}});
  assert.equal((await handleAcademicAssistant(x.req(),x.deps)).status,429);
  assert.deepEqual(x.calls,['auth','allowed','limit']);
});
test('same course all lessons allowed, cross course and cross locale excluded',async()=>{
  const x=setup({retrieve:async()=>[chunk('AC-OTHER'),chunk('AC-BUS','ar-EG'),chunk()]});
  const r=await handleAcademicAssistant(x.req(),x.deps);
  assert.equal(r.status,200);
  assert.deepEqual((await r.json()).sources,[{lessonId:'AC-BUS-M02-L03',sectionId:'section-1'}]);
  assert.ok(x.calls.includes('answer'));
});
test('no same-course evidence yields a grounded abstention without LLM',async()=>{
  const x=setup({retrieve:async()=>[chunk('AC-OTHER')]});
  const r=await handleAcademicAssistant(x.req(),x.deps);
  assert.equal(r.status,200);assert.deepEqual((await r.json()).sources,[]);
  assert.equal(x.calls.includes('answer'),false);
});
test('retrieval error fails closed',async()=>{
  const x=setup({retrieve:async()=>{throw Error('rpc down')}});
  const r=await handleAcademicAssistant(x.req(),x.deps);
  assert.equal(r.status,503);assert.equal(x.calls.includes('answer'),false);
});
