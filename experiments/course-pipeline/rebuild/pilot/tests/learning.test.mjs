import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateDecisions,emptyState,restoreState,freshAttempt,escapeHtml} from '../src/logic.mjs';
const load=loc=>JSON.parse(readFileSync(new URL(`../src/content/${loc}.json`,import.meta.url),'utf8'));
const en=load('en');
test('empty or incomplete submissions never pass',()=>{
 assert.equal(evaluateDecisions(en.points,{}).passed,false);
 const a=Object.fromEntries(en.points.map(p=>[p.id,p.answer]));delete a.weather;
 assert.equal(evaluateDecisions(en.points,a).passed,false);
 a.weather='2';assert.equal(evaluateDecisions(en.points,a).passed,false);
});
test('each unsafe site decision prevents a complete pass',()=>{
 const right=Object.fromEntries(en.points.map(p=>[p.id,p.answer]));assert.equal(evaluateDecisions(en.points,right).passed,true);
 for(const p of en.points){const wrong={...right,[p.id]:(p.answer+1)%3};const r=evaluateDecisions(en.points,wrong);assert.equal(r.passed,false,p.id);assert.equal(r.correct,7);}
});
test('fresh assessment retains work but clears assessment answers',()=>{
 const s={...emptyState(),practice:{terrain:1},test:{terrain:1},testSubmitted:true,checklist:['keep','','','',''],attempt:2};
 const n=freshAttempt(s);assert.deepEqual(n.test,{});assert.equal(n.testSubmitted,false);assert.equal(n.attempt,3);assert.deepEqual(n.practice,s.practice);assert.deepEqual(n.checklist,s.checklist);
});
test('browser state cannot create a practical sign-off',()=>{
 const state=restoreState(JSON.stringify({...emptyState(),practicalState:'passed',trainerSignature:'forged',test:{terrain:1},read:true}));
 assert.equal(state.practicalState,'unobserved');assert.equal(state.trainerSignature,null);assert.equal(state.test.terrain,1);assert.equal(state.read,true);
 assert.deepEqual(restoreState('{broken'),emptyState());assert.deepEqual(restoreState('{"version":"old"}'),emptyState());
});
test('four locales preserve all sections, choices, criteria and remediation destinations',()=>{
 for(const loc of ['ar-EG','en','it','de']){
  const d=load(loc);assert.equal(d.locale,loc);assert.equal(d.dir,loc==='ar-EG'?'rtl':'ltr');assert.deepEqual(Object.keys(d.ui).sort(),Object.keys(en.ui).sort());
  for(const group of ['reading','examples','points','quiz'])assert.deepEqual(d[group].map(x=>x.id),en[group].map(x=>x.id),`${loc}/${group}`);
  for(const group of ['points','quiz'])d[group].forEach((x,i)=>{assert.equal(x.answer,en[group][i].answer);assert.equal(x.options.length,en[group][i].options.length);});
  d.points.forEach(p=>{assert.equal(p.feedback.length,p.options.length);assert.ok(d.reading.some(r=>r.id===p.readingId));});
  assert.equal(d.practical.length,5);assert.equal(d.checklistLabels.length,5);assert.equal(d.checklistModel.length,5);assert.equal(d.goals.length,3);
  d.reading.forEach((r,i)=>assert.equal(r.paragraphs.length,en.reading[i].paragraphs.length,`${loc}/${r.id}`));
  assert.doesNotMatch(JSON.stringify(d),/spark|school|مدرسة/i);
  if(loc!=='ar-EG')assert.doesNotMatch(JSON.stringify(d),/[\u0600-\u06ff]/);
 }
});
test('worksheet output escapes entered markup',()=>{assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');});
