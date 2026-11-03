import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {ACADEMIC_PRACTICE_APPEND_REVISIONS,normalizeAcademicPracticeValues} from "./practice-fields";
const previous=["original title","نص عربي محفوظ","line1\r\nline2","x".repeat(6000),"original fifth value"];
describe("reviewed positional append contracts",()=>{
 it.each(ACADEMIC_PRACTICE_APPEND_REVISIONS)("retains all legacy values for $lessonId/$locale",r=>{
  const input=previous.slice(0,r.fromCount),copy=input.slice();
  const result=normalizeAcademicPracticeValues(r.lessonId,r.locale,r.toCount,input);
  expect(result).toEqual([...copy,...Array(r.toCount-r.fromCount).fill("")]);
  expect(input).toEqual(copy);expect(result).not.toBe(input);
 });
 it.each(ACADEMIC_PRACTICE_APPEND_REVISIONS)("does not truncate or guess another shape for $lessonId/$locale",r=>{
  const long=Array(r.toCount+1).fill("retain me");
  expect(normalizeAcademicPracticeValues(r.lessonId,r.locale,r.toCount,long)).toBeNull();
  expect(long).toHaveLength(r.toCount+1);
  expect(normalizeAcademicPracticeValues(r.lessonId,"unknown",r.toCount,previous)).toBeNull();
  expect(normalizeAcademicPracticeValues(r.lessonId,r.locale,r.toCount+1,previous)).toBeNull();
 });
 it("keeps every lesson/locale contract unique and consistent with its current source fields",()=>{
  expect(new Set(ACADEMIC_PRACTICE_APPEND_REVISIONS.map(r=>r.lessonId+"/"+r.locale)).size).toBe(25);
  const cache=new Map<string,Array<{id:string;assignment:{fields:string[]}}>>();
  for(const r of ACADEMIC_PRACTICE_APPEND_REVISIONS){
   if(!cache.has(r.locale))cache.set(r.locale,JSON.parse(readFileSync(resolve("experiments/academic/course/expanded",r.locale+".json"),"utf8")));
   const lesson=cache.get(r.locale)?.find(l=>l.id===r.lessonId);
   expect(lesson?.assignment.fields).toHaveLength(r.toCount);
   expect(r.toCount).toBeGreaterThan(r.fromCount);
  }
 });
 it("rejects malformed stored data without coercion or write",()=>{
  for(const bad of [null,{},["ok",12],["ok",null]])expect(normalizeAcademicPracticeValues("AC-BUS-M03-L01","ar-EG",10,bad)).toBeNull();
 });
 it("copies a current twelve-field answer exactly",()=>{
  const input=Array.from({length:12},(_,i)=>"محفوظ "+i);
  expect(normalizeAcademicPracticeValues("AC-BUS-M07-L06","ar-Gulf",12,input)).toEqual(input);
 });
});
