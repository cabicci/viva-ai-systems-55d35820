/// <reference types="vite/client" />
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Diagram} from './Diagram';
import {checkPlan,fieldPoints,retrieve} from './learning.mjs';
import en from '../course/en.json';
import ar from '../course/ar-EG.json';
import it from '../course/it.json';
import de from '../course/de.json';
import references from '../course/references.json';
import visualPlan from '../course/visuals.json';
import './style.css';

const lessons:any={'ar-EG':ar,en,it,de};
const tabs=['learn','practice','check','field','assistant','glossary'];
const logo=new URL('../../../public/brand/masaarat-logo-lockup.png',import.meta.url).href;
const assetFiles=import.meta.glob('../visuals-v2/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const soilCore=assetFiles['../visuals-v2/soil-core.png'];
const sceneArtwork=(id:string)=>{const asset=visualPlan.assets.find(a=>a.scenes.includes(id));return asset?assetFiles[`../visuals-v2/${asset.id}.png`]:undefined};
function readState(locale:string){try{return JSON.parse(localStorage.getItem(`soil-pilot:${locale}`)||'{}')}catch{return {}}}
function App(){
 const initial=new URLSearchParams(location.search).get('lang');
 const [locale,setLocale]=useState(initial&&lessons[initial]?initial:'ar-EG');
 const [tab,setTab]=useState('learn');
 const [part,setPart]=useState(0);
 const [state,setState]=useState(()=>readState(locale));
 const [mapMessage,setMapMessage]=useState('');
 const [query,setQuery]=useState('');
 const [reply,setReply]=useState<any>(undefined);
 const [media,setMedia]=useState<string[]>([]);
 const [captionText,setCaptionText]=useState('');
 function syncCaption(event:React.SyntheticEvent<HTMLVideoElement>){const track=event.currentTarget.textTracks[0];setCaptionText(track?.mode==='hidden'?Array.from(track.activeCues??[]).map(c=>(c as VTTCue).text).join(' '):'')}
 const lesson=lessons[locale],ui=lesson.ui,scene=lesson.scenes[part];
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=lesson.dir;document.title=`${lesson.subtitle} · Masaarat`;const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(null,'',url)},[locale]);
 useEffect(()=>{try{localStorage.setItem(`soil-pilot:${locale}`,JSON.stringify(state))}catch{}},[state,locale]);
 useEffect(()=>{fetch(`${import.meta.env.BASE_URL}media/index.json`).then(r=>r.ok?r.json():[]).then(setMedia).catch(()=>{})},[]);
 function changeLocale(loc:string){setCaptionText('');setLocale(loc);setState(readState(loc));setReply(undefined);setQuery('');setMapMessage('')}
 function update(key:string,value:any){setState((s:any)=>({...s,[key]:value}))}
 function move(i:number){setPart(i);update('visited',[...new Set([...(state.visited||[]),i])])}
 function choosePoint(id:number){setMapMessage('');const points=state.points||[];update('points',points.includes(id)?points.filter((x:number)=>x!==id):[...points,id])}
 function ask(text:string){setQuery(text);setReply(retrieve(lesson,text))}
 function download(){const record={lessonId:lesson.lessonId,locale,recordedAt:new Date().toISOString(),status:'self-recorded; requires trainer verification',observations:lesson.checklist.map((item:string,i:number)=>({item,status:(state.observed||{})[i]||'not-observed'})),notes:state.notes||''};const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SOIL-PILOT-01-${locale}-practice.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <div className="app">
  <header className="header"><a href="#main" className="brand" aria-label="Masaarat"><img src={logo} alt="Masaarat"/></a><span className="review-badge">{ui.review}</span><label className="locale"><span aria-hidden="true">◎</span><select aria-label="Language / اللغة" value={locale} onChange={e=>changeLocale(e.target.value)}>{Object.values(lessons).map((l:any)=><option key={l.locale} value={l.locale}>{l.name}</option>)}</select></label></header>
  <main id="main">
   <section className="hero"><div className="hero-copy"><p className="eyebrow">{lesson.eyebrow}</p><h1>{lesson.title}</h1><p className="subtitle">{lesson.subtitle}</p><p className="goal">{lesson.goal}</p><div className="hero-actions"><button className="primary" onClick={()=>{setTab('learn');document.getElementById('workbench')?.scrollIntoView({behavior:'smooth'})}}>{ui.begin}<span aria-hidden="true">↗</span></button><span className="time">◷ {ui.minutes}</span></div></div><div className="hero-art" aria-hidden="true"><span className="art-marker">01 / SOIL</span><Diagram kind="purpose" labels={lesson.scenes[0].labels} locale={locale} photo={soilCore}/><div className="art-bottom">{lesson.scenes[0].takeaway}</div></div></section>
   <section className="brief"><span className="brief-icon" aria-hidden="true">⌁</span><div><h2>{ui.protocol}</h2><p>{ui.protocolText}</p></div></section>
   <section id="workbench" className="workbench"><nav className="tabs" aria-label={lesson.subtitle}>{tabs.map((name,i)=><button key={name} className={tab===name?'active':''} aria-current={tab===name?'page':undefined} onClick={()=>setTab(name)}><span className="tab-index">0{i+1}</span>{ui[name]}</button>)}</nav>
   {tab==='learn'&&<div className="lesson-grid"><aside className="contents">{lesson.scenes.map((s:any,i:number)=><button key={s.id} className={part===i?'current':''} aria-current={part===i?'step':undefined} onClick={()=>move(i)}><span>{String(i+1).padStart(2,'0')}</span>{s.title}</button>)}<div className="study-note">↺<p>{ui.revisit}</p></div></aside><article className="lesson-body">
    <div className="section-line"><span>{ui.step} {part+1} {ui.of} 8</span><span>{lesson.scenes[part].labels[0]}</span></div>
    {part===0&&<section className="video-card"><h3>{ui.watch}</h3>{media.includes(locale)?<><video key={locale} controls preload="metadata" playsInline onLoadedMetadata={()=>setCaptionText('')} onTimeUpdate={syncCaption} onSeeked={syncCaption}><source src={`${import.meta.env.BASE_URL}media/${locale}/lesson.mp4`} type="video/mp4"/><track key={`track-${locale}`} ref={element=>{if(!element||element.dataset.ready)return;element.dataset.ready="true";const prepare=()=>{element.track.mode="hidden"};element.addEventListener("load",prepare,{once:true});if(element.readyState===2)prepare()}} default kind="captions" src={`${import.meta.env.BASE_URL}media/${locale}/captions.vtt`} srcLang={locale} label={lesson.name}/></video><p className="video-caption" aria-live="off">{captionText}</p><details><summary>{ui.listen}</summary><audio controls preload="none" src={`${import.meta.env.BASE_URL}media/${locale}/master.wav`}/><a download href={`${import.meta.env.BASE_URL}media/${locale}/transcript.txt`}>{ui.captions}</a></details></>:<p className="muted">{ui.videoPending}</p>}</section>}
    <h2>{scene.title}</h2><p className="lead">{scene.lead}</p><div className={`diagram-panel ${sceneArtwork(scene.id)?'dimensional':''}`}><Diagram kind={scene.id} labels={scene.labels} locale={locale} photo={sceneArtwork(scene.id)}/></div><p>{scene.example}</p><blockquote>{scene.takeaway}</blockquote><details className="transcript"><summary>{ui.read}</summary><p>{scene.narration}</p></details><div className="pager"><button disabled={part===0} onClick={()=>move(part-1)}>{ui.prev}</button>{part<7?<button className="primary" onClick={()=>move(part+1)}>{ui.next}</button>:<button className="primary" onClick={()=>setTab('practice')}>{ui.practice}</button>}</div>
   </article></div>}
   {tab==='practice'&&<section className="panel"><p className="eyebrow">02 / A</p><h2>{ui.mapTitle}</h2><p className="panel-intro">{ui.mapText}</p><div className="planner" role="group" aria-label={ui.mapLabel}>{fieldPoints.map((p:any)=><button key={p.id} className={`point ${p.excluded||''} ${(state.points||[]).includes(p.id)?'chosen':''}`} aria-label={`${ui.point} ${p.id+1}${p.excluded?' · '+ui[p.excluded]:''}`} aria-pressed={(state.points||[]).includes(p.id)} onClick={()=>choosePoint(p.id)}><span>{p.excluded==='wet'?'≈':p.excluded==='manure'?'▧':String(p.id+1).padStart(2,'0')}</span>{p.excluded&&<small>{ui[p.excluded]}</small>}</button>)}</div><div className="planner-actions"><span>{(state.points||[]).length} / 4 {ui.selected}</span><button onClick={()=>{update('points',[]);setMapMessage('')}}>{ui.reset}</button><button className="primary" onClick={()=>setMapMessage(checkPlan(state.points||[])?'ok':'bad')}>{ui.validate}</button></div>{mapMessage&&<div role="status" className={`feedback ${mapMessage==='ok'?'good':''}`}>{mapMessage==='ok'?ui.mapOk:ui.mapBad}</div>}</section>}
   {tab==='check'&&<section className="panel"><p className="eyebrow">03 / {ui.qLabel}</p><h2>{ui.check}</h2><p className="panel-intro">{ui.quizIntro}</p><div className="quiz-list">{lesson.quiz.map((q:any,i:number)=><fieldset key={q.id}><legend><span>{i+1}.</span> {q.question}</legend>{q.options.map((option:string,k:number)=><label key={k} className="option"><input type="radio" name={q.id} checked={(state.answers||{})[q.id]===k} onChange={()=>update('answers',{...(state.answers||{}),[q.id]:k})}/><span>{option}</span></label>)}{(state.answers||{})[q.id]!==undefined&&<div className={`feedback ${(state.answers||{})[q.id]===q.answer?'good':''}`} role="status"><strong>{(state.answers||{})[q.id]===q.answer?ui.correct:ui.retry}</strong><p>{q.explanation}</p></div>}</fieldset>)}</div><p className="muted">{Object.keys(state.answers||{}).length} / 4 {ui.results}</p></section>}
   {tab==='field'&&<section className="panel"><p className="eyebrow">04 / {ui.field}</p><h2>{ui.checklist}</h2><p className="panel-intro">{ui.practicalIntro}</p><div className="rubric">{lesson.checklist.map((item:string,i:number)=><div key={i}><label htmlFor={`obs-${i}`}><span>{i+1}</span>{item}</label><select id={`obs-${i}`} value={(state.observed||{})[i]||'not-observed'} onChange={e=>update('observed',{...(state.observed||{}),[i]:e.target.value})}><option value="not-observed">{ui.notObserved}</option><option value="observed">{ui.observed}</option><option value="needs-practice">{ui.needsPractice}</option></select></div>)}</div><label className="notes-label" htmlFor="notes">{ui.notes}</label><textarea id="notes" rows={5} placeholder={ui.notesHint} value={state.notes||''} onChange={e=>update('notes',e.target.value)}/><div className="planner-actions"><button className="primary" onClick={download}>{ui.download} ↓</button><span className="muted">{ui.saved}</span></div></section>}
   {tab==='assistant'&&<section className="panel guide"><p className="eyebrow">05 / {ui.assistant}</p><h2>{ui.ask}</h2><p className="panel-intro">{ui.guideInfo}</p><form onSubmit={e=>{e.preventDefault();ask(query)}}><label className="sr-only" htmlFor="query">{ui.ask}</label><input id="query" value={query} onChange={e=>setQuery(e.target.value)} placeholder={ui.askHint} maxLength={500}/><button className="primary">{ui.askButton}</button></form><div className="faq">{lesson.faq.map(([q,id]:string[])=><button key={id} onClick={()=>{setQuery(q);setReply(lesson.scenes.find((s:any)=>s.id===id))}}>{q} ↗</button>)}</div>{reply!==undefined&&<div className="guide-reply" role="status">{reply?<><h3>{reply.title}</h3><p>{reply.lead}</p><p>{reply.example}</p><button onClick={()=>{setTab('learn');move(lesson.scenes.findIndex((s:any)=>s.id===reply.id))}}>{ui.read} ↗</button></>:<p>{ui.noAnswer}</p>}</div>}</section>}
   {tab==='glossary'&&<section className="panel"><p className="eyebrow">06 / {ui.glossary}</p><h2>{ui.terms}</h2><dl className="glossary">{lesson.glossary.map(([term,definition]:string[])=><div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl></section>}
   </section><section className="closing"><span aria-hidden="true">✳</span><div><h2>{ui.complete}</h2><p>{ui.revisit}</p></div></section>
   <footer><details><summary>{ui.sources}</summary><ul>{references.filter(r=>['UMD-SOIL','ILO-CBT','FAO-ELEARNING','IES-PRACTICE','CAST-UDL'].includes(r.id)).map(r=><li key={r.id}><a href={r.url} target="_blank" rel="noreferrer">{r.organization} · {r.title}</a></li>)}</ul></details><span>Masaarat · SOIL-PILOT-01</span></footer>
  </main>
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
