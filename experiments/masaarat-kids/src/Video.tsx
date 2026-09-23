import React from "react";
import {AbsoluteFill,Audio,Composition,Img,Sequence,registerRoot,staticFile,useCurrentFrame} from "remotion";
import {getLesson,locales,type Locale} from "./data";
import {Mentor} from "./Mentor";
type Timing={frames:number;audio?:string};
export type VideoProps={locale:Locale;timings:Timing[];preview:boolean};
const colours:Record<string,string>={mint:"#DCEFE3",lavender:"#E8E0F2",peach:"#F9DECF",yellow:"#FBF1D6"};
const fontFace='@font-face{font-family:Cairo;src:url("'+staticFile("fonts/Cairo.ttf")+'")}';
function Scene({locale,index,preview}:{locale:Locale;index:number;preview:boolean}) {
 const frame=useCurrentFrame(),lesson=getLesson(locale),scene=lesson.scenes[index],rtl=lesson.direction==="rtl";
 const entrance=Math.min(1,frame/16),label=index+1<10?"0"+(index+1):String(index+1);
 return <AbsoluteFill style={{fontFamily:"Cairo",color:"#2A2620",background:"linear-gradient(135deg,#EAF5FF 0%,#DCEFE3 30%,#E8E0F2 65%,#FBF1D6 100%)",direction:rtl?"rtl":"ltr"}}>
 <style>{fontFace}</style>
 <div style={{position:"absolute",top:35,left:54,right:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
 <div style={{display:"flex",alignItems:"center",gap:20}}><Img src={staticFile("brand/logo.png")} style={{width:140,height:62,objectFit:"contain"}}/><span style={{fontSize:22,fontWeight:800}}>{lesson.labels.brand}</span></div>
 <span style={{fontSize:18,color:"#5C544A"}}>{lesson.labels.level}</span></div>
 <div style={{position:"absolute",top:135,left:58,right:58,bottom:80,display:"flex",alignItems:"center",gap:30}}>
 <div style={{width:270,flexShrink:0,transform:"translateY("+((1-entrance)*20)+"px)",opacity:entrance}}><Mentor frame={frame} pose={index>1?"point":"wave"} size={260}/></div>
 <div style={{flex:1,minWidth:0,background:"rgba(255,255,255,.8)",border:"1px solid #ffffff",borderRadius:32,padding:"28px 34px",boxShadow:"0 20px 60px #384F6110",opacity:entrance,transform:"translateY("+((1-entrance)*18)+"px)"}}>
 <div style={{fontSize:17,color:"#5C544A",marginBottom:8}}>{label} / 12</div>
 <h1 style={{fontSize:37,lineHeight:1.5,margin:"0 0 18px",fontWeight:900}}>{scene.title}</h1>
 <div style={{borderRadius:20,background:colours[scene.accent],padding:"20px 24px",fontSize:30,fontWeight:700,lineHeight:1.6}}>{scene.display}</div>
 {index===6&&<p style={{fontSize:23,lineHeight:1.7,margin:"16px 0 0"}}>{lesson.prompt.combined}</p>}
 {index===7&&<><p style={{fontSize:21,lineHeight:1.7,margin:"14px 0 0"}}>{lesson.prompt.mismatch}</p><span style={{fontSize:15,color:"#5C544A"}}>{lesson.labels.model}</span></>}
 {index===10&&<p style={{fontSize:20,margin:"14px 0 0"}}>{lesson.labels.pause}</p>}
 </div></div>
 <div style={{position:"absolute",bottom:28,left:60,right:60,display:"flex",alignItems:"center",gap:18}}>
 <div style={{flex:1,height:5,background:"#ffffff88",borderRadius:9}}><div style={{height:"100%",width:((index+1)/12*100)+"%",background:"#5DA980",borderRadius:9}}/></div>
 <span style={{fontSize:14,maxWidth:520,color:"#5C544A"}}>{preview?lesson.labels.audioPending:lesson.labels.brand}</span></div>
 </AbsoluteFill>;
}
export function KidsVideo({locale,timings,preview}:VideoProps) {
 let from=0;return <AbsoluteFill>{timings.map((timing,index)=>{const start=from;from+=timing.frames;return <Sequence key={index} from={start} durationInFrames={timing.frames}><Scene locale={locale} index={index} preview={preview}/>{timing.audio&&<Audio src={staticFile(timing.audio)}/>}</Sequence>;})}</AbsoluteFill>;
}
export function Root(){return <>{locales.map(locale=><Composition key={locale} id={"kids-"+locale} component={KidsVideo} width={1280} height={720} fps={24} durationInFrames={12*96} defaultProps={{locale,timings:getLesson(locale).scenes.map(()=>({frames:96})),preview:true}} calculateMetadata={({props})=>({durationInFrames:props.timings.reduce((n,t)=>n+t.frames,0)})}/>)}</>}
registerRoot(Root);
