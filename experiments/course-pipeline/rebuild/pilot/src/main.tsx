import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen,PlayCircle,Layers3,Box,ClipboardCheck,Shovel,Download,MessagesSquare,Check,ArrowLeft,ArrowRight,RotateCcw,ShieldCheck,MapPin,ChevronDown} from 'lucide-react';
import en from './content/en.json';import ar from './content/ar-EG.json';import it from './content/it.json';import de from './content/de.json';
import {Site3D} from './Site3D';
import {useMedia,LessonVideo,LessonIllustration} from './Media';
import {evaluateDecisions,emptyState,restoreState,freshAttempt} from './logic.mjs';
import './style.css';

const packs:any={'ar-EG':ar,en,it,de}, ids=['reading','video','examples','training','assessment','practical','downloads','assistant'];
const icons=[BookOpen,PlayCircle,Layers3,Box,ClipboardCheck,Shovel,Download,MessagesSquare];
const logo=new URL('../../../../../public/brand/masaarat-logo-lockup.png',import.meta.url).href;
const storage='masaarat:rebuild:S1-01:v1';
function App(){
 const media=useMedia();
 const params=new URLSearchParams(location.search);
 const [locale,setLocale]=useState(packs[params.get('lang')||'']?params.get('lang')!:'ar-EG');
 const [tab,setTab]=useState(ids.includes(params.get('tab')||'')?params.get('tab')!:'reading');
 const [state,setState]=useState(()=>{try{return restoreState(localStorage.getItem(storage))}catch{return emptyState()}});
 const [selected,setSelected]=useState(0),[pending,setPending]=useState<number|null>(null),[feedback,setFeedback]=useState<number|null>(null),[note,setNote]=useState('');
 const p=packs[locale],u=p.ui,rtl=p.dir==='rtl';
 const test=tab==='assessment', answers=test?state.test:state.practice;
 const result=evaluateDecisions(p.points,state.test), practice=evaluateDecisions(p.points,state.practice);
 const quiz=evaluateDecisions(p.quiz,state.quiz);
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=p.dir;document.title=`${p.title} · Masaarat`;const url=new URL(location.href);url.searchParams.set('lang',locale);url.searchParams.set('tab',tab);history.replaceState(null,'',url);setNote('')},[locale,tab]);
 useEffect(()=>{try{localStorage.setItem(storage,JSON.stringify(state))}catch{/* The session remains usable if local storage is disabled. */}},[state]);
 function move(id:string){setTab(id);setFeedback(null);setPending(null);setNote('');}
 function focusPoint(n:number){setSelected(n);setFeedback(null);setPending(null);}
 function choose(n:number){if(test){if(!state.testSubmitted)setState((s:any)=>({...s,test:{...s.test,[p.points[selected].id]:n}}));}else{setPending(n);setFeedback(null);}}
 function check(){if(pending===null)return;setFeedback(pending);setState((s:any)=>({...s,practice:{...s.practice,[p.points[selected].id]:pending}}));}
 function revisit(id:string){move('reading');setTimeout(()=>document.getElementById(`read-${id}`)?.scrollIntoView({block:'start',behavior:'smooth'}),80);}
 function submitTest(){if(result.answered!==p.points.length){setNote(u.testMissing);return;}setState((s:any)=>({...s,testSubmitted:true}));setNote('');}
 function startTest(){setState((s:any)=>freshAttempt(s));move('assessment');setSelected(0);}
 async function download(kind:string){
  const {worksheetHtml}=await import('./printables');
  const title=kind==='field'?u.practical:u.selfCheck;
  const rows=kind==='field'?p.practical:p.checklistLabels;
  const html=worksheetHtml(p,title,rows,kind==='field'?u.practicalIntro:u.write);
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`Masaarat-S1-01-${kind}-${locale}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 const current=p.points[selected], chosen=test?state.test[current.id]:pending;
 const reveal=test&&state.testSubmitted?state.test[current.id]:feedback;
 const currentCorrect=reveal===current.answer;
 return <div className="app-shell">
  <header className="topbar"><a className="brand" href="#content" aria-label="Masaarat"><img src={logo} alt="Masaarat"/></a><span className="preview-label">{u.preview}</span><label className="language-label"><span className="sr-only">Language / اللغة</span><select value={locale} onChange={e=>setLocale(e.target.value)}>{Object.values(packs).map((x:any)=><option key={x.locale} value={x.locale}>{x.name}</option>)}</select><ChevronDown size={15}/></label></header>
  <div className="breadcrumb"><span>{p.path}</span><span>/</span><span>{p.station}</span></div>
  <section className="lesson-heading"><div><p className="eyebrow">{p.step}</p><h1>{p.title}</h1><p className="intro">{p.intro}</p></div><div className="heading-emblem"><ShieldCheck size={54} strokeWidth={1.25}/></div></section>
  <div className="lesson-layout">
   <aside className="sidebar"><nav aria-label={p.title}>{ids.map((id,i)=>{const Icon=icons[i];return <button type="button" key={id} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>move(id)}><Icon size={20}/><span>{u[id]}</span>{id==='reading'&&state.read&&<Check size={15}/>}</button>})}</nav><div className="progress-box"><strong>{u.progress}</strong><div><span>{u.allRead}</span><span>{state.read?'1 / 1':'0 / 1'}</span></div><div><span>{u.decisionCount}</span><span>{state.testSubmitted?result.correct:0} / 8</span></div><progress aria-label={u.decisionCount} max={8} value={state.testSubmitted?result.correct:0}/><p>{u.unobserved}</p><small>{u.local}</small></div></aside>
   <main id="content" className="lesson-panel">
   {tab==='reading'&&<article className="reading"><div className="goals"><ShieldCheck size={25}/><div><h2>{u.goals}</h2><ol>{p.goals.map((x:string,i:number)=><li key={i}>{x}</li>)}</ol></div></div>{p.reading.map((r:any,i:number)=><section key={r.id} id={`read-${r.id}`} className="reading-section"><span className="section-index">{String(i+1).padStart(2,'0')}</span><h2>{r.title}</h2>{r.paragraphs.map((x:string,n:number)=><p key={n}>{x}</p>)}<LessonIllustration id={r.id} p={p} available={media.illustrations}/></section>)}<section className="reflection"><h3>{u.reflection}</h3><label htmlFor="reflection">{u.reflectionPrompt}</label><textarea id="reflection" value={state.reflection} onChange={e=>setState((s:any)=>({...s,reflection:e.target.value}))}/></section><details className="glossary"><summary>{u.glossary}</summary><dl>{p.glossary.map(([term,desc]:string[])=><div key={term}><dt>{term}</dt><dd>{desc}</dd></div>)}</dl></details><button className="primary" onClick={()=>setState((s:any)=>({...s,read:true}))}><Check size={18}/>{state.read?u.seenDone:u.seen}</button></article>}
   {tab==='reading'&&<section className="reflection"><fieldset><legend>{p.selfReflection.question}</legend>{p.selfReflection.labels.map((label:string,i:number)=><label className="option" key={i}><input type="radio" name="self-rating" checked={state.selfRating===['can','cannot','partly'][i]} onChange={()=>setState((s:any)=>({...s,selfRating:['can','cannot','partly'][i]}))}/>{label}</label>)}</fieldset><p className="muted">{p.selfReflection.note}</p></section>}
   {tab==='video'&&<LessonVideo p={p} available={media.locales.includes(locale)}/> }
   {tab==='examples'&&<section><h2>{u.examples}</h2>{p.examples.map((ex:any,i:number)=><article className="worked" key={ex.id}><span className="section-index">0{i+1}</span><h3>{ex.title}</h3><p className="situation">{ex.situation}</p><ol>{ex.reasoning.map((x:string,j:number)=><li key={j}>{x}</li>)}</ol><blockquote>{ex.takeaway}</blockquote></article>)}</section>}
   {(tab==='training'||test)&&<section className="interactive"><div className="panel-title"><div><p className="eyebrow">{test?`${u.attempt} ${state.attempt||1}`:u.decisionCount}</p><h2>{test?u.simulationTitle:u.practiceTitle}</h2></div><span className="count-pill">{test?result.answered:practice.correct} / 8</span></div><p className="mode-note">{test?u.testNote:u.trainingNote}</p>
    <Site3D points={p.points} selected={selected} onSelect={focusPoint} ui={u} done={test?(state.testSubmitted?result.items.filter((x:any)=>x.correct).map((x:any)=>x.id):[]):practice.items.filter((x:any)=>x.correct).map((x:any)=>x.id)}/>
    <p className="accessible-note">{u.accessible}</p><div className="point-grid" aria-label={u.list}>{p.points.map((point:any,i:number)=><button key={point.id} type="button" className={i===selected?'selected':''} aria-pressed={i===selected} onClick={()=>focusPoint(i)}><span>{i+1}</span>{point.label}{Number.isInteger(answers[point.id])&&<Check size={14} aria-label={test?u.testSubmit:u.check}/>}</button>)}</div>
    <section className="decision" aria-labelledby="decision-title"><div className="decision-label"><MapPin size={18}/><span>{String(selected+1).padStart(2,'0')} · {current.label}</span></div><p className="situation">{current.description}</p><h3 id="decision-title">{current.question}</h3><fieldset disabled={test&&state.testSubmitted}><legend className="sr-only">{u.choose}</legend>{current.options.map((x:string,i:number)=><label className={`option ${chosen===i?'chosen':''}`} key={i}><input type="radio" name="decision" checked={chosen===i} onChange={()=>choose(i)}/><span>{x}</span></label>)}</fieldset>
     {!test&&<button className="primary" disabled={pending===null} onClick={check}>{u.check}<Check size={17}/></button>}
     {reveal!==null&&reveal!==undefined&&<div className={`feedback ${currentCorrect?'success':'repair'}`} role="status"><strong>{currentCorrect?u.right:u.wrong}</strong><p>{current.feedback[reveal]}</p><button onClick={()=>revisit(current.readingId)}>{u.readMore}</button>{!currentCorrect&&!test&&<button onClick={()=>{setPending(null);setFeedback(null)}}>{u.retry}</button>}</div>}
     <div className="decision-nav"><button disabled={selected===0} onClick={()=>focusPoint(selected-1)}>{rtl?<ArrowRight size={17}/>:<ArrowLeft size={17}/>} {u.back}</button><button disabled={selected===7} onClick={()=>focusPoint(selected+1)}>{u.continue} {rtl?<ArrowLeft size={17}/>:<ArrowRight size={17}/>}</button></div>
    </section>
    {test?<div className="assessment-bottom">{!state.testSubmitted?<button className="primary" onClick={submitTest}>{u.testSubmit}</button>:<div className={result.passed?'feedback success':'feedback repair'} role="status"><h3>{u.result}: {result.correct} / 8</h3><p>{result.passed?u.pass:u.notPass}</p><p>{u.reviewChecklist}</p><p>{u.unobserved}</p></div>}<button onClick={startTest}><RotateCcw size={16}/>{u.testStart}</button><p>{u.unlimited}</p>{note&&<p role="alert">{note}</p>}</div>:<button className="primary" onClick={startTest}>{u.testStart}<ClipboardCheck size={19}/></button>}
   </section>}
   {test&&<>
    <section className="quiz"><h2>{u.quizTitle}</h2>{p.quiz.map((q:any,i:number)=><fieldset key={q.id}><legend>{i+1}. {q.question}</legend>{q.options.map((x:string,n:number)=><label className={`option ${state.quiz[q.id]===n?'chosen':''}`} key={n}><input type="radio" name={q.id} checked={state.quiz[q.id]===n} onChange={()=>setState((s:any)=>({...s,quiz:{...s.quiz,[q.id]:n},quizSubmitted:false}))}/><span>{x}</span></label>)}{state.quizSubmitted&&<p className={`quiz-feedback ${state.quiz[q.id]===q.answer?'correct':'incorrect'}`}>{state.quiz[q.id]===q.answer?u.right:u.wrong} — {q.feedback}</p>}</fieldset>)}<button onClick={()=>{if(quiz.answered===p.quiz.length){setState((s:any)=>({...s,quizSubmitted:true}));setNote('')}else setNote(u.testMissing)}}>{u.quizSubmit}</button>{state.quizSubmitted&&<span className="count-pill">{quiz.correct} / {quiz.total}</span>}</section>
    <section className="checklist"><h2>{u.selfCheck}</h2><p>{u.write}</p>{p.checklistLabels.map((x:string,i:number)=><label key={i}><strong>{i+1}. {x}</strong><textarea value={state.checklist[i]} onChange={e=>setState((s:any)=>({...s,checklist:s.checklist.map((t:string,j:number)=>j===i?e.target.value:t)}))}/></label>)}<button onClick={()=>setNote(u.saved)}>{u.save}</button><p className="muted">{u.reviewChecklist}</p><details><summary>{u.model}</summary><p>{u.exampleOnly}</p><ol>{p.checklistModel.map((x:string,i:number)=><li key={i}>{x}</li>)}</ol></details></section>
   </>}
   {tab==='practical'&&<section><h2>{u.practical}</h2><p>{u.practicalIntro}</p><ol className="practical-steps">{p.practical.map((x:string,i:number)=><li key={i}>{x}</li>)}</ol><div className="feedback repair"><strong>{u.fieldLabel}</strong><p>{u.unobserved}</p></div><button onClick={()=>download('field')}><Download size={18}/>{u.downloadField}</button></section>}
   {tab==='downloads'&&<section><h2>{u.downloads}</h2><p>{u.downloadHint}</p><div className="downloads"><button onClick={()=>download('practice')}><Download size={22}/>{u.downloadPractice}</button><button onClick={()=>download('field')}><Download size={22}/>{u.downloadField}</button></div></section>}
   {tab==='assistant'&&<section className="plain-panel"><MessagesSquare size={42}/><h2>{u.assistant}</h2><p>{u.assistantPending}</p></section>}
   {note&&tab!=='training'&&<p className="save-note" role="status">{note}</p>}
   <footer className="panel-footer"><span>{p.step}</span>{ids.indexOf(tab)<ids.length-1&&<button onClick={()=>move(ids[ids.indexOf(tab)+1])}>{u.next}{rtl?<ArrowLeft size={17}/>:<ArrowRight size={17}/>}</button>}</footer>
   </main>
  </div><footer className="site-footer">Masaarat · {p.path}</footer>
 </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
