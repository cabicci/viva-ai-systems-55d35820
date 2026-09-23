import React from "react";
import {AbsoluteFill,Audio,Composition,Img,Sequence,registerRoot,staticFile,useCurrentFrame,interpolate} from "remotion";
import {getLesson,locales,type Locale} from "./data";
import {Mentor} from "./Mentor";
import {Explorer} from "./Explorer";
type Timing={frames:number;audio?:string};
export type VideoProps={locale:Locale;timings:Timing[];preview:boolean};
const fontFace='@font-face{font-family:Cairo;src:url("'+staticFile("fonts/Cairo.ttf")+'")}';
function Scene({locale,index}:{locale:Locale;index:number}){
 const frame=useCurrentFrame(),l=getLesson(locale),s=l.scenes[index],v=l.illustration;
 const enter=interpolate(frame,[0,12],[0,1],{extrapolateRight:"clamp"}),tiles=index>=3&&index<=6,review=index===7,fix=index===8;
 return <AbsoluteFill style={{fontFamily:"Cairo",color:"#253C50",direction:l.direction as "rtl"|"ltr",background:"radial-gradient(at 0% 0%,#DFF3E8,transparent 60%),radial-gradient(at 100% 0%,#F7E6E9,transparent 55%),linear-gradient(#FAFCFF,#FFFBEF)"}}>
 <style>{fontFace}</style>
 <header style={{position:"absolute",top:28,left:48,right:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}><strong style={{fontSize:25}}>{l.labels.brand}</strong><Img src={staticFile("brand/logo.png")} style={{width:170,height:76,objectFit:"contain"}}/></header>
 <h1 style={{position:"absolute",top:106,left:55,right:55,margin:0,fontSize:41,textAlign:"center",fontWeight:900}}>{s.title}</h1>
 <div style={{position:"absolute",top:195,left:55,right:55,bottom:95,display:"flex",alignItems:"center",justifyContent:"center",gap:32,opacity:enter,transform:"translateY("+((1-enter)*18)+"px)"}}>
 {tiles?<div style={{width:"100%"}}>
 <div style={{display:"flex",gap:22}}>{v.heads.map((h,i)=>{const active=index===6||index===i+3;return <div key={h} style={{flex:1,padding:"22px 16px",borderRadius:25,border:"2px solid "+(active?"#82C39E":"#D4DEE4"),background:active?"#FFFFFF":"#F5F7F7",opacity:active?1:.55,textAlign:"center",transform:"scale("+(active?1:.95)+")"}}>
 <strong style={{fontSize:26}}>{h}</strong><div style={{height:155,display:"grid",placeItems:"center"}}>{i===0?<Explorer size={180} frame={frame}/>:i===1?<div style={{color:"#86BCE1",fontSize:62}}>● <span style={{color:"#A797C8"}}>◆</span></div>:<div style={{fontSize:64,color:"#82A98D"}}>3</div>}</div>
 <div style={{fontSize:23,lineHeight:1.6}}>{v.texts[i]}</div></div>})}</div>
 {index===6&&<p style={{margin:"18px 8px 0",fontSize:23,textAlign:"center",lineHeight:1.65}}>{l.prompt.combined}</p>}</div>:
 <><div style={{width:330,textAlign:"center"}}>{index===9||index>=10?<Mentor size={260} frame={frame} pose="wave"/>:<Explorer size={330} frame={frame} wrong={review}/>}</div>
 <div style={{flex:1,maxWidth:720,background:"#FFFFFFdd",border:"2px solid #D4E0E7",borderRadius:28,padding:"28px 30px"}}>
 <div style={{fontSize:34,fontWeight:800,lineHeight:1.6}}>{s.display}</div>
 {(review||fix)&&<div style={{marginTop:20}}>{Array.from({length:review?5:3},(_,i)=><div key={i} style={{display:"flex",gap:15,alignItems:"center",margin:"11px 0"}}><span style={{fontSize:22,color:review?"#AA6157":"#528767"}}>{i+1}</span><span style={{height:10,width:(78-i%2*17)+"%",background:review?"#E7B6AE":"#A2CEB1",borderRadius:6}}/></div>)}<small style={{fontSize:16}}>{l.labels.model}</small></div>}
 {index===10&&<p style={{fontSize:23,color:"#627180"}}>{l.labels.pause}</p>}
 {index===2&&<div style={{fontSize:65,color:"#A797C8",textAlign:"center",transform:"scale("+(1+Math.sin(frame/14)*.04)+")"}}>?</div>}
 </div></>}
 </div><div style={{position:"absolute",bottom:35,left:60,right:60,height:6,background:"#DBE5E4",borderRadius:8}}><div style={{height:"100%",width:((index+1)/12*100)+"%",background:"#82C39E",borderRadius:8}}/></div>
 </AbsoluteFill>;
}
export function KidsVideo({locale,timings}:VideoProps){let from=0;return <AbsoluteFill>{timings.map((t,index)=>{const start=from;from+=t.frames;return <Sequence key={index} from={start} durationInFrames={t.frames}><Scene locale={locale} index={index}/>{t.audio&&<Audio src={staticFile(t.audio)}/>}</Sequence>})}</AbsoluteFill>}
export function Root(){return <>{locales.map(locale=><Composition key={locale} id={"kids-"+locale} component={KidsVideo} width={1280} height={720} fps={24} durationInFrames={12*96} defaultProps={{locale,timings:getLesson(locale).scenes.map(()=>({frames:96})),preview:true}} calculateMetadata={({props})=>({durationInFrames:props.timings.reduce((n,t)=>n+t.frames,0)})}/>)}</>}
registerRoot(Root);
