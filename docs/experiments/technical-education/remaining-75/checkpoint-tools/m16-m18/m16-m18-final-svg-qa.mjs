import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const root=process.cwd();
const definitions=JSON.parse(await readFile(root+'/src/lib/technical-education/new-diagrams.json','utf8'));
const out='/tmp/technical-59-70/svg';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/tmp/technical-chrome/chromium',args:['--no-sandbox']});const results=[];
try{for(const locale of ['ar-EG','ar-MSA','ar-Gulf','en'])for(const kind of Object.keys(definitions).filter(k=>k.startsWith('new-M16')||k.startsWith('new-M17')||k.startsWith('new-M18'))){
 const svg=await readFile(`${root}/public/experiments/technical-education/${locale}/${kind}.svg`,'utf8');
 const page=await browser.newPage({viewport:{width:800,height:540}});
 await page.setContent(`<style>body{margin:0}svg{width:800px;height:540px}</style>${svg}`);
 const bounds=await page.locator('svg text').evaluateAll(ts=>ts.map(t=>{const b=t.getBBox();return{text:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height};}));
 const clipped=bounds.filter(b=>b.x<0||b.y<0||b.x+b.w>400||b.y+b.h>270);if(clipped.length)throw Error(JSON.stringify({kind,locale,clipped}));
 await page.screenshot({path:`${out}/${locale}-${kind}.png`});results.push({locale,kind,labels:bounds.length,clipped:0});await page.close();
}await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log('Passed',results.length,'SVG exports: no text exceeds viewBox');}finally{await browser.close();}
