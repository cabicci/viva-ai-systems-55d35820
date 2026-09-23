import {mkdir,copyFile,writeFile,readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {lessons,locales} from "../src/data";
const base=resolve(import.meta.dir,".."),repo=resolve(base,"../..");
for(const p of ["public/brand","public/fonts","public/generated","evidence"]) await mkdir(resolve(base,p),{recursive:true});
const assets=[["public/brand/masaarat-logo-lockup.png","public/brand/logo.png"],["src/assets/fonts/Cairo.ttf","public/fonts/Cairo.ttf"]];
const receipts=[];
for(const [source,target] of assets){await copyFile(resolve(repo,source),resolve(base,target));receipts.push({source,target,sha256:createHash("sha256").update(await readFile(resolve(base,target))).digest("hex")});}
const chunks=locales.flatMap(locale=>lessons[locale].scenes.map(scene=>({id:lessons[locale].lessonId+"__"+locale+"__"+scene.id,lessonId:lessons[locale].lessonId,level:lessons[locale].level,locale,sceneId:scene.id,title:scene.title,text:scene.narration,source:"content/"+locale+".json",publication:"local-pilot-only"})));
await writeFile(resolve(base,"content/retrieval-corpus.json"),JSON.stringify(chunks,null,2)+"\n");
await writeFile(resolve(base,"evidence/brand-provenance.json"),JSON.stringify({assets:receipts,visualTokensSource:"remotion/src/theme.ts",siteSource:"src/styles.css",mascot:"Original code-native SVG; simple frame-driven motion; not a human tutor."},null,2)+"\n");
console.log(JSON.stringify({brandAssets:receipts.length,scopedRetrievalChunks:chunks.length}));
