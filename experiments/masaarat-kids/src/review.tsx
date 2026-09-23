import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen,PlayCircle,Target,CheckCircle2,Wrench,Flag,MessageCircle,ArrowLeft,ArrowRight,Play,ChevronDown,Milestone} from 'lucide-react';
import {IntroSection} from '../../../src/components/intro/IntroSection';
import {QuizBlock} from '../../../src/components/intro/QuizBlock';
import {Button} from '../../../src/components/ui/button';
import {getUiString} from '../../../src/lib/locale/ui-strings';
import {LocaleProvider} from './review-locale';
const payload=JSON.parse(document.getElementById('data')!.textContent!);
const {course,images,media,localMedia}=payload;
const locales=['ar-EG','ar-MSA','ar-Gulf','en'];
const names=['المصرية','العربية الفصحى','الخليجية','English'];
const labels={ar:{brand:'مسارات كيدز',level:'المستوى الأول · ١٠–١٢ سنة',lessons:'الدروس',video:'فيديو الدرس',read:'افهم الفكرة',goals:'هتتعلّم إيه؟',example:'مثال عملي',try:'جرّب بنفسك',quiz:'اختبر فهمك',mission:'مهمتك',check:'راجع شغلك',helper:'تلميحات الدرس',prev:'الدرس السابق',next:'الدرس التالي',source:'ارجع للشرح',missing:'تقدر تبدأ بالشرح المكتوب. فيديو الدرس لسه بيتجهّز.',local:'الفيديو متاح في نسخة التجربة على الديل.',initial:'الطلب الأول',improved:'طلب أوضح',followup:'راجع النتيجة',answer:'اكتب تجربتك هنا',clear:'مسح',privacy:'استخدم تفاصيل خيالية، من غير بيانات شخصية.',notes:'ملاحظاتي',hint:'تلميحات من محتوى الدرس',image:'الصورة التوضيحية',more:'شرح إضافي'},en:{brand:'Masaarat Kids',level:'Level 1 · Ages 10–12',lessons:'Lessons',video:'Lesson video',read:'Understand the idea',goals:'What you will learn',example:'Worked example',try:'Try it yourself',quiz:'Check your understanding',mission:'Your mission',check:'Check your work',helper:'Lesson hints',prev:'Previous lesson',next:'Next lesson',source:'Back to the explanation',missing:'Start with the written lesson. The video is being prepared.',local:'The video is available in the Dell pilot copy.',initial:'First request',improved:'Clearer request',followup:'Review the result',answer:'Write your attempt here',clear:'Clear',privacy:'Use fictional details, without personal information.',notes:'My notes',hint:'Hints from this lesson',image:'Lesson illustration',more:'More explanation'}};
function Lesson({d,n,w,locale}:{d:any,n:number,w:any,locale:string}){
 const [answer,setAnswer]=useState(''),[parts,setParts]=useState(['','','']),[built,setBuilt]=useState('');
 let index=0;
 const card=(title:string,body:any,Icon=BookOpen,tone:any='accent',id?:string)=><div key={id||index} id={id}><IntroSection index={++index} icon={Icon} eyebrow={w.brand} title={title} tone={tone}>{body}</IntroSection></div>;
 const p=(t:string)=><p className="whitespace-pre-line">{t}</p>;
 const reading=n===1?d.scenes.slice(3,6).map((s:any)=>({id:s.id,title:s.title,text:s.display})):d.reading;
 const source=(id:string)=>{const s=d.scenes.find((x:any)=>x.id===id)||d.reading?.find((x:any)=>x.id===id);return s?<details className="mt-3 text-sm"><summary className="cursor-pointer text-primary">{w.source}</summary><p className="mt-3">{s.narration||s.text}</p></details>:null;};
 return <article className="space-y-4 md:space-y-7" data-lesson={n}>
 <aside className="rounded-2xl border border-accent/30 bg-gradient-to-l from-accent/[0.08] to-primary/[0.05] px-4 sm:px-5 py-4 flex items-start gap-3"><Target className="h-5 w-5 text-primary shrink-0 mt-1"/>{p(d.subtitle)}</aside>
 <div className="flex justify-end"><a href="#mission" className="rounded-full border border-primary/30 bg-primary/[0.08] px-4 py-2.5 text-xs text-primary">{w.mission}</a></div>
 {n===1&&localMedia?card(w.video,<video controls playsInline preload="metadata" className="w-full aspect-video rounded-xl border border-border" src={media[locale].url}/>,PlayCircle,'primary','watch'):<p className="text-center text-xs text-muted-foreground py-2">{n===1?w.local:w.missing}</p>}
 {card(w.goals,<ul className="space-y-3">{d.objectives.map((x:string,i:number)=><li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1"/><span>{x}</span></li>)}</ul>,Target)}
 {reading.map((x:any)=>card(x.title,p(x.text),BookOpen,'accent','source-'+x.id))}
 {d.promptExamples&&card(w.example,<><div className="grid sm:grid-cols-2 gap-3">{['initial','improved'].map(k=><div key={k} className={'rounded-xl border p-3 '+(k==='improved'?'border-accent/20 bg-accent/[0.05]':'border-border bg-foreground/5')}><p className="text-[11px] text-muted-foreground mb-1">{w[k]}</p>{p(d.promptExamples[k])}</div>)}</div><details><summary className="cursor-pointer text-sm text-primary">{w.followup}</summary>{p(d.promptExamples.followup)}</details></>)}
 {n===1&&card(w.image,<figure className="overflow-hidden rounded-2xl border border-primary/20 bg-card"><img data-lesson-image src={images[locale]} alt={d.pageIllustration?.title||d.imageBrief.altText} className="block w-full h-auto"/></figure>,BookOpen,'primary')}
 {n===1&&<details className="rounded-2xl border border-border p-4"><summary className="text-sm cursor-pointer">{w.more}</summary><div className="space-y-4 mt-4">{d.scenes.filter((s:any)=>!reading.some((r:any)=>r.id===s.id)).map((s:any)=><div key={s.id} id={'source-'+s.id}><h3 className="font-semibold">{s.title}</h3>{p(s.narration)}</div>)}</div></details>}
 {card(w.quiz,<QuizBlock lessonId={'kids-preview-'+n} items={d.quiz.map((q:any,i:number)=>({id:q.id||'q'+i,bloom:['remember','understand','apply'][Math.min(i,2)],question:q.question,options:q.options,correctIndex:q.answer,explanation:q.explanation}))}/>,CheckCircle2)}
 {card(d.activity?.title||w.try,<>
 <p className="text-xs text-muted-foreground">{w.privacy}</p>
 {d.materials?.map((m:any,i:number)=><div key={i} className="rounded-xl border border-border bg-muted/30 p-4"><h3 className="font-semibold mb-2">{m.title}</h3>{p(m.text)}</div>)}
 {d.activity?<>{p(d.activity.instructions)}{p(d.activity.starter)}<label className="block text-sm">{w.answer}<textarea className="review-input" value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={3000}/></label><p className="text-xs text-muted-foreground">{d.activity.expectedEvidence}</p></>:n===1?<><div className="space-y-3">{['goal','details','format'].map((k,i)=><label key={k} className="block text-sm">{d.labels[k]}<textarea className="review-input" value={parts[i]} maxLength={300} placeholder={[d.prompt.task,d.prompt.details,d.prompt.format][i]} onChange={e=>setParts(parts.map((x,j)=>j===i?e.target.value:x))}/></label>)}</div><button className="review-button" disabled={parts.some(x=>!x.trim())} onClick={()=>setBuilt(parts.map(x=>x.trim()).join(' '))}>{d.labels.build}</button>{built&&<p role="status" className="rounded-xl bg-accent/10 p-4">{built}</p>}</>:p(d.mission.instructions)}
 </>,Wrench,'primary','try')}
 {card(d.mission.title,<><div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 space-y-3">{p(d.mission.instructions)}</div><details><summary className="cursor-pointer font-semibold text-primary text-sm">{w.check}</summary><div className="mt-3 space-y-3">{d.mission.rubric.map((x:string,i:number)=><label key={i} className="flex items-start gap-3 text-sm"><input className="mt-1 accent-[var(--primary)]" type="checkbox"/><span>{x}</span></label>)}</div></details></>,Flag,'primary','mission')}
 {card(w.helper,<><p className="text-xs text-muted-foreground">{w.hint}</p>{d.hints.map((h:any,i:number)=><details key={i} className="border-b border-border pb-3"><summary className="cursor-pointer font-semibold text-sm">{h.question}</summary><div className="mt-3">{p(h.answer)}{source(h.sourceScene||h.source)}</div></details>)}</>,MessageCircle)}
 </article>;
}

function readRoute(){const m=location.hash.match(/^#\/learn\/(\d+)$/);return m&&Number(m[1])>=1&&Number(m[1])<=course.length?Number(m[1])-1:null;}
function App(){
 const [locale,setLocale]=useState('ar-EG'),[selected,setSelected]=useState<number|null>(readRoute),[expanded,setExpanded]=useState(true);
 const w={...labels[locale==='en'?'en':'ar'],...(locale==='ar-MSA'?{goals:'ماذا ستتعلّم؟',missing:'يمكنك البدء بالشرح المكتوب. فيديو الدرس قيد الإعداد.'}:locale==='ar-Gulf'?{goals:'وش بتتعلّم؟',missing:'تقدر تبدأ بالشرح المكتوب. فيديو الدرس قيد التجهيز.'}:{})};
 const t=(key:any)=>getUiString(locale as any,key);
 useEffect(()=>{const change=()=>{if(location.hash==='#/dashboard'||/^#\/learn\/\d+$/.test(location.hash))setSelected(readRoute());};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{document.documentElement.lang=locale==='en'?'en':'ar';document.documentElement.dir=locale==='en'?'ltr':'rtl';window.scrollTo(0,0);},[locale,selected]);
 const Previous=locale==='en'?ArrowLeft:ArrowRight,Next=locale==='en'?ArrowRight:ArrowLeft;
 const d=selected===null?null:course[selected].locales[locale];
 return <LocaleProvider effectiveLocale={locale as any}><div className="min-h-screen">
 <header className="review-topbar glass border-b border-border">
 <a href="#/dashboard" aria-label={t('learn.backToDashboard')}><img src={payload.logo} alt={w.brand} className="w-28 h-12 object-contain"/></a>
 <select id="locale" aria-label="Language" className="review-select" value={locale} onChange={e=>setLocale(e.target.value)}>{locales.map((l,i)=><option key={l} value={l}>{names[i]}</option>)}</select>
 </header>
 {selected===null?<main className="flex-1 min-w-0 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12" data-dashboard>
 <header className="mb-8"><h1 className="text-2xl md:text-4xl font-black leading-tight">{w.brand}</h1><p className="mt-3 text-muted-foreground">{w.level}</p></header>
 <div className="rounded-2xl p-6 border border-border/60" style={{background:'var(--pastel-cream)'}}>
 <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><BookOpen className="h-5 w-5"/>{w.brand}</h2>
 <div className="glass rounded-xl border border-primary/20 overflow-hidden">
 <button id="module-toggle" type="button" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} className="w-full flex items-center justify-between gap-3 p-4 text-start hover:bg-foreground/5 transition">
 <span dir="ltr" className="grid h-8 min-w-10 px-2 place-items-center rounded-md shrink-0 bg-[image:var(--gradient-primary)] text-primary-foreground text-xs font-black">M1</span><span className="flex-1 min-w-0 font-semibold">{w.level}</span><ChevronDown className={'h-4 w-4 text-muted-foreground shrink-0 transition-transform '+(expanded?'rotate-180':'')}/>
 </button>
 {expanded&&<div className="px-4 pb-4 pt-2 border-t border-border/40"><div className="grid sm:grid-cols-2 gap-2.5 mt-3">
 {course.map((item:any,i:number)=><div key={i} id={'lesson-card-'+(i+1)} className="glass rounded-lg p-3 flex flex-col gap-2 border-primary/20">
 <div className="flex items-start gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-md shrink-0 bg-[image:var(--gradient-primary)]"><span dir="ltr" className="text-xs font-black text-primary-foreground tabular-nums leading-none">{i+1}</span></div><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm leading-tight">{item.locales[locale].title}</h3></div></div>
 <Button asChild size="sm" variant="hero" className="w-full h-8 text-xs"><a data-open-lesson={i+1} href={'#/learn/'+(i+1)}><Play className="h-3 w-3"/>{t('dashboard.lesson.start')}</a></Button>
 </div>)}</div></div>}
 </div></div></main>:<main className="flex-1 min-w-0 max-w-[48rem] mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
 <a id="back-dashboard" href="#/dashboard" className="inline-flex items-center gap-2 rounded-full glass border border-primary/30 px-3 py-2 text-xs font-medium text-foreground/90 hover:bg-foreground/5 transition mb-6"><Previous className="h-4 w-4"/>{t('learn.backToDashboard')}</a>
 <header className="mb-8"><div className="flex items-center gap-2 mb-3 flex-wrap"><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-mono"><BookOpen className="h-3 w-3"/>{w.brand}</span><span className="text-[11px] font-mono text-muted-foreground">{w.level} · {String(selected+1).padStart(2,'0')}/12</span></div><h1 className="text-2xl md:text-4xl font-black leading-tight">{d.title}</h1></header>
 <Lesson key={locale+selected} d={d} n={selected+1} w={w} locale={locale}/>
 <section className="mt-8 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5"><p className="text-[11px] font-mono flex items-center gap-1.5 mb-2 text-primary"><Milestone className="h-3.5 w-3.5"/>{t(selected<11?'learn.continuity.next':'learn.continuity.lastInPath')}</p>{selected<11&&<p className="text-[15px] leading-[1.9] text-foreground/90">{course[selected+1].locales[locale].title}</p>}</section>
 <nav className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between" aria-label={w.lessons}>
 <div className="flex min-w-0 flex-wrap gap-2">{selected>0?<Button asChild variant="glass" size="sm"><a id="prev" href={'#/learn/'+selected}><Previous className="h-4 w-4"/>{t('learn.nav.previous')}</a></Button>:<span/>}</div>
 <div className="flex gap-2"><Button asChild variant="violet" size="sm"><a id={selected<11?'next':'finish-path'} href={selected<11?'#/learn/'+(selected+2):'#/dashboard'}>{t(selected<11?'learn.nav.next':'learn.backToDashboard')}<Next className="h-4 w-4"/></a></Button></div></nav>
 </main>}</div></LocaleProvider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
