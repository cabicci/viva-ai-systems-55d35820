import assert from "node:assert/strict";
import {test} from "node:test";
import {readAcademicAuditChain} from "./academic-audit-chain.mjs";
const snapshot=readAcademicAuditChain();
const lesson=(locale,id)=>{const row=snapshot.rows.find(x=>x.locale===locale&&x.lessonId===id);assert(row,"Recorded lesson "+id+"/"+locale);return row.payload};
const named=(rows,id)=>{const row=rows.find(x=>x.id===id);assert(row,"Recorded child "+id);return row};
const flat=s=>s.replace(/\s/g,"");
test("66: first-pass plus stated rework gives2040 vs1660, not zero savings",()=>{
 const x=lesson("en","AC-BUS-M07-L04").example,old=100*20+2*20,next=100*15+8*20;
 assert.equal(old,2040);assert.equal(next,1660);assert.equal(old-next,380);
 for(const n of [old,next,old-next])assert(x.steps[3].includes(String(n)));
 assert.match(x.text,/first-pass.*exclude.*rework/);assert.match(x.decision,/quality threshold/);assert.match(x.steps[4],/do not approve wider rollout/);
});
test("67: booklets remain the unit through scenario, difference and decision",()=>{
 const x=lesson("en","AC-BUS-M01-L02").example,text=[x.text,x.decision,...x.steps].join(" ");
 assert.doesNotMatch(text,/\borders\b|brochures/);assert.match(text,/30 custom booklets/);assert.match(text,/20 booklets today/);assert.match(text,/10 tomorrow/);assert.equal(30-20,10);
});
test("68: both named transitions use their own starting denominator",()=>{
 const s=named(lesson("ar-Gulf","AC-BUS-M03-L04").sections,"S5").text;
 assert.equal(5/100*100,5);assert.equal(5/20*100,25);
 assert.doesNotMatch(s,/المقام يمثل المرحلة السابقة مباشرة/);assert.match(s,/مو لازم المرحلة السابقة مباشرة/);assert.match(s,/نفس المجموعة والفترة/);
});
test("69: faster downstream printing cannot cause the upstream inspection queue",()=>{
 const s=named(lesson("ar-MSA","AC-BUS-M04-L03").sections,"S5").text;
 assert.equal(Math.min(8,15),8);assert.match(s,/يأتي الفحص قبل الطباعة/);assert.match(s,/معدل الوصول لا سرعة الطباعة/);assert.doesNotMatch(s,/سيؤدي ذلك فقط إلى تراكم/);
});
test("70: equality satisfies the declared acceptance rule and does not guarantee scale",()=>{
 const x=lesson("ar-Gulf","AC-BUS-M04-L05"),v=named(x.readingVisuals,"RV3");
 assert.equal(v.rows.length,4);assert.match(v.rows[1][0],/يساوي.*يتعداه/);assert.match(v.rows[2][0],/أقل.*بشوي/);assert.match(named(x.sections,"S6").text,/النتيجة ≥ حد القبول/);
});
test("71: unverified vendor percentage is not an internal forecast",()=>{
 const s=lesson("en","AC-BUS-M07-L08").example.steps.join(" ");
 assert.match(s,/own savings are unknown/);assert.match(s,/comparative pilot/);assert.doesNotMatch(s,/We project a potential|in similar installations/);
});
test("72: internal validity is attribution with the original answer index",()=>{
 const q=named(lesson("en","AC-BUS-M04-L06").quiz,"Q4");
 assert.equal(q.correct,1);assert.match(q.options[1],/attributed to the intervention rather than other factors/);assert.doesNotMatch(q.explanation,/correct option|remains\s*1/);
});
test("73: assignment balances the chosen sample without guaranteeing representation",()=>{
 const x=lesson("en","AC-BUS-M04-L06"),q=named(x.quiz,"Q6");
 assert.equal(q.correct,2);assert.match(q.question,/current customer list/);assert.match(q.explanation,/does not guarantee/);assert.match(named(x.sections,"S2").text,/does not repair an unrepresentative sample/);
});
test("74: the stated controls leave differential teacher effort uncontrolled",()=>{
 const q=named(lesson("en","AC-BUS-M04-L06").quiz,"Q5");
 assert.equal(q.correct,1);assert.match(q.question,/equal prior student attainment, class size and teaching time/);assert.match(q.question,/greater enthusiasm and effort/);assert.match(q.explanation,/not generally irrelevant/);
});
test("75: plausible study causation is not established by co-occurrence",()=>{
 const v=named(lesson("ar-MSA","AC-BUS-M04-L06").readingVisuals,"RV3");
 assert.equal(v.rows[1][1],"محتملة؛ لا تثبت من الارتباط وحده");assert.match(v.rows[1][2],/التحصيل السابق أو الدافعية/);
});
test("80: each displayed profit equals contribution less fixed900",()=>{
 const v=named(lesson("ar-EG","AC-BUS-M05-L06").readingVisuals,"RV3");
 assert.match(v.columns[2],/صافي الربح/);
 const n=s=>Number(s.replace(/[^\d.-]/g,""));for(const row of v.rows)assert.equal(n(row[1])-900,n(row[2]));
});
test("81: tied8/8/12 stages remain limited to8 after improving only one",()=>{
 const text=lesson("en","AC-BUS-M04-L03").faq[0].answer;
 assert.equal(Math.min(15,8,12),8);assert.match(text,/several stages tied/);assert.match(text,/both tied constraints/);
});
test("82:7150 against11000 is a35-percent decline",()=>{
 const v=named(lesson("ar-Gulf","AC-BUS-M05-L06").readingVisuals,"RV3");
 assert.equal(v.rows[3][2],((7150-11000)/11000*100).toFixed(2)+"%");
});
test("83: breakeven uses contribution and declares a positive-margin condition",()=>{
 const s=named(lesson("ar-Gulf","AC-BUS-M07-L05").sections,"S3").text;
 assert.doesNotMatch(s,/عشان تحقق نفس الإيراد/);assert.match(s,/السعر أكبر من التكلفة المتغيرة/);assert.match(s,/ما فيه كمية تعادل محدودة/);
});
test("84: a per-attempt limit requires individual times, not the mean alone",()=>{
 const s=lesson("ar-EG","AC-BUS-M07-L06").example.steps.join(" ");
 assert.match(s,/زمن كل محاولة/);assert.match(s,/أقصى زمن/);assert.match(s,/صفر محاولات فوق الحد/);assert.match(s,/مش ضمان لكل استخدام مستقبلي/);
});
test("85: cause shares describe the10-case sample, not guaranteed solution effects",()=>{
 const s=lesson("en","AC-BUS-M02-L02").example.steps.slice(3).join(" ");
 assert.match(s,/3\/10/);assert.match(s,/7\/10/);assert.match(s,/not a forecast/);assert.match(s,/test target, not an achieved result/);
});
test("86: the scoped checking benefit and automation coverage both need a pilot",()=>{
 const s=lesson("en","AC-BUS-M03-L03").example.steps.join(" ");
 assert.doesNotMatch(s,/ensuring a perfect print|eliminating costly reworks|ensuring both speed and accuracy/);
 assert.match(s,/do not promise a perfect/);assert.match(s,/assumptions to test, not guarantees/);
});
test("87: the example names four stakeholders without changing its assignment",()=>{
 const s=lesson("ar-MSA","AC-BUS-M01-L03").example.steps[0];
 assert.match(s,/أربعة أصحاب مصلحة/);assert.doesNotMatch(s,/ثلاثة أصحاب مصلحة/);
});
test("88: cost scores occur in the criterion row, consistent with totals14/23",()=>{
 const v=named(lesson("en","AC-BUS-M02-L02").readingVisuals,"rv3");
 assert.doesNotMatch(v.columns.join(" "),/Cost:/);assert.equal(1*4+2*3+2*2,14);assert.equal(2*4+3*3+3*2,23);assert.match(v.rows[3][1],/= 14/);assert.match(v.rows[3][2],/= 23/);
});
