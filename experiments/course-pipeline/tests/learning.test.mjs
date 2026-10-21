import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkPlan,retrieve} from '../src/learning.mjs';
test('spatial coverage matters more than convenient count',()=>{
 assert.equal(checkPlan([0,2,8,10]),true);
 assert.equal(checkPlan([0,1,2,3]),false);
 assert.equal(checkPlan([0,2,8,12]),false);
 assert.equal(checkPlan([0,0,8,10]),false);
 assert.equal(checkPlan([0,2,8,20]),false);
});
for(const locale of ['ar-EG','en','it','de']){
 const lesson=JSON.parse(readFileSync(new URL(`../course/${locale}.json`,import.meta.url)));
 test(`${locale}: help routes to lesson evidence and rejects unrelated terms`,()=>{
  for(const [query,id] of lesson.faq)assert.equal(retrieve(lesson,query)?.id,id);
  assert.equal(retrieve(lesson,'quantum cryptocurrency bananaphone'),null);
 });
}
