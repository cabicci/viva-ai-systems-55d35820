import { applyLessonRename, doctorLessons, planLessonRename } from "./lib/lesson-tool-files.ts";
const args=process.argv.slice(2),command=args[0];
function readArg(name:string):string|undefined {
 const index=args.indexOf(`--${name}`);if(index===-1)return undefined;
 const value=args[index+1];if(!value||value.startsWith("--"))throw Error(`Missing --${name} value`);return value;
}
try {
 if(command==="rename") {
  const from=readArg("from"),to=readArg("to");
  if(!from||!to)throw Error("Usage: lesson-tool rename --from old-id --to new-id [--path component-directory]");
  const plan=planLessonRename(process.cwd(),from,to,readArg("path"));
  const changed=applyLessonRename(plan);
  console.log(`Lesson rename complete: ${from} -> ${to}`);console.log(`Changed ${changed.length} paths/references.`);
  for(const item of changed.slice(0,80))console.log(`- ${item}`);
  if(changed.length>80)console.log(`...and ${changed.length-80} more`);
  console.log("Next: refresh the related roadmap item and review the Bunny mapping if the video changed.");
 }else if(command==="doctor") {
  const result=doctorLessons(process.cwd(),args.includes("--strict-names"));
  for(const [label,items] of [["Missing lesson assets:",result.missingAssets],["Lesson files missing l{lesson} in id:",result.idsWithoutLessonOrder]] as const) {
   if(items.length){console.log(label);for(const item of items)console.log(`- ${item}`);}
  }
  if(result.missingAssets.length||result.idsWithoutLessonOrder.length)process.exitCode=1;
  else {console.log("Lesson doctor passed.");if(!args.includes("--strict-names"))console.log("Tip: add --strict-names to audit old lesson ids that still miss l{lesson}.");}
 }else throw Error("Usage: lesson-tool doctor [--strict-names] OR lesson-tool rename --from old-id --to new-id [--path component-directory]");
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
