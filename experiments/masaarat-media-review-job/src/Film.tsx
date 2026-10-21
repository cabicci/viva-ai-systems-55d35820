import React,{useEffect,useRef,useState} from 'react';
import {stage} from './nativeStage';
import './film.css';
const cues=[
 [0,2.02,'01','قبل الاستخدام','الفحص أول خطوة','جهّز الأداة للفحص'],
 [2.02,3.18,'01','افحص المقبض','بص على المقبض','حدّد الجزء اللي هتمسكه'],
 [3.18,4.94,'01','ثبات المقبض','اتأكد إنه ثابت','افحص الوصلة قبل الاستخدام'],
 [4.94,8.52,'01','الجزء المستخدم','سليم ونضيف','افحص الجزء المعدني'],
 [8.52,9.58,'02','لو ظهر عيب','وقّف الاستخدام','مثال توضيحي: وصلة غير ثابتة'],
 [9.58,10.6,'02','بلّغ المدرّب','اطلب المراجعة','ما تحاولش تستخدم الأداة المعيبة'],
 [10.6,12.433333333333334,'02','اعزل الأداة','ما تستخدمهاش','خلّيها منفصلة عن الأدوات السليمة'],
 [12.433333333333334,14.213333333333333,'03','وقت الحمل','راقب اتجاه الأداة','توضيح اتجاه الأداة أثناء الحمل'],
 [14.213333333333333,16.313333333333333,'03','الطرف الحاد','لتحت','انتبه للطرف الحاد'],
 [16.313333333333333,18.03333333333333,'03','الناس حواليك','بعيد عن الآخرين','اتأكد إن مسار الحمل خالي'],
 [18.03333333333333,19.833333333333336,'03','مساحة آمنة','سيب مسافة حواليك','الدائرة توضيحية؛ مش قياس لمسافة محددة'],
 [19.833333333333336,23.234,'03','توجيه المدرّب','اتّبع الطريقة المحددة','المدرّب يوضح طريقة الحمل الفعلية'],
] as const;
export default function Film(){
 const host=useRef<HTMLDivElement>(null),sref=useRef<any>(null),audio=useRef<HTMLAudioElement>(null),timeline=useRef<any>(null);const [time,setTime]=useState(0),[ready,setReady]=useState(false),[err,setErr]=useState('');
 const capturing=new URLSearchParams(location.search).has('capture');
 useEffect(()=>{let live=true,active:any,raf=0;Promise.all([stage(host.current!,'tools',{width:1360,height:820,pixelRatio:1,film:true}),fetch('/accepted-tools-timeline.json').then(r=>r.json())]).then(([s,t])=>{if(!live){s.dispose();return}active=s;sref.current=s;timeline.current=t;s.setTime(0);(window as any).film={setTime:(seconds:number)=>{s.setTime(seconds);setTime(seconds)},duration:697/30};setReady(true);(window as any).filmReady=true;if(!capturing){const tick=()=>{const n=audio.current?.currentTime||0;s.setTime(n);setTime(n);raf=requestAnimationFrame(tick)};tick();}}).catch(e=>setErr(String(e)));return()=>{live=false;cancelAnimationFrame(raf);active?.dispose()}},[]);
 const cue=cues.find(c=>time>=c[0]&&time<c[1])||cues[0];const caption=timeline.current?.captions.find((c:any)=>time>=c.start&&time<c.end)?.text||'';const reveal=Math.min(1,Math.max(0,(time-cue[0])/.18));
 return <main className={'film-page '+(capturing?'capture':'')}><div className="film-frame" id="film-frame">
  <header className="film-header"><img src="/brand/logo.png" alt="مسارات"/><div dir="rtl"><b>قبل ما تبدأ الشغل</b><span>فحص الأدوات والحمل الآمن</span></div><small>تعليم فني · تدريب عملي</small></header>
  <div ref={host} className="film-objects"/>
  <aside className={'film-card '+(cue[2]==='02'?'caution':'')} dir="rtl"><div className="film-number">{cue[2]}</div><div className="film-card-copy" style={{opacity:reveal,transform:`translateY(${(1-reveal)*12}px)`}}><span>{cue[3]}</span><h1>{cue[4]}</h1><p>{cue[5]}</p></div><div className="film-step-dots">{['01','02','03'].map(n=><i key={n} className={cue[2]===n?'active':''}/>)}</div></aside>
  {time>=9.58&&time<10.6&&<div className="film-report" dir="rtl">بلّغ المدرّب <span>↗</span></div>}
  {time>=16.313333333333333&&time<19.833333333333336&&<div className="film-people" aria-label="اتجاه وجود الآخرين"><svg viewBox="0 0 110 110"><circle cx="38" cy="27" r="10"/><path d="M20 82V56a18 18 0 0 1 36 0v26M38 68v28M69 45a13 13 0 0 1 24 7v30" fill="none" stroke="currentColor" strokeWidth="5"/><circle cx="80" cy="27" r="8"/></svg><span dir="rtl">الآخرون</span></div>}
  <div className="film-caption" dir="rtl" style={{visibility:caption?'visible':'hidden'}}>{caption||' '}</div>
  <div className="film-progress"><i style={{width:`${time/(697/30)*100}%`}}/></div>
 </div>{!capturing&&<div className="film-player" dir="rtl"><p>عينة حركة بالعناصر المعتمدة — راجع الإجراء والصوت قبل التعميم.</p><audio ref={audio} controls preload="auto" src="/audio/accepted-tools-ar-EG.wav" onPlay={()=>{if(!ready)audio.current?.pause()}}/>{!ready&&!err&&<p>تحميل العناصر…</p>}{err&&<pre>{err}</pre>}</div>}</main>
}
