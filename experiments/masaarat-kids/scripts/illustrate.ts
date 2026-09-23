import {chromium} from "playwright";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";
import {Explorer} from "../src/Explorer";
import {getLesson,locales} from "../src/data";
const base=resolve(import.meta.dir,".."),dir=resolve(base,"public/generated/illustrations");
await mkdir(dir,{recursive:true});
const logo=(await readFile(resolve(base,"public/brand/logo.png"))).toString("base64"),font=(await readFile(resolve(base,"public/fonts/Cairo.ttf"))).toString("base64");
const browser=await chromium.launch({channel:"chrome",headless:true}),receipts=[];
const esc=(s:string)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
for(const locale of locales){
 const l=getLesson(locale),v=l.illustration,rtl=l.direction==="rtl";
 const robot=renderToStaticMarkup(React.createElement(Explorer,{size:255}));
 const details='<div class="swatches"><b style="background:#86BCE1"></b><b style="background:#82C39E"></b><b style="background:#A797C8"></b></div><div class="stones">◆ ◆ ◆</div>';
 const lines='<div class="lines">'+[1,2,3].map(n=>'<div><b>'+n+'</b><span></span></div>').join("")+'</div>';
 const html='<!doctype html><html lang="'+(rtl?"ar":"en")+'" dir="'+l.direction+'"><head><meta charset="utf-8"><style>'+
 '@font-face{font-family:Cairo;src:url(data:font/ttf;base64,'+font+')}*{box-sizing:border-box}body{margin:0;width:1900px;height:1000px;font-family:Cairo;color:#253C50;background:radial-gradient(at 0% 0%,#DFF3E8,transparent 55%),radial-gradient(at 100% 0%,#F7E6E9,transparent 55%),linear-gradient(#FAFCFF,#FFFBEF);padding:64px 80px}header{display:flex;align-items:center;justify-content:space-between;gap:70px}header img{width:265px;height:130px;object-fit:contain}h1{font-size:58px;margin:0;font-weight:900}header p{font-size:29px;margin:10px 0 0;color:#627180}.cards{display:flex;gap:52px;margin-top:62px}.card{position:relative;flex:1;min-width:0;height:440px;background:#F8FBFEe8;border:2px solid #CEDDE6;border-radius:34px;padding:32px;text-align:center;box-shadow:0 15px 35px #384F610a}.num{position:absolute;inset-inline-start:24px;top:20px;border-radius:50%;width:52px;height:52px;display:grid;place-items:center;background:#E1F0E8;font-size:27px;font-weight:800}h2{font-size:35px;margin:8px 0 0}.icon{height:237px;display:flex;align-items:center;justify-content:center}.card p{font-size:28px;line-height:1.55;margin:0;color:#4B6173}.arrow{position:absolute;inset-inline-end:-43px;top:186px;font-size:42px;color:#7B92A3}.swatches{display:flex;gap:17px}.swatches b{width:68px;height:68px;border-radius:50%;border:4px solid #FFFFFF}.stones{position:absolute;margin-top:133px;color:#A797C8;font-size:50px;letter-spacing:20px}.lines{width:310px}.lines div{display:flex;align-items:center;gap:20px;margin:20px 0}.lines b{font-size:28px;color:#688878}.lines span{height:14px;flex:1;border-radius:10px;background:#9DB5C5}.review{margin-top:47px;padding:22px 32px;background:#E5F1E8;border-radius:22px;font-size:31px;text-align:center;font-weight:700}footer{text-align:center;color:#7C8990;font-size:24px;margin-top:26px}</style></head><body><header><div><h1>'+esc(v.title)+'</h1><p>'+esc(v.subtitle)+'</p></div><img src="data:image/png;base64,'+logo+'"></header><main class="cards">'+v.heads.map((h,i)=>'<section class="card"><span class="num">'+(i+1)+'</span><h2>'+esc(h)+'</h2><div class="icon">'+[robot,details,lines][i]+'</div><p>'+esc(v.texts[i])+'</p>'+(i<2?'<span class="arrow">'+(rtl?"←":"→")+'</span>':"")+'</section>').join("")+'</main><div class="review">'+esc(v.footer)+'</div><footer>'+esc(v.credit)+'</footer></body></html>';
 const page=await browser.newPage({viewport:{width:1900,height:1000},deviceScaleFactor:1});
 await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
 const file=resolve(dir,locale+".png");await page.screenshot({path:file});await page.close();
 receipts.push({locale,width:1900,height:1000,source:"dedicated localized infographic; not a video still",sha256:createHash("sha256").update(await readFile(file)).digest("hex")});
}
await browser.close();await writeFile(resolve(base,"evidence/illustrations.json"),JSON.stringify({revision:"r2",method:"Masaarat contextual cards, official logo, Cairo, pastel background",images:receipts},null,2)+"\n");
console.log("Created four independent lesson illustrations.");
