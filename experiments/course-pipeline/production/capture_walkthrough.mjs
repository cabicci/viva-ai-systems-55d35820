// Captures the actual local course UI. Cursor, clicks and callouts follow real actions.
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const locale=process.argv[2];
if(!['ar-EG','en','it','de'].includes(locale))throw Error('Choose one course locale');
const root=resolve(import.meta.dirname),folder=resolve(root,'walkthrough-output',locale);
const props=JSON.parse(await readFile(resolve(folder,'props.json'),'utf8'));
const seconds=props.durationInFrames/30;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,acceptDownloads:true});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5183/curriculum.html?lang='+locale+'&lesson=SOIL-U1-L01',{waitUntil:'networkidle'});
await page.locator('.scene').first().waitFor();
await page.evaluate(async()=>{await document.fonts.ready;localStorage.clear();});
if(!await page.locator('video').count())throw Error('The actual lesson video must be available');
if(await page.locator('.lesson-illustration').count()!==3)throw Error('The three independent lesson illustrations must be available');
await page.evaluate(()=>{
 const style=document.createElement('style');style.textContent=`
 #tour-pointer{position:fixed;left:80px;top:80px;z-index:2147483647;pointer-events:none;width:31px;height:40px;filter:drop-shadow(0 1px 2px white)}
 #tour-target{position:fixed;z-index:2147483645;border:4px solid #e49b26;border-radius:13px;box-shadow:0 0 0 3px #fff8;pointer-events:none;transition:all .2s}
 #tour-callout{position:fixed;bottom:14px;left:20px;right:20px;z-index:2147483646;padding:14px 26px;background:#fefdf4f5;color:#122538;border:2px solid #e49b26;border-radius:16px;font:700 27px Cairo,Tajawal,sans-serif;text-align:center;pointer-events:none}
 .tour-click{position:fixed;z-index:2147483647;pointer-events:none;width:70px;height:70px;border:5px solid #e49b26;border-radius:50%;transform:translate(-50%,-50%);animation:tour-pulse .65s forwards}
 @keyframes tour-pulse{to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}`;
 document.head.append(style);
 const pointer=document.createElement('div');pointer.id='tour-pointer';pointer.innerHTML='<svg viewBox="0 0 31 40"><path d="M3 2v30l8-7 6 12 6-3-6-12h11z" fill="white" stroke="#122538" stroke-width="2.5"/></svg>';document.body.append(pointer);
 for(const id of ['tour-target','tour-callout']){const el=document.createElement('div');el.id=id;document.body.append(el)}
 document.addEventListener('mousemove',e=>{pointer.style.left=e.clientX+'px';pointer.style.top=e.clientY+'px'});
 document.addEventListener('mousedown',e=>{const el=document.createElement('div');el.className='tour-click';el.style.left=e.clientX+'px';el.style.top=e.clientY+'px';document.body.append(el);setTimeout(()=>el.remove(),700)});
});
const captureDir=resolve(folder,'capture');await mkdir(captureDir,{recursive:true});
const cdp=await context.newCDPSession(page);const frames=[];let chain=Promise.resolve();
let firstFrame;const started=new Promise(r=>firstFrame=r);
cdp.on('Page.screencastFrame',event=>{
 const index=frames.length;frames.push({file:`frame-${String(index).padStart(6,'0')}.jpg`,time:event.metadata.timestamp});
 chain=chain.then(()=>writeFile(resolve(captureDir,frames[index].file),Buffer.from(event.data,'base64'))).then(()=>cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}));
 if(index===0)firstFrame();
});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:1440,maxHeight:900,everyNthFrame:1});
await started;const began=performance.now();const actions=[];
let mouse={x:80,y:80};
async function focus(target,click=false){
 await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();if(!box)throw Error('Tour target missing');
 await page.evaluate(b=>Object.assign(document.querySelector('#tour-target').style,{left:b.x-5+'px',top:b.y-5+'px',width:b.width+10+'px',height:b.height+10+'px'}),box);
 const next={x:box.x+Math.min(box.width*.5,150),y:box.y+box.height*.5};
 for(let i=1;i<=24;i++){await page.mouse.move(mouse.x+(next.x-mouse.x)*i/24,mouse.y+(next.y-mouse.y)*i/24);await new Promise(r=>setTimeout(r,12))}mouse=next;
 if(click)await target.click();
}
const tabs=['learn','practice','quiz','field','assistant'];
const tabLabel={
 'ar-EG':['الشرح','التطبيق','اختبر فهمك','مع المدرب','مساعد المنهج'],
 en:['Learn','Apply','Check understanding','With your trainer','Course assistant'],
 it:['Spiegazione','Applicazione','Verifica','Con il formatore','Assistente del corso'],
 de:['Erklärung','Anwendung','Verständnis prüfen','Mit der Lehrkraft','Kursassistent']};
async function openTab(key){await focus(page.locator('.tabs button').filter({hasText:tabLabel[locale][tabs.indexOf(key)]}),true)}
const response={
 'ar-EG':'ده مثال تدريبي: لازم نعرف تعليمات إعادة الدخول قبل ما ندخل الحقل.',
 en:'Demonstration: confirm the re-entry instructions before entering the field.',
 it:'Esempio dimostrativo: verificare le istruzioni di rientro prima di entrare nel campo.',
 de:'Demonstration: Vor dem Betreten des Feldes die Wiederbetretungsvorgaben prüfen.'};
const revisit={ 'ar-EG':'راجع بعد يوم وأسبوع',en:'Revisit tomorrow and next week',it:'Ripassa domani e la prossima settimana',de:'Morgen und nächste Woche wiederholen'};
for(const [i,scene] of props.scenes.entries()){
 const scheduled=began+scene.startFrame/30*1000;
 await new Promise(r=>setTimeout(r,Math.max(0,scheduled-performance.now())));
 await page.evaluate(({title,index,total})=>{document.querySelector('#tour-callout').textContent=`${index} / ${total} — ${title}`},{title:scene.title,index:i+1,total:props.scenes.length});
 const actionStart=performance.now();
 if(scene.id==='overview')await focus(page.locator('.curriculum-hero h1'));
 if(scene.id==='language'){await focus(page.locator('.header select'),true);await page.keyboard.press('Escape');await page.locator('.header select').selectOption(locale)}
 if(scene.id==='lesson')await focus(page.locator('.course-list button').filter({hasText:'SOIL-U1-L01'}),true);
 if(scene.id==='video'){await openTab('learn');await focus(page.locator('video'));await page.locator('video').evaluate(v=>{v.muted=true;return v.play()});await new Promise(r=>setTimeout(r,5000));await page.locator('video').evaluate(v=>v.pause())}
 if(scene.id==='reading')await focus(page.locator('.lesson-illustration').first());
 if(scene.id==='practice'){await openTab('practice');await focus(page.locator('#practice-response'),true);await page.locator('#practice-response').pressSequentially(response[locale],{delay:30});await focus(page.locator('section').filter({has:page.locator('#practice-response')}).locator('summary'),true)}
 if(scene.id==='quiz'){await openTab('quiz');await focus(page.locator('.question input').first(),true);await focus(page.locator('.question .feedback').first())}
 if(scene.id==='trainer'){await openTab('field');await focus(page.locator('#notes'),true);await page.locator('#notes').fill(response[locale]);const download=page.waitForEvent('download');await focus(page.locator('.course-content button.primary'),true);const file=await download;await file.saveAs(resolve(folder,'demonstration-practice-record.json'))}
 if(scene.id==='assistant'){await openTab('assistant');await focus(page.locator('.course-content .panel').last())}
 if(scene.id==='revisit'){await openTab('learn');await focus(page.getByRole('heading',{name:revisit[locale],exact:true}));}
 actions.push({id:scene.id,startSeconds:(actionStart-began)/1000,completedSeconds:(performance.now()-began)/1000});
 if(performance.now()>scheduled+scene.durationInFrames/30*1000)throw Error('Tour actions overran narration segment: '+scene.id);
}
await new Promise(r=>setTimeout(r,Math.max(0,began+seconds*1000-performance.now())));
await cdp.send('Page.stopScreencast');await chain;
const first=frames[0].time;let concat='ffconcat version 1.0\n';
for(let i=0;i<frames.length;i++){
 const start=frames[i].time-first;const end=i+1<frames.length?Math.min(seconds,frames[i+1].time-first):seconds;
 if(start>=seconds)break;
 concat+=`file '${frames[i].file}'\nduration ${Math.max(.001,end-start).toFixed(6)}\n`;
}
concat+=`file '${frames.at(-1).file}'\n`;
await writeFile(resolve(captureDir,'frames.ffconcat'),concat);
await writeFile(resolve(folder,'capture-receipt.json'),JSON.stringify({locale,actualInterface:true,frames:frames.length,seconds,actions,errors,assistantLive:false},null,2));
await browser.close();if(errors.length)throw Error('Browser errors: '+errors.join('; '));
console.log(JSON.stringify({locale,frames:frames.length,seconds,captureDir}));
