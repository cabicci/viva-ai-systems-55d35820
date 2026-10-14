import React,{useEffect,useState} from 'react';

type MediaIndex={locales:string[];illustrations:string[]};
const empty:MediaIndex={locales:[],illustrations:[]};
export function useMedia(){
 const [media,setMedia]=useState<MediaIndex>(empty);
 useEffect(()=>{let active=true;fetch('./media/index.json',{cache:'no-store'})
  .then(r=>r.ok?r.json():empty)
  .then(d=>{if(active)setMedia({locales:Array.isArray(d.locales)?d.locales:[],illustrations:Array.isArray(d.illustrations)?d.illustrations:[]})})
  .catch(()=>{if(active)setMedia(empty)});
  return()=>{active=false};
 },[]);
 return media;
}
export function LessonVideo({p,available}:{p:any;available:boolean}){
 return <section className="video-panel"><h2>{p.ui.video}</h2>{available?
  <video key={p.locale} controls playsInline preload="metadata" aria-label={p.title}>
   <source src={`./media/${p.locale}/lesson.mp4`} type="video/mp4"/>
   <track kind="captions" src={`./media/${p.locale}/captions.vtt`} srcLang={p.locale} label={p.name} default/>
  </video>:<p>{p.ui.videoPending}</p>}</section>;
}
export function LessonIllustration({id,p,available}:{id:string;p:any;available:string[]}){
 const name=id==='site'?'s101-lesson-route':id==='chemical'?'s101-lesson-gloves':null;
 if(!name||!available.includes(name))return null;
 const ex=p.examples[id==='site'?0:1];
 return <figure className="lesson-illustration"><img src={`./media/illustrations/${name}.png`} alt={`${ex.title}. ${ex.situation}`} loading="lazy"/><figcaption>{ex.takeaway}</figcaption></figure>;
}
