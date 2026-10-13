import React from 'react';
import {AbsoluteFill,Composition,Img,Sequence,interpolate,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {brand} from '../../../experiments/course-pipeline/src/brand';
type Scene={id:string;title:string;lead:string;labels:string[];startFrame:number;durationInFrames:number};
type Props={locale:string;dir:string;title:string;scenes:Scene[];durationInFrames:number;visuals:Record<string,string>};
function SceneView({scene,index,total,visual,dir}:{scene:Scene;index:number;total:number;visual?:string;dir:string}){
 const f=useCurrentFrame();const progress=Math.min(1,f/Math.max(90,scene.durationInFrames*.75));
 const fade=interpolate(f,[0,15],[0,1],{extrapolateRight:'clamp'});
 const size=scene.title.length>80?45:scene.title.length>55?51:60;
 return <AbsoluteFill style={{background:brand.background,color:brand.foreground,fontFamily:'Cairo, sans-serif',direction:dir as 'rtl'|'ltr'}}>
  <style>{"@font-face{font-family:Cairo;src:url('"+staticFile('course-pipeline/Cairo.ttf')+"');font-weight:200 1000;font-display:block}"}</style>
  <div style={{position:'absolute',left:80,right:80,top:35,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
   <Img src={staticFile('course-pipeline/logo.png')} style={{width:180,height:75,objectFit:'contain'}}/>
   <span style={{fontSize:25,direction:'ltr'}}>{index+1} / {total}</span>
  </div>
  <h1 style={{position:'absolute',left:100,right:100,top:115,margin:0,textAlign:'center',fontSize:size,lineHeight:1.35,fontWeight:800}}>{scene.title}</h1>
  <div style={{position:'absolute',top:215,left:320,width:1280,height:650,opacity:fade,transform:'scale('+(1+progress*.018)+')'}}>
   {visual?<Img src={staticFile(visual)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:
    <div style={{padding:90,fontSize:40,lineHeight:1.8,textAlign:'center'}}>{scene.lead}</div>}
  </div>
  <div style={{position:'absolute',left:90,right:90,bottom:100,display:'flex',gap:24}}>
   {scene.labels.map((label,i)=><div key={i} style={{flex:1,padding:'17px 22px',borderRadius:18,border:'2px solid '+brand.border,background:brand.card,fontSize:label.length>50?25:30,fontWeight:700,textAlign:'center',lineHeight:1.45,opacity:Math.max(0,Math.min(1,(progress-i*.23)*6))}}>{label}</div>)}
  </div>
  <div style={{position:'absolute',bottom:48,left:100,right:100,height:7,background:brand['pastel-blue'],borderRadius:8}}>
   <div style={{height:7,width:(100*f/scene.durationInFrames)+'%',background:brand.primary,borderRadius:8}}/>
  </div>
 </AbsoluteFill>
}
function Lesson(p:Props){return <AbsoluteFill>{p.scenes.map((s,i)=><Sequence key={s.id} from={s.startFrame} durationInFrames={s.durationInFrames}><SceneView scene={s} index={i} total={p.scenes.length} visual={p.visuals[s.id]} dir={p.dir}/></Sequence>)}</AbsoluteFill>}
const defaults:Props={locale:'en',dir:'ltr',title:'',scenes:[],durationInFrames:30,visuals:{}};
registerRoot(()=> <Composition id="CoursePilot" component={Lesson} width={1920} height={1080} fps={30} durationInFrames={30} defaultProps={defaults} calculateMetadata={({props})=>({durationInFrames:props.durationInFrames})}/>);
