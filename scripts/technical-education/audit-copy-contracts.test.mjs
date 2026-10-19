import {createHash} from "node:crypto";
import test from"node:test";import assert from"node:assert/strict";import{readFileSync}from"node:fs";import{calculateCabinet,SAMPLE}from"../../src/lib/furniture-pilot/model.ts";
const read=p=>readFileSync(p,"utf8"),json=p=>JSON.parse(read(p)),lesson=(id,l)=>json("scripts/technical-education/source/technical-education/lessons/"+id+"__"+l+".json");
test("33 completion guidance names each lesson's actual portfolio, not the worked decision",()=>{for(const l of["en","ar-EG","ar-MSA","ar-Gulf"])for(const id of["M01-L02","M01-L03","M01-L04"]){const d=lesson(id,l);assert.equal(d.quiz[0].correct,1);assert.equal(d.assignment.fields.length,3);assert.notEqual(d.faq[0].answer,d.example.decision);assert.notEqual(d.quiz[0].explanation,d.example.decision);assert.ok(d.faq[0].answer.length>150);assert.ok(d.quiz[0].explanation.length>70)}});
test("34 part thickness header is general while body and back thickness stay distinct",()=>{const d=calculateCabinet(SAMPLE);assert.equal(d.panels.find(p=>p.key==="back").thickness,6);assert.equal(d.panels.find(p=>p.key==="sides").thickness,18);assert.match(read("src/components/furniture-pilot/FurniturePilotLesson.tsx"),/c\.panelWidth, c\.panelThickness/);const copy=read("scripts/technical-education/source/furniture-pilot/content.ts");assert.match(copy,/panelThickness: locale === "en" \? "Thickness \(mm\)" : "السمك \(مم\)"/);assert.match(copy,/thickness: t\(common\("سمك الهيكل", "Body thickness"\)\)/)});
test("35 both alternatives and their checks share the same use case without moving fields",()=>{for(const l of["en","ar-EG","ar-MSA","ar-Gulf"]){const d=lesson("M02-L02",l);assert.equal(d.assignment.fields.length,3);const label=d.assignment.fields[2];if(l==="en"){assert.match(label,/Alternative 1/);assert.match(label,/Alternative 2/);assert.equal(d.assignment.criteria[2],"Both options use the same scenario")}else{assert.match(label,/الأول/);assert.match(label,/الثاني/);assert.match(d.assignment.criteria[2],/البديلين/)}assert.equal(d.quiz[0].correct,1)}});
test("37 punctuation repair leaves the office question and key intact",()=>{const d=lesson("M18-L03","en");assert.equal(d.quiz[0].options[2],"Yes, 6 pieces");assert.equal(d.quiz[0].correct,0);assert.match(d.quiz[0].question,/6 workstations and 2 meeting groups/)});
test("126 Bosch reference pins the model, document revision, section and URL together",()=>{const d=lesson("M17-L01","ar-MSA"),s=d.sections.find(x=>x.id==="envelope").text;for(const x of["CPA565GS0B","9001686063_C","21.3","https://media3.bosch-home.com/Documents/9001686063_C.pdf","E-Nr"])assert.ok(s.includes(x));assert.equal(d.quiz[0].correct,0)});
test("42 MSA Reactive remains key zero with a distinct distractor and no leaked key note",()=>{const d=json("src/lib/locale-lessons/ar-MSA/lessons/business-m1-l2-reactive-vs-proactive.json"),s=d.sections.find(s=>s.role==="Quiz");assert.equal(s.quiz.correctIndex,0);assert.match(s.quiz.options[0],/^Reactive/);assert.equal(s.quiz.options[1],"Proactive — لأن قضاء ثلاث ساعات في مهمة مهمة يعني أنه اختارها مسبقًا");assert.equal(new Set(s.quiz.options).size,s.quiz.options.length);assert.equal(s.bullets[1],s.quiz.options[1]);assert.doesNotMatch(s.contentMarkdown,/Quiz key|correctIndex/);assert.doesNotMatch(read("docs/playbooks/adaptive-canonical/business-m1-l2-reactive-vs-proactive.canonical.md"),/Quiz key \(unchanged\)/)});

test("157 canonical part IDs agree across model, revised workbook metadata and UI",()=>{
 const receipt=json("docs/experiments/technical-education/audit-157-pdf-revision-20261019.json");
 const panels=calculateCabinet(SAMPLE).panels;
 assert.deepEqual(panels.flatMap(p=>p.ids),receipt.canonicalParts);
 assert.deepEqual(panels.map(({ids,quantity,length,width,thickness})=>({ids,quantity,length,width,thickness})),receipt.dimensionsAndQuantities);
 assert.equal(receipt.pdfs.length,4);
 const digest=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
 for(const pdf of receipt.pdfs){assert.equal(digest(pdf.path),pdf.sha256);assert.equal(readFileSync(pdf.path).length,pdf.bytes);assert.deepEqual(pdf.changedPages,[4]);}
 assert.equal(receipt.unchangedAssets.length,8);
 for(const asset of receipt.unchangedAssets)assert.equal(digest(asset.path),asset.sha256);
 const ui=read("src/components/technical-education/TechnicalDiagram.tsx");
 for(const id of receipt.canonicalParts)assert.ok(ui.includes(id));
 assert.doesNotMatch(ui,/A\/B|C\/D\/E|A[–-]F/);
});
