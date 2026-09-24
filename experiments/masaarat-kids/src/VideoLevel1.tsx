import React from 'react';
import {AbsoluteFill,Audio,Composition,Img,Sequence,registerRoot,staticFile,useCurrentFrame,interpolate} from 'remotion';
import videoData from '../content/level1-video.json';
import advancedData from '../content/advanced-video.json';
import {Mentor} from './Mentor';
import {VideoVisual} from './VideoVisual';
type Locale='ar-EG'|'ar-MSA'|'ar-Gulf'|'en';
type Timing={frames:number;audio?:string};
type Props={level:number;lesson:number;locale:Locale;timings:Timing[]};
const source={...videoData,...advancedData} as Record<string,{title:string;scenes:{title:string;display:string;narration:string}[]}>;
const key=(level:number,lesson:number,locale:Locale)=>(level===1?'':level+'/')+String(lesson).padStart(2,'0')+'/'+locale;
const shades=['#DCEFE3','#E8E0F2','#FBF1D6','#E4F0F7','#FAE8DF'];
const fontFace='@font-face{font-family:Cairo;src:url("'+staticFile('fonts/Cairo.ttf')+'")}';
function Scene({level,lesson,locale,index}:{level:number;lesson:number;locale:Locale;index:number}){
 const frame=useCurrentFrame(),data=source[key(level,lesson,locale)],scene=data.scenes[index],rtl=locale!=='en';
 const enter=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'}),rise=interpolate(frame,[0,14],[24,0],{extrapolateRight:'clamp'});
 const color=shades[(lesson+index)%shades.length],isIntro=index===0,isPractice=index===5,isFinish=index===6;
 return <AbsoluteFill style={{fontFamily:'Cairo',direction:rtl?'rtl':'ltr',color:'#253C50',background:'radial-gradient(at 0% 0%,#DFF3E8,transparent 60%),radial-gradient(at 100% 0%,#F7E6E9,transparent 55%),linear-gradient(#FAFCFF,#FFFBEF)'}}>
 <style>{fontFace}</style>
 <header style={{position:'absolute',top:20,left:52,right:52,display:'flex',justifyContent:'space-between',alignItems:'center'}}><strong style={{fontSize:25}}>{locale==='en'?'Masaarat Kids':'مسارات كيدز'}</strong><Img src={staticFile('brand/logo.png')} style={{width:155,height:74,objectFit:'contain'}}/></header>
 <div style={{position:'absolute',top:94,left:55,right:55,textAlign:'center',fontSize:20,color:'#647D88'}}>{data.title}</div>
 {scene.title!==scene.display&&<h1 style={{position:'absolute',top:139,left:55,right:55,textAlign:'center',fontSize:35,margin:0,lineHeight:1.3}}>{scene.title}</h1>}
 <div style={{position:'absolute',top:225,left:67,right:67,bottom:100,display:'flex',alignItems:'center',gap:35,opacity:enter,transform:'translateY('+rise+'px)'}}>
 <div style={{width:325,display:'grid',placeItems:'center'}}><Mentor size={275} frame={frame} pose={isFinish?'wave':'idle'}/></div>
 <div style={{flex:1,height:320,border:'2px solid #D4E0E7',borderRadius:29,background:'#FFFFFFdd',padding:'14px 30px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}>
 <VideoVisual lesson={lesson} index={index} frame={frame}/>
 <div style={{fontSize:isIntro?32:29,fontWeight:800,lineHeight:1.45,marginTop:8}}>{scene.display}</div>
 </div></div>
 <div style={{position:'absolute',bottom:29,left:60,right:60,height:6,borderRadius:6,background:'#DBE5E4'}}><div style={{width:((index+1)/7*100)+'%',height:'100%',borderRadius:6,background:'#82C39E'}}/></div>
 </AbsoluteFill>;
}
function Video({level,lesson,locale,timings}:Props){let cursor=0;return <AbsoluteFill>{timings.map((t,i)=>{const start=cursor;cursor+=t.frames;return <Sequence key={i} from={start} durationInFrames={t.frames}><Scene level={level} lesson={lesson} locale={locale} index={i}/>{t.audio&&<Audio src={staticFile(t.audio)}/>}</Sequence>})}</AbsoluteFill>}
function Root(){return <>{[1,2,3].flatMap(level=>Array.from({length:level===1?11:12},(_,i)=>i+(level===1?2:1)).flatMap(lesson=>(['ar-EG','ar-MSA','ar-Gulf','en'] as Locale[]).map(locale=><Composition key={level+'-'+lesson+'-'+locale} id={'kids-l'+level+'-'+String(lesson).padStart(2,'0')+'-'+locale} component={Video} width={1280} height={720} fps={24} durationInFrames={672} defaultProps={{level,lesson,locale,timings:source[key(level,lesson,locale)].scenes.map(()=>({frames:96})),}} calculateMetadata={({props})=>({durationInFrames:props.timings.reduce((s,t)=>s+t.frames,0)})}/>)))}</>}
registerRoot(Root);
