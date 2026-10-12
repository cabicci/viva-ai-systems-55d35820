import { it as test } from 'vitest';
import assert from 'node:assert/strict';
import { approvedChunks, canonicalJson, sha256 } from './assistant-corpus.ts';

async function fixture() {
 const payload={id:'AC-BUS-M01-L01',locale:'en',version:'1',sections:[{id:'concept-1',title:'Cash flow',text:'Money received and paid.'}],quiz:[{correct:3}],privateTeacherNotes:'NEVER_INDEX',privateSubmissions:['PRIVATE']};
 return {course_id:'AC-BUS',lesson_id:payload.id,locale:'en',approved:true,payload,source_sha256:await sha256(canonicalJson(payload))};
}
test('only exact approved section title/text become retrieval content',async()=>{
 const row=await fixture();const chunks=await approvedChunks(row);
 assert.equal(chunks.length,1);assert.equal(chunks[0].content,'Cash flow\nMoney received and paid.');
 assert.equal(JSON.stringify(chunks).includes('PRIVATE'),false);
 assert.equal(JSON.stringify(chunks).includes('correct'),false);
});
test('unapproved, changed, cross-course and cross-locale sources are rejected',async()=>{
 const row=await fixture();
 for(const bad of [{...row,approved:false},{...row,source_sha256:'a'.repeat(64)},
  {...row,course_id:'AC-OTHER'},{...row,locale:'ar-EG'}]) await assert.rejects(approvedChunks(bad));
});
test('canonical UTF-8 source hashing matches existing Python sorted compact JSON',()=>{
 assert.equal(canonicalJson({z:'القيمة',a:{y:true,b:[1,null]}}),'{"a":{"b":[1,null],"y":true},"z":"القيمة"}');
});
test('duplicate sections are rejected rather than overwritten',async()=>{
 const row=await fixture();row.payload.sections.push(row.payload.sections[0]);
 row.source_sha256=await sha256(canonicalJson(row.payload));
 await assert.rejects(approvedChunks(row));
});
