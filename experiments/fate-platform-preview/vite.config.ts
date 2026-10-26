import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
const W=process.cwd(),root=path.resolve(W,"experiments/fate-platform-preview");
const R=path.resolve(process.env.FATE_REBUILD_ROOT??path.resolve(W,"../../rebuild-v2"));
const runtime=path.join(R,"platform-preview-runtime");
export default defineConfig({root,publicDir:path.resolve(W,"public"),cacheDir:path.join(runtime,"vite-cache"),plugins:[react(),tailwindcss(),{name:"verified-public-fate-assets",configureServer(server){server.middlewares.use((req,res,next)=>{
 const url=(req.url??"").split("?")[0];if(url==="/__fate-media/manifest.json"){res.setHeader("Content-Type","application/json");const f=path.join(runtime,"media.json");res.end(fs.existsSync(f)?fs.readFileSync(f):"{}");return;}
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
