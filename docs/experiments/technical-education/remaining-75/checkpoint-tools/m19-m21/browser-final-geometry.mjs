import {spawn} from 'node:child_process';
import {chromium} from '/workspace/scratch/61b6becf6b09/masaarat/node_modules/playwright/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const root='/workspace/scratch/61b6becf6b09/technical-71-80';
const server=spawn(process.execPath,[root+'/node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4194'],{cwd:root,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
const browser=await chromium.launch({headless:true,executablePath:'/tmp/technical-chrome/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];await mkdir('/tmp/technical-m19-m21/ui',{recursive:true});
try {
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:4194/experiments/technical-education')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));if(n===99)throw Error(logs);}
 for(const width of [390,1440])for(const locale of ['ar-EG','en'])for(const id of ["M19-L02", "M19-L03", "M20-L03", "M21-L03"]){
  const page=await browser.newPage({viewport:{width,height:950},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:4194/experiments/technical-education?lesson=${id}&locale=${locale}`);
  await page.locator('article svg[data-diagram]').first().waitFor();
  await page.waitForFunction(()=>{const b=document.querySelector('main aside nav button');const k=Object.keys(b||{}).find(k=>k.startsWith('__reactProps$'));return k&&typeof b[k].onClick==='function';});
  if(await page.locator('article svg').count()!==3)throw Error('Missing explanatory figures');
  const keys=await page.locator('article svg').evaluateAll(ss=>ss.map(s=>s.getAttribute('data-diagram')));if(new Set(keys).size!==3)throw Error('Repeated figure');
  if(await page.locator('header select').count()!==1)throw Error('Language selector count');
  if(await page.locator('main select').count())throw Error('Extra selector');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Reading overflow');
  for(const href of await page.locator('article figure a').evaluateAll(aa=>aa.map(a=>a.href))){const r=await page.request.get(href);if(!r.ok()||!(await r.text()).includes('<svg'))throw Error('Broken zoom asset');}
  const decline=page.getByRole('button',{name:/^(Decline|رفض)$/});if(await decline.count())await decline.first().click();
  if(locale==='ar-EG'||locale==='en')await page.screenshot({path:`/tmp/technical-m19-m21/ui/${id}-${locale}-${width}.png`,fullPage:true});
  await page.locator('main aside nav button').nth(2).click();await page.locator('#technical-section p').filter({hasText: /production|الإنتاج/}).waitFor();if(await page.locator('#technical-section iframe').count())throw Error('Unexpected video mapping');if(!(await page.locator('#technical-section').textContent()).includes(locale==='en'?'production':locale==='ar-EG'?'الإنتاج':'الإنتاج'))throw Error('Missing honest video-pending text');
  await page.locator('main aside nav button').nth(5).click();const links=page.locator('#technical-section a[download]');await links.first().waitFor();if(await links.count()!==2)throw Error('PDF download count');
  const downloads=await links.evaluateAll(aa=>aa.map(a=>({href:a.href,name:a.download})));for(const d of downloads){if(!d.href.endsWith('.pdf')||!d.name.endsWith('.pdf')||!d.name.includes(' — '))throw Error('Wrong filename or non-PDF download');const r=await page.request.get(d.href);if(!r.ok()||!(await r.body()).subarray(0,5).equals(Buffer.from('%PDF-')))throw Error('Invalid PDF');}
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Download overflow');if(errors.length)throw Error(JSON.stringify(errors));results.push({id,locale,width,figures:3,downloads:2,video:'pending',pageErrors:errors.length});await page.close();
 }
 await writeFile('/tmp/technical-m19-m21/ui-final-geometry-results.json',JSON.stringify(results,null,2));console.log('Passed',results.length,'lesson/locale/width visits');
} finally {await browser.close();server.kill('SIGTERM');}
