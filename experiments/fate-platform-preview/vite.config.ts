import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
const W=process.cwd(),root=path.resolve(W,"experiments/fate-platform-preview");
const R=path.resolve(process.env.FATE_REBUILD_ROOT??path.resolve(W,"../../rebuild-v2"));
const runtime=path.join(R,"platform-preview-runtime");
const verifiedMovies=new Map<string,{file:string,bytes:number,sha256:string,mtime:number}>();
const selected=JSON.parse(fs.readFileSync(path.join(R,"production/FATE2-S01-selected-masters.en.json"),"utf8"));
for(const locale of ["ar-EG","en"]){const item=selected.masters[locale],file=path.resolve(R,item.video),stat=fs.statSync(file);if(!file.startsWith(R+path.sep)||crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")!==item.sha256)throw new Error("Selected local video identity differs");verifiedMovies.set(`/__fate-media/FATE2-S01-${locale}.mp4`,{file,bytes:stat.size,sha256:item.sha256,mtime:stat.mtimeMs});}
export default defineConfig({root,publicDir:path.resolve(W,"public"),cacheDir:path.join(runtime,"vite-cache"),plugins:[react(),tailwindcss(),{name:"verified-public-fate-assets",configureServer(server){server.middlewares.use((req,res,next)=>{
 const url=(req.url??"").split("?")[0];if(url==="/__fate-media/manifest.json"){res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify(Object.fromEntries(["ar-EG","en"].map(locale=>{const src=`/__fate-media/FATE2-S01-${locale}.mp4`,v=verifiedMovies.get(src)!;return[locale,{status:"verified",kind:"local",src,sha256:v.sha256}];}))));return;}
 const movie=verifiedMovies.get(url);if(movie){if(!["GET","HEAD"].includes(req.method??"")){res.statusCode=405;res.end();return;}const stat=fs.statSync(movie.file);if(stat.size!==movie.bytes||stat.mtimeMs!==movie.mtime){res.statusCode=409;res.end("Selected media changed; restart verification");return;}res.setHeader("Content-Type","video/mp4");res.setHeader("Accept-Ranges","bytes");res.setHeader("Cache-Control","no-cache");res.setHeader("ETag",`"${movie.sha256}"`);let start=0,end=movie.bytes-1;if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match){res.statusCode=416;res.setHeader("Content-Range",`bytes */${movie.bytes}`);res.end();return;}if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0){res.statusCode=416;res.end();return;}start=Math.max(0,movie.bytes-suffix);}else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=movie.bytes){res.statusCode=416;res.setHeader("Content-Range",`bytes */${movie.bytes}`);res.end();return;}res.statusCode=206;res.setHeader("Content-Range",`bytes ${start}-${end}/${movie.bytes}`);}res.setHeader("Content-Length",end-start+1);if(req.method==="HEAD"){res.end();return;}const stream=fs.createReadStream(movie.file,{start,end});res.on("close",()=>stream.destroy());stream.on("error",()=>res.destroy());stream.pipe(res);return;}
 const match=/^\/__fate-assets\/(opening|residue|pathway)\.jpg$/.exec(url);if(!match)return next();const data=JSON.parse(fs.readFileSync(path.join(root,"source-data.json"),"utf8"));const asset=data.firstLesson.visuals[match[1]];const f=path.resolve(R,"preview",asset.src);if(!f.startsWith(R+path.sep)||crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")!==asset.sha256){res.statusCode=409;res.end("Asset identity mismatch");return;}res.setHeader("Content-Type","image/jpeg");res.end(fs.readFileSync(f));
 });}}],resolve:{alias:[
 {find:"@/lib/auth-context",replacement:path.join(root,"anonymous.ts")},
 {find:"@/lib/entitlements",replacement:path.join(root,"anonymous.ts")},
 {find:"@/lib/academic-education/client",replacement:path.join(root,"client.ts")},
 {find:"@/lib/academic-education/station-titles",replacement:path.join(root,"station-titles.ts")},
 {find:"@/lib/academic-education/assistant.functions",replacement:path.join(root,"offline-services.ts")},
 {find:/^\.\/AcademicAssistantPanel$/,replacement:path.join(root,"offline-services.ts")},
 {find:/^\.\/locale-ssr-request\.server$/,replacement:path.join(root,"offline-services.ts")},
 {find:"@/lib/journey/client",replacement:path.join(root,"offline-services.ts")},
 {find:"@/lib/path-story",replacement:path.join(root,"path-story.ts")},
 {find:"@/lib/learning-lines",replacement:path.join(root,"learning-lines.ts")},
 {find:"@",replacement:path.resolve(W,"src")}
 ]},server:{host:"127.0.0.1",port:4182,strictPort:true,fs:{allow:[W]}},build:{outDir:path.join(runtime,"build"),emptyOutDir:false}});
