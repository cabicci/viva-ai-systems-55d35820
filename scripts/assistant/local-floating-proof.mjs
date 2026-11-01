import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const evidence=path.resolve("../evidence");fs.mkdirSync(evidence,{recursive:true});
const result={scope:"Actual floating component + actual project Tailwind CSS in real local Chrome; fixture locale labels/context/error UI only; no lesson-host/provider/auth proof",cases:[],console:[],pageErrors:[]};
const labels={name:"explicit-ui-fixture-labels",enforce:"pre",resolveId(id){
 const normalized=id.replaceAll("\\","/");
 if(normalized.endsWith("/lib/locale/locale-context")||normalized==="@/lib/locale/locale-context")return "\0ui-fixture:@/lib/locale/locale-context";
 if(normalized.endsWith("/lib/locale/ui-strings")||normalized==="@/lib/locale/ui-strings")return "\0ui-fixture:@/lib/locale/ui-strings";
},load(id){
 if(id==="\0ui-fixture:@/lib/locale/locale-context")return 'export const useLocale=()=>({dir:document.dir,locale:document.documentElement.lang});';
 if(id==="\0ui-fixture:@/lib/locale/ui-strings")return 'export const getUiString=()=>"إغلاق";';
}};
const server=await createServer({configFile:false,root:process.cwd(),publicDir:false,envDir:path.resolve("tests/rag-local"),cacheDir:"../evidence/browser-vite-cache",
 resolve:{alias:{"@":path.resolve("src")}},plugins:[labels,react(),tailwind()],
 optimizeDeps:{entries:["tests/rag-local/floating-proof.html"],noDiscovery:true,include:["react","react-dom/client","lucide-react","clsx","tailwind-merge"]},
 server:{host:"127.0.0.1",port:0}});
let browser;
try{
 await server.listen();const addr=server.httpServer.address();const origin=`http://127.0.0.1:${addr.port}`;
 browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
 for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();
  await page.route("**/*",route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  page.on("console",m=>result.console.push({viewport,type:m.type(),text:m.text()}));
  page.on("pageerror",e=>result.pageErrors.push(e.message));
  await page.goto(origin+"/tests/rag-local/floating-proof.html");
  const fab=page.getByRole("button",{name:"افتح مساعد الدرس"});await fab.waitFor({state:"visible"});
  await page.waitForFunction(()=>{const el=document.querySelector('[aria-haspopup="dialog"]');return el&&getComputedStyle(el).opacity!=="0";});
  const box=await fab.boundingBox(),essential=await page.locator("#continue").boundingBox();
  assert(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height);
  assert(!(box.x<essential.x+essential.width&&box.x+box.width>essential.x&&box.y<essential.y+essential.height&&box.y+box.height>essential.y),"launcher obstructs essential control");
  await fab.focus();await page.keyboard.press("Enter");await page.getByRole("dialog").waitFor({state:"visible"});
  assert(await page.getByRole("dialog").evaluate(el=>el===document.activeElement));
  assert.equal(await page.getByRole("dialog").getAttribute("dir"),"rtl");
  await page.locator("#question").fill("سؤال واجهة فقط");await page.locator("#send").click();await page.getByRole("status").waitFor();
  await page.screenshot({path:path.join(evidence,`floating-${viewport.width}-open.png`),fullPage:true});
  await page.keyboard.press("Escape");await page.getByRole("dialog").waitFor({state:"hidden"});
  assert(await fab.evaluate(el=>el===document.activeElement));
  await fab.click();await page.getByRole("dialog").waitFor();await page.locator("#switch").click();
  await page.getByRole("dialog").waitFor({state:"hidden"});await fab.click();
  assert.equal(await page.locator("#scope").innerText(),"lesson-B");assert.equal(await page.locator("#question").inputValue(),"");
  result.cases.push({viewport,launcher:box,essential,openCloseKeyboardRTL:true,essentialNotObstructed:true,fixtureScopeRemountClearsDraft:true,fixtureFailureVisible:true});
  await context.close();
 }
 assert.equal(result.pageErrors.length,0);result.status="passed";
}catch(error){result.status="failed";result.error=String(error);throw error;}
finally{fs.writeFileSync(path.join(evidence,`floating-browser-${Date.now()}.json`),JSON.stringify(result,null,2));await browser?.close();await server.close();}
