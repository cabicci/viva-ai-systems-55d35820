import assert from "node:assert/strict";import{test}from"node:test";import{readAcademicAuditChain}from"./academic-audit-chain.mjs";
const snapshot=readAcademicAuditChain(),l=(loc,id)=>{const r=snapshot.rows.find(x=>x.locale===loc&&x.lessonId===id);assert(r);return r.payload},v=(l,id)=>{const x=l.readingVisuals.find(x=>x.id===id);assert(x);return x},text=x=>JSON.stringify(x).replace(/,/g,"");
test("153: purchase includes defective value once, with different usable yields",()=>{
 const x=l("ar-EG","AC-BUS-M06-L02"),a=1000*10+2000+500,b=1000*11.5+300;
 assert.equal(a,12500);assert.equal(b,11800);assert.equal(a-b,700);assert.equal((a/980).toFixed(2),"12.76");assert.equal((b/995).toFixed(2),"11.86");
 const s=text(x.example);for(const n of [a,b,a-b,980,995])assert(s.includes(String(n)));assert.doesNotMatch(s,/12700|11857\.5|842\.5/);
 const rows=text(v(x,"RV3").rows);for(const n of [a,b,980,995,"12.76","11.86"])assert(rows.includes(String(n)));
});
test("3: Gulf example is the corrected Egyptian payload with currency substitution only",()=>{
 const eg=l("ar-EG","AC-BUS-M06-L02"),g=l("ar-Gulf","AC-BUS-M06-L02"),money=x=>typeof x==="string"?x.replaceAll("جنيهات","ريالات").replaceAll("جنيه","ريال"):Array.isArray(x)?x.map(money):x&&typeof x==="object"?Object.fromEntries(Object.entries(x).map(([k,y])=>[k,money(y)])):x;
 assert.deepEqual(g.example,money(eg.example));const gv=v(g,"rv2"),ev=v(eg,"RV3");assert.equal(gv.kind,"comparison");assert.equal(gv.title,"مقارنة التكلفة الكلية لعرضين");for(const k of ["columns","rows","caption"])assert.deepEqual(gv[k],money(ev[k]));
});
test("23: storage follows2000/1000/0 rather than holding2000 for two months",()=>{
 assert.equal((2000+1000)*.5,1500);
 for(const loc of ["en","ar-Gulf"]){const x=l(loc,"AC-BUS-M02-L05"),s=x.example.steps[1];for(const n of ["2000","1000","1500"])assert(s.includes(n));}
});
test("23: cash follows scheduled purchases, yielding240 in each case",()=>{
 assert.equal((17000+7000)*.01,240);assert.equal((18000+6000)*.01,240);
 for(const[loc,b1,b2]of [["en",18000,6000],["ar-Gulf",17000,7000]]){const s=l(loc,"AC-BUS-M02-L05").example.steps[2];for(const n of [b1,b2,240])assert(s.includes(String(n)));}
});
test("23: net savings are conditional1080/4060; risk estimates are not certain losses",()=>{
 assert.equal(3000-1500-240-180,1080);assert.equal(6000-1500-240-200,4060);
 const eg=l("ar-Gulf","AC-BUS-M02-L05").example,en=l("en","AC-BUS-M02-L05").example;assert.match(eg.decision,/1080/);assert.match(en.decision,/4060/);assert.match(eg.steps[3],/ليس تكلفة مؤكدة/);assert.match(en.steps[3],/not a certain cost/);assert.doesNotMatch(text(en),/(?<!\d)3440(?!\d)|\$360(?!\d)/);assert.doesNotMatch(text(eg),/480|340/);
});
test("24: confirmed orders are capped before commitment across all channels",()=>{
 const eg=l("ar-EG","AC-BUS-M05-L03").example,g=l("ar-Gulf","AC-BUS-M05-L03").example;
 assert.match(eg.decision,/الطلب 11/);assert.match(eg.steps[2],/كل القنوات/);assert.match(eg.steps[4],/باقي القنوات/);assert.doesNotMatch(eg.steps[4],/15 طلب/);
 assert.match(g.decision,/الطلب 51/);assert.match(g.steps[3],/مو حد أمان/);assert.match(g.steps[4],/القنوات الأخرى/);assert.equal(250*.25,62.5);assert(62.5>50);
});
test("25: operational90-percent hypothesis and80-percent result do not measure satisfaction",()=>{
 const x=l("ar-Gulf","AC-BUS-M04-L05").example;assert.equal(8/10*100,80);assert.match(x.text,/الافتراض التشغيلي/);assert.match(x.text,/رغبة الزبائن.*ورضاهم.*افتراضان منفصلان/);assert.match(x.decision,/80% أقل من حد 90%/);assert.match(x.decision,/مو نسبة رضا/);
});
