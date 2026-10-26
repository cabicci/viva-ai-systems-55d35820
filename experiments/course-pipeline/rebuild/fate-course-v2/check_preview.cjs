const fs=require('fs'),path=require('path'),assert=require('assert');
const {JSDOM,VirtualConsole}=require('D:/Masaarat/viva-ai-systems-55d35820/node_modules/jsdom');
const P=path.resolve(__dirname,'../../../../../..');
// Resolve from the known worktree chain without assuming the shared checkout is writable.
let root=__dirname;while(!fs.existsSync(path.join(root,'HANDOVER.md'))){const next=path.dirname(root);assert.notEqual(next,root);root=next;}
const R=path.join(root,'rebuild-v2'),out=path.join(R,'preview');
const page=fs.readFileSync(path.join(out,'index.html'),'utf8'),js=fs.readFileSync(path.join(out,'app.js'),'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(page,{url:'file:///'+out.replaceAll('\\','/')+'/index.html',runScripts:'outside-only',virtualConsole:vc});
const w=dom.window,d=w.document;w.eval(js);
const payload=JSON.parse(d.getElementById('public-data').textContent);
assert.equal(Object.keys(payload.lessons).length,11);
assert(!page.includes('reasoningCriterion')&&!page.includes('answerIndex'));
function route(hash){w.location.hash=hash;w.dispatchEvent(new w.HashChangeEvent('hashchange'));}
function locale(l){const x=d.querySelector('[data-language]');x.value=l;x.dispatchEvent(new w.Event('change',{bubbles:true}));}
function tab(k){d.querySelector(`[data-tab="${k}"]`).click();}
let views=0,questions=0,worksheets=0;
route('#path');assert.equal(d.querySelectorAll('.step-row[href]').length,11);
for(const [id,lesson] of Object.entries(payload.lessons)){
 for(const l of ['ar','en']){
  route('#step/'+id);locale(l);
  assert.equal(d.querySelector('h1').textContent,lesson[l].title);
  assert.equal(d.documentElement.dir,l==='ar'?'rtl':'ltr');
  for(const k of ['reading','example','quiz','practice','faq','downloads','assistant']){
   tab(k);assert(d.getElementById('panel').textContent.trim().length>10);views++;
   if(k==='reading')assert.equal(d.querySelectorAll('.reading-section article').length,0); // no nested duplicate composer
   if(k==='practice'&&id!=='FATE2-S01'){assert.equal(d.querySelectorAll('[data-calc]').length,0);assert.equal(d.querySelectorAll('textarea').length,lesson[l].guided.prompts.length+lesson[l].practice.length);}
   if(k==='downloads'){
    const href=d.querySelector('#panel a').getAttribute('href');assert(fs.existsSync(path.join(out,href)));worksheets++;
    assert(!fs.readFileSync(path.join(out,href),'utf8').includes('reasoningCriterion'));
   }
  }
 }
 const qa=payload.assessments[id].items; questions+=qa.length;
 const keys=JSON.parse(fs.readFileSync(path.join(R,'private',id+'-assessment-key.en.json'),'utf8')).items;
 assert.deepEqual(qa.map(q=>q.id),keys.map(q=>q.id));
 for(const q of qa){assert(q.ar.question&&q.en.question);if(q.ar.options)assert.equal(q.ar.options.length,q.en.options.length);}
}
// A draft must remain in its own lesson and language after navigation.
route('#step/FATE2-S02');locale('ar');tab('practice');let area=d.querySelector('textarea');area.value='مسودة خاصة بالخطوة الثانية';area.dispatchEvent(new w.Event('input',{bubbles:true}));
route('#step/FATE2-S03');tab('practice');assert.equal(d.querySelector('textarea').value,'');
route('#step/FATE2-S02');tab('practice');assert.equal(d.querySelector('textarea').value,'مسودة خاصة بالخطوة الثانية');
locale('en');tab('practice');assert.equal(d.querySelector('textarea').value,'');
// Retain the pilot calculator and reject empty/partial/nonfinite/wrong-unit cases.
route('#step/FATE2-S01');locale('ar');tab('practice');
function setCalc(k,value){const x=d.querySelector(`[data-calc="${k}"]`);x.value=value;x.dispatchEvent(new w.Event('input',{bubbles:true}));}
setCalc('mass','٠٫٣');setCalc('amount','٠٫٠٢٧');d.querySelector('[data-check]').click();assert(d.querySelector('.feedback').textContent.includes(payload.lessons['FATE2-S01'].ar.guided.feedback.correct));
for(const bad of ['', '0.', 'Infinity', '0.3oops']){setCalc('mass',bad);d.querySelector('[data-check]').click();assert(!d.querySelector('.feedback').textContent.includes(payload.lessons['FATE2-S01'].ar.guided.feedback.correct));}
route('#step/FATE2-S99');assert(d.querySelector('.path-card'));
assert.deepEqual(errors,[]);
const result={utc:new Date().toISOString(),method:'In-memory jsdom, no native browser pixels or physical device test',scope:{steps:11,locales:2,tabViews:views,linkedWorksheetConsumers:worksheets,distinctQuestions:questions},passed:['All actual step routes and 154 tab views','22 worksheet targets exist','Public payload excludes private keys/rubrics','Arabic/English question and private-key IDs align','Step- and locale-scoped draft isolation','Pilot Arabic-digit calculation and malformed input rejection','Invalid route recovery'],notTested:['Native RTL/LTR pixels','Mobile physical device','Assistive technology','Print pagination','Independent subject/native-language review','Actual audio/video or hosted platform'],errors};
const destination=path.join(R,'full-preview-checks.en.json');assert(!fs.existsSync(destination));fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
