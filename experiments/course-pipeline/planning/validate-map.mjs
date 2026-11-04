import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const p=JSON.parse(await readFile(path.join(here,'curriculum-map.json'),'utf8'));
const ids=new Map(p.lessons.map(l=>[l.id,l]));
assert.equal(ids.size,p.lessons.length,'Duplicate lesson ID');
const riskIds=new Set(p.risks.map(r=>r.id));
const topicIds=new Set(p.topics.map(t=>t.id));
for(const l of p.lessons){
  for(const key of ['title','en','goal','activity','evidence','status'])assert.ok(l[key]?.trim(),l.id+' missing '+key);
  for(const key of ['onlineMinutes','supervisedMinutes','videoMinutes'])assert.ok(l[key].length===2&&l[key][0]>=0&&l[key][1]>=l[key][0],l.id+' invalid time');
  for(const id of l.prerequisites){assert.ok(ids.has(id),l.id+' unknown prerequisite');assert.ok(ids.get(id).order<l.order,l.id+' has forward/cyclic prerequisite');}
  for(const id of l.risks)assert.ok(riskIds.has(id),l.id+' unknown review');
  for(const id of l.topics)assert.ok(topicIds.has(id),l.id+' unknown topic');
  for(const [a,b]of l.pageRanges)assert.ok(a>=3&&b<=p.source.physicalPages&&b>=a,l.id+' invalid PDF pages');
}
for(const t of p.topics){
 assert.ok(t.lessons.length,t.id+' uncovered');
 for(let page=t.pages[0];page<=t.pages[1];page++){
  const covered=t.lessons.some(id=>ids.get(id).pageRanges.some(([a,b])=>page>=a&&page<=b));
  assert.ok(covered,t.id+' page '+page+' not covered');
 }
}
const batchIds=p.batches.flatMap(b=>b.lessons);
assert.equal(batchIds.length,p.lessons.length);
assert.equal(new Set(batchIds).size,p.lessons.length);
assert.ok(batchIds.every(id=>ids.has(id)));
assert.deepEqual(p.locales,['ar-EG','en','it','de']);
assert.equal(p.lessons.filter(l=>l.reuseLessonId==='SOIL-PILOT-01').length,1);
assert.ok(!/spark|سبارك/i.test(JSON.stringify(p)),'Source brand in public map');
const online=[0,1].map(i=>p.lessons.reduce((s,l)=>s+l.onlineMinutes[i],0));
const supervised=[0,1].map(i=>p.lessons.reduce((s,l)=>s+l.supervisedMinutes[i],0));
assert.deepEqual(online,p.summary.onlineMinutes);assert.deepEqual(supervised,p.summary.supervisedMinutes);
assert.equal(p.summary.teachingLessons,p.lessons.filter(l=>l.type==='lesson').length);
assert.equal(p.summary.assessmentStations,p.lessons.filter(l=>l.type!=='lesson').length);
const report={status:'passed',lessons:p.lessons.length,teachingTopics:p.topics.filter(t=>t.id!=='FINAL').length,coverage:'all source-topic pages covered',prerequisites:'ordered without cycles',batches:'each station assigned once',onlineMinutes:online,supervisedMinutes:supervised,sourceSha256:p.source.sha256,productionTriggered:false};
await writeFile(path.join(here,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
