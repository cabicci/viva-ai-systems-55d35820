const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {JSDOM}=require('D:/Masaarat/viva-ai-systems-55d35820/node_modules/jsdom');
const R=path.resolve(process.argv[2]),P=path.join(R,'preview');
const html=fs.readFileSync(path.join(P,'index.html'),'utf8'),app=fs.readFileSync(path.join(P,'app.js'),'utf8'),moduleText=fs.readFileSync(path.join(P,'intake-practice.js'),'utf8');
const dom=new JSDOM(html,{url:'https://masaarat.invalid/#step/FATE2-S02',runScripts:'outside-only'}),w=dom.window,d=w.document;w.eval(moduleText);w.eval(app);
const findings=[];let checks=0;
function route(id){w.location.hash='#step/'+id;w.dispatchEvent(new w.HashChangeEvent('hashchange'));}
function lang(l){const e=d.querySelector('[data-language]');e.value=l;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function practice(){d.querySelector('[data-tab="practice"]').click();assert(d.querySelector('[data-intake-practice]'));}
const select=(sel,value)=>{const e=d.querySelector(sel);assert(e,sel);e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
const input=(name,v)=>{const e=d.querySelector(`[data-intake-field="${name}"]`);assert(e,name);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));};
const click=sel=>{const e=d.querySelector(sel);assert(e,sel);e.click()};
const feedback=()=>d.querySelector('[data-intake-feedback]').textContent;
function expected(pattern){click('[data-intake-check]');assert(pattern.test(feedback()),feedback());checks++}
function reset(){click('[data-intake-reset]');}
function identity(){const e=d.querySelector('[data-intake-identity]');e.checked=true;e.dispatchEvent(new w.Event('change',{bubbles:true}));}
function menuAnswers(){input('amount','.05');input('intake','.001');input('ratio','10');identity()}
for(const l of ['ar','en']){
 lang(l);route('FATE2-S02');practice();
 expected(l==='ar'?/كمّل/:/Complete/);
 menuAnswers();expected(l==='ar'?/مظبوطين/:/correct for this case/);
 click('[data-intake-reveal]');assert(/0.001/.test(d.querySelector('[data-intake-solution]').textContent));checks++;
 input('m0','151');assert.equal(feedback(),'');assert.equal(d.querySelector('[data-intake-solution]').textContent,'');checks++;
 reset();menuAnswers();input('m0','.15');select('[data-intake-unit="0"]','kg/day');expected(l==='ar'?/مظبوطين/:/correct for this case/);
 reset();menuAnswers();input('amount','.25');expected(l==='ar'?/الكتلة اليومية/:/daily residue mass/);
 reset();menuAnswers();input('intake','.05');expected(l==='ar'?/اقسمها/:/Divide by body weight/);
 reset();menuAnswers();select('[data-intake-answer-unit]','mg/kg food');expected(l==='ar'?/وحدة الإجابة/:/answer unit/);
 reset();menuAnswers();input('ratio','.1');expected(l==='ar'?/نسبة مئوية/:/percent/);
 reset();menuAnswers();input('body','0');expected(l==='ar'?/أكبر من صفر/:/greater than zero/);
 reset();menuAnswers();input('c0','-0.2');expected(l==='ar'?/السالبة/:/Negative/);
 for(const bad of ['1e999','0.2mg','1.2.3','NaN','Infinity','1e-999']){reset();menuAnswers();input('c0',bad);expected(l==='ar'?/أرقام كاملة/:/complete numbers/)}
 reset();menuAnswers();input('c0','1e308');input('m0','1e308');expected(l==='ar'?/المجال العددي/:/numerical calculation range/);
 reset();menuAnswers();input('c0','1e-300');input('m0','1e-300');expected(l==='ar'?/المجال العددي/:/numerical calculation range/);
 reset();menuAnswers();input('c0','0');input('c1','0');input('amount','0');input('intake','0');input('ratio','0');expected(l==='ar'?/مظبوطين/:/correct for this case/);
 reset();menuAnswers();input('amount','٠٫٠٥');input('intake','٠٫٠٠١');input('ratio','١٠');expected(l==='ar'?/مظبوطين/:/correct for this case/);
 reset();menuAnswers();input('amount','۰٫۰۵');input('intake','۰٫۰۰۱');input('ratio','۱۰');expected(l==='ar'?/مظبوطين/:/correct for this case/);
 reset();menuAnswers();input('amount','0,05');input('intake','0,001');expected(l==='ar'?/مظبوطين/:/correct for this case/);
 reset();input('amount','.05');input('intake','.001');input('ratio','10');expected(l==='ar'?/تعريف المتبقّي/:/residue definition/);
 identity();select('[data-intake-case]','transfer');assert(!d.querySelector('[data-intake-field="ratio"]'));checks++;
 input('amount','.020');input('intake','.0005');identity();expected(l==='ar'?/مظبوطين/:/correct for this case/);
 const explanation=d.querySelector('[data-intake-explanation]');explanation.value='ungraded reasoning '+l;explanation.dispatchEvent(new w.Event('input',{bubbles:true}));
 click('[data-tab="reading"]');practice();assert.equal(d.querySelector('[data-intake-explanation]').value,'ungraded reasoning '+l);checks++;
 select('[data-intake-case]','menu');assert.equal(d.querySelector('[data-intake-field="amount"]').value,'.05');checks++;
 const before=d.querySelector('[data-intake-field="amount"]').value;select('[data-intake-case]','transfer');reset();select('[data-intake-case]','menu');assert.equal(d.querySelector('[data-intake-field="amount"]').value,before);checks++;
 assert(d.querySelector('[data-draft="guided-FATE2-S02-'+l+'-0"]'));assert(d.querySelector('[data-draft="practice-FATE2-S02-'+l+'-1"]'));checks++;
 findings.push('Complete numerical/error/reveal/invalidation/reset/re-entry and original reasoning-consumer checks: '+l);
}
// Locale states and other steps remain separate; existing first-step media stays exact.
lang('ar');route('FATE2-S02');practice();input('amount','123');lang('en');assert.notEqual(d.querySelector('[data-intake-field="amount"]').value,'123');checks++;
route('FATE2-S01');assert(d.querySelector('video'));assert(!d.querySelector('[data-intake-practice]'));checks++;
for(let i=1;i<=11;i++){route('FATE2-S'+String(i).padStart(2,'0'));for(const l of ['ar','en']){lang(l);for(const b of [...d.querySelectorAll('[data-tab]')]){d.querySelector(`[data-tab="${b.dataset.tab}"]`).click();assert(d.getElementById('panel').textContent.trim());checks++;}}}
const dataText=d.getElementById('public-data').textContent;assert(!/assessment-key|correctOption|answerKey|private\//.test(dataText));checks++;
const receipt={utc:new Date().toISOString(),method:'In-memory jsdom source-bound behavior regression; no native browser pixels or physical proficiency claim.',sourceSHA256:crypto.createHash('sha256').update(moduleText).digest('hex'),checks,passed:findings.concat(['Arabic and Persian digit equivalence','All154existing step/locale/tab views','Private keys excluded','First-step media and independent reasoning prompts retained']),notTested:['Native viewport/RTL pixels','Keyboard traversal and screen-reader operation on a native browser','Full native video/audio playback','Physical observations','Independent expert/native review'],errors:[]};
fs.writeFileSync(path.join(R,'media-plan/FATE2-S02/interaction-checks.en.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));dom.window.close();
